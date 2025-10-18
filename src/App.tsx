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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppTutorial } from "@/hooks/useAppTutorial";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Auth from "./pages/Auth";
import ModernDashboard from "./pages/ModernDashboard";
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

// Lazy load admin pages para reducir bundle inicial
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCreateUser = lazy(() => import("./pages/admin/AdminCreateUser"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminRoles = lazy(() => import("./pages/admin/AdminRoles"));
const AdminCoaches = lazy(() => import("./pages/admin/AdminCoaches"));
const AdminInvitations = lazy(() => import("./pages/admin/AdminInvitations"));
const AdminCatalogs = lazy(() => import("./pages/admin/AdminCatalogs"));
const AdminSeedMigrate = lazy(() => import("./pages/admin/AdminSeedMigrate"));
const AdminAudit = lazy(() => import("./pages/admin/AdminAudit"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const AdminPageLoader = () => (
  <div className="container mx-auto p-6 space-y-6">
    <Skeleton className="h-10 w-48" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppTutorial />
          <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ModernDashboard />
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
              <Route index element={
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminDashboard />
                </Suspense>
              } />
              <Route path="create-user" element={
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminCreateUser />
                </Suspense>
              } />
              <Route path="users" element={
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminUsers />
                </Suspense>
              } />
              <Route path="roles" element={
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminRoles />
                </Suspense>
              } />
              <Route path="coaches" element={
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminCoaches />
                </Suspense>
              } />
              <Route path="invitations" element={
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminInvitations />
                </Suspense>
              } />
              <Route path="catalogs" element={
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminCatalogs />
                </Suspense>
              } />
              <Route path="seed-migrate" element={
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminSeedMigrate />
                </Suspense>
              } />
              <Route path="audit" element={
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminAudit />
                </Suspense>
              } />
              <Route path="settings" element={
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminSettings />
                </Suspense>
              } />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <UpdateBanner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
