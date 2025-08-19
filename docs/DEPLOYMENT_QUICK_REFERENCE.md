# Quick Deployment Reference Guide

## 🚀 Deployment Scripts Cheat Sheet

### AWS Deployments

#### Development Environment (Free Tier)
```bash
# Interactive DEV deployment
./scripts/deploy-aws-dev.sh

# Plan-only (no charges)
./scripts/deploy-aws-dev.sh --plan-only

# Skip Docker builds
./scripts/deploy-aws-dev.sh --skip-build

# Cleanup DEV environment
./scripts/destroy-aws-dev.sh
```

#### Production Environment
```bash
# Interactive production deployment
./scripts/deploy-aws-enhanced.sh

# Plan-only review
./scripts/deploy-aws-enhanced.sh --plan-only

# Auto-approve (CI/CD)
./scripts/deploy-aws-enhanced.sh --auto-approve

# Destroy production
./scripts/deploy-aws-enhanced.sh --destroy
```

### Multi-Cloud Universal Script

#### AWS
```bash
./scripts/deploy-universal.sh aws [options]
```

#### Azure
```bash
./scripts/deploy-universal.sh azure [options]
```

#### GCP
```bash
./scripts/deploy-universal.sh gcp [options]
```

### Common Options
- `--plan-only` - Show plan without applying (solves Terraform warning!)
- `--auto-approve` - Skip confirmations
- `--skip-build` - Use existing Docker images
- `--destroy` - Destroy infrastructure
- `--help` - Show usage information

## 💰 Cost Comparison

| Environment | Instance Type | Node Count | Monthly Cost* |
|-------------|---------------|------------|---------------|
| Development | t3.micro | 1 | ~$15-25 |
| Production | t3.medium | 2+ | ~$60-120 |

*Estimates for US East region, actual costs may vary

## 🎯 Best Practices

### For Development
1. Always use `deploy-aws-dev.sh` for testing
2. Use `--plan-only` to review costs before applying
3. Clean up with `destroy-aws-dev.sh` when done
4. Use `--skip-build` for faster iterations

### For Production
1. Always review plan with `--plan-only` first
2. Never use `--auto-approve` for production
3. Set up monitoring and backups
4. Use proper environment variables

### For CI/CD
1. Use `--auto-approve` only in automated pipelines
2. Implement proper secret management
3. Use `--skip-build` when images are pre-built
4. Add deployment status notifications

## 🔧 Troubleshooting Quick Fixes

### Terraform State Locked
```bash
cd infrastructure/terraform-aws
terraform force-unlock LOCK_ID
```

### AWS Credentials Issues
```bash
aws configure
# or
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
```

### Docker Build Failures
```bash
# Skip builds and use existing images
./scripts/deploy-aws-dev.sh --skip-build
```

### LoadBalancer Timeout
```bash
# Check service status manually
kubectl get svc frontend-service -n sih-solvers-compass
```

### Plan Review Before Any Changes
```bash
# Always safe to run - no charges
./scripts/deploy-aws-dev.sh --plan-only
./scripts/deploy-aws-enhanced.sh --plan-only
```

## 📋 Useful Commands

### Kubernetes Management
```bash
# Check all resources
kubectl get all -n sih-solvers-compass

# View backend logs
kubectl logs -f deployment/backend-deployment -n sih-solvers-compass

# View frontend logs
kubectl logs -f deployment/frontend-deployment -n sih-solvers-compass

# Port forward for local testing
kubectl port-forward svc/frontend-service 8080:80 -n sih-solvers-compass
```

### Terraform Management
```bash
# Check current state
terraform show

# List resources
terraform state list

# Get outputs
terraform output

# Format configuration
terraform fmt

# Validate configuration
terraform validate
```

## 🚨 Emergency Procedures

### Stop All Charges Immediately
```bash
# Destroy DEV environment
./scripts/destroy-aws-dev.sh --auto-approve

# Destroy production (CAREFUL!)
./scripts/deploy-aws-enhanced.sh --destroy
```

### Quick Health Check
```bash
# Check if services are running
kubectl get pods -n sih-solvers-compass

# Check service endpoints
kubectl get svc -n sih-solvers-compass

# Check ingress/load balancer
kubectl describe svc frontend-service -n sih-solvers-compass
```

### Backup Before Changes
```bash
# Backup Terraform state
cp infrastructure/terraform-aws/terraform.tfstate terraform.tfstate.backup

# Backup Kubernetes manifests
kubectl get all -n sih-solvers-compass -o yaml > k8s-backup.yaml
```
