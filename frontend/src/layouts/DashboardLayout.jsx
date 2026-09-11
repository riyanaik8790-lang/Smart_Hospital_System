import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { authFetch } from '../api/authFetch';
import {
    LayoutDashboard,
    Users,
    Stethoscope,
    Bed,
    FileText,
    AlertCircle,
    Menu,
    Bell,
    LogOut,
    Activity,
    TrendingUp,
    User,
    CalendarDays,
    UserCog
} from 'lucide-react';

const readStoredText = (key, fallback) => {
    const value = localStorage.getItem(key)?.trim();
    return value && !['undefined', 'null'].includes(value.toLowerCase())
        ? value
        : fallback;
};

const formatRole = (role) => role.charAt(0).toUpperCase() + role.slice(1);

const DashboardLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [showNotif, setShowNotif] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const lastPatientIdRef = useRef(null);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const [profile, setProfile] = useState(null);
    const role = readStoredText('role', '').toLowerCase();
    const canView = (...roles) => roles.includes(role);

    const navigate = useNavigate();
    const location = useLocation();
    const hideTopbarTools = new Set([
        '/app/dashboard',
        '/app/queue',
        '/app/priority-queue',
        '/app/efficiency',
        '/app/reports'
    ]).has(location.pathname);

    const notifRef = useRef();
    const profileRef = useRef();

    // A navigation selection should never leave the mobile drawer covering its page.
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') setMobileMenuOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Avoid rendering stale strings such as "undefined" while the stored
    // identity is being read. The header uses a small placeholder until then.
    useEffect(() => {
        const name = readStoredText('userName', 'Staff');
        const storedRole = readStoredText('role', 'staff');
        setProfile({ name, role: formatRole(storedRole) });
    }, []);

    // ==========================
    // FETCH NOTIFICATIONS
    // ==========================
    const fetchNotifications = async () => {
        try {
            const res = await authFetch('/patients');
            const data = await res.json();

            if (data && data.length > 0) {
                const latest = data[0];

                if (latest.patient_id !== lastPatientIdRef.current) {
                    const newNotif = {
                        id: Date.now(),
                        text: `Patient ${latest.name} is ${latest.status}`
                    };

                    setNotifications(prev => [newNotif, ...prev.slice(0, 4)]);
                    setUnreadCount(prev => prev + 1);

                    lastPatientIdRef.current = latest.patient_id;
                }
            }
        } catch (err) {
            console.error('Notification error:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 5000);

        return () => clearInterval(interval);
    }, []);

    // ==========================
    // CLOSE DROPDOWN ON OUTSIDE CLICK
    // ==========================
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotif(false);
            }

            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfile(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ==========================
    // HELPERS
    // ==========================
    const getInitials = (name) => {
        if (!name) return 'SM';

        const parts = name.split(' ');

        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }

        return name.substring(0, 2).toUpperCase();
    };

    // ==========================
    // NAVIGATION FUNCTIONS
    // ==========================
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleReport = () => {
        navigate('/app/reports');
    };

    const handleProfile = () => {
        navigate('/app/profile');
        setShowProfile(false);
    };

    const openNotifications = () => {
        setShowNotif(!showNotif);
        setUnreadCount(0);
    };

    return (
        <div className="app-container">

            {/* SIDEBAR */}
            {mobileMenuOpen && (
                <button
                    className="sidebar-backdrop"
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
            <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div
                        style={{
                            color: 'var(--primary)',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Activity size={18} />
                        Smart Hospital Management System
                    </div>
                </div>

                <div className="nav-menu" onClick={() => setMobileMenuOpen(false)}>
                    {canView('admin') && <NavLink
                        to="/app/dashboard"
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <LayoutDashboard />
                        Dashboard
                    </NavLink>}

                    <NavLink
                        to="/app/patients"
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <Users />
                        Patients
                    </NavLink>

                    {canView('admin') && <NavLink
                        to="/app/queue"
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <AlertCircle />
                        Priority Queue
                    </NavLink>}

                    {canView('admin', 'doctor', 'nurse', 'receptionist') && <NavLink
                        to="/app/appointments"
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <CalendarDays />
                        Appointments
                    </NavLink>}

                    {canView('admin', 'doctor', 'receptionist') && <NavLink
                        to="/app/doctors"
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <Stethoscope />
                        Doctors
                    </NavLink>}

                    {canView('admin', 'doctor', 'nurse', 'receptionist') && <NavLink
                        to="/app/rooms"
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <Bed />
                        Rooms
                    </NavLink>}

                    {canView('admin') && <NavLink
                        to="/app/users"
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <UserCog />
                        User Management
                    </NavLink>}

                    {canView('admin') && <NavLink
                        to="/app/efficiency"
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <TrendingUp />
                        Efficiency
                    </NavLink>}

                    {canView('admin') && <div
                        className="nav-item"
                            onClick={() => {
                                handleReport();
                                setMobileMenuOpen(false);
                            }}
                        style={{ cursor: 'pointer' }}
                    >
                        <FileText />
                        Reports
                    </div>}
                </div>

                <div
                    style={{
                        padding: '20px',
                        borderTop: '1px solid var(--border)'
                    }}
                >
                    <div
                        className="nav-item"
                        onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                        }}
                        style={{ cursor: 'pointer', color: 'red' }}
                    >
                        <LogOut />
                        Logout
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="main-content">

                {/* TOPBAR */}
                <div className="topbar">

                    {/* LEFT */}
                    <div className="topbar-left">
                        <button
                            className="toggle-btn mobile-menu-toggle"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Open navigation menu"
                            aria-expanded={mobileMenuOpen}
                        >
                            <Menu size={20} />
                        </button>
                        {!hideTopbarTools && <>
                            <button
                                className="toggle-btn"
                                onClick={() => setCollapsed(!collapsed)}
                                aria-label="Toggle sidebar"
                            >
                                <Menu size={20} />
                            </button>

                        </>}
                    </div>

                    {/* RIGHT */}
                    <div
                        className="topbar-right"
                        style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                        }}
                    >

                        {/* NOTIFICATIONS */}
                        <div ref={notifRef} className="notification-menu">
                            <button
                                className="toggle-btn notification-toggle"
                                onClick={openNotifications}
                                aria-label="Notifications"
                            >
                                <Bell size={20} />

                                {unreadCount > 0 && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: '5px',
                                            right: '5px',
                                            background: 'red',
                                            color: '#fff',
                                            fontSize: '10px',
                                            borderRadius: '50%',
                                            padding: '2px 6px'
                                        }}
                                    >
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotif && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '40px',
                                        right: '0',
                                        background: '#fff',
                                        borderRadius: '10px',
                                        width: '250px',
                                        boxShadow:
                                            '0 5px 15px rgba(0,0,0,0.1)',
                                        zIndex: 100
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '10px',
                                            fontWeight: '600',
                                            borderBottom:
                                                '1px solid #eee'
                                        }}
                                    >
                                        Notifications
                                    </div>

                                    {notifications.length === 0 ? (
                                        <div
                                            style={{
                                                padding: '10px',
                                                color: '#888'
                                            }}
                                        >
                                            No notifications
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                style={{
                                                    padding: '10px',
                                                    borderBottom:
                                                        '1px solid #eee'
                                                }}
                                            >
                                                {n.text}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* PROFILE */}
                        <div
                            ref={profileRef}
                            className="user-profile"
                            onClick={() =>
                                setShowProfile(!showProfile)
                            }
                            style={{
                                cursor: 'pointer',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {profile ? <>
                                <div className="avatar">
                                    {getInitials(profile.name)}
                                </div>

                                <div className="user-profile-details">
                                    <div>{profile.name}</div>
                                    <div style={{ fontSize: '12px' }}>
                                        {profile.role}
                                    </div>
                                </div>
                            </> : <>
                                <div className="avatar avatar-skeleton" aria-label="Loading profile" />
                                <div className="user-profile-details profile-text-skeleton" aria-hidden="true" />
                            </>}

                            {showProfile && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50px',
                                        right: '0',
                                        background: '#fff',
                                        borderRadius: '10px',
                                        width: '180px',
                                        boxShadow:
                                            '0 5px 15px rgba(0,0,0,0.1)',
                                        zIndex: 100
                                    }}
                                >
                                    <div className="profile-dropdown-identity">
                                        <strong>{profile?.name || 'Staff'}</strong>
                                        <span>{profile?.role || 'Loading...'}</span>
                                    </div>
                                    {/* PROFILE */}
                                    <div
                                        onClick={handleProfile}
                                        style={{
                                            padding: '10px',
                                            borderBottom:
                                                '1px solid #eee',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <User size={14} />
                                        Profile
                                    </div>

                                    {/* LOGOUT */}
                                    <div
                                        onClick={handleLogout}
                                        style={{
                                            padding: '10px',
                                            color: 'red',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <LogOut size={14} />
                                        Logout
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* PAGE CONTENT */}
                <div className="page-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
