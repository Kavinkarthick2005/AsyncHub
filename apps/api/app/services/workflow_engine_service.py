from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from app.models.workflow import Workflow, WorkflowExecution, WorkflowExecutionStatus
from app.models.job import Job, JobEvent
from app.schemas.job import JobCreate
from app.services.job_service import JobService
from app.repositories.job_repository import JobRepository
from app.repositories.queue_repository import QueueRepository

class WorkflowEngineService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.job_service = JobService(session)
        self.job_repo = JobRepository(session)
        self.queue_repo = QueueRepository(session)

    def _build_in_memory_graph(self, definition: Dict[str, Any]):
        """Build an optimized in-memory DAG structure"""
        nodes = definition.get("nodes", [])
        edges = definition.get("edges", [])
        
        graph = {
            "parents": {node["id"]: [] for node in nodes},
            "children": {node["id"]: [] for node in nodes},
            "indegree": {node["id"]: 0 for node in nodes},
            "nodes_map": {node["id"]: node for node in nodes}
        }
        
        for edge in edges:
            src = edge.get("source")
            tgt = edge.get("target")
            if src in graph["nodes_map"] and tgt in graph["nodes_map"]:
                graph["parents"][tgt].append(src)
                graph["children"][src].append(tgt)
                graph["indegree"][tgt] += 1
                
        return graph

    async def trigger_workflow(self, workflow_id: UUID, payload: Dict[str, Any], user_id: UUID) -> WorkflowExecution:
        # Get Workflow
        result = await self.session.execute(select(Workflow).filter(Workflow.id == workflow_id))
        workflow = result.scalar_one_or_none()
        if not workflow:
            raise ValueError("Workflow not found")
            
        if workflow.status != "valid":
            raise ValueError(f"Cannot execute workflow in status '{workflow.status}'")

        definition = workflow.definition
        graph = self._build_in_memory_graph(definition)
        
        # Initialize state
        nodes = definition.get("nodes", [])
        initial_state = {
            "completed": [],
            "running": [],
            "failed": [],
            "waiting": []
        }
        
        root_nodes = []
        for node in nodes:
            node_id = node["id"]
            if graph["indegree"][node_id] == 0:
                root_nodes.append(node_id)
                initial_state["running"].append(node_id)
            else:
                initial_state["waiting"].append(node_id)
                
        if not root_nodes:
            raise ValueError("Workflow has no root nodes to execute.")

        # Create Execution
        execution = WorkflowExecution(
            workflow_id=workflow_id,
            status=WorkflowExecutionStatus.RUNNING,
            trigger_payload=payload,
            current_state=initial_state
        )
        self.session.add(execution)
        await self.session.flush() # flush to get execution.id
        
        # Enqueue Root Jobs
        for node_id in root_nodes:
            await self._enqueue_node(execution, graph["nodes_map"][node_id], payload, user_id)
            
        await self.session.commit()
        await self.session.refresh(execution)
        return execution

    async def _enqueue_node(self, execution: WorkflowExecution, node: Dict[str, Any], payload: Dict[str, Any], user_id: UUID):
        node_type = node.get("type", "handler")
        data = node.get("data", {})
        
        # Determine queue name
        queue_name = data.get("queue")
        if not queue_name:
            # Fallback if somehow invalid
            raise ValueError(f"Node {node['id']} has no queue specified")
            
        # Find queue id by name in this project
        # In a real system, we'd lookup or the UI provides queue_id directly.
        # Assuming the name is unique per project for now.
        queue = await self.queue_repo.get_by_name(execution.workflow.project_id, queue_name)
        if not queue:
            raise ValueError(f"Queue '{queue_name}' not found in project")
            
        job_in = JobCreate(
            name=f"Workflow Job {node['id']} ({node_type})",
            payload=payload,
            priority=int(data.get("priority", 0))
        )
        
        # We manually create the job to attach workflow execution details
        job = Job(
            queue_id=queue.id,
            name=job_in.name,
            payload=job_in.payload,
            priority=job_in.priority,
            max_retries=job_in.max_retries,
            run_after=job_in.run_after,
            idempotency_key=job_in.idempotency_key,
            workflow_execution_id=execution.id,
            workflow_node_id=node["id"]
        )
        self.session.add(job)
        
        # Create event
        event = JobEvent(
            job_id=job.id,
            to_status="queued",
            message="Enqueued via Workflow Engine"
        )
        self.session.add(event)

    async def handle_job_completion(self, job: Job):
        """
        Called when a job's status changes to completed or failed.
        """
        if not job.workflow_execution_id or not job.workflow_node_id:
            return # Not part of a workflow
            
        if job.status not in ("completed", "failed"):
            return

        # Use SELECT FOR UPDATE to prevent race conditions during concurrent completions
        result = await self.session.execute(
            select(WorkflowExecution)
            .filter(WorkflowExecution.id == job.workflow_execution_id)
            .with_for_update()
        )
        execution = result.scalar_one_or_none()
        
        if not execution or execution.status != WorkflowExecutionStatus.RUNNING:
            return # Already finished or failed
            
        state = execution.current_state or {}
        
        # If job failed, Fail Fast
        if job.status == "failed":
            execution.status = WorkflowExecutionStatus.FAILED
            execution.completed_at = datetime.utcnow()
            
            if job.workflow_node_id in state["running"]:
                state["running"].remove(job.workflow_node_id)
            state["failed"].append(job.workflow_node_id)
            
            # Use SQLAlchemy flag modified to trigger JSONB update
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(execution, "current_state")
            await self.session.commit()
            return
            
        # Job Succeeded
        if job.workflow_node_id in state["running"]:
            state["running"].remove(job.workflow_node_id)
        if job.workflow_node_id not in state["completed"]:
            state["completed"].append(job.workflow_node_id)

        # Parse DAG
        await self.session.refresh(execution, ["workflow"])
        graph = self._build_in_memory_graph(execution.workflow.definition)
        
        children = graph["children"].get(job.workflow_node_id, [])
        for child_id in children:
            # Check if all parents are completed
            parents = graph["parents"].get(child_id, [])
            if all(p in state["completed"] for p in parents):
                # Ensure we haven't already enqueued it
                if child_id in state["waiting"]:
                    state["waiting"].remove(child_id)
                    if child_id not in state["running"] and child_id not in state["completed"]:
                        state["running"].append(child_id)
                        # We need an admin-level user id or system user for background triggers.
                        # Assuming None or specific logic. Passing None to skip auth if internal.
                        await self._enqueue_node(execution, graph["nodes_map"][child_id], execution.trigger_payload, None)
        
        # Check if entire workflow is done
        if len(state["completed"]) == len(graph["nodes_map"]):
            execution.status = WorkflowExecutionStatus.COMPLETED
            execution.completed_at = datetime.utcnow()
            
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(execution, "current_state")
        
        await self.session.commit()
