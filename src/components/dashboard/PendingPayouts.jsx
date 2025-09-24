import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const PendingPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Since seller_payouts table doesn't exist, get completed transactions instead
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          tickets (
            from_location,
            to_location,
            pnr_number,
            bus_operator
          )
        `)
        .eq('seller_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform transactions to payout format
      const transformedPayouts = (data || []).map(transaction => ({
        id: transaction.id,
        amount: transaction.amount - (transaction.platform_fee || 0),
        status: transaction.payout_status || 'pending',
        created_at: transaction.created_at,
        processed_at: transaction.updated_at,
        transaction,
        tickets: transaction.tickets
      }));
      
      setPayouts(transformedPayouts);
    } catch (error) {
      console.error('Error loading payouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPayout = async (payoutId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user's payment details
      const { data: profile } = await supabase
        .from('profiles')
        .select('upi_id, phone_number')
        .eq('id', user.id)
        .single();

      if (!profile?.upi_id && !profile?.phone_number) {
        toast({
          title: "Payment Details Required",
          description: "Please add your UPI ID or phone number in Payment Settings first.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-seller-payout', {
        body: {
          payoutId: payoutId,
          upiId: profile.upi_id,
          phoneNumber: profile.phone_number
        }
      });

      if (error) throw error;

      toast({
        title: "Payout Initiated",
        description: "Your payment has been sent to your UPI. It may take 1-2 hours to reflect.",
      });

      loadPayouts(); // Refresh the list
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast({
        title: "Payout Failed",
        description: error.message || "Unable to process payout. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'processed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pending Payments
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your earned money from sold tickets
        </p>
      </CardHeader>
      <CardContent>
        {payouts.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pending payments</p>
            <p className="text-sm text-muted-foreground">
              Payments will appear here when your tickets are sold
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payouts.map((payout) => (
              <div key={payout.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(payout.status)} className="flex items-center gap-1">
                      {getStatusIcon(payout.status)}
                      {payout.status}
                    </Badge>
                    <span className="font-semibold">₹{payout.amount}</span>
                  </div>
                  {payout.status === 'pending' && (
                    <Button 
                      size="sm" 
                      onClick={() => requestPayout(payout.id)}
                    >
                      Request Payment
                    </Button>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>
                    Ticket: {payout.tickets?.from_location} → {payout.tickets?.to_location}
                  </p>
                  <p>PNR: {payout.tickets?.pnr_number}</p>
                  <p>Bus: {payout.tickets?.bus_operator}</p>
                  <p>Created: {new Date(payout.created_at).toLocaleDateString()}</p>
                  {payout.processed_at && (
                    <p>Processed: {new Date(payout.processed_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};