import React, { useState } from 'react'
import { cn } from '@/lib/utils'

export const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  width, 
  height,
  placeholder = 'blur',
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ width, height }}
        />
      )}
      
      {hasError ? (
        <div 
          className="flex items-center justify-center bg-muted text-muted-foreground text-sm"
          style={{ width, height }}
        >
          Failed to load image
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  )
}