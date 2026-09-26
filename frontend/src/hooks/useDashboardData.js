import { useCallback, useEffect, useMemo, useState } from 'react';
import { authFetch } from '../api/authFetch';

const EMPTY_DASHBOARD_DATA = {
    totalPatients: 0,
    admittedPatients: 0,
    criticalPatients: 0,
    availableDoctors: 0,
    emergencyAvailable: 0,
};

export function useDashboardData(roomData, dateRange) {
    const [apiData, setApiData] = useState(EMPTY_DASHBOARD_DATA);
    const [isLoading, setIsLoading] = useState(true);

    const refreshDashboardData = useCallback(async () => {
        try {
            const params = new URLSearchParams(dateRange || {});
            const response = await authFetch(`/dashboard${params.toString() ? `?${params}` : ''}`);
            if (!response.ok) throw new Error('Unable to load dashboard data.');

            const data = await response.json();
            setApiData({ ...EMPTY_DASHBOARD_DATA, ...data });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange?.startDate, dateRange?.endDate]);

    useEffect(() => {
        setIsLoading(true);
        const initialFetch = window.setTimeout(refreshDashboardData, 0);
        const interval = window.setInterval(refreshDashboardData, 3000);
        return () => {
            window.clearTimeout(initialFetch);
            window.clearInterval(interval);
        };
    }, [refreshDashboardData]);

    const dashboardData = useMemo(() => ({
        ...apiData,
        // Keep dashboard room counts identical to the Rooms page, which owns
        // the room list and applies its cleaning-status refresh before reading.
        ...roomData,
    }), [apiData, roomData]);

    return { dashboardData, isLoading, refreshDashboardData };
}
