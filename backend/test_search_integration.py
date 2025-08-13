#!/usr/bin/env python3
"""
Integration test script for search functionality.
This script tests the search service with sample data.
"""
import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.search_service import SearchService, SearchServiceError


async def test_search_integration():
    """Test the search service integration."""
    print("Testing Search Service Integration")
    print("=" * 50)
    
    # Initialize search service
    search_service = SearchService()
    
    try:
        # Test health check first
        print("1. Testing health check...")
        health = await search_service.health_check()
        print(f"   Health Status: {health.get('status', 'unknown')}")
        
        if health.get('status') != 'healthy':
            print(f"   Health check failed: {health}")
            if 'error' in health:
                print(f"   Error details: {health['error']}")
            print("\n   This is expected if ChromaDB is not running or no data is ingested.")
            print("   To fix this:")
            print("   1. Start ChromaDB: docker-compose up chroma-db")
            print("   2. Run data ingestion: python scripts/ingest_data.py")
            return
        
        print("   ✓ Health check passed")
        
        # Test collection stats
        print("\n2. Testing collection statistics...")
        stats = await search_service.get_collection_stats()
        print(f"   Total problems: {stats.get('total_problems', 0)}")
        print(f"   Categories: {list(stats.get('categories', {}).keys())}")
        print(f"   Organizations: {list(stats.get('organizations', {}).keys())}")
        
        if stats.get('total_problems', 0) == 0:
            print("   No problems found in database. Run data ingestion first.")
            return
        
        print("   ✓ Collection stats retrieved")
        
        # Test search functionality
        print("\n3. Testing semantic search...")
        test_queries = [
            "machine learning artificial intelligence",
            "web development React JavaScript",
            "IoT sensors agriculture",
            "blockchain technology"
        ]
        
        for query in test_queries:
            print(f"\n   Query: '{query}'")
            try:
                results = await search_service.search(query, limit=3)
                print(f"   Found {len(results)} results:")
                
                for i, result in enumerate(results[:2], 1):  # Show top 2 results
                    problem = result.problem
                    score = result.similarity_score
                    print(f"     {i}. {problem.title} (Score: {score:.3f})")
                    print(f"        Organization: {problem.organization}")
                    print(f"        Category: {problem.category}")
                    if problem.technology_stack:
                        print(f"        Tech Stack: {', '.join(problem.technology_stack[:3])}")
                
            except Exception as e:
                print(f"   Search failed: {str(e)}")
        
        print("\n   ✓ Search functionality tested")
        
        # Test get problem by ID
        print("\n4. Testing get problem by ID...")
        try:
            # Get the first result from the last search
            if 'results' in locals() and results:
                first_problem_id = results[0].problem.id
                problem = await search_service.get_problem_by_id(first_problem_id)
                
                if problem:
                    print(f"   Retrieved problem: {problem.title}")
                    print(f"   Description: {problem.description[:100]}...")
                    print("   ✓ Get problem by ID works")
                else:
                    print("   Problem not found by ID")
            else:
                print("   No previous search results to test with")
                
        except Exception as e:
            print(f"   Get problem by ID failed: {str(e)}")
        
        print("\n" + "=" * 50)
        print("Integration test completed successfully!")
        
    except SearchServiceError as e:
        print(f"Search service error: {str(e)}")
        print("\nThis might be because:")
        print("1. ChromaDB is not running")
        print("2. No data has been ingested")
        print("3. Configuration issues")
        
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_search_integration())