#!/usr/bin/env python3
"""
Simple test script to validate the backend API structure.
This script tests that all components can be imported and the FastAPI app can be created.
"""
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all modules can be imported successfully."""
    try:
        # Test model imports
        from app.models import (
            ProblemStatement, SearchQuery, SearchResult, ChatRequest, 
            ChatResponse, GitHubProfile, DashboardStats, ErrorResponse, HealthCheck
        )
        print("✓ Models imported successfully")
        
        # Test router imports
        from app.routers import search, github, chat, dashboard
        print("✓ Routers imported successfully")
        
        # Test middleware imports
        from app.middleware import ErrorHandlingMiddleware, LoggingMiddleware
        print("✓ Middleware imported successfully")
        
        # Test config imports
        from app.config import settings
        print("✓ Configuration imported successfully")
        
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False

def test_app_creation():
    """Test that the FastAPI app can be created."""
    try:
        from app.main import app
        print("✓ FastAPI app created successfully")
        
        # Check that routes are registered
        routes = [route.path for route in app.routes]
        expected_routes = ["/", "/health", "/api/health"]
        
        for route in expected_routes:
            if route in routes:
                print(f"✓ Route {route} registered")
            else:
                print(f"✗ Route {route} missing")
                return False
                
        return True
    except Exception as e:
        print(f"✗ App creation error: {e}")
        return False

def test_model_validation():
    """Test that Pydantic models work correctly."""
    try:
        from app.models import ProblemStatement, SearchQuery
        
        # Test ProblemStatement model
        problem = ProblemStatement(
            id="test-001",
            title="Test Problem",
            organization="Test Org",
            category="Software",
            description="Test description",
            difficulty_level="Medium"
        )
        print("✓ ProblemStatement model validation works")
        
        # Test SearchQuery model
        query = SearchQuery(query="test query", limit=10)
        print("✓ SearchQuery model validation works")
        
        return True
    except Exception as e:
        print(f"✗ Model validation error: {e}")
        return False

if __name__ == "__main__":
    print("Testing SIH Solver's Compass Backend API Structure")
    print("=" * 50)
    
    success = True
    success &= test_imports()
    success &= test_app_creation()
    success &= test_model_validation()
    
    print("=" * 50)
    if success:
        print("✓ All tests passed! Backend API structure is ready.")
        sys.exit(0)
    else:
        print("✗ Some tests failed. Please check the errors above.")
        sys.exit(1)