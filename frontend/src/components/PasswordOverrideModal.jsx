import React, { useState } from 'react';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';

export default function PasswordOverrideModal({ user, onClose, onConfirm }) {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const copyPassword = async () => {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopyMessage('Password copied to clipboard.');
    } catch {
      setCopyMessage('Unable to copy the password. Please copy it manually.');
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('Use at least 8 characters, including a letter and a number.');
      return;
    }

    setSaving(true);
    setError('');
    const result = await onConfirm({ userId: user.user_id, newPassword });
    setSaving(false);
    if (result?.error) setError(result.error);
  };

  return <div role="presentation" onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 16 }}>
    <form role="dialog" aria-modal="true" aria-labelledby="password-override-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit} className="card" style={{ width: 'min(480px, 100%)', padding: 24 }}>
      <h2 id="password-override-title" style={{ marginTop: 0 }}>Change temporary password</h2>
      <p style={{ color: 'var(--text-gray)' }}>Set a temporary password for <strong>{user.name}</strong>. They will be required to change it after their next sign-in.</p>
      <div className="input-group">
        <label className="input-label" htmlFor="new-temporary-password">New Temporary Password</label>
        <div style={{ position: 'relative' }}>
          <input id="new-temporary-password" className="form-control" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setCopyMessage(''); }} minLength={8} required autoFocus style={{ paddingRight: 76 }} />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide temporary password' : 'Show temporary password'} title={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', display: 'flex', padding: 4, background: 'transparent', color: 'var(--text-gray)' }}>
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
          <button type="button" onClick={copyPassword} disabled={!newPassword} aria-label="Copy temporary password" title="Copy password" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', padding: 4, background: 'transparent', color: 'var(--text-gray)' }}>
            {copyMessage === 'Password copied to clipboard.' ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
          </button>
        </div>
        <p className="help-text">Use at least 8 characters, including a letter and a number.</p>
        {copyMessage && <p className="help-text" role="status" style={{ color: copyMessage.startsWith('Unable') ? 'var(--danger)' : 'var(--success, #15803d)' }}>{copyMessage}</p>}
      </div>
      {error && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Set temporary password'}</button>
      </div>
    </form>
  </div>;
}
