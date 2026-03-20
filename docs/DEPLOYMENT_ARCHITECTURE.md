# Deployment & Architecture Guide

Complete guide for deploying the AI system and understanding its architecture.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Deployment Options](#deployment-options)
3. [Production Setup](#production-setup)
4. [Configuration](#configuration)
5. [Monitoring & Logging](#monitoring--logging)
6. [Scaling](#scaling)
7. [Security](#security)
8. [Troubleshooting](#troubleshooting)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Web Application / Mobile App / Admin Panel               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                     NestJS Backend API                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Admission | Fees | Communication | Message | Enquiry     │   │
│  │ Routers/Controllers                                       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Admission-AI Service | Fee-AI Service |                  │   │
│  │ Communication-AI Service | Enquiry Service               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ AI Client Service (HTTP Client)                          │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Database Service | Cache Service | Logger                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                   ↓ (HTTP/REST)           ↓ (PostgreSQL)
         ┌──────────────────────┐      ┌─────────────────┐
         │ Python AI Service    │      │   PostgreSQL    │
         │ (FastAPI)            │      │   Database      │
         │                      │      │                 │
         │ ┌────────────────┐   │      │ ┌─────────────┐ │
         │ │ Scoring Engine │   │      │ │ Enquiries   │ │
         │ │ Fee Predictor  │   │      │ │ Students    │ │
         │ │ Followup Eng.  │   │      │ │ Messages    │ │
         │ │ Message Gen.   │   │      │ │ Analytics   │ │
         │ └────────────────┘   │      │ └─────────────┘ │
         └──────────────────────┘      └─────────────────┘
               ↓ (Optional)
         ┌──────────────────────┐
         │ Redis Cache          │
         │ (Optional)           │
         └──────────────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|-----------------|
| **NestJS Backend** | REST API, business logic, authentication, database operations |
| **AI Client Service** | HTTP communication with Python AI service, error handling, retry logic |
| **Python AI Service** | Machine learning models, prediction engines, scoring algorithms |
| **Database** | Persistent storage for enquiries, students, messages, audit logs |
| **Cache** | Optional: session caching, ML model caching, frequently accessed data |

### Data Flow Example: Admission Scoring

```
1. Client Request
   ↓
2. NestJS Controller receives enquiry data
   ↓
3. AdmissionAiService called
   ↓
4. AiClientService.scoreAdmissionEnquiry()
   ↓
5. HTTP POST to Python AI Service
   ↓
6. Python AdmissionScoringEngine processes
   ↓
7. Response returned with probability scores
   ↓
8. NestJS stores result in database
   ↓
9. Response sent to client
```

---

## Deployment Options

### Option 1: Docker Compose (Development/Small Scale)

Best for: Single server, development environments, small deployments

**Setup**:

```yaml
# docker-compose.yml
version: '3.8'

services:
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: smp_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: school_management
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U smp_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://smp_user:${DB_PASSWORD}@database:5432/school_management
      PYTHONUNBUFFERED: 1
      LOG_LEVEL: INFO
    ports:
      - "8000:8000"
    depends_on:
      database:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/ai/scoring/sample-scoring"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DB_HOST: database
      DB_PORT: 5432
      DB_USER: smp_user
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: school_management
      AI_SERVICE_URL: http://ai-service:8000/api/ai
      REDIS_URL: redis://cache:6379
      JWT_SECRET: ${JWT_SECRET}
      LOG_LEVEL: info
    ports:
      - "3000:3000"
    depends_on:
      - database
      - cache
      - ai-service
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  default:
    name: smp_network
```

**Deployment**:

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Kubernetes (Production/High Scale)

Best for: High availability, auto-scaling, multi-region

**Prerequisites**:
- Kubernetes cluster (EKS, GKE, AKS, or self-hosted)
- kubectl configured
- Docker images pushed to registry

**Deployment Files**:

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: school-management
```

```yaml
# k8s/postgresql-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: school-management
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_USER
          value: smp_user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        - name: POSTGRES_DB
          value: school_management
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

```yaml
# k8s/ai-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-service
  namespace: school-management
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ai-service
  template:
    metadata:
      labels:
        app: ai-service
    spec:
      containers:
      - name: ai-service
        image: your-registry/smp-ai-service:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ai-service-secret
              key: database-url
        - name: LOG_LEVEL
          value: INFO
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1024Mi
        livenessProbe:
          httpGet:
            path: /api/ai/scoring/sample-scoring
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ai/scoring/sample-scoring
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
```

```yaml
# k8s/ai-service-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-service
  namespace: school-management
spec:
  type: ClusterIP
  selector:
    app: ai-service
  ports:
  - port: 8000
    targetPort: 8000
    protocol: TCP
```

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: school-management
spec:
  replicas: 3
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
        image: your-registry/smp-backend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        env:
        - name: DB_HOST
          value: postgres
        - name: DB_PORT
          value: "5432"
        - name: DB_USER
          value: smp_user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        - name: AI_SERVICE_URL
          value: http://ai-service:8000/api/ai
        - name: NODE_ENV
          value: production
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 500m
            memory: 1024Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

```yaml
# k8s/backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: school-management
spec:
  type: LoadBalancer
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
```

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: smp-ingress
  namespace: school-management
spec:
  rules:
  - host: smp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 80
  - host: api.smp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 80
```

**Deploy to Kubernetes**:

```bash
# Create namespace and secrets
kubectl create namespace school-management
kubectl create secret generic db-secret \
  -n school-management \
  --from-literal=password=$(openssl rand -base64 32)

# Apply configurations
kubectl apply -f k8s/

# Check status
kubectl get pods -n school-management
kubectl get services -n school-management

# View logs
kubectl logs -f deployment/ai-service -n school-management
kubectl logs -f deployment/backend -n school-management
```

### Option 3: Traditional Server Deployment

Best for: Control, existing infrastructure, custom requirements

**Steps**:

1. **Install Dependencies**:
```bash
# Python dependencies
sudo apt-get update
sudo apt-get install python3.10 python3-pip postgresql postgresql-contrib redis-server

# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install nodejs
```

2. **Deploy Python Service**:
```bash
# Clone and setup
git clone <repo> /opt/smp-ai-service
cd /opt/smp-ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create systemd service
sudo tee /etc/systemd/system/smp-ai-service.service > /dev/null <<EOF
[Unit]
Description=SMP AI Service
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/smp-ai-service
Environment="PATH=/opt/smp-ai-service/venv/bin"
ExecStart=/opt/smp-ai-service/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable smp-ai-service
sudo systemctl start smp-ai-service
```

3. **Deploy Backend**:
```bash
# Clone and setup
git clone <repo> /opt/smp-backend
cd /opt/smp-backend
npm install
npm run build

# Create systemd service
sudo tee /etc/systemd/system/smp-backend.service > /dev/null <<EOF
[Unit]
Description=SMP Backend API
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/smp-backend
EnvironmentFile=/opt/smp-backend/.env
ExecStart=/usr/bin/node dist/main
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable smp-backend
sudo systemctl start smp-backend
```

---

## Production Setup

### Environment Configuration

Create `.env.production`:

```env
# Node Environment
NODE_ENV=production

# Database
DB_HOST=db.example.com
DB_PORT=5432
DB_USER=smp_user
DB_PASSWORD=<strong-password>
DB_NAME=school_management
DB_SSL=true
DB_POOL_MIN=5
DB_POOL_MAX=20

# AI Service
AI_SERVICE_URL=https://ai-api.example.com/api/ai
AI_SERVICE_TIMEOUT=30000
AI_RETRY_ATTEMPTS=3
AI_RETRY_DELAY=1000

# Cache
CACHE_TYPE=redis
REDIS_URL=redis://:password@cache.example.com:6379
CACHE_TTL=3600

# Security
JWT_SECRET=<strong-secret>
JWT_EXPIRATION=24h
BCRYPT_ROUNDS=10

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/smp/backend.log

# Features
FEATURES_AI_ENABLED=true
FEATURES_CACHING_ENABLED=true
FEATURES_AUDIT_ENABLED=true

# Monitoring
SENTRY_DSN=https://key@sentry.io/project
APM_ENABLED=true
```

### Database Initialization

```bash
# Create database
psql -h localhost -U postgres -c "CREATE DATABASE school_management OWNER smp_user;"

# Run migrations
npm run migrate:latest

# Seed initial data
npm run seed
```

### SSL/TLS Configuration

Using Nginx with Let's Encrypt:

```nginx
# /etc/nginx/sites-available/smp-api

upstream backend {
    server localhost:3000;
}

upstream ai-service {
    server localhost:8000;
}

server {
    listen 80;
    server_name api.example.com ai-api.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    gzip on;
    gzip_types text/plain text/css text/javascript application/json;

    client_max_body_size 10M;
    proxy_read_timeout 30s;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        access_log off;
        proxy_pass http://backend;
    }
}

server {
    listen 443 ssl http2;
    server_name ai-api.example.com;

    ssl_certificate /etc/letsencrypt/live/ai-api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ai-api.example.com/privkey.pem;

    location / {
        proxy_pass http://ai-service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

---

## Configuration

### Runtime Configuration

Modify behavior without redeployment using environment variables:

```bash
# Logging
LOG_LEVEL=debug                    # debug, info, warn, error
LOG_FORMAT=json                    # json or text

# Performance
MAX_REQUEST_SIZE=10mb              # Request body limit
REQUEST_TIMEOUT=30000              # ms
DB_POOL_SIZE=20                    # Database connections

# AI Service
AI_SERVICE_TIMEOUT=30000           # ms
AI_BATCH_SIZE=100                  # Items per batch request
AI_CACHE_ENABLED=true              # Cache predictions

# Features
FEATURES_AI_ENABLED=true           # Enable AI features
FEATURES_AUDIT_LOG=true            # Enable audit logging
FEATURES_RATE_LIMIT=true           # Enable rate limiting
```

---

## Monitoring & Logging

### Application Monitoring

Using Prometheus:

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['localhost:3000']

  - job_name: 'ai-service'
    static_configs:
      - targets: ['localhost:8000']
```

### Centralized Logging

Using ELK Stack:

```bash
# Log forwarding with Filebeat
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.0.0-linux-x86_64.tar.gz
tar xzf filebeat-8.0.0-linux-x86_64.tar.gz

# Configure filebeat.yml
./filebeat-8.0.0-linux-x86_64/filebeat modules enable system
```

### Health Check

```bash
# Backend health
curl http://localhost:3000/health

# AI Service health
curl http://localhost:8000/api/ai/scoring/sample-scoring

# Database health
psql -h localhost -U smp_user -d school_management -c "SELECT 1"
```

---

## Scaling

### Horizontal Scaling

```bash
# Scale backend replicas (Kubernetes)
kubectl scale deployment backend --replicas=5 -n school-management

# Scale AI service
kubectl scale deployment ai-service --replicas=3 -n school-management
```

### Load Testing

```bash
# Using Apache Bench
ab -c 100 -n 10000 http://localhost:3000/api/health

# Using k6
k6 run performance-test.js
```

### Caching Strategy

Configuration for Redis caching:

```typescript
// cache.config.ts
export const cacheConfig = {
  ttl: {
    admissionScores: 3600,       // 1 hour
    feeRisks: 3600,
    followupSuggestions: 1800,   // 30 minutes
    messages: 300,               // 5 minutes
  },
  keys: {
    admissionScore: (id: string) => `score:${id}`,
    feeRisk: (id: string) => `risk:${id}`,
  },
};
```

---

## Security

### API Security

```typescript
// Implement rate limiting
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
  ],
})
export class AppModule {}
```

### Database Security

- Use strong passwords
- Enable SSL connections
- Restrict network access
- Regular backups
- Enable audit logging

### API Key Management

```env
API_KEYS=key1:secret1,key2:secret2
```

---

## Troubleshooting

### AI Service Not Responding

```bash
# Check service status
curl -v http://localhost:8000/api/ai/scoring/sample-scoring

# Check logs
docker logs smp-ai-service
# or
journalctl -u smp-ai-service -f

# Verify database connection
docker exec smp-db psql -U smp_user -c "SELECT 1"
```

### High Memory Usage

```bash
# Check process memory
ps aux | grep node
ps aux | grep python

# Restart service
systemctl restart smp-backend
docker-compose restart ai-service
```

### Database Connection Issues

```bash
# Test connection
psql -h db.example.com -U smp_user -d school_management -c "SELECT 1"

# Check pool status (from logs)
# Look for "pool exhausted" errors

# Increase pool size in .env
DB_POOL_MAX=30
```

---

**Last Updated**: March 19, 2024
