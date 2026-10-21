import React from 'react';
import { SquarePen, Clock, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import type { NetworkMode } from './NetworkModeButton';

export type { NetworkMode };

interface HeaderProps {
  onMenuClick: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  onNewChat: () => void;
  isTemporaryChat?: boolean;
  onOpenDataControls?: () => void;
  networkMode?: NetworkMode;
  onNetworkModeChange?: (mode: NetworkMode) => void;
  isOnline?: boolean;
  activeWorkspace?: string;
  onOpenWebDesignSettings?: () => void;
}

function CustomImageLogo({ isDark }: { isDark: boolean }) {
  return (
    <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2.5 sm:gap-3 cursor-pointer group pointer-events-auto select-none bg-transparent">
      <motion.img 
        src="/logo.svg" 
        alt="Nexus AI Logo" 
        animate={{ 
          rotate: 360,
          scale: [1, 1.06, 1]
        }}
        transition={{ 
          rotate: { duration: 10, ease: "linear", repeat: Infinity },
          scale: { duration: 3.5, ease: "easeInOut", repeat: Infinity }
        }}
        whileHover={{ scale: 1.14 }}
        className="h-10 w-10 sm:h-11 sm:w-11 object-contain"
      />

      <span className={`text-[15px] sm:text-[17px] font-extrabold tracking-[0.24em] sm:tracking-[0.3em] uppercase transition-colors duration-200 whitespace-nowrap leading-none ${
        isDark 
          ? 'text-white' 
          : 'text-[#0f172a]'
      }`}>
        NEXUS AI
      </span>
    </div>
  );
}

export default function Header({ 
  onMenuClick, 
  isDark, 
  toggleTheme, 
  onNewChat,
  isTemporaryChat = false,
  onOpenDataControls,
  networkMode = 'auto',
  onNetworkModeChange,
  isOnline = true,
  activeWorkspace,
  onOpenWebDesignSettings
}: HeaderProps) {
  // Atal, Zenra, and Medhira have rich dark 3D backgrounds even when the home screen is in white mode
  const isDarkSurface =
    isDark ||
    activeWorkspace === 'deep-search' ||
    activeWorkspace === 'web-research' ||
    activeWorkspace === 'image-video' ||
    activeWorkspace === 'notes';

  return (
    <header className="flex h-14 sm:h-16 w-full items-center justify-between px-3 sm:px-6 relative z-30 shrink-0 select-none bg-transparent pt-[env(safe-area-inset-top,0px)]">
      {/* Left: Hamburger Menu (Staggered Stairs Design) */}
      <button
        onClick={onMenuClick}
        className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-colors active:scale-95 -ml-1 sm:ml-0 group touch-manipulation ${
          isDarkSurface
            ? 'hover:bg-white/10 text-white'
            : activeWorkspace === 'web-design'
              ? 'hover:bg-black/5 text-zinc-900'
              : 'hover:bg-purple-500/10 text-slate-900'
        }`}
        aria-label="Toggle Menu"
      >
        <div className="flex flex-col gap-[4.5px] sm:gap-[5px] w-5 relative">
          <span className={`block h-[2px] sm:h-[2.5px] w-[14px] rounded-full transition-all duration-300 self-end ${isDarkSurface ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]' : 'bg-[#0f172a]'}`}></span>
          <span className={`block h-[2px] sm:h-[2.5px] w-[14px] rounded-full transition-all duration-300 self-center ${isDarkSurface ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]' : 'bg-[#0f172a]'}`}></span>
          <span className={`block h-[2px] sm:h-[2.5px] w-[14px] rounded-full transition-all duration-300 self-start ${isDarkSurface ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]' : 'bg-[#0f172a]'}`}></span>
        </div>
      </button>

      {/* Center: Pure Logo & Name (Zero Background) */}
      <CustomImageLogo isDark={isDarkSurface} />

      {/* Right: Temporary Chat, Web Design Settings (when in Web Design), and New Chat */}
      <div className="flex items-center gap-1.5 sm:gap-2 -mr-1 sm:mr-0">
        {isTemporaryChat && (
          <button
            onClick={onOpenDataControls}
            title="Temporary Chat is active: Conversations remain only while this web app is open. Click to manage in Settings."
            className={`group flex h-9 sm:h-10 items-center gap-1.5 px-2.5 sm:px-3 rounded-full border transition-all duration-200 active:scale-95 touch-manipulation cursor-pointer ${
              isDarkSurface 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 shadow-sm'
            }`}
          >
            <Clock size={14} className="text-amber-500 animate-pulse shrink-0" />
            <span className="text-xs font-semibold">Temporary</span>
          </button>
        )}

        {/* Jaalix Settings Button (right next to New Chat) */}
        {activeWorkspace === 'web-design' && (
          <button
            type="button"
            onClick={onOpenWebDesignSettings}
            className={`group flex h-9 w-9 sm:h-10 sm:w-10 md:w-auto items-center justify-center gap-1.5 px-0 md:px-3.5 rounded-full border backdrop-blur-md transition-all duration-200 active:scale-95 touch-manipulation cursor-pointer shrink-0 ${
              isDarkSurface 
                ? 'bg-zinc-900/80 border-white/15 text-zinc-100 hover:bg-zinc-800 hover:border-white/30 shadow-[0_2px_10px_rgba(0,0,0,0.5)]' 
                : 'bg-white/90 border-zinc-300/90 text-zinc-900 hover:bg-zinc-100 hover:border-zinc-400 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
            }`}
            title="Jaalix Settings & All Functions (Modes, GitHub Sync, Explorer, Palettes, Layouts)"
            aria-label="Jaalix Settings"
          >
            <SlidersHorizontal size={15} className={`${isDarkSurface ? 'text-zinc-200 group-hover:text-white' : 'text-zinc-800 group-hover:text-black'} group-hover:rotate-45 transition-transform duration-300 shrink-0`} />
            <span className="hidden md:inline text-xs sm:text-sm font-semibold">Settings</span>
          </button>
        )}

        <button
          onClick={onNewChat}
          className={`group flex h-10 w-10 sm:h-10 sm:w-auto items-center justify-center gap-2 px-0 sm:px-4 rounded-full border backdrop-blur-md transition-all duration-200 active:scale-95 touch-manipulation ${
            isDarkSurface 
              ? 'bg-white/[0.06] border-white/15 text-slate-200 hover:bg-white/15 hover:text-white hover:border-white/30' 
              : activeWorkspace === 'web-design'
                ? 'bg-white/90 border-zinc-300/90 text-zinc-900 hover:bg-zinc-100 hover:text-black hover:border-zinc-400 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                : 'bg-white/80 border-purple-200/80 text-slate-700 hover:bg-white hover:text-purple-900 hover:border-purple-300 shadow-xs'
          }`}
          aria-label="New Chat"
        >
          <SquarePen size={16} strokeWidth={2} />
          <span className="hidden text-sm font-medium sm:block">New chat</span>
        </button>
      </div>
    </header>
  );
}

