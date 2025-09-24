import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, CreditCard, Check } from 'lucide-react';

export const PaymentSettings = () => {
  const [upiId, setUpiId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPaymentDetails();
  }, []);

  const loadPaymentDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('upi_id, phone')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUpiId(profile.upi_id || '');
        setPhoneNumber(profile.phone || '');
        setIsSaved(!!(profile.upi_id || profile.phone));
      }
    } catch (error) {
      console.error('Error loading payment details:', error);
    }
  };

  const handleSave = async () => {
    if (!upiId && !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please provide either UPI ID or phone number for payments.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('profiles')
        .update({
          upi_id: upiId || null,
          phone: phoneNumber || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsSaved(true);
      toast({
        title: "Payment Details Saved",
        description: "Your payment information has been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving payment details:', error);
      toast({
        title: "Error",
        description: "Failed to save payment details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Add your UPI ID or phone number to receive payments instantly when your tickets are sold.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="upi-id">UPI ID (Recommended)</Label>
          <Input
            id="upi-id"
            placeholder="yourname@paytm or yourname@phonepe"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Your UPI ID for instant payments (e.g., 9876543210@paytm)
          </p>
        </div>

        <div className="text-center text-sm text-muted-foreground">OR</div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex">
            <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
              <Smartphone className="h-4 w-4 mr-1" />
              +91
            </div>
            <Input
              id="phone"
              placeholder="9876543210"
              value={phoneNumber}
              onChange={(e) => setUpiId(e.target.value)}
              className="rounded-l-none"
              maxLength={10}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            We'll use this with @paytm for UPI payments
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <div className="flex items-start gap-2 text-blue-800">
            <Check className="h-4 w-4 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Instant Payments</p>
              <p className="text-blue-700">
                When someone buys your ticket, you'll receive payment directly to your UPI within 1-2 hours automatically.
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isLoading || (!upiId && !phoneNumber)}
          className="w-full"
        >
          {isLoading ? "Saving..." : isSaved ? "Update Payment Details" : "Save Payment Details"}
        </Button>
      </CardContent>
    </Card>
  );
};