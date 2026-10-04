import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, HardHat } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary fångade ett ohanterat fel:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAll = () => {
    try {
      localStorage.removeItem('falthjalp_current_user');
      localStorage.removeItem('faltkoll_projects_cache');
      localStorage.removeItem('falthjalp_license');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-[#181818] border-2 border-orange-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-orange-500/20 text-orange-400 border border-orange-500/40">
              <HardHat className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                FältKoll stötte på ett problem
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Ett tillfälligt fel inträffade vid visningen av appen. Dina sparade projekt finns kvar i den lokala databasen.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-3 text-left">
                <span className="text-[11px] font-mono text-rose-400 break-words block">
                  {this.state.error.message || String(this.state.error)}
                </span>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full min-h-[48px] bg-orange-500 hover:bg-orange-400 text-black font-black text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-orange-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Ladda om appen</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetAll}
                className="w-full min-h-[44px] bg-[#222222] hover:bg-[#2a2a2a] text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors border border-[#333333]"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Rensa sessionscache & starta om</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
