"""
Unit tests for the GitHub router endpoints.
"""
import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.models import GitHubProfile, Repository, SearchResult, ProblemStatement


class TestGitHubRouter:
    """Test cases for GitHub router endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create a test client."""
        return TestClient(app)
    
    @pytest.fixture
    def mock_github_profile(self):
        """Mock GitHub profile for testing."""
        return GitHubProfile(
            username="testuser",
            repositories=[
                Repository(
                    name="ml-project",
                    description="Machine learning project",
                    topics=["machine-learning", "python"],
                    language="Python"
                )
            ],
            tech_stack=["Python", "TensorFlow", "machine-learning"]
        )
    
    @pytest.fixture
    def mock_search_results(self):
        """Mock search results for testing."""
        return [
            SearchResult(
                problem=ProblemStatement(
                    id="sih_001",
                    title="AI-Based Traffic Management",
                    organization="Ministry of Transport",
                    category="Software",
                    description="Develop AI system for traffic optimization",
                    technology_stack=["Python", "TensorFlow"],
                    difficulty_level="Hard"
                ),
                similarity_score=0.85
            )
        ]
    
    def test_github_health_endpoint(self, client):
        """Test GitHub health check endpoint."""
        response = client.get("/api/github/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "github"
    
    @patch('app.routers.github.github_service')
    def test_get_github_profile_success(self, mock_service, client, mock_github_profile):
        """Test successful GitHub profile retrieval."""
        # Mock the service method
        mock_service.get_github_profile = AsyncMock(return_value=mock_github_profile)
        
        # Make request
        response = client.get("/api/github/profile/testuser")
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert len(data["repositories"]) == 1
        assert data["repositories"][0]["name"] == "ml-project"
        assert "Python" in data["tech_stack"]
        
        # Verify service was called
        mock_service.get_github_profile.assert_called_once_with("testuser")
    
    @patch('app.routers.github.github_service')
    def test_get_github_profile_not_found(self, mock_service, client):
        """Test GitHub profile retrieval when user not found."""
        # Mock service to raise HTTPException
        mock_service.get_github_profile = AsyncMock(
            side_effect=HTTPException(status_code=404, detail="User not found")
        )
        
        # Make request
        response = client.get("/api/github/profile/nonexistentuser")
        
        # Assertions
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
    
    @patch('app.routers.github.github_service')
    def test_get_github_profile_service_error(self, mock_service, client):
        """Test GitHub profile retrieval when service error occurs."""
        # Mock service to raise generic exception
        mock_service.get_github_profile = AsyncMock(
            side_effect=Exception("Service error")
        )
        
        # Make request
        response = client.get("/api/github/profile/testuser")
        
        # Assertions
        assert response.status_code == 500
        data = response.json()
        assert "Failed to fetch GitHub profile" in data["detail"]
    
    @patch('app.routers.github.github_service')
    def test_github_recommendations_success(self, mock_service, client, mock_search_results):
        """Test successful GitHub recommendations."""
        # Mock the service method
        mock_service.get_recommendations = AsyncMock(return_value=mock_search_results)
        
        # Make request
        request_data = {"username": "testuser"}
        response = client.post("/api/github/recommend", json=request_data)
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["problem"]["title"] == "AI-Based Traffic Management"
        assert data[0]["similarity_score"] == 0.85
        
        # Verify service was called
        mock_service.get_recommendations.assert_called_once_with("testuser")
    
    @patch('app.routers.github.github_service')
    def test_github_recommendations_user_not_found(self, mock_service, client):
        """Test GitHub recommendations when user not found."""
        # Mock service to raise HTTPException
        mock_service.get_recommendations = AsyncMock(
            side_effect=HTTPException(status_code=404, detail="User not found")
        )
        
        # Make request
        request_data = {"username": "nonexistentuser"}
        response = client.post("/api/github/recommend", json=request_data)
        
        # Assertions
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
    
    @patch('app.routers.github.github_service')
    def test_github_recommendations_service_error(self, mock_service, client):
        """Test GitHub recommendations when service error occurs."""
        # Mock service to raise generic exception
        mock_service.get_recommendations = AsyncMock(
            side_effect=Exception("Service error")
        )
        
        # Make request
        request_data = {"username": "testuser"}
        response = client.post("/api/github/recommend", json=request_data)
        
        # Assertions
        assert response.status_code == 500
        data = response.json()
        assert "Failed to generate recommendations" in data["detail"]
    
    def test_github_recommendations_invalid_request(self, client):
        """Test GitHub recommendations with invalid request data."""
        # Make request with missing username
        request_data = {}
        response = client.post("/api/github/recommend", json=request_data)
        
        # Should return validation error
        assert response.status_code == 422
    
    def test_github_recommendations_empty_username(self, client):
        """Test GitHub recommendations with empty username."""
        # Make request with empty username
        request_data = {"username": ""}
        response = client.post("/api/github/recommend", json=request_data)
        
        # Should return validation error
        assert response.status_code == 422