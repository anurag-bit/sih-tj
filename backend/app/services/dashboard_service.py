"""
Dashboard service for analytics and statistics generation.
Provides aggregated data for dashboard visualizations including categories, keywords, and organizations.
"""
import json
import logging
import re
from collections import Counter, defaultdict
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
import asyncio

import chromadb
from ..models import DashboardStats
from ..config import settings

logger = logging.getLogger(__name__)


class DashboardServiceError(Exception):
    """Custom exception for dashboard service errors."""
    pass


class DashboardService:
    """Service for generating dashboard analytics and statistics."""
    
    def __init__(self):
        """Initialize the dashboard service."""
        self.collection_name = "problem_statements"
        self.chroma_client = None
        self.collection = None
        self._initialized = False
        
        # In-memory cache for dashboard data
        self._cache = {}
        self._cache_timestamp = None
        self._cache_ttl = timedelta(minutes=15)  # Cache for 15 minutes
        
        # Common stop words to filter from keywords
        self._stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
            'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
            'my', 'your', 'his', 'her', 'its', 'our', 'their', 'system', 'using', 'based',
            'develop', 'create', 'build', 'implement', 'application', 'platform', 'solution'
        }
    
    async def initialize(self) -> None:
        """Initialize ChromaDB connection."""
        if self._initialized:
            return
            
        try:
            logger.info("Initializing dashboard service...")
            
            # Initialize ChromaDB client
            await self._connect_to_chromadb()
            
            self._initialized = True
            logger.info("Dashboard service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize dashboard service: {str(e)}")
            raise DashboardServiceError(f"Dashboard service initialization failed: {str(e)}")
    
    async def _connect_to_chromadb(self) -> None:
        """Connect to ChromaDB and get the collection."""
        try:
            logger.info(f"Connecting to ChromaDB at {settings.chroma_host}:{settings.chroma_port}")
            self.chroma_client = chromadb.HttpClient(
                host=settings.chroma_host,
                port=settings.chroma_port
            )
            
            # Test connection
            self.chroma_client.heartbeat()
            logger.info("Successfully connected to ChromaDB HTTP server")
            
            # Get the collection
            self.collection = self.chroma_client.get_collection(
                name=self.collection_name
            )
            logger.info(f"Connected to collection: {self.collection_name}")
            
        except Exception as e:
            logger.error(f"Failed to connect to ChromaDB: {str(e)}")
            raise DashboardServiceError(f"ChromaDB connection failed: {str(e)}")
    
    def _is_cache_valid(self) -> bool:
        """Check if the cache is still valid."""
        if not self._cache_timestamp:
            return False
        return datetime.now() - self._cache_timestamp < self._cache_ttl
    
    def _extract_keywords_from_text(self, text: str, min_length: int = 3) -> List[str]:
        """Extract meaningful keywords from text."""
        if not text:
            return []
        
        # Convert to lowercase and extract words
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        
        # Filter out stop words and short words
        keywords = [
            word for word in words 
            if len(word) >= min_length and word not in self._stop_words
        ]
        
        return keywords
    
    def _extract_tech_keywords(self, tech_stack: List[str]) -> List[str]:
        """Extract and normalize technology keywords."""
        tech_keywords = []
        
        for tech in tech_stack:
            if not tech:
                continue
                
            # Normalize common technology names
            tech_lower = tech.lower().strip()
            
            # Map common variations to standard names
            tech_mapping = {
                'js': 'javascript',
                'ts': 'typescript',
                'py': 'python',
                'react.js': 'react',
                'vue.js': 'vue',
                'node.js': 'nodejs',
                'express.js': 'express',
                'next.js': 'nextjs',
                'tensorflow': 'tensorflow',
                'pytorch': 'pytorch',
                'scikit-learn': 'sklearn',
                'opencv': 'opencv',
                'postgresql': 'postgres',
                'mongodb': 'mongo',
                'mysql': 'mysql',
                'redis': 'redis',
                'docker': 'docker',
                'kubernetes': 'k8s',
                'aws': 'aws',
                'azure': 'azure',
                'gcp': 'gcp'
            }
            
            normalized_tech = tech_mapping.get(tech_lower, tech_lower)
            tech_keywords.append(normalized_tech)
        
        return tech_keywords
    
    async def _fetch_all_problem_data(self) -> List[Dict[str, Any]]:
        """Fetch all problem statement data from ChromaDB."""
        try:
            # Get total count
            total_count = self.collection.count()
            logger.info(f"Fetching {total_count} problem statements for analytics")
            
            # Fetch all data in batches to avoid memory issues
            batch_size = 1000
            all_data = []
            
            for offset in range(0, total_count, batch_size):
                batch_results = self.collection.get(
                    limit=min(batch_size, total_count - offset),
                    offset=offset,
                    include=["metadatas", "documents"]
                )
                
                if batch_results["ids"]:
                    for i, doc_id in enumerate(batch_results["ids"]):
                        metadata = batch_results["metadatas"][i] if batch_results["metadatas"] else {}
                        document = batch_results["documents"][i] if batch_results["documents"] else ""
                        
                        all_data.append({
                            "id": doc_id,
                            "metadata": metadata,
                            "document": document
                        })
            
            logger.info(f"Successfully fetched {len(all_data)} problem statements")
            return all_data
            
        except Exception as e:
            logger.error(f"Failed to fetch problem data: {str(e)}")
            raise DashboardServiceError(f"Failed to fetch problem data: {str(e)}")
    
    def _analyze_categories(self, problem_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """Analyze problem statements by category."""
        categories = Counter()
        
        for item in problem_data:
            metadata = item.get("metadata", {})
            category = metadata.get("category", "Unknown").strip()
            if category:
                categories[category] += 1
        
        return dict(categories)
    
    def _analyze_organizations(self, problem_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """Analyze problem statements by organization."""
        organizations = Counter()
        
        for item in problem_data:
            metadata = item.get("metadata", {})
            organization = metadata.get("organization", "Unknown").strip()
            if organization:
                organizations[organization] += 1
        
        return dict(organizations)
    
    def _analyze_keywords(self, problem_data: List[Dict[str, Any]], top_n: int = 50) -> List[Tuple[str, int]]:
        """Analyze and extract top keywords from problem statements."""
        all_keywords = Counter()
        tech_keywords = Counter()
        
        for item in problem_data:
            metadata = item.get("metadata", {})
            document = item.get("document", "")
            
            # Extract keywords from title and description
            title = metadata.get("title", "")
            description_text = ""
            
            # Extract description from document if available
            if document:
                lines = document.split('\n')
                if len(lines) >= 2:
                    description_text = lines[1]  # Second line should be description
            
            # Combine title and description for keyword extraction
            combined_text = f"{title} {description_text}"
            text_keywords = self._extract_keywords_from_text(combined_text)
            all_keywords.update(text_keywords)
            
            # Extract technology keywords
            tech_stack_str = metadata.get("technology_stack", "[]")
            try:
                tech_stack = json.loads(tech_stack_str) if tech_stack_str else []
            except (json.JSONDecodeError, TypeError):
                tech_stack = []
            
            if tech_stack:
                tech_keywords_list = self._extract_tech_keywords(tech_stack)
                tech_keywords.update(tech_keywords_list)
        
        # Combine text keywords and tech keywords, giving more weight to tech keywords
        combined_keywords = Counter()
        
        # Add text keywords
        for keyword, count in all_keywords.items():
            combined_keywords[keyword] = count
        
        # Add tech keywords with higher weight
        for keyword, count in tech_keywords.items():
            combined_keywords[keyword] += count * 2  # Give tech keywords 2x weight
        
        # Return top N keywords
        return combined_keywords.most_common(top_n)
    
    def _generate_dashboard_stats(self, problem_data: List[Dict[str, Any]]) -> DashboardStats:
        """Generate comprehensive dashboard statistics."""
        logger.info("Generating dashboard statistics...")
        
        # Analyze categories
        categories = self._analyze_categories(problem_data)
        logger.info(f"Found {len(categories)} categories")
        
        # Analyze organizations (get top 10)
        all_organizations = self._analyze_organizations(problem_data)
        top_organizations = dict(Counter(all_organizations).most_common(10))
        logger.info(f"Found {len(all_organizations)} organizations, showing top 10")
        
        # Analyze keywords (get top 30 for word cloud)
        top_keywords = self._analyze_keywords(problem_data, top_n=30)
        logger.info(f"Extracted {len(top_keywords)} top keywords")
        
        # Calculate total problems
        total_problems = len(problem_data)
        
        return DashboardStats(
            categories=categories,
            top_keywords=top_keywords,
            top_organizations=top_organizations,
            total_problems=total_problems
        )
    
    async def get_dashboard_stats(self, force_refresh: bool = False) -> DashboardStats:
        """
        Get dashboard statistics with caching.
        
        Args:
            force_refresh: If True, bypass cache and fetch fresh data
            
        Returns:
            DashboardStats object with all analytics data
            
        Raises:
            DashboardServiceError: If statistics generation fails
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            # Check cache first (unless force refresh is requested)
            if not force_refresh and self._is_cache_valid() and "stats" in self._cache:
                logger.info("Returning cached dashboard statistics")
                return self._cache["stats"]
            
            logger.info("Generating fresh dashboard statistics...")
            
            # Fetch all problem data
            problem_data = await self._fetch_all_problem_data()
            
            if not problem_data:
                logger.warning("No problem data found for dashboard analytics")
                return DashboardStats(
                    categories={},
                    top_keywords=[],
                    top_organizations={},
                    total_problems=0
                )
            
            # Generate statistics
            stats = self._generate_dashboard_stats(problem_data)
            
            # Update cache
            self._cache["stats"] = stats
            self._cache_timestamp = datetime.now()
            
            logger.info(f"Dashboard statistics generated successfully: {stats.total_problems} problems analyzed")
            return stats
            
        except Exception as e:
            logger.error(f"Failed to generate dashboard statistics: {str(e)}")
            raise DashboardServiceError(f"Dashboard statistics generation failed: {str(e)}")
    
    async def get_category_breakdown(self) -> Dict[str, Any]:
        """Get detailed category breakdown with percentages."""
        stats = await self.get_dashboard_stats()
        
        total = stats.total_problems
        if total == 0:
            return {"categories": {}, "total": 0}
        
        category_breakdown = {}
        for category, count in stats.categories.items():
            percentage = (count / total) * 100
            category_breakdown[category] = {
                "count": count,
                "percentage": round(percentage, 1)
            }
        
        return {
            "categories": category_breakdown,
            "total": total
        }
    
    async def get_technology_trends(self) -> Dict[str, Any]:
        """Get technology trends from the keyword analysis."""
        stats = await self.get_dashboard_stats()
        
        # Filter keywords that are likely to be technologies
        tech_indicators = {
            'python', 'javascript', 'java', 'react', 'nodejs', 'django', 'flask',
            'tensorflow', 'pytorch', 'opencv', 'mysql', 'postgres', 'mongodb',
            'docker', 'kubernetes', 'aws', 'azure', 'blockchain', 'ai', 'ml',
            'machine', 'learning', 'deep', 'neural', 'iot', 'arduino', 'raspberry'
        }
        
        tech_keywords = []
        other_keywords = []
        
        for keyword, count in stats.top_keywords:
            if any(tech in keyword.lower() for tech in tech_indicators):
                tech_keywords.append((keyword, count))
            else:
                other_keywords.append((keyword, count))
        
        return {
            "technology_keywords": tech_keywords[:15],  # Top 15 tech keywords
            "domain_keywords": other_keywords[:15],     # Top 15 domain keywords
            "total_keywords": len(stats.top_keywords)
        }
    
    async def clear_cache(self) -> None:
        """Clear the dashboard cache."""
        self._cache.clear()
        self._cache_timestamp = None
        logger.info("Dashboard cache cleared")
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform a health check on the dashboard service.
        
        Returns:
            Dictionary with health status
        """
        try:
            if not self._initialized:
                await self.initialize()
            
            # Test basic functionality
            stats = await self.get_dashboard_stats()
            
            return {
                "status": "healthy",
                "initialized": self._initialized,
                "chromadb_connected": self.collection is not None,
                "total_problems": stats.total_problems,
                "categories_count": len(stats.categories),
                "organizations_count": len(stats.top_organizations),
                "keywords_count": len(stats.top_keywords),
                "cache_valid": self._is_cache_valid()
            }
            
        except Exception as e:
            logger.error(f"Dashboard health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "initialized": self._initialized
            }


# Global dashboard service instance
dashboard_service = DashboardService()