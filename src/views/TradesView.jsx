// Trades tab — moved out of App.jsx.

import React from 'react';
import { CameraIcon, Edit, Trash2, Upload, X } from '../components/icons';
import Lightbox from '../components/Lightbox';
import ScreenshotSection from '../components/ScreenshotSection';
import SharedModals from '../components/SharedModals';
import Sidebar from '../components/Sidebar';

export default function TradesView(props) {
    const {
        T, activePortfolioId, currentPrices, displayTrades, dividendAddActive, dividendAddDate, dividendAddVal,
        editingPartialExit, editingPrice, editingTrade, expandedTrade, fetchCurrentPrices, fetchSymbolName,
        fetchingName, fetchingPrices, filteredTrades, formData, handleAddDividendEntry, handleAddPartialAdd,
        handleAddPartialExit, handleCSVUpload, handleDeleteDividendEntry, handleDeletePartialAdd,
        handleDeletePartialExit, handleDeleteTrade, handleEditPartialExit, handleEditTrade, handleSort,
        handleUpdatePartialExit, handleUpdateTrade, isDark, manualPrices, metrics, notesTab, partialAddForm,
        partialExitForm, partialType, pendingBlobs, portfolios, prevClosePrices, processingCSV,
        screenshotFileEditRef, screenshotUrls, searchTerm, setDividendAddActive, setDividendAddDate,
        setDividendAddVal, setEditingPartialExit, setEditingPrice, setEditingTrade, setExpandedTrade,
        setFetchingName, setFormData, setIsPasteActive, setLightboxData, setManualPrices, setNotesTab,
        setPartialAddForm, setPartialExitForm, setPartialType, setPendingBlobs, setScreenshotUrls,
        setSearchTerm, setShowCSVUpload, setShowEditTrade, setShowPartialExit, setTimeframe,
        setTradeActivityExpanded, setTradeView, setView, showCSVUpload, showChgColumn, showEditTrade,
        showPartialExit, showSplitQtyColumns, showToast, sortColumn, sortDirection, timeframe,
        tradeActivityExpanded, tradeView, trades,
    } = props;

    return (
        <div style={{ minHeight: '100vh', padding: '2rem', background: T.pageBg, color: T.textPrimary, marginLeft: '220px' }}>
            <Sidebar {...props} />
            <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <button onClick={() => setView('dashboard')} title="Back to Dashboard" style={{ background: T.green, border: 'none', padding: '0', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', flexShrink: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        </button>
                        <div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Trades</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: '700', letterSpacing: '0.02em', color: T.textPrimary, lineHeight: 1 }}>
                                    {tradeView === 'all' ? 'All Trades' : tradeView === 'open' ? 'Open Trades' : 'Closed Trades'}
                                </div>
                                {portfolios.length > 1 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: isDark ? 'rgba(0,255,136,0.08)' : 'rgba(5,150,105,0.08)', border: `1px solid ${isDark ? 'rgba(0,255,136,0.2)' : 'rgba(5,150,105,0.2)'}`, borderRadius: '4px', padding: '0.2rem 0.55rem' }}>
                                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: T.green, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.72rem', fontWeight: '600', color: T.green, letterSpacing: '0.03em' }}>
                                            {portfolios.find(p => p.id === activePortfolioId)?.name || ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                            type="text" 
                            placeholder="Search symbol or name..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                padding: '0.5rem 1rem', 
                                background: T.panelBg, 
                                border: `1px solid ${T.borderStrong}`, 
                                borderRadius: '4px', 
                                color: T.textPrimary, 
                                fontSize: '0.85rem',
                                width: '250px'
                            }}
                        />
                        {tradeView === 'open' && (
                            <button 
                                onClick={fetchCurrentPrices} 
                                disabled={fetchingPrices}
                                title="Refresh live prices"
                                style={{ 
                                    background: 'transparent', 
                                    border: `1px solid ${T.borderStrong}`, 
                                    color: fetchingPrices ? T.textFaint : T.blue, 
                                    padding: '0.5rem 0.75rem', 
                                    borderRadius: '4px', 
                                    cursor: fetchingPrices ? 'not-allowed' : 'pointer', 
                                    fontSize: '0.9rem',
                                    fontWeight: '600'
                                }}
                            >
                                {fetchingPrices ? '⟳' : '↻'}
                            </button>
                        )}
                    </div>
                    
                    {tradeView === 'open' && (
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: T.textMuted, marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Equity</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: T.blue }}>
                                    ${(() => {
                                        const openTrades = trades.filter(t => !t.exitDate);
                                        return openTrades.reduce((sum, trade) => {
                                            const currentPrice = manualPrices[trade.symbol] || currentPrices[trade.symbol] || trade.entryPrice;
                                            return sum + (trade.qty * currentPrice) + (trade.dividend || 0);
                                        }, 0).toFixed(2);
                                    })()}
                                </div>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: T.textMuted, marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Today's P/L</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: metrics.todaysPL >= 0 ? T.green : T.red }}>
                                    {metrics.todaysPL >= 0 ? '+' : ''}${metrics.todaysPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: T.textMuted, marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Unrealized P/L</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: metrics.unrealizedPL >= 0 ? T.green : T.red }}>
                                    {metrics.unrealizedPL >= 0 ? '+' : ''}${metrics.unrealizedPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                            {(() => {
                                const openTrades = trades.filter(t => !t.exitDate);
                                const prevDayEquity = openTrades.reduce((sum, trade) => {
                                    const prevClose = prevClosePrices[trade.symbol];
                                    return prevClose ? sum + (prevClose * trade.qty) : sum;
                                }, 0);
                                if (!prevDayEquity || prevDayEquity === 0) return null;
                                const dailyPct = (metrics.todaysPL / prevDayEquity) * 100;
                                return (
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.7rem', color: T.textMuted, marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Daily Chg %</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: dailyPct >= 0 ? T.green : T.red }}>
                                            {dailyPct >= 0 ? '+' : ''}{dailyPct.toFixed(2)}%
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', background: T.panelBg, border: `1px solid ${T.border}`, borderRadius: '7px', padding: '3px', gap: '2px' }}>
                            {[['all', `All (${filteredTrades.length})`], ['open', `Open (${filteredTrades.filter(t => !t.exitDate).length})`], ['closed', `Closed (${filteredTrades.filter(t => t.exitDate).length})`]].map(([key, label]) => (
                                <button key={key} onClick={() => setTradeView(key)} style={{ background: tradeView === key ? T.green : 'transparent', color: tradeView === key ? T.pageBg : T.textMuted, border: 'none', padding: '0.35rem 0.85rem', borderRadius: '5px', cursor: 'pointer', fontWeight: '700', fontSize: '0.72rem', letterSpacing: '0.03em', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>{label}</button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', background: T.panelBg, border: `1px solid ${T.border}`, borderRadius: '7px', padding: '3px', gap: '2px' }}>
                            {['1M', '3M', '6M', 'YTD', '1Y', 'ALL'].map(tf => (
                                <button key={tf} onClick={() => setTimeframe(tf)} style={{ background: timeframe === tf ? T.blue : 'transparent', color: timeframe === tf ? T.pageBg : T.textMuted, border: 'none', padding: '0.35rem 0.75rem', borderRadius: '5px', cursor: 'pointer', fontWeight: '700', fontSize: '0.72rem', letterSpacing: '0.03em', transition: 'all 0.15s' }}>{tf}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ background: T.panelBg, borderRadius: '8px', border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: T.surfaceBg, borderBottom: `1px solid ${T.border}` }}>
                                    <th onClick={() => handleSort('symbol')} style={{ padding: '0.6rem 0.7rem', textAlign: 'left', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                                        Symbol {sortColumn === 'symbol' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th onClick={() => handleSort('name')} style={{ padding: '0.6rem 0.7rem', textAlign: 'left', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                                        Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    {showSplitQtyColumns ? (
                                        <>
                                            <th onClick={() => handleSort('originalQty')} style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                                                Orig Qty {sortColumn === 'originalQty' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th onClick={() => handleSort('qty')} style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                                                Remaining {sortColumn === 'qty' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </th>
                                        </>
                                    ) : (
                                        <th onClick={() => handleSort('qty')} style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                                            Qty {sortColumn === 'qty' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                    )}
                                    <th onClick={() => handleSort('entryPrice')} style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                                        Avg Cost {sortColumn === 'entryPrice' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th onClick={() => handleSort('exitPrice')} style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                                        {tradeView === 'open' ? 'Last' : 'Exit'} {sortColumn === 'exitPrice' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    {showChgColumn && (
                                        <th onClick={() => handleSort('chg')} style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                                            Chg {sortColumn === 'chg' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                    )}
                                    {showChgColumn && (
                                        <th onClick={() => handleSort('todaysProfit')} title="Today's profit" style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                                            Profit <span style={{ fontSize: '0.65rem', color: T.textFaint, fontWeight: '400', borderRadius: '50%', border: `1px solid ${T.textFaint}`, padding: '0px 3px', marginLeft: '2px', verticalAlign: 'middle' }}>?</span> {sortColumn === 'todaysProfit' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                    )}
                                    {showChgColumn && (
                                        <th style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', userSelect: 'none', whiteSpace: 'nowrap' }}>
                                            Day %
                                        </th>
                                    )}
                                    <th onClick={() => handleSort('totalChg')} style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                                        Total Chg {sortColumn === 'totalChg' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th onClick={() => handleSort('changePercent')} style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                                        Chg % {sortColumn === 'changePercent' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th onClick={() => handleSort('marketValue')} style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                                        Market Value {sortColumn === 'marketValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th onClick={() => handleSort('profit')} style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                                        Profit {sortColumn === 'profit' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th onClick={() => handleSort('totalProfit')} style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}>
                                        Total Profit {sortColumn === 'totalProfit' && (sortDirection === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th style={{ padding: '0.6rem 0.7rem', textAlign: 'left', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '0.6rem 0.7rem', textAlign: 'center', fontSize: '0.75rem', color: T.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayTrades.map((trade, idx) => {
                                    const isOpen = !trade.exitDate;
                                    const livePrice = currentPrices[trade.symbol];
                                    const manualPrice = manualPrices[trade.symbol];
                                    const currentPrice = isOpen
                                        ? (manualPrice || livePrice || trade.entryPrice)
                                        : (trade.exitPrice || trade.entryPrice);
                                    const priceSource = isOpen
                                        ? (manualPrice ? 'manual' : livePrice ? 'live' : 'entry')
                                        : 'closed';
                                    const partialExits = trade.partialExits || [];
                                    // Reconstruct gross partial profit (fee-free) for correct Total Profit math.
                                    // New exits store pe.grossProfit directly; old exits derive it from trade.fees.
                                    const origQtyForFees = trade.originalQty || (trade.qty + partialExits.reduce((s, pe) => s + (pe.qty || 0), 0));
                                    const partialGrossProfit = partialExits.reduce((sum, pe) => {
                                        if (pe.grossProfit != null) return sum + pe.grossProfit;
                                        const peFees = pe.fees != null ? pe.fees : ((pe.qty / origQtyForFees) * (trade.fees || 0));
                                        return sum + (pe.profit || 0) + peFees;
                                    }, 0);
                                    // Profit column: ONLY the remaining position's price gain — no partial exits, no fees
                                    const grossProfit = isOpen
                                        ? (trade.direction === 'short'
                                            ? (trade.entryPrice - currentPrice) * trade.qty
                                            : (currentPrice - trade.entryPrice) * trade.qty)
                                        : (trade.direction === 'short'
                                            ? (trade.entryPrice - (trade.exitPrice || trade.entryPrice)) * trade.qty
                                            : ((trade.exitPrice || trade.entryPrice) - trade.entryPrice) * trade.qty);
                                    // Net: all fees deducted + partials included — drives WIN/LOSS badge
                                    const netProfit = grossProfit + partialGrossProfit - (trade.fees || 0);
                                    // Total Profit: scale-out gains + remaining position − fees + dividends
                                    const totalProfit = partialGrossProfit + grossProfit - (trade.fees || 0) + (trade.dividend || 0);
                                    const originalQty = trade.originalQty || trade.qty;
                                    return (
                                    <React.Fragment key={trade.id}>
                                    <tr style={{ borderBottom: `1px solid ${T.border}`, background: idx % 2 === 0 ? T.tableRowEven : T.tableRowOdd, transition: 'background 0.1s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = T.hoverBg}
                                        onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? T.tableRowEven : T.tableRowOdd}
                                    >
                                        <td onClick={() => (partialExits.length > 0 || (trade.partialAdds || []).length > 0) && setExpandedTrade(expandedTrade === trade.id ? null : trade.id)} style={{ padding: '0.6rem 0.7rem', fontWeight: '600', fontSize: '0.95rem', cursor: (partialExits.length > 0 || (trade.partialAdds || []).length > 0) ? 'pointer' : 'default' }}>
                                            {trade.direction === 'short' && (
                                                <span style={{ display: 'inline-block', background: T.redBg, color: T.red, border: `1px solid ${T.red}`, borderRadius: '3px', fontSize: '0.65rem', fontWeight: '700', padding: '1px 4px', marginRight: '0.4rem', verticalAlign: 'middle', lineHeight: '1.4' }}>S</span>
                                            )}
                                            {trade.symbol}
                                        </td>
                                        <td style={{ padding: '0.6rem 0.7rem', color: T.textSecondary, fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trade.name}</td>
                                        {showSplitQtyColumns ? (
                                            <>
                                                <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.9rem' }}>{originalQty}</td>
                                                <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.9rem', color: !isOpen ? T.textMuted : trade.qty < originalQty ? T.amber : T.textPrimary }}>
                                                    {!isOpen ? 0 : trade.qty}
                                                </td>
                                            </>
                                        ) : (
                                            <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.9rem' }}>{trade.qty}</td>
                                        )}
                                        <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.9rem' }}>${trade.entryPrice % 1 === 0 ? trade.entryPrice.toFixed(2) : parseFloat(trade.entryPrice.toFixed(4)).toString()}</td>
                                        <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.9rem' }}>
                                            {isOpen ? (
                                                editingPrice === trade.symbol ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                                        <input
                                                            type="number" step="0.01" autoFocus
                                                            defaultValue={manualPrice || livePrice || trade.entryPrice}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    const val = parseFloat(e.target.value);
                                                                    if (!isNaN(val) && val > 0) setManualPrices(p => ({...p, [trade.symbol]: val}));
                                                                    setEditingPrice(null);
                                                                }
                                                                if (e.key === 'Escape') setEditingPrice(null);
                                                            }}
                                                            onBlur={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                if (!isNaN(val) && val > 0) setManualPrices(p => ({...p, [trade.symbol]: val}));
                                                                setEditingPrice(null);
                                                            }}
                                                            style={{ width: '80px', padding: '0.25rem 0.5rem', background: T.raisedBg, border: `1px solid ${T.blue}`, borderRadius: '4px', color: T.textPrimary, fontSize: '0.85rem' }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                                        <span style={{ color: priceSource === 'live' ? T.green : priceSource === 'manual' ? T.amber : T.textMuted }}>
                                                            ${currentPrice.toFixed(2)}
                                                        </span>
                                                        <span
                                                            onClick={() => setEditingPrice(trade.symbol)}
                                                            style={{ fontSize: '0.65rem', color: priceSource === 'live' ? T.green : priceSource === 'manual' ? T.amber : T.textFaint, cursor: 'pointer', textDecoration: 'underline' }}
                                                        >
                                                            {priceSource === 'live' ? 'live ✓' : priceSource === 'manual' ? 'manual ✎' : 'click to set ✎'}
                                                        </span>
                                                    </div>
                                                )
                                            ) : (
                                                <span>${currentPrice.toFixed(2)}</span>
                                            )}
                                        </td>
                                        {showChgColumn && (
                                            <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: '600' }}>
                                                {(() => {
                                                    if (!isOpen) return null;
                                                    const prevClose = prevClosePrices[trade.symbol];
                                                    if (!prevClose) return <span style={{ color: T.textMuted }}>-</span>;
                                                    const dayChg = trade.direction === 'short'
                                                        ? prevClose - currentPrice
                                                        : currentPrice - prevClose;
                                                    return (
                                                        <span style={{ color: dayChg >= 0 ? T.green : T.red }}>
                                                            {dayChg >= 0 ? '+' : ''}${dayChg.toFixed(2)}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                        )}
                                        {showChgColumn && (
                                            <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: '600' }}>
                                                {(() => {
                                                    if (!isOpen) return null;
                                                    const prevClose = prevClosePrices[trade.symbol];
                                                    if (!prevClose) return <span style={{ color: T.textMuted }}>-</span>;
                                                    const dayChg = trade.direction === 'short'
                                                        ? prevClose - currentPrice
                                                        : currentPrice - prevClose;
                                                    const todaysProfit = dayChg * trade.qty;
                                                    return (
                                                        <span style={{ color: todaysProfit >= 0 ? T.green : T.red }}>
                                                            {todaysProfit >= 0 ? '+' : ''}${todaysProfit.toFixed(2)}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                        )}
                                        {showChgColumn && (
                                            <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: '600' }}>
                                                {(() => {
                                                    if (!isOpen) return null;
                                                    const prevClose = prevClosePrices[trade.symbol];
                                                    if (!prevClose) return <span style={{ color: T.textMuted }}>-</span>;
                                                    const dayPct = trade.direction === 'short'
                                                        ? ((prevClose - currentPrice) / prevClose) * 100
                                                        : ((currentPrice - prevClose) / prevClose) * 100;
                                                    return (
                                                        <span style={{ color: dayPct >= 0 ? T.green : T.red }}>
                                                            {dayPct >= 0 ? '+' : ''}{dayPct.toFixed(2)}%
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                        )}
                                        <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: '600' }}>
                                            {(() => {
                                                const totalChg = trade.direction === 'short'
                                                    ? trade.entryPrice - currentPrice
                                                    : currentPrice - trade.entryPrice;
                                                return (
                                                    <span style={{ color: totalChg >= 0 ? T.green : T.red }}>
                                                        {totalChg >= 0 ? '+' : ''}${totalChg.toFixed(2)}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: '600' }}>
                                            {(() => {
                                                const changePercent = trade.direction === 'short'
                                                    ? ((trade.entryPrice - currentPrice) / trade.entryPrice) * 100
                                                    : ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
                                                return (
                                                    <span style={{ color: changePercent >= 0 ? T.green : T.red }}>
                                                        {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: '600', color: T.blue }}>
                                            ${(trade.qty * currentPrice).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: '600', color: grossProfit >= 0 ? T.green : T.red }}>
                                            {grossProfit >= 0 ? '+' : ''}${grossProfit.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: '600', color: totalProfit >= 0 ? T.green : T.red }}>
                                            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
                                            {trade.dividend > 0 && <div style={{ fontSize: '0.7rem', color: T.blue, marginTop: '2px' }}>+${trade.dividend.toFixed(2)} div</div>}
                                        </td>
                                        <td style={{ padding: '0.6rem 0.7rem' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', minWidth: '52px', textAlign: 'center', letterSpacing: '-0.02em',
                                                background: isOpen ? T.blueBg : (netProfit >= -5 && netProfit <= 5 ? T.borderStrong : (netProfit > 5 ? T.greenBgDim : T.redBg)),
                                                color: isOpen ? T.blue : (netProfit >= -5 && netProfit <= 5 ? T.textMuted : (netProfit > 5 ? T.green : T.red)) }}>
                                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0, background: isOpen ? T.blue : (netProfit >= -5 && netProfit <= 5 ? T.textMuted : (netProfit > 5 ? T.green : T.red)) }} />
                                                {isOpen ? 'OPEN' : (netProfit >= -5 && netProfit <= 5 ? 'EVEN' : (netProfit > 5 ? 'WIN' : 'LOSS'))}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.6rem 0.7rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    title={(trade.screenshotUrls?.length > 0) ? 'View screenshots' : 'No screenshot'}
                                                    onClick={() => {
                                                        if (!trade.screenshotUrls?.length) return;
                                                        setLightboxData({ srcs: trade.screenshotUrls, index: 0 });
                                                    }}
                                                    style={{ background: 'transparent', border: `1px solid ${trade.screenshotUrls?.length > 0 ? T.green : T.borderStrong}`, color: trade.screenshotUrls?.length > 0 ? T.green : T.textFaint, padding: '0.4rem', borderRadius: '4px', cursor: trade.screenshotUrls?.length > 0 ? 'pointer' : 'default', opacity: trade.screenshotUrls?.length > 0 ? 1 : 0.35, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <CameraIcon size={14} />
                                                </button>
                                                <button onClick={() => handleEditTrade(trade)} style={{ background: 'transparent', border: `1px solid ${T.borderStrong}`, color: T.blue, padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }} title="Edit"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteTrade(trade.id)} style={{ background: 'transparent', border: `1px solid ${T.borderStrong}`, color: T.red, padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }} title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedTrade === trade.id && partialExits.length > 0 && (
                                        <tr style={{ background: T.surfaceBg, borderBottom: `1px solid ${T.border}` }}>
                                            <td colSpan="14" style={{ padding: '0.6rem 0.7rem', background: T.surfaceBg }}>
                                                <div style={{ marginLeft: '2rem' }}>
                                                    <div style={{ fontSize: '0.75rem', color: T.textMuted, marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trade Activity</div>
                                                    {[...partialExits.map(pe => ({...pe, type:'exit'})), ...(trade.partialAdds||[]).map(pa => ({...pa, type:'add'}))].sort((a,b) => new Date(a.exitDate||a.date) - new Date(b.exitDate||b.date)).map(item => (
                                                        item.type === 'exit' ? (
                                                            <div key={item.id} style={{ padding: '0.35rem 0', fontSize: '0.82rem', color: T.textSecondary, display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.63rem', fontWeight: '700', color: T.amber, background: `${T.amber}22`, padding: '0.1rem 0.35rem', borderRadius: '2px', textTransform: 'uppercase' }}>Out</span>
                                                                <span>{item.exitDate}</span>
                                                                <span>{item.qty} @ ${item.exitPrice.toFixed(2)}</span>
                                                                <span style={{ color: item.profit >= 0 ? T.green : T.red, fontWeight: '600' }}>{item.profit >= 0 ? '+' : ''}${item.profit.toFixed(2)}</span>
                                                            </div>
                                                        ) : (
                                                            <div key={item.id} style={{ padding: '0.35rem 0', fontSize: '0.82rem', color: T.textSecondary, display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.63rem', fontWeight: '700', color: T.green, background: `${T.green}22`, padding: '0.1rem 0.35rem', borderRadius: '2px', textTransform: 'uppercase' }}>In</span>
                                                                <span>{item.date}</span>
                                                                <span>+{item.qty} @ ${item.price.toFixed(2)}</span>
                                                                <span style={{ color: T.textMuted, fontSize: '0.75rem' }}>avg adjusted</span>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </div>
                {displayTrades.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: T.textMuted }}>No trades found</div>}
            </div>
            {showEditTrade && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: T.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 1000 }}>
                    <div style={{ background: T.surfaceBg, borderRadius: '8px', padding: '2rem', maxWidth: '540px', width: '100%', border: `1px solid ${T.border}`, maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>EDIT TRADE</h3>
                                {(() => {
                                    if (!editingTrade?.entryDate) return null;
                                    const entry = new Date(editingTrade.entryDate);
                                    const end = editingTrade.exitDate ? new Date(editingTrade.exitDate) : new Date();
                                    const days = Math.round((end - entry) / (1000 * 60 * 60 * 24));
                                    const isOpen = !editingTrade.exitDate;
                                    return (
                                        <div style={{ position: 'relative' }}
                                            onMouseEnter={e => e.currentTarget.querySelector('.days-tip').style.opacity = '1'}
                                            onMouseLeave={e => e.currentTarget.querySelector('.days-tip').style.opacity = '0'}
                                        >
                                            <span style={{
                                                fontFamily: "'DM Mono', monospace",
                                                fontSize: '0.7rem',
                                                fontWeight: '500',
                                                padding: '0.2rem 0.55rem',
                                                borderRadius: '4px',
                                                letterSpacing: '0.03em',
                                                cursor: 'default',
                                                position: 'relative',
                                                top: '1px',
                                                color: isOpen ? T.blue : T.textFaint,
                                                background: isOpen ? T.blueBg : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${isOpen ? 'rgba(0,204,255,0.18)' : T.borderMid}`,
                                            }}>{days}d</span>
                                            <div className="days-tip" style={{
                                                position: 'absolute',
                                                bottom: 'calc(100% + 6px)',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                background: T.raisedBg,
                                                border: `1px solid ${T.borderStrong}`,
                                                color: T.textSecondary,
                                                fontSize: '0.65rem',
                                                fontFamily: "'DM Mono', monospace",
                                                letterSpacing: '0.04em',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                whiteSpace: 'nowrap',
                                                pointerEvents: 'none',
                                                opacity: '0',
                                                transition: 'opacity 0.15s ease',
                                                zIndex: 10,
                                            }}>Days in trade</div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <button onClick={() => { setShowEditTrade(false); setEditingTrade(null); setScreenshotUrls([]); setPendingBlobs([]); setIsPasteActive(false); setNotesTab('notes'); }} style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.65fr', gap: '1rem' }}>
                                <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Symbol *</label>
                                <input type="text" placeholder="AAPL" value={formData.symbol}
                                    onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                                    style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary, fontSize: '0.95rem' }} /></div>
                                <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600', whiteSpace: 'nowrap' }}>Direction</label>
                                <select value={formData.direction} onChange={(e) => setFormData({...formData, direction: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: formData.direction === 'short' ? T.red : T.green, fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <option value="long" style={{ color: T.green }}>Long</option>
                                    <option value="short" style={{ color: T.red }}>Short</option>
                                </select></div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                        {editingTrade && (editingTrade.partialExits || []).length > 0 && editingTrade.qty < editingTrade.originalQty ? 'Rem. Qty *' : 'Qty *'}
                                    </label>
                                    <div>
                                        <input 
                                            type="number" 
                                            placeholder="100" 
                                            value={formData.qty} 
                                            onChange={(e) => setFormData({...formData, qty: e.target.value})} 
                                            style={{ width: '100%', maxWidth: '110px', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary, fontSize: '0.95rem' }} 
                                        />
                                        {editingTrade && (editingTrade.partialExits || []).length > 0 && editingTrade.qty < editingTrade.originalQty && (
                                            <div style={{ fontSize: '0.7rem', color: T.amber, marginTop: '4px' }}>
                                                Original: {editingTrade.originalQty}
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                <div style={{ position: 'relative' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Dividends</label>
                                    <input type="number" step="0.01" value={formData.dividend} onChange={(e) => setFormData({...formData, dividend: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary }} />
                                    <div style={{ marginTop: '0.35rem' }}>
                                        {!dividendAddActive && (
                                            <button onClick={() => { setDividendAddDate(new Date().toISOString().split('T')[0]); setDividendAddActive(true); }} style={{ padding: '0.18rem 0.45rem', background: 'transparent', border: `1px solid ${T.textFaint}`, borderRadius: '3px', color: T.textMuted, cursor: 'pointer', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.2rem', lineHeight: 1 }}>
                                                <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>+</span> add entry
                                            </button>
                                        )}
                                    </div>
                                    {dividendAddActive && (
                                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: T.surfaceBg, border: `1px solid ${T.borderStrong}`, borderRadius: '6px', padding: '0.6rem', boxShadow: T.shadowMd, display: 'flex', flexDirection: 'column', gap: '0.4rem', overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                <input autoFocus type="number" step="0.01" placeholder="amount" value={dividendAddVal} onChange={(e) => setDividendAddVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && dividendAddVal && dividendAddDate) handleAddDividendEntry(dividendAddVal, dividendAddDate); if (e.key === 'Escape') { setDividendAddVal(''); setDividendAddActive(false); } }} style={{ flex: 1, padding: '0.4rem 0.5rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '3px', color: T.textPrimary, fontSize: '0.8rem' }} />
                                                <input type="date" value={dividendAddDate} onChange={(e) => setDividendAddDate(e.target.value)} style={{ flex: 1, padding: '0.4rem 0.5rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '3px', color: T.textPrimary, fontSize: '0.8rem' }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                <button onClick={() => { if (dividendAddVal && dividendAddDate) handleAddDividendEntry(dividendAddVal, dividendAddDate); }} disabled={!dividendAddVal || !dividendAddDate} style={{ flex: 1, padding: '0.35rem', background: (!dividendAddVal || !dividendAddDate) ? T.borderStrong : T.green, color: (!dividendAddVal || !dividendAddDate) ? T.textMuted : T.pageBg, border: 'none', borderRadius: '3px', cursor: (!dividendAddVal || !dividendAddDate) ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>✓ Save Entry</button>
                                                <button onClick={() => { setDividendAddVal(''); setDividendAddActive(false); }} style={{ padding: '0.35rem 0.6rem', background: T.red, color: isDark ? T.pageBg : '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>✕</button>
                                            </div>
                                        </div>
                                    )}
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
                                        <ScreenshotSection {...props} fileInputRef={screenshotFileEditRef} />
                                    )}
                                </div>
                            </div>
                            
                            {editingTrade && ((editingTrade.partialExits || []).length > 0 || (editingTrade.partialAdds || []).length > 0 || (editingTrade.dividendEntries || []).length > 0) && (() => {
                                const allActivity = [
                                    ...(editingTrade.partialExits || []).map(pe => ({ ...pe, type: 'exit' })),
                                    ...(editingTrade.partialAdds || []).map(pa => ({ ...pa, type: 'add' })),
                                    ...(editingTrade.dividendEntries || []).map(de => ({ ...de, type: 'dividend' }))
                                ].sort((a, b) => new Date(a.exitDate || a.date) - new Date(b.exitDate || b.date));
                                const exitReturn = (editingTrade.partialExits || []).reduce((sum, pe) => sum + pe.profit, 0);
                                return (
                                <div style={{ background: T.panelBg, border: `1px solid ${T.borderStrong}`, borderRadius: '8px', padding: '0.6rem 0.7rem', marginTop: '1rem' }}>
                                    <div 
                                        onClick={() => setTradeActivityExpanded(!tradeActivityExpanded)}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tradeActivityExpanded ? '1rem' : '0', cursor: 'pointer', userSelect: 'none' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: T.textSecondary, textTransform: 'uppercase', fontWeight: '600' }}>Trade Activity</h4>
                                            <span style={{ fontSize: '0.9rem', color: T.textMuted, transform: tradeActivityExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
                                        </div>
                                        {(editingTrade.partialExits || []).length > 0 && (
                                            <div style={{ fontSize: '0.8rem', color: T.textSecondary }}>
                                                Realized: <span style={{ color: exitReturn >= 0 ? T.green : T.red, fontWeight: '600' }}>
                                                    {exitReturn >= 0 ? '+' : ''}${exitReturn.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {tradeActivityExpanded && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {allActivity.map((item, idx) => (
                                            item.type === 'exit' ? (
                                                <div key={item.id} style={{ background: T.surfaceBg, border: `1px solid ${item.profit >= 0 ? '#00ff8822' : '#ff444422'}`, borderRadius: '4px', padding: '0.65rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                                            <span style={{ fontSize: '0.65rem', fontWeight: '700', color: T.amber, textTransform: 'uppercase', letterSpacing: '0.06em', background: `${T.amber}22`, padding: '0.1rem 0.4rem', borderRadius: '2px' }}>Scale Out</span>
                                                            <span style={{ fontSize: '0.72rem', color: T.textMuted }}>{item.exitDate}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.83rem', color: T.textPrimary }}>
                                                            <strong>{item.qty}</strong> shares @ <strong>${item.exitPrice.toFixed(2)}</strong>
                                                            <span style={{ marginLeft: '0.6rem', color: item.profit >= 0 ? T.green : T.red, fontWeight: '600' }}>
                                                                {item.profit >= 0 ? '+' : ''}${item.profit.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                        <button onClick={() => handleEditPartialExit(item)} style={{ background: 'transparent', border: `1px solid ${T.blue}`, color: T.blue, padding: '0.35rem', borderRadius: '4px', cursor: 'pointer' }} title="Edit"><Edit size={13} /></button>
                                                        <button onClick={() => handleDeletePartialExit(item.id)} style={{ background: 'transparent', border: `1px solid ${T.red}`, color: T.red, padding: '0.35rem', borderRadius: '4px', cursor: 'pointer' }} title="Delete"><Trash2 size={13} /></button>
                                                    </div>
                                                </div>
                                            ) : item.type === 'dividend' ? (
                                                <div key={item.id} style={{ background: T.surfaceBg, border: `1px solid rgba(0,204,255,0.18)`, borderRadius: '4px', padding: '0.65rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                                            <span style={{ fontSize: '0.65rem', fontWeight: '700', color: T.blue, textTransform: 'uppercase', letterSpacing: '0.06em', background: T.blueBg, padding: '0.1rem 0.4rem', borderRadius: '2px' }}>Dividend</span>
                                                            <span style={{ fontSize: '0.72rem', color: T.textMuted }}>{item.date}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.83rem', color: T.textPrimary }}>
                                                            <strong style={{ color: T.blue }}>${item.amount.toFixed(2)}</strong>
                                                            <span style={{ marginLeft: '0.6rem', fontSize: '0.75rem', color: T.textMuted }}>dividend received</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeleteDividendEntry(item.id)} style={{ background: 'transparent', border: `1px solid ${T.red}`, color: T.red, padding: '0.35rem', borderRadius: '4px', cursor: 'pointer' }} title="Delete"><Trash2 size={13} /></button>
                                                </div>
                                            ) : (
                                                <div key={item.id} style={{ background: T.surfaceBg, border: `1px solid ${'#00ff8822'}`, borderRadius: '4px', padding: '0.65rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                                            <span style={{ fontSize: '0.65rem', fontWeight: '700', color: T.green, textTransform: 'uppercase', letterSpacing: '0.06em', background: `${T.green}22`, padding: '0.1rem 0.4rem', borderRadius: '2px' }}>Scale In</span>
                                                            <span style={{ fontSize: '0.72rem', color: T.textMuted }}>{item.date}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.83rem', color: T.textPrimary }}>
                                                            +<strong>{item.qty}</strong> shares @ <strong>${item.price.toFixed(2)}</strong>
                                                            <span style={{ marginLeft: '0.6rem', fontSize: '0.75rem', color: T.textMuted }}>avg cost adjusted</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeletePartialAdd(item.id)} style={{ background: 'transparent', border: `1px solid ${T.red}`, color: T.red, padding: '0.35rem', borderRadius: '4px', cursor: 'pointer' }} title="Delete"><Trash2 size={13} /></button>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                    )}
                                </div>
                                );
                            })()}
                            
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button onClick={handleUpdateTrade} disabled={!formData.symbol || !formData.qty || !formData.entryPrice || !formData.entryDate} style={{ flex: 1, background: (!formData.symbol || !formData.qty || !formData.entryPrice || !formData.entryDate) ? T.borderStrong : T.blue, color: (!formData.symbol || !formData.qty || !formData.entryPrice || !formData.entryDate) ? T.textMuted : T.pageBg, border: 'none', padding: '1rem', borderRadius: '4px', cursor: (!formData.symbol || !formData.qty || !formData.entryPrice || !formData.entryDate) ? 'not-allowed' : 'pointer', fontWeight: '600' }}>UPDATE TRADE</button>
                                <button onClick={() => { setEditingPartialExit(null); setPartialExitForm({ qty: '', exitPrice: '', exitDate: new Date().toISOString().split('T')[0] }); setPartialAddForm({ qty: '', price: '', date: new Date().toISOString().split('T')[0] }); setPartialType('exit'); setShowPartialExit(true); }} style={{ background: T.amber, color: T.pageBg, border: 'none', padding: '1rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>PARTIAL</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {showPartialExit && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: T.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 1001 }}>
                    <div style={{ background: T.surfaceBg, borderRadius: '8px', padding: '2rem', maxWidth: '460px', width: '100%', border: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>
                                {editingPartialExit ? 'EDIT PARTIAL EXIT' : 'PARTIAL'}
                            </h3>
                            <button onClick={() => { setShowPartialExit(false); setEditingPartialExit(null); setPartialExitForm({ qty: '', exitPrice: '', exitDate: new Date().toISOString().split('T')[0] }); setPartialAddForm({ qty: '', price: '', date: new Date().toISOString().split('T')[0] }); }} style={{ background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        {!editingPartialExit && (
                            <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', border: `1px solid ${T.borderStrong}`, borderRadius: '4px', overflow: 'hidden' }}>
                                <button onClick={() => setPartialType('exit')} style={{ flex: 1, padding: '0.6rem', background: partialType === 'exit' ? T.amber : 'transparent', color: partialType === 'exit' ? T.pageBg : T.textMuted, border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', letterSpacing: '0.05em' }}>SCALE OUT</button>
                                <button onClick={() => setPartialType('add')} style={{ flex: 1, padding: '0.6rem', background: partialType === 'add' ? T.green : 'transparent', color: partialType === 'add' ? T.pageBg : T.textMuted, border: 'none', borderLeft: `1px solid ${T.borderStrong}`, cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', letterSpacing: '0.05em' }}>SCALE IN</button>
                            </div>
                        )}

                        {(editingPartialExit || partialType === 'exit') ? (
                            <>
                                <div style={{ marginBottom: '1.25rem', color: T.textSecondary, fontSize: '0.85rem' }}>
                                    Remaining: <strong style={{ color: T.green }}>{editingTrade?.qty || 0}</strong> of {editingTrade?.originalQty || editingTrade?.qty || 0} shares
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Shares to Exit *</label>
                                    <input type="number" placeholder="10" value={partialExitForm.qty} onChange={(e) => setPartialExitForm({...partialExitForm, qty: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary }} /></div>
                                    <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Exit Price *</label>
                                    <input type="number" step="0.01" placeholder="0.00" value={partialExitForm.exitPrice} onChange={(e) => setPartialExitForm({...partialExitForm, exitPrice: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary }} /></div>
                                    <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Exit Date *</label>
                                    <input type="date" value={partialExitForm.exitDate} onChange={(e) => setPartialExitForm({...partialExitForm, exitDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary }} /></div>
                                    <button 
                                        onClick={editingPartialExit ? handleUpdatePartialExit : handleAddPartialExit} 
                                        disabled={!partialExitForm.qty || !partialExitForm.exitPrice || !partialExitForm.exitDate} 
                                        style={{ background: (!partialExitForm.qty || !partialExitForm.exitPrice || !partialExitForm.exitDate) ? T.borderStrong : T.amber, color: (!partialExitForm.qty || !partialExitForm.exitPrice || !partialExitForm.exitDate) ? T.textMuted : T.pageBg, border: 'none', padding: '1rem', borderRadius: '4px', cursor: (!partialExitForm.qty || !partialExitForm.exitPrice || !partialExitForm.exitDate) ? 'not-allowed' : 'pointer', fontWeight: '600', marginTop: '0.5rem' }}
                                    >
                                        {editingPartialExit ? 'UPDATE PARTIAL EXIT' : 'ADD PARTIAL EXIT'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ marginBottom: '1.25rem', color: T.textSecondary, fontSize: '0.85rem' }}>
                                    Current: <strong style={{ color: T.blue }}>{editingTrade?.qty || 0}</strong> shares @ <strong style={{ color: T.blue }}>${parseFloat((editingTrade?.entryPrice || 0).toFixed(4))}</strong> avg cost
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Shares to Add *</label>
                                    <input type="number" placeholder="50" value={partialAddForm.qty} onChange={(e) => setPartialAddForm({...partialAddForm, qty: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary }} /></div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Price Per Share *</label>
                                        <input type="number" step="0.01" placeholder="0.00" value={partialAddForm.price} onChange={(e) => setPartialAddForm({...partialAddForm, price: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary }} />
                                        {partialAddForm.qty && partialAddForm.price && editingTrade && (
                                            <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: T.textMuted }}>
                                                New avg cost: <strong style={{ color: T.blue }}>
                                                    ${parseFloat((((editingTrade.qty * editingTrade.entryPrice) + (parseFloat(partialAddForm.qty) * parseFloat(partialAddForm.price))) / (editingTrade.qty + parseFloat(partialAddForm.qty))).toFixed(4))}
                                                </strong> · New qty: <strong style={{ color: T.blue }}>{editingTrade.qty + parseFloat(partialAddForm.qty)}</strong>
                                            </div>
                                        )}
                                    </div>
                                    <div><label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600' }}>Date *</label>
                                    <input type="date" value={partialAddForm.date} onChange={(e) => setPartialAddForm({...partialAddForm, date: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: T.panelBg, border: `1px solid ${T.borderMid}`, borderRadius: '4px', color: T.textPrimary }} /></div>
                                    <button 
                                        onClick={handleAddPartialAdd}
                                        disabled={!partialAddForm.qty || !partialAddForm.price || !partialAddForm.date}
                                        style={{ background: (!partialAddForm.qty || !partialAddForm.price || !partialAddForm.date) ? T.borderStrong : T.green, color: (!partialAddForm.qty || !partialAddForm.price || !partialAddForm.date) ? T.textMuted : T.pageBg, border: 'none', padding: '1rem', borderRadius: '4px', cursor: (!partialAddForm.qty || !partialAddForm.price || !partialAddForm.date) ? 'not-allowed' : 'pointer', fontWeight: '600', marginTop: '0.5rem' }}
                                    >
                                        ADD TO POSITION
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            
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
                            <strong>Optional:</strong> Name, Exit Date, Total Chg, Fees, Total Profit, Log<br/><br/>
                            <em style={{ fontSize: '0.85rem', color: T.textMuted }}>Note: If no exit price is provided, it will be calculated from Total Chg</em>
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
        <SharedModals {...props} />
        <Lightbox {...props} />
        </div>
    );
}
