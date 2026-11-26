import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FolderOpen,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { RPMFormData } from '../types/rpm';
import { downloadBlobFile } from '../utils/exportUtils';
import {
  buildShareableTemplateJson,
  parseShareableTemplateJson,
  type TeacherWorkspaceProfile,
} from '../utils/workspaceStorage';

interface TeacherWorkspaceModalProps {
  isOpen: boolean;
  workspaces: TeacherWorkspaceProfile[];
  activeWorkspaceId: string;
  currentFormData: RPMFormData;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: (teacherName: string, schoolName: string) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onImportTemplateToActive: (updatedForm: RPMFormData) => void;
  onClose: () => void;
}

export const TeacherWorkspaceModal: React.FC<TeacherWorkspaceModalProps> = ({
  isOpen,
  workspaces,
  activeWorkspaceId,
  currentFormData,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onImportTemplateToActive,
  onClose,
}) => {
  const [newName, setNewName] = useState('');
  const [newSchool, setNewSchool] = useState(
    currentFormData.namaSatuanPendidikan || 'UPT SD Negeri 2 Makale Selatan'
  );
  const [statusMessage, setStatusMessage] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setStatusMessage('Masukkan nama guru terlebih dahulu sebelum membuat ruang kerja baru.');
      return;
    }
    onCreateWorkspace(trimmed, newSchool.trim() || 'UPT SD Negeri 2 Makale Selatan');
    setNewName('');
    setStatusMessage(`Ruang kerja terpisah untuk "${trimmed}" berhasil dibuat dan diaktifkan.`);
  };

  const handleBackupWorkspace = () => {
    const json = buildShareableTemplateJson(currentFormData, true);
    const active = workspaces.find((w) => w.id === activeWorkspaceId);
    const slug = (active?.name || 'Guru').replace(/[^a-zA-Z0-9]+/g, '_');
    downloadBlobFile(json, `Cadangan_Ruang_${slug}.json`, 'application/json;charset=utf-8');
    setStatusMessage('Cadangan formulir ruang kerja Anda berhasil diunduh (.json).');
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const merged = parseShareableTemplateJson(text, currentFormData);
      if (!merged) {
        setStatusMessage('Berkas JSON tidak valid atau bukan format template RPM.');
        return;
      }
      onImportTemplateToActive(merged);
      setStatusMessage(`Template "${file.name}" berhasil dimuat ke ruang kerja aktif Anda.`);
    } catch {
      setStatusMessage('Gagal membaca berkas cadangan/template.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto">
        <div className="h-1.5 w-full bg-four-colors" />

        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 id="workspace-modal-title" className="font-display text-base sm:text-lg font-bold">
                Ruang Kerja Guru (Anti Tumpang Tindih)
              </h2>
              <p className="text-xs text-slate-300">
                Setiap profil guru menyimpan formulir, foto, PIN, dan hasil RPM secara terpisah
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal ruang kerja guru"
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {statusMessage && (
            <div
              role="status"
              className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-blue-900"
            >
              {statusMessage}
            </div>
          )}

          {/* Tambah Ruang Guru Baru */}
          <form
            onSubmit={handleCreate}
            className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Buat Ruang Guru Baru (Untuk Guru Lain di Komputer Ini)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="new-teacher-workspace-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Nama Guru Pemilik Ruang *
                </label>
                <input
                  id="new-teacher-workspace-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Ibu Maria, S.Pd."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="new-teacher-workspace-school"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Satuan Pendidikan
                </label>
                <input
                  id="new-teacher-workspace-school"
                  type="text"
                  value={newSchool}
                  onChange={(e) => setNewSchool(e.target.value)}
                  placeholder="UPT SD Negeri 2 Makale Selatan"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-emerald-800">
                Ruang baru dimulai dengan formulir bersih &amp; PIN awal <strong>40306401</strong>.
              </span>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm whitespace-nowrap"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Buat &amp; Masuk Ruang
              </button>
            </div>
          </form>

          {/* Daftar Ruang Guru Tersimpan */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Daftar Ruang Kerja Tersimpan di Perangkat Ini ({workspaces.length})
            </h3>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                return (
                  <div
                    key={ws.id}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                      isActive
                        ? 'border-blue-400 bg-blue-50/80'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {ws.name}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            <CheckCircle2 className="h-3 w-3" />
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {ws.schoolName} · ID: <span className="font-mono">{ws.id}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => onSelectWorkspace(ws.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-white"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          Pindah ke Ruang Ini
                        </button>
                      )}
                      {workspaces.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteWorkspace(ws.id)}
                          aria-label={`Hapus ruang ${ws.name}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 text-xs font-bold text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cadangkan & Impor Template ke Ruang Aktif */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-600">
              <strong>Cadangkan / Impor Template:</strong> Simpan atau muat berkas <code>.json</code> hanya ke ruang aktif saat ini.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleBackupWorkspace}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800"
              >
                <Download className="h-3.5 w-3.5" />
                Cadangkan (.json)
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Impor Template (.json)
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportFile(file);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
