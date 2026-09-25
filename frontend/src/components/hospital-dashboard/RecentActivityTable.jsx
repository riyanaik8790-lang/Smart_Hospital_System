const activity = [
  { patient: 'Ananya Sharma', action: 'Admitted to Cardiology', time: '10 min ago', status: 'Admitted' },
  { patient: 'Rahul Verma', action: 'Appointment confirmed', time: '26 min ago', status: 'Confirmed' },
  { patient: 'Meera Iyer', action: 'Discharged from Ward B', time: '1 hr ago', status: 'Discharged' },
  { patient: 'Arjun Patel', action: 'Lab results available', time: '2 hrs ago', status: 'Results ready' },
];

const statusStyle = { Admitted: 'bg-amber-100 text-amber-800', Confirmed: 'bg-sky-100 text-sky-800', Discharged: 'bg-emerald-100 text-emerald-800', 'Results ready': 'bg-violet-100 text-violet-800' };

export default function RecentActivityTable() {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-900">Recent Activity</h2><p className="mt-0.5 text-sm text-slate-500">Latest care and scheduling updates</p></div><button className="text-sm font-medium text-sky-700 hover:text-sky-800">View all</button></div><div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Patient</th><th className="px-5 py-3 font-semibold">Activity</th><th className="px-5 py-3 font-semibold">Time</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{activity.map((row) => <tr key={row.patient} className="hover:bg-slate-50"><td className="px-5 py-4 font-medium text-slate-800">{row.patient}</td><td className="px-5 py-4 text-slate-600">{row.action}</td><td className="px-5 py-4 text-slate-500">{row.time}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[row.status]}`}>{row.status}</span></td></tr>)}</tbody></table></div></section>;
}
