#!/usr/bin/env python3
"""
Test script to verify ChromaDB search functionality.
"""

import sys
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.append(str(backend_path))

import chromadb
from sentence_transformers import SentenceTransformer

def test_search():
    """Test the search functionality."""
    print("Testing ChromaDB search functionality...")
    
    # Initialize sentence transformer
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    # Connect to ChromaDB
    client = chromadb.Client()
    
    # Try to get existing collection, create if it doesn't exist
    try:
        collection = client.get_collection("problem_statements")
        print("Found existing collection")
    except ValueError:
        print("Collection not found. Please run the ingestion script first:")
        print("python scripts/ingest_data.py")
        return
    
    # Test queries
    test_queries = [
        "machine learning for healthcare",
        "blockchain technology",
        "IoT sensors for agriculture",
        "web development with React"
    ]
    
    for query in test_queries:
        print(f"\n--- Query: '{query}' ---")
        
        # Perform search
        results = collection.query(
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
                print(f"   Tech Stack: {metadata['technology_stack']}")
                print()
        else:
            print("No results found")

if __name__ == "__main__":
    test_search()