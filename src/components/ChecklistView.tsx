import React, { useState, useRef, useEffect } from 'react';
import {
  Project,
  MomentDefinition,
  MomentRecord,
  MomentStatus,
  MomentPhoto,
  UserSettings,
  AppLayoutMode,
} from '../types';
import { ALL_MOMENTS, PROJECT_TYPE_LABELS } from '../data/momentsData';
import { PhotoQuickMenuModal } from './PhotoQuickMenuModal';
import { PhotoArchiveModal } from './PhotoArchiveModal';
import { CrossMeasureCalculatorModal } from './CrossMeasureCalculatorModal';
import { QuickNotesModal } from './QuickNotesModal';
import { FieldHelperModal } from './FieldHelperModal';
import { MomentAiHelperModal } from './MomentAiHelperModal';
import { fileToBase64Optimized, getFormattedCurrentTime } from '../db/indexedDb';
import { getDefaultCategoryForMoment } from '../utils/photoStorage';
import { getSuggestionsForMoment } from '../data/momentCheckSuggestions';
import {
  getContextVocabulary,
  resolveAppContextMode,
} from '../utils/contextLabels';
import {
  CheckCircle2,
  Camera,
  FolderOpen,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  FileText,
  Lock,
  Compass,
  Bot,
  RefreshCw,
  Plus,
  Minus,
  Sparkles,
  Trash2,
  Eye,
  Eraser,
  PenTool,
  Check,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  Layers,
  History,
  ShieldCheck,
  Ruler,
  HelpCircle,
  Info,
  Filter,
  List,
  Table,
  LayoutGrid,
  Wrench,
  X,
} from 'lucide-react';

interface ChecklistViewProps {
  project: Project;
  userSettings: UserSettings;
  onUpdateUserSettings: (newSettings: UserSettings) => void;
  onUpdateProject: (updatedProject: Project) => void;
  onOpenReport: () => void;
  onBackToDashboard: () => void;
  onOpenRevisions?: () => void;
  onOpenTutorial?: () => void;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  project,
  userSettings,
  onUpdateUserSettings,
  onUpdateProject,
  onOpenReport,
  onBackToDashboard,
  onOpenRevisions,
  onOpenTutorial,
}) => {
  const relevantMoments =
    project.customMoments && project.customMoments.length > 0
      ? project.customMoments
      : ALL_MOMENTS.filter((m) => m.projectType === project.projectType);
  const typeInfo = PROJECT_TYPE_LABELS[project.projectType];

  const activeContextMode = resolveAppContextMode(userSettings);
  const vocab = getContextVocabulary(activeContextMode);

  // Distinct phases in chronological order
  const phases = Array.from(new Set(relevantMoments.map((m) => m.phaseName)));

  // Selected phase view or "ALL"
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOT_APPROVED' | 'GREEN' | 'YELLOW'>('ALL');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState<boolean>(false);

  const layoutMode: AppLayoutMode = userSettings.appLayoutMode || 'SIMPLE_LIST';
  const handleSetLayoutMode = (mode: AppLayoutMode) => {
    onUpdateUserSettings({
      ...userSettings,
      appLayoutMode: mode,
    });
  };

  // Expanded moment map (expanded moment id, or null for single open, or record)
  const [expandedMoments, setExpandedMoments] = useState<Record<string, boolean>>({});
  const [guidedStepIndex, setGuidedStepIndex] = useState<number>(0);

  // Modals state
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isCrossMeasureOpen, setIsCrossMeasureOpen] = useState(false);
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false);
  const [isFieldHelperOpen, setIsFieldHelperOpen] = useState(false);
  const [helperMoment, setHelperMoment] = useState<{ title: string; ama: string } | null>(null);
  const [activeMomentForAi, setActiveMomentForAi] = useState<MomentDefinition | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; title: string } | null>(null);

  const handleOpenMomentAiHelper = (moment: MomentDefinition) => {
    setActiveMomentForAi(moment);
  };

  const handleInsertAiNoteToMoment = (noteText: string) => {
    if (!activeMomentForAi) return;
    const currentComment = project.moments[activeMomentForAi.id]?.comment || '';
    const updatedComment = currentComment ? `${currentComment}\n\n${noteText}` : noteText;
    handleUpdateMomentComment(activeMomentForAi.id, updatedComment);
  };

  // Försyn Exemption Multi-step confirmation state
  const [isExemptModalOpen, setIsExemptModalOpen] = useState(false);
  const [exemptStep, setExemptStep] = useState<1 | 2>(1);
  const [exemptReason, setExemptReason] = useState(
    activeContextMode === 'WORKPLACE'
      ? 'Inga anslutande fastigheter eller grannar berörs'
      : 'Praktisk skolövning i övningshall / övningsbädd'
  );

  // Cloud sync status
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(project.lastSyncedAt || 'Sparad lokalt');

  // Hidden camera file input ref for direct card photo capture
  const directCameraInputRef = useRef<HTMLInputElement | null>(null);
  const [activeMomentForPhoto, setActiveMomentForPhoto] = useState<string | null>(null);
  const [photoCategoryForMoment, setPhotoCategoryForMoment] = useState<string>('Schakt');
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

  // Signature canvas states per moment
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const isDrawingMap = useRef<Record<string, boolean>>({});
  const hasDrawnMap = useRef<Record<string, boolean>>({});
  const [recentApprovedMomentId, setRecentApprovedMomentId] = useState<string | null>(null);

  // Stats calculation (strictly matched against relevantMoments)
  const totalCount = relevantMoments.length;
  const completedCount = relevantMoments.filter((m) => project.moments[m.id]?.status === 'GREEN').length;
  const inProgressCount = relevantMoments.filter((m) => project.moments[m.id]?.status === 'YELLOW').length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Total photos count across all moments
  const totalPhotosCount =
    Object.values(project.moments).reduce((sum, rec) => {
      return sum + (rec.photos?.length || (rec.photoBase64 ? 1 : 0));
    }, 0) + (project.preInspectionPhotos?.length || 0);

  // Ensure scroll is at top on mount/project change so user is never stuck in the middle
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [project.id]);

  const toggleMomentExpand = (momentId: string) => {
    setExpandedMoments((prev) => ({
      ...prev,
      [momentId]: !prev[momentId],
    }));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Trigger camera for a specific moment
  const handleTriggerCameraForMoment = (momentId: string, phaseName?: string) => {
    setActiveMomentForPhoto(momentId);
    const cat = getDefaultCategoryForMoment(momentId, phaseName);
    setPhotoCategoryForMoment(cat);
    if (directCameraInputRef.current) {
      directCameraInputRef.current.value = '';
      directCameraInputRef.current.click();
    }
  };

  const handleDirectCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeMomentForPhoto) return;

    try {
      setIsCapturingPhoto(true);
      const def = relevantMoments.find((m) => m.id === activeMomentForPhoto);
      const base64 = await fileToBase64Optimized(file, {
        momentId: activeMomentForPhoto,
        momentTitle: def?.title,
        property: project.propertyDesignation,
      });
      handleAddPhotoToMoment(activeMomentForPhoto, base64, photoCategoryForMoment);
    } catch (err: any) {
      alert('Kunde inte läsa in fotot: ' + (err?.message || 'Okänt fel'));
    } finally {
      setIsCapturingPhoto(false);
      setActiveMomentForPhoto(null);
    }
  };

  const handleAddPhotoToMoment = (momentId: string, base64: string, category: string) => {
    const time = getFormattedCurrentTime();
    const newPhoto: MomentPhoto = {
      id: 'ph_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      dataUrl: base64,
      capturedAt: time,
      category: category || 'Schakt',
    };

    const existingRecord: MomentRecord = project.moments[momentId] || {
      momentId,
      status: 'YELLOW',
      comment: '',
      signature: '',
      photos: [],
    };

    const updatedPhotos = existingRecord.photos ? [...existingRecord.photos, newPhoto] : [newPhoto];

    const updatedRecord: MomentRecord = {
      ...existingRecord,
      status: existingRecord.status === 'GREEN' ? 'GREEN' : 'YELLOW',
      photoBase64: base64,
      photos: updatedPhotos,
      completedAt: existingRecord.completedAt || time,
    };

    onUpdateProject({
      ...project,
      moments: {
        ...project.moments,
        [momentId]: updatedRecord,
      },
    });
  };

  const handleDeletePhotoFromMoment = (momentId: string, photoId: string) => {
    const existing = project.moments[momentId];
    if (!existing || !existing.photos) return;

    const filtered = existing.photos.filter((p) => p.id !== photoId);
    const updatedRecord: MomentRecord = {
      ...existing,
      photos: filtered,
      photoBase64: filtered.length > 0 ? filtered[0].dataUrl : undefined,
    };

    onUpdateProject({
      ...project,
      moments: {
        ...project.moments,
        [momentId]: updatedRecord,
      },
    });
  };

  // Update moment comment / notes
  const handleUpdateMomentComment = (momentId: string, text: string) => {
    const existing: MomentRecord = project.moments[momentId] || {
      momentId,
      status: 'RED',
      comment: '',
      signature: '',
    };

    const newStatus: MomentStatus =
      existing.status === 'RED' && text.trim().length > 0 ? 'YELLOW' : existing.status;

    onUpdateProject({
      ...project,
      moments: {
        ...project.moments,
        [momentId]: {
          ...existing,
          status: newStatus,
          comment: text,
        },
      },
    });
  };

  // Structured checks toggle & remove
  const handleToggleStructuredCheck = (momentId: string, checkLabel: string) => {
    const existing: MomentRecord = project.moments[momentId] || {
      momentId,
      status: 'RED',
      comment: '',
      signature: '',
      structuredChecks: [],
    };

    const currentChecks = existing.structuredChecks || [];
    const isAlreadyAdded = currentChecks.includes(checkLabel);

    let nextChecks: string[];
    if (isAlreadyAdded) {
      nextChecks = currentChecks.filter((item) => item !== checkLabel);
    } else {
      nextChecks = [...currentChecks, checkLabel];
    }

    onUpdateProject({
      ...project,
      moments: {
        ...project.moments,
        [momentId]: {
          ...existing,
          status: existing.status === 'RED' ? 'YELLOW' : existing.status,
          structuredChecks: nextChecks,
        },
      },
    });
  };

  const handleRemoveStructuredCheck = (momentId: string, checkLabel: string) => {
    const existing = project.moments[momentId];
    if (!existing || !existing.structuredChecks) return;

    const nextChecks = existing.structuredChecks.filter((item) => item !== checkLabel);
    onUpdateProject({
      ...project,
      moments: {
        ...project.moments,
        [momentId]: {
          ...existing,
          structuredChecks: nextChecks,
        },
      },
    });
  };

  // Set Moment status
  const handleSetStatus = (moment: MomentDefinition, newStatus: MomentStatus) => {
    const time = getFormattedCurrentTime();
    const existing: MomentRecord = project.moments[moment.id] || {
      momentId: moment.id,
      status: 'RED',
      comment: '',
      signature: '',
    };

    const signerName = userSettings.userName || `${vocab.roleStudentShort} / ${vocab.roleTeacherShort}`;

    const updatedRecord: MomentRecord = {
      ...existing,
      status: newStatus,
      completedAt: newStatus === 'GREEN' ? time : newStatus === 'RED' ? undefined : existing.completedAt,
      completedTimestamp: newStatus === 'GREEN' ? Date.now() : newStatus === 'RED' ? undefined : existing.completedTimestamp,
      signature:
        newStatus === 'GREEN'
          ? existing.signature || `${signerName} [Godkänd ${time}]`
          : newStatus === 'RED'
          ? ''
          : existing.signature,
    };

    onUpdateProject({
      ...project,
      moments: {
        ...project.moments,
        [moment.id]: updatedRecord,
      },
    });

    if (newStatus === 'GREEN') {
      setRecentApprovedMomentId(moment.id);
      setCloudSyncMsg(`Moment ${moment.id} (${moment.title}) är nu GODKÄNT!`);
      setTimeout(() => {
        setCloudSyncMsg(null);
        setRecentApprovedMomentId((prev) => (prev === moment.id ? null : prev));
      }, 4000);
    }
  };

  // Canvas Drawing & Touch Signature handlers
  const startDrawing = (momentId: string, x: number, y: number) => {
    const canvas = canvasRefs.current[momentId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingMap.current[momentId] = true;
    hasDrawnMap.current[momentId] = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#f97316'; // Safety orange ink
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (momentId: string, x: number, y: number) => {
    if (!isDrawingMap.current[momentId]) return;
    const canvas = canvasRefs.current[momentId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (momentId: string) => {
    isDrawingMap.current[momentId] = false;
  };

  const clearSignatureCanvas = (momentId: string) => {
    const canvas = canvasRefs.current[momentId];
    hasDrawnMap.current[momentId] = false;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Sign & Complete Moment from Canvas
  const handleSignMomentWithFinger = (momentId: string) => {
    const canvas = canvasRefs.current[momentId];
    const time = getFormattedCurrentTime();
    const existing: MomentRecord = project.moments[momentId] || {
      momentId,
      status: 'RED',
      comment: '',
      signature: '',
    };

    const signatureDataUrl =
      canvas && hasDrawnMap.current[momentId]
        ? canvas.toDataURL('image/png')
        : existing.signatureImage || '';
    const signerName = userSettings.userName || `${vocab.roleStudentShort} / ${vocab.roleTeacherShort}`;

    const updatedRecord: MomentRecord = {
      ...existing,
      status: 'GREEN',
      signature: `${signerName} [Signerat & godkänt ${time}]`,
      signatureImage: signatureDataUrl || existing.signatureImage,
      completedAt: time,
      completedTimestamp: Date.now(),
    };

    onUpdateProject({
      ...project,
      moments: {
        ...project.moments,
        [momentId]: updatedRecord,
      },
    });

    setRecentApprovedMomentId(momentId);
    setCloudSyncMsg(`Moment ${momentId} är nu GODKÄNT och signerat!`);
    setTimeout(() => {
      setCloudSyncMsg(null);
      setRecentApprovedMomentId((prev) => (prev === momentId ? null : prev));
    }, 4500);
  };

  // Cloud sync
  const handleSyncProjectCloud = async () => {
    try {
      setIsCloudSyncing(true);
      setCloudSyncMsg('Synkar med molnet...');
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      if (res.ok) {
        setCloudSyncMsg('Synkning klar! Allt sparat i molnet.');
      } else {
        setCloudSyncMsg('Sparat lokalt på enheten.');
      }
    } catch {
      setCloudSyncMsg('Offlineläge: Allt sparat lokalt på telefonen.');
    } finally {
      setIsCloudSyncing(false);
      setTimeout(() => setCloudSyncMsg(null), 4000);
    }
  };

  // Filter moments by phase
  const displayedMoments =
    selectedPhase === 'ALL'
      ? relevantMoments
      : relevantMoments.filter((m) => m.phaseName === selectedPhase);

  // Helper to dynamically interpolate entered kryssmått into instructions with *****
  const renderInstructionWithMeasurements = (text: string) => {
    if (!text.includes('*****')) return text;
    const diagonal = project.fieldMeasurements?.diagonal;
    const parts = text.split('*****');
    return (
      <span>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              diagonal ? (
                <button
                  type="button"
                  onClick={() => setIsCrossMeasureOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-black font-black px-2.5 py-0.5 rounded-lg font-mono text-sm sm:text-base mx-1 shadow-md shadow-orange-500/20 cursor-pointer align-baseline transition-transform active:scale-95"
                  title="Klicka för att se eller justera kryssmåttet"
                >
                  <Compass className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{diagonal.toFixed(2)} m</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCrossMeasureOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/60 px-2.5 py-0.5 rounded-lg font-bold text-xs sm:text-sm mx-1 cursor-pointer align-baseline transition-transform active:scale-95 animate-pulse"
                  title="Klicka här för att mata in längd och bredd i räknaren"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
                  <span>[📐 Ange kryssmått]</span>
                </button>
              )
            )}
          </React.Fragment>
        ))}
      </span>
    );
  };

  const handleConfirmExempt = () => {
    const updated: Project = {
      ...project,
      preInspectionExempted: true,
      preInspectionExemptReason: exemptReason || 'Undantag bekräftat',
    };
    onUpdateProject(updated);
    setIsExemptModalOpen(false);
    setCloudSyncMsg(
      `Försyn markerad som avböjd för detta ${vocab.projectNoun}. Du kan fortfarande utföra den när som helst!`
    );
    setTimeout(() => setCloudSyncMsg(null), 4000);
  };

  const renderMomentDetail = (
    moment: MomentDefinition,
    record: MomentRecord,
    status: MomentStatus,
    photos: MomentPhoto[]
  ) => {
    return (
      <div className="p-6 sm:p-8 border-t-2 border-[#262626] bg-[#121212] space-y-8 animate-in fade-in duration-200">
        {/* SNABBSTATUS & GODKÄNNANDE-BANNER HÖGST UPP I MOMENTET */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            status === 'GREEN'
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-100 shadow-lg shadow-emerald-950/40'
              : status === 'YELLOW'
              ? 'bg-amber-950/40 border-amber-500/60 text-amber-100'
              : 'bg-[#181818] border-[#2e2e2e] text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black ${
                status === 'GREEN'
                  ? 'bg-emerald-500 text-black'
                  : status === 'YELLOW'
                  ? 'bg-amber-500 text-black'
                  : 'bg-[#242424] text-slate-400'
              }`}
            >
              {status === 'GREEN' ? (
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black uppercase tracking-wider">
                {status === 'GREEN'
                  ? '✓ DETTA MOMENT ÄR GODKÄNT & KLART'
                  : status === 'YELLOW'
                  ? 'MOMENTET ÄR PÅBÖRJAT (EJ SLUTGODKÄNT ÄN)'
                  : 'STATUS: EJ PÅBÖRJAT MOMENT'}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {status === 'GREEN'
                  ? `${record.signature || 'Signerat'} ${record.completedAt ? `(${record.completedAt})` : ''}`
                  : 'Klicka på "Godkänn moment" när kontrollen är utförd, eller signera med fingret längst ner.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {status !== 'GREEN' ? (
              <button
                type="button"
                onClick={() => handleSetStatus(moment, 'GREEN')}
                className="min-h-[42px] px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Godkänn moment direkt</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSetStatus(moment, 'YELLOW')}
                className="min-h-[40px] px-3.5 bg-[#16281e] hover:bg-[#1f382a] text-emerald-300 border border-emerald-600 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ändra till pågående</span>
              </button>
            )}

            {status !== 'RED' && (
              <button
                type="button"
                onClick={() => handleSetStatus(moment, 'RED')}
                className="min-h-[40px] px-3 bg-[#1c1c1c] hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-[#333] rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Nollställ
              </button>
            )}
          </div>
        </div>

        {/* ELEMENT 1 (Överst): En låst textruta med stor och tydlig typografi */}
        <div className="bg-[#181818] border-2 border-[#2a2a2a] rounded-3xl p-6 sm:p-7 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-400" />
              <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-orange-400">
                {vocab.instructionHeading}
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 bg-[#121212] px-2.5 py-1 rounded-lg border border-[#333333]">
              AMA {moment.amaCode}
            </span>
          </div>

          {/* Huvudinstruktion med stor, tydlig typografi och dynamiskt kryssmått */}
          <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
            {renderInstructionWithMeasurements(moment.instruction)}
          </p>

          {/* AI-HJÄLPAREN FÖR DETTA MOMENT */}
          {project.exerciseSettings?.allowAiHelper !== false && (
            <div className="bg-gradient-to-r from-sky-950/70 via-[#0e1624] to-sky-950/40 border-2 border-sky-500/40 hover:border-sky-400/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-sky-950/40 transition-all">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/40 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI-Hjälparen för Moment {moment.id}
                    </span>
                    <span className="text-[10px] font-bold bg-sky-900/90 text-sky-200 px-2 py-0.5 rounded-full border border-sky-700">
                      Smart ordförklaring & frågor
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                    Förstår du inte någon del av texten eller begreppen? Klicka för snabbförklaringar eller ställ egna frågor fritt!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenMomentAiHelper(moment)}
                className="w-full sm:w-auto px-5 py-2.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-500/20 shrink-0"
              >
                <Bot className="w-4 h-4" />
                <span>Fråga AI-hjälparen</span>
              </button>
            </div>
          )}

          {/* Dynamiskt kryssmått hjälpmedel om momentet kräver kryssmått */}
          {(moment.instruction.toLowerCase().includes('kryssmått') ||
            moment.instruction.toLowerCase().includes('kryssmätning') ||
            moment.instruction.includes('*****')) && (
            <div className="bg-[#1e1710] border border-orange-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-black text-orange-400 uppercase tracking-wider block">
                    Hjälpmedel: Registrerat kryssmått för {vocab.projectNounDefinite}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 mt-0.5">
                    {project.fieldMeasurements?.diagonal ? (
                      <>
                        Kontrollera diagonalen mot{' '}
                        <span className="font-mono font-black text-orange-400 bg-orange-950 px-2 py-0.5 rounded border border-orange-800">
                          {project.fieldMeasurements.diagonal.toFixed(2)} m
                        </span>{' '}
                        (beräknat från Sida A: {project.fieldMeasurements.sideA || '-'} m, Sida B: {project.fieldMeasurements.sideB || '-'} m).
                      </>
                    ) : (
                      'Inget kryssmått registrerat än. Ange mått här så räknas diagonalen ut automatiskt.'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCrossMeasureOpen(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-xl cursor-pointer transition-all active:scale-95 shrink-0 shadow-md shadow-orange-500/20"
              >
                {project.fieldMeasurements?.diagonal ? 'Justera mått' : 'Räkna ut kryssmått'}
              </button>
            </div>
          )}

          {/* Kritiskt fotokrav & Yrkeslärarens råd */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Kritiskt dolt moment att fota */}
            <div className="bg-[#121212] border-2 border-orange-500/40 rounded-2xl p-4 space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Camera className="w-4 h-4 stroke-[2.5]" />
                Kritiskt dolt moment:
              </span>
              <p className="text-xs sm:text-sm text-slate-200 font-semibold leading-relaxed">
                {moment.criticalValidationHint || 'Fota utfört moment med tydlig referens innan övertäckning.'}
              </p>
            </div>

            {/* Branschråd / Handledarens / Yrkeslärarens fältråd */}
            <div className="bg-[#121212] border border-[#333333] rounded-2xl p-4 space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {vocab.proTipHeading}
              </span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {moment.proTip}
              </p>
            </div>
          </div>

          {/* Del-checklista för momentet */}
          {moment.customChecklist && moment.customChecklist.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#121212] border-2 border-emerald-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {vocab.customChecklistHeading}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {moment.customChecklist.filter((item) => record.structuredChecks?.includes(item)).length} av {moment.customChecklist.length} klara
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {moment.customChecklist.map((item, idx) => {
                  const isChecked = record.structuredChecks?.includes(item);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleStructuredCheck(moment.id, item)}
                      className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                          : 'bg-[#181818] border-[#2e2e2e] text-slate-300 hover:border-emerald-500/50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-400 text-black'
                            : 'bg-[#121212] border-[#444]'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="leading-snug">{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standardmallar & Förslag på kontroller med Minus-knapp */}
          <div className="space-y-2 pt-2 border-t border-[#262626]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">
                Snabbval för egenkontroll (AMA {moment.amaCode}):
              </span>
              <span className="text-slate-500">Klicka för att lägga till eller ta bort</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {getSuggestionsForMoment(moment.id).map((sug) => {
                const isAdded = record.structuredChecks?.includes(sug.label);
                return (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => handleToggleStructuredCheck(moment.id, sug.label)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      isAdded
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                        : 'bg-[#121212] text-slate-300 border-[#333333] hover:border-orange-500 hover:text-white'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
                        <span>{sug.label}</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveStructuredCheck(moment.id, sug.label);
                          }}
                          className="w-4 h-4 rounded-full bg-emerald-900 hover:bg-rose-600 text-rose-200 hover:text-white flex items-center justify-center font-bold text-xs shrink-0"
                          title="Ta bort detta val (-)"
                        >
                          -
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-orange-400 font-black shrink-0">+</span>
                        <span>{sug.label}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ELEMENT 2 (Mitten): Egen anteckning / Avvikelse */}
        <div className="space-y-3">
          <label className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-200 block">
            {vocab.commentLabel}
          </label>

          <textarea
            rows={5}
            value={record.comment || ''}
            onChange={(e) => handleUpdateMomentComment(moment.id, e.target.value)}
            placeholder={vocab.commentPlaceholder}
            className="w-full min-h-[140px] p-5 bg-[#141414] border-2 border-[#2e2e2e] focus:border-orange-500 rounded-3xl text-white text-base leading-relaxed outline-none resize-y placeholder-slate-500 shadow-inner"
          />

          {/* Visning av valda strukturerade kontroller med minusknapp [-] */}
          {record.structuredChecks && record.structuredChecks.length > 0 && (
            <div className="p-3 bg-[#162019] border border-emerald-700/80 rounded-2xl flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-emerald-300">
                Valda kontrollpunkter:
              </span>
              {record.structuredChecks.map((item, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 bg-[#0f1712] border border-emerald-600 text-emerald-200 text-xs px-3 py-1 rounded-xl font-medium"
                >
                  <span>✓ {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStructuredCheck(moment.id, item)}
                    className="w-4 h-4 rounded-full bg-emerald-950 hover:bg-rose-600 text-white flex items-center justify-center cursor-pointer transition-colors ml-1"
                    title="Ta bort (-)"
                  >
                    -
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ELEMENT 3 (Nedanför): Fotodokumentation */}
        <div className="space-y-4">
          {/* GDPR & Skolsäkerhet Fotoregler */}
          <div className="flex items-center gap-2 p-2.5 bg-[#121c16] border border-emerald-800/60 rounded-xl text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>GDPR & Skolintegritet:</strong> Fota endast anläggningskonstruktionen och mätredskap. Undvik ansikten eller identifierbara personer.</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-400" />
                <span>Fotodokumentation ({photos.length})</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {photos.length === 0
                  ? 'Kräver tydligt kontrollfoto med mätstock/laser innan momentet godkänns.'
                  : `${photos.length} tidsstämplade foton sparade för moment ${moment.id}.`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTriggerCameraForMoment(moment.id, moment.phaseName)}
                className="min-h-[44px] px-4 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-orange-500/20 transition-all"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span>Ta foto direkt</span>
              </button>

              <label className="min-h-[44px] px-4 bg-[#1e1e1e] hover:bg-[#282828] text-white border border-[#333333] rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors">
                <Plus className="w-4 h-4" />
                <span>Välj fil</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          handleAddPhotoToMoment(
                            moment.id,
                            reader.result,
                            getDefaultCategoryForMoment(moment.id, moment.phaseName)
                          );
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Fotogalleri */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group rounded-2xl overflow-hidden border-2 border-[#333333] hover:border-orange-500 bg-[#0d0d0d] aspect-4/3 flex flex-col justify-end transition-all shadow-md"
                >
                  <img
                    src={photo.dataUrl}
                    alt="Kontrollfoto"
                    className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                    onClick={() =>
                      setLightboxPhoto({
                        url: photo.dataUrl,
                        title: `${moment.id} ${moment.title} (${photo.category || 'Kontroll'})`,
                      })
                    }
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                  <div className="relative p-2.5 flex items-center justify-between text-[11px] text-white font-mono">
                    <span className="truncate bg-black/60 px-1.5 py-0.5 rounded text-[10px]">
                      {photo.capturedAt || 'Foto'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeletePhotoFromMoment(moment.id, photo.id)}
                      className="p-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white cursor-pointer transition-colors"
                      title="Ta bort foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ELEMENT 4 (Längst ner): Namnteckning / Signering med fingret */}
        <div className="space-y-4 pt-4 border-t-2 border-[#262626]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-orange-400" />
                <span>
                  {status === 'GREEN'
                    ? 'Momentet är Godkänt & Signerat'
                    : 'Signera & Godkänn momentet med fingret'}
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {status === 'GREEN'
                  ? `Godkänt av: ${record.signature || userSettings.userName || `${vocab.roleStudentShort} / ${vocab.roleTeacherShort}`}`
                  : 'Rita din namnteckning direkt i rutan nedan med fingret eller musen och klicka på Godkänn.'}
              </p>
            </div>

            {status === 'GREEN' && (
              <span className="text-xs font-mono font-black text-black bg-emerald-400 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>GODKÄNT {record.completedAt ? `• ${record.completedAt}` : ''}</span>
              </span>
            )}
          </div>

          {/* Tydlig grön bekräftelseruta när momentet är godkänt */}
          {status === 'GREEN' && (
            <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-black flex items-center justify-center shrink-0 font-black shadow-md">
                  <Check className="w-6 h-6 stroke-[3.5]" />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-black text-emerald-300 block">
                    ✅ Moment {moment.id} är godkänt och registrerat i egenkontrollen!
                  </span>
                  <span className="text-xs text-emerald-100/90 block mt-0.5">
                    Signatur: {record.signature || 'Godkänd'} • Tidpunkt: {record.completedAt || 'Idag'}
                  </span>
                </div>
              </div>

              {record.signatureImage && (
                <div className="bg-[#0a140e] border border-emerald-700 rounded-xl p-2 shrink-0 flex flex-col items-center">
                  <img
                    src={record.signatureImage}
                    alt="Sparad signatur"
                    className="h-12 object-contain"
                  />
                  <span className="text-[10px] font-mono text-emerald-400">
                    Sparad namnteckning
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Interaktiv touch canvas för fingerritning */}
          <div className="space-y-3">
            <div className="border-2 border-dashed border-[#444444] rounded-2xl bg-[#0f0f0f] relative overflow-hidden">
              <canvas
                ref={(el) => {
                  canvasRefs.current[moment.id] = el;
                }}
                width={700}
                height={180}
                className="w-full h-[160px] sm:h-[180px] touch-none cursor-crosshair"
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const scaleX = e.currentTarget.width / rect.width;
                  const scaleY = e.currentTarget.height / rect.height;
                  startDrawing(
                    moment.id,
                    (e.clientX - rect.left) * scaleX,
                    (e.clientY - rect.top) * scaleY
                  );
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const scaleX = e.currentTarget.width / rect.width;
                  const scaleY = e.currentTarget.height / rect.height;
                  draw(
                    moment.id,
                    (e.clientX - rect.left) * scaleX,
                    (e.clientY - rect.top) * scaleY
                  );
                }}
                onMouseUp={() => stopDrawing(moment.id)}
                onMouseLeave={() => stopDrawing(moment.id)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const rect = e.currentTarget.getBoundingClientRect();
                  const scaleX = e.currentTarget.width / rect.width;
                  const scaleY = e.currentTarget.height / rect.height;
                  startDrawing(
                    moment.id,
                    (touch.clientX - rect.left) * scaleX,
                    (touch.clientY - rect.top) * scaleY
                  );
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const rect = e.currentTarget.getBoundingClientRect();
                  const scaleX = e.currentTarget.width / rect.width;
                  const scaleY = e.currentTarget.height / rect.height;
                  draw(
                    moment.id,
                    (touch.clientX - rect.left) * scaleX,
                    (touch.clientY - rect.top) * scaleY
                  );
                }}
                onTouchEnd={() => stopDrawing(moment.id)}
              />

              {/* Hjälptext i bakgrunden */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-700 font-mono text-sm font-bold select-none opacity-40">
                {status === 'GREEN'
                  ? '[ MOMENT GODKÄNT - RITA HÄR FÖR ATT UPPDATERA SIGNATUR ]'
                  : '[ RITA SIGNATUR HÄR ]'}
              </div>
            </div>

            {/* Signaturåtgärder */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => clearSignatureCanvas(moment.id)}
                  className="flex-1 sm:flex-none min-h-[46px] px-4 bg-[#1e1e1e] hover:bg-[#282828] text-slate-300 border border-[#3c3c3c] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Eraser className="w-4 h-4" />
                  <span>Rensa ruta</span>
                </button>

                {status === 'GREEN' && (
                  <button
                    type="button"
                    onClick={() => handleSetStatus(moment, 'YELLOW')}
                    className="flex-1 sm:flex-none min-h-[46px] px-4 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/80 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Ångra godkännande</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleSignMomentWithFinger(moment.id)}
                className={`w-full sm:w-auto min-h-[54px] px-8 font-black text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-lg cursor-pointer transition-all active:scale-95 ${
                  status === 'GREEN'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/25'
                    : 'bg-orange-500 hover:bg-orange-400 text-black shadow-orange-500/20'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3.5]" />
                <span>
                  {status === 'GREEN'
                    ? '✓ Momentet är Godkänt & Signerat!'
                    : 'Godkänn & Signera Moment'}
                </span>
              </button>
            </div>

            {recentApprovedMomentId === moment.id && (
              <div className="p-3 bg-emerald-500 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                <span>Sparat! Moment {moment.id} är nu markerat som GODKÄNT!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-32 space-y-6 font-sans">
      {/* Hidden file input for mobile direct camera capture */}
      <input
        type="file"
        ref={directCameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleDirectCameraChange}
        className="hidden"
      />

      {/* REN TOPPRAD — Inga utspridda filter eller stora rutor i toppen */}
      <div className="bg-[#161616] border border-[#262626] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="w-10 h-10 rounded-xl bg-[#121212] hover:bg-[#222222] text-white flex items-center justify-center border border-[#2e2e2e] cursor-pointer transition-colors shrink-0"
              title="Tillbaka till översikten"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                  {project.name}
                </h1>
                <span className="text-[11px] font-bold text-slate-300 bg-[#202020] border border-[#333] px-2 py-0.5 rounded-md">
                  {typeInfo.title}
                </span>
                {!vocab.hideSchoolFeatures && project.exerciseSettings?.examMode && (
                  <span className="text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-700 px-2 py-0.5 rounded-md">
                    Provläge
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 mt-0.5">
                <span>
                  <strong className="text-white font-mono">{completedCount}/{totalCount}</strong> moment godkända ({progressPercent}%)
                </span>
                {project.propertyDesignation && (
                  <span>• {project.propertyDesignation}</span>
                )}
                {project.fieldMeasurements?.diagonal && (
                  <span className="text-amber-400 font-mono">
                    • Kryssmått: {project.fieldMeasurements.diagonal.toFixed(2)} m
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Knappar i toppen: Filter & Vy | Verktyg | Snabbfota */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* 1. FILTER & VY KNAPP (Faser, Status & Layout ligger samlade här under!) */}
            <button
              type="button"
              onClick={() => {
                setIsFilterPanelOpen(!isFilterPanelOpen);
                setIsToolsPanelOpen(false);
              }}
              className={`min-h-[40px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border cursor-pointer transition-colors ${
                isFilterPanelOpen || selectedPhase !== 'ALL' || statusFilter !== 'ALL'
                  ? 'bg-orange-500/15 border-orange-500/60 text-orange-300'
                  : 'bg-[#121212] hover:bg-[#222222] text-slate-200 border-[#2e2e2e]'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-orange-400" />
              <span>Filter & Vy</span>
              {(selectedPhase !== 'ALL' || statusFilter !== 'ALL') && (
                <span className="w-2 h-2 rounded-full bg-orange-400" />
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  isFilterPanelOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* 2. FÄLTVERKTYG KNAPP (Försyn, Kryssmått, Fotopärm, Fältbok) */}
            <button
              type="button"
              onClick={() => {
                setIsToolsPanelOpen(!isToolsPanelOpen);
                setIsFilterPanelOpen(false);
              }}
              className={`min-h-[40px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border cursor-pointer transition-colors ${
                isToolsPanelOpen
                  ? 'bg-orange-500/15 border-orange-500/60 text-orange-300'
                  : 'bg-[#121212] hover:bg-[#222222] text-slate-200 border-[#2e2e2e]'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-orange-400" />
              <span>Verktyg</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  isToolsPanelOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* 3. SNABBFOTA */}
            <button
              type="button"
              onClick={() => setIsPhotoMenuOpen(true)}
              className="min-h-[40px] px-3.5 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
              title="Snabbfota till valfritt moment"
            >
              <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Snabbfota</span>
            </button>
          </div>
        </div>

        {/* Enkel, tunn framstegslinje */}
        <div className="w-full h-1.5 bg-[#111111] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progressPercent === 100 ? 'bg-emerald-500' : 'bg-orange-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {cloudSyncMsg && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cloudSyncMsg}</span>
          </div>
        )}

        {/* PANEL 1: FILTER & VY (Öppnas när man klickar på Filter & Vy) */}
        {isFilterPanelOpen && (
          <div className="pt-3 border-t border-[#262626] space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-orange-400" />
                <span>Filtrera faser, status & välj layout</span>
              </span>
              <div className="flex items-center gap-2">
                {(selectedPhase !== 'ALL' || statusFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhase('ALL');
                      setStatusFilter('ALL');
                    }}
                    className="text-[11px] font-bold text-orange-400 hover:underline cursor-pointer"
                  >
                    Visa alla moment
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Layout-väljare */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Layout / Utseende:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetLayoutMode('SIMPLE_LIST')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer ${
                      layoutMode === 'SIMPLE_LIST'
                        ? 'bg-orange-500 text-black border-orange-400 font-black'
                        : 'bg-[#121212] text-slate-300 border-[#2a2a2a] hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Enkel lista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetLayoutMode('COMPACT')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer ${
                      layoutMode === 'COMPACT'
                        ? 'bg-orange-500 text-black border-orange-400 font-black'
                        : 'bg-[#121212] text-slate-300 border-[#2a2a2a] hover:text-white'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Tabellvy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetLayoutMode('FIELD_CLEAR')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer ${
                      layoutMode === 'FIELD_CLEAR'
                        ? 'bg-orange-500 text-black border-orange-400 font-black'
                        : 'bg-[#121212] text-slate-300 border-[#2a2a2a] hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Stora kort</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetLayoutMode('GUIDED_STEP')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer ${
                      layoutMode === 'GUIDED_STEP'
                        ? 'bg-orange-500 text-black border-orange-400 font-black'
                        : 'bg-[#121212] text-slate-300 border-[#2a2a2a] hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Steg-vy</span>
                  </button>
                </div>
              </div>

              {/* Statusfilter */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Filtrera på status:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'ALL', label: 'Alla' },
                    { id: 'NOT_APPROVED', label: 'Ej klara' },
                    { id: 'YELLOW', label: 'Pågående' },
                    { id: 'GREEN', label: 'Godkända' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatusFilter(st.id as any)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border cursor-pointer ${
                        statusFilter === st.id
                          ? 'bg-white text-black border-white font-black'
                          : 'bg-[#121212] text-slate-300 border-[#2a2a2a] hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Faser under Filter-knappen */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {vocab.phasesLabel}:
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedPhase('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    selectedPhase === 'ALL'
                      ? 'bg-orange-500 text-black border-orange-400 font-black'
                      : 'bg-[#121212] text-slate-300 border-[#2a2a2a] hover:text-white'
                  }`}
                >
                  Alla faser ({relevantMoments.length})
                </button>
                {phases.map((phase) => {
                  const pMoments = relevantMoments.filter((m) => m.phaseName === phase);
                  const pDone = pMoments.filter((m) => project.moments[m.id]?.status === 'GREEN').length;
                  const isSelected = selectedPhase === phase;
                  return (
                    <button
                      key={phase}
                      type="button"
                      onClick={() => setSelectedPhase(phase)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-orange-500 text-black border-orange-400 font-black'
                          : 'bg-[#121212] text-slate-300 border-[#2a2a2a] hover:text-white'
                      }`}
                    >
                      <span>{phase}</span>
                      <span className="font-mono text-[10px] opacity-80">
                        ({pDone}/{pMoments.length})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: FÄLTVERKTYG (Försyn, Kryssmått, Fotopärm, Fältbok) */}
        {isToolsPanelOpen && (
          <div className="pt-3 border-t border-[#262626] space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-orange-400" />
                <span>Fältverktyg & Projekthjälpmedel</span>
              </span>
              <button
                type="button"
                onClick={() => setIsToolsPanelOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. Kryssmått & Fältmått */}
              <div className="p-3 rounded-xl bg-[#121212] border border-[#2a2a2a] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kryssmått & 3-4-5</span>
                    {project.fieldMeasurements?.diagonal && (
                      <span className="font-mono text-[11px] bg-orange-500 text-black px-1.5 py-0.2 rounded font-bold">
                        {project.fieldMeasurements.diagonal.toFixed(2)} m
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {project.fieldMeasurements?.diagonal
                      ? `Sida A: ${project.fieldMeasurements.sideA} m • Sida B: ${project.fieldMeasurements.sideB} m`
                      : 'Räkna ut diagonalen automatiskt'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsToolsPanelOpen(false);
                    setIsCrossMeasureOpen(true);
                  }}
                  className="px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-amber-300 border border-[#383838] rounded-lg text-xs font-bold cursor-pointer shrink-0"
                >
                  Öppna
                </button>
              </div>

              {/* 2. Försyn & Skadeguide */}
              <div className="p-3 rounded-xl bg-[#121212] border border-[#2a2a2a] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                    <span>Försyn & Skadeguide</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        project.preInspectionCompleted
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : project.preInspectionExempted
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-[#222] text-slate-400'
                      }`}
                    >
                      {project.preInspectionCompleted
                        ? `${project.preInspectionPhotos?.length || 0} foton`
                        : project.preInspectionExempted
                        ? 'Avböjd'
                        : 'Ej fotad'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Dokumentera fasad, staket & asfalt före schakt
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {onOpenTutorial && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsPanelOpen(false);
                        onOpenTutorial();
                      }}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Fota
                    </button>
                  )}
                  {!project.preInspectionCompleted && !project.preInspectionExempted && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsPanelOpen(false);
                        setExemptStep(1);
                        setIsExemptModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-slate-300 border border-[#333] rounded-lg text-xs font-medium cursor-pointer"
                    >
                      Avböj
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Fotopärm & Fältbok & Bygghjälp */}
              <div className="sm:col-span-2 flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsToolsPanelOpen(false);
                    setIsArchiveOpen(true);
                  }}
                  className="px-3.5 py-2 bg-[#121212] hover:bg-[#1e1e1e] text-slate-200 border border-[#2c2c2c] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-orange-400" />
                  <span>Fotopärm ({totalPhotosCount} bilder)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsToolsPanelOpen(false);
                    setIsQuickNotesOpen(true);
                  }}
                  className="px-3.5 py-2 bg-[#121212] hover:bg-[#1e1e1e] text-slate-200 border border-[#2c2c2c] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>Fältbok & Måttnoteringar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsToolsPanelOpen(false);
                    setHelperMoment(null);
                    setIsFieldHelperOpen(true);
                  }}
                  className="px-3.5 py-2 bg-[#121212] hover:bg-[#1e1e1e] text-slate-200 border border-[#2c2c2c] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bygghjälp & Problemlösare (AMA)</span>
                </button>

                {onOpenRevisions && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsPanelOpen(false);
                      onOpenRevisions();
                    }}
                    className="px-3.5 py-2 bg-[#121212] hover:bg-[#1e1e1e] text-slate-200 border border-[#2c2c2c] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>Versionshistorik</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Aktiv filterindikator (visas endast om ett filter är valt) */}
      {(selectedPhase !== 'ALL' || statusFilter !== 'ALL') && !isFilterPanelOpen && (
        <div className="flex items-center justify-between bg-[#161616] border border-[#282828] rounded-xl px-3.5 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-300">
            <span className="text-slate-500">Aktivt filter:</span>
            {selectedPhase !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30 font-bold">
                {selectedPhase}
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30 font-bold">
                {statusFilter === 'NOT_APPROVED'
                  ? 'Ej klara'
                  : statusFilter === 'GREEN'
                  ? 'Godkända'
                  : 'Pågående'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedPhase('ALL');
              setStatusFilter('ALL');
            }}
            className="text-orange-400 hover:underline font-bold cursor-pointer"
          >
            Rensa filter ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHECKLISTA - FYRA VERKLIGT UNIKA LAYOUT-PRESETS                          */}
      {/* 1. GUIDED_STEP: Pedagogisk Steg-för-steg fokusvy med stepper & knappar    */}
      {/* 2. COMPACT: Tät ingenjörstabell med kolumner för status, nr, kod & foto   */}
      {/* 3. FIELD_CLEAR: Stora taktila fältkort för solsken & handskar             */}
      {/* 4. SIMPLE_LIST: Minimalistisk, avskalad radvy utan visuell röra          */}
      {/* ========================================================================= */}

      {(() => {
        // Gemensam filtrering av moment
        const displayedMoments = relevantMoments.filter((m) => {
          if (selectedPhase !== 'ALL' && m.phaseName !== selectedPhase) return false;
          const st = project.moments[m.id]?.status || 'RED';
          if (statusFilter === 'NOT_APPROVED') return st !== 'GREEN';
          if (statusFilter === 'GREEN') return st === 'GREEN';
          if (statusFilter === 'YELLOW') return st === 'YELLOW';
          return true;
        });

        const getMomentRecordAndPhotos = (moment: MomentDefinition) => {
          const record = project.moments[moment.id] || {
            momentId: moment.id,
            status: 'RED',
            comment: '',
            signature: '',
          };
          const status = record.status || 'RED';
          const photos =
            record.photos && record.photos.length > 0
              ? record.photos
              : record.photoBase64
              ? [
                  {
                    id: 'p_1',
                    dataUrl: record.photoBase64,
                    capturedAt: record.completedAt || '',
                    category: getDefaultCategoryForMoment(moment.id, moment.phaseName),
                  },
                ]
              : [];
          return { record, status, photos };
        };

        if (displayedMoments.length === 0) {
          return (
            <div className="p-8 text-center bg-[#161616] border border-[#2a2a2a] rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 mx-auto flex items-center justify-center font-bold">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Inga moment matchar dina aktiva filter</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Du har aktiverat filter för {selectedPhase !== 'ALL' ? `fas "${selectedPhase}"` : ''}
                {selectedPhase !== 'ALL' && statusFilter !== 'ALL' ? ' och ' : ''}
                {statusFilter !== 'ALL' ? `status "${statusFilter}"` : ''}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedPhase('ALL');
                  setStatusFilter('ALL');
                }}
                className="mt-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-xl cursor-pointer transition-all"
              >
                Återställ och visa alla moment
              </button>
            </div>
          );
        }

        {/* ------------------------------------------------------------------ */}
        {/* PRESET 1: STEG-FÖR-STEG (FOKUSVY / GUIDED_STEP)                    */}
        {/* ------------------------------------------------------------------ */}
        if (layoutMode === 'GUIDED_STEP') {
          const safeIndex = Math.max(0, Math.min(guidedStepIndex, displayedMoments.length - 1));
          const currentMoment = displayedMoments[safeIndex];
          const { record, status, photos } = getMomentRecordAndPhotos(currentMoment);
          const stepPercent = Math.round(((safeIndex + 1) / displayedMoments.length) * 100);

          const handleStepNext = () => {
            if (safeIndex < displayedMoments.length - 1) {
              setGuidedStepIndex(safeIndex + 1);
              scrollToTop();
            }
          };

          const handleStepPrev = () => {
            if (safeIndex > 0) {
              setGuidedStepIndex(safeIndex - 1);
              scrollToTop();
            }
          };

          const handleApproveAndNext = () => {
            handleSetStatus(currentMoment, 'GREEN');
            if (safeIndex < displayedMoments.length - 1) {
              setTimeout(() => {
                setGuidedStepIndex(safeIndex + 1);
                scrollToTop();
              }, 400);
            }
          };

          return (
            <div className="space-y-4">
              {/* Steg-Tracker & Scrubber Bar */}
              <div className="bg-[#161616] border-2 border-orange-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-orange-500 text-black font-black text-xs uppercase tracking-wider">
                        Steg {safeIndex + 1} av {displayedMoments.length}
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {currentMoment.phaseName}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                      {currentMoment.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-lg font-bold">
                      {currentMoment.amaCode}
                    </span>
                    <span
                      className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg border ${
                        status === 'GREEN'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : status === 'YELLOW'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-[#222] text-slate-400 border-[#333]'
                      }`}
                    >
                      {status === 'GREEN' ? '✓ Godkänd' : status === 'YELLOW' ? 'Pågår' : 'Ej påbörjad'}
                    </span>
                  </div>
                </div>

                {/* Progress bar för stegflödet */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Framsteg i fokusflödet</span>
                    <span>{stepPercent}% ({safeIndex + 1}/{displayedMoments.length})</span>
                  </div>
                  <div className="w-full h-2 bg-[#101010] rounded-full overflow-hidden border border-[#262626]">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${stepPercent}%` }}
                    />
                  </div>
                </div>

                {/* Snabbvals-knappar för alla steg (Pill Carousel) */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Snabbhopp mellan steg:</span>
                    <span className="text-[10px] text-slate-500 lowercase">Klicka på en siffra för att hoppa dit</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-[#101010] rounded-xl border border-[#222]">
                    {displayedMoments.map((m, idx) => {
                      const st = project.moments[m.id]?.status || 'RED';
                      const isCurrent = idx === safeIndex;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setGuidedStepIndex(idx);
                            scrollToTop();
                          }}
                          className={`min-w-[34px] h-[34px] px-2 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-orange-500 text-black ring-2 ring-white font-black scale-105 shadow-md'
                              : st === 'GREEN'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 hover:bg-emerald-900'
                              : st === 'YELLOW'
                              ? 'bg-amber-950 text-amber-300 border border-amber-700/80 hover:bg-amber-900'
                              : 'bg-[#181818] text-slate-400 border border-[#2c2c2c] hover:text-white hover:bg-[#252525]'
                          }`}
                          title={`${m.id} ${m.title} (${st === 'GREEN' ? 'Godkänd' : 'Ej klar'})`}
                        >
                          {st === 'GREEN' && !isCurrent && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{m.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Snabbnavigering i toppen */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#242424]">
                  <button
                    type="button"
                    onClick={handleStepPrev}
                    disabled={safeIndex === 0}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      safeIndex === 0
                        ? 'opacity-40 cursor-not-allowed bg-[#181818] text-slate-500 border border-[#2a2a2a]'
                        : 'bg-[#202020] hover:bg-[#2a2a2a] text-white border border-[#333]'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Föregående</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleStepNext}
                      disabled={safeIndex >= displayedMoments.length - 1}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        safeIndex >= displayedMoments.length - 1
                          ? 'opacity-40 cursor-not-allowed bg-[#181818] text-slate-500 border border-[#2a2a2a]'
                          : 'bg-[#202020] hover:bg-[#2a2a2a] text-slate-200 border border-[#333]'
                      }`}
                    >
                      <span>Hoppa över</span>
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleApproveAndNext}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
                    >
                      <Check className="w-4 h-4 stroke-[3.5]" />
                      <span>{status === 'GREEN' ? 'Gå till nästa steg' : 'Godkänn & Nästa steg'}</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Huvudkort för det aktiva steget med full handledning */}
              <div className="bg-[#141414] border-2 border-[#2c2c2c] rounded-3xl overflow-hidden shadow-2xl">
                {renderMomentDetail(currentMoment, record, status, photos)}

                {/* Fotnavigering för steget */}
                <div className="p-4 sm:p-5 bg-[#181818] border-t-2 border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleStepPrev}
                    disabled={safeIndex === 0}
                    className={`w-full sm:w-auto px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      safeIndex === 0
                        ? 'opacity-30 cursor-not-allowed bg-[#181818] text-slate-500'
                        : 'bg-[#222] hover:bg-[#2e2e2e] text-white border border-[#3a3a3a]'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Föregående steg ({safeIndex > 0 ? displayedMoments[safeIndex - 1].id : ''})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApproveAndNext}
                    className="w-full sm:w-auto min-h-[50px] px-8 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer transition-all active:scale-95"
                  >
                    <Check className="w-5 h-5 stroke-[3.5]" />
                    <span>
                      {safeIndex < displayedMoments.length - 1
                        ? status === 'GREEN'
                          ? 'Nästa steg →'
                          : 'Godkänn & Fortsätt till nästa steg →'
                        : '✓ Klart! Detta är sista steget'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        }

        {/* ------------------------------------------------------------------ */}
        {/* PRESET 2: KOMPAKT TABELLVY (INGENJÖRSLÄGE / COMPACT)               */}
        {/* ------------------------------------------------------------------ */}
        if (layoutMode === 'COMPACT') {
          return (
            <div className="space-y-4">
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#1e1e1e] border-b border-[#2d2d2d] text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                        <th className="py-2.5 px-3 w-14 text-center shrink-0">Status</th>
                        <th className="py-2.5 px-3 w-14 text-center shrink-0">Nr</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Moment & Kontroll</th>
                        <th className="py-2.5 px-3 w-28 shrink-0 whitespace-nowrap">AMA-kod</th>
                        <th className="py-2.5 px-3 w-20 text-center shrink-0 whitespace-nowrap">Foto</th>
                        <th className="py-2.5 px-3 w-28 text-center shrink-0 whitespace-nowrap hidden sm:table-cell">Signatur</th>
                        <th className="py-2.5 px-3 w-24 text-right shrink-0 whitespace-nowrap">Åtgärd</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222]">
                      {phases
                        .filter((phase) => selectedPhase === 'ALL' || selectedPhase === phase)
                        .map((phaseName) => {
                          const phaseMoments = displayedMoments.filter((m) => m.phaseName === phaseName);
                          if (phaseMoments.length === 0) return null;
                          const phaseDone = phaseMoments.filter(
                            (m) => project.moments[m.id]?.status === 'GREEN'
                          ).length;

                          return (
                            <React.Fragment key={phaseName}>
                              {/* Sektionsrad för fas */}
                              <tr className="bg-[#1a1a1a]/90 font-bold text-slate-300">
                                <td colSpan={7} className="py-2 px-3 text-xs tracking-wide">
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 uppercase font-black text-orange-400">
                                      <span className="w-2 h-2 rounded-xs bg-orange-400 inline-block"></span>
                                      <span>{phaseName}</span>
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-400">
                                      {phaseDone}/{phaseMoments.length} klara
                                    </span>
                                  </div>
                                </td>
                              </tr>

                              {phaseMoments.map((moment) => {
                                const { record, status, photos } = getMomentRecordAndPhotos(moment);
                                const isExpanded = !!expandedMoments[moment.id];

                                return (
                                  <React.Fragment key={moment.id}>
                                    <tr
                                      onClick={() => toggleMomentExpand(moment.id)}
                                      className={`transition-colors cursor-pointer select-none hover:bg-[#1c1c1c] ${
                                        status === 'GREEN'
                                          ? 'bg-emerald-950/20'
                                          : status === 'YELLOW'
                                          ? 'bg-amber-950/15'
                                          : isExpanded
                                          ? 'bg-[#181818]'
                                          : ''
                                      }`}
                                    >
                                      {/* Status-knapp */}
                                      <td className="py-2 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSetStatus(moment, status === 'GREEN' ? 'YELLOW' : 'GREEN')
                                          }
                                          className={`w-6 h-6 rounded-md mx-auto flex items-center justify-center font-bold border transition-transform active:scale-90 cursor-pointer shrink-0 ${
                                            status === 'GREEN'
                                              ? 'bg-emerald-500 text-black border-emerald-400'
                                              : status === 'YELLOW'
                                              ? 'bg-amber-500 text-black border-amber-400'
                                              : 'bg-[#181818] border-[#383838] text-slate-500 hover:border-emerald-500'
                                          }`}
                                          title="Ändra status"
                                        >
                                          {status === 'GREEN' ? (
                                            <Check className="w-3.5 h-3.5 stroke-[3.5] shrink-0" />
                                          ) : status === 'YELLOW' ? (
                                            <span className="w-2 h-2 rounded-full bg-black shrink-0" />
                                          ) : (
                                            <Check className="w-3 h-3 opacity-30 shrink-0" />
                                          )}
                                        </button>
                                      </td>

                                      {/* Nr */}
                                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-400 text-[11px] whitespace-nowrap">
                                        {moment.id}
                                      </td>

                                      {/* Moment titel */}
                                      <td className="py-2 px-3 min-w-[200px]">
                                        <div className="font-bold text-white text-xs truncate max-w-xs sm:max-w-md">
                                          {moment.title}
                                        </div>
                                      </td>

                                      {/* AMA kod */}
                                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                        <span className="px-1.5 py-0.5 rounded bg-[#101010] border border-[#2a2a2a] whitespace-nowrap">
                                          {moment.amaCode}
                                        </span>
                                      </td>

                                      {/* Foto */}
                                      <td className="py-2 px-3 text-center whitespace-nowrap">
                                        {photos.length > 0 ? (
                                          <span className="font-mono text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                                            <Camera className="w-3 h-3 shrink-0" />
                                            <span>{photos.length}</span>
                                          </span>
                                        ) : (
                                          <span className="text-slate-600">-</span>
                                        )}
                                      </td>

                                      {/* Signatur */}
                                      <td className="py-2 px-3 text-center hidden sm:table-cell whitespace-nowrap">
                                        {record.signature ? (
                                          <span className="text-[10px] font-bold text-emerald-400 truncate max-w-[100px] inline-block">
                                            ✓ {record.signature}
                                          </span>
                                        ) : (
                                          <span className="text-slate-600 text-[11px]">-</span>
                                        )}
                                      </td>

                                      {/* Åtgärd / Expandera */}
                                      <td className="py-2 px-3 text-right whitespace-nowrap">
                                        <span className="text-xs font-bold text-orange-400 hover:text-orange-300 inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                                          <span>{isExpanded ? 'Dölj' : 'Visa'}</span>
                                          {isExpanded ? (
                                            <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                                          ) : (
                                            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                                          )}
                                        </span>
                                      </td>
                                    </tr>

                                    {/* Utfällt detaljkort under tabellraden */}
                                    {isExpanded && (
                                      <tr>
                                        <td colSpan={7} className="p-0 bg-[#0d0d0d] border-b-2 border-orange-500/40">
                                          {renderMomentDetail(moment, record, status, photos)}
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        }

        {/* ------------------------------------------------------------------ */}
        {/* PRESET 3: STORA FÄLTKORT (HANDSKLÄGE / FIELD_CLEAR)                */}
        {/* ------------------------------------------------------------------ */}
        if (layoutMode === 'FIELD_CLEAR') {
          return (
            <div className="space-y-6">
              {phases
                .filter((phase) => selectedPhase === 'ALL' || selectedPhase === phase)
                .map((phaseName) => {
                  const phaseMoments = displayedMoments.filter((m) => m.phaseName === phaseName);
                  if (phaseMoments.length === 0) return null;
                  const phaseDone = phaseMoments.filter(
                    (m) => project.moments[m.id]?.status === 'GREEN'
                  ).length;

                  return (
                    <div key={phaseName} className="space-y-3">
                      {/* Fasrubrik stor och tydlig */}
                      <div className="flex items-center justify-between px-2 pt-2">
                        <h2 className="text-sm sm:text-base font-black text-white tracking-wider uppercase flex items-center gap-2">
                          <span className="w-3 h-3 rounded-xs bg-orange-400 inline-block shadow-sm"></span>
                          <span>{phaseName}</span>
                        </h2>
                        <span className="text-xs sm:text-sm font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 rounded-lg">
                          {phaseDone}/{phaseMoments.length} klara
                        </span>
                      </div>

                      {/* Stora taktila fältkort */}
                      <div className="space-y-4">
                        {phaseMoments.map((moment) => {
                          const { record, status, photos } = getMomentRecordAndPhotos(moment);
                          const isExpanded = !!expandedMoments[moment.id];

                          return (
                            <div
                              key={moment.id}
                              className={`rounded-3xl border-2 transition-all overflow-hidden shadow-xl ${
                                status === 'GREEN'
                                  ? 'bg-[#112318] border-emerald-500 ring-2 ring-emerald-500/30'
                                  : status === 'YELLOW'
                                  ? 'bg-[#221c11] border-amber-500 ring-2 ring-amber-500/30'
                                  : 'bg-[#181818] border-[#333333]'
                              }`}
                            >
                              {/* KORTETS Framsida med gigantiska touch-ytor */}
                              <div className="p-5 sm:p-6 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-mono font-black text-orange-400 bg-black/60 px-2 py-0.5 rounded-md border border-[#333]">
                                        MOMENT {moment.id}
                                      </span>
                                      <span className="text-xs font-mono font-bold text-slate-300 bg-[#252525] px-2 py-0.5 rounded-md border border-[#3c3c3c]">
                                        AMA: {moment.amaCode}
                                      </span>
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                                      {moment.title}
                                    </h3>
                                  </div>

                                  {/* Stor status-indikator */}
                                  <div className="shrink-0">
                                    <span
                                      className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${
                                        status === 'GREEN'
                                          ? 'bg-emerald-500 text-black border-emerald-400'
                                          : status === 'YELLOW'
                                          ? 'bg-amber-500 text-black border-amber-400'
                                          : 'bg-[#101010] text-slate-400 border-[#333]'
                                      }`}
                                    >
                                      {status === 'GREEN' ? (
                                        <>
                                          <Check className="w-4 h-4 stroke-[3.5]" />
                                          <span>✓ GODKÄNT</span>
                                        </>
                                      ) : status === 'YELLOW' ? (
                                        <span>PÅGÅR</span>
                                      ) : (
                                        <span>EJ PÅBÖRJAT</span>
                                      )}
                                    </span>
                                  </div>
                                </div>

                                {/* Instruktionssammanfattning med stor läsbar text */}
                                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed bg-[#101010]/60 p-3 rounded-xl border border-[#2a2a2a]">
                                  {moment.instruction}
                                </p>

                                {/* STORA FÄLTKNAPPAR FÖR HANDSKAR */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                  {/* Stor Godkänn-knapp */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSetStatus(moment, status === 'GREEN' ? 'YELLOW' : 'GREEN')
                                    }
                                    className={`min-h-[54px] rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border cursor-pointer transition-all active:scale-95 shadow-md ${
                                      status === 'GREEN'
                                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400'
                                        : 'bg-[#222] hover:bg-[#2c2c2c] text-white border-[#3c3c3c]'
                                    }`}
                                  >
                                    <Check className="w-5 h-5 stroke-[3]" />
                                    <span>
                                      {status === 'GREEN' ? '✓ Moment är Godkänt' : 'Snabbgodkänn Moment'}
                                    </span>
                                  </button>

                                  {/* Stor Fota-knapp */}
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerCameraForMoment(moment.id, moment.phaseName)}
                                    className="min-h-[54px] bg-[#222] hover:bg-[#2c2c2c] text-white border border-[#3c3c3c] rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                                  >
                                    <Camera className="w-5 h-5 text-orange-400 stroke-[2.5]" />
                                    <span>Fota ({photos.length} bilder)</span>
                                  </button>

                                  {/* Stor Detalj / Handlednings-knapp */}
                                  <button
                                    type="button"
                                    onClick={() => toggleMomentExpand(moment.id)}
                                    className={`min-h-[54px] rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border cursor-pointer transition-all active:scale-95 ${
                                      isExpanded
                                        ? 'bg-orange-500 text-black border-orange-400 shadow-md shadow-orange-500/20'
                                        : 'bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border-orange-500/40'
                                    }`}
                                  >
                                    <span>{isExpanded ? 'Dölj Instruktioner' : 'Öppna Instruktioner'}</span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-5 h-5" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Utfällda detaljer inuti fältkortet */}
                              {isExpanded && renderMomentDetail(moment, record, status, photos)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        }

        {/* ------------------------------------------------------------------ */}
        {/* PRESET 4: ENKEL LISTA (MINIMALIST / SIMPLE_LIST - STANDARD)        */}
        {/* ------------------------------------------------------------------ */}
        return (
          <div className="space-y-5">
            {phases
              .filter((phase) => selectedPhase === 'ALL' || selectedPhase === phase)
              .map((phaseName) => {
                const phaseMoments = displayedMoments.filter((m) => m.phaseName === phaseName);
                if (phaseMoments.length === 0) return null;
                const phaseDone = phaseMoments.filter(
                  (m) => project.moments[m.id]?.status === 'GREEN'
                ).length;

                return (
                  <div key={phaseName} className="space-y-2">
                    {/* Fasrubrik */}
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-xs sm:text-sm font-black text-slate-300 tracking-wider uppercase flex items-center gap-2">
                        <span className="w-2 h-2 rounded-xs bg-orange-400 inline-block"></span>
                        <span>{phaseName}</span>
                      </h2>
                      <span className="text-xs font-mono text-slate-400">
                        {phaseDone}/{phaseMoments.length} klara
                      </span>
                    </div>

                    {/* Minimalistisk lista med tunna avskiljare */}
                    <div className="bg-[#161616] border border-[#262626] rounded-2xl divide-y divide-[#232323] overflow-hidden shadow-lg">
                      {phaseMoments.map((moment) => {
                        const { record, status, photos } = getMomentRecordAndPhotos(moment);
                        const isExpanded = !!expandedMoments[moment.id];

                        return (
                          <div
                            key={moment.id}
                            className={`transition-colors ${
                              status === 'GREEN'
                                ? 'bg-emerald-950/15'
                                : isExpanded
                                ? 'bg-[#1a1a1a]'
                                : 'hover:bg-[#1b1b1b]'
                            }`}
                          >
                            {/* Momentrad: Ren och distraktionsfri */}
                            <div
                              onClick={() => toggleMomentExpand(moment.id)}
                              className="px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer select-none touch-manipulation"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetStatus(moment, status === 'GREEN' ? 'YELLOW' : 'GREEN');
                                  }}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border font-bold transition-all cursor-pointer active:scale-90 ${
                                    status === 'GREEN'
                                      ? 'bg-emerald-500 border-emerald-400 text-black shadow-xs'
                                      : status === 'YELLOW'
                                      ? 'bg-orange-500/20 border-orange-400 text-orange-300'
                                      : 'bg-[#111111] border-[#363636] hover:border-emerald-500/60 text-slate-600 hover:text-emerald-400'
                                  }`}
                                  title="Klicka för att godkänna"
                                >
                                  {status === 'GREEN' ? (
                                    <Check className="w-4 h-4 stroke-[3.5]" />
                                  ) : status === 'YELLOW' ? (
                                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 opacity-30" />
                                  )}
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-mono text-slate-400 shrink-0">
                                      {moment.id}
                                    </span>
                                    <h3
                                      className={`text-sm sm:text-base font-bold truncate ${
                                        status === 'GREEN' ? 'text-emerald-200' : 'text-white'
                                      }`}
                                    >
                                      {moment.title}
                                    </h3>
                                    {status === 'GREEN' && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded">
                                        ✓ Godkänt
                                      </span>
                                    )}
                                    {status === 'YELLOW' && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.2 rounded">
                                        Pågår
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {photos.length > 0 && (
                                  <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                    <Camera className="w-3 h-3 shrink-0" />
                                    <span>{photos.length}</span>
                                  </span>
                                )}

                                {project.exerciseSettings?.allowAiHelper !== false && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenMomentAiHelper(moment);
                                    }}
                                    className="p-1.5 rounded-lg bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#333] text-sky-400 hover:text-sky-300 cursor-pointer shrink-0"
                                    title={`Förklara moment ${moment.id} (AMA)`}
                                  >
                                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                                  </button>
                                )}

                                <span className="text-[11px] font-mono text-slate-400 bg-[#121212] border border-[#2a2a2a] px-2 py-0.5 rounded-md hidden sm:inline-block shrink-0">
                                  {moment.amaCode}
                                </span>

                                <div className="text-slate-400 pl-1 shrink-0">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-orange-400 shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 shrink-0" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Utfällt detaljkort */}
                            {isExpanded && renderMomentDetail(moment, record, status, photos)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        );
      })()}

      {/* FIXED BOTTOM ACTION BAR FÖR PRAKTISKA ÖVNINGAR */}
      <div className="sticky bottom-4 z-30 pt-4">
        <div className="bg-[#1a1a1a]/95 backdrop-blur-md border-2 border-[#2d2d2d] rounded-3xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={scrollToTop}
              className="w-12 h-12 rounded-2xl bg-[#141414] hover:bg-[#242424] text-slate-300 border border-[#333333] flex items-center justify-center cursor-pointer transition-colors shrink-0"
              title="Till toppen"
            >
              <ArrowUp className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsArchiveOpen(true)}
              className="min-h-[48px] px-4 bg-[#141414] hover:bg-[#242424] text-white border border-[#333333] rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-orange-400" />
              <span>Fotopärm ({totalPhotosCount})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenReport}
            className="min-h-[50px] px-6 bg-orange-500 hover:bg-orange-400 text-black font-black text-sm sm:text-base rounded-2xl flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer transition-all active:scale-95"
          >
            <FileText className="w-5 h-5 stroke-[2.5]" />
            <span>Skapa Slutrapport</span>
          </button>
        </div>
      </div>

      {/* MODALER */}
      {/* 1. Snabbfota Modal */}
      {isPhotoMenuOpen && (
        <PhotoQuickMenuModal
          project={project}
          moments={relevantMoments}
          onClose={() => setIsPhotoMenuOpen(false)}
          onAddMomentPhoto={(momentId, photoBase64, category) =>
            handleAddPhotoToMoment(momentId, photoBase64, category)
          }
        />
      )}

      {/* 2. Fotopärm Modal */}
      {isArchiveOpen && (
        <PhotoArchiveModal
          project={project}
          userSettings={userSettings}
          onUpdateUserSettings={onUpdateUserSettings}
          onClose={() => setIsArchiveOpen(false)}
          onOpenLightbox={(url, title) => setLightboxPhoto({ url, title })}
        />
      )}

      {/* 3. Kryssmått Modal */}
      {isCrossMeasureOpen && (
        <CrossMeasureCalculatorModal
          onClose={() => setIsCrossMeasureOpen(false)}
          initialMeasurements={project.fieldMeasurements}
          onSaveMeasurements={(meas) => {
            onUpdateProject({
              ...project,
              fieldMeasurements: {
                ...project.fieldMeasurements,
                ...meas,
              },
            });
            setCloudSyncMsg(`Kryssmått ${meas.diagonal.toFixed(2)} m sparat i övningen!`);
            setTimeout(() => setCloudSyncMsg(null), 3500);
          }}
          onInsertToNotes={(text) => {
            const cur = project.notes || '';
            onUpdateProject({
              ...project,
              notes: cur ? cur + '\n' + text : text,
            });
          }}
        />
      )}

      {/* 4. Avböj Försyn (Flera bekräftelsesteg) Modal */}
      {isExemptModalOpen && (
        <div
          onClick={() => setIsExemptModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121212] border-2 border-orange-500/50 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Avböj Försyn & Skadeguide
                  </h3>
                  <span className="text-xs text-orange-400 font-bold">
                    Steg {exemptStep} av 2 • Varning för konsekvenser
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExemptModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#1c1c1c] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Steg 1: Varning & Branschfakta */}
            {exemptStep === 1 && (
              <div className="space-y-4">
                <div className="bg-[#1a140f] border border-orange-500/40 rounded-2xl p-4 space-y-2">
                  <h4 className="text-sm font-black text-orange-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    Varning för konsekvenser utan försyn
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    I anläggningsarbeten är försyn (skadefotografering av grannfastigheters socklar, staket och asfalt före schaktstart) ett viktigt skydd mot felaktiga skadeståndsanspråk.
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-300">
                  {activeContextMode === 'WORKPLACE' ? (
                    <>
                      Om inga grannfastigheter berörs eller om försyn dokumenterats separat kan du avböja försynen här för att slutföra rapporten.
                    </>
                  ) : (
                    <>
                      Om detta är en <strong>övning</strong> där ingen grannfastighet berörs kan du avböja försynen för att slutföra rapporten.
                    </>
                  )}
                </p>

                <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-3 text-[11px] text-slate-400">
                  💡 <strong>Obs:</strong> Inget beslut låser dig permanent. Du kan när som helst ångra dig och komplettera med försynsfoton i efterhand!
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExemptModalOpen(false)}
                    className="px-4 py-2.5 bg-[#1c1c1c] hover:bg-[#252525] text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Avbryt
                  </button>
                  <button
                    type="button"
                    onClick={() => setExemptStep(2)}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-black rounded-xl text-xs sm:text-sm cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    Gå vidare till steg 2 →
                  </button>
                </div>
              </div>
            )}

            {/* Steg 2: Val av anledning & Slutlig bekräftelse */}
            {exemptStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Välj anledning till undantag:
                  </label>
                  <select
                    value={exemptReason}
                    onChange={(e) => setExemptReason(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 bg-[#181818] border border-[#333333] focus:border-orange-500 rounded-xl text-white text-xs sm:text-sm outline-none"
                  >
                    <option value="Inga anslutande fastigheter eller grannar berörs">
                      Inga anslutande fastigheter eller grannar berörs
                    </option>
                    <option value="Arbete på friliggande tomt / eget område utan risk för granne">
                      Arbete på friliggande tomt / eget område utan risk för granne
                    </option>
                    {activeContextMode !== 'WORKPLACE' && (
                      <option value="Praktisk skolövning i övningshall / övningsbädd">
                        Praktisk skolövning i övningshall / övningsbädd
                      </option>
                    )}
                    <option value={`Godkänt undantag av ${vocab.roleTeacherShort.toLowerCase()}`}>
                      Godkänt undantag av {vocab.roleTeacherShort.toLowerCase()}
                    </option>
                  </select>
                </div>

                <div className="bg-[#161f1a] border border-emerald-800/60 rounded-xl p-3.5 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-400 block">
                    ✓ Full tillgänglighet bevaras
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Egenkontrollrapporten kommer att godkännas med noteringen: <em>"{exemptReason}"</em>. Du kan när som helst klicka på "Genomför försyn ändå" för att lägga till foton.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setExemptStep(1)}
                    className="px-3.5 py-2.5 bg-[#1c1c1c] hover:bg-[#252525] text-slate-400 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    ← Tillbaka
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmExempt}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-black rounded-xl text-xs sm:text-sm cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    Bekräfta undantag
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Snabbanteckningar / Fältblock Modal */}
      {isQuickNotesOpen && (
        <QuickNotesModal
          project={project}
          onUpdateProject={onUpdateProject}
          onClose={() => setIsQuickNotesOpen(false)}
        />
      )}

      {/* 5. FältKoll & Byggexpert Modal */}
      {isFieldHelperOpen && (
        <FieldHelperModal
          onClose={() => setIsFieldHelperOpen(false)}
          currentMomentTitle={helperMoment?.title}
          currentAmaCode={helperMoment?.ama}
        />
      )}

      {/* 5b. Moment-specifik AI-Hjälpare Modal */}
      {activeMomentForAi && (
        <MomentAiHelperModal
          moment={activeMomentForAi}
          onClose={() => setActiveMomentForAi(null)}
          onInsertToNotes={handleInsertAiNoteToMoment}
        />
      )}

      {/* 6. Photo Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 p-4 flex flex-col items-center justify-center cursor-pointer"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="w-full max-w-4xl flex items-center justify-between pb-3 text-white">
            <h4 className="font-bold text-base truncate">{lightboxPhoto.title}</h4>
            <button
              onClick={() => setLightboxPhoto(null)}
              className="p-2 bg-[#222222] rounded-xl text-white cursor-pointer font-bold"
            >
              ✕ Stäng
            </button>
          </div>
          <img
            src={lightboxPhoto.url}
            alt="Förstorad bild"
            className="max-h-[85vh] max-w-full object-contain rounded-2xl border-2 border-[#333333] shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
