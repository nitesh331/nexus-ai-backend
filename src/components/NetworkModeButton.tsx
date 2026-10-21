import React, { useState, useRef, useEffect } from 'react';
import { Zap, Globe, Cpu, Check, ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type NetworkMode = 'auto' | 'always-online' | 'always-offline';

export interface NetworkModeButtonProps {
  networkMode: NetworkMode;
  onNetworkModeChange?: (mode: NetworkMode) => void;
  isOnline: boolean;
  isDark: boolean;
  dropdownAlign?: 'left' | 'right';
  className?: string;
}

export default function NetworkModeButton({
  networkMode = 'auto',
  onNetworkModeChange,
  isOnline = true,
  isDark,
  dropdownAlign = 'right',
  className = ''
}: NetworkModeButtonProps) {
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setModeMenuOpen(false);
      }
    };
    if (modeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modeMenuOpen]);

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Network Mode Switcher (Fixed-Size Compact Apple Glass Pill) */}
      <button
        type="button"
        onClick={() => setModeMenuOpen(!modeMenuOpen)}
        title={`Network Routing: ${
          networkMode === 'auto'
            ? 'Auto Switch (Smart Connection)'
            : networkMode === 'always-online'
            ? 'Always Online (Live Sync)'
            : 'Always Offline (Device Mode)'
        } • Status: ${isOnline ? 'Online' : 'Offline'}`}
        className={`group relative flex h-8 sm:h-8.5 w-[98px] sm:w-[102px] items-center justify-between px-2.5 rounded-full border text-[11px] sm:text-xs font-medium transition-all duration-200 active:scale-95 touch-manipulation cursor-pointer select-none shrink-0 ${
          isDark
            ? 'bg-zinc-900/85 hover:bg-zinc-800 text-zinc-200 border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_8px_rgba(0,0,0,0.35)] hover:border-white/20 backdrop-blur-xl'
            : 'bg-white/85 hover:bg-white text-zinc-800 border-black/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_6px_rgba(0,0,0,0.05)] hover:border-black/15 backdrop-blur-xl'
        }`}
      >
        {/* Left: Consistent Status Indicator Dot + Mode Label */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
            {networkMode === 'auto' ? (
              isOnline ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"></span>
              )
            ) : networkMode === 'always-online' ? (
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
            ) : (
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]"></span>
            )}
          </span>
          <span className="font-medium text-[11px] sm:text-[11.5px] tracking-tight truncate">
            {networkMode === 'auto' ? 'Auto' : networkMode === 'always-online' ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Right: Hairline Divider + Apple Micro Chevron */}
        <div className="flex items-center shrink-0 pl-1">
          <span className={`h-2.5 w-px mr-1 ${isDark ? 'bg-white/10' : 'bg-black/8'}`}></span>
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full transition-all duration-200 ${
              isDark
                ? 'text-zinc-400 group-hover:text-zinc-200'
                : 'text-zinc-500 group-hover:text-zinc-800'
            }`}
          >
            <ChevronDown
              size={11}
              strokeWidth={2.2}
              className={`transition-transform duration-200 ease-out ${modeMenuOpen ? 'rotate-180' : ''}`}
            />
          </span>
        </div>
      </button>

      {/* Mode Dropdown Menu (Apple iOS Control Sheet Design) */}
      <AnimatePresence>
        {modeMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute ${
              dropdownAlign === 'left' ? 'left-0' : 'right-0'
            } mt-2.5 w-[284px] sm:w-[292px] p-2 rounded-[22px] border shadow-2xl z-50 backdrop-blur-3xl ${
              isDark
                ? 'bg-zinc-950/95 border-white/[0.15] text-zinc-100 shadow-[0_24px_50px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)]'
                : 'bg-white/95 border-black/[0.08] text-zinc-900 shadow-[0_20px_45px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)]'
            }`}
          >
            {/* Header section with live connectivity status */}
            <div
              className={`flex items-center justify-between px-3 py-2 pb-2.5 border-b mb-1.5 ${
                isDark ? 'border-white/[0.08]' : 'border-black/[0.06]'
              }`}
            >
              <span
                className={`text-[10px] font-semibold tracking-wider uppercase ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                Network Routing
              </span>
              <div
                className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  isOnline
                    ? isDark
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                    : isDark
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi size={11} className="text-emerald-500 shrink-0" />
                    <span className="font-semibold text-[10.5px]">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={11} className="text-amber-500 shrink-0" />
                    <span className="font-semibold text-[10.5px]">Offline / Maintenance</span>
                  </>
                )}
              </div>
            </div>

            {/* Option 1: Auto */}
            <button
              type="button"
              onClick={() => {
                onNetworkModeChange?.('auto');
                setModeMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-[16px] text-left transition-all active:scale-[0.98] cursor-pointer touch-manipulation ${
                networkMode === 'auto'
                  ? isDark
                    ? 'bg-white/[0.1] text-white ring-1 ring-white/20'
                    : 'bg-zinc-100/90 text-zinc-950 ring-1 ring-zinc-300'
                  : isDark
                  ? 'hover:bg-white/[0.05] text-zinc-300'
                  : 'hover:bg-zinc-100/70 text-zinc-700'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/25">
                  <Zap size={15} className="fill-white/20" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold text-[13px] leading-snug">
                    Auto Switch
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/20">
                      Smart
                    </span>
                  </div>
                  <p className={`text-[11px] leading-normal mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Smart live connection with seamless offline fallback
                  </p>
                </div>
              </div>
              {networkMode === 'auto' && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shrink-0 ml-2 shadow-xs">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </button>

            {/* Option 2: Always Online */}
            <button
              type="button"
              onClick={() => {
                onNetworkModeChange?.('always-online');
                setModeMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-[16px] text-left transition-all active:scale-[0.98] cursor-pointer touch-manipulation mt-1 ${
                networkMode === 'always-online'
                  ? isDark
                    ? 'bg-white/[0.1] text-white ring-1 ring-white/20'
                    : 'bg-zinc-100/90 text-zinc-950 ring-1 ring-zinc-300'
                  : isDark
                  ? 'hover:bg-white/[0.05] text-zinc-300'
                  : 'hover:bg-zinc-100/70 text-zinc-700'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/25">
                  <Globe size={15} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[13px] leading-snug">Always Online</div>
                  <p className={`text-[11px] leading-normal mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Dedicated live connection for real-time synthesis
                  </p>
                </div>
              </div>
              {networkMode === 'always-online' && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0 ml-2 shadow-xs">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </button>

            {/* Option 3: Always Offline */}
            <button
              type="button"
              onClick={() => {
                onNetworkModeChange?.('always-offline');
                setModeMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-[16px] text-left transition-all active:scale-[0.98] cursor-pointer touch-manipulation mt-1 ${
                networkMode === 'always-offline'
                  ? isDark
                    ? 'bg-white/[0.1] text-white ring-1 ring-white/20'
                    : 'bg-zinc-100/90 text-zinc-950 ring-1 ring-zinc-300'
                  : isDark
                  ? 'hover:bg-white/[0.05] text-zinc-300'
                  : 'hover:bg-zinc-100/70 text-zinc-700'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/25">
                  <Cpu size={15} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[13px] leading-snug">Always Offline</div>
                  <p className={`text-[11px] leading-normal mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    On-device offline engine exclusively for Chat Assistant
                  </p>
                </div>
              </div>
              {networkMode === 'always-offline' && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shrink-0 ml-2 shadow-xs">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
