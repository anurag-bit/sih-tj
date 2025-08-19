# Debug Analysis Report
Generated: Tuesday 19 August 2025 04:24:42 PM IST

## Executive Summary
The SIH Solver's Compass deployment on AWS EKS encountered three primary issues that prevented full functionality:

## Critical Issues

### 1. ChromaDB Persistent Storage Failure ⚠️
**Problem**: ChromaDB pod stuck in Pending state, unable to bind to Persistent Volume
**Files**: `chromadb-issues.log`, `storage-debug.log`, `namespace-events.log`
**Details**: 
- EBS CSI driver installed correctly
- StorageClass exists and configured
- PVC shows "waiting for pod to be scheduled" but never progresses
- Likely node selector or zone constraints issue

### 2. API Routing Configuration Error 🔧
**Problem**: Frontend requests `/api/search` but backend expects `/api/search/`
**Files**: `deployed-nginx-config.conf`, `frontend-pod1-logs.log`
**Details**:
- NGINX proxy rules don't handle trailing slash mismatches
- Results in 502 Bad Gateway errors
- Backend is functional but unreachable via proper API routing

### 3. Backend Service Restarts 🔄
**Problem**: Backend pods experiencing restarts during ChromaDB connection attempts
**Files**: `backend-pod1-logs.log`, `backend-pod2-logs.log`
**Details**:
- 2 restarts on pod1, 1 restart on pod2
- Occurs during ChromaDB connection phase
- Eventually stabilizes with embedded ChromaDB fallback

## What's Working ✅
- AWS EKS cluster provisioning (11 minutes)
- EKS node group creation (5 minutes) 
- All IAM permissions and subnet tagging fixed
- Backend data loading (234 SIH problems)
- Vector search functionality (embedded mode)
- Frontend static file serving
- Load Balancer provisioning
- GHCR image pulling

## Root Cause Analysis

### ChromaDB Storage Issue
The EBS CSI driver is installed and functional, but the PVC binding fails. This suggests:
1. Node affinity constraints not met
2. Storage capacity or zone availability issues  
3. Missing IAM permissions for EBS volume creation
4. Resource quotas or limits exceeded

### API Routing Issue
NGINX configuration doesn't handle the trailing slash discrepancy between:
- Frontend requests: `POST /api/search`
- Backend endpoint: `POST /api/search/`

The updated NGINX config includes a regex rule to handle this, but requires deployment.

## Files Collected
- **Logs**: 19 files totaling ~200KB
- **Configurations**: All deployed YAML and config files
- **Diagnostics**: Cluster status, events, resource descriptions
- **Analysis**: Issues summary and next steps

## Recommended Fixes
1. **ChromaDB**: Investigate node affinity and EBS volume provisioning
2. **API Routing**: Deploy updated NGINX configuration  
3. **Monitoring**: Add better health checks and retry logic
4. **Documentation**: Record exact deployment steps and troubleshooting

## Next Deployment Strategy
1. Destroy current resources cleanly
2. Fix ChromaDB storage configuration
3. Update frontend with corrected NGINX config
4. Implement better error handling and monitoring
5. Test each component incrementally

All diagnostic data preserved in `/home/anuragisinsane/Projects/sih-tj/debug-logs/`
