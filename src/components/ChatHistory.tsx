import React, { useEffect, useRef, useState, useCallback } from 'react';
import Markdown from 'react-markdown';
import { Bot, User, Copy, Check, X, Search, Globe, FileText, ArrowUp, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { RealisticEmoji, REALISTIC_EMOJIS } from './RealisticEmoji';

export interface Message {
  role: 'user' | 'model';
  content: string;
  mode?: 'online' | 'offline';
  image?: string;
}

interface ChatHistoryProps {
  messages: Message[];
  isLoading: boolean;
  isDark: boolean;
  onSearchImage?: (image: string, promptText: string) => void;
}

function CodeCopyButton({ text, isDark }: { text: string; isDark: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={handleCopyCode}
      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
        copied
          ? 'text-emerald-400 bg-emerald-500/10'
          : isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
      }`}
      title="Copy code to clipboard"
      aria-label="Copy code to clipboard"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

function CodeBlock({ code, language, isDark }: { code: string; language: string; isDark: boolean }) {
  return (
    <div className={`relative my-3 rounded-xl overflow-hidden border shadow-[0_8px_24px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.08)] ${
      isDark ? 'border-white/10 bg-[#0d0d0f]' : 'border-gray-200 bg-gray-900 text-gray-100'
    }`}>
      <div className={`flex items-center justify-between px-3.5 py-1.5 text-xs border-b ${
        isDark ? 'bg-white/[0.04] border-white/10 text-gray-400' : 'bg-black/40 border-white/10 text-gray-300'
      }`}>
        <span className="font-mono text-[11px] uppercase tracking-wider">{language || 'code'}</span>
        <CodeCopyButton text={code} isDark={true} />
      </div>
      <pre className="p-3.5 overflow-x-auto text-[13px] font-mono leading-relaxed !my-0 !bg-transparent text-gray-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Floating WhatsApp / iMessage / Telegram style long-press contextual menu.
 * Contains both realistic 3D emoji reactions AND quick message actions (Copy).
 */
function LongPressFloatingMenu({
  isDark,
  isUser,
  messageText,
  activeReaction,
  onSelectReaction,
  onClose
}: {
  isDark: boolean;
  isUser: boolean;
  messageText: string;
  activeReaction?: string;
  onSelectReaction: (key: string) => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(messageText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = messageText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(30);
        } catch {}
      }
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 900);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.65, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: 10 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className={`absolute z-40 -top-16 ${
        isUser ? 'right-0 sm:right-1' : 'left-0 sm:left-1'
      } flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-full shadow-2xl backdrop-blur-xl border select-none ${
        isDark
          ? 'bg-zinc-900/95 border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.8)] text-white'
          : 'bg-white/95 border-zinc-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.2)] text-zinc-900'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 3D Realistic Emojis */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {REALISTIC_EMOJIS.map(({ key, label }, index) => {
          const isSelected = activeReaction === key;
          return (
            <motion.button
              key={key}
              type="button"
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 22,
                delay: index * 0.03
              }}
              whileHover={{ scale: 1.35, y: -4 }}
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectReaction(key);
                onClose();
              }}
              className={`relative p-1.5 sm:p-2 rounded-full cursor-pointer transition-colors duration-150 flex items-center justify-center group ${
                isSelected
                  ? isDark
                    ? 'bg-white/20 ring-2 ring-white/50'
                    : 'bg-zinc-200 ring-2 ring-zinc-500'
                  : 'hover:bg-white/10 active:bg-white/20'
              }`}
              title={label}
              aria-label={`React with ${label}`}
            >
              <RealisticEmoji name={key} size={25} className="transition-transform duration-200 group-hover:scale-110" />

              {/* Tooltip on hover */}
              <span
                className={`absolute -bottom-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap z-50 ${
                  isDark ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' : 'bg-zinc-900 text-white'
                }`}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Elegant Separator */}
      <div className={`h-6 w-[1px] mx-1 shrink-0 ${isDark ? 'bg-white/15' : 'bg-zinc-200'}`} />

      {/* Integrated Copy Action */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleCopy}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors shrink-0 ${
          copied
            ? 'bg-emerald-500 text-white shadow-sm'
            : isDark
            ? 'bg-white/10 hover:bg-white/20 text-white'
            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
        }`}
        title="Copy text"
        aria-label="Copy text"
      >
        {copied ? (
          <>
            <Check size={14} className="stroke-[2.5]" />
            <span className="font-semibold text-[11px]">Copied!</span>
          </>
        ) : (
          <>
            <Copy size={13} className="opacity-80" />
            <span className="text-[11px] font-medium">Copy</span>
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

export default function ChatHistory({ messages, isLoading, isDark, onSearchImage }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [reactions, setReactions] = useLocalStorage<Record<string, string>>('app-chat-reactions', {});

  // Active message whose long-press contextual menu is open
  const [activeMenuKey, setActiveMenuKey] = useState<string | null>(null);

  // Recent reaction celebration/feedback animation state
  const [celebrationKey, setCelebrationKey] = useState<{ key: string; emojiKey: string } | null>(null);

  // Enlarged lightbox image modal state & query
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  const handleExecuteImageSearch = (imageTarget: string, customQuery?: string) => {
    const query = customQuery?.trim() || "What is in this image? Search and analyze what it shows in detail.";
    if (onSearchImage) {
      onSearchImage(imageTarget, query);
    } else {
      window.dispatchEvent(new CustomEvent('search-with-image', {
        detail: { image: imageTarget, text: query }
      }));
    }
    setPreviewModalImage(null);
    setModalSearchQuery('');
  };

  // Long press timer ref & touch position tracker
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Close long-press menu on clicking anywhere outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.long-press-menu-container')) {
        setActiveMenuKey(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('touchstart', handleOutsideClick, { passive: true });
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const handleReaction = useCallback((msgKey: string, emojiKey: string) => {
    setReactions((prev) => {
      const next = { ...(prev || {}) };
      if (next[msgKey] === emojiKey) {
        delete next[msgKey];
      } else {
        next[msgKey] = emojiKey;
      }
      return next;
    });

    setCelebrationKey({ key: msgKey, emojiKey });
    setTimeout(() => {
      setCelebrationKey((cur) => (cur?.key === msgKey ? null : cur));
    }, 1200);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {}
    }
  }, [setReactions]);

  // Long-press start handler for chat bubbles (Touch & Mouse)
  const startLongPress = (msgKey: string, clientX: number, clientY: number) => {
    touchStartPosRef.current = { x: clientX, y: clientY };

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    longPressTimerRef.current = setTimeout(() => {
      setActiveMenuKey(msgKey);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch {}
      }
    }, 450); // 450ms long press threshold
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || !e.touches[0]) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPosPosRef(e));
    if (dx > 10 || dy > 10) {
      cancelLongPress();
    }
  };

  const touchStartPosPosRef = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || !e.touches[0]) return 0;
    return touchStartPosRef.current.y;
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const isWaitingForResponse = isLoading && (
    messages.length === 0 || 
    messages[messages.length - 1].role === 'user' ||
    (messages[messages.length - 1].role === 'model' && messages[messages.length - 1].content === '')
  );

  return (
    <motion.div 
      className="w-full max-w-3xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 pb-28 md:pb-36 flex flex-col gap-5 sm:gap-7"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      <AnimatePresence>
        {messages.map((msg, idx) => {
          if (msg.role === 'model' && !msg.content) return null;
          
          const displayContent = msg.role === 'model' 
            ? msg.content.replace(/<preview-code>[\s\S]*?(?:<\/preview-code>|$)/g, '').trim()
            : msg.content;
          
          const messageKey = `msg_${idx}_${displayContent.slice(0, 32)}`;
          const activeReaction = reactions ? reactions[messageKey] : undefined;
          const isMenuOpen = activeMenuKey === messageKey;
          const isUser = msg.role === 'user';
          const isCelebrating = celebrationKey?.key === messageKey;

          return (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 15, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] } }
              }}
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2.5 sm:gap-3 max-w-[92%] sm:max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar: User icon or App's Own Logo */}
                {isUser ? (
                  <div className={`flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center self-start mt-0.5 transition-transform duration-200 hover:scale-105 backdrop-blur-xl ${
                    isDark
                      ? 'bg-gradient-to-b from-zinc-700/90 via-zinc-800/95 to-zinc-950 border border-white/25 shadow-[0_4px_16px_rgba(0,0,0,0.8),0_0_12px_rgba(255,255,255,0.08),inset_0_1px_1.5px_rgba(255,255,255,0.35)]'
                      : 'bg-gradient-to-b from-zinc-800 to-zinc-950 border border-zinc-700 shadow-md'
                  }`}>
                    <User size={15} className="text-zinc-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                  </div>
                ) : (
                  <div className="relative flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center self-start mt-0.5">
                    <motion.img
                      src="/logo.svg"
                      alt="Nexus AI"
                      animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                      transition={{
                        rotate: { duration: 10, ease: "linear", repeat: Infinity },
                        scale: { duration: 3.5, ease: "easeInOut", repeat: Infinity }
                      }}
                      className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
                    />
                  </div>
                )}
                
                {/* Message Bubble + Floating Menu Container */}
                <div className="relative group/bubble long-press-menu-container">
                  {/* Floating Long-Press Contextual Menu: Realistic Emojis + Copy */}
                  <AnimatePresence>
                    {isMenuOpen && (
                      <LongPressFloatingMenu
                        isDark={isDark}
                        isUser={isUser}
                        messageText={displayContent}
                        activeReaction={activeReaction}
                        onSelectReaction={(emojiKey) => handleReaction(messageKey, emojiKey)}
                        onClose={() => setActiveMenuKey(null)}
                      />
                    )}
                  </AnimatePresence>

                  {/* Bubble Container: 3D Depth, Long-press triggerable */}
                  <div 
                    onMouseDown={(e) => startLongPress(messageKey, e.clientX, e.clientY)}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onTouchStart={(e) => {
                      if (e.touches[0]) {
                        startLongPress(messageKey, e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchEnd={cancelLongPress}
                    onTouchCancel={cancelLongPress}
                    onTouchMove={handleTouchMove}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setActiveMenuKey(messageKey);
                    }}
                    className={`relative px-3.5 py-2.5 sm:px-4 sm:py-3.5 rounded-2xl select-text transition-all duration-200 cursor-default ${
                      isUser
                        ? isDark
                          ? 'bg-gradient-to-b from-white/[0.14] via-zinc-800/90 to-zinc-900/95 text-white rounded-tr-sm backdrop-blur-2xl border border-white/20 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.85),0_0_18px_rgba(255,255,255,0.06),inset_0_1px_1.5px_0_rgba(255,255,255,0.3),inset_0_-1px_1px_0_rgba(0,0,0,0.4)] active:scale-[0.99]'
                          : 'bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 text-white rounded-tr-sm border border-zinc-700 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.25),inset_0_1px_1px_0_rgba(255,255,255,0.2)] active:scale-[0.99]'
                        : isDark 
                          ? 'bg-gradient-to-b from-zinc-800/90 to-zinc-900/95 text-white rounded-tl-sm backdrop-blur-2xl border border-white/15 shadow-[0_14px_40px_-6px_rgba(0,0,0,0.65),0_4px_16px_-2px_rgba(0,0,0,0.45),inset_0_1px_1.5px_0_rgba(255,255,255,0.16),inset_0_-1px_1px_0_rgba(0,0,0,0.5)] active:scale-[0.99] hover:shadow-[0_18px_45px_-6px_rgba(0,0,0,0.75),inset_0_1px_1.5px_0_rgba(255,255,255,0.2)]' 
                          : 'bg-gradient-to-b from-white to-zinc-50/95 border border-zinc-200/90 text-gray-900 rounded-tl-sm shadow-[0_10px_32px_-5px_rgba(0,0,0,0.08),0_4px_12px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,1)] active:scale-[0.99] hover:shadow-[0_14px_36px_-5px_rgba(0,0,0,0.12)]'
                    }`}
                  >
                    {isUser ? (
                      <div className="flex flex-col gap-2">
                        {msg.image && (
                          <div className="relative group/img overflow-hidden rounded-xl border border-white/20 max-w-sm shadow-lg bg-black/40">
                            <img 
                              src={msg.image} 
                              alt="Visual Search Attachment" 
                              className="max-h-64 w-auto object-cover rounded-xl cursor-zoom-in hover:brightness-105 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewModalImage(msg.image!);
                              }}
                            />
                            {/* Interactive Quick Search Pill on the image */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewModalImage(msg.image!);
                              }}
                              className="absolute bottom-2 left-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/90 hover:bg-emerald-500 text-white shadow-lg backdrop-blur-md border border-white/20 cursor-pointer transition-transform active:scale-95 group-hover/img:scale-105"
                              title="Click to search about this image"
                            >
                              <Search size={12} strokeWidth={2.5} />
                              <span>Search Image 🔍</span>
                            </button>
                          </div>
                        )}
                        {displayContent && (
                          <p className="whitespace-pre-wrap text-[14px] sm:text-[15px] leading-relaxed">{displayContent}</p>
                        )}
                      </div>
                    ) : (
                      <div className="markdown-body text-[14px] sm:text-[15px] leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:bg-black/20 prose-pre:p-2 prose-pre:rounded-lg pt-0.5">
                        <Markdown
                          components={{
                            a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                            code: ({ node, inline, className, children, ...props }: any) => {
                              const codeText = String(children).replace(/\n$/, '');
                              const match = /language-(\w+)/.exec(className || '');
                              const language = match ? match[1] : '';
                              
                              if (!inline && (match || codeText.includes('\n'))) {
                                return <CodeBlock code={codeText} language={language} isDark={isDark} />;
                              }
                              return <code className={className} {...props}>{children}</code>;
                            }
                          }}
                        >
                          {displayContent || "*(Generating preview...)*"}
                        </Markdown>
                      </div>
                    )}
                  </div>

                  {/* Active Reaction Badge (Stuck to bottom edge of bubble like WhatsApp/Messenger) */}
                  {activeReaction && (
                    <motion.div
                      layout
                      initial={{ scale: 0, y: 4 }}
                      animate={{ scale: isCelebrating ? 1.25 : 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className={`absolute -bottom-3 ${
                        isUser ? 'right-3' : 'left-3'
                      } z-20 flex items-center gap-1 px-2 py-0.5 rounded-full cursor-pointer transition-transform duration-150 active:scale-90 shadow-md border ${
                        isDark 
                          ? 'bg-zinc-800/95 border-zinc-700 text-zinc-200 shadow-black/50 hover:bg-zinc-700' 
                          : 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-300/50 hover:bg-zinc-50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Clicking current badge opens the long-press menu to change reaction or copy
                        setActiveMenuKey((prev) => (prev === messageKey ? null : messageKey));
                      }}
                      title="Click to change reaction or copy"
                    >
                      <RealisticEmoji name={activeReaction} size={16} />
                      <span className="text-[10px] font-semibold text-zinc-300">1</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {isWaitingForResponse && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 15, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } }
            }}
            className="flex w-full justify-start"
          >
            <div className="flex gap-2.5 sm:gap-3 max-w-[92%] sm:max-w-[85%] md:max-w-[75%] flex-row items-end">
              {/* Animated Avatar Container with App Logo */}
              <div className="relative flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 mb-1 flex items-center justify-center">
                <div className="avatar-pulse-ring" />
                <div className="avatar-breathe relative h-full w-full flex items-center justify-center z-10">
                  <motion.img
                    src="/logo.svg"
                    alt="Nexus AI"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                    className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
                  />
                </div>
              </div>
              
              {/* Typing Bubble with 3D Dots and Liquid Shimmer */}
              <div className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl rounded-tl-[4px] flex items-center justify-center gap-1.5 h-[42px] sm:h-[46px] min-w-[68px] sm:min-w-[72px] overflow-hidden ${
                isDark 
                  ? 'shimmer-dark border border-white/15 shadow-[0_14px_36px_-6px_rgba(0,0,0,0.65),inset_0_1px_1.5px_rgba(255,255,255,0.2)]' 
                  : 'shimmer-light border border-zinc-200/90 shadow-[0_10px_28px_-5px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,1)]'
              }`}>
                <div className="flex gap-1.5 items-end justify-center h-full pt-1 relative z-10">
                  <div className="dot-3d-container">
                    <div className="dot-shadow delay-1" />
                    <div className="dot-3d delay-1" />
                  </div>
                  <div className="dot-3d-container">
                    <div className="dot-shadow delay-2" />
                    <div className="dot-3d delay-2" />
                  </div>
                  <div className="dot-3d-container">
                    <div className="dot-shadow delay-3" />
                    <div className="dot-3d delay-3" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={bottomRef} className="h-2" />

      {/* Visual Search & Image Intelligence Lightbox Modal */}
      <AnimatePresence>
        {previewModalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewModalImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 350 }}
              className={`relative w-full max-w-2xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl border flex flex-col ${
                isDark ? 'bg-zinc-950/95 border-zinc-800 text-white' : 'bg-white/95 border-zinc-200 text-zinc-900'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Search size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                      Visual Search & Analysis
                    </h3>
                    <p className="text-[10px] text-zinc-400">Click any prompt below or ask your own question about this image</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewModalImage(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Image Preview Viewport */}
              <div className="relative flex-1 bg-black/80 flex items-center justify-center overflow-hidden min-h-[220px] max-h-[46vh] p-2">
                <img
                  src={previewModalImage}
                  alt="Target visual search query"
                  className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                />
              </div>

              {/* Visual Search Actions & Input Dock */}
              <div className={`p-4 sm:p-5 flex flex-col gap-3 border-t shrink-0 ${
                isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                {/* 1-Click Search Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: "🔍 What is this? Identify", prompt: "What is in this image? Search and analyze what it shows in detail." },
                    { label: "🌐 Search Live Web", prompt: "Search the live web for latest information, background, and history of this image." },
                    { label: "📄 Read Text / OCR", prompt: "Extract and transcribe all visible text, numbers, and labels from this image." },
                    { label: "🏷️ Identify Objects", prompt: "Identify all landmarks, entities, products, or objects visible in this image." }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleExecuteImageSearch(previewModalImage, preset.prompt)}
                      className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                        isDark 
                          ? 'border-zinc-700 hover:border-emerald-500/70 bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-emerald-500/10' 
                          : 'border-zinc-300 hover:border-emerald-500 bg-white text-zinc-700 hover:text-zinc-900 hover:bg-emerald-50'
                      }`}
                    >
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Search Question Input */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleExecuteImageSearch(previewModalImage, modalSearchQuery);
                        }
                      }}
                      placeholder="Ask or search anything about this image..."
                      className={`w-full rounded-2xl py-2.5 pl-4 pr-10 text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                        isDark 
                          ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' 
                          : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExecuteImageSearch(previewModalImage, modalSearchQuery)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Search size={14} strokeWidth={2.5} />
                    <span>Search</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
