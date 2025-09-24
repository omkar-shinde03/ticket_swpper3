import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useViewportChange = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const resizeTimeoutRef = useRef(null);
  const orientationTimeoutRef = useRef(null);
  const lastViewportRef = useRef({
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.screen?.orientation?.type || 'portrait'
  });

  // Check if route is valid
  const isValidRoute = useCallback((pathname) => {
    const validRoutes = ['/', '/auth', '/dashboard', '/admin', '/admin-login', '/verify-email'];
    return validRoutes.includes(pathname);
  }, []);

  // Handle viewport resize (desktop/mobile mode switch)
  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      const previousWidth = lastViewportRef.current.width;
      const previousHeight = lastViewportRef.current.height;

      // Check if this is a significant viewport change (mode switch)
      const isSignificantChange = 
        Math.abs(currentWidth - previousWidth) > 100 || 
        Math.abs(currentHeight - previousHeight) > 100;

      if (isSignificantChange) {
        console.log('Significant viewport change detected:', {
          from: `${previousWidth}x${previousHeight}`,
          to: `${currentWidth}x${currentHeight}`,
          currentRoute: location.pathname
        });

        // Update stored viewport info
        lastViewportRef.current = {
          width: currentWidth,
          height: currentHeight,
          orientation: window.screen?.orientation?.type || 'portrait'
        };

        // Check if current route is still valid
        if (!isValidRoute(location.pathname)) {
          console.log('Invalid route after viewport change, redirecting to home');
          navigate('/', { replace: true });
        } else {
          // Force a route refresh to handle any layout issues
          const currentPath = location.pathname;
          navigate('/', { replace: true });
          setTimeout(() => {
            navigate(currentPath, { replace: true });
          }, 100);
        }
      }
    }, 300);
  }, [location.pathname, navigate, isValidRoute]);

  // Handle orientation change
  const handleOrientationChange = useCallback(() => {
    if (orientationTimeoutRef.current) {
      clearTimeout(orientationTimeoutRef.current);
    }

    orientationTimeoutRef.current = setTimeout(() => {
      const currentOrientation = window.screen?.orientation?.type || 'portrait';
      const previousOrientation = lastViewportRef.current.orientation;

      if (currentOrientation !== previousOrientation) {
        console.log('Orientation change detected:', {
          from: previousOrientation,
          to: currentOrientation,
          currentRoute: location.pathname
        });

        // Update stored orientation
        lastViewportRef.current.orientation = currentOrientation;

        // Handle orientation change for current route
        const currentPath = location.pathname;
        if (currentPath !== '/') {
          // Temporarily navigate to home and back to refresh the route
          navigate('/', { replace: true });
          setTimeout(() => {
            navigate(currentPath, { replace: true });
          }, 200);
        }
      }
    }, 200);
  }, [location.pathname, navigate]);

  // Handle beforeunload to store current route
  const handleBeforeUnload = useCallback(() => {
    // Store current route and viewport info for recovery
    sessionStorage.setItem('lastRoute', location.pathname);
    sessionStorage.setItem('lastViewport', JSON.stringify(lastViewportRef.current));
    sessionStorage.setItem('lastRouteTimestamp', Date.now().toString());
  }, [location.pathname]);

  // Handle page load to recover from viewport change issues
  const handleLoad = useCallback(() => {
    const lastRoute = sessionStorage.getItem('lastRoute');
    const lastViewport = sessionStorage.getItem('lastViewport');
    const lastRouteTimestamp = sessionStorage.getItem('lastRouteTimestamp');
    
    if (lastRoute && lastViewport && lastRouteTimestamp) {
      try {
        const storedViewport = JSON.parse(lastViewport);
        const timeDiff = Date.now() - parseInt(lastRouteTimestamp);
        
        // Only recover if the page was reloaded within the last 10 seconds
        if (timeDiff < 10000) {
          const currentViewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            orientation: window.screen?.orientation?.type || 'portrait'
          };

          // Check if viewport changed significantly
          const isSignificantChange = 
            Math.abs(currentViewport.width - storedViewport.width) > 50 || 
            Math.abs(currentViewport.height - storedViewport.height) > 50 ||
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
      
      // Clear the stored info
      sessionStorage.removeItem('lastRoute');
      sessionStorage.removeItem('lastViewport');
      sessionStorage.removeItem('lastRouteTimestamp');
    }
  }, [location.pathname, navigate]);

  // Handle visibility change (when user switches tabs or apps)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      // Check if viewport changed while app was hidden
      const currentViewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: window.screen?.orientation?.type || 'portrait'
      };

      const isSignificantChange = 
        Math.abs(currentViewport.width - lastViewportRef.current.width) > 50 || 
        Math.abs(currentViewport.height - lastViewportRef.current.height) > 50 ||
        currentViewport.orientation !== lastViewportRef.current.orientation;

      if (isSignificantChange) {
        console.log('Viewport changed while app was hidden, updating route');
        handleResize();
      }
    }
  }, [handleResize]);

  useEffect(() => {
    // Add event listeners
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial viewport check
    lastViewportRef.current = {
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: window.screen?.orientation?.type || 'portrait'
    };

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
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleResize, handleOrientationChange, handleBeforeUnload, handleLoad, handleVisibilityChange]);

  // Return current viewport info and handlers
  return {
    currentViewport: lastViewportRef.current,
    handleResize,
    handleOrientationChange,
    isValidRoute
  };
};
