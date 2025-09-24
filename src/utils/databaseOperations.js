// Database Operations Utility
// Provides optimized queries and database operations

import { supabase } from "@/integrations/supabase/client";

export const DatabaseOperations = {
  // Tickets Operations
  async getAvailableTickets() {
    try {
      const { data, error } = await supabase.rpc('get_available_tickets');
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching available tickets:', error);
      return { data: null, error };
    }
  },

  async getUserTickets() {
    try {
      const { data, error } = await supabase.rpc('get_user_tickets');
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return { data: null, error };
    }
  },

  async createTicket(ticketData) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating ticket:', error);
      return { data: null, error };
    }
  },

  async updateTicketStatus(ticketId, status) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating ticket status:', error);
      return { data: null, error };
    }
  },

  // Transactions Operations
  async getUserTransactions() {
    try {
      const { data, error } = await supabase.rpc('get_user_transactions');
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return { data: null, error };
    }
  },

  async createTransaction(transactionData) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return { data: null, error };
    }
  },

  // Seller Payouts Operations
  async getPendingPayouts() {
    try {
      const { data, error } = await supabase.rpc('get_pending_payouts');
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching pending payouts:', error);
      return { data: null, error };
    }
  },

  async createSellerPayout(payoutData) {
    try {
      const { data, error } = await supabase
        .from('seller_payouts')
        .insert([payoutData])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating seller payout:', error);
      return { data: null, error };
    }
  },

  async updatePayoutStatus(payoutId, status, additionalData = {}) {
    try {
      const { data, error } = await supabase
        .from('seller_payouts')
        .update({ status, ...additionalData })
        .eq('id', payoutId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating payout status:', error);
      return { data: null, error };
    }
  },

  // KYC Operations
  async getUserKYCStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      return { data: null, error };
    }
  },

  async updateKYCStatus(userId, status) {
    const allowedStatuses = ['pending', 'verified', 'rejected', 'approved'];
    if (!userId) {
      console.error('updateKYCStatus: userId is required');
      return { data: null, error: 'User ID is required' };
    }
    if (!allowedStatuses.includes(status)) {
      console.error('updateKYCStatus: Invalid status value:', status);
      return { data: null, error: 'Invalid status value' };
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ kyc_status: status })
        .eq('id', userId)
        .select()
        .single();
      if (error) {
        console.error('Supabase error updating KYC status:', error.message, error.details);
        throw error;
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error updating KYC status:', error.message || error);
      return { data: null, error: error.message || error };
    }
  },

  async uploadKYCDocument(userId, file, documentType = 'aadhaar') {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: userId,
          document_type: documentType,
          document_url: fileName,
          verification_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error uploading KYC document:', error);
      return { data: null, error };
    }
  },

  // Video Calls Operations
  async createVideoCall(userId, adminId = null) {
    try {
      const { data, error } = await supabase
        .from('video_calls')
        .insert({
          user_id: userId,
          admin_id: adminId,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating video call:', error);
      return { data: null, error };
    }
  },

  async updateVideoCall(callId, updateData) {
    try {
      const { data, error } = await supabase
        .from('video_calls')
        .update(updateData)
        .eq('id', callId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating video call:', error);
      return { data: null, error };
    }
  },

  // Messages Operations
  async sendMessage(senderId, receiverId, ticketId, content) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          ticket_id: ticketId,
          content
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error sending message:', error);
      return { data: null, error };
    }
  },

  async getMessagesForTicket(ticketId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(full_name),
          receiver:receiver_id(full_name)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { data: null, error };
    }
  },

  async markMessageAsRead(messageId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { data: null, error };
    }
  },

  // Admin Operations
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching all users:', error);
      return { data: null, error };
    }
  },

  async getAllTickets() {
    try {
      const { data, error } = await supabase
        .from('tickets_with_seller')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching all tickets:', error);
      return { data: null, error };
    }
  },

  async getSystemStats() {
    try {
      const [usersResult, ticketsResult, transactionsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('tickets').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('id', { count: 'exact', head: true })
      ]);

      return {
        totalUsers: usersResult.count || 0,
        totalTickets: ticketsResult.count || 0,
        totalTransactions: transactionsResult.count || 0
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return {
        totalUsers: 0,
        totalTickets: 0,
        totalTransactions: 0
      };
    }
  }
};

export default DatabaseOperations;