"""
Unit tests for the dashboard service.
"""
import pytest
import json
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta

from app.services.dashboard_service import DashboardService, DashboardServiceError
from app.models import DashboardStats


class TestDashboardService:
    """Test cases for DashboardService."""
    
    @pytest.fixture
    def dashboard_service(self):
        """Create a dashboard service instance for testing."""
        service = DashboardService()
        return service
    
    @pytest.fixture
    def mock_chroma_client(self):
        """Create a mock ChromaDB client."""
        mock_client = Mock()
        mock_collection = Mock()
        
        # Mock heartbeat
        mock_client.heartbeat.return_value = None
        
        # Mock get_collection
        mock_client.get_collection.return_value = mock_collection
        
        return mock_client, mock_collection
    
    @pytest.fixture
    def sample_problem_data(self):
        """Create sample problem data for testing."""
        return [
            {
                "id": "sih_001",
                "metadata": {
                    "title": "AI-Based Traffic Management System",
                    "organization": "Ministry of Road Transport",
                    "category": "Software",
                    "technology_stack": '["Python", "TensorFlow", "OpenCV"]',
                    "difficulty_level": "Hard"
                },
                "document": "AI-Based Traffic Management System\nDevelop an AI-powered traffic management system\nTech Stack: Python TensorFlow OpenCV"
            },
            {
                "id": "sih_002",
                "metadata": {
                    "title": "Smart Agriculture Platform",
                    "organization": "Ministry of Agriculture",
                    "category": "IoT",
                    "technology_stack": '["Arduino", "Python", "React"]',
                    "difficulty_level": "Medium"
                },
                "document": "Smart Agriculture Platform\nCreate an IoT-based platform for monitoring crop health\nTech Stack: Arduino Python React"
            },
            {
                "id": "sih_003",
                "metadata": {
                    "title": "Blockchain Identity System",
                    "organization": "Ministry of Electronics",
                    "category": "Blockchain",
                    "technology_stack": '["Solidity", "Ethereum", "Web3.js"]',
                    "difficulty_level": "Hard"
                },
                "document": "Blockchain Identity System\nDevelop a secure digital identity management system\nTech Stack: Solidity Ethereum Web3.js"
            },
            {
                "id": "sih_004",
                "metadata": {
                    "title": "Healthcare Appointment System",
                    "organization": "Ministry of Health",
                    "category": "Software",
                    "technology_stack": '["Node.js", "React", "MySQL"]',
                    "difficulty_level": "Medium"
                },
                "document": "Healthcare Appointment System\nBuild a comprehensive appointment scheduling system\nTech Stack: Node.js React MySQL"
            }
        ]
    
    @pytest.mark.asyncio
    async def test_initialize_success(self, dashboard_service, mock_chroma_client):
        """Test successful initialization of dashboard service."""
        mock_client, mock_collection = mock_chroma_client
        
        with patch('chromadb.HttpClient', return_value=mock_client):
            await dashboard_service.initialize()
            
            assert dashboard_service._initialized is True
            assert dashboard_service.chroma_client == mock_client
            assert dashboard_service.collection == mock_collection
    
    @pytest.mark.asyncio
    async def test_initialize_connection_failure(self, dashboard_service):
        """Test initialization failure when ChromaDB connection fails."""
        with patch('chromadb.HttpClient') as mock_http_client:
            mock_http_client.side_effect = Exception("Connection failed")
            
            with pytest.raises(DashboardServiceError, match="Dashboard service initialization failed"):
                await dashboard_service.initialize()
    
    def test_extract_keywords_from_text(self, dashboard_service):
        """Test keyword extraction from text."""
        text = "Develop an AI-powered traffic management system using machine learning algorithms"
        keywords = dashboard_service._extract_keywords_from_text(text)
        
        # Should extract meaningful keywords and filter stop words
        # Note: "AI-powered" becomes "ai" and "powered" separately due to regex word boundaries
        expected_keywords = ["develop", "powered", "traffic", "management", "machine", "learning", "algorithms"]
        
        # Check that most expected keywords are present (some may be filtered differently)
        present_keywords = [kw for kw in expected_keywords if kw in keywords]
        assert len(present_keywords) >= 5  # At least 5 out of 7 should be present
        
        # Verify stop words are filtered
        assert "an" not in keywords  # Stop word should be filtered
        assert "the" not in keywords  # Stop word should be filtered
        assert "using" not in keywords  # Stop word should be filtered
    
    def test_extract_tech_keywords(self, dashboard_service):
        """Test technology keyword extraction and normalization."""
        tech_stack = ["Python", "React.js", "Node.js", "PostgreSQL", "TensorFlow"]
        tech_keywords = dashboard_service._extract_tech_keywords(tech_stack)
        
        expected = ["python", "react", "nodejs", "postgres", "tensorflow"]
        assert tech_keywords == expected
    
    def test_analyze_categories(self, dashboard_service, sample_problem_data):
        """Test category analysis."""
        categories = dashboard_service._analyze_categories(sample_problem_data)
        
        expected_categories = {
            "Software": 2,
            "IoT": 1,
            "Blockchain": 1
        }
        assert categories == expected_categories
    
    def test_analyze_organizations(self, dashboard_service, sample_problem_data):
        """Test organization analysis."""
        organizations = dashboard_service._analyze_organizations(sample_problem_data)
        
        expected_organizations = {
            "Ministry of Road Transport": 1,
            "Ministry of Agriculture": 1,
            "Ministry of Electronics": 1,
            "Ministry of Health": 1
        }
        assert organizations == expected_organizations
    
    def test_analyze_keywords(self, dashboard_service, sample_problem_data):
        """Test keyword analysis."""
        keywords = dashboard_service._analyze_keywords(sample_problem_data, top_n=10)
        
        # Should return list of tuples (keyword, count)
        assert isinstance(keywords, list)
        assert all(isinstance(item, tuple) and len(item) == 2 for item in keywords)
        
        # Technology keywords should have higher weight
        keyword_dict = dict(keywords)
        
        # These tech keywords should appear with higher counts due to weighting
        assert "python" in keyword_dict
        assert "react" in keyword_dict
    
    def test_generate_dashboard_stats(self, dashboard_service, sample_problem_data):
        """Test dashboard statistics generation."""
        stats = dashboard_service._generate_dashboard_stats(sample_problem_data)
        
        assert isinstance(stats, DashboardStats)
        assert stats.total_problems == 4
        assert len(stats.categories) == 3
        assert "Software" in stats.categories
        assert stats.categories["Software"] == 2
        assert len(stats.top_organizations) > 0
        assert len(stats.top_keywords) > 0
    
    @pytest.mark.asyncio
    async def test_fetch_all_problem_data(self, dashboard_service, mock_chroma_client, sample_problem_data):
        """Test fetching all problem data from ChromaDB."""
        mock_client, mock_collection = mock_chroma_client
        
        # Mock collection.count()
        mock_collection.count.return_value = len(sample_problem_data)
        
        # Mock collection.get() for batch fetching
        mock_collection.get.return_value = {
            "ids": [item["id"] for item in sample_problem_data],
            "metadatas": [item["metadata"] for item in sample_problem_data],
            "documents": [item["document"] for item in sample_problem_data]
        }
        
        dashboard_service.chroma_client = mock_client
        dashboard_service.collection = mock_collection
        dashboard_service._initialized = True
        
        result = await dashboard_service._fetch_all_problem_data()
        
        assert len(result) == 4
        assert result[0]["id"] == "sih_001"
        assert result[0]["metadata"]["title"] == "AI-Based Traffic Management System"
    
    @pytest.mark.asyncio
    async def test_get_dashboard_stats_with_cache(self, dashboard_service, sample_problem_data):
        """Test getting dashboard stats with caching."""
        # Mock the fetch method
        async def mock_fetch():
            return sample_problem_data
        
        dashboard_service._fetch_all_problem_data = mock_fetch
        dashboard_service._initialized = True
        
        # First call should generate stats and cache them
        stats1 = await dashboard_service.get_dashboard_stats()
        assert isinstance(stats1, DashboardStats)
        assert stats1.total_problems == 4
        
        # Second call should return cached stats
        stats2 = await dashboard_service.get_dashboard_stats()
        assert stats2 == stats1
        
        # Verify cache is being used
        assert dashboard_service._is_cache_valid()
    
    @pytest.mark.asyncio
    async def test_get_dashboard_stats_force_refresh(self, dashboard_service, sample_problem_data):
        """Test forcing refresh of dashboard stats."""
        async def mock_fetch():
            return sample_problem_data
        
        dashboard_service._fetch_all_problem_data = mock_fetch
        dashboard_service._initialized = True
        
        # First call
        stats1 = await dashboard_service.get_dashboard_stats()
        
        # Force refresh should bypass cache
        stats2 = await dashboard_service.get_dashboard_stats(force_refresh=True)
        
        # Stats should be the same but freshly generated
        assert stats1.total_problems == stats2.total_problems
    
    @pytest.mark.asyncio
    async def test_get_category_breakdown(self, dashboard_service, sample_problem_data):
        """Test getting category breakdown with percentages."""
        async def mock_get_stats():
            return DashboardStats(
                categories={"Software": 2, "IoT": 1, "Blockchain": 1},
                top_keywords=[("python", 5), ("react", 3)],
                top_organizations={"Ministry A": 2, "Ministry B": 2},
                total_problems=4
            )
        
        dashboard_service.get_dashboard_stats = mock_get_stats
        
        breakdown = await dashboard_service.get_category_breakdown()
        
        assert breakdown["total"] == 4
        assert breakdown["categories"]["Software"]["count"] == 2
        assert breakdown["categories"]["Software"]["percentage"] == 50.0
        assert breakdown["categories"]["IoT"]["percentage"] == 25.0
    
    @pytest.mark.asyncio
    async def test_get_technology_trends(self, dashboard_service):
        """Test getting technology trends."""
        async def mock_get_stats():
            return DashboardStats(
                categories={"Software": 2},
                top_keywords=[
                    ("python", 10), ("react", 8), ("healthcare", 6), 
                    ("javascript", 5), ("agriculture", 4), ("nodejs", 3)
                ],
                top_organizations={"Ministry A": 2},
                total_problems=4
            )
        
        dashboard_service.get_dashboard_stats = mock_get_stats
        
        trends = await dashboard_service.get_technology_trends()
        
        assert "technology_keywords" in trends
        assert "domain_keywords" in trends
        assert len(trends["technology_keywords"]) > 0
        assert len(trends["domain_keywords"]) > 0
        
        # Check that tech keywords are properly identified
        tech_keywords = [kw[0] for kw in trends["technology_keywords"]]
        assert "python" in tech_keywords
        assert "react" in tech_keywords
    
    @pytest.mark.asyncio
    async def test_clear_cache(self, dashboard_service):
        """Test clearing the cache."""
        # Set some cache data
        dashboard_service._cache = {"stats": "test_data"}
        dashboard_service._cache_timestamp = datetime.now()
        
        await dashboard_service.clear_cache()
        
        assert len(dashboard_service._cache) == 0
        assert dashboard_service._cache_timestamp is None
    
    def test_is_cache_valid(self, dashboard_service):
        """Test cache validity checking."""
        # No cache timestamp
        assert not dashboard_service._is_cache_valid()
        
        # Recent timestamp
        dashboard_service._cache_timestamp = datetime.now()
        assert dashboard_service._is_cache_valid()
        
        # Old timestamp
        dashboard_service._cache_timestamp = datetime.now() - timedelta(minutes=20)
        assert not dashboard_service._is_cache_valid()
    
    @pytest.mark.asyncio
    async def test_health_check_healthy(self, dashboard_service):
        """Test health check when service is healthy."""
        async def mock_get_stats():
            return DashboardStats(
                categories={"Software": 2},
                top_keywords=[("python", 5)],
                top_organizations={"Ministry A": 2},
                total_problems=4
            )
        
        dashboard_service._initialized = True
        dashboard_service.collection = Mock()
        dashboard_service.get_dashboard_stats = mock_get_stats
        
        health = await dashboard_service.health_check()
        
        assert health["status"] == "healthy"
        assert health["initialized"] is True
        assert health["chromadb_connected"] is True
        assert health["total_problems"] == 4
    
    @pytest.mark.asyncio
    async def test_health_check_unhealthy(self, dashboard_service):
        """Test health check when service is unhealthy."""
        dashboard_service._initialized = False
        
        with patch.object(dashboard_service, 'initialize', side_effect=Exception("Init failed")):
            health = await dashboard_service.health_check()
            
            assert health["status"] == "unhealthy"
            assert "error" in health
    
    @pytest.mark.asyncio
    async def test_get_dashboard_stats_no_data(self, dashboard_service):
        """Test getting dashboard stats when no data is available."""
        async def mock_fetch():
            return []
        
        dashboard_service._fetch_all_problem_data = mock_fetch
        dashboard_service._initialized = True
        
        stats = await dashboard_service.get_dashboard_stats()
        
        assert stats.total_problems == 0
        assert len(stats.categories) == 0
        assert len(stats.top_keywords) == 0
        assert len(stats.top_organizations) == 0
    
    @pytest.mark.asyncio
    async def test_fetch_all_problem_data_error(self, dashboard_service, mock_chroma_client):
        """Test error handling when fetching problem data fails."""
        mock_client, mock_collection = mock_chroma_client
        mock_collection.count.side_effect = Exception("Database error")
        
        dashboard_service.chroma_client = mock_client
        dashboard_service.collection = mock_collection
        dashboard_service._initialized = True
        
        with pytest.raises(DashboardServiceError, match="Failed to fetch problem data"):
            await dashboard_service._fetch_all_problem_data()