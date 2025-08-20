# Deployment Notes for SIH Solver's Compass

This document provides the steps to deploy the application to an AWS EKS cluster using the provided scripts.

## Prerequisites

Before you begin, ensure you have the following command-line tools installed and configured:

- `aws`: The AWS Command Line Interface.
- `terraform`: The Terraform Infrastructure as Code tool.
- `kubectl`: The Kubernetes command-line tool.

You also need to have your AWS credentials configured, for example by running `aws configure`.

## Environment Setup

1.  **Create an `.env` file**: Copy the `.env.template` file to a new file named `.env` in the project root.
    ```bash
    cp .env.template .env
    ```

2.  **Edit `.env`**: Fill in the required environment variables in the `.env` file. At a minimum, you need to set:
    - `AWS_REGION`
    - `OPENROUTER_API_KEY`
    - `GEMINI_API_KEY`

## Deployment

The deployment process is automated via the `deploy-aws-ghcr.sh` script. This script handles:
- Provisioning the AWS infrastructure using Terraform.
- Deploying the application components to the EKS cluster using `kubectl`.

To run the deployment, execute the following command from the project root:

```bash
./scripts/deploy-aws-ghcr.sh
```

The script will prompt for confirmation before applying the Terraform plan and deploying the application. To run it without prompts, use the `--auto-approve` flag:

```bash
./scripts/deploy-aws-ghcr.sh --auto-approve
```

## Deployment Order

The script deploys the services in the following order:

1.  **ChromaDB**: The vector database.
2.  **docgen-go**: The new document generation service.
3.  **backend**: The main FastAPI backend.
4.  **frontend**: The React frontend.

The script waits for each deployment to become ready before proceeding to the next one.

## Verifying the Deployment

After the script completes, you can verify the deployment using the following `kubectl` commands:

-   **Check all pods in the namespace**:
    ```bash
    kubectl get pods -n sih-solvers-compass
    ```
    You should see pods for `chromadb`, `docgen-go`, `backend`, and `frontend`.

-   **Check the services**:
    ```bash
    kubectl get services -n sih-solvers-compass
    ```
    This will show the internal `ClusterIP` services (`chromadb`, `docgen-go`, `backend`) and the public `LoadBalancer` service for the `frontend`.

-   **Get the application URL**: The script will output the URL of the frontend LoadBalancer. It might take a few minutes for the external IP to be assigned. You can get the URL at any time with:
    ```bash
    kubectl get service frontend -n sih-solvers-compass -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
    ```

## Destroying the Deployment

To tear down all the infrastructure and application components created by the script, run:

```bash
./scripts/destroy-aws-safe.sh
```

This will run Terraform to destroy the AWS resources.
