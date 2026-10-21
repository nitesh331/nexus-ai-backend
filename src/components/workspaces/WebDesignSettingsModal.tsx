import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  SlidersHorizontal,
  GitBranch,
  FolderGit2,
  Code2,
  Check,
  ExternalLink,
  LogOut,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Cpu,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GitHubUser, verifyGitHubToken, GitHubRepo } from '../../services/githubService';

interface WebDesignSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  mode: 'ai-studio' | 'github-sync';
  onModeChange: (mode: 'ai-studio' | 'github-sync') => void;
  isRepoExplorerOpen: boolean;
  onToggleRepoExplorer: () => void;
  onSelectPrompt?: (prompt: string) => void;
  selectedRepo?: GitHubRepo | null;
  onSelectRepo?: (repo: GitHubRepo) => void;
}

export default function WebDesignSettingsModal({
  isOpen,
  onClose,
  isDark,
  mode,
  onModeChange,
  isRepoExplorerOpen,
  onToggleRepoExplorer
}: WebDesignSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'workspace' | 'assistant' | 'github'>('workspace');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [inputToken, setInputToken] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Assistant Code & Design Preferences (persisted in localStorage & used by AI generation)
  const [targetFramework, setTargetFramework] = useState(
    () => localStorage.getItem('webdesign-framework') || 'react-tailwind'
  );
  const [designStyle, setDesignStyle] = useState(
    () => localStorage.getItem('webdesign-style') || 'modern-saas'
  );
  const [useTypeScript, setUseTypeScript] = useState(
    () => (localStorage.getItem('webdesign-typescript') ?? 'true') === 'true'
  );
  const [mobileFirst, setMobileFirst] = useState(
    () => (localStorage.getItem('webdesign-responsive') ?? 'true') === 'true'
  );
  const [singleFileOutput, setSingleFileOutput] = useState(
    () => (localStorage.getItem('webdesign-singlefile') ?? 'true') === 'true'
  );
  const [assistantInstructions, setAssistantInstructions] = useState(
    () => localStorage.getItem('webdesign-instructions') || ''
  );

  // OAuth states
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Listen for OAuth popup callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }

      if (event.data?.type === 'GITHUB_OAUTH_SUCCESS' && event.data?.token) {
        setOauthLoading(false);
        setOauthError(null);
        handleDirectVerify(event.data.token);
      } else if (event.data?.type === 'GITHUB_OAUTH_ERROR') {
        setOauthLoading(false);
        setOauthError(event.data?.error || 'GitHub authorization failed');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Verify token on modal open
  useEffect(() => {
    if (!isOpen) return;
    const currentToken = localStorage.getItem('github-pat-token') || '';
    if (currentToken) {
      handleDirectVerify(currentToken);
    }
  }, [isOpen]);

  // Close on Escape key press and lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  const handleDirectVerify = async (pat: string) => {
    setIsVerifying(true);
    setAuthError(null);
    try {
      const verified = await verifyGitHubToken(pat);
      setUser(verified);
      localStorage.setItem('github-pat-token', pat);
    } catch {
      setUser(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;

    setIsVerifying(true);
    setAuthError(null);
    try {
      const verifiedUser = await verifyGitHubToken(inputToken.trim());
      localStorage.setItem('github-pat-token', inputToken.trim());
      setUser(verifiedUser);
      setInputToken('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Invalid GitHub token. Please check permissions.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOAuthConnect = async () => {
    setOauthLoading(true);
    setOauthError(null);
    try {
      const res = await fetch('/api/auth/github/url');
      const data = await res.json();
      if (!res.ok || !data.configured || !data.url) {
        setOauthLoading(false);
        setOauthError(data.error || 'GitHub OAuth is not configured on the server. Connect using a Personal Access Token below.');
        return;
      }

      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      window.open(
        data.url,
        'GitHub Authorization',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=1`
      );
    } catch (err: unknown) {
      setOauthLoading(false);
      setOauthError(err instanceof Error ? err.message : 'OAuth request failed. Use token authentication below.');
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('github-pat-token');
    setUser(null);
    setAuthError(null);
  };

  const handleSaveFramework = (fw: string) => {
    setTargetFramework(fw);
    localStorage.setItem('webdesign-framework', fw);
  };

  const handleSaveStyle = (st: string) => {
    setDesignStyle(st);
    localStorage.setItem('webdesign-style', st);
  };

  const handleToggleTypeScript = () => {
    const next = !useTypeScript;
    setUseTypeScript(next);
    localStorage.setItem('webdesign-typescript', String(next));
  };

  const handleToggleMobileFirst = () => {
    const next = !mobileFirst;
    setMobileFirst(next);
    localStorage.setItem('webdesign-responsive', String(next));
  };

  const handleToggleSingleFile = () => {
    const next = !singleFileOutput;
    setSingleFileOutput(next);
    localStorage.setItem('webdesign-singlefile', String(next));
  };

  const handleSaveInstructions = (val: string) => {
    setAssistantInstructions(val);
    localStorage.setItem('webdesign-instructions', val);
  };

  const handleResetAssistantDefaults = () => {
    handleSaveFramework('react-tailwind');
    handleSaveStyle('modern-saas');
    setUseTypeScript(true);
    localStorage.setItem('webdesign-typescript', 'true');
    setMobileFirst(true);
    localStorage.setItem('webdesign-responsive', 'true');
    setSingleFileOutput(true);
    localStorage.setItem('webdesign-singlefile', 'true');
    handleSaveInstructions('');
  };

  if (!isOpen) return null;

  const modalNode = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, y: 12, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.96, y: 12, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 360 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col my-auto ${
            isDark
              ? 'bg-[#0b0d14] border-white/[0.1] text-zinc-100 shadow-[0_24px_64px_rgba(0,0,0,0.9)]'
              : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
          }`}
          style={{ maxHeight: '88vh' }}
        >
          {/* 1. CLEAN PROFESSIONAL HEADER */}
          <div
            className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between gap-3 shrink-0 ${
              isDark ? 'border-white/[0.08] bg-[#0b0d14]' : 'border-zinc-200 bg-zinc-50/70'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  isDark
                    ? 'bg-white/[0.05] border-white/[0.1] text-zinc-100'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                }`}
              >
                <SlidersHorizontal size={17} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-semibold tracking-tight truncate">
                  Jaalix Assistant Settings
                </h2>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  Workspace mode, code generation rules, and GitHub repository sync
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title="Close settings (Esc)"
              aria-label="Close settings"
            >
              <X size={18} />
            </button>
          </div>

          {/* 2. SEGMENTED NAVIGATION TABS (3 Focused Tabs) */}
          <div
            className={`px-5 sm:px-6 py-2.5 border-b flex items-center gap-1.5 overflow-x-auto text-xs font-medium shrink-0 hide-scrollbar ${
              isDark ? 'border-white/[0.06] bg-black/30' : 'border-zinc-200 bg-zinc-100/60'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab('workspace')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'workspace'
                  ? isDark
                    ? 'bg-white/12 text-white font-semibold'
                    : 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Sliders size={14} />
              <span>Workspace</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('assistant')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'assistant'
                  ? isDark
                    ? 'bg-white/12 text-white font-semibold'
                    : 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Cpu size={14} />
              <span>Assistant Rules</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('github')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'github'
                  ? isDark
                    ? 'bg-white/12 text-white font-semibold'
                    : 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <GitBranch size={14} />
              <span>GitHub Sync</span>
              {user && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>
          </div>

          {/* 3. MODAL BODY */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 hide-scrollbar">
            {/* TAB 1: WORKSPACE & MODE */}
            {activeTab === 'workspace' && (
              <div className="space-y-5">
                {/* Active Mode Selector */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2.5">
                    Workspace Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => onModeChange('ai-studio')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        mode === 'ai-studio'
                          ? isDark
                            ? 'bg-white/[0.07] border-white/30 text-white'
                            : 'bg-zinc-900/5 border-zinc-900 text-zinc-900'
                          : isDark
                          ? 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.08] text-zinc-300'
                          : 'bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200 text-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
                          <Code2 size={15} className="text-sky-400" />
                          <span>AI Design Assistant</span>
                        </div>
                        {mode === 'ai-studio' && (
                          <Check size={14} className={isDark ? 'text-white' : 'text-zinc-900'} />
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Generate responsive websites, UI sections, and production components via natural language prompts.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => onModeChange('github-sync')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        mode === 'github-sync'
                          ? isDark
                            ? 'bg-white/[0.07] border-white/30 text-white'
                            : 'bg-zinc-900/5 border-zinc-900 text-zinc-900'
                          : isDark
                          ? 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.08] text-zinc-300'
                          : 'bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200 text-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
                          <GitBranch size={15} className="text-emerald-400" />
                          <span>GitHub Repository Sync</span>
                        </div>
                        {mode === 'github-sync' && (
                          <Check size={14} className={isDark ? 'text-white' : 'text-zinc-900'} />
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Browse repository branches, edit code files, send files to the assistant, and commit changes directly.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Left Repository Explorer Sidebar Toggle */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                        isDark ? 'bg-white/[0.04] border-white/[0.08] text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
                      }`}
                    >
                      <FolderGit2 size={17} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                        <span>Repository Explorer Sidebar</span>
                        <span className="text-zinc-500">·</span>
                        <span className="text-xs font-normal text-zinc-400">
                          {isRepoExplorerOpen ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                        Show or hide the left file explorer panel inside the workspace for quick repository switching.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onToggleRepoExplorer}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      isRepoExplorerOpen ? 'bg-sky-500' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                    }`}
                    role="switch"
                    aria-checked={isRepoExplorerOpen}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                        isRepoExplorerOpen ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: ASSISTANT RULES & CODE PREFERENCES */}
            {activeTab === 'assistant' && (
              <div className="space-y-5">
                {/* Stack & Visual Style Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div
                    className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      Default Tech Stack
                    </label>
                    <select
                      value={targetFramework}
                      onChange={(e) => handleSaveFramework(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-medium border outline-none cursor-pointer ${
                        isDark
                          ? 'bg-[#121520] border-white/10 text-zinc-100'
                          : 'bg-white border-zinc-200 text-zinc-900'
                      }`}
                    >
                      <option value="react-tailwind">React + Tailwind CSS</option>
                      <option value="nextjs-app">Next.js App Router + Tailwind</option>
                      <option value="html-tailwind">Vanilla HTML5 + CSS / Tailwind</option>
                      <option value="vite-vue">Vue 3 + Tailwind CSS</option>
                    </select>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      Visual Direction
                    </label>
                    <select
                      value={designStyle}
                      onChange={(e) => handleSaveStyle(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-medium border outline-none cursor-pointer ${
                        isDark
                          ? 'bg-[#121520] border-white/10 text-zinc-100'
                          : 'bg-white border-zinc-200 text-zinc-900'
                      }`}
                    >
                      <option value="modern-saas">Modern Clean SaaS</option>
                      <option value="minimalist">Minimalist Editorial</option>
                      <option value="glassmorphic">Frosted Glassmorphism</option>
                      <option value="dashboard">High-Density Analytics UI</option>
                    </select>
                  </div>
                </div>

                {/* Code Generation Toggles */}
                <div
                  className={`rounded-xl border divide-y ${
                    isDark
                      ? 'bg-white/[0.02] border-white/[0.08] divide-white/[0.06]'
                      : 'bg-zinc-50 border-zinc-200 divide-zinc-200'
                  }`}
                >
                  <div className="p-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold">TypeScript Strict Typing</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Include clean prop interfaces and type-safe event handlers in generated components.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleTypeScript}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        useTypeScript ? 'bg-sky-500' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                      }`}
                      role="switch"
                      aria-checked={useTypeScript}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          useTypeScript ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold">Mobile-First Responsive Breakpoints</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Ensure every generated layout adapts cleanly across mobile, tablet, and desktop viewports.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleMobileFirst}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        mobileFirst ? 'bg-sky-500' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                      }`}
                      role="switch"
                      aria-checked={mobileFirst}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          mobileFirst ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold">Self-Contained Previewable Code</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Output complete, runnable code blocks with no missing placeholders or external stubs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleSingleFile}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        singleFileOutput ? 'bg-sky-500' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                      }`}
                      role="switch"
                      aria-checked={singleFileOutput}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          singleFileOutput ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Custom Assistant Instructions */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-400">
                      Custom Jaalix Instructions
                    </label>
                    <button
                      type="button"
                      onClick={handleResetAssistantDefaults}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw size={11} />
                      <span>Reset defaults</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={assistantInstructions}
                    onChange={(e) => handleSaveInstructions(e.target.value)}
                    placeholder="Optional: Add specific brand colors, font preferences, or layout guidelines for Jaalix..."
                    className={`w-full p-3 rounded-xl text-xs border outline-none resize-none leading-relaxed ${
                      isDark
                        ? 'bg-white/[0.02] border-white/[0.08] text-zinc-100 placeholder:text-zinc-500 focus:border-sky-500/60'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: GITHUB SYNC & AUTHENTICATION */}
            {activeTab === 'github' && (
              <div className="space-y-4 text-xs">
                <div
                  className={`p-4 sm:p-5 rounded-xl border ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-sm">GitHub Account Connection</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Link your account to browse repositories, edit files, and push commits.
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium flex items-center gap-1.5 ${
                        user ? 'text-emerald-400' : 'text-zinc-400'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-400' : 'bg-zinc-500'}`}
                      />
                      {user ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>

                  {user ? (
                    <div className="space-y-3.5">
                      <div
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border ${
                          isDark ? 'bg-black/30 border-white/[0.06]' : 'bg-white border-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar_url}
                            alt={user.login}
                            className="w-10 h-10 rounded-full border border-white/15"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-sm">{user.name || user.login}</p>
                              <a
                                href={user.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-400 hover:text-white"
                                title="Open GitHub Profile"
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                            <p className="text-xs text-zinc-400">
                              @{user.login} · {user.public_repos} public repos
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onModeChange('github-sync');
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors cursor-pointer"
                          >
                            Open Repo Manager
                          </button>
                          <button
                            type="button"
                            onClick={handleDisconnect}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <LogOut size={12} />
                            <span>Disconnect</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 1-Click OAuth */}
                      <div
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isDark ? 'bg-black/25 border-white/[0.08]' : 'bg-white border-zinc-200'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-xs">GitHub OAuth Sign-In</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Authorize repository access via GitHub popup window.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleOAuthConnect}
                          disabled={oauthLoading}
                          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shrink-0 disabled:opacity-50 ${
                            isDark
                              ? 'bg-white text-zinc-900 hover:bg-zinc-200'
                              : 'bg-zinc-900 text-white hover:bg-zinc-800'
                          }`}
                        >
                          {oauthLoading ? <RefreshCw size={13} className="animate-spin" /> : <GitBranch size={13} />}
                          <span>Sign in with GitHub</span>
                        </button>
                      </div>

                      {oauthError && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                          <AlertCircle size={14} className="shrink-0" />
                          <span>{oauthError}</span>
                        </div>
                      )}

                      {/* Personal Access Token */}
                      <form onSubmit={handleConnectToken} className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-zinc-300">
                            Personal Access Token (PAT)
                          </label>
                          <a
                            href="https://github.com/settings/tokens/new?scopes=repo,read:user,user:email&description=WebDesignAssistant"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                          >
                            <span>Create token on GitHub</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={inputToken}
                            onChange={(e) => setInputToken(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            className={`flex-1 px-3 py-2 rounded-lg text-xs border outline-none font-mono ${
                              isDark
                                ? 'bg-black/40 border-white/10 text-white focus:border-sky-500'
                                : 'bg-white border-zinc-300 text-zinc-900 focus:border-sky-500'
                            }`}
                          />
                          <button
                            type="submit"
                            disabled={isVerifying || !inputToken.trim()}
                            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                          >
                            {isVerifying ? <RefreshCw size={13} className="animate-spin" /> : <Key size={13} />}
                            <span>Connect</span>
                          </button>
                        </div>

                        {authError && (
                          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{authError}</span>
                          </div>
                        )}

                        {saveSuccess && (
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                            <CheckCircle2 size={14} className="shrink-0" />
                            <span>GitHub account connected.</span>
                          </div>
                        )}
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. CLEAN FOOTER */}
          <div
            className={`px-5 sm:px-6 py-3 border-t flex items-center justify-between shrink-0 ${
              isDark ? 'border-white/[0.08] bg-black/30' : 'border-zinc-200 bg-zinc-50'
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Mode:</span>
              <strong className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>
                {mode === 'ai-studio' ? 'AI Design Assistant' : 'GitHub Sync'}
              </strong>
              {user && (
                <>
                  <span>·</span>
                  <span className="text-emerald-400">@{user.login}</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'bg-white text-zinc-900 hover:bg-zinc-200'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalNode, document.body);
  }
  return modalNode;
}

