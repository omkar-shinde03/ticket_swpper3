
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string|null} full_name
 * @property {string|null} phone
 * @property {string} user_type
 * @property {string} kyc_status
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
 */

export const useDashboardData = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [availableTickets, setAvailableTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user?.id) {
      // Set up real-time subscription for tickets
      const ticketsChannel = supabase
        .channel('tickets_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets'
          },
          () => {
            console.log('Ticket data changed, reloading...');
            loadAvailableTickets();
            loadUserTickets(user.id);
          }
        )
        .subscribe();

      // Set up real-time subscription for profile changes (KYC verification)
      const profileChannel = supabase
        .channel('profile_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('Profile data changed:', payload);
            if (payload.eventType === 'UPDATE') {
              // Update the profile state with the new data
              setProfile(payload.new);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(ticketsChannel);
        supabase.removeChannel(profileChannel);
      };
    }
  }, [user?.id]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Allow access even if email is not yet confirmed.
      // Buying/selling is gated separately by EmailVerificationGuard and purchase checks.

      // Check user type and redirect admins to admin dashboard
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        // If profile doesn't exist, create one
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || null,
            phone: session.user.user_metadata?.phone || null,
            user_type: session.user.user_metadata?.user_type || 'user',
            kyc_status: null
          });

        if (insertError) {
          console.error("Error creating profile:", insertError);
        } else {
          // Reload profile after creation
          const { data: newProfileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (newProfileData?.user_type === 'admin') {
            navigate("/admin");
            return;
          }
        }
      } else if (profileData?.user_type === 'admin') {
        navigate("/admin");
        return;
      }

      setUser(session.user);
      await loadUserProfile(session.user.id);
      await loadUserTickets(session.user.id);
      await loadAvailableTickets();
    } catch (error) {
      console.error("Auth check failed:", error);
      navigate("/auth");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        return;
      }

      setProfile(profileData);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadUserTickets = async (userId) => {
    try {
      // Direct query since get_user_tickets function doesn't exist
      const { data: ticketData, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading user tickets:", error);
        setTickets([]);
        return;
      }

      setTickets(ticketData || []);
    } catch (error) {
      console.error("Error loading tickets:", error);
      setTickets([]);
    }
  };

  const loadAvailableTickets = async () => {
    try {
      // Get current user to exclude their tickets
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch tickets excluding current user's tickets
      let query = supabase
        .from('tickets')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      
      // Exclude current user's tickets if user is logged in
      if (user) {
        query = query.neq('seller_id', user.id);
      }

      const { data: ticketData, error } = await query;

      if (error) {
        console.error("Error loading available tickets:", error);
        setAvailableTickets([]);
      } else {
        setAvailableTickets(ticketData || []);
      }
    } catch (error) {
      console.error("Error loading available tickets:", error);
      setAvailableTickets([]);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "See you again soon!",
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

  return {
    user,
    profile,
    tickets,
    availableTickets,
    isLoading,
    handleLogout
  };
};
