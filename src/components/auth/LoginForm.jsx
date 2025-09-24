
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { handleUserLogin } from "@/utils/authUtils";
import { isEmailVerified } from "@/utils/emailVerification";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    emailOrPhone: "",
    password: ""
  });
  const [showEmailVerificationWarning, setShowEmailVerificationWarning] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowEmailVerificationWarning(false);

    try {
      const result = await handleUserLogin(loginData.emailOrPhone, loginData.password);

      if (result.isAdmin) {
        navigate("/admin");
        toast({
          title: "Admin login successful!",
          description: "Welcome to the admin dashboard.",
        });
      } else {
        // Check user type for regular users
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', user.id)
            .single();

          if (profileData?.user_type === 'admin') {
            navigate("/admin");
          } else {
            // Check email verification status
            const emailVerified = await isEmailVerified();
            
            if (!emailVerified) {
              setShowEmailVerificationWarning(true);
              toast({
                title: "Email verification required",
                description: "Please verify your email to access all features.",
                variant: "destructive",
              });
            }
            
            navigate("/dashboard");
          }
        }

        toast({
          title: "Login successful!",
          description: "Welcome to TicketSwapper.",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = error.message || "An unexpected error occurred. Please try again.";
      if (error.status === 429 || (errorMessage && errorMessage.includes("rate limit"))) {
        errorMessage = "Too many login attempts. Please wait a moment before trying again.";
      } else if (error.status === 403 || (errorMessage && errorMessage.toLowerCase().includes("forbidden"))) {
        errorMessage = "You are not authorized to access this resource. Please check your credentials or contact support.";
      }
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Email Verification Warning */}
      {showEmailVerificationWarning && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span>Email verification required for full access.</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/verify-email')}
                className="ml-2"
              >
                Verify Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email-phone">Email or Phone Number</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="login-email-phone"
            type="text"
            placeholder="Enter your email or phone number"
            className="pl-10"
            value={loginData.emailOrPhone}
            onChange={(e) => setLoginData({...loginData, emailOrPhone: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            className="pl-10"
            value={loginData.password}
            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
            required
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
        size="lg"
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
      </form>
    </div>
  );
};

export default LoginForm;
