#!/bin/bash

# Test script to verify frontend Docker build works
set -e

echo "🧪 Testing Frontend Docker Build"
echo "================================"

cd "$(dirname "$0")/../frontend"

echo "📦 Building frontend Docker image..."
docker build -t sih-frontend-test .

echo "✅ Frontend Docker build successful!"
echo ""
echo "🔍 Checking built image..."
docker images | grep sih-frontend-test

echo ""
echo "🧹 Cleaning up test image..."
docker rmi sih-frontend-test

echo "✅ Frontend Docker build test completed successfully!"
