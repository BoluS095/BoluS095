import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCw,
  Plus,
  Minus,
  Eye,
  BarChart3,
  Clock,
  Filter,
  Radio,
} from "lucide-react";
import { useNexusStore } from "../lib/store";
import type { ScannerSortBy, ScannerFilterCategory } from "../lib/types";
import { SCANNER_CONFIG } from "../lib/constants";

const CATEGORIES: { value: ScannerFilterCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "politics", label: "Politics" },
  { value: "sports", label: "Sports" },
  { value: "crypto", label: "Crypto" },
  { value: "economics", label: "Economics" },
  { value: "science", label: "Science" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
];

function SpreadBar({ yesAsk, yesBid }: { yesAsk: number; yesBid: number }) {
  const spread = yesAsk > 0 && yesBid > 0 ? ((yesAsk - yesBid) / yesAsk) * 100 : 0;
  const color = spread < 5 ? "#00ff88" : spread < 10 ? "#ffd700" : "#ff3366";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-nexus-border rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(spread * 5, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>{spread.toFixed(1)}%</span>
    </div>
  );
}

export default function Scanner() {
  const {
    scannerMarkets, scannerLoading, scannerSort, scannerFilter, scannerSearch,
    setScannerSort, setScannerFilter, setScannerSearch, refreshScanner,
    addToWatchlist, removeFromWatchlist, trading, isEngineRunning,
  } = useNexusStore();

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (isEngineRunning && scannerMarkets.length === 0) {
      refreshScanner();
    }
  }, [isEngineRunning]);

  const sortedMarkets = useMemo(() => {
    let filtered = scannerMarkets;

    // Category filter
    if (scannerFilter !== "all") {
      filtered = filtered.filter((m) =>
        m.category.toLowerCase().includes(scannerFilter)
      );
    }

    // Search
    if (scannerSearch) {
      const q = scannerSearch.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.ticker.toLowerCase().includes(q) ||
          m.event_ticker.toLowerCase().includes(q)
      );
    }

    // Volume filter
    filtered = filtered.filter((m) => m.volume >= SCANNER_CONFIG.VOLUME_THRESHOLD);

    // Sort
    const sorted = [...filtered];
    switch (scannerSort) {
      case "volume":
        sorted.sort((a, b) => b.volume - a.volume);
        break;
      case "open_interest":
        sorted.sort((a, b) => b.open_interest - a.open_interest);
        break;
      case "spread":
        sorted.sort((a, b) => {
          const sa = a.yes_ask > 0 ? (a.yes_ask - a.yes_bid) / a.yes_ask : 1;
          const sb = b.yes_ask > 0 ? (b.yes_ask - b.yes_bid) / b.yes_ask : 1;
          return sa - sb;
        });
        break;
      case "price":
        sorted.sort((a, b) => b.last_price - a.last_price);
        break;
    }

    return sorted.slice(0, SCANNER_CONFIG.MAX_MARKETS_DISPLAY);
  }, [scannerMarkets, scannerSort, scannerFilter, scannerSearch]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-nexus-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-nexus-green animate-pulse" />
            <span className="text-xs font-semibold text-white">MARKET SCANNER</span>
            <span className="text-[10px] text-nexus-muted font-mono">({sortedMarkets.length})</span>
          </div>
          <button
            onClick={() => refreshScanner()}
            disabled={scannerLoading}
            className="p-1.5 rounded text-nexus-muted hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scannerLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 mb-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nexus-muted" />
            <input
              type="text"
              value={scannerSearch}
              onChange={(e) => setScannerSearch(e.target.value)}
              placeholder="Search markets, tickers..."
              className="w-full bg-nexus-bg border border-nexus-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-nexus-muted focus:border-nexus-accent focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showFilters ? "border-nexus-accent bg-nexus-accent/10" : "border-nexus-border"
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-nexus-muted" />
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {/* Categories */}
              <div className="flex flex-wrap gap-1 mb-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setScannerFilter(cat.value)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                      scannerFilter === cat.value
                        ? "bg-nexus-accent/20 text-nexus-accent"
                        : "text-nexus-muted hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              {/* Sort */}
              <div className="flex gap-1">
                {(["volume", "open_interest", "spread", "price"] as ScannerSortBy[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScannerSort(s)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                      scannerSort === s
                        ? "bg-nexus-purple/20 text-nexus-purple"
                        : "text-nexus-muted hover:text-white"
                    }`}
                  >
                    {s === "open_interest" ? "OI" : s.toUpperCase()}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Market List */}
      <div className="flex-1 overflow-y-auto">
        {!isEngineRunning ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <Radio className="w-8 h-8 text-nexus-border mb-3" />
            <p className="text-nexus-muted text-xs">Start the engine to scan markets</p>
          </div>
        ) : scannerLoading && scannerMarkets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <RefreshCw className="w-8 h-8 text-nexus-accent animate-spin mb-3" />
            <p className="text-nexus-muted text-xs">Scanning Kalshi markets...</p>
          </div>
        ) : sortedMarkets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <Search className="w-8 h-8 text-nexus-border mb-3" />
            <p className="text-nexus-muted text-xs">No markets match filters</p>
          </div>
        ) : (
          <div className="divide-y divide-nexus-border/50">
            {sortedMarkets.map((market) => {
              const isWatched = trading.watchlist.includes(market.ticker);
              const yesPrice = market.yes_ask / 100;
              const noPrice = market.no_ask / 100;
              const hasPosition = trading.openPositions.some((p) => p.ticker === market.ticker);

              return (
                <motion.div
                  key={market.ticker}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-white font-medium truncate max-w-[200px]">
                          {market.title}
                        </span>
                        {hasPosition && (
                          <span className="px-1 py-0.5 rounded text-[8px] bg-nexus-purple/20 text-nexus-purple font-bold">
                            POS
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-nexus-muted font-mono mt-0.5">
                        {market.ticker}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        isWatched
                          ? removeFromWatchlist(market.ticker)
                          : addToWatchlist(market.ticker)
                      }
                      className={`p-1 rounded transition-colors ${
                        isWatched
                          ? "bg-nexus-accent/20 text-nexus-accent"
                          : "text-nexus-muted hover:text-white"
                      }`}
                    >
                      {isWatched ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[10px]">
                    {/* YES/NO prices */}
                    <div className="flex gap-2">
                      <span className="text-nexus-green font-mono">
                        Y ${(yesPrice).toFixed(2)}
                      </span>
                      <span className="text-nexus-pink font-mono">
                        N ${(noPrice).toFixed(2)}
                      </span>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-1 text-nexus-muted">
                      <BarChart3 className="w-3 h-3" />
                      <span className="font-mono">{market.volume}</span>
                    </div>

                    {/* OI */}
                    <div className="flex items-center gap-1 text-nexus-muted">
                      <Eye className="w-3 h-3" />
                      <span className="font-mono">{market.open_interest}</span>
                    </div>

                    {/* Spread */}
                    <SpreadBar yesAsk={market.yes_ask} yesBid={market.yes_bid} />

                    {/* Time */}
                    <div className="ml-auto flex items-center gap-1 text-nexus-muted">
                      <Clock className="w-3 h-3" />
                      <span className="font-mono">
                        {new Date(market.close_time).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
