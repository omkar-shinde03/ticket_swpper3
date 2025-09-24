import { supabase } from '@/integrations/supabase/client';

/**
 * Verify Firebase ID token on the backend and mark phone as verified
 * @param {string} idToken - Firebase ID token from frontend
 * @param {string} phone - User's phone number
 * @param {string} email - User's email
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const verifyFirebaseTokenOnBackend = async (idToken, phone, email) => {
  try {
    if (!idToken || !phone || !email) {
      throw new Error('ID token, phone, and email are required');
    }

    // Call Supabase Edge Function to verify Firebase token
    const { data, error } = await supabase.functions.invoke('verify-firebase-phone', {
      body: {
        idToken,
        phone,
        email
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: data.message || 'Phone verified successfully'
    };

  } catch (error) {
    console.error('Backend Firebase verification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Alternative: Direct database update if you prefer to handle verification in your app
 * @param {string} phone - User's phone number
 * @param {string} email - User's email
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const markPhoneAsVerified = async (phone, email) => {
  try {
    if (!phone || !email) {
      throw new Error('Phone and email are required');
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Update profile to mark phone as verified
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
        phone: phone
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error('Failed to update phone verification status');
    }

    return {
      success: true,
      message: 'Phone verified successfully'
    };

  } catch (error) {
    console.error('Mark phone as verified error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
