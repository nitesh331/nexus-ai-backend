import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Mic, 
  ArrowUp, 
  Paperclip, 
  Camera, 
  Image as ImageIcon, 
  X, 
  Loader2 
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import CameraCaptureModal from './CameraCaptureModal';

interface ChatInputProps {
  isDark: boolean;
  onSend: (text: string, image?: string) => void;
  onStop?: () => void;
  isLoading: boolean;
  workspaceId?: string;
}

const WORKSPACE_PHRASES: Record<string, string[]> = {
  'default': [
    "Ask anything or search image...",
    "Upload photo to visual search...",
    "Identify object or landmark...",
    "Search the live web for...",
    "Analyze diagram or document..."
  ],
  'chat': [
    "Ask anything or search image...",
    "Upload photo to visual search...",
    "Identify object or landmark...",
    "Search the live web for...",
    "Analyze diagram or document..."
  ],
  'deep-search': [
    "Ask Atal global intelligence...",
    "Investigate AI & market trends...",
    "Cross-verify live web sources...",
    "Build a verified research report...",
    "Explore global trends & data..."
  ],
  'web-design': [
    "Design a modern landing page...",
    "Build a Bento grid dashboard...",
    "Create Tailwind UI components...",
    "Design a SaaS pricing section...",
    "Refactor React UI & styling..."
  ],
  'notes': [
    "Create structured study notes...",
    "Summarize topic for exam prep...",
    "Generate study flashcards & Q&A...",
    "Create a practice MCQ exam quiz...",
    "Explain concepts with examples..."
  ],
  'image-video': [
    "Ask Zenra for a 4K cinematic scene...",
    "Create neon cyberpunk artwork...",
    "Design a 3D studio render...",
    "Write an AI video motion prompt...",
    "Upload image to restyle or edit..."
  ]
};

// Helper to downscale large camera / phone images for rapid upload & crisp vision analysis
const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1400;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function ChatInput({ 
  isDark, 
  onSend, 
  onStop, 
  isLoading, 
  workspaceId = 'default' 
}: ChatInputProps) {
  const [text, setText] = useLocalStorage(`workspace-input-${workspaceId}`, '');
  const [enhancePromptEnabled] = useLocalStorage('setting-prompt-enhance', false);
  const [enterToSend] = useLocalStorage<boolean>('setting-enter-to-send', true);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Typewriter effect state
  const [placeholderText, setPlaceholderText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const activePhrases = WORKSPACE_PHRASES[workspaceId] || WORKSPACE_PHRASES['default'];

  // Reset typewriter state when workspaceId changes
  useEffect(() => {
    setPlaceholderText("");
    setPhraseIndex(0);
    setIsDeleting(false);
  }, [workspaceId]);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSpeechError('Voice input is not supported on this browser.');
      setTimeout(() => setSpeechError(null), 3000);
      return;
    }

    if (isListening) return;

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setText(transcript);
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          setSpeechError("Mic blocked. Please open app in a New Tab to use voice features.");
          setTimeout(() => setSpeechError(null), 5000);
        }
      };
      
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (err) {
      console.warn("Speech error:", err);
      setIsListening(false);
      setSpeechError("Mic blocked. Please open app in a New Tab.");
      setTimeout(() => setSpeechError(null), 5000);
    }
  };

  useEffect(() => {
    if (isLoading || attachedImage) return; // Pause animation while loading or image attached

    const currentPhrase = activePhrases[phraseIndex % activePhrases.length];
    let timer: NodeJS.Timeout;

    if (isDeleting) {
      if (placeholderText === "") {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % activePhrases.length);
        timer = setTimeout(() => {}, 500);
      } else {
        timer = setTimeout(() => {
          setPlaceholderText(currentPhrase.substring(0, placeholderText.length - 1));
        }, 50);
      }
    } else {
      if (placeholderText === currentPhrase) {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      } else {
        timer = setTimeout(() => {
          setPlaceholderText(currentPhrase.substring(0, placeholderText.length + 1));
        }, 75);
      }
    }

    return () => clearTimeout(timer);
  }, [placeholderText, isDeleting, phraseIndex, isLoading, attachedImage, activePhrases]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  // Custom event listener for populating input and handling image search triggers
  useEffect(() => {
    const handlePopulate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.workspaceId === workspaceId && customEvent.detail?.text) {
        setText(customEvent.detail.text);
      }
    };

    const handleSearchWithImage = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.image) {
        setAttachedImage(customEvent.detail.image);
        setAttachedImageName('Visual Search Target');
        if (customEvent.detail?.text) {
          setText(customEvent.detail.text);
        }
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 120);
      }
    };

    const handleTriggerCamera = () => {
      setIsCameraModalOpen(true);
    };

    const handleTriggerUpload = () => {
      fileInputRef.current?.click();
    };

    window.addEventListener('populate-chat-input', handlePopulate);
    window.addEventListener('search-with-image', handleSearchWithImage);
    window.addEventListener('trigger-camera-capture', handleTriggerCamera);
    window.addEventListener('trigger-image-upload', handleTriggerUpload);

    return () => {
      window.removeEventListener('populate-chat-input', handlePopulate);
      window.removeEventListener('search-with-image', handleSearchWithImage);
      window.removeEventListener('trigger-camera-capture', handleTriggerCamera);
      window.removeEventListener('trigger-image-upload', handleTriggerUpload);
    };
  }, [workspaceId, setText]);

  const handleImageFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setIsProcessingImage(true);
    try {
      const dataUrl = await processImageFile(file);
      setAttachedImage(dataUrl);
      setAttachedImageName(file.name || 'Captured Photo');
      // Focus textarea so user can immediately type questions about the image
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } catch (err) {
      console.error('Error processing image:', err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleImageFile(file);
            return;
          }
        }
      }
    }
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
    setAttachedImageName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e?: React.FormEvent | React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentPrompt = text.trim();
    const currentImage = attachedImage;

    // Allowed if text exists OR an image is attached
    if ((!currentPrompt && !currentImage) || isLoading || isEnhancing || isProcessingImage) return;

    setText(''); // Immediately clear input box
    setAttachedImage(null);
    setAttachedImageName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';

    const finalQuery = currentPrompt || (currentImage ? "What is in this image? Search and analyze what it shows in detail." : "");

    if (enhancePromptEnabled && !currentImage && currentPrompt) {
      setIsEnhancing(true);
      try {
        const res = await fetch('/api/enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: currentPrompt })
        });
        const data = await res.json();
        if (data.text) {
          onSend(data.text, currentImage || undefined);
        } else {
          onSend(finalQuery, currentImage || undefined);
        }
      } catch (err) {
        console.error('Failed to enhance prompt', err);
        onSend(finalQuery, currentImage || undefined);
      } finally {
        setIsEnhancing(false);
      }
    } else {
      onSend(finalQuery, currentImage || undefined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (enterToSend) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit(e);
      }
    } else {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit(e);
      }
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 w-full px-3 sm:px-4 md:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-8 pointer-events-none bg-gradient-to-t ${
      workspaceId === 'web-design'
        ? (isDark
            ? 'from-black/95 via-black/60 to-transparent'
            : 'from-black/15 via-black/5 to-transparent')
        : isDark
          ? 'from-[#030305]/90 via-[#030305]/45 to-transparent'
          : 'from-[#f8f2ff]/75 via-[#fff5fa]/35 to-transparent'
    } z-20`}>
      <div className="max-w-3xl mx-auto relative pointer-events-auto">
        <form onSubmit={handleSubmit} className="relative w-full flex flex-col">
          {speechError && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500/90 text-white text-xs rounded-full shadow-lg backdrop-blur-sm pointer-events-none">
              {speechError}
            </div>
          )}

          {/* Hidden File Pickers: Gallery & Camera Capture */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            capture="environment"
          />

          {/* Attached Image Interactive Preview Dock */}
          {attachedImage && (
            <div className={`mb-2 p-2 sm:p-2.5 rounded-2xl flex items-center justify-between border backdrop-blur-2xl shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 ${
              isDark 
                ? `bg-zinc-900/95 ${workspaceId === 'notes' ? 'border-amber-500/30' : workspaceId === 'web-design' ? 'border-white/30' : 'border-purple-500/30'} text-white shadow-black/60` 
                : `bg-white/95 ${workspaceId === 'notes' ? 'border-amber-500/30' : workspaceId === 'web-design' ? 'border-zinc-300' : 'border-purple-300/80'} text-gray-900 shadow-purple-200/50`
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`relative h-11 w-11 sm:h-12 sm:w-12 rounded-xl overflow-hidden border ${workspaceId === 'notes' ? 'border-amber-500/40' : workspaceId === 'web-design' ? 'border-white/40' : 'border-purple-500/40'} shrink-0 shadow-sm`}>
                  <img src={attachedImage} alt="Visual Search Target" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-bold ${workspaceId === 'notes' ? 'text-amber-400' : workspaceId === 'web-design' ? 'text-white' : 'text-purple-500'} uppercase tracking-wider`}>Image Search</span>
                    <span className="text-[10px] text-zinc-500 truncate max-w-[130px] sm:max-w-xs">{attachedImageName}</span>
                  </div>
                  {/* Quick Smart Visual Prompts */}
                  <div className="flex items-center gap-1.5 mt-1 overflow-x-auto hide-scrollbar">
                    {["What is this?", "Search details", "Identify object", "Extract text"].map((promptLabel) => (
                      <button
                        key={promptLabel}
                        type="button"
                        onClick={() => setText(promptLabel)}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                          isDark 
                            ? `border-zinc-700/80 ${workspaceId === 'notes' ? 'hover:border-amber-500/60' : workspaceId === 'web-design' ? 'hover:border-white/60' : 'hover:border-purple-500/60'} bg-zinc-800 text-zinc-300 hover:text-white` 
                            : `border-purple-200/80 ${workspaceId === 'notes' ? 'hover:border-amber-400' : workspaceId === 'web-design' ? 'hover:border-zinc-500' : 'hover:border-purple-400'} bg-purple-50/60 text-zinc-700 hover:text-purple-900`
                        }`}
                      >
                        {promptLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className={`p-1.5 rounded-full transition-colors cursor-pointer shrink-0 ml-2 ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-gray-100'
                }`}
                title="Remove attached image"
                aria-label="Remove attached image"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Main Input Bar */}
          <div className="relative w-full flex items-center group/input">
            {/* ============================================================
                UNDER-TEXTAREA MULTI-LAYERED OPTICAL LIGHT EFFECT (MATCHED TO BACKGROUND)
               ============================================================ */}
            <div className="pointer-events-none absolute -inset-x-2 -bottom-4 h-12 overflow-visible z-0 flex flex-col items-center justify-end">
              {/* Layer 1: Wide Breathing Ambient Underglow Pool */}
              <motion.div
                animate={{
                  opacity: isFocused || text.length > 0 || isLoading ? [0.68, 0.96, 0.68] : [0.42, 0.72, 0.42],
                  scaleX: isFocused || text.length > 0 ? [0.92, 1.04, 0.92] : [0.84, 0.96, 0.84],
                }}
                transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                className={`w-[88%] h-6 rounded-full blur-xl transition-all duration-500 ${
                  workspaceId === 'notes'
                    ? 'bg-gradient-to-r from-amber-500/35 via-yellow-400/55 to-orange-500/35'
                    : workspaceId === 'web-design'
                      ? 'bg-gradient-to-r from-black/60 via-zinc-950/85 to-black/60'
                      : 'bg-gradient-to-r from-[#7c3aed]/40 via-[#a855f7]/55 to-[#ec4899]/45'
                }`}
              />

              {/* Layer 2: Traveling Concentrated Core Beneath Rim */}
              <motion.div
                animate={{
                  x: ['-26%', '26%', '-26%'],
                  opacity: isFocused || text.length > 0 ? [0.78, 1, 0.78] : [0.55, 0.88, 0.55],
                }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute bottom-2.5 w-[48%] h-3.5 rounded-full blur-md ${
                  workspaceId === 'notes'
                    ? 'bg-gradient-to-r from-transparent via-amber-400/80 to-transparent'
                    : workspaceId === 'web-design'
                      ? 'bg-gradient-to-r from-transparent via-black/90 to-transparent'
                      : 'bg-gradient-to-r from-transparent via-[#c084fc]/85 to-transparent'
                }`}
              />

              {/* Layer 3: Sub-Surface Crisp Optical Reflection Line */}
              <motion.div
                animate={{
                  scaleX: [0.65, 0.95, 0.65],
                  opacity: isFocused ? [0.65, 0.98, 0.65] : [0.4, 0.72, 0.4],
                }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute bottom-3 w-[74%] h-[1.5px] rounded-full blur-[0.5px] ${
                  workspaceId === 'notes'
                    ? 'bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_12px_rgba(251,191,36,0.9)]'
                    : workspaceId === 'web-design'
                      ? 'bg-gradient-to-r from-transparent via-zinc-950 to-transparent shadow-[0_0_14px_rgba(0,0,0,0.95)]'
                      : 'bg-gradient-to-r from-transparent via-[#e879f9] to-transparent shadow-[0_0_14px_rgba(192,132,252,0.9)]'
                }`}
              />
            </div>

            {/* Layer 4: Clipped Bottom Rim Laser Shimmer Track directly on Textarea Bottom Edge */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden z-20">
              {/* Base Glowing Bottom Horizon Line */}
              <div
                className={`absolute bottom-0 left-3 right-3 h-[2px] transition-opacity duration-300 ${
                  isFocused || text.length > 0 ? 'opacity-100' : 'opacity-85'
                } ${
                  workspaceId === 'notes'
                    ? 'bg-gradient-to-r from-transparent via-amber-400/90 to-transparent shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                    : workspaceId === 'web-design'
                      ? 'bg-gradient-to-r from-black/35 via-zinc-950/95 to-black/35 shadow-[0_0_12px_rgba(0,0,0,0.9)]'
                      : 'bg-gradient-to-r from-[#7c3aed]/25 via-[#a855f7]/90 to-[#ec4899]/35 shadow-[0_0_12px_rgba(168,85,247,0.85)]'
                }`}
              />

              {/* Traveling High-Velocity Light Glint 1 */}
              <motion.div
                animate={{ x: ['-100%', '220%'] }}
                transition={{
                  duration: isLoading ? 1.6 : isFocused ? 2.6 : 3.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`absolute bottom-0 left-0 w-[45%] h-[2.5px] rounded-full ${
                  workspaceId === 'notes'
                    ? 'bg-gradient-to-r from-transparent via-yellow-200 to-transparent shadow-[0_0_14px_#fde047]'
                    : workspaceId === 'web-design'
                      ? 'bg-gradient-to-r from-transparent via-black to-transparent shadow-[0_0_16px_#000000,0_0_6px_#18181b]'
                      : 'bg-gradient-to-r from-transparent via-[#f472b6] to-transparent shadow-[0_0_16px_#ec4899,0_0_6px_#ffffff]'
                }`}
              />

              {/* Counter-Sweeping Pulse Glint 2 */}
              <motion.div
                animate={{ x: ['220%', '-100%'] }}
                transition={{
                  duration: isLoading ? 2.1 : isFocused ? 3.2 : 4.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`absolute bottom-0 left-0 w-[38%] h-[2px] rounded-full ${
                  workspaceId === 'notes'
                    ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent'
                    : workspaceId === 'web-design'
                      ? 'bg-gradient-to-r from-transparent via-zinc-900 to-transparent shadow-[0_0_14px_#000000]'
                      : 'bg-gradient-to-r from-transparent via-[#a855f7] to-transparent shadow-[0_0_14px_#a855f7]'
                }`}
              />
            </div>

            {/* Left Action Button: Gallery / Image Upload */}
            <div className="absolute left-1.5 sm:left-2 md:left-2.5 bottom-2 sm:bottom-2.5 md:bottom-3 flex items-center z-10">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isProcessingImage}
                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-colors active:scale-95 touch-manipulation cursor-pointer ${
                  isDark
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : workspaceId === 'web-design'
                      ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                      : 'text-slate-500 hover:text-purple-700 hover:bg-purple-50'
                }`}
                aria-label="Upload image from gallery"
                title="Upload image to search"
              >
                {isProcessingImage ? (
                  <Loader2 size={18} className={`animate-spin ${workspaceId === 'notes' ? 'text-amber-400' : workspaceId === 'web-design' ? 'text-zinc-900' : 'text-purple-500'}`} />
                ) : (
                  <ImageIcon size={18} className="sm:w-[19px] sm:h-[19px]" strokeWidth={1.75} />
                )}
              </button>
            </div>

            {/* Single-Line Non-Wrapping Animated Placeholder Overlay (Prevents 2-line bottom clipping) */}
            {!text && (
              <div
                className={`pointer-events-none absolute inset-y-0 left-[46px] sm:left-[52px] md:left-[56px] right-[92px] sm:right-[104px] md:right-[124px] flex items-center overflow-hidden z-10 select-none ${
                  workspaceId === 'notes'
                    ? (isDark ? 'text-amber-100/50' : 'text-gray-500')
                    : (isDark ? 'text-slate-400/80' : 'text-slate-500')
                }`}
              >
                <span className="truncate whitespace-nowrap text-[14px] sm:text-[15px] md:text-base leading-normal">
                  {isLoading
                    ? "Searching & thinking..."
                    : isEnhancing
                      ? "Enhancing query..."
                      : attachedImage
                        ? "Ask about this image..."
                        : `${placeholderText}|`}
                </span>
              </div>
            )}

            {/* Textarea Input */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              disabled={isLoading || isEnhancing}
              rows={1}
              className={`relative z-[5] w-full rounded-2xl min-h-[48px] sm:min-h-[56px] md:min-h-[60px] max-h-[180px] sm:max-h-[200px] py-3 sm:py-3.5 md:py-4 pl-[46px] sm:pl-[52px] md:pl-[56px] pr-[92px] sm:pr-[104px] md:pr-[124px] border transition-all duration-300 focus:outline-none text-[14px] sm:text-[15px] md:text-base resize-none hide-scrollbar
                ${workspaceId === 'notes'
                  ? (isDark
                      ? 'bg-[#0d0a07]/95 backdrop-blur-2xl border-amber-500/[0.14] text-white shadow-[0_12px_34px_-4px_rgba(0,0,0,0.85),0_6px_22px_-2px_rgba(245,158,11,0.32),inset_0_-1.5px_0_0_rgba(251,191,36,0.7),inset_0_1px_0_0_rgba(255,255,255,0.06)] focus:border-amber-400/45 focus:shadow-[0_14px_38px_-4px_rgba(0,0,0,0.9),0_8px_28px_-2px_rgba(245,158,11,0.48),inset_0_-2px_0_0_rgba(252,211,77,0.95)]'
                      : 'bg-white/95 backdrop-blur-2xl border-amber-200/90 text-gray-900 shadow-[0_14px_40px_-6px_rgba(0,0,0,0.1),0_4px_14px_-2px_rgba(245,158,11,0.22),inset_0_-1.5px_0_0_rgba(245,158,11,0.6)] focus:border-amber-400/50 focus:shadow-[0_18px_45px_-6px_rgba(245,158,11,0.28),inset_0_-1.5px_0_0_rgba(245,158,11,0.8)]')
                  : workspaceId === 'web-design'
                    ? (isDark
                        ? 'bg-[#09090b]/95 backdrop-blur-2xl border-white/15 text-white shadow-[0_16px_38px_-4px_rgba(0,0,0,0.95),0_8px_24px_-2px_rgba(0,0,0,0.9),inset_0_-2px_0_0_rgba(0,0,0,1),inset_0_1px_0_0_rgba(255,255,255,0.08)] focus:border-white/30 focus:shadow-[0_20px_44px_-4px_rgba(0,0,0,1),0_10px_28px_-2px_rgba(0,0,0,0.95),inset_0_-2.5px_0_0_rgba(0,0,0,1)]'
                        : 'bg-white/95 backdrop-blur-2xl border-zinc-300/90 text-slate-900 shadow-[0_16px_38px_-4px_rgba(0,0,0,0.36),0_8px_22px_-2px_rgba(0,0,0,0.26),inset_0_-2px_0_0_rgba(0,0,0,0.85)] focus:border-zinc-900/65 focus:shadow-[0_20px_44px_-4px_rgba(0,0,0,0.48),0_10px_26px_-2px_rgba(0,0,0,0.34),inset_0_-2.5px_0_0_rgba(0,0,0,1)]')
                    : (isDark 
                        ? 'bg-[#0d0a18]/95 backdrop-blur-2xl border-purple-400/[0.14] text-white shadow-[0_12px_34px_-4px_rgba(0,0,0,0.85),0_6px_24px_-2px_rgba(168,85,247,0.35),inset_0_-1.5px_0_0_rgba(192,132,252,0.75),inset_0_1px_0_0_rgba(255,255,255,0.06)] focus:border-purple-400/45 focus:shadow-[0_14px_38px_-4px_rgba(0,0,0,0.9),0_8px_30px_-2px_rgba(236,72,153,0.48),inset_0_-2px_0_0_rgba(232,121,249,0.95)]' 
                        : 'bg-white/95 backdrop-blur-2xl border-purple-200/85 text-slate-900 shadow-[0_14px_36px_-6px_rgba(124,58,237,0.14),0_6px_20px_-2px_rgba(236,72,153,0.16),inset_0_-1.5px_0_0_rgba(168,85,247,0.65)] focus:border-purple-400/60 focus:shadow-[0_18px_42px_-6px_rgba(168,85,247,0.24),0_6px_22px_-2px_rgba(236,72,153,0.22),inset_0_-2px_0_0_rgba(192,132,252,0.9)]')
                } ${(isLoading || isEnhancing) ? 'opacity-70' : 'opacity-100'}`}
              placeholder=""
              style={{ lineHeight: '1.4' }}
            />

            {/* Right Action Buttons: Voice Input & Send/Stop */}
            <div className="absolute right-1 sm:right-1.5 md:right-2 bottom-2 sm:bottom-2.5 md:bottom-3 flex items-center gap-1 sm:gap-1.5 md:gap-2 z-10">
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`flex h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-full transition-all duration-200 ease-out active:scale-90 touch-manipulation cursor-pointer ${
                  isListening 
                    ? (isDark ? 'text-red-400 bg-red-500/10' : 'text-red-600 bg-red-50')
                    : (isDark
                        ? 'text-gray-400 hover:text-white hover:bg-white/10'
                        : workspaceId === 'web-design'
                          ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                          : 'text-slate-500 hover:text-purple-700 hover:bg-purple-50')
                }`}
                aria-label="Voice input"
                title={isListening ? "Listening..." : "Voice input"}
              >
                <Mic size={19} className={`sm:w-5 sm:h-5 md:w-[22px] md:h-[22px] ${isListening ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
              </button>

              {isLoading ? (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onStop?.(); }}
                  className={`group relative flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full transition-all duration-300 ease-out active:scale-90 touch-manipulation cursor-pointer ${
                    workspaceId === 'notes'
                      ? (isDark
                          ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.7)] hover:shadow-[0_0_25px_rgba(251,191,36,1)]'
                          : 'bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:shadow-[0_0_25px_rgba(245,158,11,0.8)]')
                      : workspaceId === 'web-design'
                        ? (isDark
                            ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_24px_rgba(255,255,255,0.8)]'
                            : 'bg-zinc-900 text-white shadow-[0_4px_14px_rgba(0,0,0,0.35)] hover:bg-black')
                        : 'bg-gradient-to-tr from-[#7c3aed] via-[#a855f7] to-[#ec4899] text-white shadow-[0_0_16px_rgba(168,85,247,0.65)] hover:shadow-[0_0_24px_rgba(236,72,153,0.85)]'
                  }`}
                  aria-label="Stop generation"
                  title="Stop generation"
                >
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] bg-current rounded-[3px] transition-transform duration-200 group-active:scale-75" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isEnhancing || (!text.trim() && !attachedImage)}
                  className={`group relative flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full transition-all duration-300 ease-out active:scale-90 touch-manipulation cursor-pointer ${
                    isEnhancing || (!text.trim() && !attachedImage)
                      ? (isDark
                          ? 'bg-white/10 text-white/30 cursor-not-allowed'
                          : workspaceId === 'web-design'
                            ? 'bg-zinc-200/80 text-zinc-400 cursor-not-allowed'
                            : 'bg-purple-100/80 text-purple-300 cursor-not-allowed')
                      : workspaceId === 'notes'
                        ? (isDark
                            ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.7)] hover:shadow-[0_0_25px_rgba(251,191,36,1)] hover:scale-105'
                            : 'bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:shadow-[0_0_25px_rgba(245,158,11,0.8)] hover:scale-105')
                        : workspaceId === 'web-design'
                          ? (isDark
                              ? 'bg-white text-black shadow-[0_4px_16px_rgba(255,255,255,0.35)] hover:bg-zinc-100 hover:scale-105'
                              : 'bg-zinc-900 text-white shadow-[0_4px_16px_rgba(0,0,0,0.35)] hover:bg-black hover:scale-105')
                          : 'bg-gradient-to-tr from-[#7c3aed] via-[#a855f7] to-[#ec4899] text-white shadow-[0_4px_16px_rgba(168,85,247,0.55)] hover:shadow-[0_6px_24px_rgba(236,72,153,0.75)] hover:scale-105'
                  }`}
                  aria-label="Send message"
                  title={attachedImage ? "Search about this image" : "Send message"}
                >
                  <ArrowUp size={18} strokeWidth={2.5} className="sm:w-5 sm:h-5 transition-transform duration-200 group-active:-translate-y-1" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Interactive Camera Capture Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        isDark={isDark}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(dataUrl) => {
          setAttachedImage(dataUrl);
          setAttachedImageName('Captured Photo');
          setTimeout(() => {
            textareaRef.current?.focus();
          }, 100);
        }}
      />
    </div>
  );
}
