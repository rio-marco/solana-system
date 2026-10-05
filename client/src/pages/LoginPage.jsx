import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Coins, Mail, LogIn, Key, AlertCircle, Info } from 'lucide-react';
import { RecoveryModal } from '../components/RecoveryModal';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/auth/login', { email: email.trim() });
      if (res.data && res.data.flag) {
        navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
      } else {
        if (res.data && res.data.data && res.data.data.redirectUrl) {
          navigate(res.data.data.redirectUrl);
        } else {
          setError(res.data.message || 'Login request failed.');
        }
      }
    } catch (err) {
      if (err.response?.data?.data?.redirectUrl) {
        navigate(err.response.data.data.redirectUrl);
      } else {
        setError(err.response?.data?.message || 'Invalid login attempt.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="solana-auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="solana-brand-pill" style={{ marginBottom: '0.75rem' }}>
            <Coins size={15} />
            <span>Solana Platform</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Sign in to manage your SOL deposits and withdrawals
          </p>
        </div>

        {error && (
          <div className="solana-alert-danger">
            <AlertCircle size={18} style={{ shrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group-custom">
            <label className="solana-input-label">Email Address</label>
            <div className="solana-input-icon-wrapper">
              <Mail className="input-svg-icon" />
              <input
                type="email"
                className="solana-input-field"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="solana-btn-primary" style={{ marginTop: '0.5rem' }}>
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In with Email OTP</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            onClick={() => setShowRecovery(true)}
            className="solana-btn-outline"
          >
            <Key size={16} />
            <span>Account Recovery</span>
          </button>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: '0.75rem', lineHeight: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <Info size={14} />
            <span>If registered, enter your 12-word seed phrase to receive a login link.</span>
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.85rem', color: '#94a3b8' }}>
          Don't have an account yet?{' '}
          <Link to="/signup" className="solana-link">
            Sign Up
          </Link>
        </div>
      </div>

      <RecoveryModal isOpen={showRecovery} onClose={() => setShowRecovery(false)} />
    </div>
  );
};
