'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  GraduationCap,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Home,
} from 'lucide-react'

const navItems = [
  { 
    label: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard 
  },
  { 
    label: 'Admissions', 
    href: '/admissions', 
    icon: GraduationCap 
  },
  { 
    label: 'Students', 
    href: '/students', 
    icon: Users 
  },
  { 
    label: 'Fees', 
    href: '/fees', 
    icon: DollarSign 
  },
  { 
    label: 'Reports', 
    href: '/reports', 
    icon: BarChart3 
  },
  { 
    label: 'Settings', 
    href: '/settings', 
    icon: Settings 
  },
]

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 lg:relative lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button on mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 lg:hidden"
        >
          <X size={24} className="text-neutral-500" />
        </button>

        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-neutral-200">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-neutral-900">ERP</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors group"
              >
                <Icon size={20} className="group-hover:text-primary-600" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-50">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">Admin User</p>
              <p className="text-xs text-neutral-500 truncate">admin@school.edu</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-neutral-600 hover:text-neutral-900"
            >
              <Menu size={24} />
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex items-center gap-2 bg-neutral-100 rounded-lg px-4 py-2 flex-1 max-w-xs">
              <Search size={18} className="text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative text-neutral-600 hover:text-neutral-900 p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 hover:bg-neutral-100 rounded-lg px-3 py-2 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  A
                </div>
                <ChevronDown size={18} className="text-neutral-600" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-40">
                  <button className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2">
                    <Settings size={16} /> Settings
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}
