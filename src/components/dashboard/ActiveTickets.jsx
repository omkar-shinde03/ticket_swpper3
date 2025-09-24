
import React, { useEffect, useState } from "react";
import { getTickets } from "@/utils/ticketApiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bus, Clock, CheckCircle, AlertCircle } from "lucide-react";

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
 */

export const ActiveTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getTickets()
      .then((data) => {
        setTickets(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const activeTickets = tickets.filter((t) => t.status === "available");

  const getStatusColor = (status) => {
    switch (status) {
      case "available": {
        return "bg-blue-100 text-blue-800";
      }
      case "sold": {
        return "bg-green-100 text-green-800";
      }
      case "cancelled": {
        return "bg-red-100 text-red-800";
      }
      default: {
        return "bg-gray-100 text-gray-800";
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "available": {
        return <Clock className="h-3 w-3" />;
      }
      case "sold": {
        return <CheckCircle className="h-3 w-3" />;
      }
      case "cancelled": {
        return <AlertCircle className="h-3 w-3" />;
      }
      default: {
        return null;
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Active Tickets</CardTitle>
        <CardDescription>Manage your currently listed tickets</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : activeTickets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active tickets</p>
            <p className="text-sm">Start by selling your first ticket</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium">{ticket.from_location} → {ticket.to_location}</h3>
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1 capitalize">{ticket.status}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {ticket.departure_date} at {ticket.departure_time} • PNR: {ticket.pnr_number}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-lg font-bold text-green-600">₹{ticket.selling_price}</span>
                    <span className="text-sm text-gray-500">Operator: {ticket.bus_operator}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
