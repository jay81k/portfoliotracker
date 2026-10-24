// Left navigation sidebar — moved out of App.jsx.

import React from 'react';
import { Plus } from './icons';

export default function Sidebar(props) {
    const {
        INDEX_CONFIG, T, activePortfolioId, currentPrices, editingPortfolioId, editingPortfolioName,
        handleCSVUpload, handleDeletePortfolio, handleExportCSV, handleExportJSON, handleImportJSON,
        handleRenamePortfolio, handleSwitchPortfolio, indexQuotes, isDark, manualPrices, portfolios,
        prevClosePrices, resetFormData, setEditingPortfolioId, setEditingPortfolioName, setShowAddPortfolio,
        setShowAddTrade, setShowClearConfirm, setShowExportMenu, setShowImportMenu, setView, showExportMenu,
        showImportMenu, toggleTheme, trades, view,
    } = props;

        const openTrades = trades.filter(t => !t.exitDate);
        const withPnl = openTrades.map(t => {
            const price = currentPrices[t.symbol] || manualPrices[t.symbol];
            if (!price) return null;
            const pnlPct = t.direction === 'short'
                ? ((t.entryPrice - price) / t.entryPrice) * 100
                : ((price - t.entryPrice) / t.entryPrice) * 100;
            return { symbol: t.symbol, pnlPct };
        }).filter(Boolean);
        const sorted = [...withPnl].sort((a, b) => b.pnlPct - a.pnlPct);
        const topPerformer = sorted[0] || null;
        const worstPerformer = sorted[sorted.length - 1] || null;

        // Today's day-change % per open position
        const withDayChg = openTrades.map(t => {
            const price = currentPrices[t.symbol] || manualPrices[t.symbol];
            const prev = prevClosePrices[t.symbol];
            if (!price || !prev) return null;
            const dayPct = t.direction === 'short'
                ? ((prev - price) / prev) * 100
                : ((price - prev) / prev) * 100;
            return { symbol: t.symbol, dayPct };
        }).filter(Boolean);
        const sortedDay = [...withDayChg].sort((a, b) => b.dayPct - a.dayPct);
        const topToday = sortedDay[0] || null;
        const worstToday = sortedDay[sortedDay.length - 1] || null;

        const sbBg = isDark ? '#0a0a0a' : '#ffffff';
        const sbBorder = isDark ? '#1a1a1a' : '#e2e5e9';
        const hoverBg = isDark ? '#111111' : '#f0f2f5';
        const secLabel = isDark ? '#6b7280' : '#374151';
        const navItemColor = isDark ? T.textSecondary : T.textPrimary;

        const NavItem = ({ label, target, icon }) => {
            const isActive = view === target;
            return (
                <div onClick={() => setView(target)} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.52rem 0.8rem', borderRadius: '5px', cursor: 'pointer', background: isActive ? (isDark ? 'rgba(0,255,136,0.07)' : 'rgba(5,150,105,0.07)') : 'transparent', color: isActive ? T.green : navItemColor, fontSize: '0.82rem', fontWeight: isActive ? '600' : '400', letterSpacing: '0.02em', marginBottom: '1px', borderLeft: `2px solid ${isActive ? T.green : 'transparent'}`, transition: 'all 0.12s' }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = T.textPrimary; }}}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = navItemColor; }}}>
                    <span style={{ fontSize: '0.88rem', width: '15px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                    {label}
                </div>
            );
        };

        const ToolItem = ({ label, icon, onClick }) => (
            <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.52rem 0.8rem', borderRadius: '5px', cursor: 'pointer', color: navItemColor, fontSize: '0.82rem', fontWeight: '400', letterSpacing: '0.02em', marginBottom: '1px', transition: 'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = T.textPrimary; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = navItemColor; }}>
                <span style={{ fontSize: '0.88rem', width: '15px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                {label}
            </div>
        );

        const SectionLabel = ({ text }) => (
            <div style={{ fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: secLabel, padding: '0.8rem 0.8rem 0.3rem' }}>{text}</div>
        );

        const fileInputLabelStyle = { display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.52rem 0.8rem', borderRadius: '5px', cursor: 'pointer', color: navItemColor, fontSize: '0.82rem', fontWeight: '400', letterSpacing: '0.02em', marginBottom: '1px', transition: 'all 0.12s' };

        return (
            <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '220px', background: sbBg, borderRight: `1px solid ${sbBorder}`, display: 'flex', flexDirection: 'column', zIndex: 500 }}>
                {/* Header */}
                <div style={{ padding: '1rem 0.9rem 0.85rem', borderBottom: `1px solid ${sbBorder}`, display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                    <div style={{ width: '26px', height: '26px', background: T.green, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#000' : '#fff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    </div>
                    <span style={{ fontSize: '0.84rem', fontWeight: '700', color: T.textPrimary, letterSpacing: '0.02em' }}>Portfolio Tracker</span>
                    <button onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = T.textPrimary; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textMuted; }}
                        style={{ marginLeft: 'auto', width: '26px', height: '26px', border: 'none', borderRadius: '5px', background: 'transparent', color: T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.12s', padding: 0 }}>
                        {isDark
                            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        }
                    </button>
                </div>

                {/* Scrollable body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem 0.45rem' }}>
                    {/* Add Trade */}
                    <div style={{ padding: '0.6rem 0.35rem 0.5rem' }}>
                        <button onClick={() => { resetFormData(); setShowAddTrade(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: T.green, color: isDark ? '#000' : '#fff', border: 'none', padding: '0.52rem 1rem', borderRadius: '5px', cursor: 'pointer', fontWeight: '700', fontSize: '0.76rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            <Plus size={13} /> Add Trade
                        </button>
                    </div>

                    <SectionLabel text="Navigation" />
                    <NavItem label="Dashboard" target="dashboard" icon="◈" />
                    <NavItem label="Trades" target="trades" icon="⊞" />
                    <NavItem label="Calendar" target="calendar" icon="▦" />
                    <NavItem label="Analytics" target="stats" icon={
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="12" width="4" height="9" rx="1"/>
                            <rect x="10" y="7" width="4" height="14" rx="1"/>
                            <rect x="17" y="3" width="4" height="18" rx="1"/>
                        </svg>
                    } />
                    <NavItem label="Journal" target="journal" icon={
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                    } />

                    <SectionLabel text="Tools" />
                    <div onClick={() => window.openRiskCalc && window.openRiskCalc(isDark)} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.52rem 0.8rem', borderRadius: '5px', cursor: 'pointer', color: navItemColor, fontSize: '0.82rem', fontWeight: '400', letterSpacing: '0.02em', marginBottom: '1px', transition: 'all 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = T.textPrimary; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = navItemColor; }}>
                        <span style={{ width: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><circle cx="8.5" cy="11.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="11.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="15.5" cy="11.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="0.8" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15" r="0.8" fill="currentColor" stroke="none"/><circle cx="8.5" cy="18.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="18.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="15.5" cy="18.5" r="0.8" fill="currentColor" stroke="none"/></svg>
                        </span>
                        Risk Calculator
                    </div>
                    <ToolItem label="Add Portfolio" icon="＋" onClick={() => setShowAddPortfolio(true)} />
                    <div style={{ height: '1px', background: sbBorder, margin: '0.3rem 0.35rem' }} />

                    {/* Sidebar portfolio switcher — only when multiple portfolios */}
                    {portfolios.length > 1 && (<>
                        <SectionLabel text="Portfolio" />
                        <div style={{ margin: '0 0.35rem 0.4rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {portfolios.map(p => {
                                const isActive = activePortfolioId === p.id;
                                const isEditing = editingPortfolioId === p.id;
                                return (
                                    <div key={p.id}
                                        onClick={() => !isActive && !isEditing && handleSwitchPortfolio(p.id)}
                                        onMouseEnter={e => { if (!isActive && !isEditing) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.borderColor = sbBorder; }}}
                                        onMouseLeave={e => { if (!isActive && !isEditing) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '0.3rem 0.5rem 0.3rem 0.7rem', borderRadius: '5px',
                                            cursor: isActive || isEditing ? 'default' : 'pointer',
                                            background: isActive ? (isDark ? 'rgba(0,255,136,0.08)' : 'rgba(5,150,105,0.08)') : 'transparent',
                                            border: `1px solid ${isActive ? (isDark ? 'rgba(0,255,136,0.2)' : 'rgba(5,150,105,0.2)') : 'transparent'}`,
                                            transition: 'all 0.12s', gap: '0.4rem',
                                        }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: isActive ? T.green : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'), transition: 'all 0.12s' }} />
                                            {isEditing ? (
                                                <input
                                                    autoFocus
                                                    value={editingPortfolioName}
                                                    onChange={e => setEditingPortfolioName(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleRenamePortfolio(p.id, editingPortfolioName);
                                                        if (e.key === 'Escape') setEditingPortfolioId(null);
                                                    }}
                                                    onBlur={() => handleRenamePortfolio(p.id, editingPortfolioName)}
                                                    onClick={e => e.stopPropagation()}
                                                    style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', fontWeight: '600', color: T.textPrimary, background: T.panelBg, border: `1px solid ${T.green}`, borderRadius: '3px', padding: '0.15rem 0.35rem', outline: 'none', letterSpacing: '0.02em' }}
                                                />
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', fontWeight: isActive ? '600' : '400', color: isActive ? T.green : T.textSecondary, letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                            )}
                                        </div>
                                        {!isEditing && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                <button
                                                    title="Rename portfolio"
                                                    onClick={e => { e.stopPropagation(); setEditingPortfolioId(p.id); setEditingPortfolioName(p.name); }}
                                                    onMouseEnter={e => { e.currentTarget.style.color = T.textPrimary; e.currentTarget.style.opacity = '1'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = T.textFaint; e.currentTarget.style.opacity = '0.5'; }}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.textFaint, opacity: '0.5', padding: '0.1rem 0.2rem', flexShrink: 0, lineHeight: 1, transition: 'all 0.12s', display: 'flex', alignItems: 'center' }}>
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button
                                                    title="Delete portfolio"
                                                    onClick={e => { e.stopPropagation(); handleDeletePortfolio(p.id); }}
                                                    onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.opacity = '1'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = T.textFaint; e.currentTarget.style.opacity = '0.5'; }}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.textFaint, opacity: '0.5', padding: '0.1rem 0.2rem', flexShrink: 0, lineHeight: 1, transition: 'all 0.12s', display: 'flex', alignItems: 'center' }}>
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>)}

                    <div style={{ height: '1px', background: sbBorder, margin: '0.3rem 0.35rem' }} />

                    {/* Import Trades */}
                    <div style={{ position: 'relative' }}>
                        <div onClick={() => { setShowImportMenu(v => !v); setShowExportMenu(false); }}
                            onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = T.textPrimary; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = navItemColor; }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.52rem 0.8rem', borderRadius: '5px', cursor: 'pointer', color: navItemColor, fontSize: '0.82rem', fontWeight: '400', letterSpacing: '0.02em', marginBottom: '1px', transition: 'all 0.12s', userSelect: 'none' }}>
                            <span style={{ fontSize: '0.88rem', width: '15px', textAlign: 'center', flexShrink: 0 }}>↑</span>
                            Import Trades
                            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', opacity: 0.45 }}>{showImportMenu ? '▲' : '▼'}</span>
                        </div>
                        {showImportMenu && (
                            <div style={{ margin: '0 0.35rem 0.3rem', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${sbBorder}`, borderRadius: '6px', overflow: 'hidden' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.5rem 0.75rem', cursor: 'pointer', color: navItemColor, fontSize: '0.8rem', transition: 'all 0.12s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = T.textPrimary; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = navItemColor; }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '600', opacity: 0.55 }}>CSV</span> Import from .csv
                                    <input type="file" accept=".csv" onChange={(e) => { handleCSVUpload(e); setShowImportMenu(false); }} style={{ display: 'none' }} />
                                </label>
                                <div style={{ height: '1px', background: sbBorder }} />
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.5rem 0.75rem', cursor: 'pointer', color: navItemColor, fontSize: '0.8rem', transition: 'all 0.12s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = T.textPrimary; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = navItemColor; }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '600', opacity: 0.55 }}>JSON</span> Import from .json
                                    <input type="file" accept=".json" onChange={(e) => { handleImportJSON(e); setShowImportMenu(false); }} style={{ display: 'none' }} />
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Export Trades */}
                    <div style={{ position: 'relative' }}>
                        <div onClick={() => { setShowExportMenu(v => !v); setShowImportMenu(false); }}
                            onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = T.textPrimary; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = navItemColor; }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.52rem 0.8rem', borderRadius: '5px', cursor: 'pointer', color: navItemColor, fontSize: '0.82rem', fontWeight: '400', letterSpacing: '0.02em', marginBottom: '1px', transition: 'all 0.12s', userSelect: 'none' }}>
                            <span style={{ fontSize: '0.88rem', width: '15px', textAlign: 'center', flexShrink: 0 }}>↓</span>
                            Export Trades
                            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', opacity: 0.45 }}>{showExportMenu ? '▲' : '▼'}</span>
                        </div>
                        {showExportMenu && (
                            <div style={{ margin: '0 0.35rem 0.3rem', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${sbBorder}`, borderRadius: '6px', overflow: 'hidden' }}>
                                <div onClick={() => { handleExportCSV(); setShowExportMenu(false); }}
                                    onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = T.textPrimary; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = navItemColor; }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.5rem 0.75rem', cursor: 'pointer', color: navItemColor, fontSize: '0.8rem', transition: 'all 0.12s' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '600', opacity: 0.55 }}>CSV</span> Export as .csv
                                </div>
                                <div style={{ height: '1px', background: sbBorder }} />
                                <div onClick={() => { handleExportJSON(); setShowExportMenu(false); }}
                                    onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = T.textPrimary; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = navItemColor; }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.5rem 0.75rem', cursor: 'pointer', color: navItemColor, fontSize: '0.8rem', transition: 'all 0.12s' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '600', opacity: 0.55 }}>JSON</span> Export as .json
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Snapshot — index quotes + portfolio highlights */}
                    {(() => {
                        const hasIndexData = Object.keys(indexQuotes).length > 0;
                        const hasPortfolioData = withPnl.length > 0;
                        if (!hasIndexData && !hasPortfolioData) return null;

                        const Sparkline = ({ data, isGreen, width = 80, height = 24 }) => {
                            if (!data || data.length < 2) return <div style={{ width, height }} />;
                            const mn = Math.min(...data), mx = Math.max(...data);
                            const range = mx - mn || 1;
                            const pts = data.map((v, i) => {
                                const x = (i / (data.length - 1)) * width;
                                const y = height - ((v - mn) / range) * height;
                                return `${x.toFixed(1)},${y.toFixed(1)}`;
                            }).join(' ');
                            const color = isGreen ? (isDark ? '#00ff88' : '#059669') : (isDark ? '#f87171' : '#dc2626');
                            const fillId = `sf-${Math.random().toString(36).slice(2,7)}`;
                            return (
                                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
                                    <defs>
                                        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#${fillId})`} />
                                    <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
                                </svg>
                            );
                        };

                        const fmtPrice = (n) => {
                            if (!n) return '—';
                            return n >= 10000 ? n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        };

                        return (
                            <>
                                <div style={{ height: '1px', background: sbBorder, margin: '1rem 0.35rem 0' }} />
                                <SectionLabel text="Snapshot" />

                                {/* Index cards */}
                                {hasIndexData && INDEX_CONFIG.map(({ key, label }) => {
                                    const q = indexQuotes[key];
                                    if (!q) return null;
                                    const chg = q.prevClose ? ((q.price - q.prevClose) / q.prevClose) * 100 : null;
                                    const isGreen = chg === null ? true : chg >= 0;
                                    const accentColor = isGreen ? (isDark ? '#00ff88' : '#059669') : (isDark ? '#f87171' : '#dc2626');
                                    return (
                                        <div key={key} style={{ margin: '0 0.35rem 0.3rem', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${sbBorder}`, borderRadius: '6px', padding: '0.5rem 0.65rem 0.35rem', overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textSecondary }}>{label}</span>
                                                {chg !== null && (
                                                    <span style={{ fontSize: '0.68rem', fontWeight: '600', color: accentColor }}>{chg >= 0 ? '+' : ''}{chg.toFixed(2)}%</span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                <span style={{ fontSize: '0.88rem', fontWeight: '600', color: T.textPrimary, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{fmtPrice(q.price)}</span>
                                                <Sparkline data={q.sparkline} isGreen={isGreen} width={72} height={22} />
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Portfolio name divider */}
                                {hasPortfolioData && hasIndexData && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0.4rem 0.35rem 0.3rem' }}>
                                        <div style={{ flex: 1, height: '1px', background: sbBorder }} />
                                        <span style={{ fontSize: '0.58rem', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textMuted, whiteSpace: 'nowrap' }}>
                                            {portfolios.find(p => p.id === activePortfolioId)?.name || 'My Portfolio'}
                                        </span>
                                        <div style={{ flex: 1, height: '1px', background: sbBorder }} />
                                    </div>
                                )}

                                {/* Portfolio highlights */}
                                {hasPortfolioData && (() => {
                                    const statCard = (label, symbol, pct, isGreen) => {
                                        const color = isGreen ? (isDark ? '#00ff88' : '#059669') : (isDark ? '#f87171' : '#dc2626');
                                        return (
                                            <div key={label} style={{ margin: '0 0.35rem 0.3rem', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${sbBorder}`, borderRadius: '6px', padding: '0.5rem 0.65rem' }}>
                                                <div style={{ fontSize: '0.58rem', color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.28rem', fontWeight: '700' }}>{label}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: T.textPrimary }}>{symbol}</span>
                                                    <span style={{ fontSize: '0.72rem', fontWeight: '600', color }}>{pct >= 0 ? '+' : ''}{pct.toFixed(2)}%</span>
                                                </div>
                                            </div>
                                        );
                                    };
                                    return (<>
                                        {topToday && statCard('Best Today', topToday.symbol, topToday.dayPct, topToday.dayPct >= 0)}
                                        {worstToday && worstToday.symbol !== topToday?.symbol && statCard('Worst Today', worstToday.symbol, worstToday.dayPct, worstToday.dayPct >= 0)}
                                        {topPerformer && statCard('Top Performer', topPerformer.symbol, topPerformer.pnlPct, topPerformer.pnlPct >= 0)}
                                        {worstPerformer && worstPerformer.symbol !== topPerformer?.symbol && statCard('Worst Performer', worstPerformer.symbol, worstPerformer.pnlPct, worstPerformer.pnlPct >= 0)}
                                    </>);
                                })()}
                            </>
                        );
                    })()}
                </div>

                {/* Footer — clear portfolio */}
                <div style={{ padding: '0.45rem 0.45rem', borderTop: `1px solid ${sbBorder}`, flexShrink: 0 }}>
                    <div onClick={() => setShowClearConfirm(true)}
                        onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(248,113,113,0.1)' : 'rgba(220,38,38,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.5rem 0.7rem', borderRadius: '5px', cursor: 'pointer', color: isDark ? '#f87171' : '#dc2626', fontSize: '0.79rem', fontWeight: '400', letterSpacing: '0.02em', transition: 'all 0.12s', background: 'transparent' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                        Clear Portfolio
                    </div>
                </div>
            </div>
        );
}
