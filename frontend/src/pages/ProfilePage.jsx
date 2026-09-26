import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Save, ShieldCheck, UserRound, UserX, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import AvatarSelectionModal from '../components/AvatarSelectionModal';
import DeactivateAccountModal from '../components/DeactivateAccountModal';
import { authFetch } from '../api/authFetch';

function ProfilePage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [isOnlyActiveAdmin, setIsOnlyActiveAdmin] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('soundEnabled') !== 'false');
  const [passwordFields, setPasswordFields] = useState({ currentPassword: '', newPassword: '' });
  const [user, setUser] = useState({
    userId: null,
    name: localStorage.getItem('userName') || 'My account',
    phone: '',
    role: localStorage.getItem('role') || 'staff',
    avatarUrl: localStorage.getItem('avatarUrl') || ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authFetch('/users/me');
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load profile.');
        setUser({ userId: data.user_id, name: data.name, phone: data.phone || '', role: data.role, avatarUrl: data.avatar_url || '' });
        localStorage.setItem('avatarUrl', data.avatar_url || '');
      } catch (error) {
        setStatusError(error.message);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const loadDeactivationStatus = async () => {
      try {
        const response = await authFetch('/users/me/deactivation-status');
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to check account status.');
        setIsOnlyActiveAdmin(Boolean(data.isOnlyActiveAdmin));
      } catch (error) {
        setStatusError(error.message);
      } finally {
        setStatusLoading(false);
      }
    };

    loadDeactivationStatus();
  }, []);

  const deactivate = async (payload) => {
    try {
      const response = await authFetch('/users/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.status === 409 && data.requiresOverride) return data;
      if (!response.ok) return { error: data.message || 'Unable to deactivate account.' };

      localStorage.clear();
      navigate('/login', { replace: true });
      return {};
    } catch (error) {
      return { error: error.message };
    }
  };

  const handleAvatarSaved = (avatarUrl) => {
    setUser((current) => ({ ...current, avatarUrl }));
    localStorage.setItem('avatarUrl', avatarUrl);
    window.dispatchEvent(new Event('avatar-updated'));
    setAvatarModalOpen(false);
  };

  const handleSoundEnabledChange = (enabled) => {
    setSoundEnabled(enabled);
    localStorage.setItem('soundEnabled', String(enabled));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileMessage(null);
    if (!/^\d{10}$/.test(user.phone)) {
      setProfileMessage({ type: 'error', text: 'Phone number must be exactly 10 digits.' });
      return;
    }

    setProfileSaving(true);
    try {
      const response = await authFetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, phone: user.phone, ...passwordFields })
      });
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : null;
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to update profile. Please try again.');
      }
      if (!data?.user) {
        throw new Error('Profile update did not return the saved account details. Please try again.');
      }

      setUser((current) => ({
        ...current,
        ...data.user,
        name: data.user.name ?? current.name,
        phone: String(data.user.phone ?? current.phone)
      }));
      localStorage.setItem('userName', data.user.name);
      window.dispatchEvent(new Event('profile-updated'));
      setPasswordFields({ currentPassword: '', newPassword: '' });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setProfileMessage({ type: 'success', text: data.message });
    } catch (error) {
      setProfileMessage({ type: 'error', text: error.message });
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="page-container profile-page pt-6" style={{ width: '100%', maxWidth: '960px', minWidth: 0 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Review your account details and access settings.</p>
        </div>
      </div>

      <section className="section-card profile-card" style={{ width: '100%', maxWidth: '100%' }}>
        <div style={{ overflowWrap: 'anywhere' }}>
          <div className="profile-identity">
            <Avatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{user.name}</div>
              <div style={{ color: 'var(--text-gray)', textTransform: 'capitalize' }}>{user.role}</div>
              <button type="button" className="btn btn-outline" style={{ marginTop: 8, padding: '6px 10px', fontSize: 12 }} onClick={() => setAvatarModalOpen(true)}>Choose avatar</button>
            </div>
          </div>

          <div className="profile-card-section">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="shrink-0" size={20} color="var(--primary)" aria-hidden="true" />
              <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-dark)' }}>Account Management</h2>
            </div>
            <p style={{ color: 'var(--text-gray)', marginBottom: '8px' }}>
              Deactivating your account signs you out immediately. Your hospital records are retained.
            </p>
            <p className="help-text" style={{ marginBottom: '18px' }}>
              To reactivate your account, contact an active administrator.
            </p>

            {isOnlyActiveAdmin && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                You are the only active admin — deactivating your account isn't allowed until another admin is added.
              </div>
            )}
            {statusError && <div className="alert alert-error">{statusError}</div>}

            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowModal(true)}
              disabled={statusLoading || isOnlyActiveAdmin || Boolean(statusError)}
            >
              <UserX size={18} />
              {statusLoading ? 'Checking account status…' : 'Deactivate my account'}
            </button>
          </div>
        </div>
      </section>

      <form onSubmit={saveProfile} className="section-card profile-card">
        <div className="flex min-w-0 items-center gap-3 mb-5">
          <UserRound className="shrink-0" size={20} color="var(--primary)" aria-hidden="true" />
          <div className="min-w-0"><h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-dark)' }}>Personal Information</h2><p className="help-text">Keep your account details up to date.</p></div>
        </div>
        <div className="form-grid">
          <div className="input-group"><label htmlFor="profile-name">Full Name</label><input id="profile-name" className="form-control" required value={user.name} onChange={(event) => setUser((current) => ({ ...current, name: event.target.value }))} /></div>
          <div className="input-group"><label htmlFor="profile-phone">Phone Number</label><input id="profile-phone" className="form-control" type="tel" inputMode="numeric" autoComplete="tel" required maxLength={10} pattern="[0-9]{10}" value={user.phone} onChange={(event) => setUser((current) => ({ ...current, phone: event.target.value.replace(/\D/g, '').slice(0, 10) }))} aria-describedby="profile-phone-help" /><p id="profile-phone-help" className="help-text">Enter exactly 10 digits.</p></div>
        </div>

        <div className="profile-card-section profile-password-section">
          <div className="flex min-w-0 items-center gap-3 mb-5">
            <KeyRound className="shrink-0" size={20} color="var(--primary)" aria-hidden="true" />
            <div className="min-w-0"><h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-dark)' }}>Change Password</h2><p className="help-text">Leave these fields empty to keep your current password.</p></div>
          </div>
          <div className="form-grid">
            <div className="input-group"><label htmlFor="current-password">Current Password</label><div className="password-field"><input id="current-password" className="form-control" type={showCurrentPassword ? 'text' : 'password'} autoComplete="current-password" value={passwordFields.currentPassword} onChange={(event) => setPasswordFields((current) => ({ ...current, currentPassword: event.target.value }))} /><button type="button" className="password-visibility-toggle" onClick={() => setShowCurrentPassword((visible) => !visible)} aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'} title={showCurrentPassword ? 'Hide password' : 'Show password'}>{showCurrentPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></div></div>
            <div className="input-group"><label htmlFor="new-password">New Password</label><div className="password-field"><input id="new-password" className="form-control" type={showNewPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={passwordFields.newPassword} onChange={(event) => setPasswordFields((current) => ({ ...current, newPassword: event.target.value }))} /><button type="button" className="password-visibility-toggle" onClick={() => setShowNewPassword((visible) => !visible)} aria-label={showNewPassword ? 'Hide new password' : 'Show new password'} title={showNewPassword ? 'Hide password' : 'Show password'}>{showNewPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></div><p className="help-text">At least 8 characters, including a letter and a number.</p></div>
          </div>
        </div>

        <div className="profile-card-section">
          <div className="flex min-w-0 items-center gap-3 mb-3">
            <Volume2 className="shrink-0" size={20} color="var(--primary)" aria-hidden="true" />
            <div className="min-w-0"><h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-dark)' }}>Notification Settings</h2><p className="help-text">Choose whether new alerts play a notification chime.</p></div>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-medium">Enable Notification Sounds</span>
            <input
              type="checkbox"
              className="peer sr-only"
              checked={soundEnabled}
              onChange={(event) => handleSoundEnabledChange(event.target.checked)}
              aria-label="Enable Notification Sounds"
            />
            <span className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-[var(--primary)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--primary)] after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" aria-hidden="true" />
          </label>
        </div>

        {profileMessage && <div className={`alert ${profileMessage.type === 'error' ? 'alert-error' : 'alert-success'}`} role="status">{profileMessage.text}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}><button type="submit" className="btn btn-primary" disabled={profileSaving}><Save size={18} />{profileSaving ? 'Saving...' : 'Save Changes'}</button></div>
      </form>

      {showModal && (
        <DeactivateAccountModal
          user={user}
          onClose={() => setShowModal(false)}
          onConfirm={deactivate}
        />
      )}
      {avatarModalOpen && <AvatarSelectionModal avatarUrl={user.avatarUrl} onClose={() => setAvatarModalOpen(false)} onSaved={handleAvatarSaved} />}
    </div>
  );
}

export default ProfilePage;
