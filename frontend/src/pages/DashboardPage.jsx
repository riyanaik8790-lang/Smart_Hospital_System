import React, { useEffect, useState } from 'react';
import { Users, UserCheck, AlertTriangle, Stethoscope, Bed, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    admittedPatients: 0,
    criticalPatients: 0,
    availableDoctors: 0,
    availableRooms: 0,
    emergencyAvailable: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/dashboard');
        if (response.ok) setStats(await response.json());
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Real-time update on hospital operations</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select className="form-control" style={{ width: 'auto', background: 'var(--surface)' }}>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
          <button className="btn btn-primary" onClick={() => navigate('/app/reports')}>
            Generate Report
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<Users />} label="Total Patients" value={stats.totalPatients} />
        <StatCard icon={<UserCheck />} label="Admitted Patients" value={stats.admittedPatients} />
        <StatCard icon={<AlertTriangle />} label="Critical Cases" value={stats.criticalPatients} variant="danger" />
        <StatCard icon={<Stethoscope />} label="Available Doctors" value={stats.availableDoctors} variant="success" />
        <StatCard icon={<Bed />} label="Available Rooms" value={stats.availableRooms} variant="success" />
        <StatCard icon={<Activity />} label="Emergency Rooms" value={stats.emergencyAvailable} variant="danger" />
      </div>
    </>
  );
};

const StatCard = ({ icon, label, value, variant = '' }) => (
  <div className={`stat-card ${variant}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  </div>
);

export default DashboardPage;
