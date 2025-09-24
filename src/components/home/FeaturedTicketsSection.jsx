
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Clock, Users, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const FeaturedTicketsSection = () => {
  const [availableTickets, setAvailableTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAvailableTickets();
  }, []);

  const loadAvailableTickets = async () => {
    try {
      const { data: ticketData, error } = await supabase
        .from('tickets')
        .select(`
          *,
          profiles!tickets_seller_id_fkey (
            full_name
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error("Error loading available tickets:", error);
        return;
      }

      setAvailableTickets(ticketData || []);
    } catch (error) {
      console.error("Error loading available tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleViewTicket = () => {
    navigate('/auth');
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-foreground mb-4">Available Tickets</h2>
          <p className="text-muted-foreground">Find your perfect ticket or list one for sale</p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : availableTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTickets.map((ticket) => (
              <Card key={ticket.id} className="hover:shadow-lg transition-shadow animate-scale-in">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold">
                      {ticket.bus_operator}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {ticket.verification_status}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{ticket.from_location} → {ticket.to_location}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{formatDate(ticket.departure_date)} at {formatTime(ticket.departure_time)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Seat: {ticket.seat_number}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      <span className="text-lg font-bold text-primary">
                        {ticket.selling_price || ticket.ticket_price}
                      </span>
                      {ticket.selling_price && ticket.selling_price < ticket.ticket_price && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          ₹{ticket.ticket_price}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={handleViewTicket}
                    className="w-full mt-4"
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-dashed border-border bg-card/50 text-center p-8 animate-scale-in">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">No tickets available at the moment</p>
                <p className="text-sm text-muted-foreground">Check back later or be the first to list a ticket</p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-dashed border-border bg-card/50 text-center p-8 animate-scale-in delay-100">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">Your ticket could be here</p>
                <p className="text-sm text-muted-foreground">List your ticket to help fellow travelers</p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-dashed border-border bg-card/50 text-center p-8 animate-scale-in delay-200">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">Join our community</p>
                <p className="text-sm text-muted-foreground">Start trading tickets safely and securely</p>
              </CardContent>
            </Card>
          </div>
        )}

        {availableTickets.length > 0 && (
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={handleViewTicket}
              className="px-8"
            >
              View All Tickets
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
