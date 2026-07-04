#!/bin/bash
# Start the background worker process and put it in the background
python app/worker.py &

# Start the FastAPI server in the foreground
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
