import { useCallback, useEffect, useMemo, useState } from 'react';
import { authFetch } from '../api/authFetch';

const EMPTY_DASHBOARD_DATA = {
    totalPatients: 0,
    admittedPatients: 0,
    criticalPatients: 0,
    availableDoctors: 0,
    emergencyAvailable: 0,
};

const dashboardCacheKey = (dateRange) => `dashboardData:${dateRange?.startDate || 'all'}:${dateRange?.endDate || 'all'}`;

const readDashboardCache = (dateRange) => {
    try {
        const saved = JSON.parse(localStorage.getItem(dashboardCacheKey(dateRange)) || 'null');
        return saved && typeof saved === 'object' ? { ...EMPTY_DASHBOARD_DATA, ...saved } : null;
    } catch {
        return null;
    }
};

export function useDashboardData(roomData, dateRange) {
    const [apiData, setApiData] = useState(() => readDashboardCache(dateRange) || EMPTY_DASHBOARD_DATA);
    const [isLoading, setIsLoading] = useState(() => !readDashboardCache(dateRange));

    const refreshDashboardData = useCallback(async () => {
        try {
            const params = new URLSearchParams(dateRange || {});
            const response = await authFetch(`/dashboard${params.toString() ? `?${params}` : ''}`);
            if (!response.ok) throw new Error('Unable to load dashboard data.');

            const data = await response.json();
            const nextData = { ...EMPTY_DASHBOARD_DATA, ...data };
            setApiData(nextData);
            try {
                localStorage.setItem(dashboardCacheKey(dateRange), JSON.stringify(nextData));
            } catch {
                // Storage can be unavailable; the in-memory dashboard still updates.
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange?.startDate, dateRange?.endDate]);

    useEffect(() => {
        // A range change may have a cached snapshot. Show it immediately and
        // keep it visible while the background refresh gets current values.
        const cachedData = readDashboardCache(dateRange);
        if (cachedData) {
            setApiData(cachedData);
            setIsLoading(false);
        } else {
            setIsLoading(true);
        }
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
