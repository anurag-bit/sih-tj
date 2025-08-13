"""
FastAPI main application entry point for SIH Solver's Compass API.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .config import settings
from .middleware import ErrorHandlingMiddleware, LoggingMiddleware
from .models import HealthCheck, ErrorResponse
from .routers import search, github, chat, dashboard

# Create FastAPI application instance
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered guidance platform for Smart India Hackathon problem statements",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=settings.allowed_methods,
    allow_headers=settings.allowed_headers,
)

# Add custom middleware
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(LoggingMiddleware)

# Include routers
app.include_router(search.router, prefix="/api")
app.include_router(github.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.get("/", response_model=dict)
async def root():
    """Root endpoint with API information."""
    return {
        "message": "SIH Solver's Compass API",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint for monitoring."""
    return HealthCheck(
        status="healthy",
        version=settings.app_version
    )


@app.get("/api/health")
async def api_health():
    """API health check endpoint."""
    return {
        "status": "healthy",
        "api_version": settings.app_version,
        "services": {
            "search": "/api/search/health",
            "github": "/api/github/health", 
            "chat": "/api/chat/health",
            "dashboard": "/api/dashboard/health"
        }
    }