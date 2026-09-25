import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                // Store identity in localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('userName', data.name || 'Staff Member');
                localStorage.setItem('mustChangePassword', String(Boolean(data.mustChangePassword)));

                navigate(data.mustChangePassword ? '/set-password' : '/app');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch {
            setError('Server connection error. Please try again.');
        }

    };

    const handleForgotSubmit = async () => {
        setError('');
        setMessage('');

        if (!email.trim()) {
            setError('Please enter your staff email first.');
            return;
        }

        try {
            const response = await fetch('/api/request-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() })
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || 'Unable to send the password reset request.');
            }

            setMessage('Password reset request sent to the Administrator.');
        } catch (requestError) {
            setError(requestError.message || 'Unable to send the password reset request.');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">
                            <Activity size={24} />
                        </div>
                        <span className="auth-logo-text">Smart Hospital Management System</span>
                    </div>
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Login to the hospital management system</p>
                </div>


                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '20px', padding: '10px', fontSize: '13px' }}>
                        {error}
                    </div>
                )}

                {message && (
                    <div className="alert alert-success" role="status" style={{ marginBottom: '20px', padding: '10px', fontSize: '13px' }}>
                        {message}
                    </div>
                )}


                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label className="input-label">Staff Email</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="e.g. staff@hospital.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <div className="flex justify-between w-full">
                            <label className="input-label">Password</label>
                            <button
                                type="button"
                                onClick={handleForgotSubmit}
                                style={{ fontSize: '13px', color: 'var(--primary)', background: 'transparent', padding: 0 }}
                            >
                                Forgot?
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-control"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingRight: '46px' }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((visible) => !visible)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                title={showPassword ? 'Hide password' : 'Show password'}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    display: 'flex',
                                    padding: '4px',
                                    color: 'var(--text-gray)',
                                    background: 'transparent'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '10px' }}>
                        Sign In to Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
