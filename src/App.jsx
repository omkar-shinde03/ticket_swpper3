
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EnhancedErrorBoundary } from "@/components/ui/enhanced-error-boundary";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { SkipNavigation } from "@/components/accessibility/FocusManager";
import { ThemeProvider } from "@/hooks/useTheme";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import { MobileViewportManager } from "./components/mobile/MobileViewportManager";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLogin = lazy(() => import("./components/auth/AdminLogin"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const PhoneVerificationDebug = lazy(() => import("./components/debug/PhoneVerificationDebug"));
const DatabaseDebug = lazy(() => import("./pages/DatabaseDebug"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  // Monitor performance
  usePerformanceMonitoring();

  // Register service worker for PWA features
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <EnhancedErrorBoundary>
            <SecurityHeaders />
            <BrowserRouter>
              <MobileViewportManager />
              <SkipNavigation />
              <Toaster />
              <Sonner />
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                </div>
              }>
                <main id="main-content" tabIndex="-1">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin-login" element={<AdminLogin />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/debug/phone-verification" element={<PhoneVerificationDebug />} />
                    <Route path="/debug/database" element={<DatabaseDebug />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </Suspense>
            </BrowserRouter>
          </EnhancedErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
