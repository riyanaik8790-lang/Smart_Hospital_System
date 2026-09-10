import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserRound, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DeactivateAccountModal from '../components/DeactivateAccountModal';
import { authFetch } from '../api/authFetch';

function ProfilePage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [isOnlyActiveAdmin, setIsOnlyActiveAdmin] = useState(false);
  const [statusError, setStatusError] = useState('');
  const user = {
    name: localStorage.getItem('userName') || 'My account',
    role: localStorage.getItem('role') || 'staff'
  };

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

  return (
    <div className="page-container" style={{ width: '100%', maxWidth: '960px', minWidth: 0 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Review your account details and access settings.</p>
        </div>
      </div>

      <div className="section-card" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <div className="section-body" style={{ overflowWrap: 'anywhere' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div className="stat-icon"><UserRound size={24} /></div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{user.name}</div>
              <div style={{ color: 'var(--text-gray)', textTransform: 'capitalize' }}>{user.role}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ShieldCheck size={20} color="var(--primary)" />
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
      </div>

      {showModal && (
        <DeactivateAccountModal
          user={user}
          onClose={() => setShowModal(false)}
          onConfirm={deactivate}
        />
      )}
    </div>
  );
}

export default ProfilePage;
