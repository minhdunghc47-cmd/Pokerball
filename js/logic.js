import { CFG, getDisplayName } from './config.js';
import { getState, setState } from './state.js';

export function calculateMatchSummary(players) {
    let b = 0, a = 0, totalBtyTokens = 0;
    players.forEach(p => { 
        b += p.buy; 
        a += p.add; 
        totalBtyTokens += p.bty;
    });

    let totalPool = (b + a) * CFG.TOUR; // Not counting BTY inside the pool calculation (BTY is 10k separate)
    let fund = totalPool * CFG.RATE;
    
    // Capped Rake: Tối đa 500k
    if (CFG.FUND_CAP && fund > CFG.FUND_CAP) {
        fund = CFG.FUND_CAP;
    }
    
    let prizePool = totalPool - fund;
    let totalBuyinCount = b + a;
    let prizes = [];
    
    // Dynamic Payout (Bubble Protection)
    if (totalBuyinCount < 20) {
        // Bàn đánh êm: Chỉ chia Top 3
        prizes = CFG.PRIZES.map(v => prizePool * v);
    } else if (totalBuyinCount >= 20 && totalBuyinCount < 25) {
        // Bàn đánh rát: Hoàn 1 Buy-in cho Hạng 4, phần còn lại chia Top 3
        let bubblePrize = CFG.BUYIN;
        let remainingPool = prizePool - bubblePrize;
        prizes = CFG.PRIZES.map(v => remainingPool * v);
        prizes.push(bubblePrize);
    } else {
        // Bàn đẫm máu (>= 25 Buy-in): Hoàn 1 Buy-in cho Hạng 4 và Hạng 5, phần còn lại chia Top 3
        let bubblePrize = CFG.BUYIN;
        let remainingPool = prizePool - (bubblePrize * 2);
        prizes = CFG.PRIZES.map(v => remainingPool * v);
        prizes.push(bubblePrize); // Hạng 4
        prizes.push(bubblePrize); // Hạng 5
    }

    const activePlayers = players.filter(p => p.buy > 0);
    const payList = activePlayers.map(p => {
        let cost = (p.buy * CFG.BUYIN) + (p.add * CFG.ADDON);
        let btyEarned = p.bty * CFG.BTY;
        let pr = p.rank > 0 ? (prizes[p.rank - 1] || 0) : 0;
        let final = pr + btyEarned - cost;
        return { ...p, cost, final, pr, btyEarned };
    });

    return {
        totalBuyins: b,
        totalAddons: a,
        totalBtyTokens,
        fund,
        prizePool,
        prizes,
        payList
    };
}

export function validateMatch(players) {
    let b = 0, totalBtyTokens = 0;
    players.forEach(p => { 
        b += p.buy; 
        totalBtyTokens += p.bty;
    });

    if (b === 0) {
        return { valid: false, message: "Bàn chưa có Buy-in nào!" };
    }

    if (totalBtyTokens > b) {
        return { valid: false, message: `Lỗi Bounty! Tổng số mạng (Kill) là ${totalBtyTokens}, lớn hơn tổng số Buy-in là ${b}. Vui lòng kiểm tra lại.` };
    }

    return { valid: true };
}

export function calculateOverallStats(startTs = 0, endTs = Number.MAX_SAFE_INTEGER) {
    const state = getState();
    
    let stats = {}; 
    let nD = {}; // Net Debt (Công nợ gộp)
    
    let cashIn = 0;
    let cashOut = 0;

    let filteredHistory = state.history.filter(m => m.id >= startTs && m.id <= endTs);
    let filteredExpenses = state.expenses.filter(e => e.id >= startTs && e.id <= endTs);
    let filteredIncomes = state.incomes.filter(i => i.id >= startTs && i.id <= endTs);
    let filteredExtraDebts = state.extraDebts.filter(ed => ed.id >= startTs && ed.id <= endTs);

    // 1. Process History (Matches) - Respect legacy p.paid for historical accuracy!
    filteredHistory.forEach(m => {
        m.players.forEach(p => {
            let pName = getDisplayName(p.name);

            if(!stats[pName]) {
                stats[pName] = { tours: 0, buyins: 0, addons: 0, kills: 0, cost: 0, rank1: 0, rank2: 0, rank3: 0, revenue: 0, profit: 0, prize1: 0, prize2: 0, prize3: 0 };
            }
            stats[pName].tours += 1;
            stats[pName].buyins += p.buy;
            stats[pName].addons += p.add || 0;
            stats[pName].kills += p.bty || 0;
            
            // Legacy cost calculation rule for exact backward compatibility with old stats
            let matchCost = p.buy * (m.matchNumber >= 41 ? 60000 : 50000) + ((p.add || 0) * CFG.ADDON);
            let pRevenue = p.final + matchCost; 
            
            stats[pName].cost += matchCost;
            stats[pName].revenue += pRevenue;
            stats[pName].profit += p.final;
            
            let pPool = m.prizePool;
            if (pPool === undefined) {
                let tB = 0, tA = 0;
                m.players.forEach(pl => { tB += pl.buy; tA += pl.add; });
                pPool = (tB + tA) * CFG.TOUR * (1 - CFG.RATE);
            }
            let pz = m.prizes || CFG.PRIZES.map(v => pPool * v);

            if(p.rank === 1) { stats[pName].rank1 += 1; stats[pName].prize1 += pz[0]; }
            if(p.rank === 2) { stats[pName].rank2 += 1; stats[pName].prize2 += pz[1]; }
            if(p.rank === 3) { stats[pName].rank3 += 1; stats[pName].prize3 += pz[2]; }

            // CRITICAL: Respect legacy 'paid' status so cash/debt matches the old app perfectly
            if (p.paid === false || p.paid === undefined) {
                if (!nD[pName]) nD[pName] = 0;
                nD[pName] += p.final;
            } else {
                if (p.final < 0) cashIn += Math.abs(p.final);
                if (p.final > 0) cashOut += p.final;
            }
        });
    });

    // 2. Process Extra Debts (The way money moves in/out of the system)
    filteredExtraDebts.forEach(ed => {
        let edName = getDisplayName(ed.name);

        if(!nD[edName]) nD[edName] = 0;
        nD[edName] += ed.amount;
        
        // Amount > 0 means player pays the bank (reduces debt, increases bank cash)
        // Amount < 0 means bank loans player (increases debt, reduces bank cash) - if isCashLoan
        if (ed.amount > 0) {
            cashIn += ed.amount; 
        } else if (ed.amount < 0 && ed.isCashLoan === true) {
            cashOut += Math.abs(ed.amount); 
        }
    });

    // 3. Process Fund Incomes/Expenses
    filteredExpenses.forEach(e => {
        if (e.payer && e.payer !== "") {
            let pName = getDisplayName(e.payer);
            if (!nD[pName]) nD[pName] = 0;
            nD[pName] += e.amount; // Bank owes payer, so nD goes up (bank owes them)
        } else {
            cashOut += e.amount;
        }
    });

    filteredIncomes.forEach(i => {
        cashIn += i.amount;
    });

    let totalPlayersOwe = 0; 
    let totalFundOwes = 0;   
    
    Object.keys(nD).forEach(n => {
        if (nD[n] < 0) totalPlayersOwe += Math.abs(nD[n]);
        if (nD[n] > 0) totalFundOwes += nD[n];
    });

    let actualBankBalance = cashIn - cashOut;

    return {
        stats,
        nD,
        cashIn,
        cashOut,
        actualBankBalance,
        totalPlayersOwe,
        totalFundOwes,
        filteredHistory,
        filteredExpenses,
        filteredIncomes,
        filteredExtraDebts
    };
}
