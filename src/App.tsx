import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, FileDown, FileSpreadsheet, FileText, PenLine, ShieldAlert, X } from 'lucide-react';
import {
  DEFAULT_GURU_PHOTO,
  type RPMDocument,
  type RPMFormData,
} from './types/rpm';
import { createFallbackRPM, validateRPMForm } from './utils/rpmLogic';
import { downloadLKPDAsDoc } from './utils/exportUtils';
import {
  clearWorkspacePin,
  createWorkspace,
  deleteWorkspace,
  listWorkspaces,
  loadWorkspaceForm,
  loadWorkspacePhoto,
  loadWorkspacePin,
  loadWorkspaceRPM,
  resolveInitialWorkspace,
  saveWorkspaceForm,
  saveWorkspacePhoto,
  saveWorkspacePin,
  saveWorkspaceRPM,
  setActiveWorkspaceId,
  updateWorkspaceMetadata,
  type TeacherWorkspaceProfile,
} from './utils/workspaceStorage';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Header } from './components/Header';
import { RPMForm } from './components/RPMForm';
import { RPMTablePreview } from './components/RPMTablePreview';
import { LKPDOnlyPreview } from './components/LKPDOnlyPreview';
import { PinLockModal } from './components/PinLockModal';
import { ChangePinModal } from './components/ChangePinModal';
import { ProfilePhotoModal } from './components/ProfilePhotoModal';
import { PromptAnatomyModal } from './components/PromptAnatomyModal';
import { DesktopShareModal } from './components/DesktopShareModal';
import { TeacherWorkspaceModal } from './components/TeacherWorkspaceModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const initialRef = useRef<{
    workspaces: TeacherWorkspaceProfile[];
    activeId: string;
    createdFromShareLink: boolean;
  } | null>(null);

  if (!initialRef.current) {
    const local = typeof window !== 'undefined' ? window.localStorage : null;
    const session = typeof window !== 'undefined' ? window.sessionStorage : null;
    const search = typeof window !== 'undefined' ? window.location.search : '';
    initialRef.current = resolveInitialWorkspace(local, session, search);
  }

  const [workspaces, setWorkspaces] = useState<TeacherWorkspaceProfile[]>(
    () => initialRef.current!.workspaces
  );
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string>(
    () => initialRef.current!.activeId
  );

  const [accessPin, setAccessPin] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  const [profilePhoto, setProfilePhoto] = useState<string>(() =>
    loadWorkspacePhoto(
      typeof window !== 'undefined' ? window.localStorage : null,
      initialRef.current!.activeId
    )
  );
  const [formData, setFormData] = useState<RPMFormData>(() =>
    loadWorkspaceForm(
      typeof window !== 'undefined' ? window.localStorage : null,
      initialRef.current!.activeId
    )
  );
  const [generatedRPM, setGeneratedRPM] = useState<RPMDocument | null>(() =>
    loadWorkspaceRPM(
      typeof window !== 'undefined' ? window.localStorage : null,
      initialRef.current!.activeId
    )
  );
  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'lkpd'>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RPMFormData | 'general', string>>
  >({});

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  const [isAnatomyModalOpen, setIsAnatomyModalOpen] = useState(false);
  const [isDesktopShareModalOpen, setIsDesktopShareModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];
  const activeWorkspaceName = activeWorkspace?.name || formData.namaGuru || 'Ruang Guru Utama';

  // Clean ?guru=baru from URL once initialized so refreshing does not spawn duplicate rooms
  useEffect(() => {
    if (initialRef.current?.createdFromShareLink && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('guru')) {
        url.searchParams.delete('guru');
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      }
    }
  }, []);

  // Verify saved PIN whenever activeWorkspaceId changes
  useEffect(() => {
    let cancelled = false;
    const verifyWorkspacePin = async () => {
      setIsCheckingSession(true);
      const local = typeof window !== 'undefined' ? window.localStorage : null;
      const session = typeof window !== 'undefined' ? window.sessionStorage : null;
      const saved = loadWorkspacePin(local, session, activeWorkspaceId);

      if (!saved) {
        if (!cancelled) {
          setAccessPin('');
          setIsUnlocked(false);
          setIsCheckingSession(false);
        }
        return;
      }

      // If offline in desktop PWA mode and a saved session PIN exists locally, allow local access cleanly
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (!cancelled) {
          setAccessPin(saved);
          setIsUnlocked(true);
          setIsCheckingSession(false);
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/verify-pin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-workspace-id': activeWorkspaceId,
          },
          body: JSON.stringify({ pin: saved, workspaceId: activeWorkspaceId }),
        });
        const data = await res.json();
        if (!cancelled) {
          if (res.ok && data.valid) {
            setAccessPin(saved);
            setIsUnlocked(true);
          } else {
            clearWorkspacePin(local, session, activeWorkspaceId);
            setAccessPin('');
            setIsUnlocked(false);
          }
        }
      } catch {
        // Offline / server temporarily unreachable while already remembered locally -> allow local workspace
        if (!cancelled) {
          setAccessPin(saved);
          setIsUnlocked(true);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingSession(false);
        }
      }
    };

    verifyWorkspacePin();
    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId]);

  const switchToWorkspace = (targetWorkspaceId: string) => {
    const local = typeof window !== 'undefined' ? window.localStorage : null;
    const session = typeof window !== 'undefined' ? window.sessionStorage : null;

    setActiveWorkspaceId(local, session, targetWorkspaceId);
    setActiveWorkspaceIdState(targetWorkspaceId);
    setWorkspaces(listWorkspaces(local));
    setFormData(loadWorkspaceForm(local, targetWorkspaceId));
    setGeneratedRPM(loadWorkspaceRPM(local, targetWorkspaceId));
    setProfilePhoto(loadWorkspacePhoto(local, targetWorkspaceId));
    setActiveTab('form');
    setErrorMessage('');
    setFieldErrors({});
  };

  const handleCreateWorkspace = (teacherName: string, schoolName: string) => {
    const local = typeof window !== 'undefined' ? window.localStorage : null;
    const session = typeof window !== 'undefined' ? window.sessionStorage : null;
    const created = createWorkspace(local, session, teacherName, schoolName);
    setWorkspaces(listWorkspaces(local));
    switchToWorkspace(created.id);
    setIsWorkspaceModalOpen(false);
  };

  const handleDeleteWorkspace = (targetId: string) => {
    const local = typeof window !== 'undefined' ? window.localStorage : null;
    const session = typeof window !== 'undefined' ? window.sessionStorage : null;
    const result = deleteWorkspace(local, session, targetId);
    setWorkspaces(result.workspaces);
    if (targetId === activeWorkspaceId) {
      switchToWorkspace(result.nextActiveId);
    }
  };

  const handleUnlockSuccess = (pin: string, remember: boolean) => {
    const local = typeof window !== 'undefined' ? window.localStorage : null;
    const session = typeof window !== 'undefined' ? window.sessionStorage : null;
    setAccessPin(pin);
    setIsUnlocked(true);
    saveWorkspacePin(local, session, activeWorkspaceId, pin, remember);
  };

  const handleLockApp = () => {
    const local = typeof window !== 'undefined' ? window.localStorage : null;
    const session = typeof window !== 'undefined' ? window.sessionStorage : null;
    setIsUnlocked(false);
    setAccessPin('');
    clearWorkspacePin(local, session, activeWorkspaceId);
  };

  const handlePinUpdated = (newPin: string) => {
    const local = typeof window !== 'undefined' ? window.localStorage : null;
    const session = typeof window !== 'undefined' ? window.sessionStorage : null;
    setAccessPin(newPin);
    const hasLocal = Boolean(loadWorkspacePin(local, null, activeWorkspaceId));
    saveWorkspacePin(local, session, activeWorkspaceId, newPin, hasLocal);
  };

  const handleSavePhoto = (nextPhoto: string) => {
    const local = typeof window !== 'undefined' ? window.localStorage : null;
    setProfilePhoto(nextPhoto || DEFAULT_GURU_PHOTO);
    saveWorkspacePhoto(local, activeWorkspaceId, nextPhoto || DEFAULT_GURU_PHOTO);
  };

  const handleFormChange = (updated: RPMFormData) => {
    const local = typeof window !== 'undefined' ? window.localStorage : null;
    setFormData(updated);
    saveWorkspaceForm(local, activeWorkspaceId, updated);

    if (
      updated.namaGuru.trim() &&
      activeWorkspace &&
      updated.namaGuru.trim() !== activeWorkspace.name
    ) {
      const nextList = updateWorkspaceMetadata(local, activeWorkspaceId, {
        name: updated.namaGuru.trim(),
        schoolName: updated.namaSatuanPendidikan.trim(),
      });
      setWorkspaces(nextList);
    }

    if (Object.keys(fieldErrors).length > 0) {
      setFieldErrors({});
    }
  };

  const handleRpmUpdate = (updatedRpm: RPMDocument) => {
    const local = typeof window !== 'undefined' ? window.localStorage : null;
    setGeneratedRPM(updatedRpm);
    saveWorkspaceRPM(local, activeWorkspaceId, updatedRpm);
  };

  const handleGenerateRPM = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const validation = validateRPMForm(formData);
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      setErrorMessage(
        'Mohon lengkapi seluruh kolom wajib bertanda bintang (*) dan pilih 1–3 Dimensi Profil Lulusan.'
      );
      return;
    }

    const local = typeof window !== 'undefined' ? window.localStorage : null;
    saveWorkspaceForm(local, activeWorkspaceId, formData);

    // Offline Desktop fallback: generate cleanly on-device when internet is unavailable
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineDoc = createFallbackRPM(formData);
      handleRpmUpdate(offlineDoc);
      setActiveTab('preview');
      window.scrollTo(0, 0);
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-rpm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-pin': accessPin,
          'x-workspace-id': activeWorkspaceId,
        },
        body: JSON.stringify(formData),
      });

      if (res.status === 401) {
        setErrorMessage('Sesi PIN kedaluwarsa atau tidak valid. Silakan buka kunci kembali.');
        handleLockApp();
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.rpm) {
        setErrorMessage(data.error || 'Gagal menyusun dokumen RPM. Silakan coba lagi.');
        return;
      }

      handleRpmUpdate(data.rpm as RPMDocument);
      setActiveTab('preview');
      window.scrollTo(0, 0);
    } catch {
      // Fallback gracefully in Desktop/PWA mode if offline or server paused
      const fallbackDoc = createFallbackRPM(formData);
      handleRpmUpdate(fallbackDoc);
      setActiveTab('preview');
      window.scrollTo(0, 0);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {!isCheckingSession && !isUnlocked && (
        <PinLockModal
          workspaceId={activeWorkspaceId}
          activeWorkspaceName={activeWorkspaceName}
          onUnlockSuccess={handleUnlockSuccess}
          onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        />
      )}

      <ChangePinModal
        isOpen={isChangePinModalOpen}
        workspaceId={activeWorkspaceId}
        onClose={() => setIsChangePinModalOpen(false)}
        onPinUpdated={handlePinUpdated}
      />

      <ProfilePhotoModal
        isOpen={isPhotoModalOpen}
        currentPhoto={profilePhoto}
        onClose={() => setIsPhotoModalOpen(false)}
        onSavePhoto={handleSavePhoto}
      />

      <PromptAnatomyModal
        isOpen={isAnatomyModalOpen}
        formData={formData}
        onClose={() => setIsAnatomyModalOpen(false)}
      />

      <DesktopShareModal
        isOpen={isDesktopShareModalOpen}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onInstallDesktop={install}
        formData={formData}
        onClose={() => setIsDesktopShareModalOpen(false)}
      />

      <TeacherWorkspaceModal
        isOpen={isWorkspaceModalOpen}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        currentFormData={formData}
        onSelectWorkspace={(id) => {
          switchToWorkspace(id);
          setIsWorkspaceModalOpen(false);
        }}
        onCreateWorkspace={handleCreateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
        onImportTemplateToActive={(merged) => handleFormChange(merged)}
        onClose={() => setIsWorkspaceModalOpen(false)}
      />

      <Header
        profilePhoto={profilePhoto}
        isUnlocked={isUnlocked}
        activeWorkspaceName={activeWorkspaceName}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onOpenPhotoModal={() => setIsPhotoModalOpen(true)}
        onOpenChangePinModal={() => setIsChangePinModalOpen(true)}
        onLockApp={handleLockApp}
        onOpenAnatomyModal={() => setIsAnatomyModalOpen(true)}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        onOpenDesktopShareModal={() => setIsDesktopShareModalOpen(true)}
        onInstallDesktop={() => void install()}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-5">
        {/* Bar Navigasi Tab (tampil saat dokumen RPM sudah dihasilkan) */}
        {generatedRPM && (
          <nav
            aria-label="Navigasi Formulir dan Hasil RPM"
            className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div role="tablist" className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'form'}
                onClick={() => setActiveTab('form')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'form'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <PenLine className="h-4 w-4" />
                1. Edit Formulir Input
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'preview'}
                onClick={() => setActiveTab('preview')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'preview'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                2. Hasil RPM &amp; LKPD Lengkap
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'lkpd'}
                onClick={() => setActiveTab('lkpd')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'lkpd'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileText className="h-4 w-4" />
                3. Khusus Hasil LKPD
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => downloadLKPDAsDoc(generatedRPM, formData)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors whitespace-nowrap"
              >
                <FileDown className="h-3.5 w-3.5" />
                Unduh LKPD (.Doc)
              </button>

              <button
                type="button"
                onClick={() => setIsAnatomyModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline whitespace-nowrap"
              >
                Struktur Anatomi Prompt
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </nav>
        )}

        {/* Kotak Error Alert Merah */}
        {errorMessage && (
          <div
            role="alert"
            className="no-print flex items-start justify-between gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-800 shadow-sm"
          >
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="inline-flex items-center gap-1 rounded-lg bg-red-100 hover:bg-red-200 px-2.5 py-1 text-xs font-bold text-red-900 shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              Tutup
            </button>
          </div>
        )}

        {/* Konten Utama */}
        {activeTab === 'preview' && generatedRPM ? (
          <RPMTablePreview
            rpm={generatedRPM}
            formData={formData}
            includeLKPD={formData.includeLKPD}
            onUpdateRpm={handleRpmUpdate}
            onToggleLKPD={(include) => handleFormChange({ ...formData, includeLKPD: include })}
          />
        ) : activeTab === 'lkpd' && generatedRPM ? (
          <LKPDOnlyPreview
            rpm={generatedRPM}
            formData={formData}
            onUpdateRpm={handleRpmUpdate}
          />
        ) : (
          <RPMForm
            formData={formData}
            accessPin={accessPin}
            workspaceId={activeWorkspaceId}
            isGenerating={isGenerating}
            fieldErrors={fieldErrors}
            onChange={handleFormChange}
            onSubmit={handleGenerateRPM}
          />
        )}
      </main>

      <OfflineIndicator />

      {/* Footer Gelap */}
      <footer className="no-print bg-slate-950 text-slate-300 border-t border-slate-800 mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <span className="font-display font-bold text-white">
              Generator RPM SDN 2 Makale Selatan
            </span>
            <span className="rounded-md bg-blue-600/25 border border-blue-400/30 px-2 py-0.5 text-[11px] font-semibold text-blue-200">
              Desktop &amp; Deep Learning Framework
            </span>
          </div>
          <p className="text-center text-slate-400">
            Edisi Khusus Jenjang SD/MI (Fase A, B, dan C) · Isolasi Data Antar Guru Aktif
          </p>
        </div>
      </footer>
    </div>
  );
}
