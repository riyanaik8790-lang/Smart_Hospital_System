import React, { useState, useEffect } from 'react';
import {
    Bed,
    Search,
    Filter,
    CheckCircle,
    Clock,
    Plus,
    X
} from 'lucide-react';
import { authFetch } from '../api/authFetch';
import Avatar from '../components/Avatar';
import { useRoomData } from '../contexts/RoomDataContext';

const ROOM_STATUSES = ['All', 'Available', 'Occupied', 'Cleaning'];

const RoomsPage = () => {
    const { rooms, refreshRooms, dashboardData } = useRoomData();
    const canAddRoom = (localStorage.getItem('role') || '').toLowerCase() === 'admin';

    // NEW STATES
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('All Types');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
    const [newRoom, setNewRoom] = useState({ roomNumber: '', type: 'General' });
    const [formError, setFormError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [updatingRoomId, setUpdatingRoomId] = useState(null);

    useEffect(() => {
        const timeout = window.setTimeout(() => setSearchTerm(searchInput.trim()), 250);
        return () => window.clearTimeout(timeout);
    }, [searchInput]);

    const openAddRoom = () => {
        setNewRoom({ roomNumber: '', type: 'General' });
        setFormError('');
        setIsAddRoomOpen(true);
    };

    const addRoom = async (event) => {
        event.preventDefault();
        setFormError('');
        setIsSaving(true);

        try {
            const res = await authFetch('/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRoom)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Unable to create room.');

            setIsAddRoomOpen(false);
            await refreshRooms();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const markAvailable = async (roomId) => {
        setUpdatingRoomId(roomId);
        try {
            const res = await authFetch(`/rooms/${roomId}/mark-available`, { method: 'PATCH' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Unable to update room status.');
            await refreshRooms();
        } catch (err) {
            window.alert(err.message);
        } finally {
            setUpdatingRoomId(null);
        }
    };

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
    const { totalRooms, availableRooms, occupiedRooms } = dashboardData;

    return (
        <div className="rooms-page">
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
                        type="button"
                        onClick={openAddRoom}
                        style={{
                            padding: '8px 16px'
                        }}
                    >
                        <Plus size={16} />
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
                <div className="flex flex-col gap-5" style={{ padding: '16px' }}>
                <div
                    className="filter-bar bg-white border rounded-lg shadow-sm"
                    style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '16px',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                    }}
                >
                    {/* SEARCH */}
                    <div
                        className="filter-search"
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
                        className="form-control filter-select"
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

                <div className="room-status-tabs flex flex-wrap items-center gap-3" aria-label="Filter rooms by status">
                    {ROOM_STATUSES.map((status) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setSelectedStatus(status)}
                            aria-pressed={selectedStatus === status}
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
                </div>

                {/* TABLE */}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Room Number</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Assigned Patient</th>
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
                                                    : room.status?.toLowerCase() === 'cleaning'
                                                        ? 'badge-medium'
                                                        : 'badge-high'
                                            }`}
                                        >
                                            {room.status}
                                        </span>
                                    </td>

                                    <td>
                                        {room.patient_name ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Avatar name={room.patient_name} size="sm" />
                                                {room.patient_name}
                                            </div>
                                        ) : '—'}
                                    </td>

                                    {/* ACTION */}
                                    <td>
                                        {room.status?.toLowerCase() === 'cleaning' ? (
                                            <button
                                                className="btn btn-outline"
                                                type="button"
                                                onClick={() => markAvailable(room.room_id)}
                                                disabled={updatingRoomId === room.room_id}
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                            >
                                                {updatingRoomId === room.room_id ? 'Updating...' : 'Mark Available'}
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                                disabled={room.status?.toLowerCase() !== 'available'}
                                            >
                                                Assign Patient
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {/* EMPTY */}
                            {filteredRooms.length ===
                                0 && (
                                <tr>
                                    <td
                                        colSpan="5"
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

            {isAddRoomOpen && (
                <div role="presentation" onMouseDown={() => !isSaving && setIsAddRoomOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 16 }}>
                    <div className="card" role="dialog" aria-modal="true" aria-labelledby="add-room-title" onMouseDown={(event) => event.stopPropagation()} style={{ width: 'min(460px, 100%)', padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
                            <div>
                                <h2 id="add-room-title" style={{ margin: 0 }}>Add New Room</h2>
                                <p style={{ color: 'var(--text-gray)', margin: '6px 0 0' }}>Create an available room for patient assignments.</p>
                            </div>
                            <button type="button" aria-label="Close" onClick={() => setIsAddRoomOpen(false)} disabled={isSaving} style={{ display: 'flex', padding: 4, color: 'var(--text-gray)', background: 'transparent' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={addRoom}>
                            <div className="input-group">
                                <label htmlFor="room-number">Room number</label>
                                <input id="room-number" className="form-control" value={newRoom.roomNumber} onChange={(event) => setNewRoom({ ...newRoom, roomNumber: event.target.value })} placeholder="e.g. G-101" required autoFocus />
                            </div>
                            <div className="input-group">
                                <label htmlFor="room-type">Room type</label>
                                <select id="room-type" className="form-control" value={newRoom.type} onChange={(event) => setNewRoom({ ...newRoom, type: event.target.value })}>
                                    {['General', 'ICU', 'Trauma', 'Cardiac', 'Emergency', 'Eye', 'Diabetes', 'Neuro', 'Ortho', 'Pediatric', 'Maternity', 'Oncology', 'ENT', 'Skin', 'Psychiatric'].map((type) => <option key={type}>{type}</option>)}
                                </select>
                            </div>
                            {formError && <p style={{ color: 'var(--danger)' }} role="alert">{formError}</p>}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                                <button className="btn btn-outline" type="button" onClick={() => setIsAddRoomOpen(false)} disabled={isSaving}>Cancel</button>
                                <button className="btn btn-primary" type="submit" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create Room'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomsPage;
