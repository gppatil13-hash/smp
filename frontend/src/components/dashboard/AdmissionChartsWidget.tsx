'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, PieChart } from 'lucide-react';
import DashboardAPI from '@/services/dashboard.service';

interface AdmissionPipelineStage {
  status: string;
  count: number;
  percentage: number;
}

interface ConversionRate {
  from: string;
  to: string;
  rate: number;
  count: number;
}

interface AdmissionChartData {
  inquiry: AdmissionPipelineStage;
  applied: AdmissionPipelineStage;
  shortlisted: AdmissionPipelineStage;
  admitted: AdmissionPipelineStage;
  rejected: AdmissionPipelineStage;
  conversionRates: ConversionRate[];
}

interface AdmissionChartsWidgetProps {
  schoolId: string;
}

const AdmissionChartsWidget: React.FC<AdmissionChartsWidgetProps> = ({
  schoolId,
}) => {
  const [data, setData] = useState<AdmissionChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'pipeline' | 'conversion'>(
    'pipeline',
  );

  useEffect(() => {
    loadAdmissionPipeline();
  }, [schoolId]);

  const loadAdmissionPipeline = async () => {
    try {
      setLoading(true);
      const pipelineData = await DashboardAPI.getAdmissionPipeline(schoolId);
      setData(pipelineData);
    } catch (error) {
      console.error('Error loading admission pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-48 w-full animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const pipelineStages = [
    data.inquiry,
    data.applied,
    data.shortlisted,
    data.admitted,
    data.rejected,
  ];

  const maxCount = Math.max(...pipelineStages.map((s) => s.count), 1);

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Admission Pipeline
            </h3>
            <p className="text-sm text-gray-600">
              Status distribution and conversion rates
            </p>
          </div>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex gap-2 border-b border-gray-100">
        {(['pipeline', 'conversion'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`px-4 py-2 font-medium transition-colors ${
              chartType === type
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {type === 'pipeline' ? 'Pipeline' : 'Conversion Rates'}
          </button>
        ))}
      </div>

      {/* Pipeline Chart */}
      {chartType === 'pipeline' && (
        <div className="space-y-4">
          {pipelineStages.map((stage) => (
            <div key={stage.status}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">
                  {stage.status}
                </span>
                <span className="text-sm text-gray-600">
                  {stage.count} ({stage.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="relative h-8 overflow-hidden rounded-lg bg-gray-100">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 flex items-center justify-end pr-3"
                  style={{
                    width: `${(stage.count / maxCount) * 100}%`,
                  }}
                >
                  {stage.count > 0 && (
                    <span className="text-sm font-bold text-white">
                      {stage.count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conversion Rates Chart */}
      {chartType === 'conversion' && (
        <div className="space-y-4">
          {data.conversionRates.map((cr, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">
                  {cr.from} → {cr.to}
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {cr.rate}%
                </span>
              </div>
              <div className="relative h-8 overflow-hidden rounded-lg bg-gray-100">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300 flex items-center justify-end pr-3"
                  style={{
                    width: `${cr.rate}%`,
                  }}
                >
                  {cr.rate > 10 && (
                    <span className="text-sm font-bold text-white">
                      {cr.count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-xs font-medium text-gray-600">Total Applications</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {pipelineStages.reduce((sum, s) => sum + s.count, 0)}
          </p>
        </div>
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-xs font-medium text-gray-600">Conversion Rate</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {data.conversionRates[data.conversionRates.length - 1]?.rate || 0}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdmissionChartsWidget;
