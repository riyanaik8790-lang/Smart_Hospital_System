import React, { useState, useEffect } from 'react';
import { Search, Phone, Mail, Stethoscope, Star, ChevronDown, ChevronUp } from 'lucide-react';

const SPECIALTIES = [
    'All specialities',
    'cardiac', 'trauma', 'eye', 'diabetes', 'neuro',
    'ortho', 'pediatric', 'general', 'skin', 'ENT',
    'Puimonar', 'Gastro', 'Oncology', 'Urology', 'Emergency'
];

const DoctorsPage = () => {
    const [doctorsList, setDoctorsList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('All specialities');
    const [expandedId, setExpandedId] = useState(null);

    const fetchDoctors = async () => {
        try {
            const res = await fetch('/doctors');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setDoctorsList(data);
            }
        } catch (err) {
            console.error('Error fetching doctors:', err);
        }
    };

    useEffect(() => {
        fetchDoctors();
        const interval = setInterval(fetchDoctors, 5000);
        return () => clearInterval(interval);
    }, []);

    const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

    // Filter logic: letter-based search + specialty filter
    const filteredDoctors = doctorsList.filter((doctor) => {
        const q = searchTerm.toLowerCase();
        // Match name or specialty with the search query (e.g. typing 'k' matches 'Kumar')
        const matchesSearch = !q ||
            doctor.name?.toLowerCase().includes(q) ||
            doctor.specialization?.toLowerCase().includes(q);
        
        const matchesSpecialty =
            selectedSpecialty === 'All specialities' ||
            doctor.specialization?.toLowerCase() === selectedSpecialty.toLowerCase();
        
        return matchesSearch && matchesSpecialty;
    });

    const getStatusStyle = (status) => {
        if (status === 'Available') return { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e' };
        if (status === 'Busy')      return { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' };
        return { bg: '#f9fafb', color: '#6b7280', dot: '#9ca3af' };
    };

    const getInitials = (name) =>
        name ? name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'DR';

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Doctor Directory</h1>
                    <p className="page-subtitle">50 Specialist Doctors · Click arrow for contact details</p>
                </div>
            </div>

            {/* SEARCH & FILTER BAR */}
            <div className="card mb-6" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', padding: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                        <input
                            type="text"
                            placeholder="Search (e.g. 'K', 'Priya', 'Cardiac')..."
                            className="form-control"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '36px', width: '100%' }}
                        />
                    </div>

                    <select
                        className="form-control"
                        style={{ width: '200px' }}
                        value={selectedSpecialty}
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                    >
                        {SPECIALTIES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* SPECIALTY CHIPS */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                {SPECIALTIES.map((s) => (
                    <button
                        key={s}
                        onClick={() => setSelectedSpecialty(s)}
                        style={{
                            padding: '5px 12px',
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: selectedSpecialty === s ? 'var(--primary)' : 'var(--border)',
                            background: selectedSpecialty === s ? 'var(--primary)' : 'white',
                            color: selectedSpecialty === s ? 'white' : 'var(--text-gray)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            transition: '0.2s'
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* DOCTOR CARDS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {filteredDoctors.map((doctor) => {
                    const statusStyle = getStatusStyle(doctor.status);
                    const isExpanded = expandedId === doctor.doctor_id;

                    return (
                        <div key={doctor.doctor_id} className="card" style={{ padding: '16px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: 'var(--primary-light)', color: 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '14px', flexShrink: 0
                                }}>
                                    {getInitials(doctor.name)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {doctor.name}
                                    </h3>
                                    <div style={{ color: 'var(--primary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                        <Stethoscope size={12} />
                                        {doctor.specialization}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{
                                    padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                    background: statusStyle.bg, color: statusStyle.color, display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusStyle.dot }} />
                                    {doctor.status}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#f59e0b', fontSize: '12px', fontWeight: 600 }}>
                                    <Star size={12} fill="currentColor" /> 4.8
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                <button
                                    onClick={() => toggleExpand(doctor.doctor_id)}
                                    style={{
                                        width: '100%', padding: '6px', borderRadius: '6px',
                                        border: '1px solid var(--border)', background: 'white',
                                        cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                    }}
                                >
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    {isExpanded ? 'Hide Contact' : 'Show Contact'}
                                </button>

                                {isExpanded && (
                                    <div style={{ marginTop: '10px', padding: '10px', background: 'var(--bg)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <a href={`tel:${doctor.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', textDecoration: 'none', fontSize: '12px', fontWeight: 500 }}>
                                            <Phone size={14} /> {doctor.phone}
                                        </a>
                                        <a href={`mailto:${doctor.email}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', textDecoration: 'none', fontSize: '12px', fontWeight: 500 }}>
                                            <Mail size={14} /> {doctor.email}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredDoctors.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
                    No doctors found for "{searchTerm}" in {selectedSpecialty}
                </div>
            )}
        </>
    );
};

export default DoctorsPage;