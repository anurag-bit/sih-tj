"""
Search service router for semantic search functionality.
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from ..models import SearchQuery, SearchResult, ProblemStatement
from ..services.search_service import search_service, SearchServiceError

router = APIRouter(prefix="/search", tags=["search"])


@router.post("/", response_model=List[SearchResult])
@router.post("", response_model=List[SearchResult])  # accept missing trailing slash too
async def semantic_search(query: SearchQuery) -> List[SearchResult]:
    """
    Performs semantic search using sentence transformers.
    
    Args:
        query: SearchQuery containing the natural language query and optional limit
        
    Returns:
        List of SearchResult objects with problem statements and similarity scores
        
    Raises:
        HTTPException: If search fails or no results found
    """
    try:
        # Validate query
        if not query.query.strip():
            raise HTTPException(
                status_code=400,
                detail="Search query cannot be empty"
            )
        
        # Perform semantic search
        results = await search_service.search(
            query=query.query.strip(),
            limit=query.limit
        )
        
        return results
        
    except SearchServiceError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search service error: {str(e)}"
        )
    except HTTPException:
        # Preserve explicit HTTPExceptions like 400 for empty queries
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during search: {str(e)}"
        )


@router.get("/problem/{problem_id}", response_model=ProblemStatement)
async def get_problem_by_id(problem_id: str) -> ProblemStatement:
    """
    Get a specific problem statement by ID.
    
    Args:
        problem_id: The problem statement ID
        
    Returns:
        ProblemStatement object
        
    Raises:
        HTTPException: If problem not found or service error
    """
    try:
        problem = await search_service.get_problem_by_id(problem_id)
        
        if not problem:
            raise HTTPException(
                status_code=404,
                detail=f"Problem statement not found: {problem_id}"
            )
        
        return problem
        
    except SearchServiceError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search service error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error fetching problem: {str(e)}"
        )


@router.get("/stats")
async def get_search_stats():
    """
    Get statistics about the problem statements collection.
    
    Returns:
        Dictionary with collection statistics
    """
    try:
        stats = await search_service.get_collection_stats()
        return stats
        
    except SearchServiceError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search service error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error getting stats: {str(e)}"
        )


@router.get("/health")
async def search_health():
    """Health check endpoint for search service."""
    try:
        health_status = await search_service.health_check()
        
        # Return appropriate HTTP status based on health
        if health_status.get("status") == "healthy":
            return health_status
        else:
            raise HTTPException(
                status_code=503,
                detail=health_status
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "error": str(e),
                "service": "search"
            }
        )