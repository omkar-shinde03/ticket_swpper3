import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bus } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminStats } from "@/components/admin/AdminStats";
import { UserManagement } from "@/components/admin/UserManagement";
import { TicketManagement } from "@/components/admin/TicketManagement";
import { KYCVerification } from "@/components/admin/KYCVerification";
import { VideoKYCVerification } from "@/components/admin/VideoKYCVerification";
import { DocumentsManagement } from "@/components/admin/DocumentsManagement";
import { Button } from "@/components/ui/button";

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string|null} full_name
 * @property {string|null} phone
 * @property {string} user_type
 * @property {string} kyc_status
 * @property {string} created_at
 */

/**
 * @typedef {Object} Ticket
 * @property {string} id
 * @property {string} pnr_number
 * @property {string} bus_operator
 * @property {string} departure_date
 * @property {string} departure_time
 * @property {string} from_location
 * @property {string} to_location
 * @property {string} passenger_name
 * @property {string} seat_number
 * @property {number} ticket_price
 * @property {number} selling_price
 * @property {string} status
 * @property {string} verification_status
 * @property {string} created_at
 * @property {string} seller_id
 */

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  // Initial fetch
  useEffect(() => {
    loadUsers();
    // Real-time subscription
    const usersChannel = supabase
      .channel('users_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadUsers)
      .subscribe();
    return () => {
      supabase.removeChannel(usersChannel);
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      // Set up real-time subscriptions
      const ticketsChannel = supabase
        .channel('admin_tickets_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
          loadTickets();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(ticketsChannel);
      };
    }
  }, [user?.id]);

  const checkAdminAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || profileData?.user_type !== 'admin') {
        toast({
          title: "Access denied",
          description: "Admin access required.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setUser(session.user);
      setProfile(profileData);
      await loadUsers();
      await loadTickets();
    } catch (error) {
      console.error("Admin auth check failed:", error);
      navigate("/auth");
    } finally {
      setIsLoading(false);
    }
  };

  // Update loadUsers to always fetch all users and exclude admin
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error("Error loading users:", error);
        return;
      }
      // Exclude admin from user list and count
      const filtered = (data || []).filter(u => u.user_type !== 'admin');
      setUsers(filtered);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading tickets:", error);
        return;
      }

      setTickets(data || []);
    } catch (error) {
      console.error("Error loading tickets:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "Admin session ended.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bus className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => user.user_type !== 'admin');

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader profile={profile} user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminStats users={users} tickets={tickets} />
        <Button onClick={loadUsers} className="mb-4">Refresh Users</Button>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="documents">All Documents</TabsTrigger>
            <TabsTrigger value="kyc">KYC Verification</TabsTrigger>
            <TabsTrigger value="video-kyc">Video KYC</TabsTrigger>
            <TabsTrigger value="tickets">Ticket Management</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement users={users} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsManagement />
          </TabsContent>

          <TabsContent value="kyc">
            <KYCVerification users={users} onUpdate={loadUsers} />
          </TabsContent>

          <TabsContent value="video-kyc">
            <VideoKYCVerification users={filteredUsers} onUpdate={loadUsers} />
          </TabsContent>

          <TabsContent value="tickets">
            <TicketManagement tickets={tickets} onUpdate={loadTickets} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
