import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  Play,
  Pause,
  Shield,
  Zap,
  Flame,
  Clock,
  BarChart3,
  Target,
  RefreshCw,
  Layers,
  TrendingUpIcon,
  ShieldCheck,
  ArrowUpCircle,
} from "lucide-react";
import { useNexusStore } from "../lib/store";
import { PROFILES, PROFILE_COLORS, CAPITAL_SCALING } from "../lib/constants";
import type { TradingProfile } from "../lib/types";

const PROFILE_ICONS: Record<TradingProfile, typeof Shield> = {
  conservative: Shield,
  moderate: Zap,
  aggressive: Flame,
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  sub,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  color: string;
  trend?: "up" | "down" | "neutral";
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-nexus-muted text-xs uppercase tracking-wider">{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="text-xl font-bold text-white flex items-center gap-2">
        {value}
        {trend === "up" && <TrendingUp className="w-4 h-4 text-nexus-green" />}
        {trend === "down" && <TrendingDown className="w-4 h-4 text-nexus-pink" />}
      </div>
      {sub && <div className="text-[10px] text-nexus-muted mt-1">{sub}</div>}
    </motion.div>
  );
}

export default function Dashboard() {
  const {
    trading,
    isEngineRunning,
    config,
    startEngine,
    stopEngine,
    refreshData,
    setTradingProfile,
    addLog,
    setConfig,
  } = useNexusStore();

  const profile = PROFILES[config.profile];
  const positionMultiplier =
    trading.balance >= 500 ? 3.0
    : trading.balance >= 250 ? 2.5
    : trading.balance >= 100 ? 2.0
    : trading.balance >= 50 ? 1.5
    : trading.balance >= 25 ? 1.2
    : 1.0;

  const totalExposure = trading.positionTrackers.reduce(
    (sum, t) => sum + t.count * t.entry_price,
    0
  );

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Engine Control */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${isEngineRunning ? "bg-nexus-green animate-pulse-glow" : "bg-nexus-pink"}`}
            />
            <span className="text-sm font-semibold text-white">
              {isEngineRunning ? "ENGINE ACTIVE" : "ENGINE IDLE"}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                refreshData();
                addLog("info", "system", "Manual refresh triggered");
              }}
              className="p-2 rounded-lg border border-nexus-border hover:border-nexus-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-nexus-muted" />
            </button>
            <button
              onClick={() => (isEngineRunning ? stopEngine() : startEngine())}
              className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${
                isEngineRunning
                  ? "bg-nexus-pink/20 text-nexus-pink border border-nexus-pink/30 hover:bg-nexus-pink/30"
                  : "bg-nexus-green/20 text-nexus-green border border-nexus-green/30 hover:bg-nexus-green/30"
              }`}
            >
              {isEngineRunning ? (
                <><Pause className="w-4 h-4" /> Stop</>
              ) : (
                <><Play className="w-4 h-4" /> Start</>
              )}
            </button>
          </div>
        </div>

        {/* Connection status */}
        <div className="flex gap-4 text-xs mb-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${config.kalshiApiKeyId ? "bg-nexus-green" : "bg-nexus-pink"}`} />
            <span className="text-nexus-muted">Kalshi API</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${config.geminiApiKey ? "bg-nexus-green" : "bg-nexus-pink"}`} />
            <span className="text-nexus-muted">Gemini AI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isEngineRunning ? "bg-nexus-green animate-pulse" : "bg-nexus-muted"}`} />
            <span className="text-nexus-muted">24/7 Loop</span>
          </div>
        </div>

        {/* Risk Controls */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "stopLossEnabled" as const, label: "Stop-Loss", icon: ShieldCheck, color: "#ff3366" },
            { key: "trailingStopEnabled" as const, label: "Trailing", icon: TrendingUpIcon, color: "#ffd700" },
            { key: "takeProfitEnabled" as const, label: "Take-Profit", icon: ArrowUpCircle, color: "#00ff88" },
            { key: "positionTimeoutEnabled" as const, label: "Timeout", icon: Clock, color: "#a855f7" },
          ].map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setConfig({ [key]: !config[key] })}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                config[key]
                  ? "border-opacity-50"
                  : "border-nexus-border text-nexus-muted"
              }`}
              style={
                config[key]
                  ? { borderColor: `${color}40`, backgroundColor: `${color}10`, color }
                  : {}
              }
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Balance"
          value={`$${trading.balance.toFixed(2)}`}
          icon={Wallet}
          color={PROFILE_COLORS[config.profile]}
          sub={`${positionMultiplier}x scaling tier`}
        />
        <StatCard
          label="Total P&L"
          value={`${trading.totalPnl >= 0 ? "+" : ""}$${trading.totalPnl.toFixed(2)}`}
          icon={BarChart3}
          color={trading.totalPnl >= 0 ? "#00ff88" : "#ff3366"}
          trend={trading.totalPnl >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Open Positions"
          value={String(trading.openPositions.length)}
          icon={Target}
          color="#a855f7"
          sub={`Exposure: $${totalExposure.toFixed(2)}`}
        />
        <StatCard
          label="Active Orders"
          value={String(trading.activeOrders.length)}
          icon={Activity}
          color="#ffd700"
          sub={`${trading.tradeHistory.length} total trades`}
        />
      </div>

      {/* Capital Scaling Tier */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-nexus-accent" />
          <h3 className="text-sm font-semibold text-white">Capital Scaling</h3>
        </div>
        <div className="flex items-center gap-2 mb-2">
          {CAPITAL_SCALING.GROWTH_TIERS.map((tier, i) => {
            const isActive = trading.balance >= tier.min_balance;
            const isCurrent =
              i === CAPITAL_SCALING.GROWTH_TIERS.length - 1 ||
              trading.balance < CAPITAL_SCALING.GROWTH_TIERS[i + 1].min_balance;
            return (
              <div key={i} className="flex-1 text-center">
                <div
                  className={`h-2 rounded-full mb-1 ${
                    isActive ? "bg-nexus-green" : "bg-nexus-border"
                  } ${isCurrent && isActive ? "ring-2 ring-nexus-green/30" : ""}`}
                />
                <div className="text-[9px] text-nexus-muted">${tier.min_balance}</div>
                <div className={`text-[9px] font-bold ${isCurrent && isActive ? "text-nexus-green" : "text-nexus-muted"}`}>
                  {tier.max_position_multiplier}x
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-nexus-muted text-center">
          Current: <span className="text-nexus-green font-bold">{positionMultiplier}x</span> multiplier at ${trading.balance.toFixed(2)} balance
        </div>
      </div>

      {/* Profile Selector */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Trading Profile</h3>
          <span className="text-[10px] text-nexus-muted font-mono">
            SL: {profile.stop_loss_pct}% | TP: {profile.take_profit_pct}%
          </span>
        </div>
        <div className="flex gap-2">
          {(Object.keys(PROFILES) as TradingProfile[]).map((key) => {
            const p = PROFILES[key];
            const Icon = PROFILE_ICONS[key];
            const color = PROFILE_COLORS[key];
            const isActive = config.profile === key;
            return (
              <button
                key={key}
                onClick={() => setTradingProfile(key)}
                className={`flex-1 py-3 rounded-xl border transition-all text-center ${
                  isActive ? "border-opacity-50" : "border-nexus-border hover:border-nexus-muted"
                }`}
                style={isActive ? { borderColor: `${color}50`, backgroundColor: `${color}08` } : {}}
              >
                <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: isActive ? color : "#6b6b9e" }} />
                <div className="text-xs font-semibold" style={{ color: isActive ? color : "#6b6b9e" }}>
                  {p.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Position Trackers (Active SL/TP) */}
      {trading.positionTrackers.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-nexus-green" />
            <h3 className="text-sm font-semibold text-white">Position Trackers</h3>
          </div>
          <div className="space-y-2">
            {trading.positionTrackers.map((tracker) => (
              <div
                key={tracker.ticker}
                className="flex items-center gap-3 py-2 border-b border-nexus-border last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white font-mono truncate">{tracker.ticker}</div>
                  <div className="text-[10px] text-nexus-muted">
                    {tracker.side.toUpperCase()} × {tracker.count} @ ${tracker.entry_price.toFixed(2)}
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="text-[10px] text-nexus-pink font-mono">
                    SL: ${tracker.stop_loss_price.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-nexus-green font-mono">
                    TP: ${tracker.take_profit_price.toFixed(2)}
                  </div>
                </div>
                {tracker.trailing_stop_active && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-nexus-yellow/10 text-nexus-yellow font-bold">
                    TRAIL
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last AI Analysis */}
      {trading.lastAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 glow-purple"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-nexus-purple" />
            <h3 className="text-sm font-semibold text-white">Latest AI Analysis</h3>
            <span className="ml-auto text-xs text-nexus-muted font-mono">
              {trading.lastAnalysisTicker}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                trading.lastAnalysis.signal.includes("BUY")
                  ? "bg-nexus-green/20 text-nexus-green"
                  : trading.lastAnalysis.signal.includes("SELL")
                    ? "bg-nexus-pink/20 text-nexus-pink"
                    : "bg-nexus-muted/20 text-nexus-muted"
              }`}
            >
              {trading.lastAnalysis.signal}
            </div>
            <span className="text-white text-sm font-semibold">
              {(trading.lastAnalysis.confidence * 100).toFixed(1)}%
            </span>
            <span
              className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                trading.lastAnalysis.risk_assessment === "LOW"
                  ? "bg-nexus-green/10 text-nexus-green"
                  : trading.lastAnalysis.risk_assessment === "MEDIUM"
                    ? "bg-nexus-yellow/10 text-nexus-yellow"
                    : "bg-nexus-pink/10 text-nexus-pink"
              }`}
            >
              {trading.lastAnalysis.risk_assessment}
            </span>
          </div>

          <p className="text-nexus-muted text-xs leading-relaxed">
            {trading.lastAnalysis.reasoning}
          </p>

          {trading.lastAnalysis.key_factors.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {trading.lastAnalysis.key_factors.map((f, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-xs bg-nexus-card border border-nexus-border text-nexus-muted"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Recent Trades */}
      {trading.tradeHistory.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Recent Trades</h3>
          <div className="space-y-2">
            {trading.tradeHistory.slice(0, 8).map((trade) => (
              <div
                key={trade.id}
                className="flex items-center gap-3 py-2 border-b border-nexus-border last:border-0"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    trade.status === "closed_sl"
                      ? "bg-nexus-pink/10 text-nexus-pink"
                      : trade.status === "closed_tp"
                        ? "bg-nexus-green/10 text-nexus-green"
                        : trade.status === "closed_trailing"
                          ? "bg-nexus-yellow/10 text-nexus-yellow"
                          : trade.action === "buy"
                            ? "bg-nexus-green/10 text-nexus-green"
                            : "bg-nexus-pink/10 text-nexus-pink"
                  }`}
                >
                  {trade.status === "closed_sl" ? "SL"
                    : trade.status === "closed_tp" ? "TP"
                    : trade.status === "closed_trailing" ? "TS"
                    : trade.action === "buy" ? "B" : "S"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white font-mono truncate">{trade.ticker}</div>
                  <div className="text-xs text-nexus-muted">
                    {trade.count}x @ ${trade.price.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-mono ${trade.pnl >= 0 ? "text-nexus-green" : "text-nexus-pink"}`}>
                    {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-nexus-muted">
                    {(trade.ai_confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
