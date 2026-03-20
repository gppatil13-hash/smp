# Component Library Reference Documentation

## Overview

All reusable components are exported from `components/common/index.tsx`. This document provides quick reference for each component with examples.

---

## PageHeader Component

**Purpose**: Consistent page title and header area
**Location**: `components/common/index.tsx`

### Props
```typescript
interface PageHeaderProps {
  title: string              // Page title
  description?: string       // Optional subtitle
  action?: React.ReactNode   // Right-side action button
}
```

### Usage
```tsx
import { PageHeader } from '@/components/common'
import { Plus } from 'lucide-react'

export default function StudentsPage() {
  return (
    <>
      <PageHeader 
        title="Students"
        description="Manage all students in the system"
        action={
          <button className="btn-primary">
            <Plus size={20} />
            Add Student
          </button>
        }
      />
      {/* Page content */}
    </>
  )
}
```

### Output
- Large H1 title (text-3xl, font-bold)
- Optional gray description text
- Right-aligned action button
- Full width with bottom border

---

## StatsCard Component

**Purpose**: Display KPI metrics with trends
**Location**: `components/common/index.tsx`

### Props
```typescript
interface StatsCardProps {
  label: string              // Metric name
  value: string | number     // Current value
  change?: string           // Change text (e.g., "+12%")
  trend?: 'up' | 'down'     // Trend direction
  icon?: React.ReactNode    // Left-side icon
  color?: string            // Color variant
}
```

### Usage
```tsx
import { StatsCard } from '@/components/common'
import { Users, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        label="Total Students"
        value="1,248"
        change="+12% from last month"
        trend="up"
        icon={<Users size={24} className="text-blue-600" />}
      />
      <StatsCard
        label="Active Admissions"
        value="156"
        change="-3% from last month"
        trend="down"
        icon={<Users size={24} className="text-green-600" />}
      />
    </div>
  )
}
```

### Output
- White card with gray border
- Icon on left (optional)
- Large bold value
- Gray label below
- Green/red trend indicator (optional)

### Color Variants
```
'primary', 'success', 'warning', 'danger', 'neutral'
```

---

## Badge Component

**Purpose**: Status indicators and tags
**Location**: `components/common/index.tsx`

### Props
```typescript
interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'primary' | 'neutral'
  children: React.ReactNode
}
```

### Usage
```tsx
import { Badge } from '@/components/common'

// In a table or list
<div className="flex gap-2">
  <Badge variant="success">Paid</Badge>
  <Badge variant="warning">Pending</Badge>
  <Badge variant="danger">Overdue</Badge>
  <Badge variant="primary">Active</Badge>
</div>
```

### Variants

| Variant | Color | Use Case |
|---------|-------|----------|
| `success` | Green | Paid, Active, Approved |
| `warning` | Orange | Pending, Attention needed |
| `danger` | Red | Overdue, Error, Rejected |
| `primary` | Blue | Default, Selected |
| `neutral` | Gray | Inactive, Archived |

---

## Table Component

**Purpose**: Structured data display
**Location**: `components/common/index.tsx`

### Props
```typescript
interface TableProps {
  headers: string[]
  children: React.ReactNode
  className?: string
}
```

### Usage
```tsx
import { Table, TableRow, TableCell, Badge } from '@/components/common'

export default function StudentsList() {
  const students = [
    { id: 1, name: 'John Doe', email: 'john@email.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@email.com', status: 'Inactive' },
  ]

  return (
    <Table headers={['Name', 'Email', 'Status', 'Action']}>
      {students.map(student => (
        <TableRow key={student.id}>
          <TableCell>{student.name}</TableCell>
          <TableCell>{student.email}</TableCell>
          <TableCell>
            <Badge variant={student.status === 'Active' ? 'success' : 'neutral'}>
              {student.status}
            </Badge>
          </TableCell>
          <TableCell>
            <button className="text-primary-600 hover:underline">Edit</button>
          </TableCell>
        </TableRow>
      ))}
    </Table>
  )
}
```

### Output
- Bordered table with header row
- Striped rows (alternating gray background)
- Touch-friendly row height
- Responsive on mobile (scrollable)
- Hover effects on rows

### Features
- Gray header background
- Padding: 12px per cell
- Border on all sides
- Responsive overflow handling
- Click handlers work on rows

---

## TableRow Component

**Purpose**: Individual table row wrapper
**Location**: `components/common/index.tsx`

### Props
```typescript
interface TableRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}
```

### Usage
```tsx
<TableRow onClick={() => viewStudent(id)}>
  <TableCell>John Doe</TableCell>
  <TableCell>john@email.com</TableCell>
  <TableCell>Active</TableCell>
</TableRow>
```

---

## TableCell Component

**Purpose**: Table cell wrapper
**Location**: `components/common/index.tsx`

### Props
```typescript
interface TableCellProps {
  children: React.ReactNode
  className?: string
  header?: boolean  // Use for header cells
}
```

### Usage
```tsx
<TableCell>Content here</TableCell>
<TableCell header>Header Text</TableCell>
```

---

## Complete Example: Student List Page

```tsx
'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader, StatsCard, Badge, Table, TableRow, TableCell } from '@/components/common'
import { Users, Search } from 'lucide-react'

interface Student {
  id: number
  name: string
  email: string
  class: string
  status: 'Active' | 'Inactive'
}

const mockStudents: Student[] = [
  { id: 1, name: 'John Doe', email: 'john@email.com', class: '10-A', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@email.com', class: '9-B', status: 'Active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@email.com', class: '11-C', status: 'Inactive' },
]

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filtered = mockStudents.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Students"
          description="Manage all students in the system"
          action={
            <button className="btn-primary">
              <Plus size={20} />
              Add Student
            </button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            label="Total Students"
            value={mockStudents.length}
            icon={<Users size={24} />}
          />
          <StatsCard
            label="Active"
            value={mockStudents.filter(s => s.status === 'Active').length}
            icon={<Users size={24} />}
          />
          <StatsCard
            label="Inactive"
            value={mockStudents.filter(s => s.status === 'Inactive').length}
            icon={<Users size={24} />}
          />
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 max-w-md">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input flex-1"
          />
        </div>

        {/* Table */}
        <div className="card">
          <Table headers={['Name', 'Email', 'Class', 'Status', 'Action']}>
            {filtered.map(student => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.class}</TableCell>
                <TableCell>
                  <Badge variant={student.status === 'Active' ? 'success' : 'neutral'}>
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button className="text-primary-600 hover:underline text-sm font-medium">
                    View Profile
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </div>
      </div>
    </MainLayout>
  )
}
```

---

## Component Styling System

### CSS Classes Available

**Buttons:**
```tsx
className="btn-primary"      // Blue button
className="btn-secondary"    // Gray button
className="btn-danger"       // Red button
className="btn-success"      // Green button
className="btn-outline"      // Bordered button
className="btn-ghost"        // Transparent button
```

**Cards:**
```tsx
className="card"             // White card with border
className="card p-6"         // Card with padding
className="card rounded-lg"  // Card with rounded corners
```

**Inputs:**
```tsx
className="input"            // Text input field
className="input-lg"         // Large input
className="input-sm"         // Small input
```

**Text:**
```tsx
className="text-primary-600"     // Blue text
className="text-success-600"     // Green text
className="text-warning-600"     // Orange text
className="text-danger-600"      // Red text
className="text-gray-600"        // Gray text
```

**Layout:**
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"  // Responsive grid
className="flex gap-4"                                       // Flex layout
className="space-y-8"                                        // Vertical spacing
className="p-6 md:p-8"                                       // Responsive padding
```

---

## Icon Usage (Lucide React)

All icons from [lucide.dev](https://lucide.dev)

```tsx
import { 
  Menu, 
  X, 
  Heart, 
  Eye, 
  EyeOff,
  Search,
  ChevronDown,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Download,
  Calendar,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

// Usage
<Button>
  <Plus size={20} />
  Add New
</Button>

<Heart size={24} className="text-red-500" />

<Eye size={16} className="cursor-pointer" />
```

---

## Using with Your Data

### Map Over Data
```tsx
const students = [/* data */]

<Table headers={['Name', 'Email', 'Status']}>
  {students.map(student => (
    <TableRow key={student.id}>
      <TableCell>{student.name}</TableCell>
      <TableCell>{student.email}</TableCell>
      <TableCell>
        <Badge variant={student.status === 'Active' ? 'success' : 'danger'}>
          {student.status}
        </Badge>
      </TableCell>
    </TableRow>
  ))}
</Table>
```

### Conditional Rendering
```tsx
<Badge variant={
  student.status === 'Active' ? 'success' :
  student.status === 'Pending' ? 'warning' :
  'danger'
}>
  {student.status}
</Badge>
```

### Computed Properties
```tsx
<StatsCard
  label="Collection Rate"
  value={`${Math.round((colleced / total) * 100)}%`}
  trend={collected > lastMonth ? 'up' : 'down'}
/>
```

---

## Responsive Patterns

### Hidden on Mobile
```tsx
<div className="hidden md:block">
  {/* Only visible on tablet and up */}
</div>
```

### Different Layout on Mobile
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
  {/* 1 column on mobile, 2 on tablet, 4 on desktop */}
</div>
```

### Responsive Text Size
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Title
</h1>
```

### Responsive Padding
```tsx
<div className="p-4 md:p-6 lg:p-8">
  Content with responsive padding
</div>
```

---

## Accessibility Features

All components include:
- ✅ Semantic HTML
- ✅ Color contrast (WCAG AA)
- ✅ Keyboard navigation ready
- ✅ Touch-friendly sizes (min 48px)
- ✅ Proper ARIA labels ready

---

## Next Steps

1. **Review Examples**: Check `/app/dashboard/page.tsx` for working examples
2. **Build Pages**: Use these components to build your own pages
3. **Customize**: Modify `tailwind.config.js` to match your brand
4. **Extend**: Add new components following the same pattern
5. **Connect Data**: Replace mock data with real API calls

---

**Version**: 1.0.0
**Last Updated**: March 19, 2024
