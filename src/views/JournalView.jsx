// Journal tab — moved out of App.jsx.

import React, { useState, useEffect, useRef } from 'react';
import { CameraIcon, CheckCircleIcon, ClipboardIcon, LightbulbIcon, X, XCircleIcon } from '../components/icons';
import { PROXY } from '../utils/config';
import { AFTER_EXIT_MARKS, REVIEW_EXIT_REASONS, REVIEW_MISTAKES, REVIEW_NONE_TAG, REVIEW_SCALE, REVIEW_SCORE_FIELDS, afterExitKey, computeAfterExit, fmtAfterExitPct, planText, reviewScoreOnScale } from '../utils/journalReview';
import { uploadToImgbb } from '../utils/storage';
import { getEffectiveProfit } from '../utils/tradeMath';
import Lightbox from '../components/Lightbox';
import Sidebar from '../components/Sidebar';

export default function JournalView(props) {
    const {
        T, allPortfolioTrades, confirmDialog, handleEditTrade, isDark, portfolioViewMode, portfolios,
        saveTrades, setConfirmDialog, setLightboxData, setView, showToast, trades, tradesRef,
    } = props;

    // ── Journal-only state (lives here now; resets when you leave the Journal tab) ──
    const journalScreenshotFileRef = useRef(null);                      // hidden file input ref (journal panel)
    const [journalUploadingScreenshot, setJournalUploadingScreenshot] = useState(false);
    const [journalPasteActive, setJournalPasteActive] = useState(false);
    const [journalSearch, setJournalSearch] = useState('');
    const [journalFilter, setJournalFilter] = useState('all');
    const [journalActiveTag, setJournalActiveTag] = useState(null);
    const [journalSelected, setJournalSelected] = useState(null);
    const [journalSortField, setJournalSortField] = useState('date');
    const [journalSortDir, setJournalSortDir] = useState('desc');
    const [journalEditingNotes, setJournalEditingNotes] = useState(null);
    const [journalCamOpen, setJournalCamOpen] = useState(false);
    const [journalActivityExpanded, setJournalActivityExpanded] = useState(false);
    const [journalNeedsReview, setJournalNeedsReview] = useState(false);
    const [journalReviewEditing, setJournalReviewEditing] = useState(null); // trade id being reviewed
    const [journalReviewDraft, setJournalReviewDraft] = useState({ scores: {}, mistakes: [], exitReason: null });
    const journalActiveTradeRef = useRef(null);   // trade currently shown in the journal detail panel
    const afterExitCacheRef = useRef({});          // key -> { status, data, at } for after-exit lookups
    const [, setAfterExitTick] = useState(0);      // forces a re-render when a lookup finishes

    // Journal paste listener
    useEffect(() => {
        if (!journalPasteActive) return;
        const handler = (e) => {
            const file = Array.from(e.clipboardData?.files || []).find(f => f.type.startsWith('image/'));
            if (!file) return;
            e.preventDefault();
            const activeId = journalSelected?.id;
            if (activeId) saveJournalScreenshot(activeId, file);
        };
        document.addEventListener('paste', handler);
        return () => document.removeEventListener('paste', handler);
    }, [journalPasteActive, journalSelected]);

    const deleteJournalScreenshot = async (tradeId, urlToRemove) => {
        const existing = tradesRef.current.find(t => t.id === tradeId);
        const updatedTrade = { ...existing, screenshotUrls: (existing.screenshotUrls || []).filter(u => u !== urlToRemove) };
        const updated = tradesRef.current.map(t => t.id === tradeId ? updatedTrade : t);
        await saveTrades(updated);
        setJournalSelected(updatedTrade);
        showToast('success', 'Removed', 'Screenshot deleted.');
    };

    const saveJournalNotes = async (tradeId, newNotes) => {
        const updatedTrade = { ...tradesRef.current.find(t => t.id === tradeId), notes: newNotes };
        const updated = tradesRef.current.map(t => t.id === tradeId ? updatedTrade : t);
        await saveTrades(updated);
        setJournalSelected(updatedTrade);
        showToast('success', 'Saved', 'Journal notes updated.');
    };

    const saveJournalReview = async (tradeId, review) => {
        const existing = tradesRef.current.find(t => t.id === tradeId);
        if (!existing) {
            showToast('error', 'Cannot Save Review', "This trade belongs to another portfolio. Switch to that portfolio to review it.");
            return false;
        }
        const updatedTrade = { ...existing, review: { ...review, ...(existing.review?.afterExit ? { afterExit: existing.review.afterExit } : {}) } };
        const updated = tradesRef.current.map(t => t.id === tradeId ? updatedTrade : t);
        await saveTrades(updated);
        setJournalSelected(updatedTrade);
        showToast('success', 'Review Saved', 'Post-trade review updated.');
        return true;
    };

    // Silent save of after-exit marks onto an existing review (no toast). Skips if the exit
    // changed since the lookup started, or if the trade isn't in the active portfolio.
    const saveAfterExit = async (tradeId, key, afterExit) => {
        const existing = tradesRef.current.find(t => t.id === tradeId);
        if (!existing || !existing.review) return;
        if (afterExitKey(existing) !== key) return;
        const prev = existing.review.afterExit;
        if (prev && prev.key === key && prev.complete) return;
        const updatedTrade = { ...existing, review: { ...existing.review, afterExit } };
        await saveTrades(tradesRef.current.map(t => t.id === tradeId ? updatedTrade : t));
        setJournalSelected(sel => sel && sel.id === tradeId ? updatedTrade : sel);
    };

    // Runs after each render; exits immediately unless the journal is showing a reviewed,
    // closed trade whose marks are not final yet. Looked-up results are cached for 10 minutes.
    useEffect(() => {
        const t = journalActiveTradeRef.current;
        if (!t || !t.review || !t.exitDate || !(t.exitPrice > 0)) return;
        const key = afterExitKey(t);
        const stored = t.review.afterExit && t.review.afterExit.key === key ? t.review.afterExit : null;
        if (stored && stored.complete) return;
        const cached = afterExitCacheRef.current[key];
        if (cached && (cached.status === 'loading' || Date.now() - cached.at < 10 * 60 * 1000)) return;
        afterExitCacheRef.current[key] = { status: 'loading', at: Date.now() };
        setAfterExitTick(n => n + 1);
        computeAfterExit(t, PROXY).then(async (data) => {
            afterExitCacheRef.current[key] = { status: 'ready', data, at: Date.now() };
            setAfterExitTick(n => n + 1);
            // Persist only marks that have fully elapsed, and never a split-suspect result
            if (data.status !== 'ready' || data.splitSuspect) return;
            const have = stored ? AFTER_EXIT_MARKS.filter(n => stored.marks?.[n] != null).length : 0;
            const now = AFTER_EXIT_MARKS.filter(n => data.marks[n] != null).length;
            if (now <= have) return;
            await saveAfterExit(t.id, key, {
                key,
                marks: data.marks,
                best:  data.complete ? data.best : null,
                worst: data.complete ? data.worst : null,
                complete: data.complete,
                checkedAt: new Date().toISOString().split('T')[0],
            });
        }).catch((e) => {
            afterExitCacheRef.current[key] = { status: 'error', error: e.message, at: Date.now() };
            setAfterExitTick(n => n + 1);
        });
    });

    const saveJournalScreenshot = async (tradeId, file) => {
        if (!file) return;
        setJournalUploadingScreenshot(true);
        setJournalPasteActive(false);
        try {
            const url = await uploadToImgbb(file);
            const existing = tradesRef.current.find(t => t.id === tradeId);
            const updatedTrade = { ...existing, screenshotUrls: [...(existing.screenshotUrls || []), url] };
            const updated = tradesRef.current.map(t => t.id === tradeId ? updatedTrade : t);
            await saveTrades(updated);
            setJournalSelected(updatedTrade);
            showToast('success', 'Screenshot Added', 'Screenshot saved to this trade.');
        } catch(e) {
            showToast('error', 'Upload Failed', 'Could not upload screenshot. Check your connection.');
        } finally {
            setJournalUploadingScreenshot(false);
        }
    };

    const journalTrades = (portfolioViewMode === 'all' && portfolios.length > 1 ? allPortfolioTrades : trades)
        .filter(t => (t.notes && t.notes.trim().length > 0) || t.exitDate || t.review);

    const extractTags = (text) => (text.match(/#\w+/g) || []).map(t => t.toLowerCase());
    const allTags = [...new Set(journalTrades.flatMap(t => extractTags(t.notes || '')))].sort();

    const getOutcome = (t) => {
        if (!t.exitDate) return 'open';
        const p = getEffectiveProfit(t);
        return p > 0 ? 'win' : p < 0 ? 'loss' : 'even';
    };

    const needsReview = (t) => !!t.exitDate && !t.review;
    const needsReviewCount = journalTrades.filter(needsReview).length;

    const filteredJournal = journalTrades.filter(t => {
        const outcome = getOutcome(t);
        const matchesOutcome = journalFilter === 'all' || outcome === journalFilter;
        const matchesTag = !journalActiveTag || extractTags(t.notes || '').includes(journalActiveTag);
        const q = journalSearch.toLowerCase();
        const matchesSearch = !q || (t.symbol || '').toLowerCase().includes(q)
            || (t.name || '').toLowerCase().includes(q)
            || (t.notes || '').toLowerCase().includes(q);
        return matchesOutcome && matchesTag && matchesSearch && (!journalNeedsReview || needsReview(t));
    }).sort((a, b) => {
        if (journalSortField === 'symbol') {
            const sa = (a.symbol || '').toLowerCase();
            const sb = (b.symbol || '').toLowerCase();
            return journalSortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
        } else {
            const da = a.exitDate || a.entryDate;
            const db = b.exitDate || b.entryDate;
            return journalSortDir === 'asc' ? (da > db ? 1 : -1) : (db > da ? 1 : -1);
        }
    });

    const handleJournalTagClick = (tag) => {
        setJournalActiveTag(prev => prev === tag ? null : tag);
    };

    const activeEntry = journalSelected || filteredJournal[0] || null;

    const NoteText = ({ text, size }) => {
        const parts = text.split(/(#\w+)/g);
        return (
            <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: size || '0.95rem', color: T.textSecondary, lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                {parts.map((part, i) =>
                    part.startsWith('#') ? (
                        <span key={i} onClick={(e) => { e.stopPropagation(); handleJournalTagClick(part.toLowerCase()); }}
                            style={{ color: isDark ? '#a78bfa' : '#7c3aed', fontWeight: '600', cursor: 'pointer',
                                background: isDark ? 'rgba(167,139,250,0.12)' : 'rgba(124,58,237,0.09)',
                                borderRadius: '3px', padding: '0 3px', fontSize: '0.88rem' }}
                            title={`Filter by ${part}`}>{part}</span>
                    ) : <span key={i}>{part}</span>
                )}
            </span>
        );
    };

    const purpleColor = isDark ? '#a78bfa' : '#7c3aed';
    const purpleBg    = isDark ? 'rgba(167,139,250,0.12)' : 'rgba(124,58,237,0.09)';
    const journalScrollbar = { scrollbarWidth: 'thin', scrollbarColor: isDark ? '#333333 transparent' : '#c5cad1 transparent' };
    const purpleBorder= isDark ? 'rgba(167,139,250,0.25)' : 'rgba(124,58,237,0.2)';

    return (<>
        <div style={{ marginLeft: '220px', height: '100vh', display: 'flex', flexDirection: 'column', background: T.pageBg, color: T.textPrimary, overflow: 'visible' }}>
            <Sidebar {...props} />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* ── Left sidebar ── */}
                <div style={{ width: '280px', flexShrink: 0, borderRight: `1px solid ${T.border}`, background: T.panelBg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                    {/* Header + search + filters */}
                    <div style={{ padding: '14px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
                        {/* Title + count */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', marginBottom: '10px' }}>
                            <div style={{ fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted }}>Trade Journal</div>
                            <div style={{ fontSize: '0.6rem', color: T.textFaint }}>{filteredJournal.length} {filteredJournal.length === 1 ? 'entry' : 'entries'}</div>
                        </div>

                        {/* Search */}
                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                            <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: T.textFaint, fontSize: '12px', pointerEvents: 'none' }}>⌕</span>
                            <input value={journalSearch} onChange={e => setJournalSearch(e.target.value)}
                                placeholder="Search notes, #tags, symbols..."
                                style={{ width: '100%', padding: '6px 9px 6px 26px', fontSize: '0.78rem', border: `1px solid ${T.borderStrong}`, borderRadius: '5px', background: T.surfaceBg, color: T.textPrimary, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                        </div>

                        {/* Tag strip */}
                        {allTags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                                {allTags.slice(0, 10).map(tag => (
                                    <span key={tag} onClick={() => handleJournalTagClick(tag)}
                                        style={{ fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer',
                                            color: journalActiveTag === tag ? purpleColor : T.textSecondary,
                                            background: journalActiveTag === tag ? purpleBg : 'transparent',
                                            border: `1px solid ${journalActiveTag === tag ? purpleColor : (isDark ? 'rgba(167,139,250,0.5)' : 'rgba(124,58,237,0.4)')}`,
                                            padding: '2px 8px', borderRadius: '20px', transition: 'all 0.1s' }}>
                                        {tag}
                                    </span>
                                ))}
                                {journalActiveTag && (
                                    <span onClick={() => setJournalActiveTag(null)}
                                        style={{ fontSize: '0.68rem', fontWeight: '600', cursor: 'pointer', color: purpleColor, marginLeft: 'auto' }}>✕ clear</span>
                                )}
                            </div>
                        )}

                        {/* Outcome filters */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[{id:'all',label:'All'},{id:'open',label:'Open'},{id:'win',label:'Wins'},{id:'loss',label:'Losses'}].map(f => (
                                <button key={f.id} onClick={() => { setJournalFilter(f.id); setJournalActiveTag(null); }} style={{
                                    flex: 1, padding: '3px 0', fontSize: '0.68rem', fontWeight: '600', letterSpacing: '0.05em',
                                    border: `1px solid ${journalFilter === f.id && !journalActiveTag ? T.green : T.border}`,
                                    borderRadius: '4px', cursor: 'pointer',
                                    background: journalFilter === f.id && !journalActiveTag ? (isDark ? 'rgba(0,255,136,0.07)' : 'rgba(5,150,105,0.07)') : 'transparent',
                                    color: journalFilter === f.id && !journalActiveTag ? T.green : T.textMuted,
                                }}>{f.label}</button>
                            ))}
                        </div>
                        <button onClick={() => setJournalNeedsReview(v => !v)} style={{
                            width: '100%', marginTop: '6px', padding: '3px 0', fontSize: '0.68rem', fontWeight: '600', letterSpacing: '0.05em',
                            border: `1px solid ${journalNeedsReview ? T.amber : T.border}`, borderRadius: '4px', cursor: 'pointer',
                            background: journalNeedsReview ? T.amberBg : 'transparent',
                            color: journalNeedsReview ? T.amber : T.textMuted,
                        }}>Needs review{needsReviewCount > 0 ? ` (${needsReviewCount})` : ''}</button>
                    </div>

                    {/* Sort row — aligns with entry card columns */}
                    <div style={{ padding: '4px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
                        {[
                            { field: 'symbol', asc: 'A → Z', desc: 'Z → A', inactive: 'A → Z' },
                            { field: 'date',   asc: 'Oldest', desc: 'Newest', inactive: 'Newest' },
                        ].map(s => {
                            const active = journalSortField === s.field;
                            const label = active ? (journalSortDir === 'asc' ? s.asc : s.desc) : s.inactive;
                            const arrow = active ? (journalSortDir === 'asc' ? ' ↑' : ' ↓') : '';
                            return (
                                <button key={s.field}
                                    onClick={() => {
                                        if (journalSortField === s.field) {
                                            setJournalSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                        } else {
                                            setJournalSortField(s.field);
                                            setJournalSortDir(s.field === 'date' ? 'desc' : 'asc');
                                        }
                                    }}
                                    style={{
                                        padding: 0, fontSize: '0.62rem', fontWeight: active ? '700' : '500',
                                        letterSpacing: '0.03em', border: 'none', background: 'transparent',
                                        cursor: 'pointer', color: active ? T.textSecondary : T.textFaint,
                                        fontFamily: 'inherit', transition: 'color 0.12s',
                                    }}>
                                    {label}{arrow}
                                </button>
                            );
                        })}
                    </div>

                    {/* Entry list */}
                    <div style={{ overflowY: 'auto', flex: 1, ...journalScrollbar }}>
                        {filteredJournal.length === 0 ? (
                            <div style={{ padding: '24px 14px', textAlign: 'center', color: T.textFaint, fontSize: '0.78rem' }}>
                                {journalTrades.length === 0 ? 'No closed trades or notes yet' : 'No entries match'}
                            </div>
                        ) : filteredJournal.map(t => {
                            const outcome = getOutcome(t);
                            const isActive = activeEntry?.id === t.id;
                            const outcomeColor = outcome === 'win' ? T.green : outcome === 'loss' ? T.red : T.blue;
                            const outcomeBg    = outcome === 'win' ? (isDark ? 'rgba(0,255,136,0.12)' : 'rgba(5,150,105,0.1)') : outcome === 'loss' ? (isDark ? 'rgba(255,68,68,0.12)' : 'rgba(220,38,38,0.08)') : (isDark ? 'rgba(0,204,255,0.12)' : 'rgba(2,132,199,0.1)');
                            return (
                                <div key={t.id} onClick={() => { setJournalSelected(t); setJournalReviewEditing(null); }}
                                    style={{ padding: '11px 14px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer',
                                        background: isActive ? T.surfaceBg : T.panelBg,
                                        borderLeft: `2px solid ${isActive ? T.green : 'transparent'}`, transition: 'background 0.1s' }}
                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.surfaceBg; }}
                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = T.panelBg; }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '0.88rem', fontWeight: '700', color: T.textPrimary, letterSpacing: '0.01em' }}>{t.symbol}</span>
                                            <span style={{ fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.06em', color: outcomeColor, background: outcomeBg, padding: '1px 6px', borderRadius: '20px', textTransform: 'uppercase' }}>
                                                {outcome === 'open' ? 'OPEN' : outcome === 'win' ? 'WIN' : 'LOSS'}
                                            </span>
                                            {t.direction === 'short' && (
                                                <span style={{ fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.06em', color: T.amber, background: isDark ? 'rgba(255,170,0,0.12)' : 'rgba(217,119,6,0.1)', padding: '1px 6px', borderRadius: '20px' }}>SHORT</span>
                                            )}
                                            {needsReview(t) && (
                                                <span title="Needs review" style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.amber, flexShrink: 0 }} />
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.68rem', color: T.textFaint }}>{t.exitDate || t.entryDate}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: T.textSecondary, lineHeight: '1.4',
                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {(t.notes || '').trim()
                                            ? (t.notes || '').replace(/#\w+/g, m => m)
                                            : <span style={{ fontStyle: 'italic', color: T.textFaint }}>No notes</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Detail panel ── */}
                <div style={{ flex: 1, background: T.panelBg, overflowY: 'auto', ...journalScrollbar }}>
                    {!activeEntry ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textFaint, fontSize: '0.82rem' }}>
                            Select an entry to read
                        </div>
                    ) : (() => {
                        const t = activeEntry;
                        const outcome = getOutcome(t);
                        const isWin  = outcome === 'win';
                        const isLoss = outcome === 'loss';
                        const isOpen = outcome === 'open';
                        const capitalGains = t.exitPrice != null
                            ? (t.direction === 'short'
                                ? (t.entryPrice - t.exitPrice) * t.qty
                                : (t.exitPrice - t.entryPrice) * t.qty) - (t.fees || 0)
                            : (t.profit || null);
                        const partialProfit = (t.partialExits || []).reduce((s, pe) => s + (pe.profit || 0), 0);
                        const dividends = t.dividend || 0;
                        const profit = capitalGains !== null ? capitalGains + partialProfit + dividends : null;
                        const costBasis = t.entryPrice * (t.originalQty || t.qty);
                        const profitPct = profit !== null && costBasis > 0 ? (profit / costBasis) * 100 : null;
                        const holdDays = t.exitDate
                            ? Math.round((new Date(t.exitDate) - new Date(t.entryDate)) / 86400000)
                            : Math.round((new Date() - new Date(t.entryDate)) / 86400000);
                        const outcomeColor = isWin ? T.green : isLoss ? T.red : T.blue;
                        const outcomeBg    = isWin ? (isDark ? 'rgba(0,255,136,0.12)' : 'rgba(5,150,105,0.1)') : isLoss ? (isDark ? 'rgba(255,68,68,0.12)' : 'rgba(220,38,38,0.08)') : (isDark ? 'rgba(0,204,255,0.12)' : 'rgba(2,132,199,0.1)');
                        const tags = extractTags(t.notes || '');

                        return (
                            <div style={{ padding: '32px 36px', maxWidth: '860px' }}>

                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                            <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '1.6rem', fontWeight: '700', color: T.textPrimary, letterSpacing: '0.01em' }}>{t.symbol}</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em', color: outcomeColor, background: outcomeBg, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                                                {isOpen ? 'OPEN' : isWin ? 'WIN' : 'LOSS'}
                                            </span>
                                            {t.direction === 'short' && (
                                                <span style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em', color: T.amber, background: isDark ? 'rgba(255,170,0,0.12)' : 'rgba(217,119,6,0.1)', padding: '3px 10px', borderRadius: '20px' }}>SHORT</span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.88rem', color: T.textMuted, fontWeight: '400' }}>{t.name || ''}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {/* Camera dropdown */}
                                        {(() => {
                                            const hasShots = t.screenshotUrls?.length > 0;
                                            return (
                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        onClick={() => setJournalCamOpen(o => !o)}
                                                        title={hasShots ? `${t.screenshotUrls.length} screenshot${t.screenshotUrls.length > 1 ? 's' : ''}` : 'Screenshots'}
                                                        style={{ background: 'transparent', border: `1px solid ${hasShots ? T.green : T.border}`, borderRadius: '5px', padding: '6px 9px', cursor: 'pointer', color: hasShots ? T.green : T.textMuted, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: '600', opacity: hasShots ? 1 : 0.5, transition: 'all 0.12s' }}
                                                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = hasShots ? T.green : T.textMuted; }}
                                                        onMouseLeave={e => { e.currentTarget.style.opacity = hasShots ? '1' : '0.5'; e.currentTarget.style.borderColor = hasShots ? T.green : T.border; }}>
                                                        <CameraIcon size={13} />
                                                        {hasShots && <span>{t.screenshotUrls.length}</span>}
                                                    </button>
                                                    {journalCamOpen && (
                                                        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: T.surfaceBg, border: `1px solid ${T.borderStrong}`, borderRadius: '6px', boxShadow: T.shadowMd, zIndex: 100, minWidth: '140px', overflow: 'hidden' }}>
                                                            {hasShots && (
                                                                <button onClick={() => { setLightboxData({ srcs: t.screenshotUrls, index: 0 }); setJournalCamOpen(false); }}
                                                                    style={{ width: '100%', padding: '9px 14px', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, color: T.textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: '500', fontFamily: 'inherit', textAlign: 'left' }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = T.panelBg}
                                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                                    <CameraIcon size={12} /> View ({t.screenshotUrls.length})
                                                                </button>
                                                            )}
                                                            {journalUploadingScreenshot ? (
                                                                <div style={{ padding: '9px 14px', fontSize: '0.75rem', color: T.blue, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', border: `2px solid ${T.blue}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Uploading...
                                                                </div>
                                                            ) : journalPasteActive ? (
                                                                <div style={{ padding: '9px 14px' }}>
                                                                    <div style={{ fontSize: '0.75rem', color: T.blue, fontWeight: '600', marginBottom: '4px' }}>Press Ctrl/Cmd+V</div>
                                                                    <button onClick={() => { setJournalPasteActive(false); setJournalCamOpen(false); }} style={{ fontSize: '0.68rem', color: T.textFaint, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit' }}>cancel</button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => { journalScreenshotFileRef.current?.click(); setJournalCamOpen(false); }}
                                                                        style={{ width: '100%', padding: '9px 14px', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, color: T.textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: '500', fontFamily: 'inherit', textAlign: 'left' }}
                                                                        onMouseEnter={e => e.currentTarget.style.background = T.panelBg}
                                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                                        <CameraIcon size={12} /> Attach file
                                                                    </button>
                                                                    <button onClick={() => setJournalPasteActive(true)}
                                                                        style={{ width: '100%', padding: '9px 14px', background: 'transparent', border: 'none', color: T.textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: '500', fontFamily: 'inherit', textAlign: 'left' }}
                                                                        onMouseEnter={e => e.currentTarget.style.background = T.panelBg}
                                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                                        <ClipboardIcon size={12} /> Paste image
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                    <input ref={journalScreenshotFileRef} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }}
                                                        onChange={e => { const f = e.target.files[0]; if (f) saveJournalScreenshot(t.id, f); e.target.value = ''; }} />
                                                </div>
                                            );
                                        })()}
                                        <button
                                            onClick={() => { handleEditTrade(t); setView('trades'); }}
                                            style={{ fontSize: '0.8rem', fontWeight: '600', color: T.textMuted, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '5px', padding: '7px 14px', cursor: 'pointer', letterSpacing: '0.04em', flexShrink: 0, fontFamily: 'inherit', transition: 'all 0.12s' }}
                                            onMouseEnter={e => { e.currentTarget.style.color = T.green; e.currentTarget.style.borderColor = T.green; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.borderColor = T.border; }}>
                                            ↗ View Trade
                                        </button>
                                    </div>
                                </div>

                                {/* Stats row */}
                                <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: '7px', overflow: 'hidden', marginBottom: '24px' }}>
                                    {[
                                        { label: 'Qty',        value: t.qty },
                                        { label: 'Entry',      value: `$${t.entryPrice.toFixed(2)}` },
                                        { label: 'Exit',       value: t.exitPrice ? `$${t.exitPrice.toFixed(2)}` : '—' },
                                        { label: 'Entry Date', value: t.entryDate },
                                        { label: 'Exit Date',  value: t.exitDate || '—' },
                                        { label: 'Hold',       value: `${holdDays}d` },
                                        { label: 'Direction',  value: t.direction === 'long' ? 'Long' : 'Short' },
                                        { label: 'Net Profit', value: profit != null ? `${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}` : '—', color: profit != null ? (isWin ? T.green : T.red) : T.textFaint },
                                        { label: 'Return',     value: profitPct != null ? `${profitPct >= 0 ? '+' : ''}${profitPct.toFixed(2)}%` : '—', color: profitPct != null ? (isWin ? T.green : T.red) : T.textFaint },
                                    ].map((s, i, arr) => (
                                        <div key={s.label} style={{ flex: 1, padding: '10px 13px', borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : 'none', background: T.surfaceBg }}>
                                            <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '0.62rem', fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', whiteSpace: 'nowrap' }}>{s.label}</div>
                                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', fontWeight: '500', color: s.color || T.textPrimary, whiteSpace: 'nowrap' }}>{s.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Trade Activity — only if partial exits or adds exist */}
                                {(() => {
                                    const exits = t.partialExits || [];
                                    const adds  = t.partialAdds  || [];
                                    if (exits.length === 0 && adds.length === 0) return null;
                                    const totalEvents = exits.length + adds.length;
                                    // Build chronological event list
                                    const events = [
                                        { type: 'entry', date: t.entryDate, qty: t.originalQty || t.qty, price: t.entryPrice, pl: null },
                                        ...adds.map(a => ({ type: 'add', date: a.date, qty: a.qty, price: a.price, pl: null })),
                                        ...exits.map(e => ({ type: 'exit', date: e.exitDate, qty: e.qty, price: e.exitPrice, pl: e.profit })),
                                    ].sort((a, b) => a.date > b.date ? 1 : -1);
                                    const typeStyle = {
                                        entry: { label: 'Entry', color: T.green,  bg: isDark ? 'rgba(0,232,122,0.1)'  : 'rgba(5,150,105,0.1)'  },
                                        add:   { label: 'Add',   color: T.amber,  bg: isDark ? 'rgba(255,170,0,0.1)'  : 'rgba(217,119,6,0.1)'  },
                                        exit:  { label: 'Exit',  color: T.red,    bg: isDark ? 'rgba(255,68,68,0.1)'  : 'rgba(220,38,38,0.08)' },
                                    };
                                    return (
                                        <div style={{ marginBottom: '22px' }}>
                                            <div
                                                onClick={() => setJournalActivityExpanded(p => !p)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', marginBottom: journalActivityExpanded ? '10px' : 0 }}>
                                                <span style={{ fontSize: '0.6rem', color: T.textFaint, transition: 'transform 0.15s', display: 'inline-block', transform: journalActivityExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                                                <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '0.68rem', fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trade Activity</span>
                                                <span style={{ fontSize: '0.6rem', fontWeight: '700', color: T.amber, background: isDark ? 'rgba(255,170,0,0.1)' : 'rgba(217,119,6,0.08)', border: `1px solid ${isDark ? 'rgba(255,170,0,0.2)' : 'rgba(217,119,6,0.2)'}`, padding: '1px 6px', borderRadius: '20px' }}>{totalEvents} event{totalEvents > 1 ? 's' : ''}</span>
                                            </div>
                                            {journalActivityExpanded && (
                                                <div style={{ border: `1px solid ${T.border}`, borderRadius: '6px', overflow: 'hidden' }}>
                                                    {/* Header */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 1fr 1fr', background: T.surfaceBg, borderBottom: `1px solid ${T.border}` }}>
                                                        {['Type','Date','Qty','Price','P/L'].map(h => (
                                                            <div key={h} style={{ padding: '5px 10px', fontSize: '0.56rem', fontWeight: '700', color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
                                                        ))}
                                                    </div>
                                                    {events.map((ev, i) => {
                                                        const s = typeStyle[ev.type];
                                                        return (
                                                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 1fr 1fr', borderBottom: i < events.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                                                                <div style={{ padding: '7px 10px' }}>
                                                                    <span style={{ fontSize: '0.58rem', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', color: s.color, background: s.bg, padding: '2px 6px', borderRadius: '3px' }}>{s.label}</span>
                                                                </div>
                                                                <div style={{ padding: '7px 10px', fontFamily: "'DM Mono', monospace", fontSize: '0.73rem', color: T.textSecondary }}>{ev.date}</div>
                                                                <div style={{ padding: '7px 10px', fontFamily: "'DM Mono', monospace", fontSize: '0.73rem', color: T.textSecondary }}>{ev.qty}</div>
                                                                <div style={{ padding: '7px 10px', fontFamily: "'DM Mono', monospace", fontSize: '0.73rem', color: T.textSecondary }}>${parseFloat(ev.price).toFixed(2)}</div>
                                                                <div style={{ padding: '7px 10px', fontFamily: "'DM Mono', monospace", fontSize: '0.73rem', color: ev.pl != null ? (ev.pl >= 0 ? T.green : T.red) : T.textFaint }}>
                                                                    {ev.pl != null ? `${ev.pl >= 0 ? '+' : ''}$${ev.pl.toFixed(2)}` : '—'}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Screenshots strip */}
                                {t.screenshotUrls?.length > 0 && (
                                    <div style={{ marginBottom: '22px' }}>
                                        <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '0.68rem', fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Screenshots</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {t.screenshotUrls.map((url, idx) => (
                                                <div key={url} style={{ position: 'relative', width: 160, height: 115, borderRadius: '4px', overflow: 'hidden', border: `1px solid ${T.borderStrong}`, flexShrink: 0 }}
                                                    onMouseEnter={e => { const btn = e.currentTarget.querySelector('button'); if (btn) btn.style.opacity = '1'; }}
                                                    onMouseLeave={e => { const btn = e.currentTarget.querySelector('button'); if (btn) { btn.style.opacity = '0'; btn.style.background = 'rgba(0,0,0,0.35)'; btn.style.color = 'rgba(255,255,255,0.5)'; } }}>
                                                    <img src={url} alt={`screenshot ${idx + 1}`}
                                                        onClick={() => setLightboxData({ srcs: t.screenshotUrls, index: idx })}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }} />
                                                    <button
                                                        onClick={() => setConfirmDialog({ title: 'Delete Screenshot', message: 'Are you sure you want to delete this screenshot? This cannot be undone.', onConfirm: () => deleteJournalScreenshot(t.id, url) })}
                                                        title="Delete screenshot"
                                                        style={{ position: 'absolute', top: 5, right: 5, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: '900', lineHeight: 1, opacity: 0, transition: 'opacity 0.15s' }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.75)'; e.currentTarget.style.color = '#fff'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.35)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
                                                        &#x2715;
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Post-Trade Review */}
                                {(() => {
                                    journalActiveTradeRef.current = t;
                                    const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
                                    const rv = t.review || null;
                                    const editing = journalReviewEditing === t.id;
                                    const labelStyle = { fontFamily: sans, fontSize: '0.75rem', fontWeight: '800', color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' };
                                    const subLabel = { fontFamily: sans, fontSize: '0.62rem', fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' };
                                    const cardStyle = { border: `1px solid ${T.border}`, borderRadius: '7px', background: T.surfaceBg, padding: '16px 18px' };
                                    const primaryBtn = { padding: '6px 18px', background: T.green, border: 'none', borderRadius: '5px', color: isDark ? '#000' : '#fff', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' };
                                    const ghostBtn = { padding: '6px 14px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '5px', color: T.textSecondary, fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' };
                                    const inputStyle = { width: '100%', padding: '8px 10px', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '6px', color: T.textPrimary, fontFamily: sans, fontSize: '0.88rem', lineHeight: '1.6', outline: 'none', boxSizing: 'border-box' };
                                    const scoreColor = (n) => n >= 8 ? T.green : n >= 5 ? T.amber : T.red;
                                    const scoreBg = (n) => n >= 8 ? T.greenBg : n >= 5 ? T.amberBg : T.redBg;

                                    // Reflection columns: shared by the editor and the saved view
                                    const reflectionFields = [
                                        { field: 'right', label: 'What went right', Icon: CheckCircleIcon, color: T.green, id: `jr-right-${t.id}` },
                                        { field: 'wrong', label: 'What went wrong', Icon: XCircleIcon, color: T.red, id: `jr-wrong-${t.id}` },
                                        { field: 'rule', label: 'Key Lesson', Icon: LightbulbIcon, color: T.amber, id: `jr-rule-${t.id}` },
                                    ];
                                    const reflectionTitle = { display: 'flex', alignItems: 'center', gap: '8px', fontFamily: sans, fontSize: '0.78rem', fontWeight: '800', color: T.textPrimary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' };
                                    const reflectionBox = { border: `1px solid ${T.border}`, borderRadius: '12px', background: T.panelBg, padding: '12px 14px', boxSizing: 'border-box' };

                                    // ── Open trade: locked ──
                                    if (isOpen) {
                                        return (
                                            <div style={{ marginBottom: '22px' }}>
                                                <div style={labelStyle}>Post-Trade Review</div>
                                                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: T.textFaint }}>Review unlocks when you close this trade.</div>
                                            </div>
                                        );
                                    }

                                    // ── Closed, not reviewed, not editing ──
                                    if (!rv && !editing) {
                                        return (
                                            <div style={{ ...cardStyle, marginBottom: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                                                <div>
                                                    <div style={labelStyle}>Post-Trade Review</div>
                                                    <div style={{ marginTop: '6px', fontSize: '0.8rem', color: T.textMuted }}>Not reviewed yet. Grade your process, not the P&amp;L.</div>
                                                </div>
                                                <button
                                                    onClick={() => { setJournalReviewDraft({ scores: {}, mistakes: [], exitReason: null }); setJournalReviewEditing(t.id); }}
                                                    style={{ ...primaryBtn, flexShrink: 0 }}>
                                                    Start review
                                                </button>
                                            </div>
                                        );
                                    }

                                    // ── Editing ──
                                    if (editing) {
                                        const d = journalReviewDraft;
                                        const toggleMistake = (m) => setJournalReviewDraft(prev => {
                                            const has = prev.mistakes.includes(m);
                                            if (m === REVIEW_NONE_TAG) return { ...prev, mistakes: has ? [] : [REVIEW_NONE_TAG] };
                                            const base = prev.mistakes.filter(x => x !== REVIEW_NONE_TAG);
                                            return { ...prev, mistakes: has ? base.filter(x => x !== m) : [...base, m] };
                                        });
                                        const readText = (id) => (document.getElementById(id)?.value || '').trim();
                                        const handleSaveReview = async () => {
                                            const plannedStop = readText(`jr-stop-${t.id}`) || null;
                                            const plannedTarget = readText(`jr-target-${t.id}`) || null;
                                            const review = {
                                                scores: { ...d.scores },
                                                scale: REVIEW_SCALE,
                                                exitReason: d.exitReason || null,
                                                mistakes: [...d.mistakes],
                                                plannedStop,
                                                plannedTarget,
                                                right: readText(`jr-right-${t.id}`),
                                                wrong: readText(`jr-wrong-${t.id}`),
                                                rule: readText(`jr-rule-${t.id}`),
                                                reviewedAt: rv?.reviewedAt || new Date().toISOString().split('T')[0],
                                            };
                                            const ok = await saveJournalReview(t.id, review);
                                            if (ok) setJournalReviewEditing(null);
                                        };
                                        return (
                                            <div style={{ ...cardStyle, marginBottom: '22px' }}>
                                                <div style={{ ...labelStyle, marginBottom: '4px' }}>Post-Trade Review</div>
                                                <div style={{ fontSize: '0.78rem', color: T.textMuted, marginBottom: '16px' }}>Grade how you executed, not how it turned out. 1 = poor, 10 = textbook.</div>

                                                {/* Scorecard */}
                                                <div style={subLabel}>Process scorecard</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
                                                    {REVIEW_SCORE_FIELDS.map(f => (
                                                        <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{ width: '120px', fontFamily: sans, fontSize: '0.82rem', color: T.textSecondary }}>{f.label}</span>
                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                {Array.from({ length: REVIEW_SCALE }, (_, i) => i + 1).map(n => {
                                                                    const sel = d.scores[f.key] === n;
                                                                    return (
                                                                        <button key={n}
                                                                            onClick={() => setJournalReviewDraft(prev => ({ ...prev, scores: { ...prev.scores, [f.key]: n } }))}
                                                                            style={{ width: '28px', padding: '4px 0', fontSize: '0.78rem', fontWeight: '700', fontFamily: "'DM Mono', monospace", cursor: 'pointer', borderRadius: '4px',
                                                                                border: `1px solid ${sel ? scoreColor(n) : T.border}`,
                                                                                background: sel ? scoreBg(n) : 'transparent',
                                                                                color: sel ? scoreColor(n) : T.textMuted }}>
                                                                            {n}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Exit reason */}
                                                <div style={subLabel}>Exit reason</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                                                    {REVIEW_EXIT_REASONS.map(r => {
                                                        const sel = d.exitReason === r;
                                                        return (
                                                            <span key={r}
                                                                onClick={() => setJournalReviewDraft(prev => ({ ...prev, exitReason: prev.exitReason === r ? null : r }))}
                                                                style={{ fontFamily: sans, fontSize: '0.76rem', fontWeight: '600', cursor: 'pointer', padding: '4px 12px', borderRadius: '20px', userSelect: 'none',
                                                                    color: sel ? T.blue : T.textSecondary,
                                                                    background: sel ? T.blueBg : 'transparent',
                                                                    border: `1px solid ${sel ? T.blue : T.border}` }}>
                                                                {r}
                                                            </span>
                                                        );
                                                    })}
                                                </div>

                                                {/* Mistake tags */}
                                                <div style={subLabel}>Mistakes</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                                                    {[...REVIEW_MISTAKES, REVIEW_NONE_TAG].map(m => {
                                                        const sel = d.mistakes.includes(m);
                                                        const isNone = m === REVIEW_NONE_TAG;
                                                        const c = isNone ? T.green : T.red;
                                                        return (
                                                            <span key={m} onClick={() => toggleMistake(m)}
                                                                style={{ fontFamily: sans, fontSize: '0.76rem', fontWeight: '600', cursor: 'pointer', padding: '4px 12px', borderRadius: '20px', userSelect: 'none',
                                                                    color: sel ? c : T.textSecondary,
                                                                    background: sel ? (isNone ? T.greenBg : T.redBg) : 'transparent',
                                                                    border: `1px solid ${sel ? c : T.border}` }}>
                                                                {m}
                                                            </span>
                                                        );
                                                    })}
                                                </div>

                                                {/* Plan */}
                                                <div style={subLabel}>Plan <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: '500', color: T.textFaint }}>(optional: a price, an R multiple, a moving average, any condition)</span></div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
                                                    {[
                                                        { id: `jr-stop-${t.id}`,   label: 'Planned stop', val: rv?.plannedStop,   ph: 'e.g. $47.50 or below 50 MA' },
                                                        { id: `jr-target-${t.id}`, label: 'Planned exit', val: rv?.plannedTarget, ph: 'e.g. 3R, $62, or 20 EMA cross' },
                                                    ].map(f => (
                                                        <div key={f.id} style={{ flex: '1 1 220px', minWidth: 0 }}>
                                                            <div style={{ fontFamily: sans, fontSize: '0.7rem', color: T.textMuted, marginBottom: '4px' }}>{f.label}</div>
                                                            <input id={f.id} type="text" defaultValue={planText(f.val)} placeholder={f.ph}
                                                                style={{ ...inputStyle, fontSize: '0.82rem', textOverflow: 'ellipsis' }} />
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Reflection */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                                                    {reflectionFields.map(f => (
                                                        <div key={f.field} style={{ flex: '1 1 190px', minWidth: 0 }}>
                                                            <div style={reflectionTitle}><f.Icon size={16} color={f.color} />{f.label}</div>
                                                            <textarea id={f.id} defaultValue={rv?.[f.field] || ''} rows={4}
                                                                style={{ ...inputStyle, ...reflectionBox, display: 'block', resize: 'vertical', fontSize: '0.86rem', lineHeight: '1.55' }} />
                                                        </div>
                                                    ))}
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={handleSaveReview} style={primaryBtn}>Save review</button>
                                                    <button onClick={() => setJournalReviewEditing(null)} style={ghostBtn}>Cancel</button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // ── Saved review (read-only) ──
                                    const scoreOf = (f) => reviewScoreOnScale(rv, rv.scores?.[f.key]);
                                    const scoreVals = REVIEW_SCORE_FIELDS.map(scoreOf).filter(n => n != null);
                                    const avgScore = scoreVals.length ? scoreVals.reduce((s, n) => s + n, 0) / scoreVals.length : null;
                                    return (
                                        <div style={{ ...cardStyle, marginBottom: '22px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={labelStyle}>Post-Trade Review</div>
                                                    <button
                                                        onClick={() => { setJournalReviewDraft({ scores: Object.fromEntries(Object.entries(rv.scores || {}).map(([k, v]) => [k, reviewScoreOnScale(rv, v)])), mistakes: [...(rv.mistakes || [])], exitReason: rv.exitReason || null }); setJournalReviewEditing(t.id); }}
                                                        title="Edit review"
                                                        style={{ background: 'transparent', border: 'none', padding: '1px 3px', cursor: 'pointer', color: T.textMuted, lineHeight: 1, transition: 'color 0.12s', fontSize: '0.85rem' }}
                                                        onMouseEnter={e => e.currentTarget.style.color = T.green}
                                                        onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
                                                        ✎
                                                    </button>
                                                </div>
                                                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: T.textFaint }}>
                                                    {avgScore != null && <span style={{ color: scoreColor(Math.round(avgScore)), marginRight: '10px' }}>Process {avgScore.toFixed(1)}/{REVIEW_SCALE}</span>}
                                                    Reviewed {rv.reviewedAt}
                                                </div>
                                            </div>

                                            {/* Scorecard */}
                                            <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '14px' }}>
                                                {REVIEW_SCORE_FIELDS.map((f, i, arr) => {
                                                    const n = scoreOf(f) || 0;
                                                    return (
                                                        <div key={f.key} style={{ flex: 1, padding: '9px 12px', borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : 'none', background: T.panelBg }}>
                                                            <div style={{ fontFamily: sans, fontSize: '0.62rem', fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', whiteSpace: 'nowrap' }}>{f.label}</div>
                                                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', fontWeight: '500', color: n ? scoreColor(n) : T.textFaint }}>
                                                                {n ? `${n}/${REVIEW_SCALE}` : '—'}
                                                            </div>
                                                            <div style={{ height: '3px', borderRadius: '2px', background: T.border, marginTop: '6px', overflow: 'hidden' }}>
                                                                <div style={{ width: `${(n / REVIEW_SCALE) * 100}%`, height: '100%', background: n ? scoreColor(n) : 'transparent' }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Mistakes */}
                                            {(rv.mistakes || []).length > 0 && (
                                                <div style={{ marginBottom: '14px' }}>
                                                    <div style={subLabel}>Mistakes</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                        {(rv.mistakes || []).map(m => {
                                                            const isNone = m === REVIEW_NONE_TAG;
                                                            return (
                                                                <span key={m} style={{ fontFamily: sans, fontSize: '0.74rem', fontWeight: '600', padding: '3px 11px', borderRadius: '20px',
                                                                    color: isNone ? T.green : T.red, background: isNone ? T.greenBg : T.redBg, border: `1px solid ${isNone ? T.green : T.red}` }}>
                                                                    {m}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Plan */}
                                            {(planText(rv.plannedStop) || planText(rv.plannedTarget)) && (
                                                <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '14px' }}>
                                                    {[
                                                        { label: 'Planned stop', text: planText(rv.plannedStop) },
                                                        { label: 'Planned exit', text: planText(rv.plannedTarget) },
                                                    ].filter(c => c.text).map((c, i, arr) => (
                                                        <div key={c.label} style={{ flex: 1, minWidth: 0, padding: '9px 12px', borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : 'none', background: T.panelBg }}>
                                                            <div style={{ fontFamily: sans, fontSize: '0.62rem', fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', whiteSpace: 'nowrap' }}>{c.label}</div>
                                                            <div style={{ fontFamily: sans, fontSize: '0.88rem', color: T.textSecondary, lineHeight: '1.5', overflowWrap: 'anywhere' }}>{c.text}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Exit reason — sits directly above After exit */}
                                            {rv.exitReason && (
                                                <div style={{ marginBottom: '10px' }}>
                                                    <div style={subLabel}>Exit reason</div>
                                                    <span style={{ display: 'inline-block', fontFamily: sans, fontSize: '0.74rem', fontWeight: '600', padding: '3px 11px', borderRadius: '20px',
                                                        color: T.blue, background: T.blueBg, border: `1px solid ${T.blue}` }}>
                                                        {rv.exitReason}
                                                    </span>
                                                </div>
                                            )}

                                            {/* After exit — revealed only once the review is saved */}
                                            {(() => {
                                                if (!t.exitDate || !(t.exitPrice > 0)) return null;
                                                const key = afterExitKey(t);
                                                const stored = rv.afterExit && rv.afterExit.key === key ? rv.afterExit : null;
                                                const live = afterExitCacheRef.current[key];
                                                const liveData = live?.status === 'ready' ? live.data : null;
                                                const final = !!(stored && stored.complete);
                                                const srcData = final ? stored : (liveData && liveData.status === 'ready' ? liveData : null);
                                                const marks = (srcData && srcData.marks) || (stored && stored.marks) || {};
                                                const complete = !!(srcData && srcData.complete);
                                                const hasMarks = AFTER_EXIT_MARKS.some(n => marks[n] != null);
                                                const split = !final && !!(liveData && liveData.splitSuspect);
                                                const pctColor = (v) => v == null ? T.textFaint : v > 0 ? T.amber : v < 0 ? T.green : T.textPrimary;
                                                const lastMark = AFTER_EXIT_MARKS[AFTER_EXIT_MARKS.length - 1];
                                                const stillUpdating = complete ? '' : ` Still updating until ${lastMark} trading days have passed.`;
                                                const cells = [
                                                    ...AFTER_EXIT_MARKS.map(n => ({
                                                        label: `${n} days`, v: marks[n],
                                                        tip: `Price move at the close of the ${n}th trading day after your final exit, measured from your exit price. + means the price kept going your way after you sold. \u2212 means it went against you, so the exit saved you from that.`,
                                                    })),
                                                    {
                                                        label: complete ? 'Best after' : 'Best so far', v: srcData ? srcData.best : null,
                                                        tip: `The furthest the price ran in your direction at any point in the ${lastMark} trading days after your exit (intraday highs for longs, lows for shorts). It's a hindsight ceiling, not a realistic target. Nobody sells the exact top.${stillUpdating}`,
                                                    },
                                                    {
                                                        label: complete ? 'Worst after' : 'Worst so far', v: srcData ? srcData.worst : null,
                                                        tip: `The furthest the price moved against your direction at any point in those ${lastMark} days (intraday lows for longs, highs for shorts). It shows the worst dip you would have sat through had you held on.${stillUpdating}`,
                                                    },
                                                ];
                                                let status = null;
                                                if (!final && !hasMarks) {
                                                    if (live?.status === 'error') status = 'error';
                                                    else if (liveData && liveData.status === 'pending') status = 'pending';
                                                    else status = 'loading';
                                                }
                                                return (
                                                    <div style={{ marginBottom: '14px' }}>
                                                        <div style={subLabel}>After exit <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: '500', color: T.textFaint }}>(vs your final exit at ${Number(t.exitPrice).toFixed(2)})</span></div>
                                                        {status === 'loading' && <div style={{ fontSize: '0.78rem', color: T.textFaint }}>Loading price history…</div>}
                                                        {status === 'pending' && <div style={{ fontSize: '0.78rem', color: T.textFaint }}>The first mark appears 5 trading days after your exit.</div>}
                                                        {status === 'error' && (
                                                            <div style={{ fontSize: '0.78rem', color: T.textFaint }}>
                                                                Price history unavailable ({live.error}).{' '}
                                                                <span onClick={() => { delete afterExitCacheRef.current[key]; setAfterExitTick(n => n + 1); }}
                                                                    style={{ color: T.blue, cursor: 'pointer', fontWeight: '600' }}>Retry</span>
                                                            </div>
                                                        )}
                                                        {status === null && (
                                                            <>
                                                                <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: '6px' }}>
                                                                    {cells.map((c, i, arr) => (
                                                                        <div key={c.label} className="ae-cell" style={{ flex: 1, padding: '9px 12px', borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : 'none', background: T.panelBg, borderRadius: i === 0 ? '5px 0 0 5px' : i === arr.length - 1 ? '0 5px 5px 0' : 0 }}>
                                                                            <div style={{ fontFamily: sans, fontSize: '0.62rem', fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', whiteSpace: 'nowrap' }}>{c.label}</div>
                                                                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', fontWeight: '500', color: pctColor(c.v), whiteSpace: 'nowrap' }}>{fmtAfterExitPct(c.v) || (c.label.includes('days') ? 'pending' : '—')}</div>
                                                                            <div className="ae-tip" style={{ position: 'absolute', top: 'calc(100% + 6px)', ...(i >= arr.length - 2 ? { right: 0 } : { left: 0 }), width: '260px', background: isDark ? '#111' : '#fff', border: `1px solid ${T.borderStrong}`, borderRadius: '8px', padding: '9px 12px', fontFamily: sans, fontSize: '0.72rem', fontWeight: '400', textTransform: 'none', letterSpacing: 0, lineHeight: 1.5, color: T.textSecondary, whiteSpace: 'normal', pointerEvents: 'none', zIndex: 200, boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.7)' : '0 8px 32px rgba(0,0,0,0.15)', opacity: 0, transition: 'opacity 0.15s' }}>{c.tip}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {split && <div style={{ marginTop: '6px', fontSize: '0.74rem', color: T.amber }}>A move over ±50% since your exit can mean a stock split. Check it; these numbers are not being saved.</div>}
                                                                {!split && !final && <div style={{ marginTop: '6px', fontSize: '0.72rem', color: T.textFaint }}>Marks lock in once 60 trading days have passed.</div>}
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {/* Reflection */}
                                            {reflectionFields.some(f => rv[f.field]) && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                                    {reflectionFields.map(f => (
                                                        <div key={f.field} style={{ flex: '1 1 190px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                                            <div style={reflectionTitle}><f.Icon size={16} color={f.color} />{f.label}</div>
                                                            <div style={{ ...reflectionBox, flex: 1, fontFamily: sans, fontSize: '0.86rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
                                                                color: rv[f.field] ? (f.field === 'rule' ? T.textPrimary : T.textSecondary) : T.textFaint,
                                                                fontWeight: f.field === 'rule' && rv[f.field] ? '600' : '400' }}>
                                                                {rv[f.field] || '—'}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Notes */}
                                <div style={{ marginBottom: '22px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                        <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '0.75rem', fontWeight: '800', color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notes</div>
                                        <button
                                            onClick={() => setJournalEditingNotes(prev => prev === t.id ? null : t.id)}
                                            title={journalEditingNotes === t.id ? 'Cancel editing' : 'Edit notes'}
                                            style={{ background: 'transparent', border: 'none', padding: '1px 3px', cursor: 'pointer', color: journalEditingNotes === t.id ? T.green : T.textMuted, lineHeight: 1, transition: 'color 0.12s', fontSize: '0.85rem' }}
                                            onMouseEnter={e => e.currentTarget.style.color = T.green}
                                            onMouseLeave={e => { if (journalEditingNotes !== t.id) e.currentTarget.style.color = T.textMuted; }}>
                                            ✎
                                        </button>
                                    </div>
                                    {journalEditingNotes === t.id ? (
                                        <div>
                                            <textarea
                                                defaultValue={t.notes || ''}
                                                ref={el => { if (el) el.journalTradeId = t.id; }}
                                                id={`journal-notes-${t.id}`}
                                                rows={6}
                                                placeholder="Add notes, #tags..."
                                                style={{ width: '100%', padding: '10px 12px', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '6px', color: T.textPrimary, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '0.95rem', lineHeight: '1.7', resize: 'vertical', outline: 'none' }}
                                            />
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                <button
                                                    onClick={() => {
                                                        const el = document.getElementById(`journal-notes-${t.id}`);
                                                        if (el) { saveJournalNotes(t.id, el.value); setJournalEditingNotes(null); }
                                                    }}
                                                    style={{ padding: '6px 18px', background: T.green, border: 'none', borderRadius: '5px', color: isDark ? '#000' : '#fff', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setJournalEditingNotes(null)}
                                                    style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '5px', color: T.textSecondary, fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <NoteText text={t.notes || ''} />
                                    )}
                                </div>

                                {/* Tags */}
                                {tags.length > 0 && (
                                    <div style={{ paddingTop: '16px', borderTop: `1px solid ${T.border}`, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {tags.map(tag => (
                                            <span key={tag} onClick={() => handleJournalTagClick(tag)}
                                                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '0.76rem', fontWeight: '600', color: purpleColor, background: purpleBg, border: `1px solid ${purpleBorder}`, padding: '4px 12px', borderRadius: '20px', cursor: 'pointer' }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
        <Lightbox {...props} />
        {confirmDialog && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: T.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 1200 }}>
                <div style={{ background: T.surfaceBg, borderRadius: '8px', padding: '2rem', maxWidth: '400px', width: '100%', border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: isDark ? '#f87171' : '#dc2626' }}>⚠ {confirmDialog.title}</h3>
                        <button onClick={() => setConfirmDialog(null)} style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <p style={{ color: T.textSecondary, fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{confirmDialog.message}</p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setConfirmDialog(null)}
                            style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '5px', color: T.textSecondary, cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Cancel</button>
                        <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                            style={{ flex: 1, padding: '0.75rem', background: isDark ? '#7f1d1d' : '#fecaca', border: `1px solid ${isDark ? '#f87171' : '#dc2626'}`, borderRadius: '5px', color: isDark ? '#fca5a5' : '#991b1b', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>Delete</button>
                    </div>
                </div>
            </div>
        )}
    </>);
}
