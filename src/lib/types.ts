// ─── Kalshi API Types ───────────────────────────────────────────
export interface KalshiCredentials {
  apiKeyId: string;
  privateKeyPem: string;
}

export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  subtitle: string;
  category: string;
  status: string;
  open_time: string;
  close_time: string;
  expiration_time: string;
  yes_ask: number;
  yes_bid: number;
  no_ask: number;
  no_bid: number;
  last_price: number;
  volume: number;
  open_interest: number;
  result: string;
}

export interface KalshiOrderBook {
  yes: Array<{ price: number; quantity: number }>;
  no: Array<{ price: number; quantity: number }>;
}

export interface KalshiOrder {
  order_id: string;
  ticker: string;
  action: "buy" | "sell";
  side: "yes" | "no";
  count: number;
  type: "limit" | "market";
  price?: number;
  no_price?: number;
  status: string;
  filled: number;
  remaining: number;
  created_time: string;
  last_updated_time: string;
}

export interface KalshiPosition {
  ticker: string;
  event_ticker: string;
  title: string;
  position: number;
  total_traded: number;
  realized_pnl: number;
  market_exposure: number;
  locked_in_exposure: number;
}

export interface KalshiBalance {
  balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_settled: number;
  total_fees: number;
  pending_balance: number;
}

export interface KalshiEvent {
  event_ticker: string;
  title: string;
  category: string;
  status: string;
  markets: KalshiMarket[];
}

// ─── Gemini AI Types ────────────────────────────────────────────
export interface AIAnalysisRequest {
  market: KalshiMarket;
  orderBook: KalshiOrderBook | null;
  currentPosition: KalshiPosition | null;
  portfolioBalance: number;
  recentTrades: TradeRecord[];
  marketHistory: MarketDataPoint[];
}

export interface AIAnalysisResponse {
  signal: "BUY_YES" | "BUY_NO" | "SELL_YES" | "SELL_NO" | "HOLD" | "CLOSE";
  confidence: number;
  reasoning: string;
  suggested_size: number;
  suggested_price: number;
  risk_assessment: "LOW" | "MEDIUM" | "HIGH";
  expected_value: number;
  time_horizon: string;
  key_factors: string[];
}

export interface MarketDataPoint {
  timestamp: number;
  yes_price: number;
  no_price: number;
  volume: number;
}

// ─── Trading Engine Types ───────────────────────────────────────
export type TradingProfile = "conservative" | "moderate" | "aggressive";

export interface ProfileConfig {
  name: string;
  description: string;
  max_position_pct: number;
  max_total_exposure_pct: number;
  min_confidence: number;
  max_spread: number;
  stop_loss_pct: number;
  take_profit_pct: number;
  max_trades_per_hour: number;
  min_balance_reserve: number;
  // Advanced risk management
  trailing_stop_pct: number;
  max_daily_loss_pct: number;
  min_liquidity: number;
  kelly_fraction: number;
  compound_growth: boolean;
}

export interface TradeRecord {
  id: string;
  ticker: string;
  side: "yes" | "no";
  action: "buy" | "sell";
  count: number;
  price: number;
  pnl: number;
  ai_confidence: number;
  ai_reasoning: string;
  timestamp: number;
  status: "pending" | "filled" | "cancelled" | "failed" | "closed_sl" | "closed_tp" | "closed_trailing" | "closed_timeout";
  close_price?: number;
  close_timestamp?: number;
  highest_price?: number; // For trailing stop
}

export interface PositionTracker {
  ticker: string;
  entry_price: number;
  entry_time: number;
  count: number;
  side: "yes" | "no";
  highest_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  trailing_stop_active: boolean;
}

export interface TradingState {
  isRunning: boolean;
  profile: TradingProfile;
  balance: number;
  totalPnl: number;
  dailyPnl: number;
  openPositions: KalshiPosition[];
  activeOrders: KalshiOrder[];
  tradeHistory: TradeRecord[];
  watchlist: string[];
  lastAnalysis: AIAnalysisResponse | null;
  lastAnalysisTicker: string | null;
  positionTrackers: PositionTracker[];
}

// ─── Terminal Log Types ─────────────────────────────────────────
export type LogLevel = "info" | "success" | "warning" | "error" | "system" | "ai";

export interface TerminalLog {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: "kalshi" | "gemini" | "engine" | "system" | "error";
  message: string;
}

// ─── App Config ─────────────────────────────────────────────────
export interface AppConfig {
  kalshiApiKeyId: string;
  kalshiPrivateKeyPem: string;
  geminiApiKey: string;
  profile: TradingProfile;
  isSetupComplete: boolean;
  isDarkMode: boolean;
  autoTrade: boolean;
  maxConcurrentPositions: number;
  stopLossEnabled: boolean;
  trailingStopEnabled: boolean;
  takeProfitEnabled: boolean;
  positionTimeoutEnabled: boolean;
}

// ─── Market Scanner Types ───────────────────────────────────────
export type ScannerSortBy = "volume" | "open_interest" | "spread" | "price";
export type ScannerFilterCategory = "all" | "politics" | "sports" | "crypto" | "economics" | "science" | "entertainment" | "other";
