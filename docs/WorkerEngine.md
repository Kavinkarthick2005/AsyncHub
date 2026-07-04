# Worker Engine

The Worker Engine is a stateless Python process responsible for polling the database for pending jobs and executing them safely.

## Lifecycle
1. **Registration**: Upon startup, a worker inserts a record into the `workers` table with `status="online"`.
2. **Polling Loop**: The worker executes a `SKIP LOCKED` query against the `jobs` table to claim a job.
3. **Execution**: The worker safely executes the job payload out of the database transaction.
4. **Resolution**: If successful, the job is marked `completed`. If it fails, it's marked `queued` with an exponentially backed-off `run_after` timestamp. Max retries result in `dead` status.
5. **Heartbeats & Recovery**: A concurrent async loop updates the worker's heartbeat every 5 seconds. It also sweeps the database for any other workers whose heartbeats are older than 30 seconds, marking them `offline` and automatically requeueing their `running` jobs to ensure no task is permanently orphaned.
