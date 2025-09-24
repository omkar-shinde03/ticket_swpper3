import { supabase } from '@/integrations/supabase/client';

/**
 * Check if the current user's KYC is verified
 * @returns {Promise<{verified: boolean, status: string, error?: string}>}
 */
export const isKYCVerified = async () => {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { verified: false, status: 'not_authenticated', error: 'User not authenticated' };
    }

    // Get user's KYC status from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('kyc_status, full_name, user_type')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching KYC status:', profileError);
      return { verified: false, status: 'error', error: 'Failed to fetch KYC status' };
    }

    // Check if user is admin (admins don't need KYC verification)
    if (profile.user_type === 'admin') {
      return { verified: true, status: 'admin', error: null };
    }

    // Check KYC status
    const kycStatus = profile.kyc_status;
    
    if (kycStatus === 'verified') {
      return { verified: true, status: 'verified', error: null };
    } else if (kycStatus === 'pending') {
      return { verified: false, status: 'pending', error: 'KYC verification is pending approval' };
    } else if (kycStatus === 'rejected') {
      return { verified: false, status: 'rejected', error: 'KYC verification was rejected' };
    } else {
      return { verified: false, status: 'not_verified', error: 'KYC verification is required' };
    }

  } catch (error) {
    console.error('Error checking KYC verification:', error);
    return { verified: false, status: 'error', error: 'Failed to check KYC status' };
  }
};

/**
 * Get detailed KYC status information for display
 * @returns {Promise<{verified: boolean, status: string, message: string, canPurchase: boolean}>}
 */
export const getKYCStatusInfo = async () => {
  const kycResult = await isKYCVerified();
  
  const statusMessages = {
    'verified': {
      message: 'Your account is verified and ready for all features',
      canPurchase: true
    },
    'admin': {
      message: 'Admin account - full access granted',
      canPurchase: true
    },
    'pending': {
      message: 'Your KYC verification is under review. Please wait for approval.',
      canPurchase: false
    },
    'rejected': {
      message: 'Your KYC verification was rejected. Please complete KYC again.',
      canPurchase: false
    },
    'not_verified': {
      message: 'KYC verification is required to purchase tickets.',
      canPurchase: false
    },
    'not_authenticated': {
      message: 'Please log in to access this feature.',
      canPurchase: false
    },
    'error': {
      message: 'Unable to verify KYC status. Please try again.',
      canPurchase: false
    }
  };

  const statusInfo = statusMessages[kycResult.status] || statusMessages['error'];
  
  return {
    verified: kycResult.verified,
    status: kycResult.status,
    message: statusInfo.message,
    canPurchase: statusInfo.canPurchase,
    error: kycResult.error
  };
};
