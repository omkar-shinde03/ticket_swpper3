import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Loader, Shield, DollarSign, AlertCircle } from 'lucide-react';
import { isEmailVerified } from '@/utils/emailVerification';
import { isKYCVerified, getKYCStatusInfo } from '@/utils/kycVerification';

export const RazorpayEscrowPayment = ({ 
  ticket, 
  onSuccess, 
  onClose,
  isOpen 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("User not authenticated");
      }

      // Check email verification
      const emailVerified = await isEmailVerified();
      if (!emailVerified) {
        toast({
          title: "Email Verification Required",
          description: "Please verify your email before purchasing tickets",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Check KYC verification status
      const kycStatus = await getKYCStatusInfo();
      if (!kycStatus.canPurchase) {
        toast({
          title: "KYC Verification Required",
          description: kycStatus.message,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Debug: Log the ticket object
      console.log('Ticket object received:', ticket);
      console.log('Ticket selling_price:', ticket.selling_price, 'Type:', typeof ticket.selling_price);

      // Calculate commission (5% of selling price)
      const commissionRate = 0.05;
      const sellingPrice = parseFloat(ticket.selling_price) || 0;
      const platformCommission = Math.round(sellingPrice * commissionRate);
      const sellerAmount = sellingPrice - platformCommission;

      // Validate that we have valid numbers
      if (sellingPrice <= 0) {
        throw new Error('Invalid ticket price. Please contact support.');
      }

      console.log('Payment data being sent:', {
        ticketId: ticket.id,
        amount: sellingPrice,
        sellerAmount: sellerAmount,
        platformCommission: platformCommission,
        types: {
          amount: typeof sellingPrice,
          sellerAmount: typeof sellerAmount,
          platformCommission: typeof platformCommission
        }
      });

      // Create Razorpay order via edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: {
            ticketId: ticket.id,
            amount: sellingPrice,
            sellerAmount: sellerAmount,
            platformCommission: platformCommission
          }
        }
      );

      if (orderError || !orderData) {
        throw new Error('Failed to create payment order. Please try again.');
      }

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: orderData.razorpayKeyId,
          amount: orderData.amount,
          currency: 'INR',
          name: 'Bus Ticket Exchange',
          description: `Bus ticket from ${ticket.from_location} to ${ticket.to_location}`,
          order_id: orderData.orderId,
          handler: async (response) => {
            try {
              // Verify payment and trigger split payment
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
                'verify-razorpay-payment',
                {
                  body: {
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    ticketId: ticket.id,
                    buyer_id: user.id,
                    buyer_name: user.user_metadata?.full_name || user.email
                  }
                }
              );

              if (verifyError) {
                throw new Error('Payment verification failed. Please contact support.');
              }

              // Show success message
              toast({
                title: "🎉 Payment Successful!",
                description: `You have successfully purchased the ticket from ${ticket.from_location} to ${ticket.to_location}. The ticket is now yours!`,
                duration: 5000,
              });

              // Close the payment modal
              onClose();
              
              // Call success callback
              onSuccess && onSuccess(verifyData);
              setIsProcessing(false);
            } catch (error) {
              console.error('Payment verification error:', error);
              toast({
                title: "Payment Verification Failed",
                description: "Please contact support if amount was deducted.",
                variant: "destructive"
              });
              setIsProcessing(false);
            }
          },
          prefill: {
            email: user.email,
          },
          theme: {
            color: '#3b82f6'
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };

    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Unable to initiate payment. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Secure Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Route:</span>
              <span className="font-medium">{ticket.from_location} → {ticket.to_location}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span className="font-medium">{new Date(ticket.departure_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>PNR:</span>
              <span className="font-medium">{ticket.pnr_number}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  ₹{ticket.selling_price}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Includes 5% platform fee. Seller receives ₹{ticket.selling_price - Math.round(ticket.selling_price * 0.05)} via UPI.
              </p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Account Verified</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Your KYC verification is complete. Secure escrow payment enabled.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium">Instant UPI Payments</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Payment received instantly. Seller gets paid to their UPI within 1-2 hours automatically.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing} className="flex-1">Cancel</Button>
            <Button onClick={handlePayment} disabled={isProcessing} className="flex-1">
              {isProcessing ? (<><Loader className="h-4 w-4 animate-spin mr-2" />Processing...</>) : (<><CreditCard className="h-4 w-4 mr-2" />Pay ₹{ticket.selling_price}</>)}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};