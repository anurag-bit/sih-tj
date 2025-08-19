"""
Chat service for interactive problem statement exploration using OpenRouter.
"""
import httpx
import json
from typing import AsyncGenerator, List, Dict

from loguru import logger
from app.config import settings
from app.models import ChatRequest, ChatResponse, ProblemStatement, ChatModel, ChatModelsResponse

class ChatService:
    """Service for handling chat interactions with OpenRouter."""

    def __init__(self):
        """Initialize the chat service with OpenRouter API configuration."""
        if not settings.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is required")
        
        self.api_key = settings.openrouter_api_key
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        # Define a default set of models to use as a fallback
        self.default_models = [
            "openai/gpt-oss-20b:free",
            "google/gemini-flash-1.5",
            "moonshotai/kimi-k2:free",
            "google/gemma-3n-e2b-it:free"
        ]
        
        # Define model metadata for the UI
        self.available_models = [
            {
                "id": "openai/gpt-oss-20b:free",
                "name": "GPT OSS 20B",
                "description": "Fast and efficient general-purpose model",
                "provider": "OpenAI"
            },
            {
                "id": "google/gemini-flash-1.5",
                "name": "Gemini Flash 1.5",
                "description": "Google's fast and capable model",
                "provider": "Google"
            },
            {
                "id": "moonshotai/kimi-k2:free",
                "name": "Kimi K2",
                "description": "Moonshot AI's conversational model",
                "provider": "Moonshot AI"
            },
            {
                "id": "google/gemma-3n-e2b-it:free",
                "name": "Gemma 3 2B IT",
                "description": "Google's lightweight instruction-tuned model",
                "provider": "Google"
            },
            {
                "id": "openai/gpt-4o-mini",
                "name": "GPT-4o Mini",
                "description": "OpenAI's most capable small model",
                "provider": "OpenAI"
            },
            {
                "id": "anthropic/claude-3.5-sonnet",
                "name": "Claude 3.5 Sonnet",
                "description": "Anthropic's latest and most capable model",
                "provider": "Anthropic"
            }
        ]
        
        self.default_model_id = self.default_models[0]

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
        return True

    async def generate_response(self, problem_context: str, user_question: str, model: str = None) -> str:
        """
        Generates a non-streaming response from OpenRouter by collecting chunks.

        Args:
            problem_context: The full context of the problem statement.
            user_question: The user's question about the problem.
            model: The specific model to use (optional).

        Returns:
            str: The full generated response.

        Raises:
            ChatServiceError: If the chat generation fails.
        """
        if not self._validate_context(problem_context):
            raise ValueError("Invalid or insufficient problem context provided")

        full_response = []
        try:
            async for chunk in self.generate_streaming_response(problem_context, user_question, model):
                full_response.append(chunk)
            return "".join(full_response)
        except Exception as e:
            logger.error(f"Failed to generate non-streaming chat response: {str(e)}")
            raise ChatServiceError(f"Failed to generate response: {str(e)}")

    async def generate_streaming_response(
        self,
        problem_context: str,
        user_question: str,
        model: str = None
    ) -> AsyncGenerator[str, None]:
        """
        Generates a streaming response from OpenRouter.

        Args:
            problem_context: The full context of the problem statement.
            user_question: The user's question about the problem.
            model: The specific model to use (optional).

        Yields:
            AsyncGenerator[str, None]: An async generator yielding response chunks.

        Raises:
            ChatServiceError: If the chat generation fails.
        """
        system_prompt = (
            """You are an AI assistant helping engineering students understand Smart India Hackathon problem statements. 

IMPORTANT CONSTRAINTS:
- You can ONLY answer questions about the specific problem statement provided in the context
- If information is not available in the problem context, explicitly state \"This information is not available in the problem statement\"
- Do not make assumptions or provide information not present in the context
- Keep responses focused, practical, and helpful for students evaluating this problem
- Suggest possible approaches, tech stacks, or considerations based only on what's described in the problem

PROBLEM CONTEXT:
{problem_context}

Please answer the following question about this specific problem statement:"""
        )
        
        messages = [
            {"role": "system", "content": system_prompt.format(problem_context=problem_context)},
            {"role": "user", "content": f"Question: {user_question}"}
        ]

        # Use the specified model or fall back to the default list
        models_to_use = [model] if model else self.default_models

        payload = {
            "models": models_to_use,
            "messages": messages,
            "stream": True,
        }

        try:
            async for chunk in self._call_openrouter_streaming_async(payload):
                yield chunk
        except Exception as e:
            logger.error(f"Failed to generate streaming chat response: {str(e)}")
            raise ChatServiceError(f"Failed to generate streaming response: {str(e)}")


    async def _call_openrouter_streaming_async(self, payload: Dict) -> AsyncGenerator[str, None]:
        """
        Makes an async streaming call to the OpenRouter API.

        Args:
            payload: The request payload for the OpenRouter API.

        Yields:
            AsyncGenerator[str, None]: An async generator yielding response chunks.
        
        Raises:
            Exception: If the API call fails.
        """
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                async with client.stream("POST", self.api_url, headers=self.headers, json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data:"):
                            data_str = line[len("data: "):]
                            if data_str.strip() == "[DONE]":
                                break
                            try:
                                chunk_data = json.loads(data_str)
                                content = chunk_data.get("choices", [{}])[0].get("delta", {}).get("content")
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                logger.warning(f"Received non-JSON data from stream: {data_str}")
                                continue
            except httpx.HTTPStatusError as e:
                # Avoid reading the streaming body again; log status and reason only
                status = e.response.status_code if e.response is not None else "unknown"
                logger.error(f"OpenRouter API call failed with status {status}")
                raise
            except Exception as e:
                logger.error(f"OpenRouter streaming API call failed: {str(e)}")
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

    def get_available_models(self) -> ChatModelsResponse:
        """
        Get the list of available chat models.
        
        Returns:
            ChatModelsResponse: List of available models with metadata
        """
        models = [ChatModel(**model_info) for model_info in self.available_models]
        return ChatModelsResponse(
            models=models,
            default_model=self.default_model_id
        )

class ChatServiceError(Exception):
    """Custom exception for chat service errors."""
    pass


# Global chat service instance - initialized lazily
_chat_service_instance = None


def get_chat_service() -> ChatService:
    """Get or create the global chat service instance."""
    global _chat_service_instance
    if _chat_service_instance is None:
        _chat_service_instance = ChatService()
    return _chat_service_instance
