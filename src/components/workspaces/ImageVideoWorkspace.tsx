import React, { useEffect, useRef, useState } from 'react';
import { Play, Heart, MessageCircle, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useWorkspaceChat } from '../../hooks/useWorkspaceChat';
import ChatHistory from '../ChatHistory';
import ChatInput from '../ChatInput';

interface ImageVideoWorkspaceProps {
  isDark: boolean;
}

interface HoloCardData {
  id: string;
  // Normalized coordinates inside the right projection cluster (kept well inside viewport so nothing clips)
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  delay: number;
  prompt: string;
  imageUrl: string;
  isMain?: boolean;
  hasPlayOrb?: boolean;
  panDirection: 'zoom-in' | 'pan-right' | 'pan-left' | 'zoom-out';
}

// Realistic 3D projected holographic media frames matching the reference image layout & subjects,
// with zero extra text clutter and interactive prompt loading on click.
const HOLO_CARDS: HoloCardData[] = [
  // 1. Top-Left Landscape Frame: Studio Group Choreography
  {
    id: 'holo-1',
    x: 2,
    y: 25,
    w: 138,
    h: 92,
    z: 24,
    delay: 0,
    prompt: 'Create a photorealistic 8k resolution visual of [Subject], shot on 35mm lens, natural volumetric lighting, ultra-detailed textures.',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=85',
    panDirection: 'zoom-in'
  },
  // 2. Upper-Middle Portrait Frame: Vertical Street Reel
  {
    id: 'holo-2',
    x: 24,
    y: 12,
    w: 88,
    h: 136,
    z: 36,
    delay: 0.5,
    prompt: 'Generate a cinematic vertical 4K motion reel of [Subject], smooth gimbal tracking shot, natural studio lighting, shallow depth of field.',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=500&q=85',
    panDirection: 'pan-right'
  },
  // 3. Upper-Right Portrait Frame: Neon 3D Abstract Art
  {
    id: 'holo-3',
    x: 43,
    y: 6,
    w: 84,
    h: 130,
    z: 28,
    delay: 1.1,
    prompt: 'Design a clean 3D isometric render of [Subject], smooth clay materials, subtle soft shadows, Octane render, minimalist aesthetic.',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=85',
    panDirection: 'zoom-out'
  },
  // 4. Top-Far-Right Landscape Frame: Coastal Sunset Cliff
  {
    id: 'holo-4',
    x: 61,
    y: 18,
    w: 122,
    h: 82,
    z: 16,
    delay: 1.6,
    prompt: 'Create a sweeping 4K aerial drone shot over [Subject] at sunset, dramatic coastal cliffs, golden hour ocean reflections, cinematic grade.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=85',
    panDirection: 'pan-left'
  },
  // 5. Center Hero Main Landscape Screen: Live Dance / Motion Capture
  {
    id: 'holo-main',
    x: 28,
    y: 36,
    w: 196,
    h: 128,
    z: 56,
    delay: 0.25,
    isMain: true,
    prompt: 'Generate a cinematic movie still of [Subject], anamorphic lens flare, film grain, dramatic moody lighting, IMAX 70mm composition.',
    imageUrl: 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=800&q=85',
    panDirection: 'zoom-in'
  },
  // 6. Middle-Far-Right Landscape Frame: Red Sports Car on Highway
  {
    id: 'holo-6',
    x: 67,
    y: 41,
    w: 118,
    h: 82,
    z: 28,
    delay: 0.85,
    prompt: 'Create a cyberpunk aesthetic scene of [Subject], neon magenta and cyan reflections, wet asphalt, futuristic atmospheric lighting.',
    imageUrl: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=600&q=85',
    panDirection: 'pan-right'
  },
  // 7. Bottom-Left Landscape Frame: Alpine Mountain Sunrise
  {
    id: 'holo-7',
    x: 2,
    y: 53,
    w: 136,
    h: 88,
    z: 30,
    delay: 1.3,
    prompt: 'Create an ultra-wide golden hour mountain landscape of [Subject], volumetric sun rays piercing through peaks, crisp atmospheric depth.',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=85',
    panDirection: 'pan-left'
  },
  // 8. Bottom-Center Landscape Frame: Canyon with Glowing Cyan Play Orb
  {
    id: 'holo-8',
    x: 20,
    y: 66,
    w: 128,
    h: 86,
    z: 46,
    delay: 1.85,
    hasPlayOrb: true,
    prompt: 'Generate a high-speed FPV action sequence of [Subject], dynamic motion blur, dramatic sunlit canyon lighting, 60fps clarity.',
    imageUrl: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=600&q=85',
    panDirection: 'zoom-in'
  },
  // 9. Bottom-Right Landscape Frame: Tropical Turquoise Beach
  {
    id: 'holo-9',
    x: 47,
    y: 64,
    w: 138,
    h: 92,
    z: 40,
    delay: 1.05,
    prompt: 'Create a vibrant photorealistic coastal scene of [Subject], crystal clear turquoise water, natural sunlight reflections, 8k detail.',
    imageUrl: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=600&q=85',
    panDirection: 'zoom-out'
  },
  // 10. Far Bottom-Right Neon Stage Accent Frame
  {
    id: 'holo-10',
    x: 68,
    y: 59,
    w: 98,
    h: 72,
    z: 12,
    delay: 2.2,
    prompt: 'Design a futuristic neon concert visual of [Subject], volumetric laser beams, bioluminescent magenta and cyan glow.',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=85',
    panDirection: 'pan-right'
  }
];

function RealisticHologramMedia({ card }: { card: HoloCardData }) {
  const motionAnimate =
    card.panDirection === 'zoom-in'
      ? { scale: [1.02, 1.14, 1.02], x: ['0%', '-2%', '0%'] }
      : card.panDirection === 'zoom-out'
      ? { scale: [1.14, 1.02, 1.14], x: ['-2%', '2%', '-2%'] }
      : card.panDirection === 'pan-right'
      ? { scale: [1.1, 1.1, 1.1], x: ['-4%', '4%', '-4%'] }
      : { scale: [1.1, 1.1, 1.1], x: ['4%', '-4%', '4%'] };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      {/* Real High-Res Photographic Media with Smooth Live Video Motion */}
      <motion.img
        src={card.imageUrl}
        alt=""
        draggable={false}
        animate={motionAnimate}
        transition={{
          duration: 9 + (card.delay % 3),
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="w-full h-full object-cover opacity-90 contrast-110 saturate-115"
      />

      {/* Subtle Holographic Glass Tint & Edge Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(0, 229, 255, 0.16) 0%, rgba(255, 255, 255, 0.02) 45%, rgba(168, 85, 247, 0.18) 100%)'
        }}
      />

      {/* Moving Optical Light Sweep Across the Hologram Glass */}
      <motion.div
        animate={{ x: ['-140%', '220%'] }}
        transition={{
          duration: 5.5 + card.delay,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatDelay: 1.5
        }}
        className="absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
      />

      {/* Glowing Turquoise Play Orb on the Bottom Canyon Card (Matches Reference Photo) */}
      {card.hasPlayOrb && (
        <motion.div
          animate={{ scale: [0.94, 1.06, 0.94] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-cyan-400/90 shadow-[0_0_18px_#00e5ff] flex items-center justify-center border border-white/70 pointer-events-none"
        >
          <Play size={12} className="text-slate-950 fill-slate-950 ml-0.5" />
        </motion.div>
      )}

      {/* Minimal Tiny White Video UI Dots on the Main Center Screen (Matches Reference Photo) */}
      {card.isMain && (
        <div className="absolute right-2 bottom-2.5 flex flex-col gap-1.5 items-center z-20 pointer-events-none opacity-85">
          <div className="w-3.5 h-3.5 rounded-full bg-white/25 backdrop-blur-xs flex items-center justify-center">
            <Heart size={7} className="text-white fill-white" />
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-white/25 backdrop-blur-xs flex items-center justify-center">
            <MessageCircle size={7} className="text-white fill-white" />
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-white/25 backdrop-blur-xs flex items-center justify-center">
            <Share2 size={7} className="text-white" />
          </div>
        </div>
      )}

      {/* Ultra-fine Holographic Interference Lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 229, 255, 0.18) 3px)'
        }}
      />
    </div>
  );
}

// ============================================================================
// REALISTIC 3D HOLOGRAPHIC CAMERA & FLOATING MEDIA PROJECTION STUDIO
// ============================================================================
function HolographicCameraStudioBackground({
  isDark,
  isGenerating,
  isInteractive,
  onSelectPrompt
}: {
  isDark: boolean;
  isGenerating: boolean;
  isInteractive: boolean;
  onSelectPrompt: (prompt: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouseOffset({ x: nx, y: ny });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

    const PARTICLE_COUNT = 180;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      progress: Math.random(),
      spreadAngle: (Math.random() - 0.5) * 1.15,
      speed: 0.002 + Math.random() * 0.0042,
      size: 0.6 + Math.random() * 1.9,
      hueType: Math.random() > 0.4 ? 'cyan' : Math.random() > 0.45 ? 'violet' : 'white',
      twinkleSpeed: 2 + Math.random() * 4,
      phase: Math.random() * Math.PI * 2
    }));

    let time = 0;

    const render = () => {
      const speedMult = isGenerating ? 2.2 : 1;
      time += 0.016 * speedMult;

      // 1. Deep Futuristic Cyber-Studio Room Base
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#02050d');
      bgGrad.addColorStop(0.35, '#04091a');
      bgGrad.addColorStop(0.7, '#090922');
      bgGrad.addColorStop(1, '#02040b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const lensX = width * 0.285;
      const lensY = height * 0.51;
      const ceilingY = height * 0.15;
      const floorY = height * 0.81;

      // =========================================================================
      // 2. ARCHITECTURAL STUDIO BACKGROUND BEHIND THE CAMERA (MATCHING IMAGE.PNG)
      // =========================================================================
      ctx.save();

      // A. Far-Left Interior Room & 3 Framed Storyboard/Photo Prints Behind Glass
      const leftWallGrad = ctx.createLinearGradient(0, ceilingY, width * 0.14, floorY);
      leftWallGrad.addColorStop(0, '#040a18');
      leftWallGrad.addColorStop(0.5, '#071229');
      leftWallGrad.addColorStop(1, '#030712');
      ctx.fillStyle = leftWallGrad;
      ctx.fillRect(0, ceilingY * 0.7, width * 0.13, floorY - ceilingY * 0.5);

      // 3 Vertically Stacked Framed Prints on the Far-Left Wall (Seen Through Glass)
      const frameX = width * 0.012;
      const frameW = Math.max(28, width * 0.048);
      const frameH = Math.max(34, height * 0.078);
      const printYPositions = [height * 0.41, height * 0.505, height * 0.60];

      printYPositions.forEach((py, idx) => {
        ctx.save();
        // Slight perspective skew on wall prints
        ctx.transform(1, 0.04, 0.02, 1, 0, 0);
        // Matte paper border
        ctx.fillStyle = 'rgba(148, 163, 184, 0.36)';
        ctx.fillRect(frameX, py, frameW, frameH);
        // Inner dark monochrome photograph tone
        const artGrad = ctx.createLinearGradient(frameX, py, frameX + frameW, py + frameH);
        artGrad.addColorStop(0, idx === 2 ? 'rgba(14, 116, 144, 0.55)' : 'rgba(30, 41, 59, 0.88)');
        artGrad.addColorStop(1, 'rgba(2, 6, 23, 0.92)');
        ctx.fillStyle = artGrad;
        ctx.fillRect(frameX + 3, py + 3, frameW - 6, frameH - 6);

        // Abstract photo silhouette details inside each frame
        ctx.fillStyle = 'rgba(186, 230, 253, 0.22)';
        if (idx === 0) {
          ctx.fillRect(frameX + frameW * 0.42, py + 6, frameW * 0.22, frameH * 0.45);
          ctx.beginPath();
          ctx.arc(frameX + frameW * 0.52, py + frameH * 0.3, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (idx === 1) {
          ctx.beginPath();
          ctx.arc(frameX + frameW * 0.45, py + frameH * 0.52, frameW * 0.24, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
          ctx.fillRect(frameX + 4, py + frameH * 0.55, frameW - 8, frameH * 0.28);
        }
        ctx.restore();
      });

      // B. Tall Reflective Dark Glass Partition Panels & Brushed Metal Mullions (Left of Pillar)
      const glassPanelLeft = width * 0.065;
      const glassPanelRight = width * 0.195;
      const glassGrad = ctx.createLinearGradient(glassPanelLeft, ceilingY * 0.8, glassPanelRight, floorY);
      glassGrad.addColorStop(0, 'rgba(8, 20, 46, 0.72)');
      glassGrad.addColorStop(0.45, 'rgba(5, 13, 32, 0.82)');
      glassGrad.addColorStop(1, 'rgba(3, 8, 22, 0.90)');
      ctx.fillStyle = glassGrad;
      ctx.fillRect(glassPanelLeft, ceilingY * 0.75, glassPanelRight - glassPanelLeft, floorY - ceilingY * 0.75);

      // Subtle diagonal glass reflection sheen on the partition
      const sheenGrad = ctx.createLinearGradient(glassPanelLeft, height * 0.25, glassPanelRight, height * 0.68);
      sheenGrad.addColorStop(0, 'rgba(56, 189, 248, 0.0)');
      sheenGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.055)');
      sheenGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(glassPanelLeft, ceilingY * 0.75, glassPanelRight - glassPanelLeft, floorY - ceilingY * 0.75);

      // Vertical Dark Brushed-Metal Door Mullions (Glass Partition Dividers)
      const drawVerticalMullion = (mx: number, mw: number, highlightAlpha = 0.22) => {
        const mGrad = ctx.createLinearGradient(mx, 0, mx + mw, 0);
        mGrad.addColorStop(0, '#040814');
        mGrad.addColorStop(0.35, '#101c38');
        mGrad.addColorStop(0.7, '#081024');
        mGrad.addColorStop(1, '#02050d');
        ctx.fillStyle = mGrad;
        ctx.fillRect(mx, ceilingY * 0.65, mw, floorY - ceilingY * 0.65 + 10);

        // Specular edge line
        ctx.strokeStyle = `rgba(96, 165, 250, ${highlightAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mx + mw * 0.35, ceilingY * 0.65);
        ctx.lineTo(mx + mw * 0.35, floorY);
        ctx.stroke();
      };

      drawVerticalMullion(width * 0.062, Math.max(8, width * 0.012), 0.2);
      drawVerticalMullion(width * 0.095, Math.max(6, width * 0.008), 0.14);
      drawVerticalMullion(width * 0.142, Math.max(7, width * 0.009), 0.18);

      // Glowing Cyan Floor Track Reflection Inside Left Glass Partition (Matches Bottom-Left of image.png)
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
      ctx.shadowColor = 'rgba(0, 229, 255, 0.65)';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, floorY - height * 0.055);
      ctx.lineTo(width * 0.185, floorY - height * 0.085);
      ctx.lineTo(width * 0.185, floorY - height * 0.025);
      ctx.lineTo(width * 0.04, floorY + height * 0.01);
      ctx.stroke();
      ctx.restore();

      // C. Ghostly Translucent Reflection of the 3D Camera in the Glass Partition (Left of Main Pillar)
      const reflCamX = width * 0.138;
      const reflCamY = lensY + 4;
      const reflCamW = Math.max(54, width * 0.058);
      const reflCamH = Math.max(50, height * 0.096);

      ctx.save();
      const reflGlow = ctx.createRadialGradient(reflCamX + reflCamW * 0.5, reflCamY, 4, reflCamX + reflCamW * 0.5, reflCamY, reflCamW * 0.95);
      reflGlow.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
      reflGlow.addColorStop(0.55, 'rgba(37, 99, 235, 0.08)');
      reflGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = reflGlow;
      ctx.fillRect(reflCamX - 24, reflCamY - reflCamH, reflCamW + 48, reflCamH * 2);

      // Reflected camera body silhouette
      ctx.fillStyle = 'rgba(30, 64, 175, 0.16)';
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.24)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.roundRect(reflCamX - reflCamW * 0.5, reflCamY - reflCamH * 0.48, reflCamW, reflCamH, 8);
      ctx.fill();
      ctx.stroke();

      // Reflected top viewfinder hump
      ctx.beginPath();
      ctx.moveTo(reflCamX - reflCamW * 0.14, reflCamY - reflCamH * 0.48);
      ctx.lineTo(reflCamX - reflCamW * 0.04, reflCamY - reflCamH * 0.66);
      ctx.lineTo(reflCamX + reflCamW * 0.34, reflCamY - reflCamH * 0.66);
      ctx.lineTo(reflCamX + reflCamW * 0.44, reflCamY - reflCamH * 0.48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Reflected concentric lens circles in the glass
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.beginPath();
      ctx.ellipse(reflCamX + reflCamW * 0.18, reflCamY + 2, reflCamW * 0.24, reflCamH * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.20)';
      ctx.beginPath();
      ctx.ellipse(reflCamX + reflCamW * 0.18, reflCamY + 2, reflCamW * 0.15, reflCamH * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // D. Purple / Violet Ambient Studio Backlight (Right of the Steel Column, Behind the Camera Lens)
      const purpleBacklightX = width * 0.315;
      const purpleBacklightY = lensY - height * 0.02;
      const violetAmbient = ctx.createRadialGradient(
        purpleBacklightX,
        purpleBacklightY,
        10,
        purpleBacklightX,
        purpleBacklightY,
        width * 0.22
      );
      violetAmbient.addColorStop(0, 'rgba(192, 38, 211, 0.42)');
      violetAmbient.addColorStop(0.38, 'rgba(147, 51, 234, 0.28)');
      violetAmbient.addColorStop(0.72, 'rgba(88, 28, 135, 0.10)');
      violetAmbient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = violetAmbient;
      ctx.fillRect(width * 0.15, ceilingY * 0.5, width * 0.36, floorY);

      // Vertical Background Metallic Panel on the Right of the Main Column (reflecting purple studio light)
      const rightPanelX = width * 0.325;
      const rightPanelW = width * 0.055;
      const rightPanelGrad = ctx.createLinearGradient(rightPanelX, ceilingY, rightPanelX + rightPanelW, floorY);
      rightPanelGrad.addColorStop(0, 'rgba(18, 14, 42, 0.85)');
      rightPanelGrad.addColorStop(0.5, 'rgba(46, 22, 78, 0.72)');
      rightPanelGrad.addColorStop(1, 'rgba(12, 10, 30, 0.90)');
      ctx.fillStyle = rightPanelGrad;
      ctx.fillRect(rightPanelX, ceilingY * 0.85, rightPanelW, floorY - ceilingY * 0.85);

      // E. MAIN WIDE 3D BRUSHED-STEEL VERTICAL PILLAR DIRECTLY BEHIND THE HOLOGRAPHIC CAMERA
      const pillarX = width * 0.192;
      const pillarW = width * 0.092;
      const pillarTopY = ceilingY * 0.72;
      const pillarBottomY = floorY + height * 0.02;

      // Left side depth bevel of the steel pillar
      const bevelW = Math.max(8, width * 0.012);
      const leftBevelGrad = ctx.createLinearGradient(pillarX - bevelW, 0, pillarX, 0);
      leftBevelGrad.addColorStop(0, '#030712');
      leftBevelGrad.addColorStop(0.7, '#0f2042');
      leftBevelGrad.addColorStop(1, '#1e3a6e');
      ctx.fillStyle = leftBevelGrad;
      ctx.fillRect(pillarX - bevelW, pillarTopY, bevelW, pillarBottomY - pillarTopY);

      // Main Front Brushed-Steel Column Face (with cyan left rim & violet right sheen like image.png)
      const pillarFaceGrad = ctx.createLinearGradient(pillarX, pillarTopY, pillarX + pillarW, pillarBottomY);
      pillarFaceGrad.addColorStop(0, '#16274c');
      pillarFaceGrad.addColorStop(0.28, '#1e325c');
      pillarFaceGrad.addColorStop(0.52, '#17254a');
      pillarFaceGrad.addColorStop(0.78, '#2b1d52');
      pillarFaceGrad.addColorStop(1, '#0e1730');
      ctx.fillStyle = pillarFaceGrad;
      ctx.fillRect(pillarX, pillarTopY, pillarW, pillarBottomY - pillarTopY);

      // Vertical brushed-metal specular sheen along the pillar
      const pillarSheenGrad = ctx.createLinearGradient(pillarX, 0, pillarX + pillarW, 0);
      pillarSheenGrad.addColorStop(0, 'rgba(96, 165, 250, 0.32)');
      pillarSheenGrad.addColorStop(0.18, 'rgba(148, 163, 184, 0.12)');
      pillarSheenGrad.addColorStop(0.54, 'rgba(15, 23, 42, 0.35)');
      pillarSheenGrad.addColorStop(0.58, 'rgba(2, 6, 23, 0.85)'); // Vertical recessed channel seam
      pillarSheenGrad.addColorStop(0.62, 'rgba(56, 189, 248, 0.18)');
      pillarSheenGrad.addColorStop(0.88, 'rgba(192, 132, 252, 0.28)');
      pillarSheenGrad.addColorStop(1, 'rgba(216, 180, 254, 0.38)');
      ctx.fillStyle = pillarSheenGrad;
      ctx.fillRect(pillarX, pillarTopY, pillarW, pillarBottomY - pillarTopY);

      // Crisp specular vertical edge highlights on the steel pillar
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.38)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pillarX, pillarTopY);
      ctx.lineTo(pillarX, pillarBottomY);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(216, 180, 254, 0.34)';
      ctx.beginPath();
      ctx.moveTo(pillarX + pillarW, pillarTopY);
      ctx.lineTo(pillarX + pillarW, pillarBottomY);
      ctx.stroke();

      // F. Angled Dark Metallic Ceiling Frame, Acoustic Grid & Hanging Black Studio Cables
      ctx.save();
      const ceilingGrad = ctx.createLinearGradient(0, 0, 0, ceilingY * 1.35);
      ceilingGrad.addColorStop(0, '#010308');
      ceilingGrad.addColorStop(0.7, '#061024');
      ceilingGrad.addColorStop(1, 'rgba(8, 18, 40, 0.0)');
      ctx.fillStyle = ceilingGrad;
      ctx.fillRect(0, 0, width, ceilingY * 1.35);

      // Angled perspective ceiling beams (Matches top of image.png)
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.13);
      ctx.lineTo(width * 0.22, height * 0.055);
      ctx.lineTo(width * 0.48, height * 0.16);
      ctx.lineTo(width, height * 0.08);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.134);
      ctx.lineTo(width * 0.22, height * 0.059);
      ctx.lineTo(width * 0.48, height * 0.164);
      ctx.stroke();

      // Hanging Curved Black Studio Cables at the Top Above the Camera (Matches top-center of image.png)
      const topCables = [
        { x1: width * 0.11, y1: height * 0.085, cx1: width * 0.17, cy1: height * 0.175, cx2: width * 0.24, cy2: height * 0.14, x2: width * 0.28, y2: 0, w: 3.2 },
        { x1: width * 0.125, y1: height * 0.08, cx1: width * 0.185, cy1: height * 0.195, cx2: width * 0.255, cy2: height * 0.155, x2: width * 0.30, y2: 0, w: 2.6 },
        { x1: width * 0.14, y1: height * 0.075, cx1: width * 0.20, cy1: height * 0.21, cx2: width * 0.27, cy2: height * 0.165, x2: width * 0.32, y2: 0, w: 2.2 },
        { x1: width * 0.16, y1: height * 0.068, cx1: width * 0.215, cy1: height * 0.16, cx2: width * 0.275, cy2: height * 0.12, x2: width * 0.335, y2: 0, w: 1.8 }
      ];
      topCables.forEach((c) => {
        // Dark cable core
        ctx.strokeStyle = '#02040a';
        ctx.lineWidth = c.w;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(c.x1, c.y1);
        ctx.bezierCurveTo(c.cx1, c.cy1, c.cx2, c.cy2, c.x2, c.y2);
        ctx.stroke();

        // Subtle blue bottom rim reflection on cable
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(c.x1, c.y1 + 1);
        ctx.bezierCurveTo(c.cx1, c.cy1 + 1.2, c.cx2, c.cy2 + 1, c.x2, c.y2);
        ctx.stroke();
      });
      ctx.restore();

      // G. Glowing Horizontal Violet/Magenta Studio Indicator Bars Behind the Pillar & Right Wall
      const drawNeonBar = (x1: number, y1: number, x2: number, y2: number, color: string, glowColor: string, thickness = 4) => {
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 18;
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, thickness * 0.35);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      };

      // Two glowing violet horizontal light slits right behind the pillar (exact match to image.png)
      drawNeonBar(width * 0.296, height * 0.375, width * 0.312, height * 0.375, '#e879f9', '#c026d3', 3.5);
      drawNeonBar(width * 0.296, height * 0.715, width * 0.312, height * 0.715, '#e879f9', '#c026d3', 3.5);

      // Far-right studio wall neon bars
      drawNeonBar(width * 0.86, height * 0.25, width * 0.995, height * 0.242, '#d946ef', '#c026d3', 4);
      drawNeonBar(width * 0.86, height * 0.70, width * 0.995, height * 0.71, '#d946ef', '#c026d3', 4);

      // H. Dark Reflective Studio Floor, Pillar Baseplate & Coiled Floor Cables (Matches Bottom of image.png)
      ctx.save();
      const floorGrad = ctx.createLinearGradient(0, floorY - height * 0.03, 0, height);
      floorGrad.addColorStop(0, '#040a1a');
      floorGrad.addColorStop(0.35, '#071128');
      floorGrad.addColorStop(1, '#02040a');
      ctx.fillStyle = floorGrad;
      ctx.beginPath();
      ctx.moveTo(0, floorY + height * 0.04);
      ctx.lineTo(width * 0.28, floorY - height * 0.02);
      ctx.lineTo(width, height * 0.74);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Floor reflection beneath the steel pillar & camera
      const floorReflGrad = ctx.createRadialGradient(
        width * 0.25,
        floorY + height * 0.04,
        6,
        width * 0.25,
        floorY + height * 0.04,
        width * 0.18
      );
      floorReflGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      floorReflGrad.addColorStop(0.5, 'rgba(147, 51, 234, 0.12)');
      floorReflGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = floorReflGrad;
      ctx.fillRect(width * 0.05, floorY - height * 0.02, width * 0.4, height * 0.24);

      // Metallic Baseplate at the Bottom of the Steel Pillar
      ctx.fillStyle = '#081226';
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(pillarX - 14, pillarBottomY + 2);
      ctx.lineTo(pillarX + pillarW + 10, pillarBottomY - 6);
      ctx.lineTo(pillarX + pillarW + 24, pillarBottomY + 12);
      ctx.lineTo(pillarX - 4, pillarBottomY + 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Snaking Coiled Black Studio Floor Cables (From Pillar Base toward Bottom-Left Foreground like image.png)
      const floorCables = [
        {
          x1: pillarX + pillarW * 0.35,
          y1: pillarBottomY + 10,
          cx1: width * 0.16,
          cy1: height * 0.86,
          cx2: width * 0.12,
          cy2: height * 0.93,
          x2: width * 0.05,
          y2: height,
          w: 4.2
        },
        {
          x1: pillarX + pillarW * 0.48,
          y1: pillarBottomY + 13,
          cx1: width * 0.18,
          cy1: height * 0.88,
          cx2: width * 0.135,
          cy2: height * 0.94,
          x2: width * 0.075,
          y2: height,
          w: 3.4
        },
        {
          x1: pillarX + pillarW * 0.25,
          y1: pillarBottomY + 8,
          cx1: width * 0.14,
          cy1: height * 0.85,
          cx2: width * 0.10,
          cy2: height * 0.91,
          x2: width * 0.02,
          y2: height * 0.985,
          w: 2.8
        }
      ];
      floorCables.forEach((fc) => {
        ctx.strokeStyle = '#010308';
        ctx.lineWidth = fc.w;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(fc.x1, fc.y1);
        ctx.bezierCurveTo(fc.cx1, fc.cy1, fc.cx2, fc.cy2, fc.x2, fc.y2);
        ctx.stroke();

        // Specular cyan rim light along top edge of floor cables
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.30)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fc.x1, fc.y1 - 1);
        ctx.bezierCurveTo(fc.cx1, fc.cy1 - 1.2, fc.cx2, fc.cy2 - 1, fc.x2, fc.y2 - 1);
        ctx.stroke();
      });

      // Right-Side Illuminated Cyber Floor Platform
      const padLeftX = width * 0.35;
      const padBottomY = height * 0.98;
      const padTopLeftX = width * 0.61;
      const padTopY = height * 0.77;

      ctx.fillStyle = 'rgba(6, 14, 32, 0.82)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.26)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padLeftX, padBottomY);
      ctx.lineTo(padTopLeftX, padTopY);
      ctx.lineTo(width * 1.02, height * 0.79);
      ctx.lineTo(width * 1.02, padBottomY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const pulseGlow = 0.75 + Math.sin(time * 2.2) * 0.25;
      const floorStrips = [
        [width * 0.50, height * 0.92, width * 0.63, height * 0.82],
        [width * 0.67, height * 0.79, width * 0.74, height * 0.795],
        [width * 0.77, height * 0.82, width * 0.82, height * 0.87],
        [width * 0.62, height * 0.90, width * 0.75, height * 0.91],
        [width * 0.58, height * 0.955, width * 0.78, height * 0.985],
        [width * 0.86, height * 0.92, width * 0.94, height * 0.99]
      ];
      floorStrips.forEach(([sx1, sy1, sx2, sy2]) => {
        drawNeonBar(
          sx1,
          sy1,
          sx2,
          sy2,
          `rgba(56, 189, 248, ${pulseGlow})`,
          'rgba(0, 229, 255, 0.9)'
        );
      });
      ctx.restore();

      // 3. Ambient Volumetric Studio Glows Around Camera & Screen Cluster
      const camAmbient = ctx.createRadialGradient(lensX, lensY, 8, lensX, lensY, width * 0.28);
      camAmbient.addColorStop(0, 'rgba(0, 225, 255, 0.34)');
      camAmbient.addColorStop(0.45, 'rgba(59, 130, 246, 0.14)');
      camAmbient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = camAmbient;
      ctx.fillRect(0, 0, width, height);

      const screenClusterX = width * 0.64;
      const screenClusterY = height * 0.46;
      const screenAmbient = ctx.createRadialGradient(
        screenClusterX,
        screenClusterY,
        20,
        screenClusterX,
        screenClusterY,
        width * 0.36
      );
      screenAmbient.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
      screenAmbient.addColorStop(0.45, 'rgba(56, 189, 248, 0.12)');
      screenAmbient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = screenAmbient;
      ctx.fillRect(0, 0, width, height);

      // 4. VOLUMETRIC HOLOGRAPHIC PROJECTION CONE & RAYS EMERGING FROM CAMERA LENS
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const coneGrad = ctx.createLinearGradient(lensX, lensY, width * 0.88, lensY);
      coneGrad.addColorStop(0, 'rgba(0, 240, 255, 0.48)');
      coneGrad.addColorStop(0.22, 'rgba(59, 130, 246, 0.26)');
      coneGrad.addColorStop(0.58, 'rgba(168, 85, 247, 0.16)');
      coneGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(lensX, lensY - 26);
      ctx.lineTo(width * 0.88, height * 0.08);
      ctx.lineTo(width * 0.88, height * 0.84);
      ctx.lineTo(lensX, lensY + 26);
      ctx.closePath();
      ctx.fill();

      const rayCount = 12;
      for (let r = 0; r < rayCount; r++) {
        const norm = r / (rayCount - 1) - 0.5;
        const wave = Math.sin(time * 1.7 + r * 0.9) * 0.022;
        const targetX = width * 0.86;
        const targetY = lensY + (norm + wave) * (height * 0.74);

        const rayAlpha = 0.12 + 0.13 * Math.sin(time * 2.3 + r * 1.1);
        const rayGrad = ctx.createLinearGradient(lensX, lensY, targetX, targetY);
        rayGrad.addColorStop(0, `rgba(0, 245, 255, ${(rayAlpha * 1.85).toFixed(3)})`);
        rayGrad.addColorStop(0.35, `rgba(99, 102, 241, ${rayAlpha.toFixed(3)})`);
        rayGrad.addColorStop(0.75, `rgba(192, 38, 211, ${(rayAlpha * 0.65).toFixed(3)})`);
        rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = rayGrad;
        ctx.lineWidth = r % 2 === 0 ? 13 : 6;
        ctx.beginPath();
        ctx.moveTo(lensX, lensY + norm * 34);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
      }

      // 5. Streaming Quantum Hologram Particles Emerging from the Lens
      particles.forEach((p) => {
        p.progress += p.speed * speedMult;
        if (p.progress > 1) {
          p.progress = 0;
          p.spreadAngle = (Math.random() - 0.5) * 1.15;
        }

        const dist = p.progress * (width * 0.6);
        const px = lensX + dist;
        const coneRadiusAtDist = 16 + p.progress * (height * 0.38);
        const swirl = Math.sin(time * 1.8 + p.phase + p.progress * 6) * 9;
        const py = lensY + p.spreadAngle * coneRadiusAtDist + swirl;

        const fadeIn = Math.min(1, p.progress * 5);
        const fadeOut = Math.max(0, 1 - Math.pow(p.progress, 2.2));
        const twinkle = 0.55 + 0.45 * Math.sin(time * p.twinkleSpeed + p.phase);
        const alpha = fadeIn * fadeOut * twinkle * 0.92;

        ctx.beginPath();
        ctx.arc(px, py, p.size * (0.6 + p.progress * 0.7), 0, Math.PI * 2);
        if (p.hueType === 'cyan') {
          ctx.fillStyle = `rgba(0, 238, 255, ${alpha.toFixed(3)})`;
        } else if (p.hueType === 'violet') {
          ctx.fillStyle = `rgba(217, 70, 239, ${alpha.toFixed(3)})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        }
        ctx.fill();
      });

      ctx.restore();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDark, isGenerating]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none">
      {/* 1. Real-time 60fps Canvas Room Architecture, Steel Pillar, Glass Reflection & Volumetric Beams */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* 2. Interactive 3D Scene Layer: Holographic Camera (Left) + Realistic Floating Hologram Frames (Right) */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${mouseOffset.x * -7}px, ${mouseOffset.y * -5}px, 0)`
        }}
      >
        {/* LEFT: Photorealistic 3D Translucent Frosted-Glass & Neon-Cyan Holographic Camera (Matches image.png) */}
        <div
          className="absolute left-[22%] sm:left-[24%] md:left-[25.5%] top-[51%] -translate-x-1/2 -translate-y-1/2 w-[165px] sm:w-[220px] md:w-[268px] aspect-square flex items-center justify-center"
          style={{
            perspective: '950px'
          }}
        >
          <motion.div
            animate={{
              y: [-4, 4, -4],
              rotateY: [14 + mouseOffset.x * 5, 18 + mouseOffset.x * 5, 14 + mouseOffset.x * 5],
              rotateX: [-2 - mouseOffset.y * 4, 2 - mouseOffset.y * 4, -2 - mouseOffset.y * 4]
            }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-full h-full flex items-center justify-center"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Volumetric Cyan & Violet Lens Aura Behind the Camera */}
            <div className="absolute inset-3 rounded-3xl bg-cyan-400/22 blur-2xl animate-pulse" />
            <div className="absolute right-0 top-1/4 bottom-1/4 w-24 rounded-full bg-purple-500/25 blur-2xl" />

            <svg
              viewBox="0 0 320 260"
              className="w-full h-full overflow-visible drop-shadow-[0_0_28px_rgba(0,229,255,0.68)]"
            >
              <defs>
                <linearGradient id="holoGlassBody" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(224, 242, 254, 0.34)" />
                  <stop offset="40%" stopColor="rgba(56, 189, 248, 0.18)" />
                  <stop offset="80%" stopColor="rgba(30, 58, 138, 0.24)" />
                  <stop offset="100%" stopColor="rgba(88, 28, 135, 0.26)" />
                </linearGradient>
                <linearGradient id="holoSideDepth" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(125, 211, 252, 0.32)" />
                  <stop offset="50%" stopColor="rgba(14, 116, 144, 0.18)" />
                  <stop offset="100%" stopColor="rgba(15, 23, 42, 0.45)" />
                </linearGradient>
                <linearGradient id="holoEdgeCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f0f9ff" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
                <radialGradient id="lensCoreGlow" cx="46%" cy="46%" r="54%">
                  <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.55" />
                  <stop offset="35%" stopColor="#1e3a8a" stopOpacity="0.85" />
                  <stop offset="72%" stopColor="#090d1e" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0.98" />
                </radialGradient>
                <linearGradient id="lensPurpleFlare" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(240, 249, 255, 0.9)" />
                  <stop offset="45%" stopColor="rgba(192, 132, 252, 0.78)" />
                  <stop offset="100%" stopColor="rgba(56, 189, 248, 0.0)" />
                </linearGradient>
              </defs>

              {/* Outer Segmented Cyan HUD Rings Around the Lens (Matches image.png) */}
              <g className="origin-[195px_144px] animate-spin" style={{ animationDuration: '20s' }}>
                <path
                  d="M 142 46 A 98 98 0 0 1 258 56"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                  strokeDasharray="5 3"
                  opacity="0.8"
                />
                <path
                  d="M 136 234 A 98 98 0 0 0 256 226"
                  fill="none"
                  stroke="#00e5ff"
                  strokeWidth="2.5"
                  strokeDasharray="14 5"
                  opacity="0.85"
                />
              </g>

              {/* Back 3D Extruded Glass Camera Depth Layer */}
              <rect
                x="44"
                y="68"
                width="216"
                height="142"
                rx="20"
                fill="url(#holoSideDepth)"
                stroke="rgba(125, 211, 252, 0.55)"
                strokeWidth="1.6"
              />

              {/* Top-Left Translucent Glass Shutter Button */}
              <rect
                x="72"
                y="56"
                width="34"
                height="13"
                rx="4"
                fill="url(#holoGlassBody)"
                stroke="url(#holoEdgeCyan)"
                strokeWidth="1.5"
              />

              {/* Top Frosted-Glass Viewfinder Hump (3D Extruded Prism) */}
              <path
                d="M 118 68 L 134 40 L 204 40 L 220 68 Z"
                fill="url(#holoSideDepth)"
                stroke="rgba(125, 211, 252, 0.5)"
                strokeWidth="1.4"
              />
              <path
                d="M 128 72 L 144 43 L 214 43 L 230 72 Z"
                fill="url(#holoGlassBody)"
                stroke="url(#holoEdgeCyan)"
                strokeWidth="2"
              />

              {/* Front Translucent Frosted-Glass Camera Body */}
              <rect
                x="62"
                y="72"
                width="222"
                height="144"
                rx="20"
                fill="url(#holoGlassBody)"
                stroke="url(#holoEdgeCyan)"
                strokeWidth="2.4"
              />

              {/* Internal 3D Translucent Glass Wall Partitions (Matches left side of camera in image.png) */}
              <line x1="44" y1="84" x2="62" y2="88" stroke="#7dd3fc" strokeWidth="1.5" opacity="0.7" />
              <line x1="44" y1="194" x2="62" y2="200" stroke="#7dd3fc" strokeWidth="1.5" opacity="0.7" />
              <line x1="82" y1="72" x2="82" y2="216" stroke="rgba(224,242,254,0.48)" strokeWidth="1.6" />
              <line x1="98" y1="72" x2="98" y2="216" stroke="rgba(125,211,252,0.28)" strokeWidth="1.2" />

              {/* Top-Right Rectangular Glass Viewfinder Window */}
              <rect
                x="248"
                y="84"
                width="24"
                height="15"
                rx="3.5"
                fill="rgba(224, 242, 254, 0.28)"
                stroke="#7dd3fc"
                strokeWidth="1.5"
              />

              {/* Deep Cylindrical Optical Lens Barrel Layers */}
              <ellipse
                cx="176"
                cy="144"
                rx="66"
                ry="70"
                fill="rgba(14, 116, 144, 0.22)"
                stroke="rgba(125, 211, 252, 0.55)"
                strokeWidth="1.8"
              />

              {/* Outer Intense Neon-Cyan Glowing Lens Ring */}
              <ellipse
                cx="192"
                cy="144"
                rx="64"
                ry="68"
                fill="rgba(4, 10, 28, 0.68)"
                stroke="#00e5ff"
                strokeWidth="4.2"
              />
              <ellipse
                cx="192"
                cy="144"
                rx="64"
                ry="68"
                fill="none"
                stroke="#e0f2fe"
                strokeWidth="1.4"
              />

              {/* Mid Optical Glass Barrel Ring */}
              <ellipse
                cx="196"
                cy="144"
                rx="54"
                ry="58"
                fill="rgba(15, 23, 42, 0.5)"
                stroke="rgba(56, 189, 248, 0.65)"
                strokeWidth="1.8"
              />

              {/* Inner Intense Neon-Cyan Glowing Lens Ring (Double Neon Ring Effect in image.png) */}
              <ellipse
                cx="198"
                cy="144"
                rx="46"
                ry="49"
                fill="rgba(7, 16, 42, 0.78)"
                stroke="#00e5ff"
                strokeWidth="3.8"
              />
              <ellipse
                cx="198"
                cy="144"
                rx="46"
                ry="49"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.2"
              />

              {/* Deep Recessed Optical Glass Core */}
              <ellipse
                cx="201"
                cy="144"
                rx="33"
                ry="36"
                fill="url(#lensCoreGlow)"
                stroke="rgba(125, 211, 252, 0.6)"
                strokeWidth="1.6"
              />
              <ellipse
                cx="203"
                cy="144"
                rx="18"
                ry="20"
                fill="rgba(2, 6, 23, 0.9)"
                stroke="rgba(56, 189, 248, 0.35)"
                strokeWidth="1.2"
              />

              {/* Realistic Purple/White Curved Optical Lens Reflection Flare (Upper-Left of Lens Core as in image.png) */}
              <path
                d="M 176 126 Q 186 112 202 120 Q 194 134 178 136 Z"
                fill="url(#lensPurpleFlare)"
              />
              <ellipse
                cx="186"
                cy="124"
                rx="7"
                ry="3.8"
                transform="rotate(-28 186 124)"
                fill="rgba(255, 255, 255, 0.85)"
              />
              <circle cx="210" cy="156" r="3.5" fill="rgba(165, 243, 252, 0.72)" />
            </svg>
          </motion.div>
        </div>

        {/* RIGHT (IN FRONT OF THE CAMERA): Realistic 3D Projected Hologram Screens (No Extra Text Clutter) */}
        <div
          className="absolute right-[4%] sm:right-[6%] top-[9%] bottom-[16%] w-[56%] sm:w-[53%] flex items-center justify-center"
          style={{
            perspective: '1100px'
          }}
        >
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${-22 + mouseOffset.x * 3}deg) rotateX(${2 - mouseOffset.y * 2.5}deg)`
            }}
          >
            {HOLO_CARDS.map((card) => {
              const isHovered = hoveredCardId === card.id;
              return (
                <motion.button
                  key={card.id}
                  type="button"
                  onClick={() => isInteractive && onSelectPrompt(card.prompt)}
                  onMouseEnter={() => setHoveredCardId(card.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  animate={{
                    y: isHovered ? -6 : [-4, 5, -4],
                    scale: isHovered ? 1.06 : 1
                  }}
                  transition={{
                    y: isHovered
                      ? { duration: 0.2 }
                      : {
                          duration: 4.4 + (card.delay % 1.5),
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: card.delay
                        },
                    scale: { duration: 0.2 }
                  }}
                  style={{
                    left: `${card.x}%`,
                    top: `${card.y}%`,
                    width: `clamp(${Math.round(card.w * 0.56)}px, ${(card.w / 13.8).toFixed(1)}vw, ${card.w}px)`,
                    height: `clamp(${Math.round(card.h * 0.56)}px, ${(card.h / 13.8).toFixed(1)}vw, ${card.h}px)`,
                    transform: `translateZ(${isHovered ? card.z + 24 : card.z}px)`
                  }}
                  className={`group absolute rounded-[6px] overflow-hidden border transition-all ${
                    isInteractive ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
                  } ${
                    isHovered
                      ? 'border-cyan-200 shadow-[0_0_28px_rgba(0,229,255,0.75),0_0_55px_rgba(168,85,247,0.45)] z-50'
                      : card.isMain
                      ? 'border-cyan-200/80 shadow-[0_0_24px_rgba(0,229,255,0.42),0_0_45px_rgba(168,85,247,0.28)] z-30'
                      : 'border-cyan-300/60 hover:border-cyan-200 shadow-[0_0_16px_rgba(56,189,248,0.28)] z-10'
                  }`}
                >
                  {/* Realistic Photographic Scene with Live Motion */}
                  <RealisticHologramMedia card={card} />

                  {/* Specular Glass Rim Highlight */}
                  <div className="absolute inset-0 rounded-[6px] ring-1 ring-inset ring-white/25 pointer-events-none" />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subtle Edge Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 52% 48%, rgba(2, 6, 23, 0.02) 0%, rgba(2, 6, 23, 0.18) 70%, rgba(2, 6, 23, 0.58) 100%)'
        }}
      />
    </div>
  );
}

export default function ImageVideoWorkspace({ isDark }: ImageVideoWorkspaceProps) {
  const { messages, isLoading, sendMessage, stopMessage } = useWorkspaceChat('image-video');

  const handleRunPrompt = (promptText: string) => {
    window.dispatchEvent(
      new CustomEvent('populate-chat-input', {
        detail: { workspaceId: 'image-video', text: promptText }
      })
    );
  };

  return (
    <div className="flex flex-col w-full h-full pt-14 sm:pt-16 relative z-10 select-none overflow-hidden bg-[#02040a]">
      {/* Realistic 3D Holographic Camera & Floating Media Screens */}
      <HolographicCameraStudioBackground
        isDark={isDark}
        isGenerating={isLoading}
        isInteractive={messages.length === 0}
        onSelectPrompt={handleRunPrompt}
      />

      <div className={`flex-1 w-full flex flex-col ${messages.length === 0 ? 'items-center justify-start overflow-hidden pt-2' : 'justify-start items-center overflow-y-auto hide-scrollbar'} pb-28 md:pb-36 px-4 relative z-10 pointer-events-none`}>
        {messages.length > 0 && (
          <div className="w-full h-full pointer-events-auto">
            <ChatHistory 
              messages={messages} 
              isLoading={isLoading} 
              isDark={true} 
              onSearchImage={(img, prompt) => sendMessage(prompt, img)} 
            />
          </div>
        )}
      </div>

      <ChatInput isDark={true} onSend={sendMessage} onStop={stopMessage} isLoading={isLoading} workspaceId="image-video" />
    </div>
  );
}
