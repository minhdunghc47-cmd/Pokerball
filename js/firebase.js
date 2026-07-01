import { FIREBASE_URL, FIREBASE_NODE } from './config.js';
import { getState, setState } from './state.js';

let lastHash = "";
let eventSource = null;

export async function syncToCloud(silent = false) {
    const currentState = getState();
    const text = JSON.stringify(currentState);
    
    // Prevent echo
    if (text === lastHash) return;
    lastHash = text;
    
    try {
        await fetch(`${FIREBASE_URL}${FIREBASE_NODE}`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rawText: text }) 
        });
        updateStatus('Cloud Synced ✅', 'text-emerald-400');
    } catch(e) {
        updateStatus('Offline Mode ⚠️', 'text-red-400');
        if (!silent) console.error("Sync error", e);
    }
}

export function initFirebaseRealtime() {
    // We use Server-Sent Events (SSE) which Firebase Realtime DB supports out of the box!
    const url = `${FIREBASE_URL}${FIREBASE_NODE}`;
    
    // Initially fetch the data
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data && data.rawText && data.rawText !== lastHash) {
                lastHash = data.rawText;
                setState(JSON.parse(data.rawText), true);
            }
            updateStatus('Cloud Synced ✅', 'text-emerald-400');
            startSSE(url);
        })
        .catch(err => {
            updateStatus('Offline Mode ⚠️', 'text-red-400');
            console.error("Initial fetch failed, working offline", err);
        });
}

function startSSE(url) {
    if (eventSource) eventSource.close();
    
    // Append sse parameter if needed, but fetch above was enough. 
    // Usually Firebase RTDB REST API requires specific auth headers for SSE, 
    // but if it's public, we can just use normal polling or try standard SSE.
    // Actually, Firebase RTDB SSE endpoint is `.json` with Accept: text/event-stream.
    
    // Fallback to polling if EventSource is blocked by CORS for standard RTDB (it shouldn't be if public)
    setInterval(async () => {
        try {
            let res = await fetch(url);
            if(res.ok) {
                let data = await res.json();
                if(data && data.rawText && data.rawText !== lastHash) {
                    lastHash = data.rawText;
                    setState(JSON.parse(data.rawText), true);
                }
                updateStatus('Cloud Synced ✅', 'text-emerald-400');
            }
        } catch(e) {
            updateStatus('Offline Mode ⚠️', 'text-red-400');
        }
    }, 5000); 
    // Note: We use 5000ms polling here for safety because raw EventSource to Firebase REST 
    // can be tricky with CORS on Vercel/Localhost without proper headers. 
    // The previous 5s polling was fine, the issue was more about state conflicts. 
    // We'll manage conflicts by hashing and only updating when there's an actual change.
}

function updateStatus(text, colorClass) {
    const el = document.getElementById('cloud-status');
    const ind = document.getElementById('sync-indicator');
    if (el) {
        el.innerText = text;
        el.className = `text-[9px] font-bold uppercase tracking-widest ${colorClass}`;
    }
    if (ind) {
        ind.className = `w-2 h-2 rounded-full ${colorClass.includes('emerald') ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`;
    }
}
