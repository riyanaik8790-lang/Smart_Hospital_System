import React, { useState } from 'react';
import { Users, UserCheck, AlertTriangle, Stethoscope, Bed, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const sampleStats = {
  Today: {
    totalPatients: 48,
    admittedPatients: 19,
    criticalPatients: 4,
    availableDoctors: 35,
    availableRooms: 50,
    emergencyAvailable: 4
  },
  'This Week': {
    totalPatients: 286,
    admittedPatients: 74,
    criticalPatients: 12,
    availableDoctors: 31,
    availableRooms: 38,
    emergencyAvailable: 2
  },
  'This Month': {
    totalPatients: 1_142,
    admittedPatients: 218,
    criticalPatients: 27,
    availableDoctors: 28,
    availableRooms: 24,
    emergencyAvailable: 1
  }
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('Today');
  const stats = sampleStats[period];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Sample hospital activity for the selected period</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            className="form-control"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            style={{ width: 'auto', background: 'var(--surface)' }}
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
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
