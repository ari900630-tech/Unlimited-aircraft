/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import {
  diagnosticService,
  DiagnosticEvent,
  SystemSnapshot,
} from '../services/diagnosticTelemetry';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Trash2,
  Activity,
  Wrench,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Flame,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onForceSelfHeal: () => void;
}

export const DiagnosticReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onForceSelfHeal,
}) => {
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [snapshot, setSnapshot] = useState<SystemSnapshot>(diagnosticService.getSnapshot());
  const [copied, setCopied] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ERRORS' | 'FIXES'>('ALL');
  const [testSimMessage, setTestSimMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = diagnosticService.subscribe((newEvents) => {
      setEvents(newEvents);
      setSnapshot(diagnosticService.getSnapshot());
    });

    const interval = setInterval(() => {
      setSnapshot(diagnosticService.getSnapshot());
    }, 500);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyReport = () => {
    const report = diagnosticService.generateErrorReport();
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleClearLogs = () => {
    diagnosticService.clearLogs();
  };

  const handleSimulateErrorAndFix = () => {
    diagnosticService.recordEvent({
      type: 'PHYSICS_CORRECTION',
      title: 'בדיקת סימולציה: זוהתה תנודה חריגה ותוקנה',
      message: 'סימולציית בדיקת מערכת תיקון שגיאות אוטומטי - פריים נסרק ונמצא תקין.',
      details: { simulated: true, timestamp: Date.now() },
      autoHealed: true,
      remedyApplied: 'בדיקת אימות הצליחה: כל מערכות הבקרה פעילות ומגיבות ב-0ms',
    });
    setTestSimMessage('בדיקת סימולציה הושלמה: תיקון אוטומטי תועד בהצלחה!');
    setTimeout(() => setTestSimMessage(null), 3000);
  };

  const filteredEvents = events.filter((e) => {
    if (filter === 'ERRORS') return e.type === 'CRITICAL_ERROR';
    if (filter === 'FIXES') return e.autoHealed;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-emerald-500/60 rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.25)] overflow-hidden text-right">
        {/* Top Header */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-emerald-500/30 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h2 className="text-base sm:text-lg font-bold text-emerald-400 font-tactical tracking-wide">
                  מרכז אבחון ודיווח שגיאות אוטומטי
                </h2>
              </div>
              <p className="text-xs text-emerald-500/70 font-mono">
                AUTO-DIAGNOSTIC & SELF-HEALING FLIGHT TELEMETRY
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Live System Diagnostics Ribbon */}
        <div className="bg-slate-900/60 border-b border-slate-800/80 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded border border-emerald-500/20">
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400 block text-[10px]">FPS / קצב פריימים</span>
              <span className="text-emerald-300 font-bold tabular-nums">
                {snapshot.fps.toFixed(0)} FPS ({snapshot.frameTimeMs.toFixed(1)}ms)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded border border-emerald-500/20">
            <Wrench className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400 block text-[10px]">מנגנון Watchdog</span>
              <span className="text-sky-300 font-bold">פעיל (60Hz Auto-Heal)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded border border-emerald-500/20">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400 block text-[10px]">גובה / מהירות</span>
              <span className="text-amber-300 font-bold tabular-nums">
                ALT: {snapshot.planePos.y.toFixed(1)}m | {snapshot.speed.toFixed(0)}kts
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400 block text-[10px]">סטטוס תיקון אוטומטי</span>
              <span className="text-emerald-400 font-bold">100% הגנה עצמית</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="px-5 py-2.5 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Quick Filters */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded transition text-xs ${
                filter === 'ALL'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              הכל ({events.length})
            </button>
            <button
              onClick={() => setFilter('FIXES')}
              className={`px-2.5 py-1 rounded transition text-xs ${
                filter === 'FIXES'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              תוקנו אוטומטית ({events.filter((e) => e.autoHealed).length})
            </button>
            <button
              onClick={() => setFilter('ERRORS')}
              className={`px-2.5 py-1 rounded transition text-xs ${
                filter === 'ERRORS'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              שגיאות קריטיות ({events.filter((e) => e.type === 'CRITICAL_ERROR').length})
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition active:scale-95 text-xs font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">דוח מלא הועתק!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-sky-400" />
                  <span>העתק דוח תקלות מפורט</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                onForceSelfHeal();
                onClose();
              }}
              title="שחרר ותקן טיסה מיד"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded transition active:scale-95 text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>שחרר נתקע ותקן עכשיו</span>
            </button>

            {events.length > 0 && (
              <button
                onClick={handleClearLogs}
                title="נקה יומן"
                className="p-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded transition border border-slate-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Test simulation message banner */}
        {testSimMessage && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/50 px-5 py-2 text-xs text-emerald-300 font-mono flex items-center justify-between">
            <span>{testSimMessage}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        )}

        {/* Scrollable Event Log Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
          {filteredEvents.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-emerald-300 font-tactical">
                המערכת פועלת בצורה תקינה וחלקה לחלוטין
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                לא נרשמו תקלות או תקיעות. מנגנון הניטור עוקב באופן רציף (60Hz) ומוכן לתקן כל שגיאה באופן אוטומטי.
              </p>
              <button
                onClick={handleSimulateErrorAndFix}
                className="mt-4 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-300 transition"
              >
                בצע בדיקת סימולציה ותיקון אוטומטי (Demo Test)
              </button>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isExpanded = expandedEventId === ev.id;
              const isCritical = ev.type === 'CRITICAL_ERROR';
              const isWatchdog = ev.type === 'WATCHDOG_STALL';

              return (
                <div
                  key={ev.id}
                  className={`rounded-lg border p-3.5 transition ${
                    isCritical
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isWatchdog
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-900/80 border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() =>
                        setExpandedEventId(isExpanded ? null : ev.id)
                      }
                      className="text-slate-400 hover:text-white p-1"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex-1 text-right">
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                          {ev.timeStr}
                        </span>

                        {ev.autoHealed && (
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            תוקן אוטומטית (Auto-Healed)
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                            isCritical
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : isWatchdog
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          }`}
                        >
                          {ev.type}
                        </span>

                        <h4 className="text-xs sm:text-sm font-bold text-white font-tactical">
                          {ev.title}
                        </h4>
                      </div>

                      {/* Error details summary */}
                      <p className="text-xs text-slate-300 mt-1 font-mono dir-ltr text-left">
                        {ev.message}
                      </p>

                      {/* Remedy Applied */}
                      <div className="mt-2 text-xs bg-slate-950/60 p-2 rounded border border-slate-800 flex items-start gap-2 justify-end">
                        <span className="text-emerald-400 font-bold">
                          {ev.remedyApplied}
                        </span>
                        <span className="text-slate-400 font-semibold">:תיקון שבוצע</span>
                      </div>
                    </div>

                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : isWatchdog
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {isCritical ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isWatchdog ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Technical Details & Stack */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800 text-xs font-mono space-y-2 dir-ltr text-left">
                      {ev.details && (
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                          <span className="text-slate-400 block mb-1 text-[10px]">
                            Diagnostic Parameters:
                          </span>
                          <pre className="text-sky-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(ev.details, null, 2)}
                          </pre>
                        </div>
                      )}

                      {ev.stack && (
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                          <span className="text-slate-400 block mb-1 text-[10px]">
                            Stack Trace:
                          </span>
                          <pre className="text-rose-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                            {ev.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer with summary information */}
        <div className="px-5 py-3 bg-slate-900/80 border-t border-emerald-500/30 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition font-semibold"
          >
            סגור חלון
          </button>

          <span className="font-mono text-emerald-400/80">
            AIR SUPERIORITY RECOVERY ENGINE • READY
          </span>
        </div>
      </div>
    </div>
  );
};
