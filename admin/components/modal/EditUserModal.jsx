'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    UserCog,
    Camera,
    Save,
    ShieldCheck,
} from 'lucide-react';
import { TWOFA_STATUS } from '../ui-constants.mjs';

export default function EditUserModal({ user, onConfirm, onClose, loading }) {
    const [fullName, setFullName] = useState(user?.fullName || '');
    // const [twoFAStatus, setTwoFAStatus] = useState(
    //     user?.twoFAStatus === TWOFA_STATUS.ENABLED ? String(TWOFA_STATUS.ENABLED) : String(TWOFA_STATUS.DISABLED)
    // );
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(user?.profilePhoto || '');
    const fileInputRef = useRef(null);
    const objectUrlRef = useRef(null);

    useEffect(() => {
        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            };
        };
    }, []);

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
        };

        const url = URL.createObjectURL(selected);
        objectUrlRef.current = url;

        setFile(selected);
        setPreview(url);
    };

    const handleSubmit = () => {
        onConfirm({
            fullName: fullName.trim(),
            // twoFAStatus: Number(twoFAStatus),
            file,
        });
    };

    const isNameValid = /^[a-zA-Z\s]{2,60}$/.test(fullName.trim());
    const disabled = loading || !isNameValid;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #DEE2E6', borderRadius: '10px', width: '100%', maxWidth: '520px', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.7)', maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(13,110,253,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UserCog size={20} style={{ color: '#0D6EFD' }} />
                    </div>
                    <div>
                        <h3 style={{ color: '#212529', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>Edit User Details</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0 }}>{user?.email}</p>
                    </div>
                </div>

                {/* Profile Photo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    {preview ? (
                        <img
                            src={preview}
                            alt={user?.fullName || 'Profile'}
                            style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #DEE2E6', flexShrink: 0 }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    ) : (
                        <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#E7F1FF', color: '#0D6EFD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', fontWeight: 700, border: '1px solid #9EC5FE', flexShrink: 0 }}>
                            {(fullName || '').charAt(0).toUpperCase() || '?'}
                        </div>
                    )}
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#F5F9FC', border: '1px solid #D8DFE4', color: '#212529', padding: '0.55rem 1rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600 }}
                        >
                            <Camera size={15} /> {file ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        <p style={{ color: '#94a3b8', fontSize: '0.72rem', margin: '0.4rem 0 0' }}>
                            JPG, PNG, WEBP or GIF. Leave empty to keep current photo.
                        </p>
                    </div>
                </div>

                {/* Full Name */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', color: '#171D25', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter full name"
                        style={{
                            width: '100%',
                            background: '#FFFFFF',
                            border: `1px solid ${fullName && !isNameValid ? '#ef4444' : '#DEE2E6'}`,
                            borderRadius: '12px',
                            padding: '0.75rem 1rem',
                            color: '#212529',
                            fontSize: '0.88rem',
                            outline: 'none',
                        }}
                    />
                    {fullName && !isNameValid && (
                        <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.4rem 0 0' }}>
                            Name must be 2-60 characters and contain only letters and spaces.
                        </p>
                    )}
                </div>

                {/* 2FA Status */}
                {/* <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: '#171D25', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Two-Factor Authentication (2FA)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <ShieldCheck size={16} style={{ color: twoFAStatus === String(TWOFA_STATUS.ENABLED) ? '#198754' : '#94a3b8' }} />
                        <select
                            value={twoFAStatus}
                            onChange={(e) => setTwoFAStatus(e.target.value)}
                            style={{
                                flex: 1,
                                background: '#FFFFFF',
                                border: '1px solid #DEE2E6',
                                borderRadius: '12px',
                                padding: '0.75rem 1rem',
                                color: '#212529',
                                fontSize: '0.88rem',
                                outline: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            <option value={String(TWOFA_STATUS.DISABLED)}>Disabled (OFF)</option>
                            <option value={String(TWOFA_STATUS.ENABLED)}>Enabled (ON)</option>
                        </select>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.72rem', margin: '0.4rem 0 0' }}>
                        Disabling clears the stored 2FA secret. Enabling only works if the user has already configured 2FA.
                    </p>
                </div> */}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#F5F9FC', border: '1px solid #D8DFE4', color: '#212529', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.88rem' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={disabled}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: 'linear-gradient(135deg, #0D6EFD 0%, #0a58ca 100%)', border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.88rem', opacity: disabled ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <Save size={15} />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};
