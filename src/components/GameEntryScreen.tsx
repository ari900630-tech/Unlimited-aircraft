import React, { useState, useRef } from 'react';
import { User } from 'lucide-react';
import shopReferenceImage from '../assets/images/wings_shop_exact_new_1791676618855.jpg';
import upgradesFallbackImage from '../assets/images/wings_upgrades_exact_new_1791676639538.jpg';


interface GameEntryScreenProps {
  isOpen: boolean;
  onStartFlight: () => void;
  score?: number;
  aerialHits?: number;
  onOpenDiagnostics?: () => void;
  onPlaneSelected?: (planeId: number) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  coins: number;
  onCoinsChange: React.Dispatch<React.SetStateAction<number>>;
}

export function GameEntryScreen({
  isOpen,
  onStartFlight,
  onOpenDiagnostics,
  onPlaneSelected,
  coins,
  onCoinsChange,
}: GameEntryScreenProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'shop' | 'upgrades' | 'profile'>('main');
  const [isPlayPressed, setIsPlayPressed] = useState(false);
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

  // Swipe gesture for the aircraft row at the bottom of the shop screen.
  const shopSwipeStart = useRef<{ x: number; y: number } | null>(null);
  const shopSwipeMoved = useRef(false);
  const handleShopPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientY >= rect.top + rect.height * 0.76) {
      shopSwipeStart.current = { x: event.clientX, y: event.clientY };
      shopSwipeMoved.current = false;
    } else {
      shopSwipeStart.current = null;
    }
  };
  const handleShopPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const start = shopSwipeStart.current;
    shopSwipeStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      shopSwipeMoved.current = true;
      setSelectedPlane((current) => (current + (dx < 0 ? 1 : planes.length - 1)) % planes.length);
      event.preventDefault();
      event.stopPropagation();
    }
  };

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
            2. AIRCRAFT SHOP SCREEN (חנות מטוסים מדויקת לתמונה)
           ========================================== */}
        {activeTab === 'shop' && (
          <section aria-label="חנות מטוסים" className="absolute inset-0 overflow-hidden bg-slate-950 text-white" onPointerDownCapture={handleShopPointerDown} onPointerUpCapture={handleShopPointerUp} onPointerCancelCapture={() => { shopSwipeStart.current = null; }}>
            {/* Temporary low-opacity calibration layer: keep until the real UI is visually checked against the reference. */}
            <img src={shopReferenceImage} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-fill opacity-[0.12] pointer-events-none select-none" draggable={false} />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b1a2a]/85 via-[#172b40]/75 to-[#02070e]/95" />
            <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-[4%] py-[3%] border-b border-cyan-200/20 bg-slate-950/65">
              <button type="button" onClick={() => setActiveTab('main')} aria-label="חזרה לתפריט" className="rounded-lg border border-white/25 bg-slate-800/80 px-3 py-2 text-sm font-bold active:scale-95">‹ חזרה</button>
              <div className="text-right">
                <div className="text-[clamp(15px,3.5vw,27px)] font-black tracking-wide text-white">WINGS <span className="text-cyan-300">OF ISRAEL</span></div>
                <div className="text-[clamp(10px,2vw,14px)] font-bold text-cyan-100/75">חנות מטוסים • בחר את המטוס שלך</div>
              </div>
              <div className="rounded-xl border border-amber-300/50 bg-black/60 px-3 py-2 text-left"><div className="text-[10px] text-amber-100">יתרת מטבעות</div><div className="font-black text-amber-300">◈ {coins.toLocaleString('he-IL')}</div></div>
            </header>
            <div className="absolute inset-x-[5%] top-[15%] bottom-[25%] z-[2] grid grid-cols-[1fr_1.1fr] gap-[3%]">
              <div className="flex flex-col justify-center gap-3 rounded-2xl border border-cyan-100/20 bg-slate-950/75 p-[5%] shadow-2xl backdrop-blur-sm">
                <div className="text-xs font-bold tracking-[0.2em] text-cyan-300">AIRCRAFT SPECIFICATIONS</div>
                <h2 className="text-[clamp(18px,4vw,34px)] font-black leading-tight">{planes[selectedPlane].name}</h2>
                <div className="text-xs text-slate-300">מטוס קרב • חיל האוויר הישראלי</div>
                {[
                  {label:'מהירות',value:planes[selectedPlane].speed},
                  {label:'יכולת תמרון',value:planes[selectedPlane].maneuver},
                  {label:'עוצמת אש',value:planes[selectedPlane].fire},
                ].map(stat => <div key={stat.label} className="space-y-1"><div className="flex justify-between text-xs"><span>{stat.label}</span><b>{stat.value}/100</b></div><div className="h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-200" style={{width:stat.value+'%'}} /></div></div>)}
                <div className="mt-1 border-t border-white/15 pt-3"><div className="text-xs text-slate-300">{ownedPlanes.includes(selectedPlane) ? 'המטוס בבעלותך' : 'מחיר המטוס'}</div><div className="text-[clamp(20px,4vw,32px)] font-black text-amber-300">{ownedPlanes.includes(selectedPlane) ? 'נרכש' : '◈ '+planes[selectedPlane].price.toLocaleString('he-IL')}</div></div>
                <button type="button" onClick={() => {
                  const plane=planes[selectedPlane];
                  if(ownedPlanes.includes(selectedPlane)){setEquippedPlane(selectedPlane);setActiveTab('main');return;}
                  if(coins<plane.price){alert('אין מספיק מטבעות. חסרים '+(plane.price-coins).toLocaleString('he-IL')+' מטבעות.');return;}
                  onCoinsChange(value=>value-plane.price);
                  setOwnedPlanes(prev=>prev.includes(selectedPlane)?prev:[...prev,selectedPlane]);
                  setEquippedPlane(selectedPlane);
                }} className="mt-1 rounded-xl border border-cyan-200/60 bg-gradient-to-b from-cyan-400 to-blue-600 px-3 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/50 transition active:scale-95">
                  {ownedPlanes.includes(selectedPlane) ? (equippedPlane===selectedPlane?'המטוס הפעיל שלך ✓':'בחר והפעל מטוס') : 'רכישת מטוס'}
                </button>
              </div>
              <div className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-sky-300/10 via-slate-800/35 to-transparent">
                <div className="absolute bottom-[8%] h-[28%] w-[120%] -rotate-6 border-t-2 border-cyan-200/30 bg-gradient-to-b from-slate-400/20 to-slate-950/70" />
                <div className="absolute top-[13%] right-[12%] text-right"><div className="text-xs font-bold tracking-[0.25em] text-white/55">IAF • ISRAEL</div><div className="text-2xl font-black text-white/80">0{selectedPlane+1}</div></div>
                <div className="relative z-[1] w-full px-[2%] text-center">
                  <svg viewBox="0 0 640 300" role="img" aria-label="איור מטוס קרב" className="w-full drop-shadow-[0_20px_18px_rgba(0,0,0,0.65)]">
                    <defs><linearGradient id="m346-body" x1="0" y1="0" x2="0.1" y2="1"><stop offset="0" stopColor="#f8fafc"/><stop offset=".48" stopColor="#aab8c7"/><stop offset="1" stopColor="#4a596b"/></linearGradient><linearGradient id="m346-wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e5edf4"/><stop offset="1" stopColor="#66788c"/></linearGradient></defs>
                    <g transform="translate(320 150) rotate(-4)">
                      <path d="M-278 20 L-72 -10 L-18 -26 L-4 -112 L26 -112 L47 -28 L235 -63 L270 -50 L112 8 L56 26 L-45 24 L-220 48 Z" fill="url(#m346-wing)" stroke="#f8fafc" strokeWidth="3"/>
                      <path d="M-40 -35 L-3 -130 L17 -136 L25 -36 L-4 45 L-26 48 Z" fill="#d9e2ec" stroke="#f8fafc" strokeWidth="2"/>
                      <path d="M-20 -115 L-4 -154 L10 -157 L20 -117 L9 -92 L-8 -92 Z" fill="#1f3448"/>
                      <path d="M-295 20 Q-150 -7 -24 -18 L210 -52 L273 -48 L215 -25 L38 17 L-20 39 L-242 58 Z" fill="url(#m346-body)" stroke="#f8fafc" strokeWidth="2"/>
                      <path d="M-160 3 L-42 -11 L14 -19 L0 8 L-151 32 Z" fill="#c62828"/>
                      <path d="M-50 -10 L-6 -22 L17 -17 L-10 3 L-60 12 Z" fill="#fff"/>
                      <path d="M-10 -18 L30 -24 L58 -24 L18 -7 L-12 1 Z" fill="#c62828"/>
                      <path d="M-24 -21 L-5 -70 L10 -73 L20 -23 Z" fill="#263c52" stroke="#dbeafe" strokeWidth="2"/>
                      <path d="M-7 -65 L7 -67 L12 -29 L-13 -26 Z" fill="#55b8df" opacity=".8"/>
                      <path d="M-254 42 L-210 34 L-223 49 Z" fill="#c62828"/><path d="M-242 41 L-224 38 L-230 45 Z" fill="#fff"/>
                      <circle cx="74" cy="-20" r="5" fill="#c62828"/><path d="M-85 25 L-60 21 L-71 30 Z" fill="#334155"/>
                    </g>
                  </svg>
                  <div className="mt-[-1%] text-xs font-black tracking-[0.25em] text-white/60">M-346 • לביא</div>
                </div>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 border-t border-cyan-200/25 bg-slate-950/90 px-[3%] pb-[3%] pt-[2%]">
              <div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold text-cyan-200">צי המטוסים</span><span className="text-[10px] text-slate-400">החלק כדי לראות עוד מטוסים ←</span></div>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{touchAction:'pan-x'}}>
                {planes.map((p,idx)=><button key={p.id} type="button" onClick={()=>setSelectedPlane(p.id)} className={'min-w-[24%] flex-1 rounded-xl border p-2 text-right transition active:scale-95 '+(selectedPlane===p.id?'border-cyan-300 bg-cyan-500/20 ring-1 ring-cyan-300/50':'border-white/15 bg-slate-800/80')} style={{touchAction:'manipulation'}}>
                  <div className="mb-1 flex items-center justify-between"><span className="text-[10px] text-slate-400">0{idx+1}</span><span className="text-[10px]">{ownedPlanes.includes(p.id)?'✓ בבעלות':'🔒'}</span></div>
                  <div className="text-[clamp(10px,2.5vw,14px)] font-black leading-tight">{p.name}</div><div className="mt-1 text-[10px] font-bold text-amber-300">{ownedPlanes.includes(p.id)?'נרכש':p.price.toLocaleString('he-IL')+' ◈'}</div>
                </button>)}
              </div>
            </div>
          </section>
        )}

        {/* ==========================================
            3. UPGRADES WORKSHOP SCREEN (מרכז שדרוגים עם גלילה מלאה)
           ========================================== */}
        {activeTab === 'upgrades' && (
          <>
            <img
              src="https://i.postimg.cc/52v5PThX/589ae43a-1f90-4f27-a1ac-fcc14f9525a4.jpg"
              onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = upgradesFallbackImage; }}
              alt="Upgrades Workshop"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
            />

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
                  onCoinsChange((c) => c - totalCost);
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
                  onCoinsChange((c) => c - cost);
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
                  onCoinsChange((c) => c - cost);
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
                  onCoinsChange((c) => c - cost);
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
                  onCoinsChange((c) => c - cost);
                  setUpgrades((prev) => ({ ...prev, armor: prev.armor + 1 }));
                }
              }}
              data-no-fullscreen="true"
              aria-label="שדרוג שריון מחוזק"
              className="absolute cursor-pointer rounded-xl select-none focus:outline-none hover:bg-cyan-400/20 active:scale-95 border-0 bg-transparent"
              style={{ left: '71%', top: '61%', width: '18%', height: '11%', touchAction: 'manipulation' }}
            />

            {/* Transparent aircraft selection hotspots: keep interaction without covering the reference artwork. */}
            {planes.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlane(idx)}
                aria-label={'בחר מטוס ' + p.name}
                data-no-fullscreen="true"
                className="absolute border-0 bg-transparent"
                style={{ left: (idx * 16.4 + 1) + '%', bottom: '0%', width: '16.4%', height: '18%', touchAction: 'manipulation' }}
              />
            ))}

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