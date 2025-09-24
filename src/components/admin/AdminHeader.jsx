
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bus, LogOut, Shield } from "lucide-react";

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string|null} full_name
 * @property {string|null} phone
 * @property {string} user_type
 * @property {string} kyc_status
 */

/**
 * @typedef {Object} AdminHeaderProps
 * @property {Profile|null} profile
 * @property {any} user
 * @property {function} onLogout
 */

export const AdminHeader = ({ profile, user, onLogout }) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Bus className="h-8 w-8 text-black" />
            <span className="text-2xl font-bold text-gray-900">TicketSwapper</span>
            <Badge variant="destructive" className="ml-2 bg-black text-white">
              <Shield className="h-3 w-3 mr-1" />
              Admin Dashboard
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
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
