import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle, Clock, AlertCircle, Phone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getVerificationStatus } from "@/utils/emailVerification";

const EmailVerification = ({ email, onVerified, onBack }) => {
  const [verificationCodes, setVerificationCodes] = useState({
    emailCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isExpired, setIsExpired] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [currentStep, setCurrentStep] = useState('email'); // 'email' or 'phone'
  const { toast } = useToast();

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setIsExpired(true);
    }
  }, [countdown]);

  const loadVerificationStatus = async () => {
    try {
      const status = await getVerificationStatus();
      setVerificationStatus({ emailVerified: status.verified });
      // If email is verified, complete the process
      if (status.verified) {
        onVerified();
      }
    } catch (error) {
      console.error("Error loading verification status:", error);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (isExpired) {
      toast({
        title: "Code expired",
        description: "The verification code has expired. Please request a new one.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (currentStep === 'email') {
        // Verify email first
        const result = await verifyEmailToken(email, verificationCodes.emailCode);
        
        if (!result.success) {
          throw new Error(result.error);
        }

        toast({
          title: "Email verified successfully!",
          description: "Now please verify your phone number.",
        });

        // Move to phone verification step
        setCurrentStep('phone');
        setVerificationCodes(prev => ({ ...prev, emailCode: "" }));
        
      } else if (currentStep === 'phone') {
        // Verify phone number
        const result = await verifyPhoneOtp(verificationStatus.phone, email, verificationCodes.phoneOtp);
        
        if (!result.success) {
          throw new Error(result.error);
        }

        toast({
          title: "Phone verified successfully!",
          description: "Your account has been fully activated. Redirecting to dashboard...",
        });

        // Complete the verification process
        setTimeout(() => {
          onVerified();
        }, 1000);
      }
    } catch (error) {
      console.error("Verification error:", error);
      
      let errorMessage = "Invalid verification code. Please try again.";
      
      if (error.message) {
        if (error.message.includes("expired") || error.message.includes("Invalid or expired token")) {
          errorMessage = "Verification code has expired. Please request a new one.";
          setIsExpired(true);
        } else if (error.message.includes("invalid") || error.message.includes("Invalid")) {
          errorMessage = "Invalid verification code. Please check and try again.";
        } else if (error.message.includes("already been verified")) {
          errorMessage = "This email has already been verified. Please try logging in.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Verification failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    
    try {
      const result = await sendCombinedVerification(verificationStatus?.phone, true);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Verification codes sent",
        description: result.message,
      });

      setCountdown(60);
      setIsExpired(false);
      setVerificationCodes({ emailCode: "" });
      
      // Reload verification status
      loadVerificationStatus();
    } catch (error) {
      console.error("Resend error:", error);
      toast({
        title: "Failed to resend codes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          {currentStep === 'email' ? (
            <Mail className="h-6 w-6 text-blue-600" />
          ) : (
            <Phone className="h-6 w-6 text-green-600" />
          )}
        </div>
        <h2 className="text-2xl font-bold">
          {currentStep === 'email' ? 'Verify your email' : 'Verify your phone'}
        </h2>
        <p className="text-gray-600">
          {currentStep === 'email' ? (
            <>
              We've sent a verification code to <br />
              <span className="font-medium">{email}</span>
            </>
          ) : (
            <>
              We've sent a verification code to <br />
              <span className="font-medium">{verificationStatus?.phone || 'your phone'}</span>
            </>
          )}
        </p>
      </div>

      {/* Verification Status Alert */}
      {verificationStatus?.emailVerified && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Email is verified! You can proceed to the dashboard.
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center space-x-2 ${currentStep === 'email' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'email' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {verificationStatus?.emailVerified ? '✓' : '1'}
          </div>
          <span>Email</span>
        </div>
      </div>


      <form onSubmit={handleVerifyCode} className="space-y-4">
        {currentStep === 'email' ? (
          <div className="space-y-2 text-center text-gray-600">
            <p>
              Please check your email for a verification link.<br />
              <span className="font-medium">{email}</span>
            </p>
            <p className="text-sm mt-2">Click the link in your email to verify your account.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="phone-otp">Phone Verification Code</Label>
            <Input
              id="phone-otp"
              type="text"
              placeholder="Enter 6-digit code"
              className="text-center text-lg tracking-widest"
              value={verificationCodes.phoneOtp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                if (value.length <= 6) {
                  setVerificationCodes(prev => ({ ...prev, phoneOtp: value }));
                }
              }}
              maxLength="6"
              required
              disabled={verificationStatus?.phoneVerified}
            />
          </div>
        )}
        {currentStep === 'phone' && (
          <Button 
            type="submit" 
            className="w-full" 
            disabled={
              isLoading || 
              verificationCodes.phoneOtp.length !== 6 || 
              isExpired || 
              verificationStatus?.phoneVerified
            }
            size="lg"
          >
            {isLoading ? "Verifying..." : 
             verificationStatus?.phoneVerified ? "Already Verified" :
             isExpired ? "Code Expired" : "Verify Phone"}
          </Button>
        )}
      </form>

      <div className="text-center space-y-4">
        <div className="text-sm text-gray-600">
          {isExpired ? (
            <span className="text-red-600 font-medium">Code expired! Please resend.</span>
          ) : (
            <>Didn't receive the {currentStep === 'email' ? 'email' : 'phone'} code?{" "}</>
          )}
          {countdown > 0 ? (
            <span>Resend in {countdown}s</span>
          ) : (
            <button
              onClick={handleResendCode}
              disabled={isResending || (currentStep === 'email' ? verificationStatus?.emailVerified : verificationStatus?.phoneVerified)}
              className="text-blue-600 hover:underline font-medium"
            >
              {isResending ? "Sending..." : "Resend codes"}
            </button>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (currentStep === 'phone' && !verificationStatus?.emailVerified) {
              setCurrentStep('email');
            } else {
              onBack();
            }
          }}
          className="w-full"
          disabled={verificationStatus?.emailVerified && verificationStatus?.phoneVerified}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 'phone' && !verificationStatus?.emailVerified ? 'Back to Email' : 'Back to signup'}
        </Button>
      </div>


    </div>
  );
};

export default EmailVerification;