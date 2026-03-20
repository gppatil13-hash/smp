import api from '@/lib/api-client';

class DashboardAPI {
  /**
   * Get complete dashboard overview
   */
  static async getDashboardOverview(
    schoolId: string,
    period: 'today' | 'week' | 'month' = 'month',
  ) {
    const response = await api.get('/dashboard/overview', {
      params: { schoolId, period },
    });
    return response.data;
  }

  /**
   * Get admission metrics
   */
  static async getAdmissionMetrics(schoolId: string) {
    const response = await api.get('/dashboard/admissions', {
      params: { schoolId },
    });
    return response.data;
  }

  /**
   * Get fee metrics
   */
  static async getFeeMetrics(schoolId: string) {
    const response = await api.get('/dashboard/fees', {
      params: { schoolId },
    });
    return response.data;
  }

  /**
   * Get recent payments
   */
  static async getRecentPayments(schoolId: string, limit: number = 10) {
    const response = await api.get('/dashboard/payments/recent', {
      params: { schoolId, limit },
    });
    return response.data;
  }

  /**
   * Get pending tasks
   */
  static async getPendingTasks(schoolId: string) {
    const response = await api.get('/dashboard/tasks/pending', {
      params: { schoolId },
    });
    return response.data;
  }

  /**
   * Get chart data
   */
  static async getChartData(
    schoolId: string,
    period: 'week' | 'month' | 'quarter' = 'month',
  ) {
    const response = await api.get('/dashboard/charts', {
      params: { schoolId, period },
    });
    return response.data;
  }

  /**
   * Get summary cards
   */
  static async getSummaryCards(schoolId: string) {
    const response = await api.get('/dashboard/summary-cards', {
      params: { schoolId },
    });
    return response.data;
  }

  /**
   * Get upcoming fees
   */
  static async getUpcomingFees(schoolId: string, days: number = 30) {
    const response = await api.get('/dashboard/fees/upcoming', {
      params: { schoolId, days },
    });
    return response.data;
  }

  /**
   * Get fees by payment mode
   */
  static async getFeesByPaymentMode(
    schoolId: string,
    month?: number,
    year?: number,
  ) {
    const response = await api.get('/dashboard/fees/by-mode', {
      params: { schoolId, month, year },
    });
    return response.data;
  }

  /**
   * Get admission pipeline
   */
  static async getAdmissionPipeline(schoolId: string) {
    const response = await api.get('/dashboard/admissions/pipeline', {
      params: { schoolId },
    });
    return response.data;
  }

  /**
   * Get admissions by class
   */
  static async getAdmissionsByClass(schoolId: string) {
    const response = await api.get('/dashboard/admissions/by-class', {
      params: { schoolId },
    });
    return response.data;
  }
}

export default DashboardAPI;
