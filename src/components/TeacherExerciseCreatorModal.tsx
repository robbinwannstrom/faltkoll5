import React, { useState, useEffect } from 'react';
import {
  TeacherExercise,
  MomentDefinition,
  ProjectType,
  UserAccount,
  ExerciseLink,
  ExerciseSettings,
  AttachedPdfDoc,
} from '../types';
import { ALL_MOMENTS, PROJECT_TYPE_LABELS } from '../data/momentsData';
import {
  saveTeacherExercise,
  fetchTeacherExercises,
  deleteTeacherExercise,
  DEFAULT_EXERCISE_SETTINGS,
  importExerciseFromPdf,
  importExerciseFromForms,
  SAMPLE_FORMS_DOCUMENTS,
  SampleDocItem,
} from '../services/exerciseService';
import { getAllStudentGroups } from '../services/userService';
import { TeacherExerciseMomentEditor } from './TeacherExerciseMomentEditor';
import { PdfViewerModal } from './PdfViewerModal';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Copy,
  FileText,
  Camera,
  CheckCircle2,
  ExternalLink,
  Layers,
  Ruler,
  Play,
  ArrowLeft,
  Search,
  Sliders,
  ShieldAlert,
  Bot,
  Award,
  Lock,
  FileUp,
  FileCheck,
  Loader2,
  Sparkles,
  Eye,
  Download,
  Upload,
  FileSpreadsheet,
  ClipboardPaste,
  ListChecks,
} from 'lucide-react';

interface TeacherExerciseCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onStartExerciseProject?: (exercise: TeacherExercise) => void;
}

type CreatorMode = 'LIST' | 'CHOOSE_CREATION_TYPE' | 'TEMPLATE_FORM' | 'SCRATCH_FORM' | 'PDF_IMPORT';
type SettingsTab = 'RULES' | 'TOOLS_EXAM' | 'GRADING' | 'MEASUREMENTS';

export const TeacherExerciseCreatorModal: React.FC<TeacherExerciseCreatorModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onStartExerciseProject,
}) => {
  const [exercises, setExercises] = useState<TeacherExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<CreatorMode>('LIST');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('RULES');

  const availableGroups = getAllStudentGroups();

  // Form state for creating / editing exercise
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('HUSGRUND');
  const [targetGroup, setTargetGroup] = useState('Byggprogrammet');
  const [educationLevel, setEducationLevel] = useState<'ALL' | 'GYMNASIE' | 'VUXEN' | 'LARLING'>('ALL');
  const [specialization, setSpecialization] = useState<'ALL' | 'BYGGPROGRAMMET' | 'ANLAGGARE' | 'HUSBYGGNAD' | 'MARK_VA'>('ALL');
  const [difficulty, setDifficulty] = useState<'GRUNDLÄGGANDE' | 'MEDEL' | 'AVANCERAD'>('MEDEL');
  const [instructions, setInstructions] = useState('');
  const [sideA, setSideA] = useState<number | undefined>(10.0);
  const [sideB, setSideB] = useState<number | undefined>(8.0);
  const [fallCmPerM, setFallCmPerM] = useState<number | undefined>(1.0);
  const [links, setLinks] = useState<ExerciseLink[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [exerciseSettings, setExerciseSettings] = useState<ExerciseSettings>(DEFAULT_EXERCISE_SETTINGS);
  const [activeMoments, setActiveMoments] = useState<MomentDefinition[]>([]);

  // PDF and Forms import states
  const [importSubTab, setImportSubTab] = useState<'PDF' | 'FORMS_FILE' | 'FORMS_PASTE' | 'SAMPLES'>('PDF');
  const [attachedPdfDoc, setAttachedPdfDoc] = useState<AttachedPdfDoc | null>(null);
  const [pdfUploadFile, setPdfUploadFile] = useState<File | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [docUploadText, setDocUploadText] = useState<string>('');
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState(false);
  const [pdfAnalysisStage, setPdfAnalysisStage] = useState('Läser in PDF-dokumentet...');
  const [pdfTargetGroup, setPdfTargetGroup] = useState('Byggprogrammet (BA)');
  const [pdfSpecialization, setPdfSpecialization] = useState('ALL');
  const [pdfDifficulty, setPdfDifficulty] = useState<'GRUNDLÄGGANDE' | 'MEDEL' | 'AVANCERAD'>('MEDEL');
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);

  // Forms import states
  const [formsUploadFile, setFormsUploadFile] = useState<File | null>(null);
  const [formsText, setFormsText] = useState<string>('');
  const [isAnalyzingForms, setIsAnalyzingForms] = useState(false);
  const [formsAnalysisStage, setFormsAnalysisStage] = useState('Läser in Forms-frågor...');

  const pdfInputRef = React.useRef<HTMLInputElement | null>(null);
  const formsInputRef = React.useRef<HTMLInputElement | null>(null);
  const inlineAttachPdfRef = React.useRef<HTMLInputElement | null>(null);

  const loadAllExercises = async () => {
    setLoading(true);
    try {
      const list = await fetchTeacherExercises();
      setExercises(list);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllExercises();
      setMode('LIST');
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const copyCodeToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      showToast(`Övningskod "${text}" har kopierats till urklipp!`);
    } catch {}
  };

  const updateSetting = <K extends keyof ExerciseSettings>(key: K, val: ExerciseSettings[K]) => {
    setExerciseSettings((prev) => ({ ...prev, [key]: val }));
  };

  // Start creating from scratch
  const handleStartScratch = () => {
    setEditingExerciseId(null);
    setTitle('');
    setCode(`ÖVN-${Math.floor(100 + Math.random() * 900)}`);
    setDescription('');
    setProjectType('HUSGRUND');
    setTargetGroup('Byggprogrammet');
    setEducationLevel('ALL');
    setSpecialization('ALL');
    setDifficulty('MEDEL');
    setInstructions('Följ faserna i angiven ordning. Mät och fotografera varje kontrollmoment.');
    setSideA(undefined);
    setSideB(undefined);
    setFallCmPerM(undefined);
    setLinks([]);
    setAttachedPdfDoc(null);
    setExerciseSettings({ ...DEFAULT_EXERCISE_SETTINGS, customCategoryLabel: 'Egen Specialövning' });
    setActiveMoments([]);
    setMode('SCRATCH_FORM');
  };

  // Start creating from template
  const handleStartTemplate = (type: ProjectType) => {
    setEditingExerciseId(null);
    const info = PROJECT_TYPE_LABELS[type];
    setTitle(`Övning: ${info.title}`);
    setCode(`${type.substring(0, 4)}-${Math.floor(10 + Math.random() * 90)}`);
    setDescription(
      `Praktisk fältövning i ${info.title.toLowerCase()}. Följ instruktioner, toleranser och kontrollkrav.`
    );
    setProjectType(type);
    setTargetGroup(type === 'PLATTSATTNING' || type === 'ENSKILT_AVLOPP' ? 'Anläggare' : 'Byggprogrammet');
    setEducationLevel('ALL');
    setSpecialization(type === 'PLATTSATTNING' || type === 'ENSKILT_AVLOPP' ? 'ANLAGGARE' : 'BYGGPROGRAMMET');
    setDifficulty('MEDEL');
    setInstructions(
      'Utför momenten i fasordning. Kontrollera mått med rotationslaser/kryssmått och ta fotobevis innan övertäckning.'
    );

    if (type === 'HUSGRUND') {
      setSideA(10.0);
      setSideB(8.0);
      setFallCmPerM(1.0);
    } else if (type === 'PLATTSATTNING') {
      setSideA(6.0);
      setSideB(4.0);
      setFallCmPerM(2.0);
    } else if (type === 'ALTAN_TRADACK') {
      setSideA(5.0);
      setSideB(3.6);
      setFallCmPerM(0.5);
    } else {
      setSideA(undefined);
      setSideB(undefined);
      setFallCmPerM(1.0);
    }

    setLinks([]);
    setAttachedPdfDoc(null);
    setExerciseSettings({ ...DEFAULT_EXERCISE_SETTINGS });
    const templateMoments = ALL_MOMENTS.filter((m) => m.projectType === type).map((m) => ({
      ...m,
      requirePhoto: true,
      tolerance: '±5 mm',
    }));
    setActiveMoments(templateMoments);
    setMode('TEMPLATE_FORM');
  };

  // Start PDF import mode
  const handleStartPdfImport = () => {
    setPdfUploadFile(null);
    setPdfDataUrl(null);
    setIsAnalyzingPdf(false);
    setImportSubTab('PDF');
    setMode('PDF_IMPORT');
  };

  // Start Forms import mode
  const handleStartFormsImport = () => {
    setFormsUploadFile(null);
    setFormsText('');
    setIsAnalyzingForms(false);
    setImportSubTab('FORMS_FILE');
    setMode('PDF_IMPORT');
  };

  const handleSelectPdfFile = (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const isText =
      file.name.toLowerCase().endsWith('.txt') ||
      file.name.toLowerCase().endsWith('.md') ||
      file.name.toLowerCase().endsWith('.text') ||
      file.type.startsWith('text/');

    if (!isPdf && !isText) {
      showToast('Stödjer PDF (.pdf) och textfiler (.txt, .md).');
      return;
    }

    setPdfUploadFile(file);

    if (isText) {
      const textReader = new FileReader();
      textReader.onload = () => {
        const text = (textReader.result as string) || '';
        setDocUploadText(text);
        showToast(`Textfil "${file.name}" inläst (${text.length} tecken).`);
      };
      textReader.readAsText(file);
    } else {
      setDocUploadText('');
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPdfDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectFormsFile = (file: File) => {
    setFormsUploadFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setFormsText(text);
      showToast(`Fil "${file.name}" lästes in framgångsrikt.`);
    };
    reader.readAsText(file);
  };

  const handleRunFormsAnalysis = async (customContent?: string, customFileName?: string) => {
    const textToAnalyze = (customContent !== undefined ? customContent : formsText).trim();
    if (!textToAnalyze) {
      showToast('Vänligen klistra in eller ladda upp formulärdata (Google Forms / CSV / JSON) först.');
      return;
    }

    setIsAnalyzingForms(true);
    setFormsAnalysisStage('Läser in Forms-frågor och svarskontroller...');

    const timer1 = setTimeout(() => {
      setFormsAnalysisStage('Analyserar kontrollpunkter, AMA-koder och toleranser med AI...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setFormsAnalysisStage('Genererar fältmoment, stoppunkter och del-checklistor för eleverna...');
    }, 2800);

    try {
      const activeFileName = customFileName || formsUploadFile?.name || 'Google_Forms_Underlag.txt';
      const fileFmt = activeFileName.endsWith('.csv') ? 'CSV' : activeFileName.endsWith('.json') ? 'JSON' : 'TEXT';

      const res = await importExerciseFromForms(
        textToAnalyze,
        activeFileName,
        fileFmt,
        {
          targetGroup: pdfTargetGroup,
          specialization: pdfSpecialization,
          difficulty: pdfDifficulty,
        }
      );

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (res.ok && res.exerciseDraft) {
        const d = res.exerciseDraft;
        setEditingExerciseId(null);
        setTitle(d.title || activeFileName.replace(/\.[^/.]+$/, ''));
        setCode(d.code || `FORMS-${Math.floor(100 + Math.random() * 900)}`);
        setDescription(d.description || '');
        setProjectType(d.projectType || 'HUSGRUND');
        setTargetGroup(d.targetGroup || pdfTargetGroup);
        setEducationLevel(d.educationLevel || 'ALL');
        setSpecialization(d.specialization || (pdfSpecialization as any));
        setDifficulty(d.difficulty || pdfDifficulty);
        setInstructions(d.instructions || '');
        setSideA(d.fieldMeasurements?.sideA);
        setSideB(d.fieldMeasurements?.sideB);
        setFallCmPerM(d.fieldMeasurements?.fallCmPerM);
        setLinks(d.links || []);
        setExerciseSettings({
          ...DEFAULT_EXERCISE_SETTINGS,
          ...(d.exerciseSettings || {}),
          customCategoryLabel: 'Forms-importerad övning',
        });
        setActiveMoments((d.customMoments || (d as any).moments || []) as MomentDefinition[]);
        setAttachedPdfDoc(null);
        setMode('SCRATCH_FORM');
        showToast(
          `Formuläret "${activeFileName}" har analyserats! Kontrollmoment har skapats. Granska och justera innan du sparar.`
        );
      } else {
        showToast('Kunde inte tolka formuläret: ' + (res.error || 'Okänt fel'));
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      showToast('Ett fel uppstod: ' + (err?.message || 'Kunde inte analysera formulär'));
    } finally {
      setIsAnalyzingForms(false);
    }
  };

  const handleRunPdfAnalysis = async () => {
    if (!pdfUploadFile) {
      showToast('Vänligen välj en PDF- eller TXT-fil först.');
      return;
    }

    const isTextFile =
      pdfUploadFile.name.toLowerCase().endsWith('.txt') ||
      pdfUploadFile.name.toLowerCase().endsWith('.md') ||
      Boolean(docUploadText);

    setIsAnalyzingPdf(true);
    setPdfAnalysisStage(isTextFile ? 'Läser in och tolkar underlagstext...' : 'Läser in PDF-dokumentet...');

    const timer1 = setTimeout(() => {
      setPdfAnalysisStage('Tolkar underlagets exakta moment och toleranser...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setPdfAnalysisStage('Skapar fältmoment och kontroller för eleverna...');
    }, 2800);

    try {
      const res = await importExerciseFromPdf(
        pdfDataUrl || '',
        pdfUploadFile.name,
        pdfUploadFile.size,
        {
          targetGroup: pdfTargetGroup,
          specialization: pdfSpecialization,
          difficulty: pdfDifficulty,
          textContent: docUploadText.trim() || undefined,
          fileType: isTextFile ? 'TXT' : 'PDF',
          strictMode: true,
        }
      );

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (res.ok && res.exerciseDraft) {
        const d = res.exerciseDraft;
        setEditingExerciseId(null);
        setTitle(d.title || pdfUploadFile.name.replace(/\.[^/.]+$/, ''));
        setCode(d.code || `PDF-${Math.floor(100 + Math.random() * 900)}`);
        setDescription(d.description || '');
        setProjectType(d.projectType || 'HUSGRUND');
        setTargetGroup(d.targetGroup || pdfTargetGroup);
        setEducationLevel(d.educationLevel || 'ALL');
        setSpecialization(d.specialization || (pdfSpecialization as any));
        setDifficulty(d.difficulty || pdfDifficulty);
        setInstructions(d.instructions || '');
        setSideA(d.fieldMeasurements?.sideA);
        setSideB(d.fieldMeasurements?.sideB);
        setFallCmPerM(d.fieldMeasurements?.fallCmPerM);
        setLinks(d.links || []);
        setExerciseSettings({
          ...DEFAULT_EXERCISE_SETTINGS,
          ...(d.exerciseSettings || {}),
          customCategoryLabel: 'PDF-importerad övning',
        });
        setActiveMoments((d.customMoments || (d as any).moments || []) as MomentDefinition[]);
        setAttachedPdfDoc(
          res.attachedPdf || {
            name: pdfUploadFile.name,
            sizeFormatted: `${(pdfUploadFile.size / 1024).toFixed(1)} KB`,
            dataUrl: pdfDataUrl || '',
            uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          }
        );
        setMode('SCRATCH_FORM');
        showToast(
          `PDF "${pdfUploadFile.name}" har analyserats! Kontrollmoment har skapats. Granska och justera innan du sparar.`
        );
      } else {
        showToast('Kunde inte tolka PDF-filen: ' + (res.error || 'Okänt fel'));
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      showToast('Ett fel uppstod: ' + (err?.message || 'Kunde inte analysera PDF'));
    } finally {
      setIsAnalyzingPdf(false);
    }
  };

  const handleAttachPdfToCurrent = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('Endast PDF-filer (.pdf) kan bifogas.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      let sizeFormatted = `${(file.size / 1024).toFixed(1)} KB`;
      if (file.size >= 1024 * 1024) {
        sizeFormatted = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      }
      setAttachedPdfDoc({
        name: file.name,
        sizeFormatted,
        dataUrl,
        uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
      showToast(`PDF-ritning "${file.name}" har bifogats till övningen!`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachedPdf = () => {
    setAttachedPdfDoc(null);
    showToast('Bifogad PDF har tagits bort från övningen.');
  };

  // Start editing existing exercise
  const handleEditExercise = (ex: TeacherExercise) => {
    setEditingExerciseId(ex.id);
    setTitle(ex.title);
    setCode(ex.code);
    setDescription(ex.description || '');
    setProjectType(ex.projectType || 'HUSGRUND');
    setTargetGroup(ex.targetGroup || 'Alla grupper');
    setEducationLevel(ex.educationLevel || 'ALL');
    setSpecialization(ex.specialization || 'ALL');
    setDifficulty(ex.difficulty || 'MEDEL');
    setInstructions(ex.instructions || '');
    setSideA(ex.fieldMeasurements?.sideA);
    setSideB(ex.fieldMeasurements?.sideB);
    setFallCmPerM(ex.fieldMeasurements?.fallCmPerM);
    setLinks(ex.links || []);
    setAttachedPdfDoc(ex.attachedPdf || null);
    setExerciseSettings({
      ...DEFAULT_EXERCISE_SETTINGS,
      ...(ex.exerciseSettings || {}),
    });
    setActiveMoments(
      ex.customMoments && ex.customMoments.length > 0
        ? ex.customMoments.map((m) => ({ ...m }))
        : ALL_MOMENTS.filter((m) => m.projectType === ex.projectType).map((m) => ({ ...m }))
    );
    setMode(ex.creationSource === 'SCRATCH' ? 'SCRATCH_FORM' : 'TEMPLATE_FORM');
  };

  // Add external link
  const handleAddLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    setLinks((prev) => [
      ...prev,
      {
        id: `link_${Date.now()}`,
        title: newLinkTitle.trim(),
        url: newLinkUrl.trim().startsWith('http')
          ? newLinkUrl.trim()
          : `https://${newLinkUrl.trim()}`,
        category: 'RITNING',
      },
    ]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const handleRemoveLink = (linkId: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
  };

  // Save exercise
  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;
    if (activeMoments.length === 0) return;

    let calculatedDiagonal: number | undefined = undefined;
    if (sideA && sideB && sideA > 0 && sideB > 0) {
      calculatedDiagonal = Number(Math.sqrt(sideA * sideA + sideB * sideB).toFixed(2));
    }

    const cleanExercise: TeacherExercise = {
      id:
        editingExerciseId ||
        `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim(),
      projectType,
      creationSource: attachedPdfDoc
        ? 'PDF_IMPORT'
        : mode === 'SCRATCH_FORM'
        ? 'SCRATCH'
        : 'TEMPLATE',
      targetGroup: targetGroup.trim(),
      educationLevel,
      specialization,
      difficulty,
      instructions: instructions.trim(),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      createdByTeacherName: currentUser?.displayName || 'Yrkeslärare',
      createdByTeacherId: currentUser?.id || 'usr_teacher',
      links,
      attachedPdf: attachedPdfDoc || undefined,
      customMoments: activeMoments,
      fieldMeasurements: {
        sideA,
        sideB,
        diagonal: calculatedDiagonal,
        fallCmPerM,
      },
      exerciseSettings,
    };

    setLoading(true);
    try {
      await saveTeacherExercise(cleanExercise);
      await loadAllExercises();
      setMode('LIST');
      showToast(
        `Övning "${cleanExercise.title}" (Kod: ${cleanExercise.code}) har sparats och publicerats!`
      );
    } catch (err: any) {
      showToast('Kunde inte spara övning: ' + (err.message || 'Okänt fel'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExercise = async (ex: TeacherExercise) => {
    setLoading(true);
    try {
      await deleteTeacherExercise(ex.id, ex.code);
      setExercises((prev) =>
        prev.filter((item) => item.id !== ex.id && item.code !== ex.code)
      );
      showToast(`Övning "${ex.title}" har tagits bort.`);
    } catch {
      showToast('Kunde inte ta bort övningen.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredExercises = exercises.filter((ex) => {
    const matchesGroup =
      selectedGroupFilter === 'ALL' ||
      !ex.targetGroup ||
      ex.targetGroup === 'Alla grupper' ||
      ex.targetGroup.toLowerCase().includes(selectedGroupFilter.toLowerCase());
    const matchesQuery =
      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.description &&
        ex.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGroup && matchesQuery;
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#141414] border border-[#2b2b2b] rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="p-4 sm:p-6 border-b border-[#242424] flex items-center justify-between shrink-0 bg-[#171717]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Kreatörspanel för Lärare (Övningsstudio)
                </h2>
                <span className="text-[11px] text-orange-400 font-semibold">
                  · Utgå från mall eller bygg från scratch
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Skapa skräddarsydda övningar med faser, moment, provläge, fotokrav och målgrupper (Bygg, Anläggare, Vuxen, Gymnasie).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#222222] hover:bg-[#2e2e2e] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/60 p-3 px-6 text-xs text-emerald-200 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMsg}</span>
            </div>
            <button
              onClick={() => setToastMsg(null)}
              className="text-emerald-400 hover:text-white text-xs underline cursor-pointer"
            >
              Stäng
            </button>
          </div>
        )}

        {/* ================= MODAL CONTENT ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ================= 1. LIST VIEW ================= */}
          {mode === 'LIST' && (
            <div className="space-y-6">
              {/* Top Action Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Sök bland övningar eller övningskoder..."
                      className="w-full min-h-[42px] px-3.5 pl-9 bg-[#1a1a1a] border border-[#2e2e2e] focus:border-orange-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <select
                    value={selectedGroupFilter}
                    onChange={(e) => setSelectedGroupFilter(e.target.value)}
                    className="min-h-[42px] px-3 bg-[#1a1a1a] border border-[#2e2e2e] focus:border-orange-500 rounded-xl text-xs text-slate-200 font-bold outline-none cursor-pointer"
                  >
                    <option value="ALL">Alla grupper & utbildningar</option>
                    {availableGroups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('CHOOSE_CREATION_TYPE')}
                    className="min-h-[44px] px-5 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ Skapa ny övning (Mall eller Från Scratch)</span>
                  </button>
                </div>
              </div>

              {/* Quick Start Banner for Both Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-orange-500/30 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white">
                      📐 Utgå från en färdig mall (Template)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Välj Husgrund, Plattsättning, Altan eller Avlopp. Välj vilka faser & moment som ska ingå med en massa inställningar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode('CHOOSE_CREATION_TYPE')}
                    className="px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-xl shrink-0 cursor-pointer"
                  >
                    Välj mall
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-sky-500/30 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white">
                      ✏️ Skapa helt egen övning från scratch
                    </h4>
                    <p className="text-xs text-slate-400">
                      Bygg egna faser och moment helt från grunden med valfria kontrollpunkter, toleranser och regler.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartScratch}
                    className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-black font-black text-xs rounded-xl shrink-0 cursor-pointer"
                  >
                    Från scratch
                  </button>
                </div>
              </div>

              {/* Exercise Cards */}
              {loading ? (
                <div className="p-12 text-center text-slate-400 text-xs font-bold">
                  Laddar lärarövningar från molnet...
                </div>
              ) : filteredExercises.length === 0 ? (
                <div className="p-10 border-2 border-dashed border-[#292929] rounded-2xl text-center space-y-3">
                  <p className="text-sm font-bold text-white">Inga övningar hittades</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Klicka på "+ Skapa ny övning" ovan för att bygga en övning från en mall eller från scratch.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredExercises.map((ex) => {
                    const typeInfo = PROJECT_TYPE_LABELS[ex.projectType] || {
                      icon: '🏗️',
                      title: ex.projectType,
                    };
                    const momentCount = ex.customMoments?.length || 0;
                    const phaseCount = new Set(
                      (ex.customMoments || []).map((m) => m.phaseNumber)
                    ).size;

                    return (
                      <div
                        key={ex.id}
                        className="bg-[#1c1c1c] border border-[#2d2d2d] hover:border-orange-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all shadow-md group"
                      >
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-orange-400">
                                Kod: {ex.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyCodeToClipboard(ex.code)}
                                className="text-slate-400 hover:text-white cursor-pointer"
                                title="Kopiera övningskod"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="text-slate-300 font-semibold">
                              {ex.targetGroup || 'Alla elever'} · {ex.difficulty || 'MEDEL'}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-black text-white group-hover:text-orange-300 transition-colors">
                              {ex.title}
                            </h3>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {ex.description || 'Ingen ytterligare beskrivning.'}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs text-slate-400">
                            <span>
                              {typeInfo.icon}{' '}
                              {ex.exerciseSettings?.customCategoryLabel || typeInfo.title}
                            </span>
                            <span>·</span>
                            <span className="font-bold text-slate-200 tabular-nums">
                              {phaseCount || 1} faser / {momentCount} moment
                            </span>
                            {ex.exerciseSettings?.examMode && (
                              <>
                                <span>·</span>
                                <span className="text-rose-400 font-bold">
                                  Provläge (Tips/AI dolda)
                                </span>
                              </>
                            )}
                            {ex.fieldMeasurements?.diagonal && (
                              <>
                                <span>·</span>
                                <span className="font-mono text-emerald-300 tabular-nums">
                                  Kryssmått: {ex.fieldMeasurements.diagonal}m
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#262626] flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditExercise(ex)}
                              className="px-3 py-1.5 bg-[#252525] hover:bg-[#333333] text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                              <span>Redigera & Inställningar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteExercise(ex)}
                              className="p-1.5 bg-[#252525] hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded-lg text-xs cursor-pointer transition-colors"
                              title="Ta bort övning"
                            >
                              <Trash2 className="w-4 h-4 shrink-0" />
                            </button>
                          </div>

                          {onStartExerciseProject && (
                            <button
                              type="button"
                              onClick={() => {
                                onStartExerciseProject(ex);
                                onClose();
                              }}
                              className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20 transition-all shrink-0"
                            >
                              <Play className="w-3.5 h-3.5 fill-black shrink-0" />
                              <span>Testkör övning</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= 2. CHOOSE CREATION TYPE ================= */}
          {mode === 'CHOOSE_CREATION_TYPE' && (
            <div className="space-y-6 max-w-3xl mx-auto py-2">
              <div className="flex items-center justify-between border-b border-[#252525] pb-3">
                <button
                  type="button"
                  onClick={() => setMode('LIST')}
                  className="text-xs text-slate-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Tillbaka till övningslistan</span>
                </button>
                <span className="text-xs font-bold text-orange-400">
                  Steg 1: Välj hur du vill skapa övningen
                </span>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Välj startmetod i Kreatörspanelen
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Utgå från en av appens befintliga mallar (där du väljer faser, moment och mängder av inställningar) eller bygg en helt egen övning från scratch.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* Option A: From Template */}
                <div className="bg-[#1c1c1c] border-2 border-[#2f2f2f] hover:border-orange-500/60 rounded-3xl p-6 flex flex-col justify-between gap-4 transition-all">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center text-2xl font-bold">
                      📐
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">
                        1. Utgå från en Mall i appen (Template)
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Välj en befintlig mall nedan. I nästa steg väljer du exakt vilka faser och moment som ska vara med, samt ställer in fotokrav, provläge, toleranser, stoppunkter m.m.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#262626]">
                    <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                      Klicka på den mall du vill anpassa:
                    </div>
                    {(
                      [
                        'HUSGRUND',
                        'PLATTSATTNING',
                        'ALTAN_TRADACK',
                        'ENSKILT_AVLOPP',
                      ] as ProjectType[]
                    ).map((type) => {
                      const info = PROJECT_TYPE_LABELS[type];
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleStartTemplate(type)}
                          className="w-full p-2.5 rounded-xl bg-[#141414] hover:bg-orange-500/15 border border-[#2b2b2b] hover:border-orange-500/50 text-left flex items-center justify-between cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{info.icon}</span>
                            <div>
                              <span className="text-xs font-black text-white group-hover:text-orange-300 block">
                                {info.title}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Anpassa faser, moment & regler
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-orange-400 font-mono font-bold tabular-nums">
                            {info.count} moment →
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Option B: From Scratch */}
                <div className="bg-[#1c1c1c] border-2 border-[#2f2f2f] hover:border-sky-500/60 rounded-3xl p-6 flex flex-col justify-between gap-4 transition-all">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center text-2xl font-bold">
                      ✏️
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">
                        2. Skapa helt egen övning från Scratch
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Skapa en helt egen övning med egna faser och egna moment från ett blankt blad (t.ex. L-stöd, kantsten, dränering, formbyggnad eller valfritt arbetsmoment).
                      </p>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
                      <li>• Skapa valfritt antal egna faser & moment</li>
                      <li>• Ställ in egna bockpunkter, AMA-krav och toleranser</li>
                      <li>• Samma rika inställningar för provläge, fotokrav & grupper</li>
                      <li>• Möjlighet att även plocka in enstaka moment från mallarna</li>
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-[#262626]">
                    <button
                      type="button"
                      onClick={handleStartScratch}
                      className="w-full min-h-[52px] bg-sky-500 hover:bg-sky-400 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20 transition-all"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Starta helt från scratch</span>
                    </button>
                  </div>
                </div>

                {/* Option C: From PDF Import */}
                <div className="bg-[#1c1c1c] border-2 border-[#2f2f2f] hover:border-emerald-500/60 rounded-3xl p-6 flex flex-col justify-between gap-4 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-2xl font-bold">
                        📄
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>PDF-tolkning</span>
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">
                        3. Importera PDF-fil (Ritning, AMA, Arbetsbeskrivning)
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Ladda upp en PDF med ritning, arbetsbeskrivning, AMA-krav eller kursinstruktion. Appen analyserar automatiskt innehållet och skapar färdiga kontrollpunkter, AMA-koder, mått och stoppunkter.
                      </p>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
                      <li>• Automatisk utläsning av ritningsmått och toleranser</li>
                      <li>• Identifierar korrekta AMA-koder (schakt, VA, makadam m.m.)</li>
                      <li>• PDF:en sparas som bifogat underlag för eleverna i fält</li>
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-[#262626]">
                    <button
                      type="button"
                      onClick={handleStartPdfImport}
                      className="w-full min-h-[52px] bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <Sparkles className="w-4 h-4 stroke-[3]" />
                      <span>Importera PDF-fil →</span>
                    </button>
                  </div>
                </div>

                {/* Option D: From Forms Import */}
                <div className="bg-[#1c1c1c] border-2 border-[#2f2f2f] hover:border-purple-500/60 rounded-3xl p-6 flex flex-col justify-between gap-4 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center text-2xl font-bold">
                        📝
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ListChecks className="w-3 h-3 text-purple-400" />
                        <span>Google / MS Forms</span>
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">
                        4. Importera Forms-fil eller Frågor (Google Forms / CSV / JSON)
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Har du provfrågor eller checklistor i Google Forms, Microsoft Forms, ett Excel/CSV-ark eller som text? Ladda upp filen eller klistra in frågorna direkt.
                      </p>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
                      <li>• Stödjer Google Forms CSV, JSON och kopierad frågetext</li>
                      <li>• Omvandlar automatiskt frågor till fältmoment & del-checklistor</li>
                      <li>• Skapar stoppunkter och tips med 1 klick</li>
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-[#262626]">
                    <button
                      type="button"
                      onClick={handleStartFormsImport}
                      className="w-full min-h-[52px] bg-purple-500 hover:bg-purple-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/20 transition-all"
                    >
                      <ListChecks className="w-4 h-4 stroke-[3]" />
                      <span>Importera Forms-frågor / fil →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2.5 DOKUMENT- & FORMS-STUDIO (IMPORT) ================= */}
          {mode === 'PDF_IMPORT' && (
            <div className="space-y-6 max-w-3xl mx-auto py-2">
              <div className="flex items-center justify-between border-b border-[#252525] pb-3">
                <button
                  type="button"
                  onClick={() => setMode('CHOOSE_CREATION_TYPE')}
                  className="text-xs text-slate-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Tillbaka till val av startmetod</span>
                </button>
                <span className="text-xs font-bold text-orange-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dokument- & Forms-Studio</span>
                </span>
              </div>

              {/* Title & Info */}
              <div className="text-center space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Importera PDF eller Forms för att skapa övning
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                  Ladda upp en PDF (ritning/beskrivning), en Forms-fil (.csv / .json), klistra in frågor direkt, eller testa med våra färdiga exempelmallar.
                </p>
              </div>

              {/* Sub-tabs selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-[#181818] border border-[#2e2e2e] rounded-2xl">
                <button
                  type="button"
                  onClick={() => setImportSubTab('PDF')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    importSubTab === 'PDF'
                      ? 'bg-emerald-500 text-black font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF / TXT-fil</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportSubTab('FORMS_PASTE')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    importSubTab === 'FORMS_PASTE'
                      ? 'bg-purple-500 text-black font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Klistra in text</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportSubTab('FORMS_FILE')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    importSubTab === 'FORMS_FILE'
                      ? 'bg-purple-500 text-black font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Forms (.csv/.json)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportSubTab('SAMPLES')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    importSubTab === 'SAMPLES'
                      ? 'bg-orange-500 text-black font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Exempeldokument</span>
                </button>
              </div>

              {/* Hidden file inputs */}
              <input
                type="file"
                ref={pdfInputRef}
                accept=".pdf,application/pdf,.txt,text/plain,.md,text/markdown"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleSelectPdfFile(f);
                }}
                className="hidden"
              />
              <input
                type="file"
                ref={formsInputRef}
                accept=".csv,.json,.txt,.tsv,text/plain,text/csv,application/json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleSelectFormsFile(f);
                }}
                className="hidden"
              />

              {/* TAB 1: PDF or TXT File */}
              {importSubTab === 'PDF' && (
                <div className="space-y-4">
                  {!pdfUploadFile ? (
                    <div
                      onClick={() => pdfInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const f = e.dataTransfer.files?.[0];
                        if (f) handleSelectPdfFile(f);
                      }}
                      className="border-2 border-dashed border-[#383838] hover:border-emerald-500/80 bg-[#161616] hover:bg-[#1a1a1a] rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all space-y-4 group"
                    >
                      <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileUp className="w-8 h-8 stroke-[2]" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                          Klicka för att bläddra eller dra och släpp din PDF- eller TXT-fil här
                        </div>
                        <p className="text-xs text-slate-400">
                          Stödjer ritningar (.pdf), uppgiftsblad och ren text (.txt, .md upp till 50 MB)
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#222] text-xs font-bold text-slate-300 border border-[#333]">
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Välj PDF- eller TXT-fil från din enhet</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#181818] border border-emerald-500/40 rounded-3xl p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <FileCheck className="w-6 h-6 stroke-[2.2]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-black text-white truncate">
                              {pdfUploadFile.name}
                            </div>
                            <p className="text-xs text-emerald-400 font-medium">
                              {(pdfUploadFile.size / 1024).toFixed(1)} KB · Redo för strikt tolkning
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setPdfUploadFile(null);
                            setPdfDataUrl(null);
                            setDocUploadText('');
                          }}
                          className="px-3 py-1.5 bg-[#252525] hover:bg-[#333] text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                        >
                          Byt fil
                        </button>
                      </div>

                      {/* If text was extracted from file, show preview & editable area */}
                      {docUploadText && (
                        <div className="space-y-1.5 pt-2 border-t border-[#262626]">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="font-bold text-slate-300">
                              Förhandsgranskning av underlagets text:
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {docUploadText.split('\n').filter((l) => l.trim().length > 0).length} rader · {docUploadText.length} tecken
                            </span>
                          </div>
                          <textarea
                            value={docUploadText}
                            onChange={(e) => setDocUploadText(e.target.value)}
                            rows={6}
                            className="w-full bg-[#111] border border-[#2e2e2e] focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-200 font-mono resize-y focus:outline-none"
                            placeholder="Textinnehåll från filen..."
                          />
                          <p className="text-[11px] text-emerald-400">
                            ✓ Strikt läge aktivt: Endast moment som uttryckligen finns i denna text kommer att skapas.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Forms File */}
              {importSubTab === 'FORMS_FILE' && (
                <div className="space-y-4">
                  {!formsUploadFile ? (
                    <div
                      onClick={() => formsInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const f = e.dataTransfer.files?.[0];
                        if (f) handleSelectFormsFile(f);
                      }}
                      className="border-2 border-dashed border-[#383838] hover:border-purple-500/80 bg-[#161616] hover:bg-[#1a1a1a] rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all space-y-4 group"
                    >
                      <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileSpreadsheet className="w-8 h-8 stroke-[2]" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-base font-black text-white group-hover:text-purple-300 transition-colors">
                          Klicka eller dra och släpp din Forms-fil här (.csv, .json, .txt)
                        </div>
                        <p className="text-xs text-slate-400">
                          Stödjer Google Forms-exporter, Microsoft Forms CSV/Excel, besiktningslistor och JSON-frågebatterier
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#222] text-xs font-bold text-slate-300 border border-[#333]">
                        <Upload className="w-3.5 h-3.5 text-purple-400" />
                        <span>Välj Forms-fil från din enhet</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#181818] border border-purple-500/40 rounded-3xl p-5 sm:p-6 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                            <FileCheck className="w-6 h-6 stroke-[2.2]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-black text-white truncate">
                              {formsUploadFile.name}
                            </div>
                            <p className="text-xs text-purple-400 font-medium">
                              {(formsUploadFile.size / 1024).toFixed(1)} KB · Innehåll inläst och redo
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setFormsUploadFile(null);
                            setFormsText('');
                          }}
                          className="px-3 py-1.5 bg-[#252525] hover:bg-[#333] text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                        >
                          Byt fil
                        </button>
                      </div>

                      {formsText && (
                        <div className="p-3 bg-[#121212] border border-[#2b2b2b] rounded-xl text-xs font-mono text-slate-400 max-h-32 overflow-y-auto whitespace-pre-wrap">
                          {formsText.slice(0, 500)}
                          {formsText.length > 500 && '... (fortsättning)'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Paste Forms Text / Questions */}
              {importSubTab === 'FORMS_PASTE' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 block">
                      Klistra in frågor, svarsalternativ eller checklistor från Google Forms / Word / Docs:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFormsText(SAMPLE_FORMS_DOCUMENTS[1].content);
                        showToast('Exempeltext för Altan & Trädäck har lagts in i rutan.');
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 underline font-semibold cursor-pointer"
                    >
                      Klistra in exempeltext
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={formsText}
                    onChange={(e) => setFormsText(e.target.value)}
                    placeholder="Exempel:
Google Forms: Egenkontroll Husgrund
Fråga 1: Är utsättning med profiler och linor kontrollerad?
- Ja, kryssmått har mätts med stålband och stämmer
- Snedsträvor monterade

Fråga 2: Är schaktbotten avsynad? (Stoppunkt)
- Matjord bortgrävd ner till fast morän
- Inga vattenfickor..."
                    className="w-full p-4 bg-[#141414] border border-[#333333] focus:border-purple-500 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 font-mono outline-none resize-y leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Stödjer vanlig text, frågelistor, tabeller och CSV-rader.</span>
                    <span>{formsText.length} tecken</span>
                  </div>
                </div>
              )}

              {/* TAB 4: Sample Documents (1-Click Test) */}
              {importSubTab === 'SAMPLES' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-300">
                    Välj ett av våra färdiga exempeldokument för att testa importfunktionen direkt:
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {SAMPLE_FORMS_DOCUMENTS.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-[#181818] border border-[#2c2c2c] hover:border-orange-500/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {doc.type === 'FORMS_CSV' ? '📊' : doc.type === 'FORMS_JSON' ? '⚙️' : '📝'}
                            </span>
                            <span className="text-sm font-black text-white">{doc.title}</span>
                          </div>
                          <p className="text-xs text-slate-400">{doc.description}</p>
                          <span className="text-[10px] text-orange-400 font-mono">
                            Filnamn: {doc.fileName}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setFormsText(doc.content);
                            handleRunFormsAnalysis(doc.content, doc.fileName);
                          }}
                          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20 shrink-0 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Testa detta dokument</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Options before analyzing */}
              <div className="bg-[#181818] border border-[#2b2b2b] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-orange-400" />
                  <span>Inställningar för målgrupp & yrkesinriktning</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Målgrupp / Elevgrupp
                    </label>
                    <select
                      value={pdfTargetGroup}
                      onChange={(e) => setPdfTargetGroup(e.target.value)}
                      className="w-full min-h-[42px] px-3 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-xs text-white font-bold outline-none cursor-pointer"
                    >
                      {availableGroups.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Inriktning / Program
                    </label>
                    <select
                      value={pdfSpecialization}
                      onChange={(e) => setPdfSpecialization(e.target.value)}
                      className="w-full min-h-[42px] px-3 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-xs text-white font-bold outline-none cursor-pointer"
                    >
                      <option value="ALL">Automatisk identifiering från dokumentet</option>
                      <option value="BYGGPROGRAMMET">Byggprogrammet (Hus & Anläggning)</option>
                      <option value="ANLAGGARE">Anläggning & Maskin</option>
                      <option value="MARK_VA">Mark, VA & Schakt</option>
                      <option value="HUSBYGGNAD">Husbyggnad & Betong</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Svårighetsgrad
                    </label>
                    <select
                      value={pdfDifficulty}
                      onChange={(e) => setPdfDifficulty(e.target.value as any)}
                      className="w-full min-h-[42px] px-3 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-xs text-white font-bold outline-none cursor-pointer"
                    >
                      <option value="GRUNDLÄGGANDE">Grundläggande (Åk 1 / Intro)</option>
                      <option value="MEDEL">Medel (Standardövning)</option>
                      <option value="AVANCERAD">Avancerad (Slutprov / APL)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('CHOOSE_CREATION_TYPE')}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#222] hover:bg-[#2b2b2b] text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Tillbaka
                </button>

                {importSubTab === 'PDF' ? (
                  <button
                    type="button"
                    onClick={handleRunPdfAnalysis}
                    disabled={!pdfUploadFile || isAnalyzingPdf}
                    className={`w-full sm:w-auto min-h-[52px] px-8 rounded-xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg ${
                      !pdfUploadFile || isAnalyzingPdf
                        ? 'bg-[#2a2a2a] text-slate-500 cursor-not-allowed border border-[#333]'
                        : 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black shadow-emerald-500/25'
                    }`}
                  >
                    {isAnalyzingPdf ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                        <span>{pdfAnalysisStage}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 stroke-[2.5]" />
                        <span>Analysera PDF & Generera övningsinstruktioner</span>
                      </>
                    )}
                  </button>
                ) : importSubTab === 'FORMS_FILE' || importSubTab === 'FORMS_PASTE' ? (
                  <button
                    type="button"
                    onClick={() => handleRunFormsAnalysis()}
                    disabled={(!formsUploadFile && !formsText.trim()) || isAnalyzingForms}
                    className={`w-full sm:w-auto min-h-[52px] px-8 rounded-xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg ${
                      (!formsUploadFile && !formsText.trim()) || isAnalyzingForms
                        ? 'bg-[#2a2a2a] text-slate-500 cursor-not-allowed border border-[#333]'
                        : 'bg-purple-500 hover:bg-purple-400 active:scale-95 text-black shadow-purple-500/25'
                    }`}
                  >
                    {isAnalyzingForms ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                        <span>{formsAnalysisStage}</span>
                      </>
                    ) : (
                      <>
                        <ListChecks className="w-5 h-5 stroke-[2.5]" />
                        <span>Tolka Forms-data & Skapa övningsmoment</span>
                      </>
                    )}
                  </button>
                ) : null}
              </div>

              {/* Progress animation during analysis */}
              {(isAnalyzingPdf || isAnalyzingForms) && (
                <div className="p-4 rounded-2xl bg-[#121c16] border border-emerald-800/60 text-center space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isAnalyzingPdf ? pdfAnalysisStage : formsAnalysisStage}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Detta tar normalt 3–6 sekunder. Vi analyserar innehåll, AMA-koder, mått och bygger färdiga kontrollmoment åt dig.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ================= 3. TEMPLATE / SCRATCH EDITOR FORM ================= */}
          {(mode === 'TEMPLATE_FORM' || mode === 'SCRATCH_FORM') && (
            <form onSubmit={handleSaveExercise} className="space-y-6">
              {/* Top Bar inside Editor */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#252525] pb-3">
                <button
                  type="button"
                  onClick={() => setMode('LIST')}
                  className="text-xs text-slate-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Tillbaka till alla övningar</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-orange-400">
                    {editingExerciseId
                      ? 'Redigerar lärarövning'
                      : mode === 'TEMPLATE_FORM'
                      ? `Anpassar mall: ${PROJECT_TYPE_LABELS[projectType].title}`
                      : 'Skapar helt egen övning från scratch'}
                  </span>
                </div>
              </div>

              {/* SECTION 1: GRUNDUPPGIFTER & MÅLGRUPP */}
              <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>1. Övningsnamn, Kod & Målgrupp (Sortering för elever)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Övningstitel *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="T.ex. Praktiskt Prov: Schakt & Bärlager BA24"
                      className="w-full min-h-[44px] px-3.5 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-sm text-white font-bold placeholder-slate-500 outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Övningskod (för elever) *
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="T.ex. BYGG-101"
                      className="w-full min-h-[44px] px-3.5 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-sm text-orange-400 font-mono font-bold outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Elevgrupp / Program *
                    </label>
                    <select
                      value={targetGroup}
                      onChange={(e) => setTargetGroup(e.target.value)}
                      className="w-full min-h-[42px] px-3 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-xs text-white font-bold outline-none cursor-pointer"
                    >
                      <option value="Alla grupper">Alla grupper / klasser</option>
                      {availableGroups.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Utbildningsnivå (Gymnasie / Vuxen)
                    </label>
                    <select
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value as any)}
                      className="w-full min-h-[42px] px-3 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-xs text-white font-bold outline-none cursor-pointer"
                    >
                      <option value="ALL">Alla nivåer (Gymnasie & Vuxen)</option>
                      <option value="GYMNASIE">Gymnasie (Åk 1–3)</option>
                      <option value="VUXEN">Vuxenutbildning (Vuxen)</option>
                      <option value="LARLING">Lärling / APL</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Svårighetsgrad
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full min-h-[42px] px-3 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-xs text-white font-bold outline-none cursor-pointer"
                    >
                      <option value="GRUNDLÄGGANDE">Grundläggande (Åk 1 / Intro)</option>
                      <option value="MEDEL">Medel (Standardövning)</option>
                      <option value="AVANCERAD">Avancerad (Slutprov / Yrkesprov)</option>
                    </select>
                  </div>

                  {mode === 'SCRATCH_FORM' && (
                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-xs font-bold text-sky-300 block">
                        Egen kategoribeteckning (valfritt för Scratch-övning):
                      </label>
                      <input
                        type="text"
                        value={exerciseSettings.customCategoryLabel || ''}
                        onChange={(e) =>
                          updateSetting('customCategoryLabel', e.target.value)
                        }
                        placeholder="T.ex. L-stöd & Mur, Dränering, VA-schakt, Kantsten..."
                        className="w-full min-h-[40px] px-3.5 bg-[#121212] border border-sky-500/40 rounded-xl text-xs text-white outline-none"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">
                        Kort beskrivning av övningen
                      </label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Beskriv övningens mål för eleven..."
                        className="w-full p-3 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-xs text-white outline-none resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">
                        Lärarens övergripande fältinstruktioner
                      </label>
                      <textarea
                        rows={2}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Säkerhetskrav, verktyg och ordningsregler..."
                        className="w-full p-3 bg-[#121212] border border-[#333333] focus:border-orange-500 rounded-xl text-xs text-white outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: BIFOGAD PDF-RITNING / INSTRUKTIONSDOKUMENT */}
              <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-4 sm:p-5 space-y-3">
                <input
                  type="file"
                  ref={inlineAttachPdfRef}
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAttachPdfToCurrent(f);
                  }}
                  className="hidden"
                />

                <div className="flex items-center justify-between border-b border-[#252525] pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Bifogad PDF-ritning / Instruktionsdokument
                    </span>
                  </div>
                  {attachedPdfDoc && (
                    <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Bifogad och tillgänglig för elever</span>
                    </span>
                  )}
                </div>

                {attachedPdfDoc ? (
                  <div className="p-3.5 rounded-xl bg-[#141c17] border border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {attachedPdfDoc.name}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {attachedPdfDoc.sizeFormatted || 'PDF-dokument'}
                          {attachedPdfDoc.uploadedAt && ` · Uppladdad ${attachedPdfDoc.uploadedAt}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsPdfViewerOpen(true)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Förhandsgranska</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => inlineAttachPdfRef.current?.click()}
                        className="px-3 py-1.5 bg-[#252525] hover:bg-[#333] text-slate-300 hover:text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        Byt ut
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveAttachedPdf}
                        className="p-1.5 bg-[#252525] hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded-lg text-xs cursor-pointer transition-colors"
                        title="Ta bort PDF från övningen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#141414] border border-dashed border-[#333] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-300">
                        Ingen PDF-fil bifogad till denna övning än
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Bifoga en ritning, schaktplan eller arbetsbeskrivning som eleverna kan öppna direkt i fält när de utför övningen.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => inlineAttachPdfRef.current?.click()}
                      className="px-3.5 py-2 bg-[#222] hover:bg-orange-500 hover:text-black text-slate-200 border border-[#333] hover:border-orange-400 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>+ Bifoga ritning / PDF</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 2: AVANCERADE ÖVNINGSINSTÄLLNINGAR ("EN MASSA INSTÄLLNINGAR") */}
              <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#252525] pb-3">
                  <div>
                    <div className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4" />
                      <span>2. Detaljerade Övningsinställningar, Provläge & Kontrollkrav</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Styr exakt hur övningen fungerar för eleven: fotokrav, låsta faser, hjälpmedel, provläge, toleranser och riktmått.
                    </p>
                  </div>

                  {/* Quick Preset Toggle: Inlärningsläge vs Provläge */}
                  <div className="flex items-center gap-1.5 bg-[#121212] p-1 rounded-xl border border-[#2c2c2c]">
                    <button
                      type="button"
                      onClick={() => {
                        setExerciseSettings((prev) => ({
                          ...prev,
                          examMode: false,
                          allowAiHelper: true,
                          showStudentTips: true,
                          showProTips: true,
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        !exerciseSettings.examMode
                          ? 'bg-emerald-500 text-black font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📚 Övningsläge (Med tips & AI)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExerciseSettings((prev) => ({
                          ...prev,
                          examMode: true,
                          allowAiHelper: false,
                          showStudentTips: false,
                          showProTips: false,
                          strictSequentialPhases: true,
                          photoRequirementMode: 'ALL_MOMENTS',
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        exerciseSettings.examMode
                          ? 'bg-rose-500 text-white font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🔒 Provläge (Yrkesprov)
                    </button>
                  </div>
                </div>

                {/* Settings Sub-tabs */}
                <div className="flex flex-wrap gap-1.5 border-b border-[#252525] pb-2">
                  <button
                    type="button"
                    onClick={() => setActiveSettingsTab('RULES')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      activeSettingsTab === 'RULES'
                        ? 'bg-orange-500 text-black font-black'
                        : 'bg-[#121212] text-slate-300 hover:text-white'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Foto- & Fältregler</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSettingsTab('TOOLS_EXAM')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      activeSettingsTab === 'TOOLS_EXAM'
                        ? 'bg-orange-500 text-black font-black'
                        : 'bg-[#121212] text-slate-300 hover:text-white'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Hjälpmedel & Verktyg</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSettingsTab('GRADING')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      activeSettingsTab === 'GRADING'
                        ? 'bg-orange-500 text-black font-black'
                        : 'bg-[#121212] text-slate-300 hover:text-white'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Bedömning & Stoppunkter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSettingsTab('MEASUREMENTS')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      activeSettingsTab === 'MEASUREMENTS'
                        ? 'bg-orange-500 text-black font-black'
                        : 'bg-[#121212] text-slate-300 hover:text-white'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Riktmått, Tolerans & Ritningar</span>
                  </button>
                </div>

                {/* TAB 1: FOTO- & FÄLTREGLER */}
                {activeSettingsTab === 'RULES' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] space-y-1.5">
                      <label className="text-xs font-bold text-white block">
                        Fotobevis i övningen
                      </label>
                      <select
                        value={exerciseSettings.photoRequirementMode}
                        onChange={(e) =>
                          updateSetting('photoRequirementMode', e.target.value as any)
                        }
                        className="w-full min-h-[38px] px-2.5 bg-[#1c1c1c] border border-[#333] rounded-lg text-xs text-white font-semibold outline-none"
                      >
                        <option value="ALL_MOMENTS">Kräv foto på ALLA moment</option>
                        <option value="MARKED_ONLY">Kräv foto på markerade moment</option>
                        <option value="OPTIONAL">Valfritt med foto (kan gå vidare utan)</option>
                      </select>
                    </div>

                    <div className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] space-y-1.5">
                      <label className="text-xs font-bold text-white block">
                        Minsta antal foton per fotomoment
                      </label>
                      <select
                        value={exerciseSettings.minPhotosPerMoment}
                        onChange={(e) =>
                          updateSetting('minPhotosPerMoment', Number(e.target.value))
                        }
                        className="w-full min-h-[38px] px-2.5 bg-[#1c1c1c] border border-[#333] rounded-lg text-xs text-white font-semibold outline-none"
                      >
                        <option value={1}>Minst 1 bild per moment</option>
                        <option value={2}>Minst 2 bilder (Översikt + Närbild)</option>
                        <option value={3}>Minst 3 bilder per moment</option>
                      </select>
                    </div>

                    <div className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] space-y-1.5">
                      <label className="text-xs font-bold text-white block">
                        Försyn & Skadeguide före start
                      </label>
                      <select
                        value={exerciseSettings.preInspectionRule}
                        onChange={(e) =>
                          updateSetting('preInspectionRule', e.target.value as any)
                        }
                        className="w-full min-h-[38px] px-2.5 bg-[#1c1c1c] border border-[#333] rounded-lg text-xs text-white font-semibold outline-none"
                      >
                        <option value="OPTIONAL">Valfri för eleven</option>
                        <option value="MANDATORY">Obligatorisk (måste göras först)</option>
                        <option value="DISABLED">Avstängd (hoppa över försyn)</option>
                      </select>
                    </div>

                    <label className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Lås faser i ordningsföljd
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Fas 1 måste bli klar innan Fas 2 öppnas
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={exerciseSettings.strictSequentialPhases}
                        onChange={(e) =>
                          updateSetting('strictSequentialPhases', e.target.checked)
                        }
                        className="w-4 h-4 accent-orange-500"
                      />
                    </label>

                    <label className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Kräv uppmätt mätvärde i anteckning
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Eleven måste skriva in sitt mätvärde
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={exerciseSettings.requireMeasurementInComment}
                        onChange={(e) =>
                          updateSetting('requireMeasurementInComment', e.target.checked)
                        }
                        className="w-4 h-4 accent-orange-500"
                      />
                    </label>

                    <label className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Kräv fingerritad signatur
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Signatur krävs vid klarmarkering
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={exerciseSettings.requireFingerSignature}
                        onChange={(e) =>
                          updateSetting('requireFingerSignature', e.target.checked)
                        }
                        className="w-4 h-4 accent-orange-500"
                      />
                    </label>
                  </div>
                )}

                {/* TAB 2: HJÄLPMEDEL & VERKTYG */}
                {activeSettingsTab === 'TOOLS_EXAM' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    <label className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Tillåt AI-Hjälparen i momenten
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Stäng av vid prov så eleven ej kan fråga AI
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={exerciseSettings.allowAiHelper}
                        onChange={(e) => updateSetting('allowAiHelper', e.target.checked)}
                        className="w-4 h-4 accent-orange-500"
                      />
                    </label>

                    <label className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Visa Elevtips (studentTip)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Visar pedagogiska fälttips i varje moment
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={exerciseSettings.showStudentTips}
                        onChange={(e) => updateSetting('showStudentTips', e.target.checked)}
                        className="w-4 h-4 accent-orange-500"
                      />
                    </label>

                    <label className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Visa Yrkeslärarens fältråd
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Visar lärarens proffstips och toleransråd
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={exerciseSettings.showProTips}
                        onChange={(e) => updateSetting('showProTips', e.target.checked)}
                        className="w-4 h-4 accent-orange-500"
                      />
                    </label>

                    <label className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Tillåt Kryssmåtts- & 3-4-5-räknare
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Inbyggd diagonalräknare i övningen
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={exerciseSettings.allowCrossMeasureCalculator}
                        onChange={(e) =>
                          updateSetting('allowCrossMeasureCalculator', e.target.checked)
                        }
                        className="w-4 h-4 accent-orange-500"
                      />
                    </label>

                    <label className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Tillåt Grupparbete & Molnsynk
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Elever kan dela övningen i arbetslag
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={exerciseSettings.allowGroupSync}
                        onChange={(e) => updateSetting('allowGroupSync', e.target.checked)}
                        className="w-4 h-4 accent-orange-500"
                      />
                    </label>

                    <label className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Bränn in vattenstämpel på foton
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Tidsstämpel och moment bränns in i bilden
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={exerciseSettings.requireWatermark}
                        onChange={(e) =>
                          updateSetting('requireWatermark', e.target.checked)
                        }
                        className="w-4 h-4 accent-orange-500"
                      />
                    </label>
                  </div>
                )}

                {/* TAB 3: BEDÖMNING & STOPPUNKTER */}
                {activeSettingsTab === 'GRADING' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] space-y-1.5">
                      <label className="text-xs font-bold text-white block">
                        Bedömningsskala för rapporten
                      </label>
                      <select
                        value={exerciseSettings.gradingScale}
                        onChange={(e) =>
                          updateSetting('gradingScale', e.target.value as any)
                        }
                        className="w-full min-h-[38px] px-2.5 bg-[#1c1c1c] border border-[#333] rounded-lg text-xs text-white font-semibold outline-none"
                      >
                        <option value="PASS_FAIL">Godkänd / Icke Godkänd (G / IG)</option>
                        <option value="GY25_F_TO_A">Betygsskala F–A (Skolverket GY25)</option>
                        <option value="FEEDBACK_ONLY">Formativ Lärarrespons</option>
                      </select>
                    </div>

                    <div className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] space-y-1.5">
                      <label className="text-xs font-bold text-white block">
                        Beräknad tidsåtgång / Tidsgräns
                      </label>
                      <input
                        type="text"
                        value={exerciseSettings.estimatedDuration}
                        onChange={(e) =>
                          updateSetting('estimatedDuration', e.target.value)
                        }
                        placeholder="T.ex. 4 timmar eller 2 heldagar"
                        className="w-full min-h-[38px] px-2.5 bg-[#1c1c1c] border border-[#333] rounded-lg text-xs text-white outline-none"
                      />
                    </div>

                    <label className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Kräv Lärarkontroll vid Stoppunkter
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Läraren måste godkänna dolda moment före fyllning
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={exerciseSettings.requireTeacherStopPointSignoff}
                        onChange={(e) =>
                          updateSetting(
                            'requireTeacherStopPointSignoff',
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 accent-orange-500"
                      />
                    </label>
                  </div>
                )}

                {/* TAB 4: RIKTMÅTT, TOLERANS & RITNINGAR */}
                {activeSettingsTab === 'MEASUREMENTS' && (
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Sida A / Längd (m)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={sideA || ''}
                          onChange={(e) =>
                            setSideA(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          placeholder="10.0"
                          className="w-full min-h-[38px] px-2.5 bg-[#121212] border border-[#333] rounded-lg text-xs text-white font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Sida B / Bredd (m)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={sideB || ''}
                          onChange={(e) =>
                            setSideB(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          placeholder="8.0"
                          className="w-full min-h-[38px] px-2.5 bg-[#121212] border border-[#333] rounded-lg text-xs text-white font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Fall (cm/meter)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={fallCmPerM || ''}
                          onChange={(e) =>
                            setFallCmPerM(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          placeholder="1.0"
                          className="w-full min-h-[38px] px-2.5 bg-[#121212] border border-[#333] rounded-lg text-xs text-white font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Max tolerans (±mm)
                        </label>
                        <input
                          type="number"
                          value={exerciseSettings.globalToleranceMm || ''}
                          onChange={(e) =>
                            updateSetting(
                              'globalToleranceMm',
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          placeholder="5"
                          className="w-full min-h-[38px] px-2.5 bg-[#121212] border border-[#333] rounded-lg text-xs text-emerald-300 font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Schaktdjup (cm)
                        </label>
                        <input
                          type="number"
                          value={exerciseSettings.targetDepthCm || ''}
                          onChange={(e) =>
                            updateSetting(
                              'targetDepthCm',
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          placeholder="35"
                          className="w-full min-h-[38px] px-2.5 bg-[#121212] border border-[#333] rounded-lg text-xs text-white font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Grus-/Makadamfraktion
                        </label>
                        <input
                          type="text"
                          value={exerciseSettings.materialFraction || ''}
                          onChange={(e) =>
                            updateSetting('materialFraction', e.target.value)
                          }
                          placeholder="8/16 mm"
                          className="w-full min-h-[38px] px-2.5 bg-[#121212] border border-[#333] rounded-lg text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    {sideA && sideB && (
                      <div className="text-xs font-mono text-emerald-400 font-bold">
                        ✓ Automatiskt uträknat kryssmått (diagonal):{' '}
                        {Math.sqrt(sideA * sideA + sideB * sideB).toFixed(2)} m
                      </div>
                    )}

                    {/* Links */}
                    <div className="pt-2 border-t border-[#262626] space-y-2">
                      <div className="text-xs font-bold text-slate-300">
                        Bifoga ritningslänkar, PDF eller instruktionsfilmer:
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newLinkTitle}
                          onChange={(e) => setNewLinkTitle(e.target.value)}
                          placeholder="Rubrik (t.ex. Ritning M30 Grundplan)"
                          className="flex-1 min-h-[36px] px-3 bg-[#121212] border border-[#333333] rounded-xl text-xs text-white outline-none"
                        />
                        <input
                          type="text"
                          value={newLinkUrl}
                          onChange={(e) => setNewLinkUrl(e.target.value)}
                          placeholder="Länk (https://...)"
                          className="flex-1 min-h-[36px] px-3 bg-[#121212] border border-[#333333] rounded-xl text-xs text-white font-mono outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddLink}
                          className="px-3.5 min-h-[36px] bg-[#222222] hover:bg-[#2c2c2c] text-orange-400 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          + Bifoga länk
                        </button>
                      </div>
                      {links.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {links.map((l) => (
                            <span
                              key={l.id}
                              className="px-2.5 py-1 rounded-lg bg-[#121212] border border-[#2e2e2e] flex items-center gap-1.5 text-xs text-slate-300"
                            >
                              <ExternalLink className="w-3 h-3 text-orange-400" />
                              <span>{l.title}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveLink(l.id)}
                                className="text-slate-500 hover:text-rose-400 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: FASER & MOMENT EDITOR */}
              <TeacherExerciseMomentEditor
                mode={mode}
                projectType={projectType}
                activeMoments={activeMoments}
                onChangeActiveMoments={setActiveMoments}
              />

              {/* Submit Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setMode('LIST')}
                  className="min-h-[46px] px-5 bg-[#222222] hover:bg-[#2c2c2c] text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Avbryt
                </button>

                <button
                  type="submit"
                  disabled={loading || activeMoments.length === 0}
                  className="min-h-[48px] px-6 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {loading
                      ? 'Sparar övning...'
                      : `Spara & Publicera övning (${activeMoments.length} moment)`}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={isPdfViewerOpen}
        onClose={() => setIsPdfViewerOpen(false)}
        pdfDoc={attachedPdfDoc}
        title={title || 'Bifogat PDF-underlag'}
      />
    </div>
  );
};
