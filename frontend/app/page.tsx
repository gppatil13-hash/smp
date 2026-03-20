'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="max-w-2xl w-full px-6 text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-2xl mb-6 shadow-lg mx-auto">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-4">
          School ERP
        </h1>
        <p className="text-xl text-neutral-600 mb-8">
          Modern management system for educational institutions
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/login"
            className="btn-primary h-12 text-base px-8 rounded-lg"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="btn-secondary h-12 text-base px-8 rounded-lg"
          >
            Demo Dashboard
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {[
            {
              icon: '📊',
              title: 'Smart Dashboard',
              desc: 'Real-time insights and key metrics',
            },
            {
              icon: '🎓',
              title: 'Admission Pipeline',
              desc: 'CRM-style enquiry management',
            },
            {
              icon: '👥',
              title: 'Student Profiles',
              desc: 'Complete student information system',
            },
            {
              icon: '💰',
              title: 'Fee Management',
              desc: 'Streamlined payment tracking',
            },
            {
              icon: '📈',
              title: 'Analytics',
              desc: 'Comprehensive reports and insights',
            },
            {
              icon: '⚙️',
              title: 'Easy Setup',
              desc: 'Simple configuration and management',
            },
          ].map((feature, i) => (
            <div key={i} className="card p-6 text-left">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-bold text-neutral-900 mb-2">{feature.title}</h3>
              <p className="text-neutral-600 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <p className="text-neutral-600 text-sm">
            © 2024 School ERP. Designed for schools, by educators.
          </p>
        </div>
      </div>
    </div>
  )
}
