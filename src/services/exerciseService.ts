import { TeacherExercise, Project, MomentRecord, ExerciseSettings } from '../types';
import { ALL_MOMENTS } from '../data/momentsData';
import { getFormattedCurrentTime } from '../db/indexedDb';
import { safeFetchJson } from './apiHelper';
import {
  saveExerciseToCloud,
  fetchAllExercisesFromCloud,
  deleteExerciseFromCloud,
} from './userService';

const LOCAL_EXERCISES_KEY = 'faltkoll_custom_exercises';
const LOCAL_ADMIN_SETTINGS_KEY = 'faltkoll_admin_settings';

export interface AdminSettingsConfig {
  allowTeacherCreateTeacherAccounts: boolean;
  schoolName: string;
}

export const DEFAULT_EXERCISE_SETTINGS: ExerciseSettings = {
  photoRequirementMode: 'MARKED_ONLY',
  minPhotosPerMoment: 1,
  requireWatermark: true,
  strictSequentialPhases: false,
  preInspectionRule: 'OPTIONAL',
  requireFingerSignature: true,
  requireWeatherLog: false,
  requireMeasurementInComment: false,
  examMode: false,
  allowAiHelper: true,
  showStudentTips: true,
  showProTips: true,
  allowCrossMeasureCalculator: true,
  allowGroupSync: true,
  gradingScale: 'PASS_FAIL',
  requireTeacherStopPointSignoff: false,
  estimatedDuration: '4 timmar',
  globalToleranceMm: 5,
  targetDepthCm: 35,
  materialFraction: 'Makadam 8/16 mm',
};

// Default pre-packaged exercise templates
export const DEFAULT_EXERCISES: TeacherExercise[] = [
  {
    id: 'ex_grund_standard_1',
    code: 'GRUND-1',
    title: 'Övning: Platta på mark - Schakt & Makadam',
    description:
      'Praktisk övning i anläggningshallen. Mät kryssmått och laseravväg makadambädd med max ±5 mm tolerans.',
    projectType: 'HUSGRUND',
    creationSource: 'TEMPLATE',
    targetGroup: 'Byggprogrammet',
    educationLevel: 'GYMNASIE',
    specialization: 'BYGGPROGRAMMET',
    difficulty: 'MEDEL',
    createdAt: '2026-09-20 08:30',
    createdByTeacherName: 'Yrkeslärare Mark & Betong',
    createdByTeacherId: 'usr_larare_1',
    instructions:
      '1. Kontrollera ledningsanvisning\n2. Mät ut profiler och beräkna diagonal\n3. Schakta och jämna av schaktbotten\n4. Lägg fiberduk och makadambädd',
    links: [
      {
        id: 'link_yt_1',
        title: 'Instruktionsfilm: Utsättning av profiler',
        url: 'https://www.youtube.com',
        category: 'VIDEO',
      },
      {
        id: 'link_ama_1',
        title: 'AMA Anläggning tabell för toleranser (PDF)',
        url: 'https://svenskbyggtjanst.se',
        category: 'AMA_REGEL',
      },
    ],
    customMoments: ALL_MOMENTS.filter((m) => m.projectType === 'HUSGRUND').slice(0, 8),
    fieldMeasurements: {
      sideA: 10.0,
      sideB: 8.0,
      diagonal: 12.81,
      fallCmPerM: 1.0,
    },
    exerciseSettings: {
      ...DEFAULT_EXERCISE_SETTINGS,
      globalToleranceMm: 5,
      targetDepthCm: 40,
      materialFraction: 'Makadam 8/16 mm',
    },
  },
  {
    id: 'ex_sten_standard_1',
    code: 'PLATTA-2',
    title: 'Övning: Marksten & Plattsättning Garageinfart',
    description:
      'Övning i sättsand, fall 2 cm/meter och fogning enligt AMA Anläggning.',
    projectType: 'PLATTSATTNING',
    creationSource: 'TEMPLATE',
    targetGroup: 'Anläggare',
    educationLevel: 'ALL',
    specialization: 'ANLAGGARE',
    difficulty: 'MEDEL',
    createdAt: '2026-09-22 09:00',
    createdByTeacherName: 'Yrkeslärare Mark & Betong',
    createdByTeacherId: 'usr_larare_1',
    instructions:
      'Säkerställ att bärlagret är väl paddat. Dra av sättsanden med rätskiva och kontrollera fall bort från sockel.',
    links: [
      {
        id: 'link_sten_1',
        title: 'Monteringsanvisning marksten & kantstöd',
        url: 'https://www.benders.se',
        category: 'RITNING',
      },
    ],
    customMoments: ALL_MOMENTS.filter((m) => m.projectType === 'PLATTSATTNING'),
    fieldMeasurements: {
      sideA: 6.0,
      sideB: 4.0,
      diagonal: 7.21,
      fallCmPerM: 2.0,
    },
    exerciseSettings: {
      ...DEFAULT_EXERCISE_SETTINGS,
      globalToleranceMm: 3,
      targetDepthCm: 25,
      materialFraction: 'Stenmjöl 0/4 mm & Bärlager 0/32',
    },
  },
];

export const getLocalExercises = (): TeacherExercise[] => {
  try {
    const raw = localStorage.getItem(LOCAL_EXERCISES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_EXERCISES;
};

export const saveLocalExercises = (list: TeacherExercise[]): void => {
  try {
    localStorage.setItem(LOCAL_EXERCISES_KEY, JSON.stringify(list));
  } catch {}
};

// Fetch all exercises from server & Cloud Firestore (with offline fallback)
export const fetchTeacherExercises = async (): Promise<TeacherExercise[]> => {
  let serverExercises: TeacherExercise[] = [];
  try {
    const res = await safeFetchJson<{ exercises: TeacherExercise[] }>('/api/exercises');
    if (res.ok && Array.isArray(res.data?.exercises)) {
      serverExercises = res.data.exercises;
    }
  } catch {}

  // Fetch from Google Cloud Firestore directly
  let cloudExercises: TeacherExercise[] = [];
  try {
    cloudExercises = await fetchAllExercisesFromCloud();
  } catch {}

  const localExercises = getLocalExercises();

  // Combine and de-duplicate by ID and Code
  const seen = new Set<string>();
  const combined: TeacherExercise[] = [];

  for (const ex of [
    ...cloudExercises,
    ...serverExercises,
    ...localExercises,
    ...DEFAULT_EXERCISES,
  ]) {
    const key = (ex.id || ex.code || '').trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      combined.push(ex);
    }
  }

  saveLocalExercises(combined);
  return combined;
};

// Lookup exercise by code
export const fetchExerciseByCode = async (code: string): Promise<TeacherExercise | null> => {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    const res = await safeFetchJson<{ exercise: TeacherExercise }>(
      `/api/exercises/${encodeURIComponent(cleanCode)}`
    );
    if (res.ok && res.data?.exercise) {
      return res.data.exercise;
    }
  } catch {}

  // Fallback to local storage or Cloud
  const localList = await fetchTeacherExercises();
  const match = localList.find((e) => e.code.trim().toUpperCase() === cleanCode);
  return match || null;
};

// Save exercise (create or update)
export const saveTeacherExercise = async (
  exercise: TeacherExercise
): Promise<TeacherExercise> => {
  let saved = exercise;
  try {
    const res = await safeFetchJson<{ exercise: TeacherExercise }>('/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exercise),
    });
    if (res.ok && res.data?.exercise) {
      saved = res.data.exercise;
    }
  } catch {}

  // Save directly to Google Cloud Firestore
  try {
    await saveExerciseToCloud(saved);
  } catch (err) {
    console.warn('Could not save exercise to Firestore:', err);
  }

  // Update local storage
  const current = getLocalExercises();
  const idx = current.findIndex((e) => e.id === saved.id || e.code === saved.code);
  let updatedList: TeacherExercise[];
  if (idx >= 0) {
    updatedList = [...current];
    updatedList[idx] = saved;
  } else {
    updatedList = [saved, ...current];
  }
  saveLocalExercises(updatedList);
  return saved;
};

// Delete exercise
export const deleteTeacherExercise = async (id: string, code?: string): Promise<boolean> => {
  try {
    await safeFetchJson(`/api/exercises/${id}`, { method: 'DELETE' });
  } catch {}

  // Delete from Google Cloud Firestore
  try {
    await deleteExerciseFromCloud(id, code);
  } catch {}

  const current = getLocalExercises();
  const updated = current.filter((e) => e.id !== id && e.code !== id);
  saveLocalExercises(updated);
  return true;
};

// Admin Settings
export const fetchAdminSettings = async (): Promise<AdminSettingsConfig> => {
  try {
    const res = await safeFetchJson<{ settings: AdminSettingsConfig }>('/api/admin/settings');
    if (res.ok && res.data?.settings) {
      localStorage.setItem(LOCAL_ADMIN_SETTINGS_KEY, JSON.stringify(res.data.settings));
      return res.data.settings;
    }
  } catch {}

  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return {
    allowTeacherCreateTeacherAccounts: false,
    schoolName: 'Bygg- & Anläggningsutbildning',
  };
};

export const saveAdminSettings = async (
  settings: Partial<AdminSettingsConfig>
): Promise<AdminSettingsConfig> => {
  try {
    const res = await safeFetchJson<{ settings: AdminSettingsConfig }>('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok && res.data?.settings) {
      localStorage.setItem(LOCAL_ADMIN_SETTINGS_KEY, JSON.stringify(res.data.settings));
      return res.data.settings;
    }
  } catch {}

  const current = await fetchAdminSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(LOCAL_ADMIN_SETTINGS_KEY, JSON.stringify(updated));
  return updated;
};

// Clone a teacher exercise into an active student project
export const convertExerciseToProject = (
  exercise: TeacherExercise,
  studentName: string
): Project => {
  const initialMoments: Record<string, MomentRecord> = {};
  const momentsToUse =
    exercise.customMoments && exercise.customMoments.length > 0
      ? exercise.customMoments
      : ALL_MOMENTS.filter((m) => m.projectType === exercise.projectType);

  momentsToUse.forEach((m) => {
    initialMoments[m.id] = {
      momentId: m.id,
      status: 'RED',
      comment: '',
      signature: '',
      photos: [],
      structuredChecks: [],
    };
  });

  const now = getFormattedCurrentTime();
  const settings = exercise.exerciseSettings || DEFAULT_EXERCISE_SETTINGS;
  const preInspectDone = settings.preInspectionRule === 'DISABLED' || settings.preInspectionRule === 'OPTIONAL';

  return {
    id: 'proj_ex_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: exercise.title,
    projectType: exercise.projectType,
    propertyDesignation: `Övningskod: ${exercise.code}${exercise.targetGroup ? ' • ' + exercise.targetGroup : ''}`,
    clientName: exercise.createdByTeacherName || 'Yrkeslärare',
    contractorName: studentName || 'Elev / Lärling',
    projectNumber: exercise.code,
    applicableDocs: 'AMA Anläggning 20 / Lärarens instruktioner',
    createdAt: now,
    updatedAt: now,
    notes: exercise.description || exercise.instructions || '',
    moments: initialMoments,
    exerciseCode: exercise.code,
    isTeacherExercise: true,
    exerciseInstructions: exercise.instructions,
    customMoments: exercise.customMoments,
    externalLinks: exercise.links,
    attachedPdf: exercise.attachedPdf,
    fieldMeasurements: exercise.fieldMeasurements,
    exerciseSettings: settings,
    preInspectionCompleted: preInspectDone,
    preInspectionExempted: settings.preInspectionRule === 'DISABLED',
    preInspectionExemptReason:
      settings.preInspectionRule === 'DISABLED'
        ? 'Försyn avstängd av läraren för denna övning'
        : undefined,
    preInspectionPhotos: [],
  };
};

export interface PdfImportResponse {
  ok: boolean;
  exerciseDraft: Partial<TeacherExercise>;
  attachedPdf?: {
    name: string;
    sizeFormatted: string;
    dataUrl: string;
    uploadedAt: string;
  };
  error?: string;
  source?: string;
}

export interface FormsImportResponse {
  ok: boolean;
  exerciseDraft: Partial<TeacherExercise>;
  error?: string;
  source?: string;
}

export interface ExerciseImportOptions {
  targetGroup?: string;
  specialization?: string;
  difficulty?: string;
  textContent?: string;
  fileType?: 'PDF' | 'TXT' | 'PASTE' | 'FORMS';
  strictMode?: boolean;
}

export const importExerciseFromPdf = async (
  pdfBase64: string,
  fileName: string,
  fileSize: number,
  options?: ExerciseImportOptions
): Promise<PdfImportResponse> => {
  try {
    const res = await safeFetchJson<PdfImportResponse>('/api/exercises/import-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64,
        fileName,
        fileSize,
        textContent: options?.textContent,
        fileType: options?.fileType,
        strictMode: options?.strictMode ?? true,
        ...options,
      }),
    });

    if (res.ok && res.data) {
      return res.data;
    }
    return {
      ok: false,
      exerciseDraft: {},
      error: res.error || 'Kunde inte importera eller tolka underlaget.',
    };
  } catch (err: any) {
    return {
      ok: false,
      exerciseDraft: {},
      error: err?.message || 'Ett nätverksfel uppstod vid uppladdning av underlag.',
    };
  }
};

export const importExerciseFromForms = async (
  formsContent: string,
  fileName: string,
  fileFormat: string,
  options?: {
    targetGroup?: string;
    specialization?: string;
    difficulty?: string;
  }
): Promise<FormsImportResponse> => {
  try {
    const res = await safeFetchJson<FormsImportResponse>('/api/exercises/import-forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formsContent,
        fileName,
        fileFormat,
        ...options,
      }),
    });

    if (res.ok && res.data) {
      return res.data;
    }
    return {
      ok: false,
      exerciseDraft: {},
      error: res.error || 'Kunde inte tolka eller importera formulärdata.',
    };
  } catch (err: any) {
    return {
      ok: false,
      exerciseDraft: {},
      error: err?.message || 'Ett nätverksfel uppstod vid import av formulär.',
    };
  }
};

export interface SampleDocItem {
  id: string;
  title: string;
  type: 'FORMS_CSV' | 'FORMS_TEXT' | 'FORMS_JSON' | 'PDF_MOCK';
  fileName: string;
  description: string;
  content: string;
}

export const SAMPLE_FORMS_DOCUMENTS: SampleDocItem[] = [
  {
    id: 'sample_forms_csv',
    title: 'Google Forms / CSV: Egenkontroll Husgrund & Schakt',
    type: 'FORMS_CSV',
    fileName: 'Google_Forms_Egenkontroll_Husgrund.csv',
    description: 'Typiskt exporterat Google Forms-kalkylark med frågor, delmoment och AMA-toleranser.',
    content: `Tidsstämpel;Moment;Kontrollfråga;AMA-kod;Krav och tolerans;Stoppunkt
1;Utsättning;Utsättning av grundprofiler och kryssmått med stålband;BBC.31;Kryssmått max ±5 mm;Nej
2;Schaktbotten;Borttagning av all matjord ner till bärkraftig moränbotten;CBB.1;Fast botten utan vattenfickor eller tjäle;Ja
3;Fiberduk & Makadam;Geotextil N2 med 50 cm överlapp samt makadam 8/16 mm;DCB.1;Bädd laseravvägd i 8 kontrollpunkter;Nej
4;Bottenavlopp & VA;Spillvattenrör 110 mm förlagda med jämnt fall;PBB.1;Fall minst 10-20 promille (1-2 cm/m);Ja
5;Armering & Form;Kantelement i våg samt armering och distansklossar;GBD.1;Täckskikt betong 30 mm min;Ja`,
  },
  {
    id: 'sample_forms_text',
    title: 'Google Forms / Frågetext: Trädäck & Altan 35 kvm',
    type: 'FORMS_TEXT',
    fileName: 'Google_Forms_Trädäck_Frågebatteri.txt',
    description: 'Kopierade frågor och svarsalternativ direkt ur ett Google Forms-prov.',
    content: `Google Forms: Egenkontroll och Arbetsberedning - Altan & Trädäck 35 kvm

Avsnitt 1: Förberedelser och Utsättning
Fråga 1: Har utsättning skett med profiler och linor i 90 graders vinkel?
- Ja, kryssmått har kontrollerats med stålbandmått och stämmer
- Profilställningar är snedsträvade och förankrade i marken
- Höjdfixpunkt är inmätt med rotationslaser

Fråga 2: Är betongplintarna gjutna på frostfritt djup med justerbara stolpskor?
- Schaktdjup är minst 80 cm (frostfritt djup)
- Stolpskor är justerade i lod och våg
[Stoppunkt: Läraren ska kontrollera stolpskor före återfyllning!]

Avsnitt 2: Bärlinor och Bjälklag
Fråga 3: Vilken dimension och c/c-avstånd har använts för bärlina och golvbjälkar?
- Bärlina 45x170 mm monterad i våg med laser
- Golvbjälkar c/c 600 mm monterade med balkskor och ankarspik
- Träskyddsklass NTR/A för markkontakt och NTR/AB för trall

Avsnitt 3: Trall och Infästning
Fråga 4: Hur har trallvirket monterats och skruvats?
- Trall 28x120 mm monterad med kärnsidan (glada sidan) uppåt
- Avstånd mellan brädor 3-5 mm med distanskloss/trallman
- Rostfri trallskruv A2 eller C4 dragen jäms med ytan utan att spräcka träet`,
  },
  {
    id: 'sample_forms_json',
    title: 'Besiktningsformulär (JSON): Plattsättning & Marksten',
    type: 'FORMS_JSON',
    fileName: 'Forms_Plattsättning_Egenkontroll.json',
    description: 'JSON-strukturerat besiktningsformulär med krav, fall och underbyggnad.',
    content: JSON.stringify(
      {
        formTitle: "Besiktningsformulär: Marksten & Plattsättning",
        category: "PLATTSATTNING",
        sections: [
          {
            phase: "Fas 1: Bärlager & Fall",
            question: "Bärlager 0/32 mm komprimerat och avvägt",
            checklist: [
              "Bärlager packat med 450 kg vibratorplatta (minst 6 överfarter)",
              "Fall på bärlagret 20 mm/m bort från byggnad verifierat med laser",
              "Höjdkontroll före sättsand"
            ],
            isStopPoint: true
          },
          {
            phase: "Fas 2: Sättsand & Stenläggning",
            question: "Sättsand 0/4 mm avdragen med rätskiva och sten monterad",
            checklist: [
              "Sättsand tjocklek jämn 30 mm",
              "Kantstöd i betong stadigt monterat med bakstöd",
              "Fogbredd 2-3 mm hålls konstant över hela ytan"
            ],
            isStopPoint: false
          },
          {
            phase: "Fas 3: Fogning & Vibrering",
            question: "Fogsand och slutkontroll",
            checklist: [
              "Hård ogräshämmande fogsand borstad i alla fogar",
              "Ytan avsopad före avvibrering med gummiklädd platta",
              "Fotobevis på färdig yta med rätskiva för toleranskontroll (±3 mm)"
            ],
            isStopPoint: false
          }
        ]
      },
      null,
      2
    ),
  },
];
