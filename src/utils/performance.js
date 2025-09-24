// Performance optimization utilities

// Debounce function for search and API calls
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle function for scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without IntersectionObserver
    callback([], { observe: () => {}, unobserve: () => {}, disconnect: () => {} });
    return { observe: () => {}, unobserve: () => {}, disconnect: () => {} };
  }

  return new IntersectionObserver(callback, defaultOptions);
};

// Memory usage monitor
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = performance.memory;
    return {
      usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
      totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
      jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
    };
  }
  return null;
};

// Performance metrics collection
export const collectPerformanceMetrics = () => {
  if (!('performance' in window)) return null;

  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  
  return {
    // Navigation timing
    dns: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
    connect: Math.round(navigation.connectEnd - navigation.connectStart),
    request: Math.round(navigation.responseStart - navigation.requestStart),
    response: Math.round(navigation.responseEnd - navigation.responseStart),
    dom: Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart),
    load: Math.round(navigation.loadEventEnd - navigation.navigationStart),
    
    // Paint timing
    fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
    fp: paint.find(p => p.name === 'first-paint')?.startTime || 0,
    
    // Memory
    memory: getMemoryUsage(),
    
    timestamp: Date.now()
  };
};

// Bundle analyzer
export const analyzeBundleSize = () => {
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  return {
    scripts: scripts.map(script => ({
      src: script.src,
      size: script.dataset.size || 'unknown'
    })),
    stylesheets: stylesheets.map(link => ({
      href: link.href,
      size: link.dataset.size || 'unknown'
    })),
    total: scripts.length + stylesheets.length
  };
};

// Component render profiler
export const withPerformanceProfiler = (WrappedComponent, componentName) => {
  return (props) => {
    const renderStart = performance.now();
    
    // Note: This is a simplified version without React hooks
    // In a real implementation, you'd need to use React.memo and forwardRef properly
    
    return WrappedComponent(props);
  };
};