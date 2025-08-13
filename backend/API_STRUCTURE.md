# SIH Solver's Compass API Structure

## Overview
This document describes the core backend API structure implemented for the SIH Solver's Compass platform.

## Project Structure

```
backend/app/
├── __init__.py
├── main.py              # FastAPI application entry point
├── config.py            # Configuration and settings
├── models.py            # Pydantic data models
├── middleware.py        # Custom middleware for error handling and logging
└── routers/             # API route handlers
    ├── __init__.py
    ├── search.py        # Semantic search endpoints
    ├── github.py        # GitHub integration endpoints
    ├── chat.py          # Interactive chat endpoints
    └── dashboard.py     # Analytics dashboard endpoints
```

## API Endpoints

### Core Endpoints
- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint
- `GET /api/health` - API health check with service status

### Service Endpoints
- `POST /api/search/` - Semantic search for problem statements
- `GET /api/search/health` - Search service health check
- `POST /api/github/recommend` - GitHub-based recommendations
- `GET /api/github/profile/{username}` - GitHub profile analysis
- `GET /api/github/health` - GitHub service health check
- `POST /api/chat/` - Interactive problem chat
- `POST /api/chat/stream` - Streaming chat responses
- `GET /api/chat/health` - Chat service health check
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/health` - Dashboard service health check

## Data Models

### Core Models
- `ProblemStatement` - Problem statement data structure
- `SearchQuery` - Search request parameters
- `SearchResult` - Search results with similarity scores
- `ChatRequest` - Chat interaction request
- `ChatResponse` - Chat response data
- `GitHubProfile` - GitHub user profile and repositories
- `DashboardStats` - Analytics and statistics data
- `ErrorResponse` - Standardized error responses
- `HealthCheck` - Health check response format

## Configuration

The API uses environment-based configuration through `config.py`:
- CORS settings for frontend integration
- External API keys (Gemini, GitHub)
- Database connection settings
- Model configuration

## Middleware

### Error Handling Middleware
- Catches and formats unhandled exceptions
- Provides standardized error responses
- Logs errors for debugging

### Logging Middleware
- Logs all requests and responses
- Tracks processing time
- Adds performance headers

## CORS Configuration

Configured to allow requests from:
- `http://localhost:3000` (React development server)
- `http://localhost:80` (Production frontend)
- `http://localhost` (Local development)

## Next Steps

The API structure is ready for implementation of specific functionality:
1. Task 4: Implement semantic search functionality
2. Task 5: Build GitHub integration service
3. Task 6: Implement interactive chat functionality
4. Task 7: Build dashboard analytics service

Each service has placeholder endpoints that return 501 (Not Implemented) status codes until the respective tasks are completed.