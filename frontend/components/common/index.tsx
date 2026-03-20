'use client'

import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
        {description && (
          <p className="text-neutral-600 mt-1">{description}</p>
        )}
      </div>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  )
}

interface StatsCardProps {
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down'
  icon?: ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

export function StatsCard({ label, value, change, trend, icon, color = 'primary' }: StatsCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
  }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-neutral-600 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{value}</p>
          {change && (
            <p className={`text-xs mt-2 ${trend === 'up' ? 'text-success-600' : 'text-danger-600'}`}>
              {trend === 'up' ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
  children: ReactNode
}

export function Badge({ variant = 'primary', children }: BadgeProps) {
  const variants = {
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-warning-50 text-warning-700',
    danger: 'bg-danger-50 text-danger-700',
    neutral: 'bg-neutral-100 text-neutral-700',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  )
}

interface TableProps {
  headers: string[]
  children: ReactNode
}

export function Table({ headers, children }: TableProps) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {children}
        </tbody>
      </table>
    </div>
  )
}

export function TableRow({
  children,
  onClick,
}: {
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <tr
      className={`${onClick ? 'cursor-pointer hover:bg-neutral-50' : ''} transition-colors`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-6 py-4 text-sm text-neutral-900">{children}</td>
}
