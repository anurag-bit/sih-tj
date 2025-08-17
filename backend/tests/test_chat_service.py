"""
Tests for the chat service functionality using OpenRouter.
"""
import pytest
import json
import httpx
from unittest.mock import AsyncMock, Mock

from app.services.chat_service import ChatService, ChatServiceError

# Mark all tests in this file as asyncio
pytestmark = pytest.mark.asyncio

# Custom mock for an async context manager
class MockAsyncContextManager:
    def __init__(self, mock_response):
        self.mock_response = mock_response

    async def __aenter__(self):
        return self.mock_response

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

@pytest.fixture
def mock_settings(mocker):
    """Mock the settings with a valid OpenRouter API key."""
    return mocker.patch(
        'app.services.chat_service.settings',
        openrouter_api_key="test_api_key"
    )

@pytest.fixture
def chat_service(mock_settings):
    """Create a ChatService instance with a mocked API key."""
    return ChatService()


async def test_init_with_valid_api_key(chat_service):
    """Test ChatService initialization with a valid API key."""
    assert chat_service.api_key == "test_api_key"

async def test_init_without_api_key(mocker):
    """Test ChatService initialization without API key raises ValueError."""
    mocker.patch('app.services.chat_service.settings', openrouter_api_key="")
    with pytest.raises(ValueError, match="OPENROUTER_API_KEY environment variable is required"):
        ChatService()

async def test_generate_streaming_response_success(mocker, chat_service):
    """Test successful streaming response generation from OpenRouter."""
    problem_context = "A sample problem context."
    user_question = "A sample user question."
    expected_chunks = ["This", " is", " a", " test."]

    async def mock_aiter_lines():
        for chunk in expected_chunks:
            data = {"choices": [{"delta": {"content": chunk}}]}
            yield f"data: {json.dumps(data)}"
        yield "data: [DONE]"

    mock_response = AsyncMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.aiter_lines.return_value = mock_aiter_lines()
    mock_response.raise_for_status = Mock() # Does nothing on success

    # Use the custom mock context manager
    mock_cm_instance = MockAsyncContextManager(mock_response)
    mocker.patch("httpx.AsyncClient.stream", return_value=mock_cm_instance)

    # Act
    chunks = []
    async for chunk in chat_service.generate_streaming_response(problem_context, user_question):
        chunks.append(chunk)
    
    # Assert
    assert chunks == expected_chunks

async def test_generate_streaming_response_api_error(mocker, chat_service):
    """Test streaming response generation when the API call fails."""
    problem_context = "A sample problem context."
    user_question = "A sample user question."

    mock_response = AsyncMock(spec=httpx.Response)
    mock_response.status_code = 500
    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Server Error", request=Mock(), response=mock_response
    )

    # Use the custom mock context manager
    mock_cm_instance = MockAsyncContextManager(mock_response)
    mocker.patch("httpx.AsyncClient.stream", return_value=mock_cm_instance)

    with pytest.raises(ChatServiceError):
        _ = [chunk async for chunk in chat_service.generate_streaming_response(problem_context, user_question)]