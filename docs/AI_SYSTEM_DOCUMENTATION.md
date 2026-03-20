# School Management Platform - AI System Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Components](#core-components)
4. [API Endpoints](#api-endpoints)
5. [Integration Guide](#integration-guide)
6. [Configuration](#configuration)
7. [Usage Examples](#usage-examples)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

The School Management Platform includes an advanced AI system that provides intelligent insights for admission management and fee collection. The system consists of:

- **Python FastAPI Microservice**: Core AI engine with machine learning models
- **NestJS Integration Layer**: Seamless integration with the main backend
- **TypeScript Client Service**: Easy-to-use API client for backend services

### Key Capabilities

- **Admission Probability Scoring**: Predict likelihood of enquiry-to-admission conversion
- **Fee Default Prediction**: Identify students at risk of fee payment default
- **Automated Follow-up Suggestions**: Smart follow-up actions based on status
- **Smart Message Generation**: Personalized, contextually appropriate communications
- **Scenario Analysis**: What-if analysis for various situations

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      NestJS Backend                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Admission | Fees | Communication Modules          │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │   AdmissionAiService | FeeAiService |               │   │
│  │   CommunicationAiService                             │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │         AiClientService (HTTP Client)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ (HTTP)
┌─────────────────────────────────────────────────────────────┐
│                  Python FastAPI Service                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Scoring Router | Default Predictor | Followup       │   │
│  │  Message Generator Routes                            │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  AdmissionScoringEngine | FeeDefaultPredictionModel  │   │
│  │  FollowUpSuggestionEngine | MessageGenerationEngine  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Admission Scoring Engine

**Purpose**: Calculates probability of admission enquiry converting to final admission

**Input Factors**:
- Days since enquiry (recency)
- Communication frequency
- Student test/performance scores
- Parent engagement level
- Enquiry status (INQUIRY → APPLIED → SHORTLISTED → ADMITTED)

**Output**:
- Conversion probability (0-1)
- Risk level (very_high, high, medium, low, very_low)
- Key factors affecting score
- Personalized recommendations
- Next suggested action

**API Endpoints**:
```
POST /api/ai/scoring/score
POST /api/ai/scoring/score-and-rank
POST /api/ai/scoring/compare-scores
POST /api/ai/scoring/what-if-analysis
```

### 2. Fee Default Prediction Model

**Purpose**: Predicts likelihood of student defaulting on fee payment

**Input Factors**:
- Days overdue
- Outstanding amount
- Payment history
- Parent communication score
- Financial capacity indicators
- Previous defaults

**Output**:
- Default probability (0-1)
- Risk level (critical, high, medium, low, very_low)
- Collection difficulty assessment
- Recommended collection strategy
- Success probability

**API Endpoints**:
```
POST /api/ai/fees/predict-default-risk
POST /api/ai/fees/assess-batch-risk
POST /api/ai/fees/collection-strategy
POST /api/ai/fees/risk-comparison
POST /api/ai/fees/simulate-payment-scenario
```

### 3. Follow-up Suggestion Engine

**Purpose**: Recommends optimal follow-up actions at each stage

**For Admissions**: 
- Initial inquiry response
- Application confirmation
- Test scheduling
- Shortlist notification
- Admission offer

**For Fees**:
- Friendly reminders
- Urgent notices
- Overdue demands
- Critical notices

**Output**:
- Suggested actions with descriptions
- Primary action to take
- Optimal contact time
- Preferred communication channels
- Expected outcomes

**API Endpoints**:
```
POST /api/ai/followup/admission
POST /api/ai/followup/fees
POST /api/ai/followup/batch-admission-suggestions
POST /api/ai/followup/batch-fee-suggestions
```

### 4. Smart Message Generation Engine

**Purpose**: Generates personalized, contextually appropriate messages

**Capabilities**:
- Tone adjustment (professional, friendly)
- Channel-specific formatting (email, SMS, WhatsApp, phone)
- Personalization with names and context
- A/B testing variants
- Batch generation

**Message Types Available**:

*Enquiry Messages*:
- inquiry_initial
- inquiry_followup
- test_schedule
- shortlist_notification
- admission_offer
- admission_confirmation

*Fee Messages*:
- fee_reminder
- fee_urgent
- fee_overdue
- fee_critical
- scholarship_offer
- payment_received

**API Endpoints**:
```
POST /api/ai/messages/generate-enquiry-message
POST /api/ai/messages/generate-enquiry-message-variants
POST /api/ai/messages/generate-fee-message
POST /api/ai/messages/batch-generate-enquiry-messages
POST /api/ai/messages/batch-generate-fee-messages
GET /api/ai/messages/available-templates
```

---

## API Endpoints

### Base URL
```
http://localhost:8000/api/ai
```

### Authentication
Currently, the AI service runs on a trusted network. For production, implement JWT or API key authentication.

### Common Response Format

**Success Response**:
```json
{
  "enquiry_id": "ENQ_001",
  "probability_score": 0.75,
  "risk_level": "medium",
  "recommendations": ["Action 1", "Action 2"],
  "status": "success"
}
```

**Error Response**:
```json
{
  "error": "Error message",
  "status": "error",
  "timestamp": "2024-03-19T10:30:00Z"
}
```

### Detailed Endpoint Documentation

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed endpoint specifications.

---

## Integration Guide

### 1. Setup AI Module in NestJS

**Step 1: Add to module imports**
```typescript
// app.module.ts
import { AiModule } from './common/ai.module';

@Module({
  imports: [
    // ... other imports
    AiModule,
  ],
})
export class AppModule {}
```

**Step 2: Inject in services**
```typescript
import { AiClientService } from './common/services/ai-client.service';

@Injectable()
export class MyService {
  constructor(private aiClient: AiClientService) {}

  async scoreEnquiry(data: any) {
    return await this.aiClient.scoreAdmissionEnquiry(data);
  }
}
```

### 2. Use AI Integration Services

**For Admission Operations**:
```typescript
import { AdmissionAiService } from './modules/admission/services/admission-ai.service';

@Injectable()
export class EnquiryService {
  constructor(private admissionAi: AdmissionAiService) {}

  async getEnquiryAnalysis(enquiry: any) {
    return await this.admissionAi.analyzeEnquiry(enquiry);
  }
}
```

**For Fee Operations**:
```typescript
import { FeeAiService } from './modules/fees/services/fee-ai.service';

@Injectable()
export class FeeCollectionService {
  constructor(private feeAi: FeeAiService) {}

  async analyzeStudentRisk(student: any) {
    return await this.feeAi.analyzeFeeRisk(student);
  }
}
```

**For Communications**:
```typescript
import { CommunicationAiService } from './modules/communication/services/communication-ai.service';

@Injectable()
export class CommunicationService {
  constructor(private commAi: CommunicationAiService) {}

  async generateMessage(data: any) {
    return await this.commAi.generateEnquiryMessage(
      data,
      'inquiry_followup',
      'email'
    );
  }
}
```

---

## Configuration

### Environment Variables

```env
# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000/api/ai
AI_SERVICE_TIMEOUT=30000

# Python Service Configuration
PYTHON_SERVICE_HOST=localhost
PYTHON_SERVICE_PORT=8000
```

### Configuration Service Setup

```typescript
// config/ai.config.ts
export const aiConfig = {
  serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000/api/ai',
  timeout: parseInt(process.env.AI_SERVICE_TIMEOUT) || 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};
```

---

## Usage Examples

### Example 1: Score an Admission Enquiry

```typescript
// In your controller or service
const enquiryData = {
  enquiry_id: 'ENQ_001',
  status: 'APPLIED',
  days_since_enquiry: 15,
  days_since_last_contact: 5,
  communication_count: 3,
  parent_type: 'engaged',
  conversion_probability: 0.7,
  student_test_score: 85,
};

const score = await this.aiClient.scoreAdmissionEnquiry(enquiryData);
console.log(`Conversion probability: ${score.conversion_probability}`);
console.log(`Risk level: ${score.risk_level}`);
console.log(`Recommendations: ${score.recommendations.join(', ')}`);
```

### Example 2: Get Follow-up Actions for Enquiry

```typescript
const followup = await this.admissionAi.getNextAction(enquiryData);

// Use the suggested action
if (followup.urgency === 'critical') {
  // Escalate immediately
  await this.notificationService.sendUrgent(
    followup.primary_action,
    followup.contact_details
  );
}
```

### Example 3: Analyze Fee Default Risk

```typescript
const studentData = {
  student_id: 'STU_001',
  days_overdue: 20,
  outstanding_amount: 15000,
  default_risk_probability: 0.6,
  parent_communication_score: 0.7,
};

const riskAnalysis = await this.feeAi.analyzeFeeRisk(studentData);

if (riskAnalysis.risk_assessment.level === 'critical') {
  // Get collection strategy
  const strategy = riskAnalysis.collection_strategy;
  // Apply strategy: phone + email, offer installment plan
}
```

### Example 4: Generate Personalized Message

```typescript
const enquiry = { /* enquiry data */ };

const message = await this.commAi.generateEnquiryMessage(
  enquiry,
  'inquiry_followup',
  'email'
);

// Send email
await this.emailService.send({
  to: enquiry.parent_email,
  subject: message.message.subject,
  body: message.message.body,
});
```

### Example 5: Batch Operations - Score 100 Enquiries

```typescript
const enquiries = await this.enquiryRepository.find({
  status: In(['INQUIRY', 'APPLIED'])
});

// Get prioritized list scored by AI
const ranked = await this.admissionAi.analyzeMultipleEnquiries(enquiries);

// Focus on high-probability enquiries first
ranked.ranked_with_followup.forEach(item => {
  if (item.probability > 0.7) {
    console.log(`Priority action for ${item.enquiry_id}: ${item.next_action}`);
  }
});
```

### Example 6: What-if Scenario Analysis

```typescript
const scenarios = await this.admissionAi.scenarioAnalysis(enquiryData);

// Show impact of different actions
scenarios.scenarios.forEach(s => {
  console.log(`${s.scenario}: +${s.improvement_percentage}% improvement`);
});

// Recommend highest-impact action
console.log(`Recommended: ${scenarios.recommended_action}`);
```

---

## Deployment

### 1. Python AI Service Deployment

**With Docker**:
```bash
cd ai-service
docker build -t smp-ai-service:latest .
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  smp-ai-service:latest
```

**With uvicorn**:
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. NestJS Backend Integration

**Step 1: Ensure Python service is running**
```bash
# Check health
curl http://localhost:8000/api/ai/scoring/sample-scoring
```

**Step 2: Set environment variables**
```bash
export AI_SERVICE_URL=http://ai-service:8000/api/ai
export AI_SERVICE_TIMEOUT=30000
```

**Step 3: Start NestJS application**
```bash
npm install @nestjs/axios
npm run start
```

### 3. Docker Compose Setup

```yaml
version: '3.8'
services:
  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/smp
      - PYTHONUNBUFFERED=1

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - ai-service
    environment:
      - AI_SERVICE_URL=http://ai-service:8000/api/ai

  db:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=smp
```

---

## Troubleshooting

### Issue 1: "AI service unreachable"

**Symptoms**:
- Error: "Failed to score admission enquiry"
- HTTP connection timeout

**Solutions**:
1. Check if Python service is running: `curl http://localhost:8000/api/ai/scoring/sample-scoring`
2. Verify `AI_SERVICE_URL` environment variable
3. Check network connectivity between services
4. Review service logs: `docker logs smp-ai-service`

### Issue 2: "Import module not found"

**Symptoms**:
- ModuleNotFoundError in Python service

**Solutions**:
1. Ensure all dependencies installed: `pip install -r requirements.txt`
2. Check Python version (3.9+)
3. Verify virtual environment activated

### Issue 3: "Timeout on batch operations"

**Symptoms**:
- Requests timing out when processing large batches (500+ items)

**Solutions**:
1. Increase `AI_SERVICE_TIMEOUT` to 60000ms
2. Split large batches into smaller chunks (<100)
3. Use queue system for batch processing

### Issue 4: "Memory issues with large predictions"

**Symptoms**:
- Service crashes when scoring thousands of records

**Solutions**:
1. Implement pagination/streaming
2. Add more memory to container
3. Process in background jobs using queue system

---

## Best Practices

### 1. Always Handle Errors Gracefully

```typescript
try {
  const score = await this.aiClient.scoreAdmissionEnquiry(data);
  // Use score
} catch (error) {
  this.logger.error(`AI service error: ${error.message}`);
  // Fallback to default behavior
  return { probability: 0.5, risk_level: 'medium' };
}
```

### 2. Cache Frequent Requests

```typescript
private cache = new Map();

async scoreEnquiry(enquiryId: string) {
  const cached = this.cache.get(enquiryId);
  if (cached && this._isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  const score = await this.aiClient.scoreAdmissionEnquiry(...);
  this.cache.set(enquiryId, { data: score, timestamp: Date.now() });
  return score;
}
```

### 3. Use Batch Operations for Multiple Records

```typescript
// ❌ Don't do this - N+1 problem
const enquiries = [...]; // 500 items
for (const e of enquiries) {
  const score = await this.aiClient.scoreAdmissionEnquiry(e);
}

// ✅ Do this - Batch operation
const scores = await this.aiClient.rankAdmissionEnquiries(enquiries);
```

### 4. Implement Retry Logic for Critical Operations

```typescript
async function retryWithBackoff(fn: Function, maxAttempts = 3) {
  let lastError;
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxAttempts) {
        await sleep(Math.pow(2, i) * 1000); // Exponential backoff
      }
    }
  }
  throw lastError;
}
```

### 5. Log AI Decisions for Audit Trail

```typescript
async scoreAndLog(enquiry: any) {
  const score = await this.aiClient.scoreAdmissionEnquiry(enquiry);
  
  await this.auditLog.record({
    action: 'ADMISSION_SCORED',
    enquiry_id: enquiry.enquiry_id,
    score: score.conversion_probability,
    timestamp: new Date(),
    user_id: this.getCurrentUser().id,
  });
  
  return score;
}
```

### 6. Monitor AI Service Health

```typescript
// In your health check endpoint
async healthCheck() {
  const isAiServiceHealthy = await this.aiClient.healthCheck();
  
  return {
    status: isAiServiceHealthy ? 'healthy' : 'degraded',
    services: {
      database: await this.dbHealthCheck(),
      aiService: isAiServiceHealthy,
      cache: await this.cacheHealthCheck(),
    },
  };
}
```

---

## Support & Resources

- **API Documentation**: See API Reference in this documentation
- **Configuration**: Check `.env.example` for all available settings
- **Examples**: See `examples/` folder for complete working examples
- **Logs**: Check service logs for debugging: `docker logs smp-ai-service`

## Version History

- **v1.0.0** (2024-03): Initial release
  - Admission probability scoring
  - Fee default prediction
  - Follow-up suggestions
  - Message generation

---

**Last Updated**: March 19, 2024
**Maintained By**: SMP Development Team
