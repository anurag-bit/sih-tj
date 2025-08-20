"""
Chat service router for interactive problem statement exploration.
"""
import json
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from ..models import ChatRequest, ChatResponse, ChatModelsResponse
from ..services.chat_service import get_chat_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat_with_problem(chat_request: ChatRequest) -> ChatResponse:
    """
    Interactive chat about a specific problem statement using Gemini API.
    
    Args:
        chat_request: ChatRequest containing problem context and user question
        
    Returns:
        ChatResponse with AI assistant's response about the problem
        
    Raises:
        HTTPException: If chat generation fails or context is invalid
    """
    try:
        # Generate response using the chat service
        chat_service = get_chat_service()
        response_text = await chat_service.generate_response(
            problem_context=chat_request.problem_context,
            user_question=chat_request.user_question,
            model=chat_request.model
        )
        
        return ChatResponse(response=response_text)
        
    except ValueError as e:
        logger.warning(f"Invalid chat request: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid request: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Chat generation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate chat response. Please try again."
        )


@router.post("/stream")
async def chat_stream(chat_request: ChatRequest) -> StreamingResponse:
    """
    Streaming chat response for real-time interaction.
    
    Args:
        chat_request: ChatRequest containing problem context and user question
        
    Returns:
        StreamingResponse with real-time AI response chunks
        
    Raises:
        HTTPException: If streaming fails or context is invalid
    """
    try:
        # Get chat service and validate the request first
        chat_service = get_chat_service()
        if not chat_service._validate_context(chat_request.problem_context):
            raise HTTPException(
                status_code=400,
                detail="Invalid or insufficient problem context provided"
            )
        
        async def generate_stream():
            """Generator function for streaming response (plain text chunks)."""
            try:
                async for chunk in chat_service.generate_streaming_response(
                    problem_context=chat_request.problem_context,
                    user_question=chat_request.user_question,
                    model=chat_request.model
                ):
                    # Yield raw text chunks (no SSE framing) to match test expectations
                    yield chunk
            except Exception as e:
                logger.error(f"Streaming error: {str(e)}")
                # Propagate as plain text error message
                yield f"Error: {str(e)}"

        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Streaming setup failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to setup streaming response. Please try again."
        )


@router.get("/suggestions")
async def get_suggested_questions():
    """
    Get suggested questions for users to ask about problem statements.
    
    Returns:
        dict: List of suggested questions
    """
    chat_service = get_chat_service()
    return {
        "suggestions": chat_service.get_suggested_questions()
    }


@router.get("/models", response_model=ChatModelsResponse)
async def get_available_models():
    """
    Get available chat models for user selection.
    
    Returns:
        ChatModelsResponse: List of available models with metadata
    """
    try:
        chat_service = get_chat_service()
        return chat_service.get_available_models()
    except Exception as e:
        logger.error(f"Failed to get available models: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve available models"
        )


@router.get("/health")
async def chat_health():
    """Health check endpoint for chat service."""
    return {"status": "healthy", "service": "chat"}