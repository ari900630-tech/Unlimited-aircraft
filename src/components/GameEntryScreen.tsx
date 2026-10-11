import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plane, Coins, ShieldCheck, Wrench, User, Settings, Play, Store, Zap, Crosshair, Layers, Check, LockKeyhole, Gauge, Trophy } from 'lucide-react';

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

const planes = [
  { id: 0, name: 'M-346 לביא', subtitle: 'מטוס אימון מתקדם', price: 0, speed: 70, maneuver: 75, fire: 50 },
  { id: 1, name: 'F-16I ברק', subtitle: 'מטוס קרב רב־משימתי', price: 75000, speed: 88, maneuver: 85, fire: 80 },
  { id: 2, name: 'F-35I אדיר', subtitle: 'מטוס חמקן מתקדם', price: 150000, speed: 95, maneuver: 92, fire: 95 },
  { id: 3, name: 'נשר', subtitle: 'מטוס קרב קל', price: 10000, speed: 60, maneuver: 65, fire: 60 },
  { id: 4, name: 'פנטום F-4', subtitle: 'מטוס תקיפה', price: 50000, speed: 80, maneuver: 70, fire: 85 },
  { id: 5, name: 'F-15 באז', subtitle: 'עליונות אווירית', price: 120000, speed: 92, maneuver: 90, fire: 90 },
];

const upgradeDefinitions = [
  { key: 'engine', label: 'מנוע', description: 'מהירות וטיפוס', icon: Zap, max: 5, cost: 5000 },
  { key: 'avionics', label: 'אוויוניקה', description: 'מכ״ם ודיוק', icon: Crosshair, max: 4, cost: 3500 },
  { key: 'weapons', label: 'חימוש', description: 'עוצמת אש', icon: Layers, max: 3, cost: 7500 },
  { key: 'armor', label: 'שריון', description: 'עמידות בקרב', icon: ShieldCheck, max: 5, cost: 4200 },
] as const;

type UpgradeKey = typeof upgradeDefinitions[number]['key'];

export function GameEntryScreen({
  isOpen, onStartFlight, score = 0, onOpenDiagnostics, onPlaneSelected, coins, onCoinsChange,
}: GameEntryScreenProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'shop' | 'upgrades' | 'profile'>('main');
  const [selectedPlane, setSelectedPlane] = useState(() => {
    try { return Math.max(0, Math.min(5, Number(localStorage.getItem('unlimited-aircraft-selected') || 0))); } catch { return 0; }
  });
  const [ownedPlanes, setOwnedPlanes] = useState<number[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('unlimited-aircraft-owned') || '[0]');
      return Array.isArray(saved) ? Array.from(new Set([0, ...saved.filter((n) => Number.isInteger(n) && n >= 0 && n < planes.length)])) : [0];
    } catch { return [0]; }
  });
  const [equippedPlane, setEquippedPlane] = useState(() => {
    try { return Math.max(0, Math.min(5, Number(localStorage.getItem('unlimited-aircraft-equipped') || 0))); } catch { return 0; }
  });
  const [upgrades, setUpgrades] = useState<Record<UpgradeKey, number>>(() => {
    const defaults: Record<UpgradeKey, number> = { engine: 2, avionics: 1, weapons: 0, armor: 1 };
    try {
      const saved = JSON.parse(localStorage.getItem('unlimited-aircraft-upgrades') || 'null');
      if (!saved || typeof saved !== 'object') return defaults;
      return {
        engine: Math.max(0, Math.min(5, Number(saved.engine ?? defaults.engine))),
        avionics: Math.max(0, Math.min(4, Number(saved.avionics ?? defaults.avionics))),
        weapons: Math.max(0, Math.min(3, Number(saved.weapons ?? defaults.weapons))),
        armor: Math.max(0, Math.min(5, Number(saved.armor ?? defaults.armor))),
      };
    } catch { return defaults; }
  });
  const [pressedAction, setPressedAction] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('unlimited-aircraft-selected', String(selectedPlane));
      localStorage.setItem('unlimited-aircraft-owned', JSON.stringify(ownedPlanes));
      localStorage.setItem('unlimited-aircraft-equipped', String(equippedPlane));
      localStorage.setItem('unlimited-aircraft-upgrades', JSON.stringify(upgrades));
    } catch { /* Keep the game usable when local storage is unavailable. */ }
  }, [selectedPlane, ownedPlanes, equippedPlane, upgrades]);

  useEffect(() => { onPlaneSelected?.(equippedPlane); }, [equippedPlane, onPlaneSelected]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);



  if (!isOpen) return null;

  const plane = planes[selectedPlane];
  const level = Math.floor(Math.max(0, score) / 1000) + 1;
  const choosePlane = (id: number) => setSelectedPlane(id);
  const buyOrEquip = () => {
    const selected = planes[selectedPlane];
    if (ownedPlanes.includes(selectedPlane)) {
      setEquippedPlane(selectedPlane);
      setNotice('המטוס נבחר לטיסה');
      setActiveTab('main');
      return;
    }
    if (coins < selected.price) {
      setNotice('אין מספיק מטבעות לרכישת המטוס');
      return;
    }
    onCoinsChange((value) => value - selected.price);
    setOwnedPlanes((value) => value.includes(selectedPlane) ? value : [...value, selectedPlane]);
    setEquippedPlane(selectedPlane);
    setNotice('המטוס נרכש והופעל');
  };
  const upgradeOne = (key: UpgradeKey) => {
    const definition = upgradeDefinitions.find((item) => item.key === key)!;
    if (upgrades[key] >= definition.max) { setNotice('המערכת כבר ברמה המרבית'); return; }
    if (coins < definition.cost) { setNotice('אין מספיק מטבעות לשדרוג'); return; }
    onCoinsChange((value) => value - definition.cost);
    setUpgrades((value) => ({ ...value, [key]: value[key] + 1 }));
    setNotice(definition.label + ' שודרג');
  };
  const upgradeAll = () => {
    const cost = upgradeDefinitions.reduce((sum, item) => sum + (upgrades[item.key] < item.max ? item.cost : 0), 0);
    if (!cost) { setNotice('כל המערכות ברמה המרבית'); return; }
    if (coins < cost) { setNotice('אין מספיק מטבעות לשדרוג כולל'); return; }
    onCoinsChange((value) => value - cost);
    setUpgrades({ engine: 5, avionics: 4, weapons: 3, armor: 5 });
    setNotice('כל המערכות שודרגו');
  };

  const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="flex items-center gap-3">
      <button onClick={() => setActiveTab('main')} aria-label="חזרה לתפריט" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-white active:scale-95">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1 text-right">
        <div className="text-lg font-black tracking-tight text-white">{title}</div>
        <div className="text-xs text-slate-400">{subtitle}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] px-3 py-2 text-sm font-black tabular-nums text-amber-300">
        <Coins className="h-4 w-4" /> {coins.toLocaleString('he-IL')}
      </div>
    </div>
  );

  const ActionButton = ({ icon: Icon, title, detail, onClick, primary = false }: {
    icon: React.ElementType; title: string; detail: string; onClick: () => void; primary?: boolean;
  }) => (
    <button onClick={onClick} className={'group flex min-h-[76px] w-full items-center gap-3 rounded-[22px] border p-4 text-right transition active:scale-[0.98] ' + (primary ? 'border-sky-300/30 bg-gradient-to-l from-sky-500 to-blue-600 shadow-lg shadow-sky-950/40' : 'border-white/[0.09] bg-white/[0.045] hover:bg-white/[0.08]')}>
      <span className={'grid h-11 w-11 shrink-0 place-items-center rounded-2xl ' + (primary ? 'bg-white/15 text-white' : 'bg-sky-400/10 text-sky-300')}><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block text-base font-extrabold text-white">{title}</span><span className={'mt-0.5 block text-xs ' + (primary ? 'text-sky-50/80' : 'text-slate-400')}>{detail}</span></span>
      <ArrowLeft className={'h-4 w-4 shrink-0 ' + (primary ? 'text-white' : 'text-slate-500')} />
    </button>
  );

  return (
    <div dir="rtl" className="fixed inset-0 z-45 h-[100dvh] w-full overflow-hidden bg-[#070d17] text-white select-none" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(18,91,145,0.22),transparent_55%)]" />
      <div className="relative mx-auto flex h-full w-full max-w-[520px] flex-col overflow-hidden border-x border-white/[0.035] bg-[#0a111d] shadow-2xl">
        {activeTab === 'main' && (
          <>
            <header className="flex items-center justify-between px-5 pb-4 pt-[max(18px,env(safe-area-inset-top))]">
              <button onClick={() => onOpenDiagnostics?.()} aria-label="הגדרות ואבחון" className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.045] text-slate-300 active:scale-95"><Settings className="h-5 w-5" /></button>
              <div className="text-center">
                <div className="text-[10px] font-bold tracking-[0.34em] text-sky-300">ISRAEL AIR FORCE</div>
                <div className="mt-0.5 text-xl font-black tracking-wide text-white">WINGS <span className="text-sky-400">OF ISRAEL</span></div>
              </div>
              <button onClick={() => setActiveTab('profile')} aria-label="פרופיל טייס" className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.045] text-slate-300 active:scale-95"><User className="h-5 w-5" /></button>
            </header>

            <main className="flex-1 overflow-y-auto px-4 pb-5">
              <div className="relative mt-1 overflow-hidden rounded-[28px] border border-sky-200/15 bg-[#101d2d]">
                <img src={`${import.meta.env.BASE_URL}src/assets/images/wings_entry_runway_1791662090999.jpg`} alt="מטוסי חיל האוויר" className="absolute inset-0 h-full w-full object-cover object-center opacity-65" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07101c] via-[#07101c]/25 to-[#07101c]/30" />
                <div className="relative flex min-h-[250px] flex-col justify-end p-5">
                  <div className="mb-auto flex items-start justify-between gap-3">
                    <div className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" /> מוכן לטיסה</div>
                    <div className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-left backdrop-blur"><div className="text-[10px] text-slate-300">דרגת טייס</div><div className="text-lg font-black text-white">רמה {level}</div></div>
                  </div>
                  <div className="text-xs font-bold tracking-[0.22em] text-sky-300">המשימה הבאה שלך</div>
                  <h1 className="mt-1 text-2xl font-black leading-tight text-white">{planes[equippedPlane]?.name || 'M-346 לביא'}</h1>
                  <p className="mt-1 text-sm text-slate-200/80">הכן את המטוס, המריא וצבור מטבעות לשדרוג הצי.</p>
                  <button onClick={onStartFlight} data-no-fullscreen="true" className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-sky-400 to-blue-600 text-base font-black text-white shadow-lg shadow-blue-950/50 transition active:scale-[0.98]">
                    <Play className="h-5 w-5 fill-current" /> התחלת טיסה
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[22px] border border-amber-300/15 bg-amber-300/[0.055] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-100/70"><Coins className="h-4 w-4 text-amber-300" /> יתרת מטבעות</div>
                  <div className="mt-2 text-2xl font-black tabular-nums text-amber-300">{coins.toLocaleString('he-IL')}</div>
                </div>
                <div className="rounded-[22px] border border-sky-300/15 bg-sky-300/[0.055] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-sky-100/70"><Trophy className="h-4 w-4 text-sky-300" /> ניקוד מצטבר</div>
                  <div className="mt-2 text-2xl font-black tabular-nums text-sky-200">{Math.max(0, score).toLocaleString('he-IL')}</div>
                </div>
              </div>

              <div className="mb-2 mt-6 flex items-center justify-between px-1"><h2 className="text-sm font-extrabold text-white">מרכז הטייס</h2><span className="text-[10px] font-bold tracking-wider text-slate-500">PILOT CENTER</span></div>
              <div className="space-y-2.5">
                <ActionButton icon={Store} title="חנות מטוסים" detail="בחר, רכוש והפעל מטוס" onClick={() => setActiveTab('shop')} />
                <ActionButton icon={Wrench} title="שדרוגי מטוס" detail="מנוע, אוויוניקה, חימוש ושריון" onClick={() => setActiveTab('upgrades')} />
              </div>
            </main>
            <nav className="grid grid-cols-3 gap-1 border-t border-white/[0.08] bg-[#080e17]/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
              {[
                { label: 'טיסה', icon: Play, action: onStartFlight, active: true },
                { label: 'מטוסים', icon: Plane, action: () => setActiveTab('shop'), active: false },
                { label: 'שדרוגים', icon: Wrench, action: () => setActiveTab('upgrades'), active: false },
              ].map((item) => <button key={item.label} onClick={item.action} className={'flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold active:scale-95 ' + (item.active ? 'text-sky-300' : 'text-slate-500')}><item.icon className="h-5 w-5" />{item.label}</button>)}
            </nav>
          </>
        )}

        {activeTab === 'shop' && (
          <>
            <header className="px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))]"><Header title="חנות מטוסים" subtitle="בחר את המטוס הבא שלך" /></header>
            <main className="flex-1 overflow-y-auto px-4 pb-5">
              <div className="relative overflow-hidden rounded-[26px] border border-sky-300/15 bg-[#111d2b]">
                <img src={`${import.meta.env.BASE_URL}src/assets/images/wings_entry_runway_1791662090999.jpg`} alt="מטוס בחנות" className="absolute inset-0 h-full w-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08111c] via-[#08111c]/30 to-[#08111c]/20" />
                <div className="relative p-4 pt-5">
                  <div className="flex items-center justify-between"><span className="rounded-full border border-sky-200/20 bg-black/35 px-3 py-1 text-[10px] font-bold tracking-widest text-sky-200">AIRCRAFT {String(selectedPlane + 1).padStart(2, '0')}</span><span className={'rounded-full px-2.5 py-1 text-[10px] font-bold ' + (ownedPlanes.includes(selectedPlane) ? 'bg-emerald-300/15 text-emerald-200' : 'bg-white/10 text-slate-200')}>{ownedPlanes.includes(selectedPlane) ? 'בבעלותך' : 'זמין לרכישה'}</span></div>
                  <div className="mt-20 text-xs font-bold text-sky-200">{plane.subtitle}</div>
                  <h2 className="mt-1 text-3xl font-black">{plane.name}</h2>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[{ label: 'מהירות', value: plane.speed }, { label: 'תמרון', value: plane.maneuver }, { label: 'עוצמת אש', value: plane.fire }].map((stat) => <div key={stat.label} className="rounded-xl border border-white/10 bg-black/35 p-2.5"><div className="text-[10px] text-slate-300">{stat.label}</div><div className="mt-1 text-sm font-black">{stat.value}<span className="text-[10px] font-normal text-slate-400">/100</span></div><div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-sky-400" style={{ width: stat.value + '%' }} /></div></div>)}
                  </div>
                  <button onClick={buyOrEquip} className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-sky-400 to-blue-600 px-4 text-sm font-black text-white shadow-lg active:scale-[0.98]">
                    {ownedPlanes.includes(selectedPlane) ? <Check className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                    {ownedPlanes.includes(selectedPlane) ? (equippedPlane === selectedPlane ? 'המטוס הפעיל שלך' : 'בחר והפעל מטוס') : 'רכישה ב־' + plane.price.toLocaleString('he-IL') + ' מטבעות'}
                  </button>
                </div>
              </div>
              <h3 className="mb-3 mt-5 text-sm font-extrabold">צי המטוסים</h3>
              <div className="space-y-2.5">
                {planes.map((item) => <button key={item.id} onClick={() => choosePlane(item.id)} className={'flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition active:scale-[0.99] ' + (selectedPlane === item.id ? 'border-sky-300/50 bg-sky-400/[0.09]' : 'border-white/[0.08] bg-white/[0.035]')}>
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-800 text-sky-300"><Plane className="h-6 w-6" /></div>
                  <div className="min-w-0 flex-1"><div className="font-extrabold">{item.name}</div><div className="mt-0.5 text-xs text-slate-400">{item.subtitle}</div></div>
                  <div className="text-left">{ownedPlanes.includes(item.id) ? <span className="text-xs font-bold text-emerald-300">נרכש ✓</span> : <span className="text-xs font-bold text-amber-300">{item.price.toLocaleString('he-IL')} ◈</span>}{selectedPlane === item.id && <div className="mt-1 text-[10px] text-sky-300">נבחר</div>}</div>
                </button>)}
              </div>
            </main>
            <nav className="border-t border-white/[0.08] bg-[#080e17]/95 p-3 pb-[max(10px,env(safe-area-inset-bottom))]"><button onClick={() => setActiveTab('main')} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-white/[0.06] font-bold text-slate-200 active:scale-[0.98]"><ArrowLeft className="h-4 w-4" /> חזרה לתפריט</button></nav>
          </>
        )}

        {activeTab === 'upgrades' && (
          <>
            <header className="px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))]"><Header title="שדרוגי מטוס" subtitle="שפר את מערכות המטוס שלך" /></header>
            <main className="flex-1 overflow-y-auto px-4 pb-5">
              <div className="rounded-[24px] border border-sky-300/15 bg-gradient-to-br from-[#142b40] to-[#0e1724] p-4">
                <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-400/10 text-sky-300"><Wrench className="h-6 w-6" /></div><div className="flex-1"><div className="font-black">סדנת תחזוקה</div><div className="mt-0.5 text-xs text-slate-400">מטוס פעיל: {planes[equippedPlane]?.name}</div></div><Gauge className="h-5 w-5 text-slate-500" /></div>
                <p className="mt-3 text-xs leading-5 text-slate-400">כל שדרוג משפר יכולת אחרת. הרמות והיתרה נשמרות במכשיר.</p>
              </div>
              <div className="mb-3 mt-5 flex items-center justify-between"><h3 className="text-sm font-extrabold">מערכות המטוס</h3><span className="text-xs text-slate-500">4 מערכות</span></div>
              <div className="space-y-3">
                {upgradeDefinitions.map((item) => {
                  const Icon = item.icon;
                  const current = upgrades[item.key];
                  const maxed = current >= item.max;
                  return <div key={item.key} className="rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4">
                    <div className="flex items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-400/10 text-sky-300"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="font-extrabold">{item.label}</div><div className="mt-0.5 text-xs text-slate-400">{item.description}</div></div><div className="text-left"><div className="text-xs font-black text-sky-200">רמה {current}/{item.max}</div><div className="mt-1 text-[10px] text-slate-500">{maxed ? 'מקסימום' : item.cost.toLocaleString('he-IL') + ' מטבעות'}</div></div></div>
                    <div className="mt-3 flex gap-1.5">{Array.from({ length: item.max }, (_, index) => <div key={index} className={'h-1.5 flex-1 rounded-full ' + (index < current ? 'bg-sky-400' : 'bg-white/10')} />)}</div>
                    <button disabled={maxed} onClick={() => upgradeOne(item.key)} className="mt-3 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-sky-300/20 bg-sky-400/[0.08] text-xs font-extrabold text-sky-200 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:border-white/[0.06] disabled:bg-white/[0.025] disabled:text-slate-600">{maxed ? <Check className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}{maxed ? 'שודרג למקסימום' : 'שדרג מערכת'}</button>
                  </div>;
                })}
              </div>
              <button onClick={upgradeAll} className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-emerald-400 to-teal-600 font-black text-slate-950 active:scale-[0.98]"><Zap className="h-5 w-5" /> שדרוג כל המערכות</button>
            </main>
            <nav className="border-t border-white/[0.08] bg-[#080e17]/95 p-3 pb-[max(10px,env(safe-area-inset-bottom))]"><button onClick={() => setActiveTab('main')} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-white/[0.06] font-bold text-slate-200 active:scale-[0.98]"><ArrowLeft className="h-4 w-4" /> חזרה לתפריט</button></nav>
          </>
        )}

        {activeTab === 'profile' && (
          <>
            <header className="px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))]"><Header title="פרופיל טייס" subtitle="הנתונים שלך במשחק" /></header>
            <main className="flex-1 overflow-y-auto px-4 pb-5">
              <div className="rounded-[26px] border border-sky-300/15 bg-gradient-to-br from-[#142b40] to-[#0b1420] p-5 text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] border border-sky-300/20 bg-sky-400/10 text-sky-300"><User className="h-9 w-9" /></div>
                <h2 className="mt-4 text-xl font-black">טייס חיל האוויר</h2><p className="mt-1 text-sm text-sky-200">דרגה {level}</p>
                <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-black/20 p-3"><div className="text-xs text-slate-400">ניקוד</div><div className="mt-1 text-xl font-black">{Math.max(0, score).toLocaleString('he-IL')}</div></div><div className="rounded-2xl bg-black/20 p-3"><div className="text-xs text-slate-400">מטבעות</div><div className="mt-1 text-xl font-black text-amber-300">{coins.toLocaleString('he-IL')}</div></div><div className="rounded-2xl bg-black/20 p-3"><div className="text-xs text-slate-400">מטוסים בבעלות</div><div className="mt-1 text-xl font-black">{ownedPlanes.length}</div></div><div className="rounded-2xl bg-black/20 p-3"><div className="text-xs text-slate-400">שדרוגים</div><div className="mt-1 text-xl font-black">{Object.values(upgrades).reduce((sum, value) => sum + value, 0)}</div></div></div>
              </div>
              <button onClick={() => onOpenDiagnostics?.()} className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] font-bold text-slate-200 active:scale-[0.98]"><Settings className="h-5 w-5" /> הגדרות ואבחון</button>
              <button onClick={() => setActiveTab('main')} className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 font-black text-white active:scale-[0.98]"><ArrowLeft className="h-4 w-4" /> חזרה לתפריט</button>
            </main>
          </>
        )}

        {notice && <div role="status" className="absolute bottom-[calc(env(safe-area-inset-bottom)+86px)] left-4 right-4 z-50 rounded-2xl border border-sky-300/20 bg-[#132437]/95 px-4 py-3 text-center text-sm font-bold text-white shadow-2xl backdrop-blur">{notice}</div>}
      </div>
    </div>
  );
}
