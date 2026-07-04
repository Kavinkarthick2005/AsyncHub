# Technical Debt & Architecture Analysis

This document outlines the current state of technical debt, known bugs, and areas for improvement in the AsyncHub codebase. Items are prioritized by their potential impact on production stability and MVP completion.

## 🔴 Critical Priority

### 1. Hardcoded API Stubs in Placeholders
- **Description:** Several UI pages (Projects, Queues, Workers, Settings) are currently stubs. If a user navigates to them, they provide no functionality.
- **Action:** Either build the backend API for these resources or temporarily remove them from the UI sidebar to prevent user confusion.

### 2. Missing Live Worker Tracking
- **Description:** There is no "heartbeat" or registration mechanism for workers. The system assumes a worker is alive if it is processing jobs, but if it crashes mid-job, the job is stuck in `running` status forever.
- **Action:** Implement a heartbeat table and a daemon that periodically resets `running` jobs to `queued` if the assigned worker hasn't pinged in 60 seconds.

### 3. Missing Automated Testing
- **Description:** The project entirely lacks `pytest` and frontend test suites. The `scripts/seed.py` acts as a manual integration test, but regressions in the `SKIP LOCKED` concurrency logic could easily slip into production undetected.
- **Action:** Create a `tests/` directory in the backend and implement integration tests for `JobService.claim_next_job`.

## 🟡 Medium Priority

### 4. Client-Side JWT Refresh Limitations
- **Description:** The `api-client.ts` intercepts `401 Unauthorized` errors and refreshes the token. However, if multiple API requests fail simultaneously, it may trigger multiple parallel refresh requests, potentially invalidating the refresh chain.
- **Action:** Introduce a mutex or a promise queue in `fetchApi` to pause all outgoing requests while a token refresh is in progress.

### 5. Frontend Polling vs. WebSockets
- **Description:** Realtime updates are faked by React Query's `refetchOnWindowFocus`. For a high-throughput job system, users expect to see jobs transition statuses live without interacting with the page.
- **Action:** Implement the planned PostgreSQL `LISTEN / NOTIFY` trigger and a WebSocket endpoint in FastAPI to broadcast state changes.

### 6. Job Execution Concurrency Model
- **Description:** The current `app.workers.runner` executes a single job in a linear `while True:` loop. A single Python process can only handle one job at a time.
- **Action:** Refactor the worker to use an `asyncio.TaskGroup` or a thread pool to pull $N$ jobs concurrently up to the queue's `concurrency_limit`.

## 🟢 Low Priority

### 7. Pagination and Data Fetching
- **Description:** Endpoints like `GET /jobs` currently return flat lists of data. If an organization generates millions of jobs, this endpoint will crash the server.
- **Action:** Implement offset/limit pagination (or cursor-based pagination) in both the FastAPI repositories and the Next.js frontend tables.

### 8. Code Duplication in Forms
- **Description:** The `Login` and `Signup` forms share very similar UI code and layout structures.
- **Action:** Extract the common form card layouts into a shared component to ensure design consistency.

### 9. Database JSONB Indexing
- **Description:** The `payload` and `result` columns in `jobs` and `job_executions` are `JSONB`, but they lack GIN indexes.
- **Action:** If users ever need to search for a specific job based on a key inside the payload, we must add a GIN index on these columns.

### 10. Dockerization
- **Description:** The project requires manual `pip install` and `npm install` to run.
- **Action:** Create `Dockerfile` for the API and Web, and a `docker-compose.yml` to spin up PostgreSQL, the API, the Frontend, and 3 Worker nodes instantly for new developers.
