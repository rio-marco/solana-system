import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { DepositSection } from '../components/DepositSection';
import { WithdrawSection } from '../components/WithdrawSection';
import { ArrowDownLeft, ArrowUpRight, Tag, ShieldCheck } from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('deposit');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      <Navbar />

      <main className="dashboard-container" style={{ flex: 1, width: '100%' }}>
        {/* Welcome Header Banner */}
        <div style={{ background: 'rgba(15,20,34,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '1.75rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="solana-brand-pill">SOLANA FINANCIAL HUB</span>
              {user?.is2FAEnabled && (
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'rgba(20,241,149,0.15)', color: '#14F195', border: '1px solid rgba(20,241,149,0.3)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <ShieldCheck size={12} />
                  2FA Active
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0 0 0.35rem 0' }}>
              Welcome, <span style={{ background: 'var(--solana-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.fullName || 'User'}</span>
            </h1>
            <div className="font-mono" style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={14} style={{ color: '#9945FF' }} />
              <span>User Memo ID:</span>
              <span style={{ background: 'rgba(153,69,255,0.2)', border: '1px solid rgba(153,69,255,0.3)', color: '#14F195', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                {user?.memo || 'N/A'}
              </span>
            </div>
          </div>

          {/* Account Wallet Balance Pill */}
          <div style={{ background: '#07090e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '18px', padding: '1rem 1.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
              Account Balance
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
              <span className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
                {user?.walletBalance !== undefined ? user.walletBalance.toFixed(4) : '0.0000'}
              </span>
              <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#14F195' }}>SOL</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('deposit')}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              border: activeTab === 'deposit' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === 'deposit' ? 'var(--solana-purple)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'deposit' ? '#fff' : '#94a3b8',
              boxShadow: activeTab === 'deposit' ? '0 4px 15px rgba(153,69,255,0.4)' : 'none',
            }}
          >
            <ArrowDownLeft size={16} />
            <span>Deposit SOL</span>
          </button>

          <button
            onClick={() => setActiveTab('withdraw')}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              border: activeTab === 'withdraw' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === 'withdraw' ? 'var(--solana-purple)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'withdraw' ? '#fff' : '#94a3b8',
              boxShadow: activeTab === 'withdraw' ? '0 4px 15px rgba(153,69,255,0.4)' : 'none',
            }}
          >
            <ArrowUpRight size={16} />
            <span>Withdraw SOL</span>
          </button>
        </div>

        {/* Tab View */}
        {activeTab === 'deposit' ? <DepositSection /> : <WithdrawSection />}
      </main>
    </div>
  );
};
