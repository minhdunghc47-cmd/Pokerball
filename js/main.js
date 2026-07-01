import { getState, setState, subscribe, updatePlayer, setPlayerRank, deletePlayer, addPlayer, resetPlayers, deleteTransaction, updateTransaction } from './state.js';
import { initFirebaseRealtime, syncToCloud } from './firebase.js';
import { renderPlayers, renderMatchSummary, renderHistory, renderStatsAndBank } from './ui.js';
import { validateMatch, calculateMatchSummary } from './logic.js';
import { CFG, DEFAULTS } from './config.js';

// Setup sweetalert standard configuration
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    background: '#0f172a',
    color: '#f8fafc'
});

document.addEventListener('DOMContentLoaded', () => {
    // Initial Render
    subscribe(() => {
        renderPlayers();
        renderMatchSummary();
        if(document.getElementById('modalHistory').classList.contains('show')) renderHistory();
        if(document.getElementById('modalStats').classList.contains('show')) renderStatsAndBank();
    });
    
    // Initial calls
    renderPlayers();
    renderMatchSummary();
    
    // Connect Firebase
    initFirebaseRealtime();

    // Event Delegation for dynamically rendered buttons (Players list)
    document.getElementById('playerList').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const action = btn.getAttribute('data-action');
        const id = parseInt(btn.getAttribute('data-id'));
        
        if (action === 'upd-player') {
            const field = btn.getAttribute('data-field');
            const val = parseInt(btn.getAttribute('data-val'));
            updatePlayer(id, field, val);
            syncToCloud();
        } else if (action === 'set-rank') {
            const rank = parseInt(btn.getAttribute('data-rank'));
            setPlayerRank(id, rank);
            syncToCloud();
        } else if (action === 'delete-player') {
            Swal.fire({
                title: 'Xóa người chơi?',
                text: "Bạn có chắc chắn muốn xóa khỏi bàn?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'ĐỒNG Ý',
                cancelButtonText: 'HỦY'
            }).then((result) => {
                if (result.isConfirmed) {
                    deletePlayer(id);
                    syncToCloud();
                }
            });
        }
    });

    // Add Player
    document.getElementById('btn-add-player').addEventListener('click', () => {
        const input = document.getElementById('inputName');
        const name = input.value.trim();
        if (name) {
            addPlayer(name);
            input.value = '';
            syncToCloud();
            Toast.fire({ icon: 'success', title: 'Đã thêm người chơi' });
        }
    });

    // Tabs
    const switchTab = (tabId) => {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`view-${tabId}`).classList.remove('hidden');
        
        document.getElementById('tab-players').className = tabId === 'players' 
            ? 'flex-1 py-3 rounded-[1.5rem] font-black text-[10px] uppercase flex flex-col items-center gap-1.5 transition-all text-white bg-slate-800 shadow-md' 
            : 'flex-1 py-3 rounded-[1.5rem] font-black text-[10px] uppercase flex flex-col items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-all bg-transparent';
            
        document.getElementById('tab-summary').className = tabId === 'summary' 
            ? 'flex-1 py-3 rounded-[1.5rem] font-black text-[10px] uppercase flex flex-col items-center gap-1.5 transition-all text-white bg-slate-800 shadow-md' 
            : 'flex-1 py-3 rounded-[1.5rem] font-black text-[10px] uppercase flex flex-col items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-all bg-transparent';
    };

    document.getElementById('tab-players').addEventListener('click', () => switchTab('players'));
    document.getElementById('tab-summary').addEventListener('click', () => switchTab('summary'));

    // Modals
    const openModal = (id) => {
        const m = document.getElementById(id);
        m.classList.remove('hidden');
        // trigger reflow
        void m.offsetWidth;
        m.classList.add('show');
        m.classList.remove('opacity-0');
        
        if (id === 'modalHistory') renderHistory();
        if (id === 'modalStats') renderStatsAndBank();
    };

    const closeModal = (id) => {
        const m = document.getElementById(id);
        m.classList.remove('show');
        m.classList.add('opacity-0');
        setTimeout(() => m.classList.add('hidden'), 300);
    };

    document.getElementById('btn-history').addEventListener('click', () => openModal('modalHistory'));
    document.getElementById('btn-stats').addEventListener('click', () => openModal('modalStats'));

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    // Save Match
    document.getElementById('btn-save-match').addEventListener('click', () => {
        const state = getState();
        const v = validateMatch(state.players);
        if (!v.valid) {
            Swal.fire('Lỗi', v.message, 'error');
            return;
        }

        Swal.fire({
            title: 'Chốt trận?',
            text: "Lưu kết quả (Tổng lợi nhuận sẽ tự động cộng vào Nợ Gộp) và làm mới bàn chơi?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'CHỐT NGAY',
            cancelButtonText: 'HỦY'
        }).then((result) => {
            if (result.isConfirmed) {
                const summary = calculateMatchSummary(state.players);
                
                let maxMatch = state.history.length > 0 ? Math.max(...state.history.map(m => m.matchNumber || 0)) : 0;
                
                const snapshot = state.players.filter(p => p.buy > 0).map(p => {
                    let s = summary.payList.find(x => x.id === p.id);
                    return { ...p, final: s.final }; // Keep rank, buy, add, bty, final
                });

                const newMatch = {
                    id: Date.now(),
                    matchNumber: maxMatch + 1,
                    date: new Date().toLocaleString('vi-VN'),
                    fund: summary.fund,
                    prizePool: summary.prizePool,
                    prizes: summary.prizes,
                    tB: summary.totalBuyins,
                    tA: summary.totalAddons,
                    tBty: summary.totalBtyTokens,
                    players: snapshot
                };

                const newState = { ...state };
                newState.history.push(newMatch);
                // Reset players for new match
                newState.players = DEFAULTS.map((n, i) => ({ id: Date.now()+i, name: n, buy: 0, add: 0, bty: 0, rank: 0 }));
                
                setState(newState);
                syncToCloud();
                switchTab('players');
                Toast.fire({ icon: 'success', title: 'Đã lưu trận thành công!' });
            }
        });
    });

    // History Actions
    document.getElementById('historyList').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const action = btn.getAttribute('data-action');
        const id = parseInt(btn.getAttribute('data-id'));
        
        if (action === 'delete-match') {
            Swal.fire({
                title: 'Xóa trận này?',
                text: "Xóa sẽ ảnh hưởng đến công nợ, bạn chắc chứ?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'XÓA',
                cancelButtonText: 'HỦY'
            }).then((result) => {
                if (result.isConfirmed) {
                    const state = getState();
                    const newState = { ...state };
                    newState.history = newState.history.filter(x => x.id !== id);
                    setState(newState);
                    syncToCloud();
                    Toast.fire({ icon: 'success', title: 'Đã xóa trận đấu' });
                }
            });
        }
    });

    // Stats Filters
    document.getElementById('filterStartDate').addEventListener('change', renderStatsAndBank);
    document.getElementById('filterEndDate').addEventListener('change', renderStatsAndBank);
    document.getElementById('btn-clear-filter').addEventListener('click', () => {
        document.getElementById('filterStartDate').value = '';
        document.getElementById('filterEndDate').value = '';
        renderStatsAndBank();
    });

    // Stats - Add/Edit/Delete Debt/Transaction
    document.getElementById('statsContent').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn && btn.hasAttribute('data-action')) {
            const action = btn.getAttribute('data-action');
            const type = btn.getAttribute('data-type');
            const id = parseInt(btn.getAttribute('data-id'));
            
            if (action === 'delete-tx') {
                Swal.fire({
                    title: 'Bảo Mật',
                    text: 'Nhập mật khẩu Thủ Quỹ để XÓA giao dịch này:',
                    input: 'password',
                    inputAttributes: { autocapitalize: 'off' },
                    showCancelButton: true,
                    confirmButtonText: 'XÓA',
                    cancelButtonText: 'HỦY',
                    preConfirm: (pwd) => {
                        if (pwd !== '011187') Swal.showValidationMessage('Mật khẩu không chính xác!');
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        deleteTransaction(type, id);
                        syncToCloud();
                        Toast.fire({ icon: 'success', title: 'Đã xóa giao dịch' });
                    }
                });
            } else if (action === 'edit-tx') {
                const oldAmt = Math.abs(parseInt(btn.getAttribute('data-amount')));
                Swal.fire({
                    title: 'Sửa Giao Dịch',
                    html: `
                        <input id="swal-edit-amt" type="number" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold outline-none mb-3" value="${oldAmt}" placeholder="Nhập số tiền mới...">
                        <input id="swal-edit-pwd" type="password" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" placeholder="Mật khẩu Thủ Quỹ...">
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'CẬP NHẬT',
                    cancelButtonText: 'HỦY',
                    preConfirm: () => {
                        const newAmt = parseInt(document.getElementById('swal-edit-amt').value);
                        const pwd = document.getElementById('swal-edit-pwd').value;
                        if (pwd !== '011187') {
                            Swal.showValidationMessage('Mật khẩu không chính xác!');
                            return false;
                        }
                        if (isNaN(newAmt) || newAmt <= 0) {
                            Swal.showValidationMessage('Số tiền không hợp lệ!');
                            return false;
                        }
                        return newAmt;
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        const newAmt = result.value;
                        const originalAmt = parseInt(btn.getAttribute('data-amount'));
                        // Preserve sign
                        const finalAmt = originalAmt < 0 ? -newAmt : newAmt;
                        updateTransaction(type, id, { amount: finalAmt });
                        syncToCloud();
                        Toast.fire({ icon: 'success', title: 'Đã cập nhật giao dịch' });
                    }
                });
            }
            return;
        }

        if (e.target.id === 'btn-add-debt') {
            const nameEl = document.getElementById('edName');
            const typeEl = document.getElementById('edType');
            const amtEl = document.getElementById('edAmount');
            
            const name = nameEl ? nameEl.value : '';
            const typeVal = typeEl ? parseInt(typeEl.value) : 1;
            const amount = amtEl ? parseInt(amtEl.value) : 0;
            
            if (!name || isNaN(amount) || amount <= 0) {
                Swal.fire('Lỗi', 'Vui lòng chọn tên người và nhập số tiền hợp lệ.', 'error');
                return;
            }

            Swal.fire({
                title: 'Bảo Mật',
                text: 'Nhập mật khẩu Thủ Quỹ để thực hiện giao dịch:',
                input: 'password',
                inputAttributes: { autocapitalize: 'off' },
                showCancelButton: true,
                confirmButtonText: 'XÁC NHẬN',
                cancelButtonText: 'HỦY',
                preConfirm: (pwd) => {
                    if (pwd !== '011187') {
                        Swal.showValidationMessage('Mật khẩu không chính xác!');
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    let finalAmount = amount;
                    let isCash = false;
                    let reasonStr = "";

                    if (typeVal === 1) {
                        finalAmount = amount; 
                        reasonStr = "Đóng tiền quỹ / Trả nợ";
                    } else if (typeVal === -1) {
                        finalAmount = -amount; 
                        isCash = true;
                        reasonStr = "Rút thưởng / Quỹ cho vay";
                    } else if (typeVal === -2) {
                        finalAmount = -amount; 
                        isCash = false;
                        reasonStr = "Ghi nợ cũ (Không tiền mặt)";
                    }

                    const state = getState();
                    const newState = { ...state };
                    newState.extraDebts.push({
                        id: Date.now(),
                        name: name,
                        reason: reasonStr,
                        amount: finalAmount,
                        isCashLoan: isCash
                    });
                    setState(newState);
                    syncToCloud();
                    
                    if (amtEl) amtEl.value = '';
                    Toast.fire({ icon: 'success', title: 'Đã lưu giao dịch nợ' });
                }
            });

        } else if (e.target.id === 'btn-add-fund') {
            const typeEl = document.getElementById('fundType');
            const reasonEl = document.getElementById('fundReason');
            const amtEl = document.getElementById('fundAmount');
            const payerEl = document.getElementById('fundPayer');
            
            const type = typeEl ? typeEl.value : 'out';
            const reason = reasonEl ? reasonEl.value.trim() : '';
            const amount = amtEl ? parseInt(amtEl.value) : 0;
            const payer = payerEl ? payerEl.value : '';
            
            if (!reason || isNaN(amount) || amount <= 0) {
                Swal.fire('Lỗi', 'Vui lòng nhập lý do và số tiền hợp lệ.', 'error');
                return;
            }

            Swal.fire({
                title: 'Bảo Mật',
                text: 'Nhập mật khẩu Thủ Quỹ để thực hiện giao dịch:',
                input: 'password',
                inputAttributes: { autocapitalize: 'off' },
                showCancelButton: true,
                confirmButtonText: 'XÁC NHẬN',
                cancelButtonText: 'HỦY',
                preConfirm: (pwd) => {
                    if (pwd !== '011187') {
                        Swal.showValidationMessage('Mật khẩu không chính xác!');
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const state = getState();
                    const newState = { ...state };
                    
                    if (type === 'in') {
                        newState.incomes.push({ id: Date.now(), reason: reason, amount: amount });
                    } else {
                        newState.expenses.push({ id: Date.now(), reason: reason, amount: amount, payer: payer });
                    }
                    
                    setState(newState);
                    syncToCloud();
                    
                    if (reasonEl) reasonEl.value = '';
                    if (amtEl) amtEl.value = '';
                    Toast.fire({ icon: 'success', title: 'Đã lưu thu/chi quỹ' });
                }
            });
        }
    });
});
