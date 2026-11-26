import { downloadBlobFile } from './exportUtils';

function escapeHtmlSafe(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildCleanShareUrl(origin: string): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  return `${cleanOrigin}/?guru=baru`;
}

export function buildWhatsAppShareUrl(shareUrl: string): string {
  const message = [
    '*Aplikasi Desktop Generator RPM & LKPD (UPT SDN 2 Makale Selatan)*',
    'Khusus Jenjang SD/MI (Fase A, B, dan C).',
    '',
    'Silakan buka tautan berikut di Google Chrome / Microsoft Edge:',
    shareUrl,
    '',
    'Catatan Keamanan Data:',
    '- Tautan ini otomatis membuat Ruang Guru baru yang terpisah (data Bapak/Ibu tidak akan tumpang tindih dengan guru lain).',
    '- PIN Akses Awal: 40306401 (dapat diubah sendiri untuk ruang masing-masing).',
    '- Untuk memasang sebagai Aplikasi Desktop: klik tombol "Aplikasi Desktop & Kirim" -> "Pasang Aplikasi Desktop".',
  ].join('\n');

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildPortableDesktopHtml(appOrigin: string): string {
  const cleanShareUrl = buildCleanShareUrl(appOrigin || 'https://ais-pre-gupcac6m5dvabpszapf4dg-809866847338.asia-southeast1.run.app');
  const escapedShareUrl = escapeHtmlSafe(cleanShareUrl);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Peluncur Desktop — Generator RPM SDN 2 Makale Selatan (SD/MI)</title>
  <style>
    * { box-sizing: border-box; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
    body { margin: 0; min-height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #172554 55%, #0f172a 100%); color: #0f172a; padding: 24px; display: flex; justify-content: center; align-items: flex-start; }
    .shell { width: 100%; max-width: 920px; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.35); border: 1px solid #cbd5e1; }
    .accent { height: 7px; background: linear-gradient(90deg, #2563eb 0%, #34d399 35%, #facc15 70%, #f97316 100%); }
    .hero { background: linear-gradient(135deg, #0f172a, #1e3a8a); color: #ffffff; padding: 24px 28px; }
    .hero h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; }
    .hero p { margin: 0; font-size: 13px; color: #cbd5e1; line-height: 1.5; }
    .badge { display: inline-block; background: rgba(250, 204, 21, 0.18); border: 1px solid rgba(250, 204, 21, 0.45); color: #fde047; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; margin-bottom: 10px; }
    .content { padding: 24px 28px; display: grid; gap: 18px; }
    .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
    .card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; background: #f8fafc; }
    .card h2 { margin: 0 0 8px 0; font-size: 15px; color: #0f172a; }
    .card p { margin: 0 0 12px 0; font-size: 12.5px; color: #475569; line-height: 1.55; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; text-decoration: none; }
    .btn-primary { background: linear-gradient(90deg, #facc15, #f97316); color: #0f172a; }
    .btn-blue { background: #2563eb; color: #ffffff; }
    .btn-emerald { background: #059669; color: #ffffff; }
    .btn-orange { background: #ea580c; color: #ffffff; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; margin-top: 10px; }
    label { display: block; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 4px; }
    input, select, textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; font-size: 13px; background: #fff; }
    textarea { min-height: 68px; resize: vertical; }
    .iso-note { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; border-radius: 10px; padding: 10px 12px; font-size: 12px; line-height: 1.5; }
    .status-bar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="shell">
    <div class="accent"></div>
    <div class="hero">
      <div class="badge">Paket Desktop Portable • Khusus Guru SD/MI</div>
      <h1>Generator RPM UPT SDN 2 MAKALE SELATAN</h1>
      <p>Berkas portabel ini aman dikirim ke guru lain melalui WhatsApp, Telegram, atau Flashdisk. Setiap guru otomatis memakai ruang penyimpanannya sendiri sehingga data antar guru tidak saling tumpang tindih.</p>
    </div>

    <div class="content">
      <div class="iso-note">
        <strong>Jaminan Anti Tumpang Tindih:</strong> Ruang kerja guru di berkas ini dipisahkan per <em>ID Nama Guru</em> di komputer lokal, dan tautan aplikasi utama menggunakan mode <code>?guru=baru</code> sehingga tiap guru mendapat profil, PIN (awal: <strong>40306401</strong>), dan riwayat RPM masing-masing.
      </div>

      <div class="grid-2">
        <div class="card">
          <h2>1. Buka Aplikasi Desktop Lengkap (Online / PWA)</h2>
          <p>Gunakan tombol ini saat terhubung ke internet untuk membuka generator lengkap (AI + Ekstrak CP/ATP + 5 Tabel RPM). Di Chrome/Edge, klik menu <strong>Pasang Aplikasi Desktop</strong> agar menjadi ikon aplikasi Windows/Mac.</p>
          <a class="btn btn-primary" href="${escapedShareUrl}" target="_blank" rel="noopener noreferrer">
            Buka Ruang Guru Baru &rarr;
          </a>
        </div>
        <div class="card">
          <h2>2. Cara Pasang Sebagai Aplikasi Desktop</h2>
          <p>Setelah aplikasi utama terbuka di Google Chrome atau Microsoft Edge: klik ikon <strong>Pasang (Install)</strong> di kanan bilah alamat, atau gunakan tombol <strong>Aplikasi Desktop &amp; Kirim</strong> di header aplikasi.</p>
          <button type="button" class="btn btn-blue" onclick="copyShareUrl()">Salin Tautan Ruang Guru Baru</button>
          <span id="copyMsg" style="font-size:11px;color:#059669;font-weight:700;margin-left:8px;"></span>
        </div>
      </div>

      <div class="card">
        <h2>3. Generator Darurat Offline SD/MI (Langsung Ekspor Word .Doc)</h2>
        <p>Jika berada di wilayah tanpa sinyal internet, Bapak/Ibu tetap dapat menyusun draf RPM &amp; LKPD SD/MI secara luring di bawah ini. Data otomatis disimpan terpisah berdasarkan nama ruang guru.</p>

        <div class="form-grid">
          <div>
            <label for="wsGuru">Nama Ruang / Guru Pemakai *</label>
            <input id="wsGuru" type="text" placeholder="Contoh: Ibu Maria, S.Pd." oninput="switchLocalSpace()" />
          </div>
          <div>
            <label for="wsSekolah">Satuan Pendidikan</label>
            <input id="wsSekolah" type="text" value="UPT SD Negeri 2 Makale Selatan" oninput="saveDraft()" />
          </div>
          <div>
            <label for="wsMapel">Mata Pelajaran</label>
            <input id="wsMapel" type="text" value="IPAS (Ilmu Pengetahuan Alam dan Sosial)" oninput="saveDraft()" />
          </div>
          <div>
            <label for="wsKelas">Fase &amp; Kelas</label>
            <select id="wsKelas" onchange="saveDraft()">
              <option>Kelas I (Fase A)</option>
              <option>Kelas II (Fase A)</option>
              <option>Kelas III (Fase B)</option>
              <option selected>Kelas IV (Fase B)</option>
              <option>Kelas V (Fase C)</option>
              <option>Kelas VI (Fase C)</option>
            </select>
          </div>
        </div>
        <div class="form-grid" style="margin-top:8px;">
          <div>
            <label for="wsMateri">Materi Pokok Pembelajaran</label>
            <input id="wsMateri" type="text" value="Wujud Zat dan Perubahan Wujud Benda" oninput="saveDraft()" />
          </div>
          <div>
            <label for="wsKepala">Kepala Sekolah</label>
            <input id="wsKepala" type="text" value="Alfeus Mardan Kadang, S.Pd." oninput="saveDraft()" />
          </div>
        </div>
        <div style="margin-top:8px;">
          <label for="wsTP">Tujuan Pembelajaran (TP)</label>
          <textarea id="wsTP" oninput="saveDraft()">1. Peserta didik mampu menjelaskan konsep materi melalui pengamatan benda konkret.&#10;2. Peserta didik mampu menyajikan hasil penyelidikan sederhana bersama kelompok.</textarea>
        </div>

        <div style="margin-top:12px; display:flex; flex-wrap:wrap; gap:10px;">
          <button type="button" class="btn btn-emerald" onclick="downloadOfflineWord('rpm')">Unduh RPM Lengkap Offline (.Doc)</button>
          <button type="button" class="btn btn-orange" onclick="downloadOfflineWord('lkpd')">Unduh Khusus LKPD Offline (.Doc)</button>
        </div>
      </div>

      <div class="status-bar">
        <span>Status Penyimpanan: Terisolasi per Nama Guru (Anti Tumpang Tindih)</span>
        <span>UPT SDN 2 Makale Selatan • Deep Learning SD/MI</span>
      </div>
    </div>
  </div>

  <script>
    const SHARE_URL = ${JSON.stringify(cleanShareUrl)};
    function copyShareUrl() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(SHARE_URL).then(() => {
          document.getElementById('copyMsg').textContent = 'Tautan disalin!';
          setTimeout(() => document.getElementById('copyMsg').textContent = '', 2500);
        });
      }
    }
    function spaceKey() {
      const name = (document.getElementById('wsGuru').value || 'umum').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      return 'sdn2_portable_ws_' + (name || 'umum');
    }
    function saveDraft() {
      try {
        const data = {
          guru: document.getElementById('wsGuru').value,
          sekolah: document.getElementById('wsSekolah').value,
          mapel: document.getElementById('wsMapel').value,
          kelas: document.getElementById('wsKelas').value,
          materi: document.getElementById('wsMateri').value,
          kepala: document.getElementById('wsKepala').value,
          tp: document.getElementById('wsTP').value
        };
        localStorage.setItem(spaceKey(), JSON.stringify(data));
      } catch (e) {}
    }
    function switchLocalSpace() {
      try {
        const saved = localStorage.getItem(spaceKey());
        if (saved) {
          const d = JSON.parse(saved);
          document.getElementById('wsSekolah').value = d.sekolah || 'UPT SD Negeri 2 Makale Selatan';
          document.getElementById('wsMapel').value = d.mapel || 'IPAS';
          document.getElementById('wsKelas').value = d.kelas || 'Kelas IV (Fase B)';
          document.getElementById('wsMateri').value = d.materi || '';
          document.getElementById('wsKepala').value = d.kepala || '';
          document.getElementById('wsTP').value = d.tp || '';
        }
      } catch (e) {}
      saveDraft();
    }
    function esc(s) {
      return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
    function downloadOfflineWord(mode) {
      const guru = esc(document.getElementById('wsGuru').value || 'Guru SD/MI');
      const sekolah = esc(document.getElementById('wsSekolah').value || 'UPT SD Negeri 2 Makale Selatan');
      const mapel = esc(document.getElementById('wsMapel').value || 'Mata Pelajaran SD/MI');
      const kelas = esc(document.getElementById('wsKelas').value || 'Kelas IV (Fase B)');
      const materi = esc(document.getElementById('wsMateri').value || 'Materi Pembelajaran');
      const kepala = esc(document.getElementById('wsKepala').value || 'Kepala Sekolah');
      const tp = esc(document.getElementById('wsTP').value || '').replace(/\\n/g, '<br/>');

      const lkpdSection = '<h3>LEMBAR KERJA PESERTA DIDIK (LKPD)</h3>' +
        '<table style="width:100%;border-collapse:collapse;border:1px solid #000;">' +
        '<tr><td style="border:1px solid #000;padding:6px;width:28%;font-weight:bold;background:#fff7ed;">Satuan Pendidikan</td><td style="border:1px solid #000;padding:6px;">' + sekolah + '</td></tr>' +
        '<tr><td style="border:1px solid #000;padding:6px;font-weight:bold;background:#fff7ed;">Mata Pelajaran / Kelas</td><td style="border:1px solid #000;padding:6px;">' + mapel + ' — ' + kelas + '</td></tr>' +
        '<tr><td style="border:1px solid #000;padding:6px;font-weight:bold;background:#fff7ed;">Materi Pokok</td><td style="border:1px solid #000;padding:6px;">' + materi + '</td></tr>' +
        '<tr><td style="border:1px solid #000;padding:6px;font-weight:bold;background:#fff7ed;">Nama Kelompok / Siswa</td><td style="border:1px solid #000;padding:6px;">.................................................... (Kelas: ' + kelas + ')</td></tr>' +
        '<tr><td style="border:1px solid #000;padding:6px;font-weight:bold;background:#fff7ed;">Aktivitas Penyelidikan</td><td style="border:1px solid #000;padding:6px;">1. Amati benda/kasus nyata terkait ' + materi + '.<br/>2. Diskusikan temuan bersama kelompok.<br/>3. Tuliskan kesimpulan pada kotak jawaban di bawah.</td></tr>' +
        '<tr><td style="border:1px solid #000;padding:12px;height:110px;" colspan="2"><strong>Jawaban &amp; Hasil Pengamatan Siswa:</strong><br/><br/><br/></td></tr>' +
        '</table>';

      const rpmSection = mode === 'lkpd' ? '' :
        '<h3>PERENCANAAN PEMBELAJARAN MENDALAM (RPM)</h3>' +
        '<table style="width:100%;border-collapse:collapse;border:1px solid #000;margin-bottom:12px;">' +
        '<tr><td style="border:1px solid #000;padding:6px;width:28%;font-weight:bold;background:#eff6ff;">Satuan Pendidikan</td><td style="border:1px solid #000;padding:6px;">' + sekolah + '</td></tr>' +
        '<tr><td style="border:1px solid #000;padding:6px;font-weight:bold;background:#eff6ff;">Mata Pelajaran / Kelas</td><td style="border:1px solid #000;padding:6px;">' + mapel + ' — ' + kelas + '</td></tr>' +
        '<tr><td style="border:1px solid #000;padding:6px;font-weight:bold;background:#eff6ff;">Materi Pokok</td><td style="border:1px solid #000;padding:6px;">' + materi + '</td></tr>' +
        '<tr><td style="border:1px solid #000;padding:6px;font-weight:bold;background:#ecfdf5;">Tujuan Pembelajaran</td><td style="border:1px solid #000;padding:6px;">' + tp + '</td></tr>' +
        '</table>';

      const signBlock = '<table style="width:100%;border:none;border-collapse:collapse;margin-top:20px;"><tr>' +
        '<td style="width:50%;border:none;vertical-align:top;">Mengetahui,<br/>Kepala Sekolah<br/><br/><br/><strong><u>' + kepala + '</u></strong></td>' +
        '<td style="width:50%;border:none;vertical-align:top;">Makale Selatan,<br/>Guru Kelas / Mapel<br/><br/><br/><strong><u>' + guru + '</u></strong></td>' +
        '</tr></table>';

      const docHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head><meta charset="utf-8"><style>@page{size:A4;margin:1.5cm;}body{font-family:"Times New Roman",serif;font-size:10.5pt;}</style></head>' +
        '<body>' + rpmSection + lkpdSection + signBlock + '</body></html>';

      const blob = new Blob(['\\ufeff', docHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (mode === 'lkpd' ? 'LKPD_Offline_' : 'RPM_Offline_') + mapel.replace(/[^a-zA-Z0-9]+/g, '_') + '.doc';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  </script>
</body>
</html>`;
}

export function downloadPortableDesktopLauncher(appOrigin: string): void {
  const html = buildPortableDesktopHtml(appOrigin);
  downloadBlobFile(
    html,
    'Generator-RPM-SDN2-Desktop.html',
    'text/html;charset=utf-8'
  );
}
