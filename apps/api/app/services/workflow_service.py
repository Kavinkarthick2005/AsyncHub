from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID
from app.models.workflow import Workflow, WorkflowStatus
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, ValidationResult

class WorkflowService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_project_workflows(self, project_id: UUID) -> List[Workflow]:
        result = await self.db.execute(select(Workflow).filter(Workflow.project_id == project_id))
        return list(result.scalars().all())

    async def get_workflow(self, workflow_id: UUID) -> Optional[Workflow]:
        result = await self.db.execute(select(Workflow).filter(Workflow.id == workflow_id))
        return result.scalar_one_or_none()

    async def create_workflow(self, project_id: UUID, workflow_in: WorkflowCreate) -> Workflow:
        workflow = Workflow(
            project_id=project_id,
            name=workflow_in.name,
            description=workflow_in.description,
            status=workflow_in.status,
            is_active=workflow_in.is_active,
            definition_version=workflow_in.definition_version,
            definition=workflow_in.definition
        )
        self.db.add(workflow)
        await self.db.commit()
        await self.db.refresh(workflow)
        return workflow

    async def update_workflow(self, workflow_id: UUID, workflow_in: WorkflowUpdate) -> Optional[Workflow]:
        workflow = await self.get_workflow(workflow_id)
        if not workflow:
            return None

        update_data = workflow_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(workflow, field, value)

        await self.db.commit()
        await self.db.refresh(workflow)
        return workflow

    async def delete_workflow(self, workflow_id: UUID) -> bool:
        workflow = await self.get_workflow(workflow_id)
        if not workflow:
            return False
        
        await self.db.delete(workflow)
        await self.db.commit()
        return True

    def validate_dag(self, definition: Dict[str, Any]) -> ValidationResult:
        errors = []
        nodes = definition.get("nodes", [])
        edges = definition.get("edges", [])

        if not nodes:
            errors.append("Workflow is empty. Add at least one node.")
            return ValidationResult(valid=False, errors=errors)

        node_ids = set()
        for node in nodes:
            node_id = node.get("id")
            if not node_id:
                errors.append("A node is missing an ID.")
                continue
            
            if node_id in node_ids:
                errors.append(f"Duplicate node ID detected: {node_id}")
            node_ids.add(node_id)
            
            # Missing config
            node_type = node.get("type")
            data = node.get("data", {})
            if node_type == "queue":
                if not data.get("queue"):
                    errors.append(f"Queue node '{node_id}' is missing queue name.")
            elif node_type == "handler":
                if not data.get("handler"):
                    errors.append(f"Handler node '{node_id}' is missing handler.")

        # Edges validation
        adj_list = {node_id: [] for node_id in node_ids}
        in_degree = {node_id: 0 for node_id in node_ids}
        
        edge_ids = set()
        for edge in edges:
            edge_id = edge.get("id")
            source = edge.get("source")
            target = edge.get("target")

            if not source or not target:
                errors.append(f"Edge '{edge_id}' is missing source or target.")
                continue

            if source not in node_ids:
                errors.append(f"Edge '{edge_id}' references missing source node '{source}'.")
            if target not in node_ids:
                errors.append(f"Edge '{edge_id}' references missing target node '{target}'.")

            if source in node_ids and target in node_ids:
                adj_list[source].append(target)
                in_degree[target] += 1
                
        # Isolated nodes
        if len(nodes) > 1:
            for node_id in node_ids:
                if in_degree[node_id] == 0 and len(adj_list[node_id]) == 0:
                    errors.append(f"Node '{node_id}' is isolated. It must be connected to other nodes.")
                    
        # Orphan edges (handled by missing source/target checks)

        # Cycle detection using Kahn's Algorithm
        queue = [u for u in node_ids if in_degree[u] == 0]
        visited_count = 0
        
        while queue:
            u = queue.pop(0)
            visited_count += 1
            for v in adj_list[u]:
                in_degree[v] -= 1
                if in_degree[v] == 0:
                    queue.append(v)
                    
        if visited_count != len(node_ids):
            errors.append("Cycle detected in the workflow graph.")

        return ValidationResult(valid=len(errors) == 0, errors=errors)
