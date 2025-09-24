import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAllTickets, validatePNR } from "@/utils/pnrValidation";
import { Loader, Search, MapPin, Clock, User, CreditCard, CheckCircle, RefreshCw } from "lucide-react";
import { QuickPurchaseButton } from "@/components/purchase/QuickPurchaseButton";
import { isEmailVerified } from "@/utils/emailVerification";

export const LiveTicketBrowser = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [verifying, setVerifying] = useState(null);
  const { toast } = useToast();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const apiTickets = await getAllTickets();
      setTickets(apiTickets);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tickets from API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyTicket = async (ticket) => {
    setVerifying(ticket.pnr_number);
    try {
      const result = await validatePNR(ticket.pnr_number);
      if (result.isValid) {
        toast({
          title: "Ticket Verified",
          description: `PNR ${ticket.pnr_number} is valid and confirmed`,
        });
        setSelectedTicket({ ...ticket, verified: true });
      } else {
        toast({
          title: "Verification Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Unable to verify ticket",
        variant: "destructive",
      });
    } finally {
      setVerifying(null);
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.from_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.to_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.pnr_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Live Ticket Browser
              </CardTitle>
              <CardDescription>
                Browse and verify tickets from the live API
              </CardDescription>
            </div>
            <Button onClick={fetchTickets} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by route, PNR, or passenger name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Badge variant="outline" className="ml-2">
              {filteredTickets.length} tickets
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin mr-2" />
            <span>Loading tickets from API...</span>
          </CardContent>
        </Card>
      )}

      {/* Tickets Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.pnr_number} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    PNR: {ticket.pnr_number}
                  </Badge>
                  <Badge 
                    variant={ticket.status === 'available' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {ticket.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {ticket.passenger_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{ticket.from_location}</span>
                  <span className="text-gray-400">→</span>
                  <span>{ticket.to_location}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{ticket.departure_date} @ {ticket.departure_time}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-500">Seat:</span> {ticket.seat_number}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ₹{ticket.selling_price || ticket.ticket_price}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVerifyTicket(ticket)}
                    disabled={verifying === ticket.pnr_number}
                    className="flex-1"
                  >
                    {verifying === ticket.pnr_number ? (
                      <Loader className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSelectedTicket(ticket)}
                    className="flex-1"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTickets.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500">
              {searchTerm ? 'No tickets found matching your search.' : 'No tickets available.'}
            </div>
            {searchTerm && (
              <Button 
                variant="link" 
                onClick={() => setSearchTerm("")}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected Ticket Modal/Details */}
      {selectedTicket && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ticket Details</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedTicket(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-gray-500">PNR Number</Label>
                <div className="font-mono">{selectedTicket.pnr_number}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Passenger Name</Label>
                <div>{selectedTicket.passenger_name}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Route</Label>
                <div>{selectedTicket.from_location} → {selectedTicket.to_location}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Journey Date</Label>
                <div>{selectedTicket.departure_date} @ {selectedTicket.departure_time}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Seat Number</Label>
                <div>{selectedTicket.seat_number}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Price</Label>
                <div className="text-lg font-bold text-green-600">
                  ₹{selectedTicket.selling_price || selectedTicket.ticket_price}
                </div>
              </div>
            </div>
            
            {selectedTicket.verified && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Ticket Verified ✓</span>
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <div className="flex-1">
                <QuickPurchaseButton 
                  ticket={selectedTicket}
                  onPurchaseSuccess={() => {
                    toast({
                      title: "Purchase Successful!",
                      description: "Your ticket has been purchased successfully.",
                    });
                    setSelectedTicket(null);
                    fetchTickets(); // Refresh the ticket list
                  }}
                  className="w-full"
                />
              </div>
              <Button variant="outline" className="flex-1">
                Contact Seller
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};