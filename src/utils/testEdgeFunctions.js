import { supabase } from '@/integrations/supabase/client';

/**
 * Test all Edge Functions to identify issues
 */
export const testAllEdgeFunctions = async () => {
  const results = [];
  
  // Test 1: Check if Edge Functions are accessible
  try {
    const { data, error } = await supabase.functions.list();
    if (error) {
      results.push({
        test: 'Edge Functions List',
        success: false,
        error: error.message,
        data: null
      });
    } else {
      results.push({
        test: 'Edge Functions List',
        success: true,
        message: `Found ${data.length} functions`,
        data: data.map(f => f.name)
      });
    }
  } catch (error) {
    results.push({
      test: 'Edge Functions List',
      success: false,
      error: error.message,
      data: null
    });
  }

  // Test 2: Test send-phone-verification function
  try {
    const { data, error } = await supabase.functions.invoke('send-phone-verification', {
      body: {
        phone: '9876543210',
        email: 'test@example.com',
        isResend: false
      }
    });
    
    if (error) {
      results.push({
        test: 'Send Phone Verification',
        success: false,
        error: error.message,
        data: null
      });
    } else {
      results.push({
        test: 'Send Phone Verification',
        success: true,
        message: 'Function executed successfully',
        data: data
      });
    }
  } catch (error) {
    results.push({
      test: 'Send Phone Verification',
      success: false,
      error: error.message,
      data: null
    });
  }

  // Test 3: Test verify-phone-otp function
  try {
    const { data, error } = await supabase.functions.invoke('verify-phone-otp', {
      body: {
        phone: '9876543210',
        email: 'test@example.com',
        otp: '123456'
      }
    });
    
    if (error) {
      results.push({
        test: 'Verify Phone OTP',
        success: false,
        error: error.message,
        data: null
      });
    } else {
      results.push({
        test: 'Verify Phone OTP',
        success: true,
        message: 'Function executed successfully',
        data: data
      });
    }
  } catch (error) {
    results.push({
      test: 'Verify Phone OTP',
      success: false,
      error: error.message,
      data: null
    });
  }

  // Test 4: Check database tables
  try {
    const { data, error } = await supabase
      .from('phone_verification_otps')
      .select('count')
      .limit(1);
    
    if (error) {
      results.push({
        test: 'Database Tables',
        success: false,
        error: error.message,
        data: null
      });
    } else {
      results.push({
        test: 'Database Tables',
        success: true,
        message: 'Phone verification tables accessible',
        data: data
      });
    }
  } catch (error) {
    results.push({
      test: 'Database Tables',
      success: false,
      error: error.message,
      data: null
    });
  }

  return results;
};

/**
 * Test specific Edge Function
 */
export const testEdgeFunction = async (functionName, body) => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });
    
    if (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Check Edge Function status
 */
export const checkEdgeFunctionStatus = async (functionName) => {
  try {
    const { data, error } = await supabase.functions.list();
    
    if (error) {
      return {
        exists: false,
        error: error.message
      };
    }
    
    const functionExists = data.some(f => f.name === functionName);
    
    return {
      exists: functionExists,
      functions: data.map(f => f.name)
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
};
