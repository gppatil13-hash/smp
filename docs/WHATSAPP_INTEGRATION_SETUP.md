# WhatsApp Integration - Setup Checklist

## Pre-Setup Requirements
- [ ] Meta/Facebook Business Account created
- [ ] WhatsApp Business Account created
- [ ] Business Phone Number created in WhatsApp
- [ ] Read Meta's WhatsApp Business API documentation

## Phase 1: Create Credentials
- [ ] Get WhatsApp Access Token from Meta App Dashboard
- [ ] Get Business Account ID
- [ ] Get Phone Number ID
- [ ] Create Webhook Verification Token (any random string)
- [ ] Note down all credentials securely

## Phase 2: Configuration
- [ ] Copy `.env.example.whatsapp` to `.env` (or merge settings)
- [ ] Add `WHATSAPP_ACCESS_TOKEN` to `.env`
- [ ] Add `WHATSAPP_BUSINESS_ACCOUNT_ID` to `.env`
- [ ] Add `WHATSAPP_PHONE_NUMBER_ID` to `.env`
- [ ] Add `WHATSAPP_WEBHOOK_VERIFY_TOKEN` to `.env`
- [ ] Verify environment variables in `.env`

## Phase 3: Create Templates in Meta
Create the following templates in Meta WhatsApp Manager:

### Enquiry Acknowledgement
```
Name: enquiry_acknowledgement
Category: MARKETING or TRANSACTIONAL
Message: Dear {{1}}, Thank you for your interest in {{2}}. Our counselor {{3}} will contact you soon at {{4}}.
```
- [ ] Created
- [ ] Approved

### Admission Confirmation
```
Name: admission_confirmation
Category: TRANSACTIONAL
Message: Dear Parent, {{1}} has been successfully admitted to {{2}}. Please report on {{4}}. Additional info: {{3}}
```
- [ ] Created
- [ ] Approved

### Fee Receipt
```
Name: fee_receipt
Category: TRANSACTIONAL
Message: Dear Parent, Fee of {{2}} for {{3}} has been received. Reference: {{4}}. Receipt: {{5}}
```
- [ ] Created
- [ ] Approved

### Fee Due Reminder
```
Name: fee_due_reminder
Category: TRANSACTIONAL
Message: Reminder: Fee of {{2}} for {{1}} is due on {{3}}. Pay now at {{4}}
```
- [ ] Created
- [ ] Approved

### Fee Overdue Notice
```
Name: fee_overdue_notice
Category: TRANSACTIONAL
Message: Your fee of {{2}} is {{3}} days overdue. Kindly pay immediately at {{4}}
```
- [ ] Created
- [ ] Approved

### School Announcement
```
Name: school_announcement
Category: MARKETING
Message: 📢 {{1}} - Details: {{2}}
```
- [ ] Created
- [ ] Approved

### Holiday Notification
```
Name: holiday_notification
Category: TRANSACTIONAL
Message: School will remain closed from {{2}} to {{3}} for {{1}}. Classes resume on {{4}}.
```
- [ ] Created
- [ ] Approved

### Event Invitation
```
Name: event_invitation
Category: MARKETING
Message: You are invited to {{1}} on {{2}} at {{3}} at {{4}}. RSVP: {{5}}
```
- [ ] Created
- [ ] Approved

### Exam Schedule
```
Name: exam_schedule
Category: TRANSACTIONAL
Message: 📋 {{1}} will be conducted from {{2}} to {{3}}. Schedule: {{4}}
```
- [ ] Created
- [ ] Approved

## Phase 4: Deploy Changes
- [ ] Install dependencies (if @nestjs/schedule not installed)
- [ ] Run migrations (no DB changes needed)
- [ ] Build backend
- [ ] Start backend service
- [ ] Verify no errors in logs

## Phase 5: Setup Webhook
- [ ] Get your public domain/IP
- [ ] Configure Webhook URL in Meta Dashboard: `https://yourdomain.com/api/communication/whatsapp/webhook`
- [ ] Set Verify Token to match `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- [ ] Subscribe to events: `message_status_update_statuses` and `messages`
- [ ] Test webhook - you should see "200 OK" response

## Phase 6: Testing
- [ ] Test health endpoint: `GET /communication/whatsapp/health`
- [ ] Test template listing: `GET /communication/whatsapp/templates`
- [ ] Send test message via API
- [ ] Verify message delivered
- [ ] Test webhook updates
- [ ] Check message status endpoint

## Phase 7: Integration
- [ ] Add imports to Admission module
- [ ] Add WhatsApp integration calls in admission creation
- [ ] Add WhatsApp integration calls in fee payment recording
- [ ] Add WhatsApp integration calls in announcement broadcast
- [ ] Test end-to-end workflows

## Phase 8: Monitoring
- [ ] Setup logs rotation (optional)
- [ ] Configure alerts for high failure rates
- [ ] Monitor message statistics
- [ ] Review failed messages regularly
- [ ] Test retry mechanism

## Common Issues & Solutions

### Issue: "Invalid phone number format"
**Solution**: Ensure phone numbers include country code (e.g., 919876543210 for India)

### Issue: "Template not approved"
**Solution**: Verify template name matches exactly and template is in APPROVED status in Meta

### Issue: "Unauthorized" error
**Solution**: Verify access token is valid and refresh if needed from Meta Dashboard

### Issue: "Webhook verification failed"
**Solution**: Ensure webhook token matches exactly - check for spaces or extra characters

### Issue: No messages being sent
**Solution**: Check if WHATSAPP_ENABLED is set to true, verify credentials, check logs

### Issue: Messages sent but not delivered
**Solution**: Check phone numbers, verify webhook is receiving updates, review Meta logs

## File Structure
```
backend/src/modules/communication/
├── controllers/
│   ├── communication.controller.ts
│   └── whatsapp.controller.ts (NEW)
├── services/
│   ├── communication.service.ts
│   ├── whatsapp.service.ts (NEW)
│   ├── message-template.service.ts (NEW)
│   ├── whatsapp-integration.service.ts (NEW)
│   └── whatsapp-retry.processor.ts (NEW)
├── dtos/
│   ├── communication.dto.ts
│   └── whatsapp.dto.ts (NEW)
└── communication.module.ts (UPDATED)

docs/
├── WHATSAPP_INTEGRATION.md (NEW)
├── WHATSAPP_INTEGRATION_EXAMPLES.md (NEW)
└── WHATSAPP_INTEGRATION_SETUP.md (NEW - this file)

backend/
└── .env.example.whatsapp (NEW)
```

## API Endpoints Summary

### Core Endpoints
- `POST /communication/whatsapp/send-template` - Send template message
- `POST /communication/whatsapp/send-text` - Send text message
- `POST /communication/whatsapp/queue` - Queue message for later delivery

### Use Case Endpoints
- `POST /communication/whatsapp/send-enquiry-acknowledgement`
- `POST /communication/whatsapp/send-admission-confirmation`
- `POST /communication/whatsapp/send-fee-receipt`
- `POST /communication/whatsapp/send-fee-reminder`
- `POST /communication/whatsapp/send-announcement`

### Status & Management
- `GET /communication/whatsapp/status/:communicationId` - Get message status
- `POST /communication/whatsapp/retry/:communicationId` - Retry failed message
- `GET /communication/whatsapp/failed-messages` - List failed messages
- `GET /communication/whatsapp/health` - Health check

### Templates
- `GET /communication/whatsapp/templates` - List all templates
- `GET /communication/whatsapp/templates/category/:category` - Filter templates
- `POST /communication/whatsapp/templates/preview` - Get template preview

### Webhook
- `POST /communication/whatsapp/webhook` - Receive status updates
- `GET /communication/whatsapp/webhook` - Verify webhook (Meta verification)

## Scheduled Jobs
- Every 2 minutes: Process pending messages
- Every 5 minutes: Retry failed messages
- Every 30 minutes: Check failure rate and alert if > 10%
- Daily at 2 AM: Cleanup old delivered messages
- Daily at 6 AM: Generate daily report

## Database Schema Notes
The existing `Communication` model already supports WhatsApp:
- `type: 'WHATSAPP'` - Message type
- `status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED'` - Message status
- `externalId` - WhatsApp message ID (wamid)
- `retryCount` - Automatic retry counter
- `maxRetries` - Max retry attempts (default 3)
- `failureReason` - Reason for failure (if any)
- `sentAt` - When message was sent
- `deliveredAt` - When message was delivered

## Security Considerations
- [ ] Store access token in secrets manager (not in .env for production)
- [ ] Validate phone numbers before sending
- [ ] Rate limit message sending endpoints
- [ ] Audit log all message sends
- [ ] Encrypt stored phone numbers (optional)
- [ ] Implement RBAC for message sending
- [ ] Validate webhook signature from Meta (optional but recommended)

## Performance Notes
- Messages are sent asynchronously
- Retry logic uses exponential backoff
- Bulk messages process in batches (50 at a time)
- Failed messages are retried automatically
- Old messages are archived after 30 days
- P index on: tenantId, schoolId, type, status

## Next Steps
1. Follow Phase 1-8 of this checklist
2. Test all API endpoints
3. Integrate with admission module
4. Integrate with fees module
5. Monitor and optimize delivery rates
6. Extend with additional templates as needed
