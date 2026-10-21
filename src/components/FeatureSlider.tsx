import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Search, LayoutTemplate, Mic, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FeatureSliderProps {
  isDark: boolean;
  onSelectWorkspace: (id: string) => void;
  onOpenCompanion?: () => void;
  onOpenPhotoSearch?: () => void;
}

// Crisp study note/book icon matching Medhira in the reference design
const MedhiraNoteIcon = ({ className, size = 28, strokeWidth = 2.2 }: { className?: string; size?: number; strokeWidth?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 4h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H7.5L5 20.5V5a1 1 0 0 1 1-1z" />
    <line x1="9" y1="8.5" x2="15" y2="8.5" />
  </svg>
);

const features = [
  {
    id: 2,
    workspaceId: "deep-search",
    title: "Atal",
    subtitle: "Deep search",
    icon: Search,
    orbGradient: "linear-gradient(145deg, #6d28d9 0%, #4f46e5 52%, #2563eb 100%)",
    haloColor: "rgba(99, 102, 241, 0.34)",
    shadowColor: "rgba(79, 70, 229, 0.5)",
    left: "50%",
    top: "1%",
    floatDelay: 0
  },
  {
    id: 1,
    workspaceId: "image-video",
    title: "Zenra",
    subtitle: "Image and video",
    icon: ImageIcon,
    orbGradient: "linear-gradient(145deg, #9333ea 0%, #c026d3 52%, #db2777 100%)",
    haloColor: "rgba(217, 70, 239, 0.34)",
    shadowColor: "rgba(192, 38, 211, 0.48)",
    left: "15%",
    top: "29%",
    floatDelay: 0.4
  },
  {
    id: 3,
    workspaceId: "web-design",
    title: "Jaalix",
    subtitle: "Pages and layouts",
    icon: LayoutTemplate,
    orbGradient: "linear-gradient(145deg, #ea580c 0%, #ef4444 52%, #e11d48 100%)",
    haloColor: "rgba(244, 63, 94, 0.32)",
    shadowColor: "rgba(239, 68, 68, 0.48)",
    left: "85%",
    top: "29%",
    floatDelay: 0.8
  },
  {
    id: 4,
    workspaceId: "notes",
    title: "Medhira",
    subtitle: "Learn and study",
    icon: MedhiraNoteIcon,
    orbGradient: "linear-gradient(145deg, #4338ca 0%, #2563eb 54%, #0284c7 100%)",
    haloColor: "rgba(59, 130, 246, 0.34)",
    shadowColor: "rgba(37, 99, 235, 0.48)",
    left: "25%",
    top: "68%",
    floatDelay: 1.2
  },
  {
    id: 5,
    workspaceId: "photo-search",
    title: "Photo Search",
    subtitle: "Search with a photo",
    icon: Camera,
    orbGradient: "linear-gradient(145deg, #0d9488 0%, #0284c7 54%, #2563eb 100%)",
    haloColor: "rgba(14, 165, 233, 0.34)",
    shadowColor: "rgba(2, 132, 199, 0.48)",
    left: "75%",
    top: "68%",
    floatDelay: 1.6
  }
];

export default function FeatureSlider({ isDark, onSelectWorkspace, onOpenCompanion, onOpenPhotoSearch }: FeatureSliderProps) {
  const [pressProgress, setPressProgress] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isPressingRef = useRef(false);
  const pressStartTimeRef = useRef(0);

  const startPress = (e?: React.PointerEvent) => {
    if (e && e.button !== 0 && e.type !== 'touchstart') return;
    
    isPressingRef.current = true;
    setIsPressing(true);
    setPressProgress(0);
    pressStartTimeRef.current = Date.now();

    const duration = 420;

    progressIntervalRef.current = setInterval(() => {
      if (!isPressingRef.current) return;
      const elapsed = Date.now() - pressStartTimeRef.current;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setPressProgress(pct);

      if (pct >= 100) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate([70, 30, 70]); } catch (e) {}
        }
        isPressingRef.current = false;
        setIsPressing(false);
        setPressProgress(0);
        onOpenCompanion?.();
      }
    }, 16);
  };

  const cancelPress = () => {
    isPressingRef.current = false;
    setIsPressing(false);
    setPressProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowHint(true);
    setTimeout(() => setShowHint(false), 2000);
    cancelPress();
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1, type: 'spring' }}
      className="w-full mx-auto mt-2 sm:mt-3 md:mt-4 shrink-0 flex flex-col justify-center items-center overflow-visible px-2 sm:px-4"
    >
      {/* Generous Pentagon Hub Container so Atal & all 5 Assistants have crystal-clear logos and names */}
      <div className="relative w-full max-w-[350px] sm:max-w-[400px] md:max-w-[430px] h-[360px] sm:h-[400px] md:h-[425px] flex items-center justify-center shrink-0">
        
        {/* Concentric Orbital Rings Centered on the Central Microphone Hub (top-[55%]) */}
        <div className="pointer-events-none absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          {/* Outer Dashed Orbit Ring passing cleanly below Atal's label and around the hub */}
          <div
            className={`w-[195px] h-[195px] sm:w-[222px] sm:h-[222px] md:w-[238px] md:h-[238px] rounded-full border border-dashed transition-colors ${
              isDark
                ? 'border-purple-400/35 shadow-[0_0_25px_rgba(168,85,247,0.12)]'
                : 'border-purple-400/45'
            } animate-[spin_75s_linear_infinite]`}
          />

          {/* Middle Concentric Solid Ring */}
          <div
            className={`absolute w-[136px] h-[136px] sm:w-[154px] sm:h-[154px] md:w-[166px] md:h-[166px] rounded-full border border-solid transition-colors ${
              isDark ? 'border-purple-400/25' : 'border-purple-400/32'
            }`}
          />

          {/* Inner Concentric Solid Ring right around the Central Mic Orb */}
          <div
            className={`absolute w-[108px] h-[108px] sm:w-[122px] sm:h-[122px] md:w-[132px] md:h-[132px] rounded-full border border-solid transition-colors ${
              isDark ? 'border-purple-400/35' : 'border-purple-400/42'
            }`}
          />
        </div>

        {/* Central Hub Button (Realistic 3D Purple-to-Pink Sphere with White Mic Icon) */}
        <div 
          className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center select-none"
          onMouseEnter={() => setShowHint(true)}
          onMouseLeave={() => {
            setShowHint(false);
            cancelPress();
          }}
        >
          <div
            id="sparkle-companion-trigger"
            onPointerDown={(e) => startPress(e as any)}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onPointerCancel={cancelPress}
            onClick={handleClick}
            className={`relative w-[82px] h-[82px] sm:w-[94px] sm:h-[94px] md:w-[104px] md:h-[104px] rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer touch-manipulation active:scale-95 overflow-hidden border-[2.5px] border-white/60 ${
              isPressing ? 'scale-110' : 'hover:scale-105'
            }`}
            style={{
              background: 'linear-gradient(145deg, #7c3aed 0%, #a855f7 52%, #ec4899 100%)',
              boxShadow: isPressing
                ? '0 0 0 6px rgba(192, 132, 252, 0.38), 0 18px 42px -4px rgba(168, 85, 247, 0.75), inset 0 2px 6px rgba(255, 255, 255, 0.55)'
                : isDark
                ? '0 0 0 4px rgba(168, 85, 247, 0.28), 0 16px 38px -4px rgba(168, 85, 247, 0.55), inset 0 2px 6px rgba(255, 255, 255, 0.45)'
                : '0 0 0 4px rgba(216, 180, 254, 0.55), 0 16px 34px -4px rgba(168, 85, 247, 0.48), 0 6px 14px -2px rgba(236, 72, 153, 0.28), inset 0 2px 6px rgba(255, 255, 255, 0.55)'
            }}
          >
            {/* 3D Spherical Specular Lighting Overlay */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0.08) 42%, rgba(0, 0, 0, 0.16) 100%)'
              }}
            />

            {/* Subtle Ambient Pulse Wave */}
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20 bg-purple-400"
              style={{ animationDuration: '2.8s' }}
            />

            {/* Circular Progress Ring on Long Press */}
            {isPressing && (
              <svg className="absolute inset-[-8px] w-[calc(100%+16px)] h-[calc(100%+16px)] -rotate-90 pointer-events-none z-30">
                <circle
                  cx="50%"
                  cy="50%"
                  r="46%"
                  className="stroke-purple-500/25"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="46%"
                  className="stroke-white drop-shadow-[0_0_12px_rgba(255,255,255,0.95)]"
                  strokeWidth="4"
                  strokeDasharray="310"
                  strokeDashoffset={310 - (310 * pressProgress) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
            )}

            {/* Crisp White Voice Assistant Mic Icon */}
            <div className="relative z-10 flex items-center justify-center">
              <Mic 
                className={`text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.28)] transition-transform duration-300 ${
                  isPressing ? 'scale-115 animate-pulse' : ''
                }`} 
                size={32} 
                strokeWidth={2} 
              />
            </div>
          </div>

          {/* Floating Tooltip Hint for Voice Assistant Hub */}
          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute -bottom-8 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold whitespace-nowrap shadow-lg border backdrop-blur-md pointer-events-none z-30 ${
                  isDark 
                    ? 'bg-zinc-900/95 text-purple-200 border-purple-500/35 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                    : 'bg-white/95 text-purple-700 border-purple-200 shadow-md'
                }`}
              >
                Voice Assistant · Long Press to Control Phone
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 5 Assistant Orbs in Exact Pentagon Formation (Atal Top, Zenra Left, Web Design Right, Medhira Bottom-Left, Photo Search Bottom-Right) */}
        {features.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              style={{ left: item.left, top: item.top }}
              className="absolute -translate-x-1/2 z-30 flex flex-col items-center pointer-events-auto"
            >
              <motion.button
                type="button"
                animate={{ y: [-2.5, 2.5, -2.5] }}
                transition={{
                  duration: 4.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: item.floatDelay
                }}
                onClick={() => {
                  if (item.workspaceId === 'photo-search') {
                    onOpenPhotoSearch?.();
                  } else {
                    onSelectWorkspace(item.workspaceId);
                  }
                }}
                className="flex flex-col items-center group w-[112px] sm:w-[126px] md:w-[136px] cursor-pointer touch-manipulation select-none focus:outline-none"
              >
                {/* Realistic 3D Spherical Gradient Orb with Specular Sheen & Crisp White Icon */}
                <div
                  className="relative w-[62px] h-[62px] sm:w-[68px] sm:h-[68px] md:w-[74px] md:h-[74px] rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 active:scale-95 shrink-0 overflow-hidden border-[2px] border-white/65"
                  style={{
                    background: item.orbGradient,
                    boxShadow: `0 0 0 3.5px ${item.haloColor}, 0 14px 28px -5px ${item.shadowColor}, inset 0 2px 5px rgba(255, 255, 255, 0.5)`
                  }}
                >
                  {/* 3D Spherical Top-Left Specular Sheen & Bottom Depth Shading */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0.06) 44%, rgba(0, 0, 0, 0.18) 100%)'
                    }}
                  />

                  <IconComponent
                    className="relative z-10 text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-110"
                    size={28}
                    strokeWidth={2.2}
                  />
                </div>

                {/* High-Clarity Two-Line Centered Label (Assistant Name + Subtitle) */}
                <div className="mt-2 flex flex-col items-center text-center leading-tight px-1.5 py-0.5 rounded-lg">
                  <span
                    className={`font-extrabold text-[14px] sm:text-[15px] md:text-[16px] tracking-tight transition-colors ${
                      isDark
                        ? 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] group-hover:text-purple-200'
                        : 'text-[#0f172a] [text-shadow:0_1px_8px_rgba(255,255,255,0.98),0_0_3px_rgba(255,255,255,1)] group-hover:text-[#6d28d9]'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span
                    className={`text-[11.5px] sm:text-[12.5px] font-medium leading-tight mt-0.5 max-w-[122px] ${
                      isDark
                        ? 'text-zinc-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]'
                        : 'text-[#334155] [text-shadow:0_1px_6px_rgba(255,255,255,0.98),0_0_2px_rgba(255,255,255,1)]'
                    }`}
                  >
                    {item.subtitle}
                  </span>
                </div>
              </motion.button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}



