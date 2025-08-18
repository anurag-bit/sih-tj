#!/bin/bash

# Test script for CI optimization
# This script simulates what the GitHub Actions workflow will detect

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Testing CI optimization with path-based triggers${NC}"
echo

# Function to check if paths have changed
check_changes() {
    local pattern=$1
    local name=$2
    
    if git diff --name-only HEAD~1 HEAD | grep -E "$pattern" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name changes detected${NC}"
        return 0
    else
        echo -e "${YELLOW}⚪ No $name changes detected${NC}"
        return 1
    fi
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Check if we have at least one commit
if ! git rev-parse HEAD~1 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Warning: Need at least 2 commits to compare changes${NC}"
    echo "Creating a dummy commit for testing..."
    git add .
    git commit -m "test commit for CI optimization" --allow-empty
fi

echo "Checking what would trigger builds based on recent changes:"
echo

# Check backend changes
backend_changed=false
if check_changes "^backend/" "Backend"; then
    backend_changed=true
fi

# Check frontend changes
frontend_changed=false
if check_changes "^frontend/" "Frontend"; then
    frontend_changed=true
fi

# Check workflow changes
workflow_changed=false
if check_changes "^\.github/workflows/" "Workflow"; then
    workflow_changed=true
fi

# Check docker-compose changes
compose_changed=false
if check_changes "^docker-compose.*\.yml$" "Docker Compose"; then
    compose_changed=true
fi

echo
echo -e "${BLUE}📊 Build Decision Summary:${NC}"

if [ "$backend_changed" = true ] || [ "$compose_changed" = true ]; then
    echo -e "${GREEN}🚀 Backend Docker image would be built${NC}"
    echo "   Reasons: Backend files or Docker Compose changed"
else
    echo -e "${YELLOW}⏭️  Backend Docker build would be skipped${NC}"
    echo "   Reason: No backend-related changes detected"
fi

if [ "$frontend_changed" = true ] || [ "$compose_changed" = true ]; then
    echo -e "${GREEN}🚀 Frontend Docker image would be built${NC}"
    echo "   Reasons: Frontend files or Docker Compose changed"
else
    echo -e "${YELLOW}⏭️  Frontend Docker build would be skipped${NC}"
    echo "   Reason: No frontend-related changes detected"
fi

echo
if [ "$backend_changed" = false ] && [ "$frontend_changed" = false ] && [ "$workflow_changed" = false ] && [ "$compose_changed" = false ]; then
    echo -e "${GREEN}🎉 Optimization working! No unnecessary builds would run${NC}"
    echo -e "${BLUE}💰 This saves GitHub Actions minutes!${NC}"
else
    echo -e "${BLUE}ℹ️  Builds would run for legitimate changes${NC}"
fi

# Show recent changes for context
echo
echo -e "${BLUE}📝 Recent file changes (last commit):${NC}"
git diff --name-only HEAD~1 HEAD | while read file; do
    if [[ $file =~ ^backend/ ]]; then
        echo -e "   ${GREEN}$file${NC} (triggers backend build)"
    elif [[ $file =~ ^frontend/ ]]; then
        echo -e "   ${GREEN}$file${NC} (triggers frontend build)"
    elif [[ $file =~ ^\.github/workflows/ ]]; then
        echo -e "   ${YELLOW}$file${NC} (triggers all builds)"
    elif [[ $file =~ ^docker-compose.*\.yml$ ]]; then
        echo -e "   ${YELLOW}$file${NC} (triggers all builds)"
    else
        echo -e "   ${BLUE}$file${NC} (no builds triggered)"
    fi
done

echo
echo -e "${BLUE}💡 To test manual workflow dispatch:${NC}"
echo "   Go to: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/.]*\).*/\1/')/actions"
echo "   Select 'Build and Publish Docker Images'"
echo "   Click 'Run workflow' to test manual triggers"
