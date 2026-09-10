import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Activity, Heart, ArrowRight } from 'lucide-react';

const PriorityQueuePage = () => {
    const [patients, setPatients] = useState([]);

    const fetchPatients = async () => {
        try {
            const res = await fetch('/patients');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const activePatients = data.filter(p => p.status !== 'Discharged');
                    setPatients(activePatients);
                }
            }
        } catch (err) {
            console.error("Error fetching patients:", err);
        }
    };

    useEffect(() => {
        fetchPatients();
        const interval = setInterval(fetchPatients, 3000);
        return () => clearInterval(interval);
    }, []);

    const getPriorityGroup = (label) => {
        if (label === 'Critical' || label === 'High') return 'High';
        if (label === 'Medium') return 'Medium';
        return 'Low';
    };

    const highQueue = patients.filter(p => getPriorityGroup(p.priority_label) === 'High');
    const mediumQueue = patients.filter(p => getPriorityGroup(p.priority_label) === 'Medium');
    const lowQueue = patients.filter(p => getPriorityGroup(p.priority_label) === 'Low');

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Live Priority Queue</h1>
                    <p className="page-subtitle">Real-time triage and patient queue management</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {/* High Priority Column */}
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '20px', borderTop: '4px solid var(--danger)', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={18} /> High Priority (Red)
                        </h3>
                        <span className="badge badge-high">{highQueue.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {highQueue.map(patient => (
                            <div key={patient.patient_id} style={{ background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 600 }}>{patient.name}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>#{patient.patient_id}</span>
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--danger)', fontWeight: 500, marginBottom: '12px' }}>
                                    Doctor: {patient.doctor_name || 'Unassigned'} | Room: {patient.room_number || 'Waiting'}
                                </div>
                            </div>
                        ))}
                        {highQueue.length === 0 && (
                            <div className="text-center" style={{ padding: '20px', color: 'var(--text-gray)' }}>No high priority patients.</div>
                        )}
                    </div>
                </div>

                {/* Medium Priority Column */}
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '20px', borderTop: '4px solid var(--warning)', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#B45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Heart size={18} /> Medium Priority (Orange)
                        </h3>
                        <span className="badge badge-medium">{mediumQueue.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {mediumQueue.map(patient => (
                            <div key={patient.patient_id} style={{ background: 'var(--warning-light)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 600 }}>{patient.name}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>#{patient.patient_id}</span>
                                </div>
                                <div style={{ fontSize: '14px', color: '#B45309', fontWeight: 500, marginBottom: '12px' }}>
                                    Doctor: {patient.doctor_name || 'Unassigned'} | Room: {patient.room_number || 'Waiting'}
                                </div>
                            </div>
                        ))}
                        {mediumQueue.length === 0 && (
                            <div className="text-center" style={{ padding: '20px', color: 'var(--text-gray)' }}>No medium priority patients.</div>
                        )}
                    </div>
                </div>

                {/* Low Priority Column */}
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '20px', borderTop: '4px solid var(--success)', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={18} /> Low Priority (Green)
                        </h3>
                        <span className="badge badge-low">{lowQueue.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {lowQueue.map(patient => (
                            <div key={patient.patient_id} style={{ background: 'var(--success-light)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 600 }}>{patient.name}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>#{patient.patient_id}</span>
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--success)', fontWeight: 500, marginBottom: '12px' }}>
                                    Doctor: {patient.doctor_name || 'Unassigned'} | Room: {patient.room_number || 'Waiting'}
                                </div>
                            </div>
                        ))}
                        {lowQueue.length === 0 && (
                            <div className="text-center" style={{ padding: '20px', color: 'var(--text-gray)' }}>No low priority patients.</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PriorityQueuePage;
