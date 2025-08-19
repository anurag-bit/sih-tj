#!/bin/bash

# Create DEV-optimized Kubernetes manifests with reduced resource requirements
# This fixes the "Insufficient memory" issue on t3.micro instances

set -e

echo "🔧 Creating DEV-optimized Kubernetes manifests..."

# Create ChromaDB with reduced resources
cat > /tmp/chromadb-dev.yaml << 'EOF'
apiVersion: v1
kind: PersistentVolume
metadata:
  name: chromadb-pv
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  hostPath:
    path: /mnt/data

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: chromadb-pvc
  namespace: sih-solvers-compass
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chromadb-deployment
  namespace: sih-solvers-compass
spec:
  replicas: 1
  selector:
    matchLabels:
      app: chromadb
  template:
    metadata:
      labels:
        app: chromadb
    spec:
      containers:
      - name: chromadb
        image: chromadb/chroma:0.4.15
        ports:
        - containerPort: 8000
        env:
        - name: CHROMA_SERVER_HOST
          value: "0.0.0.0"
        - name: CHROMA_SERVER_HTTP_PORT
          value: "8000"
        volumeMounts:
        - name: chromadb-storage
          mountPath: /chroma/chroma
        resources:
          requests:
            memory: "256Mi"  # Reduced from 1Gi
            cpu: "100m"      # Reduced from 500m
          limits:
            memory: "512Mi"  # Reduced from 2Gi
            cpu: "500m"      # Reduced from 1000m
      volumes:
      - name: chromadb-storage
        persistentVolumeClaim:
          claimName: chromadb-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: chromadb-service
  namespace: sih-solvers-compass
spec:
  selector:
    app: chromadb
  ports:
    - protocol: TCP
      port: 8000
      targetPort: 8000
  type: ClusterIP
EOF

# Create Backend with reduced resources and single replica
cat > /tmp/backend-dev.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
  namespace: sih-solvers-compass
  labels:
    app: backend
spec:
  replicas: 1  # Reduced from 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: 650251721302.dkr.ecr.us-east-1.amazonaws.com/sih-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: sih-secrets
              key: gemini-api-key
        - name: OPENROUTER_API_KEY
          valueFrom:
            secretKeyRef:
              name: sih-secrets
              key: openrouter-api-key
        - name: GITHUB_TOKEN
          valueFrom:
            secretKeyRef:
              name: sih-secrets
              key: github-token
        - name: CHROMA_HOST
          value: "chromadb-service"
        - name: CHROMA_PORT
          value: "8000"
        - name: ENVIRONMENT
          value: "development"
        resources:
          requests:
            memory: "256Mi"  # Reduced from 2Gi
            cpu: "100m"      # Reduced from 1000m
          limits:
            memory: "512Mi"  # Reduced from 4Gi
            cpu: "500m"      # Reduced from 2000m
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: sih-solvers-compass
spec:
  selector:
    app: backend
  ports:
    - protocol: TCP
      port: 8000
      targetPort: 8000
  type: ClusterIP
EOF

# Create Frontend with reduced resources and single replica
cat > /tmp/frontend-dev.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
  namespace: sih-solvers-compass
  labels:
    app: frontend
spec:
  replicas: 1  # Reduced from 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: 650251721302.dkr.ecr.us-east-1.amazonaws.com/sih-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"   # Reduced from 256Mi
            cpu: "50m"       # Reduced from 250m
          limits:
            memory: "128Mi"  # Reduced from 512Mi
            cpu: "200m"      # Reduced from 500m

---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: sih-solvers-compass
spec:
  selector:
    app: frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: LoadBalancer
EOF

echo "✅ DEV-optimized manifests created:"
echo "  - /tmp/chromadb-dev.yaml (256Mi memory request)"
echo "  - /tmp/backend-dev.yaml (256Mi memory request, 1 replica)"
echo "  - /tmp/frontend-dev.yaml (64Mi memory request, 1 replica)"
echo ""
echo "Total memory requests: ~576Mi (fits in t3.micro!)"
