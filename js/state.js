import { DEFAULTS, getDisplayName } from './config.js';

let state = JSON.parse(localStorage.getItem('LCL_V5_DATA')) || {
    players: DEFAULTS.map((n, i) => ({ id: i, name: n, buy: 0, add: 0, bty: 0, rank: 0 })),
    history: [], 
    expenses: [],
    incomes: [],
    extraDebts: []
};

// Ensure arrays exist
if (!state.incomes) state.incomes = [];
if (!state.extraDebts) state.extraDebts = [];
if (!state.history) state.history = [];
if (!state.expenses) state.expenses = [];
if (!state.players) state.players = DEFAULTS.map((n, i) => ({ id: i, name: n, buy: 0, add: 0, bty: 0, rank: 0 }));

let listeners = [];

export function getState() {
    return state;
}

export function subscribe(callback) {
    listeners.push(callback);
}

function notify() {
    listeners.forEach(cb => cb(state));
}

export function setState(newState, saveLocally = true) {
    state = newState;
    if (saveLocally) {
        localStorage.setItem('LCL_V5_DATA', JSON.stringify(state));
    }
    notify();
}

export function resetPlayers() {
    const newState = { ...state };
    newState.players = DEFAULTS.map((n, i) => ({ id: Date.now()+i, name: n, buy: 0, add: 0, bty: 0, rank: 0 }));
    setState(newState);
}

export function updatePlayer(id, field, value) {
    const newState = { ...state };
    const p = newState.players.find(x => x.id === id);
    if(p) {
        p[field] = Math.max(0, p[field] + value);
        setState(newState);
    }
}

export function setPlayerRank(id, rank) {
    const newState = { ...state };
    newState.players.forEach(p => {
        if (p.id === id) {
            p.rank = p.rank === rank ? 0 : rank;
        } else if (p.rank === rank) {
            p.rank = 0; // Clear other player's rank if assigned
        }
    });
    setState(newState);
}


export function loadMatchForEditing(matchId) {
    const newState = { ...state };
    const match = newState.history.find(m => m.id === matchId);
    if (!match) return false;
    
    newState.editingMatchId = matchId;
    
    // Map data to players
    newState.players = DEFAULTS.map((n, i) => {
        let oldP = match.players.find(x => getDisplayName(x.name) === getDisplayName(n));
        return { 
            id: Date.now() + i, 
            name: n, 
            buy: oldP ? oldP.buy : 0, 
            add: oldP ? (oldP.add || 0) : 0, 
            bty: oldP ? (oldP.bty || 0) : 0, 
            rank: oldP ? (oldP.rank || 0) : 0 
        };
    });
    
    setState(newState);
    return true;
}

export function cancelEditMatch() {
    const newState = { ...state };
    newState.editingMatchId = null;
    newState.players = DEFAULTS.map((n, i) => ({ id: Date.now()+i, name: n, buy: 0, add: 0, bty: 0, rank: 0 }));
    setState(newState);
}

export function deletePlayer(id) {
    const newState = { ...state };
    newState.players = newState.players.filter(x => x.id !== id);
    setState(newState);
}

export function addPlayer(name) {
    const newState = { ...state };
    newState.players.push({ id: Date.now(), name: name, buy: 0, add: 0, bty: 0, rank: 0 });
    setState(newState);
}

export function deleteTransaction(type, id) {
    const newState = { ...state };
    if (type === 'debt') {
        newState.extraDebts = newState.extraDebts.filter(x => x.id !== id);
    } else if (type === 'in') {
        newState.incomes = newState.incomes.filter(x => x.id !== id);
    } else if (type === 'out') {
        newState.expenses = newState.expenses.filter(x => x.id !== id);
    }
    setState(newState);
}

export function updateTransaction(type, id, newData) {
    const newState = { ...state };
    let arr;
    if (type === 'debt') arr = newState.extraDebts;
    else if (type === 'in') arr = newState.incomes;
    else if (type === 'out') arr = newState.expenses;
    
    if (arr) {
        const idx = arr.findIndex(x => x.id === id);
        if (idx !== -1) {
            arr[idx] = { ...arr[idx], ...newData };
            setState(newState);
        }
    }
}
