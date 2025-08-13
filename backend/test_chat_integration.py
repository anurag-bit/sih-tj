"""
Integration test script for chat functionality.
This script tests the chat endpoints with mock data.
"""
import os
import sys
import asyncio
from unittest.mock import patch, Mock

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.services.chat_service import ChatService, get_chat_service
from app.models import ChatRequest


async def test_chat_service_integration():
    """Test the chat service with mocked Gemini API."""
    print("Testing Chat Service Integration...")
    
    # Mock the Gemini API
    with patch('app.services.chat_service.genai') as mock_genai:
        # Mock the settings to have a valid API key
        with patch('app.services.chat_service.settings') as mock_settings:
            mock_settings.gemini_api_key = "test_api_key"
            
            # Create a mock model and response
            mock_model = Mock()
            mock_response = Mock()
            mock_response.text = "Based on the problem statement, I recommend using Python with TensorFlow for machine learning, FastAPI for the backend, and React for the frontend. This tech stack would be suitable for developing a healthcare solution with ML capabilities."
            
            mock_model.generate_content.return_value = mock_response
            mock_genai.GenerativeModel.return_value = mock_model
            
            # Create chat service
            chat_service = ChatService()
            
            # Test data
            problem_context = """
            Develop a machine learning solution for healthcare technology 
            implementation that can solve problems in rural areas using 
            advanced algorithms and modern technology stack to implement
            innovative solutions for better healthcare delivery and improve
            patient outcomes through data-driven approaches.
            """
            
            user_question = "What would be a good tech stack for this problem?"
            
            # Test context validation
            print("✓ Testing context validation...")
            assert chat_service._validate_context(problem_context) == True
            assert chat_service._validate_context("short") == False
            
            # Test response generation
            print("✓ Testing response generation...")
            response = await chat_service.generate_response(problem_context, user_question)
            assert response is not None
            assert len(response) > 0
            print(f"Response: {response[:100]}...")
            
            # Test suggested questions
            print("✓ Testing suggested questions...")
            suggestions = chat_service.get_suggested_questions()
            assert isinstance(suggestions, list)
            assert len(suggestions) > 0
            print(f"Got {len(suggestions)} suggested questions")
            
            # Test streaming response
            print("✓ Testing streaming response...")
            chunks = []
            mock_streaming_response = [
                Mock(text="Based on the problem"),
                Mock(text=" statement, I recommend"),
                Mock(text=" using Python with TensorFlow")
            ]
            mock_model.generate_content.return_value = mock_streaming_response
            
            async for chunk in chat_service.generate_streaming_response(problem_context, user_question):
                chunks.append(chunk)
            
            assert len(chunks) > 0
            print(f"Got {len(chunks)} streaming chunks")
            
            print("✅ All chat service tests passed!")


async def test_chat_router_integration():
    """Test the chat router endpoints."""
    print("\nTesting Chat Router Integration...")
    
    from fastapi.testclient import TestClient
    from app.main import app
    
    client = TestClient(app)
    
    # Test health endpoint
    print("✓ Testing health endpoint...")
    response = client.get("/api/chat/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    print("Health check passed")
    
    # Test suggestions endpoint
    print("✓ Testing suggestions endpoint...")
    with patch('app.routers.chat.get_chat_service') as mock_get_service:
        mock_service = Mock()
        mock_service.get_suggested_questions.return_value = [
            "What is the core problem?",
            "What tech stack would you recommend?"
        ]
        mock_get_service.return_value = mock_service
        
        response = client.get("/api/chat/suggestions")
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert len(data["suggestions"]) > 0
        print(f"Got {len(data['suggestions'])} suggestions")
    
    print("✅ All chat router tests passed!")


if __name__ == "__main__":
    print("Starting Chat Functionality Integration Tests...\n")
    
    # Run the tests
    asyncio.run(test_chat_service_integration())
    asyncio.run(test_chat_router_integration())
    
    print("\n🎉 All integration tests completed successfully!")
    print("\nChat functionality is ready for use!")
    print("\nAvailable endpoints:")
    print("- POST /api/chat/ - Interactive chat about problem statements")
    print("- POST /api/chat/stream - Streaming chat responses")
    print("- GET /api/chat/suggestions - Get suggested questions")
    print("- GET /api/chat/health - Health check")