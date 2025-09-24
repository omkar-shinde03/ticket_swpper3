
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Home, 
  Search, 
  Plus, 
  MessageSquare, 
  User,
  Bell,
  Menu,
  X,
  Settings,
  HelpCircle,
  LogOut,
  History,
  Shield,
  Star,
  CreditCard,
  TrendingUp,
  Ticket,
  Heart
} from 'lucide-react';

export const EnhancedMobileNavigation = ({ 
  user, 
  notifications = 0, 
  unreadMessages = 0,
  onLogout 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const isActive = (path) => location.pathname === path;

  // Handle scroll effect for header with improved performance
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Haptic feedback simulation for mobile
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const mainNavItems = [
    { path: '/', icon: Home, label: 'Home', key: 'home' },
    { path: '/dashboard', icon: Search, label: 'Browse', key: 'browse' },
    { path: '/sell', icon: Plus, label: 'Sell', key: 'sell' },
    { 
      path: '/messages', 
      icon: MessageSquare, 
      label: 'Chat',
      key: 'chat',
      badge: unreadMessages > 0 ? unreadMessages : null
    },
    { path: '/profile', icon: User, label: 'Profile', key: 'profile' },
  ];

  const menuItems = [
    { path: '/dashboard', icon: Search, label: 'Dashboard', description: 'View your tickets and activity' },
    { path: '/transactions', icon: History, label: 'Transactions', description: 'Payment and booking history' },
    { path: '/verification', icon: Shield, label: 'Verification', description: 'Complete your KYC process' },
    { path: '/reviews', icon: Star, label: 'Reviews', description: 'Your ratings and feedback' },
    { path: '/payments', icon: CreditCard, label: 'Payments', description: 'Manage payment methods' },
    { path: '/analytics', icon: TrendingUp, label: 'Analytics', description: 'Track your performance' },
    { path: '/settings', icon: Settings, label: 'Settings', description: 'App preferences and account' },
    { path: '/support', icon: HelpCircle, label: 'Support', description: 'Get help and contact us' },
  ];

  if (!isMobile) return null;

  return (
    <>
      {/* Enhanced Mobile Top Header */}
      <div className={`sticky top-0 bg-white/98 backdrop-blur-md border-b border-gray-200/50 z-40 transition-all duration-300 ${
        isScrolled ? 'shadow-lg shadow-black/5' : ''
      }`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                triggerHapticFeedback();
                navigate('/');
              }}
              className="p-0 h-auto font-bold text-xl text-blue-600 hover:text-blue-700 transition-colors"
            >
              TicketRescue
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Enhanced Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-2 hover:bg-blue-50 transition-colors"
              onClick={() => {
                triggerHapticFeedback();
                navigate('/notifications');
              }}
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {notifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 animate-pulse"
                >
                  {notifications > 9 ? '9+' : notifications}
                </Badge>
              )}
            </Button>

            {/* Enhanced Menu Toggle */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="p-2 hover:bg-gray-100 transition-colors"
                  onClick={triggerHapticFeedback}
                >
                  <Menu className="h-5 w-5 text-gray-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 sm:w-96">
                <div className="flex flex-col h-full">
                  {/* Enhanced User Profile Section */}
                  {user ? (
                    <div className="pb-6 border-b border-gray-200">
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="h-14 w-14 ring-2 ring-blue-100">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                            {user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-lg">
                            {user.full_name || user.email}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {user.email}
                          </p>
                          <div className="flex items-center mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-xs text-green-600 font-medium">Verified</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Quick Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-blue-600">0</p>
                          <p className="text-xs text-blue-600 font-medium">Sold</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-green-600">0</p>
                          <p className="text-xs text-green-600 font-medium">Bought</p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-yellow-600">5.0</p>
                          <p className="text-xs text-yellow-600 font-medium">Rating</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pb-6 border-b border-gray-200">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <User className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 text-lg">Welcome!</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Sign in to access all features and start trading tickets
                        </p>
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/auth');
                          }}
                        >
                          Sign In / Sign Up
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced Menu Items */}
                  <div className="flex-1 py-4 space-y-2">
                    {user ? (
                      menuItems.map((item) => {
                        const IconComponent = item.icon;
                        const active = isActive(item.path);
                        
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                              active 
                                ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                                : 'text-gray-700 hover:bg-gray-50 hover:scale-[1.02]'
                            }`}
                            onClick={() => {
                              triggerHapticFeedback();
                              setIsMenuOpen(false);
                            }}
                          >
                            <div className={`p-2 rounded-lg ${
                              active ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium">{item.label}</span>
                              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      <div className="space-y-2">
                        <Link
                          to="/browse"
                          className="flex items-center space-x-4 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="p-2 rounded-lg bg-gray-100">
                            <Search className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium">Browse Tickets</span>
                            <p className="text-xs text-gray-500 mt-0.5">Find available tickets</p>
                          </div>
                        </Link>
                        <Link
                          to="/help"
                          className="flex items-center space-x-4 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="p-2 rounded-lg bg-gray-100">
                            <HelpCircle className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium">Help & Support</span>
                            <p className="text-xs text-gray-500 mt-0.5">Get assistance</p>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  {/* Enhanced Logout Button */}
                  {user && (
                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                        onClick={() => {
                          triggerHapticFeedback();
                          setIsMenuOpen(false);
                          onLogout?.();
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-md border-t border-gray-200/50 z-40 safe-area-pb shadow-lg shadow-black/10">
        <div className="grid grid-cols-5 py-2">
          {mainNavItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-2 px-1 relative transition-all duration-200 ${
                  active 
                    ? 'text-blue-600 scale-105' 
                    : 'text-gray-600 hover:text-blue-600 hover:scale-105'
                }`}
                onClick={triggerHapticFeedback}
              >
                <div className="relative">
                  <div className={`p-2 rounded-full transition-all duration-200 ${
                    active ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 animate-pulse"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className={`text-xs font-medium mt-1 leading-none transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {item.label}
                </span>
                {active && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full animate-scale-in" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Enhanced Bottom spacing for mobile navigation */}
      <div className="h-24" />
    </>
  );
};
