import React, { useEffect, useRef } from 'react';

interface GlobeDepthWallpaperProps {
  isDark: boolean;
}

interface StarNode {
  x: number;
  y: number;
  z: number; // Depth layer: 0.15 (far) to 1.2 (foreground bokeh)
  baseSize: number;
  twinkleSpeed: number;
  twinklePhase: number;
  colorType: 'cyan' | 'emerald' | 'blue' | 'indigo' | 'white';
  isConstellationNode: boolean;
}

interface OrbitalSatellite {
  ringIndex: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  rgb: string;
  trailLength: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  maxLife: number;
  color: string;
}

/**
 * GlobeDepthWallpaper:
 * Ultra-immersive 3D Planetary Gravity Well, Orbital Telemetry & Deep-Space Parallax Wallpaper
 * engineered specifically to match and frame the 3D Earth Globe in the Deep Search workspace.
 */
export default function GlobeDepthWallpaper({ isDark }: GlobeDepthWallpaperProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef<{
    targetX: number;
    targetY: number;
    currentX: number;
    currentY: number;
  }>({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = 1;

    // 1. Multi-layer 3D Starfield & Constellation Nodes
    const STAR_COUNT = 260;
    const stars: StarNode[] = [];
    const colorTypes: Array<'cyan' | 'emerald' | 'blue' | 'indigo' | 'white'> = [
      'white',
      'cyan',
      'blue',
      'emerald',
      'indigo',
      'white',
    ];

    const initStars = (w: number, h: number) => {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        const rand = Math.random();
        // Distribute across far (0.15-0.45), mid (0.45-0.85), near bokeh (0.85-1.25)
        const z = rand < 0.65 ? 0.15 + Math.random() * 0.45 : rand < 0.92 ? 0.6 + Math.random() * 0.3 : 0.95 + Math.random() * 0.3;
        const isConstellationNode = z > 0.52 && z < 0.88 && i % 5 === 0;
        stars.push({
          x: (Math.random() - 0.5) * w * 1.45,
          y: (Math.random() - 0.5) * h * 1.45,
          z,
          baseSize: z > 0.95 ? 1.5 + Math.random() * 1.4 : 0.4 + z * 1.1,
          twinkleSpeed: 0.7 + Math.random() * 2.4,
          twinklePhase: Math.random() * Math.PI * 2,
          colorType: colorTypes[Math.floor(Math.random() * colorTypes.length)],
          isConstellationNode,
        });
      }
    };

    // 2. 3D Orbital Satellites with glowing comet trails
    const satellites: OrbitalSatellite[] = [
      { ringIndex: 0, angle: 0.3, speed: 0.0055, size: 2.4, color: '#38bdf8', rgb: '56, 189, 248', trailLength: 0.55 },
      { ringIndex: 0, angle: 3.4, speed: 0.0055, size: 2.0, color: '#10b981', rgb: '16, 185, 129', trailLength: 0.45 },
      { ringIndex: 1, angle: 1.7, speed: -0.0042, size: 2.2, color: '#60a5fa', rgb: '96, 165, 250', trailLength: 0.5 },
      { ringIndex: 1, angle: 4.8, speed: -0.0042, size: 1.9, color: '#2dd4bf', rgb: '45, 212, 191', trailLength: 0.4 },
      { ringIndex: 2, angle: 2.1, speed: 0.0032, size: 2.1, color: '#818cf8', rgb: '129, 140, 248', trailLength: 0.48 },
      { ringIndex: 2, angle: 5.2, speed: 0.0032, size: 1.7, color: '#34d399', rgb: '52, 211, 153', trailLength: 0.38 },
    ];

    // 3. Shooting Stars / Orbital Data Streams
    const shootingStars: ShootingStar[] = [];
    const spawnShootingStar = () => {
      if (shootingStars.length >= 2) return;
      const fromLeft = Math.random() > 0.5;
      const startX = fromLeft ? Math.random() * width * 0.4 : width * 0.6 + Math.random() * width * 0.4;
      const startY = Math.random() * height * 0.45;
      const angle = fromLeft ? 0.35 + Math.random() * 0.35 : Math.PI - (0.35 + Math.random() * 0.35);
      const speed = 7 + Math.random() * 5;
      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 65 + Math.random() * 55,
        life: 0,
        maxLife: 45 + Math.random() * 30,
        color: Math.random() > 0.5 ? '56, 189, 248' : '16, 185, 129',
      });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      initStars(width, height);
    };

    resize();
    window.addEventListener('resize', resize);

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e && e.touches[0] ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e && e.touches[0] ? e.touches[0].clientY : (e as MouseEvent).clientY;
      pointerRef.current.targetX = (clientX / Math.max(1, width) - 0.5) * 2;
      pointerRef.current.targetY = (clientY / Math.max(1, height) - 0.5) * 2;
    };

    const handlePointerLeave = () => {
      pointerRef.current.targetX = 0;
      pointerRef.current.targetY = 0;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);

    let time = 0;

    // Helper: Project 3D point (x, y, z) relative to screen center with perspective depth
    const project3D = (x: number, y: number, z: number, cx: number, cy: number, fov = 750) => {
      const scale = fov / Math.max(120, fov + z);
      return {
        x: cx + x * scale,
        y: cy + y * scale,
        scale,
      };
    };

    const render = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      time += 0.015;

      // Smooth 3D camera parallax damping
      pointerRef.current.currentX += (pointerRef.current.targetX - pointerRef.current.currentX) * 0.045;
      pointerRef.current.currentY += (pointerRef.current.targetY - pointerRef.current.currentY) * 0.045;

      const camX = pointerRef.current.currentX;
      const camY = pointerRef.current.currentY;

      // Center of the 3D Globe on screen
      const centerX = width * 0.5 - camX * 22;
      const centerY = height * 0.53 - camY * 22;
      const baseGlobeRadius = Math.min(width, height) * 0.275;

      // =========================================================================
      // LAYER 1: VOLUMETRIC DEEP SPACE NEBULA & SOLAR CORONA LIMB GLOW
      // =========================================================================
      // Primary planetary atmosphere aura
      const nebulaGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        baseGlobeRadius * 0.15,
        centerX,
        centerY,
        Math.max(width, height) * 0.78
      );

      if (isDark) {
        nebulaGrad.addColorStop(0, 'rgba(37, 99, 235, 0.28)');
        nebulaGrad.addColorStop(0.22, 'rgba(14, 165, 233, 0.16)');
        nebulaGrad.addColorStop(0.42, 'rgba(16, 185, 129, 0.09)');
        nebulaGrad.addColorStop(0.68, 'rgba(79, 70, 229, 0.04)');
        nebulaGrad.addColorStop(1, 'rgba(1, 5, 14, 0)');
      } else {
        nebulaGrad.addColorStop(0, 'rgba(59, 130, 246, 0.20)');
        nebulaGrad.addColorStop(0.28, 'rgba(16, 185, 129, 0.11)');
        nebulaGrad.addColorStop(0.55, 'rgba(14, 165, 233, 0.05)');
        nebulaGrad.addColorStop(1, 'rgba(244, 248, 253, 0)');
      }

      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // Sunlit directional horizon flare (top-right limb of the Earth, matching Three.js directional light)
      const sunX = centerX + baseGlobeRadius * 0.62 - camX * 12;
      const sunY = centerY - baseGlobeRadius * 0.52 - camY * 12;
      const sunGrad = ctx.createRadialGradient(
        sunX,
        sunY,
        0,
        sunX,
        sunY,
        baseGlobeRadius * 1.45
      );
      if (isDark) {
        sunGrad.addColorStop(0, 'rgba(125, 211, 252, 0.22)');
        sunGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.10)');
        sunGrad.addColorStop(0.65, 'rgba(16, 185, 129, 0.04)');
        sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        sunGrad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
        sunGrad.addColorStop(0.4, 'rgba(16, 185, 129, 0.07)');
        sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, width, height);

      // =========================================================================
      // LAYER 2: 3D CURVED SPACE-TIME GRAVITY WELL FABRIC (BENEATH & AROUND GLOBE)
      // =========================================================================
      // Renders a 3D perspective grid plane tilted in space that bends downward under the Earth's mass
      const gridSpanX = Math.max(width, height) * 0.95;
      const gridSpanZ = Math.max(width, height) * 0.85;
      const gridCols = 24;
      const gridRows = 16;
      const basePlaneY = baseGlobeRadius * 0.62; // Positioned just beneath the globe's equator/south pole
      const tiltPitch = 0.42 + camY * 0.08; // 3D camera pitch angle
      const cosP = Math.cos(tiltPitch);
      const sinP = Math.sin(tiltPitch);

      const computeGravityVertex = (gx: number, gz: number) => {
        // Distance from globe center in the horizontal X-Z plane
        const distSq = gx * gx + gz * gz;
        const dist = Math.sqrt(distSq);
        // Gravitational funnel depression + gentle harmonic ripple radiating from Earth
        const wellDepth =
          baseGlobeRadius * 0.68 * Math.exp(-distSq / (baseGlobeRadius * baseGlobeRadius * 1.65));
        const ripple =
          Math.sin(dist * 0.022 - time * 2.1) *
          6.5 *
          Math.exp(-dist / (baseGlobeRadius * 3.2));

        const worldX = gx - camX * 35;
        const worldY = basePlaneY + wellDepth + ripple;
        const worldZ = gz + 120;

        // Rotate around X-axis for 3D perspective camera tilt
        const rotY = worldY * cosP - worldZ * sinP;
        const rotZ = worldY * sinP + worldZ * cosP;

        const proj = project3D(worldX, rotY, rotZ, centerX, centerY, 760);
        // Normalized closeness to globe center for glow coloring
        const proximity = Math.exp(-distSq / (baseGlobeRadius * baseGlobeRadius * 2.4));
        return { ...proj, rotZ, proximity };
      };

      // Precompute 3D gravity mesh vertices
      const gravityVertices: Array<Array<{ x: number; y: number; scale: number; rotZ: number; proximity: number }>> = [];
      for (let r = 0; r <= gridRows; r++) {
        const rowArr = [];
        const normZ = r / gridRows - 0.45; // -0.45 to +0.55
        const gz = normZ * gridSpanZ;
        for (let c = 0; c <= gridCols; c++) {
          const normX = c / gridCols - 0.5;
          const gx = normX * gridSpanX;
          rowArr.push(computeGravityVertex(gx, gz));
        }
        gravityVertices.push(rowArr);
      }

      // Draw latitude (X-wise) curved gravity lines
      ctx.lineWidth = 0.75;
      for (let r = 0; r <= gridRows; r++) {
        const rowFade = Math.sin((r / gridRows) * Math.PI); // Smooth fade at front & back edges
        ctx.beginPath();
        for (let c = 0; c <= gridCols; c++) {
          const v = gravityVertices[r][c];
          if (c === 0) ctx.moveTo(v.x, v.y);
          else ctx.lineTo(v.x, v.y);
        }
        const alpha = rowFade * (isDark ? 0.14 : 0.09);
        ctx.strokeStyle = isDark
          ? `rgba(45, 212, 191, ${alpha})`
          : `rgba(14, 165, 233, ${alpha})`;
        ctx.stroke();
      }

      // Draw longitude (Z-wise) curved gravity lines & glowing intersection nodes
      for (let c = 0; c <= gridCols; c++) {
        const colFade = Math.sin((c / gridCols) * Math.PI);
        ctx.beginPath();
        for (let r = 0; r <= gridRows; r++) {
          const v = gravityVertices[r][c];
          if (r === 0) ctx.moveTo(v.x, v.y);
          else ctx.lineTo(v.x, v.y);
        }
        const alpha = colFade * (isDark ? 0.12 : 0.08);
        ctx.strokeStyle = isDark
          ? `rgba(56, 189, 248, ${alpha})`
          : `rgba(37, 99, 235, ${alpha})`;
        ctx.stroke();
      }

      // Glowing gravity well nodes near the globe's gravitational center
      for (let r = 1; r < gridRows; r++) {
        for (let c = 1; c < gridCols; c++) {
          const v = gravityVertices[r][c];
          if (v.proximity > 0.18) {
            const nodeAlpha = v.proximity * (isDark ? 0.42 : 0.28);
            ctx.beginPath();
            ctx.arc(v.x, v.y, Math.max(0.7, 1.8 * v.scale * v.proximity), 0, Math.PI * 2);
            ctx.fillStyle = isDark
              ? `rgba(52, 211, 153, ${nodeAlpha})`
              : `rgba(16, 185, 129, ${nodeAlpha})`;
            ctx.fill();
          }
        }
      }

      // =========================================================================
      // LAYER 3: SPHERICAL TELEMETRY COMPASS & CONCENTRIC DEPTH RINGS
      // =========================================================================
      const concentricCount = 4;
      for (let i = 1; i <= concentricCount; i++) {
        const pulseOffset = (time * 0.22 + i * 0.25) % 1;
        const ringRadius = baseGlobeRadius * (0.92 + i * 0.32 + pulseOffset * 0.14);
        const alpha = Math.max(0, (1 - i / (concentricCount + 0.6)) * (isDark ? 0.16 : 0.11));

        const rx = centerX - camX * i * 7;
        const ry = centerY - camY * i * 7;

        ctx.beginPath();
        ctx.arc(rx, ry, ringRadius, 0, Math.PI * 2);
        ctx.lineWidth = i === 1 ? 1.1 : 0.75;
        ctx.strokeStyle = isDark
          ? `rgba(56, 189, 248, ${alpha})`
          : `rgba(37, 99, 235, ${alpha})`;
        ctx.stroke();

        // Add precision azimuthal radar degree ticks on the primary outer telemetry ring
        if (i === 1) {
          const tickCount = 72;
          const rotOffset = time * 0.04;
          ctx.lineWidth = 0.8;
          for (let t = 0; t < tickCount; t++) {
            const tickAngle = (t / tickCount) * Math.PI * 2 + rotOffset;
            const isMajor = t % 6 === 0;
            const innerTick = ringRadius + 3;
            const outerTick = ringRadius + (isMajor ? 9 : 5);
            ctx.beginPath();
            ctx.moveTo(rx + Math.cos(tickAngle) * innerTick, ry + Math.sin(tickAngle) * innerTick);
            ctx.lineTo(rx + Math.cos(tickAngle) * outerTick, ry + Math.sin(tickAngle) * outerTick);
            ctx.strokeStyle = isDark
              ? `rgba(45, 212, 191, ${isMajor ? alpha * 1.7 : alpha * 0.9})`
              : `rgba(16, 185, 129, ${isMajor ? alpha * 1.6 : alpha * 0.8})`;
            ctx.stroke();
          }
        }
      }

      // =========================================================================
      // LAYER 4: 3D TILTED ORBITAL RINGS WITH COMET TRAILS & SATELLITES
      // =========================================================================
      const orbitalRings = [
        {
          rx: baseGlobeRadius * 1.46,
          ry: baseGlobeRadius * 0.46,
          tilt: -0.32,
          rgb: isDark ? '56, 189, 248' : '37, 99, 235',
          baseAlpha: isDark ? 0.2 : 0.14,
        },
        {
          rx: baseGlobeRadius * 1.78,
          ry: baseGlobeRadius * 0.58,
          tilt: 0.26,
          rgb: isDark ? '16, 185, 129' : '16, 185, 129',
          baseAlpha: isDark ? 0.16 : 0.12,
        },
        {
          rx: baseGlobeRadius * 2.14,
          ry: baseGlobeRadius * 0.72,
          tilt: -0.11,
          rgb: isDark ? '129, 140, 248' : '79, 70, 229',
          baseAlpha: isDark ? 0.13 : 0.09,
        },
      ];

      orbitalRings.forEach((ring, idx) => {
        const ringCenterX = centerX - camX * (idx + 1) * 11;
        const ringCenterY = centerY - camY * (idx + 1) * 11;
        const dynamicTilt = ring.tilt + Math.sin(time * 0.3 + idx) * 0.03;

        ctx.save();
        ctx.translate(ringCenterX, ringCenterY);
        ctx.rotate(dynamicTilt);

        // Main orbital ellipse
        ctx.beginPath();
        ctx.ellipse(0, 0, ring.rx, ring.ry, 0, 0, Math.PI * 2);
        ctx.lineWidth = 0.9;
        ctx.setLineDash(idx === 1 ? [6, 8] : []);
        ctx.strokeStyle = `rgba(${ring.rgb}, ${ring.baseAlpha})`;
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw orbiting satellites & tapered comet tails
        satellites
          .filter((s) => s.ringIndex === idx)
          .forEach((sat) => {
            sat.angle += sat.speed;

            // Draw smooth tapered comet tail along the elliptical arc
            const tailSegments = 18;
            for (let seg = 0; seg < tailSegments; seg++) {
              const frac = seg / tailSegments;
              const nextFrac = (seg + 1) / tailSegments;
              const a1 = sat.angle - Math.sign(sat.speed) * sat.trailLength * frac;
              const a2 = sat.angle - Math.sign(sat.speed) * sat.trailLength * nextFrac;

              ctx.beginPath();
              ctx.moveTo(Math.cos(a1) * ring.rx, Math.sin(a1) * ring.ry);
              ctx.lineTo(Math.cos(a2) * ring.rx, Math.sin(a2) * ring.ry);
              ctx.lineWidth = Math.max(0.4, sat.size * (1 - frac) * 0.95);
              ctx.strokeStyle = `rgba(${sat.rgb}, ${(1 - frac) * (isDark ? 0.55 : 0.4)})`;
              ctx.stroke();
            }

            const sx = Math.cos(sat.angle) * ring.rx;
            const sy = Math.sin(sat.angle) * ring.ry;

            // Depth factor: front half of orbit (sin(angle) > 0) appears larger & brighter
            const depthBoost = 1 + Math.sin(sat.angle) * 0.28;

            // Outer telemetry halo
            ctx.beginPath();
            ctx.arc(sx, sy, sat.size * 3.2 * depthBoost, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${sat.rgb}, ${isDark ? 0.22 : 0.16})`;
            ctx.fill();

            // Core satellite node
            ctx.beginPath();
            ctx.arc(sx, sy, sat.size * depthBoost, 0, Math.PI * 2);
            ctx.fillStyle = sat.color;
            ctx.fill();

            // Bright white specular center
            ctx.beginPath();
            ctx.arc(sx, sy, sat.size * 0.45 * depthBoost, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          });

        ctx.restore();
      });

      // =========================================================================
      // LAYER 5: DEEP-SPACE CONSTELLATION NETWORK & MULTI-PLANE 3D STARFIELD
      // =========================================================================
      const projectedConstellationNodes: Array<{ x: number; y: number; alpha: number }> = [];

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Slow orbital rotation drift in sync with the rotating 3D Earth
        star.x -= 0.14 * star.z;
        if (star.x < -width * 0.72) {
          star.x = width * 0.72;
        }

        // Parallax offset based on star's Z depth plane
        const px = width * 0.5 + star.x - camX * 52 * star.z;
        const py = height * 0.5 + star.y - camY * 52 * star.z;

        if (px < -20 || px > width + 20 || py < -20 || py > height + 20) continue;

        const twinkle = 0.55 + 0.45 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
        const alpha = Math.min(1, (0.18 + star.z * 0.62) * twinkle);

        if (star.isConstellationNode) {
          projectedConstellationNodes.push({ x: px, y: py, alpha });
        }

        // Foreground bokeh glow for high-Z depth particles
        if (star.z > 0.95) {
          ctx.beginPath();
          ctx.arc(px, py, star.baseSize * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? `rgba(56, 189, 248, ${alpha * 0.14})`
            : `rgba(14, 165, 233, ${alpha * 0.1})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(px, py, star.baseSize, 0, Math.PI * 2);

        if (isDark) {
          if (star.colorType === 'cyan') {
            ctx.fillStyle = `rgba(103, 232, 249, ${alpha})`;
          } else if (star.colorType === 'emerald') {
            ctx.fillStyle = `rgba(110, 231, 183, ${alpha})`;
          } else if (star.colorType === 'blue') {
            ctx.fillStyle = `rgba(147, 197, 253, ${alpha})`;
          } else if (star.colorType === 'indigo') {
            ctx.fillStyle = `rgba(165, 180, 252, ${alpha})`;
          } else {
            ctx.fillStyle = `rgba(241, 245, 249, ${alpha})`;
          }
        } else {
          if (star.colorType === 'emerald') {
            ctx.fillStyle = `rgba(16, 185, 129, ${alpha * 0.65})`;
          } else if (star.colorType === 'cyan') {
            ctx.fillStyle = `rgba(6, 182, 212, ${alpha * 0.6})`;
          } else {
            ctx.fillStyle = `rgba(37, 99, 235, ${alpha * 0.55})`;
          }
        }

        ctx.fill();
      }

      // Connect nearby mid-depth constellation nodes with subtle deep-space filaments
      const maxConnectDist = 135;
      ctx.lineWidth = 0.55;
      for (let i = 0; i < projectedConstellationNodes.length; i++) {
        const n1 = projectedConstellationNodes[i];
        for (let j = i + 1; j < projectedConstellationNodes.length; j++) {
          const n2 = projectedConstellationNodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxConnectDist) {
            const lineAlpha = (1 - dist / maxConnectDist) * (isDark ? 0.14 : 0.08);
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = isDark
              ? `rgba(56, 189, 248, ${lineAlpha})`
              : `rgba(37, 99, 235, ${lineAlpha})`;
            ctx.stroke();
          }
        }
      }

      // =========================================================================
      // LAYER 6: SHOOTING STARS / HIGH-SPEED ORBITAL DATA STREAMS
      // =========================================================================
      if (Math.random() < 0.014) {
        spawnShootingStar();
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life += 1;

        const lifeRatio = s.life / s.maxLife;
        const opacity = Math.sin(lifeRatio * Math.PI) * (isDark ? 0.75 : 0.55);

        const normVx = s.vx / Math.hypot(s.vx, s.vy);
        const normVy = s.vy / Math.hypot(s.vx, s.vy);
        const tailX = s.x - normVx * s.length;
        const tailY = s.y - normVy * s.length;

        const streakGrad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        streakGrad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
        streakGrad.addColorStop(0.25, `rgba(${s.color}, ${opacity * 0.85})`);
        streakGrad.addColorStop(1, `rgba(${s.color}, 0)`);

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = streakGrad;
        ctx.stroke();

        if (s.life >= s.maxLife) {
          shootingStars.splice(i, 1);
        }
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
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
}
