# Admission Management API Documentation

## Overview

The Admission Management Module provides a comprehensive API for managing the complete student admission lifecycle, from initial enquiry through to final enrollment. The module supports multi-tenant architecture with complete data isolation.

## Base URL

```
/api/v1/admissions
```

## Authentication

All endpoints require JWT Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

## Base Response Format

### Success Response (200/201)
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response (4xx/5xx)
```json
{
  "success": false,
  "error": "Error code",
  "message": "Error description"
}
```

---

## Admission Enquiry Endpoints

### 1. Create Admission Enquiry

**Endpoint:** `POST /admissions/enquiry`

**Role Required:** `ADMISSION_COUNSELLOR`, `RECEPTIONIST`, `SCHOOL_ADMIN`

**Request Body:**
```json
{
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
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "enquiryNo": "ENQ-2024-04-0001",
    "studentName": "John Doe",
    "parentName": "Jane Doe",
    "parentEmail": "jane@example.com",
    "parentPhone": "+919876543210",
    "interestedClass": "Class X",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "status": "NEW",
    "source": "WEBSITE",
    "notes": "Looking for scholarship",
    "followUpDate": null,
    "isConverted": false,
    "createdAt": "2024-04-15T10:30:00Z",
    "updatedAt": "2024-04-15T10:30:00Z"
  }
}
```

### 2. List Enquiries

**Endpoint:** `GET /admissions/enquiries`

**Role Required:** `ADMISSION_COUNSELLOR`, `SCHOOL_ADMIN`, `PRINCIPAL`

**Query Parameters:**
- `status` (optional): Filter by status (NEW, INTERESTED, AWAITING_INFO, QUALIFIED, NOT_INTERESTED, REJECTED)
- `source` (optional): Filter by source (WEBSITE, REFERRAL, WALKIN, PHONECALL, SOCIALMED, ADVERTISEMENT, OTHER)
- `search` (optional): Search by student name, parent name, email, or phone
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 20): Records per page
- `sortBy` (optional): Sort field (enquiryDate, studentName, etc.)
- `sortOrder` (optional): ASC or DESC

**Example Request:**
```
GET /admissions/enquiries?status=INTERESTED&page=1&limit=20&sortOrder=DESC
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "enquiryNo": "ENQ-2024-04-0001",
        "studentName": "John Doe",
        "parentName": "Jane Doe",
        "parentPhone": "+919876543210",
        "status": "INTERESTED",
        "source": "WEBSITE",
        "createdAt": "2024-04-15T10:30:00Z"
      }
    ],
    "total": 45,
    "page": 1,
    "pages": 3
  }
}
```

### 3. Get Enquiry by ID

**Endpoint:** `GET /admissions/enquiry/:enquiryId`

**Role Required:** `ADMISSION_COUNSELLOR`, `SCHOOL_ADMIN`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "enquiryNo": "ENQ-2024-04-0001",
    "studentName": "John Doe",
    "parentName": "Jane Doe",
    "parentEmail": "jane@example.com",
    "parentPhone": "+919876543210",
    "status": "INTERESTED",
    "source": "WEBSITE",
    "notes": "Looking for scholarship",
    "followUpDate": "2024-04-20T00:00:00Z",
    "isConverted": false
  }
}
```

### 4. Update Enquiry

**Endpoint:** `PUT /admissions/enquiry/:enquiryId`

**Role Required:** `ADMISSION_COUNSELLOR`, `SCHOOL_ADMIN`

**Request Body (All Fields Optional):**
```json
{
  "parentEmail": "newemail@example.com",
  "parentPhone": "+919876543211",
  "address": "456 Oak Street",
  "status": "QUALIFIED",
  "notes": "Updated remarks"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "enquiryNo": "ENQ-2024-04-0001",
    "studentName": "John Doe",
    "parentPhone": "+919876543211",
    "status": "QUALIFIED",
    "updatedAt": "2024-04-16T14:45:00Z"
  }
}
```

### 5. Add Follow-up to Enquiry

**Endpoint:** `POST /admissions/enquiry/:enquiryId/follow-up`

**Role Required:** `ADMISSION_COUNSELLOR`, `SCHOOL_ADMIN`

**Request Body:**
```json
{
  "followUpDate": "2024-04-20",
  "remarks": "Parent interested, need to send prospectus",
  "status": "INTERESTED"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "enquiry": {
      "id": "uuid",
      "enquiryNo": "ENQ-2024-04-0001",
      "status": "INTERESTED",
      "followUpDate": "2024-04-20T00:00:00Z"
    },
    "message": "Follow-up scheduled for 2024-04-20"
  }
}
```

### 6. Get Pending Follow-ups

**Endpoint:** `GET /admissions/enquiry/follow-ups/pending`

**Role Required:** `ADMISSION_COUNSELLOR`, `SCHOOL_ADMIN`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "overdue": [
      {
        "enquiryId": "uuid",
        "enquiryNo": "ENQ-2024-04-0001",
        "studentName": "John Doe",
        "lastFollowUpDate": "2024-04-10T10:30:00Z",
        "nextFollowUpDate": "2024-04-15T00:00:00Z",
        "status": "INTERESTED",
        "lastRemarks": "Parent interested"
      }
    ],
    "due": [
      // Enquiries due for follow-up within 7 days
    ],
    "upcoming": [
      // Enquiries with follow-up > 7 days out
    ],
    "total": 15
  }
}
```

### 7. Get Enquiry Statistics

**Endpoint:** `GET /admissions/enquiry/statistics`

**Role Required:** `SCHOOL_ADMIN`, `PRINCIPAL`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalEnquiries": 150,
    "statusBreakdown": [
      { "status": "NEW", "count": 35 },
      { "status": "INTERESTED", "count": 45 },
      { "status": "QUALIFIED", "count": 50 },
      { "status": "NOT_INTERESTED", "count": 15 },
      { "status": "REJECTED", "count": 5 }
    ],
    "sourceBreakdown": [
      { "source": "WEBSITE", "count": 75 },
      { "source": "REFERRAL", "count": 40 },
      { "source": "WALKIN", "count": 25 },
      { "source": "PHONECALL", "count": 10 }
    ],
    "conversionRate": 42.67
  }
}
```

---

## Admission Conversion & Management Endpoints

### 8. Convert Enquiry to Admission

**Endpoint:** `POST /admissions/enquiry/:enquiryId/convert`

**Role Required:** `ADMISSION_COUNSELLOR`, `SCHOOL_ADMIN`

**Description:** Converts a qualified enquiry to a formal student record and admission

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "gender": "Male",
  "dateOfBirth": "2010-05-15",
  "assignedClass": "Class X-A",
  "classId": "uuid",
  "fatherName": "James Doe",
  "fatherPhone": "+919876543210",
  "fatherEmail": "james@example.com",
  "motherName": "Mary Doe",
  "motherPhone": "+919876543211",
  "motherEmail": "mary@example.com",
  "bloodGroup": "O+",
  "aadharNo": "123456789012",
  "specialNeeds": "none",
  "medicalConditions": "Asthma"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "student-uuid",
      "enrollmentNo": "ENR202400001",
      "firstName": "John",
      "lastName": "Doe",
      "gender": "Male",
      "dateOfBirth": "2010-05-15T00:00:00Z",
      "status": "ACTIVE",
      "enrollmentDate": "2024-04-16T14:45:00Z"
    },
    "admission": {
      "id": "admission-uuid",
      "applicationNo": "APP-2024-04-0001",
      "studentId": "student-uuid",
      "status": "APPLIED",
      "academicYear": "2024-25",
      "applicationDate": "2024-04-16T14:45:00Z"
    }
  }
}
```

### 9. Create Direct Admission

**Endpoint:** `POST /admissions`

**Role Required:** `ADMISSION_COUNSELLOR`, `SCHOOL_ADMIN`

**Request Body:**
```json
{
  "studentId": "uuid",
  "academicYear": "2024-25",
  "classAppliedFor": "Class X",
  "section": "A",
  "previousSchool": "XYZ School",
  "previousClassPassed": "Class IX",
  "previousPercentage": 85.5,
  "transferCertificateNo": "TC123456",
  "notes": "Transferred student"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "admission-uuid",
    "applicationNo": "APP-2024-04-0001",
    "studentId": "uuid",
    "status": "APPLIED",
    "academicYear": "2024-25",
    "applicationDate": "2024-04-16T14:45:00Z"
  }
}
```

### 10. List Admissions

**Endpoint:** `GET /admissions`

**Role Required:** `SCHOOL_ADMIN`, `ADMISSION_COUNSELLOR`, `PRINCIPAL`

**Query Parameters:**
- `status` (optional): APPLIED, SHORTLISTED, ADMITTED, ENROLLED, REJECTED, CANCELLED
- `academicYear` (optional): e.g., "2024-25"
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `search` (optional): Search by application number, enrollment number, or name

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "admission-uuid",
        "applicationNo": "APP-2024-04-0001",
        "studentName": "John Doe",
        "enrollmentNo": "ENR202400001",
        "status": "APPLIED",
        "academicYear": "2024-25",
        "applicationDate": "2024-04-16T14:45:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pages": 3
  }
}
```

### 11. Get Admission Details (with Summary)

**Endpoint:** `GET /admissions/:admissionId`

**Role Required:** `SCHOOL_ADMIN`, `ADMISSION_COUNSELLOR`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "admission-uuid",
    "studentName": "John Doe",
    "enrollmentNo": "ENR202400001",
    "parentName": "James Doe",
    "parentEmail": "james@example.com",
    "parentPhone": "+919876543210",
    "status": "APPLIED",
    "academicYear": "2024-25",
    "documents": [
      {
        "id": "doc-uuid",
        "documentType": "AADHAR",
        "fileName": "APP-2024-04-0001-AADHAR-1713355500000",
        "fileUrl": "s3://bucket/path/file.pdf",
        "status": "VERIFIED",
        "remarks": "Verified correct",
        "createdAt": "2024-04-16T14:45:00Z"
      }
    ],
    "documentsUploaded": 4,
    "documentsVerified": 2,
    "documentsPending": 2
  }
}
```

### 12. Update Admission

**Endpoint:** `PUT /admissions/:admissionId`

**Role Required:** `SCHOOL_ADMIN`, `ADMISSION_COUNSELLOR`

**Request Body:**
```json
{
  "status": "ADMITTED",
  "classId": "uuid",
  "notes": "Admitted on merit",
  "rejectionReason": null
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "admission-uuid",
    "applicationNo": "APP-2024-04-0001",
    "status": "ADMITTED",
    "admissionDate": "2024-04-17T10:00:00Z",
    "updatedAt": "2024-04-17T10:00:00Z"
  }
}
```

### 13. Get Admission Statistics

**Endpoint:** `GET /admissions/statistics/:academicYear`

**Role Required:** `SCHOOL_ADMIN`, `PRINCIPAL`

**Example:** `GET /admissions/statistics/2024-25`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalEnquiries": 150,
    "newEnquiries": 35,
    "interested": 45,
    "qualified": 50,
    "rejectedEnquiries": 5,
    "totalAdmissions": 65,
    "appliedAdmissions": 20,
    "admittedCount": 30,
    "enrolledCount": 15,
    "rejectedAdmissions": 5,
    "conversionRate": 43.33,
    "academicYear": "2024-25"
  }
}
```

---

## Document Management Endpoints

### 14. Upload Single Document

**Endpoint:** `POST /admissions/:admissionId/documents`

**Role Required:** `ADMISSION_COUNSELLOR`, `SCHOOL_ADMIN`

**Request Body:**
```json
{
  "documentType": "AADHAR",
  "fileUrl": "s3://bucket/documents/aadhar.pdf",
  "remarks": "Aadhar card copy",
  "expiryDate": "2026-12-31"
}
```

**Document Types Supported:**
- AADHAR
- BIRTH_CERTIFICATE
- TRANSFER_CERTIFICATE
- VACCINATION_CERTIFICATE
- CHARACTER_CERTIFICATE
- PASSPORT
- PHOTOGRAPH
- PARENT_ID_PROOF
- ADDRESS_PROOF
- INCOME_CERTIFICATE
- MEDICAL_CERTIFICATE
- OTHER

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "doc-uuid",
    "documentType": "AADHAR",
    "fileName": "APP-2024-04-0001-AADHAR-1713355500000",
    "fileUrl": "s3://bucket/documents/aadhar.pdf",
    "status": "UPLOADED",
    "remarks": "Aadhar card copy",
    "expiryDate": "2026-12-31T00:00:00Z",
    "createdAt": "2024-04-16T14:45:00Z"
  }
}
```

### 15. Upload Multiple Documents (Bulk)

**Endpoint:** `POST /admissions/:admissionId/documents/bulk`

**Role Required:** `ADMISSION_COUNSELLOR`, `SCHOOL_ADMIN`

**Request Body:**
```json
{
  "documents": [
    {
      "documentType": "AADHAR",
      "fileUrl": "s3://bucket/aadhar.pdf",
      "remarks": "Aadhar card"
    },
    {
      "documentType": "BIRTH_CERTIFICATE",
      "fileUrl": "s3://bucket/birth.pdf",
      "remarks": "Birth certificate"
    },
    {
      "documentType": "VACCINATION_CERTIFICATE",
      "fileUrl": "s3://bucket/vaccination.pdf",
      "remarks": "Vaccination certificate",
      "expiryDate": "2025-12-31"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-uuid-1",
      "documentType": "AADHAR",
      "status": "UPLOADED",
      "createdAt": "2024-04-16T14:45:00Z"
    },
    {
      "id": "doc-uuid-2",
      "documentType": "BIRTH_CERTIFICATE",
      "status": "UPLOADED",
      "createdAt": "2024-04-16T14:45:00Z"
    }
  ]
}
```

### 16. Verify Document

**Endpoint:** `PUT /admissions/documents/:documentId/verify`

**Role Required:** `SCHOOL_ADMIN`, `ACCOUNTANT`

**Query Parameter:**
- `status` (required): VERIFIED or REJECTED

**Example:** `PUT /admissions/documents/doc-uuid/verify?status=VERIFIED`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "doc-uuid",
    "documentType": "AADHAR",
    "status": "VERIFIED",
    "verificationDate": "2024-04-17T10:30:00Z"
  }
}
```

---

## Communication Endpoints

### 17. Send SMS

**Endpoint:** `POST /admissions/:admissionId/send-sms`

**Role Required:** `ADMISSION_COUNSELLOR`, `SCHOOL_ADMIN`

**Request Body:**
```json
{
  "phoneNumber": "+919876543210",
  "message": "Dear parent, your ward's admission is confirmed. Please visit the school office for enrollment."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "messageId": "sms-msg-id-12345",
    "message": "SMS sent successfully"
  }
}
```

### 18. Send WhatsApp Message

**Endpoint:** `POST /admissions/:admissionId/send-whatsapp`

**Role Required:** `ADMISSION_COUNSELLOR`, `SCHOOL_ADMIN`

**Request Body:**
```json
{
  "phoneNumber": "+919876543210",
  "message": "Hi 👋, Your admission is confirmed! Please complete enrollment soon."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "messageId": "wa-msg-id-12345",
    "message": "WhatsApp message sent successfully"
  }
}
```

### 19. Send Email

**Endpoint:** `POST /admissions/:admissionId/send-email`

**Role Required:** `ADMISSION_COUNSELLOR`, `SCHOOL_ADMIN`

**Request Body:**
```json
{
  "email": "parent@example.com",
  "subject": "Admission Confirmation",
  "body": "<h2>Welcome!</h2><p>Your ward's admission has been confirmed. Please visit our office for enrollment.</p>"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "messageId": "email-msg-id-12345",
    "message": "Email sent successfully"
  }
}
```

### 20. Send Status Notification

**Endpoint:** `POST /admissions/:admissionId/notify-status`

**Role Required:** `SCHOOL_ADMIN`, `ADMISSION_COUNSELLOR`

**Description:** Sends automated status notification (SMS + Email) for admission status change

**Request Body:**
```json
{
  "status": "ADMITTED",
  "parentPhone": "+919876543210",
  "parentEmail": "parent@example.com"
}
```

**Status Notifications:**
- **ADMITTED**: Congratulations message + enrollment instructions
- **ENROLLED**: Welcome message + fee payment instructions
- **REJECTED**: Regret message + contact information

**Response (200 OK):**
```json
{
  "success": true,
  "message": {
    "success": true,
    "message": "Status notification sent"
  }
}
```

### 21. Send Follow-up Reminder

**Endpoint:** `POST /admissions/enquiry/:enquiryId/send-reminder`

**Role Required:** `ADMISSION_COUNSELLOR`, `SCHOOL_ADMIN`

**Request Body:**
```json
{
  "parentPhone": "+919876543210",
  "parentEmail": "parent@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Reminder sent successfully"
  }
}
```

---

## Admission Pipeline Status Flow

```
NEW
  ↓
INTERESTED
  ↓
AWAITING_INFO / QUALIFIED
  ↓
APPLIED
  ↓
SHORTLISTED
  ↓
ADMITTED
  ↓
ENROLLED

Or at any point:
  ↓
REJECTED / NOT_INTERESTED
```

---

## Error Codes

| Code | Status | Message |
|------|--------|---------|
| `400` | Bad Request | Invalid input data |
| `401` | Unauthorized | Missing/invalid JWT token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Invalid state transition |
| `500` | Server Error | Internal server error |

---

## Status Validation

### Enquiry Status Transitions
- `NEW` → `INTERESTED`, `QUALIFIED`, `REJECTED`
- `INTERESTED` → `QUALIFIED`, `AWAITING_INFO`, `NOT_INTERESTED`, `REJECTED`
- `AWAITING_INFO` → `INTERESTED`, `QUALIFIED`, `REJECTED`
- `QUALIFIED` → Can be converted to Admission
- `NOT_INTERESTED` / `REJECTED` → Terminal states

### Admission Status Transitions
- `INQUIRY` → `APPLIED`
- `APPLIED` → `SHORTLISTED`, `REJECTED`
- `SHORTLISTED` → `ADMITTED`, `REJECTED`
- `ADMITTED` → `ENROLLED`, `REJECTED`
- `ENROLLED` → `SUSPENDED`, `DROPPED`
- `REJECTED` / `CANCELLED` → Terminal states

---

## Pagination

All list endpoints support pagination with the following parameters:

- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Records per page

**Example:**
```
GET /admissions/enquiries?page=2&limit=30
```

---

## Filtering & Sorting

### Supported Filters
- `status`: Admission/Enquiry status
- `source`: Source of enquiry
- `academicYear`: Academic year (e.g., "2024-25")
- `search`: Full-text search on name, email, phone

### Sorting
- `sortBy`: Field to sort by
- `sortOrder`: ASC or DESC

**Example:**
```
GET /admissions/enquiries?status=INTERESTED&sortBy=enquiryDate&sortOrder=DESC
```

---

## Rate Limiting

- **Endpoints**: 100 requests per minute per user
- **Authentication**: 5 failed attempts per minute = temporary lockout

---

## Webhook Events (Future)

- `admission.enquiry.created`
- `admission.enquiry.updated`
- `admission.enquiry.converted`
- `admission.status.changed`
- `admission.document.uploaded`
- `admission.document.verified`

---

## Example Workflows

### Workflow 1: Enquiry to Admission

```bash
# 1. Create Enquiry
curl -X POST http://localhost:3000/api/v1/admissions/enquiry \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "studentName": "John Doe",
  "parentName": "Jane Doe",
  "parentEmail": "jane@example.com",
  "parentPhone": "+919876543210",
  "interestedClass": "Class X",
  "source": "WEBSITE"
}
EOF

# 2. Add Follow-up
curl -X POST http://localhost:3000/api/v1/admissions/enquiry/$ENQUIRY_ID/follow-up \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "followUpDate": "2024-04-20",
  "remarks": "Parent interested, sending prospectus",
  "status": "INTERESTED"
}
EOF

# 3. Convert to Admission
curl -X POST http://localhost:3000/api/v1/admissions/enquiry/$ENQUIRY_ID/convert \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "firstName": "John",
  "lastName": "Doe",
  "gender": "Male",
  "dateOfBirth": "2010-05-15",
  "classId": "$CLASS_UUID"
}
EOF

# 4. Upload Documents
curl -X POST http://localhost:3000/api/v1/admissions/$ADMISSION_ID/documents/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "documents": [
    {"documentType": "AADHAR", "fileUrl": "s3://bucket/aadhar.pdf"},
    {"documentType": "BIRTH_CERTIFICATE", "fileUrl": "s3://bucket/birth.pdf"}
  ]
}
EOF

# 5. Update Admission Status
curl -X PUT http://localhost:3000/api/v1/admissions/$ADMISSION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "status": "ADMITTED",
  "classId": "$CLASS_UUID"
}
EOF

# 6. Send Notification
curl -X POST http://localhost:3000/api/v1/admissions/$ADMISSION_ID/notify-status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "status": "ADMITTED",
  "parentPhone": "+919876543210",
  "parentEmail": "jane@example.com"
}
EOF
```

---

## Support

For API support and issues, contact: support@schoolerp.com
