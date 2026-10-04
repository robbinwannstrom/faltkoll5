import { AppContextMode, UserAccount, UserRole, UserSettings } from '../types';

export interface ContextVocabulary {
  mode: AppContextMode;
  modeTitle: string;
  modeSubtitle: string;
  modeBadge: string;
  // Projects / Exercises
  projectsHeading: string;
  projectsSubtitle: string;
  createProjectHeading: string;
  createProjectSubtitle: string;
  exerciseTabLabel: string;
  standardTemplateTabLabel: string;
  exerciseCodePrompt: string;
  createButtonLabel: string;
  newProjectButton: string;
  createProjectButton: string;
  openProjectButton: string;
  emptyProjectsTitle: string;
  emptyProjectsSubtitle: string;
  createFirstProjectButton: string;
  projectSingular: string;
  projectPlural: string;
  projectNoun: string;
  projectNounDefinite: string;
  projectNounSingular: string;
  projectNounPlural: string;
  activeProjectSubtitle: string;
  // Creator / Templates
  creatorButtonShort: string;
  creatorButtonLong: string;
  creatorModalTitle: string;
  creatorModalSubtitle: string;
  creatorPanelTitle: string;
  creatorPanelSubtitle: string;
  codeLabel: string;
  // Roles (Rank 1 - 4)
  rank1Short: string;
  rank1Full: string;
  rank2Short: string;
  rank2Full: string;
  rank3Short: string;
  rank3Full: string;
  rank4Short: string;
  rank4Full: string;
  roleStudent: string;
  roleStudentShort: string;
  roleTeacher: string;
  roleTeacherShort: string;
  roleSchoolAdmin: string;
  roleSchoolAdminShort: string;
  roleAdmin: string;
  roleAdminShort: string;
  // Groups & Organization
  orgLabel: string;
  groupLabel: string;
  groupPlural: string;
  groupLabelPlural: string;
  classLabel: string;
  classOrTeamCodeLabel: string;
  accountsButtonLabel: string;
  accountsHeaderButton: string;
  accountsViewTitle: string;
  accountsViewSubtitle: string;
  myAccountButtonLabel: string;
  myAccountButton: string;
  noticesTitle: string;
  // Checklist & Instructions
  instructionBoxTitle: string;
  instructionHeading: string;
  proTipTitle: string;
  proTipHeading: string;
  customChecklistHeading: string;
  commentLabel: string;
  commentPlaceholder: string;
  progressText: string;
  progressLabel: string;
  phasesTitle: string;
  phasesLabel: string;
  defaultGroups: string[];
  showSchoolGrading: boolean;
  hideSchoolFeatures: boolean;
}

export const WORKPLACE_GROUPS = [
  'Mark & Schaktlag',
  'VA & Rörläggning',
  'Betong & Husgrund',
  'Plattsättning & Marksten',
  'Maskinförare & Gräv',
  'Trä & Byggservice',
  'Underentreprenör (UE)',
];

export const APL_GROUPS = [
  'APL - Mark & Anläggning',
  'APL - Husbyggnad & Trä',
  'Lärling (ETB / Yrkesbevis)',
  'Mark & Schaktlag',
  'Betong & Grundlag',
];

export const SCHOOL_GROUPS = [
  'Byggprogrammet (BA)',
  'Anläggare (Mark & Anläggning)',
  'Vuxenutbildning (Yrkesvux)',
  'Gymnasium (Åk 1–3)',
  'Gymnasium Åk 1 (BA1)',
  'Gymnasium Åk 2 (BA2)',
  'Gymnasium Åk 3 (BA3)',
  'Lärling / APL',
];

export function getDefaultGroupsForContext(mode: AppContextMode): string[] {
  if (mode === 'WORKPLACE') return WORKPLACE_GROUPS;
  if (mode === 'APL') return APL_GROUPS;
  return SCHOOL_GROUPS;
}

export type AccountCategoryType = 'ELEV' | 'ARBETE' | 'APL';

export interface DetectedAccountInfo {
  mode: AppContextMode;
  category: AccountCategoryType;
  label: 'Elevkonto' | 'Arbetskonto' | 'APL-konto';
  sublabel: string;
  badgeTone: 'emerald' | 'amber' | 'sky';
  confidence: 'EXACT' | 'HIGH' | 'INFERRED';
  matchedRule: string;
}

export function detectAccountContext(
  identifierOrUser?: string | UserAccount | null,
  knownUsers?: UserAccount[]
): DetectedAccountInfo {
  if (!identifierOrUser) {
    return {
      mode: 'WORKPLACE',
      category: 'ARBETE',
      label: 'Arbetskonto',
      sublabel: 'Arbetsplats & Entreprenad',
      badgeTone: 'amber',
      confidence: 'INFERRED',
      matchedRule: 'Standardläge',
    };
  }

  // 1. If an actual UserAccount object was passed
  if (typeof identifierOrUser === 'object') {
    const user = identifierOrUser;
    if (user.accountContext === 'SCHOOL') {
      return {
        mode: 'SCHOOL',
        category: 'ELEV',
        label: 'Elevkonto',
        sublabel: 'Skola & Utbildning',
        badgeTone: 'emerald',
        confidence: 'EXACT',
        matchedRule: 'Konfigurerat elevkonto',
      };
    }
    if (user.accountContext === 'APL') {
      return {
        mode: 'APL',
        category: 'APL',
        label: 'APL-konto',
        sublabel: 'APL & Yrkeshandledning',
        badgeTone: 'sky',
        confidence: 'EXACT',
        matchedRule: 'Konfigurerat APL-konto',
      };
    }
    if (user.accountContext === 'WORKPLACE') {
      return {
        mode: 'WORKPLACE',
        category: 'ARBETE',
        label: 'Arbetskonto',
        sublabel: 'Arbetsplats & Entreprenad',
        badgeTone: 'amber',
        confidence: 'EXACT',
        matchedRule: 'Konfigurerat arbetskonto',
      };
    }
  }

  // 2. Extract string identifier & check known users list if available
  const raw =
    typeof identifierOrUser === 'string'
      ? identifierOrUser
      : identifierOrUser.email || identifierOrUser.displayName || '';
  const norm = raw.trim().toLowerCase();

  if (knownUsers && knownUsers.length > 0) {
    const match = knownUsers.find(
      (u) =>
        u.email.toLowerCase() === norm ||
        u.displayName.toLowerCase() === norm ||
        u.id === norm
    );
    if (match) {
      return detectAccountContext(match);
    }
  }

  // 3. Known direct aliases
  if (
    norm === 'elev' ||
    norm.startsWith('elev') ||
    norm === 'student' ||
    norm === 'angfar' ||
    norm.includes('angfar') ||
    norm === 'larare' ||
    norm.startsWith('larare') ||
    norm === 'skoladmin' ||
    norm === 'rektor'
  ) {
    return {
      mode: 'SCHOOL',
      category: 'ELEV',
      label: 'Elevkonto',
      sublabel: 'Skola & Utbildning',
      badgeTone: 'emerald',
      confidence: 'HIGH',
      matchedRule: `Identifierat konto: "${raw}"`,
    };
  }

  if (
    norm === 'apl' ||
    norm.includes('handledare') ||
    norm.includes('larling') ||
    norm.includes('lärling') ||
    norm.includes('etb')
  ) {
    return {
      mode: 'APL',
      category: 'APL',
      label: 'APL-konto',
      sublabel: 'APL & Yrkeshandledning',
      badgeTone: 'sky',
      confidence: 'HIGH',
      matchedRule: `Identifierat APL-konto: "${raw}"`,
    };
  }

  if (
    norm.includes('entreprenad') ||
    norm.includes('arbetsledare') ||
    norm.includes('platschef') ||
    norm.includes('montor') ||
    norm.includes('montör') ||
    norm.includes('anlaggare') ||
    norm.includes('anläggare') ||
    norm.includes('foretag') ||
    norm.includes('företag')
  ) {
    return {
      mode: 'WORKPLACE',
      category: 'ARBETE',
      label: 'Arbetskonto',
      sublabel: 'Arbetsplats & Entreprenad',
      badgeTone: 'amber',
      confidence: 'HIGH',
      matchedRule: `Identifierat arbetskonto: "${raw}"`,
    };
  }

  // 4. Inspect fields if object
  if (typeof identifierOrUser === 'object') {
    const u = identifierOrUser;
    const org = (u.schoolOrCompany || '').toLowerCase();
    const grp = (u.studentGroup || '').toLowerCase();
    const cls = (u.schoolClass || '').toLowerCase();
    const email = (u.email || '').toLowerCase();

    // Check APL indicators
    if (
      org.includes('apl') ||
      grp.includes('apl') ||
      grp.includes('lärling') ||
      grp.includes('larling') ||
      cls.includes('apl') ||
      email.includes('@apl.') ||
      email.includes('handledare')
    ) {
      return {
        mode: 'APL',
        category: 'APL',
        label: 'APL-konto',
        sublabel: 'APL & Yrkeshandledning',
        badgeTone: 'sky',
        confidence: 'HIGH',
        matchedRule: 'APL-tillhörighet upptäckt',
      };
    }

    // Check School indicators
    if (
      email.includes('@skola.') ||
      email.includes('@edu.') ||
      email.includes('@skolan.') ||
      org.includes('skola') ||
      org.includes('utbildning') ||
      org.includes('gymnasi') ||
      org.includes('programmet') ||
      org.includes('yrkesakademin') ||
      grp.includes('byggprogrammet') ||
      grp.includes('gymnasi') ||
      grp.includes('vuxen') ||
      cls.toLowerCase().includes('ba') ||
      cls.toLowerCase().includes('vux') ||
      u.role === 'STUDENT'
    ) {
      return {
        mode: 'SCHOOL',
        category: 'ELEV',
        label: 'Elevkonto',
        sublabel: 'Skola & Utbildning',
        badgeTone: 'emerald',
        confidence: u.role === 'STUDENT' ? 'HIGH' : 'INFERRED',
        matchedRule: 'Skoltillhörighet upptäckt',
      };
    }

    // Check Workplace indicators
    if (
      email.includes('@entreprenad.') ||
      email.includes('@bygg.') ||
      org.includes('entreprenad') ||
      org.includes(' ab') ||
      org.includes('aktiebolag') ||
      grp.includes('arbetslag') ||
      grp.includes('schaktlag') ||
      grp.includes('maskin')
    ) {
      return {
        mode: 'WORKPLACE',
        category: 'ARBETE',
        label: 'Arbetskonto',
        sublabel: 'Arbetsplats & Entreprenad',
        badgeTone: 'amber',
        confidence: 'HIGH',
        matchedRule: 'Företags- & entreprenadtillhörighet upptäckt',
      };
    }
  }

  // 5. String-based domain or keyword heuristics
  if (
    norm.includes('@skola.') ||
    norm.includes('@edu.') ||
    norm.includes('@skolan.') ||
    norm.includes('elev') ||
    norm.includes('skola') ||
    norm.includes('gymnasi')
  ) {
    return {
      mode: 'SCHOOL',
      category: 'ELEV',
      label: 'Elevkonto',
      sublabel: 'Skola & Utbildning',
      badgeTone: 'emerald',
      confidence: 'HIGH',
      matchedRule: 'Skoladress / elevadress',
    };
  }

  if (
    norm.includes('@apl.') ||
    norm.includes('apl') ||
    norm.includes('lärling') ||
    norm.includes('larling')
  ) {
    return {
      mode: 'APL',
      category: 'APL',
      label: 'APL-konto',
      sublabel: 'APL & Yrkeshandledning',
      badgeTone: 'sky',
      confidence: 'HIGH',
      matchedRule: 'APL-adress / sökord',
    };
  }

  return {
    mode: 'WORKPLACE',
    category: 'ARBETE',
    label: 'Arbetskonto',
    sublabel: 'Arbetsplats & Entreprenad',
    badgeTone: 'amber',
    confidence: 'INFERRED',
    matchedRule: 'Yrkes- & entreprenadstandard',
  };
}

export function inferAccountContextMode(
  user?: UserAccount | null,
  fallbackMode: AppContextMode = 'WORKPLACE'
): AppContextMode {
  if (!user) return fallbackMode;
  const detected = detectAccountContext(user);
  return detected.mode;
}

export function resolveAppContextMode(
  userSettings?: UserSettings | null,
  currentUser?: UserAccount | null
): AppContextMode {
  // When a user is logged in, the account's own context strictly governs the app mode
  if (currentUser) {
    return inferAccountContextMode(currentUser, userSettings?.appContextMode || 'WORKPLACE');
  }
  if (userSettings?.appContextMode) {
    return userSettings.appContextMode;
  }
  if (userSettings?.userUsageProfile === 'SCHOOL') {
    return 'SCHOOL';
  }
  return 'WORKPLACE';
}

export function getContextVocabulary(mode: AppContextMode): ContextVocabulary {
  if (mode === 'WORKPLACE') {
    return {
      mode: 'WORKPLACE',
      modeTitle: 'Arbetsplats & Entreprenad',
      modeSubtitle: 'Yrkesbruk · Egenkontroll & AMA',
      modeBadge: 'Arbetsplats & Entreprenad',
      projectsHeading: 'Mina Projekt',
      projectsSubtitle: 'Välj ett entreprenadprojekt för att utföra egenkontroll, fotodokumentera och signera.',
      createProjectHeading: 'Starta nytt entreprenadprojekt',
      createProjectSubtitle: 'Välj en mall från platschef/KMA eller starta ett AMA-standardprojekt (Husgrund, Plattsättning eller VA).',
      exerciseTabLabel: 'Mall / Arbetsorder från platschef',
      standardTemplateTabLabel: 'AMA Standardprojekt (Husgrund / Mark / VA)',
      exerciseCodePrompt: 'Har du fått en projekt- eller mallkod från platschefen?',
      createButtonLabel: 'Starta Entreprenadprojekt',
      newProjectButton: 'Nytt projekt',
      createProjectButton: 'Nytt projekt',
      openProjectButton: 'Öppna projekt & egenkontroll',
      emptyProjectsTitle: 'Inga entreprenadprojekt skapade än',
      emptyProjectsSubtitle: 'Starta ett nytt projekt för Husgrund, Plattsättning eller VA/Avlopp för att påbörja egenkontrollen.',
      createFirstProjectButton: 'Skapa första projektet',
      projectSingular: 'projekt',
      projectPlural: 'projekt',
      projectNoun: 'projekt',
      projectNounDefinite: 'projektet',
      projectNounSingular: 'projekt',
      projectNounPlural: 'projekt',
      activeProjectSubtitle: 'Aktiv entreprenad',
      creatorButtonShort: 'Mallbyggare',
      creatorButtonLong: 'Projektmallar & KMA-byggare',
      creatorModalTitle: 'KMA- & Projektmallsbyggare',
      creatorModalSubtitle: 'Skapa skräddarsydda kontrollplaner och projektmallar från AMA eller från grunden.',
      creatorPanelTitle: 'Mallbyggare (KMA)',
      creatorPanelSubtitle: 'Skapa skräddarsydda kontrollplaner och projektmallar från AMA eller från grunden.',
      codeLabel: 'Projekt-/Mallkod',
      rank1Short: 'Anläggare',
      rank1Full: 'Rank 1 · Anläggare / Montör',
      rank2Short: 'Arbetsledare',
      rank2Full: 'Rank 2 · Arbetsledare / Lagbas',
      rank3Short: 'Platschef',
      rank3Full: 'Rank 3 · Platschef / KMA',
      rank4Short: 'Admin',
      rank4Full: 'Rank 4 · Företagsadmin',
      roleStudent: 'Anläggare / Montör',
      roleStudentShort: 'Anläggare',
      roleTeacher: 'Arbetsledare / Lagbas',
      roleTeacherShort: 'Arbetsledare',
      roleSchoolAdmin: 'Platschef / KMA',
      roleSchoolAdminShort: 'Platschef',
      roleAdmin: 'Företagsadmin',
      roleAdminShort: 'Admin',
      orgLabel: 'Företag / Entreprenör',
      groupLabel: 'Arbetslag / Yrkesgrupp',
      groupPlural: 'Arbetslag',
      groupLabelPlural: 'Arbetslag & Yrkesgrupper',
      classLabel: 'Projekt- / Lagkod',
      classOrTeamCodeLabel: 'Projekt- / Lagkod',
      accountsButtonLabel: 'Personal & Arbetslag',
      accountsHeaderButton: 'Personal & Arbetslag',
      accountsViewTitle: 'Personal, Behörighet & Arbetslag',
      accountsViewSubtitle: 'Hantera montörer, arbetsledare, platschefer och arbetslag i företaget.',
      myAccountButtonLabel: 'Mitt Konto',
      myAccountButton: 'Mitt Personalkonto',
      noticesTitle: 'Platschefsnotiser & Info',
      instructionBoxTitle: 'Utförandekrav & Arbetsberedning (AMA)',
      instructionHeading: 'Utförandekrav & Arbetsberedning (AMA)',
      proTipTitle: 'Platschefens / KMA-utföranderåd:',
      proTipHeading: 'Platschefens / KMA-utföranderåd:',
      customChecklistHeading: 'Extra kontrollpunkter för momentet (Bocka av):',
      commentLabel: 'Egenkontrollnotering / Avvikelse / Mått:',
      commentPlaceholder: 'Notera uppmätta lasermått, rörfall i mm/m, materialfraktion eller eventuella avvikelser...',
      progressText: 'Status för egenkontroll',
      progressLabel: 'Status för egenkontroll',
      phasesTitle: 'Projektets Faser:',
      phasesLabel: 'Projektets Faser (AMA)',
      defaultGroups: WORKPLACE_GROUPS,
      showSchoolGrading: false,
      hideSchoolFeatures: true,
    };
  }

  if (mode === 'APL') {
    return {
      mode: 'APL',
      modeTitle: 'APL & Lärling på Företag',
      modeSubtitle: 'Arbetsplatsförlagt lärande & Yrkeshandledning',
      modeBadge: 'APL & Lärling',
      projectsHeading: 'Projekt & APL-uppdrag',
      projectsSubtitle: 'Välj ett projekt eller APL-uppdrag för att dokumentera utförda moment och få handledarsignatur.',
      createProjectHeading: 'Starta nytt APL-projekt',
      createProjectSubtitle: 'Välj ett uppdrag från din APL-handledare eller starta ett standardprojekt (Husgrund, Plattsättning eller VA).',
      exerciseTabLabel: 'APL-uppdrag från handledare',
      standardTemplateTabLabel: 'Standardmall (Husgrund / Mark / VA)',
      exerciseCodePrompt: 'Har du fått en uppdragskod från din APL-handledare?',
      createButtonLabel: 'Starta APL-projekt',
      newProjectButton: 'Nytt APL-projekt',
      createProjectButton: 'Nytt APL-projekt',
      openProjectButton: 'Öppna APL-projekt & moment',
      emptyProjectsTitle: 'Inga APL-projekt skapade än',
      emptyProjectsSubtitle: 'Starta ett nytt APL-projekt för att dokumentera dina arbetsmoment och få handledarsignatur.',
      createFirstProjectButton: 'Skapa första APL-projektet',
      projectSingular: 'APL-projekt',
      projectPlural: 'APL-projekt',
      projectNoun: 'APL-projekt',
      projectNounDefinite: 'APL-projektet',
      projectNounSingular: 'APL-projekt',
      projectNounPlural: 'APL-projekt',
      activeProjectSubtitle: 'Aktivt APL-projekt',
      creatorButtonShort: 'Handledarpanel',
      creatorButtonLong: 'Handledarpanel (Skapa APL-mall)',
      creatorModalTitle: 'Handledarpanel & APL-mallar',
      creatorModalSubtitle: 'Bygg anpassade arbetsmoment och kontrollpunkter för lärlingar och APL-elever på bygget.',
      creatorPanelTitle: 'Handledarpanel (APL)',
      creatorPanelSubtitle: 'Bygg anpassade arbetsmoment och kontrollpunkter för lärlingar och APL-elever på bygget.',
      codeLabel: 'Uppdragskod',
      rank1Short: 'Lärling / APL',
      rank1Full: 'Rank 1 · Lärling / APL-elev',
      rank2Short: 'Handledare',
      rank2Full: 'Rank 2 · APL-handledare / Lagbas',
      rank3Short: 'Platschef',
      rank3Full: 'Rank 3 · Platschef / Utbildningsansvarig',
      rank4Short: 'Admin',
      rank4Full: 'Rank 4 · Huvudadmin',
      roleStudent: 'Lärling / APL-elev',
      roleStudentShort: 'Lärling',
      roleTeacher: 'APL-handledare / Lagbas',
      roleTeacherShort: 'Handledare',
      roleSchoolAdmin: 'Platschef / Utbildningsansvarig',
      roleSchoolAdminShort: 'Platschef',
      roleAdmin: 'Huvudadmin',
      roleAdminShort: 'Admin',
      orgLabel: 'Företag / APL-arbetsplats',
      groupLabel: 'APL-grupp / Arbetslag',
      groupPlural: 'APL-grupper & Lag',
      groupLabelPlural: 'APL-grupper & Arbetslag',
      classLabel: 'APL-period / Lag',
      classOrTeamCodeLabel: 'APL-period / Lag',
      accountsButtonLabel: 'Handledare & Lärlingar',
      accountsHeaderButton: 'Handledare & Lärlingar',
      accountsViewTitle: 'Handledare, Lärlingar & APL-grupper',
      accountsViewSubtitle: 'Hantera lärlingar, APL-elever, handledare och arbetslag på APL-platsen.',
      myAccountButtonLabel: 'Mitt Lärlingskonto',
      myAccountButton: 'Mitt Lärlingskonto',
      noticesTitle: 'Handledarnotiser & Meddelanden',
      instructionBoxTitle: 'Arbetsinstruktion & Kvalitetskrav (AMA)',
      instructionHeading: 'Arbetsinstruktion & Kvalitetskrav (AMA)',
      proTipTitle: 'APL-handledarens fältråd:',
      proTipHeading: 'APL-handledarens fältråd:',
      customChecklistHeading: 'Handledarens kontrollpunkter för momentet (Bocka av):',
      commentLabel: 'Notering / Uppmätta värden till handledare:',
      commentPlaceholder: 'Skriv lasermått, fall, material och kommentar till din APL-handledare...',
      progressText: 'Framsteg i APL-moment',
      progressLabel: 'Framsteg i APL-moment',
      phasesTitle: 'Arbetets Faser:',
      phasesLabel: 'Arbetets Faser',
      defaultGroups: APL_GROUPS,
      showSchoolGrading: false,
      hideSchoolFeatures: false,
    };
  }

  // SCHOOL mode
  return {
    mode: 'SCHOOL',
    modeTitle: 'Skola & Utbildning',
    modeSubtitle: 'Bygg- & Anläggningsutbildning · Egenkontroll',
    modeBadge: 'Skola & Utbildning',
    projectsHeading: 'Mina Skolövningar',
    projectsSubtitle: 'Välj en övning nedan för att gå igenom momenten, ta fotobevis och signera.',
    createProjectHeading: 'Starta ny skolövning',
    createProjectSubtitle: 'Välj en anpassad övning från din lärare eller starta en standardmall (Husgrund, Plattsättning eller Avlopp).',
    exerciseTabLabel: 'Lärarens Övningar (Rekommenderas)',
    standardTemplateTabLabel: 'Standardmall (Husgrund / Mark / VA)',
    exerciseCodePrompt: 'Har du fått en övningskod från läraren?',
    createButtonLabel: 'Starta Skolövning',
    newProjectButton: 'Ny övning',
    createProjectButton: 'Ny övning',
    openProjectButton: 'Öppna övning & moment',
    emptyProjectsTitle: 'Inga övningar skapade än',
    emptyProjectsSubtitle: 'Starta en ny övning för Husgrund, Plattsättning eller Enskilt Avlopp för att börja egenkontrollen.',
    createFirstProjectButton: 'Skapa första övningen',
    projectSingular: 'övning',
    projectPlural: 'övningar',
    projectNoun: 'övning',
    projectNounDefinite: 'övningen',
    projectNounSingular: 'övning',
    projectNounPlural: 'övningar',
    activeProjectSubtitle: 'Aktiv övning',
    creatorButtonShort: 'Kreatörspanel',
    creatorButtonLong: 'Kreatörspanel (Lärare)',
    creatorModalTitle: 'Kreatörspanel för Lärare',
    creatorModalSubtitle: 'Skapa övningar från mall eller från grunden med anpassade faser, moment och krav.',
    creatorPanelTitle: 'Kreatörspanel (Lärare)',
    creatorPanelSubtitle: 'Skapa övningar från mall eller från grunden med anpassade faser, moment och krav.',
    codeLabel: 'Övningskod',
    rank1Short: 'Elev',
    rank1Full: 'Rank 1 · Elev',
    rank2Short: 'Lärare',
    rank2Full: 'Rank 2 · Yrkeslärare',
    rank3Short: 'Skoladmin',
    rank3Full: 'Rank 3 · Skoladmin',
    rank4Short: 'Admin',
    rank4Full: 'Rank 4 · Huvudadmin',
    roleStudent: 'Elev',
    roleStudentShort: 'Elev',
    roleTeacher: 'Yrkeslärare',
    roleTeacherShort: 'Lärare',
    roleSchoolAdmin: 'Skoladmin',
    roleSchoolAdminShort: 'Skoladmin',
    roleAdmin: 'Huvudadmin',
    roleAdminShort: 'Admin',
    orgLabel: 'Skola / Utbildningsenhet',
    groupLabel: 'Elevgrupp / Program',
    groupPlural: 'Elevgrupper',
    groupLabelPlural: 'Elevgrupper & Klasser',
    classLabel: 'Klass / Beteckning',
    classOrTeamCodeLabel: 'Klass / Beteckning',
    accountsButtonLabel: 'Konton & Grupper',
    accountsHeaderButton: 'Konton & Grupper',
    accountsViewTitle: 'Konton, Rank & Elevgrupper',
    accountsViewSubtitle: 'Hantera elevkonton, lärarkonton, skoladmin och sortera elever i grupper.',
    myAccountButtonLabel: 'Mitt Elevkonto',
    myAccountButton: 'Mitt Elevkonto',
    noticesTitle: 'Lärarnotiser & Utskick',
    instructionBoxTitle: 'Arbetsinstruktion (AMA-krav)',
    instructionHeading: 'Skolans Arbetsinstruktion (Låst krav)',
    proTipTitle: 'Yrkeslärarens fältråd:',
    proTipHeading: 'Yrkeslärarens fältråd:',
    customChecklistHeading: 'Lärarens Del-checklista för Momentet (Bocka av):',
    commentLabel: 'Egen anteckning / Avvikelse / Kommentar till läraren:',
    commentPlaceholder: 'Skriv egna anteckningar här... T.ex. lasermått, rörfall i mm/m, temperatur eller frågor till läraren.',
    progressText: 'Godkända moment',
    progressLabel: 'Totalt framsteg i utbildningen',
    phasesTitle: 'Faser:',
    phasesLabel: 'Utbildningens Faser',
    defaultGroups: SCHOOL_GROUPS,
    showSchoolGrading: true,
    hideSchoolFeatures: false,
  };
}

export function getContextualRoleLabel(role: UserRole, mode: AppContextMode, short = false): string {
  const vocab = getContextVocabulary(mode);
  switch (role) {
    case 'ADMIN':
      return short ? vocab.rank4Short : vocab.rank4Full;
    case 'SCHOOL_ADMIN':
      return short ? vocab.rank3Short : vocab.rank3Full;
    case 'TEACHER':
      return short ? vocab.rank2Short : vocab.rank2Full;
    case 'STUDENT':
    default:
      return short ? vocab.rank1Short : vocab.rank1Full;
  }
}
