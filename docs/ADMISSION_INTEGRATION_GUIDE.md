# Admission Module - Integration Guide & Examples

## Table of Contents

1. [System Dependencies](#system-dependencies)
2. [Environment Configuration](#environment-configuration)
3. [Integration Testing](#integration-testing)
4. [Usage Examples](#usage-examples)
5. [Common Workflows](#common-workflows)
6. [Error Handling](#error-handling)
7. [Performance Considerations](#performance-considerations)

---

## System Dependencies

### Required Services

| Service | Version | Purpose |
|---------|---------|---------|
| PostgreSQL | 16+ | Primary database |
| Node.js | 18+ | Runtime environment |
| NestJS | 10+ | Framework |
| Prisma | 5.5.2+ | ORM |
| Twilio | Latest | SMS delivery |
| WhatsApp Business API | Latest | WhatsApp messaging |
| SMTP Server | Any | Email delivery |

### Required NPM Packages

```bash
npm install @nestjs/common @nestjs/core @nestjs/jwt @nestjs/passport @nestjs/config
npm install prisma @prisma/client
npm install class-validator class-transformer
npm install twilio  # Optional, for SMS
npm install nodemailer  # Optional, for email
npm install uuid
npm install axios  # For WhatsApp API calls
```

---

## Environment Configuration

### .env File Template

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/school_erp"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRY="24h"

# Twilio (Optional - for SMS)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_ENABLED=true

# WhatsApp Business API (Optional)
WHATSAPP_BUSINESS_ACCOUNT_ID="xxxxxxxxxxxxx"
WHATSAPP_PHONE_NUMBER_ID="xxxxxxxxxxxxx"
WHATSAPP_ACCESS_TOKEN="your-access-token"
WHATSAPP_ENABLED=true

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@schoolerp.com"
EMAIL_ENABLED=true

# File Storage (S3 or similar)
AWS_S3_BUCKET="school-erp-documents"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"

# Application
NODE_ENV="development"
PORT=3000
API_VERSION="v1"
```

### Database Connection Example

```typescript
// src/database.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

---

## Integration Testing

### Test Setup

```typescript
// src/modules/admission/admission.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AdmissionService } from './services/admission.service';
import { AdmissionEnquiryService } from './services/admissionEnquiry.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AdmissionService', () => {
  let service: AdmissionService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        AdmissionService,
        AdmissionEnquiryService,
        {
          provide: PrismaService,
          useValue: {
            admissionEnquiry: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            admission: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            student: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AdmissionService>(AdmissionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('convertEnquiryToAdmission', () => {
    it('should convert enquiry to admission', async () => {
      const tenantId = 'tenant-uuid';
      const enquiryId = 'enquiry-uuid';
      const mockEnquiry = {
        id: enquiryId,
        enquiryNo: 'ENQ-2024-04-0001',
        isConverted: false,
        tenantId,
      };

      jest.spyOn(prisma.admissionEnquiry, 'findUnique')
        .mockResolvedValue(mockEnquiry as any);

      jest.spyOn(prisma.student, 'create')
        .mockResolvedValue({ id: 'student-uuid', enrollmentNo: 'ENR202400001' } as any);

      jest.spyOn(prisma.admission, 'create')
        .mockResolvedValue({ id: 'admission-uuid', applicationNo: 'APP-2024-04-0001' } as any);

      jest.spyOn(prisma.admissionEnquiry, 'update')
        .mockResolvedValue({ ...mockEnquiry, isConverted: true } as any);

      const result = await service.convertEnquiryToAdmission(tenantId, enquiryId, {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'Male',
        dateOfBirth: new Date('2010-05-15'),
        classId: 'class-uuid',
        fatherName: 'James',
      } as any);

      expect(result.student.enrollmentNo).toBe('ENR202400001');
      expect(result.admission.applicationNo).toBe('APP-2024-04-0001');
    });
  });

  describe('addFollowUp', () => {
    it('should add follow-up to enquiry', async () => {
      const tenantId = 'tenant-uuid';
      const enquiryId = 'enquiry-uuid';

      jest.spyOn(prisma.admissionEnquiry, 'update')
        .mockResolvedValue({
          id: enquiryId,
          followUpDate: new Date('2024-04-20'),
          status: 'INTERESTED',
        } as any);

      const result = await service.addFollowUp(tenantId, enquiryId, {
        followUpDate: new Date('2024-04-20'),
        remarks: 'Test follow-up',
        status: 'INTERESTED',
      } as any);

      expect(result.followUpDate).toEqual(new Date('2024-04-20'));
    });
  });
});
```

### End-to-End Test Example

```typescript
// test/admission.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Admission Module (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testEnquiryId: string;
  let testAdmissionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Get auth token (assuming login endpoint exists)
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@school.com',
        password: 'password123',
      });

    authToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Enquiry Creation and Conversion Flow', () => {
    it('1. Should create admission enquiry', () => {
      return request(app.getHttpServer())
        .post('/api/v1/admissions/enquiry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentName: 'John Doe',
          gender: 'Male',
          dateOfBirth: '2010-05-15',
          parentName: 'Jane Doe',
          parentEmail: 'jane@example.com',
          parentPhone: '+919876543210',
          interestedClass: 'Class X',
          address: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          source: 'WEBSITE',
          notes: 'Looking for scholarship',
        })
        .expect(201)
        .then((res) => {
          expect(res.body.data.enquiryNo).toMatch(/ENQ-\d{4}-\d{2}-\d{4}/);
          expect(res.body.data.status).toBe('NEW');
          testEnquiryId = res.body.data.id;
        });
    });

    it('2. Should list enquiries with filters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admissions/enquiries?status=NEW&page=1&limit=20')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body.data.data).toBeInstanceOf(Array);
          expect(res.body.data.total).toBeGreaterThanOrEqual(1);
        });
    });

    it('3. Should update enquiry status', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/admissions/enquiry/${testEnquiryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'INTERESTED',
          notes: 'Updated to interested',
        })
        .expect(200)
        .then((res) => {
          expect(res.body.data.status).toBe('INTERESTED');
        });
    });

    it('4. Should add follow-up', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/admissions/enquiry/${testEnquiryId}/follow-up`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          followUpDate: '2024-04-20',
          remarks: 'Parent interested, need to send prospectus',
          status: 'QUALIFIED',
        })
        .expect(200);
    });

    it('5. Should get pending follow-ups', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admissions/enquiry/follow-ups/pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body.data).toHaveProperty('overdue');
          expect(res.body.data).toHaveProperty('due');
          expect(res.body.data).toHaveProperty('upcoming');
        });
    });

    it('6. Should convert enquiry to admission', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/admissions/enquiry/${testEnquiryId}/convert`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          gender: 'Male',
          dateOfBirth: '2010-05-15',
          classId: 'class-uuid',
          fatherName: 'James Doe',
          fatherPhone: '+919876543210',
          fatherEmail: 'james@example.com',
          motherName: 'Mary Doe',
          bloodGroup: 'O+',
        })
        .expect(201)
        .then((res) => {
          expect(res.body.data.student.enrollmentNo).toMatch(/ENR\d{6}/);
          expect(res.body.data.admission.applicationNo).toMatch(/APP-\d{4}-\d{2}-\d{4}/);
          testAdmissionId = res.body.data.admission.id;
        });
    });
  });

  describe('Document Management Flow', () => {
    it('1. Should upload single document', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/admissions/${testAdmissionId}/documents`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documentType: 'AADHAR',
          fileUrl: 's3://bucket/documents/aadhar.pdf',
          remarks: 'Aadhar card copy',
        })
        .expect(201)
        .then((res) => {
          expect(res.body.data.status).toBe('UPLOADED');
          expect(res.body.data.documentType).toBe('AADHAR');
        });
    });

    it('2. Should upload multiple documents', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/admissions/${testAdmissionId}/documents/bulk`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          documents: [
            {
              documentType: 'BIRTH_CERTIFICATE',
              fileUrl: 's3://bucket/birth.pdf',
              remarks: 'Birth certificate',
            },
            {
              documentType: 'VACCINATION_CERTIFICATE',
              fileUrl: 's3://bucket/vaccination.pdf',
              remarks: 'Vaccination certificate',
            },
          ],
        })
        .expect(201)
        .then((res) => {
          expect(res.body.data).toHaveLength(2);
          expect(res.body.data[0].status).toBe('UPLOADED');
        });
    });

    it('3. Should get admission with documents', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/admissions/${testAdmissionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body.data).toHaveProperty('documents');
          expect(res.body.data.documentsUploaded).toBeGreaterThan(0);
        });
    });
  });

  describe('Communication Flow', () => {
    it('1. Should send SMS', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/admissions/${testAdmissionId}/send-sms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phoneNumber: '+919876543210',
          message: 'Your admission is confirmed.',
        })
        .expect(200);
    });

    it('2. Should send email', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/admissions/${testAdmissionId}/send-email`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'parent@example.com',
          subject: 'Admission Confirmation',
          body: '<h2>Welcome!</h2>',
        })
        .expect(200);
    });

    it('3. Should send status notification', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/admissions/${testAdmissionId}/notify-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'ADMITTED',
          parentPhone: '+919876543210',
          parentEmail: 'parent@example.com',
        })
        .expect(200);
    });
  });

  describe('Statistics and Analytics', () => {
    it('Should get enquiry statistics', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admissions/enquiry/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body.data).toHaveProperty('totalEnquiries');
          expect(res.body.data).toHaveProperty('conversionRate');
        });
    });

    it('Should get admission statistics', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admissions/statistics/2024-25')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body.data).toHaveProperty('totalAdmissions');
          expect(res.body.data).toHaveProperty('conversionRate');
        });
    });
  });
});
```

---

## Usage Examples

### Using the Admission Service Directly in Code

```typescript
// src/modules/other/other.service.ts
import { Injectable } from '@nestjs/common';
import { AdmissionService } from '../admission/services/admission.service';
import { AdmissionEnquiryService } from '../admission/services/admissionEnquiry.service';

@Injectable()
export class OtherService {
  constructor(
    private admissionService: AdmissionService,
    private enquiryService: AdmissionEnquiryService,
  ) {}

  async processEnquiryFromWebsite(enquiryData: any) {
    // Create enquiry
    const enquiry = await this.enquiryService.createEnquiry(
      'tenant-uuid',
      enquiryData,
    );

    console.log(`Enquiry created: ${enquiry.enquiryNo}`);

    // Get statistics
    const stats = await this.enquiryService.getEnquiryStatistics('tenant-uuid');
    console.log(`Current conversion rate: ${stats.conversionRate}%`);

    return enquiry;
  }

  async getConversionMetrics(tenantId: string) {
    const enquiryStats = await this.enquiryService.getEnquiryStatistics(
      tenantId,
    );
    const admissionStats = await this.admissionService.getAdmissionStatistics(
      tenantId,
      '2024-25',
    );

    return {
      enquiries: enquiryStats,
      admissions: admissionStats,
      conversionRate: admissionStats.conversionRate,
    };
  }
}
```

---

## Common Workflows

### Workflow 1: Complete Admission Pipeline

```typescript
// From enquiry to enrolled student
async function completeAdmissionWorkflow(
  tenantId: string,
  enquiryService: AdmissionEnquiryService,
  admissionService: AdmissionService,
  communicationService: AdmissionCommunicationService,
) {
  // Step 1: Create enquiry
  const enquiry = await enquiryService.createEnquiry(tenantId, {
    studentName: 'John Doe',
    parentName: 'Jane Doe',
    parentPhone: '+919876543210',
    parentEmail: 'jane@example.com',
    interestedClass: 'Class X',
    source: 'WEBSITE',
  });

  console.log(`Created enquiry: ${enquiry.enquiryNo}`);

  // Step 2: Schedule follow-up
  await enquiryService.addFollowUp(tenantId, enquiry.id, {
    followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    remarks: 'Follow up after prospectus sent',
    status: 'INTERESTED',
  });

  // Step 3: Convert to admission
  const { student, admission } = await admissionService.convertEnquiryToAdmission(
    tenantId,
    enquiry.id,
    {
      firstName: 'John',
      lastName: 'Doe',
      gender: 'Male',
      dateOfBirth: new Date('2010-05-15'),
      classId: 'class-uuid',
      fatherName: 'James Doe',
    },
  );

  console.log(`Created student: ${student.enrollmentNo}`);
  console.log(`Created admission: ${admission.applicationNo}`);

  // Step 4: Upload documents
  await admissionService.uploadDocumentsBulk(tenantId, admission.id, {
    documents: [
      {
        documentType: 'AADHAR',
        fileUrl: 's3://bucket/aadhar.pdf',
      },
      {
        documentType: 'BIRTH_CERTIFICATE',
        fileUrl: 's3://bucket/birth.pdf',
      },
    ],
  });

  console.log('Documents uploaded');

  // Step 5: Update status to ADMITTED
  await admissionService.updateAdmission(tenantId, admission.id, {
    status: 'ADMITTED',
    classId: 'class-uuid',
    notes: 'Admitted on merit',
  });

  console.log('Status updated to ADMITTED');

  // Step 6: Send admission notification
  await communicationService.sendAdmissionNotification(
    tenantId,
    student.id,
    'ADMITTED',
    '+919876543210',
    'jane@example.com',
  );

  console.log('Admission notification sent');

  // Step 7: Update status to ENROLLED
  await admissionService.updateAdmission(tenantId, admission.id, {
    status: 'ENROLLED',
  });

  // Step 8: Send enrollment notification
  await communicationService.sendAdmissionNotification(
    tenantId,
    student.id,
    'ENROLLED',
    '+919876543210',
    'jane@example.com',
  );

  console.log('Enrollment complete');

  return { student, admission };
}
```

### Workflow 2: Bulk Follow-up Campaign

```typescript
async function sendFollowUpCampaign(
  tenantId: string,
  enquiryService: AdmissionEnquiryService,
  communicationService: AdmissionCommunicationService,
) {
  // Get pending follow-ups
  const pendingFollowUps = await enquiryService.getPendingFollowUps(tenantId);

  console.log(`Overdue: ${pendingFollowUps.overdue.length}`);
  console.log(`Due: ${pendingFollowUps.due.length}`);
  console.log(`Upcoming: ${pendingFollowUps.upcoming.length}`);

  // Send reminders to overdue and due follow-ups
  const urgentFollowUps = [
    ...pendingFollowUps.overdue,
    ...pendingFollowUps.due,
  ];

  for (const followUp of urgentFollowUps) {
    try {
      await communicationService.sendFollowUpReminder(
        tenantId,
        followUp.enquiryId,
        followUp.parentPhone,
        followUp.parentEmail,
      );

      console.log(`Reminder sent to ${followUp.studentName}`);
    } catch (error) {
      console.error(`Failed to send reminder to ${followUp.enquiryId}`, error);
    }
  }
}
```

---

## Error Handling

### Service Error Handling

```typescript
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

// Example from admission.service.ts
async convertEnquiryToAdmission(tenantId: string, enquiryId: string, dto: any) {
  try {
    // Validate enquiry exists
    const enquiry = await this.prisma.admissionEnquiry.findUnique({
      where: { id: enquiryId, tenantId },
    });

    if (!enquiry) {
      throw new NotFoundException(`Enquiry ${enquiryId} not found`);
    }

    if (enquiry.isConverted) {
      throw new BadRequestException('Enquiry already converted to admission');
    }

    // Multi-step process
    // ... creation logic ...

    return { student, admission };
  } catch (error) {
    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }

    console.error('Error converting enquiry', error);
    throw new InternalServerErrorException('Failed to convert enquiry');
  }
}
```

### Controller Error Handling

```typescript
// Example from admission.controller.ts
@Post('enquiry')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMISSION_COUNSELLOR', 'RECEPTIONIST', 'SCHOOL_ADMIN')
@ApiBearerAuth()
@ApiOperation({ summary: 'Create new admission enquiry' })
@ApiResponse({
  status: 201,
  description: 'Enquiry created successfully',
  type: AdmissionEnquiryResponseDto,
})
@ApiResponse({
  status: 400,
  description: 'Invalid input data',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
async createEnquiry(@Body() dto: CreateAdmissionEnquiryDto) {
  try {
    const result = await this.enquiryService.createEnquiry(
      this.req.user.tenantId,
      dto,
    );
    return { success: true, data: result, message: 'Enquiry created' };
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}
```

---

## Performance Considerations

### Database Indexes

The schema includes these indexes for optimal performance:

```sql
-- From schema_v2.sql
CREATE INDEX idx_admissionEnquiry_tenantId_status ON "AdmissionEnquiry"("tenantId", "status");
CREATE INDEX idx_admissionEnquiry_tenantId_source ON "AdmissionEnquiry"("tenantId", "source");
CREATE INDEX idx_admissionEnquiry_isConverted ON "AdmissionEnquiry"("isConverted");
CREATE INDEX idx_admission_tenantId_status ON "Admission"("tenantId", "status");
CREATE INDEX idx_admission_studentId ON "Admission"("studentId");
CREATE INDEX idx_admission_enquiryId ON "Admission"("enquiryId");
CREATE INDEX idx_document_admissionId_status ON "Document"("admissionId", "status");
CREATE INDEX idx_communicationLog_tenantId_status ON "CommunicationLog"("tenantId", "status");
```

### Pagination Best Practices

```typescript
// Always paginate list endpoints
async listEnquiries(tenantId: string, query: ListAdmissionEnquiryDto) {
  const skip = (query.page - 1) * query.limit;

  // Optimize query with select to reduce payload
  const enquiries = await this.prisma.admissionEnquiry.findMany({
    where: { tenantId, ...filters },
    take: query.limit,
    skip,
    select: {
      id: true,
      enquiryNo: true,
      studentName: true,
      parentPhone: true,
      status: true,
      createdAt: true,
    },
    orderBy: { [query.sortBy]: query.sortOrder },
  });

  const total = await this.prisma.admissionEnquiry.count({
    where: { tenantId, ...filters },
  });

  return {
    data: enquiries,
    total,
    page: query.page,
    pages: Math.ceil(total / query.limit),
  };
}
```

### Connection Pooling

```typescript
// Configure Prisma datasource in schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Example connection string with pool config
// postgresql://user:password@host:5432/db?schema=public&connection_limit=10&pool_timeout=30
```

### Batch Operations

```typescript
// Use Promise.all for parallel uploads
async uploadDocumentsBulk(tenantId: string, admissionId: string, dto: any) {
  const uploadPromises = dto.documents.map((doc) =>
    this.prisma.document.create({
      data: {
        ...doc,
        admissionId,
        fileName: this.generateFileName(admissionId, doc.documentType),
      },
    }),
  );

  return Promise.all(uploadPromises);
}
```

### Caching Strategies

```typescript
// Cache statistics (refresh every hour)
@Cacheable({ ttl: 3600 })
async getEnquiryStatistics(tenantId: string) {
  // Expensive query
  return {
    totalEnquiries,
    conversionRate,
    ...
  };
}

// Invalidate cache on write operations
@CacheKey('enquiry-stats')
@CacheEvict()
async createEnquiry(tenantId: string, dto: any) {
  // Create and invalidate cache
}
```

---

## Monitoring & Logging

### Application Logs

```typescript
// Import logger from NestJS
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AdmissionService {
  private readonly logger = new Logger(AdmissionService.name);

  async convertEnquiryToAdmission(tenantId: string, enquiryId: string, dto: any) {
    this.logger.log(`Converting enquiry ${enquiryId} for tenant ${tenantId}`);

    try {
      // ... logic ...
      this.logger.debug(`Student created: ${student.enrollmentNo}`);
      this.logger.debug(`Admission created: ${admission.applicationNo}`);
    } catch (error) {
      this.logger.error(`Failed to convert enquiry: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

### Communication Log Monitoring

```typescript
// Query communication logs for troubleshooting
async getSmsFailures(tenantId: string) {
  return this.prisma.communicationLog.findMany({
    where: {
      tenantId,
      type: 'SMS',
      status: 'FAILED',
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    include: {
      student: true,
    },
  });
}
```

---

## Production Deployment Checklist

- [ ] Configure all environment variables (.env)
- [ ] Test SMS/WhatsApp/Email integrations with credentials
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Configure PostgreSQL connection pooling
- [ ] Setup monitoring (Sentry, New Relic, DataDog)
- [ ] Configure log aggregation (ELK, Splunk)
- [ ] Test all endpoints with Postman collection
- [ ] Setup automated backups for database
- [ ] Configure HTTPS/TLS certificates
- [ ] Setup rate limiting and API throttling
- [ ] Configure firewall rules and security groups
- [ ] Enable database query logging for performance analysis
- [ ] Setup alerts for error rates and latency
- [ ] Document API versioning strategy
- [ ] Create runbook for common operational tasks
