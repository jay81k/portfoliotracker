// Confirm / clear-portfolio / delete-portfolio dialogs — moved out of App.jsx.

import React from 'react';
import { X } from './icons';
import ScreenshotSection from './ScreenshotSection';

export default function SharedModals(props) {
    const {
        T, confirmDialog, dividendAddActive, dividendAddVal, fetchSymbolName, fetchingName, formData,
        handleAddPortfolio, handleAddTrade, handleClearPortfolio, handleConfirmDeletePortfolio, isDark,
        newPortfolioName, notesTab, pendingBlobs, portfolioToDelete, portfolios, resetFormData,
        screenshotFileRef, screenshotUrls, setConfirmDialog, setDividendAddActive, setDividendAddVal,
        setFetchingName, setFormData, setIsPasteActive, setNewPortfolioName, setNotesTab, setPendingBlobs,
        setPortfolioToDelete, setScreenshotUrls, setShowAddPortfolio, setShowAddTrade, setShowClearConfirm,
        setShowDeletePortfolioConfirm, showAddPortfolio, showAddTrade, showClearConfirm,
        showDeletePortfolioConfirm, showToast,
    } = props;

    return (<>
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
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.textSecondary; e.currentTarget.style.color = T.textPrimary; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}
                            style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '5px', color: T.textSecondary, cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Cancel</button>
                        <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                            onMouseEnter={e => { e.currentTarget.style.background = isDark ? '#991b1b' : '#fca5a5'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = isDark ? '#7f1d1d' : '#fecaca'; }}
                            style={{ flex: 1, padding: '0.75rem', background: isDark ? '#7f1d1d' : '#fecaca', border: `1px solid ${isDark ? '#f87171' : '#dc2626'}`, borderRadius: '5px', color: isDark ? '#fca5a5' : '#991b1b', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>Confirm</button>
                    </div>
                </div>
            </div>
        )}
        {showAddTrade && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: T.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 1000 }}>
                <div style={{ background: T.surfaceBg, borderRadius: '8px', padding: '2rem', maxWidth: '540px', width: '100%', border: `1px solid ${T.border}`, maxHeight: '90vh', overflow: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>ADD TRADE</h3>
                        <button onClick={() => { setShowAddTrade(false); resetFormData(); setScreenshotUrls([]); setPendingBlobs([]); setIsPasteActive(false); setNotesTab('notes'); }} style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer' }}><X size={24} /></button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 145px', gap: '1rem' }}>
                            <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Symbol *</label>
                            <input type="text" placeholder="AAPL" value={formData.symbol}
                                onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                                onBlur={async (e) => {
                                    const sym = e.target.value.trim();
                                    if (!sym) return;
                                    if (formData.name && formData.name.trim()) return;
                                    setFetchingName(true);
                                    const name = await fetchSymbolName(sym);
                                    setFetchingName(false);
                                    if (name) setFormData(prev => ({ ...prev, name }));
                                }}
                                style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary, fontSize: '0.95rem' }} /></div>
                            <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600', whiteSpace: 'nowrap' }}>Direction</label>
                            <select value={formData.direction} onChange={(e) => setFormData({...formData, direction: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: formData.direction === 'short' ? T.red : T.green, fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <option value="long" style={{ color: T.green }}>Long</option>
                                <option value="short" style={{ color: T.red }}>Short</option>
                            </select></div>
                            <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600', whiteSpace: 'nowrap' }}>Qty *</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <input type="number" placeholder="100" value={formData.qty} onChange={(e) => setFormData({...formData, qty: e.target.value})} style={{ flex: 1, minWidth: 0, padding: '0.75rem 0.5rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary, fontSize: '0.95rem' }} />
                            <button type="button" title="Open Risk Calculator" onClick={() => window.openRiskCalc && window.openRiskCalc(isDark, { symbol: formData.symbol || undefined, entryPrice: formData.entryPrice || undefined })} style={{ flexShrink: 0, width: '38px', height: '42px', padding: 0, background: T.raisedBg, border: `1px solid ${T.borderStrong}`, borderRadius: '4px', color: T.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><circle cx="8.5" cy="11.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="11.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="15.5" cy="11.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="0.8" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15" r="0.8" fill="currentColor" stroke="none"/><circle cx="8.5" cy="18.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="18.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="15.5" cy="18.5" r="0.8" fill="currentColor" stroke="none"/></svg>
                            </button>
                            </div></div>
                        </div>
                        <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Name {fetchingName && <span style={{ color: T.textFaint, fontWeight: 400, fontSize: '0.75rem', marginLeft: '0.5rem' }}>⟳ looking up...</span>}</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" placeholder={fetchingName ? 'Fetching name...' : 'Auto-filled from symbol, or type manually'} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ flex: 1, padding: '0.75rem', background: T.panelBg, border: `1px solid ${fetchingName ? T.textFaint : T.borderMid}`, borderRadius: '4px', color: T.textPrimary, transition: 'border-color 0.2s' }} />
                        <button type="button" title="Lookup name from symbol" onClick={async () => { if (!formData.symbol) return; setFetchingName(true); const name = await fetchSymbolName(formData.symbol); setFetchingName(false); if (name) setFormData(prev => ({ ...prev, name })); else showToast("info", "Symbol Not Found", `Could not find name for "${formData.symbol}". Try entering it manually.`); }} style={{ padding: '0.75rem 0.9rem', background: T.raisedBg, border: `1px solid ${T.borderStrong}`, borderRadius: '4px', color: formData.symbol ? T.textSecondary : T.textFaint, cursor: formData.symbol ? 'pointer' : 'not-allowed', fontSize: '0.9rem' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
                        </div></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Entry Price *</label>
                            <input type="number" step="0.01" placeholder="0.00" value={formData.entryPrice} onChange={(e) => setFormData({...formData, entryPrice: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary }} /></div>
                            <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Entry Date *</label>
                            <input type="date" value={formData.entryDate} onChange={(e) => setFormData({...formData, entryDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary }} /></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Exit Price</label>
                            <input type="number" step="0.01" placeholder="0.00" value={formData.exitPrice} onChange={(e) => { const newExitPrice = e.target.value; const ep = parseFloat(newExitPrice); const entryP = parseFloat(formData.entryPrice) || 0; const qty = parseFloat(formData.qty) || 0; const fees = parseFloat(formData.fees) || 0; const computedProfit = (!isNaN(ep) && ep > 0) ? (((formData.direction === 'short') ? (entryP - ep) : (ep - entryP)) * qty - fees) : null; setFormData({...formData, exitPrice: newExitPrice, profit: (computedProfit !== null) ? computedProfit.toFixed(2) : formData.profit, exitDate: newExitPrice && !formData.exitDate ? new Date().toISOString().split("T")[0] : formData.exitDate}); }} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary }} /></div>
                            <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Exit Date</label>
                            <input type="date" value={formData.exitDate} onChange={(e) => setFormData({...formData, exitDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary }} /></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 72px', gap: '1rem' }}>
                            <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Profit</label>
                            <input type="number" step="0.01" value={formData.profit} onChange={(e) => setFormData({...formData, profit: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary }} /></div>
                            <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Dividends</label>
                            <input type="number" step="0.01" value={formData.dividend} onChange={(e) => setFormData({...formData, dividend: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem' }}>
                                {dividendAddActive ? (
                                    <>
                                        <input autoFocus type="number" step="0.01" placeholder="add amount" value={dividendAddVal} onChange={(e) => setDividendAddVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && dividendAddVal) { setFormData(prev => ({...prev, dividend: String(((parseFloat(prev.dividend) || 0) + parseFloat(dividendAddVal)).toFixed(2))})); setDividendAddVal(''); setDividendAddActive(false); } else if (e.key === 'Escape') { setDividendAddVal(''); setDividendAddActive(false); } }} style={{ flex: 1, padding: '0.28rem 0.45rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '3px', color: T.textPrimary, fontSize: '0.72rem' }} />
                                        <button onClick={() => { if (dividendAddVal) { setFormData(prev => ({...prev, dividend: String(((parseFloat(prev.dividend) || 0) + parseFloat(dividendAddVal)).toFixed(2))})); } setDividendAddVal(''); setDividendAddActive(false); }} style={{ padding: '0.28rem 0.5rem', background: 'transparent', border: `1px solid ${T.green}`, borderRadius: '3px', color: T.green, cursor: 'pointer', fontSize: '0.72rem', lineHeight: 1 }}>&#10003;</button>
                                        <button onClick={() => { setDividendAddVal(''); setDividendAddActive(false); }} style={{ padding: '0.28rem 0.45rem', background: 'transparent', border: `1px solid ${T.textFaint}`, borderRadius: '3px', color: T.textMuted, cursor: 'pointer', fontSize: '0.72rem', lineHeight: 1 }}>&#10005;</button>
                                    </>
                                ) : (
                                    <button onClick={() => setDividendAddActive(true)} title="Add to dividend total" style={{ padding: '0.18rem 0.45rem', background: 'transparent', border: `1px solid ${T.textFaint}`, borderRadius: '3px', color: T.textMuted, cursor: 'pointer', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.2rem', lineHeight: 1 }}>
                                        <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>+</span> add
                                    </button>
                                )}
                            </div>
                            </div>
                            <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Fees</label>
                            <input type="number" step="0.01" value={formData.fees} onChange={(e) => setFormData({...formData, fees: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary }} /></div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', borderRadius: '4px 4px 0 0', overflow: 'hidden', border: `1px solid ${T.borderMid}`, borderBottom: 'none' }}>
                                {[['notes', 'Notes'], ['screenshots', 'Screenshots']].map(([id, lbl]) => {
                                    const count = screenshotUrls.length + pendingBlobs.length;
                                    return (
                                        <button key={id} onClick={() => setNotesTab(id)} style={{ flex: 1, padding: '0.45rem 0.75rem', background: notesTab === id ? T.panelBg : T.raisedBg, border: 'none', borderRight: id === 'notes' ? `1px solid ${T.borderMid}` : 'none', color: notesTab === id ? T.textPrimary : T.textMuted, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: notesTab === id ? '700' : '500', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
                                            {lbl}{id === 'screenshots' && count > 0 && <span style={{ marginLeft: '0.35rem', fontSize: '0.65rem', background: 'rgba(56,189,248,0.15)', color: T.blue, border: '1px solid rgba(56,189,248,0.3)', borderRadius: '10px', padding: '0 0.35rem', fontWeight: '800' }}>{count}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                            <div style={{ border: `1px solid ${T.borderMid}`, borderRadius: '0 0 4px 4px', background: T.panelBg, minHeight: '110px', padding: '0.75rem' }}>
                                {notesTab === 'notes' ? (
                                    <textarea placeholder="Trade notes..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} style={{ width: '100%', minHeight: '80px', background: 'transparent', border: 'none', outline: 'none', color: T.textPrimary, fontFamily: 'inherit', fontSize: '0.9rem', resize: 'none', padding: 0, lineHeight: '1.6', boxSizing: 'border-box' }} />
                                ) : (
                                    <ScreenshotSection {...props} fileInputRef={screenshotFileRef} />
                                )}
                            </div>
                        </div>
                        <button onClick={handleAddTrade} disabled={!formData.symbol || !formData.qty || !formData.entryPrice || !formData.entryDate} style={{ background: (!formData.symbol || !formData.qty || !formData.entryPrice || !formData.entryDate) ? T.borderStrong : T.green, color: (!formData.symbol || !formData.qty || !formData.entryPrice || !formData.entryDate) ? T.textMuted : T.pageBg, border: 'none', padding: '1rem', borderRadius: '4px', cursor: (!formData.symbol || !formData.qty || !formData.entryPrice || !formData.entryDate) ? 'not-allowed' : 'pointer', fontWeight: '600', marginTop: '1rem' }}>ADD TRADE</button>
                    </div>
                </div>
            </div>
        )}
        {showAddPortfolio && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: T.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 1000 }}>
                <div style={{ background: T.surfaceBg, borderRadius: '8px', padding: '2rem', maxWidth: '420px', width: '100%', border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>NEW PORTFOLIO</h3>
                        <button onClick={() => { setShowAddPortfolio(false); setNewPortfolioName(''); }} style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer' }}><X size={24} /></button>
                    </div>
                    <div style={{ marginBottom: '1rem', color: T.textMuted, fontSize: '0.9rem' }}>
                        Create a separate portfolio to track different accounts (e.g. TFSA, RRSP, Margin).
                    </div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Portfolio Name</label>
                    <input type="text" placeholder="e.g. TFSA, RRSP, Margin..." value={newPortfolioName}
                        onChange={(e) => setNewPortfolioName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddPortfolio()} autoFocus
                        style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary, fontSize: '1rem', marginBottom: '1.25rem', boxSizing: 'border-box' }} />
                    <button onClick={handleAddPortfolio} disabled={!newPortfolioName.trim()}
                        style={{ width: '100%', background: newPortfolioName.trim() ? T.green : T.borderStrong, color: newPortfolioName.trim() ? T.pageBg : T.textMuted, border: 'none', padding: '0.85rem', borderRadius: '4px', cursor: newPortfolioName.trim() ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '1rem' }}
                    >CREATE PORTFOLIO</button>
                </div>
            </div>
        )}
        {showDeletePortfolioConfirm && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: T.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 1100 }}>
                <div style={{ background: T.surfaceBg, borderRadius: '8px', padding: '2rem', maxWidth: '400px', width: '100%', border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: isDark ? '#f87171' : '#dc2626' }}>⚠ DELETE PORTFOLIO</h3>
                        <button onClick={() => { setShowDeletePortfolioConfirm(false); setPortfolioToDelete(null); }} style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <p style={{ color: T.textSecondary, fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                        This will permanently delete <strong style={{ color: T.textPrimary }}>{portfolios.find(p => p.id === portfolioToDelete)?.name || 'this portfolio'}</strong> and all its trades. This action cannot be undone.
                    </p>
                    <p style={{ color: isDark ? '#f87171' : '#dc2626', fontSize: '0.82rem', marginBottom: '1.5rem', fontWeight: '500' }}>Are you sure you want to continue?</p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => { setShowDeletePortfolioConfirm(false); setPortfolioToDelete(null); }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.textSecondary; e.currentTarget.style.color = T.textPrimary; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}
                            style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '5px', color: T.textSecondary, cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Cancel</button>
                        <button onClick={handleConfirmDeletePortfolio}
                            onMouseEnter={e => { e.currentTarget.style.background = isDark ? '#991b1b' : '#fca5a5'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = isDark ? '#7f1d1d' : '#fecaca'; }}
                            style={{ flex: 1, padding: '0.75rem', background: isDark ? '#7f1d1d' : '#fecaca', border: `1px solid ${isDark ? '#f87171' : '#dc2626'}`, borderRadius: '5px', color: isDark ? '#fca5a5' : '#991b1b', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>Delete Portfolio</button>
                    </div>
                </div>
            </div>
        )}
        {showClearConfirm && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: T.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 1100 }}>
                <div style={{ background: T.surfaceBg, borderRadius: '8px', padding: '2rem', maxWidth: '400px', width: '100%', border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: isDark ? '#f87171' : '#dc2626' }}>⚠ CLEAR PORTFOLIO</h3>
                        <button onClick={() => setShowClearConfirm(false)} style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <p style={{ color: T.textSecondary, fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                        This will permanently delete <strong style={{ color: T.textPrimary }}>all trades</strong> in the current portfolio. This action cannot be undone.
                    </p>
                    <p style={{ color: isDark ? '#f87171' : '#dc2626', fontSize: '0.82rem', marginBottom: '1.5rem', fontWeight: '500' }}>Are you sure you want to continue?</p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setShowClearConfirm(false)}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.textSecondary; e.currentTarget.style.color = T.textPrimary; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}
                            style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '5px', color: T.textSecondary, cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Cancel</button>
                        <button onClick={handleClearPortfolio}
                            onMouseEnter={e => { e.currentTarget.style.background = isDark ? '#991b1b' : '#fca5a5'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = isDark ? '#7f1d1d' : '#fecaca'; }}
                            style={{ flex: 1, padding: '0.75rem', background: isDark ? '#7f1d1d' : '#fecaca', border: `1px solid ${isDark ? '#f87171' : '#dc2626'}`, borderRadius: '5px', color: isDark ? '#fca5a5' : '#991b1b', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>Clear All Trades</button>
                    </div>
                </div>
            </div>
        )}
    </>);
}
