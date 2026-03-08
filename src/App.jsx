import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import './main.css';
import './risk-calc.css';


        // SVG Icons
        const Upload = ({ size = 24 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
        );
        const X = ({ size = 24 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        );
        const Trash2 = ({ size = 24 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
        );
        const Home = ({ size = 24 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
        );
        const Plus = ({ size = 24 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
        );
        const Edit = ({ size = 24 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
        );
        const Settings = ({ size = 24 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"/>
            </svg>
        );
        const Download = ({ size = 24 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
        );
        const CameraIcon = ({ size = 16 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
            </svg>
        );
        const ClipboardIcon = ({ size = 16 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
        );

        window.storage = {
            async get(key) {
                try {
                    const value = localStorage.getItem(key);
                    return value ? { key, value, shared: false } : null;
                } catch (e) { return null; }
            },
            async set(key, value) {
                try {
                    localStorage.setItem(key, value);
                    return { key, value, shared: false };
                } catch (e) { return null; }
            }
        };

        // ── IndexedDB helpers for trade screenshots ──────────────────────────
        // imgbb upload helper
        const IMGBB_API_KEY = 'c836f1377a54e55b3495ce3b42355060';
        const uploadToImgbb = async (blob) => {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            const form = new FormData();
            form.append('image', base64);
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: form });
            const data = await res.json();
            if (!data.success) throw new Error(data.error?.message || 'imgbb upload failed');
            return data.data.url;
        };
        // ─────────────────────────────────────────────────────────────────────

export default function PortfolioTracker() {
            const [trades, setTrades] = useState([]);
            const tradesRef = React.useRef([]);
            const [isLoading, setIsLoading] = useState(true);
            const [showCSVUpload, setShowCSVUpload] = useState(false);
            const [showAddTrade, setShowAddTrade] = useState(false);
            const [showEditTrade, setShowEditTrade] = useState(false);
            const [editingTrade, setEditingTrade] = useState(null);
            const [processingCSV, setProcessingCSV] = useState(false);
            const [view, setView] = useState('dashboard');
            const [portfolioViewMode, setPortfolioViewModeRaw] = useState(() => { try { return localStorage.getItem('pt_portfolio_view_mode') || 'selected'; } catch(e) { return 'selected'; } }); // 'selected' | 'all'
            const setPortfolioViewMode = (v) => { try { localStorage.setItem('pt_portfolio_view_mode', v); } catch(e) {} setPortfolioViewModeRaw(v); };
            const [allPortfolioTrades, setAllPortfolioTrades] = useState([]);
            const [statsMenuOpen, setStatsMenuOpen] = useState(false);
            const [dashMenuOpen, setDashMenuOpen] = useState(false);
            const [statsDistYear, setStatsDistYear] = useState(null);
            const [calYear, setCalYear] = useState('all');
            const [calMonth, setCalMonth] = useState(new Date().getMonth());
            const [calSubView, setCalSubView] = useState('recent');
            const [calSymbolPopover, setCalSymbolPopover] = useState(null);
            const [statsDistMonth, setStatsDistMonth] = useState('ALL');
            const [statsTrackerYear, setStatsTrackerYear] = useState(null);
            const [tagMetric, setTagMetric] = useState('totalPnl');
            const [tradeView, setTradeView] = useState('all');
            const [timeframe, setTimeframe] = useState('ALL');
            const [currentPrices, setCurrentPrices] = useState({});
            const [fetchingPrices, setFetchingPrices] = useState(false);
            const [manualPrices, setManualPrices] = useState({});
            const [editingPrice, setEditingPrice] = useState(null); // symbol being manually edited
            const [todaysOpeningPrices, setTodaysOpeningPrices] = useState({}); // Prices at start of day for intraday P/L
            const [prevClosePrices, setPrevClosePrices] = useState({}); // Previous day's closing prices
            const [indexQuotes, setIndexQuotes] = useState({}); // DJIA, Nasdaq, S&P 500, Russell 2000
            
            const [formData, setFormData] = useState({
                symbol: '', name: '', qty: '', entryPrice: '', entryDate: new Date().toISOString().split('T')[0],
                exitDate: '', exitPrice: '', fees: '0', profit: '0', dividend: '0', notes: '', direction: 'long'
            });
            const [showPartialExit, setShowPartialExit] = useState(false);
            // Screenshot state - URLs on trade object, uploaded to imgbb
            const [screenshotUrls, setScreenshotUrls] = useState([]);
            const [pendingBlobs, setPendingBlobs] = useState([]);
            const [uploadingScreenshots, setUploadingScreenshots] = useState(false);
            const [isPasteActive, setIsPasteActive] = useState(false);
            const [lightboxData, setLightboxData] = useState(null);
            const [notesTab, setNotesTab] = useState('notes'); // 'notes' | 'screenshots'
            const screenshotFileRef = useRef(null);                            // hidden file input ref (add modal)
            const screenshotFileEditRef = useRef(null);                        // hidden file input ref (edit modal)
            const journalScreenshotFileRef = useRef(null);                      // hidden file input ref (journal panel)
            const [journalUploadingScreenshot, setJournalUploadingScreenshot] = useState(false);
            const [journalPasteActive, setJournalPasteActive] = useState(false);
            
            // Helper function to reset form to default values
            const resetFormData = () => {
                setFormData({
                    symbol: '', name: '', qty: '', entryPrice: '', entryDate: new Date().toISOString().split('T')[0],
                    exitDate: '', exitPrice: '', fees: '0', profit: '0', dividend: '0', notes: '', direction: 'long'
                });
            };
            const [tradeActivityExpanded, setTradeActivityExpanded] = useState(false);
            const [partialExitForm, setPartialExitForm] = useState({
                qty: '', exitPrice: '', exitDate: new Date().toISOString().split('T')[0]
            });
            const [editingPartialExit, setEditingPartialExit] = useState(null);
            const [partialType, setPartialType] = useState('exit');
            const [partialAddForm, setPartialAddForm] = useState({
                qty: '', price: '', date: new Date().toISOString().split('T')[0]
            });
            const [dividendAddVal, setDividendAddVal] = useState('');
            const [dividendAddActive, setDividendAddActive] = useState(false);
            const [dividendAddDate, setDividendAddDate] = useState(new Date().toISOString().split('T')[0]);
            const [expandedTrade, setExpandedTrade] = useState(null);
            const [journalSearch, setJournalSearch] = useState('');
            const [journalFilter, setJournalFilter] = useState('all');
            const [journalActiveTag, setJournalActiveTag] = useState(null);
            const [journalSelected, setJournalSelected] = useState(null);
            const [journalSortField, setJournalSortField] = useState('date');
            const [journalSortDir, setJournalSortDir] = useState('desc');
            const [journalEditingNotes, setJournalEditingNotes] = useState(null);
            const [journalCamOpen, setJournalCamOpen] = useState(false);
            const [journalActivityExpanded, setJournalActivityExpanded] = useState(false);
            const [sortColumn, setSortColumn] = useState(null);
            const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
            const [searchTerm, setSearchTerm] = useState('');
            const [chartTimeframe, setChartTimeframe] = useState('ALL');
            const [customStartDate, setCustomStartDate] = useState('');
            const [customEndDate, setCustomEndDate] = useState('');
            const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
            const [fetchingName, setFetchingName] = useState(false);
            const [portfolios, setPortfolios] = useState(() => {
                try {
                    const stored = localStorage.getItem('pt_portfolios');
                    return stored ? JSON.parse(stored) : [{ id: 'default', name: 'My Portfolio' }];
                } catch(e) { return [{ id: 'default', name: 'My Portfolio' }]; }
            });
            const [activePortfolioId, setActivePortfolioId] = useState(() => {
                try { return localStorage.getItem('pt_active_portfolio') || 'default'; } catch(e) { return 'default'; }
            });
            const [showAddPortfolio, setShowAddPortfolio] = useState(false);
            const [showImportMenu, setShowImportMenu] = useState(false);
            const [showExportMenu, setShowExportMenu] = useState(false);
            const [showClearConfirm, setShowClearConfirm] = useState(false);
            const [showDeletePortfolioConfirm, setShowDeletePortfolioConfirm] = useState(false);
            const [portfolioToDelete, setPortfolioToDelete] = useState(null);
            const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm }
            const showConfirm = (title, message, onConfirm) => setConfirmDialog({ title, message, onConfirm });
            const [newPortfolioName, setNewPortfolioName] = useState('');
            const [editingPortfolioId, setEditingPortfolioId] = useState(null);
            const [editingPortfolioName, setEditingPortfolioName] = useState('');
            const [isDark, setIsDark] = useState(() => {
                try { return localStorage.getItem('pt_theme') !== 'light'; } catch(e) { return true; }
            });
            const [beThreshold, setBeThreshold] = useState(() => {
                try { return parseFloat(localStorage.getItem('pt_be_threshold')) || 5; } catch(e) { return 5; }
            });
            const [beType, setBeType] = useState(() => {
                try { return localStorage.getItem('pt_be_type') || '$'; } catch(e) { return '$'; }
            });
            const [deltaLookback, setDeltaLookback] = useState(() => {
                try { return parseInt(localStorage.getItem('pt_delta_lookback')) || 20; } catch(e) { return 20; }
            });
            const [showWinRateSettings, setShowWinRateSettings] = useState(false);
            const [winRateSettingsDraft, setWinRateSettingsDraft] = useState({ be: '', lookback: '', beType: '$' });
            const [showDeltaTooltip, setShowDeltaTooltip] = useState(false);
            const [showBeTooltip, setShowBeTooltip] = useState(false);
            const [showLookbackTooltip, setShowLookbackTooltip] = useState(false);
            const emptyBalances = { usd: '', cad: '', baseUsd: '', baseCad: '', currentUsd: '', currentCad: '', showReturnPct: true, showIncentives: false, incentives: [], depositsUsd: [], depositsCad: [] };
            const loadBalancesForPortfolio = (pid) => {
                try {
                    // Try per-portfolio key first
                    const perPort = localStorage.getItem(`pt_starting_balances_${pid}`);
                    if (perPort) return JSON.parse(perPort);
                    // Migration: fall back to legacy global key (first portfolio to load wins it)
                    const legacy = localStorage.getItem('pt_starting_balances');
                    if (legacy) {
                        const parsed = JSON.parse(legacy);
                        // Migrate to per-portfolio key and remove legacy
                        try { localStorage.setItem(`pt_starting_balances_${pid}`, legacy); } catch(e) {}
                        return parsed;
                    }
                    return emptyBalances;
                } catch(e) { return emptyBalances; }
            };
            const saveBalancesForPortfolio = (pid, data) => {
                try { localStorage.setItem(`pt_starting_balances_${pid}`, JSON.stringify(data)); } catch(e) {}
            };
            const [startingBalances, setStartingBalances] = useState(() => loadBalancesForPortfolio(
                (() => { try { return localStorage.getItem('pt_active_portfolio') || 'default'; } catch(e) { return 'default'; } })()
            ));
            const [allPortfoliosBalances, setAllPortfoliosBalances] = useState(emptyBalances);
            const [showBalanceEditor, setShowBalanceEditor] = useState(false);
            const balanceEditorRef = useRef(null);
            const [balanceDraft, setBalanceDraft] = useState({ usd: '', cad: '', mode: 'starting', showReturnPct: true, showIncentives: false, incentives: [], newIncentiveDesc: '', newIncentiveAmt: '', depositsUsd: [], depositsCad: [], newDepositUsd: '', newDepositCad: '' });

            const [toasts, setToasts] = useState([]);
            const showToast = (type, title, msg) => {
                const id = Date.now() + Math.random();
                setToasts(t => [...t, { id, type, title, msg }]);
                setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
            };
            const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

            // Reload startingBalances whenever the active portfolio changes
            useEffect(() => {
                setStartingBalances(loadBalancesForPortfolio(activePortfolioId));
            }, [activePortfolioId]);

            // Sum all portfolios' balances when in 'all' mode
            useEffect(() => {
                if (portfolioViewMode === 'all' && portfolios.length > 1) {
                    const summed = portfolios.reduce((acc, p) => {
                        const b = loadBalancesForPortfolio(p.id);
                        const addDeposits = (existing, incoming) => {
                            const combined = [...(existing || []), ...(incoming || [])];
                            return combined;
                        };
                        return {
                            ...emptyBalances,
                            usd: String((parseFloat(acc.usd) || 0) + (parseFloat(b.usd) || 0)),
                            cad: String((parseFloat(acc.cad) || 0) + (parseFloat(b.cad) || 0)),
                            depositsUsd: addDeposits(acc.depositsUsd, b.depositsUsd),
                            depositsCad: addDeposits(acc.depositsCad, b.depositsCad),
                            showReturnPct: acc.showReturnPct !== false && b.showReturnPct !== false,
                            mode: acc.mode || b.mode || 'starting',
                        };
                    }, emptyBalances);
                    setAllPortfoliosBalances(summed);
                }
            }, [portfolioViewMode, portfolios, activePortfolioId]);

            React.useEffect(() => {
                if (!showBalanceEditor) return;
                const handler = (e) => {
                    if (balanceEditorRef.current && !balanceEditorRef.current.contains(e.target)) {
                        setShowBalanceEditor(false);
                    }
                };
                document.addEventListener('mousedown', handler);
                return () => document.removeEventListener('mousedown', handler);
            }, [showBalanceEditor]);
            const toggleTheme = () => {
                setIsDark(d => {
                    const next = !d;
                    try { localStorage.setItem('pt_theme', next ? 'dark' : 'light'); } catch(e) {}
                    return next;
                });
            };

            const T = isDark ? {
                // Dark theme
                pageBg:      '#000000',
                panelBg:     '#0a0a0a',
                surfaceBg:   '#111111',
                raisedBg:    '#1a1a1a',
                hoverBg:     '#1a1a1a',
                inputBg:     '#0a0a0a',
                modalOverlay:'rgba(0,0,0,0.85)',
                border:      '#1a1a1a',
                borderMid:   '#222222',
                borderStrong:'#333333',
                textPrimary: '#e0e0e0',
                textSecondary:'#999999',
                textMuted:   '#666666',
                textFaint:   '#444444',
                textVeryFaint:'#333333',
                green:       '#00ff88',
                greenBg:     'rgba(0,255,136,0.15)',
                greenBgDim:  'rgba(0,255,136,0.08)',
                red:         '#ff4444',
                redBg:       'rgba(255,68,68,0.15)',
                blue:        '#00ccff',
                blueBg:      'rgba(0,204,255,0.15)',
                amber:       '#ffaa00',
                amberBg:     'rgba(255,170,0,0.15)',
                shadowMd:    '0 8px 24px rgba(0,0,0,0.5)',
                shadowLg:    '0 4px 12px rgba(0,0,0,0.5)',
                chartGrid:   '#1a1a1a',
                chartTick:   '#999999',
                chartTooltipBg: '#111111',
                chartTooltipBorder: '#333333',
                tableRowEven:'#0a0a0a',
                tableRowOdd: '#0d0d0d',
            } : {
                // Light theme
                pageBg:      '#f0f2f5',
                panelBg:     '#ffffff',
                surfaceBg:   '#f8f9fa',
                raisedBg:    '#f0f2f5',
                hoverBg:     '#e8eaed',
                inputBg:     '#ffffff',
                modalOverlay:'rgba(0,0,0,0.5)',
                border:      '#e2e5e9',
                borderMid:   '#d1d5db',
                borderStrong:'#b0b7c3',
                textPrimary: '#111827',
                textSecondary:'#4b5563',
                textMuted:   '#6b7280',
                textFaint:   '#9ca3af',
                textVeryFaint:'#d1d5db',
                green:       '#059669',
                greenBg:     'rgba(5,150,105,0.12)',
                greenBgDim:  'rgba(5,150,105,0.06)',
                red:         '#dc2626',
                redBg:       'rgba(220,38,38,0.1)',
                blue:        '#0284c7',
                blueBg:      'rgba(2,132,199,0.1)',
                amber:       '#d97706',
                amberBg:     'rgba(217,119,6,0.1)',
                shadowMd:    '0 8px 24px rgba(0,0,0,0.12)',
                shadowLg:    '0 4px 12px rgba(0,0,0,0.1)',
                chartGrid:   '#e5e7eb',
                chartTick:   '#9ca3af',
                chartTooltipBg: '#ffffff',
                chartTooltipBorder: '#e2e5e9',
                tableRowEven:'#ffffff',
                tableRowOdd: '#f8f9fa',
            };


            // Quick local lookup for very common symbols (instant, no API call needed)
            const KNOWN_SYMBOLS = {
                'AAPL': 'Apple Inc', 'MSFT': 'Microsoft Corp', 'GOOGL': 'Alphabet Inc', 'GOOG': 'Alphabet Inc',
                'AMZN': 'Amazon.com Inc', 'META': 'Meta Platforms Inc', 'TSLA': 'Tesla Inc',
                'NVDA': 'NVIDIA Corp', 'BRK.B': 'Berkshire Hathaway Inc', 'BRK.A': 'Berkshire Hathaway Inc',
                'JPM': 'JPMorgan Chase & Co', 'V': 'Visa Inc', 'JNJ': 'Johnson & Johnson',
                'WMT': 'Walmart Inc', 'PG': 'Procter & Gamble Co', 'MA': 'Mastercard Inc',
                'HD': 'Home Depot Inc', 'DIS': 'Walt Disney Co', 'BAC': 'Bank of America Corp',
                'ADBE': 'Adobe Inc', 'NFLX': 'Netflix Inc', 'CRM': 'Salesforce Inc',
                'AMD': 'Advanced Micro Devices', 'INTC': 'Intel Corp', 'QCOM': 'Qualcomm Inc',
                'PYPL': 'PayPal Holdings Inc', 'SHOP': 'Shopify Inc', 'SQ': 'Block Inc',
                'COIN': 'Coinbase Global Inc', 'PLTR': 'Palantir Technologies',
                'SPY': 'SPDR S&P 500 ETF', 'QQQ': 'Invesco QQQ Trust', 'IWM': 'iShares Russell 2000 ETF',
                'VTI': 'Vanguard Total Stock Market ETF', 'VOO': 'Vanguard S&P 500 ETF',
                'JPST': 'JPM Ultra-Short Income ETF', 'ARKK': 'ARK Innovation ETF',
                'GLD': 'SPDR Gold Shares', 'SLV': 'iShares Silver Trust',
                'XLF': 'Financial Select Sector SPDR', 'XLE': 'Energy Select Sector SPDR',
                // Canadian symbols
                'CASH.TO': 'GX High Interest Savings ETF', 'BEPC.TO': 'Brookfield Renewable Corp',
                'BNS.TO': 'Bank of Nova Scotia', 'RY.TO': 'Royal Bank of Canada',
                'TD.TO': 'Toronto-Dominion Bank', 'ENB.TO': 'Enbridge Inc',
                'CNQ.TO': 'Canadian Natural Resources', 'CP.TO': 'Canadian Pacific Kansas City',
                'CNR.TO': 'Canadian National Railway', 'BCE.TO': 'BCE Inc',
                'T.TO': 'Telus Corp', 'MFC.TO': 'Manulife Financial Corp',
                'SU.TO': 'Suncor Energy Inc', 'ABX.TO': 'Barrick Gold Corp',
                'SHOP.TO': 'Shopify Inc', 'BAM.TO': 'Brookfield Asset Management',
                'ATD.TO': 'Alimentation Couche-Tard', 'WCN.TO': 'Waste Connections Inc',
                'TRI.TO': 'Thomson Reuters Corp', 'CSU.TO': 'Constellation Software',
            };

            // Always derive profit from exitPrice when available — stored profit can be stale/zero
            const getEffectiveProfit = (t) => {
                if (t.exitPrice != null && t.exitPrice !== undefined) {
                    return (t.direction === 'short'
                        ? (t.entryPrice - t.exitPrice) * t.qty
                        : (t.exitPrice - t.entryPrice) * t.qty) - (t.fees || 0);
                }
                return t.profit || 0;
            };

            // Total profit including all partial exits — used for win/loss classification
            // so a trade is judged on its complete outcome, not just the final remaining qty
            const getTotalProfit = (t) => {
                const partialProfit = (t.partialExits && t.partialExits.length > 0)
                    ? t.partialExits.reduce((s, pe) => s + (pe.profit || 0), 0)
                    : 0;
                return getEffectiveProfit(t) + partialProfit;
            };

            const fetchSymbolName = async (symbol) => {
                if (!symbol || symbol.length < 1) return null;
                const cleanSymbol = symbol.toUpperCase().trim();

                // 1. Check local cache first (instant)
                if (KNOWN_SYMBOLS[cleanSymbol]) return KNOWN_SYMBOLS[cleanSymbol];

                // 2. Check localStorage cache (previously fetched symbols)
                try {
                    const cacheKey = `symbol_name_${cleanSymbol}`;
                    const cached = localStorage.getItem(cacheKey);
                    if (cached) {
                        return cached;
                    }
                } catch (e) {
                    // localStorage might be disabled, continue without cache
                }

                // 3. Use Yahoo Finance search API
                try {
                    // Try multiple endpoints with CORS proxies
                    const attempts = [
                        () => fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanSymbol)}&quotesCount=1&newsCount=0`, 
                            { headers: { 'Accept': 'application/json' } }),
                        () => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v1/finance/search?q=${cleanSymbol}&quotesCount=1&newsCount=0`)}`),
                        () => fetch(`https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com/v1/finance/search?q=${cleanSymbol}&quotesCount=1&newsCount=0`)}`),
                    ];

                    for (const attempt of attempts) {
                        try {
                            const response = await attempt();
                            if (!response.ok) continue;
                            const data = await response.json();
                            const quote = data?.quotes?.[0];
                            if (quote && quote.symbol === cleanSymbol) {
                                // Prefer longname, fallback to shortname
                                const name = quote.longname || quote.shortname;
                                if (name && name.length > 1) {
                                    // Cache the result for future use
                                    try {
                                        localStorage.setItem(`symbol_name_${cleanSymbol}`, name);
                                    } catch (e) {
                                        // localStorage full or disabled, not critical
                                    }
                                    return name;
                                }
                            }
                        } catch (e) {
                            // Try next endpoint
                            continue;
                        }
                    }
                } catch (e) {
                    console.warn('Yahoo Finance name lookup failed:', e.message);
                }

                return null;
            };

            // Load trades on mount and whenever portfolio switches
            useEffect(() => {
                loadTrades(activePortfolioId);
            }, [activePortfolioId]);

            const savePortfolios = (newPortfolios) => {
                setPortfolios(newPortfolios);
                try { localStorage.setItem('pt_portfolios', JSON.stringify(newPortfolios)); } catch(e) {}
            };

            const handleAddPortfolio = () => {
                const name = newPortfolioName.trim();
                if (!name) return;
                const id = 'portfolio_' + Date.now();
                const updated = [...portfolios, { id, name }];
                savePortfolios(updated);
                // Switch to new portfolio (it starts empty)
                setActivePortfolioId(id);
                try { localStorage.setItem('pt_active_portfolio', id); } catch(e) {}
                setTrades([]);
                setNewPortfolioName('');
                setShowAddPortfolio(false);
            };

            const handleSwitchPortfolio = (id) => {
                setActivePortfolioId(id);
                try { localStorage.setItem('pt_active_portfolio', id); } catch(e) {}
                // Clear price state so the new portfolio's stats are calculated fresh
                setCurrentPrices({});
                setPrevClosePrices({});
                setManualPrices({});
                setTodaysOpeningPrices({});
            };

            const handleDeletePortfolio = (id) => {
                if (portfolios.length <= 1) { showToast("error", "Cannot Delete", "You can't delete your only portfolio."); return; }
                setPortfolioToDelete(id);
                setShowDeletePortfolioConfirm(true);
            };

            const handleConfirmDeletePortfolio = async () => {
                const id = portfolioToDelete;
                setShowDeletePortfolioConfirm(false);
                setPortfolioToDelete(null);
                // Remove its trades from storage
                await window.storage.set(`portfolio_trades_${id}`, JSON.stringify([]));
                const updated = portfolios.filter(p => p.id !== id);
                savePortfolios(updated);
                // If deleting the active one, switch to first remaining
                if (activePortfolioId === id) {
                    handleSwitchPortfolio(updated[0].id);
                }
            };
            const handleRenamePortfolio = (id, newName) => {
                const name = newName.trim();
                if (!name) { setEditingPortfolioId(null); return; }
                const updated = portfolios.map(p => p.id === id ? { ...p, name } : p);
                savePortfolios(updated);
                setEditingPortfolioId(null);
            };

            // Sync body background with theme
            useEffect(() => {
                document.body.style.background = T.pageBg;
                document.body.style.color = T.textPrimary;
                document.documentElement.style.setProperty('--date-invert', isDark ? '1' : '0');
            }, [isDark]);



            // Always point to the latest fetchCurrentPrices so the interval is never stale
            const fetchCurrentPricesRef = useRef(null);
            useEffect(() => { fetchCurrentPricesRef.current = fetchCurrentPrices; });

            useEffect(() => {
                if (!calSymbolPopover) return;
                const handler = () => setCalSymbolPopover(null);
                document.addEventListener('click', handler);
                return () => document.removeEventListener('click', handler);
            }, [calSymbolPopover]);

            useEffect(() => {
                const openTrades = trades.filter(t => !t.exitDate);
                if (openTrades.length > 0) {
                    fetchCurrentPricesRef.current?.();
                    const interval = setInterval(() => fetchCurrentPricesRef.current?.(), 60000);
                    return () => clearInterval(interval);
                }
            }, [trades]);

            const fetchPriceForSymbol = async (symbol) => {
                // Clean symbol for Yahoo (e.g. BBD-B.TO stays as-is, Canadian stocks use .TO)
                const yahooSymbol = symbol;

                // Strategy 1: Direct Yahoo Finance v8
                const attempts = [
                    () => fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=5d`, { headers: { 'Accept': 'application/json' } }),
                    () => fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=5d`, { headers: { 'Accept': 'application/json' } }),
                    // Strategy 2: allorigins CORS proxy
                    () => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=5d`)}`),
                    // Strategy 3: corsproxy.io
                    () => fetch(`https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=5d`)}`),
                ];

                for (const attempt of attempts) {
                    try {
                        const response = await attempt();
                        if (!response.ok) continue;
                        const data = await response.json();
                        const result = data?.chart?.result?.[0];
                        const currentPrice = result?.meta?.regularMarketPrice;
                        
                        // Get previous close from actual chart data
                        let previousClose = null;
                        const timestamps = result?.timestamp;
                        const closes = result?.indicators?.quote?.[0]?.close;
                        
                        if (timestamps && closes && closes.length > 1) {
                            // Get the last non-null close before the most recent one
                            for (let i = closes.length - 2; i >= 0; i--) {
                                if (closes[i] !== null && closes[i] !== undefined) {
                                    previousClose = closes[i];
                                    break;
                                }
                            }
                        }
                        
                        if (currentPrice && currentPrice > 0) {
                            return { currentPrice, previousClose };
                        }
                    } catch (e) {
                        // silently try next
                    }
                }
                console.warn(`All price fetch attempts failed for ${symbol}`);
                return null;
            };

            const fetchCurrentPrices = async () => {
                const openTrades = activeTrades.filter(t => !t.exitDate);
                if (openTrades.length === 0) {
                    setCurrentPrices({}); // Clear all prices if no open trades
                    setPrevClosePrices({});
                    return;
                }
                setFetchingPrices(true);
                const symbols = [...new Set(openTrades.map(t => t.symbol))];
                const newPrices = {};
                const newPrevCloses = {};
                const updatedTrades = [...trades]; // name-update still scoped to active portfolio
                let namesUpdated = false;
                
                // Only keep prices for currently open positions
                await Promise.all(symbols.map(async (symbol) => {
                    // Try to preserve existing price first
                    if (currentPrices[symbol]) {
                        newPrices[symbol] = currentPrices[symbol];
                    }
                    if (prevClosePrices[symbol]) {
                        newPrevCloses[symbol] = prevClosePrices[symbol];
                    }
                    // Then fetch new price data
                    const priceData = await fetchPriceForSymbol(symbol);
                    if (priceData !== null) {
                        newPrices[symbol] = priceData.currentPrice;
                        if (priceData.previousClose) {
                            newPrevCloses[symbol] = priceData.previousClose;
                        }
                    }
                    
                    // Fetch name for ALL trades with this symbol that don't have a name (not just open)
                    const tradesNeedingName = updatedTrades.filter(t => t.symbol === symbol && (!t.name || t.name.trim() === ''));
                    if (tradesNeedingName.length > 0) {
                        const name = await fetchSymbolName(symbol);
                        if (name) {
                            tradesNeedingName.forEach(trade => {
                                trade.name = name;
                            });
                            namesUpdated = true;
                        }
                    }
                }));
                
                setCurrentPrices(newPrices);
                setPrevClosePrices(newPrevCloses);
                
                // Save updated trades if any names were added
                if (namesUpdated) {
                    await saveTrades(updatedTrades);
                }
                
                // Set opening prices if this is the first fetch of the day
                const today = new Date().toISOString().split('T')[0];
                if (Object.keys(todaysOpeningPrices).length === 0 && Object.keys(newPrices).length > 0) {
                    setTodaysOpeningPrices(newPrices);
                    await window.storage.set('portfolio_opening_prices', JSON.stringify({ date: today, prices: newPrices }));
                }
                
                setFetchingPrices(false);
            };

            const INDEX_CONFIG = [
                { key: 'DJI',  symbol: '^DJI',  label: 'DJIA' },
                { key: 'IXIC', symbol: '^IXIC', label: 'Nasdaq' },
                { key: 'GSPC', symbol: '^GSPC', label: 'S&P 500' },
                { key: 'RUT',  symbol: '^RUT',  label: 'Russell 2k' },
            ];

            const fetchIndexQuotes = async () => {
                const results = {};
                await Promise.all(INDEX_CONFIG.map(async ({ key, symbol }) => {
                    const enc = encodeURIComponent(symbol);
                    const attempts = [
                        () => fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${enc}?interval=5m&range=1d`, { headers: { 'Accept': 'application/json' } }),
                        () => fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${enc}?interval=5m&range=1d`, { headers: { 'Accept': 'application/json' } }),
                        () => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${enc}?interval=5m&range=1d`)}`),
                        () => fetch(`https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${enc}?interval=5m&range=1d`)}`),
                    ];
                    for (const attempt of attempts) {
                        try {
                            const res = await attempt();
                            if (!res.ok) continue;
                            const data = await res.json();
                            const result = data?.chart?.result?.[0];
                            const price = result?.meta?.regularMarketPrice;
                            const prevClose = result?.meta?.previousClose || result?.meta?.chartPreviousClose;
                            const closes = result?.indicators?.quote?.[0]?.close || [];
                            const sparkline = closes.filter(v => v !== null && v !== undefined);
                            if (price && price > 0) {
                                results[key] = { price, prevClose, sparkline };
                                break;
                            }
                        } catch (e) { /* try next */ }
                    }
                }));
                if (Object.keys(results).length > 0) setIndexQuotes(results);
            };

            React.useEffect(() => {
                fetchIndexQuotes();
                const interval = setInterval(fetchIndexQuotes, 5 * 60 * 1000);
                return () => clearInterval(interval);
            }, []);

            const loadTrades = async (pid) => {
                setIsLoading(true);
                setTrades([]); // always reset before loading new portfolio
                const resolvedId = pid || activePortfolioId;
                const key = `portfolio_trades_${resolvedId}`;

                // One-time migration: move old 'portfolio_trades' into 'portfolio_trades_default'
                const legacyData = await window.storage.get('portfolio_trades');
                const defaultData = await window.storage.get('portfolio_trades_default');
                if (legacyData?.value && !defaultData?.value) {
                    await window.storage.set('portfolio_trades_default', legacyData.value);
                }
                const stored = await window.storage.get(key);
                if (stored?.value) {
                    try { 
                        const loadedTrades = JSON.parse(stored.value);
                        // Migrate old trades to new structure
                        const migratedTrades = loadedTrades.map(trade => ({
                            ...trade,
                            originalQty: trade.originalQty || trade.qty,
                            partialExits: trade.partialExits || [],
                            partialAdds: trade.partialAdds || [],
                            dividendEntries: trade.dividendEntries || [],
                            direction: trade.direction || 'long'
                        }));
                        setTrades(migratedTrades);
                    }
                    catch (e) { console.error('Failed to parse trades:', e); setTrades([]); }
                } else {
                    setTrades([]); // portfolio exists but has no saved trades yet
                }
                
                // Load today's opening prices
                const today = new Date().toISOString().split('T')[0];
                const storedOpeningPrices = await window.storage.get('portfolio_opening_prices');
                if (storedOpeningPrices?.value) {
                    try {
                        const parsed = JSON.parse(storedOpeningPrices.value);
                        // Check if the stored prices are from today
                        if (parsed.date === today) {
                            setTodaysOpeningPrices(parsed.prices);
                        } else {
                            // New day - reset opening prices
                            setTodaysOpeningPrices({});
                        }
                    } catch (e) { console.error('Failed to parse opening prices:', e); }
                }
                
                setIsLoading(false);
            };

            // Keep tradesRef current so closures never read stale trades state
            useEffect(() => { tradesRef.current = trades; }, [trades]);

            // Load all portfolios' trades when portfolioViewMode is 'all'
            useEffect(() => {
                if (portfolioViewMode === 'all' && portfolios.length > 1) {
                    (async () => {
                        const allData = await Promise.all(
                            portfolios.map(async (p) => {
                                const stored = await window.storage.get(`portfolio_trades_${p.id}`);
                                if (!stored?.value) return [];
                                try { return JSON.parse(stored.value); } catch(e) { return []; }
                            })
                        );
                        setAllPortfolioTrades(allData.flat());
                    })();
                }
            }, [portfolioViewMode, portfolios, view, trades]);

            useEffect(() => {
                setDividendAddActive(false);
                setDividendAddVal('');
                setDividendAddDate(new Date().toISOString().split('T')[0]);
            }, [editingTrade?.id]);

            // Paste listener — active only when isPasteActive is true and a modal is open
            useEffect(() => {
                if (!isPasteActive) return;
                const handler = (e) => {
                    const file = Array.from(e.clipboardData?.files || []).find(f => f.type.startsWith('image/'));
                    if (!file) return;
                    e.preventDefault();
                    setPendingBlobs(prev => (screenshotUrls.length + prev.length) < 10 ? [...prev, file] : prev);
                    setIsPasteActive(false);
                };
                document.addEventListener('paste', handler);
                return () => document.removeEventListener('paste', handler);
            }, [isPasteActive]);

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

            const saveTrades = async (newTrades) => {
                setTrades(newTrades);
                await window.storage.set(`portfolio_trades_${activePortfolioId}`, JSON.stringify(newTrades));
            };

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

            const extractDividend = (text) => {
                if (!text) return 0;
                const patterns = [/(\d+\.?\d*)\$?\s*[Dd]ividend/, /[Dd]ividend[s]?\s*\$?(\d+\.?\d*)/, /(\d+\.?\d*)\s*in\s*dividends/i];
                for (const pattern of patterns) {
                    const match = text.match(pattern);
                    if (match) return parseFloat(match[1]) || 0;
                }
                return 0;
            };

            const parseCSV = (text) => {
                const lines = text.split('\n').filter(l => l.trim());
                if (lines.length < 2) throw new Error('CSV must have headers and data');
                const parseCSVLine = (line) => {
                    const result = []; let current = ''; let inQuotes = false;
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        if (char === '"') inQuotes = !inQuotes;
                        else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
                        else current += char;
                    }
                    result.push(current.trim());
                    return result;
                };
                const headers = parseCSVLine(lines[0]);
                // Case-insensitive finder with aliases for common platform column names
                const findCol = (...names) => {
                    for (const name of names) {
                        const idx = headers.findIndex(h => h.replace(/[^a-z0-9]/gi, '').toLowerCase() === name.replace(/[^a-z0-9]/gi, '').toLowerCase());
                        if (idx !== -1) return idx;
                    }
                    return -1;
                };
                const symbolIdx     = findCol('Symbol', 'Ticker', 'Stock', 'Security', 'Instrument');
                const nameIdx       = findCol('Name', 'Description', 'Company', 'Security Name', 'Stock Name');
                const qtyIdx        = findCol('Qty', 'Quantity', 'Shares', 'Units', 'Amount', 'Contracts', 'Size');
                const originalQtyIdx= findCol('Original Qty', 'Original Quantity');
                const entryDateIdx  = findCol('Entry Date', 'Buy Date', 'Open Date', 'Date', 'Trade Date', 'Purchase Date', 'Acquisition Date');
                const entryPriceIdx = findCol('Entry Price', 'Buy Price', 'Purchase Price', 'Open Price', 'Cost', 'Price', 'Avg Price', 'Average Price', 'Cost Basis');
                const exitDateIdx   = findCol('Exit Date', 'Sell Date', 'Close Date', 'Settlement Date');
                const exitPriceIdx  = findCol('Exit Price', 'Sell Price', 'Close Price', 'Last', 'Market Price');
                const totalChgIdx   = findCol('Total Chg', 'Total Change', 'Gain Loss', 'Gain/Loss', 'P&L', 'PnL');
                const feesIdx       = findCol('Fees', 'Commission', 'Commissions', 'Fee', 'Transaction Fee');
                const profitIdx     = findCol('Profit', 'Total Profit', 'Realized PnL', 'Realized P&L', 'Net Profit', 'Net Gain');
                const dividendIdx   = findCol('Dividends', 'Dividend', 'Income');
                const notesIdx      = findCol('Notes', 'Log', 'Comments', 'Memo', 'Note');
                const partialExitsIdx    = findCol('Partial Exits');
                const partialAddsIdx     = findCol('Partial Adds');
                const directionIdx       = findCol('Direction', 'Side', 'Action', 'Type', 'Buy/Sell');
                const dividendEntriesIdx = findCol('Dividend Entries');
                if (symbolIdx === -1 || qtyIdx === -1 || entryPriceIdx === -1 || entryDateIdx === -1) {
                    throw new Error('Missing required columns: Symbol, Quantity, Entry Price, Entry Date (or equivalents)');
                }
                const parsedTrades = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = parseCSVLine(lines[i]);
                    const symbol = values[symbolIdx];
                    const qty = parseFloat(values[qtyIdx]);
                    const entryPrice = parseFloat(values[entryPriceIdx]);
                    const entryDate = values[entryDateIdx];
                    if (!symbol || isNaN(qty) || isNaN(entryPrice) || !entryDate) continue;
                    const exitDate = exitDateIdx !== -1 ? values[exitDateIdx] : '';
                    
                    // Calculate exit price from Total Chg if available
                    let exitPrice = null;
                    // Always use Total Chg to calculate exit price when available
                    if (totalChgIdx !== -1 && values[totalChgIdx] && values[totalChgIdx].trim() !== '') {
                        const totalChgStr = values[totalChgIdx].trim();
                        // Only parse if it's not "unch" or other non-numeric value
                        if (totalChgStr.toLowerCase() !== 'unch') {
                            const totalChg = parseFloat(totalChgStr);
                            if (!isNaN(totalChg)) {
                                exitPrice = entryPrice + totalChg;
                            }
                        }
                    }
                    // If we still don't have an exit price, try Exit Price / Last column
                    if (exitPrice === null && exitPriceIdx !== -1 && values[exitPriceIdx]) {
                        const parsed = parseFloat(values[exitPriceIdx]);
                        if (!isNaN(parsed)) exitPrice = parsed;
                    }

                    const notes = notesIdx !== -1 ? values[notesIdx] : '';

                    // Parse partial exits JSON if present
                    let partialExits = [];
                    if (partialExitsIdx !== -1 && values[partialExitsIdx] && values[partialExitsIdx].trim() !== '') {
                        try {
                            partialExits = JSON.parse(values[partialExitsIdx]);
                        } catch(e) { partialExits = []; }
                    }
                    // Parse partial adds JSON if present
                    let partialAdds = [];
                    if (partialAddsIdx !== -1 && values[partialAddsIdx] && values[partialAddsIdx].trim() !== '') {
                        try {
                            partialAdds = JSON.parse(values[partialAddsIdx]);
                        } catch(e) { partialAdds = []; }
                    }

                    // Parse dividend entries if present
                    let dividendEntries = [];
                    if (dividendEntriesIdx !== -1 && values[dividendEntriesIdx] && values[dividendEntriesIdx].trim() !== '') {
                        try { dividendEntries = JSON.parse(values[dividendEntriesIdx]); } catch(e) { dividendEntries = []; }
                    }
                    // Dividend total: sum entries if we have them, else use Dividends column or extract from notes
                    const dividend = dividendEntries.length > 0
                        ? parseFloat(dividendEntries.reduce((s, e) => s + e.amount, 0).toFixed(2))
                        : dividendIdx !== -1 && values[dividendIdx] !== undefined
                            ? parseFloat(values[dividendIdx]) || 0
                            : extractDividend(notes);

                    parsedTrades.push({
                        id: Date.now() + i,
                        symbol: symbol.trim(),
                        name: nameIdx !== -1 ? values[nameIdx].trim() : '',
                        qty,
                        originalQty: originalQtyIdx !== -1 ? parseFloat(values[originalQtyIdx]) || qty : qty,
                        entryPrice, entryDate,
                        exitDate: exitDate || null,
                        exitPrice: exitPrice,
                        fees: feesIdx !== -1 ? parseFloat(values[feesIdx]) || 0 : 0,
                        profit: profitIdx !== -1 ? parseFloat(values[profitIdx]) || 0 : 0,
                        dividend,
                        notes: notes.trim(),
                        partialExits,
                        partialAdds,
                        dividendEntries,
                        direction: (() => {
                            if (directionIdx === -1 || !values[directionIdx]) return 'long';
                            const d = values[directionIdx].trim().toLowerCase();
                            if (d === 'sell' || d === 'short' || d === 'sold') return 'short';
                            return 'long';
                        })()
                    });
                }
                return parsedTrades;
            };

            const handleCSVUpload = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                setProcessingCSV(true);
                try {
                    const text = await file.text();
                    const parsedTrades = parseCSV(text);
                    await saveTrades(parsedTrades);
                    setShowCSVUpload(false);
                    setView('trades');
                    showToast("success", `${parsedTrades.length} Trades Imported`, "Portfolio updated successfully.");
                } catch (error) {
                    console.error('CSV parsing error:', error);
                    showToast("error", "Import Failed", `Could not parse CSV: ${error.message}`);
                } finally {
                    setProcessingCSV(false);
                    e.target.value = '';
                }
            };

            const handleAddTrade = async () => {
                if (!formData.symbol || !formData.qty || !formData.entryPrice || !formData.entryDate) {
                    showToast("warning", "Missing Fields", "Please fill in all required fields.");
                    return;
                }
                const exitPriceVal = formData.exitPrice ? parseFloat(formData.exitPrice) : null;
                const storedProfit = parseFloat(formData.profit) || 0;
                const autoProfit = exitPriceVal != null
                    ? ((formData.direction === 'short'
                        ? (parseFloat(formData.entryPrice) - exitPriceVal)
                        : (exitPriceVal - parseFloat(formData.entryPrice))) * parseFloat(formData.qty) - (parseFloat(formData.fees) || 0))
                    : storedProfit;
                const newTrade = {
                    id: Date.now(),
                    symbol: formData.symbol.toUpperCase().trim(),
                    name: formData.name.trim(),
                    qty: parseFloat(formData.qty),
                    originalQty: parseFloat(formData.qty),
                    entryPrice: parseFloat(formData.entryPrice),
                    entryDate: formData.entryDate,
                    exitDate: formData.exitDate || null,
                    exitPrice: exitPriceVal,
                    fees: parseFloat(formData.fees) || 0,
                    profit: parseFloat(autoProfit.toFixed(2)),
                    dividend: parseFloat(formData.dividend) || 0,
                    notes: formData.notes.trim(),
                    direction: formData.direction || 'long',
                    partialExits: [],
                    partialAdds: [],
                    dividendEntries: []
                };
                let allUrls = [...screenshotUrls];
                if (pendingBlobs.length > 0) {
                    setUploadingScreenshots(true);
                    try {
                        const uploaded = await Promise.all(pendingBlobs.map(b => uploadToImgbb(b)));
                        allUrls = [...allUrls, ...uploaded];
                    } catch(e) {
                        showToast("error", "Upload Failed", "Could not upload screenshot(s). Check your connection and try again.");
                        setUploadingScreenshots(false); return;
                    }
                    setUploadingScreenshots(false);
                }
                const newTradeWithScreenshots = { ...newTrade, screenshotUrls: allUrls };
                await saveTrades([...tradesRef.current, newTradeWithScreenshots]);
                setShowAddTrade(false);
                setScreenshotUrls([]); setPendingBlobs([]);
                setIsPasteActive(false);
                setNotesTab('notes');
                resetFormData();
            };

            const handleDeleteTrade = (id) => {
                showConfirm('Delete Trade', 'Are you sure you want to delete this trade? This cannot be undone.', async () => {
                    await saveTrades(tradesRef.current.filter(t => t.id !== id));
                });
            };

            const handleAddPartialExit = async () => {
                if (!partialExitForm.qty || !partialExitForm.exitPrice || !partialExitForm.exitDate) {
                    showToast("warning", "Missing Fields", "Please fill in all partial exit fields.");
                    return;
                }
                const exitQty = parseFloat(partialExitForm.qty);
                // Current qty is already the remaining qty after previous partial exits
                const currentRemaining = editingTrade.qty;
                
                if (exitQty > currentRemaining) {
                    showToast("warning", "Insufficient Shares", `Only ${currentRemaining} shares remaining.`);
                    return;
                }

                const partialExit = {
                    id: Date.now(),
                    qty: exitQty,
                    exitPrice: parseFloat(partialExitForm.exitPrice),
                    exitDate: partialExitForm.exitDate,
                    profit: (editingTrade.direction === 'short'
                        ? (editingTrade.entryPrice - parseFloat(partialExitForm.exitPrice)) * exitQty
                        : (parseFloat(partialExitForm.exitPrice) - editingTrade.entryPrice) * exitQty)
                        - ((exitQty / (editingTrade.originalQty || editingTrade.qty)) * (editingTrade.fees || 0))
                };

                const updatedTrade = {
                    ...editingTrade,
                    partialExits: [...(editingTrade.partialExits || []), partialExit],
                    qty: currentRemaining - exitQty
                };

                // Update formData profit to reflect the new partial exit
                const currentProfit = parseFloat(formData.profit) || 0;
                const newProfit = currentProfit + partialExit.profit;
                setFormData({...formData, profit: newProfit.toString(), qty: updatedTrade.qty.toString()});

                await saveTrades(tradesRef.current.map(t => t.id === editingTrade.id ? updatedTrade : t));
                setEditingTrade(updatedTrade);
                setShowPartialExit(false);
                setPartialExitForm({ qty: '', exitPrice: '', exitDate: new Date().toISOString().split('T')[0] });
            };

            const handleEditPartialExit = (partialExit) => {
                setEditingPartialExit(partialExit);
                setPartialExitForm({
                    qty: partialExit.qty.toString(),
                    exitPrice: partialExit.exitPrice.toString(),
                    exitDate: partialExit.exitDate
                });
                setShowPartialExit(true);
            };

            const handleUpdatePartialExit = async () => {
                if (!partialExitForm.qty || !partialExitForm.exitPrice || !partialExitForm.exitDate) {
                    showToast("warning", "Missing Fields", "Please fill in all partial exit fields.");
                    return;
                }
                
                const exitQty = parseFloat(partialExitForm.qty);
                const oldExit = editingPartialExit;
                const qtyDifference = exitQty - oldExit.qty;
                
                // Check if we have enough shares
                if (qtyDifference > editingTrade.qty) {
                    showToast("warning", "Insufficient Shares", `Only ${editingTrade.qty} shares remaining.`);
                    return;
                }

                const updatedPartialExit = {
                    ...oldExit,
                    qty: exitQty,
                    exitPrice: parseFloat(partialExitForm.exitPrice),
                    exitDate: partialExitForm.exitDate,
                    profit: (editingTrade.direction === 'short'
                        ? (editingTrade.entryPrice - parseFloat(partialExitForm.exitPrice)) * exitQty
                        : (parseFloat(partialExitForm.exitPrice) - editingTrade.entryPrice) * exitQty)
                        - ((exitQty / (editingTrade.originalQty || editingTrade.qty)) * (editingTrade.fees || 0))
                };

                const profitDifference = updatedPartialExit.profit - oldExit.profit;

                const updatedTrade = {
                    ...editingTrade,
                    partialExits: editingTrade.partialExits.map(pe => 
                        pe.id === oldExit.id ? updatedPartialExit : pe
                    ),
                    qty: editingTrade.qty - qtyDifference
                };

                // Update formData profit to reflect the change
                const currentProfit = parseFloat(formData.profit) || 0;
                const newProfit = currentProfit + profitDifference;
                setFormData({...formData, profit: newProfit.toString(), qty: updatedTrade.qty.toString()});

                await saveTrades(tradesRef.current.map(t => t.id === editingTrade.id ? updatedTrade : t));
                setEditingTrade(updatedTrade);
                setEditingPartialExit(null);
                setShowPartialExit(false);
                setPartialExitForm({ qty: '', exitPrice: '', exitDate: new Date().toISOString().split('T')[0] });
            };

            const handleDeletePartialExit = (partialExitId) => {
                showConfirm('Delete Partial Exit', 'Are you sure you want to delete this partial exit?', async () => {
                const partialExit = editingTrade.partialExits.find(pe => pe.id === partialExitId);
                const updatedTrade = {
                    ...editingTrade,
                    partialExits: editingTrade.partialExits.filter(pe => pe.id !== partialExitId),
                    qty: editingTrade.qty + partialExit.qty
                };

                // Update formData profit by subtracting the deleted partial exit's profit
                const currentProfit = parseFloat(formData.profit) || 0;
                const newProfit = currentProfit - partialExit.profit;
                setFormData({...formData, profit: newProfit.toString(), qty: updatedTrade.qty.toString()});

                await saveTrades(tradesRef.current.map(t => t.id === editingTrade.id ? updatedTrade : t));
                setEditingTrade(updatedTrade);
                });
            };

            const handleAddPartialAdd = async () => {
                if (!partialAddForm.qty || !partialAddForm.price || !partialAddForm.date) {
                    showToast("warning", "Missing Fields", "Please fill in all fields.");
                    return;
                }
                const addQty = parseFloat(partialAddForm.qty);
                const addPrice = parseFloat(partialAddForm.price);
                const currentQty = editingTrade.qty;
                const currentAvgCost = editingTrade.entryPrice;
                // Weighted average cost
                const newAvgCost = ((currentQty * currentAvgCost) + (addQty * addPrice)) / (currentQty + addQty);
                const partialAdd = {
                    id: Date.now(),
                    qty: addQty,
                    price: addPrice,
                    date: partialAddForm.date
                };
                const updatedTrade = {
                    ...editingTrade,
                    partialAdds: [...(editingTrade.partialAdds || []), partialAdd],
                    qty: currentQty + addQty,
                    originalQty: (editingTrade.originalQty || currentQty) + addQty,
                    entryPrice: parseFloat(newAvgCost.toFixed(4))
                };
                setFormData({...formData, entryPrice: newAvgCost.toFixed(4), qty: updatedTrade.qty.toString()});
                await saveTrades(tradesRef.current.map(t => t.id === editingTrade.id ? updatedTrade : t));
                setEditingTrade(updatedTrade);
                setShowPartialExit(false);
                setPartialAddForm({ qty: '', price: '', date: new Date().toISOString().split('T')[0] });
            };

            const handleDeletePartialAdd = (partialAddId) => {
                showConfirm('Delete Scale-In Entry', 'Delete this scale-in entry? Avg cost will be recalculated.', async () => {
                const partialAdd = (editingTrade.partialAdds || []).find(pa => pa.id === partialAddId);
                if (!partialAdd) return;
                const currentQty = editingTrade.qty;
                const currentAvgCost = editingTrade.entryPrice;
                // Reverse the weighted average
                const prevQty = currentQty - partialAdd.qty;
                const prevAvgCost = prevQty > 0
                    ? ((currentQty * currentAvgCost) - (partialAdd.qty * partialAdd.price)) / prevQty
                    : currentAvgCost;
                const updatedTrade = {
                    ...editingTrade,
                    partialAdds: (editingTrade.partialAdds || []).filter(pa => pa.id !== partialAddId),
                    qty: prevQty,
                    originalQty: (editingTrade.originalQty || currentQty) - partialAdd.qty,
                    entryPrice: parseFloat(prevAvgCost.toFixed(4))
                };
                setFormData({...formData, entryPrice: prevAvgCost.toFixed(4), qty: updatedTrade.qty.toString()});
                await saveTrades(tradesRef.current.map(t => t.id === editingTrade.id ? updatedTrade : t));
                setEditingTrade(updatedTrade);
                });
            };

            const handleEditTrade = (trade) => {
                setEditingTrade(trade);
                setTradeActivityExpanded(false); // Always start collapsed
                setFormData({
                    symbol: trade.symbol,
                    name: trade.name,
                    qty: trade.qty.toString(),
                    entryPrice: trade.entryPrice.toString(),
                    entryDate: trade.entryDate,
                    exitDate: trade.exitDate || '',
                    exitPrice: trade.exitPrice ? trade.exitPrice.toString() : '',
                    fees: trade.fees.toString(),
                    profit: getEffectiveProfit(trade).toFixed(2),
                    dividend: trade.dividend.toString(),
                    notes: trade.notes,
                    direction: trade.direction || 'long'
                });
                setScreenshotUrls(trade.screenshotUrls || []);
                setPendingBlobs([]);
                setIsPasteActive(false);
                setShowEditTrade(true);
            };

            const handleUpdateTrade = async () => {
                if (!formData.symbol || !formData.qty || !formData.entryPrice || !formData.entryDate) {
                    showToast("warning", "Missing Fields", "Please fill in all required fields.");
                    return;
                }
                const updExitPrice = formData.exitPrice ? parseFloat(formData.exitPrice) : null;
                const updStoredProfit = parseFloat(formData.profit) || 0;
                const updAutoProfit = updExitPrice != null
                    ? ((formData.direction === 'short'
                        ? (parseFloat(formData.entryPrice) - updExitPrice)
                        : (updExitPrice - parseFloat(formData.entryPrice))) * parseFloat(formData.qty) - (parseFloat(formData.fees) || 0))
                    : updStoredProfit;
                const updatedTrade = {
                    ...editingTrade,
                    symbol: formData.symbol.toUpperCase().trim(),
                    name: formData.name.trim(),
                    qty: parseFloat(formData.qty),
                    originalQty: (() => {
                        const newQty = parseFloat(formData.qty);
                        const partialExitQty = (editingTrade.partialExits || []).reduce((s, pe) => s + (pe.qty || 0), 0);
                        return partialExitQty > 0 ? newQty + partialExitQty : newQty;
                    })(),
                    entryPrice: parseFloat(formData.entryPrice),
                    entryDate: formData.entryDate,
                    exitDate: formData.exitDate || null,
                    exitPrice: updExitPrice,
                    fees: parseFloat(formData.fees) || 0,
                    profit: parseFloat(updAutoProfit.toFixed(2)),
                    dividend: parseFloat(formData.dividend) || 0,
                    notes: formData.notes.trim(),
                    direction: formData.direction || 'long'
                };
                let finalUrls = [...screenshotUrls];
                if (pendingBlobs.length > 0) {
                    setUploadingScreenshots(true);
                    try {
                        const uploaded = await Promise.all(pendingBlobs.map(b => uploadToImgbb(b)));
                        finalUrls = [...finalUrls, ...uploaded];
                    } catch(e) {
                        showToast("error", "Upload Failed", "Could not upload screenshot(s). Check your connection and try again.");
                        setUploadingScreenshots(false); return;
                    }
                    setUploadingScreenshots(false);
                }
                const tradeWithScreenshots = { ...updatedTrade, screenshotUrls: finalUrls };
                await saveTrades(tradesRef.current.map(t => t.id === editingTrade.id ? tradeWithScreenshots : t));
                setShowEditTrade(false); setEditingTrade(null);
                setScreenshotUrls([]); setPendingBlobs([]);
                setIsPasteActive(false);
                setNotesTab('notes');
                setFormData({ symbol: '', name: '', qty: '', entryPrice: '', entryDate: new Date().toISOString().split('T')[0],
                    exitDate: '', exitPrice: '', fees: '0', profit: '0', dividend: '0', notes: '', direction: 'long' });
            };

            const handleClearPortfolio = async () => {
                await window.storage.set(`portfolio_trades_${activePortfolioId}`, JSON.stringify([]));
                setTrades([]);
                setShowClearConfirm(false);
                showToast('success', 'Portfolio Cleared', 'All trades have been removed.');
            };

            const handleAddDividendEntry = async (amount, date) => {
                const entry = { id: Date.now(), amount: parseFloat(parseFloat(amount).toFixed(2)), date };
                // If there's an existing flat dividend with no entries yet, migrate it first
                const existingEntries = editingTrade.dividendEntries || [];
                const legacyAmount = (existingEntries.length === 0 && (editingTrade.dividend || 0) > 0)
                    ? [{ id: Date.now() - 1, amount: parseFloat((editingTrade.dividend).toFixed(2)), date: editingTrade.exitDate || editingTrade.entryDate, note: 'legacy' }]
                    : [];
                const newEntries = [...legacyAmount, ...existingEntries, entry];
                const newTotal = parseFloat(newEntries.reduce((s, e) => s + e.amount, 0).toFixed(2));
                const updatedTrade = { ...editingTrade, dividendEntries: newEntries, dividend: newTotal };
                setFormData(prev => ({...prev, dividend: newTotal.toString()}));
                await saveTrades(tradesRef.current.map(t => t.id === editingTrade.id ? updatedTrade : t));
                setEditingTrade(updatedTrade);
                setDividendAddVal('');
                setDividendAddDate(new Date().toISOString().split('T')[0]);
                setDividendAddActive(false);
            };

            const handleDeleteDividendEntry = (entryId) => {
                showConfirm('Delete Dividend Entry', 'Are you sure you want to delete this dividend entry?', async () => {
                const newEntries = (editingTrade.dividendEntries || []).filter(e => e.id !== entryId);
                const newTotal = parseFloat(newEntries.reduce((s, e) => s + e.amount, 0).toFixed(2));
                const updatedTrade = { ...editingTrade, dividendEntries: newEntries, dividend: newTotal };
                setFormData(prev => ({...prev, dividend: newTotal.toString()}));
                await saveTrades(tradesRef.current.map(t => t.id === editingTrade.id ? updatedTrade : t));
                setEditingTrade(updatedTrade);
                });
            };

            const calculateMetrics = (tradesList, cutoffDate = null) => {
                const openTrades = tradesList.filter(t => !t.exitDate);
                const closedTrades = tradesList.filter(t => t.exitDate);
                
                // Calculate realized profit (capital gains only from fully closed trades)
                const realizedProfit = closedTrades.reduce((sum, t) => sum + getEffectiveProfit(t), 0);
                
                // Calculate profit from partial exits - filter by exit date if cutoff provided
                const partialExitProfit = tradesList.reduce((sum, t) => {
                    if (t.partialExits && t.partialExits.length > 0) {
                        return sum + t.partialExits
                            .filter(pe => !cutoffDate || new Date(pe.exitDate) >= cutoffDate)
                            .reduce((pSum, pe) => pSum + pe.profit, 0);
                    }
                    return sum;
                }, 0);
                
                // Total capital gains = fully closed + partial exits
                const totalCapitalGains = realizedProfit + partialExitProfit;
                
                // Total dividends — use dated entries if available so timeframe filtering works
                const totalDividends = tradesList.reduce((sum, t) => {
                    if (t.dividendEntries && t.dividendEntries.length > 0) {
                        return sum + t.dividendEntries
                            .filter(e => !cutoffDate || new Date(e.date) >= cutoffDate)
                            .reduce((s, e) => s + e.amount, 0);
                    }
                    return sum + (t.dividend || 0);
                }, 0);
                
                // Total profit = capital gains + dividends
                const totalProfit = totalCapitalGains + totalDividends;
                
                const totalFees = tradesList.reduce((sum, t) => sum + t.fees, 0);
                const getBeThresholdForTrade = (t) => {
                    if (beType === '%') {
                        const costBasis = (t.entryPrice || 0) * (t.originalQty || t.qty || 0);
                        return costBasis > 0 ? (beThreshold / 100) * costBasis : 0;
                    }
                    return beThreshold;
                };
                const winningTrades = closedTrades.filter(t => getTotalProfit(t) > getBeThresholdForTrade(t));
                const losingTrades = closedTrades.filter(t => getTotalProfit(t) < -getBeThresholdForTrade(t));
                const evenTrades = closedTrades.filter(t => getTotalProfit(t) >= -getBeThresholdForTrade(t) && getTotalProfit(t) <= getBeThresholdForTrade(t));
                const totalWins = winningTrades.length;
                const totalLosses = losingTrades.length;
                const totalEvens = evenTrades.length;
                const winRate = totalWins + totalLosses > 0 ? (totalWins / (totalWins + totalLosses)) * 100 : 0;
                const avgWin = totalWins > 0 ? winningTrades.reduce((sum, t) => sum + getTotalProfit(t), 0) / totalWins : 0;
                const avgLoss = totalLosses > 0 ? losingTrades.reduce((sum, t) => sum + getTotalProfit(t), 0) / totalLosses : 0;
                let unrealizedPL = 0;
                openTrades.forEach(trade => {
                    const currentPrice = manualPrices[trade.symbol] || currentPrices[trade.symbol] || trade.entryPrice;
                    const pl = (trade.direction === 'short'
                        ? (trade.entryPrice - currentPrice)
                        : (currentPrice - trade.entryPrice)) * trade.qty - trade.fees;
                    unrealizedPL += pl;
                });
                
                // Calculate today's P/L - sum of (currentPrice - prevClose) * qty for each open trade
                // This matches exactly what the Chg column shows per row
                let todaysPL = 0;
                openTrades.forEach(trade => {
                    const liveCurrentPrice = currentPrices[trade.symbol]; // live price only, no manual fallback
                    const prevClose = prevClosePrices[trade.symbol];
                    if (liveCurrentPrice && prevClose) {
                        todaysPL += (trade.direction === 'short'
                            ? (prevClose - liveCurrentPrice)
                            : (liveCurrentPrice - prevClose)) * trade.qty;
                    }
                });
                
                // Market value = current value of open positions
                const marketValue = openTrades.reduce((sum, trade) => {
                    const currentPrice = manualPrices[trade.symbol] || currentPrices[trade.symbol] || trade.entryPrice;
                    return sum + (trade.qty * currentPrice);
                }, 0);

                return { 
                    realizedProfit: totalCapitalGains,
                    totalProfit,
                    unrealizedPL, 
                    totalDividends, 
                    totalFees, 
                    winRate,
                    avgWin,
                    avgLoss,
                    totalTrades: closedTrades.length, 
                    openPositions: openTrades.length, 
                    wins: totalWins, 
                    losses: totalLosses,
                    evens: totalEvens,
                    todaysPL,
                    marketValue
                };
            };

            const filterTradesByTimeframe = (tradesList, tf, customStart, customEnd) => {
                // Custom date range takes precedence
                if (tf === 'CUSTOM' && customStart && customEnd) {
                    const startDate = new Date(customStart);
                    const endDate = new Date(customEnd);
                    return tradesList.filter(t => {
                        if (!t.exitDate) return true; // Always include open positions
                        const exitTradeDate = new Date(t.exitDate);
                        return exitTradeDate >= startDate && exitTradeDate <= endDate;
                    });
                }
                
                if (tf === 'ALL') return tradesList;
                const now = new Date(); const cutoff = new Date();
                switch (tf) {
                    case '5D': cutoff.setDate(now.getDate() - 5); break;
                    case '1M': cutoff.setMonth(now.getMonth() - 1); break;
                    case '3M': cutoff.setMonth(now.getMonth() - 3); break;
                    case '6M': cutoff.setMonth(now.getMonth() - 6); break;
                    case '1Y': cutoff.setFullYear(now.getFullYear() - 1); break;
                    case '3Y': cutoff.setFullYear(now.getFullYear() - 3); break;
                    case 'YTD': cutoff.setMonth(0); cutoff.setDate(1); break;
                    default: return tradesList;
                }
                return tradesList.filter(t => !t.exitDate || new Date(t.exitDate) >= cutoff);
            };

            // For dashboard: use chartTimeframe (and custom dates if applicable)
            // For trades page: use timeframe
            const activeTrades = portfolioViewMode === 'all' && portfolios.length > 1 ? allPortfolioTrades : trades;
            const activeBalances = portfolioViewMode === 'all' && portfolios.length > 1 ? allPortfoliosBalances : startingBalances;
            const dashboardFilteredTrades = filterTradesByTimeframe(activeTrades, chartTimeframe, customStartDate, customEndDate);
            const filteredTrades = filterTradesByTimeframe(trades, timeframe, null, null);
            
            const getTimeframeCutoff = (tf, customStart) => {
                // For custom range, use the custom start date
                if (tf === 'CUSTOM' && customStart) {
                    return new Date(customStart);
                }
                
                if (tf === 'ALL') return null;
                const now = new Date(); const c = new Date();
                switch(tf) {
                    case '5D': c.setDate(now.getDate()-5); break;
                    case '1M': c.setMonth(now.getMonth()-1); break;
                    case '3M': c.setMonth(now.getMonth()-3); break;
                    case '6M': c.setMonth(now.getMonth()-6); break;
                    case '1Y': c.setFullYear(now.getFullYear()-1); break;
                    case '3Y': c.setFullYear(now.getFullYear()-3); break;
                    case 'YTD': c.setMonth(0); c.setDate(1); break;
                    default: return null;
                }
                return c;
            };
            
            // Calculate metrics for dashboard and trades page separately
            const dashboardMetrics = calculateMetrics(dashboardFilteredTrades, getTimeframeCutoff(chartTimeframe, customStartDate));
            const metrics = view === 'dashboard' ? dashboardMetrics : calculateMetrics(filteredTrades, getTimeframeCutoff(timeframe, null));

            // Per-currency return % based on starting balances — filtered by chart timeframe
            const isCAD = (symbol) => symbol && symbol.toUpperCase().endsWith(".TO");
            const currencyReturns = useMemo(() => {
                const usdDepositsDenom = (activeBalances.depositsUsd || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                const cadDepositsDenom = (activeBalances.depositsCad || []).reduce((s, d) => s + (parseFloat(d.amt) || 0), 0);
                const usdBal = parseFloat(activeBalances.usd) + (activeBalances.mode === 'current' ? usdDepositsDenom : 0);
                const cadBal = parseFloat(activeBalances.cad) + (activeBalances.mode === 'current' ? cadDepositsDenom : 0);
                const usdTrades = dashboardFilteredTrades.filter(t => !isCAD(t.symbol));
                const cadTrades = dashboardFilteredTrades.filter(t => isCAD(t.symbol));
                const calcReturn = (tradeList) => tradeList.reduce((sum, t) => {
                    const capitalGains = t.exitDate ? getTotalProfit(t) : ((t.partialExits && t.partialExits.length > 0) ? t.partialExits.reduce((s, pe) => s + (pe.profit || 0), 0) : 0);
                    const dividends = t.dividendEntries && t.dividendEntries.length > 0
                        ? t.dividendEntries.reduce((s, e) => s + e.amount, 0)
                        : (t.dividend || 0);
                    return sum + capitalGains + dividends;
                }, 0);
                const usdProfit = calcReturn(usdTrades);
                const cadProfit = calcReturn(cadTrades);
                return {
                    usd: (!isNaN(usdBal) && usdBal > 0) ? (usdProfit / usdBal) * 100 : null,
                    cad: (!isNaN(cadBal) && cadBal > 0) ? (cadProfit / cadBal) * 100 : null,
                    usdProfit,
                    cadProfit
                };
            }, [dashboardFilteredTrades, activeBalances, chartTimeframe, customStartDate, customEndDate]);
            
            const chartData = useMemo(() => {
                const now = new Date();
                let cutoff = new Date();
                
                // Handle custom date range
                if (chartTimeframe === 'CUSTOM' && customStartDate) {
                    cutoff = new Date(customStartDate);
                } else {
                    switch (chartTimeframe) {
                        case '5D':  cutoff.setDate(now.getDate() - 5); break;
                        case '1M':  cutoff.setMonth(now.getMonth() - 1); break;
                        case '3M':  cutoff.setMonth(now.getMonth() - 3); break;
                        case '6M':  cutoff.setMonth(now.getMonth() - 6); break;
                        case 'YTD': cutoff.setMonth(0); cutoff.setDate(1); break;
                        case '1Y':  cutoff.setFullYear(now.getFullYear() - 1); break;
                        case '3Y':  cutoff.setFullYear(now.getFullYear() - 3); break;
                        default:    cutoff.setFullYear(2000); break;
                    }
                }

                const endDate = (chartTimeframe === 'CUSTOM' && customEndDate) ? new Date(customEndDate) : null;

                const inWindow = (dateStr) => {
                    if (!dateStr) return false;
                    const d = new Date(dateStr);
                    if (d < cutoff) return false;
                    if (endDate && d > endDate) return false;
                    return true;
                };

                // Build a flat list of dated profit events — mirrors calculateMetrics exactly:
                // 1) full closes via getEffectiveProfit (remaining qty after partials, fees deducted)
                // 2) partial exits (each pe.profit, dated individually)
                // 3) dividends (individual dividendEntries if available, else flat dividend)
                const events = [];

                activeTrades.forEach(trade => {
                    // 1. Fully closed trade
                    if (trade.exitDate && inWindow(trade.exitDate)) {
                        events.push({ date: trade.exitDate, profit: getEffectiveProfit(trade) });
                    }

                    // 2. Partial exits (open or closed trades)
                    if (trade.partialExits && trade.partialExits.length > 0) {
                        trade.partialExits.forEach(pe => {
                            if (inWindow(pe.exitDate)) {
                                events.push({ date: pe.exitDate, profit: pe.profit });
                            }
                        });
                    }

                    // 3. Dividends — use dated entries when available for accurate placement
                    if (trade.dividendEntries && trade.dividendEntries.length > 0) {
                        trade.dividendEntries.forEach(de => {
                            if (inWindow(de.date)) {
                                events.push({ date: de.date, profit: de.amount });
                            }
                        });
                    } else if (trade.dividend) {
                        // Flat dividend fallback — plot on exit date, or entry date for open trades
                        const fallbackDate = trade.exitDate || trade.entryDate;
                        if (fallbackDate && inWindow(fallbackDate)) {
                            events.push({ date: fallbackDate, profit: trade.dividend });
                        }
                    }
                });

                if (events.length === 0) return [];

                // Sort all events chronologically then accumulate
                events.sort((a, b) => new Date(a.date) - new Date(b.date));

                let cumulative = 0;
                const points = [{ date: cutoff.toISOString().split('T')[0], profit: 0 }];
                events.forEach(evt => {
                    cumulative += evt.profit;
                    points.push({ date: evt.date, profit: parseFloat(cumulative.toFixed(2)) });
                });

                return points;
            }, [activeTrades, chartTimeframe, customStartDate, customEndDate]);

            const handleExportCSV = () => {
                const headers = ['Symbol','Name','Qty','Original Qty','Entry Price','Exit Price','Entry Date','Exit Date','Profit','Dividends','Fees','Notes','Partial Exits','Partial Adds','Direction','Dividend Entries'];
                const rows = trades.map(t => [
                    t.symbol,
                    `"${(t.name || '').replace(/"/g, '""')}"`,
                    t.qty,
                    t.originalQty || t.qty,
                    t.entryPrice,
                    t.exitPrice || '',
                    t.entryDate,
                    t.exitDate || '',
                    t.profit,
                    t.dividend || 0,
                    t.fees,
                    `"${(t.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                    t.partialExits && t.partialExits.length > 0 ? `"${JSON.stringify(t.partialExits).replace(/"/g, '""')}"` : '',
                    t.partialAdds && t.partialAdds.length > 0 ? `"${JSON.stringify(t.partialAdds).replace(/"/g, '""')}"` : '',
                    t.direction || 'long',
                    t.dividendEntries && t.dividendEntries.length > 0 ? `"${JSON.stringify(t.dividendEntries).replace(/"/g, '""')}"` : ''
                ]);
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `portfolio-export-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            };

            const handleExportJSON = async () => {
                // Fetch trades for every portfolio, not just the active one
                const allPortfolioData = await Promise.all(
                    portfolios.map(async (p) => {
                        const stored = await window.storage.get(`portfolio_trades_${p.id}`);
                        let trades = [];
                        if (stored?.value) {
                            try { trades = JSON.parse(stored.value); } catch(e) {}
                        }
                        return { id: p.id, name: p.name, trades, balances: loadBalancesForPortfolio(p.id) };
                    })
                );
                const backup = {
                    version: 5,
                    exportedAt: new Date().toISOString(),
                    portfolios: allPortfolioData,
                    activePortfolioId
                };
                const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
            };

            const handleImportJSON = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const backup = JSON.parse(event.target.result);
                        const hasBalances = backup.startingBalances && typeof backup.startingBalances === 'object';
                        const isV3 = backup.version >= 3 && Array.isArray(backup.portfolios);

                        if (isV3) {
                            // Full multi-portfolio restore
                            const totalTrades = backup.portfolios.reduce((s, p) => s + p.trades.length, 0);
                            const confirmMsg = `This will replace all current portfolios with ${backup.portfolios.length} portfolio(s) and ${totalTrades} total trades from the backup (exported ${new Date(backup.exportedAt).toLocaleDateString()}).${hasBalances ? ' Account balances and bonuses will also be restored.' : ''} Continue?`;
                            showConfirm('Restore Backup', confirmMsg, async () => {

                            // Restore each portfolio's trades and balances
                            for (const p of backup.portfolios) {
                                const migrated = p.trades.map(trade => ({
                                    ...trade,
                                    originalQty: trade.originalQty || trade.qty,
                                    partialExits: trade.partialExits || [],
                                    partialAdds: trade.partialAdds || [],
                                    dividendEntries: trade.dividendEntries || [],
                                    direction: trade.direction || 'long',
                                    screenshotUrls: trade.screenshotUrls || []
                                }));
                                await window.storage.set(`portfolio_trades_${p.id}`, JSON.stringify(migrated));
                                // v4: each portfolio has its own balances object
                                // v3 fallback: only active portfolio had balances at top level
                                if (p.balances) {
                                    saveBalancesForPortfolio(p.id, p.balances);
                                } else if (hasBalances && p.id === backup.activePortfolioId) {
                                    saveBalancesForPortfolio(p.id, backup.startingBalances);
                                }
                            }

                            // Restore portfolio list and active portfolio
                            const restoredPortfolios = backup.portfolios.map(p => ({ id: p.id, name: p.name }));
                            savePortfolios(restoredPortfolios);
                            const restoredActiveId = backup.activePortfolioId || restoredPortfolios[0].id;
                            setActivePortfolioId(restoredActiveId);
                            try { localStorage.setItem('pt_active_portfolio', restoredActiveId); } catch(e) {}
                            setStartingBalances(loadBalancesForPortfolio(restoredActiveId));

                            showToast("success", "Portfolio Restored", `${backup.portfolios.length} portfolio(s) and ${totalTrades} trades restored.`);
                            await loadTrades(restoredActiveId);
                            }); // end showConfirm V3

                        } else if (backup.trades && Array.isArray(backup.trades)) {
                            // Legacy v2 restore — single portfolio
                            const confirmMsg = `This will replace all ${trades.length} current trades with ${backup.trades.length} trades from the backup (exported ${new Date(backup.exportedAt).toLocaleDateString()}).${hasBalances ? ' Account balances and bonuses will also be restored.' : ''} Continue?`;
                            showConfirm('Restore Backup', confirmMsg, async () => {
                            const migratedTrades = backup.trades.map(trade => ({
                                ...trade,
                                originalQty: trade.originalQty || trade.qty,
                                partialExits: trade.partialExits || [],
                                partialAdds: trade.partialAdds || [],
                                dividendEntries: trade.dividendEntries || [],
                                direction: trade.direction || 'long',
                                screenshotUrls: trade.screenshotUrls || []
                            }));
                            await window.storage.set(`portfolio_trades_${activePortfolioId}`, JSON.stringify(migratedTrades));
                            if (hasBalances) {
                                setStartingBalances(backup.startingBalances);
                                try { saveBalancesForPortfolio(activePortfolioId, backup.startingBalances); } catch(e) {}
                            }
                            showToast("success", "Portfolio Restored", `${backup.trades.length} trades restored.`);
                            await loadTrades(activePortfolioId);
                            }); // end showConfirm legacy
                        } else {
                            showToast("error", "Invalid Backup", "No trades found in this file.");
                        }
                    } catch (err) {
                        showToast("error", "Restore Failed", "Could not read backup file. Make sure it's a valid JSON backup.");
                    }
                };
                reader.readAsText(file);
                e.target.value = '';
            };

            const handleSort = (column) => {
                if (sortColumn === column) {
                    // Toggle direction if clicking same column
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                    // New column, default to ascending
                    setSortColumn(column);
                    setSortDirection('asc');
                }
            };

            const sortTrades = (tradesToSort) => {
                if (!sortColumn) return tradesToSort;
                
                return [...tradesToSort].sort((a, b) => {
                    let aVal, bVal;
                    
                    switch (sortColumn) {
                        case 'symbol':
                            aVal = a.symbol.toLowerCase();
                            bVal = b.symbol.toLowerCase();
                            break;
                        case 'name':
                            aVal = (a.name || '').toLowerCase();
                            bVal = (b.name || '').toLowerCase();
                            break;
                        case 'qty':
                            aVal = a.qty;
                            bVal = b.qty;
                            break;
                        case 'originalQty':
                            aVal = a.originalQty || a.qty;
                            bVal = b.originalQty || b.qty;
                            break;
                        case 'entryPrice':
                            aVal = a.entryPrice;
                            bVal = b.entryPrice;
                            break;
                        case 'exitPrice':
                            aVal = a.exitPrice || 0;
                            bVal = b.exitPrice || 0;
                            break;
                        case 'entryDate':
                            aVal = new Date(a.entryDate);
                            bVal = new Date(b.entryDate);
                            break;
                        case 'exitDate':
                            aVal = a.exitDate ? new Date(a.exitDate) : new Date('9999-12-31');
                            bVal = b.exitDate ? new Date(b.exitDate) : new Date('9999-12-31');
                            break;
                        case 'marketValue':
                            // For closed trades: qty * exitPrice
                            // For open trades: qty * currentPrice
                            aVal = a.exitDate ? (a.qty * (a.exitPrice || a.entryPrice)) : (a.qty * (manualPrices[a.symbol] || currentPrices[a.symbol] || a.entryPrice));
                            bVal = b.exitDate ? (b.qty * (b.exitPrice || b.entryPrice)) : (b.qty * (manualPrices[b.symbol] || currentPrices[b.symbol] || b.entryPrice));
                            break;
                        case 'profit':
                            aVal = getEffectiveProfit(a);
                            bVal = getEffectiveProfit(b);
                            break;
                        case 'totalProfit':
                            aVal = getEffectiveProfit(a) + (a.dividend || 0);
                            bVal = getEffectiveProfit(b) + (b.dividend || 0);
                            break;
                        case 'changePercent':
                            // For open trades: compare current price to entry
                            // For closed trades: compare exit price to entry
                            const aPrice = a.exitDate ? (a.exitPrice || a.entryPrice) : (manualPrices[a.symbol] || currentPrices[a.symbol] || a.entryPrice);
                            const bPrice = b.exitDate ? (b.exitPrice || b.entryPrice) : (manualPrices[b.symbol] || currentPrices[b.symbol] || b.entryPrice);
                            aVal = ((aPrice - a.entryPrice) / a.entryPrice) * 100;
                            bVal = ((bPrice - b.entryPrice) / b.entryPrice) * 100;
                            break;
                        case 'totalChg':
                            // Exit price - Entry price (for all trades)
                            const aTotalChgPrice = a.exitDate ? (a.exitPrice || a.entryPrice) : (manualPrices[a.symbol] || currentPrices[a.symbol] || a.entryPrice);
                            const bTotalChgPrice = b.exitDate ? (b.exitPrice || b.entryPrice) : (manualPrices[b.symbol] || currentPrices[b.symbol] || b.entryPrice);
                            aVal = a.direction === 'short' ? a.entryPrice - aTotalChgPrice : aTotalChgPrice - a.entryPrice;
                            bVal = b.direction === 'short' ? b.entryPrice - bTotalChgPrice : bTotalChgPrice - b.entryPrice;
                            break;
                        case 'chg':
                            // Current day change (only for open trades, 0 for closed)
                            const aCurr = manualPrices[a.symbol] || currentPrices[a.symbol] || 0;
                            const bCurr = manualPrices[b.symbol] || currentPrices[b.symbol] || 0;
                            aVal = a.exitDate ? 0 : (a.direction === 'short' ? (prevClosePrices[a.symbol] || aCurr) - aCurr : aCurr - (prevClosePrices[a.symbol] || aCurr));
                            bVal = b.exitDate ? 0 : (b.direction === 'short' ? (prevClosePrices[b.symbol] || bCurr) - bCurr : bCurr - (prevClosePrices[b.symbol] || bCurr));
                            break;
                        case 'todaysProfit':
                            // Today's profit = direction-adjusted (current - prevClose) * qty
                            const aCurrPrice = manualPrices[a.symbol] || currentPrices[a.symbol] || 0;
                            const bCurrPrice = manualPrices[b.symbol] || currentPrices[b.symbol] || 0;
                            const aDayChg = a.exitDate ? 0 : (a.direction === 'short' ? (prevClosePrices[a.symbol] || aCurrPrice) - aCurrPrice : aCurrPrice - (prevClosePrices[a.symbol] || aCurrPrice));
                            const bDayChg = b.exitDate ? 0 : (b.direction === 'short' ? (prevClosePrices[b.symbol] || bCurrPrice) - bCurrPrice : bCurrPrice - (prevClosePrices[b.symbol] || bCurrPrice));
                            aVal = aDayChg * a.qty;
                            bVal = bDayChg * b.qty;
                            break;
                        default:
                            return 0;
                    }
                    
                    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                    return 0;
                });
            };

            let displayTrades = filteredTrades;
            if (tradeView === 'open') displayTrades = filteredTrades.filter(t => !t.exitDate);
            if (tradeView === 'closed') displayTrades = filteredTrades.filter(t => t.exitDate);

            // Apply search filter
            if (searchTerm.trim()) {
                displayTrades = displayTrades.filter(t => 
                    t.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (t.name && t.name.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }

            // Apply sorting
            displayTrades = sortTrades(displayTrades);

            // Only show split columns (Orig Qty / Remaining) if we're showing open trades AND any have partial exits
            const showSplitQtyColumns = tradeView !== 'closed' && displayTrades.some(t => !t.exitDate && ((t.partialExits || []).length > 0 || (t.partialAdds || []).length > 0));
            
            // Only show Chg column (intraday change) when viewing open trades
            const showChgColumn = tradeView !== 'closed';

            if (isLoading) {
                return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: T.pageBg, color: T.textPrimary }}>
                    <div style={{ fontSize: '1.2rem' }}>Loading...</div>
                </div>;
            }

            // ── Tag Performance Chart ─────────────────────────────
            const TagPerformanceChart = () => {
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
            };

            // ── Sidebar ───────────────────────────────────────────
            const renderSidebar = () => {
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
            };

            // ── Screenshot UI helpers ─────────────────────────────────────────
            const handleScreenshotFile = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const totalCount = screenshotUrls.length + pendingBlobs.length;
                if (totalCount < 10) setPendingBlobs(prev => [...prev, file]);
                setIsPasteActive(false);
                e.target.value = '';
            };

            const ScreenshotSection = ({ fileInputRef }) => {
                const totalCount = screenshotUrls.length + pendingBlobs.length;
                const atMax = totalCount >= 10;
                const allItems = [
                    ...screenshotUrls.map(url => ({ type: 'url', src: url })),
                    ...pendingBlobs.map(blob => ({ type: 'blob', src: blob instanceof Blob ? URL.createObjectURL(blob) : null }))
                ].filter(item => item.src);
                const removeItem = (idx) => {
                    const isUploaded = idx < screenshotUrls.length;
                    if (isUploaded) {
                        showConfirm(
                            'Delete Screenshot',
                            'Are you sure you want to remove this screenshot?',
                            () => setScreenshotUrls(prev => prev.filter((_, i) => i !== idx))
                        );
                    } else {
                        setPendingBlobs(prev => prev.filter((_, i) => i !== (idx - screenshotUrls.length)));
                    }
                };
                return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>
                            Screenshots
                            <span style={{ color: T.textFaint, fontSize: '0.68rem', fontWeight: 400, marginLeft: '0.4rem', textTransform: 'none' }}>
                                {totalCount > 0 ? `${totalCount}/10` : 'optional'}
                            </span>
                        </label>
                        <div style={{ flex: 1, minHeight: '80px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {allItems.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                    {allItems.map((item, idx) => (
                                        <div key={idx} style={{ position: 'relative', width: 80, height: 60, borderRadius: '3px', overflow: 'hidden', border: `1px solid ${item.type === 'blob' ? T.amber : T.borderStrong}`, flexShrink: 0 }}>
                                            <img src={item.src} alt={`screenshot ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                                                onClick={() => setLightboxData({ srcs: allItems.map(i => i.src), index: idx })}
                                            />
                                            {item.type === 'blob' && (
                                                <div style={{ position: 'absolute', bottom: 1, left: 1, fontSize: '0.45rem', fontWeight: '700', color: T.amber, background: 'rgba(0,0,0,0.65)', padding: '0 2px', borderRadius: '2px', lineHeight: 1.4 }}>PENDING</div>
                                            )}
                                            <button onClick={() => removeItem(idx)} style={{ position: 'absolute', top: 1, right: 1, width: 14, height: 14, borderRadius: '50%', background: 'rgba(0,0,0,0.75)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: '900', lineHeight: 1 }} title="Remove">&#x2715;</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {uploadingScreenshots && (
                                <div style={{ fontSize: '0.68rem', color: T.blue, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', border: `2px solid ${T.blue}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                                    Uploading...
                                </div>
                            )}
                            {!atMax && (
                                <div style={{ flex: allItems.length === 0 ? 1 : 0, minHeight: allItems.length === 0 ? '80px' : 'unset', border: isPasteActive ? `1px dashed ${T.blue}` : 'none', borderRadius: '4px', background: isPasteActive ? 'rgba(0,204,255,0.04)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.55rem', transition: 'all 0.15s' }}>
                                    {isPasteActive ? (
                                        <>
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,204,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.blue }}><ClipboardIcon size={13} /></div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ color: T.blue, fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.05em' }}>READY</div>
                                                <div style={{ color: T.textMuted, fontSize: '0.62rem', marginTop: '0.15rem' }}>Press Cmd/Ctrl+V</div>
                                            </div>
                                            <button onClick={() => setIsPasteActive(false)} style={{ fontSize: '0.6rem', color: T.textFaint, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            {allItems.length === 0 && <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.raisedBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textFaint }}><CameraIcon size={13} /></div>}
                                            <div style={{ display: 'flex', gap: '0.3rem', width: '100%' }}>
                                                <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: '0.4rem 0.3rem', background: T.raisedBg, border: `1px solid ${T.borderStrong}`, borderRadius: '3px', color: T.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.65rem', fontWeight: '600' }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.color = T.blue; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.color = T.textSecondary; }}>
                                                    <CameraIcon size={11} /> ATTACH
                                                </button>
                                                <button onClick={() => setIsPasteActive(true)} style={{ flex: 1, padding: '0.4rem 0.3rem', background: T.raisedBg, border: `1px dashed ${T.borderStrong}`, borderRadius: '3px', color: T.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.65rem', fontWeight: '600' }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.color = T.blue; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.color = T.textSecondary; }}>
                                                    <ClipboardIcon size={11} /> PASTE
                                                </button>
                                            </div>
                                        </>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={handleScreenshotFile} />
                                </div>
                            )}
                            {atMax && <div style={{ padding: '0.35rem', textAlign: 'center', color: T.textFaint, fontSize: '0.65rem', fontWeight: '600', letterSpacing: '0.05em' }}>10 / 10 MAX REACHED</div>}
                        </div>
                    </div>
                );
            };

            // Lightbox gallery
            const lightboxJSX = lightboxData ? (() => {
                const { srcs, index } = lightboxData;
                const total = srcs.length;
                const goPrev = (e) => { e.stopPropagation(); setLightboxData(d => ({ ...d, index: (d.index - 1 + total) % total })); };
                const goNext = (e) => { e.stopPropagation(); setLightboxData(d => ({ ...d, index: (d.index + 1) % total })); };
                return (
                    <div onClick={() => setLightboxData(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <div style={{ position: 'relative', maxWidth: '85vw', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
                            <img src={srcs[index]} alt={`Screenshot ${index + 1}`} style={{ maxWidth: '85vw', maxHeight: '85vh', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', display: 'block' }} />
                            {total > 1 && (
                                <>
                                    <button onClick={goPrev} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.35'} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', zIndex: 1, lineHeight: 1, opacity: '0.35', transition: 'opacity 0.15s' }}>&#x2039;</button>
                                    <button onClick={goNext} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.35'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', zIndex: 1, lineHeight: 1, opacity: '0.35', transition: 'opacity 0.15s' }}>&#x203a;</button>
                                    <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.55)', borderRadius: '10px', padding: '0.15rem 0.6rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{index + 1} / {total}</div>
                                </>
                            )}
                            <button onClick={() => setLightboxData(null)} style={{ position: 'absolute', top: -14, right: -14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(30,30,30,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' }}>&#x2715;</button>
                        </div>
                    </div>
                );
            })() : null;
            // ─────────────────────────────────────────────────────────────────

                        const renderSharedModals = () => (<>
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
                                            <ScreenshotSection fileInputRef={screenshotFileRef} />
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

            if (view === 'dashboard') {
                return (
                    <div style={{ minHeight: '100vh', padding: '2rem', background: T.pageBg, color: T.textPrimary, marginLeft: '220px' }}>
                        {renderSidebar()}
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
                                                ? startingBalances.incentives.reduce((s, i) => s + (parseFloat(i.amt) || 0), 0) : 0;
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
                                                                            setBalanceDraft(d => ({ ...d, incentives: [...(d.incentives || []), { desc: d.newIncentiveDesc, amt: d.newIncentiveAmt }], newIncentiveDesc: '', newIncentiveAmt: '' }));
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

                        {renderSharedModals()}

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

            // ── Stats View ────────────────────────────────────────
            if (view === 'stats') {
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
                        {renderSidebar()}
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
                                    <TagPerformanceChart />

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
                    {renderSharedModals()}
                    </div>
                );
            }


            // ── Calendar View ─────────────────────────────────────
            if (view === 'calendar') {
                const now = new Date();
                const GF = "'Geist', 'Inter', -apple-system, sans-serif";
                const GM = "'Geist Mono', 'DM Mono', monospace";

                const calDayMap = (() => {
                    const map = {};
                    const addToMap = (dateKey, pnl, sym) => {
                        if (!map[dateKey]) map[dateKey] = { pnl: 0, tradeCount: 0, symbols: [] };
                        map[dateKey].pnl += pnl;
                        map[dateKey].tradeCount += 1;
                        if (sym && !map[dateKey].symbols.includes(sym)) map[dateKey].symbols.push(sym);
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
                            {renderSidebar()}
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
                            {renderSidebar()}
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
                        {renderSidebar()}
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
                                                                {symbols.slice(0,8).map(s => <div key={s} style={{ fontSize:'0.78rem', fontWeight:'600', color:T.textPrimary, fontFamily:GM, lineHeight:'1.7' }}>{s}</div>)}
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

                        // Trades View - CONTINUED IN PART 2 due to length
            const toastColors = { success: '#00ff88', error: '#ff4444', warning: '#ffaa00', info: '#00aadd' };
            const toastIcons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

            if (view === 'trades') { return (
                <div style={{ minHeight: '100vh', padding: '2rem', background: T.pageBg, color: T.textPrimary, marginLeft: '220px' }}>
                    {renderSidebar()}
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
                                            const partialExitProfit = partialExits.reduce((sum, pe) => sum + pe.profit, 0);
                                            const liveProfit = isOpen
                                                ? (trade.direction === 'short' 
                                                    ? (trade.entryPrice - currentPrice) * trade.qty - trade.fees
                                                    : (currentPrice - trade.entryPrice) * trade.qty - trade.fees)
                                                : getEffectiveProfit(trade) + partialExitProfit;
                                            const totalProfit = liveProfit + (trade.dividend || 0);
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
                                                <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: '600', color: liveProfit >= 0 ? T.green : T.red }}>
                                                    {liveProfit >= 0 ? '+' : ''}${liveProfit.toFixed(2)}
                                                </td>
                                                <td style={{ padding: '0.6rem 0.7rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: '600', color: totalProfit >= 0 ? T.green : T.red }}>
                                                    {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
                                                    {trade.dividend > 0 && <div style={{ fontSize: '0.7rem', color: T.blue, marginTop: '2px' }}>+${trade.dividend.toFixed(2)} div</div>}
                                                </td>
                                                <td style={{ padding: '0.6rem 0.7rem' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', minWidth: '52px', textAlign: 'center', letterSpacing: '-0.02em',
                                                        background: isOpen ? T.blueBg : (liveProfit >= -5 && liveProfit <= 5 ? T.borderStrong : (liveProfit > 5 ? T.greenBgDim : T.redBg)),
                                                        color: isOpen ? T.blue : (liveProfit >= -5 && liveProfit <= 5 ? T.textMuted : (liveProfit > 5 ? T.green : T.red)) }}>
                                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0, background: isOpen ? T.blue : (liveProfit >= -5 && liveProfit <= 5 ? T.textMuted : (liveProfit > 5 ? T.green : T.red)) }} />
                                                        {isOpen ? 'OPEN' : (liveProfit >= -5 && liveProfit <= 5 ? 'EVEN' : (liveProfit > 5 ? 'WIN' : 'LOSS'))}
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
                                                <ScreenshotSection fileInputRef={screenshotFileEditRef} />
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
                {renderSharedModals()}
                {lightboxJSX}
                </div>
            ); }


            // ── Journal View ──────────────────────────────────────
            if (view === 'journal') {
                const journalTrades = (portfolioViewMode === 'all' && portfolios.length > 1 ? allPortfolioTrades : trades)
                    .filter(t => t.notes && t.notes.trim().length > 0);

                const extractTags = (text) => (text.match(/#\w+/g) || []).map(t => t.toLowerCase());
                const allTags = [...new Set(journalTrades.flatMap(t => extractTags(t.notes || '')))].sort();

                const getOutcome = (t) => {
                    if (!t.exitDate) return 'open';
                    const p = getEffectiveProfit(t);
                    return p > 0 ? 'win' : p < 0 ? 'loss' : 'even';
                };

                const filteredJournal = journalTrades.filter(t => {
                    const outcome = getOutcome(t);
                    const matchesOutcome = journalFilter === 'all' || outcome === journalFilter;
                    const matchesTag = !journalActiveTag || extractTags(t.notes || '').includes(journalActiveTag);
                    const q = journalSearch.toLowerCase();
                    const matchesSearch = !q || (t.symbol || '').toLowerCase().includes(q)
                        || (t.name || '').toLowerCase().includes(q)
                        || (t.notes || '').toLowerCase().includes(q);
                    return matchesOutcome && matchesTag && matchesSearch;
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
                const purpleBorder= isDark ? 'rgba(167,139,250,0.25)' : 'rgba(124,58,237,0.2)';

                return (<>
                    <div style={{ marginLeft: '220px', height: '100vh', display: 'flex', flexDirection: 'column', background: T.pageBg, color: T.textPrimary, overflow: 'visible' }}>
                        {renderSidebar()}
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
                                <div style={{ overflowY: 'auto', flex: 1 }}>
                                    {filteredJournal.length === 0 ? (
                                        <div style={{ padding: '24px 14px', textAlign: 'center', color: T.textFaint, fontSize: '0.78rem' }}>
                                            {journalTrades.length === 0 ? 'No trades with notes yet' : 'No entries match'}
                                        </div>
                                    ) : filteredJournal.map(t => {
                                        const outcome = getOutcome(t);
                                        const isActive = activeEntry?.id === t.id;
                                        const outcomeColor = outcome === 'win' ? T.green : outcome === 'loss' ? T.red : T.blue;
                                        const outcomeBg    = outcome === 'win' ? (isDark ? 'rgba(0,255,136,0.12)' : 'rgba(5,150,105,0.1)') : outcome === 'loss' ? (isDark ? 'rgba(255,68,68,0.12)' : 'rgba(220,38,38,0.08)') : (isDark ? 'rgba(0,204,255,0.12)' : 'rgba(2,132,199,0.1)');
                                        return (
                                            <div key={t.id} onClick={() => setJournalSelected(t)}
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
                                                    </div>
                                                    <span style={{ fontSize: '0.68rem', color: T.textFaint }}>{t.exitDate || t.entryDate}</span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: T.textSecondary, lineHeight: '1.4',
                                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {(t.notes || '').replace(/#\w+/g, m => m)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Detail panel ── */}
                            <div style={{ flex: 1, background: T.panelBg, overflowY: 'auto' }}>
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
                                    const profit = t.exitPrice != null
                                        ? (t.direction === 'short'
                                            ? (t.entryPrice - t.exitPrice) * t.qty
                                            : (t.exitPrice - t.entryPrice) * t.qty)
                                        : null;
                                    const profitPct = profit != null ? (profit / (t.entryPrice * t.qty)) * 100 : null;
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
                    {lightboxJSX}
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
}
