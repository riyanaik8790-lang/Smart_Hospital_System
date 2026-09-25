import React, { useState } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';

const ROLES = ['Admin', 'Doctor', 'Nurse', 'Receptionist'];
const SPECIALTIES = [
  'cardiac',
  'trauma',
  'eye',
  'diabetes',
  'neuro',
  'ortho',
  'pediatric',
  'general',
  'skin',
  'ENT',
  'Puimonar',
  'Gastro',
  'Oncology',
  'Urology',
  'Emergency',
];

export default function CreateStaffAccountModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'Doctor', specialty: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const [copyMessage, setCopyMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(form.phone)) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }
    setSaving(true);
    const result = await onCreate(form);
    setSaving(false);
    if (result?.error) return setError(result.error);
    setCreated(result);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(created.temporaryPassword);
      setCopyMessage('Temporary password copied to clipboard.');
    } catch (copyError) {
      console.error('Unable to copy temporary password:', copyError);
      setCopyMessage('Unable to copy the password. Please copy it manually.');
    }
  };

  return <div role="presentation" onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 16 }}>
    <form role="dialog" aria-modal="true" aria-labelledby="create-staff-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit} className="card" style={{ width: 'min(520px, 100%)', padding: 24 }}>
      {created ? <>
        <h2 id="create-staff-title" style={{ marginTop: 0 }}>Staff account created</h2>
        <p style={{ color: 'var(--text-gray)' }}>Share this temporary password securely with {created.user.name}. It will not be shown again after this window is closed.</p>
        <div className="input-group"><label htmlFor="generated-staff-password">Temporary Password</label><div style={{ position: 'relative' }}><input id="generated-staff-password" className="form-control" readOnly type={showPassword ? 'text' : 'password'} value={created.temporaryPassword} style={{ paddingRight: 76 }} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', display: 'flex', background: 'transparent', color: 'var(--text-gray)' }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button><button type="button" onClick={copyPassword} aria-label="Copy temporary password" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', background: 'transparent', color: 'var(--text-gray)' }}><Copy size={18} /></button></div></div>
        {copyMessage && <p className="help-text" role="status" style={{ color: copyMessage.startsWith('Unable') ? 'var(--danger)' : 'var(--success, #15803d)' }}>{copyMessage}</p>}
        <p className="help-text">They will be required to set a new password immediately after their first sign-in.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}><button type="button" className="btn btn-primary" onClick={onClose}>Done</button></div>
      </> : <>
      <h2 id="create-staff-title" style={{ marginTop: 0 }}>Create Staff Account</h2>
      <p style={{ color: 'var(--text-gray)', marginBottom: 20 }}>A secure temporary password will be generated and displayed once after the account is created.</p>
      <div className="input-group"><label htmlFor="staff-name">Full Name</label><input id="staff-name" className="form-control" autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
      <div className="input-group"><label htmlFor="staff-email">Email</label><input id="staff-email" className="form-control" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
      <div className="input-group"><label htmlFor="staff-phone">Phone Number</label><input id="staff-phone" className="form-control" type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} pattern="[0-9]{10}" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, '').slice(0, 10) })} aria-invalid={Boolean(form.phone) && form.phone.length !== 10} aria-describedby="staff-phone-help" /><p id="staff-phone-help" className="help-text">Enter exactly 10 digits.</p></div>
      <div className="input-group"><label htmlFor="staff-role">Role</label><select id="staff-role" className="form-control" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value, specialty: event.target.value === 'Doctor' ? form.specialty : '' })}>{ROLES.map((role) => <option key={role} value={role}>{role}</option>)}</select></div>
      {form.role === 'Doctor' && <div className="input-group"><label htmlFor="staff-specialty">Department / Specialty</label><select id="staff-specialty" className="form-control w-full rounded-md border border-gray-300 bg-white px-3 py-2" required value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })}><option value="">Select Specialty</option>{SPECIALTIES.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}</select></div>}
      <div className="input-group"><label htmlFor="staff-password">Temporary Password</label><input id="staff-password" className="form-control" readOnly value="Generated securely when the account is created" /></div>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}><button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Account'}</button></div>
      </>}
    </form>
  </div>;
}
