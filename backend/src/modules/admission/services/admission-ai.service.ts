import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from '../../../common/services/ai-client.service';

/**
 * Admission AI Integration Service
 * Orchestrates AI capabilities for admission workflows
 */
@Injectable()
export class AdmissionAiService {
  private readonly logger = new Logger(AdmissionAiService.name);

  constructor(private readonly aiClient: AiClientService) {}

  /**
   * Comprehensive admission enquiry analysis
   * Combines scoring and follow-up suggestions
   */
  async analyzeEnquiry(enquiryData: any): Promise<any> {
    try {
      this.logger.debug(`Analyzing enquiry: ${enquiryData.enquiry_id}`);

      const [score, followup] = await Promise.all([
        this.aiClient.scoreAdmissionEnquiry(enquiryData),
        this.aiClient.getAdmissionFollowup(enquiryData),
      ]);

      return {
        enquiry_id: enquiryData.enquiry_id,
        score: {
          probability: score.conversion_probability,
          confidence: score.confidence_score,
          risk_level: score.risk_level,
          key_factors: score.key_factors,
          recommendations: score.recommendations,
          next_action: score.next_action,
        },
        followup: {
          suggested_actions: followup.suggested_actions,
          primary_action: followup.primary_action,
          urgency: followup.urgency_level,
          optimal_contact_time: followup.optimal_contact_time,
          communication_channels: followup.communication_channels,
        },
        combined_recommendation: this._generateCombinedRecommendation(score, followup),
      };
    } catch (error) {
      this.logger.error(`Error analyzing enquiry: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get analysis for multiple enquiries with ranking
   */
  async analyzeMultipleEnquiries(enquiries: any[]): Promise<any> {
    try {
      this.logger.debug(`Analyzing ${enquiries.length} enquiries`);

      const [ranked, followups] = await Promise.all([
        this.aiClient.rankAdmissionEnquiries(enquiries),
        this.aiClient.batchAdmissionFollowup(enquiries),
      ]);

      return {
        total_enquiries: enquiries.length,
        scored: ranked.scored,
        statistics: ranked.statistics,
        ranked_with_followup: ranked.ranked_results.map((item: any, index: number) => ({
          rank: item.rank,
          enquiry_id: item.enquiry_id,
          probability: item.probability,
          risk_level: item.risk_level,
          next_action: item.next_action,
          followup_suggestion: followups.suggestions?.[index]?.primary_action,
        })),
      };
    } catch (error) {
      this.logger.error(`Error analyzing multiple enquiries: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Scenario analysis for an enquiry
   */
  async scenarioAnalysis(enquiryData: any): Promise<any> {
    try {
      this.logger.debug(`Running scenario analysis for ${enquiryData.enquiry_id}`);

      const scenarios = await this.aiClient.whatIfAnalysis(enquiryData);

      return {
        enquiry_id: enquiryData.enquiry_id,
        base_probability: scenarios.base_probability,
        scenarios: scenarios.scenarios.map((s: any) => ({
          scenario: s.scenario,
          new_probability: s.new_probability,
          improvement: s.change,
          improvement_percentage: (s.change * 100).toFixed(1),
        })),
        highest_impact_factor: scenarios.highest_impact_factor,
        recommended_action: this._getRecommendedAction(scenarios),
      };
    } catch (error) {
      this.logger.error(`Error in scenario analysis: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get next best action for enquiry
   */
  async getNextAction(enquiryData: any): Promise<any> {
    try {
      this.logger.debug(`Getting next action for ${enquiryData.enquiry_id}`);

      const [score, followup] = await Promise.all([
        this.aiClient.scoreAdmissionEnquiry(enquiryData),
        this.aiClient.getAdmissionFollowup(enquiryData),
      ]);

      return {
        enquiry_id: enquiryData.enquiry_id,
        probability: score.conversion_probability,
        urgency: followup.urgency_level,
        primary_action: followup.primary_action,
        timeline: this._getTimelineForAction(followup.urgency_level),
        contact_details: {
          channels: followup.communication_channels,
          optimal_time: followup.optimal_contact_time,
        },
        success_probability: score.conversion_probability,
        estimated_conversion_days: score.estimated_conversion_days,
      };
    } catch (error) {
      this.logger.error(`Error getting next action: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Identify at-risk enquiries
   */
  async identifyAtRisk(enquiries: any[]): Promise<any> {
    try {
      this.logger.debug(`Identifying at-risk enquiries from ${enquiries.length} total`);

      const ranked = await this.aiClient.rankAdmissionEnquiries(enquiries);

      const atRisk = ranked.ranked_results
        .filter((item: any) => item.probability < 0.4)
        .map((item: any) => ({
          enquiry_id: item.enquiry_id,
          probability: item.probability,
          risk_level: item.risk_level,
          next_action: item.next_action,
          priority: item.probability < 0.2 ? 'critical' : 'high',
        }));

      return {
        total_enquiries: enquiries.length,
        at_risk_count: atRisk.length,
        at_risk_percentage: ((atRisk.length / enquiries.length) * 100).toFixed(1),
        at_risk_list: atRisk,
      };
    } catch (error) {
      this.logger.error(`Error identifying at-risk: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get conversion funnel analysis
   */
  async conversionFunnelAnalysis(enquiries: any[]): Promise<any> {
    try {
      this.logger.debug(`Analyzing conversion funnel for ${enquiries.length} enquiries`);

      const ranked = await this.aiClient.rankAdmissionEnquiries(enquiries);

      const byProbability = {
        very_high: ranked.ranked_results.filter((i: any) => i.probability >= 0.8).length,
        high: ranked.ranked_results.filter((i: any) => i.probability >= 0.6 && i.probability < 0.8).length,
        medium: ranked.ranked_results.filter((i: any) => i.probability >= 0.4 && i.probability < 0.6).length,
        low: ranked.ranked_results.filter((i: any) => i.probability < 0.4).length,
      };

      return {
        total: enquiries.length,
        funnel_stages: [
          {
            stage: 'Very High Probability (80%+)',
            count: byProbability.very_high,
            percentage: ((byProbability.very_high / enquiries.length) * 100).toFixed(1),
            conversion_estimate: `${byProbability.very_high} admissions likely`,
          },
          {
            stage: 'High Probability (60-80%)',
            count: byProbability.high,
            percentage: ((byProbability.high / enquiries.length) * 100).toFixed(1),
            conversion_estimate: `${Math.round(byProbability.high * 0.7)} admissions likely`,
          },
          {
            stage: 'Medium Probability (40-60%)',
            count: byProbability.medium,
            percentage: ((byProbability.medium / enquiries.length) * 100).toFixed(1),
            conversion_estimate: `${Math.round(byProbability.medium * 0.5)} admissions likely`,
          },
          {
            stage: 'Low Probability (<40%)',
            count: byProbability.low,
            percentage: ((byProbability.low / enquiries.length) * 100).toFixed(1),
            conversion_estimate: `${Math.round(byProbability.low * 0.2)} admissions likely`,
          },
        ],
        estimated_total_conversions: byProbability.very_high + Math.round(byProbability.high * 0.7) + Math.round(byProbability.medium * 0.5) + Math.round(byProbability.low * 0.2),
      };
    } catch (error) {
      this.logger.error(`Error in funnel analysis: ${(error as Error).message}`);
      throw error;
    }
  }

  // ==================== PRIVATE HELPERS ====================

  private _generateCombinedRecommendation(score: any, followup: any): string {
    const prob = score.conversion_probability;
    const urgency = followup.urgency_level;

    if (prob >= 0.8 && urgency === 'critical') {
      return 'IMMEDIATE PRIORITY: High conversion probability with critical follow-up needed. Schedule senior counselor meeting immediately.';
    } else if (prob >= 0.7) {
      return 'HIGH PRIORITY: Strong conversion probability. Execute primary follow-up action without delay.';
    } else if (prob >= 0.5 && urgency === 'high') {
      return 'MEDIUM PRIORITY: Moderate conversion probability. Increase communication frequency and personalized engagement.';
    } else if (prob < 0.4) {
      return 'LOW PRIORITY: Low conversion probability. Consider nurturing approach or exploring alternative program fit.';
    }
    return 'Follow recommended next action.';
  }

  private _getRecommendedAction(scenarios: any): string {
    const bestScenario = scenarios.scenarios.reduce(
      (max: any, current: any) => (current.change > max.change ? current : max),
      { change: 0 },
    );

    return `Focus on: ${bestScenario.scenario} (expected improvement: ${(bestScenario.change * 100).toFixed(1)}%)`;
  }

  private _getTimelineForAction(urgency: string): string {
    switch (urgency) {
      case 'critical':
        return 'Today (within 24 hours)';
      case 'high':
        return 'Within 2-3 days';
      case 'medium':
        return 'Within 1 week';
      default:
        return 'Within 2 weeks';
    }
  }
}
