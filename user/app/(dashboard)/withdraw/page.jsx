'use client';

import React from 'react';
import { WithdrawSection } from '../../../components/WithdrawSection';
import { TransactionListTable } from '../../../components/TransactionListTable';

export default function WithdrawPage() {
    return (
        <div className="deposit-withdraw-split">
            <WithdrawSection />
            <TransactionListTable type="withdraw" />
        </div>
    );
};