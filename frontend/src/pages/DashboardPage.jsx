import React from 'react';
import { AlertTriangle, BedDouble, CalendarPlus, FileText, Plus, Stethoscope, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const metrics = [
  { label: 'Total Patients', value: '1,248', detail: '+12 today', icon: UsersRound, iconClass: 'bg-sky-100 text-sky-700', cardClass: 'border-sky-100 bg-sky-50/80' },
  { label: 'Critical Cases', value: '18', detail: '4 need attention', icon: AlertTriangle, iconClass: 'bg-rose-100 text-rose-700', cardClass: 'border-rose-100 bg-rose-50/80' },
  { label: 'Available Doctors', value: '35', detail: '6 on call', icon: Stethoscope, iconClass: 'bg-violet-100 text-violet-700', cardClass: 'border-violet-100 bg-violet-50/80' },
  { label: 'Available Rooms', value: '50', detail: '72% capacity free', icon: BedDouble, iconClass: 'bg-emerald-100 text-emerald-700', cardClass: 'border-emerald-100 bg-emerald-50/80' },
];

const queue = [
  { patient: 'Ananya Sharma', department: 'Cardiology', priority: 'Critical', wait: '08 min' },
  { patient: 'Rahul Verma', department: 'Emergency', priority: 'High', wait: '16 min' },
  { patient: 'Meera Iyer', department: 'Orthopaedics', priority: 'Medium', wait: '24 min' },
  { patient: 'Arjun Patel', department: 'General Medicine', priority: 'Low', wait: '31 min' },
];

const priorityStyle = { Critical: 'bg-rose-100 text-rose-700', High: 'bg-orange-100 text-orange-700', Medium: 'bg-sky-100 text-sky-700', Low: 'bg-emerald-100 text-emerald-700' };

function MetricCard({ metric }) {
  const Icon = metric.icon;
  return <article className={`rounded-lg border p-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${metric.cardClass}`}><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-medium leading-none text-slate-700">{metric.label}</p><p className="mt-1 text-2xl font-bold leading-none tracking-tight text-slate-950">{metric.value}</p><p className="mt-1.5 text-[10px] leading-none text-slate-600">{metric.detail}</p></div><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${metric.iconClass}`}><Icon size={16} strokeWidth={1.8} /></span></div></article>;
}

function PatientInfluxChart() {
  return <div className="relative mt-3 h-32 overflow-hidden rounded-sm border border-slate-200 bg-[linear-gradient(#e8edf2_1px,transparent_1px),linear-gradient(90deg,#e8edf2_1px,transparent_1px)] bg-[size:20%_20%]"><svg viewBox="0 0 300 125" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-label="Patient influx placeholder chart" role="img"><defs><linearGradient id="influx-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#94a3b8" stopOpacity=".28" /><stop offset="1" stopColor="#cbd5e1" stopOpacity=".04" /></linearGradient></defs><path d="M0 86 L28 63 L50 51 L70 55 L91 50 L112 65 L132 47 L144 57 L155 43 L164 50 L180 38 L195 34 L211 40 L230 59 L246 67 L263 57 L282 31 L300 11 L300 125 L0 125 Z" fill="url(#influx-fill)" /><path d="M0 86 L28 63 L50 51 L70 55 L91 50 L112 65 L132 47 L144 57 L155 43 L164 50 L180 38 L195 34 L211 40 L230 59 L246 67 L263 57 L282 31 L300 11" fill="none" stroke="#94a3b8" strokeWidth="2" /></svg><span className="absolute inset-x-0 top-[58%] text-center text-[10px] text-slate-600">Connect reporting data to display trends.</span></div>;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  return <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-1 py-1 sm:gap-5">
    <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-950">Dashboard Overview</h1><p className="mt-0.5 text-xs text-slate-600">Monitor hospital capacity, patients, and care priorities.</p></div><div className="flex flex-wrap items-center gap-1.5"><button type="button" onClick={() => navigate('/app/patients')} className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700"><Plus size={14} /> Add Patient</button><button type="button" onClick={() => navigate('/app/appointments')} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"><CalendarPlus size={14} /> Schedule</button><button type="button" onClick={() => navigate('/app/reports')} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"><FileText size={13} /> Generate Report</button></div></header>
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Hospital metrics">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</section>
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3"><article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:col-span-2"><div className="flex items-center justify-between border-b border-slate-200 px-3 py-2"><div><h2 className="text-sm font-semibold leading-none text-slate-950">Priority Queue</h2><p className="mt-1 text-[10px] leading-none text-slate-600">Patients waiting for clinical attention</p></div><button type="button" onClick={() => navigate('/app/queue')} className="text-xs font-medium text-sky-700 hover:text-sky-800">View all</button></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="border-b border-slate-200 bg-slate-50 text-[9px] font-medium uppercase tracking-wide text-slate-700"><tr><th className="px-3 py-1.5">Patient</th><th className="px-3 py-1.5">Department</th><th className="px-3 py-1.5">Priority</th><th className="px-3 py-1.5">Waiting</th></tr></thead><tbody>{queue.map((item, index) => <tr key={item.patient} className={index % 2 ? 'bg-slate-50/80' : 'bg-white'}><td className="whitespace-nowrap px-3 py-1.5 font-medium text-slate-800">{item.patient}</td><td className="whitespace-nowrap px-3 py-1.5 text-slate-700">{item.department}</td><td className="px-3 py-1.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityStyle[item.priority]}`}>{item.priority}</span></td><td className="whitespace-nowrap px-3 py-1.5 text-slate-700">{item.wait}</td></tr>)}</tbody></table></div></article><aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><h2 className="text-sm font-semibold leading-none text-slate-950">Patient Influx</h2><p className="mt-1 text-[10px] leading-none text-slate-600">Hourly arrivals today</p><PatientInfluxChart /></aside></section>
  </main>;
}
