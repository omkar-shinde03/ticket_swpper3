import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [email, setEmail] = useState("");

  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  useEffect(() => {
    if (token) {
      verifyEmailToken(token);
    }
  }, [token]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const verifyEmailToken = async (token) => {
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.functions.invoke("verify-email-token", {
        body: { token }
      });

      if (error) throw error;

      if (data.success) {
        setVerificationStatus("success");
      } else {
        setVerificationStatus("error");
        setError(data.message || "Verification failed");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setVerificationStatus("error");
      setError(err.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!email || resendCountdown > 0) return;

    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.functions.invoke("send-verification-email", {
        body: { email }
      });

      if (error) throw error;

      if (data.success) {
        setResendCountdown(60);
        setError("");
      } else {
        setError(data.message || "Failed to resend verification email");
      }
    } catch (err) {
      console.error("Resend error:", err);
      setError(err.message || "Failed to resend verification email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleResend = () => {
    resendVerificationEmail();
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoToLogin = () => {
    navigate("/auth");
  };

  if (verificationStatus === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified. You can now access all features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGoToLogin} className="w-full">
              Continue to Login
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Verification Failed</CardTitle>
            <CardDescription>
              {error || "There was an error verifying your email. Please try again."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGoHome} className="w-full">
              Go to Home
            </Button>
            <Button onClick={handleGoToLogin} variant="outline" className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            Please check your email for a verification link, or enter your email below to resend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleResend} 
            className="w-full" 
            disabled={isLoading || resendCountdown > 0 || !email}
          >
            {resendCountdown > 0 
              ? `Resend in ${resendCountdown}s` 
              : "Resend Verification Email"
            }
          </Button>

          <div className="flex space-x-2">
            <Button onClick={handleGoHome} variant="outline" className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button onClick={handleGoToLogin} variant="outline" className="flex-1">
              Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;