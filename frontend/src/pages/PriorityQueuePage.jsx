import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock3, Activity, Heart } from 'lucide-react';
import { authFetch } from '../api/authFetch';
import Avatar from '../components/Avatar';

const PRIORITY_CONFIG = {
    high: { label: 'High Priority', accent: 'red', icon: AlertTriangle, emptyCopy: 'No high priority patients' },
    medium: { label: 'Medium Priority', accent: 'orange', icon: Heart, emptyCopy: 'No medium priority patients' },
    low: { label: 'Low Priority', accent: 'green', icon: Activity, emptyCopy: 'No low priority patients' }
};

const PriorityColumn = ({ priority, patients }) => {
    const { label, accent, icon: Icon, emptyCopy } = PRIORITY_CONFIG[priority];

    return (
        <section className={`priority-queue-column priority-queue-column--${accent}`} aria-label={`${label} queue`}>
            <header className="priority-queue-column__header">
                <div className="priority-queue-column__title">
                    <span className="priority-queue-column__icon"><Icon size={18} aria-hidden="true" /></span>
                    <div>
                        <h2>{label}</h2>
                        <p>{accent === 'red' ? 'Immediate attention' : accent === 'orange' ? 'Needs timely review' : 'Stable and monitored'}</p>
                    </div>
                </div>
                <span className={`badge badge-${priority === 'high' ? 'high' : priority === 'medium' ? 'medium' : 'low'}`}>{patients.length}</span>
            </header>

            <div className="priority-queue-column__content">
                {patients.length > 0 ? patients.map((patient) => (
                    <article className={`priority-patient-card priority-patient-card--${accent}`} key={patient.patient_id}>
                        <div className="priority-patient-card__topline">
                            <div className="priority-patient-card__patient">
                                <Avatar name={patient.name} size="sm" />
                                <strong>{patient.name}</strong>
                            </div>
                            <span className="priority-patient-card__id">#{patient.patient_id}</span>
                        </div>
                        <dl className="priority-patient-card__details">
                            <div>
                                <dt>Assigned doctor</dt>
                                <dd>{patient.doctor_name ? <><Avatar name={patient.doctor_name} avatarUrl={patient.doctor_avatar_url} size="sm" />{patient.doctor_name}</> : 'Unassigned'}</dd>
                            </div>
                            <div>
                                <dt>Location</dt>
                                <dd>{patient.room_number ? `Room ${patient.room_number}` : 'Waiting area'}</dd>
                            </div>
                        </dl>
                    </article>
                )) : (
                    <div className="priority-queue-empty">
                        <span className="priority-queue-empty__icon"><Clock3 size={24} aria-hidden="true" /></span>
                        <strong>Queue clear</strong>
                        <p>{emptyCopy} right now.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

const PriorityQueuePage = () => {
    const [patients, setPatients] = useState([]);

    const fetchPatients = async () => {
        try {
            const res = await authFetch('/patients');
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

            <div className="priority-queue-grid">
                <PriorityColumn priority="high" patients={highQueue} />
                <PriorityColumn priority="medium" patients={mediumQueue} />
                <PriorityColumn priority="low" patients={lowQueue} />
            </div>
        </>
    );
};

export default PriorityQueuePage;
