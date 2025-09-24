import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EnhancedMessagingSystem } from "./EnhancedMessagingSystem";

export const MessagesList = ({ currentUserId, onBack }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUserId) return;
    loadConversations();
  }, [currentUserId]);

  const loadConversations = async () => {
    try {
      // Get all messages for the current user (simplified query without complex joins)
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          tickets:ticket_id(
            id,
            pnr_number,
            bus_operator,
            from_location,
            to_location,
            departure_date
          )
        `)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by ticket and other user
      const conversationMap = new Map();
      
      // Get user profiles for display names
      const userIds = [...new Set(messages.flatMap(m => [m.sender_id, m.receiver_id]))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      messages.forEach(message => {
        const otherUserId = message.sender_id === currentUserId 
          ? message.receiver_id 
          : message.sender_id;
        const key = `${message.ticket_id}_${otherUserId}`;
        
        if (!conversationMap.has(key) || 
            new Date(message.created_at) > new Date(conversationMap.get(key).last_message.created_at)) {
          
          const otherUserProfile = profileMap.get(otherUserId);
            
          conversationMap.set(key, {
            id: key,
            ticket: message.tickets,
            other_user: otherUserProfile || { full_name: 'User' },
            other_user_id: otherUserId,
            last_message: message,
            unread_count: 0 // Will be calculated below
          });
        }
      });

      // Calculate unread counts
      for (let [key, conversation] of conversationMap) {
        const { data: unreadMessages, error: unreadError } = await supabase
          .from('messages')
          .select('id')
          .eq('ticket_id', conversation.ticket.id)
          .eq('sender_id', conversation.other_user_id)
          .eq('receiver_id', currentUserId)
          .is('read_at', null);

        if (!unreadError) {
          conversation.unread_count = unreadMessages?.length || 0;
        }
      }

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error loading conversations",
        description: "Failed to load your messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  if (selectedConversation) {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setSelectedConversation(null)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Messages
        </Button>
        <EnhancedMessagingSystem
          ticketId={selectedConversation.ticket.id}
          currentUserId={currentUserId}
          otherUserId={selectedConversation.other_user_id}
          otherUserName={selectedConversation.other_user.full_name || "User"}
          otherUserAvatar={null}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Messages</span>
            </CardTitle>
            <CardDescription>
              Your conversations about ticket purchases and sales
            </CardDescription>
          </div>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-4 bg-gray-200 rounded" />
                  <div className="w-1/2 h-3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground">
              Start messaging when you buy or sell tickets
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => handleConversationSelect(conversation)}
                >
                  <Avatar>
                    <AvatarFallback>
                      {conversation.other_user.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium truncate">
                          {conversation.other_user.full_name || 'User'}
                        </p>
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.last_message.created_at), { 
                          addSuffix: true 
                        })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.last_message.content}
                    </p>
                    
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">{conversation.ticket.bus_operator}</span>
                      {" • "}
                      <span>{conversation.ticket.from_location} → {conversation.ticket.to_location}</span>
                      {" • "}
                      <span>PNR: {conversation.ticket.pnr_number}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};