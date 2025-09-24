import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, AlertCircle, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  isEmailVerified, 
  sendVerificationEmail, 
  getVerificationStatus 
} from "@/utils/emailVerification";

export const EmailVerificationBanner = ({ onDismiss }) => {
  const [isVerified, setIsVerified] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [verificationLogs, setVerificationLogs] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    checkVerificationStatus();
    
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('email-verification-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
    const onVerified = async () => {
      await checkVerificationStatus();
      setIsDismissed(false);
    };
    window.addEventListener('email-verified', onVerified);
    return () => window.removeEventListener('email-verified', onVerified);
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const status = await getVerificationStatus();
      setIsVerified(status.verified);
      setVerificationLogs(status.logs || []);
    } catch (error) {
      console.error("Error checking verification status:", error);
      setIsVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = async () => {
    setIsSending(true);
    
    try {
      const result = await sendVerificationEmail(false);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Verification email sent",
        description: result.message,
      });
      
      // Refresh status
      await checkVerificationStatus();
    } catch (error) {
      console.error("Error sending verification:", error);
      toast({
        title: "Failed to send verification email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('email-verification-banner-dismissed', 'true');
    if (onDismiss) {
      onDismiss();
    }
  };

  // Don't show if loading, verified, or dismissed
  if (isLoading || isVerified || isDismissed) {
    return null;
  }

  // Don't show if user has hit rate limit
  if (verificationLogs.length >= 3) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 mb-6">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1">
          <div className="text-orange-800">
            <strong>Email verification required</strong>
            <p className="text-sm mt-1">
              Please verify your email address to buy and sell tickets securely.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <Button
            size="sm"
            onClick={handleSendVerification}
            disabled={isSending}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Mail className="h-4 w-4 mr-1" />
            {isSending ? "Sending..." : "Send Code"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-orange-600 hover:text-orange-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};