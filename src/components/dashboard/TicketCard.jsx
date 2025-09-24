import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Clock, MapPin, User, ArrowRight, Shield, ShieldCheck, ShieldX, Train, Bus, Plane } from "lucide-react";
import { format } from "date-fns";
import { QuickPurchaseButton } from "@/components/purchase/QuickPurchaseButton";

const TicketCard = ({ ticket, onBuyClick, isOwner = false }) => {
  // Debug log to inspect the ticket data
  console.log('TicketCard ticket:', ticket);
  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { label: "Available", variant: "default" },
      sold: { label: "Sold", variant: "secondary" },
      cancelled: { label: "Cancelled", variant: "destructive" }
    };
    
    const config = statusConfig[status] || statusConfig.available;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getVerificationBadge = (ticket) => {
    // Check for API verification first (highest priority)
    if (ticket.api_verified && ticket.verification_status === 'verified') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          API Verified
        </Badge>
      );
    }
    
    // Regular verification
    if (ticket.verification_status === 'verified') {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Verified
        </Badge>
      );
    }
    
    // Pending or other status
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Pending
      </Badge>
    );
  };

  const getTransportModeIcon = () => {
    const mode = ticket.transport_mode || 'bus';
    if (mode === 'train') {
      return <Train className="h-4 w-4 text-green-600" />;
    } else if (mode === 'plane') {
      return <Plane className="h-4 w-4 text-purple-600" />;
    }
    return <Bus className="h-4 w-4 text-blue-600" />;
  };

  const getOperatorName = () => {
    if (ticket.transport_mode === 'train') {
      return ticket.railway_operator || ticket.train_name || 'Indian Railways';
    } else if (ticket.transport_mode === 'plane') {
      return ticket.airline_name || ticket.airline_operator || 'Airline';
    }
    return ticket.bus_operator || ticket.operator || 'Bus Operator';
  };

  const getSeatInfo = () => {
    if (ticket.transport_mode === 'train') {
      return ticket.seat_number || ticket.coach_number || 'N/A';
    } else if (ticket.transport_mode === 'plane') {
      return ticket.seat_number || ticket.cabin_class || 'N/A';
    }
    return ticket.seat_number || 'N/A';
  };

  const getTransportModeBadge = () => {
    const mode = ticket.transport_mode || 'bus';
    const config = {
      train: { label: 'Train', className: 'bg-green-100 text-green-800 border-green-200' },
      plane: { label: 'Plane', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      bus: { label: 'Bus', className: 'bg-blue-100 text-blue-800 border-blue-200' }
    };
    
    const modeConfig = config[mode] || config.bus;
    return (
      <Badge className={modeConfig.className}>
        {modeConfig.label}
      </Badge>
    );
  };

  const getAdditionalInfo = () => {
    if (ticket.transport_mode === 'train') {
      const info = [];
      if (ticket.train_number) info.push(`Train: ${ticket.train_number}`);
      if (ticket.platform_number) info.push(`Platform: ${ticket.platform_number}`);
      if (ticket.railway_zone) info.push(`Zone: ${ticket.railway_zone}`);
      if (ticket.is_tatkal) info.push('Tatkal');
      return info;
    } else if (ticket.transport_mode === 'plane') {
      const info = [];
      if (ticket.flight_number) info.push(`Flight: ${ticket.flight_number}`);
      if (ticket.airport_terminal) info.push(`Terminal: ${ticket.airport_terminal}`);
      if (ticket.baggage_allowance) info.push(`Baggage: ${ticket.baggage_allowance}`);
      return info;
    }
    return [];
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getTransportModeIcon()}
              <CardTitle className="text-lg font-semibold">
                {getOperatorName()}
              </CardTitle>
            </div>
            {/* Show passenger name under the operator if present */}
            {ticket.passenger_name && (
              <CardDescription className="flex items-center gap-1 mt-1">
                <User className="h-3 w-3" />
                {ticket.passenger_name}
              </CardDescription>
            )}
            {/* Show seller info if available (from database function) */}
            {ticket.seller_name && !isOwner && (
              <CardDescription className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                Seller: {ticket.seller_name}
                {ticket.seller_kyc_status === 'verified' && (
                  <Badge variant="outline" className="text-xs">Verified</Badge>
                )}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            {getTransportModeBadge()}
            {getVerificationBadge(ticket)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{ticket.from_location || ticket.source_location || ticket.source_station || ticket.source_airport || ''}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{ticket.to_location || ticket.destination_location || ticket.destination_station || ticket.destination_airport || ''}</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">
              {ticket.transport_mode === 'train' ? 'Coach & Berth' : 'Seat'}
            </div>
            <div className="font-semibold">{getSeatInfo()}</div>
          </div>
        </div>
        {/* Show onboarding station for bus tickets if present */}
        {ticket.transport_mode === 'bus' && ticket.onboarding_station && (
          <div className="text-xs text-blue-700 font-medium mt-1">
            Onboarding: {ticket.onboarding_station}
          </div>
        )}
        {/* Additional train/plane information can be added here if needed */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              {ticket.departure_date ? format(new Date(ticket.departure_date), "MMM dd, yyyy") : "N/A"}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {ticket.departure_time}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Original Price</div>
              <div className="text-sm line-through text-muted-foreground">
                ₹{ticket.ticket_price || ticket.price}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Selling Price</div>
              <div className="text-lg font-bold text-green-600">
                ₹{ticket.selling_price || ticket.price}
              </div>
            </div>
            {(ticket.ticket_price || ticket.price) > (ticket.selling_price || ticket.price) && (
              <Badge variant="secondary" className="text-xs">
                Save ₹{((ticket.ticket_price || ticket.price) - (ticket.selling_price || ticket.price)).toFixed(2)}
              </Badge>
            )}
          </div>
          {!isOwner && ticket.status === 'available' && (
            <QuickPurchaseButton 
              ticket={ticket}
              onPurchaseSuccess={onBuyClick}
            />
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          PNR: {ticket.pnr_number || ticket.pnr} • Listed {(ticket.created_at || ticket.updated_at) ? format(new Date(ticket.created_at || ticket.updated_at), "MMM dd") : "Recently"}
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketCard;