import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  ExternalLink 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  getVerificationStatus, 
  sendVerificationEmail 
} from "@/utils/emailVerification";

export const EmailVerificationStatus = () => {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const status = await getVerificationStatus();
      setVerificationStatus(status);
    } catch (error) {
      console.error("Error loading verification status:", error);
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
      await loadVerificationStatus();
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

  const getStatusBadge = () => {
    if (verificationStatus?.verified) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-orange-700 bg-orange-100 border-orange-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  const canSendEmail = () => {
    return !verificationStatus?.verified && 
           (verificationStatus?.logs?.length || 0) < 3;
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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Email Verification</span>
          </div>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          {verificationStatus?.verified 
            ? "Your email address has been verified successfully."
            : "Verify your email address to access all platform features."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {verificationStatus?.verified ? (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Email Verified</p>
              {verificationStatus?.emailConfirmedAt ? (
                <p className="text-sm text-gray-600">
                  Verified on {new Date(verificationStatus.emailConfirmedAt).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Action Required:</strong> Please verify your email address to:
                <ul className="mt-2 ml-4 list-disc text-sm">
                  <li>Buy and sell tickets securely</li>
                  <li>Receive important notifications</li>
                  <li>Access premium features</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex space-x-2">
              <Button
                onClick={handleSendVerification}
                disabled={isSending || !canSendEmail()}
                className="flex-1"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Verification Email
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/verify-email')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Verify Now
              </Button>
            </div>

            {!canSendEmail() && (
              <Alert className="border-red-200 bg-red-50">
                <Clock className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  You've reached the maximum number of verification emails for this hour. 
                  Please wait before requesting another.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Verification Logs for Development */}
        {import.meta.env.DEV && verificationStatus?.logs?.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Recent Verification Activity</h4>
            <div className="space-y-1">
              {verificationStatus.logs.slice(0, 5).map((log, index) => (
                <div key={index} className="text-xs text-gray-600 flex justify-between">
                  <span className="capitalize">{log.action.replace('_', ' ')}</span>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};