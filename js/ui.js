import { getState, updatePlayer, setPlayerRank, deletePlayer } from './state.js';
import { getDisplayName } from './config.js';
import { calculateMatchSummary, calculateOverallStats } from './logic.js';

function fmt(num) {
    return num.toLocaleString('vi-VN');
}

export function renderPlayers() {
    const state = getState();
    const container = document.getElementById('playerList');
    if (!container) return;

    container.innerHTML = state.players.map(p => `
        <div class="glass-card rounded-2xl p-4 space-y-3 shadow-lg">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${p.rank==1?'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30':p.rank==2?'bg-slate-300 text-black':p.rank==3?'bg-orange-800 text-white':'bg-emerald-800 text-emerald-500'}">${p.rank||'#'}</div>
                    <span class="font-black text-slate-100 text-base">${getDisplayName(p.name)}</span>
                </div>
                <button data-action="delete-player" data-id="${p.id}" class="text-slate-600 hover:text-red-500 p-2 transition-colors"><i class="ph-bold ph-trash text-lg"></i></button>
            </div>
            <div class="grid grid-cols-3 gap-2">
                ${[1,2,3].map(r => `<button data-action="set-rank" data-id="${p.id}" data-rank="${r}" class="py-2 rounded-xl text-[10px] font-black border transition-all ${p.rank==r?'bg-slate-200 text-black border-white shadow-md':'bg-emerald-900 text-emerald-500 border-emerald-800 hover:bg-emerald-800'}">GIẢI ${r}</button>`).join('')}
            </div>
            <div class="grid grid-cols-3 gap-2">
                ${[['buy','B-IN','text-amber-500'],['add','A-ON','text-blue-400'],['bty','KILLS','text-emerald-400']].map(([f,l,c]) => `
                    <div class="bg-emerald-950/50 p-2 rounded-2xl border border-emerald-800 flex flex-col items-center">
                        <span class="text-[8px] font-black text-emerald-500 uppercase mb-1">${l}</span>
                        <div class="flex items-center justify-between w-full px-1">
                            <button data-action="upd-player" data-id="${p.id}" data-field="${f}" data-val="-1" class="text-emerald-500 font-bold w-6 h-6 flex items-center justify-center btn-press rounded bg-emerald-900 hover:bg-emerald-800 transition-colors">−</button>
                            <span class="font-black ${c} text-lg">${p[f]}</span>
                            <button data-action="upd-player" data-id="${p.id}" data-field="${f}" data-val="1" class="text-emerald-100 font-bold w-6 h-6 flex items-center justify-center btn-press rounded bg-emerald-800 hover:bg-emerald-700 transition-colors">+</button>
                        </div>
                    </div>`).join('')}
            </div>
        </div>`).join('');
}

export function renderMatchSummary() {
    const state = getState();
    const summary = calculateMatchSummary(state.players);
    
    const prizeStats = document.getElementById('prizeStats');
    if (prizeStats) {
        prizeStats.innerHTML = `
            <div class="flex justify-between items-end mb-4 pb-4 border-b border-emerald-800/50">
                <span class="text-[10px] font-black text-emerald-400 uppercase">Prize Pool</span>
                <span class="text-2xl font-black text-amber-500">${fmt(summary.prizePool)}</span>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-emerald-800/50">
                <div class="flex flex-col">
                    <span class="text-[9px] font-bold text-emerald-600 uppercase mb-1">Buy-ins</span>
                    <span class="text-base font-black text-emerald-100">${summary.totalBuyins}</span>
                </div>
                <div class="flex flex-col text-right">
                    <span class="text-[9px] font-bold text-emerald-600 uppercase mb-1">Add-ons</span>
                    <span class="text-base font-black text-emerald-100">${summary.totalAddons}</span>
                </div>
            </div>
            <div class="flex justify-between text-[10px] font-bold text-emerald-500 uppercase mb-2">
                <span>Giải (${summary.prizes.length === 5 ? 'Nhất/Nhì/Ba/Tư/Năm' : summary.prizes.length === 4 ? 'Nhất/Nhì/Ba/Tư' : 'Nhất/Nhì/Ba'})</span>
                <span class="text-xs font-black text-amber-400">${summary.prizes.map(p => fmt(p)).join(' / ')}</span>
            </div>
            <div class="flex justify-between text-[10px] font-bold text-emerald-500 uppercase">
                <span>Trích quỹ (Rake)</span>
                <span class="text-base font-black text-emerald-400">+${fmt(summary.fund)}</span>
            </div>
            <div class="flex justify-between text-[10px] font-bold text-emerald-500 uppercase mt-2 pt-2 border-t border-emerald-800/50">
                <span>Tổng Mạng (Bounty)</span>
                <span class="text-sm font-black text-emerald-400">${summary.totalBtyTokens} Kills</span>
            </div>
        `;
    }

    const payList = document.getElementById('payList');
    if (payList) {
        payList.innerHTML = summary.payList.map(p => `
            <div class="flex justify-between items-center py-3 border-b border-emerald-800/50 last:border-0">
                <div>
                    <div class="text-sm font-black text-emerald-100 mb-0.5">${getDisplayName(p.name)}</div>
                    <div class="text-[9px] font-bold text-emerald-500 uppercase">Thưởng: ${fmt(p.pr)} | Mạng: ${fmt(p.btyEarned)}</div>
                </div>
                <div class="text-right">
                    <div class="text-base font-black ${p.final>=0?'text-emerald-400':'text-red-500'}">${p.final>0?'+':''}${fmt(p.final)}</div>
                    <div class="text-[8px] font-bold text-slate-600 uppercase mt-1">Vốn: ${fmt(p.cost)}</div>
                </div>
            </div>`).join('') || '<p class="text-center py-10 text-slate-700 italic text-xs">Bàn trống...</p>';
    }
}

export function renderHistory() {
    const state = getState();
    const container = document.getElementById('historyList');
    if (!container) return;

    if (!state.history.length) {
        container.innerHTML = '<div class="text-center py-20 text-slate-600 italic">Chưa có lịch sử thi đấu.</div>';
        return;
    }

    container.innerHTML = [...state.history].reverse().map(h => `
        <div class="glass-card rounded-2xl p-4 border-l-4 border-blue-500 mb-6 shadow-xl">
            <div class="flex justify-between border-b border-emerald-800 pb-3 mb-3 items-center">
                <div>
                    <span class="font-black text-blue-400 text-sm uppercase tracking-widest">TOUR ${h.matchNumber || 0}</span>
                    <div class="text-[9px] text-emerald-500 font-bold mt-1">${h.date}</div>
                </div>
                <div class="flex gap-2">
                    <button data-action="delete-match" data-id="${h.id}" class="text-emerald-400 hover:text-red-500 bg-emerald-800 w-8 h-8 rounded-lg border border-emerald-700 flex items-center justify-center transition-colors"><i class="ph-bold ph-trash text-sm"></i></button>
                </div>
            </div>
            
            <div class="flex justify-between bg-emerald-900/70 border border-emerald-800/50 p-4 rounded-xl mb-4 text-[10px] font-bold tracking-widest shadow-inner">
                <div class="flex flex-col gap-2">
                    <span class="text-emerald-500 uppercase">Tổng Vốn: <span class="text-white text-xs">${h.tB}B | ${h.tA}A</span></span>
                    <span class="text-emerald-500 uppercase">Bounty: <span class="text-emerald-400 text-xs">${h.tBty} Kills</span></span>
                    <span class="text-emerald-500 uppercase">Trích Quỹ: <span class="text-emerald-400 text-xs">+${fmt(h.fund)}</span></span>
                </div>
                <div class="flex flex-col gap-2 text-right">
                    <span class="text-emerald-500 uppercase">Prize Pool: <span class="text-orange-400 text-xs">${fmt(h.prizePool)}</span></span>
                    <span class="text-emerald-400 uppercase">G1 (25%): <span class="text-yellow-500 text-xs">${fmt(h.prizes[0])}</span></span>
                    <span class="text-emerald-400 uppercase">G2 (15%): <span class="text-emerald-100 text-xs">${fmt(h.prizes[1])}</span></span>
                    <span class="text-emerald-400 uppercase">G3 (10%): <span class="text-orange-700 text-xs">${fmt(h.prizes[2])}</span></span>
                </div>
            </div>

            <div class="space-y-1">
                ${h.players.map(p => {
                    let rankBadge = '';
                    if(p.rank === 1) rankBadge = '<span class="bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[8px] ml-1.5 shadow-md font-black">NHẤT</span>';
                    if(p.rank === 2) rankBadge = '<span class="bg-slate-300 text-black px-1.5 py-0.5 rounded text-[8px] ml-1.5 font-black">NHÌ</span>';
                    if(p.rank === 3) rankBadge = '<span class="bg-orange-800 text-white px-1.5 py-0.5 rounded text-[8px] ml-1.5 font-black">BA</span>';
                    
                    return `
                    <div class="flex justify-between text-xs items-center py-2 border-b border-emerald-800/30 last:border-0">
                        <div>
                            <div class="font-bold text-emerald-100 text-sm mb-1 flex items-center">${getDisplayName(p.name)} ${rankBadge}</div>
                            <span class="text-[9px] text-emerald-500 font-normal">(${p.buy}B | ${p.add}A | ${p.bty}K)</span>
                        </div>
                        <span class="font-black text-base ${p.final>=0?'text-emerald-400':'text-red-500'}">${p.final>0?'+':''}${fmt(p.final)}</span>
                    </div>`;
                }).join('')}
            </div>
        </div>`).join('');
}

export function renderStatsAndBank() {
    const filterStart = document.getElementById('filterStartDate').value;
    const filterEnd = document.getElementById('filterEndDate').value;
    
    let startTs = 0;
    let endTs = Number.MAX_SAFE_INTEGER;

    if (filterStart) {
        let d = new Date(filterStart);
        d.setHours(0,0,0,0);
        startTs = d.getTime();
    }
    if (filterEnd) {
        let d = new Date(filterEnd);
        d.setHours(23,59,59,999);
        endTs = d.getTime();
    }

    const { stats, nD, cashIn, cashOut, actualBankBalance, filteredExtraDebts, filteredIncomes, filteredExpenses } = calculateOverallStats(startTs, endTs);
    const container = document.getElementById('statsContent');
    if (!container) return;

    let statsHtml = Object.keys(stats).sort((a,b) => stats[b].profit - stats[a].profit).map(n => {
        let s = stats[n];
        let winRate = s.tours > 0 ? (((s.rank1 + s.rank2 + s.rank3) / s.tours) * 100).toFixed(1) : 0;
        return `
        <div class="glass-card rounded-2xl p-5 mb-4 border-l-4 ${s.profit >= 0 ? 'border-emerald-500' : 'border-red-500'} bg-emerald-900/40">
            <div class="flex justify-between items-center border-b border-emerald-800 pb-3 mb-4">
                <span class="text-base font-black text-white">${n}</span>
                <div class="flex flex-col items-end gap-1">
                    <span class="text-[10px] bg-emerald-800 px-2 py-1 rounded text-emerald-200 font-bold border border-emerald-700">Tham gia: ${s.tours} Tour</span>
                    <span class="text-[9px] text-emerald-400 font-bold uppercase">ITM (Có giải): ${winRate}%</span>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-y-3 gap-x-2 text-xs mb-5">
                <div class="text-emerald-400">Buy-in: <span class="font-black text-orange-400 ml-1">${s.buyins}</span></div>
                <div class="text-emerald-400">Add-on: <span class="font-black text-blue-400 ml-1">${s.addons}</span></div>
                <div class="text-emerald-400">Mạng (Kill): <span class="font-black text-emerald-400 ml-1">${s.kills}</span></div>
                <div class="text-emerald-400">Tổng Vốn: <span class="font-black text-red-400 ml-1">${fmt(s.cost)}</span></div>
                
                <div class="text-emerald-500 col-span-2 mt-2 pt-3 border-t border-emerald-800/50 font-bold uppercase tracking-widest text-[9px]">Thành tích các giải:</div>
                <div class="text-emerald-400">Nhất <span class="text-[9px]">(${s.rank1})</span>: <span class="font-black text-yellow-500 ml-1">${fmt(s.prize1)}</span></div>
                <div class="text-emerald-400">Nhì <span class="text-[9px]">(${s.rank2})</span>: <span class="font-black text-emerald-200 ml-1">${fmt(s.prize2)}</span></div>
                <div class="text-emerald-400">Ba <span class="text-[9px]">(${s.rank3})</span>: <span class="font-black text-orange-700 ml-1">${fmt(s.prize3)}</span></div>
                <div class="text-emerald-400">Tổng Tiền Giải: <span class="font-black text-emerald-400 ml-1">${fmt(s.prize1 + s.prize2 + s.prize3)}</span></div>
            </div>
            <div class="flex justify-between items-center bg-emerald-950/50 p-3 rounded-xl border border-emerald-800/50">
                <span class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Lợi nhuận gộp:</span>
                <span class="text-xl font-black tracking-tighter ${s.profit >= 0 ? 'text-emerald-400' : 'text-red-500'}">${s.profit > 0 ? '+' : ''}${fmt(s.profit)}</span>
            </div>
        </div>`;
    }).join('');

    let debtHtml = Object.keys(nD).sort((a,b) => nD[a] - nD[b]).map(n => {
        if(nD[n] === 0) return '';
        // If nD > 0: Bank owes player. If nD < 0: Player owes bank.
        const isPlayerOwning = nD[n] < 0; 
        const amount = Math.abs(nD[n]);
        return `
        <div class="flex justify-between items-center py-3 border-b border-emerald-800/50 last:border-0">
            <span class="font-bold text-sm ${isPlayerOwning ? 'text-red-400' : 'text-emerald-400'}">${n}</span>
            <div class="flex flex-col items-end">
                <span class="font-black text-base ${isPlayerOwning ? 'text-red-500' : 'text-emerald-500'}">${isPlayerOwning ? '-' : '+'}${fmt(amount)}</span>
                <span class="text-[8px] uppercase text-emerald-500 font-bold">${isPlayerOwning ? 'Nợ Quỹ' : 'Quỹ Nợ Lại'}</span>
            </div>
        </div>`;
    }).join('') || '<div class="text-center text-emerald-500 text-xs italic py-4">Sòng phẳng, không ai nợ ai! 🎉</div>';

    let txHtml = [...filteredExtraDebts].reverse().slice(0, 10).map(ed => `
        <div class="flex justify-between text-[10px] border-b border-zinc-800/50 py-3 items-center group">
            <span class="text-zinc-300"><b>${getDisplayName(ed.name)}</b>: ${ed.reason}</span>
            <div class="flex items-center gap-3">
                <span class="font-bold text-sm ${ed.amount >= 0 ? 'text-amber-400' : 'text-rose-500'}">${ed.amount > 0 ? '+' : ''}${fmt(ed.amount)}</span>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button data-action="edit-tx" data-type="debt" data-id="${ed.id}" data-amount="${ed.amount}" class="text-zinc-500 hover:text-amber-400"><i class="ph-bold ph-pencil"></i></button>
                    <button data-action="delete-tx" data-type="debt" data-id="${ed.id}" class="text-zinc-500 hover:text-rose-500"><i class="ph-bold ph-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');

    let combinedFundTx = [
        ...filteredIncomes.map(i => ({ ...i, txType: 'in' })),
        ...filteredExpenses.map(e => ({ ...e, txType: 'out' }))
    ].sort((a, b) => b.id - a.id);

    let fundTxHtml = combinedFundTx.slice(0, 10).map(tx => tx.txType === 'in' ? `
        <div class="flex justify-between text-[10px] border-b border-zinc-800/50 py-3 items-center group">
            <span class="text-zinc-300"><span class="bg-amber-900/40 text-amber-400 px-1.5 py-0.5 rounded text-[8px] mr-2 font-black border border-amber-500/20">THU</span> ${tx.reason}</span>
            <div class="flex items-center gap-3">
                <span class="text-amber-400 font-bold text-sm">+${fmt(tx.amount)}</span>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button data-action="edit-tx" data-type="in" data-id="${tx.id}" data-amount="${tx.amount}" class="text-zinc-500 hover:text-amber-400"><i class="ph-bold ph-pencil"></i></button>
                    <button data-action="delete-tx" data-type="in" data-id="${tx.id}" class="text-zinc-500 hover:text-rose-500"><i class="ph-bold ph-trash"></i></button>
                </div>
            </div>
        </div>
    ` : `
        <div class="flex justify-between text-[10px] border-b border-zinc-800/50 py-3 items-center group">
            <span class="text-zinc-300"><span class="bg-rose-900/40 text-rose-400 px-1.5 py-0.5 rounded text-[8px] mr-2 font-black border border-rose-500/20">CHI</span> ${tx.reason} ${tx.payer ? `<span class="text-amber-500 ml-1 font-bold">(Hộ: ${getDisplayName(tx.payer)})</span>` : ''}</span>
            <div class="flex items-center gap-3">
                <span class="text-rose-500 font-bold text-sm">-${fmt(tx.amount)}</span>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button data-action="edit-tx" data-type="out" data-id="${tx.id}" data-amount="${tx.amount}" class="text-zinc-500 hover:text-amber-400"><i class="ph-bold ph-pencil"></i></button>
                    <button data-action="delete-tx" data-type="out" data-id="${tx.id}" class="text-zinc-500 hover:text-rose-500"><i class="ph-bold ph-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="glass-card rounded-[2rem] p-6 mb-6 shadow-2xl bg-emerald-900/50 border-amber-500/50">
            <h3 class="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2"><i class="ph-bold ph-scales text-lg"></i> CÔNG NỢ GỘP (NET DEBT)</h3>
            <div class="bg-emerald-950/50 p-4 rounded-xl border border-emerald-800 mb-4">
                ${debtHtml}
            </div>

            <h4 class="text-[10px] text-emerald-400 font-bold mb-3 uppercase tracking-widest mt-6">Thanh Toán Nợ (Giao Dịch Với Quỹ)</h4>
            <div class="flex flex-col gap-3">
                <select id="edName" class="w-full bg-emerald-950 border border-emerald-700 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-amber-500">
                    <option value="" disabled selected>-- Chọn người --</option>
                    ${Object.keys(nD).map(n => `<option value='${n}'>${n} (Nợ: ${fmt(nD[n])})</option>`).join('')}
                </select>
                <select id="edType" class="w-full bg-emerald-950 border border-emerald-700 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-amber-500">
                    <option value="1">Đóng tiền vào Quỹ (Trả nợ / Đóng thêm) (+)</option>
                    <option value="-1">Quỹ chi tiền mặt (Rút thưởng / Quỹ cho vay) (-)</option>
                    <option value="-2">Nợ cũ (Thay đổi nợ không dùng tiền mặt) (-)</option>
                </select>
                <div class="flex gap-2">
                    <input id="edAmount" type="number" placeholder="Số tiền..." class="flex-1 bg-emerald-950 border border-emerald-700 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-amber-500">
                    <button id="btn-add-debt" class="bg-amber-600 px-6 rounded-xl text-white font-black hover:bg-amber-500 transition-colors shadow-lg">LƯU</button>
                </div>
            </div>
            
            ${txHtml ? `<div class="mt-4 pt-4 border-t border-emerald-800"><h4 class="text-[9px] text-emerald-500 font-bold uppercase mb-2">Giao dịch nợ gần nhất</h4>${txHtml}</div>` : ''}

            <h4 class="text-[10px] text-emerald-400 font-bold mb-3 uppercase tracking-widest mt-8">Thu / Chi Quỹ (Chi Phí Hoạt Động)</h4>
            <div class="flex flex-col gap-3">
                <select id="fundType" class="w-full bg-emerald-950 border border-emerald-700 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-amber-500">
                    <option value="out">Chi tiền (Mua bài, ăn uống...)</option>
                    <option value="in">Thu tiền (Đóng phạt, tài trợ...)</option>
                </select>
                <div class="flex gap-2">
                    <input id="fundReason" type="text" placeholder="Lý do (Mua bài, Nhậu)..." class="flex-1 bg-emerald-950 border border-emerald-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500">
                    <input id="fundAmount" type="number" placeholder="Số tiền..." class="w-32 bg-emerald-950 border border-emerald-700 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-amber-500">
                </div>
                <select id="fundPayer" class="w-full bg-emerald-950 border border-emerald-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500">
                    <option value="">-- Quỹ trả trực tiếp (Trừ tồn quỹ) --</option>
                    ${Object.keys(nD).map(n => `<option value='${n}'>Nhờ ${n} trả hộ (Ghi tăng nợ quỹ với người này)</option>`).join('')}
                </select>
                <button id="btn-add-fund" class="w-full bg-emerald-700 px-6 py-3 rounded-xl text-white font-black hover:bg-emerald-600 transition-colors shadow-lg border border-emerald-600">LƯU THU/CHI QUỸ</button>
            </div>

            ${fundTxHtml ? `<div class="mt-4 pt-4 border-t border-emerald-800"><h4 class="text-[9px] text-emerald-500 font-bold uppercase mb-2">Lịch sử thu/chi quỹ</h4>${fundTxHtml}</div>` : ''}
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="glass-card rounded-2xl p-4 text-center">
                <div class="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mb-1">Tổng Thực Thu</div>
                <div class="text-lg font-black text-emerald-400">${fmt(cashIn)}</div>
            </div>
            <div class="glass-card rounded-2xl p-4 text-center">
                <div class="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mb-1">Tổng Thực Chi</div>
                <div class="text-lg font-black text-red-400">${fmt(cashOut)}</div>
            </div>
            <div class="glass-card rounded-2xl p-4 text-center col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border-emerald-500/30">
                <div class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Tồn Quỹ Tiền Mặt (CASH)</div>
                <div class="text-3xl font-black ${actualBankBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}">${actualBankBalance > 0 ? '+' : ''}${fmt(actualBankBalance)}</div>
            </div>
        </div>

        <h3 class="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2"><i class="ph-bold ph-chart-polar text-lg"></i> THỐNG KÊ CHI TIẾT</h3>
        ${statsHtml || '<div class="text-center text-emerald-500 italic text-sm">Chưa có dữ liệu thi đấu...</div>'}
    `;
}
