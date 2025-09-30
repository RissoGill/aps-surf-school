import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import CoachLogin from "./pages/auth/CoachLogin";
import AthleteLogin from "./pages/auth/AthleteLogin";
import GuardianLogin from "./pages/auth/GuardianLogin";
import AdministrationLogin from "./pages/auth/AdministrationLogin";
import CoachDashboard from "./pages/coach/CoachDashboard";
import AthleteDetails from "./pages/coach/AthleteDetails";
import AthleteDashboard from "./pages/athlete/AthleteDashboard";
import GuardianDashboard from "./pages/guardian/GuardianDashboard";
import AdministrationDashboard from "./pages/admin/AdministrationDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AthleteManagement from "./pages/admin/AthleteManagement";
import PaymentManagement from "./pages/admin/PaymentManagement";
import AthletesList from "./pages/attendance/AthletesList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          
          {/* Auth Routes */}
          <Route path="/login/coach" element={<CoachLogin />} />
          <Route path="/login/athlete" element={<AthleteLogin />} />
          <Route path="/login/guardian" element={<GuardianLogin />} />
          <Route path="/login/administration" element={<AdministrationLogin />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard/coach" element={<CoachDashboard />} />
          <Route path="/athlete/:id" element={<AthleteDetails />} />
          <Route path="/dashboard/athlete" element={<AthleteDashboard />} />
          <Route path="/dashboard/guardian" element={<GuardianDashboard />} />
          <Route path="/dashboard/administration" element={<AdministrationDashboard />} />
          
          {/* Admin Routes */}
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/athletes" element={<AthleteManagement />} />
          <Route path="/admin/payments" element={<PaymentManagement />} />
          
          {/* Attendance Routes */}
          <Route path="/attendance/athletes" element={<AthletesList />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
