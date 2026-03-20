# API Documentation

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.schoolerp.com
```

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require JWT token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

### Success Response (2xx)
```json
{
  "data": {...},
  "message": "Success",
  "statusCode": 200
}
```

### Error Response (4xx, 5xx)
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request",
  "timestamp": "2024-03-19T10:30:00Z"
}
```

## Rate Limiting

- Requests per minute: 100
- Burst limit: 500

# Authentication Endpoints

### Register New User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "admin@school.com",
  "password": "secure_password_123",
  "firstName": "John",
  "lastName": "Doe",
  "tenantId": "tenant_123",
  "schoolId": "school_456"
}
```

**Response** (201):
```json
{
  "id": "user_789",
  "email": "admin@school.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "SCHOOL_ADMIN",
  "tenantId": "tenant_123",
  "schoolId": "school_456",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@school.com",
  "password": "secure_password_123",
  "tenantId": "tenant_123"
}
```

**Response** (200):
```json
{
  "id": "user_789",
  "email": "admin@school.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "SCHOOL_ADMIN",
  "tenantId": "tenant_123",
  "schoolId": "school_456",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User Profile

```http
GET /auth/profile
Authorization: Bearer <jwt_token>
```

**Response** (200):
```json
{
  "id": "user_789",
  "email": "admin@school.com",
  "role": "SCHOOL_ADMIN",
  "tenantId": "tenant_123",
  "schoolId": "school_456"
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer <jwt_token>
```

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

---

# School Management Endpoints

### List Schools

```http
GET /schools
Authorization: Bearer <jwt_token>
```

**Response** (200):
```json
[
  {
    "id": "school_456",
    "name": "St. Joseph's School",
    "tenantId": "tenant_123",
    "registrationNumber": "CBSE/1234",
    "city": "Mumbai",
    "state": "Maharashtra",
    "phone": "9876543210",
    "principalName": "Dr. Jane Smith"
  }
]
```

### Get School Details

```http
GET /schools/:id
Authorization: Bearer <jwt_token>
```

**Response** (200):
```json
{
  "id": "school_456",
  "name": "St. Joseph's School",
  "registrationNumber": "CBSE/1234",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pinCode": "400001",
  "principalName": "Dr. Jane Smith",
  "principalEmail": "principal@stjosephs.com",
  "phone": "9876543210",
  "website": "https://stjosephs.com",
  "foundedYear": 1980
}
```

### Create School

```http
POST /schools
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "St. Joseph's School",
  "registrationNumber": "CBSE/1234",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pinCode": "400001",
  "principalName": "Dr. Jane Smith",
  "principalEmail": "principal@stjosephs.com",
  "phone": "9876543210",
  "foundedYear": 1980
}
```

**Note**: Requires SUPER_ADMIN role

**Response** (201):
```json
{
  "id": "school_456",
  "name": "St. Joseph's School",
  ...
}
```

### Update School

```http
PUT /schools/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "St. Joseph's Senior Secondary School",
  "phone": "9876543219"
}
```

**Note**: Requires SCHOOL_ADMIN role

**Response** (200):
```json
{
  "id": "school_456",
  "name": "St. Joseph's Senior Secondary School",
  ...
}
```

---

# Student Management Endpoints

### List Students

```http
GET /students?skip=0&take=20&classId=class_1&status=ACTIVE
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `skip`: Pagination offset (default: 0)
- `take`: Records per page (default: 20, max: 100)
- `classId`: Filter by class
- `academicYear`: Filter by academic year
- `status`: Filter by status (ACTIVE, INACTIVE, GRADUATED, LEFT)

**Response** (200):
```json
[
  {
    "id": "student_001",
    "enrollmentNo": "ST/2024/001",
    "rollNumber": 1,
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "email": "rajesh@email.com",
    "fatherName": "Mr. Kumar",
    "fatherPhone": "9876543210",
    "city": "Mumbai",
    "status": "ACTIVE",
    "academicYear": "2024-2025"
  }
]
```

### Get Student Details

```http
GET /students/:id
Authorization: Bearer <jwt_token>
```

**Response** (200):
```json
{
  "id": "student_001",
  "enrollmentNo": "ST/2024/001",
  "rollNumber": 1,
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "dateOfBirth": "2010-05-15",
  "gender": "M",
  "bloodGroup": "O+",
  "email": "rajesh@email.com",
  "phone": "9876543211",
  "fatherName": "Mr. Kumar",
  "fatherPhone": "9876543210",
  "motherName": "Mrs. Kumar",
  "motherPhone": "9876543212",
  "address": "123 Street, Mumbai",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pinCode": "400001",
  "status": "ACTIVE",
  "admissionDate": "2024-01-15",
  "feeRecords": [
    {
      "id": "fee_123",
      "feeType": "Tuition",
      "totalAmount": 5000,
      "paidAmount": 5000,
      "status": "PAID",
      "dueDate": "2024-02-15"
    }
  ]
}
```

### Create Student

```http
POST /students
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "enrollmentNo": "ST/2024/001",
  "rollNumber": 1,
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "dateOfBirth": "2010-05-15",
  "gender": "M",
  "bloodGroup": "O+",
  "email": "rajesh@email.com",
  "fatherName": "Mr. Kumar",
  "fatherPhone": "9876543210",
  "motherName": "Mrs. Kumar",
  "motherPhone": "9876543212",
  "address": "123 Street, Mumbai",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pinCode": "400001",
  "academicYear": "2024-2025",
  "classId": "class_1",
  "admissionDate": "2024-01-15"
}
```

**Note**: Requires SCHOOL_ADMIN or ADMISSION_COUNSELLOR role

**Response** (201):
```json
{
  "id": "student_001",
  ...
}
```

### Update Student

```http
PUT /students/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "firstName": "Rajesh Kumar",
  "email": "rajesh.kumar@email.com",
  "status": "INACTIVE"
}
```

**Note**: Requires SCHOOL_ADMIN role

**Response** (200):
```json
{
  "id": "student_001",
  ...
}
```

---

# Admission Endpoints

### Create Admission (Public)

```http
POST /admissions
Content-Type: application/json

{
  "candidateName": "Priya Singh",
  "candidateEmail": "priya@email.com",
  "candidatePhone": "9876543210",
  "dob": "2010-03-20",
  "gender": "F",
  "fatherName": "Mr. Singh",
  "fatherPhone": "9876543210",
  "motherName": "Mrs. Singh",
  "motherPhone": "9876543211",
  "applyingForClass": "CLASS_9",
  "address": "456 Avenue",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pinCode": "400002",
  "previousSchool": "City School",
  "previousClass": "CLASS_8"
}
```

**Response** (201):
```json
{
  "id": "admission_001",
  "applicationNo": "APP-1234567890-abc123",
  "candidateName": "Priya Singh",
  "status": "INQUIRY",
  "appliedAt": "2024-03-19T10:30:00Z"
}
```

### List Admissions

```http
GET /admissions?status=APPLIED&skip=0&take=20
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `status`: INQUIRY, APPLIED, SHORTLISTED, ADMITTED, REJECTED, ENROLLED, WAITLISTED
- `skip`: Pagination offset
- `take`: Records per page

**Response** (200):
```json
[
  {
    "id": "admission_001",
    "applicationNo": "APP-1234567890-abc123",
    "candidateName": "Priya Singh",
    "candidateEmail": "priya@email.com",
    "applyingForClass": "CLASS_9",
    "status": "APPLIED",
    "appliedAt": "2024-03-19T10:30:00Z"
  }
]
```

### Get Admission Statistics

```http
GET /admissions/statistics
Authorization: Bearer <jwt_token>
```

**Response** (200):
```json
[
  {
    "status": "INQUIRY",
    "_count": 45
  },
  {
    "status": "APPLIED",
    "_count": 30
  },
  {
    "status": "ADMITTED",
    "_count": 20
  }
]
```

### Update Admission Status

```http
PUT /admissions/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "ADMITTED",
  "remarks": "Admission approved based on entrance test"
}
```

**Note**: Requires SCHOOL_ADMIN or ADMISSION_COUNSELLOR role

**Response** (200):
```json
{
  "id": "admission_001",
  "status": "ADMITTED",
  "remarks": "Admission approved based on entrance test",
  "admittedAt": "2024-03-19T10:35:00Z"
}
```

---

# Fee Management Endpoints

### Create Fee Structure

```http
POST /fees/structure
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "academicYear": "2024-2025",
  "classSection": "CLASS_9_A",
  "feeType": "TUITION",
  "amount": 50000,
  "frequency": "YEARLY",
  "dueDate": 15,
  "description": "Annual tuition fee"
}
```

**Note**: Requires SCHOOL_ADMIN or ACCOUNTS_TEAM role

**Response** (201):
```json
{
  "id": "fee_structure_001",
  "academicYear": "2024-2025",
  "classSection": "CLASS_9_A",
  "feeType": "TUITION",
  "amount": 50000,
  "frequency": "YEARLY",
  "status": true
}
```

### Get Student Fee Balance

```http
GET /fees/student/:studentId/balance
Authorization: Bearer <jwt_token>
```

**Response** (200):
```json
{
  "totalDue": 150000,
  "totalPaid": 100000,
  "balance": 50000,
  "records": [
    {
      "id": "fee_record_001",
      "feeType": "TUITION",
      "totalAmount": 50000,
      "paidAmount": 50000,
      "status": "PAID",
      "dueDate": "2024-02-15",
      "paidDate": "2024-02-10"
    }
  ]
}
```

### Record Payment

```http
PATCH /fees/record/:feeRecordId/payment
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 25000,
  "paymentMode": "BANK_TRANSFER",
  "transactionId": "TXN123456789",
  "remarks": "Payment received"
}
```

**Note**: Requires SCHOOL_ADMIN or ACCOUNTS_TEAM role

**Response** (200):
```json
{
  "id": "fee_record_001",
  "totalAmount": 50000,
  "paidAmount": 50000,
  "status": "PAID",
  "paymentMode": "BANK_TRANSFER",
  "transactionId": "TXN123456789",
  "paidDate": "2024-03-19T10:35:00Z"
}
```

---

# Communication Endpoints

### Send SMS

```http
POST /communications/sms
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "recipientPhone": "+919876543210",
  "message": "Dear parent, your ward's fee is due on 15th March",
  "studentId": "student_001"
}
```

**Response** (201):
```json
{
  "id": "comm_001",
  "type": "SMS",
  "recipientPhone": "+919876543210",
  "status": "SENT",
  "sentAt": "2024-03-19T10:35:00Z",
  "externalId": "SM_1234567890"
}
```

### Send WhatsApp

```http
POST /communications/whatsapp
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "recipientPhone": "+919876543210",
  "message": "Admission update: Your child has been shortlisted",
  "studentId": "student_001"
}
```

**Response** (201):
```json
{
  "id": "comm_002",
  "type": "WHATSAPP",
  "recipientPhone": "+919876543210",
  "status": "SENT",
  "sentAt": "2024-03-19T10:35:00Z"
}
```

### Send Email

```http
POST /communications/email
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "recipientEmail": "parent@email.com",
  "subject": "Fee Payment Reminder",
  "message": "<html>Dear parent, please find attached your fee invoice...</html>"
}
```

**Response** (201):
```json
{
  "id": "comm_003",
  "type": "EMAIL",
  "recipientEmail": "parent@email.com",
  "status": "SENT",
  "sentAt": "2024-03-19T10:35:00Z"
}
```

---

# Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions for the operation |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists or constraint violation |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

---

**Document Version**: 1.0
**Last Updated**: March 2026
