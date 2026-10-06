import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { DepositSection } from '../components/DepositSection';
import { WithdrawSection } from '../components/WithdrawSection';
import { TransactionListTable } from '../components/TransactionListTable';

export const DashboardPage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      <Navbar />

      <main className="dashboard-container" style={{ flex: 1, width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
          <div>
            <DepositSection onDepositSuccess={triggerRefresh} />
          </div>
          <div>
            <WithdrawSection onWithdrawSuccess={triggerRefresh} />
          </div>
        </div>

        <TransactionListTable refreshTrigger={refreshTrigger} />
      </main>
    </div>
  );
};
