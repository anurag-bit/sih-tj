# GitHub Actions CI/CD Optimization

## Overview
This optimization reduces GitHub Actions resource consumption by implementing intelligent path-based triggers and conditional job execution.

## Key Features

### 🎯 Smart Triggering
- **Path-based filters**: Only run builds when relevant files change
- **Conditional jobs**: Skip unnecessary Docker builds
- **Manual dispatch**: Override automation when needed

### 💰 Resource Savings
- **Before**: Every commit triggered both Docker builds
- **After**: Only changed services are built
- **Savings**: Up to 50-80% reduction in GitHub Actions minutes

## Trigger Patterns

### Backend Build Triggers
```yaml
backend:
  - 'backend/**'           # Any backend code changes
  - 'docker-compose*.yml'  # Docker configuration changes
```

### Frontend Build Triggers
```yaml
frontend:
  - 'frontend/**'          # Any frontend code changes
  - 'docker-compose*.yml'  # Docker configuration changes
```

### Workflow Triggers
```yaml
workflow:
  - '.github/workflows/**' # Always rebuild on workflow changes
```

## Manual Controls

### Workflow Dispatch Options
1. **Force Rebuild**: Build everything regardless of changes
2. **Build Backend Only**: Force backend build only
3. **Build Frontend Only**: Force frontend build only

### How to Use Manual Dispatch
1. Go to GitHub Actions tab
2. Select "Build and Publish Docker Images"
3. Click "Run workflow"
4. Choose your options and run

## Optimization Features

### Change Detection
- Uses `dorny/paths-filter@v3` action
- Compares last 2 commits for changes
- Outputs boolean flags for each service

### Docker Build Optimization
- **BuildKit caching**: Reuse layers between builds
- **Multi-platform**: Support for linux/amd64
- **Layer caching**: GitHub Actions cache integration

### Build Summary
- Shows what changes were detected
- Displays build results for each service
- Available in GitHub Actions summary tab

## Testing Locally

Run the test script to simulate CI behavior:
```bash
./scripts/test-ci-optimization.sh
```

This will show:
- What changes would trigger builds
- Which builds would be skipped
- Resource savings estimation

## Expected Scenarios

### Scenario 1: Documentation Update
- **Files changed**: `README.md`, `docs/setup.md`
- **Result**: No Docker builds run ✅
- **Savings**: 100% of build time

### Scenario 2: Backend-only Changes
- **Files changed**: `backend/app/services/chat_service.py`
- **Result**: Only backend Docker build runs ✅
- **Savings**: ~50% of build time

### Scenario 3: Frontend-only Changes
- **Files changed**: `frontend/src/components/ui/Button.tsx`
- **Result**: Only frontend Docker build runs ✅
- **Savings**: ~50% of build time

### Scenario 4: Docker Compose Changes
- **Files changed**: `docker-compose.yml`
- **Result**: Both services rebuild (infrastructure change) ✅
- **Savings**: 0% (necessary rebuild)

### Scenario 5: Full Stack Changes
- **Files changed**: Files in both `backend/` and `frontend/`
- **Result**: Both services rebuild ✅
- **Savings**: 0% (necessary rebuild)

## Monitoring

### Build Summary Report
Each workflow run includes a summary showing:
- Which changes were detected
- Which builds ran vs skipped
- Overall resource usage

### GitHub Actions Usage
Monitor your Actions usage at:
`https://github.com/settings/billing/summary`

## Configuration

### Environment Variables
```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
```

### Workflow Permissions
```yaml
permissions:
  contents: read
  packages: write
```

## Rollback Plan

If issues arise, quickly rollback by:
1. Reverting to previous workflow version
2. Removing path filters from trigger section
3. Removing conditional job execution

## Benefits Summary

1. **Cost Efficiency**: Reduce GitHub Actions minutes usage
2. **Faster CI/CD**: Skip unnecessary builds
3. **Better Developer Experience**: Faster feedback loops
4. **Resource Conservation**: More sustainable CI/CD practices
5. **Flexibility**: Manual controls for special cases

## Next Steps

1. **Monitor Usage**: Track Actions minutes after deployment
2. **Fine-tune Filters**: Adjust path patterns based on usage
3. **Add Notifications**: Slack/email notifications for builds
4. **Performance Metrics**: Add build time tracking
