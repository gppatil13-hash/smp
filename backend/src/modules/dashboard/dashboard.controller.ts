import {
  Controller,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetTenantId } from '../../common/decorators/get-tenant-id.decorator';
import { DashboardService } from './dashboard.service';
import {
  DashboardOverviewDto,
  AdmissionMetricsDto,
  FeeMetricsDto,
  PaymentMetricsDto,
  CommunicationMetricsDto,
  DashboardChartsDto,
} from './dto/dashboard.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get complete dashboard overview with all key metrics
   * Returns: Admissions Today, This Month, Pending Enquiries, Fees, Payments, etc.
   */
  @Get('overview')
  @HttpCode(HttpStatus.OK)
  async getOverview(
    @GetTenantId() tenantId: string,
    @Req() req: any,
    @Query('schoolId') schoolId?: string,
    @Query('period') period: 'today' | 'week' | 'month' = 'month',
  ): Promise<DashboardOverviewDto> {
    return this.dashboardService.getDashboardOverview(
      tenantId,
      schoolId || req.user.schoolId,
      period,
    );
  }

  /**
   * Get admissions metrics with breakdown by status
   */
  @Get('admissions')
  @HttpCode(HttpStatus.OK)
  async getAdmissionMetrics(
    @GetTenantId() tenantId: string,
    @Req() req: any,
    @Query('schoolId') schoolId?: string,
  ): Promise<AdmissionMetricsDto> {
    return this.dashboardService.getAdmissionMetrics(
      tenantId,
      schoolId || req.user.schoolId,
    );
  }

  /**
   * Get fees collection metrics
   */
  @Get('fees')
  @HttpCode(HttpStatus.OK)
  async getFeeMetrics(
    @GetTenantId() tenantId: string,
    @Req() req: any,
    @Query('schoolId') schoolId?: string,
  ): Promise<FeeMetricsDto> {
    return this.dashboardService.getFeeMetrics(
      tenantId,
      schoolId || req.user.schoolId,
    );
  }

  /**
   * Get recent payments with details
   */
  @Get('payments/recent')
  @HttpCode(HttpStatus.OK)
  async getRecentPayments(
    @GetTenantId() tenantId: string,
    @Req() req: any,
    @Query('schoolId') schoolId?: string,
    @Query('limit') limit: string = '10',
  ): Promise<PaymentMetricsDto> {
    return this.dashboardService.getRecentPayments(
      tenantId,
      schoolId || req.user.schoolId,
      parseInt(limit, 10),
    );
  }

  /**
   * Get pending follow-up tasks (enquiries, incomplete profiles, etc.)
   */
  @Get('tasks/pending')
  @HttpCode(HttpStatus.OK)
  async getPendingTasks(
    @GetTenantId() tenantId: string,
    @Req() req: any,
    @Query('schoolId') schoolId?: string,
  ): Promise<CommunicationMetricsDto> {
    return this.dashboardService.getPendingTasks(
      tenantId,
      schoolId || req.user.schoolId,
    );
  }

  /**
   * Get chart data for visualizations
   */
  @Get('charts')
  @HttpCode(HttpStatus.OK)
  async getChartData(
    @GetTenantId() tenantId: string,
    @Req() req: any,
    @Query('schoolId') schoolId?: string,
    @Query('period') period: 'week' | 'month' | 'quarter' = 'month',
  ): Promise<DashboardChartsDto> {
    return this.dashboardService.getChartData(
      tenantId,
      schoolId || req.user.schoolId,
      period,
    );
  }

  /**
   * Get summary card data (admissions today, fees collected, pending, etc.)
   */
  @Get('summary-cards')
  @HttpCode(HttpStatus.OK)
  async getSummaryCards(
    @GetTenantId() tenantId: string,
    @Req() req: any,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.dashboardService.getSummaryCards(
      tenantId,
      schoolId || req.user.schoolId,
    );
  }

  /**
   * Get upcoming fees due in next 7, 14, 30 days
   */
  @Get('fees/upcoming')
  @HttpCode(HttpStatus.OK)
  async getUpcomingFees(
    @GetTenantId() tenantId: string,
    @Req() req: any,
    @Query('schoolId') schoolId?: string,
    @Query('days') days: string = '30',
  ) {
    return this.dashboardService.getUpcomingFees(
      tenantId,
      schoolId || req.user.schoolId,
      parseInt(days, 10),
    );
  }

  /**
   * Get fee collection by payment mode (Cash, Card, Transfer, etc.)
   */
  @Get('fees/by-mode')
  @HttpCode(HttpStatus.OK)
  async getFeesByPaymentMode(
    @GetTenantId() tenantId: string,
    @Req() req: any,
    @Query('schoolId') schoolId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.dashboardService.getFeesByPaymentMode(
      tenantId,
      schoolId || req.user.schoolId,
      month ? parseInt(month, 10) : new Date().getMonth() + 1,
      year ? parseInt(year, 10) : new Date().getFullYear(),
    );
  }

  /**
   * Get admission pipeline visualization data
   */
  @Get('admissions/pipeline')
  @HttpCode(HttpStatus.OK)
  async getAdmissionPipeline(
    @GetTenantId() tenantId: string,
    @Req() req: any,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.dashboardService.getAdmissionPipeline(
      tenantId,
      schoolId || req.user.schoolId,
    );
  }

  /**
   * Get class-wise admission statistics
   */
  @Get('admissions/by-class')
  @HttpCode(HttpStatus.OK)
  async getAdmissionsByClass(
    @GetTenantId() tenantId: string,
    @Req() req: any,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.dashboardService.getAdmissionsByClass(
      tenantId,
      schoolId || req.user.schoolId,
    );
  }
}
