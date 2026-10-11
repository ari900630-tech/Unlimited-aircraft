/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Sky, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Crosshair, ShieldCheck, Wrench, AlertTriangle, RefreshCw, Trophy, Coins, MoreVertical, X, Home, Play, LogOut } from 'lucide-react';
import { FlightErrorBoundary } from './components/FlightErrorBoundary';
import { DiagnosticReportModal } from './components/DiagnosticReportModal';
import { GameEntryScreen } from './components/GameEntryScreen';
import { GameSplashScreen } from './components/GameSplashScreen';
import { diagnosticService } from './services/diagnosticTelemetry';
import { useFullscreen } from './hooks/useFullscreen';

// ==========================================
// Web Audio Synthesizer (Realistic Avionics & Hits, Silent Gunfire)
// ==========================================
class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public resumeSafely() {
    try {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Audio auto-repair fallback
    }
  }

  public getAudioState(): string {
    return this.ctx ? this.ctx.state : 'idle';
  }

  public setSound(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled && this.engineGain) {
      this.engineGain.gain.setValueAtTime(0, this.ctx ? this.ctx.currentTime : 0);
    }
  }

  public startEngine() {
    // Engine sound completely removed per explicit user instruction ("תסיר את הרעש של המטוס מהמשחק")
    this.stopEngine();
    return;
  }

  public updateEnginePitch(_speed: number) {
    // Engine sound completely removed per explicit user instruction
    return;
  }

  public stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {
        // ignore
      }
      this.engineOsc = null;
      this.engineGain = null;
    }
  }

  public playGunfire() {
    // Gunfire is kept completely silent per explicit user instruction ("ושלא יהיה קול שיורים")
    return;
  }

  public playPlaneHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }
}

const sfx = new SoundFX();

// ==========================================
// Types & Game State
// ==========================================
interface AIPlaneData {
  id: number;
  callsign: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  center: THREE.Vector2;
  radius: number;
  angle: number;
  speed: number;
  altitude: number;
  color: string;
  wingColor: string;
  wobble: number;
  isHit: boolean;
  hitTimer: number;
  propAngle: number;
  // Falling and crashing physics states
  isFalling: boolean;
  fallVelocity: THREE.Vector3;
  fallTumbleSpeed: { pitch: number; roll: number; yaw: number };
  isCrashed: boolean;
  respawnTimer: number;
  smokeProgress: number;
}

// ==========================================
// Isolated High-Performance Tactical Radar Store & Component
// Updates radar blips with 0 root App re-renders
// ==========================================
type RadarListener = (planes: { x: number; z: number; color: string }[]) => void;
class RadarStore {
  private listeners: Set<RadarListener> = new Set();
  public subscribe(fn: RadarListener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
  public update(planes: { x: number; z: number; color: string }[]) {
    this.listeners.forEach((fn) => fn(planes));
  }
}
const radarStore = new RadarStore();

function TacticalRadar() {
  const [planes, setPlanes] = useState<{ x: number; z: number; color: string }[]>([]);

  useEffect(() => {
    return radarStore.subscribe((data) => setPlanes(data));
  }, []);

  return (
    <div className="absolute top-3 right-3 pointer-events-none z-20">
      <div
        className="w-12 h-12 rounded-full bg-slate-950/90 backdrop-blur-md border border-emerald-500/60 relative shadow-2xl overflow-hidden flex items-center justify-center pointer-events-auto"
        title="מכ״ם קרב אווירי"
      >
        {/* Radar Sweep Scanner Cone */}
        <div
          className="absolute inset-0 rounded-full animate-spin pointer-events-none"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(52,211,153,0.8) 360deg)',
            animationDuration: '3s',
          }}
        />

        {/* Crosshairs & Circular Range Rings */}
        <div className="absolute w-full h-[1px] bg-emerald-500/30" />
        <div className="absolute h-full w-[1px] bg-emerald-500/30" />
        <div className="absolute w-7 h-7 rounded-full border border-emerald-500/25" />

        {/* Center Player Aircraft Chevron */}
        <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-300 z-10 shadow-[0_0_8px_#34D399]" />

        {/* Radar Blips for Target Aircraft */}
        {planes.map((p, idx) => {
          const scale = 18 / 200;
          const bx = Math.max(-18, Math.min(18, p.x * scale));
          const bz = Math.max(-18, Math.min(18, p.z * scale));
          return (
            <div
              key={idx}
              className="absolute w-1.5 h-1.5 rounded-full animate-pulse shadow-sm"
              style={{
                backgroundColor: p.color,
                transform: `translate(${bx}px, ${bz}px)`,
                boxShadow: `0 0 6px ${p.color}`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// Isolated Diagnostics HUD Button (Zero App re-renders)
// ==========================================
function DiagnosticHUDButton({
  onOpen,
  className,
}: {
  onOpen: () => void;
  className?: string;
}) {
  const [autoFixCount, setAutoFixCount] = useState(0);

  useEffect(() => {
    return diagnosticService.subscribe((events) => {
      const fixedCount = events.filter((e) => e.autoHealed).length;
      setAutoFixCount(fixedCount);
    });
  }, []);

  return (
    <div className={`pointer-events-auto z-20 ${className || 'absolute top-3 left-24 xs:left-28'}`}>
      <button
        onClick={onOpen}
        title="מרכז אבחון ודיווח שגיאות אוטומטי (לחץ לפתיחת דוח מלא)"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white transition shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-95 group font-tactical text-xs"
      >
        <div className="relative flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="absolute w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
        <span className="hidden sm:inline">תיקון שגיאות אוטומטי</span>
        {autoFixCount > 0 ? (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 text-[10px] rounded font-mono font-bold">
            {autoFixCount} תוקנו
          </span>
        ) : (
          <span className="text-[10px] font-mono text-emerald-500/70">פעיל</span>
        )}
      </button>
    </div>
  );
}

// ==========================================
// AAA Virtual Joystick Component ("רק הדבר הכחול שמוזיזים אותו")
// Sleek aerospace cyclic flight stick thumb knob, zero clutter, instant pointer capture
// ==========================================
function VirtualJoystick({
  onMove,
  onEnd,
}: {
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
}) {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const baseRef = useRef<HTMLDivElement>(null);
  const activePointerId = useRef<number | null>(null);

  const maxRadius = 32;

  const updatePosition = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    let finalX = dx;
    let finalY = dy;

    if (distance > maxRadius) {
      finalX = (dx / distance) * maxRadius;
      finalY = (dy / distance) * maxRadius;
    }

    setKnobPos({ x: finalX, y: finalY });

    // Normalized outputs: x [-1, 1], y [-1, 1]
    const normX = finalX / maxRadius;
    // Flight stick: pushing stick UP (negative dy) = pitch UP, pulling DOWN = pitch DOWN
    const normY = -finalY / maxRadius;
    onMove(normX, normY);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    activePointerId.current = e.pointerId;
    setIsActive(true);
    updatePosition(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== null && e.pointerId === activePointerId.current) {
      e.preventDefault();
      updatePosition(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== null && e.pointerId === activePointerId.current) {
      e.preventDefault();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      activePointerId.current = null;
      setIsActive(false);
      setKnobPos({ x: 0, y: 0 });
      onEnd();
    }
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-24 h-24 touch-none flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
    >
      {/* Thumbstick Knob - Pure aerospace blue control knob without bulky container */}
      <div
        className={`w-13 h-13 rounded-full flex items-center justify-center pointer-events-none relative transition-transform ${
          isActive ? 'scale-105' : 'duration-150 ease-out'
        }`}
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          background: 'radial-gradient(circle at 35% 35%, #38BDF8 0%, #0284C7 45%, #0369A1 75%, #0C4A6E 100%)',
          boxShadow: isActive
            ? '0 0 24px rgba(56, 189, 248, 0.85), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -3px 6px rgba(0,0,0,0.5)'
            : '0 0 14px rgba(56, 189, 248, 0.45), inset 0 2px 3px rgba(255,255,255,0.5), inset 0 -3px 6px rgba(0,0,0,0.6)',
          border: '2px solid rgba(186, 230, 253, 0.85)',
        }}
      >
        {/* Concentric tactile knurling groove */}
        <div className="w-8 h-8 rounded-full border border-sky-300/40 flex items-center justify-center">
          {/* Inner illuminated electric-cyan core pip */}
          <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_#38BDF8]" />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3D Airplane Model: High-Fidelity Tactical Fighter (Ace Dogfighter)
// Streamlined aerodynamic metal fuselage, canopy, spinner, invasion stripes, cannons
// ==========================================
// ==========================================
// 2D Aircraft Image Sprites — aircraft remain movable, but are no longer 3D models.
// The inline SVGs are image textures with transparent backgrounds.
// ==========================================
const PLAYER_AIRCRAFT_IMAGE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
 <defs>
  <linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8fafc"/><stop offset=".48" stop-color="#94a3b8"/><stop offset="1" stop-color="#334155"/></linearGradient>
  <linearGradient id="wing" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e2e8f0"/><stop offset="1" stop-color="#64748b"/></linearGradient>
  <filter id="shadow"><feGaussianBlur stdDeviation="5"/></filter>
 </defs>
 <path d="M256 28 L274 140 L447 226 L449 257 L280 226 L293 352 L348 405 L348 432 L256 411 L164 432 L164 405 L219 352 L232 226 L63 257 L65 226 L238 140 Z" fill="#0f172a" opacity=".28" transform="translate(0 9)" filter="url(#shadow)"/>
 <path d="M256 24 L275 140 L447 226 L449 257 L280 226 L294 354 L349 405 L349 432 L256 411 L163 432 L163 405 L218 354 L232 226 L63 257 L65 226 L237 140 Z" fill="url(#wing)" stroke="#f8fafc" stroke-width="5" stroke-linejoin="round"/>
 <path d="M256 24 L270 145 L267 358 L256 411 L245 358 L242 145 Z" fill="url(#body)" stroke="#e2e8f0" stroke-width="3"/>
 <path d="M256 71 L263 145 L256 164 L249 145 Z" fill="#38bdf8"/>
 <path d="M103 232 L226 202 L224 221 L82 249 Z M409 232 L286 202 L288 221 L430 249 Z" fill="#2563eb"/>
 <path d="M225 338 L174 412 L205 404 L244 362 Z M287 338 L338 412 L307 404 L268 362 Z" fill="#1d4ed8"/>
 <path d="M256 32 L263 121 L256 141 L249 121 Z" fill="#ffffff" opacity=".95"/>
 <circle cx="256" cy="179" r="17" fill="#0c4a6e" stroke="#7dd3fc" stroke-width="5"/>
 <path d="M246 178 Q256 161 266 178 L264 195 L248 195 Z" fill="#0f172a"/>
 <path d="M181 411 L205 403 M331 411 L307 403" stroke="#f8fafc" stroke-width="6" stroke-linecap="round"/>
</svg>`);
const ENEMY_AIRCRAFT_IMAGE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
 <defs>
  <linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fecaca"/><stop offset=".45" stop-color="#b91c1c"/><stop offset="1" stop-color="#450a0a"/></linearGradient>
  <linearGradient id="wing" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ef4444"/><stop offset="1" stop-color="#7f1d1d"/></linearGradient>
 </defs>
 <path d="M256 24 L275 140 L447 226 L449 257 L280 226 L294 354 L349 405 L349 432 L256 411 L163 432 L163 405 L218 354 L232 226 L63 257 L65 226 L237 140 Z" fill="url(#wing)" stroke="#fecaca" stroke-width="5" stroke-linejoin="round"/>
 <path d="M256 24 L270 145 L267 358 L256 411 L245 358 L242 145 Z" fill="url(#body)" stroke="#fee2e2" stroke-width="3"/>
 <path d="M103 232 L226 202 L224 221 L82 249 Z M409 232 L286 202 L288 221 L430 249 Z" fill="#fbbf24"/>
 <path d="M225 338 L174 412 L205 404 L244 362 Z M287 338 L338 412 L307 404 L268 362 Z" fill="#991b1b"/>
 <path d="M256 32 L263 121 L256 141 L249 121 Z" fill="#fff7ed"/>
 <circle cx="256" cy="179" r="17" fill="#1e293b" stroke="#fca5a5" stroke-width="5"/>
 <path d="M246 178 Q256 161 266 178 L264 195 L248 195 Z" fill="#020617"/>
</svg>`);

const DetailedAirplane = React.forwardRef<
  THREE.Group,
  {
    propellerRef?: React.RefObject<THREE.Group | null>;
    color?: string;
    wingtipColor?: string;
    propAngle?: number;
    isHit?: boolean;
    isShooting?: boolean;
    isFlying?: boolean;
  }
>(
  (
    {
      propellerRef,
      color = '#E11D48',
      wingtipColor = '#BE123C',
      propAngle = 0,
      isHit = false,
      isShooting = false,
      isFlying = false,
    },
    ref
  ) => {
    return (
      <group ref={ref}>
        {/* Aerodynamic Fuselage Main Body */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.38, 3.4, 12]} />
          <meshStandardMaterial color={color} roughness={0.25} metalness={0.65} />
        </mesh>

        {/* Engine Cowling Nose Taper */}
        <mesh position={[0, 0, -1.8]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.26, 0.6, 12]} />
          <meshStandardMaterial color="#0F172A" roughness={0.2} metalness={0.85} />
        </mesh>

        {/* Aerodynamic Metallic Nose Spinner Cone */}
        <mesh position={[0, 0, -2.18]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.2, 0.42, 12]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.15} metalness={0.95} />
        </mesh>

        {/* Bubble Cockpit Canopy (Reflective Avionics Glass) */}
        <mesh position={[0, 0.38, -0.25]}>
          <sphereGeometry args={[0.34, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#38BDF8"
            roughness={0.1}
            metalness={0.65}
            transparent
            opacity={0.75}
          />
        </mesh>

        {/* Cockpit Canopy Frame Arc */}
        <mesh position={[0, 0.38, -0.25]}>
          <torusGeometry args={[0.33, 0.02, 8, 20, Math.PI]} />
          <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Pilot Helmet & Aviator Goggles */}
        <group position={[0, 0.34, -0.25]}>
          <mesh>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color="#FBBF24" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.04, -0.14]}>
            <boxGeometry args={[0.18, 0.06, 0.04]} />
            <meshStandardMaterial color="#0F172A" roughness={0.1} metalness={0.9} />
          </mesh>
        </group>

        {/* Dual Engine Exhaust Stubs along Cowling */}
        {[-0.24, 0.24].map((x) => (
          <group key={x} position={[x, 0.05, -1.5]}>
            {[-0.2, -0.05, 0.1].map((z, idx) => (
              <mesh key={idx} position={[0, 0, z]} rotation={[0, 0, x > 0 ? 0.4 : -0.4]}>
                <cylinderGeometry args={[0.03, 0.03, 0.12, 6]} />
                <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Main Swept Monoplane Wing */}
        <group position={[0, 0.02, -0.2]}>
          <mesh>
            <boxGeometry args={[5.2, 0.08, 1.1]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
          </mesh>

          {/* White Tactical Invasion Wing Stripes */}
          {[-1.6, 1.6].map((x) => (
            <mesh key={x} position={[x, 0.045, 0]}>
              <boxGeometry args={[0.35, 0.005, 1.08]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
            </mesh>
          ))}

          {/* Wingtips */}
          <mesh position={[-2.65, 0, 0]}>
            <boxGeometry args={[0.2, 0.08, 1.0]} />
            <meshStandardMaterial color={wingtipColor} />
          </mesh>
          <mesh position={[2.65, 0, 0]}>
            <boxGeometry args={[0.2, 0.08, 1.0]} />
            <meshStandardMaterial color={wingtipColor} />
          </mesh>

          {/* Port Navigation Light (Red on Left) */}
          <mesh position={[-2.75, 0.02, 0]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={1.5} />
          </mesh>
          {/* Starboard Navigation Light (Green on Right) */}
          <mesh position={[2.75, 0.02, 0]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={1.5} />
          </mesh>

          {/* Under-Wing Rifle / Machine Gun Mounts ("מתחת למטוס") */}
          {[-0.65, 0.65].map((x) => (
            <group key={x} position={[x, -0.22, -0.1]}>
              {/* Pylon Mounting Bracket under wing */}
              <mesh position={[0, 0.08, 0]}>
                <boxGeometry args={[0.05, 0.12, 0.55]} />
                <meshStandardMaterial color="#0F172A" metalness={0.8} />
              </mesh>
              {/* Slender Military Rifle Barrel */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.024, 0.024, 0.82, 8]} />
                <meshStandardMaterial color="#1E293B" metalness={0.92} roughness={0.2} />
              </mesh>
              {/* Pointed Muzzle Tip */}
              <mesh position={[0, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.016, 0.022, 0.16, 8]} />
                <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.15} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Tail Fin & Rudder at Back (+Z) */}
        <mesh position={[0, 0.58, 1.5]} rotation={[0.22, 0, 0]}>
          <boxGeometry args={[0.06, 0.85, 0.7]} />
          <meshStandardMaterial color={wingtipColor} metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Tail Navigation Light (White) */}
        <mesh position={[0, 0.95, 1.7]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1.5} />
        </mesh>

        {/* Horizontal Tail Stabilizers */}
        <mesh position={[0, 0.16, 1.55]}>
          <boxGeometry args={[1.8, 0.06, 0.55]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} />
        </mesh>

        {/* Retractable Landing Gear */}
        <group position={[0, -0.38, -0.5]}>
          {[-0.65, 0.65].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh rotation={[0, 0, x > 0 ? 0.25 : -0.25]}>
                <cylinderGeometry args={[0.025, 0.025, 0.44, 6]} />
                <meshStandardMaterial color="#334155" metalness={0.8} />
              </mesh>
              <mesh position={[0, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.13, 0.13, 0.08, 12]} />
                <meshStandardMaterial color="#0F172A" roughness={0.8} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Propeller Hub & Blades / In-Flight Motion Disc */}
        <group position={[0, 0, -2.1]} ref={propellerRef}>
          {isFlying ? (
            /* High-Speed Motion-Blurred Propeller Disc */
            <group rotation={[0, 0, propAngle]}>
              <mesh position={[0, 0, -0.02]}>
                <ringGeometry args={[0.2, 1.45, 24]} />
                <meshBasicMaterial color="#94A3B8" transparent opacity={0.35} side={THREE.DoubleSide} />
              </mesh>
              {/* Outer Golden Tip Ring */}
              <mesh position={[0, 0, -0.02]}>
                <ringGeometry args={[1.35, 1.45, 24]} />
                <meshBasicMaterial color="#FBBF24" transparent opacity={0.6} side={THREE.DoubleSide} />
              </mesh>
              {/* Spinning Blade Streaks */}
              {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, idx) => (
                <mesh key={idx} rotation={[0, 0, angle]}>
                  <boxGeometry args={[0.1, 2.7, 0.02]} />
                  <meshBasicMaterial color="#334155" transparent opacity={0.4} />
                </mesh>
              ))}
            </group>
          ) : (
            /* Parked 3-Blade Metal Propeller */
            <group rotation={[0, 0, propAngle]}>
              {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, idx) => (
                <group key={idx} rotation={[0, 0, angle]}>
                  <mesh position={[0, 0.72, 0]}>
                    <boxGeometry args={[0.12, 1.35, 0.02]} />
                    <meshStandardMaterial color="#0F172A" metalness={0.8} />
                  </mesh>
                  {/* Yellow Blade Tip */}
                  <mesh position={[0, 1.35, 0]}>
                    <boxGeometry args={[0.12, 0.18, 0.025]} />
                    <meshStandardMaterial color="#FBBF24" />
                  </mesh>
                </group>
              ))}
            </group>
          )}
        </group>

        {/* Muzzle Flash Flares when firing rifles (Positioned under the wings) */}
        {isShooting && (
          <>
            {[-0.65, 0.65].map((x) => (
              <group key={x} position={[x, -0.22, -0.65]}>
                <mesh>
                  <sphereGeometry args={[0.09, 6, 6]} />
                  <meshBasicMaterial color="#FEF08A" />
                </mesh>
                <mesh position={[0, 0, -0.14]} rotation={[Math.PI / 2, 0, 0]}>
                  <coneGeometry args={[0.06, 0.32, 6]} />
                  <meshBasicMaterial color="#F97316" transparent opacity={0.9} />
                </mesh>
              </group>
            ))}
          </>
        )}

        {/* Combat Damage Smoke & Sparks */}
        {isHit && (
          <group position={[0, 0.6, 0]}>
            <mesh>
              <sphereGeometry args={[0.45, 10, 10]} />
              <meshStandardMaterial color="#F97316" emissive="#EF4444" emissiveIntensity={2.5} />
            </mesh>
            <mesh position={[0.2, 0.35, 0.3]}>
              <sphereGeometry args={[0.35, 8, 8]} />
              <meshStandardMaterial color="#0F172A" transparent opacity={0.85} />
            </mesh>
            <mesh position={[-0.2, 0.5, 0.6]}>
              <sphereGeometry args={[0.4, 8, 8]} />
              <meshStandardMaterial color="#1E293B" transparent opacity={0.7} />
            </mesh>
          </group>
        )}
      </group>
    );
  }
);
DetailedAirplane.displayName = 'DetailedAirplane';

const AIAircraftModel = React.memo(function AIAircraftModel({
  color,
  wingtipColor,
  propAngle = 0,
}: {
  color: string;
  wingtipColor: string;
  propAngle?: number;
}) {
  // Use actual Three.js geometry instead of an SVG sprite. This avoids invisible
  // texture-loading failures and keeps the enemy aircraft visible from all angles.
  return (
    <group scale={1.45}>
      {/* Fuselage: nose points toward -Z, matching the player's flight direction */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.34, 3.2, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.22} metalness={0.35} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.12, -1.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.22, 0.9, 10]} />
        <meshStandardMaterial color="#F8FAFC" emissive="#7F1D1D" emissiveIntensity={0.25} />
      </mesh>
      {/* Wide wings and rear stabilizers make the silhouette easy to see */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[5.6, 0.14, 1.05]} />
        <meshStandardMaterial color={wingtipColor} emissive={wingtipColor} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 0.02, 1.18]}>
        <boxGeometry args={[2.2, 0.12, 0.62]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 0.42, 1.05]}>
        <boxGeometry args={[0.14, 0.82, 0.55]} />
        <meshStandardMaterial color={wingtipColor} emissive={wingtipColor} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.3, -0.48]}>
        <sphereGeometry args={[0.28, 10, 8]} />
        <meshBasicMaterial color="#FDE68A" />
      </mesh>
      {/* Bright red wingtip markers improve contrast at a distance */}
      {[-2.75, 2.75].map((x) => (
        <mesh key={x} position={[x, 0.1, -0.05]}>
          <boxGeometry args={[0.22, 0.18, 0.28]} />
          <meshBasicMaterial color="#FACC15" />
        </mesh>
      ))}
    </group>
  );
});

// ==========================================
// ==========================================
// 3D Airfield Military Base Environment & Scenery
// Runway with tarmac markings, threshold keys, approach lights, radar tower, hangars
// ==========================================
function MilitaryAirfieldEnvironment() {
  const radarDishRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (radarDishRef.current) {
      radarDishRef.current.rotation.y += delta * 1.2;
    }
  });

  return (
    <group>
      {/* Main Asphalt Runway Complex (Facing -Z) */}
      <group position={[0, 0, 15]}>
        {/* Main Runway Tarmac Surface */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <planeGeometry args={[10, 60]} />
          <meshStandardMaterial color="#1E293B" roughness={0.75} metalness={0.15} />
        </mesh>

        {/* Concrete Runoff Shoulders */}
        {[-5.8, 5.8].map((x) => (
          <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.015, 0]}>
            <planeGeometry args={[1.6, 60]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
        ))}

        {/* White Threshold Piano Keys (Takeoff End) */}
        {[-3.6, -2.6, -1.6, -0.6, 0.6, 1.6, 2.6, 3.6].map((x) => (
          <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, 26]}>
            <planeGeometry args={[0.5, 3.6]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
          </mesh>
        ))}

        {/* Runway Designation Number "09" */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.032, 21]}>
          <planeGeometry args={[2.4, 3.6]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
        </mesh>

        {/* Dashed Centerline Guidance Stripes */}
        {[-22, -16, -10, -4, 2, 8, 14].map((z) => (
          <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, z]}>
            <planeGeometry args={[0.4, 3.2]} />
            <meshStandardMaterial color="#FBBF24" roughness={0.3} />
          </mesh>
        ))}

        {/* Runway Edge Lighting Pylons */}
        {[-26, 26].map((z) => (
          <React.Fragment key={z}>
            {[-5.2, 5.2].map((x) => {
              const lightColor = z > 0 ? '#22C55E' : '#EF4444';
              return (
                <group key={x} position={[x, 0.16, z]}>
                  <mesh>
                    <cylinderGeometry args={[0.07, 0.09, 0.32, 6]} />
                    <meshStandardMaterial color="#334155" metalness={0.8} />
                  </mesh>
                  <mesh position={[0, 0.18, 0]}>
                    <sphereGeometry args={[0.08, 6, 6]} />
                    <meshStandardMaterial color={lightColor} emissive={lightColor} emissiveIntensity={1.8} />
                  </mesh>
                </group>
              );
            })}
          </React.Fragment>
        ))}
      </group>

      {/* Taxiway Connector & Parking Apron */}
      <group position={[14, 0, 15]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
          <planeGeometry args={[16, 24]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        {/* Yellow Taxiway Guide Curve */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3, 0.025, 0]}>
          <planeGeometry args={[0.25, 20]} />
          <meshStandardMaterial color="#FBBF24" />
        </mesh>
      </group>

      {/* Military Flight Control Tower with Rotating Radar Dish */}
      <group position={[15, 0, 32]}>
        {/* Tower Concrete Column */}
        <mesh position={[0, 5, 0]}>
          <cylinderGeometry args={[1.5, 2.0, 10, 10]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.6} />
        </mesh>
        {/* Glazed Observation Room */}
        <mesh position={[0, 10.5, 0]}>
          <cylinderGeometry args={[3.2, 2.4, 2.0, 10]} />
          <meshStandardMaterial color="#0F172A" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Tower Roof Cap */}
        <mesh position={[0, 11.8, 0]}>
          <cylinderGeometry args={[3.4, 3.4, 0.4, 10]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        {/* Animated Rotating Radar Dish Array */}
        <group position={[0, 12.8, 0]} ref={radarDishRef}>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 1.2, 6]} />
            <meshStandardMaterial color="#94A3B8" />
          </mesh>
          <mesh position={[0, 1.2, 0]} rotation={[0.3, 0, 0]}>
            <cylinderGeometry args={[1.4, 0.4, 0.25, 10]} />
            <meshStandardMaterial color="#F8FAFC" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
        {/* Red Hazard Strobe Beacon */}
        <mesh position={[0, 14.4, 0]}>
          <sphereGeometry args={[0.2, 6, 6]} />
          <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* Aircraft Hangars (Corrugated Steel Curved Roofs) */}
      <group position={[-16, 0, 18]}>
        {/* Hangar 1 */}
        <mesh position={[0, 3.2, 0]}>
          <boxGeometry args={[12, 6.4, 14]} />
          <meshStandardMaterial color="#64748B" roughness={0.5} />
        </mesh>
        {/* Arched Steel Roof */}
        <mesh position={[0, 6.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[6, 6, 14, 12, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Open Hangar Bay Interior */}
        <mesh position={[0, 2.5, 7.05]}>
          <planeGeometry args={[9.5, 5.0]} />
          <meshStandardMaterial color="#0B132B" roughness={0.9} />
        </mesh>
      </group>

      {/* Aviation Fuel Storage Depot */}
      <group position={[-16, 0, 38]}>
        {[-3.2, 3.2].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, 2.2, 0]}>
              <cylinderGeometry args={[1.8, 1.8, 4.4, 10]} />
              <meshStandardMaterial color="#E2E8F0" metalness={0.8} roughness={0.25} />
            </mesh>
            {/* Warning Stripe */}
            <mesh position={[0, 2.2, 0]}>
              <cylinderGeometry args={[1.82, 1.82, 0.4, 10]} />
              <meshStandardMaterial color="#EAB308" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// ==========================================
// Expansive Multi-Tile Terrain & Natural Landscape
// High-efficiency instanced vegetation, river canal, mountain amphitheater
// ==========================================
function ExpansiveLandscapeTerrain() {
  // Distant amphitheater of mountain peaks (optimized count for 60FPS)
  const mountainPeaks = useMemo(() => {
    const peaks: [number, number, number, number, number][] = [];
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 380 + (i % 4) * 25;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist - 40;
      const radius = 50 + (i % 3) * 15;
      const height = 70 + (i % 4) * 25;
      peaks.push([x, z, radius, height, i]);
    }
    return peaks;
  }, []);

  // Natural pine tree clusters (Avoiding runway & airfield)
  const pineTrees = useMemo(() => {
    const trees: [number, number, number][] = [];
    const count = 48;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 45 + (i % 6) * 14;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist - 25;
      if (Math.abs(x) < 22 && z > -25 && z < 55) continue;
      const height = 2.4 + (i % 3) * 0.8;
      trees.push([x, z, height]);
    }
    return trees;
  }, []);

  const trunkMeshRef = useRef<THREE.InstancedMesh>(null);
  const foliageMeshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    pineTrees.forEach(([x, z, h], i) => {
      // Trunk instance
      dummy.position.set(x, h * 0.4, z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      trunkMeshRef.current?.setMatrixAt(i, dummy.matrix);

      // Foliage instance
      dummy.position.set(x, h * 1.1, z);
      dummy.updateMatrix();
      foliageMeshRef.current?.setMatrixAt(i, dummy.matrix);
    });
    if (trunkMeshRef.current) trunkMeshRef.current.instanceMatrix.needsUpdate = true;
    if (foliageMeshRef.current) foliageMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [pineTrees]);

  return (
    <group>
      {/* Base Valley Floor (1000m x 1000m) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#15803D" roughness={0.88} />
      </mesh>

      {/* Winding Blue River Channel cutting across valley */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-80, 0.01, -120]}>
        <planeGeometry args={[28, 480]} />
        <meshStandardMaterial color="#0284C7" roughness={0.1} metalness={0.7} />
      </mesh>

      {/* Farmland Agricultural Patchwork Grid Fields */}
      {[
        [-90, -80, 70, 90, '#CA8A04'], // Golden Wheat Field
        [110, -90, 80, 100, '#166534'], // Dark Pine Timber Plot
        [-120, 80, 90, 70, '#854D0E'], // Cultivated Loam Earth
        [90, 90, 80, 80, '#15803D'], // Lush Clover Meadow
        [-60, -180, 110, 80, '#A16207'], // Autumn Harvest Field
        [80, -190, 100, 90, '#14532D'], // Deep Forest Canopy
      ].map(([x, z, w, h, col], idx) => (
        <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]} position={[x as number, 0.008, z as number]}>
          <planeGeometry args={[w as number, h as number]} />
          <meshStandardMaterial color={col as string} roughness={0.9} />
        </mesh>
      ))}

      {/* High-Performance Instanced Pine Trees (Only 2 draw calls total) */}
      <instancedMesh ref={trunkMeshRef} args={[undefined, undefined, pineTrees.length]}>
        <cylinderGeometry args={[0.16, 0.22, 1.8, 6]} />
        <meshStandardMaterial color="#451A03" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={foliageMeshRef} args={[undefined, undefined, pineTrees.length]}>
        <coneGeometry args={[1.35, 3.2, 6]} />
        <meshStandardMaterial color="#14532D" roughness={0.8} />
      </instancedMesh>

      {/* Distant Mountain Peaks with Altitude Fog Depth */}
      {mountainPeaks.map(([x, z, radius, height, i]) => (
        <mesh key={i} position={[x, height / 2, z]}>
          <coneGeometry args={[radius, height, 6]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#1E293B' : '#334155'} roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

// ==========================================
// Main 3D Flight Combat Scene Controller
// Zero GC pauses, 60FPS Ref Pools, Direct Three.js Physics
// ==========================================
function FlightScene({
  isFlying,
  turnInputRef,
  pitchInputRef,
  isShootingRef,
  cameraMode,
  setScore,
  setAerialHits,
  onTargetHit,
  selfHealTrigger,
  planePaint,
}: {
  isFlying: boolean;
  planePaint: { body: string; wing: string };
  turnInputRef: React.MutableRefObject<number>;
  pitchInputRef: React.MutableRefObject<number>;
  isShootingRef: React.MutableRefObject<boolean>;
  cameraMode: 'chase' | 'cockpit' | 'free';
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setAerialHits: React.Dispatch<React.SetStateAction<number>>;
  onTargetHit?: (text: string) => void;
  selfHealTrigger?: number;
}) {
  const { camera, gl } = useThree();

  // WebGL Context Loss & Auto-Recovery Protection
  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      diagnosticService.recordEvent({
        type: 'WEBGL_RECOVERY',
        title: 'איבוד הקשר גרפי (WebGL Context Lost)',
        message: 'התקן ה-WebGL של הדפדפן נותק זמנית. מנגנון ההגנה מנע קריסה של המשחק.',
        autoHealed: true,
        remedyApplied: 'בידוד קנבס והמתנה לשחזור אוטומטי',
      });
    };

    const handleContextRestored = () => {
      diagnosticService.recordEvent({
        type: 'WEBGL_RECOVERY',
        title: 'הקשר גרפי שוחזר בהצלחה (WebGL Restored)',
        message: 'התקן ה-WebGL חובר מחדש. כל המודלים והשיידרים סונכרנו.',
        autoHealed: true,
        remedyApplied: 'אימות קנבס וטעינת מודלים מחודשת',
      });
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);

  // Mesh Refs for 60FPS Direct Transformation
  const airplaneRef = useRef<THREE.Group>(null);
  const propellerRef = useRef<THREE.Group>(null);

  // Player Aircraft Physical State
  const planePos = useRef(new THREE.Vector3(0, 0.6, 28));
  const planeRot = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const propAngle = useRef(0);
  const currentSpeed = useRef(0);
  const bankAngle = useRef(0);
  const smoothLookAt = useRef(new THREE.Vector3(0, 1.2, 28));

  // Enemy Interceptor Target Planes
  const aiPlanesData = useRef<AIPlaneData[]>([
    {
      id: 1,
      callsign: 'BANDIT-01',
      position: new THREE.Vector3(0, 10, -22),
      rotation: new THREE.Euler(0, Math.PI, 0.2, 'YXZ'),
      center: new THREE.Vector2(0, -34),
      radius: 14,
      angle: Math.PI * 1.5,
      speed: 0.36,
      altitude: 10,
      color: '#1E293B', // Midnight Phantom Ace
      wingColor: '#0F172A',
      wobble: 0,
      isHit: false,
      hitTimer: 0,
      propAngle: 0,
      isFalling: false,
      fallVelocity: new THREE.Vector3(),
      fallTumbleSpeed: { pitch: 0, roll: 0, yaw: 0 },
      isCrashed: false,
      respawnTimer: 0,
      smokeProgress: 0,
    },
    {
      id: 2,
      callsign: 'BANDIT-02',
      position: new THREE.Vector3(-12, 4.5, -42),
      rotation: new THREE.Euler(0, Math.PI * 0.3, 0.2, 'YXZ'),
      center: new THREE.Vector2(-12, -56),
      radius: 18,
      angle: Math.PI * 1.5,
      speed: 0.32,
      altitude: 4.5,
      color: '#D97706', // Desert Viper
      wingColor: '#B45309',
      wobble: 0,
      isHit: false,
      hitTimer: 0,
      propAngle: 0,
      isFalling: false,
      fallVelocity: new THREE.Vector3(),
      fallTumbleSpeed: { pitch: 0, roll: 0, yaw: 0 },
      isCrashed: false,
      respawnTimer: 0,
      smokeProgress: 0,
    },
    {
      id: 3,
      callsign: 'BANDIT-03',
      position: new THREE.Vector3(15, 5.5, -63),
      rotation: new THREE.Euler(0, -Math.PI * 0.4, 0.2, 'YXZ'),
      center: new THREE.Vector2(15, -80),
      radius: 22,
      angle: Math.PI * 1.5,
      speed: 0.28,
      altitude: 5.5,
      color: '#475569', // Ghost Slate
      wingColor: '#334155',
      wobble: 0,
      isHit: false,
      hitTimer: 0,
      propAngle: 0,
      isFalling: false,
      fallVelocity: new THREE.Vector3(),
      fallTumbleSpeed: { pitch: 0, roll: 0, yaw: 0 },
      isCrashed: false,
      respawnTimer: 0,
      smokeProgress: 0,
    },
    {
      id: 4,
      callsign: 'BANDIT-04',
      position: new THREE.Vector3(-20, 6.5, -83),
      rotation: new THREE.Euler(0, Math.PI * 0.7, 0.2, 'YXZ'),
      center: new THREE.Vector2(-20, -106),
      radius: 28,
      angle: Math.PI * 1.5,
      speed: 0.24,
      altitude: 6.5,
      color: '#0F766E', // Teal Specter — visually distinct from the player's aircraft
      wingColor: '#14B8A6',
      wobble: 0,
      isHit: false,
      hitTimer: 0,
      propAngle: 0,
      isFalling: false,
      fallVelocity: new THREE.Vector3(),
      fallTumbleSpeed: { pitch: 0, roll: 0, yaw: 0 },
      isCrashed: false,
      respawnTimer: 0,
      smokeProgress: 0,
    },
  ]);
  const aiPlaneGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const aiSmokeRefs = useRef<(THREE.Group | null)[]>([]);

  // High-Performance Bullets Ref Pool (Direct Three.js mutations)
  const MAX_BULLETS = 40;
  const bulletsPool = useRef<
    {
      active: boolean;
      position: THREE.Vector3;
      velocity: THREE.Vector3;
      rotation: THREE.Euler;
      life: number;
    }[]
  >(
    Array.from({ length: MAX_BULLETS }, () => ({
      active: false,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
      life: 0,
    }))
  );
  const bulletGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const lastShotTime = useRef(0);

  // Explosions Ref Pool
  const MAX_EXPLOSIONS = 28;
  const explosionsPool = useRef<{ active: boolean; position: THREE.Vector3; progress: number }[]>(
    Array.from({ length: MAX_EXPLOSIONS }, () => ({
      active: false,
      position: new THREE.Vector3(),
      progress: 0,
    }))
  );
  const explosionGroupRefs = useRef<(THREE.Group | null)[]>([]);

  const spawnExplosion = (pos: THREE.Vector3) => {
    const exp = explosionsPool.current.find((e) => !e.active);
    if (!exp) return;
    exp.active = true;
    exp.position.copy(pos);
    exp.progress = 0;
  };

  // Self-Heal Trigger for Instant Unfreeze
  const prevSelfHealRef = useRef(selfHealTrigger);
  useEffect(() => {
    if (selfHealTrigger && selfHealTrigger !== prevSelfHealRef.current) {
      prevSelfHealRef.current = selfHealTrigger;
      planePos.current.set(0, 35, 0);
      planeRot.current.set(0, 0, 0);
      bankAngle.current = 0;
      currentSpeed.current = 18;
      bulletsPool.current.forEach((b) => {
        b.active = false;
      });
      sfx.resumeSafely();
      diagnosticService.recordEvent({
        type: 'AUTO_FIX',
        title: 'בוצע תיקון ושחרור עצמי יזום (Manual Self-Heal)',
        message: 'שחרור כל התקיעות, איפוס מאגר קליעים והחזרת המטוס למסלול טיסה יציב בגובה 35 מטר.',
        autoHealed: true,
        remedyApplied: 'איפוס קואורדינטות, יישור זוויות טיסה וסנכרון מנוע אודיו',
      });
    }
  }, [selfHealTrigger]);

  const lastRadarUpdate = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const lastFpsCalcRef = useRef(performance.now());
  const lastWatchdogReportRef = useRef(0);

  // Main 60FPS Flight Engine Loop
  useFrame((_, delta) => {
    const now = performance.now();
    const frameGap = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;

    // Track live FPS and sync telemetry
    frameCountRef.current++;
    if (now - lastFpsCalcRef.current > 400) {
      const elapsed = now - lastFpsCalcRef.current;
      const liveFps = (frameCountRef.current * 1000) / elapsed;
      frameCountRef.current = 0;
      lastFpsCalcRef.current = now;

      diagnosticService.updateSnapshot({
        fps: liveFps,
        frameTimeMs: frameGap,
        planePos: { x: planePos.current.x, y: planePos.current.y, z: planePos.current.z },
        planeRot: { pitch: planeRot.current.x, roll: planeRot.current.z, heading: planeRot.current.y },
        speed: currentSpeed.current,
        activeBullets: bulletsPool.current.filter((b) => b.active).length,
        activeAIPlanes: aiPlanesData.current.filter((p) => !p.isCrashed).length,
        audioState: sfx.getAudioState(),
      });
    }

    // 1. Watchdog Stall Protection: Auto-recover from frame stutters / freezes (Silent, Zero UI interruptions)
    let dt = delta;
    const isTabActive = typeof document !== 'undefined' && !document.hidden;

    // Smooth recovery if tab was resumed or delta jumped above 0.8s
    if (delta > 0.8) {
      dt = 0.016;
    } else if (isTabActive && (delta > 0.35 || frameGap > 450)) {
      if (now - lastWatchdogReportRef.current > 4000) {
        lastWatchdogReportRef.current = now;
        diagnosticService.recordEvent({
          type: 'WATCHDOG_STALL',
          title: 'עיכוב פריים נבלם ותוקן אוטומטית (Frame Stall Auto-Fixed)',
          message: `עיכוב ברינדור של ${frameGap.toFixed(0)}ms. הפיזיקה יוצבה במדויק.`,
          details: { frameGapMs: frameGap, deltaSec: delta, speed: currentSpeed.current },
          autoHealed: true,
          remedyApplied: 'בלימת שגיאת תזמון, שמירה על דלתא יציבה ומניעת קפיצות',
        });
      }
      dt = Math.min(delta, 0.033);
    } else {
      dt = Math.min(delta, 0.04);
    }

    // 2. Physics & Coordinates Guard: Anti-NaN, Anti-Abyss Auto-Repair
    if (
      !isFinite(planePos.current.x) ||
      !isFinite(planePos.current.y) ||
      !isFinite(planePos.current.z) ||
      !isFinite(planeRot.current.x) ||
      !isFinite(planeRot.current.y) ||
      !isFinite(planeRot.current.z) ||
      planePos.current.y < 0.2 ||
      planePos.current.y > 1200 ||
      Math.abs(planePos.current.x) > 550 ||
      Math.abs(planePos.current.z) > 550
    ) {
      const invalidState = {
        x: planePos.current.x,
        y: planePos.current.y,
        z: planePos.current.z,
        pitch: planeRot.current.x,
      };
      planePos.current.set(0, 35, 0);
      planeRot.current.set(0, 0, 0);
      bankAngle.current = 0;
      currentSpeed.current = 18;

      diagnosticService.recordEvent({
        type: 'PHYSICS_CORRECTION',
        title: 'שגיאת מיקום / תהום תוקנה אוטומטית (Physics Glitch Auto-Fix)',
        message: `זוהו ערכי פיזיקה לא תקינים במטוס (${JSON.stringify(invalidState)}).`,
        details: invalidState,
        autoHealed: true,
        remedyApplied: 'החזרת המטוס למסדרון טיסה בטוח בגובה 35 מטר בטיסה אופקית יציבה',
      });
    }

    // 3. Bullet & AI Pool Sanitization
    bulletsPool.current.forEach((b) => {
      if (
        b.active &&
        (!isFinite(b.position.x) ||
          !isFinite(b.position.y) ||
          !isFinite(b.position.z) ||
          b.position.y < -5 ||
          b.position.y > 200)
      ) {
        b.active = false;
      }
    });

    aiPlanesData.current.forEach((p) => {
      if (!isFinite(p.position.x) || !isFinite(p.position.y) || !isFinite(p.position.z)) {
        p.position.set(p.center.x, p.altitude, p.center.y);
        p.angle = 0;
      }
    });

    // Propeller Rotation
    const propSpeed = isFlying ? 45 : 0;
    propAngle.current += propSpeed * dt;

    // AI Patrol Airspace & Falling Crash Physics Update (Direct Three.js Object3D mutations)
    aiPlanesData.current.forEach((p, idx) => {
      const grp = aiPlaneGroupRefs.current[idx];
      const smokeGrp = aiSmokeRefs.current[idx];

      if (p.isCrashed) {
        // Plane has hit the ground and crashed into terrain - wait for respawn timer
        p.respawnTimer -= dt;
        if (grp) grp.visible = false;
        if (smokeGrp) smokeGrp.visible = false;

        if (p.respawnTimer <= 0) {
          // Respawn bandit fresh in flight corridor
          p.isCrashed = false;
          p.isFalling = false;
          p.isHit = false;
          p.wobble = 0;
          p.smokeProgress = 0;
          p.angle = Math.random() * Math.PI * 2;
          p.altitude = 20 + Math.random() * 25;
          p.position.set(
            p.center.x + Math.cos(p.angle) * p.radius,
            p.altitude,
            p.center.y + Math.sin(p.angle) * p.radius
          );
          const flightHeading = Math.PI - p.angle;
          p.rotation.set(0, flightHeading, 0.2, 'YXZ');
          if (grp) {
            grp.visible = true;
            grp.position.copy(p.position);
            grp.rotation.copy(p.rotation);
          }
        }
        return;
      }

      if (p.isFalling) {
        // ==========================================
        // UNCONTROLLED DIVE / CRASH PLUNGE TO GROUND
        // ==========================================
        // Gravity pulls airplane steeply towards the earth
        p.fallVelocity.y -= 22 * dt;
        p.fallVelocity.x *= 0.985;
        p.fallVelocity.z *= 0.985;

        p.position.x += p.fallVelocity.x * dt;
        p.position.y += p.fallVelocity.y * dt;
        p.position.z += p.fallVelocity.z * dt;

        // Nose-down pitch and death spin
        p.rotation.x = Math.max(-1.25, p.rotation.x + p.fallTumbleSpeed.pitch * dt);
        p.rotation.z += p.fallTumbleSpeed.roll * dt;
        p.rotation.y += p.fallTumbleSpeed.yaw * dt;
        p.propAngle += 15 * dt;

        // Continuous fiery smoke bursts trailing behind the wounded aircraft
        p.smokeProgress += dt;
        if (p.smokeProgress > 0.08) {
          p.smokeProgress = 0;
          spawnExplosion(p.position.clone());
        }

        // Check Ground Impact (falling plane hits the ground terrain!)
        if (p.position.y <= 0.6) {
          p.position.y = 0.6;
          p.isFalling = false;
          p.isCrashed = true;
          p.respawnTimer = 4.0; // Stays destroyed for 4 seconds before fresh spawn

          // Massive ground impact explosion with multiple fireballs
          spawnExplosion(new THREE.Vector3(p.position.x, 0.6, p.position.z));
          spawnExplosion(new THREE.Vector3(p.position.x + 1.2, 0.9, p.position.z - 0.8));
          spawnExplosion(new THREE.Vector3(p.position.x - 1.0, 0.8, p.position.z + 1.1));

          sfx.playPlaneHit();
          setScore((s) => s + 250);
          onTargetHit?.(`💥 ${p.callsign} הופל! +250 נקודות`);

          if (grp) grp.visible = false;
          if (smokeGrp) smokeGrp.visible = false;
          return;
        }

        if (grp) {
          grp.visible = true;
          grp.position.copy(p.position);
          grp.rotation.copy(p.rotation);
        }
        if (smokeGrp) {
          smokeGrp.visible = true;
        }
        return;
      }

      // Normal flight patrol routine (when healthy and airborne)
      const nextAngle = p.angle + p.speed * dt;
      p.angle = nextAngle;

      const newX = p.center.x + Math.cos(nextAngle) * p.radius;
      const newZ = p.center.y + Math.sin(nextAngle) * p.radius;
      // Aerodynamic forward heading: precisely aligns aircraft nose (-Z) with movement direction!
      const forwardHeading = Math.PI - nextAngle;
      // Inward bank tilt into turn circle (cockpit pointing up to sky, left wing banked into circle)
      const rollBank = 0.2;

      p.position.set(newX, p.altitude, newZ);
      p.rotation.set(0, forwardHeading, rollBank, 'YXZ');
      p.propAngle += 38 * dt;

      if (grp) {
        grp.visible = true;
        grp.position.copy(p.position);
        grp.rotation.copy(p.rotation);
      }
      if (smokeGrp) {
        smokeGrp.visible = false;
      }
    });

    // Throttled Tactical Radar Updates (Direct store update, 0 App re-renders)
    if (now - lastRadarUpdate.current > 140) {
      lastRadarUpdate.current = now;
      const radarData = aiPlanesData.current
        .filter((p) => !p.isCrashed)
        .map((p) => ({
          x: p.position.x - planePos.current.x,
          z: p.position.z - planePos.current.z,
          color: p.isFalling ? '#EF4444' : p.color,
        }));
      radarStore.update(radarData);
    }

    if (isFlying) {
      // Acceleration & Cruise speed
      const targetSpeed = 18;
      currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, targetSpeed, dt * 2.5);

      const turnInput = turnInputRef.current;
      const pitchInput = pitchInputRef.current;

      // Flight attitude controls: Turning left (turnInput < 0) turns left
      const turnRate = 1.5 * dt;
      planeRot.current.y -= turnInput * turnRate;

      // Roll / Bank angle during turning
      const targetBank = -turnInput * 0.48;
      bankAngle.current = THREE.MathUtils.lerp(bankAngle.current, targetBank, dt * 4.5);
      planeRot.current.z = bankAngle.current;

      // Pitch attitude controls:
      // FIX FOR USER QUERY 7 ("תמיד גם אם אני מעלה את המטוס למעלה אז הוא חוזר שוב קצת למטה"):
      // Pulling stick UP (pitchInput > 0) pitches plane UP.
      // We clamp pitch and allow smooth attitude holding without snapping down!
      if (Math.abs(pitchInput) > 0.02) {
        planeRot.current.x = THREE.MathUtils.lerp(planeRot.current.x, pitchInput * 0.48, dt * 3.8);
      }
      // When the stick is released, preserve the current pitch attitude.
      // This prevents automatic nose-down trimming while the player is climbing.

      // Direct 3D flight vector aligned with heading and pitch
      const heading = planeRot.current.y;
      const pitch = planeRot.current.x;
      const forwardDir = new THREE.Vector3(
        -Math.sin(heading) * Math.cos(pitch),
        Math.sin(pitch),
        -Math.cos(heading) * Math.cos(pitch)
      ).normalize();

      planePos.current.x += forwardDir.x * currentSpeed.current * dt;
      planePos.current.y += forwardDir.y * currentSpeed.current * dt;
      planePos.current.z += forwardDir.z * currentSpeed.current * dt;

      // Minimum ground altitude; high-altitude flight is intentionally unrestricted up to the world safety limit.
      if (planePos.current.y <= 0.6) {
        planePos.current.y = 0.6;
        if (planeRot.current.x < 0) planeRot.current.x = 0;
      }
      if (planePos.current.y > 1000) {
        planePos.current.y = 1000;
        if (planeRot.current.x > 0) planeRot.current.x = 0;
      }

      sfx.updateEnginePitch(currentSpeed.current);

      // World Boundary (radius 360)
      if (Math.abs(planePos.current.x) > 360 || Math.abs(planePos.current.z) > 360) {
        const angleToCenter = Math.atan2(-planePos.current.x, -planePos.current.z);
        planeRot.current.y = THREE.MathUtils.lerp(planeRot.current.y, angleToCenter, dt * 0.9);
      }
    } else {
      // Parked on runway threshold facing forward (-Z)
      planePos.current.set(0, 0.6, 28);
      planeRot.current.set(0, 0, 0);
      sfx.updateEnginePitch(0.5);
    }

    // Direct synchronization of airplane mesh in scene graph
    if (airplaneRef.current) {
      airplaneRef.current.position.copy(planePos.current);
      airplaneRef.current.rotation.copy(planeRot.current);
    }
    if (propellerRef.current) {
      propellerRef.current.rotation.z = propAngle.current;
    }

    // Camera Management: Steady Chase Camera Aligned with Aircraft Flight Vector
    if (cameraMode === 'chase') {
      if (!isFlying) {
        // Steady fixed camera on the runway behind the aircraft - zero rotation or spinning!
        const idealCameraPos = new THREE.Vector3(0, 2.5, 36);
        camera.position.lerp(idealCameraPos, dt * 5);
        smoothLookAt.current.lerp(new THREE.Vector3(0, 1.2, 24), dt * 5);
        camera.lookAt(smoothLookAt.current);
      } else {
        const camBehind = 7.2;
        const camHeight = 1.85;
        const heading = planeRot.current.y;
        const pitch = planeRot.current.x;

        // Vector pointing backwards along aircraft axis
        const backDir = new THREE.Vector3(
          Math.sin(heading) * Math.cos(pitch),
          -Math.sin(pitch),
          Math.cos(heading) * Math.cos(pitch)
        );

        // Vector pointing upwards relative to aircraft axis
        const upDir = new THREE.Vector3(
          Math.sin(heading) * Math.sin(pitch),
          Math.cos(pitch),
          Math.cos(heading) * Math.sin(pitch)
        );

        const idealCameraPos = planePos.current
          .clone()
          .add(backDir.multiplyScalar(camBehind))
          .add(upDir.multiplyScalar(camHeight));

        camera.position.lerp(idealCameraPos, dt * 7);

        // Aim forward along flight axis straight through the crosshairs
        const forwardDir = new THREE.Vector3(
          -Math.sin(heading) * Math.cos(pitch),
          Math.sin(pitch),
          -Math.cos(heading) * Math.cos(pitch)
        ).normalize();
        const aimDist = 50;
        const lookAtPoint = planePos.current.clone().add(forwardDir.clone().multiplyScalar(aimDist));
        smoothLookAt.current.lerp(lookAtPoint, dt * 7);
        camera.lookAt(smoothLookAt.current);
      }
    } else if (cameraMode === 'cockpit') {
      const heading = planeRot.current.y;
      const pitch = planeRot.current.x;
      const eyePos = planePos.current.clone().add(new THREE.Vector3(0, 0.45, -0.2));
      camera.position.copy(eyePos);
      const forwardDir = new THREE.Vector3(
        -Math.sin(heading) * Math.cos(pitch),
        Math.sin(pitch),
        -Math.cos(heading) * Math.cos(pitch)
      );
      camera.lookAt(eyePos.clone().add(forwardDir.multiplyScalar(30)));
    }

    // High-Velocity Twin Autocannon Firing Loop
    const SHOT_INTERVAL = 85; // ~12 rounds/sec
    if (isShootingRef.current && isFlying && now - lastShotTime.current > SHOT_INTERVAL) {
      lastShotTime.current = now;
      sfx.playGunfire(); // Silent per user instruction

      const heading = planeRot.current.y;
      const pitch = planeRot.current.x;

      const fwd = new THREE.Vector3(
        -Math.sin(heading) * Math.cos(pitch),
        Math.sin(pitch),
        -Math.cos(heading) * Math.cos(pitch)
      ).normalize();

      const right = new THREE.Vector3(Math.cos(heading), 0, -Math.sin(heading)).normalize();
      const up = new THREE.Vector3().crossVectors(right, fwd).normalize();

      // Under-Wing Rifle / Machine Gun Mounts ("שיראה כאילו הם חוזרים מתחת למטוס")
      const cannonOffsetZ = -0.2;
      const cannonOffsetY = -0.22; // Under the aircraft belly
      const cannonOffsetX = 0.65;

      const baseMuzzle = planePos.current
        .clone()
        .add(fwd.clone().multiplyScalar(cannonOffsetZ))
        .add(up.clone().multiplyScalar(cannonOffsetY));

      const leftMuzzle = baseMuzzle.clone().add(right.clone().multiplyScalar(-cannonOffsetX));
      const rightMuzzle = baseMuzzle.clone().add(right.clone().multiplyScalar(cannonOffsetX));

      const bulletSpeed = 160; // Supersonic rifle velocity

      const spawnBullet = (muzzlePos: THREE.Vector3) => {
        const item = bulletsPool.current.find((b) => !b.active);
        if (!item) return;

        item.active = true;
        item.position.copy(muzzlePos);
        item.velocity.copy(fwd).multiplyScalar(bulletSpeed);
        item.rotation.set(pitch, heading, 0, 'YXZ');
        item.life = 0.95;
      };

      spawnBullet(leftMuzzle);
      spawnBullet(rightMuzzle);
    }

    // Update Bullets in Ref Pool (100% Direct Three.js updates, 0 React renders)
    bulletsPool.current.forEach((b, idx) => {
      const meshGroup = bulletGroupRefs.current[idx];
      if (!b.active) {
        if (meshGroup) meshGroup.visible = false;
        return;
      }

      b.life -= dt;
      if (b.life <= 0) {
        b.active = false;
        if (meshGroup) meshGroup.visible = false;
        return;
      }

      // Fly straight forward ahead of the plane towards target
      b.position.x += b.velocity.x * dt;
      b.position.y += b.velocity.y * dt;
      b.position.z += b.velocity.z * dt;

      let hit = false;
      for (const targetPlane of aiPlanesData.current) {
        if (!targetPlane.isCrashed && !targetPlane.isFalling && b.position.distanceTo(targetPlane.position) < 4.2) {
          targetPlane.isHit = true;
          targetPlane.isFalling = true;
          targetPlane.wobble = 4.0;

          // Momentum when hit: retain forward vector while beginning steep crash plunge
          const currentFlightHeading = Math.PI - targetPlane.angle;
          const forwardSpeed = 16.0;
          targetPlane.fallVelocity.set(
            -Math.sin(currentFlightHeading) * forwardSpeed,
            -3.5, // Initial downward plunge
            -Math.cos(currentFlightHeading) * forwardSpeed
          );

          // Violent death spiral tumble
          targetPlane.fallTumbleSpeed = {
            pitch: -2.6, // Plunge nose down towards the ground
            roll: (Math.random() > 0.5 ? 1 : -1) * 7.5, // Rapid uncontrolled spin
            yaw: (Math.random() - 0.5) * 2.2,
          };

          sfx.playPlaneHit();
          setScore((s) => s + 150);
          setAerialHits((h) => h + 1);
          spawnExplosion(b.position.clone());
          onTargetHit?.(`🔥 ${targetPlane.callsign} נפגע וצולל לקרקע! (+150)`);
          hit = true;
          break;
        }
      }

      // Ground impact
      if (!hit && b.position.y <= 0.1) {
        spawnExplosion(new THREE.Vector3(b.position.x, 0.1, b.position.z));
        hit = true;
      }

      if (hit) {
        b.active = false;
        if (meshGroup) meshGroup.visible = false;
        return;
      }

      if (meshGroup) {
        meshGroup.visible = true;
        meshGroup.position.copy(b.position);
        meshGroup.rotation.copy(b.rotation);
      }
    });

    // Update Explosions in Ref Pool
    explosionsPool.current.forEach((exp, idx) => {
      const expGroup = explosionGroupRefs.current[idx];
      if (!exp.active) {
        if (expGroup) expGroup.visible = false;
        return;
      }

      exp.progress += dt * 3.0;
      if (exp.progress >= 1) {
        exp.active = false;
        if (expGroup) expGroup.visible = false;
        return;
      }

      if (expGroup) {
        expGroup.visible = true;
        expGroup.position.copy(exp.position);
        const s = 1 + exp.progress * 2.8;
        expGroup.scale.set(s, s, s);
      }
    });
  });

  return (
    <>
      {/* Sky with Dramatic Sunlight (No cartoon clouds per user instruction) */}
      <Sky sunPosition={[80, 45, 90]} turbidity={3} rayleigh={0.8} />
      <fog attach="fog" args={['#93C5FD', 120, 900]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[60, 90, 50]} intensity={1.5} />
      <hemisphereLight groundColor="#166534" color="#E0F2FE" intensity={0.45} />

      {/* Multi-Tile Agricultural Terrain & Landscape */}
      <ExpansiveLandscapeTerrain />

      {/* Military Airfield Base */}
      <MilitaryAirfieldEnvironment />

      {/* Player's Animated Fighter Aircraft */}
      <DetailedAirplane
        ref={airplaneRef}
        propellerRef={propellerRef}
        color={planePaint.body}
        wingtipColor={planePaint.wing}
        isFlying={isFlying}
      />

      {/* AI Interceptor Enemy Planes in Sky (High-efficiency low-poly combat models) */}
      {aiPlanesData.current.map((targetPlane, idx) => (
        <group
          key={targetPlane.id}
          ref={(el) => {
            aiPlaneGroupRefs.current[idx] = el;
          }}
          position={targetPlane.position}
          rotation={targetPlane.rotation}
        >
          <AIAircraftModel
            color={targetPlane.color}
            wingtipColor={targetPlane.wingColor}
            propAngle={targetPlane.propAngle}
          />
          {/* Direct Three.js Fire & Smoke Plume when Falling */}
          <group
            ref={(el) => {
              aiSmokeRefs.current[idx] = el;
            }}
            visible={false}
            position={[0, 0, 1.4]}
          >
            {/* Fiery Core */}
            <mesh position={[0, 0, 0.3]}>
              <sphereGeometry args={[0.45, 6, 6]} />
              <meshBasicMaterial color="#EF4444" transparent opacity={0.9} />
            </mesh>
            {/* Billowing Black Smoke Clouds */}
            <mesh position={[0, 0.25, 1.2]}>
              <sphereGeometry args={[0.7, 6, 6]} />
              <meshBasicMaterial color="#1E293B" transparent opacity={0.8} />
            </mesh>
            <mesh position={[0, 0.5, 2.3]}>
              <sphereGeometry args={[0.95, 6, 6]} />
              <meshBasicMaterial color="#0F172A" transparent opacity={0.65} />
            </mesh>
          </group>
        </group>
      ))}

      {/* High-Velocity Supersonic Rifle Tracer Bullets (Direct Ref Pool) */}
      {Array.from({ length: MAX_BULLETS }).map((_, idx) => (
        <group
          key={idx}
          ref={(el) => {
            bulletGroupRefs.current[idx] = el;
          }}
          visible={false}
        >
          {/* Slender rifle bullet slug (copper/white core) */}
          <mesh position={[0, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.9, 6]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          {/* High-velocity aerodynamic tracer tail behind the bullet */}
          <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.038, 0.012, 1.4, 6]} />
            <meshBasicMaterial color="#F97316" transparent opacity={0.85} />
          </mesh>
          {/* Pointed aerodynamic spitzer bullet tip */}
          <mesh position={[0, 0, -0.95]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.024, 0.2, 6]} />
            <meshBasicMaterial color="#FEF08A" />
          </mesh>
        </group>
      ))}

      {/* Explosions & Shockwaves (Direct Ref Pool) */}
      {Array.from({ length: MAX_EXPLOSIONS }).map((_, idx) => (
        <group
          key={idx}
          ref={(el) => {
            explosionGroupRefs.current[idx] = el;
          }}
          visible={false}
        >
          {/* Expanding Fireball Core */}
          <mesh>
            <sphereGeometry args={[0.6, 12, 12]} />
            <meshBasicMaterial color="#F97316" transparent opacity={0.85} />
          </mesh>
          {/* Expanding Shockwave Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.9, 16]} />
            <meshBasicMaterial color="#F59E0B" transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {cameraMode === 'free' && <OrbitControls enablePan={true} enableZoom={true} />}
    </>
  );
}

// ==========================================
// Main Application Component
// AAA Flight Combat Avionics & Styling
// ==========================================
export default function App() {
  const [isSplashScreenOpen, setIsSplashScreenOpen] = useState(true);
  const [isFlying, setIsFlying] = useState(false);
  const [isEntryScreenOpen, setIsEntryScreenOpen] = useState(true);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  // Touch-drag steering: drag across the flight view to steer the 2D aircraft image.
  const screenDragPointerId = useRef<number | null>(null);
  const screenDragOrigin = useRef({ x: 0, y: 0 });
  const handleFlightDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (isEntryScreenOpen || target.closest('[data-no-fullscreen],button,[role="button"]')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    screenDragPointerId.current = e.pointerId;
    screenDragOrigin.current = { x: e.clientX, y: e.clientY };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    if (!isFlying) {
      setIsFlying(true);
      setIsEntryScreenOpen(false);
      sfx.startEngine();
    }
  };
  const handleFlightDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (screenDragPointerId.current !== e.pointerId || isEntryScreenOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - screenDragOrigin.current.x;
    const dy = e.clientY - screenDragOrigin.current.y;
    // A small finger movement gives a clear, bounded steering input.
    turnInputRef.current = Math.max(-1, Math.min(1, dx / Math.max(80, rect.width * 0.22)));
    pitchInputRef.current = Math.max(-1, Math.min(1, -dy / Math.max(80, rect.height * 0.22)));
  };
  const handleFlightDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (screenDragPointerId.current !== e.pointerId) return;
    screenDragPointerId.current = null;
    turnInputRef.current = 0;
    pitchInputRef.current = 0;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  };
  const [activePlaneId, setActivePlaneId] = useState(0);
  const handlePlaneSelected = React.useCallback((planeId: number) => setActivePlaneId(planeId), []);
  const planePaint = [
    { body: '#B91C1C', wing: '#7F1D1D' },
    { body: '#64748B', wing: '#334155' },
    { body: '#0F172A', wing: '#38BDF8' },
    { body: '#D6D3D1', wing: '#78716C' },
    { body: '#78716C', wing: '#44403C' },
    { body: '#475569', wing: '#0F172A' },
  ][Math.max(0, Math.min(5, activePlaneId))];
  const [cameraMode] = useState<'chase' | 'cockpit' | 'free'>('chase');
  const turnInputRef = useRef(0);
  const pitchInputRef = useRef(0);
  const isShootingRef = useRef(false);
  const [score, setScore] = useState(0);
  const [aerialHits, setAerialHits] = useState(0);
  const [coins, setCoins] = useState(() => {
    try {
      const saved = localStorage.getItem('unlimited-aircraft-coins');
      return saved === null ? 10500 : Math.max(0, Number(saved) || 0);
    } catch { return 10500; }
  });

  useEffect(() => {
    try { localStorage.setItem('unlimited-aircraft-coins', String(coins)); } catch { /* local storage unavailable */ }
  }, [coins]);
  const [hitToast, setHitToast] = useState<{ id: number; text: string } | null>(null);

  // Fullscreen hook with double-tap gesture support
  useFullscreen();

  // Diagnostics Modal State
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [selfHealTrigger, setSelfHealTrigger] = useState(0);

  const handleForceSelfHeal = () => {
    turnInputRef.current = 0;
    pitchInputRef.current = 0;
    isShootingRef.current = false;
    setSelfHealTrigger((prev) => prev + 1);
    sfx.resumeSafely();
  };

  // Takeoff sequence
  const handleTakeoff = () => {
    setIsFlying(true);
    setIsEntryScreenOpen(false);
    sfx.startEngine();
  };

  // Target Hit Toast Trigger
  const handleTargetHit = (text: string) => {
    setHitToast({ id: Date.now(), text });
    setTimeout(() => {
      setHitToast((curr) => (curr && Date.now() - curr.id > 1400 ? null : curr));
    }, 1500);
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isGameMenuOpen) setIsGameMenuOpen(false);
        else if (isFlying && !isEntryScreenOpen) setIsGameMenuOpen(true);
        else setIsEntryScreenOpen((prev) => !prev);
      }
      if (e.key === 'd' || e.key === 'D') {
        setIsDiagnosticsOpen((prev) => !prev);
      }
      if (e.key === 'r' || e.key === 'R') {
        handleForceSelfHeal();
      }

      if (isEntryScreenOpen && (e.code === 'Space' || e.code === 'Enter')) {
        handleTakeoff();
        return;
      }

      const flightKeys = [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'a',
        'd',
        'w',
        's',
        'A',
        'D',
        'W',
        'S',
        ' ',
      ];
      if (flightKeys.includes(e.key) || e.code === 'Space') {
        if (!isFlying) {
          handleTakeoff();
        }
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') turnInputRef.current = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') turnInputRef.current = 1;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') pitchInputRef.current = 1;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') pitchInputRef.current = -1;
      if (e.code === 'Space') isShootingRef.current = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        ['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key) &&
        (turnInputRef.current === -1 || turnInputRef.current === 1)
      ) {
        turnInputRef.current = 0;
      }
      if (
        ['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S'].includes(e.key) &&
        (pitchInputRef.current === -1 || pitchInputRef.current === 1)
      ) {
        pitchInputRef.current = 0;
      }
      if (e.code === 'Space') {
        isShootingRef.current = false;
      }
    };

    const handleBlur = () => {
      turnInputRef.current = 0;
      pitchInputRef.current = 0;
      isShootingRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isFlying, isEntryScreenOpen, isGameMenuOpen]);

  return (
    <div
      className="h-screen h-[100dvh] w-full relative bg-slate-950 overflow-hidden select-none font-sans"
      onPointerDownCapture={handleFlightDragStart}
      onPointerMoveCapture={handleFlightDragMove}
      onPointerUpCapture={handleFlightDragEnd}
      onPointerCancelCapture={handleFlightDragEnd}
      style={{ touchAction: 'none' }}
    >
      {/* 3D Canvas Viewport - High-Performance 60FPS Mobile Optimized */}
      <FlightErrorBoundary>
        <Canvas
          dpr={[1, 1]}
          gl={{
            antialias: false,
            powerPreference: 'high-performance',
            depth: true,
            stencil: false,
          }}
          camera={{ position: [0, 2.5, 36], fov: 55, far: 650 }}
        >
          <FlightScene
            isFlying={isFlying}
            turnInputRef={turnInputRef}
            pitchInputRef={pitchInputRef}
            isShootingRef={isShootingRef}
            cameraMode={cameraMode}
            planePaint={planePaint}
            setScore={setScore}
            setAerialHits={setAerialHits}
            onTargetHit={handleTargetHit}
            selfHealTrigger={selfHealTrigger}
          />
        </Canvas>
      </FlightErrorBoundary>

      {/* Central Combat Collimated Gunsight Reticle (High-Tech Fighter HUD) */}
      {isFlying && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Outer Mil-Spec Targeting Ring with Range Ticks */}
            <div className="w-16 h-16 rounded-full border border-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.5)] flex items-center justify-center">
              {/* Inner Focus Range Ring */}
              <div className="w-8 h-8 rounded-full border border-emerald-400/50" />
            </div>

            {/* Precision Center Aim Dot */}
            <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#34D399]" />

            {/* 4 Directional Collimated Ticks */}
            <div className="absolute -top-1 w-0.5 h-3 bg-emerald-400" />
            <div className="absolute -bottom-1 w-0.5 h-3 bg-emerald-400" />
            <div className="absolute -left-1 w-3 h-0.5 bg-emerald-400" />
            <div className="absolute -right-1 w-3 h-0.5 bg-emerald-400" />

            {/* Pitch Ladder Horizon Reference Wings */}
            <div className="absolute -left-12 w-6 h-0.5 bg-emerald-400/60" />
            <div className="absolute -right-12 w-6 h-0.5 bg-emerald-400/60" />
          </div>
        </div>
      )}

      {/* Target Hit Confirmation Toast (Subtle AAA Combat Feedback) */}
      {hitToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-30 transition-all duration-300">
          <div className="px-4 py-1 bg-slate-900/90 border border-emerald-500/80 text-emerald-400 font-tactical font-bold text-xs sm:text-sm tracking-widest shadow-[0_0_16px_rgba(52,211,153,0.4)] backdrop-blur-md rounded">
            {hitToast.text}
          </div>
        </div>
      )}

      {/* In-Flight Mobile App Top Bar (Active when in flight) */}
      {!isEntryScreenOpen && (
        <>
          {/* Top Left: currency badge matching the entry-screen balance; no kill means 0 earned coins */}
          <div className="absolute top-3 left-3 pointer-events-none z-20 rounded-xl border border-amber-300/50 bg-black/60 px-3 py-2 text-left shadow-md backdrop-blur-md">
            <div className="text-[10px] text-amber-100">יתרת מטבעות</div>
            <div className="font-black text-amber-300">◈ {(aerialHits > 0 ? coins : 0).toLocaleString('he-IL')}</div>
          </div>

          {/* Top Center: score and kills */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex max-w-[58vw] items-center gap-2 sm:gap-3 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-slate-700 text-[10px] sm:text-xs font-mono shadow-md whitespace-nowrap">
            <div className="flex items-center gap-1 text-amber-400">
              <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{score.toLocaleString()}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1 text-rose-400">
              <Crosshair className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{aerialHits} הפלות</span>
            </div>
          </div>

          {/* Top Right: Tactical radar and a consistent three-dot game menu */}
          <TacticalRadar />
          <button
            type="button"
            data-no-fullscreen="true"
            aria-label="פתיחת תפריט המשחק"
            title="תפריט המשחק"
            onClick={() => setIsGameMenuOpen(true)}
            className="absolute top-3 right-[4.25rem] z-30 flex h-12 w-10 items-center justify-center rounded-xl border border-slate-500/60 bg-slate-950/90 text-slate-100 shadow-lg backdrop-blur-md transition active:scale-95 hover:border-emerald-400 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <MoreVertical className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Discreet Combat Telemetry Readouts (Side Avionic Tape) */}
      {isFlying && (
        <div className="absolute bottom-24 left-6 pointer-events-none z-10 hidden sm:flex flex-col gap-1 font-tactical text-xs text-emerald-400/80 tracking-wider">
          <div className="flex items-center gap-2 bg-slate-950/60 px-2 py-0.5 rounded border border-emerald-500/30 backdrop-blur-sm">
            <span className="text-emerald-500/60 font-semibold">SPD</span>
            <span className="tabular-nums font-bold text-white">240 KTS</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/60 px-2 py-0.5 rounded border border-emerald-500/30 backdrop-blur-sm">
            <span className="text-emerald-500/60 font-semibold">TGT</span>
            <span className="tabular-nums font-bold text-white">{aerialHits} HITS</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/60 px-2 py-0.5 rounded border border-emerald-500/30 backdrop-blur-sm">
            <span className="text-emerald-500/60 font-semibold">PTS</span>
            <span className="tabular-nums font-bold text-white">{score}</span>
          </div>
        </div>
      )}

      {/* Bottom Controls: Virtual Joystick + Weapons Trigger (Active only during flight/gameplay) */}
      {!isEntryScreenOpen && (
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none z-20">
          {/* Left: Virtual Joystick ("רק הדבר הכחול שמוזיזים אותו") */}
          <div className="pointer-events-auto" data-no-fullscreen="true">
            <VirtualJoystick
              onMove={(turn, pitch) => {
                turnInputRef.current = turn;
                pitchInputRef.current = pitch;
                if (!isFlying) {
                  // Moving stick automatically initiates takeoff!
                  handleTakeoff();
                }
              }}
              onEnd={() => {
                turnInputRef.current = 0;
                pitchInputRef.current = 0;
              }}
            />
          </div>

          {/* Right: Weapons Fire Button ("כפתור היריות יהיה יותר קטן ושלא יתחלף לו הצבע") */}
          <div className="pointer-events-auto flex flex-col items-center" data-no-fullscreen="true">
            <button
              data-no-fullscreen="true"
              onPointerDown={(e) => {
                e.preventDefault();
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {}
                if (!isFlying) handleTakeoff();
                isShootingRef.current = true;
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                try {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {}
                isShootingRef.current = false;
              }}
              onPointerCancel={() => {
                isShootingRef.current = false;
              }}
              aria-label="Fire Cannons"
              className="w-13 h-13 md:w-14 md:h-14 rounded-full flex items-center justify-center select-none transition-transform active:scale-95 text-white"
              style={{
                touchAction: 'none',
                backgroundColor: '#DC2626',
                border: '2px solid rgba(254, 202, 202, 0.85)',
                boxShadow:
                  '0 0 20px rgba(220, 38, 38, 0.65), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.5)',
              }}
            >
              <div className="relative flex items-center justify-center pointer-events-none">
                <Crosshair className="w-6 h-6 text-white stroke-[2.2]" />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#FFFFFF]" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Responsive in-game pause / exit menu */}
      {isGameMenuOpen && !isEntryScreenOpen && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-menu-title"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-emerald-400/40 bg-slate-950/95 p-5 text-right text-slate-100 shadow-[0_0_45px_rgba(16,185,129,0.18)] sm:p-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-sky-400 via-emerald-400 to-amber-300" />
            <button
              type="button"
              data-no-fullscreen="true"
              aria-label="סגירת התפריט"
              onClick={() => setIsGameMenuOpen(false)}
              className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 transition hover:bg-slate-800 hover:text-white active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-5 flex flex-col items-center pt-3">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.12)]">
                <MoreVertical className="h-7 w-7" />
              </div>
              <h2 id="game-menu-title" className="text-xl font-black tracking-wide sm:text-2xl">תפריט המשחק</h2>
              <p className="mt-1 text-sm text-slate-400">הטיסה מושהית בזמן שהתפריט פתוח</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                data-no-fullscreen="true"
                onClick={() => setIsGameMenuOpen(false)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-3 font-bold text-emerald-200 transition hover:bg-emerald-500/25 active:scale-[0.98]"
              >
                <Play className="h-5 w-5" />
                חזרה למשחק
              </button>
              <button
                type="button"
                data-no-fullscreen="true"
                onClick={() => {
                  setIsGameMenuOpen(false);
                  setIsFlying(false);
                  setIsEntryScreenOpen(true);
                  turnInputRef.current = 0;
                  pitchInputRef.current = 0;
                  isShootingRef.current = false;
                  screenDragPointerId.current = null;
                }}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/10 px-4 py-3 font-bold text-sky-200 transition hover:bg-sky-500/20 active:scale-[0.98]"
              >
                <Home className="h-5 w-5" />
                יציאה למסך הראשי
              </button>
              <button
                type="button"
                data-no-fullscreen="true"
                onClick={() => {
                  setIsGameMenuOpen(false);
                  setIsFlying(false);
                  setIsEntryScreenOpen(true);
                  turnInputRef.current = 0;
                  pitchInputRef.current = 0;
                  isShootingRef.current = false;
                  screenDragPointerId.current = null;
                }}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-400/35 bg-rose-500/10 px-4 py-2.5 font-semibold text-rose-200 transition hover:border-rose-400/60 hover:bg-rose-500/20 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                יציאה מהמשחק
              </button>
            </div>
            <p className="mt-4 text-center text-xs leading-5 text-slate-500">המשחק פועל בתוך הדפדפן, לכן יציאה מחזירה למסך הראשי של המשחק במקום לסגור את אפליקציית הדפדפן.</p>
          </div>
        </div>
      )}

      {/* Modern App-Style Game Entry & Mission Briefing Screen */}
      <GameEntryScreen
        isOpen={isEntryScreenOpen}
        onPlaneSelected={handlePlaneSelected}
        onStartFlight={handleTakeoff}
        score={score}
        aerialHits={aerialHits}
        coins={coins}
        onCoinsChange={setCoins}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      />

      {/* Opening Splash / Loading Screen (Shown BEFORE Game Entry Screen) */}
      {isSplashScreenOpen && (
        <GameSplashScreen onFinish={() => setIsSplashScreenOpen(false)} />
      )}

      {/* Auto-Diagnostics & Detailed Error Report Modal */}
      <DiagnosticReportModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        onForceSelfHeal={handleForceSelfHeal}
      />
    </div>
  );
}
