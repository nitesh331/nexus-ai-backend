import React, { useEffect, useRef } from 'react';

interface DepthWaveBackgroundProps {
  isDark: boolean;
  className?: string;
}

interface GridVertex {
  rx: number;
  ry: number;
  echoX: number;  // Secondary counter-phase 3D Moiré layer X
  echoY: number;  // Secondary counter-phase 3D Moiré layer Y
  depthZ: number; // 0 (deep valley) -> 1 (near folding crest)
  caustic: number; // 0 -> 1 optical fold compression (creates 3D ribbon illusion)
  crest: number;
  slope: number;
}

interface EnergyPulse {
  rowOrCol: number;
  isRow: boolean;
  progress: number;
  speed: number;
  hue: 'pearl' | 'violet' | 'rose';
}

interface DepthMote {
  x: number; // normalized -0.6 to 0.6
  y: number; // normalized -0.6 to 0.6
  z: number; // depth -220 to +240
  vz: number;
  driftPhase: number;
  baseRadius: number;
  hue: 'pearl' | 'violet' | 'rose';
}

/**
 * DepthWaveBackground:
 * Multi-Layered 3D Optical Illusion Engine (Zero Blue).
 * Combines:
 *  1. 3D Folding Silk Ribbon Caustics & Volumetric Ribbon Facet Shading
 *  2. Counter-Flowing Dual-Layer 3D Moiré Interference Mesh
 *  3. Warped 3D Perspective Gravity Vortex Rings
 *  4. 3D Parallax Depth-of-Field Bokeh Motes
 *  5. Specular Pearl-Silver & Soft Amethyst Ridge Illumination
 */
export default function DepthWaveBackground({ isDark, className }: DepthWaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{
    pixelX: number;
    pixelY: number;
    active: boolean;
    lerpX: number;
    lerpY: number;
  }>({
    pixelX: -1000,
    pixelY: -1000,
    active: false,
    lerpX: -1000,
    lerpY: -1000,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const parent = canvas.parentElement;
      width = parent && parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
      height = parent && parent.clientHeight > 0 ? parent.clientHeight : window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e && e.touches[0] ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e && e.touches[0] ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.pixelX = clientX - rect.left;
      mouseRef.current.pixelY = clientY - rect.top;
      if (!mouseRef.current.active) {
        mouseRef.current.lerpX = mouseRef.current.pixelX;
        mouseRef.current.lerpY = mouseRef.current.pixelY;
      }
      mouseRef.current.active = true;
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);

    // Traveling light pulses racing along the 3D folding ribbons
    const pulses: EnergyPulse[] = Array.from({ length: 24 }, (_, i) => ({
      rowOrCol: i * 2,
      isRow: i % 3 !== 0,
      progress: Math.random(),
      speed: 0.0028 + Math.random() * 0.0038,
      hue: i % 3 === 0 ? 'pearl' : i % 3 === 1 ? 'violet' : 'rose',
    }));

    // 3D Parallax Depth-of-Field Bokeh Motes (rising from deep Z space toward viewer)
    const depthMotes: DepthMote[] = Array.from({ length: 28 }, (_, i) => ({
      x: (Math.random() - 0.5) * 1.15,
      y: (Math.random() - 0.5) * 1.15,
      z: -220 + Math.random() * 440,
      vz: 0.45 + Math.random() * 0.65,
      driftPhase: Math.random() * Math.PI * 2,
      baseRadius: 1.1 + (i % 4) * 0.65,
      hue: i % 3 === 0 ? 'pearl' : i % 3 === 1 ? 'violet' : 'rose',
    }));

    let time = 0;

    const render = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      time += 0.015;

      // Smooth pointer interpolation
      if (mouseRef.current.active) {
        mouseRef.current.lerpX += (mouseRef.current.pixelX - mouseRef.current.lerpX) * 0.085;
        mouseRef.current.lerpY += (mouseRef.current.pixelY - mouseRef.current.lerpY) * 0.085;
      }

      const isCompact = height < 120;
      const stepX = Math.max(16, Math.min(23, Math.floor(width / (isCompact ? 40 : 62))));
      const stepY = isCompact ? 15 : Math.max(16, Math.min(22, Math.floor(height / 48)));

      const cols = Math.ceil(width / stepX) + 8;
      const rows = Math.ceil(height / stepY) + 8;
      const startX = -stepX * 4;
      const startY = isCompact ? -stepY : -stepY * 4;

      const cx = width * 0.5;
      const cy = height * 0.5;
      const fov = isCompact ? 380 : 590;

      // ======================================================================
      // 1. 3D WARPED GRAVITY VORTEX RINGS (Creates Deep 3D Tunnel Optical Illusion)
      // ======================================================================
      if (!isCompact) {
        const ringCount = 9;
        const maxRingRadius = Math.hypot(width, height) * 0.52;
        for (let ringIdx = 1; ringIdx <= ringCount; ringIdx++) {
          const normR = ringIdx / ringCount;
          // Continuous inward/outward breathing phase for hypnotic depth illusion
          const animatedNorm = ((normR - (time * 0.08) % (1 / ringCount) + 1) % 1);
          const baseRadius = Math.pow(animatedNorm, 1.35) * maxRingRadius;
          if (baseRadius < 24) continue;

          ctx.beginPath();
          const segments = 72;
          for (let s = 0; s <= segments; s++) {
            const theta = (s / segments) * Math.PI * 2;
            // 3D harmonic wave warping the ring in Z and radial space
            const ringWave =
              Math.sin(theta * 4 + time * 1.6 - animatedNorm * 6) * 18 * animatedNorm +
              Math.cos(theta * 3 - time * 1.2 + animatedNorm * 5) * 14 * animatedNorm;

            const ringZ = Math.sin(animatedNorm * 8 - time * 1.8 + theta * 2) * 85;
            const ringScale = fov / Math.max(200, fov - ringZ);

            // Tilt perspective slightly for 3D orbital depth
            const px = cx + Math.cos(theta) * (baseRadius + ringWave) * ringScale;
            const py = cy + Math.sin(theta) * (baseRadius + ringWave) * 0.86 * ringScale + ringWave * 0.65;

            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }

          const fadeEdge = Math.sin(animatedNorm * Math.PI);
          const ringAlpha = (fadeEdge * (isDark ? 0.11 : 0.14)).toFixed(3);
          ctx.lineWidth = 0.6 + fadeEdge * 0.6;
          ctx.strokeStyle = isDark
            ? ringIdx % 2 === 0
              ? `rgba(255, 255, 255, ${ringAlpha})`
              : `rgba(192, 132, 252, ${ringAlpha})`
            : ringIdx % 2 === 0
              ? `rgba(168, 85, 247, ${ringAlpha})`
              : `rgba(236, 72, 153, ${ringAlpha})`;
          ctx.stroke();
        }
      }

      // ======================================================================
      // 2. COMPUTE 3D FOLDING SILK RIBBON & COUNTER-PHASE MOIRÉ VERTICES
      // ======================================================================
      const gridPoints: GridVertex[][] = [];

      for (let r = 0; r < rows; r++) {
        const row: GridVertex[] = [];
        const baseY = startY + r * stepY;
        const v = baseY / Math.max(1, height);
        const ny = v - 0.5;

        for (let c = 0; c < cols; c++) {
          const baseX = startX + c * stepX;
          const u = baseX / Math.max(1, width);
          const nx = u - 0.5;

          const radialDist = Math.sqrt(nx * nx + ny * ny);
          const swirlAngle = Math.atan2(ny, nx);

          // Primary 3D Silk Ribbon Wave (with non-linear phase modulation for folding illusion)
          const phase1 = time * 1.4 + u * 7.8 - v * 6.2 + Math.sin(u * 5.2 + v * 3.8 + time * 0.85) * 1.65;
          const phase2 = time * 1.1 - u * 6.4 + v * 8.1 + Math.cos(v * 4.8 - u * 3.2 - time * 0.75) * 1.45;
          const vortexPhase = radialDist * 13.5 - time * 2.05 + swirlAngle * 3.0;

          const ribbonPrimary = Math.sin(phase1);
          const ribbonSecondary = Math.cos(phase2);
          const vortexWave = Math.sin(vortexPhase);

          // Combined normalized crest (-1 to +1)
          const rawCrest =
            ribbonPrimary * 0.45 +
            ribbonSecondary * 0.33 +
            vortexWave * 0.22;

          // Surface partial derivatives (dx, dy) — key to the 3D folding caustic illusion!
          // When derivatives are steep, points compress horizontally/vertically like a real 3D folded curtain.
          const dWaveDx = Math.cos(phase1) * 0.58 - Math.sin(phase2) * 0.42;
          const dWaveDy = -Math.cos(phase1) * 0.48 - Math.sin(phase2) * 0.52;

          // Caustic intensity: peaks where the 3D wave folds over itself in screen space
          const caustic = Math.min(1, Math.max(0, Math.abs(dWaveDx + dWaveDy) * 0.65 + (rawCrest + 1) * 0.25));

          // Interactive cursor / touch 3D gravity lens & vortex twist
          let mouseZBoost = 0;
          let mouseTwistX = 0;
          let mouseTwistY = 0;
          if (mouseRef.current.active) {
            const dx = baseX - mouseRef.current.lerpX;
            const dy = baseY - mouseRef.current.lerpY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxRadius = isCompact ? 190 : 390;
            if (dist < maxRadius) {
              const falloff = Math.pow(1 - dist / maxRadius, 1.55);
              const ripple = Math.sin(dist * 0.048 - time * 5.6);
              mouseZBoost = ripple * falloff * (isCompact ? 32 : 85) + falloff * 48;
              const angle = Math.atan2(dy, dx);
              mouseTwistX = Math.cos(angle + 0.85) * falloff * (isCompact ? 10 : 30);
              mouseTwistY = Math.sin(angle + 0.85) * falloff * (isCompact ? 10 : 30);
            }
          }

          // True 3D Z-elevation towards camera
          const zAmplitude = isCompact ? 42 : 148;
          const worldZ = rawCrest * zAmplitude + mouseZBoost;

          // Perspective projection scale
          const perspectiveScale = fov / Math.max(160, fov - worldZ);

          // 3D Ribbon Fold Displacement: points shift along the 3D surface normal to create dramatic 3D folds
          const foldAmpX = isCompact ? 12 : 44;
          const foldAmpY = isCompact ? 14 : 48;
          const foldX = dWaveDx * foldAmpX + mouseTwistX;
          const foldY = rawCrest * foldAmpY + dWaveDy * (foldAmpY * 0.55) + mouseTwistY;

          const rx = cx + (baseX - cx + foldX) * perspectiveScale;
          const ry = cy + (baseY - cy + foldY) * perspectiveScale;

          // Counter-Phase Secondary 3D Moiré Layer (creates hypnotic 3D stereo depth illusion)
          const echoCrest = Math.sin(phase1 - 1.15) * 0.5 + Math.cos(phase2 + 1.05) * 0.5;
          const echoZ = echoCrest * (zAmplitude * 0.65);
          const echoScale = fov / Math.max(180, fov - echoZ);
          const echoX = cx + (baseX - cx - dWaveDy * (foldAmpX * 0.68)) * echoScale;
          const echoY = cy + (baseY - cy + echoCrest * (foldAmpY * 0.72)) * echoScale;

          const depthZ = Math.min(1, Math.max(0, 0.5 + rawCrest * 0.49 + (mouseZBoost / 150)));

          row.push({
            rx,
            ry,
            echoX,
            echoY,
            depthZ,
            caustic,
            crest: rawCrest,
            slope: dWaveDx,
          });
        }
        gridPoints.push(row);
      }

      // ======================================================================
      // 3. SECONDARY COUNTER-FLOWING 3D MOIRÉ SHADOW MESH (Deep Stereo Illusion)
      // ======================================================================
      for (let r = 0; r < rows; r += 2) {
        const rowPts = gridPoints[r];
        if (!rowPts || rowPts.length < 2) continue;

        ctx.beginPath();
        ctx.moveTo(rowPts[0].echoX, rowPts[0].echoY);
        for (let c = 1; c < cols - 1; c++) {
          const xc = (rowPts[c].echoX + rowPts[c + 1].echoX) * 0.5;
          const yc = (rowPts[c].echoY + rowPts[c + 1].echoY) * 0.5;
          ctx.quadraticCurveTo(rowPts[c].echoX, rowPts[c].echoY, xc, yc);
        }
        ctx.lineTo(rowPts[cols - 1].echoX, rowPts[cols - 1].echoY);

        ctx.lineWidth = 0.5;
        ctx.strokeStyle = isDark
          ? 'rgba(192, 132, 252, 0.065)'
          : 'rgba(192, 132, 252, 0.11)';
        ctx.stroke();
      }

      // ======================================================================
      // 3B. 3D VOLUMETRIC SILK RIBBON CAUSTIC FACETS (Translucent 3D Sheet Fold Illusion)
      // ======================================================================
      if (!isCompact) {
        for (let r = 0; r < rows - 1; r += 2) {
          const topRow = gridPoints[r];
          const botRow = gridPoints[r + 1];
          if (!topRow || !botRow || topRow.length < 2) continue;

          const midIdx = Math.floor(cols * 0.5);
          const avgCaustic =
            ((topRow[Math.floor(cols * 0.25)]?.caustic ?? 0.5) +
              (topRow[midIdx]?.caustic ?? 0.5) +
              (topRow[Math.floor(cols * 0.75)]?.caustic ?? 0.5)) /
            3;

          if (avgCaustic > 0.44) {
            ctx.beginPath();
            ctx.moveTo(topRow[0].rx, topRow[0].ry);
            for (let c = 1; c < cols - 1; c++) {
              const xc = (topRow[c].rx + topRow[c + 1].rx) * 0.5;
              const yc = (topRow[c].ry + topRow[c + 1].ry) * 0.5;
              ctx.quadraticCurveTo(topRow[c].rx, topRow[c].ry, xc, yc);
            }
            ctx.lineTo(topRow[cols - 1].rx, topRow[cols - 1].ry);
            ctx.lineTo(botRow[cols - 1].rx, botRow[cols - 1].ry);
            for (let c = cols - 2; c >= 1; c--) {
              const xc = (botRow[c].rx + botRow[c - 1].rx) * 0.5;
              const yc = (botRow[c].ry + botRow[c - 1].ry) * 0.5;
              ctx.quadraticCurveTo(botRow[c].rx, botRow[c].ry, xc, yc);
            }
            ctx.lineTo(botRow[0].rx, botRow[0].ry);
            ctx.closePath();

            const ribbonAlpha = ((avgCaustic - 0.44) * (isDark ? 0.055 : 0.05)).toFixed(3);
            ctx.fillStyle = isDark
              ? r % 4 === 0
                ? `rgba(255, 255, 255, ${ribbonAlpha})`
                : `rgba(216, 180, 254, ${ribbonAlpha})`
              : r % 4 === 0
                ? `rgba(192, 132, 252, ${ribbonAlpha})`
                : `rgba(244, 114, 182, ${ribbonAlpha})`;
            ctx.fill();
          }
        }
      }

      // ======================================================================
      // 4. PRIMARY 3D FOLDING SILK RIBBON CONTOURS (Caustic Pearl & Amethyst)
      // ======================================================================
      for (let r = 0; r < rows; r++) {
        const rowPts = gridPoints[r];
        if (!rowPts || rowPts.length < 2) continue;

        ctx.beginPath();
        ctx.moveTo(rowPts[0].rx, rowPts[0].ry);
        for (let c = 1; c < cols - 1; c++) {
          const xc = (rowPts[c].rx + rowPts[c + 1].rx) * 0.5;
          const yc = (rowPts[c].ry + rowPts[c + 1].ry) * 0.5;
          ctx.quadraticCurveTo(rowPts[c].rx, rowPts[c].ry, xc, yc);
        }
        ctx.lineTo(rowPts[cols - 1].rx, rowPts[cols - 1].ry);

        const sampleA = rowPts[Math.floor(cols * 0.25)]?.caustic ?? 0.5;
        const sampleB = rowPts[Math.floor(cols * 0.5)]?.caustic ?? 0.5;
        const sampleC = rowPts[Math.floor(cols * 0.75)]?.caustic ?? 0.5;
        const avgCaustic = (sampleA + sampleB + sampleC) / 3;

        const isMajorRibbon = r % 2 === 0;
        ctx.lineWidth = isMajorRibbon ? 0.8 + avgCaustic * 0.65 : 0.42 + avgCaustic * 0.35;

        if (isDark) {
          const alphaA = (0.04 + sampleA * 0.22).toFixed(3);
          const alphaB = (0.07 + sampleB * 0.30).toFixed(3);
          const alphaC = (0.04 + sampleC * 0.22).toFixed(3);
          const grad = ctx.createLinearGradient(0, rowPts[0].ry, width, rowPts[cols - 1].ry);
          grad.addColorStop(0, `rgba(255, 255, 255, ${alphaA})`);
          grad.addColorStop(0.5, `rgba(216, 180, 254, ${alphaB})`);
          grad.addColorStop(1, `rgba(244, 114, 182, ${alphaC})`);
          ctx.strokeStyle = grad;
        } else {
          const alphaA = (0.08 + sampleA * 0.24).toFixed(3);
          const alphaB = (0.11 + sampleB * 0.28).toFixed(3);
          const alphaC = (0.08 + sampleC * 0.24).toFixed(3);
          const grad = ctx.createLinearGradient(0, rowPts[0].ry, width, rowPts[cols - 1].ry);
          grad.addColorStop(0, `rgba(168, 85, 247, ${alphaA})`);
          grad.addColorStop(0.5, `rgba(192, 132, 252, ${alphaB})`);
          grad.addColorStop(1, `rgba(236, 72, 153, ${alphaC})`);
          ctx.strokeStyle = grad;
        }
        ctx.stroke();
      }

      // ======================================================================
      // 5. LONGITUDINAL 3D CURTAIN RIBS & INTER-LAYER DEPTH TETHERS
      // ======================================================================
      for (let c = 0; c < cols; c++) {
        if (c % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(gridPoints[0][c].rx, gridPoints[0][c].ry);
          for (let r = 1; r < rows - 1; r++) {
            const curr = gridPoints[r][c];
            const next = gridPoints[r + 1][c];
            const xc = (curr.rx + next.rx) * 0.5;
            const yc = (curr.ry + next.ry) * 0.5;
            ctx.quadraticCurveTo(curr.rx, curr.ry, xc, yc);
          }
          ctx.lineTo(gridPoints[rows - 1][c].rx, gridPoints[rows - 1][c].ry);

          const midPt = gridPoints[Math.floor(rows * 0.5)][c];
          const d = midPt ? midPt.depthZ : 0.5;
          ctx.lineWidth = c % 4 === 0 ? 0.7 : 0.38;
          const ribAlpha = isDark ? (0.03 + d * 0.14).toFixed(3) : (0.04 + d * 0.12).toFixed(3);
          ctx.strokeStyle = isDark
            ? c % 4 === 0
              ? `rgba(255, 255, 255, ${ribAlpha})`
              : `rgba(192, 132, 252, ${ribAlpha})`
            : c % 4 === 0
              ? `rgba(168, 85, 247, ${ribAlpha})`
              : `rgba(236, 72, 153, ${ribAlpha})`;
          ctx.stroke();
        }
      }

      // 3D Stereo Depth Tethers connecting Primary & Echo layers on high crests
      // (Creates the unmistakable 3D architectural wireframe / hologram illusion)
      ctx.lineWidth = 0.5;
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const pt = gridPoints[r][c];
          if (pt.depthZ > 0.65) {
            const diag = gridPoints[r + 1][c + 1];
            const crestAlpha = ((pt.depthZ - 0.65) * (isDark ? 0.42 : 0.28)).toFixed(3);
            ctx.strokeStyle = isDark
              ? `rgba(244, 244, 245, ${crestAlpha})`
              : `rgba(168, 85, 247, ${crestAlpha})`;
            ctx.beginPath();
            ctx.moveTo(pt.rx, pt.ry);
            ctx.lineTo(diag.rx, diag.ry);
            ctx.stroke();

            // Subtle 3D vertical depth pillar between primary crest and shadow echo
            if ((r + c) % 3 === 0) {
              ctx.strokeStyle = isDark
                ? `rgba(216, 180, 254, ${(Number(crestAlpha) * 0.65).toFixed(3)})`
                : `rgba(236, 72, 153, ${(Number(crestAlpha) * 0.55).toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(pt.rx, pt.ry);
              ctx.lineTo(pt.echoX, pt.echoY);
              ctx.stroke();
            }
          }
        }
      }

      // ======================================================================
      // 6. TRAVELING SYNAPTIC LIGHT PULSES ALONG 3D RIBBONS
      // ======================================================================
      if (!isCompact) {
        ctx.save();
        if (isDark) ctx.globalCompositeOperation = 'lighter';

        pulses.forEach((pulse) => {
          pulse.progress += pulse.speed;
          if (pulse.progress > 1) {
            pulse.progress = 0;
            pulse.rowOrCol = pulse.isRow
              ? Math.floor(Math.random() * Math.max(1, rows - 2)) + 1
              : Math.floor(Math.random() * Math.max(1, Math.floor(cols / 2) - 1)) * 2;
          }

          if (pulse.isRow) {
            const rIdx = Math.min(rows - 1, Math.max(0, pulse.rowOrCol));
            const exactCol = pulse.progress * (cols - 1);
            const cIdx = Math.min(cols - 2, Math.floor(exactCol));
            const frac = exactCol - cIdx;
            const p1 = gridPoints[rIdx][cIdx];
            const p2 = gridPoints[rIdx][cIdx + 1];
            if (p1 && p2) {
              const px = p1.rx + (p2.rx - p1.rx) * frac;
              const py = p1.ry + (p2.ry - p1.ry) * frac;
              const colorRGB =
                pulse.hue === 'pearl'
                  ? '255, 255, 255'
                  : pulse.hue === 'violet'
                  ? '216, 180, 254'
                  : '244, 114, 182';

              ctx.fillStyle = `rgba(${colorRGB}, ${isDark ? 0.25 : 0.15})`;
              ctx.beginPath();
              ctx.arc(px, py, 6, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = isDark ? '#ffffff' : `rgb(${colorRGB})`;
              ctx.beginPath();
              ctx.arc(px, py, 1.75, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            const cIdx = Math.min(cols - 1, Math.max(0, pulse.rowOrCol));
            const exactRow = pulse.progress * (rows - 1);
            const rIdx = Math.min(rows - 2, Math.floor(exactRow));
            const frac = exactRow - rIdx;
            const p1 = gridPoints[rIdx]?.[cIdx];
            const p2 = gridPoints[rIdx + 1]?.[cIdx];
            if (p1 && p2) {
              const px = p1.rx + (p2.rx - p1.rx) * frac;
              const py = p1.ry + (p2.ry - p1.ry) * frac;
              const colorRGB = '216, 180, 254';

              ctx.fillStyle = `rgba(${colorRGB}, ${isDark ? 0.22 : 0.12})`;
              ctx.beginPath();
              ctx.arc(px, py, 5.2, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = isDark ? '#ffffff' : `rgb(${colorRGB})`;
              ctx.beginPath();
              ctx.arc(px, py, 1.55, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });

        ctx.restore();
      }

      // ======================================================================
      // 7. 3D DUAL-LAYER PERSPECTIVE NODES (Echo Shadow Dots + Specular Crest Pearls)
      // ======================================================================
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = gridPoints[r][c];

          // Draw subtle secondary 3D echo dot first (amplifies 3D stereo parallax illusion)
          if (isDark && (r + c) % 2 === 0) {
            ctx.fillStyle = 'rgba(192, 132, 252, 0.14)';
            ctx.beginPath();
            ctx.arc(pt.echoX, pt.echoY, 0.65, 0, Math.PI * 2);
            ctx.fill();
          }

          // Primary 3D node size scales non-linearly with perspective depth & caustic fold
          const radius = 0.42 + Math.pow(pt.depthZ, 1.75) * 1.85;

          if (isDark) {
            if (pt.depthZ > 0.72) {
              // High 3D wave fold crest: soft pearl/amethyst halo + brilliant white core
              const auraAlpha = ((pt.depthZ - 0.68) * 0.82).toFixed(3);
              ctx.fillStyle =
                (r + c) % 3 === 0
                  ? `rgba(244, 114, 182, ${auraAlpha})`
                  : `rgba(216, 180, 254, ${auraAlpha})`;
              ctx.beginPath();
              ctx.arc(pt.rx, pt.ry, radius * 2.35, 0, Math.PI * 2);
              ctx.fill();

              const coreAlpha = Math.min(1, 0.75 + pt.depthZ * 0.25).toFixed(3);
              ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha})`;
              ctx.beginPath();
              ctx.arc(pt.rx, pt.ry, radius, 0, Math.PI * 2);
              ctx.fill();
            } else if (pt.depthZ > 0.48) {
              // Mid-elevation folding ribbon: luminous liquid silver
              const alpha = (0.26 + pt.depthZ * 0.42).toFixed(3);
              ctx.fillStyle = `rgba(244, 244, 245, ${alpha})`;
              ctx.beginPath();
              ctx.arc(pt.rx, pt.ry, radius, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Deep receding valley: subtle graphite-amethyst depth point
              const alpha = (0.07 + pt.depthZ * 0.19).toFixed(3);
              ctx.fillStyle = `rgba(161, 161, 170, ${alpha})`;
              ctx.beginPath();
              ctx.arc(pt.rx, pt.ry, radius, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            if (pt.depthZ > 0.68) {
              const alpha = (0.45 + pt.depthZ * 0.45).toFixed(3);
              ctx.fillStyle =
                (r + c) % 3 === 0
                  ? `rgba(236, 72, 153, ${alpha})`
                  : (r + c) % 3 === 1
                  ? `rgba(168, 85, 247, ${alpha})`
                  : `rgba(139, 92, 246, ${alpha})`;
            } else {
              const alpha = (0.14 + pt.depthZ * 0.28).toFixed(3);
              ctx.fillStyle =
                (r + c) % 2 === 0
                  ? `rgba(192, 132, 252, ${alpha})`
                  : `rgba(244, 114, 182, ${alpha})`;
            }
            ctx.beginPath();
            ctx.arc(pt.rx, pt.ry, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ======================================================================
      // 8. 3D PARALLAX DEPTH-OF-FIELD BOKEH MOTES (Floating Spatial Depth Illusion)
      // ======================================================================
      if (!isCompact) {
        depthMotes.forEach((mote) => {
          mote.z += mote.vz;
          if (mote.z > 240) {
            mote.z = -220;
            mote.x = (Math.random() - 0.5) * 1.15;
            mote.y = (Math.random() - 0.5) * 1.15;
          }

          const moteScale = fov / Math.max(140, fov - mote.z);
          const driftX = Math.sin(time * 0.7 + mote.driftPhase) * 26;
          const driftY = Math.cos(time * 0.55 + mote.driftPhase) * 22;

          const mx = cx + (mote.x * width + driftX) * moteScale;
          const my = cy + (mote.y * height + driftY) * moteScale;

          if (mx < -40 || mx > width + 40 || my < -40 || my > height + 40) return;

          const normZ = (mote.z + 220) / 460; // 0 (far) -> 1 (near camera)
          const depthEnvelope = Math.sin(normZ * Math.PI); // Smooth fade in & fade out
          const r = mote.baseRadius * moteScale;

          const rgb =
            mote.hue === 'pearl'
              ? '255, 255, 255'
              : mote.hue === 'violet'
              ? '216, 180, 254'
              : '244, 114, 182';

          // Soft out-of-focus 3D bokeh halo when very close or very far
          const bokehAlpha = (depthEnvelope * (isDark ? 0.14 : 0.08)).toFixed(3);
          ctx.fillStyle = `rgba(${rgb}, ${bokehAlpha})`;
          ctx.beginPath();
          ctx.arc(mx, my, r * 3.2, 0, Math.PI * 2);
          ctx.fill();

          // Crisp luminous core
          const coreAlpha = (depthEnvelope * (isDark ? 0.55 : 0.32)).toFixed(3);
          ctx.fillStyle = `rgba(${rgb}, ${coreAlpha})`;
          ctx.beginPath();
          ctx.arc(mx, my, r * 0.85, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, [isDark]);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden z-10 w-full h-full ${className || ''}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ opacity: isDark ? 0.98 : 0.85 }}
      />
    </div>
  );
}


