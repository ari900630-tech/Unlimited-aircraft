import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { User, ArrowRight } from 'lucide-react';

function ShopAircraftModel({ paint }: { paint: string }) {
  return (
    <group rotation={[0.12, -0.25, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.34, 3.2, 12]} />
        <meshStandardMaterial color={paint} metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0, -1.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.22, 0.72, 12]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.3, -0.35]}>
        <sphereGeometry args={[0.3, 16, 10]} />
        <meshStandardMaterial color="#38BDF8" metalness={0.6} roughness={0.12} transparent opacity={0.78} />
      </mesh>
      <mesh position={[0, 0, 0.15]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.2, 2.9, 0.08]} />
        <meshStandardMaterial color={paint} metalness={0.6} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0, 1.18]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.15, 1.05, 0.07]} />
        <meshStandardMaterial color="#64748B" metalness={0.65} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.36, 1.05]}>
        <boxGeometry args={[0.09, 0.75, 0.12]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[-0.42, -0.16, 0.7]}>
        <boxGeometry args={[0.12, 0.3, 0.72]} />
        <meshStandardMaterial color="#1E293B" metalness={0.65} roughness={0.3} />
      </mesh>
      <mesh position={[0.42, -0.16, 0.7]}>
        <boxGeometry args={[0.12, 0.3, 0.72]} />
        <meshStandardMaterial color="#1E293B" metalness={0.65} roughness={0.3} />
      </mesh>
    </group>
  );
}

interface GameEntryScreenProps {
  isOpen: boolean;
  onStartFlight: () => void;
  score?: number;
  aerialHits?: number;
  onOpenDiagnostics?: () => void;
  onPlaneSelected?: (planeId: number) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function GameEntryScreen({
  isOpen,
  onStartFlight,
  onOpenDiagnostics,
  onPlaneSelected,
}: GameEntryScreenProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'shop' | 'upgrades' | 'profile'>('main');
  const [isPlayPressed, setIsPlayPressed] = useState(false);
  const [coins, setCoins] = useState(() => {
    try { const saved = localStorage.getItem('unlimited-aircraft-coins'); return saved === null ? 10500 : Math.max(0, Number(saved) || 0); } catch { return 10500; }
  });
  const [selectedPlane, setSelectedPlane] = useState(() => {
    try { return Math.max(0, Math.min(5, Number(localStorage.getItem('unlimited-aircraft-selected') || 0))); } catch { return 0; }
  });
  const [ownedPlanes, setOwnedPlanes] = useState<number[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem('unlimited-aircraft-owned') || '[0]'); return Array.isArray(saved) ? Array.from(new Set([0, ...saved.filter((n) => Number.isInteger(n) && n >= 0 && n <= 5)])) : [0]; } catch { return [0]; }
  });
  const [equippedPlane, setEquippedPlane] = useState(() => {
    try { return Math.max(0, Math.min(5, Number(localStorage.getItem('unlimited-aircraft-equipped') || 0))); } catch { return 0; }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('unlimited-aircraft-coins', String(coins));
      localStorage.setItem('unlimited-aircraft-selected', String(selectedPlane));
      localStorage.setItem('unlimited-aircraft-owned', JSON.stringify(ownedPlanes));
      localStorage.setItem('unlimited-aircraft-equipped', String(equippedPlane));
    } catch { /* Storage may be disabled; gameplay remains available for this session. */ }
  }, [coins, selectedPlane, ownedPlanes, equippedPlane]);

  React.useEffect(() => {
    onPlaneSelected?.(equippedPlane);
  }, [equippedPlane, onPlaneSelected]);

  // Carousel scrolling ref for dragging/swiping
  const carouselRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Upgrades levels for planes
  const [upgrades, setUpgrades] = useState({
    engine: 2,
    avionics: 1,
    weapons: 0,
    armor: 1,
  });

  if (!isOpen) return null;

  const handlePlayClick = () => {
    setIsPlayPressed(true);
    setTimeout(() => {
      setIsPlayPressed(false);
      onStartFlight();
    }, 140);
  };

  const planes = [
    { id: 0, name: 'M-346 לביא (אימון)', price: 25000, speed: 70, maneuver: 75, fire: 50 },
    { id: 1, name: 'F-16I ברק', price: 75000, speed: 88, maneuver: 85, fire: 80 },
    { id: 2, name: 'F-35I אדיר', price: 150000, speed: 95, maneuver: 92, fire: 95 },
    { id: 3, name: 'נשר', price: 10000, speed: 60, maneuver: 65, fire: 60 },
    { id: 4, name: 'פנטום F-4', price: 50000, speed: 80, maneuver: 70, fire: 85 },
    { id: 5, name: 'F-15 באז', price: 120000, speed: 92, maneuver: 90, fire: 90 },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (carouselRef.current?.offsetLeft || 0);
    scrollLeft.current = carouselRef.current?.scrollLeft || 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    carouselRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-45 flex items-center justify-center select-none overflow-hidden bg-slate-950 h-[100dvh] w-full"
    >
      <div className="relative min-w-full min-h-full aspect-[896/1200] flex items-center justify-center overflow-hidden bg-[#0A0D14]">
        
        {/* ==========================================
            1. MAIN MENU SCREEN
           ========================================== */}
        {activeTab === 'main' && (
          <>
            <img
              src={`${import.meta.env.BASE_URL}src/assets/images/wings_entry_runway_1791662090999.jpg`}
              alt="Wings of Israel Main Menu"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
            />

            {/* Main Play Button */}
            <button
              onClick={handlePlayClick}
              onPointerDown={() => setIsPlayPressed(true)}
              onPointerUp={() => setTimeout(() => setIsPlayPressed(false), 90)}
              onPointerCancel={() => setIsPlayPressed(false)}
              data-no-fullscreen="true"
              aria-label="שחק"
              className={`absolute cursor-pointer rounded-2xl select-none focus:outline-none transition-all duration-100 ease-out border-0 ${
                isPlayPressed ? 'scale-95 translate-y-1 bg-cyan-400/25 ring-2 ring-cyan-300/80' : 'scale-100 hover:bg-cyan-400/10'
              }`}
              style={{
                left: '50%',
                top: '89.6%',
                transform: `translate(-50%, -50%) ${isPlayPressed ? 'scale(0.95) translateY(3px)' : 'scale(1)'}`,
                width: '42.4%',
                height: '14.8%',
                touchAction: 'manipulation',
              }}
            />

            {/* Upgrades Button -> Opens Upgrades Workshop */}
            <button
              onClick={() => setActiveTab('upgrades')}
              data-no-fullscreen="true"
              aria-label="שדרוגים"
              className="absolute cursor-pointer rounded-2xl select-none focus:outline-none hover:bg-sky-400/10 active:scale-95 border-0"
              style={{ left: '17.3%', top: '89.6%', transform: 'translate(-50%, -50%)', width: '25.6%', height: '14.0%', touchAction: 'manipulation' }}
            />

            {/* Aircraft Store Button -> Opens Aircraft Store */}
            <button
              onClick={() => setActiveTab('shop')}
              data-no-fullscreen="true"
              aria-label="חנות מטוסים"
              className="absolute cursor-pointer rounded-2xl select-none focus:outline-none hover:bg-sky-400/10 active:scale-95 border-0"
              style={{ left: '82.7%', top: '89.6%', transform: 'translate(-50%, -50%)', width: '25.6%', height: '14.0%', touchAction: 'manipulation' }}
            />

            {/* Settings Button */}
            <button
              onClick={() => {
                if (onOpenDiagnostics) onOpenDiagnostics();
              }}
              data-no-fullscreen="true"
              aria-label="הגדרות"
              className="absolute cursor-pointer rounded-full select-none focus:outline-none hover:bg-cyan-400/15 active:scale-90 border-0"
              style={{ left: '8.7%', top: '13.8%', transform: 'translate(-50%, -50%)', width: '12%', aspectRatio: '1/1', touchAction: 'manipulation' }}
            />

            {/* Pilot Profile Button */}
            <button
              onClick={() => setActiveTab('profile')}
              data-no-fullscreen="true"
              aria-label="פרופיל טייס"
              className="absolute cursor-pointer rounded-full select-none focus:outline-none hover:bg-cyan-400/15 active:scale-90 border-0"
              style={{ left: '8.7%', top: '24.5%', transform: 'translate(-50%, -50%)', width: '12%', aspectRatio: '1/1', touchAction: 'manipulation' }}
            />
          </>
        )}

        {/* ==========================================
            2. AIRCRAFT SHOP SCREEN (חנות מטוסים עם גלילה מלאה)
           ========================================== */}
        {activeTab === 'shop' && (
          <section dir="rtl" className="absolute inset-0 overflow-hidden text-white" aria-label="חנות מטוסים">
            <img src={`${import.meta.env.BASE_URL}src/assets/images/wings_entry_runway_1791662090999.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-sky-950/25 to-slate-950/65" />
            <header className="absolute top-[1.5%] left-[3%] right-[3%] z-20 flex h-[9%] items-center justify-between gap-2 rounded-2xl border-2 border-slate-300/80 bg-slate-900/80 px-2 shadow-[inset_0_0_12px_rgba(255,255,255,.2),0_4px_12px_rgba(0,0,0,.65)]">
              <div className="flex shrink-0 flex-col items-start gap-1">
                <div className="rounded-lg border border-amber-300/60 bg-slate-950/80 px-2 py-1 text-xs font-black text-amber-200">★ רמה 12</div>
                <button onClick={() => setActiveTab('main')} aria-label="חזור לתפריט" className="rounded-lg border border-slate-300/70 bg-slate-800/95 px-2 py-1 text-xs font-black shadow-lg active:scale-95">↩ חזור</button>
              </div>
              <div className="min-w-0 flex-1 text-center">
                <div className="text-[9px] font-black tracking-[.16em] text-sky-100 sm:text-xs">✦ ═ WINGS OF ISRAEL ═ ✦</div>
                <div className="text-base font-black leading-tight drop-shadow-md sm:text-lg">חנויות מטוסים</div>
                <div className="text-[8px] font-bold tracking-[.2em] text-slate-300">ISRAEL AIR FORCE • FLIGHT SYSTEMS</div>
              </div>
              <div className="shrink-0 rounded-lg border border-amber-300/60 bg-slate-950/85 px-2 py-2 text-center shadow-inner"><div className="text-[9px] text-sky-100">מטבעות</div><div className="whitespace-nowrap text-xs font-black text-amber-300">🪙 {coins.toLocaleString()} ₪</div></div>
            </header>

            <div className="absolute left-[12%] right-[12%] top-[15%] bottom-[27%] z-10 overflow-hidden rounded-[28px] border-[5px] border-slate-300/80 bg-slate-800/65 shadow-[inset_0_0_22px_rgba(125,211,252,.25),0_10px_30px_rgba(0,0,0,.65)]">
              <div className="absolute left-[12%] right-[12%] top-[-2%] z-20 rounded-b-2xl border-x-4 border-b-4 border-slate-300/80 bg-gradient-to-b from-slate-600 to-slate-900 px-2 py-2 text-center text-xl font-black shadow-xl">חנות מטוסים</div>
              <div className="absolute inset-0 bg-gradient-to-b from-sky-200/10 via-slate-900/10 to-slate-950/75" />
              <div className="absolute left-2 right-2 top-[12%] h-[48%] overflow-hidden rounded-xl bg-gradient-to-b from-sky-300/20 to-slate-900/30">
                <Canvas camera={{ position: [4.2, 3.1, 5.2], fov: 42 }} dpr={[1, 1.5]}>
                  <ambientLight intensity={1.35} />
                  <directionalLight position={[4, 6, 3]} intensity={2.3} />
                  <pointLight position={[-4, 1, -3]} color="#7DD3FC" intensity={1.5} />
                  <mesh position={[0, -1.45, 0]} receiveShadow>
                    <cylinderGeometry args={[1.35, 1.5, 0.18, 48]} />
                    <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.22} />
                  </mesh>
                  <mesh position={[0, -1.32, 0]}>
                    <cylinderGeometry args={[1.12, 1.12, 0.08, 48]} />
                    <meshStandardMaterial color="#CBD5E1" metalness={0.95} roughness={0.18} />
                  </mesh>
                  <ShopAircraftModel paint={['#CBD5E1','#C49A64','#9CA3AF','#D6D3D1','#A8A29E','#CBD5E1'][selectedPlane]} />
                  <OrbitControls enablePan={false} enableZoom={true} minDistance={3.8} maxDistance={8} />
                </Canvas>
              </div>
              <div className="absolute left-3 right-3 top-[61%] flex items-center justify-between gap-2 border-b border-slate-300/30 pb-1">
                <div className="min-w-0"><div className="text-[9px] text-sky-200">דגם מטוס</div><h3 className="truncate text-sm font-black drop-shadow sm:text-lg">{planes[selectedPlane].name}</h3></div>
                <div className="shrink-0 text-left"><div className="text-[9px] text-slate-200">מחיר רכישה</div><div className="text-base font-black text-amber-300 sm:text-lg">₪ {planes[selectedPlane].price.toLocaleString()}</div></div>
              </div>
              <div className="absolute left-3 right-3 top-[68%] grid grid-cols-[1fr_1.05fr] gap-2">
                <p className="text-[9px] leading-4 text-slate-100/95 sm:text-xs">מטוס קרב ואימון מתקדם. מבנה אווירודינמי, ביצועים מאוזנים ויכולת תמרון למשימות אימון וטיסה.</p>
                <div className="space-y-2">
                  {([{label:'מהירות',value:planes[selectedPlane].speed,icon:'➤'},{label:'תמרון',value:planes[selectedPlane].maneuver,icon:'↻'},{label:'כוח אש',value:planes[selectedPlane].fire,icon:'✦'}] as const).map(stat => <div key={stat.label} className="flex items-center gap-1"><span className="w-[58px] shrink-0 text-[9px] font-bold text-slate-100 sm:text-xs">{stat.icon} {stat.label}</span><div className="h-2 flex-1 overflow-hidden rounded-sm border border-slate-300/60 bg-slate-950/80"><div className="h-full bg-gradient-to-r from-sky-300 via-cyan-200 to-slate-100 shadow-[0_0_8px_rgba(125,211,252,.7)]" style={{width:stat.value+'%'}} /></div></div>)}
                </div>
              </div>
            </div>

            <div className="absolute bottom-[17%] left-1/2 z-30 w-[62%] -translate-x-1/2">
              {ownedPlanes.includes(selectedPlane) ? (
                <button onClick={() => { setEquippedPlane(selectedPlane); setActiveTab('main'); }} className="w-full rounded-2xl border-[4px] border-slate-200 bg-gradient-to-b from-slate-500 via-slate-700 to-slate-900 px-3 py-3 text-lg font-black shadow-[0_5px_0_#111827,0_0_18px_rgba(125,211,252,.35)] active:translate-y-1">{equippedPlane===selectedPlane?'✓ המטוס הפעיל שלך':'בחר מטוס'}</button>
              ) : (
                <button onClick={() => { const plane=planes[selectedPlane]; if(coins<plane.price){alert('אין מספיק מטבעות. נדרשים עוד ₪ '+(plane.price-coins).toLocaleString());return;} setCoins(value=>value-plane.price); setOwnedPlanes(prev=>prev.includes(selectedPlane)?prev:[...prev,selectedPlane]); setEquippedPlane(selectedPlane); }} className="w-full rounded-2xl border-[4px] border-slate-200 bg-gradient-to-b from-slate-500 via-slate-700 to-slate-900 px-3 py-3 text-xl font-black text-white shadow-[0_5px_0_#111827,0_0_18px_rgba(125,211,252,.35)] active:translate-y-1">קנה · ₪ {planes[selectedPlane].price.toLocaleString()}</button>
              )}
            </div>

            <div className="absolute bottom-[2%] left-0 right-0 z-20 flex gap-2 overflow-x-auto px-3 pb-1 snap-x">
              {planes.map((p,idx) => {
                const isOwned=ownedPlanes.includes(idx), isSelected=selectedPlane===idx;
                return <button type="button" key={p.id} onClick={()=>setSelectedPlane(idx)} className={'relative min-w-[31%] flex-1 snap-center rounded-2xl border-[3px] p-2 text-center shadow-[0_5px_10px_rgba(0,0,0,.55)] transition active:scale-95 '+(isSelected?'border-sky-200 bg-gradient-to-b from-sky-900/95 to-slate-950 ring-2 ring-sky-300/60':'border-slate-400/80 bg-gradient-to-b from-slate-700/95 to-slate-950/95')}>
                  <div className="truncate text-xs font-black">{p.name}</div>
                  <div className="my-1 flex h-12 items-center justify-center"><div className="h-10 w-full opacity-90"><Canvas camera={{position:[4,3,5],fov:48}} dpr={[1,1]}><ambientLight intensity={1.4}/><directionalLight position={[4,5,3]} intensity={2}/><ShopAircraftModel paint={['#CBD5E1','#C49A64','#9CA3AF','#D6D3D1','#A8A29E','#CBD5E1'][idx]} /></Canvas></div></div>
                  <div className={'text-[10px] font-black '+(isOwned?'text-emerald-300':'text-slate-100')}>{isOwned?'נרכש':'₪ '+p.price.toLocaleString()}</div>
                  {isSelected && <div className="mt-1 text-[10px] font-black text-emerald-300">נבחר</div>}
                </button>;
              })}
            </div>
          </section>
        )}

        {/* ==========================================
            3. UPGRADES WORKSHOP SCREEN (מרכז שדרוגים עם גלילה מלאה)
           ========================================== */}
        {activeTab === 'upgrades' && (
          <>
            <img
              src="/src/assets/images/wings_upgrades_exact_1791662796095.jpg"
              alt="Upgrades Workshop"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
            />

            {/* Top Bar Coin Display */}
            <div className="absolute top-3 left-4 text-xs font-bold text-cyan-300 font-mono">רמה 12</div>
            <div className="absolute top-3 right-4 text-xs font-bold text-amber-400 font-mono">₪ {coins.toLocaleString()}</div>

            {/* Back Button */}
            <button
              onClick={() => setActiveTab('main')}
              data-no-fullscreen="true"
              aria-label="חזור"
              className="absolute cursor-pointer rounded-xl select-none focus:outline-none hover:bg-cyan-400/20 active:scale-95 border-0"
              style={{ left: '8.5%', top: '10.5%', width: '15%', height: '6.5%', touchAction: 'manipulation' }}
            />

            {/* Master Upgrade Button (שדרוג כללי) */}
            <button
              onClick={() => {
                const totalCost = 5000;
                if (coins >= totalCost) {
                  setCoins((c) => c - totalCost);
                  setUpgrades({ engine: 5, avionics: 4, weapons: 3, armor: 5 });
                } else {
                  alert('אין מספיק מטבעות לשדרוג כולל!');
                }
              }}
              data-no-fullscreen="true"
              aria-label="שדרוג כללי"
              className="absolute cursor-pointer rounded-2xl select-none focus:outline-none hover:brightness-110 active:scale-95 border-0 bg-transparent"
              style={{ left: '50%', top: '73.5%', transform: 'translate(-50%, -50%)', width: '52%', height: '7.8%', touchAction: 'manipulation' }}
            />

            {/* Individual Upgrade Hotspots */}
            <button
              onClick={() => {
                const cost = 5000;
                if (upgrades.engine < 5 && coins >= cost) {
                  setCoins((c) => c - cost);
                  setUpgrades((prev) => ({ ...prev, engine: prev.engine + 1 }));
                }
              }}
              data-no-fullscreen="true"
              aria-label="שדרוג מנוע סילון"
              className="absolute cursor-pointer rounded-xl select-none focus:outline-none hover:bg-cyan-400/20 active:scale-95 border-0 bg-transparent"
              style={{ left: '29%', top: '30%', width: '18%', height: '11%', touchAction: 'manipulation' }}
            />
            <button
              onClick={() => {
                const cost = 3500;
                if (upgrades.avionics < 4 && coins >= cost) {
                  setCoins((c) => c - cost);
                  setUpgrades((prev) => ({ ...prev, avionics: prev.avionics + 1 }));
                }
              }}
              data-no-fullscreen="true"
              aria-label="שדרוג מערכות אווירוניקה"
              className="absolute cursor-pointer rounded-xl select-none focus:outline-none hover:bg-cyan-400/20 active:scale-95 border-0 bg-transparent"
              style={{ left: '71%', top: '30%', width: '18%', height: '11%', touchAction: 'manipulation' }}
            />
            <button
              onClick={() => {
                const cost = 7500;
                if (upgrades.weapons < 3 && coins >= cost) {
                  setCoins((c) => c - cost);
                  setUpgrades((prev) => ({ ...prev, weapons: prev.weapons + 1 }));
                }
              }}
              data-no-fullscreen="true"
              aria-label="שדרוג חימוש משודרג"
              className="absolute cursor-pointer rounded-xl select-none focus:outline-none hover:bg-cyan-400/20 active:scale-95 border-0 bg-transparent"
              style={{ left: '29%', top: '61%', width: '18%', height: '11%', touchAction: 'manipulation' }}
            />
            <button
              onClick={() => {
                const cost = 4200;
                if (upgrades.armor < 5 && coins >= cost) {
                  setCoins((c) => c - cost);
                  setUpgrades((prev) => ({ ...prev, armor: prev.armor + 1 }));
                }
              }}
              data-no-fullscreen="true"
              aria-label="שדרוג שריון מחוזק"
              className="absolute cursor-pointer rounded-xl select-none focus:outline-none hover:bg-cyan-400/20 active:scale-95 border-0 bg-transparent"
              style={{ left: '71%', top: '61%', width: '18%', height: '11%', touchAction: 'manipulation' }}
            />

            {/* Scrollable Bottom Carousel for Upgrades Screen */}
            <div
              ref={carouselRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              data-no-fullscreen="true"
              className="absolute overflow-x-auto flex gap-3 px-4 no-scrollbar cursor-grab active:cursor-grabbing select-none"
              style={{
                left: '5%',
                right: '5%',
                top: '79.5%',
                height: '18%',
                alignItems: 'center',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {planes.map((p, idx) => {
                const isSelected = selectedPlane === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedPlane(idx)}
                    className={`flex-shrink-0 w-[24%] h-[90%] rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition ${
                      isSelected ? 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'border-slate-700/80 bg-slate-900/80 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-white truncate px-1">{p.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-cyan-300 font-mono mt-1">רמה 12</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ==========================================
            4. PILOT PROFILE MODAL
           ========================================== */}
        {activeTab === 'profile' && (
          <div
            data-no-fullscreen="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="relative w-full max-w-sm bg-slate-900/95 border border-cyan-500/50 rounded-2xl p-6 shadow-2xl text-white">
              <div className="flex flex-col items-center text-center pb-4 border-b border-slate-800">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] mb-3">
                  <User className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-cyan-300">טייס חיל האוויר</h3>
                <p className="text-xs text-cyan-400/80 font-mono">דרגה: אלוף הפלות (רמה 12)</p>
              </div>

              <div className="py-4 space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">מאזן מטבעות:</span>
                  <span className="font-bold text-amber-400">₪ {coins.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">גיחות קרב:</span>
                  <span className="font-bold text-white">48</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">דיוק פגיעות:</span>
                  <span className="font-bold text-emerald-400">89.4%</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('main')}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-md cursor-pointer"
              >
                חזור
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
