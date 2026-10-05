import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, UserPlus, AlertCircle } from 'lucide-react';

export const SignupPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim()) {
      setError('Full name and email address are required.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/auth/signup', {
        fullName: fullName.trim(),
        email: email.trim(),
      });

      if (res.data && res.data.flag) {
        navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
      } else {
        setError(res.data.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="solana-auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="solana-brand-pill" style={{ marginBottom: '0.75rem' }}>
            <UserPlus size={15} />
            <span>Create Account</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            Sign Up
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Register to get a Solana Wallet and manage SOL
          </p>
        </div>

        {error && (
          <div className="solana-alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group-custom">
            <label className="solana-input-label">Full Name</label>
            <div className="solana-input-icon-wrapper">
              <User className="input-svg-icon" />
              <input
                type="text"
                className="solana-input-field"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

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
              <span>Creating Account...</span>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Account & Send Code</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.85rem', color: '#94a3b8' }}>
          Already registered?{' '}
          <Link to="/login" className="solana-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
