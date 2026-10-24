// Tag performance chart (Stats tab) — moved out of App.jsx.

import React from 'react';
import { getTotalProfit } from '../utils/tradeMath';

export default function TagPerformanceChart(props) {
    const {
        T, allPortfolioTrades, beThreshold, beType, portfolioViewMode, portfolios, setTagMetric, tagMetric,
        trades,
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
        const extractTags = (text) => (text.match(/#\w+/g) || []).map(t => t.toLowerCase());
        const tagMap = {};
        closedTrades.forEach(t => {
            const tags = extractTags(t.notes || '');
            const profit = getTotalProfit(t);
            const isWin = profit > getBeThresholdForTrade(t);
            const isLoss = profit < -getBeThresholdForTrade(t);
            const holdDays = (t.entryDate && t.exitDate) ? Math.max(0, (new Date(t.exitDate) - new Date(t.entryDate)) / (1000 * 60 * 60 * 24)) : null;
            tags.forEach(tag => {
                if (!tagMap[tag]) tagMap[tag] = { tag, trades: 0, wins: 0, losses: 0, totalPnl: 0, winProfits: [], lossProfits: [], holdDays: [] };
                tagMap[tag].trades++;
                tagMap[tag].totalPnl += profit;
                if (isWin) { tagMap[tag].wins++; tagMap[tag].winProfits.push(profit); }
                if (isLoss) { tagMap[tag].losses++; tagMap[tag].lossProfits.push(profit); }
                if (holdDays !== null) tagMap[tag].holdDays.push(holdDays);
            });
        });
        const tagData = Object.values(tagMap).filter(d => d.trades >= 2).map(d => {
            const grossWin = d.winProfits.reduce((s,v) => s+v, 0);
            const grossLoss = Math.abs(d.lossProfits.reduce((s,v) => s+v, 0));
            return {
                ...d,
                winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0,
                avgWin: d.winProfits.length > 0 ? grossWin / d.winProfits.length : 0,
                avgLoss: d.lossProfits.length > 0 ? d.lossProfits.reduce((s,v) => s+v,0) / d.lossProfits.length : 0,
                profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
                avgHoldDays: d.holdDays.length > 0 ? d.holdDays.reduce((s,v) => s+v,0) / d.holdDays.length : 0,
                tag: d.tag.replace('#',''),
            };
        });
        if (tagData.length === 0) return (
            <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}`, marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.85rem', color: T.textMuted, textTransform: 'uppercase', fontWeight: '600', fontFamily: 'inherit', marginBottom: '1rem' }}>Performance by Tag</div>
                <div style={{ color: T.textMuted, fontSize: '0.85rem' }}>Add <span style={{ fontFamily: "'DM Mono', monospace", color: T.textSecondary }}>#tags</span> to your trade notes to see performance by setup.</div>
            </div>
        );

        const tagMetrics = [
            { key: 'totalPnl',     label: 'Total P&L' },
            { key: 'winRate',      label: 'Win Rate %' },
            { key: 'trades',       label: '# Trades' },
            { key: 'avgWin',       label: 'Avg Win' },
            { key: 'avgLoss',      label: 'Avg Loss' },
            { key: 'profitFactor', label: 'Profit Factor' },
            { key: 'avgHoldDays',  label: 'Avg Hold' },
        ];
        const tagSorted = [...tagData].sort((a, b) => {
            if (tagMetric === 'avgLoss') return a[tagMetric] - b[tagMetric];
            return b[tagMetric] - a[tagMetric];
        });
        const tagFiniteVals = tagSorted.map(d => isFinite(d[tagMetric]) ? Math.abs(d[tagMetric]) : 0);
        const tagMax = Math.max(...tagFiniteVals) || 1;
        const fmtTag = (key, val) => {
            if (key === 'totalPnl' || key === 'avgWin') return `${val >= 0 ? '+' : ''}$${Math.round(val).toLocaleString()}`;
            if (key === 'avgLoss') return `$${Math.round(val).toLocaleString()}`;
            if (key === 'winRate') return `${val.toFixed(1)}%`;
            if (key === 'profitFactor') return val === Infinity ? '∞' : val.toFixed(2);
            if (key === 'avgHoldDays') return `${Math.round(val)}d`;
            return val;
        };
        const getTagColor = (key, val) => {
            if (key === 'totalPnl' || key === 'avgWin') return val >= 0 ? T.green : T.red;
            if (key === 'avgLoss') return T.red;
            if (key === 'winRate') return val >= 65 ? T.green : val >= 50 ? T.amber : T.red;
            if (key === 'profitFactor') return val >= 2 ? T.green : val >= 1 ? T.amber : T.red;
            return T.blue;
        };
        return (
            <div style={{ background: T.panelBg, borderRadius: '8px', padding: '1.5rem', border: `1px solid ${T.border}`, marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', color: T.textMuted, textTransform: 'uppercase', fontWeight: '600', fontFamily: 'inherit' }}>Performance by Tag</div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {tagMetrics.map(m => (
                            <button key={m.key} onClick={() => setTagMetric(m.key)} style={{
                                padding: '0.25rem 0.65rem', borderRadius: '4px',
                                border: `1px solid ${tagMetric === m.key ? T.green : T.borderStrong}`,
                                background: tagMetric === m.key ? 'rgba(34,197,94,0.1)' : T.raisedBg,
                                color: tagMetric === m.key ? T.green : T.textSecondary,
                                fontSize: '0.72rem', fontWeight: tagMetric === m.key ? '700' : '500',
                                fontFamily: 'inherit', cursor: 'pointer',
                            }}>{m.label}</button>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {tagSorted.map((d) => {
                        const val = d[tagMetric];
                        const pct = !isFinite(val) ? 100 : (tagMax > 0 ? (Math.abs(val) / tagMax) * 100 : 0);
                        const col = getTagColor(tagMetric, val);
                        return (
                            <div key={d.tag} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 100, textAlign: 'right', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: '600', color: T.textSecondary, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.tag}</div>
                                <div style={{ flex: 1, position: 'relative', height: 26, background: T.raisedBg, borderRadius: '3px', overflow: 'hidden', border: `1px solid ${T.border}` }}>
                                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${pct}%`, background: `${col}1a`, borderRight: `2px solid ${col}`, transition: 'width 0.35s ease' }} />
                                    <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.5rem', fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', fontWeight: '700', color: col }}>
                                        {fmtTag(tagMetric, val)}
                                    </div>
                                </div>
                                <div style={{ width: 38, textAlign: 'right', fontFamily: 'inherit', fontSize: '0.72rem', color: T.textMuted, flexShrink: 0 }}>{d.trades}t</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
}
