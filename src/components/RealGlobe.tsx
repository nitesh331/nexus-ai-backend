import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

export interface CountrySearchTrend {
  id: string;
  country: string;
  code: string;
  flag: string;
  topSearch: string;
  category: string;
  searchVolume: string;
  volumeNumber: number;
  growthRate: string;
  velocity: 'Surging' | 'Breakout' | 'High' | 'Trending';
  sparkline: number[];
  prompt: string;
  lat: number;
  lng: number;
  color: string;
}

export const COUNTRY_TRENDS: CountrySearchTrend[] = [
  {
    id: 'india',
    country: 'India',
    code: 'IN',
    flag: '🇮🇳',
    topSearch: 'AI Coding Tools & DeepSeek vs Gemini',
    category: 'AI & Developer Tech',
    searchVolume: '4.8M searches today',
    volumeNumber: 4800000,
    growthRate: '+118%',
    velocity: 'Surging',
    sparkline: [2.1, 2.7, 3.2, 3.6, 4.0, 4.4, 4.8],
    prompt: 'Conduct a deep real-time research report on AI Coding Tools, frontier reasoning architecture comparisons, and enterprise adoption in 2026.',
    lat: 20.5937,
    lng: 78.9629,
    color: '#00E5FF'
  },
  {
    id: 'usa',
    country: 'United States',
    code: 'US',
    flag: '🇺🇸',
    topSearch: 'Agentic AI & Humanoid Robotics',
    category: 'Robotics & Autonomy',
    searchVolume: '6.2M searches today',
    volumeNumber: 6200000,
    growthRate: '+135%',
    velocity: 'Breakout',
    sparkline: [3.1, 3.5, 4.1, 4.7, 5.2, 5.8, 6.2],
    prompt: 'Analyze global technology breakthroughs in Agentic AI enterprise workflows, humanoid robotics commercialization, and GPU datacenter expansion.',
    lat: 37.0902,
    lng: -95.7129,
    color: '#38BDF8'
  },
  {
    id: 'japan',
    country: 'Japan',
    code: 'JP',
    flag: '🇯🇵',
    topSearch: 'Solid-State Quantum Batteries',
    category: 'Energy & Hardware',
    searchVolume: '2.9M searches today',
    volumeNumber: 2900000,
    growthRate: '+76%',
    velocity: 'High',
    sparkline: [1.6, 1.8, 2.0, 2.2, 2.5, 2.7, 2.9],
    prompt: 'Synthesize the latest research on solid-state quantum battery density breakthroughs, next-gen EV power grids, and hardware patents in 2026.',
    lat: 36.2048,
    lng: 138.2529,
    color: '#00E5FF'
  },
  {
    id: 'uk',
    country: 'United Kingdom',
    code: 'GB',
    flag: '🇬🇧',
    topSearch: 'AI Safety & Frontier Model Laws',
    category: 'AI Policy & Markets',
    searchVolume: '2.4M searches today',
    volumeNumber: 2400000,
    growthRate: '+64%',
    velocity: 'Trending',
    sparkline: [1.4, 1.5, 1.7, 1.9, 2.1, 2.2, 2.4],
    prompt: 'Examine frontier AI safety standards, open-weights auditing regulations, and European deep-tech venture funding.',
    lat: 55.3781,
    lng: -3.4360,
    color: '#60A5FA'
  },
  {
    id: 'germany',
    country: 'Germany',
    code: 'DE',
    flag: '🇩🇪',
    topSearch: 'Green Hydrogen & Fusion Energy',
    category: 'Clean Energy & Fusion',
    searchVolume: '2.1M searches today',
    volumeNumber: 2100000,
    growthRate: '+52%',
    velocity: 'Trending',
    sparkline: [1.2, 1.3, 1.5, 1.6, 1.8, 1.9, 2.1],
    prompt: 'Synthesize global breakthroughs in green hydrogen distribution pipelines, industrial decarbonization, and stellarator fusion milestones in 2026.',
    lat: 51.1657,
    lng: 10.4515,
    color: '#3B82F6'
  },
  {
    id: 'china',
    country: 'China',
    code: 'CN',
    flag: '🇨🇳',
    topSearch: 'High-NA EUV & Quantum Satellites',
    category: 'Semiconductors & Quantum',
    searchVolume: '8.4M searches today',
    volumeNumber: 8400000,
    growthRate: '+142%',
    velocity: 'Breakout',
    sparkline: [4.2, 4.9, 5.7, 6.5, 7.2, 7.8, 8.4],
    prompt: 'Analyze next-generation High-NA EUV lithography tooling, 2nm wafer fabrication, and quantum entanglement satellite communication networks.',
    lat: 35.8617,
    lng: 104.1954,
    color: '#00E5FF'
  },
  {
    id: 'south-korea',
    country: 'South Korea',
    code: 'KR',
    flag: '🇰🇷',
    topSearch: 'HBM4 Memory & Neural Chipsets',
    category: 'Semiconductor Hardware',
    searchVolume: '3.1M searches today',
    volumeNumber: 3100000,
    growthRate: '+89%',
    velocity: 'High',
    sparkline: [1.8, 2.0, 2.2, 2.5, 2.7, 2.9, 3.1],
    prompt: 'Provide a multi-source comparative intelligence report on HBM4 high-bandwidth memory architecture and custom neural silicon packaging.',
    lat: 35.9078,
    lng: 127.7669,
    color: '#38BDF8'
  },
  {
    id: 'france',
    country: 'France',
    code: 'FR',
    flag: '🇫🇷',
    topSearch: 'Open Sovereign AI Compute',
    category: 'Open Source AI',
    searchVolume: '1.9M searches today',
    volumeNumber: 1900000,
    growthRate: '+71%',
    velocity: 'Trending',
    sparkline: [1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 1.9],
    prompt: 'Report on sovereign AI compute clusters, open-weights foundation architectures, and scientific research grants.',
    lat: 46.2276,
    lng: 2.2137,
    color: '#60A5FA'
  },
  {
    id: 'uae',
    country: 'UAE',
    code: 'AE',
    flag: '🇦🇪',
    topSearch: 'Sovereign AI & Smart Cities',
    category: 'Sovereign Compute',
    searchVolume: '1.6M searches today',
    volumeNumber: 1600000,
    growthRate: '+94%',
    velocity: 'High',
    sparkline: [0.8, 0.9, 1.0, 1.2, 1.4, 1.5, 1.6],
    prompt: 'Analyze sovereign AI compute clusters, clean energy data centers, and autonomous urban infrastructure.',
    lat: 23.4241,
    lng: 53.8478,
    color: '#00E5FF'
  },
  {
    id: 'australia',
    country: 'Australia',
    code: 'AU',
    flag: '🇦🇺',
    topSearch: 'Clean Lithium & Solar Microgrids',
    category: 'Mining & Green Tech',
    searchVolume: '1.7M searches today',
    volumeNumber: 1700000,
    growthRate: '+48%',
    velocity: 'Trending',
    sparkline: [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7],
    prompt: 'Investigate direct clean lithium extraction technology, utility-scale renewable battery microgrids, and solar power exports.',
    lat: -25.2744,
    lng: 133.7751,
    color: '#38BDF8'
  },
  {
    id: 'brazil',
    country: 'Brazil',
    code: 'BR',
    flag: '🇧🇷',
    topSearch: 'Agri-Tech AI & Bio-Monitoring',
    category: 'Bio-tech & Agriculture',
    searchVolume: '2.7M searches today',
    volumeNumber: 2700000,
    growthRate: '+82%',
    velocity: 'High',
    sparkline: [1.5, 1.7, 1.9, 2.1, 2.3, 2.5, 2.7],
    prompt: 'Synthesize precision crop yield analytics, rainforest bio-monitoring satellite systems, and sustainable biofuel innovations.',
    lat: -14.2350,
    lng: -51.9253,
    color: '#00E5FF'
  },
  {
    id: 'canada',
    country: 'Canada',
    code: 'CA',
    flag: '🇨🇦',
    topSearch: 'Photonic Quantum Computing',
    category: 'Quantum AI',
    searchVolume: '2.0M searches today',
    volumeNumber: 2000000,
    growthRate: '+63%',
    velocity: 'Trending',
    sparkline: [1.2, 1.3, 1.5, 1.6, 1.8, 1.9, 2.0],
    prompt: 'Synthesize breakthroughs in photonic quantum computing commercialization, deep learning architectures, and clean tech.',
    lat: 56.1304,
    lng: -106.3468,
    color: '#60A5FA'
  }
];

// ============================================================================
// MODULE-LEVEL TEXTURE & GEOMETRY CACHE FOR INSTANT 0ms GLOBE STARTUP
// ============================================================================
const EARTH_BLUE_MARBLE_URL = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const EARTH_WATER_URL = 'https://unpkg.com/three-globe/example/img/earth-water.png';
const EARTH_CLOUDS_URL =
  'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png';

// Instant in-memory holographic sapphire Earth texture so the globe renders on Frame 1 (0ms network wait)
const INSTANT_HOLO_EARTH_URL: string = (() => {
  if (typeof document === 'undefined') return EARTH_BLUE_MARBLE_URL;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return EARTH_BLUE_MARBLE_URL;

    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#071a4a');
    grad.addColorStop(0.5, '#0f3285');
    grad.addColorStop(1, '#071a4a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Subtle lat/lng holographic grid
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 512; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y <= 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    return canvas.toDataURL('image/png');
  } catch {
    return EARTH_BLUE_MARBLE_URL;
  }
})();

let cachedEarthTexture: THREE.Texture | null = null;
let cachedWaterTexture: THREE.Texture | null = null;
let cachedCloudTexture: THREE.Texture | null = null;
let isPreloadingStarted = false;

function ensureGlobeTexturesPreloaded(onEarthLoaded?: (tex: THREE.Texture) => void) {
  if (typeof window === 'undefined') return;
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');

  if (cachedEarthTexture) {
    onEarthLoaded?.(cachedEarthTexture);
  } else {
    loader.load(EARTH_BLUE_MARBLE_URL, (tex) => {
      cachedEarthTexture = tex;
      onEarthLoaded?.(tex);
    });
  }

  if (!isPreloadingStarted) {
    isPreloadingStarted = true;
    loader.load(EARTH_WATER_URL, (tex) => {
      cachedWaterTexture = tex;
    });
    loader.load(EARTH_CLOUDS_URL, (tex) => {
      cachedCloudTexture = tex;
    });
  }
}

// Start pre-warming textures in the background as soon as the bundle loads
ensureGlobeTexturesPreloaded();

// Static precomputed arcs & points data (avoids recalculating on mount)
const STATIC_INTERCOUNTRY_ARCS = [
  { startLat: 37.0902, startLng: -95.7129, endLat: 51.1657, endLng: 10.4515, color: ['#00E5FF', '#3B82F6'] },
  { startLat: 37.0902, startLng: -95.7129, endLat: -14.235, endLng: -51.9253, color: ['#38BDF8', '#00E5FF'] },
  { startLat: 55.3781, startLng: -3.436, endLat: 20.5937, endLng: 78.9629, color: ['#00E5FF', '#60A5FA'] },
  { startLat: 51.1657, startLng: 10.4515, endLat: 36.2048, endLng: 138.2529, color: ['#3B82F6', '#00E5FF'] },
  { startLat: 23.4241, startLng: 53.8478, endLat: 20.5937, endLng: 78.9629, color: ['#00E5FF', '#38BDF8'] },
  { startLat: 20.5937, startLng: 78.9629, endLat: 36.2048, endLng: 138.2529, color: ['#00E5FF', '#3B82F6'] },
  { startLat: 36.2048, startLng: 138.2529, endLat: -25.2744, endLng: 133.7751, color: ['#38BDF8', '#00E5FF'] },
  { startLat: 35.8617, startLng: 104.1954, endLat: 37.0902, endLng: -95.7129, color: ['#00E5FF', '#60A5FA'] },
  { startLat: -14.235, startLng: -51.9253, endLat: 46.2276, endLng: 2.2137, color: ['#38BDF8', '#3B82F6'] },
  { startLat: 56.1304, startLng: -106.3468, endLat: 55.3781, endLng: -3.436, color: ['#00E5FF', '#38BDF8'] },
  { startLat: 23.4241, startLng: 53.8478, endLat: -1.2921, endLng: 36.8219, color: ['#38BDF8', '#00E5FF'] },
  { startLat: 1.3521, startLng: 103.8198, endLat: -25.2744, endLng: 133.7751, color: ['#00E5FF', '#3B82F6'] }
];

const STATIC_POINTS_DATA = [
  ...COUNTRY_TRENDS.map((c) => ({
    lat: c.lat,
    lng: c.lng,
    size: 0.44,
    color: c.color,
    trend: c
  })),
  { lat: 40.7128, lng: -74.006, size: 0.25, color: '#00E5FF' },
  { lat: 34.0522, lng: -118.2437, size: 0.25, color: '#38BDF8' },
  { lat: 19.4326, lng: -99.1332, size: 0.22, color: '#00E5FF' },
  { lat: -23.5505, lng: -46.6333, size: 0.26, color: '#00E5FF' },
  { lat: -34.6037, lng: -58.3816, size: 0.22, color: '#38BDF8' },
  { lat: 48.8566, lng: 2.3522, size: 0.24, color: '#00E5FF' },
  { lat: 52.52, lng: 13.405, size: 0.24, color: '#38BDF8' },
  { lat: 59.3293, lng: 18.0686, size: 0.22, color: '#60A5FA' },
  { lat: 30.0444, lng: 31.2357, size: 0.25, color: '#00E5FF' },
  { lat: 6.5244, lng: 3.3792, size: 0.22, color: '#38BDF8' },
  { lat: -26.2041, lng: 28.0473, size: 0.24, color: '#00E5FF' },
  { lat: 19.076, lng: 72.8777, size: 0.26, color: '#00E5FF' },
  { lat: 12.9716, lng: 77.5946, size: 0.24, color: '#38BDF8' },
  { lat: 1.3521, lng: 103.8198, size: 0.25, color: '#00E5FF' },
  { lat: 31.2304, lng: 121.4737, size: 0.26, color: '#00E5FF' },
  { lat: -33.8688, lng: 151.2093, size: 0.24, color: '#38BDF8' }
];

interface RealGlobeProps {
  isDark: boolean;
  onSelectTopic?: (prompt: string, trend?: CountrySearchTrend) => void;
  className?: string;
}

export default function RealGlobe({ isDark, onSelectTopic, className = '' }: RealGlobeProps) {
  const globeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return { width: 225, height: 225 };
    }
    return { width: 410, height: 410 };
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const cloudMeshRef = useRef<THREE.Mesh | null>(null);
  const networkGroupRef = useRef<THREE.Group | null>(null);
  const isSceneConfiguredRef = useRef(false);

  // Interactive User Control State for the 3D Globe
  const [isAutoRotating] = useState(true);
  const [hoveredTrend, setHoveredTrend] = useState<CountrySearchTrend | null>(null);
  const isAutoRotatingRef = useRef(true);
  const isUserDraggingRef = useRef(false);
  const resumeTimerRef = useRef<any>(null);

  const focusCountryOnGlobe = (trend: CountrySearchTrend) => {
    if (!globeRef.current || typeof globeRef.current.pointOfView !== 'function') return;
    const isMobile = window.innerWidth < 640;
    globeRef.current.pointOfView(
      { lat: trend.lat, lng: trend.lng, altitude: isMobile ? 1.85 : 1.58 },
      550
    );
    setHoveredTrend(trend);
  };

  // Immediate 0ms scene, camera, controls, and holographic cage initialization
  const configureGlobeScene = () => {
    const globe = globeRef.current;
    if (!globe) return;

    if (typeof globe.renderer === 'function') {
      const renderer = globe.renderer();
      if (renderer) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.45;
      }
    }

    if (typeof globe.controls === 'function') {
      const controls = globe.controls();
      if (controls) {
        controls.autoRotate = isAutoRotatingRef.current;
        controls.autoRotateSpeed = 2.0;
        controls.enableRotate = true;
        controls.rotateSpeed = 1.15;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enableZoom = true;
        controls.zoomSpeed = 0.85;
        controls.minDistance = 150;
        controls.maxDistance = 360;
        controls.enablePan = false;
      }
    }

    if (!isSceneConfiguredRef.current && typeof globe.pointOfView === 'function') {
      const isMobile = window.innerWidth < 640;
      globe.pointOfView({ lat: 16, lng: -28, altitude: isMobile ? 2.28 : 1.92 }, 0);
      isSceneConfiguredRef.current = true;
    }

    // Style Earth surface immediately in luminous electric sapphire & cyan
    if (typeof globe.globeMaterial === 'function') {
      const globeMaterial = globe.globeMaterial();
      if (globeMaterial) {
        globeMaterial.color = new THREE.Color('#1d4ed8');
        globeMaterial.emissive = new THREE.Color('#061a48');
        globeMaterial.emissiveIntensity = 0.85;
        globeMaterial.specular = new THREE.Color('#00e5ff');
        globeMaterial.shininess = 50;

        if (cachedEarthTexture && globeMaterial.map !== cachedEarthTexture) {
          globeMaterial.map = cachedEarthTexture;
          globeMaterial.needsUpdate = true;
        } else {
          ensureGlobeTexturesPreloaded((tex) => {
            if (globeMaterial) {
              globeMaterial.map = tex;
              globeMaterial.needsUpdate = true;
            }
          });
        }

        if (cachedWaterTexture && globeMaterial.specularMap !== cachedWaterTexture) {
          globeMaterial.specularMap = cachedWaterTexture;
          globeMaterial.needsUpdate = true;
        }
      }
    }

    const scene = typeof globe.scene === 'function' ? globe.scene() : null;
    if (!scene) return;

    const dirLight = scene.children.find((obj: any) => obj.type === 'DirectionalLight');
    if (dirLight) {
      dirLight.color = new THREE.Color('#60a5fa');
      dirLight.intensity = 3.2;
      dirLight.position.set(1.5, 1.0, 1.5);
    }
    const ambLight = scene.children.find((obj: any) => obj.type === 'AmbientLight');
    if (ambLight) {
      ambLight.color = new THREE.Color('#1e40af');
      ambLight.intensity = 1.15;
    }

    if (!scene.children.find((obj: any) => obj.name === 'earth-rim-light')) {
      const rimLight = new THREE.DirectionalLight(0x00e5ff, 2.4);
      rimLight.position.set(-1.6, -0.8, -1.2);
      rimLight.name = 'earth-rim-light';
      scene.add(rimLight);
    }

    // Holographic Constellation Mesh + 3D Orbital Rings Group (Created Synchronously)
    if (!networkGroupRef.current && typeof globe.getGlobeRadius === 'function') {
      const r = globe.getGlobeRadius();
      const group = new THREE.Group();
      group.name = 'holo-network-group';

      // 1. Triangulated Icosahedron Constellation Cage
      const icoGeo = new THREE.IcosahedronGeometry(r * 1.012, 2);
      const wireGeo = new THREE.WireframeGeometry(icoGeo);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      group.add(new THREE.LineSegments(wireGeo, wireMat));

      // 2. Glowing Vertices on the Constellation Cage
      const ptsMat = new THREE.PointsMaterial({
        color: 0x7dd3fc,
        size: 1.8,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      group.add(new THREE.Points(icoGeo, ptsMat));

      // 3. Outer 3D Tilted Orbital Rings around the Globe
      const orbitConfigs = [
        { radius: r * 1.24, rx: 1.12, ry: 0.28, rz: -0.35, color: 0x00e5ff, opacity: 0.48 },
        { radius: r * 1.34, rx: -0.95, ry: 0.42, rz: 0.52, color: 0x3b82f6, opacity: 0.38 },
        { radius: r * 1.44, rx: 1.32, ry: -0.35, rz: 0.18, color: 0x8b5cf6, opacity: 0.28 }
      ];

      const nodeGeo = new THREE.SphereGeometry(r * 0.018, 8, 8);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

      orbitConfigs.forEach((cfg) => {
        const curve = new THREE.EllipseCurve(0, 0, cfg.radius, cfg.radius, 0, Math.PI * 2, false, 0);
        const points = curve.getPoints(72);
        const orbitGeo = new THREE.BufferGeometry().setFromPoints(
          points.map((p) => new THREE.Vector3(p.x, p.y, 0))
        );
        const orbitMat = new THREE.LineBasicMaterial({
          color: cfg.color,
          transparent: true,
          opacity: cfg.opacity,
          blending: THREE.AdditiveBlending
        });
        const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
        orbitLine.rotation.set(cfg.rx, cfg.ry, cfg.rz);

        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2 + cfg.rx;
          const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
          nodeMesh.position.set(Math.cos(angle) * cfg.radius, Math.sin(angle) * cfg.radius, 0);
          orbitLine.add(nodeMesh);
        }

        group.add(orbitLine);
      });

      scene.add(group);
      networkGroupRef.current = group;
    }

    // Attach cached cloud mesh immediately if available
    if (!cloudMeshRef.current && cachedCloudTexture && typeof globe.getGlobeRadius === 'function') {
      const cloudsMaterial = new THREE.MeshPhongMaterial({
        map: cachedCloudTexture,
        color: new THREE.Color('#38bdf8'),
        emissive: new THREE.Color('#0284c7'),
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const cloudSphere = new THREE.Mesh(
        new THREE.SphereGeometry(globe.getGlobeRadius() * 1.016, 36, 36),
        cloudsMaterial
      );
      scene.add(cloudSphere);
      cloudMeshRef.current = cloudSphere;
    }
  };

  useEffect(() => {
    configureGlobeScene();
    const rafId = requestAnimationFrame(configureGlobeScene);
    return () => cancelAnimationFrame(rafId);
  }, [isDark]);

  // Continuous 60fps animation loop for globe controls, clouds, and 3D orbital rings
  useEffect(() => {
    let animId: number;
    const animate = () => {
      if (globeRef.current && typeof globeRef.current.controls === 'function') {
        const controls = globeRef.current.controls();
        if (controls) {
          controls.autoRotate = isAutoRotatingRef.current && !isUserDraggingRef.current;
          controls.update();
        }
      }
      if (cloudMeshRef.current) {
        cloudMeshRef.current.rotation.y += 0.0022;
      }
      if (networkGroupRef.current) {
        networkGroupRef.current.rotation.y -= 0.0018;
        networkGroupRef.current.rotation.z += 0.0006;
      }
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const side = Math.max(225, Math.min(Math.floor(rect.width || 410), Math.floor(rect.height || 410), 520));
        setDimensions((prev) => (prev.width === side && prev.height === side ? prev : { width: side, height: side }));
      }
    };

    updateSize();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(updateSize);
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      if (observer) observer.disconnect();
    };
  }, []);

  const handlePointerDown = () => {
    isUserDraggingRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const handlePointerUp = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isUserDraggingRef.current = false;
    }, 900);
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-0 flex items-center justify-center relative select-none overflow-visible pointer-events-none ${className}`}
    >
      {/* Circular Interactive Hit Region for 3D Globe Drag/Rotate/Zoom (passes corner clicks to cards behind) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ clipPath: 'circle(46% at 50% 50%)' }}
        className="absolute inset-0 flex items-center justify-center overflow-visible pointer-events-auto cursor-grab active:cursor-grabbing"
      >
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl={cachedEarthTexture ? EARTH_BLUE_MARBLE_URL : INSTANT_HOLO_EARTH_URL}
          waitForGlobeReady={false}
          animateIn={false}
          onGlobeReady={configureGlobeScene}
          backgroundColor="rgba(0,0,0,0)"
          showGraticules={true}
          showAtmosphere={true}
          atmosphereColor="#00e5ff"
          atmosphereAltitude={0.25}
          ringsData={COUNTRY_TRENDS}
          ringLat={(d: any) => d.lat}
          ringLng={(d: any) => d.lng}
          ringColor={(d: any) => () => d.color}
          ringMaxRadius={5.5}
          ringPropagationSpeed={2.5}
          ringRepeatPeriod={1100}
          arcsData={STATIC_INTERCOUNTRY_ARCS}
          arcColor="color"
          arcDashLength={0.42}
          arcDashGap={0.65}
          arcDashAnimateTime={1800}
          arcStroke={0.45}
          arcAltitudeAutoScale={0.28}
          pointsData={STATIC_POINTS_DATA}
          pointColor="color"
          pointAltitude={0.01}
          pointRadius="size"
          pointsMerge={false}
          onPointHover={(pt: any) => {
            setHoveredTrend(pt?.trend || null);
          }}
          onPointClick={(pt: any) => {
            if (pt?.trend) {
              focusCountryOnGlobe(pt.trend);
              if (onSelectTopic) {
                onSelectTopic(pt.trend.prompt, pt.trend);
              }
            }
          }}
        />
      </div>

      {/* Hovered Country Node Floating Badge on the Globe */}
      {hoveredTrend && (
        <div
          onClick={() => onSelectTopic && onSelectTopic(hoveredTrend.prompt, hoveredTrend)}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto cursor-pointer px-2.5 py-1 rounded-xl bg-[#061436]/92 backdrop-blur-xl border border-cyan-400/55 shadow-[0_6px_22px_rgba(0,229,255,0.35)] flex items-center gap-1.5 text-[10px] text-white whitespace-nowrap animate-fade-in"
        >
          <span>{hoveredTrend.flag}</span>
          <span className="font-bold text-cyan-300">{hoveredTrend.country}:</span>
          <span className="max-w-[140px] sm:max-w-[200px] truncate">{hoveredTrend.topSearch}</span>
          <span className="font-mono text-emerald-300 font-semibold">{hoveredTrend.growthRate}</span>
        </div>
      )}
    </div>
  );
}

