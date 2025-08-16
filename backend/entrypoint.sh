#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Run the data ingestion script
# We run this in the background to allow the main application to start faster
python scripts/ingest_data.py &

# Start the uvicorn server
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
