import * as React from 'react'
import { useEffect } from 'react'

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log)
        getFID(console.log)
        getFCP(console.log)
        getLCP(console.log)
        getTTFB(console.log)
      })
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry)
          }
        })
      })
      
      observer.observe({ entryTypes: ['longtask'] })
      
      return () => observer.disconnect()
    }
  }, [])

  // Memory usage monitoring
  const getMemoryUsage = () => {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
    }
    return null
  }

  // Bundle size monitoring
  const getBundleSize = () => {
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    return scripts.reduce((total, script) => {
      if (script.src.includes('assets')) {
        return total + (script.dataset.size || 0)
      }
      return total
    }, 0)
  }

  return {
    getMemoryUsage,
    getBundleSize
  }
}