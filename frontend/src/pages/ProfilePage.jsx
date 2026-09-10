import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeactivateAccountModal from '../components/DeactivateAccountModal';
import { authFetch } from '../api/authFetch';

function ProfilePage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const user = { name: localStorage.getItem('userName') || 'My account', role: localStorage.getItem('role') || 'staff' };
  const deactivate = async (payload) => {
    try {
      const response = await authFetch('/users/me', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (response.status === 409 && data.requiresOverride) return data;
      if (!response.ok) return { error: data.message || 'Unable to deactivate account.' };
      localStorage.clear(); navigate('/login', { replace: true }); return {};
    } catch (error) { return { error: error.message }; }
  };
  return (
    <div className="page-container">
      <h1>My Profile</h1>
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          marginTop: "20px",
        }}
      >
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Role:</strong> <span style={{ textTransform: 'capitalize' }}>{user.role}</span></p>
        <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '24px 0 16px' }} />
        <h2 style={{ color: 'var(--danger, #dc2626)', fontSize: '18px' }}>Danger zone</h2>
        <p>Deactivating your account immediately signs you out. Your hospital records are retained.</p>
        <button className="btn btn-danger" onClick={() => setShowModal(true)}>Deactivate my account</button>
      </div>
      {showModal && <DeactivateAccountModal user={user} onClose={() => setShowModal(false)} onConfirm={deactivate} />}
    </div>
  );
}

export default ProfilePage;
