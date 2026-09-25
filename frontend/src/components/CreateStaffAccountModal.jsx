import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const ROLES = ['admin', 'doctor', 'nurse', 'receptionist'];

const passwordError = (password) => {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.';
  return '';
};

export default function CreateStaffAccountModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'doctor', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const validationError = passwordError(form.password);

  const submit = async (event) => {
    event.preventDefault();
    if (validationError) return;
    setSaving(true);
    setError('');
    const result = await onCreate(form);
    setSaving(false);
    if (result?.error) setError(result.error);
  };

  return <div role="presentation" onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 16 }}>
    <form role="dialog" aria-modal="true" aria-labelledby="create-staff-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit} className="card" style={{ width: 'min(520px, 100%)', padding: 24 }}>
      <h2 id="create-staff-title" style={{ marginTop: 0 }}>Create Staff Account</h2>
      <p style={{ color: 'var(--text-gray)', marginBottom: 20 }}>Set a temporary password and share it securely with the new staff member.</p>
      <div className="input-group"><label htmlFor="staff-name">Full Name</label><input id="staff-name" className="form-control" autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
      <div className="input-group"><label htmlFor="staff-email">Email</label><input id="staff-email" className="form-control" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
      <div className="input-group"><label htmlFor="staff-role">Role</label><select id="staff-role" className="form-control" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{ROLES.map((role) => <option key={role} value={role}>{role[0].toUpperCase() + role.slice(1)}</option>)}</select></div>
      <div className="input-group"><label htmlFor="staff-password">Temporary Password</label><div style={{ position: 'relative' }}><input id="staff-password" className="form-control" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} style={{ paddingRight: 44 }} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', background: 'transparent', color: 'var(--text-gray)' }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{form.password && validationError && <p className="help-text" style={{ color: 'var(--danger)' }}>{validationError}</p>}<p className="help-text">At least 8 characters, including a letter and a number.</p></div>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}><button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving || Boolean(validationError)}>{saving ? 'Creating...' : 'Create Account'}</button></div>
    </form>
  </div>;
}
