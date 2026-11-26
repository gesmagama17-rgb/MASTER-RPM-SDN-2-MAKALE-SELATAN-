import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileJson,
  Laptop,
  MonitorDown,
  Send,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { RPMFormData } from '../types/rpm';
import { downloadBlobFile } from '../utils/exportUtils';
import {
  buildCleanShareUrl,
  buildWhatsAppShareUrl,
  downloadPortableDesktopLauncher,
} from '../utils/desktopLauncher';
import { buildShareableTemplateJson } from '../utils/workspaceStorage';

interface DesktopShareModalProps {
  isOpen: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstallDesktop: () => Promise<boolean>;
  formData: RPMFormData;
  onClose: () => void;
}

export const DesktopShareModal: React.FC<DesktopShareModalProps> = ({
  isOpen,
  isInstallable,
  isInstalled,
  isIOS,
  onInstallDesktop,
  formData,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const cleanShareUrl = buildCleanShareUrl(origin);
  const whatsappUrl = buildWhatsAppShareUrl(cleanShareUrl);

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(cleanShareUrl);
      setCopiedLink(true);
      setStatusMessage('Tautan ruang guru baru berhasil disalin.');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setStatusMessage('Silakan salin tautan secara manual dari kotak URL di atas.');
    }
  };

  const handleDownloadPortableApp = () => {
    downloadPortableDesktopLauncher(origin);
    setStatusMessage(
      'Berkas Desktop Portable (Generator-RPM-SDN2-Desktop.html) berhasil diunduh dan siap dikirim ke guru lain.'
    );
  };

  const handleDownloadCleanTemplate = () => {
    const json = buildShareableTemplateJson(formData, false);
    const mapelSlug = (formData.mataPelajaran || 'RPM').replace(/[^a-zA-Z0-9]+/g, '_');
    downloadBlobFile(
      json,
      `Template_RPM_${mapelSlug}_Tanpa_Identitas.json`,
      'application/json;charset=utf-8'
    );
    setStatusMessage(
      'Template formulir bersih (tanpa NIP/nama pribadi pengirim) berhasil diunduh.'
    );
  };

  const handleTriggerInstall = async () => {
    const ok = await onInstallDesktop();
    if (ok) {
      setStatusMessage('Aplikasi Desktop berhasil dipasang ke perangkat Anda.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-share-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto">
        <div className="h-1.5 w-full bg-four-colors" />

        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/30 border border-blue-400/40 text-yellow-300">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h2 id="desktop-share-title" className="font-display text-base sm:text-lg font-bold">
                Aplikasi Desktop &amp; Kirim ke Guru Lain
              </h2>
              <p className="text-xs text-slate-300">
                Pasang di komputer sekolah atau bagikan ke rekan guru tanpa data tumpang tindih
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal aplikasi desktop"
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Jaminan Anti Tumpang Tindih */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Isolasi Data Antar Guru Aktif:</strong> Setiap guru yang membuka tautan atau
              berkas di bawah ini otomatis memakai <strong>Ruang Kerja Terpisah</strong> (PIN awal{' '}
              <span className="font-mono font-bold">40306401</span>), sehingga foto profil, NIP,
              pengaturan PIN, formulir, dan hasil RPM/LKPD tidak akan saling tertimpa.
            </div>
          </div>

          {statusMessage && (
            <div
              role="status"
              className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-blue-900"
            >
              {statusMessage}
            </div>
          )}

          {/* Bagian 1: Pasang Sebagai Aplikasi Desktop */}
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MonitorDown className="h-4 w-4 text-blue-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  1. Pasang Sebagai Aplikasi Desktop (Windows / Mac / Chromebook)
                </h3>
              </div>
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                  isInstalled
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                {isInstalled ? 'Berjalan di Jendela Desktop' : 'Mode Browser'}
              </span>
            </div>

            {isInstalled ? (
              <p className="text-xs text-slate-700 leading-relaxed">
                Aplikasi sudah berjalan sebagai <strong>Aplikasi Desktop Mandiri</strong> (tanpa
                bilah alamat peramban) dan mendukung penggunaan luring (offline).
              </p>
            ) : isInstallable ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-600 flex-1 min-w-[200px]">
                  Klik tombol di samping untuk membuat pintasan aplikasi di Desktop &amp; Start Menu
                  dalam satu klik.
                </p>
                <button
                  type="button"
                  onClick={handleTriggerInstall}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
                >
                  <MonitorDown className="h-4 w-4" />
                  Pasang Aplikasi Desktop
                </button>
              </div>
            ) : isIOS ? (
              <p className="text-xs text-slate-700 leading-relaxed">
                Di Safari iPad/iPhone: ketuk tombol <strong>Bagikan (Share)</strong> lalu pilih{' '}
                <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
              </p>
            ) : (
              <div className="text-xs text-slate-700 leading-relaxed space-y-1">
                <p>
                  Untuk memasang di desktop Windows/Mac lewat <strong>Google Chrome</strong> atau{' '}
                  <strong>Microsoft Edge</strong>:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                  <li>
                    Buka aplikasi pada tab penuh (bukan pratinjau sempit) lalu klik ikon{' '}
                    <strong>Install (ikon komputer + panah)</strong> di pojok kanan bilah alamat.
                  </li>
                  <li>
                    Atau buka menu browser (&vellip;) &rarr;{' '}
                    <strong>Simpan dan bagikan / Apps</strong> &rarr;{' '}
                    <strong>Pasang / Install Generator RPM SDN 2 Makale Selatan</strong>.
                  </li>
                </ol>
              </div>
            )}
          </section>

          {/* Bagian 2: Kirim ke Guru Lain via Link Ruang Baru */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">
                2. Kirim Tautan Aplikasi ke Guru Lain (Otomatis Ruang Terpisah)
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Tautan khusus dengan akhiran <code className="font-mono text-slate-900">?guru=baru</code>{' '}
              otomatis membuka ruang kerja baru pada perangkat rekan guru tanpa membawa data pribadi Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={cleanShareUrl}
                aria-label="Tautan undangan ruang guru baru"
                className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800"
              />
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-white whitespace-nowrap"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedLink ? 'Tersalin' : 'Salin Link'}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white whitespace-nowrap"
              >
                <Send className="h-3.5 w-3.5" />
                Kirim WhatsApp
              </a>
            </div>
          </section>

          {/* Bagian 3: Unduh File Desktop Portable & Template Bersih */}
          <section className="rounded-xl border border-orange-200 bg-orange-50/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-orange-700" />
              <h3 className="text-sm font-bold text-slate-900">
                3. Unduh Berkas Siap Kirim (Flashdisk / WhatsApp / Email)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadPortableApp}
                className="flex flex-col items-start gap-1 rounded-xl border border-orange-300 bg-white hover:bg-orange-50 p-3.5 text-left shadow-sm transition-colors"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-orange-800">
                  <Laptop className="h-4 w-4" />
                  Unduh Paket Desktop (.html)
                </span>
                <span className="text-[11px] text-slate-600 leading-snug">
                  Berkas peluncur desktop portabel + generator Word darurat saat tanpa internet.
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCleanTemplate}
                className="flex flex-col items-start gap-1 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 p-3.5 text-left shadow-sm transition-colors"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-800">
                  <FileJson className="h-4 w-4" />
                  Unduh Template Bersih (.json)
                </span>
                <span className="text-[11px] text-slate-600 leading-snug">
                  Ekspor CP, TP &amp; materi tanpa NIP/nama Anda untuk diimpor guru lain.
                </span>
              </button>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
