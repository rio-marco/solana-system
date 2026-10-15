'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    UserCog,
    Camera,
    Save,
    Mail,
    Phone,
    KeyRound,
} from 'lucide-react';
import {
    MANAGER_STATUS,
    EMAIL_REGEX,
    MANAGER,
    COUNTRY_CODES,
    COUNTRY_CODE_REGEX,
    PHONE_DIGITS_REGEX,
    DEFAULT_COUNTRY_CODE,
} from '../ui-constants.mjs';

function resolveInitialPhone(manager) {
    const raw = manager?.phoneNumber || '';
    let cc = manager?.countryCode || '';
    let num = raw;

    if (!cc) {
        const match = raw.match(/^\+\d{1,4}/);
        if (match) {
            cc = match[0];
            num = raw.slice(match[0].length);
        };
    };

    num = String(num).replace(/\D/g, '');

    if (!cc) cc = DEFAULT_COUNTRY_CODE;

    return { countryCode: cc, phoneNumber: num };
};

export default function ManagerModal({ manager, onConfirm, onClose, loading }) {
    const isEdit = Boolean(manager?._id);

    const initialPhone = resolveInitialPhone(manager);

    const [name, setName] = useState(manager?.name || '');
    const [email, setEmail] = useState(manager?.email || '');
    const [countryCode, setCountryCode] = useState(initialPhone.countryCode);
    const [phoneNumber, setPhoneNumber] = useState(initialPhone.phoneNumber);
    const [status, setStatus] = useState(
        manager?.status !== undefined && manager?.status !== null ? String(manager.status) : String(MANAGER_STATUS.INACTIVE)
    );
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(manager?.profilePhoto || '');

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

    const inputStyle = {
        width: '100%',
        background: '#FFFFFF',
        border: '1px solid #DEE2E6',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        color: '#212529',
        fontSize: '0.88rem',
        outline: 'none',
        fontFamily: 'inherit',
    };

    const cleanName = name.trim();
    const isNameValid = cleanName.length >= MANAGER.NAME_MIN_LENGTH && cleanName.length <= MANAGER.NAME_MAX_LENGTH;

    const cleanEmail = email.trim().toLowerCase();
    const isEmailValid = EMAIL_REGEX.test(cleanEmail);

    const cleanPhone = phoneNumber.trim();
    const isPhoneValid = cleanPhone === '' || (PHONE_DIGITS_REGEX.test(cleanPhone) && COUNTRY_CODE_REGEX.test(countryCode));

    const disabled = loading || !isNameValid || !isEmailValid || !isPhoneValid;

    const handleSubmit = () => {
        if (disabled) return;
        onConfirm({
            name: cleanName,
            email: cleanEmail,
            countryCode: cleanPhone ? countryCode : '',
            phoneNumber: cleanPhone,
            status: Number(status),
            file,
        });
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #DEE2E6', borderRadius: '10px', width: '100%', maxWidth: '560px', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.7)', maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(13,110,253,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UserCog size={20} style={{ color: '#0D6EFD' }} />
                    </div>
                    <div>
                        <h3 style={{ color: '#212529', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>
                            {isEdit ? 'Edit Manager' : 'Create Manager'}
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0 }}>
                            {isEdit ? 'Update manager account details' : 'Add a new manager to the platform'}
                        </p>
                    </div>
                </div>

                {/* Profile Photo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    {preview ? (
                        <img
                            src={preview}
                            alt={cleanName || 'Manager'}
                            style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #DEE2E6', flexShrink: 0 }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    ) : (
                        <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#E7F1FF', color: '#0D6EFD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', fontWeight: 700, border: '1px solid #9EC5FE', flexShrink: 0 }}>
                            {cleanName.charAt(0).toUpperCase() || '?'}
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
                            Optional. JPG, PNG, WEBP or GIF.
                        </p>
                    </div>
                </div>

                {/* Name */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', color: '#171D25', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        maxLength={MANAGER.NAME_MAX_LENGTH}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter manager name"
                        style={{ ...inputStyle, border: `1px solid ${name && !isNameValid ? '#ef4444' : '#DEE2E6'}` }}
                    />
                    {name && !isNameValid && (
                        <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.4rem 0 0' }}>
                            Name must be between {MANAGER.NAME_MIN_LENGTH} and {MANAGER.NAME_MAX_LENGTH} characters.
                        </p>
                    )}
                </div>

                {/* Email */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', color: '#171D25', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Email <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                        <Mail size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="manager@example.com"
                            disabled={isEdit}
                            style={{ ...inputStyle, paddingLeft: '2.4rem', background: isEdit ? '#F5F9FC' : '#FFFFFF', cursor: isEdit ? 'not-allowed' : 'text', border: `1px solid ${email && !isEmailValid ? '#ef4444' : '#DEE2E6'}` }}
                        />
                    </div>
                    {email && !isEmailValid ? (
                        <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.4rem 0 0' }}>
                            Please enter a valid email address.
                        </p>
                    ) : (
                        <p style={{ color: '#94a3b8', fontSize: '0.72rem', margin: '0.4rem 0 0' }}>
                            Must be unique.
                        </p>
                    )}
                </div>

                {/* Phone */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', color: '#171D25', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Phone Number
                    </label>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            style={{ ...inputStyle, width: '170px', flexShrink: 0, cursor: 'pointer', padding: '0.75rem 0.6rem' }}
                        >
                            {COUNTRY_CODES.map((country) => (
                                <option key={`${country.code}-${country.dial}`} value={country.dial}>
                                    {country.dial} · {country.name}
                                </option>
                            ))}
                        </select>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Phone size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                inputMode="numeric"
                                value={phoneNumber}
                                maxLength={15}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                placeholder="5551234567"
                                style={{ ...inputStyle, paddingLeft: '2.4rem', border: `1px solid ${phoneNumber && !isPhoneValid ? '#ef4444' : '#DEE2E6'}` }}
                            />
                        </div>
                    </div>
                    {phoneNumber && !isPhoneValid && (
                        <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.4rem 0 0' }}>
                            Please enter a valid phone number.
                        </p>
                    )}
                </div>

                {/* Status */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', color: '#171D25', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Status <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                        <option value={String(MANAGER_STATUS.INACTIVE)}>Inactive</option>
                        <option value={String(MANAGER_STATUS.ACTIVE)}>Active</option>
                        <option value={String(MANAGER_STATUS.SUSPENDED)}>Suspended</option>
                    </select>
                </div>

                {/* Password notice */}
                <div style={{ background: 'rgba(13,110,253,0.06)', border: '1px solid rgba(13,110,253,0.2)', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.6rem' }}>
                    <KeyRound size={16} style={{ color: '#0D6EFD', flexShrink: 0, marginTop: '0.1rem' }} />
                    <p style={{ color: '#334155', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
                        {isEdit
                            ? 'The password is not editable here. It remains securely hashed and is unchanged.'
                            : `A ${MANAGER.PASSWORD_LENGTH}-character password will be auto-generated and emailed to the manager. It is stored only in encrypted (hashed) form.`}
                    </p>
                </div>

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
                        {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Manager')}
                    </button>
                </div>
            </div>
        </div>
    );
};