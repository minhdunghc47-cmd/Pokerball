export const CFG = { 
    BUYIN: 60000, 
    TOUR: 50000, 
    BTY: 10000, 
    ADDON: 50000, 
    RATE: 0.5, 
    FUND_CAP: 500000,
    PRIZES: [0.5, 0.3, 0.2] // Legacy fallback
};

export const PAYOUT_STRUCTURE = [
    { min: 0, max: 9, payouts: [1.0] },
    { min: 10, max: 16, payouts: [0.64, 0.36] },
    { min: 17, max: 23, payouts: [0.48, 0.32, 0.20] },
    { min: 24, max: 29, payouts: [0.42, 0.28, 0.18, 0.12] },
    { min: 30, max: 36, payouts: [0.37, 0.255, 0.1625, 0.1175, 0.095] },
    { min: 37, max: 43, payouts: [0.34, 0.235, 0.15, 0.115, 0.09, 0.07] },
    { min: 44, max: 49, payouts: [0.315, 0.2275, 0.145, 0.11, 0.085, 0.065, 0.0525] },
    { min: 50, max: 56, payouts: [0.30, 0.217, 0.14, 0.106, 0.082, 0.064, 0.051, 0.04] },
    { min: 57, max: 63, payouts: [0.2915, 0.21, 0.1365, 0.103, 0.08, 0.062, 0.049, 0.038, 0.03] },
    { min: 64, max: 76, payouts: [0.275, 0.1955, 0.128, 0.0985, 0.078, 0.061, 0.048, 0.0375, 0.0285, 0.025, 0.025] },
    { min: 77, max: 999, payouts: [0.2625, 0.184, 0.1215, 0.0955, 0.077, 0.06, 0.0475, 0.037, 0.028, 0.023, 0.023, 0.0205, 0.0205] }
];

export const DEFAULTS = ['Đại Ka “C”', 'Nhị ka “Y”', 'Tam ka “G”', 'Tứ ka “H”', 'Ngũ ka “T”', 'Lục ka “Q”', 'Cốc', 'Ly'];

export const MIGRATION_MAP = {
    'Cảnh': 'Đại Ka “C”',
    'Yên': 'Nhị ka “Y”',
    'Giang': 'Tam ka “G”',
    'Hải': 'Tứ ka “H”',
    'Trung': 'Ngũ ka “T”',
    'Quân': 'Lục ka “Q”',
    'Dũng': 'Cốc',
    'Hoàng': 'Ly',
    'Tít': 'tít',
    'Hiếu PC': 'Hiếu'
};

export function getDisplayName(oldName) {
    return MIGRATION_MAP[oldName] || oldName;
}

export const FIREBASE_URL = 'https://lcl-v1-default-rtdb.asia-southeast1.firebasedatabase.app';
// We use a new node for v5 to separate the legacy data
export const FIREBASE_NODE = '/lcl_state_v5.json';
