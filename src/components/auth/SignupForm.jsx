
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, User, Shield } from "lucide-react";
import { handleUserSignup, ADMIN_EMAIL } from "@/utils/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import EmailVerification from "./EmailVerification";

const SignupForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    isAdmin: false
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  const simplePatterns = [
    /^(.)\1+$/, // repeated single char
    /^12345678$/, /^password$/, /^qwerty$/, /^11111111$/, /^00000000$/
  ];

  const getPasswordStrength = (password) => {
    if (!password) return '';
    if (simplePatterns.some((pat) => pat.test(password))) return 'Very Weak';
    if (password.length < 8) return 'Too Short';
    if (!/[A-Z]/.test(password)) return 'Needs uppercase';
    if (!/[a-z]/.test(password)) return 'Needs lowercase';
    if (!/\d/.test(password)) return 'Needs digit';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return 'Needs special char';
    if (strongPasswordRegex.test(password)) return 'Strong';
    return 'Weak';
  };

  // Auto-check admin checkbox when admin email is entered
  useEffect(() => {
    if (signupData.email === ADMIN_EMAIL) {
      setSignupData(prev => ({ ...prev, isAdmin: true }));
    } else {
      setSignupData(prev => ({ ...prev, isAdmin: false }));
    }
  }, [signupData.email]);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    // Email validation
    if (!emailRegex.test(signupData.email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    // Password validation (skip for admin)
    if (!signupData.isAdmin) {
      if (!strongPasswordRegex.test(signupData.password) || simplePatterns.some((pat) => pat.test(signupData.password))) {
        setPasswordError("Password must be at least 8 characters, include upper/lowercase, a digit, a special character, and not be a simple pattern.");
        return;
      }
    }
    setIsLoading(true);

    try {
      const isAdmin = await handleUserSignup(signupData);

      if (isAdmin) {
        toast({
          title: "Admin account created successfully!",
          description: "You can now log in with your admin credentials.",
        });
        
        // Reset form
        setSignupData({
          email: "",
          password: "",
          fullName: "",
          phone: "",
          isAdmin: false
        });
      } else {
        // For regular users, show email verification UI if needed
        setSignupEmail(signupData.email);
        setShowEmailVerification(true);
        toast({
          title: "Account created!",
          description: "Please check your email to complete verification.",
        });
      }

    } catch (error) {
      console.error("Signup error:", error);
      // Provide more specific error messages
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.status === 409 || (error.message && (error.message.includes("already exists") || error.message.includes("already registered")))) {
        errorMessage = "An account with this email or phone number already exists. Please log in instead.";
      } else if (error.status === 429 || (error.message && error.message.includes("rate limit"))) {
        errorMessage = "Too many attempts. Please wait a moment before trying again.";
      } else if (error.message && error.message.includes("Password should be at least")) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (error.message && error.message.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerificationComplete = () => {
    setShowEmailVerification(false);
    setSignupEmail("");
    // Reset form
    setSignupData({
      email: "",
      password: "",
      fullName: "",
      phone: "",
      isAdmin: false
    });
    
    toast({
      title: "Account setup complete!",
      description: "You can now log in to your account.",
    });
    navigate("/login"); // Redirect to login page after successful verification
  };

  const handleBackToSignup = () => {
    setShowEmailVerification(false);
  };

  // Phone verification is now handled in the combined email
  // We only show email verification UI

  if (showEmailVerification) {
    return (
      <EmailVerification
        email={signupEmail}
        onVerified={handleEmailVerificationComplete}
        onBack={handleBackToSignup}
      />
    );
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="signup-name"
            type="text"
            placeholder="Enter your full name"
            className="pl-10"
            value={signupData.fullName}
            onChange={(e) => setSignupData({...signupData, fullName: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="signup-email"
            type="email"
            placeholder="Enter your email"
            className="pl-10"
            value={signupData.email}
            onChange={(e) => {
              setSignupData({...signupData, email: e.target.value});
              setEmailError("");
            }}
            required
            pattern={"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\\.[a-zA-Z]{2,}$"}
          />
        </div>
        {emailError && <p className="text-red-600 text-xs mt-1">{emailError}</p>}
      </div>
      
      {!signupData.isAdmin && (
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="signup-password"
              type="password"
              placeholder="Create a password"
              className="pl-10"
              value={signupData.password}
              onChange={(e) => {
                setSignupData({...signupData, password: e.target.value});
                const strength = getPasswordStrength(e.target.value);
                setPasswordStrength(strength);
                setPasswordError("");
              }}
              required={!signupData.isAdmin}
            />
          </div>
          {passwordError && <p className="text-xs text-red-600 mt-1">{passwordError}</p>}
          {!signupData.isAdmin && signupData.password && (
            <div className="w-full mt-1">
              <div className={`h-2 rounded ${passwordStrength === 'Strong' ? 'bg-green-500' : passwordStrength === 'Weak' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: passwordStrength === 'Strong' ? '100%' : passwordStrength === 'Weak' ? '60%' : '30%' }} />
              <p className={`text-xs mt-1 ${passwordStrength === 'Strong' ? 'text-green-600' : passwordStrength === 'Weak' ? 'text-yellow-600' : 'text-red-600'}`}>{passwordStrength}</p>
            </div>
          )}
        </div>
      )}

      {signupData.email === ADMIN_EMAIL && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="admin-signup"
            checked={signupData.isAdmin}
            onCheckedChange={(checked) => setSignupData({...signupData, isAdmin: !!checked})}
          />
          <label
            htmlFor="admin-signup"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
          >
            <Shield className="h-4 w-4 mr-2 text-red-600" />
            Create Admin Account
          </label>
        </div>
      )}

      {signupData.isAdmin && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">
            <strong>Note:</strong> Admin accounts have elevated privileges and use a fixed secure password.
          </p>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
        size="lg"
      >
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
};

export default SignupForm;
