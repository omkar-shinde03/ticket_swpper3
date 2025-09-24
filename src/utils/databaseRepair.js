/**
 * Database Repair Utility
 * Provides automated fixes for common database issues
 */

import { supabase } from "@/integrations/supabase/client";

export class DatabaseRepair {
  constructor() {
    this.repairLog = [];
  }

  /**
   * Attempt to repair common database issues automatically
   */
  async repairDatabase() {
    console.log("🔧 Starting database repair process...");
    this.repairLog = [];

    try {
      // Step 1: Test basic connectivity
      await this.testConnectivity();
      
      // Step 2: Repair missing profiles
      await this.repairMissingProfiles();
      
      // Step 3: Fix orphaned data
      await this.fixOrphanedData();
      
      // Step 4: Update verification statuses
      await this.updateVerificationStatuses();
      
      // Step 5: Clean up expired tokens
      await this.cleanupExpiredTokens();

      return {
        success: true,
        repairs: this.repairLog,
        message: `Completed ${this.repairLog.length} repair operations`
      };

    } catch (error) {
      console.error("❌ Database repair failed:", error);
      return {
        success: false,
        error: error.message,
        repairs: this.repairLog
      };
    }
  }

  /**
   * Test basic database connectivity
   */
  async testConnectivity() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        throw new Error(`Database connectivity issue: ${error.message}`);
      }

      this.repairLog.push({
        operation: 'connectivity_test',
        status: 'success',
        message: 'Database connectivity verified'
      });

    } catch (error) {
      this.repairLog.push({
        operation: 'connectivity_test',
        status: 'failed',
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Repair missing user profiles
   */
  async repairMissingProfiles() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        this.repairLog.push({
          operation: 'repair_profiles',
          status: 'skipped',
          message: 'User not authenticated - skipping profile repair'
        });
        return;
      }

      // Check if current user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            phone: user.user_metadata?.phone || null,
            user_type: user.user_metadata?.user_type || 'user',
            kyc_status: 'pending'
          });

        if (insertError) {
          throw new Error(`Failed to create profile: ${insertError.message}`);
        }

        this.repairLog.push({
          operation: 'repair_profiles',
          status: 'success',
          message: 'Created missing user profile'
        });
      } else if (profileError) {
        throw new Error(`Profile check failed: ${profileError.message}`);
      } else {
        this.repairLog.push({
          operation: 'repair_profiles',
          status: 'success',
          message: 'User profile exists and is accessible'
        });
      }

    } catch (error) {
      this.repairLog.push({
        operation: 'repair_profiles',
        status: 'failed',
        message: error.message
      });
    }
  }

  /**
   * Fix orphaned data (tickets without valid sellers, etc.)
   */
  async fixOrphanedData() {
    try {
      // This would require admin privileges to fix orphaned data
      // For now, we'll just detect and report
      const { data: orphanedTickets, error } = await supabase
        .from('tickets')
        .select(`
          id,
          seller_id,
          profiles!tickets_seller_id_fkey (id)
        `)
        .is('profiles.id', null)
        .limit(10);

      if (error) {
        this.repairLog.push({
          operation: 'fix_orphaned_data',
          status: 'failed',
          message: `Cannot check for orphaned data: ${error.message}`
        });
      } else if (orphanedTickets && orphanedTickets.length > 0) {
        this.repairLog.push({
          operation: 'fix_orphaned_data',
          status: 'detected',
          message: `Found ${orphanedTickets.length} orphaned tickets (requires admin intervention)`
        });
      } else {
        this.repairLog.push({
          operation: 'fix_orphaned_data',
          status: 'success',
          message: 'No orphaned data detected'
        });
      }

    } catch (error) {
      this.repairLog.push({
        operation: 'fix_orphaned_data',
        status: 'failed',
        message: error.message
      });
    }
  }

  /**
   * Update verification statuses
   */
  async updateVerificationStatuses() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        this.repairLog.push({
          operation: 'update_verification',
          status: 'skipped',
          message: 'User not authenticated'
        });
        return;
      }

      // Check and update email verification status
      if (user.email_confirmed_at) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            email_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .eq('email_verified', false);

        if (updateError) {
          this.repairLog.push({
            operation: 'update_verification',
            status: 'failed',
            message: `Failed to update email verification: ${updateError.message}`
          });
        } else {
          this.repairLog.push({
            operation: 'update_verification',
            status: 'success',
            message: 'Email verification status synchronized'
          });
        }
      }

    } catch (error) {
      this.repairLog.push({
        operation: 'update_verification',
        status: 'failed',
        message: error.message
      });
    }
  }

  /**
   * Clean up expired verification tokens
   */
  async cleanupExpiredTokens() {
    try {
      // Clean up expired email verification tokens
      const { error: emailCleanupError } = await supabase
        .from('email_verification_tokens')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (emailCleanupError) {
        this.repairLog.push({
          operation: 'cleanup_tokens',
          status: 'failed',
          message: `Email token cleanup failed: ${emailCleanupError.message}`
        });
      } else {
        this.repairLog.push({
          operation: 'cleanup_tokens',
          status: 'success',
          message: 'Expired email tokens cleaned up'
        });
      }

      // Clean up expired phone OTPs
      const { error: phoneCleanupError } = await supabase
        .from('phone_verification_otps')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (phoneCleanupError) {
        this.repairLog.push({
          operation: 'cleanup_otps',
          status: 'failed',
          message: `Phone OTP cleanup failed: ${phoneCleanupError.message}`
        });
      } else {
        this.repairLog.push({
          operation: 'cleanup_otps',
          status: 'success',
          message: 'Expired phone OTPs cleaned up'
        });
      }

    } catch (error) {
      this.repairLog.push({
        operation: 'cleanup_expired',
        status: 'failed',
        message: error.message
      });
    }
  }

  /**
   * Repair specific table issues
   */
  async repairTable(tableName) {
    try {
      switch (tableName) {
        case 'profiles':
          return await this.repairProfilesTable();
        case 'tickets':
          return await this.repairTicketsTable();
        case 'messages':
          return await this.repairMessagesTable();
        default:
          throw new Error(`Unknown table: ${tableName}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Repair profiles table issues
   */
  async repairProfilesTable() {
    const repairs = [];

    try {
      // Check if table exists
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        repairs.push({
          issue: 'table_missing',
          fix: 'Table needs to be created via migration',
          sql: 'See complete schema migration'
        });
      } else if (error) {
        repairs.push({
          issue: 'access_error',
          fix: 'Check RLS policies',
          error: error.message
        });
      } else {
        repairs.push({
          issue: 'none',
          fix: 'Table accessible and working'
        });
      }

      return {
        success: true,
        repairs
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        repairs
      };
    }
  }

  /**
   * Repair tickets table issues
   */
  async repairTicketsTable() {
    const repairs = [];

    try {
      // Test basic access
      const { data, error } = await supabase
        .from('tickets')
        .select('id, seller_id, status')
        .limit(5);

      if (error) {
        repairs.push({
          issue: 'access_error',
          fix: 'Check table existence and RLS policies',
          error: error.message
        });
      } else {
        repairs.push({
          issue: 'none',
          fix: 'Table accessible',
          recordCount: data?.length || 0
        });

        // Test join with profiles
        const { data: joinData, error: joinError } = await supabase
          .from('tickets')
          .select(`
            id,
            seller_id,
            profiles!tickets_seller_id_fkey (
              id,
              full_name
            )
          `)
          .limit(3);

        if (joinError) {
          repairs.push({
            issue: 'join_error',
            fix: 'Fix foreign key relationship with profiles table',
            error: joinError.message
          });
        } else {
          repairs.push({
            issue: 'none',
            fix: 'Tickets-Profiles join working',
            joinCount: joinData?.length || 0
          });
        }
      }

      return {
        success: true,
        repairs
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        repairs
      };
    }
  }

  /**
   * Repair messages table issues
   */
  async repairMessagesTable() {
    const repairs = [];

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        repairs.push({
          issue: 'table_missing',
          fix: 'Create messages table via migration'
        });
      } else if (error) {
        repairs.push({
          issue: 'access_error',
          fix: 'Check RLS policies for messages table',
          error: error.message
        });
      } else {
        repairs.push({
          issue: 'none',
          fix: 'Messages table accessible'
        });
      }

      return {
        success: true,
        repairs
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        repairs
      };
    }
  }
}

/**
 * Quick repair function for immediate issues
 */
export const quickRepair = async () => {
  const repair = new DatabaseRepair();
  
  try {
    // Focus on the most critical repairs
    await repair.testConnectivity();
    await repair.repairMissingProfiles();
    await repair.cleanupExpiredTokens();

    return {
      success: true,
      message: 'Quick repair completed successfully',
      log: repair.repairLog
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      log: repair.repairLog
    };
  }
};

