# Deployment Guide

This document outlines how to configure, run, and deploy AsyncHub across different environments. As an enterprise-grade platform, AsyncHub is designed to be highly available and horizontally scalable.

## 1. Local Development Setup

### Environment Variables
Configuration is managed via `.env` files. Both the API and Web applications require their respective environments to be configured.

**`apps/api/.env`**
```ini
SECRET_KEY=your_secure_random_string
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/asynchub
REDIS_URL=redis://localhost:6379/0  # Optional for MVP, required for future WebSocket scale
```

**`apps/web/.env.local`**
```ini
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

### PostgreSQL Configuration
AsyncHub relies heavily on PostgreSQL for its queue engine (`SKIP LOCKED`). 
- Ensure your PostgreSQL instance has adequate `max_connections` configured, as each worker process will maintain a connection pool.
- Use a connection pooler like **PgBouncer** in transaction mode if scaling beyond a dozen workers.

### Running the API (Control Plane)
```bash
cd apps/api
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Running the Frontend (Dashboard)
```bash
cd apps/web
npm install
npm run dev
```

### Running Workers (Execution Plane)
Workers operate entirely independently of the API server. You can spawn as many as needed to increase throughput.
```bash
cd apps/api
python -m app.workers.runner worker-alpha
python -m app.workers.runner worker-beta
```

---

## 2. Production Deployment Considerations

### Separation of Planes
In production, the Control Plane (FastAPI) and Execution Plane (Python Workers) should be deployed as separate services.
- **API Servers:** Deploy behind a load balancer (e.g., Nginx, AWS ALB) in an auto-scaling group. They are completely stateless.
- **Worker Nodes:** Deploy as background services (e.g., ECS Tasks, Kubernetes Deployments, systemd services) without exposed ports. Scale based on queue depth metrics, not CPU utilization.

### Database Scaling
Because PostgreSQL acts as the message broker, it will experience high transaction volume (heavy UPDATE operations).
- **Vacuuming:** Ensure aggressive autovacuum tuning is enabled on the `jobs` table to prevent table bloat from rapid row updates.
- **Connection Pooling:** A centralized PgBouncer instance is mandatory in production to multiplex thousands of worker connections down to a safe limit on the primary database.

### Future: Redis Integration
If the platform scales to the point where PostgreSQL locking becomes a bottleneck for queue discovery, or when WebSockets are introduced across horizontally scaled API nodes, Redis will be introduced.
- **Pub/Sub:** Redis will manage the WebSocket broadcast channels between API nodes.
- **Caching:** Redis can be used to cache heavily accessed data like organization RBAC permissions.
