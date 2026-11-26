import React from 'react';
import {
  Award,
  Camera,
  FileCode2,
  KeyRound,
  Laptop,
  Lightbulb,
  Lock,
  MonitorDown,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { DEFAULT_GURU_PHOTO } from '../types/rpm';

interface HeaderProps {
  profilePhoto: string;
  isUnlocked: boolean;
  activeWorkspaceName: string;
  isInstallable: boolean;
  isInstalled: boolean;
  onOpenPhotoModal: () => void;
  onOpenChangePinModal: () => void;
  onLockApp: () => void;
  onOpenAnatomyModal: () => void;
  onOpenWorkspaceModal: () => void;
  onOpenDesktopShareModal: () => void;
  onInstallDesktop: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profilePhoto,
  isUnlocked,
  activeWorkspaceName,
  isInstallable,
  isInstalled,
  onOpenPhotoModal,
  onOpenChangePinModal,
  onLockApp,
  onOpenAnatomyModal,
  onOpenWorkspaceModal,
  onOpenDesktopShareModal,
  onInstallDesktop,
}) => {
  return (
    <header className="no-print relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white shadow-lg">
      {/* Garis Aksen 4 Warna Atas */}
      <div className="h-1.5 w-full bg-four-colors" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Area Kiri — Foto Profil Interaktif */}
          <div className="flex items-center justify-center lg:justify-start shrink-0">
            <button
              type="button"
              onClick={onOpenPhotoModal}
              aria-label="Ganti foto profil guru"
              className="group relative h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border-4 border-yellow-400 ring-2 ring-orange-500 overflow-hidden bg-slate-800 shadow-xl focus:outline-none focus:ring-4 focus:ring-yellow-300"
            >
              <img
                src={profilePhoto || DEFAULT_GURU_PHOTO}
                alt="Foto Profil Guru Gesma Gama"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_GURU_PHOTO;
                }}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/65 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <Camera className="h-6 w-6 text-yellow-300 mb-1" />
                <span className="text-[11px] font-bold tracking-wide text-white">Ganti Foto</span>
              </div>
              <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-yellow-400 to-orange-500 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-950 shadow">
                <Sparkles className="h-2.5 w-2.5" />
                BERAKSI
              </span>
            </button>
          </div>

          {/* Area Tengah — Lencana Kontrol, Judul, Deskripsi, 4 Lencana Fitur */}
          <div className="flex-1 space-y-3 text-center lg:text-left">
            {/* Baris Kontrol Atas */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold text-yellow-200">
                <Lightbulb className="h-3.5 w-3.5 text-yellow-300" />
                Kreatif • Inovatif • Inspiratif
              </span>

              <button
                type="button"
                onClick={onOpenPhotoModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-800/70 hover:bg-blue-700 border border-blue-400/30 px-3 py-1 text-xs font-semibold text-blue-100 transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
                Menu Ganti Foto
              </button>

              <button
                type="button"
                onClick={onOpenWorkspaceModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800/70 hover:bg-emerald-700 border border-emerald-400/40 px-3 py-1 text-xs font-semibold text-emerald-100 transition-colors"
              >
                <Users className="h-3.5 w-3.5 text-emerald-300" />
                Ruang: {activeWorkspaceName}
              </button>

              <button
                type="button"
                onClick={onOpenDesktopShareModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-700/80 hover:bg-indigo-600 border border-indigo-400/40 px-3 py-1 text-xs font-semibold text-white transition-colors"
              >
                <Laptop className="h-3.5 w-3.5 text-yellow-300" />
                Aplikasi Desktop &amp; Kirim
              </button>

              {!isInstalled && isInstallable && (
                <button
                  type="button"
                  onClick={onInstallDesktop}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 px-3 py-1 text-xs font-extrabold text-slate-950 shadow transition-colors"
                >
                  <MonitorDown className="h-3.5 w-3.5" />
                  Pasang Desktop
                </button>
              )}

              {isUnlocked && (
                <div className="inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-800/90 border border-slate-700 px-2 py-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    PIN Aktif
                  </span>
                  <button
                    type="button"
                    onClick={onOpenChangePinModal}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-700 hover:bg-slate-600 px-2 py-0.5 text-[11px] font-semibold text-slate-100 transition-colors"
                  >
                    <KeyRound className="h-3 w-3" />
                    Ubah PIN
                  </button>
                  <button
                    type="button"
                    onClick={onLockApp}
                    className="inline-flex items-center gap-1 rounded-md bg-orange-600 hover:bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white transition-colors"
                  >
                    <Lock className="h-3 w-3" />
                    Kunci
                  </button>
                </div>
              )}
            </div>

            {/* Judul Utama */}
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Generator RPM{' '}
              <span className="bg-gradient-to-r from-blue-400 via-emerald-300 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
                UPT SDN 2 MAKALE SELATAN
              </span>
            </h1>

            {/* Deskripsi Khusus SD/MI */}
            <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-200 mx-auto lg:mx-0">
              Perancangan Pembelajaran Mendalam (RPM / Deep Learning Framework) berbasis 5 Tabel Spreadsheet Terpadu &amp; Penguatan Karakter Profil Lulusan khusus Jenjang SD/MI (Fase A Kelas I-II, Fase B Kelas III-IV, dan Fase C Kelas V-VI).
            </p>

            {/* 4 Lencana Fitur Bertema Warna */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-[11px] font-semibold">
              <span className="rounded-md bg-blue-600/25 border border-blue-400/40 px-2.5 py-1 text-blue-200">
                Biru: Struktur Identitas
              </span>
              <span className="rounded-md bg-emerald-600/25 border border-emerald-400/40 px-2.5 py-1 text-emerald-200">
                Hijau: Kurikulum Merdeka
              </span>
              <span className="rounded-md bg-yellow-500/20 border border-yellow-400/40 px-2.5 py-1 text-yellow-200">
                Kuning: Profil Karakter
              </span>
              <span className="rounded-md bg-orange-500/25 border border-orange-400/40 px-2.5 py-1 text-orange-200">
                Orange: Deep Learning LKPD
              </span>
            </div>
          </div>

          {/* Area Kanan — Tombol Anatomi Prompt & Slogan */}
          <div className="flex flex-col items-center lg:items-end justify-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenAnatomyModal}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/90 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg hover:brightness-105 active:scale-[0.99] transition-all whitespace-nowrap"
            >
              <FileCode2 className="h-4 w-4" />
              Struktur Anatomi Prompt
            </button>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-200">
              <Award className="h-3.5 w-3.5 text-yellow-300" />
              Belajar, Berkarya, Berdampak
            </p>
          </div>
        </div>
      </div>

      {/* Garis Aksen 4 Warna Bawah */}
      <div className="h-1.5 w-full bg-four-colors" />
    </header>
  );
};
