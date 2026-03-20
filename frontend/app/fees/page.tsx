'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader, Badge, Table, TableCell, TableRow } from '@/components/common'
import { Plus, Search, Filter, Download, Eye, Send } from 'lucide-react'

interface Receipt {
  id: string
  student: string
  rollNo: string
  amount: number
  date: string
  type: string
  status: 'Paid' | 'Pending' | 'Overdue'
}

const receipts: Receipt[] = [
  { id: 'REC001', student: 'Sarah Kumar', rollNo: '10-A-045', amount: 50000, date: '2024-03-15', type: 'Tuition Fee', status: 'Paid' },
  { id: 'REC002', student: 'Mike Chen', rollNo: '9-B-032', amount: 50000, date: '2024-03-14', type: 'Tuition Fee', status: 'Paid' },
  { id: 'REC003', student: 'Emma Wilson', rollNo: '11-A-018', amount: 50000, date: '2024-03-10', type: 'Tuition Fee', status: 'Pending' },
  { id: 'REC004', student: 'Raj Patel', rollNo: '10-A-055', amount: 50000, date: '2024-02-28', type: 'Tuition Fee', status: 'Overdue' },
  { id: 'REC005', student: 'Lisa Rodriguez', rollNo: '9-C-041', amount: 25000, date: '2024-03-13', type: 'Transport Fee', status: 'Paid' },
  { id: 'REC006', student: 'David Kumar', rollNo: '10-B-028', amount: 50000, date: '2024-03-12', type: 'Tuition Fee', status: 'Paid' },
]

export default function FeesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const filteredReceipts = receipts.filter(r => {
    const matchSearch = r.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       r.rollNo.includes(searchTerm)
    const matchType = !typeFilter || r.type === typeFilter
    return matchSearch && matchType
  })

  const stats = {
    total: receipts.reduce((sum, r) => r.status === 'Paid' ? sum + r.amount : sum, 0),
    pending: receipts.reduce((sum, r) => r.status === 'Pending' ? sum + r.amount : sum, 0),
    overdue: receipts.reduce((sum, r) => r.status === 'Overdue' ? sum + r.amount : sum, 0),
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <PageHeader
          title="Fee Management"
          description="Track and manage student fees and receipts"
          action={
            <button className="btn-primary">
              <Plus size={20} />
              New Payment
            </button>
          }
        />

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <p className="text-neutral-600 text-sm font-medium">Total Collected</p>
            <p className="text-3xl font-bold text-success-600 mt-2">₹{(stats.total / 100000).toFixed(1)}L</p>
            <p className="text-xs text-neutral-500 mt-2">{receipts.filter(r => r.status === 'Paid').length} payments</p>
          </div>
          <div className="card p-6">
            <p className="text-neutral-600 text-sm font-medium">Pending Fees</p>
            <p className="text-3xl font-bold text-warning-600 mt-2">₹{(stats.pending / 100000).toFixed(1)}L</p>
            <p className="text-xs text-neutral-500 mt-2">{receipts.filter(r => r.status === 'Pending').length} payments</p>
          </div>
          <div className="card p-6">
            <p className="text-neutral-600 text-sm font-medium">Overdue Fees</p>
            <p className="text-3xl font-bold text-danger-600 mt-2">₹{(stats.overdue / 100000).toFixed(1)}L</p>
            <p className="text-xs text-neutral-500 mt-2">{receipts.filter(r => r.status === 'Overdue').length} payments</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-lg px-4 py-2 border border-neutral-300">
            <Search size={18} className="text-neutral-400" />
            <input
              type="text"
              placeholder="Search by student name or roll no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none bg-transparent text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-700 hover:bg-neutral-50"
          >
            <option value="">All Types</option>
            <option value="Tuition Fee">Tuition Fee</option>
            <option value="Transport Fee">Transport Fee</option>
            <option value="Activity Fee">Activity Fee</option>
          </select>
          <button className="flex items-center gap-2 bg-white border border-neutral-300 rounded-lg px-4 py-2 text-neutral-700 hover:bg-neutral-50">
            <Download size={18} />
            Export
          </button>
        </div>

        {/* Receipts Table */}
        <Table headers={['Student', 'Roll No', 'Amount', 'Type', 'Date', 'Status', 'Actions']}>
          {filteredReceipts.map((receipt) => (
            <TableRow key={receipt.id}>
              <TableCell>{receipt.student}</TableCell>
              <TableCell>{receipt.rollNo}</TableCell>
              <TableCell className="font-semibold">₹{receipt.amount.toLocaleString()}</TableCell>
              <TableCell>{receipt.type}</TableCell>
              <TableCell>{receipt.date}</TableCell>
              <TableCell>
                <Badge variant={
                  receipt.status === 'Paid' ? 'success' :
                  receipt.status === 'Pending' ? 'warning' : 'danger'
                }>
                  {receipt.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                    <Eye size={16} />
                  </button>
                  <button className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                    <Send size={16} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </div>
    </MainLayout>
  )
}
