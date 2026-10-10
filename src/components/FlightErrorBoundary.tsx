/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { diagnosticService } from '../services/diagnosticTelemetry';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  autoRecoverCountdown: number;
}

export class FlightErrorBoundary extends Component<Props, State> {
  private timer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      autoRecoverCountdown: 3,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Record error in auto-diagnostic telemetry system
    diagnosticService.recordEvent({
      type: 'CRITICAL_ERROR',
      title: 'שגיאת רינדור ברכיב ויזואלי (React Render Crash)',
      message: error.message || 'Error occurred during 3D scene render',
      stack: error.stack,
      details: {
        componentStack: errorInfo.componentStack,
      },
      autoHealed: true,
      remedyApplied: 'הפעלת מנגנון שחזור אוטומטי וטעינה מחודשת של סביבת הטיסה',
    });

    // Start auto-recovery countdown
    this.startAutoRecover();
  }

  private startAutoRecover() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.setState((prev) => {
        if (prev.autoRecoverCountdown <= 1) {
          if (this.timer) clearInterval(this.timer);
          this.handleRecover();
          return { autoRecoverCountdown: 0 };
        }
        return { autoRecoverCountdown: prev.autoRecoverCountdown - 1 };
      });
    }, 1000);
  }

  private handleRecover = () => {
    if (this.timer) clearInterval(this.timer);
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      autoRecoverCountdown: 3,
    });
  };

  private handleCopyReport = () => {
    const report = diagnosticService.generateErrorReport();
    navigator.clipboard.writeText(report).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-white select-none">
          <div className="max-w-xl w-full bg-slate-900/95 border-2 border-rose-500/80 rounded-xl p-6 shadow-[0_0_40px_rgba(244,63,94,0.35)] backdrop-blur-xl text-right">
            <div className="flex items-center gap-3 justify-end mb-4 border-b border-rose-500/30 pb-3">
              <div>
                <h2 className="text-xl font-bold text-rose-400 font-tactical">
                  זוהתה תקלה במערכת הטיסה
                </h2>
                <p className="text-xs text-rose-300/80 font-sans">
                  מנגנון התיקון האוטומטי נכנס לפעולה
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-rose-500/20 border border-rose-500/60 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
            </div>

            {/* Error cause explanation */}
            <div className="bg-slate-950/80 border border-slate-800 rounded p-3 mb-4 text-xs font-mono text-slate-300 overflow-x-auto dir-ltr text-left">
              <span className="text-rose-400 font-bold block mb-1">
                ERROR: {this.state.error?.name || 'Error'}
              </span>
              <p className="text-rose-200">{this.state.error?.message || 'Unknown error'}</p>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded mb-5 flex items-center justify-between text-xs text-emerald-300">
              <span className="font-mono">
                שחזור אוטומטי בעוד: {this.state.autoRecoverCountdown} שניות...
              </span>
              <span className="font-bold flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                מערכת מבצעת תיקון אוטומטי
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={this.handleCopyReport}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs text-slate-200 rounded transition border border-slate-700"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>דוח תקלות הועתק!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-sky-400" />
                    <span>העתק דוח תקלות מפורט</span>
                  </>
                )}
              </button>

              <button
                onClick={this.handleRecover}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-sm font-bold text-white rounded transition shadow-[0_0_15px_rgba(225,29,72,0.5)]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>שחזר ותקן טיסה מיד</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
