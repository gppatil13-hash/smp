import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardAPI from '@/services/dashboard.service';
import SummaryCards from '@/components/dashboard/SummaryCards';
import AdmissionsWidget from '@/components/dashboard/AdmissionsWidget';
import FeesWidget from '@/components/dashboard/FeesWidget';
import RecentPaymentsWidget from '@/components/dashboard/RecentPaymentsWidget';
import PendingTasksWidget from '@/components/dashboard/PendingTasksWidget';
import AdmissionChartsWidget from '@/components/dashboard/AdmissionChartsWidget';
import FeesChartsWidget from '@/components/dashboard/FeesChartsWidget';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorAlert from '@/components/common/ErrorAlert';

interface DashboardState {
  loading: boolean;
  error: string | null;
  adminLevel: 'school' | 'principal' | 'admin';
}

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { schoolId } = router.query;
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    adminLevel: 'school',
  });
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timer | null>(
    null,
  );

  useEffect(() => {
    // Determine admin level from user context
    // This would come from your auth context
    setState((prev) => ({ ...prev, adminLevel: 'school' }));
  }, []);

  useEffect(() => {
    if (!schoolId || !state.adminLevel) return;

    // Load initial data
    loadDashboardData();

    // Set auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [schoolId, state.adminLevel]);

  const loadDashboardData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      // Data will be fetched by child components using the hooks
      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load dashboard';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
    }
  };

  const handleRetry = () => {
    loadDashboardData();
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (state.loading && !schoolId) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here's your school performance overview.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Error Alert */}
      {state.error && (
        <ErrorAlert message={state.error} onRetry={handleRetry} />
      )}

      {/* Summary Cards */}
      {schoolId && <SummaryCards schoolId={schoolId as string} />}

      {/* Main Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2">
          {/* Admissions Widget */}
          {schoolId && (
            <AdmissionsWidget schoolId={schoolId as string} />
          )}

          {/* Fees Collection Widget */}
          <div className="mt-8">
            {schoolId && (
              <FeesWidget schoolId={schoolId as string} />
            )}
          </div>

          {/* Charts */}
          <div className="mt-8">
            {schoolId && (
              <div className="space-y-8">
                <AdmissionChartsWidget schoolId={schoolId as string} />
                <FeesChartsWidget schoolId={schoolId as string} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-8">
          {/* Recent Payments Widget */}
          {schoolId && (
            <RecentPaymentsWidget schoolId={schoolId as string} />
          )}

          {/* Pending Tasks Widget */}
          {schoolId && (
            <PendingTasksWidget schoolId={schoolId as string} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-gray-200 pt-8 text-center text-gray-600">
        <p>
          Last updated:{' '}
          {new Date().toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
