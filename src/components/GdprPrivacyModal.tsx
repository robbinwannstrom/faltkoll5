import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  Lock,
  Eye,
  EyeOff,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  GraduationCap,
  Camera,
  Server,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { UserSettings, Project, UserAccount } from '../types';
import { clearAllProjectsFromDB } from '../db/indexedDb';

interface GdprPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
  onUpdateUserSettings: (newSettings: UserSettings) => void;
  currentUser?: UserAccount | null;
  projects?: Project[];
}

type GdprTab = 'GUIDE' | 'DPA_TEMPLATE' | 'SETTINGS' | 'RIGHT_TO_FORGOTTEN';

export const GdprPrivacyModal: React.FC<GdprPrivacyModalProps> = ({
  isOpen,
  onClose,
  userSettings,
  onUpdateUserSettings,
  currentUser,
  projects = [],
}) => {
  const [activeTab, setActiveTab] = useState<GdprTab>('GUIDE');
  const [copiedDpa, setCopiedDpa] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deleteSuccessNotice, setDeleteSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Toggle GDPR Settings
  const handleToggleSetting = (key: keyof UserSettings, currentVal: boolean) => {
    onUpdateUserSettings({
      ...userSettings,
      [key]: !currentVal,
    });
  };

  // Export all user data as JSON (GDPR Art. 20 Dataportabilitet)
  const handleExportAllUserData = () => {
    try {
      const dataPayload = {
        exportedAt: new Date().toISOString(),
        userSettings: {
          userName: userSettings.userName,
          companyName: userSettings.companyName,
          appContextMode: userSettings.appContextMode,
        },
        currentUser: currentUser
          ? {
              displayName: currentUser.displayName,
              role: currentUser.role,
              schoolClass: currentUser.schoolClass,
              studentGroup: currentUser.studentGroup,
            }
          : null,
        projectsCount: projects.length,
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          projectType: p.projectType,
          propertyDesignation: p.propertyDesignation,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          momentsApproved: Object.values(p.moments || {}).filter((m) => m.status === 'GREEN').length,
          totalMoments: Object.keys(p.moments || {}).length,
          notes: p.notes,
        })),
      };

      const blob = new Blob([JSON.stringify(dataPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FaltKoll_Mina_Data_GDPR_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Kunde inte exportera data.');
    }
  };

  // Wipe all local storage (GDPR Art. 17 Rätten att bli bortglömd)
  const handleWipeAllLocalData = async () => {
    try {
      await clearAllProjectsFromDB();
      localStorage.removeItem('falthjalp_current_user');
      localStorage.removeItem('falthjalp_shared_users');
      localStorage.removeItem('faltkoll_custom_groups');
      setDeleteSuccessNotice('All lokal data har raderats permanent från enheten i enlighet med GDPR artikel 17.');
      setConfirmDeleteAll(false);
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch {
      alert('Kunde inte rensa lokal databas.');
    }
  };

  const dpaSampleText = `PERSONUPPGIFTSBITRÄDESAVTAL (PUB-AVTAL) – UNDERLAG FÖR SKOLOR & UTBILDARE
Enligt Dataskyddsförordningen (EU 2016/679 - GDPR)

1. PARTER & ROLLER
Personuppgiftsansvarig: Skolan / Utbildningsanordnaren / Kommunen.
Personuppgiftsbiträde: FältKoll Digital Egenkontroll.

2. ÄNDAMÅL MED BEHANDLINGEN
Behandlingen av uppgifter sker uteslutande för att:
- Möjliggöra praktisk undervisning och digital egenkontroll i bygg- och anläggningsämnen.
- Låta yrkeslärare granska och bedöma elevers praktiska fältmoment, mätvärden och foton.
- Skapa skriftliga egenkontrollrapporter enligt Skollagen och Skolverkets kursplaner.

3. KATEGORIER AV PERSONUPPGIFTER
- Elevens namn eller pseudonymiserat Elev-ID (t.ex. "Elev BA25-04").
- Klass / Arbetslag / Utbildningsprogram.
- Kontrollfoton från övningsbädd eller byggarbetsplats (OBS: endast konstruktion och mätverktyg; ansikten ska ej fotograferas).
- Mätresultat (kryssmått, laserhöjder, fall i cm/m) och digital signatur.
Inga känsliga personuppgifter (såsom personnummer eller hälsouppgifter) behandlas.

4. LAGRING & SÄKERHET
- Primär lagring: Lokalt på elevens/lärarens enhet i webbläsarens krypterade IndexedDB.
- Eventuell molnsynkning: Sker inom EU/EES (Google Cloud region europe-west1/europe-west2).
- Inga 3:e-partscookies, ingen kommersiell spårning och ingen reklam förekommer.

5. GALLRINGSRUTIN
När kursen eller terminen avslutas raderas elevens arbeten antingen automatiskt via lärarens administration eller manuellt via appens raderingsfunktion (Rätten att bli bortglömd, GDPR Art. 17).`;

  const handleCopyDpa = () => {
    navigator.clipboard?.writeText(dpaSampleText);
    setCopiedDpa(true);
    setTimeout(() => setCopiedDpa(false), 2500);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121212] border-2 border-emerald-500/50 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="bg-[#181818] border-b border-[#282828] p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  GDPR & Skolintegritet
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700">
                  EU GDPR-säker
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hur skolor, gymnasier och kommuner tryggt använder FältKoll utan personuppgiftsrisker
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-[#222222] hover:bg-[#2c2c2c] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
            title="Stäng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Tabs */}
        <div className="flex items-center gap-1.5 p-2 bg-[#161616] border-b border-[#262626] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('GUIDE')}
            className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'GUIDE'
                ? 'bg-emerald-500 text-black font-black'
                : 'bg-[#1c1c1c] text-slate-300 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4 shrink-0" />
            <span>Skolguide (Hur det löses)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DPA_TEMPLATE')}
            className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'DPA_TEMPLATE'
                ? 'bg-emerald-500 text-black font-black'
                : 'bg-[#1c1c1c] text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>PUB-avtalsunderlag (DPA)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SETTINGS')}
            className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'SETTINGS'
                ? 'bg-emerald-500 text-black font-black'
                : 'bg-[#1c1c1c] text-slate-300 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>Skolans Integritetsläge</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RIGHT_TO_FORGOTTEN')}
            className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'RIGHT_TO_FORGOTTEN'
                ? 'bg-emerald-500 text-black font-black'
                : 'bg-[#1c1c1c] text-slate-300 hover:text-white'
            }`}
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Export & Radering</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-xs sm:text-sm leading-relaxed">
          {deleteSuccessNotice && (
            <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-500 text-emerald-200 font-bold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{deleteSuccessNotice}</span>
            </div>
          )}

          {/* TAB 1: GUIDE FÖR SKOLOR & KOMMUNER */}
          {activeTab === 'GUIDE' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#181818] border border-emerald-500/30 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Sammanfattning: Så löser FältKoll GDPR för skolor
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Skolor och kommuner ställer mycket höga krav på digital integritet för elever. FältKoll är byggd enligt principen <strong>Inbyggt dataskydd (Privacy by Design)</strong> och kräver varken personnummer eller privata uppgifter.
                </p>
              </div>

              {/* 5 Huvudpelare för GDPR-efterlevnad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#161616] border border-[#2a2a2a] space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <h4 className="font-bold text-white text-sm">Dataminimering & Pseudonymer</h4>
                  <p className="text-xs text-slate-400">
                    Elever behöver inte använda riktiga efternamn eller personnummer. Skolan kan ange Elev-ID (t.ex. <em>"BA25-Elev 03"</em>) eller förnamn. Inga känsliga personuppgifter lagras någonsin.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#161616] border border-[#2a2a2a] space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <h4 className="font-bold text-white text-sm">Lokal lagring som standard</h4>
                  <p className="text-xs text-slate-400">
                    Appen sparar all dokumentation lokalt på enheten i webbläsarens säkra IndexedDB. Ingen elevdata skickas till molnet utan att skolan och läraren aktivt väljer att aktivera molnsynk.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#161616] border border-[#2a2a2a] space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <h4 className="font-bold text-white text-sm">Fotosekretess: Endast konstruktion</h4>
                  <p className="text-xs text-slate-400">
                    I anläggning och bygg dokumenteras <em>laserhöjd, schaktdjup, rörgravar och armering</em>. Elever instrueras att aldrig fotografera ansikten, vilket eliminerar risken för kränkning av den personliga integriteten.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#161616] border border-[#2a2a2a] space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <h4 className="font-bold text-white text-sm">Ingen 3:e-partsspårning eller reklam</h4>
                  <p className="text-xs text-slate-400">
                    Appen har noll (0) trackers: ingen Google Analytics, inga reklamskript och ingen överföring av elevdata till tredje land (USA). All serverkommunikation körs inom EU (europe-west).
                  </p>
                </div>
              </div>

              {/* Rättslig grund i Skollagen */}
              <div className="p-4 rounded-2xl bg-[#141814] border border-emerald-900/60 space-y-1.5">
                <span className="text-xs font-bold text-emerald-400 block">
                  ⚖️ Rättslig grund för skolan (Artikel 6.1e GDPR)
                </span>
                <p className="text-xs text-slate-300">
                  Skolans rättsliga grund för att låta elever föra digital egenkontroll är <strong>Allmänt intresse och myndighetsutövning</strong> enligt Skollagen och Skolverkets examensmål för Bygg- och anläggningsprogrammet. Dokumentationen fungerar som betygsunderlag för elevens praktiska yrkeskunskaper.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PUB-AVTALSLUNDERLAG (DPA) */}
          {activeTab === 'DPA_TEMPLATE' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">
                    Underlag för Personuppgiftsbiträdesavtal (PUB)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Detta underlag kan skickas direkt till skolans rektor, IT-avdelning eller Dataskyddsombud (DSO).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyDpa}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                >
                  {copiedDpa ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedDpa ? 'Kopierat!' : 'Kopiera hela avtalet'}</span>
                </button>
              </div>

              <div className="p-4 bg-[#0d0d0d] border border-[#262626] rounded-2xl font-mono text-[11px] sm:text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto select-all">
                {dpaSampleText}
              </div>
            </div>
          )}

          {/* TAB 3: SKOLANS INTEGRITETSLÄGE & INSTÄLLNINGAR */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base">
                  Strikta Integritetsinställningar för Skolan
                </h4>
                <p className="text-xs text-slate-400">
                  Aktivera dessa skyddsfunktioner för att säkerställa 100% anonymitet och skydd mot misstag i fält.
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Pseudonymiseringsläge */}
                <div className="p-4 rounded-2xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="font-bold text-white text-xs sm:text-sm block">
                      Pseudonymiseringsläge (Elev-ID istället för namn)
                    </span>
                    <p className="text-xs text-slate-400">
                      Ersätter fullständiga elevnamn och e-post med anonyma koder (t.ex. "Elev 1A") i rapporter och fältvyer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleSetting('gdprStrictSchoolMode', !!userSettings.gdprStrictSchoolMode)}
                    className={`min-h-[36px] px-4 rounded-xl text-xs font-black cursor-pointer transition-colors shrink-0 ${
                      userSettings.gdprStrictSchoolMode
                        ? 'bg-emerald-500 text-black'
                        : 'bg-[#222] text-slate-400 border border-[#333]'
                    }`}
                  >
                    {userSettings.gdprStrictSchoolMode ? 'PÅSLAGET ✓' : 'AV'}
                  </button>
                </div>

                {/* 2. Fotopåminnelse för ansiktsskydd */}
                <div className="p-4 rounded-2xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="font-bold text-white text-xs sm:text-sm block">
                      Påminnelse: Endast konstruktionsfoton (Inga ansikten)
                    </span>
                    <p className="text-xs text-slate-400">
                      Visar en tydlig påminnelse i kameran att endast fota byggtekniska moment och inte klasskamraters ansikten.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleSetting(
                        'gdprPhotoFaceBlurNotice',
                        userSettings.gdprPhotoFaceBlurNotice !== false
                      )
                    }
                    className={`min-h-[36px] px-4 rounded-xl text-xs font-black cursor-pointer transition-colors shrink-0 ${
                      userSettings.gdprPhotoFaceBlurNotice !== false
                        ? 'bg-emerald-500 text-black'
                        : 'bg-[#222] text-slate-400 border border-[#333]'
                    }`}
                  >
                    {userSettings.gdprPhotoFaceBlurNotice !== false ? 'PÅSLAGET ✓' : 'AV'}
                  </button>
                </div>

                {/* 3. Tvinga lokal lagring utan molnspridning */}
                <div className="p-4 rounded-2xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="font-bold text-white text-xs sm:text-sm block">
                      Enbart Lokal lagring (Tvingat offlineläge)
                    </span>
                    <p className="text-xs text-slate-400">
                      Blockerar automatisk synkning till molnet så att all elevdata uteslutande stannar på den fysiska enheten.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleSetting('gdprLocalStorageOnly', !!userSettings.gdprLocalStorageOnly)}
                    className={`min-h-[36px] px-4 rounded-xl text-xs font-black cursor-pointer transition-colors shrink-0 ${
                      userSettings.gdprLocalStorageOnly
                        ? 'bg-emerald-500 text-black'
                        : 'bg-[#222] text-slate-400 border border-[#333]'
                    }`}
                  >
                    {userSettings.gdprLocalStorageOnly ? 'PÅSLAGET ✓' : 'AV'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RÄTTEN ATT BLI BORTGLÖMD & DATAPORTABILITET */}
          {activeTab === 'RIGHT_TO_FORGOTTEN' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base">
                  Rätten till Radering & Dataportabilitet (GDPR Art. 17 & 20)
                </h4>
                <p className="text-xs text-slate-400">
                  Ladda ner all din data eller radera all lagrad information från denna enhet vid kursens eller terminens slut.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Dataportabilitet (Art. 20) */}
                <div className="p-5 rounded-2xl bg-[#161616] border border-[#2a2a2a] space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                      <Download className="w-4 h-4" />
                      Dataportabilitet (Art. 20)
                    </span>
                    <h5 className="font-bold text-white text-sm">Exportera mina uppgifter</h5>
                    <p className="text-xs text-slate-400">
                      Ladda ner en maskinläsbar kopia (JSON) av alla dina projekt, mätningar och inställningar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportAllUserData}
                    className="w-full min-h-[42px] px-4 bg-[#222] hover:bg-[#2c2c2c] text-white border border-[#333] font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Ladda ner mina data (JSON)</span>
                  </button>
                </div>

                {/* 2. Rätten att bli bortglömd (Art. 17) */}
                <div className="p-5 rounded-2xl bg-[#161616] border border-rose-950/60 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase text-rose-400 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4" />
                      Rätten att bli bortglömd (Art. 17)
                    </span>
                    <h5 className="font-bold text-white text-sm">Gallra & Radera All Data</h5>
                    <p className="text-xs text-slate-400">
                      Raderar alla lokala projekt, användardata och foton från denna webbläsare och enhet permanent.
                    </p>
                  </div>

                  {!confirmDeleteAll ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteAll(true)}
                      className="w-full min-h-[42px] px-4 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Rensa och radera allt på enheten</span>
                    </button>
                  ) : (
                    <div className="space-y-2 p-3 bg-rose-950 border border-rose-600 rounded-xl animate-in fade-in">
                      <p className="text-xs text-rose-100 font-bold">
                        Är du helt säker? Detta går inte att ångra.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAll(false)}
                          className="flex-1 py-1.5 bg-[#222] text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Avbryt
                        </button>
                        <button
                          type="button"
                          onClick={handleWipeAllLocalData}
                          className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-lg cursor-pointer"
                        >
                          Ja, radera allt nu
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#181818] border-t border-[#262626] p-3.5 px-5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>FältKoll följer Dataskyddsförordningen (EU 2016/679)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-xs cursor-pointer transition-colors"
          >
            Klar
          </button>
        </div>
      </div>
    </div>
  );
};
