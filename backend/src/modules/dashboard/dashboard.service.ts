import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import {
  DashboardOverviewDto,
  AdmissionMetricsDto,
  FeeMetricsDto,
  PaymentMetricsDto,
  CommunicationMetricsDto,
  DashboardChartsDto,
  AdmissionStatusBreakdownDto,
  FeePaymentModeDto,
  FeeByClassDto,
  PaymentDetailDto,
  PendingTaskDto,
  SummaryCardDto,
  UpcomingFeeDto,
  UpcomingFeeDetailDto,
  AdmissionPipelineDto,
  AdmissionPipelineStageDto,
  ConversionRateDto,
  ChartDataDto,
  ChartDatasetDto,
  PieChartDataDto,
  BarChartDataDto,
} from './dto/dashboard.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly CACHE_TTL = 300; // 5 minutes in seconds

  constructor(private prisma: PrismaService) {}

  /**
   * Get complete dashboard overview with all key metrics
   * Optimized with parallel queries and aggregations
   */
  async getDashboardOverview(
    tenantId: string,
    schoolId: string,
    period: 'today' | 'week' | 'month' = 'month',
  ): Promise<DashboardOverviewDto> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    try {
      // Parallel queries for better performance
      const [
        admissionsToday,
        admissionsThisMonth,
        pendingEnquiries,
        feesCollectedToday,
        feesCollectedThisMonth,
        pendingFees,
        upcomingFees,
        recentPayments,
      ] = await Promise.all([
        // 1. Admissions Today
        this.prisma.admission.count({
          where: {
            tenantId,
            schoolId,
            appliedAt: { gte: startOfDay },
          },
        }),

        // 2. Admissions This Month
        this.prisma.admission.count({
          where: {
            tenantId,
            schoolId,
            appliedAt: { gte: startOfMonth },
          },
        }),

        // 3. Pending Enquiries (status = INQUIRY)
        this.prisma.admission.count({
          where: {
            tenantId,
            schoolId,
            status: 'INQUIRY',
          },
        }),

        // 4. Fees Collected Today
        this.prisma.feeRecord.aggregate({
          where: {
            tenantId,
            schoolId,
            status: 'PAID',
            paidDate: { gte: startOfDay },
          },
          _sum: { paidAmount: true },
        }),

        // 5. Fees Collected This Month
        this.prisma.feeRecord.aggregate({
          where: {
            tenantId,
            schoolId,
            status: 'PAID',
            paidDate: { gte: startOfMonth },
          },
          _sum: { paidAmount: true },
        }),

        // 6. Pending Fees (status = PENDING or OVERDUE)
        this.prisma.feeRecord.aggregate({
          where: {
            tenantId,
            schoolId,
            status: { in: ['PENDING', 'OVERDUE'] },
          },
          _sum: { totalAmount: true },
        }),

        // 7. Upcoming Fees (PENDING with dueDate in next 7 days)
        this.prisma.feeRecord.aggregate({
          where: {
            tenantId,
            schoolId,
            status: 'PENDING',
            dueDate: {
              gte: now,
              lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
          },
          _sum: { totalAmount: true },
        }),

        // 8. Recent Payments (last 5)
        this.prisma.feeRecord.findMany({
          where: {
            tenantId,
            schoolId,
            status: 'PAID',
            paidDate: { not: null },
          },
          select: {
            id: true,
            paidAmount: true,
            paymentMode: true,
            paidDate: true,
            status: true,
            student: {
              select: {
                firstName: true,
                lastName: true,
                enrollmentNo: true,
              },
            },
          },
          orderBy: { paidDate: 'desc' },
          take: 5,
        }),
      ]);

      // Calculate counts for pending and upcoming fees
      const [pendingFeeRecords, upcomingFeeRecords] = await Promise.all([
        this.prisma.feeRecord.count({
          where: {
            tenantId,
            schoolId,
            status: { in: ['PENDING', 'OVERDUE'] },
          },
        }),
        this.prisma.feeRecord.count({
          where: {
            tenantId,
            schoolId,
            status: 'PENDING',
            dueDate: {
              gte: now,
              lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      // Get pending tasks
      const pendingTasks = await this.getPendingTasksData(
        tenantId,
        schoolId,
      );

      return {
        admissionsToday,
        admissionsThisMonth,
        pendingEnquiries,
        feesCollectedToday: feesCollectedToday._sum?.paidAmount || new Decimal(0),
        feesCollectedThisMonth:
          feesCollectedThisMonth._sum?.paidAmount || new Decimal(0),
        pendingFees: pendingFees._sum?.totalAmount || new Decimal(0),
        pendingFeeRecordCount: pendingFeeRecords,
        upcomingFeeDue: upcomingFees._sum?.totalAmount || new Decimal(0),
        upcomingFeeRecordCount: upcomingFeeRecords,
        recentPayments: recentPayments.map((p) => ({
          id: p.id,
          studentName: `${p.student.firstName} ${p.student.lastName}`,
          studentEnrollmentNo: p.student.enrollmentNo,
          amount: p.paidAmount,
          paymentMode: p.paymentMode || 'N/A',
          paidAt: p.paidDate || new Date(),
          status: p.status,
          transactionId: undefined,
        })),
        pendingTasks: pendingTasks.slice(0, 5),
        period,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting dashboard overview', error);
      throw error;
    }
  }

  /**
   * Get admission metrics with status breakdown
   */
  async getAdmissionMetrics(
    tenantId: string,
    schoolId: string,
  ): Promise<AdmissionMetricsDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3,
      1,
    );
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    try {
      // Get total admission counts by period
      const [
        admissionsToday,
        admissionsThisMonth,
        admissionsThisQuarter,
        admissionsThisYear,
        totalApplications,
        admissionsByStatus,
      ] = await Promise.all([
        // Today
        this.prisma.admission.count({
          where: {
            tenantId,
            schoolId,
            appliedAt: { gte: startOfDay },
          },
        }),

        // This Month
        this.prisma.admission.count({
          where: {
            tenantId,
            schoolId,
            appliedAt: { gte: startOfMonth },
          },
        }),

        // This Quarter
        this.prisma.admission.count({
          where: {
            tenantId,
            schoolId,
            appliedAt: { gte: startOfQuarter },
          },
        }),

        // This Year
        this.prisma.admission.count({
          where: {
            tenantId,
            schoolId,
            appliedAt: { gte: startOfYear },
          },
        }),

        // Total Applications
        this.prisma.admission.count({
          where: {
            tenantId,
            schoolId,
          },
        }),

        // Breakdown by Status
        this.prisma.admission.groupBy({
          by: ['status'],
          where: {
            tenantId,
            schoolId,
          },
          _count: {
            id: true,
          },
        }),
      ]);

      // Calculate breakdown percentages and trends
      const statusBreakdown: AdmissionStatusBreakdownDto[] =
        admissionsByStatus.map((sb) => {
          const count = sb._count.id;
          const percentage =
            totalApplications > 0 ? (count / totalApplications) * 100 : 0;
          return {
            status: sb.status,
            count,
            percentage: Math.round(percentage * 100) / 100,
            trend: 0, // Would need previous period data for actual trend
          };
        });

      // Get conversion trend data for last 6 months
      const conversionTrend = await this.getConversionTrend(
        tenantId,
        schoolId,
        6,
      );

      // Calculate inquiry to admission conversion rate
      const inquiries = statusBreakdown.find((s) => s.status === 'INQUIRY');
      const admitted = statusBreakdown.find((s) => s.status === 'ADMITTED');
      const conversionRate =
        inquiries && inquiries.count > 0
          ? (admitted?.count || 0) / inquiries.count * 100
          : 0;

      return {
        today: admissionsToday,
        thisMonth: admissionsThisMonth,
        thisQuarter: admissionsThisQuarter,
        thisYear: admissionsThisYear,
        totalApplications,
        byStatus: statusBreakdown,
        inquiryConversionRate: Math.round(conversionRate * 100) / 100,
        conversionTrend,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting admission metrics', error);
      throw error;
    }
  }

  /**
   * Get fee collection metrics
   */
  async getFeeMetrics(
    tenantId: string,
    schoolId: string,
  ): Promise<FeeMetricsDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    try {
      // Get fee statistics
      const [
        collectedToday,
        collectedThisMonth,
        collectedThisYear,
        pendingTotal,
        overdueTotal,
        totalEnrolled,
        byPaymentMode,
        byClass,
      ] = await Promise.all([
        // Collected Today
        this.prisma.feeRecord.aggregate({
          where: {
            tenantId,
            schoolId,
            status: 'PAID',
            paidDate: { gte: startOfDay },
          },
          _sum: { paidAmount: true },
        }),

        // Collected This Month
        this.prisma.feeRecord.aggregate({
          where: {
            tenantId,
            schoolId,
            status: 'PAID',
            paidDate: { gte: startOfMonth },
          },
          _sum: { paidAmount: true },
        }),

        // Collected This Year
        this.prisma.feeRecord.aggregate({
          where: {
            tenantId,
            schoolId,
            status: 'PAID',
            paidDate: { gte: startOfYear },
          },
          _sum: { paidAmount: true },
        }),

        // Pending Total
        this.prisma.feeRecord.aggregate({
          where: {
            tenantId,
            schoolId,
            status: 'PENDING',
          },
          _sum: { totalAmount: true },
        }),

        // Overdue Total
        this.prisma.feeRecord.aggregate({
          where: {
            tenantId,
            schoolId,
            status: 'OVERDUE',
          },
          _sum: { totalAmount: true },
        }),

        // Total Enrolled Students
        this.prisma.student.count({
          where: {
            tenantId,
            schoolId,
            status: 'ACTIVE',
          },
        }),

        // By Payment Mode (This Month)
        this.prisma.feeRecord.groupBy({
          by: ['paymentMode'],
          where: {
            tenantId,
            schoolId,
            status: 'PAID',
            paidDate: { gte: startOfMonth },
          },
          _sum: { paidAmount: true },
          _count: { id: true },
        }),

        // By Class Section
        this.prisma.feeRecord.groupBy({
          by: ['student'],
          where: {
            tenantId,
            schoolId,
          },
          _sum: { paidAmount: true, totalAmount: true },
          _count: { id: true },
        }),
      ]);

      // Count pending and overdue records
      const [pendingRecords, overdueRecords] = await Promise.all([
        this.prisma.feeRecord.count({
          where: {
            tenantId,
            schoolId,
            status: 'PENDING',
          },
        }),
        this.prisma.feeRecord.count({
          where: {
            tenantId,
            schoolId,
            status: 'OVERDUE',
          },
        }),
      ]);

      // Calculate fee collection by class
      const studentsByClass = await this.prisma.student.groupBy({
        by: ['class'],
        where: {
          tenantId,
          schoolId,
          status: 'ACTIVE',
        },
        _count: { id: true },
      });

      const feeByClassData: FeeByClassDto[] = [];
      for (const classGroup of studentsByClass) {
        const classStats = await this.prisma.feeRecord.aggregate({
          where: {
            tenantId,
            schoolId,
            student: {
              classId: classGroup.class,
            },
          },
          _sum: {
            paidAmount: true,
            totalAmount: true,
          },
        });

        const collected = classStats._sum?.paidAmount || new Decimal(0);
        const total = classStats._sum?.totalAmount || new Decimal(0);
        const pending = total.minus(collected);

        feeByClassData.push({
          classSection: classGroup.class,
          collected,
          pending,
          overdue: new Decimal(0), // Would need date-based calculation
          collectionRate:
            total.toNumber() > 0
              ? (collected.toNumber() / total.toNumber()) * 100
              : 0,
        });
      }

      // Calculate payment mode statistics
      const totalCollectedThisMonth =
        collectedThisMonth._sum?.paidAmount || new Decimal(0);
      const paymentModeStats: FeePaymentModeDto[] = byPaymentMode.map((pm) => {
        const amount = pm._sum?.paidAmount || new Decimal(0);
        const percentage =
          totalCollectedThisMonth.toNumber() > 0
            ? (amount.toNumber() / totalCollectedThisMonth.toNumber()) * 100
            : 0;
        return {
          mode: pm.paymentMode || 'Unknown',
          amount,
          count: pm._count?.id || 0,
          percentage: Math.round(percentage * 100) / 100,
        };
      });

      // Calculate overall collection rate
      const totalEnrolledFees = await this.prisma.feeRecord.aggregate({
        where: {
          tenantId,
          schoolId,
        },
        _sum: { totalAmount: true, paidAmount: true },
      });

      const totalDue = totalEnrolledFees._sum?.totalAmount || new Decimal(0);
      const totalPaid = totalEnrolledFees._sum?.paidAmount || new Decimal(0);
      const collectionRate =
        totalDue.toNumber() > 0
          ? (totalPaid.toNumber() / totalDue.toNumber()) * 100
          : 0;

      return {
        collectedToday: collectedToday._sum?.paidAmount || new Decimal(0),
        collectedThisMonth:
          collectedThisMonth._sum?.paidAmount || new Decimal(0),
        collectedThisYear: collectedThisYear._sum?.paidAmount || new Decimal(0),
        pendingTotal: pendingTotal._sum?.totalAmount || new Decimal(0),
        overdueTotal: overdueTotal._sum?.totalAmount || new Decimal(0),
        pendingRecordCount: pendingRecords,
        overdueRecordCount: overdueRecords,
        collectionRate: Math.round(collectionRate * 100) / 100,
        byPaymentMode: paymentModeStats,
        byClass: feeByClassData,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting fee metrics', error);
      throw error;
    }
  }

  /**
   * Get recent payments
   */
  async getRecentPayments(
    tenantId: string,
    schoolId: string,
    limit: number = 10,
  ): Promise<PaymentMetricsDto> {
    try {
      const payments = await this.prisma.feeRecord.findMany({
        where: {
          tenantId,
          schoolId,
          status: 'PAID',
          paidDate: { not: null },
        },
        select: {
          id: true,
          paidAmount: true,
          paymentMode: true,
          paidDate: true,
          transactionId: true,
          status: true,
          student: {
            select: {
              firstName: true,
              lastName: true,
              enrollmentNo: true,
            },
          },
        },
        orderBy: { paidDate: 'desc' },
        take: limit,
      });

      const totalAmount = payments.reduce(
        (sum, p) => sum.plus(p.paidAmount),
        new Decimal(0),
      );
      const averageAmount =
        payments.length > 0 ? totalAmount.div(payments.length) : new Decimal(0);

      return {
        recentPayments: payments.map((p) => ({
          id: p.id,
          studentName: `${p.student.firstName} ${p.student.lastName}`,
          studentEnrollmentNo: p.student.enrollmentNo,
          amount: p.paidAmount,
          paymentMode: p.paymentMode || 'N/A',
          paidAt: p.paidDate || new Date(),
          status: p.status,
          transactionId: p.transactionId,
        })),
        totalAmount,
        totalCount: payments.length,
        averagePaymentAmount: averageAmount,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting recent payments', error);
      throw error;
    }
  }

  /**
   * Get pending tasks and follow-ups
   */
  async getPendingTasks(
    tenantId: string,
    schoolId: string,
  ): Promise<CommunicationMetricsDto> {
    try {
      const pendingTasks = await this.getPendingTasksData(tenantId, schoolId);

      // Get pending communications
      const pendingCommunications = await this.prisma.communication.findMany({
        where: {
          tenantId,
          schoolId,
          status: 'PENDING',
        },
        select: {
          id: true,
          recipientName: true,
          recipientPhone: true,
          type: true,
          subject: true,
          status: true,
          retryCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return {
        pendingFollowUps: pendingTasks,
        pendingCommunications: pendingCommunications.map((c) => ({
          id: c.id,
          recipientName: c.recipientName,
          recipientPhone: c.recipientPhone,
          type: c.type,
          subject: c.subject,
          status: c.status,
          retryCount: c.retryCount,
          createdAt: c.createdAt,
        })),
        totalPending:
          pendingTasks.length + pendingCommunications.length,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting pending tasks', error);
      throw error;
    }
  }

  /**
   * Get chart data for visualizations
   */
  async getChartData(
    tenantId: string,
    schoolId: string,
    period: 'week' | 'month' | 'quarter' = 'month',
  ): Promise<DashboardChartsDto> {
    try {
      const [
        admissionsChart,
        feesCollectionChart,
        feeStatusChart,
        admissionStatusChart,
        classWiseAdmissionsChart,
        feeTrendChart,
      ] = await Promise.all([
        this.getAdmissionsChartData(tenantId, schoolId, period),
        this.getFeesCollectionChartData(tenantId, schoolId, period),
        this.getFeeStatusChartData(tenantId, schoolId),
        this.getAdmissionStatusChartData(tenantId, schoolId),
        this.getClassWiseAdmissionsChartData(tenantId, schoolId),
        this.getFeeTrendChartData(tenantId, schoolId, period),
      ]);

      return {
        admissionsChart,
        feesCollectionChart,
        feeStatusChart,
        admissionStatusChart,
        classWiseAdmissionsChart,
        feeTrendChart,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting chart data', error);
      throw error;
    }
  }

  /**
   * Get summary cards data
   */
  async getSummaryCards(
    tenantId: string,
    schoolId: string,
  ): Promise<SummaryCardDto[]> {
    try {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        admissionsToday,
        feesCollectedToday,
        pendingEnquiries,
        pendingFees,
      ] = await Promise.all([
        this.prisma.admission.count({
          where: {
            tenantId,
            schoolId,
            appliedAt: { gte: startOfDay },
          },
        }),
        this.prisma.feeRecord.aggregate({
          where: {
            tenantId,
            schoolId,
            status: 'PAID',
            paidDate: { gte: startOfDay },
          },
          _sum: { paidAmount: true },
        }),
        this.prisma.admission.count({
          where: {
            tenantId,
            schoolId,
            status: 'INQUIRY',
          },
        }),
        this.prisma.feeRecord.aggregate({
          where: {
            tenantId,
            schoolId,
            status: { in: ['PENDING', 'OVERDUE'] },
          },
          _sum: { totalAmount: true },
        }),
      ]);

      return [
        {
          title: 'Admissions Today',
          value: admissionsToday,
          icon: 'users-plus',
          color: 'blue',
        },
        {
          title: 'Fees Collected Today',
          value: `₹${(feesCollectedToday._sum?.paidAmount || 0).toString().substring(0, 8)}`,
          icon: 'cash',
          color: 'green',
        },
        {
          title: 'Pending Enquiries',
          value: pendingEnquiries,
          icon: 'message-circle',
          color: 'orange',
        },
        {
          title: 'Pending Fees',
          value: `₹${(pendingFees._sum?.totalAmount || 0).toString().substring(0, 8)}`,
          icon: 'alert-circle',
          color: 'red',
        },
      ];
    } catch (error) {
      this.logger.error('Error getting summary cards', error);
      throw error;
    }
  }

  /**
   * Get upcoming fees
   */
  async getUpcomingFees(
    tenantId: string,
    schoolId: string,
    days: number = 30,
  ): Promise<UpcomingFeeDto[]> {
    try {
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const upcomingRecords = await this.prisma.feeRecord.findMany({
        where: {
          tenantId,
          schoolId,
          status: 'PENDING',
          dueDate: {
            gte: now,
            lte: futureDate,
          },
        },
        select: {
          id: true,
          totalAmount: true,
          dueDate: true,
          student: {
            select: {
              firstName: true,
              lastName: true,
              enrollmentNo: true,
              class: {
                select: {
                  name: true,
                  section: true,
                },
              },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      // Group by class and due date
      const grouped = new Map<string, UpcomingFeeDto>();

      for (const record of upcomingRecords) {
        const classKey = `${record.student.class.name}-${record.student.class.section}`;
        const daysUntilDue = Math.ceil(
          (record.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (!grouped.has(classKey)) {
          grouped.set(classKey, {
            classSection: classKey,
            totalDue: new Decimal(0),
            studentCount: 0,
            dueDate: record.dueDate,
            daysUntilDue,
            details: [],
          });
        }

        const group = grouped.get(classKey)!;
        group.totalDue = group.totalDue.plus(record.totalAmount);
        group.studentCount += 1;
        group.details.push({
          studentName: `${record.student.firstName} ${record.student.lastName}`,
          studentEnrollmentNo: record.student.enrollmentNo,
          amount: record.totalAmount,
          dueDate: record.dueDate,
          daysUntilDue,
        });
      }

      return Array.from(grouped.values());
    } catch (error) {
      this.logger.error('Error getting upcoming fees', error);
      throw error;
    }
  }

  /**
   * Get fees by payment mode
   */
  async getFeesByPaymentMode(
    tenantId: string,
    schoolId: string,
    month: number,
    year: number,
  ) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      const data = await this.prisma.feeRecord.groupBy({
        by: ['paymentMode'],
        where: {
          tenantId,
          schoolId,
          status: 'PAID',
          paidDate: {
            gte: startDate,
            lt: endDate,
          },
        },
        _sum: { paidAmount: true },
        _count: { id: true },
      });

      return {
        month,
        year,
        paymentModes: data.map((d) => ({
          mode: d.paymentMode || 'Unknown',
          amount: d._sum?.paidAmount || new Decimal(0),
          count: d._count?.id || 0,
        })),
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting fees by payment mode', error);
      throw error;
    }
  }

  /**
   * Get admission pipeline
   */
  async getAdmissionPipeline(
    tenantId: string,
    schoolId: string,
  ): Promise<AdmissionPipelineDto> {
    try {
      const statuses = [
        'INQUIRY',
        'APPLIED',
        'SHORTLISTED',
        'ADMITTED',
        'REJECTED',
      ];
      const statusCounts = new Map<string, number>();
      const totalAdmissions = await this.prisma.admission.count({
        where: { tenantId, schoolId },
      });

      // Get counts by status
      for (const status of statuses) {
        const count = await this.prisma.admission.count({
          where: { tenantId, schoolId, status: status as any },
        });
        statusCounts.set(status, count);
      }

      // Build pipeline stages
      const stages: Record<string, AdmissionPipelineStageDto> = {};
      for (const [status, count] of statusCounts) {
        stages[status.toLowerCase()] = {
          status,
          count,
          percentage:
            totalAdmissions > 0 ? (count / totalAdmissions) * 100 : 0,
        };
      }

      // Calculate conversion rates
      const conversionRates: ConversionRateDto[] = [];
      const statusSequence = [
        'INQUIRY',
        'APPLIED',
        'SHORTLISTED',
        'ADMITTED',
      ];
      for (let i = 0; i < statusSequence.length - 1; i++) {
        const from = statusSequence[i];
        const to = statusSequence[i + 1];
        const fromCount = statusCounts.get(from) || 0;
        const toCount = statusCounts.get(to) || 0;
        const rate =
          fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0;

        conversionRates.push({
          from,
          to,
          rate,
          count: toCount,
        });
      }

      return {
        inquiry: stages['inquiry'] || { status: 'INQUIRY', count: 0, percentage: 0 },
        applied: stages['applied'] || { status: 'APPLIED', count: 0, percentage: 0 },
        shortlisted: stages['shortlisted'] || {
          status: 'SHORTLISTED',
          count: 0,
          percentage: 0,
        },
        admitted: stages['admitted'] || {
          status: 'ADMITTED',
          count: 0,
          percentage: 0,
        },
        rejected: stages['rejected'] || {
          status: 'REJECTED',
          count: 0,
          percentage: 0,
        },
        conversionRates,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting admission pipeline', error);
      throw error;
    }
  }

  /**
   * Get admissions by class
   */
  async getAdmissionsByClass(
    tenantId: string,
    schoolId: string,
  ) {
    try {
      const classes = await this.prisma.classMaster.findMany({
        where: {
          schoolId,
        },
        select: {
          id: true,
          name: true,
          section: true,
          totalCapacity: true,
          students: {
            where: {
              tenantId,
              status: 'ACTIVE',
            },
            select: {
              id: true,
            },
          },
        },
      });

      return classes.map((cls) => ({
        classSection: `${cls.name} - ${cls.section}`,
        totalCapacity: cls.totalCapacity,
        enrolledStudents: cls.students.length,
        vacancyPercentage:
          cls.totalCapacity > 0
            ? ((cls.totalCapacity - cls.students.length) / cls.totalCapacity) *
              100
            : 0,
      }));
    } catch (error) {
      this.logger.error('Error getting admissions by class', error);
      throw error;
    }
  }

  // ===== HELPER METHODS =====

  /**
   * Get pending tasks data
   */
  private async getPendingTasksData(
    tenantId: string,
    schoolId: string,
  ): Promise<PendingTaskDto[]> {
    try {
      const now = new Date();
      const pendingEnquiries = await this.prisma.admission.findMany({
        where: {
          tenantId,
          schoolId,
          status: 'INQUIRY',
        },
        select: {
          id: true,
          candidateName: true,
          appliedAt: true,
        },
        orderBy: { appliedAt: 'asc' },
        take: 10,
      });

      return pendingEnquiries.map((e) => {
        const daysSincePending = Math.floor(
          (now.getTime() - e.appliedAt.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          id: e.id,
          type: 'pending_enquiry',
          targetId: e.id,
          targetName: e.candidateName,
          description: `Pending admission enquiry`,
          daysSincePending,
          priority:
            daysSincePending > 7 ? 'high' : daysSincePending > 3 ? 'medium' : 'low',
          createdAt: e.appliedAt,
        };
      });
    } catch (error) {
      this.logger.error('Error getting pending tasks data', error);
      return [];
    }
  }

  /**
   * Get conversion trend data
   */
  private async getConversionTrend(
    tenantId: string,
    schoolId: string,
    months: number,
  ) {
    // Would need date-based grouping in production
    return [];
  }

  // ===== CHART DATA METHODS =====

  private async getAdmissionsChartData(
    tenantId: string,
    schoolId: string,
    period: 'week' | 'month' | 'quarter',
  ): Promise<ChartDataDto> {
    // TODO: Implement based on period
    return {
      title: 'Admissions',
      labels: [],
      datasets: [],
    };
  }

  private async getFeesCollectionChartData(
    tenantId: string,
    schoolId: string,
    period: 'week' | 'month' | 'quarter',
  ): Promise<ChartDataDto> {
    // TODO: Implement based on period
    return {
      title: 'Fees Collection',
      labels: [],
      datasets: [],
    };
  }

  private async getFeeStatusChartData(
    tenantId: string,
    schoolId: string,
  ): Promise<PieChartDataDto> {
    const statuses = await this.prisma.feeRecord.groupBy({
      by: ['status'],
      where: { tenantId, schoolId },
      _count: { id: true },
    });

    return {
      title: 'Fee Status Distribution',
      labels: statuses.map((s) => s.status),
      data: statuses.map((s) => s._count?.id || 0),
    };
  }

  private async getAdmissionStatusChartData(
    tenantId: string,
    schoolId: string,
  ): Promise<PieChartDataDto> {
    const statuses = await this.prisma.admission.groupBy({
      by: ['status'],
      where: { tenantId, schoolId },
      _count: { id: true },
    });

    return {
      title: 'Admission Status Distribution',
      labels: statuses.map((s) => s.status),
      data: statuses.map((s) => s._count?.id || 0),
    };
  }

  private async getClassWiseAdmissionsChartData(
    tenantId: string,
    schoolId: string,
  ): Promise<BarChartDataDto> {
    const classes = await this.prisma.classMaster.findMany({
      where: { schoolId },
      select: {
        name: true,
        section: true,
        students: {
          where: { tenantId, status: 'ACTIVE' },
          select: { id: true },
        },
      },
    });

    return {
      title: 'Class-wise Student Enrollment',
      labels: classes.map((c) => `${c.name} - ${c.section}`),
      datasets: [
        {
          label: 'Enrolled Students',
          data: classes.map((c) => c.students.length),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  }

  private async getFeeTrendChartData(
    tenantId: string,
    schoolId: string,
    period: 'week' | 'month' | 'quarter',
  ): Promise<ChartDataDto> {
    // TODO: Implement based on period
    return {
      title: 'Fee Collection Trend',
      labels: [],
      datasets: [],
    };
  }
}
