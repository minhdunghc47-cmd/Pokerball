export const CFG = { 
    BUYIN: 60000, 
    TOUR: 50000, 
    BTY: 10000, 
    ADDON: 50000, 
    RATE: 0.5, 
    PRIZES: [0.25, 0.15, 0.1] 
};

export const DEFAULTS = ['Đại Ka “C”', 'Nhị ka “Y”', 'Tam ka “G”', 'Tứ ka “H”', 'Ngũ ka “T”', 'Lục ka “Q”', 'Cốc', 'Ly'];

export const MIGRATION_MAP = {
    'Cảnh': 'Đại Ka “C”',
    'Yên': 'Nhị ka “Y”',
    'Giang': 'Tam ka “G”',
    'Hải': 'Tứ ka “H”',
    'Trung': 'Ngũ ka “T”',
    'Quân': 'Lục ka “Q”',
    'Dũng': 'Cốc',
    'Hoàng': 'Ly'
};

export function getDisplayName(oldName) {
    return MIGRATION_MAP[oldName] || oldName;
}

export const FIREBASE_URL = 'https://lcl-v1-default-rtdb.asia-southeast1.firebasedatabase.app';
// We use a new node for v5 to separate the legacy data
export const FIREBASE_NODE = '/lcl_state_v5.json';
