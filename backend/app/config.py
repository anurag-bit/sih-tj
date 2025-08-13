"""
Configuration settings for the SIH Solver's Compass API.
"""
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Configuration
    app_name: str = "SIH Solver's Compass API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # CORS Configuration
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:80", "http://localhost"]
    allowed_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowed_headers: List[str] = ["*"]
    
    # External API Keys
    gemini_api_key: str = ""
    github_token: str = ""
    
    # Database Configuration
    chroma_host: str = "chroma-db"
    chroma_port: int = 8000
    
    # Model Configuration
    embedding_model: str = "all-MiniLM-L6-v2"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()