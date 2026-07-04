# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build essentials for native extensions (e.g. asyncpg)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc python3-dev libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Stage 2: Final minimal image
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies for psycopg2/asyncpg
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

RUN pip install --no-cache /wheels/*

COPY . .

COPY start.sh .
RUN chmod +x start.sh

# Default command for API and worker in same container
CMD ["./start.sh"]
