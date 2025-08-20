# Agents Guide — SIH Solver's Compass

Purpose
- Give coding agents a single, accurate source of truth to build and ship features safely.
- Cover architecture, current state, deploy/destroy runbooks, APIs, env/secrets, and gotchas.

Scope
- Stack: React + Vite + NGINX (frontend), FastAPI (backend), ChromaDB, EKS on AWS, GHCR images.
- Persistence: EBS (gp3) via EBS CSI add-on + PVC for ChromaDB.
- Ingress: Service of type LoadBalancer (ELB). Optional domain via Cloudflare.

Current State (last verified)
- Cluster: EKS v1.33 active, nodes Ready.
- Storage: EBS CSI managed add-on installed with IRSA; default StorageClass = gp3 (ebs.csi.aws.com).
- Chroma: PVC Bound, Deployment Running, Service ClusterIP reachable in-cluster.
- Backend: FastAPI Running; external Chroma mode; health and search OK.
- Frontend: NGINX serving app; proxies /api to backend; ELB public URL working.
- Chat: OpenRouter API configured. Streaming supported; ensure key is valid.
- Known UX item: favicon 404 is cosmetic. Cloudflare domain recommended for mobile reach and HTTPS.

Repository Layout (key paths)
- infrastructure/
  - terraform-aws/ (EKS, IRSA, EBS CSI add-on)
  - k8s/
    - namespace.yaml, secrets.yaml
    - storage-gp3-default.yaml (default gp3 StorageClass)
    - chromadb-optimal.yaml (PVC + Deployment + Service)
    - backend-fixed.yaml (Deployment + Service)
    - frontend-fixed.yaml (Deployment + Service)
    - frontend-nginx-configmap.yaml (optional rewrite config)
- scripts/
  - deploy-aws-ghcr.sh (end-to-end: Terraform + K8s rollout)
  - destroy-aws-safe.sh (ordered teardown to avoid locks)
  - test_* and utility scripts
- backend/ (FastAPI app; routers, services, models)
- frontend/ (React app; built assets served by NGINX)

Environments & Secrets
- .env (local dev and script ingestion)
  - Required: AWS_REGION, OPENROUTER_API_KEY
  - Optional: GEMINI_API_KEY, GITHUB_TOKEN
  - Backend: CHROMA_HOST, CHROMA_PORT, CORS_ORIGINS
- Kubernetes secrets: infrastructure/k8s/secrets.yaml is applied and patched by deploy script using .env values. Rotate keys outside Git history.

Deployment (AWS + GHCR, end-to-end)
- Script: scripts/deploy-aws-ghcr.sh
- What it does:
  1) Terraform apply for EKS + OIDC provider + IRSA role + EBS CSI managed add-on.
  2) Configures kubectl to cluster; applies namespace and secrets.
  3) Applies gp3 default StorageClass; unsets default on any other SC.
  4) Deploys Chroma (PVC must bind); waits for chromadb rollout.
  5) Applies frontend ConfigMap (if used), backend and frontend Deployments; waits for rollouts.
  6) Prints Service endpoints (includes ELB hostname for frontend).

Teardown (safe order)
- Script: scripts/destroy-aws-safe.sh
- What it does:
  - Scales workloads to zero, deletes LoadBalancer services first, waits for ELB/ENI release.
  - Deletes remaining k8s resources and PVCs; strips finalizers if stuck.
  - Runs terraform destroy; retries after nodegroup cleanup if needed.

Backend APIs (discover and extend)
- Base path: Typically served behind NGINX at /api.
- Health: GET /api/health → 200 JSON
- Search: POST /api/search and/or /api/search/ (trailing-slash tolerant recommended)
  - Body: { "query": string, "limit"?: number }
  - Response: array of results (ProblemStatement-like)
- Chat:
  - POST /api/chat → full response (non-streaming)
  - POST /api/chat/stream → Server-Sent Events (SSE) token streaming
    - Media type: text/event-stream
    - Each event line: data: {partial_text or structured chunk}
- Models: GET /api/chat/models (if implemented) → list of supported model IDs
- GitHub integration (if present): ensure API returns an object matching frontend Zod schema.

Chat/LLM Integration (OpenRouter)
- Required headers (backend outbound to OpenRouter):
  - Authorization: Bearer $OPENROUTER_API_KEY
  - HTTP-Referer: your site origin (e.g., https://app.example.com)
  - X-Title: SIH Solver's Compass
- Streaming: Use stream=true for upstream; stream chunks to client as SSE. Do not access response.text on a streaming body during error handling.
- Default models: Keep original “free” models configured in code. Do not fallback to openrouter/auto unless explicitly requested.

Frontend NGINX and Routing
- Proxy: /api → backend:8000
- Trailing slash: Ensure one of:
  - Backend routes accept with/without trailing slash, or
  - NGINX rewrite /api/foo → /api/foo/ for known API paths
- SSE stability (recommended):
  - proxy_buffering off;
  - proxy_http_version 1.1;
  - proxy_read_timeout 3600s; proxy_send_timeout 3600s;

ChromaDB and Storage
- Provisioning: EBS CSI managed add-on with IRSA (Terraform-managed).
- StorageClass: gp3 default (ebs.csi.aws.com), allowVolumeExpansion: true, WaitForFirstConsumer.
- PVC: Chroma PVC in chromadb-optimal.yaml (no storageClassName → uses default).
- Service: ClusterIP chromadb; backend connects via CHROMA_HOST=chromadb, CHROMA_PORT=8000.

Domain & HTTPS (Cloudflare)
- Create CNAME in Cloudflare: app.yourdomain.xyz → <ELB hostname>, Proxy ON.
- SSL/TLS mode: Start with “Flexible” for instant HTTPS; upgrade to “Full (strict)” later with origin cert.
- Cache rules: Bypass cache for /api/* (especially for SSE).
- After DNS propagates: https://app.yourdomain.xyz should work on mobile and desktop.

Operational Runbooks

Quick deploy
- Ensure AWS creds and .env are set (OPENROUTER_API_KEY present).
- Run:
  - bash scripts/deploy-aws-ghcr.sh --auto-approve
- Validate:
  - kubectl get storageclass
  - kubectl -n sih-solvers-compass get pvc,pods,svc
  - From backend pod: curl http://chromadb:8000/api/v1/heartbeat

Rollout updated images (after pushing to GHCR via CI)
- kubectl -n sih-solvers-compass rollout restart deploy/backend
- kubectl -n sih-solvers-compass rollout restart deploy/frontend
- kubectl -n sih-solvers-compass rollout status deploy/{backend,frontend} --timeout=10m

Check health
- Backend: kubectl -n sih-solvers-compass logs deploy/backend | tail -n 200
- Chroma: kubectl -n sih-solvers-compass port-forward svc/chromadb 8081:8000; curl http://localhost:8081/api/v1/heartbeat
- Frontend: curl -I http://<ELB-hostname>

Troubleshooting Cheatsheet
- PVC Pending: Confirm EBS CSI add-on is installed and gp3 SC is default. Delete and re-create PVC, ensure nodes exist in AZ with capacity.
- 502 from frontend: Check trailing slash rewrite or backend route tolerance; ensure backend Service/Endpoints exist.
- Chat 401: Rotate OpenRouter key; patch K8s secret; ensure backend adds HTTP-Referer and X-Title headers; confirm model access.
- SSE issues: Disable proxy buffering in NGINX; verify backend media_type is text/event-stream; avoid reading streaming body on error path.
- Mobile can’t open ELB URL: Use your domain via Cloudflare (proxied) for HTTPS and IPv6; ELB raw hostnames can be blocked or lack IPv6.

Coding Guidelines (from project standards)
- Backend (FastAPI, Python 3.10)
  - Use async/await for I/O.
  - Pydantic models for all inputs/outputs.
  - Service layer with explicit exceptions, caught and mapped to HTTPException.
  - Log errors without leaking secrets.
- Frontend (React 18 + TS)
  - Functional components, typed props.
  - Proper error handling and loading states.
  - Tailwind design system (see palette and spacing).
- Tests
  - Pytest for backend; React Testing Library for frontend.
  - Add minimal endpoint tests when adding new APIs.

Security Notes
- Do not commit secrets. .env currently contains a live API key — rotate it and keep .env out of version control.
- Kubernetes secrets are patched from .env by deploy script; keep CI secrets in GitHub Actions or a secret manager.

Feature Workflows (for agents)

Add a new backend endpoint
- Create Pydantic request/response models in backend.
- Add async router handler under /api path; include both "" and "/" route variants to avoid slash issues.
- Add service layer method; unit tests for router and service.
- Update frontend API client and Zod schema accordingly.

Enhance chat
- Add model selector endpoint (GET /api/chat/models) if not present.
- Ensure outbound headers (HTTP-Referer, X-Title) are set.
- Add client-side cancel (AbortController) for SSE.

Integrate GitHub profile
- Align backend response shape to frontend Zod schema; or relax schema to match actual fields.
- Add defensive parsing (safeParse) and show user-friendly errors when undefined.

Cloudflare domain (IaC, optional)
- Manage CNAME via Terraform cloudflare provider.
- Add cache rule to bypass /api/*; ensure proxy ON for HTTPS and IPv6.

Validation Checklist (pre-merge)
- Unit tests pass.
- kubectl kustomize (if used) or dry-run apply: kubectl apply -f <files> --dry-run=server
- Deploy script succeeds on a fresh cluster; PVC Bound; services healthy.
- Frontend /api/search and /api/search/ both return 200.
- Chat streaming works; non-streaming fallback works.

Appendix — Commands

Rotate OpenRouter key
- Update .env → rerun deploy script (patches secret) or:
  - kubectl -n sih-solvers-compass create secret generic sih-secrets --from-literal=openrouter-api-key="$OPENROUTER_API_KEY" --dry-run=client -o yaml | kubectl apply -f -
  - kubectl -n sih-solvers-compass rollout restart deploy/backend

Probe OpenRouter locally
- set -a; . ./.env; set +a
- curl status/body example:
  - STATUS=$(curl -sS -o /tmp/or_res.json -w "%{http_code}" https://openrouter.ai/api/v1/chat/completions -H "Authorization: Bearer $OPENROUTER_API_KEY" -H "Content-Type: application/json" -H "HTTP-Referer: https://localhost" -H "X-Title: SIH Solver's Compass" -d '{"model":"<your-free-model>","messages":[{"role":"user","content":"ping"}],"stream":false,"max_tokens":5}'); echo "Status:$STATUS"; head -c 300 /tmp/or_res.json; echo

ELB hostname
- kubectl -n sih-solvers-compass get svc frontend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}{"\n"}'

That’s it. This file should enable an agent to build features and operate the stack safely end-to-end.