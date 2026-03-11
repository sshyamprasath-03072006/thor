import { createBrowserRouter, Navigate } from "react-router";
import AppShell from "./layouts/AppShell";
import EnterpriseShell from "./layouts/EnterpriseShell";
import AuthLayout from "./layouts/AuthLayout";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Tourist pages
import Dashboard from "./pages/tourist/Dashboard";
import SafetyMap from "./pages/tourist/SafetyMap";
import TripPlanner from "./pages/tourist/TripPlanner";
import ActiveJourney from "./pages/tourist/ActiveJourney";
import SafetyMonitor from "./pages/tourist/SafetyMonitor";
import Concierge from "./pages/tourist/Concierge";
import GlobalChatbot from "./pages/tourist/GlobalChatbot";
import Community from "./pages/tourist/Community";
import VoiceAI from "./pages/tourist/VoiceAI";
import Emergency from "./pages/tourist/Emergency";
import Profile from "./pages/tourist/Profile";
import SettingsPage from "./pages/Settings";
import DownloadMapPage from "./pages/DownloadMapPage";
import SOSPage from "./pages/SOSPage";
import SOSSetupPage from "./pages/SOSSetupPage";

// Enterprise pages
import EnterpriseHome from './pages/enterprise/EnterpriseHome';
import CommandCenter from "./pages/enterprise/CommandCenter";
import EnterpriseTrips from "./pages/enterprise/Trips";
import TouristView from "./pages/enterprise/TouristView";
import Authority from "./pages/enterprise/Authority";
import ActivityFeed from "./pages/enterprise/ActivityFeed";

export const router = createBrowserRouter([
  // Public — Auth layout
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },

  // Protected — App shell
  {
    element: <AppShell />,
    children: [
      // Tourist mode
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/map", element: <SafetyMap /> },
      { path: "/planner", element: <TripPlanner /> },
      { path: "/planner/active", element: <ActiveJourney /> },
      { path: "/planner/navigate", element: <SafetyMonitor /> },
      { path: "/concierge", element: <Concierge /> },
      { path: "/chat", element: <GlobalChatbot /> },
      { path: "/community", element: <Community /> },
      { path: "/voice", element: <VoiceAI /> },
      { path: "/emergency", element: <Emergency /> },
      { path: "/profile", element: <Profile /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/offline-maps", element: <DownloadMapPage /> },
      { path: "/sos", element: <SOSPage /> },
      { path: "/sos-setup", element: <SOSSetupPage /> },
    ],
  },

  // Protected — Enterprise Shell (Desktop Landscape)
  {
    element: <EnterpriseShell />,
    children: [
      { path: "/enterprise", element: <EnterpriseHome /> }, // New "Home" for enterprise
      { path: "/enterprise/trip/:id", element: <CommandCenter /> }, // CommandCenter now specific to a trip
      { path: "/enterprise/trips", element: <EnterpriseTrips /> },
      { path: "/enterprise/tourist/:id", element: <TouristView /> },
      { path: "/enterprise/authority", element: <Authority /> },
      { path: "/enterprise/activity", element: <ActivityFeed /> },
    ]
  },

  // Root redirect
  { path: "/", element: <Navigate to="/login" replace /> },
]);
