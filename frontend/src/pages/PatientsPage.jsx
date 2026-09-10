import React, { useState, useEffect } from 'react';

import { Plus, AlertTriangle, LogOut, CheckCircle, XCircle } from 'lucide-react';

const DEPARTMENTS = [
    'General', 'Cardiology', 'Neurology', 'Orthopedic', 'Emergency'

];

const PatientsPage = () => {
    const [patients, setPatients] = useState([]);
    const [formData, setFormData] = useState({
        name: '', age: '', department: 'General', heartRate: ''
    });
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(false);

    const [confirmDischargeId, setConfirmDischargeId] = useState(null);
    const [dischargingId, setDischargingId] = useState(null);


    const fetchPatients = async () => {
        try {
            const res = await fetch('/patients');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setPatients(data);
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

    const calculatePriority = (hr, dept) => {
        const rate = parseInt(hr);
        if (!hr || isNaN(rate)) return { level: 3, label: 'Low', class: 'badge-low', color: 'var(--success)' };


        if (rate < 50 || rate > 120 || dept === 'ICU' || dept === 'Cardiology' || dept === 'Emergency') {

            return { level: 1, label: 'High', class: 'badge-high', color: 'var(--danger)' };
        }

        if (rate >= 100 || dept === 'Trauma') {
            return { level: 2, label: 'Medium', class: 'badge-medium', color: '#B45309' };
        }

        return { level: 3, label: 'Low', class: 'badge-low', color: 'var(--success)' };
    };

    const currentPriority = calculatePriority(formData.heartRate, formData.department);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleRegularAdmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.age || !formData.heartRate) {
            showNotification('Please fill in all required fields properly.', 'error');
            return;
        }

        const { level, label } = calculatePriority(formData.heartRate, formData.department);

        setLoading(true);
        try {
            const res = await fetch('/add-patient', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    age: parseInt(formData.age),

                    category: formData.department,
                    priorityLevel: level,
                    priorityLabel: label

                })
            });
            const data = await res.text();
            showNotification(data, data.toLowerCase().includes('no') ? 'error' : 'success');
            if (!data.toLowerCase().includes('no')) setFormData({ name: '', age: '', department: 'General', heartRate: '' });
            fetchPatients();
        } catch (err) {
            showNotification('Failed to add patient', 'error');
        }
        setLoading(false);
    };

    const handleEmergencyAdmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/emergency-admit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name || 'Emergency Patient',
                    age: formData.age ? parseInt(formData.age) : 30
                })
            });
            const data = await res.text();
            showNotification(data, data.toLowerCase().includes('no') ? 'error' : 'success');
            if (!data.toLowerCase().includes('no')) setFormData({ name: '', age: '', department: 'General', heartRate: '' });
            fetchPatients();
        } catch (err) {
            showNotification('Failed to process emergency admit', 'error');
        }
        setLoading(false);
    };


    const handleDischargeClick = (id) => {
        // First click: show confirmation; Second click: actually discharge
        if (confirmDischargeId === id) {
            performDischarge(id);
        } else {
            setConfirmDischargeId(id);
            // Auto-cancel after 5 seconds if user doesn't confirm
            setTimeout(() => {
                setConfirmDischargeId(prev => prev === id ? null : prev);
            }, 5000);
        }
    };

    const cancelDischarge = (e) => {
        e.stopPropagation();
        setConfirmDischargeId(null);
    };

    const performDischarge = async (id) => {
        setDischargingId(id);
        setConfirmDischargeId(null);
        try {
            const res = await fetch(`/discharge/${id}`, { method: 'PUT' });
            const data = await res.text();
            if (res.ok) {
                showNotification(data, 'success');
            } else {
                showNotification(data || 'Discharge failed', 'error');
            }
            await fetchPatients();
        } catch (err) {
            console.error('Discharge error:', err);
            showNotification('Failed to discharge patient. Please try again.', 'error');
        }
        setDischargingId(null);

    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Patient Management</h1>
                    <p className="page-subtitle">Auto-triage and manage hospital patients</p>
                </div>
            </div>

            {notification && (
                <div className={`alert ${notification.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                    {notification.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                    {notification.msg}
                </div>
            )}

            {/* Add Patient form */}
            <section className="section-card">
                <div className="section-header">
                    <h2 className="section-title">Add Patient & Triage</h2>
                </div>
                <div className="section-body">
                    <form onSubmit={handleRegularAdmit}>
                        <div className="form-grid">
                            <div className="input-group">
                                <label>Patient Name *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="form-control" placeholder="E.g. John Doe" required />
                            </div>
                            <div className="input-group">
                                <label>Age *</label>
                                <input type="number" name="age" value={formData.age} onChange={handleInputChange} className="form-control" placeholder="E.g. 45" required min="0" max="120" />
                            </div>
                            <div className="input-group">
                                <label>Department *</label>
                                <select name="department" value={formData.department} onChange={handleInputChange} className="form-control">
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Heart Rate (BPM) *</label>
                                <input type="number" name="heartRate" value={formData.heartRate} onChange={handleInputChange} className="form-control" placeholder="E.g. 75" required />
                                <div className="help-text">Used for automatic priority calculation</div>
                            </div>
                        </div>

                        <div className="priority-preview" style={{ borderLeft: `4px solid ${currentPriority.color}` }}>
                            <div>
                                <div style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: 500 }}>Auto-Assigned Priority Level</div>
                                <div style={{ fontSize: '15px', color: 'var(--text-dark)', marginTop: '4px' }}>Based on current heart rate and department logic</div>
                            </div>
                            <span className={`badge ${currentPriority.class}`} style={{ fontSize: '14px', padding: '6px 16px' }}>{currentPriority.label} Priority</span>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={loading}><Plus size={18} /> Admit Patient</button>
                            <button type="button" className="btn btn-danger" onClick={handleEmergencyAdmit} disabled={loading}><AlertTriangle size={18} /> Emergency Admit</button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Live Table */}
            <section className="section-card">
                <div className="section-header">
                    <h2 className="section-title">Live Patients Table</h2>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Patient Name</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Assigned Doctor</th>
                                <th>Room Number</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.length > 0 ? patients.map((patient) => (
                                <tr key={patient.patient_id}>
                                    <td>#{patient.patient_id}</td>
                                    <td style={{ fontWeight: 500 }}>{patient.name}</td>
                                    <td>
                                        <span className={`badge ${patient.priority_label === 'High' || patient.priority_label === 'Critical' ? 'badge-high' : patient.priority_label === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                                            {patient.priority_label}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${patient.status === 'Discharged' ? 'badge-neutral' : 'badge-high'}`} style={{
                                            background: patient.status === 'Admitted' ? 'var(--primary-light)' : 'var(--surface-hover)',
                                            color: patient.status === 'Admitted' ? 'var(--primary-dark)' : 'var(--text-gray)'
                                        }}>
                                            {patient.status}
                                        </span>
                                    </td>
                                    <td>{patient.doctor_name || 'Unassigned'}</td>
                                    <td>{patient.room_number || 'Unassigned'}</td>
                                    <td>

                                        {patient.status === 'Discharged' ? (
                                            <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>Discharged ✅</span>
                                        ) : dischargingId === patient.patient_id ? (
                                            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', opacity: 0.7 }} disabled>
                                                Discharging...
                                            </button>
                                        ) : confirmDischargeId === patient.patient_id ? (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    className="btn btn-danger"
                                                    style={{ padding: '6px 10px', fontSize: '12px' }}
                                                    onClick={() => performDischarge(patient.patient_id)}
                                                >
                                                    <CheckCircle size={14} /> Confirm
                                                </button>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '6px 10px', fontSize: '12px' }}
                                                    onClick={cancelDischarge}
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                                onClick={() => handleDischargeClick(patient.patient_id)}
                                            >
                                                <LogOut size={14} style={{ marginRight: '4px' }} /> Discharge
                                            </button>
                                        )}

                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="7" className="text-center" style={{ padding: '32px', color: 'var(--text-gray)' }}>No patients currently in the system.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
};

export default PatientsPage;
