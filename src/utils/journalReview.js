// Post-trade review constants and after-exit lookup — moved out of App.jsx unchanged.

// ── Post-trade review: fixed option lists (fixed so they can be aggregated later) ──
export const REVIEW_SCORE_FIELDS = [
    { key: 'entry',  label: 'Entry' },
    { key: 'exit',   label: 'Exit' },
    { key: 'sizing', label: 'Sizing' },
    { key: 'plan',   label: 'Plan adherence' },
];
export const REVIEW_MISTAKES = [
    'Chased / FOMO entry',
    'No stop / moved stop',
    'Oversized',
    'Sold too early',
    'Held too long',
    'Ignored thesis',
    'Revenge trade',
    'No plan',
];
export const REVIEW_NONE_TAG = 'None (clean execution)';
export const REVIEW_EXIT_REASONS = [
    'Trailing Stop Hit',
    'Hard Stop Hit (Initial Risk)',
    'Thesis Invalidated (Price Action)',
    'Sold at My Profit Target',
    'Time Stop / Stagnant Capital',
    'Protecting Profit (Fear of Giveback)',
    'Panic / Impulsive Exit',
    'Breakeven Exit (Was Down)',
];
export const REVIEW_SCALE = 10;
// plannedStop / plannedTarget are free text now. Reviews saved earlier stored numbers (prices): show them as "$x".
export const planText = (v) => v == null || v === '' ? '' : typeof v === 'number' ? `$${v}` : String(v);
// Reviews saved before the 10-point scale have no `scale` field and hold 1-5 scores: double them on read.
export const reviewScoreOnScale = (review, n) => n == null ? null : (review && review.scale === REVIEW_SCALE ? n : n * 2);

// ── Post-trade review: after-exit marks ──────────────────────────────────
// Fixed windows after the FINAL exit, not "today's price": over long gaps a
// current price mostly reflects market drift and survivorship, not exit quality.
// Sign convention: positive = price kept moving in the trade's original
// direction after you exited (you left gains); negative = it reversed (you dodged).
export const AFTER_EXIT_MARKS = [5, 20, 60]; // trading days after the final exit
export const afterExitKey = (t) => `${t.id}|${t.exitDate}|${t.exitPrice}|${t.direction === 'short' ? 'short' : 'long'}`;
export const afterExitRange = (days) =>
    days <= 20 ? '1mo' : days <= 80 ? '3mo' : days <= 170 ? '6mo' : days <= 350 ? '1y'
    : days <= 710 ? '2y' : days <= 1800 ? '5y' : days <= 3600 ? '10y' : 'max';
export const fmtAfterExitPct = (v) => v == null ? null : `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;

export const computeAfterExit = async (t, proxy) => {
    const exitPx = t.exitPrice;
    const isShort = t.direction === 'short';
    const daysSince = Math.floor((Date.now() - new Date(t.exitDate + 'T00:00:00Z').getTime()) / 86400000);
    if (!(exitPx > 0) || isNaN(daysSince)) throw new Error('Exit price or date is missing');
    const emptyMarks = { 5: null, 20: null, 60: null };
    if (daysSince < 7) return { status: 'pending', marks: emptyMarks, best: null, worst: null, complete: false, splitSuspect: false };

    const resp = await fetch(`${proxy}?symbol=${encodeURIComponent(t.symbol)}&interval=1d&range=${afterExitRange(daysSince + 5)}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    const res = json?.chart?.result?.[0];
    const ts = res?.timestamp;
    const q = res?.indicators?.quote?.[0];
    if (!ts || !q) throw new Error('No price history returned');

    // Exchange-local dates, so "after the exit" and "today" are judged in the market's own calendar
    const off = res?.meta?.gmtoffset || 0;
    const todayLocal = new Date(Date.now() + off * 1000).toISOString().slice(0, 10);
    const bars = [];
    for (let i = 0; i < ts.length; i++) {
        const c = q.close?.[i];
        if (c == null) continue;
        bars.push({
            d: new Date((ts[i] + off) * 1000).toISOString().slice(0, 10),
            c,
            h: q.high?.[i] ?? c,
            l: q.low?.[i] ?? c,
        });
    }
    if (bars.length === 0) throw new Error('No price history returned');
    // If history starts after the exit, the first "after" bar could be the wrong day
    if (bars[0].d > t.exitDate) throw new Error('Price history does not reach back to the exit date');

    // Completed sessions only: today's bar may still be forming
    const after = bars.filter(b => b.d > t.exitDate && b.d < todayLocal);
    const cont = (p) => isShort ? (exitPx - p) / exitPx : (p - exitPx) / exitPx;
    const marks = {};
    AFTER_EXIT_MARKS.forEach(n => { marks[n] = after.length >= n ? cont(after[n - 1].c) : null; });
    if (after.length < AFTER_EXIT_MARKS[0]) return { status: 'pending', marks, best: null, worst: null, complete: false, splitSuspect: false };

    const win = after.slice(0, AFTER_EXIT_MARKS[AFTER_EXIT_MARKS.length - 1]);
    const hi = Math.max(...win.map(b => b.h));
    const lo = Math.min(...win.map(b => b.l));
    return {
        status: 'ready',
        marks,
        best:  isShort ? cont(lo) : cont(hi),   // furthest the price ran in your direction after you left
        worst: isShort ? cont(hi) : cont(lo),   // furthest it went against it
        complete: marks[60] != null,
        // History is split-adjusted but the recorded exit isn't, so a split makes every number wrong
        splitSuspect: win.some(b => Math.abs(b.c / exitPx - 1) > 0.5),
    };
};
