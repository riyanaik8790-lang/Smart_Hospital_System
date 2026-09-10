import React, { useState, useEffect } from 'react';
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

    // 🔥 AOA PERFORMANCE STATE
    const [performance, setPerformance] = useState({
        algorithm: "Priority Scheduling",
        time: 0
    });

    const fetchDashboardData = async () => {
        try {
            const start = Date.now(); // ⏱ start time

            const statsRes = await fetch('/dashboard');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            const end = Date.now(); // ⏱ end time

            setPerformance({
                algorithm: "Priority Scheduling",
                time: Math.round(end - start)
            });

        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 3000);
        return () => clearInterval(interval);
    }, []);

    // ✅ FIXED BUTTON
    const handleReport = () => {
        navigate('/app/reports');
    };

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

                    {/* 🔥 WORKING BUTTON */}
                    <button className="btn btn-primary" onClick={handleReport}>
                        Generate Report 📄
                    </button>
                </div>
            </div>

            {/* STATS */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon"><Users /></div>
                    <div className="stat-info">
                        <div className="stat-label">Total Patients</div>
                        <div className="stat-value">{stats.totalPatients}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                        <UserCheck />
                    </div>
                    <div className="stat-info">
                        <div className="stat-label">Admitted Patients</div>
                        <div className="stat-value">{stats.admittedPatients}</div>
                    </div>
                </div>

                <div className="stat-card danger">
                    <div className="stat-icon"><AlertTriangle /></div>
                    <div className="stat-info">
                        <div className="stat-label">Critical Cases</div>
                        <div className="stat-value">{stats.criticalPatients}</div>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon"><Stethoscope /></div>
                    <div className="stat-info">
                        <div className="stat-label">Available Doctors</div>
                        <div className="stat-value">{stats.availableDoctors}</div>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon"><Bed /></div>
                    <div className="stat-info">
                        <div className="stat-label">Available Rooms</div>
                        <div className="stat-value">{stats.availableRooms}</div>
                    </div>
                </div>

                <div className="stat-card danger">
                    <div className="stat-icon"><Activity /></div>
                    <div className="stat-info">
                        <div className="stat-label">Emergency Rooms</div>
                        <div className="stat-value">{stats.emergencyAvailable}</div>
                    </div>
                </div>
            </div>

            {/* 🔥 AOA PERFORMANCE PANEL */}
            <div style={{
                marginTop: "25px",
                padding: "15px",
                background: "#fff",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
                <h3>⚡ Algorithm Performance (AOA)</h3>
                <p><b>Algorithm Used:</b> {performance.algorithm}</p>
                <p><b>Execution Time:</b> {performance.time} ms</p>
                <p style={{ fontSize: "13px", color: "gray" }}>
                    Real-time system performance measurement
                </p>
            </div>
        </>
    );
};

export default DashboardPage;