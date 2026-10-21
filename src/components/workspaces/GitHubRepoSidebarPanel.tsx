import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  GitBranch, 
  GitPullRequest,
  GitMerge,
  Folder, 
  FolderOpen,
  FileCode,
  FileText,
  File,
  Lock, 
  Globe, 
  Star, 
  GitFork, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown,
  ChevronLeft,
  ArrowLeft,
  SlidersHorizontal,
  X,
  Plus,
  AlertCircle,
  Key,
  FolderGit2,
  CheckCircle2,
  Check,
  Copy,
  CornerDownRight,
  Code2,
  Eye,
  MessageSquare,
  Clock,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitHubRepo, 
  GitHubUser, 
  GitHubContentItem,
  GitHubFileContent,
  GitHubPullRequest,
  getUserRepos, 
  verifyGitHubToken, 
  getRepoBranches,
  getRepoContents,
  getRepoPullRequests,
  decodeBase64Utf8 
} from '../../services/githubService';

interface GitHubRepoSidebarPanelProps {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelectRepo: (repo: GitHubRepo, branch?: string) => void;
  selectedRepoId?: number;
  selectedRepo?: GitHubRepo | null;
  selectedBranch?: string;
  onSelectBranch?: (branch: string) => void;
  onOpenConnectModal?: () => void;
  onSendCodeToAI?: (code: string, fileName: string) => void;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-emerald-500',
  HTML: 'bg-orange-500',
  CSS: 'bg-sky-400',
  Rust: 'bg-amber-600',
  Go: 'bg-cyan-500',
  Java: 'bg-red-500',
  PHP: 'bg-indigo-400',
  Ruby: 'bg-rose-500',
  C: 'bg-zinc-400',
  'C++': 'bg-pink-500'
};

const DEFAULT_STARTER_REPOS: GitHubRepo[] = [
  {
    id: 101,
    name: 'react-tailwind-components',
    full_name: 'templates/react-tailwind-components',
    private: false,
    html_url: 'https://github.com',
    description: 'Modern, accessible UI component library built with React, Vite, and Tailwind CSS.',
    default_branch: 'main',
    stargazers_count: 142,
    language: 'TypeScript',
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    owner: { login: 'templates', avatar_url: 'https://github.com/github.png' }
  },
  {
    id: 102,
    name: 'modern-bento-dashboard',
    full_name: 'templates/modern-bento-dashboard',
    private: false,
    html_url: 'https://github.com',
    description: 'Asymmetric Bento grid analytics dashboard with dark mode metrics and telemetry.',
    default_branch: 'main',
    stargazers_count: 98,
    language: 'TypeScript',
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    owner: { login: 'templates', avatar_url: 'https://github.com/github.png' }
  },
  {
    id: 103,
    name: 'glassmorphism-ui-kit',
    full_name: 'templates/glassmorphism-ui-kit',
    private: false,
    html_url: 'https://github.com',
    description: 'Translucent frosted-glass UI widgets with CSS backdrop-blur and neon glowing accents.',
    default_branch: 'main',
    stargazers_count: 67,
    language: 'CSS',
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    owner: { login: 'templates', avatar_url: 'https://github.com/github.png' }
  },
  {
    id: 104,
    name: 'minimalist-saas-landing',
    full_name: 'templates/minimalist-saas-landing',
    private: false,
    html_url: 'https://github.com',
    description: 'Clean typographic hero landing page with pricing calculator and feature comparisons.',
    default_branch: 'main',
    stargazers_count: 53,
    language: 'JavaScript',
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    owner: { login: 'templates', avatar_url: 'https://github.com/github.png' }
  },
  {
    id: 105,
    name: 'cyberpunk-terminal-hud',
    full_name: 'templates/cyberpunk-terminal-hud',
    private: false,
    html_url: 'https://github.com',
    description: 'Futuristic sci-fi terminal interface component with scanlines and monospace telemetry.',
    default_branch: 'main',
    stargazers_count: 85,
    language: 'TypeScript',
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    owner: { login: 'templates', avatar_url: 'https://github.com/github.png' }
  }
];

// Mock templates file system for starter repositories
const STARTER_FILES: Record<string, Record<string, { items: GitHubContentItem[]; files: Record<string, string> }>> = {
  'react-tailwind-components': {
    '': {
      items: [
        { name: 'src', path: 'src', sha: 'dir-src', size: 0, type: 'dir', html_url: '', download_url: null },
        { name: 'package.json', path: 'package.json', sha: 'pkg-json', size: 1240, type: 'file', html_url: '', download_url: null },
        { name: 'tailwind.config.js', path: 'tailwind.config.js', sha: 'tw-cfg', size: 850, type: 'file', html_url: '', download_url: null },
        { name: 'README.md', path: 'README.md', sha: 'readme', size: 620, type: 'file', html_url: '', download_url: null }
      ],
      files: {
        'package.json': `{\n  "name": "react-tailwind-components",\n  "version": "1.0.0",\n  "private": true,\n  "dependencies": {\n    "react": "^19.0.0",\n    "react-dom": "^19.0.0",\n    "lucide-react": "^0.475.0",\n    "motion": "^12.0.0"\n  },\n  "devDependencies": {\n    "tailwindcss": "^4.0.0",\n    "typescript": "^5.7.0"\n  }\n}`,
        'tailwind.config.js': `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  content: ["./src/**/*.{js,ts,jsx,tsx}"],\n  theme: {\n    extend: {\n      colors: {\n        brand: { 500: '#8b5cf6', 600: '#7c3aed' }\n      }\n    }\n  },\n  plugins: []\n};`,
        'README.md': `# React Tailwind Components\n\nProduction-ready, accessible, modular UI components built with React 19, TypeScript, and Tailwind CSS.\n\n## Available Components:\n- Modern Button with kinetic glow\n- Glassmorphic Cards\n- Responsive Modal Dialog\n`
      }
    },
    'src': {
      items: [
        { name: 'Button.tsx', path: 'src/Button.tsx', sha: 'btn-tsx', size: 1420, type: 'file', html_url: '', download_url: null },
        { name: 'Card.tsx', path: 'src/Card.tsx', sha: 'card-tsx', size: 1890, type: 'file', html_url: '', download_url: null },
        { name: 'Modal.tsx', path: 'src/Modal.tsx', sha: 'modal-tsx', size: 2150, type: 'file', html_url: '', download_url: null },
        { name: 'index.ts', path: 'src/index.ts', sha: 'idx-ts', size: 310, type: 'file', html_url: '', download_url: null }
      ],
      files: {
        'src/Button.tsx': `import React from 'react';\n\ninterface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {\n  variant?: 'primary' | 'secondary' | 'glass';\n  size?: 'sm' | 'md' | 'lg';\n}\n\nexport const Button: React.FC<ButtonProps> = ({\n  children,\n  variant = 'primary',\n  size = 'md',\n  className = '',\n  ...props\n}) => {\n  const base = "inline-flex items-center justify-center font-medium transition-all active:scale-95 rounded-xl cursor-pointer";\n  const variants = {\n    primary: "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25",\n    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-white/10",\n    glass: "bg-white/10 hover:bg-white/15 backdrop-blur-md text-white border border-white/20"\n  };\n  const sizes = {\n    sm: "px-3 py-1.5 text-xs",\n    md: "px-4 py-2 text-sm",\n    lg: "px-5 py-2.5 text-base"\n  };\n\n  return (\n    <button className={\`\${base} \${variants[variant]} \${sizes[size]} \${className}\`} {...props}>\n      {children}\n    </button>\n  );\n};`,
        'src/Card.tsx': `import React from 'react';\n\nexport const Card: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (\n  <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-purple-500/50 backdrop-blur-xl transition-all shadow-xl">\n    <h3 className="font-bold text-base text-white mb-1">{title}</h3>\n    <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>\n  </div>\n);`,
        'src/Modal.tsx': `import React from 'react';\nimport { X } from 'lucide-react';\n\nexport const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {\n  if (!isOpen) return null;\n  return (\n    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={onClose}>\n      <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-white/15 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>\n        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X size={18} /></button>\n        {children}\n      </div>\n    </div>\n  );\n};`,
        'src/index.ts': `export * from './Button';\nexport * from './Card';\nexport * from './Modal';\n`
      }
    }
  }
};

// Mock pull requests for starter repositories
const DEMO_PULL_REQUESTS: Record<string, GitHubPullRequest[]> = {
  'react-tailwind-components': [
    {
      id: 201,
      number: 14,
      title: 'feat: Add dynamic kinetic glow & sound effects to Button component',
      state: 'open',
      draft: false,
      html_url: 'https://github.com',
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      user: { login: 'alex-dev', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop' },
      head: { ref: 'feature/button-kinetic-glow', sha: 'a8b9c0d' },
      base: { ref: 'main' },
      body: 'Implements mouse-following gradient border illumination and sound cue hooks for primary and glass action buttons.',
      labels: [
        { id: 1, name: 'enhancement', color: 'a855f7' },
        { id: 2, name: 'ui', color: '3b82f6' }
      ],
      comments: 3
    },
    {
      id: 202,
      number: 15,
      title: 'fix(a11y): Trap keyboard focus inside Modal dialog component',
      state: 'open',
      draft: false,
      html_url: 'https://github.com',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 10).toISOString(),
      user: { login: 'sarah-ui', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop' },
      head: { ref: 'fix/modal-focus-trap', sha: 'f1e2d3c' },
      base: { ref: 'main' },
      body: 'Ensures Tab and Shift+Tab key cycles cycle through active focusable elements without spilling to background DOM.',
      labels: [
        { id: 3, name: 'accessibility', color: '10b981' },
        { id: 4, name: 'bug', color: 'ef4444' }
      ],
      comments: 5
    },
    {
      id: 203,
      number: 16,
      title: 'draft: Explore Radix UI headless primitives migration',
      state: 'open',
      draft: true,
      html_url: 'https://github.com',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      user: { login: 'kevin-eng', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop' },
      head: { ref: 'refactor/radix-primitives', sha: 'c4b5a69' },
      base: { ref: 'main' },
      body: 'WIP draft evaluating migration of portal overlays to headless primitives.',
      labels: [
        { id: 5, name: 'refactor', color: '64748b' },
        { id: 6, name: 'draft', color: '71717a' }
      ],
      comments: 1
    },
    {
      id: 204,
      number: 12,
      title: 'perf: Optimize Tailwind 4 CSS bundle with clean purge rules',
      state: 'closed',
      merged_at: new Date(Date.now() - 3600000 * 72).toISOString(),
      html_url: 'https://github.com',
      created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 72).toISOString(),
      user: { login: 'core-lead', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop' },
      head: { ref: 'perf/tw4-purge', sha: '99aa88b' },
      base: { ref: 'main' },
      body: 'Reduces production CSS footprint by 42% by removing unused utility classes.',
      labels: [{ id: 7, name: 'merged', color: '8b5cf6' }],
      comments: 8
    }
  ],
  'modern-bento-dashboard': [
    {
      id: 301,
      number: 7,
      title: 'feat: Add real-time WebSocket telemetry charts to BentoGrid',
      state: 'open',
      draft: false,
      html_url: 'https://github.com',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      user: { login: 'dev-mike', avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop' },
      head: { ref: 'feat/telemetry-ws', sha: 'b1c2d3' },
      base: { ref: 'main' },
      body: 'Connects live data stream with automatic scale interpolation.',
      labels: [{ id: 8, name: 'feature', color: 'a855f7' }],
      comments: 2
    }
  ]
};

function getRelativeTime(dateString: string): string {
  try {
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'recently';
  }
}

export default function GitHubRepoSidebarPanel({
  isDark,
  isOpen,
  onClose,
  onSelectRepo,
  selectedRepoId,
  selectedRepo,
  selectedBranch,
  onSelectBranch,
  onOpenConnectModal,
  onSendCodeToAI
}: GitHubRepoSidebarPanelProps) {
  const [token, setToken] = useState(() => localStorage.getItem('github-pat-token') || '');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Explorer Views: 'repos' (list of repos) | 'files' (folder tree & file reader) | 'prs' (pull requests)
  const [activeTab, setActiveTab] = useState<'repos' | 'files' | 'prs'>('repos');

  // Repos Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'name'>('updated');

  // Selected Repo & Branch Management
  const [internalSelectedRepo, setInternalSelectedRepo] = useState<GitHubRepo | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [activeBranch, setActiveBranch] = useState<string>(selectedBranch || 'main');
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState('');

  // File Tree Explorer State
  const [currentPath, setCurrentPath] = useState<string>('');
  const [treeItems, setTreeItems] = useState<GitHubContentItem[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [treeSearch, setTreeSearch] = useState('');

  // File Content Viewer State
  const [activeFileItem, setActiveFileItem] = useState<GitHubContentItem | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Pull Requests State
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [isLoadingPRs, setIsLoadingPRs] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);
  const [prFilterState, setPrFilterState] = useState<'all' | 'open' | 'draft' | 'closed'>('all');
  const [prSearchQuery, setPrSearchQuery] = useState('');

  // Fetch Repositories
  const fetchRepositories = async (pat: string) => {
    if (!pat.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const [userData, repoList] = await Promise.all([
        verifyGitHubToken(pat),
        getUserRepos(pat)
      ]);
      setUser(userData);
      setRepos(repoList);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch repositories';
      setError(errorMessage);
      if (errorMessage.includes('Invalid')) {
        setUser(null);
        setRepos([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sync token from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const currentToken = localStorage.getItem('github-pat-token') || '';
      setToken(currentToken);
      if (currentToken) {
        fetchRepositories(currentToken);
      } else {
        setUser(null);
        setRepos([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const currentToken = localStorage.getItem('github-pat-token') || '';
    if (currentToken) {
      fetchRepositories(currentToken);
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Compute active repository pool
  const activeRepos = useMemo(() => {
    if (repos.length > 0) return repos;
    if (!token) return DEFAULT_STARTER_REPOS;
    return [];
  }, [repos, token]);

  // Determine current active repository
  const currentSelectedRepo = useMemo(() => {
    if (selectedRepo) return selectedRepo;
    if (internalSelectedRepo) return internalSelectedRepo;
    if (selectedRepoId) {
      return activeRepos.find(r => r.id === selectedRepoId) || null;
    }
    return activeRepos[0] || null;
  }, [selectedRepo, internalSelectedRepo, selectedRepoId, activeRepos]);

  // Fetch branches whenever currentSelectedRepo changes
  useEffect(() => {
    if (!currentSelectedRepo) {
      setBranches([]);
      return;
    }

    const defaultBr = currentSelectedRepo.default_branch || 'main';
    const initialBr = selectedBranch || defaultBr;
    setActiveBranch(initialBr);

    let isMounted = true;
    const loadBranches = async () => {
      setIsLoadingBranches(true);
      try {
        if (token && currentSelectedRepo.owner?.login) {
          const brList = await getRepoBranches(token, currentSelectedRepo.owner.login, currentSelectedRepo.name);
          if (isMounted) {
            setBranches(brList);
            if (selectedBranch && brList.includes(selectedBranch)) {
              setActiveBranch(selectedBranch);
            } else if (brList.includes(defaultBr)) {
              setActiveBranch(defaultBr);
            } else if (brList.length > 0) {
              setActiveBranch(brList[0]);
            }
          }
        } else {
          const demoBranches = [defaultBr, 'development', 'staging', 'feature/modern-ui'];
          if (isMounted) {
            setBranches(demoBranches);
            setActiveBranch(selectedBranch || defaultBr);
          }
        }
      } catch (err) {
        if (isMounted) {
          setBranches([defaultBr, 'development']);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBranches(false);
        }
      }
    };

    loadBranches();
    return () => {
      isMounted = false;
    };
  }, [currentSelectedRepo?.id, currentSelectedRepo?.name, token, selectedBranch]);

  // Load Folder Content function
  const loadFolder = useCallback(async (path: string = '', branchToUse?: string) => {
    if (!currentSelectedRepo) return;
    setIsLoadingTree(true);
    setTreeError(null);
    setActiveFileItem(null);
    setFileContent('');

    const targetBranch = branchToUse || activeBranch || currentSelectedRepo.default_branch || 'main';

    try {
      if (token && currentSelectedRepo.owner?.login) {
        const data = await getRepoContents(
          token, 
          currentSelectedRepo.owner.login, 
          currentSelectedRepo.name, 
          path, 
          targetBranch
        );

        if (Array.isArray(data)) {
          const sorted = data.sort((a, b) => {
            if (a.type === 'dir' && b.type !== 'dir') return -1;
            if (a.type !== 'dir' && b.type === 'dir') return 1;
            return a.name.localeCompare(b.name);
          });
          setTreeItems(sorted);
          setCurrentPath(path);
        }
      } else {
        const repoName = currentSelectedRepo.name;
        const starter = STARTER_FILES[repoName] || STARTER_FILES['react-tailwind-components'];
        const folderData = starter[path] || starter[''];
        if (folderData) {
          setTreeItems(folderData.items);
          setCurrentPath(path);
        } else {
          setTreeItems([]);
        }
      }
    } catch (err: unknown) {
      setTreeError(err instanceof Error ? err.message : 'Failed to load folder');
    } finally {
      setIsLoadingTree(false);
    }
  }, [currentSelectedRepo, token, activeBranch]);

  // Fetch Pull Requests function
  const fetchPullRequests = useCallback(async (repo: GitHubRepo) => {
    setIsLoadingPRs(true);
    setPrError(null);
    try {
      if (token && repo.owner?.login) {
        const prList = await getRepoPullRequests(token, repo.owner.login, repo.name, 'all');
        setPullRequests(prList);
      } else {
        const demoPRs = DEMO_PULL_REQUESTS[repo.name] || DEMO_PULL_REQUESTS['react-tailwind-components'] || [];
        setPullRequests(demoPRs);
      }
    } catch (err: unknown) {
      const demoPRs = DEMO_PULL_REQUESTS[repo.name] || DEMO_PULL_REQUESTS['react-tailwind-components'] || [];
      if (demoPRs.length > 0) {
        setPullRequests(demoPRs);
      } else {
        setPrError(err instanceof Error ? err.message : 'Failed to fetch pull requests');
      }
    } finally {
      setIsLoadingPRs(false);
    }
  }, [token]);

  // Load directory contents or PRs when tab changes
  useEffect(() => {
    if (activeTab === 'files' && currentSelectedRepo) {
      loadFolder(currentPath, activeBranch);
    } else if (activeTab === 'prs' && currentSelectedRepo) {
      fetchPullRequests(currentSelectedRepo);
    }
  }, [activeTab, currentSelectedRepo?.id, activeBranch, fetchPullRequests, loadFolder, currentPath]);

  // Handle switching branch
  const handleSwitchBranch = (branchName: string) => {
    setActiveBranch(branchName);
    setIsBranchDropdownOpen(false);
    onSelectBranch?.(branchName);
    if (currentSelectedRepo) {
      onSelectRepo(currentSelectedRepo, branchName);
      if (activeTab === 'files') {
        loadFolder(currentPath, branchName);
      }
    }
  };

  // Click on a repository from the list
  const handleSelectRepository = (repo: GitHubRepo) => {
    setInternalSelectedRepo(repo);
    const branch = repo.default_branch || 'main';
    setActiveBranch(branch);
    onSelectRepo(repo, branch);
    setCurrentPath('');
    setActiveTab('files');
  };

  // Open a file item to display content
  const handleOpenFile = async (item: GitHubContentItem) => {
    if (!currentSelectedRepo) return;
    setActiveFileItem(item);
    setIsLoadingFile(true);
    setFileError(null);
    setCopiedCode(false);

    try {
      if (token && currentSelectedRepo.owner?.login) {
        const data = await getRepoContents(
          token,
          currentSelectedRepo.owner.login,
          currentSelectedRepo.name,
          item.path,
          activeBranch
        );

        if (!Array.isArray(data) && data.content) {
          const decoded = decodeBase64Utf8(data.content);
          setFileContent(decoded);
        } else {
          setFileContent('// Empty or non-text file');
        }
      } else {
        const repoName = currentSelectedRepo.name;
        const starter = STARTER_FILES[repoName] || STARTER_FILES['react-tailwind-components'];
        let matchedContent = '';
        for (const dirKey of Object.keys(starter)) {
          if (starter[dirKey].files[item.path]) {
            matchedContent = starter[dirKey].files[item.path];
            break;
          }
        }
        setFileContent(matchedContent || `// ${item.name}\n// Source file from ${repoName}\nexport const Component = () => {\n  return <div>Component Ready</div>;\n};`);
      }
    } catch (err: unknown) {
      setFileError(err instanceof Error ? err.message : 'Failed to read file content');
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (!fileContent) return;
    navigator.clipboard?.writeText(fileContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  // Filter repos by Name
  const filteredRepos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return activeRepos.filter(repo => {
      const matchesName = !query || repo.name.toLowerCase().includes(query) || (repo.description && repo.description.toLowerCase().includes(query));

      if (!matchesName) return false;

      if (filterType === 'public') return !repo.private;
      if (filterType === 'private') return repo.private;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'stars') {
        return (b.stargazers_count || 0) - (a.stargazers_count || 0);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [activeRepos, searchQuery, filterType, sortBy]);

  // Filter current directory tree items
  const filteredTreeItems = useMemo(() => {
    const q = treeSearch.trim().toLowerCase();
    if (!q) return treeItems;
    return treeItems.filter(item => item.name.toLowerCase().includes(q));
  }, [treeItems, treeSearch]);

  // Filter pull requests by query & state
  const filteredPRs = useMemo(() => {
    const q = prSearchQuery.trim().toLowerCase();
    return pullRequests.filter(pr => {
      const matchesSearch = !q || 
        pr.title.toLowerCase().includes(q) ||
        pr.user.login.toLowerCase().includes(q) ||
        pr.head.ref.toLowerCase().includes(q) ||
        String(pr.number).includes(q);

      if (!matchesSearch) return false;

      if (prFilterState === 'open') return pr.state === 'open' && !pr.draft;
      if (prFilterState === 'draft') return Boolean(pr.draft);
      if (prFilterState === 'closed') return pr.state === 'closed' || Boolean(pr.merged_at);
      return true;
    });
  }, [pullRequests, prSearchQuery, prFilterState]);

  const openPRCount = useMemo(() => {
    return pullRequests.filter(pr => pr.state === 'open').length;
  }, [pullRequests]);

  const publicCount = activeRepos.filter(r => !r.private).length;
  const privateCount = activeRepos.filter(r => r.private).length;

  // Breadcrumb parts
  const breadcrumbParts = useMemo(() => {
    if (!currentPath) return [];
    return currentPath.split('/');
  }, [currentPath]);

  // Navigate to breadcrumb ancestor
  const handleNavigateBreadcrumb = (index: number) => {
    if (index === -1) {
      loadFolder('');
      return;
    }
    const newPath = breadcrumbParts.slice(0, index + 1).join('/');
    loadFolder(newPath);
  };

  // Helper icon for file extension
  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['tsx', 'ts', 'jsx', 'js'].includes(ext || '')) {
      return <FileCode size={14} className="text-blue-400 shrink-0" />;
    }
    if (['json', 'yaml', 'yml'].includes(ext || '')) {
      return <Code2 size={14} className="text-amber-400 shrink-0" />;
    }
    if (['css', 'scss', 'html'].includes(ext || '')) {
      return <FileCode size={14} className="text-cyan-400 shrink-0" />;
    }
    if (['md', 'txt'].includes(ext || '')) {
      return <FileText size={14} className="text-emerald-400 shrink-0" />;
    }
    return <File size={14} className="text-zinc-400 shrink-0" />;
  };

  // Helper status indicator badge for PR
  const renderPRStatus = (pr: GitHubPullRequest) => {
    if (pr.merged_at) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 shrink-0">
          <GitMerge size={11} className="text-purple-400" />
          <span>Merged</span>
        </span>
      );
    }
    if (pr.state === 'closed') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1 shrink-0">
          <X size={11} className="text-red-400" />
          <span>Closed</span>
        </span>
      );
    }
    if (pr.draft) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/15 text-zinc-300 border border-zinc-500/30 flex items-center gap-1 shrink-0">
          <FileCode size={11} className="text-zinc-400" />
          <span>Draft</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0 shadow-xs">
        <GitPullRequest size={11} className="text-emerald-400 animate-pulse" />
        <span>Open</span>
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <aside 
      className={`w-full sm:w-80 md:w-96 h-full flex flex-col border-r z-30 shrink-0 transition-all select-none ${
        isDark 
          ? 'bg-[#0a0a14]/95 border-white/[0.08] text-zinc-100 backdrop-blur-2xl' 
          : 'bg-white/95 border-zinc-200 text-zinc-900 backdrop-blur-2xl shadow-xl'
      }`}
    >
      {/* 1. TOP HEADER: PANEL TITLE, TABS & ACTIONS */}
      <div className={`px-3 sm:px-4 py-3 border-b flex items-center justify-between shrink-0 ${
        isDark ? 'border-white/[0.08] bg-black/40' : 'border-zinc-200 bg-zinc-50/80'
      }`}>
        <div className="flex items-center gap-2">
          {activeTab !== 'repos' ? (
            <button
              type="button"
              onClick={() => {
                setActiveTab('repos');
                setActiveFileItem(null);
              }}
              title="Back to All Repositories"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-400 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Repos</span>
            </button>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm shrink-0">
              <FolderGit2 size={15} />
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm tracking-tight flex-wrap">
              <span>
                {activeTab === 'files' ? 'File Explorer' : activeTab === 'prs' ? 'Pull Requests' : 'GitHub Explorer'}
              </span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold truncate max-w-[110px] ${
                isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700'
              }`}>
                {activeTab === 'repos' ? activeRepos.length : (currentSelectedRepo?.name || 'repo')}
              </span>
              {activeTab !== 'repos' && activeBranch && (
                <span 
                  className={`px-1.5 py-0.2 rounded-md text-[9px] font-mono font-semibold flex items-center gap-1 shrink-0 ${
                    isDark ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                  title={`Active branch: ${activeBranch}`}
                >
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <GitBranch size={9} className="text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[80px]">{activeBranch}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher Tabs: Repos | Files | PRs */}
        <div className="flex items-center gap-1">
          {currentSelectedRepo && (
            <div className={`flex rounded-lg p-0.5 border text-[11px] font-medium ${
              isDark ? 'bg-black/30 border-white/10' : 'bg-zinc-200/60 border-zinc-300'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('repos');
                  setActiveFileItem(null);
                }}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  activeTab === 'repos'
                    ? 'bg-purple-600 text-white shadow-xs font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Repos
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('files');
                  if (!currentPath && currentSelectedRepo) {
                    loadFolder('');
                  }
                }}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'files'
                    ? 'bg-purple-600 text-white shadow-xs font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FolderOpen size={11} />
                <span>Files</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('prs');
                  if (currentSelectedRepo) {
                    fetchPullRequests(currentSelectedRepo);
                  }
                }}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'prs'
                    ? 'bg-purple-600 text-white shadow-xs font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="View active pull requests"
              >
                <GitPullRequest size={11} />
                <span>PRs</span>
                {openPRCount > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'prs' ? 'bg-white' : 'bg-emerald-400'} animate-pulse`} />
                )}
              </button>
            </div>
          )}

          {token && (
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'files') {
                  loadFolder(currentPath, activeBranch);
                } else if (activeTab === 'prs' && currentSelectedRepo) {
                  fetchPullRequests(currentSelectedRepo);
                } else {
                  fetchRepositories(token);
                }
              }}
              disabled={isLoading || isLoadingTree || isLoadingPRs}
              title="Refresh"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-600'
              }`}
            >
              <RefreshCw size={13} className={isLoading || isLoadingTree || isLoadingPRs ? 'animate-spin text-purple-400' : ''} />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            title="Close Explorer"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-600'
            }`}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. TAB A: REPOSITORIES LIST VIEW */}
      {activeTab === 'repos' && (
        <>
          {/* Top Search Input Bar to filter repos by name */}
          <div className={`p-3 border-b shrink-0 ${
            isDark ? 'border-white/[0.06] bg-[#0c0c16]/80' : 'border-zinc-200/90 bg-zinc-50/90'
          }`}>
            <div className="relative flex items-center">
              <Search 
                size={14} 
                className={`absolute left-3 transition-colors pointer-events-none ${
                  searchQuery ? 'text-purple-400' : 'text-zinc-400'
                }`} 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter repositories by name..."
                aria-label="Filter repositories by name"
                className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium border transition-all outline-none ${
                  isDark 
                    ? 'bg-black/50 border-white/10 text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-inner' 
                    : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-xs'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  className={`absolute right-2.5 p-1 rounded-md transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Badges & Sort Menu */}
            <div className="flex items-center justify-between gap-1 mt-2.5 text-[11px]">
              <div className="flex rounded-lg p-0.5 bg-black/20 border border-white/5">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                    filterType === 'all' 
                      ? 'bg-purple-600 text-white shadow-xs font-semibold' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All ({activeRepos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('public')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    filterType === 'public' 
                      ? 'bg-purple-600 text-white shadow-xs font-semibold' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Globe size={10} />
                  <span>Public ({publicCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('private')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    filterType === 'private' 
                      ? 'bg-purple-600 text-white shadow-xs font-semibold' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Lock size={10} />
                  <span>Private ({privateCount})</span>
                </button>
              </div>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'updated' | 'stars' | 'name')}
                className={`text-[10px] font-medium rounded-md px-1.5 py-1 border focus:outline-none cursor-pointer ${
                  isDark ? 'bg-zinc-900 border-white/10 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-800'
                }`}
              >
                <option value="updated">Recent</option>
                <option value="stars">Stars</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            {searchQuery && (
              <div className="mt-2 flex items-center justify-between text-[10px] text-purple-400 px-0.5">
                <span>Filtering by name: "{searchQuery}"</span>
                <span className="font-semibold">{filteredRepos.length} found</span>
              </div>
            )}
          </div>

          {/* Active Repo Quick-Switch Card */}
          {currentSelectedRepo && (
            <div className={`p-3 border-b shrink-0 ${
              isDark ? 'bg-purple-950/25 border-purple-500/20' : 'bg-purple-50/75 border-purple-200'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Folder size={14} className="text-purple-400 shrink-0" />
                  <span className="text-xs font-bold truncate text-purple-200">
                    {currentSelectedRepo.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('prs');
                      fetchPullRequests(currentSelectedRepo);
                    }}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <GitPullRequest size={10} />
                    <span>PRs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('files');
                      loadFolder('');
                    }}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-600 text-white flex items-center gap-1 cursor-pointer hover:bg-purple-500 transition-colors"
                  >
                    <FolderOpen size={11} />
                    <span>Files &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Unauthenticated Callout */}
          {!token && (
            <div className={`px-3 py-2 border-b flex items-center justify-between gap-2 shrink-0 ${
              isDark ? 'bg-purple-950/20 border-purple-500/20 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800'
            }`}>
              <div className="flex items-center gap-1.5 text-[11px] truncate">
                <FolderGit2 size={12} className="text-purple-400 shrink-0" />
                <span className="truncate">Showing starter repos. Link GitHub for private repos:</span>
              </div>
              <button
                type="button"
                onClick={onOpenConnectModal}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-600 hover:bg-purple-500 text-white shrink-0 cursor-pointer transition-all"
              >
                Connect
              </button>
            </div>
          )}

          {/* Repositories List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 hide-scrollbar">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-400 gap-2">
                <RefreshCw size={20} className="animate-spin text-purple-400" />
                <span className="text-xs">Fetching repositories from GitHub...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <AlertCircle size={14} /> Error Loading Repositories
                </div>
                <p className="leading-relaxed mb-2">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchRepositories(token)}
                  className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-white font-semibold text-[11px] cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-400 text-xs gap-2">
                <Search size={22} className="text-zinc-500" />
                {searchQuery ? (
                  <>
                    <p className="font-semibold text-zinc-300">No repositories matching "{searchQuery}"</p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mt-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] cursor-pointer transition-colors"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <p>No repositories found for this account.</p>
                )}
              </div>
            ) : (
              filteredRepos.map((repo) => {
                const isSelected = currentSelectedRepo?.id === repo.id;
                const langColor = repo.language ? (LANGUAGE_COLORS[repo.language] || 'bg-purple-400') : null;

                return (
                  <motion.div
                    key={repo.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectRepository(repo)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                      isSelected 
                        ? 'bg-purple-600/20 border-purple-500/50 shadow-md shadow-purple-600/10' 
                        : isDark 
                        ? 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/[0.06] hover:border-white/20' 
                        : 'bg-white hover:bg-zinc-50 border-zinc-200/90 hover:border-zinc-300 shadow-xs'
                    }`}
                  >
                    {/* Top Row: Name and Privacy */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 font-semibold text-xs flex-wrap">
                        <Folder size={14} className={isSelected ? 'text-purple-400' : 'text-zinc-400 group-hover:text-purple-400 transition-colors shrink-0'} />
                        <span className="truncate group-hover:text-purple-300 transition-colors font-medium">
                          {repo.name}
                        </span>
                        {isSelected && (
                          <span 
                            className={`px-1.5 py-0.2 rounded-md text-[9px] font-mono font-semibold flex items-center gap-1 shrink-0 ${
                              isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700 border border-purple-200'
                            }`}
                            title={`Active branch: ${activeBranch}`}
                          >
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            <GitBranch size={9} className="text-purple-400 shrink-0" />
                            <span className="truncate max-w-[80px]">{activeBranch}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {repo.private ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                            <Lock size={9} /> Private
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-0.5">
                            <Globe size={9} /> Public
                          </span>
                        )}

                        <span className="p-1 rounded text-zinc-400 group-hover:text-purple-400 transition-colors">
                          <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {repo.description && (
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mb-2">
                        {repo.description}
                      </p>
                    )}

                    {/* Footer Row */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-white/[0.04]">
                      <div className="flex items-center gap-2.5">
                        {repo.language && (
                          <span className="flex items-center gap-1 text-zinc-400">
                            <span className={`w-1.5 h-1.5 rounded-full ${langColor}`} />
                            <span>{repo.language}</span>
                          </span>
                        )}

                        {(repo.stargazers_count !== undefined && repo.stargazers_count > 0) && (
                          <span className="flex items-center gap-0.5 text-zinc-400">
                            <Star size={10} className="text-amber-400 fill-amber-400" />
                            <span>{repo.stargazers_count}</span>
                          </span>
                        )}
                      </div>

                      <span className="flex items-center gap-1 font-mono text-[9px] text-zinc-400">
                        <GitBranch size={9} />
                        <span>{repo.default_branch}</span>
                      </span>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-purple-400 group-hover:underline">
                      <span>Click to explore files</span>
                      <span>&rarr;</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* 3. TAB B: FOLDER-VIEW FILE EXPLORER TREE & CONTENT VIEWER */}
      {activeTab === 'files' && currentSelectedRepo && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Active Repository Card & Branch Selector */}
          <div className={`p-3 border-b shrink-0 ${
            isDark ? 'bg-purple-950/20 border-white/[0.08]' : 'bg-purple-50/70 border-zinc-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <FolderGit2 size={15} className="text-purple-400 shrink-0" />
                <span className={`text-xs font-bold truncate ${isDark ? 'text-purple-200' : 'text-purple-900'}`}>
                  {currentSelectedRepo.name}
                </span>

                {/* Branch Status Indicator right next to the repository name */}
                <span 
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border flex items-center gap-1 shrink-0 ${
                    isDark 
                      ? 'bg-purple-900/30 text-purple-300 border-purple-500/40 shadow-xs' 
                      : 'bg-purple-100 text-purple-800 border-purple-200 shadow-xs'
                  }`}
                  title={`Currently active branch: ${activeBranch}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <GitBranch size={10} className="text-purple-400 shrink-0" />
                  <span className="truncate max-w-[120px]">{activeBranch}</span>
                </span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                currentSelectedRepo.private ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              }`}>
                {currentSelectedRepo.private ? 'Private' : 'Public'}
              </span>
            </div>

            {/* Branch Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                className={`w-full px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-xs font-mono font-medium transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-zinc-900/90 hover:bg-zinc-800 border-white/10 text-zinc-100 hover:border-purple-500/50 shadow-sm' 
                    : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-900 hover:border-purple-400 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <GitBranch size={13} className="text-purple-400 shrink-0" />
                  <span className="truncate">{activeBranch}</span>
                  {activeBranch === currentSelectedRepo.default_branch && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-sans font-semibold">
                      default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 text-zinc-400">
                  {isLoadingBranches ? (
                    <RefreshCw size={12} className="animate-spin text-purple-400" />
                  ) : (
                    <ChevronDown size={13} className={`transition-transform duration-200 ${isBranchDropdownOpen ? 'rotate-180 text-purple-400' : ''}`} />
                  )}
                </div>
              </button>

              {/* Branch Dropdown Overlay */}
              {isBranchDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsBranchDropdownOpen(false)} 
                  />
                  <div className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
                    isDark ? 'bg-[#101020] border-white/20 text-zinc-100 shadow-black/90' : 'bg-white border-zinc-300 text-zinc-900 shadow-xl'
                  }`}>
                    <div className={`p-2 border-b flex items-center justify-between text-[11px] font-bold ${
                      isDark ? 'border-white/10 bg-black/40 text-zinc-300' : 'border-zinc-100 bg-zinc-50 text-zinc-700'
                    }`}>
                      <span>Select Branch ({branches.length})</span>
                      <button type="button" onClick={() => setIsBranchDropdownOpen(false)} className="text-zinc-400 hover:text-white">
                        <X size={12} />
                      </button>
                    </div>

                    <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5 hide-scrollbar">
                      {branches.map((bName) => (
                        <div
                          key={bName}
                          onClick={() => handleSwitchBranch(bName)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center justify-between cursor-pointer transition-all ${
                            bName === activeBranch 
                              ? 'bg-purple-600 text-white font-semibold' 
                              : isDark ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-purple-50 text-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <GitBranch size={12} className={bName === activeBranch ? 'text-white' : 'text-purple-400'} />
                            <span className="truncate">{bName}</span>
                          </div>
                          {bName === activeBranch && <Check size={13} className="text-white shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* If file is currently open for viewing: display IN-SIDEBAR FILE VIEWER */}
          {activeFileItem ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* File Viewer Toolbar */}
              <div className={`px-3 py-2 border-b flex items-center justify-between gap-2 shrink-0 ${
                isDark ? 'border-white/[0.08] bg-zinc-950/60' : 'border-zinc-200 bg-zinc-100/70'
              }`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFileItem(null);
                      setFileContent('');
                    }}
                    title="Back to file list"
                    className="p-1 rounded-lg hover:bg-white/10 text-purple-400 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  {getFileIcon(activeFileItem.name)}
                  <span className="text-xs font-mono font-semibold truncate text-zinc-200">
                    {activeFileItem.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    title="Copy File Content"
                    className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedCode ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                  </button>

                  {onSendCodeToAI && (
                    <button
                      type="button"
                      onClick={() => onSendCodeToAI(fileContent, activeFileItem.name)}
                      title="Send code to Jaalix AI Prompt"
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Code2 size={11} />
                      <span>Send to AI</span>
                    </button>
                  )}
                </div>
              </div>

              {/* File Path & Metadata Tag */}
              <div className={`px-3 py-1.5 border-b text-[10px] font-mono flex items-center justify-between shrink-0 ${
                isDark ? 'border-white/5 bg-black/20 text-zinc-400' : 'border-zinc-200/60 bg-zinc-50 text-zinc-500'
              }`}>
                <span className="truncate">{activeFileItem.path}</span>
                <span>{activeFileItem.size ? `${(activeFileItem.size / 1024).toFixed(1)} KB` : 'text file'}</span>
              </div>

              {/* Code Content Scrollable Box */}
              <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed hide-scrollbar bg-black/30">
                {isLoadingFile ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-400 gap-2">
                    <RefreshCw size={18} className="animate-spin text-purple-400" />
                    <span className="text-xs font-sans">Reading file content...</span>
                  </div>
                ) : fileError ? (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-sans">
                    <p className="font-bold mb-1">Failed to read file</p>
                    <p className="text-[11px]">{fileError}</p>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap break-all text-zinc-300 font-mono select-text">
                    {fileContent}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            // Folder Tree Directory View
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Breadcrumb Path Bar */}
              <div className={`px-3 py-2 border-b flex items-center justify-between text-xs font-mono shrink-0 ${
                isDark ? 'border-white/5 bg-black/30 text-zinc-300' : 'border-zinc-200 bg-zinc-100 text-zinc-700'
              }`}>
                <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar whitespace-nowrap min-w-0">
                  <button
                    type="button"
                    onClick={() => handleNavigateBreadcrumb(-1)}
                    className={`hover:text-purple-400 transition-colors cursor-pointer font-bold ${
                      currentPath === '' ? 'text-purple-400' : 'text-zinc-400'
                    }`}
                  >
                    root
                  </button>

                  {breadcrumbParts.map((part, idx) => (
                    <React.Fragment key={idx}>
                      <span className="text-zinc-500">/</span>
                      <button
                        type="button"
                        onClick={() => handleNavigateBreadcrumb(idx)}
                        className={`hover:text-purple-400 transition-colors cursor-pointer truncate max-w-[90px] ${
                          idx === breadcrumbParts.length - 1 ? 'text-purple-300 font-bold' : 'text-zinc-400'
                        }`}
                      >
                        {part}
                      </button>
                    </React.Fragment>
                  ))}
                </div>

                {currentPath !== '' && (
                  <button
                    type="button"
                    onClick={() => {
                      const parent = breadcrumbParts.slice(0, -1).join('/');
                      loadFolder(parent);
                    }}
                    title="Go Up One Directory"
                    className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-1"
                  >
                    <ChevronLeft size={14} />
                  </button>
                )}
              </div>

              {/* Tree Quick Filter Input */}
              <div className="p-2 border-b border-white/[0.04] shrink-0">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    value={treeSearch}
                    onChange={(e) => setTreeSearch(e.target.value)}
                    placeholder="Filter files in directory..."
                    className={`w-full pl-7 pr-6 py-1 rounded-lg text-[11px] border outline-none font-mono ${
                      isDark 
                        ? 'bg-black/40 border-white/10 text-white placeholder-zinc-500 focus:border-purple-500' 
                        : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-purple-500'
                    }`}
                  />
                  {treeSearch && (
                    <button
                      type="button"
                      onClick={() => setTreeSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* Directory Items List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
                {isLoadingTree ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-400 gap-2">
                    <RefreshCw size={18} className="animate-spin text-purple-400" />
                    <span className="text-xs">Loading directory contents...</span>
                  </div>
                ) : treeError ? (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    <p className="font-bold mb-1">Failed to load directory</p>
                    <p className="text-[11px] mb-2">{treeError}</p>
                    <button
                      type="button"
                      onClick={() => loadFolder(currentPath)}
                      className="px-2.5 py-1 rounded bg-red-500/20 text-white font-semibold text-[10px]"
                    >
                      Retry
                    </button>
                  </div>
                ) : filteredTreeItems.length === 0 ? (
                  <div className="py-10 text-center text-zinc-500 text-xs">
                    {treeSearch ? `No items matching "${treeSearch}"` : 'This directory is empty.'}
                  </div>
                ) : (
                  filteredTreeItems.map((item) => {
                    const isDirectory = item.type === 'dir';

                    return (
                      <div
                        key={item.path}
                        onClick={() => {
                          if (isDirectory) {
                            loadFolder(item.path);
                          } else {
                            handleOpenFile(item);
                          }
                        }}
                        className={`px-2.5 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all border ${
                          isDark 
                            ? 'bg-zinc-900/40 hover:bg-zinc-800/80 border-white/[0.04] hover:border-purple-500/30' 
                            : 'bg-white hover:bg-purple-50/60 border-zinc-200/80 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isDirectory ? (
                            <Folder size={14} className="text-amber-400 shrink-0" />
                          ) : (
                            getFileIcon(item.name)
                          )}
                          <span className={`font-mono truncate ${
                            isDirectory ? 'font-bold text-zinc-200' : 'text-zinc-300'
                          }`}>
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 text-zinc-500 text-[10px]">
                          {isDirectory ? (
                            <ChevronRight size={13} className="text-zinc-400" />
                          ) : (
                            <span>{item.size ? `${(item.size / 1024).toFixed(1)}k` : ''}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB C: PULL REQUESTS EXPLORER VIEW */}
      {activeTab === 'prs' && currentSelectedRepo && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Active Repository Card Banner */}
          <div className={`p-3 border-b shrink-0 ${
            isDark ? 'bg-purple-950/20 border-white/[0.08]' : 'bg-purple-50/70 border-zinc-200'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <GitPullRequest size={15} className="text-purple-400 shrink-0" />
                <span className={`text-xs font-bold truncate ${isDark ? 'text-purple-200' : 'text-purple-900'}`}>
                  {currentSelectedRepo.name}
                </span>

                {/* Branch Status Indicator right next to repo name */}
                <span 
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border flex items-center gap-1 shrink-0 ${
                    isDark 
                      ? 'bg-purple-900/30 text-purple-300 border-purple-500/40 shadow-xs' 
                      : 'bg-purple-100 text-purple-800 border-purple-200 shadow-xs'
                  }`}
                  title={`Active Context Branch: ${activeBranch}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <GitBranch size={10} className="text-purple-400 shrink-0" />
                  <span className="truncate max-w-[120px]">{activeBranch}</span>
                </span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                currentSelectedRepo.private ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              }`}>
                {currentSelectedRepo.private ? 'Private' : 'Public'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Active pull requests and code review status for this repository
            </p>
          </div>

          {/* PR Search & Status Filters */}
          <div className={`p-3 border-b shrink-0 ${
            isDark ? 'border-white/[0.06] bg-[#0c0c16]/70' : 'border-zinc-200/90 bg-zinc-50/90'
          }`}>
            {/* PR Search bar */}
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-3 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={prSearchQuery}
                onChange={(e) => setPrSearchQuery(e.target.value)}
                placeholder="Search PR by title, author, #..."
                className={`w-full pl-8 pr-7 py-1.5 rounded-xl text-xs border outline-none font-medium transition-all ${
                  isDark 
                    ? 'bg-black/40 border-white/10 text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30' 
                    : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-purple-500'
                }`}
              />
              {prSearchQuery && (
                <button
                  type="button"
                  onClick={() => setPrSearchQuery('')}
                  className="absolute right-2.5 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center justify-between gap-1 mt-2 text-[10px]">
              <div className={`flex rounded-lg p-0.5 border font-semibold ${
                isDark ? 'bg-black/20 border-white/5' : 'bg-zinc-100 border-zinc-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setPrFilterState('all')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    prFilterState === 'all' 
                      ? 'bg-purple-600 text-white shadow-xs' 
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  All ({pullRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPrFilterState('open')}
                  className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    prFilterState === 'open' 
                      ? 'bg-purple-600 text-white shadow-xs' 
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <GitPullRequest size={10} className="text-emerald-400" />
                  <span>Open ({pullRequests.filter(p => p.state === 'open' && !p.draft).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrFilterState('draft')}
                  className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    prFilterState === 'draft' 
                      ? 'bg-purple-600 text-white shadow-xs' 
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span>Draft ({pullRequests.filter(p => p.draft).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrFilterState('closed')}
                  className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    prFilterState === 'closed' 
                      ? 'bg-purple-600 text-white shadow-xs' 
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span>Closed ({pullRequests.filter(p => p.state === 'closed' || Boolean(p.merged_at)).length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pull Requests List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 hide-scrollbar">
            {isLoadingPRs ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-400 gap-2">
                <RefreshCw size={18} className="animate-spin text-purple-400" />
                <span className="text-xs">Fetching active pull requests...</span>
              </div>
            ) : prError ? (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <AlertCircle size={14} /> Error Loading Pull Requests
                </div>
                <p className="leading-relaxed mb-2 text-[11px]">{prError}</p>
                <button
                  type="button"
                  onClick={() => fetchPullRequests(currentSelectedRepo)}
                  className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-white font-semibold text-[10px] cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : filteredPRs.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-400 text-xs gap-2">
                <GitPullRequest size={24} className="text-zinc-500" />
                <p className={`font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>No pull requests found</p>
                <p className="text-[11px] text-zinc-500">
                  {prSearchQuery ? `No PRs matching "${prSearchQuery}"` : 'There are no active pull requests in this repository.'}
                </p>
                {prSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPrSearchQuery('')}
                    className="mt-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              filteredPRs.map((pr) => (
                <div
                  key={pr.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                    isDark 
                      ? 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/[0.06] hover:border-purple-500/30' 
                      : 'bg-white hover:bg-purple-50/50 border-zinc-200/90 hover:border-purple-300 shadow-xs'
                  }`}
                >
                  {/* Top Header: PR Number, Title, Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex items-start gap-1.5">
                      <span className="font-mono text-xs font-bold text-purple-400 shrink-0 mt-0.5">
                        #{pr.number}
                      </span>
                      <h4 className={`text-xs font-bold line-clamp-2 leading-snug ${
                        isDark ? 'text-zinc-100' : 'text-zinc-800'
                      }`}>
                        {pr.title}
                      </h4>
                    </div>
                    {renderPRStatus(pr)}
                  </div>

                  {/* Branches Row: head -> base */}
                  <div className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-lg border truncate ${
                    isDark ? 'bg-black/25 border-white/5 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                  }`}>
                    <GitBranch size={10} className="text-purple-400 shrink-0" />
                    <span className={`font-semibold truncate ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{pr.head.ref}</span>
                    <span className={isDark ? 'text-zinc-600 shrink-0' : 'text-zinc-400 shrink-0'}>&rarr;</span>
                    <span className="truncate">{pr.base.ref}</span>
                  </div>

                  {/* Description if present */}
                  {pr.body && (
                    <p className={`text-[11px] line-clamp-2 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {pr.body}
                    </p>
                  )}

                  {/* Labels List */}
                  {pr.labels && pr.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {pr.labels.map((lbl) => (
                        <span
                          key={lbl.id}
                          className="px-1.5 py-0.2 rounded-md text-[9px] font-medium"
                          style={{
                            backgroundColor: `#${lbl.color}20`,
                            color: isDark ? `#${lbl.color}` : '#333333',
                            border: `1px solid #${lbl.color}40`
                          }}
                        >
                          {lbl.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer Row: Author, Timestamp, Actions */}
                  <div className={`pt-2 border-t flex items-center justify-between text-[10px] ${
                    isDark ? 'border-white/[0.04] text-zinc-500' : 'border-zinc-100 text-zinc-500'
                  }`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {pr.user.avatar_url ? (
                        <img 
                          src={pr.user.avatar_url} 
                          alt={pr.user.login} 
                          className="w-4 h-4 rounded-full border border-purple-500/30"
                        />
                      ) : (
                        <User size={12} className="text-zinc-400" />
                      )}
                      <span className={`truncate font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-700'}`}>@{pr.user.login}</span>
                      <span className="text-zinc-500">·</span>
                      <span className="shrink-0">{getRelativeTime(pr.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* 1-Click Switch Branch to test PR code */}
                      <button
                        type="button"
                        onClick={() => handleSwitchBranch(pr.head.ref)}
                        title={`Switch workspace to branch "${pr.head.ref}" to review PR code`}
                        className={`px-2 py-1 rounded-lg transition-colors font-semibold flex items-center gap-1 cursor-pointer ${
                          isDark 
                            ? 'bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white' 
                            : 'bg-purple-100 hover:bg-purple-600 text-purple-700 hover:text-white'
                        }`}
                      >
                        <GitBranch size={10} />
                        <span>Checkout</span>
                      </button>

                      {/* Direct link to PR on GitHub */}
                      <a
                        href={pr.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open Pull Request on GitHub"
                        className={`p-1 rounded-lg transition-colors ${
                          isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                        }`}
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
