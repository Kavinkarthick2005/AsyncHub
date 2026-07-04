# Database Design

![Figure 4. Entity Relationship Diagram](diagram/ER_DIAGRAM.png)
*Figure 4. Entity Relationship Diagram*

AsyncHub relies exclusively on PostgreSQL for its data and message brokering needs.

## Global Concepts
- **Timestamps:** Most tables inherit from `TimestampMixin`, providing automatic `created_at` and `updated_at` columns (DateTime with timezone).
- **Primary Keys:** All tables use `UUID` as their primary key, generated automatically.
- **Foreign Keys:** Utilize `UUID` referencing primary keys, ensuring relational integrity.
- **JSONB:** Heavily used for unstructured job payloads and results, granting flexibility without schema changes.

## Tables

### 1. `users`
Stores authenticated users.
- `id` (UUID, PK)
- `email` (String, unique, index)
- `hashed_password` (String)
- `full_name` (String, optional)
- `is_active` (Boolean, default: True)
- `is_superuser` (Boolean, default: False)
- `created_at`, `updated_at` (DateTime)

### 2. `organizations`
Supports multi-tenancy. Projects and Queues belong to an Organization.
- `id` (UUID, PK)
- `name` (String)
- `slug` (String, unique)
- `created_at`, `updated_at` (DateTime)
**Relationships:** One-to-Many with `projects` and `members`.

### 3. `organization_members`
Maps users to organizations with Role-Based Access Control (RBAC).
- `id` (UUID, PK)
- `user_id` (UUID, FK to `users.id`)
- `org_id` (UUID, FK to `organizations.id`)
- `role` (String, default: "member" - options: "owner", "admin", "member")
- `created_at`, `updated_at` (DateTime)

### 4. `projects`
Logical grouping of queues within an organization.
- `id` (UUID, PK)
- `name` (String)
- `description` (Text, optional)
- `org_id` (UUID, FK to `organizations.id`)
- `created_at`, `updated_at` (DateTime)

### 5. `queues`
The actual work queues that workers poll.
- `id` (UUID, PK)
- `name` (String)
- `project_id` (UUID, FK to `projects.id`)
- `concurrency_limit` (Integer, default: 10)
- `priority` (Integer, default: 0)
- `is_paused` (Boolean, default: False)
- `retry_policy` (JSONB, optional)
- `created_at`, `updated_at` (DateTime)

### 6. `jobs`
The core unit of work.
- `id` (UUID, PK)
- `queue_id` (UUID, FK to `queues.id`)
- `name` (String)
- `payload` (JSONB, optional)
- `status` (String, index) - e.g., "queued", "running", "completed", "failed", "dead"
- `priority` (Integer, default: 0)
- `retries` (Integer, default: 0)
- `max_retries` (Integer, default: 3)
- `started_at`, `completed_at`, `run_after` (DateTime, optional)
- `idempotency_key` (String, unique, index, optional)
- `created_at`, `updated_at` (DateTime)
**Constraints:** `CheckConstraint('retries <= max_retries')`

### 7. `job_events`
Audit trail and history log for a job's lifecycle.
- `id` (UUID, PK)
- `job_id` (UUID, FK to `jobs.id`, cascade delete)
- `from_status` (String, optional)
- `to_status` (String)
- `message` (Text, optional)
- `created_at` (DateTime)

### 8. `job_executions`
Detailed execution record for each attempt a worker makes on a job.
- `id` (UUID, PK)
- `job_id` (UUID, FK to `jobs.id`, cascade delete)
- `worker_id` (String, optional)
- `attempt` (Integer, default: 1)
- `status` (String)
- `started_at`, `completed_at` (DateTime, optional)
- `duration_ms` (Integer, optional)
- `result` (JSONB, optional)
- `error` (Text, optional)
- `logs` (Text, optional)
- `created_at`, `updated_at` (DateTime)

## Alembic Migrations
Migrations are managed via Alembic. The current state represents a single unified schema initialization (Initial Migration) creating all the tables described above, along with Foreign Key constraints and Indexes.

## Why this design?
This relational structure guarantees ACID compliance for job state transitions. By using `organizations` and `projects`, the platform inherently supports SaaS multi-tenancy. JSONB columns (`payload`, `result`) prevent strict schema lock-in for arbitrary job data.
