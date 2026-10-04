import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { getDeletedProjects, restoreProject, permanentDeleteProject, emptyTrash } from '../db/indexedDb';
import { Trash2, RotateCcw, X, AlertTriangle, FolderOpen, Calendar, MapPin, CheckCircle2 } from 'lucide-react';

interface TrashBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectsChanged: () => void;
}

export const TrashBinModal: React.FC<TrashBinModalProps> = ({
  isOpen,
  onClose,
  onProjectsChanged,
}) => {
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadDeleted = async () => {
    try {
      setIsLoading(true);
      const list = await getDeletedProjects();
      setDeletedProjects(list);
    } catch (e) {
      console.error('Kunde inte läsa papperskorg:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDeleted();
      setActionSuccess(null);
    }
  }, [isOpen]);

  const handleRestore = async (id: string, name: string) => {
    await restoreProject(id);
    setActionSuccess(`Projektet "${name}" har återställts till dina aktiva projekt!`);
    await loadDeleted();
    onProjectsChanged();
  };

  const handlePermanentDelete = async (id: string, name: string) => {
    if (confirm(`Vill du ta bort projektet "${name}" permanent? Denna åtgärd kan inte ångras.`)) {
      await permanentDeleteProject(id);
      setActionSuccess(`Projektet "${name}" har raderats permanent.`);
      await loadDeleted();
      onProjectsChanged();
    }
  };

  const handleEmptyAll = async () => {
    if (deletedProjects.length === 0) return;
    if (confirm(`Vill du tömma hela papperskorgen (${deletedProjects.length} projekt)? All data raderas permanent.`)) {
      await emptyTrash();
      setActionSuccess('Papperskorgen har tömts helt.');
      await loadDeleted();
      onProjectsChanged();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#10131d] border border-slate-700/90 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl flex flex-col space-y-4 my-auto max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Papperskorg för borttagna projekt
                </h3>
                <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {deletedProjects.length} st
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Här samlas projekt som raderats. Du kan återställa dem när som helst.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action notification */}
        {actionSuccess && (
          <div className="bg-emerald-950/80 border border-emerald-600/70 rounded-xl p-3 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-[220px] max-h-[55vh] pr-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
              <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2" />
              <span>Hämtar papperskorgen...</span>
            </div>
          ) : deletedProjects.length === 0 ? (
            <div className="bg-slate-950/70 border border-slate-850 rounded-xl p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto text-xl">
                🗑️
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-200">
                Papperskorgen är tom
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                När du tar bort ett projekt från instrumentpanelen hamnar det här så att du aldrig råkar förlora dina mätvärden och foton av misstag.
              </p>
            </div>
          ) : (
            deletedProjects.map((p) => {
              const completedMoments = Object.values(p.moments || {}).filter(
                (m) => m.status === 'GREEN'
              ).length;
              const totalMoments = Object.keys(p.moments || {}).length;

              return (
                <div
                  key={p.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
                        {p.projectType}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Raderad: {p.deletedAt || 'Nyligen'}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white truncate">
                      {p.name}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {p.propertyDesignation}
                      </span>
                      <span>•</span>
                      <span>
                        {completedMoments} av {totalMoments} moment klara
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-850">
                    <button
                      type="button"
                      onClick={() => handleRestore(p.id, p.name)}
                      className="min-h-[38px] px-3.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95"
                      title="Återställ projektet så att det syns i projektlistan igen"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Återställ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePermanentDelete(p.id, p.name)}
                      className="min-h-[38px] px-3 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 rounded-xl flex items-center justify-center gap-1 text-xs cursor-pointer transition-colors"
                      title="Ta bort permanent från hårddisken"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Radera permanent</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
          {deletedProjects.length > 0 ? (
            <button
              type="button"
              onClick={handleEmptyAll}
              className="text-rose-400 hover:text-rose-300 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Töm hela papperskorgen</span>
            </button>
          ) : (
            <span className="text-slate-500">Inga raderade projekt sparade.</span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-xl cursor-pointer"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
