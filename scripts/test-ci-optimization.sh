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

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Check if we have at least one commit
if ! git rev-parse HEAD~1 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Warning: Need at least 2 commits to compare changes${NC}"
    echo "Using current changes in working directory..."
    CHANGED_FILES=$(git diff --name-only HEAD)
else
    echo "Checking what would trigger builds based on recent changes:"
    echo
    
    # Get changed files
    CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)
fi

echo -e "${BLUE}📝 Files changed:${NC}"
if [ -z "$CHANGED_FILES" ]; then
    echo "No changes detected"
    exit 0
fi

echo "$CHANGED_FILES"
echo

# Check backend changes (backend/**, docker-compose*.yml, scripts/ingest_data.py, requirements*.txt)
backend_changed=false
if echo "$CHANGED_FILES" | grep -E "^backend/|^docker-compose.*\.yml$|^scripts/ingest_data\.py$|^requirements.*\.txt$" > /dev/null; then
    echo -e "${GREEN}✅ Backend changes detected${NC}"
    backend_changed=true
else
    echo -e "${YELLOW}⚪ No backend changes detected${NC}"
fi

# Check frontend changes (frontend/**, docker-compose*.yml, package*.json)  
frontend_changed=false
if echo "$CHANGED_FILES" | grep -E "^frontend/|^docker-compose.*\.yml$|^package.*\.json$" > /dev/null; then
    echo -e "${GREEN}✅ Frontend changes detected${NC}"
    frontend_changed=true
else
    echo -e "${YELLOW}⚪ No frontend changes detected${NC}"
fi

# Check workflow changes
workflow_changed=false
if echo "$CHANGED_FILES" | grep -E "^\.github/workflows/" > /dev/null; then
    echo -e "${GREEN}✅ Workflow changes detected${NC}"
    workflow_changed=true
else
    echo -e "${YELLOW}⚪ No workflow changes detected${NC}"
fi

echo
echo -e "${BLUE}📊 Build Decision Summary:${NC}"

# Backend build decision
if [ "$backend_changed" = true ]; then
    echo -e "${GREEN}🚀 Backend Docker image would be built${NC}"
    echo "   Reasons: Backend files, Docker Compose, or dependencies changed"
else
    echo -e "${YELLOW}⏭️  Backend Docker build would be skipped${NC}"
    echo "   Reason: No backend-related changes detected"
fi

# Frontend build decision
if [ "$frontend_changed" = true ]; then
    echo -e "${GREEN}🚀 Frontend Docker image would be built${NC}"
    echo "   Reasons: Frontend files, Docker Compose, or dependencies changed"
else
    echo -e "${YELLOW}⏭️  Frontend Docker build would be skipped${NC}"
    echo "   Reason: No frontend-related changes detected"
fi

echo
# Overall assessment
if [ "$backend_changed" = false ] && [ "$frontend_changed" = false ]; then
    echo -e "${GREEN}🎉 Optimization working! No unnecessary builds would run${NC}"
    echo -e "${BLUE}💰 This saves GitHub Actions minutes!${NC}"
    savings="~100%"
elif [ "$backend_changed" = true ] && [ "$frontend_changed" = false ]; then
    echo -e "${BLUE}ℹ️  Only backend would build (frontend skipped)${NC}"
    savings="~50%"
elif [ "$backend_changed" = false ] && [ "$frontend_changed" = true ]; then
    echo -e "${BLUE}ℹ️  Only frontend would build (backend skipped)${NC}"
    savings="~50%"
else
    echo -e "${BLUE}ℹ️  Both services would build (legitimate changes)${NC}"
    savings="~0%"
fi

echo -e "${GREEN}💰 Estimated time savings: $savings${NC}"

# Show file categorization
echo
echo -e "${BLUE}📁 File change categorization:${NC}"
echo "$CHANGED_FILES" | while read -r file; do
    if [[ $file =~ ^backend/ ]]; then
        echo -e "   ${GREEN}$file${NC} (triggers backend build)"
    elif [[ $file =~ ^frontend/ ]]; then
        echo -e "   ${GREEN}$file${NC} (triggers frontend build)"
    elif [[ $file =~ ^\.github/workflows/ ]]; then
        echo -e "   ${YELLOW}$file${NC} (workflow change - triggers both builds)"
    elif [[ $file =~ ^docker-compose.*\.yml$ ]]; then
        echo -e "   ${YELLOW}$file${NC} (triggers both builds)"
    elif [[ $file =~ ^(README\.md|docs/.*|\.gitignore)$ ]]; then
        echo -e "   ${BLUE}$file${NC} (no builds triggered - documentation)"
    else
        echo -e "   ${BLUE}$file${NC} (no builds triggered)"
    fi
done

echo
echo -e "${BLUE}💡 Manual workflow dispatch available at:${NC}"
echo "   https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/.]*\).*/\1/')/actions"
echo "   Select 'Build and Publish Docker Images' → 'Run workflow'"
