import React, { useState, useEffect } from 'react';
import { Project, UserAccount, UserSettings, ProjectType } from '../types';
import {
  fetchStudentFieldWorks,
  syncAllLocalProjectsToCloud,
  calculateProjectProgress,
  countProjectPhotos,
  FieldWorkStats,
  ClassSummary,
} from '../services/studentWorkService';
import { StudentWorkInspectorModal } from './StudentWorkInspectorModal';
import { PROJECT_TYPE_LABELS } from '../data/momentsData';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Cloud,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  X,
  Layers,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  SlidersHorizontal,
  HardHat,
  FolderOpen,
  Eye,
  GraduationCap,
  UploadCloud,
  Check,
} from 'lucide-react';

interface TeacherFieldInspectionViewProps {
  currentUser?: UserAccount | null;
  userSettings?: UserSettings;
  onOpenReport?: (project: Project) => void;
  onBackToDashboard: () => void;
}

export const TeacherFieldInspectionView: React.FC<TeacherFieldInspectionViewProps> = ({
  currentUser,
  userSettings,
  onOpenReport,
  onBackToDashboard,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<FieldWorkStats>({
    totalStudents: 0,
    activeInField: 0,
    pendingTeacherReview: 0,
    totalPhotos: 0,
    averageProgressPercent: 0,
  });
  const [availableClasses, setAvailableClasses] = useState<ClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingAllLocal, setIsSyncingAllLocal] = useState(false);
  const [syncStatusNotice, setSyncStatusNotice] = useState<string | null>(null);

  // Inspector modal state
  const [inspectingProject, setInspectingProject] = useState<Project | null>(null);

  // Filter drawer / menu state
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<
    'ALL' | 'ACTIVE' | 'PENDING_APPROVAL' | 'COMPLETED' | 'NEEDS_ACTION' | 'HAS_PHOTOS'
  >('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const loadData = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await fetchStudentFieldWorks({
        schoolClass: selectedClass,
        studentGroup: selectedGroup,
        status: selectedStatus,
        projectType: selectedType,
        search: searchQuery,
      });

      setProjects(data.projects);
      setStats(data.stats);
      if (data.classes && data.classes.length > 0) {
        setAvailableClasses(data.classes);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClass, selectedGroup, selectedStatus, selectedType, searchQuery]);

  // Periodic polling when window is visible so teacher sees real-time field progress
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden && !inspectingProject) {
        loadData(true);
      }
    }, 25000);
    return () => clearInterval(timer);
  }, [selectedClass, selectedGroup, selectedStatus, selectedType, searchQuery, inspectingProject]);

  const handleSyncAllLocalProjects = async () => {
    setIsSyncingAllLocal(true);
    setSyncStatusNotice(null);
    try {
      const result = await syncAllLocalProjectsToCloud(currentUser);
      if (result.error) {
        setSyncStatusNotice(`Synkmeddelande: ${result.error}`);
      } else {
        setSyncStatusNotice(
          `✓ ${result.count} sparade arbeten från enheten och tidigare sessioner har nu synkats till molnet!`
        );
        await loadData(true);
      }
      setTimeout(() => setSyncStatusNotice(null), 6000);
    } finally {
      setIsSyncingAllLocal(false);
    }
  };

  // Count active filters
  let activeFilterCount = 0;
  if (selectedClass !== 'ALL') activeFilterCount++;
  if (selectedGroup !== 'ALL') activeFilterCount++;
  if (selectedStatus !== 'ALL') activeFilterCount++;
  if (selectedType !== 'ALL') activeFilterCount++;
  if (searchQuery.trim()) activeFilterCount++;

  const handleResetFilters = () => {
    setSelectedClass('ALL');
    setSelectedGroup('ALL');
    setSelectedStatus('ALL');
    setSelectedType('ALL');
    setSearchQuery('');
  };

  const projectTypes = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 pb-28 space-y-6 font-sans">
      
      {/* Top Breadcrumb & Live Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
              Direktövervakning i fält • Molnsynkad
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-orange-400" />
            <span>Fältöversikt & Elevinspektion</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Följ vad eleverna gör på fältet i realtid. Filtrera per klass, granska foton och signera kontroller.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="min-h-[42px] px-3.5 bg-[#181818] hover:bg-[#222] border border-[#2e2e2e] text-slate-300 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
            title="Uppdatera fältdata nu"
          >
            <RefreshCw className={`w-4 h-4 text-orange-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Uppdatera</span>
          </button>

          <button
            type="button"
            onClick={handleSyncAllLocalProjects}
            disabled={isSyncingAllLocal}
            className="min-h-[42px] px-3.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-300 font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
            title="Synka alla tidigare och lokala arbeten till molnet så de inte glöms bort"
          >
            <UploadCloud className="w-4 h-4 text-orange-400" />
            <span className="hidden md:inline">
              {isSyncingAllLocal ? 'Synkar lokala...' : 'Synka alla lokala arbeten'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
            className={`min-h-[42px] px-4 font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-all border ${
              isFilterMenuOpen || activeFilterCount > 0
                ? 'bg-orange-500 text-black border-orange-400 shadow-md shadow-orange-500/20'
                : 'bg-[#181818] hover:bg-[#222] text-white border-[#333]'
            }`}
          >
            <Filter className="w-4 h-4 stroke-[2.5]" />
            <span>{isFilterMenuOpen ? 'Stäng filtermeny' : 'Filtermeny (Klasser)'}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-black text-orange-400 text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{syncStatusNotice}</span>
        </div>
      )}

      {/* Live Metrics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Elever i fält</span>
            <span className="text-xl sm:text-2xl font-black text-white">{stats.totalStudents}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Väntar på lärare</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400">{stats.pendingTeacherReview}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Foton tagna</span>
            <span className="text-xl sm:text-2xl font-black text-white">{stats.totalPhotos}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Snittframsteg</span>
            <span className="text-xl sm:text-2xl font-black text-white">{stats.averageProgressPercent}%</span>
          </div>
        </div>
      </div>

      {/* FILTER DRAWER / PANEL (CAN BE OPENED AND CLOSED) */}
      {isFilterMenuOpen && (
        <div className="bg-[#181818] border border-orange-500/40 rounded-3xl p-5 sm:p-6 space-y-6 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-[#282828] pb-4">
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-5 h-5 text-orange-400" />
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Filter & Urval i Fält
                </h3>
                <p className="text-xs text-slate-400">
                  Välj klass, utbildningsprogram eller status för att snabbt hitta elevernas arbeten.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-xl bg-[#222] hover:bg-[#2c2c2c] text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Rensa filter
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFilterMenuOpen(false)}
                className="w-9 h-9 rounded-xl bg-[#222] hover:bg-[#2c2c2c] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Stäng filtermeny"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
              Sök på elev, e-post, klass eller projekt:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Skriv namn (t.ex. Erik Svensson), klass (BA24), eller projektnamn..."
                className="w-full min-h-[44px] pl-10 pr-4 bg-[#121212] border border-[#333] focus:border-orange-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Klassväljare (Med alla klasser!) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                1. Alla klasser:
              </span>
              <span className="text-[11px] text-orange-400 font-bold">
                Klicka på en klass för att filtrera direkt
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedClass('ALL')}
                className={`min-h-[38px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all border ${
                  selectedClass === 'ALL'
                    ? 'bg-orange-500 text-black border-orange-400 font-black'
                    : 'bg-[#121212] border-[#2c2c2c] text-slate-300 hover:bg-[#202020]'
                }`}
              >
                <span>Alla klasser ({stats.totalStudents} elever)</span>
              </button>

              {availableClasses.map((cls) => {
                const isSelected = selectedClass === cls.name;
                return (
                  <button
                    key={cls.name}
                    type="button"
                    onClick={() => setSelectedClass(cls.name)}
                    className={`min-h-[38px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-orange-500 text-black border-orange-400 font-black'
                        : 'bg-[#121212] border-[#2c2c2c] text-slate-300 hover:bg-[#202020]'
                    }`}
                  >
                    <span>{cls.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                        isSelected ? 'bg-black text-orange-400' : 'bg-[#222] text-slate-400'
                      }`}
                    >
                      {cls.studentCount || cls.activeProjectsCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Fältstatus */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
              2. Fältstatus & Stoppunkter:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { id: 'ALL', label: 'Alla statusar' },
                { id: 'ACTIVE', label: 'I fält just nu' },
                { id: 'PENDING_APPROVAL', label: '⚠️ Stoppunkt (Väntar)' },
                { id: 'COMPLETED', label: 'Klara (100%)' },
                { id: 'NEEDS_ACTION', label: 'Komplettering krävs' },
                { id: 'HAS_PHOTOS', label: 'Har foton' },
              ].map((st) => {
                const isSelected = selectedStatus === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStatus(st.id as any)}
                    className={`min-h-[40px] px-3 rounded-xl font-bold text-xs flex items-center justify-center text-center cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-orange-500 text-black border-orange-400 font-black'
                        : 'bg-[#121212] border-[#2c2c2c] text-slate-300 hover:bg-[#202020]'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Projekttyp */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
              3. Projekttyp / Arbete:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedType('ALL')}
                className={`min-h-[36px] px-3 rounded-xl font-bold text-xs cursor-pointer border ${
                  selectedType === 'ALL'
                    ? 'bg-orange-500 text-black border-orange-400 font-black'
                    : 'bg-[#121212] border-[#2c2c2c] text-slate-300 hover:bg-[#202020]'
                }`}
              >
                Alla typer
              </button>
              {projectTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={`min-h-[36px] px-3 rounded-xl font-bold text-xs cursor-pointer border ${
                    selectedType === t
                      ? 'bg-orange-500 text-black border-orange-400 font-black'
                      : 'bg-[#121212] border-[#2c2c2c] text-slate-300 hover:bg-[#202020]'
                  }`}
                >
                  {PROJECT_TYPE_LABELS[t]?.title || t}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
            <span className="text-xs text-slate-400">
              Visar <strong className="text-white font-bold">{projects.length}</strong> elevprojekt
            </span>
            <button
              type="button"
              onClick={() => setIsFilterMenuOpen(false)}
              className="min-h-[38px] px-5 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-xl cursor-pointer"
            >
              Tillämpa och stäng meny
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE FILTER PILLS */}
      {activeFilterCount > 0 && !isFilterMenuOpen && (
        <div className="flex flex-wrap items-center gap-2 bg-[#161616] p-3 rounded-2xl border border-[#262626]">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-orange-400" />
            Aktiva filter ({activeFilterCount}):
          </span>

          {selectedClass !== 'ALL' && (
            <span className="px-2.5 py-1 rounded-lg bg-[#222] border border-[#333] text-xs text-white flex items-center gap-1.5">
              <span>Klass: <strong className="text-orange-400">{selectedClass}</strong></span>
              <button type="button" onClick={() => setSelectedClass('ALL')} className="hover:text-rose-400 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedStatus !== 'ALL' && (
            <span className="px-2.5 py-1 rounded-lg bg-[#222] border border-[#333] text-xs text-white flex items-center gap-1.5">
              <span>Status: <strong className="text-orange-400">{selectedStatus}</strong></span>
              <button type="button" onClick={() => setSelectedStatus('ALL')} className="hover:text-rose-400 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedType !== 'ALL' && (
            <span className="px-2.5 py-1 rounded-lg bg-[#222] border border-[#333] text-xs text-white flex items-center gap-1.5">
              <span>Typ: <strong className="text-orange-400">{PROJECT_TYPE_LABELS[selectedType as ProjectType]?.title || selectedType}</strong></span>
              <button type="button" onClick={() => setSelectedType('ALL')} className="hover:text-rose-400 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="px-2.5 py-1 rounded-lg bg-[#222] border border-[#333] text-xs text-white flex items-center gap-1.5">
              <span>Sök: <strong className="text-orange-400">"{searchQuery}"</strong></span>
              <button type="button" onClick={() => setSearchQuery('')} className="hover:text-rose-400 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-orange-400 hover:text-orange-300 font-bold ml-auto cursor-pointer"
          >
            Rensa alla
          </button>
        </div>
      )}

      {/* STUDENT WORK CARDS GRID */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-bold">Hämtar fältdata från alla elever...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-[#161616] rounded-3xl border border-[#262626] space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Inga elevprojekt matchade filtret</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Testa att byta klass i filtermenyn eller klicka på "Rensa filter" för att visa alla elever.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="min-h-[40px] px-4 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-xl cursor-pointer"
          >
            Visa alla elever & arbeten
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const progress = calculateProjectProgress(proj);
            const photoCount = countProjectPhotos(proj);
            const isPendingTeacher = progress.pendingStopPoints > 0;
            const hasGrade = proj.teacherFeedback?.grade;

            // Collect preview photos
            const previewPhotos: string[] = [];
            if (proj.preInspectionPhotos) {
              proj.preInspectionPhotos.slice(0, 2).forEach((p) => previewPhotos.push(p.dataUrl));
            }
            if (proj.moments) {
              Object.values(proj.moments).forEach((m) => {
                if (m.photos && previewPhotos.length < 4) {
                  m.photos.forEach((ph) => {
                    if (previewPhotos.length < 4) previewPhotos.push(ph.dataUrl);
                  });
                }
              });
            }

            return (
              <div
                key={proj.id}
                className="bg-[#181818] border border-[#292929] hover:border-orange-500/50 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-lg transition-all group"
              >
                <div className="space-y-3">
                  
                  {/* Card Header: Student & Class */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center font-black text-sm shrink-0">
                        {(proj.studentName || proj.contractorName || 'E').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-white text-sm block truncate">
                          {proj.studentName || proj.contractorName || 'Elev'}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {proj.studentEmail || 'Elevkonto'}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30 shrink-0">
                      {proj.schoolClass || 'Klass'}
                    </span>
                  </div>

                  {/* Project Title & Category */}
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-slate-400 block truncate">
                      {PROJECT_TYPE_LABELS[proj.projectType]?.title || proj.projectType}
                    </span>
                    <h4 className="text-sm font-black text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                      {proj.name}
                    </h4>
                  </div>

                  {/* Stop Point Warning Alert */}
                  {isPendingTeacher && (
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                      <span>Stoppunkt väntar på lärares godkännande i fält!</span>
                    </div>
                  )}

                  {/* Teacher Feedback Badge */}
                  {hasGrade && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold">
                      {hasGrade === 'GODKÄND' && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Godkänd av lärare
                        </span>
                      )}
                      {hasGrade === 'KOMPLETTERING_KRÄVS' && (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Komplettering krävs
                        </span>
                      )}
                      {hasGrade === 'UNDERKÄND' && (
                        <span className="text-rose-400 flex items-center gap-1">
                          <X className="w-3.5 h-3.5" />
                          Underkänd
                        </span>
                      )}
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="font-bold">Framsteg</span>
                      <span className="font-black text-white">{progress.percent}% ({progress.completed}/{progress.total})</span>
                    </div>
                    <div className="w-full h-2 bg-[#262626] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          progress.percent === 100 ? 'bg-emerald-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Field Photos Preview Strip */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Camera className="w-3 h-3 text-orange-400" />
                        <span>Fältfoton ({photoCount})</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {proj.lastSyncedAt || proj.updatedAt || 'Fält'}
                      </span>
                    </div>

                    {previewPhotos.length > 0 ? (
                      <div className="grid grid-cols-4 gap-1.5">
                        {previewPhotos.map((url, i) => (
                          <div key={i} className="aspect-square rounded-lg overflow-hidden bg-black border border-[#333]">
                            <img src={url} alt="Foto" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">Inga foton sparade än.</p>
                    )}
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-2 border-t border-[#242424]">
                  <button
                    type="button"
                    onClick={() => setInspectingProject(proj)}
                    className="w-full min-h-[44px] px-4 bg-[#222] hover:bg-orange-500 hover:text-black text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md group-hover:bg-orange-500 group-hover:text-black"
                  >
                    <Eye className="w-4 h-4 stroke-[2.5]" />
                    <span>Inspektera fältarbete & foton →</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INSPECTION MODAL */}
      {inspectingProject && (
        <StudentWorkInspectorModal
          project={inspectingProject}
          onClose={() => setInspectingProject(null)}
          currentUser={currentUser}
          onOpenReport={onOpenReport}
          onProjectUpdated={(updated) => {
            setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          }}
        />
      )}
    </div>
  );
};
