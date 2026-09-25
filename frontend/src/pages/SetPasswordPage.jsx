import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../api/authFetch';

const passwordError = (password) => {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.';
  return '';
};

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const validationError = passwordError(password) || (confirmPassword && password !== confirmPassword ? 'Passwords do not match.' : '');

  const submit = async (event) => {
    event.preventDefault();
    if (validationError) return;
    setSaving(true);
    setError('');
    try {
      const response = await authFetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update password.');
      localStorage.setItem('mustChangePassword', 'false');
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return <div className="auth-page"><div className="auth-card"><div className="auth-header"><h1 className="auth-title">Set your new password</h1><p className="auth-subtitle">Your temporary password can only be used to reach this screen.</p></div>{error && <div className="alert alert-error">{error}</div>}<form onSubmit={submit}><div className="input-group"><label className="input-label" htmlFor="new-password">New password</label><input id="new-password" className="form-control" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoFocus /></div><div className="input-group"><label className="input-label" htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" className="form-control" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div>{validationError && <p style={{ color: 'var(--danger)' }}>{validationError}</p>}<p className="help-text">Use at least 8 characters, including a letter and a number.</p><button className="btn btn-primary btn-block" type="submit" disabled={saving || Boolean(validationError)}>{saving ? 'Saving...' : 'Save password and continue'}</button></form></div></div>;
}
