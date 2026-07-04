# Deployment

AsyncHub is inherently designed for containerized deployment.

## Production Checklist
1. **Database Setup**: Ensure PostgreSQL 15+ is running.
2. **Environment Variables**:
   - `DATABASE_URL`: Must point to the production database.
   - `SECRET_KEY`: Must be a long, secure random string.
   - `NEXT_PUBLIC_API_URL`: Points to the deployed API backend.
3. **Docker Compose**: A production `docker-compose.yml` can spin up the Next.js Frontend, FastAPI Backend, and N Background Workers concurrently.
4. **CI/CD**: Rely on the included `.github/workflows/ci.yml` for automated linting, testing, and Docker Compose validation before deploying.
