'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common'
import { Download, Filter } from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const admissionData = [
  { month: 'January', enquiries: 45, conversions: 12 },
  { month: 'February', enquiries: 52, conversions: 15 },
  { month: 'March', enquiries: 48, conversions: 14 },
  { month: 'April', enquiries: 61, conversions: 18 },
  { month: 'May', enquiries: 55, conversions: 16 },
  { month: 'June', enquiries: 67, conversions: 20 },
]

const classDistribution = [
  { name: 'Class 9', value: 245 },
  { name: 'Class 10', value: 312 },
  { name: 'Class 11', value: 298 },
  { name: 'Class 12', value: 393 },
]

const colors = ['#1e88e5', '#10b981', '#f59e0b', '#ef4444']

const performanceData = [
  { subject: 'Mathematics', average: 78, target: 85 },
  { subject: 'English', average: 72, target: 80 },
  { subject: 'Science', average: 82, target: 85 },
  { subject: 'Social Studies', average: 75, target: 80 },
  { subject: 'Hindi', average: 80, target: 85 },
]

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('month')

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <PageHeader
          title="Reports & Analytics"
          description="Comprehensive school analytics and performance reports"
          action={
            <div className="flex gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-700"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <button className="btn-secondary">
                <Download size={20} />
                Export
              </button>
            </div>
          }
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Admission Conversion Trends */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Admission Conversion Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={admissionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="enquiries" fill="#1e88e5" name="Enquiries" />
                <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Class Distribution */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Student Distribution by Class</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={classDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {colors.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Academic Performance */}
          <div className="card p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Subject-wise Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="subject" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#1e88e5"
                  strokeWidth={2}
                  name="Class Average"
                  dot={{ fill: '#1e88e5' }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Target Average"
                  dot={{ fill: '#10b981' }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-6">Key Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Conversion Rate', value: '68%', change: '+5% from last month' },
              { label: 'Attendance Rate', value: '94%', change: '+2% from last month' },
              { label: 'Fee Collection', value: '91%', change: '+8% from last month' },
              { label: 'Pass Rate', value: '96%', change: '+1% from last year' },
            ].map((metric, i) => (
              <div key={i} className="border border-neutral-200 rounded-lg p-4">
                <p className="text-sm text-neutral-600 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-neutral-900">{metric.value}</p>
                <p className="text-xs text-success-600 mt-2">{metric.change}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
