import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Database, CreditCard, CheckCircle } from 'lucide-react';

export const RazorpaySetup = () => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const { toast } = useToast();

  const initializeDatabase = async () => {
    setIsSettingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('init-database-schema');
      
      if (error) throw error;
      
      toast({
        title: "Database Schema Initialized",
        description: "All required tables and functions have been created successfully.",
      });
      
      return true;
    } catch (error) {
      console.error('Database initialization error:', error);
      toast({
        title: "Database Setup Failed", 
        description: error.message || "Failed to initialize database schema.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSettingUp(false);
    }
  };

  const testRazorpayCredentials = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          ticketId: 'test',
          amount: 100, // ₹1 test amount
          sellerAmount: 95,
          platformCommission: 5
        }
      });

      if (error && error.message.includes("Razorpay credentials not configured")) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const runCompleteSetup = async () => {
    setIsSettingUp(true);
    try {
      // Initialize database first
      const dbSuccess = await initializeDatabase();
      if (!dbSuccess) return;

      // Test credentials
      const credentialsWork = await testRazorpayCredentials();
      
      if (credentialsWork) {
        setSetupComplete(true);
        toast({
          title: "Setup Complete!",
          description: "Razorpay integration is ready for testing.",
        });
      } else {
        toast({
          title: "Setup Incomplete",
          description: "Database ready, but Razorpay credentials need to be configured in Supabase secrets.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Setup error:', error);
    } finally {
      setIsSettingUp(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Razorpay Payment Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Credentials */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Step 1: Configure API Credentials</h3>
          </div>
          <div className="bg-muted p-3 rounded text-sm font-mono space-y-1">
            <div>RAZORPAY_KEY_ID: rzp_test_lIXktAHoDQMAqT</div>
            <div>RAZORPAY_KEY_SECRET: l4sa7fNdp4ONEdrKOnuRkVhq</div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Add these credentials to your Supabase Edge Function secrets.
          </p>
        </div>

        {/* Step 2: Database */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Step 2: Initialize Database Schema</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Create required tables: enhanced_transactions, seller_payouts, and database functions.
          </p>
          <Button 
            onClick={initializeDatabase} 
            disabled={isSettingUp}
            variant="outline"
          >
            {isSettingUp ? "Initializing..." : "Initialize Database"}
          </Button>
        </div>

        {/* Complete Setup */}
        <div className="pt-4 border-t">
          <Button 
            onClick={runCompleteSetup} 
            disabled={isSettingUp}
            className="w-full"
            size="lg"
          >
            {isSettingUp ? "Setting up..." : "Complete Razorpay Setup"}
          </Button>
          
          {setupComplete && (
            <div className="flex items-center gap-2 mt-3 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Razorpay integration is ready!</span>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> These are test credentials. For production, replace with live Razorpay keys and enable live mode.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};