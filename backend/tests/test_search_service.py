"""
Unit tests for the search service functionality.
"""
import json
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime

from app.services.search_service import SearchService, SearchServiceError
from app.models import ProblemStatement, SearchResult


class TestSearchService:
    """Test cases for SearchService class."""
    
    @pytest.fixture
    def search_service(self):
        """Create a SearchService instance for testing."""
        return SearchService()
    
    @pytest.fixture
    def mock_chroma_collection(self):
        """Create a mock ChromaDB collection."""
        collection = Mock()
        collection.count.return_value = 5
        return collection
    
    @pytest.fixture
    def mock_sentence_model(self):
        """Create a mock sentence transformer model."""
        model = Mock()
        # Mock embedding as a list of lists (like sentence-transformers returns)
        model.encode.return_value = [[0.1, 0.2, 0.3, 0.4, 0.5]]
        return model
    
    @pytest.fixture
    def sample_chroma_results(self):
        """Sample ChromaDB query results."""
        return {
            "ids": [["sih_001", "sih_002"]],
            "metadatas": [[
                {
                    "title": "AI-Based Traffic Management",
                    "organization": "Ministry of Transport",
                    "category": "Software",
                    "technology_stack": '["Python", "TensorFlow", "OpenCV"]',
                    "difficulty_level": "Hard",
                    "created_at": "2024-01-01T00:00:00"
                },
                {
                    "title": "Smart Agriculture Platform",
                    "organization": "Ministry of Agriculture",
                    "category": "IoT",
                    "technology_stack": '["Arduino", "Python", "React"]',
                    "difficulty_level": "Medium",
                    "created_at": "2024-01-02T00:00:00"
                }
            ]],
            "documents": [[
                "AI-Based Traffic Management\nDevelop an AI-powered traffic management system\nTech Stack: Python TensorFlow OpenCV",
                "Smart Agriculture Platform\nCreate an IoT-based platform for monitoring crop health\nTech Stack: Arduino Python React"
            ]],
            "distances": [[0.2, 0.4]]
        }
    
    @pytest.mark.asyncio
    async def test_initialize_success(self, search_service):
        """Test successful initialization of search service."""
        with patch('app.services.search_service.SentenceTransformer') as mock_st, \
             patch('app.services.search_service.chromadb.HttpClient') as mock_client:
            
            # Mock sentence transformer
            mock_model = Mock()
            mock_st.return_value = mock_model
            
            # Mock ChromaDB client
            mock_chroma_client = Mock()
            mock_chroma_client.heartbeat.return_value = None
            mock_collection = Mock()
            mock_chroma_client.get_collection.return_value = mock_collection
            mock_client.return_value = mock_chroma_client
            
            # Initialize
            await search_service.initialize()
            
            # Assertions
            assert search_service._initialized is True
            assert search_service.sentence_model == mock_model
            assert search_service.chroma_client == mock_chroma_client
            assert search_service.collection == mock_collection
            
            # Verify calls
            mock_st.assert_called_once_with("all-MiniLM-L6-v2")
            mock_client.assert_called_once_with(host="chroma-db", port=8000)
            mock_chroma_client.heartbeat.assert_called_once()
            mock_chroma_client.get_collection.assert_called_once_with(name="problem_statements")
    
    @pytest.mark.asyncio
    async def test_initialize_chromadb_connection_failure(self, search_service):
        """Test initialization failure when ChromaDB connection fails."""
        with patch('app.services.search_service.SentenceTransformer') as mock_st, \
             patch('app.services.search_service.chromadb.HttpClient') as mock_client:
            
            # Mock sentence transformer
            mock_st.return_value = Mock()
            
            # Mock ChromaDB client failure
            mock_client.side_effect = Exception("Connection failed")
            
            # Test initialization failure
            with pytest.raises(SearchServiceError, match="Search service initialization failed"):
                await search_service.initialize()
            
            assert search_service._initialized is False
    
    @pytest.mark.asyncio
    async def test_search_success(self, search_service, mock_chroma_collection, mock_sentence_model, sample_chroma_results):
        """Test successful semantic search."""
        # Setup mocks
        search_service._initialized = True
        search_service.sentence_model = mock_sentence_model
        search_service.collection = mock_chroma_collection
        mock_chroma_collection.query.return_value = sample_chroma_results
        
        # Perform search
        results = await search_service.search("machine learning", limit=10)
        
        # Assertions
        assert len(results) == 2
        assert all(isinstance(result, SearchResult) for result in results)
        
        # Check first result
        first_result = results[0]
        assert first_result.problem.id == "sih_001"
        assert first_result.problem.title == "AI-Based Traffic Management"
        assert first_result.problem.organization == "Ministry of Transport"
        assert first_result.problem.category == "Software"
        assert first_result.problem.technology_stack == ["Python", "TensorFlow", "OpenCV"]
        assert first_result.problem.difficulty_level == "Hard"
        assert first_result.similarity_score == 0.8  # 1.0 - 0.2 distance
        
        # Check second result
        second_result = results[1]
        assert second_result.problem.id == "sih_002"
        assert second_result.similarity_score == 0.6  # 1.0 - 0.4 distance
        
        # Verify method calls
        mock_sentence_model.encode.assert_called_once_with(["machine learning"])
        mock_chroma_collection.query.assert_called_once_with(
            query_embeddings=[[0.1, 0.2, 0.3, 0.4, 0.5]],
            n_results=10,
            include=["metadatas", "documents", "distances"]
        )
    
    @pytest.mark.asyncio
    async def test_search_not_initialized(self, search_service):
        """Test search when service is not initialized."""
        # Set up the service as not initialized
        search_service._initialized = False
        
        with patch.object(search_service, 'initialize', new_callable=AsyncMock) as mock_init:
            # Mock successful initialization
            async def mock_initialize():
                search_service._initialized = True
                search_service.sentence_model = Mock()
                search_service.sentence_model.encode.return_value = [[0.1, 0.2, 0.3]]
                search_service.collection = Mock()
                search_service.collection.query.return_value = {
                    "ids": [[]],
                    "metadatas": [[]],
                    "documents": [[]],
                    "distances": [[]]
                }
            
            mock_init.side_effect = mock_initialize
            
            # This should trigger initialization
            results = await search_service.search("test query")
            
            # Verify initialization was called
            mock_init.assert_called_once()
            assert isinstance(results, list)
    
    @pytest.mark.asyncio
    async def test_search_empty_results(self, search_service, mock_chroma_collection, mock_sentence_model):
        """Test search with no results."""
        # Setup mocks
        search_service._initialized = True
        search_service.sentence_model = mock_sentence_model
        search_service.collection = mock_chroma_collection
        
        # Mock empty results
        empty_results = {
            "ids": [[]],
            "metadatas": [[]],
            "documents": [[]],
            "distances": [[]]
        }
        mock_chroma_collection.query.return_value = empty_results
        
        # Perform search
        results = await search_service.search("nonexistent query")
        
        # Assertions
        assert len(results) == 0
        assert isinstance(results, list)
    
    @pytest.mark.asyncio
    async def test_search_chromadb_error(self, search_service, mock_chroma_collection, mock_sentence_model):
        """Test search when ChromaDB query fails."""
        # Setup mocks
        search_service._initialized = True
        search_service.sentence_model = mock_sentence_model
        search_service.collection = mock_chroma_collection
        mock_chroma_collection.query.side_effect = Exception("ChromaDB query failed")
        
        # Test search failure
        with pytest.raises(SearchServiceError, match="Search operation failed"):
            await search_service.search("test query")
    
    @pytest.mark.asyncio
    async def test_get_problem_by_id_success(self, search_service, mock_chroma_collection):
        """Test successful retrieval of problem by ID."""
        # Setup mocks
        search_service._initialized = True
        search_service.collection = mock_chroma_collection
        
        # Mock get results
        get_results = {
            "ids": ["sih_001"],
            "metadatas": [{
                "title": "AI-Based Traffic Management",
                "organization": "Ministry of Transport",
                "category": "Software",
                "technology_stack": '["Python", "TensorFlow"]',
                "difficulty_level": "Hard",
                "created_at": "2024-01-01T00:00:00"
            }],
            "documents": ["AI-Based Traffic Management\nDevelop an AI system\nTech Stack: Python TensorFlow"]
        }
        mock_chroma_collection.get.return_value = get_results
        
        # Get problem by ID
        problem = await search_service.get_problem_by_id("sih_001")
        
        # Assertions
        assert problem is not None
        assert isinstance(problem, ProblemStatement)
        assert problem.id == "sih_001"
        assert problem.title == "AI-Based Traffic Management"
        assert problem.organization == "Ministry of Transport"
        assert problem.technology_stack == ["Python", "TensorFlow"]
        
        # Verify method call
        mock_chroma_collection.get.assert_called_once_with(
            ids=["sih_001"],
            include=["metadatas", "documents"]
        )
    
    @pytest.mark.asyncio
    async def test_get_problem_by_id_not_found(self, search_service, mock_chroma_collection):
        """Test retrieval of non-existent problem by ID."""
        # Setup mocks
        search_service._initialized = True
        search_service.collection = mock_chroma_collection
        
        # Mock empty results
        mock_chroma_collection.get.return_value = {"ids": [], "metadatas": [], "documents": []}
        
        # Get non-existent problem
        problem = await search_service.get_problem_by_id("nonexistent")
        
        # Assertions
        assert problem is None
    
    @pytest.mark.asyncio
    async def test_get_collection_stats_success(self, search_service, mock_chroma_collection):
        """Test successful retrieval of collection statistics."""
        # Setup mocks
        search_service._initialized = True
        search_service.collection = mock_chroma_collection
        mock_chroma_collection.count.return_value = 100
        
        # Mock get results for stats
        stats_results = {
            "metadatas": [
                {"category": "Software", "organization": "Ministry A"},
                {"category": "IoT", "organization": "Ministry B"},
                {"category": "Software", "organization": "Ministry A"},
                {"category": "Blockchain", "organization": "Ministry C"}
            ]
        }
        mock_chroma_collection.get.return_value = stats_results
        
        # Get stats
        stats = await search_service.get_collection_stats()
        
        # Assertions
        assert stats["total_problems"] == 100
        assert stats["categories"] == {"Software": 2, "IoT": 1, "Blockchain": 1}
        assert stats["organizations"] == {"Ministry A": 2, "Ministry B": 1, "Ministry C": 1}
        assert stats["collection_name"] == "problem_statements"
    
    @pytest.mark.asyncio
    async def test_health_check_healthy(self, search_service):
        """Test health check when service is healthy."""
        # Mock successful initialization and search
        with patch.object(search_service, 'initialize', new_callable=AsyncMock), \
             patch.object(search_service, 'search', new_callable=AsyncMock) as mock_search, \
             patch.object(search_service, 'get_collection_stats', new_callable=AsyncMock) as mock_stats:
            
            search_service._initialized = True
            search_service.sentence_model = Mock()
            search_service.collection = Mock()
            
            mock_search.return_value = [Mock()]  # One test result
            mock_stats.return_value = {"total_problems": 100}
            
            # Perform health check
            health = await search_service.health_check()
            
            # Assertions
            assert health["status"] == "healthy"
            assert health["initialized"] is True
            assert health["model_loaded"] is True
            assert health["chromadb_connected"] is True
            assert health["total_problems"] == 100
            assert health["test_query_results"] == 1
    
    @pytest.mark.asyncio
    async def test_health_check_unhealthy(self, search_service):
        """Test health check when service is unhealthy."""
        # Mock initialization failure
        with patch.object(search_service, 'initialize', new_callable=AsyncMock) as mock_init:
            mock_init.side_effect = Exception("Initialization failed")
            
            # Perform health check
            health = await search_service.health_check()
            
            # Assertions
            assert health["status"] == "unhealthy"
            assert "error" in health
            assert health["initialized"] is False
    
    def test_convert_metadata_to_problem_success(self, search_service):
        """Test successful conversion of metadata to ProblemStatement."""
        metadata = {
            "title": "Test Problem",
            "organization": "Test Org",
            "category": "Software",
            "technology_stack": '["Python", "React"]',
            "difficulty_level": "Medium",
            "created_at": "2024-01-01T00:00:00"
        }
        document = "Test Problem\nThis is a test problem description\nTech Stack: Python React"
        
        result = search_service._convert_metadata_to_problem("test_001", metadata, document, 0.3)
        
        # Assertions
        assert isinstance(result, SearchResult)
        assert result.problem.id == "test_001"
        assert result.problem.title == "Test Problem"
        assert result.problem.organization == "Test Org"
        assert result.problem.category == "Software"
        assert result.problem.description == "This is a test problem description"
        assert result.problem.technology_stack == ["Python", "React"]
        assert result.problem.difficulty_level == "Medium"
        assert result.similarity_score == 0.7  # 1.0 - 0.3 distance
    
    def test_convert_metadata_to_problem_invalid_tech_stack(self, search_service):
        """Test conversion with invalid technology stack JSON."""
        metadata = {
            "title": "Test Problem",
            "organization": "Test Org",
            "category": "Software",
            "technology_stack": 'invalid json',  # Invalid JSON
            "difficulty_level": "Medium",
            "created_at": "2024-01-01T00:00:00"
        }
        document = "Test Problem\nTest description\nTech Stack: Python"
        
        result = search_service._convert_metadata_to_problem("test_001", metadata, document, 0.2)
        
        # Should handle invalid JSON gracefully
        assert result.problem.technology_stack == []
        assert result.similarity_score == 0.8
    
    def test_convert_metadata_to_problem_missing_description(self, search_service):
        """Test conversion when description is missing from metadata."""
        metadata = {
            "title": "Test Problem",
            "organization": "Test Org",
            "category": "Software",
            "technology_stack": '["Python"]',
            "difficulty_level": "Medium",
            "created_at": "2024-01-01T00:00:00"
            # No description in metadata
        }
        document = "Test Problem\nExtracted description from document\nTech Stack: Python"
        
        result = search_service._convert_metadata_to_problem("test_001", metadata, document, 0.1)
        
        # Should extract description from document
        assert result.problem.description == "Extracted description from document"
    
    def test_convert_metadata_to_problem_conversion_error(self, search_service):
        """Test conversion when there's an error in processing."""
        metadata = {
            "title": "Test Problem",
            # Missing required fields to trigger error handling
        }
        document = "Test Problem\nFallback description"
        
        # This should not raise an exception but return a minimal result
        result = search_service._convert_metadata_to_problem("test_001", metadata, document, 0.5)
        
        assert isinstance(result, SearchResult)
        assert result.problem.id == "test_001"
        assert result.problem.title == "Test Problem"
        assert result.problem.organization == "Unknown"  # Default value
        assert result.similarity_score == 0.5


@pytest.mark.asyncio
class TestSearchServiceIntegration:
    """Integration tests for SearchService with mocked external dependencies."""
    
    @pytest.fixture
    def search_service_with_mocks(self):
        """Create a SearchService with all external dependencies mocked."""
        service = SearchService()
        
        # Mock sentence transformer
        mock_model = Mock()
        mock_model.encode.return_value = [[0.1, 0.2, 0.3]]
        service.sentence_model = mock_model
        
        # Mock ChromaDB collection
        mock_collection = Mock()
        service.collection = mock_collection
        service.chroma_client = Mock()
        
        service._initialized = True
        return service, mock_collection, mock_model
    
    async def test_full_search_workflow(self, search_service_with_mocks):
        """Test the complete search workflow from query to results."""
        service, mock_collection, mock_model = search_service_with_mocks
        
        # Setup mock responses
        mock_collection.query.return_value = {
            "ids": [["prob_1", "prob_2"]],
            "metadatas": [[
                {
                    "title": "ML Problem",
                    "organization": "Tech Ministry",
                    "category": "AI",
                    "technology_stack": '["Python", "TensorFlow"]',
                    "difficulty_level": "Hard",
                    "created_at": "2024-01-01T00:00:00"
                },
                {
                    "title": "Web Problem",
                    "organization": "Digital Ministry",
                    "category": "Web",
                    "technology_stack": '["JavaScript", "React"]',
                    "difficulty_level": "Medium",
                    "created_at": "2024-01-02T00:00:00"
                }
            ]],
            "documents": [[
                "ML Problem\nMachine learning problem description\nTech Stack: Python TensorFlow",
                "Web Problem\nWeb development problem description\nTech Stack: JavaScript React"
            ]],
            "distances": [[0.1, 0.3]]
        }
        
        # Perform search
        results = await service.search("machine learning web development", limit=5)
        
        # Verify results
        assert len(results) == 2
        
        # Check first result (ML Problem)
        ml_result = results[0]
        assert ml_result.problem.title == "ML Problem"
        assert ml_result.problem.category == "AI"
        assert ml_result.problem.technology_stack == ["Python", "TensorFlow"]
        assert ml_result.similarity_score == 0.9  # 1.0 - 0.1
        
        # Check second result (Web Problem)
        web_result = results[1]
        assert web_result.problem.title == "Web Problem"
        assert web_result.problem.category == "Web"
        assert web_result.problem.technology_stack == ["JavaScript", "React"]
        assert web_result.similarity_score == 0.7  # 1.0 - 0.3
        
        # Verify the search query was processed correctly
        mock_model.encode.assert_called_once_with(["machine learning web development"])
        mock_collection.query.assert_called_once_with(
            query_embeddings=[[0.1, 0.2, 0.3]],
            n_results=5,
            include=["metadatas", "documents", "distances"]
        )