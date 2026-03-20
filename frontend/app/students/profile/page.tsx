'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Badge } from '@/components/common'
import { 
  Edit2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Bookmark,
  Award,
  Users,
  File,
} from 'lucide-react'

export default function StudentProfilePage() {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header with Back Button */}
        <a href="/students" className="text-primary-600 font-medium mb-6 inline-flex items-center gap-1 hover:text-primary-700">
          ← Back to Students
        </a>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden mb-8">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-400"></div>

          {/* Profile Content */}
          <div className="px-6 pb-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 mb-6">
              <div className="w-24 h-24 bg-primary-600 rounded-xl border-4 border-white flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                SK
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-neutral-900">Sarah Kumar</h1>
                <p className="text-neutral-600">Roll No. 10-A-045 • Class 10-A</p>
              </div>
              <button className="btn-secondary self-start sm:self-auto">
                <Edit2 size={18} />
                Edit
              </button>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="success">Active</Badge>
              <Badge variant="primary">Merit</Badge>
              <Badge variant="warning">Yellow Card</Badge>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-t border-b border-neutral-200">
              <div>
                <p className="text-xs text-neutral-500 font-semibold mb-1">EMAIL</p>
                <p className="flex items-center gap-2 text-neutral-900">
                  <Mail size={16} />
                  sarah.kumar@email.com
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-semibold mb-1">PHONE</p>
                <p className="flex items-center gap-2 text-neutral-900">
                  <Phone size={16} />
                  +91-9876543210
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-semibold mb-1">ADDRESS</p>
                <p className="flex items-center gap-2 text-neutral-900">
                  <MapPin size={16} />
                  Mumbai
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-semibold mb-1">ADMISSION DATE</p>
                <p className="flex items-center gap-2 text-neutral-900">
                  <Calendar size={16} />
                  15-Jun-2022
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Academic Performance */}
          <div className="lg:col-span-2">
            {/* Academic Performance */}
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Academic Performance</h2>
              
              <div className="space-y-4">
                {[
                  { subject: 'Mathematics', score: 95, grade: 'A+' },
                  { subject: 'English', score: 88, grade: 'A' },
                  { subject: 'Science', score: 92, grade: 'A+' },
                  { subject: 'Social Studies', score: 85, grade: 'A' },
                  { subject: 'Hindi', score: 90, grade: 'A+' },
                ].map((item) => (
                  <div key={item.subject}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-900 font-medium">{item.subject}</span>
                      <span className="text-sm font-bold">
                        <span className="text-neutral-900">{item.score}%</span>
                        <span className="ml-2 text-primary-600 font-bold">{item.grade}</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success-600 rounded-full"
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance */}
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Attendance</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-success-50 rounded-lg border border-success-200">
                  <p className="text-3xl font-bold text-success-600">168</p>
                  <p className="text-xs text-neutral-600 mt-1">Days Present</p>
                </div>
                <div className="text-center p-4 bg-warning-50 rounded-lg border border-warning-200">
                  <p className="text-3xl font-bold text-warning-600">8</p>
                  <p className="text-xs text-neutral-600 mt-1">Days Absent</p>
                </div>
                <div className="text-center p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <p className="text-3xl font-bold text-primary-600">95%</p>
                  <p className="text-xs text-neutral-600 mt-1">Overall Rate</p>
                </div>
              </div>
            </div>

            {/* Conduct & Discipline */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Conduct & Awards</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <Award className="text-primary-600 flex-shrink-0 mt-1" size={20} />
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900">Best Student Award</p>
                    <p className="text-sm text-neutral-600">October 2023</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-3 bg-success-50 rounded-lg border border-success-200">
                  <Award className="text-success-600 flex-shrink-0 mt-1" size={20} />
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900">Science Merit Award</p>
                    <p className="text-sm text-neutral-600">February 2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Info */}
          <div>
            {/* Fee Status */}
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Bookmark size={20} />
                Fee Status
              </h2>
              
              <div className="space-y-4">
                <div className="text-center p-4 bg-success-50 rounded-lg border border-success-200">
                  <p className="text-xs text-neutral-600 mb-1">Total Fees</p>
                  <p className="text-2xl font-bold text-neutral-900">₹1,50,000</p>
                </div>
                <div className="text-center p-4 bg-success-50 rounded-lg border border-success-200">
                  <p className="text-xs text-neutral-600 mb-1">Paid Amount</p>
                  <p className="text-2xl font-bold text-success-600">₹1,50,000</p>
                </div>
                <div className="text-center p-4 bg-success-50 rounded-lg border border-success-200">
                  <p className="text-xs text-neutral-600 mb-1">Balance</p>
                  <p className="text-2xl font-bold text-success-600">₹0</p>
                </div>
                <Badge variant="success" className="w-full text-center justify-center py-2">
                  Fees Paid
                </Badge>
              </div>
            </div>

            {/* Parent Information */}
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Users size={20} />
                Parent Info
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-500 font-semibold mb-1">FATHER</p>
                  <p className="text-neutral-900 font-medium">Rajesh Kumar</p>
                  <p className="text-sm text-neutral-600">+91-9876543200</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-semibold mb-1">MOTHER</p>
                  <p className="text-neutral-900 font-medium">Priya Kumar</p>
                  <p className="text-sm text-neutral-600">+91-9876543201</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <File size={20} />
                Documents
              </h2>
              
              <div className="space-y-2">
                {['Birth Certificate', 'Aadhar Card', 'Transfer Certificate', 'Marks Sheet'].map((doc) => (
                  <button
                    key={doc}
                    className="w-full text-left px-3 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors flex items-center justify-between group"
                  >
                    <span className="text-sm">{doc}</span>
                    <span className="text-neutral-400 group-hover:text-primary-600">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
