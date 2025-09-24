import React, { useEffect, useRef } from 'react';

// Focus management utilities
export const useFocusTrap = (isActive = true) => {
  const containerRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    previousActiveElement.current = document.activeElement;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        previousActiveElement.current?.focus();
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
      previousActiveElement.current?.focus();
    };
  }, [isActive]);

  return containerRef;
};

// Skip navigation component
export const SkipNavigation = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-4 py-2 rounded z-50"
    >
      Skip to main content
    </a>
  );
};

// Keyboard navigation announcer
export const LiveRegion = ({ children, priority = 'polite' }) => {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
};

// Focus restoration hook
export const useFocusRestoration = () => {
  const previousFocus = useRef(null);

  const saveFocus = () => {
    previousFocus.current = document.activeElement;
  };

  const restoreFocus = () => {
    if (previousFocus.current && typeof previousFocus.current.focus === 'function') {
      previousFocus.current.focus();
    }
  };

  return { saveFocus, restoreFocus };
};