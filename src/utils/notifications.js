import { supabase } from "@/integrations/supabase/client";

/**
 * Send a notification to a user
 * @param {string} userId - The user ID to send notification to
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (general, ticket, payment, kyc, message)
 * @param {object} data - Additional data for the notification
 * @param {boolean} sendEmail - Whether to send email notification
 * @param {string} emailTemplate - Email template to use
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendNotification = async (
  userId, 
  title, 
  message, 
  type = 'general', 
  data = null, 
  sendEmail = false, 
  emailTemplate = null
) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-notification', {
      body: {
        userId,
        title,
        message,
        type,
        data,
        sendEmail,
        emailTemplate
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      notification: result.notification
    };

  } catch (error) {
    console.error('Send notification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get user notifications
 * @param {number} limit - Number of notifications to fetch
 * @param {boolean} unreadOnly - Whether to fetch only unread notifications
 * @returns {Promise<{success: boolean, notifications?: array, error?: string}>}
 */
export const getUserNotifications = async (limit = 50, unreadOnly = false) => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      notifications
    };

  } catch (error) {
    console.error('Get notifications error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - The notification ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { error } = await supabase.rpc('mark_notification_read', {
      notification_id: notificationId
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };

  } catch (error) {
    console.error('Mark notification as read error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete notification
 * @param {string} notificationId - The notification ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };

  } catch (error) {
    console.error('Delete notification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Subscribe to real-time notifications
 * @param {function} onNotification - Callback function for new notifications
 * @returns {function} - Unsubscribe function
 */
export const subscribeToNotifications = (onNotification) => {
  const channel = supabase
    .channel('notifications')
    .on('broadcast', { event: 'new_notification' }, (payload) => {
      onNotification(payload);
    })
    .subscribe();

  // Also listen for database changes
  const dbChannel = supabase
    .channel('notifications_table')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, 
      (payload) => {
        onNotification({ notification: payload.new });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
    supabase.removeChannel(dbChannel);
  };
};

/**
 * Send email using the email service
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} template - Email template name
 * @param {object} templateData - Data for the template
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendEmail = async (to, subject, template = null, templateData = {}) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        template,
        templateData
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };

  } catch (error) {
    console.error('Send email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Notification type constants
export const NOTIFICATION_TYPES = {
  GENERAL: 'general',
  TICKET: 'ticket',
  PAYMENT: 'payment',
  KYC: 'kyc',
  MESSAGE: 'message'
};

// Email template constants
export const EMAIL_TEMPLATES = {
  VERIFICATION: 'verification',
  TICKET_CONFIRMATION: 'ticket_confirmation',
  KYC_APPROVED: 'kyc_approved',
  KYC_REJECTED: 'kyc_rejected'
};