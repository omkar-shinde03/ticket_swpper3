
import { supabase } from "@/integrations/supabase/client";
import { generateJitsiKycLink } from './jitsiUtils';

const ADMIN_EMAIL = "omstemper1@gmail.com";
const ADMIN_PASSWORD = "redlily@3B";

/**
 * @param {string} email
 * @param {string} phone
 * @returns {Promise<{ exists: boolean; type: string | null }>}
 */
export const checkExistingAccount = async (email, phone) => {
  try {
    // Check for existing phone number in profiles table
    if (phone && phone.trim() !== "") {
      const { data: phoneData, error: phoneError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .single();
      if (phoneData && !phoneError) {
        return { exists: true, type: 'phone' };
      }
    }
    // Check for existing email in profiles table
    if (email && email.trim() !== "") {
      const { data: emailData, error: emailError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();
      if (emailData && !emailError) {
        return { exists: true, type: 'email' };
      }
    }
    // If no existing accounts found
    return { exists: false, type: null };
  } catch (error) {
    console.error("Error checking existing account:", error);
    return { exists: false, type: null };
  }
};

/**
 * @param {string} emailOrPhone
 * @param {string} password
 * @returns {Promise<{ isAdmin: boolean }>}
 */
export const handleUserLogin = async (emailOrPhone, password) => {
  let loginEmail = emailOrPhone;

  // Check if the input is a phone number
  const isPhoneNumber = /^[+]?[0-9\s\-()]+$/.test(emailOrPhone.trim());
  
  if (isPhoneNumber) {
    // Find user by phone number in profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', emailOrPhone.trim())
      .single();

    if (profileError || !profileData) {
      throw new Error("No account found with this phone number.");
    }

    // Since we can't get the email from user ID on client side,
    // we'll need to store email in profiles table or use a different approach
    // For now, we'll throw an error suggesting email login
    throw new Error("Please use your email address to log in instead of phone number.");
  }

  // Special handling for admin login
  if (loginEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (loginError) { throw loginError; }
    return { isAdmin: true };
  }

  // Regular user login
  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password: password,
  });

  if (loginError) {
    // Provide more specific error messages
    if (loginError.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password. Please check your credentials and try again.');
    }
    throw loginError;
  }
  
  return { isAdmin: false };
};

/**
 * @param {Object} signupData
 * @param {string} signupData.email
 * @param {string} signupData.password
 * @param {string} signupData.fullName
 * @param {string} signupData.phone
 * @param {boolean} signupData.isAdmin
 * @returns {Promise<boolean>}
 */
export const handleUserSignup = async (signupData) => {
  // Check if trying to create admin account with wrong email
  if (signupData.isAdmin && signupData.email !== ADMIN_EMAIL) {
    throw new Error("Admin accounts can only be created with the authorized email address.");
  }

  // Check for existing accounts
  const accountCheck = await checkExistingAccount(signupData.email, signupData.phone);
  
  if (accountCheck.exists) {
    const message = accountCheck.type === 'email' 
      ? "An account with this email already exists. Please log in instead."
      : "An account with this phone number already exists. Please log in instead.";
    
    throw new Error(message);
  }

  // For admin signup, use the fixed password
  const signupPassword = signupData.isAdmin ? ADMIN_PASSWORD : signupData.password;

  const { data: signupResult, error: signupError } = await supabase.auth.signUp({
    email: signupData.email,
    password: signupPassword,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
      data: {
        full_name: signupData.fullName,
        phone: signupData.phone,
        user_type: signupData.isAdmin ? 'admin' : 'user'
      }
    }
  });

  // Handle different signup scenarios
  if (signupError) {
    // Handle rate limiting specifically
    if (signupError.message && signupError.message.includes('rate limit')) {
      throw new Error("Too many signup attempts. Please wait a moment and try again.");
    }
    // Handle existing user
    if (signupError.message && signupError.message.includes('already registered')) {
      throw new Error("An account with this email already exists. Please log in instead.");
    }
    throw signupError;
  }

  // Check if user already exists (Supabase returns user object even if they already exist)
  if (signupResult.user && !signupResult.user.email_confirmed_at && signupResult.user.created_at) {
    const createdAt = new Date(signupResult.user.created_at);
    const now = new Date();
    const timeDiff = now.getTime() - createdAt.getTime();
    // If user was created more than 1 minute ago, they likely already existed
    if (timeDiff > 60000) {
      throw new Error("An account with this email already exists. Please log in instead.");
    }
  }

  // --- NEW LOGIC: Only insert profile if session exists ---
  let userId = signupResult.user?.id;
  let userEmail = signupResult.user?.email;
  let sessionUserId = null;
  try {
    const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();
    if (sessionUser) sessionUserId = sessionUser.id;
  } catch (e) {
    console.warn('Failed to get session user:', e);
  }

  // Debug logging (remove in production)
  // console.log('Signup userId:', userId, 'Session userId:', sessionUserId);

  if (sessionUserId && userId && sessionUserId === userId) {
    // Session is active, safe to insert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: userEmail,
        full_name: signupData.fullName,
        phone: signupData.phone,
        user_type: signupData.isAdmin ? 'admin' : 'user',
        kyc_status: signupData.isAdmin ? 'verified' : 'pending'
      });
    if (profileError) {
      // RLS error handling
      if (profileError.message && profileError.message.includes('row-level security')) {
        throw new Error('Signup succeeded, but profile creation failed due to security policy. Please log out, log in, and your profile will be created automatically.');
      }
      throw new Error('Database error saving new user profile: ' + (profileError.message || 'Unknown error'));
    }
    
    // Send welcome email for non-admin users
    if (!signupData.isAdmin) {
      const jitsiLink = generateJitsiKycLink();
      const subject = 'Complete Your KYC - Video Call Link';
      const body = `Welcome to TicketSwapper!\n\nTo complete your KYC, join the video call using this link (admin is available now):\n${jitsiLink}\n\nThank you!`;
      await supabase.functions.invoke('send-email', {
        body: { to: signupData.email, subject, body }
      });
    }
    
    return signupData.isAdmin;
  } else {
    // No session yet (likely needs email verification)
    // Profile will be created after first login
    return signupData.isAdmin;
  }
};

/**
 * Check if user's email is verified
 * @returns {Promise<boolean>}
 */
export const isEmailVerified = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return false;
    }

    // Check both auth.users.email_confirmed_at and profiles.email_verified
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email_verified')
      .eq('id', user.id)
      .single();

    // Return true if either auth confirmation or profile verification is true
    return !!(user.email_confirmed_at || profile?.email_verified);
  } catch (error) {
    console.error("Error checking email verification:", error);
    return false;
  }
};

/**
 * Send email verification to current user
 * @returns {Promise<void>}
 */
export const sendEmailVerification = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Try Supabase auth resend first
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
    });

    if (resendError) {
      throw resendError;
    }
  } catch (error) {
    console.error("Send email verification error:", error);
    throw error;
  }
};

export { ADMIN_EMAIL, ADMIN_PASSWORD };
