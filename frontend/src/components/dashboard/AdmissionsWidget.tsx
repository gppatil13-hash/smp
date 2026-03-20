'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Users } from 'lucide-react';
import DashboardAPI from '@/services/dashboard.service';

interface AdmissionMetrics {
  today: number;
  thisMonth: number;
  thisQuarter: number;
  thisYear: number;
  totalApplications: number;
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  inquiryConversionRate: number;
}

interface AdmissionsWidgetProps {
  schoolId: string;
}

const AdmissionsWidget: React.FC<AdmissionsWidgetProps> = ({ schoolId }) => {
  const [metrics, setMetrics] = useState<AdmissionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'month' | 'quarter' | 'year'>(
    'month',
  );

  useEffect(() => {
    loadAdmissionMetrics();
  }, [schoolId, period]);

  const loadAdmissionMetrics = async () => {
    try {
      setLoading(true);
      const data = await DashboardAPI.getAdmissionMetrics(schoolId);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading admission metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodValue = (): number => {
    switch (period) {
      case 'today':
        return metrics?.today || 0;
      case 'month':
        return metrics?.thisMonth || 0;
      case 'quarter':
        return metrics?.thisQuarter || 0;
      case 'year':
        return metrics?.thisYear || 0;
      default:
        return 0;
    }
  };

  if (loading || !metrics) {
    return (
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-12 w-24 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-3">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Admissions</h3>
            <p className="text-sm text-gray-600">Admission pipeline overview</p>
          </div>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 border-b border-gray-100">
        {(['today', 'month', 'quarter', 'year'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 font-medium transition-colors ${
              period === p
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Metrics */}
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Applications {period}
            </p>
            <p className="mt-1 text-4xl font-bold text-gray-900">
              {getPeriodValue()}
            </p>
          </div>
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
            <TrendingUp className="inline-block h-4 w-4 mr-1" />
            {metrics.inquiryConversionRate}% conversion
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-3 pt-4">
          <p className="text-sm font-medium text-gray-700">Status Breakdown</p>
          {metrics.byStatus.map((status) => (
            <div key={status.status}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">{status.status}</span>
                <span className="text-sm font-medium text-gray-900">
                  {status.count} ({status.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${status.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-600">Total This Year</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {metrics.thisYear}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-600">
              Total Applications
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {metrics.totalApplications}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionsWidget;
