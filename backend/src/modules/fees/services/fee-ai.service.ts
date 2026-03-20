import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from '../../../common/services/ai-client.service';

/**
 * Fee AI Integration Service
 * Orchestrates AI capabilities for fee management workflows
 */
@Injectable()
export class FeeAiService {
  private readonly logger = new Logger(FeeAiService.name);

  constructor(private readonly aiClient: AiClientService) {}

  /**
   * Comprehensive fee analysis
   * Combines default risk prediction and follow-up strategies
   */
  async analyzeFeeRisk(studentData: any): Promise<any> {
    try {
      this.logger.debug(`Analyzing fee risk for: ${studentData.student_id}`);

      const [defaultRisk, collectionStrategy] = await Promise.all([
        this.aiClient.predictFeeDefault(studentData),
        this.aiClient.getCollectionStrategy(studentData),
      ]);

      return {
        student_id: studentData.student_id,
        risk_assessment: {
          probability: defaultRisk.default_probability,
          percentage: defaultRisk.default_probability_percentage,
          level: defaultRisk.risk_level,
          urgency: defaultRisk.action_urgency,
          confidence: defaultRisk.confidence_score,
          payment_probability: defaultRisk.payment_probability,
        },
        component_risks: defaultRisk.component_risks,
        collection_strategy: collectionStrategy.collection_strategy,
        collection_difficulty: defaultRisk.collection_difficulty,
        recommendations: defaultRisk.recommendations,
        collection_success_probability: collectionStrategy.success_probability,
        days_until_critical: defaultRisk.days_until_critical,
      };
    } catch (error) {
      this.logger.error(`Error analyzing fee risk: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get collection priority list for multiple students
   */
  async getPriorityCollectionList(students: any[]): Promise<any> {
    try {
      this.logger.debug(`Getting priority collection list for ${students.length} students`);

      const batchRisk = await this.aiClient.assessBatchDefaultRisk(students);

      return {
        total_students: batchRisk.total_students,
        risk_distribution: batchRisk.risk_distribution,
        financial_impact: {
          total_amount_at_risk: batchRisk.financial_risk.total_amount_at_risk,
          critical_amount: batchRisk.financial_risk.critical_amount,
        },
        priority_list: batchRisk.prioritized_for_collection.map(
          (item: any, index: number) => ({
            priority_rank: index + 1,
            student_id: item.student_id,
            default_probability: item.default_probability,
            risk_level: item.risk_level,
            action_urgency: item.action_urgency,
            estimated_recovery_days: this._estimateRecoveryDays(item.default_probability),
          }),
        ),
        collection_estimate: `Focus on ${batchRisk.risk_distribution.critical_risk + batchRisk.risk_distribution.high_risk} students for maximum recovery`,
      };
    } catch (error) {
      this.logger.error(`Error getting priority list: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Simulate payment scenarios for a student
   */
  async simulatePaymentScenarios(studentData: any): Promise<any> {
    try {
      this.logger.debug(`Simulating payment scenarios for ${studentData.student_id}`);

      const scenarios = await this.aiClient.simulatePaymentScenario(studentData);

      return {
        student_id: studentData.student_id,
        current_default_probability: scenarios.current_state.default_probability,
        current_risk_level: scenarios.current_state.risk_level,
        scenarios: scenarios.scenarios.map((s: any) => ({
          scenario: s.scenario,
          resulting_probability: s.default_probability,
          risk_improvement: s.risk_reduction,
          improvement_percentage: (s.risk_reduction * 100).toFixed(1),
          impact_level: this._getImpactLevel(s.risk_reduction),
        })),
        best_action: scenarios.best_action,
        recommendation_priority: this._getRiskRecommendationPriority(
          scenarios.current_state.default_probability,
        ),
      };
    } catch (error) {
      this.logger.error(`Error simulating scenarios: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Compare default risks for two students
   */
  async compareStudentRisks(student1: any, student2: any): Promise<any> {
    try {
      this.logger.debug(
        `Comparing default risks for ${student1.student_id} vs ${student2.student_id}`,
      );

      const comparison = await this.aiClient.compareDefaultRisks(student1, student2);

      return {
        student1_id: student1.student_id,
        student1_default_probability: comparison.student1.default_probability,
        student1_risk_level: comparison.student1.risk_level,
        student2_id: student2.student_id,
        student2_default_probability: comparison.student2.default_probability,
        student2_risk_level: comparison.student2.risk_level,
        higher_risk_student: comparison.comparison.higher_risk_student,
        probability_gap: comparison.comparison.difference,
        gap_percentage: comparison.comparison.probability_gap,
        summary: comparison.comparison.summary,
        priority_ranking: comparison.comparison.priority_ranking,
        resource_allocation_recommendation: this._getAllocationRecommendation(
          comparison.comparison.priority_ranking,
        ),
      };
    } catch (error) {
      this.logger.error(`Error comparing risks: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get fee collection dashboard metrics
   */
  async getCollectionMetrics(students: any[]): Promise<any> {
    try {
      this.logger.debug(`Getting collection metrics for ${students.length} students`);

      const batchRisk = await this.aiClient.assessBatchDefaultRisk(students);

      const totalAmount = students.reduce((sum: number, s: any) => sum + (s.outstanding_amount || 0), 0);
      const criticalAmount = batchRisk.financial_risk.critical_amount;
      const highRiskAmount = batchRisk.risk_distribution.high_risk * (totalAmount / students.length);

      return {
        overview: {
          total_students: students.length,
          total_outstanding_amount: totalAmount,
          currency: 'INR',
        },
        risk_distribution: batchRisk.risk_distribution,
        financial_risk: {
          critical_risk_amount: criticalAmount,
          high_risk_amount: Math.round(highRiskAmount),
          potential_recovery_percentage: this._estimateRecoveryPercentage(batchRisk.risk_distribution),
        },
        collection_strategy: {
          focus_on_critical: `${batchRisk.risk_distribution.critical_risk} students`,
          estimated_recovery: `₹${Math.round(criticalAmount * 0.7)}`,
          timeline: '7-14 days for critical cases',
        },
        effectiveness_metrics: {
          expected_collection_rate: `${this._estimateCollectionRate(batchRisk.risk_distribution)}%`,
          days_to_recover: 30,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting collection metrics: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get students at critical default risk
   */
  async getCriticalRiskStudents(students: any[]): Promise<any> {
    try {
      this.logger.debug(`Identifying critical risk students from ${students.length} total`);

      const batchRisk = await this.aiClient.assessBatchDefaultRisk(students);

      const criticalStudents = batchRisk.prioritized_for_collection
        .filter((item: any) => item.risk_level === 'critical')
        .slice(0, batchRisk.risk_distribution.critical_risk);

      return {
        total_students: students.length,
        critical_count: batchRisk.risk_distribution.critical_risk,
        critical_percentage: (
          (batchRisk.risk_distribution.critical_risk / students.length) *
          100
        ).toFixed(1),
        critical_list: criticalStudents.map((student: any) => ({
          student_id: student.student_id,
          default_probability: student.default_probability,
          risk_level: student.risk_level,
          action_required: student.action_urgency,
          escalation_needed: true,
        })),
        immediate_actions: [
          'Initiate director/principal intervention',
          'Prepare legal notice if needed',
          'Contact parents for urgent meeting',
          'Explore fee waiver/assistance options',
        ],
      };
    } catch (error) {
      this.logger.error(`Error identifying critical risk: ${(error as Error).message}`);
      throw error;
    }
  }

  // ==================== PRIVATE HELPERS ====================

  private _estimateRecoveryDays(probability: number): number {
    if (probability >= 0.9) return 30; // Critical, high likelihood to default
    if (probability >= 0.7) return 20; // High risk
    if (probability >= 0.5) return 14; // Medium risk
    if (probability >= 0.2) return 7; // Low risk
    return 0; // Very low risk
  }

  private _getImpactLevel(improvement: number): string {
    if (improvement >= 0.3) return 'very_high';
    if (improvement >= 0.2) return 'high';
    if (improvement >= 0.1) return 'moderate';
    return 'low';
  }

  private _getRiskRecommendationPriority(probability: number): string {
    if (probability >= 0.8) return '🔴 CRITICAL: Immediate intervention required';
    if (probability >= 0.6) return '🟠 HIGH: Urgent action needed within 48 hours';
    if (probability >= 0.4) return '🟡 MEDIUM: Action needed within 1 week';
    return '🟢 LOW: Regular follow-up recommended';
  }

  private _getAllocationRecommendation(ranking: any[]): string {
    if (ranking[0].risk >= 0.7) {
      return `Allocate more resources to ${ranking[0].student_id} (${(ranking[0].risk * 100).toFixed(0)}% risk)`;
    }
    return 'Monitor both students closely';
  }

  private _estimateRecoveryPercentage(distribution: any): number {
    const critical = distribution.critical_risk;
    const high = distribution.high_risk;
    const medium = distribution.medium_risk;
    const total = critical + high + medium;

    if (total === 0) return 100;

    // Critical: 70% recovery, High: 85%, Medium: 95%
    return Math.round((critical * 0.7 + high * 0.85 + medium * 0.95) / total);
  }

  private _estimateCollectionRate(distribution: any): number {
    const total =
      distribution.critical_risk +
      distribution.high_risk +
      distribution.medium_risk +
      distribution.low_risk;

    if (total === 0) return 100;

    return Math.round(
      ((distribution.low_risk +
        distribution.medium_risk * 0.95 +
        distribution.high_risk * 0.85 +
        distribution.critical_risk * 0.7) /
        total) *
        100,
    );
  }
}
