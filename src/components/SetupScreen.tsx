import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Flame, Key, Brain, ChevronRight, CheckCircle, ShieldCheck, TrendingUp, ArrowUpCircle, Clock } from "lucide-react";
import { useNexusStore } from "../lib/store";
import { PROFILES, PROFILE_COLORS } from "../lib/constants";
import type { TradingProfile } from "../lib/types";

const PROFILE_ICONS: Record<TradingProfile, typeof Shield> = {
  conservative: Shield,
  moderate: Zap,
  aggressive: Flame,
};

export default function SetupScreen() {
  const { config, setConfig } = useNexusStore();
  const [step, setStep] = useState(0);
  const [kalshiKey, setKalshiKey] = useState(config.kalshiApiKeyId);
  const [privateKey, setPrivateKey] = useState(config.kalshiPrivateKeyPem);
  const [geminiKey, setGeminiKey] = useState(config.geminiApiKey);
  const [selectedProfile, setSelectedProfile] = useState<TradingProfile>(config.profile);

  const steps = [
    { title: "Kalshi API Key", icon: Key },
    { title: "Private Key (PEM)", icon: Key },
    { title: "Gemini API Key", icon: Brain },
    { title: "Trading Profile & Risk", icon: Zap },
  ];

  const handleComplete = () => {
    setConfig({
      kalshiApiKeyId: kalshiKey,
      kalshiPrivateKeyPem: privateKey,
      geminiApiKey: geminiKey,
      profile: selectedProfile,
      isSetupComplete: true,
    });
  };

  const canProceed = () => {
    if (step === 0) return kalshiKey.length > 0;
    if (step === 1) return privateKey.length > 10;
    if (step === 2) return geminiKey.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-nexus-bg bg-grid flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-nexus-card border border-nexus-border flex items-center justify-center glow-accent"
          >
            <Brain className="w-10 h-10 text-nexus-accent" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-1">Kalshi Nexus AI</h1>
          <p className="text-nexus-muted text-sm">Autonomous Trading Intelligence</p>
          <p className="text-nexus-green text-xs mt-1 font-mono">$10 Micro-Capital Optimized</p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          {steps.map((_s, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-nexus-accent" : "bg-nexus-border"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="glass rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              {(() => { const Icon = steps[step].icon; return <Icon className="w-5 h-5 text-nexus-accent" />; })()}
              <h2 className="text-lg font-semibold text-white">{steps[step].title}</h2>
            </div>

            {step === 0 && (
              <div>
                <p className="text-nexus-muted text-sm mb-3">Enter your Kalshi API Key ID from your account settings.</p>
                <input
                  type="text"
                  value={kalshiKey}
                  onChange={(e) => setKalshiKey(e.target.value)}
                  placeholder="e.g. abc123-def456-..."
                  className="w-full bg-nexus-bg border border-nexus-border rounded-xl px-4 py-3 text-white placeholder-nexus-muted focus:border-nexus-accent focus:outline-none transition-colors font-mono text-sm"
                />
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="text-nexus-muted text-sm mb-3">Paste your RSA private key (PEM format) for API request signing.</p>
                <textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
                  rows={6}
                  className="w-full bg-nexus-bg border border-nexus-border rounded-xl px-4 py-3 text-white placeholder-nexus-muted focus:border-nexus-accent focus:outline-none transition-colors font-mono text-xs resize-none"
                />
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="text-nexus-muted text-sm mb-3">Enter your Gemini API key from Google AI Studio.</p>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full bg-nexus-bg border border-nexus-border rounded-xl px-4 py-3 text-white placeholder-nexus-muted focus:border-nexus-accent focus:outline-none transition-colors font-mono text-sm"
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-nexus-muted text-sm mb-1">Choose your profile and risk management settings.</p>

                {/* Profiles */}
                <div className="space-y-2">
                  {(Object.keys(PROFILES) as TradingProfile[]).map((key) => {
                    const p = PROFILES[key];
                    const Icon = PROFILE_ICONS[key];
                    const isSelected = selectedProfile === key;
                    const color = PROFILE_COLORS[key];
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedProfile(key)}
                        className={`w-full text-left rounded-xl p-3 border transition-all duration-200 ${
                          isSelected ? "border-nexus-accent bg-nexus-accent/5" : "border-nexus-border bg-nexus-bg hover:border-nexus-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                            <Icon className="w-4 h-4" style={{ color }} />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white text-sm">{p.name}</div>
                            <div className="text-nexus-muted text-xs">{p.description}</div>
                          </div>
                          {isSelected && <CheckCircle className="w-5 h-5" style={{ color }} />}
                        </div>
                        {isSelected && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3 pt-3 border-t border-nexus-border grid grid-cols-3 gap-2 text-xs">
                            <div><span className="text-nexus-muted">Position:</span> <span className="text-white">{p.max_position_pct}%</span></div>
                            <div><span className="text-nexus-muted">SL:</span> <span className="text-nexus-pink">{p.stop_loss_pct}%</span></div>
                            <div><span className="text-nexus-muted">TP:</span> <span className="text-nexus-green">{p.take_profit_pct}%</span></div>
                            <div><span className="text-nexus-muted">Trail:</span> <span className="text-nexus-yellow">{p.trailing_stop_pct}%</span></div>
                            <div><span className="text-nexus-muted">Confidence:</span> <span className="text-white">≥{(p.min_confidence * 100).toFixed(0)}%</span></div>
                            <div><span className="text-nexus-muted">Trades/h:</span> <span className="text-white">{p.max_trades_per_hour}</span></div>
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Risk Management Info */}
                <div className="bg-nexus-bg rounded-xl p-3 border border-nexus-border">
                  <div className="text-[10px] text-nexus-muted uppercase tracking-widest mb-2">Built-in Risk Management</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-nexus-pink" /><span className="text-nexus-muted">Stop-Loss</span></div>
                    <div className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-nexus-yellow" /><span className="text-nexus-muted">Trailing Stop</span></div>
                    <div className="flex items-center gap-1.5"><ArrowUpCircle className="w-3 h-3 text-nexus-green" /><span className="text-nexus-muted">Take-Profit</span></div>
                    <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-nexus-purple" /><span className="text-nexus-muted">24h Timeout</span></div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-xl border border-nexus-border text-nexus-muted hover:text-white hover:border-nexus-muted transition-all text-sm"
            >
              Back
            </button>
          )}
          <button
            onClick={() => { if (step < 3) setStep(step + 1); else handleComplete(); }}
            disabled={!canProceed()}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              canProceed()
                ? "bg-nexus-accent text-nexus-bg hover:bg-nexus-accent/80 glow-accent"
                : "bg-nexus-border text-nexus-muted cursor-not-allowed"
            }`}
          >
            {step < 3 ? (<>Continue <ChevronRight className="w-4 h-4" /></>) : (<>Launch Nexus AI <Zap className="w-4 h-4" /></>)}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
