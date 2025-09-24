import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Ban, 
  Activity, 
  Clock,
  Eye,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SecuritySystem = () => {
  const [securityEvents, setSecurityEvents] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [rateLimits, setRateLimits] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityData();
    // Set up real-time monitoring
    const interval = setInterval(checkForThreats, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      // Fetch security events
      const { data: events, error: eventsError } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsError) throw eventsError;
      setSecurityEvents(events || []);

      // Fetch blocked users
      const { data: blocked, error: blockedError } = await supabase
        .from('blocked_users')
        .select(`
          *,
          profiles!blocked_users_user_id_fkey(full_name, email)
        `);

      if (blockedError) throw blockedError;
      setBlockedUsers(blocked || []);

      // Fetch rate limit violations
      const { data: limits, error: limitsError } = await supabase
        .from('rate_limit_violations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (limitsError) throw limitsError;
      setRateLimits(limits || []);

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch security data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkForThreats = async () => {
    try {
      // Check for suspicious activity patterns
      const { data: suspiciousActivity } = await supabase
        .rpc('detect_suspicious_activity');

      if (suspiciousActivity && suspiciousActivity.length > 0) {
        setFraudAlerts(suspiciousActivity);
        
        // Log security event
        await supabase
          .from('security_logs')
          .insert({
            event_type: 'fraud_detection',
            description: `Detected ${suspiciousActivity.length} suspicious activities`,
            severity: 'high',
            metadata: { alerts: suspiciousActivity }
          });
      }
    } catch (error) {
      console.error('Error checking for threats:', error);
    }
  };

  const blockUser = async (userId, reason) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          user_id: userId,
          reason: reason,
          blocked_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      // Log security event
      await supabase
        .from('security_logs')
        .insert({
          event_type: 'user_blocked',
          user_id: userId,
          description: `User blocked: ${reason}`,
          severity: 'medium'
        });

      toast({
        title: "User Blocked",
        description: "User has been blocked successfully",
      });

      fetchSecurityData();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive"
      });
    }
  };

  const unblockUser = async (blockId) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      toast({
        title: "User Unblocked",
        description: "User has been unblocked successfully",
      });

      fetchSecurityData();
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive"
      });
    }
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      low: { variant: "outline", color: "text-green-600" },
      medium: { variant: "default", color: "text-yellow-600" },
      high: { variant: "destructive", color: "text-red-600" },
      critical: { variant: "destructive", color: "text-red-800" }
    };
    
    const config = variants[severity] || variants.low;
    return (
      <Badge variant={config.variant} className={config.color}>
        {severity?.toUpperCase()}
      </Badge>
    );
  };

  const getEventIcon = (eventType) => {
    const icons = {
      login_attempt: Activity,
      failed_login: AlertTriangle,
      user_blocked: Ban,
      fraud_detection: Shield,
      rate_limit: Clock
    };
    
    const IconComponent = icons[eventType] || Activity;
    return <IconComponent className="h-4 w-4" />;
  };

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.event_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || event.event_type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="font-semibold text-green-600">Secure</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="font-semibold">{fraudAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Blocked Users</p>
                <p className="font-semibold">{blockedUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Rate Limits</p>
                <p className="font-semibold">{rateLimits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fraud Alerts */}
      {fraudAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Fraud Alert:</strong> {fraudAlerts.length} suspicious activities detected. 
            Review immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Security Events
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSecurityData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Events</option>
              <option value="login_attempt">Login Attempts</option>
              <option value="failed_login">Failed Logins</option>
              <option value="user_blocked">User Blocks</option>
              <option value="fraud_detection">Fraud Detection</option>
              <option value="rate_limit">Rate Limits</option>
            </select>
          </div>

          {/* Events List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No security events found
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-1">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{event.event_type.replace('_', ' ').toUpperCase()}</span>
                      {getSeverityBadge(event.severity)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{event.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Blocked Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Blocked Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {blockedUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No blocked users
              </div>
            ) : (
              blockedUsers.map((block) => (
                <div key={block.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{block.profiles?.full_name}</h4>
                    <p className="text-sm text-gray-600">{block.profiles?.email}</p>
                    <p className="text-sm text-gray-500">Reason: {block.reason}</p>
                    <p className="text-xs text-gray-500">
                      Blocked: {new Date(block.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unblockUser(block.id)}
                  >
                    Unblock
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySystem;