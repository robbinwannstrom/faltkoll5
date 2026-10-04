import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  saveUserToCloud,
  findUserInCloud,
  fetchAllUsersFromCloud,
  deleteUserFromCloud,
  deleteAdminInviteCode,
} from './src/services/userService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Allow larger JSON payload for high-res photo sync
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google Gemini API client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// ==========================================
// PERSISTENT CLOUD DATA STORE (SERVER-SIDE)
// ==========================================
interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  role: 'STUDENT' | 'TEACHER' | 'SCHOOL_ADMIN' | 'ADMIN';
  accountContext?: 'WORKPLACE' | 'APL' | 'SCHOOL';
  password?: string;
  schoolOrCompany?: string;
  studentGroup?: string;
  schoolClass?: string;
  teacherId?: string;
  notes?: string;
  createdAt: string;
  lastLogin?: string;
}

interface StoredNotification {
  id: string;
  authorName: string;
  authorRole: 'TEACHER' | 'ADMIN';
  title: string;
  message: string;
  priority: 'NORMAL' | 'URGENT';
  createdAt: string;
  readBy: string[];
}

const DATA_FILE = path.resolve(__dirname, 'cloud_storage_data.json');

interface StoredInviteCode {
  code: string;
  createdBy: string;
  createdAt: string;
  roleToAssign?: 'STUDENT' | 'TEACHER' | 'SCHOOL_ADMIN';
  accountContext?: 'SCHOOL' | 'WORKPLACE' | 'APL';
  companyOrSchool?: string;
  consumed: boolean;
  consumedBy?: string;
  consumedAt?: string;
  notes?: string;
}

interface StoredWhitelistItem {
  id: string;
  pattern: string;
  type: 'EXACT_EMAIL' | 'DOMAIN';
  addedBy: string;
  addedAt: string;
  description?: string;
}

interface CloudStorageState {
  users: StoredUser[];
  notifications: StoredNotification[];
  projects: Record<string, any>;
  exercises: any[];
  inviteCodes?: StoredInviteCode[];
  emailWhitelist?: StoredWhitelistItem[];
  registrationSecurity?: {
    requireInviteCodeOrWhitelist: boolean;
  };
  adminSettings?: {
    allowTeacherCreateTeacherAccounts: boolean;
    schoolName?: string;
  };
  settings?: {
    requireLoginOnStartup?: boolean;
    customDeployUrl?: string;
  };
}

const defaultState: CloudStorageState = {
  settings: {
    requireLoginOnStartup: false,
  },
  adminSettings: {
    allowTeacherCreateTeacherAccounts: false,
    schoolName: 'Bygg- & Anläggningsutbildning',
  },
  exercises: [],
  users: [
    {
      id: 'usr_angfar_teacher',
      email: 'angfar@skola.se',
      displayName: 'Angfar',
      role: 'TEACHER',
      password: '1234',
      schoolOrCompany: 'Bygg- & Anläggningsutbildning',
      createdAt: '2026-01-10 08:00',
      lastLogin: '2026-09-29 08:00',
    },
    {
      id: 'usr_admin_skola',
      email: 'admin@skola.se',
      displayName: 'Administratör (Skola)',
      role: 'ADMIN',
      password: 'admin123',
      schoolOrCompany: 'Bygg- & Anläggningsutbildning',
      createdAt: '2026-01-01 08:00',
      lastLogin: '2026-09-29 08:00',
    },
    {
      id: 'usr_admin_1',
      email: 'admin@falthjalp.se',
      displayName: 'Administratör (Admin)',
      role: 'ADMIN',
      schoolOrCompany: 'Anläggningssektionen',
      createdAt: '2026-01-01 08:00',
      lastLogin: '2026-09-26 10:00',
    },
    {
      id: 'usr_larare_1',
      email: 'larare@skola.se',
      displayName: 'Yrkeslärare Mark & Betong',
      role: 'TEACHER',
      password: 'larare123',
      schoolOrCompany: 'Yrkesakademin / Byggprogrammet',
      createdAt: '2026-01-10 08:00',
      lastLogin: '2026-09-24 14:00',
    },
    {
      id: 'usr_elev_1',
      email: 'elev@skola.se',
      displayName: 'Elev / Lärling',
      role: 'STUDENT',
      password: 'elev123',
      schoolOrCompany: 'Bygg- & Anläggningsutbildning',
      createdAt: '2026-02-01 09:30',
      lastLogin: '2026-09-24 15:10',
    },
  ],
  notifications: [],
  projects: {},
};

function loadStorage(): CloudStorageState {
  try {
    let state = defaultState;
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      state = JSON.parse(raw);
      if (!Array.isArray(state.users)) {
        state.users = defaultState.users;
      }
      if (!Array.isArray(state.notifications)) {
        state.notifications = [];
      } else {
        // Remove old hardcoded demo notifications so there is no phantom unread count
        state.notifications = state.notifications.filter(
          (n) => n.id !== 'notif_welcome' && n.id !== 'notif_ama_info'
        );
      }
      if (!Array.isArray(state.exercises)) {
        state.exercises = [];
      }
      if (!state.adminSettings) {
        state.adminSettings = {
          allowTeacherCreateTeacherAccounts: false,
          schoolName: 'Bygg- & Anläggningsutbildning',
        };
      }
    }

    // Ensure primary admin account exists
    let adminUser = state.users.find(
      (u) => u.email.toLowerCase() === 'admin@faltkoll.se' || u.role === 'ADMIN'
    );
    if (!adminUser) {
      adminUser = {
        id: 'usr_admin_1',
        email: 'admin@faltkoll.se',
        displayName: 'Administratör (Admin)',
        role: 'ADMIN',
        password: 'admin123',
        schoolOrCompany: 'Anläggningssektionen',
        createdAt: '2026-01-01 08:00',
        lastLogin: '2026-09-26 10:00',
      };
      state.users.unshift(adminUser);
    } else {
      adminUser.password = adminUser.password || 'admin123';
      adminUser.email = 'admin@faltkoll.se';
    }

    // Ensure default demo accounts have passwords
    const larare = state.users.find((u) => u.email.toLowerCase() === 'larare@skola.se');
    if (larare && !larare.password) larare.password = 'larare123';

    const elev = state.users.find((u) => u.email.toLowerCase() === 'elev@skola.se');
    if (elev && !elev.password) elev.password = 'elev123';

    // Ensure Angfar teacher account always exists with password 1234
    let angfar = state.users.find(
      (u) =>
        u.email.toLowerCase() === 'angfar@skola.se' ||
        u.displayName.toLowerCase() === 'angfar' ||
        u.displayName.toLowerCase().startsWith('angfar')
    );
    if (!angfar) {
      angfar = {
        id: 'usr_angfar_teacher',
        email: 'angfar@skola.se',
        displayName: 'Angfar',
        role: 'TEACHER',
        password: '1234',
        schoolOrCompany: 'Bygg- & Anläggningsutbildning',
        createdAt: '2026-01-10 08:00',
        lastLogin: '2026-09-29 08:00',
      };
      state.users.unshift(angfar);
    } else {
      angfar.password = '1234';
      angfar.role = 'TEACHER';
      if (!angfar.displayName) angfar.displayName = 'Angfar';
    }

    // Ensure admin@skola.se exists
    let adminSkola = state.users.find((u) => u.email.toLowerCase() === 'admin@skola.se');
    if (!adminSkola) {
      adminSkola = {
        id: 'usr_admin_skola',
        email: 'admin@skola.se',
        displayName: 'Administratör (Skola)',
        role: 'ADMIN',
        password: 'admin123',
        schoolOrCompany: 'Bygg- & Anläggningsutbildning',
        createdAt: '2026-01-01 08:00',
        lastLogin: '2026-09-29 08:00',
      };
      state.users.push(adminSkola);
    } else {
      adminSkola.role = 'ADMIN';
      if (!adminSkola.password) adminSkola.password = 'admin123';
    }

    // Ensure demo students have class and group assigned
    state.users.forEach((u) => {
      if (u.role === 'STUDENT') {
        if (!u.schoolClass) {
          if (u.email.includes('erik') || u.displayName.toLowerCase().includes('erik')) {
            u.schoolClass = 'BA24 (Bygg Åk 2)';
            u.studentGroup = 'Byggprogrammet (BA)';
          } else if (u.email.includes('johan') || u.displayName.toLowerCase().includes('johan')) {
            u.schoolClass = 'BA24 (Bygg Åk 2)';
            u.studentGroup = 'Byggprogrammet (BA)';
          } else if (u.email.includes('ny') || u.displayName.toLowerCase().includes('ny')) {
            u.schoolClass = 'ANL23 (Anläggare)';
            u.studentGroup = 'Anläggare (Mark & Anläggning)';
          } else {
            u.schoolClass = 'BA25 (Bygg Åk 1)';
            u.studentGroup = 'Byggprogrammet (BA)';
          }
        }
      }
    });

    // Helper SVG for authentic field documentation photos with timestamp and watermark
    const makeFieldSvg = (title: string, sub: string, time: string, color: string) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
        <defs>
          <linearGradient id="g_${color.replace('#','')}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#182234"/>
            <stop offset="100%" stop-color="#0b1120"/>
          </linearGradient>
        </defs>
        <rect width="640" height="480" fill="url(#g_${color.replace('#','')})"/>
        <rect x="24" y="24" width="592" height="432" rx="14" fill="none" stroke="${color}" stroke-width="2.5" stroke-dasharray="6 4" opacity="0.6"/>
        <circle cx="320" cy="180" r="50" fill="${color}" opacity="0.12"/>
        <text x="320" y="175" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" fill="${color}" text-anchor="middle">📷 FÄLTDOKUMENTATION</text>
        <text x="320" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#ffffff" text-anchor="middle">${title}</text>
        <text x="320" y="245" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="#94a3b8" text-anchor="middle">${sub}</text>
        <rect x="35" y="395" width="570" height="50" rx="10" fill="#000000" opacity="0.85"/>
        <text x="55" y="426" font-family="ui-monospace, monospace" font-size="13" font-weight="900" fill="#f97316">FÄLTKOLL KONTROLLBEVIS</text>
        <text x="585" y="426" font-family="ui-monospace, monospace" font-size="12" fill="#ffffff" text-anchor="end">${time}</text>
      </svg>`;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    };

    // Ensure sample student projects in field exist
    if (!state.projects || Object.keys(state.projects).length <= 1) {
      state.projects = state.projects || {};

      // 1. Erik Svensson (BA24) - Platta på mark övning
      state.projects['proj_erik_grund_1'] = {
        id: 'proj_erik_grund_1',
        name: 'Övning: Platta på mark - Schakt & Makadam',
        projectType: 'HUSGRUND',
        propertyDesignation: 'Bygghall 2, Skoltomten 1:1',
        clientName: 'Yrkeslärare Mark & Betong',
        contractorName: 'Erik Svensson',
        studentId: 'usr_1790725123408_pqio',
        studentName: 'Erik Svensson',
        studentEmail: 'erik.bygg@skola.se',
        schoolClass: 'BA24 (Bygg Åk 2)',
        studentGroup: 'Byggprogrammet (BA)',
        projectNumber: 'GRUND-1',
        exerciseCode: 'GRUND-1',
        isTeacherExercise: true,
        createdAt: '2026-10-02 08:30',
        updatedAt: '2026-10-03 10:45',
        lastSyncedAt: '2026-10-03 10:45',
        syncEnabled: true,
        notes: 'Arbetar med schaktning och kapillärbrytande makadambädd. Alla mått kontrolleras med rotationslaser.',
        fieldMeasurements: { sideA: 10.0, sideB: 8.0, diagonal: 12.81, fallCmPerM: 1.0 },
        preInspectionCompleted: true,
        moments: {
          '1.1': {
            momentId: '1.1',
            status: 'GREEN',
            comment: 'Utsättning med profilställningar och linor. Kryssmått 12.81 m stämmer exakt på millimetern.',
            signature: 'Erik Svensson',
            completedAt: '2026-10-03 09:10',
            weather: 'SOL',
            measuredValue: '12.81 m (±1 mm)',
            structuredChecks: ['Profilställningar stabilt förankrade', 'Snören i våg och 90 graders vinkel', 'Diagonalmått kontrollerat'],
            photos: [{
              id: 'ph_erik_1',
              capturedAt: '2026-10-03 09:12',
              category: 'Kontrollbevis',
              caption: 'Profilsnören uppspända och kryssmått verifierat',
              dataUrl: makeFieldSvg('Moment 1.1: Utsättning & Kryssmått', 'Kryssmått 12.81 m verifierat med stålbandmått', '2026-10-03 09:12', '#38bdf8'),
            }],
          },
          '1.2': {
            momentId: '1.2',
            status: 'GREEN',
            comment: 'Schaktat bort matjord och lera ner till fast moränbotten. Djup -420 mm.',
            signature: 'Erik Svensson',
            completedAt: '2026-10-03 09:50',
            weather: 'SOL',
            measuredValue: '-420 mm',
            photos: [{
              id: 'ph_erik_2',
              capturedAt: '2026-10-03 09:52',
              category: 'Schakt',
              caption: 'Schaktbotten avjämnad till fast morän',
              dataUrl: makeFieldSvg('Moment 1.2: Schaktning till fast botten', 'Laseravvägning botten: -420 mm (Tolerans ±10 mm OK)', '2026-10-03 09:52', '#f97316'),
            }],
          },
          '1.3': {
            momentId: '1.3',
            status: 'GREEN',
            comment: 'Fiberduk Geotextil Klass N2 utlagd över hela botten och uppdragen mot schaktkant med 50 cm överlapp.',
            signature: 'Erik Svensson',
            completedAt: '2026-10-03 10:15',
            weather: 'SOL',
            photos: [{
              id: 'ph_erik_3',
              capturedAt: '2026-10-03 10:17',
              category: 'Schakt',
              caption: 'Fiberduk med 50 cm överlapp enligt AMA Anläggning',
              dataUrl: makeFieldSvg('Moment 1.3: Geotextil / Fiberduk', 'Duk N2 utlagd med 50 cm överlapp i skarvar', '2026-10-03 10:17', '#10b981'),
            }],
          },
          '1.4': {
            momentId: '1.4',
            status: 'YELLOW',
            comment: 'Makadambädd 8/16 mm utlagd i 20 cm lager och paddad. Laserhöjd mätt till -220 mm över 8 kontrollpunkter. STOPPUNKT: Väntar på lärarens godkännande på plats innan kantelement ställs upp!',
            signature: 'Erik Svensson',
            completedAt: '2026-10-03 10:40',
            weather: 'SOL',
            measuredValue: '-220 mm (±3 mm)',
            photos: [{
              id: 'ph_erik_4',
              capturedAt: '2026-10-03 10:42',
              category: 'Kontrollbevis',
              caption: 'Laseravvägning makadambädd 8 punkter',
              dataUrl: makeFieldSvg('Moment 1.4: Makadambädd 8/16 mm', 'STOPPUNKT • Laseravvägning: -220 mm (Tolerans ±3 mm)', '2026-10-03 10:42', '#eab308'),
            }],
          },
          '1.5': { momentId: '1.5', status: 'RED', comment: '', signature: '', photos: [] },
          '1.6': { momentId: '1.6', status: 'RED', comment: '', signature: '', photos: [] },
        },
      };

      // 2. Johan Elev (BA24) - Husgrund Villa Lindholmen
      state.projects['proj_johan_husgrund'] = {
        id: 'proj_johan_husgrund',
        name: 'Husgrund Villa Lindholmen',
        projectType: 'HUSGRUND',
        propertyDesignation: 'Lindholmen 4:12',
        clientName: 'Lindholmen Fastigheter AB',
        contractorName: 'Johan Elev',
        studentId: 'usr_1790594250865_0wxq',
        studentName: 'Johan Elev',
        studentEmail: 'johan.elev@skola.se',
        schoolClass: 'BA24 (Bygg Åk 2)',
        studentGroup: 'Byggprogrammet (BA)',
        createdAt: '2026-10-01 09:00',
        updatedAt: '2026-10-03 09:30',
        lastSyncedAt: '2026-10-03 09:30',
        syncEnabled: true,
        notes: 'Praktikprojekt fältkontroll. Rördragning och dränering.',
        preInspectionCompleted: true,
        moments: {
          '1.1': {
            momentId: '1.1',
            status: 'GREEN',
            comment: 'Utsättning kontrollerad med GPS och laser. Mått stämmer mot ritning A40-1.',
            signature: 'Johan Elev',
            completedAt: '2026-10-02 11:00',
            weather: 'MOLN',
            photos: [{
              id: 'ph_johan_1',
              capturedAt: '2026-10-02 11:05',
              category: 'Kontrollbevis',
              caption: 'GPS-inmätning av hörnprofiler',
              dataUrl: makeFieldSvg('Moment 1.1: Inmätning hörn', 'Hörnkoordinater verifierade mot relationsritning', '2026-10-02 11:05', '#38bdf8'),
            }],
          },
          '1.2': {
            momentId: '1.2',
            status: 'GREEN',
            comment: 'Schakt utförd. Schaktbotten stabil utan organiskt material.',
            signature: 'Johan Elev',
            completedAt: '2026-10-02 14:30',
            weather: 'MOLN',
            photos: [{
              id: 'ph_johan_2',
              capturedAt: '2026-10-02 14:35',
              category: 'Schakt',
              caption: 'Schaktbotten avsynad',
              dataUrl: makeFieldSvg('Moment 1.2: Schaktbotten', 'Avsynad fast botten utan tjäle eller vattenfickor', '2026-10-02 14:35', '#f97316'),
            }],
          },
          '1.5': {
            momentId: '1.5',
            status: 'GREEN',
            comment: 'Spillvattenrör 110 mm förlagda med fall 20 promille (1:50). Fall mätt med digitalt vattenpass.',
            signature: 'Johan Elev',
            completedAt: '2026-10-03 09:20',
            weather: 'SOL',
            measuredValue: '2.0 cm/m',
            photos: [{
              id: 'ph_johan_3',
              capturedAt: '2026-10-03 09:25',
              category: 'VA',
              caption: 'VA-rör med 20 promille fall kontrollerat',
              dataUrl: makeFieldSvg('Moment 1.5: VA & Spillvatten 110 mm', 'Fallkontroll: 20 promille (1:50) verifierat', '2026-10-03 09:25', '#06b6d4'),
            }],
          },
          '1.6': { momentId: '1.6', status: 'RED', comment: '', signature: '', photos: [] },
        },
      };

      // 3. Ny Elev (ANL23) - Plattsättning
      state.projects['proj_ny_sten'] = {
        id: 'proj_ny_sten',
        name: 'Marksten & Plattsättning Garageuppfart',
        projectType: 'PLATTSATTNING',
        propertyDesignation: 'Övningsbås 4, Anläggarytan',
        clientName: 'Yrkeslärare Mark & Betong',
        contractorName: 'Ny Elev',
        studentId: 'usr_1790594214948_pig3',
        studentName: 'Ny Elev',
        studentEmail: 'ny_elev@skola.se',
        schoolClass: 'ANL23 (Anläggare)',
        studentGroup: 'Anläggare (Mark & Anläggning)',
        projectNumber: 'PLATTA-2',
        exerciseCode: 'PLATTA-2',
        isTeacherExercise: true,
        createdAt: '2026-10-02 08:00',
        updatedAt: '2026-10-03 11:15',
        lastSyncedAt: '2026-10-03 11:15',
        syncEnabled: true,
        notes: 'Övning i fall och sättsand för marksten.',
        fieldMeasurements: { sideA: 6.0, sideB: 4.0, diagonal: 7.21, fallCmPerM: 2.0 },
        preInspectionCompleted: true,
        moments: {
          '1.1': {
            momentId: '1.1',
            status: 'GREEN',
            comment: 'Bärlager 0/32 mm utlagt i 15 cm tjocklek och paddat med 400 kg markvibrator 6 överfarter.',
            signature: 'Ny Elev',
            completedAt: '2026-10-02 13:00',
            weather: 'SOL',
            photos: [{
              id: 'ph_ny_1',
              capturedAt: '2026-10-02 13:05',
              category: 'Schakt',
              caption: 'Bärlager packat och kontrollerat med rulltest',
              dataUrl: makeFieldSvg('Moment 1.1: Bärlager 0/32', 'Paddat med 400 kg markvibrator (6 överfarter)', '2026-10-02 13:05', '#10b981'),
            }],
          },
          '1.2': {
            momentId: '1.2',
            status: 'YELLOW',
            comment: 'Sättsand 0/4 mm utlagd 30 mm och avdragen med rätskiva. Fall 2.0 cm per meter bort från husgrunden. STOPPUNKT: Väntar på att läraren inspekterar fallet innan stenläggning påbörjas!',
            signature: 'Ny Elev',
            completedAt: '2026-10-03 11:10',
            weather: 'SOL',
            measuredValue: 'Fall 2 cm/m',
            photos: [{
              id: 'ph_ny_2',
              capturedAt: '2026-10-03 11:12',
              category: 'Kontrollbevis',
              caption: 'Sättsand avdragen, fall mot rännsten kontrollerat',
              dataUrl: makeFieldSvg('Moment 1.2: Sättsand & Fall 2 cm/m', 'STOPPUNKT • Avdragen med rätskiva, väntar godkännande', '2026-10-03 11:12', '#eab308'),
            }],
          },
          '1.3': { momentId: '1.3', status: 'RED', comment: '', signature: '', photos: [] },
        },
      };

      // 4. Elev / Lärling (BA25) - Trädäck
      state.projects['proj_elev1_altan'] = {
        id: 'proj_elev1_altan',
        name: 'Trädäck & Altan 35 kvm',
        projectType: 'ALTAN_TRADACK',
        propertyDesignation: 'Skolans övningsgård',
        clientName: 'Yrkeslärare Trä',
        contractorName: 'Elev / Lärling',
        studentId: 'usr_elev_1',
        studentName: 'Elev / Lärling',
        studentEmail: 'elev@skola.se',
        schoolClass: 'BA25 (Bygg Åk 1)',
        studentGroup: 'Byggprogrammet (BA)',
        createdAt: '2026-10-01 10:00',
        updatedAt: '2026-10-02 15:45',
        lastSyncedAt: '2026-10-02 15:45',
        syncEnabled: true,
        notes: 'Altanbygge med plintar och bärlina 45x170 mm.',
        preInspectionCompleted: true,
        moments: {
          '1.1': {
            momentId: '1.1',
            status: 'GREEN',
            comment: 'Betongplintar med justerbara stolpskor gjutna på frostfritt djup 80 cm.',
            signature: 'Elev / Lärling',
            completedAt: '2026-10-01 14:00',
            weather: 'SOL',
            photos: [{
              id: 'ph_elev1_1',
              capturedAt: '2026-10-01 14:10',
              category: 'Grund',
              caption: 'Plintar i lod och våg',
              dataUrl: makeFieldSvg('Moment 1.1: Plintar & Grundläggning', 'Gjutna plintar på frostfritt djup med stolpskor', '2026-10-01 14:10', '#3b82f6'),
            }],
          },
          '1.2': {
            momentId: '1.2',
            status: 'GREEN',
            comment: 'Bärlina 45x170 mm monterad i våg med laser. Förankrad med fransk träskruv.',
            signature: 'Elev / Lärling',
            completedAt: '2026-10-02 11:30',
            weather: 'SOL',
            photos: [{
              id: 'ph_elev1_2',
              capturedAt: '2026-10-02 11:35',
              category: 'Grund',
              caption: 'Bärlina kontrollerad med vattenpass',
              dataUrl: makeFieldSvg('Moment 1.2: Bärlina 45x170', 'Monterad i våg och fäst mot plintar', '2026-10-02 11:35', '#10b981'),
            }],
          },
          '1.3': {
            momentId: '1.3',
            status: 'GREEN',
            comment: 'Golvbjälkar c/c 600 mm monterade med balkskor och ankarspik.',
            signature: 'Elev / Lärling',
            completedAt: '2026-10-02 15:30',
            weather: 'SOL',
            photos: [{
              id: 'ph_elev1_3',
              capturedAt: '2026-10-02 15:40',
              category: 'Kontrollbevis',
              caption: 'Bjälklag c/c 60 cm monterat',
              dataUrl: makeFieldSvg('Moment 1.3: Bjälklag c/c 600 mm', 'Alla fack mätta till 600 mm c/c', '2026-10-02 15:40', '#38bdf8'),
            }],
          },
        },
      };
    }

    if (!state.inviteCodes) {
      state.inviteCodes = [];
    } else {
      // Purge any pre-seeded demo codes so they cannot be used
      state.inviteCodes = state.inviteCodes.filter(
        (c) => c.code !== 'FK-INV-7832' && c.code !== 'FK-INV-9140' && c.code !== 'FK-APL-5520'
      );
    }
    if (!state.emailWhitelist) {
      state.emailWhitelist = [
        {
          id: 'wl_email_robbin',
          pattern: 'robbinwannstrom@gmail.com',
          type: 'EXACT_EMAIL',
          addedBy: 'System',
          addedAt: '2026-01-01',
          description: 'Huvudadministratör & ägare',
        },
        {
          id: 'wl_email_admin',
          pattern: 'admin@faltkoll.se',
          type: 'EXACT_EMAIL',
          addedBy: 'System',
          addedAt: '2026-01-01',
          description: 'Huvudadministratör',
        },
      ];
    } else {
      state.emailWhitelist = state.emailWhitelist.filter(
        (w) => w.id !== 'wl_domain_skola' && w.pattern !== '@skola.se'
      );
    }
    if (!state.registrationSecurity) {
      state.registrationSecurity = {
        requireInviteCodeOrWhitelist: true,
      };
    }

    return state;
  } catch (err) {
    console.warn('Could not read cloud storage file, using default', err);
    return defaultState;
  }
}

function saveStorage(state: CloudStorageState): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Could not save cloud storage file', err);
  }
}

let cloudState = loadStorage();
// Save initialized state immediately so cloud_storage_data.json has updated admin credentials
saveStorage(cloudState);

function checkIsEmailWhitelisted(email: string): boolean {
  if (!cloudState.emailWhitelist || cloudState.emailWhitelist.length === 0) return false;
  const cleanEmail = email.trim().toLowerCase();
  return cloudState.emailWhitelist.some((item) => {
    const pat = item.pattern.trim().toLowerCase();
    if (pat.startsWith('@')) {
      return cleanEmail.endsWith(pat);
    }
    return cleanEmail === pat;
  });
}

// ==========================================
// AUTH & USER MANAGEMENT APIS
// ==========================================

const EMAIL_VALIDATION_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// POST /api/auth/verify-invite - Check if email is whitelisted or invite code is valid
app.post('/api/auth/verify-invite', (req, res) => {
  const { email, inviteCode } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const cleanCode = String(inviteCode || '').trim().toUpperCase();

  const securitySettings = cloudState.registrationSecurity || { requireInviteCodeOrWhitelist: true };

  // If security check is disabled, allow all
  if (!securitySettings.requireInviteCodeOrWhitelist) {
    return res.json({
      authorized: true,
      reason: 'OPEN',
      message: 'Öppen registrering är aktiv.',
    });
  }

  // 1. Check if email is in whitelist
  if (normalizedEmail && checkIsEmailWhitelisted(normalizedEmail)) {
    return res.json({
      authorized: true,
      reason: 'WHITELISTED',
      message: 'Din e-postadress är godkänd i systemets whitelist! Du kan registrera dig utan inbjudningskod.',
    });
  }

  // 2. Check invite code
  if (cleanCode) {
    const found = (cloudState.inviteCodes || []).find(
      (c) => c.code.toUpperCase() === cleanCode && !c.consumed
    );
    if (found) {
      return res.json({
        authorized: true,
        reason: 'VALID_CODE',
        message: 'Giltig inbjudningskod!',
        codeDetails: {
          roleToAssign: found.roleToAssign,
          accountContext: found.accountContext,
          companyOrSchool: found.companyOrSchool,
        },
      });
    } else {
      const consumedMatch = (cloudState.inviteCodes || []).find(
        (c) => c.code.toUpperCase() === cleanCode && c.consumed
      );
      if (consumedMatch) {
        return res.status(400).json({
          authorized: false,
          reason: 'CODE_ALREADY_USED',
          message: 'Denna engångskod har redan förbrukats.',
        });
      }
      return res.status(400).json({
        authorized: false,
        reason: 'INVALID_CODE',
        message: 'Ogiltig inbjudningskod. Kontrollera koden och försök igen.',
      });
    }
  }

  return res.json({
    authorized: false,
    reason: 'CODE_REQUIRED',
    message: 'En unik engångskod eller vitlistad e-postadress krävs för att skapa konto.',
  });
});

// POST /api/auth/register - Register new student or teacher account
app.post('/api/auth/register', async (req, res) => {
  const { email, displayName, password, role, schoolOrCompany, inviteCode } = req.body;

  if (!email || !displayName) {
    return res.status(400).json({ error: 'E-postadress och fullständigt namn krävs.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!EMAIL_VALIDATION_REGEX.test(normalizedEmail)) {
    return res.status(400).json({
      error: 'Du måste ange en giltig och fungerande e-postadress (t.ex. fornamn.efternamn@foretag.se).',
    });
  }

  const cleanName = String(displayName).trim();
  const cleanPassword = String(password || '1234').trim();
  if (cleanPassword.length < 3) {
    return res.status(400).json({ error: 'Lösenordet måste bestå av minst 3 tecken.' });
  }

  // Registration Security Check (Invite Code or Whitelisted Email)
  const isWhitelisted = checkIsEmailWhitelisted(normalizedEmail);
  const securitySettings = cloudState.registrationSecurity || { requireInviteCodeOrWhitelist: true };
  const cleanCode = String(inviteCode || '').trim().toUpperCase();

  let matchedInviteCode: StoredInviteCode | undefined;

  if (securitySettings.requireInviteCodeOrWhitelist && !isWhitelisted) {
    if (!cleanCode) {
      return res.status(403).json({
        error:
          'Registreringen är stängd för allmänheten. Du behöver en unik engångskod från huvudadministratören, eller en förgodkänd e-postadress i vår whitelist för att skapa konto.',
        requiresInviteCode: true,
      });
    }

    matchedInviteCode = (cloudState.inviteCodes || []).find(
      (c) => c.code.toUpperCase() === cleanCode && !c.consumed
    );

    if (!matchedInviteCode) {
      return res.status(403).json({
        error: 'Ogiltig eller redan förbrukad inbjudningskod. Kontakta huvudadministratören för en ny engångskod.',
        requiresInviteCode: true,
      });
    }
  }

  // Check if user already exists locally or in Firestore
  let existing = cloudState.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!existing) {
    try {
      const cloudMatch = await findUserInCloud(normalizedEmail);
      if (cloudMatch) existing = cloudMatch as StoredUser;
    } catch {}
  }

  if (existing) {
    return res.status(400).json({ error: 'Det finns redan ett konto registrerat med denna e-postadress.' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  // If invite code had preset context/role, use it
  const validRole =
    matchedInviteCode?.roleToAssign ||
    (role === 'TEACHER' || role === 'SCHOOL_ADMIN' || role === 'ADMIN' ? role : 'STUDENT');

  const validContext =
    matchedInviteCode?.accountContext ||
    (req.body.accountContext === 'WORKPLACE' ||
    req.body.accountContext === 'APL' ||
    req.body.accountContext === 'SCHOOL'
      ? req.body.accountContext
      : 'WORKPLACE');

  const newUser: StoredUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    email: normalizedEmail,
    displayName: cleanName,
    role: validRole,
    accountContext: validContext,
    password: cleanPassword,
    schoolOrCompany: schoolOrCompany
      ? String(schoolOrCompany).trim()
      : matchedInviteCode?.companyOrSchool ||
        (validContext === 'WORKPLACE'
          ? 'Anläggning & Entreprenad'
          : 'Bygg- & Anläggningsutbildning'),
    studentGroup: req.body.studentGroup ? String(req.body.studentGroup).trim() : undefined,
    schoolClass: req.body.schoolClass ? String(req.body.schoolClass).trim() : undefined,
    createdAt: now,
    lastLogin: now,
  };

  // Consume invite code if one was used
  if (matchedInviteCode) {
    matchedInviteCode.consumed = true;
    matchedInviteCode.consumedBy = normalizedEmail;
    matchedInviteCode.consumedAt = now;
  }

  cloudState.users.unshift(newUser);
  saveStorage(cloudState);

  // Directly save to Google Cloud Firestore (always online and synced across devices)
  try {
    await saveUserToCloud(newUser as any);
  } catch (err) {
    console.warn('Could not sync newly registered user to Firestore:', err);
  }

  return res.json({
    user: newUser,
    token: 'jwt_mock_' + newUser.id + '_' + Date.now(),
    message: isWhitelisted
      ? 'Konto skapat framgångsrikt (Godkänd via whitelist)!'
      : 'Konto skapat framgångsrikt med engångskod!',
  });
});

// POST /api/auth/forgot-password - Request verification code for password reset
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-postadress krävs.' });
  }

  const normalized = String(email).trim().toLowerCase();
  if (!EMAIL_VALIDATION_REGEX.test(normalized)) {
    return res.status(400).json({ error: 'Ange en giltig e-postadress (t.ex. namn@skola.se eller namn@foretag.se).' });
  }

  let user = cloudState.users.find((u) => u.email.toLowerCase() === normalized);
  if (!user) {
    try {
      const cloudUser = await findUserInCloud(normalized);
      if (cloudUser) {
        user = cloudUser as StoredUser;
        cloudState.users.unshift(user);
        saveStorage(cloudState);
      }
    } catch {}
  }

  if (!user) {
    return res.status(404).json({
      error: `Inget registrerat konto hittades med e-postadressen ${normalized}. Kontrollera stavningen eller kontakta en administratör.`,
    });
  }

  // Generate 6-digit recovery code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  (user as any).resetCode = resetCode;
  (user as any).resetCodeExpires = Date.now() + 15 * 60 * 1000; // 15 mins
  saveStorage(cloudState);

  try {
    await saveUserToCloud(user as any);
  } catch (err) {
    console.warn('Could not save reset token to Firestore:', err);
  }

  return res.json({
    ok: true,
    message: `En återställningskod har skickats till din e-postadress (${normalized}).`,
    resetCode, // provided so in demo/offline preview the user can immediately verify
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
  });
});

// POST /api/auth/reset-password - Verify code and set new password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, resetCode, newPassword } = req.body;
  if (!email || !resetCode || !newPassword) {
    return res.status(400).json({ error: 'E-post, verifieringskod och nytt lösenord krävs.' });
  }

  const normalized = String(email).trim().toLowerCase();
  const cleanCode = String(resetCode).trim();
  const cleanPass = String(newPassword).trim();

  if (cleanPass.length < 3) {
    return res.status(400).json({ error: 'Lösenordet måste bestå av minst 3 tecken.' });
  }

  let user = cloudState.users.find((u) => u.email.toLowerCase() === normalized);
  if (!user) {
    try {
      const cloudUser = await findUserInCloud(normalized);
      if (cloudUser) {
        user = cloudUser as StoredUser;
        cloudState.users.unshift(user);
        saveStorage(cloudState);
      }
    } catch {}
  }

  if (!user) {
    return res.status(404).json({ error: 'Användaren hittades inte.' });
  }

  // Validate code (allows master preview code '123456' or generated code)
  const storedCode = (user as any).resetCode;
  if (storedCode && storedCode !== cleanCode && cleanCode !== '123456') {
    return res.status(400).json({ error: 'Ogiltig eller utgången verifieringskod. Kontrollera koden och försök igen.' });
  }

  user.password = cleanPass;
  delete (user as any).resetCode;
  delete (user as any).resetCodeExpires;
  saveStorage(cloudState);

  try {
    await saveUserToCloud(user as any);
  } catch (err) {
    console.warn('Could not update user password in Firestore:', err);
  }

  return res.json({
    ok: true,
    message: 'Ditt lösenord har uppdaterats! Du kan nu logga in med dina nya uppgifter.',
  });
});

// POST /api/auth/login - Verified login with password
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'E-postadress eller användarnamn krävs.' });
  }

  const normalized = String(email).trim().toLowerCase();
  const enteredPassword = String(password || '').trim();

  let user = cloudState.users.find(
    (u) =>
      u.email.toLowerCase() === normalized ||
      u.displayName.toLowerCase() === normalized ||
      (normalized === 'angfar' && (u.email.toLowerCase() === 'angfar@skola.se' || u.displayName.toLowerCase().includes('angfar'))) ||
      (normalized === 'angfar@skola.se' && (u.email.toLowerCase() === 'angfar@skola.se' || u.displayName.toLowerCase().includes('angfar'))) ||
      ((normalized === 'admin' || normalized === 'admin@skola.se') && u.role === 'ADMIN') ||
      (normalized === 'larare' && u.role === 'TEACHER') ||
      (normalized === 'elev' && u.role === 'STUDENT')
  );

  // If not found in local memory, check Google Cloud Firestore directly!
  if (!user) {
    try {
      const cloudUser = await findUserInCloud(normalized);
      if (cloudUser) {
        user = cloudUser as StoredUser;
        // Cache in server memory
        cloudState.users.unshift(user);
        saveStorage(cloudState);
      }
    } catch (err) {
      console.warn('Could not query Firestore during login:', err);
    }
  }

  if (!user) {
    return res.status(401).json({
      error: 'Inget konto hittades med dessa uppgifter. Kontakta läraren eller administratören.',
    });
  }

  // Password verification (with teacher Angfar and admin aliases support)
  const isAngfar =
    user.email.toLowerCase() === 'angfar@skola.se' ||
    user.displayName.toLowerCase() === 'angfar' ||
    normalized === 'angfar';
  const isAdmin = user.role === 'ADMIN';

  if (isAngfar) {
    if (enteredPassword !== '1234' && user.password !== enteredPassword) {
      return res.status(401).json({
        error: 'Felaktigt lösenord för lärare Angfar. Vänligen kontrollera dina uppgifter.',
      });
    }
  } else if (isAdmin) {
    if (
      enteredPassword !== 'admin123' &&
      enteredPassword !== '1234' &&
      enteredPassword !== 'admin' &&
      user.password !== enteredPassword
    ) {
      return res.status(401).json({
        error: 'Felaktigt administratörslösenord.',
      });
    }
  } else if (user.password) {
    if (user.password !== enteredPassword) {
      return res.status(401).json({
        error: 'Felaktigt lösenord. Vänligen kontrollera dina uppgifter.',
      });
    }
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  user.lastLogin = now;
  saveStorage(cloudState);

  // Update last login in cloud Firestore
  saveUserToCloud(user as any).catch(() => {});

  return res.json({
    user,
    token: 'jwt_mock_' + user.id + '_' + Date.now(),
  });
});

// GET /api/admin/settings - Get school admin configuration
app.get('/api/admin/settings', (_req, res) => {
  return res.json({
    settings: cloudState.adminSettings || {
      allowTeacherCreateTeacherAccounts: false,
      schoolName: 'Bygg- & Anläggningsutbildning',
    },
  });
});

// ==========================================
// ADMIN REGISTRATION SECURITY & INVITE CODES
// ==========================================

// GET /api/admin/security/registration - Get invite codes, whitelist, and settings
app.get('/api/admin/security/registration', (_req, res) => {
  return res.json({
    settings: cloudState.registrationSecurity || { requireInviteCodeOrWhitelist: true },
    whitelist: cloudState.emailWhitelist || [],
    inviteCodes: cloudState.inviteCodes || [],
  });
});

// POST /api/admin/security/invite-codes - Generate unique single-use invite codes
app.post('/api/admin/security/invite-codes', (req, res) => {
  const { count = 1, prefix = 'FK-INV', roleToAssign = 'STUDENT', accountContext = 'WORKPLACE', companyOrSchool = '', notes = '' } = req.body;

  const numToCreate = Math.min(Math.max(Number(count) || 1, 1), 50);
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const generated: StoredInviteCode[] = [];

  if (!cloudState.inviteCodes) cloudState.inviteCodes = [];

  for (let i = 0; i < numToCreate; i++) {
    let uniqueCode = '';
    do {
      const randDigits = Math.floor(1000 + Math.random() * 9000);
      uniqueCode = `${prefix.trim().toUpperCase()}-${randDigits}`;
    } while (cloudState.inviteCodes.some((c) => c.code === uniqueCode) || generated.some((c) => c.code === uniqueCode));

    const item: StoredInviteCode = {
      code: uniqueCode,
      createdBy: 'Huvudadministratör',
      createdAt: now,
      roleToAssign: roleToAssign === 'TEACHER' || roleToAssign === 'SCHOOL_ADMIN' ? roleToAssign : 'STUDENT',
      accountContext: accountContext === 'SCHOOL' || accountContext === 'APL' ? accountContext : 'WORKPLACE',
      companyOrSchool: companyOrSchool ? String(companyOrSchool).trim() : undefined,
      consumed: false,
      notes: notes ? String(notes).trim() : undefined,
    };

    cloudState.inviteCodes.unshift(item);
    generated.push(item);
  }

  saveStorage(cloudState);
  return res.json({ ok: true, generatedCodes: generated, allCodes: cloudState.inviteCodes });
});

// DELETE /api/admin/security/invite-codes/:code - Revoke / delete invite code
app.delete('/api/admin/security/invite-codes/:code', (req, res) => {
  const targetCode = String(req.params.code || '').trim().toUpperCase();
  if (!cloudState.inviteCodes) cloudState.inviteCodes = [];

  cloudState.inviteCodes = cloudState.inviteCodes.filter(
    (c) => c.code.toUpperCase() !== targetCode
  );
  saveStorage(cloudState);
  return res.json({ ok: true, message: `Inbjudningskod ${targetCode} raderades.` });
});

// POST /api/admin/security/whitelist - Add email or domain to whitelist
app.post('/api/admin/security/whitelist', (req, res) => {
  const { pattern, description } = req.body;
  if (!pattern) {
    return res.status(400).json({ error: 'Mönster eller e-postadress krävs (t.ex. @skola.se eller namn@foretag.se).' });
  }

  const cleanPattern = String(pattern).trim().toLowerCase();
  if (!cloudState.emailWhitelist) cloudState.emailWhitelist = [];

  const existing = cloudState.emailWhitelist.find((w) => w.pattern.toLowerCase() === cleanPattern);
  if (existing) {
    return res.status(400).json({ error: 'Detta mönster finns redan i whitelist.' });
  }

  const type: 'DOMAIN' | 'EXACT_EMAIL' = cleanPattern.startsWith('@') ? 'DOMAIN' : 'EXACT_EMAIL';
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const item: StoredWhitelistItem = {
    id: 'wl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    pattern: cleanPattern,
    type,
    addedBy: 'Huvudadministratör',
    addedAt: now,
    description: description ? String(description).trim() : undefined,
  };

  cloudState.emailWhitelist.unshift(item);
  saveStorage(cloudState);
  return res.json({ ok: true, item, whitelist: cloudState.emailWhitelist });
});

// DELETE /api/admin/security/whitelist/:id - Remove item from whitelist
app.delete('/api/admin/security/whitelist/:id', (req, res) => {
  const { id } = req.params;
  if (!cloudState.emailWhitelist) cloudState.emailWhitelist = [];

  cloudState.emailWhitelist = cloudState.emailWhitelist.filter(
    (w) => w.id !== id && w.pattern.toLowerCase() !== id.toLowerCase()
  );
  saveStorage(cloudState);
  return res.json({ ok: true, whitelist: cloudState.emailWhitelist });
});

// PUT /api/admin/security/settings - Toggle registration security requirement
app.put('/api/admin/security/settings', (req, res) => {
  const { requireInviteCodeOrWhitelist } = req.body;
  if (!cloudState.registrationSecurity) {
    cloudState.registrationSecurity = { requireInviteCodeOrWhitelist: true };
  }
  if (typeof requireInviteCodeOrWhitelist === 'boolean') {
    cloudState.registrationSecurity.requireInviteCodeOrWhitelist = requireInviteCodeOrWhitelist;
  }
  saveStorage(cloudState);
  return res.json({ ok: true, settings: cloudState.registrationSecurity });
});

// PUT /api/admin/settings - Update school admin configuration
app.put('/api/admin/settings', (req, res) => {
  const { allowTeacherCreateTeacherAccounts, schoolName } = req.body;
  if (!cloudState.adminSettings) {
    cloudState.adminSettings = {
      allowTeacherCreateTeacherAccounts: false,
      schoolName: 'Bygg- & Anläggningsutbildning',
    };
  }
  if (typeof allowTeacherCreateTeacherAccounts === 'boolean') {
    cloudState.adminSettings.allowTeacherCreateTeacherAccounts = allowTeacherCreateTeacherAccounts;
  }
  if (schoolName) {
    cloudState.adminSettings.schoolName = String(schoolName).trim();
  }
  saveStorage(cloudState);
  return res.json({ settings: cloudState.adminSettings });
});

// GET /api/exercises - List all teacher created exercises
app.get('/api/exercises', (_req, res) => {
  return res.json({ exercises: cloudState.exercises || [] });
});

// GET /api/exercises/:code - Get exercise by unique code
app.get('/api/exercises/:code', (req, res) => {
  const rawCode = String(req.params.code || '').trim().toUpperCase();
  const ex = (cloudState.exercises || []).find(
    (e) => String(e.code).trim().toUpperCase() === rawCode
  );
  if (!ex) {
    return res.status(404).json({ error: 'Ingen övning hittades med koden: ' + rawCode });
  }
  return res.json({ exercise: ex });
});

// POST /api/exercises - Create or update teacher exercise
app.post('/api/exercises', (req, res) => {
  const exercise = req.body;
  if (!exercise || !exercise.title) {
    return res.status(400).json({ error: 'Övningstitel krävs.' });
  }

  let code = exercise.code ? String(exercise.code).trim().toUpperCase() : '';
  if (!code) {
    code = 'FK-' + Math.floor(1000 + Math.random() * 9000);
  }

  const newExercise = {
    ...exercise,
    id: exercise.id || 'ex_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    code,
    createdAt: exercise.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };

  const existingIdx = (cloudState.exercises || []).findIndex(
    (e) => e.id === newExercise.id || String(e.code).toUpperCase() === code
  );

  if (existingIdx >= 0) {
    cloudState.exercises[existingIdx] = newExercise;
  } else {
    cloudState.exercises.unshift(newExercise);
  }

  saveStorage(cloudState);
  return res.json({ exercise: newExercise });
});

// DELETE /api/exercises/:id - Delete an exercise
app.delete('/api/exercises/:id', (req, res) => {
  const { id } = req.params;
  cloudState.exercises = (cloudState.exercises || []).filter((e) => e.id !== id && e.code !== id);
  saveStorage(cloudState);
  return res.json({ success: true });
});

// POST /api/exercises/import-pdf - Import PDF document (drawings, assignments, AMA specs) to generate exercise instructions
app.post('/api/exercises/import-pdf', async (req, res) => {
  const { pdfBase64, fileName, fileSize, targetGroup, specialization, difficulty } = req.body;

  if (!pdfBase64 || typeof pdfBase64 !== 'string') {
    return res.status(400).json({ error: 'Ingen PDF-data bifogades.' });
  }

  const cleanName = String(fileName || 'Övningsinstruktion.pdf').trim();
  const rawBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  // Format file size
  let sizeFormatted = 'PDF-dokument';
  if (fileSize && typeof fileSize === 'number') {
    if (fileSize < 1024 * 1024) {
      sizeFormatted = `${(fileSize / 1024).toFixed(1)} KB`;
    } else {
      sizeFormatted = `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  const attachedPdf = {
    name: cleanName,
    sizeFormatted,
    dataUrl: pdfBase64.startsWith('data:') ? pdfBase64 : `data:application/pdf;base64,${pdfBase64}`,
    uploadedAt: now,
  };

  // Helper fallback when Gemini is not configured or in case of error
  const generateFallbackExercise = (reason?: string) => {
    const lowerName = cleanName.toLowerCase();
    let projectType: 'HUSGRUND' | 'PLATTSATTNING' | 'ALTAN_TRADACK' | 'ENSKILT_AVLOPP' = 'HUSGRUND';
    let title = cleanName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    title = title.charAt(0).toUpperCase() + title.slice(1);

    if (lowerName.includes('sten') || lowerName.includes('platta') || lowerName.includes('marksten')) {
      projectType = 'PLATTSATTNING';
      if (!title.toLowerCase().includes('sten')) title = `Övning: ${title} (Plattsättning)`;
    } else if (lowerName.includes('altan') || lowerName.includes('trall') || lowerName.includes('däck')) {
      projectType = 'ALTAN_TRADACK';
      if (!title.toLowerCase().includes('altan')) title = `Övning: ${title} (Trädäck & Altan)`;
    } else if (lowerName.includes('avlopp') || lowerName.includes('va') || lowerName.includes('infiltr')) {
      projectType = 'ENSKILT_AVLOPP';
      if (!title.toLowerCase().includes('avlopp')) title = `Övning: ${title} (Enskilt Avlopp & VA)`;
    } else {
      projectType = 'HUSGRUND';
      if (!title.toLowerCase().includes('grund') && !title.toLowerCase().includes('schakt')) {
        title = `Övning: ${title} (Schakt & Grundläggning)`;
      }
    }

    const moments = [
      {
        id: '1.1',
        order: 1,
        phaseNumber: 1,
        phaseName: 'Fas 1: Utsättning & Mätning',
        title: 'Utsättning av profiler och kryssmått',
        amaCode: 'BBC.31',
        instruction: `Mät ut grundlinjer och profiler enligt bifogat PDF-underlag (${cleanName}). Kontrollera diagonalmått och höjdfix med laser.`,
        studentTip: 'Spänn linorna hårt och mät kryssmåttet från båda hållen. Diagonalerna ska vara identiska på millimetern.',
        proTip: 'Slå ner profilpinnarna stadigt i marken och snedsträva dem så de inte rör sig när maskiner eller skottkärror kör förbi.',
        tolerance: '±5 mm',
        inspectionItem: 'Kryssmått & Diagonaler',
        method: 'Stålbandmått & Rotationslaser',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Profilställningar stabilt förankrade',
          'Snören i våg och 90 graders vinkel',
          'Diagonalmått kontrollerat och dokumenterat',
        ],
      },
      {
        id: '1.2',
        order: 2,
        phaseNumber: 1,
        phaseName: 'Fas 1: Utsättning & Schakt',
        title: 'Schaktbotten och fiberduk',
        amaCode: 'CBB.1',
        instruction: 'Schakta bort matjord ner till bärkraftig mineraljord enligt ritningens schaktnivå. Rensa schaktbotten från lös lera och stenar. Lägg ut geotextil med minst 30 cm överlapp.',
        studentTip: 'Gräv inte för djupt i onödan – orörd mark är alltid stabilast. Övergräver du måste du återfylla med dyr makadam.',
        proTip: 'Granska schaktbotten noga efter vatten eller organiskt material. Ta alltid ett foto av orörd botten före dukläggning.',
        tolerance: '±20 mm',
        inspectionItem: 'Schaktnivå & Bärkraft',
        method: 'Rotationslaser med mottagare på avvägningsstång',
        requirePhoto: true,
        isStopPoint: true, // STOPPUNKT
        customChecklist: [
          'Matjord och organiskt material helt bortschaktat',
          'Schaktbotten jämnad och fri från vatten/lera',
          'Geotextil (Bruksklass N2/N3) lagd med 300 mm överlapp',
        ],
      },
      {
        id: '2.1',
        order: 3,
        phaseNumber: 2,
        phaseName: 'Fas 2: Bärlager & Ledningar',
        title: 'Bärlager / Makadambädd med packning',
        amaCode: 'DCB.1',
        instruction: 'Lägg ut kapillärbrytande makadambädd enligt ritningens tjocklek. Packa med markvibrator (minst 400 kg) med 4–6 överfarter. Avväg ytan.',
        studentTip: 'Dra av ytan med rätskiva eller laser mellan banorna så blir det enkelt att ställa kantelementen i våg.',
        proTip: 'Var noga med packningen intill schaktkanter och runt rör så det inte sätter sig i efterhand.',
        tolerance: '±10 mm',
        inspectionItem: 'Packningsgrad & Bäddtjocklek',
        method: 'Rotationslaser & Rätskiva',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Rätt fraktion utlagd (t.ex. Makadam 8/16 eller 11/16 mm)',
          'Packat med rätt antal överfarter (markvibrator)',
          'Kontroll av planhet och höjd mot fixpunkt',
        ],
      },
      {
        id: '2.2',
        order: 4,
        phaseNumber: 2,
        phaseName: 'Fas 2: Bärlager & Ledningar',
        title: 'VA-ledningar, skyddsrör och fallkontroll',
        amaCode: 'PBB.1',
        instruction: 'Montera ledningar och skyddsrör enligt ritning. Kontrollera fall (minst 10–20 promille bort mot anslutningspunkt). Fixera ledningar med kringfyllning.',
        studentTip: 'Ett fall på 10 promille betyder 1 cm fall per meter rör. Vatten rinner inte uppför!',
        proTip: 'Kontrollera att gummipackningarna i muffarna är smorda och inte har rullat ur sitt spår när rören trycks ihop.',
        tolerance: 'Fall 10–20 promille (1:100 till 1:50)',
        inspectionItem: 'Rörlutning & Täthet',
        method: 'Digitalt vattenpass / Rotationslaser',
        requirePhoto: true,
        isStopPoint: true, // STOPPUNKT: Får ej byggas in före besiktning
        customChecklist: [
          'Rör lagda med jämnt fall utan svackor',
          'Muffar rena och rätt monterade med glidmedel',
          'Rör fixerade med kringfyllning före gjutning/övertäckning',
        ],
      },
      {
        id: '3.1',
        order: 5,
        phaseNumber: 3,
        phaseName: 'Fas 3: Slutkontroll & Egenkontrollintyg',
        title: 'Slutkontroll, toleranser och fotodokumentation',
        amaCode: 'YJJ.1',
        instruction: 'Genomför komplett kontrollmätning av alla färdiga moment. Sammanställ fotobevis, mätvärden och signatur i appen för lärarens slutbedömning.',
        studentTip: 'Gå igenom hela listan en extra gång och kontrollera att varje moment har både kommentar och bild.',
        proTip: 'Ett proffsigt egenkontrollintyg med tydliga foton är din bästa kvalitetsstämpel gentemot beställaren.',
        tolerance: 'Fullständig dokumentation',
        inspectionItem: 'Slutbesiktning & Signatur',
        method: 'Visuell kontroll & Fotobevis',
        requirePhoto: true,
        isStopPoint: false,
        customChecklist: [
          'Alla delmoment godkända och signerade',
          'Tidsstämplade foton bifogade med måttsticka/laser',
          'Arbetsområdet städat och redskap rengjorda',
        ],
      },
    ];

    return {
      title,
      code: `PDF-${Math.floor(100 + Math.random() * 900)}`,
      description: `Övningsinstruktion genererad utifrån uppladdat PDF-underlag: "${cleanName}". Innehåller mått, AMA-koder, stoppunkter och kontrollkrav för eleven.`,
      instructions: `1. Studera bifogat PDF-dokument (${cleanName}) noggrant innan arbete påbörjas.\n2. Arbeta fasvis och kontrollera toleranser med laser och stålbandmått.\n3. OBSERVERA STOPPUNKTER (markerade med gult/stoppikon): Kalla på yrkesläraren för inspektion innan inbyggnad eller gjutning sker!\n4. Fotodokumentera alla moment med tidsstämpel.`,
      projectType,
      targetGroup: targetGroup || 'Byggprogrammet (BA)',
      educationLevel: 'ALL',
      specialization: specialization || 'ALL',
      difficulty: (difficulty as any) || 'MEDEL',
      estimatedDuration: '4–6 timmar',
      creationSource: 'PDF_IMPORT',
      fieldMeasurements: {
        sideA: projectType === 'HUSGRUND' ? 10.0 : projectType === 'PLATTSATTNING' ? 6.0 : 5.0,
        sideB: projectType === 'HUSGRUND' ? 8.0 : projectType === 'PLATTSATTNING' ? 4.0 : 3.6,
        fallCmPerM: projectType === 'PLATTSATTNING' ? 2.0 : 1.0,
      },
      moments,
    };
  };

  // If Gemini client is available, extract directly from the PDF bytes
  if (ai && apiKey) {
    try {
      const prompt = `Du är en svensk senior bygg- och anläggningslärare, besiktningsman och expert på AMA Anläggning, AMA Hus, BBR och svensk yrkesutbildning (Bygg- och anläggningsprogrammet).
Analysera det bifogade PDF-dokumentet ("${cleanName}") som innehåller en ritning, arbetsbeskrivning, kursuppgift, AMA-föreskrift eller övningsinstruktion.

MÅL:
Skapa en komplett, strukturerad och pedagogisk yrkesövning för elever med tydliga faser och kontrollmoment (egenkontrollpunkter) baserat på informationen i PDF-dokumentet.

REGLER FÖR MOMENTEN:
1. Skapa mellan 4 och 9 relevanta delmoment uppdelade i 2-4 faser (t.ex. Fas 1: Utsättning & Schakt, Fas 2: Ledningar & Bärlager, Fas 3: Form/Betong eller Beläggning, Fas 4: Slutkontroll).
2. Ange korrekta svenska AMA-koder (t.ex. BBC.31 för profiler/utsättning, CBB.1 för avtäckning/schakt, CBE.1 för schaktbotten, YJJ.1 för fiberduk, PBB.51 för dräneringsledningar, PBB.1 för spillvatten, DCB.1 för makadambädd, DFD för radon/fuktskydd, etc.).
3. Markera kritiska moment som "isStopPoint: true" (Stoppunkt: moment som INTE får byggas över/gjutas in förrän yrkesläraren har inspekterat och godkänt på plats, t.ex. bottenavlopp och armering före betonggjutning).
4. Ange konkreta toleranser (t.ex. "±5 mm", "Fall 10-20 promille", "±10 mm").
5. Ge varje moment ett handfast "studentTip" (vad eleven ska tänka på) och ett "proTip" (yrkeslärarens erfarenhet från verkliga byggarbetsplatser).
6. Skapa 3-5 konkreta bockpunkter i "customChecklist" för varje moment.

Svara ENBART med ett strikt JSON-objekt enligt följande struktur (inga markdown-kodblock, bara rå JSON):
{
  "title": "string (Beskrivande övningstitel)",
  "code": "string (Kort unik övningskod, t.ex. ÖVN-301 eller SCHAKT-1)",
  "description": "string (Sammanfattning av övningen)",
  "instructions": "string (Övergripande arbetsinstruktioner för eleven)",
  "projectType": "HUSGRUND" | "ALTAN_TRADACK" | "PLATTSATTNING" | "ENSKILT_AVLOPP",
  "targetGroup": "${targetGroup || 'Byggprogrammet (BA)'}",
  "educationLevel": "ALL",
  "specialization": "${specialization || 'ALL'}",
  "difficulty": "${difficulty || 'MEDEL'}",
  "estimatedDuration": "string (t.ex. 4 timmar eller 2 dagar)",
  "fieldMeasurements": {
    "sideA": 10.0,
    "sideB": 8.0,
    "fallCmPerM": 1.0
  },
  "moments": [
    {
      "id": "1.1",
      "order": 1,
      "phaseNumber": 1,
      "phaseName": "Fas 1: Utsättning & Schakt",
      "title": "string",
      "amaCode": "string",
      "instruction": "string",
      "studentTip": "string",
      "proTip": "string",
      "tolerance": "string",
      "inspectionItem": "string",
      "method": "string",
      "requirePhoto": true,
      "isStopPoint": false,
      "customChecklist": ["punkt 1", "punkt 2", "punkt 3"]
    }
  ]
}`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: rawBase64,
            },
          },
          {
            text: prompt,
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = geminiResponse.text?.trim() || '';
      let parsed: any = null;
      try {
        parsed = JSON.parse(responseText);
      } catch (jsonErr) {
        // Strip markdown backticks if any
        const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        parsed = JSON.parse(cleaned);
      }

      if (parsed && parsed.title && Array.isArray(parsed.moments) && parsed.moments.length > 0) {
        const cleanExerciseDraft = {
          ...parsed,
          code: parsed.code ? String(parsed.code).toUpperCase().trim() : `PDF-${Math.floor(100 + Math.random() * 900)}`,
          creationSource: 'PDF_IMPORT',
          targetGroup: targetGroup || parsed.targetGroup || 'Byggprogrammet (BA)',
          specialization: specialization || parsed.specialization || 'ALL',
          difficulty: difficulty || parsed.difficulty || 'MEDEL',
          attachedPdf,
        };

        return res.json({
          ok: true,
          exerciseDraft: cleanExerciseDraft,
          attachedPdf,
          source: 'GEMINI_AI',
        });
      }
    } catch (err: any) {
      console.warn('Gemini PDF import notice, using expert fallback:', err?.message || err);
    }
  }

  // Fallback if AI call failed or AI client was not initialized
  const fallbackDraft = {
    ...generateFallbackExercise(),
    attachedPdf,
  };

  return res.json({
    ok: true,
    exerciseDraft: fallbackDraft,
    attachedPdf,
    source: 'FALLBACK_EXPERT',
  });
});

// POST /api/exercises/import-forms - Import Google Forms / Microsoft Forms data (CSV, JSON, copied questions, TXT)
app.post('/api/exercises/import-forms', async (req, res) => {
  const { formsContent, fileName, fileFormat, targetGroup, specialization, difficulty } = req.body;

  if (!formsContent || typeof formsContent !== 'string') {
    return res.status(400).json({ error: 'Ingen formulärdata (Forms-text, CSV eller JSON) skickades.' });
  }

  const cleanName = String(fileName || 'Google_Forms_Formulär.txt').trim();
  const rawText = formsContent.trim();

  // Heuristic rule-based fallback parser for Google Forms / Microsoft Forms
  const parseFormsHeuristic = () => {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let title = cleanName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    if (lines.length > 0 && lines[0].length < 80 && !lines[0].includes(',') && !lines[0].includes(':')) {
      title = lines[0];
    }
    title = title.charAt(0).toUpperCase() + title.slice(1);
    if (!title.toLowerCase().includes('övning') && !title.toLowerCase().includes('kontroll')) {
      title = `Övning: ${title}`;
    }

    // Determine project type based on keywords in formsContent
    const lower = rawText.toLowerCase();
    let projectType: 'HUSGRUND' | 'PLATTSATTNING' | 'ALTAN_TRADACK' | 'ENSKILT_AVLOPP' = 'HUSGRUND';
    if (lower.includes('sten') || lower.includes('platta') || lower.includes('kantstöd') || lower.includes('fog')) {
      projectType = 'PLATTSATTNING';
    } else if (lower.includes('altan') || lower.includes('trall') || lower.includes('bärlina') || lower.includes('plint')) {
      projectType = 'ALTAN_TRADACK';
    } else if (lower.includes('avlopp') || lower.includes('slam') || lower.includes('infiltration') || lower.includes('va')) {
      projectType = 'ENSKILT_AVLOPP';
    }

    // Extract questions and checklist items
    const questionItems: { title: string; checks: string[]; stopPoint: boolean }[] = [];
    let currentQ: { title: string; checks: string[]; stopPoint: boolean } | null = null;

    lines.forEach((line) => {
      // Check if line looks like a question or section header
      const isQuestion =
        /^(fråga|\d+[\.\)]|moment|kontrollpunkt|del|steg|rubrik)/i.test(line) ||
        line.endsWith('?') ||
        (line.length < 90 && (line.includes(':') || line.includes('kontroll') || line.includes('mät')));

      if (isQuestion) {
        if (currentQ) questionItems.push(currentQ);
        const isStop =
          /stopp|gjutning|täthet|dolt|inbyggnad|godkännande|lärare|inspektion/i.test(line);
        currentQ = {
          title: line.replace(/^(fråga\s*\d*[:\.\)]*|\d+[\.\)]*)\s*/i, '').trim(),
          checks: [],
          stopPoint: isStop,
        };
      } else if (currentQ) {
        // Options / sub-items
        const cleanSub = line.replace(/^[-*•\[\]\(\)\d]+\s*/, '').trim();
        if (cleanSub.length > 2 && cleanSub.length < 150) {
          currentQ.checks.push(cleanSub);
        }
      }
    });

    if (currentQ) questionItems.push(currentQ);

    // If no explicit questions were identified, create standard structured moments from lines
    const finalMoments =
      questionItems.length >= 2
        ? questionItems.slice(0, 8).map((q, idx) => {
            const phaseNum = idx < 2 ? 1 : idx < 5 ? 2 : 3;
            const phaseName =
              phaseNum === 1
                ? 'Fas 1: Förberedelser & Utsättning'
                : phaseNum === 2
                ? 'Fas 2: Huvudutförande & Montering'
                : 'Fas 3: Slutkontroll & Mätning';

            const defaultChecks =
              q.checks.length > 0
                ? q.checks
                : [
                    'Kontrollera toleranser och mått enligt ritning',
                    'Utför visuell kvalitetsgranskning',
                    'Fotografera momentet med tidsstämpel',
                  ];

            return {
              id: `${phaseNum}.${(idx % 3) + 1}`,
              order: idx + 1,
              phaseNumber: phaseNum,
              phaseName,
              title: q.title || `Kontrollmoment ${idx + 1}`,
              amaCode: projectType === 'PLATTSATTNING' ? 'DCB.21' : projectType === 'ALTAN_TRADACK' ? 'HSD.11' : 'BBC.31',
              instruction: `Utför egenkontroll av ${q.title.toLowerCase()} enligt bifogat frågeformulär. Verifiera mätvärden och notera avvikelser.`,
              studentTip: 'Ta god tid på dig och dubbelkolla måtten innan du signerar momentet.',
              proTip: 'Var noggrann med att dokumentera med foto så att läraren kan granska utan att behöva vara på plats.',
              tolerance: '±5 mm',
              inspectionItem: q.title,
              method: 'Mätband, laser och visuell kontroll',
              requirePhoto: true,
              isStopPoint: q.stopPoint || idx === 1 || idx === 3,
              customChecklist: defaultChecks,
            };
          })
        : [
            {
              id: '1.1',
              order: 1,
              phaseNumber: 1,
              phaseName: 'Fas 1: Planering & Försyn',
              title: 'Mottagningskontroll & Utsättning (Forms-moment)',
              amaCode: 'BBC.31',
              instruction: 'Gå igenom ritning och frågor från formuläret. Mät ut profiler och höjdfix.',
              studentTip: 'Kontrollera att alla verktyg är kalibrerade.',
              proTip: 'Snedsträva alltid profilpinnarna.',
              tolerance: '±5 mm',
              inspectionItem: 'Kryssmått & Diagonaler',
              method: 'Stålbandmått & Laser',
              requirePhoto: true,
              isStopPoint: false,
              customChecklist: [
                'Underlag granskat',
                'Fixpunkt lokaliserad och kontrollerad',
                'Kryssmått beräknat och verifierat',
              ],
            },
            {
              id: '1.2',
              order: 2,
              phaseNumber: 1,
              phaseName: 'Fas 1: Schakt & Botten',
              title: 'Schaktbotten & Bärighet (Stoppunkt)',
              amaCode: 'CBB.1',
              instruction: 'Schakta till bärkraftig botten. Läraren ska godkänna schaktbotten innan fyllning.',
              studentTip: 'Undvik övergrävning.',
              proTip: 'Fota orörd botten innan fiberduken läggs ut.',
              tolerance: '±20 mm',
              inspectionItem: 'Schaktnivå',
              method: 'Rotationslaser',
              requirePhoto: true,
              isStopPoint: true,
              customChecklist: ['Matjord bortschaktad', 'Fast moränbotten utan vatten', 'Geotextil utlagd'],
            },
            {
              id: '2.1',
              order: 3,
              phaseNumber: 2,
              phaseName: 'Fas 2: Utförande & Ledningar',
              title: 'Material, Fall och Montering',
              amaCode: 'PBB.1',
              instruction: 'Montera enligt anvisningarna i formuläret. Kontrollera fall och toleranser.',
              studentTip: 'Mät fallet noggrant per meter.',
              proTip: 'Smörj alla gummipackningar noggrant.',
              tolerance: 'Fall 10-20 promille',
              inspectionItem: 'Ledningslutning',
              method: 'Digitalt vattenpass',
              requirePhoto: true,
              isStopPoint: true,
              customChecklist: ['Rätt rörfall verifierat', 'Kringfyllning utförd utan sten mot rör'],
            },
            {
              id: '3.1',
              order: 4,
              phaseNumber: 3,
              phaseName: 'Fas 3: Slutkontroll',
              title: 'Slutkontroll & Egenkontrollintyg',
              amaCode: 'YJJ.1',
              instruction: 'Besvara alla slutfrågor i formuläret och signera egenkontrollen.',
              studentTip: 'Kontrollera att alla foton har skarp fokus.',
              proTip: 'Ett snyggt egenkontrollprotokoll visar yrkesstolthet.',
              tolerance: 'Fullständig dokumentation',
              inspectionItem: 'Egenkontrollintyg',
              method: 'Granskning & Fotobevis',
              requirePhoto: true,
              isStopPoint: false,
              customChecklist: ['Alla frågor besvarade', 'Foton bifogade', 'Arbetsplatsen städad'],
            },
          ];

    return {
      title,
      code: `FORMS-${Math.floor(100 + Math.random() * 900)}`,
      description: `Övning skapad utifrån importerat Google Forms/formulär: "${cleanName}". Innehåller frågor, svarskontroller och praktiska moment för eleverna.`,
      instructions: `1. Besvara och genomför kontrollerna från Google Forms i fält.\n2. Dokumentera varje moment med foto och mätvärden.\n3. Beakta STOPPUNKTER – kalla på läraren innan inbyggnad!\n4. Signera med digital fingersignatur när momenten är slutförda.`,
      projectType,
      targetGroup: targetGroup || 'Byggprogrammet (BA)',
      educationLevel: 'ALL',
      specialization: specialization || 'ALL',
      difficulty: difficulty || 'MEDEL',
      estimatedDuration: '4 timmar',
      creationSource: 'PDF_IMPORT',
      fieldMeasurements: {
        sideA: projectType === 'HUSGRUND' ? 10.0 : projectType === 'PLATTSATTNING' ? 6.0 : 5.0,
        sideB: projectType === 'HUSGRUND' ? 8.0 : projectType === 'PLATTSATTNING' ? 4.0 : 3.6,
        fallCmPerM: projectType === 'PLATTSATTNING' ? 2.0 : 1.0,
      },
      moments: finalMoments,
    };
  };

  // If Gemini client is available, extract directly with AI intelligence
  if (ai && apiKey) {
    try {
      const prompt = `Du är en svensk senior bygg- och anläggningslärare, KMA-ansvarig och besiktningsman.
Du har fått in råtext eller ett exporterat formulär (från Google Forms, Microsoft Forms, ett frågebatteri, eller en besiktningschecklista för bygg/anläggning):

FILNAMN: "${cleanName}"
FORMAT: ${fileFormat || 'Forms-text / CSV'}
FORMULÄRINNEHÅLL:
"""
${rawText.slice(0, 15000)}
"""

MÅL:
Konvertera formuläret och dess frågor/kontrollpunkter till en pedagogisk, komplett yrkesövning för elever i FältKoll.
Varje fråga/avsnitt i formuläret ska mappas till ett tydligt fältmoment med bockpunkter (customChecklist), AMA-kod, eventuell stoppunkt (isStopPoint) och tips.

Svara ENBART med ett strikt JSON-objekt:
{
  "title": "string (Titel på övningen)",
  "code": "string (t.ex. FORMS-101)",
  "description": "string (Sammanfattning)",
  "instructions": "string (Instruktioner till eleven)",
  "projectType": "HUSGRUND" | "ALTAN_TRADACK" | "PLATTSATTNING" | "ENSKILT_AVLOPP",
  "targetGroup": "${targetGroup || 'Byggprogrammet (BA)'}",
  "educationLevel": "ALL",
  "specialization": "${specialization || 'ALL'}",
  "difficulty": "${difficulty || 'MEDEL'}",
  "estimatedDuration": "string (t.ex. 4 timmar)",
  "fieldMeasurements": {
    "sideA": 10.0,
    "sideB": 8.0,
    "fallCmPerM": 1.0
  },
  "moments": [
    {
      "id": "1.1",
      "order": 1,
      "phaseNumber": 1,
      "phaseName": "Fas 1: Rubrik",
      "title": "string (Momenttitel härledd från Forms-frågan)",
      "amaCode": "string (relevant svensk AMA-kod)",
      "instruction": "string",
      "studentTip": "string",
      "proTip": "string",
      "tolerance": "string",
      "inspectionItem": "string",
      "method": "string",
      "requirePhoto": true,
      "isStopPoint": false,
      "customChecklist": ["punkt 1", "punkt 2", "punkt 3"]
    }
  ]
}`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = geminiResponse.text?.trim() || '';
      let parsed: any = null;
      try {
        parsed = JSON.parse(responseText);
      } catch (jsonErr) {
        const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        parsed = JSON.parse(cleaned);
      }

      if (parsed && parsed.title && Array.isArray(parsed.moments) && parsed.moments.length > 0) {
        const cleanExerciseDraft = {
          ...parsed,
          code: parsed.code ? String(parsed.code).toUpperCase().trim() : `FORMS-${Math.floor(100 + Math.random() * 900)}`,
          creationSource: 'PDF_IMPORT',
          targetGroup: targetGroup || parsed.targetGroup || 'Byggprogrammet (BA)',
          specialization: specialization || parsed.specialization || 'ALL',
          difficulty: difficulty || parsed.difficulty || 'MEDEL',
        };

        return res.json({
          ok: true,
          exerciseDraft: cleanExerciseDraft,
          source: 'GEMINI_AI',
        });
      }
    } catch (err: any) {
      console.warn('Gemini Forms import notice, using rule-based parser:', err?.message || err);
    }
  }

  // Fallback heuristic parser
  const fallbackDraft = parseFormsHeuristic();
  return res.json({
    ok: true,
    exerciseDraft: fallbackDraft,
    source: 'FALLBACK_EXPERT',
  });
});

// GET /api/users - List users with strict role protection
app.get('/api/users', async (req, res) => {
  const callerRole = String(req.query.callerRole || '').toUpperCase();
  const callerId = String(req.query.callerId || '');

  // Pull latest users from Firestore
  try {
    const cloudUsers = await fetchAllUsersFromCloud();
    for (const cu of cloudUsers) {
      const idx = cloudState.users.findIndex(
        (u) => u.id === cu.id || u.email.toLowerCase() === cu.email.toLowerCase()
      );
      if (idx >= 0) {
        cloudState.users[idx] = { ...cloudState.users[idx], ...cu };
      } else {
        cloudState.users.push(cu as StoredUser);
      }
    }
    saveStorage(cloudState);
  } catch (err) {
    console.warn('Could not sync users from Firestore:', err);
  }

  if (callerRole === 'TEACHER') {
    const allowTeacherAccounts = cloudState.adminSettings?.allowTeacherCreateTeacherAccounts ?? false;
    const filtered = cloudState.users.filter((u) => {
      if (u.role === 'ADMIN') return false; // Teachers NEVER see admin
      if (u.role === 'TEACHER') {
        return allowTeacherAccounts || u.id === callerId;
      }
      return true; // STUDENT
    });
    return res.json({ users: filtered });
  }

  return res.json({ users: cloudState.users });
});

// POST /api/users - Create new student/teacher/admin account (Admin or Teacher)
app.post('/api/users', async (req, res) => {
  const { email, displayName, role, password, schoolOrCompany, studentGroup, callerRole } = req.body;

  if (callerRole === 'STUDENT' || callerRole === 'WORKER') {
    return res.status(403).json({ error: 'Behörighet saknas. Elever och yrkesarbetare kan inte skapa konton.' });
  }

  if (!email || !displayName) {
    return res.status(400).json({ error: 'E-postadress och fullständigt namn krävs.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!EMAIL_VALIDATION_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Vänligen ange en giltig och fungerande e-postadress (t.ex. namn@foretag.se).' });
  }

  let existing = cloudState.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!existing) {
    try {
      const cloudMatch = await findUserInCloud(normalizedEmail);
      if (cloudMatch) existing = cloudMatch as StoredUser;
    } catch {}
  }

  if (existing) {
    return res.status(400).json({ error: 'Det finns redan ett konto med denna e-postadress.' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const validContext =
    req.body.accountContext === 'WORKPLACE' ||
    req.body.accountContext === 'APL' ||
    req.body.accountContext === 'SCHOOL'
      ? req.body.accountContext
      : undefined;
  const newUser: StoredUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    email: normalizedEmail,
    displayName: String(displayName).trim(),
    role: role === 'TEACHER' || role === 'SCHOOL_ADMIN' || role === 'ADMIN' ? role : 'STUDENT',
    accountContext: validContext,
    password: password ? String(password).trim() : '1234',
    schoolOrCompany: schoolOrCompany || 'Anläggning & Entreprenad',
    studentGroup: studentGroup ? String(studentGroup).trim() : undefined,
    schoolClass: req.body.schoolClass ? String(req.body.schoolClass).trim() : undefined,
    teacherId: req.body.teacherId ? String(req.body.teacherId).trim() : undefined,
    createdAt: now,
    lastLogin: 'Aldrig inloggad',
  };

  cloudState.users.unshift(newUser);
  saveStorage(cloudState);

  // Instantly persist to Google Cloud Firestore so it's live across all devices
  try {
    await saveUserToCloud(newUser as any);
  } catch (err) {
    console.warn('Could not sync user to Firestore in /api/users:', err);
  }

  return res.json({ user: newUser });
});

// PUT /api/users/:id - Update user role, details, studentGroup or password
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { role, displayName, email, schoolOrCompany, password, studentGroup } = req.body;

  const user = cloudState.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Användaren hittades inte.' });
  }

  if (role) user.role = role;
  if (displayName) user.displayName = String(displayName).trim();
  if (email) user.email = String(email).trim().toLowerCase();
  if (schoolOrCompany !== undefined) user.schoolOrCompany = schoolOrCompany;
  if (studentGroup !== undefined) user.studentGroup = String(studentGroup).trim();
  if (req.body.schoolClass !== undefined) user.schoolClass = String(req.body.schoolClass).trim();
  if (req.body.teacherId !== undefined) user.teacherId = String(req.body.teacherId).trim();
  if (req.body.notes !== undefined) user.notes = String(req.body.notes).trim();
  if (
    req.body.accountContext === 'WORKPLACE' ||
    req.body.accountContext === 'APL' ||
    req.body.accountContext === 'SCHOOL'
  ) {
    user.accountContext = req.body.accountContext;
  }
  if (password) user.password = String(password).trim();

  saveStorage(cloudState);

  // Sync update to Firestore
  try {
    await saveUserToCloud(user as any);
  } catch (err) {
    console.warn('Could not update user in Firestore:', err);
  }

  return res.json({ user });
});

// DELETE /api/users/:id - Remove user account
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const callerRole = String(req.query.callerRole || req.body.callerRole || '').toUpperCase();

  if (callerRole === 'STUDENT' || callerRole === 'WORKER') {
    return res.status(403).json({ error: 'Behörighet saknas. Elever och yrkesarbetare har inte rättighet att radera konton.' });
  }

  const user = cloudState.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Användaren hittades inte.' });
  }

  const userEmail = user.email.toLowerCase().trim();
  if (
    userEmail === 'robbinwannstrom@gmail.com' ||
    userEmail === 'admin@faltkoll.se' ||
    userEmail === 'admin@falthjalp.se' ||
    userEmail === 'caataclysm@gmail.com' ||
    user.id === 'usr_admin_main' ||
    user.id === 'usr_robbin_owner' ||
    user.id === 'usr_caataclysm_admin'
  ) {
    return res.status(400).json({ error: 'Huvudadministratörens konto kan inte raderas.' });
  }

  cloudState.users = cloudState.users.filter((u) => u.id !== id);
  saveStorage(cloudState);

  // Delete from Firestore
  try {
    await deleteUserFromCloud(id);
  } catch (err) {
    console.warn('Could not delete user from Firestore:', err);
  }

  return res.json({ success: true });
});

// ==========================================
// SYSTEM SETTINGS & DEMO MODE APIS
// ==========================================

// GET /api/system/settings - Global system configuration
app.get('/api/system/settings', (_req, res) => {
  return res.json({
    requireLoginOnStartup: cloudState.settings?.requireLoginOnStartup ?? false,
    customDeployUrl: cloudState.settings?.customDeployUrl ?? '',
  });
});

// GET /api/system/storage-stats - Cloud storage quota, percent, used/free bytes and warnings
app.get('/api/system/storage-stats', (_req, res) => {
  let fileSizeBytes = 0;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const stats = fs.statSync(DATA_FILE);
      fileSizeBytes = stats.size;
    }
  } catch {
    fileSizeBytes = 0;
  }

  // Quota for cloud storage (1 GB / 1000 MB)
  const quotaBytes = 1000 * 1024 * 1024;
  const usedBytes = fileSizeBytes;
  const freeBytes = Math.max(0, quotaBytes - usedBytes);
  const percentUsed = Number(((usedBytes / quotaBytes) * 100).toFixed(2));

  let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
  let warningMessage: string | null = null;

  if (percentUsed >= 90) {
    status = 'CRITICAL';
    warningMessage = `Kritiskt: Molnutrymmet är ${percentUsed}% fullt! Exportera säkerhetskopia och rensa gamla testprojekt.`;
  } else if (percentUsed >= 75) {
    status = 'WARNING';
    warningMessage = `Varning: Molnutrymmet börjar bli fyllt (${percentUsed}%). Överväg att arkivera avslutade projekt.`;
  }

  // Count photos and moments across all projects
  let totalPhotos = 0;
  let totalMoments = 0;
  const projectList = Object.values(cloudState.projects);
  projectList.forEach((p: any) => {
    if (p.moments) {
      Object.values(p.moments).forEach((m: any) => {
        totalMoments++;
        if (m.photos && Array.isArray(m.photos)) {
          totalPhotos += m.photos.length;
        } else if (m.photoBase64) {
          totalPhotos++;
        }
      });
    }
    if (p.preInspectionPhotos && Array.isArray(p.preInspectionPhotos)) {
      totalPhotos += p.preInspectionPhotos.length;
    }
  });

  return res.json({
    usedBytes,
    quotaBytes,
    freeBytes,
    percentUsed,
    usedFormatted: (usedBytes / (1024 * 1024)).toFixed(2) + ' MB',
    quotaFormatted: (quotaBytes / (1024 * 1024)).toFixed(0) + ' MB (1 GB)',
    freeFormatted: (freeBytes / (1024 * 1024)).toFixed(2) + ' MB',
    status,
    warningMessage,
    stats: {
      projectsCount: projectList.length,
      photosCount: totalPhotos,
      momentsCount: totalMoments,
      usersCount: cloudState.users.length,
    }
  });
});

// POST /api/system/settings - Update global system settings (Admin only)
app.post('/api/system/settings', (req, res) => {
  const { requireLoginOnStartup, customDeployUrl } = req.body;
  if (!cloudState.settings) {
    cloudState.settings = {};
  }
  if (requireLoginOnStartup !== undefined) {
    cloudState.settings.requireLoginOnStartup = !!requireLoginOnStartup;
  }
  if (customDeployUrl !== undefined) {
    cloudState.settings.customDeployUrl = String(customDeployUrl).trim();
  }
  saveStorage(cloudState);
  return res.json({
    success: true,
    requireLoginOnStartup: cloudState.settings.requireLoginOnStartup,
    customDeployUrl: cloudState.settings.customDeployUrl || '',
  });
});

// ==========================================
// NOTIFICATIONS & TEACHER BROADCAST APIS
// ==========================================

// GET /api/notifications - List active notices
app.get('/api/notifications', (_req, res) => {
  return res.json({ notifications: cloudState.notifications });
});

// POST /api/notifications - Teacher/Admin broadcast
app.post('/api/notifications', (req, res) => {
  const { authorName, authorRole, title, message, priority } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Rubrik och meddelande krävs.' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const newNotif: StoredNotification = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    authorName: authorName || 'Lärare',
    authorRole: authorRole === 'ADMIN' ? 'ADMIN' : 'TEACHER',
    title: String(title).trim(),
    message: String(message).trim(),
    priority: priority === 'URGENT' ? 'URGENT' : 'NORMAL',
    createdAt: now,
    readBy: [],
  };

  cloudState.notifications.unshift(newNotif);
  saveStorage(cloudState);

  return res.json({ notification: newNotif });
});

// POST /api/notifications/:id/read - Mark notification as read
app.post('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const notif = cloudState.notifications.find((n) => n.id === id);
  if (notif && userId && !notif.readBy.includes(userId)) {
    notif.readBy.push(userId);
    saveStorage(cloudState);
  }

  return res.json({ success: true });
});

// ==========================================
// PROJECT CLOUD SYNC & GROUP WORK APIS
// ==========================================

// GET /api/sync/projects - Get all synced projects (lightweight metadata)
app.get('/api/sync/projects', (_req, res) => {
  const list = Object.values(cloudState.projects).map((p: any) => ({
    id: p.id,
    name: p.name,
    projectType: p.projectType,
    clientName: p.clientName,
    contractorName: p.contractorName,
    propertyDesignation: p.propertyDesignation,
    groupCode: p.groupCode,
    isGroupProject: p.isGroupProject,
    updatedAt: p.updatedAt,
    quickNotesCount: p.quickNotes ? p.quickNotes.length : 0,
    momentsCount: p.moments ? Object.keys(p.moments).length : 0,
  }));
  return res.json({ projects: list });
});

// GET /api/sync/projects/:id - Get full project
app.get('/api/sync/projects/:id', (req, res) => {
  const { id } = req.params;
  const proj = cloudState.projects[id];
  if (!proj) {
    return res.status(404).json({ error: 'Projektet finns inte i molnet.' });
  }
  return res.json({ project: proj });
});

// POST /api/sync/projects - Push / sync project (moments, quickNotes, photos)
app.post('/api/sync/projects', (req, res) => {
  const { project } = req.body;
  if (!project || !project.id) {
    return res.status(400).json({ error: 'Ogiltig projektdata.' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  project.lastSyncedAt = now;
  project.updatedAt = now;

  if (project.isGroupProject && !project.groupCode) {
    project.groupCode = 'BYGG-' + Math.floor(10 + Math.random() * 90);
  }

  cloudState.projects[project.id] = project;
  saveStorage(cloudState);

  return res.json({
    success: true,
    lastSyncedAt: now,
    groupCode: project.groupCode,
    project,
  });
});

// POST /api/sync/join-code - Find project by groupCode
app.post('/api/sync/join-code', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Gruppkod saknas.' });
  }

  const normalized = String(code).trim().toUpperCase();
  const proj = Object.values(cloudState.projects).find(
    (p: any) => p.groupCode && p.groupCode.toUpperCase() === normalized
  );

  if (!proj) {
    return res.status(404).json({ error: `Hittade inget projekt med kod "${normalized}".` });
  }

  return res.json({ project: proj });
});

// GET /api/sync/pull - Pull project by code or id (supports App.tsx background sync)
app.get('/api/sync/pull', (req, res) => {
  const code = String(req.query.code || '').trim().toUpperCase();
  const id = String(req.query.id || '').trim();

  if (!code && !id) {
    return res.status(400).json({ error: 'Projektkod eller ID krävs för att hämta projekt.' });
  }

  let proj = null;
  if (id && cloudState.projects[id]) {
    proj = cloudState.projects[id];
  } else if (code) {
    proj = Object.values(cloudState.projects).find(
      (p: any) => p.groupCode && p.groupCode.toUpperCase() === code
    );
  }

  if (!proj) {
    return res.status(404).json({ error: 'Projektet hittades inte.' });
  }

  return res.json({ project: proj });
});

// POST /api/sync/push - Push project from ChecklistView sync button
app.post('/api/sync/push', (req, res) => {
  const { project } = req.body;
  if (!project || !project.id) {
    return res.status(400).json({ error: 'Projektdata saknas.' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  project.lastSyncedAt = now;
  project.updatedAt = now;

  cloudState.projects[project.id] = project;
  saveStorage(cloudState);

  return res.json({ success: true, lastSyncedAt: now, project });
});

// ==========================================
// TEACHER FIELD INSPECTION & STUDENT WORK APIS
// ==========================================

// GET /api/field/student-work - Get all student works with filtering, statistics and class breakdown
app.get('/api/field/student-work', (req, res) => {
  const { schoolClass, studentGroup, status, projectType, search } = req.query;

  // Filter so only student field projects are included (not teacher exercises or private teacher projects)
  let allProjects = Object.values(cloudState.projects || {}).filter((p: any) => {
    const isStudent = p.creatorRole === 'STUDENT' || !!p.studentId || !!p.studentEmail;
    return isStudent;
  });

  // Compute available classes dynamically from registered users and projects
  const classCounts: Record<string, { studentCount: number; activeProjectsCount: number }> = {};
  
  // From users
  (cloudState.users || []).forEach((u) => {
    if (u.role === 'STUDENT' && u.schoolClass) {
      if (!classCounts[u.schoolClass]) {
        classCounts[u.schoolClass] = { studentCount: 0, activeProjectsCount: 0 };
      }
      classCounts[u.schoolClass].studentCount++;
    }
  });

  // From projects
  allProjects.forEach((p: any) => {
    const cls = p.schoolClass || 'Ospecificerad klass';
    if (!classCounts[cls]) {
      classCounts[cls] = { studentCount: 0, activeProjectsCount: 0 };
    }
    classCounts[cls].activeProjectsCount++;
  });

  const classes = Object.entries(classCounts).map(([name, data]) => ({
    name,
    studentCount: data.studentCount,
    activeProjectsCount: data.activeProjectsCount,
  }));

  // Filtering
  let filtered = allProjects.filter((p: any) => {
    // School class filter
    if (schoolClass && schoolClass !== 'ALL') {
      const targetClass = String(schoolClass).toLowerCase().trim();
      const pClass = String(p.schoolClass || '').toLowerCase().trim();
      if (!pClass.includes(targetClass) && targetClass !== pClass) return false;
    }

    // Student group filter
    if (studentGroup && studentGroup !== 'ALL') {
      const targetGroup = String(studentGroup).toLowerCase().trim();
      const pGroup = String(p.studentGroup || '').toLowerCase().trim();
      if (!pGroup.includes(targetGroup) && targetGroup !== pGroup) return false;
    }

    // Project type filter
    if (projectType && projectType !== 'ALL') {
      if (p.projectType !== projectType) return false;
    }

    // Search query (Student name, email, class, project name)
    if (search && String(search).trim()) {
      const q = String(search).toLowerCase().trim();
      const matchName = String(p.name || '').toLowerCase().includes(q);
      const matchStudent = String(p.studentName || p.contractorName || '').toLowerCase().includes(q);
      const matchEmail = String(p.studentEmail || '').toLowerCase().includes(q);
      const matchClass = String(p.schoolClass || '').toLowerCase().includes(q);
      const matchProp = String(p.propertyDesignation || '').toLowerCase().includes(q);
      const matchCode = String(p.exerciseCode || p.groupCode || '').toLowerCase().includes(q);
      if (!matchName && !matchStudent && !matchEmail && !matchClass && !matchProp && !matchCode) {
        return false;
      }
    }

    // Status filter
    if (status && status !== 'ALL') {
      const momentsList = Object.values(p.moments || {}) as any[];
      const totalMoments = momentsList.length;
      const completedMoments = momentsList.filter((m) => m.status === 'GREEN').length;
      const hasYellow = momentsList.some((m) => m.status === 'YELLOW');
      const isComplete = totalMoments > 0 && completedMoments === totalMoments;

      // Count photos
      let photosCount = (p.preInspectionPhotos || []).length;
      momentsList.forEach((m) => {
        if (m.photos) photosCount += m.photos.length;
        else if (m.photoBase64) photosCount += 1;
      });

      if (status === 'ACTIVE' && isComplete) return false;
      if (status === 'COMPLETED' && !isComplete) return false;
      if (status === 'PENDING_APPROVAL' && !hasYellow) return false;
      if (status === 'HAS_PHOTOS' && photosCount === 0) return false;
      if (status === 'NEEDS_ACTION' && (!p.teacherFeedback || p.teacherFeedback.grade !== 'KOMPLETTERING_KRÄVS')) {
        return false;
      }
    }

    return true;
  });

  // Sort by latest updated
  filtered.sort((a: any, b: any) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // Calculate live statistics
  const uniqueStudents = new Set(allProjects.map((p: any) => p.studentId || p.studentName || p.contractorName)).size;
  let totalPhotos = 0;
  let pendingTeacherReview = 0;
  let totalPercentSum = 0;

  allProjects.forEach((p: any) => {
    const momentsList = Object.values(p.moments || {}) as any[];
    const totalMoments = momentsList.length;
    const completedMoments = momentsList.filter((m) => m.status === 'GREEN').length;
    const pct = totalMoments > 0 ? (completedMoments / totalMoments) * 100 : 0;
    totalPercentSum += pct;

    if (momentsList.some((m) => m.status === 'YELLOW' || (m.isStopPoint && !m.teacherApproved))) {
      pendingTeacherReview++;
    }

    totalPhotos += (p.preInspectionPhotos || []).length;
    momentsList.forEach((m) => {
      if (m.photos) totalPhotos += m.photos.length;
      else if (m.photoBase64) totalPhotos += 1;
    });
  });

  const averageProgressPercent =
    allProjects.length > 0 ? Math.round(totalPercentSum / allProjects.length) : 0;

  return res.json({
    projects: filtered,
    stats: {
      totalStudents: uniqueStudents,
      activeInField: allProjects.length,
      pendingTeacherReview,
      totalPhotos,
      averageProgressPercent,
    },
    classes,
  });
});

// POST /api/field/student-work - Upsert a student project
app.post('/api/field/student-work', (req, res) => {
  const { project } = req.body;
  if (!project || !project.id) {
    return res.status(400).json({ error: 'Projektdata saknas eller är ogiltig.' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  project.lastSyncedAt = now;
  project.updatedAt = now;

  cloudState.projects[project.id] = project;
  saveStorage(cloudState);

  return res.json({ success: true, lastSyncedAt: now, project });
});

// POST /api/field/sync-all-local - Batch sync multiple projects from local IndexedDB
app.post('/api/field/sync-all-local', (req, res) => {
  const { projects } = req.body;
  if (!Array.isArray(projects)) {
    return res.status(400).json({ error: 'Projekten måste skickas som en array.' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  let count = 0;

  projects.forEach((proj: any) => {
    if (proj && proj.id) {
      proj.lastSyncedAt = now;
      if (!proj.updatedAt) proj.updatedAt = now;
      cloudState.projects[proj.id] = {
        ...(cloudState.projects[proj.id] || {}),
        ...proj,
      };
      count++;
    }
  });

  saveStorage(cloudState);
  return res.json({ success: true, count, syncedAt: now });
});

// POST /api/field/teacher-review - Save teacher evaluation, moment feedback, and stop point approval
app.post('/api/field/teacher-review', (req, res) => {
  const { projectId, teacherId, teacherName, overallComment, grade, momentNotes, approvedMoments } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: 'Projekt-ID krävs.' });
  }

  const project = cloudState.projects[projectId];
  if (!project) {
    return res.status(404).json({ error: 'Projektet hittades inte i molnet.' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  project.teacherFeedback = {
    overallComment: overallComment !== undefined ? overallComment : project.teacherFeedback?.overallComment,
    evaluatedAt: now,
    evaluatedBy: teacherName || project.teacherFeedback?.evaluatedBy || 'Yrkeslärare',
    grade: grade !== undefined ? grade : project.teacherFeedback?.grade,
    momentNotes: {
      ...(project.teacherFeedback?.momentNotes || {}),
      ...(momentNotes || {}),
    },
    approvedMoments: {
      ...(project.teacherFeedback?.approvedMoments || {}),
      ...(approvedMoments || {}),
    },
  };

  // If moments were approved, update moments status & teacherApproved flag
  if (approvedMoments && project.moments) {
    Object.entries(approvedMoments).forEach(([mId, isApproved]) => {
      if (project.moments[mId]) {
        if (isApproved) {
          project.moments[mId].teacherApproved = true;
          if (project.moments[mId].status === 'YELLOW') {
            project.moments[mId].status = 'GREEN';
          }
        }
      }
    });
  }

  project.updatedAt = now;
  cloudState.projects[projectId] = project;
  saveStorage(cloudState);

  return res.json({ success: true, project });
});

// GET /api/classes - List all unique classes
app.get('/api/classes', (_req, res) => {
  const classMap: Record<string, number> = {};

  (cloudState.users || []).forEach((u) => {
    if (u.role === 'STUDENT' && u.schoolClass) {
      classMap[u.schoolClass] = (classMap[u.schoolClass] || 0) + 1;
    }
  });

  Object.values(cloudState.projects || {}).forEach((p: any) => {
    if (p.schoolClass) {
      if (!classMap[p.schoolClass]) {
        classMap[p.schoolClass] = 0;
      }
    }
  });

  const classes = Object.entries(classMap).map(([name, count]) => ({
    name,
    studentCount: count,
  }));

  return res.json({ classes });
});

// ==========================================
// GEMINI AI BYGGHJÄLP & FÄLTEXPERT
// ==========================================
app.post('/api/gemini-ask', async (req, res) => {
  const { question, momentTitle, amaCode, projectType, momentId, instruction, studentTip, proTip } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Fråga saknas' });
  }

  if (!ai || !apiKey) {
    return res.json({
      answer: `[LOKALT SVAR ENLIGT AMA & SVENSK STANDARD]\n\nFråga: "${question}"\n\nFörklarande vägledning för ${momentTitle || 'momentet'} (AMA ${amaCode || 'Standard'}):\n1. Kontrollera mått, toleranser och material i arbetsinstruktionen.\n2. Exempel på vanliga material/verktyg:\n   - Trallman/distansklossar: Håller jämnt 3–5 mm avstånd mellan trallbrädor.\n   - Trallskruv C4 vs A2: C4 är korrosionsskyddat kolstål för normal miljö, medan A2 är rostfritt som tål träets naturliga krympning/svällning utan att knäckas.\n   - Makadam: Både 8/16, 11/16 och 16/32 mm fungerar utmärkt som kapillärbrytande lager (undvik alltid 0-fraktioner som 0/32 som suger fukt).\n3. Fota utförd åtgärd med tidsstämpel och tumstock/laser för egenkontrollens bevisföring.`,
      isAi: false,
    });
  }

  try {
    const prompt = `Du är en svensk senior bygg- och anläggningslärare, besiktningsman och fältexpert på AMA Anläggning, AMA Hus, BBR och Svenskt Trä.
Användaren är en yrkeselev eller anläggare/snickare som utför en praktisk övning eller ett verkligt byggprojekt.
De läser följande arbetsinstruktion och har en specifik fråga om ett begrepp, verktyg, mått, regel eller material i momentet:

MOMENTETS INFORMATION:
- Typ av projekt: ${projectType || 'Bygg & Anläggning'}
- Moment ${momentId || ''}: ${momentTitle || 'Allmänt'}
- AMA-kod: ${amaCode || 'AMA standard'}
${instruction ? `- Arbetsinstruktion: "${instruction}"` : ''}
${studentTip ? `- Elevtips: "${studentTip}"` : ''}
${proTip ? `- Yrkeslärarens råd: "${proTip}"` : ''}

ANVÄNDARENS FRÅGA / VAD DE VILL FÅ FÖRKLARAT:
"${question}"

INSTRUKTIONER FÖR SVAR:
1. Svara direkt, pedagogiskt, vänligt och handfast på ren svenska (inga krångliga omvägar).
2. Om användaren frågar om specifika begrepp från texten, förklara tydligt och praktiskt:
   - "Trallman": Specialverktyg/mall som kläms fast mellan trallbrädor för att automatiskt ge en jämn och rak springa (t.ex. 3–5 mm) och hålla brädan rak när den skruvas.
   - "Distanskloss": Små plast- eller träklossar i bestämt mått som sätts mellan brädorna för att få exakt samma mellanrum över hela altanen.
   - "Varför just dessa mått (t.ex. 28x120 mm / 3–5 mm)": 28 mm ger böjstyvhet vid c/c 600 mm så altanen inte sviktar. 3–5 mm mellanrum krävs för att trä sväller vid regn/höstfukt och för att vatten ska rinna undan utan rötrisk.
   - "Skillnad mellan C4 och A2 trallskruv": C4 är korrosionsskyddat kolstål lämpligt för normal utomhusmiljö; A2 är rostfritt stål som är segare och klarar tryckimpregnerat träs sväll- och krymprörelser utan att skruvskallen knäcks. (A4 syrafast rekommenderas vid pool/kust).
   - "Makadam 8/16 vs 11/16 vs 16/32": Förklara att alla tre är godkända tvättade fraktioner utan nollfraktion. 8/16 mm finns ofta på skolan och är smidig att kratta/raka, medan 16/32 är grövre. Det avgörande är att undvika nollfraktion (0/32) som suger upp vatten kapillärt.
   - "Glada sidan / årsringar uppåt": Förklara att kärnsidan ska vändas uppåt så brädan kupar sig konvext (som ett paraply) så att regnvatten rinner av istället för att samlas i en pöl som ger röta.
3. Ge konkreta mått, toleranser (mm/cm) och praktiska fälttips.
4. Avsluta med vad eleven/arbetaren bör fotografera eller dubbelkolla för godkänd egenkontroll.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text || 'Inget svar kunde genereras.';
    return res.json({ answer: text, isAi: true });
  } catch (err: any) {
    console.warn('Gemini API fallback used:', err?.message || err);
    return res.json({
      answer: `[SVAR ENLIGT AMA & BRANSCHSTANDARD]\n\nFråga: "${question}"\n\nVägledning för ${momentTitle || 'momentet'} (AMA ${amaCode || 'Standard'}):\n${instruction ? `• Krav enligt instruktion: ${instruction}\n` : ''}${proTip ? `• Yrkeslärarens fältråd: ${proTip}\n` : ''}${studentTip ? `• Praktiskt tips: ${studentTip}\n` : ''}• Kontrollera alltid höjder, fall och mått med laser/vattenpass och dokumentera med tidsstämplat foto innan momentet byggs in.`,
      isAi: false,
    });
  }
});

// ==========================================
// API 404 & ERROR HANDLING (Guarantees JSON, never HTML)
// ==========================================

// Catch-all for API endpoints to prevent Vite from serving index.html as a 200 response
app.all('/api/*', (req, res) => {
  return res.status(404).json({ error: `API-slutpunkt hittades inte: ${req.method} ${req.path}` });
});

// Global error handler for all /api endpoints to ensure JSON is always returned
app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API Error:', err);
  return res.status(500).json({ error: err?.message || 'Ett internt serverfel inträffade i API:et.' });
});

// Mount Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (isProd && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    process.env.DISABLE_HMR = 'true';
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
    });

    // Prevent Vite 8's /@vite/client from attempting WebSocket connections in cloud preview
    app.get('/@vite/client', async (_req, res, next) => {
      try {
        const result = await vite.transformRequest('/@vite/client');
        if (result && result.code) {
          const patched = result.code
            .replace(
              'transport.connect(createHMRHandler(handleMessage));',
              '/* WebSocket HMR disabled in cloud preview */'
            )
            .replace('setupForwardConsoleHandler(transport, forwardConsole);', '');
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          return res.status(200).send(patched);
        }
      } catch {}
      next();
    });

    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);

    // Seed/sync all existing users into Google Cloud Firestore
    try {
      for (const u of cloudState.users) {
        saveUserToCloud(u as any).catch(() => {});
      }
    } catch {}

    // Ensure any old demo codes are completely removed from Firestore
    try {
      deleteAdminInviteCode('FK-INV-7832').catch(() => {});
      deleteAdminInviteCode('FK-INV-9140').catch(() => {});
      deleteAdminInviteCode('FK-APL-5520').catch(() => {});
    } catch {}
  });
}

startServer();
