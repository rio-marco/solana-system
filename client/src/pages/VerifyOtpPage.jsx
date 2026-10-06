import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Check, AlertCircle, Copy, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { copyTextToClipboard } from '../utils/clipboard';

export const VerifyOtpPage = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recoveryPhrase, setRecoveryPhrase] = useState(null);
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const { checkAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/auth/verify-otp', { email, otp });
      if (res.data && res.data.flag) {
        if (res.data.data && res.data.data.recoveryPhrase) {
          setRecoveryPhrase(res.data.data.recoveryPhrase);
        } else {
          await checkAuth();
          navigate('/');
        }
      } else {
        setError(res.data.message || 'OTP verification failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToDashboard = async () => {
    await checkAuth();
    navigate('/');
  };

  const copyPhrase = async () => {
    if (recoveryPhrase) {
      const ok = await copyTextToClipboard(recoveryPhrase);
      if (ok) {
        setCopiedPhrase(true);
        setTimeout(() => setCopiedPhrase(false), 2000);
      }
    }
  };

  const words = recoveryPhrase ? recoveryPhrase.split(' ') : [];

  return (
    <div className="auth-page-wrapper">
      <div className="solana-auth-card">
        {!recoveryPhrase ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div className="solana-brand-pill" style={{ marginBottom: '0.75rem' }}>
                <ShieldCheck size={15} />
                <span>Email Verification</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
                Verification Code
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                We sent a 6-digit OTP code to:<br />
                <strong className="font-mono" style={{ color: '#00C2FF' }}>{email}</strong>
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
                <label className="solana-input-label" style={{ textAlign: 'center' }}>6-Digit OTP Code</label>
                <input
                  type="text"
                  className="solana-input-field otp-input-field"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="solana-btn-primary" style={{ marginTop: '0.75rem' }}>
                {loading ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Verify OTP & Login</span>
                  </>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.85rem', color: '#94a3b8' }}>
              Need to sign in with email?{' '}
              <Link to="/login" className="solana-link">
                Go to Login
              </Link>
            </div>
          </>
        ) : (
          /* Mnemonic phrase display */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div className="solana-brand-pill" style={{ color: '#F59E0B', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)' }}>
                <Key size={15} />
                <span>Secret Recovery Phrase</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginTop: '0.5rem' }}>
                Save Your 12 Words
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem', lineHeight: 1.4 }}>
                Important: Write down these 12 words and store them safely. This is the ONLY way to recover your account if you lose email access.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
              {words.map((w, i) => (
                <div key={i} className="font-mono" style={{ background: '#07090e', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', borderRadius: '10px', fontSize: '0.8rem', color: '#14F195', textAlign: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: '0.7rem', marginRight: '4px' }}>{i + 1}.</span>{w}
                </div>
              ))}
            </div>

            <button onClick={copyPhrase} className="solana-btn-outline" style={{ marginBottom: '1rem' }}>
              <Copy size={16} />
              <span>{copiedPhrase ? 'Copied All 12 Words!' : 'Copy All 12 Words'}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <input
                type="checkbox"
                id="phraseConfirm"
                checked={confirmedCheck}
                onChange={(e) => setConfirmedCheck(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#14F195' }}
              />
              <label htmlFor="phraseConfirm" style={{ fontSize: '0.78rem', color: '#94a3b8', cursor: 'pointer' }}>
                I have written down / copied my 12-word recovery phrase and stored it safely.
              </label>
            </div>

            <button
              onClick={handleContinueToDashboard}
              disabled={!confirmedCheck}
              className="solana-btn-primary"
            >
              <Check size={18} />
              <span>Go to Dashboard</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
