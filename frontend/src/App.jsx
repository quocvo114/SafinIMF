import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";

// import PublicPage from "./pages/Public_page.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MyReports from "./components/MyReports.jsx";
import MaintenanceDashboard from "./pages/MaintenanceDashboard.jsx";
import MaintenanceMyReports from "./components/MaintenanceMyReports.jsx";
import SignIn from "./pages/SignIn.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";


import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminUserManagement from "./pages/UserManagement.jsx";
import ReceptForm from "./pages/ReceptForm.jsx";
import ReportManagement from "./pages/Report_Management.jsx";
import IncidentManagement from "./pages/Incident_management.jsx";
import Statistics from "./pages/Statistics.jsx";
import Maintenanceteam_Management from "./pages/MaintenanceTeam_Management.jsx";

import RegisterConfirm from "./components/RegisterConfirm.jsx";
import LayoutAdmin from "./components/LayoutAdmin.jsx";
import ProtectedRoute from "./router/ProtectedRoute.jsx";
import AssignedReport from "./pages/Assigned_report.jsx";
import Info_Management from "./pages/Info_Management.jsx";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import { Toaster } from "sonner";
import ForcePasswordChange from "./components/ForcePasswordChange.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function AppContent() {
  const { user } = useAuth();
  
  return (
    <>
      <TooltipProvider>
        <Router
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            {/* Public */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="/signin" 
              element={
                GOOGLE_CLIENT_ID ? (
                  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                    <SignIn />
                  </GoogleOAuthProvider>
                ) : (
                  <SignIn />
                )
              } 
            />

            <Route path="/register" element={<Register />} />
            <Route path="/register/confirm" element={<RegisterConfirm />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Citizen */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/myreport"
              element={
                <ProtectedRoute>
                  <MyReports />
                </ProtectedRoute>
              }
            />

            {/* Maintenance */}
            <Route
              path="/maintenance/dashboard"
              element={
                <ProtectedRoute requiredRole="maintenance">
                  <MaintenanceDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/maintenance/assigned_report"
              element={
                <ProtectedRoute requiredRole="maintenance">
                  <AssignedReport />
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <LayoutAdmin />
                </ProtectedRoute>
              }
            >
              <Route path="overview" element={<AdminDashboard />} />
              <Route path="recept-form" element={<ReceptForm />} />
              <Route path="reports" element={<ReportManagement />} />
              <Route
                path="maintenanceteam"
                element={<Maintenanceteam_Management />}
              />
              <Route path="incident-types" element={<IncidentManagement />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="users" element={<AdminUserManagement />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <Toaster position="top-right" richColors />
      </TooltipProvider>
      {user?.is_first_login && <ForcePasswordChange />}
    </>
  );
}

function App() {
  const content = (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );

  return GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {content}
    </GoogleOAuthProvider>
  ) : (
    content
  );
}

export default App;
