#!/bin/bash

# Test Docker Build Script
# This script tests the Docker build process locally before pushing to GitHub

set -e  # Exit on any error

echo "🚀 Testing SIH Solver's Compass Docker Build"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating test environment file..."
    cat > .env << EOF
GEMINI_API_KEY=test_key_for_build
GITHUB_TOKEN=test_token
CHROMA_HOST=chroma-db
CHROMA_PORT=8000
ENVIRONMENT=test
REACT_APP_API_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000,http://localhost:80
LOG_LEVEL=INFO
EOF
    print_status "Test .env file created"
fi

# Test Docker Compose configuration
echo ""
echo "📋 Testing Docker Compose configuration..."
if docker-compose config > /dev/null 2>&1; then
    print_status "Docker Compose configuration is valid"
else
    print_error "Docker Compose configuration is invalid"
    exit 1
fi

# Test backend Docker build
echo ""
echo "🔧 Testing backend Docker build..."
if docker build -t sih-backend-test ./backend; then
    print_status "Backend Docker build successful"
else
    print_error "Backend Docker build failed"
    exit 1
fi

# Test frontend Docker build
echo ""
echo "🎨 Testing frontend Docker build..."
if docker build -t sih-frontend-test ./frontend; then
    print_status "Frontend Docker build successful"
else
    print_error "Frontend Docker build failed"
    exit 1
fi

# Test full Docker Compose build
echo ""
echo "🏗️ Testing full Docker Compose build..."
if docker-compose build; then
    print_status "Docker Compose build successful"
else
    print_error "Docker Compose build failed"
    exit 1
fi

# Optional: Test service startup (commented out to avoid long waits)
# echo ""
# echo "🚀 Testing service startup..."
# docker-compose up -d
# sleep 30
# 
# # Test health endpoints
# if curl -f http://localhost:8000/health > /dev/null 2>&1; then
#     print_status "Backend health check passed"
# else
#     print_warning "Backend health check failed (this might be expected in test mode)"
# fi
# 
# if curl -f http://localhost:80 > /dev/null 2>&1; then
#     print_status "Frontend availability check passed"
# else
#     print_warning "Frontend availability check failed (this might be expected in test mode)"
# fi
# 
# docker-compose down

# Clean up test images
echo ""
echo "🧹 Cleaning up test images..."
docker rmi sih-backend-test sih-frontend-test > /dev/null 2>&1 || true
print_status "Test images cleaned up"

echo ""
echo "🎉 All Docker build tests passed!"
echo ""
echo "Next steps:"
echo "1. Commit your changes"
echo "2. Push to GitHub to trigger automated builds"
echo "3. Monitor the GitHub Actions workflows"
echo ""
echo "GitHub Actions will run more comprehensive tests including:"
echo "- Multi-platform builds"
echo "- Integration testing"
echo "- Security scanning"
echo "- Performance analysis"