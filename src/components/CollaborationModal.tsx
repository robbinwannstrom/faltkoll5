import React, { useRef, useState } from 'react';
import { Project } from '../types';
import { saveProject } from '../db/indexedDb';
import { StorageStatusWidget } from './StorageStatusWidget';
import { safeFetchJson } from '../services/apiHelper';
import {
  Share2,
  Upload,
  Download,
  Users,
  CheckCircle2,
  X,
  FileCode,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Cloud,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

interface CollaborationModalProps {
  project?: Project;
  onClose: () => void;
  onProjectImported?: (importedProject: Project) => void;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  project,
  onClose,
  onProjectImported,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [joinCode, setJoinCode] = useState(() => {
    try {
      return localStorage.getItem('falthjalp_saved_group_code') || '';
    } catch {
      return '';
    }
  });
  const [customCode, setCustomCode] = useState(
    project?.groupCode || `KLASS-${project?.id.slice(-4).toUpperCase() || 'PROJ'}`
  );
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentCode = customCode.trim().toUpperCase();

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(currentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeToUse = joinCode.trim().toUpperCase();
    if (!codeToUse) return;

    try {
      setIsJoining(true);
      setMessage(null);

      // Save code in localStorage so user only needs to enter it once!
      try {
        localStorage.setItem('falthjalp_saved_group_code', codeToUse);
      } catch {}

      const res = await safeFetchJson<{ project: Project }>('/api/sync/join-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToUse }),
      });

      if (res.ok && res.data?.project) {
        const imported = res.data.project;
        await saveProject(imported);
        setMessage({ text: `Projekt "${imported.name}" har hämtats från molnet och koden sparades!` });
        if (onProjectImported) {
          setTimeout(() => {
            onProjectImported(imported);
          }, 800);
        }
      } else {
        setMessage({ text: res.error || 'Hittade inget projekt med den koden.', isError: true });
      }
    } catch (err: any) {
      setMessage({ text: 'Kunde inte ansluta till molnservern: ' + (err?.message || 'Kontrollera anslutningen'), isError: true });
    } finally {
      setIsJoining(false);
    }
  };

  const handleSyncCurrentProject = async () => {
    if (!project) return;
    try {
      setIsSyncing(true);
      setMessage(null);

      const updatedProj: Project = {
        ...project,
        groupCode: currentCode,
        isGroupProject: true,
        syncEnabled: true,
      };

      const res = await safeFetchJson<{ project: Project }>('/api/sync/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: updatedProj }),
      });

      if (res.ok && res.data?.project) {
        await saveProject(res.data.project);
        setMessage({
          text: `Projektet är synkat! Kollegor och elever kan ansluta med kod "${currentCode}".`,
        });
        if (onProjectImported) {
          onProjectImported(res.data.project);
        }
      } else {
        await saveProject(updatedProj);
        setMessage({
          text: 'Projektet sparades säkert lokalt på enheten (molnsynk är offline eller startar upp).',
        });
      }
    } catch (err: any) {
      await saveProject(project);
      setMessage({ text: 'Sparat lokalt på enheten: ' + (err?.message || 'Offline'), isError: false });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportProjectFile = () => {
    if (!project) return;
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '_')}_Delning.faltkoll`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text) as Project;
      if (!imported.id || !imported.moments) {
        throw new Error('Ogiltigt projektformat. Filen saknar moment eller projekt-ID.');
      }
      await saveProject(imported);
      setMessage({ text: `Projekt "${imported.name}" har importerats från fil!` });
      if (onProjectImported) {
        onProjectImported(imported);
      }
    } catch (err: any) {
      setMessage({ text: 'Kunde inte importera projekt: ' + (err?.message || 'Fel i filen'), isError: true });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto text-slate-100"
    >
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,.faltkoll"
        onChange={handleImportFile}
        className="hidden"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12151e] border border-slate-700/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Direktsynkning & Grupparbete
              </h3>
              <p className="text-xs text-slate-400">
                Synka kontroller, fältblock och foton direkt utan manuella filer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message notification */}
        {message && (
          <div
            className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-2 ${
              message.isError
                ? 'bg-rose-950/80 border-rose-700 text-rose-200'
                : 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
            }`}
          >
            {message.isError ? (
              <X className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Section 1: Anslut med Gruppkod (Supersmidigt!) */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cloud className="w-4 h-4" />
              1. Anslut till ett projekt med gruppkod
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Har du fått en gruppkod av din lärare eller klasskamrat? Skriv in den här för att hämta projektet direkt till din telefon:
          </p>

          <form onSubmit={handleJoinWithCode} className="flex gap-2">
            <input
              type="text"
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="T.ex. BYGG-4A"
              className="flex-1 min-h-[44px] px-3.5 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-xl text-white font-mono font-bold text-sm outline-none uppercase placeholder-slate-600"
            />
            <button
              type="submit"
              disabled={isJoining}
              className="min-h-[44px] px-4 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
            >
              {isJoining ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>{isJoining ? 'Hämtar...' : 'Anslut nu'}</span>
            </button>
          </form>
        </div>

        {/* Section 2: Aktivt projekt & dela kod */}
        {project ? (
          <div className="bg-[#151926] border border-amber-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-4 h-4" />
                2. Dela detta projekt ({project.name})
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Klicka på knappen nedan för att synka projektet och få en gruppkod som kamraterna kan ansluta till:
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">
                    Gruppkod för detta projekt (du kan välja koden själv):
                  </span>
                  {isEditingCode ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                        placeholder="T.ex. KLASS-3B"
                        className="px-2.5 py-1 bg-slate-900 border border-amber-500 rounded-lg text-white font-mono text-sm font-bold uppercase outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditingCode(false)}
                        className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Spara kod
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-mono font-bold text-amber-300">
                        {currentCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingCode(true)}
                        className="text-[11px] text-amber-400 hover:underline cursor-pointer ml-1 font-semibold"
                      >
                        [Välj egen kod]
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="min-h-[36px] px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCode ? 'Kopierad!' : 'Kopiera kod'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncCurrentProject}
                    disabled={isSyncing}
                    className="min-h-[36px] px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Synkar...' : 'Synka nu'}</span>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Alla elever anger denna kod 1 gång under "Anslut till befintligt projekt" ovan. Koden sparas automatiskt i telefonen så den inte behöver anges igen.
              </p>
            </div>

            {project.lastSyncedAt && (
              <span className="text-[11px] text-slate-400 block font-mono">
                Senast synkad till molnet: {project.lastSyncedAt}
              </span>
            )}

            {/* Molnutrymmes-mätare och fyllnadsgrad */}
            <StorageStatusWidget />
          </div>
        ) : null}

        {/* Section 3: Reserv Fil-export & Import */}
        <div className="pt-1 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Offline-delning via fil:</span>
            <div className="flex items-center gap-2">
              {project && (
                <button
                  type="button"
                  onClick={handleExportProjectFile}
                  className="text-sky-400 hover:underline cursor-pointer"
                >
                  Exportera .faltkoll
                </button>
              )}
              <span>•</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sky-400 hover:underline cursor-pointer"
              >
                Öppna fil
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-xl cursor-pointer text-xs"
          >
            Klar
          </button>
        </div>
      </div>
    </div>
  );
};
