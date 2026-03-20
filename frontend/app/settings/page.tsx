'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common'
import { Save, ChevronRight } from 'lucide-react'

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <PageHeader
          title="Settings"
          description="Manage your school information and preferences"
        />

        {/* Settings Sections */}
        <div className="max-w-4xl space-y-8">
          {/* School Information */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">School Information</h2>
            <div className="space-y-4">
              <div>
                <label className="label">School Name</label>
                <input
                  type="text"
                  defaultValue="Delhi Public School"
                  className="input"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">School Code</label>
                  <input
                    type="text"
                    defaultValue="DPS-2024"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Contact Email</label>
                  <input
                    type="email"
                    defaultValue="info@dps.school"
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Contact Phone</label>
                  <input
                    type="tel"
                    defaultValue="+91-1234567890"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Website</label>
                  <input
                    type="url"
                    defaultValue="https://dps.school"
                    className="input"
                  />
                </div>
              </div>
            </div>
            <button className="btn-primary mt-6">
              <Save size={18} />
              Save Changes
            </button>
          </div>

          {/* Academic Settings */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Academic Settings</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Academic Year</label>
                  <select className="input">
                    <option>2023-2024</option>
                    <option>2024-2025</option>
                  </select>
                </div>
                <div>
                  <label className="label">Grade System</label>
                  <select className="input">
                    <option>CBSE</option>
                    <option>ICSE</option>
                    <option>IB</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Session Start Date</label>
                <input
                  type="date"
                  defaultValue="2024-04-01"
                  className="input"
                />
              </div>
            </div>
            <button className="btn-primary mt-6">
              <Save size={18} />
              Save Changes
            </button>
          </div>

          {/* Fee Settings */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Fee Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Annual Tuition Fee</label>
                <input
                  type="number"
                  defaultValue="150000"
                  className="input"
                  placeholder="₹"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Transport Fee</label>
                  <input
                    type="number"
                    defaultValue="25000"
                    className="input"
                    placeholder="₹"
                  />
                </div>
                <div>
                  <label className="label">Activity Fee</label>
                  <input
                    type="number"
                    defaultValue="10000"
                    className="input"
                    placeholder="₹"
                  />
                </div>
              </div>
              <div>
                <label className="label">Fee Payment Frequency</label>
                <select className="input">
                  <option>Quarterly (3 installments)</option>
                  <option>Monthly (12 installments)</option>
                  <option>Half-yearly (2 installments)</option>
                </select>
              </div>
            </div>
            <button className="btn-primary mt-6">
              <Save size={18} />
              Save Changes
            </button>
          </div>

          {/* Notification Settings */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Notifications</h2>
            <div className="space-y-3">
              {[
                { label: 'Send fee reminders to parents', enabled: true },
                { label: 'Send attendance updates', enabled: true },
                { label: 'Send exam result notifications', enabled: true },
                { label: 'Send admission updates', enabled: false },
              ].map((noti, i) => (
                <div key={i} className="flex items-center p-3 border border-neutral-200 rounded-lg">
                  <input
                    type="checkbox"
                    defaultChecked={noti.enabled}
                    className="w-4 h-4 accent-primary-600"
                  />
                  <label className="ml-3 flex-1 text-neutral-700">{noti.label}</label>
                </div>
              ))}
            </div>
            <button className="btn-primary mt-6">
              <Save size={18} />
              Save Preferences
            </button>
          </div>

          {/* Danger Zone */}
          <div className="card p-6 border-danger-200 bg-danger-50">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Danger Zone</h2>
            <p className="text-neutral-600 mb-4">These actions are permanent and cannot be undone.</p>
            <button className="btn-danger">
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
