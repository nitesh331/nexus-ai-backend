import React from 'react';

export type RealisticEmojiKey = 'thumbs_up' | 'heart' | 'laugh' | 'surprised' | 'sad' | 'fire';

interface RealisticEmojiProps {
  name: RealisticEmojiKey | string;
  size?: number;
  className?: string;
}

export function RealisticEmoji({ name, size = 26, className = '' }: RealisticEmojiProps) {
  const s = size;

  switch (name) {
    case 'thumbs_up':
    case '👍':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`filter drop-shadow-[0_2px_4px_rgba(234,179,8,0.35)] shrink-0 select-none ${className}`}
        >
          <defs>
            <radialGradient id="tu-cuff" cx="20%" cy="20%" r="90%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="60%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1E40AF" />
            </radialGradient>
            <radialGradient id="tu-skin" cx="35%" cy="25%" r="85%">
              <stop offset="0%" stopColor="#FFE082" />
              <stop offset="40%" stopColor="#FFCA28" />
              <stop offset="85%" stopColor="#FFA000" />
              <stop offset="100%" stopColor="#E65100" />
            </radialGradient>
            <linearGradient id="tu-finger-shade" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE082" />
              <stop offset="60%" stopColor="#FFB300" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="tu-spec" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Cuff */}
          <rect x="2" y="19" width="8" height="14" rx="3.5" fill="url(#tu-cuff)" />
          <rect x="3" y="20" width="2" height="12" rx="1" fill="#93C5FD" opacity="0.6" />

          {/* Palm Base */}
          <path
            d="M9 19.5 C9 18 10 17 12 17 L21 17 C25 17 28 19 28 22 C28 24 25.5 25.5 25.5 25.5 C27.5 26 28 27.5 28 29 C28 31 25.5 32 24 32 L11 32 C9.5 32 9 30.5 9 29.5 Z"
            fill="url(#tu-skin)"
          />

          {/* Thumb pointing up with glossy 3D curve */}
          <path
            d="M11 18 C11 17 12 14.5 13 12 C14.5 8 16 3 19 3 C21.5 3 22.5 5 22.5 7.5 C22.5 11 20 15 19 17 Z"
            fill="url(#tu-skin)"
          />
          {/* Thumb highlight */}
          <path
            d="M14.5 11 C15.5 8.5 16.5 4.5 19 4.2 C19.8 4.2 20.2 4.8 20.5 5.8 C20.3 8.5 18 12.5 16.5 15"
            stroke="url(#tu-spec)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Fingers with distinct rounded segments and depth shading */}
          <path d="M19 18 L27 18 C28.5 18 29.5 19.2 29 20.8 C28.6 21.8 27.5 22.5 26 22.5 L19 22.5" fill="url(#tu-finger-shade)" />
          <path d="M19 22.5 L26.5 22.5 C28 22.5 29 23.7 28.5 25.2 C28 26.2 27 26.8 25.5 26.8 L18 26.8" fill="url(#tu-finger-shade)" />
          <path d="M18 26.8 L25.5 26.8 C27 26.8 28 28 27.5 29.5 C27 30.5 26 31 24.5 31 L17 31" fill="url(#tu-finger-shade)" />
          <path d="M17 31 L23.5 31 C24.8 31 25.8 32 25.3 33.2 C24.8 34 23.8 34.5 22.5 34.5 L15 34.5" fill="url(#tu-finger-shade)" />

          {/* Knuckle division creases */}
          <line x1="17" y1="22.5" x2="26" y2="22.5" stroke="#C2410C" strokeWidth="0.8" opacity="0.45" />
          <line x1="16" y1="26.8" x2="25" y2="26.8" stroke="#C2410C" strokeWidth="0.8" opacity="0.45" />
          <line x1="15" y1="31" x2="23.5" y2="31" stroke="#C2410C" strokeWidth="0.8" opacity="0.45" />

          {/* Soft light highlight across knuckles */}
          <path d="M21 19.2 Q25 19.2 26.5 20" stroke="#FFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        </svg>
      );

    case 'heart':
    case '❤️':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`filter drop-shadow-[0_2px_5px_rgba(244,63,94,0.45)] shrink-0 select-none ${className}`}
        >
          <defs>
            <radialGradient id="ht-base" cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#FF5252" />
              <stop offset="35%" stopColor="#FF1744" />
              <stop offset="70%" stopColor="#D50000" />
              <stop offset="100%" stopColor="#880E4F" />
            </radialGradient>
            <linearGradient id="ht-gloss" x1="0.2" y1="0.1" x2="0.6" y2="0.9">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#FF8A80" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="ht-specular" cx="28%" cy="22%" r="45%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* 3D Heart Main Body */}
          <path
            d="M18 32 C16.5 30.5 4 21.5 4 12.5 C4 6.8 8.4 3 13.5 3 C16.4 3 17.5 4.5 18 5.2 C18.5 4.5 19.6 3 22.5 3 C27.6 3 32 6.8 32 12.5 C32 21.5 19.5 30.5 18 32 Z"
            fill="url(#ht-base)"
          />
          {/* Deep inner shadow curve */}
          <path
            d="M18 32 C23 27 30 19 30 13 C30 9 27 5.5 23 5.5 C20.5 5.5 19 6.8 18 8 L18 32 Z"
            fill="#880E4F"
            opacity="0.18"
          />
          {/* Primary Gloss shine on left lobe */}
          <ellipse cx="11.5" cy="9.5" rx="4.5" ry="3.5" transform="rotate(-30 11.5 9.5)" fill="url(#ht-specular)" />
          {/* Secondary subtle glint on right lobe */}
          <ellipse cx="23.5" cy="8.5" rx="3.2" ry="2" transform="rotate(25 23.5 8.5)" fill="#FFFFFF" opacity="0.55" />
          {/* Specular curve */}
          <path
            d="M6.5 12 C6.5 8 9.5 5.5 13 5.2"
            stroke="url(#ht-gloss)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'laugh':
    case '😂':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`filter drop-shadow-[0_2px_4px_rgba(234,179,8,0.4)] shrink-0 select-none ${className}`}
        >
          <defs>
            <radialGradient id="lf-sphere" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#FFF176" />
              <stop offset="45%" stopColor="#FFD54F" />
              <stop offset="80%" stopColor="#FFB300" />
              <stop offset="100%" stopColor="#E65100" />
            </radialGradient>
            <radialGradient id="lf-tear" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="40%" stopColor="#38BDF8" />
              <stop offset="85%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </radialGradient>
          </defs>
          {/* Face Sphere */}
          <circle cx="18" cy="18" r="16" fill="url(#lf-sphere)" />
          {/* 3D Top Highlight */}
          <ellipse cx="14" cy="7" rx="7" ry="2.5" fill="#FFFFFF" opacity="0.45" />

          {/* Squinting Eyes (Laughing) */}
          <path d="M7.5 14 Q11.5 9 14.5 14" stroke="#4A1E00" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M21.5 14 Q24.5 9 28.5 14" stroke="#4A1E00" strokeWidth="2.4" strokeLinecap="round" fill="none" />

          {/* Eyebrows angled up with joy */}
          <path d="M7 10 Q11 7 13.5 10.5" stroke="#683400" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
          <path d="M22.5 10.5 Q25 7 29 10" stroke="#683400" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />

          {/* Open Laughing Mouth */}
          <path
            d="M10 19 Q18 20 26 19 C26 27 22.5 30 18 30 C13.5 30 10 27 10 19 Z"
            fill="#3E1700"
          />
          {/* Tongue inside mouth */}
          <path
            d="M13.5 26.5 Q18 23.5 22.5 26.5 C21.5 29.5 19.5 30 18 30 C16.5 30 14.5 29.5 13.5 26.5 Z"
            fill="#EF4444"
          />
          {/* Top Teeth Row */}
          <path
            d="M10.8 19.5 Q18 20.5 25.2 19.5 C25 21.8 23 22.5 18 22.5 C13 22.5 11 21.8 10.8 19.5 Z"
            fill="#FFFFFF"
          />

          {/* Left Tear (Realistic 3D waterdrop splash) */}
          <path
            d="M5 16 C3 18.5 3 22 5.5 23.5 C8 24.5 9.5 22.5 8.5 19.5 C8 17.5 6 15 5 16 Z"
            fill="url(#lf-tear)"
          />
          <ellipse cx="5.2" cy="18.5" rx="1.2" ry="2" fill="#FFFFFF" opacity="0.8" />

          {/* Right Tear */}
          <path
            d="M31 16 C33 18.5 33 22 30.5 23.5 C28 24.5 26.5 22.5 27.5 19.5 C28 17.5 30 15 31 16 Z"
            fill="url(#lf-tear)"
          />
          <ellipse cx="30.8" cy="18.5" rx="1.2" ry="2" fill="#FFFFFF" opacity="0.8" />
        </svg>
      );

    case 'surprised':
    case '😮':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`filter drop-shadow-[0_2px_4px_rgba(234,179,8,0.4)] shrink-0 select-none ${className}`}
        >
          <defs>
            <radialGradient id="sp-sphere" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#FFF176" />
              <stop offset="45%" stopColor="#FFD54F" />
              <stop offset="80%" stopColor="#FFB300" />
              <stop offset="100%" stopColor="#E65100" />
            </radialGradient>
            <radialGradient id="sp-mouth" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#1E100A" />
              <stop offset="70%" stopColor="#3E1A00" />
              <stop offset="100%" stopColor="#682A00" />
            </radialGradient>
          </defs>
          <circle cx="18" cy="18" r="16" fill="url(#sp-sphere)" />
          {/* Top highlight */}
          <ellipse cx="14" cy="7" rx="7" ry="2.5" fill="#FFFFFF" opacity="0.45" />

          {/* Arched Surprised Eyebrows */}
          <path d="M8 9 Q12.5 5 15.5 9.5" stroke="#5D2600" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M20.5 9.5 Q23.5 5 28 9" stroke="#5D2600" strokeWidth="2.2" strokeLinecap="round" fill="none" />

          {/* Wide Open Eyes */}
          <ellipse cx="12" cy="15.5" rx="3.5" ry="4.5" fill="#FFFFFF" />
          <ellipse cx="24" cy="15.5" rx="3.5" ry="4.5" fill="#FFFFFF" />
          <circle cx="12" cy="15.5" r="2.2" fill="#2E1605" />
          <circle cx="24" cy="15.5" r="2.2" fill="#2E1605" />
          {/* Eye specular gleam */}
          <circle cx="11" cy="14.5" r="0.8" fill="#FFFFFF" />
          <circle cx="23" cy="14.5" r="0.8" fill="#FFFFFF" />

          {/* O-Shaped Surprised Mouth */}
          <ellipse cx="18" cy="24.5" rx="4.8" ry="6" fill="url(#sp-mouth)" />
          <ellipse cx="18" cy="24.5" rx="4.8" ry="6" stroke="#C2410C" strokeWidth="0.8" opacity="0.6" />
        </svg>
      );

    case 'sad':
    case '😢':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`filter drop-shadow-[0_2px_4px_rgba(234,179,8,0.4)] shrink-0 select-none ${className}`}
        >
          <defs>
            <radialGradient id="sd-sphere" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#FFF176" />
              <stop offset="45%" stopColor="#FFD54F" />
              <stop offset="80%" stopColor="#FFB300" />
              <stop offset="100%" stopColor="#E65100" />
            </radialGradient>
            <radialGradient id="sd-tear" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="45%" stopColor="#38BDF8" />
              <stop offset="90%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </radialGradient>
          </defs>
          <circle cx="18" cy="18" r="16" fill="url(#sd-sphere)" />
          <ellipse cx="14" cy="7" rx="7" ry="2.5" fill="#FFFFFF" opacity="0.45" />

          {/* Sad upturned eyebrows */}
          <path d="M8 11.5 Q12 13.5 14.5 10.5" stroke="#5D2600" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M21.5 10.5 Q24 13.5 28 11.5" stroke="#5D2600" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Sad downturned eyes */}
          <path d="M9.5 16.5 Q12.5 13.5 15.5 16" stroke="#4A1E00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M20.5 16 Q23.5 13.5 26.5 16.5" stroke="#4A1E00" strokeWidth="2.2" strokeLinecap="round" fill="none" />

          {/* Downturned Sad Mouth */}
          <path d="M12.5 26 Q18 21.5 23.5 26" stroke="#4A1E00" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Single Glistening Tear rolling down right cheek */}
          <path
            d="M24 18 C22.5 20.5 22 23 23.5 25 C25 26.5 27 25.5 27 23.5 C27 21 25.5 19 24 18 Z"
            fill="url(#sd-tear)"
          />
          <circle cx="24.2" cy="22" r="1" fill="#FFFFFF" opacity="0.8" />
        </svg>
      );

    case 'fire':
    case '🔥':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`filter drop-shadow-[0_2px_6px_rgba(239,68,68,0.5)] shrink-0 select-none ${className}`}
        >
          <defs>
            <radialGradient id="fr-outer" cx="50%" cy="75%" r="75%">
              <stop offset="0%" stopColor="#FFA000" />
              <stop offset="40%" stopColor="#FF3D00" />
              <stop offset="85%" stopColor="#D50000" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </radialGradient>
            <radialGradient id="fr-core" cx="45%" cy="80%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#FFF176" />
              <stop offset="75%" stopColor="#FFB300" />
              <stop offset="100%" stopColor="#FF6D00" />
            </radialGradient>
          </defs>

          {/* Outer Fire Plume */}
          <path
            d="M17.5 2 C17.5 2 13 8 13 14 C13 15.5 13.5 16.8 14 18 C11.5 16 10 13 10 9 C6 13.5 4 19 4 23.5 C4 30.5 10 35 18 35 C26 35 32 30 32 23.5 C32 17 28 12 25 8 C25 10.5 24 12.5 22.5 13.5 C23 9 21.5 5 17.5 2 Z"
            fill="url(#fr-outer)"
          />

          {/* Inner Flame Core (Yellow & White Heat) */}
          <path
            d="M18 12 C18 12 14.5 17 14.5 21 C14.5 22.2 15 23 15.5 24 C13.5 22.5 13 20 13 18.5 C10.5 21 9 24 9 26.5 C9 31 13 33.5 18 33.5 C23 33.5 27 30.5 27 26 C27 22 24.5 18.5 22 16 C22 17.5 21.5 18.8 20.5 19.5 C21 16.5 20 14 18 12 Z"
            fill="url(#fr-core)"
          />

          {/* White-hot center highlight */}
          <ellipse cx="18" cy="27.5" rx="3.5" ry="4.5" fill="#FFFFFF" opacity="0.8" />
        </svg>
      );

    default:
      return <span className={`text-base leading-none select-none ${className}`}>{name}</span>;
  }
}

export const REALISTIC_EMOJIS: {
  key: RealisticEmojiKey;
  symbol: string;
  label: string;
  bgGlow: string;
}[] = [
  { key: 'thumbs_up', symbol: '👍', label: 'Like', bgGlow: 'hover:shadow-[0_0_12px_rgba(234,179,8,0.4)]' },
  { key: 'heart', symbol: '❤️', label: 'Love', bgGlow: 'hover:shadow-[0_0_12px_rgba(244,63,94,0.5)]' },
  { key: 'laugh', symbol: '😂', label: 'Haha', bgGlow: 'hover:shadow-[0_0_12px_rgba(234,179,8,0.4)]' },
  { key: 'surprised', symbol: '😮', label: 'Wow', bgGlow: 'hover:shadow-[0_0_12px_rgba(234,179,8,0.4)]' },
  { key: 'sad', symbol: '😢', label: 'Sad', bgGlow: 'hover:shadow-[0_0_12px_rgba(59,130,246,0.4)]' },
  { key: 'fire', symbol: '🔥', label: 'Fire', bgGlow: 'hover:shadow-[0_0_12px_rgba(239,68,68,0.5)]' }
];
