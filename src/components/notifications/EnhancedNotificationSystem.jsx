import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendNotification } from '@/utils/notifications';
import { 
  Bell, 
  Check, 
  X, 
  Eye, 
  Trash2, 
  MessageSquare, 
  CreditCard, 
  ShoppingCart,
  UserCheck,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';

export const EnhancedNotificationSystem = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadNotifications();
      subscribeToRealTimeNotifications();
    }
  }, [userId]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToRealTimeNotifications = () => {
    const channel = supabase
      .channel(`enhanced_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show real-time toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            duration: 6000,
          });

          // Show browser notification if supported
          showBrowserNotification(newNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const showBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.type,
      });
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);

      toast({
        title: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast({
        title: 'Notification deleted',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      'ticket': ShoppingCart,
      'payment': CreditCard,
      'message': MessageSquare,
      'kyc': UserCheck,
      'general': Info,
      'success': CheckCircle,
      'warning': AlertTriangle,
      'error': AlertTriangle
    };

    const IconComponent = iconMap[type] || Info;
    return <IconComponent className="h-4 w-4" />;
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      'success': 'text-green-600',
      'warning': 'text-yellow-600',
      'error': 'text-red-600',
      'payment': 'text-blue-600',
      'ticket': 'text-purple-600',
      'message': 'text-indigo-600',
      'kyc': 'text-emerald-600',
      'general': 'text-gray-600'
    };

    return colorMap[type] || 'text-gray-600';
  };

  const getNotificationBgColor = (type, isRead) => {
    if (isRead) return 'bg-white';
    
    const bgMap = {
      'success': 'bg-green-50',
      'warning': 'bg-yellow-50',
      'error': 'bg-red-50',
      'payment': 'bg-blue-50',
      'ticket': 'bg-purple-50',
      'message': 'bg-indigo-50',
      'kyc': 'bg-emerald-50',
      'general': 'bg-gray-50'
    };

    return bgMap[type] || 'bg-blue-50';
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: 'Notifications enabled',
          description: 'You will now receive browser notifications',
        });
      }
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative hover:bg-accent"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-5"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-background rounded-lg shadow-lg border z-50 max-h-96">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="secondary">{unreadCount} new</Badge>
                  )}
                </CardTitle>
                <div className="flex space-x-2">
                  {Notification.permission !== 'granted' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={requestNotificationPermission}
                    >
                      Enable Browser Alerts
                    </Button>
                  )}
                  {unreadCount > 0 && (
                    <Button size="sm" variant="outline" onClick={markAllAsRead}>
                      <Check className="h-4 w-4 mr-1" />
                      Mark All Read
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setShowNotifications(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
                    <p>Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No notifications yet</p>
                    <p className="text-sm">You'll see important updates here</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b hover:bg-accent/50 transition-colors ${
                          getNotificationBgColor(notification.type, notification.is_read)
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`mt-1 ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-sm">
                                    {notification.title}
                                  </h4>
                                  {!notification.is_read && (
                                    <Badge variant="secondary" className="text-xs">
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(notification.created_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex space-x-1 ml-2">
                                {!notification.is_read && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteNotification(notification.id)}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Static helper functions for sending notifications
export const sendTransactionNotification = async (userId, type, ticketData, transactionData) => {
  const notifications = {
    purchase_initiated: {
      title: 'Purchase Initiated',
      message: `Payment processing for ${ticketData.bus_operator} ticket (${ticketData.from_location} → ${ticketData.to_location})`,
      type: 'payment'
    },
    purchase_completed: {
      title: 'Purchase Successful! 🎉',
      message: `You have successfully purchased ${ticketData.bus_operator} ticket for ₹${transactionData.amount}`,
      type: 'success'
    },
    purchase_failed: {
      title: 'Purchase Failed',
      message: `Payment failed for ${ticketData.bus_operator} ticket. Please try again.`,
      type: 'error'
    },
    ticket_sold: {
      title: 'Ticket Sold! 💰',
      message: `Your ${ticketData.bus_operator} ticket has been sold for ₹${transactionData.amount}`,
      type: 'success'
    }
  };

  const notification = notifications[type];
  if (notification) {
    await sendNotification(
      userId,
      notification.title,
      notification.message,
      notification.type,
      { ticketId: ticketData.id, transactionId: transactionData.id },
      true // Send email
    );
  }
};