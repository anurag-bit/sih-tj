"""
Unit tests for the GitHub integration service functionality.
"""
import json
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime, timedelta

import httpx
from fastapi import HTTPException

from app.services.github_service import GitHubService
from app.models import Repository, GitHubProfile, SearchResult, ProblemStatement


class TestGitHubService:
    """Test cases for GitHubService class."""
    
    @pytest.fixture
    def github_service(self):
        """Create a GitHubService instance for testing."""
        return GitHubService()
    
    @pytest.fixture
    def mock_github_user_response(self):
        """Mock GitHub user API response."""
        return {
            "login": "testuser",
            "id": 12345,
            "name": "Test User",
            "public_repos": 10,
            "followers": 50,
            "following": 30
        }
    
    @pytest.fixture
    def mock_github_repos_response(self):
        """Mock GitHub repositories API response."""
        return [
            {
                "name": "ml-project",
                "full_name": "testuser/ml-project",
                "description": "Machine learning project for image classification",
                "topics": ["machine-learning", "python", "tensorflow"],
                "language": "Python",
                "fork": False,
                "updated_at": "2024-01-15T10:00:00Z"
            },
            {
                "name": "web-app",
                "full_name": "testuser/web-app",
                "description": "React web application with Node.js backend",
                "topics": ["react", "nodejs", "javascript"],
                "language": "JavaScript",
                "fork": False,
                "updated_at": "2024-01-10T10:00:00Z"
            },
            {
                "name": "forked-repo",
                "full_name": "testuser/forked-repo",
                "description": "This is a forked repository",
                "topics": [],
                "language": "Java",
                "fork": True,  # This should be skipped
                "updated_at": "2024-01-05T10:00:00Z"
            }
        ]
    
    @pytest.fixture
    def mock_readme_response(self):
        """Mock GitHub README API response."""
        import base64
        readme_content = "# ML Project\nThis project implements image classification using TensorFlow and Python."
        encoded_content = base64.b64encode(readme_content.encode()).decode()
        return {
            "content": encoded_content,
            "encoding": "base64"
        }
    
    @pytest.mark.asyncio
    async def test_get_github_profile_success(self, github_service, mock_github_user_response, mock_github_repos_response, mock_readme_response):
        """Test successful GitHub profile retrieval."""
        with patch('httpx.AsyncClient') as mock_client_class:
            # Setup mock client
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            # Mock user response
            user_response = Mock()
            user_response.status_code = 200
            user_response.json.return_value = mock_github_user_response
            
            # Mock repos response
            repos_response = Mock()
            repos_response.status_code = 200
            repos_response.json.return_value = mock_github_repos_response
            
            # Mock README response
            readme_response = Mock()
            readme_response.status_code = 200
            readme_response.json.return_value = mock_readme_response
            
            # Setup client.get to return different responses based on URL
            def mock_get(url, **kwargs):
                if "/users/testuser" in url and "/repos" not in url:
                    return user_response
                elif "/users/testuser/repos" in url:
                    return repos_response
                elif "/readme" in url:
                    return readme_response
                else:
                    response = Mock()
                    response.status_code = 404
                    return response
            
            mock_client.get = AsyncMock(side_effect=mock_get)
            
            # Test profile retrieval
            profile = await github_service.get_github_profile("testuser")
            
            # Assertions
            assert isinstance(profile, GitHubProfile)
            assert profile.username == "testuser"
            assert len(profile.repositories) == 2  # Forked repo should be excluded
            
            # Check first repository (ml-project)
            ml_repo = profile.repositories[0]
            assert ml_repo.name == "ml-project"
            assert ml_repo.description == "Machine learning project for image classification"
            assert ml_repo.topics == ["machine-learning", "python", "tensorflow"]
            assert ml_repo.language == "Python"
            assert "ML Project" in ml_repo.readme_content
            
            # Check second repository (web-app)
            web_repo = profile.repositories[1]
            assert web_repo.name == "web-app"
            assert web_repo.language == "JavaScript"
            
            # Check tech stack analysis
            assert "Python" in profile.tech_stack
            assert "JavaScript" in profile.tech_stack
            assert "machine-learning" in profile.tech_stack
            assert "react" in profile.tech_stack
    
    @pytest.mark.asyncio
    async def test_get_github_profile_user_not_found(self, github_service):
        """Test GitHub profile retrieval when user is not found."""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            # Mock 404 response
            user_response = Mock()
            user_response.status_code = 404
            mock_client.get.return_value = user_response
            
            # Test user not found
            with pytest.raises(HTTPException) as exc_info:
                await github_service.get_github_profile("nonexistentuser")
            
            assert exc_info.value.status_code == 404
            assert "not found" in exc_info.value.detail
    
    @pytest.mark.asyncio
    async def test_get_github_profile_rate_limit(self, github_service):
        """Test GitHub profile retrieval when rate limit is exceeded."""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            # Mock 403 response (rate limit)
            user_response = Mock()
            user_response.status_code = 403
            mock_client.get.return_value = user_response
            
            # Test rate limit
            with pytest.raises(HTTPException) as exc_info:
                await github_service.get_github_profile("testuser")
            
            assert exc_info.value.status_code == 429
            assert "rate limit" in exc_info.value.detail
    
    def test_analyze_tech_stack(self, github_service):
        """Test technology stack analysis from repositories."""
        repositories = [
            Repository(
                name="ml-project",
                description="Machine learning project using TensorFlow and Python",
                topics=["machine-learning", "tensorflow", "python"],
                language="Python",
                readme_content="This project uses TensorFlow for deep learning and scikit-learn for preprocessing."
            ),
            Repository(
                name="web-app",
                description="React application with Node.js backend",
                topics=["react", "nodejs"],
                language="JavaScript",
                readme_content="Built with React and Express.js, using MongoDB for data storage."
            )
        ]
        
        tech_stack = github_service._analyze_tech_stack(repositories)
        
        # Check that technologies are extracted and ranked
        assert "Python" in tech_stack
        assert "JavaScript" in tech_stack
        assert "machine-learning" in tech_stack
        assert "react" in tech_stack
        assert "tensorflow" in tech_stack
    
    def test_generate_github_dna(self, github_service):
        """Test GitHub DNA generation from profile."""
        profile = GitHubProfile(
            username="testuser",
            tech_stack=["Python", "JavaScript", "React", "TensorFlow"],
            repositories=[
                Repository(
                    name="ml-classifier",
                    description="Image classification using deep learning",
                    topics=["machine-learning", "computer-vision"],
                    language="Python",
                    readme_content="This project implements a CNN for image classification."
                )
            ]
        )
        
        dna = github_service.generate_github_dna(profile)
        
        # Check that DNA contains key information
        assert "Python" in dna
        assert "JavaScript" in dna
        assert "React" in dna
        assert "TensorFlow" in dna
        assert "ml-classifier" in dna
        assert "Image classification" in dna
    
    @pytest.mark.asyncio
    async def test_get_recommendations_success(self, github_service):
        """Test successful recommendation generation."""
        # Mock the profile retrieval
        mock_profile = GitHubProfile(
            username="testuser",
            tech_stack=["Python", "TensorFlow"],
            repositories=[
                Repository(
                    name="ml-project",
                    description="Machine learning project",
                    topics=["machine-learning"],
                    language="Python"
                )
            ]
        )
        
        # Mock search results
        mock_search_results = [
            SearchResult(
                problem=ProblemStatement(
                    id="sih_001",
                    title="AI-Based Traffic Management",
                    organization="Ministry of Transport",
                    category="Software",
                    description="Develop AI system for traffic optimization",
                    technology_stack=["Python", "TensorFlow", "OpenCV"],
                    difficulty_level="Hard"
                ),
                similarity_score=0.85
            )
        ]
        
        with patch.object(github_service, 'get_github_profile', return_value=mock_profile), \
             patch('app.services.search_service.search_service') as mock_search_service:
            
            mock_search_service.search = AsyncMock(return_value=mock_search_results)
            
            # Test recommendations
            results = await github_service.get_recommendations("testuser")
            
            # Assertions
            assert len(results) == 1
            assert isinstance(results[0], SearchResult)
            assert results[0].problem.title == "AI-Based Traffic Management"
            assert results[0].similarity_score == 0.85
    
    def test_cache_functionality(self, github_service):
        """Test caching mechanism."""
        # Test cache storage
        test_data = {"test": "data"}
        github_service._cache_data("test_key", test_data)
        
        assert "test_key" in github_service.cache
        assert github_service.cache["test_key"]["data"] == test_data
        assert isinstance(github_service.cache["test_key"]["timestamp"], datetime)
        
        # Test cache retrieval
        assert github_service._is_cached("test_key") is True
        assert github_service._is_cached("nonexistent_key") is False