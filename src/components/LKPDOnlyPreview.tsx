import React, { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  ClipboardCheck,
  Copy,
  Edit3,
  FileDown,
  FileText,
  Printer,
} from 'lucide-react';
import type { RPMDocument, RPMFormData } from '../types/rpm';
import { formatIndonesianDate } from '../utils/rpmLogic';
import { copyLKPDToClipboard, downloadLKPDAsDoc } from '../utils/exportUtils';

interface LKPDOnlyPreviewProps {
  rpm: RPMDocument;
  formData: RPMFormData;
  onUpdateRpm: (updated: RPMDocument) => void;
}

export const LKPDOnlyPreview: React.FC<LKPDOnlyPreviewProps> = ({
  rpm,
  formData,
  onUpdateRpm,
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

  const handleDownloadWord = () => {
    downloadLKPDAsDoc(rpm, formData);
    showToast('File LKPD & Rubrik Penilaian berhasil diunduh dalam format Microsoft Word (.doc).');
  };

  const handleCopyAndOpenDocs = async () => {
    try {
      await copyLKPDToClipboard(rpm, formData);
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Ignore confetti errors
      }
      showToast(
        'Dokumen LKPD berhasil disalin ke clipboard! Membuka Google Dokumen baru — tinggal tempel (Ctrl+V / Cmd+V).'
      );
      docsAnchorRef.current?.click();
    } catch {
      showToast('Gagal menyalin otomatis. Silakan gunakan tombol Unduh LKPD (.Doc).');
    }
  };

  const updateLkpdField = (
    field: 'judulLKPD' | 'tujuanAktivitas' | 'kasusNyataStimulus' | 'pedomanPenskoran',
    value: string
  ) => {
    onUpdateRpm({
      ...rpm,
      lkpd: {
        ...rpm.lkpd,
        [field]: value,
      },
    });
  };

  const updateAktivitasTugas = (index: number, value: string) => {
    const nextAktivitas = rpm.lkpd.aktivitasPerPertemuan.map((act, idx) =>
      idx === index ? { ...act, tugasPengamatan: value } : act
    );
    onUpdateRpm({
      ...rpm,
      lkpd: {
        ...rpm.lkpd,
        aktivitasPerPertemuan: nextAktivitas,
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
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

      {/* Toolbar Khusus LKPD */}
      <div className="no-print rounded-2xl border border-orange-200 bg-white shadow-md overflow-hidden">
        <div className="h-1.5 w-full bg-four-colors" />
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-lg font-extrabold text-slate-900">
                Hasil Khusus LKPD &amp; Rubrik Penilaian
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-100 border border-orange-200 px-3 py-1 text-xs font-bold text-orange-800">
                <FileText className="h-3.5 w-3.5" />
                Siap Unduh Word (.Doc)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadWord}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-colors whitespace-nowrap"
              >
                <FileDown className="h-4 w-4" />
                Unduh LKPD (.Doc / Word)
              </button>

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
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors whitespace-nowrap"
              >
                <Printer className="h-3.5 w-3.5" />
                Cetak / PDF LKPD
              </button>

              <button
                type="button"
                onClick={() => setIsEditMode((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm transition-colors whitespace-nowrap ${
                  isEditMode
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                {isEditMode ? <Check className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                {isEditMode ? 'Selesai Edit' : 'Sesuaikan Teks LKPD'}
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

      {/* Kertas Dokumen Khusus LKPD */}
      <article className="rounded-2xl border border-orange-200 bg-white p-6 sm:p-10 shadow-xl space-y-6 print:border-none print:p-0 print:shadow-none">
        <header className="border-b-2 border-slate-900 pb-4 text-center space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-1 text-xs font-bold text-white mb-1">
            <FileText className="h-3.5 w-3.5" />
            LEMBAR KERJA PESERTA DIDIK (LKPD)
          </span>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-950">
            {isEditMode ? (
              <input
                type="text"
                value={rpm.lkpd.judulLKPD}
                onChange={(e) => updateLkpdField('judulLKPD', e.target.value)}
                className="w-full rounded-lg border border-orange-300 bg-orange-50/40 px-3 py-1.5 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            ) : (
              rpm.lkpd.judulLKPD
            )}
          </h1>
          <p className="text-sm font-bold text-blue-900">{rpm.identitas.namaSatuanPendidikan}</p>
          <p className="text-xs font-semibold text-slate-600">
            {rpm.lkpd.mataPelajaran} • {rpm.lkpd.kelasSemester} • Tahun Ajaran 2026/2027
          </p>
        </header>

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

        {/* Tujuan, Petunjuk, Stimulus */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-1.5">
            <h3 className="text-xs font-extrabold text-blue-900">Tujuan Aktivitas</h3>
            {isEditMode ? (
              <textarea
                rows={4}
                value={rpm.lkpd.tujuanAktivitas}
                onChange={(e) => updateLkpdField('tujuanAktivitas', e.target.value)}
                className="w-full rounded-lg border border-blue-300 bg-white p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            ) : (
              <p className="text-xs leading-relaxed text-slate-700">{rpm.lkpd.tujuanAktivitas}</p>
            )}
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1.5">
            <h3 className="text-xs font-extrabold text-emerald-900">Petunjuk Umum Pengerjaan</h3>
            <ol className="list-decimal pl-4 space-y-1 text-xs text-slate-700">
              {rpm.lkpd.petunjukUmum.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 space-y-1.5">
            <h3 className="text-xs font-extrabold text-orange-900">
              Kasus Nyata / Stimulus Masalah
            </h3>
            {isEditMode ? (
              <textarea
                rows={4}
                value={rpm.lkpd.kasusNyataStimulus}
                onChange={(e) => updateLkpdField('kasusNyataStimulus', e.target.value)}
                className="w-full rounded-lg border border-orange-300 bg-white p-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            ) : (
              <p className="text-xs leading-relaxed text-slate-700">
                {rpm.lkpd.kasusNyataStimulus}
              </p>
            )}
          </div>
        </div>

        {/* Kartu Aktivitas per Pertemuan */}
        <div className="space-y-4">
          {rpm.lkpd.aktivitasPerPertemuan.map((act, idx) => (
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
                    {act.langkahPengerjaan.map((s, sIdx) => (
                      <li key={sIdx}>{s}</li>
                    ))}
                  </ol>
                </div>
                <div className="rounded-lg border border-dashed border-slate-400 bg-slate-50 p-3.5">
                  <p className="font-bold text-slate-900 mb-1">Lembar Kerja / Tugas Pengamatan:</p>
                  {isEditMode ? (
                    <textarea
                      rows={3}
                      value={act.tugasPengamatan}
                      onChange={(e) => updateAktivitasTugas(idx, e.target.value)}
                      className="w-full rounded-lg border border-orange-300 bg-white p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  ) : (
                    <p className="text-slate-700 leading-relaxed">{act.tugasPengamatan}</p>
                  )}
                  <div className="mt-3 h-20 rounded border border-slate-300 bg-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pertanyaan Refleksi HOTS */}
        <div className="rounded-xl border border-amber-300 bg-amber-50/50 p-4 space-y-2 print-avoid-break">
          <h3 className="text-sm font-extrabold text-amber-950">
            Pertanyaan Refleksi &amp; Kesimpulan Kelompok (HOTS)
          </h3>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-slate-800">
            {rpm.lkpd.pertanyaanRefleksiHOTS.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </div>

        {/* Tabel Rubrik Penilaian 4 Skala Skor */}
        <div className="space-y-2 print-avoid-break">
          <h3 className="font-display text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-blue-600" />
            Rubrik Penilaian 4 Skala Skor
          </h3>
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
            <strong>Pedoman Penskoran &amp; Predikat Nilai Akhir:</strong>{' '}
            {isEditMode ? (
              <input
                type="text"
                value={rpm.lkpd.pedomanPenskoran}
                onChange={(e) => updateLkpdField('pedomanPenskoran', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            ) : (
              rpm.lkpd.pedomanPenskoran
            )}
          </div>
        </div>

        {/* Lembar Pengesahan */}
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
    </div>
  );
};
