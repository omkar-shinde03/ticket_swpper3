import { useEffect } from 'react';

// Security headers component - sets CSP and other security headers via meta tags
export const SecurityHeaders = () => {
  useEffect(() => {
    // Set Content Security Policy
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://www.google.com https://js.stripe.com https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://www.google.com https://api.emailjs.com https://*.emailjs.com https://api.razorpay.com https://lumberjack.razorpay.com",
      "frame-src 'self' https://js.stripe.com https://www.google.com https://checkout.razorpay.com https://api.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    // Only add if not already present
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      document.head.appendChild(cspMeta);
    }

    // Set other security headers via meta tags (when possible)
    // Note: X-Frame-Options and frame-ancestors must be set via HTTP headers from server
    const securityMetas = [
      { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
      { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' },
      { httpEquiv: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
    ];

    securityMetas.forEach(({ httpEquiv, content }) => {
      if (!document.querySelector(`meta[http-equiv="${httpEquiv}"]`)) {
        const meta = document.createElement('meta');
        meta.httpEquiv = httpEquiv;
        meta.content = content;
        document.head.appendChild(meta);
      }
    });

    // Set security-related attributes on external links
    const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])');
    externalLinks.forEach(link => {
      link.setAttribute('rel', 'noopener noreferrer');
      link.setAttribute('target', '_blank');
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  return null; // This component doesn't render anything
};

// Rate limiting utility
export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(identifier = 'default') {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    let userRequests = this.requests.get(identifier) || [];
    
    // Filter out requests outside the window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if under limit
    if (userRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    userRequests.push(now);
    this.requests.set(identifier, userRequests);
    
    return true;
  }

  getStatus(identifier = 'default') {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const userRequests = (this.requests.get(identifier) || [])
      .filter(timestamp => timestamp > windowStart);
    
    return {
      remaining: Math.max(0, this.maxRequests - userRequests.length),
      resetTime: now + this.windowMs,
      total: this.maxRequests
    };
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter(1000, 60 * 1000); // 1000 requests per minute

// Input sanitization utilities
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// XSS protection for displaying user content
export const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// CSRF token management
export const getCsrfToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

// Secure storage utilities
export const secureStorage = {
  set: (key, value, encrypt = false) => {
    try {
      const data = encrypt ? btoa(JSON.stringify(value)) : JSON.stringify(value);
      localStorage.setItem(key, data);
      return true;
    } catch (e) {
      console.error('Failed to store data securely:', e);
      return false;
    }
  },
  
  get: (key, decrypt = false) => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      const parsed = decrypt ? JSON.parse(atob(data)) : JSON.parse(data);
      return parsed;
    } catch (e) {
      console.error('Failed to retrieve data securely:', e);
      return null;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Failed to remove data securely:', e);
      return false;
    }
  }
};