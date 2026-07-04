# Design Decisions

1. **Why FastAPI?** Native async/await support, stellar Pydantic integration, and high performance for concurrent WebSocket and HTTP connections.
2. **Why PostgreSQL instead of Redis/RabbitMQ?** Simplifies operational overhead. With `SKIP LOCKED`, Postgres is highly capable of acting as a robust queueing backend. We avoid the "two-state" problem (state in DB vs state in broker).
3. **Why Next.js (App Router)?** Provides seamless server-side rendering for marketing pages (SEO) alongside complex client-side applications (Zustand, GSAP, React Flow) for the dashboard.
4. **Fail Fast Workflow Policy**: For v1, if any node in a workflow fails, the entire execution halts. This guarantees deterministic behavior and prevents cascading side-effects in partially successful complex DAGs. Future iterations may add retry/continue policies.
