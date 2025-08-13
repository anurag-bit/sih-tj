"""
Integration tests for the chat router endpoints.
"""
import json
import pytest
from unittest.mock import patch, Mock, AsyncMock
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


class TestChatRouter:
    """Test cases for chat router endpoints."""
    
    @pytest.fixture
    def mock_chat_service(self):
        """Mock the chat service for testing."""
        with patch('backend.app.routers.chat.get_chat_service') as mock:
            service_mock = Mock()
            mock.return_value = service_mock
            yield service_mock
    
    @pytest.fixture
    def valid_chat_request(self):
        """Valid chat request data for testing."""
        return {
            "problem_id": "test_problem_001",
            "problem_context": """
            Develop a machine learning solution for healthcare technology 
            implementation that can solve problems in rural areas using 
            advanced algorithms and modern technology stack to implement
            innovative solutions for better healthcare delivery.
            """,
            "user_question": "What would be a good tech stack for this problem?"
        }
    
    def test_chat_endpoint_success(self, mock_chat_service, valid_chat_request):
        """Test successful chat response."""
        expected_response = "I recommend using Python with TensorFlow for this healthcare ML solution."
        mock_chat_service.generate_response = AsyncMock(return_value=expected_response)
        
        response = client.post("/api/chat/", json=valid_chat_request)
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert data["response"] == expected_response
        assert "timestamp" in data
        
        # Verify the service was called with correct parameters
        mock_chat_service.generate_response.assert_called_once_with(
            problem_context=valid_chat_request["problem_context"],
            user_question=valid_chat_request["user_question"]
        )
    
    def test_chat_endpoint_invalid_context(self, mock_chat_service, valid_chat_request):
        """Test chat endpoint with invalid context."""
        mock_chat_service.generate_response = AsyncMock(
            side_effect=ValueError("Invalid or insufficient problem context provided")
        )
        
        response = client.post("/api/chat/", json=valid_chat_request)
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "Invalid request" in data["detail"]
    
    def test_chat_endpoint_api_error(self, mock_chat_service, valid_chat_request):
        """Test chat endpoint when API call fails."""
        mock_chat_service.generate_response = AsyncMock(
            side_effect=Exception("Gemini API error")
        )
        
        response = client.post("/api/chat/", json=valid_chat_request)
        
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "Failed to generate chat response" in data["detail"]
    
    def test_chat_endpoint_missing_fields(self):
        """Test chat endpoint with missing required fields."""
        incomplete_request = {
            "problem_id": "test_problem_001",
            # Missing problem_context and user_question
        }
        
        response = client.post("/api/chat/", json=incomplete_request)
        
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data
    
    def test_chat_stream_endpoint_success(self, mock_chat_service, valid_chat_request):
        """Test successful streaming chat response."""
        expected_chunks = ["I recommend", " using Python", " with TensorFlow"]
        
        async def mock_streaming_generator():
            for chunk in expected_chunks:
                yield chunk
        
        mock_chat_service._validate_context.return_value = True
        mock_chat_service.generate_streaming_response.return_value = mock_streaming_generator()
        
        response = client.post("/api/chat/stream", json=valid_chat_request)
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/plain; charset=utf-8"
        
        # Verify the service was called
        mock_chat_service._validate_context.assert_called_once_with(
            valid_chat_request["problem_context"]
        )
    
    def test_chat_stream_endpoint_invalid_context(self, mock_chat_service, valid_chat_request):
        """Test streaming chat endpoint with invalid context."""
        mock_chat_service._validate_context.return_value = False
        
        response = client.post("/api/chat/stream", json=valid_chat_request)
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "Invalid or insufficient problem context" in data["detail"]
    
    def test_chat_stream_endpoint_setup_error(self, mock_chat_service, valid_chat_request):
        """Test streaming chat endpoint when setup fails."""
        mock_chat_service._validate_context.side_effect = Exception("Setup error")
        
        response = client.post("/api/chat/stream", json=valid_chat_request)
        
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "Failed to setup streaming response" in data["detail"]
    
    def test_suggestions_endpoint_success(self, mock_chat_service):
        """Test successful suggestions endpoint."""
        expected_suggestions = [
            "What is the core problem this statement is trying to solve?",
            "What would be a good tech stack for this problem?",
            "What are the main challenges I might face implementing this?"
        ]
        mock_chat_service.get_suggested_questions.return_value = expected_suggestions
        
        response = client.get("/api/chat/suggestions")
        
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert data["suggestions"] == expected_suggestions
        
        mock_chat_service.get_suggested_questions.assert_called_once()
    
    def test_health_endpoint(self):
        """Test chat service health endpoint."""
        response = client.get("/api/chat/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "chat"
    
    def test_chat_endpoint_empty_question(self, mock_chat_service):
        """Test chat endpoint with empty question."""
        invalid_request = {
            "problem_id": "test_problem_001",
            "problem_context": "Valid problem context with enough content to pass validation",
            "user_question": ""  # Empty question
        }
        
        response = client.post("/api/chat/", json=invalid_request)
        
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data
    
    def test_chat_endpoint_empty_context(self, mock_chat_service):
        """Test chat endpoint with empty context."""
        invalid_request = {
            "problem_id": "test_problem_001",
            "problem_context": "",  # Empty context
            "user_question": "What should I do?"
        }
        
        # Mock the service to raise ValueError for empty context
        mock_chat_service.generate_response = AsyncMock(
            side_effect=ValueError("Invalid or insufficient problem context provided")
        )
        
        response = client.post("/api/chat/", json=invalid_request)
        
        assert response.status_code == 400  # Bad request due to validation error
        data = response.json()
        assert "detail" in data