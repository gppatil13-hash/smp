'use client';

import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import DashboardAPI from '@/services/dashboard.service';

interface FeeMetrics {
  collectedToday: string;
  collectedThisMonth: string;
  collectedThisYear: string;
  pendingTotal: string;
  overdueTotal: string;
  pendingRecordCount: number;
  overdueRecordCount: number;
  collectionRate: number;
  byPaymentMode: Array<{
    mode: string;
    amount: string;
    count: number;
    percentage: number;
  }>;
  byClass: Array<{
    classSection: string;
    collected: string;
    pending: string;
    overdue: string;
    collectionRate: number;
  }>;
}

interface FeesWidgetProps {
  schoolId: string;
}

const FeesWidget: React.FC<FeesWidgetProps> = ({ schoolId }) => {
  const [metrics, setMetrics] = useState<FeeMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeeMetrics();
  }, [schoolId]);

  const loadFeeMetrics = async () => {
    try {
      setLoading(true);
      const data = await DashboardAPI.getFeeMetrics(schoolId);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading fee metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string): string => {
    const num = parseFloat(value);
    if (num >= 1000000) {
      return `₹${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `₹${(num / 1000).toFixed(1)}K`;
    }
    return `₹${num.toFixed(0)}`;
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
          <div className="rounded-lg bg-green-100 p-3">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Fee Collection
            </h3>
            <p className="text-sm text-gray-600">
              Collection rate: {metrics.collectionRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1 rounded-lg bg-green-50 p-4">
          <p className="text-xs font-medium text-gray-600">Collected Today</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(metrics.collectedToday)}
          </p>
        </div>
        <div className="space-y-1 rounded-lg bg-blue-50 p-4">
          <p className="text-xs font-medium text-gray-600">This Month</p>
          <p className="text-xl font-bold text-blue-600">
            {formatCurrency(metrics.collectedThisMonth)}
          </p>
        </div>
        <div className="space-y-1 rounded-lg bg-purple-50 p-4">
          <p className="text-xs font-medium text-gray-600">This Year</p>
          <p className="text-xl font-bold text-purple-600">
            {formatCurrency(metrics.collectedThisYear)}
          </p>
        </div>
      </div>

      {/* Pending and Overdue */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Outstanding</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">Pending Fees</p>
                <p className="text-sm text-orange-700">
                  {metrics.pendingRecordCount} records
                </p>
              </div>
            </div>
            <p className="text-lg font-bold text-orange-600">
              {formatCurrency(metrics.pendingTotal)}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Overdue Fees</p>
                <p className="text-sm text-red-700">
                  {metrics.overdueRecordCount} records
                </p>
              </div>
            </div>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(metrics.overdueTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Mode Breakdown */}
      {metrics.byPaymentMode.length > 0 && (
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700">
            Payment Mode (This Month)
          </p>
          <div className="space-y-2">
            {metrics.byPaymentMode.map((mode) => (
              <div key={mode.mode}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{mode.mode}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(mode.amount)} ({mode.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${mode.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesWidget;
