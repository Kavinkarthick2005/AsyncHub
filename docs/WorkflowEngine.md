# Workflow Engine

The Workflow Engine extends the basic worker queueing model to support Directed Acyclic Graphs (DAGs).

## Concept
A `Workflow` contains a JSONB `definition` mapping nodes and edges.
A `WorkflowExecution` tracks a specific run of this definition.

## Execution Flow
1. **Trigger**: An execution is triggered. The engine parses the definition.
2. **Topological Sort**: It identifies "root" nodes (nodes with no incoming edges).
3. **Enqueue**: The engine enqueues jobs corresponding to these root nodes into standard Queues, attaching the `workflow_execution_id` to the Job.
4. **Resolution**: As workers finish standard jobs, a database trigger or application hook checks if the job belongs to a workflow execution. If so, the engine evaluates if downstream nodes have all their dependencies met. If yes, those downstream nodes are enqueued.
5. **Completion**: When all nodes are traversed successfully, the execution is marked `completed`. If a single node fails, the execution is marked `failed` (Fail Fast policy for v1).
