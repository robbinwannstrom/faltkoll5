import React, { useState, useRef } from 'react';
import { Project, MomentDefinition, MomentRecord, MomentPhoto } from '../types';
import { fileToBase64Optimized, getFormattedCurrentTime } from '../db/indexedDb';
import { PHOTO_CATEGORIES, getDefaultCategoryForMoment } from '../utils/photoStorage';
import { Camera, CheckCircle2, X, Search, Check, Image as ImageIcon, Sparkles, Folder } from 'lucide-react';

interface PhotoQuickMenuModalProps {
  project: Project;
  moments: MomentDefinition[];
  onClose: () => void;
  onAddMomentPhoto: (momentId: string, photoBase64: string, category: string, caption?: string) => void;
}

export const PhotoQuickMenuModal: React.FC<PhotoQuickMenuModalProps> = ({
  project,
  moments,
  onClose,
  onAddMomentPhoto,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMomentIdForCamera, setActiveMomentIdForCamera] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Schakt');
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'MISSING_PHOTO' | 'HAS_PHOTO'>('ALL');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Recommended next moment: first moment that has 0 photos or is YELLOW
  const recommendedMoment =
    moments.find((m) => {
      const rec = project.moments[m.id];
      const count = rec?.photos?.length || (rec?.photoBase64 ? 1 : 0);
      return count === 0 && rec?.status === 'YELLOW';
    }) ||
    moments.find((m) => {
      const rec = project.moments[m.id];
      const count = rec?.photos?.length || (rec?.photoBase64 ? 1 : 0);
      return count === 0;
    }) ||
    moments[0];

  const handleTriggerCamera = (momentId: string) => {
    setActiveMomentIdForCamera(momentId);
    const def = moments.find((m) => m.id === momentId);
    setSelectedCategory(getDefaultCategoryForMoment(momentId, def?.phaseName));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeMomentIdForCamera) return;

    try {
      setIsProcessing(true);
      const m = moments.find((x) => x.id === activeMomentIdForCamera);
      const base64 = await fileToBase64Optimized(file, {
        momentId: activeMomentIdForCamera,
        momentTitle: m?.title,
        property: project.propertyDesignation,
      });
      onAddMomentPhoto(
        activeMomentIdForCamera,
        base64,
        selectedCategory,
        photoCaption.trim() || undefined
      );

      setSuccessMessage(`Foto sparat i "${selectedCategory}" för Moment ${activeMomentIdForCamera}!`);
      setPhotoCaption('');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert('Kunde inte läsa in fotot: ' + (err?.message || 'Okänt fel'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered moments list
  const filteredMoments = moments.filter((m) => {
    const rec = project.moments[m.id];
    const photoCount = rec?.photos?.length || (rec?.photoBase64 ? 1 : 0);
    const hasPhoto = photoCount > 0;

    if (filterMode === 'MISSING_PHOTO' && hasPhoto) return false;
    if (filterMode === 'HAS_PHOTO' && !hasPhoto) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.id.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.phaseName.toLowerCase().includes(q) ||
        m.amaCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPhotosCount = Object.values(project.moments).reduce((sum, rec) => {
    return sum + (rec.photos?.length || (rec.photoBase64 ? 1 : 0));
  }, 0);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      {/* Hidden file input for camera */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#10131c] border border-slate-700/90 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="bg-[#141824] border-b border-slate-800 p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> Fota & Välj underkategori
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {totalPhotosCount} bilder i projektet
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Ta foto till moment
            </h3>
            <p className="text-xs text-slate-400">
              Du kan ta flera foton per moment. Välj kategori (t.ex. Schakt, VA, Grund eller Kontrollbevis).
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

        {/* Success toast banner */}
        {successMessage && (
          <div className="bg-emerald-950/90 border-b border-emerald-600/60 p-3.5 px-5 flex items-center gap-3 text-emerald-200 text-sm font-semibold animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Processing notification */}
        {isProcessing && (
          <div className="bg-amber-950/90 border-b border-amber-600/60 p-3 px-5 flex items-center gap-3 text-amber-200 text-sm font-semibold">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Sparar och optimerar foto...</span>
          </div>
        )}

        {/* Scrollable content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Category Selector Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              Spara i underkategori:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PHOTO_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recommended next moment (Huge 1-click button for field worker) */}
          {recommendedMoment && (
            <div className="bg-gradient-to-br from-slate-900 via-[#131622] to-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Rekommenderat nästa foto
                </span>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  AMA: {recommendedMoment.amaCode}
                </span>
              </div>

              <div>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  Moment {recommendedMoment.id}: {recommendedMoment.title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fas: {recommendedMoment.phaseName}
                </p>
              </div>

              {/* Big Ergonomic Camera Button */}
              <button
                type="button"
                onClick={() => handleTriggerCamera(recommendedMoment.id)}
                disabled={isProcessing}
                className="w-full min-h-[58px] bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-base rounded-xl flex items-center justify-center gap-3 cursor-pointer transition-all shadow-lg touch-manipulation"
              >
                <Camera className="w-6 h-6 stroke-[2.2]" />
                <span className="truncate">
                  Fota Moment {recommendedMoment.id} ({selectedCategory})
                </span>
              </button>
            </div>
          )}

          {/* Filter and search bar */}
          <div className="space-y-2.5 pt-1">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sök moment..."
                  className="w-full min-h-[44px] pl-10 pr-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 outline-none focus:border-slate-500"
                />
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFilterMode('ALL')}
                  className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterMode === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Alla ({moments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('MISSING_PHOTO')}
                  className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterMode === 'MISSING_PHOTO'
                      ? 'bg-slate-800 text-amber-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Saknar foto
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('HAS_PHOTO')}
                  className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterMode === 'HAS_PHOTO'
                      ? 'bg-slate-800 text-emerald-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Har foton
                </button>
              </div>
            </div>

            {/* List of all moments */}
            <div className="space-y-2.5 pt-1">
              {filteredMoments.map((moment) => {
                const record = project.moments[moment.id];
                const photos = record?.photos || [];
                const photoCount = photos.length > 0 ? photos.length : record?.photoBase64 ? 1 : 0;

                return (
                  <div
                    key={moment.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      photoCount > 0
                        ? 'bg-[#0f1612] border-emerald-900/60'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold font-mono text-slate-200 bg-slate-800 px-2 py-0.5 rounded">
                          {moment.id}
                        </span>
                        <span className="text-xs text-slate-400">
                          AMA: {moment.amaCode}
                        </span>
                        {photoCount > 0 ? (
                          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-700/50 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" /> {photoCount} {photoCount === 1 ? 'foto' : 'foton'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-400/90 font-medium">
                            Kräver foto
                          </span>
                        )}
                      </div>

                      <h5 className="text-sm font-semibold text-white leading-snug truncate">
                        {moment.title}
                      </h5>
                      <p className="text-xs text-slate-400 truncate">
                        {moment.phaseName}
                      </p>
                    </div>

                    {/* Camera Action Button */}
                    <button
                      type="button"
                      onClick={() => handleTriggerCamera(moment.id)}
                      disabled={isProcessing}
                      className="min-h-[48px] w-full sm:w-auto px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95 touch-manipulation bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                    >
                      <Camera className="w-4 h-4 shrink-0" />
                      <span>{photoCount > 0 ? `+ Lägg till foto (${photoCount})` : 'Ta foto'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#141824] border-t border-slate-800 p-3 sm:p-4 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Foton sorteras automatiskt i projektets undermappar.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[46px] px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 cursor-pointer ml-auto"
          >
            Klar / Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
