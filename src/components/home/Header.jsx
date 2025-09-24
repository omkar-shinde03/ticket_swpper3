
import { Button } from "@/components/ui/button";
import { Bus, Menu, X, User, LogOut, Search, Bell, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Simplified auth check to prevent crashes
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Auth error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Simplified auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      try {
        setUser(session?.user || null);
        setIsLoading(false);
      } catch (error) {
        console.error("Auth state change error:", error);
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error("Cleanup error:", error);
      }
    };
  }, []);

  // Handle scroll effect for mobile header
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDashboard = () => {
    navigate("/dashboard");
  };

  // Haptic feedback for mobile
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <header className={`glass-effect shadow-lg border-b border-border sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-xl' : 'bg-white/90 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200 cursor-pointer">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
              <Bus className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TicketSwapper
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {/* Navigation removed for cleaner design */}
          </nav>
          
          {/* Desktop Auth Buttons */}
          {isLoading ? (
            <div className="hidden md:flex space-x-3">
              <div className="h-10 w-20 bg-muted animate-pulse rounded-lg"></div>
              <div className="h-10 w-24 bg-muted animate-pulse rounded-lg"></div>
            </div>
          ) : user ? (
            <div className="hidden md:flex space-x-3 items-center">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleDashboard} className="hover:bg-blue-50 hover:border-blue-300">
                <User className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-red-50 hover:text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex space-x-3">
              <Link to="/auth">
                <Button variant="outline" size="lg" className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200">
                  Login
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="default" size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => {
                triggerHapticFeedback();
                setIsMenuOpen(!isMenuOpen);
              }}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-border animate-fade-in-up bg-white/95 backdrop-blur-sm rounded-b-xl shadow-lg mobile-optimized">
            <nav className="flex flex-col space-y-4">
              {/* Auth Section - Only Login and Sign Up */}
              <div className="pt-2">
                {user ? (
                  <div className="space-y-3">
                    <div className="px-4 py-2 bg-blue-50 rounded-lg">
                      <span className="text-sm text-blue-700 font-medium">
                        Welcome back, {user.email}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full h-12 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 mobile-button" 
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleDashboard();
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full h-12 border-2 border-red-300 text-red-700 hover:bg-red-50 mobile-button" 
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 px-4">
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="block">
                      <Button variant="outline" size="lg" className="w-full h-14 border-2 border-gray-300 hover:border-blue-300 text-base font-medium mobile-button">
                        Login
                      </Button>
                    </Link>
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="block">
                      <Button variant="default" size="lg" className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg text-base font-medium mobile-button">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
