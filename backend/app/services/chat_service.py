"""
Chat service for interactive problem statement exploration using Google Gemini API.
"""
import logging
from typing import AsyncGenerator, Optional
import google.generativeai as genai
from ..config import settings

logger = logging.getLogger(__name__)


class ChatService:
    """Service for handling chat interactions with Gemini API."""
    
    def __init__(self):
        """Initialize the chat service with Gemini API configuration."""
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        # System prompt template for problem statement context
        self.system_prompt = """You are an AI assistant helping engineering students understand Smart India Hackathon problem statements. 

IMPORTANT CONSTRAINTS:
- You can ONLY answer questions about the specific problem statement provided in the context
- If information is not available in the problem context, explicitly state "This information is not available in the problem statement"
- Do not make assumptions or provide information not present in the context
- Keep responses focused, practical, and helpful for students evaluating this problem
- Suggest possible approaches, tech stacks, or considerations based only on what's described in the problem

PROBLEM CONTEXT:
{problem_context}

Please answer the following question about this specific problem statement:"""

    def _validate_context(self, problem_context: str) -> bool:
        """
        Validate that the problem context contains sufficient information.
        
        Args:
            problem_context: The problem statement context
            
        Returns:
            bool: True if context is valid, False otherwise
        """
        if not problem_context or len(problem_context.strip()) < 50:
            return False
        
        # Check for key elements that should be in a problem statement
        required_elements = ['problem', 'solution', 'technology', 'develop', 'implement']
        context_lower = problem_context.lower()
        
        # At least 2 of these elements should be present
        present_elements = sum(1 for element in required_elements if element in context_lower)
        return present_elements >= 2

    async def generate_response(self, problem_context: str, user_question: str) -> str:
        """
        Generate a response to user's question about the problem statement.
        
        Args:
            problem_context: Full problem statement context
            user_question: User's question about the problem
            
        Returns:
            str: AI assistant's response
            
        Raises:
            ValueError: If context validation fails
            Exception: If Gemini API call fails
        """
        # Validate context
        if not self._validate_context(problem_context):
            raise ValueError("Invalid or insufficient problem context provided")
        
        # Construct the full prompt
        full_prompt = self.system_prompt.format(problem_context=problem_context)
        full_prompt += f"\n\nQuestion: {user_question}"
        
        try:
            # Generate response using Gemini
            response = await self._call_gemini_async(full_prompt)
            return response
            
        except Exception as e:
            logger.error(f"Error generating chat response: {str(e)}")
            raise Exception(f"Failed to generate response: {str(e)}")

    async def generate_streaming_response(
        self, 
        problem_context: str, 
        user_question: str
    ) -> AsyncGenerator[str, None]:
        """
        Generate a streaming response for real-time chat interaction.
        
        Args:
            problem_context: Full problem statement context
            user_question: User's question about the problem
            
        Yields:
            str: Response chunks as they are generated
            
        Raises:
            ValueError: If context validation fails
            Exception: If Gemini API call fails
        """
        # Validate context
        if not self._validate_context(problem_context):
            raise ValueError("Invalid or insufficient problem context provided")
        
        # Construct the full prompt
        full_prompt = self.system_prompt.format(problem_context=problem_context)
        full_prompt += f"\n\nQuestion: {user_question}"
        
        try:
            # Generate streaming response using Gemini
            async for chunk in self._call_gemini_streaming_async(full_prompt):
                yield chunk
                
        except Exception as e:
            logger.error(f"Error generating streaming chat response: {str(e)}")
            raise Exception(f"Failed to generate streaming response: {str(e)}")

    async def _call_gemini_async(self, prompt: str) -> str:
        """
        Make an async call to Gemini API.
        
        Args:
            prompt: The full prompt to send to Gemini
            
        Returns:
            str: Generated response text
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API call failed: {str(e)}")
            raise

    async def _call_gemini_streaming_async(self, prompt: str) -> AsyncGenerator[str, None]:
        """
        Make an async streaming call to Gemini API.
        
        Args:
            prompt: The full prompt to send to Gemini
            
        Yields:
            str: Response chunks as they are generated
        """
        try:
            response = self.model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Gemini streaming API call failed: {str(e)}")
            raise

    def get_suggested_questions(self) -> list[str]:
        """
        Get a list of suggested questions for users to ask about problem statements.
        
        Returns:
            list[str]: List of suggested questions
        """
        return [
            "What is the core problem this statement is trying to solve?",
            "What would be a good tech stack for this problem?",
            "What are the main challenges I might face implementing this?",
            "What skills or knowledge would be most important for this problem?",
            "How complex is this problem for a student team?",
            "What would be the key deliverables for this problem?",
            "Are there any specific constraints or requirements mentioned?",
            "What kind of impact would solving this problem have?"
        ]


# Global chat service instance - initialized lazily
_chat_service_instance = None


def get_chat_service() -> ChatService:
    """Get or create the global chat service instance."""
    global _chat_service_instance
    if _chat_service_instance is None:
        _chat_service_instance = ChatService()
    return _chat_service_instance