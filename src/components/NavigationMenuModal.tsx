import React, { useState } from 'react';
import { UserSettings, Project, UserAccount, AppContextMode, AppLayoutMode } from '../types';
import {
  getContextVocabulary,
  getContextualRoleLabel,
  resolveAppContextMode,
} from '../utils/contextLabels';
import { StorageStatusWidget } from './StorageStatusWidget';
import {
  X,
  Compass,
  FileText,
  Bot,
  FolderOpen,
  ShieldCheck,
  Share2,
  History,
  Trash2,
  Sliders,
  Bell,
  HardHat,
  Users,
  Smartphone,
  Database,
  LogOut,
  Plus,
  Home,
  Check,
  BookOpen,
  Wrench,
  FolderKanban,
  Settings as SettingsIcon,
  ChevronRight,
  ListFilter,
  Layers,
  Sparkles,
} from 'lucide-react';

interface NavigationMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
  onUpdateUserSettings: (newSettings: UserSettings) => void;
  onOpenSettings: () => void;
  onOpenTrashBin: () => void;
  onOpenNotices: () => void;
  onOpenAccounts: () => void;
  onOpenExerciseCreator?: () => void;
  onOpenAPKExport?: () => void;
  onOpenQRCodeModal?: () => void;
  onOpenRevisions?: () => void;
  onOpenTutorial: () => void;
  onOpenPhotoArchive: () => void;
  onOpenCollaboration: () => void;
  onOpenBackup: () => void;
  onOpenGdprModal?: () => void;
  onOpenCrossMeasure?: () => void;
  onOpenQuickNotes?: () => void;
  onOpenFieldHelper?: () => void;
  onOpenFieldMonitor?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToCreate?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  activeProject?: Project;
  currentUser?: UserAccount | null;
  unreadNoticesCount?: number;
}

type MenuTab = 'TOOLS' | 'PROJECTS' | 'SETTINGS';

export const NavigationMenuModal: React.FC<NavigationMenuModalProps> = ({
  isOpen,
  onClose,
  userSettings,
  onUpdateUserSettings,
  onOpenSettings,
  onOpenTrashBin,
  onOpenNotices,
  onOpenAccounts,
  onOpenExerciseCreator,
  onOpenQRCodeModal,
  onOpenRevisions,
  onOpenTutorial,
  onOpenPhotoArchive,
  onOpenCollaboration,
  onOpenBackup,
  onOpenGdprModal,
  onOpenCrossMeasure,
  onOpenQuickNotes,
  onOpenFieldHelper,
  onOpenFieldMonitor,
  onNavigateToDashboard,
  onNavigateToCreate,
  onOpenLogin,
  onLogout,
  currentUser,
  unreadNoticesCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<MenuTab>('TOOLS');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeContextMode = resolveAppContextMode(userSettings, currentUser);
  const vocab = getContextVocabulary(activeContextMode);

  const layoutOptions: { id: AppLayoutMode; label: string; desc: string }[] = [
    { id: 'SIMPLE_LIST', label: 'Enkel lista', desc: 'Ren och avskalad' },
    { id: 'COMPACT', label: 'Tabellvy', desc: 'Tät informationsöversikt' },
    { id: 'FIELD_CLEAR', label: 'Stora kort', desc: 'Handskläge utomhus' },
    { id: 'GUIDED_STEP', label: 'Steg-vy', desc: 'Steg-för-steg fokus' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-start bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
      onClick={onClose}
    >
      <div
        className="bg-[#141414] border-r border-[#262626] w-full max-w-sm sm:max-w-md h-full flex flex-col shadow-2xl text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-4 py-3.5 border-b border-[#242424] flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold">
              <HardHat className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-black text-white text-sm tracking-tight leading-tight">
                FältKoll
              </h2>
              <p className="text-[10px] text-slate-400">
                {vocab.modeTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#222] hover:bg-[#2c2c2c] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Stäng meny"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Status Bar */}
        <div className="px-4 py-2.5 bg-[#161616] border-b border-[#222] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center font-black text-xs shrink-0 ${
                currentUser?.role === 'TEACHER'
                  ? 'bg-amber-500 text-black'
                  : currentUser?.role === 'ADMIN'
                  ? 'bg-purple-600 text-white'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
              }`}
            >
              {currentUser?.displayName ? currentUser.displayName.charAt(0) : 'A'}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-white truncate leading-tight">
                {currentUser?.displayName || userSettings.userName || 'Användare'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentUser?.schoolOrCompany || userSettings.companyName || vocab.modeTitle}
              </div>
            </div>
          </div>

          {currentUser ? (
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm shrink-0 ${
                currentUser.role === 'ADMIN'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                  : currentUser.role === 'SCHOOL_ADMIN'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : currentUser.role === 'TEACHER'
                  ? 'bg-sky-950 text-sky-300 border border-sky-800'
                  : 'bg-orange-950 text-orange-300 border border-orange-800'
              }`}
            >
              {getContextualRoleLabel(currentUser.role, activeContextMode)}
            </span>
          ) : (
            onOpenLogin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="text-xs font-bold bg-orange-500 hover:bg-orange-400 text-black px-2.5 py-1 rounded-md cursor-pointer transition-all shrink-0"
              >
                Logga in
              </button>
            )
          )}
        </div>

        {/* 3 Clean Tabs */}
        <div className="px-3 pt-3 pb-2 border-b border-[#222]">
          <div className="grid grid-cols-3 gap-1 bg-[#1a1a1a] p-1 rounded-xl border border-[#2a2a2a]">
            <button
              type="button"
              onClick={() => setActiveTab('TOOLS')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'TOOLS'
                  ? 'bg-orange-500 text-black shadow-xs font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Verktyg</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PROJECTS')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'PROJECTS'
                  ? 'bg-orange-500 text-black shadow-xs font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Projekt</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SETTINGS')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                activeTab === 'SETTINGS'
                  ? 'bg-orange-500 text-black shadow-xs font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>System</span>
              {unreadNoticesCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* TAB 1: VERKTYG */}
          {activeTab === 'TOOLS' && (
            <div className="space-y-1.5">
              <div className="px-1 pb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Fältverktyg & Kontrollstöd
                </span>
              </div>

              {/* Fältöversikt & Elevinspektion (Endast lärare och administratörer) */}
              {currentUser?.role !== 'STUDENT' && onOpenFieldMonitor && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFieldMonitor();
                  }}
                  className="w-full p-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-left flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-orange-300 group-hover:text-orange-200 flex items-center gap-1.5">
                      <span>Fältöversikt & Elevinspektion</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Se elever i fält, klassfilter & inspektion av foton
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-orange-400 shrink-0" />
                </button>
              )}

              {/* Kryssmått */}
              {onOpenCrossMeasure && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCrossMeasure();
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-amber-500/40 text-left flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-white group-hover:text-amber-300">
                      Kryssmått & 3-4-5 Vinkelräknare
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Räkna ut 90°-vinklar och diagonaler i fält
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0" />
                </button>
              )}

              {/* Fältboken */}
              {onOpenQuickNotes && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQuickNotes();
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-sky-500/40 text-left flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-white group-hover:text-sky-300">
                      Fältboken (Mått & Anteckningar)
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Spara måttnoteringar, fall och leveransdata
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 shrink-0" />
                </button>
              )}

              {/* Bygghjälp & Problemlösare */}
              {onOpenFieldHelper && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFieldHelper();
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-emerald-500/40 text-left flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-white group-hover:text-emerald-300">
                      Bygghjälp & Problemlösare (AMA)
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Råd om stenmjöl, fall, sättningar & markfel
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                </button>
              )}

              {/* Fotopärm & Bilder */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPhotoArchive();
                }}
                className="w-full p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-orange-500/40 text-left flex items-center gap-3 transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-white group-hover:text-orange-300">
                    Fotopärm & Galleri
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Tidsstämplade kontrollfoton sorterade per fas
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 shrink-0" />
              </button>

              {/* Försyn & Skadeguide */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTutorial();
                }}
                className="w-full p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-sky-500/40 text-left flex items-center gap-3 transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-white group-hover:text-sky-300">
                    Försyn & Skadeguide
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Fotoguide för fasad, sockel & staket före schakt
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 shrink-0" />
              </button>
            </div>
          )}

          {/* TAB 2: PROJEKT */}
          {activeTab === 'PROJECTS' && (
            <div className="space-y-1.5">
              <div className="px-1 pb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {vocab.projectsHeading} & Arbetslag
                </span>
              </div>

              {/* Översikt */}
              {onNavigateToDashboard && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToDashboard();
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-left flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-white group-hover:text-orange-300">
                      {vocab.projectsHeading} (Översikt)
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Visa alla aktiva och avslutade {vocab.projectNounPlural}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              )}

              {/* Skapa nytt */}
              {onNavigateToCreate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToCreate();
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-left flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-white group-hover:text-emerald-300">
                      {vocab.createProjectButton}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Starta en ny egenkontroll eller mall
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              )}

              {/* Mallbyggare om lärare/admin */}
              {currentUser?.role !== 'STUDENT' && onOpenExerciseCreator && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenExerciseCreator();
                  }}
                  className="w-full p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center shrink-0 font-black">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-white group-hover:text-amber-300">
                      {vocab.creatorPanelTitle}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Skapa och tilldela mallar till {vocab.groupLabelPlural.toLowerCase()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
                </button>
              )}

              {/* Samarbete & Molnsynk */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCollaboration();
                }}
                className="w-full p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-left flex items-center gap-3 transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-white group-hover:text-sky-300">
                    {activeContextMode === 'WORKPLACE'
                      ? 'Arbetslag & Molnsynk'
                      : activeContextMode === 'APL'
                      ? 'APL-delning & Molnsynk'
                      : 'Grupparbete & Molnsynk'}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Dela koder och synkronisera i realtid
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              {/* Versionshistorik */}
              {onOpenRevisions && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRevisions();
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-left flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#222] text-slate-300 border border-[#333] flex items-center justify-center shrink-0">
                    <History className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-white group-hover:text-amber-300">
                      Versionshistorik (Tidsmaskin)
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Återskapa tidigare sparade versioner
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              )}

              {/* Papperskorg */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTrashBin();
                }}
                className="w-full p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-left flex items-center gap-3 transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-white group-hover:text-rose-300">
                    Papperskorg
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Borttagna {vocab.projectNounPlural.toLowerCase()}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            </div>
          )}

          {/* TAB 3: INSTÄLLNINGAR & SYSTEM */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-1.5">
              <div className="px-1 pb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Inställningar & Appkonfiguration
                </span>
              </div>

              {/* Inställningar */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="w-full p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-orange-500/40 text-left flex items-center gap-3 transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-white group-hover:text-orange-300">
                    Inställningar & Layout
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Layout, färgstudio, QR-kod & verksamhetsläge
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              {/* Notiser */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNotices();
                }}
                className="w-full p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-left flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white group-hover:text-sky-300">
                      {vocab.noticesTitle}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Systemmeddelanden och aviseringar
                    </p>
                  </div>
                </div>
                {unreadNoticesCount > 0 ? (
                  <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full shrink-0">
                    {unreadNoticesCount} nya
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                )}
              </button>

              {/* Kontohantering */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAccounts();
                }}
                className="w-full p-2.5 rounded-xl bg-purple-950/20 hover:bg-purple-900/30 border border-purple-800/40 text-left flex items-center justify-between transition-colors cursor-pointer text-purple-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    {currentUser?.role === 'STUDENT' ? 'M' : 'P'}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs block group-hover:text-purple-100">
                      {currentUser?.role === 'STUDENT'
                        ? vocab.myAccountButton
                        : vocab.accountsViewTitle}
                    </span>
                    <span className="text-[11px] text-purple-300/70 block truncate">
                      {currentUser?.role === 'STUDENT'
                        ? `Se ditt ${vocab.groupLabel.toLowerCase()} & behörighet`
                        : `Hantera konton & ${vocab.groupLabelPlural.toLowerCase()}`}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400 shrink-0" />
              </button>

              {/* Installera app / QR */}
              {onOpenQRCodeModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQRCodeModal();
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-left flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-white group-hover:text-orange-300">
                      Installera som app / QR-kod
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Öppna på mobilen eller installera på hemskärmen
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              )}

              {/* Säkerhetskopia */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBackup();
                }}
                className="w-full p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-left flex items-center gap-3 transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#222] text-slate-400 border border-[#333] flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-white group-hover:text-slate-200">
                    Säkerhetskopia (Export & Import)
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Spara backup som JSON eller återställ data
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              {/* GDPR & Skolsäkerhet */}
              {onOpenGdprModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenGdprModal();
                  }}
                  className="w-full p-2.5 rounded-xl bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-800/40 text-left flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-white group-hover:text-emerald-300">
                      GDPR & Skolsäkerhet
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      PUB-avtal, fotoregler & dataportabilitet
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Layout Mode Pill Bar */}
        <div className="px-3 py-2 bg-[#161616] border-t border-[#222]">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Layoutpreset
            </span>
            <span className="text-[10px] text-orange-400 font-bold">
              {layoutOptions.find((l) => l.id === (userSettings.appLayoutMode || 'SIMPLE_LIST'))?.label}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {layoutOptions.map((opt) => {
              const active = (userSettings.appLayoutMode || 'SIMPLE_LIST') === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    onUpdateUserSettings({
                      ...userSettings,
                      appLayoutMode: opt.id,
                    })
                  }
                  className={`py-1 px-1 rounded-md text-[10px] font-bold truncate transition-all cursor-pointer ${
                    active
                      ? 'bg-orange-500 text-black font-black'
                      : 'bg-[#1e1e1e] text-slate-400 hover:text-white border border-[#2a2a2a]'
                  }`}
                  title={opt.desc}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cloud Status Footer */}
        <div className="px-3 py-2 bg-[#141414] border-t border-[#202020]">
          <StorageStatusWidget compact />
        </div>

        {/* Logout Button */}
        {currentUser && onLogout && (
          <div className="p-3 border-t border-[#242424] bg-[#121212]">
            <button
              type="button"
              onClick={() => {
                onClose();
                setTimeout(() => onLogout(), 10);
              }}
              className="w-full min-h-[38px] px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Logga ut ({currentUser.displayName || currentUser.email})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
