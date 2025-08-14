# Docker Setup and GitHub Workflows

This document explains how to use Docker and GitHub workflows for the SIH Solver's Compass project.

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sih-solvers-compass
   ```

2. **Set up environment**
   ```bash
   cp .env.template .env
   # Edit .env with your API keys
   ```

3. **Test Docker build locally**
   ```bash
   ./scripts/test-docker-build.sh
   ```

4. **Run the full stack**
   ```bash
   docker-compose up --build
   ```

### GitHub Actions

The project includes automated workflows that run on GitHub:

- **Push to main/develop**: Triggers full build and test
- **Pull requests**: Runs build validation
- **Dependency changes**: Checks for conflicts

## Docker Services

### Backend Service
- **Port**: 8000
- **Health check**: `http://localhost:8000/health`
- **API docs**: `http://localhost:8000/docs`

### Frontend Service
- **Port**: 80
- **URL**: `http://localhost:80`

### ChromaDB Service
- **Port**: 8001
- **Health check**: `http://localhost:8001/api/v1/heartbeat`

## Troubleshooting

### Common Build Issues

1. **Dependency conflicts**
   ```bash
   # Check requirements.txt for version conflicts
   # Monitor dependency-check workflow
   ```

2. **Build timeouts**
   ```bash
   # Use GitHub Actions for heavy builds
   # Check for large dependencies
   ```

3. **Service startup failures**
   ```bash
   # Check service logs
   docker-compose logs <service-name>
   ```

### GitHub Actions Debugging

1. **View workflow logs**
   - Go to Actions tab in GitHub
   - Select failed workflow
   - Expand failed steps

2. **Local testing**
   ```bash
   # Test the same commands locally
   ./scripts/test-docker-build.sh
   ```

3. **Cache issues**
   - Workflows use GitHub Actions cache
   - Update dependencies to invalidate cache

## Performance Optimization

### Docker Build Optimization

1. **Layer caching**
   - Requirements/package files copied first
   - Application code copied last
   - Minimizes rebuild time

2. **Multi-stage builds**
   - Separate build and runtime stages
   - Smaller final images

3. **GitHub Actions caching**
   - Docker layer caching enabled
   - Dependency caching for Node.js/Python

### Resource Management

1. **Memory usage**
   - Monitor container memory usage
   - Adjust limits if needed

2. **Build time**
   - Use GitHub Actions for heavy builds
   - Parallel builds where possible

## Security

### Container Security

1. **Non-root users**
   - Services run as non-root
   - Minimal attack surface

2. **Dependency scanning**
   - Automated security audits
   - Regular dependency updates

### Secrets Management

1. **Environment variables**
   - Use .env for local development
   - GitHub Secrets for CI/CD

2. **API keys**
   - Never commit real API keys
   - Use test keys for builds

## Monitoring

### Build Monitoring

1. **GitHub Actions**
   - Build success/failure notifications
   - Performance metrics

2. **Local monitoring**
   ```bash
   # Check service health
   curl http://localhost:8000/health
   curl http://localhost:8001/api/v1/heartbeat
   ```

### Log Analysis

1. **Service logs**
   ```bash
   docker-compose logs -f <service>
   ```

2. **Build logs**
   - Available in GitHub Actions
   - Downloadable artifacts

## Best Practices

### Development Workflow

1. **Local testing first**
   ```bash
   ./scripts/test-docker-build.sh
   ```

2. **Incremental changes**
   - Small, focused commits
   - Test each change

3. **Branch protection**
   - Require workflow success
   - Review before merge

### Deployment

1. **Staging environment**
   - Test in staging first
   - Automated deployment

2. **Production deployment**
   - Manual approval required
   - Rollback capability

## Getting Help

1. **Check existing issues**
   - Search for similar problems
   - Review closed issues

2. **Create new issue**
   - Use build issue template
   - Include error logs

3. **Local debugging**
   - Use test script
   - Check service logs

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project README](../README.md)