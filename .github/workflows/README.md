# GitHub Workflows

This directory contains GitHub Actions workflows for the SIH Solver's Compass project.

## Workflows

### 1. Docker Build and Test (`docker-build.yml`)
**Triggers:** Push to main/develop, PRs to main, manual dispatch

**Purpose:** Complete Docker build and integration testing
- Builds both backend and frontend Docker images
- Pushes images to GitHub Container Registry (GHCR)
- Tests full Docker Compose stack
- Runs health checks on all services
- Includes integration tests

**Features:**
- Multi-platform builds (linux/amd64)
- Docker layer caching for faster builds
- Automatic image tagging
- Service health verification
- Log collection on failure

### 2. Build Test (`build-test.yml`)
**Triggers:** Changes to backend/, frontend/, docker-compose.yml, or workflows

**Purpose:** Fast build validation without full integration
- Tests Docker builds for both services
- Validates Docker Compose configuration
- Focuses on build success rather than runtime

**Benefits:**
- Faster feedback on build issues
- Parallel execution for speed
- Minimal resource usage

### 3. Frontend Tests (`frontend-test.yml`)
**Triggers:** Changes to frontend/

**Purpose:** Frontend-specific testing and validation
- TypeScript compilation check
- ESLint validation (if configured)
- Build size analysis
- Backend Python syntax validation
- Chat service import verification

**Coverage:**
- Frontend build process
- TypeScript type checking
- Backend API structure validation
- Service import verification

### 4. Dependency Check (`dependency-check.yml`)
**Triggers:** Changes to requirements.txt or package files

**Purpose:** Dependency resolution and security validation
- Python dependency conflict detection
- Node.js security audit
- Known compatibility issue detection
- Dependency installation testing

**Checks:**
- NumPy/ChromaDB compatibility
- PyTorch version conflicts
- Security vulnerabilities
- Dependency resolution

## Usage

### Running Workflows Locally

You can test the Docker builds locally using the same commands:

```bash
# Test backend build
docker build -t sih-backend ./backend

# Test frontend build  
docker build -t sih-frontend ./frontend

# Test full stack
docker-compose up --build
```

### Monitoring Builds

1. Go to the "Actions" tab in your GitHub repository
2. Select the workflow you want to monitor
3. View logs and build status
4. Download artifacts if available

### Troubleshooting

**Build Timeouts:**
- Check dependency versions in requirements.txt
- Monitor build logs for specific failing steps
- Consider using lighter dependencies

**Test Failures:**
- Review service logs in workflow output
- Check health check endpoints
- Verify environment configuration

**Cache Issues:**
- Workflows use GitHub Actions cache
- Cache keys are based on file hashes
- Clear cache by updating dependencies

## Configuration

### Environment Variables

The workflows use these environment variables:
- `REGISTRY`: Container registry (ghcr.io)
- `IMAGE_NAME`: Based on repository name
- Test environment variables in `.env` file

### Secrets

Required secrets for full functionality:
- `GITHUB_TOKEN`: Automatically provided
- `GEMINI_API_KEY`: For production deployments (optional for builds)

### Customization

To customize workflows:
1. Edit the YAML files in this directory
2. Adjust triggers, steps, or environment variables
3. Test changes in a feature branch first

## Best Practices

1. **Fast Feedback**: Use build-test.yml for quick validation
2. **Full Testing**: Use docker-build.yml for comprehensive testing
3. **Dependency Management**: Monitor dependency-check.yml for conflicts
4. **Security**: Regularly check frontend-test.yml for vulnerabilities
5. **Caching**: Leverage Docker layer caching for faster builds

## Monitoring

Key metrics to monitor:
- Build success rate
- Build duration
- Image sizes
- Test coverage
- Security vulnerabilities

The workflows provide comprehensive coverage of the build and test process, ensuring reliable deployments and early detection of issues.