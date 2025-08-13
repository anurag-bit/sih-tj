"""
Middleware for error handling and request processing.
"""
import logging
import traceback
from datetime import datetime
from typing import Callable
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from .models import ErrorResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Global error handling middleware to catch and format exceptions.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except HTTPException as exc:
            # FastAPI HTTPExceptions are handled by FastAPI itself
            raise exc
        except Exception as exc:
            # Log the full exception for debugging
            logger.error(f"Unhandled exception: {str(exc)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            # Return a standardized error response
            error_response = ErrorResponse(
                error="internal_server_error",
                message="An unexpected error occurred. Please try again later.",
                details={"path": str(request.url.path)} if request else None,
                timestamp=datetime.now()
            )
            
            return JSONResponse(
                status_code=500,
                content=error_response.model_dump()
            )


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Request/response logging middleware.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = datetime.now()
        
        # Log request
        logger.info(f"Request: {request.method} {request.url.path}")
        
        try:
            response = await call_next(request)
            
            # Calculate processing time
            process_time = (datetime.now() - start_time).total_seconds()
            
            # Log response
            logger.info(
                f"Response: {response.status_code} - "
                f"Time: {process_time:.3f}s - "
                f"Path: {request.url.path}"
            )
            
            # Add processing time header
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
        except Exception as exc:
            process_time = (datetime.now() - start_time).total_seconds()
            logger.error(
                f"Error: {str(exc)} - "
                f"Time: {process_time:.3f}s - "
                f"Path: {request.url.path}"
            )
            raise exc