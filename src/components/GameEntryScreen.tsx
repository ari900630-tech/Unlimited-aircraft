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
          <section aria-label="חנות מטוסים" className="absolute inset-0 overflow-hidden bg-[#17283a]">
            {/* The exact shop artwork is stored in this repository, so it does not depend on a third-party image host. */}
            <img
              src={shopReferenceImage}
              alt="חנות המטוסים Wings of Israel"
              className="absolute inset-0 h-full w-full object-fill select-none pointer-events-none"
              draggable={false}
            />
            {/* Transparent hit areas preserve the reference artwork without adding visible UI on top of it. */}
            <button type="button" onClick={() => setActiveTab('main')} aria-label="חזור לתפריט"
              className="absolute z-20 border-0 bg-transparent active:bg-white/10"
              style={{left:'1%',top:'7%',width:'19%',height:'8%',touchAction:'manipulation'}} />
            <button type="button" onClick={() => setSelectedPlane((selectedPlane + planes.length - 1) % planes.length)} aria-label="המטוס הקודם"
              className="absolute z-20 border-0 bg-transparent active:bg-white/10"
              style={{left:'0%',bottom:'0%',width:'4%',height:'20%',touchAction:'manipulation'}} />
            <button type="button" onClick={() => setSelectedPlane((selectedPlane + 1) % planes.length)} aria-label="המטוס הבא"
              className="absolute z-20 border-0 bg-transparent active:bg-white/10"
              style={{right:'0%',bottom:'0%',width:'4%',height:'20%',touchAction:'manipulation'}} />
            {[
              {id:0,left:'3%',width:'25%'},
              {id:1,left:'29%',width:'25%'},
              {id:2,left:'55%',width:'25%'},
              {id:3,left:'80%',width:'20%'},
            ].map((card) => (
              <button key={card.id} type="button" onClick={() => setSelectedPlane(card.id)}
                aria-label={'בחר '+planes[card.id].name}
                className="absolute z-20 border-0 bg-transparent active:bg-white/10"
                style={{left:card.left,bottom:'1%',width:card.width,height:'19%',touchAction:'manipulation'}} />
            ))}
            <button type="button"
              onClick={() => {
                const plane = planes[selectedPlane];
                if (ownedPlanes.includes(selectedPlane)) {
                  setEquippedPlane(selectedPlane);
                  setActiveTab('main');
                  return;
                }
                if (coins < plane.price) {
                  alert('אין מספיק מטבעות. חסרים ' + (plane.price - coins).toLocaleString('he-IL') + ' מטבעות.');
                  return;
                }
                onCoinsChange((value) => value - plane.price);
                setOwnedPlanes((prev) => prev.includes(selectedPlane) ? prev : [...prev, selectedPlane]);
                setEquippedPlane(selectedPlane);
              }}
              aria-label={ownedPlanes.includes(selectedPlane) ? 'בחר והפעל מטוס' : 'רכישת מטוס'}
              className="absolute z-20 border-0 bg-transparent active:bg-white/10"
              style={{left:'29%',top:'70%',width:'42%',height:'11%',touchAction:'manipulation'}} />
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
