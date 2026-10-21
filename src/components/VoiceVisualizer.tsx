import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Radio, 
  MessageSquare, 
  PhoneOff,
  Zap,
  Activity
} from 'lucide-react';
import { CompanionPersona } from './FriendCompanionModal';

interface VoiceVisualizerProps {
  isDark: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isLoading?: boolean;
  persona: CompanionPersona;
  onToggleMic: () => void;
  onSwitchToChat: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  PersonaIcon: React.ElementType;
  transcript?: string;
  lastReply?: string;
}

export default function VoiceVisualizer({
  isDark,
  isListening,
  isSpeaking,
  isLoading,
  persona,
  onToggleMic,
  onSwitchToChat,
  voiceEnabled,
  onToggleVoice,
  PersonaIcon,
  transcript,
  lastReply
}: VoiceVisualizerProps) {
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Persona thematic color schemes
  const personaThemes = {
    friend: {
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      glow: 'rgba(16, 185, 129, 0.45)',
      lightGlow: 'rgba(16, 185, 129, 0.15)',
      ringBorder: 'border-emerald-500/40',
      accentText: 'text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      title: 'Best Friend (Dost)'
    },
    debate: {
      gradient: 'from-rose-500 via-red-500 to-orange-500',
      glow: 'rgba(244, 63, 94, 0.45)',
      lightGlow: 'rgba(244, 63, 94, 0.15)',
      ringBorder: 'border-rose-500/40',
      accentText: 'text-rose-400',
      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      title: 'Debate Partner'
    },
    mentor: {
      gradient: 'from-amber-500 via-yellow-500 to-orange-400',
      glow: 'rgba(245, 158, 11, 0.45)',
      lightGlow: 'rgba(245, 158, 11, 0.15)',
      ringBorder: 'border-amber-500/40',
      accentText: 'text-amber-400',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      title: 'Life Mentor'
    },
    roast: {
      gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
      glow: 'rgba(168, 85, 247, 0.45)',
      lightGlow: 'rgba(168, 85, 247, 0.15)',
      ringBorder: 'border-purple-500/40',
      accentText: 'text-purple-400',
      badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      title: 'Roast Buddy'
    }
  };

  const theme = personaThemes[persona] || personaThemes.friend;

  // Real-time animated equalizer wave bars
  const waveBarHeights = isSpeaking
    ? [28, 48, 72, 34, 60, 85, 42, 68, 92, 54, 78, 36, 64, 88, 50, 30]
    : isListening
    ? [20, 35, 55, 30, 45, 65, 38, 50, 70, 42, 58, 28, 48, 62, 34, 22]
    : isLoading
    ? [16, 24, 32, 20, 28, 36, 24, 32, 40, 26, 34, 18, 28, 36, 22, 14]
    : [8, 12, 16, 10, 14, 18, 12, 16, 20, 14, 18, 10, 14, 18, 12, 8];

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-full min-h-[300px] sm:min-h-[460px] py-4 px-3 sm:px-6 overflow-hidden select-none">
      {/* Ambient background mesh */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 blur-3xl transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${theme.glow} 0%, transparent 65%)`
        }}
      />

      {/* Top Call Info Bar */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-lg px-4 py-2.5 rounded-2xl backdrop-blur-xl border border-white/10 shadow-lg bg-white/5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isListening ? 'bg-red-400' : isSpeaking ? 'bg-emerald-400' : 'bg-purple-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isListening ? 'bg-red-500' : isSpeaking ? 'bg-emerald-500' : 'bg-purple-500'
            }`} />
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-wide text-white flex items-center gap-1.5">
              {theme.title}
              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${theme.badge}`}>
                HD Audio
              </span>
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              Live Session • {formatTime(callDuration)}
            </span>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
          isListening 
            ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
            : isSpeaking
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            : isLoading
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
            : 'bg-white/10 text-gray-300 border-white/10'
        }`}>
          {isListening && <Activity size={13} className="animate-spin" />}
          {isSpeaking && <Radio size={13} className="animate-pulse" />}
          {isLoading && <Activity size={13} className="animate-spin" />}
          <span>
            {isListening ? 'LISTENING' : isSpeaking ? 'SPEAKING' : isLoading ? 'THINKING' : 'READY'}
          </span>
        </div>
      </div>

      {/* Center 3D Luminescent Interactive Core */}
      <div className="relative flex flex-col items-center justify-center my-auto py-6">
        
        {/* Apple-style Fluid Siri Orb */}
        <div className="relative flex items-center justify-center w-56 h-56 sm:w-80 sm:h-80">
          
          {/* Base Blur Aura */}
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.2, 1] : isListening ? [1, 1.1, 1] : [1, 1.05, 1],
              opacity: isSpeaking ? 0.8 : isListening ? 0.6 : 0.3,
            }}
            transition={{
              repeat: Infinity,
              duration: isSpeaking ? 2 : isListening ? 3 : 5,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full blur-[60px]"
            style={{
              background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`
            }}
          />

          {/* Morphing Iridescent Blobs (Apple Siri Style) */}
          <div className="absolute inset-0 flex items-center justify-center mix-blend-screen opacity-90 overflow-hidden rounded-full mask-image-radial">
            <motion.div
              animate={{
                rotateZ: isSpeaking ? 360 : 180,
                scale: isSpeaking ? [1, 1.4, 1] : 1.1,
                x: isSpeaking ? [0, 20, -20, 0] : 0,
                y: isSpeaking ? [0, -20, 20, 0] : 0,
              }}
              transition={{
                rotateZ: { repeat: Infinity, duration: isSpeaking ? 4 : 15, ease: "linear" },
                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                x: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
              }}
              className="absolute w-full h-full rounded-full blur-[25px]"
              style={{
                background: `conic-gradient(from 0deg, transparent 0%, ${theme.lightGlow} 20%, ${theme.glow} 40%, transparent 60%, ${theme.accentText} 80%, transparent 100%)`
              }}
            />
          </div>

          {/* Ultra-Clean Frosted Glass Central Avatar */}
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.04, 1] : 1,
            }}
            transition={{ repeat: Infinity, duration: isSpeaking ? 1.5 : 3 }}
            className={`relative z-20 w-28 h-28 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center ${
              isDark ? 'bg-black/30' : 'bg-white/30'
            } backdrop-blur-3xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)]`}
            style={{
               boxShadow: isSpeaking ? `0 0 40px ${theme.lightGlow}` : '0 10px 40px rgba(0,0,0,0.2)'
            }}
          >
            <PersonaIcon size={46} className={isDark ? 'text-white/90' : 'text-gray-800'} />
            
            {/* Minimalist Apple-style label */}
            <div className="absolute -bottom-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] text-white/80 shadow-sm uppercase">
              {persona}
            </div>
          </motion.div>
        </div>

        {/* Apple-style Clean Pill Waveform */}
        <div className="flex items-center justify-center gap-[4px] mt-12 h-14 px-8 py-3 rounded-full backdrop-blur-2xl bg-white/5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          {waveBarHeights.slice(0, 8).map((height, i) => (
            <motion.div
              key={i}
              animate={{ height: `${Math.max(6, height * 0.6)}px` }}
              transition={{
                duration: 0.15,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 0.04
              }}
              className={`w-1.5 sm:w-2 rounded-full ${
                isListening 
                  ? 'bg-red-400' 
                  : isSpeaking 
                  ? isDark ? 'bg-white' : 'bg-gray-800'
                  : 'bg-gray-500/40'
              }`}
            />
          ))}
          {waveBarHeights.slice(0, 8).reverse().map((height, i) => (
            <motion.div
              key={`mirror-${i}`}
              animate={{ height: `${Math.max(6, height * 0.6)}px` }}
              transition={{
                duration: 0.15,
                repeat: Infinity,
                repeatType: "reverse",
                delay: (7 - i) * 0.04
              }}
              className={`w-1.5 sm:w-2 rounded-full ${
                isListening 
                  ? 'bg-red-400' 
                  : isSpeaking 
                  ? isDark ? 'bg-white' : 'bg-gray-800'
                  : 'bg-gray-500/40'
              }`}
            />
          ))}
        </div>

        {/* Live Subtitles / Caption Card */}
        <div className="w-full max-w-md mt-4 min-h-[64px] flex items-center justify-center px-4">
          <AnimatePresence mode="wait">
            {isListening && transcript ? (
              <motion.div
                key="listening-transcript"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="px-4 py-2.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-center backdrop-blur-md shadow-lg"
              >
                <p className="text-xs sm:text-sm font-medium text-red-200 leading-relaxed italic">
                  "{transcript}"
                </p>
                <span className="text-[10px] text-red-300/70 uppercase tracking-widest mt-1 block">
                  Capturing your voice...
                </span>
              </motion.div>
            ) : isSpeaking && lastReply ? (
              <motion.div
                key="speaking-subtitle"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-center backdrop-blur-md shadow-lg max-h-24 overflow-y-auto hide-scrollbar"
              >
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed line-clamp-3">
                  "{lastReply}"
                </p>
              </motion.div>
            ) : isLoading ? (
              <motion.div
                key="loading-status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium"
              >
                <Activity size={14} className="animate-spin text-blue-400" />
                <span>Thinking of the perfect reply...</span>
              </motion.div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-400 text-center italic">
                Tap the microphone below to talk freely
              </p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Floating Control Dock */}
      <div className="relative z-20 flex items-center justify-center gap-4 sm:gap-6 py-2 px-6 rounded-3xl backdrop-blur-2xl border border-white/15 bg-black/40 shadow-2xl">
        
        {/* Speaker Mute/Unmute */}
        <button
          type="button"
          onClick={onToggleVoice}
          className={`p-3.5 rounded-2xl border transition-all duration-200 active:scale-95 ${
            voiceEnabled
              ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              : 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30'
          }`}
          title={voiceEnabled ? "Mute Speaker" : "Unmute Speaker"}
        >
          {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        {/* Central Master Mic Button */}
        <motion.button
          type="button"
          onClick={onToggleMic}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className={`relative flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 shadow-2xl transition-all duration-300 ${
            isListening
              ? 'bg-red-500 border-red-300 text-white shadow-[0_0_40px_rgba(239,68,68,0.7)] animate-pulse'
              : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 border-white/30 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-purple-500/80'
          }`}
          title={isListening ? "Stop Listening" : "Tap to Speak"}
        >
          {isListening && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-40 bg-red-400" />
          )}
          {isListening ? <MicOff size={28} /> : <Mic size={28} />}
        </motion.button>

        {/* Switch back to text chat */}
        <button
          type="button"
          onClick={onSwitchToChat}
          className="p-3.5 rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all duration-200 active:scale-95 flex items-center gap-1.5"
          title="Switch to Text Messages"
        >
          <MessageSquare size={20} />
        </button>
      </div>
    </div>
  );
}

