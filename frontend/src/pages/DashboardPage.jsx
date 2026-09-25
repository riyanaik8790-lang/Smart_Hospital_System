import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BedDouble, CalendarCheck, Stethoscope, UsersRound } from 'lucide-react';
import DashboardSidebar from '../components/hospital-dashboard/DashboardSidebar';
import KpiCard from '../components/hospital-dashboard/KpiCard';
import RecentActivityTable from '../components/hospital-dashboard/RecentActivityTable';
import BedGrid from '../components/hospital-dashboard/BedGrid';

const sampleStats = {
  Today: {
    totalPatients: 48,
    admittedPatients: 19,
    criticalPatients: 4,
    availableDoctors: 35,
    availableRooms: 50,
    emergencyAvailable: 4
  },
  'This Week': {
    totalPatients: 286,
    admittedPatients: 74,
    criticalPatients: 12,
    availableDoctors: 31,
    availableRooms: 38,
    emergencyAvailable: 2
  },
  'This Month': {
    totalPatients: 1_142,
    admittedPatients: 218,
    criticalPatients: 27,
    availableDoctors: 28,
    availableRooms: 24,
    emergencyAvailable: 1
  }
};

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const stats = sampleStats.Today;
  const content = {
    overview: <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><KpiCard label="Total Patients" value={stats.totalPatients} detail="12 admissions today" icon={UsersRound} tone="bg-sky-100 text-sky-700" /><KpiCard label="Available Beds" value={stats.availableRooms} detail="72% capacity available" icon={BedDouble} tone="bg-emerald-100 text-emerald-700" /><KpiCard label="Doctors on Duty" value={stats.availableDoctors} detail="4 currently in surgery" icon={Stethoscope} tone="bg-violet-100 text-violet-700" /></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><RecentActivityTable /><BedGrid /></div></>,
    patients: <RecentActivityTable />,
    appointments: <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><CalendarCheck className="mx-auto text-sky-600" size={32} /><h2 className="mt-3 font-semibold text-slate-900">Appointments</h2><p className="mt-1 text-sm text-slate-500">Today: 42 appointments scheduled, 31 checked in.</p></section>,
    beds: <BedGrid />,
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm"><div className="flex min-h-[calc(100vh-10rem)] flex-col md:flex-row"><DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} /><main className="min-w-0 flex-1 p-4 sm:p-6"><div className="mb-6"><p className="text-sm font-medium text-sky-700">Friday, September 25</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Hospital Operations</h1><p className="mt-1 text-sm text-slate-500">A real-time snapshot of patient care and capacity.</p></div><AnimatePresence mode="wait"><motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>{content[activeTab]}</motion.div></AnimatePresence></main></div></div>
  );
};

export default DashboardPage;
