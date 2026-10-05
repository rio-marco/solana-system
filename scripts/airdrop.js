'use strict';

const mongoose = require('mongoose');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
require('dotenv').config();

const connectDatabase = require('../config/database');
const Setting = require('../models/setting.model');
const generalLib = require('../utils/lib/general.lib');

const DEVNET_RPCS = [
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'https://rpc.ankr.com/solana_devnet',
    'https://api.devnet.solana.com',
];

(async () => {
    try {
        await connectDatabase();

        const senderPubStr = (await Setting.getVal('SOLANA_SENDER_PUBLIC_KEY')) || process.env.SOLANA_SENDER_PUBLIC_KEY;

        if (!senderPubStr || senderPubStr.startsWith('YOUR_')) {
            generalLib.log1(["❌ Error: SOLANA_SENDER_PUBLIC_KEY is not configured in Database setting."]);
            generalLib.log1(['Please run "npm run create-wallet" first.']);
            await mongoose.disconnect();
            process.exit(1);
        };

        const senderPubKey = new PublicKey(senderPubStr);
        let success = false;

        for (const rpcUrl of DEVNET_RPCS) {
            try {
                const connection = new Connection(rpcUrl, 'confirmed');

                const signature = await connection.requestAirdrop(senderPubKey, 1 * LAMPORTS_PER_SOL);

                const latestBlockhash = await connection.getLatestBlockhash();
                await connection.confirmTransaction({
                    signature,
                    blockhash: latestBlockhash.blockhash,
                    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
                }, 'confirmed');

                const newBalance = await connection.getBalance(senderPubKey);
                generalLib.log1(['\n✅ Airdrop Successful!']);
                generalLib.log1([`New Sender Wallet Balance: ${newBalance / LAMPORTS_PER_SOL} SOL\n`]);
                success = true;
                break;
            } catch (err) {
                console.warn(`  ⚠️ RPC (${rpcUrl}) airdrop attempt failed: ${err.message}`);
            };
        };

        if (!success) {
            generalLib.log1(['\n❌ All automatic RPC airdrop attempts failed (Public Devnet RPCs are rate-limited).']);
            generalLib.log1([`You can manually request SOL at https://faucet.solana.com/ for sender address: ${senderPubStr}`]);
        };

        await mongoose.disconnect();
        process.exit(success ? 0 : 1);
    } catch (err) {
        generalLib.log1(["❌ Error running airdrop script:", err.message]);
        process.exit(1);
    }
})();
