import React, { useEffect, useRef } from 'react';
import createGlobe, { Globe, Arc } from 'cobe';

interface CobeGlobeProps {
  isDark: boolean;
  activeTopicIndex?: number | null;
  className?: string;
}

export default function CobeGlobe({ isDark, activeTopicIndex, className = '' }: CobeGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const currentPhiRef = useRef(0);
  const targetPhiRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeTopicIndex === 0) {
      targetPhiRef.current = 2.14; // Silicon Valley (lat 37.7, lng -122.4)
    } else if (activeTopicIndex === 1) {
      targetPhiRef.current = 0.05; // London (lat 51.5, lng -0.1)
    } else if (activeTopicIndex === 2) {
      targetPhiRef.current = -2.42; // Tokyo (lat 35.7, lng 139.7)
    } else if (activeTopicIndex === 3) {
      targetPhiRef.current = -0.12; // Geneva CERN (lat 46.2, lng 6.1)
    } else {
      targetPhiRef.current = null;
    }
  }, [activeTopicIndex]);

  useEffect(() => {
    let phi = 0;
    if (!canvasRef.current) return;

    let width = canvasRef.current.offsetWidth || 320;
    
    const onResize = () => {
      if (canvasRef.current && canvasRef.current.offsetWidth) {
        width = canvasRef.current.offsetWidth;
      }
    };
    
    window.addEventListener('resize', onResize);
    onResize();

    // 4 Primary Global Intelligence Nodes corresponding to topics
    const markers: { location: [number, number]; size: number }[] = [
      { location: [37.7595, -122.4367], size: 0.065 }, // 0: Silicon Valley (AI Hardware)
      { location: [51.5074, -0.1278], size: 0.065 },   // 1: London (Global Tech & Startups)
      { location: [35.6895, 139.6917], size: 0.065 },  // 2: Tokyo (Clean Energy & Fusion)
      { location: [46.2044, 6.1432], size: 0.065 },    // 3: Geneva CERN (Quantum Roadmap)
      { location: [1.3521, 103.8198], size: 0.04 },    // Singapore
      { location: [40.7128, -74.0060], size: 0.045 },  // New York
      { location: [-33.8688, 151.2093], size: 0.04 }   // Sydney
    ];

    // Data arcs connecting global research hubs
    const arcs: Arc[] = [
      { from: [37.7595, -122.4367], to: [51.5074, -0.1278], color: [0.1, 0.9, 0.6] }, // SV -> London
      { from: [51.5074, -0.1278], to: [46.2044, 6.1432], color: [0.1, 0.9, 0.6] },    // London -> Geneva
      { from: [46.2044, 6.1432], to: [35.6895, 139.6917], color: [0.1, 0.9, 0.6] },   // Geneva -> Tokyo
      { from: [35.6895, 139.6917], to: [1.3521, 103.8198], color: [0.1, 0.9, 0.6] },  // Tokyo -> Singapore
      { from: [1.3521, 103.8198], to: [37.7595, -122.4367], color: [0.1, 0.9, 0.6] }, // Singapore -> SV
    ];

    let globe: Globe | null = null;
    let animId: number | null = null;

    try {
      globe = createGlobe(canvasRef.current, {
        devicePixelRatio: 2,
        width: Math.max(width * 2, 400),
        height: Math.max(width * 2, 400),
        phi: 0,
        theta: 0.25,
        dark: isDark ? 1 : 0,
        diffuse: isDark ? 1.4 : 1.2,
        mapSamples: 16000,
        mapBrightness: isDark ? 5.5 : 8,
        baseColor: isDark ? [0.12, 0.18, 0.16] : [0.92, 0.96, 0.94],
        markerColor: [0.1, 0.88, 0.55], // Radiant emerald
        glowColor: isDark ? [0.06, 0.42, 0.28] : [0.75, 0.95, 0.85],
        markers: markers,
        arcs: arcs,
        arcColor: [0.1, 0.88, 0.55],
        arcWidth: 1.2,
        arcHeight: 0.25,
      });

      const loop = () => {
        if (targetPhiRef.current !== null && pointerInteracting.current === null) {
          // Smoothly ease phi towards target node position
          const diff = targetPhiRef.current - (phi % (Math.PI * 2));
          const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
          phi += normalizedDiff * 0.04;
        } else {
          phi += 0.0035;
        }
        if (globe) {
          globe.update({
            phi: phi + currentPhiRef.current,
          });
        }
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);

    } catch (e) {
      console.warn("Failed to initialize Cobe Globe:", e);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (globe && typeof globe.destroy === 'function') {
        globe.destroy();
      }
      window.removeEventListener('resize', onResize);
    };
  }, [isDark]);

  return (
    <div className={`w-full h-full aspect-square flex items-center justify-center relative select-none ${className}`}>
      {/* Ambient Radial Tech Aura behind Globe */}
      <div 
        className={`absolute inset-2 sm:inset-4 rounded-full blur-2xl sm:blur-3xl pointer-events-none transition-all duration-700 ${
          isDark ? 'bg-emerald-500/20 opacity-80' : 'bg-emerald-400/25 opacity-70'
        }`} 
      />

      {/* Cybernetic Orbital Ring Accent */}
      <div className={`absolute inset-0 rounded-full border border-dashed pointer-events-none transition-colors duration-500 ${
        isDark ? 'border-emerald-500/20' : 'border-emerald-600/20'
      } animate-[spin_60s_linear_infinite]`} />

      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
          if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            currentPhiRef.current = delta / 120;
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            currentPhiRef.current = delta / 120;
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          contain: 'layout paint size',
          cursor: 'grab',
        }}
        className="relative z-10 touch-none"
      />
    </div>
  );
}
