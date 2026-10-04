import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Cloud,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  ShieldAlert,
  Info
} from 'lucide-react';
import { safeFetchJson } from '../services/apiHelper';

export interface StorageStats {
  usedBytes: number;
  quotaBytes: number;
  freeBytes: number;
  percentUsed: number;
  usedFormatted: string;
  quotaFormatted: string;
  freeFormatted: string;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  warningMessage: string | null;
  stats?: {
    projectsCount: number;
    photosCount: number;
    momentsCount: number;
    usersCount: number;
  };
}

interface LocalStorageEstimate {
  usedFormatted: string;
  quotaFormatted: string;
  percentUsed: number;
}

export const StorageStatusWidget: React.FC<{
  compact?: boolean;
  className?: string;
}> = ({ compact = false, className = '' }) => {
  const [cloudStats, setCloudStats] = useState<StorageStats | null>(null);
  const [localEstimate, setLocalEstimate] = useState<LocalStorageEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      // Fetch cloud stats from server
      const res = await safeFetchJson<StorageStats>('/api/system/storage-stats');
      if (res.ok && res.data) {
        setCloudStats(res.data);
      }

      // Fetch device local indexedDB estimate if available
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 1;
        const pct = Number(((used / quota) * 100).toFixed(1));

        const formatBytes = (bytes: number) => {
          if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
          if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
          return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
        };

        setLocalEstimate({
          usedFormatted: formatBytes(used),
          quotaFormatted: formatBytes(quota),
          percentUsed: pct,
        });
      }
    } catch {
      // Offline fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const pct = cloudStats?.percentUsed || 0;
  const isWarning = pct >= 75 || cloudStats?.status === 'WARNING';
  const isCritical = pct >= 90 || cloudStats?.status === 'CRITICAL';

  const barColor = isCritical
    ? 'bg-rose-500'
    : isWarning
    ? 'bg-amber-400'
    : 'bg-emerald-500';

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        <Cloud className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span className="font-mono text-slate-300">
          {cloudStats ? `${cloudStats.usedFormatted} / ${cloudStats.quotaFormatted} (${pct}%)` : 'Kontrollerar utrymme...'}
        </span>
        {isCritical ? (
          <span className="text-[10px] font-bold text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800">
            Fullt!
          </span>
        ) : isWarning ? (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
            Varning
          </span>
        ) : (
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
            Gott om plats
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-[#0d121c] border-2 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl ${
      isCritical
        ? 'border-rose-500/80 bg-rose-950/20'
        : isWarning
        ? 'border-amber-500/80 bg-amber-950/20'
        : 'border-slate-800'
    } ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border font-bold ${
            isCritical
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              : isWarning
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
          }`}>
            <Cloud className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-white leading-tight">
              Lagring & Molnutrymme
            </h4>
            <p className="text-xs text-slate-400">
              Synkat utrymme för projekt, foton och checklistor
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          disabled={isLoading}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
          title="Uppdatera mätare"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>

      {/* Warning banner if high */}
      {isCritical ? (
        <div className="bg-rose-950/80 border border-rose-600 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider text-rose-300 block">
              Varning: Molnutrymmet är nästan fullt ({pct}%)!
            </span>
            <p className="leading-relaxed">
              Exportera en säkerhetskopia eller rensa gamla testprojekt för att säkerställa att nya foton och moment kan sparas.
            </p>
          </div>
        </div>
      ) : isWarning ? (
        <div className="bg-amber-950/80 border border-amber-600 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider text-amber-300 block">
              Obs: Utrymmet börjar bli fyllt ({pct}%)
            </span>
            <p className="leading-relaxed">
              Överväg att arkivera äldre projekt så att du har gott om plats kvar för nya elevövningar.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-300">
          <span className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Gott om plats kvar
          </span>
          <span className="font-mono text-[11px] text-emerald-400">
            {cloudStats ? `${(100 - pct).toFixed(1)}% ledigt` : ''}
          </span>
        </div>
      )}

      {/* Cloud Storage Progress Meter */}
      <div className="space-y-2 bg-[#090d15] p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-sky-400" /> Molnutrymme (Server & Gruppsynk):
          </span>
          <span className="font-mono font-black text-white">
            {cloudStats ? `${pct}%` : '0%'}
          </span>
        </div>

        {/* Visual Bar */}
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80">
          <div
            className={`h-full transition-all duration-500 rounded-full ${barColor}`}
            style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
          />
        </div>

        {/* Figures (Siffror i MB och kvar) */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
          <span>
            Använt: <strong className="text-white">{cloudStats?.usedFormatted || '0.00 MB'}</strong> av {cloudStats?.quotaFormatted || '1 000 MB'}
          </span>
          <span>
            Ledigt: <strong className="text-emerald-400">{cloudStats?.freeFormatted || '1 000 MB'}</strong>
          </span>
        </div>
      </div>

      {/* Device Local Storage (Mobile IndexedDB) */}
      {localEstimate && (
        <div className="flex items-center justify-between text-xs bg-[#090d15] p-3 rounded-xl border border-slate-800/80 text-slate-300">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold block">Offline-minne på denna enhet:</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {localEstimate.usedFormatted} använt av {localEstimate.quotaFormatted} ({localEstimate.percentUsed}%)
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
            Sparat lokalt
          </span>
        </div>
      )}

      {/* Project Statistics */}
      {cloudStats?.stats && (
        <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
          <div className="bg-[#121824] p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Projekt</span>
            <span className="text-sm font-black text-white font-mono">{cloudStats.stats.projectsCount} st</span>
          </div>
          <div className="bg-[#121824] p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Foton</span>
            <span className="text-sm font-black text-emerald-400 font-mono">{cloudStats.stats.photosCount} st</span>
          </div>
          <div className="bg-[#121824] p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Moment</span>
            <span className="text-sm font-black text-sky-400 font-mono">{cloudStats.stats.momentsCount} st</span>
          </div>
        </div>
      )}

    </div>
  );
};
