import React, { useState } from 'react';
import { MomentDefinition, ProjectType } from '../types';
import { ALL_MOMENTS, PROJECT_TYPE_LABELS } from '../data/momentsData';
import {
  Layers,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Camera,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  Edit3,
  CheckSquare,
  Square,
  BookOpen,
  X,
} from 'lucide-react';

interface TeacherExerciseMomentEditorProps {
  mode: 'TEMPLATE_FORM' | 'SCRATCH_FORM';
  projectType: ProjectType;
  activeMoments: MomentDefinition[];
  onChangeActiveMoments: (moments: MomentDefinition[]) => void;
}

export const TeacherExerciseMomentEditor: React.FC<TeacherExerciseMomentEditorProps> = ({
  mode,
  projectType,
  activeMoments,
  onChangeActiveMoments,
}) => {
  const [expandedPhaseNum, setExpandedPhaseNum] = useState<number | null>(1);
  const [expandedMomentId, setExpandedMomentId] = useState<string | null>(null);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [editingPhaseNum, setEditingPhaseNum] = useState<number | null>(null);
  const [editingPhaseTitle, setEditingPhaseTitle] = useState('');

  // Add moment to phase state
  const [addingToPhaseNum, setAddingToPhaseNum] = useState<number | null>(null);
  const [newMomentTitle, setNewMomentTitle] = useState('');
  const [newMomentAma, setNewMomentAma] = useState('');
  const [newMomentTolerance, setNewMomentTolerance] = useState('±5 mm');
  const [newMomentMethod, setNewMomentMethod] = useState('Rotationslaser & tumstock');
  const [newMomentInstruction, setNewMomentInstruction] = useState('');
  const [newMomentStudentTip, setNewMomentStudentTip] = useState('');
  const [newMomentProTip, setNewMomentProTip] = useState('');
  const [newMomentRequirePhoto, setNewMomentRequirePhoto] = useState(true);
  const [newMomentStopPoint, setNewMomentStopPoint] = useState(false);

  // New checklist item input inside a moment
  const [newCheckItemText, setNewCheckItemText] = useState<Record<string, string>>({});

  // Library modal for importing single moments into Scratch or Template
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryFilterType, setLibraryFilterType] = useState<ProjectType>('HUSGRUND');

  // Build phases map
  const phasesMap: Record<number, { name: string; moments: MomentDefinition[] }> = {};
  const sourceMoments =
    mode === 'TEMPLATE_FORM'
      ? ALL_MOMENTS.filter((m) => m.projectType === projectType)
      : activeMoments;

  sourceMoments.forEach((m) => {
    if (!phasesMap[m.phaseNumber]) {
      phasesMap[m.phaseNumber] = { name: m.phaseName, moments: [] };
    }
    if (!phasesMap[m.phaseNumber].moments.some((x) => x.id === m.id)) {
      phasesMap[m.phaseNumber].moments.push(m);
    }
  });

  activeMoments.forEach((m) => {
    if (!phasesMap[m.phaseNumber]) {
      phasesMap[m.phaseNumber] = { name: m.phaseName, moments: [] };
    } else if (m.phaseName && m.id.includes('custom')) {
      phasesMap[m.phaseNumber].name = m.phaseName;
    }
    if (!phasesMap[m.phaseNumber].moments.some((x) => x.id === m.id)) {
      phasesMap[m.phaseNumber].moments.push(m);
    }
  });

  const sortedPhaseNumbers = Object.keys(phasesMap)
    .map(Number)
    .sort((a, b) => a - b);

  // Toggle single moment on/off
  const handleToggleMoment = (momentId: string, templateMoment: MomentDefinition) => {
    const exists = activeMoments.some((m) => m.id === momentId);
    if (exists) {
      onChangeActiveMoments(activeMoments.filter((m) => m.id !== momentId));
    } else {
      onChangeActiveMoments([...activeMoments, { ...templateMoment, requirePhoto: true }]);
    }
  };

  // Toggle whole phase on/off
  const handleTogglePhase = (phaseMoments: MomentDefinition[]) => {
    const ids = phaseMoments.map((m) => m.id);
    const hasAny = activeMoments.some((m) => ids.includes(m.id));
    if (hasAny) {
      onChangeActiveMoments(activeMoments.filter((m) => !ids.includes(m.id)));
    } else {
      const toAdd = phaseMoments
        .filter((pm) => !activeMoments.some((am) => am.id === pm.id))
        .map((m) => ({ ...m }));
      onChangeActiveMoments([...activeMoments, ...toAdd]);
    }
  };

  // Bulk actions
  const handleSelectAllMoments = () => {
    if (mode === 'TEMPLATE_FORM') {
      const allForType = ALL_MOMENTS.filter((m) => m.projectType === projectType).map((m) => {
        const existing = activeMoments.find((am) => am.id === m.id);
        return existing ? existing : { ...m };
      });
      const customOnes = activeMoments.filter(
        (am) => !allForType.some((t) => t.id === am.id)
      );
      onChangeActiveMoments([...allForType, ...customOnes]);
    }
  };

  const handleSetPhotoOnAllActive = (requirePhoto: boolean) => {
    onChangeActiveMoments(
      activeMoments.map((m) => ({
        ...m,
        requirePhoto,
        criticalValidationHint: requirePhoto
          ? m.criticalValidationHint || 'Obligatoriskt fotobevis krävs för godkänd kontroll.'
          : undefined,
      }))
    );
  };

  // Update property on an active moment
  const handleUpdateMomentProperty = (
    momentId: string,
    key: keyof MomentDefinition,
    value: any
  ) => {
    onChangeActiveMoments(
      activeMoments.map((m) => (m.id === momentId ? { ...m, [key]: value } : m))
    );
  };

  // Move moment up/down inside activeMoments
  const handleMoveMoment = (momentId: string, direction: 'UP' | 'DOWN') => {
    const idx = activeMoments.findIndex((m) => m.id === momentId);
    if (idx === -1) return;
    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= activeMoments.length) return;
    const copy = [...activeMoments];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    onChangeActiveMoments(copy.map((m, i) => ({ ...m, order: i + 1 })));
  };

  // Delete a moment
  const handleDeleteMoment = (momentId: string) => {
    onChangeActiveMoments(activeMoments.filter((m) => m.id !== momentId));
  };

  // Rename a phase
  const handleSavePhaseRename = (phaseNum: number) => {
    if (!editingPhaseTitle.trim()) {
      setEditingPhaseNum(null);
      return;
    }
    const cleanName = editingPhaseTitle.trim();
    onChangeActiveMoments(
      activeMoments.map((m) =>
        m.phaseNumber === phaseNum ? { ...m, phaseName: cleanName } : m
      )
    );
    setEditingPhaseNum(null);
  };

  // Delete an entire phase (in scratch mode or custom phase)
  const handleDeletePhase = (phaseNum: number) => {
    onChangeActiveMoments(activeMoments.filter((m) => m.phaseNumber !== phaseNum));
  };

  // Add brand new phase
  const handleAddNewPhase = (customTitle?: string) => {
    const titleToUse = (customTitle || newPhaseName).trim();
    if (!titleToUse) return;

    const existingNums = sortedPhaseNumbers;
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    const formattedPhaseName = titleToUse.toUpperCase().startsWith('FAS')
      ? titleToUse
      : `FAS ${nextNum}: ${titleToUse.toUpperCase()}`;

    const firstMoment: MomentDefinition = {
      id: `${nextNum}.1_custom_${Date.now().toString(36).substring(2, 5)}`,
      projectType,
      order: activeMoments.length + 1,
      phaseNumber: nextNum,
      phaseName: formattedPhaseName,
      title: `Kontrollmoment 1 (${titleToUse})`,
      amaCode: 'AMA Anläggning',
      tolerance: '±5 mm',
      method: 'Rotationslaser / Måttband',
      inspectionItem: 'Mått & Utförande',
      instruction: 'Utför momentet enligt ritning och kontrollera toleranser noggrant.',
      studentTip: 'Mät alltid två gånger och dokumentera med foto innan nästa steg.',
      proTip: 'Kontrollera höjd och fall med laser.',
      requirePhoto: true,
      criticalValidationHint: 'Obligatoriskt fotobevis krävs för godkänd kontroll.',
      customChecklist: ['Kontrollerat mått enligt ritning', 'Ytan avjämnad och godkänd'],
    };

    onChangeActiveMoments([...activeMoments, firstMoment]);
    setNewPhaseName('');
    setExpandedPhaseNum(nextNum);
    setExpandedMomentId(firstMoment.id);
  };

  // Quick starter skeleton for Scratch mode (3 standard phases)
  const handleGenerateScratchSkeleton = () => {
    const nowId = Date.now().toString(36).substring(2, 5);
    const skeleton: MomentDefinition[] = [
      {
        id: `1.1_custom_${nowId}`,
        projectType,
        order: 1,
        phaseNumber: 1,
        phaseName: 'FAS 1: PLANERING, UTSÄTTNING & FÖRBEREDELSE',
        title: 'Utsättning av höjder, mått och kryssmått',
        amaCode: 'AMA Anläggning',
        tolerance: '±5 mm',
        method: 'Rotationslaser & Måttband',
        inspectionItem: 'Längd, Bredd & Diagonal',
        instruction: 'Sätt ut mått och kontrollera diagonalen (kryssmåttet) så att vinklarna är räta.',
        studentTip: 'Använd 3-4-5-regeln eller kryssmåttsverktyget i appen.',
        proTip: 'Dubbelkolla alltid höjdfixar innan start.',
        requirePhoto: true,
        criticalValidationHint: 'Fota utsättning och måttband.',
        customChecklist: ['Mätt Sida A och Sida B', 'Kontrollerat kryssmått (diagonal)'],
      },
      {
        id: `2.1_custom_${nowId}`,
        projectType,
        order: 2,
        phaseNumber: 2,
        phaseName: 'FAS 2: UTFÖRANDE & UNDERARBETE',
        title: 'Schaktning, fiberduk och bärlager/makadam',
        amaCode: 'AMA CEB / DC',
        tolerance: '±10 mm',
        method: 'Rotationslaser & Padda',
        inspectionItem: 'Schaktdjup & Packning',
        instruction: 'Schakta till rätt djup, lägg fiberduk med överlapp och packa bärlager/makadam.',
        studentTip: 'Kom ihåg att dokumentera schaktbotten innan du lägger på grus.',
        proTip: 'Padda i minst 4 överfarter per skikt.',
        requirePhoto: true,
        isStopPoint: true,
        criticalValidationHint: 'Fota fiberduk och packad bädd med lasermottagare.',
        customChecklist: ['Fiberduk utlagd med 30 cm överlapp', 'Bärlager packat och avvägt'],
      },
      {
        id: `3.1_custom_${nowId}`,
        projectType,
        order: 3,
        phaseNumber: 3,
        phaseName: 'FAS 3: SLUTKONTROLL & DOKUMENTATION',
        title: 'Slutbesiktning av färdigt arbete och städning',
        amaCode: 'AMA Slutkontroll',
        tolerance: '±3 mm',
        method: 'Rätskiva, Vattenpass & Visuell syn',
        inspectionItem: 'Helhetsintryck & Fall',
        instruction: 'Kontrollera alla slutmått, fall och lutningar samt att arbetsplatsen är städad.',
        studentTip: 'Ta ett tydligt översiktsfoto över hela det färdiga arbetet.',
        proTip: 'Tillkalla lärare för gemensam genomgång innan avetablering.',
        requirePhoto: true,
        isStopPoint: true,
        criticalValidationHint: 'Helhetsfoto på färdigställd övning.',
        customChecklist: ['Slutmått inom tolerans', 'Arbetsplatsen städad och verktyg rengjorda'],
      },
    ];
    onChangeActiveMoments(skeleton);
    setExpandedPhaseNum(1);
  };

  // Add custom moment to an existing phase
  const handleAddMomentToPhase = (phaseNum: number, phaseName: string) => {
    if (!newMomentTitle.trim()) return;
    const currentInPhase = activeMoments.filter((m) => m.phaseNumber === phaseNum);
    const nextSub = currentInPhase.length + 1;
    const newId = `${phaseNum}.${nextSub}_custom_${Date.now().toString(36).substring(2, 5)}`;

    const created: MomentDefinition = {
      id: newId,
      projectType,
      order: activeMoments.length + 1,
      phaseNumber: phaseNum,
      phaseName,
      title: newMomentTitle.trim(),
      amaCode: newMomentAma.trim() || 'AMA-EGEN',
      tolerance: newMomentTolerance.trim() || '±5 mm',
      method: newMomentMethod.trim() || 'Laser / Tumstock',
      instruction: newMomentInstruction.trim() || 'Utför kontroll enligt lärarens anvisning.',
      studentTip: newMomentStudentTip.trim() || 'Rådfråga lärare vid minsta mättveksamhet.',
      proTip: newMomentProTip.trim() || 'Kontrollera toleranser noga innan signering.',
      requirePhoto: newMomentRequirePhoto,
      isStopPoint: newMomentStopPoint,
      criticalValidationHint: newMomentRequirePhoto
        ? 'Obligatoriskt fotobevis krävs för godkänt.'
        : undefined,
      customChecklist: ['Mått kontrollerat', 'Utförande enligt anvisning'],
    };

    onChangeActiveMoments([...activeMoments, created]);
    setAddingToPhaseNum(null);
    setNewMomentTitle('');
    setNewMomentAma('');
    setNewMomentInstruction('');
    setNewMomentStudentTip('');
    setNewMomentProTip('');
    setNewMomentRequirePhoto(true);
    setNewMomentStopPoint(false);
    setExpandedMomentId(created.id);
  };

  // Add custom checklist item inside a moment
  const handleAddCustomCheckItem = (momentId: string) => {
    const text = (newCheckItemText[momentId] || '').trim();
    if (!text) return;
    const target = activeMoments.find((m) => m.id === momentId);
    if (!target) return;
    const existingList = target.customChecklist || [];
    handleUpdateMomentProperty(momentId, 'customChecklist', [...existingList, text]);
    setNewCheckItemText((prev) => ({ ...prev, [momentId]: '' }));
  };

  const handleRemoveCustomCheckItem = (momentId: string, idxToRemove: number) => {
    const target = activeMoments.find((m) => m.id === momentId);
    if (!target || !target.customChecklist) return;
    handleUpdateMomentProperty(
      momentId,
      'customChecklist',
      target.customChecklist.filter((_, idx) => idx !== idxToRemove)
    );
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Top header & bulk controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#252525] pb-3">
        <div>
          <div className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>
              Faser & Moment ({activeMoments.length} valda moment i {sortedPhaseNumbers.length} faser)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {mode === 'TEMPLATE_FORM'
              ? 'Välj vilka faser och moment från mallen som ska vara med, eller lägg till egna faser och moment. Klicka på "Inställningar" på ett moment för att skräddarsy allt.'
              : 'Bygg dina egna faser och moment helt från scratch. Du kan även plocka in enstaka moment från mallbiblioteket.'}
          </p>
        </div>

        {/* Snabbknappar för Faser & Moment */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {mode === 'TEMPLATE_FORM' && (
            <button
              type="button"
              onClick={handleSelectAllMoments}
              className="px-2.5 py-1.5 bg-[#222222] hover:bg-[#2e2e2e] text-slate-200 rounded-lg text-[11px] font-bold border border-[#383838] cursor-pointer"
            >
              Välj alla i mallen
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSetPhotoOnAllActive(true)}
            className="px-2.5 py-1.5 bg-[#222222] hover:bg-[#2e2e2e] text-amber-300 rounded-lg text-[11px] font-bold border border-[#383838] cursor-pointer"
          >
            Fotokrav på alla
          </button>
          <button
            type="button"
            onClick={() => handleSetPhotoOnAllActive(false)}
            className="px-2.5 py-1.5 bg-[#222222] hover:bg-[#2e2e2e] text-slate-300 rounded-lg text-[11px] font-bold border border-[#383838] cursor-pointer"
          >
            Slopa fotokrav
          </button>
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="px-2.5 py-1.5 bg-sky-950/70 hover:bg-sky-900 text-sky-300 rounded-lg text-[11px] font-bold border border-sky-700/70 flex items-center gap-1 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>+ Hämta moment från mallbibliotek</span>
          </button>
        </div>
      </div>

      {/* Add new phase bar (Available in BOTH Scratch and Template mode!) */}
      <div className="p-3 bg-[#141414] border border-[#2b2b2b] rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            value={newPhaseName}
            onChange={(e) => setNewPhaseName(e.target.value)}
            placeholder="Skapa ny egen fas (t.ex. Markisolering & Armering)..."
            className="flex-1 min-h-[38px] px-3 bg-[#101010] border border-[#333333] focus:border-orange-500 rounded-xl text-xs text-white outline-none"
          />
          <button
            type="button"
            onClick={() => handleAddNewPhase()}
            className="min-h-[38px] px-3.5 bg-orange-500 hover:bg-orange-400 text-black rounded-xl text-xs font-black cursor-pointer transition-colors shrink-0"
          >
            + Lägg till fas
          </button>
        </div>

        {mode === 'SCRATCH_FORM' && activeMoments.length === 0 && (
          <button
            type="button"
            onClick={handleGenerateScratchSkeleton}
            className="min-h-[38px] px-3.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0"
          >
            ⚡ Generera 3 startfaser (Utsättning, Utförande, Slutkontroll)
          </button>
        )}
      </div>

      {/* Empty state for Scratch Mode */}
      {sortedPhaseNumbers.length === 0 && (
        <div className="p-8 border-2 border-dashed border-[#2c2c2c] rounded-2xl text-center space-y-3 bg-[#141414]">
          <p className="text-sm font-black text-white">
            Inga faser eller moment tillagda ännu
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Skriv in ett fasnamn i rutan ovan och klicka på <strong>"+ Lägg till fas"</strong>, eller klicka på knappen nedan för att skapa en färdig grundstruktur med 3 faser som du kan redigera fritt.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleGenerateScratchSkeleton}
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-xl cursor-pointer shadow-md"
            >
              ⚡ Skapa 3 grundfaser automatiskt
            </button>
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className="px-4 py-2.5 bg-[#222222] hover:bg-[#2e2e2e] text-slate-200 font-bold text-xs rounded-xl border border-[#3a3a3a] cursor-pointer"
            >
              📚 Plocka moment från appens mallar
            </button>
          </div>
        </div>
      )}

      {/* Phase Accordions */}
      <div className="space-y-3">
        {sortedPhaseNumbers.map((phaseNum) => {
          const phaseData = phasesMap[phaseNum];
          const isExpanded = expandedPhaseNum === phaseNum;
          const phaseMoments = phaseData.moments;
          const activeCountInPhase = phaseMoments.filter((m) =>
            activeMoments.some((x) => x.id === m.id)
          ).length;

          return (
            <div
              key={phaseNum}
              className="border border-[#2b2b2b] rounded-2xl bg-[#141414] overflow-hidden"
            >
              {/* Phase Header */}
              <div className="p-3.5 px-4 flex flex-wrap items-center justify-between gap-2 bg-[#181818]">
                <div
                  onClick={() => setExpandedPhaseNum(isExpanded ? null : phaseNum)}
                  className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
                >
                  <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 font-black text-xs flex items-center justify-center shrink-0 tabular-nums">
                    {phaseNum}
                  </span>

                  {editingPhaseNum === phaseNum ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 flex-1"
                    >
                      <input
                        type="text"
                        value={editingPhaseTitle}
                        onChange={(e) => setEditingPhaseTitle(e.target.value)}
                        className="px-2.5 py-1 bg-[#101010] border border-orange-500 rounded-lg text-xs text-white font-bold outline-none flex-1"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSavePhaseRename(phaseNum)}
                        className="px-2.5 py-1 bg-orange-500 text-black text-xs font-black rounded-lg cursor-pointer"
                      >
                        Spara
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs sm:text-sm font-black text-white truncate">
                      {phaseData.name}
                    </span>
                  )}

                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                    · {activeCountInPhase}/{phaseMoments.length} valda
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPhaseNum(phaseNum);
                      setEditingPhaseTitle(phaseData.name);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#252525] cursor-pointer"
                    title="Byt namn på fasen"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span className="hidden sm:inline">Byt namn</span>
                  </button>

                  {mode === 'TEMPLATE_FORM' && (
                    <button
                      type="button"
                      onClick={() => handleTogglePhase(phaseMoments)}
                      className="text-[11px] text-orange-400 hover:text-orange-300 font-bold underline px-1 cursor-pointer"
                    >
                      {activeCountInPhase > 0 ? 'Avmarkera fas' : 'Välj hela fasen'}
                    </button>
                  )}

                  {mode === 'SCRATCH_FORM' && (
                    <button
                      type="button"
                      onClick={() => handleDeletePhase(phaseNum)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded hover:bg-rose-950/50 cursor-pointer"
                      title="Ta bort hela fasen"
                    >
                      Ta bort fas
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedPhaseNum(isExpanded ? null : phaseNum)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Phase Moments List */}
              {isExpanded && (
                <div className="p-3 sm:p-4 space-y-2.5 border-t border-[#232323]">
                  {phaseMoments.map((moment) => {
                    const isChecked = activeMoments.some((m) => m.id === moment.id);
                    const isDetailOpen = expandedMomentId === moment.id;
                    const currentMoment =
                      activeMoments.find((m) => m.id === moment.id) || moment;
                    const hasPhotoReq =
                      currentMoment.requirePhoto !== undefined
                        ? currentMoment.requirePhoto
                        : !!currentMoment.criticalValidationHint;

                    return (
                      <div
                        key={moment.id}
                        className={`rounded-xl border transition-all ${
                          isChecked
                            ? 'bg-[#191919] border-orange-500/35'
                            : 'bg-[#121212] border-[#242424] opacity-55'
                        }`}
                      >
                        {/* Moment Summary Row */}
                        <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleMoment(moment.id, moment)}
                              className="mt-0.5 sm:mt-0 text-orange-400 hover:text-orange-300 cursor-pointer shrink-0"
                              title={isChecked ? 'Avmarkera moment' : 'Inkludera moment i övningen'}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-5 h-5 text-orange-500 shrink-0" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-600 shrink-0" />
                              )}
                            </button>

                            <div
                              onClick={() =>
                                isChecked &&
                                setExpandedMomentId(isDetailOpen ? null : moment.id)
                              }
                              className="min-w-0 flex-1 cursor-pointer"
                            >
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-xs sm:text-sm font-black text-white">
                                  {currentMoment.title}
                                </span>
                                {currentMoment.amaCode && (
                                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                                    · {currentMoment.amaCode}
                                  </span>
                                )}
                                {currentMoment.tolerance && (
                                  <span className="text-[11px] font-mono text-emerald-400 shrink-0">
                                    · Tolerans: {currentMoment.tolerance}
                                  </span>
                                )}
                                {hasPhotoReq && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 shrink-0">
                                    <Camera className="w-3.5 h-3.5 shrink-0" />
                                    <span>Fotokrav</span>
                                  </span>
                                )}
                                {currentMoment.isStopPoint && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 shrink-0">
                                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                    <span>Stoppunkt (Lärarkontroll)</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {currentMoment.instruction}
                              </p>
                            </div>
                          </div>

                          {/* Right buttons */}
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-center">
                            {isChecked && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleMoveMoment(moment.id, 'UP')}
                                  className="p-1.5 rounded-lg bg-[#222] hover:bg-[#2e2e2e] text-slate-400 hover:text-white cursor-pointer shrink-0"
                                  title="Flytta upp moment"
                                >
                                  <ArrowUp className="w-3.5 h-3.5 shrink-0" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveMoment(moment.id, 'DOWN')}
                                  className="p-1.5 rounded-lg bg-[#222] hover:bg-[#2e2e2e] text-slate-400 hover:text-white cursor-pointer shrink-0"
                                  title="Flytta ner moment"
                                >
                                  <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedMomentId(isDetailOpen ? null : moment.id)
                                  }
                                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition-colors shrink-0 ${
                                    isDetailOpen
                                      ? 'bg-orange-500 text-black border-orange-400 font-black'
                                      : 'text-orange-400 hover:text-orange-300 bg-orange-950/40 border-orange-800/60'
                                  }`}
                                >
                                  {isDetailOpen ? 'Stäng inställningar' : '⚙️ Momentinställningar'}
                                </button>
                              </>
                            )}

                            {(mode === 'SCRATCH_FORM' || moment.id.includes('custom')) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMoment(moment.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer shrink-0"
                                title="Ta bort moment"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* EXPANDED MOMENT SETTINGS PANEL */}
                        {isChecked && isDetailOpen && (
                          <div className="p-4 border-t border-[#282828] bg-[#131313] space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[11px] font-bold text-slate-300 block">
                                  Momentets rubrik
                                </label>
                                <input
                                  type="text"
                                  value={currentMoment.title}
                                  onChange={(e) =>
                                    handleUpdateMomentProperty(
                                      moment.id,
                                      'title',
                                      e.target.value
                                    )
                                  }
                                  className="w-full min-h-[38px] px-3 bg-[#1a1a1a] border border-[#333333] focus:border-orange-500 rounded-lg text-xs text-white font-bold outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-300 block">
                                  AMA-kod / Referens
                                </label>
                                <input
                                  type="text"
                                  value={currentMoment.amaCode}
                                  onChange={(e) =>
                                    handleUpdateMomentProperty(
                                      moment.id,
                                      'amaCode',
                                      e.target.value
                                    )
                                  }
                                  placeholder="T.ex. AMA CEB.21"
                                  className="w-full min-h-[38px] px-3 bg-[#1a1a1a] border border-[#333333] focus:border-orange-500 rounded-lg text-xs text-orange-300 font-mono outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-300 block">
                                  Måttolerans (t.ex. ±5 mm, Fall 1:50)
                                </label>
                                <input
                                  type="text"
                                  value={currentMoment.tolerance || ''}
                                  onChange={(e) =>
                                    handleUpdateMomentProperty(
                                      moment.id,
                                      'tolerance',
                                      e.target.value
                                    )
                                  }
                                  placeholder="T.ex. ±5 mm"
                                  className="w-full min-h-[38px] px-3 bg-[#1a1a1a] border border-[#333333] focus:border-orange-500 rounded-lg text-xs text-emerald-300 font-mono outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-300 block">
                                  Mätmetod / Verktyg
                                </label>
                                <input
                                  type="text"
                                  value={currentMoment.method || ''}
                                  onChange={(e) =>
                                    handleUpdateMomentProperty(
                                      moment.id,
                                      'method',
                                      e.target.value
                                    )
                                  }
                                  placeholder="T.ex. Rotationslaser, Vattenpass 2m"
                                  className="w-full min-h-[38px] px-3 bg-[#1a1a1a] border border-[#333333] focus:border-orange-500 rounded-lg text-xs text-white outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-300 block">
                                  Kontrollobjekt
                                </label>
                                <input
                                  type="text"
                                  value={currentMoment.inspectionItem || ''}
                                  onChange={(e) =>
                                    handleUpdateMomentProperty(
                                      moment.id,
                                      'inspectionItem',
                                      e.target.value
                                    )
                                  }
                                  placeholder="T.ex. Schaktbotten & Bärlager"
                                  className="w-full min-h-[38px] px-3 bg-[#1a1a1a] border border-[#333333] focus:border-orange-500 rounded-lg text-xs text-white outline-none"
                                />
                              </div>

                              <div className="sm:col-span-3 space-y-1">
                                <label className="text-[11px] font-bold text-slate-300 block">
                                  Arbetsinstruktion för eleven (Tips: skriv ***** där automatiskt kryssmått ska infogas)
                                </label>
                                <textarea
                                  rows={2}
                                  value={currentMoment.instruction}
                                  onChange={(e) =>
                                    handleUpdateMomentProperty(
                                      moment.id,
                                      'instruction',
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-2.5 bg-[#1a1a1a] border border-[#333333] focus:border-orange-500 rounded-lg text-xs text-white outline-none resize-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-300 block">
                                  Elevtips i fält (studentTip)
                                </label>
                                <input
                                  type="text"
                                  value={currentMoment.studentTip || ''}
                                  onChange={(e) =>
                                    handleUpdateMomentProperty(
                                      moment.id,
                                      'studentTip',
                                      e.target.value
                                    )
                                  }
                                  className="w-full min-h-[36px] px-3 bg-[#1a1a1a] border border-[#333333] rounded-lg text-xs text-white outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-300 block">
                                  Yrkeslärarens fältråd (proTip)
                                </label>
                                <input
                                  type="text"
                                  value={currentMoment.proTip || ''}
                                  onChange={(e) =>
                                    handleUpdateMomentProperty(
                                      moment.id,
                                      'proTip',
                                      e.target.value
                                    )
                                  }
                                  className="w-full min-h-[36px] px-3 bg-[#1a1a1a] border border-[#333333] rounded-lg text-xs text-white outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-300 block">
                                  Beskrivning av vad som ska fotas
                                </label>
                                <input
                                  type="text"
                                  value={currentMoment.criticalValidationHint || ''}
                                  onChange={(e) =>
                                    handleUpdateMomentProperty(
                                      moment.id,
                                      'criticalValidationHint',
                                      e.target.value
                                    )
                                  }
                                  placeholder="T.ex. Fota tumstock mot grusbädd"
                                  className="w-full min-h-[36px] px-3 bg-[#1a1a1a] border border-[#333333] rounded-lg text-xs text-white outline-none"
                                />
                              </div>
                            </div>

                            {/* Moment Flags: Fotokrav & Stoppunkt */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#222222]">
                              <label className="p-2.5 rounded-xl bg-[#181818] border border-[#2c2c2c] flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Camera className="w-4 h-4 text-amber-400" />
                                  <div>
                                    <span className="text-xs font-bold text-white block">
                                      Obligatoriskt fotobevis på momentet
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Eleven måste ta foto för att markera som klar
                                    </span>
                                  </div>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={hasPhotoReq}
                                  onChange={(e) => {
                                    handleUpdateMomentProperty(
                                      moment.id,
                                      'requirePhoto',
                                      e.target.checked
                                    );
                                    if (e.target.checked && !currentMoment.criticalValidationHint) {
                                      handleUpdateMomentProperty(
                                        moment.id,
                                        'criticalValidationHint',
                                        'Obligatoriskt fotobevis krävs för godkänd kontroll.'
                                      );
                                    }
                                  }}
                                  className="w-4 h-4 accent-orange-500 cursor-pointer"
                                />
                              </label>

                              <label className="p-2.5 rounded-xl bg-[#181818] border border-[#2c2c2c] flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                                  <div>
                                    <span className="text-xs font-bold text-white block">
                                      Stoppunkt (Tillkalla lärare i fält)
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Markerar att läraren ska syna momentet innan övertäckning
                                    </span>
                                  </div>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={!!currentMoment.isStopPoint}
                                  onChange={(e) =>
                                    handleUpdateMomentProperty(
                                      moment.id,
                                      'isStopPoint',
                                      e.target.checked
                                    )
                                  }
                                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                                />
                              </label>
                            </div>

                            {/* Custom checklist items for this moment */}
                            <div className="pt-2 border-t border-[#222222] space-y-2">
                              <label className="text-[11px] font-bold text-slate-300 block">
                                Egna kontrollpunkter / bocklista i momentet:
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {(currentMoment.customChecklist || []).map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-1 rounded-lg bg-[#1c1c1c] border border-[#333333] text-xs text-slate-200 flex items-center gap-1.5"
                                  >
                                    <span>✓ {item}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveCustomCheckItem(moment.id, idx)
                                      }
                                      className="text-slate-500 hover:text-rose-400 cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={newCheckItemText[moment.id] || ''}
                                  onChange={(e) =>
                                    setNewCheckItemText((prev) => ({
                                      ...prev,
                                      [moment.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Lägg till ny kontrollpunkt (t.ex. Diagonal mätt inom ±5 mm)..."
                                  className="flex-1 min-h-[34px] px-3 bg-[#1a1a1a] border border-[#333333] rounded-lg text-xs text-white outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddCustomCheckItem(moment.id)}
                                  className="px-3 min-h-[34px] bg-[#252525] hover:bg-[#333333] text-orange-400 font-bold text-xs rounded-lg border border-[#383838] cursor-pointer"
                                >
                                  + Lägg till punkt
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add extra custom moment to this phase */}
                  {addingToPhaseNum === phaseNum ? (
                    <div className="p-4 rounded-xl border border-dashed border-orange-500/50 bg-[#161616] space-y-3 mt-2">
                      <div className="text-xs font-black text-orange-400">
                        Nytt eget moment i {phaseData.name}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          value={newMomentTitle}
                          onChange={(e) => setNewMomentTitle(e.target.value)}
                          placeholder="Momentets rubrik *"
                          className="sm:col-span-2 min-h-[36px] px-3 bg-[#101010] border border-[#333333] rounded-lg text-xs text-white font-bold outline-none"
                        />
                        <input
                          type="text"
                          value={newMomentAma}
                          onChange={(e) => setNewMomentAma(e.target.value)}
                          placeholder="AMA-kod (t.ex. CEB.21)"
                          className="min-h-[36px] px-3 bg-[#101010] border border-[#333333] rounded-lg text-xs text-white font-mono outline-none"
                        />
                        <input
                          type="text"
                          value={newMomentTolerance}
                          onChange={(e) => setNewMomentTolerance(e.target.value)}
                          placeholder="Tolerans (t.ex. ±5 mm)"
                          className="min-h-[36px] px-3 bg-[#101010] border border-[#333333] rounded-lg text-xs text-emerald-300 font-mono outline-none"
                        />
                        <input
                          type="text"
                          value={newMomentMethod}
                          onChange={(e) => setNewMomentMethod(e.target.value)}
                          placeholder="Mätmetod (t.ex. Rotationslaser)"
                          className="sm:col-span-2 min-h-[36px] px-3 bg-[#101010] border border-[#333333] rounded-lg text-xs text-white outline-none"
                        />
                        <textarea
                          rows={2}
                          value={newMomentInstruction}
                          onChange={(e) => setNewMomentInstruction(e.target.value)}
                          placeholder="Arbetsinstruktion för eleven..."
                          className="sm:col-span-3 p-2.5 bg-[#101010] border border-[#333333] rounded-lg text-xs text-white outline-none resize-none"
                        />
                        <input
                          type="text"
                          value={newMomentStudentTip}
                          onChange={(e) => setNewMomentStudentTip(e.target.value)}
                          placeholder="Elevtips (valfritt)..."
                          className="sm:col-span-3 min-h-[36px] px-3 bg-[#101010] border border-[#333333] rounded-lg text-xs text-white outline-none"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newMomentRequirePhoto}
                              onChange={(e) => setNewMomentRequirePhoto(e.target.checked)}
                              className="w-4 h-4 accent-orange-500"
                            />
                            <span>Kräv fotobevis</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-rose-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newMomentStopPoint}
                              onChange={(e) => setNewMomentStopPoint(e.target.checked)}
                              className="w-4 h-4 accent-rose-500"
                            />
                            <span>Stoppunkt (Lärarkontroll)</span>
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAddingToPhaseNum(null)}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                          >
                            Avbryt
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleAddMomentToPhase(phaseNum, phaseData.name)
                            }
                            className="px-4 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-lg cursor-pointer"
                          >
                            + Spara moment i fasen
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingToPhaseNum(phaseNum)}
                      className="w-full py-2.5 border border-dashed border-[#2b2b2b] hover:border-orange-500/50 rounded-xl text-slate-300 hover:text-orange-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Lägg till nytt eget moment i {phaseData.name}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Plocka enstaka moment från mallbiblioteket */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
          <div className="bg-[#181818] border border-[#333] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#282828] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white">
                  Hämta enstaka moment från appens mallbibliotek
                </h4>
                <p className="text-[11px] text-slate-400">
                  Klicka på valfritt moment för att lägga till det i din övning.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="p-1.5 rounded-lg bg-[#252525] text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-[#242424] flex flex-wrap gap-1.5 bg-[#141414]">
              {(
                ['HUSGRUND', 'PLATTSATTNING', 'ALTAN_TRADACK', 'ENSKILT_AVLOPP'] as ProjectType[]
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLibraryFilterType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    libraryFilterType === t
                      ? 'bg-orange-500 text-black font-black'
                      : 'bg-[#1f1f1f] text-slate-300 hover:text-white'
                  }`}
                >
                  {PROJECT_TYPE_LABELS[t].icon} {PROJECT_TYPE_LABELS[t].title}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {ALL_MOMENTS.filter((m) => m.projectType === libraryFilterType).map((libM) => {
                const alreadyIn = activeMoments.some((am) => am.title === libM.title);
                return (
                  <div
                    key={libM.id}
                    className="p-3 rounded-xl bg-[#121212] border border-[#2a2a2a] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white">
                        {libM.id}: {libM.title}{' '}
                        <span className="text-[10px] font-mono text-slate-400">
                          ({libM.amaCode})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {libM.instruction}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={alreadyIn}
                      onClick={() => {
                        const targetPhase = expandedPhaseNum || 1;
                        const targetPhaseName =
                          phasesMap[targetPhase]?.name || `FAS ${targetPhase}: EGEN FAS`;
                        const cloned: MomentDefinition = {
                          ...libM,
                          id: `${targetPhase}.${activeMoments.length + 1}_custom_${Date.now()
                            .toString(36)
                            .substring(2, 5)}`,
                          phaseNumber: targetPhase,
                          phaseName: targetPhaseName,
                          order: activeMoments.length + 1,
                        };
                        onChangeActiveMoments([...activeMoments, cloned]);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer ${
                        alreadyIn
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-orange-500 hover:bg-orange-400 text-black font-black'
                      }`}
                    >
                      {alreadyIn ? '✓ Tillagd' : '+ Lägg till'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
