import React, { useState, useRef } from 'react';
import { User } from 'lucide-react';


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
          <section aria-label="חנות מטוסים" className="absolute inset-0 overflow-hidden text-white bg-[#07111f]">
            {/* Real interface: all labels, aircraft choices, stats and actions are independent UI elements. */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(11,91,135,0.48),transparent_48%),linear-gradient(180deg,#07111f_0%,#0b1e31_48%,#07101c_100%)]" />
            <div className="absolute inset-0 opacity-[0.12] pointer-events-none" style={{backgroundImage:'linear-gradient(rgba(125,211,252,.45) 1px,transparent 1px),linear-gradient(90deg,rgba(125,211,252,.45) 1px,transparent 1px)',backgroundSize:'32px 32px'}} />
            <div className="absolute left-1/2 top-[12%] bottom-[21%] w-[34%] -translate-x-1/2 opacity-30 pointer-events-none" style={{background:'linear-gradient(90deg,transparent,rgba(148,163,184,.18),transparent)'}}>
              <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-slate-300/40" />
            </div>

            <header className="absolute z-10 top-0 left-0 right-0 px-4 pt-4 flex items-center justify-between gap-2">
              <button type="button" onClick={() => setActiveTab('main')} aria-label="חזרה לתפריט" className="w-10 h-10 shrink-0 rounded-xl border border-cyan-300/25 bg-slate-900/75 flex items-center justify-center text-cyan-100 active:scale-95">
                <span className="text-xl leading-none">‹</span>
              </button>
              <div className="text-center min-w-0">
                <p className="text-[9px] tracking-[0.32em] text-cyan-300/75 font-bold">WINGS OF ISRAEL</p>
                <h2 className="text-lg sm:text-xl font-black tracking-wide">האנגר המטוסים</h2>
              </div>
              <div className="shrink-0 rounded-xl border border-amber-300/30 bg-slate-950/75 px-2.5 py-2 text-left">
                <div className="text-[9px] text-amber-200/70">יתרת מטבעות</div>
                <div className="text-xs font-black text-amber-300">◈ {coins.toLocaleString('he-IL')}</div>
              </div>
            </header>

            <div className="absolute top-[12%] left-4 right-4 flex justify-between items-center">
              <span className="text-[10px] tracking-widest text-cyan-100/65">AIRCRAFT SELECTION</span>
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold text-cyan-100">דרגה 12</span>
            </div>

            <div className="absolute top-[17%] left-0 right-0 h-[39%] flex flex-col items-center justify-center px-5">
              <div className="absolute inset-x-[12%] top-[10%] bottom-[3%] rounded-[50%] bg-cyan-400/[0.07] blur-2xl" />
              <div className="relative w-full h-[76%] flex items-center justify-center">
                <svg viewBox="0 0 360 300" role="img" aria-label={'איור מטוס '+planes[selectedPlane].name} className="h-full w-full max-w-[360px] drop-shadow-[0_12px_24px_rgba(34,211,238,0.22)]">
                  <defs>
                    <linearGradient id="jetMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#e2f3ff"/><stop offset="34%" stopColor="#729bb6"/><stop offset="56%" stopColor="#d7e7f1"/><stop offset="100%" stopColor="#304d65"/></linearGradient>
                    <linearGradient id="jetWing" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0%" stopColor="#b8d3e4"/><stop offset="100%" stopColor="#3a5e78"/></linearGradient>
                    <filter id="jetGlow"><feGaussianBlur stdDeviation="5"/></filter>
                  </defs>
                  <ellipse cx="180" cy="154" rx="112" ry="86" fill="#22d3ee" opacity=".10" filter="url(#jetGlow)"/>
                  <g transform="translate(180 148)">
                    <path d="M0 -132 L12 -96 L19 -43 L128 34 L131 48 L20 16 L13 75 L42 104 L42 116 L0 101 L-42 116 L-42 104 L-13 75 L-20 16 L-131 48 L-128 34 L-19 -43 L-12 -96 Z" fill="url(#jetWing)" stroke="#d7efff" strokeWidth="1.4"/>
                    <path d="M0 -132 L5 -88 L7 -10 L6 80 L0 101 L-6 80 L-7 -10 L-5 -88 Z" fill="url(#jetMetal)" stroke="#f0f9ff" strokeWidth="1"/>
                    <path d="M-5 -62 L0 -79 L5 -62 L4 -34 L-4 -34 Z" fill="#163c56"/>
                    <path d="M-4 -27 L4 -27 L6 47 L0 69 L-6 47 Z" fill="#8eb7ce" opacity=".8"/>
                    <path d="M-19 -43 L-128 34 L-113 35 L-18 -4 Z" fill="#e8f6ff" opacity=".22"/>
                    <path d="M19 -43 L128 34 L113 35 L18 -4 Z" fill="#e8f6ff" opacity=".22"/>
                    <path d="M-10 78 L0 92 L10 78 L7 101 L0 107 L-7 101 Z" fill="#d9f3ff"/>
                    <path d="M-2 -104 L0 -116 L2 -104" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
                  </g>
                </svg>
              </div>
              <div className="relative text-center mt-1">
                <p className="text-[9px] tracking-[0.35em] text-cyan-300/70">SELECTED AIRCRAFT</p>
                <h3 className="text-xl sm:text-2xl font-black mt-1">{planes[selectedPlane].name}</h3>
                <p className="text-[10px] text-slate-300/70 mt-1">מטוס קרב • חיל האוויר הישראלי</p>
              </div>
            </div>

            <div className="absolute top-[56%] left-4 right-4 grid grid-cols-3 gap-2">
              {[
                {label:'מהירות',value:planes[selectedPlane].speed,icon:'↗'},
                {label:'תמרון',value:planes[selectedPlane].maneuver,icon:'⌁'},
                {label:'עוצמת אש',value:planes[selectedPlane].fire,icon:'◎'},
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-cyan-200/15 bg-slate-950/55 px-2 py-2.5">
                  <div className="flex items-center justify-between text-[10px] text-cyan-100/75"><span>{stat.label}</span><span>{stat.icon}</span></div>
                  <div className="mt-1 text-sm font-black">{stat.value}<span className="text-[9px] text-slate-400 font-normal"> / 100</span></div>
                  <div className="mt-2 h-1 rounded-full bg-slate-700 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-200" style={{width:stat.value+'%'}} /></div>
                </div>
              ))}
            </div>

            <div className="absolute top-[66%] left-4 right-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold">בחירת מטוס</h3>
                <span className="text-[9px] text-slate-400">גלול לבחירה נוספת</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2" style={{scrollbarWidth:'none',WebkitOverflowScrolling:'touch'}}>
                {planes.map((p, idx) => (
                  <button key={p.id} type="button" onClick={() => setSelectedPlane(idx)} aria-pressed={selectedPlane===idx}
                    className={'relative flex-shrink-0 w-[31%] min-w-[94px] rounded-xl border p-2 text-right transition active:scale-95 '+(selectedPlane===idx?'border-cyan-300 bg-cyan-300/15 shadow-[0_0_14px_rgba(34,211,238,.16)]':'border-slate-600/60 bg-slate-950/65')}>
                    {selectedPlane===idx && <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />}
                    <svg viewBox="0 0 80 48" aria-hidden="true" className="w-full h-9 mb-1">
                      <path d="M40 3 L45 18 L75 32 L75 36 L45 29 L43 40 L51 45 L51 47 L40 44 L29 47 L29 45 L37 40 L35 29 L5 36 L5 32 L35 18 Z" fill={selectedPlane===idx?'#a5f3fc':'#8ca8bc'} stroke="#d9f5ff" strokeWidth=".7"/>
                    </svg>
                    <div className="text-[10px] font-extrabold truncate">{p.name}</div>
                    <div className="text-[9px] mt-1 text-amber-300">{ownedPlanes.includes(idx)?'בבעלותך':p.price.toLocaleString('he-IL')+' ◈'}</div>
                  </button>
                ))}
              </div>
            </div>

            <footer className="absolute bottom-0 left-0 right-0 p-4 pt-3 bg-gradient-to-t from-[#050b14] via-[#07111f]/95 to-transparent">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-[9px] text-slate-400">{ownedPlanes.includes(selectedPlane)?'המטוס נמצא בהאנגר שלך':'מחיר המטוס'}</p>
                  <p className="text-lg font-black text-amber-300">{ownedPlanes.includes(selectedPlane)?'בבעלותך':'◈ '+planes[selectedPlane].price.toLocaleString('he-IL')}</p>
                </div>
                <button type="button" onClick={() => {
                    if (ownedPlanes.includes(selectedPlane)) {
                      setEquippedPlane(selectedPlane);
                      setActiveTab('main');
                      return;
                    }
                    const plane = planes[selectedPlane];
                    if (coins < plane.price) {
                      alert('אין מספיק מטבעות. חסרים '+(plane.price-coins).toLocaleString('he-IL')+' מטבעות.');
                      return;
                    }
                    onCoinsChange((value) => value-plane.price);
                    setOwnedPlanes((prev) => prev.includes(selectedPlane)?prev:[...prev,selectedPlane]);
                    setEquippedPlane(selectedPlane);
                  }}
                  className="flex-1 max-w-[65%] rounded-xl border border-cyan-200/60 bg-gradient-to-r from-cyan-500 to-sky-300 py-3 px-3 text-sm font-black text-slate-950 shadow-[0_5px_22px_rgba(34,211,238,.18)] active:scale-[.98]">
                  {ownedPlanes.includes(selectedPlane)?(equippedPlane===selectedPlane?'המטוס בשימוש':'בחר והפעל מטוס'):'רכישת מטוס'}
                </button>
              </div>
              <div className="flex justify-center gap-2 text-[8px] tracking-wider text-slate-500"><span>WINGS OF ISRAEL</span><span>•</span><span>FLIGHT SYSTEMS</span><span>•</span><span>v1.0</span></div>
            </footer>
          </section>
        )}

        {/* ==========================================
            3. UPGRADES WORKSHOP SCREEN (מרכז שדרוגים עם גלילה מלאה)
           ========================================== */}
        {activeTab === 'upgrades' && (
          <>
            <img
              src="/src/assets/images/wings_upgrades_exact_new_1791676639538.jpg"
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
