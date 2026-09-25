import React from 'react';
import { Activity, AlertTriangle, Bed, Stethoscope, UserCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WelcomeBanner from '../components/WelcomeBanner';
import { useRoomData } from '../contexts/RoomDataContext';
import { useDashboardData } from '../hooks/useDashboardData';

function StatCard({ icon, label, value, variant = '' }) {
  return <div className={`stat-card ${variant}`}><div className="stat-icon">{icon}</div><div className="stat-info"><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div></div>;
}

function SkeletonCard() {
  return <div className="stat-card" role="status" aria-label="Loading dashboard metric">
    <div className="animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
      <div className="bg-gray-200 h-10 w-10 rounded-full" />
      <div style={{ flex: 1 }}>
        <div className="bg-gray-200 h-4 w-24 rounded" />
        <div className="bg-gray-300 h-8 w-16 rounded mt-4" />
      </div>
    </div>
  </div>;
}

export function DashboardOverview({ dashboardData, isLoading }) {
  const navigate = useNavigate();

  return <div className="page-container"><div className="page-header"><div><h1 className="page-title">Dashboard Overview</h1><p className="page-subtitle">Live hospital activity</p></div><button className="btn btn-primary" onClick={() => navigate('/app/reports')}>Generate Report</button></div><WelcomeBanner /><div className="stats-grid">{isLoading ? Array.from({ length: 6 }, (_, index) => <SkeletonCard key={index} />) : <><StatCard icon={<Users />} label="Total Patients" value={dashboardData.totalPatients} /><StatCard icon={<UserCheck />} label="Admitted Patients" value={dashboardData.admittedPatients} /><StatCard icon={<AlertTriangle />} label="Critical Cases" value={dashboardData.criticalPatients} variant="danger" /><StatCard icon={<Stethoscope />} label="Available Doctors" value={dashboardData.availableDoctors} variant="success" /><StatCard icon={<Bed />} label="Available Rooms" value={dashboardData.availableRooms} variant="success" /><StatCard icon={<Activity />} label="Emergency Rooms" value={dashboardData.emergencyAvailable} variant="danger" /></>}</div></div>;
}

export default function DashboardPage() {
  const { dashboardData: roomData, isLoading: isLoadingRooms } = useRoomData();
  const { dashboardData, isLoading: isLoadingDashboard } = useDashboardData(roomData);
  return <DashboardOverview dashboardData={dashboardData} isLoading={isLoadingRooms || isLoadingDashboard} />;
}
