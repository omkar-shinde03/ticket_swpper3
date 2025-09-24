
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bus, Train, Plane, LogOut } from "lucide-react";
import { EnhancedNotificationSystem } from "@/components/notifications/EnhancedNotificationSystem";

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string|null} full_name
 * @property {string|null} phone
 * @property {string} user_type
 * @property {string} kyc_status
 */

/**
 * @typedef {Object} DashboardHeaderProps
 * @property {Profile|null} profile
 * @property {any} user
 * @property {function} onLogout
 */

export const DashboardHeader = ({ profile, user, onLogout }) => {
  return (
    <header className="bg-card shadow-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Bus className="h-8 w-8 text-blue-600" />
              <Train className="h-8 w-8 text-green-600" />
              <Plane className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">TicketSwapper</span>
              <span className="text-xs text-muted-foreground">Bus, Train & Plane Tickets</span>
            </div>
            {profile?.user_type === 'admin' && (
              <Badge variant="destructive" className="ml-2">Admin</Badge>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <EnhancedNotificationSystem userId={user?.id} />
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name || user?.email?.split('@')[0]}!
            </span>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
