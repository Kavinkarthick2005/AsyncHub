# Database Architecture

AsyncHub relies heavily on PostgreSQL to provide a robust distributed systems backbone without introducing external message brokers.

## ER Diagram (Core)
- **Organizations**: High-level tenant isolation.
- **Users**: Bound to organizations, authenticated via JWT.
- **Projects**: Distinct boundaries within an org for API Keys and Queue namespacing.
- **Queues**: Named FIFO structures containing Jobs.
- **Workers**: Ephemeral fleet instances executing tasks. Heartbeats track their live status.
- **Jobs**: Individual units of work. Tracks retries, backoffs, status, payloads.
- **Schedules**: Cron definitions that enqueue Jobs automatically.
- **Workflows**: Directed Acyclic Graphs (JSONB definitions).
- **Workflow Executions**: Active runs of a specific Workflow traversing nodes.

## Concurrency
We heavily use `SELECT ... FOR UPDATE SKIP LOCKED` on the `jobs` table to guarantee exactly-once delivery semantics for workers pulling from queues concurrently.
