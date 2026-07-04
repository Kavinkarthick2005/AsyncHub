# AsyncHub

![Architecture Diagram](docs/diagram/architecture_diagram.png)

AsyncHub is a high-performance, distributed background job scheduling and execution platform. Designed as an enterprise-grade SaaS boilerplate, it leverages PostgreSQL for both persistent storage and message brokering, eliminating the need for complex external infrastructure like RabbitMQ or Redis for MVP deployments.

## Core Architecture

AsyncHub is built around four core pillars:

1.  **API Gateway (FastAPI):** A high-performance REST API that handles HTTP requests, authentication (JWT), RBAC, and job lifecycle management.
2.  **Worker Engine (Python/Asyncio):** A standalone, horizontally scalable consumer that polls for jobs using atomic `SKIP LOCKED` queries, guaranteeing exactly-once execution without needing a dedicated broker like RabbitMQ or Redis.
3.  **Scheduler Engine (Python/Asyncio):** A standalone daemon that evaluates cron expressions (`croniter`), manages recurring schedules, and securely dispatches delayed jobs in an atomic, crash-proof transaction.
4.  **Database Engine (PostgreSQL):** Acts as the single source of truth for both state and message queuing. It relies on standard relational features plus advanced triggers and JSONB columns.

## ✨ Features

- **Multi-Tenant by Design:** Out-of-the-box support for isolated Organizations, Projects, and Queues with Role-Based Access Control (RBAC).
- **Zero-Dependency Queues:** Utilizes PostgreSQL's `FOR UPDATE SKIP LOCKED` mechanism for safe, highly-concurrent job claiming.
- **Dead Letter Queue (DLQ):** Automatic routing of exhausted jobs to a DLQ for manual inspection and replay.
- **Comprehensive Observability:** Granular `JobEvent` and `JobExecution` logs track every state transition, worker assignment, and error traceback.
- **Modern Dashboard:** A sleek Next.js (App Router) interface built with Tailwind CSS, Radix UI, and GSAP animations.
- **Global Command Palette:** Instantly navigate workspaces and resources using `⌘K`.

## 🛠 Tech Stack

**Backend (Control Plane & Workers)**
- Python 3.10+
- FastAPI (REST API)
- SQLAlchemy (asyncpg) + Alembic
- PostgreSQL (Supabase)
- PyJWT & Passlib (Authentication)

**Frontend (Dashboard)**
- Next.js 14 (App Router)
- React Query (Server State)
- Tailwind CSS & Shadcn/UI (Design System)
- GSAP (Animations)
- Lucide React (Icons)

## 📁 Folder Structure

```
AsyncHub/
├── apps/
│   ├── api/                 # FastAPI Backend & Worker Engine
│   └── web/                 # Next.js Frontend Dashboard
├── docs/                    # Architecture & Design Decisions
```

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file based on .env.example
# Run migrations
alembic upgrade head

# Start the API server
uvicorn app.main:app --reload

# In a separate terminal, start a worker
python -m app.workers.runner worker-1
```

### 2. Frontend Setup
```bash
cd apps/web
npm install

# Start the development server
npm run dev
```

Navigate to `http://localhost:3000` to view the application.

## 🗺 Roadmap
- [x] Multi-tenant Data Model
- [x] JWT Authentication & Session Refresh
- [x] Worker Engine (`SKIP LOCKED`)
- [x] Dead Letter Queue & Replay
- [x] Cron & Delayed Job Scheduling
- [ ] Live Workers Dashboard
- [ ] Realtime Job Status via WebSockets (`LISTEN / NOTIFY`)
- [ ] API Key Generation for External Dispatch

## 📄 License
This project is licensed under the MIT License.