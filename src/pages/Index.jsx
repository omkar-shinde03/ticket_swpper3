
import React from "react";
import { Header } from "@/components/home/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { QuickSearchSection } from "@/components/home/QuickSearchSection";
import { AvailableTicketsSection } from "@/components/home/AvailableTicketsSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { Footer } from "@/components/home/Footer";
import { useHomeData } from "@/hooks/useHomeData";

const Index = () => {
  const { availableTickets, isLoading } = useHomeData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <QuickSearchSection />
      <AvailableTicketsSection 
        tickets={availableTickets} 
        isLoading={isLoading}
      />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default Index;
