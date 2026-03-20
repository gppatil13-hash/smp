# Project File Structure Reference

## Complete Directory Tree

```
smp/
│
├── backend/                                    # NestJS Backend API
│   ├── src/
│   │   ├── modules/                           # Feature Modules
│   │   │   ├── auth/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── auth.controller.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── auth.service.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   └── auth.dto.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   └── jwt.strategy.ts
│   │   │   │   └── auth.module.ts
│   │   │   │
│   │   │   ├── school/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── school.controller.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── school.service.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   └── school.dto.ts
│   │   │   │   └── school.module.ts
│   │   │   │
│   │   │   ├── student/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── student.controller.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── student.service.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   └── student.dto.ts
│   │   │   │   └── student.module.ts
│   │   │   │
│   │   │   ├── admission/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── admission.controller.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── admission.service.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   └── admission.dto.ts
│   │   │   │   └── admission.module.ts
│   │   │   │
│   │   │   ├── fees/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── fees.controller.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── fees.service.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   └── fees.dto.ts
│   │   │   │   └── fees.module.ts
│   │   │   │
│   │   │   ├── communication/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── communication.controller.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── communication.service.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   └── communication.dto.ts
│   │   │   │   └── communication.module.ts
│   │   │   │
│   │   │   ├── user/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── user.controller.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── user.service.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   └── user.dto.ts
│   │   │   │   └── user.module.ts
│   │   │   │
│   │   │   └── tenant/
│   │   │       ├── services/
│   │   │       │   └── tenant.service.ts
│   │   │       └── tenant.module.ts
│   │   │
│   │   ├── common/                            # Shared Utilities
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   ├── middleware/
│   │   │   │   └── tenant.middleware.ts
│   │   │   ├── decorators/
│   │   │   │   ├── roles.decorator.ts
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   └── get-tenant-id.decorator.ts
│   │   │   ├── filters/
│   │   │   ├── pipes/
│   │   │   ├── interfaces/
│   │   │   │   └── auth.interface.ts
│   │   │   └── constants/
│   │   │
│   │   ├── config/                            # Configuration
│   │   │   ├── configuration.ts
│   │   │   ├── config.ts
│   │   │   └── prisma.service.ts
│   │   │
│   │   ├── app.module.ts                      # Root Module
│   │   └── main.ts                            # Entry Point
│   │
│   ├── prisma/
│   │   ├── schema.prisma                      # Complete DB Schema
│   │   └── migrations/
│   │
│   ├── package.json                           # Dependencies
│   ├── tsconfig.json                          # TypeScript Config
│   ├── .env.example                           # Environment Template
│   ├── .gitignore
│   └── .dockerignore
│
├── frontend/                                   # Next.js Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── contexts/
│   │   ├── types/
│   │   └── lib/
│   │
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   ├── .gitignore
│   └── .dockerignore
│
├── docker/                                     # Docker Configuration
│   ├── Dockerfile                             # Backend Image
│   ├── Dockerfile.frontend                    # Frontend Image
│   ├── docker-compose.yml                     # Orchestration
│   └── .env.example
│
├── docs/                                       # Documentation
│   ├── ARCHITECTURE.md                        # System Architecture
│   ├── DATABASE.md                            # Schema Reference
│   ├── API.md                                 # API Endpoints
│   └── DEPLOYMENT.md                          # AWS Deployment
│
├── .gitignore                                  # Git Configuration
├── README.md                                   # Project Overview
├── QUICKSTART.md                               # Getting Started
├── CONTRIBUTING.md                             # Contribution Guide
└── IMPLEMENTATION_SUMMARY.md                   # This Summary

```

## Key File Descriptions

### Backend Core Files

| File | Purpose |
|------|---------|
| `src/main.ts` | Application bootstrap, port configuration |
| `src/app.module.ts` | Root module with all imports |
| `src/config/configuration.ts` | Configuration factory function |
| `src/config/prisma.service.ts` | Prisma ORM client & connection |
| `prisma/schema.prisma` | Database schema definition |

### Module Structure (All modules follow same pattern)

| File | Purpose |
|------|---------|
| `controllers/x.controller.ts` | HTTP endpoints, request validation |
| `services/x.service.ts` | Business logic, database operations |
| `dtos/x.dto.ts` | Data Transfer Objects, validation rules |
| `x.module.ts` | Module configuration, imports/exports |

### Common Utilities

| File | Purpose |
|------|---------|
| `common/guards/jwt-auth.guard.ts` | JWT token validation |
| `common/guards/roles.guard.ts` | Role-based access control |
| `common/middleware/tenant.middleware.ts` | Tenant ID extraction |
| `common/decorators/*.ts` | Custom parameter decorators |
| `common/interfaces/auth.interface.ts` | TypeScript interfaces |

### Configuration Files

| File | Purpose |
|------|---------|
| `.env.example` | Environment variable template |
| `tsconfig.json` | TypeScript compiler options |
| `package.json` | Dependencies and scripts |
| `.dockerignore` | Files ignored during Docker build |

### Docker Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Multi-container orchestration |
| `Dockerfile` | Backend container image |
| `Dockerfile.frontend` | Frontend container image |

### Documentation

| File | Purpose |
|------|---------|
| `README.md` | Full project overview |
| `QUICKSTART.md` | Getting started with development |
| `docs/ARCHITECTURE.md` | System design & patterns |
| `docs/DATABASE.md` | Database schema reference |
| `docs/API.md` | REST API endpoints |
| `docs/DEPLOYMENT.md` | AWS production deployment |

---

## Important Organizational Patterns

### Module Pattern (Each feature module)
```
module/
├── controllers/      # Request handlers
├── services/         # Business logic
├── dtos/             # Data validation
└── module.ts         # Module definition
```

### Path Aliases (tsconfig.json)
```
@/*               → src/*
@modules/*        → src/modules/*
@common/*         → src/common/*
@config/*         → src/config/*
```

### Database Relationships
```
Tenant (1) ──→ (N) School
Tenant (1) ──→ (N) User
Tenant (1) ──→ (N) Student
School (1) ──→ (N) Student
School (1) ──→ (N) Admission
Student (1) ──→ (N) FeeRecord
FeeStructure (1) ──→ (N) FeeRecord
```

---

**Total Files Created**: 50+
**Lines of Code**: ~5000+
**Documentation Pages**: 8
**Database Tables**: 10
**API Endpoints**: 40+

---

Last Updated: March 19, 2026
