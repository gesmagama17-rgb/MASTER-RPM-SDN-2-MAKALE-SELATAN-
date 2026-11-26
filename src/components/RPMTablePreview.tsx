import React, { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Check,
  ClipboardCheck,
  Copy,
  Edit3,
  FileDown,
  FileText,
  Monitor,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';
import type { RPMDocument, RPMFormData } from '../types/rpm';
import { formatIndonesianDate } from '../utils/rpmLogic';
import { copyRPMToClipboard, downloadRPMAsDoc } from '../utils/exportUtils';

interface RPMTablePreviewProps {
  rpm: RPMDocument;
  formData: RPMFormData;
  includeLKPD: boolean;
  onUpdateRpm: (updated: RPMDocument) => void;
  onToggleLKPD: (include: boolean) => void;
}

export const RPMTablePreview: React.FC<RPMTablePreviewProps> = ({
  rpm,
  formData,
  includeLKPD,
  onUpdateRpm,
  onToggleLKPD,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const docsAnchorRef = useRef<HTMLAnchorElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 4500);
  };

  const handleCopyAndOpenDocs = async () => {
    try {
      await copyRPMToClipboard(rpm, formData, includeLKPD);
      try {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.7 },
        });
      } catch {
        // Ignore confetti errors in headless environments
      }
      showToast(
        'Tabel RPM berhasil disalin ke clipboard! Membuka Google Dokumen baru — tinggal tekan Ctrl+V / Cmd+V.'
      );
      docsAnchorRef.current?.click();
    } catch {
      showToast('Gagal menyalin otomatis. Gunakan tombol Unduh .Doc atau Cetak / PDF.');
    }
  };

  const handleToggleLkpdToolbar = (next: boolean) => {
    onToggleLKPD(next);
    showToast(
      next
        ? 'Lampiran LKPD & Rubrik Penilaian 4 Skala Skor diaktifkan pada pratinjau & ekspor.'
        : 'Mode ringkas aktif: Hanya menampilkan 5 Tabel Inti RPM tanpa LKPD.'
    );
  };

  const updateIdentifikasi = (
    field: keyof RPMDocument['identifikasi'],
    value: string
  ) => {
    onUpdateRpm({
      ...rpm,
      identifikasi: { ...rpm.identifikasi, [field]: value },
    });
  };

  const updateDesain = (
    field:
      | 'integrasiLiterasiNumerasi'
      | 'kemitraanPembelajaran'
      | 'lingkunganPembelajaran'
      | 'pemanfaatanDigitalTools',
    value: string
  ) => {
    onUpdateRpm({
      ...rpm,
      desainPembelajaran: { ...rpm.desainPembelajaran, [field]: value },
    });
  };

  const updatePengalaman = (
    index: number,
    stage: 'memahami' | 'mengaplikasi' | 'refleksi',
    value: string
  ) => {
    const nextList = rpm.pengalamanBelajar.map((item, idx) =>
      idx === index
        ? {
            ...item,
            [stage]: {
              ...item[stage],
              aktivitas: value,
            },
          }
        : item
    );
    onUpdateRpm({ ...rpm, pengalamanBelajar: nextList });
  };

  return (
    <div className="space-y-6 pb-16">
      <a
        ref={docsAnchorRef}
        href="https://docs.new"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden"
        aria-hidden="true"
      >
        Google Docs
      </a>

      {/* A. Toolbar Aksi Atas */}
      <div className="no-print rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
        <div className="h-1.5 w-full bg-four-colors" />
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-lg font-extrabold text-slate-900">
                RPM Berhasil Dihasilkan
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold ${
                  includeLKPD
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-orange-100 text-orange-800 border border-orange-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {includeLKPD
                  ? 'Tabel RPM + LKPD & Rubrik Lengkap'
                  : 'Hanya Tabel RPM Inti (Tanpa LKPD)'}
              </span>
            </div>

            {/* 4 Tombol Aksi Utama */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAndOpenDocs}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors whitespace-nowrap"
              >
                <Copy className="h-3.5 w-3.5" />
                Salin &amp; Buka di Google Dokumen
              </button>

              <button
                type="button"
                onClick={() => downloadRPMAsDoc(rpm, formData, includeLKPD)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors whitespace-nowrap"
              >
                <FileDown className="h-3.5 w-3.5" />
                Unduh .Doc
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors whitespace-nowrap"
              >
                <Printer className="h-3.5 w-3.5" />
                Cetak / PDF
              </button>

              <button
                type="button"
                onClick={() => setIsEditMode((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm transition-colors whitespace-nowrap ${
                  isEditMode
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                {isEditMode ? <Check className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                {isEditMode ? 'Selesai Edit' : 'Sesuaikan Teks'}
              </button>
            </div>
          </div>

          {/* Bar Pengaturan Lampiran LKPD Live */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <span className="text-xs font-semibold text-slate-600">
              Pengaturan Lampiran Dokumen Hasil &amp; Ekspor:
            </span>
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => handleToggleLkpdToolbar(true)}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  includeLKPD
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                Sertakan LKPD
              </button>
              <button
                type="button"
                onClick={() => handleToggleLkpdToolbar(false)}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  !includeLKPD
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="h-3.5 w-3.5" />
                Tanpa LKPD
              </button>
            </div>
          </div>

          {toastMessage && (
            <div
              role="status"
              className="rounded-xl border border-amber-300 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2.5 text-xs font-semibold text-amber-950"
            >
              {toastMessage}
            </div>
          )}
        </div>
      </div>

      {/* B. KERTAS DOKUMEN HASIL LENGKAP */}
      <article className="rounded-2xl border border-slate-300 bg-white p-6 sm:p-10 shadow-xl space-y-8 print:border-none print:p-0 print:shadow-none">
        {/* Kop Dokumen Resmi */}
        <header className="border-b-2 border-slate-900 pb-5 text-center space-y-2.5">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
            <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-emerald-900">
              Kurikulum Merdeka &amp; Deep Learning
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2.5 py-1 text-blue-900">
              <BookOpen className="h-3 w-3" />
              Literasi &amp; Numerasi Terintegrasi
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2.5 py-1 text-orange-900">
              <Monitor className="h-3 w-3" />
              Pemanfaatan Papan Interaktif Digital
            </span>
          </div>

          <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950">
            RENCANA PEMBELAJARAN MENDALAM (RPM)
          </h1>
          <p className="text-sm sm:text-base font-bold text-blue-900">
            {rpm.identitas.namaSatuanPendidikan}
          </p>
          <p className="text-xs font-medium text-slate-600">
            Tahun Ajaran 2026/2027 • Diformulasikan oleh Guru Gesma
          </p>
        </header>

        {/* 1. TABEL IDENTITAS (Tema Biru) */}
        <section className="space-y-2 print-avoid-break">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-blue-800">
            1. Tabel Identitas
          </h2>
          <div className="overflow-x-auto rounded-xl border border-blue-300">
            <table className="w-full table-fixed border-collapse text-sm">
              <tbody>
                <tr className="border-b border-blue-200">
                  <th className="w-[30%] bg-blue-50 px-4 py-2.5 text-left font-bold text-blue-950">
                    Nama Satuan Pendidikan
                  </th>
                  <td className="w-[70%] px-4 py-2.5 text-slate-800">
                    {rpm.identitas.namaSatuanPendidikan}
                  </td>
                </tr>
                <tr className="border-b border-blue-200">
                  <th className="bg-blue-50 px-4 py-2.5 text-left font-bold text-blue-950">
                    Mata Pelajaran
                  </th>
                  <td className="px-4 py-2.5 font-semibold text-slate-900">
                    {rpm.identitas.mataPelajaran}
                  </td>
                </tr>
                <tr className="border-b border-blue-200">
                  <th className="bg-blue-50 px-4 py-2.5 text-left font-bold text-blue-950">
                    Kelas / Semester
                  </th>
                  <td className="px-4 py-2.5 text-slate-800">{rpm.identitas.kelasSemester}</td>
                </tr>
                <tr>
                  <th className="bg-blue-50 px-4 py-2.5 text-left font-bold text-blue-950">
                    Durasi Pertemuan
                  </th>
                  <td className="px-4 py-2.5 tabular-nums text-slate-800">
                    {rpm.identitas.durasiPertemuan}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. TABEL IDENTIFIKASI (Tema Orange) */}
        <section className="space-y-2 print-avoid-break">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-orange-700">
            2. Tabel Identifikasi
          </h2>
          <div className="overflow-x-auto rounded-xl border border-orange-300">
            <table className="w-full table-fixed border-collapse text-sm">
              <tbody>
                <tr className="border-b border-orange-200">
                  <th className="w-[30%] bg-orange-50 px-4 py-3 text-left align-top font-bold text-orange-950">
                    Siswa (Profil &amp; Kesiapan)
                  </th>
                  <td className="w-[70%] px-4 py-3 text-slate-800 leading-relaxed">
                    {isEditMode ? (
                      <textarea
                        rows={3}
                        value={rpm.identifikasi.profilKesiapanSiswa}
                        onChange={(e) => updateIdentifikasi('profilKesiapanSiswa', e.target.value)}
                        className="w-full rounded-lg border border-orange-300 bg-orange-50/40 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    ) : (
                      rpm.identifikasi.profilKesiapanSiswa
                    )}
                  </td>
                </tr>
                <tr className="border-b border-orange-200">
                  <th className="bg-orange-50 px-4 py-3 text-left align-top font-bold text-orange-950">
                    Materi Pelajaran
                  </th>
                  <td className="px-4 py-3 text-slate-800 leading-relaxed">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={rpm.identifikasi.materiPelajaran}
                        onChange={(e) => updateIdentifikasi('materiPelajaran', e.target.value)}
                        className="w-full rounded-lg border border-orange-300 bg-orange-50/40 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    ) : (
                      rpm.identifikasi.materiPelajaran
                    )}
                  </td>
                </tr>
                <tr>
                  <th className="bg-orange-50 px-4 py-3 text-left align-top font-bold text-orange-950">
                    Capaian Dimensi Lulusan
                  </th>
                  <td className="px-4 py-3 text-slate-800 leading-relaxed">
                    {isEditMode ? (
                      <textarea
                        rows={2}
                        value={rpm.identifikasi.capaianDimensiLulusan}
                        onChange={(e) => updateIdentifikasi('capaianDimensiLulusan', e.target.value)}
                        className="w-full rounded-lg border border-orange-300 bg-orange-50/40 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    ) : (
                      rpm.identifikasi.capaianDimensiLulusan
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. TABEL DESAIN PEMBELAJARAN (Tema Hijau) */}
        <section className="space-y-2">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-emerald-800">
            3. Tabel Desain Pembelajaran
          </h2>
          <div className="overflow-x-auto rounded-xl border border-emerald-300">
            <table className="w-full table-fixed border-collapse text-sm">
              <tbody>
                <tr className="border-b border-emerald-200">
                  <th className="w-[30%] bg-emerald-50 px-4 py-3 text-left align-top font-bold text-emerald-950">
                    1. Capaian Pembelajaran (CP)
                  </th>
                  <td className="w-[70%] px-4 py-3 text-slate-800 leading-relaxed whitespace-pre-line">
                    {rpm.desainPembelajaran.capaianPembelajaran}
                  </td>
                </tr>
                <tr className="border-b border-emerald-200">
                  <th className="bg-emerald-50 px-4 py-3 text-left align-top font-bold text-emerald-950">
                    2. Lintas Disiplin Ilmu
                  </th>
                  <td className="px-4 py-3 text-slate-800 leading-relaxed">
                    {rpm.desainPembelajaran.lintasDisiplinIlmu}
                  </td>
                </tr>
                <tr className="border-b border-emerald-200">
                  <th className="bg-emerald-50 px-4 py-3 text-left align-top font-bold text-emerald-950">
                    3. Tujuan Pembelajaran (TP)
                  </th>
                  <td className="px-4 py-3 text-slate-800 leading-relaxed whitespace-pre-line">
                    {rpm.desainPembelajaran.tujuanPembelajaran}
                  </td>
                </tr>
                <tr className="border-b border-emerald-200">
                  <th className="bg-emerald-50 px-4 py-3 text-left align-top font-bold text-emerald-950">
                    4. Topik Pembelajaran
                  </th>
                  <td className="px-4 py-3 text-slate-800 leading-relaxed">
                    {rpm.desainPembelajaran.topikPembelajaran}
                  </td>
                </tr>
                <tr className="border-b border-emerald-200">
                  <th className="bg-emerald-50 px-4 py-3 text-left align-top font-bold text-emerald-950">
                    5. Praktik Pedagogis per Pertemuan
                  </th>
                  <td className="px-4 py-3">
                    <div className="overflow-x-auto rounded-lg border border-emerald-200">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-emerald-100/80 text-emerald-950">
                            <th className="w-24 border-b border-emerald-200 px-3 py-2 text-left font-bold">
                              Pertemuan
                            </th>
                            <th className="w-48 border-b border-emerald-200 px-3 py-2 text-left font-bold">
                              Model
                            </th>
                            <th className="border-b border-emerald-200 px-3 py-2 text-left font-bold">
                              Sintaks &amp; Deskripsi
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rpm.desainPembelajaran.praktikPedagogisPerPertemuan.map((item) => (
                            <tr key={item.pertemuanKe} className="border-b last:border-b-0 border-emerald-100">
                              <td className="px-3 py-2 font-bold tabular-nums text-emerald-900 align-top">
                                Pertemuan {item.pertemuanKe}
                              </td>
                              <td className="px-3 py-2 font-semibold text-slate-900 align-top">
                                {item.model}
                              </td>
                              <td className="px-3 py-2 text-slate-700 leading-relaxed align-top">
                                {item.deskripsiSingkat}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-emerald-200">
                  <th className="bg-emerald-50 px-4 py-3 text-left align-top font-bold text-emerald-950">
                    6. Integrasi Literasi &amp; Numerasi
                    <span className="mt-1 inline-block rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Wajib Terintegrasi
                    </span>
                  </th>
                  <td className="px-4 py-3 text-slate-800 leading-relaxed">
                    {isEditMode ? (
                      <textarea
                        rows={3}
                        value={rpm.desainPembelajaran.integrasiLiterasiNumerasi}
                        onChange={(e) => updateDesain('integrasiLiterasiNumerasi', e.target.value)}
                        className="w-full rounded-lg border border-emerald-300 bg-emerald-50/40 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    ) : (
                      rpm.desainPembelajaran.integrasiLiterasiNumerasi
                    )}
                  </td>
                </tr>
                <tr className="border-b border-emerald-200">
                  <th className="bg-emerald-50 px-4 py-3 text-left align-top font-bold text-emerald-950">
                    7. Kemitraan Pembelajaran
                  </th>
                  <td className="px-4 py-3 text-slate-800 leading-relaxed">
                    {isEditMode ? (
                      <textarea
                        rows={2}
                        value={rpm.desainPembelajaran.kemitraanPembelajaran}
                        onChange={(e) => updateDesain('kemitraanPembelajaran', e.target.value)}
                        className="w-full rounded-lg border border-emerald-300 bg-emerald-50/40 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    ) : (
                      rpm.desainPembelajaran.kemitraanPembelajaran
                    )}
                  </td>
                </tr>
                <tr className="border-b border-emerald-200">
                  <th className="bg-emerald-50 px-4 py-3 text-left align-top font-bold text-emerald-950">
                    8. Lingkungan Pembelajaran
                  </th>
                  <td className="px-4 py-3 text-slate-800 leading-relaxed">
                    {isEditMode ? (
                      <textarea
                        rows={2}
                        value={rpm.desainPembelajaran.lingkunganPembelajaran}
                        onChange={(e) => updateDesain('lingkunganPembelajaran', e.target.value)}
                        className="w-full rounded-lg border border-emerald-300 bg-emerald-50/40 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    ) : (
                      rpm.desainPembelajaran.lingkunganPembelajaran
                    )}
                  </td>
                </tr>
                <tr>
                  <th className="bg-emerald-50 px-4 py-3 text-left align-top font-bold text-emerald-950">
                    9. Pemanfaatan Digital Tools
                    <span className="mt-1 inline-block rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Papan Interaktif Digital
                    </span>
                  </th>
                  <td className="px-4 py-3 text-slate-800 leading-relaxed">
                    {isEditMode ? (
                      <textarea
                        rows={2}
                        value={rpm.desainPembelajaran.pemanfaatanDigitalTools}
                        onChange={(e) => updateDesain('pemanfaatanDigitalTools', e.target.value)}
                        className="w-full rounded-lg border border-emerald-300 bg-emerald-50/40 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    ) : (
                      rpm.desainPembelajaran.pemanfaatanDigitalTools
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. TABEL PENGALAMAN BELAJAR PER PERTEMUAN (Tema Kuning) */}
        <section className="space-y-4">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-amber-800">
            4. Tabel Pengalaman Belajar per Pertemuan
          </h2>

          {rpm.pengalamanBelajar.map((p, idx) => (
            <div
              key={p.pertemuanKe}
              className="overflow-x-auto rounded-xl border border-amber-300 print-avoid-break"
            >
              <div className="bg-slate-900 px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold">
                  Pertemuan Ke-{p.pertemuanKe}: {p.fokusPertemuan}
                </span>
                <span className="rounded-md bg-amber-400 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-950">
                  {p.modelPertemuan}
                </span>
              </div>

              <table className="w-full table-fixed border-collapse text-sm">
                <tbody>
                  {/* 1. Memahami (Biru) */}
                  <tr className="border-b border-amber-200">
                    <th className="w-[30%] bg-blue-50 px-4 py-3 text-left align-top">
                      <div className="font-bold text-blue-950">1. {p.memahami.judul}</div>
                      <div className="text-[11px] font-semibold text-blue-700 mt-0.5">
                        Biru • Diferensiasi Konten
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">{p.memahami.prinsip}</div>
                    </th>
                    <td className="w-[70%] px-4 py-3 text-slate-800 leading-relaxed">
                      {isEditMode ? (
                        <textarea
                          rows={4}
                          value={p.memahami.aktivitas}
                          onChange={(e) => updatePengalaman(idx, 'memahami', e.target.value)}
                          className="w-full rounded-lg border border-blue-300 bg-blue-50/40 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      ) : (
                        p.memahami.aktivitas
                      )}
                    </td>
                  </tr>

                  {/* 2. Mengaplikasi (Hijau) */}
                  <tr className="border-b border-amber-200">
                    <th className="bg-emerald-50 px-4 py-3 text-left align-top">
                      <div className="font-bold text-emerald-950">2. {p.mengaplikasi.judul}</div>
                      <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                        Hijau • Sintaks {p.modelPertemuan}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">{p.mengaplikasi.prinsip}</div>
                    </th>
                    <td className="px-4 py-3 text-slate-800 leading-relaxed">
                      {isEditMode ? (
                        <textarea
                          rows={4}
                          value={p.mengaplikasi.aktivitas}
                          onChange={(e) => updatePengalaman(idx, 'mengaplikasi', e.target.value)}
                          className="w-full rounded-lg border border-emerald-300 bg-emerald-50/40 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      ) : (
                        p.mengaplikasi.aktivitas
                      )}
                    </td>
                  </tr>

                  {/* 3. Refleksi (Kuning) */}
                  <tr>
                    <th className="bg-yellow-50 px-4 py-3 text-left align-top">
                      <div className="font-bold text-amber-950">3. {p.refleksi.judul}</div>
                      <div className="text-[11px] font-semibold text-amber-700 mt-0.5">
                        Kuning • Refleksi &amp; Umpan Balik
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">{p.refleksi.prinsip}</div>
                    </th>
                    <td className="px-4 py-3 text-slate-800 leading-relaxed">
                      {isEditMode ? (
                        <textarea
                          rows={3}
                          value={p.refleksi.aktivitas}
                          onChange={(e) => updatePengalaman(idx, 'refleksi', e.target.value)}
                          className="w-full rounded-lg border border-amber-300 bg-amber-50/40 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      ) : (
                        p.refleksi.aktivitas
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </section>

        {/* 5. TABEL ASESMEN PEMBELAJARAN (Tema Biru, Hijau, Orange) */}
        <section className="space-y-2 print-avoid-break">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-slate-800">
            5. Tabel Asesmen Pembelajaran
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-300">
            <table className="w-full table-fixed border-collapse text-sm">
              <tbody>
                <tr className="border-b border-slate-200">
                  <th className="w-[30%] bg-blue-50 px-4 py-3 text-left align-top font-bold text-blue-950">
                    1. Asesmen Awal
                    <span className="block text-[11px] font-normal text-blue-700 mt-0.5">
                      Diagnostik / Apersepsi Kesiapan
                    </span>
                  </th>
                  <td className="w-[70%] px-4 py-3 text-slate-800 leading-relaxed">
                    {rpm.asesmen.asesmenAwal}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <th className="bg-emerald-50 px-4 py-3 text-left align-top font-bold text-emerald-950">
                    2. Asesmen Proses
                    <span className="block text-[11px] font-normal text-emerald-700 mt-0.5">
                      Formatif / Observasi / Rubrik
                    </span>
                  </th>
                  <td className="px-4 py-3 text-slate-800 leading-relaxed">
                    {rpm.asesmen.asesmenProses}
                  </td>
                </tr>
                <tr>
                  <th className="bg-orange-50 px-4 py-3 text-left align-top font-bold text-orange-950">
                    3. Asesmen Akhir
                    <span className="block text-[11px] font-normal text-orange-700 mt-0.5">
                      Sumatif / Produk / Portofolio
                    </span>
                  </th>
                  <td className="px-4 py-3 text-slate-800 leading-relaxed">
                    {rpm.asesmen.asesmenAkhir}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. LEMBAR KERJA PESERTA DIDIK (LKPD) & RUBRIK PENILAIAN */}
        {includeLKPD && (
          <section className="print-break-before space-y-6 border-t-2 border-dashed border-orange-300 pt-8">
            <div className="rounded-xl border border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 p-5 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-1 text-xs font-bold text-white mb-2">
                <FileText className="h-3.5 w-3.5" />
                6. LEMBAR KERJA PESERTA DIDIK (LKPD) &amp; RUBRIK PENILAIAN
              </span>
              <h3 className="font-display text-lg font-extrabold text-slate-900">
                {rpm.lkpd.judulLKPD}
              </h3>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                {rpm.lkpd.mataPelajaran} • {rpm.lkpd.kelasSemester}
              </p>
            </div>

            {/* Identitas Kelompok */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm">
              <div>
                <p className="font-bold text-slate-800">Kelompok / Kelas:</p>
                <p className="mt-1 border-b border-dotted border-slate-400 pb-1 text-slate-600">
                  ............................................... / {formData.kelas}
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-800">Nama Anggota (1–4):</p>
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <span>1. .............................</span>
                  <span>2. .............................</span>
                  <span>3. .............................</span>
                  <span>4. .............................</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-1.5">
                <h4 className="text-xs font-extrabold text-blue-900">🎯 Tujuan Aktivitas</h4>
                <p className="text-xs leading-relaxed text-slate-700">{rpm.lkpd.tujuanAktivitas}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1.5">
                <h4 className="text-xs font-extrabold text-emerald-900">📋 Petunjuk Umum Pengerjaan</h4>
                <ol className="list-decimal pl-4 space-y-1 text-xs text-slate-700">
                  {rpm.lkpd.petunjukUmum.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
              <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 space-y-1.5">
                <h4 className="text-xs font-extrabold text-orange-900">
                  💡 Kasus Nyata / Stimulus Masalah
                </h4>
                <p className="text-xs leading-relaxed text-slate-700">
                  {rpm.lkpd.kasusNyataStimulus}
                </p>
              </div>
            </div>

            {/* Kartu Aktivitas per Pertemuan */}
            <div className="space-y-4">
              {rpm.lkpd.aktivitasPerPertemuan.map((act) => (
                <div
                  key={act.pertemuanKe}
                  className="rounded-xl border border-orange-300 bg-white overflow-hidden print-avoid-break"
                >
                  <div className="bg-orange-600 px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold">
                      Aktivitas Pertemuan {act.pertemuanKe}: {act.judulAktivitas}
                    </span>
                    <span className="rounded bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
                      {act.model}
                    </span>
                  </div>
                  <div className="p-4 space-y-3 text-xs sm:text-sm">
                    <div>
                      <p className="font-bold text-slate-900 mb-1">Langkah Pengerjaan Siswa:</p>
                      <ol className="list-decimal pl-5 space-y-1 text-slate-700">
                        {act.langkahPengerjaan.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="rounded-lg border border-dashed border-slate-400 bg-slate-50 p-3.5">
                      <p className="font-bold text-slate-900 mb-1">
                        📝 Lembar Kerja / Tugas Pengamatan:
                      </p>
                      <p className="text-slate-700 leading-relaxed">{act.tugasPengamatan}</p>
                      <div className="mt-3 h-16 rounded border border-slate-300 bg-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pertanyaan Refleksi HOTS */}
            <div className="rounded-xl border border-amber-300 bg-amber-50/50 p-4 space-y-2 print-avoid-break">
              <h4 className="text-sm font-extrabold text-amber-950">
                🤔 Pertanyaan Refleksi &amp; Kesimpulan Kelompok (HOTS)
              </h4>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-slate-800">
                {rpm.lkpd.pertanyaanRefleksiHOTS.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            </div>

            {/* Tabel Rubrik Penilaian 4 Skala Skor */}
            <div className="space-y-2 print-avoid-break">
              <h4 className="font-display text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
                Rubrik Penilaian 4 Skala Skor
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-300">
                <table className="w-full min-w-[680px] border-collapse text-xs">
                  <thead>
                    <tr className="text-white">
                      <th className="w-[20%] bg-slate-900 px-3 py-2.5 text-left font-bold">
                        Aspek &amp; Kriteria
                      </th>
                      <th className="w-[20%] bg-blue-700 px-3 py-2.5 text-left font-bold tabular-nums">
                        Sangat Baik (Skor 4: 86–100)
                      </th>
                      <th className="w-[20%] bg-emerald-700 px-3 py-2.5 text-left font-bold tabular-nums">
                        Baik (Skor 3: 71–85)
                      </th>
                      <th className="w-[20%] bg-amber-600 px-3 py-2.5 text-left font-bold tabular-nums">
                        Cukup (Skor 2: 56–70)
                      </th>
                      <th className="w-[20%] bg-orange-700 px-3 py-2.5 text-left font-bold tabular-nums">
                        Perlu Bimbingan (Skor 1: &lt;56)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rpm.lkpd.rubrikPenilaian.map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-200">
                        <td className="bg-slate-50 px-3 py-2.5 font-bold text-slate-900 align-top">
                          {row.aspek}
                        </td>
                        <td className="bg-blue-50/40 px-3 py-2.5 text-slate-800 align-top leading-relaxed">
                          {row.sangatBaik}
                        </td>
                        <td className="bg-emerald-50/40 px-3 py-2.5 text-slate-800 align-top leading-relaxed">
                          {row.baik}
                        </td>
                        <td className="bg-amber-50/40 px-3 py-2.5 text-slate-800 align-top leading-relaxed">
                          {row.cukup}
                        </td>
                        <td className="bg-orange-50/40 px-3 py-2.5 text-slate-800 align-top leading-relaxed">
                          {row.perluBimbingan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 tabular-nums">
                <strong>📊 Pedoman Penskoran &amp; Predikat Nilai Akhir:</strong>{' '}
                {rpm.lkpd.pedomanPenskoran}
              </div>
            </div>
          </section>
        )}

        {/* LEMBAR PENGESAHAN (Tanpa border saat ekspor) */}
        <footer className="pt-8 print-avoid-break">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm text-slate-900">
            <div className="space-y-16">
              <div>
                <p>Mengetahui,</p>
                <p className="font-semibold">Kepala {formData.namaSatuanPendidikan}</p>
              </div>
              <div>
                <p className="font-bold underline">{formData.namaKepalaSekolah}</p>
                <p className="text-xs font-mono text-slate-700">
                  NIP. {formData.nipKepalaSekolah || '-'}
                </p>
              </div>
            </div>

            <div className="space-y-16 sm:pl-12">
              <div>
                <p>
                  {formData.kotaPenetapan || 'Makale Selatan'},{' '}
                  {formatIndonesianDate(formData.tanggalPenetapan)}
                </p>
                <p className="font-semibold">Guru Kelas / Mata Pelajaran</p>
              </div>
              <div>
                <p className="font-bold underline">{formData.namaGuru}</p>
                <p className="text-xs font-mono text-slate-700">NIP. {formData.nipGuru || '-'}</p>
              </div>
            </div>
          </div>
        </footer>
      </article>

      {/* Bar Pengingat Bawah (tidak menutupi isi tabel) */}
      <div className="no-print mx-auto max-w-5xl rounded-2xl border border-orange-300 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs sm:text-sm font-bold text-slate-950 text-center sm:text-left">
            Siap dipindahkan ke Google Docs atau Microsoft Word dengan format tabel A4 rapi.
          </p>
          <button
            type="button"
            onClick={handleCopyAndOpenDocs}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 px-4 py-2.5 text-xs font-extrabold text-white shadow transition-colors whitespace-nowrap"
          >
            <Copy className="h-3.5 w-3.5 text-yellow-300" />
            Salin RPM &amp; LKPD ke Google Dokumen
          </button>
        </div>
      </div>
    </div>
  );
};
