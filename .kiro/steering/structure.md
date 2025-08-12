# Project Structure & Organization

## Directory Layout

```
sih-solvers-compass/
├── backend/                 # FastAPI backend service
│   ├── app/                # Application code
│   │   ├── __init__.py
│   │   └── main.py         # FastAPI entry point
│   ├── Dockerfile          # Backend container configuration
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend application
│   ├── src/               # Source code
│   │   ├── App.tsx        # Main React component
│   │   ├── main.tsx       # React entry point
│   │   └── index.css      # Global styles
│   ├── Dockerfile         # Frontend container (multi-stage build)
│   ├── package.json       # Node.js dependencies
│   ├── vite.config.ts     # Vite configuration
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── postcss.config.js  # PostCSS configuration
│   └── nginx.conf         # Nginx configuration for production
├── scripts/               # Utility scripts
│   ├── ingest_data.py     # Data ingestion script
│   └── test_search.py     # Search functionality testing
├── .kiro/                 # Kiro IDE configuration
│   └── steering/          # AI assistant steering rules
├── docker-compose.yml     # Multi-service orchestration
├── .env.template         # Environment variables template
├── .env                  # Environment variables (gitignored)
├── context.md            # Detailed project requirements
└── README.md             # Project documentation
```

## Key Conventions

### Backend Structure
- **FastAPI app**: Located in `backend/app/`
- **Main entry**: `backend/app/main.py` contains FastAPI application
- **Dependencies**: All Python packages listed in `requirements.txt`
- **Docker**: Single-stage build using `python:3.10-slim`

### Frontend Structure
- **React + TypeScript**: Modern React with TypeScript support
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Multi-stage Docker**: Node.js build stage + Nginx serving stage

### Scripts Organization
- **Data ingestion**: `scripts/ingest_data.py` handles ChromaDB population
- **Testing utilities**: Additional scripts for testing functionality
- **Standalone execution**: Scripts can run independently with proper Python path setup

### Configuration Management
- **Environment variables**: Centralized in `.env` file
- **Docker networking**: Custom network `sih-network` for service communication
- **Volume persistence**: ChromaDB data persisted via named volume `chroma-data`

### Development Workflow
1. **Local development**: Each service can run independently
2. **Container development**: Full stack via `docker-compose up`
3. **Data setup**: Run ingestion script before first use
4. **Testing**: Individual service testing supported