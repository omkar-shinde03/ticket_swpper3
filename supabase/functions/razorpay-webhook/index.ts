// Razorpay Webhook Edge Function (Deno/TypeScript)
// Purpose: Handles incoming webhooks from Razorpay for automatic payment processing

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with, x-razorpay-signature',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with, x-razorpay-signature',
          } 
        }
      );
    }

    // Get webhook secret from environment
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with, x-razorpay-signature',
          } 
        }
      );
    }

    // Get request body and signature
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing signature header' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with, x-razorpay-signature',
          } 
        }
      );
    }

    // Verify webhook signature
    const crypto = await import('https://deno.land/std@0.177.0/crypto/mod.ts');
    const encoder = new TextEncoder();
    const data = encoder.encode(body);
    const key = encoder.encode(webhookSecret);
    
    const hmacKey = await crypto.hmac.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const generatedSignature = await crypto.hmac.subtle.sign('HMAC', hmacKey, data);
    const expectedSignature = Array.from(new Uint8Array(generatedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature !== expectedSignature) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with, x-razorpay-signature',
          } 
        }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    const event = payload.event;
    const payment = payload.payload.payment.entity;

    console.log(`Razorpay webhook received: ${event}`, { paymentId: payment.id });

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with, x-razorpay-signature',
          } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        // Payment was successful
        await handlePaymentSuccess(supabase, payment);
        break;
        
      case 'payment.failed':
        // Payment failed
        await handlePaymentFailure(supabase, payment);
        break;
        
      case 'refund.processed':
        // Refund was processed
        await handleRefundProcessed(supabase, payment);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with, x-razorpay-signature',
        } 
      }
    );

  } catch (error) {
    console.error('Error processing Razorpay webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://ticket-swapper7.vercel.app',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with, x-razorpay-signature',
        } 
      }
    );
  }
});

// Handle successful payment
async function handlePaymentSuccess(supabase, payment) {
  try {
    // Find transaction by Razorpay payment ID
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('razorpay_payment_id', payment.id)
      .single();

    if (transactionError || !transaction) {
      console.error('Transaction not found for payment:', payment.id);
      return;
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    // Update ticket status
    await supabase
      .from('tickets')
      .update({ 
        status: 'sold',
        sold_at: new Date().toISOString()
      })
      .eq('id', transaction.ticket_id);

    // Create notification for seller
    await supabase
      .from('notifications')
      .insert({
        user_id: transaction.seller_id,
        title: 'Payment Received!',
        message: `Payment of ₹${transaction.amount} has been received for your ticket.`,
        type: 'payment_success',
        data: { transaction_id: transaction.id },
        created_at: new Date().toISOString()
      });

    console.log(`Payment success processed for transaction: ${transaction.id}`);

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handle payment failure
async function handlePaymentFailure(supabase, payment) {
  try {
    // Find transaction by Razorpay payment ID
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('razorpay_payment_id', payment.id)
      .single();

    if (transactionError || !transaction) {
      console.error('Transaction not found for failed payment:', payment.id);
      return;
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ 
        status: 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    // Update ticket status back to available
    await supabase
      .from('tickets')
      .update({ 
        status: 'available',
        buyer_id: null,
        sold_at: null
      })
      .eq('id', transaction.ticket_id);

    // Create notification for buyer
    await supabase
      .from('notifications')
      .insert({
        user_id: transaction.buyer_id,
        title: 'Payment Failed',
        message: `Your payment of ₹${transaction.amount} has failed. Please try again.`,
        type: 'payment_failure',
        data: { transaction_id: transaction.id },
        created_at: new Date().toISOString()
      });

    console.log(`Payment failure processed for transaction: ${transaction.id}`);

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle refund processed
async function handleRefundProcessed(supabase, payment) {
  try {
    // Find transaction by Razorpay payment ID
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('razorpay_payment_id', payment.id)
      .single();

    if (transactionError || !transaction) {
      console.error('Transaction not found for refund:', payment.id);
      return;
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ 
        status: 'refunded',
        completed_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    // Update ticket status back to available
    await supabase
      .from('tickets')
      .update({ 
        status: 'available',
        buyer_id: null,
        sold_at: null
      })
      .eq('id', transaction.ticket_id);

    console.log(`Refund processed for transaction: ${transaction.id}`);

  } catch (error) {
    console.error('Error handling refund:', error);
  }
}
