import React, { useState, useRef } from 'react';
import { User, ArrowRight } from 'lucide-react';

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
              src="/src/assets/images/wings_entry_runway_1791662090999.jpg"
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
          <section className="absolute inset-0 overflow-y-auto bg-[#070D19] text-white px-4 pt-5 pb-4 sm:px-8" aria-label="חנות מטוסים">
            <div className="absolute inset-0 pointer-events-none opacity-40" style={{backgroundImage:'radial-gradient(ellipse at 50% 20%, rgba(8,145,178,.24), transparent 55%), linear-gradient(145deg, transparent 55%, rgba(30,64,175,.12))'}} />
            <div className="relative z-10 mx-auto w-full max-w-3xl">
              <header className="flex items-center justify-between gap-3 mb-5">
                <button onClick={() => setActiveTab('main')} aria-label="חזרה לתפריט" className="rounded-xl border border-cyan-400/40 bg-slate-900 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-950 active:scale-95">← חזרה</button>
                <div className="text-right"><div className="text-[11px] tracking-[.25em] text-cyan-300">AIRCRAFT COMMAND</div><h2 className="text-2xl font-black">חנות המטוסים</h2></div>
                <div className="rounded-xl border border-amber-400/40 bg-slate-900 px-3 py-2 text-right"><div className="text-[10px] text-amber-300">יתרת מטבעות</div><div className="font-black text-amber-200">₪ {coins.toLocaleString()}</div></div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-[1.15fr_.85fr] gap-4">
                <div className="min-w-0 rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-4 shadow-[0_0_35px_rgba(8,145,178,.08)]">
                  <div className="flex items-center justify-between"><span className="text-xs tracking-widest text-cyan-300">AIRCRAFT PREVIEW</span><span className="rounded-full border border-emerald-400/40 px-2 py-1 text-[10px] text-emerald-300">{ownedPlanes.includes(selectedPlane) ? 'בבעלותך' : 'זמין לרכישה'}</span></div>
                  <div className="my-3 flex h-36 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-slate-800 to-slate-950">
                    <svg viewBox="0 0 420 180" className="h-full w-full max-w-lg" role="img" aria-label={'תצוגת מטוס ' + planes[selectedPlane].name}>
                      <defs><linearGradient id="planeMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={['#94A3B8','#60A5FA','#67E8F9','#D6D3D1','#A8A29E','#CBD5E1'][selectedPlane]}/><stop offset="100%" stopColor="#1E293B"/></linearGradient></defs>
                      <ellipse cx="210" cy="137" rx="135" ry="10" fill="#020617" opacity=".7"/>
                      <g transform="translate(210 88) rotate(-8)">
                        <path d="M-150 8 L-48 -7 L-17 -54 L8 -54 L1 -7 L111 -20 L153 -9 L111 3 L1 4 L14 48 L-8 48 L-48 4 Z" fill="url(#planeMetal)" stroke="#E2E8F0" strokeOpacity=".7" strokeWidth="2"/>
                        <path d="M-28 -7 L-5 -20 L33 -16 L47 -7 Z" fill="#38BDF8" opacity=".9"/>
                        <path d="M-135 8 L-80 0 L-70 7 Z" fill="#F8FAFC" opacity=".75"/>
                        <path d="M-5 4 L-32 29 L-17 31 L16 5 Z" fill="#475569"/>
                        <path d="M-5 -7 L-32 -29 L-17 -31 L16 -8 Z" fill="#64748B"/>
                      </g>
                      <text x="210" y="164" fill="#67E8F9" textAnchor="middle" fontSize="10" letterSpacing="3">3D AIRCRAFT DISPLAY</text>
                    </svg>
                  </div>
                  <div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black">{planes[selectedPlane].name}</h3><p className="mt-1 text-xs text-slate-400">מטוס #{String(selectedPlane + 1).padStart(2,'0')} · סימולטור טיסה</p></div><div className="text-left"><div className="text-xs text-slate-400">מחיר</div><div className="text-lg font-black text-amber-300">₪ {planes[selectedPlane].price.toLocaleString()}</div></div></div>
                  <div className="mt-4 space-y-3">
                    {([{label:'מהירות',value:planes[selectedPlane].speed},{label:'תמרון',value:planes[selectedPlane].maneuver},{label:'חימוש',value:planes[selectedPlane].fire}] as const).map(stat => <div key={stat.label}><div className="mb-1 flex justify-between text-xs"><span className="text-slate-300">{stat.label}</span><span className="font-mono text-cyan-200">{stat.value}/100</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-300" style={{width:stat.value+'%'}}/></div></div>)}
                  </div>
                  {ownedPlanes.includes(selectedPlane) ? (
                    <button onClick={() => { setEquippedPlane(selectedPlane); setActiveTab('main'); }} className={'mt-5 w-full rounded-xl border px-4 py-3 font-black transition active:scale-[.98] '+(equippedPlane===selectedPlane?'border-emerald-400/40 bg-emerald-500/15 text-emerald-200':'border-cyan-300 bg-cyan-400 text-slate-950 hover:bg-cyan-300')}>
                      {equippedPlane===selectedPlane ? '✓ המטוס הפעיל שלך' : 'בחר מטוס וחזור לתפריט'}
                    </button>
                  ) : (
                    <button onClick={() => { const plane=planes[selectedPlane]; if(coins<plane.price){alert('אין מספיק מטבעות. נדרשים עוד ₪ '+(plane.price-coins).toLocaleString());return;} setCoins(value=>value-plane.price); setOwnedPlanes(prev=>prev.includes(selectedPlane)?prev:[...prev,selectedPlane]); setEquippedPlane(selectedPlane); }} className="mt-5 w-full rounded-xl border border-cyan-300 bg-cyan-400 px-4 py-3 font-black text-slate-950 hover:bg-cyan-300 active:scale-[.98]">רכישה והפעלה · ₪ {planes[selectedPlane].price.toLocaleString()}</button>
                  )}
                  {equippedPlane===selectedPlane && <p className="mt-2 text-center text-xs text-emerald-300">המטוס הזה יופיע בטיסה הבאה שלך.</p>}
                </div>

                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between"><h3 className="font-bold">צי המטוסים</h3><span className="text-xs text-slate-400">{ownedPlanes.length} / {planes.length} בבעלות</span></div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                    {planes.map((p,idx) => {
                      const isOwned=ownedPlanes.includes(idx), isSelected=selectedPlane===idx, isEquipped=equippedPlane===idx;
                      return <button type="button" key={p.id} onClick={()=>setSelectedPlane(idx)} className={'w-full rounded-xl border p-3 text-right transition active:scale-[.98] '+(isSelected?'border-cyan-300 bg-cyan-950/80 shadow-[0_0_18px_rgba(34,211,238,.12)]':'border-slate-700 bg-slate-900/80 hover:border-slate-500')}>
                        <div className="flex items-center justify-between gap-2"><span className="font-bold text-sm">{p.name}</span>{isEquipped?<span className="text-[10px] text-emerald-300">פעיל</span>:isOwned?<span className="text-[10px] text-cyan-300">בבעלות</span>:<span className="text-[10px] text-amber-300">לרכישה</span>}</div>
                        <div className="mt-2 flex items-center justify-between text-xs"><span className="text-slate-400">מהירות {p.speed}</span><span className={isOwned?'text-emerald-300':'text-amber-300'}>{isOwned?'נרכש':'₪ '+p.price.toLocaleString()}</span></div>
                      </button>;
                    })}
                  </div>
                  <div className="mt-3 rounded-xl border border-slate-700/80 bg-slate-900/60 p-3 text-xs leading-5 text-slate-400">הרכישות והמטבעות נשמרים במכשיר שלך. בחר מטוס בבעלותך כדי להפעיל אותו, או רכוש מטוס חדש אם יש מספיק מטבעות.</div>
                </div>
              </div>
            </div>
          </section>
        )}

          </>
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
