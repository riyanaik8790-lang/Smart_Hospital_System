import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');

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

                navigate('/app');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Server connection error. Please try again.');
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
                        Smart Hospital
                    </div>
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Login to the hospital management system</p>
                </div>


                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '20px', padding: '10px', fontSize: '13px' }}>
                        {error}
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
                            <a href="#" style={{ fontSize: '13px' }}>Forgot?</a>
                        </div>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '10px' }}>
                        Sign In to Dashboard
                    </button>
                </form>

                <p className="text-center" style={{ marginTop: '24px', fontSize: '14px', color: 'var(--text-gray)' }}>
                    New staff member? <Link to="/register">Create an account</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
