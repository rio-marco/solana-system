import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowUpRight, Send, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const WithdrawSection = () => {
  const { user, updateUserData } = useAuth();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  const fetchHistory = async () => {
    try {
      setFetchingHistory(true);
      const res = await axios.get('/api/withdraw/list');
      if (res.data && res.data.flag && res.data.data) {
        setWithdrawals(res.data.data.withdrawals || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numAmount = parseFloat(amount);
    if (!toAddress.trim()) {
      setError('Target Solana wallet address is required.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid SOL withdrawal amount.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/withdraw/create', {
        toAddress: toAddress.trim(),
        amount: numAmount,
        memo: memo.trim(),
      });

      if (res.data && res.data.flag) {
        setSuccess('Withdrawal transaction submitted and confirmed on Solana!');
        setToAddress('');
        setAmount('');
        setMemo('');
        if (res.data.data && res.data.data.updatedWalletBalance !== undefined) {
          updateUserData({ walletBalance: res.data.data.updatedWalletBalance });
        }
        fetchHistory();
      } else {
        setError(res.data.message || 'Withdrawal failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing Solana withdrawal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
      {/* Withdraw Form */}
      <div style={{ background: 'rgba(15,20,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9945FF', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          <ArrowUpRight size={18} />
          <span>Withdraw SOL</span>
        </div>

        {error && (
          <div className="solana-alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="solana-alert-success">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group-custom">
            <label className="solana-input-label">Recipient Solana Address</label>
            <input
              type="text"
              className="solana-input-field font-mono"
              placeholder="e.g. 7xKX...29Za"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}
              required
            />
          </div>

          <div className="form-group-custom">
            <label className="solana-input-label">Amount (SOL)</label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              className="solana-input-field font-mono"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ paddingLeft: '1rem' }}
              required
            />
          </div>

          <div className="form-group-custom">
            <label className="solana-input-label">Memo (Optional)</label>
            <input
              type="text"
              className="solana-input-field"
              placeholder="Transaction note"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}
            />
          </div>

          <button type="submit" disabled={loading} className="solana-btn-primary" style={{ marginTop: '0.5rem' }}>
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <Send size={16} />
                <span>Submit Withdrawal</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* History */}
      <div style={{ background: 'rgba(15,20,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '1.75rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>
          Recent Withdrawals
        </h3>

        {fetchingHistory ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b', fontSize: '0.85rem' }}>Loading history...</div>
        ) : withdrawals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b', fontSize: '0.8rem' }}>No withdrawal history recorded yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>ID</th>
                  <th style={{ padding: '0.5rem' }}>Recipient</th>
                  <th style={{ padding: '0.5rem' }}>Amount</th>
                  <th style={{ padding: '0.5rem' }}>TX</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w._id || w.withdrawId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="font-mono" style={{ padding: '0.75rem 0.5rem', color: '#9945FF' }}>{w.withdrawId}</td>
                    <td className="font-mono" style={{ padding: '0.75rem 0.5rem', color: '#94a3b8' }}>
                      {w.toAddress ? `${w.toAddress.slice(0, 5)}...${w.toAddress.slice(-4)}` : '-'}
                    </td>
                    <td className="font-mono" style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#fff' }}>{w.amount} SOL</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      {w.transactionSignature ? (
                        <a
                          href={`https://explorer.solana.com/tx/${w.transactionSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          className="solana-link font-mono"
                          style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        >
                          <span>{w.transactionSignature.slice(0, 5)}...</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: '#64748b' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
