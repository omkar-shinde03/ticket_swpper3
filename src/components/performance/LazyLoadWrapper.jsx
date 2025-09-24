import React, { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export const LazyLoadWrapper = ({ children, fallback }) => {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  )
}