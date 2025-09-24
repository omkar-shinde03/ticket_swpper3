import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  isEmailVerified, 
  sendVerificationEmail, 
  verifyEmailToken,
  getVerificationStatus 
} from "@/utils/emailVerification";

const EmailVerificationGuard = ({ children, requiredFor = "this action" }) => {
  const [isVerified, setIsVerified] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [verificationLogs, setVerificationLogs] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    checkEmailVerification();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const checkEmailVerification = async () => {
    try {
      const status = await getVerificationStatus();
      setIsVerified(status.verified);
      setUserEmail(status.email || "");
      setVerificationLogs(status.logs || []);
    } catch (error) {
      console.error("Error checking email verification:", error);
      setIsVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = async () => {
    setIsResending(true);
    try {
      const result = await sendVerificationEmail(false);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: "Verification email sent",
        description: result.message,
      });
      setShowVerification(true);
      setCountdown(60);
    } catch (error) {
      console.error("Error sending verification:", error);
      toast({
        title: "Failed to send verification email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await verifyEmailToken(userEmail, verificationCode);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Email verified successfully!",
        description: "You can now proceed with your transaction.",
      });

      setIsVerified(true);
      setShowVerification(false);
      // Notify other components in the app that email verification has completed
      try {
        window.dispatchEvent(new CustomEvent('email-verified'));
      } catch (_) {
        // no-op if window is unavailable
      }
      
      // Reload verification status
      await checkEmailVerification();
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isVerified) {
    return children;
  }

  if (showVerification) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to {userEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Rate limiting warning */}
            {verificationLogs.length >= 2 && (
              <Alert className="mb-4 border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  You have {3 - verificationLogs.length} verification attempts remaining this hour.
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  className="text-center text-lg tracking-widest"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 6) {
                      setVerificationCode(value);
                    }
                  }}
                  maxLength="6"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || verificationCode.length !== 6}
              >
                {isSubmitting ? "Verifying..." : "Verify Email"}
              </Button>
            </form>

            <div className="text-center mt-4">
              {countdown > 0 ? (
                <p className="text-sm text-gray-600">Resend code in {countdown}s</p>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleSendVerification}
                  disabled={isResending || verificationLogs.length >= 3}
                  className="text-sm"
                >
                  {isResending ? "Sending..." : "Resend verification code"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle>Email Verification Required</CardTitle>
          <CardDescription>
            You need to verify your email address to {requiredFor}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              For security purposes, email verification is required before you can buy or sell tickets.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleSendVerification}
            disabled={isResending}
            className="w-full"
          >
            {isResending ? "Sending..." : "Send Verification Email"}
          </Button>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setShowVerification(true)}
              className="text-sm"
            >
              Already have a code? Enter it here
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationGuard;