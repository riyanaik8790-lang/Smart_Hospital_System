import { Activity, BedDouble, CalendarDays, LayoutDashboard, UsersRound } from 'lucide-react';

const items = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: UsersRound },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'beds', label: 'Bed Management', icon: BedDouble },
];

export default function DashboardSidebar({ activeTab, onTabChange }) {
  return <aside className="w-full shrink-0 border-b border-slate-200 bg-white p-3 md:w-56 md:border-b-0 md:border-r md:p-4">
    <div className="mb-5 flex items-center gap-2 px-2 text-sky-700"><span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-100"><Activity size={18} /></span><span className="font-bold">CareFlow</span></div>
    <nav className="flex gap-1 overflow-x-auto md:flex-col">{items.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => onTabChange(id)} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${activeTab === id ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}><Icon size={18} />{label}</button>)}</nav>
  </aside>;
}
