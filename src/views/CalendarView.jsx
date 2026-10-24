// Calendar tab — moved out of App.jsx.

import React from 'react';
import { getEffectiveProfit } from '../utils/tradeMath';
import Sidebar from '../components/Sidebar';

export default function CalendarView(props) {
    const {
        T, calMonth, calSubView, calSymbolPopover, calYear, isDark, setCalMonth, setCalSubView,
        setCalSymbolPopover, setCalYear, setView, trades,
    } = props;

    const now = new Date();
    const GF = "'Geist', 'Inter', -apple-system, sans-serif";
    const GM = "'Geist Mono', 'DM Mono', monospace";

    const calDayMap = (() => {
        const map = {};
        const addToMap = (dateKey, pnl, sym) => {
            if (!map[dateKey]) map[dateKey] = { pnl: 0, tradeCount: 0, symbols: [], symbolPnl: {} };
            map[dateKey].pnl += pnl;
            map[dateKey].tradeCount += 1;
            if (sym && !map[dateKey].symbols.includes(sym)) map[dateKey].symbols.push(sym);
            if (sym) map[dateKey].symbolPnl[sym] = (map[dateKey].symbolPnl[sym] || 0) + pnl;
        };
        trades.forEach(t => {
            const sym = t.symbol || t.name || '';
            const partials = t.partialExits || [];
            // Each partial exit lands on its own date.
            // p.profit = (exitPrice - entryPrice) * p.qty — correct as-is.
            partials.forEach(p => {
                const dateKey = p.exitDate ? p.exitDate.split('T')[0] : null;
                if (!dateKey) return;
                addToMap(dateKey, p.profit || 0, sym);
            });
            // Final close: t.qty is already the remaining qty after all partials,
            // so getEffectiveProfit(t) correctly computes only what was realized on close day.
            // Do NOT subtract partialProfitTotal — it's not included in getEffectiveProfit.
            const dateKey = t.exitDate ? t.exitDate.split('T')[0] : null;
            if (dateKey) {
                addToMap(dateKey, getEffectiveProfit(t), sym);
            }
        });
        return map;
    })();

    const tradeYears = (() => {
        const years = new Set([now.getFullYear()]);
        Object.keys(calDayMap).forEach(key => years.add(parseInt(key.slice(0,4))));
        return Array.from(years).sort((a,b) => a - b);
    })();

    const fmtPnl = (v) => {
        const abs = Math.abs(v);
        let num;
        if (abs >= 1000000) num = (abs/1000000).toFixed(1) + 'M';
        else if (abs >= 10000) num = '$' + (abs/1000).toFixed(2) + 'k';
        else num = '$' + abs.toFixed(2);
        if (abs >= 1000000) num = '$' + num;
        return (v >= 0 ? '+' : '-') + num;
    };



    const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const DOW_LABELS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    const bd      = isDark ? '#1c1c1c' : '#e0e3e8';
    const cellBg  = isDark ? '#0d0d0d' : '#ffffff';
    const headBg  = isDark ? '#080808' : '#f5f6f8';
    const emptyBg = isDark ? '#080808' : '#f9fafb';
    const totBg   = isDark ? '#0a0a0a' : '#f5f6f8';
    const hovBg   = isDark ? '#131313' : '#eef0f4';
    const rowHov  = isDark ? '#111' : '#f5f7fa';
    const sepBg   = isDark ? '#0f0f0f' : '#f5f6f8';
    const todayBg = isDark ? 'rgba(0,255,136,0.06)' : 'rgba(5,150,105,0.05)';
    const todayBd = isDark ? 'rgba(0,255,136,0.2)' : 'rgba(5,150,105,0.2)';
    const chipBg  = isDark ? '#1a1a1a' : '#eceef1';

    const SymbolChips = ({ symbols, dateKey }) => {
        const visible = symbols.slice(0, 5);
        const overflow = symbols.length - 5;
        const isOpen = calSymbolPopover && calSymbolPopover.key === dateKey;
        return (
            React.createElement('div', { style: { display: 'flex', gap: '0.28rem', alignItems: 'center', flexWrap: 'nowrap', position: 'relative' } },
                visible.map(s =>
                    React.createElement('span', { key: s, style: { fontSize: '0.68rem', fontWeight: '600', fontFamily: GM, color: isDark ? '#9ca3af' : '#4b5563', background: chipBg, border: '1px solid ' + bd, borderRadius: '4px', padding: '0.15rem 0.45rem', letterSpacing: '0.03em', whiteSpace: 'nowrap' } }, s)
                ),
                overflow > 0 ? React.createElement('span', {
                    onClick: e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setCalSymbolPopover(isOpen ? null : { key: dateKey, symbols: symbols, rect: r }); },
                    style: { fontSize: '0.68rem', fontWeight: '600', color: T.green, background: isDark ? 'rgba(0,255,136,0.08)' : 'rgba(5,150,105,0.08)', border: '1px solid ' + (isDark ? 'rgba(0,255,136,0.25)' : 'rgba(5,150,105,0.25)'), borderRadius: '4px', padding: '0.15rem 0.45rem', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', fontFamily: GF }
                }, '+' + overflow + ' more') : null,
                isOpen ? React.createElement('div', {
                    onClick: e => e.stopPropagation(),
                    style: { position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: isDark ? '#191919' : '#fff', border: '1px solid ' + T.borderStrong, borderRadius: '8px', padding: '0.6rem 0.75rem', zIndex: 9999, boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.7)' : '0 6px 24px rgba(0,0,0,0.14)', minWidth: '130px', maxWidth: '200px', maxHeight: '260px', overflowY: 'auto' }
                },
                    React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' } },
                        React.createElement('span', { style: { fontSize: '0.6rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', fontFamily: GF } }, 'All symbols'),
                        React.createElement('span', { onClick: e => { e.stopPropagation(); setCalSymbolPopover(null); }, style: { fontSize: '0.7rem', color: T.textMuted, cursor: 'pointer', padding: '2px 5px' } }, 'x')
                    ),
                    symbols.map((s, si) =>
                        React.createElement('div', { key: s, style: { fontSize: '0.78rem', fontWeight: '600', color: T.textPrimary, fontFamily: GM, lineHeight: '1.75', borderBottom: si < symbols.length - 1 ? '1px solid ' + (isDark ? '#222' : '#f0f0f0') : 'none' } }, s)
                    )
                ) : null
            )
        );
    };

    const SubHeader = () => (
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '1rem' } },
                React.createElement('button', { onClick: () => setView('dashboard'), style: { background: T.green, border: 'none', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', flexShrink: 0 } },
                    React.createElement('svg', { width: '14', height: '14', viewBox: '0 0 24 24', fill: 'none', stroke: '#000', strokeWidth: '2.8', strokeLinecap: 'round', strokeLinejoin: 'round' },
                        React.createElement('polyline', { points: '22 12 18 12 15 21 9 3 6 12 2 12' })
                    )
                ),
                React.createElement('div', { style: { background: isDark ? '#0a0a0a' : '#eceef1', border: '1px solid ' + bd, borderRadius: '7px', padding: '3px', display: 'flex', gap: '0.15rem' } },
                    [['recent','Recent'],['yearmonthday','Year/Month/Day'],['calendar','Calendar']].map(function(item) {
                        const key = item[0]; const label = item[1];
                        const active = calSubView === key;
                        return React.createElement('button', { key: key, onClick: () => { setCalSubView(key); if (key === 'recent') setCalYear('all'); else if (calYear === 'all') setCalYear(new Date().getFullYear()); }, style: { padding: '0.3rem 0.8rem', borderRadius: '5px', border: 'none', background: active ? T.green : 'transparent', color: active ? (isDark ? '#000' : '#fff') : T.textSecondary, fontSize: '0.78rem', fontWeight: active ? '700' : '500', cursor: 'pointer', fontFamily: GF, whiteSpace: 'nowrap' } }, label);
                    })
                )
            ),
            React.createElement('div', { style: { display: 'flex', gap: '0.25rem', flexWrap: 'wrap', alignItems: 'center' } },
                [
                    ...(calSubView === 'recent' ? [React.createElement('button', { key: 'all', onClick: () => setCalYear('all'), style: { padding: '0.18rem 0.55rem', borderRadius: '999px', border: calYear === 'all' ? '2px solid ' + (isDark ? '#000' : '#fff') : '2px solid transparent', background: calYear === 'all' ? T.green : 'transparent', color: calYear === 'all' ? (isDark ? '#000' : '#fff') : T.textSecondary, fontSize: '0.78rem', fontWeight: calYear === 'all' ? '700' : '600', cursor: 'pointer', fontFamily: GF } }, 'All')] : []),
                    ...tradeYears.map(y =>
                        React.createElement('button', { key: y, onClick: () => setCalYear(y), style: { padding: '0.18rem 0.55rem', borderRadius: '999px', border: y === calYear ? '2px solid ' + (isDark ? '#000' : '#fff') : '2px solid transparent', background: y === calYear ? T.green : 'transparent', color: y === calYear ? (isDark ? '#000' : '#fff') : T.textSecondary, fontSize: '0.78rem', fontWeight: y === calYear ? '700' : '600', cursor: 'pointer', fontFamily: GF } }, y)
                    )
                ]
            )
        )
    );

    if (calSubView === 'recent') {
        const allDays = Object.entries(calDayMap).sort((a, b) => b[0].localeCompare(a[0]));
        const sortedDays = calYear === 'all' ? allDays : allDays.filter(([k]) => k.startsWith(String(calYear)));
        return (
            <div style={{ minHeight: '100vh', padding: '2rem 2.5rem', background: T.pageBg, color: T.textPrimary, marginLeft: '220px', boxSizing: 'border-box', fontFamily: GF }}>
                <Sidebar {...props} />
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    { SubHeader() }
                    <div style={{ border: `1px solid ${bd}`, borderRadius: '8px', overflow: 'hidden' }}>
                        {sortedDays.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: T.textFaint, fontSize: '0.85rem' }}>No closed trades {calYear !== 'all' ? `in ${calYear}` : 'found'}</div>}
                        {sortedDays.map(([dateKey, data], i) => {
                            const d = new Date(dateKey + 'T00:00:00');
                            const dow = DAY_ABBR[d.getDay()];
                            const mon = MONTH_NAMES[d.getMonth()].slice(0,3);
                            const dayNum = d.getDate();
                            const isToday = dateKey === todayStr;
                            const pnlCol = data.pnl > 0 ? T.green : data.pnl < 0 ? T.red : T.textMuted;
                            const rowBg = i % 2 === 0 ? cellBg : (isDark ? '#0a0a0a' : '#fafbfc');
                            return (
                                <div key={dateKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderBottom: i < sortedDays.length - 1 ? `1px solid ${bd}` : 'none', background: rowBg, transition: 'background 0.1s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = rowHov}
                                    onMouseLeave={e => e.currentTarget.style.background = rowBg}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: isToday ? '700' : '500', color: isToday ? T.green : T.textPrimary, fontFamily: GF, minWidth: '90px' }}>{dow}, {mon} {dayNum}</span>
                                        <span style={{ fontSize: '0.78rem', color: T.textMuted, fontFamily: GF }}>{data.tradeCount} trade{data.tradeCount !== 1 ? 's' : ''}</span>
                                        {data.symbols.length > 0 && <SymbolChips symbols={data.symbols} dateKey={dateKey} />}
                                    </div>
                                    <span style={{ fontSize: '0.88rem', fontWeight: '700', color: pnlCol, fontFamily: GF }}>{fmtPnl(data.pnl)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    if (calSubView === 'yearmonthday') {
        const yearDays = Object.entries(calDayMap).filter(([k]) => k.startsWith(String(calYear))).sort((a, b) => a[0].localeCompare(b[0]));
        const byMonth = {};
        yearDays.forEach(([dateKey, data]) => {
            const mk = dateKey.slice(0, 7);
            if (!byMonth[mk]) byMonth[mk] = [];
            byMonth[mk].push([dateKey, data]);
        });
        const monthKeys = Object.keys(byMonth).sort();
        return (
            <div style={{ minHeight: '100vh', padding: '2rem 2.5rem', background: T.pageBg, color: T.textPrimary, marginLeft: '220px', boxSizing: 'border-box', fontFamily: GF }}>
                <Sidebar {...props} />
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    { SubHeader() }
                    {monthKeys.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: T.textFaint, fontSize: '0.85rem', border: `1px solid ${bd}`, borderRadius: '8px' }}>No trades in {calYear}</div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {monthKeys.map(monthKey => {
                            const [yr, mo] = monthKey.split('-');
                            const monthName = MONTH_NAMES[parseInt(mo) - 1];
                            const days = byMonth[monthKey];
                            const monthPnl = days.reduce((s, [, d]) => s + d.pnl, 0);
                            const monthCount = days.reduce((s, [, d]) => s + d.tradeCount, 0);
                            return (
                                <div key={monthKey} style={{ border: `1px solid ${bd}`, borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', background: sepBg, borderBottom: `1px solid ${bd}` }}>
                                        <span style={{ fontSize: '0.95rem', fontWeight: '700', color: T.textPrimary, fontFamily: GF }}>{monthName} {yr}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{ fontSize: '0.78rem', color: T.textMuted, fontFamily: GF }}>{monthCount} trade{monthCount !== 1 ? 's' : ''}</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: monthPnl >= 0 ? T.green : T.red, fontFamily: GF }}>{fmtPnl(monthPnl)}</span>
                                        </div>
                                    </div>
                                    {days.map(([dateKey, data], i) => {
                                        const d = new Date(dateKey + 'T00:00:00');
                                        const dow = DAY_ABBR[d.getDay()];
                                        const mon = MONTH_NAMES[d.getMonth()].slice(0,3);
                                        const dayNum = d.getDate();
                                        const isToday = dateKey === todayStr;
                                        const pnlCol = data.pnl > 0 ? T.green : data.pnl < 0 ? T.red : T.textMuted;
                                        return (
                                            <div key={dateKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1.25rem', borderBottom: i < days.length - 1 ? `1px solid ${bd}` : 'none', background: cellBg, transition: 'background 0.1s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = rowHov}
                                                onMouseLeave={e => e.currentTarget.style.background = cellBg}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                    <span style={{ fontSize: '0.83rem', fontWeight: isToday ? '700' : '400', color: isToday ? T.green : T.textPrimary, fontFamily: GF, minWidth: '90px' }}>{dow}, {mon} {dayNum}</span>
                                                    <span style={{ fontSize: '0.75rem', color: T.textMuted, fontFamily: GF }}>{data.tradeCount} trade{data.tradeCount !== 1 ? 's' : ''}</span>
                                                    {data.symbols.length > 0 && <SymbolChips symbols={data.symbols} dateKey={dateKey} />}
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: pnlCol, fontFamily: GF }}>{fmtPnl(data.pnl)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    const weeks = (() => {
        const firstDay = new Date(calYear, calMonth, 1);
        const lastDay  = new Date(calYear, calMonth + 1, 0);
        const startDow = (firstDay.getDay() + 6) % 7;
        const totalDays = lastDay.getDate();
        const cells = [];
        for (let i = 0; i < startDow; i++) cells.push(null);
        for (let d = 1; d <= totalDays; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);
        const result = [];
        for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i+7));
        return result;
    })();

    const monthlyPnl = (() => {
        let total = 0;
        const prefix = `${calYear}-${String(calMonth+1).padStart(2,'0')}`;
        Object.entries(calDayMap).forEach(([k,v]) => { if (k.startsWith(prefix)) total += v.pnl; });
        return total;
    })();

    const weeklyPnl = weeks.map(week => {
        let pnl = 0, count = 0;
        week.forEach(d => {
            if (!d) return;
            const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            if (calDayMap[key]) { pnl += calDayMap[key].pnl; count += calDayMap[key].tradeCount; }
        });
        return { pnl, count };
    });

    return (
        <div style={{ minHeight: '100vh', padding: '2rem 2.5rem', background: T.pageBg, color: T.textPrimary, marginLeft: '220px', boxSizing: 'border-box', fontFamily: GF }}>
            <Sidebar {...props} />
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                { SubHeader() }
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button onClick={() => { let m=calMonth-1,y=calYear; if(m<0){m=11;y--;} setCalMonth(m);setCalYear(y); }}
                            style={{ width:'32px',height:'32px',borderRadius:'6px',border:`1px solid ${T.borderStrong}`,background:'transparent',color:T.textSecondary,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.green;e.currentTarget.style.color=T.green;}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.borderStrong;e.currentTarget.style.color=T.textSecondary;}}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <span style={{ fontSize: '1.6rem', fontWeight: '700', color: T.textPrimary, letterSpacing: '-0.03em', minWidth: '200px', fontFamily: GF }}>{MONTH_NAMES[calMonth]} {calYear}</span>
                        <button onClick={() => { let m=calMonth+1,y=calYear; if(m>11){m=0;y++;} setCalMonth(m);setCalYear(y); }}
                            style={{ width:'32px',height:'32px',borderRadius:'6px',border:`1px solid ${T.borderStrong}`,background:'transparent',color:T.textSecondary,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.green;e.currentTarget.style.color=T.green;}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.borderStrong;e.currentTarget.style.color=T.textSecondary;}}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: T.textSecondary, fontFamily: GF }}>
                        Monthly P&L:&nbsp;<span style={{ fontWeight: '700', fontSize: '0.95rem', color: monthlyPnl >= 0 ? T.green : T.red, fontFamily: GF }}>{fmtPnl(monthlyPnl)}</span>
                    </div>
                </div>
                <div style={{ border: `1px solid ${bd}`, borderRadius: '10px', overflow: 'visible' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr) 130px', background: headBg, borderBottom: `1px solid ${bd}` }}>
                        {DOW_LABELS.map(lbl => (
                            <div key={lbl} style={{ padding: '0.7rem 1rem', fontSize: '0.7rem', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted, borderRight: `1px solid ${bd}`, fontFamily: GF }}>{lbl}</div>
                        ))}
                        <div style={{ padding: '0.7rem 1rem', fontSize: '0.7rem', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted, fontFamily: GF }}>Total</div>
                    </div>
                    {weeks.map((week, wi) => {
                        const { pnl: wPnl, count: wCount } = weeklyPnl[wi];
                        return (
                            <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr) 130px', borderBottom: wi < weeks.length - 1 ? `1px solid ${bd}` : 'none' }}>
                                {week.map((day, di) => {
                                    if (!day) return <div key={di} style={{ background: emptyBg, borderRight: `1px solid ${bd}`, minHeight: '110px' }} />;
                                    const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                                    const data = calDayMap[key];
                                    const isToday = key === todayStr;
                                    const pnl = data ? data.pnl : 0;
                                    const count = data ? data.tradeCount : 0;
                                    const symbols = data ? data.symbols : [];
                                    const symbolPnl = data ? (data.symbolPnl || {}) : {};
                                    const pnlCol = pnl > 0 ? T.green : pnl < 0 ? T.red : T.textVeryFaint;
                                    return (
                                        <div key={di} style={{ background: isToday ? todayBg : cellBg, borderRight: `1px solid ${bd}`, borderTop: isToday ? `2px solid ${todayBd}` : '2px solid transparent', minHeight: '110px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', position: 'relative', transition: 'background 0.1s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = hovBg; const tip = e.currentTarget.querySelector('.cal-tip'); if(tip) tip.style.opacity='1'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = isToday ? todayBg : cellBg; const tip = e.currentTarget.querySelector('.cal-tip'); if(tip) tip.style.opacity='0'; }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '1rem', fontWeight: '600', color: isToday ? T.green : T.textPrimary, fontFamily: GF }}>{String(day).padStart(2,'0')}</span>
                                                {isToday && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.green }} />}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: pnlCol, fontFamily: GF }}>{count > 0 ? fmtPnl(pnl) : <span style={{ color: T.textVeryFaint }}>+$0</span>}</div>
                                            <div style={{ fontSize: '0.72rem', color: count > 0 ? T.textSecondary : T.textVeryFaint, fontFamily: GF }}>{count} trade{count !== 1 ? 's' : ''}</div>
                                            {symbols.length > 0 && (
                                                <div className="cal-tip" style={{ opacity:0, transition:'opacity 0.15s', position:'absolute', bottom:'calc(100% + 6px)', left:'0', background: isDark ? '#191919' : '#fff', border:`1px solid ${T.borderStrong}`, borderRadius:'8px', padding:'0.5rem 0.7rem', zIndex:300, pointerEvents:'none', boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.7)' : '0 6px 20px rgba(0,0,0,0.13)', minWidth:'110px', maxWidth:'180px' }}>
                                                    <div style={{ fontSize:'0.6rem', color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:'700', marginBottom:'0.35rem', fontFamily:GF }}>Traded</div>
                                                    {symbols.slice(0,8).map(s => {
                                                        const sp = symbolPnl[s] || 0;
                                                        const spCol = sp > 0 ? T.green : sp < 0 ? T.red : T.textMuted;
                                                        return (
                                                            <div key={s} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px', lineHeight:'1.7' }}>
                                                                <span style={{ fontSize:'0.78rem', fontWeight:'600', color:T.textPrimary, fontFamily:GM }}>{s}</span>
                                                                <span style={{ fontSize:'0.75rem', fontWeight:'600', color:spCol, fontFamily:GM }}>{fmtPnl(sp)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                    {symbols.length > 8 && <div style={{ fontSize:'0.65rem', color:T.textMuted, marginTop:'3px' }}>+{symbols.length-8} more</div>}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div style={{ background: totBg, minHeight: '110px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3rem', borderLeft: `1px solid ${bd}` }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: GF }}>Week {wi+1}</div>
                                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: wPnl > 0 ? T.green : wPnl < 0 ? T.red : T.textVeryFaint, fontFamily: GF }}>{fmtPnl(wPnl)}</div>
                                    <div style={{ fontSize: '0.7rem', color: T.textMuted, fontFamily: GF }}>{wCount} trade{wCount !== 1 ? 's' : ''}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
