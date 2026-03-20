# NestJS AI Integration Guide

A complete guide for integrating and using the AI system in NestJS backend services.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Module Setup](#module-setup)
3. [Service Integration](#service-integration)
4. [Practical Examples](#practical-examples)
5. [Error Handling](#error-handling)
6. [Testing](#testing)
7. [Performance Optimization](#performance-optimization)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install @nestjs/axios @nestjs/common @nestjs/core
npm install axios rxjs
```

### 2. Import AI Module

In your `app.module.ts`:

```typescript
import { AiModule } from './common/ai.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
    AiModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 3. Use in Your Service

```typescript
import { Injectable } from '@nestjs/common';
import { AiClientService } from './common/services/ai-client.service';

@Injectable()
export class MyService {
  constructor(private aiClient: AiClientService) {}

  async scoreEnquiry(data: any) {
    return await this.aiClient.scoreAdmissionEnquiry(data);
  }
}
```

---

## Module Setup

### Complete AI Module Configuration

Create `common/ai.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiClientService } from './services/ai-client.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [AiClientService],
  exports: [AiClientService],
})
export class AiModule {}
```

### Create Index Export

Create `common/ai/index.ts`:

```typescript
export { AiClientService } from '../services/ai-client.service';
```

### Environment Configuration

Create `.env`:

```env
# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000/api/ai
AI_SERVICE_TIMEOUT=30000
AI_RETRY_ATTEMPTS=3
AI_RETRY_DELAY=1000
```

---

## Service Integration

### 1. AI Client Service

The `AiClientService` is your main entry point. Key methods include:

**Scoring Methods**:
```typescript
// Score single enquiry
scoreAdmissionEnquiry(data: EnquiryData): Promise<ScoringResult>

// Score multiple enquiries
rankAdmissionEnquiries(enquiries: EnquiryData[]): Promise<RankedEnquiriesResult>

// Compare two enquiries
compareEnquiryScores(enquiry1: EnquiryData, enquiry2: EnquiryData): Promise<ComparisonResult>

// Scenario analysis
whatIfAnalysis(data: EnquiryData, scenarios: ScenarioData[]): Promise<ScenarioAnalysisResult>
```

**Fee Methods**:
```typescript
// Predict default risk
predictFeeDefault(data: StudentData): Promise<DefaultRiskResult>

// Assess batch risk
assessBatchDefaultRisk(students: StudentData[]): Promise<BatchRiskResult>

// Get collection strategy
getCollectionStrategy(data: StudentData): Promise<CollectionStrategyResult>

// Compare student risks
compareStudentRisks(student1: StudentData, student2: StudentData): Promise<RiskComparisonResult>

// Simulate payment scenarios
simulatePaymentScenario(data: StudentData, scenarios: PaymentScenario[]): Promise<ScenarioSimulationResult>
```

**Follow-up Methods**:
```typescript
// Get admission follow-up
getAdmissionFollowup(data: EnquiryData): Promise<FollowupResult>

// Get fee follow-up
getFeeFollowup(data: StudentData): Promise<FollowupResult>

// Batch admission follow-up
batchAdmissionFollowup(enquiries: EnquiryData[]): Promise<BatchFollowupResult>

// Batch fee follow-up
batchFeeFollowup(students: StudentData[]): Promise<BatchFollowupResult>
```

**Message Methods**:
```typescript
// Generate enquiry message
generateEnquiryMessage(data: EnquiryData, messageType: string, channel: string): Promise<MessageResult>

// Generate message variants
generateEnquiryMessageVariants(data: EnquiryData, messageType: string): Promise<VariantsResult>

// Generate fee message
generateFeeMessage(data: StudentData, messageType: string, channel: string): Promise<MessageResult>

// Batch generate enquiry messages
batchGenerateEnquiryMessages(enquiries: EnquiryData[], messageType: string): Promise<BatchMessageResult>

// Batch generate fee messages
batchGenerateFeeMessages(students: StudentData[], messageType: string): Promise<BatchMessageResult>

// Get available templates
getAvailableTemplates(): Promise<TemplatesResult>
```

**Health Check Methods**:
```typescript
// Check AI service health
healthCheck(): Promise<boolean>

// Wait for service to be available
waitForService(): Promise<void>
```

### 2. Admission AI Service

For admission workflows, use `AdmissionAiService`:

```typescript
import { Injectable } from '@nestjs/common';
import { AiClientService } from './services/ai-client.service';

@Injectable()
export class AdmissionAiService {
  constructor(private aiClient: AiClientService) {}

  // Comprehensive enquiry analysis
  async analyzeEnquiry(enquiry: EnquiryData) {
    const score = await this.aiClient.scoreAdmissionEnquiry(enquiry);
    const followup = await this.aiClient.getAdmissionFollowup(enquiry);
    
    return {
      enquiry_id: enquiry.enquiry_id,
      probability: score.conversion_probability,
      risk_level: score.risk_level,
      recommendation: score.analysis.recommendation,
      next_action: followup.primary_action,
      action_description: followup.primary_action_description,
      confidence: score.confidence_score,
    };
  }

  // Analyze multiple enquiries
  async analyzeMultipleEnquiries(enquiries: EnquiryData[]) {
    const ranked = await this.aiClient.rankAdmissionEnquiries(enquiries);
    const followups = await this.aiClient.batchAdmissionFollowup(enquiries);
    
    return {
      total: enquiries.length,
      ranked_with_followup: ranked.ranked_enquiries.map(r => ({
        ...r,
        next_action: followups.followup_by_id[r.enquiry_id]?.primary_action,
      })),
      estimated_conversions: ranked.total_estimated_conversions,
    };
  }

  // Scenario analysis
  async scenarioAnalysis(enquiry: EnquiryData, scenarios: ScenarioData[]) {
    return await this.aiClient.whatIfAnalysis(enquiry, scenarios);
  }

  // Get next recommended action
  async getNextAction(enquiry: EnquiryData) {
    const followup = await this.aiClient.getAdmissionFollowup(enquiry);
    return {
      enquiry_id: enquiry.enquiry_id,
      action: followup.primary_action,
      description: followup.primary_action_description,
      urgency: followup.next_actions[0].urgency,
      timeline: followup.estimated_timeline,
      contact_details: {
        optimal_time: followup.optimal_contact_time,
        channels: followup.preferred_contact_channels,
      },
    };
  }

  // Identify at-risk enquiries
  async identifyAtRisk(enquiries: EnquiryData[]) {
    const ranked = await this.aiClient.rankAdmissionEnquiries(enquiries);
    const atRisk = ranked.ranked_enquiries.filter(e => e.conversion_probability < 0.5);
    return {
      total_at_risk: atRisk.length,
      at_risk_enquiries: atRisk,
      risk_percentage: (atRisk.length / enquiries.length) * 100,
    };
  }

  // Conversion funnel analysis
  async conversionFunnelAnalysis(enquiries: EnquiryData[]) {
    const grouped = this._groupByStatus(enquiries);
    const ranked = await this.aiClient.rankAdmissionEnquiries(enquiries);
    
    return {
      inquiry_stage: { count: grouped.INQUIRY.length, avg_probability: this._avgProbability(grouped.INQUIRY) },
      applied_stage: { count: grouped.APPLIED.length, avg_probability: this._avgProbability(grouped.APPLIED) },
      shortlisted_stage: { count: grouped.SHORTLISTED.length, avg_probability: this._avgProbability(grouped.SHORTLISTED) },
      conversion_rate: grouped.ADMITTED.length / enquiries.length,
      estimated_conversions: ranked.total_estimated_conversions,
    };
  }

  private _groupByStatus(enquiries: EnquiryData[]) {
    return enquiries.reduce((acc, e) => {
      if (!acc[e.status]) acc[e.status] = [];
      acc[e.status].push(e);
      return acc;
    }, {} as Record<string, EnquiryData[]>);
  }

  private _avgProbability(enquiries: any[]) {
    if (enquiries.length === 0) return 0;
    return enquiries.reduce((sum, e) => sum + e.conversion_probability, 0) / enquiries.length;
  }
}
```

### 3. Fee AI Service

For fee management workflows:

```typescript
import { Injectable } from '@nestjs/common';
import { AiClientService } from './services/ai-client.service';

@Injectable()
export class FeeAiService {
  constructor(private aiClient: AiClientService) {}

  // Comprehensive fee risk analysis
  async analyzeFeeRisk(student: StudentData) {
    const riskPrediction = await this.aiClient.predictFeeDefault(student);
    const strategy = await this.aiClient.getCollectionStrategy(student);
    const followup = await this.aiClient.getFeeFollowup(student);
    
    return {
      student_id: student.student_id,
      default_probability: riskPrediction.default_probability,
      risk_level: riskPrediction.risk_assessment.level,
      collection_strategy: strategy.strategy,
      next_action: followup.primary_action,
      recovery_estimate: strategy.estimated_recovery_rate,
    };
  }

  // Get prioritized collection list
  async getPriorityCollectionList(students: StudentData[]) {
    const batchRisk = await this.aiClient.assessBatchDefaultRisk(students);
    return {
      total_students: students.length,
      priority_list: batchRisk.students_risk_breakdown,
      total_at_risk: batchRisk.risk_summary,
      financial_impact: batchRisk.financial_summary,
    };
  }

  // Simulate payment scenarios
  async simulatePaymentScenarios(student: StudentData, scenarios: any[]) {
    return await this.aiClient.simulatePaymentScenario(student, scenarios);
  }

  // Compare student risks
  async compareStudentRisks(student1: StudentData, student2: StudentData) {
    return await this.aiClient.compareStudentRisks(student1, student2);
  }

  // Get collection metrics
  async getCollectionMetrics(students: StudentData[]) {
    const batchRisk = await this.aiClient.assessBatchDefaultRisk(students);
    const financial = batchRisk.financial_summary;
    
    return {
      total_outstanding: financial.at_risk_amount,
      total_students: students.length,
      average_outstanding_per_student: financial.at_risk_amount / students.length,
      expected_recovery: financial.estimated_recovery,
      expected_loss: financial.potential_loss,
      recovery_rate_percentage: (financial.recovery_rate * 100).toFixed(2),
      critical_count: batchRisk.risk_summary.critical_risk,
      high_count: batchRisk.risk_summary.high_risk,
    };
  }

  // Get critical risk students
  async getCriticalRiskStudents(students: StudentData[]) {
    const batchRisk = await this.aiClient.assessBatchDefaultRisk(students);
    const critical = batchRisk.students_risk_breakdown.filter(s => s.risk_level === 'critical');
    
    return {
      total_critical: critical.length,
      critical_students: critical,
      total_critical_amount: critical.reduce((sum, s) => sum + s.outstanding, 0),
      immediate_actions_needed: critical.length,
    };
  }
}
```

### 4. Communication AI Service

For message generation workflows:

```typescript
import { Injectable } from '@nestjs/common';
import { AiClientService } from './services/ai-client.service';

@Injectable()
export class CommunicationAiService {
  constructor(private aiClient: AiClientService) {}

  // Generate single message
  async generateEnquiryMessage(
    enquiry: EnquiryData,
    messageType: string,
    channel: string
  ) {
    return await this.aiClient.generateEnquiryMessage(enquiry, messageType, channel);
  }

  // Generate message variants
  async generateEnquiryMessageVariants(
    enquiry: EnquiryData,
    messageType: string
  ) {
    const variants = await this.aiClient.generateEnquiryMessageVariants(enquiry, messageType);
    return {
      enquiry_id: enquiry.enquiry_id,
      variants: variants.variants,
      recommended: variants.recommended_variant,
      reason: variants.recommendation_reason,
    };
  }

  // Generate fee message
  async generateFeeMessage(
    student: StudentData,
    messageType: string,
    channel: string
  ) {
    return await this.aiClient.generateFeeMessage(student, messageType, channel);
  }

  // Batch generate enquiry messages
  async batchGenerateEnquiryMessages(
    enquiries: EnquiryData[],
    messageType: string
  ) {
    return await this.aiClient.batchGenerateEnquiryMessages(enquiries, messageType);
  }

  // Batch generate fee messages
  async batchGenerateFeeMessages(
    students: StudentData[],
    messageType: string
  ) {
    return await this.aiClient.batchGenerateFeeMessages(students, messageType);
  }

  // Get available templates
  async getAvailableTemplates() {
    return await this.aiClient.getAvailableTemplates();
  }

  // Create message campaign
  async createMessageCampaign(
    recipients: any[],
    messageType: string,
    channel: string,
    scheduledFor?: Date
  ) {
    const messages = await this.aiClient.batchGenerateEnquiryMessages(recipients, messageType);
    
    return {
      campaign_id: this._generateId(),
      message_type: messageType,
      channel,
      total_recipients: recipients.length,
      scheduled_for: scheduledFor,
      messages: messages,
      status: 'ready_to_send',
    };
  }

  private _generateId(): string {
    return `CAMP_${Date.now()}`;
  }
}
```

---

## Practical Examples

### Example 1: Complete Admission Workflow

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AdmissionAiService } from './services/admission-ai.service';
import { EnquiryService } from './services/enquiry.service';

@Controller('admission')
export class AdmissionController {
  constructor(
    private admissionAi: AdmissionAiService,
    private enquiryService: EnquiryService,
  ) {}

  @Post('analyze-enquiries')
  async analyzeEnquiries(@Body() enquiryIds: string[]) {
    // Fetch enquiries from database
    const enquiries = await this.enquiryService.findByIds(enquiryIds);

    // Analyze with AI
    const analysis = await this.admissionAi.analyzeMultipleEnquiries(enquiries);

    // Update database with recommendations
    for (const analysisItem of analysis.ranked_with_followup) {
      await this.enquiryService.updateRecommendation(analysisItem.enquiry_id, {
        ai_probability: analysisItem.conversion_probability,
        ai_recommendation: analysisItem.next_action,
        ai_confidence: analysisItem.confidence_score,
        analyzed_at: new Date(),
      });
    }

    return {
      success: true,
      total_analyzed: analysis.total,
      estimated_conversions: analysis.estimated_conversions,
      top_actions: analysis.ranked_with_followup.slice(0, 5),
    };
  }

  @Post('scenario-analysis')
  async scenarioAnalysis(@Body() { enquiry_id, scenarios }: any) {
    const enquiry = await this.enquiryService.findById(enquiry_id);
    const analysis = await this.admissionAi.scenarioAnalysis(enquiry, scenarios);

    return {
      enquiry_id,
      current_probability: analysis.current_probability,
      recommended_action: analysis.recommended_action,
      scenarios: analysis.scenarios_analysis,
    };
  }
}
```

### Example 2: Smart Fee Collection

```typescript
import { Controller, Post, Get } from '@nestjs/common';
import { FeeAiService } from './services/fee-ai.service';
import { StudentService } from './services/student.service';

@Controller('fees')
export class FeeController {
  constructor(
    private feeAi: FeeAiService,
    private studentService: StudentService,
  ) {}

  @Get('collection-priority')
  async getCollectionPriority() {
    // Get overdue students
    const overdueStudents = await this.studentService.findOverdue();

    // Get priority list
    const priorityList = await this.feeAi.getPriorityCollectionList(overdueStudents);

    // Get collection metrics
    const metrics = await this.feeAi.getCollectionMetrics(overdueStudents);

    return {
      metrics,
      priority_students: priorityList.priority_list.slice(0, 20),
      critical_actions: await this.feeAi.getCriticalRiskStudents(overdueStudents),
    };
  }

  @Post('simulate-recovery')
  async simulateRecovery(@Body() { student_id, payment_plan }: any) {
    const student = await this.studentService.findById(student_id);
    const simulation = await this.feeAi.simulatePaymentScenarios(student, [payment_plan]);

    return {
      student_id,
      current_risk: simulation.current_risk,
      scenarios: simulation.scenarios_impact,
      recommended: simulation.recommended_scenario,
    };
  }
}
```

### Example 3: Automated Message Campaigns

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { CommunicationAiService } from './services/communication-ai.service';
import { EnquiryService } from './services/enquiry.service';
import { EmailService } from './services/email.service';

@Controller('communication')
export class CommunicationController {
  constructor(
    private commAi: CommunicationAiService,
    private enquiryService: EnquiryService,
    private emailService: EmailService,
  ) {}

  @Post('generate-followup-campaign')
  async generateFollowupCampaign(@Body() { days_since_contact }: any) {
    // Get enquiries needing follow-up
    const enquiries = await this.enquiryService.findNeedingFollowup(days_since_contact);

    // Generate personalized messages
    const messages = await this.commAi.batchGenerateEnquiryMessages(
      enquiries,
      'inquiry_followup',
    );

    // Schedule delivery
    for (const enquiry of enquiries) {
      const message = messages.messages.find(m => m.enquiry_id === enquiry.enquiry_id);
      await this.emailService.schedule({
        to: enquiry.parent_email,
        subject: message.message.subject,
        body: message.message.body,
        scheduled_for: this._getOptimalSendTime(enquiry),
      });
    }

    return {
      campaign_id: `CAMP_${Date.now()}`,
      messages_generated: messages.messages.length,
      total_scheduled: enquiries.length,
      status: 'scheduled',
    };
  }

  private _getOptimalSendTime(enquiry: any): Date {
    const now = new Date();
    now.setHours(9, 0, 0, 0); // 9 AM
    if (now < new Date()) {
      now.setDate(now.getDate() + 1);
    }
    return now;
  }
}
```

---

## Error Handling

### Basic Error Handling

```typescript
import { Injectable, HttpException } from '@nestjs/common';
import { AiClientService } from './ai-client.service';

@Injectable()
export class SafeAdmissionService {
  constructor(private aiClient: AiClientService) {}

  async scoreWithFallback(enquiry: any) {
    try {
      return await this.aiClient.scoreAdmissionEnquiry(enquiry);
    } catch (error) {
      console.error('AI scoring failed:', error);
      // Return default score if AI unavailable
      return {
        conversion_probability: 0.5,
        risk_level: 'medium',
        confidence_score: 0.0,
        source: 'fallback',
      };
    }
  }
}
```

### Advanced Error Handling with Retry

```typescript
import { Injectable } from '@nestjs/common';
import { AiClientService } from './ai-client.service';

@Injectable()
export class ResilientAiService {
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(private aiClient: AiClientService) {}

  async scoreWithRetry(enquiry: any) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.aiClient.scoreAdmissionEnquiry(enquiry);
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Failed after ${this.maxRetries} attempts: ${lastError.message}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Testing

### Unit Testing with Mock AI Client

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AdmissionAiService } from './admission-ai.service';
import { AiClientService } from './ai-client.service';

describe('AdmissionAiService', () => {
  let service: AdmissionAiService;
  let aiClientMock: any;

  beforeEach(async () => {
    aiClientMock = {
      scoreAdmissionEnquiry: jest.fn().mockResolvedValue({
        conversion_probability: 0.75,
        risk_level: 'medium',
        confidence_score: 0.92,
      }),
      getAdmissionFollowup: jest.fn().mockResolvedValue({
        primary_action: 'Send test results',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionAiService,
        {
          provide: AiClientService,
          useValue: aiClientMock,
        },
      ],
    }).compile();

    service = module.get<AdmissionAiService>(AdmissionAiService);
  });

  it('should analyze enquiry successfully', async () => {
    const enquiry = {
      enquiry_id: 'ENQ_001',
      status: 'APPLIED',
      parent_engagement_level: 0.8,
    };

    const result = await service.analyzeEnquiry(enquiry);

    expect(result.probability).toBe(0.75);
    expect(result.risk_level).toBe('medium');
    expect(aiClientMock.scoreAdmissionEnquiry).toHaveBeenCalled();
  });

  it('should handle AI service errors', async () => {
    aiClientMock.scoreAdmissionEnquiry.mockRejectedValue(
      new Error('Service unavailable'),
    );

    const enquiry = { enquiry_id: 'ENQ_001' };

    await expect(service.analyzeEnquiry(enquiry)).rejects.toThrow();
  });
});
```

---

## Performance Optimization

### 1. Caching Results

```typescript
import { Injectable } from '@nestjs/common';
import { AiClientService } from './ai-client.service';

@Injectable()
export class CachedAdmissionService {
  private cache = new Map();
  private cacheTTL = 3600000; // 1 hour

  constructor(private aiClient: AiClientService) {}

  async scoreAdmissionWithCache(enquiry: any) {
    const cacheKey = `score_${enquiry.enquiry_id}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const result = await this.aiClient.scoreAdmissionEnquiry(enquiry);
    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  clearCache() {
    this.cache.clear();
  }
}
```

### 2. Batch Processing

```typescript
import { Injectable } from '@nestjs/common';
import { AiClientService } from './ai-client.service';

@Injectable()
export class BatchAdmissionService {
  private batchSize = 100;

  constructor(private aiClient: AiClientService) {}

  async scoreMultipleInBatches(enquiries: any[]) {
    const results = [];

    for (let i = 0; i < enquiries.length; i += this.batchSize) {
      const batch = enquiries.slice(i, i + this.batchSize);
      const batchResults = await this.aiClient.rankAdmissionEnquiries(batch);
      results.push(...batchResults.ranked_enquiries);

      // Add small delay between batches
      if (i + this.batchSize < enquiries.length) {
        await this.sleep(100);
      }
    }

    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

**Last Updated**: March 19, 2024
