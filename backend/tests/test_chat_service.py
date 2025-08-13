"""
Tests for the chat service functionality.
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from backend.app.services.chat_service import ChatService, get_chat_service


class TestChatService:
    """Test cases for ChatService class."""
    
    @pytest.fixture
    def mock_genai(self):
        """Mock the google.generativeai module."""
        with patch('backend.app.services.chat_service.genai') as mock:
            yield mock
    
    @pytest.fixture
    def mock_settings(self):
        """Mock the settings with a valid API key."""
        with patch('backend.app.services.chat_service.settings') as mock:
            mock.gemini_api_key = "test_api_key"
            yield mock
    
    @pytest.fixture
    def chat_service(self, mock_genai, mock_settings):
        """Create a ChatService instance with mocked dependencies."""
        return ChatService()
    
    def test_init_with_valid_api_key(self, mock_genai, mock_settings):
        """Test ChatService initialization with valid API key."""
        service = ChatService()
        mock_genai.configure.assert_called_once_with(api_key="test_api_key")
        mock_genai.GenerativeModel.assert_called_once_with('gemini-pro')
    
    def test_init_without_api_key(self, mock_genai):
        """Test ChatService initialization without API key raises ValueError."""
        with patch('backend.app.services.chat_service.settings') as mock_settings:
            mock_settings.gemini_api_key = ""
            with pytest.raises(ValueError, match="GEMINI_API_KEY environment variable is required"):
                ChatService()
    
    def test_validate_context_valid(self, chat_service):
        """Test context validation with valid problem statement."""
        valid_context = """
        This is a problem statement about developing a machine learning solution
        for healthcare technology implementation in rural areas. The solution
        should implement advanced algorithms to solve real-world problems.
        """
        assert chat_service._validate_context(valid_context) is True
    
    def test_validate_context_invalid_too_short(self, chat_service):
        """Test context validation with too short context."""
        short_context = "Short problem"
        assert chat_service._validate_context(short_context) is False
    
    def test_validate_context_invalid_missing_elements(self, chat_service):
        """Test context validation with missing key elements."""
        invalid_context = "This is just a random text without any problem statement elements" * 3
        assert chat_service._validate_context(invalid_context) is False
    
    @pytest.mark.asyncio
    async def test_generate_response_success(self, chat_service):
        """Test successful response generation."""
        problem_context = """
        Develop a machine learning solution for healthcare technology 
        implementation that can solve problems in rural areas using 
        advanced algorithms and modern technology stack.
        """
        user_question = "What tech stack would you recommend?"
        expected_response = "I recommend using Python with TensorFlow for this healthcare ML solution."
        
        # Mock the Gemini API call
        chat_service.model.generate_content = Mock()
        mock_response = Mock()
        mock_response.text = expected_response
        chat_service.model.generate_content.return_value = mock_response
        
        with patch.object(chat_service, '_call_gemini_async', return_value=expected_response):
            response = await chat_service.generate_response(problem_context, user_question)
            assert response == expected_response
    
    @pytest.mark.asyncio
    async def test_generate_response_invalid_context(self, chat_service):
        """Test response generation with invalid context."""
        invalid_context = "Short"
        user_question = "What should I do?"
        
        with pytest.raises(ValueError, match="Invalid or insufficient problem context"):
            await chat_service.generate_response(invalid_context, user_question)
    
    @pytest.mark.asyncio
    async def test_generate_response_api_error(self, chat_service):
        """Test response generation when API call fails."""
        problem_context = """
        Develop a machine learning solution for healthcare technology 
        implementation that can solve problems in rural areas using 
        advanced algorithms and modern technology stack.
        """
        user_question = "What tech stack would you recommend?"
        
        with patch.object(chat_service, '_call_gemini_async', side_effect=Exception("API Error")):
            with pytest.raises(Exception, match="Failed to generate response: API Error"):
                await chat_service.generate_response(problem_context, user_question)
    
    @pytest.mark.asyncio
    async def test_generate_streaming_response_success(self, chat_service):
        """Test successful streaming response generation."""
        problem_context = """
        Develop a machine learning solution for healthcare technology 
        implementation that can solve problems in rural areas using 
        advanced algorithms and modern technology stack.
        """
        user_question = "What tech stack would you recommend?"
        expected_chunks = ["I recommend", " using Python", " with TensorFlow"]
        
        async def mock_streaming_generator():
            for chunk in expected_chunks:
                yield chunk
        
        with patch.object(chat_service, '_call_gemini_streaming_async', return_value=mock_streaming_generator()):
            chunks = []
            async for chunk in chat_service.generate_streaming_response(problem_context, user_question):
                chunks.append(chunk)
            
            assert chunks == expected_chunks
    
    @pytest.mark.asyncio
    async def test_generate_streaming_response_invalid_context(self, chat_service):
        """Test streaming response generation with invalid context."""
        invalid_context = "Short"
        user_question = "What should I do?"
        
        with pytest.raises(ValueError, match="Invalid or insufficient problem context"):
            async for _ in chat_service.generate_streaming_response(invalid_context, user_question):
                pass
    
    @pytest.mark.asyncio
    async def test_call_gemini_async_success(self, chat_service):
        """Test successful Gemini API call."""
        prompt = "Test prompt"
        expected_response = "Test response"
        
        mock_response = Mock()
        mock_response.text = expected_response
        chat_service.model.generate_content.return_value = mock_response
        
        response = await chat_service._call_gemini_async(prompt)
        assert response == expected_response
        chat_service.model.generate_content.assert_called_once_with(prompt)
    
    @pytest.mark.asyncio
    async def test_call_gemini_async_error(self, chat_service):
        """Test Gemini API call with error."""
        prompt = "Test prompt"
        chat_service.model.generate_content.side_effect = Exception("API Error")
        
        with pytest.raises(Exception):
            await chat_service._call_gemini_async(prompt)
    
    @pytest.mark.asyncio
    async def test_call_gemini_streaming_async_success(self, chat_service):
        """Test successful Gemini streaming API call."""
        prompt = "Test prompt"
        expected_chunks = ["chunk1", "chunk2", "chunk3"]
        
        # Mock streaming response
        mock_chunks = []
        for chunk_text in expected_chunks:
            mock_chunk = Mock()
            mock_chunk.text = chunk_text
            mock_chunks.append(mock_chunk)
        
        chat_service.model.generate_content.return_value = mock_chunks
        
        chunks = []
        async for chunk in chat_service._call_gemini_streaming_async(prompt):
            chunks.append(chunk)
        
        assert chunks == expected_chunks
        chat_service.model.generate_content.assert_called_once_with(prompt, stream=True)
    
    def test_get_suggested_questions(self, chat_service):
        """Test getting suggested questions."""
        suggestions = chat_service.get_suggested_questions()
        
        assert isinstance(suggestions, list)
        assert len(suggestions) > 0
        assert all(isinstance(q, str) for q in suggestions)
        assert "What is the core problem this statement is trying to solve?" in suggestions
        assert "What would be a good tech stack for this problem?" in suggestions