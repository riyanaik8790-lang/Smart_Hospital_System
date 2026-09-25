import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authFetch } from '../api/authFetch';

const RoomDataContext = createContext(null);

export function RoomDataProvider({ children }) {
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshRooms = useCallback(async () => {
        try {
            const response = await authFetch('/rooms');
            if (!response.ok) throw new Error('Unable to load rooms.');

            const data = await response.json();
            setRooms(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const initialFetch = window.setTimeout(refreshRooms, 0);
        const interval = window.setInterval(refreshRooms, 3000);
        return () => {
            window.clearTimeout(initialFetch);
            window.clearInterval(interval);
        };
    }, [refreshRooms]);

    const dashboardData = useMemo(() => ({
        totalRooms: rooms.length,
        availableRooms: rooms.filter(
            (room) => room.status?.toLowerCase() === 'available'
        ).length,
        occupiedRooms: rooms.filter(
            (room) => room.status?.toLowerCase() === 'occupied'
        ).length,
    }), [rooms]);

    const value = useMemo(() => ({
        rooms,
        isLoading,
        refreshRooms,
        dashboardData,
    }), [rooms, isLoading, refreshRooms, dashboardData]);

    return <RoomDataContext.Provider value={value}>{children}</RoomDataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRoomData() {
    const context = useContext(RoomDataContext);
    if (!context) {
        throw new Error('useRoomData must be used inside RoomDataProvider.');
    }
    return context;
}
