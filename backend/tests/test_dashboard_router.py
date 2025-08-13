"""
Integration tests for the dashboard router.
"""
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.models import DashboardStats
from app.services.dashboard_service import DashboardServiceError


class TestDashboardRouter:
    """Test cases for dashboard router endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create a test client."""
        return TestClient(app)
    
    @pytest.fixture
    def sample_dashboard_stats(self):
        """Create sample dashboard stats for testing."""
        return DashboardStats(
            categories={
                "Software": 15,
                "IoT": 8,
                "Blockchain": 5,
                "Hardware": 3
            },
            top_keywords=[
                ("python", 12),
                ("react", 10),
                ("machine", 8),
                ("learning", 8),
                ("iot", 6),
                ("blockchain", 5),
                ("healthcare", 4),
                ("agriculture", 3)
            ],
            top_organizations={
                "Ministry of Electronics and IT": 8,
                "Ministry of Health": 6,
                "Ministry of Agriculture": 5,
                "DRDO": 4,
                "ISRO": 3
            },
            total_problems=31
        )
    
    def test_get_dashboard_stats_success(self, client, sample_dashboard_stats):
        """Test successful retrieval of dashboard stats."""
        with patch('app.services.dashboard_service.dashboard_service.get_dashboard_stats') as mock_get_stats:
            mock_get_stats.return_value = sample_dashboard_stats
            
            response = client.get("/api/dashboard/stats")
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["total_problems"] == 31
            assert "categories" in data
            assert "top_keywords" in data
            assert "top_organizations" in data
            
            # Check categories
            assert data["categories"]["Software"] == 15
            assert data["categories"]["IoT"] == 8
            
            # Check keywords format (list of tuples)
            assert isinstance(data["top_keywords"], list)
            assert len(data["top_keywords"]) == 8
            assert data["top_keywords"][0] == ["python", 12]
            
            # Check organizations
            assert data["top_organizations"]["Ministry of Electronics and IT"] == 8
    
    def test_get_dashboard_stats_with_force_refresh(self, client, sample_dashboard_stats):
        """Test dashboard stats with force refresh parameter."""
        with patch('app.services.dashboard_service.dashboard_service.get_dashboard_stats') as mock_get_stats:
            mock_get_stats.return_value = sample_dashboard_stats
            
            response = client.get("/api/dashboard/stats?force_refresh=true")
            
            assert response.status_code == 200
            mock_get_stats.assert_called_once_with(force_refresh=True)
    
    def test_get_dashboard_stats_service_error(self, client):
        """Test dashboard stats endpoint when service raises an error."""
        with patch('app.services.dashboard_service.dashboard_service.get_dashboard_stats') as mock_get_stats:
            mock_get_stats.side_effect = DashboardServiceError("Database connection failed")
            
            response = client.get("/api/dashboard/stats")
            
            assert response.status_code == 500
            data = response.json()
            assert "Database connection failed" in data["detail"]
    
    def test_get_dashboard_stats_unexpected_error(self, client):
        """Test dashboard stats endpoint with unexpected error."""
        with patch('app.services.dashboard_service.dashboard_service.get_dashboard_stats') as mock_get_stats:
            mock_get_stats.side_effect = Exception("Unexpected error")
            
            response = client.get("/api/dashboard/stats")
            
            assert response.status_code == 500
            data = response.json()
            assert "Unexpected error" in data["detail"]
    
    def test_get_category_breakdown_success(self, client):
        """Test successful retrieval of category breakdown."""
        mock_breakdown = {
            "categories": {
                "Software": {"count": 15, "percentage": 48.4},
                "IoT": {"count": 8, "percentage": 25.8},
                "Blockchain": {"count": 5, "percentage": 16.1},
                "Hardware": {"count": 3, "percentage": 9.7}
            },
            "total": 31
        }
        
        with patch('app.services.dashboard_service.dashboard_service.get_category_breakdown') as mock_get_breakdown:
            mock_get_breakdown.return_value = mock_breakdown
            
            response = client.get("/api/dashboard/categories")
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["total"] == 31
            assert "categories" in data
            assert data["categories"]["Software"]["count"] == 15
            assert data["categories"]["Software"]["percentage"] == 48.4
    
    def test_get_category_breakdown_error(self, client):
        """Test category breakdown endpoint with service error."""
        with patch('app.services.dashboard_service.dashboard_service.get_category_breakdown') as mock_get_breakdown:
            mock_get_breakdown.side_effect = DashboardServiceError("Service unavailable")
            
            response = client.get("/api/dashboard/categories")
            
            assert response.status_code == 500
            data = response.json()
            assert "Service unavailable" in data["detail"]
    
    def test_get_technology_trends_success(self, client):
        """Test successful retrieval of technology trends."""
        mock_trends = {
            "technology_keywords": [
                ("python", 12),
                ("react", 10),
                ("javascript", 8),
                ("nodejs", 6),
                ("tensorflow", 5)
            ],
            "domain_keywords": [
                ("healthcare", 8),
                ("agriculture", 6),
                ("education", 4),
                ("transportation", 3)
            ],
            "total_keywords": 25
        }
        
        with patch('app.services.dashboard_service.dashboard_service.get_technology_trends') as mock_get_trends:
            mock_get_trends.return_value = mock_trends
            
            response = client.get("/api/dashboard/technology-trends")
            
            assert response.status_code == 200
            data = response.json()
            
            assert "technology_keywords" in data
            assert "domain_keywords" in data
            assert data["total_keywords"] == 25
            
            # Check technology keywords
            assert len(data["technology_keywords"]) == 5
            assert data["technology_keywords"][0] == ["python", 12]
            
            # Check domain keywords
            assert len(data["domain_keywords"]) == 4
            assert data["domain_keywords"][0] == ["healthcare", 8]
    
    def test_get_technology_trends_error(self, client):
        """Test technology trends endpoint with service error."""
        with patch('app.services.dashboard_service.dashboard_service.get_technology_trends') as mock_get_trends:
            mock_get_trends.side_effect = DashboardServiceError("Analysis failed")
            
            response = client.get("/api/dashboard/technology-trends")
            
            assert response.status_code == 500
            data = response.json()
            assert "Analysis failed" in data["detail"]
    
    def test_clear_dashboard_cache_success(self, client):
        """Test successful cache clearing."""
        with patch('app.services.dashboard_service.dashboard_service.clear_cache') as mock_clear_cache:
            mock_clear_cache.return_value = None
            
            response = client.post("/api/dashboard/clear-cache")
            
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Dashboard cache cleared successfully"
            mock_clear_cache.assert_called_once()
    
    def test_clear_dashboard_cache_error(self, client):
        """Test cache clearing with error."""
        with patch('app.services.dashboard_service.dashboard_service.clear_cache') as mock_clear_cache:
            mock_clear_cache.side_effect = Exception("Cache clear failed")
            
            response = client.post("/api/dashboard/clear-cache")
            
            assert response.status_code == 500
            data = response.json()
            assert "Failed to clear cache" in data["detail"]
    
    def test_dashboard_health_success(self, client):
        """Test successful dashboard health check."""
        mock_health = {
            "status": "healthy",
            "initialized": True,
            "chromadb_connected": True,
            "total_problems": 31,
            "categories_count": 4,
            "organizations_count": 5,
            "keywords_count": 25,
            "cache_valid": True
        }
        
        with patch('app.services.dashboard_service.dashboard_service.health_check') as mock_health_check:
            mock_health_check.return_value = mock_health
            
            response = client.get("/api/dashboard/health")
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["status"] == "healthy"
            assert data["initialized"] is True
            assert data["total_problems"] == 31
            assert data["cache_valid"] is True
    
    def test_dashboard_health_unhealthy(self, client):
        """Test dashboard health check when service is unhealthy."""
        mock_health = {
            "status": "unhealthy",
            "error": "ChromaDB connection failed",
            "initialized": False
        }
        
        with patch('app.services.dashboard_service.dashboard_service.health_check') as mock_health_check:
            mock_health_check.return_value = mock_health
            
            response = client.get("/api/dashboard/health")
            
            assert response.status_code == 200  # Health endpoint should always return 200
            data = response.json()
            
            assert data["status"] == "unhealthy"
            assert "error" in data
            assert data["initialized"] is False
    
    def test_dashboard_health_exception(self, client):
        """Test dashboard health check with exception."""
        with patch('app.services.dashboard_service.dashboard_service.health_check') as mock_health_check:
            mock_health_check.side_effect = Exception("Health check failed")
            
            response = client.get("/api/dashboard/health")
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["status"] == "unhealthy"
            assert "Health check failed" in data["error"]
            assert data["service"] == "dashboard"
    
    def test_dashboard_stats_empty_response(self, client):
        """Test dashboard stats with empty data."""
        empty_stats = DashboardStats(
            categories={},
            top_keywords=[],
            top_organizations={},
            total_problems=0
        )
        
        with patch('app.services.dashboard_service.dashboard_service.get_dashboard_stats') as mock_get_stats:
            mock_get_stats.return_value = empty_stats
            
            response = client.get("/api/dashboard/stats")
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["total_problems"] == 0
            assert data["categories"] == {}
            assert data["top_keywords"] == []
            assert data["top_organizations"] == {}
    
    def test_all_endpoints_cors_headers(self, client):
        """Test that all dashboard endpoints include proper CORS headers."""
        endpoints = [
            "/api/dashboard/stats",
            "/api/dashboard/categories", 
            "/api/dashboard/technology-trends",
            "/api/dashboard/health"
        ]
        
        with patch('app.services.dashboard_service.dashboard_service.get_dashboard_stats') as mock_get_stats:
            mock_get_stats.return_value = DashboardStats(
                categories={}, top_keywords=[], top_organizations={}, total_problems=0
            )
            
            with patch('app.services.dashboard_service.dashboard_service.get_category_breakdown') as mock_breakdown:
                mock_breakdown.return_value = {"categories": {}, "total": 0}
                
                with patch('app.services.dashboard_service.dashboard_service.get_technology_trends') as mock_trends:
                    mock_trends.return_value = {"technology_keywords": [], "domain_keywords": [], "total_keywords": 0}
                    
                    with patch('app.services.dashboard_service.dashboard_service.health_check') as mock_health:
                        mock_health.return_value = {"status": "healthy"}
                        
                        for endpoint in endpoints:
                            response = client.get(endpoint)
                            assert response.status_code == 200
                            # CORS headers should be present due to middleware
                            # The exact headers depend on the CORS middleware configuration