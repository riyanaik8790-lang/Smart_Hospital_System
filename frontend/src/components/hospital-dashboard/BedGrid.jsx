const beds = [
  ['A-101', 'occupied'], ['A-102', 'available'], ['A-103', 'available'], ['A-104', 'cleaning'],
  ['B-201', 'occupied'], ['B-202', 'occupied'], ['B-203', 'available'], ['B-204', 'available'],
  ['C-301', 'available'], ['C-302', 'cleaning'], ['C-303', 'occupied'], ['C-304', 'available'],
];
const styles = { available: 'border-emerald-200 bg-emerald-50 text-emerald-800', occupied: 'border-rose-200 bg-rose-50 text-rose-800', cleaning: 'border-amber-200 bg-amber-50 text-amber-800' };

export default function BedGrid() {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Bed Management</h2><p className="mt-0.5 text-sm text-slate-500">Live ward capacity overview</p></div><div className="flex gap-3 text-xs text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Available</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />Occupied</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />Cleaning</span></div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{beds.map(([number, status]) => <button key={number} type="button" className={`rounded-xl border p-3 text-left transition-transform hover:-translate-y-0.5 ${styles[status]}`}><p className="font-semibold">{number}</p><p className="mt-1 text-xs capitalize">{status}</p></button>)}</div></section>;
}
