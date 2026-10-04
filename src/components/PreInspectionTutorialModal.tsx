import React, { useState, useRef } from 'react';
import { Project, MomentPhoto } from '../types';
import { fileToBase64Optimized, getFormattedCurrentTime } from '../db/indexedDb';
import {
  Camera,
  CheckCircle2,
  ShieldCheck,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trophy,
  Check,
  Info,
  SkipForward,
  Save,
} from 'lucide-react';

interface PreInspectionTutorialModalProps {
  project?: Project | null;
  onClose: () => void;
  onCompleteTutorial?: (photos: MomentPhoto[]) => void;
}

interface TutorialStep {
  stepNumber: number;
  title: string;
  category: string;
  description: string;
  fieldAdvice: string;
  icon: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    stepNumber: 1,
    title: 'Grannens fasad, sockel & fönster',
    category: 'Försyn',
    icon: '🏡',
    description:
      'Gå runt grannfastigheten och fota fasad, betongsockel och grund innan du börjar schakta eller vibrera marken.',
    fieldAdvice:
      'Finns gamla sättningssprickor i putsen? Fota dem i närbild nu! Om du inte har ett tidsstämplat foto före start kan grannen hävda att dina maskinvibrationer orsakade skadan.',
  },
  {
    stepNumber: 2,
    title: 'Träd, staket, häck & tomtgräns',
    category: 'Försyn',
    icon: '🌳',
    description:
      'Fota trädgrenar, buskar, staket, murar och tomtgränser intill arbetsområdet.',
    fieldAdvice:
      'Grävmaskinsbommen kan lätt knäcka en gren eller skada en häck. Fota befintligt skick så att ingen kan påstå att du backat på deras staket.',
  },
  {
    stepNumber: 3,
    title: 'Infart, asfalt & kantsten',
    category: 'Försyn',
    icon: '🛣️',
    description:
      'Fota vägbanan, asfalten, kantstenen och brunnslock där lastbilar och dumper ska köra in massor.',
    fieldAdvice:
      'Tunga grustransporter kan ge spårbildning i mjuk asfalt. Ett tidsstämplat foto visar hur gatan och trottoaren såg ut innan ni rullade in på tomten.',
  },
  {
    stepNumber: 4,
    title: 'Fordon & maskiner på plats',
    category: 'Försyn',
    icon: '🚜',
    description:
      'Fota egna maskiner på arbetsplatsen samt parkerade bilar i närområdet.',
    fieldAdvice:
      'Om det står bilar nära schakten ska du fota dem direkt. Då har du bevis på att eventuella repor eller stenskott inte uppkom under ditt schaktarbete.',
  },
];

export const PreInspectionTutorialModal: React.FC<PreInspectionTutorialModalProps> = ({
  project,
  onClose,
  onCompleteTutorial,
}) => {
  // Initialize existing photos from project so nothing is ever lost
  const [capturedPhotos, setCapturedPhotos] = useState<Record<number, MomentPhoto>>(() => {
    const initial: Record<number, MomentPhoto> = {};
    if (project?.preInspectionPhotos && project.preInspectionPhotos.length > 0) {
      project.preInspectionPhotos.forEach((photo, idx) => {
        const stepIdx = TUTORIAL_STEPS.findIndex(
          (s) => s.title === photo.caption || photo.id.includes(`_${s.stepNumber}`)
        );
        if (stepIdx !== -1) {
          initial[stepIdx] = photo;
        } else if (idx < TUTORIAL_STEPS.length) {
          initial[idx] = photo;
        }
      });
    }
    return initial;
  });

  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentStep = TUTORIAL_STEPS[currentStepIdx];
  const totalSteps = TUTORIAL_STEPS.length;
  const takenCount = Object.keys(capturedPhotos).length;
  const isFinished = takenCount === totalSteps;

  const handleTriggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const time = getFormattedCurrentTime();
      // Burn in legal watermark
      const base64 = await fileToBase64Optimized(file, {
        momentId: `Försyn_${currentStep.stepNumber}`,
        momentTitle: currentStep.title,
        property: project?.propertyDesignation || 'Försyn & Skadeguide',
      });

      const photo: MomentPhoto = {
        id: 'pre_insp_' + currentStep.stepNumber + '_' + Date.now(),
        dataUrl: base64,
        capturedAt: time,
        category: 'Försyn',
        caption: currentStep.title,
      };

      const updated = {
        ...capturedPhotos,
        [currentStepIdx]: photo,
      };
      setCapturedPhotos(updated);

      // Notify parent safely outside of state updater
      if (onCompleteTutorial) {
        onCompleteTutorial(Object.values(updated));
      }

      // Auto advance to next step if not on last step
      if (currentStepIdx < totalSteps - 1) {
        setTimeout(() => {
          setCurrentStepIdx((idx) => idx + 1);
        }, 500);
      }
    } catch (err: any) {
      alert('Kunde inte läsa in fotot: ' + (err?.message || 'okänt fel'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Safe skip of single step without losing any existing photos
  const handleSkipSingleStep = () => {
    if (currentStepIdx < totalSteps - 1) {
      setCurrentStepIdx((idx) => idx + 1);
    } else {
      // Last step skipped: save whatever has been captured and exit
      handleSaveAndClose();
    }
  };

  // Safe exit: NEVER loses photos taken so far!
  const handleSaveAndClose = () => {
    const photos = Object.values(capturedPhotos);
    if (photos.length > 0 && onCompleteTutorial) {
      onCompleteTutorial(photos);
    }
    onClose();
  };

  return (
    <div
      onClick={handleSaveAndClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md overflow-y-auto"
    >
      {/* Hidden camera input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileCapture}
        className="hidden"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0e111a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]"
      >
        {/* Header */}
        <div className="bg-[#141824] border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white leading-tight">
                  Försyn & Skadeguide
                </h3>
                <span className="text-[11px] font-mono bg-sky-500/20 text-sky-300 font-bold px-1.5 py-0.2 rounded">
                  {takenCount}/{totalSteps} tagna
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fota befintliga skador innan schaktstart för att ha ryggen fri
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveAndClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
            title="Spara tagna bilder och stäng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Dots / Steps Indicator */}
        <div className="px-4 pt-3 pb-2 bg-[#10131d] border-b border-slate-850">
          <div className="flex items-center justify-between gap-1.5">
            {TUTORIAL_STEPS.map((step, idx) => {
              const hasPhoto = !!capturedPhotos[idx];
              const isCurrent = idx === currentStepIdx;

              return (
                <button
                  key={step.stepNumber}
                  type="button"
                  onClick={() => setCurrentStepIdx(idx)}
                  className={`flex-1 py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer border flex flex-col items-center gap-0.5 ${
                    isCurrent
                      ? 'bg-sky-500/20 border-sky-400 text-white'
                      : hasPhoto
                      ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold font-mono">
                    {hasPhoto ? (
                      <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                    ) : (
                      <span>{step.stepNumber}</span>
                    )}
                    <span className="hidden sm:inline text-[10px] truncate max-w-[80px]">
                      {step.title.split(' ')[0]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {isFinished ? (
            /* Celebration Card when all done */
            <div className="bg-[#111915] border border-emerald-500/40 rounded-2xl p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-white">
                  Försyn & Skadedokumentation Klar!
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Alla {totalSteps} skyddsfoton är tagna, tidsstämplade och säkrade i projektets fotobok. Du har ryggen fri om grannar eller beställare skulle klaga på skador.
                </p>
              </div>

              {/* Photo gallery thumbnails */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {TUTORIAL_STEPS.map((s, idx) => (
                  <div key={idx} className="rounded-lg overflow-hidden border border-emerald-600/40 bg-black aspect-square">
                    {capturedPhotos[idx] && (
                      <img
                        src={capturedPhotos[idx].dataUrl}
                        alt={s.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSaveAndClose}
                className="w-full min-h-[50px] bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-bold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
              >
                <span>Fortsätt till kontrollistan</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            /* Active Step Display */
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-3xl shrink-0 mt-0.5">{currentStep.icon}</span>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded">
                      Steg {currentStep.stepNumber} av {totalSteps}
                    </span>
                    {capturedPhotos[currentStepIdx] && (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Fotat
                      </span>
                    )}
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white leading-tight">
                    {currentStep.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {currentStep.description}
                  </p>
                </div>
              </div>

              {/* Field Expert Advice Box */}
              <div className="bg-[#141924] border border-sky-500/30 p-3.5 rounded-xl space-y-1.5">
                <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Varför är detta viktigt för att ha ryggen fri?
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentStep.fieldAdvice}
                </p>
              </div>

              {/* Photo Preview if already taken for this step */}
              {capturedPhotos[currentStepIdx] ? (
                <div className="rounded-xl border border-emerald-600/60 overflow-hidden bg-black relative">
                  <img
                    src={capturedPhotos[currentStepIdx].dataUrl}
                    alt="Foto"
                    className="w-full max-h-48 object-contain bg-slate-950"
                  />
                  <div className="p-2.5 bg-slate-900/90 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Foto stämplat och säkrat
                    </span>
                    <button
                      type="button"
                      onClick={handleTriggerCamera}
                      className="text-slate-300 hover:text-white underline cursor-pointer text-xs"
                    >
                      Ta om bild
                    </button>
                  </div>
                </div>
              ) : (
                /* Big Camera Button */
                <button
                  type="button"
                  onClick={handleTriggerCamera}
                  disabled={isProcessing}
                  className="w-full min-h-[58px] bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-base rounded-xl flex items-center justify-center gap-3 cursor-pointer shadow-lg transition-all touch-manipulation"
                >
                  <Camera className="w-5 h-5 stroke-[2.2]" />
                  <span>
                    {isProcessing ? 'Stämplar och sparar foto...' : `Fota ${currentStep.title}`}
                  </span>
                </button>
              )}

              {/* Step Navigation buttons */}
              <div className="flex items-center justify-between pt-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStepIdx((idx) => Math.max(0, idx - 1))}
                  disabled={currentStepIdx === 0}
                  className="min-h-[40px] px-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Föregående</span>
                </button>

                {/* Hoppa över detta steg (inget att fota här) */}
                {!capturedPhotos[currentStepIdx] ? (
                  <button
                    type="button"
                    onClick={handleSkipSingleStep}
                    className="min-h-[40px] px-3 rounded-lg border border-slate-700/80 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    title="Hoppa över detta steg utan att förlora andra bilder"
                  >
                    <span>Hoppa över detta steg</span>
                    <SkipForward className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStepIdx < totalSteps - 1) {
                        setCurrentStepIdx((idx) => idx + 1);
                      } else {
                        handleSaveAndClose();
                      }
                    }}
                    className="min-h-[40px] px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{currentStepIdx < totalSteps - 1 ? 'Nästa steg' : 'Klar'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with SAFE SAVE action */}
        <div className="bg-[#141824] border-t border-slate-800 p-3 sm:p-4 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{takenCount} av {totalSteps} foton sparade</span>
          </span>

          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-sky-400" />
            <span>{takenCount > 0 ? 'Spara tagna bilder & stäng' : 'Hoppa över & stäng'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
