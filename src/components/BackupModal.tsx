import React, { useState, useEffect } from 'react';
import { Project, UserSettings } from '../types';
import { getAllProjects, saveProject } from '../db/indexedDb';
import {
  Database,
  Download,
  Upload,
  X,
  Check,
  AlertCircle,
  Cloud,
  CloudUpload,
  CloudDownload,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import {
  initGoogleAuth,
  signInWithGoogle,
  signOutFromGoogle,
  saveProjectsToGoogleDrive,
  listGoogleDriveBackups,
  restoreProjectsFromGoogleDrive,
  getGoogleAccessToken,
} from '../services/googleWorkspace';
import { User } from 'firebase/auth';
import { StorageStatusWidget } from './StorageStatusWidget';

interface BackupModalProps {
  onClose: () => void;
  onDataChanged: () => void;
  userSettings?: UserSettings;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  onClose,
  onDataChanged,
  userSettings,
}) => {
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Google Workspace Auth & Cloud Sync State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isListingBackups, setIsListingBackups] = useState(false);
  const [driveBackups, setDriveBackups] = useState<
    Array<{ id: string; name: string; modifiedTime: string; size?: string }>
  >([]);
  const [showDriveList, setShowDriveList] = useState(false);

  // Confirmation dialog state for destructive/mutating actions
  const [pendingConfirmAction, setPendingConfirmAction] = useState<{
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    // Check if Google token is already cached or user is authenticated
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setIsGoogleConnected(!!token);
      },
      () => {
        setGoogleUser(null);
        setIsGoogleConnected(false);
      }
    );

    // Initial token check
    getGoogleAccessToken().then((tok) => {
      setIsGoogleConnected(!!tok);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleConnectGoogle = async () => {
    setStatusMsg(null);
    setIsSyncing(true);
    try {
      const res = await signInWithGoogle();
      setGoogleUser(res.user);
      setIsGoogleConnected(true);
      setStatusMsg({
        text: `Ansluten till Google som ${res.user.email}! Nu kan du spara direkt till Google Drive.`,
        type: 'success',
      });
    } catch (err: any) {
      setStatusMsg({
        text: 'Kunde inte ansluta till Google: ' + (err.message || 'Okänt fel'),
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await signOutFromGoogle();
      setGoogleUser(null);
      setIsGoogleConnected(false);
      setShowDriveList(false);
      setStatusMsg({
        text: 'Google-kontot har kopplats från.',
        type: 'success',
      });
    } catch (err: any) {
      setStatusMsg({ text: 'Fel vid frånkoppling: ' + err.message, type: 'error' });
    }
  };

  // 1. Save all projects to Google Drive (with explicit user confirmation)
  const promptSaveToDrive = async () => {
    const allProjects = await getAllProjects();
    setPendingConfirmAction({
      title: 'Spara till Google Drive',
      description: `Vill du skapa en komplett säkerhetskopia med ${allProjects.length} projekt och ladda upp den till din personliga Google Drive?`,
      confirmText: 'Spara till Drive',
      onConfirm: async () => {
        setIsSyncing(true);
        setStatusMsg(null);
        try {
          const result = await saveProjectsToGoogleDrive(allProjects, userSettings);
          setStatusMsg({
            text: `Sparat! Säkerhetskopian "${result.name}" har laddats upp till din Google Drive.`,
            type: 'success',
          });
        } catch (err: any) {
          setStatusMsg({
            text: 'Fel vid uppladdning till Google Drive: ' + err.message,
            type: 'error',
          });
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  // 2. Fetch list of backups from Google Drive
  const handleFetchDriveBackups = async () => {
    setIsListingBackups(true);
    setStatusMsg(null);
    try {
      const files = await listGoogleDriveBackups();
      setDriveBackups(files);
      setShowDriveList(true);
      if (files.length === 0) {
        setStatusMsg({
          text: 'Inga tidigare säkerhetskopior hittades på din Google Drive.',
          type: 'success',
        });
      }
    } catch (err: any) {
      setStatusMsg({
        text: 'Kunde inte hämta filer från Google Drive: ' + err.message,
        type: 'error',
      });
    } finally {
      setIsListingBackups(false);
    }
  };

  // 3. Restore projects from Google Drive (with explicit user confirmation)
  const promptRestoreFromDrive = (fileId: string, fileName: string) => {
    setPendingConfirmAction({
      title: 'Återställ projekt från Google Drive',
      description: `Är du säker på att du vill läsa in säkerhetskopian "${fileName}"? Befintliga projekt med samma ID kommer att uppdateras.`,
      confirmText: 'Återställ projekt',
      onConfirm: async () => {
        setIsSyncing(true);
        setStatusMsg(null);
        try {
          const restoredProjects = await restoreProjectsFromGoogleDrive(fileId);
          for (const proj of restoredProjects) {
            if (proj.id && proj.name && proj.moments) {
              await saveProject(proj);
            }
          }
          setStatusMsg({
            text: `Återställde ${restoredProjects.length} projekt från "${fileName}"!`,
            type: 'success',
          });
          onDataChanged();
          setShowDriveList(false);
        } catch (err: any) {
          setStatusMsg({
            text: 'Kunde inte återställa från Google Drive: ' + err.message,
            type: 'error',
          });
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  // Local JSON Export
  const handleExportAll = async () => {
    try {
      const allProjects = await getAllProjects();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allProjects, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `Falthjalp_Sakerhetskopia_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatusMsg({
        text: `Säkerhetskopia med ${allProjects.length} projekt har laddats ner till din enhet!`,
        type: 'success',
      });
    } catch (err: any) {
      setStatusMsg({ text: 'Fel vid export: ' + err.message, type: 'error' });
    }
  };

  // Local JSON Import
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const projectsList = Array.isArray(json) ? json : json.projects;
        if (!Array.isArray(projectsList)) {
          throw new Error('Ogiltigt format på backupfilen. Måste vara en JSON-fil med projekt.');
        }

        for (const proj of projectsList) {
          if (proj.id && proj.name && proj.moments) {
            await saveProject(proj);
          }
        }

        setStatusMsg({
          text: `Återställde ${projectsList.length} projekt från lokal fil!`,
          type: 'success',
        });
        onDataChanged();
      } catch (err: any) {
        setStatusMsg({ text: 'Import misslyckades: ' + err.message, type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12141a] border border-[#2c2f38] rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl space-y-6 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center">
              <Cloud className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">
                Säkerhetskopia & Molnsynk
              </h3>
              <p className="text-xs text-slate-400">
                Spara dina projekt till Google Drive eller lokal fil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`p-3.5 rounded-2xl border font-bold text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500 text-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{statusMsg.text}</span>
          </div>
        )}

        {/* LAGRINGSSTATUS & KAPACITETSMÄTARE */}
        <StorageStatusWidget />

        {/* SECTION 1: GOOGLE DRIVE & GMAIL SYNCHRONIZATION */}
        <div className="bg-[#171a22] border border-[#2b303c] rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white flex items-center gap-2">
                <Cloud className="w-4 h-4 text-orange-400" />
                <span>Google Drive & Gmail Synk</span>
              </span>
            </div>
            {isGoogleConnected && (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Ansluten
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Koppla ditt Google-konto för att automatiskt spara och synka dina projekt och egenkontroller till din Google Drive, samt skicka rapporter direkt via Gmail.
          </p>

          {!isGoogleConnected ? (
            /* Sign in with Google (Standard button pattern) */
            <div className="pt-1">
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isSyncing}
                className="w-full min-h-[48px] px-4 bg-white hover:bg-slate-100 active:scale-98 text-slate-900 font-bold text-sm rounded-xl flex items-center justify-center gap-3 cursor-pointer shadow-md transition-all"
              >
                {/* Official Google 'G' icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isSyncing ? 'Ansluter till Google...' : 'Anslut Google Drive & Gmail'}</span>
              </button>
            </div>
          ) : (
            /* When Connected to Google */
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[11px]">Kopplat Google-konto:</span>
                  <span className="font-bold text-white truncate block">
                    {googleUser?.displayName || googleUser?.email || 'Google-användare'}
                  </span>
                  <span className="text-slate-500 text-[10px] block truncate">
                    {googleUser?.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectGoogle}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 font-bold rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors text-xs shrink-0"
                  title="Koppla från Google-kontot"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Koppla från</span>
                </button>
              </div>

              {/* Cloud Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={promptSaveToDrive}
                  disabled={isSyncing}
                  className="min-h-[46px] px-3.5 bg-orange-500 hover:bg-orange-400 active:scale-98 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-500/20 transition-all"
                >
                  <CloudUpload className="w-4 h-4 stroke-[2.5]" />
                  <span>Spara till Google Drive</span>
                </button>

                <button
                  type="button"
                  onClick={handleFetchDriveBackups}
                  disabled={isListingBackups}
                  className="min-h-[46px] px-3.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <CloudDownload className="w-4 h-4 text-orange-400" />
                  <span>{isListingBackups ? 'Söker...' : 'Hämta från Drive'}</span>
                </button>
              </div>

              {/* Drive Backups List */}
              {showDriveList && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 mt-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-slate-300">
                      Säkerhetskopior på Google Drive ({driveBackups.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDriveList(false)}
                      className="text-slate-500 hover:text-white"
                    >
                      Dölj
                    </button>
                  </div>

                  {driveBackups.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      Inga FältKoll-backuper hittades på Google Drive ännu. Klicka på "Spara till Google Drive" ovan för att skapa en!
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {driveBackups.map((f) => (
                        <div
                          key={f.id}
                          className="p-2 bg-slate-800/80 rounded-lg flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">{f.name}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(f.modifiedTime).toLocaleDateString('sv-SE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => promptRestoreFromDrive(f.id, f.name)}
                            className="px-2.5 py-1 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-lg cursor-pointer shrink-0"
                          >
                            Återställ
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: LOCAL OFFLINE BACKUP (JSON) */}
        <div className="bg-[#171a22] border border-[#2b303c] rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-400" />
            <h4 className="text-sm font-bold text-white">Lokal export & import (Offline)</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Du kan när som helst ladda ner en `.json`-fil direkt till din telefon eller dator utan att ansluta något konto.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleExportAll}
              className="min-h-[46px] px-3.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4 text-orange-400" />
              <span>Ladda ner JSON-fil</span>
            </button>

            <label className="min-h-[46px] px-3.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-orange-400" />
              <span>Importera JSON-fil</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="min-h-[44px] px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 cursor-pointer text-sm"
          >
            Stäng
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Mutating/Cloud Actions (Mandatory per Skill guidelines) */}
      {pendingConfirmAction && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setPendingConfirmAction(null);
          }}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#151720] border-2 border-orange-500 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <h4 className="text-lg font-black text-white flex items-center gap-2">
              <Cloud className="w-5 h-5 text-orange-400" />
              <span>{pendingConfirmAction.title}</span>
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {pendingConfirmAction.description}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPendingConfirmAction(null)}
                className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={async () => {
                  const act = pendingConfirmAction.onConfirm;
                  setPendingConfirmAction(null);
                  await act();
                }}
                className="min-h-[44px] px-5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-black cursor-pointer shadow-lg shadow-orange-500/20"
              >
                {pendingConfirmAction.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
