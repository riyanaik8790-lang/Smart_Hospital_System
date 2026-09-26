import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, AlertTriangle, Bed, BedDouble, CalendarDays, HeartPulse, Stethoscope, UserCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoomData } from '../contexts/RoomDataContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { authFetch } from '../api/authFetch';
import Avatar from '../components/Avatar';

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

const today = () => new Date().toISOString().split('T')[0];
const DASHBOARD_DATE_RANGE_KEY = 'dashboardDateRange';

const readSavedDateRange = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(DASHBOARD_DATE_RANGE_KEY) || 'null');
    if (saved?.startDate && saved?.endDate && saved.startDate <= saved.endDate && saved.endDate <= today()) return saved;
  } catch { /* Ignore an invalid saved preference. */ }
  const currentDate = today();
  return { startDate: currentDate, endDate: currentDate };
};

function LinearProgress({ value, label, subLabel, colorClass = 'primary' }) {
  return <div className="linear-progress-container"><div className="linear-progress-header"><span>{label}</span><span className={`text-${colorClass}`} style={{ fontWeight: 700 }}>{value}% {subLabel && <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>({subLabel})</span>}</span></div><div className="linear-bg"><div className={`linear-fill ${colorClass}`} style={{ width: `${value}%` }} /></div></div>;
}

function CircularProgress({ value, label, size = 100, strokeWidth = 8, colorClass = 'primary' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  return <div className="circular-progress-container" style={{ width: size, height: size }}><svg className="circular-progress"><circle className="circular-bg" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} /><circle className={`circular-fill ${colorClass}`} cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} /></svg><div className="circular-text">{value}%</div><div className="circular-subtext" style={{ position: 'absolute', bottom: -20 }}>{label}</div></div>;
}

function EfficiencySkeleton() {
  return <div className="animate-pulse"><div className="stats-grid efficiency-summary-grid"><div className="card" style={{ height: 148 }} /><div className="card" style={{ height: 148 }} /><div className="card" style={{ height: 148 }} /></div><div className="efficiency-details-grid"><div className="card efficiency-card" style={{ height: 300 }} /><div className="card efficiency-card" style={{ height: 300 }} /></div></div>;
}

function EfficiencyInsights({ dateRange }) {
  const [stats, setStats] = useState({ bedOccupancyRate: 0, doctorUtilizationRate: 0, treatmentEfficiency: 0, criticalLoad: 0, occupiedRooms: 0, totalRooms: 0, busyDoctors: 0, totalDoctors: 0, dischargedPatients: 0, totalPatients: 0, emergencyAdmitted: 0 });
  const [loading, setLoading] = useState(true);
  const getRateColor = (rate, dangerThreshold, warningThreshold) => rate >= dangerThreshold ? 'danger' : rate >= warningThreshold ? 'warning' : 'success';

  useEffect(() => {
    let active = true;
    const loadInsights = async () => {
      if (active) setLoading(true);
      try {
        const response = await authFetch(`/api/efficiency?${new URLSearchParams(dateRange)}`);
        if (!response.ok) throw new Error('Unable to load efficiency insights.');
        const data = await response.json();
        if (active) setStats(data);
      } catch (error) {
        console.error('Error loading dashboard efficiency insights:', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadInsights();
    const interval = window.setInterval(loadInsights, 3000);
    return () => { active = false; window.clearInterval(interval); };
  }, [dateRange.startDate, dateRange.endDate]);

  if (loading) return <EfficiencySkeleton />;

  return <><div className="stats-grid efficiency-summary-grid">
    <div className="card" style={{ display: 'flex', padding: '24px', alignItems: 'center', justifyContent: 'space-between' }}><div><div style={{ fontSize: '14px', color: 'var(--text-gray)', fontWeight: 600, marginBottom: '8px' }}>Bed Occupancy</div><div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-dark)' }}>{stats.occupiedRooms} / {stats.totalRooms}</div><div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>Active beds currently in use</div></div><CircularProgress value={stats.bedOccupancyRate} colorClass={getRateColor(stats.bedOccupancyRate, 90, 75)} /></div>
    <div className="card" style={{ display: 'flex', padding: '24px', alignItems: 'center', justifyContent: 'space-between' }}><div><div style={{ fontSize: '14px', color: 'var(--text-gray)', fontWeight: 600, marginBottom: '8px' }}>Doctor Utilization</div><div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-dark)' }}>{stats.busyDoctors} / {stats.totalDoctors}</div><div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>Doctors currently busy</div></div><CircularProgress value={stats.doctorUtilizationRate} colorClass={getRateColor(stats.doctorUtilizationRate, 85, 70)} /></div>
    <div className="card" style={{ display: 'flex', padding: '24px', alignItems: 'center', justifyContent: 'space-between' }}><div><div style={{ fontSize: '14px', color: 'var(--text-gray)', fontWeight: 600, marginBottom: '8px' }}>Treatment Efficiency</div><div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-dark)' }}>{stats.dischargedPatients} <span style={{ fontSize: '18px', color: 'var(--text-gray)' }}>Discharged</span></div><div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>Out of {stats.totalPatients} historically</div></div><CircularProgress value={stats.treatmentEfficiency} colorClass={stats.treatmentEfficiency > 60 ? 'success' : (stats.treatmentEfficiency > 40 ? 'warning' : 'danger')} /></div>
  </div><div className="efficiency-details-grid">
    <div className="card efficiency-card" style={{ marginBottom: 0 }}>
      <div className="card-header"><div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={20} color="var(--primary)" />Utilization Deep Dive</div></div>
      <div className="card-body">
        <LinearProgress value={stats.bedOccupancyRate} label="Inpatient Ward Capacity" subLabel={`${stats.occupiedRooms} occupants`} colorClass={getRateColor(stats.bedOccupancyRate, 90, 75)} />
        <div style={{ marginBottom: '24px' }} />
        <LinearProgress value={stats.doctorUtilizationRate} label="Medical Staff Bandwidth" subLabel={`${stats.busyDoctors} active`} colorClass={getRateColor(stats.doctorUtilizationRate, 85, 70)} />
        <div style={{ marginBottom: '24px' }} />
        <LinearProgress value={stats.criticalLoad} label="Critical Care Load" subLabel={`${stats.emergencyAdmitted} critical`} colorClass={getRateColor(stats.criticalLoad, 20, 10)} />
      </div>
    </div>
    <div className="card efficiency-card" style={{ marginBottom: 0 }}>
      <div className="card-header"><div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HeartPulse size={20} color="var(--danger)" />System Health Checks</div></div>
      <div className="card-body">
        <div className="efficiency-health-check" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', marginBottom: '16px' }}><div style={{ padding: '12px', background: stats.criticalLoad > 20 ? 'var(--danger-light)' : 'var(--success-light)', color: stats.criticalLoad > 20 ? 'var(--danger)' : 'var(--success)', borderRadius: '50%' }}><AlertCircle size={24} /></div><div><div style={{ fontWeight: 600 }}>Emergency Department Status</div><div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>{stats.criticalLoad > 20 ? 'High capacity warning, routing new emergencies may be delayed.' : 'Operating normally, capable of handling new traumas.'}</div></div></div>
        <div className="efficiency-health-check" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', marginBottom: '16px' }}><div style={{ padding: '12px', background: stats.doctorUtilizationRate > 85 ? 'var(--warning-light)' : 'var(--success-light)', color: stats.doctorUtilizationRate > 85 ? 'var(--warning)' : 'var(--success)', borderRadius: '50%' }}><Users size={24} /></div><div><div style={{ fontWeight: 600 }}>Staffing Levels</div><div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>{stats.doctorUtilizationRate > 85 ? 'Medical staff severely strained. Consider calling in on-call physicians.' : 'Adequate physician availability for patient volume.'}</div></div></div>
        <div className="efficiency-health-check" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px' }}><div style={{ padding: '12px', background: stats.bedOccupancyRate > 90 ? 'var(--danger-light)' : 'var(--success-light)', color: stats.bedOccupancyRate > 90 ? 'var(--danger)' : 'var(--success)', borderRadius: '50%' }}><BedDouble size={24} /></div><div><div style={{ fontWeight: 600 }}>Bed Availability</div><div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>{stats.bedOccupancyRate > 90 ? 'Critical bed shortage. Expedite discharges if clinically appropriate.' : 'Normal bed availability across all wards.'}</div></div></div>
      </div>
    </div>
  </div></>;
}

function RecentAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadAppointments = async () => {
      try {
        const response = await authFetch('/appointments');
        if (!response.ok) throw new Error('Unable to load appointments.');
        const data = await response.json();
        const scheduled = (Array.isArray(data) ? data : []).filter((appointment) => appointment.status === 'Scheduled');
        const upcoming = scheduled.filter((appointment) => appointment.appointment_date >= today());
        if (active) setAppointments((upcoming.length ? upcoming : scheduled).slice(0, 5));
      } catch (error) {
        console.error('Error loading dashboard appointments:', error);
        if (active) setAppointments([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadAppointments();
    const interval = window.setInterval(loadAppointments, 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  return <section className="section-card dashboard-appointments">
    <div className="section-header">
      <h2 className="section-title"><CalendarDays size={20} /> Recent Appointments</h2>
    </div>
    <div className="table-container">
      <table className="table">
        <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
        <tbody>
          {loading && <tr><td colSpan="5" className="text-center">Loading appointments…</td></tr>}
          {!loading && appointments.map((appointment) => <tr key={appointment.appointment_id}>
            <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Avatar name={appointment.patient_name} size="sm" /><strong>{appointment.patient_name}</strong></div></td>
            <td>{appointment.doctor_name ? <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Avatar name={appointment.doctor_name} size="sm" />{appointment.doctor_name}</div> : 'Unassigned'}</td>
            <td>{appointment.appointment_date}</td>
            <td>{appointment.appointment_time}</td>
            <td><span className="badge badge-medium">{appointment.status}</span></td>
          </tr>)}
          {!loading && !appointments.length && <tr><td colSpan="5" className="text-center">No scheduled appointments to display.</td></tr>}
        </tbody>
      </table>
    </div>
  </section>;
}

export function DashboardOverview({ dashboardData, isLoading, dateRange, setDateRange }) {
  const navigate = useNavigate();

  return <div className="page-container"><div className="page-header"><div><h1 className="page-title">Dashboard Overview</h1><p className="page-subtitle">Live hospital activity</p></div><div className="analytics-header-actions"><div className="analytics-date-range" aria-label="Dashboard date range"><label><span>Start date</span><input type="date" className="form-control" value={dateRange.startDate} max={today()} onChange={(event) => setDateRange((current) => ({ ...current, startDate: event.target.value, endDate: event.target.value > current.endDate ? event.target.value : current.endDate }))} /></label><label><span>End date</span><input type="date" className="form-control" value={dateRange.endDate} min={dateRange.startDate} max={today()} onChange={(event) => setDateRange((current) => ({ ...current, endDate: event.target.value }))} /></label></div><button className="btn btn-primary" onClick={() => navigate('/app/reports', { state: { dateRange } })}>Generate Report</button></div></div><div className="stats-grid">{isLoading ? Array.from({ length: 6 }, (_, index) => <SkeletonCard key={index} />) : <><StatCard icon={<Users />} label="Total Patients" value={dashboardData.totalPatients} /><StatCard icon={<UserCheck />} label="Admitted Patients" value={dashboardData.admittedPatients} /><StatCard icon={<AlertTriangle />} label="Critical Cases" value={dashboardData.criticalPatients} variant="danger" /><StatCard icon={<Stethoscope />} label="Available Doctors" value={dashboardData.availableDoctors} variant="success" /><StatCard icon={<Bed />} label="Available Rooms" value={dashboardData.availableRooms} variant="success" /><StatCard icon={<Activity />} label="Emergency Rooms" value={dashboardData.emergencyAvailable} variant="danger" /></>}</div><EfficiencyInsights dateRange={dateRange} /><RecentAppointments /></div>;
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState(readSavedDateRange);
  useEffect(() => { localStorage.setItem(DASHBOARD_DATE_RANGE_KEY, JSON.stringify(dateRange)); }, [dateRange]);
  const { dashboardData: roomData, isLoading: isLoadingRooms } = useRoomData();
  const { dashboardData, isLoading: isLoadingDashboard } = useDashboardData(roomData, dateRange);
  return <DashboardOverview dashboardData={dashboardData} isLoading={isLoadingRooms || isLoadingDashboard} dateRange={dateRange} setDateRange={setDateRange} />;
}
