import React, { useState, useEffect } from 'react';

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
      // Storage fallback
    }
  }, [selectedPlane, ownedPlanes, equippedPlane]);

  useEffect(() => {
    onPlaneSelected?.(equippedPlane);
  }, [equippedPlane, onPlaneSelected]);

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
      description: 'דגם: לביא M-346 מטוס אימון סילוני מתקדם וקרב קל, מהירות תגובה גבוהה, כושר תמרון מעולה ומערכות אוויוניקה מתקדמות.',
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
      description: 'דגם: ברק F-16I עמוד השדרה של חיל האוויר הישראלי, מצויד במכלי דלק תצורתיים, מערכות לוחמה אלקטרונית מתקדמות ונשיאה גבוהה של חימוש.',
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
      description: 'דגם: אדיר F-35I פסגת הטכנולוגיה האווירית עם מעטפת חמקנות מהדור החמישי, היתוך חיישנים אוטונומי ומערכות שליטה מתקדמות.',
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
      description: 'דגם: נשר מטוס הקרב המיתולוגי בעל כנף דלתא קלאסית, מהירות על-קולית כפולה ורקורד ניצחונות אוויריים מפואר.',
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
      description: 'דגם: קורנס F-4 פנטום מפציץ-קרב כבד ואגדי, עוצמת מנועים כפולה, נשיאת חימוש אדירה וטווח מבצעי עצום.',
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
      description: 'דגם: בז F-15 מלך העליונות האווירית עם יחס דחף-משקל מופלא, יכולת טיפוס פנומנלית ורקורד הפלות מושלם.',
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
      <style>{`
        @keyframes drift {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes hoverGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(34, 211, 238, 0.12); }
          50% { box-shadow: 0 0 28px rgba(34, 211, 238, 0.35); }
        }
        @keyframes pulseRing {
          0%, 100% { opacity: 0.45; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.04); }
        }
      `}</style>

      <div className="relative min-w-full min-h-full aspect-[896/1200] flex items-center justify-center overflow-hidden bg-[#0A0D14]">
        {activeTab === 'main' && (
          <div className="relative h-full w-full select-none overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_24%),linear-gradient(180deg,_#09131d_0%,_#0c1724_30%,_#040b11_100%)]">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_65%)]" />
              <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,rgba(6,14,18,0)_0%,rgba(6,14,18,0.7)_18%,rgba(3,6,12,0.95)_100%)]" />
              <div className="absolute inset-x-[7%] bottom-[15%] h-[12%] rounded-[50%] bg-cyan-500/10 blur-3xl" />
              <div className="absolute inset-x-[18%] bottom-[12%] h-[2px] bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
              <div className="absolute left-1/2 top-[68%] h-[18%] w-[64%] -translate-x-1/2 rounded-[50%] border border-cyan-400/10 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent blur-sm" />
              <div className="absolute left-[12%] top-[10%] h-32 w-32 rounded-full border border-cyan-400/20 bg-cyan-500/5 blur-2xl" />
              <div className="absolute right-[10%] top-[14%] h-28 w-28 rounded-full border border-sky-400/20 bg-sky-500/5 blur-2xl" />
            </div>

            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6 text-white/80">
              <div className="flex gap-2">
                <div className="h-12 w-12 rounded-full border border-cyan-400/40 bg-slate-950/40 backdrop-blur-sm" />
                <div className="h-12 w-12 rounded-full border border-cyan-400/40 bg-slate-950/40 backdrop-blur-sm" />
              </div>
              <div className="rounded-full border border-cyan-400/20 bg-slate-950/35 px-4 py-2 text-[10px] tracking-[0.5em] text-cyan-200/80 uppercase">
                Air Superiority
              </div>
            </div>

            <div className="absolute left-1/2 top-[14%] -translate-x-1/2 text-center">
              <div className="mb-2 text-[10px] tracking-[0.8em] text-cyan-200/80 uppercase">Wings of Israel</div>
              <div className="text-[clamp(3rem,8vw,7rem)] font-black leading-none tracking-[0.2em] text-white drop-shadow-[0_0_25px_rgba(125,211,252,0.35)]">
                WINGS
              </div>
            </div>

            <div className="absolute left-1/2 top-[68%] -translate-x-1/2 h-[16%] w-[72%] rounded-[28px] border border-cyan-300/20 bg-slate-950/20 backdrop-blur-[2px]" />

            <button
              type="button"
              onClick={() => onOpenDiagnostics?.()}
              data-no-fullscreen="true"
              aria-label="הגדרות"
              className="absolute z-20 rounded-full border-0 bg-transparent active:scale-90 transition"
              style={{
                left: '8.8%',
                top: '13.8%',
                transform: 'translate(-50%, -50%)',
                width: '12.5%',
                aspectRatio: '1/1',
                touchAction: 'manipulation',
              }}
            />

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              data-no-fullscreen="true"
              aria-label="פרופיל טייס"
              className="absolute z-20 rounded-full border-0 bg-transparent active:scale-90 transition"
              style={{
                left: '8.8%',
                top: '24.5%',
                transform: 'translate(-50%, -50%)',
                width: '12.5%',
                aspectRatio: '1/1',
                touchAction: 'manipulation',
              }}
            />

            <button
              type="button"
              onClick={() => setActiveTab('upgrades')}
              data-no-fullscreen="true"
              aria-label="שדרוגים"
              className="absolute z-20 rounded-2xl border-0 bg-transparent active:scale-95 transition"
              style={{
                left: '17.3%',
                top: '89.6%',
                transform: 'translate(-50%, -50%)',
                width: '26%',
                height: '14.5%',
                touchAction: 'manipulation',
              }}
            />

            <button
              type="button"
              onClick={handlePlayClick}
              onPointerDown={() => setIsPlayPressed(true)}
              onPointerUp={() => setTimeout(() => setIsPlayPressed(false), 90)}
              onPointerCancel={() => setIsPlayPressed(false)}
              data-no-fullscreen="true"
              aria-label="שחק"
              className={`absolute z-20 rounded-2xl border-0 transition-all duration-100 ${
                isPlayPressed ? 'bg-cyan-400/25 scale-95 ring-2 ring-cyan-300' : 'bg-transparent hover:bg-cyan-400/15'
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

            <button
              type="button"
              onClick={() => setActiveTab('shop')}
              data-no-fullscreen="true"
              aria-label="חנות מטוסים"
              className="absolute z-20 rounded-2xl border-0 bg-transparent active:scale-95 transition"
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

        {activeTab === 'shop' && (
          <div className="relative h-full w-full select-none overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(180deg,_#091620_0%,_#0c1423_35%,_#040b12_100%)]">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0)_30%)]" />
            <div className="absolute inset-x-8 top-20 bottom-20 rounded-[28px] border border-cyan-300/20 bg-slate-950/25 backdrop-blur-md" />

            <div className="absolute right-10 top-10 flex items-center gap-3 text-cyan-100/90">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/40 bg-slate-900/40 text-lg">✈</div>
              <div>
                <div className="text-[10px] tracking-[0.5em] text-cyan-200/70 uppercase">Air Fleet</div>
                <div className="text-2xl font-black tracking-[0.15em]">SHOP</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('main')}
              data-no-fullscreen="true"
              aria-label="חזור לתפריט"
              className="absolute z-20 rounded-xl border-0 bg-transparent hover:bg-cyan-400/20 active:scale-95 transition"
              style={{
                left: '4.5%',
                top: '9.2%',
                width: '18%',
                height: '5.2%',
                touchAction: 'manipulation',
              }}
            />

            <div className="absolute left-1/2 top-[28%] flex w-[72%] -translate-x-1/2 items-center justify-between gap-4 rounded-3xl border border-cyan-400/20 bg-slate-950/40 p-5 shadow-[0_0_35px_rgba(34,211,238,0.08)]">
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-cyan-300/25 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.32),rgba(15,23,42,0.8)_60%)] text-6xl shadow-[0_0_28px_rgba(34,211,238,0.25)]">
                ✦
              </div>
              <div className="flex-1 text-right text-white">
                <div className="text-[10px] tracking-[0.5em] text-cyan-200/70 uppercase">Selected Aircraft</div>
                <div className="mt-2 text-3xl font-black tracking-[0.1em]">{planes[selectedPlane].name}</div>
                <div className="mt-1 text-xs text-slate-300">{planes[selectedPlane].role}</div>
              </div>
              <div className="min-w-[100px] rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-center text-amber-300">
                <div className="text-[10px] tracking-[0.35em] uppercase text-amber-200/70">₪</div>
                <div className="text-2xl font-black">{currentPlane.price.toLocaleString()}</div>
              </div>
            </div>

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

            <div className="absolute inset-x-2 bottom-[2%] z-20 flex items-center justify-between" style={{ height: '15.5%' }}>
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

        {activeTab === 'upgrades' && (
          <div className="relative h-full w-full select-none overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_30%),linear-gradient(180deg,_#09161d_0%,_#0b1522_36%,_#040d18_100%)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.12),_transparent_35%)]" />
            <div className="absolute inset-x-8 top-20 bottom-16 rounded-[30px] border border-cyan-400/20 bg-slate-950/30 backdrop-blur-md" />

            <div className="absolute left-1/2 top-8 -translate-x-1/2 text-center text-white">
              <div className="text-[10px] tracking-[0.7em] text-cyan-200/70 uppercase">Flight Systems</div>
              <div className="text-3xl font-black tracking-[0.18em]">UPGRADES</div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('main')}
              data-no-fullscreen="true"
              aria-label="חזור לתפריט"
              className="absolute z-20 rounded-xl border-0 bg-transparent hover:bg-cyan-400/20 active:scale-95 transition"
              style={{
                left: '4.5%',
                top: '9.2%',
                width: '18%',
                height: '5.2%',
                touchAction: 'manipulation',
              }}
            />

            <div className="absolute inset-x-0 top-[20%] grid grid-cols-2 gap-6 px-10">
              {[
                { key: 'engine', title: 'ENGINE', value: upgrades.engine },
                { key: 'avionics', title: 'AVIONICS', value: upgrades.avionics },
                { key: 'weapons', title: 'WEAPONS', value: upgrades.weapons },
                { key: 'armor', title: 'ARMOR', value: upgrades.armor },
              ].map((item) => (
                <div key={item.key} className="rounded-3xl border border-cyan-400/20 bg-slate-950/40 p-5 text-right shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                  <div className="text-[10px] tracking-[0.4em] text-cyan-200/70 uppercase">{item.title}</div>
                  <div className="mt-2 text-3xl font-black text-white">{item.value}/5</div>
                </div>
              ))}
            </div>

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
