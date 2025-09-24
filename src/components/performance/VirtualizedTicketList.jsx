import React, { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { TicketCard } from '@/components/dashboard/TicketCard'
import { useInfiniteQuery } from '@tanstack/react-query'
import { InfiniteScrollPagination } from './InfiniteScrollPagination'

const ITEM_HEIGHT = 200
const ITEMS_PER_PAGE = 20

const TicketItem = ({ index, style, data }) => {
  const ticket = data.tickets[index]
  
  if (!ticket) {
    return (
      <div style={style} className="p-4">
        <div className="animate-pulse bg-muted rounded-lg h-40" />
      </div>
    )
  }

  return (
    <div style={style} className="p-2">
      <TicketCard ticket={ticket} />
    </div>
  )
}

export const VirtualizedTicketList = ({ 
  tickets = [], 
  hasNextPage, 
  fetchNextPage, 
  isFetchingNextPage,
  isError,
  error,
  height = 600 
}) => {
  const flattenedTickets = useMemo(() => {
    return tickets.flat()
  }, [tickets])

  const itemData = useMemo(() => ({
    tickets: flattenedTickets
  }), [flattenedTickets])

  if (!flattenedTickets.length) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        No tickets available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <List
        height={height}
        itemCount={flattenedTickets.length}
        itemSize={ITEM_HEIGHT}
        itemData={itemData}
        overscanCount={5}
        className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-background"
      >
        {TicketItem}
      </List>
      
      <InfiniteScrollPagination
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isError={isError}
        error={error}
      />
    </div>
  )
}