"""
Unit tests for the search router endpoints.
"""
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from datetime import datetime

from app.main import app
from app.models import ProblemStatement, SearchResult
from app.services.search_service import SearchServiceError


class TestSearchRouter:
    """Test cases for search router endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create a test client for the FastAPI app."""
        return TestClient(app)
    
    @pytest.fixture
    def sample_problem(self):
        """Create a sample problem statement for testing."""
        return ProblemStatement(
            id="test_001",
            title="Test Problem",
            organization="Test Organization",
            category="Software",
            description="This is a test problem description",
            technology_stack=["Python", "FastAPI"],
            difficulty_level="Medium",
            created_at=datetime(2024, 1, 1)
        )
    
    @pytest.fixture
    def sample_search_results(self, sample_problem):
        """Create sample search results for testing."""
        return [
            SearchResult(problem=sample_problem, similarity_score=0.9),
            SearchResult(
                problem=ProblemStatement(
                    id="test_002",
                    title="Another Test Problem",
                    organization="Another Organization",
                    category="IoT",
                    description="Another test problem description",
                    technology_stack=["Arduino", "C++"],
                    difficulty_level="Hard"
                ),
                similarity_score=0.7
            )
        ]
    
    def test_semantic_search_success(self, client, sample_search_results):
        """Test successful semantic search endpoint."""
        with patch('app.routers.search.search_service.search', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = sample_search_results
            
            # Make request
            response = client.post("/api/search/", json={
                "query": "machine learning problem",
                "limit": 10
            })
            
            # Assertions
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            
            # Check first result
            first_result = data[0]
            assert first_result["problem"]["id"] == "test_001"
            assert first_result["problem"]["title"] == "Test Problem"
            assert first_result["similarity_score"] == 0.9
            
            # Check second result
            second_result = data[1]
            assert second_result["problem"]["id"] == "test_002"
            assert second_result["similarity_score"] == 0.7
            
            # Verify service was called correctly
            mock_search.assert_called_once_with(
                query="machine learning problem",
                limit=10
            )
    
    def test_semantic_search_empty_query(self, client):
        """Test semantic search with empty query."""
        response = client.post("/api/search/", json={
            "query": "",
            "limit": 10
        })
        
        # Empty string passes Pydantic validation but fails our custom validation
        assert response.status_code == 400
        assert "Search query cannot be empty" in response.json()["detail"]
    
    def test_semantic_search_whitespace_query(self, client):
        """Test semantic search with whitespace-only query."""
        response = client.post("/api/search/", json={
            "query": "   ",
            "limit": 10
        })
        
        # Whitespace-only query should be caught by our validation
        assert response.status_code == 400
        assert "Search query cannot be empty" in response.json()["detail"]
    
    def test_semantic_search_default_limit(self, client):
        """Test semantic search with default limit."""
        with patch('app.routers.search.search_service.search', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = []
            
            response = client.post("/api/search/", json={
                "query": "test query"
            })
            
            assert response.status_code == 200
            mock_search.assert_called_once_with(
                query="test query",
                limit=20  # Default limit
            )
    
    def test_semantic_search_service_error(self, client):
        """Test semantic search when service raises SearchServiceError."""
        with patch('app.routers.search.search_service.search', new_callable=AsyncMock) as mock_search:
            mock_search.side_effect = SearchServiceError("ChromaDB connection failed")
            
            response = client.post("/api/search/", json={
                "query": "test query",
                "limit": 10
            })
            
            assert response.status_code == 500
            assert "Search service error" in response.json()["detail"]
            assert "ChromaDB connection failed" in response.json()["detail"]
    
    def test_semantic_search_unexpected_error(self, client):
        """Test semantic search when service raises unexpected error."""
        with patch('app.routers.search.search_service.search', new_callable=AsyncMock) as mock_search:
            mock_search.side_effect = Exception("Unexpected error")
            
            response = client.post("/api/search/", json={
                "query": "test query",
                "limit": 10
            })
            
            assert response.status_code == 500
            assert "Unexpected error during search" in response.json()["detail"]
    
    def test_semantic_search_invalid_limit(self, client):
        """Test semantic search with invalid limit values."""
        # Test negative limit
        response = client.post("/api/search/", json={
            "query": "test query",
            "limit": -1
        })
        assert response.status_code == 422  # Validation error
        
        # Test limit too high
        response = client.post("/api/search/", json={
            "query": "test query",
            "limit": 101
        })
        assert response.status_code == 422  # Validation error
    
    def test_get_problem_by_id_success(self, client, sample_problem):
        """Test successful retrieval of problem by ID."""
        with patch('app.routers.search.search_service.get_problem_by_id', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = sample_problem
            
            response = client.get("/api/search/problem/test_001")
            
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == "test_001"
            assert data["title"] == "Test Problem"
            assert data["organization"] == "Test Organization"
            
            mock_get.assert_called_once_with("test_001")
    
    def test_get_problem_by_id_not_found(self, client):
        """Test retrieval of non-existent problem by ID."""
        with patch('app.routers.search.search_service.get_problem_by_id', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None
            
            response = client.get("/api/search/problem/nonexistent")
            
            assert response.status_code == 404
            assert "Problem statement not found" in response.json()["detail"]
    
    def test_get_problem_by_id_service_error(self, client):
        """Test get problem by ID when service raises error."""
        with patch('app.routers.search.search_service.get_problem_by_id', new_callable=AsyncMock) as mock_get:
            mock_get.side_effect = SearchServiceError("Database error")
            
            response = client.get("/api/search/problem/test_001")
            
            assert response.status_code == 500
            assert "Search service error" in response.json()["detail"]
    
    def test_get_search_stats_success(self, client):
        """Test successful retrieval of search statistics."""
        mock_stats = {
            "total_problems": 100,
            "categories": {"Software": 50, "IoT": 30, "Blockchain": 20},
            "organizations": {"Ministry A": 40, "Ministry B": 35, "Ministry C": 25},
            "collection_name": "problem_statements"
        }
        
        with patch('app.routers.search.search_service.get_collection_stats', new_callable=AsyncMock) as mock_get_stats:
            mock_get_stats.return_value = mock_stats
            
            response = client.get("/api/search/stats")
            
            assert response.status_code == 200
            data = response.json()
            assert data["total_problems"] == 100
            assert data["categories"]["Software"] == 50
            assert data["organizations"]["Ministry A"] == 40
            
            mock_get_stats.assert_called_once()
    
    def test_get_search_stats_service_error(self, client):
        """Test get search stats when service raises error."""
        with patch('app.routers.search.search_service.get_collection_stats', new_callable=AsyncMock) as mock_get_stats:
            mock_get_stats.side_effect = SearchServiceError("Stats calculation failed")
            
            response = client.get("/api/search/stats")
            
            assert response.status_code == 500
            assert "Search service error" in response.json()["detail"]
    
    def test_search_health_check_healthy(self, client):
        """Test search health check when service is healthy."""
        mock_health = {
            "status": "healthy",
            "initialized": True,
            "model_loaded": True,
            "chromadb_connected": True,
            "total_problems": 100,
            "test_query_results": 5
        }
        
        with patch('app.routers.search.search_service.health_check', new_callable=AsyncMock) as mock_health_check:
            mock_health_check.return_value = mock_health
            
            response = client.get("/api/search/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["initialized"] is True
            assert data["total_problems"] == 100
    
    def test_search_health_check_unhealthy(self, client):
        """Test search health check when service is unhealthy."""
        mock_health = {
            "status": "unhealthy",
            "error": "ChromaDB connection failed",
            "initialized": False
        }
        
        with patch('app.routers.search.search_service.health_check', new_callable=AsyncMock) as mock_health_check:
            mock_health_check.return_value = mock_health
            
            response = client.get("/api/search/health")
            
            assert response.status_code == 503
            data = response.json()
            assert data["detail"]["status"] == "unhealthy"
            assert "error" in data["detail"]
    
    def test_search_health_check_exception(self, client):
        """Test search health check when health check raises exception."""
        with patch('app.routers.search.search_service.health_check', new_callable=AsyncMock) as mock_health_check:
            mock_health_check.side_effect = Exception("Health check failed")
            
            response = client.get("/api/search/health")
            
            assert response.status_code == 503
            data = response.json()
            assert data["detail"]["status"] == "unhealthy"
            assert "Health check failed" in data["detail"]["error"]
    
    def test_search_request_validation(self, client):
        """Test request validation for search endpoint."""
        # Test missing query field
        response = client.post("/api/search/", json={
            "limit": 10
        })
        assert response.status_code == 422
        
        # Test invalid JSON
        response = client.post("/api/search/", data="invalid json")
        assert response.status_code == 422
        
        # Test query too short (empty string after validation)
        response = client.post("/api/search/", json={
            "query": "",
            "limit": 10
        })
        assert response.status_code == 400
    
    def test_search_response_format(self, client, sample_search_results):
        """Test that search response follows the correct format."""
        with patch('app.routers.search.search_service.search', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = sample_search_results
            
            response = client.post("/api/search/", json={
                "query": "test query",
                "limit": 10
            })
            
            assert response.status_code == 200
            data = response.json()
            
            # Verify response structure
            assert isinstance(data, list)
            for result in data:
                assert "problem" in result
                assert "similarity_score" in result
                
                problem = result["problem"]
                assert "id" in problem
                assert "title" in problem
                assert "organization" in problem
                assert "category" in problem
                assert "description" in problem
                assert "technology_stack" in problem
                assert "difficulty_level" in problem
                
                # Verify similarity score is a float between 0 and 1
                score = result["similarity_score"]
                assert isinstance(score, (int, float))
                assert 0.0 <= score <= 1.0


@pytest.mark.asyncio
class TestSearchRouterIntegration:
    """Integration tests for search router with real FastAPI test client."""
    
    @pytest.fixture
    def app_client(self):
        """Create a test client for integration testing."""
        return TestClient(app)
    
    async def test_full_search_workflow_integration(self, app_client):
        """Test the complete search workflow through the API."""
        # Mock the search service for integration test
        mock_results = [
            SearchResult(
                problem=ProblemStatement(
                    id="integration_001",
                    title="Integration Test Problem",
                    organization="Test Ministry",
                    category="Software",
                    description="This is an integration test problem",
                    technology_stack=["Python", "FastAPI", "React"],
                    difficulty_level="Medium"
                ),
                similarity_score=0.95
            )
        ]
        
        with patch('app.routers.search.search_service.search', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_results
            
            # Test search endpoint
            search_response = app_client.post("/api/search/", json={
                "query": "integration test problem",
                "limit": 5
            })
            
            assert search_response.status_code == 200
            search_data = search_response.json()
            assert len(search_data) == 1
            assert search_data[0]["problem"]["id"] == "integration_001"
            assert search_data[0]["similarity_score"] == 0.95
        
        # Test get problem by ID endpoint
        with patch('app.routers.search.search_service.get_problem_by_id', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_results[0].problem
            
            problem_response = app_client.get("/api/search/problem/integration_001")
            
            assert problem_response.status_code == 200
            problem_data = problem_response.json()
            assert problem_data["id"] == "integration_001"
            assert problem_data["title"] == "Integration Test Problem"
        
        # Test stats endpoint
        mock_stats = {
            "total_problems": 1,
            "categories": {"Software": 1},
            "organizations": {"Test Ministry": 1},
            "collection_name": "problem_statements"
        }
        
        with patch('app.routers.search.search_service.get_collection_stats', new_callable=AsyncMock) as mock_stats_call:
            mock_stats_call.return_value = mock_stats
            
            stats_response = app_client.get("/api/search/stats")
            
            assert stats_response.status_code == 200
            stats_data = stats_response.json()
            assert stats_data["total_problems"] == 1
            assert stats_data["categories"]["Software"] == 1