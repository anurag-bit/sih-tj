#!/usr/bin/env python3
"""
Data ingestion script for SIH problem statements.
Downloads problem statements from HuggingFace Hub and stores them in ChromaDB.
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

# Add backend to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.append(str(backend_path))

import httpx
import chromadb
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel, ValidationError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ProblemStatement(BaseModel):
    """Pydantic model for problem statement validation."""
    id: str
    title: str
    organization: str
    category: str
    description: str
    technology_stack: List[str] = []
    difficulty_level: str = "Medium"
    created_at: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        """Set created_at if not provided."""
        if not self.created_at:
            self.created_at = datetime.now().isoformat()


class DataIngestionError(Exception):
    """Custom exception for data ingestion errors."""
    pass


class SIHDataIngester:
    """Handles downloading and ingesting SIH problem statements."""
    
    def __init__(self, chroma_host: str = "localhost", chroma_port: int = 8001):
        """Initialize the data ingester."""
        self.chroma_host = chroma_host
        self.chroma_port = chroma_port
        self.model_name = "all-MiniLM-L6-v2"
        self.collection_name = "problem_statements"
        
        # Initialize sentence transformer
        logger.info(f"Loading sentence transformer model: {self.model_name}")
        self.sentence_model = SentenceTransformer(self.model_name)
        
        # Initialize ChromaDB client
        self.chroma_client = None
        self.collection = None
        
    def connect_to_chromadb(self) -> None:
        """Connect to ChromaDB and create/get collection."""
        try:
            # Try HTTP client first, fallback to embedded client
            try:
                logger.info(f"Attempting to connect to ChromaDB HTTP server at {self.chroma_host}:{self.chroma_port}")
                self.chroma_client = chromadb.HttpClient(
                    host=self.chroma_host,
                    port=self.chroma_port
                )
                # Test connection
                self.chroma_client.heartbeat()
                logger.info("Successfully connected to ChromaDB HTTP server")
            except Exception as http_error:
                logger.warning(f"HTTP connection failed: {str(http_error)}")
                logger.info("Falling back to embedded ChromaDB client for testing")
                self.chroma_client = chromadb.Client()
            
            # Create or get collection
            self.collection = self.chroma_client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}  # Use cosine similarity
            )
            logger.info(f"Connected to collection: {self.collection_name}")
            
        except Exception as e:
            raise DataIngestionError(f"Failed to connect to ChromaDB: {str(e)}")
    
    def download_from_huggingface(self, dataset_url: str) -> List[Dict[str, Any]]:
        """Download problem statements from HuggingFace Hub."""
        try:
            logger.info(f"Downloading data from HuggingFace: {dataset_url}")
            
            with httpx.Client(timeout=30.0) as client:
                response = client.get(dataset_url)
                response.raise_for_status()
                
                # Parse JSON data
                data = response.json()
                logger.info(f"Downloaded {len(data)} problem statements")
                return data
                
        except httpx.HTTPError as e:
            raise DataIngestionError(f"HTTP error downloading data: {str(e)}")
        except json.JSONDecodeError as e:
            raise DataIngestionError(f"JSON decode error: {str(e)}")
        except Exception as e:
            raise DataIngestionError(f"Unexpected error downloading data: {str(e)}")
    
    def validate_problem_statement(self, data: Dict[str, Any]) -> Optional[ProblemStatement]:
        """Validate and clean a single problem statement."""
        try:
            # Ensure required fields exist with defaults
            cleaned_data = {
                "id": data.get("id", f"problem_{hash(str(data))}"),
                "title": data.get("title", "").strip(),
                "organization": data.get("organization", "Unknown").strip(),
                "category": data.get("category", "General").strip(),
                "description": data.get("description", "").strip(),
                "technology_stack": data.get("technology_stack", []),
                "difficulty_level": data.get("difficulty_level", "Medium").strip()
            }
            
            # Validate required fields are not empty
            if not cleaned_data["title"] or not cleaned_data["description"]:
                logger.warning(f"Skipping problem with missing title or description: {cleaned_data['id']}")
                return None
            
            # Ensure technology_stack is a list
            if isinstance(cleaned_data["technology_stack"], str):
                cleaned_data["technology_stack"] = [cleaned_data["technology_stack"]]
            elif not isinstance(cleaned_data["technology_stack"], list):
                cleaned_data["technology_stack"] = []
            
            return ProblemStatement(**cleaned_data)
            
        except ValidationError as e:
            logger.warning(f"Validation error for problem statement: {str(e)}")
            return None
        except Exception as e:
            logger.warning(f"Unexpected error validating problem statement: {str(e)}")
            return None
    
    def generate_embeddings(self, problems: List[ProblemStatement]) -> List[List[float]]:
        """Generate vector embeddings for problem statements."""
        logger.info("Generating vector embeddings...")
        
        # Create text for embedding (title + description + tech stack)
        texts = []
        for problem in problems:
            tech_stack_text = " ".join(problem.technology_stack)
            combined_text = f"{problem.title} {problem.description} {tech_stack_text}"
            texts.append(combined_text)
        
        # Generate embeddings
        embeddings = self.sentence_model.encode(texts, show_progress_bar=True)
        logger.info(f"Generated {len(embeddings)} embeddings")
        
        return embeddings.tolist()
    
    def store_in_chromadb(self, problems: List[ProblemStatement], embeddings: List[List[float]]) -> None:
        """Store problem statements and embeddings in ChromaDB."""
        logger.info("Storing data in ChromaDB...")
        
        # Prepare data for ChromaDB
        ids = [problem.id for problem in problems]
        metadatas = []
        documents = []
        
        for problem in problems:
            # Create metadata
            metadata = {
                "title": problem.title,
                "organization": problem.organization,
                "category": problem.category,
                "technology_stack": json.dumps(problem.technology_stack),
                "difficulty_level": problem.difficulty_level,
                "created_at": problem.created_at
            }
            metadatas.append(metadata)
            
            # Create document text for ChromaDB
            tech_stack_text = " ".join(problem.technology_stack)
            document = f"{problem.title}\n{problem.description}\nTech Stack: {tech_stack_text}"
            documents.append(document)
        
        try:
            # Store in ChromaDB
            self.collection.add(
                ids=ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=documents
            )
            logger.info(f"Successfully stored {len(problems)} problem statements in ChromaDB")
            
        except Exception as e:
            raise DataIngestionError(f"Failed to store data in ChromaDB: {str(e)}")
    
    def verify_ingestion(self) -> Dict[str, Any]:
        """Verify that data was ingested correctly."""
        try:
            # Get collection info
            count = self.collection.count()
            
            # Test a sample query
            test_results = self.collection.query(
                query_texts=["machine learning"],
                n_results=min(5, count)
            )
            
            verification_info = {
                "total_documents": count,
                "sample_query_results": len(test_results["ids"][0]) if test_results["ids"] else 0,
                "collection_name": self.collection_name,
                "status": "success"
            }
            
            logger.info(f"Verification complete: {verification_info}")
            return verification_info
            
        except Exception as e:
            logger.error(f"Verification failed: {str(e)}")
            return {"status": "failed", "error": str(e)}
    
    def ingest_data(self, dataset_url: str) -> Dict[str, Any]:
        """Main ingestion workflow."""
        try:
            # Connect to ChromaDB
            self.connect_to_chromadb()
            
            # Download data
            raw_data = self.download_from_huggingface(dataset_url)
            
            # Validate and clean data
            logger.info("Validating problem statements...")
            valid_problems = []
            for item in raw_data:
                problem = self.validate_problem_statement(item)
                if problem:
                    valid_problems.append(problem)
            
            if not valid_problems:
                raise DataIngestionError("No valid problem statements found after validation")
            
            logger.info(f"Validated {len(valid_problems)} out of {len(raw_data)} problem statements")
            
            # Generate embeddings
            embeddings = self.generate_embeddings(valid_problems)
            
            # Store in ChromaDB
            self.store_in_chromadb(valid_problems, embeddings)
            
            # Verify ingestion
            verification = self.verify_ingestion()
            
            return {
                "status": "success",
                "total_downloaded": len(raw_data),
                "total_valid": len(valid_problems),
                "total_stored": verification.get("total_documents", 0),
                "verification": verification
            }
            
        except Exception as e:
            logger.error(f"Data ingestion failed: {str(e)}")
            return {
                "status": "failed",
                "error": str(e)
            }


def test_search_functionality(ingester: SIHDataIngester) -> None:
    """Test the search functionality with sample queries."""
    test_queries = [
        "machine learning for healthcare",
        "blockchain technology", 
        "IoT sensors for agriculture",
        "web development with React"
    ]
    
    for query in test_queries:
        print(f"\n--- Query: '{query}' ---")
        
        try:
            # Perform search
            results = ingester.collection.query(
                query_texts=[query],
                n_results=3
            )
            
            if results["ids"] and results["ids"][0]:
                for i, (doc_id, metadata, document, distance) in enumerate(zip(
                    results["ids"][0],
                    results["metadatas"][0], 
                    results["documents"][0],
                    results["distances"][0]
                )):
                    print(f"{i+1}. {metadata['title']} (Distance: {distance:.3f})")
                    print(f"   Organization: {metadata['organization']}")
                    print(f"   Category: {metadata['category']}")
                    tech_stack = json.loads(metadata['technology_stack'])
                    print(f"   Tech Stack: {', '.join(tech_stack)}")
                    print()
            else:
                print("No results found")
                
        except Exception as e:
            print(f"Search failed: {str(e)}")


def create_sample_data() -> List[Dict[str, Any]]:
    """Create sample problem statements for testing when HuggingFace data is not available."""
    return [
        {
            "id": "sih_001",
            "title": "AI-Based Traffic Management System",
            "organization": "Ministry of Road Transport and Highways",
            "category": "Software",
            "description": "Develop an AI-powered traffic management system that can optimize traffic flow in real-time using computer vision and machine learning algorithms. The system should be able to detect traffic congestion, predict traffic patterns, and automatically adjust traffic signals to minimize wait times.",
            "technology_stack": ["Python", "TensorFlow", "OpenCV", "FastAPI", "PostgreSQL"],
            "difficulty_level": "Hard"
        },
        {
            "id": "sih_002", 
            "title": "Smart Agriculture Monitoring Platform",
            "organization": "Ministry of Agriculture",
            "category": "IoT",
            "description": "Create an IoT-based platform for monitoring crop health, soil conditions, and weather patterns. The system should provide farmers with real-time insights and recommendations for optimal crop management.",
            "technology_stack": ["Arduino", "Raspberry Pi", "Python", "React", "MongoDB"],
            "difficulty_level": "Medium"
        },
        {
            "id": "sih_003",
            "title": "Blockchain-Based Digital Identity System",
            "organization": "Ministry of Electronics and IT",
            "category": "Blockchain",
            "description": "Develop a secure, decentralized digital identity management system using blockchain technology. The system should allow citizens to manage their digital identities while ensuring privacy and security.",
            "technology_stack": ["Solidity", "Ethereum", "Web3.js", "React", "IPFS"],
            "difficulty_level": "Hard"
        },
        {
            "id": "sih_004",
            "title": "Healthcare Appointment Scheduling System",
            "organization": "Ministry of Health and Family Welfare",
            "category": "Software",
            "description": "Build a comprehensive appointment scheduling system for healthcare facilities that can handle patient registration, doctor availability, and automated reminders.",
            "technology_stack": ["Node.js", "Express", "React", "MySQL", "Redis"],
            "difficulty_level": "Medium"
        },
        {
            "id": "sih_005",
            "title": "Renewable Energy Monitoring Dashboard",
            "organization": "Ministry of New and Renewable Energy",
            "category": "Software",
            "description": "Create a real-time monitoring dashboard for renewable energy installations including solar panels and wind turbines. The system should track energy production, efficiency metrics, and maintenance schedules.",
            "technology_stack": ["Python", "Django", "Vue.js", "InfluxDB", "Grafana"],
            "difficulty_level": "Medium"
        }
    ]


def main():
    """Main data ingestion function."""
    # Configuration
    chroma_host = os.getenv("CHROMA_HOST", "localhost")
    chroma_port = int(os.getenv("CHROMA_PORT", "8001"))
    
    # HuggingFace dataset URL (placeholder - replace with actual dataset)
    dataset_url = os.getenv(
        "HUGGINGFACE_DATASET_URL", 
        "https://huggingface.co/datasets/sih-problems/raw/main/problems.json"
    )
    
    # Initialize ingester
    ingester = SIHDataIngester(chroma_host=chroma_host, chroma_port=chroma_port)
    
    try:
        # Try to download from HuggingFace first
        logger.info("Starting data ingestion process...")
        result = ingester.ingest_data(dataset_url)
        
        if result["status"] == "failed" and "HTTP" in str(result.get("error", "")):
            # If HuggingFace download fails, use sample data
            logger.warning("HuggingFace download failed, using sample data for testing...")
            
            # Create sample data and ingest
            sample_data = create_sample_data()
            
            # Connect to ChromaDB
            ingester.connect_to_chromadb()
            
            # Validate sample data
            valid_problems = []
            for item in sample_data:
                problem = ingester.validate_problem_statement(item)
                if problem:
                    valid_problems.append(problem)
            
            # Generate embeddings and store
            embeddings = ingester.generate_embeddings(valid_problems)
            ingester.store_in_chromadb(valid_problems, embeddings)
            
            # Verify
            verification = ingester.verify_ingestion()
            
            result = {
                "status": "success",
                "total_downloaded": len(sample_data),
                "total_valid": len(valid_problems),
                "total_stored": verification.get("total_documents", 0),
                "verification": verification,
                "note": "Used sample data due to HuggingFace unavailability"
            }
        
        # Print results
        print("\n" + "="*50)
        print("DATA INGESTION RESULTS")
        print("="*50)
        print(f"Status: {result['status']}")
        
        if result["status"] == "success":
            print(f"Total Downloaded: {result['total_downloaded']}")
            print(f"Total Valid: {result['total_valid']}")
            print(f"Total Stored: {result['total_stored']}")
            if "note" in result:
                print(f"Note: {result['note']}")
            
            # Test search functionality
            print("\n" + "="*50)
            print("TESTING SEARCH FUNCTIONALITY")
            print("="*50)
            test_search_functionality(ingester)
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")
        
        print("="*50)
        
    except Exception as e:
        logger.error(f"Fatal error in main: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()