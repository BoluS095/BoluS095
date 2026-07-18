// ─── Trading Profiles — Optimized for $10 Micro-Capital ─────────
import type { ProfileConfig, TradingProfile } from "./types";

export const PROFILES: Record<TradingProfile, ProfileConfig> = {
  conservative: {
    name: "Conservative",
    description: "$10 safe mode. Maximum 3% risk per trade. Capital preservation first.",
    max_position_pct: 3,
    max_total_exposure_pct: 25,
    min_confidence: 0.80,
    max_spread: 0.04,
    stop_loss_pct: 10,
    take_profit_pct: 8,
    max_trades_per_hour: 1,
    min_balance_reserve: 7,
    trailing_stop_pct: 5,
    max_daily_loss_pct: 15,
    min_liquidity: 50,
    kelly_fraction: 0.25,
    compound_growth: true,
  },
  moderate: {
    name: "Moderate",
    description: "$10 balanced mode. 7% risk per trade. Steady compounding.",
    max_position_pct: 7,
    max_total_exposure_pct: 40,
    min_confidence: 0.65,
    max_spread: 0.07,
    stop_loss_pct: 15,
    take_profit_pct: 12,
    max_trades_per_hour: 3,
    min_balance_reserve: 5,
    trailing_stop_pct: 8,
    max_daily_loss_pct: 25,
    min_liquidity: 25,
    kelly_fraction: 0.5,
    compound_growth: true,
  },
  aggressive: {
    name: "Aggressive",
    description: "$10 growth mode. 15% risk per trade. Rapid compounding.",
    max_position_pct: 15,
    max_total_exposure_pct: 70,
    min_confidence: 0.50,
    max_spread: 0.10,
    stop_loss_pct: 25,
    take_profit_pct: 20,
    max_trades_per_hour: 5,
    min_balance_reserve: 2,
    trailing_stop_pct: 12,
    max_daily_loss_pct: 40,
    min_liquidity: 10,
    kelly_fraction: 0.75,
    compound_growth: true,
  },
};

// ─── Capital Scaling Config ─────────────────────────────────────
export const CAPITAL_SCALING = {
  STARTING_CAPITAL: 10,
  // Profit thresholds to unlock higher position sizes
  GROWTH_TIERS: [
    { min_balance: 10, max_position_multiplier: 1.0 },
    { min_balance: 25, max_position_multiplier: 1.2 },
    { min_balance: 50, max_position_multiplier: 1.5 },
    { min_balance: 100, max_position_multiplier: 2.0 },
    { min_balance: 250, max_position_multiplier: 2.5 },
    { min_balance: 500, max_position_multiplier: 3.0 },
  ],
  // Minimum order value to cover Kalshi fees
  MIN_ORDER_VALUE: 1,
  // Maximum contracts per single order for $10 accounts
  MAX_CONTRACTS_SMALL_CAP: 20,
  // Fee estimate per contract (Kalshi tier dependent)
  FEE_PER_CONTRACT: 0.01,
};

// ─── Stop-Loss Engine Config ────────────────────────────────────
export const STOP_LOSS_CONFIG = {
  CHECK_INTERVAL_MS: 15_000, // Check positions every 15 seconds
  TRAILING_STOP_ACTIVATION: 0.02, // Activate trailing stop at 2% profit
  EMERGENCY_CLOSE_THRESHOLD: 0.40, // Emergency close at 40% loss
  MAX_POSITION_AGE_MS: 24 * 60 * 60 * 1000, // Close positions older than 24h
  STOP_LOSS_RETRY_ATTEMPTS: 3,
  STOP_LOSS_RETRY_DELAY_MS: 2000,
};

// ─── API Endpoints ──────────────────────────────────────────────
export const KALSHI_BASE_URL = "https://external-api.kalshi.com/trade-api/v2";
export const KALSHI_WS_URL = "wss://external-api-ws.kalshi.com/trade-api/ws/v2";
export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// ─── Gemini Model ───────────────────────────────────────────────
export const GEMINI_MODEL = "gemini-2.0-flash";

// ─── Trading Constants ──────────────────────────────────────────
export const MIN_KALSHI_ORDER_SIZE = 1;
export const MAX_KALSHI_ORDER_SIZE = 10000;
export const TRADING_INTERVAL_MS = 30_000;
export const ANALYSIS_INTERVAL_MS = 60_000;
export const WS_RECONNECT_DELAY_MS = 5_000;
export const WS_MAX_RECONNECT_ATTEMPTS = 10;
export const MAX_TRADE_HISTORY = 500;
export const MAX_TERMINAL_LOGS = 1000;

// ─── Market Scanner Config ──────────────────────────────────────
export const SCANNER_CONFIG = {
  REFRESH_INTERVAL_MS: 30_000, // Refresh market list every 30s
  MAX_MARKETS_DISPLAY: 50,
  SORT_OPTIONS: ["volume", "open_interest", "spread", "price"] as const,
  VOLUME_THRESHOLD: 5, // Minimum volume to show
  SPREAD_ALERT_THRESHOLD: 0.15, // Alert if spread > 15%
};

// ─── UI Constants ───────────────────────────────────────────────
export const APP_NAME = "Kalshi Nexus AI";
export const APP_VERSION = "1.0.0";

export const PROFILE_COLORS: Record<TradingProfile, string> = {
  conservative: "#00D9FF",
  moderate: "#A855F7",
  aggressive: "#FF3366",
};

export const PROFILE_ICONS: Record<TradingProfile, string> = {
  conservative: "shield",
  moderate: "zap",
  aggressive: "flame",
};
