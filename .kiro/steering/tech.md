# Technology Stack & Build System

## Architecture
Full-stack containerized application with microservices architecture using Docker Compose.

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10)
- **AI/ML**: 
  - sentence-transformers (all-MiniLM-L6-v2 model)
  - Google Gemini API for chat functionality
- **Database**: ChromaDB (vector database for semantic search)
- **HTTP Client**: httpx for external API calls
- **Key Libraries**: pydantic, python-dotenv, uvicorn

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **Charts**: Recharts for dashboard visualizations
- **Routing**: React Router DOM

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Web Server**: Nginx (for frontend static files)
- **Networking**: Custom Docker network (sih-network)

## Common Commands

### Development Setup
```bash
# Initial setup
cp .env.template .env
# Edit .env with your API keys

# Start all services
docker-compose up

# Start with rebuild
docker-compose up --build
```

### Development Mode
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

### Data Management
```bash
# Run data ingestion
python scripts/ingest_data.py

# Test search functionality
python scripts/test_search.py
```

### Service Access
- Frontend: http://localhost:80
- Backend API: http://localhost:8000
- ChromaDB: http://localhost:8001

## Environment Variables
All configuration managed via `.env` file. Required variables:
- `GEMINI_API_KEY`: Google Gemini API key
- `CHROMA_HOST`: ChromaDB host (default: chroma-db)
- `GITHUB_TOKEN`: Optional, for enhanced GitHub API rate limits