import React, { useState } from 'react';
import { authFetch } from '../api/authFetch';

const AVATAR_OPTIONS = [
  '/avatars/clinician-1.svg', '/avatars/clinician-2.svg',
  '/avatars/clinician-3.svg', '/avatars/clinician-4.svg',
  '/avatars/clinician-5.svg', '/avatars/clinician-6.svg'
];

export default function AvatarSelectionModal({ avatarUrl, onClose, onSaved }) {
  const [selectedAvatar, setSelectedAvatar] = useState(avatarUrl || AVATAR_OPTIONS[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const saveAvatar = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await authFetch('/api/users/update-avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: selectedAvatar })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to save avatar.');
      onSaved(data.user.avatar_url);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save avatar.');
    } finally {
      setSaving(false);
    }
  };

  return <div role="presentation" onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 16 }}>
    <div role="dialog" aria-modal="true" aria-labelledby="avatar-selection-title" onMouseDown={(event) => event.stopPropagation()} className="card" style={{ width: 'min(540px, 100%)', padding: 24 }}>
      <h2 id="avatar-selection-title" style={{ marginTop: 0 }}>Choose your avatar</h2>
      <p className="help-text">Select an avatar for your hospital profile.</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4" style={{ marginTop: 20 }}>
        {AVATAR_OPTIONS.map((url, index) => <button key={url} type="button" onClick={() => setSelectedAvatar(url)} className={`rounded-full ${selectedAvatar === url ? 'ring-4 ring-blue-600 ring-offset-2' : ''}`} aria-label={`Select avatar ${index + 1}`} aria-pressed={selectedAvatar === url} style={{ padding: 0, aspectRatio: '1 / 1', overflow: 'hidden' }}>
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </button>)}
      </div>
      {error && <p role="alert" style={{ color: 'var(--danger)', marginTop: 16 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
        <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={saveAvatar} disabled={saving}>{saving ? 'Saving...' : 'Save Avatar'}</button>
      </div>
    </div>
  </div>;
}
