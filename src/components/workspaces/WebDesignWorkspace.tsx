import React, { useState, useEffect, useRef } from 'react';
import { Layout } from 'lucide-react';
import { motion } from 'motion/react';
import { useWorkspaceChat } from '../../hooks/useWorkspaceChat';
import ChatHistory from '../ChatHistory';
import ChatInput from '../ChatInput';
import GitHubRepoManager from './GitHubRepoManager';
import GitHubRepoSidebarPanel from './GitHubRepoSidebarPanel';
import WebDesignSettingsModal from './WebDesignSettingsModal';
import { GitHubRepo } from '../../services/githubService';

interface WebDesignWorkspaceProps {
  isDark: boolean;
  isSettingsOpen?: boolean;
  onCloseSettings?: () => void;
  onOpenSettings?: () => void;
}

const MINIMAL_SUGGESTIONS = [
  'Modern landing page with dark mode',
  'Bento grid analytics dashboard',
  'Interactive component with Tailwind'
];

// 3D Undulating White Particle Dot-Wave Mesh Background (Matches Reference Image)
function WebDesignParticleWaveBackground({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const handleResize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const parent = canvas.parentElement;
      width = parent && parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
      height = parent && parent.clientHeight > 0 ? parent.clientHeight : window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let time = 0;

    const render = () => {
      time += 0.011;

      // Pure pitch-black backdrop in dark mode (or clean light backdrop in light mode)
      ctx.fillStyle = isDark ? '#000000' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // 3D Particle Grid dimensions matching the dense flowing dot-wave in the reference image
      const cols = width < 640 ? 68 : 98;
      const rows = 46;

      const fov = Math.max(width, height) * 0.72;
      const centerX = width * 0.5;
      // Position the wave ribbon in the upper-middle 65% of the screen, leaving deep black space at the bottom
      const horizonY = height * 0.34;

      for (let r = rows - 1; r >= 0; r--) {
        const v = r / (rows - 1); // 0 = front edge (lower), 1 = back edge (upper)
        // Smooth envelope fading out at front-bottom and far-top edges
        const rowEnvelope = Math.sin(v * Math.PI);
        const depthZ = 0.52 + v * 1.45;
        const invZ = 1 / depthZ;

        for (let c = 0; c < cols; c++) {
          const u = (c / (cols - 1)) * 2 - 1; // -1 (left) to +1 (right)

          // Organic 3D wave equations with ridge folding & lateral flow
          const phase1 = u * 3.8 + v * 4.2 - time * 0.85;
          const phase2 = u * 2.3 - v * 5.1 + time * 0.62;
          const phase3 = (u * 5.6 + v * 3.4) + Math.cos(u * 2.4 - v * 2.2 - time * 0.5) * 1.45 + time * 0.95;

          const waveY =
            Math.sin(phase1) * 0.48 +
            Math.cos(phase2) * 0.36 +
            Math.sin(phase3) * 0.24;

          // Subtle lateral X-Z fold displacement creates the dense bright ribbon caustics seen in the reference image
          const foldX =
            Math.cos(phase1) * 0.028 -
            Math.sin(phase2) * 0.022 +
            Math.cos(phase3) * 0.015;

          // Derivative / slope approximation to brighten compressed wave ridges & crests
          const ridgeSlope =
            Math.abs(Math.cos(phase1) * 0.55 - Math.sin(phase2) * 0.45 + Math.cos(phase3) * 0.35);
          const crestFactor = Math.max(0, Math.min(1, (waveY + 0.85) / 1.65));

          // 3D World Coordinates
          const worldX = (u * 1.22 + foldX) * (width * 0.88);
          const worldY = (v - 0.38) * (height * 0.36) + waveY * (height * 0.165);

          // Perspective Projection onto 2D Canvas
          const screenX = centerX + worldX * invZ * (fov / Math.max(width, 600));
          const screenY = horizonY - worldY * invZ;

          if (screenX < -10 || screenX > width + 10 || screenY < -10 || screenY > height + 10) {
            continue;
          }

          // Compute dot size and opacity: bright crisp white on ridges/crests, soft dim dots in troughs
          const highlight = Math.pow(crestFactor * 0.62 + (1 - ridgeSlope * 0.5) * 0.38, 1.45);
          const alpha = Math.max(
            0.03,
            Math.min(0.98, rowEnvelope * (0.1 + highlight * 0.92) * Math.min(1, invZ * 0.95))
          );

          const radius = Math.max(
            0.65,
            (0.95 + highlight * 1.55) * Math.pow(invZ, 0.75)
          );

          ctx.beginPath();
          ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? `rgba(255, 255, 255, ${alpha.toFixed(3)})`
            : `rgba(15, 23, 42, ${(alpha * 0.65).toFixed(3)})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDark]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

export default function WebDesignWorkspace({ 
  isDark,
  isSettingsOpen = false,
  onCloseSettings,
  onOpenSettings
}: WebDesignWorkspaceProps) {
  const { messages, isLoading, sendMessage, stopMessage } = useWorkspaceChat('web-design');
  const [mode, setMode] = useState<'ai-studio' | 'github-sync'>('ai-studio');
  const [isRepoSidebarOpen, setIsRepoSidebarOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false);

  const showSettings = isSettingsOpen || internalSettingsOpen;

  const handleCloseSettings = () => {
    setInternalSettingsOpen(false);
    onCloseSettings?.();
  };

  const handleOpenSettings = () => {
    setInternalSettingsOpen(true);
    onOpenSettings?.();
  };

  const handleRunPrompt = (promptText: string) => {
    window.dispatchEvent(
      new CustomEvent('populate-chat-input', {
        detail: { workspaceId: 'web-design', text: promptText }
      })
    );
  };

  const handleSendCodeToAI = (code: string, fileName: string) => {
    setMode('ai-studio');
    window.dispatchEvent(
      new CustomEvent('populate-chat-input', {
        detail: { 
          workspaceId: 'web-design', 
          text: `Here is my component from ${fileName}:\n\n\`\`\`tsx\n${code}\n\`\`\`\n\nPlease refactor this component to make it modern, responsive, and styled with Tailwind CSS.`
        }
      })
    );
  };

  const handleSelectRepoFromSidebar = (repo: GitHubRepo, branch?: string) => {
    setSelectedRepo(repo);
    if (branch) {
      setSelectedBranch(branch);
    } else if (repo.default_branch) {
      setSelectedBranch(repo.default_branch);
    }
    setMode('github-sync');
  };

  return (
    <div className="flex flex-col w-full h-full pt-14 sm:pt-16 relative z-10 overflow-hidden">
      {/* 3D Undulating White Particle Dot-Wave Background */}
      <WebDesignParticleWaveBackground isDark={isDark} />

      {/* WORKSPACE LAYOUT WITH GITHUB REPO SIDEBAR PANEL */}
      <div className="flex-1 w-full h-full flex flex-row overflow-hidden relative z-10">
        
        {/* Dedicated GitHub Repository Explorer Sidebar Panel */}
        <GitHubRepoSidebarPanel
          isDark={isDark}
          isOpen={isRepoSidebarOpen}
          onClose={() => setIsRepoSidebarOpen(false)}
          onSelectRepo={handleSelectRepoFromSidebar}
          selectedRepoId={selectedRepo?.id}
          selectedRepo={selectedRepo}
          selectedBranch={selectedBranch}
          onSelectBranch={(branch) => setSelectedBranch(branch)}
          onOpenConnectModal={() => setMode('github-sync')}
          onSendCodeToAI={handleSendCodeToAI}
        />

        {/* Main Workspace Area (Clean, Minimal & Distraction-free) */}
        <div className="flex-1 h-full flex flex-col overflow-hidden relative">
          {mode === 'github-sync' ? (
            <div className="flex-1 w-full h-full overflow-hidden">
              <GitHubRepoManager 
                isDark={isDark} 
                onSendCodeToAI={handleSendCodeToAI} 
                onClose={() => setMode('ai-studio')} 
                initialRepo={selectedRepo}
                initialBranch={selectedBranch}
              />
            </div>
          ) : (
            <>
              <div className={`flex-1 w-full flex flex-col ${messages.length === 0 ? 'items-center justify-center overflow-hidden' : 'justify-start items-center overflow-y-auto hide-scrollbar'} pb-28 md:pb-36 px-4 relative z-0`}>
                {messages.length === 0 ? (
                  /* ULTRA-CLEAN & PROFESSIONAL MINIMALIST HERO */
                  <div className="flex flex-col items-center justify-center text-center px-4 w-full max-w-lg mx-auto my-auto select-none relative z-10">
                    
                    {/* Subtle Soft Radial Backdrop Glow */}
                    <div 
                      className="absolute -top-12 w-64 sm:w-80 h-32 sm:h-40 rounded-full blur-3xl pointer-events-none opacity-20"
                      style={{
                        background: isDark 
                          ? 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)' 
                          : 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)'
                      }}
                    />

                    {/* Vibrant Web Design Circular Gradient Logo Orb */}
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.35 }}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mb-3.5 flex items-center justify-center text-white ring-1 ring-inset ring-white/40"
                      style={{
                        background: 'linear-gradient(145deg, #ea580c 0%, #ef4444 52%, #e11d48 100%)',
                        boxShadow: '0 0 0 4px rgba(244, 63, 94, 0.32), 0 12px 26px -4px rgba(239, 68, 68, 0.48)'
                      }}
                    >
                      <Layout size={26} strokeWidth={2.1} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.28)]" />
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.05 }}
                      className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                        isDark
                          ? 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]'
                          : 'text-[#0f172a] [text-shadow:0_1px_8px_rgba(255,255,255,0.95)]'
                      }`}
                    >
                      <span className={`text-transparent bg-clip-text ${isDark ? 'bg-gradient-to-r from-orange-300 via-rose-300 to-pink-300' : 'bg-gradient-to-r from-[#ea580c] via-[#ef4444] to-[#e11d48]'}`}>Jaalix</span>
                    </motion.h1>

                    {/* Simple Subtitle */}
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className={`mt-2 text-sm max-w-sm font-medium ${
                        isDark
                          ? 'text-zinc-300 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]'
                          : 'text-[#475569] [text-shadow:0_1px_6px_rgba(255,255,255,0.95)]'
                      }`}
                    >
                      What would you like to design today?
                    </motion.p>

                    {/* 3 Simple Subtle Suggestion Chips */}
                    <motion.div 
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.15 }}
                      className="flex flex-wrap items-center justify-center gap-2 mt-5 max-w-md"
                    >
                      {MINIMAL_SUGGESTIONS.map((text, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleRunPrompt(text)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer border backdrop-blur-md ${
                            isDark 
                              ? 'bg-black/65 hover:bg-zinc-900/90 text-zinc-200 hover:text-white border-white/15 hover:border-white/35' 
                              : 'bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 border-zinc-200 shadow-xs'
                          }`}
                        >
                          {text}
                        </button>
                      ))}
                    </motion.div>
                  </div>
                ) : (
                  <ChatHistory messages={messages} isLoading={isLoading} isDark={isDark} />
                )}
              </div>
              <ChatInput isDark={isDark} onSend={sendMessage} onStop={stopMessage} isLoading={isLoading} workspaceId="web-design" />
            </>
          )}
        </div>
      </div>

      {/* Web Design Studio Settings Modal: Controls All Functions (Accessible via Top Header Settings Button) */}
      <WebDesignSettingsModal
        isOpen={showSettings}
        onClose={handleCloseSettings}
        isDark={isDark}
        mode={mode}
        onModeChange={(newMode) => setMode(newMode)}
        isRepoExplorerOpen={isRepoSidebarOpen}
        onToggleRepoExplorer={() => setIsRepoSidebarOpen(prev => !prev)}
        onSelectPrompt={(prompt) => handleRunPrompt(prompt)}
        selectedRepo={selectedRepo}
        onSelectRepo={(repo) => {
          setSelectedRepo(repo);
          setMode('github-sync');
        }}
      />
    </div>
  );
}

