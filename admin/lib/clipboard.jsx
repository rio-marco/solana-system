'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const copyTextToClipboard = async (text) => {
    if (typeof window !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            // Fallback
        };
    };

    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        return false;
    };
};

export function CopyButton({ text, className = '' }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!text) return;
        const ok = await copyTextToClipboard(text);
        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            title="Copy to clipboard"
            className={className}
            style={{
                background: copied ? 'rgba(20, 241, 149, 0.15)' : '#E7F1FF',
                border: copied ? '1px solid rgba(20, 241, 149, 0.3)' : '1px solid #DEE2E6',
                color: copied ? '#14F195' : '#0D6EFD',
                borderRadius: '8px',
                padding: '0.35rem 0.55rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
            }}
        >
            {copied ? <Check size={13} style={{ color: '#14F195' }} /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
    );
};