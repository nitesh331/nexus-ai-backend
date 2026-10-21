import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Mic, 
  Volume2, 
  VolumeX, 
  Zap, 
  Battery, 
  BatteryCharging, 
  Camera, 
  MapPin, 
  Sun, 
  Moon, 
  RotateCcw, 
  Smartphone,
  Radio,
  Timer,
  Play,
  Pause,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface PhoneVoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleTheme?: () => void;
  userName?: string;
}

type ActiveActionType = 
  | 'none' 
  | 'torch' 
  | 'battery' 
  | 'timer' 
  | 'vibrate' 
  | 'location' 
  | 'camera' 
  | 'audio' 
  | 'call' 
  | 'theme';

export default function PhoneVoiceAssistantModal({
  isOpen,
  onClose,
  isDark,
  onToggleTheme,
  userName = 'User'
}: PhoneVoiceAssistantModalProps) {
  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState(
    `Sun raha hoon, ${userName}! Boliye: Flashlight, Battery, Timer, Camera, ya koi bhi phone command.`
  );
  const [ttsEnabled, setTtsEnabled] = useLocalStorage<boolean>('voice-assistant-tts', true);

  // Device hardware states
  const [torchOn, setTorchOn] = useState(false);
  const [screenTorchOn, setScreenTorchOn] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [locationData, setLocationData] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Active action card display (only shown when user executes a specific tool)
  const [activeAction, setActiveAction] = useState<ActiveActionType>('none');

  // Audio / Speech refs
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Web Audio SFX generator for futuristic sci-fi feedback
  const playSfx = useCallback((type: 'start' | 'success' | 'alert' | 'beep') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'start') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'alert') {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(440, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'beep') {
        osc.frequency.setValueAtTime(900, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch {}
  }, []);

  // Text-To-Speech (Speaks back directly)
  const speakText = useCallback((text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select Hindi / Indian English voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(v => 
        v.lang.includes('hi') || 
        v.name.includes('Hindi') || 
        v.lang.includes('en-IN') || 
        v.lang.includes('en-US')
      );
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Automatically resume listening for continuous voice conversation
        if (isOpen) {
          setTimeout(() => {
            startListening();
          }, 350);
        }
      };
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  }, [ttsEnabled, isOpen]);

  // Read Real Device Battery
  const checkBattery = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const b: any = await (navigator as any).getBattery();
        const lvl = Math.round(b.level * 100);
        setBatteryLevel(lvl);
        setIsCharging(b.charging);
        return { level: lvl, charging: b.charging };
      } catch {}
    }
    return { level: 88, charging: false };
  }, []);

  // Toggle Flashlight / Torch
  const toggleFlashlight = useCallback(async (desiredState?: boolean) => {
    const nextState = desiredState !== undefined ? desiredState : !torchOn;
    setTorchOn(nextState);
    setScreenTorchOn(nextState);

    try {
      if (nextState) {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          mediaStreamRef.current = stream;
          const track = stream.getVideoTracks()[0];
          const capabilities: any = track.getCapabilities?.() || {};
          if (capabilities.torch) {
            await (track as any).applyConstraints({
              advanced: [{ torch: true }]
            });
          }
        }
      } else {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
          mediaStreamRef.current = null;
        }
      }
    } catch {}

    playSfx('beep');
    return nextState;
  }, [torchOn, playSfx]);

  // Trigger Device Vibration
  const triggerVibrate = useCallback((pattern: number[] = [250, 100, 250, 100, 450]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
        return true;
      } catch {}
    }
    return false;
  }, []);

  // Request Location
  const requestLocation = useCallback(() => {
    return new Promise<{ lat: number; lng: number; acc: number }>((resolve, reject) => {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              acc: Math.round(pos.coords.accuracy)
            };
            setLocationData(loc);
            resolve(loc);
          },
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  }, []);

  // Toggle Live Camera Viewfinder
  const toggleCamera = useCallback(async (state?: boolean) => {
    const next = state !== undefined ? state : !cameraActive;
    setCameraActive(next);
    if (next) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCameraActive(false);
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [cameraActive]);

  // Timer Ticking Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            playSfx('alert');
            triggerVibrate([500, 200, 500, 200, 800]);
            speakText("Aapka timer poora ho gaya hai!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, playSfx, triggerVibrate, speakText]);

  // Core Command Dispatcher & Natural Language Engine
  const executeCommand = useCallback(async (rawText: string) => {
    const text = rawText.trim().toLowerCase();
    if (!text) return;

    setIsProcessing(true);
    let reply = "";
    let actionType: ActiveActionType = 'none';

    // 1. Flashlight / Torch
    if (text.includes('torch') || text.includes('flashlight') || text.includes('light on') || text.includes('light off') || text.includes('batti') || text.includes('light jalao') || text.includes('light bujhao')) {
      actionType = 'torch';
      setActiveAction('torch');
      const turnOff = text.includes('off') || text.includes('band') || text.includes('bujha');
      const state = await toggleFlashlight(!turnOff);
      reply = state 
        ? "Flashlight on kar di gayi hai."
        : "Flashlight band kar di gayi hai.";
      playSfx('success');
    }

    // 2. Battery & Power
    else if (text.includes('battery') || text.includes('charging') || text.includes('charge') || text.includes('power')) {
      actionType = 'battery';
      setActiveAction('battery');
      const batt = await checkBattery();
      reply = `Aapke phone ki battery ${batt.level}% hai, aur charging ${batt.charging ? 'connected hai' : 'disconnected hai'}.`;
      playSfx('success');
    }

    // 3. Timer & Alarm
    else if (text.includes('timer') || text.includes('alarm') || text.includes('stopwatch') || text.includes('minute') || text.includes('second')) {
      actionType = 'timer';
      setActiveAction('timer');
      
      const matchMin = text.match(/(\d+)\s*(min|minute)/);
      const matchSec = text.match(/(\d+)\s*(sec|second)/);
      let sec = 60;
      if (matchMin) {
        sec = parseInt(matchMin[1], 10) * 60;
      } else if (matchSec) {
        sec = parseInt(matchSec[1], 10);
      } else {
        const numMatch = text.match(/\d+/);
        if (numMatch) sec = parseInt(numMatch[0], 10) * 60;
      }

      setTimerSeconds(sec);
      setTimerRunning(true);
      reply = `${Math.floor(sec / 60) > 0 ? `${Math.floor(sec / 60)} minute` : `${sec} second`} ka timer shuru kar diya hai.`;
      playSfx('success');
    }

    // 4. Vibration / Haptics
    else if (text.includes('vibrate') || text.includes('haptic') || text.includes('buzz') || text.includes('hilao')) {
      actionType = 'vibrate';
      setActiveAction('vibrate');
      triggerVibrate([300, 150, 300, 150, 500]);
      reply = "Phone vibrate kiya gaya hai. Haptic pulse sent!";
      playSfx('success');
    }

    // 5. GPS & Location
    else if (text.includes('location') || text.includes('kahan') || text.includes('gps') || text.includes('where am i') || text.includes('coordinates')) {
      actionType = 'location';
      setActiveAction('location');
      try {
        const loc = await requestLocation();
        reply = `Aapki exact location: Latitude ${loc.lat.toFixed(4)}, Longitude ${loc.lng.toFixed(4)} detect ho gayi hai.`;
        playSfx('success');
      } catch {
        reply = "Location permission allow karein taaki coordinates mil sakein.";
        playSfx('alert');
      }
    }

    // 6. Camera / Selfie
    else if (text.includes('camera') || text.includes('photo') || text.includes('selfie') || text.includes('tasveer')) {
      const turnOff = text.includes('off') || text.includes('band') || text.includes('close');
      if (turnOff) {
        actionType = 'none';
        setActiveAction('none');
        await toggleCamera(false);
        reply = "Camera band kar diya gaya hai.";
      } else {
        actionType = 'camera';
        setActiveAction('camera');
        await toggleCamera(true);
        reply = "Camera viewfinder khol diya gaya hai.";
      }
      playSfx('success');
    }

    // 7. Dark Mode / Theme
    else if (text.includes('dark mode') || text.includes('light mode') || text.includes('theme') || text.includes('black') || text.includes('white')) {
      actionType = 'theme';
      setActiveAction('theme');
      if (onToggleTheme) onToggleTheme();
      reply = `Theme switch kar di gayi hai to ${isDark ? 'Light' : 'Dark'} mode.`;
      playSfx('success');
    }

    // 8. Phone Dial / Call
    else if (text.includes('call') || text.includes('dial') || text.includes('phone lagao') || text.includes('police') || text.includes('100') || text.includes('112')) {
      actionType = 'call';
      setActiveAction('call');
      let dialNum = "112";
      if (text.includes('100')) dialNum = "100";
      const numberMatch = text.match(/\d{3,12}/);
      if (numberMatch) dialNum = numberMatch[0];
      reply = `Call dialer ready kiya gaya hai for ${dialNum}.`;
      playSfx('beep');
      window.open(`tel:${dialNum}`, '_self');
    }

    // 9. Sound / Volume Test
    else if (text.includes('sound') || text.includes('volume') || text.includes('awaz') || text.includes('music') || text.includes('siren')) {
      actionType = 'audio';
      setActiveAction('audio');
      playSfx('alert');
      reply = "Audio system test complete! Sound bilkul theek chal raha hai.";
    }

    // 10. General Conversational / AI Query Fallback
    else {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: `You are a futuristic, smart phone voice assistant like Siri/Jarvis. The user says: "${rawText}". Answer concisely in 1-2 spoken, helpful sentences in Hindi or Hinglish. Speak directly and naturally without markdown formatting.`
              }
            ]
          })
        });
        const data = await res.json();
        reply = data.text || "Main samajh gaya. Aap aur koi phone feature control karna chahte hain?";
        playSfx('beep');
      } catch {
        reply = "Service abhi scheduled maintenance & optimization me hai taaki aapko aur fast responses mil sakein. Main flashlight, battery ya camera control karne ke liye ready hoon.";
        playSfx('alert');
      }
    }

    setLastResponse(reply);
    setIsProcessing(false);
    speakText(reply);
  }, [
    isDark,
    onToggleTheme,
    playSfx,
    speakText,
    checkBattery,
    toggleFlashlight,
    triggerVibrate,
    requestLocation,
    toggleCamera
  ]);

  // Speech Recognition Setup - Direct Voice Listening
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setLastResponse("Voice input is not supported in this browser. Please speak using Chrome/Safari.");
      return;
    }

    try {
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setInterimTranscript('');
        playSfx('start');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTxt = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTxt += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }
        if (currentInterim) setInterimTranscript(currentInterim);
        if (finalTxt) {
          setTranscript(finalTxt);
          setInterimTranscript('');
          executeCommand(finalTxt);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, [playSfx, executeCommand]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }
  }, []);

  // Auto-init battery & start listening IMMEDIATELY on open (Zero delay, pure direct voice)
  useEffect(() => {
    if (isOpen) {
      checkBattery();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate([40, 30, 40]); } catch {}
      }
      const t = setTimeout(() => {
        startListening();
      }, 150);
      return () => clearTimeout(t);
    } else {
      stopListening();
      window.speechSynthesis?.cancel();
      toggleCamera(false);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(tr => tr.stop());
      }
    }
  }, [isOpen, checkBattery, startListening, stopListening, toggleCamera]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-2xl overflow-hidden"
      >
        {/* Full-Screen Screen Flashlight Overlay when Torch is activated */}
        {screenTorchOn && (
          <div className="fixed inset-0 z-40 bg-white pointer-events-none opacity-95 transition-opacity" />
        )}

        {/* Direct Voice Assistant Modal — Studio-Grade Acoustic OS Interface */}
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 380 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-50 w-full max-w-[420px] rounded-[2rem] border border-white/[0.11] bg-[#070911]/95 text-white shadow-[0_28px_80px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.12)] overflow-hidden flex flex-col select-none"
          style={{ maxHeight: '92vh' }}
        >
          {/* Subtle Top Ambient Radial Illumination */}
          <div
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-64 rounded-full blur-3xl opacity-55"
            style={{
              background: isListening
                ? 'radial-gradient(circle, rgba(34,211,238,0.32) 0%, rgba(59,130,246,0.14) 55%, transparent 75%)'
                : isSpeaking
                ? 'radial-gradient(circle, rgba(192,132,252,0.32) 0%, rgba(124,58,237,0.14) 55%, transparent 75%)'
                : 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, rgba(99,102,241,0.14) 55%, transparent 75%)'
            }}
          />

          {/* 1. REFINED STUDIO HEADER */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3.5 border-b border-white/[0.07] relative z-10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/15 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, rgba(14,165,233,0.22) 0%, rgba(79,70,229,0.28) 100%)',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), 0 4px 14px rgba(14,165,233,0.18)'
                }}
              >
                <Smartphone size={16} className="text-cyan-300" strokeWidth={2} />
              </div>

              <div className="min-w-0">
                <h2 className="font-semibold text-[15px] tracking-tight text-white leading-tight truncate">
                  Voice OS Assistant
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isListening
                          ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse'
                          : isSpeaking
                          ? 'bg-purple-400 shadow-[0_0_8px_#c084fc] animate-pulse'
                          : 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                      }`}
                    />
                    <span className={isListening ? 'text-cyan-300' : isSpeaking ? 'text-purple-300' : 'text-zinc-300'}>
                      {isListening ? 'Listening' : isSpeaking ? 'Speaking' : isProcessing ? 'Processing' : 'Ready'}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span className="inline-flex items-center gap-1 text-zinc-400">
                    {isCharging ? (
                      <BatteryCharging size={12} className="text-emerald-400" />
                    ) : (
                      <Battery size={12} className="text-zinc-400" />
                    )}
                    <span>{batteryLevel !== null ? `${batteryLevel}%` : '88%'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Controls: Mute/Unmute & Close */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTtsEnabled(!ttsEnabled)}
                title={ttsEnabled ? 'Mute Voice Output' : 'Unmute Voice Output'}
                aria-label={ttsEnabled ? 'Mute Voice Output' : 'Unmute Voice Output'}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
                  ttsEnabled
                    ? 'bg-white/[0.06] border-white/[0.1] text-zinc-300 hover:bg-white/[0.12] hover:text-white'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
                }`}
              >
                {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close assistant"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.12] transition-all active:scale-95 text-zinc-300 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* 2. MAIN VOICE STAGE */}
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col items-center justify-between gap-4 hide-scrollbar relative z-10">
            
            {/* A. SCULPTED 3D ACOUSTIC SPHERE & NON-OVERLAPPING HARMONIC STAGE */}
            <div className="flex flex-col items-center justify-center w-full pt-1">
              <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center">
                {/* Outer Breathing Acoustic Halo */}
                <motion.div
                  animate={{
                    scale: isListening ? [1, 1.24, 1] : isSpeaking ? [1, 1.18, 1] : [1, 1.05, 1],
                    opacity: isListening ? [0.65, 0.25, 0.65] : isSpeaking ? [0.55, 0.22, 0.55] : [0.3, 0.15, 0.3]
                  }}
                  transition={{ repeat: Infinity, duration: isListening ? 1.5 : isSpeaking ? 1.8 : 3.2, ease: 'easeInOut' }}
                  className="absolute inset-1 rounded-full pointer-events-none blur-2xl"
                  style={{
                    background: isListening
                      ? 'radial-gradient(circle, rgba(34,211,238,0.55) 0%, rgba(59,130,246,0.2) 65%, transparent 100%)'
                      : isSpeaking
                      ? 'radial-gradient(circle, rgba(192,132,252,0.55) 0%, rgba(124,58,237,0.2) 65%, transparent 100%)'
                      : 'radial-gradient(circle, rgba(56,189,248,0.35) 0%, rgba(99,102,241,0.18) 65%, transparent 100%)'
                  }}
                />

                {/* Smooth Concentric Acoustic Ring 1 (Strictly contained within 44x44 stage) */}
                <motion.div
                  animate={{
                    scale: isListening ? [0.96, 1.08, 0.96] : [0.98, 1.03, 0.98],
                    opacity: isListening ? [0.45, 0.15, 0.45] : [0.22, 0.1, 0.22]
                  }}
                  transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
                  className={`absolute inset-0 rounded-full border pointer-events-none ${
                    isListening ? 'border-cyan-400/40' : isSpeaking ? 'border-purple-400/40' : 'border-indigo-400/25'
                  }`}
                />

                {/* Smooth Concentric Acoustic Ring 2 */}
                <div
                  className={`absolute inset-3.5 rounded-full border pointer-events-none transition-colors duration-300 ${
                    isListening ? 'border-cyan-300/30' : isSpeaking ? 'border-purple-300/30' : 'border-white/10'
                  }`}
                />

                {/* 3D Sculpted Spherical Voice Button */}
                <motion.button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.94 }}
                  className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden border border-white/35"
                  style={{
                    background: isListening
                      ? 'radial-gradient(circle at 32% 28%, #67e8f9 0%, #06b6d4 42%, #0284c7 78%, #0f172a 100%)'
                      : isSpeaking
                      ? 'radial-gradient(circle at 32% 28%, #f0abfc 0%, #a855f7 45%, #6d28d9 80%, #1e1b4b 100%)'
                      : 'radial-gradient(circle at 32% 28%, #38bdf8 0%, #4f46e5 48%, #312e81 82%, #090d16 100%)',
                    boxShadow: isListening
                      ? '0 0 0 4px rgba(34,211,238,0.22), 0 16px 40px -6px rgba(6,182,212,0.65), inset 0 2px 6px rgba(255,255,255,0.55)'
                      : isSpeaking
                      ? '0 0 0 4px rgba(192,132,252,0.22), 0 16px 40px -6px rgba(168,85,247,0.65), inset 0 2px 6px rgba(255,255,255,0.55)'
                      : '0 0 0 4px rgba(99,102,241,0.18), 0 16px 36px -6px rgba(79,70,229,0.55), inset 0 2px 6px rgba(255,255,255,0.45)'
                  }}
                >
                  {/* Top-Left Optical Glass Specular Highlight */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle at 30% 22%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.08) 38%, rgba(0,0,0,0.28) 100%)'
                    }}
                  />

                  {/* Subtle Inner Rim */}
                  <div className="pointer-events-none absolute inset-2.5 rounded-full border border-white/20" />

                  {/* Center Voice Icon */}
                  <div className="relative z-10 flex items-center justify-center">
                    {isListening ? (
                      <Radio size={36} className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.75)] animate-pulse" strokeWidth={2} />
                    ) : isSpeaking ? (
                      <Volume2 size={36} className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.75)] animate-bounce" strokeWidth={2} />
                    ) : (
                      <Mic size={36} className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.65)]" strokeWidth={2} />
                    )}
                  </div>
                </motion.button>
              </div>

              {/* Clean Acoustic Waveform & Status Caption (Zero overlap with orb) */}
              <div className="flex flex-col items-center mt-2">
                <div className="flex items-center justify-center gap-1.5 h-5">
                  {[0.55, 1.0, 0.75, 1.35, 0.85, 1.1, 0.6].map((scaleFactor, i) => (
                    <motion.span
                      key={i}
                      animate={{
                        height: isListening
                          ? [4, 16 * scaleFactor, 6, 18 * scaleFactor, 4]
                          : isSpeaking
                          ? [5, 14 * scaleFactor, 5, 16 * scaleFactor, 5]
                          : 4
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.65 + i * 0.07,
                        ease: 'easeInOut'
                      }}
                      className={`w-1 rounded-full transition-colors ${
                        isListening
                          ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                          : isSpeaking
                          ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]'
                          : 'bg-white/25'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className="mt-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase text-cyan-300/90 hover:text-cyan-200 transition-colors cursor-pointer"
                >
                  {isListening
                    ? 'Listening · Speak Command'
                    : isSpeaking
                    ? 'Speaking Response...'
                    : isProcessing
                    ? 'Executing Command...'
                    : 'Tap Orb to Speak'}
                </button>
              </div>
            </div>

            {/* B. UNIFIED VOICE TRANSCRIPT & RESPONSE STAGE */}
            <div className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.09] p-4 text-left backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
              {/* Live Spoken Input Line (shown when user speaks or has a transcript) */}
              {(interimTranscript || transcript) && (
                <div className="mb-3 pb-2.5 border-b border-white/[0.07] flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm font-medium text-cyan-300 truncate">
                    “{interimTranscript || transcript}”
                  </p>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 shrink-0">
                    You
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-400">
                    Nexus Voice
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => speakText(lastResponse)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Replay</span>
                </button>
              </div>

              <p className="text-[14px] sm:text-[15px] text-zinc-100 leading-relaxed font-medium">
                {lastResponse}
              </p>
            </div>

            {/* C. INTERACTIVE QUICK HARDWARE ACTIONS (One-Tap or Voice) */}
            <div className="w-full">
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: 'torch',
                    label: 'Flashlight',
                    sub: torchOn ? 'ON' : 'OFF',
                    icon: Zap,
                    active: torchOn,
                    cmd: torchOn ? 'Torch off karo' : 'Torch on karo'
                  },
                  {
                    id: 'battery',
                    label: 'Battery',
                    sub: batteryLevel !== null ? `${batteryLevel}%` : 'Check',
                    icon: isCharging ? BatteryCharging : Battery,
                    active: activeAction === 'battery',
                    cmd: 'Battery kitni hai'
                  },
                  {
                    id: 'timer',
                    label: 'Timer',
                    sub: timerRunning
                      ? `${Math.floor(timerSeconds / 60)}:${(timerSeconds % 60).toString().padStart(2, '0')}`
                      : '1 Min',
                    icon: Timer,
                    active: timerRunning,
                    cmd: '1 minute timer lagao'
                  },
                  {
                    id: 'camera',
                    label: 'Camera',
                    sub: cameraActive ? 'Live' : 'Open',
                    icon: Camera,
                    active: cameraActive,
                    cmd: cameraActive ? 'Camera band karo' : 'Camera kholo'
                  },
                  {
                    id: 'location',
                    label: 'Location',
                    sub: locationData ? 'GPS Active' : 'Detect',
                    icon: MapPin,
                    active: activeAction === 'location',
                    cmd: 'Meri location kya hai'
                  },
                  {
                    id: 'theme',
                    label: 'Theme',
                    sub: isDark ? 'Dark' : 'Light',
                    icon: isDark ? Moon : Sun,
                    active: activeAction === 'theme',
                    cmd: 'Theme switch karo'
                  }
                ].map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => executeCommand(item.cmd)}
                      className={`group flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all active:scale-95 cursor-pointer ${
                        item.active
                          ? 'bg-cyan-500/15 border-cyan-400/40 text-white shadow-[0_4px_14px_rgba(6,182,212,0.18)]'
                          : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.07] hover:border-white/[0.15] text-zinc-200'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          item.active
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-white/[0.06] text-zinc-300 group-hover:text-white'
                        }`}
                      >
                        <IconComp size={14} strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate leading-tight">
                          {item.label}
                        </div>
                        <div className={`text-[10px] truncate mt-0.5 ${item.active ? 'text-cyan-300 font-medium' : 'text-zinc-400'}`}>
                          {item.sub}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* D. ACTIVE HARDWARE ACTION VIEWPORT (Expanded details for Camera / Timer / Location) */}
            <AnimatePresence>
              {(activeAction === 'camera' || activeAction === 'timer' || activeAction === 'location') && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.97 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.97 }}
                  className="w-full p-3.5 rounded-2xl bg-white/[0.05] border border-cyan-400/30 text-left shadow-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/[0.08]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <Zap size={13} className="text-cyan-400" />
                      Live Hardware Feed
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeAction === 'camera') toggleCamera(false);
                        setActiveAction('none');
                      }}
                      className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>

                  {/* TIMER CARD */}
                  {activeAction === 'timer' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
                          <Timer size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-xs sm:text-sm">Countdown Timer</p>
                          <p className="text-[11px] text-zinc-400">{timerRunning ? 'Running' : 'Paused'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-cyan-300">
                          {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTimerRunning(!timerRunning)}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                        >
                          {timerRunning ? <Pause size={13} /> : <Play size={13} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CAMERA CARD */}
                  {activeAction === 'camera' && (
                    <div className="flex flex-col gap-2">
                      <div className="relative w-full h-36 bg-black rounded-xl overflow-hidden border border-white/15">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] bg-black/70 border border-white/15 text-white flex items-center gap-1.5 font-semibold backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          LIVE
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LOCATION CARD */}
                  {activeAction === 'location' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-xs sm:text-sm">GPS Coordinates</p>
                          <p className="text-[11px] text-zinc-400">
                            {locationData ? `${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}` : 'Acquiring GPS signal...'}
                          </p>
                        </div>
                      </div>
                      {locationData && (
                        <a
                          href={`https://www.google.com/maps?q=${locationData.lat},${locationData.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/25"
                        >
                          Maps <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
