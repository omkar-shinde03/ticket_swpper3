import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validatePNRInBackground } from "@/utils/pnrValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import EmailVerificationGuard from "./EmailVerificationGuard";

const QuickSellForm = ({ user, onTicketAdded }) => {
  const [newTicket, setNewTicket] = useState({
    pnr_number: "",
    bus_operator: "",
    passenger_name: ""
  });
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to sell tickets.",
        variant: "destructive",
      });
      return;
    }
    setIsValidating(true);
    try {
      toast({
        title: "Validating ticket...",
        description: "Verifying PNR with operator API",
      });
      const validation = await validatePNRInBackground(
        newTicket.pnr_number, 
        newTicket.bus_operator,
        {
          passengerName: newTicket.passenger_name
        }
      );
      if (!validation.isValid) {
        toast({
          title: "Invalid PNR or Details",
          description: `${validation.error}. Please check your details.`,
          variant: "destructive",
        });
        return;
      }
      // Use API data for all ticket details
      const apiData = validation.ticketData;
      const { error } = await supabase
        .from('tickets')
        .insert([
          {
            seller_id: user.id,
            pnr_number: newTicket.pnr_number,
            bus_operator: apiData.bus_operator || newTicket.bus_operator,
            departure_date: apiData.departure_date,
            departure_time: apiData.departure_time,
            from_location: apiData.from_location,
            to_location: apiData.to_location,
            passenger_name: apiData.passenger_name,
            seat_number: apiData.seat_number,
            ticket_price: parseFloat(apiData.ticket_price),
            selling_price: parseFloat(apiData.ticket_price), // Same as original price
            status: 'available',
            verification_status: 'verified'
          }
        ]);

      if (error) {
        toast({
          title: "Error listing ticket",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Ticket Verified and Listed!",
        description: `PNR verified and ticket listed for ₹${apiData.ticket_price}`,
      });

      // Reset form
      setNewTicket({
        pnr_number: "",
        bus_operator: "",
        passenger_name: ""
      });
      onTicketAdded?.();
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast({
        title: "Error",
        description: "Failed to list ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <EmailVerificationGuard requiredFor="sell tickets">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Sell Your Ticket
          </CardTitle>
          <CardDescription>
            Enter your ticket details to list it for sale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTicketSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pnr_number">PNR Number</Label>
                <Input
                  id="pnr_number"
                  value={newTicket.pnr_number}
                  onChange={(e) => setNewTicket({...newTicket, pnr_number: e.target.value})}
                  placeholder="Enter PNR number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="bus_operator">Bus Operator (Optional)</Label>
                <Input
                  id="bus_operator"
                  value={newTicket.bus_operator}
                  onChange={(e) => setNewTicket({...newTicket, bus_operator: e.target.value})}
                  placeholder="e.g. KSRTC, RedBus"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="passenger_name">Passenger Name</Label>
                <Input
                  id="passenger_name"
                  value={newTicket.passenger_name}
                  onChange={(e) => setNewTicket({...newTicket, passenger_name: e.target.value})}
                  placeholder="Name on ticket"
                  required
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isValidating}>
              {isValidating ? "Validating..." : "Verify & List Ticket"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </EmailVerificationGuard>
  );
};

export default QuickSellForm;