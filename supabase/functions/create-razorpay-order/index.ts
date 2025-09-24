// Create Razorpay Order Edge Function (Deno/TypeScript)
// Purpose: Creates an order in Razorpay before collecting payment.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Add a simple test endpoint
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        message: 'Function is working!',
        timestamp: new Date().toISOString(),
        method: req.method
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with',
        } 
      }
    );
  }

  try {
    // Parse request body
    const requestBody = await req.json();
    console.log('Received request body:', JSON.stringify(requestBody, null, 2));
    
    const { ticketId, amount, sellerAmount, platformCommission } = requestBody;

    // Get the user from the request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
          } 
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
          } 
        }
      );
    }

    // Check if user's email is verified
    if (!user.email_confirmed_at) {
      return new Response(
        JSON.stringify({ 
          error: 'Email verification required',
          message: 'Please verify your email before purchasing tickets'
        }),
        { 
          status: 403,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
          } 
        }
      );
    }

    // Log the extracted values
    console.log('Extracted values:', {
      ticketId,
      amount,
      sellerAmount,
      platformCommission,
      ticketIdType: typeof ticketId,
      amountType: typeof amount,
      sellerAmountType: typeof sellerAmount,
      platformCommissionType: typeof platformCommission
    });

    // Validate required fields
    if (!ticketId || !amount || !sellerAmount || !platformCommission) {
      const missingFields = [];
      if (!ticketId) {
        missingFields.push('ticketId');
      }
      if (!amount) {
        missingFields.push('amount');
      }
      if (!sellerAmount) {
        missingFields.push('sellerAmount');
      }
      if (!platformCommission) {
        missingFields.push('platformCommission');
      }
      
      console.error('Missing required fields:', missingFields);
      
      return new Response(
        JSON.stringify({ 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          received: requestBody,
          missing: missingFields
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with',
          } 
        }
      );
    }

    // Validate data types
    if (typeof amount !== 'number' || typeof sellerAmount !== 'number' || typeof platformCommission !== 'number') {
      console.error('Invalid data types:', {
        amount: typeof amount,
        sellerAmount: typeof sellerAmount,
        platformCommission: typeof platformCommission
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Invalid data types. amount, sellerAmount, and platformCommission must be numbers.',
          received: requestBody
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with',
          } 
        }
      );
    }

    // Get Razorpay credentials from environment
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials missing:', {
        hasKeyId: !!razorpayKeyId,
        hasKeySecret: !!razorpayKeySecret
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your Supabase Edge Function secrets.' 
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with',
          } 
        }
      );
    }

    console.log('Creating Razorpay order with:', {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `tkt_${Date.now()}`
    });

    // Create Razorpay order (test mode for college project)
    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
      currency: 'INR',
      receipt: `tkt_${Date.now()}`, // Shorter receipt ID
      notes: {
        ticketId: ticketId,
        sellerAmount: sellerAmount.toString(),
        platformCommission: platformCommission.toString(),
        test_mode: 'true' // Mark as test mode
      }
    };

    // Make API call to Razorpay
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Razorpay API error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: `Failed to create Razorpay order: ${errorData.error?.description || 'Unknown error'}` 
        }),
        { 
          status: response.status,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with',
          } 
        }
      );
    }

    const orderResponse = await response.json();
    console.log('Razorpay order created successfully:', orderResponse.id);

    // Return order details for frontend
    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderResponse.id,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        razorpayKeyId: razorpayKeyId,
        receipt: orderResponse.receipt,
        ticketId: ticketId,
        sellerAmount: sellerAmount,
        platformCommission: platformCommission
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with',
        } 
      }
    );

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error while creating payment order',
        details: error.message
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with',
        } 
      }
    );
  }
});
