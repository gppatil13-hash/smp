'use client';

import React, { useEffect, useState } from 'react';
import { PieChart, TrendingUp } from 'lucide-react';
import DashboardAPI from '@/services/dashboard.service';

interface ChartData {
  title: string;
  labels: string[];
  data: (number | string)[];
  backgroundColor?: string[];
}

interface FeesChartsWidgetProps {
  schoolId: string;
}

const FeesChartsWidget: React.FC<FeesChartsWidgetProps> = ({ schoolId }) => {
  const [feeStatusChart, setFeeStatusChart] = useState<ChartData | null>(null);
  const [classWiseChart, setClassWiseChart] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'status' | 'class'>('status');

  useEffect(() => {
    loadChartsData();
  }, [schoolId]);

  const loadChartsData = async () => {
    try {
      setLoading(true);
      const chartsData = await DashboardAPI.getChartData(schoolId);

      setFeeStatusChart({
        title: chartsData.feeStatusChart.title,
        labels: chartsData.feeStatusChart.labels,
        data: chartsData.feeStatusChart.data,
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(244, 67, 54, 0.8)',
          'rgba(76, 175, 80, 0.8)',
        ],
      });

      setClassWiseChart({
        title: chartsData.classWiseAdmissionsChart.title,
        labels: chartsData.classWiseAdmissionsChart.labels,
        data: chartsData.classWiseAdmissionsChart.datasets[0]?.data || [],
      });
    } catch (error) {
      console.error('Error loading charts data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-64 w-full animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  const currentChart = chartType === 'status' ? feeStatusChart : classWiseChart;

  if (!currentChart) {
    return null;
  }

  // Calculate pie chart segments
  const total = (currentChart.data as number[]).reduce(
    (sum, val) => sum + (typeof val === 'number' ? val : 0),
    0,
  );

  const formatPercentage = (value: number): number => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-3">
            <PieChart className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Fee Analysis
            </h3>
            <p className="text-sm text-gray-600">Distribution and insights</p>
          </div>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex gap-2 border-b border-gray-100">
        {(['status', 'class'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`px-4 py-2 font-medium transition-colors ${
              chartType === type
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {type === 'status' ? 'Fee Status' : 'Class-wise'}
          </button>
        ))}
      </div>

      {/* Chart Visualization */}
      <div className="space-y-4">
        {/* Simple Pie-like visualization using bars */}
        <div className="space-y-3">
          {currentChart.labels.map((label, index) => {
            const value = typeof currentChart.data[index] === 'number' 
              ? (currentChart.data[index] as number)
              : parseInt(currentChart.data[index] as string, 10);
            const percentage = formatPercentage(value);
            const colors = currentChart.backgroundColor || [
              'bg-blue-500',
              'bg-green-500',
              'bg-orange-500',
              'bg-red-500',
              'bg-purple-500',
              'bg-indigo-500',
            ];
            const bgColor = colors[index % colors.length];
            const colorClass = bgColor.replace('bg-', 'text-').replace('500', '600');

            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{label}</span>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${colorClass}`}>
                      {value}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {percentage}%
                    </span>
                  </div>
                </div>
                <div className="relative h-6 overflow-hidden rounded-lg bg-gray-100">
                  <div
                    className={`absolute left-0 top-0 h-full ${bgColor} transition-all duration-300 flex items-center justify-end pr-2`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  >
                    {percentage > 15 && (
                      <span className="text-xs font-bold text-white">
                        {percentage}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-medium text-gray-600 mb-3">Legend</p>
        <div className="grid grid-cols-2 gap-2">
          {currentChart.labels.map((label, index) => {
            const colors = [
              'bg-blue-500',
              'bg-green-500',
              'bg-orange-500',
              'bg-red-500',
              'bg-purple-500',
            ];
            const bgColor = colors[index % colors.length];

            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${bgColor}`} />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stat */}
      <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4">
        <p className="text-sm font-medium text-gray-600">Total</p>
        <p className="mt-1 text-3xl font-bold text-purple-600">{total}</p>
      </div>
    </div>
  );
};

export default FeesChartsWidget;
