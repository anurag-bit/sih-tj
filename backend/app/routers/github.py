"""
GitHub service router for personalized recommendations.
"""
from typing import List
from fastapi import APIRouter, HTTPException
from ..models import GitHubRecommendationRequest, SearchResult, GitHubProfile
from ..services.github_service import github_service

router = APIRouter(prefix="/github", tags=["github"])


@router.post("/recommend", response_model=List[SearchResult])
async def github_recommendations(request: GitHubRecommendationRequest) -> List[SearchResult]:
    """
    Analyzes GitHub profile and recommends problems based on repository analysis.
    
    Args:
        request: GitHubRecommendationRequest containing the GitHub username
        
    Returns:
        List of SearchResult objects with personalized problem recommendations
        
    Raises:
        HTTPException: If GitHub profile analysis fails or user not found
    """
    try:
        results = await github_service.get_recommendations(request.username)
        return results
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@router.get("/profile/{username}", response_model=GitHubProfile)
async def get_github_profile(username: str) -> GitHubProfile:
    """
    Retrieves and analyzes a GitHub user's profile and repositories.
    
    Args:
        username: GitHub username to analyze
        
    Returns:
        GitHubProfile with repository analysis and inferred tech stack
        
    Raises:
        HTTPException: If user not found or profile is private
    """
    try:
        profile = await github_service.get_github_profile(username)
        return profile
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch GitHub profile: {str(e)}"
        )


@router.get("/health")
async def github_health():
    """Health check endpoint for GitHub service."""
    return {"status": "healthy", "service": "github"}