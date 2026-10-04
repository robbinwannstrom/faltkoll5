import { Project, ProjectType, UserSettings } from '../types';
import { ALL_MOMENTS } from '../data/momentsData';

const DB_NAME = 'FaltKoll_OfflineDB_v1';
const STORE_NAME = 'projects';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB stöds inte i denna webbläsare.'));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('IndexedDB anslutning tog för lång tid.'));
    }, 2000);

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        clearTimeout(timer);
        resolve(request.result);
      };
      request.onerror = () => {
        clearTimeout(timer);
        reject(request.error);
      };
      request.onblocked = () => {
        clearTimeout(timer);
        reject(new Error('IndexedDB är blockerad av annan flik.'));
      };
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

export async function getAllProjects(includeDeleted = false): Promise<Project[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const result = (req.result || []) as Project[];
        // Filter out any previous mock demo projects completely
        let filtered = result.filter(
          (p) => !p.name.includes('Villa Lindängen') && !p.name.includes('Byström Entre')
        );

        if (!includeDeleted) {
          filtered = filtered.filter((p) => !p.isDeleted);
        }

        filtered.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
        );
        resolve(filtered);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB read error, falling back to localStorage', err);
    const local = localStorage.getItem('faltkoll_projects_fallback');
    const all = local ? JSON.parse(local) : [];
    return includeDeleted ? all : all.filter((p: Project) => !p.isDeleted);
  }
}

export async function getDeletedProjects(): Promise<Project[]> {
  const all = await getAllProjects(true);
  return all.filter((p) => !!p.isDeleted);
}

export async function softDeleteProject(id: string): Promise<void> {
  const project = await getProjectById(id);
  if (project) {
    project.isDeleted = true;
    project.deletedAt = getFormattedCurrentTime();
    await saveProject(project);
  }
}

export async function restoreProject(id: string): Promise<void> {
  const project = await getProjectById(id);
  if (project) {
    project.isDeleted = false;
    delete project.deletedAt;
    await saveProject(project);
  }
}

export async function permanentDeleteProject(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function emptyTrash(): Promise<void> {
  const deleted = await getDeletedProjects();
  for (const p of deleted) {
    await permanentDeleteProject(p.id);
  }
}

export async function clearAllProjectsFromDB(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error clearing IndexedDB:', err);
  }
  try {
    localStorage.removeItem('faltkoll_projects_fallback');
  } catch {}
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB read single error', err);
    const projects = await getAllProjects(true);
    return projects.find((p) => p.id === id) || null;
  }
}

export async function saveProject(project: Project): Promise<void> {
  project.updatedAt = getFormattedCurrentTime();
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(project);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB write error, saving to localStorage', err);
  }

  // Backup cache
  try {
    const all = await getAllProjects();
    const updated = all.filter((p) => p.id !== project.id);
    updated.unshift(project);
    const light = updated.map((p) => ({
      ...p,
      moments: Object.fromEntries(
        Object.entries(p.moments).map(([k, v]) => [
          k,
          {
            ...v,
            photoBase64: v.photoBase64 ? '[BILD_SPARAD_I_INDEXEDDB]' : undefined,
            photos: v.photos ? v.photos.map((ph) => ({ ...ph, dataUrl: '[BILD_SPARAD]' })) : undefined,
          },
        ])
      ),
    }));
    localStorage.setItem('faltkoll_projects_cache', JSON.stringify(light));
  } catch {
    // Ignore quota limits
  }
}

export function getUserSettings(): UserSettings {
  const defaults: UserSettings = {
    userName: '',
    companyName: '',
    preferredProjectType: 'ALL',
    easyFieldMode: true,
    hasSeenWizard: true,
    enableTutorialGuide: false,
    reportLayout: 'AMA_STANDARD',
    appExperienceLevel: 'STANDARD',
    appLayoutMode: 'SIMPLE_LIST',
    colorPalette: 'ORANGE_WORK',
    preInspectionPreference: 'ALWAYS_ASK',
    userUsageProfile: 'PRIVATE',
    featureCrossMeasure: true,
    featureFieldNotes: true,
    featureAiHelper: true,
    featurePreInspection: true,
    featurePhotoWatermark: true,
    saveToDeviceGallery: false,
    requirePhotoToComplete: false,
    featureCloudSync: true,
    featureTeacherAlerts: true,
  };

  try {
    const raw = localStorage.getItem('faltkoll_user_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    }
  } catch (e) {
    console.warn('Could not read user settings', e);
  }
  return defaults;
}

export function saveUserSettings(settings: UserSettings): void {
  try {
    localStorage.setItem('faltkoll_user_settings', JSON.stringify(settings));
  } catch (e) {
    console.warn('Could not save user settings', e);
  }
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function getFormattedCurrentTime(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function initializeNewProject(
  name: string,
  projectType: ProjectType,
  propertyDesignation: string,
  clientName: string,
  contractorName: string,
  notes = '',
  projectNumber = '',
  applicableDocs = 'Bygghandling, AMA Anläggning 20'
): Project {
  const id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = getFormattedCurrentTime();

  const momentsRecord: Project['moments'] = {};
  const relevantDefs = ALL_MOMENTS.filter((m) => m.projectType === projectType);

  relevantDefs.forEach((def) => {
    momentsRecord[def.id] = {
      momentId: def.id,
      status: 'RED',
      comment: '',
      signature: '',
      photos: [],
    };
  });

  return {
    id,
    name,
    projectType,
    propertyDesignation: propertyDesignation || 'Ej angiven fastighet',
    clientName: clientName || 'Beställare / Byggherre',
    contractorName: contractorName || 'Totalentreprenör',
    projectNumber: projectNumber || `PRJ-${Math.floor(100000 + Math.random() * 900000)}`,
    applicableDocs: applicableDocs || 'Bygghandling, AMA Anläggning 20',
    createdAt: now,
    updatedAt: now,
    notes,
    moments: momentsRecord,
    preInspectionCompleted: false,
    preInspectionPhotos: [],
  };
}

export interface PhotoWatermarkOptions {
  momentId?: string;
  momentTitle?: string;
  property?: string;
  weather?: string;
  userName?: string;
}

/**
 * Resizes and compresses image files from mobile camera to ~1280px max JPEG,
 * and BURNS IN a legal watermark with Timestamp, Weather, Moment, and Project
 * directly onto the image pixels!
 */
export async function fileToBase64Optimized(
  file: File,
  watermark?: PhotoWatermarkOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0, width, height);

        // Calculate watermark banner dimensions based on image resolution
        const bannerHeight = Math.max(38, Math.round(height * 0.065));
        const fontSize = Math.max(12, Math.round(bannerHeight * 0.38));
        const now = getFormattedCurrentTime();

        // 1. Semi-transparent black footer badge
        ctx.fillStyle = 'rgba(12, 16, 24, 0.85)';
        ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

        // 2. Crisp separator bar
        ctx.fillStyle = '#0ea5e9'; // sky blue accent line
        ctx.fillRect(0, height - bannerHeight, width, 2);

        // 3. Render watermark text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = 'middle';

        const padding = Math.max(14, Math.round(width * 0.02));
        const textY = height - bannerHeight / 2;

        const weatherStr = watermark?.weather ? ` • ${watermark.weather}` : '';
        const momentStr = watermark?.momentId ? ` • Moment ${watermark.momentId}` : '';
        const leftText = `📅 ${now}${weatherStr}${momentStr}`;
        ctx.fillText(leftText, padding, textY);

        // Right side: Property / Contractor
        const rightText = watermark?.property
          ? `📍 ${watermark.property}`
          : 'FÄLTBEVIS • EGENKONTROLL';

        ctx.font = `normal ${Math.max(11, fontSize - 2)}px sans-serif`;
        ctx.fillStyle = '#94a3b8';
        const rightWidth = ctx.measureText(rightText).width;
        if (width - rightWidth - padding > padding + ctx.measureText(leftText).width + 20) {
          ctx.fillText(rightText, width - rightWidth - padding, textY);
        }

        // Clean high-quality 0.85 JPEG with permanently burned-in watermark
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Kunde inte läsa in bildfilen'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Fel vid inläsning av fil'));
    reader.readAsDataURL(file);
  });
}

/**
 * Does NOT generate demo projects anymore as requested by the user:
 * "Ta bort exemplen helt också, de är bara förvirrande.."
 * Clean canvas on fresh startup!
 */
export async function seedInitialDemoProjectsIfEmpty(): Promise<void> {
  // Purposely empty. No demo mock projects created.
  return Promise.resolve();
}
