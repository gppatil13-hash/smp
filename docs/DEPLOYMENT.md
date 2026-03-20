# Deployment Guide

## Prerequisites

- AWS Account with permissions for EC2, RDS, S3, CloudFront
- Docker & Docker Compose
- AWS CLI configured
- Domain name (for production)
- SSL Certificate (AWS ACM)

## Local Development Deployment

### Using Docker Compose

```bash
# Navigate to docker directory
cd docker

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Build and start services
docker-compose up -d

# Initialize database
docker-compose exec backend npm run db:migrate

# Access services
# Backend: http://localhost:3000
# Frontend: http://localhost:3001
# Database: localhost:5432
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Database Management

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d school_erp

# Backup database
docker-compose exec postgres pg_dump -U postgres school_erp > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres school_erp < backup.sql
```

## Production Deployment on AWS

### Architecture Overview

```
┌──────────────────────────────────────┐
│      Route 53 (DNS)                  │
└──────────┬───────────────────────────┘
           │
┌──────────▼───────────────────────────┐
│      CloudFront (CDN)                │
└──────────┬───────────────────────────┘
           │
┌──────────▼───────────────────────────┐
│      ALB (Load Balancer)             │
└──────────┬───────────────────────────┘
           │
    ┌──────┼──────┐
    │      │      │
┌───▼──┐ ┌─▼──┐ ┌─▼──┐
│ ECS  │ │ECS │ │ECS │
│Task 1│ │Task│ │Task│
│      │ │ 2  │ │ 3  │
└──────┘ └────┘ └────┘
    │      │      │
    └──────┼──────┘
           │
    ┌──────▼──────────┐
    │  RDS Aurora     │
    │  (PostgreSQL)   │
    └─────────────────┘
```

### Step 1: Prepare AWS Infrastructure

#### Create RDS Database

```bash
# Using AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier school-erp-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password your-strong-password \
  --allocated-storage 100 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxx \
  --db-name school_erp \
  --backup-retention-period 30 \
  --multi-az true
```

#### Create S3 Bucket for Static Files

```bash
aws s3 mb s3://school-erp-assets-prod --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket school-erp-assets-prod \
  --versioning-configuration Status=Enabled

# Block public access
aws s3api put-public-access-block \
  --bucket school-erp-assets-prod \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

#### Create IAM Role for ECS

```bash
# Create trust policy
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name school-erp-ecs-task-role \
  --assume-role-policy-document file://trust-policy.json

# Attach S3 policy
aws iam attach-role-policy \
  --role-name school-erp-ecs-task-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### Step 2: Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Create repositories
aws ecr create-repository --repository-name school-erp-backend
aws ecr create-repository --repository-name school-erp-frontend

# Build backend
cd backend
docker build -t school-erp-backend:latest .
docker tag school-erp-backend:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/school-erp-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/school-erp-backend:latest

# Build frontend
cd ../frontend
docker build -t school-erp-frontend:latest .
docker tag school-erp-frontend:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/school-erp-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/school-erp-frontend:latest
```

### Step 3: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name school-erp-prod

# Create CloudWatch log group
aws logs create-log-group --log-group-name /ecs/school-erp-backend
aws logs create-log-group --log-group-name /ecs/school-erp-frontend
```

### Step 4: Create Task Definitions

**Backend Task Definition** (`ecs-backend-task.json`):
```json
{
  "family": "school-erp-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/school-erp-ecs-task-role",
  "containerDefinitions": [
    {
      "name": "school-erp-backend",
      "image": "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/school-erp-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:school-erp-db-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:school-erp-jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/school-erp-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Register Task Definition

```bash
aws ecs register-task-definition \
  --cli-input-json file://ecs-backend-task.json
```

### Step 5: Create ALB and Target Groups

```bash
# Create target group
aws elbv2 create-target-group \
  --name school-erp-backend \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx \
  --health-check-path /health

# Create load balancer
aws elbv2 create-load-balancer \
  --name school-erp-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Step 6: Create ECS Service

```bash
# Create service
aws ecs create-service \
  --cluster school-erp-prod \
  --service-name school-erp-backend \
  --task-definition school-erp-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=school-erp-backend,containerPort=3000
```

### Step 7: Configure Auto-Scaling

```bash
# Create auto-scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/school-erp-prod/school-erp-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --policy-name school-erp-scaling \
  --service-namespace ecs \
  --resource-id service/school-erp-prod/school-erp-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

### Step 8: Database Migrations

```bash
# Connect to ECS task
aws ecs execute-command \
  --cluster school-erp-prod \
  --task $(aws ecs list-tasks --cluster school-erp-prod --service-name school-erp-backend --query taskArns[0] --output text) \
  --container school-erp-backend \
  --interactive \
  --command "/bin/sh"

# Run migrations
npm run db:migrate
npm run db:seed (if applicable)

## Step 9: CI/CD with GitHub Actions

1. Add the file: `.github/workflows/ci-cd.yml`
2. Set GitHub Secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `ECR_REGISTRY` (e.g. `123456789012.dkr.ecr.us-east-1.amazonaws.com`)
   - `ECR_REPOSITORY_BACKEND` (e.g. `school-erp-backend`)
   - `ECR_REPOSITORY_FRONTEND` (e.g. `school-erp-frontend`)
   - `ECS_CLUSTER_NAME` (e.g. `school-erp-prod`)
   - `ECS_BACKEND_SERVICE_NAME` (e.g. `school-erp-backend`)
   - `ECS_FRONTEND_SERVICE_NAME` (e.g. `school-erp-frontend`)
   - `JWT_SECRET` and `DATABASE_URL` (or use AWS Secrets Manager with task role)
3. Pipeline behavior:
   - Validate lint/tests for `backend` and `frontend`.
   - Build and push Docker images to ECR.
   - Force new deployment of ECS services.
   - Run schema migrations inside backend container.

### Example migration command targeted by the workflow

```bash
aws ecs execute-command \
  --cluster ${ECS_CLUSTER_NAME} \
  --task $(aws ecs list-tasks --cluster ${ECS_CLUSTER_NAME} --service-name ${ECS_BACKEND_SERVICE_NAME} --query 'taskArns[0]' --output text) \
  --container school-erp-backend \
  --command "npm run db:deploy" \
  --interactive
```

### Check ECS rollout

```bash
aws ecs describe-services --cluster ${ECS_CLUSTER_NAME} --services ${ECS_BACKEND_SERVICE_NAME} ${ECS_FRONTEND_SERVICE_NAME}
aws ecs list-tasks --cluster ${ECS_CLUSTER_NAME}
aws logs tail /ecs/school-erp-backend --since 1h
```
```

### Step 9: CloudFront Distribution

```bash
# Create distribution for frontend
aws cloudfront create-distribution --distribution-config file://cf-config.json

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id EMXX6XXXX \
  --paths "/*"
```

### Step 10: SSL/TLS Certificate

```bash
# Request certificate in ACM
aws acm request-certificate \
  --domain-name schoolerp.com \
  --subject-alternative-names "*.schoolerp.com" \
  --validation-method DNS

# Validate certificate and attach to ALB
# Update listener to use HTTPS
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:...
```

## Monitoring & Logging

### CloudWatch Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name school-erp-backend-cpu \
  --alarm-description "Alert if CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold

# Error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name school-erp-backend-errors \
  --alarm-description "Alert if error rate exceeds 5%" \
  --metric-name ErrorCount \
  --namespace Custom/API \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

### Application Performance Monitoring

- Install New Relic / DataDog agent
- Configure APM dashboard
- Set up performance baselines

## Backup & Disaster Recovery

### Automated Backups

```bash
# RDS backup retention: 30 days
# Enable automated backups during RDS creation

# S3 cross-region replication
aws s3api put-bucket-replication \
  --bucket school-erp-assets-prod \
  --replication-configuration file://replication.json
```

### Restore from Backup

```bash
# Restore RDS from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier school-erp-db-restored \
  --db-snapshot-identifier school-erp-db-snapshot-xxx

# Restore ECS service
aws ecs update-service \
  --cluster school-erp-prod \
  --service school-erp-backend \
  --force-new-deployment
```

## Performance Optimization

### Database Optimization
- Enable query logging
- Use RDS Performance Insights
- Create appropriate indexes
- Use read replicas for analytics

### API Optimization
- Enable HTTP/2 on ALB
- Configure gzip compression
- Set appropriate cache headers
- Use CloudFront for static assets

### Network Optimization
- Use VPC endpoints for AWS services
- Enable VPC flow logs
- Configure security groups properly

## Cost Optimization

```bash
# Use Savings Plans for compute
# Reserve capacity for predictable workloads
# Use S3 Intelligent-Tiering for storage
# Archive old logs to Glacier
```

---

**Document Version**: 1.0
**Last Updated**: March 2026
