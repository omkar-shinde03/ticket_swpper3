// Database Schema Test Utility
// This file helps test if the database relationships are working correctly

import { supabase } from "@/integrations/supabase/client";

export const testDatabaseSchema = async () => {
  console.log("🔍 Testing Database Schema...");
  
  try {
    // Test 1: Check if we can call the new RPC function
    console.log("Test 1: Testing get_available_tickets function...");
    const { data: availableTickets, error: rpcError } = await supabase.rpc('get_available_tickets');
    
    if (rpcError) {
      console.error("❌ RPC function failed:", rpcError);
    } else {
      console.log("✅ RPC function works! Found", availableTickets?.length || 0, "tickets");
      if (availableTickets?.length > 0) {
        console.log("Sample ticket with seller info:", availableTickets[0]);
      }
    }

    // Test 2: Check basic tickets query
    console.log("\nTest 2: Testing basic tickets query...");
    const { data: basicTickets, error: basicError } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'available')
      .limit(5);
    
    if (basicError) {
      console.error("❌ Basic tickets query failed:", basicError);
    } else {
      console.log("✅ Basic tickets query works! Found", basicTickets?.length || 0, "tickets");
    }

    // Test 3: Check profiles access
    console.log("\nTest 3: Testing profiles access...");
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, kyc_status')
      .limit(5);
    
    if (profilesError) {
      console.error("❌ Profiles query failed:", profilesError);
    } else {
      console.log("✅ Profiles query works! Found", profiles?.length || 0, "profiles");
    }

    // Test 4: Check the view
    console.log("\nTest 4: Testing tickets_with_seller view...");
    const { data: viewData, error: viewError } = await supabase
      .from('tickets_with_seller')
      .select('*')
      .limit(5);
    
    if (viewError) {
      console.error("❌ View query failed:", viewError);
    } else {
      console.log("✅ View query works! Found", viewData?.length || 0, "tickets with seller info");
      if (viewData?.length > 0) {
        console.log("Sample view data:", viewData[0]);
      }
    }

    // Test 5: Check if user can access their own tickets
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log("\nTest 5: Testing user's own tickets...");
      const { data: userTickets, error: userError } = await supabase.rpc('get_user_tickets');
      
      if (userError) {
        console.error("❌ User tickets function failed:", userError);
      } else {
        console.log("✅ User tickets function works! Found", userTickets?.length || 0, "user tickets");
      }
    }

    console.log("\n🎉 Database schema test completed!");
    return {
      success: true,
      availableTickets: availableTickets?.length || 0,
      basicTickets: basicTickets?.length || 0,
      profiles: profiles?.length || 0,
      viewData: viewData?.length || 0
    };

  } catch (error) {
    console.error("❌ Database test failed with error:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to be called from browser console for debugging
window.testDatabaseSchema = testDatabaseSchema;