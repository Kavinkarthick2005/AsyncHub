# API Documentation

AsyncHub's core backend is built on **FastAPI**.

## Core Endpoints
- `POST /api/v1/auth/login`: Issue JWT token.
- `GET /api/v1/projects`: List projects.
- `POST /api/v1/jobs/enqueue`: Submit a new job to a specific queue (authenticated via Project API Key).
- `GET /api/v1/jobs`: List jobs for dashboard monitoring.
- `GET /api/v1/workers`: View fleet status.

## WebSocket Realtime
- `WS /api/v1/ws`: Dashboard clients connect here. Broadcasts real-time events triggered by PostgreSQL `LISTEN/NOTIFY` channels when Jobs change status or Workers go offline.

All endpoints are self-documented via Swagger UI at `/docs`.
