"""
Dashboard service router for analytics and statistics.
"""
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Query
from ..models import DashboardStats
from ..services.dashboard_service import dashboard_service, DashboardServiceError

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    force_refresh: bool = Query(False, description="Force refresh of cached data")
) -> DashboardStats:
    """
    Provides aggregated statistics for the dashboard visualization.
    
    Args:
        force_refresh: If True, bypass cache and fetch fresh data
    
    Returns:
        DashboardStats containing chart data for categories, keywords, and organizations
        
    Raises:
        HTTPException: If statistics generation fails
    """
    try:
        stats = await dashboard_service.get_dashboard_stats(force_refresh=force_refresh)
        return stats
    except DashboardServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/categories", response_model=Dict[str, Any])
async def get_category_breakdown() -> Dict[str, Any]:
    """
    Get detailed category breakdown with percentages.
    
    Returns:
        Dictionary with category counts and percentages
    """
    try:
        breakdown = await dashboard_service.get_category_breakdown()
        return breakdown
    except DashboardServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/technology-trends", response_model=Dict[str, Any])
async def get_technology_trends() -> Dict[str, Any]:
    """
    Get technology trends from keyword analysis.
    
    Returns:
        Dictionary with technology and domain keywords
    """
    try:
        trends = await dashboard_service.get_technology_trends()
        return trends
    except DashboardServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/clear-cache")
async def clear_dashboard_cache() -> Dict[str, str]:
    """
    Clear the dashboard cache to force fresh data on next request.
    
    Returns:
        Success message
    """
    try:
        await dashboard_service.clear_cache()
        return {"message": "Dashboard cache cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")


@router.get("/health")
async def dashboard_health() -> Dict[str, Any]:
    """Health check endpoint for dashboard service."""
    try:
        health_status = await dashboard_service.health_check()
        return health_status
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "service": "dashboard"
        }