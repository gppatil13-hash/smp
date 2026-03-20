'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader, Badge } from '@/components/common'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  User,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  ChevronRight,
} from 'lucide-react'

interface Enquiry {
  id: string
  name: string
  email: string
  phone: string
  class: string
  status: 'INQUIRY' | 'APPLIED' | 'SHORTLISTED' | 'ADMITTED' | 'REJECTED'
  score: number
  days: number
  lastContact: string
  nextFollowup: string
}

const enquiries: Enquiry[] = [
  {
    id: 'ENQ001',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+91-9876543210',
    class: '10-A',
    status: 'SHORTLISTED',
    score: 85,
    days: 5,
    lastContact: '2024-03-15',
    nextFollowup: '2024-03-20',
  },
  {
    id: 'ENQ002',
    name: 'Mike Chen',
    email: 'mike@example.com',
    phone: '+91-9876543211',
    class: '9-B',
    status: 'APPLIED',
    score: 72,
    days: 12,
    lastContact: '2024-03-10',
    nextFollowup: '2024-03-18',
  },
  {
    id: 'ENQ003',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    phone: '+91-9876543212',
    class: '11-A',
    status: 'ADMITTED',
    score: 92,
    days: 2,
    lastContact: '2024-03-14',
    nextFollowup: 'Completed',
  },
  {
    id: 'ENQ004',
    name: 'Raj Patel',
    email: 'raj@example.com',
    phone: '+91-9876543213',
    class: '10-A',
    status: 'INQUIRY',
    score: 68,
    days: 25,
    lastContact: '2024-03-01',
    nextFollowup: '2024-03-25',
  },
  {
    id: 'ENQ005',
    name: 'Lisa Rodriguez',
    email: 'lisa@example.com',
    phone: '+91-9876543214',
    class: '9-C',
    status: 'APPLIED',
    score: 78,
    days: 8,
    lastContact: '2024-03-12',
    nextFollowup: '2024-03-19',
  },
]

const statusConfig = {
  INQUIRY: { color: 'neutral' as const, label: 'Initial Inquiry', order: 1 },
  APPLIED: { color: 'warning' as const, label: 'Application', order: 2 },
  SHORTLISTED: { color: 'primary' as const, label: 'Shortlisted', order: 3 },
  ADMITTED: { color: 'success' as const, label: 'Admitted', order: 4 },
  REJECTED: { color: 'danger' as const, label: 'Rejected', order: 5 },
}

export default function AdmissionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)

  const filteredEnquiries = enquiries.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.phone.includes(searchTerm)
    const matchesStatus = !statusFilter || e.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const groupedByStatus = Object.entries(statusConfig).reduce((acc, [status, config]) => {
    acc[status] = filteredEnquiries.filter(e => e.status === status)
    return acc
  }, {} as Record<string, Enquiry[]>)

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Admission Pipeline</h1>
            <p className="text-neutral-600 mt-1">Manage enquiries and track conversions</p>
          </div>
          <button className="btn-primary self-start md:self-auto">
            <Plus size={20} />
            New Enquiry
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-lg px-4 py-2 border border-neutral-300">
            <Search size={18} className="text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none bg-transparent text-sm"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-700 hover:bg-neutral-50">
            <Filter size={18} />
            Filter
          </button>
        </div>

        {/* Kanban-style Pipeline View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="flex flex-col">
              {/* Column Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-neutral-900">{config.label}</h3>
                  <span className="bg-neutral-200 text-neutral-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {groupedByStatus[status as keyof typeof groupedByStatus]?.length || 0}
                  </span>
                </div>
              </div>

              {/* Enquiry Cards */}
              <div className="flex-1 space-y-3">
                {groupedByStatus[status as keyof typeof groupedByStatus]?.map((enquiry) => (
                  <div
                    key={enquiry.id}
                    onClick={() => setSelectedEnquiry(enquiry)}
                    className="bg-white rounded-lg border border-neutral-200 p-4 cursor-pointer hover:shadow-md hover:border-primary-300 transition-all group"
                  >
                    {/* Score Badge */}
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="primary">
                        Score: {enquiry.score}%
                      </Badge>
                      <button className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-600">
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    {/* Name */}
                    <p className="font-semibold text-neutral-900 text-sm mb-2">{enquiry.name}</p>

                    {/* Class */}
                    <p className="text-xs text-neutral-500 mb-3">Class {enquiry.class}</p>

                    {/* Contact Info */}
                    <div className="space-y-2 text-xs text-neutral-600 mb-3 pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Mail size={12} />
                        <span className="truncate">{enquiry.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={12} />
                        <span>{enquiry.phone}</span>
                      </div>
                    </div>

                    {/* Timeline Info */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-neutral-500">
                        <span className="font-semibold text-neutral-700">{enquiry.days}</span> days ago
                      </div>
                      <ChevronRight size={14} className="text-neutral-400" />
                    </div>
                  </div>
                ))}

                {!groupedByStatus[status as keyof typeof groupedByStatus] || groupedByStatus[status as keyof typeof groupedByStatus].length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-neutral-400 text-sm">No enquiries</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        {selectedEnquiry && (
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-40 flex flex-col">
            {/* Header */}
            <div className="border-b border-neutral-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-900">Enquiry Details</h2>
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  ✕
                </button>
              </div>
              <Badge variant={statusConfig[selectedEnquiry.status].color}>
                {statusConfig[selectedEnquiry.status].label}
              </Badge>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-neutral-900 mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-neutral-500 font-medium">NAME</p>
                    <p className="text-neutral-900 font-medium">{selectedEnquiry.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 font-medium">EMAIL</p>
                    <p className="text-neutral-900">{selectedEnquiry.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 font-medium">PHONE</p>
                    <p className="text-neutral-900">{selectedEnquiry.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 font-medium">CLASS INTERESTED</p>
                    <p className="text-neutral-900">Class {selectedEnquiry.class}</p>
                  </div>
                </div>
              </div>

              {/* Conversion Score */}
              <div>
                <h3 className="font-semibold text-neutral-900 mb-4">Conversion Metrics</h3>
                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-600">Conversion Score</span>
                    <span className="font-bold text-primary-600">{selectedEnquiry.score}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full"
                      style={{ width: `${selectedEnquiry.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-semibold text-neutral-900 mb-4">Timeline</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-neutral-400" />
                    <div>
                      <p className="text-neutral-500">Last Contact</p>
                      <p className="text-neutral-900 font-medium">{selectedEnquiry.lastContact}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare size={16} className="text-neutral-400" />
                    <div>
                      <p className="text-neutral-500">Next Followup</p>
                      <p className="text-neutral-900 font-medium">{selectedEnquiry.nextFollowup}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-neutral-200 p-6 space-y-3">
              <button className="w-full btn-primary">Schedule Followup</button>
              <button className="w-full btn-secondary">Move to Next Stage</button>
            </div>
          </div>
        )}

        {/* Overlay */}
        {selectedEnquiry && (
          <div
            className="fixed inset-0 bg-black/20 z-30"
            onClick={() => setSelectedEnquiry(null)}
          ></div>
        )}
      </div>
    </MainLayout>
  )
}
