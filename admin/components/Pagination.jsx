'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_CURRENT_PAGE, DEFAULT_ITEM_PER_PAGE } from './ui-constants.mjs';

export function getPageNumbers(totalPages, currentPage, maxVisible = 5) {
    if (!totalPages || totalPages < 1) return [];

    if (totalPages <= maxVisible + 2) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    };

    const pages = [1];
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(2, currentPage - half);
    let end = Math.min(totalPages - 1, currentPage + half);

    if (currentPage - 1 <= half) {
        end = Math.min(totalPages - 1, maxVisible);
    };

    if (totalPages - currentPage <= half) {
        start = Math.max(2, totalPages - maxVisible + 1);
    };

    if (start > 2) pages.push('...');

    for (let i = start; i <= end; i++) {
        pages.push(i);
    };

    if (end < totalPages - 1) pages.push('...');

    pages.push(totalPages);

    return pages;
};

const THEMES = {
    light: {
        infoColor: '#6C757D',
        strongColor: '#212529',
        borderTop: '1px solid #DEE2E6',
        buttonBg: '#F5F9FC',
        buttonBorder: '1px solid #D8DFE4',
        buttonColor: '#212529',
        navColor: '#475569',
        disabledColor: '#cbd5e1',
        ellipsisColor: '#cbd5e1',
        activeBg: 'rgb(13, 110, 253)',
        activeColor: '#FFFFFF',
        activeShadow: 'none',
    },
    dark: {
        infoColor: '#94a3b8',
        strongColor: '#ffffff',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        buttonBg: 'rgba(255, 255, 255, 0.05)',
        buttonBorder: '1px solid rgba(255, 255, 255, 0.12)',
        buttonColor: '#cbd5e1',
        navColor: '#cbd5e1',
        disabledColor: '#475569',
        ellipsisColor: '#64748b',
        activeBg: 'linear-gradient(135deg, #00C2FF 0%, #9945FF 100%)',
        activeColor: '#ffffff',
        activeShadow: '0 4px 14px rgba(153, 69, 255, 0.4)',
    },
};

/**
 * Common pagination controls for all admin list views.
 *
 * @param {number}   currentPage     Active page (1-based).
 * @param {number}   totalPages      Total number of pages.
 * @param {number}   totalCount      Total number of records.
 * @param {number}   limit           Records per page.
 * @param {function} onPageChange    Called with the requested page number.
 * @param {boolean}  loading         Disables controls while a request is in flight.
 * @param {'light'|'dark'} theme     Colour theme.
 * @param {string}   itemLabel       Noun for the record count, e.g. "users".
 * @param {boolean}  showInfo        Toggle the "Showing X to Y of Z" label.
 * @param {number}   maxVisible      Max numeric page buttons before ellipsis.
 * @param {number}   size            Button size in px.
 * @param {string}   activeBg        Override the active page button background.
 */
export function Pagination({
    currentPage = DEFAULT_CURRENT_PAGE,
    totalPages = 0,
    totalCount = 0,
    limit = DEFAULT_ITEM_PER_PAGE,
    onPageChange,
    loading = false,
    theme = 'light',
    itemLabel = 'entries',
    showInfo = true,
    maxVisible = 5,
    size = 36,
    activeBg,
    activeColor,
    activeShadow,
    style,
}) {
    const t = THEMES[theme] || THEMES.light;

    if (!totalCount || totalCount <= 0) return null;

    const startEntry = (currentPage - 1) * limit + 1;
    const endEntry = Math.min(currentPage * limit, totalCount);
    const pages = getPageNumbers(totalPages, currentPage, maxVisible);

    const go = (page) => {
        if (typeof onPageChange !== 'function') return;
        if (loading) return;
        if (page < 1 || page > totalPages || page === currentPage) return;
        onPageChange(page);
    };

    const canPrev = currentPage > 1 && !loading;
    const canNext = currentPage < totalPages && !loading;
    const iconSize = Math.round(size * 0.44);

    const navButtonStyle = (enabled) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        padding: 0,
        borderRadius: '10px',
        background: t.buttonBg,
        border: t.buttonBorder,
        color: enabled ? t.navColor : t.disabledColor,
        cursor: enabled ? 'pointer' : 'not-allowed',
        transition: 'all 0.2s ease',
    });

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: t.borderTop,
                flexWrap: 'wrap',
                gap: '1rem',
                ...style,
            }}
        >
            {showInfo && (
                <div style={{ fontSize: '0.85rem', color: t.infoColor }}>
                    Showing <strong style={{ color: t.strongColor }}>{startEntry}</strong> to{' '}
                    <strong style={{ color: t.strongColor }}>{endEntry}</strong> of{' '}
                    <strong style={{ color: t.strongColor }}>{totalCount}</strong> {itemLabel}
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                    type="button"
                    onClick={() => go(currentPage - 1)}
                    disabled={!canPrev}
                    style={navButtonStyle(canPrev)}
                    title="Previous Page"
                    aria-label="Previous Page"
                >
                    <ChevronLeft size={iconSize} />
                </button>

                {pages.map((page, idx) => {
                    if (page === '...') {
                        return (
                            <span
                                key={`ellipsis-${idx}`}
                                style={{ width: '32px', textAlign: 'center', color: t.ellipsisColor }}
                            >
                                ...
                            </span>
                        );
                    };

                    const isActive = page === currentPage;

                    return (
                        <button
                            key={`page-${page}`}
                            type="button"
                            onClick={() => go(page)}
                            disabled={loading || isActive}
                            style={{
                                minWidth: `${size}px`,
                                height: `${size}px`,
                                padding: '0 0.5rem',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                background: isActive ? (activeBg || t.activeBg) : t.buttonBg,
                                color: isActive ? (activeColor || t.activeColor) : t.buttonColor,
                                border: isActive ? 'none' : t.buttonBorder,
                                fontWeight: isActive ? 800 : 500,
                                cursor: isActive ? 'default' : 'pointer',
                                boxShadow: isActive ? (activeShadow ?? t.activeShadow) : 'none',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {page}
                        </button>
                    );
                })}

                <button
                    type="button"
                    onClick={() => go(currentPage + 1)}
                    disabled={!canNext}
                    style={navButtonStyle(canNext)}
                    title="Next Page"
                    aria-label="Next Page"
                >
                    <ChevronRight size={iconSize} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;