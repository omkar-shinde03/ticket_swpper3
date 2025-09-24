import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, User, CreditCard, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getVerificationStatus } from '@/utils/emailVerification';
import { useToast } from '@/hooks/use-toast';

export const OnboardingChecklist = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checklist, setChecklist] = useState({
    emailVerified: false,
    profileComplete: false,
    kycCompleted: false,
    paymentSetup: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
    const onVerified = async () => {
      await loadUserData(true);
    };
    window.addEventListener('email-verified', onVerified);
    return () => window.removeEventListener('email-verified', onVerified);
  }, []);

  const loadUserData = async (skipSessionRefresh = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      const status = await getVerificationStatus();

      setChecklist({
        emailVerified: !!status.verified,
        profileComplete: !!(profileData?.full_name),
        kycCompleted: profileData?.kyc_status === 'verified',
        paymentSetup: !!(profileData?.upi_id)
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const getCompletionPercentage = () => {
    const completed = Object.values(checklist).filter(Boolean).length;
    return Math.round((completed / 4) * 100);
  };

  const ChecklistItem = ({ completed, title, description, icon: Icon, action }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${completed ? 'bg-green-100' : 'bg-gray-100'}`}>
          {completed ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Icon className="h-5 w-5 text-gray-600" />
          )}
        </div>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={completed ? "default" : "secondary"}>
          {completed ? "Complete" : "Pending"}
        </Badge>
        {!completed && action && (
          <Button size="sm" onClick={action}>
            Complete
          </Button>
        )}
      </div>
    </div>
  );

  if (!user) { return; }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Account Setup Progress
          <Badge variant="outline" className="text-lg px-3">
            {getCompletionPercentage()}%
          </Badge>
        </CardTitle>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${getCompletionPercentage()}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChecklistItem
          completed={checklist.emailVerified}
          title="Email Verification"
          description="Verify your email address to secure your account"
          icon={AlertCircle}
          action={() => toast({ title: "Check your email", description: "Click the verification link we sent you." })}
        />
        
        <ChecklistItem
          completed={checklist.profileComplete}
          title="Complete Profile"
          description="Add your full name"
          icon={User}
          action={() => window.location.href = '/dashboard'}
        />
        
        <ChecklistItem
          completed={checklist.kycCompleted}
          title="KYC Verification"
          description="Complete identity verification to sell tickets"
          icon={Shield}
          action={() => window.location.href = '/dashboard'}
        />
        
        <ChecklistItem
          completed={checklist.paymentSetup}
          title="Payment Setup"
          description="Add UPI ID for receiving payments"
          icon={CreditCard}
          action={() => window.location.href = '/dashboard'}
        />

        {getCompletionPercentage() === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-800">Account Setup Complete!</h3>
            <p className="text-sm text-green-700">You can now buy and sell tickets on the platform.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};