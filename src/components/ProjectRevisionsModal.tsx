import React, { useState } from 'react';
import { Project, ProjectRevision, MomentRecord } from '../types';
import { ALL_MOMENTS } from '../data/momentsData';
import { getFormattedCurrentTime } from '../db/indexedDb';
import {
  History,
  X,
  RotateCcw,
  CheckCircle2,
  Clock,
  User,
  Sparkles,
  AlertCircle,
  Camera,
  FileText,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ProjectRevisionsModalProps {
  project: Project;
  onClose: () => void;
  onUpdateProject: (updatedProject: Project) => void;
  currentUserRole?: string;
  currentUserName?: string;
}

export const ProjectRevisionsModal: React.FC<ProjectRevisionsModalProps> = ({
  project,
  onClose,
  onUpdateProject,
  currentUserRole,
  currentUserName,
}) => {
  const revisions: ProjectRevision[] = project.revisions || [];
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(
    revisions.length > 0 ? revisions[revisions.length - 1].id : null
  );
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [newSnapshotTitle, setNewSnapshotTitle] = useState('');

  const selectedRev = revisions.find((r) => r.id === selectedRevisionId);

  // Helper to create a current snapshot
  const handleCreateSnapshot = () => {
    const time = getFormattedCurrentTime();
    const newRev: ProjectRevision = {
      id: 'rev_' + Date.now(),
      timestamp: Date.now(),
      createdAtFormatted: time,
      authorName: currentUserName || 'Yrkeslärare / Elev',
      authorRole: currentUserRole || 'STUDENT',
      summary: newSnapshotTitle.trim() || 'Manuell återställningspunkt skapad',
      momentsSnapshot: JSON.parse(JSON.stringify(project.moments)),
      notesSnapshot: project.notes,
      fieldMeasurementsSnapshot: project.fieldMeasurements
        ? JSON.parse(JSON.stringify(project.fieldMeasurements))
        : undefined,
    };

    const updatedRevs = [...revisions, newRev];
    onUpdateProject({
      ...project,
      revisions: updatedRevs,
    });
    setNewSnapshotTitle('');
    setSelectedRevisionId(newRev.id);
    setStatusMsg('Ny återställningspunkt sparad!');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Selective Restore: Restore ONLY ONE specific moment!
  const handleRestoreSingleMoment = (momentId: string) => {
    if (!selectedRev) return;
    const oldMomentRecord = selectedRev.momentsSnapshot[momentId];
    if (!oldMomentRecord) return;

    // Create a safety snapshot of the current state first
    const time = getFormattedCurrentTime();
    const safetyRev: ProjectRevision = {
      id: 'rev_safety_' + Date.now(),
      timestamp: Date.now(),
      createdAtFormatted: time,
      authorName: currentUserName || 'System',
      authorRole: currentUserRole,
      summary: `Automatisk säkerhetskopia innan selektiv återställning av Moment ${momentId}`,
      momentsSnapshot: JSON.parse(JSON.stringify(project.moments)),
      notesSnapshot: project.notes,
      fieldMeasurementsSnapshot: project.fieldMeasurements
        ? JSON.parse(JSON.stringify(project.fieldMeasurements))
        : undefined,
    };

    // Update only the chosen moment, preserving everything else!
    const updatedMoments = {
      ...project.moments,
      [momentId]: JSON.parse(JSON.stringify(oldMomentRecord)),
    };

    const updatedProject: Project = {
      ...project,
      moments: updatedMoments,
      revisions: [...(project.revisions || []), safetyRev],
    };

    onUpdateProject(updatedProject);
    setStatusMsg(`Bara Moment ${momentId} återställdes! Inget annat rördes.`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Full Restore (Restores all moments, but keeps a safety snapshot of today first!)
  const handleRestoreEntireProject = () => {
    if (!selectedRev) return;
    if (
      !confirm(
        `Vill du återställa hela övningen till versionen från "${selectedRev.createdAtFormatted}"? En säkerhetskopia av ditt nuläge skapas automatiskt först.`
      )
    ) {
      return;
    }

    const time = getFormattedCurrentTime();
    const safetyRev: ProjectRevision = {
      id: 'rev_safety_' + Date.now(),
      timestamp: Date.now(),
      createdAtFormatted: time,
      authorName: currentUserName || 'System',
      authorRole: currentUserRole,
      summary: `Säkerhetskopia sparad innan full återställning till version från ${selectedRev.createdAtFormatted}`,
      momentsSnapshot: JSON.parse(JSON.stringify(project.moments)),
      notesSnapshot: project.notes,
      fieldMeasurementsSnapshot: project.fieldMeasurements
        ? JSON.parse(JSON.stringify(project.fieldMeasurements))
        : undefined,
    };

    const updatedProject: Project = {
      ...project,
      moments: JSON.parse(JSON.stringify(selectedRev.momentsSnapshot)),
      notes: selectedRev.notesSnapshot !== undefined ? selectedRev.notesSnapshot : project.notes,
      fieldMeasurements:
        selectedRev.fieldMeasurementsSnapshot !== undefined
          ? selectedRev.fieldMeasurementsSnapshot
          : project.fieldMeasurements,
      revisions: [...(project.revisions || []), safetyRev],
    };

    onUpdateProject(updatedProject);
    setStatusMsg(`Hela övningen återställdes till versionen från ${selectedRev.createdAtFormatted}!`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const relevantMoments = ALL_MOMENTS.filter((m) => m.projectType === project.projectType);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121212] border-2 border-[#2c2c2c] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="bg-[#181818] border-b border-[#282828] p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center font-black">
              <History className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-800">
                  Tidsmaskin & Återställning
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {revisions.length} sparade versioner
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Versionshistorik för "{project.name}"
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-[#222] hover:bg-[#2c2c2c] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div className="m-4 mb-0 p-4 bg-emerald-950/90 border border-emerald-500/80 rounded-2xl flex items-center gap-3 text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-bold">{statusMsg}</span>
          </div>
        )}

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Manuell Snapshot Skapare */}
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={newSnapshotTitle}
              onChange={(e) => setNewSnapshotTitle(e.target.value)}
              placeholder="Beskrivning av återställningspunkt (t.ex. 'Färdig med all dränering')"
              className="w-full sm:flex-1 min-h-[44px] px-4 bg-[#121212] border border-[#333] rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
            />
            <button
              type="button"
              onClick={handleCreateSnapshot}
              className="w-full sm:w-auto min-h-[44px] px-5 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Spara ny punkt nu</span>
            </button>
          </div>

          {revisions.length === 0 ? (
            <div className="bg-[#181818] border border-dashed border-[#333] rounded-2xl p-8 text-center space-y-3">
              <Clock className="w-10 h-10 text-orange-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Inga tidigare versioner sparade än</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Appen sparar automatiskt återställningspunkter när du signerar moment eller tar foton. Du kan även klicka "Spara ny punkt nu" ovan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Vänster kolumn: Tidslinje över sparade versioner */}
              <div className="space-y-2 md:border-r border-[#262626] md:pr-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Välj en tidpunkt i historiken:
                </span>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {[...revisions].reverse().map((rev) => {
                    const isSelected = selectedRevisionId === rev.id;
                    const greenCount = Object.values(rev.momentsSnapshot).filter(
                      (m) => m.status === 'GREEN'
                    ).length;

                    return (
                      <div
                        key={rev.id}
                        onClick={() => setSelectedRevisionId(rev.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left space-y-1 ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500/50'
                            : 'bg-[#181818] border-[#2c2c2c] text-slate-300 hover:border-[#3c3c3c]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-orange-400">
                            {rev.createdAtFormatted}
                          </span>
                          <span className="text-[10px] bg-[#121212] px-2 py-0.5 rounded font-mono text-slate-400">
                            {greenCount} godkända
                          </span>
                        </div>
                        <p className="font-bold text-xs sm:text-sm text-white line-clamp-2">
                          {rev.summary}
                        </p>
                        <span className="text-[11px] text-slate-400 block">
                          Av: {rev.authorName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Höger kolumn: Innehåll i vald version & Selektiv Återställning */}
              <div className="md:col-span-2 space-y-4">
                {selectedRev ? (
                  <>
                    <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs text-slate-400 block">Vald tidpunkt:</span>
                        <strong className="text-base font-black text-white block">
                          {selectedRev.createdAtFormatted}
                        </strong>
                        <span className="text-xs text-orange-400">{selectedRev.summary}</span>
                      </div>

                      {/* Full Restore Button */}
                      <button
                        type="button"
                        onClick={handleRestoreEntireProject}
                        className="px-4 py-2.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700/80 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        title="Återställer hela övningen men sparar en säkerhetskopia av idag först"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Återställ hela övningen</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                          Moment i denna version (Granulär återställning):
                        </span>
                        <span className="text-[11px] text-emerald-400">
                          Du kan återställa ett enda moment utan att röra resten!
                        </span>
                      </div>

                      {/* Lista över moment i revisionen */}
                      <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                        {relevantMoments.map((moment) => {
                          const oldRec = selectedRev.momentsSnapshot[moment.id];
                          const curRec = project.moments[moment.id];

                          const oldStatus = oldRec?.status || 'RED';
                          const curStatus = curRec?.status || 'RED';
                          const isDifferent =
                            oldStatus !== curStatus ||
                            (oldRec?.comment || '') !== (curRec?.comment || '') ||
                            (oldRec?.photos?.length || 0) !== (curRec?.photos?.length || 0);

                          return (
                            <div
                              key={moment.id}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                                isDifferent
                                  ? 'bg-[#181a18] border-orange-500/40'
                                  : 'bg-[#141414] border-[#252525]'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-slate-400">
                                    {moment.id}
                                  </span>
                                  <strong className="text-xs sm:text-sm font-bold text-white truncate">
                                    {moment.title}
                                  </strong>
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                      oldStatus === 'GREEN'
                                        ? 'bg-emerald-950 text-emerald-400'
                                        : oldStatus === 'YELLOW'
                                        ? 'bg-orange-950 text-orange-400'
                                        : 'bg-slate-900 text-slate-500'
                                    }`}
                                  >
                                    {oldStatus === 'GREEN' ? 'Godkänd' : oldStatus === 'YELLOW' ? 'Pågår' : 'Ej startad'}
                                  </span>
                                </div>

                                {oldRec?.comment && (
                                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                    Anteckning: "{oldRec.comment}"
                                  </p>
                                )}
                              </div>

                              {/* Knappar för selektiv återställning */}
                              <div className="shrink-0 flex items-center gap-2">
                                {isDifferent ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRestoreSingleMoment(moment.id)}
                                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                    title="Återställ bara detta moment till hur det var då"
                                  >
                                    <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                                    <span>Återställ bara detta</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Oförändrat
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    Välj en tidpunkt i listan till vänster för att granska innehållet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
