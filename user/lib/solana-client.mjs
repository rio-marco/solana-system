export const LAMPORTS_PER_SOL = 1000000000;

export const DEFAULT_MAX_DEPOSIT_SOL = 10000;

export const SOLANA_NETWORKS = {
    DEVNET: 'devnet',
    TESTNET: 'testnet',
    MAINNET: 'mainnet-beta',
};

export const shortAddress = (address, start = 4, end = 4) => {
    if (!address || typeof address !== 'string') return '';
    if (address.length <= start + end + 3) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export const sanitizeSolInput = (value) => {
    let clean = String(value ?? '').replace(/[^0-9.]/g, '');

    const parts = clean.split('.');
    if (parts.length > 2) {
        clean = `${parts[0]}.${parts.slice(1).join('')}`;
    };

    const [intPart, decPart] = clean.split('.');
    if (decPart !== undefined && decPart.length > 9) {
        clean = `${intPart}.${decPart.slice(0, 9)}`;
    };

    return clean;
};

export const solToLamports = (amountStr) => {
    const str = String(amountStr).trim();
    const [intPart, decPart = ''] = str.split('.');
    const paddedDecimals = (decPart + '000000000').slice(0, 9);
    const normalizedInt = intPart && intPart.length > 0 ? intPart : '0';

    return BigInt(normalizedInt + paddedDecimals);
};

export const lamportsToSol = (lamports) => Number(BigInt(lamports)) / LAMPORTS_PER_SOL;

export const parseSolAmount = (value, maxSol = DEFAULT_MAX_DEPOSIT_SOL) => {
    const raw = String(value ?? '').trim();

    if (!raw) {
        return { isValid: false, error: 'Please enter a deposit amount.' };
    };

    if (!/^\d+(\.\d{1,9})?$/.test(raw)) {
        return { isValid: false, error: 'Enter a valid SOL amount (numbers only, up to 9 decimals).' };
    };

    const numericAmount = Number(raw);

    if (!Number.isFinite(numericAmount)) {
        return { isValid: false, error: 'Enter a valid SOL amount.' };
    };

    if (numericAmount <= 0) {
        return { isValid: false, error: 'Amount must be greater than 0.' };
    };

    if (numericAmount > maxSol) {
        return { isValid: false, error: `Amount exceeds the maximum deposit limit of ${maxSol} SOL.` };
    };

    let lamports;

    try {
        lamports = solToLamports(raw);
    } catch (e) {
        return { isValid: false, error: 'Amount exceeds the supported SOL precision (9 decimal places).' };
    };

    if (lamports <= BigInt(0)) {
        return { isValid: false, error: 'Amount must be greater than 0.' };
    };

    return { isValid: true, numericAmount, lamports };
};

export const getExplorerTxUrl = (signature, network = 'devnet') => {
    const normalized = (network || 'devnet').toLowerCase();
    const cluster = normalized === SOLANA_NETWORKS.MAINNET ? '' : `?cluster=${normalized}`;

    return `https://explorer.solana.com/tx/${signature}${cluster}`;
};

export const isValidSolanaAddress = (address) => {
    if (!address || typeof address !== 'string') return false;
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address.trim());
};

export const buildSolanaPayUrl = (address, { memo, label, message, amount } = {}) => {
    if (!address || typeof address !== 'string') return '';

    const params = new URLSearchParams();

    if (memo) params.set('memo', String(memo));
    if (label) params.set('label', String(label));
    if (message) params.set('message', String(message));
    if (amount) params.set('amount', String(amount));

    const query = params.toString();

    return query ? `solana:${address.trim()}?${query}` : `solana:${address.trim()}`;
};