import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const MobileViewportManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewportInfo, setViewportInfo] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.screen?.orientation?.type || 'portrait',
    isMobile: window.innerWidth <= 768,
    isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
    isDesktop: window.innerWidth > 1024
  });
  
  const lastViewportRef = useRef(viewportInfo);
  const resizeTimeoutRef = useRef(null);
  const orientationTimeoutRef = useRef(null);
  const serviceWorkerRef = useRef(null);

  // Initialize service worker communication
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      serviceWorkerRef.current = navigator.serviceWorker.controller;
    }
  }, []);

  // Detect viewport changes and handle routing issues
  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        const newViewport = {
          width: window.innerWidth,
          height: window.innerHeight,
          orientation: window.screen?.orientation?.type || 'portrait',
          isMobile: window.innerWidth <= 768,
          isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
          isDesktop: window.innerWidth > 1024
        };

        const oldViewport = lastViewportRef.current;
        
        // Check if this is a significant viewport change (mode switch)
        const isSignificantChange = 
          Math.abs(newViewport.width - oldViewport.width) > 100 || 
          Math.abs(newViewport.height - oldViewport.height) > 100 ||
          newViewport.isMobile !== oldViewport.isMobile ||
          newViewport.isTablet !== oldViewport.isTablet ||
          newViewport.isDesktop !== oldViewport.isDesktop;

        if (isSignificantChange) {
          console.log('Significant viewport change detected:', {
            from: oldViewport,
            to: newViewport,
            currentRoute: location.pathname
          });

          // Update viewport info
          setViewportInfo(newViewport);
          lastViewportRef.current = newViewport;

          // Notify service worker about viewport change
          if (serviceWorkerRef.current) {
            serviceWorkerRef.current.postMessage({
              type: 'VIEWPORT_CHANGE',
              data: {
                oldViewport,
                newViewport,
                route: location.pathname
              }
            });
          }

          // Handle routing issues after viewport change
          handleViewportChangeRouting(oldViewport, newViewport);
        }
      }, 300);
    };

    const handleOrientationChange = () => {
      if (orientationTimeoutRef.current) {
        clearTimeout(orientationTimeoutRef.current);
      }

      orientationTimeoutRef.current = setTimeout(() => {
        const newOrientation = window.screen?.orientation?.type || 'portrait';
        const oldOrientation = lastViewportRef.current.orientation;

        if (newOrientation !== oldOrientation) {
          console.log('Orientation change detected:', {
            from: oldOrientation,
            to: newOrientation,
            currentRoute: location.pathname
          });

          // Update orientation
          const newViewport = { ...lastViewportRef.current, orientation: newOrientation };
          setViewportInfo(newViewport);
          lastViewportRef.current = newViewport;

          // Handle orientation change routing
          handleOrientationChangeRouting(oldOrientation, newOrientation);
        }
      }, 200);
    };

    // Add event listeners
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true });

    // Cleanup
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (orientationTimeoutRef.current) {
        clearTimeout(orientationTimeoutRef.current);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [location.pathname]);

  // Handle routing issues after viewport change
  const handleViewportChangeRouting = (oldViewport, newViewport) => {
    const currentPath = location.pathname;
    const validRoutes = ['/', '/auth', '/dashboard', '/admin', '/admin-login', '/verify-email'];

    // Check if current route is still valid
    if (!validRoutes.includes(currentPath)) {
      console.log('Invalid route after viewport change, redirecting to home');
      navigate('/', { replace: true });
      return;
    }

    // If switching between mobile and desktop modes, refresh the route
    if (oldViewport.isMobile !== newViewport.isMobile || 
        oldViewport.isTablet !== newViewport.isTablet || 
        oldViewport.isDesktop !== newViewport.isDesktop) {
      
      console.log('Device mode changed, refreshing current route');
      
      // Temporarily navigate to home and back to refresh the route
      navigate('/', { replace: true });
      setTimeout(() => {
        navigate(currentPath, { replace: true });
      }, 100);
    }
  };

  // Handle routing issues after orientation change
  const handleOrientationChangeRouting = (oldOrientation, newOrientation) => {
    const currentPath = location.pathname;
    
    if (currentPath !== '/') {
      console.log('Orientation changed, refreshing current route');
      
      // Temporarily navigate to home and back to refresh the route
      navigate('/', { replace: true });
      setTimeout(() => {
        navigate(currentPath, { replace: true });
      }, 200);
    }
  };

  // Listen for service worker messages
  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'VIEWPORT_CHANGE_PROCESSED') {
        console.log('Service worker processed viewport change:', event.data);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // Store viewport info in sessionStorage for recovery
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('lastViewport', JSON.stringify(viewportInfo));
      sessionStorage.setItem('lastRoute', location.pathname);
      sessionStorage.setItem('lastViewportTimestamp', Date.now().toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [viewportInfo, location.pathname]);

  // Recover from viewport change issues on page load
  useEffect(() => {
    const handleLoad = () => {
      const lastViewport = sessionStorage.getItem('lastViewport');
      const lastRoute = sessionStorage.getItem('lastRoute');
      const lastTimestamp = sessionStorage.getItem('lastViewportTimestamp');

      if (lastViewport && lastRoute && lastTimestamp) {
        try {
          const storedViewport = JSON.parse(lastViewport);
          const timeDiff = Date.now() - parseInt(lastTimestamp);

          // Only recover if the page was reloaded within the last 10 seconds
          if (timeDiff < 10000) {
            const currentViewport = viewportInfo;
            
            // Check if viewport changed significantly
            const isSignificantChange = 
              Math.abs(currentViewport.width - storedViewport.width) > 50 || 
              Math.abs(currentViewport.height - storedViewport.height) > 50 ||
              currentViewport.isMobile !== storedViewport.isMobile ||
              currentViewport.isTablet !== storedViewport.isTablet ||
              currentViewport.isDesktop !== storedViewport.isDesktop ||
              currentViewport.orientation !== storedViewport.orientation;

            if (isSignificantChange && lastRoute !== location.pathname) {
              console.log('Recovering from viewport change:', {
                storedRoute: lastRoute,
                currentRoute: location.pathname,
                storedViewport,
                currentViewport
              });
              
              // Navigate to the stored route
              navigate(lastRoute, { replace: true });
            }
          }
        } catch (error) {
          console.error('Error parsing stored viewport info:', error);
        }

        // Clear stored info
        sessionStorage.removeItem('lastViewport');
        sessionStorage.removeItem('lastRoute');
        sessionStorage.removeItem('lastViewportTimestamp');
      }
    };

    // Trigger on mount
    handleLoad();
  }, []); // Only run once on mount

  // This component doesn't render anything, it just manages viewport changes
  return null;
};
