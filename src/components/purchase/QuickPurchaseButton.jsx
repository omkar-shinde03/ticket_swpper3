import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CompletePurchaseFlow } from './CompletePurchaseFlow';
import { CreditCard, Loader, ShieldCheck, AlertCircle } from 'lucide-react';
import { isEmailVerified } from '@/utils/emailVerification';
import { isKYCVerified, getKYCStatusInfo } from '@/utils/kycVerification';

export const QuickPurchaseButton = ({ 
  ticket, 
  onPurchaseSuccess, 
  disabled = false,
  variant = "default",
  size = "default",
  className = ""
}) => {
  const [isPurchaseFlowOpen, setIsPurchaseFlowOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const { toast } = useToast();

  const handlePurchaseClick = async () => {
    setIsCheckingAuth(true);

    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to purchase tickets",
          variant: "destructive"
        });
        return;
      }

      // Check if user owns this ticket
      if ((ticket.user_id && ticket.user_id === user.id) || (ticket.seller_id && ticket.seller_id === user.id)) {
        toast({
          title: "Cannot Purchase",
          description: "You cannot purchase your own ticket",
          variant: "destructive"
        });
        return;
      }

      // Check if ticket is still available
      const { data: currentTicket, error: ticketError } = await supabase
        .from('tickets')
        .select('status')
        .eq('id', ticket.id)
        .single();

      if (ticketError) {
        throw ticketError;
      }

      if (currentTicket.status !== 'available') {
        toast({
          title: "Ticket Unavailable",
          description: "This ticket is no longer available for purchase",
          variant: "destructive"
        });
        return;
      }

      // Check email verification using centralized helper (auth.users OR profiles)
      const emailVerified = await isEmailVerified();

      if (!emailVerified) {
        toast({
          title: "Email Verification Required",
          description: "Please verify your email before purchasing tickets",
          variant: "destructive"
        });
        return;
      }

      // Check KYC verification status
      const kycStatusInfo = await getKYCStatusInfo();
      setKycStatus(kycStatusInfo);
      
      if (!kycStatusInfo.canPurchase) {
        toast({
          title: "KYC Verification Required",
          description: kycStatusInfo.message,
          variant: "destructive"
        });
        return;
      }

      // All checks passed, open purchase flow
      setIsPurchaseFlowOpen(true);

    } catch (error) {
      console.error('Purchase check error:', error);
      toast({
        title: "Error",
        description: "Unable to initiate purchase. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handlePurchaseSuccess = (transactionData) => {
    setIsPurchaseFlowOpen(false);
    onPurchaseSuccess && onPurchaseSuccess(transactionData);
  };

  // Determine button state based on KYC status
  const getButtonState = () => {
    if (isCheckingAuth) {
      return {
        disabled: true,
        icon: <Loader className="h-4 w-4 animate-spin" />,
        text: "Checking...",
        variant: variant
      };
    }

    if (kycStatus && !kycStatus.canPurchase) {
      return {
        disabled: true,
        icon: <AlertCircle className="h-4 w-4" />,
        text: "KYC Required",
        variant: "destructive"
      };
    }

    return {
      disabled: disabled || ticket.status !== 'available',
      icon: <CreditCard className="h-4 w-4" />,
      text: "Buy Now",
      variant: variant
    };
  };

  const buttonState = getButtonState();

  return (
    <>
      <Button
        onClick={handlePurchaseClick}
        disabled={buttonState.disabled}
        variant={buttonState.variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
        title={kycStatus && !kycStatus.canPurchase ? kycStatus.message : undefined}
      >
        {buttonState.icon}
        {buttonState.text}
        {kycStatus && kycStatus.canPurchase && <ShieldCheck className="h-3 w-3 opacity-70" />}
      </Button>

      <CompletePurchaseFlow
        ticket={ticket}
        isOpen={isPurchaseFlowOpen}
        onClose={() => setIsPurchaseFlowOpen(false)}
        onSuccess={handlePurchaseSuccess}
      />
    </>
  );
};