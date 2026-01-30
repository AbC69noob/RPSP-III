import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode';

import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Forgot Password Flow States
    const [step, setStep] = useState('login'); // login, forgot-email, verify-otp, reset-password, force-password-change
    const [forgotEmail, setForgotEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const evalLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/login', formData);
            const { token, requiresPasswordChange } = response.data;

            const decoded = jwtDecode(token);
            const role = decoded.role;

            if (role === 'student') {
                setError('Invalid user. You are not authorized to access this system.');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', token);

            // Fetch profile to get correct Role (Backend JWT might be missing it)
            const profileRes = await api.get('/profile');
            const userRole = profileRes.data.role.toLowerCase();
            const userId = profileRes.data.id;

            localStorage.setItem('user', JSON.stringify({
                id: userId,
                username: decoded.sub,
                role: userRole
            }));

            if (requiresPasswordChange) {
                setStep('force-password-change');
                setLoading(false);
                return;
            }

            navigate('/dashboard');

        } catch (err) {
            setLoading(false);
            if (err.response?.status === 403) {
                setError("Invalid user. Access denied.");
            } else {
                setError("Invalid username or password.");
            }
        }
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/auth/forgot-password', { email: forgotEmail });
            setStep('verify-otp');
            setLoading(false);
            setSuccess(response.data.message || 'OTP sent to your email.');
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/auth/verify-otp', {
                email: forgotEmail,
                otp: otp
            });
            setStep('reset-password');
            setLoading(false);
            setSuccess(response.data.message || 'OTP verified successfully.');
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        }
    };

    const validatePassword = (password) => {
        return {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
    };

    const handleForcePasswordChange = async (e) => {
        e.preventDefault();
        setError('');

        const requirements = validatePassword(newPassword);
        const allMet = Object.values(requirements).every(Boolean);

        if (!allMet) {
            setError('Please meet all password requirements');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            await api.post('/users/change-password', {
                userId: userData.id,
                newPassword: newPassword
            });
            setLoading(false);
            setSuccess('Password updated successfully. Accessing dashboard...');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || 'Failed to update password. Please try again.');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/reset-password', {
                email: forgotEmail,
                password: newPassword
            });
            setLoading(false);
            setStep('login');
            setSuccess(response.data.message || 'Password reset successfully. You can now login.');
            setForgotEmail('');
            setOtp('');
            setGeneratedOtp('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        }
    };

    const renderLoginForm = () => (
        <form onSubmit={evalLogin}>
            <div className="form-group">
                <label className="label">Username or Email</label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter username or email"
                    required
                />
            </div>

            <div className="form-group">
                <label className="label">Password</label>
                <div className="input-group">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="input-field pr-14"
                        placeholder="Enter password"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="password-toggle"
                    >
                        {showPassword ? 'Hide' : 'Show'}
                    </button>
                </div>
            </div>

            {error && <p className="text-danger text-xs text-center mb-4">{error}</p>}
            {success && <p className="text-success text-xs text-center mb-4">{success}</p>}

            <button
                type="submit"
                className="btn btn-primary mt-4"
                disabled={loading}
            >
                {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="text-right mt-2">
                <button
                    type="button"
                    onClick={() => {
                        setStep('forgot-email');
                        setError('');
                        setSuccess('');
                    }}
                    className="text-blue text-xs font-medium hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                    Forgot password?
                </button>
            </div>
        </form>
    );

    const renderForgotEmailForm = () => (
        <form onSubmit={handleSendOTP}>
            <h3 className="text-lg font-semibold text-center mb-4">Forgot Password</h3>
            <p className="text-xs text-gray-600 mb-4">Enter your email address to receive a verification code.</p>
            <div className="form-group">
                <label className="label">Email Address</label>
                <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="input-field"
                    placeholder="yourname@example.com"
                    required
                />
            </div>
            {error && <p className="text-danger text-xs text-center mb-4">{error}</p>}
            <button
                type="submit"
                className="btn-primary mt-4"
                disabled={loading}
            >
                {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <button
                type="button"
                onClick={() => setStep('login')}
                className="btn-link mt-4 w-full text-center text-xs"
            >
                Back to Login
            </button>
        </form>
    );

    const renderVerifyOtpForm = () => (
        <form onSubmit={handleVerifyOTP}>
            <h3 className="text-lg font-semibold text-center mb-4">Verify OTP</h3>
            <p className="text-xs text-gray-600 mb-4 text-center">We've sent a code to {forgotEmail}</p>
            <div className="form-group">
                <label className="label text-center">Enter 6-digit Code</label>
                <input
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="input-field text-center text-2xl tracking-[0.5em]"
                    placeholder="000000"
                    required
                />
            </div>
            {error && <p className="text-danger text-xs text-center mb-4">{error}</p>}
            {success && <p className="text-success text-xs text-center mb-4">{success}</p>}
            <button
                type="submit"
                className="btn-primary mt-4"
            >
                Verify Code
            </button>
            <div className="text-center mt-4">
                <button
                    type="button"
                    onClick={handleSendOTP}
                    className="text-blue text-xs hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                    Resend Code
                </button>
            </div>
        </form>
    );

    const renderResetPasswordForm = () => (
        <form onSubmit={handleResetPassword}>
            <h3 className="text-lg font-semibold text-center mb-4">New Password</h3>
            <div className="form-group">
                <label className="label">New Password</label>
                <div className="input-group">
                    <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field pr-14"
                        placeholder="Enter new password"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="password-toggle"
                    >
                        {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                </div>
            </div>
            <div className="form-group">
                <label className="label">Confirm Password</label>
                <div className="input-group">
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field pr-14"
                        placeholder="Confirm new password"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="password-toggle"
                    >
                        {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                </div>
            </div>
            {error && <p className="text-danger text-xs text-center mb-4">{error}</p>}
            <button
                type="submit"
                className="btn-primary mt-4"
                disabled={loading}
            >
                {loading ? 'Processing...' : 'Change Password'}
            </button>
        </form>
    );

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="title">
                    Result Processing System
                </h2>

                {step === 'login' && renderLoginForm()}
                {step === 'forgot-email' && renderForgotEmailForm()}
                {step === 'verify-otp' && renderVerifyOtpForm()}
                {step === 'reset-password' && renderResetPasswordForm()}
                {step === 'force-password-change' && (
                    <form onSubmit={handleForcePasswordChange}>
                        <h3 className="text-lg font-semibold text-center mb-1">First-Time Login</h3>
                        <p className="text-xs text-center text-gray-500 mb-4">Security policy requires you to change your default password.</p>

                        <div className="form-group mb-4">
                            <label className="label">New Password</label>
                            <div className="input-group">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="input-field pr-14"
                                    placeholder="Create new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="password-toggle"
                                >
                                    {showNewPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <div className="password-requirements mb-4">
                            <p className="text-xs font-semibold mb-2 text-gray-700">Password must contain:</p>
                            <div className="grid grid-cols-1 gap-1">
                                {[
                                    { key: 'length', text: 'At least 8 characters' },
                                    { key: 'lowercase', text: 'At least one lowercase letter' },
                                    { key: 'uppercase', text: 'At least one uppercase letter' },
                                    { key: 'number', text: 'At least one number' },
                                    { key: 'special', text: 'At least one special character' }
                                ].map(req => {
                                    const isMet = validatePassword(newPassword)[req.key];
                                    return (
                                        <div key={req.key} className={`flex items-center gap-2 text-xs ${isMet ? 'text-success' : 'text-gray-400'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isMet ? 'bg-success' : 'bg-gray-300'}`}></span>
                                            {req.text}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Confirm Password</label>
                            <div className="input-group">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input-field pr-14"
                                    placeholder="Confirm new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="password-toggle"
                                >
                                    {showConfirmPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-danger text-xs text-center mb-4 mt-4">{error}</p>}
                        {success && <p className="text-success text-xs text-center mb-4 mt-4">{success}</p>}

                        <button
                            type="submit"
                            className="btn btn-primary mt-4"
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Set New Password & Continue'}
                        </button>
                    </form>
                )}

                {step === 'login' && (
                    <div className="info-box">
                        <p className="font-bold text-gray-900 mb-1">Default Admin:</p>
                        <p>Username: admin</p>
                        <p>Password: admin123</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;

