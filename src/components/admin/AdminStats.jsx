
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TicketIcon, CheckCircle, AlertCircle, Bus, Train, Plane } from "lucide-react";

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string|null} full_name
 * @property {string|null} phone
 * @property {string} user_type
 * @property {string} kyc_status
 * @property {string} created_at
 */

/**
 * @typedef {Object} Ticket
 * @property {string} id
 * @property {string} status
 * @property {string} transport_mode
 */

/**
 * @typedef {Object} AdminStatsProps
 * @property {Profile[]} users
 * @property {Ticket[]} tickets
 */

export const AdminStats = ({ users, tickets }) => {
  const totalUsers = users.length;
  const verifiedUsers = users.filter(user => user.kyc_status === 'verified').length;
  const pendingKYC = users.filter(user => user.kyc_status === 'pending').length;
  const totalTickets = tickets.length;
  const activeTickets = tickets.filter(ticket => ticket.status === 'available').length;
  const soldTickets = tickets.filter(ticket => ticket.status === 'sold').length;

  // Transport mode statistics
  const busTickets = tickets.filter(ticket => ticket.transport_mode === 'bus');
  const trainTickets = tickets.filter(ticket => ticket.transport_mode === 'train');
  const planeTickets = tickets.filter(ticket => ticket.transport_mode === 'plane');
  const activeBusTickets = busTickets.filter(ticket => ticket.status === 'available').length;
  const activeTrainTickets = trainTickets.filter(ticket => ticket.status === 'available').length;
  const activePlaneTickets = planeTickets.filter(ticket => ticket.status === 'available').length;

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {verifiedUsers} verified, {pendingKYC} pending KYC
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <TicketIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              {activeTickets} active, {soldTickets} sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : 0}% of users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingKYC}</div>
            <p className="text-xs text-muted-foreground">
              Listed for sale
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transport Mode Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bus Tickets</CardTitle>
            <Bus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{busTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeBusTickets} active, {busTickets.length - activeBusTickets} sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Train Tickets</CardTitle>
            <Train className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeTrainTickets} active, {trainTickets.length - activeTrainTickets} sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plane Tickets</CardTitle>
            <Plane className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planeTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              {activePlaneTickets} active, {planeTickets.length - activePlaneTickets} sold
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
