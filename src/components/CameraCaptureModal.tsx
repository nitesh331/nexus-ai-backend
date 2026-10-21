import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

const ZOOM_PRESETS = [1, 2, 3, 5];

export default function CameraCaptureModal({
  isOpen,
  isDark,
  onClose,
  onCapture
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState(true);

  // Camera Zoom State (1x to 5x)
  const [zoom, setZoom] = useState<number>(1);
  const [minZoom, setMinZoom] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(5);
  const [supportsHardwareZoom, setSupportsHardwareZoom] = useState<boolean>(false);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  const applyCameraZoom = useCallback(
    async (targetZoom: number, activeMediaStream?: MediaStream | null) => {
      const clamped = Math.min(maxZoom, Math.max(minZoom, Number(targetZoom.toFixed(2))));
      setZoom(clamped);

      const currentStream = activeMediaStream ?? stream;
      if (!currentStream) return;

      const [videoTrack] = currentStream.getVideoTracks();
      if (!videoTrack) return;

      try {
        const capabilities = (videoTrack.getCapabilities?.() || {}) as any;
        if (capabilities.zoom) {
          const hwMin = capabilities.zoom.min ?? 1;
          const hwMax = capabilities.zoom.max ?? 5;
          const hwZoom = Math.min(hwMax, Math.max(hwMin, clamped));
          await videoTrack.applyConstraints({
            advanced: [{ zoom: hwZoom } as any]
          });
        }
      } catch {
        // Fallback to digital CSS + canvas crop zoom automatically
      }
    },
    [maxZoom, minZoom, stream]
  );

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setZoom(1);
      setSupportsHardwareZoom(false);
      return;
    }

    let activeStream: MediaStream | null = null;
    setIsInitializing(true);
    setCameraError(null);
    setZoom(1);

    const configureTrackZoomCapabilities = (mediaStream: MediaStream) => {
      const [videoTrack] = mediaStream.getVideoTracks();
      if (!videoTrack || typeof videoTrack.getCapabilities !== 'function') {
        setSupportsHardwareZoom(false);
        setMinZoom(1);
        setMaxZoom(5);
        return;
      }
      try {
        const caps = (videoTrack.getCapabilities() || {}) as any;
        if (caps.zoom && typeof caps.zoom.max === 'number' && caps.zoom.max > 1) {
          setSupportsHardwareZoom(true);
          setMinZoom(Math.max(1, caps.zoom.min || 1));
          setMaxZoom(Math.min(8, Math.max(5, caps.zoom.max)));
        } else {
          setSupportsHardwareZoom(false);
          setMinZoom(1);
          setMaxZoom(5);
        }
      } catch {
        setSupportsHardwareZoom(false);
        setMinZoom(1);
        setMaxZoom(5);
      }
    };

    const startCamera = async () => {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error('Camera access not supported on this device/browser.');
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        activeStream = mediaStream;
        setStream(mediaStream);
        configureTrackZoomCapabilities(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.warn('Camera stream error:', err);
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          activeStream = fallbackStream;
          setStream(fallbackStream);
          configureTrackZoomCapabilities(fallbackStream);
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play().catch(() => {});
          }
        } catch {
          setCameraError(
            err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
              ? 'Camera permission denied. Please allow camera access in browser permissions or upload an image.'
              : 'Unable to access camera on this device. You can upload an image from your gallery instead.'
          );
        }
      } finally {
        setIsInitializing(false);
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  // Pinch-to-Zoom & Wheel Zoom Handlers on Viewfinder
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.hypot(dx, dy);
      pinchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scaleDelta = dist / Math.max(1, pinchStartDistRef.current);
      applyCameraZoom(pinchStartZoomRef.current * scaleDelta);
    }
  };

  const handleTouchEnd = () => {
    pinchStartDistRef.current = null;
  };

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    applyCameraZoom(zoom + delta);
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const rawWidth = video.videoWidth || 1280;
    const rawHeight = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = rawWidth;
    canvas.height = rawHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, flip horizontally for natural mirror selfie photo
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Apply digital zoom center crop if hardware zoom is not handling it
    const effectiveDigitalZoom = supportsHardwareZoom ? 1 : zoom;
    const cropWidth = rawWidth / effectiveDigitalZoom;
    const cropHeight = rawHeight / effectiveDigitalZoom;
    const sx = (rawWidth - cropWidth) / 2;
    const sy = (rawHeight - cropHeight) / 2;

    ctx.drawImage(video, sx, sy, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    // Haptic vibration feedback if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch {}
    }

    onCapture(dataUrl);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  const digitalScale = supportsHardwareZoom ? 1 : zoom;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 350 }}
          className={`relative w-full max-w-lg rounded-3xl overflow-hidden border shadow-2xl flex flex-col ${
            isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Camera size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  Click Photo to Search
                </h3>
                <p className="text-[11px] text-zinc-400">Pinch, scroll, or use zoom controls to focus on details</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close camera"
            >
              <X size={18} />
            </button>
          </div>

          {/* Viewfinder Viewport */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheelZoom}
            className="relative aspect-[4/3] sm:aspect-[16/10] bg-black overflow-hidden flex items-center justify-center select-none touch-none"
          >
            {cameraError ? (
              <div className="p-6 text-center flex flex-col items-center max-w-xs">
                <AlertCircle size={36} className="text-amber-400 mb-2" />
                <p className="text-xs text-zinc-300 leading-relaxed mb-4">{cameraError}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors cursor-pointer"
                >
                  Close & Use Upload Instead
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    transform: `${facingMode === 'user' ? 'scaleX(-1) ' : ''}scale(${digitalScale})`,
                    transformOrigin: 'center center'
                  }}
                  className="w-full h-full object-cover transition-transform duration-150 ease-out"
                />

                {isInitializing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 text-xs text-zinc-300">
                    <RefreshCw size={16} className="animate-spin text-indigo-400" />
                    <span>Opening camera viewfinder...</span>
                  </div>
                )}

                {/* Aesthetic Reticle & Focus Frame */}
                <div className="absolute inset-8 sm:inset-11 pointer-events-none border border-indigo-400/35 rounded-2xl flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
                  </div>
                  <div className="flex justify-center items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400/60 animate-ping" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-indigo-400" />
                  </div>
                </div>

                {/* Live Zoom Badge Indicator (Top-Left) */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-mono font-semibold text-indigo-300 shadow-lg">
                  {zoom.toFixed(1)}x ZOOM
                </div>

                {/* Camera Switch Button (Flip Camera) */}
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 transition-all active:scale-90 cursor-pointer shadow-lg"
                  title="Flip camera"
                  aria-label="Flip camera"
                >
                  <RefreshCw size={16} />
                </button>

                {/* Floating Optical/Digital Zoom Controls Overlay (Bottom of Viewfinder) */}
                {!isInitializing && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[92%] max-w-sm px-3 py-2 rounded-2xl bg-black/65 backdrop-blur-xl border border-white/15 flex flex-col gap-1.5 z-20 shadow-xl">
                    {/* Quick Preset Pills (1x, 2x, 3x, 5x) */}
                    <div className="flex items-center justify-center gap-1.5">
                      {ZOOM_PRESETS.filter((p) => p <= maxZoom).map((preset) => {
                        const isActive = Math.abs(zoom - preset) < 0.15;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => applyCameraZoom(preset)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.6)] scale-105'
                                : 'bg-white/10 text-zinc-300 hover:bg-white/20 hover:text-white'
                            }`}
                          >
                            {preset}x
                          </button>
                        );
                      })}
                    </div>

                    {/* Fine Zoom Slider with - / + Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => applyCameraZoom(zoom - 0.5)}
                        disabled={zoom <= minZoom}
                        className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
                        aria-label="Zoom out"
                        title="Zoom Out"
                      >
                        <ZoomOut size={14} />
                      </button>

                      <input
                        type="range"
                        min={minZoom}
                        max={maxZoom}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => applyCameraZoom(parseFloat(e.target.value))}
                        aria-label="Camera zoom level"
                        className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />

                      <button
                        type="button"
                        onClick={() => applyCameraZoom(zoom + 0.5)}
                        disabled={zoom >= maxZoom}
                        className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
                        aria-label="Zoom in"
                        title="Zoom In"
                      >
                        <ZoomIn size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Shutter & File Upload Controls */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-center gap-3 bg-zinc-950/90 border-t border-white/5">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const dataUrl = ev.target?.result as string;
                  if (dataUrl) {
                    onCapture(dataUrl);
                    onClose();
                  }
                };
                reader.readAsDataURL(file);
              }}
            />

            <button
              type="button"
              disabled={!!cameraError || isInitializing}
              onClick={handleCapture}
              className={`group flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all shadow-xl cursor-pointer active:scale-95 ${
                cameraError || isInitializing
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40'
              }`}
            >
              <div className="h-5 w-5 rounded-full border-2 border-white flex items-center justify-center">
                <div className="h-2.5 w-2.5 rounded-full bg-white group-hover:scale-110 transition-transform" />
              </div>
              <span>Click Photo & Search</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-zinc-700/80 hover:border-indigo-500/50 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-md"
            >
              <ImageIcon size={15} className="text-indigo-400" />
              <span>Upload Photo Instead</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
