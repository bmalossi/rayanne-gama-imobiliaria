import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/modules/auth/hooks/useAuth";
import { HelmetProvider } from "react-helmet-async";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Listings from "./pages/Listings";
import PropertyDetail from "./pages/PropertyDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import PropertiesPage from "./pages/dashboard/PropertiesPage";
import PropertyFormPage from "./pages/dashboard/PropertyFormPage";
import LeadsPage from "./pages/dashboard/LeadsPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import UsersPage from "./pages/dashboard/UsersPage";
import ChatbotSettingsPage from "./pages/dashboard/ChatbotSettingsPage";
import LeadDistributionPage from "./pages/dashboard/LeadDistributionPage";
import { AIChatbot } from "@/components/AIChatbot";
import SetPassword from "./pages/SetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner position="top-right" richColors />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/imoveis" element={<Listings />} />
              <Route path="/imoveis/:id" element={<PropertyDetail />} />
              <Route path="/imoveis/:city/:slug" element={<PropertyDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Register />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="imoveis" element={<PropertiesPage />} />
                <Route path="imoveis/novo" element={<PropertyFormPage />} />
                <Route path="imoveis/:id/editar" element={<PropertyFormPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="perfil" element={<ProfilePage />} />
                <Route
                  path="usuarios"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="chatbot"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <ChatbotSettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="distribuicao"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <LeadDistributionPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="/index" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <AIChatbot />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);


export default App;
