import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole, AppLicense, TeacherExercise, UserSettings, AppContextMode } from '../types';
import {
  getContextVocabulary,
  getContextualRoleLabel,
  resolveAppContextMode,
  inferAccountContextMode,
  getDefaultGroupsForContext,
} from '../utils/contextLabels';
import {
  User,
  ShieldCheck,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Key,
  GraduationCap,
  RefreshCw,
  Search,
  Lock,
  Copy,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  Edit3,
  Filter,
  Users,
  ChevronDown,
  ChevronRight,
  Check,
  BookOpen,
  FolderPlus,
  Layers,
  Ticket,
  ShieldAlert,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { safeFetchJson } from '../services/apiHelper';
import {
  saveUserToCloud,
  fetchAllUsersFromCloud,
  deleteUserFromCloud,
  canEditUser,
  canDeleteUser,
  canChangeRoleTo,
  canManageAccounts as checkCanManageAccounts,
  isValidEmail,
  getRoleRank,
  getRoleRankLabel,
  STANDARD_STUDENT_GROUPS,
  fetchCustomStudentGroupsFromCloud,
  saveCustomStudentGroupsToCloud,
  fetchAdminSecurityData,
  createAdminInviteCodes,
  deleteAdminInviteCode,
  addAdminWhitelistItem,
  deleteAdminWhitelistItem,
  updateAdminSecuritySettings,
} from '../services/userService';
import { InviteCodeItem, WhitelistItem, RegistrationSecuritySettings } from '../types';
import { TeacherExerciseCreatorModal } from './TeacherExerciseCreatorModal';
import { StudentGroupsManagerPanel } from './StudentGroupsManagerPanel';

interface AccountsViewProps {
  currentUser: UserAccount | null;
  userSettings?: UserSettings;
  onUserLoggedIn: (user: UserAccount) => void;
  onUserLoggedOut: () => void;
  onBack: () => void;
  onStartExerciseProject?: (exercise: TeacherExercise) => void;
}

type SortOrder = 'NAME_ASC' | 'NAME_DESC' | 'GROUP' | 'RANK_DESC' | 'CLASS' | 'LAST_LOGIN' | 'NEWEST';
type GroupingStyle = 'CLASS_CATEGORY' | 'PROGRAM_GROUP' | 'ROLE_ONLY';

interface AccountCategoryBucket {
  id: string;
  title: string;
  subtitle?: string;
  badgeTone: 'purple' | 'sky' | 'emerald' | 'slate';
  users: UserAccount[];
  defaultRole?: UserRole;
  defaultClass?: string;
  defaultGroup?: string;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  currentUser,
  userSettings,
  onUserLoggedIn,
  onUserLoggedOut,
  onBack,
  onStartExerciseProject,
}) => {
  const activeContextMode = resolveAppContextMode(userSettings, currentUser);
  const vocab = getContextVocabulary(activeContextMode);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'STUDENT' | 'TEACHER' | 'SCHOOL_ADMIN' | 'ADMIN'>('ALL');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<SortOrder>('NAME_ASC');
  const [groupingStyle, setGroupingStyle] = useState<GroupingStyle>('CLASS_CATEGORY');
  const [activeSubTab, setActiveSubTab] = useState<'ACCOUNTS' | 'GROUPS' | 'CREATE' | 'INVITES_WHITELIST'>('ACCOUNTS');

  // Registration Security & Invite Codes state
  const [inviteCodesList, setInviteCodesList] = useState<InviteCodeItem[]>([]);
  const [whitelistList, setWhitelistList] = useState<WhitelistItem[]>([]);
  const [secSettings, setSecSettings] = useState<RegistrationSecuritySettings>({
    requireInviteCodeOrWhitelist: true,
    allowWhitelistedDomainAutoRegistration: true,
  });
  const [newInviteCount, setNewInviteCount] = useState(1);
  const [newInvitePrefix, setNewInvitePrefix] = useState('FK-INV');
  const [newInviteRole, setNewInviteRole] = useState<UserRole>('STUDENT');
  const [newInviteContext, setNewInviteContext] = useState<AppContextMode>('WORKPLACE');
  const [newInviteCompany, setNewInviteCompany] = useState('');
  const [newInviteNotes, setNewInviteNotes] = useState('');
  const [newWhitelistPattern, setNewWhitelistPattern] = useState('');
  const [newWhitelistDesc, setNewWhitelistDesc] = useState('');
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
  const [isAddingWhitelist, setIsAddingWhitelist] = useState(false);
  const [copiedCodeVal, setCopiedCodeVal] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard?.writeText(code);
      setCopiedCodeVal(code);
      setTimeout(() => setCopiedCodeVal(null), 2000);
    } catch {}
  };

  // Filter & Tools popover states (hidden under buttons for a cleaner top area)
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [showRankInfoPanel, setShowRankInfoPanel] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Exercise Creator modal
  const [isExerciseCreatorOpen, setIsExerciseCreatorOpen] = useState(false);

  // License & Permissions State
  const [license, setLicense] = useState<AppLicense>({
    status: 'LICENSED',
    licenseKey: 'SKOLA-2026-FALTHJALP',
    schoolName: 'Bygg- & Anläggningsutbildning',
    validUntil: '2028-12-31',
    maxSeats: 150,
    allowTeacherAccountCreation: true,
  });
  const [copiedKey, setCopiedKey] = useState(false);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('1234');
  const [newUserRole, setNewUserRole] = useState<UserRole>('STUDENT');
  const [newUserOrg, setNewUserOrg] = useState(
    activeContextMode === 'WORKPLACE'
      ? 'Anläggning & Entreprenad AB'
      : activeContextMode === 'APL'
      ? 'APL-arbetsplats'
      : 'Bygg- & Anläggningsprogrammet'
  );
  const [newUserGroup, setNewUserGroup] = useState(
    getDefaultGroupsForContext(activeContextMode)[0] || 'Mark & Anläggning'
  );
  const [newUserCustomGroup, setNewUserCustomGroup] = useState('');
  const [newUserClass, setNewUserClass] = useState(
    activeContextMode === 'WORKPLACE' ? 'Lag 1' : activeContextMode === 'APL' ? 'APL-HT26' : 'BA25'
  );
  const [customGroups, setCustomGroups] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('faltkoll_custom_groups');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupNameInput, setNewGroupNameInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editGroup, setEditGroup] = useState('');
  const [editCustomGroup, setEditCustomGroup] = useState('');
  const [editSchoolClass, setEditSchoolClass] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('STUDENT');
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Password inline editing state
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  // Admin / Teacher Login State (when accessed without management privileges)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isLoggingInAdmin, setIsLoggingInAdmin] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [showTeacherLoginForm] = useState(false);

  const isRobbinSuperAdmin = currentUser?.email?.toLowerCase().trim() === 'robbinwannstrom@gmail.com';
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SCHOOL_ADMIN' || isRobbinSuperAdmin;
  const isMainAdmin = currentUser?.role === 'ADMIN' || isRobbinSuperAdmin;
  const isTeacher = currentUser?.role === 'TEACHER';
  const isStudent = currentUser?.role === 'STUDENT' || (currentUser?.role as any) === 'WORKER';
  const canManageAccounts = (isAdmin || isTeacher || checkCanManageAccounts(currentUser)) && !isStudent;

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleAdminLoginSubmit = async (e?: React.FormEvent, directEmail?: string, directPass?: string) => {
    if (e) e.preventDefault();
    setAdminLoginError(null);

    const emailToUse = (directEmail || adminEmail).trim();
    const passToUse = (directPass || adminPassword).trim();

    if (!emailToUse || !passToUse) {
      setAdminLoginError('Vänligen ange både e-post/användarnamn och lösenord.');
      return;
    }

    setIsLoggingInAdmin(true);

    try {
      const res = await safeFetchJson<{ user: UserAccount }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse, password: passToUse }),
      });

      if (res.ok && res.data?.user) {
        if (
          res.data.user.role !== 'ADMIN' &&
          res.data.user.role !== 'SCHOOL_ADMIN' &&
          res.data.user.role !== 'TEACHER'
        ) {
          throw new Error('Detta konto har inte lärar- eller administratörsbehörighet.');
        }
        onUserLoggedIn(res.data.user);
        try {
          localStorage.setItem('falthjalp_current_user', JSON.stringify(res.data.user));
        } catch {}
        setSuccessMsg(`Välkommen! Inloggad som ${res.data.user.displayName} (${getRoleRankLabel(res.data.user.role)}).`);
        setTimeout(() => setSuccessMsg(null), 4000);
        return;
      }

      const norm = emailToUse.toLowerCase();
      if (
        norm === 'admin@faltkoll.se' ||
        norm === 'admin@skola.se' ||
        norm === 'admin' ||
        norm === 'admin@falthjalp.se'
      ) {
        if (passToUse === 'admin123' || passToUse === 'admin' || passToUse === 'Admin2026!' || passToUse === '1234') {
          const adminUser: UserAccount = {
            id: 'usr_admin_main',
            email: norm.includes('@') ? norm : 'admin@faltkoll.se',
            displayName: 'Huvudadministratör (Admin)',
            role: 'ADMIN',
            password: passToUse,
            schoolOrCompany: 'Anläggningsutbildning & Egenkontroll',
            createdAt: '2026-09-26 10:00',
            lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
          };
          onUserLoggedIn(adminUser);
          try {
            localStorage.setItem('falthjalp_current_user', JSON.stringify(adminUser));
          } catch {}
          setSuccessMsg('Välkommen! Du är nu inloggad som Huvudadministratör (Rank 4).');
          setTimeout(() => setSuccessMsg(null), 4000);
          return;
        }
      }

      if (norm === 'skoladmin' || norm === 'skoladmin@skola.se' || norm === 'rektor@skola.se') {
        if (passToUse === '1234' || passToUse === 'admin123' || passToUse === 'skola123') {
          const schoolAdminUser: UserAccount = {
            id: 'usr_school_admin_1',
            email: 'skoladmin@skola.se',
            displayName: 'Skoladministratör (Rektor / Utbildningsledare)',
            role: 'SCHOOL_ADMIN',
            password: passToUse,
            schoolOrCompany: 'Bygg- & Anläggningsutbildning',
            createdAt: '2026-01-05 08:00',
            lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
          };
          onUserLoggedIn(schoolAdminUser);
          try {
            localStorage.setItem('falthjalp_current_user', JSON.stringify(schoolAdminUser));
          } catch {}
          setSuccessMsg('Välkommen! Du är nu inloggad som Skoladministratör (Rank 3).');
          setTimeout(() => setSuccessMsg(null), 4000);
          return;
        }
      }

      if (norm === 'angfar' || norm === 'angfar@skola.se') {
        if (passToUse === '1234' || passToUse === 'larare123') {
          const teacherUser: UserAccount = {
            id: 'usr_angfar_teacher',
            email: 'angfar@skola.se',
            displayName: 'Angfar',
            role: 'TEACHER',
            password: '1234',
            schoolOrCompany: 'Bygg- & Anläggningsutbildning',
            createdAt: '2026-01-10 08:00',
            lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
          };
          onUserLoggedIn(teacherUser);
          try {
            localStorage.setItem('falthjalp_current_user', JSON.stringify(teacherUser));
          } catch {}
          setSuccessMsg('Välkommen! Du är nu inloggad som Yrkeslärare Angfar (Rank 2).');
          setTimeout(() => setSuccessMsg(null), 4000);
          return;
        }
      }

      const localAdmin = allUsers.find(
        (u) =>
          (u.role === 'ADMIN' || u.role === 'SCHOOL_ADMIN' || u.role === 'TEACHER') &&
          (u.email.toLowerCase() === norm || u.displayName.toLowerCase() === norm) &&
          (!u.password || u.password === passToUse)
      );

      if (localAdmin) {
        onUserLoggedIn(localAdmin);
        try {
          localStorage.setItem('falthjalp_current_user', JSON.stringify(localAdmin));
        } catch {}
        setSuccessMsg(`Välkommen! Inloggad som ${localAdmin.displayName}.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        return;
      }

      setAdminLoginError('Felaktig e-post eller lösenord. Kontrollera dina uppgifter.');
    } catch (err: any) {
      setAdminLoginError(err?.message || 'Kunde inte logga in. Kontrollera nätverket.');
    } finally {
      setIsLoggingInAdmin(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      let serverUsers: UserAccount[] = [];
      const res = await safeFetchJson<{ users: UserAccount[] }>(
        `/api/users?callerRole=${currentUser?.role || ''}&callerId=${currentUser?.id || ''}`
      );
      if (res.ok && res.data?.users && Array.isArray(res.data.users)) {
        serverUsers = res.data.users;
      }

      const cloudUsers = await fetchAllUsersFromCloud();
      const cloudCustomGroups = await fetchCustomStudentGroupsFromCloud();
      if (cloudCustomGroups.length > 0) {
        setCustomGroups(cloudCustomGroups);
      }

      const defaultTeacherAngfar: UserAccount = {
        id: 'usr_angfar_teacher',
        email: 'angfar@skola.se',
        displayName: 'Angfar (Yrkeslärare)',
        role: 'TEACHER',
        accountContext: 'SCHOOL',
        password: '1234',
        schoolOrCompany: 'Bygg- & Anläggningsutbildning',
        createdAt: '2026-01-10 08:00',
        lastLogin: '2026-09-28 08:15',
      };

      const defaultSchoolAdmin: UserAccount = {
        id: 'usr_school_admin_1',
        email: 'skoladmin@skola.se',
        displayName: 'Skoladministratör (Utbildningsledare)',
        role: 'SCHOOL_ADMIN',
        accountContext: 'SCHOOL',
        password: '1234',
        schoolOrCompany: 'Bygg- & Anläggningsutbildning',
        createdAt: '2026-01-05 08:00',
        lastLogin: '2026-09-28 07:50',
      };

      const defaultSampleStudents: UserAccount[] = [
        {
          id: 'usr_student_demo_1',
          email: 'elev1@skola.se',
          displayName: 'Erik Andersson',
          role: 'STUDENT',
          accountContext: 'SCHOOL',
          password: '1234',
          schoolOrCompany: 'Bygg- & Anläggningsprogrammet',
          studentGroup: 'Anläggare (Mark & Anläggning)',
          schoolClass: 'BA24-ANL',
          teacherId: 'usr_angfar_teacher',
          createdAt: '2026-02-01 09:00',
          lastLogin: '2026-09-28 09:30',
        },
        {
          id: 'usr_student_demo_2',
          email: 'elev2@skola.se',
          displayName: 'Maja Lindström',
          role: 'STUDENT',
          accountContext: 'SCHOOL',
          password: '1234',
          schoolOrCompany: 'Bygg- & Anläggningsprogrammet',
          studentGroup: 'Byggprogrammet (BA)',
          schoolClass: 'BA25-BYGG',
          teacherId: 'usr_angfar_teacher',
          createdAt: '2026-02-02 10:15',
          lastLogin: '2026-09-28 10:05',
        },
        {
          id: 'usr_student_demo_3',
          email: 'elev3@skola.se',
          displayName: 'Kevin Berg',
          role: 'STUDENT',
          accountContext: 'SCHOOL',
          password: '1234',
          schoolOrCompany: 'Vuxenutbildningen',
          studentGroup: 'Vuxenutbildning (Yrkesvux)',
          schoolClass: 'VUX26-MARK',
          teacherId: 'usr_angfar_teacher',
          createdAt: '2026-02-10 08:40',
          lastLogin: '2026-09-27 14:20',
        },
        {
          id: 'usr_student_demo_4',
          email: 'elev4@skola.se',
          displayName: 'Linnéa Holm',
          role: 'STUDENT',
          accountContext: 'SCHOOL',
          password: '1234',
          schoolOrCompany: 'Bygg- & Anläggningsprogrammet',
          studentGroup: '',
          schoolClass: '',
          teacherId: 'usr_angfar_teacher',
          createdAt: '2026-02-12 11:00',
          lastLogin: '2026-09-28 11:10',
        },
      ];

      const defaultWorkplaceUsers: UserAccount[] = [
        {
          id: 'usr_work_admin_1',
          email: 'platschef@entreprenad.se',
          displayName: 'Henrik Lind (Platschef)',
          role: 'SCHOOL_ADMIN',
          accountContext: 'WORKPLACE',
          password: '1234',
          schoolOrCompany: 'Svensk Mark & Anläggning AB',
          createdAt: '2026-01-15 07:00',
          lastLogin: '2026-09-28 06:45',
        },
        {
          id: 'usr_work_leader_1',
          email: 'arbetsledare@entreprenad.se',
          displayName: 'Mikael Sund (Arbetsledare)',
          role: 'TEACHER',
          accountContext: 'WORKPLACE',
          password: '1234',
          schoolOrCompany: 'Svensk Mark & Anläggning AB',
          createdAt: '2026-01-16 07:30',
          lastLogin: '2026-09-28 07:10',
        },
        {
          id: 'usr_work_worker_1',
          email: 'johan@entreprenad.se',
          displayName: 'Johan Ekström',
          role: 'STUDENT',
          accountContext: 'WORKPLACE',
          password: '1234',
          schoolOrCompany: 'Svensk Mark & Anläggning AB',
          studentGroup: 'Mark & Anläggning',
          schoolClass: 'Marklag 1',
          createdAt: '2026-02-01 07:00',
          lastLogin: '2026-09-28 08:00',
        },
        {
          id: 'usr_work_worker_2',
          email: 'sara@entreprenad.se',
          displayName: 'Sara Nyström',
          role: 'STUDENT',
          accountContext: 'WORKPLACE',
          password: '1234',
          schoolOrCompany: 'Svensk Mark & Anläggning AB',
          studentGroup: 'VA & Ledningsbyggnad',
          schoolClass: 'VA-lag 2',
          createdAt: '2026-02-03 07:00',
          lastLogin: '2026-09-28 08:20',
        },
      ];

      const defaultAplUsers: UserAccount[] = [
        {
          id: 'usr_apl_supervisor_1',
          email: 'handledare@apl.se',
          displayName: 'Anders Kraft (APL-handledare)',
          role: 'TEACHER',
          accountContext: 'APL',
          password: '1234',
          schoolOrCompany: 'Kraft Markentreprenad AB',
          createdAt: '2026-01-20 07:30',
          lastLogin: '2026-09-28 07:40',
        },
        {
          id: 'usr_apl_apprentice_1',
          email: 'larling@apl.se',
          displayName: 'Lucas Bergström',
          role: 'STUDENT',
          accountContext: 'APL',
          password: '1234',
          schoolOrCompany: 'Kraft Markentreprenad AB',
          studentGroup: 'APL – Mark & Anläggning',
          schoolClass: 'APL-HT26',
          createdAt: '2026-02-05 08:00',
          lastLogin: '2026-09-28 08:15',
        },
      ];

      let localSavedUsers: UserAccount[] = [];
      try {
        const raw = localStorage.getItem('falthjalp_shared_users');
        if (raw) {
          localSavedUsers = JSON.parse(raw);
        }
      } catch {}

      const mergedMap = new Map<string, UserAccount>();
      [
        defaultSchoolAdmin,
        defaultTeacherAngfar,
        ...defaultSampleStudents,
        ...defaultWorkplaceUsers,
        ...defaultAplUsers,
        ...localSavedUsers,
        ...serverUsers,
        ...cloudUsers,
      ].forEach((u) => {
        if (u && u.id) {
          mergedMap.set(u.id, u);
        }
      });

      const mergedList = Array.from(mergedMap.values());
      setAllUsers(mergedList);
      try {
        localStorage.setItem('falthjalp_shared_users', JSON.stringify(mergedList));
      } catch {}
    } catch (e) {
      console.error('Error loading users', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLicense = async () => {
    try {
      const res = await safeFetchJson<{ license: AppLicense }>('/api/license');
      if (res.ok && res.data?.license) {
        setLicense(res.data.license);
      }
    } catch (e) {
      console.error('Error loading license', e);
    }
  };

  const loadSecurityData = async () => {
    try {
      const data = await fetchAdminSecurityData();
      if (data) {
        setSecSettings(data.settings);
        setWhitelistList(data.whitelist || []);
        setInviteCodesList(data.inviteCodes || []);
      }
    } catch (e) {
      console.error('Error loading admin security data', e);
    }
  };

  useEffect(() => {
    loadUsers();
    loadLicense();
    if (isAdmin || isMainAdmin || isRobbinSuperAdmin) {
      loadSecurityData();
    }
  }, [currentUser?.id, currentUser?.role]);

  const handleGenerateInviteCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin && !isMainAdmin) {
      setErrorMsg('Endast huvudadministratören kan generera engångskoder.');
      return;
    }
    setIsGeneratingCodes(true);
    setErrorMsg(null);
    try {
      const res = await createAdminInviteCodes({
        count: newInviteCount,
        prefix: newInvitePrefix.trim() || 'FK-INV',
        roleToAssign: newInviteRole,
        accountContext: newInviteContext,
        companyOrSchool: newInviteCompany.trim() || undefined,
        notes: newInviteNotes.trim() || undefined,
      });
      if (res.ok && res.allCodes) {
        setInviteCodesList(res.allCodes);
        setSuccessMsg(`${res.generatedCodes.length} st ny(a) engångskod(er) har genererats!`);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg('Kunde inte generera inbjudningskoder.');
      }
    } catch {
      setErrorMsg('Ett fel inträffade vid skapandet av koder.');
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  const handleDeleteInviteCode = async (code: string) => {
    if (!isAdmin && !isMainAdmin) return;
    try {
      const ok = await deleteAdminInviteCode(code);
      if (ok) {
        setInviteCodesList((prev) => prev.filter((c) => c.code.toUpperCase() !== code.toUpperCase()));
        setSuccessMsg(`Engångskod ${code} raderades.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch {
      setErrorMsg('Kunde inte ta bort koden.');
    }
  };

  const handleAddWhitelistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin && !isMainAdmin) return;
    const cleanPattern = newWhitelistPattern.trim().toLowerCase();
    if (!cleanPattern) {
      setErrorMsg('Ange en e-postadress (t.ex. elev@skola.se) eller domän (t.ex. @skola.se).');
      return;
    }
    setIsAddingWhitelist(true);
    setErrorMsg(null);
    try {
      const res = await addAdminWhitelistItem(cleanPattern, newWhitelistDesc.trim());
      if (res.ok && res.whitelist) {
        setWhitelistList(res.whitelist);
        setNewWhitelistPattern('');
        setNewWhitelistDesc('');
        setSuccessMsg(`"${cleanPattern}" har lagts till i whitelist!`);
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        setErrorMsg(res.error || 'Kunde inte lägga till mönstret i whitelist.');
      }
    } catch {
      setErrorMsg('Ett fel uppstod vid sparande i whitelist.');
    } finally {
      setIsAddingWhitelist(false);
    }
  };

  const handleDeleteWhitelistItem = async (id: string, pattern: string) => {
    if (!isAdmin && !isMainAdmin) return;
    try {
      const ok = await deleteAdminWhitelistItem(id);
      if (ok) {
        setWhitelistList((prev) => prev.filter((w) => w.id !== id && w.pattern !== pattern));
        setSuccessMsg(`"${pattern}" togs bort från whitelist.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch {
      setErrorMsg('Kunde inte ta bort mönstret.');
    }
  };

  const handleToggleSecuritySettings = async (enabled: boolean) => {
    if (!isAdmin && !isMainAdmin) return;
    try {
      const ok = await updateAdminSecuritySettings(enabled);
      if (ok) {
        setSecSettings((prev) => ({ ...prev, requireInviteCodeOrWhitelist: enabled }));
        setSuccessMsg(
          enabled
            ? 'Registreringsskydd AKTIVERAT: Endast användare med engångskod eller vitlistad e-post kan skapa konto.'
            : 'Registreringsskydd AVSTÄNGT: Fri registrering är nu tillåten.'
        );
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch {
      setErrorMsg('Kunde inte ändra inställningen.');
    }
  };

  const handleToggleRequireLogin = async (requireLogin: boolean) => {
    try {
      const res = await safeFetchJson<{ license: AppLicense }>('/api/license/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerRole: currentUser?.role,
          requireLoginOnStartup: requireLogin,
        }),
      });
      if (res.ok && res.data?.license) {
        setLicense(res.data.license);
        setSuccessMsg(
          requireLogin
            ? 'Inloggningskrav vid start är nu AKTIVERAT.'
            : 'Öppet läge aktiverat: Appen startar nu direkt utan inloggningskrav.'
        );
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch {
      setLicense((prev) => ({ ...prev, requireLoginOnStartup: requireLogin }));
    }
  };

  const handleCopyLicenseKey = () => {
    navigator.clipboard?.writeText(license.licenseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleAddNewCustomGroup = async () => {
    const trimmed = newGroupNameInput.trim();
    if (!trimmed) return;
    if (!allAvailableGroups.includes(trimmed)) {
      const updated = [...customGroups, trimmed];
      setCustomGroups(updated);
      await saveCustomStudentGroupsToCloud(updated);
    }
    setNewUserGroup(trimmed);
    if (editingUser) {
      setEditGroup(trimmed);
    }
    setNewGroupNameInput('');
    setIsNewGroupModalOpen(false);
    setSuccessMsg(`Kategorin "${trimmed}" har skapats!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!canManageAccounts) {
      setErrorMsg('Behörighet saknas. Endast huvudadministratör, yrkeslärare och arbetsledare kan skapa konton.');
      return;
    }

    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      setErrorMsg('Vänligen fyll i fullständigt namn, fungerande e-postadress och lösenord.');
      return;
    }

    if (!isValidEmail(newUserEmail.trim())) {
      setErrorMsg('Du måste ange en giltig och fungerande e-postadress (t.ex. namn@foretag.se eller namn@skola.se).');
      return;
    }

    const roleToAssign: UserRole = isAdmin ? newUserRole : 'STUDENT';
    const finalGroup =
      roleToAssign === 'STUDENT'
        ? newUserGroup === '__NONE__'
          ? undefined
          : newUserGroup === '__CUSTOM__'
          ? newUserCustomGroup.trim() || undefined
          : newUserGroup
        : undefined;

    if (finalGroup && !STANDARD_STUDENT_GROUPS.includes(finalGroup) && !customGroups.includes(finalGroup)) {
      const updatedGroups = [...customGroups, finalGroup];
      setCustomGroups(updatedGroups);
      await saveCustomStudentGroupsToCloud(updatedGroups);
    }

    setIsCreating(true);
    try {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const newAccount: UserAccount = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: newUserEmail.trim(),
        displayName: newUserName.trim(),
        password: newUserPassword.trim(),
        role: roleToAssign,
        accountContext: activeContextMode,
        schoolOrCompany:
          newUserOrg.trim() ||
          (activeContextMode === 'WORKPLACE'
            ? 'Anläggning & Entreprenad AB'
            : activeContextMode === 'APL'
            ? 'APL-arbetsplats'
            : 'Bygg- & Anläggningsprogrammet'),
        studentGroup: finalGroup,
        schoolClass: roleToAssign === 'STUDENT' ? newUserClass.trim() || undefined : undefined,
        teacherId: isTeacher ? currentUser?.id : undefined,
        createdAt: nowStr,
        lastLogin: nowStr,
      };

      const res = await safeFetchJson<{ user: UserAccount; error?: string }>('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAccount,
          callerRole: currentUser?.role,
          callerId: currentUser?.id,
        }),
      });

      const createdUser = res.ok && res.data?.user ? res.data.user : newAccount;
      createdUser.accountContext = activeContextMode;
      createdUser.studentGroup = finalGroup;
      createdUser.schoolClass = roleToAssign === 'STUDENT' ? newUserClass.trim() || undefined : undefined;

      await saveUserToCloud(createdUser);

      setAllUsers((prev) => {
        const next = [createdUser, ...prev.filter((u) => u.id !== createdUser.id)];
        try {
          localStorage.setItem('falthjalp_shared_users', JSON.stringify(next));
        } catch {}
        return next;
      });

      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('1234');
      setNewUserCustomGroup('');
      setSuccessMsg(
        `Kontot för ${createdUser.displayName} (${getContextualRoleLabel(createdUser.role, activeContextMode)}) har skapats!`
      );
      setActiveSubTab('ACCOUNTS');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ett fel uppstod vid skapande av konto.');
    } finally {
      setIsCreating(false);
    }
  };

  const openEditUserModal = (user: UserAccount) => {
    if (!canEditUser(currentUser, user)) {
      setErrorMsg('Du saknar behörighet att redigera detta konto.');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }
    setEditingUser(user);
    setEditName(user.displayName);
    setEditEmail(user.email);
    setEditPassword(user.password || '1234');
    setEditGroup(user.studentGroup || '__NONE__');
    setEditCustomGroup('');
    setEditSchoolClass(user.schoolClass || '');
    setEditSchool(user.schoolOrCompany || '');
    setEditRole(user.role);
    setEditTeacherId(user.teacherId || '');
    setEditNotes(user.notes || '');
  };

  const handleSaveEditedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!canEditUser(currentUser, editingUser)) {
      setErrorMsg('Du saknar behörighet att redigera detta konto.');
      return;
    }

    setIsSavingEdit(true);
    setErrorMsg(null);

    const finalRole: UserRole = isAdmin && canChangeRoleTo(currentUser, editRole) ? editRole : editingUser.role;
    const finalGroup =
      finalRole === 'STUDENT'
        ? editGroup === '__NONE__'
          ? undefined
          : editGroup === '__CUSTOM__'
          ? editCustomGroup.trim() || undefined
          : editGroup
        : undefined;

    if (finalGroup && !STANDARD_STUDENT_GROUPS.includes(finalGroup) && !customGroups.includes(finalGroup)) {
      const updatedGroups = [...customGroups, finalGroup];
      setCustomGroups(updatedGroups);
      await saveCustomStudentGroupsToCloud(updatedGroups);
    }

    const updatedUser: UserAccount = {
      ...editingUser,
      displayName: editName.trim() || editingUser.displayName,
      email: editEmail.trim() || editingUser.email,
      password: editPassword.trim() || editingUser.password || '1234',
      role: finalRole,
      studentGroup: finalGroup,
      schoolClass: finalRole === 'STUDENT' ? editSchoolClass.trim() || undefined : undefined,
      schoolOrCompany: editSchool.trim() || editingUser.schoolOrCompany,
      teacherId: finalRole === 'STUDENT' ? editTeacherId || editingUser.teacherId : undefined,
      notes: editNotes.trim() || undefined,
    };

    try {
      await safeFetchJson('/api/users/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: updatedUser.id,
          newPassword: updatedUser.password,
          callerRole: currentUser?.role,
          callerId: currentUser?.id,
        }),
      });

      await saveUserToCloud(updatedUser);

      setAllUsers((prev) => {
        const next = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
        try {
          localStorage.setItem('falthjalp_shared_users', JSON.stringify(next));
        } catch {}
        return next;
      });

      if (currentUser && currentUser.id === updatedUser.id) {
        onUserLoggedIn(updatedUser);
      }

      setSuccessMsg(`Uppgifterna för ${updatedUser.displayName} har sparats!`);
      setEditingUser(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      setErrorMsg('Kunde inte spara ändringarna.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleBulkAssignGroup = async (userIds: string[], targetGroup: string) => {
    const updatedList = allUsers.map((u) => {
      if (userIds.includes(u.id) && canEditUser(currentUser, u)) {
        return { ...u, studentGroup: targetGroup === '__NONE__' ? undefined : targetGroup };
      }
      return u;
    });

    setAllUsers(updatedList);
    try {
      localStorage.setItem('falthjalp_shared_users', JSON.stringify(updatedList));
    } catch {}

    for (const uid of userIds) {
      const found = updatedList.find((u) => u.id === uid);
      if (found && canEditUser(currentUser, found)) {
        await saveUserToCloud(found);
      }
    }

    setSuccessMsg(`${userIds.length} konton har flyttats till "${targetGroup}"!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleUpdatePassword = async (userId: string) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    if (!targetUser || !canEditUser(currentUser, targetUser)) {
      setErrorMsg('Du saknar behörighet att ändra lösenordet för detta konto.');
      return;
    }

    if (!newPasswordVal.trim()) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await safeFetchJson('/api/users/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          newPassword: newPasswordVal.trim(),
          callerRole: currentUser?.role,
          callerId: currentUser?.id,
        }),
      });

      const updated = { ...targetUser, password: newPasswordVal.trim() };
      await saveUserToCloud(updated);

      setAllUsers((prev) => {
        const next = prev.map((u) => (u.id === userId ? updated : u));
        try {
          localStorage.setItem('falthjalp_shared_users', JSON.stringify(next));
        } catch {}
        return next;
      });
      setEditingPasswordUserId(null);
      setNewPasswordVal('');
      setSuccessMsg('Lösenordet har uppdaterats!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setErrorMsg('Nätverksfel vid uppdatering av lösenord.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    if (!targetUser) return;

    if (!canDeleteUser(currentUser, targetUser)) {
      setErrorMsg('Du kan endast ta bort konton som ligger under din egen rank.');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    try {
      await safeFetchJson(
        `/api/users/${userId}?callerRole=${currentUser?.role || ''}&callerId=${currentUser?.id || ''}`,
        { method: 'DELETE' }
      );
      await deleteUserFromCloud(userId);
      setAllUsers((prev) => {
        const next = prev.filter((u) => u.id !== userId);
        try {
          localStorage.setItem('falthjalp_shared_users', JSON.stringify(next));
        } catch {}
        return next;
      });
      setSuccessMsg(`Kontot för ${targetUser.displayName} har raderats.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setErrorMsg('Kunde inte ta bort användaren.');
    }
  };

  // Filter and sort users — strictly scoped to the active context mode (WORKPLACE vs APL vs SCHOOL)
  const visibleUsersForCaller = allUsers.filter((u) => {
    if (u.id === currentUser?.id) return true;
    const uContext = inferAccountContextMode(u);
    if (uContext !== activeContextMode) return false;
    if (isAdmin) return true;
    if (isTeacher) {
      return u.role === 'STUDENT' || u.id === currentUser?.id;
    }
    return u.id === currentUser?.id;
  });

  // Collect all unique groups and classes for the active context mode
  const allAvailableGroups = Array.from(
    new Set([
      ...getDefaultGroupsForContext(activeContextMode),
      ...customGroups,
      ...visibleUsersForCaller
        .map((u) => u.studentGroup)
        .filter((g): g is string => !!g && g.trim().length > 0),
    ])
  );

  const allAvailableClasses = Array.from(
    new Set(
      visibleUsersForCaller
        .filter((u) => u.role === 'STUDENT' && u.schoolClass && u.schoolClass.trim().length > 0)
        .map((u) => u.schoolClass!.trim())
    )
  ).sort((a, b) => a.localeCompare(b, 'sv'));

  const allTeachers = visibleUsersForCaller.filter(
    (u) => u.role === 'TEACHER' || u.role === 'SCHOOL_ADMIN' || u.role === 'ADMIN'
  );

  const sortUsersFn = (a: UserAccount, b: UserAccount) => {
    if (sortOrder === 'NAME_ASC') return a.displayName.localeCompare(b.displayName, 'sv');
    if (sortOrder === 'NAME_DESC') return b.displayName.localeCompare(a.displayName, 'sv');
    if (sortOrder === 'RANK_DESC') return getRoleRank(b.role) - getRoleRank(a.role);
    if (sortOrder === 'CLASS') {
      return (a.schoolClass || 'ÖÖÖ').localeCompare(b.schoolClass || 'ÖÖÖ', 'sv');
    }
    if (sortOrder === 'GROUP') {
      const ga = a.studentGroup || 'ÖÖÖ';
      const gb = b.studentGroup || 'ÖÖÖ';
      const cmp = ga.localeCompare(gb, 'sv');
      if (cmp !== 0) return cmp;
      return a.displayName.localeCompare(b.displayName, 'sv');
    }
    if (sortOrder === 'LAST_LOGIN') {
      return (b.lastLogin || '').localeCompare(a.lastLogin || '');
    }
    if (sortOrder === 'NEWEST') {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    }
    return 0;
  };

  const filteredUsers = visibleUsersForCaller
    .filter((u) => {
      if (activeFilter !== 'ALL' && u.role !== activeFilter) return false;
      if (selectedGroupFilter !== 'ALL') {
        if (selectedGroupFilter === '__UNASSIGNED__') {
          const hasClass = !!(u.schoolClass && u.schoolClass.trim());
          const hasGroup = !!(u.studentGroup && u.studentGroup.trim());
          if (u.role !== 'STUDENT' || hasClass || hasGroup) return false;
        } else if (selectedGroupFilter.startsWith('CLASS:')) {
          const targetClass = selectedGroupFilter.replace('CLASS:', '');
          if ((u.schoolClass || '').trim() !== targetClass) return false;
        } else if (u.studentGroup !== selectedGroupFilter) {
          return false;
        }
      }
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.schoolOrCompany && u.schoolOrCompany.toLowerCase().includes(q)) ||
        (u.studentGroup && u.studentGroup.toLowerCase().includes(q)) ||
        (u.schoolClass && u.schoolClass.toLowerCase().includes(q))
      );
    })
    .sort(sortUsersFn);

  // Organize filteredUsers into clean category buckets!
  // 1. Administratörer & Ledning (ADMIN + SCHOOL_ADMIN)
  // 2. Lärare / Handledare / Arbetsledare (TEACHER)
  // 3. Each Klass / Kategori for STUDENT accounts
  // 4. Övrigt (for accounts without a class/category)
  const categoryBuckets: AccountCategoryBucket[] = React.useMemo(() => {
    const buckets: AccountCategoryBucket[] = [];

    const admins = filteredUsers.filter((u) => u.role === 'ADMIN' || u.role === 'SCHOOL_ADMIN');
    if (admins.length > 0) {
      buckets.push({
        id: 'cat_admins',
        title:
          activeContextMode === 'WORKPLACE'
            ? 'Platschefer & Administratörer'
            : 'Skolledning & Administratörer',
        subtitle: `${vocab.roleAdmin} & ${vocab.roleSchoolAdminShort}`,
        badgeTone: 'purple',
        users: admins,
        defaultRole: 'SCHOOL_ADMIN',
      });
    }

    const teachers = filteredUsers.filter((u) => u.role === 'TEACHER');
    if (teachers.length > 0) {
      buckets.push({
        id: 'cat_teachers',
        title: `${vocab.roleTeacher} (${vocab.roleTeacherShort})`,
        subtitle:
          activeContextMode === 'WORKPLACE'
            ? 'Granskar egenkontroller och leder arbetet'
            : 'Ansvariga för undervisning, övningar och bedömning',
        badgeTone: 'sky',
        users: teachers,
        defaultRole: 'TEACHER',
      });
    }

    const students = filteredUsers.filter((u) => u.role === 'STUDENT');

    if (groupingStyle === 'ROLE_ONLY') {
      if (students.length > 0) {
        buckets.push({
          id: 'cat_all_students',
          title: vocab.roleStudent,
          subtitle: 'Alla registrerade konton i denna kategori',
          badgeTone: 'emerald',
          users: students,
          defaultRole: 'STUDENT',
        });
      }
    } else if (groupingStyle === 'PROGRAM_GROUP') {
      // Group by studentGroup; if no studentGroup -> Övrigt
      const groupMap = new Map<string, UserAccount[]>();
      const unassigned: UserAccount[] = [];

      students.forEach((s) => {
        const grp = s.studentGroup?.trim();
        const cls = s.schoolClass?.trim();
        if (grp) {
          const list = groupMap.get(grp) || [];
          list.push(s);
          groupMap.set(grp, list);
        } else if (cls) {
          const list = groupMap.get(cls) || [];
          list.push(s);
          groupMap.set(cls, list);
        } else {
          unassigned.push(s);
        }
      });

      Array.from(groupMap.keys())
        .sort((a, b) => a.localeCompare(b, 'sv'))
        .forEach((grpName) => {
          const list = groupMap.get(grpName) || [];
          buckets.push({
            id: `cat_grp_${grpName}`,
            title: grpName,
            subtitle: vocab.groupLabel,
            badgeTone: 'emerald',
            users: list,
            defaultRole: 'STUDENT',
            defaultGroup: grpName,
          });
        });

      if (unassigned.length > 0) {
        buckets.push({
          id: 'cat_unassigned_other',
          title: 'Övrigt',
          subtitle: `Konton utan tilldelad ${vocab.classLabel.toLowerCase()} eller ${vocab.groupLabel.toLowerCase()}`,
          badgeTone: 'slate',
          users: unassigned,
          defaultRole: 'STUDENT',
          defaultClass: '',
          defaultGroup: '__NONE__',
        });
      }
    } else {
      // Default: CLASS_CATEGORY
      // Group students by their schoolClass (or studentGroup if schoolClass isn't set).
      // Any student without a class (or without both class & group) goes under "Övrigt"!
      const classMap = new Map<string, { users: UserAccount[]; groupHint?: string }>();
      const otherUsers: UserAccount[] = [];

      students.forEach((s) => {
        const cls = s.schoolClass?.trim();
        const grp = s.studentGroup?.trim();
        if (cls) {
          const existing = classMap.get(cls) || { users: [], groupHint: grp };
          existing.users.push(s);
          if (!existing.groupHint && grp) existing.groupHint = grp;
          classMap.set(cls, existing);
        } else if (grp) {
          const existing = classMap.get(grp) || { users: [], groupHint: vocab.groupLabel };
          existing.users.push(s);
          classMap.set(grp, existing);
        } else {
          otherUsers.push(s);
        }
      });

      Array.from(classMap.keys())
        .sort((a, b) => a.localeCompare(b, 'sv'))
        .forEach((clsName) => {
          const entry = classMap.get(clsName)!;
          buckets.push({
            id: `cat_cls_${clsName}`,
            title: `${vocab.classLabel}: ${clsName}`,
            subtitle: entry.groupHint || vocab.roleStudent,
            badgeTone: 'emerald',
            users: entry.users,
            defaultRole: 'STUDENT',
            defaultClass: clsName,
            defaultGroup: entry.groupHint || 'Byggprogrammet (BA)',
          });
        });

      if (otherUsers.length > 0) {
        buckets.push({
          id: 'cat_other_unassigned',
          title: `Övrigt (Utan ${vocab.classLabel.toLowerCase()})`,
          subtitle: `Konton som inte tillhör en specifik ${vocab.classLabel.toLowerCase()}`,
          badgeTone: 'slate',
          users: otherUsers,
          defaultRole: 'STUDENT',
          defaultClass: '',
          defaultGroup: '__NONE__',
        });
      }
    }

    return buckets;
  }, [filteredUsers, groupingStyle, activeContextMode, vocab]);

  const activeFilterCount =
    (activeFilter !== 'ALL' ? 1 : 0) +
    (selectedGroupFilter !== 'ALL' ? 1 : 0) +
    (sortOrder !== 'NAME_ASC' ? 1 : 0);

  const handleQuickAddInCategory = (bucket: AccountCategoryBucket) => {
    if (bucket.defaultRole && isAdmin) {
      setNewUserRole(bucket.defaultRole);
    } else {
      setNewUserRole('STUDENT');
    }
    if (bucket.defaultClass !== undefined) {
      setNewUserClass(bucket.defaultClass);
    }
    if (bucket.defaultGroup !== undefined) {
      setNewUserGroup(bucket.defaultGroup);
    }
    setActiveSubTab('CREATE');
  };

  // ============================================================================
  // VIEW WHEN NOT LOGGED IN AS TEACHER / ADMIN (E.G. STUDENT OR LOGGED OUT)
  // ============================================================================
  if (!canManageAccounts) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 pb-28 space-y-6 font-sans">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[40px] px-3.5 bg-[#1a1a1a] hover:bg-[#242424] text-slate-300 hover:text-white border border-[#2e2e2e] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400" />
            <span>Tillbaka till {vocab.projectNounPlural}</span>
          </button>
        </div>

        {/* WORKER / APPRENTICE / STUDENT READ-ONLY PROFILE CARD */}
        {isStudent && currentUser && !showTeacherLoginForm && (
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-[#242424] pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    {getContextualRoleLabel(currentUser.role, activeContextMode)}
                  </span>
                  <h2 className="text-xl font-black text-white mt-0.5">{currentUser.displayName}</h2>
                  <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#121212] border border-[#242424]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {vocab.classLabel}
                </span>
                <span className="font-bold text-white text-sm mt-1 block">
                  {currentUser.schoolClass || `Övrigt (Ingen ${vocab.classLabel.toLowerCase()})`}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#121212] border border-[#242424]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {vocab.groupLabel}
                </span>
                <span className="font-bold text-white text-sm mt-1 block">
                  {currentUser.studentGroup || 'Övrigt'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121212] border border-[#242424] flex items-center gap-2.5 text-xs text-slate-400">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Kontakta din <strong>{vocab.roleTeacherShort}</strong> eller{' '}
                <strong>{vocab.roleSchoolAdminShort}</strong> om dina kontouppgifter behöver ändras.
              </span>
            </div>

            <button
              type="button"
              onClick={onUserLoggedOut}
              className="w-full min-h-[42px] px-4 bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border border-rose-900/50 font-bold text-xs rounded-xl flex items-center justify-center cursor-pointer transition-colors"
            >
              Logga ut ({currentUser.displayName})
            </button>
          </div>
        )}

        {/* Admin / Teacher / Foreman Login Form */}
        {!isStudent && (
          <div className="bg-[#161616] border border-[#2e2e2e] rounded-2xl p-6 sm:p-7 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white tracking-tight">
                {vocab.roleTeacherShort}- & Admininloggning
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">{vocab.accountsViewSubtitle}</p>
            </div>

            {adminLoginError && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/70 rounded-xl flex items-start gap-2.5 text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>{adminLoginError}</div>
              </div>
            )}

            <form onSubmit={(e) => handleAdminLoginSubmit(e)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  E-postadress eller användarnamn
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Ange användarnamn eller e-post..."
                    className="w-full min-h-[44px] px-4 pl-9 bg-[#111111] border border-[#2e2e2e] focus:border-orange-500 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Lösenord</label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Lösenord..."
                    className="w-full min-h-[44px] px-4 pl-9 pr-10 bg-[#111111] border border-[#2e2e2e] focus:border-orange-500 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    tabIndex={-1}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingInAdmin}
                className="w-full min-h-[46px] bg-orange-500 hover:bg-orange-400 text-black font-black text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {isLoggingInAdmin ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4 stroke-[2.5]" />
                    <span>Logga in</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // MAIN TEACHER / SCHOOL_ADMIN / ADMIN MANAGEMENT VIEW (CLEAN & CATEGORIZED)
  // ============================================================================
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28 space-y-5 font-sans">
      {/* CLEAN TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#242424]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[38px] px-3 bg-[#181818] hover:bg-[#242424] text-slate-300 hover:text-white border border-[#2e2e2e] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400" />
            <span>Tillbaka</span>
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {vocab.accountsViewTitle}
            </h1>
            <p className="text-xs text-slate-400">
              Inloggad som <span className="text-slate-200 font-semibold">{currentUser?.displayName}</span> (
              {currentUser ? getContextualRoleLabel(currentUser.role, activeContextMode) : ''}) •{' '}
              {visibleUsersForCaller.length} konton
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {activeContextMode !== 'WORKPLACE' && (
            <button
              type="button"
              onClick={() => setIsExerciseCreatorOpen(true)}
              className="min-h-[38px] px-3.5 bg-[#181818] hover:bg-[#242424] text-amber-300 border border-[#2e2e2e] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>{vocab.creatorButtonLong}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveSubTab(activeSubTab === 'GROUPS' ? 'ACCOUNTS' : 'GROUPS')}
            className={`min-h-[38px] px-3.5 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors border ${
              activeSubTab === 'GROUPS'
                ? 'bg-orange-500 text-black border-orange-400'
                : 'bg-[#181818] hover:bg-[#242424] text-slate-200 border-[#2e2e2e]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{vocab.classLabel} & Grupper</span>
          </button>
          {(isAdmin || isMainAdmin || isRobbinSuperAdmin) && (
            <button
              type="button"
              onClick={() =>
                setActiveSubTab(activeSubTab === 'INVITES_WHITELIST' ? 'ACCOUNTS' : 'INVITES_WHITELIST')
              }
              className={`min-h-[38px] px-3.5 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors border ${
                activeSubTab === 'INVITES_WHITELIST'
                  ? 'bg-amber-400 text-black border-amber-300 font-black'
                  : 'bg-[#181818] hover:bg-[#242424] text-amber-300 border-amber-500/30'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Engångskoder & Whitelist</span>
              {inviteCodesList.filter((c) => !c.consumed).length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  {inviteCodesList.filter((c) => !c.consumed).length}
                </span>
              )}
            </button>
          )}
          {canManageAccounts && (
            <button
              type="button"
              onClick={() => setActiveSubTab(activeSubTab === 'CREATE' ? 'ACCOUNTS' : 'CREATE')}
              className={`min-h-[38px] px-3.5 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeSubTab === 'CREATE'
                  ? 'bg-emerald-400 text-black'
                  : 'bg-orange-500 hover:bg-orange-400 text-black'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nytt konto</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/80 rounded-xl flex items-center justify-between gap-3 text-emerald-200 text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white text-[11px]">
            Stäng
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-950/90 border border-rose-500/80 rounded-xl flex items-center justify-between gap-3 text-rose-200 text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white text-[11px]">
            Stäng
          </button>
        </div>
      )}

      {/* ======================================================================== */}
      {/* TAB 1: ALLA KONTON (GROUPED BY CATEGORY / CLASS / ÖVRIGT)                */}
      {/* ======================================================================== */}
      {activeSubTab === 'ACCOUNTS' && (
        <div className="space-y-4">
          {/* COMPACT SEARCH + FILTER BUTTON BAR */}
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Sök namn, klass, grupp eller e-post..."
                  className="w-full min-h-[40px] pl-9 pr-8 bg-[#161616] border border-[#2a2a2a] focus:border-orange-500 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter & Sortering Button (Hides filters until clicked) */}
              <button
                type="button"
                onClick={() => setIsFilterMenuOpen((prev) => !prev)}
                className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                  isFilterMenuOpen || activeFilterCount > 0
                    ? 'bg-orange-500/15 border-orange-500/60 text-orange-300'
                    : 'bg-[#161616] hover:bg-[#202020] border-[#2a2a2a] text-slate-200'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-orange-400" />
                <span>Filter & Visning</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-orange-500 text-black font-black text-[10px] rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${isFilterMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <button
                type="button"
                onClick={loadUsers}
                disabled={isLoading}
                title="Uppdatera kontolista"
                className="min-h-[40px] px-3 bg-[#161616] hover:bg-[#202020] text-slate-300 border border-[#2a2a2a] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
                <span className="hidden sm:inline">Uppdatera</span>
              </button>
            </div>

            {/* Active Filter Summary Chips (only shown when a filter is active) */}
            {(activeFilter !== 'ALL' || selectedGroupFilter !== 'ALL') && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400">Aktiva filter:</span>
                {activeFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('ALL')}
                    className="px-2.5 py-0.5 rounded-lg bg-orange-500/15 border border-orange-500/40 text-orange-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Roll: {getContextualRoleLabel(activeFilter, activeContextMode)}</span>
                    <span>✕</span>
                  </button>
                )}
                {selectedGroupFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedGroupFilter('ALL')}
                    className="px-2.5 py-0.5 rounded-lg bg-orange-500/15 border border-orange-500/40 text-orange-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>
                      Kategori:{' '}
                      {selectedGroupFilter === '__UNASSIGNED__'
                        ? 'Övrigt (Utan klass)'
                        : selectedGroupFilter.replace('CLASS:', '')}
                    </span>
                    <span>✕</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('ALL');
                    setSelectedGroupFilter('ALL');
                  }}
                  className="text-[11px] text-slate-400 hover:text-white underline ml-1 cursor-pointer"
                >
                  Rensa alla
                </button>
              </div>
            )}

            {/* COLLAPSIBLE FILTER & SORTING POPOVER PANEL */}
            {isFilterMenuOpen && (
              <div className="mt-2 p-4 bg-[#181818] border border-[#333333] rounded-2xl shadow-2xl space-y-4 z-20">
                <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Filtrera & Gruppera Konton
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFilterMenuOpen(false)}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 cursor-pointer"
                  >
                    Klar ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* 1. Gruppera konton efter */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 block uppercase">
                      Gruppera lista efter
                    </label>
                    <select
                      value={groupingStyle}
                      onChange={(e) => setGroupingStyle(e.target.value as GroupingStyle)}
                      className="w-full min-h-[38px] px-3 bg-[#121212] border border-[#2e2e2e] rounded-xl text-xs font-bold text-white outline-none focus:border-orange-500"
                    >
                      <option value="CLASS_CATEGORY">
                        {vocab.classLabel} / Tillhörighet + Övrigt (Standard)
                      </option>
                      <option value="PROGRAM_GROUP">
                        {vocab.groupLabel} + Övrigt
                      </option>
                      <option value="ROLE_ONLY">
                        Endast Roll ({vocab.roleSchoolAdminShort} / {vocab.roleTeacherShort} / {vocab.roleStudentShort})
                      </option>
                    </select>
                  </div>

                  {/* 2. Filtrera på roll */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 block uppercase">
                      Behörighetsroll
                    </label>
                    <select
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value as any)}
                      className="w-full min-h-[38px] px-3 bg-[#121212] border border-[#2e2e2e] rounded-xl text-xs font-bold text-white outline-none focus:border-orange-500"
                    >
                      <option value="ALL">Alla roller ({visibleUsersForCaller.length})</option>
                      <option value="STUDENT">{vocab.roleStudent}</option>
                      <option value="TEACHER">{vocab.roleTeacher}</option>
                      {isAdmin && <option value="SCHOOL_ADMIN">{vocab.roleSchoolAdmin}</option>}
                      {isMainAdmin && <option value="ADMIN">{vocab.roleAdmin}</option>}
                    </select>
                  </div>

                  {/* 3. Filtrera på Klass eller Grupp */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 block uppercase">
                      {vocab.classLabel} / {vocab.groupLabel}
                    </label>
                    <select
                      value={selectedGroupFilter}
                      onChange={(e) => setSelectedGroupFilter(e.target.value)}
                      className="w-full min-h-[38px] px-3 bg-[#121212] border border-[#2e2e2e] rounded-xl text-xs font-bold text-white outline-none focus:border-orange-500"
                    >
                      <option value="ALL">Alla kategorier</option>
                      <option value="__UNASSIGNED__">
                        Övrigt (Utan {vocab.classLabel.toLowerCase()} / grupp)
                      </option>
                      {allAvailableClasses.length > 0 && (
                        <optgroup label={vocab.classLabel}>
                          {allAvailableClasses.map((cls) => (
                            <option key={`cls_${cls}`} value={`CLASS:${cls}`}>
                              {vocab.classLabel}: {cls}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label={vocab.groupLabel}>
                        {allAvailableGroups.map((grp) => (
                          <option key={`grp_${grp}`} value={grp}>
                            {grp}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#262626]">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">Sortering inom kategori:</span>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                      className="min-h-[34px] px-2.5 bg-[#121212] border border-[#2e2e2e] rounded-lg text-xs font-bold text-white outline-none"
                    >
                      <option value="NAME_ASC">Namn (A–Ö)</option>
                      <option value="NAME_DESC">Namn (Ö–A)</option>
                      <option value="LAST_LOGIN">Senast inloggad</option>
                      <option value="NEWEST">Nyast skapad</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRankInfoPanel((prev) => !prev)}
                      className="px-3 py-1.5 rounded-lg bg-[#121212] hover:bg-[#222222] border border-[#2e2e2e] text-[11px] font-bold text-slate-300 cursor-pointer"
                    >
                      {showRankInfoPanel ? 'Dölj behörighetsinfo' : 'Visa behörighetsnivåer & licens'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFilter('ALL');
                        setSelectedGroupFilter('ALL');
                        setSortOrder('NAME_ASC');
                        setGroupingStyle('CLASS_CATEGORY');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#121212] hover:bg-[#222222] text-[11px] font-bold text-slate-400 hover:text-white cursor-pointer"
                    >
                      Återställ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* OPTIONAL RANK & LICENSE INFO PANEL (Hidden by default to keep UI super clean) */}
          {showRankInfoPanel && (
            <div className="p-4 rounded-2xl bg-[#161616] border border-[#2a2a2a] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-white uppercase tracking-wider">
                  Behörighetssystem (Rank 1–4) & Systeminställningar
                </span>
                <button
                  type="button"
                  onClick={() => setShowRankInfoPanel(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  Stäng ✕
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl bg-[#111111] border border-[#242424]">
                  <span className="text-[10px] font-black text-purple-300 uppercase block">
                    Rank 4 • {vocab.roleAdmin}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Full kontroll över hela systemet.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#111111] border border-[#242424]">
                  <span className="text-[10px] font-black text-amber-300 uppercase block">
                    Rank 3 • {vocab.roleSchoolAdminShort}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Hanterar alla lärare, handledare och klasser.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#111111] border border-[#242424]">
                  <span className="text-[10px] font-black text-sky-300 uppercase block">
                    Rank 2 • {vocab.roleTeacherShort}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Skapar och hanterar konton i sina klasser/grupper.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#111111] border border-[#242424]">
                  <span className="text-[10px] font-black text-emerald-300 uppercase block">
                    Rank 1 • {vocab.roleStudent}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Dokumenterar arbete. Kan ej redigera konton.</p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#242424]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Licensnyckel:</span>
                    <code className="px-2 py-0.5 rounded bg-[#111111] text-orange-400 font-mono">
                      {license.licenseKey}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyLicenseKey}
                      className="text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleRequireLogin(!license.requireLoginOnStartup)}
                    className="px-3 py-1 rounded-lg bg-[#111111] hover:bg-[#222222] border border-[#2e2e2e] text-slate-200 font-bold cursor-pointer"
                  >
                    Inloggningskrav vid start: {license.requireLoginOnStartup ? 'PÅ' : 'AV'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CATEGORIZED ACCOUNT LISTS */}
          {categoryBuckets.length === 0 ? (
            <div className="p-10 text-center bg-[#151515] border border-[#262626] rounded-2xl space-y-2">
              <Users className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-white">Inga konton matchar din sökning eller ditt filter</p>
              <p className="text-xs text-slate-400">
                Prova att rensa sökfältet eller klicka på &quot;Nytt konto&quot; för att lägga till någon.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryBuckets.map((bucket) => {
                const isCollapsed = !!collapsedCategories[bucket.id];
                const toneClasses =
                  bucket.badgeTone === 'purple'
                    ? 'text-purple-300 bg-purple-950/60 border-purple-700/50'
                    : bucket.badgeTone === 'sky'
                    ? 'text-sky-300 bg-sky-950/60 border-sky-700/50'
                    : bucket.badgeTone === 'emerald'
                    ? 'text-emerald-300 bg-emerald-950/60 border-emerald-700/50'
                    : 'text-slate-300 bg-[#222222] border-[#383838]';

                return (
                  <div
                    key={bucket.id}
                    className="bg-[#151515] border border-[#262626] rounded-2xl overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="px-4 py-3 bg-[#1a1a1a] flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleCategoryCollapse(bucket.id)}
                        className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-orange-400 shrink-0" />
                        )}
                        <div className="min-w-0 flex flex-wrap items-center gap-2">
                          <span className="font-black text-sm text-white truncate">{bucket.title}</span>
                          {bucket.subtitle && (
                            <span className="text-xs text-slate-400 hidden sm:inline truncate">
                              • {bucket.subtitle}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${toneClasses}`}
                          >
                            {bucket.users.length} {bucket.users.length === 1 ? 'konto' : 'konton'}
                          </span>
                        </div>
                      </button>

                      {/* Quick add account directly into this category */}
                      <button
                        type="button"
                        onClick={() => handleQuickAddInCategory(bucket)}
                        title={`Lägg till nytt konto i ${bucket.title}`}
                        className="px-2.5 py-1 rounded-lg bg-[#222222] hover:bg-[#2c2c2c] text-slate-300 hover:text-white border border-[#333333] text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3 text-orange-400" />
                        <span className="hidden sm:inline">Lägg till här</span>
                      </button>
                    </div>

                    {/* Simple, Clean List Rows inside Category */}
                    {!isCollapsed && (
                      <div className="divide-y divide-[#222222]">
                        {bucket.users.map((u) => {
                          const isCurrent = currentUser?.id === u.id;
                          const editable = canEditUser(currentUser, u);
                          const deletable = canDeleteUser(currentUser, u) && !isCurrent;

                          return (
                            <div
                              key={u.id}
                              className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                                isCurrent ? 'bg-orange-500/5' : 'hover:bg-[#1b1b1b]'
                              }`}
                            >
                              {/* Left: Name, Email & Category Details */}
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-sm text-white truncate">
                                    {u.displayName}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">
                                      Inloggad (Du)
                                    </span>
                                  )}
                                  <span className="text-[11px] text-slate-400 font-mono truncate">
                                    {u.email}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-0.5">
                                  <span>{getContextualRoleLabel(u.role, activeContextMode)}</span>
                                  {u.role === 'STUDENT' && (
                                    <>
                                      <span>
                                        • {vocab.classLabel}:{' '}
                                        <strong className="text-slate-300">
                                          {u.schoolClass?.trim() || 'Övrigt (Ingen klass)'}
                                        </strong>
                                      </span>
                                      {u.studentGroup && (
                                        <span>
                                          • <span className="text-slate-300">{u.studentGroup}</span>
                                        </span>
                                      )}
                                    </>
                                  )}
                                  {u.password && editable && (
                                    <span>
                                      • Lösenord: <code className="text-slate-300">{u.password}</code>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Right: Clean Action Buttons */}
                              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                {editingPasswordUserId === u.id ? (
                                  <div className="flex items-center gap-1.5 bg-[#111111] p-1 rounded-xl border border-orange-500/60">
                                    <input
                                      type="text"
                                      value={newPasswordVal}
                                      onChange={(e) => setNewPasswordVal(e.target.value)}
                                      placeholder="Nytt lösenord..."
                                      className="w-28 px-2 py-1 bg-transparent text-xs text-white outline-none"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdatePassword(u.id)}
                                      className="px-2.5 py-1 bg-orange-500 text-black font-black text-[11px] rounded-lg cursor-pointer"
                                    >
                                      Spara
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPasswordUserId(null);
                                        setNewPasswordVal('');
                                      }}
                                      className="px-2 py-1 text-slate-400 hover:text-white text-[11px] cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    {editable && (
                                      <button
                                        type="button"
                                        onClick={() => openEditUserModal(u)}
                                        className="px-3 py-1.5 rounded-lg bg-[#202020] hover:bg-[#2a2a2a] text-slate-200 border border-[#303030] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                                        <span>Ändra</span>
                                      </button>
                                    )}

                                    {editable && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingPasswordUserId(u.id);
                                          setNewPasswordVal(u.password || '1234');
                                        }}
                                        title="Byt lösenord"
                                        className="px-2.5 py-1.5 rounded-lg bg-[#202020] hover:bg-[#2a2a2a] text-slate-300 border border-[#303030] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                      >
                                        <Key className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="hidden md:inline">Lösenord</span>
                                      </button>
                                    )}

                                    {deletable && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteUser(u.id)}
                                        title="Ta bort konto"
                                        className="p-1.5 rounded-lg bg-[#202020] hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 border border-[#303030] cursor-pointer transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================================== */}
      {/* TAB 2: HANTERA KLASSER & GRUPPER (BULK SORTERING)                        */}
      {/* ======================================================================== */}
      {activeSubTab === 'GROUPS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white">Hantera {vocab.classLabel} & Kategorier</h2>
            <button
              type="button"
              onClick={() => setActiveSubTab('ACCOUNTS')}
              className="px-3 py-1.5 rounded-xl bg-[#181818] border border-[#2e2e2e] text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
            >
              Tillbaka till kontolistan
            </button>
          </div>
          <StudentGroupsManagerPanel
            allUsers={visibleUsersForCaller}
            customGroups={customGroups}
            onUpdateCustomGroups={(updated) => {
              setCustomGroups(updated);
            }}
            selectedGroupFilter={selectedGroupFilter}
            onSelectGroupFilter={(grp) => {
              setSelectedGroupFilter(grp);
              setActiveSubTab('ACCOUNTS');
            }}
            onBulkAssignGroup={handleBulkAssignGroup}
          />
        </div>
      )}

      {/* ======================================================================== */}
      {/* TAB 3: SKAPA NYTT KONTO                                                  */}
      {/* ======================================================================== */}
      {activeSubTab === 'CREATE' && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#242424] pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Skapa nytt konto</h2>
              <p className="text-xs text-slate-400">
                Välj kategori/roll och vilken {vocab.classLabel.toLowerCase()} eller grupp kontot ska tillhöra (eller lämna tom för Övrigt).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('ACCOUNTS')}
              className="px-3 py-1.5 rounded-xl bg-[#202020] text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
            >
              Avbryt ✕
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Namn (För- och efternamn)</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="T.ex. Anders Svensson"
                  className="w-full min-h-[42px] px-3.5 bg-[#111111] border border-[#2e2e2e] focus:border-orange-500 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">E-post eller användarnamn</label>
                <input
                  type="text"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="T.ex. anders@skola.se"
                  className="w-full min-h-[42px] px-3.5 bg-[#111111] border border-[#2e2e2e] focus:border-orange-500 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Lösenord</label>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="1234"
                  className="w-full min-h-[42px] px-3.5 bg-[#111111] border border-[#2e2e2e] focus:border-orange-500 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Roll / Kategori</label>
                <select
                  value={isAdmin ? newUserRole : 'STUDENT'}
                  disabled={!isAdmin}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full min-h-[42px] px-3.5 bg-[#111111] border border-[#2e2e2e] focus:border-orange-500 rounded-xl text-xs font-bold text-white outline-none"
                >
                  <option value="STUDENT">{vocab.roleStudent}</option>
                  {isAdmin && <option value="TEACHER">{vocab.roleTeacher}</option>}
                  {isAdmin && <option value="SCHOOL_ADMIN">{vocab.roleSchoolAdmin}</option>}
                  {isMainAdmin && <option value="ADMIN">{vocab.roleAdmin}</option>}
                </select>
              </div>
            </div>

            {(isAdmin ? newUserRole === 'STUDENT' : true) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#242424]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">
                      {vocab.classLabel} (lämna tom för &quot;Övrigt&quot;)
                    </label>
                    {newUserClass && (
                      <button
                        type="button"
                        onClick={() => setNewUserClass('')}
                        className="text-[11px] text-orange-400 hover:underline cursor-pointer"
                      >
                        Sätt som Övrigt (ingen klass)
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newUserClass}
                    onChange={(e) => setNewUserClass(e.target.value)}
                    placeholder="T.ex. BA25, ANL26 eller lämna tom för Övrigt"
                    className="w-full min-h-[42px] px-3.5 bg-[#111111] border border-[#2e2e2e] focus:border-orange-500 rounded-xl text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">{vocab.groupLabel}</label>
                    <button
                      type="button"
                      onClick={() => setIsNewGroupModalOpen(true)}
                      className="text-[11px] text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FolderPlus className="w-3 h-3" /> Ny grupp
                    </button>
                  </div>
                  <select
                    value={newUserGroup}
                    onChange={(e) => setNewUserGroup(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 bg-[#111111] border border-[#2e2e2e] focus:border-orange-500 rounded-xl text-xs font-bold text-white outline-none"
                  >
                    <option value="__NONE__">Ingen specifik grupp (Övrigt)</option>
                    {allAvailableGroups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Skriv in egen grupp...</option>
                  </select>
                  {newUserGroup === '__CUSTOM__' && (
                    <input
                      type="text"
                      value={newUserCustomGroup}
                      onChange={(e) => setNewUserCustomGroup(e.target.value)}
                      placeholder="Ange namn på ny grupp..."
                      className="w-full min-h-[38px] px-3 mt-1.5 bg-[#111111] border border-orange-500 rounded-xl text-xs text-white outline-none"
                    />
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setActiveSubTab('ACCOUNTS')}
                className="min-h-[42px] px-4 rounded-xl bg-[#202020] hover:bg-[#2a2a2a] text-slate-300 text-xs font-bold cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="min-h-[42px] px-5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isCreating ? 'Skapar...' : 'Spara nytt konto'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================================== */}
      {/* TAB 4: ENGÅNGSKODER & WHITELIST (REGISTRATION SECURITY FOR PAYWALL)       */}
      {/* ======================================================================== */}
      {activeSubTab === 'INVITES_WHITELIST' && (
        <div className="space-y-6 animate-in fade-in">
          {/* TOP MASTER CARD: SECURITY ENFORCEMENT & TOGGLE */}
          <div className="bg-[#161616] border border-amber-500/40 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">
                    Registreringskontroll & Behörighet (Skydd mot fri registrering)
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Styr vem som kan registrera konto i appen. När skyddet är påslaget kan ingen obehörig
                    skapa konto gratis – perfekt när du vill ta betalt i framtiden! Användare måste antingen
                    ha en <strong className="text-amber-300">unik engångskod</strong> eller en <strong className="text-emerald-300">vitlistad e-postadress</strong>.
                  </p>
                </div>
              </div>

              {/* Master toggle button */}
              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleSecuritySettings(!secSettings.requireInviteCodeOrWhitelist)}
                  className={`min-h-[42px] px-4 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                    secSettings.requireInviteCodeOrWhitelist
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  }`}
                >
                  {secSettings.requireInviteCodeOrWhitelist ? (
                    <>
                      <ToggleRight className="w-5 h-5" />
                      <span>Skydd: AKTIVERAT</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5" />
                      <span>Skydd: AVSTÄNGT (Öppet)</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-slate-400">
                  {secSettings.requireInviteCodeOrWhitelist
                    ? 'Engångskod eller whitelist krävs'
                    : 'Alla kan registrera sig fritt'}
                </span>
              </div>
            </div>
          </div>

          {/* TWO COLUMN GRID: 1. GENERATE INVITE CODES, 2. WHITELIST */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUMN 1: GENERATE & MANAGE UNIQUE INVITE CODES */}
            <div className="space-y-4">
              <div className="bg-[#141414] border border-[#2b2b2b] rounded-2xl p-5 space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-black text-white">Generera unika engångskoder</h3>
                  </div>
                  <span className="text-[11px] font-bold text-amber-400/90 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                    Endast Huvudadmin
                  </span>
                </div>

                <form onSubmit={handleGenerateInviteCodes} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Antal koder:</label>
                      <select
                        value={newInviteCount}
                        onChange={(e) => setNewInviteCount(Number(e.target.value))}
                        className="w-full min-h-[38px] px-3 bg-[#1a1a1a] border border-[#333333] rounded-xl text-white outline-none focus:border-amber-400 font-bold"
                      >
                        <option value={1}>1 unik kod</option>
                        <option value={3}>3 unika koder</option>
                        <option value={5}>5 unika koder</option>
                        <option value={10}>10 unika koder</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Kodprefix:</label>
                      <input
                        type="text"
                        value={newInvitePrefix}
                        onChange={(e) => setNewInvitePrefix(e.target.value.toUpperCase())}
                        placeholder="T.ex. FK-INV eller ELEV"
                        className="w-full min-h-[38px] px-3 bg-[#1a1a1a] border border-[#333333] rounded-xl text-white outline-none focus:border-amber-400 font-mono font-bold uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Kontotyp som tilldelas:</label>
                      <select
                        value={newInviteContext}
                        onChange={(e) => setNewInviteContext(e.target.value as AppContextMode)}
                        className="w-full min-h-[38px] px-3 bg-[#1a1a1a] border border-[#333333] rounded-xl text-white outline-none focus:border-amber-400 font-bold"
                      >
                        <option value="WORKPLACE">🏗️ Arbetskonto (Företag)</option>
                        <option value="SCHOOL">🎓 Elevkonto (Skola)</option>
                        <option value="APL">🤝 APL-konto (Praktik)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Roll:</label>
                      <select
                        value={newInviteRole}
                        onChange={(e) => setNewInviteRole(e.target.value as UserRole)}
                        className="w-full min-h-[38px] px-3 bg-[#1a1a1a] border border-[#333333] rounded-xl text-white outline-none focus:border-amber-400 font-bold"
                      >
                        <option value="STUDENT">Elev / Medarbetare</option>
                        <option value="TEACHER">Yrkeslärare / Arbetsledare</option>
                        <option value="SCHOOL_ADMIN">Skolledare / Platschef</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Skola / Företag (valfritt):</label>
                    <input
                      type="text"
                      value={newInviteCompany}
                      onChange={(e) => setNewInviteCompany(e.target.value)}
                      placeholder="T.ex. Skanska AB eller Byggprogrammet"
                      className="w-full min-h-[38px] px-3 bg-[#1a1a1a] border border-[#333333] rounded-xl text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Anteckning / Referens (valfritt):</label>
                    <input
                      type="text"
                      value={newInviteNotes}
                      onChange={(e) => setNewInviteNotes(e.target.value)}
                      placeholder="T.ex. Betald licens kund #440 eller provperiod"
                      className="w-full min-h-[38px] px-3 bg-[#1a1a1a] border border-[#333333] rounded-xl text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isGeneratingCodes}
                    className="w-full min-h-[42px] bg-amber-400 hover:bg-amber-300 text-black font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    <span>{isGeneratingCodes ? 'Genererar...' : 'Skapa unika engångskoder'}</span>
                  </button>
                </form>
              </div>

              {/* LIST OF INVITE CODES */}
              <div className="bg-[#141414] border border-[#282828] rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2.5">
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <span>Genererade koder</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#202020] text-slate-300 text-[10px] font-bold">
                      {inviteCodesList.filter((c) => !c.consumed).length} lediga / {inviteCodesList.length} totalt
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={loadSecurityData}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Uppdatera
                  </button>
                </div>

                {inviteCodesList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Inga engångskoder har skapats ännu. Använd formuläret ovan för att generera koder.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                    {inviteCodesList.map((item) => (
                      <div
                        key={item.code}
                        className={`p-3 rounded-xl border transition-all ${
                          item.consumed
                            ? 'bg-[#121212] border-[#222222] opacity-70'
                            : 'bg-[#181818] border-amber-500/30 hover:border-amber-400/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-amber-400 tracking-wider">
                              {item.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(item.code)}
                              className="px-2 py-1 rounded-md bg-[#252525] hover:bg-[#333333] text-[11px] text-slate-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Kopiera kod"
                            >
                              {copiedCodeVal === item.code ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Kopierad!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Kopiera</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Status Badge */}
                          {item.consumed ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                              Förbrukad
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold">
                              Ledig (1 reg)
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="mt-2 text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>
                            Typ:{' '}
                            <strong className="text-slate-200">
                              {item.accountContext === 'SCHOOL'
                                ? 'Elev'
                                : item.accountContext === 'APL'
                                ? 'APL'
                                : 'Arbete'}
                            </strong>
                          </span>
                          <span>
                            Roll:{' '}
                            <strong className="text-slate-200">
                              {item.roleToAssign === 'TEACHER' ? 'Lärare' : 'Elev/Medarbetare'}
                            </strong>
                          </span>
                          {item.companyOrSchool && (
                            <span>
                              Org: <strong className="text-slate-200">{item.companyOrSchool}</strong>
                            </span>
                          )}
                        </div>

                        {item.consumed && item.consumedBy && (
                          <div className="mt-1.5 p-1.5 rounded-lg bg-black/40 border border-[#282828] text-[10px] text-rose-300/90">
                            Användes av: <strong className="text-white">{item.consumedBy}</strong> ({item.consumedAt})
                          </div>
                        )}

                        {item.notes && (
                          <div className="mt-1 text-[10px] text-slate-500 italic">
                            Notering: {item.notes}
                          </div>
                        )}

                        <div className="mt-2 pt-2 border-t border-[#222222] flex items-center justify-between text-[10px] text-slate-500">
                          <span>Skapad: {item.createdAt}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteInviteCode(item.code)}
                            className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Ta bort</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: WHITELISTED EMAILS & DOMAINS */}
            <div className="space-y-4">
              <div className="bg-[#141414] border border-[#2b2b2b] rounded-2xl p-5 space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-black text-white">Vitlista e-postadresser & Domäner</h3>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400/90 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    Slipp ange kod
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Personer vars e-postadress matchar reglerna nedan kan <strong className="text-white">registrera sig direkt</strong> utan
                  att behöva ange någon inbjudningskod. Du kan vitlista antingen en enskild person eller en hel domän!
                </p>

                <form onSubmit={handleAddWhitelistItem} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">
                      E-postadress eller Domän *:
                    </label>
                    <input
                      type="text"
                      value={newWhitelistPattern}
                      onChange={(e) => setNewWhitelistPattern(e.target.value)}
                      placeholder="T.ex. @skola.se, @foretag.se eller elev@skola.se"
                      className="w-full min-h-[38px] px-3 bg-[#1a1a1a] border border-[#333333] rounded-xl text-white outline-none focus:border-emerald-400 font-mono"
                      required
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Börja med <code className="text-emerald-400">@</code> för att vitlista alla användare från en hel organisation (t.ex. <code className="text-emerald-400">@skola.se</code>).
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Beskrivning / Anteckning (valfritt):</label>
                    <input
                      type="text"
                      value={newWhitelistDesc}
                      onChange={(e) => setNewWhitelistDesc(e.target.value)}
                      placeholder="T.ex. Byggskolans elever eller Betalande kund Peab AB"
                      className="w-full min-h-[38px] px-3 bg-[#1a1a1a] border border-[#333333] rounded-xl text-white outline-none focus:border-emerald-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingWhitelist}
                    className="w-full min-h-[42px] bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10 transition-colors"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{isAddingWhitelist ? 'Lägger till...' : 'Lägg till i Whitelist'}</span>
                  </button>
                </form>
              </div>

              {/* LIST OF WHITELIST ITEMS */}
              <div className="bg-[#141414] border border-[#282828] rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2.5">
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <span>Aktiva vitlistade regler</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#202020] text-emerald-400 text-[10px] font-bold">
                      {whitelistList.length} st aktiva
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={loadSecurityData}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Uppdatera
                  </button>
                </div>

                {whitelistList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Inga regler i whitelist. Alla måste ange en engångskod för att registrera sig.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                    {whitelistList.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-[#181818] border border-emerald-500/30 hover:border-emerald-400/60 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-emerald-300">
                              {item.pattern}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-200 shrink-0">
                              {item.pattern.startsWith('@') ? '🌐 Hel domän' : '👤 Exakt e-post'}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-slate-300 truncate">
                              {item.description}
                            </p>
                          )}
                          <div className="text-[10px] text-slate-500">
                            Tillagd {item.addedAt} av {item.addedBy || 'Huvudadministratör'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteWhitelistItem(item.id, item.pattern)}
                          className="min-h-[32px] px-2.5 rounded-lg bg-[#242424] hover:bg-rose-950 hover:text-rose-400 text-slate-400 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                          title="Ta bort från whitelist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Ta bort</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL: EDIT ACCOUNT                                                      */}
      {/* ======================================================================== */}
      {editingUser && (
        <div
          onClick={() => setEditingUser(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#181818] border border-[#333333] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div>
                <h3 className="text-base font-black text-white">Redigera konto</h3>
                <p className="text-xs text-slate-400">{editingUser.displayName}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Stäng ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Namn</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full min-h-[40px] px-3 bg-[#111111] border border-[#2e2e2e] rounded-xl text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">E-post / Användarnamn</label>
                  <input
                    type="text"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full min-h-[40px] px-3 bg-[#111111] border border-[#2e2e2e] rounded-xl text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Lösenord</label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full min-h-[40px] px-3 bg-[#111111] border border-[#2e2e2e] rounded-xl text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Kategori / Roll</label>
                  <select
                    value={editRole}
                    disabled={!isAdmin}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full min-h-[40px] px-3 bg-[#111111] border border-[#2e2e2e] rounded-xl font-bold text-white outline-none focus:border-orange-500"
                  >
                    <option value="STUDENT">{vocab.roleStudent}</option>
                    <option value="TEACHER">{vocab.roleTeacher}</option>
                    <option value="SCHOOL_ADMIN">{vocab.roleSchoolAdmin}</option>
                    {isMainAdmin && <option value="ADMIN">{vocab.roleAdmin}</option>}
                  </select>
                </div>
              </div>

              {editRole === 'STUDENT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#262626]">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-300">{vocab.classLabel}</label>
                      {editSchoolClass && (
                        <button
                          type="button"
                          onClick={() => setEditSchoolClass('')}
                          className="text-[10px] text-orange-400 hover:underline cursor-pointer"
                        >
                          Flytta till Övrigt
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editSchoolClass}
                      onChange={(e) => setEditSchoolClass(e.target.value)}
                      placeholder="Lämna tom för Övrigt"
                      className="w-full min-h-[40px] px-3 bg-[#111111] border border-[#2e2e2e] rounded-xl text-white outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">{vocab.groupLabel}</label>
                    <select
                      value={editGroup}
                      onChange={(e) => setEditGroup(e.target.value)}
                      className="w-full min-h-[40px] px-3 bg-[#111111] border border-[#2e2e2e] rounded-xl font-bold text-white outline-none focus:border-orange-500"
                    >
                      <option value="__NONE__">Ingen grupp (Övrigt)</option>
                      {allAvailableGroups.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                      <option value="__CUSTOM__">+ Ny egen grupp...</option>
                    </select>
                    {editGroup === '__CUSTOM__' && (
                      <input
                        type="text"
                        value={editCustomGroup}
                        onChange={(e) => setEditCustomGroup(e.target.value)}
                        placeholder="Ange ny grupp..."
                        className="w-full min-h-[36px] px-3 mt-1.5 bg-[#111111] border border-orange-500 rounded-xl text-white outline-none"
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">{vocab.orgLabel}</label>
                  <input
                    type="text"
                    value={editSchool}
                    onChange={(e) => setEditSchool(e.target.value)}
                    className="w-full min-h-[40px] px-3 bg-[#111111] border border-[#2e2e2e] rounded-xl text-white outline-none focus:border-orange-500"
                  />
                </div>
                {editRole === 'STUDENT' && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Ansvarig {vocab.roleTeacherShort}</label>
                    <select
                      value={editTeacherId}
                      onChange={(e) => setEditTeacherId(e.target.value)}
                      className="w-full min-h-[40px] px-3 bg-[#111111] border border-[#2e2e2e] rounded-xl text-white outline-none focus:border-orange-500"
                    >
                      <option value="">Ej angiven</option>
                      {allTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="min-h-[40px] px-4 rounded-xl bg-[#222222] text-slate-300 font-bold cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="min-h-[40px] px-5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black cursor-pointer"
                >
                  {isSavingEdit ? 'Sparar...' : 'Spara ändringar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW GROUP */}
      {isNewGroupModalOpen && (
        <div
          onClick={() => setIsNewGroupModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#181818] border border-[#333333] rounded-2xl max-w-sm w-full p-5 space-y-4"
          >
            <h3 className="text-sm font-black text-white">Skapa ny kategori / grupp</h3>
            <input
              type="text"
              value={newGroupNameInput}
              onChange={(e) => setNewGroupNameInput(e.target.value)}
              placeholder="T.ex. Marklag Syd eller BA26..."
              className="w-full min-h-[40px] px-3 bg-[#111111] border border-[#2e2e2e] rounded-xl text-xs text-white outline-none focus:border-orange-500"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewGroupModalOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-[#222222] text-xs font-bold text-slate-300"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleAddNewCustomGroup}
                className="px-4 py-2 rounded-xl bg-orange-500 text-black text-xs font-black"
              >
                Skapa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER EXERCISE CREATOR MODAL */}
      {isExerciseCreatorOpen && (
        <TeacherExerciseCreatorModal
          isOpen={isExerciseCreatorOpen}
          currentUser={currentUser}
          onClose={() => setIsExerciseCreatorOpen(false)}
          onStartExerciseProject={(ex) => {
            setIsExerciseCreatorOpen(false);
            if (onStartExerciseProject) {
              onStartExerciseProject(ex);
            }
          }}
        />
      )}
    </div>
  );
};
