// Stats tab — moved out of App.jsx.

import React from 'react';
import { getEffectiveProfit, getTotalProfit } from '../utils/tradeMath';
import SharedModals from '../components/SharedModals';
import Sidebar from '../components/Sidebar';
import TagPerformanceChart from '../components/TagPerformanceChart';

export default function StatsView(props) {
    const {
        T, activeBalances, allPortfolioTrades, beThreshold, beType, isCAD, isDark, portfolioViewMode,
        portfolios, setPortfolioViewMode, setStatsDistMonth, setStatsDistYear, setStatsMenuOpen,
        setStatsTrackerYear, setView, statsDistMonth, statsDistYear, statsMenuOpen, statsTrackerYear, trades,
    } = props;

    const statsTrades = portfolioViewMode === 'all' && portfolios.length > 1 ? allPortfolioTrades : trades;
    const closedTrades = statsTrades.filter(t => t.exitDate);
    const getBeThresholdForTrade = (t) => {
        if (beType === '%') {
            const costBasis = (t.entryPrice || 0) * (t.originalQty || t.qty || 0);
            return costBasis > 0 ? (beThreshold / 100) * costBasis : 0;
        }
        return beThreshold;
    };
    const winningTrades = closedTrades.filter(t => getTotalProfit(t) > getBeThresholdForTrade(t));
    const losingTrades  = closedTrades.filter(t => getTotalProfit(t) < -getBeThresholdForTrade(t));
    const totalWins   = winningTrades.length;
    const totalLosses = losingTrades.length;
    const totalClosed = closedTrades.length;
    const avgWin  = totalWins   > 0 ? winningTrades.reduce((s, t) => s + getTotalProfit(t), 0) / totalWins   : 0;
    const avgLoss = totalLosses > 0 ? losingTrades.reduce((s, t)  => s + getTotalProfit(t), 0) / totalLosses : 0;
    const plRatio = totalLosses > 0 && avgLoss !== 0 ? avgWin / Math.abs(avgLoss) : null;

    // Max consecutive wins & losses
    const sortedClosed = [...closedTrades].sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate));
    let maxConsecWins = 0, maxConsecLosses = 0, curW = 0, curL = 0;
    sortedClosed.forEach(t => {
        const p = getTotalProfit(t);
        if (p > getBeThresholdForTrade(t))       { curW++; curL = 0; if (curW > maxConsecWins)   maxConsecWins   = curW; }
        else if (p < -getBeThresholdForTrade(t)) { curL++; curW = 0; if (curL > maxConsecLosses) maxConsecLosses = curL; }
        else                                     { curW = 0; curL = 0; }
    });

    // Avg position size
    const avgPositionSize = statsTrades.length > 0
        ? statsTrades.reduce((s, t) => s + (t.entryPrice * (t.originalQty || t.qty)), 0) / statsTrades.length
        : 0;

    // Longest hold time
    const closedWithDates = closedTrades.filter(t => t.entryDate && t.exitDate);
    const holdTimes = closedWithDates.map(t => Math.max(0, (new Date(t.exitDate) - new Date(t.entryDate)) / (1000 * 60 * 60 * 24)));
    const longestHold = holdTimes.length > 0 ? Math.round(Math.max(...holdTimes)) : null;
    const longestHoldTrade = holdTimes.length > 0 ? closedWithDates[holdTimes.indexOf(Math.max(...holdTimes))] : null;

    // Profit Factor
    const grossProfit = winningTrades.reduce((s, t) => s + getTotalProfit(t), 0);
    const grossLoss = Math.abs(losingTrades.reduce((s, t) => s + getTotalProfit(t), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;

    // Avg hold time for winners vs losers
    const winnersWithDates = winningTrades.filter(t => t.entryDate && t.exitDate);
    const avgHoldWinners = winnersWithDates.length > 0
        ? Math.round(winnersWithDates.reduce((s, t) => s + (new Date(t.exitDate) - new Date(t.entryDate)) / (1000*60*60*24), 0) / winnersWithDates.length)
        : null;
    const losersWithDates = losingTrades.filter(t => t.entryDate && t.exitDate);
    const avgHoldLosers = losersWithDates.length > 0
        ? Math.round(losersWithDates.reduce((s, t) => s + (new Date(t.exitDate) - new Date(t.entryDate)) / (1000*60*60*24), 0) / losersWithDates.length)
        : null;

    // Maximum Drawdown — build a complete dated event list matching the equity chart
    // (full closes + partial exits + dividends) then run peak/drawdown over it
    const ddEvents = [];
    closedTrades.forEach(t => {
        if (t.exitDate) ddEvents.push({ date: t.exitDate, profit: getEffectiveProfit(t) });
        if (t.partialExits && t.partialExits.length > 0) {
            t.partialExits.forEach(pe => { if (pe.exitDate) ddEvents.push({ date: pe.exitDate, profit: pe.profit }); });
        }
        if (t.dividendEntries && t.dividendEntries.length > 0) {
            t.dividendEntries.forEach(de => { if (de.date) ddEvents.push({ date: de.date, profit: de.amount }); });
        } else if (t.dividend && t.exitDate) {
            ddEvents.push({ date: t.exitDate, profit: t.dividend });
        }
    });
    ddEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    let eqPeak = 0, maxDDDollar = 0, maxDDPct = 0, runningEq = 0;
    ddEvents.forEach(ev => {
        runningEq += ev.profit;
        if (runningEq > eqPeak) eqPeak = runningEq;
        const ddDollar = eqPeak - runningEq;
        if (ddDollar > maxDDDollar) {
            maxDDDollar = ddDollar;
            maxDDPct = eqPeak > 0 ? (ddDollar / eqPeak) * 100 : 0;
        }
    });

    // Return on Capital — profit vs starting balance, matching the dashboard % figures
    // Uses activeBalances (portfolio-mode aware) so it stays consistent with the dashboard
    let usdClosedTrades = [], cadClosedTrades = [];
    let usdRealizedProfit = 0, cadRealizedProfit = 0;
    let usdCostBasis = 0, cadCostBasis = 0;
    let totalDividends = 0, hasDividendHistory = false;
    let rocPrimaryUsd = null, rocPrimaryCAD = null, rocPrimary = null;
    try {
        usdClosedTrades = closedTrades.filter(t => t.symbol && !isCAD(t.symbol));
        cadClosedTrades = closedTrades.filter(t => t.symbol && isCAD(t.symbol));
        usdCostBasis = usdClosedTrades.reduce((s, t) => s + (t.entryPrice * (t.originalQty || t.qty)), 0);
        cadCostBasis = cadClosedTrades.reduce((s, t) => s + (t.entryPrice * (t.originalQty || t.qty)), 0);
        usdRealizedProfit = usdClosedTrades.reduce((s, t) => s + (getTotalProfit(t) || 0), 0);
        cadRealizedProfit = cadClosedTrades.reduce((s, t) => s + (getTotalProfit(t) || 0), 0);
        const usdDepositsDenom = (activeBalances.depositsUsd || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
        const cadDepositsDenom = (activeBalances.depositsCad || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
        const usdStartBal = parseFloat(activeBalances.usd) + (activeBalances.mode === 'current' ? usdDepositsDenom : 0);
        const cadStartBal = parseFloat(activeBalances.cad) + (activeBalances.mode === 'current' ? cadDepositsDenom : 0);
        const allUsdTrades = statsTrades.filter(t => t.symbol && !isCAD(t.symbol));
        const allCadTrades = statsTrades.filter(t => t.symbol && isCAD(t.symbol));
        const calcProfit = (tradeList) => tradeList.reduce((sum, t) => {
            const capitalGains = t.exitDate ? getTotalProfit(t) : ((t.partialExits && t.partialExits.length > 0) ? t.partialExits.reduce((s, pe) => s + (pe.profit || 0), 0) : 0);
            const dividends = t.dividendEntries && t.dividendEntries.length > 0 ? t.dividendEntries.reduce((s, e) => s + e.amount, 0) : (t.dividend || 0);
            return sum + capitalGains + dividends;
        }, 0);
        const usdTotalProfit = calcProfit(allUsdTrades);
        const cadTotalProfit = calcProfit(allCadTrades);
        const usdDivs = allUsdTrades.reduce((s, t) => s + (t.dividendEntries && t.dividendEntries.length > 0 ? t.dividendEntries.reduce((ds, e) => ds + e.amount, 0) : (t.dividend || 0)), 0);
        const cadDivs = allCadTrades.reduce((s, t) => s + (t.dividendEntries && t.dividendEntries.length > 0 ? t.dividendEntries.reduce((ds, e) => ds + e.amount, 0) : (t.dividend || 0)), 0);
        totalDividends = usdDivs + cadDivs;
        hasDividendHistory = totalDividends > 0;
        rocPrimaryUsd = (!isNaN(usdStartBal) && usdStartBal > 0) ? (usdTotalProfit / usdStartBal) * 100 : null;
        rocPrimaryCAD = (!isNaN(cadStartBal) && cadStartBal > 0) ? (cadTotalProfit / cadStartBal) * 100 : null;
        rocPrimary    = rocPrimaryUsd ?? rocPrimaryCAD;
    } catch(e) { console.error('ROC calc error:', e); }

    // ── Performance Score (computed once, used in header) ──

    // Recency weighting — 2-year half-life so recent trades matter more
    // but older trades are never fully ignored, just gradually discounted
    const _psNow = Date.now();
    const _psDecay = (t) => {
        const exitMs = t.exitDate ? new Date(t.exitDate).getTime() : _psNow;
        const daysAgo = (_psNow - exitMs) / (1000 * 60 * 60 * 24);
        return Math.exp(-0.693 * daysAgo / 730); // half-life = 730 days
    };

    // Recency-weighted win/loss sums — used for score only, not displayed cards
    const _psWinW    = winningTrades.reduce((s, t) => s + _psDecay(t), 0);
    const _psLossW   = losingTrades.reduce((s, t) => s + _psDecay(t), 0);
    const _psTotalW  = _psWinW + _psLossW;
    const _psWinRate = _psTotalW > 0 ? (_psWinW / _psTotalW) * 100 : null;
    const _psAvgWinR = _psWinW > 0 ? winningTrades.reduce((s, t) => s + getTotalProfit(t) * _psDecay(t), 0) / _psWinW : 0;
    const _psAvgLossR = _psLossW > 0 ? losingTrades.reduce((s, t) => s + getTotalProfit(t) * _psDecay(t), 0) / _psLossW : 0;
    const _psGrossProfitR = winningTrades.reduce((s, t) => s + getTotalProfit(t) * _psDecay(t), 0);
    const _psGrossLossR   = Math.abs(losingTrades.reduce((s, t) => s + getTotalProfit(t) * _psDecay(t), 0));
    const _psProfitFactorR = _psGrossLossR > 0 ? _psGrossProfitR / _psGrossLossR : null;
    const _psPlRatioR      = _psLossW > 0 && _psAvgLossR !== 0 ? _psAvgWinR / Math.abs(_psAvgLossR) : null;
    const _psExpectancy    = _psWinRate !== null ? ((_psWinRate / 100) * _psAvgWinR) + ((1 - _psWinRate / 100) * _psAvgLossR) : null;
    const _psAvgPos = statsTrades.length > 0 ? statsTrades.reduce((s, t) => s + (t.entryPrice * (t.originalQty || t.qty)), 0) / statsTrades.length : 0;
    const _psExpPct = (_psExpectancy !== null && _psAvgPos > 0) ? (_psExpectancy / _psAvgPos) * 100 : null;

    // Scoring curves — floors softened slightly for amateur traders
    // but upper ranges unchanged so good performance is still rewarded
    const _psScorePF  = _psProfitFactorR === null ? null
        : _psProfitFactorR >= 2.5 ? 100
        : _psProfitFactorR >= 2.0 ? 82 + ((_psProfitFactorR - 2.0) / 0.5) * 18
        : _psProfitFactorR >= 1.5 ? 60 + ((_psProfitFactorR - 1.5) / 0.5) * 22
        : _psProfitFactorR >= 1.25 ? 32 + ((_psProfitFactorR - 1.25) / 0.25) * 28
        : _psProfitFactorR >= 1.0  ? 12 + ((_psProfitFactorR - 1.0)  / 0.25) * 20
        : Math.max(0, _psProfitFactorR * 12);

    const _psScoreExp = _psExpPct === null ? null
        : _psExpPct >= 3   ? 100
        : _psExpPct >= 1   ? 75 + ((_psExpPct - 1) / 2) * 25
        : _psExpPct >= 0   ? 10 + (_psExpPct * 30)
        : Math.max(0, 10 + _psExpPct * 3);

    const _psScoreDD  = maxDDPct === 0 ? 100
        : maxDDPct <= 10  ? 85 + ((10  - maxDDPct) / 10)  * 15
        : maxDDPct <= 20  ? 70 + ((20  - maxDDPct) / 10)  * 15
        : maxDDPct <= 35  ? 50 + ((35  - maxDDPct) / 15)  * 20
        : maxDDPct <= 50  ? 25 + ((50  - maxDDPct) / 15)  * 25
        : maxDDPct <= 60  ? Math.max(0, 25 - ((maxDDPct - 50) / 10) * 25)
        : 0;

    const _psScoreWR  = _psWinRate === null ? null
        : _psWinRate >= 70 ? 100
        : _psWinRate >= 55 ? 65 + ((_psWinRate - 55) / 15) * 35
        : _psWinRate >= 45 ? 30 + ((_psWinRate - 45) / 10) * 25
        : _psWinRate >= 35 ? 15 + ((_psWinRate - 35) / 10) * 15
        : Math.max(0, _psWinRate * 0.43);

    const _psScorePLR = _psPlRatioR === null ? null
        : _psPlRatioR >= 3   ? 100
        : _psPlRatioR >= 2   ? 80 + ((_psPlRatioR - 2)   / 1)   * 20
        : _psPlRatioR >= 1.5 ? 60 + ((_psPlRatioR - 1.5) / 0.5) * 20
        : _psPlRatioR >= 1.0 ? 28 + ((_psPlRatioR - 1.0) / 0.5) * 32
        : Math.max(0, _psPlRatioR * 28);

    const _psScoreWRPLR = (_psScoreWR !== null && _psScorePLR !== null) ? (_psScoreWR + _psScorePLR) / 2 : (_psScoreWR ?? _psScorePLR);

    // CAGR — uses rocPrimaryUsd/CAD (profit/startingBalance %) already computed above,
    // annualised from earliest trade date to today. Fully independent of dashboard timeframe.
    const calcCagr = (pct, yrs) => (!yrs || yrs < 0.5 || pct === null) ? null : (Math.pow(1 + pct/100, 1/yrs) - 1) * 100;
    const allTradeDates = statsTrades.filter(t => t.entryDate).map(t => t.entryDate);
    const earliestDate  = allTradeDates.length > 0 ? allTradeDates.reduce((a, b) => a < b ? a : b) : null;
    const yearsTotal    = earliestDate ? (new Date() - new Date(earliestDate)) / (1000*60*60*24*365.25) : null;
    const usdCagr = calcCagr(rocPrimaryUsd, yearsTotal);
    const cadCagr = calcCagr(rocPrimaryCAD, yearsTotal);
    const hasCagr = usdCagr !== null || cadCagr !== null;

    const totalRealizedProfit = usdRealizedProfit + cadRealizedProfit;
    const recoveryFactor = maxDDDollar > 0 ? totalRealizedProfit / maxDDDollar : null;
    const _psScoreRF = recoveryFactor === null ? 100
        : recoveryFactor >= 5 ? 100
        : recoveryFactor >= 3 ? 80 + ((recoveryFactor - 3) / 2) * 20
        : recoveryFactor >= 2 ? 65 + ((recoveryFactor - 2) / 1) * 15
        : recoveryFactor >= 1 ? 40 + ((recoveryFactor - 1) / 1) * 25
        : Math.max(0, recoveryFactor * 40);
    const _psComponents = [
        { score: _psScorePF,    weight: 0.275, label: 'Profit Factor',        value: _psProfitFactorR !== null ? _psProfitFactorR.toFixed(2) + ' (wt)' : null },
        { score: _psScoreExp,   weight: 0.275, label: 'Expectancy',            value: _psExpectancy !== null ? (_psExpectancy >= 0 ? '+' : '') + '$' + Math.abs(_psExpectancy).toFixed(2) + ' (wt)' : null },
        { score: _psScoreDD,    weight: 0.10,  label: 'Max Drawdown',          value: maxDDPct > 0 ? maxDDPct.toFixed(1) + '% of peak' : '0%' },
        { score: _psScoreRF,    weight: 0.10,  label: 'Recovery Factor',       value: recoveryFactor !== null ? recoveryFactor.toFixed(2) + 'x' : 'No DD' },
        { score: _psScoreWRPLR, weight: 0.25,  label: 'Win Rate + P/L Ratio',  value: _psWinRate !== null ? _psWinRate.toFixed(1) + '% / ' + (_psPlRatioR !== null ? _psPlRatioR.toFixed(2) : '—') + ' (wt)' : null },
    ].filter(c => c.score !== null);
    const _psTotalWeight = _psComponents.reduce((s, c) => s + c.weight, 0);
    const perfScore = (_psTotalWeight > 0 && totalClosed >= 10) ? Math.round(_psComponents.reduce((s, c) => s + c.score * c.weight, 0) / _psTotalWeight) : null;
    const perfScoreColor = perfScore === null ? null : perfScore >= 70 ? T.green : perfScore >= 50 ? T.amber : T.red;
    const perfScoreLabel = perfScore === null ? null : perfScore >= 80 ? 'Excellent' : perfScore >= 70 ? 'Good' : perfScore >= 55 ? 'Average' : perfScore >= 40 ? 'Weak' : 'Poor';
    const perfScoreTooltip = perfScore === null ? '' : [
        'PERFORMANCE SCORE METHODOLOGY',
        '────────────────────────────',
        ..._psComponents.map(c => `${c.label.padEnd(22)} ${Math.round(c.weight * 100)}%  →  ${Math.round(c.score)}/100${c.value ? '  (' + c.value + ')' : ''}`),
        '────────────────────────────',
        `Weighted total: ${perfScore}/100`,
        totalClosed < 30 ? '⚠ Low sample size — score less reliable' : ''
    ].filter(Boolean).join('\n');

    // Day of week stats
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayStats = Array.from({ length: 7 }, () => ({ pl: 0, count: 0 }));
    closedTrades.forEach(t => {
        if (!t.exitDate) return;
        const dow = new Date(t.exitDate + 'T12:00:00').getDay();
        dayStats[dow].pl    += getEffectiveProfit(t);
        dayStats[dow].count += 1;
    });
    const activeDays = dayStats.filter(d => d.count > 0);
    const maxAbsDayPL = activeDays.reduce((m, d) => Math.max(m, Math.abs(d.pl)), 1);

    // Monthly P/L data — build both versions
    const monthlyMap = {};
    const monthlyMapWithDivs = {};
    closedTrades.forEach(t => {
        if (!t.exitDate) return;
        const k = t.exitDate.substring(0, 7);
        const profit = getEffectiveProfit(t);
        const divs = t.dividendEntries && t.dividendEntries.length > 0
            ? t.dividendEntries.reduce((s, e) => s + e.amount, 0)
            : (t.dividend || 0);
        monthlyMap[k] = (monthlyMap[k] || 0) + profit;
        monthlyMapWithDivs[k] = (monthlyMapWithDivs[k] || 0) + profit + divs;
    });
    // Also bucket open trade dividends by their payment date
    statsTrades.filter(t => !t.exitDate).forEach(t => {
        (t.dividendEntries || []).forEach(e => {
            if (e.date && e.amount) {
                const k = e.date.substring(0, 7);
                monthlyMapWithDivs[k] = (monthlyMapWithDivs[k] || 0) + e.amount;
            }
        });
        if ((!t.dividendEntries || t.dividendEntries.length === 0) && t.dividend && t.entryDate) {
            const k = t.entryDate.substring(0, 7);
            monthlyMapWithDivs[k] = (monthlyMapWithDivs[k] || 0) + t.dividend;
        }
    });
    const sortedMonthKeys = Object.keys({ ...monthlyMap, ...monthlyMapWithDivs }).sort();
    const monthLabels = sortedMonthKeys.map(k => {
        const [y, m] = k.split('-');
        return new Date(parseInt(y), parseInt(m) - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
    });
    const monthValuesBase = sortedMonthKeys.map(k => parseFloat((monthlyMap[k] || 0).toFixed(2)));
    const monthValuesWithDivs = sortedMonthKeys.map(k => parseFloat((monthlyMapWithDivs[k] || 0).toFixed(2)));

    const fmtFull = n => (n >= 0 ? '+' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtSize = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });


    // Monthly chart with dividend toggle
    const MonthlyChartComponent = () => {
        const canvasRef = React.useRef(null);
        const chartRef  = React.useRef(null);
        const [includeDivs, setIncludeDivs] = React.useState(true);
        const [menuOpen, setMenuOpen] = React.useState(false);
        const monthValues = includeDivs ? monthValuesWithDivs : monthValuesBase;

        React.useEffect(() => {
            if (!canvasRef.current || !window.Chart) return;
            if (chartRef.current) chartRef.current.destroy();
            const greenColor  = isDark ? '#00ff88' : '#059669';
            const redColor    = isDark ? '#ff4444' : '#dc2626';
            const gridColor   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
            const labelColor  = isDark ? '#888' : '#666';
            chartRef.current = new window.Chart(canvasRef.current, {
                type: 'bar',
                data: {
                    labels: monthLabels,
                    datasets: [{
                        data: monthValues,
                        backgroundColor: monthValues.map(v => v >= 0
                            ? (isDark ? 'rgba(0,255,136,0.75)' : 'rgba(5,150,105,0.75)')
                            : (isDark ? 'rgba(255,68,68,0.75)'  : 'rgba(220,38,38,0.75)')),
                        borderColor: monthValues.map(v => v >= 0 ? greenColor : redColor),
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: isDark ? '#1a1a1a' : '#fff',
                            borderColor: isDark ? '#333' : '#e5e7eb',
                            borderWidth: 1,
                            titleColor: isDark ? '#aaa' : '#666',
                            bodyColor: isDark ? '#fff' : '#111',
                            callbacks: { label: ctx => fmtFull(ctx.parsed.y) }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: gridColor },
                            ticks: { color: labelColor, font: { family: 'DM Mono', size: 11 } }
                        },
                        y: {
                            grid: { color: gridColor },
                            ticks: {
                                color: labelColor,
                                font: { family: 'DM Mono', size: 11 },
                                callback: v => '$' + (Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v)
                            }
                        }
                    }
                }
            });
            return () => { if (chartRef.current) chartRef.current.destroy(); };
        }, [isDark, includeDivs]);

        return (
            <div>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: T.textMuted, textTransform: 'uppercase', fontWeight: '600' }}>
                        Monthly P/L{includeDivs ? <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: T.textFaint, marginLeft: '0.5rem', fontWeight: '300' }}>incl. dividends</span> : null}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setMenuOpen(o => !o)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: '1rem', padding: '2px 6px', borderRadius: '4px', lineHeight: 1, letterSpacing: '0.1em', transition: 'color 0.15s, background 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = T.textPrimary; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = 'transparent'; }}
                        >···</button>
                        {menuOpen && (
                            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: T.panelBg, border: `1px solid ${T.border}`, borderRadius: '7px', padding: '6px', zIndex: 50, minWidth: '180px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                                onMouseLeave={() => setMenuOpen(false)}>
                                <div style={{ fontSize: '0.6rem', color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 8px 8px', borderBottom: `1px solid ${T.border}`, marginBottom: '4px' }}>Chart Settings</div>
                                <button
                                    onClick={() => { setIncludeDivs(v => !v); setMenuOpen(false); }}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '7px 8px', borderRadius: '5px', color: T.textPrimary, fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', transition: 'background 0.12s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <span>Include Dividends</span>
                                    <span style={{ width: '28px', height: '16px', borderRadius: '99px', background: includeDivs ? T.green : T.border, display: 'inline-flex', alignItems: 'center', padding: '2px', transition: 'background 0.2s', flexShrink: 0 }}>
                                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fff', transform: includeDivs ? 'translateX(12px)' : 'translateX(0)', transition: 'transform 0.2s', display: 'block' }} />
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {window.Chart ? (
                    <div style={{ height: '200px', position: 'relative' }}>
                        <canvas ref={canvasRef} />
                    </div>
                ) : (
                    <div style={{ color: T.textMuted, fontSize: '0.85rem' }}>Chart library not loaded. Try refreshing.</div>
                )}
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2rem', background: T.pageBg, color: T.textPrimary, marginLeft: '220px' }}>
            <Sidebar {...props} />
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <button onClick={() => setView('dashboard')} title="Back to Dashboard" style={{ background: T.green, border: 'none', padding: '0', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', flexShrink: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        </button>
                        <div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Analytics</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', letterSpacing: '0.02em', color: T.textPrimary, lineHeight: 1 }}>Stats</div>
                        </div>
                        {/* 3-dots settings menu */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setStatsMenuOpen(o => !o)}
                                title="Portfolio view"
                                style={{ background: 'transparent', border: `1px solid ${statsMenuOpen ? T.borderStrong : T.border}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', flexShrink: 0, color: T.textMuted, transition: 'border-color 0.15s, background 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = statsMenuOpen ? T.borderStrong : T.border; e.currentTarget.style.background = 'transparent'; }}
                            >
                                <svg width="13" height="13" viewBox="0 0 4 16" fill="currentColor">
                                    <circle cx="2" cy="2" r="1.5"/>
                                    <circle cx="2" cy="8" r="1.5"/>
                                    <circle cx="2" cy="14" r="1.5"/>
                                </svg>
                            </button>
                            {statsMenuOpen && (
                                <>
                                    <div onClick={() => setStatsMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 200, background: isDark ? '#1a1f2e' : '#fff', border: `1px solid ${T.borderStrong}`, borderRadius: '8px', boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.12)', minWidth: '180px', overflow: 'hidden', padding: '4px' }}>
                                        <div style={{ fontSize: '0.6rem', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textFaint, padding: '6px 10px 4px', fontWeight: '600' }}>Portfolio View</div>
                                        {[
                                            { key: 'selected', label: 'Selected Portfolio', desc: 'Current portfolio only' },
                                            ...(portfolios.length > 1 ? [{ key: 'all', label: 'All Portfolios', desc: 'Combined across all' }] : [])
                                        ].map(opt => {
                                            const isActive = portfolioViewMode === opt.key;
                                            return (
                                                <button key={opt.key} onClick={() => { setPortfolioViewMode(opt.key); setStatsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 10px', background: isActive ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : 'transparent', border: 'none', borderRadius: '5px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
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
                    </div>
                    {perfScore !== null && (() => {
                        const size = 90, stroke = 7, r = (size / 2) - stroke, cx = size / 2, cy = size / 2;
                        const circumference = 2 * Math.PI * r;
                        const filled = circumference * (perfScore / 100);
                        const gap = circumference - filled;
                        return (
                            <div className="perf-score-tip-wrap" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', cursor: 'default' }}>
                                <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
                                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                                        <circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} strokeWidth={stroke} />
                                        <circle cx={cx} cy={cy} r={r} fill="none" stroke={perfScoreColor} strokeWidth={stroke} strokeLinecap="round"
                                            strokeDasharray={`${filled} ${gap}`}
                                            strokeDashoffset={circumference * 0.25}
                                            style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                                    </svg>
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '1.3rem', fontWeight: '800', color: perfScoreColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1 }}>{perfScore}</span>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: perfScoreColor, letterSpacing: '0.01em', lineHeight: 1 }}>{perfScoreLabel}</div>
                                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '5px' }}>Performance Score</div>
                                    {totalClosed < 30 && <div style={{ fontSize: '0.6rem', color: T.amber, fontFamily: "'DM Mono', monospace", marginTop: '3px' }}>⚠ low sample</div>}
                                </div>
                                <div className="perf-score-tip" style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: isDark ? '#111' : '#fff', border: `1px solid ${T.borderStrong}`, borderRadius: '8px', padding: '10px 14px', fontSize: '0.65rem', fontFamily: "'DM Mono', monospace", fontWeight: '400', color: T.textSecondary, whiteSpace: 'pre', pointerEvents: 'none', zIndex: 200, boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.7)' : '0 8px 32px rgba(0,0,0,0.15)', lineHeight: 1.7, letterSpacing: '0.02em', minWidth: '360px', opacity: 0, transition: 'opacity 0.15s' }}>
                                    {perfScoreTooltip}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {totalClosed === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem 2rem', background: T.panelBg, borderRadius: '8px', border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.75rem' }}>No closed trades yet</div>
                        <div style={{ color: T.textMuted, fontSize: '0.9rem' }}>Close some trades to see your stats here.</div>
                    </div>
                ) : (
                    <>
                        {/* KPI cards */}
                        {(() => {
                            const tipStyle = { position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: isDark ? '#111' : '#fff', border: `1px solid ${T.borderStrong}`, borderRadius: '6px', padding: '6px 10px', fontSize: '0.68rem', fontFamily: "'DM Mono', monospace", fontWeight: '300', color: T.textSecondary, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 100, boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.12)', letterSpacing: '0.01em', lineHeight: 1.4 };
                            const Card = ({ tip, style, children }) => {
                                const [hovered, setHovered] = React.useState(false);
                                return (
                                    <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1rem 1.2rem', border: `1px solid ${T.border}`, position: 'relative', overflow: 'visible', ...style }}
                                        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
                                        {hovered && tip && <div style={tipStyle}>{tip}</div>}
                                        {children}
                                    </div>
                                );
                            };
                            const Label = ({ children }) => <div style={{ fontSize: '0.72rem', color: T.textMuted, marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>{children}</div>;
                            const expectancy = totalWins + totalLosses > 0 ? ((totalWins / (totalWins + totalLosses)) * avgWin) + ((totalLosses / (totalWins + totalLosses)) * avgLoss) : null;
                            const expColor = expectancy === null ? T.textMuted : expectancy >= 0 ? T.green : T.red;
                            const best  = totalWins   > 0 ? winningTrades.reduce((a, t) => getEffectiveProfit(t) > getEffectiveProfit(a) ? t : a) : null;
                            const worst = totalLosses > 0 ? losingTrades.reduce((a, t)  => getEffectiveProfit(t) < getEffectiveProfit(a) ? t : a) : null;

                            // Largest % Win & Loss
                            const largestPctWin = winningTrades.length > 0 ? winningTrades.reduce((a, t) => {
                                const pct = t.entryPrice > 0 ? (getEffectiveProfit(t) / (t.entryPrice * (t.originalQty || t.qty))) * 100 : 0;
                                const aPct = a.entryPrice > 0 ? (getEffectiveProfit(a) / (a.entryPrice * (a.originalQty || a.qty))) * 100 : 0;
                                return pct > aPct ? t : a;
                            }) : null;
                            const largestPctWinVal = largestPctWin && largestPctWin.entryPrice > 0 ? (getEffectiveProfit(largestPctWin) / (largestPctWin.entryPrice * (largestPctWin.originalQty || largestPctWin.qty))) * 100 : null;
                            const largestPctLoss = losingTrades.length > 0 ? losingTrades.reduce((a, t) => {
                                const pct = t.entryPrice > 0 ? (getEffectiveProfit(t) / (t.entryPrice * (t.originalQty || t.qty))) * 100 : 0;
                                const aPct = a.entryPrice > 0 ? (getEffectiveProfit(a) / (a.entryPrice * (a.originalQty || a.qty))) * 100 : 0;
                                return pct < aPct ? t : a;
                            }) : null;
                            const largestPctLossVal = largestPctLoss && largestPctLoss.entryPrice > 0 ? (getEffectiveProfit(largestPctLoss) / (largestPctLoss.entryPrice * (largestPctLoss.originalQty || largestPctLoss.qty))) * 100 : null;

                            // Most traded stock
                            const tradeCountBySymbol = {};
                            statsTrades.forEach(t => { tradeCountBySymbol[t.symbol] = (tradeCountBySymbol[t.symbol] || 0) + 1; });
                            const mostTradedSymbol = Object.keys(tradeCountBySymbol).length > 0 ? Object.keys(tradeCountBySymbol).reduce((a, b) => tradeCountBySymbol[a] > tradeCountBySymbol[b] ? a : b) : null;
                            const mostTradedCount = mostTradedSymbol ? tradeCountBySymbol[mostTradedSymbol] : null;

                            // Avg trades per month
                            const tradeMonths = closedTrades.filter(t => t.exitDate).map(t => t.exitDate.substring(0, 7));
                            const uniqueMonths = [...new Set(tradeMonths)].length;
                            const avgTradesPerMonth = uniqueMonths > 0 ? (closedTrades.length / uniqueMonths) : null;

                            const rowStyle = { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginBottom: '1rem' };
                            return (
                                <div style={{ marginBottom: '2rem' }}>

                                    {/* ── Row 1: Trade outcomes ── */}
                                    <div style={rowStyle}>

                                        <Card tip="Your single most profitable closed trade" style={{ overflow: 'hidden' }}>
                                            <Label>Best Trade</Label>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: T.green }}>{best ? fmtFull(getEffectiveProfit(best)) : '—'}</div>
                                            {best && <div style={{ fontSize: '0.82rem', fontWeight: '500', color: T.textSecondary, marginTop: '0.3rem', letterSpacing: '0.02em' }}>{best.symbol}</div>}
                                            <span style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '1rem', opacity: 0.7, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>🏆</span>
                                        </Card>

                                        <Card tip="Your single biggest losing closed trade" style={{ overflow: 'hidden' }}>
                                            <Label>Worst Trade</Label>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: T.red }}>{worst ? fmtFull(getEffectiveProfit(worst)) : '—'}</div>
                                            {worst && <div style={{ fontSize: '0.82rem', fontWeight: '500', color: T.textSecondary, marginTop: '0.3rem', letterSpacing: '0.02em' }}>{worst.symbol}</div>}
                                            <span style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '1rem', opacity: 0.7, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>🩸</span>
                                        </Card>

                                        <Card tip="Your highest % return on a single trade relative to position size">
                                            <Label>Largest % Win</Label>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: largestPctWinVal !== null ? T.green : T.textMuted }}>
                                                {largestPctWinVal !== null ? '+' + largestPctWinVal.toFixed(1) + '%' : '—'}
                                            </div>
                                            {largestPctWin && <div style={{ fontSize: '0.82rem', fontWeight: '500', color: T.textSecondary, marginTop: '0.3rem', letterSpacing: '0.02em' }}>{largestPctWin.symbol}</div>}
                                        </Card>

                                        <Card tip="Your biggest % loss on a single trade relative to position size">
                                            <Label>Largest % Loss</Label>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: largestPctLossVal !== null ? T.red : T.textMuted }}>
                                                {largestPctLossVal !== null ? largestPctLossVal.toFixed(1) + '%' : '—'}
                                            </div>
                                            {largestPctLoss && <div style={{ fontSize: '0.82rem', fontWeight: '500', color: T.textSecondary, marginTop: '0.3rem', letterSpacing: '0.02em' }}>{largestPctLoss.symbol}</div>}
                                        </Card>

                                        <Card tip="Expected average profit per trade based on your win rate and avg win/loss sizes">
                                            <Label>Expectancy</Label>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: expColor }}>
                                                {expectancy !== null ? (expectancy >= 0 ? '+' : '') + '$' + Math.abs(expectancy).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                            </div>
                                        </Card>

                                        <Card tip="The stock you have traded the most times">
                                            <Label>Most Traded</Label>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: mostTradedSymbol ? T.textPrimary : T.textMuted }}>{mostTradedSymbol || '—'}</div>
                                            {mostTradedCount && <div style={{ fontSize: '0.72rem', color: T.textMuted, marginTop: '0.25rem' }}>{mostTradedCount} trades</div>}
                                        </Card>

                                    </div>

                                    {/* ── Row 2: Risk & returns ── */}
                                    <div style={rowStyle}>

                                        <Card tip="Total gross profit ÷ total gross loss. Above 1.5 is solid; below 1.0 means you're losing money overall">
                                            <Label>Profit Factor</Label>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: profitFactor === null ? T.textMuted : profitFactor >= 1.5 ? T.green : profitFactor >= 1 ? T.amber : T.red }}>
                                                {profitFactor !== null ? profitFactor.toFixed(2) : '—'}
                                            </div>
                                            {profitFactor !== null && <div style={{ fontSize: '0.72rem', color: T.textMuted, marginTop: '0.25rem' }}>{profitFactor >= 1.5 ? 'Strong' : profitFactor >= 1 ? 'Marginal' : 'Unprofitable'}</div>}
                                        </Card>

                                        <Card tip="Average winning trade ÷ average losing trade">
                                            <Label>P/L Ratio</Label>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: plRatio !== null && plRatio >= 1 ? T.green : T.red }}>{plRatio !== null ? plRatio.toFixed(2) : '—'}</div>
                                        </Card>

                                        <Card tip="Largest peak-to-trough decline on closed trade capital gains only — dividends excluded. See the Drawdown chart below for a fuller picture that includes dividends.">
                                            <Label>Max Drawdown</Label>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: maxDDDollar > 0 ? T.red : T.textMuted }}>
                                                {maxDDDollar > 0 ? '-$' + maxDDDollar.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'}
                                            </div>
                                            {maxDDPct > 0 && <div style={{ fontSize: '0.72rem', color: T.textMuted, marginTop: '0.25rem' }}>{maxDDPct.toFixed(1)}% of peak</div>}
                                        </Card>

                                        <Card tip="Total profit (capital gains + dividends) as a % of your starting account balance — matches the return % shown on the dashboard">
                                            <Label>Return on Capital</Label>
                                            {rocPrimaryUsd !== null ? (
                                                <div style={{ fontSize: '1.6rem', fontWeight: '700', color: rocPrimaryUsd >= 0 ? T.green : T.red }}>
                                                    {(rocPrimaryUsd >= 0 ? '+' : '') + rocPrimaryUsd.toFixed(2) + '%'}
                                                </div>
                                            ) : <div style={{ fontSize: '1.6rem', fontWeight: '700', color: T.textMuted }}>—</div>}
                                            {rocPrimaryCAD !== null && (
                                                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.78rem', fontWeight: '500', color: rocPrimaryCAD >= 0 ? T.green : T.red }}>
                                                    CAD {(rocPrimaryCAD >= 0 ? '+' : '') + rocPrimaryCAD.toFixed(2) + '%'}
                                                </div>
                                            )}
                                        </Card>

                                        <Card tip="Compound annual growth rate — how much your portfolio grows per year if the pace continues">
                                            <Label>CAGR</Label>
                                            {hasCagr ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                    {usdCagr !== null && <div style={{ fontSize: '1.6rem', fontWeight: '700', color: usdCagr >= 0 ? T.green : T.red, lineHeight: 1.1 }}>{usdCagr >= 0 ? '+' : ''}{usdCagr.toFixed(2)}%</div>}
                                                    {cadCagr !== null && usdCagr !== null && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.78rem', fontWeight: '500', color: cadCagr >= 0 ? T.green : T.red }}>CAD {cadCagr >= 0 ? '+' : ''}{cadCagr.toFixed(2)}%</div>}
                                                    {cadCagr !== null && usdCagr === null && <div style={{ fontSize: '1.6rem', fontWeight: '700', color: cadCagr >= 0 ? T.green : T.red, lineHeight: 1.1 }}>{cadCagr >= 0 ? '+' : ''}{cadCagr.toFixed(2)}%</div>}
                                                </div>
                                            ) : <div style={{ fontSize: '1.6rem', fontWeight: '700', color: T.textMuted }}>—</div>}
                                        </Card>

                                        <Card tip="Average dollar value of all positions at entry">
                                            <Label>Avg Position Size</Label>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: T.textPrimary }}>{avgPositionSize > 0 ? fmtSize(avgPositionSize) : '—'}</div>
                                        </Card>

                                    </div>

                                    {/* ── Row 3: Behavioral & time ── */}
                                    <div style={rowStyle}>

                                        <Card tip="Longest winning streak without a loss">
                                            <Label>Max Consec. Wins</Label>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: T.green }}>{maxConsecWins > 0 ? maxConsecWins : '—'}</div>
                                        </Card>

                                        <Card tip="Longest losing streak without a win">
                                            <Label>Max Consec. Losses</Label>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: T.red }}>{maxConsecLosses > 0 ? maxConsecLosses : '—'}</div>
                                        </Card>

                                        <Card tip="Average days held for winning trades — shorter is faster capital recycling">
                                            <Label>Avg Hold (Winners)</Label>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: T.green }}>{avgHoldWinners !== null ? avgHoldWinners + 'd' : '—'}</div>
                                        </Card>

                                        <Card tip="Average days held for losing trades — if this is much longer than winners, you're holding losers too long">
                                            <Label>Avg Hold (Losers)</Label>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: T.red }}>{avgHoldLosers !== null ? avgHoldLosers + 'd' : '—'}</div>
                                            {avgHoldWinners !== null && avgHoldLosers !== null && avgHoldLosers > avgHoldWinners * 1.5 && (
                                                <div style={{ fontSize: '0.72rem', color: T.amber, marginTop: '0.25rem' }}>⚠ holding losers long</div>
                                            )}
                                        </Card>

                                        <Card tip="Average number of closed trades per month across your trading history">
                                            <Label>Avg Trades/Month</Label>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: avgTradesPerMonth !== null ? T.blue : T.textMuted }}>
                                                {avgTradesPerMonth !== null ? avgTradesPerMonth.toFixed(1) : '—'}
                                            </div>
                                        </Card>

                                        <Card tip={longestHoldTrade ? `${longestHoldTrade.symbol} — held from ${longestHoldTrade.entryDate} to ${longestHoldTrade.exitDate}` : 'Longest time between entry and exit'}>
                                            <Label>Longest Hold</Label>
                                            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: T.blue }}>{longestHold !== null ? longestHold + 'd' : '—'}</div>
                                            {longestHoldTrade && <div style={{ fontSize: '0.82rem', fontWeight: '500', color: T.textSecondary, marginTop: '0.3rem', letterSpacing: '0.02em' }}>{longestHoldTrade.symbol}</div>}
                                        </Card>

                                    </div>

                                </div>
                            );
                        })()}

                        {/* Monthly P/L chart */}
                        {sortedMonthKeys.length > 0 && (
                            <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}`, marginBottom: '2rem' }}>
                                <MonthlyChartComponent />
                            </div>
                        )}

                        {/* Distribution of Gains & Losses + Monthly Tracker side by side */}
                        {(() => {

                            // ── Shared year list + default ──
                            const allTradeYears = [...new Set(closedTrades.filter(t => t.exitDate).map(t => t.exitDate.substring(0,4)))].sort().reverse();
                            const currentYear   = new Date().getFullYear().toString();
                            const defaultYear   = allTradeYears.includes(currentYear) ? currentYear : (allTradeYears[0] || 'ALL');

                            const selYear  = statsDistYear    ?? defaultYear;
                            const selMonth = statsDistMonth;
                            const setSelYear  = (v) => { setStatsDistYear(v); setStatsDistMonth('ALL'); };
                            const setSelMonth = setStatsDistMonth;

                            const DistributionChart = () => {
                                const canvasRef = React.useRef(null);
                                const chartRef  = React.useRef(null);
                                const BIN_SIZE = 2;

                                // Available months for selected year
                                const availableMonths = React.useMemo(() => {
                                    const keys = [...new Set(
                                        closedTrades
                                            .filter(t => t.exitDate && (selYear === 'ALL' || t.exitDate.startsWith(selYear)))
                                            .map(t => t.exitDate.substring(5, 7))
                                    )].sort();
                                    return keys;
                                }, [selYear]);

                                // Reset month if no longer available
                                React.useEffect(() => {
                                    if (selMonth !== 'ALL' && !availableMonths.includes(selMonth)) setSelMonth('ALL');
                                }, [selYear]);

                                // Filter pcts
                                const filteredPcts = [];
                                closedTrades.forEach(t => {
                                    if (!t.exitDate) return;
                                    if (selYear  !== 'ALL' && !t.exitDate.startsWith(selYear))  return;
                                    if (selMonth !== 'ALL' && t.exitDate.substring(5,7) !== selMonth) return;
                                    const cost = (t.entryPrice || 0) * (t.originalQty || t.qty || 1);
                                    if (cost === 0) return;
                                    filteredPcts.push((getEffectiveProfit(t) / cost) * 100);
                                });

                                const sorted = [...filteredPcts].sort((a,b) => a-b);
                                const p2  = sorted[Math.floor(sorted.length * 0.02)] ?? sorted[0];
                                const p98 = sorted[Math.ceil(sorted.length  * 0.98)] ?? sorted[sorted.length - 1];
                                const clipMin = Math.floor((p2  ?? 0) / BIN_SIZE) * BIN_SIZE;
                                const clipMax = Math.ceil((p98  ?? 0) / BIN_SIZE) * BIN_SIZE;

                                const binMap = {};
                                let outliersLow = 0, outliersHigh = 0;
                                filteredPcts.forEach(pct => {
                                    if (pct < clipMin) outliersLow++;
                                    else if (pct > clipMax) outliersHigh++;
                                    const clipped = Math.max(clipMin, Math.min(clipMax, pct));
                                    const bin = Math.round(clipped / BIN_SIZE) * BIN_SIZE;
                                    binMap[bin] = (binMap[bin] || 0) + 1;
                                });
                                const bins = [];
                                for (let b = clipMin; b <= clipMax; b += BIN_SIZE) bins.push(b);
                                const counts = bins.map(b => binMap[b] || 0);
                                const labels = bins.map((b, i) => {
                                    const base = (b >= 0 ? '+' : '') + b + '%';
                                    if (i === 0 && outliersLow > 0) return base + '+';
                                    if (i === bins.length - 1 && outliersHigh > 0) return base + '+';
                                    return base;
                                });
                                const barColors  = bins.map(b => b >= 0 ? (isDark ? 'rgba(0,255,136,0.75)' : 'rgba(5,150,105,0.75)') : (isDark ? 'rgba(255,68,68,0.75)' : 'rgba(220,38,38,0.75)'));
                                const barBorders = bins.map(b => b >= 0 ? (isDark ? '#00ff88' : '#059669') : (isDark ? '#ff4444' : '#dc2626'));

                                const totalPcts  = filteredPcts.length;
                                const mean       = filteredPcts.reduce((s,v) => s+v, 0) / Math.max(totalPcts, 1);
                                const variance   = filteredPcts.reduce((s,v) => s + Math.pow(v - mean, 2), 0) / Math.max(totalPcts, 1);
                                const stdDev     = Math.sqrt(variance) || 1;
                                const maxCount   = Math.max(...counts, 1);
                                const normalCurve = bins.map(b => {
                                    const z = (b - mean) / stdDev;
                                    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z) * totalPcts * BIN_SIZE;
                                });
                                const curveMax   = Math.max(...normalCurve, 1);
                                const scaledCurve = normalCurve.map(v => v * (maxCount / curveMax) * 0.95);

                                React.useEffect(() => {
                                    if (!canvasRef.current || !window.Chart) return;
                                    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
                                    chartRef.current = new window.Chart(canvasRef.current, {
                                        type: 'bar',
                                        data: {
                                            labels,
                                            datasets: [
                                                { type: 'bar',  label: 'Trades',      data: counts,      backgroundColor: barColors, borderColor: barBorders, borderWidth: 1, borderRadius: 2, order: 2 },
                                                { type: 'line', label: 'Normal Dist.', data: scaledCurve, borderColor: isDark ? 'rgba(200,200,200,0.45)' : 'rgba(80,80,80,0.35)', borderWidth: 1.5, pointRadius: 0, fill: false, tension: 0.4, order: 1 }
                                            ]
                                        },
                                        options: {
                                            responsive: true, maintainAspectRatio: false,
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    backgroundColor: T.chartTooltipBg, borderColor: T.chartTooltipBorder, borderWidth: 1,
                                                    titleColor: T.textPrimary, bodyColor: T.textMuted,
                                                    callbacks: {
                                                        title: items => {
                                                            const lbl = items[0].label;
                                                            const idx = items[0].dataIndex;
                                                            const isLowEdge  = idx === 0 && outliersLow > 0;
                                                            const isHighEdge = idx === bins.length - 1 && outliersHigh > 0;
                                                            if (isLowEdge)  return lbl + ' bucket  (includes ' + outliersLow  + ' outlier' + (outliersLow  > 1 ? 's' : '') + ' beyond range)';
                                                            if (isHighEdge) return lbl + ' bucket  (includes ' + outliersHigh + ' outlier' + (outliersHigh > 1 ? 's' : '') + ' beyond range)';
                                                            return lbl + ' bucket';
                                                        },
                                                        label: item => item.datasetIndex === 0 ? `${item.raw} trade${item.raw !== 1 ? 's' : ''}` : null,
                                                        filter: item => item.datasetIndex === 0,
                                                    }
                                                }
                                            },
                                            scales: {
                                                x: { grid: { color: T.chartGrid }, ticks: { color: T.chartTick, font: { size: 9, family: "'DM Mono', monospace" }, maxRotation: 45, autoSkip: true, maxTicksLimit: 18 } },
                                                y: { grid: { color: T.chartGrid }, ticks: { color: T.chartTick, font: { size: 10, family: "'DM Mono', monospace" } }, title: { display: true, text: 'Trades', color: T.textMuted, font: { size: 10, family: "'DM Mono', monospace" } } }
                                            }
                                        }
                                    });
                                    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
                                }, [selYear, selMonth]);

                                const MONTH_NAMES = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' };
                                const ghostSelect = { background: 'transparent', border: 'none', outline: 'none', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', fontWeight: '600', color: T.textMuted, cursor: 'pointer', letterSpacing: '0.03em', appearance: 'none', WebkitAppearance: 'none', paddingRight: '14px', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='${isDark ? '%23666' : '%23999'}'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0px center' };

                                return (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: T.textMuted, textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>Distribution of Gains &amp; Losses</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <select value={selYear} onChange={e => { setSelYear(e.target.value); setSelMonth('ALL'); }} style={ghostSelect}>
                                                    {['ALL', ...allTradeYears].map(yr => <option key={yr} value={yr} style={{ background: T.panelBg, color: T.textPrimary }}>{yr}</option>)}
                                                </select>
                                                {selYear !== 'ALL' && (
                                                    <select value={selMonth} onChange={e => setSelMonth(e.target.value)} style={ghostSelect}>
                                                        <option value="ALL" style={{ background: T.panelBg, color: T.textPrimary }}>All months</option>
                                                        {availableMonths.map(m => <option key={m} value={m} style={{ background: T.panelBg, color: T.textPrimary }}>{MONTH_NAMES[m]}</option>)}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ height: '310px', position: 'relative' }}><canvas ref={canvasRef} /></div>
                                        <div style={{ display: 'flex', gap: '1.2rem', marginTop: '0.9rem' }}>
                                            {[['Wins', isDark ? '#00ff88' : '#059669', 'square'], ['Losses', isDark ? '#ff4444' : '#dc2626', 'square'], ['Normal dist.', isDark ? 'rgba(200,200,200,0.5)' : 'rgba(80,80,80,0.4)', 'line']].map(([label, color, type]) => (
                                                <div key={label} style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: T.textMuted, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    {type === 'square' ? <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, flexShrink: 0, display: 'inline-block' }} /> : <span style={{ width: '18px', height: '2px', background: color, flexShrink: 0, display: 'inline-block' }} />}
                                                    {label}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            };

                            const MonthlyTrackerTable = () => {
                                const selectedYear    = statsTrackerYear ?? defaultYear;
                                const setSelectedYear = setStatsTrackerYear;
                                const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
                                const filtered = closedTrades.filter(t => t.exitDate && (selectedYear === 'ALL' || t.exitDate.startsWith(selectedYear)));
                                const monthData = {};
                                filtered.forEach(t => {
                                    const mo = parseInt(t.exitDate.substring(5,7)) - 1;
                                    const cost = (t.entryPrice || 0) * (t.originalQty || t.qty || 1);
                                    if (cost === 0) return;
                                    const profit = getEffectiveProfit(t);
                                    const pct = (profit / cost) * 100;
                                    const days = (t.entryDate && t.exitDate) ? Math.max(0, Math.round((new Date(t.exitDate) - new Date(t.entryDate)) / (1000*60*60*24))) : null;
                                    if (!monthData[mo]) monthData[mo] = { wins: [], losses: [] };
                                    if (profit >= 0) monthData[mo].wins.push({ pct, days });
                                    else             monthData[mo].losses.push({ pct, days });
                                });
                                const mavg = arr => arr.length > 0 ? arr.reduce((s,v) => s+v, 0) / arr.length : null;
                                const fmtPct  = v => v === null ? '—' : Math.abs(v).toFixed(2) + '%';
                                const fmtDays = v => v === null ? '—' : Math.round(v) + 'd';
                                const tableRows = MONTHS.map((name, mo) => {
                                    const d = monthData[mo];
                                    if (!d) return null;
                                    const { wins, losses } = d;
                                    const total = wins.length + losses.length;
                                    const winPct = total > 0 ? (wins.length / total) * 100 : null;
                                    const winDays = wins.map(w => w.days).filter(x => x !== null);
                                    const lossDays = losses.map(l => l.days).filter(x => x !== null);
                                    return { name, total, winPct,
                                        avgGain: mavg(wins.map(w => w.pct)), avgLoss: mavg(losses.map(l => Math.abs(l.pct))),
                                        lgGain: wins.length > 0 ? Math.max(...wins.map(w => w.pct)) : null,
                                        lgLoss: losses.length > 0 ? Math.max(...losses.map(l => Math.abs(l.pct))) : null,
                                        avgDaysGain: mavg(winDays), avgDaysLoss: mavg(lossDays) };
                                }).filter(Boolean);
                                const mavgOf = key => mavg(tableRows.map(r => r[key]).filter(v => v !== null));
                                const tblTotal = tableRows.reduce((s,r) => s + r.total, 0);
                                const avgRow = { name: 'AVG', total: tblTotal, isAvg: true,
                                    winPct: mavgOf('winPct'), avgGain: mavgOf('avgGain'), avgLoss: mavgOf('avgLoss'),
                                    lgGain: mavgOf('lgGain'), lgLoss: mavgOf('lgLoss'),
                                    avgDaysGain: mavgOf('avgDaysGain'), avgDaysLoss: mavgOf('avgDaysLoss') };
                                const cols = [
                                    { key: 'avgGain',     label: 'AVG GAIN' },
                                    { key: 'avgLoss',     label: 'AVG LOSS' },
                                    { key: 'winPct',      label: 'WIN %'    },
                                    { key: 'total',       label: 'TRADES'   },
                                    { key: 'lgGain',      label: 'LG GAIN'  },
                                    { key: 'lgLoss',      label: 'LG LOSS'  },
                                    { key: 'avgDaysGain', label: 'AVG DAYS\u00a0GAIN' },
                                    { key: 'avgDaysLoss', label: 'AVG DAYS\u00a0LOSS' },
                                ];
                                const cellVal = (r, key) => {
                                    if (key === 'total') return r.total;
                                    if (key === 'avgDaysGain' || key === 'avgDaysLoss') return fmtDays(r[key]);
                                    if (key === 'winPct') return r[key] !== null ? r[key].toFixed(2) + '%' : '—';
                                    return fmtPct(r[key]);
                                };
                                const cellColor = (r, key) => {
                                    if (key === 'winPct' && r[key] !== null) return r[key] >= 50 ? T.green : T.red;
                                    if (key === 'avgGain' || key === 'lgGain' || key === 'avgDaysGain') return T.green;
                                    if (key === 'avgLoss' || key === 'lgLoss' || key === 'avgDaysLoss') return T.red;
                                    return T.textPrimary;
                                };
                                const thStyle = { padding: '0.55rem 0.8rem', fontSize: '0.58rem', fontWeight: '700', letterSpacing: '0.07em', color: T.textMuted, textTransform: 'uppercase', textAlign: 'right', borderBottom: `1px solid ${T.borderStrong}`, whiteSpace: 'nowrap', background: T.panelBg };
                                const tdBase  = { padding: '0.48rem 0.8rem', fontSize: '0.7rem', fontFamily: "'DM Mono', monospace", fontWeight: '500', textAlign: 'right', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' };
                                const yearOptions = ['ALL', ...allTradeYears];
                                return (
                                    <div style={{ background: T.panelBg, borderRadius: '8px', border: `1px solid ${T.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ padding: '0.85rem 1.2rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: '0.75rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: T.textMuted, textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em', flexShrink: 0 }}>Monthly Tracker</div>
                                            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', fontWeight: '600', color: T.textMuted, cursor: 'pointer', letterSpacing: '0.03em', appearance: 'none', WebkitAppearance: 'none', paddingRight: '14px', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='${isDark ? '%23666' : '%23999'}'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0px center' }}>
                                                {yearOptions.map(yr => <option key={yr} value={yr} style={{ background: T.panelBg, color: T.textPrimary }}>{yr}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ overflowY: 'auto', flex: 1 }}>
                                            {tableRows.length === 0 ? (
                                                <div style={{ padding: '2rem', textAlign: 'center', color: T.textMuted, fontSize: '0.8rem', fontFamily: "'DM Mono', monospace" }}>No trades for {selectedYear}</div>
                                            ) : (
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                        <tr>
                                                            <th style={{ ...thStyle, textAlign: 'left', paddingLeft: '1.2rem' }}></th>
                                                            {cols.map(c => <th key={c.key} style={thStyle}>{c.label}</th>)}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {[...tableRows, avgRow].map((r, i) => {
                                                            const isAvg = r.isAvg;
                                                            const rowBg = isAvg ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') : i % 2 === 0 ? T.panelBg : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)');
                                                            return (
                                                                <tr key={r.name} style={{ background: rowBg, transition: 'background 0.12s' }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = rowBg}>
                                                                    <td style={{ ...tdBase, textAlign: 'left', paddingLeft: '1.2rem', color: isAvg ? T.textSecondary : T.textPrimary, fontWeight: isAvg ? '700' : '600', letterSpacing: '0.06em', fontSize: '0.66rem', borderBottom: isAvg ? 'none' : tdBase.borderBottom, borderTop: isAvg ? `1px solid ${T.borderStrong}` : 'none' }}>{r.name}</td>
                                                                    {cols.map(c => (
                                                                        <td key={c.key} style={{ ...tdBase, color: cellColor(r, c.key), borderBottom: isAvg ? 'none' : tdBase.borderBottom, borderTop: isAvg ? `1px solid ${T.borderStrong}` : 'none', fontVariantNumeric: 'tabular-nums' }}>
                                                                            {cellVal(r, c.key)}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                );
                            };

                            if (closedTrades.length === 0) return null;

                            return (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

                                    {/* Distribution chart */}
                                    <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}` }}>
                                        {window.Chart ? <DistributionChart /> : <div style={{ color: T.textMuted, fontSize: '0.85rem' }}>Chart library not loaded.</div>}
                                    </div>

                                    {/* Monthly tracker table */}
                                    <MonthlyTrackerTable />
                                </div>
                            );
                        })()}

                        {/* Day of week + Last 20 trades side by side */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

                            {/* Day of week chart */}
                            <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}` }}>
                                <div style={{ fontSize: '0.85rem', color: T.textMuted, marginBottom: '1.5rem', textTransform: 'uppercase', fontWeight: '600' }}>Performance by Day of Week</div>
                                {activeDays.length === 0 ? (
                                    <div style={{ color: T.textMuted, fontSize: '0.85rem' }}>No data</div>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', alignItems: 'end', height: '120px', marginBottom: '0.5rem' }}>
                                            {dayStats.map((d, i) => {
                                                if (d.count === 0) return (
                                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '6px' }}>
                                                        <div style={{ width: '100%', height: '3px', borderRadius: '3px 3px 0 0', background: T.border }} />
                                                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', fontWeight: '600', color: T.textFaint }}>{dayNames[i]}</span>
                                                    </div>
                                                );
                                                const h = Math.max(4, (Math.abs(d.pl) / maxAbsDayPL) * 90);
                                                return (
                                                    <div key={i} title={`${dayNames[i]}: ${fmtFull(d.pl)} · ${d.count} trade${d.count !== 1 ? 's' : ''}`}
                                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '6px', cursor: 'default' }}>
                                                        <div style={{ width: '100%', height: h + 'px', borderRadius: '3px 3px 0 0', background: d.pl >= 0 ? T.green : T.red, opacity: 0.85, transition: 'opacity 0.15s' }}
                                                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                                            onMouseLeave={e => e.currentTarget.style.opacity = '0.85'} />
                                                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', fontWeight: '600', color: T.textSecondary }}>{dayNames[i]}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', paddingTop: '0.75rem', borderTop: `1px solid ${T.border}` }}>
                                            {dayStats.map((d, i) => (
                                                <div key={i} style={{ textAlign: 'center' }}>
                                                    {d.count > 0 ? (
                                                        <>
                                                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', fontWeight: '500', color: d.pl >= 0 ? T.green : T.red }}>{fmtFull(d.pl)}</div>
                                                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: T.textMuted, marginTop: '2px' }}>{d.count}</div>
                                                        </>
                                                    ) : (
                                                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', color: T.textFaint }}>—</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Last 20 trades */}
                            {(() => {
                                const last20 = sortedClosed.slice(-20);
                                const l20wins   = last20.filter(t => getEffectiveProfit(t) > getBeThresholdForTrade(t)).length;
                                const l20losses = last20.filter(t => getEffectiveProfit(t) < -getBeThresholdForTrade(t)).length;
                                const l20be     = last20.length - l20wins - l20losses;
                                const l20wr     = l20wins + l20losses > 0 ? (l20wins / (l20wins + l20losses)) * 100 : 0;
                                const wrColor   = l20wr >= 50 ? T.green : T.red;
                                return (
                                    <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                                        {/* Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '0.85rem', color: T.textMuted, textTransform: 'uppercase', fontWeight: '600' }}>Last 20 Trades</div>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.78rem', color: T.green, fontWeight: '300' }}>{l20wins}W</span>
                                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.78rem', color: T.red, fontWeight: '300' }}>{l20losses}L</span>
                                                {l20be > 0 && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.78rem', color: T.textMuted, fontWeight: '300' }}>{l20be}BE</span>}
                                            </div>
                                        </div>

                                        {last20.length === 0 ? (
                                            <div style={{ color: T.textMuted, fontSize: '0.85rem' }}>No closed trades yet</div>
                                        ) : (
                                            <>
                                                {/* Pill strip — all 20 in one row */}
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {last20.map((t, i) => {
                                                        const p   = getEffectiveProfit(t);
                                                        const isW = p > getBeThresholdForTrade(t);
                                                        const isL = p < -getBeThresholdForTrade(t);
                                                        const bg  = isW
                                                            ? (isDark ? 'rgba(0,255,136,0.12)' : 'rgba(5,150,105,0.1)')
                                                            : isL
                                                            ? (isDark ? 'rgba(255,68,68,0.12)'  : 'rgba(220,38,38,0.1)')
                                                            : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)');
                                                        const borderCol = isW
                                                            ? (isDark ? 'rgba(0,255,136,0.35)' : 'rgba(5,150,105,0.35)')
                                                            : isL
                                                            ? (isDark ? 'rgba(255,68,68,0.35)'  : 'rgba(220,38,38,0.35)')
                                                            : (isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.12)');
                                                        const textCol = isW ? T.green : isL ? T.red : T.textFaint;
                                                        const label   = isW ? 'W' : isL ? 'L' : 'B';
                                                        return (
                                                            <div key={t.id || i} title={`${t.symbol} · ${fmtFull(p)} · ${t.exitDate}`}
                                                                style={{ flex: 1, height: '36px', borderRadius: '5px', background: bg, border: `1px solid ${borderCol}`, cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s, background 0.15s' }}
                                                                onMouseEnter={e => { e.currentTarget.style.borderColor = isW ? T.green : isL ? T.red : T.textMuted; e.currentTarget.style.background = isW ? (isDark ? 'rgba(0,255,136,0.2)' : 'rgba(5,150,105,0.18)') : isL ? (isDark ? 'rgba(255,68,68,0.2)' : 'rgba(220,38,38,0.18)') : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'); }}
                                                                onMouseLeave={e => { e.currentTarget.style.borderColor = borderCol; e.currentTarget.style.background = bg; }}>
                                                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', fontWeight: '400', color: textCol, letterSpacing: '0.05em', userSelect: 'none' }}>{label}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Win rate row */}
                                                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '7px' }}>
                                                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.68rem', color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Win rate</span>
                                                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '1rem', fontWeight: '300', color: wrColor }}>
                                                            {l20wins + l20losses > 0 ? l20wr.toFixed(1) + '%' : '—'}
                                                        </span>
                                                    </div>
                                                    <div style={{ height: '3px', borderRadius: '99px', background: T.border, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: l20wr + '%', borderRadius: '99px', background: wrColor, transition: 'width 0.5s ease' }} />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })()}

                        </div>

                        {/* Tag Performance Chart */}
                        <TagPerformanceChart {...props} />

                        {/* Equity Curve + Drawdown charts */}
                        {(() => {
                            const equityTrades = sortedClosed.filter(t => t.exitDate);
                            if (equityTrades.length < 2) return null;

                            // Build a unified event timeline mirroring the dashboard chartData:
                            // 1) full closes (getEffectiveProfit — remaining qty after partials)
                            // 2) partial exits (each pe dated individually)
                            // 3) dividends (dated entries when available, flat fallback on exit/entry date)
                            // All of statsTrades so open trade partials and dividends are included
                            const rawEvents = [];
                            statsTrades.forEach(t => {
                                // 1. Full close
                                if (t.exitDate) {
                                    rawEvents.push({ date: t.exitDate, amount: getEffectiveProfit(t), label: t.symbol, isDividend: false });
                                }
                                // 2. Partial exits
                                (t.partialExits || []).forEach(pe => {
                                    if (pe.exitDate) rawEvents.push({ date: pe.exitDate, amount: pe.profit || 0, label: t.symbol, isDividend: false, isPartial: true });
                                });
                                // 3. Dividends — dated entries first, flat fallback
                                if (t.dividendEntries && t.dividendEntries.length > 0) {
                                    t.dividendEntries.forEach(e => {
                                        if (e.amount && e.date) rawEvents.push({ date: e.date, amount: e.amount, label: t.symbol, isDividend: true });
                                    });
                                } else if (t.dividend) {
                                    const fallbackDate = t.exitDate || t.entryDate;
                                    if (fallbackDate) rawEvents.push({ date: fallbackDate, amount: t.dividend, label: t.symbol, isDividend: true });
                                }
                            });
                            const allEvents = rawEvents.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
                            const totalOpenDivs = statsTrades.filter(t => !t.exitDate).reduce((s, t) => {
                                if (t.dividendEntries && t.dividendEntries.length > 0) return s + t.dividendEntries.reduce((ds, e) => ds + (e.amount || 0), 0);
                                return s + (t.dividend || 0);
                            }, 0);

                            // Build cumulative equity and drawdown arrays
                            let cumulative = 0;
                            let peak = 0;
                            const equityPoints = [];
                            const drawdownPoints = [];
                            const eventLabels = [];
                            let tradeNum = 0;
                            allEvents.forEach(ev => {
                                cumulative += ev.amount;
                                if (!ev.isDividend && !ev.isPartial) tradeNum++;
                                equityPoints.push(cumulative);
                                if (cumulative > peak) peak = cumulative;
                                drawdownPoints.push(Math.min(0, cumulative - peak));
                                eventLabels.push(ev.isDividend ? `${ev.label} div` : ev.isPartial ? `${ev.label} partial` : `#${tradeNum} ${ev.label}`);
                            });
                            const axisLabels = allEvents.map((_, i) => i + 1);

                            const EquityCurveChart = () => {
                                const canvasRef = React.useRef(null);
                                const chartRef  = React.useRef(null);
                                React.useEffect(() => {
                                    if (!canvasRef.current || !window.Chart) return;
                                    if (chartRef.current) chartRef.current.destroy();
                                    const lineColor  = isDark ? '#4a9eff' : '#2563eb';
                                    const fillColor  = isDark ? 'rgba(74,158,255,0.12)' : 'rgba(37,99,235,0.1)';
                                    const gridColor  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
                                    const labelColor = isDark ? '#999999' : '#666666';
                                    chartRef.current = new window.Chart(canvasRef.current, {
                                        type: 'line',
                                        data: {
                                            labels: axisLabels,
                                            datasets: [{
                                                data: equityPoints,
                                                borderColor: lineColor,
                                                borderWidth: 2,
                                                pointRadius: 0,
                                                pointHoverRadius: 4,
                                                fill: true,
                                                backgroundColor: ctx => {
                                                    const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
                                                    gradient.addColorStop(0, isDark ? 'rgba(74,158,255,0.25)' : 'rgba(37,99,235,0.2)');
                                                    gradient.addColorStop(1, 'rgba(0,0,0,0)');
                                                    return gradient;
                                                },
                                                tension: 0.3,
                                            }]
                                        },
                                        options: {
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            animation: { duration: 600 },
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    backgroundColor: isDark ? '#1a1a1a' : '#fff',
                                                    borderColor: isDark ? '#333' : '#e5e7eb',
                                                    borderWidth: 1,
                                                    titleColor: isDark ? '#aaa' : '#666',
                                                    bodyColor: isDark ? '#fff' : '#111',
                                                    callbacks: {
                                                        title: ctx => eventLabels[ctx[0].dataIndex],
                                                        label: ctx => fmtFull(ctx.parsed.y)
                                                    }
                                                }
                                            },
                                            scales: {
                                                x: {
                                                    grid: { color: gridColor },
                                                    ticks: { color: labelColor, font: { family: 'DM Mono', size: 11 }, maxTicksLimit: 10 },
                                                    title: { display: true, text: 'Trade #', color: labelColor, font: { family: 'DM Mono', size: 11 } }
                                                },
                                                y: {
                                                    grid: { color: gridColor },
                                                    ticks: {
                                                        color: labelColor,
                                                        font: { family: 'DM Mono', size: 11 },
                                                        callback: v => '$' + (Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v)
                                                    }
                                                }
                                            }
                                        }
                                    });
                                    return () => { if (chartRef.current) chartRef.current.destroy(); };
                                }, [isDark]);
                                return <canvas ref={canvasRef} />;
                            };

                            const DrawdownChart = () => {
                                const canvasRef = React.useRef(null);
                                const chartRef  = React.useRef(null);
                                React.useEffect(() => {
                                    if (!canvasRef.current || !window.Chart) return;
                                    if (chartRef.current) chartRef.current.destroy();
                                    const redLine  = isDark ? '#ff4444' : '#dc2626';
                                    const gridColor  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
                                    const labelColor = isDark ? '#999999' : '#666666';
                                    chartRef.current = new window.Chart(canvasRef.current, {
                                        type: 'line',
                                        data: {
                                            labels: axisLabels,
                                            datasets: [{
                                                data: drawdownPoints,
                                                borderColor: redLine,
                                                borderWidth: 2,
                                                pointRadius: 0,
                                                pointHoverRadius: 4,
                                                fill: true,
                                                backgroundColor: ctx => {
                                                    const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
                                                    gradient.addColorStop(0, isDark ? 'rgba(255,68,68,0.0)' : 'rgba(220,38,38,0.0)');
                                                    gradient.addColorStop(1, isDark ? 'rgba(255,68,68,0.35)' : 'rgba(220,38,38,0.25)');
                                                    return gradient;
                                                },
                                                tension: 0.3,
                                            }]
                                        },
                                        options: {
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            animation: { duration: 600 },
                                            layout: { padding: { top: 36 } },
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    backgroundColor: isDark ? '#1a1a1a' : '#fff',
                                                    borderColor: isDark ? '#333' : '#e5e7eb',
                                                    borderWidth: 1,
                                                    titleColor: isDark ? '#aaa' : '#666',
                                                    bodyColor: isDark ? '#fff' : '#111',
                                                    callbacks: {
                                                        title: ctx => eventLabels[ctx[0].dataIndex],
                                                        label: ctx => fmtFull(ctx.parsed.y)
                                                    }
                                                }
                                            },
                                            scales: {
                                                x: {
                                                    grid: { color: gridColor },
                                                    ticks: { color: labelColor, font: { family: 'DM Mono', size: 11 }, maxTicksLimit: 10 },
                                                    title: { display: true, text: 'Trade #', color: labelColor, font: { family: 'DM Mono', size: 11 } }
                                                },
                                                y: {
                                                    grid: { color: gridColor },
                                                    max: Math.ceil(Math.abs(Math.min(...drawdownPoints)) * 0.05 / 100) * 100,
                                                    ticks: {
                                                        color: labelColor,
                                                        font: { family: 'DM Mono', size: 11 },
                                                        callback: v => '$' + (Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v)
                                                    }
                                                }
                                            }
                                        }
                                    });
                                    return () => { if (chartRef.current) chartRef.current.destroy(); };
                                }, [isDark]);
                                return <canvas ref={canvasRef} />;
                            };

                            const maxDD = Math.min(...drawdownPoints);
                            const maxDDTrade = equityTrades[drawdownPoints.indexOf(maxDD)];

                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                    {/* Equity Curve */}
                                    <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: T.textMuted, textTransform: 'uppercase', fontWeight: '600' }}>Equity Curve</div>
                                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total P&L</div>
                                                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.88rem', fontWeight: '600', color: equityPoints[equityPoints.length-1] >= 0 ? T.green : T.red }}>{fmtFull(equityPoints[equityPoints.length-1])}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Peak</div>
                                                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.88rem', fontWeight: '600', color: isDark ? '#4a9eff' : '#2563eb' }}>{'$' + peak.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                </div>
                                                {totalOpenDivs > 0 && (
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Open Divs</div>
                                                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.88rem', fontWeight: '600', color: T.green }}>+{'$' + totalOpenDivs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ height: '220px', position: 'relative' }}>
                                            {window.Chart ? <EquityCurveChart /> : <div style={{ color: T.textMuted, fontSize: '0.85rem' }}>Chart library not loaded.</div>}
                                        </div>
                                    </div>

                                    {/* Drawdown */}
                                    <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}`, marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: T.textMuted, textTransform: 'uppercase', fontWeight: '600' }}>Drawdown</div>
                                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: T.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help', borderBottom: `1px dashed ${T.textFaint}` }} title="Largest peak-to-trough decline on the full equity curve — includes capital gains, dividends from closed trades, and dividend payments from currently open positions. Will differ from the Max Drawdown card above which uses closed trade capital gains only.">Max Drawdown</div>
                                                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.88rem', fontWeight: '600', color: T.red }}>{fmtFull(maxDD)}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ height: '220px', position: 'relative' }}>
                                            {window.Chart ? <DrawdownChart /> : <div style={{ color: T.textMuted, fontSize: '0.85rem' }}>Chart library not loaded.</div>}
                                        </div>
                                    </div>

                                </div>
                            );
                        })()}

                    </>
                )}
            </div>
        <SharedModals {...props} />
        </div>
    );
}
