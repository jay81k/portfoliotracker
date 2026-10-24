// Dashboard tab — moved out of App.jsx.

import React from 'react';
import { Plus, Upload, X } from '../components/icons';
import { getTotalProfit } from '../utils/tradeMath';
import SharedModals from '../components/SharedModals';
import Sidebar from '../components/Sidebar';

export default function DashboardView(props) {
    const {
        T, activeBalances, activePortfolioId, activeTrades, balanceDraft, balanceEditorRef, beThreshold, beType,
        chartData, chartTimeframe, currencyReturns, customEndDate, customStartDate, dashMenuOpen,
        dashboardFilteredTrades, deltaLookback, fetchCurrentPrices, fetchingPrices, getTimeframeCutoff,
        handleCSVUpload, handleImportJSON, isDark, metrics, portfolioViewMode, portfolios, processingCSV,
        resetFormData, saveBalancesForPortfolio, setBalanceDraft, setBeThreshold, setBeType, setChartTimeframe,
        setCustomEndDate, setCustomStartDate, setDashMenuOpen, setDeltaLookback, setPortfolioViewMode,
        setShowAddTrade, setShowBalanceEditor, setShowBeTooltip, setShowCSVUpload, setShowCustomDatePicker,
        setShowDeltaTooltip, setShowLookbackTooltip, setShowWinRateSettings, setStartingBalances,
        setWinRateSettingsDraft, showBalanceEditor, showBeTooltip, showCSVUpload, showCustomDatePicker,
        showDeltaTooltip, showLookbackTooltip, showToast, showWinRateSettings, startingBalances,
        winRateSettingsDraft,
    } = props;

    return (
        <div style={{ minHeight: '100vh', padding: '2rem', background: T.pageBg, color: T.textPrimary, marginLeft: '220px' }}>
            <Sidebar {...props} />
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '30px', height: '30px', background: T.green, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: '700', letterSpacing: '0.03em', color: T.textPrimary, lineHeight: 1 }}>
                                {portfolioViewMode === 'all' && portfolios.length > 1 ? 'All Portfolios' : (portfolios.find(p => p.id === activePortfolioId)?.name || 'My Portfolio')}
                            </div>
                            {portfolioViewMode === 'all' && portfolios.length > 1 && (
                                <div style={{ fontSize: '0.62rem', color: T.textMuted, fontFamily: "'DM Mono', monospace", marginTop: '3px', letterSpacing: '0.04em' }}>{portfolios.length} portfolios combined</div>
                            )}
                        </div>
                        {/* 3-dots portfolio view menu */}
                        {portfolios.length > 1 && (
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setDashMenuOpen(o => !o)}
                                    title="Portfolio view"
                                    style={{ background: 'transparent', border: `1px solid ${dashMenuOpen ? T.borderStrong : T.border}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', flexShrink: 0, color: T.textMuted, transition: 'border-color 0.15s, background 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = dashMenuOpen ? T.borderStrong : T.border; e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <svg width="13" height="13" viewBox="0 0 4 16" fill="currentColor">
                                        <circle cx="2" cy="2" r="1.5"/>
                                        <circle cx="2" cy="8" r="1.5"/>
                                        <circle cx="2" cy="14" r="1.5"/>
                                    </svg>
                                </button>
                                {dashMenuOpen && (
                                    <>
                                        <div onClick={() => setDashMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                                        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 200, background: isDark ? '#1a1f2e' : '#fff', border: `1px solid ${T.borderStrong}`, borderRadius: '8px', boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.12)', minWidth: '180px', overflow: 'hidden', padding: '4px' }}>
                                            <div style={{ fontSize: '0.6rem', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textFaint, padding: '6px 10px 4px', fontWeight: '600' }}>Portfolio View</div>
                                            {[
                                                { key: 'selected', label: 'Selected Portfolio', desc: 'Current portfolio only' },
                                                { key: 'all', label: 'All Portfolios', desc: 'Combined across all' }
                                            ].map(opt => {
                                                const isActive = portfolioViewMode === opt.key;
                                                return (
                                                    <button key={opt.key} onClick={() => { setPortfolioViewMode(opt.key); setDashMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 10px', background: isActive ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : 'transparent', border: 'none', borderRadius: '5px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
                                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; }}
                                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                                                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: `2px solid ${isActive ? T.green : T.borderStrong}`, background: isActive ? T.green : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                                                            {isActive && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#000' }} />}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.78rem', fontWeight: '600', color: T.textPrimary, lineHeight: 1.2 }}>{opt.label}</div>
                                                            <div style={{ fontSize: '0.65rem', color: T.textMuted, marginTop: '1px', fontFamily: "'DM Mono', monospace" }}>{opt.desc}</div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {activeTrades.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: T.panelBg, borderRadius: '8px', border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>No trades yet</div>
                        <div style={{ fontSize: '1rem', color: T.textMuted, marginBottom: '2rem' }}>Upload a CSV or add your first trade manually</div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => { resetFormData(); setShowAddTrade(true); }} style={{ background: T.raisedBg, color: T.textPrimary, border: `1px solid ${T.borderStrong}`, padding: '1rem 2rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={20} /> Add Trade
                            </button>
                            <button onClick={() => setShowCSVUpload(true)} style={{ background: T.raisedBg, color: T.blue, border: `1px solid ${T.borderStrong}`, padding: '1rem 2rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Upload size={20} /> Upload CSV
                            </button>
                            <label style={{ background: T.raisedBg, color: T.amber, border: `1px solid ${T.borderStrong}`, padding: '1rem 2rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Upload size={20} /> Restore JSON
                                <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ fontSize: '0.85rem', color: T.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>Today's P/L</div>
                                    <button onClick={fetchCurrentPrices} disabled={fetchingPrices} title="Refresh live prices" style={{ background: 'transparent', border: 'none', color: fetchingPrices ? T.textFaint : T.blue, cursor: fetchingPrices ? 'not-allowed' : 'pointer', fontSize: '0.85rem', padding: 0 }}>
                                        {fetchingPrices ? '⟳' : '↻'}
                                    </button>
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: metrics.todaysPL === 0 ? T.textMuted : (metrics.todaysPL >= 0 ? T.green : T.red) }}>
                                    {metrics.todaysPL > 0 ? '+' : ''}${metrics.todaysPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                {(() => {
                                    const _usdDep = (activeBalances.depositsUsd || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                    const _cadDep = (activeBalances.depositsCad || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                    const usdBal = (parseFloat(activeBalances.usd) || 0) + (activeBalances.mode === 'current' ? _usdDep : 0);
                                    const cadBal = (parseFloat(activeBalances.cad) || 0) + (activeBalances.mode === 'current' ? _cadDep : 0);
                                    const totalBal = usdBal + cadBal;
                                    const showPct = activeBalances.showReturnPct !== false && totalBal > 0;
                                    if (!showPct) return <div style={{ fontSize: '0.75rem', color: T.textMuted, marginTop: '0.5rem' }}>Intraday Movement</div>;
                                    const pct = (metrics.todaysPL / totalBal) * 100;
                                    const pctColor = pct === 0 ? T.textMuted : (pct >= 0 ? T.green : T.red);
                                    return <div style={{ marginTop: '0.4rem', position: 'relative', display: 'inline-block' }} onMouseEnter={e => e.currentTarget.querySelector('.pct-tip').style.display = 'block'} onMouseLeave={e => e.currentTarget.querySelector('.pct-tip').style.display = 'none'}><span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.78rem', fontWeight: '300', color: pctColor }}>{pct >= 0 ? '+' : ''}{pct.toFixed(2)}%</span><span className="pct-tip" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: T.surfaceBg, border: `1px solid ${T.borderStrong}`, color: T.textSecondary, fontSize: '0.62rem', padding: '6px 8px', borderRadius: '5px', whiteSpace: 'normal', width: '200px', lineHeight: '1.5', zIndex: 50, pointerEvents: 'none', display: 'none', fontFamily: 'sans-serif', fontWeight: '400', textTransform: 'none', letterSpacing: '0' }}>Today's price movement across all open positions as a % of your total capital (starting balance + deposits).</span></div>;
                                })()}
                            </div>
                            <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}` }}>
                                <div style={{ fontSize: '0.85rem', color: T.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>Unrealized P/L</div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: metrics.unrealizedPL === 0 ? T.textMuted : (metrics.unrealizedPL >= 0 ? T.green : T.red) }}>
                                    {metrics.unrealizedPL > 0 ? '+' : ''}${metrics.unrealizedPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                {(() => {
                                    const _usdDep = (activeBalances.depositsUsd || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                    const _cadDep = (activeBalances.depositsCad || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                    const usdBal = (parseFloat(activeBalances.usd) || 0) + (activeBalances.mode === 'current' ? _usdDep : 0);
                                    const cadBal = (parseFloat(activeBalances.cad) || 0) + (activeBalances.mode === 'current' ? _cadDep : 0);
                                    const totalBal = usdBal + cadBal;
                                    const showPct = activeBalances.showReturnPct !== false && totalBal > 0;
                                    if (!showPct) return null;
                                    const pct = (metrics.unrealizedPL / totalBal) * 100;
                                    const pctColor = pct === 0 ? T.textMuted : (pct >= 0 ? T.green : T.red);
                                    return <div style={{ marginTop: '0.4rem', position: 'relative', display: 'inline-block' }} onMouseEnter={e => e.currentTarget.querySelector('.pct-tip').style.display = 'block'} onMouseLeave={e => e.currentTarget.querySelector('.pct-tip').style.display = 'none'}><span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.78rem', fontWeight: '300', color: pctColor }}>{pct >= 0 ? '+' : ''}{pct.toFixed(2)}%</span><span className="pct-tip" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: T.surfaceBg, border: `1px solid ${T.borderStrong}`, color: T.textSecondary, fontSize: '0.62rem', padding: '6px 8px', borderRadius: '5px', whiteSpace: 'normal', width: '200px', lineHeight: '1.5', zIndex: 50, pointerEvents: 'none', display: 'none', fontFamily: 'sans-serif', fontWeight: '400', textTransform: 'none', letterSpacing: '0' }}>Your current open position gains/losses as a % of your combined starting balance. Changes as market prices update. Denominator includes your starting balance and any deposits.</span></div>;
                                })()}
                            </div>
                            <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}` }}>
                                <div style={{ fontSize: '0.85rem', color: T.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>Realized Profit</div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: metrics.realizedProfit === 0 ? T.textMuted : (metrics.realizedProfit >= 0 ? T.green : T.red) }}>
                                    {metrics.realizedProfit > 0 ? '+' : ''}${metrics.realizedProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                {(() => {
                                    const _usdDep = (activeBalances.depositsUsd || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                    const _cadDep = (activeBalances.depositsCad || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                    const usdBal = (parseFloat(activeBalances.usd) || 0) + (activeBalances.mode === 'current' ? _usdDep : 0);
                                    const cadBal = (parseFloat(activeBalances.cad) || 0) + (activeBalances.mode === 'current' ? _cadDep : 0);
                                    const totalBal = usdBal + cadBal;
                                    const showPct = activeBalances.showReturnPct !== false && totalBal > 0;
                                    if (!showPct) return <div style={{ fontSize: '0.75rem', color: T.textMuted, marginTop: '0.5rem' }}>Capital Gains Only</div>;
                                    const pct = (metrics.realizedProfit / totalBal) * 100;
                                    const pctColor = pct === 0 ? T.textMuted : (pct >= 0 ? T.green : T.red);
                                    return <div style={{ marginTop: '0.4rem', position: 'relative', display: 'inline-block' }} onMouseEnter={e => e.currentTarget.querySelector('.pct-tip').style.display = 'block'} onMouseLeave={e => e.currentTarget.querySelector('.pct-tip').style.display = 'none'}><span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.78rem', fontWeight: '300', color: pctColor }}>{pct >= 0 ? '+' : ''}{pct.toFixed(2)}%</span><span className="pct-tip" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: T.surfaceBg, border: `1px solid ${T.borderStrong}`, color: T.textSecondary, fontSize: '0.62rem', padding: '6px 8px', borderRadius: '5px', whiteSpace: 'normal', width: '200px', lineHeight: '1.5', zIndex: 50, pointerEvents: 'none', display: 'none', fontFamily: 'sans-serif', fontWeight: '400', textTransform: 'none', letterSpacing: '0' }}>Closed trade profits as a % of your total capital (starting balance + deposits). Excludes dividends and unrealized gains. Note: USD and CAD are blended so this is an approximation.</span></div>;
                                })()}
                            </div>
                            {(() => {
                                const hasUSD = currencyReturns.usd !== null;
                                const hasCAD = currencyReturns.cad !== null;
                                const usdColor = currencyReturns.usd !== null ? (currencyReturns.usd >= 0 ? T.green : T.red) : T.textFaint;
                                const cadColor = currencyReturns.cad !== null ? (currencyReturns.cad >= 0 ? T.green : T.red) : T.textFaint;
                                const totalIncentives = (portfolioViewMode === 'selected' && startingBalances.showIncentives && startingBalances.incentives)
                                    ? startingBalances.incentives.reduce((s, i) => {
                                        const cutoff = getTimeframeCutoff(chartTimeframe, customStartDate);
                                        if (cutoff && !i.date) return s; // no date — exclude under active timeframe
                                        if (cutoff && i.date && new Date(i.date) < cutoff) return s; // outside timeframe
                                        return s + (parseFloat(i.amt) || 0);
                                    }, 0) : 0;
                                const displayProfit = metrics.totalProfit + totalIncentives;
                                return (
                                    <div ref={balanceEditorRef} style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}`, position: 'relative' }}
                                        onMouseEnter={e => { const btn = e.currentTarget.querySelector('.balance-dots'); if(btn) btn.style.opacity = '1'; }}
                                        onMouseLeave={e => { const btn = e.currentTarget.querySelector('.balance-dots'); if(btn && !showBalanceEditor) btn.style.opacity = '0'; }}
                                    >
                                        {/* Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <div style={{ position: 'relative', display: 'inline-block' }}
                                                onMouseEnter={e => e.currentTarget.querySelector('.profit-tip').style.display = 'block'}
                                                onMouseLeave={e => e.currentTarget.querySelector('.profit-tip').style.display = 'none'}
                                            >
                                                <div style={{ fontSize: '0.85rem', color: T.textMuted, textTransform: 'uppercase', fontWeight: '600', cursor: 'default' }}>Total Profit</div>
                                                <div className="profit-tip" style={{ display: 'none', position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: T.surfaceBg, border: `1px solid ${T.borderStrong}`, color: T.textSecondary, fontSize: '0.62rem', padding: '8px 10px', borderRadius: '6px', whiteSpace: 'normal', width: '230px', lineHeight: '1.7', zIndex: 50, pointerEvents: 'none', fontFamily: 'sans-serif', fontWeight: '400', textTransform: 'none', letterSpacing: '0', boxShadow: T.shadowMd }}>
                                                    <strong style={{ color: T.textPrimary, display: 'block', marginBottom: '5px' }}>How this is calculated</strong>
                                                    <span style={{ color: T.green }}>+</span> Realized gains (closed trades)<br/>
                                                    <span style={{ color: T.green }}>+</span> Partial exit profits<br/>
                                                    <span style={{ color: T.green }}>+</span> Dividends received<br/>
                                                    <span style={{ color: T.green }}>+</span> Bonuses<br/>
                                                    <div style={{ height: '1px', background: T.border, margin: '5px 0' }} />
                                                    <span style={{ color: T.textFaint }}>Fees deducted from each trade's profit. Unrealized gains on open positions are not included.</span>
                                                    {(currencyReturns.usdProfit !== 0 || currencyReturns.cadProfit !== 0) && (
                                                        <>
                                                            <div style={{ height: '1px', background: T.border, margin: '5px 0' }} />
                                                            <strong style={{ color: T.textPrimary, display: 'block', marginBottom: '4px' }}>Breakdown by currency</strong>
                                                            {currencyReturns.usdProfit !== 0 && (
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                                                    <span>🇺🇸 USD</span>
                                                                    <span style={{ color: currencyReturns.usdProfit >= 0 ? T.green : T.red, fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>
                                                                        {currencyReturns.usdProfit >= 0 ? '+' : ''}${Math.abs(currencyReturns.usdProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {currencyReturns.cadProfit !== 0 && (
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                                                    <span>🇨🇦 CAD</span>
                                                                    <span style={{ color: currencyReturns.cadProfit >= 0 ? T.green : T.red, fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>
                                                                        {currencyReturns.cadProfit >= 0 ? '+' : ''}${Math.abs(currencyReturns.cadProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <button className="balance-dots"
                                                onClick={() => {
                                                    const m = startingBalances.mode || 'starting';
                                                    setBalanceDraft({ usd: m === 'current' ? (startingBalances.currentUsd || '') : (startingBalances.baseUsd || startingBalances.usd), cad: m === 'current' ? (startingBalances.currentCad || '') : (startingBalances.baseCad || startingBalances.cad), mode: m, showReturnPct: startingBalances.showReturnPct !== false, showIncentives: startingBalances.showIncentives || false, incentives: [...(startingBalances.incentives || [])], newIncentiveDesc: '', newIncentiveAmt: '', depositsUsd: [...(startingBalances.depositsUsd || [])], depositsCad: [...(startingBalances.depositsCad || [])], newDepositUsd: '', newDepositCad: '' });
                                                    setShowBalanceEditor(s => !s);
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: T.textFaint, cursor: 'pointer', fontSize: '14px', letterSpacing: '1px', padding: '2px 4px', borderRadius: '4px', lineHeight: 1, opacity: showBalanceEditor ? 1 : 0, transition: 'opacity 0.15s' }}
                                            >···</button>
                                        </div>

                                        {/* Dollar amount */}
                                        <div style={{ fontSize: '2rem', fontWeight: '700', color: displayProfit === 0 ? T.textMuted : (displayProfit >= 0 ? T.green : T.red), marginBottom: '0.4rem' }}>
                                            {displayProfit > 0 ? '+' : ''}${displayProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>

                                        {/* Currency return row with CAGR */}
                                        {startingBalances.showReturnPct !== false && (() => {
                                            const allDates = activeTrades.filter(t => t.entryDate).map(t => t.entryDate);
                                            const earliest = allDates.length > 0 ? allDates.reduce((a, b) => a < b ? a : b) : null;
                                            const yearsTotal = earliest ? (new Date() - new Date(earliest)) / (1000*60*60*24*365.25) : null;
                                            const calcCagr = (pct, yrs) => (!yrs || yrs < 0.5 || pct === null) ? null : (Math.pow(1 + pct/100, 1/yrs) - 1) * 100;
                                            const usdCagr = calcCagr(currencyReturns.usd, yearsTotal);
                                            const cadCagr = calcCagr(currencyReturns.cad, yearsTotal);
                                            const cagrColor = '#00aadd';
                                            const tfLabel = chartTimeframe === 'ALL' ? 'total' : chartTimeframe.toLowerCase();
                                            return (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <div style={{ position: 'relative', display: 'inline-block' }}
                                                            onMouseEnter={e => e.currentTarget.querySelector('.pct-tip').style.display = 'block'}
                                                            onMouseLeave={e => e.currentTarget.querySelector('.pct-tip').style.display = 'none'}
                                                        >
                                                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.88rem', fontWeight: '300', color: hasUSD ? usdColor : T.textFaint }}>
                                                                {hasUSD ? `${currencyReturns.usd >= 0 ? '+' : ''}${currencyReturns.usd.toFixed(2)}%` : '—'}
                                                            </span>
                                                            <span className="pct-tip" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: T.surfaceBg, border: `1px solid ${T.borderStrong}`, color: T.textSecondary, fontSize: '0.62rem', padding: '6px 8px', borderRadius: '5px', whiteSpace: 'normal', width: '200px', lineHeight: '1.5', zIndex: 50, pointerEvents: 'none', display: 'none', fontFamily: 'sans-serif', fontWeight: '400', textTransform: 'none', letterSpacing: '0' }}>Your total USD return as a percentage of your USD starting balance. Includes capital gains and dividends. Excludes bonuses.</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <div style={{ fontSize: '0.6rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🇺🇸 {tfLabel}</div>
                                                            {usdCagr !== null && chartTimeframe === 'ALL' && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', fontWeight: '300', color: cagrColor, position: 'relative', cursor: 'default' }}
                                                            onMouseEnter={e => e.currentTarget.querySelector('.pct-tip').style.display = 'block'}
                                                            onMouseLeave={e => e.currentTarget.querySelector('.pct-tip').style.display = 'none'}
                                                        >{usdCagr >= 0 ? '+' : ''}{usdCagr.toFixed(2)}%/yr<span className="pct-tip" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: T.surfaceBg, border: `1px solid ${T.borderStrong}`, color: T.textSecondary, fontSize: '0.62rem', padding: '6px 8px', borderRadius: '5px', whiteSpace: 'normal', width: '200px', lineHeight: '1.5', zIndex: 50, pointerEvents: 'none', display: 'none', fontFamily: 'sans-serif', fontWeight: '400', textTransform: 'none', letterSpacing: '0' }}>Annualized return — what your total % return works out to per year on average, calculated from your earliest trade date to today.</span></div>}
                                                        </div>
                                                    </div>
                                                    <div style={{ width: '1px', height: '32px', background: T.borderStrong }} />
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <div style={{ position: 'relative', display: 'inline-block' }}
                                                            onMouseEnter={e => e.currentTarget.querySelector('.pct-tip').style.display = 'block'}
                                                            onMouseLeave={e => e.currentTarget.querySelector('.pct-tip').style.display = 'none'}
                                                        >
                                                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.88rem', fontWeight: '300', color: hasCAD ? cadColor : T.textFaint }}>
                                                                {hasCAD ? `${currencyReturns.cad >= 0 ? '+' : ''}${currencyReturns.cad.toFixed(2)}%` : '—'}
                                                            </span>
                                                            <span className="pct-tip" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: T.surfaceBg, border: `1px solid ${T.borderStrong}`, color: T.textSecondary, fontSize: '0.62rem', padding: '6px 8px', borderRadius: '5px', whiteSpace: 'normal', width: '200px', lineHeight: '1.5', zIndex: 50, pointerEvents: 'none', display: 'none', fontFamily: 'sans-serif', fontWeight: '400', textTransform: 'none', letterSpacing: '0' }}>Your total CAD return as a percentage of your CAD starting balance. Includes capital gains and dividends. Excludes bonuses.</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <div style={{ fontSize: '0.6rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🇨🇦 {tfLabel}</div>
                                                            {cadCagr !== null && chartTimeframe === 'ALL' && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', fontWeight: '300', color: cagrColor, position: 'relative', cursor: 'default' }}
                                                            onMouseEnter={e => e.currentTarget.querySelector('.pct-tip').style.display = 'block'}
                                                            onMouseLeave={e => e.currentTarget.querySelector('.pct-tip').style.display = 'none'}
                                                        >{cadCagr >= 0 ? '+' : ''}{cadCagr.toFixed(2)}%/yr<span className="pct-tip" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: T.surfaceBg, border: `1px solid ${T.borderStrong}`, color: T.textSecondary, fontSize: '0.62rem', padding: '6px 8px', borderRadius: '5px', whiteSpace: 'normal', width: '200px', lineHeight: '1.5', zIndex: 50, pointerEvents: 'none', display: 'none', fontFamily: 'sans-serif', fontWeight: '400', textTransform: 'none', letterSpacing: '0' }}>Annualized return — what your total % return works out to per year on average, calculated from your earliest trade date to today.</span></div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Dividends + Bonuses on one line */}
                                        <div style={{ fontSize: '0.68rem', color: T.textFaint, letterSpacing: '0.01em' }}>
                                            ${metrics.totalDividends.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} dividends
                                            {portfolioViewMode === 'selected' && startingBalances.showIncentives && totalIncentives > 0 && (
                                                <span> &nbsp;·&nbsp; ${totalIncentives.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bonuses</span>
                                            )}
                                        </div>

                                        {/* Popover */}
                                        {showBalanceEditor && (
                                            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: T.surfaceBg, border: `1px solid ${T.borderStrong}`, borderRadius: '8px', padding: '1rem', width: '230px', boxShadow: T.shadowMd, zIndex: 999 }}>
                                                {/* Show % toggle */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                                    <div style={{ fontSize: '0.65rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Balance Settings</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <div style={{ fontSize: '0.6rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Show %</div>
                                                        <div onClick={() => setBalanceDraft(d => ({ ...d, showReturnPct: !d.showReturnPct }))}
                                                            style={{ width: '28px', height: '16px', borderRadius: '8px', background: balanceDraft.showReturnPct !== false ? T.green : T.borderStrong, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                                                            <div style={{ position: 'absolute', top: '2px', left: balanceDraft.showReturnPct !== false ? '14px' : '2px', width: '12px', height: '12px', borderRadius: '50%', background: balanceDraft.showReturnPct !== false ? T.pageBg : T.textMuted, transition: 'left 0.2s' }} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Mode toggle */}
                                                <div style={{ display: 'flex', border: `1px solid ${T.borderStrong}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                                                    {[{ key: 'starting', label: 'Starting', tip: 'Enter what you originally deposited.' }, { key: 'current', label: 'Current', tip: "Enter today's account value. We'll back-calculate your starting point." }].map((mode, i) => (
                                                        <div key={mode.key} style={{ flex: 1, position: 'relative' }}
                                                            onMouseEnter={e => e.currentTarget.querySelector('.mode-tip').style.display = 'block'}
                                                            onMouseLeave={e => e.currentTarget.querySelector('.mode-tip').style.display = 'none'}>
                                                            <button onClick={() => setBalanceDraft(d => ({ ...d, mode: mode.key }))}
                                                                style={{ width: '100%', background: balanceDraft.mode === mode.key ? T.raisedBg : 'transparent', border: 'none', borderRight: i === 0 ? `1px solid ${T.borderStrong}` : 'none', color: balanceDraft.mode === mode.key ? T.green : T.textMuted, fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.45rem 0.3rem', cursor: 'pointer' }}
                                                            >{mode.label}</button>
                                                            <div className="mode-tip" style={{ display: 'none', position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: T.raisedBg, border: `1px solid ${T.borderStrong}`, color: T.textSecondary, fontSize: '0.65rem', padding: '6px 8px', borderRadius: '5px', width: '160px', lineHeight: '1.4', zIndex: 20, pointerEvents: 'none' }}>{mode.tip}</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* USD input */}
                                                <div style={{ marginBottom: '0.65rem' }}>
                                                    <div style={{ fontSize: '0.62rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '600', marginBottom: '3px' }}>USD Balance</div>
                                                    <input type="number" placeholder={balanceDraft.mode === 'current' ? 'e.g. 45995' : 'e.g. 30000'}
                                                        value={(() => { const dep = (balanceDraft.depositsUsd || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0); const base = parseFloat(balanceDraft.usd) || 0; return dep > 0 && base > 0 ? (base + dep).toFixed(2) : balanceDraft.usd; })()}
                                                        onChange={e => setBalanceDraft(d => ({ ...d, usd: e.target.value }))}
                                                        readOnly={(balanceDraft.depositsUsd || []).length > 0}
                                                        style={{ width: '100%', padding: '0.45rem 0.6rem', background: (balanceDraft.depositsUsd || []).length > 0 ? T.raisedBg : T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '5px', color: T.textPrimary, fontSize: '0.82rem', fontFamily: "'DM Mono', monospace", outline: 'none' }} />
                                                    {balanceDraft.mode === 'current' && (() => {
                                                        const cur = parseFloat(balanceDraft.usd);
                                                        const usdDep = (balanceDraft.depositsUsd || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                                        const derived = cur - currencyReturns.usdProfit;
                                                        if (!isNaN(cur) && derived > 0) return <div style={{ fontSize: '0.62rem', color: T.textFaint, fontFamily: "'DM Mono', monospace", marginTop: '2px' }}>Starting: <span style={{ color: T.green }}>${derived.toFixed(2)}</span></div>;
                                                        if (!isNaN(cur)) return <div style={{ fontSize: '0.62rem', color: T.red, marginTop: '2px' }}>Must exceed total USD profit</div>;
                                                        return null;
                                                    })()}
                                                    {balanceDraft.mode === 'starting' && (() => {
                                                        const base = parseFloat(balanceDraft.usd) || 0;
                                                        const depTotal = (balanceDraft.depositsUsd || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                                        if (depTotal > 0 && base > 0) return <div style={{ fontSize: '0.62rem', color: T.textFaint, fontFamily: "'DM Mono', monospace", marginTop: '2px' }}>Total incl. deposits: <span style={{ color: T.green }}>${(base + depTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>;
                                                        return null;
                                                    })()}
                                                </div>

                                                {/* USD Deposits */}
                                                {(() => {
                                                    const usdDeps = balanceDraft.depositsUsd || [];
                                                    const usdDepTotal = usdDeps.reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                                    return (
                                                        <div style={{ marginBottom: '0.65rem' }}>
                                                            {usdDeps.length > 0 && usdDeps.map((dep, idx) => (
                                                                <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: isDark ? 'rgba(0,255,136,0.08)' : '#f0faf5', border: `1px solid ${isDark ? 'rgba(0,255,136,0.2)' : '#c0e8d0'}`, borderRadius: '999px', padding: '2px 8px', marginRight: '4px', marginBottom: '4px' }}>
                                                                    <span style={{ fontSize: '0.6rem', color: T.green, fontFamily: "'DM Mono', monospace" }}>+${parseFloat(dep.amt).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                                                    <button onClick={() => {
                                                                        const newDeps = (balanceDraft.depositsUsd || []).filter((_, i) => i !== idx);
                                                                        const newDraft = { ...balanceDraft, depositsUsd: newDeps };
                                                                        setBalanceDraft(newDraft);
                                                                        // Auto-save immediately
                                                                        const usdDepTotal = newDeps.reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                                                        const cadDepTotal = (newDraft.depositsCad || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                                                        let usdVal = newDraft.usd;
                                                                        let cadVal = newDraft.cad;
                                                                        if (newDraft.mode === 'current') {
                                                                            const curUsd = parseFloat(newDraft.usd);
                                                                            const curCad = parseFloat(newDraft.cad);
                                                                            const incTotal = newDraft.showIncentives ? (newDraft.incentives || []).reduce((s, i) => s + (parseFloat(i.amt) || 0), 0) : 0;
                                                                            if (!isNaN(curUsd)) usdVal = String((curUsd - currencyReturns.usdProfit).toFixed(2));
                                                                            if (!isNaN(curCad)) cadVal = String((curCad - currencyReturns.cadProfit - incTotal).toFixed(2));
                                                                        }
                                                                        const savedCurrentUsd = newDraft.mode === 'current' ? newDraft.usd : '';
                                                                        const savedCurrentCad = newDraft.mode === 'current' ? newDraft.cad : '';
                                                                        if (newDraft.mode === 'starting') {
                                                                            const baseU = parseFloat(newDraft.usd) || 0;
                                                                            const baseC = parseFloat(newDraft.cad) || 0;
                                                                            usdVal = String((baseU + usdDepTotal).toFixed(2));
                                                                            cadVal = String((baseC + cadDepTotal).toFixed(2));
                                                                        }
                                                                        const saved = { usd: usdVal, cad: cadVal, baseUsd: newDraft.mode === 'starting' ? newDraft.usd : (startingBalances.baseUsd || ''), baseCad: newDraft.mode === 'starting' ? newDraft.cad : (startingBalances.baseCad || ''), currentUsd: savedCurrentUsd, currentCad: savedCurrentCad, mode: newDraft.mode, showReturnPct: newDraft.showReturnPct !== false, showIncentives: newDraft.showIncentives || false, incentives: newDraft.incentives || [], depositsUsd: newDeps, depositsCad: newDraft.depositsCad || [] };
                                                                        setStartingBalances(saved);
                                                                        try { saveBalancesForPortfolio(activePortfolioId, saved); } catch(e) {}
                                                                    }} style={{ background: 'transparent', border: 'none', color: T.textFaint, cursor: 'pointer', fontSize: '9px', padding: '0 1px', lineHeight: 1 }}>✕</button>
                                                                </div>
                                                            ))}
                                                            {balanceDraft.newDepositUsd !== null && balanceDraft.newDepositUsd !== undefined && balanceDraft._expandUsd ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                                    <input type="number" placeholder="000000" value={balanceDraft.newDepositUsd} autoFocus
                                                                        onChange={e => setBalanceDraft(d => ({ ...d, newDepositUsd: e.target.value }))}
                                                                        onKeyDown={e => { if (e.key === 'Enter') { const amt = parseFloat(balanceDraft.newDepositUsd); if (amt > 0) { setBalanceDraft(d => ({ ...d, depositsUsd: [...(d.depositsUsd || []), { amt: String(amt) }], newDepositUsd: '', _expandUsd: false })); } } if (e.key === 'Escape') setBalanceDraft(d => ({ ...d, _expandUsd: false, newDepositUsd: '' })); }}
                                                                        style={{ width: '90px', padding: '3px 7px', background: T.panelBg, border: `1px solid ${T.green}`, borderRadius: '999px', color: T.textPrimary, fontSize: '0.75rem', fontFamily: "'DM Mono', monospace", outline: 'none', textAlign: 'right' }} />
                                                                    <button onClick={() => { const amt = parseFloat(balanceDraft.newDepositUsd); if (amt > 0) setBalanceDraft(d => ({ ...d, depositsUsd: [...(d.depositsUsd || []), { amt: String(amt) }], newDepositUsd: '', _expandUsd: false })); }} style={{ background: T.green, border: 'none', borderRadius: '999px', color: T.pageBg, fontSize: '0.6rem', fontWeight: '700', padding: '3px 9px', cursor: 'pointer', letterSpacing: '0.04em' }}>Add</button>
                                                                    <button onClick={() => setBalanceDraft(d => ({ ...d, _expandUsd: false, newDepositUsd: '' }))} style={{ background: 'transparent', border: 'none', color: T.textFaint, cursor: 'pointer', fontSize: '10px', padding: '2px' }}>✕</button>
                                                                </div>
                                                            ) : (
                                                                <div onClick={() => setBalanceDraft(d => ({ ...d, _expandUsd: true, newDepositUsd: '' }))}
                                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'transparent', border: `1px dashed ${T.borderStrong}`, borderRadius: '999px', padding: '2px 8px 2px 6px', cursor: 'pointer', marginTop: '2px' }}>
                                                                    <span style={{ fontSize: '10px', color: T.textFaint, lineHeight: 1 }}>＋</span>
                                                                    <span style={{ fontSize: '0.6rem', color: T.textFaint, letterSpacing: '0.04em' }}>Add deposit</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                {/* CAD input */}
                                                <div style={{ marginBottom: '0.85rem' }}>
                                                    <div style={{ fontSize: '0.62rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '600', marginBottom: '3px' }}>CAD Balance</div>
                                                    <input type="number" placeholder={balanceDraft.mode === 'current' ? 'e.g. 76605' : 'e.g. 68000'}
                                                        value={(() => { const dep = (balanceDraft.depositsCad || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0); const base = parseFloat(balanceDraft.cad) || 0; return dep > 0 && base > 0 ? (base + dep).toFixed(2) : balanceDraft.cad; })()}
                                                        onChange={e => setBalanceDraft(d => ({ ...d, cad: e.target.value }))}
                                                        readOnly={(balanceDraft.depositsCad || []).length > 0}
                                                        style={{ width: '100%', padding: '0.45rem 0.6rem', background: (balanceDraft.depositsCad || []).length > 0 ? T.raisedBg : T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '5px', color: T.textPrimary, fontSize: '0.82rem', fontFamily: "'DM Mono', monospace", outline: 'none' }} />
                                                    {balanceDraft.mode === 'current' && (() => {
                                                        const cur = parseFloat(balanceDraft.cad);
                                                        const incTotal = balanceDraft.showIncentives ? (balanceDraft.incentives || []).reduce((s, i) => s + (parseFloat(i.amt) || 0), 0) : 0;
                                                        const cadDep = (balanceDraft.depositsCad || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                                        const derived = cur - currencyReturns.cadProfit - incTotal;
                                                        if (!isNaN(cur) && derived > 0) return <div style={{ fontSize: '0.62rem', color: T.textFaint, fontFamily: "'DM Mono', monospace", marginTop: '2px' }}>Starting: <span style={{ color: T.green }}>${derived.toFixed(2)}</span></div>;
                                                        if (!isNaN(cur)) return <div style={{ fontSize: '0.62rem', color: T.red, marginTop: '2px' }}>Must exceed total CAD profit</div>;
                                                        return null;
                                                    })()}
                                                    {balanceDraft.mode === 'starting' && (() => {
                                                        const base = parseFloat(balanceDraft.cad) || 0;
                                                        const depTotal = (balanceDraft.depositsCad || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                                        if (depTotal > 0 && base > 0) return <div style={{ fontSize: '0.62rem', color: T.textFaint, fontFamily: "'DM Mono', monospace", marginTop: '2px' }}>Total incl. deposits: <span style={{ color: T.green }}>${(base + depTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>;
                                                        return null;
                                                    })()}
                                                </div>

                                                {/* CAD Deposits */}
                                                {(() => {
                                                    const cadDeps = balanceDraft.depositsCad || [];
                                                    return (
                                                        <div style={{ marginBottom: '0.65rem' }}>
                                                            {cadDeps.length > 0 && cadDeps.map((dep, idx) => (
                                                                <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: isDark ? 'rgba(0,255,136,0.08)' : '#f0faf5', border: `1px solid ${isDark ? 'rgba(0,255,136,0.2)' : '#c0e8d0'}`, borderRadius: '999px', padding: '2px 8px', marginRight: '4px', marginBottom: '4px' }}>
                                                                    <span style={{ fontSize: '0.6rem', color: T.green, fontFamily: "'DM Mono', monospace" }}>+${parseFloat(dep.amt).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                                                    <button onClick={() => {
                                                                        const newDeps = (balanceDraft.depositsCad || []).filter((_, i) => i !== idx);
                                                                        const newDraft = { ...balanceDraft, depositsCad: newDeps };
                                                                        setBalanceDraft(newDraft);
                                                                        // Auto-save immediately
                                                                        const usdDepTotal = (newDraft.depositsUsd || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                                                        const cadDepTotal = newDeps.reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                                                        let usdVal = newDraft.usd;
                                                                        let cadVal = newDraft.cad;
                                                                        if (newDraft.mode === 'current') {
                                                                            const curUsd = parseFloat(newDraft.usd);
                                                                            const curCad = parseFloat(newDraft.cad);
                                                                            const incTotal = newDraft.showIncentives ? (newDraft.incentives || []).reduce((s, i) => s + (parseFloat(i.amt) || 0), 0) : 0;
                                                                            if (!isNaN(curUsd)) usdVal = String((curUsd - currencyReturns.usdProfit).toFixed(2));
                                                                            if (!isNaN(curCad)) cadVal = String((curCad - currencyReturns.cadProfit - incTotal).toFixed(2));
                                                                        }
                                                                        const savedCurrentUsd = newDraft.mode === 'current' ? newDraft.usd : '';
                                                                        const savedCurrentCad = newDraft.mode === 'current' ? newDraft.cad : '';
                                                                        if (newDraft.mode === 'starting') {
                                                                            const baseU = parseFloat(newDraft.usd) || 0;
                                                                            const baseC = parseFloat(newDraft.cad) || 0;
                                                                            usdVal = String((baseU + usdDepTotal).toFixed(2));
                                                                            cadVal = String((baseC + cadDepTotal).toFixed(2));
                                                                        }
                                                                        const saved = { usd: usdVal, cad: cadVal, baseUsd: newDraft.mode === 'starting' ? newDraft.usd : (startingBalances.baseUsd || ''), baseCad: newDraft.mode === 'starting' ? newDraft.cad : (startingBalances.baseCad || ''), currentUsd: savedCurrentUsd, currentCad: savedCurrentCad, mode: newDraft.mode, showReturnPct: newDraft.showReturnPct !== false, showIncentives: newDraft.showIncentives || false, incentives: newDraft.incentives || [], depositsUsd: newDraft.depositsUsd || [], depositsCad: newDeps };
                                                                        setStartingBalances(saved);
                                                                        try { saveBalancesForPortfolio(activePortfolioId, saved); } catch(e) {}
                                                                    }} style={{ background: 'transparent', border: 'none', color: T.textFaint, cursor: 'pointer', fontSize: '9px', padding: '0 1px', lineHeight: 1 }}>✕</button>
                                                                </div>
                                                            ))}
                                                            {balanceDraft._expandCad ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                                    <input type="number" placeholder="000000" value={balanceDraft.newDepositCad} autoFocus
                                                                        onChange={e => setBalanceDraft(d => ({ ...d, newDepositCad: e.target.value }))}
                                                                        onKeyDown={e => { if (e.key === 'Enter') { const amt = parseFloat(balanceDraft.newDepositCad); if (amt > 0) { setBalanceDraft(d => ({ ...d, depositsCad: [...(d.depositsCad || []), { amt: String(amt) }], newDepositCad: '', _expandCad: false })); } } if (e.key === 'Escape') setBalanceDraft(d => ({ ...d, _expandCad: false, newDepositCad: '' })); }}
                                                                        style={{ width: '90px', padding: '3px 7px', background: T.panelBg, border: `1px solid ${T.green}`, borderRadius: '999px', color: T.textPrimary, fontSize: '0.75rem', fontFamily: "'DM Mono', monospace", outline: 'none', textAlign: 'right' }} />
                                                                    <button onClick={() => { const amt = parseFloat(balanceDraft.newDepositCad); if (amt > 0) setBalanceDraft(d => ({ ...d, depositsCad: [...(d.depositsCad || []), { amt: String(amt) }], newDepositCad: '', _expandCad: false })); }} style={{ background: T.green, border: 'none', borderRadius: '999px', color: T.pageBg, fontSize: '0.6rem', fontWeight: '700', padding: '3px 9px', cursor: 'pointer', letterSpacing: '0.04em' }}>Add</button>
                                                                    <button onClick={() => setBalanceDraft(d => ({ ...d, _expandCad: false, newDepositCad: '' }))} style={{ background: 'transparent', border: 'none', color: T.textFaint, cursor: 'pointer', fontSize: '10px', padding: '2px' }}>✕</button>
                                                                </div>
                                                            ) : (
                                                                <div onClick={() => setBalanceDraft(d => ({ ...d, _expandCad: true, newDepositCad: '' }))}
                                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'transparent', border: `1px dashed ${T.borderStrong}`, borderRadius: '999px', padding: '2px 8px 2px 6px', cursor: 'pointer', marginTop: '2px' }}>
                                                                    <span style={{ fontSize: '10px', color: T.textFaint, lineHeight: 1 }}>＋</span>
                                                                    <span style={{ fontSize: '0.6rem', color: T.textFaint, letterSpacing: '0.04em' }}>Add deposit</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                {/* Bonuses */}
                                                <div style={{ height: '1px', background: T.borderStrong, margin: '0.75rem 0' }} />
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: balanceDraft.showIncentives ? '0.6rem' : '0.25rem' }}>
                                                    <div style={{ fontSize: '0.65rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Bonuses</div>
                                                    <div onClick={() => setBalanceDraft(d => ({ ...d, showIncentives: !d.showIncentives }))}
                                                        style={{ width: '28px', height: '16px', borderRadius: '8px', background: balanceDraft.showIncentives ? '#ffaa00' : T.borderStrong, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                                                        <div style={{ position: 'absolute', top: '2px', left: balanceDraft.showIncentives ? '14px' : '2px', width: '12px', height: '12px', borderRadius: '50%', background: balanceDraft.showIncentives ? T.pageBg : T.textMuted, transition: 'left 0.2s' }} />
                                                    </div>
                                                </div>
                                                {!balanceDraft.showIncentives && <div style={{ fontSize: '0.62rem', color: T.textFaint, marginBottom: '0.5rem' }}>Toggle on to track cash back & bonuses.</div>}
                                                {balanceDraft.showIncentives && (() => {
                                                    const totalInc = (balanceDraft.incentives || []).reduce((s, i) => s + (parseFloat(i.amt) || 0), 0);
                                                    return (
                                                        <>
                                                            {(balanceDraft.incentives || []).length > 0 && (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.4rem' }}>
                                                                    {balanceDraft.incentives.map((item, idx) => (
                                                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                            <div style={{ flex: 1, fontSize: '0.7rem', color: T.textSecondary, fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc || 'Bonus'}</div>
                                                                            <div style={{ fontSize: '0.7rem', color: '#ffaa00', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>+${parseFloat(item.amt).toFixed(2)}</div>
                                                                            <button onClick={() => setBalanceDraft(d => ({ ...d, incentives: d.incentives.filter((_, i) => i !== idx) }))}
                                                                                style={{ background: 'transparent', border: 'none', color: T.textFaint, cursor: 'pointer', fontSize: '10px', padding: '1px 3px' }}>✕</button>
                                                                        </div>
                                                                    ))}
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.3rem', borderTop: `1px solid ${T.borderStrong}` }}>
                                                                        <div style={{ fontSize: '0.62rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
                                                                        <div style={{ fontSize: '0.72rem', color: '#ffaa00', fontFamily: "'DM Mono', monospace", fontWeight: '600' }}>+${totalInc.toFixed(2)}</div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div style={{ height: '1px', background: T.borderStrong, margin: '0.4rem 0' }} />
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.35rem' }}>
                                                                <input type="text" placeholder="Description" value={balanceDraft.newIncentiveDesc}
                                                                    onChange={e => setBalanceDraft(d => ({ ...d, newIncentiveDesc: e.target.value }))}
                                                                    style={{ width: '100%', padding: '0.4rem 0.5rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '5px', color: T.textPrimary, fontSize: '0.72rem', fontFamily: "'DM Mono', monospace", outline: 'none' }} />
                                                                <input type="number" placeholder="Amount $" value={balanceDraft.newIncentiveAmt}
                                                                    onChange={e => setBalanceDraft(d => ({ ...d, newIncentiveAmt: e.target.value }))}
                                                                    style={{ width: '100%', padding: '0.4rem 0.5rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '5px', color: T.textPrimary, fontSize: '0.72rem', fontFamily: "'DM Mono', monospace", outline: 'none' }} />
                                                            </div>
                                                            <button onClick={() => {
                                                                if (!balanceDraft.newIncentiveAmt || parseFloat(balanceDraft.newIncentiveAmt) <= 0) return;
                                                                setBalanceDraft(d => ({ ...d, incentives: [...(d.incentives || []), { desc: d.newIncentiveDesc, amt: d.newIncentiveAmt, date: new Date().toISOString().split('T')[0] }], newIncentiveDesc: '', newIncentiveAmt: '' }));
                                                            }} style={{ width: '100%', background: '#ffaa00', color: '#000', border: 'none', borderRadius: '5px', padding: '0.4rem', fontWeight: '700', fontSize: '0.68rem', letterSpacing: '0.05em', cursor: 'pointer', textTransform: 'uppercase', marginBottom: '0.25rem' }}>+ Add</button>
                                                        </>
                                                    );
                                                })()}

                                                {/* Save */}
                                                <button onClick={() => {
                                                    let usdVal = balanceDraft.usd;
                                                    let cadVal = balanceDraft.cad;
                                                    if (balanceDraft.mode === 'current') {
                                                        const curUsd = parseFloat(balanceDraft.usd);
                                                        const curCad = parseFloat(balanceDraft.cad);
                                                        if (!isNaN(curUsd)) usdVal = String((curUsd - currencyReturns.usdProfit).toFixed(2));
                                                        const incTotal = balanceDraft.showIncentives ? (balanceDraft.incentives || []).reduce((s, i) => s + (parseFloat(i.amt) || 0), 0) : 0;
                                                        if (!isNaN(curCad)) cadVal = String((curCad - currencyReturns.cadProfit - incTotal).toFixed(2));
                                                    }
                                                    const savedUsdDepTotal = (balanceDraft.depositsUsd || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                                    const savedCadDepTotal = (balanceDraft.depositsCad || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                                    const savedCurrentUsd = balanceDraft.mode === 'current' ? balanceDraft.usd : '';
                                                    const savedCurrentCad = balanceDraft.mode === 'current' ? balanceDraft.cad : '';
                                                    const baseUsdSave = balanceDraft.mode === 'starting' ? balanceDraft.usd : (startingBalances.baseUsd || '');
                                                    const baseCadSave = balanceDraft.mode === 'starting' ? balanceDraft.cad : (startingBalances.baseCad || '');
                                                    // In starting mode: usdVal = base + deposits so return % denominator is correct
                                                    if (balanceDraft.mode === 'starting') {
                                                        const baseU = parseFloat(balanceDraft.usd) || 0;
                                                        const baseC = parseFloat(balanceDraft.cad) || 0;
                                                        const usdDep = (balanceDraft.depositsUsd || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                                        const cadDep = (balanceDraft.depositsCad || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                                                        usdVal = String((baseU + usdDep).toFixed(2));
                                                        cadVal = String((baseC + cadDep).toFixed(2));
                                                    }
                                                    const saved = { usd: usdVal, cad: cadVal, baseUsd: baseUsdSave, baseCad: baseCadSave, currentUsd: savedCurrentUsd, currentCad: savedCurrentCad, mode: balanceDraft.mode, showReturnPct: balanceDraft.showReturnPct !== false, showIncentives: balanceDraft.showIncentives || false, incentives: balanceDraft.incentives || [], depositsUsd: balanceDraft.depositsUsd || [], depositsCad: balanceDraft.depositsCad || [] };
                                                    setStartingBalances(saved);
                                                    try { saveBalancesForPortfolio(activePortfolioId, saved); } catch(e) {}
                                                    setShowBalanceEditor(false);
                                                }} style={{ width: '100%', background: T.green, color: T.pageBg, border: 'none', borderRadius: '5px', padding: '0.45rem', fontWeight: '700', fontSize: '0.7rem', letterSpacing: '0.06em', cursor: 'pointer', textTransform: 'uppercase', marginTop: '0.5rem' }}>Save</button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                            {(() => {
                                const dmMono = "'DM Mono', monospace";

                                // Avg hold time — closed trades with both entry and exit date
                                const closedWithDates = dashboardFilteredTrades.filter(t => t.exitDate && t.entryDate);
                                const avgHoldDays = closedWithDates.length > 0
                                    ? Math.round(closedWithDates.reduce((sum, t) => {
                                        const diff = (new Date(t.exitDate) - new Date(t.entryDate)) / (1000 * 60 * 60 * 24);
                                        return sum + Math.max(0, diff);
                                    }, 0) / closedWithDates.length)
                                    : null;

                                // Determine if we're in a historical custom range (end date is in the past)
                                const now = new Date();
                                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                const isHistoricalCustom = chartTimeframe === 'CUSTOM' && customEndDate && new Date(customEndDate) < today;

                                // Trades this month — closed trades in current calendar month
                                const thisMonthTrades = dashboardFilteredTrades.filter(t => {
                                    if (!t.exitDate) return false;
                                    const exit = new Date(t.exitDate);
                                    return exit.getMonth() === now.getMonth() && exit.getFullYear() === now.getFullYear();
                                }).length;

                                // Avg trades per month — for historical custom ranges
                                const avgTradesPerMonth = (() => {
                                    if (!isHistoricalCustom) return null;
                                    const start = new Date(customStartDate);
                                    const end = new Date(customEndDate);
                                    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
                                    const closedInRange = dashboardFilteredTrades.filter(t => t.exitDate).length;
                                    return months > 0 ? (closedInRange / months).toFixed(1) : '0';
                                })();

                                const accentRow = (label, value, unit, color) => (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderStrong}` }}>
                                        <div>
                                            <div style={{ fontFamily: dmMono, fontSize: '9px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{label}</div>
                                            <div style={{ fontFamily: dmMono, fontSize: '1.15rem', fontWeight: '500', color, lineHeight: 1 }}>
                                                {value}{unit && <span style={{ fontSize: '10px', color: T.textMuted, marginLeft: '4px' }}>{unit}</span>}
                                            </div>
                                        </div>
                                        <div style={{ width: '3px', height: '32px', borderRadius: '3px', background: color, flexShrink: 0 }}/>
                                    </div>
                                );

                                return (
                                    <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}` }}>
                                        <div style={{ fontSize: '0.85rem', color: T.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>Total Trades</div>
                                        <div style={{ fontFamily: dmMono, fontSize: '1.8rem', fontWeight: '500', color: T.textPrimary, lineHeight: 1, marginBottom: '14px' }}>{metrics.totalTrades}</div>

                                        {accentRow('Open Positions', metrics.openPositions, null, T.green)}
                                        {accentRow('Avg Hold Time', avgHoldDays !== null ? avgHoldDays : '—', avgHoldDays !== null ? 'days' : null, T.blue)}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 0 0', position: 'relative' }}
                                            onMouseEnter={e => { const tip = e.currentTarget.querySelector('.month-tip'); if (tip) tip.style.opacity = '1'; }}
                                            onMouseLeave={e => { const tip = e.currentTarget.querySelector('.month-tip'); if (tip) tip.style.opacity = '0'; }}
                                        >
                                            <div>
                                                <div style={{ fontFamily: dmMono, fontSize: '9px', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
                                                    {isHistoricalCustom ? 'Avg / Month' : 'This Month'}
                                                </div>
                                                <div style={{ fontFamily: dmMono, fontSize: '1.15rem', fontWeight: '500', color: T.amber, lineHeight: 1 }}>
                                                    {isHistoricalCustom ? avgTradesPerMonth : thisMonthTrades}
                                                    <span style={{ fontSize: '10px', color: T.textMuted, marginLeft: '4px' }}>trades</span>
                                                </div>
                                            </div>
                                            <div style={{ width: '3px', height: '32px', borderRadius: '3px', background: T.amber, flexShrink: 0 }}/>
                                            <div className="month-tip" style={{
                                                position: 'absolute',
                                                bottom: 'calc(100% + 6px)',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                background: T.raisedBg,
                                                border: `1px solid ${T.borderStrong}`,
                                                color: T.textSecondary,
                                                fontSize: '0.65rem',
                                                fontFamily: dmMono,
                                                letterSpacing: '0.04em',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                whiteSpace: 'nowrap',
                                                pointerEvents: 'none',
                                                opacity: '0',
                                                transition: 'opacity 0.15s ease',
                                                zIndex: 10,
                                            }}>
                                                {isHistoricalCustom ? 'Avg closed trades per month in period' : 'Closed this month'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            {(() => {
                                // Delta: compare last N closed trades win rate vs overall
                                const closedSorted = dashboardFilteredTrades
                                    .filter(t => t.exitDate)
                                    .sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate));
                                const lastN = closedSorted.slice(-deltaLookback);
                                const lastNWins = lastN.filter(t => {
                                    const cb = beType === '%' ? (t.entryPrice||0)*(t.originalQty||t.qty||0) : null;
                                    const thr = beType === '%' && cb > 0 ? (beThreshold/100)*cb : beThreshold;
                                    return getTotalProfit(t) > thr;
                                }).length;
                                const lastNLosses = lastN.filter(t => {
                                    const cb = beType === '%' ? (t.entryPrice||0)*(t.originalQty||t.qty||0) : null;
                                    const thr = beType === '%' && cb > 0 ? (beThreshold/100)*cb : beThreshold;
                                    return getTotalProfit(t) < -thr;
                                }).length;
                                const lastNWinRate = lastNWins + lastNLosses > 0 ? (lastNWins / (lastNWins + lastNLosses)) * 100 : 0;
                                const delta = closedSorted.length >= 2 ? lastNWinRate - metrics.winRate : null;

                                const wr = metrics.winRate;
                                const circumference = 226.2;
                                const arcOffset = circumference - circumference * (wr / 100);
                                const donutColor = wr >= 50 ? T.green : T.red;
                                const grayColor = isDark ? '#4a5260' : '#9ca3af';
                                const deltaIsUp = delta !== null && delta >= 0;

                                return (
                                    <div style={{ position: 'relative', background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}` }}>

                                        {/* Header row with title + ... button */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: T.textMuted, textTransform: 'uppercase', fontWeight: '600' }}>Win Rate</div>
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    onClick={() => {
                                                        setWinRateSettingsDraft({ be: String(beThreshold), lookback: String(deltaLookback), beType });
                                                        setShowWinRateSettings(s => !s);
                                                    }}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: T.textFaint,
                                                        cursor: 'pointer',
                                                        padding: '2px 4px',
                                                        lineHeight: 1,
                                                        fontSize: '14px',
                                                        letterSpacing: '1px',
                                                        borderRadius: '4px',
                                                        transition: 'color 0.15s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.color = T.textSecondary}
                                                    onMouseLeave={e => e.currentTarget.style.color = T.textFaint}
                                                    title="Card settings"
                                                >···</button>

                                                {/* Settings popover */}
                                                {showWinRateSettings && (
                                                    <>
                                                        {/* Backdrop */}
                                                        <div
                                                            onClick={() => setShowWinRateSettings(false)}
                                                            style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                                                        />
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: 'calc(100% + 6px)',
                                                            right: 0,
                                                            background: T.surfaceBg,
                                                            border: `1px solid ${T.borderStrong}`,
                                                            borderRadius: '8px',
                                                            padding: '1rem',
                                                            width: '200px',
                                                            boxShadow: T.shadowMd,
                                                            zIndex: 999,
                                                        }}>
                                                            <button onClick={() => setShowWinRateSettings(false)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1, padding: '2px 4px', borderRadius: '3px' }}>✕</button>
                                                            <div style={{ fontSize: '0.7rem', color: T.textMuted, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Win Rate Settings</div>

                                                            {/* B/E Threshold */}
                                                            <div style={{ marginBottom: '0.75rem' }}>
                                                                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.3rem' }} onMouseEnter={() => setShowBeTooltip(true)} onMouseLeave={() => setShowBeTooltip(false)}>
                                                                    <label style={{ fontSize: '0.72rem', color: T.textSecondary, cursor: 'default' }}>B/E Threshold</label>
                                                                    {showBeTooltip && (
                                                                        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, background: T.raisedBg, border: `1px solid ${T.borderStrong}`, borderRadius: '5px', padding: '0.5rem 0.6rem', width: '160px', fontSize: '0.68rem', color: T.textSecondary, lineHeight: '1.45', boxShadow: T.shadowMd, zIndex: 1001, pointerEvents: 'none' }}>
                                                                            Trades within ±this value are counted as break-even, not wins or losses. Use <strong style={{ color: T.textPrimary }}>$</strong> for a fixed dollar amount or <strong style={{ color: T.textPrimary }}>%</strong> to scale with position size.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* $ / % Toggle */}
                                                                <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: `1px solid ${T.borderStrong}`, marginBottom: '0.4rem' }}>
                                                                    {['$', '%'].map(type => (
                                                                        <button
                                                                            key={type}
                                                                            onClick={() => setWinRateSettingsDraft(d => ({ ...d, beType: type, be: type === '%' ? '0.5' : '5' }))}
                                                                            style={{
                                                                                flex: 1,
                                                                                padding: '0.3rem',
                                                                                background: winRateSettingsDraft.beType === type ? T.green : T.panelBg,
                                                                                color: winRateSettingsDraft.beType === type ? T.pageBg : T.textMuted,
                                                                                border: 'none',
                                                                                cursor: 'pointer',
                                                                                fontSize: '0.75rem',
                                                                                fontWeight: '700',
                                                                                letterSpacing: '0.05em',
                                                                            }}
                                                                        >{type}</button>
                                                                    ))}
                                                                </div>
                                                                {winRateSettingsDraft.beType === '$' ? (
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        value={winRateSettingsDraft.be}
                                                                        onChange={e => setWinRateSettingsDraft(d => ({ ...d, be: e.target.value }))}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '0.4rem 0.5rem',
                                                                            background: T.panelBg,
                                                                            border: `1px solid ${T.borderMid}`,
                                                                            borderRadius: '4px',
                                                                            color: T.textPrimary,
                                                                            fontSize: '0.8rem',
                                                                            fontFamily: "'DM Mono', monospace",
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <input
                                                                        type="number"
                                                                        min="0.1"
                                                                        max="2"
                                                                        step="0.1"
                                                                        value={winRateSettingsDraft.be}
                                                                        onChange={e => setWinRateSettingsDraft(d => ({ ...d, be: e.target.value }))}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '0.4rem 0.5rem',
                                                                            background: T.panelBg,
                                                                            border: `1px solid ${T.borderMid}`,
                                                                            borderRadius: '4px',
                                                                            color: T.textPrimary,
                                                                            fontSize: '0.8rem',
                                                                            fontFamily: "'DM Mono', monospace",
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>

                                                            {/* Delta lookback */}
                                                            <div style={{ marginBottom: '0.85rem' }}>
                                                                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.3rem' }} onMouseEnter={() => setShowLookbackTooltip(true)} onMouseLeave={() => setShowLookbackTooltip(false)}>
                                                                    <label style={{ fontSize: '0.72rem', color: T.textSecondary, cursor: 'default' }}>Compare vs last N trades</label>
                                                                    {showLookbackTooltip && (
                                                                        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, background: T.raisedBg, border: `1px solid ${T.borderStrong}`, borderRadius: '5px', padding: '0.5rem 0.6rem', width: '160px', fontSize: '0.68rem', color: T.textSecondary, lineHeight: '1.45', boxShadow: T.shadowMd, zIndex: 1001, pointerEvents: 'none' }}>
                                                                            The arrow shows whether your win rate is improving or declining compared to your last N closed trades.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    step="1"
                                                                    value={winRateSettingsDraft.lookback}
                                                                    onChange={e => setWinRateSettingsDraft(d => ({ ...d, lookback: e.target.value }))}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '0.4rem 0.5rem',
                                                                        background: T.panelBg,
                                                                        border: `1px solid ${T.borderMid}`,
                                                                        borderRadius: '4px',
                                                                        color: T.textPrimary,
                                                                        fontSize: '0.8rem',
                                                                        fontFamily: "'DM Mono', monospace",
                                                                    }}
                                                                />
                                                            </div>

                                                            <button
                                                                onClick={() => {
                                                                    const newBe = Math.max(0, parseFloat(winRateSettingsDraft.be) || 0);
                                                                    const newLookback = Math.max(1, parseInt(winRateSettingsDraft.lookback) || 1);
                                                                    const newBeType = winRateSettingsDraft.beType || '$';
                                                                    setBeThreshold(newBe);
                                                                    setDeltaLookback(newLookback);
                                                                    setBeType(newBeType);
                                                                    try {
                                                                        localStorage.setItem('pt_be_threshold', String(newBe));
                                                                        localStorage.setItem('pt_delta_lookback', String(newLookback));
                                                                        localStorage.setItem('pt_be_type', newBeType);
                                                                    } catch(e) {}
                                                                    setShowWinRateSettings(false);
                                                                }}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '0.45rem',
                                                                    background: T.green,
                                                                    color: T.pageBg,
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: '700',
                                                                    letterSpacing: '0.05em',
                                                                }}
                                                            >APPLY</button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
                                            <svg width="90" height="90" viewBox="0 0 90 90" style={{ flexShrink: 0, overflow: 'visible' }}>
                                                <circle cx="45" cy="45" r="36" fill="none" stroke={T.raisedBg} strokeWidth="14"/>
                                                <circle
                                                    cx="45" cy="45" r="36"
                                                    fill="none"
                                                    stroke={donutColor}
                                                    strokeWidth="14"
                                                    strokeLinecap="butt"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={arcOffset}
                                                    transform="rotate(-90 45 45)"
                                                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1), stroke 0.3s ease' }}
                                                />
                                                <text x="45" y="48" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'DM Mono', fontSize: '18px', fontWeight: '500', fill: T.textPrimary }}>{wr === 100 ? '100' : wr.toFixed(1)}%</text>
                                            </svg>

                                            {/* Side stats */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: T.green, flexShrink: 0 }}/>
                                                    <div>
                                                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '22px', fontWeight: '500', color: T.green, lineHeight: 1 }}>{metrics.wins}</div>
                                                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: T.textMuted, marginTop: '3px' }}>Wins</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: T.red, flexShrink: 0 }}/>
                                                    <div>
                                                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '22px', fontWeight: '500', color: T.red, lineHeight: 1 }}>{metrics.losses}</div>
                                                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: T.textMuted, marginTop: '3px' }}>Losses</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: grayColor, flexShrink: 0 }}/>
                                                    <div>
                                                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '22px', fontWeight: '500', color: grayColor, lineHeight: 1 }}>{metrics.evens}</div>
                                                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: T.textMuted, marginTop: '3px' }}>B/E</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div style={{ height: '1px', background: T.borderStrong, margin: '12px 0' }}/>

                                        {/* Delta badge */}
                                        {delta !== null ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                                                    borderRadius: '20px', padding: '4px 10px',
                                                    fontFamily: "'DM Mono', monospace", fontSize: '12px', fontWeight: '500',
                                                    background: deltaIsUp ? T.greenBgDim : T.redBg,
                                                    border: `1px solid ${deltaIsUp ? (isDark ? 'rgba(0,255,136,0.25)' : 'rgba(5,150,105,0.25)') : (isDark ? 'rgba(255,68,68,0.25)' : 'rgba(220,38,38,0.25)')}`,
                                                    color: deltaIsUp ? T.green : T.red
                                                }}>
                                                    {deltaIsUp ? '↑' : '↓'} {deltaIsUp ? '+' : ''}{delta.toFixed(1)}%
                                                </div>
                                                <div
                                                    onMouseEnter={() => setShowDeltaTooltip(true)}
                                                    onMouseLeave={() => setShowDeltaTooltip(false)}
                                                    style={{ position: 'relative', cursor: 'default' }}
                                                >
                                                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: T.textMuted }}>vs last {deltaLookback}</div>
                                                    {showDeltaTooltip && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: 'calc(100% + 6px)',
                                                            right: 0,
                                                            background: T.surfaceBg,
                                                            border: `1px solid ${T.borderStrong}`,
                                                            borderRadius: '5px',
                                                            padding: '5px 8px',
                                                            whiteSpace: 'nowrap',
                                                            fontFamily: "'DM Mono', monospace",
                                                            fontSize: '9px',
                                                            color: T.textSecondary,
                                                            pointerEvents: 'none',
                                                            boxShadow: T.shadowLg,
                                                        }}>
                                                            last {deltaLookback} vs {chartTimeframe} avg
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: T.textMuted }}>Need more trades for delta</div>
                                        )}
                                    </div>
                                );
                            })()}
                            {/* Avg Win / Avg Loss - Stacked Separate Cards */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}`, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '0.75rem', color: T.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>Avg Win</div>
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: metrics.wins > 0 ? T.green : T.textMuted, marginTop: 'auto' }}>{metrics.wins > 0 ? `+$${metrics.avgWin.toFixed(2)}` : '$0.00'}</div>
                                </div>
                                <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}`, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '0.75rem', color: T.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>Avg Loss</div>
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: metrics.losses > 0 ? T.red : T.textMuted, marginTop: 'auto' }}>{metrics.losses > 0 ? `$${metrics.avgLoss.toFixed(2)}` : '$0.00'}</div>
                                </div>
                            </div>
                            {/* Total Dividends / Total Fees - Stacked Separate Cards (Dividends on top) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}`, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '0.75rem', color: T.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>Total Dividends</div>
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: T.blue, marginTop: 'auto' }}>${metrics.totalDividends.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                </div>
                                <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}`, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '0.75rem', color: T.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>Total Fees</div>
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: metrics.totalFees === 0 ? T.textMuted : T.red, marginTop: 'auto' }}>${metrics.totalFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                        </div>

                        {(() => {
                            const ChartComponent = () => {
                                const canvasRef = React.useRef(null);
                                const chartRef = React.useRef(null);
                                
                                React.useEffect(() => {
                                    if (!canvasRef.current || !window.Chart || chartData.length < 2) return;
                                    
                                    // Destroy previous chart if it exists
                                    if (chartRef.current) {
                                        chartRef.current.destroy();
                                    }
                                    
                                    const ctx = canvasRef.current.getContext('2d');

                                    // Gradient fill
                                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                                    gradient.addColorStop(0, isDark ? 'rgba(0,255,136,0.12)' : 'rgba(45,143,94,0.10)');
                                    gradient.addColorStop(1, 'rgba(0,0,0,0)');

                                    // Peak annotation + crosshair plugins
                                    const profits = chartData.map(d => d.profit);
                                    const peakValue = Math.max(...profits);
                                    const peakIdx = profits.indexOf(peakValue);

                                    const peakPlugin = {
                                        id: 'peakAnnotation',
                                        afterDraw(chart) {
                                            const meta = chart.getDatasetMeta(0);
                                            if (!meta.data[peakIdx]) return;
                                            const { ctx: c } = chart;
                                            const pt = meta.data[peakIdx];
                                            c.save();
                                            c.beginPath();
                                            c.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
                                            c.fillStyle = T.green;
                                            c.fill();
                                            c.strokeStyle = isDark ? '#000' : '#fff';
                                            c.lineWidth = 2;
                                            c.stroke();
                                            const label = `Peak $${peakValue >= 1000 ? (peakValue/1000).toFixed(1)+'k' : peakValue.toFixed(0)}`;
                                            c.font = '600 10px -apple-system, sans-serif';
                                            c.fillStyle = T.green;
                                            const w = c.measureText(label).width;
                                            const labelH = 10;
                                            const gap = 8;
                                            // Flip label below dot if too close to top edge
                                            const labelY = pt.y - gap < chart.chartArea.top + labelH
                                                ? pt.y + gap + labelH
                                                : pt.y - gap;
                                            // Clamp X so label never overflows left/right canvas edge
                                            const labelX = Math.min(Math.max(pt.x - w / 2, chart.chartArea.left), chart.chartArea.right - w);
                                            c.fillText(label, labelX, labelY);
                                            c.restore();
                                        }
                                    };

                                    const crosshairPlugin = {
                                        id: 'crosshair',
                                        afterDraw(chart) {
                                            if (chart._crosshairX === undefined) return;
                                            const { ctx: c, chartArea: { top, bottom } } = chart;
                                            c.save();
                                            c.beginPath();
                                            c.moveTo(chart._crosshairX, top);
                                            c.lineTo(chart._crosshairX, bottom);
                                            c.strokeStyle = isDark ? 'rgba(0,255,136,0.25)' : 'rgba(45,143,94,0.25)';
                                            c.lineWidth = 1;
                                            c.setLineDash([4, 4]);
                                            c.stroke();
                                            c.restore();
                                        }
                                    };

                                    chartRef.current = new window.Chart(ctx, {
                                        type: 'line',
                                        plugins: [peakPlugin, crosshairPlugin],
                                        data: {
                                            labels: chartData.map(d => d.date),
                                            datasets: [{
                                                label: 'Cumulative Total Profit',
                                                data: chartData.map(d => d.profit),
                                                borderColor: T.green,
                                                backgroundColor: gradient,
                                                borderWidth: 2,
                                                pointRadius: chartData.length <= 50 ? 3 : 0,
                                                pointBackgroundColor: T.green,
                                                pointHoverRadius: 5,
                                                tension: 0.1,
                                                fill: true
                                            }]
                                        },
                                        options: {
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            interaction: { mode: 'index', intersect: false },
                                            onHover(evt, _, chart) {
                                                try {
                                                    const pts = chart.getElementsAtEventForMode(evt.native || evt, 'index', { intersect: false }, true);
                                                    chart._crosshairX = pts.length ? pts[0].element.x : undefined;
                                                    chart.draw();
                                                } catch(e) {}
                                            },
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    backgroundColor: T.surfaceBg,
                                                    borderColor: T.borderStrong,
                                                    borderWidth: 1,
                                                    titleColor: T.textSecondary,
                                                    bodyColor: T.textPrimary,
                                                    bodyFont: { family: "'DM Mono', monospace", size: 12 },
                                                    padding: 10,
                                                    callbacks: {
                                                        label: (context) => `$${context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                    }
                                                }
                                            },
                                            scales: {
                                                x: {
                                                    grid: { color: T.raisedBg, drawBorder: false },
                                                    ticks: { color: T.textFaint, font: { size: 10 }, maxTicksLimit: 8, maxRotation: 0 }
                                                },
                                                y: {
                                                    grid: {
                                                        color: (ctx) => ctx.tick.value === 0 ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)') : T.raisedBg,
                                                        drawBorder: false
                                                    },
                                                    ticks: { 
                                                        color: T.textFaint, 
                                                        font: { size: 10 },
                                                        callback: (value) => `$${value >= 1000 ? (value/1000).toFixed(1)+'k' : value.toFixed(0)}`
                                                    }
                                                }
                                            }
                                        }
                                    });
                                    
                                    return () => {
                                        if (chartRef.current) {
                                            chartRef.current.destroy();
                                        }
                                    };
                                }, [chartData, isDark]);
                                
                                return (
                                    <div style={{ background: T.panelBg, borderRadius: '8px', padding: '2rem', border: `1px solid ${T.border}`, marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.6rem', color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace", marginBottom: '2px' }}>Performance</div>
                                                <div style={{ position: 'relative', display: 'inline-block' }}
                                                    onMouseEnter={e => e.currentTarget.querySelector('.chart-title-tip').style.display = 'block'}
                                                    onMouseLeave={e => e.currentTarget.querySelector('.chart-title-tip').style.display = 'none'}
                                                >
                                                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0, cursor: 'default' }}>Total Profit</h3>
                                                    <div className="chart-title-tip" style={{ display: 'none', position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: T.surfaceBg, border: `1px solid ${T.borderStrong}`, color: T.textSecondary, fontSize: '0.62rem', padding: '8px 10px', borderRadius: '6px', width: '230px', lineHeight: '1.7', zIndex: 50, pointerEvents: 'none', fontFamily: 'sans-serif', fontWeight: '400', textTransform: 'none', letterSpacing: '0', boxShadow: T.shadowMd }}>
                                                        <strong style={{ color: T.textPrimary, display: 'block', marginBottom: '5px' }}>What this chart shows</strong>
                                                        Cumulative realized capital gains over time — closed trades and partial exits only.<br/><br/>
                                                        <span style={{ color: T.textFaint }}>Dividends are included in this chart, matching the Total Profit card above.</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <div style={{ display: 'flex', background: T.panelBg, border: `1px solid ${T.border}`, borderRadius: '7px', padding: '3px', gap: '2px' }}>
                                                {['5D','1M','3M','6M','YTD','1Y','3Y','ALL'].map(tf => (
                                                    <button key={tf} onClick={() => { setChartTimeframe(tf); setShowCustomDatePicker(false); }} style={{
                                                        background: chartTimeframe === tf ? T.green : 'transparent',
                                                        color: chartTimeframe === tf ? T.pageBg : T.textMuted,
                                                        border: 'none',
                                                        padding: '0.3rem 0.6rem', borderRadius: '5px', cursor: 'pointer',
                                                        fontWeight: '700', fontSize: '0.72rem', letterSpacing: '0.03em', transition: 'all 0.15s'
                                                    }}>{tf}</button>
                                                ))}
                                                </div>
                                                <div style={{ position: 'relative' }}>
                                                    <button 
                                                        onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                                                        style={{
                                                            background: chartTimeframe === 'CUSTOM' ? T.green : 'transparent',
                                                            color: chartTimeframe === 'CUSTOM' ? T.pageBg : T.textMuted,
                                                            border: `1px solid ${chartTimeframe === 'CUSTOM' ? T.green : T.border}`,
                                                            padding: '0.3rem 0.65rem', borderRadius: '6px', cursor: 'pointer',
                                                            fontWeight: '700', fontSize: '0.72rem', letterSpacing: '0.03em'
                                                        }}
                                                    >
                                                        CUSTOM
                                                    </button>
                                                    {showCustomDatePicker && (
                                                        <>
                                                            <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                                                            <div 
                                                                onClick={(e) => e.stopPropagation()}
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                style={{
                                                                position: 'absolute',
                                                                top: 'calc(100% + 6px)',
                                                                right: 0,
                                                                background: T.surfaceBg,
                                                                border: `1px solid ${T.borderStrong}`,
                                                                borderRadius: '8px',
                                                                padding: '1rem',
                                                                minWidth: '280px',
                                                                boxShadow: T.shadowMd,
                                                                zIndex: 9999,
                                                            }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                                    <div style={{ fontSize: '0.7rem', color: T.textMuted, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.08em' }}>Custom Date Range</div>
                                                                    <button 
                                                                        onClick={() => setShowCustomDatePicker(false)}
                                                                        style={{ 
                                                                            background: 'transparent', 
                                                                            border: 'none', 
                                                                            color: T.textMuted, 
                                                                            cursor: 'pointer', 
                                                                            fontSize: '1.2rem',
                                                                            padding: '0',
                                                                            lineHeight: 1
                                                                        }}
                                                                    >×</button>
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                                    <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                                                        <label style={{ display: 'block', fontSize: '0.7rem', color: T.textMuted, marginBottom: '0.5rem', fontWeight: '600', letterSpacing: '0.05em' }}>Start Date</label>
                                                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.4rem' }}>
                                                                            <select 
                                                                                value={customStartDate.substring(5, 7) || '01'}
                                                                                onChange={(e) => {
                                                                                    const year = customStartDate.substring(0, 4) || new Date().getFullYear();
                                                                                    const day = customStartDate.substring(8, 10) || '01';
                                                                                    setCustomStartDate(`${year}-${e.target.value}-${day}`);
                                                                                }}
                                                                                style={{ 
                                                                                    padding: '0.6rem 0.5rem', 
                                                                                    background: T.panelBg, 
                                                                                    border: `1.5px solid ${T.borderMid}`, 
                                                                                    borderRadius: '6px', 
                                                                                    color: T.textPrimary,
                                                                                    fontSize: '0.85rem',
                                                                                    fontWeight: '500',
                                                                                    cursor: 'pointer',
                                                                                    outline: 'none'
                                                                                }}
                                                                            >
                                                                                <option value="01">Jan</option>
                                                                                <option value="02">Feb</option>
                                                                                <option value="03">Mar</option>
                                                                                <option value="04">Apr</option>
                                                                                <option value="05">May</option>
                                                                                <option value="06">Jun</option>
                                                                                <option value="07">Jul</option>
                                                                                <option value="08">Aug</option>
                                                                                <option value="09">Sep</option>
                                                                                <option value="10">Oct</option>
                                                                                <option value="11">Nov</option>
                                                                                <option value="12">Dec</option>
                                                                            </select>
                                                                            <select 
                                                                                value={customStartDate.substring(8, 10) || '01'}
                                                                                onChange={(e) => {
                                                                                    const year = customStartDate.substring(0, 4) || new Date().getFullYear();
                                                                                    const month = customStartDate.substring(5, 7) || '01';
                                                                                    setCustomStartDate(`${year}-${month}-${e.target.value}`);
                                                                                }}
                                                                                style={{ 
                                                                                    padding: '0.6rem 0.5rem', 
                                                                                    background: T.panelBg, 
                                                                                    border: `1.5px solid ${T.borderMid}`, 
                                                                                    borderRadius: '6px', 
                                                                                    color: T.textPrimary,
                                                                                    fontSize: '0.85rem',
                                                                                    fontWeight: '500',
                                                                                    cursor: 'pointer',
                                                                                    outline: 'none',
                                                                                    textAlign: 'center'
                                                                                }}
                                                                            >
                                                                                {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                                                                                    <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
                                                                                ))}
                                                                            </select>
                                                                            <select 
                                                                                value={customStartDate.substring(0, 4) || new Date().getFullYear().toString()}
                                                                                onChange={(e) => {
                                                                                    const month = customStartDate.substring(5, 7) || '01';
                                                                                    const day = customStartDate.substring(8, 10) || '01';
                                                                                    setCustomStartDate(`${e.target.value}-${month}-${day}`);
                                                                                }}
                                                                                style={{ 
                                                                                    padding: '0.6rem 0.5rem', 
                                                                                    background: T.panelBg, 
                                                                                    border: `1.5px solid ${T.borderMid}`, 
                                                                                    borderRadius: '6px', 
                                                                                    color: T.textPrimary,
                                                                                    fontSize: '0.85rem',
                                                                                    fontWeight: '500',
                                                                                    cursor: 'pointer',
                                                                                    outline: 'none',
                                                                                    textAlign: 'center'
                                                                                }}
                                                                            >
                                                                                {Array.from({length: 14}, (_, i) => 2017 + i).map(y => (
                                                                                    <option key={y} value={y}>{y}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                    <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                                                        <label style={{ display: 'block', fontSize: '0.7rem', color: T.textMuted, marginBottom: '0.5rem', fontWeight: '600', letterSpacing: '0.05em' }}>End Date</label>
                                                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.4rem' }}>
                                                                            <select 
                                                                                value={customEndDate.substring(5, 7) || '01'}
                                                                                onChange={(e) => {
                                                                                    const year = customEndDate.substring(0, 4) || new Date().getFullYear();
                                                                                    const day = customEndDate.substring(8, 10) || '01';
                                                                                    setCustomEndDate(`${year}-${e.target.value}-${day}`);
                                                                                }}
                                                                                style={{ 
                                                                                    padding: '0.6rem 0.5rem', 
                                                                                    background: T.panelBg, 
                                                                                    border: `1.5px solid ${T.borderMid}`, 
                                                                                    borderRadius: '6px', 
                                                                                    color: T.textPrimary,
                                                                                    fontSize: '0.85rem',
                                                                                    fontWeight: '500',
                                                                                    cursor: 'pointer',
                                                                                    outline: 'none'
                                                                                }}
                                                                            >
                                                                                <option value="01">Jan</option>
                                                                                <option value="02">Feb</option>
                                                                                <option value="03">Mar</option>
                                                                                <option value="04">Apr</option>
                                                                                <option value="05">May</option>
                                                                                <option value="06">Jun</option>
                                                                                <option value="07">Jul</option>
                                                                                <option value="08">Aug</option>
                                                                                <option value="09">Sep</option>
                                                                                <option value="10">Oct</option>
                                                                                <option value="11">Nov</option>
                                                                                <option value="12">Dec</option>
                                                                            </select>
                                                                            <select 
                                                                                value={customEndDate.substring(8, 10) || '01'}
                                                                                onChange={(e) => {
                                                                                    const year = customEndDate.substring(0, 4) || new Date().getFullYear();
                                                                                    const month = customEndDate.substring(5, 7) || '01';
                                                                                    setCustomEndDate(`${year}-${month}-${e.target.value}`);
                                                                                }}
                                                                                style={{ 
                                                                                    padding: '0.6rem 0.5rem', 
                                                                                    background: T.panelBg, 
                                                                                    border: `1.5px solid ${T.borderMid}`, 
                                                                                    borderRadius: '6px', 
                                                                                    color: T.textPrimary,
                                                                                    fontSize: '0.85rem',
                                                                                    fontWeight: '500',
                                                                                    cursor: 'pointer',
                                                                                    outline: 'none',
                                                                                    textAlign: 'center'
                                                                                }}
                                                                            >
                                                                                {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                                                                                    <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
                                                                                ))}
                                                                            </select>
                                                                            <select 
                                                                                value={customEndDate.substring(0, 4) || new Date().getFullYear().toString()}
                                                                                onChange={(e) => {
                                                                                    const month = customEndDate.substring(5, 7) || '01';
                                                                                    const day = customEndDate.substring(8, 10) || '01';
                                                                                    setCustomEndDate(`${e.target.value}-${month}-${day}`);
                                                                                }}
                                                                                style={{ 
                                                                                    padding: '0.6rem 0.5rem', 
                                                                                    background: T.panelBg, 
                                                                                    border: `1.5px solid ${T.borderMid}`, 
                                                                                    borderRadius: '6px', 
                                                                                    color: T.textPrimary,
                                                                                    fontSize: '0.85rem',
                                                                                    fontWeight: '500',
                                                                                    cursor: 'pointer',
                                                                                    outline: 'none',
                                                                                    textAlign: 'center'
                                                                                }}
                                                                            >
                                                                                {Array.from({length: 14}, (_, i) => 2017 + i).map(y => (
                                                                                    <option key={y} value={y}>{y}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                        <button
                                                                            onClick={() => setShowCustomDatePicker(false)}
                                                                            style={{
                                                                                flex: 1,
                                                                                padding: '0.5rem',
                                                                                background: 'transparent',
                                                                                color: T.textMuted,
                                                                                border: `1px solid ${T.borderStrong}`,
                                                                                borderRadius: '4px',
                                                                                cursor: 'pointer',
                                                                                fontWeight: '700',
                                                                                fontSize: '0.75rem',
                                                                                letterSpacing: '0.05em',
                                                                            }}
                                                                        >
                                                                            CANCEL
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                if (customStartDate && customEndDate) {
                                                                                    setChartTimeframe('CUSTOM');
                                                                                    setShowCustomDatePicker(false);
                                                                                } else {
                                                                                    showToast("warning", "Missing Dates", "Please select both start and end dates.");
                                                                                }
                                                                            }}
                                                                            disabled={!customStartDate || !customEndDate}
                                                                            style={{
                                                                                flex: 1,
                                                                                padding: '0.5rem',
                                                                                background: (!customStartDate || !customEndDate) ? T.borderStrong : T.green,
                                                                                color: (!customStartDate || !customEndDate) ? T.textMuted : T.pageBg,
                                                                                border: 'none',
                                                                                borderRadius: '4px',
                                                                                cursor: (!customStartDate || !customEndDate) ? 'not-allowed' : 'pointer',
                                                                            fontWeight: '700',
                                                                            fontSize: '0.75rem',
                                                                            letterSpacing: '0.05em',
                                                                        }}
                                                                    >
                                                                        APPLY
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {chartData.length < 2 ? (
                                            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textFaint, fontSize: '0.9rem' }}>
                                                No closed trades in this timeframe
                                            </div>
                                        ) : (
                                            <div style={{ height: '300px', position: 'relative' }}>
                                                <canvas ref={canvasRef}></canvas>
                                            </div>
                                        )}
                                    </div>
                                );
                            };
                            
                            if (!window.Chart) return (
                                <div style={{ background: T.panelBg, borderRadius: '8px', padding: '2rem', border: `1px solid ${T.border}`, marginBottom: '2rem', textAlign: 'center', color: T.textMuted }}>
                                    Chart library not loaded. Try refreshing the page.
                                </div>
                            );
                            
                            return <ChartComponent />;
                        })()}

                    </>
                )}
            </div>

            <SharedModals {...props} />

            {showCSVUpload && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: T.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 1000 }}>
                    <div style={{ background: T.surfaceBg, borderRadius: '8px', padding: '2rem', maxWidth: '600px', width: '100%', border: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>UPLOAD CSV</h3>
                            <button onClick={() => setShowCSVUpload(false)} style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ marginBottom: '1.5rem', color: T.textSecondary, fontSize: '0.9rem', lineHeight: '1.6' }}>
                            <strong style={{ color: T.green }}>Expected CSV format:</strong><br/><br/>
                            <strong>Required:</strong> Symbol, Qty, Entry Price, Entry Date<br/>
                            <strong>Optional:</strong> Name, Exit Date, Fees, Total Profit, Log
                        </div>
                        <label style={{ display: 'block', padding: '3rem', border: `2px dashed ${T.borderStrong}`, borderRadius: '8px', textAlign: 'center', cursor: processingCSV ? 'not-allowed' : 'pointer' }}>
                            <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={processingCSV} style={{ display: 'none' }} />
                            <Upload size={48} style={{ margin: '0 auto 1rem', display: 'block', color: T.blue }} />
                            <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                {processingCSV ? 'Processing...' : 'Click to upload CSV'}
                            </div>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}
