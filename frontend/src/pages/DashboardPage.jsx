import React from 'react';
import { Activity, AlertTriangle, Bed, Stethoscope, UserCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoomData } from '../contexts/RoomDataContext';
import { useDashboardData } from '../hooks/useDashboardData';

function StatCard({ icon, label, value, variant = '' }) {
  return <div className={`stat-card ${variant}`}><div className="stat-icon">{icon}</div><div className="stat-info"><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div></div>;
}

export function DashboardOverview({ dashboardData, isLoading }) {
  const navigate = useNavigate();
  const value = (key) => (isLoading ? '—' : dashboardData[key]);

  return <div className="page-container"><div className="page-header"><div><h1 className="page-title">Dashboard Overview</h1><p className="page-subtitle">Live hospital activity</p></div><button className="btn btn-primary" onClick={() => navigate('/app/reports')}>Generate Report</button></div><div className="stats-grid"><StatCard icon={<Users />} label="Total Patients" value={value('totalPatients')} /><StatCard icon={<UserCheck />} label="Admitted Patients" value={value('admittedPatients')} /><StatCard icon={<AlertTriangle />} label="Critical Cases" value={value('criticalPatients')} variant="danger" /><StatCard icon={<Stethoscope />} label="Available Doctors" value={value('availableDoctors')} variant="success" /><StatCard icon={<Bed />} label="Available Rooms" value={value('availableRooms')} variant="success" /><StatCard icon={<Activity />} label="Emergency Rooms" value={value('emergencyAvailable')} variant="danger" /></div></div>;
}

export default function DashboardPage() {
  const { dashboardData: roomData, isLoading: isLoadingRooms } = useRoomData();
  const { dashboardData, isLoading: isLoadingDashboard } = useDashboardData(roomData);
  return <DashboardOverview dashboardData={dashboardData} isLoading={isLoadingRooms || isLoadingDashboard} />;
}
