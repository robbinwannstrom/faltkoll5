import React, { useState } from 'react';
import {
  UserSettings,
  ProjectType,
  AppExperienceLevel,
  AppLayoutMode,
  AppColorPalette,
  PreInspectionPreference,
  UserUsageProfile,
} from '../types';
import { saveUserSettings } from '../db/indexedDb';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  User,
  Building,
  Layers,
  Palette,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  HardHat,
  Compass,
} from 'lucide-react';

interface SetupWizardModalProps {
  onClose: () => void;
  onOpenDemoProject?: () => void;
  onCreateNewProject?: (type?: ProjectType) => void;
  initialSettings?: UserSettings;
  onSettingsSaved?: (settings: UserSettings) => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({
  onClose,
  onCreateNewProject,
  initialSettings,
  onSettingsSaved,
}) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 5;

  // Form states
  const [profile, setProfile] = useState<UserUsageProfile>(initialSettings?.userUsageProfile || 'PRIVATE');
  const [layoutMode, setLayoutMode] = useState<AppLayoutMode>(initialSettings?.appLayoutMode || 'FIELD_CLEAR');
  const [colorPalette, setColorPalette] = useState<AppColorPalette>(initialSettings?.colorPalette || 'ORANGE_WORK');
  const [preInspectionPref, setPreInspectionPref] = useState<PreInspectionPreference>(
    initialSettings?.preInspectionPreference || (profile === 'PRIVATE' ? 'SKIP_DEFAULT' : 'ALWAYS_ASK')
  );
  const [name, setName] = useState<string>(initialSettings?.userName || '');
  const [company, setCompany] = useState<string>(initialSettings?.companyName || '');
  const [preferredType, setPreferredType] = useState<ProjectType | 'ALL'>(
    initialSettings?.preferredProjectType || 'ALL'
  );

  const handleSelectProfile = (p: UserUsageProfile) => {
    setProfile(p);
    if (p === 'PRIVATE') {
      setPreInspectionPref('SKIP_DEFAULT');
      setLayoutMode('FIELD_CLEAR');
    } else if (p === 'CONTRACTOR') {
      setPreInspectionPref('ALWAYS_DO');
      setLayoutMode('FIELD_CLEAR');
    } else {
      setPreInspectionPref('ALWAYS_ASK');
      setLayoutMode('GUIDED_STEP');
    }
  };

  const getCombinedSettings = (): UserSettings => ({
    userName: name.trim(),
    companyName: company.trim(),
    preferredProjectType: preferredType,
    userUsageProfile: profile,
    appLayoutMode: layoutMode,
    colorPalette,
    preInspectionPreference: preInspectionPref,
    easyFieldMode: true,
    hasSeenWizard: true,
    appExperienceLevel: profile === 'SCHOOL' ? 'STUDENT_MAX' : profile === 'CONTRACTOR' ? 'STANDARD' : 'STANDARD',
    featureCrossMeasure: true,
    featureFieldNotes: true,
    featureAiHelper: true,
    featurePreInspection: preInspectionPref !== 'SKIP_DEFAULT',
    featurePhotoWatermark: true,
    featureCloudSync: true,
    featureTeacherAlerts: profile === 'SCHOOL',
  });

  const handleNext = () => {
    const updated = getCombinedSettings();
    saveUserSettings(updated);
    if (onSettingsSaved) onSettingsSaved(updated);
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleFinish = () => {
    const updated = getCombinedSettings();
    saveUserSettings(updated);
    if (onSettingsSaved) onSettingsSaved(updated);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121212] border-2 border-[#2c2c2c] rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl space-y-6 my-auto max-h-[94vh] overflow-y-auto"
      >
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-xs font-black text-orange-400 uppercase tracking-wider">
              Snabbstart & Inställningar (Steg {step} av {totalSteps})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((num) => (
              <span
                key={num}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  num === step
                    ? 'bg-orange-500 scale-125'
                    : num < step
                    ? 'bg-emerald-400'
                    : 'bg-[#2a2a2a]'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
          >
            Hoppa över
          </button>
        </div>

        {/* STEG 1: ANVÄNDARPROFIL */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-black text-orange-400 uppercase tracking-wider">
                Välkommen till FältKoll
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Hur planerar du att använda appen?
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Vi anpassar standardval, kontroller och påminnelser efter ditt specifika behov.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-1">
              {/* Privatperson */}
              <button
                type="button"
                onClick={() => handleSelectProfile('PRIVATE')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  profile === 'PRIVATE'
                    ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500/50'
                    : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏡</span>
                    <div>
                      <div className="font-black text-sm sm:text-base text-white">
                        Privatperson / Eget Bygge
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Altan, mur, plintar eller avlopp på egen tomt. Inga onödiga försyn-krav.
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      profile === 'PRIVATE'
                        ? 'border-orange-500 bg-orange-500 text-black'
                        : 'border-[#444] bg-[#121212]'
                    }`}
                  >
                    {profile === 'PRIVATE' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </button>

              {/* Företag / Entreprenör */}
              <button
                type="button"
                onClick={() => handleSelectProfile('CONTRACTOR')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  profile === 'CONTRACTOR'
                    ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500/50'
                    : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚜</span>
                    <div>
                      <div className="font-black text-sm sm:text-base text-white">
                        Entreprenör & Maskinist
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Företagare, grund och schakt. Full juridisk dokumentation och försyn mot tvister.
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      profile === 'CONTRACTOR'
                        ? 'border-orange-500 bg-orange-500 text-black'
                        : 'border-[#444] bg-[#121212]'
                    }`}
                  >
                    {profile === 'CONTRACTOR' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </button>

              {/* Skola / Elev */}
              <button
                type="button"
                onClick={() => handleSelectProfile('SCHOOL')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  profile === 'SCHOOL'
                    ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500/50'
                    : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎓</span>
                    <div>
                      <div className="font-black text-sm sm:text-base text-white">
                        Yrkesutbildning & Elev
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Gymnasie eller vuxenutbildning. Steg-för-steg råd, lärarnotiser och AMA-stöd.
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      profile === 'SCHOOL'
                        ? 'border-orange-500 bg-orange-500 text-black'
                        : 'border-[#444] bg-[#121212]'
                    }`}
                  >
                    {profile === 'SCHOOL' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleNext}
                className="w-full min-h-[50px] bg-orange-500 hover:bg-orange-400 active:scale-98 text-black font-black text-base rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-500/20 transition-all"
              >
                <span>Fortsätt till Layout & Tydlighet</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* STEG 2: LAYOUT & TYDLIGHET */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-black text-orange-400 uppercase tracking-wider">
                Steg 2: Gränssnitt
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Välj layout och tydlighetsnivå
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Du kan alltid ändra detta i Inställningar under hamburgermenyn (☰).
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => setLayoutMode('FIELD_CLEAR')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  layoutMode === 'FIELD_CLEAR'
                    ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500'
                    : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-black text-base text-white flex items-center gap-2">
                      <span>🚜 Fältläge (Maximal Tydlighet)</span>
                      <span className="text-[10px] bg-orange-500 text-black px-2 py-0.2 rounded font-black">
                        Rekommenderas
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Stora knappar, tydliga fulltext-etiketter (inga svårtolkade ikoner) och hög kontrast för utomhusbruk.
                    </p>
                  </div>
                  {layoutMode === 'FIELD_CLEAR' && <Check className="w-5 h-5 text-orange-400 stroke-[3] shrink-0" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode('COMPACT')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  layoutMode === 'COMPACT'
                    ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500'
                    : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-black text-base text-white">
                      📋 Kompakt Arbetsledarläge
                    </div>
                    <p className="text-xs text-slate-300">
                      Tätare rader för snabb granskning av flera moment samtidigt utan mycket skrollande.
                    </p>
                  </div>
                  {layoutMode === 'COMPACT' && <Check className="w-5 h-5 text-orange-400 stroke-[3] shrink-0" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode('GUIDED_STEP')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  layoutMode === 'GUIDED_STEP'
                    ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500'
                    : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-black text-base text-white">
                      🎓 Guidat Steg-för-steg
                    </div>
                    <p className="text-xs text-slate-300">
                      Visar extra förklarande hjälprutor och tips vid varje moment för maximal inlärning.
                    </p>
                  </div>
                  {layoutMode === 'GUIDED_STEP' && <Check className="w-5 h-5 text-orange-400 stroke-[3] shrink-0" />}
                </div>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="min-h-[50px] px-5 bg-[#1a1a1a] hover:bg-[#252525] text-slate-300 font-bold text-sm rounded-2xl border border-[#333333] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tillbaka</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 min-h-[50px] bg-orange-500 hover:bg-orange-400 active:scale-98 text-black font-black text-base rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-500/20 transition-all"
              >
                <span>Nästa: Välj Färgpalett</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* STEG 3: FÄRGPALETT */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-black text-orange-400 uppercase tracking-wider">
                Steg 3: Kontrast & Färg
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Välj Färgpalett
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Välj det tema som är behagligast för dina ögon eller ger bäst kontrast i solsken.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setColorPalette('ORANGE_WORK')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  colorPalette === 'ORANGE_WORK'
                    ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500'
                    : 'bg-[#181818] border-[#2c2c2c] hover:border-[#3c3c3c]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-500 shadow-sm border border-orange-300"></span>
                  <span className="font-bold text-sm text-white">Varselorange (Mörk)</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Klassisk grafitgrå med skarp varselorange.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setColorPalette('SAFETY_YELLOW')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  colorPalette === 'SAFETY_YELLOW'
                    ? 'bg-yellow-500/15 border-yellow-400 text-white ring-1 ring-yellow-400'
                    : 'bg-[#181818] border-[#2c2c2c] hover:border-[#3c3c3c]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-yellow-400 shadow-sm border border-yellow-200"></span>
                  <span className="font-bold text-sm text-white">Varselgul / Hi-Vis</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Vägarbetsstandard med högsta synlighet.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setColorPalette('DAYLIGHT_HIGH_CONTRAST')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  colorPalette === 'DAYLIGHT_HIGH_CONTRAST'
                    ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500'
                    : 'bg-[#181818] border-[#2c2c2c] hover:border-[#3c3c3c]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-white shadow-sm border border-slate-400 flex items-center justify-center text-[10px]">☀️</span>
                  <span className="font-bold text-sm text-white">Högkontrast Dagsljus</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Ljust läge för starkt solljus utomhus.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setColorPalette('NORDIC_BLUE')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  colorPalette === 'NORDIC_BLUE'
                    ? 'bg-sky-500/15 border-sky-400 text-white ring-1 ring-sky-400'
                    : 'bg-[#181818] border-[#2c2c2c] hover:border-[#3c3c3c]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-500 shadow-sm border border-sky-300"></span>
                  <span className="font-bold text-sm text-white">Nordisk Proffsblå</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Stålgrå och marinblå företagsstil.
                </p>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="min-h-[50px] px-5 bg-[#1a1a1a] hover:bg-[#252525] text-slate-300 font-bold text-sm rounded-2xl border border-[#333333] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tillbaka</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 min-h-[50px] bg-orange-500 hover:bg-orange-400 active:scale-98 text-black font-black text-base rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-500/20 transition-all"
              >
                <span>Nästa: Försyn & Skador</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* STEG 4: FÖRSYN & SKADEGUIDE */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-black text-orange-400 uppercase tracking-wider">
                Steg 4: Säkerhet & Försyn
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Vill du göra eller hoppa över försyn och skadeguide?
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Försyn innebär fotodokumentation av grannens fasad, asfalt och staket innan maskiner startar.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {/* Val 1: Hoppa över */}
              <button
                type="button"
                onClick={() => setPreInspectionPref('SKIP_DEFAULT')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  preInspectionPref === 'SKIP_DEFAULT'
                    ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500'
                    : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                      <span>🏡 Hoppa över försyn som standard (Privat bruk)</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Slipp tjatiga påminnelser om fasad och grannar. Rekommenderas för dig som bygger altan eller fixar på egen tomt.
                    </p>
                  </div>
                  {preInspectionPref === 'SKIP_DEFAULT' && <Check className="w-5 h-5 text-amber-400 stroke-[3] shrink-0" />}
                </div>
              </button>

              {/* Val 2: Fråga vid varje nytt projekt */}
              <button
                type="button"
                onClick={() => setPreInspectionPref('ALWAYS_ASK')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  preInspectionPref === 'ALWAYS_ASK'
                    ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500'
                    : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-sm sm:text-base text-white">
                      ⚖️ Fråga mig vid varje nytt projekt
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Ett snabbt val visas när du skapar ett projekt där du kan välja att göra eller hoppa över med ett klick.
                    </p>
                  </div>
                  {preInspectionPref === 'ALWAYS_ASK' && <Check className="w-5 h-5 text-orange-400 stroke-[3] shrink-0" />}
                </div>
              </button>

              {/* Val 3: Gör alltid försyn */}
              <button
                type="button"
                onClick={() => setPreInspectionPref('ALWAYS_DO')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  preInspectionPref === 'ALWAYS_DO'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-sm sm:text-base text-white">
                      🛡️ Gör alltid försyn (Entreprenad)
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Säkrar bildbevis på befintliga skador innan tunga maskiner och dumpertransporter rullar in.
                    </p>
                  </div>
                  {preInspectionPref === 'ALWAYS_DO' && <Check className="w-5 h-5 text-emerald-400 stroke-[3] shrink-0" />}
                </div>
              </button>
            </div>

            {/* Varning för konsekvenser om man hoppar över */}
            {preInspectionPref === 'SKIP_DEFAULT' && (
              <div className="p-3.5 rounded-2xl bg-[#1e1710] border border-amber-600/50 text-xs text-amber-200 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Varning för konsekvenser om något händer:</span>
                </div>
                <p className="text-amber-100/90 leading-relaxed">
                  Utan fotodokumenterad försyn innan maskiner och tunga transporter rullar in riskerar du att hållas betalningsskyldig för befintliga sprickor i fasad, sprucken asfalt eller kantstenar vid en tvist med granne eller beställare.
                </p>
                <p className="text-amber-300 font-semibold pt-0.5">
                  💡 Du kan när som helst göra försynen senare under schaktmomentet i checklistan.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="min-h-[50px] px-5 bg-[#1a1a1a] hover:bg-[#252525] text-slate-300 font-bold text-sm rounded-2xl border border-[#333333] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tillbaka</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 min-h-[50px] bg-orange-500 hover:bg-orange-400 active:scale-98 text-black font-black text-base rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-500/20 transition-all"
              >
                <span>Nästa: Namn & Slutför</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* STEG 5: NAMN & SLUTFÖR */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-black text-orange-400 uppercase tracking-wider">
                Steg 5: Din Signatur
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Vem dokumenterar?
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Ditt namn förifylls automatiskt när du godkänner moment och skapar rapporter.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-orange-400" />
                  Ditt för- och efternamn:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="T.ex. Johan Svensson"
                  className="w-full min-h-[50px] px-4 bg-[#181818] border border-[#333333] focus:border-orange-500 rounded-2xl text-white text-base font-bold placeholder-slate-600 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  Företag, Skola eller Fastighet (Valfritt):
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="T.ex. Villa Solbacken / Svensk Mark & Grund"
                  className="w-full min-h-[50px] px-4 bg-[#181818] border border-[#333333] focus:border-orange-500 rounded-2xl text-white text-sm placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleBack}
                className="min-h-[50px] px-5 bg-[#1a1a1a] hover:bg-[#252525] text-slate-300 font-bold text-sm rounded-2xl border border-[#333333] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tillbaka</span>
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 min-h-[50px] bg-orange-500 hover:bg-orange-400 active:scale-98 text-black font-black text-base rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/25 transition-all"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Starta appen & Spara</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
