# SIH Solver's Compass
[![Build and Publish Docker Images](https://github.com/anurag-bit/sih-tj/actions/workflows/build-and-publish.yml/badge.svg)](https://github.com/anurag-bit/sih-tj/actions/workflows/build-and-publish.yml)

An AI-powered guidance platform designed to help engineering students discover and engage with Smart India Hackathon problem statements.

## Local Development

### 1. Prerequisites
- Docker and Docker Compose

### 2. Quick Start

1.  **Clone the repository and navigate to the project directory**

2.  **Set up environment variables:**
    ```bash
    cp .env.template .env
    # Edit .env file with your API keys (at least OPENROUTER_API_KEY)
    ```

3.  **Start the application:**
    ```bash
    docker-compose up --build
    ```

4.  **Access the application:**
    -   Frontend: http://localhost:80
    -   Backend API: http://localhost:8000
    -   ChromaDB: http://localhost:8001

## Cloud Deployment (GCP, AWS, Azure)

This project includes one-click deployment scripts to provision and deploy the entire application to a Kubernetes cluster on your cloud provider of choice.

### 1. Prerequisites

- **Common Tools:** `terraform`, `kubectl`, `docker`
- **Cloud-Specific CLI:**
  - **GCP:** `gcloud`
  - **AWS:** `aws`
  - **Azure:** `az`

### 2. Configuration

Update your `.env` file with the required variables for your target platform:

- **GCP:**
  ```
  GCP_PROJECT_ID="your-gcp-project-id"
  OPENROUTER_API_KEY="your-openRouter-key"
  ```
- **AWS:**
  ```
  AWS_REGION="us-east-1"
  OPENROUTER_API_KEY="your-openRouter-key"
  ```
- **Azure:**
  ```
  AZURE_LOCATION="East US"
  AZURE_RESOURCE_GROUP="sih-solvers-compass-rg"
  OPENROUTER_API_KEY="your-openRouter-key"
  ```

### 3. Deploy

Run the deployment script for your target platform. The script will automatically provision the infrastructure, build and push the container images, and deploy the application. At the end, it will provide a URL to access the frontend.

- **For GCP:**
  ```bash
  ./scripts/deploy-gcp.sh
  ```
- **For AWS:**
  ```bash
  ./scripts/deploy-aws.sh
  ```
- **For Azure:**
  ```bash
  ./scripts/deploy-azure.sh
  ```

### 4. Destroy Infrastructure

To tear down all cloud resources and avoid ongoing costs, use the generic destroy script with the appropriate platform flag.

- **For GCP:**
  ```bash
  ./scripts/destroy.sh gcp
  ```
- **For AWS:**
  ```bash
  ./scripts/destroy.sh aws
  ```
- **For Azure:**
  ```bash
  ./scripts/destroy.sh azure
  ```

## Project Structure

```
sih-solvers-compass/
├── backend/                 # FastAPI backend service
├── frontend/               # React frontend application
├── infrastructure/          # Terraform configurations for cloud deployments
│   ├── k8s/                 # Kubernetes manifests
│   ├── terraform-aws/
│   ├── terraform-azure/
│   └── terraform-gcp/
├── scripts/               # Deployment and utility scripts
├── docker-compose.yml     # Local multi-service orchestration
├── .env.template         # Environment variables template
└── README.md             # This file
```
