import React from 'react';
import { Menu, ArrowLeft, FileText, HardHat, Bell, LogOut, Download, Users } from 'lucide-react';
import { ViewState, UserAccount, UserSettings } from '../types';
import {
  getContextVocabulary,
  getContextualRoleLabel,
  resolveAppContextMode,
} from '../utils/contextLabels';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  projectName?: string;
  onOpenMenu: () => void;
  onOpenCollaboration?: () => void;
  onOpenReport?: () => void;
  onOpenNotices?: () => void;
  onOpenAccounts?: () => void;
  onOpenAPKExport?: () => void;
  onOpenQRCodeModal?: () => void;
  onLogout?: () => void;
  unreadNoticesCount?: number;
  currentUser?: UserAccount | null;
  userSettings?: UserSettings;
  onUpdateUserSettings?: (newSettings: UserSettings) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  projectName,
  onOpenMenu,
  onOpenReport,
  onOpenNotices,
  onOpenQRCodeModal,
  onLogout,
  unreadNoticesCount = 0,
  currentUser,
  userSettings,
}) => {
  const contextMode = resolveAppContextMode(userSettings, currentUser);
  const vocab = getContextVocabulary(contextMode);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted && onOpenQRCodeModal) {
        onOpenQRCodeModal();
      }
    } else if (onOpenQRCodeModal) {
      onOpenQRCodeModal();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#121212] border-b border-[#242424] font-sans">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: Hamburger Menu & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMenu}
            className="w-10 h-10 rounded-xl bg-[#1a1a1a] hover:bg-[#242424] text-white border border-[#2e2e2e] flex items-center justify-center cursor-pointer transition-colors shrink-0"
            title="Meny och verktyg"
          >
            <Menu className="w-5 h-5" />
          </button>

          {currentView !== 'DASHBOARD' ? (
            <button
              onClick={() => onNavigate('DASHBOARD')}
              className="min-h-[40px] px-3.5 bg-[#1a1a1a] hover:bg-[#242424] text-white font-bold border border-[#2e2e2e] rounded-xl flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer transition-colors"
              title="Tillbaka till översikten"
            >
              <ArrowLeft className="w-4 h-4 text-orange-400 stroke-[2.5]" />
              <span>Översikt</span>
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
              <HardHat className="w-5 h-5" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate leading-tight">
                {projectName ? projectName : 'FältKoll'}
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#1c1c1c] text-orange-400 border border-[#2e2e2e] shrink-0">
                {vocab.modeTitle}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block truncate">
              {projectName ? vocab.activeProjectSubtitle : vocab.modeSubtitle}
            </span>
          </div>
        </div>

        {/* Right: Actions + User */}
        <div className="flex items-center gap-2 shrink-0">
          {(currentUser?.role === 'TEACHER' ||
            currentUser?.role === 'SCHOOL_ADMIN' ||
            currentUser?.role === 'ADMIN') && (
            <button
              type="button"
              onClick={() => onNavigate(currentView === 'FIELD_MONITOR' ? 'DASHBOARD' : 'FIELD_MONITOR')}
              className={`min-h-[38px] px-3 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors border ${
                currentView === 'FIELD_MONITOR'
                  ? 'bg-orange-500 text-black border-orange-400 font-black'
                  : 'bg-[#1a1a1a] hover:bg-[#252525] text-orange-400 hover:text-orange-300 border-orange-500/40'
              }`}
              title="Öppna Fältöversikt & Elevinspektion"
            >
              <Users className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Elever i fält</span>
            </button>
          )}

          {!isInstalled && onOpenQRCodeModal && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="min-h-[38px] px-3 bg-[#1a1a1a] hover:bg-[#252525] text-orange-400 hover:text-orange-300 border border-orange-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Installera FältKoll som app på enheten"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden md:inline">Installera app</span>
            </button>
          )}

          {currentView === 'CHECKLIST' && onOpenReport && (
            <button
              type="button"
              onClick={onOpenReport}
              className="min-h-[40px] px-3.5 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
              title="Öppna kontrollrapport"
            >
              <FileText className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Rapport</span>
            </button>
          )}

          {onOpenNotices &&
            (currentUser?.role === 'TEACHER' ||
              currentUser?.role === 'SCHOOL_ADMIN' ||
              currentUser?.role === 'ADMIN' ||
              unreadNoticesCount > 0) && (
              <button
                type="button"
                onClick={onOpenNotices}
                className="w-10 h-10 rounded-xl bg-[#1a1a1a] hover:bg-[#242424] text-slate-300 hover:text-white border border-[#2e2e2e] flex items-center justify-center cursor-pointer transition-colors relative"
                title={vocab.noticesTitle}
              >
                <Bell className="w-4 h-4 text-orange-400" />
                {unreadNoticesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                    {unreadNoticesCount}
                  </span>
                )}
              </button>
            )}

          {currentUser && (
            <div className="flex items-center gap-2 bg-[#181818] border border-[#2a2a2a] pl-2.5 pr-1 py-1 rounded-xl">
              <div className="text-xs leading-tight hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white block max-w-[120px] truncate">
                    {currentUser.displayName}
                  </span>
                  <span
                    className={`text-[9px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded ${
                      contextMode === 'SCHOOL'
                        ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                        : contextMode === 'APL'
                        ? 'bg-sky-950/90 text-sky-300 border border-sky-500/50'
                        : 'bg-amber-950/90 text-amber-300 border border-amber-500/50'
                    }`}
                    title={`Automatiskt avkänt kontoläge: ${vocab.modeTitle}`}
                  >
                    {contextMode === 'SCHOOL'
                      ? '🎓 Elevkonto'
                      : contextMode === 'APL'
                      ? '📋 APL-konto'
                      : '🏗️ Arbetskonto'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {getContextualRoleLabel(currentUser.role, contextMode, true)}
                </span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="min-h-[32px] px-2.5 rounded-lg bg-[#242424] hover:bg-rose-600 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  title="Logga ut"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Logga ut</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
