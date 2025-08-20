"""
Pydantic models for all data structures in the SIH Solver's Compass API.
"""
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel, Field


class ProblemStatement(BaseModel):
    """Core problem statement model."""
    id: str = Field(..., description="Unique identifier for the problem")
    title: str = Field(..., description="Problem statement title")
    organization: str = Field(..., description="Sponsoring organization")
    category: str = Field(..., description="Problem category")
    description: str = Field(..., description="Detailed problem description")
    technology_stack: List[str] = Field(default_factory=list, description="Suggested technologies")
    difficulty_level: str = Field(..., description="Problem difficulty level")
    created_at: Optional[datetime] = Field(default=None, description="Creation timestamp")


class SearchQuery(BaseModel):
    """Search request model."""
    query: str = Field(..., description="Natural language search query")
    limit: int = Field(default=20, ge=1, le=100, description="Maximum number of results")


class SearchResult(BaseModel):
    """Search result with similarity score."""
    problem: ProblemStatement
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Cosine similarity score")


class ChatRequest(BaseModel):
    """Chat request model."""
    problem_id: str = Field(..., description="Problem statement ID for context")
    problem_context: str = Field(..., description="Full problem statement context")
    # user_question must be non-empty to satisfy validation expectations (empty -> 422)
    user_question: str = Field(..., min_length=1, description="User's question about the problem")
    model: Optional[str] = Field(default=None, description="Selected AI model to use for response")


class ChatResponse(BaseModel):
    """Chat response model."""
    response: str = Field(..., description="AI assistant response")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")


class ChatModel(BaseModel):
    """Available chat model."""
    id: str = Field(..., description="Model identifier")
    name: str = Field(..., description="Human-readable model name")
    description: str = Field(..., description="Model description")
    provider: str = Field(..., description="Model provider (OpenAI, Google, etc.)")


class ChatModelsResponse(BaseModel):
    """Response containing available chat models."""
    models: List[ChatModel] = Field(..., description="List of available models")
    default_model: str = Field(..., description="Default model ID")


class Repository(BaseModel):
    """GitHub repository model."""
    name: str = Field(..., description="Repository name")
    description: Optional[str] = Field(default=None, description="Repository description")
    topics: List[str] = Field(default_factory=list, description="Repository topics/tags")
    readme_content: Optional[str] = Field(default=None, description="README content excerpt")
    language: Optional[str] = Field(default=None, description="Primary programming language")


class GitHubProfile(BaseModel):
    """GitHub user profile model."""
    username: str = Field(..., description="GitHub username")
    repositories: List[Repository] = Field(default_factory=list, description="Public repositories")
    tech_stack: List[str] = Field(default_factory=list, description="Inferred technology stack")


class GitHubRecommendationRequest(BaseModel):
    """GitHub recommendation request model."""
    username: str = Field(..., min_length=1, description="GitHub username")


class DashboardStats(BaseModel):
    """Dashboard statistics model."""
    categories: Dict[str, int] = Field(..., description="Problem count by category")
    top_keywords: List[Tuple[str, int]] = Field(..., description="Most common keywords with counts")
    top_organizations: Dict[str, int] = Field(..., description="Top organizations by problem count")
    total_problems: int = Field(..., description="Total number of problems")


class ErrorResponse(BaseModel):
    """Standard error response model."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[Dict] = Field(default=None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")


class HealthCheck(BaseModel):
    """Health check response model."""
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(default_factory=datetime.now, description="Check timestamp")
    version: str = Field(..., description="API version")