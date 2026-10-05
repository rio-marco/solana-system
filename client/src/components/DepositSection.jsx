import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Wallet, Copy, Check, RefreshCw, AlertCircle, ArrowDownLeft } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const DepositSection = () => {
  const [addressData, setAddressData] = useState({ address: '', exists: false });
  const [balanceData, setBalanceData] = useState({ balance: 0, currency: 'SOL' });
  const [copied, setCopied] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState(null);
  const socket = useSocket();

  const fetchDepositAddress = async (forceGen = false) => {
    try {
      setLoadingAddress(true);
      setError(null);
      const url = forceGen ? '/api/deposit/address?generate=true' : '/api/deposit/address';
      const res = await axios.get(url);
      if (res.data && res.data.flag && res.data.data) {
        setAddressData({
          address: res.data.data.address || '',
          exists: res.data.data.exists || false,
        });
      }
    } catch (err) {
      setError('Failed to fetch platform deposit address.');
    } finally {
      setLoadingAddress(false);
    }
  };

  const fetchBalance = async () => {
    try {
      setLoadingBalance(true);
      const res = await axios.get('/api/deposit/balance');
      if (res.data && res.data.flag && res.data.data) {
        setBalanceData({
          balance: res.data.data.balance || 0,
          currency: res.data.data.currency || 'SOL',
        });
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    fetchDepositAddress();
    fetchBalance();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('depositStatusUpdated', () => {
        fetchBalance();
      });

      return () => {
        socket.off('depositStatusUpdated');
      };
    }
  }, [socket]);

  const copyToClipboard = () => {
    if (addressData.address) {
      navigator.clipboard.writeText(addressData.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Wallet Balance Card */}
      <div style={{ background: 'rgba(15,20,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9945FF', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
              <Wallet size={16} />
              <span>Platform Receiving Wallet</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{loadingBalance ? '...' : balanceData.balance.toFixed(4)}</span>
              <span className="font-mono" style={{ fontSize: '1.25rem', color: '#14F195' }}>SOL</span>
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Live On-Chain Balance</p>
          </div>

          <button
            onClick={fetchBalance}
            disabled={loadingBalance}
            className="solana-btn-outline"
            style={{ width: 'auto', padding: '0 1rem', height: '38px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={loadingBalance ? 'animate-spin' : ''} />
            <span>Refresh Balance</span>
          </button>
        </div>

        {/* Deposit Address Box */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="solana-input-label" style={{ marginBottom: 0 }}>Deposit Address</span>
            <button
              onClick={() => fetchDepositAddress(true)}
              disabled={loadingAddress}
              style={{ background: 'none', border: 'none', color: '#9945FF', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Generate New
            </button>
          </div>

          {error && (
            <div className="solana-alert-danger" style={{ padding: '0.5rem 0.75rem', marginBottom: '0.75rem' }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="font-mono" style={{ flex: 1, minWidth: '240px', background: '#07090e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#14F195', wordBreak: 'break-all' }}>
              {addressData.address || (loadingAddress ? 'Generating address...' : 'No address generated')}
            </div>
            <button
              onClick={copyToClipboard}
              disabled={!addressData.address}
              className="solana-btn-primary"
              style={{ width: 'auto', padding: '0 1.5rem', height: '44px' }}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* QR Code & Guide */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: 'rgba(15,20,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>
            Scan QR Code to Pay
          </span>
          {addressData.address ? (
            <div style={{ padding: '0.75rem', background: '#fff', borderRadius: '16px' }}>
              <QRCodeSVG value={addressData.address} size={150} />
            </div>
          ) : (
            <div style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#64748b' }}>
              No Address
            </div>
          )}
        </div>

        <div style={{ background: 'rgba(15,20,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#14F195', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            <ArrowDownLeft size={18} />
            <span>Deposit Instructions</span>
          </div>
          <ul style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6, paddingLeft: '1.25rem' }}>
            <li>Send SOL to the displayed platform deposit address on Solana Devnet.</li>
            <li>Deposits are automatically verified on-chain.</li>
            <li>Real-time websocket socket alerts will update your balance upon confirmation.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
