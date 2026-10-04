import React, { useState, useEffect } from 'react';
import { Project, ViewState, UserSettings, ProjectType, MomentPhoto, UserAccount, TeacherExercise } from './types';
import {
  getAllProjects,
  saveProject,
  softDeleteProject,
  deleteProject,
  seedInitialDemoProjectsIfEmpty,
  getUserSettings,
  saveUserSettings,
} from './db/indexedDb';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CreateProjectView } from './components/CreateProjectView';
import { ChecklistView } from './components/ChecklistView';
import { ReportModal } from './components/ReportModal';
import { BackupModal } from './components/BackupModal';
import { SetupWizardModal } from './components/SetupWizardModal';
import { NavigationMenuModal } from './components/NavigationMenuModal';
import { PreInspectionTutorialModal } from './components/PreInspectionTutorialModal';
import { CollaborationModal } from './components/CollaborationModal';
import { PhotoArchiveModal } from './components/PhotoArchiveModal';
import { CrossMeasureCalculatorModal } from './components/CrossMeasureCalculatorModal';
import { QuickNotesModal } from './components/QuickNotesModal';
import { FieldHelperModal } from './components/FieldHelperModal';
import { safeFetchJson } from './services/apiHelper';
import { TrashBinModal } from './components/TrashBinModal';
import { TeacherNoticesModal } from './components/TeacherNoticesModal';
import { AccountsView } from './components/AccountsView';
import { APKExportView } from './components/APKExportView';
import { ProjectRevisionsModal } from './components/ProjectRevisionsModal';
import { MobileInstallModal } from './components/MobileInstallModal';
import { LoginView } from './components/LoginView';
import { SettingsModal } from './components/SettingsModal';
import { GdprPrivacyModal } from './components/GdprPrivacyModal';
import { TeacherExerciseCreatorModal } from './components/TeacherExerciseCreatorModal';
import { convertExerciseToProject } from './services/exerciseService';
import { inferAccountContextMode } from './utils/contextLabels';
import { syncCustomAppUrlFromCloud } from './utils/appUrl';
import { TeacherFieldInspectionView } from './components/TeacherFieldInspectionView';
import {
  pushStudentProjectToCloud,
  syncAllLocalProjectsToCloud,
} from './services/studentWorkService';

export default function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeReportProject, setActiveReportProject] = useState<Project | null>(null);

  // Modals state
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isCrossMeasureOpen, setIsCrossMeasureOpen] = useState(false);
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false);
  const [isFieldHelperOpen, setIsFieldHelperOpen] = useState(false);
  const [isTrashBinOpen, setIsTrashBinOpen] = useState(false);
  const [isNoticesOpen, setIsNoticesOpen] = useState(false);
  const [isRevisionsOpen, setIsRevisionsOpen] = useState(false);
  const [isMobileInstallOpen, setIsMobileInstallOpen] = useState(false);
  const [isExerciseCreatorOpen, setIsExerciseCreatorOpen] = useState(false);
  const [isGdprOpen, setIsGdprOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; title: string } | null>(null);

  const [userSettings, setUserSettings] = useState<UserSettings>(getUserSettings());
  const [isLoading, setIsLoading] = useState(true);

  // User Accounts & Authentication State (Persists across sessions via localStorage)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const raw = localStorage.getItem('falthjalp_current_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [unreadNoticesCount, setUnreadNoticesCount] = useState<number>(0);

  // Check unread notices from server
  const checkNotices = async () => {
    try {
      const res = await safeFetchJson<{ notifications: any[] }>('/api/notifications');
      if (res.ok && res.data?.notifications) {
        const list = res.data.notifications || [];
        if (currentUser) {
          let localReadIds: string[] = [];
          try {
            const raw = localStorage.getItem(`falthjalp_read_notices_${currentUser.id}`);
            if (raw) localReadIds = JSON.parse(raw);
          } catch {}
          const unread = list.filter(
            (n: any) =>
              n.id !== 'notif_1' &&
              (!n.readBy || !n.readBy.includes(currentUser.id)) &&
              !localReadIds.includes(n.id)
          ).length;
          setUnreadNoticesCount(unread);
        } else {
          setUnreadNoticesCount(0);
        }
      } else {
        setUnreadNoticesCount(0);
      }
    } catch {
      setUnreadNoticesCount(0);
    }
  };

  useEffect(() => {
    checkNotices();
    // Battery-saving interval: check only every 60s when active, or on focus
    const interval = setInterval(() => {
      if (!document.hidden) {
        checkNotices();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Smart battery-efficient sync: sync on app resume / tab focus without draining battery outdoors
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkNotices();
        if (activeProjectId) {
          const p = projects.find((x) => x.id === activeProjectId);
          if (p?.isGroupProject && p.groupCode) {
            safeFetchJson<{ project: Project }>(`/api/sync/pull?code=${encodeURIComponent(p.groupCode)}`)
              .then((res) => {
                if (res.ok && res.data?.project) {
                  saveProject(res.data.project);
                  setProjects((prev) =>
                    prev.map((x) => (x.id === res.data!.project.id ? res.data!.project : x))
                  );
                }
              })
              .catch(() => {});
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeProjectId, projects]);

  // Load projects from IndexedDB on startup
  const loadProjectsFromDB = async () => {
    try {
      setIsLoading(true);
      await seedInitialDemoProjectsIfEmpty();
      const loaded = await getAllProjects();
      setProjects(loaded);

      // Check if user has completed wizard before
      const settings = getUserSettings();
      setUserSettings(settings);
      if (!settings.hasSeenWizard) {
        setIsWizardOpen(true);
      }
    } catch (err) {
      console.error('Kunde inte läsa projekt från IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjectsFromDB();
    syncCustomAppUrlFromCloud();
  }, []);

  // Sync color palette class and custom CSS variables to document root
  useEffect(() => {
    const palette = userSettings.colorPalette || 'ORANGE_WORK';
    const root = document.documentElement;
    root.classList.remove(
      'palette-yellow',
      'palette-daylight',
      'palette-blue',
      'palette-emerald',
      'palette-custom'
    );
    if (palette === 'SAFETY_YELLOW') {
      root.classList.add('palette-yellow');
    } else if (palette === 'DAYLIGHT_HIGH_CONTRAST') {
      root.classList.add('palette-daylight');
    } else if (palette === 'NORDIC_BLUE') {
      root.classList.add('palette-blue');
    } else if (palette === 'EMERALD_FOREST') {
      root.classList.add('palette-emerald');
    } else if (palette === 'CUSTOM') {
      root.classList.add('palette-custom');
      const custom = userSettings.activeCustomTheme;
      root.style.setProperty('--custom-accent', custom?.accentHex || '#f97316');
      root.style.setProperty('--custom-bg', custom?.bgHex || '#121212');
      root.style.setProperty('--custom-card', custom?.cardHex || '#1a1a1a');
      root.style.setProperty('--custom-btn-text', custom?.buttonTextHex || '#000000');
    }
  }, [userSettings.colorPalette, userSettings.activeCustomTheme]);

  // Ensure scroll is always at top when navigating between views or projects
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [view, activeProjectId]);

  const handleOpenProject = (id: string) => {
    setActiveProjectId(id);
    setView('CHECKLIST');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Helper to open project-specific tools even if on Dashboard
  const handleOpenToolWithProject = (tool: 'PHOTO' | 'NOTES' | 'TUTORIAL' | 'REVISIONS') => {
    let targetId = activeProjectId;
    if (!targetId && projects.length > 0) {
      targetId = projects[0].id;
      setActiveProjectId(projects[0].id);
    }

    if (!targetId && projects.length === 0) {
      setView('CREATE_PROJECT');
      return;
    }

    if (tool === 'PHOTO') setIsArchiveOpen(true);
    if (tool === 'NOTES') setIsQuickNotesOpen(true);
    if (tool === 'TUTORIAL') setIsTutorialOpen(true);
    if (tool === 'REVISIONS') setIsRevisionsOpen(true);
  };

  // Auto-sync local unsynced projects to cloud so former account work is never lost
  useEffect(() => {
    if (currentUser?.role === 'STUDENT') {
      syncAllLocalProjectsToCloud(currentUser).catch(() => {});
    }
  }, [currentUser]);

  const handleSaveNewProject = async (newProj: Project) => {
    if (currentUser) {
      newProj.creatorId = newProj.creatorId || currentUser.id;
      newProj.creatorName = newProj.creatorName || currentUser.displayName;
      newProj.creatorEmail = newProj.creatorEmail || currentUser.email;
      newProj.creatorRole = newProj.creatorRole || currentUser.role;

      if (currentUser.role === 'STUDENT') {
        newProj.studentId = newProj.studentId || currentUser.id;
        newProj.studentName = newProj.studentName || currentUser.displayName;
        newProj.studentEmail = newProj.studentEmail || currentUser.email;
        newProj.schoolClass =
          newProj.schoolClass || currentUser.schoolClass || currentUser.studentGroup || 'Ospecificerad klass';
        newProj.studentGroup = newProj.studentGroup || currentUser.studentGroup;
      }
    }
    await saveProject(newProj);
    const updated = await getAllProjects();
    setProjects(updated);
    pushStudentProjectToCloud(newProj, currentUser).catch(() => {});
  };

  const handleUpdateProject = async (updatedProj: Project) => {
    if (currentUser && currentUser.role === 'STUDENT') {
      if (!updatedProj.studentId) updatedProj.studentId = currentUser.id;
      if (!updatedProj.studentName) updatedProj.studentName = currentUser.displayName;
      if (!updatedProj.studentEmail) updatedProj.studentEmail = currentUser.email;
      if (!updatedProj.schoolClass)
        updatedProj.schoolClass = currentUser.schoolClass || currentUser.studentGroup || 'Ospecificerad klass';
      if (!updatedProj.studentGroup) updatedProj.studentGroup = currentUser.studentGroup;
      if (!updatedProj.creatorId) updatedProj.creatorId = currentUser.id;
    }
    setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
    await saveProject(updatedProj);
    pushStudentProjectToCloud(updatedProj, currentUser).catch(() => {});
  };

  // Move to Papperskorg (Soft delete)
  const handleDeleteProject = async (id: string) => {
    await softDeleteProject(id);
    const updated = await getAllProjects();
    setProjects(updated);
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setView('DASHBOARD');
    }
  };

  const handleCreateFromWizard = (_type?: ProjectType) => {
    setView('DASHBOARD');
  };

  const handleCompleteTutorial = async (photos: MomentPhoto[]) => {
    if (!activeProjectId) return;
    const p = projects.find((x) => x.id === activeProjectId);
    if (!p) return;

    // Merge photos so we never lose existing ones
    const prevPhotos = p.preInspectionPhotos || [];
    const merged = [...prevPhotos];
    photos.forEach((ph) => {
      const idx = merged.findIndex((m) => m.caption === ph.caption || m.id === ph.id);
      if (idx !== -1) {
        merged[idx] = ph;
      } else {
        merged.push(ph);
      }
    });

    const updatedProj: Project = {
      ...p,
      preInspectionCompleted: merged.length > 0,
      preInspectionPhotos: merged,
    };

    await handleUpdateProject(updatedProj);
  };

  const handleStartExerciseProject = async (exercise: TeacherExercise) => {
    const newProj = convertExerciseToProject(
      exercise,
      currentUser?.displayName || userSettings.userName || 'Elev / Lärling'
    );
    if (currentUser) {
      newProj.creatorId = currentUser.id;
      newProj.creatorName = currentUser.displayName;
      newProj.creatorEmail = currentUser.email;
      newProj.creatorRole = currentUser.role;

      if (currentUser.role === 'STUDENT') {
        newProj.studentId = currentUser.id;
        newProj.studentName = currentUser.displayName;
        newProj.studentEmail = currentUser.email;
        newProj.schoolClass = currentUser.schoolClass || currentUser.studentGroup || 'Ospecificerad klass';
        newProj.studentGroup = currentUser.studentGroup;
      }
    }
    await saveProject(newProj);
    const updated = await getAllProjects();
    setProjects(updated);
    setActiveProjectId(newProj.id);
    setView('CHECKLIST');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    pushStudentProjectToCloud(newProj, currentUser).catch(() => {});
  };

  const handleProjectImported = async (imported: Project) => {
    await loadProjectsFromDB();
    setActiveProjectId(imported.id);
    setView('CHECKLIST');
    setIsCollabOpen(false);
  };

  const handleUserLogin = (user: UserAccount, rememberMe: boolean = true) => {
    const resolvedContext = user.accountContext || inferAccountContextMode(user);
    const enrichedUser: UserAccount = {
      ...user,
      accountContext: resolvedContext,
    };
    setCurrentUser(enrichedUser);
    if (rememberMe) {
      try {
        localStorage.setItem('falthjalp_current_user', JSON.stringify(enrichedUser));
      } catch {}
    }
    const updatedSettings: UserSettings = {
      ...userSettings,
      userName: userSettings.userName || enrichedUser.displayName,
      appContextMode: resolvedContext,
    };
    setUserSettings(updatedSettings);
    saveUserSettings(updatedSettings);
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    setActiveProjectId(null);
    setIsNavMenuOpen(false);
    setIsSettingsOpen(false);
    setIsCollabOpen(false);
    setIsBackupOpen(false);
    setIsNoticesOpen(false);
    setIsMobileInstallOpen(false);
    setIsTrashBinOpen(false);
    setIsFieldHelperOpen(false);
    setIsQuickNotesOpen(false);
    setIsRevisionsOpen(false);
    try {
      localStorage.removeItem('falthjalp_current_user');
      const raw = localStorage.getItem('falthjalp_license');
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.requireLoginOnStartup = true;
      localStorage.setItem('falthjalp_license', JSON.stringify(parsed));
    } catch {}
    setView('DASHBOARD');
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Filter projects by user role:
  // - Students ONLY see their own personal projects (matching studentId, creatorId, or studentEmail)
  // - Teachers/Admins on Dashboard see their own created projects/templates.
  //   Student field projects are inspected separately under "Elever i fält" (FIELD_MONITOR)
  //   so the teacher's personal Dashboard is not flooded with all student work!
  const visibleProjects = projects.filter((p) => {
    if (!currentUser) return false;

    // Student role: Strictly show ONLY the student's own projects
    if (currentUser.role === 'STUDENT') {
      if (p.studentId && p.studentId === currentUser.id) return true;
      if (p.creatorId && p.creatorId === currentUser.id) return true;
      if (p.studentEmail && p.studentEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
      return false;
    }

    // Teacher & Admin roles on main Dashboard:
    // Show projects created by the teacher/admin or assigned to them.
    // If a project has a studentId belonging to another student, it is considered a student field work
    // and is inspected in "Elever i fält" instead of cluttering the teacher's main dashboard.
    const isOtherStudentFieldWork = !!p.studentId && p.studentId !== currentUser.id;
    if (isOtherStudentFieldWork) {
      return false;
    }
    return true;
  });

  // Ensure students never end up in FIELD_MONITOR view
  useEffect(() => {
    if (view === 'FIELD_MONITOR' && currentUser?.role === 'STUDENT') {
      setView('DASHBOARD');
    }
  }, [view, currentUser]);

  // If user is not logged in, strictly gate with LoginView so no projects or data are ever visible
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleUserLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-black">
      {/* Top Header Navigation with ☰ Hamburger Menu */}
      <Header
        currentView={view}
        onNavigate={(newView) => {
          if (newView === 'FIELD_MONITOR' && currentUser?.role === 'STUDENT') {
            setView('DASHBOARD');
            return;
          }
          setView(newView);
          if (newView === 'DASHBOARD') {
            setActiveProjectId(null);
          }
        }}
        projectName={activeProject?.name}
        onOpenMenu={() => setIsNavMenuOpen(true)}
        onOpenCollaboration={() => setIsCollabOpen(true)}
        onOpenReport={() => activeProject && setActiveReportProject(activeProject)}
        onOpenNotices={() => setIsNoticesOpen(true)}
        onOpenQRCodeModal={() => setIsMobileInstallOpen(true)}
        onLogout={handleUserLogout}
        currentUser={currentUser}
        userSettings={userSettings}
        onUpdateUserSettings={(newSettings) => {
          setUserSettings(newSettings);
          saveUserSettings(newSettings);
        }}
        unreadNoticesCount={unreadNoticesCount}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-300 font-semibold text-base">Laddar lokal databas från enheten...</p>
          </div>
        ) : (
          <>
            {view === 'DASHBOARD' && (
              <DashboardView
                projects={visibleProjects}
                onOpenProject={handleOpenProject}
                onCreateNew={() => setView('CREATE_PROJECT')}
                onDeleteProject={handleDeleteProject}
                onOpenReportDirect={(proj) => setActiveReportProject(proj)}
                onOpenCollaboration={() => setIsCollabOpen(true)}
                onOpenTrashBin={() => setIsTrashBinOpen(true)}
                onOpenTutorial={(projId) => {
                  if (projId) setActiveProjectId(projId);
                  handleOpenToolWithProject('TUTORIAL');
                }}
                onOpenExerciseCreator={() => setIsExerciseCreatorOpen(true)}
                onOpenAccounts={() => setView('ACCOUNTS')}
                onOpenFieldMonitor={() => setView('FIELD_MONITOR')}
                onOpenAPKExport={() => setView('APK_EXPORT')}
                currentUser={currentUser}
                userSettings={userSettings}
                onUpdateUserSettings={(newSettings) => {
                  setUserSettings(newSettings);
                  saveUserSettings(newSettings);
                }}
              />
            )}

            {view === 'CREATE_PROJECT' && (
              <CreateProjectView
                onCancel={() => setView('DASHBOARD')}
                userSettings={userSettings}
                currentUser={currentUser}
                onStartExerciseProject={handleStartExerciseProject}
                onOpenExerciseCreator={() => setIsExerciseCreatorOpen(true)}
                onProjectCreated={(newId) => {
                  setActiveProjectId(newId);
                  setView('CHECKLIST');
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }}
                onSaveNewProject={handleSaveNewProject}
              />
            )}

            {view === 'CHECKLIST' && activeProject && (
              <ChecklistView
                project={activeProject}
                userSettings={userSettings}
                onUpdateUserSettings={(newSettings) => {
                  setUserSettings(newSettings);
                  saveUserSettings(newSettings);
                }}
                onUpdateProject={handleUpdateProject}
                onOpenReport={() => setActiveReportProject(activeProject)}
                onBackToDashboard={() => setView('DASHBOARD')}
                onOpenRevisions={() => setIsRevisionsOpen(true)}
                onOpenTutorial={() => setIsTutorialOpen(true)}
              />
            )}

            {view === 'ACCOUNTS' && (
              <AccountsView
                currentUser={currentUser}
                userSettings={userSettings}
                onUserLoggedIn={handleUserLogin}
                onUserLoggedOut={handleUserLogout}
                onBack={() => setView('DASHBOARD')}
                onStartExerciseProject={handleStartExerciseProject}
              />
            )}

            {view === 'APK_EXPORT' && (
              <APKExportView onBack={() => setView('DASHBOARD')} />
            )}

            {view === 'FIELD_MONITOR' && (
              <TeacherFieldInspectionView
                currentUser={currentUser}
                userSettings={userSettings}
                onOpenReport={(proj) => setActiveReportProject(proj)}
                onBackToDashboard={() => setView('DASHBOARD')}
              />
            )}
          </>
        )}
      </main>

      {/* Hamburgermeny Modal (☰) */}
      <NavigationMenuModal
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        userSettings={userSettings}
        onUpdateUserSettings={(newSettings) => {
          setUserSettings(newSettings);
          saveUserSettings(newSettings);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTrashBin={() => setIsTrashBinOpen(true)}
        onOpenNotices={() => setIsNoticesOpen(true)}
        onOpenFieldMonitor={() => {
          setIsNavMenuOpen(false);
          setView('FIELD_MONITOR');
        }}
        onOpenAccounts={() => {
          setIsNavMenuOpen(false);
          setView('ACCOUNTS');
        }}
        onOpenExerciseCreator={() => {
          setIsNavMenuOpen(false);
          setIsExerciseCreatorOpen(true);
        }}
        onOpenAPKExport={() => {
          setIsNavMenuOpen(false);
          setView('APK_EXPORT');
        }}
        onOpenQRCodeModal={() => {
          setIsNavMenuOpen(false);
          setIsMobileInstallOpen(true);
        }}
        onOpenRevisions={() => handleOpenToolWithProject('REVISIONS')}
        onOpenTutorial={() => handleOpenToolWithProject('TUTORIAL')}
        onOpenPhotoArchive={() => handleOpenToolWithProject('PHOTO')}
        onOpenCollaboration={() => setIsCollabOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenGdprModal={() => setIsGdprOpen(true)}
        onOpenCrossMeasure={() => setIsCrossMeasureOpen(true)}
        onOpenQuickNotes={() => handleOpenToolWithProject('NOTES')}
        onOpenFieldHelper={() => setIsFieldHelperOpen(true)}
        onNavigateToDashboard={() => {
          setActiveProjectId(null);
          setView('DASHBOARD');
        }}
        onNavigateToCreate={() => setView('CREATE_PROJECT')}
        onLogout={handleUserLogout}
        activeProject={activeProject}
        currentUser={currentUser}
        unreadNoticesCount={unreadNoticesCount}
      />

      {/* Inställningar Modal (Layout & Färgpalett) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userSettings={userSettings}
        currentUser={currentUser}
        onOpenGdprModal={() => setIsGdprOpen(true)}
        onUpdateUserSettings={(newSettings) => {
          setUserSettings(newSettings);
          saveUserSettings(newSettings);
        }}
        onRerunWizard={() => {
          setIsSettingsOpen(false);
          setIsWizardOpen(true);
        }}
      />

      {/* Versionshistorik & Revisionshantering Modal (Tidsmaskin) */}
      {isRevisionsOpen && activeProject && (
        <ProjectRevisionsModal
          project={activeProject}
          onClose={() => setIsRevisionsOpen(false)}
          onUpdateProject={handleUpdateProject}
          currentUserRole={currentUser?.role}
          currentUserName={currentUser?.displayName}
        />
      )}

      {/* Papperskorg Modal (Borttagna projekt) */}
      <TrashBinModal
        isOpen={isTrashBinOpen}
        onClose={() => setIsTrashBinOpen(false)}
        onProjectsChanged={loadProjectsFromDB}
      />

      {/* Lärarnotiser Modal */}
      <TeacherNoticesModal
        isOpen={isNoticesOpen}
        onClose={() => {
          setIsNoticesOpen(false);
          checkNotices();
        }}
        currentUser={currentUser}
        onUnreadCountChanged={(count) => setUnreadNoticesCount(count)}
      />

      {/* Pre-Inspection Tutorial Modal */}
      {isTutorialOpen && activeProject && (
        <PreInspectionTutorialModal
          project={activeProject}
          onClose={() => setIsTutorialOpen(false)}
          onCompleteTutorial={handleCompleteTutorial}
        />
      )}

      {/* Kryssmåttsberäknare Modal */}
      {isCrossMeasureOpen && (
        <CrossMeasureCalculatorModal
          onClose={() => setIsCrossMeasureOpen(false)}
          onInsertToNotes={(text) => {
            if (activeProject) {
              const cur = activeProject.notes || '';
              handleUpdateProject({
                ...activeProject,
                notes: cur ? cur + '\n' + text : text,
              });
            }
          }}
        />
      )}

      {/* Snabbanteckningar / Fältblock Modal */}
      {isQuickNotesOpen && activeProject && (
        <QuickNotesModal
          project={activeProject}
          onUpdateProject={handleUpdateProject}
          onClose={() => setIsQuickNotesOpen(false)}
        />
      )}

      {/* FältKoll & Byggexpert Modal */}
      {isFieldHelperOpen && (
        <FieldHelperModal
          onClose={() => setIsFieldHelperOpen(false)}
        />
      )}

      {/* Collaboration Modal (Sharing between students / field workers) */}
      {isCollabOpen && (
        <CollaborationModal
          project={activeProject}
          onClose={() => setIsCollabOpen(false)}
          onProjectImported={handleProjectImported}
        />
      )}

      {/* Photo Archive / Folders Modal */}
      {isArchiveOpen && activeProject && (
        <PhotoArchiveModal
          project={activeProject}
          userSettings={userSettings}
          onUpdateUserSettings={(newSettings) => {
            setUserSettings(newSettings);
            saveUserSettings(newSettings);
          }}
          onClose={() => setIsArchiveOpen(false)}
          onOpenLightbox={(url, title) => setLightboxPhoto({ url, title })}
        />
      )}

      {/* Setup Wizard & Settings Modal */}
      {isWizardOpen && (
        <SetupWizardModal
          onClose={() => setIsWizardOpen(false)}
          onOpenDemoProject={() => {
            setIsWizardOpen(false);
            setView('CREATE_PROJECT');
          }}
          onCreateNewProject={handleCreateFromWizard}
          initialSettings={userSettings}
          onSettingsSaved={(newSettings) => {
            setUserSettings(newSettings);
            saveUserSettings(newSettings);
          }}
        />
      )}

      {/* Fullscreen Report Modal */}
      {activeReportProject && (
        <ReportModal
          project={activeReportProject}
          onClose={() => setActiveReportProject(null)}
        />
      )}

      {/* Backup and Cloud Export / Import Modal */}
      {isBackupOpen && (
        <BackupModal
          onClose={() => setIsBackupOpen(false)}
          onDataChanged={loadProjectsFromDB}
        />
      )}

      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 p-4 flex flex-col items-center justify-center cursor-pointer"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="w-full max-w-4xl flex items-center justify-between pb-3 text-white">
            <h4 className="font-semibold text-base truncate">{lightboxPhoto.title}</h4>
            <button
              onClick={() => setLightboxPhoto(null)}
              className="p-2 bg-slate-800 rounded-xl text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
          <img
            src={lightboxPhoto.url}
            alt="Förstorad bild"
            className="max-h-[85vh] max-w-full object-contain rounded-xl border border-slate-700 shadow-2xl"
          />
        </div>
      )}
      {/* Mobilinstallation / QR-kod Modal */}
      <MobileInstallModal
        isOpen={isMobileInstallOpen}
        onClose={() => setIsMobileInstallOpen(false)}
        currentUser={currentUser}
      />

      {/* Lärarpanel: Övningskreatör Modal */}
      <TeacherExerciseCreatorModal
        isOpen={isExerciseCreatorOpen}
        onClose={() => setIsExerciseCreatorOpen(false)}
        currentUser={currentUser}
        onStartExerciseProject={handleStartExerciseProject}
      />

      {/* GDPR, Skolsäkerhet & PUB-avtal Modal */}
      <GdprPrivacyModal
        isOpen={isGdprOpen}
        onClose={() => setIsGdprOpen(false)}
        userSettings={userSettings}
        onUpdateUserSettings={(newSettings) => {
          setUserSettings(newSettings);
          saveUserSettings(newSettings);
        }}
        currentUser={currentUser}
        projects={projects}
      />
    </div>
  );
}
