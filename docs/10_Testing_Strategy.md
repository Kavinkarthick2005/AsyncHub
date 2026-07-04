# Testing Strategy

AsyncHub currently relies heavily on manual verification and seed-based testing. As the platform transitions from an MVP to a production-ready state, a robust automated testing strategy is required.

## Current Testing Status

### Manual Verification
- **API Endpoints:** Tested via Swagger UI (`/docs`) and cURL.
- **Frontend UI:** Verified through browser testing (component rendering, responsive layouts, Next.js build compilation).
- **Concurrency:** Verified by booting multiple Python worker instances in the CLI and observing Postgres locking behavior.

### Implemented Verification (Data Seeding)
To facilitate testing without a massive automated suite, we implemented `scripts/seed.py`. 
- This script acts as an integration test, exercising the ORM, the `OrgService`, and database constraints.
- It is idempotent (`--reset`), allowing developers to instantly tear down and repopulate a known state with Organizations, Projects, Queues, and 30+ varied Jobs with highly realistic `JobEvent` histories.

## Known Missing Automated Tests
Currently, there are no CI/CD pipelines running `pytest` (backend) or `jest` (frontend).

## Future Testing Strategy

### 1. Backend Unit Tests (`pytest`)
- **Core Engine (Critical):** Tests must explicitly target the `JobService.claim_next_job` method. We need to mock concurrent access to verify that `FOR UPDATE SKIP LOCKED` behaves exactly as expected without deadlocking.
- **Services:** Test business logic in `OrgService` (verifying RBAC assignments on creation) without needing an active database connection.

### 2. Backend Integration Tests
- **API Tests:** Use FastAPI's `TestClient` wrapped in `pytest` fixtures with a test PostgreSQL database to verify full request/response lifecycles, auth token validation, and HTTP status codes.

### 3. Frontend Tests
- **Component Tests:** Use React Testing Library to verify that the `WorkspaceProvider` correctly updates context state when changing organizations.
- **E2E Tests:** Use Cypress or Playwright to simulate a user logging in, creating an organization, and viewing the Dead Letter Queue.

### 4. Critical Scenarios Requiring Testing
- **Worker Failure Recovery:** Simulate a hard crash (`SIGKILL`) of a worker mid-execution and ensure the recovery daemon correctly identifies the stalled job and resets it.
- **Realtime / Concurrency Testing:** Spawning 100 dummy jobs and 5 simultaneous workers, asserting that exactly 100 jobs execute exactly once with zero duplications.
