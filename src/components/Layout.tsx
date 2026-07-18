import { motion } from "framer-motion";
import { LayoutDashboard, Terminal, Brain, Radio } from "lucide-react";
import { useNexusStore } from "../lib/store";
import type { ReactNode } from "react";

const TABS = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "scanner" as const, label: "Scanner", icon: Radio },
  { id: "workspace" as const, label: "AI Brain", icon: Brain },
  { id: "terminal" as const, label: "Terminal", icon: Terminal },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { activeTab, setActiveTab, isEngineRunning } = useNexusStore();

  return (
    <div className="h-screen flex flex-col bg-nexus-bg">
      {/* Top bar */}
      <header className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-nexus-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-nexus-accent/10 border border-nexus-accent/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-nexus-accent" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white leading-tight">NEXUS AI</h1>
            <p className="text-[10px] text-nexus-muted leading-tight">Kalshi Autonomous</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isEngineRunning ? "bg-nexus-green animate-pulse-glow" : "bg-nexus-muted"}`} />
          <span className="text-[10px] text-nexus-muted font-mono">
            {isEngineRunning ? "LIVE" : "IDLE"}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden relative">{children}</main>

      {/* Bottom Navigation */}
      <nav className="flex-shrink-0 border-t border-nexus-border/50 glass">
        <div className="flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all relative ${
                  isActive ? "text-nexus-accent" : "text-nexus-muted"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-nexus-accent rounded-full"
                  />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
