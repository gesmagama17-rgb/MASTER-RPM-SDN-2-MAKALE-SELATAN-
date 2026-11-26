import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FileUp,
  Layers,
  Loader2,
  Monitor,
  School,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import {
  DIMENSI_PROFIL_LULUSAN,
  PEDAGOGICAL_MODELS,
  PHASE_CONFIG,
  SD_INSTANT_PRESETS,
  type DimensiLulusan,
  type PedagogicalModel,
  type RPMFormData,
  type SDPhase,
} from '../types/rpm';
import {
  getClassesForPhase,
  parseCurriculumDocumentText,
  syncPedagogicalModelsCount,
} from '../utils/rpmLogic';

interface RPMFormProps {
  formData: RPMFormData;
  accessPin: string;
  workspaceId: string;
  isGenerating: boolean;
  fieldErrors: Partial<Record<keyof RPMFormData | 'general', string>>;
  onChange: (updated: RPMFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const RPMForm: React.FC<RPMFormProps> = ({
  formData,
  accessPin,
  workspaceId,
  isGenerating,
  fieldErrors,
  onChange,
  onSubmit,
}) => {
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const cpAtpFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleField = <K extends keyof RPMFormData>(key: K, value: RPMFormData[K]) => {
    onChange({ ...formData, [key]: value });
  };

  const handlePhaseChange = (fase: SDPhase) => {
    const classes = getClassesForPhase(fase);
    const nextKelas = classes.includes(formData.kelas) ? formData.kelas : classes[0];
    onChange({
      ...formData,
      fase,
      kelas: nextKelas,
    });
  };

  const handlePertemuanCountChange = (val: number) => {
    const clamped = Math.max(1, Math.min(8, Number.isNaN(val) ? 1 : val));
    onChange({
      ...formData,
      jumlahPertemuan: clamped,
      praktikPedagogisPerPertemuan: syncPedagogicalModelsCount(
        formData.praktikPedagogisPerPertemuan,
        clamped
      ),
    });
  };

  const handleModelPerPertemuanChange = (index: number, model: PedagogicalModel) => {
    const next = [...formData.praktikPedagogisPerPertemuan];
    next[index] = model;
    handleField('praktikPedagogisPerPertemuan', next);
  };

  const handleToggleDimensi = (dimensi: DimensiLulusan) => {
    const exists = formData.dimensiProfilLulusan.includes(dimensi);
    if (exists) {
      handleField(
        'dimensiProfilLulusan',
        formData.dimensiProfilLulusan.filter((d) => d !== dimensi)
      );
      return;
    }
    if (formData.dimensiProfilLulusan.length >= 3) return;
    handleField('dimensiProfilLulusan', [...formData.dimensiProfilLulusan, dimensi]);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = SD_INSTANT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChange({
      ...formData,
      fase: preset.fase,
      kelas: preset.kelas,
      semester: preset.semester,
      mataPelajaran: preset.mataPelajaran,
      materiPelajaran: preset.materiPelajaran,
      durasiPertemuan: preset.durasiPertemuan,
      jumlahPertemuan: preset.jumlahPertemuan,
      praktikPedagogisPerPertemuan: [...preset.praktikPedagogisPerPertemuan],
      capaianPembelajaran: preset.capaianPembelajaran,
      tujuanPembelajaran: preset.tujuanPembelajaran,
      dimensiProfilLulusan: [...preset.dimensiProfilLulusan],
    });
  };

  const handleCurriculumFileUpload = async (file: File) => {
    setUploadStatus({ type: 'loading', message: `Membaca dokumen "${file.name}"...` });

    try {
      const isTextLike =
        file.type.startsWith('text/') ||
        /\.(txt|md|csv|json)$/i.test(file.name);

      if (isTextLike) {
        const text = await file.text();
        const parsed = parseCurriculumDocumentText(text, file.name);
        const nextFase = parsed.fase ?? formData.fase;
        const nextClasses = getClassesForPhase(nextFase);
        onChange({
          ...formData,
          fase: nextFase,
          kelas: nextClasses.includes(formData.kelas) ? formData.kelas : nextClasses[0],
          mataPelajaran: parsed.mataPelajaran || formData.mataPelajaran,
          capaianPembelajaran: parsed.capaianPembelajaran || formData.capaianPembelajaran,
          tujuanPembelajaran: parsed.tujuanPembelajaran || formData.tujuanPembelajaran,
          materiPelajaran: parsed.materiPelajaran || formData.materiPelajaran,
        });
        setUploadStatus({
          type: 'success',
          message: `Dokumen "${file.name}" berhasil diekstrak ke CP, TP, dan Materi Pelajaran.`,
        });
        return;
      }

      // PDF or Image -> send base64 to server /api/parse-curriculum
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/parse-curriculum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-pin': accessPin,
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || 'application/pdf',
          base64Data,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.parsed) {
        throw new Error(json.error || 'Gagal mengekstrak dokumen');
      }

      const parsed = json.parsed;
      const nextFase: SDPhase =
        parsed.fase === 'Fase A' || parsed.fase === 'Fase B' || parsed.fase === 'Fase C'
          ? parsed.fase
          : formData.fase;
      const nextClasses = getClassesForPhase(nextFase);

      onChange({
        ...formData,
        fase: nextFase,
        kelas: nextClasses.includes(formData.kelas) ? formData.kelas : nextClasses[0],
        mataPelajaran: parsed.mataPelajaran || formData.mataPelajaran,
        capaianPembelajaran: parsed.capaianPembelajaran || formData.capaianPembelajaran,
        tujuanPembelajaran: parsed.tujuanPembelajaran || formData.tujuanPembelajaran,
        materiPelajaran: parsed.materiPelajaran || formData.materiPelajaran,
      });

      setUploadStatus({
        type: 'success',
        message: `Dokumen "${file.name}" berhasil diproses ke kolom CP & ATP 2025.`,
      });
    } catch {
      setUploadStatus({
        type: 'error',
        message:
          'Format dokumen belum terbaca otomatis. Gunakan file .txt, .md, .csv, .json atau salin teks CP/ATP ke kolom di bawah.',
      });
    }
  };

  const availableClasses = getClassesForPhase(formData.fase);

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border-2 border-blue-200 bg-white shadow-xl overflow-hidden"
    >
      {/* Garis Aksen 4 Warna Atas */}
      <div className="h-1.5 w-full bg-four-colors" />

      {/* Banner Template Instan Siap Pakai SD/MI */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 border-b-4 border-yellow-400 px-6 py-5 text-white">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-300 shrink-0" />
            <h2 className="font-display text-sm sm:text-base font-extrabold tracking-wide text-yellow-300">
              TEMPLATE INSTAN SIAP PAKAI (SD/MI)
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {SD_INSTANT_PRESETS.map((preset) => {
              const isActive =
                formData.fase === preset.fase &&
                formData.mataPelajaran === preset.mataPelajaran &&
                formData.materiPelajaran === preset.materiPelajaran;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`flex flex-col items-start rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                    isActive
                      ? 'border-yellow-300 bg-yellow-400/20 text-white shadow-sm'
                      : 'border-white/20 bg-white/10 text-blue-50 hover:bg-white/20'
                  }`}
                >
                  <span className="text-xs font-bold text-white leading-snug">{preset.title}</span>
                  <span className="text-[11px] text-yellow-200 mt-0.5">{preset.badge}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-8 space-y-8">
        {/* BAGIAN 1: BIRU — Satuan Pendidikan & Pengesahan */}
        <section
          aria-labelledby="bagian-1-title"
          className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <School className="h-5 w-5" />
              </div>
              <div>
                <h3 id="bagian-1-title" className="font-display text-base sm:text-lg font-bold text-slate-900">
                  Satuan Pendidikan &amp; Pengesahan
                </h3>
                <p className="text-xs text-slate-600">Identitas resmi sekolah dasar / madrasah ibtidaiyah dan legalitas dokumen</p>
              </div>
            </div>
            <span className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white">
              Bagian 1 • Biru
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="nama-satuan" className="block text-xs font-bold text-slate-800 mb-1">
                1. Nama Satuan Pendidikan <span className="text-red-600">*</span>
              </label>
              <input
                id="nama-satuan"
                type="text"
                required
                value={formData.namaSatuanPendidikan}
                onChange={(e) => handleField('namaSatuanPendidikan', e.target.value)}
                placeholder="Contoh: UPT SD Negeri 2 Makale Selatan"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {fieldErrors.namaSatuanPendidikan && (
                <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.namaSatuanPendidikan}</p>
              )}
            </div>

            <div>
              <label htmlFor="nama-guru" className="block text-xs font-bold text-slate-800 mb-1">
                2. Nama Guru Kelas / Mapel <span className="text-red-600">*</span>
              </label>
              <input
                id="nama-guru"
                type="text"
                required
                value={formData.namaGuru}
                onChange={(e) => handleField('namaGuru', e.target.value)}
                placeholder="Contoh: Gesma Gama, S.Pd."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {fieldErrors.namaGuru && (
                <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.namaGuru}</p>
              )}
            </div>

            <div>
              <label htmlFor="nip-guru" className="block text-xs font-bold text-slate-800 mb-1">
                3. NIP Guru
              </label>
              <input
                id="nip-guru"
                type="text"
                value={formData.nipGuru}
                onChange={(e) => handleField('nipGuru', e.target.value)}
                placeholder="Contoh: 19880517 201903 1 004 (atau -)"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label htmlFor="nama-kepsek" className="block text-xs font-bold text-slate-800 mb-1">
                4. Nama Kepala Sekolah / Kepala Madrasah <span className="text-red-600">*</span>
              </label>
              <input
                id="nama-kepsek"
                type="text"
                required
                value={formData.namaKepalaSekolah}
                onChange={(e) => handleField('namaKepalaSekolah', e.target.value)}
                placeholder="Contoh: Alfeus Mardan Kadang, S.Pd."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {fieldErrors.namaKepalaSekolah && (
                <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.namaKepalaSekolah}</p>
              )}
            </div>

            <div>
              <label htmlFor="nip-kepsek" className="block text-xs font-bold text-slate-800 mb-1">
                5. NIP Kepala Sekolah / Kepala Madrasah
              </label>
              <input
                id="nip-kepsek"
                type="text"
                value={formData.nipKepalaSekolah}
                onChange={(e) => handleField('nipKepalaSekolah', e.target.value)}
                placeholder="Contoh: 19720812 199803 1 009"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label htmlFor="kota-penetapan" className="block text-xs font-bold text-slate-800 mb-1">
                Kota / Kabupaten Penetapan
              </label>
              <input
                id="kota-penetapan"
                type="text"
                value={formData.kotaPenetapan}
                onChange={(e) => handleField('kotaPenetapan', e.target.value)}
                placeholder="Contoh: Makale Selatan"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label htmlFor="tanggal-penetapan" className="block text-xs font-bold text-slate-800 mb-1">
                Tanggal Penetapan Dokumen
              </label>
              <input
                id="tanggal-penetapan"
                type="date"
                value={formData.tanggalPenetapan}
                onChange={(e) => handleField('tanggalPenetapan', e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </section>

        {/* BAGIAN 2: ORANGE — Fase SD/MI, Kelas & Mata Pelajaran */}
        <section
          aria-labelledby="bagian-2-title"
          className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 id="bagian-2-title" className="font-display text-base sm:text-lg font-bold text-slate-900">
                  Fase SD/MI, Kelas &amp; Mata Pelajaran
                </h3>
                <p className="text-xs text-slate-600">Fokus 100% pada fase perkembangan belajar peserta didik SD/MI</p>
              </div>
            </div>
            <span className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-bold text-white">
              Bagian 2 • Orange
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <span className="block text-xs font-bold text-slate-800 mb-2">
                6. Pilihan Fase &amp; Kelompok Kelas Khusus SD/MI <span className="text-red-600">*</span>
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(['Fase A', 'Fase B', 'Fase C'] as SDPhase[]).map((fase) => {
                  const cfg = PHASE_CONFIG[fase];
                  const isSelected = formData.fase === fase;
                  return (
                    <button
                      key={fase}
                      type="button"
                      onClick={() => handlePhaseChange(fase)}
                      className={`rounded-xl border-2 p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-white shadow-md ring-2 ring-orange-500/20'
                          : 'border-slate-200 bg-white/80 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-slate-900">{cfg.label}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-orange-600 shrink-0" />}
                      </div>
                      <span className="block text-xs font-medium text-slate-600 mt-1">
                        {cfg.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="kelas-select" className="block text-xs font-bold text-slate-800 mb-1">
                  7. Pilihan Kelas SD/MI
                </label>
                <select
                  id="kelas-select"
                  value={formData.kelas}
                  onChange={(e) => handleField('kelas', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="semester-select" className="block text-xs font-bold text-slate-800 mb-1">
                  Semester
                </label>
                <select
                  id="semester-select"
                  value={formData.semester}
                  onChange={(e) =>
                    handleField(
                      'semester',
                      e.target.value as 'Semester Ganjil (1)' | 'Semester Genap (2)'
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="Semester Ganjil (1)">Semester Ganjil (1)</option>
                  <option value="Semester Genap (2)">Semester Genap (2)</option>
                </select>
              </div>

              <div>
                <label htmlFor="mata-pelajaran" className="block text-xs font-bold text-slate-800 mb-1">
                  8. Mata Pelajaran (Mapel) <span className="text-red-600">*</span>
                </label>
                <input
                  id="mata-pelajaran"
                  type="text"
                  required
                  value={formData.mataPelajaran}
                  onChange={(e) => handleField('mataPelajaran', e.target.value)}
                  placeholder="IPAS / Matematika / Bahasa Indonesia / PAI / PJOK"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                {fieldErrors.mataPelajaran && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.mataPelajaran}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* BAGIAN 3: HIJAU — Capaian, Tujuan & Materi Pembelajaran (+ Upload Dokumen CP/ATP 2025) */}
        <section
          aria-labelledby="bagian-3-title"
          className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 id="bagian-3-title" className="font-display text-base sm:text-lg font-bold text-slate-900">
                  Capaian, Tujuan &amp; Materi Pembelajaran
                </h3>
                <p className="text-xs text-slate-600">
                  Isi manual atau unggah dokumen Capaian Pembelajaran (CP) &amp; Alur Tujuan Pembelajaran (ATP) 2025
                </p>
              </div>
            </div>
            <span className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
              Bagian 3 • Hijau
            </span>
          </div>

          {/* Fitur Upload Dokumen CP & ATP 2025 */}
          <div className="rounded-xl border border-emerald-300 bg-white p-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <FileUp className="h-4 w-4 text-emerald-600" />
                  Ekstraksi Otomatis Dokumen CP &amp; ATP 2025
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Unggah file CP/ATP 2025 (.txt, .md, .csv, .json, .pdf, atau gambar) untuk mengisi kolom CP, TP, dan Materi otomatis.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={cpAtpFileInputRef}
                  type="file"
                  accept=".txt,.md,.csv,.json,.pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCurriculumFileUpload(file);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => cpAtpFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white transition-colors whitespace-nowrap"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Unggah File CP / ATP 2025
                </button>
              </div>
            </div>
            {uploadStatus.type !== 'idle' && (
              <div
                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  uploadStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : uploadStatus.type === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {uploadStatus.message}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="capaian-pembelajaran" className="block text-xs font-bold text-slate-800 mb-1">
                9. Capaian Pembelajaran (CP 2025) <span className="text-red-600">*</span>
              </label>
              <textarea
                id="capaian-pembelajaran"
                rows={3}
                required
                value={formData.capaianPembelajaran}
                onChange={(e) => handleField('capaianPembelajaran', e.target.value)}
                placeholder="Tuliskan Capaian Pembelajaran sesuai Keputusan BSKAP 2025 atau unggah file CP..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {fieldErrors.capaianPembelajaran && (
                <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.capaianPembelajaran}</p>
              )}
            </div>

            <div>
              <label htmlFor="tujuan-pembelajaran" className="block text-xs font-bold text-slate-800 mb-1">
                10. Tujuan Pembelajaran (TP / ATP 2025) <span className="text-red-600">*</span>
              </label>
              <textarea
                id="tujuan-pembelajaran"
                rows={3}
                required
                value={formData.tujuanPembelajaran}
                onChange={(e) => handleField('tujuanPembelajaran', e.target.value)}
                placeholder="Tuliskan Tujuan Pembelajaran terukur dari ATP 2025..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {fieldErrors.tujuanPembelajaran && (
                <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.tujuanPembelajaran}</p>
              )}
            </div>

            <div>
              <label htmlFor="materi-pelajaran" className="block text-xs font-bold text-slate-800 mb-1">
                11. Materi Pelajaran <span className="text-red-600">*</span>
              </label>
              <input
                id="materi-pelajaran"
                type="text"
                required
                value={formData.materiPelajaran}
                onChange={(e) => handleField('materiPelajaran', e.target.value)}
                placeholder="Contoh: Wujud Zat dan Perubahan Wujud Benda dalam Kehidupan Sehari-hari"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {fieldErrors.materiPelajaran && (
                <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.materiPelajaran}</p>
              )}
            </div>
          </div>
        </section>

        {/* BAGIAN 4: KUNING — Waktu & Praktik Pedagogis per Pertemuan */}
        <section
          aria-labelledby="bagian-4-title"
          className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 id="bagian-4-title" className="font-display text-base sm:text-lg font-bold text-slate-900">
                  Waktu &amp; Praktik Pedagogis per Pertemuan
                </h3>
                <p className="text-xs text-slate-600">Atur jumlah pertemuan (1–8) dan model pembelajaran mendalam tiap sesi</p>
              </div>
            </div>
            <span className="rounded-lg bg-amber-400 px-3 py-1 text-xs font-bold text-slate-950">
              Bagian 4 • Kuning
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jumlah-pertemuan" className="block text-xs font-bold text-slate-800 mb-1">
                12. Jumlah Pertemuan (1–8)
              </label>
              <input
                id="jumlah-pertemuan"
                type="number"
                min={1}
                max={8}
                value={formData.jumlahPertemuan}
                onChange={(e) => handlePertemuanCountChange(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label htmlFor="durasi-pertemuan" className="block text-xs font-bold text-slate-800 mb-1">
                13. Durasi Setiap Pertemuan (Standar SD/MI)
              </label>
              <input
                id="durasi-pertemuan"
                type="text"
                required
                value={formData.durasiPertemuan}
                onChange={(e) => handleField('durasiPertemuan', e.target.value)}
                placeholder="Contoh: 2 × 35 menit atau 3 × 35 menit"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="block text-xs font-bold text-slate-800">
              14. Praktik Pedagogis per Pertemuan
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formData.praktikPedagogisPerPertemuan.map((selectedModel, index) => (
                <div
                  key={`pertemuan-model-${index}`}
                  className="rounded-xl border border-amber-200 bg-white p-3.5 space-y-1.5"
                >
                  <label
                    htmlFor={`model-pertemuan-${index + 1}`}
                    className="block text-xs font-bold text-amber-900"
                  >
                    Pertemuan Ke-{index + 1}
                  </label>
                  <select
                    id={`model-pertemuan-${index + 1}`}
                    value={selectedModel}
                    onChange={(e) =>
                      handleModelPerPertemuanChange(index, e.target.value as PedagogicalModel)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  >
                    {PEDAGOGICAL_MODELS.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BAGIAN 5: 15. Dimensi Profil Lulusan (Max 3) */}
        <section
          aria-labelledby="bagian-5-title"
          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-yellow-300">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 id="bagian-5-title" className="font-display text-base sm:text-lg font-bold text-slate-900">
                  15. Dimensi Profil Lulusan — Pilih Maksimal 3
                </h3>
                <p className="text-xs text-slate-600">Sinergi 4 warna penguatan karakter lulusan SD/MI</p>
              </div>
            </div>
            <span
              className={`rounded-lg px-3 py-1 text-xs font-bold tabular-nums ${
                formData.dimensiProfilLulusan.length === 0
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-900 text-white'
              }`}
            >
              Terpilih: {formData.dimensiProfilLulusan.length} / 3
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {DIMENSI_PROFIL_LULUSAN.map((dimensi) => {
              const isSelected = formData.dimensiProfilLulusan.includes(dimensi);
              const isDisabled = !isSelected && formData.dimensiProfilLulusan.length >= 3;
              return (
                <button
                  key={dimensi}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleToggleDimensi(dimensi)}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : isDisabled
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border-slate-300 bg-white text-slate-800 hover:border-blue-400 hover:bg-blue-50/40'
                  }`}
                >
                  <span className="leading-snug">{dimensi}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-yellow-300" />}
                </button>
              );
            })}
          </div>

          {(formData.dimensiProfilLulusan.length === 0 || fieldErrors.dimensiProfilLulusan) && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700">
              Wajib memilih minimal 1 dan maksimal 3 Dimensi Profil Lulusan.
            </div>
          )}
        </section>

        {/* Kartu Fitur Unggulan: Integrasi Literasi, Numerasi & Papan Interaktif Digital */}
        <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-slate-50 to-blue-50/50 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm sm:text-base font-bold text-slate-900">
              Integrasi Literasi, Numerasi &amp; Papan Interaktif Digital
            </h3>
            <span className="rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">
              Standar Wajib RPM
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="rounded-xl border border-blue-200 bg-white p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                <BookOpen className="h-4 w-4 text-blue-600" />
                Muatan Literasi
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Membaca cerita bergambar, teks informasional sederhana, kosa kata baru, &amp; menceritakan kembali ide pokok.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-white p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <Calculator className="h-4 w-4 text-emerald-600" />
                Muatan Numerasi
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Berhitung kontekstual, membaca tabel/piktogram/diagram batang sederhana, pengukuran benda konkret, &amp; logika pola.
              </p>
            </div>

            <div className="rounded-xl border border-orange-200 bg-white p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-800">
                <Monitor className="h-4 w-4 text-orange-600" />
                Papan Interaktif Digital
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Aktivitas sentuh ramah anak SD/MI (drag-and-drop gambar/kata, menggambar bersama, simulasi visual, &amp; kuis gamifikasi).
              </p>
            </div>
          </div>
        </section>

        {/* Opsi Lampiran Toggle LKPD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50/60 p-4 sm:p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                Sertakan Lembar Kerja Peserta Didik (LKPD) &amp; Rubrik
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                  formData.includeLKPD
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {formData.includeLKPD ? 'Aktif (Lengkap)' : 'Nonaktif (Hanya RPM)'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Menambahkan halaman LKPD siap cetak lengkap dengan stimulus kasus nyata dan Rubrik Penilaian 4 Skala Skor.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={formData.includeLKPD}
            onClick={() => handleField('includeLKPD', !formData.includeLKPD)}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              formData.includeLKPD ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span className="sr-only">Aktifkan atau nonaktifkan LKPD</span>
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                formData.includeLKPD ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Tombol Submit Hero CTA */}
        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={isGenerating}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-four-colors px-6 py-4 text-base font-extrabold text-slate-950 shadow-lg hover:brightness-105 active:scale-[0.995] disabled:opacity-70 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-slate-950" />
                <span>Merancang Perencanaan Pembelajaran Mendalam (RPM)...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-slate-950" />
                <span>Hasilkan RPM 5 Bagian Tabel Sekarang</span>
              </>
            )}
          </button>

          <p className="text-center text-xs font-medium text-slate-600">
            Biru: Identitas • Orange: Fase &amp; Mapel • Hijau: Kurikulum CP &amp; TP • Kuning: Pedagogis &amp; LKPD
          </p>
        </div>
      </div>
    </form>
  );
};
