# Fees Management - Quick Reference Guide

## Base URL
```
/api/fees
```

## Authentication
```
Authorization: Bearer {jwt_token}
```

---

## Quick Endpoint Reference

### 🎓 COURSES
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/courses` | Create new course |
| `GET` | `/courses` | List all courses |
| `GET` | `/courses/:id` | Get course details |
| `PUT` | `/courses/:id` | Update course |
| `PATCH` | `/courses/:id/delete` | Delete course |
| `GET` | `/courses/stats/overview` | Get statistics |

### 💰 FEE STRUCTURES
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/structures` | Create fee structure |
| `GET` | `/structures` | List structures |
| `GET` | `/structures/:id` | Get structure details |
| `PUT` | `/structures/:id` | Update structure |
| `GET` | `/structures/class/{section}` | Get by class |
| `PATCH` | `/structures/:id/delete` | Delete structure |
| `GET` | `/structures/stats/overview` | Get statistics |

### 📅 INSTALLMENTS
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/installments` | Create plan |
| `GET` | `/installments/:feeStructureId` | Get plan |
| `GET` | `/installments/:feeStructureId/term/{termName}` | Get term |
| `PUT` | `/installments/:feeStructureId` | Update plan |
| `POST` | `/installments/:feeStructureId/generate-records` | Generate records |

### 💳 PAYMENTS
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/payments` | Record payment |
| `GET` | `/payments/student/:studentId` | Get payment history |
| `GET` | `/payments/:feeRecordId` | Get payment details |
| `GET` | `/payments/stats/overview` | Get statistics |
| `GET` | `/payments/reminders/due` | Get due reminders |

### 📄 RECEIPTS
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/receipts/generate` | Generate receipt |
| `GET` | `/receipts/:number` | Get receipt |
| `GET` | `/receipts/student/:studentId` | Get history |
| `POST` | `/receipts/:number/send` | Send receipt |
| `POST` | `/receipts/bulk-generate` | Bulk generate |
| `GET` | `/receipts/stats/overview` | Get statistics |

---

## Role Access Matrix

| Endpoint Type | Admin | Accounts | Teacher | Parent | Student |
|--------------|-------|----------|---------|--------|---------|
| Create Course | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Structure | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Installment | ✅ | ✅ | ❌ | ❌ | ❌ |
| Record Payment | ✅ | ✅ | ❌ | ❌ | ❌ |
| Generate Receipt | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Courses | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Structures | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Payments | ✅ | ✅ | ❌ | ✅ | ✅ |
| View Receipts | ✅ | ✅ | ❌ | ✅ | ✅ |

---

## Common Request Examples

### 1. Create Course
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Class 10 - A",
    "section": "A",
    "academicYear": "2025-2026",
    "capacity": 40
  }' \
  http://localhost:3000/api/fees/courses
```

### 2. Create Fee Structure
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Class 10 Fee Structure",
    "academicYear": "2025-2026",
    "classSection": "A",
    "components": [
      {
        "componentName": "Tuition Fee",
        "amount": 3000
      },
      {
        "componentName": "Lab Fee",
        "amount": 500
      }
    ]
  }' \
  http://localhost:3000/api/fees/structures
```

### 3. Create Installment Plan
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "feeStructureId": "structure_123",
    "terms": [
      {
        "termName": "Term 1",
        "startDate": "2025-04-01",
        "endDate": "2025-06-30",
        "percentageAmount": 50,
        "dueDate": "2025-06-15"
      },
      {
        "termName": "Term 2",
        "startDate": "2025-07-01",
        "endDate": "2025-10-31",
        "percentageAmount": 30,
        "dueDate": "2025-10-15"
      },
      {
        "termName": "Term 3",
        "startDate": "2025-11-01",
        "endDate": "2026-03-31",
        "percentageAmount": 20,
        "dueDate": "2026-03-15"
      }
    ]
  }' \
  http://localhost:3000/api/fees/installments
```

### 4. Record Payment
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "feeRecordId": "record_123",
    "amount": 2150,
    "paymentMode": "BANK_TRANSFER",
    "transactionId": "TXN-2026-001"
  }' \
  http://localhost:3000/api/fees/payments
```

### 5. Generate Receipt
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentRecordId": "record_123"
  }' \
  http://localhost:3000/api/fees/receipts/generate
```

### 6. Get Payment Reminders
```bash
curl -X GET \
  -H "Authorization: Bearer {token}" \
  'http://localhost:3000/api/fees/payments/reminders/due?daysBefore=3'
```

---

## Response Format

### Success Response (200/201)
```json
{
  "id": "resource_id",
  "name": "Resource Name",
  "data": {},
  "timestamp": "2026-03-19T10:00:00Z"
}
```

### Error Response (4xx/5xx)
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequestException"
}
```

---

## Fee Calculation Examples

### Example 1: Total Fee Calculation
```
Component 1: Tuition Fee = 3000
Component 2: Lab Fee = 500
Component 3: Transport Fee = 800

Total Fee = 3000 + 500 + 800 = 4300
```

### Example 2: Installment Amount Calculation
```
Total Fee: 4300
Term 1: 50% → 4300 × 50 / 100 = 2150
Term 2: 30% → 4300 × 30 / 100 = 1290
Term 3: 20% → 4300 × 20 / 100 = 860

Total: 2150 + 1290 + 860 = 4300 ✅
```

### Example 3: Payment Status Logic
```
Total Amount: 4300
Amount Paid: 2150

Remaining Balance: 4300 - 2150 = 2150
Status: PARTIAL (some payment made)

After 2nd Payment of 1290:
New Paid Amount: 2150 + 1290 = 3440
Remaining Balance: 860
Status: PARTIAL

After 3rd Payment of 860:
New Paid Amount: 3440 + 860 = 4300
Remaining Balance: 0
Status: PAID ✅
```

---

## Query Parameters

### List Endpoints Support Filtering

```bash
# Filter by Academic Year
GET /courses?academicYear=2025-2026

# Get Due Reminders (days before due date)
GET /payments/reminders/due?daysBefore=7

# Send Receipt via SMS instead of EMAIL
POST /receipts/{number}/send?method=SMS
```

---

## Payment Modes

```
CASH              - Cash payment
CHEQUE            - Cheque payment
BANK_TRANSFER     - Bank transfer
DEBIT_CARD        - Debit card
CREDIT_CARD       - Credit card
UPI               - UPI payment
```

---

## Fee Status

```
PENDING   - No payment made yet
PARTIAL   - Some payment made
PAID      - Full payment completed
OVERDUE   - Payment past due date
CANCELLED - Fee record cancelled
```

---

## Complete Workflow

### Step 1: Create Course
```bash
POST /courses
→ Returns: course_123
```

### Step 2: Create Fee Structure
```bash
POST /structures
{
  "classSection": "A",
  "components": [...]
}
→ Returns: structure_123
```

### Step 3: Create Installment Plan
```bash
POST /installments
{
  "feeStructureId": "structure_123",
  "terms": [...]
}
```

### Step 4: Generate Fee Records
```bash
POST /installments/structure_123/generate-records
→ Creates 105 records (35 students × 3 terms)
```

### Step 5: Record Payment
```bash
POST /payments
{
  "feeRecordId": "record_123",
  "amount": 2150,
  "paymentMode": "BANK_TRANSFER"
}
→ Returns: Status PAID/PARTIAL
```

### Step 6: Generate Receipt
```bash
POST /receipts/generate
{
  "paymentRecordId": "record_123"
}
→ Returns: RCP-2026-03-001234.pdf
```

---

## Error Codes Reference

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Data already exists |
| 500 | Server Error | Internal error |

---

## Validation Rules

### Course Creation
- ✅ Name required (min 3 chars)
- ✅ Section required
- ✅ Academic year required (YYYY-YYYY format)
- ✅ Capacity required (> 0)
- ✅ No duplicate (name + section + year)

### Fee Structure Creation
- ✅ Name required
- ✅ At least one component
- ✅ No duplicate component names
- ✅ Component amount > 0

### Installment Creation
- ✅ Percentage sum = 100%
- ✅ No overlapping dates
- ✅ Start date < End date

### Payment Recording
- ✅ Amount > 0
- ✅ Amount ≤ remaining balance
- ✅ Fee record must exist
- ✅ Payment mode required

---

## Common Integration Scenarios

### Scenario 1: Auto-Assign Fees on Admission
```typescript
// When student admitted to Class 10
const feeStructure = await feeStructureService.getFeeStructureByClass(
  tenantId, schoolId, "A", "2025-2026"
);
// Fee automatically assigned
```

### Scenario 2: Send Reminders to Parents
```bash
GET /payments/reminders/due?daysBefore=3

# For each reminder:
# 1. Get parent email/phone
# 2. Send SMS/Email with due details
# 3. Log in Communication table
```

### Scenario 3: Generate Monthly Collection Report
```bash
GET /payments/stats/overview

# Extract:
# - Total collected
# - Total due
# - Collection %
# - By payment mode
# - By month
```

---

## Performance Tips

1. **Bulk Operations**: Use bulk-generate for receipts
2. **Query Optimization**: Filter by academicYear when listing
3. **Pagination**: Use limit/offset for large datasets
4. **Caching**: Cache fee structures by academicYear
5. **Async**: All operations are non-blocking (async/await)

---

## Debugging

### Enable Logging
```bash
# Set debug environment
DEBUG=fees:* npm run start
```

### Check Status
```bash
# Get fee record status
GET /payments/{feeRecordId}

# Check payment history
GET /payments/student/{studentId}
```

### Verify Data
```bash
# Check course created
GET /courses/{courseId}

# Check structure created
GET /structures/{structureId}

# Check installment created
GET /installments/{feeStructureId}
```

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Percentages must sum to 100%" | Verify all term percentages add up to 100 |
| "Cannot update active structure" | Delete installments or fee records first |
| "Fee record not found" | Run generate-records endpoint first |
| "No permission" | Check user role (must be ADMIN or ACCOUNTS_TEAM) |
| "Invalid amount" | Verify amount ≤ remaining balance |

---

## File Locations

```
Service Files:
- course.service.ts           → /src/modules/fees/services/
- feeStructure.service.ts     → /src/modules/fees/services/
- installment.service.ts      → /src/modules/fees/services/
- payment.service.ts          → /src/modules/fees/services/
- receipt.service.ts          → /src/modules/fees/services/

Controller:
- fees.controller.ts          → /src/modules/fees/controllers/

DTOs:
- fees.dto.ts                 → /src/modules/fees/dtos/

Module:
- fees.module.ts              → /src/modules/fees/

Documentation:
- FEES_API_DOCUMENTATION.md   → /src/modules/fees/
- README.md                   → /src/modules/fees/
```

---

## Support

For detailed API documentation: See `FEES_API_DOCUMENTATION.md`  
For implementation details: See `README.md`  
For code examples: See `IMPLEMENTATION_SUMMARY.md`
