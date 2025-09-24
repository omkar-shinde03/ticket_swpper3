import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TicketCard from "../dashboard/TicketCard";
import { EmptyState } from "../dashboard/EmptyStates";
import { TicketGridSkeleton } from "../dashboard/LoadingStates";
import { useNavigate } from "react-router-dom";

export const AvailableTicketsSection = ({ tickets, isLoading }) => {
  const navigate = useNavigate();

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-background mobile-optimized">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 animate-fade-in-up mobile-spacing">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 mobile-heading">
            Available Tickets
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mobile-text">
            Browse and purchase verified bus and train tickets from other users
          </p>
        </div>

        {isLoading ? (
          <TicketGridSkeleton />
        ) : tickets.length === 0 ? (
          <EmptyState
            type="tickets"
            title="No available tickets"
            description="Check back later for new ticket listings."
          />
        ) : (
          <div className="space-y-4">
            {tickets.slice(0, 3).map((ticket) => (
              <div key={ticket.id} className="relative">
                <TicketCard
                  ticket={ticket}
                  isOwner={false}
                  onBuyClick={() => {
                    // Redirect to auth page for non-logged users
                    window.location.href = '/auth';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Available
                  </Badge>
                </div>
              </div>
            ))}
            
            {tickets.length > 0 && (
              <div className="mt-8 text-center">
                <Button 
                  onClick={() => navigate('/auth')}
                  variant="default"
                  size="lg"
                  className="w-full md:w-auto mobile-button"
                >
                  Sign Up to Purchase Tickets
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};