import type { RPMDocument, RPMFormData } from '../types/rpm';
import { formatIndonesianDate } from './rpmLogic';

function escapeHtml(text: string): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br/>');
}

export function buildExportHtml(
  rpm: RPMDocument,
  formData: RPMFormData,
  includeLKPD: boolean
): string {
  const thStyle =
    'background:#1e3a8a;color:#ffffff;font-weight:bold;padding:6px 8px;border:1px solid #334155;text-align:left;font-size:10.5pt;font-family:"Times New Roman",serif;';
  const tdLabelStyle =
    'width:28%;background:#f8fafc;font-weight:bold;padding:6px 8px;border:1px solid #475569;vertical-align:top;font-size:10.5pt;font-family:"Times New Roman",serif;';
  const tdValStyle =
    'width:72%;padding:6px 8px;border:1px solid #475569;vertical-align:top;font-size:10.5pt;font-family:"Times New Roman",serif;';
  const tableStyle =
    'width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:14px;page-break-inside:avoid;font-family:"Times New Roman",serif;font-size:10.5pt;';

  const pedagogisSubTable = `
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;margin-top:4px;font-size:10pt;">
      <thead>
        <tr>
          <th style="width:18%;background:#ecfdf5;border:1px solid #64748b;padding:4px 6px;text-align:left;">Pertemuan</th>
          <th style="width:32%;background:#ecfdf5;border:1px solid #64748b;padding:4px 6px;text-align:left;">Model Pedagogis</th>
          <th style="width:50%;background:#ecfdf5;border:1px solid #64748b;padding:4px 6px;text-align:left;">Alur Sintaks</th>
        </tr>
      </thead>
      <tbody>
        ${rpm.desainPembelajaran.praktikPedagogisPerPertemuan
          .map(
            (item) => `
          <tr>
            <td style="border:1px solid #64748b;padding:4px 6px;vertical-align:top;">Pertemuan ${item.pertemuanKe}</td>
            <td style="border:1px solid #64748b;padding:4px 6px;vertical-align:top;font-weight:bold;">${escapeHtml(item.model)}</td>
            <td style="border:1px solid #64748b;padding:4px 6px;vertical-align:top;">${escapeHtml(item.deskripsiSingkat)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  const pengalamanHtml = rpm.pengalamanBelajar
    .map(
      (p) => `
      <table style="${tableStyle}">
        <thead>
          <tr>
            <th colspan="2" style="background:#92400e;color:#ffffff;padding:6px 8px;border:1px solid #334155;text-align:left;font-size:10.5pt;">
              Pertemuan Ke-${p.pertemuanKe}: ${escapeHtml(p.fokusPertemuan)} (${escapeHtml(p.modelPertemuan)})
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="${tdLabelStyle}background:#eff6ff;">
              1. ${escapeHtml(p.memahami.judul)}<br/>
              <span style="font-weight:normal;font-size:9.5pt;color:#1d4ed8;">(${escapeHtml(p.memahami.prinsip)})</span>
            </td>
            <td style="${tdValStyle}">${escapeHtml(p.memahami.aktivitas)}</td>
          </tr>
          <tr>
            <td style="${tdLabelStyle}background:#ecfdf5;">
              2. ${escapeHtml(p.mengaplikasi.judul)}<br/>
              <span style="font-weight:normal;font-size:9.5pt;color:#047857;">(${escapeHtml(p.mengaplikasi.prinsip)})</span>
            </td>
            <td style="${tdValStyle}">${escapeHtml(p.mengaplikasi.aktivitas)}</td>
          </tr>
          <tr>
            <td style="${tdLabelStyle}background:#fefce8;">
              3. ${escapeHtml(p.refleksi.judul)}<br/>
              <span style="font-weight:normal;font-size:9.5pt;color:#a16207;">(${escapeHtml(p.refleksi.prinsip)})</span>
            </td>
            <td style="${tdValStyle}">${escapeHtml(p.refleksi.aktivitas)}</td>
          </tr>
        </tbody>
      </table>
    `
    )
    .join('');

  const lkpdSectionHtml = includeLKPD
    ? `
      <div style="page-break-before:always;margin-top:20px;">
        <h2 style="text-align:center;font-size:13pt;font-weight:bold;margin:0 0 4px 0;font-family:'Times New Roman',serif;">
          6. LEMBAR KERJA PESERTA DIDIK (LKPD) &amp; RUBRIK PENILAIAN
        </h2>
        <p style="text-align:center;font-size:10.5pt;margin:0 0 12px 0;font-family:'Times New Roman',serif;">
          ${escapeHtml(rpm.lkpd.judulLKPD)} • ${escapeHtml(rpm.lkpd.mataPelajaran)} (${escapeHtml(rpm.lkpd.kelasSemester)})
        </p>

        <table style="${tableStyle}">
          <tbody>
            <tr>
              <td style="${tdLabelStyle}">Kelompok / Kelas</td>
              <td style="${tdValStyle}">....................................................... / ${escapeHtml(formData.kelas)}</td>
            </tr>
            <tr>
              <td style="${tdLabelStyle}">Nama Anggota (1–4)</td>
              <td style="${tdValStyle}">
                1. .......................................... &nbsp;&nbsp; 2. ..........................................<br/>
                3. .......................................... &nbsp;&nbsp; 4. ..........................................
              </td>
            </tr>
            <tr>
              <td style="${tdLabelStyle}">Tujuan Aktivitas</td>
              <td style="${tdValStyle}">${escapeHtml(rpm.lkpd.tujuanAktivitas)}</td>
            </tr>
            <tr>
              <td style="${tdLabelStyle}">Petunjuk Umum</td>
              <td style="${tdValStyle}">
                <ol style="margin:0;padding-left:18px;">
                  ${rpm.lkpd.petunjukUmum.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                </ol>
              </td>
            </tr>
            <tr>
              <td style="${tdLabelStyle}">Kasus Nyata / Stimulus Masalah</td>
              <td style="${tdValStyle}">${escapeHtml(rpm.lkpd.kasusNyataStimulus)}</td>
            </tr>
          </tbody>
        </table>

        ${rpm.lkpd.aktivitasPerPertemuan
          .map(
            (act) => `
          <table style="${tableStyle}">
            <thead>
              <tr>
                <th colspan="2" style="background:#c2410c;color:#ffffff;padding:6px 8px;border:1px solid #334155;text-align:left;">
                  Aktivitas Pertemuan ${act.pertemuanKe}: ${escapeHtml(act.judulAktivitas)} (${escapeHtml(act.model)})
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="${tdLabelStyle}">Langkah Pengerjaan Siswa</td>
                <td style="${tdValStyle}">
                  <ol style="margin:0;padding-left:18px;">
                    ${act.langkahPengerjaan.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
                  </ol>
                </td>
              </tr>
              <tr>
                <td style="${tdLabelStyle}">Lembar Kerja / Tugas Pengamatan</td>
                <td style="${tdValStyle}">
                  ${escapeHtml(act.tugasPengamatan)}
                  <div style="height:64px;border:1px dashed #94a3b8;margin-top:8px;"></div>
                </td>
              </tr>
            </tbody>
          </table>
        `
          )
          .join('')}

        <table style="${tableStyle}">
          <thead>
            <tr>
              <th colspan="2" style="${thStyle}">Pertanyaan Refleksi &amp; Kesimpulan Kelompok (HOTS)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="${tdLabelStyle}">Pertanyaan Diskusi</td>
              <td style="${tdValStyle}">
                <ol style="margin:0;padding-left:18px;">
                  ${rpm.lkpd.pertanyaanRefleksiHOTS.map((q) => `<li>${escapeHtml(q)}</li>`).join('')}
                </ol>
              </td>
            </tr>
          </tbody>
        </table>

        <table style="width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:12px;page-break-inside:avoid;font-family:'Times New Roman',serif;font-size:10pt;">
          <thead>
            <tr>
              <th style="width:20%;background:#1e293b;color:#fff;padding:6px;border:1px solid #334155;text-align:left;">Aspek &amp; Kriteria</th>
              <th style="width:20%;background:#1d4ed8;color:#fff;padding:6px;border:1px solid #334155;text-align:left;">Sangat Baik (4: 86–100)</th>
              <th style="width:20%;background:#047857;color:#fff;padding:6px;border:1px solid #334155;text-align:left;">Baik (3: 71–85)</th>
              <th style="width:20%;background:#b45309;color:#fff;padding:6px;border:1px solid #334155;text-align:left;">Cukup (2: 56–70)</th>
              <th style="width:20%;background:#c2410c;color:#fff;padding:6px;border:1px solid #334155;text-align:left;">Perlu Bimbingan (1: &lt;56)</th>
            </tr>
          </thead>
          <tbody>
            ${rpm.lkpd.rubrikPenilaian
              .map(
                (row) => `
              <tr>
                <td style="border:1px solid #475569;padding:6px;font-weight:bold;vertical-align:top;">${escapeHtml(row.aspek)}</td>
                <td style="border:1px solid #475569;padding:6px;vertical-align:top;">${escapeHtml(row.sangatBaik)}</td>
                <td style="border:1px solid #475569;padding:6px;vertical-align:top;">${escapeHtml(row.baik)}</td>
                <td style="border:1px solid #475569;padding:6px;vertical-align:top;">${escapeHtml(row.cukup)}</td>
                <td style="border:1px solid #475569;padding:6px;vertical-align:top;">${escapeHtml(row.perluBimbingan)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <p style="font-size:10pt;font-family:'Times New Roman',serif;margin:4px 0 16px 0;">
          <strong>Pedoman Penskoran &amp; Predikat Nilai Akhir:</strong> ${escapeHtml(rpm.lkpd.pedomanPenskoran)}
        </p>
      </div>
    `
    : '';

  const signatureHtml = `
    <table style="width:100%;border-collapse:collapse;border:none;margin-top:24px;page-break-inside:avoid;font-family:'Times New Roman',serif;font-size:10.5pt;">
      <tr>
        <td style="width:50%;border:none;padding:8px;vertical-align:top;">
          Mengetahui,<br/>
          Kepala ${escapeHtml(formData.namaSatuanPendidikan)}<br/><br/><br/><br/>
          <strong><u>${escapeHtml(formData.namaKepalaSekolah)}</u></strong><br/>
          NIP. ${escapeHtml(formData.nipKepalaSekolah || '-')}
        </td>
        <td style="width:50%;border:none;padding:8px;vertical-align:top;padding-left:40px;">
          ${escapeHtml(formData.kotaPenetapan || 'Makale Selatan')}, ${escapeHtml(formatIndonesianDate(formData.tanggalPenetapan))}<br/>
          Guru Kelas / Mata Pelajaran<br/><br/><br/><br/>
          <strong><u>${escapeHtml(formData.namaGuru)}</u></strong><br/>
          NIP. ${escapeHtml(formData.nipGuru || '-')}
        </td>
      </tr>
    </table>
  `;

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>RPM ${escapeHtml(formData.mataPelajaran)} - ${escapeHtml(formData.namaSatuanPendidikan)}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 21cm 29.7cm;
            margin: 2cm 2cm 2cm 2.5cm;
          }
          body {
            font-family: "Times New Roman", serif;
            font-size: 10.5pt;
            color: #0f172a;
            line-height: 1.4;
          }
          table {
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div style="text-align:center;margin-bottom:14px;border-bottom:2px solid #0f172a;padding-bottom:8px;">
          <h1 style="font-size:14pt;font-weight:bold;margin:0;font-family:'Times New Roman',serif;">
            RENCANA PEMBELAJARAN MENDALAM (RPM)
          </h1>
          <div style="font-size:11.5pt;font-weight:bold;margin-top:2px;">${escapeHtml(rpm.identitas.namaSatuanPendidikan)}</div>
          <div style="font-size:9.5pt;color:#334155;margin-top:2px;">
            Kurikulum Merdeka &amp; Deep Learning • Literasi &amp; Numerasi Terintegrasi • Papan Interaktif Digital • Tahun Ajaran 2026/2027
          </div>
        </div>

        <h3 style="font-size:11pt;font-weight:bold;margin:8px 0 4px 0;color:#1d4ed8;">1. TABEL IDENTITAS</h3>
        <table style="${tableStyle}">
          <tbody>
            <tr><td style="${tdLabelStyle}">Nama Satuan Pendidikan</td><td style="${tdValStyle}">${escapeHtml(rpm.identitas.namaSatuanPendidikan)}</td></tr>
            <tr><td style="${tdLabelStyle}">Mata Pelajaran</td><td style="${tdValStyle}">${escapeHtml(rpm.identitas.mataPelajaran)}</td></tr>
            <tr><td style="${tdLabelStyle}">Kelas / Semester</td><td style="${tdValStyle}">${escapeHtml(rpm.identitas.kelasSemester)}</td></tr>
            <tr><td style="${tdLabelStyle}">Durasi Pertemuan</td><td style="${tdValStyle}">${escapeHtml(rpm.identitas.durasiPertemuan)}</td></tr>
          </tbody>
        </table>

        <h3 style="font-size:11pt;font-weight:bold;margin:8px 0 4px 0;color:#c2410c;">2. TABEL IDENTIFIKASI</h3>
        <table style="${tableStyle}">
          <tbody>
            <tr><td style="${tdLabelStyle}">Siswa (Profil &amp; Kesiapan)</td><td style="${tdValStyle}">${escapeHtml(rpm.identifikasi.profilKesiapanSiswa)}</td></tr>
            <tr><td style="${tdLabelStyle}">Materi Pelajaran</td><td style="${tdValStyle}">${escapeHtml(rpm.identifikasi.materiPelajaran)}</td></tr>
            <tr><td style="${tdLabelStyle}">Capaian Dimensi Lulusan</td><td style="${tdValStyle}">${escapeHtml(rpm.identifikasi.capaianDimensiLulusan)}</td></tr>
          </tbody>
        </table>

        <h3 style="font-size:11pt;font-weight:bold;margin:8px 0 4px 0;color:#047857;">3. TABEL DESAIN PEMBELAJARAN</h3>
        <table style="${tableStyle}">
          <tbody>
            <tr><td style="${tdLabelStyle}">1. Capaian Pembelajaran (CP)</td><td style="${tdValStyle}">${escapeHtml(rpm.desainPembelajaran.capaianPembelajaran)}</td></tr>
            <tr><td style="${tdLabelStyle}">2. Lintas Disiplin Ilmu</td><td style="${tdValStyle}">${escapeHtml(rpm.desainPembelajaran.lintasDisiplinIlmu)}</td></tr>
            <tr><td style="${tdLabelStyle}">3. Tujuan Pembelajaran (TP)</td><td style="${tdValStyle}">${escapeHtml(rpm.desainPembelajaran.tujuanPembelajaran)}</td></tr>
            <tr><td style="${tdLabelStyle}">4. Topik Pembelajaran</td><td style="${tdValStyle}">${escapeHtml(rpm.desainPembelajaran.topikPembelajaran)}</td></tr>
            <tr><td style="${tdLabelStyle}">5. Praktik Pedagogis per Pertemuan</td><td style="${tdValStyle}">${pedagogisSubTable}</td></tr>
            <tr><td style="${tdLabelStyle}">6. Integrasi Literasi &amp; Numerasi</td><td style="${tdValStyle}">${escapeHtml(rpm.desainPembelajaran.integrasiLiterasiNumerasi)}</td></tr>
            <tr><td style="${tdLabelStyle}">7. Kemitraan Pembelajaran</td><td style="${tdValStyle}">${escapeHtml(rpm.desainPembelajaran.kemitraanPembelajaran)}</td></tr>
            <tr><td style="${tdLabelStyle}">8. Lingkungan Pembelajaran</td><td style="${tdValStyle}">${escapeHtml(rpm.desainPembelajaran.lingkunganPembelajaran)}</td></tr>
            <tr><td style="${tdLabelStyle}">9. Pemanfaatan Digital Tools</td><td style="${tdValStyle}">${escapeHtml(rpm.desainPembelajaran.pemanfaatanDigitalTools)}</td></tr>
          </tbody>
        </table>

        <h3 style="font-size:11pt;font-weight:bold;margin:8px 0 4px 0;color:#a16207;">4. TABEL PENGALAMAN BELAJAR PER PERTEMUAN</h3>
        ${pengalamanHtml}

        <h3 style="font-size:11pt;font-weight:bold;margin:8px 0 4px 0;color:#1e293b;">5. TABEL ASESMEN PEMBELAJARAN</h3>
        <table style="${tableStyle}">
          <tbody>
            <tr><td style="${tdLabelStyle}">1. Asesmen Awal (Diagnostik)</td><td style="${tdValStyle}">${escapeHtml(rpm.asesmen.asesmenAwal)}</td></tr>
            <tr><td style="${tdLabelStyle}">2. Asesmen Proses (Formatif)</td><td style="${tdValStyle}">${escapeHtml(rpm.asesmen.asesmenProses)}</td></tr>
            <tr><td style="${tdLabelStyle}">3. Asesmen Akhir (Sumatif)</td><td style="${tdValStyle}">${escapeHtml(rpm.asesmen.asesmenAkhir)}</td></tr>
          </tbody>
        </table>

        ${lkpdSectionHtml}
        ${signatureHtml}
      </body>
    </html>
  `;
}

export async function copyRPMToClipboard(
  rpm: RPMDocument,
  formData: RPMFormData,
  includeLKPD: boolean
): Promise<void> {
  const html = buildExportHtml(rpm, formData, includeLKPD);
  const plainText = [
    `RENCANA PEMBELAJARAN MENDALAM (RPM) - ${rpm.identitas.namaSatuanPendidikan}`,
    `Mata Pelajaran: ${rpm.identitas.mataPelajaran}`,
    `Kelas / Semester: ${rpm.identitas.kelasSemester}`,
    `Durasi: ${rpm.identitas.durasiPertemuan}`,
    `CP: ${rpm.desainPembelajaran.capaianPembelajaran}`,
    `TP: ${rpm.desainPembelajaran.tujuanPembelajaran}`,
  ].join('\n');

  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([plainText], { type: 'text/plain' });
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      }),
    ]);
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(plainText);
  }
}

export function downloadRPMAsDoc(
  rpm: RPMDocument,
  formData: RPMFormData,
  includeLKPD: boolean
): void {
  const html = buildExportHtml(rpm, formData, includeLKPD);
  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const safeMapel = formData.mataPelajaran.replace(/[^a-zA-Z0-9]+/g, '_');
  const safeKelas = formData.kelas.replace(/[^a-zA-Z0-9]+/g, '_');
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `RPM_${safeMapel}_${safeKelas}.doc`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function buildLKPDExportHtml(
  rpm: RPMDocument,
  formData: RPMFormData
): string {
  const thStyle =
    'background:#c2410c;color:#ffffff;font-weight:bold;padding:6px 8px;border:1px solid #334155;text-align:left;font-size:10.5pt;font-family:"Times New Roman",serif;';
  const tdLabelStyle =
    'width:28%;background:#fff7ed;font-weight:bold;padding:6px 8px;border:1px solid #475569;vertical-align:top;font-size:10.5pt;font-family:"Times New Roman",serif;';
  const tdValStyle =
    'width:72%;padding:6px 8px;border:1px solid #475569;vertical-align:top;font-size:10.5pt;font-family:"Times New Roman",serif;';
  const tableStyle =
    'width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:14px;page-break-inside:avoid;font-family:"Times New Roman",serif;font-size:10.5pt;';

  const signatureHtml = `
    <table style="width:100%;border-collapse:collapse;border:none;margin-top:24px;page-break-inside:avoid;font-family:'Times New Roman',serif;font-size:10.5pt;">
      <tr>
        <td style="width:50%;border:none;padding:8px;vertical-align:top;">
          Mengetahui,<br/>
          Kepala ${escapeHtml(formData.namaSatuanPendidikan)}<br/><br/><br/><br/>
          <strong><u>${escapeHtml(formData.namaKepalaSekolah)}</u></strong><br/>
          NIP. ${escapeHtml(formData.nipKepalaSekolah || '-')}
        </td>
        <td style="width:50%;border:none;padding:8px;vertical-align:top;padding-left:40px;">
          ${escapeHtml(formData.kotaPenetapan || 'Makale Selatan')}, ${escapeHtml(formatIndonesianDate(formData.tanggalPenetapan))}<br/>
          Guru Kelas / Mata Pelajaran<br/><br/><br/><br/>
          <strong><u>${escapeHtml(formData.namaGuru)}</u></strong><br/>
          NIP. ${escapeHtml(formData.nipGuru || '-')}
        </td>
      </tr>
    </table>
  `;

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>LKPD ${escapeHtml(formData.mataPelajaran)} - ${escapeHtml(formData.namaSatuanPendidikan)}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 21cm 29.7cm;
            margin: 2cm 2cm 2cm 2.5cm;
          }
          body {
            font-family: "Times New Roman", serif;
            font-size: 10.5pt;
            color: #0f172a;
            line-height: 1.4;
          }
          table {
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div style="text-align:center;margin-bottom:14px;border-bottom:2px solid #0f172a;padding-bottom:8px;">
          <h1 style="font-size:14pt;font-weight:bold;margin:0;font-family:'Times New Roman',serif;">
            LEMBAR KERJA PESERTA DIDIK (LKPD)
          </h1>
          <div style="font-size:11.5pt;font-weight:bold;margin-top:2px;">${escapeHtml(rpm.identitas.namaSatuanPendidikan)}</div>
          <div style="font-size:10.5pt;font-weight:bold;margin-top:2px;">${escapeHtml(rpm.lkpd.judulLKPD)}</div>
          <div style="font-size:9.5pt;color:#334155;margin-top:2px;">
            ${escapeHtml(rpm.lkpd.mataPelajaran)} • ${escapeHtml(rpm.lkpd.kelasSemester)} • Tahun Ajaran 2026/2027
          </div>
        </div>

        <table style="${tableStyle}">
          <tbody>
            <tr>
              <td style="${tdLabelStyle}">Kelompok / Kelas</td>
              <td style="${tdValStyle}">....................................................... / ${escapeHtml(formData.kelas)}</td>
            </tr>
            <tr>
              <td style="${tdLabelStyle}">Nama Anggota (1–4)</td>
              <td style="${tdValStyle}">
                1. .......................................... &nbsp;&nbsp; 2. ..........................................<br/>
                3. .......................................... &nbsp;&nbsp; 4. ..........................................
              </td>
            </tr>
            <tr>
              <td style="${tdLabelStyle}">Tujuan Aktivitas</td>
              <td style="${tdValStyle}">${escapeHtml(rpm.lkpd.tujuanAktivitas)}</td>
            </tr>
            <tr>
              <td style="${tdLabelStyle}">Petunjuk Umum</td>
              <td style="${tdValStyle}">
                <ol style="margin:0;padding-left:18px;">
                  ${rpm.lkpd.petunjukUmum.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                </ol>
              </td>
            </tr>
            <tr>
              <td style="${tdLabelStyle}">Kasus Nyata / Stimulus Masalah</td>
              <td style="${tdValStyle}">${escapeHtml(rpm.lkpd.kasusNyataStimulus)}</td>
            </tr>
          </tbody>
        </table>

        ${rpm.lkpd.aktivitasPerPertemuan
          .map(
            (act) => `
          <table style="${tableStyle}">
            <thead>
              <tr>
                <th colspan="2" style="${thStyle}">
                  Aktivitas Pertemuan ${act.pertemuanKe}: ${escapeHtml(act.judulAktivitas)} (${escapeHtml(act.model)})
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="${tdLabelStyle}">Langkah Pengerjaan Siswa</td>
                <td style="${tdValStyle}">
                  <ol style="margin:0;padding-left:18px;">
                    ${act.langkahPengerjaan.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
                  </ol>
                </td>
              </tr>
              <tr>
                <td style="${tdLabelStyle}">Lembar Kerja / Tugas Pengamatan</td>
                <td style="${tdValStyle}">
                  ${escapeHtml(act.tugasPengamatan)}
                  <div style="height:76px;border:1px dashed #94a3b8;margin-top:8px;"></div>
                </td>
              </tr>
            </tbody>
          </table>
        `
          )
          .join('')}

        <table style="${tableStyle}">
          <thead>
            <tr>
              <th colspan="2" style="background:#b45309;color:#ffffff;font-weight:bold;padding:6px 8px;border:1px solid #334155;text-align:left;font-size:10.5pt;">
                Pertanyaan Refleksi &amp; Kesimpulan Kelompok (HOTS)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="${tdLabelStyle}">Pertanyaan Diskusi</td>
              <td style="${tdValStyle}">
                <ol style="margin:0;padding-left:18px;">
                  ${rpm.lkpd.pertanyaanRefleksiHOTS.map((q) => `<li>${escapeHtml(q)}</li>`).join('')}
                </ol>
              </td>
            </tr>
          </tbody>
        </table>

        <h3 style="font-size:11pt;font-weight:bold;margin:10px 0 6px 0;color:#0f172a;">
          Rubrik Penilaian 4 Skala Skor
        </h3>
        <table style="width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:12px;page-break-inside:avoid;font-family:'Times New Roman',serif;font-size:10pt;">
          <thead>
            <tr>
              <th style="width:20%;background:#1e293b;color:#fff;padding:6px;border:1px solid #334155;text-align:left;">Aspek &amp; Kriteria</th>
              <th style="width:20%;background:#1d4ed8;color:#fff;padding:6px;border:1px solid #334155;text-align:left;">Sangat Baik (4: 86–100)</th>
              <th style="width:20%;background:#047857;color:#fff;padding:6px;border:1px solid #334155;text-align:left;">Baik (3: 71–85)</th>
              <th style="width:20%;background:#b45309;color:#fff;padding:6px;border:1px solid #334155;text-align:left;">Cukup (2: 56–70)</th>
              <th style="width:20%;background:#c2410c;color:#fff;padding:6px;border:1px solid #334155;text-align:left;">Perlu Bimbingan (1: &lt;56)</th>
            </tr>
          </thead>
          <tbody>
            ${rpm.lkpd.rubrikPenilaian
              .map(
                (row) => `
              <tr>
                <td style="border:1px solid #475569;padding:6px;font-weight:bold;vertical-align:top;">${escapeHtml(row.aspek)}</td>
                <td style="border:1px solid #475569;padding:6px;vertical-align:top;">${escapeHtml(row.sangatBaik)}</td>
                <td style="border:1px solid #475569;padding:6px;vertical-align:top;">${escapeHtml(row.baik)}</td>
                <td style="border:1px solid #475569;padding:6px;vertical-align:top;">${escapeHtml(row.cukup)}</td>
                <td style="border:1px solid #475569;padding:6px;vertical-align:top;">${escapeHtml(row.perluBimbingan)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <p style="font-size:10pt;font-family:'Times New Roman',serif;margin:4px 0 16px 0;">
          <strong>Pedoman Penskoran &amp; Predikat Nilai Akhir:</strong> ${escapeHtml(rpm.lkpd.pedomanPenskoran)}
        </p>

        ${signatureHtml}
      </body>
    </html>
  `;
}

export async function copyLKPDToClipboard(
  rpm: RPMDocument,
  formData: RPMFormData
): Promise<void> {
  const html = buildLKPDExportHtml(rpm, formData);
  const plainText = [
    `LEMBAR KERJA PESERTA DIDIK (LKPD) - ${rpm.identitas.namaSatuanPendidikan}`,
    rpm.lkpd.judulLKPD,
    `Mata Pelajaran: ${rpm.lkpd.mataPelajaran}`,
    `Kelas / Semester: ${rpm.lkpd.kelasSemester}`,
    `Tujuan Aktivitas: ${rpm.lkpd.tujuanAktivitas}`,
  ].join('\n');

  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([plainText], { type: 'text/plain' });
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      }),
    ]);
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(plainText);
  }
}

export function downloadBlobFile(
  content: BlobPart | BlobPart[],
  fileName: string,
  mimeType: string
): void {
  const parts = Array.isArray(content) ? content : [content];
  const blob = new Blob(parts, { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadLKPDAsDoc(
  rpm: RPMDocument,
  formData: RPMFormData
): void {
  const html = buildLKPDExportHtml(rpm, formData);
  const safeMapel = formData.mataPelajaran.replace(/[^a-zA-Z0-9]+/g, '_');
  const safeKelas = formData.kelas.replace(/[^a-zA-Z0-9]+/g, '_');
  downloadBlobFile(
    ['\ufeff', html],
    `LKPD_${safeMapel}_${safeKelas}.doc`,
    'application/msword;charset=utf-8'
  );
}
