import React from 'react'
import { useInView } from 'react-intersection-observer'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'

export const InfiniteScrollPagination = ({ 
  hasNextPage, 
  fetchNextPage, 
  isFetchingNextPage,
  isError,
  error 
}) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px'
  })

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 p-4">
        <p className="text-sm text-destructive">Error loading more items</p>
        <Button variant="outline" onClick={() => fetchNextPage()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div ref={ref} className="flex justify-center p-4">
      {isFetchingNextPage && <LoadingSpinner />}
    </div>
  )
}