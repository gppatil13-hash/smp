# School ERP Frontend UI

A modern, responsive web application built with **Next.js 14** and **Tailwind CSS** for comprehensive school management.

## ✨ Features

### 📊 Dashboard
- Real-time statistics and KPIs
- Admission trends visualization
- Fee collection analytics
- Recent activity widgets
- Overdue alerts

### 🎓 Admission Pipeline
- **CRM-style kanban board** with admission stages:
  - INQUIRY
  - APPLIED
  - SHORTLISTED
  - ADMITTED
  - REJECTED
- Quick card view with conversion scores
- One-click follow-up scheduling
- Search and filter capabilities

### 👥 Student Management
- Complete student directory
- Individual student profiles with:
  - Academic performance tracking
  - Attendance records
  - Fee payment status
  - Parent information
  - Document management
  - Awards and achievements

### 💰 Fee Management
- Fee collection dashboard
- Receipt history and tracking
- Payment status visualization
- Overdue alerts and reminders
- Fee statistics and analytics
- Export functionality

### 📈 Reports & Analytics
- Admission conversion trends
- Student distribution charts
- Academic performance analysis
- Key performance metrics
- Exportable reports

### ⚙️ Settings
- School information management
- Academic configuration
- Fee settings
- Notification preferences
- User management

## 🎨 Design Principles

### Minimal Clicks
- Intuitive navigation structure
- Quick access to frequent actions
- Bulk operations support
- Inline editing where possible

### Mobile Responsive
- Mobile-first design approach
- Touch-friendly interface
- Responsive grid layouts
- Adaptive navigation

### Clean Dashboards
- Uncluttered layouts
- Whitespace utilization
- Clear visual hierarchy
- Consistent typography

### User-Friendly
- Simple for non-technical staff
- Clear labeling and instructions
- Helpful tooltips
- Intuitive workflows

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom color system
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for consistent iconography
- **State Management**: Zustand (ready for integration)
- **API Client**: Axios (ready for backend integration)
- **TypeScript**: Full type safety

## 📁 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── dashboard/              # Dashboard page
│   ├── admissions/             # Admission pipeline
│   ├── students/               # Student list & profiles
│   ├── fees/                   # Fee management
│   ├── reports/                # Analytics & reports
│   ├── settings/               # Configuration
│   ├── login/                  # Authentication page
│   └── globals.css             # Global styles
│
├── components/
│   ├── layout/
│   │   └── main-layout.tsx     # Main layout with sidebar
│   ├── common/
│   │   └── index.tsx           # Shared components
│   ├── dashboard/              # Dashboard widgets
│   ├── admission/              # Admission components
│   ├── student/                # Student components
│   ├── fees/                   # Fee components
│   └── providers/
│       └── auth-provider.tsx   # Auth context
│
├── public/                     # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── postcss.config.js
```

## 🎯 Pages

### 1. **Login** (`/login`)
- Email and password authentication
- "Remember me" option
- Demo credentials display
- Forgot password link

### 2. **Dashboard** (`/dashboard`)
- 4 key metrics cards
- Admission trends chart
- Fee collection analytics
- Recent admissions list
- Overdue fees alerts

### 3. **Admission Pipeline** (`/admissions`)
- Kanban board view (5 columns)
- Enquiry cards with:
  - Conversion score
  - Contact information
  - Timeline tracking
  - Quick actions
- Detailed side panel
- Search and filter

### 4. **Students** (`/students`)
- Student directory table
- Search functionality
- Fee status filtering
- Quick profile access
- Bulk operations ready

### 5. **Student Profile** (`/students/profile`)
- Personal information
- Academic performance
- Attendance tracking
- Conduct and awards
- Fee status
- Parent information
- Document management

### 6. **Fee Management** (`/fees`)
- Collection statistics
- Receipt history table
- Payment status tracking
- Export functionality
- Overdue fee alerts

### 7. **Reports** (`/reports`)
- Admission conversion trends
- Student distribution
- Subject-wise performance
- KPI dashboard
- Exportable reports

### 8. **Settings** (`/settings`)
- School information
- Academic settings
- Fee configuration
- Notification preferences
- Danger zone actions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Install Tailwind Forms plugin
npm install -D @tailwindcss/forms

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "next": "^14.0.0",
  "lucide-react": "^0.263.0",
  "recharts": "^2.10.0",
  "zustand": "^4.4.0",
  "axios": "^1.6.0",
  "tailwindcss": "^3.3.0"
}
```

## 🎨 Color System

- **Primary**: Blue (`#1e88e5`) - Main brand color
- **Success**: Green (`#10b981`) - Positive states
- **Warning**: Amber (`#f59e0b`) - Caution states
- **Danger**: Red (`#ef4444`) - Error/Alert states
- **Neutral**: Gray (`#111827` to `#f9fafb`) - Text and backgrounds

## 📱 Responsive Breakpoints

- **Mobile**: 0px - 640px
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px+

## 🔄 API Integration

The frontend is ready to integrate with the backend API. Update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Example API calls ready in:
- `components/providers/auth-provider.tsx` - Authentication
- Service files (to be created per module)
- API client setup with Axios

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 📚 Component Library

### Layout Components
- `MainLayout` - Full page layout with sidebar
- `PageHeader` - Page title and action buttons

### Common Components
- `StatsCard` - Metric card with icon
- `Badge` - Status badge (6 variants)
- `Table` - Responsive data table
- `TableRow` - Table row with hover states
- `TableCell` - Table cell content

### Custom Styles
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.btn-danger` - Danger button
- `.btn-success` - Success button
- `.card` - Card container
- `.input` - Form input
- `.label` - Form label

## 🔐 Security

- Input validation ready
- Protection against XSS (React built-in)
- CSRF token support ready
- Secure password input handling

## 📊 Performance

- Next.js 14 with optimizations
- Image optimization ready
- Code splitting via dynamic imports
- CSS-in-JS with Tailwind
- Server-side rendering (SSR) ready

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 📝 Notes for Non-Technical Staff

1. **Navigation**: Use the sidebar menu on the left
2. **Search**: Use search bars to find information quickly
3. **Colors**: 
   - Green = Good/Positive
   - Orange = Needs Attention
   - Red = Urgent/Problems
4. **Buttons**: Click blue buttons to perform actions
5. **Tables**: Click on rows to view details
6. **Mobile**: App works on phones and tablets

## 🤝 Contributing

Guidelines for adding new features:
1. Create components in the appropriate folder
2. Follow the existing code style
3. Use Tailwind CSS for styling
4. Keep components small and reusable
5. Add TypeScript types

## 📄 License

MIT License - feel free to use for your school

## 🆘 Support

For bugs or feature requests, please contact the development team.

---

**Last Updated**: March 19, 2024
**Version**: 1.0.0
