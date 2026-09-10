import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Eye, EyeOff } from 'lucide-react';

const getPasswordError = (value) => {
    if (!value) return 'Password is required.';
    if (value.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
        return 'Password must include at least one letter and one number.';
    }
    return '';
};

const RegisterPage = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [role, setRole] = useState('Doctor');
    const [error, setError] = useState('');

    const passwordError = getPasswordError(password);
    const confirmPasswordError = !confirmPassword
        ? 'Please confirm your password.'
        : password !== confirmPassword
            ? 'Passwords do not match.'
            : '';

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitAttempted(true);

        if (passwordError || confirmPasswordError) {
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('userName', data.name || 'Staff Member');

                navigate('/app');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch {
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
                    <h1 className="auth-title">Staff Registration</h1>
                    <p className="auth-subtitle">Create your hospital management account</p>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '20px', padding: '10px', fontSize: '13px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Dr. John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Email Address</label>
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
                        <label className="input-label">Role</label>
                        <select
                            className="form-control"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option>Admin</option>
                            <option>Doctor</option>
                            <option>Nurse</option>
                            <option>Receptionist</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-control"
                                placeholder="Create a strong password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setPasswordTouched(true);
                                }}
                                aria-invalid={Boolean(passwordError)}
                                aria-describedby="password-requirements password-error"
                                style={{
                                    paddingRight: '46px',
                                    borderColor: passwordError && (passwordTouched || submitAttempted) ? 'var(--danger)' : undefined
                                }}
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
                        <p id="password-requirements" className="help-text">
                            Use at least 8 characters, including a letter and a number.
                        </p>
                        {passwordError && (passwordTouched || submitAttempted) && (
                            <p id="password-error" className="help-text" style={{ color: 'var(--danger)' }}>
                                {passwordError}
                            </p>
                        )}
                    </div>
                    <div className="input-group">
                        <label className="input-label">Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                className="form-control"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setConfirmPasswordTouched(true);
                                }}
                                aria-invalid={Boolean(confirmPasswordError)}
                                aria-describedby="confirm-password-error"
                                style={{
                                    paddingRight: '46px',
                                    borderColor: confirmPasswordError && (confirmPasswordTouched || submitAttempted) ? 'var(--danger)' : undefined
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((visible) => !visible)}
                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                title={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {confirmPasswordError && (confirmPasswordTouched || submitAttempted) && (
                            <p id="confirm-password-error" className="help-text" style={{ color: 'var(--danger)' }}>
                                {confirmPasswordError}
                            </p>
                        )}
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '20px' }}>
                        Create Account
                    </button>
                </form>

                <p className="text-center" style={{ marginTop: '24px', fontSize: '14px', color: 'var(--text-gray)' }}>
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
