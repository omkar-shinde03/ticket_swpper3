import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, DollarSign, Tag, Train, Bus, Plane } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const VerifiedTicketListing = ({ verifiedTicketData, onListingComplete }) => {
  // Debug log to inspect the ticket data
  console.log('VerifiedTicketData:', verifiedTicketData);
  // Re-add isListing for button loading state
  const [isListing, setIsListing] = useState(false);
  // Remove the selling price input and related state/logic
  // Use verifiedTicketData.selling_price as the selling price
  // Display both ticket_price (original) and selling_price (final) in the summary

  const { toast } = useToast();

  // Define transportMode at the top for use throughout the component
  const transportMode = verifiedTicketData.transport_mode || 'bus';

  const handleListTicket = async () => {
    // Check for duplicate listing
    const { data: existingTickets, error: checkError } = await supabase
      .from('tickets')
      .select('id')
      .eq('pnr_number', verifiedTicketData.pnr_number)
      .eq('transport_mode', verifiedTicketData.transport_mode);
    if (checkError) {
      toast({
        title: 'Error',
        description: 'Could not check for existing ticket. Please try again.',
        variant: 'destructive'
      });
      return;
    }
    if (existingTickets && existingTickets.length > 0) {
      toast({
        title: 'Ticket already listed',
        description: 'This ticket has already been listed and cannot be listed again.',
        variant: 'destructive'
      });
      return;
    }

    setIsListing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare ticket data: use all fields from the API, plus any additional fields
      const ticketData = {
        ...verifiedTicketData, // all fields from API
        seller_id: user.id,
        status: 'available',
        verification_status: 'verified',
        transport_mode: transportMode,
        api_verified: true,
        api_provider: 'ticket-demo-api',
        verification_confidence: 100,
        verified_at: new Date().toISOString(),
        selling_price: verifiedTicketData.selling_price,
      };
      // Debug log before insert
      console.log('ticketData before insert:', ticketData);
      // Insert the full object
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: `${transportMode === 'train' ? 'Train' : transportMode === 'plane' ? 'Plane' : 'Bus'} Ticket Listed Successfully! 🎉`,
        description: 'Your verified ticket is now available for sale.',
      });

      if (onListingComplete) {
        onListingComplete(ticketData); // Use the full object you just inserted
      }
    } catch (error) {
      console.error('Error listing ticket:', error);
      toast({
        title: 'Listing Failed',
        description: error.message || 'Failed to list ticket. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsListing(false);
    }
  };

  // Remove the discountPercentage calculation
  // const discountPercentage = verifiedTicketData.ticket_price 
  //   ? Math.round(((parseFloat(verifiedTicketData.ticket_price) - parseFloat(sellingPrice || 0)) / parseFloat(verifiedTicketData.ticket_price)) * 100)
  //   : 0;

  const renderTransportSpecificDetails = () => {
    // Use transportMode here
    if (transportMode === 'train') {
      return (
        <>
          <div>
            <span className="text-gray-500">Train Number:</span>
            <span className="ml-2 font-medium">{verifiedTicketData.train_number}</span>
          </div>
          <div>
            <span className="text-gray-500">Railway Operator:</span>
            <span className="ml-2 font-medium">{verifiedTicketData.railway_operator}</span>
          </div>
          {verifiedTicketData.platform_number && (
            <div>
              <span className="text-gray-500">Platform:</span>
              <span className="ml-2 font-medium">{verifiedTicketData.platform_number}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Coach & Berth:</span>
            <span className="ml-2 font-medium">
              {verifiedTicketData.coach_class} - {verifiedTicketData.berth_type}
            </span>
          </div>
          {verifiedTicketData.railway_zone && (
            <div>
              <span className="text-gray-500">Railway Zone:</span>
              <span className="ml-2 font-medium">{verifiedTicketData.railway_zone}</span>
            </div>
          )}
          {verifiedTicketData.is_tatkal && (
            <div>
              <span className="text-gray-500">Ticket Type:</span>
              <Badge className="ml-2 bg-orange-100 text-orange-800 border-orange-200">
                Tatkal
              </Badge>
            </div>
          )}
        </>
      );
    } else if (transportMode === 'plane') {
      return (
        <>
          <div>
            <span className="text-gray-500">Flight Number:</span>
            <span className="ml-2 font-medium">{verifiedTicketData.flight_number}</span>
          </div>
          <div>
            <span className="text-gray-500">Airline:</span>
            <span className="ml-2 font-medium">{verifiedTicketData.airline_operator}</span>
          </div>
          {verifiedTicketData.cabin_class && (
            <div>
              <span className="text-gray-500">Cabin Class:</span>
              <span className="ml-2 font-medium">{verifiedTicketData.cabin_class}</span>
            </div>
          )}
          {verifiedTicketData.airport_terminal && (
            <div>
              <span className="text-gray-500">Terminal:</span>
              <span className="ml-2 font-medium">{verifiedTicketData.airport_terminal}</span>
            </div>
          )}
          {verifiedTicketData.baggage_allowance && (
            <div>
              <span className="text-gray-500">Baggage:</span>
              <span className="ml-2 font-medium">{verifiedTicketData.baggage_allowance}</span>
            </div>
          )}
        </>
      );
    }

    // Bus details
    return (
      <>
        <div>
          <span className="text-gray-500">Operator:</span>
          <span className="ml-2 font-medium">{verifiedTicketData.bus_operator}</span>
        </div>
        <div>
          <span className="text-gray-500">Seat:</span>
          <span className="ml-2 font-medium">{verifiedTicketData.seat_number}</span>
        </div>
      </>
    );
  };

  const originalPrice = Number(verifiedTicketData.ticket_price);
  const sellingPrice = Number(verifiedTicketData.selling_price);
  const discountPercentage = originalPrice > 0 ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;

  // Replace the details section with type-aware rendering:
  const renderTicketDetails = () => {
    if (transportMode === 'bus') {
      return (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">PNR:</span><span className="ml-2 font-medium">{verifiedTicketData.pnr_number || verifiedTicketData.pnr || ''}</span></div>
          <div><span className="text-gray-500">Passenger:</span><span className="ml-2 font-medium">{verifiedTicketData.passenger_name || verifiedTicketData.passenger || ''}</span></div>
          <div><span className="text-gray-500">Route:</span><span className="ml-2 font-medium">{(verifiedTicketData.from_location || verifiedTicketData.source_location || verifiedTicketData.from || '') + ' → ' + (verifiedTicketData.to_location || verifiedTicketData.destination_location || verifiedTicketData.to || '')}</span></div>
          <div><span className="text-gray-500">Date & Time:</span><span className="ml-2 font-medium">{(verifiedTicketData.departure_date || '') + (verifiedTicketData.departure_time ? ' at ' + verifiedTicketData.departure_time : '')}</span></div>
          <div><span className="text-gray-500">Operator:</span><span className="ml-2 font-medium">{verifiedTicketData.bus_operator || verifiedTicketData.operator || ''}</span></div>
          <div><span className="text-gray-500">Seat:</span><span className="ml-2 font-medium">{verifiedTicketData.seat_number || verifiedTicketData.seat || ''}</span></div>
          <div className="col-span-2"><span className="text-gray-500">Original Price:</span><span className="ml-2 font-bold text-green-600">₹{verifiedTicketData.ticket_price || verifiedTicketData.price || ''}</span></div>
          <div className="col-span-2"><span className="text-gray-500">Selling Price:</span><span className="ml-2 font-bold text-blue-600">₹{verifiedTicketData.selling_price || ''}</span></div>
        </div>
      );
    } else if (transportMode === 'train') {
      return (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">PNR:</span><span className="ml-2 font-medium">{verifiedTicketData.pnr_number}</span></div>
          <div><span className="text-gray-500">Passenger:</span><span className="ml-2 font-medium">{verifiedTicketData.passenger_name}</span></div>
          <div><span className="text-gray-500">Route:</span><span className="ml-2 font-medium">{(verifiedTicketData.from_location || verifiedTicketData.source_station) + ' → ' + (verifiedTicketData.to_location || verifiedTicketData.destination_station)}</span></div>
          <div><span className="text-gray-500">Date & Time:</span><span className="ml-2 font-medium">{verifiedTicketData.departure_date} at {verifiedTicketData.departure_time}</span></div>
          <div><span className="text-gray-500">Train Name/Number:</span><span className="ml-2 font-medium">{verifiedTicketData.train_name} / {verifiedTicketData.train_number}</span></div>
          <div><span className="text-gray-500">Coach:</span><span className="ml-2 font-medium">{verifiedTicketData.coach_number}</span></div>
          <div><span className="text-gray-500">Seat:</span><span className="ml-2 font-medium">{verifiedTicketData.seat_number}</span></div>
          <div><span className="text-gray-500">Ticket Class:</span><span className="ml-2 font-medium">{verifiedTicketData.ticket_class}</span></div>
          <div className="col-span-2"><span className="text-gray-500">Original Price:</span><span className="ml-2 font-bold text-green-600">₹{verifiedTicketData.ticket_price}</span></div>
          <div className="col-span-2"><span className="text-gray-500">Selling Price:</span><span className="ml-2 font-bold text-blue-600">₹{verifiedTicketData.selling_price}</span></div>
        </div>
      );
    } else if (transportMode === 'plane') {
      return (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">PNR:</span><span className="ml-2 font-medium">{verifiedTicketData.pnr_number}</span></div>
          <div><span className="text-gray-500">Passenger:</span><span className="ml-2 font-medium">{verifiedTicketData.passenger_name}</span></div>
          <div><span className="text-gray-500">Route:</span><span className="ml-2 font-medium">{(verifiedTicketData.from_location || verifiedTicketData.source_airport) + ' → ' + (verifiedTicketData.to_location || verifiedTicketData.destination_airport)}</span></div>
          <div><span className="text-gray-500">Date & Time:</span><span className="ml-2 font-medium">{verifiedTicketData.departure_date} at {verifiedTicketData.departure_time}</span></div>
          <div><span className="text-gray-500">Flight Number:</span><span className="ml-2 font-medium">{verifiedTicketData.flight_number}</span></div>
          <div><span className="text-gray-500">Airline:</span><span className="ml-2 font-medium">{verifiedTicketData.airline_name}</span></div>
          <div><span className="text-gray-500">Seat:</span><span className="ml-2 font-medium">{verifiedTicketData.seat_number}</span></div>
          <div><span className="text-gray-500">Ticket Class:</span><span className="ml-2 font-medium">{verifiedTicketData.ticket_class}</span></div>
          <div><span className="text-gray-500">Baggage:</span><span className="ml-2 font-medium">{verifiedTicketData.baggage_allowance}</span></div>
          <div className="col-span-2"><span className="text-gray-500">Original Price:</span><span className="ml-2 font-bold text-green-600">₹{verifiedTicketData.ticket_price}</span></div>
          <div className="col-span-2"><span className="text-gray-500">Selling Price:</span><span className="ml-2 font-bold text-blue-600">₹{verifiedTicketData.selling_price}</span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>List Verified {transportMode === 'train' ? 'Train' : transportMode === 'plane' ? 'Plane' : 'Bus'} Ticket</span>
        </CardTitle>
        <CardDescription>
          Set your selling price and list your verified {transportMode === 'train' ? 'train' : transportMode === 'plane' ? 'plane' : 'bus'} ticket for sale
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verification Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-4 w-4 text-green-600" />
            <Badge className="bg-green-100 text-green-800 border-green-200">
              API Verified
            </Badge>
          </div>
          <p className="text-sm text-green-700">
            This {transportMode === 'train' ? 'train' : transportMode === 'plane' ? 'plane' : 'bus'} ticket has been verified against the official {transportMode === 'train' ? 'railway' : transportMode === 'plane' ? 'airline' : 'bus operator'} database.
          </p>
        </div>
        {/* Only keep the Price Analysis section and List button */}
        <div className="space-y-4">
          {verifiedTicketData.selling_price && parseFloat(verifiedTicketData.selling_price) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Tag className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Price Analysis</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Your selling price:</span>
                  <span className="font-medium text-blue-900">₹{sellingPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Discount offered:</span>
                  <span className="font-medium text-blue-900">
                    {discountPercentage > 0 ? `${discountPercentage}%` : '0%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Savings for buyer:</span>
                  <span className="font-medium text-green-600">
                    ₹{Math.max(0, originalPrice - sellingPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        <Button 
          onClick={handleListTicket}
          disabled={isListing || !verifiedTicketData.selling_price || parseFloat(verifiedTicketData.selling_price) <= 0}
          className="w-full"
          size="lg"
        >
          {isListing ? 'Listing Ticket...' : `List Verified ${transportMode === 'train' ? 'Train' : transportMode === 'plane' ? 'Plane' : 'Bus'} Ticket for Sale`}
        </Button>
      </CardContent>
    </Card>
  );
};