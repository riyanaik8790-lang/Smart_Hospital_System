import { motion } from 'framer-motion';

export default function KpiCard({ label, value, detail, icon: Icon, tone }) {
  return <motion.article whileHover={{ scale: 1.025, y: -2 }} transition={{ type: 'spring', stiffness: 350, damping: 22 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></div><span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon size={21} /></span></div>
  </motion.article>;
}
