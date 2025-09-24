
import { Card, CardContent } from "@/components/ui/card";
import { 
  Bus, 
  CheckCircle,
  IndianRupee,
  Eye
} from "lucide-react";

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
 * @property {string} verification_status
 * @property {string} created_at
 */

/**
 * @typedef {Object} StatsCardsProps
 * @property {Ticket[]} tickets
 * @property {Ticket[]} availableTickets
 */

export const StatsCards = ({ tickets, availableTickets }) => {
  const activeTickets = tickets.filter(t => t.status === 'available');
  const soldTickets = tickets.filter(t => t.status === 'sold');
  const totalEarnings = soldTickets.reduce((sum, ticket) => sum + ticket.selling_price, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Listings</p>
              <p className="text-2xl font-bold text-gray-900">{activeTickets.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bus className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
              <p className="text-2xl font-bold text-gray-900">{soldTickets.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900 flex items-center">
                <IndianRupee className="h-5 w-5" />
                {totalEarnings}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{availableTickets.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
