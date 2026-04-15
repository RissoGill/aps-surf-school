import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
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
import AttendanceManagement from "./pages/admin/AttendanceManagement";
import ProAccountManagement from "./pages/admin/ProAccountManagement";
import RevenueManagement from "./pages/admin/RevenueManagement";
import DailyManagement from "./pages/admin/DailyManagement";
import AccountingManagement from "./pages/admin/AccountingManagement";
import AthletesList from "./pages/attendance/AthletesList";
import AttendanceRecords from "./pages/attendance/AttendanceRecords";
import UserManual from "./pages/UserManual";
import InvoiceViewer from "./pages/InvoiceViewer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const APP_VERSION = '20241210-v1';

const App = () => {
  useEffect(() => {
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      localStorage.setItem('app_version', APP_VERSION);
      if ('caches' in window && window.caches) {
        window.caches.keys().then((names) => {
          names.forEach((name) => window.caches?.delete(name));
        }).finally(() => {
          location.reload();
        });
      } else {
        location.reload();
      }
    } else if (!storedVersion) {
      localStorage.setItem('app_version', APP_VERSION);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
          <Route path="/dashboard/athlete/:id" element={<AthleteDashboard />} />
          <Route path="/dashboard/guardian" element={<GuardianDashboard />} />
          <Route path="/dashboard/administration" element={<AdministrationDashboard />} />
          
          {/* Admin Routes */}
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/athletes" element={<AthleteManagement />} />
          <Route path="/admin/payments" element={<PaymentManagement />} />
          <Route path="/admin/attendance" element={<AttendanceManagement />} />
            <Route path="/admin/pro-accounts" element={<ProAccountManagement />} />
            <Route path="/admin/revenue" element={<RevenueManagement />} />
            <Route path="/admin/daily-management" element={<DailyManagement />} />
            <Route path="/admin/accounting" element={<AccountingManagement />} />
            <Route path="/admin/revenue" element={<RevenueManagement />} />
          
          {/* Attendance Routes */}
          <Route path="/attendance/athletes" element={<AthletesList />} />
          <Route path="/attendance/records" element={<AttendanceRecords />} />
          
          {/* Invoice Viewer */}
          <Route path="/invoice-viewer" element={<InvoiceViewer />} />

          {/* User Manual */}
          <Route path="/manual" element={<UserManual />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
