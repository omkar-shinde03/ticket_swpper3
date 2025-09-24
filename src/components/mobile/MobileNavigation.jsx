import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Search, 
  Plus, 
  MessageSquare, 
  User,
  Bell,
  Menu,
  X
} from 'lucide-react';

export const MobileNavigation = ({ user, notifications = 0 }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/dashboard', icon: Search, label: 'Browse' },
    { path: '/sell', icon: Plus, label: 'Sell' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40 md:hidden">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
                  active 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <div className="relative">
                  <IconComponent className="h-5 w-5" />
                  {item.label === 'Messages' && notifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center text-xs p-0"
                    >
                      {notifications > 9 ? '9+' : notifications}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Top Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-30 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-blue-600">TicketRescue</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0"
                >
                  {notifications > 9 ? '9+' : notifications}
                </Badge>
              )}
            </Button>

            {/* Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              {user ? (
                <>
                  <div className="pb-4 border-b">
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-gray-600">Welcome!</p>
                  </div>
                  
                  <Link
                    to="/dashboard"
                    className="block py-2 px-3 rounded-lg hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/transactions"
                    className="block py-2 px-3 rounded-lg hover:bg-gray-100"
                  >
                    Transaction History
                  </Link>
                  <Link
                    to="/settings"
                    className="block py-2 px-3 rounded-lg hover:bg-gray-100"
                  >
                    Settings
                  </Link>
                  <Link
                    to="/support"
                    className="block py-2 px-3 rounded-lg hover:bg-gray-100"
                  >
                    Help & Support
                  </Link>
                  
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Logout logic here
                        setIsMenuOpen(false);
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="block py-2 px-3 rounded-lg hover:bg-gray-100"
                  >
                    Login / Sign Up
                  </Link>
                  <Link
                    to="/help"
                    className="block py-2 px-3 rounded-lg hover:bg-gray-100"
                  >
                    Help
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20 md:hidden" />
    </>
  );
};