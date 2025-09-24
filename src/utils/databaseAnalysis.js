/**
 * Comprehensive Supabase Database Analysis and Fix Utility
 * Identifies and resolves common database issues
 */

import { supabase } from "@/integrations/supabase/client";

export class DatabaseAnalyzer {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.warnings = [];
  }

  /**
   * Run comprehensive database analysis
   */
  async analyzeDatabase() {
    console.log("🔍 Starting comprehensive database analysis...");
    
    try {
      // Reset analysis state
      this.issues = [];
      this.fixes = [];
      this.warnings = [];

      // Run all analysis checks
      await this.checkTableExistence();
      await this.checkRLSPolicies();
      await this.checkForeignKeyRelationships();
      await this.checkIndexes();
      await this.checkFunctions();
      await this.checkDataIntegrity();
      await this.checkPermissions();
      await this.checkStorageBuckets();

      return {
        success: true,
        issues: this.issues,
        fixes: this.fixes,
        warnings: this.warnings,
        summary: this.generateSummary()
      };

    } catch (error) {
      console.error("❌ Database analysis failed:", error);
      return {
        success: false,
        error: error.message,
        issues: this.issues,
        fixes: this.fixes
      };
    }
  }

  /**
   * Check if all required tables exist
   */
  async checkTableExistence() {
    console.log("📋 Checking table existence...");
    
    const requiredTables = [
      'profiles',
      'tickets', 
      'messages',
      'transactions',
      'notifications',
      'kyc_documents',
      'video_calls',
      'seller_payouts',
      'email_verification_tokens',
      'phone_verification_otps'
    ];

    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            this.issues.push({
              type: 'missing_table',
              table: tableName,
              severity: 'high',
              message: `Table '${tableName}' does not exist`,
              fix: `CREATE TABLE ${tableName} with proper schema`
            });
          } else {
            this.issues.push({
              type: 'table_access_error',
              table: tableName,
              severity: 'medium',
              message: `Cannot access table '${tableName}': ${error.message}`,
              fix: 'Check RLS policies and permissions'
            });
          }
        } else {
          console.log(`✅ Table '${tableName}' exists and accessible`);
        }
      } catch (err) {
        this.issues.push({
          type: 'table_check_error',
          table: tableName,
          severity: 'high',
          message: `Error checking table '${tableName}': ${err.message}`
        });
      }
    }
  }

  /**
   * Check RLS policies
   */
  async checkRLSPolicies() {
    console.log("🔒 Checking RLS policies...");
    
    try {
      // Check if we can access tickets without being authenticated
      const { data: publicTickets, error: publicError } = await supabase
        .from('tickets')
        .select('id')
        .eq('status', 'available')
        .limit(1);

      if (publicError && publicError.message.includes('RLS')) {
        this.issues.push({
          type: 'rls_too_restrictive',
          table: 'tickets',
          severity: 'medium',
          message: 'RLS policies may be too restrictive for public ticket viewing',
          fix: 'Review and update RLS policies for public access'
        });
      }

      // Check if authenticated users can access their own data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          this.issues.push({
            type: 'profile_access_error',
            table: 'profiles',
            severity: 'high',
            message: `Cannot access user profile: ${profileError.message}`,
            fix: 'Check profiles table RLS policies'
          });
        }
      }

    } catch (error) {
      this.warnings.push({
        type: 'rls_check_error',
        message: `RLS policy check failed: ${error.message}`
      });
    }
  }

  /**
   * Check foreign key relationships
   */
  async checkForeignKeyRelationships() {
    console.log("🔗 Checking foreign key relationships...");
    
    try {
      // Test tickets -> profiles relationship
      const { data: ticketsWithProfiles, error: joinError } = await supabase
        .from('tickets')
        .select(`
          id,
          seller_id,
          profiles!tickets_seller_id_fkey (
            id,
            full_name
          )
        `)
        .limit(5);

      if (joinError) {
        this.issues.push({
          type: 'foreign_key_error',
          tables: 'tickets -> profiles',
          severity: 'high',
          message: `Foreign key relationship broken: ${joinError.message}`,
          fix: 'Check foreign key constraints and table relationships'
        });
      } else if (ticketsWithProfiles) {
        console.log(`✅ Tickets-Profiles relationship working (${ticketsWithProfiles.length} records tested)`);
      }

      // Test messages -> tickets relationship
      const { data: messagesWithTickets, error: messageJoinError } = await supabase
        .from('messages')
        .select(`
          id,
          ticket_id,
          tickets (
            id,
            pnr_number
          )
        `)
        .limit(5);

      if (messageJoinError) {
        this.issues.push({
          type: 'foreign_key_error',
          tables: 'messages -> tickets',
          severity: 'medium',
          message: `Messages-Tickets relationship issue: ${messageJoinError.message}`,
          fix: 'Check messages table foreign key constraints'
        });
      }

    } catch (error) {
      this.warnings.push({
        type: 'relationship_check_error',
        message: `Relationship check failed: ${error.message}`
      });
    }
  }

  /**
   * Check database functions
   */
  async checkFunctions() {
    console.log("⚙️ Checking database functions...");
    
    const requiredFunctions = [
      'get_available_tickets',
      'get_user_tickets',
      'generate_verification_token',
      'verify_email_token',
      'can_send_verification_email'
    ];

    for (const functionName of requiredFunctions) {
      try {
        const { data, error } = await supabase.rpc(functionName);
        
        if (error) {
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            this.issues.push({
              type: 'missing_function',
              function: functionName,
              severity: 'high',
              message: `Function '${functionName}' does not exist`,
              fix: `Create function ${functionName}`
            });
          } else {
            this.issues.push({
              type: 'function_error',
              function: functionName,
              severity: 'medium',
              message: `Function '${functionName}' error: ${error.message}`,
              fix: 'Check function implementation and permissions'
            });
          }
        } else {
          console.log(`✅ Function '${functionName}' working`);
        }
      } catch (err) {
        this.issues.push({
          type: 'function_check_error',
          function: functionName,
          severity: 'medium',
          message: `Error checking function '${functionName}': ${err.message}`
        });
      }
    }
  }

  /**
   * Check data integrity
   */
  async checkDataIntegrity() {
    console.log("🔍 Checking data integrity...");
    
    try {
      // Check for orphaned tickets (tickets without valid seller profiles)
      const { data: orphanedTickets, error: orphanError } = await supabase
        .from('tickets')
        .select(`
          id,
          seller_id,
          profiles!tickets_seller_id_fkey (id)
        `)
        .is('profiles.id', null)
        .limit(10);

      if (orphanError) {
        this.warnings.push({
          type: 'integrity_check_error',
          message: `Cannot check for orphaned tickets: ${orphanError.message}`
        });
      } else if (orphanedTickets && orphanedTickets.length > 0) {
        this.issues.push({
          type: 'orphaned_data',
          table: 'tickets',
          severity: 'medium',
          message: `Found ${orphanedTickets.length} tickets with invalid seller references`,
          fix: 'Clean up orphaned ticket records'
        });
      }

      // Check for duplicate PNR numbers
      const { data: duplicatePNRs, error: pnrError } = await supabase
        .from('tickets')
        .select('pnr_number')
        .limit(1000);

      if (!pnrError && duplicatePNRs) {
        const pnrCounts = {};
        duplicatePNRs.forEach(ticket => {
          pnrCounts[ticket.pnr_number] = (pnrCounts[ticket.pnr_number] || 0) + 1;
        });

        const duplicates = Object.entries(pnrCounts).filter(([pnr, count]) => count > 1);
        if (duplicates.length > 0) {
          this.warnings.push({
            type: 'duplicate_data',
            table: 'tickets',
            message: `Found ${duplicates.length} duplicate PNR numbers`,
            details: duplicates.slice(0, 5).map(([pnr, count]) => `${pnr}: ${count} times`)
          });
        }
      }

    } catch (error) {
      this.warnings.push({
        type: 'integrity_check_error',
        message: `Data integrity check failed: ${error.message}`
      });
    }
  }

  /**
   * Check database indexes
   */
  async checkIndexes() {
    console.log("📊 Checking database indexes...");
    
    // This is a simplified check - in a real scenario you'd query pg_indexes
    // For now, we'll check if queries are performing well
    try {
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('tickets')
        .select('id, seller_id, status')
        .eq('status', 'available')
        .limit(100);

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      if (queryTime > 1000) { // More than 1 second
        this.warnings.push({
          type: 'slow_query',
          table: 'tickets',
          message: `Tickets query took ${queryTime.toFixed(2)}ms - may need indexing`,
          fix: 'Add indexes on frequently queried columns'
        });
      }

      if (error) {
        this.issues.push({
          type: 'query_performance_error',
          table: 'tickets',
          severity: 'medium',
          message: `Query performance test failed: ${error.message}`
        });
      }

    } catch (error) {
      this.warnings.push({
        type: 'index_check_error',
        message: `Index check failed: ${error.message}`
      });
    }
  }

  /**
   * Check permissions
   */
  async checkPermissions() {
    console.log("🔐 Checking permissions...");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        this.warnings.push({
          type: 'not_authenticated',
          message: 'User not authenticated - some checks skipped'
        });
        return;
      }

      // Test basic CRUD operations
      const testOperations = [
        {
          name: 'profiles_select',
          operation: () => supabase.from('profiles').select('id').eq('id', user.id).single()
        },
        {
          name: 'tickets_select',
          operation: () => supabase.from('tickets').select('id').limit(1)
        },
        {
          name: 'messages_select',
          operation: () => supabase.from('messages').select('id').limit(1)
        }
      ];

      for (const test of testOperations) {
        try {
          const { error } = await test.operation();
          if (error) {
            this.issues.push({
              type: 'permission_error',
              operation: test.name,
              severity: 'medium',
              message: `Permission denied for ${test.name}: ${error.message}`,
              fix: 'Check RLS policies and user permissions'
            });
          }
        } catch (err) {
          this.issues.push({
            type: 'permission_check_error',
            operation: test.name,
            severity: 'low',
            message: `Error testing ${test.name}: ${err.message}`
          });
        }
      }

    } catch (error) {
      this.warnings.push({
        type: 'permission_check_error',
        message: `Permission check failed: ${error.message}`
      });
    }
  }

  /**
   * Check storage buckets
   */
  async checkStorageBuckets() {
    console.log("🗄️ Checking storage buckets...");
    
    const requiredBuckets = [
      'kyc-documents',
      'ticket-images', 
      'avatars',
      'message-attachments'
    ];

    for (const bucketName of requiredBuckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 });

        if (error) {
          if (error.message.includes('not found') || error.message.includes('does not exist')) {
            this.issues.push({
              type: 'missing_bucket',
              bucket: bucketName,
              severity: 'medium',
              message: `Storage bucket '${bucketName}' does not exist`,
              fix: `Create storage bucket ${bucketName}`
            });
          } else {
            this.issues.push({
              type: 'bucket_access_error',
              bucket: bucketName,
              severity: 'low',
              message: `Cannot access bucket '${bucketName}': ${error.message}`,
              fix: 'Check storage policies and permissions'
            });
          }
        } else {
          console.log(`✅ Storage bucket '${bucketName}' accessible`);
        }
      } catch (err) {
        this.warnings.push({
          type: 'bucket_check_error',
          bucket: bucketName,
          message: `Error checking bucket '${bucketName}': ${err.message}`
        });
      }
    }
  }

  /**
   * Generate automated fixes for common issues
   */
  async generateFixes() {
    console.log("🔧 Generating automated fixes...");
    
    const fixes = [];

    // Fix 1: Create missing tables
    const missingTables = this.issues.filter(issue => issue.type === 'missing_table');
    if (missingTables.length > 0) {
      fixes.push({
        type: 'create_missing_tables',
        description: 'Create missing database tables',
        sql: this.generateCreateTableSQL(missingTables),
        severity: 'high'
      });
    }

    // Fix 2: Create missing functions
    const missingFunctions = this.issues.filter(issue => issue.type === 'missing_function');
    if (missingFunctions.length > 0) {
      fixes.push({
        type: 'create_missing_functions',
        description: 'Create missing database functions',
        sql: this.generateCreateFunctionSQL(missingFunctions),
        severity: 'high'
      });
    }

    // Fix 3: Create missing storage buckets
    const missingBuckets = this.issues.filter(issue => issue.type === 'missing_bucket');
    if (missingBuckets.length > 0) {
      fixes.push({
        type: 'create_missing_buckets',
        description: 'Create missing storage buckets',
        instructions: this.generateBucketCreationInstructions(missingBuckets),
        severity: 'medium'
      });
    }

    // Fix 4: Update RLS policies
    const rlsIssues = this.issues.filter(issue => issue.type.includes('rls') || issue.type.includes('permission'));
    if (rlsIssues.length > 0) {
      fixes.push({
        type: 'fix_rls_policies',
        description: 'Fix RLS policy issues',
        sql: this.generateRLSFixSQL(),
        severity: 'medium'
      });
    }

    this.fixes = fixes;
    return fixes;
  }

  /**
   * Generate SQL for creating missing tables
   */
  generateCreateTableSQL(missingTables) {
    const tableSchemas = {
      profiles: `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          full_name TEXT,
          phone TEXT,
          email TEXT,
          user_type TEXT DEFAULT 'user' CHECK (user_type IN ('user', 'admin')),
          kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
          email_verified BOOLEAN DEFAULT false,
          phone_verified BOOLEAN DEFAULT false,
          avatar_url TEXT,
          upi_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own profile" ON public.profiles
          FOR SELECT USING (auth.uid() = id);
        
        CREATE POLICY "Users can update own profile" ON public.profiles
          FOR UPDATE USING (auth.uid() = id);
        
        CREATE POLICY "Users can insert own profile" ON public.profiles
          FOR INSERT WITH CHECK (auth.uid() = id);
      `,
      
      tickets: `
        CREATE TABLE IF NOT EXISTS public.tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          pnr_number TEXT NOT NULL,
          bus_operator TEXT,
          departure_date DATE NOT NULL,
          departure_time TIME NOT NULL,
          from_location TEXT NOT NULL,
          to_location TEXT NOT NULL,
          passenger_name TEXT NOT NULL,
          seat_number TEXT NOT NULL,
          ticket_price DECIMAL(10,2) NOT NULL,
          selling_price DECIMAL(10,2),
          status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'cancelled')),
          verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
          transport_mode VARCHAR(20) DEFAULT 'bus' CHECK (transport_mode IN ('bus', 'train', 'plane')),
          api_verified BOOLEAN DEFAULT false,
          api_provider TEXT,
          verification_confidence INTEGER DEFAULT 0,
          verified_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can view available tickets" ON public.tickets
          FOR SELECT USING (status = 'available' OR seller_id = auth.uid());
        
        CREATE POLICY "Users can insert own tickets" ON public.tickets
          FOR INSERT WITH CHECK (auth.uid() = seller_id);
        
        CREATE POLICY "Users can update own tickets" ON public.tickets
          FOR UPDATE USING (auth.uid() = seller_id);
      `,
      
      messages: `
        CREATE TABLE IF NOT EXISTS public.messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
          sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
          read_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own messages" ON public.messages
          FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
        
        CREATE POLICY "Users can send messages" ON public.messages
          FOR INSERT WITH CHECK (auth.uid() = sender_id);
      `
    };

    return missingTables
      .map(table => tableSchemas[table.table])
      .filter(Boolean)
      .join('\n\n');
  }

  /**
   * Generate SQL for creating missing functions
   */
  generateCreateFunctionSQL(missingFunctions) {
    const functionSchemas = {
      get_available_tickets: `
        CREATE OR REPLACE FUNCTION public.get_available_tickets()
        RETURNS TABLE (
          id UUID,
          seller_id UUID,
          pnr_number TEXT,
          bus_operator TEXT,
          departure_date DATE,
          departure_time TIME,
          from_location TEXT,
          to_location TEXT,
          passenger_name TEXT,
          seat_number TEXT,
          ticket_price DECIMAL(10,2),
          selling_price DECIMAL(10,2),
          status TEXT,
          verification_status TEXT,
          transport_mode VARCHAR(20),
          created_at TIMESTAMPTZ,
          seller_name TEXT,
          seller_phone TEXT
        ) LANGUAGE sql SECURITY DEFINER AS $$
          SELECT 
            t.id, t.seller_id, t.pnr_number, t.bus_operator,
            t.departure_date, t.departure_time, t.from_location, t.to_location,
            t.passenger_name, t.seat_number, t.ticket_price, t.selling_price,
            t.status, t.verification_status, t.transport_mode, t.created_at,
            COALESCE(p.full_name, 'Anonymous') as seller_name,
            COALESCE(p.phone, '') as seller_phone
          FROM public.tickets t
          LEFT JOIN public.profiles p ON t.seller_id = p.id
          WHERE t.status = 'available'
          ORDER BY t.created_at DESC;
        $$;
      `,
      
      get_user_tickets: `
        CREATE OR REPLACE FUNCTION public.get_user_tickets()
        RETURNS TABLE (
          id UUID,
          seller_id UUID,
          pnr_number TEXT,
          bus_operator TEXT,
          departure_date DATE,
          departure_time TIME,
          from_location TEXT,
          to_location TEXT,
          passenger_name TEXT,
          seat_number TEXT,
          ticket_price DECIMAL(10,2),
          selling_price DECIMAL(10,2),
          status TEXT,
          verification_status TEXT,
          transport_mode VARCHAR(20),
          created_at TIMESTAMPTZ
        ) LANGUAGE sql SECURITY DEFINER AS $$
          SELECT 
            t.id, t.seller_id, t.pnr_number, t.bus_operator,
            t.departure_date, t.departure_time, t.from_location, t.to_location,
            t.passenger_name, t.seat_number, t.ticket_price, t.selling_price,
            t.status, t.verification_status, t.transport_mode, t.created_at
          FROM public.tickets t
          WHERE t.seller_id = auth.uid()
          ORDER BY t.created_at DESC;
        $$;
      `
    };

    return missingFunctions
      .map(func => functionSchemas[func.function])
      .filter(Boolean)
      .join('\n\n');
  }

  /**
   * Generate RLS fix SQL
   */
  generateRLSFixSQL() {
    return `
      -- Fix common RLS policy issues
      
      -- Ensure profiles can be read for ticket listings
      DROP POLICY IF EXISTS "Public profile access for tickets" ON public.profiles;
      CREATE POLICY "Public profile access for tickets" ON public.profiles
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.tickets 
            WHERE seller_id = profiles.id AND status = 'available'
          ) OR
          id = auth.uid()
        );
      
      -- Ensure tickets can be viewed by potential buyers
      DROP POLICY IF EXISTS "Public ticket viewing" ON public.tickets;
      CREATE POLICY "Public ticket viewing" ON public.tickets
        FOR SELECT USING (status = 'available' OR seller_id = auth.uid());
      
      -- Ensure messages work between users
      DROP POLICY IF EXISTS "Message participants can view" ON public.messages;
      CREATE POLICY "Message participants can view" ON public.messages
        FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
    `;
  }

  /**
   * Generate bucket creation instructions
   */
  generateBucketCreationInstructions(missingBuckets) {
    return missingBuckets.map(bucket => ({
      bucket: bucket.bucket,
      instructions: [
        `1. Go to Supabase Dashboard > Storage`,
        `2. Click "Create Bucket"`,
        `3. Name: ${bucket.bucket}`,
        `4. Set as ${bucket.bucket.includes('avatar') ? 'Public' : 'Private'}`,
        `5. Create bucket and set up policies`
      ]
    }));
  }

  /**
   * Generate analysis summary
   */
  generateSummary() {
    const totalIssues = this.issues.length;
    const highSeverity = this.issues.filter(i => i.severity === 'high').length;
    const mediumSeverity = this.issues.filter(i => i.severity === 'medium').length;
    const lowSeverity = this.issues.filter(i => i.severity === 'low').length;

    return {
      totalIssues,
      highSeverity,
      mediumSeverity,
      lowSeverity,
      warnings: this.warnings.length,
      status: totalIssues === 0 ? 'healthy' : 
              highSeverity > 0 ? 'critical' :
              mediumSeverity > 0 ? 'needs_attention' : 'minor_issues',
      recommendation: this.getRecommendation(totalIssues, highSeverity, mediumSeverity)
    };
  }

  /**
   * Get recommendation based on analysis
   */
  getRecommendation(total, high, medium) {
    if (total === 0) {
      return "Database is healthy and ready for production use.";
    } else if (high > 0) {
      return "Critical issues found. Address high-severity issues immediately before deployment.";
    } else if (medium > 0) {
      return "Some issues found. Recommended to fix before production deployment.";
    } else {
      return "Minor issues found. Can deploy but consider fixing for optimal performance.";
    }
  }

  /**
   * Apply automated fixes
   */
  async applyFixes() {
    console.log("🔧 Applying automated fixes...");
    
    const results = [];
    
    for (const fix of this.fixes) {
      try {
        if (fix.type === 'create_missing_tables' || fix.type === 'create_missing_functions' || fix.type === 'fix_rls_policies') {
          // For SQL fixes, we'll provide the SQL to run manually
          results.push({
            fix: fix.type,
            status: 'sql_provided',
            message: 'SQL provided for manual execution',
            sql: fix.sql
          });
        } else if (fix.type === 'create_missing_buckets') {
          // For bucket creation, provide instructions
          results.push({
            fix: fix.type,
            status: 'instructions_provided',
            message: 'Instructions provided for manual bucket creation',
            instructions: fix.instructions
          });
        }
      } catch (error) {
        results.push({
          fix: fix.type,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Test database connectivity and basic operations
   */
  async testConnectivity() {
    console.log("🌐 Testing database connectivity...");
    
    try {
      // Test 1: Basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1);

      if (connectionError) {
        return {
          success: false,
          error: `Database connection failed: ${connectionError.message}`,
          tests: []
        };
      }

      // Test 2: Auth state
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // Test 3: Basic table access
      const tests = [
        {
          name: 'Profiles Access',
          test: () => supabase.from('profiles').select('count').limit(1)
        },
        {
          name: 'Tickets Access', 
          test: () => supabase.from('tickets').select('count').limit(1)
        },
        {
          name: 'Messages Access',
          test: () => supabase.from('messages').select('count').limit(1)
        }
      ];

      const testResults = [];
      for (const test of tests) {
        try {
          const { error } = await test.test();
          testResults.push({
            name: test.name,
            success: !error,
            error: error?.message
          });
        } catch (err) {
          testResults.push({
            name: test.name,
            success: false,
            error: err.message
          });
        }
      }

      return {
        success: true,
        connected: true,
        authenticated: !!user,
        userEmail: user?.email,
        tests: testResults
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        tests: []
      };
    }
  }
}

/**
 * Quick database health check
 */
export const quickHealthCheck = async () => {
  const analyzer = new DatabaseAnalyzer();
  
  try {
    const connectivity = await analyzer.testConnectivity();
    if (!connectivity.success) {
      return {
        status: 'critical',
        message: 'Database connection failed',
        error: connectivity.error
      };
    }

    // Quick table existence check
    const criticalTables = ['profiles', 'tickets'];
    let missingTables = 0;
    
    for (const table of criticalTables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && error.message.includes('does not exist')) {
          missingTables++;
        }
      } catch (err) {
        missingTables++;
      }
    }

    if (missingTables > 0) {
      return {
        status: 'critical',
        message: `${missingTables} critical tables missing`,
        recommendation: 'Run database migrations'
      };
    }

    return {
      status: 'healthy',
      message: 'Database appears to be working correctly',
      connectivity
    };

  } catch (error) {
    return {
      status: 'error',
      message: 'Health check failed',
      error: error.message
    };
  }
};

/**
 * Export the main analyzer class and utility functions
 */
