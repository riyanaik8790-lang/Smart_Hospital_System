import React, { useState } from 'react';

export default function DeactivateAccountModal({ user, onClose, onConfirm }) {
  const [confirmation, setConfirmation] = useState('');
  const [override, setOverride] = useState(false);
  const [warning, setWarning] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isConfirmed = confirmation === 'DELETE' || confirmation.trim().toLowerCase() === user.name.toLowerCase();
  const submit = async (event) => {
    event.preventDefault(); if (!isConfirmed) return;
    setSaving(true); setError('');
    const result = await onConfirm({ confirmation, override });
    setSaving(false);
    if (result?.requiresOverride) setWarning(result.warnings);
    else if (result?.error) setError(result.error);
  };
  return <div role="presentation" onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 16 }}>
    <form role="dialog" aria-modal="true" aria-labelledby="deactivate-title" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit} className="card" style={{ width: 'min(520px,100%)', padding: 24 }}>
      <h2 id="deactivate-title" style={{ marginTop: 0, color: 'var(--danger, #dc2626)' }}>Deactivate account</h2>
      <p>This removes <strong>{user.name}</strong> from active access. Clinical and audit records are retained.</p>
      {warning && <><div className="alert alert-error" style={{ display: 'block' }}>This doctor has <strong>{warning.upcomingAppointments}</strong> upcoming appointment(s) and <strong>{warning.admittedPatients}</strong> admitted patient(s). Reassign them first, or explicitly approve the override.</div><label style={{ display: 'flex', gap: 8, margin: '14px 0' }}><input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} /><span>I understand and approve deactivation without reassignment.</span></label></>}
      <label className="input-label" htmlFor="deactivate-confirm">Type <strong>DELETE</strong> or <strong>{user.name}</strong> to confirm</label>
      <input id="deactivate-confirm" autoFocus className="form-control" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
      {error && <p style={{ color: 'var(--danger, #dc2626)' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}><button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="btn btn-danger" disabled={!isConfirmed || saving || (warning && !override)}>{saving ? 'Deactivating...' : 'Deactivate account'}</button></div>
    </form>
  </div>;
}
