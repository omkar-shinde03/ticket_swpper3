import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../utils'
import { TicketCard } from '@/components/dashboard/TicketCard'

const mockTicket = {
  id: '1',
  title: 'Bus to Delhi',
  departure_city: 'Mumbai',
  arrival_city: 'Delhi',
  departure_date: '2024-12-25',
  departure_time: '10:00',
  price: 500,
  original_price: 600,
  status: 'available',
  seller: {
    name: 'John Doe',
    rating: 4.5
  }
}

describe('TicketCard', () => {
  it('renders ticket information correctly', () => {
    render(<TicketCard ticket={mockTicket} />)
    
    expect(screen.getByText('Bus to Delhi')).toBeInTheDocument()
    expect(screen.getByText('Mumbai → Delhi')).toBeInTheDocument()
    expect(screen.getByText('₹500')).toBeInTheDocument()
  })

  it('displays seller information', () => {
    render(<TicketCard ticket={mockTicket} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('shows savings when price is lower than original', () => {
    render(<TicketCard ticket={mockTicket} />)
    
    expect(screen.getByText('₹600')).toBeInTheDocument()
    expect(screen.getByText('Save ₹100')).toBeInTheDocument()
  })
})