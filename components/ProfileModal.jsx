'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { User as UserIcon, Camera, Save, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ProfileModal = ({ isOpen, onClose }) => {
    const { user, updateUserData } = useAuth();
    const { toastError, toastSuccess } = useToast();
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(user?.profilePhoto ? (user.profilePhoto.startsWith('/') ? user.profilePhoto : `/${user.profilePhoto}`) : null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    if (!isOpen || !user) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!fullName.trim()) {
            const msg = 'Full name is required.';
            setError(msg);
            toastError(msg);
            return;
        };

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('fullName', fullName.trim());
            if (file) {
                formData.append('profilePhoto', file);
            };

            const res = await axios.post('/api/user/profile/update', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data && res.data.flag && res.data.data) {
                updateUserData(res.data.data.user);
                const succMsg = res.data.msg || 'Profile updated successfully.';
                setSuccess(succMsg);
                toastSuccess(succMsg);
                setTimeout(() => {
                    onClose();
                }, 1200);
            } else {
                const errMsg = res.data?.msg || res.data?.message || 'Failed to update profile.';
                setError(errMsg);
                toastError(errMsg);
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Error updating profile.';
            setError(errMsg);
            toastError(errMsg);
        } finally {
            setLoading(false);
        };
    };

    return (
        <div className="solana-modal-overlay">
            <div className="solana-modal-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserIcon style={{ color: '#9945FF' }} size={20} />
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Edit Profile</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="solana-alert-danger">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="solana-alert-success">
                        <CheckCircle size={18} />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Avatar Preview"
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #9945FF' }}
                                />
                            ) : (
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(153,69,255,0.2)', border: '2px solid #9945FF', color: '#14F195', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800 }}>
                                    {fullName ? fullName[0].toUpperCase() : 'U'}
                                </div>
                            )}
                            <label
                                htmlFor="profilePhotoInput"
                                style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderRadius: '50%', background: '#9945FF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <Camera size={14} />
                            </label>
                            <input
                                id="profilePhotoInput"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="form-group-custom">
                        <label className="solana-input-label">Email Address</label>
                        <input
                            type="email"
                            className="solana-input-field"
                            value={user.email}
                            disabled
                            style={{ opacity: 0.6, cursor: 'not-allowed', paddingLeft: '1rem' }}
                        />
                    </div>

                    <div className="form-group-custom">
                        <label className="solana-input-label">Full Name</label>
                        <input
                            type="text"
                            className="solana-input-field"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            style={{ paddingLeft: '1rem' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <button type="button" onClick={onClose} className="solana-btn-outline" style={{ width: 'auto', padding: '0 1.25rem' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="solana-btn-primary" style={{ width: 'auto', padding: '0 1.5rem' }}>
                            {loading ? (
                                <span>Saving...</span>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};