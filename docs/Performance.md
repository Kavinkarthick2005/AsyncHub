# Performance & Architecture Decisions

This document outlines the core architectural and performance-related decisions made in AsyncHub to ensure it remains scalable, responsive, and robust as a distributed systems platform.

## 1. Concurrency Control: `SELECT ... FOR UPDATE SKIP LOCKED`
**The Problem**: In a distributed worker pool, multiple instances of the worker application poll the database concurrently for pending jobs. Without proper locking, two workers might fetch and attempt to execute the exact same job, leading to duplicated efforts, corrupted state, or deadlocks.

**The Solution**: AsyncHub leverages PostgreSQL's `SKIP LOCKED` feature in the job claiming transaction.
- When a worker polls for a job, it issues: `SELECT * FROM jobs WHERE status = 'queued' FOR UPDATE SKIP LOCKED LIMIT 1`.
- `FOR UPDATE` locks the row so no other transaction can modify it.
- `SKIP LOCKED` tells Postgres to instantly skip any rows that are already locked by other active worker transactions, rather than waiting for the lock to release.
- **Why this matters**: It allows AsyncHub to achieve high throughput horizontal scaling without requiring a dedicated message broker (like RabbitMQ or Redis). The database acts as a highly reliable, concurrent queue.

## 2. Realtime Event Broadcasting: PostgreSQL `LISTEN / NOTIFY`
**The Problem**: The Next.js frontend features a real-time observability dashboard that needs to react instantly when a job finishes, fails, or a worker goes offline. Polling the database from the FastAPI backend every second is highly inefficient and creates unnecessary load.

**The Solution**: AsyncHub uses PostgreSQL's native Pub/Sub mechanism.
- We utilize `asyncpg` in the FastAPI backend to maintain a persistent connection that issues a `LISTEN job_events` command.
- As workers complete jobs, they fire a `NOTIFY job_events, '<json_payload>'` command within their transaction.
- The FastAPI WebSocket manager instantly receives this push notification and broadcasts it to all connected frontend clients.
- **Why this matters**: It provides incredibly low-latency real-time updates to the UI with minimal database overhead and no need for an external Pub/Sub service like Redis or Kafka.

## 3. Workflow Engine Storage: `JSONB`
**The Problem**: A Directed Acyclic Graph (DAG) for a workflow can have arbitrary nodes, edges, and configurations. Normalizing this into strict SQL tables (`nodes`, `edges`, `node_configurations`) results in excessive `JOIN` operations and rigid schemas that are hard to migrate when node types change.

**The Solution**: AsyncHub stores the React Flow DAG definition as a `JSONB` column in the `workflows` table.
- **Why this matters**: `JSONB` allows for flexible schema evolution. The React Flow frontend can serialize its exact state, and the Python backend can traverse the JSON graph to calculate in-degrees and topological sorts natively. We still index specific keys if searchability is required, getting the best of both NoSQL flexibility and relational integrity.

## 4. UI Rendering: React Flow
**The Solution**: The workflow builder uses `@xyflow/react`.
- **Why this matters**: Building an interactive DAG editor from scratch using raw HTML Canvas or SVG is immensely complex (drag-and-drop, zoom, pan, edge routing). React Flow provides a highly performant, accessible, and customizable foundation that allowed us to focus on the business logic of node configuration and state management rather than math and physics of graph rendering.

## 5. Horizontal Scaling Strategy
AsyncHub is designed to scale horizontally across all tiers:
1. **Frontend (Next.js)**: Stateless. Can be deployed on Vercel, AWS Amplify, or behind a traditional load balancer in Docker.
2. **API (FastAPI)**: Stateless. Can be scaled infinitely behind a load balancer. JWT authentication means no session state is stored in memory.
3. **Workers**: Stateless process executors. Can be deployed as Kubernetes Deployments or AWS ECS Tasks. Scaling from 1 worker to 100 workers requires zero configuration changes, thanks to `SKIP LOCKED`.
4. **Database (PostgreSQL)**: The primary bottleneck in this architecture. Scales vertically, and read-replicas can be used for API read-heavy workloads, while the primary node handles the `SKIP LOCKED` write transactions for the queue.
