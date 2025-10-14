import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UpdateBanner } from "@/components/pwa/UpdateBanner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Exercises from "./pages/Exercises";
import CoachClients from "./pages/coach/Clients";
import Workouts from "./pages/Workouts";
import TodayWorkout from "./pages/TodayWorkout";
import CreateMesocycle from "./pages/mesocycles/CreateMesocycle";
import Progress from "./pages/Progress";
import Yearly from "./pages/stats/Yearly";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import Calibration from "./pages/onboarding/Calibration";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminCoaches from "./pages/admin/AdminCoaches";
import AdminInvitations from "./pages/admin/AdminInvitations";
import AdminCatalogs from "./pages/admin/AdminCatalogs";
import AdminSeedMigrate from "./pages/admin/AdminSeedMigrate";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/exercises"
              element={
                <ProtectedRoute>
                  <Exercises />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/coach/clients"
              element={
                <ProtectedRoute allowedRoles={['coach', 'admin']}>
                  <CoachClients />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/workouts"
              element={
                <ProtectedRoute>
                  <Workouts />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/workout/today"
              element={
                <ProtectedRoute>
                  <TodayWorkout />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/mesocycles/create"
              element={
                <ProtectedRoute>
                  <CreateMesocycle />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/stats/yearly"
              element={
                <ProtectedRoute>
                  <Yearly />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/onboarding/calibration"
              element={
                <ProtectedRoute>
                  <Calibration />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminGuard>
                    <AdminLayout />
                  </AdminGuard>
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="roles" element={<AdminRoles />} />
              <Route path="coaches" element={<AdminCoaches />} />
              <Route path="invitations" element={<AdminInvitations />} />
              <Route path="catalogs" element={<AdminCatalogs />} />
              <Route path="seed-migrate" element={<AdminSeedMigrate />} />
              <Route path="audit" element={<AdminAudit />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <UpdateBanner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
