import React, { useState, useEffect } from 'react';
import {
    Bed,
    Search,
    Filter,
    CheckCircle,
    Clock
} from 'lucide-react';
import { authFetch } from '../api/authFetch';

const ROOM_STATUSES = ['All', 'Available', 'Occupied', 'Cleaning'];

const RoomsPage = () => {
    const [rooms, setRooms] = useState([]);
    const canAddRoom = (localStorage.getItem('role') || '').toLowerCase() === 'admin';

    // NEW STATES
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('All Types');
    const [selectedStatus, setSelectedStatus] = useState('All');

    const fetchRooms = async () => {
        try {
            const res = await authFetch('/rooms');

            if (res.ok) {
                const data = await res.json();

                if (Array.isArray(data)) {
                    setRooms(data);
                }
            }
        } catch (err) {
            console.error("Error fetching rooms:", err);
        }
    };

    useEffect(() => {
        fetchRooms();

        const interval = setInterval(fetchRooms, 3000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => setSearchTerm(searchInput.trim()), 250);
        return () => window.clearTimeout(timeout);
    }, [searchInput]);

    // FILTERED ROOMS
    const filteredRooms = rooms.filter((room) => {
        const matchesQuery = (query) =>
            room.room_number
                ?.toLowerCase()
                .includes(query) ||
            room.type
                ?.toLowerCase()
                .includes(query);

        const matchesSearch = matchesQuery(searchTerm.toLowerCase());

        const matchesType =
            selectedType === 'All Types'
                ? true
                : room.type?.toLowerCase() ===
                  selectedType.toLowerCase();

        const matchesStatus = selectedStatus === 'All' ||
            room.status?.toLowerCase() === selectedStatus.toLowerCase();

        return matchesSearch && matchesType && matchesStatus;
    });

    // STATS
    const totalRooms = rooms.length;

    const availableRooms = rooms.filter(
        (room) =>
            room.status?.toLowerCase() === 'available'
    ).length;

    const occupiedRooms = rooms.filter(
        (room) =>
            room.status?.toLowerCase() === 'occupied'
    ).length;

    return (
        <>
            {/* PAGE HEADER */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        Facilities & Rooms
                    </h1>

                    <p className="page-subtitle">
                        Manage hospital room
                        availability and assignments
                    </p>
                </div>

                {canAddRoom && <div
                    style={{
                        display: 'flex',
                        gap: '8px'
                    }}
                >
                    <button
                        className="btn btn-primary"
                        style={{
                            padding: '8px 16px'
                        }}
                    >
                        Add New Room
                    </button>
                </div>}
            </div>

            {/* STATS */}
            <div className="stats-grid mb-6">
                <div className="stat-card">
                    <div className="stat-icon">
                        <Bed />
                    </div>

                    <div className="stat-info">
                        <div className="stat-label">
                            Total Rooms
                        </div>

                        <div className="stat-value">
                            {totalRooms}
                        </div>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon">
                        <CheckCircle />
                    </div>

                    <div className="stat-info">
                        <div className="stat-label">
                            Available
                        </div>

                        <div className="stat-value">
                            {availableRooms}
                        </div>
                    </div>
                </div>

                <div className="stat-card danger">
                    <div className="stat-icon">
                        <Clock />
                    </div>

                    <div className="stat-info">
                        <div className="stat-label">
                            Occupied
                        </div>

                        <div className="stat-value">
                            {occupiedRooms}
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CARD */}
            <div className="card">
                {/* SEARCH + FILTER */}
                <div
                    className="card-header"
                    style={{
                        display: 'flex',
                        gap: '16px',
                        background:
                            'var(--surface-hover)'
                    }}
                >
                    {/* SEARCH */}
                    <div
                        style={{
                            position: 'relative',
                            flex: 1
                        }}
                    >
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '10px',
                                color:
                                    'var(--text-light)'
                            }}
                        />

                        <input
                            type="text"
                            placeholder="Search by room number or type..."
                            className="form-control"
                            value={searchInput}
                            onChange={(e) =>
                                setSearchInput(
                                    e.target.value
                                )
                            }
                            style={{
                                paddingLeft: '38px',
                                width: '100%'
                            }}
                        />
                    </div>

                    {/* TYPE FILTER */}
                    <select
                        className="form-control"
                        style={{ width: '200px' }}
                        value={selectedType}
                        onChange={(e) =>
                            setSelectedType(
                                e.target.value
                            )
                        }
                    >
                        <option>All Types</option>
                        <option>General</option>
                        <option>ICU</option>
                        <option>Trauma</option>
                        <option>Cardiac</option>
                        <option>Emergency</option>
                        <option>Eye</option>
                        <option>Diabetes</option>
                        <option>Neuro</option>
                        <option>Ortho</option>
                        <option>Pediatric</option>
                        <option>Maternity</option>
                        <option>Oncology</option>
                        <option>ENT</option>
                        <option>Skin</option>
                        <option>Psychiatric</option>
                    </select>

                    {/* FILTER COUNT */}
                    <button className="btn btn-outline">
                        <Filter size={18} />
                        {filteredRooms.length} Results
                    </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 16px 16px' }}>
                    {ROOM_STATUSES.map((status) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setSelectedStatus(status)}
                            style={{
                                padding: '5px 12px', borderRadius: '20px', border: '1px solid',
                                borderColor: selectedStatus === status ? 'var(--primary)' : 'var(--border)',
                                background: selectedStatus === status ? 'var(--primary)' : 'white',
                                color: selectedStatus === status ? 'white' : 'var(--text-gray)',
                                cursor: 'pointer', fontSize: '12px', transition: '0.2s'
                            }}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {/* TABLE */}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Room Number</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredRooms.map((room) => (
                                <tr key={room.room_id}>
                                    {/* ROOM NUMBER */}
                                    <td
                                        style={{
                                            fontWeight: 500
                                        }}
                                    >
                                        <div
                                            style={{
                                                display:
                                                    'flex',
                                                alignItems:
                                                    'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Bed
                                                size={16}
                                                className="text-gray"
                                            />

                                            {
                                                room.room_number
                                            }
                                        </div>
                                    </td>

                                    {/* TYPE */}
                                    <td>{room.type}</td>

                                    {/* STATUS */}
                                    <td>
                                        <span
                                            className={`badge ${
                                                room.status?.toLowerCase() ===
                                                'available'
                                                    ? 'badge-low'
                                                    : 'badge-high'
                                            }`}
                                        >
                                            {room.status}
                                        </span>
                                    </td>

                                    {/* ACTION */}
                                    <td>
                                        <button
                                            className="btn btn-outline"
                                            style={{
                                                padding:
                                                    '6px 12px',
                                                fontSize:
                                                    '12px'
                                            }}
                                            disabled={
                                                room.status?.toLowerCase() !==
                                                'available'
                                            }
                                        >
                                            Assign Patient
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {/* EMPTY */}
                            {filteredRooms.length ===
                                0 && (
                                <tr>
                                    <td
                                        colSpan="4"
                                        style={{
                                            textAlign:
                                                'center',
                                            padding:
                                                '32px',
                                            color:
                                                'var(--text-gray)'
                                        }}
                                    >
                                        No results found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default RoomsPage;
