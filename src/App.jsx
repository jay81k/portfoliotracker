import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import './main.css';
import './risk-calc.css';
import './utils/storage';   // installs window.storage (localStorage shim) before anything uses it
import { PROXY } from './utils/config';
import { uploadToImgbb } from './utils/storage';
import { KNOWN_SYMBOLS } from './utils/symbols';
import { getTheme } from './utils/theme';
import { getEffectiveProfit, getTotalProfit } from './utils/tradeMath';
import CalendarView from './views/CalendarView';
import DashboardView from './views/DashboardView';
import JournalView from './views/JournalView';
import StatsView from './views/StatsView';
import TradesView from './views/TradesView';

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

            const T = getTheme(isDark);




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



            // Returns true if US markets are currently open (Mon–Fri, 9:30–16:00 ET)
            const isMarketOpen = () => {
                // Get current time in US Eastern (handles EST/EDT automatically)
                const now = new Date();
                const etStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
                const et = new Date(etStr);
                const day = et.getDay(); // 0=Sun, 6=Sat
                if (day === 0 || day === 6) return false;
                const hours = et.getHours();
                const minutes = et.getMinutes();
                const timeInMinutes = hours * 60 + minutes;
                return timeInMinutes >= 9 * 60 + 30 && timeInMinutes < 16 * 60;
            };

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
                    // During market hours poll every 60s; outside hours retry every 5min in case of transient CORS failures
                    const interval = setInterval(() => fetchCurrentPricesRef.current?.(), isMarketOpen() ? 60000 : 5 * 60 * 1000);
                    return () => clearInterval(interval);
                }
            }, [trades]);


            const fetchPriceForSymbol = async (symbol) => {
                try {
                    const url = `${PROXY}?symbol=${encodeURIComponent(symbol)}&interval=1d&range=2d`;
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const data = await response.json();
                    const result = data?.chart?.result?.[0];
                    const currentPrice = result?.meta?.regularMarketPrice;
                    const metaPrevClose = result?.meta?.previousClose;
                    const closes = result?.indicators?.quote?.[0]?.close || [];
                    const candlePrevClose = closes.find(c => c != null) || null;
                    const previousClose = metaPrevClose || candlePrevClose || null;
                    if (currentPrice && currentPrice > 0) {
                        return { currentPrice, previousClose };
                    }
                } catch (e) {
                    console.warn(`Price fetch failed for ${symbol}:`, e.message);
                }
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
                    // Preserve existing current price as fallback only
                    if (currentPrices[symbol]) {
                        newPrices[symbol] = currentPrices[symbol];
                    }
                    // Do NOT seed prevClose from stale state — always use freshly fetched value.
                    // Seeding caused CHG/DAY% to be calculated against an old previousClose.
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
                    try {
                        // Fetch 1: 2d/1d for price + previousClose from candles
                        const dailyUrl = `${PROXY}?symbol=${encodeURIComponent(symbol)}&interval=1d&range=2d`;
                        const dailyRes = await fetch(dailyUrl);
                        if (!dailyRes.ok) return;
                        const dailyData = await dailyRes.json();
                        const daily = dailyData?.chart?.result?.[0];
                        const price = daily?.meta?.regularMarketPrice;
                        if (!price || price <= 0) return;

                        const metaPrevClose = daily?.meta?.previousClose;
                        const dailyCloses = daily?.indicators?.quote?.[0]?.close || [];
                        const candlePrevClose = dailyCloses.find(c => c != null) || null;
                        const prevClose = metaPrevClose || candlePrevClose || null;

                        // Fetch 2: 1d/5m for sparkline
                        let sparkline = [];
                        try {
                            const intradayUrl = `${PROXY}?symbol=${encodeURIComponent(symbol)}&interval=5m&range=1d`;
                            const intradayRes = await fetch(intradayUrl);
                            if (intradayRes.ok) {
                                const intradayData = await intradayRes.json();
                                const intraday = intradayData?.chart?.result?.[0];
                                sparkline = (intraday?.indicators?.quote?.[0]?.close || []).filter(v => v != null);
                            }
                        } catch (e) { /* sparkline optional */ }

                        results[key] = { price, prevClose, sparkline };
                    } catch (e) {
                        console.warn(`Index fetch failed for ${symbol}:`, e.message);
                    }
                }));
                if (Object.keys(results).length > 0) setIndexQuotes(prev => ({ ...prev, ...results }));
            };

            React.useEffect(() => {
                // Always fetch once to show last known prices
                fetchIndexQuotes();
                // During market hours poll every 5min; outside hours retry every 15min for CORS resilience
                const interval = setInterval(fetchIndexQuotes, isMarketOpen() ? 5 * 60 * 1000 : 15 * 60 * 1000);
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

            const saveTrades = async (newTrades) => {
                setTrades(newTrades);
                await window.storage.set(`portfolio_trades_${activePortfolioId}`, JSON.stringify(newTrades));
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

                const peGross = (editingTrade.direction === 'short'
                    ? (editingTrade.entryPrice - parseFloat(partialExitForm.exitPrice)) * exitQty
                    : (parseFloat(partialExitForm.exitPrice) - editingTrade.entryPrice) * exitQty);
                const peFees = (exitQty / (editingTrade.originalQty || editingTrade.qty)) * (editingTrade.fees || 0);
                const partialExit = {
                    id: Date.now(),
                    qty: exitQty,
                    exitPrice: parseFloat(partialExitForm.exitPrice),
                    exitDate: partialExitForm.exitDate,
                    fees: peFees,
                    grossProfit: peGross,
                    profit: peGross - peFees
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

                const updPeGross = (editingTrade.direction === 'short'
                    ? (editingTrade.entryPrice - parseFloat(partialExitForm.exitPrice)) * exitQty
                    : (parseFloat(partialExitForm.exitPrice) - editingTrade.entryPrice) * exitQty);
                const updPeFees = (exitQty / (editingTrade.originalQty || editingTrade.qty)) * (editingTrade.fees || 0);
                const updatedPartialExit = {
                    ...oldExit,
                    qty: exitQty,
                    exitPrice: parseFloat(partialExitForm.exitPrice),
                    exitDate: partialExitForm.exitDate,
                    fees: updPeFees,
                    grossProfit: updPeGross,
                    profit: updPeGross - updPeFees
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
                    // Lump-sum dividend with no dated entries — only include when no timeframe filter is active
                    if (!cutoffDate) return sum + (t.dividend || 0);
                    return sum;
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
                    // Only count unrealized P&L for trades entered within the timeframe
                    if (cutoffDate && trade.entryDate && new Date(trade.entryDate) < cutoffDate) return;
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
                    openPositions: openTrades.filter(t => !cutoffDate || !t.entryDate || new Date(t.entryDate) >= cutoffDate).length, 
                    wins: totalWins, 
                    losses: totalLosses,
                    evens: totalEvens,
                    todaysPL,
                    marketValue
                };
            };

            const filterTradesByTimeframe = (tradesList, tf, customStart, customEnd) => {
                if (tf === 'CUSTOM' && customStart && customEnd) {
                    const startDate = new Date(customStart);
                    const endDate = new Date(customEnd);
                    return tradesList.filter(t => {
                        if (!t.exitDate) {
                            const enteredInRange = t.entryDate && new Date(t.entryDate) >= startDate && new Date(t.entryDate) <= endDate;
                            const hasDivInRange = (t.dividendEntries || []).some(e => { const d = new Date(e.date); return d >= startDate && d <= endDate; });
                            return enteredInRange || hasDivInRange;
                        }
                        return new Date(t.exitDate) >= startDate && new Date(t.exitDate) <= endDate;
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
                return tradesList.filter(t => {
                    if (!t.exitDate) {
                        const enteredInWindow = t.entryDate && new Date(t.entryDate) >= cutoff;
                        const hasDivInWindow = (t.dividendEntries || []).some(e => new Date(e.date) >= cutoff);
                        return enteredInWindow || hasDivInWindow;
                    }
                    return new Date(t.exitDate) >= cutoff;
                });
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
                const cutoff = getTimeframeCutoff(chartTimeframe, customStartDate);
                const usdTrades = dashboardFilteredTrades.filter(t => !isCAD(t.symbol));
                const cadTrades = dashboardFilteredTrades.filter(t => isCAD(t.symbol));
                const calcReturn = (tradeList) => tradeList.reduce((sum, t) => {
                    // Capital gains — closed trades only, already filtered by exit date
                    const capitalGains = t.exitDate
                        ? getTotalProfit(t)
                        : (t.partialExits && t.partialExits.length > 0)
                            ? t.partialExits
                                .filter(pe => !cutoff || new Date(pe.exitDate) >= cutoff)
                                .reduce((s, pe) => s + (pe.profit || 0), 0)
                            : 0;
                    // Dividends — filter by date if cutoff active
                    const dividends = t.dividendEntries && t.dividendEntries.length > 0
                        ? t.dividendEntries
                            .filter(e => !cutoff || new Date(e.date) >= cutoff)
                            .reduce((s, e) => s + e.amount, 0)
                        : (!cutoff ? (t.dividend || 0) : 0);
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
                if (!sortColumn) {
                    return [...tradesToSort].sort((a, b) => {
                        const aDate = a.entryDate ? new Date(a.entryDate) : new Date(0);
                        const bDate = b.entryDate ? new Date(b.entryDate) : new Date(0);
                        return bDate - aDate; // most recent first
                    });
                }
                
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
                            aVal = getTotalProfit(a) + (a.dividend || 0);
                            bVal = getTotalProfit(b) + (b.dividend || 0);
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



            // ── Screenshot UI helpers ─────────────────────────────────────────
            const handleScreenshotFile = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const totalCount = screenshotUrls.length + pendingBlobs.length;
                if (totalCount < 10) setPendingBlobs(prev => [...prev, file]);
                setIsPasteActive(false);
                e.target.value = '';
            };


            // ─────────────────────────────────────────────────────────────────


            // Shared app state and handlers, passed (spread as props) to every extracted view and shared component.
            const ctx = {
                INDEX_CONFIG, T, activeBalances, activePortfolioId, activeTrades, allPortfolioTrades,
                balanceDraft, balanceEditorRef, beThreshold, beType, calMonth, calSubView, calSymbolPopover,
                calYear, chartData, chartTimeframe, confirmDialog, currencyReturns, currentPrices,
                customEndDate, customStartDate, dashMenuOpen, dashboardFilteredTrades, deltaLookback,
                displayTrades, dividendAddActive, dividendAddDate, dividendAddVal, editingPartialExit,
                editingPortfolioId, editingPortfolioName, editingPrice, editingTrade, expandedTrade,
                fetchCurrentPrices, fetchSymbolName, fetchingName, fetchingPrices, filteredTrades, formData,
                getTimeframeCutoff, handleAddDividendEntry, handleAddPartialAdd, handleAddPartialExit,
                handleAddPortfolio, handleAddTrade, handleCSVUpload, handleClearPortfolio,
                handleConfirmDeletePortfolio, handleDeleteDividendEntry, handleDeletePartialAdd,
                handleDeletePartialExit, handleDeletePortfolio, handleDeleteTrade, handleEditPartialExit,
                handleEditTrade, handleExportCSV, handleExportJSON, handleImportJSON, handleRenamePortfolio,
                handleScreenshotFile, handleSort, handleSwitchPortfolio, handleUpdatePartialExit,
                handleUpdateTrade, indexQuotes, isCAD, isDark, isPasteActive, lightboxData, manualPrices,
                metrics, newPortfolioName, notesTab, partialAddForm, partialExitForm, partialType, pendingBlobs,
                portfolioToDelete, portfolioViewMode, portfolios, prevClosePrices, processingCSV, resetFormData,
                saveBalancesForPortfolio, saveTrades, screenshotFileEditRef, screenshotFileRef, screenshotUrls,
                searchTerm, setBalanceDraft, setBeThreshold, setBeType, setCalMonth, setCalSubView,
                setCalSymbolPopover, setCalYear, setChartTimeframe, setConfirmDialog, setCustomEndDate,
                setCustomStartDate, setDashMenuOpen, setDeltaLookback, setDividendAddActive, setDividendAddDate,
                setDividendAddVal, setEditingPartialExit, setEditingPortfolioId, setEditingPortfolioName,
                setEditingPrice, setEditingTrade, setExpandedTrade, setFetchingName, setFormData,
                setIsPasteActive, setLightboxData, setManualPrices, setNewPortfolioName, setNotesTab,
                setPartialAddForm, setPartialExitForm, setPartialType, setPendingBlobs, setPortfolioToDelete,
                setPortfolioViewMode, setScreenshotUrls, setSearchTerm, setShowAddPortfolio, setShowAddTrade,
                setShowBalanceEditor, setShowBeTooltip, setShowCSVUpload, setShowClearConfirm,
                setShowCustomDatePicker, setShowDeletePortfolioConfirm, setShowDeltaTooltip, setShowEditTrade,
                setShowExportMenu, setShowImportMenu, setShowLookbackTooltip, setShowPartialExit,
                setShowWinRateSettings, setStartingBalances, setStatsDistMonth, setStatsDistYear,
                setStatsMenuOpen, setStatsTrackerYear, setTagMetric, setTimeframe, setTradeActivityExpanded,
                setTradeView, setView, setWinRateSettingsDraft, showAddPortfolio, showAddTrade,
                showBalanceEditor, showBeTooltip, showCSVUpload, showChgColumn, showClearConfirm, showConfirm,
                showCustomDatePicker, showDeletePortfolioConfirm, showDeltaTooltip, showEditTrade,
                showExportMenu, showImportMenu, showLookbackTooltip, showPartialExit, showSplitQtyColumns,
                showToast, showWinRateSettings, sortColumn, sortDirection, startingBalances, statsDistMonth,
                statsDistYear, statsMenuOpen, statsTrackerYear, tagMetric, timeframe, toggleTheme,
                tradeActivityExpanded, tradeView, trades, tradesRef, uploadingScreenshots, view,
                winRateSettingsDraft,
            };

            if (view === 'dashboard') {
                return <DashboardView {...ctx} />;
            }

            // ── Stats View ────────────────────────────────────────
            if (view === 'stats') {
                return <StatsView {...ctx} />;
            }


            // ── Calendar View ─────────────────────────────────────
            if (view === 'calendar') {
                return <CalendarView {...ctx} />;
            }

                        // Trades View - CONTINUED IN PART 2 due to length
            const toastColors = { success: '#00ff88', error: '#ff4444', warning: '#ffaa00', info: '#00aadd' };
            const toastIcons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

            if (view === 'trades') {
                return <TradesView {...ctx} />;
            }


            // ── Journal View ──────────────────────────────────────
            if (view === 'journal') {
                return <JournalView {...ctx} />;
            }
}
