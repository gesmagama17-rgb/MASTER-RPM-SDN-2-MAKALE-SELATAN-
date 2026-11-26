import {
  DIMENSI_PROFIL_LULUSAN,
  PEDAGOGICAL_MODELS,
  PHASE_CONFIG,
  type DimensiLulusan,
  type PedagogicalModel,
  type RPMDocument,
  type RPMFormData,
  type SDPhase,
} from '../types/rpm';

export interface FormValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof RPMFormData | 'general', string>>;
}

export function getClassesForPhase(phase: SDPhase): string[] {
  return PHASE_CONFIG[phase]?.classes ?? PHASE_CONFIG['Fase B'].classes;
}

export function syncPedagogicalModelsCount(
  current: PedagogicalModel[],
  targetCount: number
): PedagogicalModel[] {
  const clamped = Math.max(1, Math.min(8, Math.floor(targetCount || 1)));
  const result: PedagogicalModel[] = [];
  for (let i = 0; i < clamped; i++) {
    result.push(current[i] ?? PEDAGOGICAL_MODELS[i % PEDAGOGICAL_MODELS.length]);
  }
  return result;
}

export function validateRPMForm(data: RPMFormData): FormValidationResult {
  const errors: Partial<Record<keyof RPMFormData | 'general', string>> = {};

  if (!data.namaSatuanPendidikan.trim()) {
    errors.namaSatuanPendidikan = 'Nama Satuan Pendidikan SD/MI wajib diisi.';
  }
  if (!data.namaGuru.trim()) {
    errors.namaGuru = 'Nama Guru Kelas / Mapel wajib diisi.';
  }
  if (!data.namaKepalaSekolah.trim()) {
    errors.namaKepalaSekolah = 'Nama Kepala Sekolah / Kepala Madrasah wajib diisi.';
  }
  if (!data.mataPelajaran.trim()) {
    errors.mataPelajaran = 'Mata Pelajaran wajib diisi.';
  }
  if (!data.capaianPembelajaran.trim()) {
    errors.capaianPembelajaran = 'Capaian Pembelajaran (CP) wajib diisi atau diekstrak dari dokumen CP 2025.';
  }
  if (!data.tujuanPembelajaran.trim()) {
    errors.tujuanPembelajaran = 'Tujuan Pembelajaran (TP) wajib diisi atau diekstrak dari dokumen ATP 2025.';
  }
  if (!data.materiPelajaran.trim()) {
    errors.materiPelajaran = 'Materi Pelajaran wajib diisi.';
  }
  if (!data.durasiPertemuan.trim()) {
    errors.durasiPertemuan = 'Durasi pertemuan wajib diisi (misal: 2 × 35 menit).';
  }
  if (data.jumlahPertemuan < 1 || data.jumlahPertemuan > 8) {
    errors.jumlahPertemuan = 'Jumlah pertemuan harus antara 1 sampai 8.';
  }
  if (data.dimensiProfilLulusan.length < 1 || data.dimensiProfilLulusan.length > 3) {
    errors.dimensiProfilLulusan = 'Pilih minimal 1 dan maksimal 3 Dimensi Profil Lulusan.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface ParsedCurriculumDoc {
  capaianPembelajaran?: string;
  tujuanPembelajaran?: string;
  materiPelajaran?: string;
  mataPelajaran?: string;
  fase?: SDPhase;
}

export function parseCurriculumDocumentText(rawText: string, fileName = ''): ParsedCurriculumDoc {
  const text = rawText.replace(/\r\n/g, '\n').trim();
  const result: ParsedCurriculumDoc = {};

  // Check JSON format first
  if (fileName.toLowerCase().endsWith('.json') || text.startsWith('{')) {
    try {
      const json = JSON.parse(text) as Record<string, unknown>;
      const cp = json.capaianPembelajaran ?? json.cp ?? json.CP;
      const tp = json.tujuanPembelajaran ?? json.tp ?? json.atp ?? json.TP;
      const materi = json.materiPelajaran ?? json.materi ?? json.topik;
      const mapel = json.mataPelajaran ?? json.mapel;
      if (typeof cp === 'string') result.capaianPembelajaran = cp.trim();
      if (typeof tp === 'string') result.tujuanPembelajaran = tp.trim();
      if (typeof materi === 'string') result.materiPelajaran = materi.trim();
      if (typeof mapel === 'string') result.mataPelajaran = mapel.trim();
      if (Object.keys(result).length > 0) return result;
    } catch {
      // Fall through to text regex extraction
    }
  }

  // Detect Phase
  if (/fase\s*a\b|kelas\s*(1|i|2|ii)\b/i.test(text)) result.fase = 'Fase A';
  else if (/fase\s*b\b|kelas\s*(3|iii|4|iv)\b/i.test(text)) result.fase = 'Fase B';
  else if (/fase\s*c\b|kelas\s*(5|v|6|vi)\b/i.test(text)) result.fase = 'Fase C';

  // Extract CP (Capaian Pembelajaran)
  const cpMatch = text.match(
    /(?:capaian\s+pembelajaran(?:\s*\(cp\))?|cp\s*2025|\bcp\b)\s*[:\-]\s*([\s\S]*?)(?=\n\s*(?:tujuan\s+pembelajaran|alur\s+tujuan|atp\b|tp\b|materi\s+(?:pelajaran|pokok)|topik\b|$))/i
  );
  if (cpMatch?.[1]?.trim()) {
    result.capaianPembelajaran = cpMatch[1].trim();
  }

  // Extract TP / ATP
  const tpMatch = text.match(
    /(?:alur\s+tujuan\s+pembelajaran(?:\s*\(atp\))?|tujuan\s+pembelajaran(?:\s*\(tp\))?|atp\s*2025|\btp\b)\s*[:\-]\s*([\s\S]*?)(?=\n\s*(?:materi\s+(?:pelajaran|pokok)|topik\b|capaian\s+pembelajaran|$))/i
  );
  if (tpMatch?.[1]?.trim()) {
    result.tujuanPembelajaran = tpMatch[1].trim();
  }

  // Extract Materi
  const materiMatch = text.match(
    /(?:materi\s+(?:pelajaran|pokok)|topik\s+pembelajaran)\s*[:\-]\s*([^\n]+)/i
  );
  if (materiMatch?.[1]?.trim()) {
    result.materiPelajaran = materiMatch[1].trim();
  }

  // Extract Mata Pelajaran
  const mapelMatch = text.match(/(?:mata\s+pelajaran|mapel)\s*[:\-]\s*([^\n]+)/i);
  if (mapelMatch?.[1]?.trim()) {
    result.mataPelajaran = mapelMatch[1].trim();
  }

  // If no explicit headers were found, intelligently place non-empty text
  if (!result.capaianPembelajaran && !result.tujuanPembelajaran && text.length > 0) {
    const lowerName = fileName.toLowerCase();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lowerName.includes('atp') || lowerName.includes('tp')) {
      result.tujuanPembelajaran = lines.join('\n');
      if (lines[0] && lines[0].length < 90) {
        result.materiPelajaran = lines[0].replace(/^[\d.\-*\s]+/, '');
      }
    } else {
      result.capaianPembelajaran = lines.join('\n');
    }
  }

  return result;
}

export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parsed = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function buildAnatomyPromptText(data: RPMFormData): string {
  const modelsText = data.praktikPedagogisPerPertemuan
    .map((m, idx) => `Pertemuan ${idx + 1}: ${m}`)
    .join('; ');
  const dimensiText = data.dimensiProfilLulusan.join(', ');

  return `[ROLE & PERSONA]
Anda adalah Konsultan Kurikulum Nasional Kurikulum Merdeka Jenjang SD/MI (Fase A, Fase B, dan Fase C) dan Ahli Desain Pembelajaran Mendalam (Deep Learning Framework: Berkesadaran / Mindful, Bermakna / Meaningful, Menggembirakan / Joyful).

[CONTEXT & LATAR BELAKANG]
Susunlah Rencana Pembelajaran Mendalam (RPM) lengkap dan aplikatif khusus untuk siswa Sekolah Dasar / Madrasah Ibtidaiyah (SD/MI) dengan profil:
- Satuan Pendidikan : ${data.namaSatuanPendidikan}
- Guru Kelas/Mapel  : ${data.namaGuru} (NIP: ${data.nipGuru || '-'})
- Kepala Sekolah/MI : ${data.namaKepalaSekolah} (NIP: ${data.nipKepalaSekolah || '-'})
- Fase / Kelas      : ${data.fase} / ${data.kelas}
- Semester          : ${data.semester}
- Mata Pelajaran    : ${data.mataPelajaran}
- Alokasi Waktu     : ${data.jumlahPertemuan} Pertemuan (${data.durasiPertemuan} per pertemuan)
- Praktik Pedagogis : ${modelsText}
- Dimensi Profil    : ${dimensiText}

[INPUT KURIKULUM]
- Capaian Pembelajaran (CP): ${data.capaianPembelajaran}
- Tujuan Pembelajaran (TP): ${data.tujuanPembelajaran}
- Materi Pelajaran: ${data.materiPelajaran}

[TASK & INSTRUCTIONS]
Hasilkan JSON terstruktur yang mencakup 5 Bagian Tabel Terpadu + Lampiran LKPD & Rubrik 4 Skala Skor:
1. Tabel Identitas (Satuan Pendidikan, Mapel, Kelas/Semester, Durasi).
2. Tabel Identifikasi (Profil Kesiapan Belajar Siswa SD/MI sesuai tahap perkembangan konkret-operasional, Materi Pelajaran, Capaian Dimensi Lulusan).
3. Tabel Desain Pembelajaran (CP, Lintas Disiplin Ilmu, TP, Topik, Praktik Pedagogis per pertemuan, Integrasi Wajib Literasi & Numerasi ramah anak SD, Kemitraan dengan orang tua/komunitas sekolah, Lingkungan belajar fisik & psikologis, Pemanfaatan Digital Tools termasuk Papan Interaktif Digital sentuh/gamifikasi).
4. Tabel Pengalaman Belajar per Pertemuan (1 s.d. ${data.jumlahPertemuan}):
   - Tahap MEMAHAMI (Diferensiasi Konten — Berkesadaran, Bermakna, Menggembirakan)
   - Tahap MENGAPLIKASI (Sintaks resmi model yang dipilih pada pertemuan tersebut — Berkesadaran, Bermakna, Menggembirakan)
   - Tahap REFLEKSI (Metakognisi & Umpan Balik ramah anak — Berkesadaran, Bermakna, Menggembirakan)
5. Tabel Asesmen Pembelajaran (Asesmen Awal Diagnostik, Asesmen Proses Formatif/Observasi, Asesmen Akhir Sumatif/Produk).
6. Lampiran LKPD & Rubrik Penilaian 4 Skala Skor (Sangat Baik 4: 86-100, Baik 3: 71-85, Cukup 2: 56-70, Perlu Bimbingan 1: <56), Stimulus Kasus Nyata Kontekstual Anak SD, Aktivitas per Pertemuan, & Pertanyaan Refleksi HOTS.

[CONSTRAINTS]
- Bahasa Indonesia baku, ramah anak SD/MI, konkret, kontekstual, dan langsung siap dipakai mengajar di kelas.
- Seluruh aktivitas wajib mengintegrasikan penguatan Literasi, Numerasi, dan Papan Interaktif Digital.`;
}

function getFasePedagogicalNuance(fase: SDPhase): {
  readiness: string;
  literacyFocus: string;
  numeracyFocus: string;
  boardActivity: string;
} {
  if (fase === 'Fase A') {
    return {
      readiness:
        'Peserta didik usia 6–8 tahun berada pada fase transisi PAUD–SD dengan karakteristik belajar melalui benda konkret, cerita bergambar, gerak motorik, dan permainan kolaboratif sederhana. Diperlukan diferensiasi tingkat kelancaran membaca awal dan pengenalan lambang bilangan.',
      literacyFocus:
        'Membaca nyaring bersama cerita bergambar pendek, mengenali kosa kata baru bergambar, dan menceritakan kembali isi cerita dengan kalimat sederhana.',
      numeracyFocus:
        'Menghitung benda konkret di sekitar kelas (1–100), mengelompokkan berdasarkan bentuk/warna, serta membandingkan jumlah lebih banyak atau lebih sedikit.',
      boardActivity:
        'Permainan tarik-lepas (drag-and-drop) kartu gambar dan suku kata pada Papan Interaktif Digital serta mewarnai bersama secara bergiliran.',
    };
  }
  if (fase === 'Fase B') {
    return {
      readiness:
        'Peserta didik usia 8–10 tahun berada pada tahap operasional konkret awal; antusias mengeksplorasi eksperimen nyata, diskusi kelompok kecil (3–4 anak), dan pemecahan masalah berbasis pengamatan langsung. Diferensiasi disesuaikan pada gaya belajar visual, auditori, dan kinestetik.',
      literacyFocus:
        'Membaca teks informasional bergambar/infografik sederhana, menemukan ide pokok tiap paragraf, dan menuliskan laporan pengamatan singkat dengan ejaan yang tepat.',
      numeracyFocus:
        'Membaca dan mencatat data hasil pengamatan ke dalam tabel, melakukan pengukuran panjang/massa/waktu sederhana, dan menyusun piktogram/diagram batang dasar.',
      boardActivity:
        'Simulasi visual interaktif, mencocokkan konsep sebab-akibat dengan sentuhan jari di Papan Interaktif Digital, dan kuis tim cepat tepat.',
    };
  }
  return {
    returnValue: undefined,
    readiness:
      'Peserta didik usia 10–12 tahun mulai mengembangkan penalaran logis-kritis dan kemampuan bekerja dalam proyek kolaboratif. Mereka mampu menganalisis studi kasus nyata di lingkungan sekolah/masyarakat dengan bimbingan terstruktur dan diferensiasi produk karya.',
    literacyFocus:
      'Menganalisis teks bacaan multi-sumber, membedakan fakta dan opini, menyusun argumen tertulis, serta mempresentasikan hasil telaah dengan bahasa komunikatif.',
    numeracyFocus:
      'Menafsirkan perbandingan pecahan, persentase, rasio, serta mengolah dan menyajikan data kuantitatif ke dalam diagram batang atau tabel analisis.',
    boardActivity:
      'Kolaborasi kanvas digital pada Papan Interaktif Digital (pemetaan pikiran/diagram alur), manipulasi model visual interaktif, dan evaluasi kuis gamifikasi berjenjang.',
  } as unknown as {
    readiness: string;
    literacyFocus: string;
    numeracyFocus: string;
    boardActivity: string;
  };
}

function getModelSyntaxDescription(model: PedagogicalModel, materi: string): string {
  switch (model) {
    case 'Inkuiri-Discovery Learning':
      return `Stimulasi rasa ingin tahu -> Identifikasi pertanyaan -> Eksplorasi & pengumpulan bukti tentang ${materi} -> Pengolahan data -> Verifikasi & penarikan kesimpulan.`;
    case 'Project Based Learning (PjBL)':
      return `Pertanyaan mendasar -> Perencanaan proyek kelas tentang ${materi} -> Penyusunan jadwal & pembagian peran -> Pembuatan produk karya -> Uji coba & presentasi pameran karya.`;
    case 'Problem Based Learning (PBL) / Problem Solving':
      return `Orientasi pada masalah nyata sekitar sekolah -> Pengorganisasian kelompok belajar -> Penyelidikan mandiri/kelompok terkait ${materi} -> Penyusunan solusi -> Evaluasi pemecahan masalah.`;
    case 'Game Based Learning':
      return `Pengenalan aturan misi permainan edukatif -> Tantangan babak bermain kolaboratif seputar ${materi} -> Pencatatan skor & refleksi strategi -> Penguatan konsep inti.`;
    case 'Station Learning':
      return `Orientasi rotasi pos belajar -> Eksplorasi Pos 1 (Visual/Teks), Pos 2 (Alat Peraga Konkret ${materi}), Pos 3 (Papan Interaktif Digital) -> Sintesis temuan kelompok.`;
  }
}

export function createFallbackRPM(data: RPMFormData): RPMDocument {
  const nuance = getFasePedagogicalNuance(data.fase);
  const count = Math.max(1, Math.min(8, data.jumlahPertemuan || 1));
  const models = syncPedagogicalModelsCount(data.praktikPedagogisPerPertemuan, count);
  const dimensiList = (data.dimensiProfilLulusan.length
    ? data.dimensiProfilLulusan
    : ['Penalaran Kritis', 'Kolaborasi']) as DimensiLulusan[];

  const praktikPedagogisItems = models.map((model, idx) => ({
    pertemuanKe: idx + 1,
    model,
    deskripsiSingkat: getModelSyntaxDescription(model, data.materiPelajaran),
  }));

  const pengalamanBelajar = models.map((model, idx) => {
    const pertemuanKe = idx + 1;
    const isFirst = pertemuanKe === 1;
    return {
      pertemuanKe,
      fokusPertemuan: isFirst
        ? `Eksplorasi Konsep Dasar & Pemahaman Kontekstual: ${data.materiPelajaran}`
        : `Pendalaman Aplikasi, Pemecahan Masalah & Karya Nyata: ${data.materiPelajaran} (Sesi ${pertemuanKe})`,
      modelPertemuan: model,
      memahami: {
        judul: 'Memahami',
        prinsip: 'Berkesadaran · Bermakna · Menggembirakan',
        aktivitas:
          `Guru mengawali dengan salam hangat, doa bersama, serta ice breaking ringan (Berkesadaran & Menggembirakan). ` +
          `Guru menyajikan pemantik visual melalui Papan Interaktif Digital berupa gambar/video pendek kehidupan sehari-hari yang dekat dengan dunia siswa ${data.kelas} tentang "${data.materiPelajaran}". ` +
          `Diferensiasi Konten: Siswa dengan kesiapan awal mengeksplorasi kartu gambar dan bacaan singkat berilustrasi, sementara siswa yang lebih mahir menelaah teks informasional singkat dan mencatat kata kunci utama (Bermakna).`,
      },
      mengaplikasi: {
        judul: 'Mengaplikasi',
        prinsip: 'Berkesadaran · Bermakna · Menggembirakan',
        aktivitas:
          `Menerapkan sintaks ${model}: ${getModelSyntaxDescription(model, data.materiPelajaran)} ` +
          `Secara berkelompok, peserta didik mengerjakan aktivitas LKPD Pertemuan ${pertemuanKe}, mempraktikkan literasi dan numerasi kontekstual (mencatat pengamatan, mengolah data/hitungan sederhana), dan bergiliran mengoperasikan simulasi sentuh pada Papan Interaktif Digital dengan bimbingan guru.`,
      },
      refleksi: {
        judul: 'Refleksi',
        prinsip: 'Berkesadaran · Bermakna · Menggembirakan',
        aktivitas:
          `Siswa menyampaikan temuan kelompok dan saling memberikan apresiasi positif (tepuk salut/bintang kelas). ` +
          `Guru memfasilitasi refleksi metakognisi ramah anak melalui "Kartu Perasaan & Pohon Pemahaman": (1) Apa hal baru paling menarik hari ini? (2) Bagian mana yang masih membingungkan? (3) Bagaimana menerapkan "${data.materiPelajaran}" di rumah? Guru memberikan umpan balik konstruktif dan penguatan karakter ${dimensiList.join(', ')}.`,
      },
    };
  });

  const aktivitasPerPertemuan = models.map((model, idx) => {
    const pertemuanKe = idx + 1;
    return {
      pertemuanKe,
      judulAktivitas:
        pertemuanKe === 1
          ? `Misi Eksplorasi & Pengamatan Dasar: ${data.materiPelajaran}`
          : `Tantangan Penerapan & Presentasi Solusi: ${data.materiPelajaran} (Sesi ${pertemuanKe})`,
      model,
      langkahPengerjaan: [
        `Bacalah kasus pemantik bersama anggota kelompokmu dengan teliti dan bagilah peran (ketua, pencatat, pengamat, penyaji).`,
        `Lakukan kegiatan eksplorasi sesuai alur ${model} menggunakan benda konkret di sekitar kelas atau simulasi pada Papan Interaktif Digital.`,
        `Catat hasil temuan, data angka/hitungan, dan kesimpulan singkat kelompok pada kotak Lembar Kerja di bawah ini.`,
        `Siapkan satu perwakilan kelompok untuk menyampaikan hasil karya di depan kelas secara percaya diri.`,
      ],
      tugasPengamatan:
        `Tuliskan 3 temuan penting kelompokmu terkait "${data.materiPelajaran}" beserta contoh nyata yang sering kamu jumpai di sekolah atau rumah, lalu gambarkan/petakan dalam bentuk tabel atau sketsa sederhana.`,
    };
  });

  const dimensiLabel = dimensiList
    .map((d) => `${d} (diwujudkan melalui pembiasaan sikap nyata selama diskusi, kerja kelompok, dan presentasi)`)
    .join('; ');

  return {
    identitas: {
      namaSatuanPendidikan: data.namaSatuanPendidikan,
      mataPelajaran: data.mataPelajaran,
      kelasSemester: `${data.kelas} / ${data.semester}`,
      durasiPertemuan: `${count} Pertemuan (${data.durasiPertemuan} / pertemuan)`,
    },
    identifikasi: {
      profilKesiapanSiswa: nuance.readiness,
      materiPelajaran: data.materiPelajaran,
      capaianDimensiLulusan: dimensiLabel,
    },
    desainPembelajaran: {
      capaianPembelajaran: data.capaianPembelajaran,
      lintasDisiplinIlmu: `Terintegrasi dengan Bahasa Indonesia (pemahaman teks & komunikasi lisan), Matematika (pengolahan data/hitungan sederhana), dan Pendidikan Pancasila (gotong royong & tanggung jawab dalam kelompok).`,
      tujuanPembelajaran: data.tujuanPembelajaran,
      topikPembelajaran: `${data.materiPelajaran} — Kontekstual Kehidupan Sehari-hari Siswa ${data.kelas}`,
      praktikPedagogisPerPertemuan: praktikPedagogisItems,
      integrasiLiterasiNumerasi: `Literasi: ${nuance.literacyFocus} Numerasi: ${nuance.numeracyFocus}`,
      kemitraanPembelajaran: `Kolaborasi antara Guru Kelas/Mapel, orang tua/wali murid (pendampingan pengamatan lanjutan di rumah), serta rekan sejawat/perpustakaan sekolah sebagai sumber belajar pendukung.`,
      lingkunganPembelajaran: `Penataan ruang kelas fleksibel (meja berkelompok yang ramah diskusi), sudut baca literasi kelas, alat peraga konkret yang aman bagi anak SD/MI, serta iklim kelas yang inklusif, hangat, dan bebas perundungan.`,
      pemanfaatanDigitalTools: `Papan Interaktif Digital (Interactive Flat Panel): ${nuance.boardActivity} Didukung presentasi visual interaktif dan kuis gamifikasi kelas yang ramah anak.`,
    },
    pengalamanBelajar,
    asesmen: {
      asesmenAwal: `Diagnostik Non-Kognitif & Kognitif Awal: Tanya jawab bergambar ("Tebak Gambar Pemantik") dan kartu emoji kesiapan belajar untuk memetakan pemahaman awal siswa tentang ${data.materiPelajaran}.`,
      asesmenProses: `Asesmen Formatif Berkelanjutan: Lembar observasi keaktifan kolaborasi, ketepatan langkah dalam ${models.join(' & ')}, serta penilaian proses pengisian LKPD dan partisipasi pada Papan Interaktif Digital.`,
      asesmenAkhir: `Asesmen Sumatif & Unjuk Kerja: Penilaian produk hasil kerja kelompok, presentasi lisan sederhana, serta 3–5 soal evaluasi kontekstual berbasis literasi-numerasi di akhir rangkaian pertemuan.`,
    },
    lkpd: {
      judulLKPD: `Lembar Kerja Peserta Didik (LKPD): ${data.materiPelajaran}`,
      mataPelajaran: data.mataPelajaran,
      kelasSemester: `${data.kelas} / ${data.semester}`,
      tujuanAktivitas: `Membimbing peserta didik ${data.kelas} untuk memahami, menyelidiki, dan menerapkan konsep ${data.materiPelajaran} melalui kolaborasi kelompok yang bermakna dan menyenangkan.`,
      petunjukUmum: [
        'Berdoalah sebelum memulai kegiatan belajar.',
        'Tuliskan nama kelompok dan nama lengkap seluruh anggota pada kolom identitas.',
        'Bacalah setiap langkah aktivitas dengan saksama bersama teman sekelompokmu.',
        'Berdiskusilah dengan sopan, saling menghargai pendapat, dan mintalah bantuan guru bila menemui kesulitan.',
      ],
      kasusNyataStimulus: `Bayangkan di sekolah kita (${data.namaSatuanPendidikan}), teman-teman sedang menghadapi tantangan nyata terkait "${data.materiPelajaran}". Bagaimana cara kelompokmu mengamati masalah tersebut, mengumpulkan bukti atau data sederhana, dan menemukan solusi paling bermanfaat bagi warga sekolah?`,
      aktivitasPerPertemuan,
      pertanyaanRefleksiHOTS: [
        `Mengapa pemahaman tentang "${data.materiPelajaran}" sangat penting bagi kehidupan kita sehari-hari di sekolah maupun di rumah? Berikan contoh nyatanya!`,
        `Jika terjadi masalah yang berkaitan dengan "${data.materiPelajaran}" di sekitarmu, langkah kreatif apa yang akan kamu lakukan pertama kali untuk menyelesaikannya?`,
        `Bagaimana pengalamanmu bekerja sama dengan teman kelompok hari ini, dan nilai baik apa yang paling kamu banggakan?`,
      ],
      rubrikPenilaian: [
        {
          aspek: 'Pemahaman Konsep & Ketepatan Isi',
          sangatBaik: 'Menjelaskan seluruh konsep dengan sangat tepat, lengkap, dan memberi contoh nyata secara mandiri.',
          baik: 'Menjelaskan sebagian besar konsep dengan tepat disertai contoh sederhana.',
          cukup: 'Menjelaskan konsep dasar secara umum namun masih terdapat beberapa kekeliruan kecil.',
          perluBimbingan: 'Belum mampu menjelaskan konsep inti dan masih memerlukan bimbingan penuh dari guru.',
        },
        {
          aspek: 'Penerapan Literasi & Numerasi',
          sangatBaik: 'Membaca/menulis informasi dan mengolah data/hitungan dengan sangat teliti dan rapi.',
          baik: 'Mampu membaca informasi dan menyelesaikan hitungan/data dengan sedikit bantuan.',
          cukup: 'Mulai memahami informasi bacaan/angka namun masih kurang teliti dalam pencatatan.',
          perluBimbingan: 'Memerlukan pendampingan khusus dalam memahami teks maupun mengolah data sederhana.',
        },
        {
          aspek: `Penguatan Karakter (${dimensiList[0] ?? 'Kolaborasi'})`,
          sangatBaik: 'Sangat aktif bekerja sama, menghargai teman, bertanggung jawab, dan menjadi teladan kelompok.',
          baik: 'Aktif bekerja sama dan menjalankan tugas kelompok dengan baik.',
          cukup: 'Terlibat dalam kelompok namun sesekali perlu diingatkan untuk berpartisipasi.',
          perluBimbingan: 'Cenderung pasif atau enggan bekerja sama sehingga perlu motivasi khusus dari guru.',
        },
        {
          aspek: 'Komunikasi & Presentasi Karya',
          sangatBaik: 'Menyampaikan hasil diskusi dengan suara jelas, percaya diri, runtut, dan menjawab pertanyaan dengan tepat.',
          baik: 'Menyampaikan hasil diskusi dengan cukup jelas dan percaya diri.',
          cukup: 'Menyampaikan hasil dengan suara pelan atau membaca teks sepenuhnya.',
          perluBimbingan: 'Belum berani tampil berbicara di depan kelas dan perlu dibimbing kalimat per kalimat.',
        },
      ],
      pedomanPenskoran:
        'Skor Maksimal = 16 (4 aspek × skor tertinggi 4). Nilai Akhir = (Jumlah Skor Perolehan / 16) × 100. Predikat: Sangat Baik (86–100), Baik (71–85), Cukup (56–70), Perlu Bimbingan (<56).',
    },
    metadata: {
      source: 'fallback',
      generatedAt: new Date().toISOString(),
    },
  };
}

export { DIMENSI_PROFIL_LULUSAN, PEDAGOGICAL_MODELS };
