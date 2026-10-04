export type ProjectType = 'HUSGRUND' | 'ALTAN_TRADACK' | 'PLATTSATTNING' | 'ENSKILT_AVLOPP';

export type MomentStatus = 'RED' | 'YELLOW' | 'GREEN';

export type WeatherType = 'SOL' | 'MOLN' | 'REGN' | 'FROST_SNO';

export interface MomentDefinition {
  id: string; // e.g. '1.1'
  projectType: ProjectType;
  order: number;
  phaseNumber: number;
  phaseName: string;
  title: string;
  amaCode: string;
  instruction: string;
  studentTip: string;
  proTip: string;
  criticalValidationHint?: string;
  defaultCategory?: string;
  inspectionItem?: string; // t.ex. "Höjd / Fall"
  method?: string;         // t.ex. "Laserinstrument"
  tolerance?: string;      // t.ex. "±5 mm"
  requirePhoto?: boolean;  // Specifikt fotokrav på detta moment
  minPhotos?: number;      // Minsta antal bilder för detta moment
  isStopPoint?: boolean;   // Stoppunkt: läraren ska kontrollera i fält innan nästa steg
  customChecklist?: string[]; // Egna kontrollpunkter skapade av läraren
}

export interface MomentPhoto {
  id: string;
  dataUrl: string; // base64 JPEG med inbränd vattenstämpel
  capturedAt: string; // YYYY-MM-DD HH:MM
  category: string; // 'Schakt' | 'VA' | 'Grund' | 'Kontrollbevis' | 'Avvikelser' | 'Försyn'
  caption?: string; // Bildtext
  weather?: string;
}

export interface MomentRecord {
  momentId: string;
  status: MomentStatus;
  comment: string;
  signature: string;
  signatureImage?: string;
  structuredChecks?: string[];
  photoBase64?: string;
  photos?: MomentPhoto[];
  completedAt?: string;
  completedTimestamp?: number;
  weather?: WeatherType;
  measuredValue?: string;
  teacherApproved?: boolean;
}

export interface PreInspectionStep {
  id: string;
  title: string;
  description: string;
  photoCategory: string;
  photoId?: string;
}

export interface QuickNote {
  id: string;
  text: string;
  category: 'ALLMÄNT' | 'MÅTT_HÖJD' | 'TELEFON' | 'LEVERANS';
  createdAt: string;
}

export interface ExerciseSettings {
  // Fotokrav & Dokumentation
  photoRequirementMode: 'ALL_MOMENTS' | 'MARKED_ONLY' | 'OPTIONAL';
  minPhotosPerMoment: number;
  requireWatermark: boolean;
  // Fält- & Signeringsregler
  strictSequentialPhases: boolean;
  preInspectionRule: 'MANDATORY' | 'OPTIONAL' | 'DISABLED';
  requireFingerSignature: boolean;
  requireWeatherLog: boolean;
  requireMeasurementInComment: boolean;
  // Hjälpmedel & Provläge
  examMode: boolean; // Om true: döljer tips och AI-hjälp (Examinations-/Provläge)
  allowAiHelper: boolean;
  showStudentTips: boolean;
  showProTips: boolean;
  allowCrossMeasureCalculator: boolean;
  allowGroupSync: boolean;
  // Bedömning & Toleranser
  gradingScale: 'PASS_FAIL' | 'GY25_F_TO_A' | 'FEEDBACK_ONLY';
  requireTeacherStopPointSignoff: boolean;
  estimatedDuration: string; // t.ex. "4 timmar", "2 dagar"
  globalToleranceMm?: number; // t.ex. 5 (±5 mm)
  targetDepthCm?: number;     // t.ex. 35 cm schaktdjup
  materialFraction?: string;  // t.ex. "Makadam 8/16 mm"
  customCategoryLabel?: string; // För övningar skapade helt från scratch
}

export interface Project {
  id: string;
  name: string;
  projectType: ProjectType;
  propertyDesignation: string; // t.ex. Granen 4:12
  clientName: string;          // Byggherre / Beställare
  contractorName: string;      // Totalentreprenör
  projectNumber?: string;      // Projektnummer (t.ex. 3313200-5001)
  applicableDocs?: string;     // Gällande handlingar (t.ex. Bygghandling M30, AMA Anläggning)
  createdAt: string;
  updatedAt: string;
  notes?: string;
  quickNotes?: QuickNote[];
  moments: Record<string, MomentRecord>;
  preInspectionCompleted?: boolean;
  preInspectionExempted?: boolean;
  preInspectionExemptReason?: string;
  preInspectionPhotos?: MomentPhoto[];
  // Fältmått & Beräknat Kryssmått (automatisk ifyllnad i moment)
  fieldMeasurements?: {
    sideA?: number; // Längd i meter (t.ex. 10.00)
    sideB?: number; // Bredd i meter (t.ex. 8.00)
    diagonal?: number; // Beräknad diagonal i meter (t.ex. 12.81)
    fallCmPerM?: number; // Fall i cm/meter
    customValues?: Record<string, string>;
  };
  // Versionshistorik & Revisionshantering
  revisions?: ProjectRevision[];
  // Papperskorg (Recycle bin)
  isDeleted?: boolean;
  deletedAt?: string;
  // Grupp- & Molnsynkning
  isGroupProject?: boolean;
  syncEnabled?: boolean;
  groupCode?: string;
  lastSyncedAt?: string;
  assignedTo?: string;
  // Ägarskap & Skapare
  creatorId?: string;
  creatorName?: string;
  creatorEmail?: string;
  creatorRole?: UserRole;
  // Elevtillhörighet & Fältöversikt (Endast för elevarbeten)
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  schoolClass?: string;
  studentGroup?: string;
  teacherFeedback?: {
    overallComment?: string;
    evaluatedAt?: string;
    evaluatedBy?: string;
    grade?: 'GODKÄND' | 'UNDERKÄND' | 'KOMPLETTERING_KRÄVS';
    momentNotes?: Record<string, string>;
    approvedMoments?: Record<string, boolean>;
  };
  // Lärarövning & Anpassade moment
  exerciseCode?: string;
  isTeacherExercise?: boolean;
  exerciseInstructions?: string;
  customMoments?: MomentDefinition[];
  externalLinks?: ExerciseLink[];
  attachedPdf?: AttachedPdfDoc;
  exerciseSettings?: ExerciseSettings;
}

export interface ProjectRevision {
  id: string;
  timestamp: number;
  createdAtFormatted: string;
  authorName: string;
  authorRole?: string;
  summary: string;
  momentsSnapshot: Record<string, MomentRecord>;
  notesSnapshot?: string;
  fieldMeasurementsSnapshot?: any;
}

export interface AppLicense {
  status: 'LICENSED' | 'TRIAL' | 'EXPIRED';
  licenseKey: string;
  schoolName: string;
  validUntil: string;
  maxSeats: number;
  allowTeacherAccountCreation: boolean;
  allowTeacherCreateTeacherAccounts?: boolean;
  requireLoginOnStartup?: boolean;
}

export interface ExerciseLink {
  id: string;
  title: string;
  url: string;
  category?: 'RITNING' | 'VIDEO' | 'AMA_REGEL' | 'ÖVRIGT';
}

export interface AttachedPdfDoc {
  name: string;
  sizeFormatted: string;
  dataUrl: string; // Base64 data URL
  uploadedAt: string;
  pageCount?: number;
}

export interface TeacherExercise {
  id: string;
  code: string; // t.ex. "FK-4019" eller "SCHAKT-1"
  title: string;
  description: string;
  projectType: ProjectType;
  creationSource?: 'TEMPLATE' | 'SCRATCH' | 'PDF_IMPORT';
  createdAt: string;
  updatedAt?: string;
  createdByTeacherName: string;
  createdByTeacherId: string;
  links: ExerciseLink[];
  attachedPdf?: AttachedPdfDoc;
  customMoments: MomentDefinition[]; // Alla anpassade moment för denna specifika övning
  instructions?: string;
  targetGroup?: string; // T.ex. "Alla grupper", "Byggprogrammet", "Anläggare", "Vuxenutbildning", "Gymnasie"
  educationLevel?: 'ALL' | 'GYMNASIE' | 'VUXEN' | 'LARLING';
  specialization?: 'ALL' | 'BYGGPROGRAMMET' | 'ANLAGGARE' | 'HUSBYGGNAD' | 'MARK_VA';
  difficulty?: 'GRUNDLÄGGANDE' | 'MEDEL' | 'AVANCERAD';
  requirePhotos?: boolean;
  phasesIncluded?: number[];
  fieldMeasurements?: {
    sideA?: number;
    sideB?: number;
    diagonal?: number;
    fallCmPerM?: number;
  };
  exerciseSettings?: ExerciseSettings;
}

export type PhotoSaveMode = 'APP_ONLY' | 'APP_AND_DOWNLOAD';
export type ReportLayoutStyle = 'AMA_STANDARD' | 'PHOTO_SUMMARY';
export type AppExperienceLevel = 'STUDENT_MAX' | 'STANDARD' | 'PRO_MINIMAL';
export type AppLayoutMode = 'SIMPLE_LIST' | 'COMPACT' | 'FIELD_CLEAR' | 'GUIDED_STEP';
export type AppColorPalette =
  | 'ORANGE_WORK'
  | 'SAFETY_YELLOW'
  | 'DAYLIGHT_HIGH_CONTRAST'
  | 'NORDIC_BLUE'
  | 'EMERALD_FOREST'
  | 'CUSTOM';
export type PreInspectionPreference = 'ALWAYS_ASK' | 'ALWAYS_DO' | 'SKIP_DEFAULT';
export type UserUsageProfile = 'PRIVATE' | 'CONTRACTOR' | 'SCHOOL';
export type AppContextMode = 'WORKPLACE' | 'APL' | 'SCHOOL';

export interface CustomColorTheme {
  id: string;
  name: string;
  accentHex: string;
  bgHex: string;
  cardHex: string;
  buttonTextHex: string;
  isLightMode?: boolean;
}

export interface UserSettings {
  userName: string;
  companyName: string;
  preferredProjectType?: ProjectType | 'ALL';
  easyFieldMode?: boolean;
  hasSeenWizard?: boolean;
  photoSaveMode?: PhotoSaveMode;
  enableTutorialGuide?: boolean;
  reportLayout?: ReportLayoutStyle;
  hasSeenTutorialPrompt?: boolean;
  // Verksamhetsläge: Arbetsplats/Entreprenad, APL/Lärling eller Skola
  appContextMode?: AppContextMode;
  // Nya utökade inställningar & funktionsväljare
  appExperienceLevel?: AppExperienceLevel;
  appLayoutMode?: AppLayoutMode;
  colorPalette?: AppColorPalette;
  activeCustomTheme?: CustomColorTheme;
  savedCustomThemes?: CustomColorTheme[];
  preInspectionPreference?: PreInspectionPreference;
  userUsageProfile?: UserUsageProfile;
  featureCrossMeasure?: boolean;
  featureFieldNotes?: boolean;
  featureAiHelper?: boolean;
  featurePreInspection?: boolean;
  featurePhotoWatermark?: boolean;
  saveToDeviceGallery?: boolean;       // "fråga om man vill spara en kopia i mobilens galleri"
  requirePhotoToComplete?: boolean;    // "gå vidare ifrån varje moment utan att behöva lägga in en bild"
  featureCloudSync?: boolean;
  featureTeacherAlerts?: boolean;
  customDeployUrl?: string;
  // GDPR & Skolintegritet
  gdprStrictSchoolMode?: boolean;
  gdprPhotoFaceBlurNotice?: boolean;
  gdprLocalStorageOnly?: boolean;
}

export type UserRole = 'STUDENT' | 'TEACHER' | 'SCHOOL_ADMIN' | 'ADMIN';

export type EducationLevelType = 'GYMNASIE' | 'VUXEN' | 'LARLING' | 'PERSONAL';
export type ProgramSpecializationType = 'BYGGPROGRAMMET' | 'ANLAGGARE' | 'HUSBYGGNAD' | 'MARK_VA' | 'ALLMAN';

export interface StudentGroupDefinition {
  id: string;
  name: string;
  category: 'BYGGPROGRAMMET' | 'ANLAGGARE' | 'VUXEN' | 'GYMNASIE' | 'CUSTOM';
  description?: string;
  createdAt?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  accountContext?: AppContextMode; // 'WORKPLACE' (Arbetsplats) | 'APL' (APL/Lärling) | 'SCHOOL' (Skola)
  password?: string;
  schoolOrCompany?: string;
  studentGroup?: string; // Grupp / Arbetslag
  schoolClass?: string;  // Klass / Projekt- eller Avdelningskod
  teacherId?: string;    // Ansvarig lärare / Arbetsledare / Handledare
  notes?: string;        // Notering på kontot
  educationLevel?: EducationLevelType;
  specialization?: ProgramSpecializationType;
  teacherNote?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface TeacherNotification {
  id: string;
  authorName: string;
  authorRole: 'TEACHER' | 'SCHOOL_ADMIN' | 'ADMIN';
  title: string;
  message: string;
  priority: 'NORMAL' | 'URGENT';
  createdAt: string;
  readBy?: string[];
}

export interface InviteCodeItem {
  code: string;
  createdBy: string;
  createdAt: string;
  roleToAssign?: UserRole;
  accountContext?: AppContextMode;
  companyOrSchool?: string;
  consumed: boolean;
  consumedBy?: string;
  consumedAt?: string;
  notes?: string;
}

export interface WhitelistItem {
  id: string;
  pattern: string; // e.g. "elev@skola.se" or "@skola.se"
  type: 'EXACT_EMAIL' | 'DOMAIN';
  addedBy: string;
  addedAt: string;
  description?: string;
}

export interface RegistrationSecuritySettings {
  requireInviteCodeOrWhitelist: boolean;
  allowWhitelistedDomainAutoRegistration: boolean;
}

export type ViewState =
  | 'DASHBOARD'
  | 'CREATE_PROJECT'
  | 'CHECKLIST'
  | 'ACCOUNTS'
  | 'APK_EXPORT'
  | 'FIELD_MONITOR';

