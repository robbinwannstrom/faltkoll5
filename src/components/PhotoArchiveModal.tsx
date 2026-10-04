import React, { useState } from 'react';
import { Project, MomentPhoto, UserSettings } from '../types';
import { PHOTO_CATEGORIES, exportProjectPhotosZip, downloadPhotoDirect } from '../utils/photoStorage';
import { ALL_MOMENTS } from '../data/momentsData';
import {
  Folder,
  FolderOpen,
  Download,
  Image as ImageIcon,
  X,
  CheckCircle2,
  Trash2,
  Eye,
  Settings2,
  Package,
  HardDrive,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Camera,
} from 'lucide-react';

interface PhotoArchiveModalProps {
  project: Project;
  userSettings: UserSettings;
  onUpdateUserSettings: (newSettings: UserSettings) => void;
  onClose: () => void;
  onOpenLightbox: (url: string, title: string) => void;
  onDeletePhoto?: (momentId: string, photoId: string) => void;
}

export const PhotoArchiveModal: React.FC<PhotoArchiveModalProps> = ({
  project,
  userSettings,
  onUpdateUserSettings,
  onClose,
  onOpenLightbox,
  onDeletePhoto,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Extract all photos from project moments
  const allPhotos: (MomentPhoto & { momentId: string; momentTitle: string })[] = [];

  // 1. Photos from moments
  for (const [momentId, record] of Object.entries(project.moments)) {
    const momentDef = ALL_MOMENTS.find((m) => m.id === momentId);
    if (record.photos && record.photos.length > 0) {
      record.photos.forEach((p) => {
        allPhotos.push({
          ...p,
          momentId,
          momentTitle: momentDef?.title || `Moment ${momentId}`,
        });
      });
    } else if (record.photoBase64) {
      allPhotos.push({
        id: 'legacy_' + momentId,
        dataUrl: record.photoBase64,
        capturedAt: record.completedAt || '',
        category: 'Grund',
        caption: record.comment,
        momentId,
        momentTitle: momentDef?.title || `Moment ${momentId}`,
      });
    }
  }

  // 2. Photos from pre-inspection / försyn
  if (project.preInspectionPhotos && project.preInspectionPhotos.length > 0) {
    project.preInspectionPhotos.forEach((p) => {
      allPhotos.push({
        ...p,
        momentId: 'Försyn',
        momentTitle: p.caption || 'Försyn & Skadedokumentation',
        category: 'Försyn',
      });
    });
  }

  const filteredPhotos =
    activeCategory === 'ALL'
      ? allPhotos
      : allPhotos.filter((p) => p.category === activeCategory);

  const handleExportZip = async () => {
    try {
      setIsExporting(true);
      await exportProjectPhotosZip(project);
    } catch (e: any) {
      alert('Kunde inte skapa ZIP-arkiv: ' + (e?.message || 'okänt fel'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleSaveMode = (mode: 'APP_ONLY' | 'APP_AND_DOWNLOAD') => {
    const updated = {
      ...userSettings,
      photoSaveMode: mode,
    };
    onUpdateUserSettings(updated);
  };

  // Distinct category list with counts
  const categoriesWithCounts = [
    { id: 'ALL', label: 'Alla foton', icon: '📋', count: allPhotos.length },
    {
      id: 'Försyn',
      label: 'Försyn & Skador',
      icon: '🛡️',
      count: allPhotos.filter((p) => p.category === 'Försyn').length,
    },
    {
      id: 'Schakt',
      label: 'Schakt & Terrass',
      icon: '🚜',
      count: allPhotos.filter((p) => p.category === 'Schakt').length,
    },
    {
      id: 'VA',
      label: 'VA & Rör',
      icon: '🚰',
      count: allPhotos.filter((p) => p.category === 'VA').length,
    },
    {
      id: 'Grund',
      label: 'Grund & Armering',
      icon: '🏗️',
      count: allPhotos.filter((p) => p.category === 'Grund').length,
    },
    {
      id: 'Kontrollbevis',
      label: 'Kontrollbevis',
      icon: '📜',
      count: allPhotos.filter((p) => p.category === 'Kontrollbevis').length,
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#10131c] border border-slate-700/90 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Header - Stora & tydliga primära åtgärder */}
        <div className="bg-[#141824] border-b border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Fotopärm
                </h3>
                <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                  {allPhotos.length} foton
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {project.name} • Sorterat per moment och underkategori
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* STORT OCH TYDLIGT: Exportera ZIP */}
            <button
              type="button"
              onClick={handleExportZip}
              disabled={isExporting || allPhotos.length === 0}
              className="min-h-[44px] px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-sm disabled:opacity-40"
              title="Ladda ner alla bilder sorterade i mappar på datorn/telefonen"
            >
              <Package className="w-4 h-4 stroke-[2.2]" />
              <span>{isExporting ? 'Packar ZIP...' : 'Ladda ner alla (ZIP)'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-all shrink-0 border border-slate-700"
              title="Stäng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs - Stora och lätt-tryckta */}
        <div className="bg-slate-950 p-2 sm:p-3 border-b border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {categoriesWithCounts.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`min-h-[44px] px-3.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span
                    className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Photos Grid - Rymlig och enkel */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Visar <strong>{filteredPhotos.length}</strong> foton i vald vy
            </span>
            <span className="font-mono text-[11px] text-slate-500 hidden sm:inline">
              Mapp: appen/jobb/{project.name.replace(/\s+/g, '_')}/{activeCategory}
            </span>
          </div>

          {filteredPhotos.length === 0 ? (
            <div className="py-14 text-center border-2 border-dashed border-slate-800 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-300">
                  Inga foton i denna kategori ännu
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Fota moment i kontrollistan så sorteras bilderna automatiskt in under denna flik.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredPhotos.map((photo, idx) => (
                <div
                  key={photo.id || idx}
                  className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col group transition-all hover:border-amber-400/60 shadow-sm"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() =>
                      onOpenLightbox(
                        photo.dataUrl,
                        `${photo.momentTitle} • ${photo.capturedAt}`
                      )
                    }
                    className="relative aspect-4/3 bg-black cursor-pointer overflow-hidden"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption || photo.momentTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Förstora</span>
                      </div>
                    </div>

                    <div className="absolute top-1.5 left-1.5 bg-slate-950/80 backdrop-blur-xs text-[10px] font-mono text-amber-300 px-1.5 py-0.5 rounded border border-slate-800">
                      {photo.category}
                    </div>
                  </div>

                  {/* Photo Info */}
                  <div className="p-2.5 bg-slate-900/90 flex flex-col justify-between flex-1 border-t border-slate-850 gap-1.5">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate" title={photo.momentTitle}>
                        {photo.momentTitle}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {photo.capturedAt}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                      <button
                        type="button"
                        onClick={() =>
                          downloadPhotoDirect(
                            photo.dataUrl,
                            `${project.name}_${photo.category}_${photo.momentId}_${photo.capturedAt.replace(/[: ]/g, '_')}.jpg`
                          )
                        }
                        className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                        title="Ladda ner fotot till telefonen"
                      >
                        <Download className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Spara</span>
                      </button>

                      {onDeletePhoto && photo.momentId !== 'Försyn' && (
                        <button
                          type="button"
                          onClick={() => onDeletePhoto(photo.momentId, photo.id)}
                          className="text-slate-500 hover:text-rose-400 cursor-pointer p-0.5"
                          title="Ta bort foto"
                        >
                          <Trash2 className="w-3 h-3 shrink-0" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collapsible Subtle Settings at bottom (För det man är inne på mer sällan) */}
        <div className="bg-[#121520] border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Settings2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Inställningar för bildlagring ({userSettings.photoSaveMode === 'APP_AND_DOWNLOAD' ? 'Spara i app + ladda ner fil' : 'Spara endast i appen'})</span>
            </span>
            {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showSettings && (
            <div className="p-4 pt-1 border-t border-slate-800/60 bg-slate-950/60 space-y-2 text-xs">
              <p className="text-slate-400 text-xs">
                Välj hur foton ska hanteras när du tar en bild i fält:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleSaveMode('APP_ONLY')}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2 cursor-pointer ${
                    userSettings.photoSaveMode !== 'APP_AND_DOWNLOAD'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <HardDrive className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-xs text-white">Spara i appen (Standard)</strong>
                    <span className="text-[11px] text-slate-400">
                      Bilden sparas säkert offline och kan exporteras som ZIP när du är klar.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleSaveMode('APP_AND_DOWNLOAD')}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2 cursor-pointer ${
                    userSettings.photoSaveMode === 'APP_AND_DOWNLOAD'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Download className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-xs text-white">Spara kopia i telefonen också</strong>
                    <span className="text-[11px] text-slate-400">
                      Laddar ner bildfilen automatiskt till telefonens galleri/hämtade filer.
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
