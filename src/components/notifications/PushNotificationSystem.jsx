
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  BellRing, 
  MessageSquare, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Settings,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const PushNotificationSystem = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
    messages: true,
    transactions: true,
    ticketUpdates: true,
    marketing: false,
    browserNotifications: false
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    loadNotifications();
    loadNotificationSettings();
    checkNotificationPermission();
    
    // Set up real-time subscription for notifications
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          showBrowserNotification(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notification_settings')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.notification_settings) {
        setNotificationSettings(data.notification_settings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const updateNotificationSettings = async (newSettings) => {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          notification_settings: newSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setNotificationSettings(newSettings);
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    }
  };

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setIsSubscribed(permission === 'granted');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setIsSubscribed(permission === 'granted');
      
      if (permission === 'granted') {
        // Register service worker for push notifications
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
          } catch (error) {
            console.error('Service Worker registration failed:', error);
          }
        }
        
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive browser notifications.",
        });
      } else {
        toast({
          title: "Notifications Disabled",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    }
  };

  const showBrowserNotification = (notification) => {
    if (!isSubscribed || !notificationSettings.browserNotifications) return;

    const options = {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.type,
      requireInteraction: notification.priority === 'high',
      actions: [
        {
          action: 'view',
          title: 'View',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        }
      ]
    };

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(notification.title, options);
      });
    } else {
      new Notification(notification.title, options);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message': return MessageSquare;
      case 'transaction': return CreditCard;
      case 'ticket_update': return CheckCircle;
      case 'system': return AlertCircle;
      default: return Bell;
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Notification Settings</span>
          </CardTitle>
          <CardDescription>
            Manage your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Browser Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Browser Notifications</h4>
              <p className="text-sm text-gray-600">
                Receive notifications in your browser
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {!isSubscribed && (
                <Button onClick={requestNotificationPermission} size="sm">
                  Enable
                </Button>
              )}
              <Switch
                checked={notificationSettings.browserNotifications && isSubscribed}
                onCheckedChange={(checked) => 
                  updateNotificationSettings({
                    ...notificationSettings,
                    browserNotifications: checked
                  })
                }
                disabled={!isSubscribed}
              />
            </div>
          </div>

          {/* Message Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Messages</h4>
              <p className="text-sm text-gray-600">
                New messages from buyers and sellers
              </p>
            </div>
            <Switch
              checked={notificationSettings.messages}
              onCheckedChange={(checked) => 
                updateNotificationSettings({
                  ...notificationSettings,
                  messages: checked
                })
              }
            />
          </div>

          {/* Transaction Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Transactions</h4>
              <p className="text-sm text-gray-600">
                Payment confirmations and updates
              </p>
            </div>
            <Switch
              checked={notificationSettings.transactions}
              onCheckedChange={(checked) => 
                updateNotificationSettings({
                  ...notificationSettings,
                  transactions: checked
                })
              }
            />
          </div>

          {/* Ticket Updates */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Ticket Updates</h4>
              <p className="text-sm text-gray-600">
                Status changes and verification updates
              </p>
            </div>
            <Switch
              checked={notificationSettings.ticketUpdates}
              onCheckedChange={(checked) => 
                updateNotificationSettings({
                  ...notificationSettings,
                  ticketUpdates: checked
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BellRing className="h-5 w-5" />
              <span>Recent Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
            </CardTitle>
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  notifications.forEach(notif => {
                    if (!notif.read_at) markAsRead(notif.id);
                  });
                }}
              >
                Mark All Read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm">You'll see important updates here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const isUnread = !notification.read_at;
                
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                      isUnread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      isUnread ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`h-4 w-4 ${
                        isUnread ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-medium ${
                            isUnread ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {isUnread && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
