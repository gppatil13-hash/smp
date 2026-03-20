# Backend Integration Guide

## Overview

This guide explains how to connect the Frontend UI to your backend services:
- **NestJS API** (Main backend)
- **FastAPI Services** (AI and supplementary services)

---

## Prerequisites

You should have:
- ✅ Frontend running on `http://localhost:3000`
- ✅ NestJS backend on `http://localhost:3001` (or your port)
- ✅ FastAPI service on `http://localhost:8000` (or your port)

---

## Step 1: Setup Environment Variables

Create a file called `.env.local` in your `/frontend` folder:

```env
# Backend API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000

# Authentication
NEXT_PUBLIC_AUTH_ENABLED=true

# App Settings
NEXT_PUBLIC_APP_NAME=School ERP
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Important**: 
- Variables starting with `NEXT_PUBLIC_` are accessible in the browser
- Secret keys should NOT start with `NEXT_PUBLIC_`
- Restart dev server after changing `.env.local`

---

## Step 2: Create API Client

Create a new file: `/frontend/lib/api.ts`

```typescript
import axios, { AxiosInstance } from 'axios'

// Main API client for NestJS backend
export const createApiClient = (): AxiosInstance => {
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Add request interceptor to attach auth token
  api.interceptors.request.use(
    (config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Add response interceptor to handle errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle 401 (Unauthorized)
      if (error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return api
}

export const api = createApiClient()

// AI Service API Client
export const aiApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000',
  timeout: 60000,
})
```

---

## Step 3: Create API Service Methods

Create a new file: `/frontend/lib/services/students.ts`

```typescript
import { api } from '@/lib/api'

// TypeScript Types
export interface Student {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  enrollmentDate: string
  class: string
  status: 'Active' | 'Inactive' | 'Graduated' | 'Suspended'
  rollNumber: string
  dateOfBirth: string
  parentName: string
  parentEmail: string
  parentPhone: string
  address: string
  city: string
  state: string
  postalCode: string
  totalFees: number
  feePaid: number
}

export interface StudentCreateInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  class: string
  dateOfBirth: string
  parentName: string
  parentEmail: string
  parentPhone: string
  address: string
}

// API Methods
export const studentService = {
  // Get all students
  getAll: async (filters?: {
    class?: string
    status?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get<Student[]>('/students', { params: filters })
    return response.data
  },

  // Get single student
  getById: async (id: number) => {
    const response = await api.get<Student>(`/students/${id}`)
    return response.data
  },

  // Create new student
  create: async (data: StudentCreateInput) => {
    const response = await api.post<Student>('/students', data)
    return response.data
  },

  // Update student
  update: async (id: number, data: Partial<Student>) => {
    const response = await api.put<Student>(`/students/${id}`, data)
    return response.data
  },

  // Delete student
  delete: async (id: number) => {
    await api.delete(`/students/${id}`)
  },

  // Search students
  search: async (query: string) => {
    const response = await api.get<Student[]>('/students/search', {
      params: { q: query }
    })
    return response.data
  },
}
```

---

## Step 4: Create More Service Files

You'll want similar files for:

### `/frontend/lib/services/admissions.ts`
```typescript
import { api } from '@/lib/api'

export interface Admission {
  id: number
  studentName: string
  email: string
  phone: string
  appliedClass: string
  status: 'New' | 'Interested' | 'Applied' | 'Shortlisted' | 'Admitted' | 'Rejected'
  source: 'Website' | 'Referral' | 'Walk-in' | 'Advertisement'
  createdDate: string
  lastFollowUp: string
  notes: string
}

export const admissionService = {
  getAll: async (filters?: any) => {
    const response = await api.get<Admission[]>('/admissions', { params: filters })
    return response.data
  },

  getByStatus: async (status: string) => {
    const response = await api.get<Admission[]>(`/admissions/status/${status}`)
    return response.data
  },

  updateStatus: async (id: number, status: Admission['status']) => {
    const response = await api.put(`/admissions/${id}`, { status })
    return response.data
  },

  create: async (data: any) => {
    const response = await api.post('/admissions', data)
    return response.data
  },
}
```

### `/frontend/lib/services/fees.ts`
```typescript
import { api } from '@/lib/api'

export interface Fee {
  id: number
  studentId: number
  studentName: string
  amount: number
  amountPaid: number
  dueDate: string
  paidDate?: string
  status: 'Paid' | 'Due' | 'Overdue'
  receiptNumber?: string
}

export interface Receipt {
  id: number
  studentId: number
  feeId: number
  amount: number
  paidDate: string
  paymentMethod: 'Cash' | 'Check' | 'Transfer' | 'Online'
  receiptNumber: string
  remarks?: string
}

export const feeService = {
  getAllFees: async (filters?: any) => {
    const response = await api.get<Fee[]>('/fees', { params: filters })
    return response.data
  },

  getFeesByStatus: async (status: Fee['status']) => {
    const response = await api.get<Fee[]>(`/fees/status/${status}`)
    return response.data
  },

  getReceipts: async (studentId?: number) => {
    const response = await api.get<Receipt[]>('/receipts', {
      params: { studentId }
    })
    return response.data
  },

  recordPayment: async (data: {
    feeId: number
    amount: number
    paymentMethod: string
    remarks?: string
  }) => {
    const response = await api.post('/receipts', data)
    return response.data
  },

  getCollectionStats: async () => {
    const response = await api.get<{
      totalDue: number
      totalOverdue: number
      totalPaid: number
      collectionRate: number
    }>('/fees/stats')
    return response.data
  },
}
```

### `/frontend/lib/services/auth.ts`
```typescript
import { api } from '@/lib/api'

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: {
    id: number
    email: string
    name: string
    role: 'admin' | 'teacher' | 'accountant' | 'staff'
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export const authService = {
  login: async (credentials: LoginRequest) => {
    const response = await api.post<LoginResponse>('/auth/login', credentials)
    
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    
    return response.data
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  },

  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    }
    return null
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    const response = await api.post<LoginResponse>('/auth/refresh', {
      refresh_token: refreshToken
    })
    
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token)
    }
    
    return response.data
  },
}
```

---

## Step 5: Update Login Page

Edit `/frontend/app/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/services/auth'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authService.login({
        email: formData.email,
        password: formData.password,
      })
      
      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-2">School ERP</h1>
        <p className="text-center text-gray-600 mb-8">Sign in to your account</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@school.edu"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="w-4 h-4 accent-primary-600"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Forgot your password?{' '}
          <a href="#" className="text-primary-600 hover:underline">
            Reset it here
          </a>
        </p>
      </div>
    </div>
  )
}
```

---

## Step 6: Update Dashboard with Real Data

Edit `/frontend/app/dashboard/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader, StatsCard } from '@/components/common'
import { Users, BarChart3, DollarSign, TrendingUp } from 'lucide-react'
import { feeService } from '@/lib/services/fees'
import { studentService } from '@/lib/services/students'
import { admissionService } from '@/lib/services/admissions'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeAdmissions: 0,
    pendingFees: 0,
    totalRevenue: 0,
    loading: true,
    error: null as string | null,
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [
          students,
          admissions,
          fees,
        ] = await Promise.all([
          studentService.getAll(),
          admissionService.getByStatus('Applied'),
          feeService.getCollectionStats(),
        ])

        setStats({
          totalStudents: students.length,
          activeAdmissions: admissions.length,
          pendingFees: fees.totalDue,
          totalRevenue: fees.totalPaid,
          loading: false,
          error: null,
        })
      } catch (err: any) {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to load stats',
        }))
      }
    }

    loadStats()
  }, [])

  return (
    <MainLayout>
      <div className="space-y-8">
        <PageHeader
          title="Dashboard"
          description="Welcome back! Here's your school overview."
        />

        {stats.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{stats.error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            label="Total Students"
            value={stats.totalStudents}
            icon={<Users size={24} className="text-blue-600" />}
          />
          <StatsCard
            label="Active Admissions"
            value={stats.activeAdmissions}
            icon={<TrendingUp size={24} className="text-green-600" />}
          />
          <StatsCard
            label="Pending Fees"
            value={`$${stats.pendingFees.toLocaleString()}`}
            icon={<BarChart3 size={24} className="text-orange-600" />}
          />
          <StatsCard
            label="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={<DollarSign size={24} className="text-green-600" />}
          />
        </div>

        {/* Add more dashboard content here */}
      </div>
    </MainLayout>
  )
}
```

---

## Step 7: Protected Routes (Optional)

Create `/frontend/lib/auth-guard.tsx`:

```tsx
'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/services/auth'

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const user = authService.getCurrentUser()
    if (!user) {
      router.push('/login')
    }
  }, [router])

  return <>{children}</>
}
```

Use in your page:
```tsx
'use client'

import { AuthGuard } from '@/lib/auth-guard'

export default function ProtectedPage() {
  return (
    <AuthGuard>
      {/* Your protected content */}
    </AuthGuard>
  )
}
```

---

## Step 8: Update Students Page

Edit `/frontend/app/students/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader, Badge, Table, TableRow, TableCell } from '@/components/common'
import { studentService, Student } from '@/lib/services/students'
import { Search } from 'lucide-react'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filtered, setFiltered] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await studentService.getAll()
        setStudents(data)
      } catch (err) {
        console.error('Failed to load students:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [])

  useEffect(() => {
    let result = students

    if (filter !== 'All') {
      result = result.filter(s => s.status === filter)
    }

    if (searchTerm) {
      result = result.filter(s =>
        s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFiltered(result)
  }, [students, searchTerm, filter])

  return (
    <MainLayout>
      <div className="space-y-8">
        <PageHeader 
          title="Students"
          description="Manage all students"
        />

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {(['All', 'Active', 'Inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">Loading students...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No students found</div>
        ) : (
          <div className="card">
            <Table headers={['Name', 'Email', 'Class', 'Status', 'Actions']}>
              {filtered.map(student => (
                <TableRow key={student.id}>
                  <TableCell>{student.firstName} {student.lastName}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'Active' ? 'success' : 'danger'}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <a href={`/students/${student.id}`} className="text-primary-600 hover:underline text-sm">
                      View Profile
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
```

---

## Step 9: Error Handling Best Practices

```typescript
// Good error handling
try {
  const data = await api.get('/endpoint')
  setData(data)
} catch (error: any) {
  const message = error.response?.data?.message || error.message || 'An error occurred'
  setError(message)
  // Optionally log to error tracking service
  console.error('API Error:', error)
}
```

---

## Step 10: Loading States

```tsx
const [loading, setLoading] = useState(false)

const handleAction = async () => {
  setLoading(true)
  try {
    await api.post('/endpoint', data)
    // Success handling
  } finally {
    setLoading(false)
  }
}

<button disabled={loading}>
  {loading ? 'Processing...' : 'Submit'}
</button>
```

---

## API Endpoint Examples

Your NestJS backend should provide these endpoints:

### Authentication
```
POST   /auth/login              → Login user
POST   /auth/logout             → Logout user
POST   /auth/refresh            → Refresh token
GET    /auth/me                 → Get current user
```

### Students
```
GET    /students                → Get all students (paginated)
GET    /students/:id            → Get single student
POST   /students                → Create student
PUT    /students/:id            → Update student
DELETE /students/:id            → Delete student
GET    /students/search?q=      → Search students
```

### Admissions
```
GET    /admissions              → Get all admissions
GET    /admissions/:id          → Get single admission
POST   /admissions              → Create admission
PUT    /admissions/:id          → Update admission
GET    /admissions/status/:status → Get by status
```

### Fees
```
GET    /fees                    → Get all fees
GET    /fees/:id                → Get single fee
POST   /fees                    → Create fee entry
GET    /fees/status/:status     → Get by status
GET    /fees/stats              → Get fee statistics
POST   /receipts                → Record payment
GET    /receipts                → Get receipt history
```

### Reports
```
GET    /reports/admission-funnel        → Admission data
GET    /reports/fee-collection          → Fee statistics
GET    /reports/student-performance     → Performance data
GET    /reports/attendance              → Attendance data
```

---

## Testing API Calls

Use Postman or curl:

```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.edu","password":"password"}'

# Get students
curl -X GET http://localhost:3001/students \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Key Points

✅ Store auth token safely (localStorage for SPA)
✅ Handle 401 errors for expired tokens
✅ Add loading states during API calls
✅ Show user-friendly error messages
✅ Use TypeScript interfaces for type safety
✅ Centralize API clients in lib/ folder
✅ Handle network timeouts gracefully
✅ Log errors for debugging
✅ Test API integration thoroughly before deployment

---

**Version**: 1.0.0
**Last Updated**: March 19, 2024
