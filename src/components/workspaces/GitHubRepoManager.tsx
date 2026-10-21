import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Folder, 
  FileCode, 
  FileText, 
  ArrowLeft, 
  RefreshCw, 
  Save, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  Plus, 
  Lock, 
  Globe, 
  Code2, 
  Eye, 
  LogOut, 
  Key,
  FolderOpen,
  Info,
  Copy,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  verifyGitHubToken, 
  getUserRepos, 
  getRepoBranches, 
  getRepoContents, 
  saveFileContent, 
  decodeBase64Utf8,
  GitHubUser, 
  GitHubRepo, 
  GitHubContentItem, 
  GitHubFileContent 
} from '../../services/githubService';

interface GitHubRepoManagerProps {
  isDark: boolean;
  onSendCodeToAI?: (code: string, fileName: string) => void;
  onClose?: () => void;
  initialRepo?: GitHubRepo | null;
  initialBranch?: string;
}

export default function GitHubRepoManager({ isDark, onSendCodeToAI, onClose, initialRepo, initialBranch }: GitHubRepoManagerProps) {
  // Token & Auth State
  const [token, setToken] = useState(() => localStorage.getItem('github-pat-token') || '');
  const [tokenInput, setTokenInput] = useState('');
  const [currentUser, setCurrentUser] = useState<GitHubUser | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // OAuth State
  const [authMethod, setAuthMethod] = useState<'oauth' | 'pat'>('oauth');
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [showOAuthSetupModal, setShowOAuthSetupModal] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Repositories & Active Repo
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('main');

  // File Tree & Navigation
  const [currentPath, setCurrentPath] = useState<string>('');
  const [treeItems, setTreeItems] = useState<GitHubContentItem[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  // File Viewer & Editor
  const [activeFile, setActiveFile] = useState<GitHubFileContent | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

  // Commit & Save
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState<{ sha: string; url: string } | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);

  // New File Modal
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // 1. Check OAuth configuration status on mount
  useEffect(() => {
    fetch('/api/auth/github/status')
      .then(res => res.json())
      .then(data => {
        setOauthConfigured(Boolean(data.configured));
        if (data.redirectUri) {
          setCallbackUrl(data.redirectUri);
        }
      })
      .catch(() => setOauthConfigured(false));
  }, []);

  // 2. Listen for OAuth popup postMessage callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Allow AI Studio preview domains and localhost
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }

      if (event.data?.type === 'GITHUB_OAUTH_SUCCESS' && event.data?.token) {
        setOauthLoading(false);
        setOauthError(null);
        handleVerifyToken(event.data.token);
      } else if (event.data?.type === 'GITHUB_OAUTH_ERROR') {
        setOauthLoading(false);
        setOauthError(event.data?.error || 'GitHub authorization failed');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 3. Auto-verify if token already exists in localStorage
  useEffect(() => {
    if (token) {
      handleVerifyToken(token);
    }
  }, []);

  // 4. Auto-select initialRepo if provided from the repository explorer
  useEffect(() => {
    if (initialRepo && token) {
      handleSelectRepo(initialRepo, initialBranch);
    }
  }, [initialRepo, initialBranch, token]);

  const handleVerifyToken = async (pat: string) => {
    if (!pat.trim()) return;
    setIsVerifying(true);
    setAuthError(null);
    try {
      const user = await verifyGitHubToken(pat);
      setCurrentUser(user);
      localStorage.setItem('github-pat-token', pat.trim());
      setToken(pat.trim());
      // Load user repos
      const userRepos = await getUserRepos(pat);
      setRepos(userRepos);
    } catch (err: any) {
      setAuthError(err.message || 'Verification failed. Please ensure token is valid and has repo access.');
      setCurrentUser(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('github-pat-token');
    setToken('');
    setCurrentUser(null);
    setSelectedRepo(null);
    setTreeItems([]);
    setActiveFile(null);
    setFileContent('');
  };

  // 4. Initiate GitHub OAuth Popup
  const handleConnectOAuth = async () => {
    setOauthLoading(true);
    setOauthError(null);
    try {
      const res = await fetch('/api/auth/github/url');
      const data = await res.json();

      if (!res.ok || !data.configured || !data.url) {
        setOauthLoading(false);
        setShowOAuthSetupModal(true);
        if (data.redirectUri) setCallbackUrl(data.redirectUri);
        return;
      }

      // Open OAuth provider URL directly in popup as per AI Studio constraints
      const authWindow = window.open(
        data.url,
        'github_oauth_popup',
        'width=600,height=720,menubar=no,toolbar=no,status=no'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to connect your GitHub account.');
        setOauthLoading(false);
      }
    } catch (err: any) {
      setOauthError(err.message || 'Failed to start GitHub OAuth flow');
      setOauthLoading(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1800);
  };

  // Load Repo Contents
  const handleSelectRepo = async (repo: GitHubRepo, targetBranch?: string) => {
    setSelectedRepo(repo);
    setCurrentPath('');
    setActiveFile(null);
    setFileContent('');
    setCommitSuccess(null);
    setCommitError(null);

    try {
      const bList = await getRepoBranches(token, repo.owner.login, repo.name);
      setBranches(bList);
      const chosenBranch = targetBranch && bList.includes(targetBranch)
        ? targetBranch
        : (bList.includes(repo.default_branch) ? repo.default_branch : (bList[0] || 'main'));
      setCurrentBranch(chosenBranch);
      loadFolder(repo.owner.login, repo.name, '', chosenBranch);
    } catch (err: any) {
      setTreeError(err.message || 'Failed to load branches');
    }
  };

  const loadFolder = async (owner: string, repo: string, path: string, branch: string) => {
    setIsLoadingTree(true);
    setTreeError(null);
    try {
      const items = await getRepoContents(token, owner, repo, path, branch);
      if (Array.isArray(items)) {
        const sorted = items.sort((a, b) => {
          if (a.type === 'dir' && b.type !== 'dir') return -1;
          if (a.type !== 'dir' && b.type === 'dir') return 1;
          return a.name.localeCompare(b.name);
        });
        setTreeItems(sorted);
        setCurrentPath(path);
      }
    } catch (err: any) {
      setTreeError(err.message || 'Failed to load directory items');
    } finally {
      setIsLoadingTree(false);
    }
  };

  // Open File
  const handleOpenFile = async (item: GitHubContentItem) => {
    if (!selectedRepo) return;
    setIsLoadingFile(true);
    setCommitSuccess(null);
    setCommitError(null);
    try {
      const data = await getRepoContents(token, selectedRepo.owner.login, selectedRepo.name, item.path, currentBranch);
      if (!Array.isArray(data) && data.content) {
        const decoded = decodeBase64Utf8(data.content);
        setActiveFile(data);
        setFileContent(decoded);
        setOriginalContent(decoded);
        setCommitMessage(`Update ${item.name} via Jaalix`);
      }
    } catch (err: any) {
      setCommitError(err.message || 'Failed to load file');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleNavigateUp = () => {
    if (!selectedRepo || !currentPath) return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parentPath = parts.join('/');
    loadFolder(selectedRepo.owner.login, selectedRepo.name, parentPath, currentBranch);
  };

  // Commit & Save File
  const handleCommitFile = async () => {
    if (!selectedRepo || !activeFile) return;
    setIsCommitting(true);
    setCommitSuccess(null);
    setCommitError(null);

    try {
      const result = await saveFileContent(
        token,
        selectedRepo.owner.login,
        selectedRepo.name,
        activeFile.path,
        fileContent,
        commitMessage,
        currentBranch,
        activeFile.sha
      );

      setCommitSuccess({
        sha: result.commit.sha.slice(0, 7),
        url: result.commit.html_url
      });
      setOriginalContent(fileContent);
      setActiveFile(prev => prev ? { ...prev, sha: result.content.sha } : null);
    } catch (err: any) {
      setCommitError(err.message || 'Failed to commit file');
    } finally {
      setIsCommitting(false);
    }
  };

  // Create New File
  const handleCreateNewFile = async () => {
    if (!selectedRepo || !newFileName.trim()) return;
    setIsCommitting(true);
    setCommitError(null);
    try {
      const fullPath = currentPath ? `${currentPath}/${newFileName.trim()}` : newFileName.trim();
      const initialTemplate = newFileName.endsWith('.tsx') || newFileName.endsWith('.jsx')
        ? `import React from 'react';\n\nexport default function ${newFileName.split('.')[0]}() {\n  return (\n    <div className="p-6 rounded-2xl bg-zinc-900 text-white">\n      <h1 className="text-xl font-bold">New Component</h1>\n    </div>\n  );\n}\n`
        : `/* Created via Jaalix */\n`;

      const result = await saveFileContent(
        token,
        selectedRepo.owner.login,
        selectedRepo.name,
        fullPath,
        initialTemplate,
        `Create ${newFileName.trim()} via Jaalix`,
        currentBranch
      );

      setShowNewFileModal(false);
      setNewFileName('');
      await loadFolder(selectedRepo.owner.login, selectedRepo.name, currentPath, currentBranch);
      handleOpenFile({
        name: newFileName.trim(),
        path: fullPath,
        sha: result.content.sha,
        size: initialTemplate.length,
        type: 'file',
        html_url: '',
        download_url: null
      });
    } catch (err: any) {
      setCommitError(err.message || 'Failed to create file');
    } finally {
      setIsCommitting(false);
    }
  };

  const isModified = fileContent !== originalContent;

  const filteredRepos = repos.filter(r => 
    r.name.toLowerCase().includes(repoSearch.toLowerCase()) || 
    r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  return (
    <div className={`w-full h-full flex flex-col ${isDark ? 'bg-[#090911] text-zinc-100' : 'bg-zinc-50 text-zinc-900'} overflow-hidden`}>
      
      {/* TOP HEADER: GITHUB REPO STATUS BAR */}
      <div className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
        isDark ? 'border-white/10 bg-zinc-950/80 backdrop-blur-md' : 'border-zinc-200 bg-white/90 backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-white shadow-sm">
            <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight">GitHub Direct Integration</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                OAuth 2.0 & Direct API
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {currentUser ? `Connected as @${currentUser.login} (${currentUser.public_repos} repos)` : 'Authenticate to link repositories and commit code directly'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser && (
            <div className="flex items-center gap-2">
              <img 
                src={currentUser.avatar_url} 
                alt={currentUser.login} 
                className="w-6 h-6 rounded-full border border-white/20"
              />
              <span className="text-xs font-medium text-zinc-300 hidden sm:inline">@{currentUser.login}</span>
              <button
                type="button"
                onClick={handleDisconnect}
                title="Disconnect GitHub"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-colors text-xs flex items-center gap-1"
              >
                <LogOut size={13} />
                <span className="hidden md:inline">Disconnect</span>
              </button>
            </div>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Back to Studio
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: AUTHENTICATION (OAuth & PAT) */}
      {!currentUser && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full max-w-lg p-6 sm:p-8 rounded-3xl border shadow-2xl ${
              isDark ? 'bg-zinc-900/90 border-white/10' : 'bg-white border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-white shadow-lg shadow-black/50">
                <svg height="26" width="26" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold">Link GitHub Account</h2>
                <p className="text-xs text-zinc-400">Authenticate to view, edit & commit code directly to repositories</p>
              </div>
            </div>

            {/* Zero Database Info Callout */}
            <div className={`p-4 rounded-2xl mb-6 text-xs leading-relaxed border ${
              isDark ? 'bg-white/[0.03] border-white/5 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
            }`}>
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
                <Check size={14} /> Direct GitHub REST API — No Database Needed
              </div>
              Your account links directly to GitHub. Commits and files are pushed straight to your repository without touching any external database.
            </div>

            {/* Auth Method Selector Tabs */}
            <div className="flex rounded-xl p-1 bg-black/30 border border-white/10 mb-5">
              <button
                type="button"
                onClick={() => setAuthMethod('oauth')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMethod === 'oauth' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <GitBranch size={13} />
                <span>GitHub OAuth (1-Click)</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('pat')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMethod === 'pat' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Key size={13} />
                <span>Personal Token (PAT)</span>
              </button>
            </div>

            {/* METHOD 1: 1-CLICK GITHUB OAUTH */}
            {authMethod === 'oauth' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleConnectOAuth}
                  disabled={oauthLoading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-zinc-800 via-zinc-900 to-black hover:from-zinc-700 hover:to-zinc-900 text-white border border-white/20 shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
                >
                  {oauthLoading ? (
                    <>
                      <RefreshCw size={17} className="animate-spin text-purple-400" />
                      <span>Waiting for GitHub Authorization...</span>
                    </>
                  ) : (
                    <>
                      <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
                      </svg>
                      <span>Sign in with GitHub (OAuth)</span>
                      <ExternalLink size={15} className="text-zinc-400" />
                    </>
                  )}
                </button>

                {oauthError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{oauthError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-zinc-400">Want to use your own GitHub OAuth App?</span>
                  <button
                    type="button"
                    onClick={() => setShowOAuthSetupModal(true)}
                    className="text-purple-400 hover:text-purple-300 hover:underline font-medium flex items-center gap-1"
                  >
                    OAuth App Setup Guide <Info size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* METHOD 2: PERSONAL ACCESS TOKEN (PAT) */}
            {authMethod === 'pat' && (
              <form onSubmit={(e) => { e.preventDefault(); handleVerifyToken(tokenInput); }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    GitHub Personal Access Token (PAT)
                  </label>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDark ? 'bg-black/50 border-white/10 text-white placeholder-zinc-500' : 'bg-white border-zinc-300 text-black'
                    }`}
                  />
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying || !tokenInput.trim()}
                  className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Verifying Token & Fetching Repos...</span>
                    </>
                  ) : (
                    <>
                      <span>Connect with Personal Access Token</span>
                      <ChevronRight size={15} />
                    </>
                  )}
                </button>

                <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
                  <span>Need a token?</span>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Nexus+Web+Design+Studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 font-medium"
                  >
                    Generate Token on GitHub <ExternalLink size={12} />
                  </a>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* VIEW 2: REPOSITORY SELECTION (If connected, but no repo active yet) */}
      {currentUser && !selectedRepo && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Select a Repository</h2>
              <p className="text-xs text-zinc-400">Choose a repository to start browsing, editing, and committing code</p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={repoSearch}
                onChange={(e) => setRepoSearch(e.target.value)}
                placeholder="Search your repositories..."
                className={`w-full px-4 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-zinc-300 text-black'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRepos.map((repo) => (
              <motion.div
                key={repo.id}
                whileHover={{ y: -2 }}
                onClick={() => handleSelectRepo(repo)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-zinc-900/70 hover:bg-zinc-800/80 border-white/10 hover:border-purple-500/50' 
                    : 'bg-white hover:bg-zinc-50 border-zinc-200 hover:border-purple-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-semibold text-sm truncate">
                    <FolderOpen size={16} className="text-purple-400 shrink-0" />
                    <span className="truncate">{repo.name}</span>
                  </div>
                  {repo.private ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Lock size={10} /> Private
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                      <Globe size={10} /> Public
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 h-8 mb-3">
                  {repo.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <GitBranch size={11} /> {repo.default_branch}
                  </span>
                  <span>{new Date(repo.updated_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}

            {filteredRepos.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-400 text-sm">
                No repositories found matching "{repoSearch}".
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: ACTIVE REPO WORKSPACE (Split File Explorer & Code Editor) */}
      {currentUser && selectedRepo && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* LEFT SIDEBAR: FILE EXPLORER */}
          <div className={`w-full md:w-72 lg:w-80 border-r flex flex-col shrink-0 ${
            isDark ? 'border-white/10 bg-zinc-950/60' : 'border-zinc-200 bg-zinc-50'
          }`}>
            
            {/* Repo & Branch Switcher Header */}
            <div className="p-3 border-b border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedRepo(null)}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                >
                  <ArrowLeft size={13} /> Switch Repo
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(true)}
                  title="Create New File"
                  className="p-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs flex items-center gap-1 px-2"
                >
                  <Plus size={12} /> New File
                </button>
              </div>

              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-xs truncate">{selectedRepo.name}</span>
                  <span 
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-medium border flex items-center gap-1 shrink-0 ${
                      isDark ? 'bg-purple-900/40 text-purple-300 border-purple-500/40' : 'bg-purple-100 text-purple-800 border-purple-200'
                    }`}
                    title={`Currently active branch: ${currentBranch}`}
                  >
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <GitBranch size={9} className="text-purple-400 shrink-0" />
                    <span className="truncate max-w-[80px]">{currentBranch}</span>
                  </span>
                </div>
                {/* Branch selector */}
                <select
                  value={currentBranch}
                  onChange={(e) => {
                    setCurrentBranch(e.target.value);
                    loadFolder(selectedRepo.owner.login, selectedRepo.name, currentPath, e.target.value);
                  }}
                  className={`text-[11px] font-mono rounded px-1.5 py-0.5 border focus:outline-none ${
                    isDark ? 'bg-zinc-900 border-white/10 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-800'
                  }`}
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Breadcrumb path */}
              <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono truncate">
                <span 
                  onClick={() => loadFolder(selectedRepo.owner.login, selectedRepo.name, '', currentBranch)} 
                  className="hover:underline cursor-pointer text-purple-400"
                >
                  root
                </span>
                {currentPath && (
                  <>
                    <span>/</span>
                    <span className="truncate">{currentPath}</span>
                  </>
                )}
              </div>
            </div>

            {/* Tree Items List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs font-mono hide-scrollbar">
              {currentPath && (
                <button
                  type="button"
                  onClick={handleNavigateUp}
                  className="w-full px-2 py-1.5 rounded flex items-center gap-2 text-zinc-400 hover:bg-white/5 transition-colors text-left"
                >
                  <ArrowLeft size={13} />
                  <span>.. (Back)</span>
                </button>
              )}

              {isLoadingTree ? (
                <div className="py-8 text-center text-zinc-400 flex items-center justify-center gap-2 text-xs">
                  <RefreshCw size={14} className="animate-spin" /> Loading files...
                </div>
              ) : treeItems.map((item) => {
                const isSelected = activeFile?.path === item.path;
                return (
                  <button
                    key={item.sha}
                    type="button"
                    onClick={() => {
                      if (item.type === 'dir') {
                        loadFolder(selectedRepo.owner.login, selectedRepo.name, item.path, currentBranch);
                      } else {
                        handleOpenFile(item);
                      }
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors text-left truncate ${
                      isSelected 
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' 
                        : isDark ? 'hover:bg-white/5 text-zinc-300' : 'hover:bg-zinc-200/60 text-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.type === 'dir' ? (
                        <Folder size={14} className="text-amber-400 shrink-0" />
                      ) : (
                        <FileCode size={14} className="text-sky-400 shrink-0" />
                      )}
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.type === 'file' && (
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {Math.round(item.size / 1024)}kb
                      </span>
                    )}
                  </button>
                );
              })}

              {treeError && (
                <div className="p-2 text-[11px] text-red-400 bg-red-500/10 rounded">
                  {treeError}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT MAIN AREA: CODE EDITOR & LIVE COMMIT */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeFile ? (
              <>
                {/* Editor Header Bar */}
                <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${
                  isDark ? 'border-white/10 bg-zinc-950/40' : 'border-zinc-200 bg-white'
                }`}>
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-purple-400" />
                    <span className="font-mono text-xs font-semibold">{activeFile.path}</span>
                    {isModified && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                        Unsaved Changes
                      </span>
                    )}
                  </div>

                  {/* Mode & AI Actions */}
                  <div className="flex items-center gap-2">
                    {onSendCodeToAI && (
                      <button
                        type="button"
                        onClick={() => onSendCodeToAI(fileContent, activeFile.name)}
                        title="Send code to Jaalix AI for refactoring or enhancement"
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Code2 size={12} />
                        <span>AI Enhance</span>
                      </button>
                    )}

                    <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
                      <button
                        type="button"
                        onClick={() => setViewMode('editor')}
                        className={`px-2.5 py-1 flex items-center gap-1 ${
                          viewMode === 'editor' ? 'bg-purple-600 text-white' : 'bg-transparent text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Code2 size={12} /> Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('preview')}
                        className={`px-2.5 py-1 flex items-center gap-1 ${
                          viewMode === 'preview' ? 'bg-purple-600 text-white' : 'bg-transparent text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Eye size={12} /> Preview
                      </button>
                    </div>
                  </div>
                </div>

                {/* Editor or Preview Container */}
                <div className="flex-1 overflow-hidden relative">
                  {isLoadingFile ? (
                    <div className="h-full flex items-center justify-center text-zinc-400 text-xs gap-2">
                      <RefreshCw size={16} className="animate-spin" /> Loading file content...
                    </div>
                  ) : viewMode === 'editor' ? (
                    <textarea
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      spellCheck={false}
                      className={`w-full h-full p-4 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none ${
                        isDark ? 'bg-[#0b0b14] text-zinc-200' : 'bg-white text-zinc-900'
                      }`}
                    />
                  ) : (
                    /* Live HTML / Tailwind Sandbox Preview */
                    <iframe
                      title="Component Preview"
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <script src="https://cdn.tailwindcss.com"></script>
                            <style>body { margin: 0; padding: 1.5rem; font-family: system-ui, sans-serif; background: ${isDark ? '#09090b' : '#ffffff'}; color: ${isDark ? '#fafafa' : '#09090b'}; }</style>
                          </head>
                          <body>
                            ${fileContent.includes('<') ? fileContent : `<pre style="font-size:12px;white-space:pre-wrap;">${fileContent}</pre>`}
                          </body>
                        </html>
                      `}
                      className="w-full h-full border-none bg-black"
                    />
                  )}
                </div>

                {/* BOTTOM COMMIT CONTROLLER */}
                <div className={`p-3 sm:p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
                  isDark ? 'border-white/10 bg-zinc-950/90' : 'border-zinc-200 bg-zinc-100'
                }`}>
                  <div className="w-full sm:flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Commit message (e.g. Update component styles with Tailwind)..."
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-zinc-300 text-black'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {commitSuccess && (
                      <a
                        href={commitSuccess.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <Check size={13} /> {commitSuccess.sha} <ExternalLink size={11} />
                      </a>
                    )}

                    {commitError && (
                      <span className="text-xs text-red-400 truncate max-w-xs">{commitError}</span>
                    )}

                    <button
                      type="button"
                      onClick={handleCommitFile}
                      disabled={isCommitting || !isModified}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isCommitting ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Pushing to GitHub...</span>
                        </>
                      ) : (
                        <>
                          <Save size={13} />
                          <span>Commit & Save Directly</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                <Code2 size={44} className="text-zinc-600 mb-3" />
                <h3 className="font-semibold text-sm mb-1 text-zinc-200">No File Selected</h3>
                <p className="text-xs max-w-sm text-zinc-400 mb-4">
                  Select any file from the explorer on the left to read, edit, or commit directly back to GitHub.
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} /> Create New File in Repo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GITHUB OAUTH SETUP INSTRUCTIONS MODAL */}
      <AnimatePresence>
        {showOAuthSetupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-lg p-6 sm:p-7 rounded-3xl border shadow-2xl ${
                isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200 text-black'
              }`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Key size={18} className="text-purple-400" />
                  <h3 className="font-bold text-base">GitHub OAuth App Configuration</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOAuthSetupModal(false)}
                  className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5"
                >
                  Close
                </button>
              </div>

              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                To enable 1-Click GitHub OAuth login, create an OAuth app on GitHub and set your Client ID & Secret in <code className="text-purple-400">/.env</code>.
              </p>

              <div className="space-y-3 mb-5 text-xs">
                {/* Callback URL */}
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/50 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-zinc-300">Authorization Callback URL</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(callbackUrl || `${window.location.origin}/auth/github/callback`, 'cb')}
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono text-[11px]"
                    >
                      {copiedField === 'cb' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedField === 'cb' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="block text-[11px] text-zinc-400 font-mono break-all select-all">
                    {callbackUrl || `${window.location.origin}/auth/github/callback`}
                  </code>
                </div>

                {/* Homepage URL */}
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/50 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-zinc-300">Homepage URL</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(window.location.origin, 'home')}
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono text-[11px]"
                    >
                      {copiedField === 'home' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedField === 'home' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="block text-[11px] text-zinc-400 font-mono break-all select-all">
                    {window.location.origin}
                  </code>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <a
                  href="https://github.com/settings/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-md"
                >
                  <span>Open GitHub Developer Settings</span>
                  <ExternalLink size={13} />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setShowOAuthSetupModal(false);
                    setAuthMethod('pat');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-zinc-200"
                >
                  Use Token Instead
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEW FILE MODAL */}
      <AnimatePresence>
        {showNewFileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          >
            <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl ${
              isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'
            }`}>
              <h3 className="font-bold text-base mb-1">Create New File in Repo</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Will be created at: <code className="text-purple-400">{currentPath ? `${currentPath}/` : ''}filename</code>
              </p>
              
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. Header.tsx or styles.css"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4 ${
                  isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-black'
                }`}
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewFile}
                  disabled={!newFileName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40"
                >
                  Create & Push
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
