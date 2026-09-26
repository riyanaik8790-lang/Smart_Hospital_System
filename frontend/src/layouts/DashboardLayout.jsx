import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { authFetch } from '../api/authFetch';
import Avatar from '../components/Avatar';
import PageGreeting from '../components/PageGreeting';
import { RoomDataProvider } from '../contexts/RoomDataContext';
import { useNotificationChime } from '../hooks/useNotificationChime';
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [showNotif, setShowNotif] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const lastPatientIdRef = useRef(null);
    const urgentPatientIdsRef = useRef(null);
    const criticalAlertKeysRef = useRef(null);
    const previousUnreadCountRef = useRef(null);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const playNotificationChime = useNotificationChime();

    const [profile, setProfile] = useState(null);
    const role = readStoredText('role', '').toLowerCase();
    const canView = (...roles) => roles.includes(role);

    const navigate = useNavigate();
    const location = useLocation();

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

    // The navigation drawer is a mobile-only interaction. Clear its state when
    // returning to desktop so it can never affect the full desktop sidebar.
    useEffect(() => {
        const desktopQuery = window.matchMedia('(min-width: 769px)');
        const closeDrawerOnDesktop = () => {
            if (desktopQuery.matches) setMobileMenuOpen(false);
        };

        closeDrawerOnDesktop();
        desktopQuery.addEventListener('change', closeDrawerOnDesktop);
        return () => desktopQuery.removeEventListener('change', closeDrawerOnDesktop);
    }, []);

    // Avoid rendering stale strings such as "undefined" while the stored
    // identity is being read. The header uses a small placeholder until then.
    useEffect(() => {
        const name = readStoredText('userName', 'Staff');
        const storedRole = readStoredText('role', 'staff');
        setProfile({ name, role: formatRole(storedRole), avatarUrl: localStorage.getItem('avatarUrl') || '' });

        let cancelled = false;
        const loadProfile = async () => {
            try {
                const response = await authFetch('/users/me');
                const user = await response.json();
                if (!response.ok || cancelled) return;

                const avatarUrl = user.avatar_url || '';
                localStorage.setItem('avatarUrl', avatarUrl);
                setProfile({
                    name: user.name || name,
                    role: formatRole(user.role || storedRole),
                    avatarUrl
                });
            } catch {
                // Keep the locally stored profile available if the request fails.
            }
        };

        loadProfile();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const refreshAvatar = () => setProfile((current) => current && ({ ...current, avatarUrl: localStorage.getItem('avatarUrl') || '' }));
        const refreshProfileName = () => setProfile((current) => current && ({ ...current, name: readStoredText('userName', current.name) }));
        window.addEventListener('avatar-updated', refreshAvatar);
        window.addEventListener('profile-updated', refreshProfileName);
        return () => {
            window.removeEventListener('avatar-updated', refreshAvatar);
            window.removeEventListener('profile-updated', refreshProfileName);
        };
    }, []);

    // ==========================
    // FETCH NOTIFICATIONS
    // ==========================
    const fetchNotifications = async () => {
        try {
            const res = await authFetch('/patients');
            const data = await res.json();

            // Track urgent patients independently of the notification list so
            // a newly appearing Critical/High patient receives an alert even
            // when it is not the first item returned by the API.
            if (Array.isArray(data)) {
                const urgentIds = new Set(data
                    .filter((patient) => patient.priority_label === 'Critical' || patient.priority_label === 'High')
                    .map((patient) => String(patient.patient_id)));
                if (urgentPatientIdsRef.current) {
                    const hasNewUrgentPatient = [...urgentIds].some((id) => !urgentPatientIdsRef.current.has(id));
                    if (hasNewUrgentPatient && role !== 'admin') playNotificationChime();
                }
                urgentPatientIdsRef.current = urgentIds;
            }

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

            if (role === 'admin') {
                // These are read-only calls to existing frontend endpoints.
                // A baseline is stored first, then only new emergency events or
                // threshold crossings become visible alerts on later polls.
                const criticalAlerts = [];
                if (Array.isArray(data)) {
                    data.forEach((patient) => {
                        const priority = String(patient.priority_label || '').toLowerCase();
                        const status = String(patient.status || '').toLowerCase();
                        if (status === 'admitted' && ['emergency', 'critical'].includes(priority)) {
                            criticalAlerts.push({
                                key: `critical-admission-${patient.patient_id}-${priority}-${status}`,
                                text: `Urgent admission: ${patient.name} is admitted with ${patient.priority_label} priority.`
                            });
                        }
                    });
                }

                try {
                    const [efficiencyResponse, roomsResponse] = await Promise.all([
                        authFetch('/api/efficiency'),
                        authFetch('/rooms')
                    ]);
                    const efficiency = efficiencyResponse.ok ? await efficiencyResponse.json() : null;
                    const rooms = roomsResponse.ok ? await roomsResponse.json() : [];
                    const emergencyRooms = Array.isArray(rooms)
                        ? rooms.filter((room) => String(room.type || '').toLowerCase() === 'emergency')
                        : [];
                    const availableEmergencyRooms = emergencyRooms.filter((room) => String(room.status || '').toLowerCase() === 'available').length;

                    if (efficiency?.bedOccupancyRate >= 90) {
                        criticalAlerts.push({ key: 'critical-bed-occupancy', text: `Critical capacity warning: bed occupancy is ${efficiency.bedOccupancyRate}%.` });
                    }
                    if (emergencyRooms.length && ((emergencyRooms.length - availableEmergencyRooms) / emergencyRooms.length) * 100 >= 90) {
                        criticalAlerts.push({ key: 'critical-emergency-capacity', text: `Critical capacity warning: ${availableEmergencyRooms} emergency room${availableEmergencyRooms === 1 ? '' : 's'} available.` });
                    }
                    if (efficiency?.doctorUtilizationRate >= 85) {
                        criticalAlerts.push({ key: 'critical-staff-bottleneck', text: `Staffing warning: doctor utilization is ${efficiency.doctorUtilizationRate}%.` });
                    }
                    if (efficiency?.criticalLoad >= 20) {
                        criticalAlerts.push({ key: 'critical-system-health', text: `System health warning: critical-care load is ${efficiency.criticalLoad}%.` });
                    }
                } catch (error) {
                    console.error('Critical alert check failed:', error);
                }

                const currentAlertKeys = new Set(criticalAlerts.map((alert) => alert.key));
                if (criticalAlertKeysRef.current) {
                    const newCriticalAlerts = criticalAlerts.filter((alert) => !criticalAlertKeysRef.current.has(alert.key));
                    if (newCriticalAlerts.length) {
                        const timestamp = Date.now();
                        setNotifications((previous) => [
                            ...newCriticalAlerts.map((alert, index) => ({ id: `critical-${timestamp}-${index}`, text: alert.text })),
                            ...previous
                        ].slice(0, 5));
                        setUnreadCount((previous) => previous + newCriticalAlerts.length);
                    }
                }
                criticalAlertKeysRef.current = currentAlertKeys;

                const resetResponse = await authFetch('/api/admin/password-reset-requests');
                const resetRequests = await resetResponse.json();
                if (resetResponse.ok && Array.isArray(resetRequests)) {
                    const resetNotifications = resetRequests.map((request) => ({
                        id: `password-reset-${request.request_id}`,
                        text: `${request.name} requested a password reset.`,
                        action: () => {
                            setShowNotif(false);
                            navigate('/app/users', {
                                state: {
                                    passwordResetUserId: request.user_id,
                                    passwordResetUserEmail: request.email
                                }
                            });
                        }
                    }));
                    setNotifications((previous) => [
                        ...resetNotifications,
                        ...previous.filter((notification) => !String(notification.id).startsWith('password-reset-'))
                    ]);
                    setUnreadCount((previous) => Math.max(previous, resetNotifications.length));
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

    // The first value establishes the baseline silently. Subsequent increases
    // in the visible badge count produce one soft alert after audio is unlocked.
    useEffect(() => {
        if (previousUnreadCountRef.current !== null && unreadCount > previousUnreadCountRef.current) {
            playNotificationChime();
        }
        previousUnreadCountRef.current = unreadCount;
    }, [unreadCount, playNotificationChime]);

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
        <RoomDataProvider>
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
            <div className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header hidden lg:flex">
                    <button className="hospital-brand" type="button" onClick={() => navigate('/app/dashboard')} aria-label="Go to dashboard">
                        <Activity size={18} />
                        Smart Hospital Management System
                    </button>
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
                        <button className="hospital-brand mobile-hospital-brand" type="button" onClick={() => navigate('/app/dashboard')} aria-label="Go to dashboard">
                            <Activity size={18} />
                            <span>Smart Hospital Management System</span>
                        </button>
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
                                                <div>{n.text}</div>
                                                {n.action && (
                                                    <button
                                                        type="button"
                                                        onClick={n.action}
                                                        style={{ marginTop: '6px', padding: 0, background: 'transparent', color: 'var(--primary)', fontSize: '12px', fontWeight: 600 }}
                                                    >
                                                        Review request
                                                    </button>
                                                )}
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
                                <Avatar name={profile.name} avatarUrl={profile.avatarUrl} />

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
                    <PageGreeting />
                    <Outlet />
                </div>
            </div>
        </div>
        </RoomDataProvider>
    );
};

export default DashboardLayout;
