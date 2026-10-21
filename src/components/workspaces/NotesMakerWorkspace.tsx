import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  FileText, 
  GraduationCap, 
  Zap, 
  HelpCircle, 
  Download, 
  ArrowUpRight
} from 'lucide-react';
import { useWorkspaceChat } from '../../hooks/useWorkspaceChat';
import ChatHistory from '../ChatHistory';
import ChatInput from '../ChatInput';
import { jsPDF } from "jspdf";

interface NotesMakerWorkspaceProps {
  isDark: boolean;
}

const COMPACT_STARTERS = [
  {
    title: 'Structured Chapter Notes',
    prompt: 'Create comprehensive, well-structured study notes on [Subject/Topic]. Include core definitions, intuitive analogies, and key takeaways.',
    icon: FileText,
    iconColor: 'text-amber-300'
  },
  {
    title: 'Exam Revision Guide',
    prompt: 'Create an intensive exam study guide for [Subject/Topic] with high-yield formulas, core concepts, and revision priorities.',
    icon: GraduationCap,
    iconColor: 'text-yellow-300'
  },
  {
    title: 'Active-Recall Flashcards',
    prompt: 'Generate 10 high-retention flashcard-style Q&A pairs on [Subject/Topic] for fast active recall memorization.',
    icon: Zap,
    iconColor: 'text-amber-400'
  },
  {
    title: 'Practice Exam Quiz',
    prompt: 'Generate 6 exam-level multiple choice questions on [Subject/Topic] with explanations and an answer key.',
    icon: HelpCircle,
    iconColor: 'text-orange-300'
  }
];

// Photographic Open Book & Organic Volumetric Golden Mist Renderer (Zero Vector/3D-Cartoon Look)
function MedhiraMagicalBookBackground({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Offscreen pre-rendered photographic book & tabletop layer for crisp, non-cartoon tonal shading
    const bookLayer = document.createElement('canvas');
    // Offscreen low-res FBM volumetric cloud buffer for smooth photographic mist
    const mistCanvas = document.createElement('canvas');
    mistCanvas.width = 180;
    mistCanvas.height = 180;
    const mistCtx = mistCanvas.getContext('2d');

    // Deterministic 2D value noise & FBM for photographic volumetric smoke/mist texture
    const hash2 = (x: number, y: number) => {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
      return s - Math.floor(s);
    };

    const noise2D = (x: number, y: number) => {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = x - ix;
      const fy = y - iy;
      const ux = fx * fx * (3 - 2 * fx);
      const uy = fy * fy * (3 - 2 * fy);
      const a = hash2(ix, iy);
      const b = hash2(ix + 1, iy);
      const c = hash2(ix, iy + 1);
      const d = hash2(ix + 1, iy + 1);
      return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    };

    const fbm = (x: number, y: number) => {
      let v = 0;
      let amp = 0.5;
      let freq = 1;
      for (let i = 0; i < 4; i++) {
        v += amp * noise2D(x * freq, y * freq);
        freq *= 2.02;
        amp *= 0.5;
      }
      return v;
    };

    const getBookCoords = () => {
      const bw = Math.min(width * 0.78, 690);
      const bh = bw * 0.31;
      const cx = width * 0.5;
      const cy = height * 0.76;
      return { cx, cy, bw, bh };
    };

    // Pre-render the photorealistic book & dark textured tabletop onto bookLayer
    const buildPhotographicBookLayer = () => {
      bookLayer.width = Math.floor(width * dpr);
      bookLayer.height = Math.floor(height * dpr);
      const bctx = bookLayer.getContext('2d');
      if (!bctx) return;
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.clearRect(0, 0, width, height);

      const { cx, cy, bw, bh } = getBookCoords();

      // Helper: 3D arch curve of the book page from spine (t=0) to outer fore-edge (t=1)
      // Returns natural curved paper height profile
      const getArchOffset = (t: number) => {
        // Rises smoothly from spine, crests around t=0.38, and slopes gently toward outer edge
        return Math.sin(t * Math.PI * 0.88) * Math.pow(1 - t * 0.32, 0.75);
      };

      // 1. Dark Studio Tabletop Surface & Warm Ambient Bounce Light
      const horizonY = cy - bh * 0.08;
      const tableGrad = bctx.createLinearGradient(0, horizonY - 30, 0, height);
      tableGrad.addColorStop(0, 'rgba(4, 4, 4, 0)');
      tableGrad.addColorStop(0.25, 'rgba(14, 12, 10, 0.82)');
      tableGrad.addColorStop(0.6, 'rgba(18, 16, 14, 0.96)');
      tableGrad.addColorStop(1, 'rgba(8, 7, 6, 1)');
      bctx.fillStyle = tableGrad;
      bctx.fillRect(0, horizonY - 30, width, height - horizonY + 30);

      // Soft warm golden light spilled onto the dark tabletop around the front of the book
      const bounceGrad = bctx.createRadialGradient(
        cx,
        cy + bh * 0.16,
        bw * 0.04,
        cx,
        cy + bh * 0.22,
        bw * 0.62
      );
      bounceGrad.addColorStop(0, 'rgba(210, 162, 88, 0.24)');
      bounceGrad.addColorStop(0.45, 'rgba(130, 92, 48, 0.09)');
      bounceGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      bctx.fillStyle = bounceGrad;
      bctx.fillRect(0, horizonY - 20, width, height - horizonY + 20);

      // 2. Deep Multi-Layered Contact Shadow Under the Book
      bctx.save();
      bctx.filter = 'blur(14px)';
      bctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
      bctx.beginPath();
      bctx.ellipse(cx, cy + bh * 0.25, bw * 0.5, bh * 0.11, 0, 0, Math.PI * 2);
      bctx.fill();

      bctx.filter = 'blur(5px)';
      bctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
      bctx.beginPath();
      bctx.ellipse(cx, cy + bh * 0.22, bw * 0.47, bh * 0.065, 0, 0, Math.PI * 2);
      bctx.fill();
      bctx.restore();

      // 3. Realistic Thin Hardcover Boards Resting on the Table (Left & Right Wings + Center Spine Casing)
      // In a real book, the cover board is a thin, rigid 5-7px slab with a subtle bevel, NOT a tall triangle.
      const boardLeftX = cx - bw * 0.475;
      const boardRightX = cx + bw * 0.475;
      const boardOuterY = cy + bh * 0.145;
      const boardSpineY = cy + bh * 0.205;
      const boardThickness = Math.max(5, bh * 0.036);

      // Outer dark espresso/charcoal leather cover board
      bctx.save();
      bctx.beginPath();
      bctx.moveTo(boardLeftX, boardOuterY);
      bctx.quadraticCurveTo(cx - bw * 0.24, boardOuterY + bh * 0.032, cx - bw * 0.048, boardSpineY);
      // Curved spine casing dip at bottom center
      bctx.bezierCurveTo(
        cx - bw * 0.022,
        boardSpineY + bh * 0.055,
        cx + bw * 0.022,
        boardSpineY + bh * 0.055,
        cx + bw * 0.048,
        boardSpineY
      );
      bctx.quadraticCurveTo(cx + bw * 0.24, boardOuterY + bh * 0.032, boardRightX, boardOuterY);
      // Bottom thickness edge of the cover board
      bctx.lineTo(boardRightX + 2, boardOuterY + boardThickness);
      bctx.quadraticCurveTo(
        cx + bw * 0.24,
        boardOuterY + bh * 0.032 + boardThickness,
        cx + bw * 0.052,
        boardSpineY + boardThickness
      );
      bctx.bezierCurveTo(
        cx + bw * 0.024,
        boardSpineY + bh * 0.058 + boardThickness,
        cx - bw * 0.024,
        boardSpineY + bh * 0.058 + boardThickness,
        cx - bw * 0.052,
        boardSpineY + boardThickness
      );
      bctx.quadraticCurveTo(
        cx - bw * 0.24,
        boardOuterY + bh * 0.032 + boardThickness,
        boardLeftX - 2,
        boardOuterY + boardThickness
      );
      bctx.closePath();

      const leatherGrad = bctx.createLinearGradient(boardLeftX, 0, boardRightX, 0);
      leatherGrad.addColorStop(0, '#141110');
      leatherGrad.addColorStop(0.2, '#27211e');
      leatherGrad.addColorStop(0.45, '#191513');
      leatherGrad.addColorStop(0.5, '#0d0a09');
      leatherGrad.addColorStop(0.55, '#191513');
      leatherGrad.addColorStop(0.8, '#27211e');
      leatherGrad.addColorStop(1, '#141110');
      bctx.fillStyle = leatherGrad;
      bctx.fill();

      // Subtle top bevel highlight on leather board edge
      bctx.strokeStyle = 'rgba(255, 235, 200, 0.14)';
      bctx.lineWidth = 0.8;
      bctx.stroke();
      bctx.restore();

      // 4. Thin, Realistic Burgundy/Crimson Endpaper & Inner Board Lip (Just a delicate 4-6px rim under the pages)
      const drawEndpaperLip = (side: -1 | 1) => {
        bctx.save();
        const outerX = cx + side * bw * 0.468;
        const innerX = cx + side * bw * 0.044;
        const lipThickness = Math.max(3.5, bh * 0.025);

        bctx.beginPath();
        bctx.moveTo(outerX, boardOuterY);
        bctx.quadraticCurveTo(
          cx + side * bw * 0.24,
          boardOuterY + bh * 0.03,
          innerX,
          boardSpineY
        );
        bctx.lineTo(innerX, boardSpineY - lipThickness);
        bctx.quadraticCurveTo(
          cx + side * bw * 0.24,
          boardOuterY + bh * 0.03 - lipThickness * 1.15,
          outerX - side * 3,
          boardOuterY - lipThickness * 0.85
        );
        bctx.closePath();

        const crimsonGrad = bctx.createLinearGradient(cx, 0, outerX, 0);
        crimsonGrad.addColorStop(0, '#2b0d0a');
        crimsonGrad.addColorStop(0.35, '#6e2820');
        crimsonGrad.addColorStop(0.7, '#8c372c');
        crimsonGrad.addColorStop(1, '#3d1510');
        bctx.fillStyle = crimsonGrad;
        bctx.fill();
        bctx.restore();
      };

      drawEndpaperLip(-1);
      drawEndpaperLip(1);

      // 5. Recessed Dark Binding Spine Hollow at Center Base (Small, realistic binding tunnel)
      bctx.save();
      bctx.beginPath();
      bctx.moveTo(cx - bw * 0.044, boardSpineY);
      bctx.bezierCurveTo(
        cx - bw * 0.024,
        boardSpineY - bh * 0.045,
        cx + bw * 0.024,
        boardSpineY - bh * 0.045,
        cx + bw * 0.044,
        boardSpineY
      );
      bctx.bezierCurveTo(
        cx + bw * 0.022,
        boardSpineY + bh * 0.048,
        cx - bw * 0.022,
        boardSpineY + bh * 0.048,
        cx - bw * 0.044,
        boardSpineY
      );
      bctx.closePath();
      const tunnelGrad = bctx.createRadialGradient(
        cx,
        boardSpineY - bh * 0.01,
        1,
        cx,
        boardSpineY,
        bw * 0.045
      );
      tunnelGrad.addColorStop(0, '#070303');
      tunnelGrad.addColorStop(0.65, '#1c0907');
      tunnelGrad.addColorStop(1, '#381410');
      bctx.fillStyle = tunnelGrad;
      bctx.fill();
      bctx.restore();

      // 6. Photorealistic Multi-Hundred Sheet Paper Block (68 Micro-Thin Organic Page Layers per Side)
      // Each layer follows the 3D book arch, shifting from shadowed lower pages near the cover board
      // to warm, backlit ivory pages at the top.
      const totalSheets = 68;
      const drawRealisticPageBlock = (side: -1 | 1) => {
        bctx.save();

        // First, cast a soft ambient occlusion shadow from the page block onto the crimson lip below
        bctx.save();
        bctx.filter = 'blur(3px)';
        bctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        bctx.lineWidth = 3.5;
        bctx.beginPath();
        bctx.moveTo(cx + side * bw * 0.042, boardSpineY - 2);
        bctx.quadraticCurveTo(
          cx + side * bw * 0.24,
          boardOuterY + bh * 0.02,
          cx + side * bw * 0.462,
          boardOuterY - 2
        );
        bctx.stroke();
        bctx.restore();

        // Render 68 individual thin paper layers from bottom (layer 0, resting on cover) to top (layer 67, open page)
        for (let i = 0; i < totalSheets; i++) {
          const v = i / (totalSheets - 1); // 0 = bottom sheet, 1 = top sheet
          // Bottom sheets lie nearly flat along the cover; upper sheets arch higher and curve inward at the fore-edge
          const archStrength = 0.06 + Math.pow(v, 1.28) * 0.42;

          // Spine attachment point moves up the central binding gutter
          const spineX = cx + side * bw * (0.042 * (1 - v * 0.94));
          const spineY = (boardSpineY - 3) - v * (bh * 0.36);

          // Fore-edge (outer page edge) steps inward naturally as pages arch up
          const foreEdgeX = cx + side * bw * (0.462 - Math.pow(v, 1.15) * 0.088);
          const foreEdgeY = (boardOuterY - 3) - v * (bh * 0.31);

          // Organic micro-jitter per sheet so the paper block looks like real stacked paper fibers
          const sheetNoise = (hash2(i * 1.7, side > 0 ? 13 : 29) - 0.5) * 1.2;

          // Compute luminance: deep warm shadow at bottom (v=0), warm backlit cream-parchment near top (v=1)
          const lightCurve = Math.pow(v, 1.35);
          const grain = (hash2(i * 3.1, side > 0 ? 7 : 19) - 0.5) * 18;
          const isShadowCrease = i % 5 === 0 || i % 11 === 0;
          const creaseDarken = isShadowCrease ? -22 : 0;

          const r = Math.max(24, Math.min(255, Math.round(38 + lightCurve * 208 + grain + creaseDarken)));
          const g = Math.max(20, Math.min(252, Math.round(33 + lightCurve * 196 + grain * 0.9 + creaseDarken)));
          const b = Math.max(16, Math.min(238, Math.round(27 + lightCurve * 174 + grain * 0.75 + creaseDarken)));

          bctx.beginPath();
          const steps = 24;
          for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            const px = spineX + (foreEdgeX - spineX) * t;
            const baseLinearY = spineY + (foreEdgeY - spineY) * t;
            const archLift = getArchOffset(t) * bh * archStrength;
            const microWave = Math.sin(t * 14 + i * 0.7) * 0.35;
            const py = baseLinearY - archLift + sheetNoise * t + microWave;
            if (s === 0) {
              bctx.moveTo(px, py);
            } else {
              bctx.lineTo(px, py);
            }
          }

          bctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
          bctx.lineWidth = v > 0.85 ? 1.15 : 1.45;
          bctx.stroke();

          // Fore-edge paper tip highlight (the bevel of stacked page ends on the left/right outside edge)
          if (i % 2 === 0) {
            const edgeR = Math.min(255, r + 18);
            const edgeG = Math.min(250, g + 15);
            const edgeB = Math.min(235, b + 10);
            bctx.fillStyle = `rgba(${edgeR}, ${edgeG}, ${edgeB}, 0.85)`;
            bctx.fillRect(foreEdgeX - side * 1.5, foreEdgeY - getArchOffset(1) * bh * archStrength - 0.6, 2.2, 1.2);
          }
        }

        bctx.restore();
      };

      drawRealisticPageBlock(-1);
      drawRealisticPageBlock(1);

      // 7. Upper Open Arching Page Spread with 3D Cylindrical Shading, Paper Fiber & Perspective Typography
      const drawOpenPageSurface = (side: -1 | 1) => {
        bctx.save();

        const spineTopY = (boardSpineY - 3) - bh * 0.36;
        const spineBotY = (boardSpineY - 3) - bh * 0.22;
        const outerTopX = cx + side * bw * 0.374;
        const outerTopY = (boardOuterY - 3) - bh * 0.31 - getArchOffset(1) * bh * 0.48;
        const outerBotX = cx + side * bw * 0.392;
        const outerBotY = (boardOuterY - 3) - bh * 0.24 - getArchOffset(1) * bh * 0.38;

        // Build closed path for the open visible page surface
        bctx.beginPath();
        const steps = 32;
        // Upper page edge (from spine t=0 to outer top corner t=1)
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const px = cx + (outerTopX - cx) * t;
          const baseLinearY = spineTopY + ((boardOuterY - 3 - bh * 0.31) - spineTopY) * t;
          const py = baseLinearY - getArchOffset(t) * bh * 0.49;
          if (s === 0) bctx.moveTo(px, py);
          else bctx.lineTo(px, py);
        }
        // Outer fore-edge of the open sheet (from outer top corner down to lower front corner)
        bctx.lineTo(outerBotX, outerBotY);
        // Lower front edge of the open sheet (from outer front corner t=1 back to spine gutter t=0)
        for (let s = steps; s >= 0; s--) {
          const t = s / steps;
          const px = cx + (outerBotX - cx) * t;
          const baseLinearY = spineBotY + ((boardOuterY - 3 - bh * 0.24) - spineBotY) * t;
          const py = baseLinearY - getArchOffset(t) * bh * 0.41;
          bctx.lineTo(px, py);
        }
        bctx.closePath();

        // 3D Cylindrical Paper Illumination Gradient:
        // Darker warm shadow right in the spine crease, brilliant incandescent cream-gold across the upper arch crest,
        // and natural warm parchment falloff toward the outer fore-edge.
        const pageGrad = bctx.createLinearGradient(cx, spineTopY, outerBotX, outerBotY);
        pageGrad.addColorStop(0, '#c7b293');
        pageGrad.addColorStop(0.08, '#f5ebd6');
        pageGrad.addColorStop(0.28, '#fffef9');
        pageGrad.addColorStop(0.55, '#fffdf4');
        pageGrad.addColorStop(0.82, '#e6dccb');
        pageGrad.addColorStop(1, '#bfb3a0');
        bctx.fillStyle = pageGrad;
        bctx.fill();

        // Clip to the open page surface to render realistic paper grain, perspective typography & lifted sheet shadow
        bctx.clip();

        // Subtle vertical gradient for warm glowing light emanating from the upper inner page
        const glowGrad = bctx.createRadialGradient(
          cx + side * bw * 0.14,
          spineTopY - bh * 0.18,
          bw * 0.02,
          cx + side * bw * 0.18,
          spineTopY,
          bw * 0.34
        );
        glowGrad.addColorStop(0, 'rgba(255, 253, 240, 0.95)');
        glowGrad.addColorStop(0.45, 'rgba(255, 242, 200, 0.45)');
        glowGrad.addColorStop(1, 'rgba(160, 138, 110, 0)');
        bctx.fillStyle = glowGrad;
        bctx.fillRect(cx - bw * 0.5, spineTopY - bh * 0.6, bw, bh);

        // Perspective-Curved Printed Book Typography Lines (Gives unmistakable real-book authenticity)
        // We draw 11 rows of curved micro-typography that follow the exact 3D arch of the page
        const numTextLines = 11;
        for (let lineIdx = 0; lineIdx < numTextLines; lineIdx++) {
          const lineV = (lineIdx + 1.5) / (numTextLines + 2.5); // 0 = near top edge, 1 = near bottom edge
          // Leave margins on inner spine (t=0.10) and outer edge (t=0.88)
          const isHeader = lineIdx === 0;
          const isParagraphBreak = lineIdx === 5;
          if (isParagraphBreak) continue;

          const startT = isHeader ? 0.25 : 0.11;
          const endT = isHeader ? 0.62 : lineIdx === 4 || lineIdx === 10 ? 0.58 : 0.86;

          const segs = 18;
          for (let s = 0; s < segs; s++) {
            const t0 = startT + (endT - startT) * (s / segs);
            const t1 = startT + (endT - startT) * ((s + 0.72) / segs); // small word gaps
            // Skip random word gaps for authentic printed text rhythm
            if (!isHeader && hash2(lineIdx * 7.3 + s, side > 0 ? 1 : 2) < 0.16) continue;

            const x0 = cx + (outerTopX - cx) * t0 + (outerBotX - outerTopX) * lineV * t0;
            const x1 = cx + (outerTopX - cx) * t1 + (outerBotX - outerTopX) * lineV * t1;

            const topY0 =
              spineTopY +
              (boardOuterY - 3 - bh * 0.31 - spineTopY) * t0 -
              getArchOffset(t0) * bh * 0.49;
            const botY0 =
              spineBotY +
              (boardOuterY - 3 - bh * 0.24 - spineBotY) * t0 -
              getArchOffset(t0) * bh * 0.41;
            const y0 = topY0 + (botY0 - topY0) * lineV;

            const topY1 =
              spineTopY +
              (boardOuterY - 3 - bh * 0.31 - spineTopY) * t1 -
              getArchOffset(t1) * bh * 0.49;
            const botY1 =
              spineBotY +
              (boardOuterY - 3 - bh * 0.24 - spineBotY) * t1 -
              getArchOffset(t1) * bh * 0.41;
            const y1 = topY1 + (botY1 - topY1) * lineV;

            // Fade ink out where the incandescent light is brightest near the upper-inner arch
            const distFromBrightCore = Math.hypot(t0 - 0.32, lineV * 0.8);
            const inkAlpha = Math.max(0.03, Math.min(0.24, distFromBrightCore * 0.26));

            bctx.beginPath();
            bctx.moveTo(x0, y0);
            bctx.lineTo(x1, y1);
            bctx.strokeStyle = `rgba(68, 52, 36, ${inkAlpha.toFixed(3)})`;
            bctx.lineWidth = isHeader ? 1.3 : 0.8;
            bctx.stroke();
          }
        }

        // Delicate Lifted Top Page Leaf (A thin single sheet slightly separated near the outer half, with soft shadow)
        bctx.save();
        bctx.filter = 'blur(2.5px)';
        bctx.beginPath();
        for (let s = 4; s <= steps; s++) {
          const t = s / steps;
          const px = cx + (outerTopX - cx) * t;
          const topY =
            spineTopY +
            (boardOuterY - 3 - bh * 0.31 - spineTopY) * t -
            getArchOffset(t) * bh * 0.49;
          const py = topY + Math.pow(t, 1.2) * (bh * 0.055);
          if (s === 4) bctx.moveTo(px, py);
          else bctx.lineTo(px, py);
        }
        bctx.strokeStyle = 'rgba(75, 58, 40, 0.26)';
        bctx.lineWidth = 2.2;
        bctx.stroke();
        bctx.restore();

        bctx.restore();

        // Soft Optical Light-Wrap Along the Upper Arch Edge (Eliminates hard vector silhouette cut)
        bctx.save();
        bctx.filter = 'blur(3.5px)';
        bctx.globalCompositeOperation = 'screen';
        bctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const px = cx + (outerTopX - cx) * t;
          const py =
            spineTopY +
            (boardOuterY - 3 - bh * 0.31 - spineTopY) * t -
            getArchOffset(t) * bh * 0.49;
          if (s === 0) bctx.moveTo(px, py);
          else bctx.lineTo(px, py);
        }
        bctx.strokeStyle = 'rgba(255, 244, 195, 0.65)';
        bctx.lineWidth = 3.2;
        bctx.stroke();
        bctx.restore();
      };

      drawOpenPageSurface(-1);
      drawOpenPageSurface(1);

      // 8. Realistic Deep Spine Gutter Crease Shadow Where Left & Right Pages Meet
      bctx.save();
      const spineTopY = (boardSpineY - 3) - bh * 0.36;
      const spineBotY = boardSpineY - 2;
      const gutterGrad = bctx.createLinearGradient(cx - bw * 0.032, 0, cx + bw * 0.032, 0);
      gutterGrad.addColorStop(0, 'rgba(90, 68, 44, 0)');
      gutterGrad.addColorStop(0.36, 'rgba(82, 58, 35, 0.22)');
      gutterGrad.addColorStop(0.47, 'rgba(38, 24, 13, 0.58)');
      gutterGrad.addColorStop(0.5, 'rgba(18, 10, 5, 0.78)');
      gutterGrad.addColorStop(0.53, 'rgba(38, 24, 13, 0.58)');
      gutterGrad.addColorStop(0.64, 'rgba(82, 58, 35, 0.22)');
      gutterGrad.addColorStop(1, 'rgba(90, 68, 44, 0)');
      bctx.fillStyle = gutterGrad;
      bctx.fillRect(cx - bw * 0.032, spineTopY, bw * 0.064, spineBotY - spineTopY);
      bctx.restore();

      // 9. Natural Woven Silk Bookmark Ribbon Resting Inside the Spine Gutter & Draping Down
      bctx.save();
      const ribStartY = spineTopY + 1.5;
      const ribMidY = (boardSpineY - 3) - bh * 0.21;
      const ribEndY = boardSpineY + bh * 0.065;

      // Soft contact shadow of ribbon on the pages and spine
      bctx.save();
      bctx.filter = 'blur(2.2px)';
      bctx.beginPath();
      bctx.moveTo(cx - 1.5, ribStartY);
      bctx.bezierCurveTo(
        cx + bw * 0.008,
        ribStartY + bh * 0.05,
        cx - bw * 0.012,
        ribMidY - bh * 0.03,
        cx - bw * 0.006,
        ribMidY
      );
      bctx.bezierCurveTo(
        cx - bw * 0.003,
        ribMidY + bh * 0.09,
        cx - bw * 0.008,
        ribEndY - bh * 0.04,
        cx - bw * 0.005,
        ribEndY
      );
      bctx.lineTo(cx + bw * 0.008, ribEndY);
      bctx.bezierCurveTo(
        cx + bw * 0.005,
        ribEndY - bh * 0.04,
        cx + bw * 0.009,
        ribMidY + bh * 0.09,
        cx + bw * 0.006,
        ribMidY
      );
      bctx.bezierCurveTo(
        cx - bw * 0.001,
        ribMidY - bh * 0.03,
        cx + bw * 0.016,
        ribStartY + bh * 0.05,
        cx + 2.5,
        ribStartY
      );
      bctx.closePath();
      bctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      bctx.fill();
      bctx.restore();

      // Silk ribbon fabric body (rich dark burgundy-espresso silk, no artificial yellow outline)
      bctx.beginPath();
      bctx.moveTo(cx - 2, ribStartY);
      bctx.bezierCurveTo(
        cx + bw * 0.006,
        ribStartY + bh * 0.05,
        cx - bw * 0.013,
        ribMidY - bh * 0.03,
        cx - bw * 0.007,
        ribMidY
      );
      bctx.bezierCurveTo(
        cx - bw * 0.004,
        ribMidY + bh * 0.09,
        cx - bw * 0.009,
        ribEndY - bh * 0.04,
        cx - bw * 0.006,
        ribEndY
      );
      // Swallowtail notch at tip of silk ribbon
      bctx.lineTo(cx, ribEndY - 5);
      bctx.lineTo(cx + bw * 0.006, ribEndY);
      bctx.bezierCurveTo(
        cx + bw * 0.003,
        ribEndY - bh * 0.04,
        cx + bw * 0.007,
        ribMidY + bh * 0.09,
        cx + bw * 0.004,
        ribMidY
      );
      bctx.bezierCurveTo(
        cx - bw * 0.002,
        ribMidY - bh * 0.03,
        cx + bw * 0.014,
        ribStartY + bh * 0.05,
        cx + 2,
        ribStartY
      );
      bctx.closePath();

      const ribGrad = bctx.createLinearGradient(cx, ribStartY, cx, ribEndY);
      ribGrad.addColorStop(0, '#3b1c16');
      ribGrad.addColorStop(0.28, '#24110d');
      ribGrad.addColorStop(0.52, '#331812');
      ribGrad.addColorStop(0.8, '#170a08');
      ribGrad.addColorStop(1, '#0d0504');
      bctx.fillStyle = ribGrad;
      bctx.fill();
      bctx.restore();

      // 10. Authentic Camera-Sensor Overexposure Halation on the Open Pages
      bctx.save();
      bctx.globalCompositeOperation = 'screen';
      for (const side of [-1, 1]) {
        const bx = cx + side * bw * 0.125;
        const by = spineTopY - bh * 0.14;
        const bloom = bctx.createRadialGradient(bx, by, 2, bx, by, bw * 0.21);
        bloom.addColorStop(0, 'rgba(255, 252, 232, 0.86)');
        bloom.addColorStop(0.38, 'rgba(255, 232, 162, 0.42)');
        bloom.addColorStop(0.72, 'rgba(215, 162, 82, 0.12)');
        bloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
        bctx.fillStyle = bloom;
        bctx.beginPath();
        bctx.arc(bx, by, bw * 0.21, 0, Math.PI * 2);
        bctx.fill();
      }
      bctx.restore();
    };

    const handleResize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildPhotographicBookLayer();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Subtle Photographic Dust Motes & Pinpoint Twinkles
    interface DustMote {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      maxAlpha: number;
      life: number;
      maxLife: number;
      phase: number;
      hasGlint: boolean;
    }

    // Motion-Blurred Photographic Golden Light-Moths (like the 2-3 glowing golden-white specks in the photo)
    interface LightMoth {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      wingPhase: number;
      wingSpeed: number;
      alpha: number;
      life: number;
      maxLife: number;
      angle: number;
    }

    const motes: DustMote[] = [];
    const moths: LightMoth[] = [];

    const spawnMote = (initialRandom = false): DustMote => {
      const { cx, cy, bw, bh } = getBookCoords();
      const spread = bw * 0.36;
      const offsetX = (Math.random() + Math.random() - 1) * spread;
      const pageY =
        cy - bh * 0.3 + Math.pow(Math.abs(offsetX) / spread, 1.6) * (bh * 0.18);
      const startY = initialRandom
        ? pageY - Math.random() * (height * 0.34)
        : pageY + (Math.random() - 0.5) * 16;
      const maxLife = 240 + Math.random() * 280;
      return {
        x: cx + offsetX,
        y: startY,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -(0.12 + Math.random() * 0.34),
        radius: 0.8 + Math.random() * 1.7,
        alpha: 0,
        maxAlpha: 0.55 + Math.random() * 0.45,
        life: initialRandom ? Math.random() * maxLife : 0,
        maxLife,
        phase: Math.random() * Math.PI * 2,
        hasGlint: Math.random() < 0.28,
      };
    };

    const spawnMoth = (initialRandom = false): LightMoth => {
      const { cx, cy, bw, bh } = getBookCoords();
      const side = Math.random() < 0.5 ? -1 : 1;
      const offsetX = (Math.random() - 0.5) * bw * 0.45;
      const pageY = cy - bh * 0.32;
      const maxLife = 380 + Math.random() * 240;
      return {
        x: cx + offsetX,
        y: initialRandom ? pageY - 25 - Math.random() * 120 : pageY - 8 - Math.random() * 15,
        vx: side * (0.16 + Math.random() * 0.24),
        vy: -(0.18 + Math.random() * 0.26),
        size: 5.5 + Math.random() * 3.5,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 0.14 + Math.random() * 0.05,
        alpha: 0,
        life: initialRandom ? Math.random() * maxLife * 0.6 : 0,
        maxLife,
        angle: side * (0.18 + Math.random() * 0.22),
      };
    };

    for (let i = 0; i < 68; i++) {
      motes.push(spawnMote(true));
    }
    for (let i = 0; i < 3; i++) {
      moths.push(spawnMoth(true));
    }

    let time = 0;
    const render = () => {
      time += 0.008;

      // Deep pitch-black photographic studio backdrop
      ctx.fillStyle = '#040404';
      ctx.fillRect(0, 0, width, height);

      const { cx, cy, bw, bh } = getBookCoords();

      // =====================================================================
      // 1. REAL-TIME FBM VOLUMETRIC GOLDEN-TAUPE MIST CLOUD ABOVE THE BOOK
      // =====================================================================
      if (mistCtx) {
        const mw = mistCanvas.width;
        const mh = mistCanvas.height;
        const imgData = mistCtx.createImageData(mw, mh);
        const data = imgData.data;

        for (let py = 0; py < mh; py++) {
          const ny = py / mh; // 0 = top of screen, 1 = book level
          // Vertical falloff: strongest near the open pages (ny ~ 0.78), fading smoothly toward top
          const vertEnv = Math.exp(-Math.pow((ny - 0.76) / 0.38, 2));
          // Horizontal spread widens slightly as the mist rises
          const spreadWidth = 0.24 + (1 - ny) * 0.14;

          for (let px = 0; px < mw; px++) {
            const nx = (px / mw - 0.5) / spreadWidth;
            const horizEnv = Math.exp(-nx * nx * 1.45);
            const baseMask = vertEnv * horizEnv;

            if (baseMask > 0.008) {
              // Sample upward-drifting FBM cloud turbulence
              const n = fbm(px * 0.045 + Math.sin(time * 0.7) * 0.4, py * 0.04 - time * 1.4);
              // Subtle vertical light streaks inside the mist
              const streak = fbm(px * 0.11, py * 0.015 - time * 0.9);
              const density = Math.min(1, baseMask * (0.52 + 0.62 * n) * (0.75 + 0.45 * streak));

              // Warm photographic golden-taupe color matching the reference photo's mist
              const coreBoost = Math.max(0, 1 - Math.hypot(nx * 0.7, (ny - 0.82) * 2.2));
              const r = Math.min(255, Math.round(175 + coreBoost * 78));
              const g = Math.min(255, Math.round(142 + coreBoost * 84));
              const b = Math.min(255, Math.round(92 + coreBoost * 68));
              const a = Math.min(255, Math.round(density * 215));

              const idx = (py * mw + px) * 4;
              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
              data[idx + 3] = a;
            }
          }
        }
        mistCtx.putImageData(imgData, 0, 0);

        // Composite the FBM volumetric cloud smoothly over the dark background
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(
          mistCanvas,
          cx - bw * 0.62,
          0,
          bw * 1.24,
          cy - bh * 0.02
        );
        ctx.restore();
      }

      // =====================================================================
      // 2. DRAW PRE-RENDERED PHOTOGRAPHIC OPEN BOOK & TABLETOP
      // =====================================================================
      ctx.drawImage(bookLayer, 0, 0, width, height);

      // Gentle breathing optical glow on the open pages
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const pulse = 0.88 + 0.12 * Math.sin(time * 2.2);
      const pageHalo = ctx.createRadialGradient(
        cx,
        cy - bh * 0.28,
        bw * 0.03,
        cx,
        cy - bh * 0.28,
        bw * 0.38
      );
      pageHalo.addColorStop(0, `rgba(255, 250, 220, ${(0.32 * pulse).toFixed(3)})`);
      pageHalo.addColorStop(0.45, `rgba(235, 190, 110, ${(0.16 * pulse).toFixed(3)})`);
      pageHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = pageHalo;
      ctx.beginPath();
      ctx.arc(cx, cy - bh * 0.28, bw * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // =====================================================================
      // 3. TINY PHOTOGRAPHIC GOLDEN DUST MOTES & PINPOINT STAR SPECKS
      // =====================================================================
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.life++;
        m.x += m.vx + Math.sin(time * 1.8 + m.phase) * 0.1;
        m.y += m.vy;

        const lr = m.life / m.maxLife;
        const fade = lr < 0.16 ? lr / 0.16 : lr > 0.72 ? (1 - lr) / 0.28 : 1;
        const shimmer = 0.68 + 0.32 * Math.sin(m.life * 0.06 + m.phase);
        m.alpha = Math.max(0, fade * m.maxAlpha * shimmer);

        ctx.save();
        ctx.globalAlpha = m.alpha;

        // Soft warm golden halation around each dust speck
        const mg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius * 3.4);
        mg.addColorStop(0, 'rgba(255, 254, 240, 1)');
        mg.addColorStop(0.35, 'rgba(253, 224, 110, 0.82)');
        mg.addColorStop(0.7, 'rgba(212, 152, 58, 0.25)');
        mg.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius * 3.4, 0, Math.PI * 2);
        ctx.fill();

        // Subtle tiny optical cross-glint on brighter specks
        if (m.hasGlint) {
          ctx.fillStyle = 'rgba(255, 255, 248, 0.92)';
          const sl = m.radius * 2.5;
          ctx.fillRect(m.x - sl, m.y - 0.35, sl * 2, 0.7);
          ctx.fillRect(m.x - 0.35, m.y - sl, 0.7, sl * 2);
        }

        ctx.restore();

        if (m.life >= m.maxLife || m.y < height * 0.18) {
          motes[i] = spawnMote(false);
        }
      }

      // =====================================================================
      // 4. PHOTOGRAPHIC MOTION-BLURRED GOLDEN LIGHT-MOTHS (LIKE REFERENCE PHOTO)
      // =====================================================================
      for (let i = 0; i < moths.length; i++) {
        const b = moths[i];
        b.life++;
        b.wingPhase += b.wingSpeed;
        b.x += b.vx + Math.sin(time * 1.5 + i * 2.1) * 0.18;
        b.y += b.vy + Math.sin(b.wingPhase) * 0.18;

        const lr = b.life / b.maxLife;
        const fade = lr < 0.15 ? lr / 0.15 : lr > 0.78 ? (1 - lr) / 0.22 : 1;
        b.alpha = Math.max(0, Math.min(0.92, fade * 0.88));

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle + Math.sin(b.wingPhase * 0.25) * 0.08);
        ctx.globalAlpha = b.alpha;

        const flap = 0.35 + 0.65 * Math.abs(Math.cos(b.wingPhase));

        // Soft golden-white photographic motion-blur bloom (matches the glowing yellow-white moth on the left of the reference photo)
        const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, b.size * 2.4);
        aura.addColorStop(0, 'rgba(255, 253, 230, 0.95)');
        aura.addColorStop(0.4, 'rgba(250, 204, 21, 0.55)');
        aura.addColorStop(0.75, 'rgba(202, 138, 4, 0.18)');
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, b.size * 2.4, 0, Math.PI * 2);
        ctx.fill();

        // Motion-blurred glowing golden-white wing pair
        for (const dir of [-1, 1]) {
          ctx.save();
          ctx.scale(dir * flap, 0.58);
          const wg = ctx.createLinearGradient(0, -b.size * 0.4, b.size * 1.4, b.size * 0.3);
          wg.addColorStop(0, '#ffffff');
          wg.addColorStop(0.55, '#fde047');
          wg.addColorStop(1, '#ca8a04');
          ctx.fillStyle = wg;
          ctx.beginPath();
          ctx.ellipse(b.size * 0.58, -b.size * 0.12, b.size * 0.68, b.size * 0.36, -0.22, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Bright white incandescent center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, b.size * 0.35, b.size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (b.life >= b.maxLife || b.y < height * 0.22) {
          moths[i] = spawnMoth(false);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDark]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 bg-[#040404]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

export default function NotesMakerWorkspace({ isDark }: NotesMakerWorkspaceProps) {
  const { messages, isLoading, sendMessage, stopMessage } = useWorkspaceChat('notes');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleExportPDF = () => {
    const notesText = messages
      .filter((m) => m.role === 'model')
      .map((m) => m.content)
      .join('\n\n---\n\n');

    if (!notesText) {
      showToast("No notes generated yet to export! Ask a question first.");
      return;
    }

    try {
      const doc = new jsPDF();
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Medhira - AI Study Notes & Academic Summary", margin, margin + 8);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      
      const splitText = doc.splitTextToSize(notesText, pageWidth - margin * 2);
      
      let y = margin + 22;
      for (let i = 0; i < splitText.length; i++) {
        if (y > 280) {
          doc.addPage();
          y = margin;
        }
        doc.text(splitText[i], margin, y);
        y += 5.5;
      }
      
      doc.save("medhira_study_notes.pdf");
      showToast("PDF downloaded successfully!");
    } catch {
      showToast("Failed to generate PDF. Please try again.");
    }
  };

  const handleRunPrompt = (promptText: string) => {
    window.dispatchEvent(new CustomEvent('populate-chat-input', { 
      detail: { workspaceId: 'notes', text: promptText } 
    }));
  };

  return (
    <div className="flex flex-col w-full h-full pt-14 sm:pt-16 relative z-10 overflow-hidden text-white">
      {/* Magical Glowing Open Book & Golden Stardust Animation Background */}
      <MedhiraMagicalBookBackground isDark={isDark} />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-xl shadow-amber-600/30 flex items-center gap-2 backdrop-blur-md"
          >
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex-1 w-full flex flex-col ${messages.length === 0 ? 'items-center justify-center overflow-hidden' : 'justify-start items-center overflow-y-auto hide-scrollbar'} pb-28 md:pb-36 px-4 relative z-10`}>
        {messages.length === 0 ? (
          /* COMPACT, USER-FRIENDLY & PROFESSIONAL HERO */
          <div className="flex flex-col items-center justify-center text-center px-4 w-full max-w-md mx-auto my-auto select-none relative z-10">
            
            {/* Subtle Golden Ambient Radial Glow */}
            <div 
              className="absolute -top-10 w-64 sm:w-80 h-32 sm:h-40 rounded-full blur-3xl pointer-events-none opacity-35"
              style={{
                background: 'radial-gradient(circle, rgba(251,191,36,0.35) 0%, rgba(217,119,6,0.14) 50%, transparent 70%)'
              }}
            />

            {/* Vibrant Medhira Circular Logo Emblem */}
            <motion.div 
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mb-3 flex items-center justify-center text-white ring-1 ring-inset ring-white/40"
              style={{
                background: 'linear-gradient(145deg, #4338ca 0%, #2563eb 54%, #0284c7 100%)',
                boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.34), 0 12px 26px -4px rgba(37, 99, 235, 0.55)'
              }}
            >
              <BookOpen size={26} strokeWidth={2.1} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
            </motion.div>

            {/* Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400">Medhira</span>
            </motion.h1>

            {/* Simple Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-1.5 text-xs sm:text-sm max-w-xs mx-auto text-amber-100/80 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"
            >
              What would you like to study or summarize today?
            </motion.p>

            {/* Compact Starter Divs (Small size, No extra text, User-friendly) */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 w-full text-left"
            >
              {COMPACT_STARTERS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={idx}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRunPrompt(item.prompt)}
                    className="px-3 py-2 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer backdrop-blur-md bg-black/55 hover:bg-black/75 text-amber-50 hover:text-white border-amber-300/20 hover:border-amber-400/50 shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon size={14} className={`${item.iconColor} shrink-0`} />
                      <span className="text-xs font-medium truncate">{item.title}</span>
                    </div>
                    <ArrowUpRight size={12} className="text-amber-200/60 shrink-0" />
                  </motion.button>
                );
              })}
            </motion.div>

          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Clean Sticky Toolbar when Chat is Active */}
            <div className="w-full max-w-3xl px-4 py-2.5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md border-b bg-[#0c0a08]/85 border-amber-500/20">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <BookOpen size={14} className="text-amber-400" />
                <span className="text-amber-100">Medhira</span>
              </div>

              <button 
                type="button"
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 rounded-xl transition-all shadow-md shadow-amber-500/20 text-xs font-semibold cursor-pointer active:scale-95 shrink-0"
                title="Download formatted notes as PDF"
              >
                <Download size={13} />
                <span>Export PDF</span>
              </button>
            </div>

            <ChatHistory 
              messages={messages} 
              isLoading={isLoading} 
              isDark={true} 
              onSearchImage={(img, prompt) => sendMessage(prompt, img)} 
            />
          </div>
        )}
      </div>

      <ChatInput isDark={true} onSend={sendMessage} onStop={stopMessage} isLoading={isLoading} workspaceId="notes" />
    </div>
  );
}
