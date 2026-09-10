import React, { useCallback, useEffect, useState } from 'react';
import { UserX } from 'lucide-react';
import DeactivateAccountModal from '../components/DeactivateAccountModal';
import { authFetch } from '../api/authFetch';

const UsersPage = () => {
  const [users, setUsers] = useState([]); const [selected, setSelected] = useState(null); const [message, setMessage] = useState('');
  const loadUsers = useCallback(async () => { const r = await authFetch('/users'); const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Unable to load users.'); setUsers(d); }, []);
  useEffect(() => { loadUsers().catch((e) => setMessage(e.message)); }, [loadUsers]);
  const deactivate = async (payload) => { try { const r = await authFetch(`/users/${selected.user_id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const d = await r.json(); if (r.status === 409 && d.requiresOverride) return d; if (!r.ok) return { error: d.message || 'Unable to deactivate account.' }; setSelected(null); setMessage(`${selected.name}'s account was deactivated.`); await loadUsers(); return {}; } catch (e) { return { error: e.message }; } };
  return <div className="page-container"><div className="page-header"><div><h1 className="page-title">User management</h1><p className="page-subtitle">Deactivate accounts while retaining clinical history.</p></div></div>{message && <div className="alert alert-success">{message}</div>}<div className="section-card"><div className="table-container"><table className="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{users.map((u) => <tr key={u.user_id}><td><strong>{u.name}</strong></td><td>{u.email}</td><td style={{ textTransform: 'capitalize' }}>{u.role}</td><td><span className={`badge ${u.is_active ? 'badge-low' : 'badge-high'}`}>{u.is_active ? 'Active' : 'Deactivated'}</span></td><td>{u.is_active && <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => { setMessage(''); setSelected(u); }}><UserX size={14} /> Deactivate</button>}</td></tr>)}{!users.length && <tr><td colSpan="5" className="text-center">No users found.</td></tr>}</tbody></table></div></div>{selected && <DeactivateAccountModal user={selected} onClose={() => setSelected(null)} onConfirm={deactivate} />}</div>;
};
export default UsersPage;
