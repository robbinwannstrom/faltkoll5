import React, { useState, useRef } from 'react';
import { MomentDefinition, MomentRecord, WeatherType, MomentPhoto } from '../types';
import { fileToBase64Optimized, getFormattedCurrentTime, getUserSettings } from '../db/indexedDb';
import { PHOTO_CATEGORIES, getDefaultCategoryForMoment, downloadPhotoDirect } from '../utils/photoStorage';
import { Camera, CheckCircle2, X, AlertTriangle, Sun, Cloud, CloudRain, Snowflake, ShieldCheck, Trash2, Plus, Eye, Folder } from 'lucide-react';

interface JuridiskControlModalProps {
  moment: MomentDefinition;
  currentRecord?: MomentRecord;
  onClose: () => void;
  onSaveLockedGreen: (updatedRecord: MomentRecord) => void;
  onOpenLightbox?: (url: string, title: string) => void;
}

export const JuridiskControlModal: React.FC<JuridiskControlModalProps> = ({
  moment,
  currentRecord,
  onClose,
  onSaveLockedGreen,
  onOpenLightbox,
}) => {
  const settings = getUserSettings();
  const [lockedTime] = useState<string>(currentRecord?.completedAt || getFormattedCurrentTime());
  const [weather, setWeather] = useState<WeatherType>(currentRecord?.weather || 'SOL');
  const [comment, setComment] = useState<string>(
    currentRecord?.comment || 'Kontrollerat och godkänt enligt ritning och AMA. Inga avvikelser.'
  );
  const [signature, setSignature] = useState<string>(
    currentRecord?.signature || settings.userName || ''
  );

  // Initialize multiple photos
  const initialPhotos: MomentPhoto[] =
    currentRecord?.photos && currentRecord.photos.length > 0
      ? [...currentRecord.photos]
      : currentRecord?.photoBase64
      ? [
          {
            id: 'legacy_1',
            dataUrl: currentRecord.photoBase64,
            capturedAt: currentRecord.completedAt || lockedTime,
            category: getDefaultCategoryForMoment(moment.id, moment.phaseName),
            caption: 'Fotobevis',
          },
        ]
      : [];

  const [photos, setPhotos] = useState<MomentPhoto[]>(initialPhotos);
  const [newPhotoCategory, setNewPhotoCategory] = useState<string>(
    getDefaultCategoryForMoment(moment.id, moment.phaseName)
  );
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      setError(null);
      const base64 = await fileToBase64Optimized(file);
      const newPhoto: MomentPhoto = {
        id: 'photo_' + Date.now(),
        dataUrl: base64,
        capturedAt: getFormattedCurrentTime(),
        category: newPhotoCategory,
      };

      setPhotos((prev) => [...prev, newPhoto]);

      // If user selected "APP_AND_DOWNLOAD", also trigger file download
      if (settings.photoSaveMode === 'APP_AND_DOWNLOAD') {
        downloadPhotoDirect(
          base64,
          `Egenkontroll_${newPhotoCategory}_Moment_${moment.id}_${newPhoto.capturedAt.replace(/[^0-9]/g, '_')}.jpg`
        );
      }
    } catch (err: any) {
      setError('Kunde inte läsa in fotot från kameran: ' + (err?.message || 'okänt fel'));
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleLockAndCertify = () => {
    // Legal Validation (Hålla ryggen fri)
    if (settings.requirePhotoToComplete && photos.length === 0) {
      setError('OBLIGATORISKT: Minst ett fotobevis måste bifogas innan momentet kan certifieras och låsas (aktiverat i dina inställningar).');
      return;
    }

    if (!comment.trim() || comment.trim().length < 5) {
      setError('OBLIGATORISKT: Fyll i en kommentar/avvikelserapport (minst 5 tecken, t.ex. "Utförts enligt ritning").');
      return;
    }

    if (!signature.trim() || signature.trim().length < 3) {
      setError('OBLIGATORISKT: Digital signatur krävs. Skriv ditt fullständiga för- och efternamn.');
      return;
    }

    const lockedRecord: MomentRecord = {
      momentId: moment.id,
      status: 'GREEN',
      comment: comment.trim(),
      signature: signature.trim(),
      photoBase64: photos[0]?.dataUrl, // primary for backward compatibility
      photos,
      completedAt: lockedTime,
      completedTimestamp: currentRecord?.completedTimestamp || Date.now(),
      weather,
    };

    onSaveLockedGreen(lockedRecord);
  };

  const weatherOptions: { type: WeatherType; label: string; icon: React.ReactNode }[] = [
    { type: 'SOL', label: 'Sol / Klart', icon: <Sun className="w-5 h-5 text-amber-400" /> },
    { type: 'MOLN', label: 'Molnigt', icon: <Cloud className="w-5 h-5 text-slate-300" /> },
    { type: 'REGN', label: 'Regn / Vått', icon: <CloudRain className="w-5 h-5 text-cyan-400" /> },
    { type: 'FROST_SNO', label: 'Frost / Snö', icon: <Snowflake className="w-5 h-5 text-blue-300" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0f121a] border-3 border-emerald-500 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-[#131722] border-b border-slate-800 p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-slate-800 text-slate-200 text-xs font-semibold px-2.5 py-0.5 rounded uppercase flex items-center gap-1 border border-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Slutför kontrollpunkt
              </span>
              <span className="text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded font-mono">
                AMA: {moment.amaCode}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
              Moment {moment.id}: {moment.title}
            </h3>
            <p className="text-xs text-slate-400">
              {moment.phaseName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 border border-slate-700"
            title="Stäng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-200 text-sm">
          {error && (
            <div className="bg-rose-950/80 border border-rose-600/70 rounded-xl p-3.5 flex items-start gap-3 text-rose-200 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Requirement 1: Photo Evidence (Multiple photos supported) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <span className="text-rose-400 font-bold">* 1.</span> Fotobevis ({photos.length} st)
              </label>
              <span className="text-xs text-slate-400">
                {moment.criticalValidationHint || 'Fota momentet från olika vinklar'}
              </span>
            </div>

            {/* Hidden native camera file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />

            {/* Photos List / Gallery */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {photos.map((p, idx) => (
                  <div
                    key={p.id}
                    className="bg-slate-950 rounded-xl border border-slate-700 overflow-hidden relative group flex flex-col"
                  >
                    <div className="h-28 bg-black relative">
                      <img
                        src={p.dataUrl}
                        alt="Fotobevis"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(p.id)}
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/75 hover:bg-rose-900 text-white flex items-center justify-center cursor-pointer"
                        title="Ta bort foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-2 bg-slate-900 text-[11px] flex items-center justify-between border-t border-slate-800">
                      <span className="text-emerald-400 font-semibold truncate">
                        ✓ Foto {idx + 1} ({p.category})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Category selection for next photo */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Folder className="w-3.5 h-3.5 text-amber-400" />
                  Mapp för nästa foto:
                </span>
                <span className="text-amber-300 font-semibold">{newPhotoCategory}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {PHOTO_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setNewPhotoCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      newPhotoCategory === cat.id
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {cat.id}
                  </button>
                ))}
              </div>

              {/* Add Photo Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="w-full min-h-[55px] bg-slate-900 hover:bg-slate-800 active:scale-98 border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-xl flex items-center justify-center gap-3 text-slate-200 font-bold text-sm cursor-pointer transition-all touch-manipulation"
              >
                <Camera className="w-5 h-5 text-amber-400" />
                <span>
                  {isProcessingPhoto
                    ? 'Läser in foto...'
                    : photos.length > 0
                    ? `+ Lägg till ytterligare foto (i ${newPhotoCategory})`
                    : `Ta fotobevis nu (sparas i ${newPhotoCategory})`}
                </span>
              </button>
            </div>
          </div>

          {/* Automatic Captured Data */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center justify-between">
              <span>Tids- och väderregistrering (Låses automatiskt)</span>
              <span className="text-[11px] bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
                Systemtid
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[11px] font-medium text-slate-400 block uppercase">
                  Tidsstämpel:
                </span>
                <span className="text-base font-mono font-bold text-slate-100">
                  {lockedTime}
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[11px] font-medium text-slate-400 block uppercase mb-1">
                  Väderförhållande:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {weatherOptions.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setWeather(opt.type)}
                      className={`min-h-[36px] px-2 py-1 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        weather === opt.type
                          ? 'bg-slate-700 text-white border-slate-500'
                          : 'bg-slate-800/60 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {opt.icon}
                      <span className="truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Requirement 2: Comment / Discrepancy */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <span className="text-rose-400 font-bold">* 2.</span> Anteckning / Kontrollutförande
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="T.ex. Utfört enligt ritning och AMA. Inga avvikelser."
              rows={3}
              className="w-full p-3.5 bg-slate-950 border border-slate-700 focus:border-slate-500 rounded-xl text-white font-normal text-sm sm:text-base outline-none transition-colors"
            />
            {/* Quick response helpers */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 py-1">Snabbval:</span>
              <button
                type="button"
                onClick={() => setComment('Kontrollerat och godkänt enligt ritning och AMA. Inga avvikelser.')}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700 cursor-pointer"
              >
                + Utan anmärkning
              </button>
              <button
                type="button"
                onClick={() => setComment('Höjder och fall inmätta och kontrollerade med laser.')}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700 cursor-pointer"
              >
                + Inmätt med laser
              </button>
              <button
                type="button"
                onClick={() => setComment('Packning utförd i skikt med markvibrator enligt föreskrift.')}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700 cursor-pointer"
              >
                + Packning OK
              </button>
              <button
                type="button"
                onClick={() => setComment('Provtryckning genomförd utan tryckfall. Rördragning godkänd.')}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700 cursor-pointer"
              >
                + Rördragning OK
              </button>
            </div>
          </div>

          {/* Requirement 3: Signature */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <span className="text-rose-400 font-bold">* 3.</span> Signatur (Fullständigt namn)
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="T.ex. Anders Karlsson"
              className="w-full min-h-[50px] px-4 bg-slate-950 border border-slate-700 focus:border-slate-500 rounded-xl text-white text-base font-semibold placeholder-slate-600 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
          <button
            type="button"
            onClick={handleLockAndCertify}
            className="min-h-[55px] px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-base sm:text-lg rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer touch-manipulation"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>Spara och godkänn</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[55px] px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-base rounded-xl border border-slate-700 flex items-center justify-center transition-all cursor-pointer touch-manipulation"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
};
