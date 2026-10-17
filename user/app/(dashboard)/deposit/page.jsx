'use client';

import React from 'react';
import { DepositSection } from '../../../components/DepositSection';
import { TransactionListTable } from '../../../components/TransactionListTable';

export default function DepositPage() {
    return (
        <div className="deposit-withdraw-split">
            <DepositSection />
            <TransactionListTable type="deposit" />
        </div>
    );
};