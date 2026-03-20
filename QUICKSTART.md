# School ERP - Quick Start Guide

## Project Structure Overview

```
smp/
├── backend/              # NestJS Backend
├── frontend/             # Next.js Frontend
├── docker/               # Docker & Docker Compose Configuration
├── docs/                 # Comprehensive Documentation
└── README.md
```

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL 16+ (or use Docker)
- Docker & Docker Compose
- Git

### Option 1: Using Docker Compose (Recommended)

```bash
# Clone and navigate
git clone <repo-url>
cd smp/docker

# Copy and update environment
cp .env.example .env

# Start services
docker-compose up -d

# Initialize database
docker-compose exec backend npm run db:migrate

# Access
- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- Database: localhost:5432 (postgres/postgres)
```

### Option 2: Local Setup

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Configure database connection
# Edit .env and update DATABASE_URL

# Initialize Prisma
npm run db:generate
npm run db:migrate

# Start development server
npm run start:dev
# Runs on http://localhost:3000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Configure API URL
# Update NEXT_PUBLIC_API_URL in .env.local

# Start development server
npm run dev
# Runs on http://localhost:3001
```

## Project Structure Details

### Backend (src/)

```
src/
├── modules/
│   ├── auth/              # Authentication & JWT
│   ├── school/            # School Management
│   ├── student/           # Student Management
│   ├── admission/         # Admission Process
│   ├── fees/              # Fee Management
│   ├── communication/     # SMS, WhatsApp, Email
│   ├── user/              # User Management
│   └── tenant/            # Tenant Management
├── common/
│   ├── guards/            # JWT, Roles Guards
│   ├── middleware/        # Tenant Isolation
│   ├── decorators/        # Custom Decorators
│   ├── filters/           # Exception Filters
│   ├── pipes/             # Validation Pipes
│   ├── interfaces/        # TypeScript Interfaces
│   └── constants/         # Constants
├── config/
│   ├── configuration.ts   # Config Factory
│   ├── config.ts          # Config Exports
│   └── prisma.service.ts  # Prisma Client
├── app.module.ts
└── main.ts
```

### Database Schema

Core tables include:
- **Tenant**: Multi-tenant isolation
- **School**: School information
- **User**: User accounts with roles
- **Student**: Student records
- **Admission**: Application tracking
- **FeeStructure**: Fee definitions
- **FeeRecord**: Student bills
- **Communication**: Message logs

All tables include `tenantId` for tenant isolation and relevant indexes for performance.

## Common Commands

### Backend Development

```bash
# Start dev server with auto-reload
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# Check code style
npm run lint

# Format code
npm run format

# Database operations
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations
npm run db:studio     # Open Prisma Studio
```

### Frontend Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Check types
npm run type-check

# Lint and format
npm run lint
npm run format
```

### Docker Operations

```bash
cd docker

# Start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Access database
docker-compose exec postgres psql -U postgres -d school_erp

# Rebuild images
docker-compose build --no-cache

# Run migrations
docker-compose exec backend npm run db:migrate
```

## Authentication Flow

1. **Register/Login**: POST `/auth/register` or `/auth/login`
2. **Receive JWT Token**: Token includes user ID, email, role, tenantId
3. **Send Token**: Include in Authorization header: `Bearer <token>`
4. **Tenant Isolation**: Middleware enforces tenantId from request
5. **Role-Based Access**: Guards verify user permissions

## API Examples

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "password123",
    "tenantId": "tenant_id"
  }'
```

### List Students
```bash
curl -X GET "http://localhost:3000/students?skip=0&take=20" \
  -H "Authorization: Bearer <jwt_token>"
```

### Create Student
```bash
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "enrollmentNo": "ST/2024/001",
    "rollNumber": 1,
    "firstName": "John",
    "lastName": "Doe",
    "classId": "class_id",
    "academicYear": "2024-2025",
    ... # other required fields
  }'
```

See [API Documentation](./docs/API.md) for complete endpoint reference.

## Role-Based Access Control

### Roles & Permissions

**SUPER_ADMIN**
- Manage all tenants
- System-wide operations

**SCHOOL_ADMIN**
- Manage school settings
- Create/manage users
- View all school data

**ADMISSION_COUNSELLOR**
- Create admissions
- Update admission status
- Send communications

**ACCOUNTS_TEAM**
- Manage fee structures
- Record payments
- View fee reports

**TEACHER**
- View students in class
- Mark attendance

**PARENT**
- View student progress
- Download fee receipts

**STUDENT**
- View personal info
- Download certificates

## Troubleshooting

### Database Connection Issues

```bash
# Check database connection
docker-compose exec postgres psql -U postgres school_erp -c "SELECT 1"

# View database logs
docker-compose logs postgres

# Reset database (CAUTION)
docker-compose down -v
docker-compose up -d
docker-compose exec backend npm run db:migrate
```

### Backend Errors

```bash
# Check backend logs
docker-compose logs -f backend

# Stop and restart backend
docker-compose restart backend

# Rebuild backend
docker-compose build backend
```

### Frontend Issues

```bash
# Clear Next.js cache
rm -rf frontend/.next

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf frontend/node_modules
npm install
```

## Environment Variables

**Backend (.env)**
- DATABASE_URL: PostgreSQL connection string
- JWT_SECRET: Secret key for JWT signing
- PORT: Backend port (default: 3000)
- NODE_ENV: Environment (development/production)
- AWS_*: AWS credentials and configuration
- TWILIO_*: Twilio API credentials
- WHATSAPP_*: WhatsApp API credentials

**Frontend (.env.local)**
- NEXT_PUBLIC_API_URL: Backend API URL
- NEXT_PUBLIC_APP_URL: Frontend URL

## Performance Tips

1. **Database Queries**: Use pagination on list endpoints
2. **Caching**: Implement Redis for frequently accessed data
3. **API Response**: Keep responses lean and use filtering
4. **Frontend**: Enable image optimization and lazy loading
5. **Infrastructure**: Monitor logs and set up alerts

## Security Best Practices

- ✅ Use environment variables for secrets
- ✅ Validate all input on backend
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Enable CORS for specific origins
- ✅ Hash passwords with bcrypt
- ✅ Use JWT for stateless auth
- ✅ Regular security audits

## Deployment

### Docker Compose (Local/Staging)
See `docker/docker-compose.yml` for local deployment.

### AWS Production
See `docs/DEPLOYMENT.md` for comprehensive AWS deployment guide.

## Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## Support

For issues or questions:
1. Check the documentation
2. Review existing issues
3. Create new issue with details

## License

Proprietary - All Rights Reserved

---

**Version**: 1.0
**Last Updated**: March 2026

**Next Steps**:
1. Clone the repository
2. Copy environment files
3. Run `docker-compose up -d`
4. Access frontend at http://localhost:3001
5. Start building!
