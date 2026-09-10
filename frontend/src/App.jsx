import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Main Pages
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PriorityQueuePage from './pages/PriorityQueuePage';
import DoctorsPage from './pages/DoctorsPage';
import RoomsPage from './pages/RoomsPage';
import EfficiencyDashboardPage from './pages/EfficiencyDashboardPage';
import Reports from './pages/Reports';

// Profile Page (CREATE THIS FILE if not already created)
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard Protected Layout */}
        <Route path="/app" element={<DashboardLayout />}>
          
          {/* Default Dashboard Redirect */}
          <Route index element={<Navigate to="/app/dashboard" replace />} />

          {/* Main Dashboard Routes */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="queue" element={<PriorityQueuePage />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="efficiency" element={<EfficiencyDashboardPage />} />
          <Route path="reports" element={<Reports />} />

          {/* NEW PROFILE ROUTE */}
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback Route for Invalid URLs */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;