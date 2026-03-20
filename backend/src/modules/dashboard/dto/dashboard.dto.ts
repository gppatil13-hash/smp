import { Decimal } from '@prisma/client/runtime/library';

// ===== DASHBOARD OVERVIEW =====
export class DashboardOverviewDto {
  admissionsToday: number;
  admissionsThisMonth: number;
  pendingEnquiries: number;
  feesCollectedToday: Decimal;
  feesCollectedThisMonth: Decimal;
  pendingFees: Decimal;
  pendingFeeRecordCount: number;
  upcomingFeeDue: Decimal;
  upcomingFeeRecordCount: number;
  recentPayments: RecentPaymentDto[];
  pendingTasks: PendingTaskDto[];
  period: string;
  generatedAt: Date;
}

// ===== ADMISSION METRICS =====
export class AdmissionMetricsDto {
  today: number;
  thisMonth: number;
  thisQuarter: number;
  thisYear: number;
  totalApplications: number;
  byStatus: AdmissionStatusBreakdownDto[];
  inquiryConversionRate: number; // Percentage
  conversionTrend: ConversionTrendDto[];
  generatedAt: Date;
}

export class AdmissionStatusBreakdownDto {
  status: string;
  count: number;
  percentage: number;
  trend: number; // Week-over-week change
}

export class ConversionTrendDto {
  month: string;
  inquiries: number;
  applied: number;
  shortlisted: number;
  admitted: number;
}

// ===== FEE METRICS =====
export class FeeMetricsDto {
  collectedToday: Decimal;
  collectedThisMonth: Decimal;
  collectedThisYear: Decimal;
  pendingTotal: Decimal;
  overdueTotal: Decimal;
  pendingRecordCount: number;
  overdueRecordCount: number;
  collectionRate: number; // Percentage
  byPaymentMode: FeePaymentModeDto[];
  byClass: FeeByClassDto[];
  generatedAt: Date;
}

export class FeePaymentModeDto {
  mode: string;
  amount: Decimal;
  count: number;
  percentage: number;
}

export class FeeByClassDto {
  classSection: string;
  collected: Decimal;
  pending: Decimal;
  overdue: Decimal;
  collectionRate: number;
}

// ===== PAYMENT METRICS =====
export class PaymentMetricsDto {
  recentPayments: PaymentDetailDto[];
  totalAmount: Decimal;
  totalCount: number;
  averagePaymentAmount: Decimal;
  generatedAt: Date;
}

export class PaymentDetailDto {
  id: string;
  studentName: string;
  studentEnrollmentNo: string;
  amount: Decimal;
  paymentMode: string;
  paidAt: Date;
  status: string;
  transactionId?: string;
}

// ===== COMMUNICATION / TASKS METRICS =====
export class CommunicationMetricsDto {
  pendingFollowUps: PendingTaskDto[];
  pendingCommunications: PendingCommunicationDto[];
  totalPending: number;
  generatedAt: Date;
}

export class PendingTaskDto {
  id: string;
  type: string; // 'inquiry', 'incomplete_documents', 'fee_follow_up', etc.
  targetId: string; // admission ID or student ID
  targetName: string;
  description: string;
  daysSincePending: number;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export class PendingCommunicationDto {
  id: string;
  recipientName: string;
  recipientPhone?: string;
  type: string; // SMS, EMAIL, WHATSAPP
  subject: string;
  status: string;
  retryCount: number;
  createdAt: Date;
}

// ===== CHART DATA =====
export class DashboardChartsDto {
  admissionsChart: ChartDataDto;
  feesCollectionChart: ChartDataDto;
  feeStatusChart: PieChartDataDto;
  admissionStatusChart: PieChartDataDto;
  classWiseAdmissionsChart: BarChartDataDto;
  feeTrendChart: ChartDataDto;
  generatedAt: Date;
}

export class ChartDataDto {
  title: string;
  labels: string[];
  datasets: ChartDatasetDto[];
}

export class ChartDatasetDto {
  label: string;
  data: (number | Decimal)[];
  borderColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export class PieChartDataDto {
  title: string;
  labels: string[];
  data: (number | Decimal)[];
  backgroundColor?: string[];
  borderColor?: string[];
}

export class BarChartDataDto {
  title: string;
  labels: string[];
  datasets: ChartDatasetDto[];
}

// ===== SUMMARY CARDS =====
export class SummaryCardDto {
  title: string;
  value: string | number;
  previousValue?: string | number;
  percentageChange?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  color?: string;
}

// ===== UPCOMING FEES =====
export class UpcomingFeeDto {
  classSection: string;
  totalDue: Decimal;
  studentCount: number;
  dueDate: Date;
  daysUntilDue: number;
  details: UpcomingFeeDetailDto[];
}

export class UpcomingFeeDetailDto {
  studentName: string;
  studentEnrollmentNo: string;
  amount: Decimal;
  dueDate: Date;
  daysUntilDue: number;
}

// ===== ADMISSION PIPELINE =====
export class AdmissionPipelineDto {
  inquiry: AdmissionPipelineStageDto;
  applied: AdmissionPipelineStageDto;
  shortlisted: AdmissionPipelineStageDto;
  admitted: AdmissionPipelineStageDto;
  rejected: AdmissionPipelineStageDto;
  conversionRates: ConversionRateDto[];
  generatedAt: Date;
}

export class AdmissionPipelineStageDto {
  status: string;
  count: number;
  percentage: number;
  avgTimeInDays?: number;
}

export class ConversionRateDto {
  from: string;
  to: string;
  rate: number;
  count: number;
}
