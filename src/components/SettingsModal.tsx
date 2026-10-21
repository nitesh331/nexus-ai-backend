import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Key, Cpu, Trash2, Palette, Sliders, Database, AlertCircle, Check, Sun, Moon, Wand2, Download, MessageSquare, Globe, Code, FileText, Image as ImageIcon, Eye, EyeOff, Clock, Info, Wifi, WifiOff, Zap, ChevronDown, CornerDownLeft, RotateCcw } from 'lucide-react';
import { useLocalStorage, isChatStorageKey } from '../hooks/useLocalStorage';
import type { NetworkMode } from './NetworkModeButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onThemeChange?: (isDark: boolean) => void;
  initialTab?: string;
  networkMode?: NetworkMode;
  onNetworkModeChange?: (mode: NetworkMode) => void;
  isOnline?: boolean;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  isDark, 
  onThemeChange, 
  initialTab,
  networkMode,
  onNetworkModeChange,
  isOnline
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'general');
  const [theme, setTheme] = useState(isDark ? 'Dark' : 'Light');
  const [localNetworkMode, setLocalNetworkMode] = useLocalStorage<NetworkMode>('setting-network-mode', 'auto');
  const [networkExpanded, setNetworkExpanded] = useState(false);
  const currentNetworkMode = networkMode ?? localNetworkMode;
  const currentIsOnline = isOnline ?? (typeof navigator !== 'undefined' ? navigator.onLine : true);

  const handleNetworkModeChange = (mode: NetworkMode) => {
    setLocalNetworkMode(mode);
    onNetworkModeChange?.(mode);
  };

  const [model, setModel] = useLocalStorage('setting-selected-model', 'Nexus Elite');
  useEffect(() => {
    const validModels = ['Nexus Elite', 'Nexus Advanced', 'Nexus Standard', 'Nexus Fast', 'Nexus Pro', 'Nexus Core'];
    if (!validModels.includes(model)) setModel('Nexus Elite');
  }, [model, setModel]);
  const [enhancePromptEnabled, setEnhancePromptEnabled] = useLocalStorage('setting-prompt-enhance', false);
  const [customInstructions, setCustomInstructions] = useLocalStorage('setting-custom-instructions', '');
  const [temporaryChat, setTemporaryChat] = useLocalStorage<boolean>('setting-temporary-chat', false);
  const [enterToSend, setEnterToSend] = useLocalStorage<boolean>('setting-enter-to-send', true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const handleToggleTemporaryChat = (enable: boolean) => {
    setTemporaryChat(enable);
    try {
      if (typeof window !== 'undefined') {
        if (enable) {
          Object.keys(localStorage).forEach(key => {
            if (isChatStorageKey(key)) {
              const val = localStorage.getItem(key);
              if (val) {
                sessionStorage.setItem(key, val);
                localStorage.removeItem(key);
              }
            }
          });
        } else {
          Object.keys(sessionStorage).forEach(key => {
            if (isChatStorageKey(key)) {
              const val = sessionStorage.getItem(key);
              if (val) {
                localStorage.setItem(key, val);
              }
            }
          });
        }
        window.dispatchEvent(new CustomEvent('temporary-chat-changed', { detail: { enabled: enable } }));
      }
    } catch (e) {
      console.warn('Error toggling temporary chat:', e);
    }
  };

  const instructionTemplates = [
    "Keep answers concise and direct.",
    "Always use TypeScript for code.",
    "Explain simply for beginners.",
    "Format data in Markdown tables."
  ];

  const toggleTemplate = (text: string) => {
    if (customInstructions.includes(text)) {
      setCustomInstructions(prev => prev.replace(text, '').replace(/^\s*[\r\n]/gm, '').trim());
    } else {
      setCustomInstructions(prev => prev ? `${prev}\n${text}` : text);
    }
  };

  // Reset confirmation state when tab changes
  useEffect(() => {
    setIsConfirmingDelete(false);
  }, [activeTab]);

  if (!isOpen) return null;

  const handleExportData = () => {
    const dataToExport: Record<string, string> = {};
    const primaryStorage = temporaryChat ? sessionStorage : localStorage;
    Object.keys(primaryStorage).forEach(key => {
      if (key.startsWith('workspace-messages-') || key.startsWith('app-user-name')) {
        dataToExport[key] = primaryStorage.getItem(key) || '';
      }
    });
    Object.keys(localStorage).forEach(key => {
      if ((key.startsWith('workspace-messages-') || key.startsWith('app-user-name')) && !dataToExport[key]) {
        dataToExport[key] = localStorage.getItem(key) || '';
      }
    });
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConfirmDeleteAllData = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('workspace-messages-') || key.startsWith('workspace-input-') || key.startsWith('companion-chat-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('workspace-messages-') || key.startsWith('workspace-input-') || key.startsWith('companion-chat-')) {
        sessionStorage.removeItem(key);
      }
    });
    window.location.reload();
  };

  const handleManageSubscription = () => {
    alert('Redirecting to subscription management portal...');
  };

  const tabs = [
    { id: 'general', icon: <Sliders size={18} />, label: 'General' },
    { id: 'assistants', icon: <Wand2 size={18} />, label: 'Assistants' },
    { id: 'model', icon: <Cpu size={18} />, label: 'Core Engine' },
    { id: 'account', icon: <User size={18} />, label: 'Account' },
    { id: 'data', icon: <Database size={18} />, label: 'Data Controls' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-4xl flex flex-col md:flex-row overflow-hidden rounded-[2rem] shadow-2xl relative ${
            isDark ? 'bg-gray-900 border border-white/10 text-white' : 'bg-white border border-gray-200 text-gray-900'
          }`}
          style={{ height: '85vh', maxHeight: '700px' }}
        >
          {/* Close button - absolute for both mobile and desktop */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isDark ? 'bg-black/20 hover:bg-white/10 text-gray-400 hover:text-white backdrop-blur-md' : 'bg-white/50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 backdrop-blur-md'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Sidebar / Tabs */}
          <div className={`w-full md:w-64 flex-shrink-0 md:border-r border-b p-3 md:p-4 flex flex-col z-10 ${isDark ? 'border-white/10 md:bg-gray-900/50 bg-gray-900' : 'border-gray-200 md:bg-gray-50 bg-white'}`}>
            <h2 className="text-xl font-bold mb-3 md:mb-6 px-2 md:px-3 pt-1">Settings</h2>
            <nav className="flex md:flex-col gap-1 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap shrink-0 ${
                    activeTab === tab.id
                      ? (isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm border border-gray-200')
                      : (isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
            <div className="flex-1 overflow-y-auto p-5 md:p-8 pt-6 md:pt-8 pb-20 md:pb-12 min-h-0">
              {activeTab === 'general' && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-6">
                  {/* Page Header with clean typography & status bar */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight">General</h3>
                      <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        Workspace appearance, network connectivity, and AI personalization.
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 text-[11px] font-medium self-start sm:self-auto ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      <span>Routing: <strong className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>{currentNetworkMode === 'auto' ? 'Auto Switch' : currentNetworkMode === 'always-online' ? 'Always Online' : 'Always Offline'}</strong></span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${currentIsOnline ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]'}`} />
                        <span>{currentIsOnline ? 'Connected' : 'Offline'}</span>
                      </span>
                    </div>
                  </div>

                  {/* GROUP 1: Connectivity & Network Routing */}
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1 text-zinc-500 dark:text-zinc-400">
                      Connectivity & Routing
                    </h4>
                    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isDark 
                        ? 'bg-zinc-900/60 border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.3)]' 
                        : 'bg-white border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                    }`}>
                      {/* Top Row */}
                      <div className="flex items-center justify-between p-3.5 sm:p-4 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/25">
                            <Wifi size={17} strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm sm:text-[15px] leading-snug">Network Routing Mode</p>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                currentIsOnline
                                  ? (isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                                  : (isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200')
                              }`}>
                                {currentIsOnline ? 'Connected' : 'Offline'}
                              </span>
                            </div>
                            <p className={`text-xs sm:text-[13px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'} mt-0.5 line-clamp-1 sm:line-clamp-none`}>
                              Smart connection switching between live sync and device offline mode
                            </p>
                          </div>
                        </div>

                        {/* Network Mode Switcher (Fixed-Size Compact Apple Glass Pill) */}
                        <div className="flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setNetworkExpanded(!networkExpanded)}
                            title={`Network Routing: ${
                              currentNetworkMode === 'auto'
                                ? 'Auto Switch (Smart Connection)'
                                : currentNetworkMode === 'always-online'
                                ? 'Always Online (Live Sync)'
                                : 'Always Offline (Device Mode)'
                            } • Status: ${currentIsOnline ? 'Online' : 'Offline'}`}
                            className={`group relative flex h-8 sm:h-8.5 w-[98px] sm:w-[102px] items-center justify-between px-2.5 rounded-full border text-[11px] sm:text-xs font-medium transition-all duration-200 active:scale-95 touch-manipulation cursor-pointer select-none shrink-0 ${
                              isDark 
                                ? 'bg-zinc-900/85 hover:bg-zinc-800 text-zinc-200 border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_8px_rgba(0,0,0,0.35)] hover:border-white/20 backdrop-blur-xl' 
                                : 'bg-white/85 hover:bg-white text-zinc-800 border-black/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_6px_rgba(0,0,0,0.05)] hover:border-black/15 backdrop-blur-xl'
                            }`}
                          >
                            {/* Left: Consistent Status Indicator Dot + Mode Label */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
                                {currentNetworkMode === 'auto' ? (
                                  currentIsOnline ? (
                                    <>
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                                    </>
                                  ) : (
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"></span>
                                  )
                                ) : currentNetworkMode === 'always-online' ? (
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                                ) : (
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]"></span>
                                )}
                              </span>
                              <span className="font-medium text-[11px] sm:text-[11.5px] tracking-tight truncate">
                                {currentNetworkMode === 'auto' ? 'Auto' : currentNetworkMode === 'always-online' ? 'Online' : 'Offline'}
                              </span>
                            </div>

                            {/* Right: Hairline Divider + Apple Micro Chevron */}
                            <div className="flex items-center shrink-0 pl-1">
                              <span className={`h-2.5 w-px mr-1 ${isDark ? 'bg-white/10' : 'bg-black/8'}`}></span>
                              <span className={`flex h-4 w-4 items-center justify-center rounded-full transition-all duration-200 ${
                                isDark 
                                  ? 'text-zinc-400 group-hover:text-zinc-200' 
                                  : 'text-zinc-500 group-hover:text-zinc-800'
                              }`}>
                                <ChevronDown 
                                  size={11} 
                                  strokeWidth={2.2}
                                  className={`transition-transform duration-200 ease-out ${networkExpanded ? 'rotate-180' : ''}`} 
                                />
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Inline Expandable Control Sheet (Zero Clipping Risk) */}
                      <AnimatePresence>
                        {networkExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden border-t border-dashed px-3 sm:px-4 pb-3 sm:pb-4 pt-3 border-inherit"
                          >
                            <div className={`p-2.5 sm:p-3 rounded-2xl border ${
                              isDark 
                                ? 'bg-zinc-950/70 border-white/[0.08]' 
                                : 'bg-white border-gray-200 shadow-sm'
                            }`}>
                              {/* Sheet Title Header */}
                              <div className={`flex items-center justify-between px-2 pb-2.5 mb-1.5 border-b ${
                                isDark ? 'border-white/[0.08]' : 'border-gray-100'
                              }`}>
                                <span className={`text-[10px] font-semibold tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                  Select Routing Mode
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  Unified Chat History Preserved
                                </span>
                              </div>

                              {/* Option 1: Auto */}
                              <button
                                type="button"
                                onClick={() => handleNetworkModeChange('auto')}
                                className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition-all active:scale-[0.99] cursor-pointer touch-manipulation ${
                                  currentNetworkMode === 'auto'
                                    ? (isDark ? 'bg-white/[0.1] text-white ring-1 ring-white/20' : 'bg-zinc-100 text-zinc-950 ring-1 ring-zinc-300')
                                    : (isDark ? 'hover:bg-white/[0.05] text-zinc-300' : 'hover:bg-zinc-50 text-zinc-700')
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
                                    <p className={`text-[11px] sm:text-[11.5px] leading-normal mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                      Smart live connection with seamless automatic switch to offline mode
                                    </p>
                                  </div>
                                </div>
                                {currentNetworkMode === 'auto' && (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shrink-0 ml-2 shadow-xs">
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                )}
                              </button>

                              {/* Option 2: Always Online */}
                              <button
                                type="button"
                                onClick={() => handleNetworkModeChange('always-online')}
                                className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition-all active:scale-[0.99] cursor-pointer touch-manipulation mt-1 ${
                                  currentNetworkMode === 'always-online'
                                    ? (isDark ? 'bg-white/[0.1] text-white ring-1 ring-white/20' : 'bg-zinc-100 text-zinc-950 ring-1 ring-zinc-300')
                                    : (isDark ? 'hover:bg-white/[0.05] text-zinc-300' : 'hover:bg-zinc-50 text-zinc-700')
                                }`}
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/25">
                                    <Globe size={15} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-[13px] leading-snug">Always Online</div>
                                    <p className={`text-[11px] sm:text-[11.5px] leading-normal mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                      Dedicated live connection for real-time intelligence and synthesis
                                    </p>
                                  </div>
                                </div>
                                {currentNetworkMode === 'always-online' && (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0 ml-2 shadow-xs">
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                )}
                              </button>

                              {/* Option 3: Always Offline */}
                              <button
                                type="button"
                                onClick={() => handleNetworkModeChange('always-offline')}
                                className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition-all active:scale-[0.99] cursor-pointer touch-manipulation mt-1 ${
                                  currentNetworkMode === 'always-offline'
                                    ? (isDark ? 'bg-white/[0.1] text-white ring-1 ring-white/20' : 'bg-zinc-100 text-zinc-950 ring-1 ring-zinc-300')
                                    : (isDark ? 'hover:bg-white/[0.05] text-zinc-300' : 'hover:bg-zinc-50 text-zinc-700')
                                }`}
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/25">
                                    <Cpu size={15} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-[13px] leading-snug">Always Offline</div>
                                    <p className={`text-[11px] sm:text-[11.5px] leading-normal mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                      On-device offline engine exclusively for Chat Assistant
                                    </p>
                                  </div>
                                </div>
                                {currentNetworkMode === 'always-offline' && (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shrink-0 ml-2 shadow-xs">
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                )}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* GROUP 2: Appearance & Theme */}
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1 text-zinc-500 dark:text-zinc-400">
                      Appearance
                    </h4>
                    <div className={`rounded-2xl border transition-all duration-300 ${
                      isDark 
                        ? 'bg-zinc-900/60 border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.3)]' 
                        : 'bg-white border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                    }`}>
                      <div className="flex items-center justify-between p-3.5 sm:p-4 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/25">
                            <Palette size={17} strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm sm:text-[15px] leading-snug">Interface Theme</p>
                            <p className={`text-xs sm:text-[13px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'} mt-0.5`}>
                              Switch between light and dark modes
                            </p>
                          </div>
                        </div>

                        {/* Apple-style Segmented Theme Pill */}
                        <div className="flex-shrink-0">
                          <div className={`relative flex items-center p-1 rounded-full w-44 sm:w-48 h-9 ${
                            isDark ? 'bg-zinc-950/80 border border-white/10' : 'bg-zinc-100 border border-zinc-200/80'
                          }`}>
                            <div 
                              className={`absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-transform duration-200 ease-out shadow-sm ${
                                isDark 
                                  ? 'bg-zinc-800 border border-white/10 translate-x-full' 
                                  : 'bg-white border border-black/5 translate-x-0'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setTheme('Light');
                                if (onThemeChange) onThemeChange(false);
                              }}
                              className={`relative flex-1 flex items-center justify-center gap-1.5 h-full rounded-full text-xs font-semibold z-10 transition-colors touch-manipulation ${
                                !isDark ? 'text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              <Sun size={13} strokeWidth={2.2} /> Light
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTheme('Dark');
                                if (onThemeChange) onThemeChange(true);
                              }}
                              className={`relative flex-1 flex items-center justify-center gap-1.5 h-full rounded-full text-xs font-semibold z-10 transition-colors touch-manipulation ${
                                isDark ? 'text-white' : 'text-zinc-500 hover:text-zinc-800'
                              }`}
                            >
                              <Moon size={13} strokeWidth={2.2} /> Dark
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GROUP 3: Chat Experience & Workflow */}
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1 text-zinc-500 dark:text-zinc-400">
                      Chat Experience
                    </h4>
                    <div className={`rounded-2xl border transition-all duration-300 divide-y ${
                      isDark 
                        ? 'bg-zinc-900/60 border-white/[0.08] divide-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.3)]' 
                        : 'bg-white border-zinc-200/80 divide-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                    }`}>
                      {/* Row 1: Prompt Auto-Enhance */}
                      <div className="flex items-center justify-between p-3.5 sm:p-4 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/25">
                            <Wand2 size={17} strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm sm:text-[15px] leading-snug">Prompt Auto-Enhance</p>
                            <p className={`text-xs sm:text-[13px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'} mt-0.5`}>
                              Show magic wand in chat to expand and refine prompts with AI
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={enhancePromptEnabled}
                            onClick={() => setEnhancePromptEnabled(!enhancePromptEnabled)}
                            className={`relative inline-flex h-[28px] w-[50px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 touch-manipulation ${
                              enhancePromptEnabled
                                ? 'bg-emerald-500 shadow-xs'
                                : isDark ? 'bg-zinc-700/80 shadow-inner' : 'bg-zinc-300 shadow-inner'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                enhancePromptEnabled ? 'translate-x-[24px]' : 'translate-x-[3px]'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Press Enter to Send */}
                      <div className="flex items-center justify-between p-3.5 sm:p-4 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/25">
                            <CornerDownLeft size={17} strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm sm:text-[15px] leading-snug">Press Enter to Send</p>
                            <p className={`text-xs sm:text-[13px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'} mt-0.5`}>
                              Send message instantly on Enter. When off, use Shift + Enter or Cmd + Enter
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={enterToSend}
                            onClick={() => setEnterToSend(!enterToSend)}
                            className={`relative inline-flex h-[28px] w-[50px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 touch-manipulation ${
                              enterToSend
                                ? 'bg-blue-500 shadow-xs'
                                : isDark ? 'bg-zinc-700/80 shadow-inner' : 'bg-zinc-300 shadow-inner'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                enterToSend ? 'translate-x-[24px]' : 'translate-x-[3px]'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Row 3: Temporary Chat Mode */}
                      <div className="flex items-center justify-between p-3.5 sm:p-4 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/25">
                            <Clock size={17} strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm sm:text-[15px] leading-snug">Temporary Chat Session</p>
                            <p className={`text-xs sm:text-[13px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'} mt-0.5`}>
                              Keep conversations in temporary RAM only; not saved to browser history
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={temporaryChat}
                            onClick={() => handleToggleTemporaryChat(!temporaryChat)}
                            className={`relative inline-flex h-[28px] w-[50px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 touch-manipulation ${
                              temporaryChat
                                ? 'bg-amber-500 shadow-xs'
                                : isDark ? 'bg-zinc-700/80 shadow-inner' : 'bg-zinc-300 shadow-inner'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                temporaryChat ? 'translate-x-[24px]' : 'translate-x-[3px]'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GROUP 4: AI Personalization (Custom Instructions) */}
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1 text-zinc-500 dark:text-zinc-400">
                      AI Personalization
                    </h4>
                    <div className={`rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
                      isDark 
                        ? 'bg-zinc-900/60 border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.3)]' 
                        : 'bg-white border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                    }`}>
                      <div className="flex items-start gap-3 mb-3.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/25">
                          <Sliders size={17} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm sm:text-[15px] leading-snug">Custom Instructions</p>
                          <p className={`text-xs sm:text-[13px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'} mt-0.5`}>
                            Tailor the AI's persona, depth, and coding style to match your preferences.
                          </p>
                        </div>
                      </div>

                      {/* Quick Suggestion Chips */}
                      <div className="flex overflow-x-auto hide-scrollbar gap-1.5 pb-2.5 pt-1">
                        {instructionTemplates.map((template, idx) => {
                          const isSelected = customInstructions.includes(template);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleTemplate(template)}
                              className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full transition-all border active:scale-95 touch-manipulation cursor-pointer ${
                                isSelected 
                                  ? (isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-xs' : 'bg-purple-50 text-purple-700 border-purple-200 shadow-xs')
                                  : (isDark ? 'bg-zinc-800/80 text-zinc-300 border-white/10 hover:bg-zinc-700/80 hover:text-white' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200/70 hover:text-zinc-900')
                              }`}
                            >
                              {isSelected && <Check size={12} className="inline-block mr-1 -mt-0.5" />}
                              {template}
                            </button>
                          );
                        })}
                      </div>

                      {/* Textarea Surface */}
                      <div className="relative mt-1">
                        <textarea 
                          value={customInstructions}
                          onChange={(e) => setCustomInstructions(e.target.value)}
                          placeholder="e.g. I work as a senior engineer. Keep answers concise, avoid fluff, use TypeScript with strict typing, and format tabular data in markdown..."
                          rows={4}
                          className={`w-full p-3.5 rounded-xl border resize-none transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 ${
                            isDark 
                              ? 'bg-zinc-950/70 border-white/10 text-white placeholder-zinc-600' 
                              : 'bg-zinc-50/80 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                          }`}
                        />
                        {/* Textarea Bottom Bar */}
                        <div className="flex items-center justify-between mt-1 px-1">
                          <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            {customInstructions.length > 0 ? `${customInstructions.length} characters` : 'Applied across all AI conversations'}
                          </span>
                          {customInstructions && (
                            <button
                              type="button"
                              onClick={() => setCustomInstructions('')}
                              className={`flex items-center gap-1 text-[11px] font-medium transition-colors p-1 rounded-md cursor-pointer ${
                                isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                              }`}
                            >
                              <RotateCcw size={11} /> Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'assistants' && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">Multi-Agent Architecture</h3>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Configure and monitor active sub-agents in the system.
                      </p>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      System Online
                    </span>
                  </div>

                  <div className="space-y-6 mt-8">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-70">Active Sub-Agents</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { name: "Chat Engine", desc: "General reasoning & dialog", icon: <MessageSquare size={16} />, color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
                          { name: "Atal", desc: "Live web synthesis", icon: <Globe size={16} />, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
                          { name: "Code Studio", desc: "UI/UX & code generation", icon: <Code size={16} />, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                          { name: "Zenra", desc: "Image & video generation", icon: <ImageIcon size={16} />, color: "bg-rose-500/10 text-rose-400 border-rose-500/20" }
                        ].map((agent, i) => (
                          <div key={i} className={`relative overflow-hidden p-4 rounded-xl border transition-all duration-300 ${isDark ? 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]' : 'bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg border ${agent.color}`}>
                                {agent.icon}
                              </div>
                              <div>
                                <h5 className="font-semibold text-sm">{agent.name}</h5>
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{agent.desc}</p>
                              </div>
                            </div>
                            <div className="absolute top-4 right-4">
                              <div className="w-2 h-2 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === 'model' && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center py-12 text-center">
                  <div className={`w-20 h-20 mb-6 rounded-[24px] flex items-center justify-center shadow-inner ring-1 ${isDark ? 'bg-gradient-to-b from-white/10 to-transparent ring-white/10' : 'bg-gradient-to-b from-white to-gray-50 ring-black/5 shadow-gray-200/50'}`}>
                    <Cpu size={32} className={isDark ? 'text-white/80' : 'text-gray-600'} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Neural Core Configuration</h3>
                  <motion.div 
                    animate={{ scale: [1, 1.02, 1], y: [0, -2, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.2)]'}`}
                  >
                    <motion.span
                      animate={{ rotate: [-5, 5, -5], y: [0, -1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-block origin-bottom-left"
                    >
                      🚀
                    </motion.span>
                    Coming Soon
                  </motion.div>
                  <p className={`max-w-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    We are currently fine-tuning neural core capabilities, reasoning depth, and adaptive response controls. This feature will be available soon.
                  </p>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center py-12 text-center">
                  <div className={`w-20 h-20 mb-6 rounded-[24px] flex items-center justify-center shadow-inner ring-1 ${isDark ? 'bg-gradient-to-b from-white/10 to-transparent ring-white/10' : 'bg-gradient-to-b from-white to-gray-50 ring-black/5 shadow-gray-200/50'}`}>
                    <User size={32} className={isDark ? 'text-white/80' : 'text-gray-600'} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Account Settings</h3>
                  <motion.div 
                    animate={{ scale: [1, 1.02, 1], y: [0, -2, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.2)]'}`}
                  >
                    <motion.span
                      animate={{ rotate: [-5, 5, -5], y: [0, -1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-block origin-bottom-left"
                    >
                      🚀
                    </motion.span>
                    Coming Soon
                  </motion.div>
                  <p className={`max-w-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    We are currently working on this feature. You will be able to manage your profile, subscription, and preferences here very soon.
                  </p>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={`mb-4 pb-3 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight">Data Controls</h3>
                    <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Manage local storage retention, privacy mode, and export options.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Temporary Chat Card */}
                    <div className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
                      temporaryChat 
                        ? (isDark ? 'border-amber-500/30 bg-amber-500/[0.04] shadow-[0_2px_12px_rgba(245,158,11,0.08)]' : 'border-amber-300/80 bg-amber-50/50 shadow-xs')
                        : (isDark ? 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]' : 'border-gray-200 bg-white hover:border-gray-300 shadow-xs')
                    }`}>
                      <div className="flex items-start gap-3.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          temporaryChat 
                            ? (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700')
                            : (isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700')
                        }`}>
                          <Clock size={17} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-semibold tracking-tight">Temporary Chat</h4>
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full border transition-colors ${
                                temporaryChat 
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                                  : isDark 
                                    ? 'bg-white/5 text-gray-400 border-white/10' 
                                    : 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${temporaryChat ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                                {temporaryChat ? 'Incognito' : 'Persistent'}
                              </span>
                            </div>

                            {/* Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleTemporaryChat(!temporaryChat)}
                              className={`relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                                temporaryChat 
                                  ? 'bg-amber-500 shadow-xs' 
                                  : isDark 
                                    ? 'bg-white/20 hover:bg-white/25' 
                                    : 'bg-gray-300 hover:bg-gray-400/80'
                              }`}
                              aria-label="Toggle Temporary Chat"
                            >
                              <span
                                className={`pointer-events-none inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow-xs ring-0 transition-transform duration-200 ease-out ${
                                  temporaryChat ? 'translate-x-[20px]' : 'translate-x-[3px]'
                                }`}
                              />
                            </button>
                          </div>

                          <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            When enabled, chats won't appear in your saved history and expire when the window closes.
                          </p>

                          <div className={`mt-2.5 px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                            temporaryChat 
                              ? (isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-300/90' : 'bg-amber-50 border-amber-200 text-amber-800')
                              : (isDark ? 'bg-white/[0.02] border-white/5 text-gray-400' : 'bg-gray-50 border-gray-200/80 text-gray-600')
                          }`}>
                            <Info size={13} className="shrink-0 opacity-80" />
                            <span>
                              {temporaryChat 
                                ? 'Temporary mode is active: No history or cookies are retained.' 
                                : 'Standard mode: Conversations and workspace states are saved securely.'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Export Data Card */}
                    <div className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
                      isDark 
                        ? 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]' 
                        : 'border-gray-200 bg-white hover:border-gray-300 shadow-xs'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'
                          }`}>
                            <Download size={17} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold tracking-tight">Export Conversations</h4>
                            <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Download a complete JSON archive of all your chat histories and preferences.
                            </p>
                          </div>
                        </div>

                        <button 
                          onClick={handleExportData}
                          className={`self-start sm:self-center shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                            isDark 
                              ? 'bg-white/10 hover:bg-white/15 text-white border-white/15 active:scale-[0.98]' 
                              : 'bg-gray-900 hover:bg-gray-800 text-white border-gray-900 active:scale-[0.98]'
                          }`}
                        >
                          <Download size={13} />
                          <span>Export JSON</span>
                        </button>
                      </div>
                    </div>

                    {/* Delete Data Card */}
                    <div className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
                      isDark 
                        ? 'border-red-500/20 bg-red-500/[0.03] hover:border-red-500/30' 
                        : 'border-red-200/80 bg-red-50/30 hover:border-red-300 shadow-xs'
                    }`}>
                      <div className="flex items-start gap-3.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                        }`}>
                          <AlertCircle size={17} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h4 className="text-sm font-semibold tracking-tight text-red-500">Delete All Stored Data</h4>
                              <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-red-400/80' : 'text-red-700/80'}`}>
                                Permanently wipe all chat transcripts and local workspace cache.
                              </p>
                            </div>

                            {!isConfirmingDelete && (
                              <button 
                                onClick={() => setIsConfirmingDelete(true)}
                                className={`self-start sm:self-center shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                                  isDark
                                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 active:scale-[0.98]'
                                    : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 active:scale-[0.98]'
                                }`}
                              >
                                <Trash2 size={13} />
                                <span>Delete All</span>
                              </button>
                            )}
                          </div>
                          
                          {isConfirmingDelete && (
                            <div className={`mt-3 p-3 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200 ${
                              isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-white border-red-200 shadow-xs'
                            }`}>
                              <div className="text-xs">
                                <span className="font-semibold text-red-500">Warning:</span>
                                <span className={`ml-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  This will permanently erase all local chat history.
                                </span>
                              </div>
                              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                <button 
                                  onClick={handleConfirmDeleteAllData}
                                  className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 active:scale-[0.98] shadow-xs"
                                >
                                  <Trash2 size={12} />
                                  <span>Yes, Delete Everything</span>
                                </button>
                                <button 
                                  onClick={() => setIsConfirmingDelete(false)}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                    isDark 
                                      ? 'bg-white/10 hover:bg-white/15 text-white border-white/10' 
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                                  }`}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
