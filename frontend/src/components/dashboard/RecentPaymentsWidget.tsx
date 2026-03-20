'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import DashboardAPI from '@/services/dashboard.service';

interface Payment {
  id: string;
  studentName: string;
  studentEnrollmentNo: string;
  amount: string;
  paymentMode: string;
  paidAt: string;
  status: string;
  transactionId?: string;
}

interface RecentPaymentsWidgetProps {
  schoolId: string;
}

const RecentPaymentsWidget: React.FC<RecentPaymentsWidgetProps> = ({
  schoolId,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(5);

  useEffect(() => {
    loadRecentPayments();
  }, [schoolId, limit]);

  const loadRecentPayments = async () => {
    try {
      setLoading(true);
      const data = await DashboardAPI.getRecentPayments(schoolId, limit);
      setPayments(data.recentPayments || []);
    } catch (error) {
      console.error('Error loading recent payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string): string => {
    const num = parseFloat(value);
    return `₹${num.toFixed(0)}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentModeIcon = (mode: string) => {
    const modeMap: { [key: string]: string } = {
      CASH: '💵',
      CHEQUE: '📄',
      BANK_TRANSFER: '🏦',
      DEBIT_CARD: '💳',
      CREDIT_CARD: '💳',
      UPI: '📱',
    };
    return modeMap[mode] || '💸';
  };

  if (loading) {
    return (
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-3">
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Payments
            </h3>
            <p className="text-sm text-gray-600">Latest transactions</p>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="space-y-3">
        {payments.length > 0 ? (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1 text-2xl">
                    {getPaymentModeIcon(payment.paymentMode)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {payment.studentName}
                    </p>
                    <p className="text-xs text-gray-600">
                      {payment.studentEnrollmentNo}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {payment.paymentMode} •{' '}
                      {formatDate(payment.paidAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(payment.amount)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">
                      Paid
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            <p>No recent payments</p>
          </div>
        )}
      </div>

      {/* Footer Link */}
      <a
        href="#"
        className="block text-center pt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        View All Payments →
      </a>
    </div>
  );
};

export default RecentPaymentsWidget;
