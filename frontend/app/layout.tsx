'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/components/providers/auth-provider'
import '@/app/globals.css'

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>School ERP - Dashboard</title>
        <meta name="description" content="Modern School Management System" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-neutral-50">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
