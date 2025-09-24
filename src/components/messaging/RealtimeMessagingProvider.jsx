import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MessagingContext = createContext();

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within MessagingProvider");
  }
  return context;
};

export const RealtimeMessagingProvider = ({ children, currentUserId }) => {
  const [activeConversations, setActiveConversations] = useState(new Set());
  const [unreadMessages, setUnreadMessages] = useState(new Map());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUserId) return;

    // Global message notifications channel
    const notificationsChannel = supabase
      .channel('global_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        (payload) => {
          const message = payload.new;
          
          // Show notification if not in active conversation
          if (!activeConversations.has(message.ticket_id)) {
            toast({
              title: "New Message",
              description: message.content.length > 50 
                ? message.content.substring(0, 50) + "..." 
                : message.content,
            });
          }

          // Update unread count
          setUnreadMessages(prev => {
            const newMap = new Map(prev);
            const key = `${message.ticket_id}_${message.sender_id}`;
            newMap.set(key, (newMap.get(key) || 0) + 1);
            return newMap;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [currentUserId, activeConversations, toast]);

  const markConversationAsActive = (ticketId) => {
    setActiveConversations(prev => new Set(prev).add(ticketId));
  };

  const markConversationAsInactive = (ticketId) => {
    setActiveConversations(prev => {
      const newSet = new Set(prev);
      newSet.delete(ticketId);
      return newSet;
    });
  };

  const markMessagesAsRead = async (ticketId, otherUserId) => {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('ticket_id', ticketId)
        .eq('sender_id', otherUserId)
        .eq('receiver_id', currentUserId)
        .is('read_at', null);

      // Clear unread count for this conversation
      const key = `${ticketId}_${otherUserId}`;
      setUnreadMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const getTotalUnreadCount = () => {
    return Array.from(unreadMessages.values()).reduce((total, count) => total + count, 0);
  };

  const sendMessage = async (ticketId, receiverId, content, messageType = 'text') => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          ticket_id: ticketId,
          sender_id: currentUserId,
          receiver_id: receiverId,
          content: content.trim(),
          message_type: messageType
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, message: data };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error };
    }
  };

  const value = {
    activeConversations,
    unreadMessages,
    typingUsers,
    markConversationAsActive,
    markConversationAsInactive,
    markMessagesAsRead,
    getTotalUnreadCount,
    sendMessage,
    currentUserId
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};