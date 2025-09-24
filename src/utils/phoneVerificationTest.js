import { supabase } from '@/integrations/supabase/client';
import { sendFirebasePhoneVerification, verifyFirebaseOtp } from './firebasePhoneVerification';
import { verifyFirebaseTokenOnBackend } from './firebaseBackendVerification';

/**
 * Test utility for debugging phone verification
 */
export const testPhoneVerification = async (phone, email) => {
  console.log('🧪 Starting Phone Verification Test...');
  console.log('📱 Phone:', phone);
  console.log('📧 Email:', email);
  
  try {
    // Step 1: Test Firebase phone verification
    console.log('\n1️⃣ Testing Firebase Phone Verification...');
    const firebaseResult = await sendFirebasePhoneVerification(
      phone, 
      'recaptcha-container' // This ID must match the container in the debug panel
    );
    
    if (!firebaseResult.success) {
      console.error('❌ Firebase verification failed:', firebaseResult.error);
      return { success: false, step: 'firebase_send', error: firebaseResult.error };
    }
    
    console.log('✅ Firebase verification code sent successfully');
    console.log('📋 Confirmation result:', firebaseResult.confirmationResult);
    
    // Step 2: Test Supabase Edge Function availability
    console.log('\n2️⃣ Testing Supabase Edge Function...');
    const { data: edgeFunctionTest, error: edgeFunctionError } = await supabase.functions.invoke('verify-firebase-phone', {
      body: {
        idToken: 'test-token',
        phone: phone,
        email: email
      }
    });
    
    if (edgeFunctionError) {
      console.error('❌ Edge Function test failed:', edgeFunctionError);
      return { success: false, step: 'edge_function_test', error: edgeFunctionError.message };
    }
    
    console.log('✅ Edge Function is accessible');
    
    // Step 3: Test database connection
    console.log('\n3️⃣ Testing Database Connection...');
    const { data: profileTest, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (profileError) {
      console.error('❌ Database connection failed:', profileError);
      return { success: false, step: 'database_test', error: profileError.message };
    }
    
    console.log('✅ Database connection successful');
    console.log('👤 User profile found:', profileTest);
    
    return {
      success: true,
      message: 'All tests passed! Phone verification should work.',
      firebaseResult,
      profileTest
    };
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return {
      success: false,
      step: 'general_error',
      error: error.message
    };
  }
};

/**
 * Test the complete verification flow with a mock OTP
 */
export const testCompleteFlow = async (phone, email, mockOtp = '123456') => {
  console.log('🧪 Testing Complete Verification Flow...');
  
  try {
    // Step 1: Send verification code
    const sendResult = await sendFirebasePhoneVerification(phone, 'recaptcha-container');
    
    if (!sendResult.success) {
      throw new Error(`Failed to send code: ${sendResult.error}`);
    }
    
    // Step 2: Simulate OTP verification (this won't work with real Firebase, but tests the flow)
    console.log('📱 Mock OTP verification (this will fail with real Firebase)');
    
    // Step 3: Test backend verification (this will fail without valid token, but tests the endpoint)
    const backendResult = await verifyFirebaseTokenOnBackend('mock-token', phone, email);
    
    console.log('🔍 Backend verification result:', backendResult);
    
    return {
      success: true,
      message: 'Flow test completed (expected failures for mock data)',
      sendResult,
      backendResult
    };
    
  } catch (error) {
    console.error('❌ Flow test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
