import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

/**
 * AI Client Service
 * Integrates with the Python AI microservice for scoring, predictions, and message generation
 */
@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly aiServiceUrl: string;
  private readonly aiServiceTimeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>(
      'AI_SERVICE_URL',
      'http://localhost:8000/api/ai',
    );
    this.aiServiceTimeout = this.configService.get<number>(
      'AI_SERVICE_TIMEOUT',
      30000,
    );
  }

  // ==================== ADMISSION SCORING ====================

  /**
   * Score an admission enquiry
   */
  async scoreAdmissionEnquiry(enquiryData: any): Promise<any> {
    try {
      this.logger.debug(`Scoring admission enquiry: ${enquiryData.enquiry_id}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/scoring/score`,
          enquiryData,
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error scoring admission enquiry: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to score admission enquiry',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Score and rank multiple enquiries
   */
  async rankAdmissionEnquiries(enquiries: any[]): Promise<any> {
    try {
      this.logger.debug(`Ranking ${enquiries.length} admission enquiries`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/scoring/score-and-rank`,
          enquiries,
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error ranking enquiries: ${(error as AxiosError).message}`);
      throw new HttpException(
        'Failed to rank enquiries',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Compare two enquiry scores
   */
  async compareEnquiryScores(enquiry1: any, enquiry2: any): Promise<any> {
    try {
      this.logger.debug(
        `Comparing scores for ${enquiry1.enquiry_id} vs ${enquiry2.enquiry_id}`,
      );

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/scoring/compare-scores`,
          { enquiry1, enquiry2 },
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error comparing scores: ${(error as AxiosError).message}`);
      throw new HttpException(
        'Failed to compare scores',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * What-if analysis for enquiry
   */
  async whatIfAnalysis(enquiryData: any): Promise<any> {
    try {
      this.logger.debug(`Running what-if analysis for ${enquiryData.enquiry_id}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/scoring/what-if-analysis`,
          enquiryData,
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error in what-if analysis: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to perform what-if analysis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== FEE DEFAULT PREDICTION ====================

  /**
   * Predict fee default probability
   */
  async predictFeeDefault(studentData: any): Promise<any> {
    try {
      this.logger.debug(`Predicting default risk for student: ${studentData.student_id}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/fees/predict-default-risk`,
          studentData,
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error predicting default: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to predict default risk',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Assess batch default risk
   */
  async assessBatchDefaultRisk(students: any[]): Promise<any> {
    try {
      this.logger.debug(`Assessing default risk for ${students.length} students`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/fees/assess-batch-risk`,
          { students, sort_by: 'risk' },
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error assessing batch risk: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to assess batch risk',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get collection strategy
   */
  async getCollectionStrategy(studentData: any): Promise<any> {
    try {
      this.logger.debug(`Getting collection strategy for ${studentData.student_id}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/fees/collection-strategy`,
          studentData,
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error getting collection strategy: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to get collection strategy',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Compare default risks
   */
  async compareDefaultRisks(student1: any, student2: any): Promise<any> {
    try {
      this.logger.debug(
        `Comparing default risks for ${student1.student_id} vs ${student2.student_id}`,
      );

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/fees/risk-comparison`,
          { student1, student2 },
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error comparing default risks: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to compare risks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Simulate payment scenarios
   */
  async simulatePaymentScenario(studentData: any): Promise<any> {
    try {
      this.logger.debug(`Simulating payment scenarios for ${studentData.student_id}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/fees/simulate-payment-scenario`,
          studentData,
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error simulating scenarios: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to simulate scenarios',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== FOLLOW-UP SUGGESTIONS ====================

  /**
   * Get admission follow-up suggestions
   */
  async getAdmissionFollowup(enquiryData: any): Promise<any> {
    try {
      this.logger.debug(`Getting follow-up suggestions for ${enquiryData.enquiry_id}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/followup/admission`,
          enquiryData,
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error getting follow-up suggestions: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to get follow-up suggestions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get fee follow-up suggestions
   */
  async getFeeFollowup(studentData: any): Promise<any> {
    try {
      this.logger.debug(`Getting fee follow-up suggestions for ${studentData.student_id}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/followup/fees`,
          studentData,
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error getting fee follow-up suggestions: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to get fee follow-up suggestions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Batch admission follow-up suggestions
   */
  async batchAdmissionFollowup(enquiries: any[]): Promise<any> {
    try {
      this.logger.debug(`Getting follow-up suggestions for ${enquiries.length} enquiries`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/followup/batch-admission-suggestions`,
          enquiries,
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error in batch follow-up: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to get batch follow-up suggestions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Batch fee follow-up suggestions
   */
  async batchFeeFollowup(students: any[]): Promise<any> {
    try {
      this.logger.debug(`Getting fee follow-up suggestions for ${students.length} students`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/followup/batch-fee-suggestions`,
          students,
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error in batch fee follow-up: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to get batch fee follow-up suggestions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== MESSAGE GENERATION ====================

  /**
   * Generate enquiry message
   */
  async generateEnquiryMessage(enquiryData: any, messageType: string, channel: string): Promise<any> {
    try {
      this.logger.debug(
        `Generating ${messageType} message for ${enquiryData.enquiry_id} via ${channel}`,
      );

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/messages/generate-enquiry-message`,
          {
            ...enquiryData,
            message_type: messageType,
            channel,
          },
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error generating enquiry message: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to generate enquiry message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate enquiry message variants
   */
  async generateEnquiryMessageVariants(enquiryData: any, messageType: string, channel: string): Promise<any> {
    try {
      this.logger.debug(`Generating message variants for ${enquiryData.enquiry_id}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/messages/generate-enquiry-message-variants`,
          {
            ...enquiryData,
            message_type: messageType,
            channel,
          },
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error generating variants: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to generate message variants',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate fee message
   */
  async generateFeeMessage(studentData: any, messageType: string, channel: string): Promise<any> {
    try {
      this.logger.debug(
        `Generating ${messageType} message for ${studentData.student_id} via ${channel}`,
      );

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/messages/generate-fee-message`,
          {
            ...studentData,
            message_type: messageType,
            channel,
          },
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error generating fee message: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to generate fee message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Batch generate enquiry messages
   */
  async batchGenerateEnquiryMessages(enquiries: any[]): Promise<any> {
    try {
      this.logger.debug(`Generating messages for ${enquiries.length} enquiries`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/messages/batch-generate-enquiry-messages`,
          enquiries,
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error in batch message generation: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to generate batch messages',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Batch generate fee messages
   */
  async batchGenerateFeeMessages(students: any[]): Promise<any> {
    try {
      this.logger.debug(`Generating fee messages for ${students.length} students`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/messages/batch-generate-fee-messages`,
          students,
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error in batch fee message generation: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to generate batch fee messages',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(): Promise<any> {
    try {
      this.logger.debug('Fetching available message templates');

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.aiServiceUrl}/messages/available-templates`,
          { timeout: this.aiServiceTimeout },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error fetching templates: ${(error as AxiosError).message}`,
      );
      throw new HttpException(
        'Failed to fetch templates',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Check AI service connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      this.logger.debug('Checking AI service health');

      // Try to get sample scoring
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.aiServiceUrl}/scoring/sample-scoring`,
          { timeout: 5000 },
        ),
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error(
        `AI service health check failed: ${(error as AxiosError).message}`,
      );
      return false;
    }
  }

  /**
   * Wait for AI service to be available
   */
  async waitForService(maxAttempts: number = 20, delayMs: number = 500): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isHealthy = await this.healthCheck();
      if (isHealthy) {
        this.logger.log('AI service is now available');
        return true;
      }

      this.logger.warn(
        `AI service not ready (attempt ${attempt}/${maxAttempts}), retrying...`,
      );
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    return false;
  }
}
