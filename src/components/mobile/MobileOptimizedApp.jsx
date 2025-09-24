import React, { lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { LazyLoadWrapper } from '@/components/performance/LazyLoadWrapper'
import { EnhancedMobileNavigation } from '@/components/mobile/EnhancedMobileNavigation'
import { useAuth } from '@/hooks/useAuth'

// Lazy load pages for better performance
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Auth = lazy(() => import('@/pages/Auth'))
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'))
const Index = lazy(() => import('@/pages/Index'))

export const MobileOptimizedApp = () => {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const isAuthPage = location.pathname.includes('/auth')
  const isAdminPage = location.pathname.includes('/admin')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <LazyLoadWrapper>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </LazyLoadWrapper>

      {/* Mobile Navigation - only show when logged in and not on auth/admin pages */}
      {user && !isAuthPage && !isAdminPage && (
        <EnhancedMobileNavigation />
      )}
    </div>
  )
}