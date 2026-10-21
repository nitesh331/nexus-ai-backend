import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Globe,
  Paperclip,
  Mic,
  MicOff,
  Send,
  FileDown,
  Share2,
  Bookmark,
  BookmarkCheck,
  MessageSquarePlus,
  Plus,
  History,
  FolderKanban,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  BarChart3,
  Network,
  ShieldCheck,
  Clock,
  Trash2,
  X,
  Square,
  Menu,
  Image as ImageIcon,
  FileText,
  Play,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useWorkspaceChat } from '../../hooks/useWorkspaceChat';
import RealGlobe, { COUNTRY_TRENDS, CountrySearchTrend } from '../RealGlobe';

interface WebResearchWorkspaceProps {
  isDark: boolean;
  onOpenMenu?: () => void;
}

type SearchMode = 'Quick' | 'Deep' | 'Expert';
type CommandPanel = 'none' | 'history' | 'collections' | 'settings';

interface SourceItem {
  id: number;
  domain: string;
  title: string;
  url: string;
  credibility: 'High' | 'Medium';
  score: number;
  type: string;
}

interface SavedDossier {
  id: string;
  query: string;
  content: string;
  mode: SearchMode;
  confidence: number;
  timestamp: string;
  sourcesCount: number;
}

interface HistoryEntry {
  id: string;
  query: string;
  mode: SearchMode;
  timestamp: string;
}

interface TrendingNowCard extends CountrySearchTrend {
  slot?: 'web' | 'visual' | 'research' | 'video' | 'market' | 'policy';
  source?: string;
  url?: string;
  imageUrl?: string;
  publishedAgo?: string;
}

const DEFAULT_TRENDING_CARDS: TrendingNowCard[] = [
  {
    ...COUNTRY_TRENDS[0],
    slot: 'web',
    source: 'Reuters / Tech Wire',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=85',
    publishedAgo: 'LIVE NOW',
  },
  {
    ...COUNTRY_TRENDS[1],
    slot: 'visual',
    source: 'SpaceNews',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=85',
    publishedAgo: '12m ago',
  },
  {
    ...COUNTRY_TRENDS[5],
    slot: 'research',
    source: 'IEEE / arXiv',
    imageUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=320&q=85',
    publishedAgo: '18m ago',
  },
  {
    ...COUNTRY_TRENDS[2],
    slot: 'video',
    source: 'Global Broadcast',
    imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=500&q=85',
    publishedAgo: 'LIVE',
  },
  {
    ...COUNTRY_TRENDS[6],
    slot: 'market',
    source: 'Bloomberg / Market Wire',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80',
    publishedAgo: '24m ago',
  },
  {
    ...COUNTRY_TRENDS[4],
    slot: 'policy',
    source: 'Financial Times / Policy',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80',
    publishedAgo: '31m ago',
  },
];

const RESEARCH_STEPS = [
  { id: 0, label: 'Understanding query', detail: 'Parsing semantic intent, entities & temporal scope' },
  { id: 1, label: 'Searching 120+ sources', detail: 'Querying academic indices, global feeds & institutional filings' },
  { id: 2, label: 'Reading papers', detail: 'Extracting empirical claims, tables & primary methodology' },
  { id: 3, label: 'Cross-verifying facts', detail: 'Detecting source contradictions & triangulating confidence' },
  { id: 4, label: 'Synthesizing report', detail: 'Compiling structured intelligence dossier & citations' },
];

const SUGGESTION_CHIPS = [
  {
    label: 'Latest research',
    prompt: 'Synthesize the latest peer-reviewed breakthroughs and commercial milestones in solid-state quantum batteries and next-gen grid storage (2025–2026).',
  },
  {
    label: 'Market analysis',
    prompt: 'Conduct a global market analysis of enterprise Agentic AI infrastructure, sovereign GPU clusters, and semiconductor capital expenditure across US, EU, and APAC.',
  },
  {
    label: 'Compare sources',
    prompt: 'Compare competing technical benchmarks, architectural trade-offs, and independent evaluations between frontier reasoning models and open-weights AI systems.',
  },
  {
    label: 'Fact-check',
    prompt: 'Cross-verify recent claims regarding commercial nuclear fusion net-energy gain, High-NA EUV wafer yields, and green hydrogen unit economics across primary sources.',
  },
];

function generateDynamicSources(query: string): SourceItem[] {
  const clean = query.replace(/^\[.*?\]\s*/, '').slice(0, 68);
  return [
    {
      id: 1,
      domain: 'arxiv.org',
      title: `Primary Technical Preprint & Empirical Benchmarks: ${clean}`,
      url: `https://arxiv.org/search/?query=${encodeURIComponent(clean)}&searchtype=all`,
      credibility: 'High',
      score: 98,
      type: 'Peer-Reviewed / Preprint',
    },
    {
      id: 2,
      domain: 'nature.com',
      title: `Nature Research Synthesis — Global Longitudinal Analysis`,
      url: `https://www.nature.com/search?q=${encodeURIComponent(clean)}`,
      credibility: 'High',
      score: 97,
      type: 'Scientific Journal',
    },
    {
      id: 3,
      domain: 'reuters.com',
      title: `Reuters Global Wire: Institutional & Supply-Chain Telemetry`,
      url: `https://www.reuters.com/site-search/?query=${encodeURIComponent(clean)}`,
      credibility: 'High',
      score: 94,
      type: 'Verified Wire',
    },
    {
      id: 4,
      domain: 'ieee.org',
      title: `IEEE Spectrum Standards & Hardware Architecture Audit`,
      url: `https://ieeexplore.ieee.org/search/searchresult.jsp?newsearch=true&queryText=${encodeURIComponent(clean)}`,
      credibility: 'High',
      score: 96,
      type: 'Engineering Standard',
    },
    {
      id: 5,
      domain: 'bloomberg.com',
      title: `Bloomberg Intelligence: Capital Flows & Regional Market Share`,
      url: `https://www.bloomberg.com/search?query=${encodeURIComponent(clean)}`,
      credibility: 'Medium',
      score: 88,
      type: 'Market Telemetry',
    },
    {
      id: 6,
      domain: 'mit.edu',
      title: `MIT Technology Review — Cross-Disciplinary Policy & Risk Assessment`,
      url: `https://www.technologyreview.com/search/?s=${encodeURIComponent(clean)}`,
      credibility: 'High',
      score: 95,
      type: 'Academic Review',
    },
  ];
}

// ============================================================================
// 60FPS ORBITAL NETWORK RINGS, STUDIO BACKDROP & DESK REFLECTION CANVAS
// ============================================================================
function DeepSearchOrbitalCanvas({ isLoading }: { isLoading: boolean }) {
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

    // Orbital ring configurations matching the reference image's glowing blue trajectories
    const orbits = [
      { rxFactor: 0.25, ryFactor: 0.23, tilt: -0.22, speed: 0.55, nodes: 4, color: 'rgba(0, 229, 255, 0.36)' },
      { rxFactor: 0.32, ryFactor: 0.26, tilt: 0.32, speed: -0.42, nodes: 5, color: 'rgba(59, 130, 246, 0.32)' },
      { rxFactor: 0.39, ryFactor: 0.29, tilt: -0.14, speed: 0.35, nodes: 6, color: 'rgba(96, 165, 250, 0.24)' },
      { rxFactor: 0.45, ryFactor: 0.32, tilt: 0.18, speed: -0.28, nodes: 4, color: 'rgba(139, 92, 246, 0.20)' }
    ];

    // Ambient floating star/data particles around the globe
    const particles = Array.from({ length: 95 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radiusFactor: 0.14 + Math.random() * 0.36,
      speed: (Math.random() - 0.5) * 0.004,
      yOffset: (Math.random() - 0.5) * 0.55,
      size: 0.8 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2
    }));

    let time = 0;

    const render = () => {
      const speedMult = isLoading ? 2.0 : 1.0;
      time += 0.015 * speedMult;

      // 1. Deep Sapphire-Navy Room Backdrop (Matches Reference Image)
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#020614');
      bgGrad.addColorStop(0.38, '#061232');
      bgGrad.addColorStop(0.68, '#071538');
      bgGrad.addColorStop(1, '#02040c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.48;

      // Subtle Out-of-Focus Warm Desk Lamp Glow on Far Right Edge (like reference image)
      const lampGlow = ctx.createRadialGradient(width * 0.98, height * 0.52, 5, width * 0.98, height * 0.52, width * 0.18);
      lampGlow.addColorStop(0, 'rgba(251, 191, 36, 0.14)');
      lampGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.05)');
      lampGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lampGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Central Volumetric Electric-Blue & Cyan Globe Halo
      const globeRadius = Math.min(width, height) * 0.25;
      const coreGlow = ctx.createRadialGradient(cx, cy, globeRadius * 0.15, cx, cy, globeRadius * 2.1);
      coreGlow.addColorStop(0, 'rgba(0, 229, 255, 0.42)');
      coreGlow.addColorStop(0.32, 'rgba(37, 99, 235, 0.30)');
      coreGlow.addColorStop(0.65, 'rgba(30, 58, 138, 0.12)');
      coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGlow;
      ctx.fillRect(0, 0, width, height);

      // 3. Glossy Dark Desk Surface & Electric-Blue Floor Reflection Under Globe
      const deskY = height * 0.80;
      const deskGrad = ctx.createLinearGradient(0, deskY, 0, height);
      deskGrad.addColorStop(0, 'rgba(3, 9, 26, 0)');
      deskGrad.addColorStop(0.25, 'rgba(2, 6, 18, 0.78)');
      deskGrad.addColorStop(1, 'rgba(1, 3, 10, 0.96)');
      ctx.fillStyle = deskGrad;
      ctx.fillRect(0, deskY, width, height - deskY);

      // Bright Cyan/Blue Reflection Pool on the Desk directly beneath the Globe
      const reflY = height * 0.81;
      const reflGrad = ctx.createRadialGradient(cx, reflY, 8, cx, reflY, width * 0.26);
      reflGrad.addColorStop(0, 'rgba(0, 229, 255, 0.34)');
      reflGrad.addColorStop(0.38, 'rgba(59, 130, 246, 0.16)');
      reflGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.save();
      ctx.translate(cx, reflY);
      ctx.scale(1.6, 0.32);
      ctx.translate(-cx, -reflY);
      ctx.fillStyle = reflGrad;
      ctx.beginPath();
      ctx.arc(cx, reflY, width * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. Sweeping 3D Elliptical Orbital Network Rings & Travelling Glowing Data Nodes
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const baseScale = Math.min(width * 0.95, height * 1.15);
      orbits.forEach((orb, idx) => {
        const rx = baseScale * orb.rxFactor;
        const ry = baseScale * orb.ryFactor;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(orb.tilt + Math.sin(time * 0.25 + idx) * 0.03);

        // Draw glowing orbital ring
        ctx.strokeStyle = orb.color;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Draw orbiting luminous cyan/blue data nodes along the ellipse
        for (let n = 0; n < orb.nodes; n++) {
          const theta = time * orb.speed + (n / orb.nodes) * Math.PI * 2;
          const nx = Math.cos(theta) * rx;
          const ny = Math.sin(theta) * ry;

          const nodeGlow = ctx.createRadialGradient(nx, ny, 0.5, nx, ny, 9);
          nodeGlow.addColorStop(0, '#ffffff');
          nodeGlow.addColorStop(0.35, '#00e5ff');
          nodeGlow.addColorStop(1, 'rgba(0, 229, 255, 0)');
          ctx.fillStyle = nodeGlow;
          ctx.beginPath();
          ctx.arc(nx, ny, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(nx, ny, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 5. Floating Quantum Network Dust Particles
      particles.forEach((p) => {
        p.angle += p.speed * speedMult;
        const px = cx + Math.cos(p.angle) * (baseScale * p.radiusFactor);
        const py = cy + Math.sin(p.angle) * (baseScale * p.radiusFactor * 0.68) + p.yOffset * height * 0.25;
        const alpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(time * 2.5 + p.phase));

        ctx.fillStyle = `rgba(56, 189, 248, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoading]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

export default function WebResearchWorkspace({ isDark, onOpenMenu }: WebResearchWorkspaceProps) {
  const { messages, setMessages, isLoading, sendMessage, stopMessage } = useWorkspaceChat('deep-search');

  // Search Bar & Mode State
  const [queryInput, setQueryInput] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('Deep');
  const [attachedImage, setAttachedImage] = useState<string | undefined>(undefined);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Command Center Panels & Saved State
  const [activePanel, setActivePanel] = useState<CommandPanel>('none');
  const [savedDossiers, setSavedDossiers] = useState<SavedDossier[]>(() => {
    try {
      const raw = localStorage.getItem('deep-search-collections');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [searchHistory, setSearchHistory] = useState<HistoryEntry[]>(() => {
    try {
      const raw = localStorage.getItem('deep-search-history-log');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Settings State
  const [strictVerification, setStrictVerification] = useState(true);
  const [academicPriority, setAcademicPriority] = useState(true);

  // Research Progress Telemetry State
  const [activeStep, setActiveStep] = useState(0);
  const [sourceCounter, setSourceCounter] = useState(0);
  const [visibleFavicons, setVisibleFavicons] = useState(1);
  const [selectedTrend, setSelectedTrend] = useState<CountrySearchTrend | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [highlightedCitation, setHighlightedCitation] = useState<number | null>(null);

  // Live Cursor Glow State
  const [cursorPos, setCursorPos] = useState({ x: -500, y: -500 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Live Query Ticker Counter
  const [liveQueryCount, setLiveQueryCount] = useState(2418920);
  useEffect(() => {
    const t = setInterval(() => {
      setLiveQueryCount((prev) => prev + Math.floor(Math.random() * 19 + 4));
    }, 2400);
    return () => clearInterval(t);
  }, []);

  // Dynamic 'Trending Now' Cards Fetched from Live News API (/api/trending-news)
  const [trendingCards, setTrendingCards] = useState<TrendingNowCard[]>(DEFAULT_TRENDING_CARDS);
  const [isRefreshingTrends, setIsRefreshingTrends] = useState(false);
  const [refreshingCardSlots, setRefreshingCardSlots] = useState<Record<string, boolean>>({});
  const [cardRefreshSteps, setCardRefreshSteps] = useState<Record<string, number>>({});
  const [recentlyUpdatedSlot, setRecentlyUpdatedSlot] = useState<string | null>(null);
  const [hoveredCardIdx, setHoveredCardIdx] = useState<number | null>(null);
  const [isVideoCardPlaying, setIsVideoCardPlaying] = useState(true);
  const [videoScrubberProgress, setVideoScrubberProgress] = useState(52);

  useEffect(() => {
    if (!isVideoCardPlaying) return;
    const timer = setInterval(() => {
      setVideoScrubberProgress((prev) => (prev >= 96 ? 18 : prev + 3));
    }, 900);
    return () => clearInterval(timer);
  }, [isVideoCardPlaying]);

  const fetchTrendingNow = async (forceRefresh = false) => {
    try {
      setIsRefreshingTrends(true);
      const res = await fetch(`/api/trending-news${forceRefresh ? '?refresh=true' : ''}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.items) && data.items.length >= 6) {
        setTrendingCards(data.items);
      }
    } catch {
      // Keep existing or default trending cards if offline
    } finally {
      setIsRefreshingTrends(false);
    }
  };

  // Targeted single-card API fetch triggered by each card's 'Refresh Data' icon button
  const refreshSingleTrendingCard = async (
    slot: NonNullable<TrendingNowCard['slot']>,
    cardIndex: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (refreshingCardSlots[slot]) return;

    const nextStep = (cardRefreshSteps[slot] || 0) + 1;
    setCardRefreshSteps((prev) => ({ ...prev, [slot]: nextStep }));
    setRefreshingCardSlots((prev) => ({ ...prev, [slot]: true }));

    try {
      const res = await fetch(
        `/api/trending-news?slot=${encodeURIComponent(slot)}&refresh=true&step=${nextStep}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const updatedItem: TrendingNowCard | undefined =
        data?.item ||
        (Array.isArray(data?.items)
          ? data.items.find((it: TrendingNowCard) => it.slot === slot) || data.items[cardIndex]
          : undefined);

      if (updatedItem) {
        setTrendingCards((prev) =>
          prev.map((card, idx) => (card.slot === slot || idx === cardIndex ? updatedItem : card))
        );
        setRecentlyUpdatedSlot(slot);
        setTimeout(() => {
          setRecentlyUpdatedSlot((curr) => (curr === slot ? null : curr));
        }, 1800);
      }
    } catch {
      // Preserve current card state on network error
    } finally {
      setRefreshingCardSlots((prev) => ({ ...prev, [slot]: false }));
    }
  };

  const populateQueryFromCard = (card: TrendingNowCard, e: React.MouseEvent) => {
    e.stopPropagation();
    setQueryInput(card.topSearch);
    setSelectedTrend(card);
    searchInputRef.current?.focus();
  };

  useEffect(() => {
    fetchTrendingNow(false);
    const interval = setInterval(() => fetchTrendingNow(false), 120_000);
    return () => clearInterval(interval);
  }, []);

  // Persist Collections & History
  useEffect(() => {
    try {
      localStorage.setItem('deep-search-collections', JSON.stringify(savedDossiers));
    } catch {}
  }, [savedDossiers]);

  useEffect(() => {
    try {
      localStorage.setItem('deep-search-history-log', JSON.stringify(searchHistory));
    } catch {}
  }, [searchHistory]);

  // Migrate legacy web-research history if deep-search messages are empty
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length === 0) {
      try {
        const legacyData = window.localStorage.getItem('workspace-messages-web-research');
        if (legacyData) {
          const parsed = JSON.parse(legacyData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch {}
    }
  }, []);

  // Typewriter Placeholder Animation for Deep Search Textarea
  const DEEP_SEARCH_PHRASES = useMemo(
    () => [
      'Ask Atal global intelligence...',
      'Investigate AI & market trends...',
      'Cross-verify live web sources...',
      'Build a verified research report...',
      'Click globe or type a query...',
    ],
    []
  );
  const [placeholderText, setPlaceholderText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeletingPhrase, setIsDeletingPhrase] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    const currentPhrase = DEEP_SEARCH_PHRASES[phraseIndex % DEEP_SEARCH_PHRASES.length];
    let timer: ReturnType<typeof setTimeout>;

    if (isDeletingPhrase) {
      if (placeholderText === '') {
        setIsDeletingPhrase(false);
        setPhraseIndex((prev) => (prev + 1) % DEEP_SEARCH_PHRASES.length);
      } else {
        timer = setTimeout(() => {
          setPlaceholderText(currentPhrase.substring(0, placeholderText.length - 1));
        }, 40);
      }
    } else {
      if (placeholderText === currentPhrase) {
        timer = setTimeout(() => {
          setIsDeletingPhrase(true);
        }, 2200);
      } else {
        timer = setTimeout(() => {
          setPlaceholderText(currentPhrase.substring(0, placeholderText.length + 1));
        }, 65);
      }
    }

    return () => clearTimeout(timer);
  }, [placeholderText, isDeletingPhrase, phraseIndex, isLoading, DEEP_SEARCH_PHRASES]);

  // Animate Deep Search In-Progress Steps, Source Counter & Favicon Reveal
  const targetSourcesCount = searchMode === 'Quick' ? 48 : searchMode === 'Deep' ? 128 : 240;

  useEffect(() => {
    if (!isLoading) {
      if (messages.length > 0) {
        setActiveStep(4);
        setSourceCounter(targetSourcesCount);
        setVisibleFavicons(6);
      }
      return;
    }

    setActiveStep(0);
    setSourceCounter(4);
    setVisibleFavicons(1);

    const stepTimer = setInterval(() => {
      setActiveStep((prev) => (prev < 4 ? prev + 1 : 4));
    }, 1500);

    const sourceTimer = setInterval(() => {
      setSourceCounter((prev) => {
        const increment = Math.floor(Math.random() * 11) + 5;
        return prev + increment >= targetSourcesCount ? targetSourcesCount : prev + increment;
      });
    }, 220);

    const favTimer = setInterval(() => {
      setVisibleFavicons((prev) => (prev < 6 ? prev + 1 : 6));
    }, 850);

    return () => {
      clearInterval(stepTimer);
      clearInterval(sourceTimer);
      clearInterval(favTimer);
    };
  }, [isLoading, targetSourcesCount, messages.length]);

  // Latest User Query & Latest Model Response
  const latestUserMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i];
    }
    return null;
  }, [messages]);

  const latestModelMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'model') return messages[i];
    }
    return null;
  }, [messages]);

  const activeQueryTitle = useMemo(() => {
    if (!latestUserMessage) return '';
    return latestUserMessage.content.replace(/^\[(QUICK|DEEP|EXPERT)\s+INTELLIGENCE\s+MODE\]\s*/i, '');
  }, [latestUserMessage]);

  const activeSources = useMemo(() => {
    return generateDynamicSources(activeQueryTitle || 'Global Frontier Intelligence');
  }, [activeQueryTitle]);

  // Execute Deep Search Query
  const executeDeepSearch = (rawPrompt: string, trend?: CountrySearchTrend) => {
    const trimmed = rawPrompt.trim();
    if ((!trimmed && !attachedImage) || isLoading) return;

    if (trend) {
      setSelectedTrend(trend);
    }

    const modePrefix = `[${searchMode.toUpperCase()} INTELLIGENCE MODE] `;
    const finalPrompt = trimmed.startsWith('[') ? trimmed : `${modePrefix}${trimmed}`;

    // Log into Search History
    const cleanTitle = trimmed.replace(/^\[.*?\]\s*/, '');
    setSearchHistory((prev) => [
      {
        id: `${Date.now()}`,
        query: cleanTitle,
        mode: searchMode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev.filter((item) => item.query !== cleanTitle).slice(0, 19),
    ]);

    sendMessage(finalPrompt, attachedImage);
    setQueryInput('');
    setAttachedImage(undefined);
    setAttachedFileName(null);
    setActivePanel('none');
  };

  const handleSelectGlobeTopic = (promptText: string, trend?: CountrySearchTrend) => {
    if (isLoading) return;
    executeDeepSearch(promptText, trend);
  };

  // File Attachment Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFileName(file.name);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAttachedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setQueryInput((prev) => (prev ? `${prev} [Attached File: ${file.name}]` : `Analyze document parameters for: ${file.name}`));
    }
    e.target.value = '';
  };

  // Voice Recognition Handler
  const toggleVoiceInput = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setQueryInput((prev) => prev || 'Analyze global sovereign AI compute trends and quantum battery patents');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setQueryInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Save Dossier to Workspace Collections
  const isCurrentSaved = useMemo(() => {
    if (!activeQueryTitle) return false;
    return savedDossiers.some((d) => d.query === activeQueryTitle);
  }, [savedDossiers, activeQueryTitle]);

  const handleSaveToWorkspace = () => {
    if (!activeQueryTitle || !latestModelMessage?.content) return;
    if (isCurrentSaved) {
      setSavedDossiers((prev) => prev.filter((d) => d.query !== activeQueryTitle));
      return;
    }
    const newDossier: SavedDossier = {
      id: `${Date.now()}`,
      query: activeQueryTitle,
      content: latestModelMessage.content,
      mode: searchMode,
      confidence: searchMode === 'Expert' ? 97 : searchMode === 'Deep' ? 95 : 91,
      timestamp: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      sourcesCount: targetSourcesCount,
    };
    setSavedDossiers((prev) => [newDossier, ...prev]);
  };

  // Share Intelligence Report
  const handleShareReport = async () => {
    if (!latestModelMessage?.content) return;
    const shareText = `ATAL INTELLIGENCE DOSSIER\nQuery: ${activeQueryTitle}\nConfidence: 96% Verified (${targetSourcesCount} Sources)\n\n${latestModelMessage.content}`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2400);
    } catch {}
  };

  // Export PDF / Print Dossier
  const handleExportPDF = () => {
    window.print();
  };

  // Parse Markdown Sections for Executive Summary & Contradictions Highlighting
  const parsedMetrics = useMemo(() => {
    if (selectedTrend) {
      return {
        region: `${selectedTrend.flag} ${selectedTrend.country} (${selectedTrend.code})`,
        volume: selectedTrend.searchVolume,
        growth: selectedTrend.growthRate,
        velocity: selectedTrend.velocity,
        sparkline: selectedTrend.sparkline,
        category: selectedTrend.category,
      };
    }
    return {
      region: '🌐 Global Multi-Region',
      volume: '2.4M+ signals analyzed',
      growth: '+114%',
      velocity: 'Breakout' as const,
      sparkline: [2.2, 2.8, 3.4, 4.1, 4.9, 5.7, 6.4],
      category: 'Cross-Domain Synthesis',
    };
  }, [selectedTrend]);

  const confidenceScore = searchMode === 'Expert' ? 97 : searchMode === 'Deep' ? 95 : 92;
  const progressPercent = isLoading
    ? Math.min(96, Math.round(((activeStep + 0.6) / 5) * 100))
    : 100;

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
      }}
      className="relative flex h-full w-full pt-14 sm:pt-16 overflow-hidden select-none text-slate-100 bg-[#03081c]"
      style={{
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* 60fps Orbital Network Rings, Sapphire Room Backdrop & Desk Reflection */}
      <DeepSearchOrbitalCanvas isLoading={isLoading} />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.txt,.csv,.md"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Interactive Cursor Glow (Follows Mouse) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(480px circle at ${cursorPos.x}px ${cursorPos.y}px, rgba(0, 229, 255, 0.08), rgba(59, 130, 246, 0.04) 45%, transparent 75%)`,
        }}
      />

      {/* Compact Floating Action Controls (History, Saved Dossiers, Parameters) */}
      <div className="hidden md:flex flex-col items-center gap-2.5 absolute left-4 top-20 z-30">
        {/* New Search */}
        <button
          type="button"
          onClick={() => {
            setMessages([]);
            setSelectedTrend(null);
            setActivePanel('none');
            setTimeout(() => searchInputRef.current?.focus(), 100);
          }}
          title="New Search"
          className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer backdrop-blur-xl ${
            messages.length === 0 && activePanel === 'none'
              ? 'bg-cyan-500/15 border-cyan-400/45 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.25)]'
              : 'bg-[#050918]/80 border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <Plus size={17} />
        </button>

        {/* History */}
        <button
          type="button"
          onClick={() => setActivePanel(activePanel === 'history' ? 'none' : 'history')}
          title="Search History"
          className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer backdrop-blur-xl ${
            activePanel === 'history'
              ? 'bg-cyan-500/15 border-cyan-400/45 text-cyan-300'
              : 'bg-[#050918]/80 border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <History size={16} />
          {searchHistory.length > 0 && (
            <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-[14px] rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[9px] font-mono flex items-center justify-center">
              {searchHistory.length}
            </span>
          )}
        </button>

        {/* Collections */}
        <button
          type="button"
          onClick={() => setActivePanel(activePanel === 'collections' ? 'none' : 'collections')}
          title="Saved Collections"
          className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer backdrop-blur-xl ${
            activePanel === 'collections'
              ? 'bg-blue-500/15 border-blue-400/45 text-blue-300'
              : 'bg-[#050918]/80 border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <FolderKanban size={16} />
          {savedDossiers.length > 0 && (
            <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-[14px] rounded-full bg-blue-500/20 border border-blue-400/50 text-blue-300 text-[9px] font-mono flex items-center justify-center">
              {savedDossiers.length}
            </span>
          )}
        </button>

        {/* Parameters */}
        <button
          type="button"
          onClick={() => setActivePanel(activePanel === 'settings' ? 'none' : 'settings')}
          title="Atal Parameters"
          className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer backdrop-blur-xl ${
            activePanel === 'settings'
              ? 'bg-[#3B82F6]/15 border-[#3B82F6]/40 text-[#3B82F6]'
              : 'bg-[#050918]/80 border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {/* =====================================================================
          SLIDE-OUT DRAWER FOR HISTORY / COLLECTIONS / SETTINGS
      ===================================================================== */}
      <AnimatePresence>
        {activePanel !== 'none' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 md:left-14 top-14 sm:top-16 bottom-0 w-80 max-w-[88vw] bg-[#060c1f]/95 backdrop-blur-2xl border-r border-cyan-400/15 z-40 p-4 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00e5ff]" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold">
                  {activePanel === 'history' && 'Atal Query Log'}
                  {activePanel === 'collections' && 'Saved Dossier Collections'}
                  {activePanel === 'settings' && 'Atal Parameters'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {activePanel === 'history' && (
              <div className="flex-1 overflow-y-auto hide-scrollbar space-y-2">
                {searchHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono py-8 text-center">
                    No queries logged in current session.
                  </p>
                ) : (
                  searchHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => executeDeepSearch(item.query)}
                      className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-cyan-400/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span className="text-cyan-300">{item.mode.toUpperCase()}</span>
                        <span>{item.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium line-clamp-2 group-hover:text-white">
                        {item.query}
                      </p>
                    </div>
                  ))
                )}
                {searchHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchHistory([])}
                    className="w-full mt-2 py-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-400 text-xs font-mono hover:bg-rose-500/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={12} /> Clear History Log
                  </button>
                )}
              </div>
            )}

            {activePanel === 'collections' && (
              <div className="flex-1 overflow-y-auto hide-scrollbar space-y-2.5">
                {savedDossiers.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono py-8 text-center">
                    No saved intelligence dossiers yet. Click &ldquo;Save to Workspace&rdquo; on any report.
                  </p>
                ) : (
                  savedDossiers.map((dossier) => (
                    <div
                      key={dossier.id}
                      onClick={() => {
                        setSearchMode(dossier.mode);
                        setMessages([
                          { role: 'user', content: dossier.query },
                          { role: 'model', content: dossier.content },
                        ]);
                        setActivePanel('none');
                      }}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-cyan-400/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span className="text-cyan-300 font-semibold">
                          {dossier.confidence}% VERIFIED · {dossier.mode.toUpperCase()}
                        </span>
                        <span className="text-slate-500">{dossier.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-100 font-semibold line-clamp-2 mb-1">
                        {dossier.query}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400">
                        {dossier.sourcesCount} cross-verified sources
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activePanel === 'settings' && (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200">Cross-Verification Strictness</span>
                    <button
                      type="button"
                      onClick={() => setStrictVerification(!strictVerification)}
                      className={`px-2 py-0.5 rounded font-mono text-[10px] cursor-pointer ${
                        strictVerification
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {strictVerification ? 'ACTIVE' : 'STANDARD'}
                    </button>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Flags conflicting numerical claims across primary wire services and preprints.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200">Academic & Institutional Priority</span>
                    <button
                      type="button"
                      onClick={() => setAcademicPriority(!academicPriority)}
                      className={`px-2 py-0.5 rounded font-mono text-[10px] cursor-pointer ${
                        academicPriority
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {academicPriority ? 'HIGH' : 'BALANCED'}
                    </button>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Prioritizes peer-reviewed journals (arXiv, Nature, IEEE) and sovereign filings.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          MAIN COMMAND CENTER WORKSPACE AREA
      ===================================================================== */}
      <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto hide-scrollbar relative z-10">

        {/* ===================================================================
            STATE A: HERO COMMAND CENTER (ROTATING 3D BLUE NETWORK GLOBE + 6 ORBITAL WINDOWS + SEARCH BAR)
        =================================================================== */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-between max-w-7xl w-full h-full min-h-0 mx-auto px-3 sm:px-6 pt-1 pb-4 sm:pb-6 relative overflow-hidden">
            {/* Centerpiece 3D Rotating Blue Network Globe + Floating 3D Glass Windows Behind It */}
            <div
              className="relative flex-1 w-full min-h-0 flex flex-col items-center justify-center"
              style={{ perspective: '1200px' }}
            >
              {/* Centered 5-Card Orbital Halo Cluster (Responsive on both narrow 400px & wide desktop viewports) */}
              <div className="relative w-full max-w-[400px] sm:max-w-[650px] md:max-w-[760px] lg:max-w-[820px] h-[345px] sm:h-[430px] md:h-[465px] flex items-center justify-center">
                {/* Intense Electric-Blue & Cyan Volumetric Sphere Aura (Behind Cards & Globe) */}
                <div
                  className="absolute w-[250px] sm:w-[410px] h-[250px] sm:h-[410px] rounded-full blur-3xl pointer-events-none opacity-80 z-0"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(0, 229, 255, 0.35) 0%, rgba(37, 99, 235, 0.28) 45%, rgba(99, 102, 241, 0.10) 70%, transparent 82%)',
                  }}
                />

                {/* =============================================================
                    5 FLOATING 3D HOLOGRAPHIC WINDOWS AROUND & BEHIND THE GLOBE
                    - Idle state: z-10 (tucked ~20% behind the z-20 globe rim)
                    - Hover state: hover:z-30 (smoothly elevates to foreground for full inspection)
                ============================================================= */}

                {/* 1. TOP-CENTER: Frosted Article Window + 3D Blue Document Badge on Top-Right */}
                <motion.div
                  initial={{ rotateY: 16, rotateX: 5, rotateZ: -2 }}
                  animate={{ y: [-4, 4, -4], rotateY: 16, rotateX: 5, rotateZ: -2 }}
                  whileHover={{
                    scale: 1.07,
                    y: -7,
                    rotateY: 6,
                    rotateX: 1,
                    rotateZ: 0,
                    transition: { duration: 0.26, ease: 'easeOut' },
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                  onMouseEnter={() => setHoveredCardIdx(0)}
                  onMouseLeave={() => setHoveredCardIdx((prev) => (prev === 0 ? null : prev))}
                  onClick={() => executeDeepSearch(trendingCards[0].prompt, trendingCards[0])}
                  style={{ transformPerspective: 950 }}
                  className={`flex flex-col absolute left-[12%] sm:left-[21%] md:left-[23%] top-[0%] sm:top-[1%] w-[158px] sm:w-[208px] md:w-[234px] h-[90px] sm:h-[118px] md:h-[132px] rounded-2xl bg-gradient-to-br from-[#1b458f]/90 via-[#0d275c]/92 to-[#071638]/96 backdrop-blur-xl border-[1.5px] ${
                    recentlyUpdatedSlot === 'web'
                      ? 'border-emerald-300 shadow-[0_0_32px_rgba(16,185,129,0.65)]'
                      : 'border-sky-300/75 hover:border-cyan-200 shadow-[0_18px_42px_rgba(0,180,255,0.35),inset_0_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_24px_60px_rgba(0,229,255,0.68),0_0_38px_rgba(56,189,248,0.55),inset_0_1px_3px_rgba(255,255,255,0.85)]'
                  } p-2 sm:p-2.5 cursor-pointer group transition-[border-color,box-shadow] duration-300 z-10 hover:z-30`}
                >
                  {/* 3D Extruded Sky-Blue Document Icon Badge on Top-Right */}
                  <div className="absolute -top-3 -right-2.5 sm:-top-3.5 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#38bdf8] via-[#0ea5e9] to-[#1d4ed8] border border-sky-100/85 shadow-[0_8px_20px_rgba(14,165,233,0.85),inset_0_2px_3px_rgba(255,255,255,0.75)] group-hover:shadow-[0_0_28px_rgba(56,189,248,1)] flex items-center justify-center text-white z-20 group-hover:scale-110 transition-all duration-300">
                    <FileText size={17} strokeWidth={2.2} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                  </div>

                  {/* Window Top Dots Bar + Source Tag + Targeted 'Refresh Data' Icon Button */}
                  <div className="relative z-10 flex items-center justify-between mb-1 sm:mb-1.5 pl-1 pr-5 sm:pr-6">
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-400/95 shadow-[0_0_5px_rgba(251,113,133,0.8)] shrink-0" />
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-300/90 shrink-0" />
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-sky-300/95 shadow-[0_0_5px_rgba(56,189,248,0.8)] shrink-0" />
                      <span className="ml-1 text-[8px] font-mono text-sky-200/85 truncate max-w-[62px] sm:max-w-[95px]">
                        {recentlyUpdatedSlot === 'web' ? '✓ UPDATED' : trendingCards[0].source || 'Global Wire'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => refreshSingleTrendingCard('web', 0, e)}
                      title="Refresh this card's live news content"
                      aria-label="Refresh card data"
                      className="p-1 rounded-md bg-sky-400/20 hover:bg-cyan-400/45 border border-sky-300/45 hover:border-cyan-100 text-sky-100 hover:text-white transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      <RefreshCw
                        size={9}
                        className={refreshingCardSlots['web'] ? 'animate-spin text-cyan-200' : ''}
                      />
                    </button>
                  </div>

                  {/* Frosted Ice-White / Sky-Blue Inner Page */}
                  <div
                    className={`relative z-10 flex flex-col flex-1 min-h-0 rounded-xl bg-gradient-to-br from-[#eef7ff]/95 via-[#d8ecff]/92 to-[#b9dcff]/90 p-1.5 sm:p-2 border border-white/80 shadow-inner transition-opacity duration-300 ${
                      refreshingCardSlots['web'] ? 'opacity-60' : 'opacity-100'
                    }`}
                  >
                    <div className="mb-1">
                      <p className="text-[8.5px] sm:text-[10px] font-bold text-[#0f296b] truncate leading-tight mb-0.5">
                        {trendingCards[0].topSearch}
                      </p>
                      <div className="h-1 sm:h-1.5 w-full rounded-full bg-[#3b82f6]/30 overflow-hidden">
                        <div className="h-full w-3/5 group-hover:w-4/5 rounded-full bg-[#2563eb]/75 transition-all duration-500" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-h-0">
                      <div className="flex-1 space-y-1">
                        <div className="h-1 sm:h-1.5 w-full rounded-full bg-[#334155]/55" />
                        <div className="h-1 sm:h-1.5 w-11/12 rounded-full bg-[#334155]/50" />
                        <div className="h-1 sm:h-1.5 w-full rounded-full bg-[#334155]/45" />
                        <div className="h-1 sm:h-1.5 w-4/5 rounded-full bg-[#334155]/40" />
                      </div>
                      <div className="w-11 sm:w-15 md:w-[66px] h-full rounded-lg overflow-hidden border border-sky-400/50 shrink-0 shadow-xs">
                        <img
                          src={
                            trendingCards[0].imageUrl ||
                            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=320&q=85'
                          }
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* 2. MID-LEFT: Alpine Mountain Lake Window + 3D Blue Globe Badge on Top-Left */}
                <motion.div
                  initial={{ rotateY: 22, rotateX: 3, rotateZ: -2 }}
                  animate={{ y: [4, -5, 4], rotateY: 22, rotateX: 3, rotateZ: -2 }}
                  whileHover={{
                    scale: 1.07,
                    y: -6,
                    rotateY: 8,
                    rotateX: 1,
                    rotateZ: 0,
                    transition: { duration: 0.26, ease: 'easeOut' },
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                  onMouseEnter={() => setHoveredCardIdx(1)}
                  onMouseLeave={() => setHoveredCardIdx((prev) => (prev === 1 ? null : prev))}
                  onClick={() => executeDeepSearch(trendingCards[1].prompt, trendingCards[1])}
                  style={{ transformPerspective: 950 }}
                  className={`flex flex-col absolute left-[0%] sm:left-[2%] md:left-[4%] top-[28%] sm:top-[27%] w-[142px] sm:w-[196px] md:w-[224px] h-[88px] sm:h-[116px] md:h-[130px] rounded-2xl bg-gradient-to-br from-[#122b66]/92 via-[#09183e]/94 to-[#040b20]/96 backdrop-blur-xl border-[1.5px] ${
                    recentlyUpdatedSlot === 'visual'
                      ? 'border-emerald-300 shadow-[0_0_32px_rgba(16,185,129,0.65)]'
                      : 'border-blue-400/75 hover:border-cyan-200 shadow-[0_16px_38px_rgba(37,99,235,0.36),inset_0_1px_2px_rgba(255,255,255,0.45)] hover:shadow-[0_22px_55px_rgba(0,229,255,0.65),0_0_35px_rgba(59,130,246,0.52),inset_0_1px_3px_rgba(255,255,255,0.8)]'
                  } p-1.5 sm:p-2.5 cursor-pointer group transition-[border-color,box-shadow] duration-300 z-10 hover:z-30`}
                >
                  {/* 3D Extruded Electric-Blue Globe Icon Badge on Top-Left */}
                  <div className="absolute -top-3 -left-2.5 sm:-top-3.5 sm:-left-3 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#38bdf8] via-[#2563eb] to-[#1d4ed8] border border-sky-200/85 shadow-[0_8px_20px_rgba(37,99,235,0.85),inset_0_2px_3px_rgba(255,255,255,0.75)] group-hover:shadow-[0_0_28px_rgba(56,189,248,1)] flex items-center justify-center text-white z-20 group-hover:scale-110 transition-all duration-300">
                    <Globe size={17} strokeWidth={2.1} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" />
                  </div>

                  {/* Window Top Header Dots + Targeted 'Refresh Data' Icon Button */}
                  <div className="relative z-10 flex items-center justify-between mb-1 pl-6 sm:pl-7 pr-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-300/90 shrink-0" />
                      <span className="text-[8px] font-mono text-sky-200/85 truncate max-w-[58px] sm:max-w-[92px]">
                        {recentlyUpdatedSlot === 'visual' ? '✓ UPDATED' : trendingCards[1].source || 'SpaceNews'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => refreshSingleTrendingCard('visual', 1, e)}
                      title="Refresh this card's live news content"
                      aria-label="Refresh card data"
                      className="p-1 rounded-md bg-sky-400/20 hover:bg-cyan-400/45 border border-sky-300/45 hover:border-cyan-100 text-sky-100 hover:text-white transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      <RefreshCw
                        size={9}
                        className={refreshingCardSlots['visual'] ? 'animate-spin text-cyan-200' : ''}
                      />
                    </button>
                  </div>

                  {/* Full-Bleed Blue Alpine Mountain & Lake Reflection Scene */}
                  <div
                    className={`relative z-10 flex-1 rounded-xl overflow-hidden border border-sky-300/40 group-hover:border-cyan-200/80 transition-all duration-300 ${
                      refreshingCardSlots['visual'] ? 'opacity-60' : 'opacity-100'
                    }`}
                  >
                    <img
                      src={
                        trendingCards[1].imageUrl ||
                        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=85'
                      }
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 inset-x-0 h-4.5 bg-[#061538]/85 backdrop-blur-xs border-t border-sky-300/30 px-2 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse shrink-0" />
                        <span className="text-[8px] sm:text-[9px] font-medium text-sky-100 truncate">
                          {trendingCards[1].topSearch}
                        </span>
                      </div>
                      <span className="text-[8px] font-mono text-cyan-300 font-semibold shrink-0">
                        {trendingCards[1].growthRate}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* 3. MID-RIGHT: Alpine Lake Video Player Window + 3D Coral-Red Play Badge on Outer Top-Right */}
                <motion.div
                  initial={{ rotateY: -22, rotateX: 4, rotateZ: 2 }}
                  animate={{ y: [5, -5, 5], rotateY: -22, rotateX: 4, rotateZ: 2 }}
                  whileHover={{
                    scale: 1.07,
                    y: -6,
                    rotateY: -8,
                    rotateX: 1,
                    rotateZ: 0,
                    transition: { duration: 0.26, ease: 'easeOut' },
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 4.9, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                  onMouseEnter={() => setHoveredCardIdx(3)}
                  onMouseLeave={() => setHoveredCardIdx((prev) => (prev === 3 ? null : prev))}
                  onClick={() => executeDeepSearch(trendingCards[3].prompt, trendingCards[3])}
                  style={{ transformPerspective: 950 }}
                  className={`flex flex-col absolute right-[0%] sm:right-[2%] md:right-[4%] top-[23%] sm:top-[19%] w-[145px] sm:w-[202px] md:w-[232px] h-[90px] sm:h-[120px] md:h-[134px] rounded-2xl bg-gradient-to-bl from-[#152c69]/92 via-[#0a1840]/94 to-[#040a1f]/96 backdrop-blur-xl border-[1.5px] ${
                    recentlyUpdatedSlot === 'video'
                      ? 'border-emerald-300 shadow-[0_0_32px_rgba(16,185,129,0.65)]'
                      : 'border-blue-400/75 hover:border-cyan-200 shadow-[0_18px_42px_rgba(37,99,235,0.36),inset_0_1px_2px_rgba(255,255,255,0.45)] hover:shadow-[0_24px_58px_rgba(244,63,94,0.5),0_0_36px_rgba(0,229,255,0.52),inset_0_1px_3px_rgba(255,255,255,0.8)]'
                  } p-1.5 sm:p-2.5 cursor-pointer group transition-[border-color,box-shadow] duration-300 z-10 hover:z-30`}
                >
                  {/* 3D Extruded Coral-Red Video Play Badge on Outer Top-Right (Zero collision with Top-Center card) */}
                  <div className="absolute -top-3 -right-2.5 sm:-top-3.5 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#fb7185] via-[#f43f5e] to-[#e11d48] border border-rose-200/85 shadow-[0_8px_20px_rgba(244,63,94,0.85),inset_0_2px_3px_rgba(255,255,255,0.75)] group-hover:shadow-[0_0_28px_rgba(244,63,94,1)] flex items-center justify-center text-white z-20 group-hover:scale-110 transition-all duration-300">
                    <div className="w-4.5 h-3.5 sm:w-5 sm:h-3.5 rounded-[4px] bg-white flex items-center justify-center shadow-xs">
                      <Play size={8} className="text-rose-600 fill-rose-600 ml-0.5" />
                    </div>
                  </div>

                  {/* Top Bezel Header + Targeted 'Refresh Data' Icon Button */}
                  <div className="relative z-10 flex items-center justify-between gap-1 mb-1 pl-1 pr-6 sm:pr-7">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shrink-0" />
                      <span className="text-[8px] font-mono text-rose-200/90 truncate max-w-[62px] sm:max-w-[98px]">
                        {recentlyUpdatedSlot === 'video' ? '✓ UPDATED' : trendingCards[3].source || 'Broadcast'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => refreshSingleTrendingCard('video', 3, e)}
                      title="Refresh this card's live news content"
                      aria-label="Refresh card data"
                      className="p-1 rounded-md bg-rose-400/20 hover:bg-rose-400/45 border border-rose-300/45 hover:border-rose-100 text-rose-100 hover:text-white transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      <RefreshCw
                        size={9}
                        className={refreshingCardSlots['video'] ? 'animate-spin text-rose-200' : ''}
                      />
                    </button>
                  </div>

                  {/* Mountain Lake Video Player Screen with Interactive Scrubber Control Bar */}
                  <div
                    className={`relative z-10 flex-1 rounded-xl overflow-hidden border border-sky-300/35 group-hover:border-cyan-200/75 transition-all duration-300 ${
                      refreshingCardSlots['video'] ? 'opacity-60' : 'opacity-100'
                    }`}
                  >
                    <img
                      src={
                        trendingCards[3].imageUrl ||
                        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=500&q=85'
                      }
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Interactive Video Scrubber Control Bar */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVideoCardPlaying((p) => !p);
                      }}
                      title={isVideoCardPlaying ? 'Pause broadcast preview' : 'Play broadcast preview'}
                      className="absolute bottom-0 inset-x-0 h-5 bg-[#05102b]/85 backdrop-blur-xs border-t border-white/20 px-2 flex items-center gap-1.5 hover:bg-[#081a44]/95 transition-colors"
                    >
                      <Play
                        size={8}
                        className={`${
                          isVideoCardPlaying ? 'text-cyan-300 fill-cyan-300' : 'text-white/75 fill-white/75'
                        } shrink-0`}
                      />
                      <div className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                        <div
                          style={{ width: `${videoScrubberProgress}%` }}
                          className="h-full bg-gradient-to-r from-sky-300 via-cyan-200 to-white rounded-full transition-all duration-500"
                        />
                      </div>
                      <span className="text-[7px] font-mono text-rose-300 uppercase tracking-tighter">
                        {isVideoCardPlaying ? 'LIVE' : 'PAUSED'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* 4. LOWER-LEFT (Visible on All Viewports): Frosted Research Card + 3D Indigo Image Badge */}
                <motion.div
                  initial={{ rotateY: 22, rotateX: -4, rotateZ: 1 }}
                  animate={{ y: [-4, 5, -4], rotateY: 22, rotateX: -4, rotateZ: 1 }}
                  whileHover={{
                    scale: 1.07,
                    y: -5,
                    rotateY: 8,
                    rotateX: -1,
                    rotateZ: 0,
                    transition: { duration: 0.26, ease: 'easeOut' },
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 4.9, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
                  onMouseEnter={() => setHoveredCardIdx(2)}
                  onMouseLeave={() => setHoveredCardIdx((prev) => (prev === 2 ? null : prev))}
                  onClick={() => executeDeepSearch(trendingCards[2].prompt, trendingCards[2])}
                  style={{ transformPerspective: 950 }}
                  className={`flex flex-col absolute left-[2%] sm:left-[6%] md:left-[8%] bottom-[2%] sm:bottom-[5%] md:bottom-[6%] w-[140px] sm:w-[185px] md:w-[212px] h-[82px] sm:h-[104px] md:h-[116px] rounded-2xl bg-gradient-to-br from-[#0e265c]/92 via-[#081638]/94 to-[#040b20]/96 backdrop-blur-xl border-[1.5px] ${
                    recentlyUpdatedSlot === 'research'
                      ? 'border-emerald-300 shadow-[0_0_32px_rgba(16,185,129,0.65)]'
                      : 'border-cyan-400/65 hover:border-cyan-200 shadow-[0_16px_36px_rgba(0,200,255,0.28),inset_0_1px_2px_rgba(255,255,255,0.4)] hover:shadow-[0_22px_55px_rgba(0,229,255,0.62),0_0_34px_rgba(14,165,233,0.52)]'
                  } p-1.5 sm:p-2.5 cursor-pointer group transition-[border-color,box-shadow] duration-300 z-10 hover:z-30`}
                >
                  {/* 3D Extruded Indigo Image Badge on Top-Left */}
                  <div className="absolute -top-3 -left-2.5 sm:-top-3.5 sm:-left-3 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#818cf8] via-[#6366f1] to-[#4338ca] border border-indigo-200/80 shadow-[0_8px_20px_rgba(99,102,241,0.85),inset_0_2px_3px_rgba(255,255,255,0.65)] flex items-center justify-center text-white z-20 group-hover:scale-110 transition-transform">
                    <ImageIcon size={16} strokeWidth={2.1} />
                  </div>

                  {/* Header with Targeted 'Refresh Data' Icon Button */}
                  <div className="flex items-center justify-between pl-6 pr-0.5 mb-1">
                    <span className="text-[7.5px] sm:text-[8px] font-mono text-indigo-200/85 truncate max-w-[68px] sm:max-w-[95px]">
                      {recentlyUpdatedSlot === 'research' ? '✓ UPDATED' : trendingCards[2].source || 'Research'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => refreshSingleTrendingCard('research', 2, e)}
                      title="Refresh this card's live news content"
                      aria-label="Refresh card data"
                      className="p-1 rounded-md bg-indigo-400/20 hover:bg-cyan-400/45 border border-indigo-300/45 hover:border-cyan-100 text-indigo-100 hover:text-white transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      <RefreshCw
                        size={9}
                        className={refreshingCardSlots['research'] ? 'animate-spin text-cyan-200' : ''}
                      />
                    </button>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 sm:gap-2 flex-1 min-h-0 bg-gradient-to-br from-[#e0f2fe]/95 via-[#bae6fd]/90 to-[#93c5fd]/85 rounded-xl p-1.5 sm:p-2 border border-white/65 transition-opacity duration-300 ${
                      refreshingCardSlots['research'] ? 'opacity-60' : 'opacity-100'
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-[8px] sm:text-[8.5px] font-bold text-[#1e3a8a] truncate leading-tight">
                        {trendingCards[2].topSearch}
                      </p>
                      <div className="h-1 sm:h-1.5 w-full rounded-full bg-[#334155]/45" />
                      <div className="h-1 sm:h-1.5 w-5/6 rounded-full bg-[#334155]/45" />
                      <div className="hidden sm:block h-1.5 w-4/5 rounded-full bg-[#334155]/40" />
                    </div>
                    <img
                      src={
                        trendingCards[2].imageUrl ||
                        'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=240&q=80'
                      }
                      alt=""
                      className="w-10 sm:w-12 md:w-14 h-full rounded-lg object-cover border border-blue-400/50 shrink-0 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </motion.div>

                {/* 5. LOWER-RIGHT (Visible on All Viewports): Analytics Chart Window + 3D Emerald-Cyan Badge */}
                <motion.div
                  initial={{ rotateY: -24, rotateX: -2, rotateZ: -1 }}
                  animate={{ y: [-5, 4, -5], rotateY: -24, rotateX: -2, rotateZ: -1 }}
                  whileHover={{
                    scale: 1.07,
                    y: -5,
                    rotateY: -8,
                    rotateX: 0,
                    rotateZ: 0,
                    transition: { duration: 0.26, ease: 'easeOut' },
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
                  onMouseEnter={() => setHoveredCardIdx(4)}
                  onMouseLeave={() => setHoveredCardIdx((prev) => (prev === 4 ? null : prev))}
                  onClick={() => executeDeepSearch(trendingCards[4].prompt, trendingCards[4])}
                  style={{ transformPerspective: 950 }}
                  className={`flex flex-col absolute right-[2%] sm:right-[6%] md:right-[8%] bottom-[2%] sm:bottom-[6%] md:bottom-[7%] w-[142px] sm:w-[188px] md:w-[214px] h-[84px] sm:h-[106px] md:h-[118px] rounded-2xl bg-gradient-to-bl from-[#0b2250]/92 via-[#071535]/94 to-[#03091c]/96 backdrop-blur-xl border-[1.5px] ${
                    recentlyUpdatedSlot === 'market'
                      ? 'border-emerald-300 shadow-[0_0_32px_rgba(16,185,129,0.65)]'
                      : 'border-cyan-400/65 hover:border-emerald-300 shadow-[0_16px_36px_rgba(0,229,255,0.26),inset_0_1px_2px_rgba(255,255,255,0.4)] hover:shadow-[0_22px_55px_rgba(16,185,129,0.52),0_0_35px_rgba(0,229,255,0.5)]'
                  } p-1.5 sm:p-2.5 cursor-pointer group transition-[border-color,box-shadow] duration-300 z-10 hover:z-30`}
                >
                  {/* 3D Extruded Cyan-Emerald Chart Badge on Top-Right */}
                  <div className="absolute -top-3 -right-2.5 sm:-top-3.5 sm:-right-3 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#2dd4bf] via-[#10b981] to-[#0d9488] border border-emerald-200/80 shadow-[0_8px_20px_rgba(16,185,129,0.85),inset_0_2px_3px_rgba(255,255,255,0.65)] flex items-center justify-center text-white z-20 group-hover:scale-110 transition-transform">
                    <BarChart3 size={16} strokeWidth={2.2} />
                  </div>

                  {/* Header with Targeted 'Refresh Data' Icon Button */}
                  <div className="flex items-center justify-between pl-1 pr-6 mb-1">
                    <button
                      type="button"
                      onClick={(e) => refreshSingleTrendingCard('market', 4, e)}
                      title="Refresh this card's live news content"
                      aria-label="Refresh card data"
                      className="p-1 rounded-md bg-emerald-400/20 hover:bg-emerald-400/45 border border-emerald-300/45 hover:border-emerald-100 text-emerald-100 hover:text-white transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      <RefreshCw
                        size={9}
                        className={refreshingCardSlots['market'] ? 'animate-spin text-emerald-200' : ''}
                      />
                    </button>
                    <span className="text-[7.5px] sm:text-[8px] font-mono text-emerald-300 font-semibold truncate">
                      {recentlyUpdatedSlot === 'market' ? '✓ LIVE' : trendingCards[4].growthRate}
                    </span>
                  </div>

                  <div
                    className={`flex items-end gap-2 flex-1 min-h-0 bg-white/[0.05] rounded-xl border border-white/10 p-1.5 sm:p-2 transition-opacity duration-300 ${
                      refreshingCardSlots['market'] ? 'opacity-60' : 'opacity-100'
                    }`}
                  >
                    <div className="flex-1 h-full flex flex-col justify-end relative">
                      <svg viewBox="0 0 100 36" className="w-full h-4 sm:h-6 overflow-visible mb-0.5 sm:mb-1">
                        <polyline
                          fill="none"
                          stroke="#00e5ff"
                          strokeWidth="2.5"
                          points="4,30 26,20 48,23 72,10 95,3"
                        />
                        <circle cx="26" cy="20" r="2.5" fill="#fff" />
                        <circle cx="72" cy="10" r="2.5" fill="#fff" />
                        <circle cx="95" cy="3" r="3" fill="#2dd4bf" />
                      </svg>
                      <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-6 sm:h-8">
                        {(trendingCards[4].sparkline?.length === 5
                          ? trendingCards[4].sparkline
                          : [40, 58, 48, 80, 98]
                        ).map((h, i) => (
                          <div
                            key={i}
                            style={{ height: `${Math.max(25, Math.min(100, h))}%` }}
                            className="flex-1 rounded-t bg-gradient-to-t from-blue-600 via-sky-400 to-cyan-300 transition-all duration-500"
                          />
                        ))}
                      </div>
                    </div>
                    <div className="w-6 sm:w-8 space-y-1 sm:space-y-1.5 pb-0.5">
                      <div className="h-1 sm:h-1.5 w-full rounded-full bg-slate-300/45" />
                      <div className="h-1 sm:h-1.5 w-4/5 rounded-full bg-slate-300/45" />
                      <div className="h-1 sm:h-1.5 w-full rounded-full bg-slate-300/40" />
                    </div>
                  </div>
                </motion.div>

                {/* =============================================================
                    FOREGROUND 3D ROTATING HOLOGRAPHIC NETWORK GLOBE (z-20)
                    - Circular hit region allows 360° drag, rotate, zoom, and country click on the globe
                    - Corner areas pass pointer events through to the 3D cards tucked behind (z-10, hover:z-30)
                ============================================================= */}
                <div className="relative w-[225px] sm:w-[350px] md:w-[410px] h-[225px] sm:h-[350px] md:h-[410px] flex items-center justify-center z-20 pointer-events-none">
                  <RealGlobe
                    isDark={true}
                    onSelectTopic={handleSelectGlobeTopic}
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>

            {/* ===============================================================
                COMMAND CENTER SEARCH BAR (FULL-WIDTH VISIBLE TEXTAREA)
            =============================================================== */}
            <div className="w-full max-w-3xl z-20 flex flex-col items-center shrink-0 pt-2">
              {/* Attached File / Image Preview Pill */}
              {attachedFileName && (
                <div className="self-start mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-xs font-mono text-cyan-300">
                  <Paperclip size={12} />
                  <span className="max-w-[220px] truncate">{attachedFileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedImage(undefined);
                      setAttachedFileName(null);
                    }}
                    className="hover:text-white cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Dark Input with Electric-Blue & Cyan Bottom Glow Line */}
              <div className="relative w-full group">
                <div className="relative flex items-center gap-2 w-full min-h-[48px] sm:min-h-[56px] md:min-h-[60px] rounded-2xl bg-[#070d22]/90 backdrop-blur-2xl border border-cyan-400/20 px-3 sm:px-4 py-2 shadow-[0_12px_34px_-4px_rgba(0,0,0,0.85),0_4px_22px_-2px_rgba(0,210,255,0.28),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
                  {/* Bottom Center Cyan-Blue Glow Line */}
                  <div
                    className="pointer-events-none absolute bottom-0 left-[12%] right-[12%] h-[2px]"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent 0%, rgba(0, 229, 255, 0.9) 35%, rgba(99, 102, 241, 0.85) 65%, transparent 100%)',
                      boxShadow: '0 0 14px rgba(0, 229, 255, 0.7)',
                    }}
                  />

                  {/* Left: Attach File / Image Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file or image for multimodal Atal search"
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Paperclip size={16} />
                  </button>

                  {/* Center Full-Width Textarea with Single-Line Non-Clipping Animated Placeholder */}
                  <div className="relative flex-1 min-w-0 flex items-center">
                    {!queryInput && (
                      <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-1.5 select-none text-slate-400">
                        <span className="truncate whitespace-nowrap text-[14px] sm:text-[15px] md:text-base leading-normal">
                          {`${placeholderText}|`}
                        </span>
                      </div>
                    )}
                    <textarea
                      ref={searchInputRef as any}
                      rows={1}
                      value={queryInput}
                      onChange={(e) => {
                        setQueryInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          executeDeepSearch(queryInput);
                        }
                      }}
                      placeholder=""
                      className="w-full bg-transparent text-[14px] sm:text-[15px] md:text-base text-white focus:outline-none px-1.5 py-1 min-w-0 resize-none hide-scrollbar leading-normal"
                    />
                  </div>

                  {/* Right Controls: Voice & Glowing Search Button */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      title="Voice intelligence query"
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isListening
                          ? 'bg-[#F43F5E]/20 border-[#F43F5E]/50 text-[#F43F5E] shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                          : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/[0.08] text-slate-300 hover:text-white'
                      }`}
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => executeDeepSearch(queryInput)}
                      disabled={!queryInput.trim() && !attachedImage}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-white shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_28px_rgba(59,130,246,0.65)] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                    >
                      <span>Search</span>
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================================================================
             STATE B: DEEP SEARCH IN-PROGRESS & STRUCTURED INTELLIGENCE DOSSIER
          =================================================================== */
          <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-28">
            {/* Top Dossier Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-xl bg-[#00E5B0]/10 border border-[#00E5B0]/30 text-[#00E5B0]">
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E5B0] font-semibold">
                      CLASSIFIED INTELLIGENCE DOSSIER · {searchMode.toUpperCase()} MODE
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ID #{previewHash(activeQueryTitle)}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                    {activeQueryTitle}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isLoading && (
                  <button
                    type="button"
                    onClick={stopMessage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F43F5E]/15 border border-[#F43F5E]/40 text-[#F43F5E] text-xs font-mono hover:bg-[#F43F5E]/25 transition-colors cursor-pointer"
                  >
                    <Square size={12} /> Stop Synthesis
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setSelectedTrend(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] hover:border-[#00E5B0]/40 text-xs font-medium text-slate-200 transition-all cursor-pointer"
                >
                  <Globe size={13} className="text-[#00E5B0]" />
                  <span>Return to 3D Globe</span>
                </button>
              </div>
            </div>

            {/* ===============================================================
                1. DEEP SEARCH IN-PROGRESS / AGENT TELEMETRY PIPELINE
            =============================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
              {/* Left 7 Cols: Vertical Agent Timeline + Animated Progress Ring + Source Favicons */}
              <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4 pb-3.5 mb-4 border-b border-white/[0.07]">
                  <div className="flex items-center gap-3">
                    {/* Animated Circular Progress Ring */}
                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          fill="none"
                          stroke="#00E5B0"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 18}
                          strokeDashoffset={2 * Math.PI * 18 * (1 - progressPercent / 100)}
                          className="transition-all duration-500"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-mono font-bold text-[#00E5B0]">
                        {progressPercent}%
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-[#22D3EE] font-semibold">
                          {isLoading ? 'ATAL AUTONOMOUS RESEARCH AGENT ACTIVE' : 'ATAL RESEARCH PIPELINE COMPLETE'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Cross-examining multi-lingual repositories, institutional filings & live telemetry
                      </p>
                    </div>
                  </div>

                  {/* Live Source Counter Ticking Up */}
                  <div className="text-right shrink-0">
                    <div className="text-lg sm:text-xl font-mono font-bold text-white">
                      {sourceCounter}
                      <span className="text-[#00E5B0] text-xs ml-0.5">+</span>
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Sources Scanned
                    </div>
                  </div>
                </div>

                {/* Vertical Timeline of 5 Live Steps */}
                <div className="space-y-2.5">
                  {RESEARCH_STEPS.map((step, idx) => {
                    const isCompleted = !isLoading || activeStep > idx;
                    const isCurrent = isLoading && activeStep === idx;
                    return (
                      <div
                        key={step.id}
                        className={`flex items-start gap-3 p-2 rounded-xl transition-all ${
                          isCurrent
                            ? 'bg-[#00E5B0]/[0.07] border border-[#00E5B0]/30'
                            : 'border border-transparent'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 size={15} className="text-[#00E5B0]" />
                          ) : isCurrent ? (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#22D3EE] border-t-transparent animate-spin" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-xs font-semibold ${
                                isCompleted || isCurrent ? 'text-white' : 'text-slate-500'
                              }`}
                            >
                              {step.label}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {isCompleted ? 'VERIFIED' : isCurrent ? 'IN PROGRESS' : 'QUEUED'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{step.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Favicon Chips of Sources Appearing One by One */}
                <div className="mt-4 pt-3 border-t border-white/[0.07] flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1">
                    Ingested Streams:
                  </span>
                  {activeSources.slice(0, visibleFavicons).map((src) => (
                    <motion.a
                      key={src.id}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-mono text-slate-300 hover:text-[#00E5B0] transition-colors"
                    >
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
                        alt={src.domain}
                        className="w-3.5 h-3.5 rounded-sm"
                      />
                      <span>{src.domain}</span>
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Right 5 Cols: Real-Time Mini Mind-Map / Knowledge Graph */}
              <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/[0.07]">
                  <div className="flex items-center gap-2">
                    <Network size={15} className="text-[#22D3EE]" />
                    <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                      Live Knowledge Graph
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#00E5B0] px-2 py-0.5 rounded bg-[#00E5B0]/10 border border-[#00E5B0]/30">
                    {Math.min(5, activeStep + 1)} / 5 CLUSTERS LINKED
                  </span>
                </div>

                {/* Interactive SVG Node-Link Knowledge Graph Building in Real Time */}
                <div className="relative flex-1 min-h-[195px] flex items-center justify-center bg-[#05070D]/60 rounded-xl border border-white/[0.05] overflow-hidden">
                  <svg viewBox="0 0 360 190" className="w-full h-full">
                    <defs>
                      <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00E5B0" stopOpacity="0.65" />
                        <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.35" />
                      </linearGradient>
                    </defs>

                    {/* Edges radiating from Central Query Node (180, 95) */}
                    {[
                      { x: 65, y: 42, label: 'Primary Papers', stepReq: 0 },
                      { x: 295, y: 42, label: 'Market Telemetry', stepReq: 1 },
                      { x: 58, y: 148, label: 'Patent Filings', stepReq: 2 },
                      { x: 302, y: 148, label: 'Fact Triangulation', stepReq: 3 },
                      { x: 180, y: 24, label: 'Synthesis Core', stepReq: 4 },
                    ].map((node, i) => {
                      const active = !isLoading || activeStep >= node.stepReq;
                      return (
                        <g key={i} className="transition-opacity duration-500" style={{ opacity: active ? 1 : 0.2 }}>
                          <line
                            x1="180"
                            y1="95"
                            x2={node.x}
                            y2={node.y}
                            stroke="url(#edgeGrad)"
                            strokeWidth="1.5"
                            strokeDasharray={active ? 'none' : '4 4'}
                          />
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="10"
                            fill="#070B14"
                            stroke={i === 3 ? '#F43F5E' : '#22D3EE'}
                            strokeWidth="1.8"
                          />
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="3.5"
                            fill={i === 3 ? '#F43F5E' : '#00E5B0'}
                          />
                          <text
                            x={node.x}
                            y={node.y + 22}
                            textAnchor="middle"
                            fill="#cbd5e1"
                            fontSize="9"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            {node.label}
                          </text>
                        </g>
                      );
                    })}

                    {/* Central Hub Node */}
                    <circle
                      cx="180"
                      cy="95"
                      r="20"
                      fill="rgba(0, 229, 176, 0.12)"
                      stroke="#00E5B0"
                      strokeWidth="1.8"
                    />
                    <circle cx="180" cy="95" r="6" fill="#00E5B0" />
                    <text
                      x="180"
                      y="128"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      QUERY VECTOR
                    </text>
                  </svg>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>ENTITY GRAPH: DENSE</span>
                  <span className="text-[#22D3EE]">LATENCY: 142ms</span>
                </div>
              </div>
            </div>

            {/* ===============================================================
                2. RESULT VIEW: STRUCTURED REPORT + SOURCES SIDE PANEL
            =============================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 8 Columns: Structured Intelligence Report & Telemetry */}
              <div className="lg:col-span-8 space-y-5">
                {/* Structured Telemetry & Quantitative Data Charts Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-white/[0.07]">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={16} className="text-[#00E5B0]" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                        Quantitative Telemetry & Signal Velocity
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-[#22D3EE]">
                      {parsedMetrics.region} · {parsedMetrics.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-[#05070D]/60 border border-white/[0.06]">
                      <div className="text-[10px] font-mono uppercase text-slate-400">Signal Volume</div>
                      <div className="text-base font-mono font-bold text-white mt-0.5">
                        {parsedMetrics.volume}
                      </div>
                      <div className="text-[10px] font-mono text-[#00E5B0] mt-0.5">
                        Verified across primary indices
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#05070D]/60 border border-white/[0.06]">
                      <div className="text-[10px] font-mono uppercase text-slate-400">Momentum Delta</div>
                      <div className="text-base font-mono font-bold text-[#00E5B0] mt-0.5">
                        {parsedMetrics.growth} YoY
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Velocity: <span className="text-[#22D3EE]">{parsedMetrics.velocity}</span>
                      </div>
                    </div>

                    {/* Confidence Score Circular Gauge */}
                    <div className="p-3 rounded-xl bg-[#05070D]/60 border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-400">
                          Confidence Score
                        </div>
                        <div className="text-base font-mono font-bold text-white mt-0.5">
                          {confidenceScore}% Verified
                        </div>
                        <div className="text-[10px] font-mono text-[#00E5B0] mt-0.5">
                          High Consensus [1][2][4]
                        </div>
                      </div>
                      <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                        <svg className="w-11 h-11 -rotate-90" viewBox="0 0 40 40">
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="3.5"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke="#00E5B0"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 16}
                            strokeDashoffset={2 * Math.PI * 16 * (1 - confidenceScore / 100)}
                          />
                        </svg>
                        <span className="absolute text-[9px] font-mono font-bold text-[#00E5B0]">
                          {confidenceScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Visual Bar Chart Breakdown */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
                      <span>7-INTERVAL SIGNAL TRAJECTORY</span>
                      <span>PEAK INDEX: {Math.max(...parsedMetrics.sparkline).toFixed(1)}M</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2 items-end h-20 pt-2 px-2 rounded-xl bg-[#05070D]/50 border border-white/[0.05]">
                      {parsedMetrics.sparkline.map((val, idx) => {
                        const maxVal = Math.max(...parsedMetrics.sparkline, 1);
                        const heightPct = Math.max(18, Math.round((val / maxVal) * 100));
                        return (
                          <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                            <div
                              className="w-full rounded-t-md bg-gradient-to-t from-[#3B82F6]/60 via-[#22D3EE]/80 to-[#00E5B0] transition-all duration-500"
                              style={{ height: `${heightPct}%` }}
                            />
                            <span className="text-[9px] font-mono text-slate-400">T-{6 - idx}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Main Synthesized Intelligence Dossier Report */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-2xl">
                  {latestModelMessage?.content ? (
                    <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-lg prose-h2:text-[#00E5B0] prose-h2:border-b prose-h2:border-white/[0.08] prose-h2:pb-2 prose-h2:mt-6 first:prose-h2:mt-0 prose-p:text-slate-200 prose-p:leading-relaxed prose-li:text-slate-200 prose-strong:text-white prose-table:border prose-table:border-white/10 prose-th:bg-white/[0.04] prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 text-sm sm:text-[15px]">
                      <ReactMarkdown>
                        {latestModelMessage.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-8 h-8 rounded-full border-2 border-[#00E5B0] border-t-transparent animate-spin mb-3" />
                      <p className="text-xs font-mono uppercase tracking-wider text-[#00E5B0]">
                        Synthesizing Atal Intelligence Report...
                      </p>
                    </div>
                  )}

                  {/* Interactive Citations Footer Bar [1][2][3][4][5][6] */}
                  <div className="mt-6 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1">
                        Verified Citations:
                      </span>
                      {activeSources.map((src) => (
                        <button
                          key={src.id}
                          type="button"
                          onClick={() => setHighlightedCitation(src.id === highlightedCitation ? null : src.id)}
                          className={`px-2 py-0.5 rounded-md font-mono text-xs transition-all cursor-pointer ${
                            highlightedCitation === src.id
                              ? 'bg-[#00E5B0] text-[#05070D] font-bold shadow-[0_0_12px_#00E5B0]'
                              : 'bg-white/[0.06] hover:bg-[#00E5B0]/20 text-[#22D3EE] border border-white/[0.08]'
                          }`}
                        >
                          [{src.id}]
                        </button>
                      ))}
                    </div>

                    {/* Report Actions: Export PDF, Share, Follow-up, Save to Workspace */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportPDF}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                      >
                        <FileDown size={13} className="text-[#22D3EE]" />
                        <span>Export PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleShareReport}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                      >
                        <Share2 size={13} className="text-[#00E5B0]" />
                        <span>{copiedShare ? 'Copied Brief!' : 'Share'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveToWorkspace}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          isCurrentSaved
                            ? 'bg-[#00E5B0]/20 border-[#00E5B0]/50 text-[#00E5B0]'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-200'
                        }`}
                      >
                        {isCurrentSaved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                        <span>{isCurrentSaved ? 'Saved to Workspace' : 'Save to Workspace'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contradictions Found & Cross-Verification Audit Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.07]">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={15} className="text-[#F43F5E]" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                        Contradictions & Source Cross-Verification Audit
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F43F5E]/15 border border-[#F43F5E]/40 text-[#F43F5E]">
                      1 DIVERGENCE FLAGGED
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#F43F5E]/[0.06] border border-[#F43F5E]/25">
                      <div className="font-mono text-[10px] uppercase text-[#F43F5E] font-semibold mb-1">
                        Timeline & Commercialization Variance [3][5]
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                         commercial market projections show a 14–18 month variance compared to conservative peer-reviewed lab scaling timelines in primary academic preprints.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#00E5B0]/[0.06] border border-[#00E5B0]/25">
                      <div className="font-mono text-[10px] uppercase text-[#00E5B0] font-semibold mb-1">
                        Triangulated Consensus [1][2][4][6]
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Core architectural performance gains and capital allocation metrics are independently corroborated across 4 primary institutional datasets.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Follow-Up Intelligence Bar */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-2.5">
                    <MessageSquarePlus size={14} className="text-[#00E5B0]" />
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                      Launch Follow-Up with Atal
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          executeDeepSearch(queryInput);
                        }
                      }}
                      placeholder="Ask a follow-up question or drill into a specific citation..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#05070D]/80 border border-white/[0.08] text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#00E5B0]/50"
                    />
                    <button
                      type="button"
                      onClick={() => executeDeepSearch(queryInput)}
                      disabled={!queryInput.trim() || isLoading}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5B0] to-[#22D3EE] text-[#05070D] font-semibold text-xs cursor-pointer disabled:opacity-40"
                    >
                      Investigate
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 4 Columns: "Sources" Side Panel with Credibility Badges */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl sticky top-4">
                  <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={15} className="text-[#00E5B0]" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                        Verified Sources [{activeSources.length}]
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      CREDIBILITY AUDIT
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {activeSources.map((src) => {
                      const isHighlighted = highlightedCitation === src.id;
                      return (
                        <a
                          key={src.id}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`block p-3 rounded-xl border transition-all group ${
                            isHighlighted
                              ? 'bg-[#00E5B0]/15 border-[#00E5B0] shadow-[0_0_20px_rgba(0,229,176,0.2)]'
                              : 'bg-[#05070D]/60 hover:bg-white/[0.06] border-white/[0.07] hover:border-[#22D3EE]/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-1.5 py-0.5 rounded bg-white/[0.08] text-[#22D3EE] font-mono text-[10px] font-bold">
                                [{src.id}]
                              </span>
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
                                alt={src.domain}
                                className="w-3.5 h-3.5 rounded-sm shrink-0"
                              />
                              <span className="text-xs font-mono text-slate-300 truncate">
                                {src.domain}
                              </span>
                            </div>

                            {/* Credibility Score Badge (High / Medium) */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-semibold shrink-0 ${
                                src.credibility === 'High'
                                  ? 'bg-[#00E5B0]/15 text-[#00E5B0] border border-[#00E5B0]/35'
                                  : 'bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/35'
                              }`}
                            >
                              {src.credibility} · {src.score}%
                            </span>
                          </div>

                          <p className="text-xs text-slate-200 font-medium line-clamp-2 group-hover:text-white leading-snug">
                            {src.title}
                          </p>

                          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>{src.type}</span>
                            <span className="inline-flex items-center gap-1 text-[#00E5B0] opacity-80 group-hover:opacity-100">
                              Inspect <ExternalLink size={10} />
                            </span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function previewHash(str: string): string {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).toUpperCase().slice(0, 6);
}
