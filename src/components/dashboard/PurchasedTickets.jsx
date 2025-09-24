import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bus, 
  Train, 
  Plane, 
  MapPin, 
  Clock, 
  User, 
  Calendar,
  CheckCircle,
  Download,
  Ticket
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export const PurchasedTickets = ({ userId }) => {
  const [purchasedTickets, setPurchasedTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadPurchasedTickets();
    }
  }, [userId]);

  const loadPurchasedTickets = async () => {
    try {
      setIsLoading(true);
      
      // Get tickets where user is the buyer
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('buyer_id', userId)
        .eq('status', 'sold')
        .order('sold_at', { ascending: false });

      if (ticketsError) {
        console.error('Error loading purchased tickets:', ticketsError);
        throw ticketsError;
      }

      setPurchasedTickets(tickets || []);
    } catch (error) {
      console.error('Error loading purchased tickets:', error);
      toast({
        title: "Error loading purchased tickets",
        description: "Failed to load your purchased tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTransportIcon = (transportMode) => {
    switch (transportMode) {
      case 'train':
        return <Train className="h-4 w-4" />;
      case 'plane':
        return <Plane className="h-4 w-4" />;
      default:
        return <Bus className="h-4 w-4" />;
    }
  };

  const getTransportBadge = (transportMode) => {
    const colors = {
      bus: "bg-blue-100 text-blue-800",
      train: "bg-green-100 text-green-800", 
      plane: "bg-purple-100 text-purple-800"
    };
    
    return (
      <Badge className={colors[transportMode] || colors.bus}>
        {getTransportIcon(transportMode)}
        <span className="ml-1 capitalize">{transportMode}</span>
      </Badge>
    );
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

  const handleDownloadTicket = (ticket) => {
    // Create a simple ticket download
    const ticketData = `
TICKET CONFIRMATION
==================

PNR: ${ticket.pnr_number}
Route: ${ticket.from_location} → ${ticket.to_location}
Date: ${formatDate(ticket.departure_date)}
Time: ${formatTime(ticket.departure_time)}
Passenger: ${ticket.passenger_name}
Seat: ${ticket.seat_number}
Operator: ${ticket.bus_operator || ticket.train_number || ticket.flight_number}
Price Paid: ₹${ticket.selling_price}

Purchase Date: ${formatDate(ticket.sold_at)}
Status: Confirmed

Thank you for using our service!
    `;
    
    const blob = new Blob([ticketData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.pnr_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Ticket Downloaded",
      description: "Your ticket has been downloaded successfully",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            My Purchased Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your tickets...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          My Purchased Tickets
          <Badge variant="secondary">{purchasedTickets.length}</Badge>
        </CardTitle>
        <CardDescription>
          Tickets you have successfully purchased
        </CardDescription>
      </CardHeader>
      <CardContent>
        {purchasedTickets.length === 0 ? (
          <div className="text-center py-8">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Purchased Tickets</h3>
            <p className="text-muted-foreground">
              You haven't purchased any tickets yet. Browse available tickets to make your first purchase!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {purchasedTickets.map((ticket) => (
              <div key={ticket.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {getTransportIcon(ticket.transport_mode)}
                    <h3 className="font-semibold text-lg">
                      {ticket.from_location} → {ticket.to_location}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    {getTransportBadge(ticket.transport_mode)}
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Purchased
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(ticket.departure_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatTime(ticket.departure_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{ticket.passenger_name}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">PNR: </span>
                      <span className="font-mono font-semibold">{ticket.pnr_number}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Seat: </span>
                      <span className="font-semibold">{ticket.seat_number}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Operator: </span>
                      <span>{ticket.bus_operator || ticket.train_number || ticket.flight_number || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="text-lg font-bold text-green-600">
                    ₹{ticket.selling_price}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadTicket(ticket)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-2">
                  Purchased on {formatDate(ticket.sold_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
