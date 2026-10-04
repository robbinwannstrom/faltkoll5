import React, { useState } from 'react';
import { Project, MomentPhoto, UserAccount, MomentStatus } from '../types';
import { ALL_MOMENTS } from '../data/momentsData';
import {
  submitTeacherReview,
  calculateProjectProgress,
  countProjectPhotos,
} from '../services/studentWorkService';
import { exportProjectPhotosZip, downloadPhotoDirect } from '../utils/photoStorage';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  Download,
  User,
  GraduationCap,
  Calendar,
  Cloud,
  FileCheck,
  CheckSquare,
  MessageSquare,
  ShieldCheck,
  Eye,
  Maximize2,
  FileText,
  MapPin,
  Sparkles,
  ArrowRight,
  Send,
  HelpCircle,
} from 'lucide-react';

interface StudentWorkInspectorModalProps {
  project: Project;
  onClose: () => void;
  currentUser?: UserAccount | null;
  onProjectUpdated?: (updatedProject: Project) => void;
  onOpenReport?: (project: Project) => void;
}

type InspectorTab = 'OVERVIEW' | 'PHOTOS' | 'MOMENTS' | 'PRE_INSPECTION';

export const StudentWorkInspectorModal: React.FC<StudentWorkInspectorModalProps> = ({
  project,
  onClose,
  currentUser,
  onProjectUpdated,
  onOpenReport,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('OVERVIEW');
  const [currentProject, setCurrentProject] = useState<Project>(project);
  const [selectedPhoto, setSelectedPhoto] = useState<MomentPhoto | null>(null);

  // Review state
  const [overallGrade, setOverallGrade] = useState<'GODKÄND' | 'UNDERKÄND' | 'KOMPLETTERING_KRÄVS' | undefined>(
    currentProject.teacherFeedback?.grade
  );
  const [overallComment, setOverallComment] = useState<string>(
    currentProject.teacherFeedback?.overallComment || ''
  );
  const [momentNotes, setMomentNotes] = useState<Record<string, string>>(
    currentProject.teacherFeedback?.momentNotes || {}
  );
  const [approvedMoments, setApprovedMoments] = useState<Record<string, boolean>>(
    currentProject.teacherFeedback?.approvedMoments || {}
  );
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const stats = calculateProjectProgress(currentProject);
  const totalPhotos = countProjectPhotos(currentProject);

  // Collect all photos from all moments + pre-inspection
  const allPhotos: { photo: MomentPhoto; momentId?: string; momentTitle?: string }[] = [];
  
  if (currentProject.preInspectionPhotos) {
    currentProject.preInspectionPhotos.forEach((ph) => {
      allPhotos.push({ photo: ph, momentTitle: 'Försyn & Egenkontroll' });
    });
  }

  const momentsToInspect =
    currentProject.customMoments && currentProject.customMoments.length > 0
      ? currentProject.customMoments
      : ALL_MOMENTS.filter((m) => m.projectType === currentProject.projectType);

  momentsToInspect.forEach((m) => {
    const rec = currentProject.moments?.[m.id];
    if (rec?.photos) {
      rec.photos.forEach((ph) => {
        allPhotos.push({ photo: ph, momentId: m.id, momentTitle: `${m.id} ${m.title}` });
      });
    } else if (rec?.photoBase64) {
      allPhotos.push({
        photo: {
          id: 'legacy_' + m.id,
          dataUrl: rec.photoBase64,
          capturedAt: rec.completedAt || '',
          category: 'Kontrollbevis',
          caption: rec.comment,
        },
        momentId: m.id,
        momentTitle: `${m.id} ${m.title}`,
      });
    }
  });

  const handleToggleMomentApproval = (momentId: string) => {
    setApprovedMoments((prev) => ({
      ...prev,
      [momentId]: !prev[momentId],
    }));
  };

  const handleMomentNoteChange = (momentId: string, text: string) => {
    setMomentNotes((prev) => ({
      ...prev,
      [momentId]: text,
    }));
  };

  const handleSaveTeacherReview = async () => {
    setIsSavingReview(true);
    setSaveSuccessMsg(null);
    try {
      const res = await submitTeacherReview({
        projectId: currentProject.id,
        teacherId: currentUser?.id || 'usr_teacher',
        teacherName: currentUser?.displayName || 'Yrkeslärare',
        overallComment,
        grade: overallGrade,
        momentNotes,
        approvedMoments,
      });

      if (res.success && res.project) {
        setCurrentProject(res.project);
        if (onProjectUpdated) onProjectUpdated(res.project);
        setSaveSuccessMsg('Bedömning och lärarkommentarer har sparats och synkats!');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        setSaveSuccessMsg('Kunde inte spara bedömningen till servern: ' + (res.error || 'Okänt fel'));
      }
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleDownloadAllPhotos = async () => {
    try {
      await exportProjectPhotosZip(currentProject);
    } catch {
      alert('Kunde inte generera ZIP-arkiv med bilder.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-[#141414] border border-[#2b2b2b] rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#242424] bg-[#181818] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0 font-black text-lg">
              <User className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white truncate">
                  {currentProject.studentName || currentProject.contractorName || 'Elev'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  {currentProject.schoolClass || 'Ospecificerad klass'}
                </span>
                {currentProject.studentGroup && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#222] text-slate-300 border border-[#333]">
                    {currentProject.studentGroup}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Projekt: <strong className="text-white font-bold">{currentProject.name}</strong> • Fastighet: {currentProject.propertyDesignation || 'Ej angiven'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {allPhotos.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadAllPhotos}
                className="min-h-[40px] px-3.5 bg-[#202020] hover:bg-[#282828] text-slate-200 border border-[#333] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Ladda ner alla elevens foton som en ZIP-fil"
              >
                <Download className="w-4 h-4 text-orange-400" />
                <span className="hidden sm:inline">Ladda ner foton ({allPhotos.length})</span>
              </button>
            )}

            {onOpenReport && (
              <button
                type="button"
                onClick={() => onOpenReport(currentProject)}
                className="min-h-[40px] px-3.5 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Öppna fullständig kontrollrapport"
              >
                <FileText className="w-4 h-4" />
                <span>Rapport</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              title="Stäng inspektionsvy"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress & Quick Stats Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#161616] border-b border-[#222] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="font-bold text-white">Framsteg i fält:</span>
              <span className="font-black text-orange-400">{stats.percent}% klart</span>
              <span className="text-slate-500">({stats.completed} av {stats.total} moment)</span>
            </div>
            <div className="w-24 sm:w-36 h-2 bg-[#262626] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  stats.percent === 100 ? 'bg-emerald-500' : 'bg-orange-500'
                }`}
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-orange-400" />
              <strong className="text-white">{totalPhotos}</strong> foton
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Senast synkad: <strong className="text-white">{currentProject.lastSyncedAt || currentProject.updatedAt || 'Nyligen'}</strong>
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-[#242424] bg-[#141414] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`min-h-[42px] px-4 rounded-t-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'OVERVIEW'
                ? 'text-orange-400 border-orange-500 bg-[#1c1c1c]'
                : 'text-slate-400 border-transparent hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Översikt & Lärarbedömning</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PHOTOS')}
            className={`min-h-[42px] px-4 rounded-t-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors border-b-2 relative ${
              activeTab === 'PHOTOS'
                ? 'text-orange-400 border-orange-500 bg-[#1c1c1c]'
                : 'text-slate-400 border-transparent hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Fältfoton</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {allPhotos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MOMENTS')}
            className={`min-h-[42px] px-4 rounded-t-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'MOMENTS'
                ? 'text-orange-400 border-orange-500 bg-[#1c1c1c]'
                : 'text-slate-400 border-transparent hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Alla Moment & Mätvärden</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#282828] text-slate-300">
              {momentsToInspect.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRE_INSPECTION')}
            className={`min-h-[42px] px-4 rounded-t-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'PRE_INSPECTION'
                ? 'text-orange-400 border-orange-500 bg-[#1c1c1c]'
                : 'text-slate-400 border-transparent hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Försyn & Egenkontroll</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {saveSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW & TEACHER EVALUATION */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              
              {/* Teacher Evaluation Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#1a1a1a] border border-[#2e2e2e] space-y-4 shadow-xl">
                <div className="flex items-center justify-between gap-3 border-b border-[#262626] pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-orange-400" />
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Lärarens Fältbedömning & Återkoppling
                    </h3>
                  </div>
                  {currentProject.teacherFeedback?.evaluatedAt && (
                    <span className="text-[11px] text-slate-400">
                      Senast bedömd: {currentProject.teacherFeedback.evaluatedAt} av {currentProject.teacherFeedback.evaluatedBy}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                    1. Välj samlat resultat / Status:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setOverallGrade('GODKÄND')}
                      className={`min-h-[46px] p-3 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        overallGrade === 'GODKÄND'
                          ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20'
                          : 'bg-[#141414] border-[#2c2c2c] text-emerald-400 hover:bg-emerald-950/30'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Godkänd i fält</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOverallGrade('KOMPLETTERING_KRÄVS')}
                      className={`min-h-[46px] p-3 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        overallGrade === 'KOMPLETTERING_KRÄVS'
                          ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                          : 'bg-[#141414] border-[#2c2c2c] text-amber-400 hover:bg-amber-950/30'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                      <span>Komplettering krävs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOverallGrade('UNDERKÄND')}
                      className={`min-h-[46px] p-3 rounded-2xl border font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        overallGrade === 'UNDERKÄND'
                          ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                          : 'bg-[#141414] border-[#2c2c2c] text-rose-400 hover:bg-rose-950/30'
                      }`}
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                      <span>Underkänd</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                    2. Lärarkommentar & Instruktioner till eleven:
                  </label>
                  <textarea
                    value={overallComment}
                    onChange={(e) => setOverallComment(e.target.value)}
                    placeholder="Skriv återkoppling till eleven (t.ex. 'Bra laseravvägning och väldokumenterat med bilder. Kom ihåg att kontrollera fallet en extra gång innan återfyllnad.')..."
                    rows={3}
                    className="w-full p-3.5 bg-[#121212] border border-[#333] focus:border-orange-500 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveTeacherReview}
                    disabled={isSavingReview}
                    className="min-h-[44px] px-5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-orange-500/20"
                  >
                    <Send className="w-4 h-4 stroke-[2.5]" />
                    <span>{isSavingReview ? 'Sparar och synkar...' : 'Spara och skicka bedömning till elev'}</span>
                  </button>
                </div>
              </div>

              {/* Project & Field Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#181818] border border-[#282828] space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Elev & Kontakt</span>
                  <p className="font-black text-white text-sm">{currentProject.studentName || currentProject.contractorName || 'Elev'}</p>
                  <p className="text-xs text-slate-400">{currentProject.studentEmail || 'Ingen e-post registrerad'}</p>
                  <p className="text-xs text-orange-400 font-bold">{currentProject.schoolClass || 'Ingen klass'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#181818] border border-[#282828] space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Fältmått & Beräkningar</span>
                  {currentProject.fieldMeasurements ? (
                    <div className="text-xs text-slate-200 space-y-0.5">
                      <p>Sida A: <strong className="text-white">{currentProject.fieldMeasurements.sideA} m</strong> • Sida B: <strong className="text-white">{currentProject.fieldMeasurements.sideB} m</strong></p>
                      <p className="text-emerald-400 font-black">Diagonal (Kryssmått): {currentProject.fieldMeasurements.diagonal} m</p>
                      {currentProject.fieldMeasurements.fallCmPerM && (
                        <p>Krav på fall: {currentProject.fieldMeasurements.fallCmPerM} cm/m</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Inga generella fältmått angivna.</p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#181818] border border-[#282828] space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Status & Synkning</span>
                  <p className="text-xs text-slate-300">Skapad: <strong className="text-white">{currentProject.createdAt}</strong></p>
                  <p className="text-xs text-slate-300">Senast ändrad: <strong className="text-white">{currentProject.updatedAt || 'Nyligen'}</strong></p>
                  <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5" />
                    Molnsynkad direkt från fältet
                  </p>
                </div>
              </div>

              {/* Quick Photo Strip */}
              {allPhotos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-orange-400" />
                      <span>Senaste fältfoton ({allPhotos.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab('PHOTOS')}
                      className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Visa alla i stort format →</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {allPhotos.slice(0, 4).map((item, idx) => (
                      <div
                        key={item.photo.id || idx}
                        onClick={() => setSelectedPhoto(item.photo)}
                        className="group relative rounded-2xl overflow-hidden bg-[#181818] border border-[#2a2a2a] hover:border-orange-500/50 cursor-pointer aspect-4/3 flex flex-col justify-end p-2.5 transition-all"
                      >
                        <img
                          src={item.photo.dataUrl}
                          alt={item.photo.caption || 'Fältfoto'}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="relative z-10 text-[11px] leading-tight">
                          <span className="font-bold text-white block truncate">{item.momentTitle}</span>
                          <span className="text-[10px] text-orange-300">{item.photo.capturedAt || 'Fält'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FIELD PHOTOS GALLERY */}
          {activeTab === 'PHOTOS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-orange-400" />
                    <span>Alla Foton Tagna i Fält ({allPhotos.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Klicka på ett foto för att inspektera i fullskärm, granska vattenstämpel och tidsstämpel.
                  </p>
                </div>

                {allPhotos.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadAllPhotos}
                    className="min-h-[38px] px-3.5 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Ladda ner alla som ZIP</span>
                  </button>
                )}
              </div>

              {allPhotos.length === 0 ? (
                <div className="p-12 text-center bg-[#181818] rounded-3xl border border-[#282828] space-y-2">
                  <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-slate-300 font-bold text-sm">Inga foton har sparats för detta projekt ännu.</p>
                  <p className="text-xs text-slate-500">När eleven fotar med appens kamera i fält dyker bilderna upp här direkt.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {allPhotos.map((item, idx) => (
                    <div
                      key={item.photo.id || idx}
                      onClick={() => setSelectedPhoto(item.photo)}
                      className="group rounded-2xl overflow-hidden bg-[#181818] border border-[#2c2c2c] hover:border-orange-500/60 cursor-pointer flex flex-col transition-all shadow-md"
                    >
                      <div className="relative aspect-4/3 overflow-hidden bg-black">
                        <img
                          src={item.photo.dataUrl}
                          alt={item.photo.caption || 'Foto'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-black text-orange-400 border border-orange-500/30">
                          {item.photo.category || 'Kontrollbevis'}
                        </div>
                        <div className="absolute bottom-2 right-2 p-1 rounded-lg bg-black/70 text-white">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div className="p-3 space-y-1">
                        <span className="text-xs font-black text-white block truncate">
                          {item.momentTitle}
                        </span>
                        {item.photo.caption && (
                          <p className="text-[11px] text-slate-300 italic line-clamp-2">
                            "{item.photo.caption}"
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#242424]">
                          <span>Tid: {item.photo.capturedAt || 'Fält'}</span>
                          <span className="text-orange-400 font-bold">Klicka för zoom →</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MOMENTS & MEASUREMENTS */}
          {activeTab === 'MOMENTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-[#242424] pb-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-orange-400" />
                    <span>Moment, Mätvärden & Signaturer</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Inspektera elevens kontroller, mätningar och signera eventuella stoppunkter.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {momentsToInspect.map((m) => {
                  const rec = currentProject.moments?.[m.id];
                  const status: MomentStatus = rec?.status || 'RED';
                  const isApproved = approvedMoments[m.id] || rec?.teacherApproved;
                  const teacherNote = momentNotes[m.id] || '';

                  return (
                    <div
                      key={m.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        status === 'GREEN'
                          ? 'bg-[#181c18] border-emerald-900/50'
                          : status === 'YELLOW'
                          ? 'bg-[#1c1c14] border-amber-900/50'
                          : 'bg-[#161616] border-[#292929]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222] pb-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                              status === 'GREEN'
                                ? 'bg-emerald-500 text-black'
                                : status === 'YELLOW'
                                ? 'bg-amber-500 text-black'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {m.id}
                          </span>
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-white">{m.title}</h4>
                            <span className="text-[10px] font-mono text-orange-400">{m.amaCode || 'AMA'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {m.isStopPoint && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Stoppunkt
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleMomentApproval(m.id)}
                            className={`min-h-[34px] px-3 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors ${
                              isApproved
                                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                                : 'bg-[#222] hover:bg-[#2c2c2c] text-slate-300 border border-[#333]'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{isApproved ? 'Godkänd av lärare' : 'Godkänn stoppunkt'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Moment content */}
                      <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1.5">
                          <span className="font-bold text-slate-400 block text-[11px] uppercase tracking-wider">
                            Elevens ifyllnad & Mätning:
                          </span>
                          {rec?.measuredValue && (
                            <p className="text-sky-300 font-bold">
                              Uppmätt värde: <strong className="text-white">{rec.measuredValue}</strong>
                            </p>
                          )}
                          <p className="text-slate-200">
                            Kommentar: {rec?.comment ? <strong className="text-white">"{rec.comment}"</strong> : <em className="text-slate-500">Ingen skriven kommentar</em>}
                          </p>
                          <p className="text-slate-400 text-[11px]">
                            Signatur: {rec?.signature ? <strong className="text-emerald-400">{rec.signature}</strong> : <em className="text-slate-500">Ej signerat</em>}
                            {rec?.completedAt && ` • ${rec.completedAt}`}
                          </p>

                          {rec?.structuredChecks && rec.structuredChecks.length > 0 && (
                            <div className="pt-1 space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Bockade kontroller:</span>
                              <div className="space-y-0.5">
                                {rec.structuredChecks.map((chk, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span>{chk}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Teacher's note on this specific moment */}
                        <div className="space-y-1.5 bg-[#121212] p-3 rounded-xl border border-[#242424]">
                          <span className="font-bold text-orange-400 block text-[11px] uppercase tracking-wider flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Lärarens kommentar på moment {m.id}:
                          </span>
                          <input
                            type="text"
                            value={teacherNote}
                            onChange={(e) => handleMomentNoteChange(m.id, e.target.value)}
                            placeholder="T.ex. Bra schaktning, tolerans OK..."
                            className="w-full px-3 py-1.5 bg-[#181818] border border-[#333] focus:border-orange-500 rounded-lg text-xs text-white outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom save button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveTeacherReview}
                  disabled={isSavingReview}
                  className="min-h-[44px] px-6 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-orange-500/20"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>{isSavingReview ? 'Sparar...' : 'Spara ändrade godkännanden & kommentarer'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: PRE-INSPECTION */}
          {activeTab === 'PRE_INSPECTION' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#181818] border border-[#282828] space-y-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-orange-400" />
                  <span>Försyn & Skadedokumentation</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Status: {currentProject.preInspectionCompleted ? (
                    <strong className="text-emerald-400">Genomförd och dokumenterad</strong>
                  ) : currentProject.preInspectionExempted ? (
                    <strong className="text-amber-400">Undantagen: {currentProject.preInspectionExemptReason || 'Avstängd'}</strong>
                  ) : (
                    <strong className="text-rose-400">Ej genomförd ännu</strong>
                  )}
                </p>

                {currentProject.preInspectionPhotos && currentProject.preInspectionPhotos.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Foton från försyn ({currentProject.preInspectionPhotos.length}):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {currentProject.preInspectionPhotos.map((ph, idx) => (
                        <div
                          key={ph.id || idx}
                          onClick={() => setSelectedPhoto(ph)}
                          className="rounded-xl overflow-hidden bg-black border border-[#333] cursor-pointer aspect-4/3 relative group"
                        >
                          <img src={ph.dataUrl} alt={ph.caption || 'Försyn'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                            <span className="text-[10px] text-white font-bold truncate">{ph.caption || 'Försyn'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Lightbox photo modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.dataUrl}
              alt={selectedPhoto.caption || 'Foto'}
              className="max-h-[75vh] w-auto rounded-2xl object-contain border border-[#444] shadow-2xl"
            />
            <div className="w-full mt-3 p-3 rounded-xl bg-[#181818]/90 backdrop-blur-md border border-[#333] flex items-center justify-between text-xs text-slate-200">
              <div>
                <span className="font-bold text-white block">{selectedPhoto.caption || 'Fältfoto'}</span>
                <span className="text-[11px] text-orange-400">{selectedPhoto.category} • {selectedPhoto.capturedAt}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadPhotoDirect(selectedPhoto.dataUrl, `Foto_${selectedPhoto.capturedAt || 'Falt'}.jpg`)}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-black font-black text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Spara bild</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1.5 rounded-lg bg-[#333] hover:bg-[#444] text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
