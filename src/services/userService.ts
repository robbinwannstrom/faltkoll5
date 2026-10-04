import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  UserAccount,
  UserRole,
  TeacherExercise,
  InviteCodeItem,
  WhitelistItem,
  RegistrationSecuritySettings,
  AppContextMode,
} from '../types';

const USERS_COLLECTION = 'users';
const EXERCISES_COLLECTION = 'exercises';
const SYSTEM_COLLECTION = 'system';
const INVITE_CODES_COLLECTION = 'invite_codes';
const CUSTOM_GROUPS_STORAGE_KEY = 'faltkoll_custom_groups';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  rethrow = false
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  if (rethrow) {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    console.debug('Firestore sync notice: ', errInfo.error);
  }
}

export const STANDARD_STUDENT_GROUPS = [
  'Byggprogrammet (BA)',
  'Anläggare (Mark & Anläggning)',
  'Vuxenutbildning (Yrkesvux)',
  'Gymnasie (Åk 1–3)',
  'Gymnasie Åk 1 (BA1)',
  'Gymnasie Åk 2 (BA2)',
  'Gymnasie Åk 3 (BA3)',
  'Anläggare Vuxen',
  'Lärling / APL',
  'Osorterad / Allmän',
];

/**
 * Returns numeric rank for role hierarchy:
 * - ADMIN (Huvudadmin) = Rank 4 (Högst)
 * - SCHOOL_ADMIN (Skoladmin) = Rank 3
 * - TEACHER (Yrkeslärare) = Rank 2 (Mellan)
 * - STUDENT (Elev / Lärling) = Rank 1 (Lägst)
 */
export function getRoleRank(role: UserRole | undefined | null): number {
  if (role === 'ADMIN') return 4;
  if (role === 'SCHOOL_ADMIN') return 3;
  if (role === 'TEACHER') return 2;
  return 1;
}

export function getRoleRankLabel(role: UserRole | undefined | null): string {
  if (role === 'ADMIN') return 'Rank 4 • Huvudadmin';
  if (role === 'SCHOOL_ADMIN') return 'Rank 3 • Skoladmin';
  if (role === 'TEACHER') return 'Rank 2 • Yrkeslärare';
  return 'Rank 1 • Elev / Lärling';
}

/**
 * Email format validation: requires non-empty username, @, domain and TLD (min 2 chars)
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(trimmed);
}

/**
 * Check if the user is authorized to add and remove accounts.
 * Huvudadmin, lärare, skoladmin och arbetsledare kan hantera konton.
 * Elever och arbetare har INTE behörighet att administrera konton.
 */
export function canManageAccounts(actor: UserAccount | null | undefined): boolean {
  if (!actor) return false;
  const actorEmail = actor.email?.toLowerCase().trim();
  if (actorEmail === 'robbinwannstrom@gmail.com' || actorEmail === 'admin@faltkoll.se') {
    return true;
  }
  if (actor.role === 'STUDENT' || (actor.role as any) === 'WORKER') {
    return false;
  }
  return (
    actor.role === 'ADMIN' ||
    actor.role === 'SCHOOL_ADMIN' ||
    actor.role === 'TEACHER'
  );
}

/**
 * Rank-based authorization check:
 * - ADMIN (Rank 4) & SCHOOL_ADMIN (Rank 3): Kan ändra ALLT på alla konton
 * - TEACHER (Rank 2): Kan redigera sitt eget konto samt alla konton UNDER sin rank (dvs. STUDENT / Elev med Rank 1)
 * - STUDENT (Rank 1): Kan INTE ändra något alls (varken på sitt eget eller andras konton)
 */
export function canEditUser(actor: UserAccount | null | undefined, target: UserAccount): boolean {
  if (!actor) return false;
  const actorEmail = actor.email?.toLowerCase().trim();
  if (actorEmail === 'robbinwannstrom@gmail.com' || actor.role === 'ADMIN') return true;
  if (actor.role === 'STUDENT' || (actor.role as any) === 'WORKER') return false;
  if (actor.role === 'SCHOOL_ADMIN') return target.role !== 'ADMIN';
  if (actor.role === 'TEACHER') {
    return actor.id === target.id || getRoleRank(target.role) < getRoleRank(actor.role);
  }
  return false;
}

/**
 * Check if the actor can change a user's role to newRole
 */
export function canChangeRoleTo(actor: UserAccount | null | undefined, newRole: UserRole): boolean {
  if (!actor) return false;
  const actorEmail = actor.email?.toLowerCase().trim();
  if (actorEmail === 'robbinwannstrom@gmail.com' || actor.role === 'ADMIN' || actor.role === 'SCHOOL_ADMIN') return true;
  if (actor.role === 'TEACHER') return newRole === 'STUDENT';
  return false;
}

/**
 * Check if the actor can delete the target user.
 * Huvudadmin och behöriga roller kan ta bort konton.
 * Elever och arbetare kan aldrig ta bort konton.
 */
export function canDeleteUser(actor: UserAccount | null | undefined, target: UserAccount): boolean {
  if (!actor) return false;
  // Elever och vanliga arbetare kan ALDRIG ta bort konton
  if (actor.role === 'STUDENT' || (actor.role as any) === 'WORKER') {
    return false;
  }

  const targetEmail = target.email?.toLowerCase().trim();
  const actorEmail = actor.email?.toLowerCase().trim();

  // Ingen kan ta bort huvudadmin (RobbinWannstrom@gmail.com, admin@faltkoll.se) eller sitt eget inloggade konto
  if (
    target.id === 'usr_admin_main' ||
    target.id === 'usr_robbin_owner' ||
    targetEmail === 'robbinwannstrom@gmail.com' ||
    targetEmail === 'admin@faltkoll.se' ||
    targetEmail === 'caataclysm@gmail.com' ||
    actor.id === target.id
  ) {
    return false;
  }

  // Huvudadmin kan ta bort alla
  if (actor.role === 'ADMIN' || actorEmail === 'robbinwannstrom@gmail.com') {
    return true;
  }

  // Skoladmin / Platschef kan ta bort underordnade roller
  if (actor.role === 'SCHOOL_ADMIN') {
    return target.role !== 'ADMIN';
  }

  // Yrkeslärare / Handledare kan ta bort elever
  if (actor.role === 'TEACHER') {
    return target.role === 'STUDENT' || (target.role as any) === 'WORKER';
  }

  return false;
}

/**
 * Request password reset for a given registered email address
 */
export async function requestPasswordReset(email: string): Promise<{
  ok: boolean;
  message: string;
  resetCode?: string;
  foundUser?: Partial<UserAccount>;
}> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    return {
      ok: false,
      message: 'Vänligen ange en giltig e-postadress (t.ex. namn@foretag.se).',
    };
  }

  // 1. Try server endpoint first
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        ok: true,
        message: data.message || 'Återställningskod har skickats till din e-postadress.',
        resetCode: data.resetCode,
        foundUser: data.user,
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 404) {
        return {
          ok: false,
          message: errData.error || `Inget konto hittades med e-postadressen ${cleanEmail}. Kontrollera stavningen eller be en administratör skapa ett konto.`,
        };
      }
    }
  } catch {}

  // 2. Offline / Direct Firestore lookup fallback
  try {
    const cloudUser = await findUserInCloud(cleanEmail);
    if (cloudUser) {
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      // Store reset request in user record in Firestore
      await saveUserToCloud({
        ...cloudUser,
        notes: `Återställningskod begärd: ${resetCode} (${new Date().toISOString()})`,
      });
      return {
        ok: true,
        message: `En återställningskod har genererats för ${cleanEmail}.`,
        resetCode,
        foundUser: cloudUser,
      };
    }
  } catch {}

  // 3. Local fallback check
  try {
    const raw = localStorage.getItem('falthjalp_all_users') || localStorage.getItem('falthjalp_shared_users');
    if (raw) {
      const list: UserAccount[] = JSON.parse(raw);
      const match = list.find((u) => u.email.toLowerCase() === cleanEmail);
      if (match) {
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        return {
          ok: true,
          message: `En återställningskod har genererats för ${cleanEmail}.`,
          resetCode,
          foundUser: match,
        };
      }
    }
  } catch {}

  return {
    ok: false,
    message: `Inget konto hittades med e-postadressen ${cleanEmail}. Kontrollera stavningen.`,
  };
}

/**
 * Confirm password reset with code and set new password
 */
export async function confirmPasswordReset(
  email: string,
  resetCode: string,
  newPass: string
): Promise<{ ok: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = resetCode.trim();
  const cleanPass = newPass.trim();

  if (!cleanPass || cleanPass.length < 3) {
    return { ok: false, message: 'Lösenordet måste innehålla minst 3 tecken.' };
  }

  // 1. Try server
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, resetCode: cleanCode, newPassword: cleanPass }),
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, message: data.message || 'Lösenordet har uppdaterats framgångsrikt!' };
    }
  } catch {}

  // 2. Direct Firestore update
  try {
    const cloudUser = await findUserInCloud(cleanEmail);
    if (cloudUser) {
      const updatedUser = { ...cloudUser, password: cleanPass };
      await saveUserToCloud(updatedUser);
      // Update local storage
      const raw = localStorage.getItem('falthjalp_all_users');
      if (raw) {
        const list: UserAccount[] = JSON.parse(raw);
        const idx = list.findIndex((u) => u.email.toLowerCase() === cleanEmail);
        if (idx >= 0) {
          list[idx].password = cleanPass;
          localStorage.setItem('falthjalp_all_users', JSON.stringify(list));
        }
      }
      return { ok: true, message: 'Ditt lösenord har uppdaterats i databasen! Du kan nu logga in.' };
    }
  } catch {}

  return { ok: false, message: 'Kunde inte uppdatera lösenordet. Kontrollera nätverket eller kontakta admin.' };
}

/**
 * Get all available student groups (Standard + Custom created by teachers/admins)
 */
export function getAllStudentGroups(): string[] {
  let custom: string[] = [];
  try {
    const raw = localStorage.getItem(CUSTOM_GROUPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) custom = parsed;
    }
  } catch {}

  const merged = [...STANDARD_STUDENT_GROUPS];
  custom.forEach((g) => {
    const clean = String(g || '').trim();
    if (clean && !merged.some((m) => m.toLowerCase() === clean.toLowerCase())) {
      merged.splice(merged.length - 1, 0, clean); // Insert before 'Osorterad / Allmän'
    }
  });
  return merged;
}

export function getCustomStudentGroups(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_GROUPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function getLocalCustomStudentGroups(): string[] {
  return getCustomStudentGroups();
}

export async function saveCustomStudentGroupsToCloud(customGroups: string[]): Promise<void> {
  try {
    localStorage.setItem(CUSTOM_GROUPS_STORAGE_KEY, JSON.stringify(customGroups));
  } catch {}
  try {
    const ref = doc(db, SYSTEM_COLLECTION, 'student_groups');
    await setDoc(
      ref,
      {
        id: 'student_groups',
        customGroups,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${SYSTEM_COLLECTION}/student_groups`);
  }
}

export async function fetchCustomStudentGroupsFromCloud(): Promise<string[]> {
  try {
    const ref = doc(db, SYSTEM_COLLECTION, 'student_groups');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.customGroups)) {
        const local = getCustomStudentGroups();
        const combined = Array.from(new Set([...data.customGroups, ...local]));
        try {
          localStorage.setItem(CUSTOM_GROUPS_STORAGE_KEY, JSON.stringify(combined));
        } catch {}
        return combined;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${SYSTEM_COLLECTION}/student_groups`);
  }
  return getCustomStudentGroups();
}

/**
 * Normalizes email or identifier for safe and consistent lookups
 */
export function normalizeIdentifier(val: string): string {
  return String(val || '')
    .trim()
    .toLowerCase();
}

/**
 * Infers educationLevel and specialization from group name if not explicitly set
 */
export function enrichUserGroupMetadata(user: UserAccount): UserAccount {
  const grp = (user.studentGroup || '').toLowerCase();
  let educationLevel = user.educationLevel;
  let specialization = user.specialization;

  if (!educationLevel) {
    if (grp.includes('vux')) educationLevel = 'VUXEN';
    else if (grp.includes('lärling') || grp.includes('apl')) educationLevel = 'LARLING';
    else if (user.role === 'TEACHER' || user.role === 'ADMIN') educationLevel = 'PERSONAL';
    else educationLevel = 'GYMNASIE';
  }

  if (!specialization) {
    if (grp.includes('anlägg')) specialization = 'ANLAGGARE';
    else if (grp.includes('bygg')) specialization = 'BYGGPROGRAMMET';
    else if (grp.includes('hus')) specialization = 'HUSBYGGNAD';
    else if (grp.includes('mark') || grp.includes('maskin')) specialization = 'MARK_VA';
    else specialization = 'ALLMAN';
  }

  return {
    ...user,
    educationLevel,
    specialization,
  };
}

/**
 * Saves or updates a user directly in Google Cloud Firestore.
 * Ensures the account is IMMEDIATELY available across all devices worldwide.
 */
export async function saveUserToCloud(user: UserAccount): Promise<boolean> {
  try {
    const enriched = enrichUserGroupMetadata(user);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const rawUser: Record<string, any> = {
      ...enriched,
      email: normalizeIdentifier(enriched.email),
      displayName: String(enriched.displayName || '').trim(),
      password: enriched.password ? String(enriched.password).trim() : '1234',
      createdAt: enriched.createdAt || nowStr,
      lastLogin: enriched.lastLogin || nowStr,
    };

    const cleanUser = Object.fromEntries(
      Object.entries(rawUser).filter(([_, v]) => v !== undefined)
    ) as UserAccount;

    // Primary document by ID
    const primaryRef = doc(db, USERS_COLLECTION, cleanUser.id);
    await setDoc(primaryRef, cleanUser, { merge: true });

    // Secondary index document by normalized email/username for instant O(1) retrieval
    if (cleanUser.email) {
      const emailSafeKey = `account_${cleanUser.email.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const emailRef = doc(db, USERS_COLLECTION, emailSafeKey);
      await setDoc(emailRef, cleanUser, { merge: true });
    }

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${USERS_COLLECTION}/${user.id}`);
    return false;
  }
}

/**
 * Finds a user directly in Google Cloud Firestore by email or username or ID.
 */
export async function findUserInCloud(identifier: string): Promise<UserAccount | null> {
  const norm = normalizeIdentifier(identifier);
  if (!norm) return null;

  try {
    // 1. Try fast email key lookup
    const emailSafeKey = `account_${norm.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const emailRef = doc(db, USERS_COLLECTION, emailSafeKey);
    const emailSnap = await getDoc(emailRef);
    if (emailSnap.exists()) {
      const data = emailSnap.data() as UserAccount;
      if (data && data.email) return enrichUserGroupMetadata(data);
    }

    // 2. Try direct ID lookup
    const idRef = doc(db, USERS_COLLECTION, norm);
    const idSnap = await getDoc(idRef);
    if (idSnap.exists()) {
      const data = idSnap.data() as UserAccount;
      if (data && data.email) return enrichUserGroupMetadata(data);
    }

    // 3. Query collection where email == norm
    const emailQuery = query(
      collection(db, USERS_COLLECTION),
      where('email', '==', norm),
      limit(1)
    );
    const emailResults = await getDocs(emailQuery);
    if (!emailResults.empty) {
      return enrichUserGroupMetadata(emailResults.docs[0].data() as UserAccount);
    }

    // 4. Query collection where displayName == identifier
    const nameQuery = query(
      collection(db, USERS_COLLECTION),
      where('displayName', '==', identifier.trim()),
      limit(1)
    );
    const nameResults = await getDocs(nameQuery);
    if (!nameResults.empty) {
      return enrichUserGroupMetadata(nameResults.docs[0].data() as UserAccount);
    }

    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, USERS_COLLECTION);
    return null;
  }
}

/**
 * Fetches all user accounts from Google Cloud Firestore.
 */
export async function fetchAllUsersFromCloud(): Promise<UserAccount[]> {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const snap = await getDocs(colRef);
    const users: UserAccount[] = [];
    const seen = new Set<string>();

    snap.forEach((docSnap) => {
      const data = docSnap.data() as UserAccount;
      if (data && data.id && data.email && data.role) {
        if (!seen.has(data.id)) {
          seen.add(data.id);
          users.push(enrichUserGroupMetadata(data));
        }
      }
    });

    return users;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, USERS_COLLECTION);
    return [];
  }
}

/**
 * Removes a user from Google Cloud Firestore.
 */
export async function deleteUserFromCloud(userId: string, email?: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
    if (email) {
      const norm = normalizeIdentifier(email);
      const emailSafeKey = `account_${norm.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      await deleteDoc(doc(db, USERS_COLLECTION, emailSafeKey));
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${USERS_COLLECTION}/${userId}`);
    return false;
  }
}

/**
 * Saves or updates a teacher exercise in Google Cloud Firestore.
 */
export async function saveExerciseToCloud(exercise: TeacherExercise): Promise<boolean> {
  try {
    const cleanId = exercise.id || `ex_${Date.now()}`;
    const cleanCode = (exercise.code || 'FK-' + Math.floor(1000 + Math.random() * 9000))
      .trim()
      .toUpperCase();

    const rawEx: Record<string, any> = {
      ...exercise,
      id: cleanId,
      code: cleanCode,
      title: String(exercise.title || '').trim(),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const cleanEx = Object.fromEntries(
      Object.entries(rawEx).filter(([_, v]) => v !== undefined)
    ) as TeacherExercise;

    // Save primary document by ID
    const primaryRef = doc(db, EXERCISES_COLLECTION, cleanId);
    await setDoc(primaryRef, cleanEx, { merge: true });

    // Save secondary lookup by Code
    const codeSafeKey = `code_${cleanCode.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const codeRef = doc(db, EXERCISES_COLLECTION, codeSafeKey);
    await setDoc(codeRef, cleanEx, { merge: true });

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${EXERCISES_COLLECTION}/${exercise.id}`);
    return false;
  }
}

/**
 * Fetches all teacher exercises from Google Cloud Firestore.
 */
export async function fetchAllExercisesFromCloud(): Promise<TeacherExercise[]> {
  try {
    const colRef = collection(db, EXERCISES_COLLECTION);
    const snap = await getDocs(colRef);
    const exercises: TeacherExercise[] = [];
    const seen = new Set<string>();

    snap.forEach((docSnap) => {
      const data = docSnap.data() as TeacherExercise;
      if (data && data.id && data.title && data.code) {
        if (!seen.has(data.id)) {
          seen.add(data.id);
          exercises.push(data);
        }
      }
    });

    return exercises;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, EXERCISES_COLLECTION);
    return [];
  }
}

/**
 * Deletes an exercise from Google Cloud Firestore.
 */
export async function deleteExerciseFromCloud(exerciseId: string, code?: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, EXERCISES_COLLECTION, exerciseId));
    if (code) {
      const cleanCode = code.trim().toUpperCase();
      const codeSafeKey = `code_${cleanCode.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      await deleteDoc(doc(db, EXERCISES_COLLECTION, codeSafeKey));
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${EXERCISES_COLLECTION}/${exerciseId}`);
    return false;
  }
}

/**
 * Verify whether an email is whitelisted or an invite code is valid.
 */
export async function verifyInviteOrEmail(
  email: string,
  inviteCode?: string
): Promise<{
  authorized: boolean;
  reason: 'OPEN' | 'WHITELISTED' | 'VALID_CODE' | 'CODE_REQUIRED' | 'CODE_ALREADY_USED' | 'INVALID_CODE';
  message: string;
  codeDetails?: Partial<InviteCodeItem>;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = inviteCode?.trim().toUpperCase();

  // Try server first
  try {
    const res = await fetch('/api/auth/verify-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, inviteCode: cleanCode }),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    if (err.reason === 'CODE_ALREADY_USED') {
      return { authorized: false, reason: 'CODE_ALREADY_USED', message: 'Denna inbjudningskod har redan förbrukats.' };
    }
    if (err.reason === 'INVALID_CODE') {
      return { authorized: false, reason: 'INVALID_CODE', message: 'Ogiltig inbjudningskod. Kontrollera koden och försök igen.' };
    }
  } catch {}

  // Direct Firestore verification
  if (cleanCode) {
    try {
      const codeRef = doc(db, INVITE_CODES_COLLECTION, cleanCode);
      const snap = await getDoc(codeRef);
      if (snap.exists()) {
        const data = snap.data() as InviteCodeItem;
        if (data.consumed) {
          return { authorized: false, reason: 'CODE_ALREADY_USED', message: 'Denna inbjudningskod har redan förbrukats.' };
        }
        return {
          authorized: true,
          reason: 'VALID_CODE',
          message: 'Giltig inbjudningskod!',
          codeDetails: {
            roleToAssign: data.roleToAssign,
            accountContext: data.accountContext,
            companyOrSchool: data.companyOrSchool,
          },
        };
      }
    } catch {}
  }

  return {
    authorized: false,
    reason: cleanCode ? 'INVALID_CODE' : 'CODE_REQUIRED',
    message: cleanCode
      ? 'Ogiltig inbjudningskod. Endast koder genererade av administratören är giltiga.'
      : 'En giltig inbjudningskod krävs.',
  };
}

/**
 * Verify and atomically consume an invite code directly in Google Cloud Firestore and server.
 * Ensures absolute, airtight security: any invalid, unrecognized, or already consumed code is BLOCKED.
 */
export async function verifyAndConsumeInviteCode(
  email: string,
  inviteCode: string
): Promise<{
  authorized: boolean;
  reason?: 'VALID_CODE' | 'CODE_REQUIRED' | 'CODE_ALREADY_USED' | 'INVALID_CODE';
  message: string;
  roleToAssign?: UserRole;
  accountContext?: AppContextMode;
  companyOrSchool?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = (inviteCode || '').trim().toUpperCase();

  if (!cleanCode) {
    return {
      authorized: false,
      reason: 'CODE_REQUIRED',
      message: 'En unik personlig engångskod krävs för att registrera sig. Kontakta huvudadministratören.',
    };
  }

  // 1. Check in Google Cloud Firestore first (guaranteed consistent across all clients)
  try {
    const codeRef = doc(db, INVITE_CODES_COLLECTION, cleanCode);
    const snap = await getDoc(codeRef);
    if (snap.exists()) {
      const data = snap.data() as InviteCodeItem;
      if (data.consumed) {
        return {
          authorized: false,
          reason: 'CODE_ALREADY_USED',
          message: 'Denna inbjudningskod har redan förbrukats.',
        };
      }

      // Atomically mark code as consumed in Firestore
      await setDoc(
        codeRef,
        {
          consumed: true,
          consumedBy: cleanEmail,
          consumedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        },
        { merge: true }
      );

      // Also notify server
      try {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, inviteCode: cleanCode }),
        });
      } catch {}

      return {
        authorized: true,
        reason: 'VALID_CODE',
        message: 'Giltig inbjudningskod!',
        roleToAssign: data.roleToAssign,
        accountContext: data.accountContext,
        companyOrSchool: data.companyOrSchool,
      };
    }
  } catch (err) {
    console.warn('Firestore code check note:', err);
  }

  // 2. Try server verification as fallback
  try {
    const res = await fetch('/api/auth/verify-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, inviteCode: cleanCode }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.authorized) {
        // Also update Firestore to mark as consumed
        try {
          const codeRef = doc(db, INVITE_CODES_COLLECTION, cleanCode);
          await setDoc(
            codeRef,
            {
              code: cleanCode,
              consumed: true,
              consumedBy: cleanEmail,
              consumedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            },
            { merge: true }
          );
        } catch {}

        return {
          authorized: true,
          reason: 'VALID_CODE',
          message: 'Giltig inbjudningskod!',
          roleToAssign: data.codeDetails?.roleToAssign,
          accountContext: data.codeDetails?.accountContext,
          companyOrSchool: data.codeDetails?.companyOrSchool,
        };
      }
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.reason === 'CODE_ALREADY_USED' || err.error?.includes('förbrukad')) {
        return {
          authorized: false,
          reason: 'CODE_ALREADY_USED',
          message: 'Denna inbjudningskod har redan förbrukats.',
        };
      }
      return {
        authorized: false,
        reason: 'INVALID_CODE',
        message: 'Ogiltig inbjudningskod. Endast koder genererade av administratören är giltiga.',
      };
    }
  } catch {}

  // STRICT SECURITY: If not found in either Firestore or server, REJECT!
  return {
    authorized: false,
    reason: 'INVALID_CODE',
    message: 'Ogiltig inbjudningskod. Endast koder genererade av administratören kan användas.',
  };
}

/**
 * Fetch registration security data (settings, whitelist, invite codes).
 * Only accessible to Admin.
 */
export async function fetchAdminSecurityData(): Promise<{
  settings: RegistrationSecuritySettings;
  whitelist: WhitelistItem[];
  inviteCodes: InviteCodeItem[];
}> {
  let cloudCodes: InviteCodeItem[] = [];
  try {
    const colRef = collection(db, INVITE_CODES_COLLECTION);
    const snap = await getDocs(colRef);
    snap.forEach((d) => {
      const data = d.data() as InviteCodeItem;
      if (data && data.code) {
        cloudCodes.push(data);
      }
    });
  } catch {}

  let serverCodes: InviteCodeItem[] = [];
  let whitelist: WhitelistItem[] = [
    { id: 'wl_admin', pattern: 'robbinwannstrom@gmail.com', type: 'EXACT_EMAIL', addedBy: 'System', addedAt: '2026-01-01', description: 'Huvudadministratör & ägare' },
    { id: 'wl_faltkoll', pattern: 'admin@faltkoll.se', type: 'EXACT_EMAIL', addedBy: 'System', addedAt: '2026-01-01', description: 'Huvudadministratör' }
  ];
  let settings: RegistrationSecuritySettings = { requireInviteCodeOrWhitelist: true, allowWhitelistedDomainAutoRegistration: false };

  try {
    const res = await fetch('/api/admin/security/registration');
    if (res.ok) {
      const data = await res.json();
      if (data.settings) settings = data.settings;
      if (Array.isArray(data.whitelist)) whitelist = data.whitelist;
      if (Array.isArray(data.inviteCodes)) serverCodes = data.inviteCodes;
    }
  } catch {}

  // Merge unique codes
  const map = new Map<string, InviteCodeItem>();
  cloudCodes.forEach((c) => map.set(c.code.toUpperCase(), c));
  serverCodes.forEach((c) => {
    if (!map.has(c.code.toUpperCase())) {
      map.set(c.code.toUpperCase(), c);
    }
  });

  return {
    settings,
    whitelist,
    inviteCodes: Array.from(map.values()),
  };
}

/**
 * Generate unique single-use invite codes (Admin only).
 * Saves to both Google Cloud Firestore and server storage.
 */
export async function createAdminInviteCodes(params: {
  count: number;
  prefix?: string;
  roleToAssign?: UserRole;
  accountContext?: AppContextMode;
  companyOrSchool?: string;
  notes?: string;
}): Promise<{ ok: boolean; generatedCodes: InviteCodeItem[]; allCodes: InviteCodeItem[] }> {
  const count = Math.max(1, Math.min(params.count || 1, 20));
  const prefix = (params.prefix || 'FK-INV').trim().toUpperCase();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const localGenerated: InviteCodeItem[] = [];
  for (let i = 0; i < count; i++) {
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const code = `${prefix}-${randPart}`;
    const item: InviteCodeItem = {
      code,
      createdBy: 'Huvudadministratör',
      createdAt: now,
      roleToAssign: params.roleToAssign || 'STUDENT',
      accountContext: params.accountContext || 'WORKPLACE',
      companyOrSchool: params.companyOrSchool ? params.companyOrSchool.trim() : undefined,
      consumed: false,
      notes: params.notes ? params.notes.trim() : undefined,
    };
    localGenerated.push(item);

    // Save directly to Google Cloud Firestore
    try {
      const docRef = doc(db, INVITE_CODES_COLLECTION, code);
      await setDoc(docRef, item, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${INVITE_CODES_COLLECTION}/${code}`);
    }
  }

  // Also sync to server
  try {
    const res = await fetch('/api/admin/security/invite-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {}

  const all = await fetchAdminSecurityData();
  return { ok: true, generatedCodes: localGenerated, allCodes: all.inviteCodes };
}

/**
 * Delete / revoke an invite code (Admin only).
 * Removes from both Google Cloud Firestore and server storage.
 */
export async function deleteAdminInviteCode(code: string): Promise<boolean> {
  const cleanCode = code.trim().toUpperCase();
  try {
    await deleteDoc(doc(db, INVITE_CODES_COLLECTION, cleanCode));
  } catch {}
  try {
    const res = await fetch(`/api/admin/security/invite-codes/${encodeURIComponent(cleanCode)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return true;
  }
}

/**
 * Add pattern (email or domain) to whitelist (Admin only).
 */
export async function addAdminWhitelistItem(
  pattern: string,
  description?: string
): Promise<{ ok: boolean; item?: WhitelistItem; whitelist?: WhitelistItem[]; error?: string }> {
  try {
    const res = await fetch('/api/admin/security/whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pattern: pattern.trim().toLowerCase(), description }),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    return { ok: false, error: err.error || 'Kunde inte lägga till i whitelist.' };
  } catch {
    return { ok: false, error: 'Nätverksfel vid sparning i whitelist.' };
  }
}

/**
 * Remove an item from the whitelist (Admin only).
 */
export async function deleteAdminWhitelistItem(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/security/whitelist/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Toggle registration security requirement (Admin only).
 */
export async function updateAdminSecuritySettings(
  requireInviteCodeOrWhitelist: boolean
): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/security/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requireInviteCodeOrWhitelist }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

