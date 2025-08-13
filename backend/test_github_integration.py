#!/usr/bin/env python3
"""
Integration test script for GitHub service functionality.
This script tests the GitHub integration service with real API calls.
"""
import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.github_service import GitHubService
from app.models import GitHubProfile, Repository


async def test_github_integration():
    """Test GitHub integration with a real public profile."""
    print("🚀 Testing GitHub Integration Service")
    print("=" * 50)
    
    service = GitHubService()
    
    # Test with GitHub's official demo account
    test_username = "octocat"
    
    try:
        print(f"📊 Fetching GitHub profile for: {test_username}")
        profile = await service.get_github_profile(test_username)
        
        print(f"✅ Profile retrieved successfully!")
        print(f"   Username: {profile.username}")
        print(f"   Repositories: {len(profile.repositories)}")
        print(f"   Tech Stack: {', '.join(profile.tech_stack[:10])}")
        
        # Test repository analysis
        if profile.repositories:
            print(f"\n📁 Repository Analysis:")
            for i, repo in enumerate(profile.repositories[:3]):  # Show first 3 repos
                print(f"   {i+1}. {repo.name}")
                print(f"      Language: {repo.language or 'Not specified'}")
                print(f"      Topics: {', '.join(repo.topics) if repo.topics else 'None'}")
                if repo.description:
                    print(f"      Description: {repo.description[:80]}...")
        
        # Test GitHub DNA generation
        print(f"\n🧬 GitHub DNA Generation:")
        dna = service.generate_github_dna(profile)
        print(f"   DNA Length: {len(dna)} characters")
        print(f"   DNA Preview: {dna[:150]}...")
        
        # Test caching
        print(f"\n💾 Testing Cache Functionality:")
        cache_key = f"profile_{test_username}"
        is_cached_before = service._is_cached(cache_key)
        print(f"   Profile cached: {is_cached_before}")
        
        # Fetch again (should use cache)
        profile2 = await service.get_github_profile(test_username)
        is_cached_after = service._is_cached(cache_key)
        print(f"   Profile cached after second fetch: {is_cached_after}")
        print(f"   Cache working: {profile.username == profile2.username}")
        
        print(f"\n✅ All GitHub integration tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ GitHub integration test failed: {str(e)}")
        return False


async def test_error_handling():
    """Test error handling with invalid usernames."""
    print(f"\n🔧 Testing Error Handling")
    print("=" * 30)
    
    service = GitHubService()
    
    # Test with non-existent user
    try:
        await service.get_github_profile("this-user-definitely-does-not-exist-12345")
        print("❌ Should have raised an exception for non-existent user")
        return False
    except Exception as e:
        print(f"✅ Correctly handled non-existent user: {type(e).__name__}")
    
    # Test with empty username
    try:
        await service.get_github_profile("")
        print("❌ Should have raised an exception for empty username")
        return False
    except Exception as e:
        print(f"✅ Correctly handled empty username: {type(e).__name__}")
    
    return True


async def test_tech_stack_analysis():
    """Test technology stack analysis with mock data."""
    print(f"\n🔍 Testing Tech Stack Analysis")
    print("=" * 35)
    
    service = GitHubService()
    
    # Create mock repositories
    mock_repos = [
        Repository(
            name="ml-classifier",
            description="Image classification using TensorFlow and Python",
            topics=["machine-learning", "tensorflow", "python", "computer-vision"],
            language="Python",
            readme_content="This project uses TensorFlow for deep learning, scikit-learn for preprocessing, and OpenCV for image processing."
        ),
        Repository(
            name="web-dashboard",
            description="React dashboard with Node.js backend",
            topics=["react", "nodejs", "javascript", "dashboard"],
            language="JavaScript",
            readme_content="Built with React, Express.js, and MongoDB. Uses Docker for containerization."
        ),
        Repository(
            name="mobile-app",
            description="Flutter mobile application",
            topics=["flutter", "mobile", "dart"],
            language="Dart",
            readme_content="Cross-platform mobile app built with Flutter and Firebase."
        )
    ]
    
    # Analyze tech stack
    tech_stack = service._analyze_tech_stack(mock_repos)
    
    print(f"   Analyzed {len(mock_repos)} repositories")
    print(f"   Extracted {len(tech_stack)} technologies")
    print(f"   Top technologies: {', '.join(tech_stack[:10])}")
    
    # Verify expected technologies are found
    expected_techs = ["Python", "JavaScript", "Dart", "machine-learning", "react", "tensorflow"]
    found_techs = [tech for tech in expected_techs if tech in tech_stack]
    
    print(f"   Expected technologies found: {len(found_techs)}/{len(expected_techs)}")
    print(f"   Found: {', '.join(found_techs)}")
    
    return len(found_techs) >= len(expected_techs) * 0.8  # At least 80% found


async def main():
    """Run all integration tests."""
    print("🧪 GitHub Service Integration Tests")
    print("=" * 60)
    
    tests = [
        ("GitHub API Integration", test_github_integration),
        ("Error Handling", test_error_handling),
        ("Tech Stack Analysis", test_tech_stack_analysis),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🔄 Running: {test_name}")
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test '{test_name}' failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print(f"\n📊 Test Results Summary")
    print("=" * 30)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} {test_name}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All integration tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)