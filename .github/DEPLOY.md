# Deployment (Frontend) – EC2 (container)

GitHub Actions builds the frontend Docker image, pushes to ECR, then SSHs to EC2 to pull and run the container on push to `main`. The frontend container listens on port 8080 on the host; nginx on EC2 should proxy port 80 to 8080 (and API paths to the backend on 8000).

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key (ECR push) |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `ECR_REGISTRY` | ECR registry URL (e.g. `123456789012.dkr.ecr.us-east-1.amazonaws.com`) |
| `ECR_REPOSITORY` | ECR repository name (e.g. `cap-frontend`) |
| `SSH_PRIVATE_KEY` | Private key for SSH access to the EC2 instance |

## Required GitHub Variables

| Variable | Description |
|----------|-------------|
| `EC2_HOST` | EC2 public IP or hostname |
| `EC2_USER` | SSH user (e.g. `ubuntu`, `ec2-user`) |
| `VITE_API_URL` | Production projects API URL |
| `VITE_SEPARATE_API_URL` | Production stem separation API URL (e.g. `http://<EC2_IP>`) |
| `AWS_REGION` | AWS region (e.g. `us-east-1`). Optional. |

## EC2 Setup

1. Launch an EC2 instance with Docker and AWS CLI installed; attach an IAM instance profile with ECR pull permissions.
2. Install nginx as a reverse proxy: proxy `/` to `http://127.0.0.1:8080` (frontend container) and `/separate`, `/api`, `/docs` to `http://127.0.0.1:8000` (backend container).
3. Add your SSH public key to the instance.
4. Open port 80 (and 443 if using HTTPS) in the security group.

The workflow runs `docker pull` and `docker run -p 8080:80` for the frontend image. Ensure the backend container is running on 8000.
