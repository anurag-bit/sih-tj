# SIH Deployment Debug Summary

## Issues Identified:

### 1. ChromaDB Persistent Storage Issue
- **Problem**: ChromaDB pod stuck in "Pending" state
- **Root Cause**: PVC cannot be bound despite EBS CSI driver being installed
- **Status**: Persistent Volume Claim stuck in "Pending" state
- **Impact**: Backend falls back to embedded ChromaDB, but loses persistence

### 2. API Routing Issue  
- **Problem**: Frontend making requests to `/api/search` but backend expects `/api/search/`
- **Root Cause**: NGINX proxy configuration doesn't handle trailing slash mismatch
- **Status**: 502 Bad Gateway errors in frontend
- **Impact**: Search functionality not working via web interface

### 3. Backend Restart Issues
- **Problem**: Backend pods restarting (RESTARTS count > 0)
- **Root Cause**: Likely related to ChromaDB connection attempts
- **Status**: Pods eventually stabilize but with restarts
- **Impact**: Temporary service interruptions

## Working Components:
- ✅ EKS Cluster and Node Group creation
- ✅ Backend embedded ChromaDB functionality  
- ✅ Frontend container serving static files
- ✅ Load Balancer provisioning
- ✅ Kubernetes networking and services
- ✅ GHCR image pulling

## Next Steps:
1. Fix ChromaDB persistent storage (investigate PVC binding issue)
2. Fix NGINX routing for API endpoints
3. Ensure backend doesn't restart unnecessarily
