import React from 'react';
import { useViewportChange } from '@/hooks/useViewportChange';

export const ViewportChangeHandler = () => {
  // Use the viewport change hook to handle all viewport-related routing issues
  const { currentViewport } = useViewportChange();

  // This component doesn't render anything, it just handles viewport changes
  // The hook takes care of all the logic for preventing 404 errors during viewport changes
  
  return null;
};
