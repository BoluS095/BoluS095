import { create } from "zustand";
import type {
  AppConfig,
  KalshiCredentials,
  KalshiMarket,
  PositionTracker,
  TerminalLog,
  TradeRecord,
  TradingProfile,
  TradingState,
  ScannerSortBy,
  ScannerFilterCategory,
} from "./types";
import {
  CAPITAL_SCALING,
  MAX_TERMINAL_LOGS,
  MAX_TRADE_HISTORY,
  PROFILES,
  STOP_LOSS_CONFIG,
} from "./constants";
import * as KalshiAPI from "./kalshi-api";
import { analyzeMarket } from "./gemini-engine";

// ─── Helpers ────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function getPositionMultiplier(balance: number): number {
  for (let i = CAPITAL_SCALING.GROWTH_TIERS.length - 1; i >= 0; i--) {
    if (balance >= CAPITAL_SCALING.GROWTH_TIERS[i].min_balance) {
      return CAPITAL_SCALING.GROWTH_TIERS[i].max_position_multiplier;
    }
  }
  return 1;
}

// ─── Store Interface ────────────────────────────────────────────
interface NexusStore {
  config: AppConfig;
  setConfig: (config: Partial<AppConfig>) => void;
  getCredentials: () => KalshiCredentials | null;
  trading: TradingState;
  setTradingProfile: (profile: TradingProfile) => void;
  logs: TerminalLog[];
  addLog: (level: TerminalLog["level"], source: TerminalLog["source"], message: string) => void;
  activeTab: "dashboard" | "terminal" | "workspace" | "scanner";
  setActiveTab: (tab: "dashboard" | "terminal" | "workspace" | "scanner") => void;
  startEngine: () => void;
  stopEngine: () => void;
  isEngineRunning: boolean;
  refreshData: () => Promise<void>;
  analyzeAndTrade: () => Promise<void>;
  checkStopLosses: () => Promise<void>;
  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;
  markets: KalshiMarket[];
  setMarkets: (markets: KalshiMarket[]) => void;
  // Scanner state
  scannerMarkets: KalshiMarket[];
  scannerLoading: boolean;
  scannerSort: ScannerSortBy;
  scannerFilter: ScannerFilterCategory;
  scannerSearch: string;
  setScannerSort: (sort: ScannerSortBy) => void;
  setScannerFilter: (filter: ScannerFilterCategory) => void;
  setScannerSearch: (search: string) => void;
  refreshScanner: () => Promise<void>;
  // WS state
  wsConnected: boolean;
}

// ─── Defaults ───────────────────────────────────────────────────
const defaultConfig: AppConfig = {
  kalshiApiKeyId: "",
  kalshiPrivateKeyPem: "",
  geminiApiKey: "",
  profile: "moderate",
  isSetupComplete: false,
  isDarkMode: true,
  autoTrade: true,
  maxConcurrentPositions: 5,
  stopLossEnabled: true,
  trailingStopEnabled: true,
  takeProfitEnabled: true,
  positionTimeoutEnabled: true,
};

const defaultTrading: TradingState = {
  isRunning: false,
  profile: "moderate",
  balance: 0,
  totalPnl: 0,
  dailyPnl: 0,
  openPositions: [],
  activeOrders: [],
  tradeHistory: [],
  watchlist: [],
  lastAnalysis: null,
  lastAnalysisTicker: null,
  positionTrackers: [],
};

// ─── Store ──────────────────────────────────────────────────────
export const useNexusStore = create<NexusStore>((set, get) => ({
  config: (() => {
    try {
      const saved = localStorage.getItem("kalshi-nexus-config");
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    } catch { return defaultConfig; }
  })(),

  trading: defaultTrading,
  logs: [],
  activeTab: "dashboard",
  isEngineRunning: false,
  markets: [],
  scannerMarkets: [],
  scannerLoading: false,
  scannerSort: "volume",
  scannerFilter: "all",
  scannerSearch: "",
  wsConnected: false,

  setConfig: (partial) => {
    set((state) => {
      const newConfig = { ...state.config, ...partial };
      localStorage.setItem("kalshi-nexus-config", JSON.stringify(newConfig));
      return { config: newConfig };
    });
  },

  getCredentials: () => {
    const { config } = get();
    if (!config.kalshiApiKeyId || !config.kalshiPrivateKeyPem) return null;
    return { apiKeyId: config.kalshiApiKeyId, privateKeyPem: config.kalshiPrivateKeyPem };
  },

  setTradingProfile: (profile) => {
    set((state) => ({
      trading: { ...state.trading, profile },
      config: { ...state.config, profile },
    }));
    localStorage.setItem("kalshi-nexus-config", JSON.stringify({ ...get().config, profile }));
  },

  addLog: (level, source, message) => {
    const log: TerminalLog = { id: uid(), timestamp: Date.now(), level, source, message };
    set((state) => ({ logs: [log, ...state.logs].slice(0, MAX_TERMINAL_LOGS) }));
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setScannerSort: (sort) => set({ scannerSort: sort }),
  setScannerFilter: (filter) => set({ scannerFilter: filter }),
  setScannerSearch: (search) => set({ scannerSearch: search }),

  addToWatchlist: (ticker) =>
    set((state) => ({
      trading: {
        ...state.trading,
        watchlist: state.trading.watchlist.includes(ticker)
          ? state.trading.watchlist
          : [...state.trading.watchlist, ticker],
      },
    })),

  removeFromWatchlist: (ticker) =>
    set((state) => ({
      trading: {
        ...state.trading,
        watchlist: state.trading.watchlist.filter((t) => t !== ticker),
      },
    })),

  setMarkets: (markets) => set({ markets }),

  // ─── Refresh Scanner ──────────────────────────────────────────
  refreshScanner: async () => {
    const creds = get().getCredentials();
    if (!creds) return;
    set({ scannerLoading: true });
    try {
      const allMarkets: KalshiMarket[] = [];
      let cursor: string | undefined;
      // Fetch up to 200 markets (2 pages)
      for (let page = 0; page < 2; page++) {
        const res = await KalshiAPI.getMarkets(creds, 100, cursor);
        allMarkets.push(...res.markets);
        cursor = res.cursor;
        if (!cursor) break;
      }
      set({ scannerMarkets: allMarkets.filter((m) => m.status === "open"), scannerLoading: false });
      get().addLog("info", "kalshi", `Scanner loaded ${allMarkets.length} open markets`);
    } catch (err) {
      set({ scannerLoading: false });
      get().addLog("error", "kalshi", `Scanner refresh failed: ${(err as Error).message}`);
    }
  },

  // ─── Refresh Portfolio Data ───────────────────────────────────
  refreshData: async () => {
    const creds = get().getCredentials();
    if (!creds) return;
    const { addLog } = get();
    try {
      addLog("info", "kalshi", "Fetching portfolio data...");
      const [balance, positions, orders] = await Promise.all([
        KalshiAPI.getBalance(creds),
        KalshiAPI.getPositions(creds),
        KalshiAPI.getOpenOrders(creds),
      ]);
      set((state) => ({
        trading: {
          ...state.trading,
          balance: balance.balance,
          openPositions: positions,
          activeOrders: orders,
        },
      }));
      addLog("success", "kalshi", `Balance: $${balance.balance.toFixed(2)} | Positions: ${positions.length} | Orders: ${orders.length}`);
    } catch (err) {
      addLog("error", "kalshi", `Refresh failed: ${(err as Error).message}`);
    }
  },

  // ─── Stop-Loss / Take-Profit / Trailing Stop Check ────────────
  checkStopLosses: async () => {
    const state = get();
    const creds = state.getCredentials();
    const { stopLossEnabled, trailingStopEnabled, takeProfitEnabled, positionTimeoutEnabled } = state.config;
    const profile = PROFILES[state.config.profile];
    if (!creds || (!stopLossEnabled && !takeProfitEnabled && !trailingStopEnabled)) return;

    const { addLog } = state;
    const trackers = [...state.trading.positionTrackers];

    for (const tracker of trackers) {
      try {
        // Get current market price
        const market = await KalshiAPI.getMarket(creds, tracker.ticker);
        const currentPrice = tracker.side === "yes"
          ? market.yes_bid / 100
          : market.no_bid / 100;

        const entryPrice = tracker.entry_price;
        const pnlPct = ((currentPrice - entryPrice) / entryPrice) * 100;

        // Update highest price for trailing stop
        if (currentPrice > tracker.highest_price) {
          tracker.highest_price = currentPrice;
        }

        let shouldClose = false;
        let closeReason = "";

        // ── Emergency Stop-Loss ──
        if (stopLossEnabled && pnlPct <= -STOP_LOSS_CONFIG.EMERGENCY_CLOSE_THRESHOLD * 100) {
          shouldClose = true;
          closeReason = `EMERGENCY STOP-LOSS: ${pnlPct.toFixed(1)}% loss exceeds ${STOP_LOSS_CONFIG.EMERGENCY_CLOSE_THRESHOLD * 100}% threshold`;
        }
        // ── Regular Stop-Loss ──
        else if (stopLossEnabled && currentPrice <= tracker.stop_loss_price) {
          shouldClose = true;
          closeReason = `STOP-LOSS triggered: price $${currentPrice.toFixed(2)} <= stop $${tracker.stop_loss_price.toFixed(2)}`;
        }
        // ── Take-Profit ──
        else if (takeProfitEnabled && currentPrice >= tracker.take_profit_price) {
          shouldClose = true;
          closeReason = `TAKE-PROFIT triggered: price $${currentPrice.toFixed(2)} >= target $${tracker.take_profit_price.toFixed(2)}`;
        }
        // ── Trailing Stop ──
        else if (trailingStopEnabled && pnlPct >= STOP_LOSS_CONFIG.TRAILING_STOP_ACTIVATION * 100) {
          tracker.trailing_stop_active = true;
          const trailingStopPrice = tracker.highest_price * (1 - profile.trailing_stop_pct / 100);
          if (currentPrice <= trailingStopPrice) {
            shouldClose = true;
            closeReason = `TRAILING STOP triggered: price $${currentPrice.toFixed(2)} <= trail $${trailingStopPrice.toFixed(2)} (peak: $${tracker.highest_price.toFixed(2)})`;
          }
        }
        // ── Position Timeout ──
        else if (positionTimeoutEnabled && Date.now() - tracker.entry_time > STOP_LOSS_CONFIG.MAX_POSITION_AGE_MS) {
          shouldClose = true;
          closeReason = `TIMEOUT: position held for >24h`;
        }

        if (shouldClose) {
          addLog("warning", "engine", closeReason);

          // Execute close order
          for (let attempt = 0; attempt < STOP_LOSS_CONFIG.STOP_LOSS_RETRY_ATTEMPTS; attempt++) {
            try {
              const closeAction = tracker.side === "yes" ? "sell" : "buy";
              const order = await KalshiAPI.placeOrder(creds, {
                ticker: tracker.ticker,
                action: closeAction,
                side: tracker.side,
                type: "market",
                count: tracker.count,
              });

              // Record the trade
              const trade: TradeRecord = {
                id: uid(),
                ticker: tracker.ticker,
                side: tracker.side,
                action: closeAction,
                count: tracker.count,
                price: currentPrice,
                pnl: (currentPrice - entryPrice) * tracker.count,
                ai_confidence: 0,
                ai_reasoning: closeReason,
                timestamp: Date.now(),
                status: closeReason.includes("STOP-LOSS") ? "closed_sl"
                  : closeReason.includes("TAKE-PROFIT") ? "closed_tp"
                  : closeReason.includes("TRAILING") ? "closed_trailing"
                  : "closed_timeout",
                close_price: currentPrice,
                close_timestamp: Date.now(),
              };

              set((s) => ({
                trading: {
                  ...s.trading,
                  tradeHistory: [trade, ...s.trading.tradeHistory].slice(0, MAX_TRADE_HISTORY),
                  positionTrackers: s.trading.positionTrackers.filter((t) => t.ticker !== tracker.ticker),
                  totalPnl: s.trading.totalPnl + trade.pnl,
                  dailyPnl: s.trading.dailyPnl + trade.pnl,
                },
              }));

              addLog("success", "engine", `Position closed: ${tracker.ticker} | PnL: $${trade.pnl.toFixed(2)} | ${order.order_id}`);
              break;
            } catch (err) {
              addLog("error", "engine", `Close attempt ${attempt + 1} failed: ${(err as Error).message}`);
              if (attempt < STOP_LOSS_CONFIG.STOP_LOSS_RETRY_ATTEMPTS - 1) {
                await new Promise((r) => setTimeout(r, STOP_LOSS_CONFIG.STOP_LOSS_RETRY_DELAY_MS));
              }
            }
          }
        } else {
          // Update tracker state
          set((s) => ({
            trading: {
              ...s.trading,
              positionTrackers: s.trading.positionTrackers.map((t) =>
                t.ticker === tracker.ticker ? tracker : t
              ),
            },
          }));
        }
      } catch {
        // Market might be delisted or unavailable
      }
    }
  },

  // ─── AI Analysis + Trade Execution ────────────────────────────
  analyzeAndTrade: async () => {
    const state = get();
    const creds = state.getCredentials();
    const { geminiApiKey, autoTrade, profile: profileKey, maxConcurrentPositions } = state.config;
    const profileConfig = PROFILES[profileKey];

    if (!creds || !geminiApiKey) {
      state.addLog("error", "engine", "Missing API credentials.");
      return;
    }

    if (state.trading.openPositions.length >= maxConcurrentPositions) {
      state.addLog("info", "engine", `Max positions (${maxConcurrentPositions}) reached.`);
      return;
    }

    try {
      state.addLog("info", "engine", "Scanning markets for opportunities...");

      let marketsToAnalyze: KalshiMarket[] = [];

      // Check watchlist first
      for (const ticker of state.trading.watchlist) {
        try {
          const market = await KalshiAPI.getMarket(creds, ticker);
          marketsToAnalyze.push(market);
        } catch { /* skip */ }
      }

      // If watchlist empty, fetch open markets
      if (marketsToAnalyze.length === 0) {
        const marketList = await KalshiAPI.getMarkets(creds, 30);
        marketsToAnalyze = marketList.markets.filter(
          (m) => m.status === "open" && m.volume > profileConfig.min_liquidity
        );
      }

      state.addLog("info", "engine", `Analyzing ${Math.min(marketsToAnalyze.length, 3)} markets...`);

      for (const market of marketsToAnalyze.slice(0, 3)) {
        try {
          state.addLog("ai", "gemini", `Analyzing: ${market.title}`);

          let orderBook = null;
          try { orderBook = await KalshiAPI.getOrderBook(creds, market.ticker); } catch { /* skip */ }

          const currentPosition = state.trading.openPositions.find((p) => p.ticker === market.ticker) || null;

          const analysis = await analyzeMarket(geminiApiKey, {
            market,
            orderBook,
            currentPosition,
            portfolioBalance: state.trading.balance,
            recentTrades: state.trading.tradeHistory.slice(0, 20),
            marketHistory: [],
          });

          set((s) => ({ trading: { ...s.trading, lastAnalysis: analysis, lastAnalysisTicker: market.ticker } }));

          state.addLog("ai", "gemini", `Signal: ${analysis.signal} | Confidence: ${(analysis.confidence * 100).toFixed(1)}% | Risk: ${analysis.risk_assessment} | EV: $${analysis.expected_value.toFixed(2)}`);
          state.addLog("ai", "gemini", `Reasoning: ${analysis.reasoning}`);

          // Execute trade
          if (autoTrade && analysis.signal !== "HOLD" && analysis.confidence >= profileConfig.min_confidence && analysis.suggested_size > 0 && analysis.expected_value > 0) {
            const isBuy = analysis.signal.startsWith("BUY");
            const side = analysis.signal.includes("YES") ? "yes" : "no";

            // Capital-scaled position sizing
            const positionMultiplier = getPositionMultiplier(state.trading.balance);
            const maxPositionValue = (state.trading.balance * profileConfig.max_position_pct * positionMultiplier) / 100;
            const orderValue = analysis.suggested_size * (analysis.suggested_price / 100);
            let finalSize = orderValue > maxPositionValue
              ? Math.floor(maxPositionValue / (analysis.suggested_price / 100))
              : analysis.suggested_size;

            // Cap for small accounts
            finalSize = Math.min(finalSize, CAPITAL_SCALING.MAX_CONTRACTS_SMALL_CAP);

            // Kelly criterion sizing
            const kellySize = Math.floor(finalSize * profileConfig.kelly_fraction);
            finalSize = Math.max(kellySize, 1);

            // Minimum order value check
            if (finalSize * (analysis.suggested_price / 100) < CAPITAL_SCALING.MIN_ORDER_VALUE) {
              state.addLog("warning", "engine", `Order value too small (${(finalSize * analysis.suggested_price / 100).toFixed(2)}). Min: $${CAPITAL_SCALING.MIN_ORDER_VALUE}. Skipping.`);
              continue;
            }

            // Check total exposure
            const currentExposure = state.trading.positionTrackers.reduce(
              (sum, t) => sum + t.count * t.entry_price, 0
            );
            const maxExposure = (state.trading.balance * profileConfig.max_total_exposure_pct) / 100;
            if (currentExposure + finalSize * (analysis.suggested_price / 100) > maxExposure) {
              state.addLog("warning", "engine", `Max exposure ($${maxExposure.toFixed(2)}) would be exceeded. Skipping.`);
              continue;
            }

            state.addLog("system", "engine", `Executing ${analysis.signal} - ${finalSize} contracts @ $${(analysis.suggested_price / 100).toFixed(2)} [${positionMultiplier}x multiplier]`);

            try {
              const order = await KalshiAPI.placeOrder(creds, {
                ticker: market.ticker,
                action: isBuy ? "buy" : "sell",
                side,
                type: "limit",
                count: finalSize,
                price: analysis.suggested_price,
              });

              const entryPrice = analysis.suggested_price / 100;

              // Create position tracker with stop-loss/take-profit
              const tracker: PositionTracker = {
                ticker: market.ticker,
                entry_price: entryPrice,
                entry_time: Date.now(),
                count: finalSize,
                side,
                highest_price: entryPrice,
                stop_loss_price: entryPrice * (1 - profileConfig.stop_loss_pct / 100),
                take_profit_price: entryPrice * (1 + profileConfig.take_profit_pct / 100),
                trailing_stop_active: false,
              };

              const trade: TradeRecord = {
                id: uid(), ticker: market.ticker, side, action: isBuy ? "buy" : "sell",
                count: finalSize, price: entryPrice, pnl: 0,
                ai_confidence: analysis.confidence, ai_reasoning: analysis.reasoning,
                timestamp: Date.now(), status: "pending",
              };

              set((s) => ({
                trading: {
                  ...s.trading,
                  activeOrders: [...s.trading.activeOrders, order],
                  tradeHistory: [trade, ...s.trading.tradeHistory].slice(0, MAX_TRADE_HISTORY),
                  positionTrackers: [...s.trading.positionTrackers, tracker],
                },
              }));

              state.addLog("success", "engine", `Order placed: ${order.order_id} | SL: $${tracker.stop_loss_price.toFixed(2)} | TP: $${tracker.take_profit_price.toFixed(2)}`);
            } catch (err) {
              state.addLog("error", "engine", `Order failed: ${(err as Error).message}`);
            }
          } else if (analysis.confidence < profileConfig.min_confidence) {
            state.addLog("info", "engine", `Confidence ${(analysis.confidence * 100).toFixed(1)}% < ${(profileConfig.min_confidence * 100).toFixed(1)}% threshold.`);
          }
        } catch (err) {
          state.addLog("error", "engine", `Analysis failed: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      state.addLog("error", "engine", `Scan failed: ${(err as Error).message}`);
    }
  },

  // ─── Engine Control ───────────────────────────────────────────
  startEngine: () => {
    const state = get();
    if (state.isEngineRunning) return;

    const profile = PROFILES[state.config.profile];
    state.addLog("system", "engine", `═══ KALSHI NEXUS AI ENGINE v${1} ═══`);
    state.addLog("system", "engine", `Profile: ${profile.name} | Stop-Loss: ${state.config.stopLossEnabled ? "ON" : "OFF"} | Trailing: ${state.config.trailingStopEnabled ? "ON" : "OFF"} | Take-Profit: ${state.config.takeProfitEnabled ? "ON" : "OFF"}`);
    state.addLog("system", "engine", `Capital: $${state.trading.balance.toFixed(2)} | Max Position: ${profile.max_position_pct}% | Max Exposure: ${profile.max_total_exposure_pct}%`);
    set({ isEngineRunning: true });

    // Initial data refresh
    state.refreshData();

    // Trading loop (every 60s)
    const tradeInterval = setInterval(async () => {
      const current = get();
      if (!current.isEngineRunning) { clearInterval(tradeInterval); return; }
      try {
        await current.refreshData();
        await current.analyzeAndTrade();
      } catch (err) {
        current.addLog("error", "engine", `Trade loop error: ${(err as Error).message}`);
      }
    }, 60_000);

    // Stop-loss check loop (every 15s)
    const slInterval = setInterval(async () => {
      const current = get();
      if (!current.isEngineRunning) { clearInterval(slInterval); return; }
      try { await current.checkStopLosses(); } catch { /* ignore */ }
    }, STOP_LOSS_CONFIG.CHECK_INTERVAL_MS);

    // Scanner refresh loop (every 30s)
    const scanInterval = setInterval(async () => {
      const current = get();
      if (!current.isEngineRunning) { clearInterval(scanInterval); return; }
      try { await current.refreshScanner(); } catch { /* ignore */ }
    }, 30_000);
  },

  stopEngine: () => {
    set({ isEngineRunning: false });
    get().addLog("system", "engine", "Engine stopped.");
  },
}));
