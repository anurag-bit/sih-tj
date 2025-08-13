"""
Search service for semantic search functionality using ChromaDB and sentence-transformers.
"""
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

import chromadb
from sentence_transformers import SentenceTransformer

from ..models import ProblemStatement, SearchResult
from ..config import settings

logger = logging.getLogger(__name__)


class SearchServiceError(Exception):
    """Custom exception for search service errors."""
    pass


class SearchService:
    """Service for performing semantic search on problem statements."""
    
    def __init__(self):
        """Initialize the search service."""
        self.model_name = settings.embedding_model
        self.collection_name = "problem_statements"
        self.chroma_client = None
        self.collection = None
        self.sentence_model = None
        self._initialized = False
    
    async def initialize(self) -> None:
        """Initialize ChromaDB connection and sentence transformer model."""
        if self._initialized:
            return
            
        try:
            logger.info("Initializing search service...")
            
            # Initialize sentence transformer model
            logger.info(f"Loading sentence transformer model: {self.model_name}")
            self.sentence_model = SentenceTransformer(self.model_name)
            
            # Initialize ChromaDB client
            await self._connect_to_chromadb()
            
            self._initialized = True
            logger.info("Search service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize search service: {str(e)}")
            raise SearchServiceError(f"Search service initialization failed: {str(e)}")
    
    async def _connect_to_chromadb(self) -> None:
        """Connect to ChromaDB and get the collection."""
        try:
            # Try HTTP client first
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
            raise SearchServiceError(f"ChromaDB connection failed: {str(e)}")
    
    def _convert_metadata_to_problem(self, doc_id: str, metadata: Dict[str, Any], document: str, distance: float) -> SearchResult:
        """Convert ChromaDB metadata to ProblemStatement model."""
        try:
            # Parse technology stack from JSON string
            tech_stack = []
            if metadata.get("technology_stack"):
                try:
                    tech_stack = json.loads(metadata["technology_stack"])
                except (json.JSONDecodeError, TypeError):
                    tech_stack = []
            
            # Extract description from document text if not in metadata
            description = metadata.get("description", "")
            if not description and document:
                # Parse description from document format: "title\ndescription\nTech Stack: ..."
                lines = document.split('\n')
                if len(lines) >= 2:
                    description = lines[1]  # Second line should be description
            
            # Create ProblemStatement
            problem = ProblemStatement(
                id=doc_id,
                title=metadata.get("title", ""),
                organization=metadata.get("organization", "Unknown"),
                category=metadata.get("category", "General"),
                description=description,
                technology_stack=tech_stack,
                difficulty_level=metadata.get("difficulty_level", "Medium"),
                created_at=datetime.fromisoformat(metadata["created_at"]) if metadata.get("created_at") else None
            )
            
            # Convert distance to similarity score (cosine distance to similarity)
            similarity_score = max(0.0, 1.0 - distance)
            
            return SearchResult(
                problem=problem,
                similarity_score=similarity_score
            )
            
        except Exception as e:
            logger.warning(f"Failed to convert metadata for document {doc_id}: {str(e)}")
            # Return a minimal result to avoid breaking the search
            problem = ProblemStatement(
                id=doc_id,
                title=metadata.get("title", "Unknown"),
                organization=metadata.get("organization", "Unknown"),
                category=metadata.get("category", "General"),
                description=document if document else "",
                technology_stack=[],
                difficulty_level="Medium"
            )
            return SearchResult(problem=problem, similarity_score=0.0)
    
    async def search(self, query: str, limit: int = 20) -> List[SearchResult]:
        """
        Perform semantic search on problem statements.
        
        Args:
            query: Natural language search query
            limit: Maximum number of results to return
            
        Returns:
            List of SearchResult objects ranked by similarity
            
        Raises:
            SearchServiceError: If search fails
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            logger.info(f"Performing semantic search for query: '{query}' (limit: {limit})")
            
            # Generate query embedding
            embeddings = self.sentence_model.encode([query])
            if hasattr(embeddings, 'tolist'):
                query_embedding = embeddings[0].tolist()
            else:
                # Handle case where embeddings is already a list (e.g., in tests)
                query_embedding = embeddings[0] if isinstance(embeddings[0], list) else list(embeddings[0])
            
            # Perform vector similarity search
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=min(limit, 100),  # Cap at 100 for performance
                include=["metadatas", "documents", "distances"]
            )
            
            # Convert results to SearchResult objects
            search_results = []
            
            if results["ids"] and results["ids"][0]:
                for doc_id, metadata, document, distance in zip(
                    results["ids"][0],
                    results["metadatas"][0],
                    results["documents"][0],
                    results["distances"][0]
                ):
                    search_result = self._convert_metadata_to_problem(doc_id, metadata, document, distance)
                    search_results.append(search_result)
            
            logger.info(f"Found {len(search_results)} results for query: '{query}'")
            return search_results
            
        except Exception as e:
            logger.error(f"Search failed for query '{query}': {str(e)}")
            raise SearchServiceError(f"Search operation failed: {str(e)}")
    
    async def get_problem_by_id(self, problem_id: str) -> Optional[ProblemStatement]:
        """
        Get a specific problem statement by ID.
        
        Args:
            problem_id: The problem statement ID
            
        Returns:
            ProblemStatement if found, None otherwise
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            logger.info(f"Fetching problem by ID: {problem_id}")
            
            # Query by ID
            results = self.collection.get(
                ids=[problem_id],
                include=["metadatas", "documents"]
            )
            
            if results["ids"] and results["ids"][0]:
                metadata = results["metadatas"][0]
                document = results["documents"][0] if results["documents"] else ""
                search_result = self._convert_metadata_to_problem(problem_id, metadata, document, 0.0)
                return search_result.problem
            
            logger.warning(f"Problem not found: {problem_id}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to fetch problem {problem_id}: {str(e)}")
            raise SearchServiceError(f"Failed to fetch problem: {str(e)}")
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the problem statements collection.
        
        Returns:
            Dictionary with collection statistics
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            count = self.collection.count()
            
            # Get a sample of documents to analyze categories and organizations
            sample_results = self.collection.get(
                limit=min(1000, count),  # Sample up to 1000 documents
                include=["metadatas"]
            )
            
            categories = {}
            organizations = {}
            
            if sample_results["metadatas"]:
                for metadata in sample_results["metadatas"]:
                    category = metadata.get("category", "Unknown")
                    organization = metadata.get("organization", "Unknown")
                    
                    categories[category] = categories.get(category, 0) + 1
                    organizations[organization] = organizations.get(organization, 0) + 1
            
            return {
                "total_problems": count,
                "categories": categories,
                "organizations": organizations,
                "collection_name": self.collection_name
            }
            
        except Exception as e:
            logger.error(f"Failed to get collection stats: {str(e)}")
            raise SearchServiceError(f"Failed to get collection statistics: {str(e)}")
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform a health check on the search service.
        
        Returns:
            Dictionary with health status
        """
        try:
            if not self._initialized:
                await self.initialize()
            
            # Test a simple query
            test_results = await self.search("test", limit=1)
            
            stats = await self.get_collection_stats()
            
            return {
                "status": "healthy",
                "initialized": self._initialized,
                "model_loaded": self.sentence_model is not None,
                "chromadb_connected": self.collection is not None,
                "total_problems": stats.get("total_problems", 0),
                "test_query_results": len(test_results)
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "initialized": self._initialized
            }


# Global search service instance
search_service = SearchService()