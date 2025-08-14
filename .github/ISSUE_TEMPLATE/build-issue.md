---
name: Build Issue
about: Report problems with Docker builds or CI/CD workflows
title: '[BUILD] '
labels: build, bug
assignees: ''
---

## Build Issue Description

**What type of build issue are you experiencing?**
- [ ] Docker build failure
- [ ] GitHub Actions workflow failure
- [ ] Dependency resolution error
- [ ] Service startup failure
- [ ] Other (please describe)

## Environment

**Where did the build fail?**
- [ ] Local Docker build
- [ ] GitHub Actions
- [ ] Docker Compose
- [ ] Specific service (backend/frontend/chroma-db)

**System Information:**
- OS: [e.g., Ubuntu 20.04, macOS 13, Windows 11]
- Docker version: [e.g., 24.0.6]
- Docker Compose version: [e.g., 2.21.0]

## Error Details

**Build logs or error messages:**
```
Paste the relevant error logs here
```

**Which workflow failed?** (if applicable)
- [ ] docker-build.yml
- [ ] build-test.yml
- [ ] frontend-test.yml
- [ ] dependency-check.yml

## Steps to Reproduce

1. 
2. 
3. 

## Expected Behavior

What should have happened?

## Additional Context

- Recent changes made to the codebase
- Any modifications to requirements.txt or package.json
- Environment variables or configuration changes

## Possible Solution

If you have ideas on how to fix the issue, please share them here.

## Checklist

- [ ] I have checked the existing issues for duplicates
- [ ] I have included relevant error logs
- [ ] I have specified the environment details
- [ ] I have tried the local test script (`scripts/test-docker-build.sh`)