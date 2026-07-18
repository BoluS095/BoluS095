import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, ArrowRight } from "lucide-react";
import { useNexusStore } from "../lib/store";

// ─── Animated Node Component ────────────────────────────────────
function DataNode({
  x,
  y,
  label,
  value,
  color,
  delay,
}: {
  x: number;
  y: number;
  label: string;
  value: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      className="absolute flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: delay * 2 }}
        className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-1"
        style={{
          borderColor: `${color}40`,
          backgroundColor: `${color}10`,
          boxShadow: `0 0 20px ${color}20, 0 0 60px ${color}08`,
        }}
      >
        <span className="text-xs font-bold" style={{ color }}>
          {value}
        </span>
      </motion.div>
      <span className="text-[10px] text-nexus-muted font-medium">{label}</span>
    </motion.div>
  );
}

// ─── Connection Line ────────────────────────────────────────────
function ConnectionLine({
  x1,
  y1,
  x2,
  y2,
  color,
  delay,
  animated,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  delay: number;
  animated: boolean;
}) {
  return (
    <motion.line
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.3 }}
      transition={{ delay, duration: 1 }}
      x1={`${x1}%`}
      y1={`${y1}%`}
      x2={`${x2}%`}
      y2={`${y2}%`}
      stroke={color}
      strokeWidth="1"
      strokeDasharray={animated ? "4 4" : "none"}
    >
      {animated && (
        <animate
          attributeName="stroke-dashoffset"
          from="8"
          to="0"
          dur="1s"
          repeatCount="indefinite"
        />
      )}
    </motion.line>
  );
}

// ─── Consciousness Stream ───────────────────────────────────────
function ConsciousnessStream({ reasoning }: { reasoning: string }) {
  const words = reasoning.split(" ");
  const [visibleWords, setVisibleWords] = useState(0);

  useEffect(() => {
    setVisibleWords(0);
    const timer = setInterval(() => {
      setVisibleWords((prev) => {
        if (prev >= words.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [reasoning]);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-nexus-purple animate-pulse-glow" />
        <span className="text-xs font-semibold text-white">AI CONSCIOUSNESS STREAM</span>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-nexus-purple ml-auto"
        />
      </div>
      <div className="min-h-[60px]">
        <p className="text-sm leading-relaxed">
          {words.map((word, i) => (
            <motion.span
              key={`${i}-${word}`}
              initial={{ opacity: 0, y: 5 }}
              animate={i < visibleWords ? { opacity: 1, y: 0 } : { opacity: 0.1, y: 5 }}
              transition={{ duration: 0.15 }}
              className={`inline-block mr-1.5 ${
                i < visibleWords ? "text-white" : "text-nexus-border"
              }`}
            >
              {word}
            </motion.span>
          ))}
        </p>
      </div>
    </div>
  );
}

// ─── Signal Indicator ───────────────────────────────────────────
function SignalIndicator({
  signal,
  confidence,
}: {
  signal: string;
  confidence: number;
}) {
  const isBuy = signal.includes("BUY");
  const isSell = signal.includes("SELL");
  const isClose = signal === "CLOSE";
  const color = isBuy ? "#00ff88" : isSell ? "#ff3366" : isClose ? "#ffd700" : "#6b6b9e";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl p-4 text-center"
    >
      <div className="text-[10px] text-nexus-muted uppercase tracking-widest mb-2">
        Signal Output
      </div>
      <motion.div
        animate={signal !== "HOLD" ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-3xl font-black mb-2"
        style={{ color }}
      >
        {signal}
      </motion.div>
      {/* Confidence bar */}
      <div className="w-full h-2 bg-nexus-border rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="text-xs text-nexus-muted">
        Confidence: <span style={{ color }}>{(confidence * 100).toFixed(1)}%</span>
      </div>
    </motion.div>
  );
}

// ─── Key Factors ────────────────────────────────────────────────
function KeyFactors({ factors }: { factors: string[] }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-nexus-yellow" />
        <span className="text-xs font-semibold text-white">KEY FACTORS</span>
      </div>
      <div className="space-y-2">
        {factors.map((factor, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 text-xs"
          >
            <ArrowRight className="w-3 h-3 text-nexus-accent shrink-0" />
            <span className="text-nexus-text">{factor}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main AI Workspace ──────────────────────────────────────────
export default function AIWorkspace() {
  const { trading, config } = useNexusStore();
  const analysis = trading.lastAnalysis;

  const nodes = useMemo(() => {
    if (!analysis) return [];
    return [
      { x: 50, y: 15, label: "SIGNAL", value: analysis.signal, color: "#00d9ff" },
      { x: 20, y: 35, label: "CONFIDENCE", value: `${(analysis.confidence * 100).toFixed(0)}%`, color: "#a855f7" },
      { x: 80, y: 35, label: "RISK", value: analysis.risk_assessment, color: "#ff3366" },
      { x: 15, y: 60, label: "POSITION", value: String(analysis.suggested_size), color: "#ffd700" },
      { x: 50, y: 55, label: "PRICE", value: `$${(analysis.suggested_price / 100).toFixed(2)}`, color: "#00ff88" },
      { x: 85, y: 60, label: "E.V.", value: `$${analysis.expected_value.toFixed(2)}`, color: "#ff9f43" },
    ];
  }, [analysis]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-nexus-purple/10 border border-nexus-purple/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-nexus-purple" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">AI WORKSPACE</h2>
          <p className="text-xs text-nexus-muted">Gemini Decision Engine • Live Visualization</p>
        </div>
        {trading.lastAnalysisTicker && (
          <span className="ml-auto text-xs font-mono text-nexus-muted bg-nexus-card px-2 py-1 rounded-lg">
            {trading.lastAnalysisTicker}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {analysis ? (
          <motion.div
            key="analysis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Neural Network Visualization */}
            <div className="glass rounded-2xl p-4 relative" style={{ minHeight: 280 }}>
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                {nodes.map((node, i) =>
                  nodes.slice(i + 1).map((other, j) => (
                    <ConnectionLine
                      key={`${i}-${j}`}
                      x1={node.x}
                      y1={node.y}
                      x2={other.x}
                      y2={other.y}
                      color={node.color}
                      delay={0.5 + i * 0.1}
                      animated={i === 0 || j === 0}
                    />
                  ))
                )}
              </svg>
              <div className="relative" style={{ height: 250 }}>
                {nodes.map((node, i) => (
                  <DataNode
                    key={i}
                    x={node.x}
                    y={node.y}
                    label={node.label}
                    value={node.value}
                    color={node.color}
                    delay={0.3 + i * 0.1}
                  />
                ))}
              </div>

              {/* Animated scan line */}
              <motion.div
                animate={{ y: [0, 280, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-nexus-accent/30 to-transparent"
              />
            </div>

            {/* Signal + Confidence */}
            <div className="grid grid-cols-2 gap-3">
              <SignalIndicator signal={analysis.signal} confidence={analysis.confidence} />
              <div className="glass rounded-2xl p-4">
                <div className="text-[10px] text-nexus-muted uppercase tracking-widest mb-2">
                  Trade Details
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-nexus-muted">Size</span>
                    <span className="text-white font-mono">{analysis.suggested_size} contracts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-nexus-muted">Price</span>
                    <span className="text-white font-mono">${(analysis.suggested_price / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-nexus-muted">E.V.</span>
                    <span className={`font-mono ${analysis.expected_value >= 0 ? "text-nexus-green" : "text-nexus-pink"}`}>
                      ${analysis.expected_value.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-nexus-muted">Horizon</span>
                    <span className="text-white font-mono">{analysis.time_horizon}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Consciousness Stream */}
            <ConsciousnessStream reasoning={analysis.reasoning} />

            {/* Key Factors */}
            {analysis.key_factors.length > 0 && (
              <KeyFactors factors={analysis.key_factors} />
            )}

            {/* Time */}
            <div className="text-center text-[10px] text-nexus-muted">
              Last analysis: {new Date().toLocaleTimeString()} • Next cycle: 60s
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 rounded-full border-2 border-nexus-border border-t-nexus-accent mb-4"
            />
            <p className="text-nexus-muted text-sm mb-1">AI Engine Standby</p>
            <p className="text-nexus-muted text-xs">
              {config.autoTrade ? "Start the engine to begin analysis" : "Waiting for market data..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-4" />
    </div>
  );
}
