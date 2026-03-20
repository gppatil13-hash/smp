# Admission Module - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 16+ running
- NestJS project initialized
- Admission module files created in `src/modules/admission/`

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
cd your-project
npm install @nestjs/common @nestjs/core @nestjs/jwt @nestjs/config
npm install prisma @prisma/client
npm install class-validator class-transformer
npm install uuid
```

### 2. Create Database

```bash
# Create PostgreSQL database
createdb school_erp

# Or using psql
psql -U postgres -c "CREATE DATABASE school_erp;"
```

### 3. Update .env

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/school_erp"
JWT_SECRET="your-secret-key"
TWILIO_ENABLED=false
WHATSAPP_ENABLED=false
EMAIL_ENABLED=false
```

### 4. Run Migrations

```bash
# Execute both schema phases
npx prisma migrate deploy

# Or manually load the DDL
psql -U postgres -d school_erp -f schema_v2.sql
```

### 5. Import Admission Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AdmissionModule } from './modules/admission/admission.module';

@Module({
  imports: [AdmissionModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### 6. Start Application

```bash
npm run start:dev
```

### 7. Test Endpoints

```bash
# Get JWT token (assuming you have auth module)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"password"}'

# Store token
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Create enquiry
curl -X POST http://localhost:3000/api/v1/admissions/enquiry \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "John Doe",
    "parentName": "Jane Doe",
    "parentPhone": "+919876543210",
    "parentEmail": "jane@example.com",
    "interestedClass": "Class X",
    "source": "WEBSITE"
  }'
```

---

## File Structure

```
src/modules/admission/
├── controllers/
│   └── admission.controller.ts          # 450+ lines - HTTP request handling
├── services/
│   ├── admission.service.ts             # 450+ lines - Admission lifecycle
│   ├── admissionEnquiry.service.ts      # 350+ lines - Enquiry management
│   └── admissionCommunication.service.ts # 370+ lines - SMS/WhatsApp/Email
├── dtos/
│   ├── admission.dto.ts                 # 700+ lines - Admission DTOs
│   └── admissionEnquiry.dto.ts          # 350+ lines - Enquiry DTOs
├── admission.module.ts                  # Module configuration
└── README.md                            # Module documentation
```

---

## Common Commands

### Create Enquiry

```bash
curl -X POST http://localhost:3000/api/v1/admissions/enquiry \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "John Doe",
    "gender": "Male",
    "dateOfBirth": "2010-05-15",
    "parentName": "Jane Doe",
    "parentEmail": "jane@example.com",
    "parentPhone": "+919876543210",
    "interestedClass": "Class X",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "source": "WEBSITE",
    "notes": "Looking for scholarship"
  }'
```

### List Enquiries

```bash
curl http://localhost:3000/api/v1/admissions/enquiries \
  -H "Authorization: Bearer $TOKEN"

# With filters
curl "http://localhost:3000/api/v1/admissions/enquiries?status=INTERESTED&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Convert Enquiry to Admission

```bash
ENQUIRY_ID="uuid-from-previous-response"

curl -X POST http://localhost:3000/api/v1/admissions/enquiry/$ENQUIRY_ID/convert \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "gender": "Male",
    "dateOfBirth": "2010-05-15",
    "classId": "class-uuid",
    "fatherName": "James Doe",
    "fatherPhone": "+919876543210",
    "fatherEmail": "james@example.com",
    "motherName": "Mary Doe",
    "bloodGroup": "O+",
    "aadharNo": "123456789012"
  }'
```

### Upload Documents

```bash
ADMISSION_ID="admission-uuid-from-conversion"

curl -X POST http://localhost:3000/api/v1/admissions/$ADMISSION_ID/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "AADHAR",
    "fileUrl": "s3://bucket/aadhar.pdf",
    "remarks": "Aadhar card copy"
  }'
```

### Update Admission Status

```bash
curl -X PUT http://localhost:3000/api/v1/admissions/$ADMISSION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ADMITTED",
    "classId": "class-uuid",
    "notes": "Admitted on merit"
  }'
```

### Send SMS

```bash
curl -X POST http://localhost:3000/api/v1/admissions/$ADMISSION_ID/send-sms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210",
    "message": "Your admission is confirmed. Please visit our office."
  }'
```

### Get Statistics

```bash
# Enquiry statistics
curl http://localhost:3000/api/v1/admissions/enquiry/statistics \
  -H "Authorization: Bearer $TOKEN"

# Admission statistics
curl http://localhost:3000/api/v1/admissions/statistics/2024-25 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Troubleshooting

### Issue: "Enquiry not found"

**Solution:** Verify the enquiry ID from the creation response

```bash
# List enquiries to find correct ID
curl http://localhost:3000/api/v1/admissions/enquiries \
  -H "Authorization: Bearer $TOKEN" | jq '.data.data[0].id'
```

### Issue: "Status transition not valid"

**Solution:** Verify the status can transition to the requested status

Valid transitions:
- NEW → INTERESTED, QUALIFIED, REJECTED
- INTERESTED → QUALIFIED, AWAITING_INFO, NOT_INTERESTED, REJECTED
- QUALIFIED → APPLIED (via conversion)
- APPLIED → SHORTLISTED, REJECTED
- SHORTLISTED → ADMITTED, REJECTED
- ADMITTED → ENROLLED, REJECTED
- ENROLLED → (final)

### Issue: "Unauthorized" (401)

**Solution:** Get a new JWT token and update the Authorization header

```bash
# Login and get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"password"}' | jq '.data.token'
```

### Issue: "Forbidden" (403)

**Solution:** Verify your user has the required role

Required roles by endpoint:
- Create Enquiry: ADMISSION_COUNSELLOR, RECEPTIONIST, SCHOOL_ADMIN
- Update Enquiry: ADMISSION_COUNSELLOR, SCHOOL_ADMIN
- Convert Enquiry: ADMISSION_COUNSELLOR, SCHOOL_ADMIN
- Verify Document: SCHOOL_ADMIN, ACCOUNTANT
- Send Communication: ADMISSION_COUNSELLOR, SCHOOL_ADMIN
- View Statistics: SCHOOL_ADMIN, PRINCIPAL

### Issue: Database connection error

**Solution:** Verify PostgreSQL is running and connection string is correct

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -U postgres -h localhost -d school_erp -c "SELECT 1;"
```

---

## Expected Responses

### Success Response (201 Created - Create Enquiry)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "enquiryNo": "ENQ-2024-04-0001",
    "studentName": "John Doe",
    "parentName": "Jane Doe",
    "parentPhone": "+919876543210",
    "parentEmail": "jane@example.com",
    "interestedClass": "Class X",
    "status": "NEW",
    "source": "WEBSITE",
    "notes": "Looking for scholarship",
    "createdAt": "2024-04-16T15:30:00.000Z",
    "updatedAt": "2024-04-16T15:30:00.000Z"
  }
}
```

### Success Response (200 OK - List Enquiries)

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "enquiryNo": "ENQ-2024-04-0001",
        "studentName": "John Doe",
        "parentPhone": "+919876543210",
        "status": "NEW",
        "source": "WEBSITE",
        "createdAt": "2024-04-16T15:30:00.000Z"
      }
    ],
    "total": 45,
    "page": 1,
    "pages": 3
  }
}
```

### Success Response (201 Created - Convert Enquiry)

```json
{
  "success": true,
  "data": {
    "student": {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "enrollmentNo": "ENR202400001",
      "firstName": "John",
      "lastName": "Doe",
      "gender": "Male",
      "dateOfBirth": "2010-05-15T00:00:00.000Z",
      "status": "ACTIVE",
      "enrollmentDate": "2024-04-16T15:30:00.000Z"
    },
    "admission": {
      "id": "750e8400-e29b-41d4-a716-446655440002",
      "applicationNo": "APP-2024-04-0001",
      "studentId": "650e8400-e29b-41d4-a716-446655440001",
      "status": "APPLIED",
      "academicYear": "2024-25",
      "applicationDate": "2024-04-16T15:30:00.000Z"
    }
  }
}
```

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Enquiry already converted to admission"
}
```

### Error Response (404 Not Found)

```json
{
  "success": false,
  "error": "Not Found",
  "message": "Enquiry with ID '550e8400-e29b-41d4-a716-446655440000' not found"
}
```

### Error Response (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## Next Steps

1. **Test all 20+ endpoints** using the curl commands above or Postman
2. **Configure external services:**
   - Twilio for SMS (get credentials from twilio.com)
   - WhatsApp Business API (get credentials from business.facebook.com)
   - SMTP for email (use Gmail, SendGrid, or AWS SES)
3. **Create frontend forms** for enquiry submission
4. **Setup automated follow-up reminders** using a cron job
5. **Configure monitoring** with Sentry or DataDog
6. **Create Postman collection** for team collaboration

---

## Support Resources

- **Swagger UI:** http://localhost:3000/api/docs
- **NestJS Docs:** https://docs.nestjs.com
- **Prisma Docs:** https://www.prisma.io/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs

---

## Database Queries for Troubleshooting

```sql
-- See all enquiries for a tenant
SELECT * FROM "AdmissionEnquiry" WHERE "tenantId" = 'your-tenant-id' ORDER BY "createdAt" DESC;

-- See all admissions
SELECT * FROM "Admission" WHERE "tenantId" = 'your-tenant-id' ORDER BY "createdAt" DESC;

-- See conversion rate
SELECT 
  COUNT(DISTINCT id) as total_enquiries,
  COUNT(DISTINCT CASE WHEN "isConverted" = true THEN id END) as converted,
  ROUND(COUNT(DISTINCT CASE WHEN "isConverted" = true THEN id END) * 100.0 / COUNT(DISTINCT id), 2) as conversion_rate
FROM "AdmissionEnquiry"
WHERE "tenantId" = 'your-tenant-id';

-- See documents by status
SELECT 
  "documentType",
  "status",
  COUNT(*) as count
FROM "Document"
WHERE "tenantId" = 'your-tenant-id'
GROUP BY "documentType", "status";

-- See communication logs (SMS/Email/WhatsApp)
SELECT 
  "type",
  "status",
  COUNT(*) as count
FROM "CommunicationLog"
WHERE "tenantId" = 'your-tenant-id'
  AND "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY "type", "status";
```

---

## Performance Tips

1. **Pagination:** Always use page/limit parameters on list endpoints
2. **Filtering:** Filter by status/source before searching
3. **Bulk Operations:** Use bulk document upload instead of single uploads
4. **Caching:** Cache statistics responses (they don't need real-time updates)
5. **Indexing:** Use provided indexes on tenantId, status, and source fields

---

## Best Practices

✅ **DO:**
- Always include tenantId in queries (multi-tenant safety)
- Validate status transitions before updating
- Log all communications for audit trail
- Use bulk uploads for multiple documents
- Paginate large result sets
- Use role-based guards on all endpoints

❌ **DON'T:**
- Skip JWT authentication
- Update status multiple times without logging
- Expose sensitive data in error messages
- Hardcode credentials in code
- Skip database migrations
- Make assumptions about enquiry state

---

## Module Exports

The admission.module.ts exports 3 services for use in other modules:

```typescript
// Use in another module
import { AdmissionModule } from './modules/admission/admission.module';

@Module({
  imports: [AdmissionModule],
  // Services are now available via dependency injection
})
export class MyModule {}

// Inject services
constructor(
  private admissionService: AdmissionService,
  private enquiryService: AdmissionEnquiryService,
  private communicationService: AdmissionCommunicationService,
) {}
```

---

Generated: 2024-04-16
Last Updated: 2024-04-16
