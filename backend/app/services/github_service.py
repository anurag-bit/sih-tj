"""
GitHub integration service for analyzing user repositories and generating recommendations.
"""
import asyncio
import hashlib
import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set
from urllib.parse import quote

import httpx
from fastapi import HTTPException

from ..config import settings
from ..models import Repository, GitHubProfile, ProblemStatement, SearchResult


class GitHubService:
    """Service for GitHub API integration and repository analysis."""
    
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.cache: Dict[str, Dict] = {}
        self.cache_ttl = timedelta(hours=1)  # Cache for 1 hour to handle rate limits
        
    async def get_github_profile(self, username: str) -> GitHubProfile:
        """
        Fetch and analyze a GitHub user's profile and repositories.
        
        Args:
            username: GitHub username to analyze
            
        Returns:
            GitHubProfile with repository data and inferred tech stack
            
        Raises:
            HTTPException: If user not found or API error occurs
        """
        try:
            # Check cache first
            cache_key = f"profile_{username}"
            if self._is_cached(cache_key):
                cached_data = self.cache[cache_key]["data"]
                return GitHubProfile(**cached_data)
            
            async with httpx.AsyncClient() as client:
                # Set up headers with optional GitHub token
                headers = {"Accept": "application/vnd.github.v3+json"}
                if settings.github_token:
                    headers["Authorization"] = f"token {settings.github_token}"
                
                # Fetch user info
                user_response = await client.get(
                    f"{self.base_url}/users/{quote(username)}",
                    headers=headers,
                    timeout=10.0
                )
                
                if user_response.status_code == 404:
                    raise HTTPException(
                        status_code=404,
                        detail=f"GitHub user '{username}' not found"
                    )
                elif user_response.status_code == 403:
                    raise HTTPException(
                        status_code=429,
                        detail="GitHub API rate limit exceeded. Please try again later."
                    )
                elif user_response.status_code != 200:
                    raise HTTPException(
                        status_code=502,
                        detail=f"GitHub API error: {user_response.status_code}"
                    )
                
                # Fetch repositories
                repos_response = await client.get(
                    f"{self.base_url}/users/{quote(username)}/repos",
                    headers=headers,
                    params={"type": "public", "sort": "updated", "per_page": 50},
                    timeout=10.0
                )
                
                if repos_response.status_code != 200:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Failed to fetch repositories: {repos_response.status_code}"
                    )
                
                repos_data = repos_response.json()
                
                # Process repositories
                repositories = []
                for repo_data in repos_data:
                    if not repo_data.get("fork", False):  # Skip forked repositories
                        repo = await self._process_repository(client, headers, repo_data)
                        repositories.append(repo)
                
                # Analyze tech stack
                tech_stack = self._analyze_tech_stack(repositories)
                
                profile = GitHubProfile(
                    username=username,
                    repositories=repositories,
                    tech_stack=tech_stack
                )
                
                # Cache the result
                self._cache_data(cache_key, profile.model_dump())
                
                return profile
                
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=504,
                detail="GitHub API request timed out. Please try again."
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to connect to GitHub API: {str(e)}"
            )
    
    async def _process_repository(
        self, 
        client: httpx.AsyncClient, 
        headers: Dict[str, str], 
        repo_data: Dict
    ) -> Repository:
        """Process a single repository and extract relevant information."""
        repo_name = repo_data.get("name", "")
        description = repo_data.get("description", "")
        topics = repo_data.get("topics", [])
        language = repo_data.get("language", "")
        
        # Fetch README content (with error handling)
        readme_content = await self._fetch_readme(
            client, headers, repo_data.get("full_name", "")
        )
        
        return Repository(
            name=repo_name,
            description=description,
            topics=topics,
            readme_content=readme_content,
            language=language
        )
    
    async def _fetch_readme(
        self, 
        client: httpx.AsyncClient, 
        headers: Dict[str, str], 
        full_name: str
    ) -> Optional[str]:
        """Fetch README content from a repository."""
        try:
            readme_response = await client.get(
                f"{self.base_url}/repos/{quote(full_name)}/readme",
                headers=headers,
                timeout=5.0
            )
            
            if readme_response.status_code == 200:
                readme_data = readme_response.json()
                # GitHub returns base64 encoded content
                import base64
                content = base64.b64decode(readme_data.get("content", "")).decode("utf-8")
                # Return first 500 characters to avoid too much data
                return content[:500] if content else None
            
        except Exception:
            # If README fetch fails, continue without it
            pass
        
        return None
    
    def _analyze_tech_stack(self, repositories: List[Repository]) -> List[str]:
        """Analyze repositories to infer the user's technology stack."""
        tech_counter: Dict[str, int] = {}
        
        # Extract technologies from various sources
        for repo in repositories:
            # From primary language
            if repo.language:
                tech_counter[repo.language] = tech_counter.get(repo.language, 0) + 2
            
            # From topics
            for topic in repo.topics:
                tech_counter[topic] = tech_counter.get(topic, 0) + 1
            
            # From description and README
            text_content = f"{repo.description or ''} {repo.readme_content or ''}"
            extracted_techs = self._extract_technologies_from_text(text_content)
            for tech in extracted_techs:
                tech_counter[tech] = tech_counter.get(tech, 0) + 1
        
        # Sort by frequency and return top technologies
        sorted_techs = sorted(tech_counter.items(), key=lambda x: x[1], reverse=True)
        return [tech for tech, count in sorted_techs if count >= 1][:20]  # Top 20 technologies
    
    def _extract_technologies_from_text(self, text: str) -> Set[str]:
        """Extract technology names from text using pattern matching."""
        if not text:
            return set()
        
        # Common technology patterns
        tech_patterns = {
            # Programming languages
            r'\b(?:python|javascript|typescript|java|c\+\+|c#|go|rust|kotlin|swift|php|ruby|scala|r\b|matlab)\b',
            # Frameworks and libraries
            r'\b(?:react|angular|vue|django|flask|fastapi|express|spring|laravel|rails|tensorflow|pytorch|scikit-learn|pandas|numpy)\b',
            # Databases
            r'\b(?:mysql|postgresql|mongodb|redis|sqlite|elasticsearch|cassandra|dynamodb)\b',
            # Cloud and DevOps
            r'\b(?:aws|azure|gcp|docker|kubernetes|jenkins|terraform|ansible)\b',
            # Web technologies
            r'\b(?:html|css|sass|less|webpack|babel|nodejs|npm|yarn)\b',
            # Mobile
            r'\b(?:android|ios|flutter|react-native|xamarin)\b',
            # AI/ML
            r'\b(?:machine-learning|deep-learning|neural-network|nlp|computer-vision|opencv)\b'
        }
        
        technologies = set()
        text_lower = text.lower()
        
        for pattern in tech_patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            technologies.update(matches)
        
        return technologies
    
    def generate_github_dna(self, profile: GitHubProfile) -> str:
        """
        Generate a "GitHub DNA" document from the user's profile for semantic search.
        
        Args:
            profile: GitHubProfile containing repository data
            
        Returns:
            String representation of the user's coding profile
        """
        dna_parts = []
        
        # Add tech stack summary
        if profile.tech_stack:
            dna_parts.append(f"Technologies: {', '.join(profile.tech_stack[:10])}")
        
        # Add repository descriptions
        repo_descriptions = []
        for repo in profile.repositories[:10]:  # Top 10 most recent repos
            if repo.description:
                repo_descriptions.append(f"{repo.name}: {repo.description}")
        
        if repo_descriptions:
            dna_parts.append("Projects: " + "; ".join(repo_descriptions))
        
        # Add topics/interests
        all_topics = []
        for repo in profile.repositories:
            all_topics.extend(repo.topics)
        
        if all_topics:
            unique_topics = list(set(all_topics))[:15]  # Top 15 unique topics
            dna_parts.append(f"Interests: {', '.join(unique_topics)}")
        
        # Add README content snippets
        readme_snippets = []
        for repo in profile.repositories[:5]:  # Top 5 repos
            if repo.readme_content:
                # Extract meaningful sentences from README
                sentences = repo.readme_content.split('.')[:2]  # First 2 sentences
                clean_sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
                if clean_sentences:
                    readme_snippets.extend(clean_sentences)
        
        if readme_snippets:
            dna_parts.append("Project details: " + ". ".join(readme_snippets[:3]))
        
        return " | ".join(dna_parts)
    
    async def get_recommendations(self, username: str) -> List[SearchResult]:
        """
        Get problem statement recommendations based on GitHub profile analysis.
        
        Args:
            username: GitHub username to analyze
            
        Returns:
            List of SearchResult objects with personalized recommendations
        """
        # Get GitHub profile
        profile = await self.get_github_profile(username)
        
        # Generate GitHub DNA for semantic search
        github_dna = self.generate_github_dna(profile)
        
        if not github_dna.strip():
            raise HTTPException(
                status_code=400,
                detail="Unable to generate recommendations: insufficient repository data"
            )
        
        # Use the search service to find matching problems
        from .search_service import search_service
        
        # Perform semantic search using GitHub DNA
        results = await search_service.search(github_dna, limit=20)
        
        return results
    
    def _is_cached(self, key: str) -> bool:
        """Check if data is cached and not expired."""
        if key not in self.cache:
            return False
        
        cached_time = self.cache[key]["timestamp"]
        return datetime.now() - cached_time < self.cache_ttl
    
    def _cache_data(self, key: str, data: Dict) -> None:
        """Cache data with timestamp."""
        self.cache[key] = {
            "data": data,
            "timestamp": datetime.now()
        }
        
        # Simple cache cleanup - remove old entries if cache gets too large
        if len(self.cache) > 100:
            # Remove oldest entries
            sorted_items = sorted(
                self.cache.items(), 
                key=lambda x: x[1]["timestamp"]
            )
            for old_key, _ in sorted_items[:20]:  # Remove oldest 20 entries
                del self.cache[old_key]


# Global service instance
github_service = GitHubService()