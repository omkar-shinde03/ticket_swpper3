import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * @typedef {Object} Ticket
 * @property {string} id
 * @property {string} pnr_number
 * @property {string} bus_operator
 * @property {string} departure_date
 * @property {string} departure_time
 * @property {string} from_location
 * @property {string} to_location
 * @property {string} passenger_name
 * @property {string} seat_number
 * @property {number} ticket_price
 * @property {number} selling_price
 * @property {string} status
 
 * @property {string} created_at
 * @property {string} seller_id
 */

/**
 * @typedef {Object} TicketManagementProps
 * @property {Ticket[]} tickets
 * @property {Function} onUpdate
 */

export const TicketManagement = ({ tickets, onUpdate }) => {
  const [loading, setLoading] = useState(null);
  const { toast } = useToast();


  const handleDeleteTicket = async (ticketId) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    
    setLoading(ticketId);
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) {
        throw error;
      }

      toast({
        title: "Ticket deleted",
        description: "Ticket has been removed successfully.",
      });

      onUpdate();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Management</CardTitle>
        <CardDescription>Review and manage all tickets on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PNR</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">{ticket.pnr_number}</TableCell>
                <TableCell>
                  {ticket.from_location} → {ticket.to_location}
                </TableCell>
                <TableCell>{ticket.bus_operator}</TableCell>
                <TableCell>₹{ticket.selling_price}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline"
                    className={
                      ticket.status === 'available' 
                        ? 'text-green-700 bg-green-100' 
                        : ticket.status === 'sold'
                        ? 'text-blue-700 bg-blue-100'
                        : 'text-gray-700 bg-gray-100'
                    }
                  >
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteTicket(ticket.id)}
                      disabled={loading === ticket.id}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
