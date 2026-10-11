import React, { useState, useEffect } from 'react';
import shopExactImage from '../assets/images/wings_shop_exact_new_1791676618855.jpg';
import upgradesExactImage from '../assets/images/wings_upgrades_exact_new_1791676639538.jpg';
import mainRunwayImage from '../assets/images/wings_entry_runway_1791662090999.jpg';

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

interface PlaneData {
  id: number;
  name: string;
  fullName: string;
  role: string;
  price: number;
  speed: number;
  maneuver: number;
  firepower: number;
  description: string;
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
    try {
      return Math.max(0, Math.min(5, Number(localStorage.getItem('unlimited-aircraft-selected') || 0)));
    } catch {
      return 0;
    }
  });
  const [ownedPlanes, setOwnedPlanes] = useState<number[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('unlimited-aircraft-owned') || '[0]');
      return Array.isArray(saved)
        ? Array.from(new Set([0, ...saved.filter((n) => Number.isInteger(n) && n >= 0 && n <= 5)]))
        : [0];
    } catch {
      return [0];
    }
  });
  const [equippedPlane, setEquippedPlane] = useState(() => {
    try {
      return Math.max(0, Math.min(5, Number(localStorage.getItem('unlimited-aircraft-equipped') || 0)));
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('unlimited-aircraft-selected', String(selectedPlane));
      localStorage.setItem('unlimited-aircraft-owned', JSON.stringify(ownedPlanes));
      localStorage.setItem('unlimited-aircraft-equipped', String(equippedPlane));
    } catch {
      /* Storage fallback */
    }
  }, [coins, selectedPlane, ownedPlanes, equippedPlane]);

  useEffect(() => {
    onPlaneSelected?.(equippedPlane);
  }, [equippedPlane, onPlaneSelected]);

  // Upgrades levels for planes
  const [upgrades, setUpgrades] = useState({
    engine: 2,
    avionics: 1,
    weapons: 0,
    armor: 1,
  });

  const planes: PlaneData[] = [
    {
      id: 0,
      name: 'לביא M-346',
      fullName: 'דגם: לביא M-346 (אימון)',
      role: 'מטוס אימון מתקדם וקרב קל',
      price: 25000,
      speed: 72,
      maneuver: 78,
      firepower: 55,
      description:
        'דגם: לביא M-346 מטוס אימון סילוני מתקדם וקרב קל, מהירות תגובה גבוהה, כושר תמרון מעולה ומערכות אוויוניקה מתקדמות להכשרת טייסי קרב.',
    },
    {
      id: 1,
      name: 'ברק F-16I',
      fullName: 'דגם: ברק F-16I (סופה)',
      role: 'מטוס קרב רב-משימתי',
      price: 75000,
      speed: 88,
      maneuver: 85,
      firepower: 82,
      description:
        'דגם: ברק F-16I עמוד השדרה של חיל האוויר הישראלי, מצויד במכלי דלק תצורתיים, מערכות לוחמה אלקטרונית מתקדמות וחימוש מדויק לכל טווח.',
    },
    {
      id: 2,
      name: 'אדיר F-35I',
      fullName: 'דגם: אדיר F-35I (חמקן)',
      role: 'מטוס חמקן דור 5 מתקדם',
      price: 150000,
      speed: 96,
      maneuver: 92,
      firepower: 96,
      description:
        'דגם: אדיר F-35I פסגת הטכנולוגיה האווירית עם מעטפת חמקנות מהדור החמישי, היתוך חיישנים אוטונומי ומערכות שליטה ובקרה ישראליות ייחודיות.',
    },
    {
      id: 3,
      name: 'נשר',
      fullName: 'דגם: נשר (מיירט דלתא)',
      role: 'מיירט קרב מהיר בעל כנף דלתא',
      price: 10000,
      speed: 68,
      maneuver: 70,
      firepower: 65,
      description:
        'דגם: נשר מטוס הקרב המיתולוגי בעל כנף דלתא קלאסית, מהירות על-קולית כפולה ורקורד ניצחונות אוויריים מפואר בתולדות חיל האוויר.',
    },
    {
      id: 4,
      name: 'קורנס F-4',
      fullName: 'דגם: קורנס F-4 (פנטום)',
      role: 'מפציץ-קרב כבד אגדי',
      price: 50000,
      speed: 84,
      maneuver: 72,
      firepower: 90,
      description:
        'דגם: קורנס F-4 פנטום מפציץ-קרב כבד ואגדי, עוצמת מנועים כפולה, נשיאת חימוש אדירה וטווח מבצעי עצום למשימות תקיפה ויירוט עמוקות.',
    },
    {
      id: 5,
      name: 'בז F-15',
      fullName: 'דגם: בז F-15 (איגל)',
      role: 'מטוס עליונות אווירית ללא הפסדים',
      price: 120000,
      speed: 94,
      maneuver: 88,
      firepower: 92,
      description:
        'דגם: בז F-15 מלך העליונות האווירית עם יחס דחף-משקל מופלא, יכולת טיפוס פנומנלית ורקורד הפלות מושלם של 100% הצלחה בקרבות אוויר.',
    },
  ];

  if (!isOpen) return null;

  const handlePlayClick = () => {
    setIsPlayPressed(true);
    setTimeout(() => {
      setIsPlayPressed(false);
      onStartFlight();
    }, 120);
  };

  const currentPlane = planes[selectedPlane] || planes[0];
  const isSelectedOwned = ownedPlanes.includes(selectedPlane);
  const isSelectedEquipped = equippedPlane === selectedPlane;

  const handlePurchaseOrEquip = () => {
    if (isSelectedOwned) {
      setEquippedPlane(selectedPlane);
      return;
    }

    if (coins < currentPlane.price) {
      alert(`אין מספיק מטבעות! נדרשים עוד ₪ ${(currentPlane.price - coins).toLocaleString()}`);
      return;
    }

    onCoinsChange((c) => c - currentPlane.price);
    setOwnedPlanes((prev) => (prev.includes(selectedPlane) ? prev : [...prev, selectedPlane]));
    setEquippedPlane(selectedPlane);
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-45 flex items-center justify-center select-none overflow-hidden bg-[#0A0D14] h-[100dvh] w-full"
    >
      <div className="relative min-w-full min-h-full aspect-[896/1200] flex items-center justify-center overflow-hidden bg-[#0A0D14]">
        {/* ==========================================
            1. MAIN ENTRANCE MENU SCREEN
            The pure, exact image with NO duplicate UI underneath or on top.
            Only transparent responsive click hotspots mapped over the buttons.
           ========================================== */}
        {activeTab === 'main' && (
          <div className="relative w-full h-full select-none">
            {/* The Authentic Main Menu Screen Image */}
            <img
              src={mainRunwayImage}
              alt="Wings of Israel Main Menu"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
            />

            {/* Top-Left: Settings Button Hotspot (Gear) */}
            <button
              type="button"
              onClick={() => onOpenDiagnostics?.()}
              data-no-fullscreen="true"
              aria-label="הגדרות"
              className="absolute z-20 cursor-pointer rounded-full select-none border-0 bg-transparent hover:bg-cyan-400/20 active:scale-90 transition"
              style={{
                left: '8.8%',
                top: '13.8%',
                transform: 'translate(-50%, -50%)',
                width: '12.5%',
                aspectRatio: '1/1',
                touchAction: 'manipulation',
              }}
            />

            {/* Top-Left: Pilot Profile Button Hotspot (Avatar) */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              data-no-fullscreen="true"
              aria-label="פרופיל טייס"
              className="absolute z-20 cursor-pointer rounded-full select-none border-0 bg-transparent hover:bg-cyan-400/20 active:scale-90 transition"
              style={{
                left: '8.8%',
                top: '24.5%',
                transform: 'translate(-50%, -50%)',
                width: '12.5%',
                aspectRatio: '1/1',
                touchAction: 'manipulation',
              }}
            />

            {/* Bottom Dock: 'שדרוגים' (Upgrades) Hotspot */}
            <button
              type="button"
              onClick={() => setActiveTab('upgrades')}
              data-no-fullscreen="true"
              aria-label="שדרוגים"
              className="absolute z-20 cursor-pointer rounded-2xl select-none border-0 bg-transparent hover:bg-cyan-400/15 active:scale-95 transition"
              style={{
                left: '17.3%',
                top: '89.6%',
                transform: 'translate(-50%, -50%)',
                width: '26%',
                height: '14.5%',
                touchAction: 'manipulation',
              }}
            />

            {/* Bottom Dock: 'שחק' (PLAY) Hero Hotspot */}
            <button
              type="button"
              onClick={handlePlayClick}
              onPointerDown={() => setIsPlayPressed(true)}
              onPointerUp={() => setTimeout(() => setIsPlayPressed(false), 90)}
              onPointerCancel={() => setIsPlayPressed(false)}
              data-no-fullscreen="true"
              aria-label="שחק"
              className={`absolute z-20 cursor-pointer rounded-2xl select-none border-0 transition-all duration-100 ${
                isPlayPressed
                  ? 'bg-cyan-400/25 scale-95 ring-2 ring-cyan-300'
                  : 'bg-transparent hover:bg-cyan-400/15'
              }`}
              style={{
                left: '50%',
                top: '89.6%',
                transform: `translate(-50%, -50%) ${isPlayPressed ? 'scale(0.95)' : 'scale(1)'}`,
                width: '42.5%',
                height: '15%',
                touchAction: 'manipulation',
              }}
            />

            {/* Bottom Dock: 'חנות מטוסים' (Aircraft Shop) Hotspot */}
            <button
              type="button"
              onClick={() => setActiveTab('shop')}
              data-no-fullscreen="true"
              aria-label="חנות מטוסים"
              className="absolute z-20 cursor-pointer rounded-2xl select-none border-0 bg-transparent hover:bg-cyan-400/15 active:scale-95 transition"
              style={{
                left: '82.7%',
                top: '89.6%',
                transform: 'translate(-50%, -50%)',
                width: '26%',
                height: '14.5%',
                touchAction: 'manipulation',
              }}
            />
          </div>
        )}

        {/* ==========================================
            2. AIRCRAFT SHOP SCREEN
               Exact visual artwork with seamless transparent interactive hotspots
           ========================================== */}
        {activeTab === 'shop' && (
          <div className="relative w-full h-full select-none">
            {/* The Authentic Shop Artwork Image */}
            <img
              src={shopExactImage}
              alt="חנות מטוסים"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
            />

            {/* Back Button Hotspot (Top-Left) */}
            <button
              type="button"
              onClick={() => setActiveTab('main')}
              data-no-fullscreen="true"
              aria-label="חזור לתפריט"
              className="absolute z-20 cursor-pointer rounded-xl border-0 bg-transparent hover:bg-cyan-400/20 active:scale-95 transition"
              style={{
                left: '4.5%',
                top: '9.2%',
                width: '18%',
                height: '5.2%',
                touchAction: 'manipulation',
              }}
            />

            {/* Action Button Hotspot (Buy / Equip) */}
            <button
              type="button"
              onClick={handlePurchaseOrEquip}
              data-no-fullscreen="true"
              aria-label={isSelectedEquipped ? 'בשימוש' : isSelectedOwned ? 'בחר מטוס' : 'קנה מטוס'}
              className="absolute z-20 cursor-pointer rounded-2xl border-0 bg-transparent hover:bg-cyan-400/20 active:scale-95 transition"
              style={{
                left: '50%',
                top: '71.8%',
                transform: 'translate(-50%, -50%)',
                width: '46%',
                height: '7.8%',
                touchAction: 'manipulation',
              }}
            />

            {/* Bottom Aircraft Carousel Selection Hotspots */}
            <div
              className="absolute z-20 inset-x-2 flex items-center justify-between"
              style={{ bottom: '2%', height: '15.5%' }}
            >
              {[0, 1, 2, 3].map((planeIdx) => (
                <button
                  key={planeIdx}
                  type="button"
                  onClick={() => setSelectedPlane(planeIdx)}
                  data-no-fullscreen="true"
                  aria-label={`בחר ${planes[planeIdx]?.name}`}
                  className="relative w-[23.5%] h-full rounded-2xl border-0 bg-transparent hover:bg-cyan-400/20 active:scale-95 transition cursor-pointer"
                  style={{ touchAction: 'manipulation' }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            3. UPGRADES WORKSHOP SCREEN
               Exact visual artwork with seamless transparent hotspots
           ========================================== */}
        {activeTab === 'upgrades' && (
          <div className="relative w-full h-full select-none">
            {/* The Authentic Upgrades Artwork Image */}
            <img
              src={upgradesExactImage}
              alt="סדנת שדרוגים"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
            />

            {/* Back Button Hotspot (Top-Left) */}
            <button
              type="button"
              onClick={() => setActiveTab('main')}
              data-no-fullscreen="true"
              aria-label="חזור לתפריט"
              className="absolute z-20 cursor-pointer rounded-xl border-0 bg-transparent hover:bg-cyan-400/20 active:scale-95 transition"
              style={{
                left: '4.5%',
                top: '9.2%',
                width: '18%',
                height: '5.2%',
                touchAction: 'manipulation',
              }}
            />

            {/* Master Upgrade Button Hotspot (שדרוג כללי) */}
            <button
              type="button"
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
              className="absolute z-20 cursor-pointer rounded-2xl select-none focus:outline-none hover:bg-cyan-400/20 active:scale-95 border-0 bg-transparent"
              style={{
                left: '50%',
                top: '73.5%',
                transform: 'translate(-50%, -50%)',
                width: '52%',
                height: '7.8%',
                touchAction: 'manipulation',
              }}
            />

            {/* Individual Upgrade Hotspots */}
            {/* 1. Engine */}
            <button
              type="button"
              onClick={() => {
                const cost = 5000;
                if (upgrades.engine < 5 && coins >= cost) {
                  onCoinsChange((c) => c - cost);
                  setUpgrades((prev) => ({ ...prev, engine: prev.engine + 1 }));
                }
              }}
              data-no-fullscreen="true"
              aria-label="שדרוג מנוע סילון"
              className="absolute z-20 cursor-pointer rounded-xl select-none focus:outline-none hover:bg-cyan-400/20 active:scale-95 border-0 bg-transparent"
              style={{ left: '29%', top: '30%', width: '18%', height: '11%', touchAction: 'manipulation' }}
            />
            {/* 2. Avionics */}
            <button
              type="button"
              onClick={() => {
                const cost = 3500;
                if (upgrades.avionics < 4 && coins >= cost) {
                  onCoinsChange((c) => c - cost);
                  setUpgrades((prev) => ({ ...prev, avionics: prev.avionics + 1 }));
                }
              }}
              data-no-fullscreen="true"
              aria-label="שדרוג מערכות אווירוניקה"
              className="absolute z-20 cursor-pointer rounded-xl select-none focus:outline-none hover:bg-cyan-400/20 active:scale-95 border-0 bg-transparent"
              style={{ left: '71%', top: '30%', width: '18%', height: '11%', touchAction: 'manipulation' }}
            />
            {/* 3. Weapons */}
            <button
              type="button"
              onClick={() => {
                const cost = 7500;
                if (upgrades.weapons < 3 && coins >= cost) {
                  onCoinsChange((c) => c - cost);
                  setUpgrades((prev) => ({ ...prev, weapons: prev.weapons + 1 }));
                }
              }}
              data-no-fullscreen="true"
              aria-label="שדרוג חימוש משודרג"
              className="absolute z-20 cursor-pointer rounded-xl select-none focus:outline-none hover:bg-cyan-400/20 active:scale-95 border-0 bg-transparent"
              style={{ left: '29%', top: '61%', width: '18%', height: '11%', touchAction: 'manipulation' }}
            />
            {/* 4. Armor */}
            <button
              type="button"
              onClick={() => {
                const cost = 4200;
                if (upgrades.armor < 5 && coins >= cost) {
                  onCoinsChange((c) => c - cost);
                  setUpgrades((prev) => ({ ...prev, armor: prev.armor + 1 }));
                }
              }}
              data-no-fullscreen="true"
              aria-label="שדרוג שריון מחוזק"
              className="absolute z-20 cursor-pointer rounded-xl select-none focus:outline-none hover:bg-cyan-400/20 active:scale-95 border-0 bg-transparent"
              style={{ left: '71%', top: '61%', width: '18%', height: '11%', touchAction: 'manipulation' }}
            />
          </div>
        )}

        {/* ==========================================
            4. PILOT PROFILE MODAL
           ========================================== */}
        {activeTab === 'profile' && (
          <div
            data-no-fullscreen="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="relative w-full max-w-sm bg-slate-900/95 border-2 border-cyan-500/50 rounded-3xl p-6 shadow-2xl text-white">
              <div className="flex flex-col items-center text-center pb-4 border-b border-slate-800">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] mb-3">
                  <span className="text-2xl">👤</span>
                </div>
                <h3 className="text-xl font-black text-cyan-300">טייס חיל האוויר</h3>
                <p className="text-xs text-cyan-400/80 font-mono">דרגה: אלוף הפלות (רמה 12)</p>
              </div>

              <div className="py-4 space-y-2.5 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">מאזן מטבעות:</span>
                  <span className="font-bold text-amber-400">₪ {coins.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">מטוס נוכחי:</span>
                  <span className="font-bold text-cyan-300">{currentPlane.name}</span>
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
                type="button"
                onClick={() => setActiveTab('main')}
                className="w-full py-3 rounded-2xl bg-gradient-to-b from-cyan-500 to-blue-700 hover:brightness-110 text-white font-black transition shadow-lg cursor-pointer"
              >
                חזור לתפריט הראשי
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
