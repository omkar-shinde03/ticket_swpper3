import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Ticket,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3,
  Download
} from 'lucide-react';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';

export const EnhancedAdminPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [reportType, setReportType] = useState('sales');
  const [reportStart, setReportStart] = useState('');
  const [reportEnd, setReportEnd] = useState('');
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  // Add loading states for each action
  const [kycLoading, setKycLoading] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState({}); // { [userId]: boolean }

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('video_calls_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'video_calls',
        filter: 'status=eq.waiting_admin',
      }, (payload) => {
        const userId = payload.new.user_id;
        toast({
          title: 'KYC Video Call Waiting',
          description: `A user is waiting for a KYC video call.`,
        });
        // Optionally, trigger a UI update or highlight
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  const loadDashboardData = async () => {
    try {
      const [analyticsData, ticketsData, usersData, transactionsData, supportData] = await Promise.all([
        supabase.from('platform_analytics').select('*').order('date', { ascending: false }).limit(1),
        supabase.from('tickets').select('*, user_profiles!seller_id(*)').order('created_at', { ascending: false }).limit(20),
        supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('enhanced_transactions').select('*, tickets(*), buyer:buyer_id(*), seller:seller_id(*)').order('created_at', { ascending: false }).limit(20),
        supabase.from('support_tickets').select('*, user_profiles(*)').order('created_at', { ascending: false }).limit(20)
      ]);

      setAnalytics(analyticsData.data?.[0]);
      setTickets(ticketsData.data || []);
      setUsers(usersData.data || []);
      setTransactions(transactionsData.data || []);
      setSupportTickets(supportData.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to log admin actions
  const logAdminAction = async (action, target_type, target_id, details = {}) => {
    try {
      const admin = supabase.auth.user();
      if (!admin) return;
      await supabase.from('audit_logs').insert([
        {
          admin_id: admin.id,
          action,
          target_type,
          target_id: String(target_id),
          details,
        },
      ]);
    } catch (e) {
      // Optionally log error
    }
  };

  // Update KYC with loading
  const updateUserKYC = async (userId, kycStatus) => {
    setKycLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_status: kycStatus })
        .eq('id', userId);
      if (error) throw error;
      await logAdminAction('KYC_UPDATE', 'user', userId, { kycStatus });
      toast({ title: 'KYC Updated', description: 'User KYC status has been updated successfully.' });
      loadDashboardData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update KYC status.', variant: 'destructive' });
    } finally {
      setKycLoading(false);
    }
  };

  // Bulk user KYC update with loading
  const bulkUpdateUserKYC = async (kycStatus) => {
    setKycLoading(true);
    if (selectedUserIds.length === 0) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_status: kycStatus })
        .in('id', selectedUserIds);
      if (error) throw error;
      await logAdminAction('BULK_KYC_UPDATE', 'users', selectedUserIds.join(','), { kycStatus });
      toast({ title: 'Bulk KYC Update', description: `${selectedUserIds.length} users KYC status updated to ${kycStatus}.` });
      setSelectedUserIds([]);
      loadDashboardData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update KYC status.', variant: 'destructive' });
    } finally {
      setKycLoading(false);
    }
  };

  // Update ticket status with loading
  const updateTicketStatus = async (ticketId, status, verification_status) => {
    setTicketLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status, verification_status })
        .eq('id', ticketId);
      if (error) throw error;
      await logAdminAction('TICKET_STATUS_UPDATE', 'ticket', ticketId, { status, verification_status });
      toast({ title: 'Ticket Updated', description: 'Ticket status has been updated successfully.' });
      loadDashboardData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update ticket status.', variant: 'destructive' });
    } finally {
      setTicketLoading(false);
    }
  };

  // Bulk ticket status update with loading
  const bulkUpdateTicketStatus = async (status, verification_status) => {
    setTicketLoading(true);
    if (selectedTicketIds.length === 0) return;
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status, verification_status })
        .in('id', selectedTicketIds);
      if (error) throw error;
      for (const ticketId of selectedTicketIds) {
        await logAdminAction('TICKET_STATUS_UPDATE', 'ticket', ticketId, { status, verification_status });
      }
      toast({ title: `Bulk Ticket Update`, description: `Status updated for selected tickets.` });
      setSelectedTicketIds([]);
      loadDashboardData();
    } catch (error) {
      toast({ title: 'Error', description: 'Bulk ticket update failed.', variant: 'destructive' });
    } finally {
      setTicketLoading(false);
    }
  };

  const fetchReport = async () => {
    setReportLoading(true);
    let data = [];
    try {
      if (reportType === 'sales') {
        const { data: sales } = await supabase
          .from('transactions')
          .select('id, amount, status, created_at, buyer_id, seller_id')
          .gte('created_at', reportStart)
          .lte('created_at', reportEnd);
        data = sales || [];
      } else if (reportType === 'user_activity') {
        const { data: logs } = await supabase
          .from('audit_logs')
          .select('id, admin_id, action, target_type, target_id, created_at')
          .gte('created_at', reportStart)
          .lte('created_at', reportEnd);
        data = logs || [];
      } else if (reportType === 'kyc_status') {
        const { data: users } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, email, kyc_status, created_at')
          .gte('created_at', reportStart)
          .lte('created_at', reportEnd);
        data = users || [];
      } else if (reportType === 'ticket_status') {
        const { data: tickets } = await supabase
          .from('tickets')
          .select('id, from_location, to_location, status, verification_status, created_at')
          .gte('created_at', reportStart)
          .lte('created_at', reportEnd);
        data = tickets || [];
      }
      setReportData(data);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to fetch report.', variant: 'destructive' });
    } finally {
      setReportLoading(false);
    }
  };

  const exportReport = (type) => {
    if (!reportData.length) return;
    let content = '';
    let filename = `report-${reportType}-${new Date().toISOString().split('T')[0]}`;
    if (type === 'csv') {
      const keys = Object.keys(reportData[0]);
      content = keys.join(',') + '\n' + reportData.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(',')).join('\n');
      filename += '.csv';
    } else {
      content = JSON.stringify(reportData, null, 2);
      filename += '.json';
    }
    const blob = new Blob([content], { type: type === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const StatsCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => (
    <Card>
      <CardContent className="flex items-center p-6">
        <div className={`p-2 rounded-lg bg-${color}-100 mr-4`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">
              <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
                {trend > 0 ? '+' : ''}{trend}%
              </span> from last month
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={analytics?.total_users || 0}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Active Tickets"
          value={analytics?.total_tickets || 0}
          icon={Ticket}
          color="green"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${analytics?.total_revenue || 0}`}
          icon={DollarSign}
          color="yellow"
        />
        <StatsCard
          title="Platform Fees"
          value={`₹${analytics?.platform_fees || 0}`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
          <TabsTrigger value="tickets">Ticket Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="support">Support Tickets</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="reports">Custom Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ticket Management Tab with Bulk Actions */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tickets</CardTitle>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => bulkUpdateTicketStatus('available', 'verified')} disabled={selectedTicketIds.length === 0 || ticketLoading}>Mark as Available & Verified</Button>
                <Button size="sm" variant="outline" onClick={() => bulkUpdateTicketStatus('sold', 'verified')} disabled={selectedTicketIds.length === 0 || ticketLoading}>Mark as Sold</Button>
                <Button size="sm" variant="outline" onClick={() => bulkUpdateTicketStatus('rejected', 'rejected')} disabled={selectedTicketIds.length === 0 || ticketLoading}>Reject</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center mb-2">
                  <input type="checkbox" checked={selectedTicketIds.length === tickets.length && tickets.length > 0} onChange={e => setSelectedTicketIds(e.target.checked ? tickets.map(t => t.id) : [])} className="mr-2" />
                  <span className="font-medium">Select All</span>
                </div>
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <input type="checkbox" checked={selectedTicketIds.includes(ticket.id)} onChange={e => setSelectedTicketIds(e.target.checked ? [...selectedTicketIds, ticket.id] : selectedTicketIds.filter(id => id !== ticket.id))} className="mr-2" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{ticket.from_location} → {ticket.to_location}</h3>
                        <Badge variant={ticket.status === 'available' ? 'default' : 'secondary'}>{ticket.status}</Badge>
                        <Badge variant={ticket.status === 'available' ? 'default' : 'secondary'}>{ticket.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">PNR: {ticket.pnr_number} • ₹{ticket.selling_price}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => updateTicketStatus(ticket.id, 'available', 'verified')} disabled={ticketLoading}><CheckCircle className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => updateTicketStatus(ticket.id, 'rejected', 'rejected')} disabled={ticketLoading}><XCircle className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
                {tickets.length === 0 && !loading && <div className="text-center text-gray-500 py-8">No tickets found.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab with Bulk Actions */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => bulkUpdateUserKYC('verified')} disabled={selectedUserIds.length === 0 || kycLoading}>Approve KYC</Button>
                <Button size="sm" variant="outline" onClick={() => bulkUpdateUserKYC('rejected')} disabled={selectedUserIds.length === 0 || kycLoading}>Reject KYC</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center mb-2">
                  <input type="checkbox" checked={selectedUserIds.length === users.length && users.length > 0} onChange={e => setSelectedUserIds(e.target.checked ? users.map(u => u.user_id) : [])} className="mr-2" />
                  <span className="font-medium">Select All</span>
                </div>
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <input type="checkbox" checked={selectedUserIds.includes(user.user_id)} onChange={e => setSelectedUserIds(e.target.checked ? [...selectedUserIds, user.user_id] : selectedUserIds.filter(id => id !== user.user_id))} className="mr-2" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{user.full_name || 'Unnamed User'}</h3>
                        <Badge variant={user.kyc_status === 'verified' ? 'default' : 'secondary'}>KYC: {user.kyc_status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">Rating: {user.rating?.toFixed(1) || '0.0'} • {user.total_transactions || 0} transactions</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => updateUserKYC(user.user_id, 'verified')} disabled={user.kyc_status === 'verified' || kycLoading}>Verify KYC</Button>
                      <Button size="sm" variant="outline" onClick={() => updateUserKYC(user.user_id, 'rejected')} disabled={kycLoading}>Reject</Button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && !loading && <div className="text-center text-gray-500 py-8">No users found.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Management Tab */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{user.full_name || 'Unnamed User'}</h3>
                        <Badge variant={user.user_type === 'admin' ? 'default' : 'secondary'}>Role: {user.user_type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">Email: {user.email}</p>
                    </div>
                    <div className="flex space-x-2">
                      <select
                        value={user.user_type}
                        onChange={async (e) => {
                          setRoleLoading((prev) => ({ ...prev, [user.user_id]: true }));
                          const newRole = e.target.value;
                          if (user.user_type === newRole) return;
                          try {
                            const { error } = await supabase
                              .from('user_profiles')
                              .update({ user_type: newRole })
                              .eq('user_id', user.user_id);
                            if (error) throw error;
                            await logAdminAction('ROLE_CHANGE', 'user', user.user_id, { from: user.user_type, to: newRole });
                            toast({ title: 'Role Updated', description: `Role changed to ${newRole} for ${user.full_name || user.email}` });
                            loadDashboardData();
                          } catch (error) {
                            toast({ title: 'Error', description: 'Failed to update role.', variant: 'destructive' });
                          } finally {
                            setRoleLoading((prev) => ({ ...prev, [user.user_id]: false }));
                          }
                        }}
                        disabled={user.email === supabase.auth.user()?.email || roleLoading[user.user_id]}
                        className="border rounded px-2 py-1"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">₹{transaction.amount}</h3>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Platform Fee: ₹{transaction.platform_fee} • 
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {transactions.length === 0 && !loading && <div className="text-center text-gray-500 py-8">No transactions found.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supportTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{ticket.subject}</h3>
                        <Badge variant={ticket.status === 'open' ? 'destructive' : 'default'}>
                          {ticket.status}
                        </Badge>
                        <Badge variant="outline">
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {ticket.description?.substring(0, 100)}...
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {supportTickets.length === 0 && !loading && <div className="text-center text-gray-500 py-8">No support tickets found.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-1">Time</th>
                      <th className="px-2 py-1">Admin</th>
                      <th className="px-2 py-1">Action</th>
                      <th className="px-2 py-1">Target</th>
                      <th className="px-2 py-1">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* auditLogs is not defined in this component, this section will be removed or commented out */}
                    {/* {auditLogs.map(log => (
                      <tr key={log.id}>
                        <td className="px-2 py-1 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-2 py-1">{log.admin?.email || log.admin_id}</td>
                        <td className="px-2 py-1">{log.action}</td>
                        <td className="px-2 py-1">{log.target_type}:{log.target_id}</td>
                        <td className="px-2 py-1"><pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre></td>
                      </tr>
                    ))} */}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Custom Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4 flex-wrap">
                <select value={reportType} onChange={e => setReportType(e.target.value)} className="border rounded px-2 py-1">
                  <option value="sales">Sales by Date</option>
                  <option value="user_activity">User Activity</option>
                  <option value="kyc_status">KYC Status</option>
                  <option value="ticket_status">Ticket Status</option>
                </select>
                <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="border rounded px-2 py-1" />
                <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="border rounded px-2 py-1" />
                <Button size="sm" variant="outline" onClick={fetchReport} disabled={reportLoading}>Generate</Button>
                <Button size="sm" variant="outline" onClick={() => exportReport('csv')} disabled={!reportData.length || reportLoading}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
                <Button size="sm" variant="outline" onClick={() => exportReport('json')} disabled={!reportData.length || reportLoading}><Download className="h-4 w-4 mr-1" />Export JSON</Button>
              </div>
              <div className="overflow-x-auto">
                {reportLoading ? <div className="flex items-center justify-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div> : reportData.length ? (
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr>
                        {Object.keys(reportData[0]).map(key => <th key={key} className="px-2 py-1">{key}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, i) => (
                        <tr key={i}>
                          {Object.keys(row).map(key => <td key={key} className="px-2 py-1 whitespace-nowrap">{String(row[key])}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div>No data.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};