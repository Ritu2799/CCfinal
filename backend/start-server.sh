#!/bin/bash
# Start the backend server

# Navigate to project root
cd "$(dirname "$0")/.."

# Activate virtual environment
source .venv/bin/activate

# Navigate to backend directory
cd backend

# Start the server
echo "Starting backend server on http://127.0.0.1:8000"
python -m uvicorn server:app --reload --port 8000 --host 127.0.0.1

