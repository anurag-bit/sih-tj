# SIH Solver's Compass

An AI-powered guidance platform designed to help engineering students discover and engage with Smart India Hackathon problem statements.

## Quick Start

1. **Clone the repository and navigate to the project directory**

2. **Set up environment variables:**
   ```bash
   cp .env.template .env
   # Edit .env file with your API keys
   ```

3. **Start the application:**
   ```bash
   docker-compose up
   ```

4. **Access the application:**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:8000
   - ChromaDB: http://localhost:8001

## Project Structure

```
sih-solvers-compass/
├── backend/                 # FastAPI backend service
│   ├── app/                # Application code
│   ├── Dockerfile          # Backend container configuration
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend application
│   ├── src/               # Source code
│   ├── Dockerfile         # Frontend container configuration
│   └── package.json       # Node.js dependencies
├── scripts/               # Utility scripts
│   └── ingest_data.py     # Data ingestion script
├── docker-compose.yml     # Multi-service orchestration
├── .env.template         # Environment variables template
└── README.md             # This file
```

## Services

- **Frontend**: React application with Tailwind CSS
- **Backend**: FastAPI with Python 3.10
- **ChromaDB**: Vector database for semantic search

## Development

For development mode, you can run services individually:

```bash
# Backend development
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend development
cd frontend
npm install
npm run dev
```

## Environment Variables

See `.env.template` for required environment variables. Key variables:

- `GEMINI_API_KEY`: Google Gemini API key for chat functionality
- `GITHUB_TOKEN`: GitHub API token (optional, for enhanced rate limits)
- `CHROMA_HOST`: ChromaDB host (default: chroma-db)

## Next Steps

1. Configure your API keys in the `.env` file
2. Run the data ingestion script to populate the vector database
3. Start developing additional features as per the implementation plan