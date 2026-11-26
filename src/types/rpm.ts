export type SDPhase = 'Fase A' | 'Fase B' | 'Fase C';

export type PedagogicalModel =
  | 'Inkuiri-Discovery Learning'
  | 'Project Based Learning (PjBL)'
  | 'Problem Based Learning (PBL) / Problem Solving'
  | 'Game Based Learning'
  | 'Station Learning';

export type DimensiLulusan =
  | 'Keimanan & Ketakwaan'
  | 'Kewargaan'
  | 'Penalaran Kritis'
  | 'Kreativitas'
  | 'Kolaborasi'
  | 'Kemandirian'
  | 'Kesehatan'
  | 'Komunikasi';

export interface RPMFormData {
  namaSatuanPendidikan: string;
  namaGuru: string;
  nipGuru: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  kotaPenetapan: string;
  tanggalPenetapan: string;
  fase: SDPhase;
  kelas: string;
  semester: 'Semester Ganjil (1)' | 'Semester Genap (2)';
  mataPelajaran: string;
  capaianPembelajaran: string;
  tujuanPembelajaran: string;
  materiPelajaran: string;
  jumlahPertemuan: number;
  durasiPertemuan: string;
  praktikPedagogisPerPertemuan: PedagogicalModel[];
  dimensiProfilLulusan: DimensiLulusan[];
  includeLKPD: boolean;
}

export interface PertemuanPedagogisItem {
  pertemuanKe: number;
  model: string;
  deskripsiSingkat: string;
}

export interface PengalamanBelajarPertemuan {
  pertemuanKe: number;
  fokusPertemuan: string;
  modelPertemuan: string;
  memahami: {
    judul: string;
    prinsip: string;
    aktivitas: string;
  };
  mengaplikasi: {
    judul: string;
    prinsip: string;
    aktivitas: string;
  };
  refleksi: {
    judul: string;
    prinsip: string;
    aktivitas: string;
  };
}

export interface LKPDPertemuanActivity {
  pertemuanKe: number;
  judulAktivitas: string;
  model: string;
  langkahPengerjaan: string[];
  tugasPengamatan: string;
}

export interface RubrikKriteriaRow {
  aspek: string;
  sangatBaik: string;
  baik: string;
  cukup: string;
  perluBimbingan: string;
}

export interface RPMDocument {
  identitas: {
    namaSatuanPendidikan: string;
    mataPelajaran: string;
    kelasSemester: string;
    durasiPertemuan: string;
  };
  identifikasi: {
    profilKesiapanSiswa: string;
    materiPelajaran: string;
    capaianDimensiLulusan: string;
  };
  desainPembelajaran: {
    capaianPembelajaran: string;
    lintasDisiplinIlmu: string;
    tujuanPembelajaran: string;
    topikPembelajaran: string;
    praktikPedagogisPerPertemuan: PertemuanPedagogisItem[];
    integrasiLiterasiNumerasi: string;
    kemitraanPembelajaran: string;
    lingkunganPembelajaran: string;
    pemanfaatanDigitalTools: string;
  };
  pengalamanBelajar: PengalamanBelajarPertemuan[];
  asesmen: {
    asesmenAwal: string;
    asesmenProses: string;
    asesmenAkhir: string;
  };
  lkpd: {
    judulLKPD: string;
    mataPelajaran: string;
    kelasSemester: string;
    tujuanAktivitas: string;
    petunjukUmum: string[];
    kasusNyataStimulus: string;
    aktivitasPerPertemuan: LKPDPertemuanActivity[];
    pertanyaanRefleksiHOTS: string[];
    rubrikPenilaian: RubrikKriteriaRow[];
    pedomanPenskoran: string;
  };
  metadata?: {
    source: 'gemini' | 'fallback';
    model?: string;
    generatedAt: string;
  };
}

export const DEFAULT_GURU_PHOTO = '/src/assets/images/guru_gesma_portrait_1795053831029.jpg';

const SVG_AVATAR_PRIA_ILUSTRASI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="24" fill="#1e3a8a"/>
    <circle cx="60" cy="46" r="22" fill="#fed7aa"/>
    <path d="M36 42c2-15 14-24 26-24 14 0 23 9 23 23-6-6-15-9-26-9-9 0-17 3-23 10z" fill="#1e293b"/>
    <circle cx="52" cy="46" r="2.8" fill="#0f172a"/>
    <circle cx="68" cy="46" r="2.8" fill="#0f172a"/>
    <path d="M52 55c4 4 12 4 16 0" stroke="#9a3412" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M24 114c3-22 18-32 36-32s33 10 36 32z" fill="#10b981"/>
    <path d="M48 82l12 16 12-16z" fill="#facc15"/>
  </svg>`);

const SVG_AVATAR_WANITA_ILUSTRASI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="24" fill="#0f766e"/>
    <path d="M32 58c0-20 12-36 28-36s28 16 28 36v26H32z" fill="#f59e0b"/>
    <circle cx="60" cy="48" r="20" fill="#fde68a"/>
    <circle cx="53" cy="47" r="2.6" fill="#0f172a"/>
    <circle cx="67" cy="47" r="2.6" fill="#0f172a"/>
    <path d="M53 56c4 4 10 4 14 0" stroke="#9a3412" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M22 114c4-21 19-31 38-31s34 10 38 31z" fill="#2563eb"/>
    <circle cx="60" cy="96" r="5" fill="#facc15"/>
  </svg>`);

export interface AvatarPreset {
  id: string;
  label: string;
  category: 'Pria' | 'Wanita' | 'Ilustrasi';
  url: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'pria-1',
    label: 'Guru Senior Batik',
    category: 'Pria',
    url: '/src/assets/images/avatar_guru_pria_1_1795053830243.jpg',
  },
  {
    id: 'wanita-1',
    label: 'Ibu Guru Hijab',
    category: 'Wanita',
    url: '/src/assets/images/avatar_guru_wanita_1_1795053830689.jpg',
  },
  {
    id: 'pria-2',
    label: 'Pak Guru PGRI',
    category: 'Pria',
    url: '/src/assets/images/avatar_guru_pria_2_1795053830870.jpg',
  },
  {
    id: 'wanita-2',
    label: 'Ibu Guru Batik',
    category: 'Wanita',
    url: '/src/assets/images/avatar_guru_wanita_2_1795053830491.jpg',
  },
  {
    id: 'ilustrasi-1',
    label: 'Ilustrasi Pak Guru',
    category: 'Ilustrasi',
    url: SVG_AVATAR_PRIA_ILUSTRASI,
  },
  {
    id: 'ilustrasi-2',
    label: 'Ilustrasi Ibu Guru',
    category: 'Ilustrasi',
    url: SVG_AVATAR_WANITA_ILUSTRASI,
  },
];

export const PHASE_CONFIG: Record<
  SDPhase,
  {
    label: string;
    sublabel: string;
    classes: string[];
    defaultClass: string;
  }
> = {
  'Fase A': {
    label: 'Fase A (SD/MI)',
    sublabel: 'Kelas I & II (Usia 6–8 Th)',
    classes: ['Kelas I (Fase A)', 'Kelas II (Fase A)'],
    defaultClass: 'Kelas I (Fase A)',
  },
  'Fase B': {
    label: 'Fase B (SD/MI)',
    sublabel: 'Kelas III & IV (Usia 8–10 Th)',
    classes: ['Kelas III (Fase B)', 'Kelas IV (Fase B)'],
    defaultClass: 'Kelas IV (Fase B)',
  },
  'Fase C': {
    label: 'Fase C (SD/MI)',
    sublabel: 'Kelas V & VI (Usia 10–12 Th)',
    classes: ['Kelas V (Fase C)', 'Kelas VI (Fase C)'],
    defaultClass: 'Kelas V (Fase C)',
  },
};

export const PEDAGOGICAL_MODELS: PedagogicalModel[] = [
  'Inkuiri-Discovery Learning',
  'Project Based Learning (PjBL)',
  'Problem Based Learning (PBL) / Problem Solving',
  'Game Based Learning',
  'Station Learning',
];

export const DIMENSI_PROFIL_LULUSAN: DimensiLulusan[] = [
  'Keimanan & Ketakwaan',
  'Kewargaan',
  'Penalaran Kritis',
  'Kreativitas',
  'Kolaborasi',
  'Kemandirian',
  'Kesehatan',
  'Komunikasi',
];

export interface SDPresetItem {
  id: string;
  title: string;
  badge: string;
  fase: SDPhase;
  kelas: string;
  semester: 'Semester Ganjil (1)' | 'Semester Genap (2)';
  mataPelajaran: string;
  materiPelajaran: string;
  durasiPertemuan: string;
  jumlahPertemuan: number;
  praktikPedagogisPerPertemuan: PedagogicalModel[];
  capaianPembelajaran: string;
  tujuanPembelajaran: string;
  dimensiProfilLulusan: DimensiLulusan[];
}

export const SD_INSTANT_PRESETS: SDPresetItem[] = [
  {
    id: 'sd-fase-a-bindo',
    title: 'SD Fase A (Bahasa Indonesia)',
    badge: 'Kelas I • Fase A',
    fase: 'Fase A',
    kelas: 'Kelas I (Fase A)',
    semester: 'Semester Ganjil (1)',
    mataPelajaran: 'Bahasa Indonesia',
    materiPelajaran: 'Membaca Nyaring & Mengenal Suku Kata Cerita Bergambar',
    durasiPertemuan: '2 × 35 menit',
    jumlahPertemuan: 2,
    praktikPedagogisPerPertemuan: ['Game Based Learning', 'Station Learning'],
    capaianPembelajaran:
      'Peserta didik mampu bersikap menjadi pembaca dan pemirsa yang menunjukkan minat terhadap teks cerita bergambar yang dibaca atau dipirsa, serta mampu membaca kata-kata yang dikenali sehari-hari dengan fasih melalui pelafalan suku kata.',
    tujuanPembelajaran:
      '1. Peserta didik mampu mengidentifikasi bunyi dan merangkai suku kata berawalan huruf konsonan vokal (ba-bi-bu-be-bo, ca-ci-cu-ce-co) pada cerita bergambar.\n2. Peserta didik mampu membaca nyaring kalimat sederhana dengan intonasi tepat dan menceritakan kembali tokoh serta isi cerita secara lisan.',
    dimensiProfilLulusan: ['Komunikasi', 'Kreativitas', 'Kemandirian'],
  },
  {
    id: 'sd-fase-b-ipas',
    title: 'SD Fase B (IPAS)',
    badge: 'Kelas IV • Fase B',
    fase: 'Fase B',
    kelas: 'Kelas IV (Fase B)',
    semester: 'Semester Ganjil (1)',
    mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
    materiPelajaran: 'Wujud Zat dan Perubahan Wujud Benda dalam Kehidupan Sehari-hari',
    durasiPertemuan: '2 × 35 menit',
    jumlahPertemuan: 2,
    praktikPedagogisPerPertemuan: ['Game Based Learning', 'Inkuiri-Discovery Learning'],
    capaianPembelajaran:
      'Peserta didik mengidentifikasi proses perubahan wujud zat dan perubahan bentuk energi dalam kehidupan sehari-hari melalui pengamatan dan penyelidikan sederhana berbasis benda konkret di lingkungan sekitar.',
    tujuanPembelajaran:
      '1. Peserta didik mampu membedakan karakteristik zat padat, cair, dan gas melalui percobaan benda konkret.\n2. Peserta didik mampu menganalisis peristiwa mencair, membeku, menguap, dan mengembun serta menyajikan hasil pengamatan dalam tabel sederhana.',
    dimensiProfilLulusan: ['Penalaran Kritis', 'Kolaborasi', 'Kreativitas'],
  },
  {
    id: 'sd-fase-c-matematika',
    title: 'SD Fase C (Matematika)',
    badge: 'Kelas V • Fase C',
    fase: 'Fase C',
    kelas: 'Kelas V (Fase C)',
    semester: 'Semester Genap (2)',
    mataPelajaran: 'Matematika',
    materiPelajaran: 'Pecahan, Persentase, dan Penyajian Data Diagram Batang Sederhana',
    durasiPertemuan: '2 × 35 menit',
    jumlahPertemuan: 2,
    praktikPedagogisPerPertemuan: [
      'Problem Based Learning (PBL) / Problem Solving',
      'Project Based Learning (PjBL)',
    ],
    capaianPembelajaran:
      'Peserta didik dapat membandingkan dan mengurutkan berbagai pecahan termasuk pecahan campuran, melakukan operasi hitung penjumlahan dan pengurangan pecahan, mengubah pecahan ke bentuk persen, serta mengumpulkan dan menyajikan data dalam bentuk tabel dan diagram batang.',
    tujuanPembelajaran:
      '1. Peserta didik mampu memecahkan masalah kontekstual sehari-hari yang melibatkan perbandingan pecahan dan persentase.\n2. Peserta didik mampu mengolah data hasil survei kelas dan menyajikannya ke dalam diagram batang secara akurat.',
    dimensiProfilLulusan: ['Penalaran Kritis', 'Kolaborasi', 'Komunikasi'],
  },
  {
    id: 'mi-fase-c-pancasila',
    title: 'MI/SD Fase C (Pendidikan Pancasila)',
    badge: 'Kelas VI • Fase C',
    fase: 'Fase C',
    kelas: 'Kelas VI (Fase C)',
    semester: 'Semester Ganjil (1)',
    mataPelajaran: 'Pendidikan Pancasila',
    materiPelajaran: 'Musyawarah, Gotong Royong, dan Penerapan Nilai Pancasila di Lingkungan Sekolah',
    durasiPertemuan: '2 × 35 menit',
    jumlahPertemuan: 2,
    praktikPedagogisPerPertemuan: ['Inkuiri-Discovery Learning', 'Project Based Learning (PjBL)'],
    capaianPembelajaran:
      'Peserta didik mampu menganalisis kronologi lahirnya Pancasila, mengimplementasikan nilai-nilai Pancasila dalam kehidupan bermasyarakat, serta mempraktikkan musyawarah untuk mufakat dan gotong royong sebagai wujud pengamalan sila keempat dan kelima.',
    tujuanPembelajaran:
      '1. Peserta didik mampu menjelaskan makna musyawarah mufakat dan menghargai perbedaan pendapat di lingkungan sekolah.\n2. Peserta didik mampu merancang dan melaksanakan proyek aksi gotong royong kelas sebagai penerapan nilai Pancasila.',
    dimensiProfilLulusan: ['Keimanan & Ketakwaan', 'Kewargaan', 'Kolaborasi'],
  },
];

export function createInitialFormData(): RPMFormData {
  const today = new Date().toISOString().split('T')[0];
  return {
    namaSatuanPendidikan: 'UPT SD Negeri 2 Makale Selatan',
    namaGuru: 'Gesma Gama, S.Pd.',
    nipGuru: '19880517 201903 1 004',
    namaKepalaSekolah: 'Alfeus Mardan Kadang, S.Pd.',
    nipKepalaSekolah: '19720812 199803 1 009',
    kotaPenetapan: 'Makale Selatan',
    tanggalPenetapan: today,
    fase: 'Fase B',
    kelas: 'Kelas IV (Fase B)',
    semester: 'Semester Ganjil (1)',
    mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
    capaianPembelajaran: SD_INSTANT_PRESETS[1].capaianPembelajaran,
    tujuanPembelajaran: SD_INSTANT_PRESETS[1].tujuanPembelajaran,
    materiPelajaran: SD_INSTANT_PRESETS[1].materiPelajaran,
    jumlahPertemuan: 2,
    durasiPertemuan: '2 × 35 menit',
    praktikPedagogisPerPertemuan: ['Game Based Learning', 'Inkuiri-Discovery Learning'],
    dimensiProfilLulusan: ['Penalaran Kritis', 'Kolaborasi', 'Kreativitas'],
    includeLKPD: true,
  };
}
