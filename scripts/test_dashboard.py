#!/usr/bin/env python3
"""
Test script for dashboard functionality.
Tests the dashboard API endpoints and validates the response structure.
"""

import requests
import json
import sys
from typing import Dict, Any

API_BASE_URL = "http://localhost:8000/api"

def test_dashboard_health():
    """Test dashboard health endpoint."""
    print("Testing dashboard health...")
    try:
        response = requests.get(f"{API_BASE_URL}/dashboard/health", timeout=10)
        response.raise_for_status()
        
        health_data = response.json()
        print(f"✓ Dashboard health: {health_data.get('status', 'unknown')}")
        print(f"  - Initialized: {health_data.get('initialized', False)}")
        print(f"  - Total problems: {health_data.get('total_problems', 0)}")
        print(f"  - Categories: {health_data.get('categories_count', 0)}")
        print(f"  - Organizations: {health_data.get('organizations_count', 0)}")
        print(f"  - Keywords: {health_data.get('keywords_count', 0)}")
        
        return health_data.get('status') == 'healthy'
        
    except Exception as e:
        print(f"✗ Dashboard health check failed: {e}")
        return False

def test_dashboard_stats():
    """Test dashboard stats endpoint."""
    print("\nTesting dashboard stats...")
    try:
        response = requests.get(f"{API_BASE_URL}/dashboard/stats", timeout=10)
        response.raise_for_status()
        
        stats_data = response.json()
        
        # Validate response structure
        required_fields = ['categories', 'top_keywords', 'top_organizations', 'total_problems']
        for field in required_fields:
            if field not in stats_data:
                print(f"✗ Missing required field: {field}")
                return False
        
        print(f"✓ Dashboard stats retrieved successfully")
        print(f"  - Total problems: {stats_data['total_problems']}")
        print(f"  - Categories: {len(stats_data['categories'])}")
        print(f"  - Top keywords: {len(stats_data['top_keywords'])}")
        print(f"  - Top organizations: {len(stats_data['top_organizations'])}")
        
        # Print sample data
        if stats_data['categories']:
            print(f"  - Sample categories: {list(stats_data['categories'].keys())[:3]}")
        
        if stats_data['top_keywords']:
            print(f"  - Top 3 keywords: {stats_data['top_keywords'][:3]}")
        
        if stats_data['top_organizations']:
            print(f"  - Sample organizations: {list(stats_data['top_organizations'].keys())[:3]}")
        
        return True
        
    except Exception as e:
        print(f"✗ Dashboard stats test failed: {e}")
        return False

def test_category_breakdown():
    """Test category breakdown endpoint."""
    print("\nTesting category breakdown...")
    try:
        response = requests.get(f"{API_BASE_URL}/dashboard/categories", timeout=10)
        response.raise_for_status()
        
        breakdown_data = response.json()
        
        if 'categories' not in breakdown_data or 'total' not in breakdown_data:
            print("✗ Invalid category breakdown response structure")
            return False
        
        print(f"✓ Category breakdown retrieved successfully")
        print(f"  - Total problems: {breakdown_data['total']}")
        print(f"  - Categories with percentages: {len(breakdown_data['categories'])}")
        
        # Print sample breakdown
        for category, data in list(breakdown_data['categories'].items())[:3]:
            print(f"    - {category}: {data['count']} ({data['percentage']}%)")
        
        return True
        
    except Exception as e:
        print(f"✗ Category breakdown test failed: {e}")
        return False

def test_technology_trends():
    """Test technology trends endpoint."""
    print("\nTesting technology trends...")
    try:
        response = requests.get(f"{API_BASE_URL}/dashboard/technology-trends", timeout=10)
        response.raise_for_status()
        
        trends_data = response.json()
        
        required_fields = ['technology_keywords', 'domain_keywords', 'total_keywords']
        for field in required_fields:
            if field not in trends_data:
                print(f"✗ Missing required field in trends: {field}")
                return False
        
        print(f"✓ Technology trends retrieved successfully")
        print(f"  - Technology keywords: {len(trends_data['technology_keywords'])}")
        print(f"  - Domain keywords: {len(trends_data['domain_keywords'])}")
        print(f"  - Total keywords: {trends_data['total_keywords']}")
        
        # Print sample trends
        if trends_data['technology_keywords']:
            print(f"  - Top tech keywords: {trends_data['technology_keywords'][:3]}")
        
        if trends_data['domain_keywords']:
            print(f"  - Top domain keywords: {trends_data['domain_keywords'][:3]}")
        
        return True
        
    except Exception as e:
        print(f"✗ Technology trends test failed: {e}")
        return False

def main():
    """Run all dashboard tests."""
    print("=" * 50)
    print("Dashboard API Test Suite")
    print("=" * 50)
    
    tests = [
        test_dashboard_health,
        test_dashboard_stats,
        test_category_breakdown,
        test_technology_trends
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✓ All dashboard tests passed!")
        sys.exit(0)
    else:
        print("✗ Some dashboard tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()