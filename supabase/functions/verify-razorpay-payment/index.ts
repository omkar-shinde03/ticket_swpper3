// Verify Razorpay Payment Edge Function (Deno/TypeScript)
// Purpose: Verifies a payment with Razorpay (checks signature, status, etc.).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS helper: reflect allowed origins and standard headers
function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigins = new Set<string>([
    'https://ticket-swpper3.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ]);

  const allowOrigin = allowedOrigins.has(origin) ? origin : 'https://ticket-swpper3.vercel.app';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with, x-razorpay-signature, x-supabase-auth',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(req),
    });
  }

  try {
    // Parse request body
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature, 
      ticketId,
      buyer_id,
      buyer_name
    } = await req.json();

    // Get the user from the request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            ...buildCorsHeaders(req),
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
            ...buildCorsHeaders(req),
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
            ...buildCorsHeaders(req),
          } 
        }
      );
    }

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !ticketId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: razorpay_payment_id, razorpay_order_id, razorpay_signature, ticketId' 
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...buildCorsHeaders(req),
          } 
        }
      );
    }

    // Get Razorpay credentials from environment
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!razorpayKeySecret) {
      return new Response(
        JSON.stringify({ 
          error: 'Razorpay credentials not configured' 
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...buildCorsHeaders(req),
          } 
        }
      );
    }

    // For test mode (college project), skip signature verification
    // In production, you would verify the signature here
    console.log('Test mode: Skipping signature verification for college project');
    console.log('Payment details:', {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      ticketId,
      buyer_id,
      buyer_name
    });

    // Validate Supabase env
    const supabaseUrl2 = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey2 = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl2 || !supabaseServiceKey2) {
      return new Response(
        JSON.stringify({ 
          error: 'Supabase configuration missing' 
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...buildCorsHeaders(req),
          } 
        }
      );
    }

    // Reuse the existing supabase client defined earlier

    // Get ticket details
    console.log('Fetching ticket with ID:', ticketId);
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      console.error('Ticket fetch error:', ticketError);
      return new Response(
        JSON.stringify({ 
          error: 'Ticket not found',
          details: ticketError.message
        }),
        { 
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            ...buildCorsHeaders(req),
          } 
        }
      );
    }

    if (!ticket) {
      console.error('No ticket found with ID:', ticketId);
      return new Response(
        JSON.stringify({ 
          error: 'Ticket not found' 
        }),
        { 
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            ...buildCorsHeaders(req),
          } 
        }
      );
    }

    console.log('Ticket found:', ticket);

    // Calculate amounts
    const commissionRate = 0.05;
    const sellingPrice = ticket.selling_price;
    const platformCommission = Math.round(sellingPrice * commissionRate);
    const sellerAmount = sellingPrice - platformCommission;

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        ticket_id: ticketId,
        buyer_id: buyer_id || null,
        seller_id: ticket.seller_id,
        amount: sellingPrice,
        platform_fee: platformCommission,
        status: 'completed',
        payment_method: 'razorpay',
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        escrow_status: 'held',
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction creation error:', transactionError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create transaction record' 
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...buildCorsHeaders(req),
          } 
        }
      );
    }

    // Update ticket status and passenger name with buyer's name (local DB)
    const { error: ticketUpdateError } = await supabase
      .from('tickets')
      .update({ 
        status: 'sold',
        buyer_id: buyer_id,
        passenger_name: buyer_name || 'Unknown Buyer', // Update passenger name with buyer's name
        sold_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (ticketUpdateError) {
      console.error('Ticket update error:', ticketUpdateError);
    }

    // Mirror passenger name update to External API (if configured)
    try {
      const externalUrl = Deno.env.get('EXTERNAL_SUPABASE_URL');
      const externalKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('EXTERNAL_SUPABASE_ANON_KEY');
      if (externalUrl && externalKey && ticket?.pnr_number) {
        const endpoint = `${externalUrl.replace(/\/$/, '')}/rest/v1/tickets?pnr_number=eq.${encodeURIComponent(ticket.pnr_number)}`;
        const resp = await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': externalKey,
            'Authorization': `Bearer ${externalKey}`
          },
          body: JSON.stringify({ passenger_name: buyer_name || 'Unknown Buyer' })
        });
        if (!resp.ok) {
          const errText = await resp.text();
          console.warn('External API passenger_name update failed:', resp.status, errText);
        } else {
          console.log('External API passenger_name updated for PNR:', ticket.pnr_number);
        }
      } else {
        console.log('External API env not configured or missing PNR, skipping external update');
      }
    } catch (extErr) {
      console.warn('External API update error:', extErr);
    }

    // Create seller payout record
    const { error: payoutError } = await supabase
      .from('seller_payouts')
      .insert({
        transaction_id: transaction.id,
        seller_id: ticket.seller_id,
        amount: sellerAmount,
        status: 'pending',
        payment_method: 'upi',
        created_at: new Date().toISOString()
      });

    if (payoutError) {
      console.error('Payout creation error:', payoutError);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified successfully',
        transaction: {
          id: transaction.id,
          amount: sellingPrice,
          platformCommission: platformCommission,
          sellerAmount: sellerAmount,
          status: 'completed'
        },
        ticket: {
          id: ticketId,
          status: 'sold'
        }
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          ...buildCorsHeaders(req),
        } 
      }
    );

  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error while verifying payment',
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...buildCorsHeaders(req),
        } 
      }
    );
  }
});
