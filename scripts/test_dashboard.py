#!/usr/bin/env python3
"""
Test script for dashboard analytics functionality.
Tests the dashboard service with embedded ChromaDB client.
"""

import os
import sys
import json
import asyncio
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.append(str(backend_path))

from app.services.dashboard_service import DashboardService
from app.models import DashboardStats


async def test_dashboard_service():
    """Test the dashboard service functionality."""
    print("="*60)
    print("TESTING DASHBOARD ANALYTICS SERVICE")
    print("="*60)
    
    # Create dashboard service instance
    dashboard_service = DashboardService()
    
    # Override ChromaDB connection to use embedded client (for testing)
    import chromadb
    dashboard_service.chroma_client = chromadb.Client()
    
    try:
        # Get or create collection
        dashboard_service.collection = dashboard_service.chroma_client.get_or_create_collection(
            name="problem_statements",
            metadata={"hnsw:space": "cosine"}
        )
        dashboard_service._initialized = True
        
        print("✓ Connected to ChromaDB (embedded client)")
        
        # Check if we have data
        count = dashboard_service.collection.count()
        print(f"✓ Found {count} problem statements in database")
        
        if count == 0:
            print("⚠ No data found. Please run the ingestion script first:")
            print("  python scripts/ingest_data.py")
            return
        
        # Test health check
        print("\n--- Testing Health Check ---")
        health = await dashboard_service.health_check()
        print(f"Health Status: {health['status']}")
        print(f"Total Problems: {health.get('total_problems', 'N/A')}")
        print(f"Categories Count: {health.get('categories_count', 'N/A')}")
        print(f"Organizations Count: {health.get('organizations_count', 'N/A')}")
        print(f"Keywords Count: {health.get('keywords_count', 'N/A')}")
        
        # Test dashboard stats
        print("\n--- Testing Dashboard Stats ---")
        stats = await dashboard_service.get_dashboard_stats()
        
        print(f"Total Problems: {stats.total_problems}")
        print(f"Categories: {len(stats.categories)}")
        print(f"Top Keywords: {len(stats.top_keywords)}")
        print(f"Top Organizations: {len(stats.top_organizations)}")
        
        # Display categories
        print("\n--- Categories Breakdown ---")
        for category, count in stats.categories.items():
            print(f"  {category}: {count}")
        
        # Display top keywords
        print("\n--- Top Keywords ---")
        for keyword, count in stats.top_keywords[:10]:  # Show top 10
            print(f"  {keyword}: {count}")
        
        # Display top organizations
        print("\n--- Top Organizations ---")
        for org, count in stats.top_organizations.items():
            print(f"  {org}: {count}")
        
        # Test category breakdown
        print("\n--- Testing Category Breakdown ---")
        breakdown = await dashboard_service.get_category_breakdown()
        print(f"Total Problems: {breakdown['total']}")
        for category, data in breakdown['categories'].items():
            print(f"  {category}: {data['count']} ({data['percentage']}%)")
        
        # Test technology trends
        print("\n--- Testing Technology Trends ---")
        trends = await dashboard_service.get_technology_trends()
        print(f"Total Keywords: {trends['total_keywords']}")
        
        print("Technology Keywords:")
        for keyword, count in trends['technology_keywords'][:5]:  # Show top 5
            print(f"  {keyword}: {count}")
        
        print("Domain Keywords:")
        for keyword, count in trends['domain_keywords'][:5]:  # Show top 5
            print(f"  {keyword}: {count}")
        
        # Test caching
        print("\n--- Testing Cache ---")
        print(f"Cache Valid: {dashboard_service._is_cache_valid()}")
        
        # Test cache refresh
        stats2 = await dashboard_service.get_dashboard_stats(force_refresh=True)
        print(f"Force Refresh - Total Problems: {stats2.total_problems}")
        
        # Clear cache
        await dashboard_service.clear_cache()
        print("✓ Cache cleared")
        
        print("\n" + "="*60)
        print("✓ ALL DASHBOARD TESTS COMPLETED SUCCESSFULLY")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error testing dashboard service: {str(e)}")
        import traceback
        traceback.print_exc()


def test_dashboard_models():
    """Test dashboard data models."""
    print("\n--- Testing Dashboard Models ---")
    
    # Test DashboardStats model
    stats = DashboardStats(
        categories={"Software": 10, "IoT": 5},
        top_keywords=[("python", 8), ("react", 6)],
        top_organizations={"Ministry A": 7, "Ministry B": 8},
        total_problems=15
    )
    
    print(f"✓ DashboardStats model created: {stats.total_problems} problems")
    
    # Test JSON serialization
    stats_json = stats.model_dump()
    print(f"✓ JSON serialization works: {len(stats_json)} fields")
    
    # Test validation
    try:
        invalid_stats = DashboardStats(
            categories={},
            top_keywords=[],
            top_organizations={},
            total_problems=-1  # Invalid negative value
        )
        print("⚠ Model validation might need improvement")
    except Exception as e:
        print("✓ Model validation working (negative total caught)")


async def main():
    """Main test function."""
    print("Starting Dashboard Service Tests...")
    
    # Test models first
    test_dashboard_models()
    
    # Test service functionality
    await test_dashboard_service()


if __name__ == "__main__":
    asyncio.run(main())