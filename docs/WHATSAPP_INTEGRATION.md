# WhatsApp Business API Integration Guide

## Overview

This School ERP system includes comprehensive WhatsApp Business API integration for sending automated messages to parents and students. Features include:

- **Message Templates**: Pre-approved templates for various use cases
- **Asynchronous Processing**: Messages are sent asynchronously with retry logic
- **Message Logging**: All messages are logged for compliance and tracking
- **Delivery Status Tracking**: Real-time webhook updates from WhatsApp
- **Bulk Messaging**: Send announcements to multiple recipients
- **Automatic Retries**: Failed messages are automatically retried up to 3 times

## Setup Instructions

### 1. Create WhatsApp Business Account

1. Go to [WhatsApp Business Platform](https://www.whatsapp.com/business/)
2. Create a Meta Business Account (if you don't have one)
3. Add WhatsApp as a connected app
4. Create a Business Phone Number (or use an existing one)
5. Get your Business Account ID and Phone Number ID from Meta App Dashboard

### 2. Environment Configuration

Add the following environment variables to your `.env` file:

```env
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_VERSION=v18.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here
```

### 3. Create Message Templates in Meta

Message templates must be created and approved in Meta's WhatsApp Business Account before they can be used.

#### Required Templates

Create the following templates in your WhatsApp Business Account:

**1. Enquiry Acknowledgement**
```
Template Name: enquiry_acknowledgement
Language: English (US)
Message:
Dear {{1}}, Thank you for your interest in {{2}}. Our counselor {{3}} will contact you soon at {{4}}.
```

**2. Admission Confirmation**
```
Template Name: admission_confirmation
Language: English (US)
Message:
Dear Parent, {{1}} has been successfully admitted to {{2}}. Please report on {{4}}. Additional info: {{3}}
```

**3. Fee Receipt**
```
Template Name: fee_receipt
Language: English (US)
Message:
Dear Parent, Fee of ₹{{2}} for {{3}} has been received. Reference: {{4}}. Receipt: {{5}}
```

**4. Fee Due Reminder**
```
Template Name: fee_due_reminder
Language: English (US)
Message:
Reminder: Fee of ₹{{2}} for {{1}} is due on {{3}}. Pay now at {{4}}
```

**5. Fee Overdue Notice**
```
Template Name: fee_overdue_notice
Language: English (US)
Message:
Your fee of ₹{{2}} is {{3}} days overdue. Kindly pay immediately at {{4}}
```

**6. Partial Payment Received**
```
Template Name: partial_payment_received
Language: English (US)
Message:
Dear Parent, Partial payment of ₹{{2}} received. Remaining ₹{{3}} is due on {{4}}.
```

**7. School Announcement**
```
Template Name: school_announcement
Language: English (US)
Message:
📢 {{1}} - Details: {{2}}
```

**8. Holiday Notification**
```
Template Name: holiday_notification
Language: English (US)
Message:
School will remain closed from {{2}} to {{3}} for {{1}}. Classes resume on {{4}}.
```

**9. Event Invitation**
```
Template Name: event_invitation
Language: English (US)
Message:
You are invited to {{1}} on {{2}} at {{3}} at {{4}}. RSVP: {{5}}
```

**10. Exam Schedule**
```
Template Name: exam_schedule
Language: English (US)
Message:
📋 {{1}} will be conducted from {{2}} to {{3}}. Schedule: {{4}}
```

### 4. Setup Webhook for Status Updates

1. In your Meta App Dashboard, go to WhatsApp settings
2. Add Webhook URL: `https://yourdomain.com/api/communication/whatsapp/webhook`
3. Verify Token: Use the value from `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
4. Subscribe to messages and message_status_update_statuses events

## API Endpoints

### Send Messages

#### Send Template Message
```http
POST /communication/whatsapp/send-template?schoolId=xyz
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "recipientPhone": "+919876543210",
  "templateName": "enquiry_acknowledgement",
  "templateVariables": ["Parent Name", "School Name", "Counselor", "Phone"],
  "admissionId": "admission_123"
}
```

#### Send Text Message
```http
POST /communication/whatsapp/send-text?schoolId=xyz
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "recipientPhone": "+919876543210",
  "message": "Your custom message here",
  "studentId": "student_123"
}
```

### Use Case Endpoints

#### Send Enquiry Acknowledgement
```http
POST /communication/whatsapp/send-enquiry-acknowledgement?schoolId=xyz
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "admissionId": "admission_123",
  "parentName": "John Doe",
  "parentPhone": "+919876543210",
  "schoolName": "ABC School",
  "counsellorName": "Jane Smith",
  "counsellorPhone": "+919876543211"
}
```

#### Send Admission Confirmation
```http
POST /communication/whatsapp/send-admission-confirmation?schoolId=xyz
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "admissionId": "admission_123",
  "parentPhone": "+919876543210",
  "studentName": "John Smith",
  "className": "Class X-A",
  "reportingDate": "2024-04-01"
}
```

#### Send Fee Receipt
```http
POST /communication/whatsapp/send-fee-receipt?schoolId=xyz
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "studentId": "student_123",
  "parentPhone": "+919876543210",
  "studentName": "John Smith",
  "amount": "5000",
  "month": "January 2024",
  "transactionId": "TXN123456"
}
```

#### Send Fee Due Reminder
```http
POST /communication/whatsapp/send-fee-reminder?schoolId=xyz
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "studentId": "student_123",
  "parentPhone": "+919876543210",
  "studentName": "John Smith",
  "amount": "5000",
  "dueDate": "2024-04-15",
  "feePortalLink": "https://school.com/pay"
}
```

#### Send School Announcement
```http
POST /communication/whatsapp/send-announcement?schoolId=xyz
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "recipientPhones": [
    "+919876543210",
    "+919876543211",
    "+919876543212"
  ],
  "announcement": "School will be closed on 26th January for Republic Day",
  "detailsLink": "https://school.com/announcements"
}
```

### Message Status Endpoints

#### Get Message Status
```http
GET /communication/whatsapp/status/communication_id
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "id": "communication_123",
  "status": "DELIVERED",
  "externalId": "wamid.xxxxx",
  "sentAt": "2024-01-20T10:30:00Z",
  "deliveredAt": "2024-01-20T10:31:00Z",
  "retryCount": 0
}
```

#### Get Failed Messages
```http
GET /communication/whatsapp/failed-messages?schoolId=xyz
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "total": 5,
  "messages": [
    {
      "id": "communication_123",
      "recipientPhone": "+919876543210",
      "failureReason": "Invalid phone number format",
      "retryCount": 2,
      "createdAt": "2024-01-20T10:00:00Z"
    }
  ]
}
```

### Template Management

#### Get All Templates
```http
GET /communication/whatsapp/templates
Authorization: Bearer <JWT_TOKEN>

Response:
[
  {
    "id": "enquiry_acknowledgement",
    "name": "enquiry_acknowledgement",
    "displayName": "Enquiry Acknowledgement",
    "category": "enquiry",
    "variables": ["parentName", "schoolName", "counsellorName", "counsellorPhone"],
    "description": "Acknowledgement message sent to parents who submit an enquiry"
  }
]
```

#### Get Templates by Category
```http
GET /communication/whatsapp/templates/category/fees
Authorization: Bearer <JWT_TOKEN>
```

#### Get Template Preview
```http
POST /communication/whatsapp/templates/preview
Content-Type: application/json

{
  "templateName": "fee_receipt",
  "variables": {
    "studentName": "John Smith",
    "amount": "5000",
    "month": "January",
    "transactionId": "TXN123",
    "receiptUrl": "https://school.com/receipt"
  }
}

Response:
{
  "templateName": "fee_receipt",
  "preview": "Dear Parent, Fee of ₹5000 for January has been received. Reference: TXN123. Receipt: https://school.com/receipt"
}
```

### Webhook

#### WhatsApp Status Updates
```http
POST /communication/whatsapp/webhook
Content-Type: application/json

{
  "entry": [{
    "changes": [{
      "value": {
        "message_status_update_statuses": [{
          "id": "wamid.xxxxx",
          "status": "delivered",
          "timestamp": "1516856876000"
        }]
      }
    }]
  }]
}
```

#### Health Check
```http
GET /communication/whatsapp/health

Response:
{
  "status": "ok",
  "message": "WhatsApp service is configured correctly"
}
```

## Integration Examples

### Sending Enquiry Acknowledgement After New Enquiry

```typescript
// In your admission module after creating an admission record
import { WhatsAppIntegrationService } from '@modules/communication/services/whatsapp-integration.service';

constructor(private whatsAppIntegration: WhatsAppIntegrationService) {}

async createAdmission(data: CreateAdmissionDto) {
  const admission = await this.admissionService.create(data);
  
  // Send WhatsApp acknowledgement
  await this.whatsAppIntegration.sendEnquiryAcknowledgement(
    tenantId,
    schoolId,
    admission,
    schoolName,
    counsellorName,
    counsellorPhone
  );
  
  return admission;
}
```

### Sending Fee Receipt After Payment

```typescript
// In your fee/payment module after recording a payment
import { WhatsAppIntegrationService } from '@modules/communication/services/whatsapp-integration.service';

constructor(private whatsAppIntegration: WhatsAppIntegrationService) {}

async recordFeePayment(feeRecordId: string, payment: PaymentData) {
  const feeRecord = await this.feeService.recordPayment(feeRecordId, payment);
  const student = await this.studentService.getById(feeRecord.studentId);
  
  // Send WhatsApp receipt
  await this.whatsAppIntegration.sendFeeReceipt(
    tenantId,
    schoolId,
    feeRecord,
    student,
    parentPhone,
    payment.transactionId
  );
  
  return feeRecord;
}
```

### Bulk Announcement

```typescript
// In your announcement/communication module
import { WhatsAppIntegrationService } from '@modules/communication/services/whatsapp-integration.service';

constructor(private whatsAppIntegration: WhatsAppIntegrationService) {}

async broadcastAnnouncement(announcement: string, schoolData: any) {
  const parentPhones = await this.getParentPhones(schoolId);
  
  const result = await this.whatsAppIntegration.sendSchoolAnnouncement(
    tenantId,
    schoolId,
    parentPhones,
    announcement,
    detailsLink
  );
  
  console.log(`Sent to ${result.successCount}, Failed: ${result.failureCount}`);
}
```

## Asynchronous Processing

Messages are processed asynchronously using the following schedule:

1. **Pending Messages** (Every 2 minutes)
   - Queued messages are sent out
   - Failed messages trigger retry logic

2. **Retry Failed Messages** (Every 5 minutes)
   - Failed messages with retry count < 3 are retried
   - Permanent failures are marked after 3 attempts

3. **Cleanup** (Daily at 2 AM)
   - Old delivered messages (> 30 days) are archived

4. **Daily Report** (Daily at 6 AM)
   - Daily messaging statistics are generated

5. **Failure Rate Check** (Every 30 minutes)
   - High failure rates (> 10%) trigger alerts

## Phone Number Format

All phone numbers should be in the following formats:
- With country code: `919876543210` (India example, no + sign for API)
- With + sign: `+919876543210` (User input format)
- With spaces/dashes: `+91 98765 43210` (Automatically cleaned)

The system automatically converts to E.164 format (91XXXXXXXXXX for India).

## Troubleshooting

### "Message not sent" error

**Cause**: Invalid phone number or template not approved

**Solution**:
1. Verify phone number format (must be valid 10-digit with country code)
2. Check that template is approved in Meta Business Account
3. Ensure template variables match exactly

### "Webhook verification failed"

**Cause**: Webhook token mismatch

**Solution**:
1. Verify `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches in Meta settings
2. Ensure webhook URL is publicly accessible

### "High failure rate detected"

**Cause**: Multiple message delivery failures

**Solution**:
1. Check WhatsApp Business Account status
2. Verify access token is valid and not expired
3. Check phone numbers are valid
4. Review failed message logs for specific errors

## Monitoring

Check message statistics and failed messages:

```bash
# Get communication statistics
curl -X GET "http://localhost:3000/communication/whatsapp/failed-messages?schoolId=xyz" \
  -H "Authorization: Bearer <TOKEN>"

# Check health
curl -X GET "http://localhost:3000/communication/whatsapp/health"
```

## Best Practices

1. **Always use approved templates** for marketing/transactional messages
2. **Test with small batches** before sending to all parents
3. **Implement exponential backoff** for retries (handled automatically)
4. **Monitor delivery rates** regularly through the dashboard
5. **Keep templates** simple and localized for your region
6. **Update parent phone numbers** whenever they change
7. **Archive old messages** for compliance (automated daily)
8. **Set up alerts** for high failure rates
9. **Log all messages** for audit trails (automatic)
10. **Test webhook** functionality after setup

## Support

For issues or questions:
1. Check WhatsApp Business Account dashboard for message status
2. Review application logs in `/logs/whatsapp.log`
3. Verify all environment variables are set correctly
4. Contact Meta WhatsApp Business API support for API-related issues
