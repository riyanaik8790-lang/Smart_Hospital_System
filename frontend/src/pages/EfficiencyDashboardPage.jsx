import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Activity, HeartPulse, BedDouble, AlertCircle, RefreshCw, Download, LoaderCircle } from 'lucide-react';
import { authFetch } from '../api/authFetch';

// Reusable Circular Progress Component
const CircularProgress = ({ value, label, size = 120, strokeWidth = 10, colorClass = "primary" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
        <div className="circular-progress-container" style={{ width: size, height: size }}>
            <svg className="circular-progress">
                <circle
                    className="circular-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className={`circular-fill ${colorClass}`}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                />
            </svg>
            <div className="circular-text">
                {value}%
            </div>
            <div className="circular-subtext" style={{ position: 'absolute', bottom: -20 }}>
                {label}
            </div>
        </div>
    );
};

// Reusable Linear Progress Component
const LinearProgress = ({ value, label, subLabel, colorClass = "primary" }) => {
    return (
        <div className="linear-progress-container">
            <div className="linear-progress-header">
                <span>{label}</span>
                <span className={`text-${colorClass}`} style={{ fontWeight: 700 }}>{value}% {subLabel && <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>({subLabel})</span>}</span>
            </div>
            <div className="linear-bg">
                <div className={`linear-fill ${colorClass}`} style={{ width: `${value}%` }}></div>
            </div>
        </div>
    );
};

const EfficiencyDashboardPage = () => {
    const [stats, setStats] = useState({
        totalDoctors: 0,
        busyDoctors: 0,
        totalRooms: 0,
        occupiedRooms: 0,
        totalPatients: 0,
        admittedPatients: 0,
        dischargedPatients: 0,
        emergencyAdmitted: 0,
        bedOccupancyRate: 0,
        doctorUtilizationRate: 0,
        treatmentEfficiency: 0,
        criticalLoad: 0
    });

    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState('');
    const [notification, setNotification] = useState(null);

    const notify = (message, type = 'success') => {
        setNotification({ message, type });
        window.setTimeout(() => setNotification(null), 4000);
    };

    const fetchEfficiencyData = async () => {
        try {
            const res = await authFetch('/api/efficiency');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error("Error fetching efficiency stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEfficiencyData();
        const interval = setInterval(fetchEfficiencyData, 3000);
        return () => clearInterval(interval);
    }, []);

    // Get color dynamically based on rate
    const getRateColor = (rate, dangerThreshold, warningThreshold) => {
        if (rate >= dangerThreshold) return 'danger';
        if (rate >= warningThreshold) return 'warning';
        return 'success';
    };

    const healthChecks = [
        {
            name: 'Emergency Department Status',
            status: stats.criticalLoad > 20 ? 'High capacity warning' : 'Operating normally',
            detail: stats.criticalLoad > 20 ? 'Routing new emergencies may be delayed.' : 'Capable of handling new traumas.'
        },
        {
            name: 'Staffing Levels',
            status: stats.doctorUtilizationRate > 85 ? 'Staffing strain' : 'Adequate staffing',
            detail: stats.doctorUtilizationRate > 85 ? 'Medical staff are severely strained. Consider calling on-call physicians.' : 'Adequate physician availability for current patient volume.'
        },
        {
            name: 'Bed Availability',
            status: stats.bedOccupancyRate > 90 ? 'Critical bed shortage' : 'Normal availability',
            detail: stats.bedOccupancyRate > 90 ? 'Expedite discharges if clinically appropriate.' : 'Normal bed availability across all wards.'
        }
    ];

    const reportFilename = (extension) => {
        const now = new Date();
        const parts = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')];
        const time = [String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0')].join('');
        return `efficiency-report-${parts.join('-')}-${time}.${extension}`;
    };

    const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

    const exportCsv = () => {
        setExporting('csv');
        try {
            const rows = [
                ['Metric Name', 'Value', 'Percentage', 'Detail'],
                ['Bed Occupancy', `${stats.occupiedRooms}/${stats.totalRooms}`, `${stats.bedOccupancyRate}%`, 'Active beds currently in use'],
                ['Doctor Utilization', `${stats.busyDoctors}/${stats.totalDoctors}`, `${stats.doctorUtilizationRate}%`, 'Doctors currently busy'],
                ['Treatment Efficiency', `${stats.dischargedPatients} discharged`, `${stats.treatmentEfficiency}%`, `Out of ${stats.totalPatients} historically`],
                ['Inpatient Ward Capacity', `${stats.occupiedRooms}/${stats.totalRooms}`, `${stats.bedOccupancyRate}%`, 'Occupied rooms out of total rooms'],
                ['Medical Staff Bandwidth', `${stats.busyDoctors}/${stats.totalDoctors}`, `${stats.doctorUtilizationRate}%`, 'Busy doctors out of total doctors'],
                ['Critical Care Load', `${stats.emergencyAdmitted}/${stats.admittedPatients}`, `${stats.criticalLoad}%`, 'Critical emergency patients out of admitted patients'],
                ...healthChecks.map((check) => [check.name, check.status, '', check.detail]),
                ['Report Generated', new Date().toLocaleString(), '', 'Smart Hospital Efficiency Analytics']
            ];
            const blob = new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = reportFilename('csv');
            link.click();
            URL.revokeObjectURL(url);
            notify('CSV report downloaded.');
        } catch (error) {
            console.error('CSV export error:', error);
            notify('Unable to generate the CSV report.', 'error');
        } finally {
            setExporting('');
        }
    };

    const exportPdf = async () => {
        setExporting('pdf');
        try {
            const response = await authFetch('/api/reports/efficiency/pdf');
            if (!response.ok) {
                const contentType = response.headers.get('content-type') || '';
                const errorData = contentType.includes('application/json') ? await response.json() : await response.text();
                throw new Error(typeof errorData === 'object' ? errorData.message : errorData);
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = reportFilename('pdf');
            link.click();
            URL.revokeObjectURL(url);
            notify('PDF report downloaded.');
        } catch (error) {
            console.error('PDF export error:', error);
            notify(error.message || 'Unable to generate the PDF report.', 'error');
        } finally {
            setExporting('');
        }
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={28} color="var(--primary)" />
                        Hospital Efficiency Analytics
                    </h1>
                    <p className="page-subtitle">Real-time performance and utilization metrics</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {loading && <RefreshCw size={18} className="text-gray" style={{ animation: 'spin 1s linear infinite' }} />}
                    <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Auto-updating (3s)</span>
                    <button className="btn btn-outline" onClick={fetchEfficiencyData}><RefreshCw size={16} /> Refresh</button>
                    <button className="btn btn-outline" onClick={exportCsv} disabled={Boolean(exporting)}>
                        {exporting === 'csv' ? <LoaderCircle size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
                        Export CSV
                    </button>
                    <button className="btn btn-primary" onClick={exportPdf} disabled={Boolean(exporting)}>
                        {exporting === 'pdf' ? <LoaderCircle size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
                        Export PDF
                    </button>
                </div>
            </div>

            {notification && (
                <div className={`alert ${notification.type === 'error' ? 'alert-error' : 'alert-success'}`} role="status">
                    {notification.message}
                </div>
            )}

            {/* Top Level Key Metrics */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                <div className="card" style={{ display: 'flex', padding: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-gray)', fontWeight: 600, marginBottom: '8px' }}>Bed Occupancy</div>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-dark)' }}>
                            {stats.occupiedRooms} / {stats.totalRooms}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>Active beds currently in use</div>
                    </div>
                    <CircularProgress
                        value={stats.bedOccupancyRate}
                        colorClass={getRateColor(stats.bedOccupancyRate, 90, 75)}
                        size={100} strokeWidth={8}
                    />
                </div>

                <div className="card" style={{ display: 'flex', padding: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-gray)', fontWeight: 600, marginBottom: '8px' }}>Doctor Utilization</div>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-dark)' }}>
                            {stats.busyDoctors} / {stats.totalDoctors}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>Doctors currently busy</div>
                    </div>
                    <CircularProgress
                        value={stats.doctorUtilizationRate}
                        colorClass={getRateColor(stats.doctorUtilizationRate, 85, 70)}
                        size={100} strokeWidth={8}
                    />
                </div>

                <div className="card" style={{ display: 'flex', padding: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-gray)', fontWeight: 600, marginBottom: '8px' }}>Treatment Efficiency</div>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-dark)' }}>
                            {stats.dischargedPatients} <span style={{ fontSize: '18px', color: 'var(--text-gray)' }}>Discharged</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>Out of {stats.totalPatients} historically</div>
                    </div>
                    <CircularProgress
                        value={stats.treatmentEfficiency}
                        colorClass={stats.treatmentEfficiency > 60 ? 'success' : (stats.treatmentEfficiency > 40 ? 'warning' : 'danger')}
                        size={100} strokeWidth={8}
                    />
                </div>
            </div>

            {/* Detailed Analytics Rows */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                {/* Left Column */}
                <div className="card" style={{ marginBottom: 0 }}>
                    <div className="card-header">
                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={20} color="var(--primary)" />
                            Utilization Deep Dive
                        </div>
                    </div>
                    <div className="card-body">
                        <LinearProgress
                            value={stats.bedOccupancyRate}
                            label="Inpatient Ward Capacity"
                            subLabel={`${stats.occupiedRooms} occupants`}
                            colorClass={getRateColor(stats.bedOccupancyRate, 90, 75)}
                        />
                        <div style={{ marginBottom: '24px' }}></div>

                        <LinearProgress
                            value={stats.doctorUtilizationRate}
                            label="Medical Staff Bandwidth"
                            subLabel={`${stats.busyDoctors} active`}
                            colorClass={getRateColor(stats.doctorUtilizationRate, 85, 70)}
                        />
                        <div style={{ marginBottom: '24px' }}></div>

                        <LinearProgress
                            value={stats.criticalLoad}
                            label="Critical Care Load"
                            subLabel={`${stats.emergencyAdmitted} critical`}
                            colorClass={getRateColor(stats.criticalLoad, 20, 10)}
                        />
                    </div>
                </div>

                {/* Right Column */}
                <div className="card" style={{ marginBottom: 0 }}>
                    <div className="card-header">
                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HeartPulse size={20} color="var(--danger)" />
                            System Health Checks
                        </div>
                    </div>
                    <div className="card-body">

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ padding: '12px', background: stats.criticalLoad > 20 ? 'var(--danger-light)' : 'var(--success-light)', color: stats.criticalLoad > 20 ? 'var(--danger)' : 'var(--success)', borderRadius: '50%' }}>
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>Emergency Department Status</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>
                                    {stats.criticalLoad > 20 ? 'High capacity warning, routing new emergencies may be delayed.' : 'Operating normally, capable of handling new traumas.'}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ padding: '12px', background: stats.doctorUtilizationRate > 85 ? 'var(--warning-light)' : 'var(--success-light)', color: stats.doctorUtilizationRate > 85 ? 'var(--warning)' : 'var(--success)', borderRadius: '50%' }}>
                                <Users size={24} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>Staffing Levels</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>
                                    {stats.doctorUtilizationRate > 85 ? 'Medical staff severely strained. Consider calling in on-call physicians.' : 'Adequate physician availability for patient volume.'}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                            <div style={{ padding: '12px', background: stats.bedOccupancyRate > 90 ? 'var(--danger-light)' : 'var(--success-light)', color: stats.bedOccupancyRate > 90 ? 'var(--danger)' : 'var(--success)', borderRadius: '50%' }}>
                                <BedDouble size={24} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>Bed Availability</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>
                                    {stats.bedOccupancyRate > 90 ? 'Critical bed shortage. Expedite discharges if clinically appropriate.' : 'Normal bed availability across all wards.'}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </>
    );
};

export default EfficiencyDashboardPage;
