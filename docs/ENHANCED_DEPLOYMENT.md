# Enhanced Deployment Scripts Documentation

## Overview
This repository now includes enhanced deployment scripts that implement Terraform best practices, including proper plan/apply workflows that address the "Note: You didn't use the -out option to save this plan" warning.

## Available Scripts

### 1. Enhanced AWS Production Deployment
**File:** `scripts/deploy-aws-enhanced.sh`

**Usage:**
```bash
# Basic deployment with confirmation
./scripts/deploy-aws-enhanced.sh

# Only show plan without applying
./scripts/deploy-aws-enhanced.sh --plan-only

# Auto-approve without prompts (CI/CD friendly)
./scripts/deploy-aws-enhanced.sh --auto-approve

# Destroy infrastructure
./scripts/deploy-aws-enhanced.sh --destroy

# Skip Docker image building
./scripts/deploy-aws-enhanced.sh --skip-build

# Show help
./scripts/deploy-aws-enhanced.sh --help
```

### 2. Enhanced AWS Development Deployment
**File:** `scripts/deploy-aws-dev.sh`

**Features:**
- Free-tier friendly (t3.micro instances)
- Minimal resource configuration
- Development-optimized settings

**Usage:**
```bash
# Interactive DEV deployment
./scripts/deploy-aws-dev.sh

# Show DEV plan without applying
./scripts/deploy-aws-dev.sh --plan-only

# Auto-approve DEV deployment
./scripts/deploy-aws-dev.sh --auto-approve

# Skip Docker builds (use existing images)
./scripts/deploy-aws-dev.sh --skip-build

# Show help
./scripts/deploy-aws-dev.sh --help
```

### 3. AWS Development Cleanup
**File:** `scripts/destroy-aws-dev.sh`

**Features:**
- Safe resource cleanup with multiple confirmations
- Kubernetes resource cleanup before infrastructure destroy
- kubectl context cleanup

**Usage:**
```bash
# Interactive cleanup with confirmations
./scripts/destroy-aws-dev.sh

# Show what would be destroyed
./scripts/destroy-aws-dev.sh --plan-only

# Auto-approve cleanup (DANGEROUS!)
./scripts/destroy-aws-dev.sh --auto-approve

# Show help
./scripts/destroy-aws-dev.sh --help
```

### 4. Universal Cloud Deployment
**File:** `scripts/deploy-universal.sh`

**Usage:**
```bash
# AWS deployment
./scripts/deploy-universal.sh aws

# Azure deployment with auto-approve
./scripts/deploy-universal.sh azure --auto-approve

# GCP plan-only mode
./scripts/deploy-universal.sh gcp --plan-only

# Destroy AWS infrastructure
./scripts/deploy-universal.sh aws --destroy

# Show help
./scripts/deploy-universal.sh --help
```

### 5. Original Scripts (Enhanced)
- `scripts/deploy-aws.sh` - Enhanced with proper Terraform workflows
- `scripts/deploy-azure.sh` - Enhanced with proper Terraform workflows

## Terraform Best Practices Implemented

### 1. Plan and Apply Workflow
```bash
# Instead of: terraform apply -auto-approve
# We now use:
terraform plan -out=tfplan
terraform apply tfplan
rm -f tfplan
```

### 2. Plan-Only Mode
```bash
# Generate and review plans without applying
./deploy-aws-enhanced.sh --plan-only
```

### 3. Destroy Plans
```bash
# Safe destroy with plan review
terraform plan -destroy -out=destroy-plan
terraform apply destroy-plan
rm -f destroy-plan
```

## Features

### ✅ Safety Features
- **Confirmation prompts** - Prevents accidental deployments
- **Plan review** - Shows what will be changed before applying
- **Destroy protection** - Requires explicit confirmation for destroy operations
- **Backup manifests** - Creates backups of Kubernetes manifests before modification

### 🔍 Validation Features
- **Tool checking** - Verifies all required tools are installed
- **Credential validation** - Checks cloud provider authentication
- **Environment validation** - Ensures required environment variables are set
- **Output validation** - Verifies Terraform outputs are available

### 📊 Monitoring Features
- **Colored output** - Easy-to-read status messages with colors
- **Progress indicators** - Shows current deployment stage
- **Timeout handling** - Handles LoadBalancer provisioning timeouts
- **Error handling** - Graceful error handling with cleanup

### 🎛️ Flexibility Features
- **Multiple cloud support** - AWS, Azure, GCP in universal script
- **Skip options** - Skip Docker builds when needed
- **Auto-approve mode** - For CI/CD pipelines
- **Plan-only mode** - For validation and review

## Configuration

### Environment Variables Required

#### AWS Production Deployment
```bash
AWS_REGION=us-east-1
OPENROUTER_API_KEY=your-api-key
GITHUB_TOKEN=your-github-token
```

#### AWS Development Deployment
```bash
AWS_REGION=us-east-1
OPENROUTER_API_KEY=your-api-key
GEMINI_API_KEY=your-gemini-key  # Optional
GITHUB_TOKEN=your-github-token  # Optional
```

#### Azure Deployment
```bash
AZURE_LOCATION=East US
AZURE_RESOURCE_GROUP=sih-solvers-compass
OPENROUTER_API_KEY=your-api-key
GITHUB_TOKEN=your-github-token
```

#### GCP Deployment
```bash
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
OPENROUTER_API_KEY=your-api-key
GITHUB_TOKEN=your-github-token
```

## Development vs Production Differences

### Development Deployment Features
- **Instance Types:** t3.micro (Free Tier eligible)
- **Node Count:** 1 (min: 1, max: 1)
- **Cost Optimization:** Minimal resources for testing
- **Auto-scaling:** Disabled to keep costs low
- **Environment:** Development-specific configurations

### Production Deployment Features
- **Instance Types:** Configurable (default: t3.medium)
- **Node Count:** 2+ (min: 2, max: 10)
- **High Availability:** Multi-AZ deployment
- **Auto-scaling:** Enabled for production workloads
- **Environment:** Production-optimized configurations

## Examples

### Interactive AWS Development Deployment
```bash
cd /path/to/sih-tj
./scripts/deploy-aws-dev.sh
```
This will:
1. Check prerequisites
2. Prompt for API keys if not set
3. Initialize Terraform
4. Create and show execution plan
5. Ask for confirmation
6. Apply the plan with DEV-specific settings
7. Build and push Docker images
8. Deploy to Kubernetes
9. Show final URLs

### Production AWS Deployment
```bash
cd /path/to/sih-tj
./scripts/deploy-aws-enhanced.sh
```

### Development Plan Review
```bash
# Review DEV changes without applying
./scripts/deploy-aws-dev.sh --plan-only
```

### Development Cleanup
```bash
# Safely destroy DEV infrastructure
./scripts/destroy-aws-dev.sh
```

### CI/CD Pipeline Usage
```bash
# For automated pipelines
./scripts/deploy-universal.sh aws --auto-approve --skip-build
```

### Plan Review Only
```bash
# Review changes without applying
./scripts/deploy-universal.sh aws --plan-only
```

### Infrastructure Cleanup
```bash
# Safely destroy infrastructure
./scripts/deploy-universal.sh aws --destroy
```

## Troubleshooting

### Common Issues

1. **Terraform state locked**
   ```bash
   # Force unlock (use with caution)
   cd infrastructure/terraform-aws
   terraform force-unlock LOCK_ID
   ```

2. **AWS credentials not configured**
   ```bash
   aws configure
   # or
   export AWS_ACCESS_KEY_ID=your-key
   export AWS_SECRET_ACCESS_KEY=your-secret
   ```

3. **Docker build failures**
   ```bash
   # Skip builds and use existing images
   ./scripts/deploy-aws-enhanced.sh --skip-build
   ```

4. **LoadBalancer timeout**
   ```bash
   # Check service status manually
   kubectl get svc frontend-service -n sih-solvers-compass
   ```

### Useful Commands

```bash
# Check Terraform plan without script
cd infrastructure/terraform-aws
terraform plan -out=tfplan
terraform show tfplan

# Check Kubernetes resources
kubectl get all -n sih-solvers-compass

# View logs
kubectl logs -f deployment/backend-deployment -n sih-solvers-compass

# Port forward for local testing
kubectl port-forward svc/frontend-service 8080:80 -n sih-solvers-compass
```

## Migration from Old Scripts

If you were using the old scripts:

1. **Backup your current Terraform state**
   ```bash
   cp infrastructure/terraform-aws/terraform.tfstate terraform.tfstate.backup
   ```

2. **Use new enhanced scripts**
   ```bash
   # Instead of: ./scripts/deploy-aws.sh
   ./scripts/deploy-aws-enhanced.sh
   ```

3. **Review plans before applying**
   ```bash
   ./scripts/deploy-aws-enhanced.sh --plan-only
   ```

The enhanced scripts are backward compatible but add safety features and better error handling.

## Benefits

### 🔐 Security
- No more `--auto-approve` by default
- Credential validation before operations
- Plan review before changes

### 💰 Cost Control  
- Plan-only mode for cost estimation
- Confirmation prompts prevent accidental deployments
- Proper cleanup with destroy operations

### 🚀 Reliability
- Better error handling and recovery
- State management best practices
- Atomic operations with saved plans

### 🔧 Developer Experience
- Colored output and progress indicators
- Clear error messages and troubleshooting
- Multiple deployment options and flexibility
