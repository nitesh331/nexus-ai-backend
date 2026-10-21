import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Image as ImageIcon, Layout, Globe, BookOpen, Settings, HelpCircle, Clock, Loader2, HeartHandshake } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  activeWorkspace: string;
  onSelectWorkspace: (id: string) => void;
  onOpenHistory: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  isDark, 
  activeWorkspace, 
  onSelectWorkspace, 
  onOpenHistory, 
  onOpenSettings, 
  onOpenHelp
}: SidebarProps) {
  const [activeTasks, setActiveTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleActivity = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.workspaceId) {
        setActiveTasks(prev => ({
          ...prev,
          [custom.detail.workspaceId]: Boolean(custom.detail.isLoading)
        }));
      }
    };

    window.addEventListener('workspace-activity-change', handleActivity);
    return () => window.removeEventListener('workspace-activity-change', handleActivity);
  }, []);

  const workspaces = [
    {
      id: 'chat',
      label: 'Chat Assistant',
      icon: <MessageSquare size={18} className="text-white" strokeWidth={2.1} />,
      tag: 'Core Intelligence',
      orbGradient: 'linear-gradient(145deg, #7c3aed 0%, #a855f7 52%, #ec4899 100%)',
      shadowColor: 'rgba(168, 85, 247, 0.4)',
    },
    {
      id: 'deep-search',
      label: 'Atal',
      icon: <Globe size={18} className="text-white" strokeWidth={2.1} />,
      tag: 'Deep search',
      orbGradient: 'linear-gradient(145deg, #6d28d9 0%, #4f46e5 52%, #2563eb 100%)',
      shadowColor: 'rgba(79, 70, 229, 0.4)',
    },
    {
      id: 'image-video',
      label: 'Zenra',
      icon: <ImageIcon size={18} className="text-white" strokeWidth={2.1} />,
      tag: 'Image and video',
      orbGradient: 'linear-gradient(145deg, #9333ea 0%, #c026d3 52%, #db2777 100%)',
      shadowColor: 'rgba(192, 38, 211, 0.4)',
    },
    {
      id: 'web-design',
      label: 'Jaalix',
      icon: <Layout size={18} className="text-white" strokeWidth={2.1} />,
      tag: 'Pages and layouts',
      orbGradient: 'linear-gradient(145deg, #ea580c 0%, #ef4444 52%, #e11d48 100%)',
      shadowColor: 'rgba(239, 68, 68, 0.4)',
    },
    {
      id: 'notes',
      label: 'Medhira',
      icon: <BookOpen size={18} className="text-white" strokeWidth={2.1} />,
      tag: 'Learn and study',
      orbGradient: 'linear-gradient(145deg, #4338ca 0%, #2563eb 54%, #0284c7 100%)',
      shadowColor: 'rgba(37, 99, 235, 0.4)',
    },
  ];

  const handleSelect = (id: string) => {
    onSelectWorkspace(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed left-0 top-0 z-50 h-full w-[85vw] max-w-[300px] sm:w-[280px] p-4 sm:p-6 shadow-2xl flex flex-col overflow-y-auto pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] ${
              isDark ? 'bg-[#121212] text-white border-r border-white/5' : 'bg-white text-gray-900 border-r border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-400">Workspaces</span>
                {Object.values(activeTasks).some(Boolean) && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-colors touch-manipulation"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex flex-col gap-2.5 text-sm font-medium flex-1">
              {workspaces.map((ws) => {
                const isActive = activeWorkspace === ws.id || (ws.id === 'deep-search' && activeWorkspace === 'web-research');
                const isGenerating = activeTasks[ws.id] || (ws.id === 'deep-search' && activeTasks['web-research']);

                return (
                  <motion.button
                    key={ws.id}
                    onClick={() => handleSelect(ws.id)}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.96, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`p-3 rounded-2xl flex items-center justify-between text-left relative overflow-hidden ${
                      isActive 
                        ? (isDark 
                            ? 'text-white border border-white/15 shadow-[0_8px_16px_rgba(0,0,0,0.4)] bg-gradient-to-b from-white/12 to-white/5' 
                            : 'text-slate-900 border border-purple-200/90 shadow-[0_8px_18px_rgba(124,58,237,0.1)] bg-gradient-to-b from-purple-50/80 to-white') 
                        : (isDark 
                            ? 'text-gray-300 hover:text-white border border-transparent hover:bg-white/5' 
                            : 'text-slate-700 hover:text-slate-950 border border-transparent hover:bg-purple-50/50')
                    }`}
                  >
                    {/* Inner highlight for 3D effect */}
                    {isActive && (
                      <div className={`absolute inset-0 rounded-2xl border ${isDark ? 'border-t-white/20 border-white/0' : 'border-t-white border-white/0'} pointer-events-none`} />
                    )}
                    
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/35"
                        style={{
                          background: ws.orbGradient,
                          boxShadow: `0 4px 12px -2px ${ws.shadowColor}`,
                        }}
                      >
                        {ws.icon}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-[14.5px] font-bold truncate ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>{ws.label}</span>
                        <span className={`text-[11.5px] font-medium truncate ${isDark ? 'text-zinc-400' : 'text-[#475569]'}`}>{ws.tag}</span>
                      </div>
                    </div>

                    {isGenerating && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 animate-pulse shrink-0">
                        <Loader2 size={11} className="animate-spin" />
                        <span>Live</span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </nav>

            <div className={`mt-auto pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <nav className="flex flex-col gap-1.5 text-sm font-medium">
                {[
                  { icon: <Clock size={18} />, label: 'Recent Chats', onClick: () => { onClose(); onOpenHistory(); } },
                  { icon: <Settings size={18} />, label: 'Settings', onClick: () => { onClose(); onOpenSettings?.(); } },
                  { icon: <HelpCircle size={18} />, label: 'Help & FAQ', onClick: () => { onClose(); onOpenHelp?.(); } }
                ].map((item, idx) => (
                  <motion.button 
                    key={idx}
                    onClick={item.onClick}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-2.5 rounded-xl flex items-center gap-3 transition-colors text-left ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    {item.icon}
                    {item.label}
                  </motion.button>
                ))}
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
