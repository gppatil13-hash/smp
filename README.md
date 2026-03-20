# School ERP SaaS - Multi-tenant Platform

A comprehensive, production-ready School ERP (Enterprise Resource Planning) SaaS platform designed for small to mid-size schools (200-3000 students).

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

School ERP is a multi-tenant SaaS application providing integrated management for:
- **Admission Management**: Track applications, status, and enrollment
- **Student Management**: Complete student records with academics and personal info
- **Fee Management**: Structure, billing, and payment tracking
- **Communication**: SMS, WhatsApp, and Email notifications
- **User Management**: Role-based access control with multiple user types

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14+ (React)
- **Styling**: Tailwind CSS
- **State Management**: React Context / Zustand
- **UI Components**: Shadcn/ui
- **API Client**: Axios + React Query

### Backend
- **Framework**: NestJS 10+
- **Runtime**: Node.js 18+
- **ORM**: Prisma
- **Database**: PostgreSQL 16+
- **Authentication**: JWT + Passport
- **Cache**: Redis (optional)

### Deployment
- **Containerization**: Docker & Docker Compose
- **Cloud**: AWS (S3, RDS, EC2)
- **CI/CD**: GitHub Actions / GitLab CI

## 🏗 Architecture

### Multi-Tenant Architecture
```
┌─────────────────────────────────────────┐
│         School ERP Platform             │
├─────────────────────────────────────────┤
│  Tenant 1    │  Tenant 2    │  Tenant N  │
│  (School A)  │  (School B)  │ (School C) │
│              │              │            │
│ ┌──────────┐ │ ┌──────────┐│┌──────────┐│
│ │ Users    │ │ │ Users    ││ Users    ││
│ │ Students │ │ │ Students ││ Students ││
│ │ Fees     │ │ │ Fees     ││ Fees     ││
│ └──────────┘ │ └──────────┘│└──────────┘│
└─────────────────────────────────────────┘
        ↓
   PostgreSQL DB (Shared)
   Isolated by tenant_id
```

### Module Architecture
```
┌─────────────────────────────────────────────┐
│          Authentication (JWT)               │
├─────────────────────────────────────────────┤
│  School  │  Student │ Admission │ Fees │   │
│ Management│ Management │Management │ Mgmt  │
├─────────────────────────────────────────────┤
│        Tenant Isolation Middleware          │
├─────────────────────────────────────────────┤
│         Prisma ORM Layer                    │
├─────────────────────────────────────────────┤
│         PostgreSQL Database                 │
└─────────────────────────────────────────────┘
```

## 📁 Project Structure

```
school-erp/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/                  # Authentication & JWT
│   │   │   ├── school/                # School Management
│   │   │   ├── student/               # Student Management
│   │   │   ├── admission/             # Admission Process
│   │   │   ├── fees/                  # Fee Management
│   │   │   ├── communication/         # SMS, WhatsApp, Email
│   │   │   ├── user/                  # User Management
│   │   │   └── tenant/                # Tenant Management
│   │   ├── common/
│   │   │   ├── guards/                # JWT, Roles Guards
│   │   │   ├── middleware/            # Tenant Isolation
│   │   │   ├── decorators/            # Custom Decorators
│   │   │   ├── filters/               # Exception Filters
│   │   │   ├── pipes/                 # Validation Pipes
│   │   │   ├── interfaces/            # TypeScript Interfaces
│   │   │   └── constants/             # App Constants
│   │   ├── config/
│   │   │   ├── configuration.ts       # Config Factory
│   │   │   ├── config.ts              # Config Exports
│   │   │   └── prisma.service.ts      # Prisma Client
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma              # Database Schema
│   │   └── migrations/                # Database Migrations
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .dockerignore
│
├── frontend/
│   ├── src/
│   │   ├── components/                # Reusable Components
│   │   ├── pages/                     # Next.js Pages
│   │   ├── hooks/                     # Custom Hooks
│   │   ├── services/                  # API Services
│   │   ├── contexts/                  # React Contexts
│   │   ├── types/                     # TypeScript Types
│   │   └── lib/                       # Utilities
│   ├── public/
│   ├── package.json
│   └── .dockerignore
│
├── docker/
│   ├── Dockerfile                     # Backend Image
│   ├── Dockerfile.frontend            # Frontend Image
│   ├── docker-compose.yml             # Compose Config
│   └── .env.example                   # Environment Example
│
├── docs/
│   ├── API.md                         # API Documentation
│   ├── ARCHITECTURE.md                # Architecture Guide
│   ├── DATABASE.md                    # Database Schema
│   └── DEPLOYMENT.md                  # Deployment Guide
│
└── README.md
```

## 🚀 Installation

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16+ (if running locally)
- Git

### Backend Setup

```bash
# Clone repository
git clone <repository-url>
cd smp/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
npm run db:generate
npm run db:migrate

# Start development server
npm run start:dev
```

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with API URL

# Start development server
npm run dev
```

### Docker Setup

```bash
cd ../docker

# Copy and configure environment
cp .env.example .env

# Build and start services
docker compose up -d

# Access services
# Backend: http://localhost:3000
# Frontend: http://localhost:3001
# Database: localhost:5432
```

### Production Docker Compose

Use `docker/docker-compose.prod.yml` for production staging (no live reload, persistent volumes, and environment variable override support):

```bash
cd docker
cp ../.env.production.example .env
docker compose -f docker-compose.prod.yml up -d --build
```

### CI/CD Pipeline

- Workflow: `.github/workflows/ci-cd.yml`
- Branch: `main` or `master` triggers pipeline
- Steps:
  - Lint and tests for backend/frontend
  - Build and push Docker images to ECR
  - Deploy to AWS ECS:
    - backend service
    - frontend service
  - Run Prisma migrations (backend `db:deploy`)

## 📝 Configuration

### Backend Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/school_erp"

# JWT
JWT_SECRET="your-super-secret-key"
JWT_EXPIRY="7d"

# Server
PORT=3000
NODE_ENV=development

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=school-erp-bucket

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp API
WHATSAPP_BUSINESS_ACCOUNT_ID=your_id
WHATSAPP_ACCESS_TOKEN=your_token

# Frontend
FRONTEND_URL=http://localhost:3001
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 🔌 API Documentation

### Authentication Endpoints

```
POST   /auth/register          - Register new user
POST   /auth/login             - Login user
POST   /auth/logout            - Logout user
GET    /auth/profile           - Get current user profile
```

### School Endpoints

```
GET    /schools                - List schools
GET    /schools/:id            - Get school details
POST   /schools                - Create school
PUT    /schools/:id            - Update school
DELETE /schools/:id            - Delete school
```

### Student Endpoints

```
GET    /students               - List students
GET    /students/:id           - Get student details
POST   /students               - Create student
PUT    /students/:id           - Update student
DELETE /students/:id           - Delete student
GET    /students/class/:classId - Get class students
```

### Admission Endpoints

```
GET    /admissions             - List admissions
GET    /admissions/:id         - Get admission details
POST   /admissions             - Create admission
PUT    /admissions/:id         - Update admission status
GET    /admissions/statistics  - Get admission stats
```

### Fees Endpoints

```
POST   /fees/structure         - Create fee structure
GET    /fees/structure         - Get fee structures
POST   /fees/record            - Create fee record
GET    /fees/records           - List fee records
GET    /fees/student/:id/balance - Get student balance
PATCH  /fees/record/:id/payment - Record payment
GET    /fees/dashboard/stats   - Fee statistics
```

### Communication Endpoints

```
POST   /communications/sms     - Send SMS
POST   /communications/whatsapp - Send WhatsApp
POST   /communications/email   - Send Email
GET    /communications         - List communications
```

## 👥 User Roles & Permissions

### Super Admin
- Manage tenants
- System configuration
- View all school data

### School Admin
- Manage school settings
- Create/manage users
- View all school reports

### Admission Counsellor
- Create admissions
- Update admission status
- Send communications

### Accounts Team
- Manage fee structures
- Record payments
- View fee reports
- Generate invoices

### Teacher
- View students in their class
- Mark attendance
- View grades

### Parent
- View student progress
- Download fee receipts
- View communications

### Student
- View personal info
- View academic records
- Download certificates

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Rebuild images
docker-compose build --no-cache

# Access database
docker-compose exec postgres psql -U postgres -d school_erp

# Run migrations
docker-compose exec backend npm run db:migrate
```

## 📊 Database Schema Highlights

### Key Tables
- **Tenants**: Multi-tenant isolation
- **Users**: User accounts with roles
- **Schools**: School information per tenant
- **Students**: Student records
- **Admissions**: Application tracking
- **FeeStructures**: Fee definitions
- **FeeRecords**: Student fee bills
- **Communications**: Message logs

All tables include `tenantId` for data isolation.

## 🚢 Deployment

### AWS ECS Deployment

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker build -t school-erp-backend .
docker tag school-erp-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/school-erp-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/school-erp-backend:latest
```

### RDS Database Setup

```bash
# Create PostgreSQL RDS instance
# Configure security groups
# Create database and run migrations
psql -h <rds-endpoint> -U postgres -d school_erp -f schema.sql
```

## 🔒 Security Best Practices

- ✅ Environment variables for sensitive data
- ✅ JWT token-based authentication
- ✅ Request validation and sanitization
- ✅ SQL injection prevention (Prisma ORM)
- ✅ CORS configuration
- ✅ Rate limiting (recommended: redis)
- ✅ HTTPS in production
- ✅ Database encryption at rest

## 📈 Performance Optimization

- Indexed database queries
- Pagination on list endpoints
- Caching strategy (Redis recommended)
- CDN for static assets (S3 CloudFront)
- Database connection pooling
- Query optimization

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/feature-name`
4. Submit pull request

## 📄 License

Proprietary - All Rights Reserved

## 📞 Support

For support, email: support@schoolerp.com

---

**Last Updated**: March 2026
**Version**: 1.0.0
