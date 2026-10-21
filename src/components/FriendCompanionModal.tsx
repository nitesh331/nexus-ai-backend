import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Flame, 
  HeartHandshake, 
  Swords, 
  Compass, 
  Trash2, 
  Square, 
  Copy, 
  Check, 
  Radio, 
  MessageSquare, 
  PhoneCall, 
  Globe, 
  Clock, 
  Play, 
  Pause 
} from 'lucide-react';
import { COMPANION_MAINTENANCE_MESSAGE } from '../utils/maintenanceMessage';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import VoiceVisualizer from './VoiceVisualizer';

export type CompanionPersona = 'friend' | 'debate' | 'mentor' | 'roast';
export type DebateIntensity = 'chill' | 'balanced' | 'fierce';
export type CompanionLanguage = 'hinglish' | 'hindi' | 'english';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp?: number;
  reaction?: string;
}

interface FriendCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  userName?: string;
}

const PERSONAS = [
  {
    id: 'friend' as CompanionPersona,
    name: 'Best Friend',
    tag: 'Dost / Confidant',
    tone: 'Empathetic & Casual',
    desc: 'Warm, relatable, listens to your heart & chats like a true best friend.',
    icon: HeartHandshake,
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    activeRing: 'border-emerald-500 text-emerald-400 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    accentText: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-500',
    placeholder: 'Talk freely like a close friend (Hindi / English)...'
  },
  {
    id: 'debate' as CompanionPersona,
    name: 'Debate Partner',
    tag: 'Tark-Vitark & Logic',
    tone: 'Sharp & Counter-Logic',
    desc: 'Intellectual sparring partner, challenges premises, rigorously argues any viewpoint.',
    icon: Swords,
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    activeRing: 'border-rose-500 text-rose-400 bg-rose-500/15 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
    accentText: 'text-rose-400',
    gradient: 'from-rose-500 to-orange-500',
    placeholder: 'State any claim, opinion, or hypothesis to debate...'
  },
  {
    id: 'mentor' as CompanionPersona,
    name: 'Life Mentor',
    tag: 'Tough Love & Direction',
    tone: 'Direct & Unfiltered Truth',
    desc: 'Honest reality checks, discipline coaching, and actionable growth strategy.',
    icon: Compass,
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    activeRing: 'border-amber-500 text-amber-400 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    accentText: 'text-amber-400',
    gradient: 'from-amber-500 to-yellow-500',
    placeholder: 'Ask for advice, career strategy, or a mindset audit...'
  },
  {
    id: 'roast' as CompanionPersona,
    name: 'Roast Buddy',
    tag: 'Witty Banter & Humor',
    tone: 'Savage & Playful Teasing',
    desc: 'Laugh-out-loud roasts, witty comebacks, and unfiltered friendly banter.',
    icon: Flame,
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    activeRing: 'border-purple-500 text-purple-400 bg-purple-500/15 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
    accentText: 'text-purple-400',
    gradient: 'from-purple-500 to-pink-500',
    placeholder: 'Dare me to roast your habits, plans, or dilemmas...'
  }
];

const PROMPTS_BY_PERSONA: Record<CompanionPersona, { label: string; text: string; icon: string }[]> = {
  friend: [
    { label: "Vent Out", text: "Yaar aaj ka din bohot thaka dene wala tha... sun na thodi der!", icon: "☕" },
    { label: "Confession", text: "Mujhe ek aisi baat share karni hai jo kisi aur ko nahi bata sakta.", icon: "🤫" },
    { label: "Need Opinion", text: "Bhai thoda confuse hu, tumhara honest opinion kya hai is situation pe?", icon: "💭" },
    { label: "Fun Time", text: "Ek mast relatable joke ya spicy gossip sunao na yaar!", icon: "😂" }
  ],
  debate: [
    { label: "AI & Humanity", text: "Challenge: AI will never truly create soulful art or understand consciousness. Defend your stance!", icon: "🤖" },
    { label: "Money & Peace", text: "Argument: Money CAN buy genuine happiness and mental freedom. Prove me wrong!", icon: "💰" },
    { label: "Degrees vs Skills", text: "Debate: A formal college degree is completely overrated in 2026.", icon: "🎓" },
    { label: "Free Will", text: "Philosophy: Does human free will actually exist, or are all decisions predetermined?", icon: "🧠" }
  ],
  mentor: [
    { label: "Procrastination", text: "I have big ambitious goals but keep wasting time procrastinating. Give me brutal honest truth.", icon: "⏳" },
    { label: "Career Risk", text: "Should I play it safe or take a huge calculated career risk right now?", icon: "🚀" },
    { label: "Discipline", text: "How do I build unbreakable self-discipline without constantly burning out?", icon: "⚡" },
    { label: "Mindset Check", text: "Review my thought process and tell me where I am secretly fooling myself.", icon: "🎯" }
  ],
  roast: [
    { label: "Screen Time", text: "Roast my daily phone screen time and terrible sleep schedule!", icon: "📱" },
    { label: "5 AM Wakeup", text: "I told myself I'll wake up at 5 AM tomorrow for the 100th time... roast me!", icon: "⏰" },
    { label: "Comebacks", text: "Give me the most savage witty comeback when someone ignores my text.", icon: "🔥" },
    { label: "Overthinking", text: "Roast modern overthinking and anxiety in one hilarious paragraph.", icon: "🤡" }
  ]
};

export default function FriendCompanionModal({
  isOpen,
  onClose,
  isDark,
  userName = 'Dost'
}: FriendCompanionModalProps) {
  const [persona, setPersona] = useLocalStorage<CompanionPersona>('companion-persona', 'friend');
  const [debateIntensity, setDebateIntensity] = useLocalStorage<DebateIntensity>('companion-debate-intensity', 'balanced');
  const [voiceEnabled, setVoiceEnabled] = useLocalStorage<boolean>('companion-voice-enabled', true);
  const [language, setLanguage] = useLocalStorage<CompanionLanguage>('companion-language', 'hinglish');
  const [messages, setMessages] = useLocalStorage<Message[]>('companion-chat-history', []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'voice'>('chat');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Session duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOpen) {
      interval = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen]);

  const formatSessionTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && viewMode === 'chat') {
      scrollToBottom();
    }
  }, [isOpen, messages, isLoading, viewMode]);

  // Voice speech synthesis helper
  const speakText = (text: string, msgIndex?: number) => {
    if (!voiceEnabled || !synthRef.current) return;
    try {
      synthRef.current.cancel();
      const cleanText = text
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/[`*#_~]/g, '')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.02;
      utterance.pitch = persona === 'roast' ? 1.08 : persona === 'debate' ? 0.98 : 1.02;

      // Select natural Hindi/English voice if available
      const voices = synthRef.current.getVoices();
      const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
      const naturalVoice = hindiVoice || voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (typeof msgIndex === 'number') setSpeakingMessageIndex(msgIndex);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
      };

      synthRef.current.speak(utterance);
    } catch (err) {
      console.warn("TTS Speech error:", err);
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
    stopSpeaking();
  };

  const transcriptRef = useRef<string>('');

  // Voice input
  const handleVoiceListen = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hindi' ? 'hi-IN' : language === 'english' ? 'en-US' : 'hi-IN';

      transcriptRef.current = '';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);
        transcriptRef.current = transcript;
      };
      recognition.onerror = (e: any) => {
        setIsListening(false);
        if (e.error === 'not-allowed') {
          alert("Mic blocked. Please open the app in a New Tab to use voice features.");
        }
      };
      recognition.onend = () => {
        setIsListening(false);
        if (transcriptRef.current.trim()) {
          handleSend(transcriptRef.current.trim());
        }
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech recognition error:", err);
      setIsListening(false);
      alert("Mic blocked. Please open the app in a New Tab.");
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    setInput('');
    stopSpeaking();

    const newMsgs: Message[] = [...messages, { role: 'user', content: textToSend, timestamp: Date.now() }];
    setMessages(newMsgs);
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          workspace: 'companion',
          companionPersona: persona,
          debateIntensity: persona === 'debate' ? debateIntensity : undefined,
          customInstructions: `User Name is ${userName || 'Friend'}. Preferred Language is ${language}. Speak conversationally with authentic, highly human character, emotion, and relatable presence.`
        }),
        signal: abortController.signal
      });

      if (!res.ok) {
        setMessages([...newMsgs, { role: 'model', content: COMPANION_MAINTENANCE_MESSAGE }]);
        setIsLoading(false);
        abortControllerRef.current = null;
        return;
      }

      setMessages((prev) => [...prev, { role: 'model', content: '', timestamp: Date.now() }]);
      let currentReply = '';

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.replace('data: ', '').trim();
              if (data === '[DONE]') break;
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.text) {
                    currentReply += parsed.text;
                    setMessages((prev) => {
                      const updated = [...prev];
                      if (updated.length > 0) {
                        updated[updated.length - 1] = {
                          ...updated[updated.length - 1],
                          content: currentReply
                        };
                      }
                      return updated;
                    });
                  }
                } catch {}
              }
            }
          }
        }
      }

      // Speak response if voice audio is enabled
      if (currentReply && voiceEnabled) {
        speakText(currentReply, newMsgs.length);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Companion chat error:", err);
        setMessages([...newMsgs, { role: 'model', content: COMPANION_MAINTENANCE_MESSAGE }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleReact = (index: number, emoji: string) => {
    setMessages(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          reaction: updated[index].reaction === emoji ? undefined : emoji
        };
      }
      return updated;
    });
  };

  const currentPersonaObj = PERSONAS.find(p => p.id === persona) || PERSONAS[0];
  const PersonaIcon = currentPersonaObj.icon;
  const lastModelReply = messages.filter(m => m.role === 'model').slice(-1)[0]?.content;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`relative flex flex-col w-full max-w-4xl h-[92vh] sm:h-[88vh] rounded-3xl border shadow-2xl overflow-hidden ${
            isDark 
              ? 'bg-[#0c0c11] border-white/10 text-white shadow-[0_25px_60px_rgba(0,0,0,0.8)]' 
              : 'bg-[#fafafa] border-gray-200 text-gray-900 shadow-[0_25px_60px_rgba(0,0,0,0.15)]'
          }`}
        >
          {/* Ambient Background Gradient Flare */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 blur-3xl pointer-events-none opacity-25"
            style={{
              background: `radial-gradient(ellipse at center, ${
                persona === 'debate' ? '#f43f5e' : persona === 'mentor' ? '#f59e0b' : persona === 'roast' ? '#a855f7' : '#10b981'
              } 0%, transparent 70%)`
            }}
          />

          {/* ================= HEADER: REALISTIC LIVE COMPANION BAR ================= */}
          <div className={`flex items-center justify-between px-4 sm:px-6 py-3.5 border-b shrink-0 z-20 backdrop-blur-xl ${
            isDark ? 'border-white/10 bg-[#121218]/90' : 'border-gray-200/80 bg-white/90'
          }`}>
            {/* Left: Avatar & Live Status */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                {/* Breathing Ambient Aura */}
                <motion.div
                  animate={{
                    scale: (isSpeaking || isListening) ? [1, 1.35, 1] : [1, 1.1, 1],
                    opacity: (isSpeaking || isListening) ? [0.8, 1, 0.8] : [0.35, 0.6, 0.35]
                  }}
                  transition={{ repeat: Infinity, duration: isSpeaking ? 1.2 : 2.5, ease: "easeInOut" }}
                  className={`absolute inset-0 rounded-full bg-gradient-to-tr ${currentPersonaObj.gradient} blur-md`}
                />
                <div className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center border-2 shadow-inner ${
                  isDark ? 'bg-[#181822] border-white/20' : 'bg-white border-gray-200'
                }`}>
                  <PersonaIcon size={22} className={currentPersonaObj.accentText} />
                </div>
                {/* Live Online Badge */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 z-20">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#0c0c11]" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    {currentPersonaObj.name}
                    <span className="hidden sm:flex text-[11px] font-medium px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active Now
                    </span>
                  </h2>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs text-gray-400">
                  <span className="hidden sm:inline">{currentPersonaObj.tone}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="font-mono flex items-center gap-1">
                    <Clock size={11} className="text-gray-400" />
                    {formatSessionTime(sessionSeconds)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Mode & Utility Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Language Selector Pill */}
              <div className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-medium ${
                isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-gray-100 text-gray-700'
              }`}>
                <Globe size={13} className="text-purple-400" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as CompanionLanguage)}
                  className="bg-transparent focus:outline-none cursor-pointer text-xs"
                >
                  <option value="hinglish" className="bg-[#121218] text-white">Hinglish</option>
                  <option value="hindi" className="bg-[#121218] text-white">Hindi</option>
                  <option value="english" className="bg-[#121218] text-white">English</option>
                </select>
              </div>

              {/* View Mode Toggle: Text Chat vs 3D Voice Call */}
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'chat' ? 'voice' : 'chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${
                  viewMode === 'voice'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : isDark 
                    ? 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white' 
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
                title={viewMode === 'voice' ? "Switch to Text Messages" : "Switch to Immersive 3D Voice Call"}
              >
                {viewMode === 'voice' ? (
                  <>
                    <MessageSquare size={16} />
                    <span className="hidden sm:inline">Text View</span>
                  </>
                ) : (
                  <>
                    <PhoneCall size={16} className="text-purple-400 animate-pulse" />
                    <span className="hidden sm:inline">Voice Call</span>
                  </>
                )}
              </button>

              {/* Speaker Audio Voice Toggle */}
              <button
                type="button"
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled);
                  if (voiceEnabled) stopSpeaking();
                }}
                className={`p-2 rounded-xl border transition-all duration-200 ${
                  voiceEnabled 
                    ? (isDark ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700')
                    : (isDark ? 'border-white/10 text-gray-400 hover:text-white' : 'border-gray-200 text-gray-500 hover:text-gray-900')
                }`}
                title={voiceEnabled ? "Voice Speech Enabled (Click to mute speech)" : "Voice Speech Muted (Click to enable speech)"}
                aria-label="Toggle voice output"
              >
                {voiceEnabled ? <Volume2 size={17} className={isSpeaking ? "animate-pulse text-purple-400" : ""} /> : <VolumeX size={17} />}
              </button>

              {/* Clear conversation */}
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Reset current conversation?")) {
                      setMessages([]);
                      stopSpeaking();
                    }
                  }}
                  className={`p-2 rounded-xl border transition-colors ${
                    isDark ? 'border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/30' : 'border-gray-200 text-gray-500 hover:text-red-600'
                  }`}
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <Trash2 size={17} />
                </button>
              )}

              {/* Close Modal */}
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  onClose();
                }}
                className={`p-2 rounded-xl border transition-colors ${
                  isDark ? 'border-white/10 hover:bg-white/10 text-gray-300 hover:text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="Close companion"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ================= PERSONA SELECTION DOCK ================= */}
          <div className={`px-4 sm:px-6 py-2.5 border-b shrink-0 flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar z-10 ${
            isDark ? 'border-white/5 bg-[#0f0f14]' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'} shrink-0 mr-1`}>
                Persona:
              </span>
              {PERSONAS.map((p) => {
                const Icon = p.icon;
                const isSelected = persona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPersona(p.id);
                      stopSpeaking();
                    }}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 shrink-0 ${
                      isSelected 
                        ? p.activeRing
                        : isDark ? 'border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? p.accentText : 'opacity-70'} />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Debate Intensity Switcher */}
            {persona === 'debate' && (
              <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-white/10">
                <span className={`text-[11px] font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Debate Level:
                </span>
                {(['chill', 'balanced', 'fierce'] as DebateIntensity[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDebateIntensity(level)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase border transition-all ${
                      debateIntensity === level 
                        ? 'bg-rose-500 text-white border-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.4)]' 
                        : isDark ? 'border-white/10 text-gray-400 hover:text-white' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Speaking Indicator Bar in Chat Mode */}
          {isSpeaking && viewMode === 'chat' && (
            <div className="flex items-center justify-between px-6 py-2 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 border-b border-purple-500/30 text-xs text-purple-200 animate-pulse shrink-0">
              <div className="flex items-center gap-2">
                <Radio size={15} className="animate-spin text-purple-400" />
                <span className="font-medium truncate max-w-[180px] sm:max-w-none">Companion is speaking...</span>
              </div>
              <button
                type="button"
                onClick={stopSpeaking}
                className="px-2.5 py-0.5 rounded-lg bg-purple-500/30 hover:bg-purple-500/50 border border-purple-500/40 text-purple-200 text-[11px] font-semibold cursor-pointer transition-colors"
              >
                Stop Voice
              </button>
            </div>
          )}

          {/* ================= MAIN CONTENT BODY ================= */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 hide-scrollbar">
            {viewMode === 'voice' ? (
              <VoiceVisualizer 
                isDark={isDark}
                isListening={isListening}
                isSpeaking={isSpeaking}
                isLoading={isLoading}
                persona={persona}
                onToggleMic={handleVoiceListen}
                onSwitchToChat={() => setViewMode('chat')}
                voiceEnabled={voiceEnabled}
                onToggleVoice={() => {
                  setVoiceEnabled(!voiceEnabled);
                  if (voiceEnabled) stopSpeaking();
                }}
                PersonaIcon={PersonaIcon}
                transcript={input}
                lastReply={lastModelReply}
              />
            ) : messages.length === 0 ? (
              /* ================= EMPTY STATE / WELCOME EXPERIENCE ================= */
              <div className="flex flex-col items-center justify-center min-h-full text-center max-w-xl mx-auto py-6 sm:py-8 select-none">
                
                {/* 3D Animated Avatar Core */}
                <div className="relative mb-5">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr ${currentPersonaObj.gradient} p-[2px] shadow-2xl`}
                  >
                    <div className={`w-full h-full rounded-full flex items-center justify-center backdrop-blur-xl ${
                      isDark ? 'bg-[#101016]' : 'bg-white'
                    }`}>
                      <PersonaIcon size={38} className={currentPersonaObj.accentText} />
                    </div>
                  </motion.div>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mb-2">
                  {persona === 'debate' 
                    ? 'Ready for a battle of intellect & logic?' 
                    : persona === 'roast' 
                    ? 'Ready for some savage & playful roasts?' 
                    : persona === 'mentor' 
                    ? 'Ready for brutal truth and life direction?' 
                    : 'Hey buddy, what’s on your mind today?'}
                </h3>
                
                <p className={`text-xs sm:text-sm mb-6 max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                  {currentPersonaObj.desc}
                </p>

                {/* Suggested Conversation Starter Cards */}
                <div className="w-full space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Suggested Starters
                    </span>
                    <span className="text-[11px] text-purple-400 font-medium">
                      Click any topic to talk
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                    {PROMPTS_BY_PERSONA[persona].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(item.text)}
                        className={`p-3.5 rounded-2xl border text-xs leading-relaxed transition-all text-left group hover:scale-[1.02] active:scale-[0.98] ${
                          isDark 
                            ? 'border-white/10 bg-[#15151e]/80 hover:bg-[#1a1a26] hover:border-purple-500/40 text-gray-200 hover:text-white shadow-md' 
                            : 'border-gray-200 bg-white hover:bg-purple-50 hover:border-purple-300 text-gray-800 hover:text-purple-900 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-base">{item.icon}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${currentPersonaObj.badgeBg}`}>
                            {item.label}
                          </span>
                        </div>
                        <p className="font-medium line-clamp-2 text-gray-300 group-hover:text-white transition-colors">
                          {item.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ================= MESSAGE THREAD STREAM ================= */
              <motion.div 
                className="w-full flex flex-col gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.1 }
                  }
                }}
              >
                <AnimatePresence>
                {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isThisSpeaking = isSpeaking && speakingMessageIndex === index;
                const timeString = msg.timestamp 
                  ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <motion.div
                    key={index}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
                    }}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group w-full`}
                  >
                    <div className={`flex items-start gap-2.5 max-w-[92%] sm:max-w-[82%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      
                      {/* Avatar */}
                      {!isUser ? (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border mt-1 shadow-md ${
                          isDark ? 'bg-[#181822] border-white/10 text-purple-400' : 'bg-white border-gray-200 text-purple-600'
                        }`}>
                          <PersonaIcon size={16} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 text-white text-xs font-bold mt-1 shadow-md">
                          {userName ? userName.slice(0, 1).toUpperCase() : 'U'}
                        </div>
                      )}

                      {/* Message Capsule */}
                      <div className="flex flex-col gap-1">
                        <div
                          className={`relative px-4 py-3 rounded-2xl text-sm sm:text-[14.5px] leading-relaxed shadow-md ${
                            isUser
                              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white rounded-tr-none'
                              : isDark
                              ? 'bg-[#181822] border border-white/10 text-gray-100 rounded-tl-none'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {/* Interactive Voice Player Waveform Bar for Companion Response */}
                          {!isUser && msg.content && (
                            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isThisSpeaking) {
                                    stopSpeaking();
                                  } else {
                                    speakText(msg.content, index);
                                  }
                                }}
                                className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                                  isThisSpeaking
                                    ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)] animate-pulse'
                                    : 'bg-white/5 border-white/10 hover:bg-white/15 text-purple-300'
                                }`}
                              >
                                {isThisSpeaking ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                                <span>{isThisSpeaking ? 'Playing Voice...' : 'Play Voice Note'}</span>
                                {isThisSpeaking && (
                                  <div className="flex items-center gap-0.5 ml-1">
                                    {[12, 18, 24, 14, 20].map((h, i) => (
                                      <motion.span
                                        key={i}
                                        animate={{ height: ['4px', `${h}px`, '4px'] }}
                                        transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                                        className="w-1 bg-white rounded-full inline-block"
                                      />
                                    ))}
                                  </div>
                                )}
                              </button>

                              {/* Copy & Utility Actions */}
                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                {(() => {
                                  const words = msg.content.trim().split(/\s+/).filter(Boolean).length;
                                  if (words < 70) return null;
                                  const readTime = `${Math.max(1, Math.round(words / 200))} min read`;
                                  return (
                                    <div
                                      title={`${words} words · Estimated reading time (~200 wpm)`}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border border-white/10 bg-white/5 text-gray-400"
                                    >
                                      <Clock size={11} className="text-purple-400 shrink-0" />
                                      <span>{readTime}</span>
                                    </div>
                                  );
                                })()}

                                <button
                                  type="button"
                                  onClick={() => handleCopy(msg.content, index)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all active:scale-95 cursor-pointer ${
                                    copiedIndex === index
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                      : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/10'
                                  }`}
                                  title="Copy to clipboard"
                                  aria-label="Copy to clipboard"
                                >
                                  {copiedIndex === index ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                  <span>{copiedIndex === index ? 'Copied!' : 'Copy'}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Quick Emoji Reaction Pill */}
                          {msg.reaction && (
                            <div className="absolute -bottom-2.5 right-3 px-2 py-0.5 rounded-full bg-[#20202e] border border-white/20 text-xs shadow-md">
                              {msg.reaction}
                            </div>
                          )}
                        </div>

                        {/* Interactive Reaction & Timestamp Bar below message */}
                        <div className={`flex items-center gap-2 px-1 text-[11px] ${isUser ? 'justify-end text-gray-400' : 'justify-start text-gray-400'}`}>
                          <span>{timeString}</span>
                          {!isUser && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                              {['👍', '❤️', '🔥', '💡', '👏', '😂'].map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleReact(index, emoji)}
                                  className="hover:scale-125 transition-transform"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Live Typing & Thinking Indicator */}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 text-xs text-purple-300 pl-11 py-2"
              >
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                      className="w-2 h-2 rounded-full bg-purple-400"
                    />
                  ))}
                </div>
                <span className="font-medium italic truncate max-w-[200px] sm:max-w-none">
                  {persona === 'debate' 
                    ? 'Formulating razor-sharp counter argument...' 
                    : persona === 'mentor'
                    ? 'Structuring direct life advice...'
                    : persona === 'roast'
                    ? 'Cooking up a savage witty comeback...'
                    : 'Typing thoughts with care...'}
                </span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ================= FOOTER / INPUT BAR ================= */}
          {viewMode === 'chat' && (
            <div className={`p-3 sm:p-4 border-t shrink-0 backdrop-blur-xl z-20 ${
              isDark ? 'border-white/10 bg-[#101017]/95' : 'border-gray-200 bg-white/95'
            }`}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative flex items-center gap-2.5 max-w-4xl mx-auto"
              >
                {/* Voice Input Mic Trigger */}
                <button
                  type="button"
                  onClick={handleVoiceListen}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 active:scale-95 flex items-center justify-center shrink-0 ${
                    isListening
                      ? 'bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse'
                      : isDark 
                      ? 'border-white/10 hover:bg-white/10 text-gray-300 hover:text-white' 
                      : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                  }`}
                  title={isListening ? "Listening... (Tap to stop)" : "Tap to Speak Voice (Hindi/English)"}
                  aria-label="Voice input"
                >
                  {isListening ? <MicOff size={19} /> : <Mic size={19} />}
                </button>

                {/* Auto-Resizing Text Input Container */}
                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    placeholder={
                      isListening
                        ? "Listening to your voice... Speak now!"
                        : currentPersonaObj.placeholder
                    }
                    className={`w-full py-3.5 pl-4 pr-12 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none max-h-32 transition-all leading-relaxed ${
                      isDark
                        ? 'bg-[#181822] border-white/10 text-white placeholder-gray-400'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                {/* Send or Stop Button */}
                {isLoading ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="p-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-transform active:scale-95 shadow-lg shrink-0 flex items-center justify-center"
                    title="Stop generation"
                  >
                    <Square size={18} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className={`p-3.5 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg shrink-0 flex items-center justify-center ${
                      input.trim()
                        ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                        : isDark ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                )}
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
