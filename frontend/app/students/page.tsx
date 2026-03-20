'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader, Table, TableCell, TableRow, Badge } from '@/components/common'
import { Plus, Search, Filter, Eye, Edit2 } from 'lucide-react'
import Link from 'next/link'

const students = [
  { id: 1, name: 'Sarah Kumar', rollNo: '10-A-045', class: '10-A', section: 'Science', feeStatus: 'Paid', lastActivity: 'Attendance' },
  { id: 2, name: 'Mike Chen', rollNo: '9-B-032', class: '9-B', section: 'Science', feeStatus: 'Paid', lastActivity: 'Exam' },
  { id: 3, name: 'Emma Wilson', rollNo: '11-A-018', class: '11-A', section: 'Commerce', feeStatus: 'Pending', lastActivity: 'Assignment' },
  { id: 4, name: 'Raj Patel', rollNo: '10-A-055', class: '10-A', section: 'Science', feeStatus: 'Overdue', lastActivity: 'Test' },
  { id: 5, name: 'Lisa Rodriguez', rollNo: '9-C-041', class: '9-C', section: 'Arts', feeStatus: 'Paid', lastActivity: 'Attendance' },
  { id: 6, name: 'David Kumar', rollNo: '10-B-028', class: '10-B', section: 'Commerce', feeStatus: 'Paid', lastActivity: 'Project' },
  { id: 7, name: 'Neha Sharma', rollNo: '11-B-055', class: '11-B', section: 'Science', feeStatus: 'Pending', lastActivity: 'Exam' },
  { id: 8, name: 'Arjun Singh', rollNo: '9-A-039', class: '9-A', section: 'Science', feeStatus: 'Paid', lastActivity: 'Attendance' },
]

const feeStatusVariant = (status: string) => {
  switch (status) {
    case 'Paid':
      return 'success' as const
    case 'Pending':
      return 'warning' as const
    case 'Overdue':
      return 'danger' as const
    default:
      return 'neutral' as const
  }
}

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.class.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <PageHeader
          title="Students"
          description="Manage all student information and records"
          action={
            <button className="btn-primary">
              <Plus size={20} />
              New Student
            </button>
          }
        />

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-lg px-4 py-2 border border-neutral-300">
            <Search size={18} className="text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, roll no or class..."
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

        {/* Students Table */}
        <Table headers={['Student', 'Roll No', 'Class', 'Fee Status', 'Actions']} >
          {filteredStudents.map((student) => (
            <TableRow key={student.id}>
              <TableCell>{student.name}</TableCell>
              <TableCell>{student.rollNo}</TableCell>
              <TableCell>{student.class}</TableCell>
              <TableCell>
                <Badge variant={feeStatusVariant(student.feeStatus)}>
                  {student.feeStatus}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link
                    href="/students/profile"
                    className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                  </Link>
                  <button className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500 text-lg">No students found</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
