/**
 * ui-constants.js — Client-safe constants (ES Module)
 * Placed in components/ so Next.js webpack treats it as ESM (not CJS).
 * Import this in React client components.
 */

export const DEFAULT_ITEM_PER_PAGE = 10;
export const DEFAULT_CURRENT_PAGE = 1;

export const USER_STATUS = {
    INACTIVE: 1,
    ACTIVE: 2,
    SUSPENDED: 3,
};

export const MANAGER_STATUS = {
    INACTIVE: 0,
    ACTIVE: 1,
    SUSPENDED: 2,
};

export const TWOFA_STATUS = {
    DISABLED: 0,
    ENABLED: 1,
};

export const TRX_TYPE = {
    DEPOSIT: 0,
    WITHDRAW: 1,
};

export const DEPOSIT_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    FAILED: 'FAILED',
};

export const WITHDRAW_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    FAILED: 'FAILED',
};

export const CAMPAIGN = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 120,
    MAX_COMMENTS: 100,
    COMMENT_MAX_LENGTH: 500,
};

export const PHONE_REGEX = /^\+?[0-9][0-9\s\-()]{6,19}$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

export const COUNTRY_CODE_REGEX = /^\+\d{1,4}$/;
export const PHONE_DIGITS_REGEX = /^\d{6,15}$/;
export const DEFAULT_COUNTRY_CODE = '+1';

export const COUNTRY_CODES = [
    { code: 'US', name: 'United States', dial: '+1' },
    { code: 'CA', name: 'Canada', dial: '+1' },
    { code: 'GB', name: 'United Kingdom', dial: '+44' },
    { code: 'AU', name: 'Australia', dial: '+61' },
    { code: 'IN', name: 'India', dial: '+91' },
    { code: 'AE', name: 'United Arab Emirates', dial: '+971' },
    { code: 'AF', name: 'Afghanistan', dial: '+93' },
    { code: 'AL', name: 'Albania', dial: '+355' },
    { code: 'DZ', name: 'Algeria', dial: '+213' },
    { code: 'AR', name: 'Argentina', dial: '+54' },
    { code: 'AM', name: 'Armenia', dial: '+374' },
    { code: 'AT', name: 'Austria', dial: '+43' },
    { code: 'AZ', name: 'Azerbaijan', dial: '+994' },
    { code: 'BH', name: 'Bahrain', dial: '+973' },
    { code: 'BD', name: 'Bangladesh', dial: '+880' },
    { code: 'BY', name: 'Belarus', dial: '+375' },
    { code: 'BE', name: 'Belgium', dial: '+32' },
    { code: 'BR', name: 'Brazil', dial: '+55' },
    { code: 'BG', name: 'Bulgaria', dial: '+359' },
    { code: 'CL', name: 'Chile', dial: '+56' },
    { code: 'CN', name: 'China', dial: '+86' },
    { code: 'CO', name: 'Colombia', dial: '+57' },
    { code: 'HR', name: 'Croatia', dial: '+385' },
    { code: 'CY', name: 'Cyprus', dial: '+357' },
    { code: 'CZ', name: 'Czechia', dial: '+420' },
    { code: 'DK', name: 'Denmark', dial: '+45' },
    { code: 'EG', name: 'Egypt', dial: '+20' },
    { code: 'EE', name: 'Estonia', dial: '+372' },
    { code: 'FI', name: 'Finland', dial: '+358' },
    { code: 'FR', name: 'France', dial: '+33' },
    { code: 'GE', name: 'Georgia', dial: '+995' },
    { code: 'DE', name: 'Germany', dial: '+49' },
    { code: 'GH', name: 'Ghana', dial: '+233' },
    { code: 'GR', name: 'Greece', dial: '+30' },
    { code: 'HK', name: 'Hong Kong', dial: '+852' },
    { code: 'HU', name: 'Hungary', dial: '+36' },
    { code: 'IS', name: 'Iceland', dial: '+354' },
    { code: 'ID', name: 'Indonesia', dial: '+62' },
    { code: 'IR', name: 'Iran', dial: '+98' },
    { code: 'IQ', name: 'Iraq', dial: '+964' },
    { code: 'IE', name: 'Ireland', dial: '+353' },
    { code: 'IL', name: 'Israel', dial: '+972' },
    { code: 'IT', name: 'Italy', dial: '+39' },
    { code: 'JP', name: 'Japan', dial: '+81' },
    { code: 'JO', name: 'Jordan', dial: '+962' },
    { code: 'KZ', name: 'Kazakhstan', dial: '+7' },
    { code: 'KE', name: 'Kenya', dial: '+254' },
    { code: 'KW', name: 'Kuwait', dial: '+965' },
    { code: 'LV', name: 'Latvia', dial: '+371' },
    { code: 'LB', name: 'Lebanon', dial: '+961' },
    { code: 'LT', name: 'Lithuania', dial: '+370' },
    { code: 'LU', name: 'Luxembourg', dial: '+352' },
    { code: 'MY', name: 'Malaysia', dial: '+60' },
    { code: 'MV', name: 'Maldives', dial: '+960' },
    { code: 'MT', name: 'Malta', dial: '+356' },
    { code: 'MX', name: 'Mexico', dial: '+52' },
    { code: 'MD', name: 'Moldova', dial: '+373' },
    { code: 'MN', name: 'Mongolia', dial: '+976' },
    { code: 'MA', name: 'Morocco', dial: '+212' },
    { code: 'MM', name: 'Myanmar', dial: '+95' },
    { code: 'NP', name: 'Nepal', dial: '+977' },
    { code: 'NL', name: 'Netherlands', dial: '+31' },
    { code: 'NZ', name: 'New Zealand', dial: '+64' },
    { code: 'NG', name: 'Nigeria', dial: '+234' },
    { code: 'NO', name: 'Norway', dial: '+47' },
    { code: 'OM', name: 'Oman', dial: '+968' },
    { code: 'PK', name: 'Pakistan', dial: '+92' },
    { code: 'PS', name: 'Palestine', dial: '+970' },
    { code: 'PA', name: 'Panama', dial: '+507' },
    { code: 'PE', name: 'Peru', dial: '+51' },
    { code: 'PH', name: 'Philippines', dial: '+63' },
    { code: 'PL', name: 'Poland', dial: '+48' },
    { code: 'PT', name: 'Portugal', dial: '+351' },
    { code: 'QA', name: 'Qatar', dial: '+974' },
    { code: 'RO', name: 'Romania', dial: '+40' },
    { code: 'RU', name: 'Russia', dial: '+7' },
    { code: 'SA', name: 'Saudi Arabia', dial: '+966' },
    { code: 'RS', name: 'Serbia', dial: '+381' },
    { code: 'SG', name: 'Singapore', dial: '+65' },
    { code: 'SK', name: 'Slovakia', dial: '+421' },
    { code: 'SI', name: 'Slovenia', dial: '+386' },
    { code: 'ZA', name: 'South Africa', dial: '+27' },
    { code: 'KR', name: 'South Korea', dial: '+82' },
    { code: 'ES', name: 'Spain', dial: '+34' },
    { code: 'LK', name: 'Sri Lanka', dial: '+94' },
    { code: 'SE', name: 'Sweden', dial: '+46' },
    { code: 'CH', name: 'Switzerland', dial: '+41' },
    { code: 'TW', name: 'Taiwan', dial: '+886' },
    { code: 'TH', name: 'Thailand', dial: '+66' },
    { code: 'TR', name: 'Turkey', dial: '+90' },
    { code: 'UA', name: 'Ukraine', dial: '+380' },
    { code: 'UZ', name: 'Uzbekistan', dial: '+998' },
    { code: 'VE', name: 'Venezuela', dial: '+58' },
    { code: 'VN', name: 'Vietnam', dial: '+84' },
    { code: 'YE', name: 'Yemen', dial: '+967' },
    { code: 'ZW', name: 'Zimbabwe', dial: '+263' },
];

export const MANAGER = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    PASSWORD_LENGTH: 8,
};
