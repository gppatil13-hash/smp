'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader, StatsCard, Badge } from '@/components/common'
import {
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const admissionTrendData = [
  { month: 'Jan', enquiries: 45, admitted: 12 },
  { month: 'Feb', enquiries: 52, admitted: 15 },
  { month: 'Mar', enquiries: 48, admitted: 14 },
  { month: 'Apr', enquiries: 61, admitted: 18 },
  { month: 'May', enquiries: 55, admitted: 16 },
  { month: 'Jun', enquiries: 67, admitted: 20 },
]

const feeCollectionData = [
  { month: 'Jan', collected: 120000, pending: 25000 },
  { month: 'Feb', collected: 135000, pending: 18000 },
  { month: 'Mar', collected: 142000, pending: 22000 },
  { month: 'Apr', collected: 158000, pending: 15000 },
  { month: 'May', collected: 165000, pending: 12000 },
  { month: 'Jun', collected: 172000, pending: 10000 },
]

const recentAdmissions = [
  { id: 1, name: 'Sarah Johnson', class: '10-A', status: 'Admitted', date: '2024-03-15' },
  { id: 2, name: 'Mike Chen', class: '9-B', status: 'Pending', date: '2024-03-14' },
  { id: 3, name: 'Emma Wilson', class: '11-A', status: 'Admitted', date: '2024-03-13' },
  { id: 4, name: 'John Smith', class: '10-A', status: 'Rejected', date: '2024-03-12' },
  { id: 5, name: 'Lisa Brown', class: '9-C', status: 'Pending', date: '2024-03-11' },
]

const overdueFees = [
  { id: 1, student: 'Alex Kumar', amount: 15000, days: 30, status: 'Critical' },
  { id: 2, student: 'Priya Sharma', amount: 8500, days: 20, status: 'High' },
  { id: 3, student: 'Ravi Patel', amount: 12000, days: 15, status: 'Medium' },
]

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <PageHeader
          title="Dashboard"
          description="Welcome back! Here's what's happening with your school today."
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            label="Total Students"
            value="1,248"
            change="12% from last month"
            trend="up"
            icon={<Users size={24} />}
            color="primary"
          />
          <StatsCard
            label="Active Admissions"
            value="84"
            change="5% from last month"
            trend="up"
            icon={<GraduationCap size={24} />}
            color="success"
          />
          <StatsCard
            label="Fee Collection"
            value="₹2.4M"
            change="8% improvement"
            trend="up"
            icon={<DollarSign size={24} />}
            color="warning"
          />
          <StatsCard
            label="Conversion Rate"
            value="68%"
            change="↑ 5% from target"
            trend="up"
            icon={<TrendingUp size={24} />}
            color="danger"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Admission Trends */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Admission Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={admissionTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="enquiries"
                  stroke="#1e88e5"
                  strokeWidth={2}
                  dot={{ fill: '#1e88e5' }}
                />
                <Line
                  type="monotone"
                  dataKey="admitted"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Fee Collection */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Fee Collection</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={feeCollectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="collected" fill="#10b981" />
                <Bar dataKey="pending" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Admissions */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">Recent Admissions</h2>
              <a href="/admissions" className="text-primary-600 text-sm font-medium hover:text-primary-700">
                View All →
              </a>
            </div>
            <div className="space-y-4">
              {recentAdmissions.map((admission) => (
                <div
                  key={admission.id}
                  className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">{admission.name}</p>
                    <p className="text-xs text-neutral-500">{admission.class} • {admission.date}</p>
                  </div>
                  <Badge
                    variant={
                      admission.status === 'Admitted' ? 'success' :
                      admission.status === 'Pending' ? 'warning' : 'danger'
                    }
                  >
                    {admission.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue Fees Alert */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">Overdue Fees Alert</h2>
              <a href="/fees" className="text-primary-600 text-sm font-medium hover:text-primary-700">
                View All →
              </a>
            </div>
            <div className="space-y-4">
              {overdueFees.map((fee) => (
                <div
                  key={fee.id}
                  className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-danger-500" />
                      <p className="font-medium text-neutral-900">{fee.student}</p>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">₹{fee.amount.toLocaleString()} • {fee.days} days overdue</p>
                  </div>
                  <Badge variant={
                    fee.status === 'Critical' ? 'danger' :
                    fee.status === 'High' ? 'warning' : 'neutral'
                  }>
                    {fee.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
