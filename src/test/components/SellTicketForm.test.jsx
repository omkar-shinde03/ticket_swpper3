import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SellTicketForm } from '@/components/dashboard/SellTicketForm';

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({
        data: { id: 1 },
        error: null
      }))
    }))
  }
}));

const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('SellTicketForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields', () => {
    renderWithProviders(<SellTicketForm />);
    
    expect(screen.getByLabelText(/departure city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/destination city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/departure date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SellTicketForm />);
    
    const submitButton = screen.getByRole('button', { name: /list ticket/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/departure city is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    
    renderWithProviders(<SellTicketForm onSuccess={onSuccess} />);
    
    // Fill form
    await user.type(screen.getByLabelText(/departure city/i), 'Mumbai');
    await user.type(screen.getByLabelText(/destination city/i), 'Delhi');
    await user.type(screen.getByLabelText(/price/i), '500');
    
    // Submit
    await user.click(screen.getByRole('button', { name: /list ticket/i }));
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});