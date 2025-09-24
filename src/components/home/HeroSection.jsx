import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const HeroSection = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleStartTrading = () => {
    if (isAuthenticated) {
      // User is logged in, navigate to dashboard
      navigate('/dashboard');
    } else {
      // User is not logged in, navigate to auth page
      navigate('/auth');
    }
  };

  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden animate-fade-in-up mobile-optimized">
      {/* Enhanced background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent-blue/5 to-accent-green/5"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent-blue/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-accent-green/10 rounded-full blur-xl animate-pulse delay-500"></div>
      
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight animate-fade-in-up mobile-heading">
              Rescue Your
              <span className="glass-gradient-text"> Last-Minute </span>
              Bus, Train & Plane Tickets
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200 mobile-text">
              Securely buy and sell bus, train, and plane tickets in emergencies. Our platform connects travelers 
              with verified tickets, ensuring safe and authentic transactions across India.
            </p>
            
            <Button 
              variant="gradient" 
              size="lg" 
              className="animate-fade-in-up delay-300 hover:scale-105 transition-transform"
              onClick={handleStartTrading}
            >
              Start Trading tickets →
            </Button>
        </div>
      </div>
    </section>
  );
};
