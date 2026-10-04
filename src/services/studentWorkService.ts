import { Project, UserAccount } from '../types';
import { safeFetchJson } from './apiHelper';
import { getAllProjects, saveProject } from '../db/indexedDb';

export interface FieldWorkStats {
  totalStudents: number;
  activeInField: number;
  pendingTeacherReview: number;
  totalPhotos: number;
  averageProgressPercent: number;
}

export interface StudentWorkFilterOptions {
  schoolClass?: string;
  studentGroup?: string;
  status?: 'ALL' | 'ACTIVE' | 'PENDING_APPROVAL' | 'COMPLETED' | 'NEEDS_ACTION' | 'HAS_PHOTOS';
  projectType?: string;
  search?: string;
}

export interface ClassSummary {
  name: string;
  studentCount: number;
  activeProjectsCount: number;
}

export interface TeacherReviewPayload {
  projectId: string;
  teacherId: string;
  teacherName: string;
  overallComment?: string;
  grade?: 'GODKÄND' | 'UNDERKÄND' | 'KOMPLETTERING_KRÄVS';
  momentNotes?: Record<string, string>;
  approvedMoments?: Record<string, boolean>;
}

/**
 * Fetch all student field projects from cloud
 */
export async function fetchStudentFieldWorks(
  filters?: StudentWorkFilterOptions
): Promise<{ projects: Project[]; stats: FieldWorkStats; classes: ClassSummary[] }> {
  try {
    const params = new URLSearchParams();
    if (filters?.schoolClass && filters.schoolClass !== 'ALL') {
      params.set('schoolClass', filters.schoolClass);
    }
    if (filters?.studentGroup && filters.studentGroup !== 'ALL') {
      params.set('studentGroup', filters.studentGroup);
    }
    if (filters?.status && filters.status !== 'ALL') {
      params.set('status', filters.status);
    }
    if (filters?.projectType && filters.projectType !== 'ALL') {
      params.set('projectType', filters.projectType);
    }
    if (filters?.search?.trim()) {
      params.set('search', filters.search.trim());
    }

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await safeFetchJson<{
      projects: Project[];
      stats: FieldWorkStats;
      classes: ClassSummary[];
    }>(`/api/field/student-work${queryStr}`);

    if (res.ok && res.data) {
      return {
        projects: res.data.projects || [],
        stats: res.data.stats || {
          totalStudents: 0,
          activeInField: 0,
          pendingTeacherReview: 0,
          totalPhotos: 0,
          averageProgressPercent: 0,
        },
        classes: res.data.classes || [],
      };
    }
  } catch (err) {
    console.warn('Could not fetch student works from cloud:', err);
  }

  // Fallback: read from local IndexedDB if server is offline
  const local = await getAllProjects(false);
  return {
    projects: local,
    stats: {
      totalStudents: new Set(local.map((p) => p.studentId || p.contractorName)).size,
      activeInField: local.length,
      pendingTeacherReview: 0,
      totalPhotos: local.reduce((sum, p) => sum + countProjectPhotos(p), 0),
      averageProgressPercent: 50,
    },
    classes: [],
  };
}

/**
 * Counts total photos in a project
 */
export function countProjectPhotos(project: Project): number {
  let count = (project.preInspectionPhotos || []).length;
  if (project.moments) {
    Object.values(project.moments).forEach((m) => {
      if (m.photos) count += m.photos.length;
      else if (m.photoBase64) count += 1;
    });
  }
  return count;
}

/**
 * Counts completed moments and progress percentage
 */
export function calculateProjectProgress(project: Project): {
  completed: number;
  total: number;
  percent: number;
  pendingStopPoints: number;
} {
  const momentEntries = Object.entries(project.moments || {});
  const total = momentEntries.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0, pendingStopPoints: 0 };

  const completed = momentEntries.filter(([_, r]) => r.status === 'GREEN').length;
  const percent = Math.round((completed / total) * 100);

  // Check if any moments are marked as stop point and not teacher-approved
  let pendingStopPoints = 0;
  if (project.customMoments) {
    project.customMoments.forEach((m) => {
      if (m.isStopPoint && project.moments[m.id]?.status !== 'GREEN' && !project.moments[m.id]?.teacherApproved) {
        pendingStopPoints++;
      }
    });
  }

  return { completed, total, percent, pendingStopPoints };
}

/**
 * Pushes a single student project to cloud
 */
export async function pushStudentProjectToCloud(
  project: Project,
  currentUser?: UserAccount | null
): Promise<boolean> {
  // Only student projects should be pushed to the student field inspection API
  const isStudentWork =
    currentUser?.role === 'STUDENT' ||
    (project.studentId && project.studentId !== currentUser?.id) ||
    project.creatorRole === 'STUDENT';

  if (!isStudentWork && currentUser && currentUser.role !== 'STUDENT') {
    return false;
  }

  try {
    const toSend: Project = {
      ...project,
      studentId: project.studentId || (currentUser?.role === 'STUDENT' ? currentUser.id : undefined),
      studentName: project.studentName || (currentUser?.role === 'STUDENT' ? currentUser.displayName : undefined),
      studentEmail: project.studentEmail || (currentUser?.role === 'STUDENT' ? currentUser.email : undefined),
      schoolClass: project.schoolClass || (currentUser?.role === 'STUDENT' ? currentUser.schoolClass || currentUser.studentGroup : undefined),
      studentGroup: project.studentGroup || (currentUser?.role === 'STUDENT' ? currentUser.studentGroup : undefined),
    };

    const res = await safeFetchJson<{ project: Project }>('/api/field/student-work', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: toSend }),
    });

    return res.ok;
  } catch (err) {
    console.warn('Could not auto-sync student project to cloud:', err);
    return false;
  }
}

/**
 * Synchronize ALL local projects stored on device/browser to cloud.
 * Solves previous issue where projects remained unsynced on former accounts!
 */
export async function syncAllLocalProjectsToCloud(
  currentUser?: UserAccount | null
): Promise<{ count: number; error?: string }> {
  try {
    const localProjects = await getAllProjects(false);
    if (!localProjects || localProjects.length === 0) {
      return { count: 0 };
    }

    const isStudent = currentUser?.role === 'STUDENT';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Only sync projects belonging to this user or student
    const studentProjects = isStudent
      ? localProjects.filter(
          (p) =>
            p.studentId === currentUser?.id ||
            p.creatorId === currentUser?.id ||
            p.studentEmail?.toLowerCase() === currentUser?.email.toLowerCase()
        )
      : localProjects;

    if (studentProjects.length === 0) {
      return { count: 0 };
    }

    const preparedProjects: Project[] = studentProjects.map((p) => {
      const updated = { ...p };

      if (isStudent && currentUser) {
        updated.studentId = currentUser.id;
        updated.studentName = currentUser.displayName;
        updated.studentEmail = currentUser.email;
        updated.schoolClass =
          updated.schoolClass || currentUser.schoolClass || currentUser.studentGroup || 'Ospecificerad klass';
        updated.studentGroup = updated.studentGroup || currentUser.studentGroup;
        updated.creatorId = updated.creatorId || currentUser.id;
      }

      updated.syncEnabled = true;
      updated.lastSyncedAt = now;
      return updated;
    });

    const res = await safeFetchJson<{ count: number; success: boolean }>('/api/field/sync-all-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects: preparedProjects }),
    });

    if (res.ok && res.data) {
      for (const p of preparedProjects) {
        await saveProject(p);
      }
      return { count: res.data.count || preparedProjects.length };
    } else {
      return { count: 0, error: res.error || 'Serverfel vid synkning' };
    }
  } catch (err: any) {
    return { count: 0, error: err?.message || 'Nätverksfel vid synkning' };
  }
}

/**
 * Teacher submits inspection review, feedback, or stop point sign-off
 */
export async function submitTeacherReview(
  payload: TeacherReviewPayload
): Promise<{ success: boolean; project?: Project; error?: string }> {
  try {
    const res = await safeFetchJson<{ success: boolean; project: Project }>(
      '/api/field/teacher-review',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok && res.data?.project) {
      // Also update local copy if it exists in local IndexedDB
      await saveProject(res.data.project);
      return { success: true, project: res.data.project };
    }
    return { success: false, error: res.error || 'Kunde inte spara lärarbedömning' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Nätverksfel vid sparande' };
  }
}
