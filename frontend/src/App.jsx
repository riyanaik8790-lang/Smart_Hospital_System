import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PriorityQueuePage from './pages/PriorityQueuePage';
import DoctorsPage from './pages/DoctorsPage';
import RoomsPage from './pages/RoomsPage';
import EfficiencyDashboardPage from './pages/EfficiencyDashboardPage';
import Reports from './pages/Reports';
import ProfilePage from './pages/ProfilePage';
import AppointmentsPage from './pages/AppointmentsPage';

const roleHome = {
  admin: '/app/dashboard',
  doctor: '/app/patients',
  nurse: '/app/patients',
  receptionist: '/app/patients'
};

const RequireAuth = () => (
  localStorage.getItem('token') ? <Outlet /> : <Navigate to="/login" replace />
);

const RequireRole = ({ roles, children }) => {
  const role = (localStorage.getItem('role') || '').toLowerCase();
  return roles.includes(role)
    ? children
    : <Navigate to={roleHome[role] || '/login'} replace />;
};

const RoleHome = () => {
  const role = (localStorage.getItem('role') || '').toLowerCase();
  return <Navigate to={roleHome[role] || '/login'} replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<RoleHome />} />
            <Route path="dashboard" element={<RequireRole roles={['admin']}><DashboardPage /></RequireRole>} />
            <Route path="patients" element={<RequireRole roles={['admin', 'doctor', 'nurse', 'receptionist']}><PatientsPage /></RequireRole>} />
            <Route path="queue" element={<RequireRole roles={['admin']}><PriorityQueuePage /></RequireRole>} />
            <Route path="appointments" element={<RequireRole roles={['admin', 'doctor', 'nurse', 'receptionist']}><AppointmentsPage /></RequireRole>} />
            <Route path="doctors" element={<RequireRole roles={['admin', 'doctor', 'receptionist']}><DoctorsPage /></RequireRole>} />
            <Route path="rooms" element={<RequireRole roles={['admin', 'doctor', 'nurse', 'receptionist']}><RoomsPage /></RequireRole>} />
            <Route path="efficiency" element={<RequireRole roles={['admin']}><EfficiencyDashboardPage /></RequireRole>} />
            <Route path="reports" element={<RequireRole roles={['admin']}><Reports /></RequireRole>} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
