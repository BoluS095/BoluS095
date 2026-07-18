import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Terminal as TerminalIcon, Download } from "lucide-react";
import { useNexusStore } from "../lib/store";
import type { LogLevel } from "../lib/types";

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: "text-nexus-accent",
  success: "text-nexus-green",
  warning: "text-nexus-yellow",
  error: "text-nexus-pink",
  system: "text-nexus-purple",
  ai: "text-orange-400",
};

const LEVEL_PREFIX: Record<LogLevel, string> = {
  info: "●",
  success: "✓",
  warning: "⚠",
  error: "✗",
  system: "◆",
  ai: "⬡",
};

const SOURCE_LABELS: Record<string, string> = {
  kalshi: "KALSHI",
  gemini: "GEMINI",
  engine: "ENGINE",
  system: "SYS",
  error: "ERR",
};

export default function Terminal() {
  const { logs } = useNexusStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<"all" | LogLevel>("all");
  const [autoScroll, setAutoScroll] = useState(true);

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.level === filter);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0; // Logs are newest-first
    }
  }, [logs, autoScroll]);

  const exportLogs = () => {
    const text = filteredLogs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}`
      )
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Terminal header */}
      <div className="flex-shrink-0 p-3 border-b border-nexus-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-nexus-accent" />
            <span className="text-xs font-semibold text-white">OPERATIONS TERMINAL</span>
            <span className="text-xs text-nexus-muted font-mono">({filteredLogs.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                autoScroll
                  ? "bg-nexus-accent/20 text-nexus-accent"
                  : "text-nexus-muted hover:text-white"
              }`}
            >
              AUTO
            </button>
            <button
              onClick={exportLogs}
              className="p-1.5 rounded text-nexus-muted hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5">
          {(["all", "info", "success", "warning", "error", "ai", "system"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                filter === f
                  ? "bg-nexus-accent/20 text-nexus-accent"
                  : "text-nexus-muted hover:text-white"
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 bg-black/30"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <TerminalIcon className="w-8 h-8 text-nexus-border mx-auto mb-2" />
              <p className="text-nexus-muted text-xs">Waiting for engine activity...</p>
            </div>
          </div>
        ) : (
          <div className="terminal-text space-y-0.5">
            {filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex gap-2 py-0.5 hover:bg-white/[0.02] ${LEVEL_COLORS[log.level]}`}
              >
                <span className="text-nexus-muted shrink-0 w-[70px]">
                  {new Date(log.timestamp).toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className="shrink-0 w-[14px] text-center">
                  {LEVEL_PREFIX[log.level]}
                </span>
                <span className="shrink-0 w-[55px] text-nexus-muted font-bold">
                  [{SOURCE_LABELS[log.source] || log.source}]
                </span>
                <span className="flex-1 break-words">{log.message}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,217,255,0.1) 2px, rgba(0,217,255,0.1) 4px)",
          }}
        />
      </div>
    </div>
  );
}
