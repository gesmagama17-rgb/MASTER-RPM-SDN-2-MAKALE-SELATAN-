import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAnatomyPromptText,
  createFallbackRPM,
  getClassesForPhase,
  parseCurriculumDocumentText,
  syncPedagogicalModelsCount,
  validateRPMForm,
} from './rpmLogic';
import { buildExportHtml, buildLKPDExportHtml } from './exportUtils';
import {
  buildShareableTemplateJson,
  createWorkspace,
  deleteWorkspace,
  loadWorkspaceForm,
  loadWorkspacePin,
  loadWorkspaceRPM,
  parseShareableTemplateJson,
  resolveInitialWorkspace,
  saveWorkspaceForm,
  saveWorkspacePin,
  saveWorkspaceRPM,
  type StorageLike,
} from './workspaceStorage';
import {
  buildCleanShareUrl,
  buildPortableDesktopHtml,
  buildWhatsAppShareUrl,
} from './desktopLauncher';
import { createInitialFormData, SD_INSTANT_PRESETS } from '../types/rpm';

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

test('getClassesForPhase returns exact SD/MI classes for Fase A, B, and C', () => {
  assert.deepEqual(getClassesForPhase('Fase A'), ['Kelas I (Fase A)', 'Kelas II (Fase A)']);
  assert.deepEqual(getClassesForPhase('Fase B'), ['Kelas III (Fase B)', 'Kelas IV (Fase B)']);
  assert.deepEqual(getClassesForPhase('Fase C'), ['Kelas V (Fase C)', 'Kelas VI (Fase C)']);
});

test('validateRPMForm catches empty required fields and invalid dimensi count', () => {
  const invalid = createInitialFormData();
  invalid.namaSatuanPendidikan = '   ';
  invalid.dimensiProfilLulusan = [];
  const res = validateRPMForm(invalid);
  assert.equal(res.valid, false);
  assert.ok(res.errors.namaSatuanPendidikan);
  assert.ok(res.errors.dimensiProfilLulusan);

  const valid = createInitialFormData();
  const resOk = validateRPMForm(valid);
  assert.equal(resOk.valid, true);
  assert.deepEqual(resOk.errors, {});
});

test('syncPedagogicalModelsCount clamps to 1..8 and preserves existing selections', () => {
  const synced = syncPedagogicalModelsCount(['Game Based Learning'], 3);
  assert.equal(synced.length, 3);
  assert.equal(synced[0], 'Game Based Learning');
  assert.equal(syncPedagogicalModelsCount([], 12).length, 8);
  assert.equal(syncPedagogicalModelsCount([], 0).length, 1);
});

test('parseCurriculumDocumentText extracts CP 2025, ATP/TP 2025, and Materi Pelajaran', () => {
  const sampleText = `
    Mata Pelajaran: IPAS
    Fase B Kelas IV
    Capaian Pembelajaran (CP): Peserta didik memahami siklus air dan perubahan wujud benda.
    Alur Tujuan Pembelajaran (ATP): 1. Menjelaskan proses penguapan. 2. Membuat model siklus air.
    Materi Pokok: Siklus Air dan Perubahan Wujud Zat
  `;
  const parsed = parseCurriculumDocumentText(sampleText, 'CP_ATP_2025_IPAS.txt');
  assert.equal(parsed.fase, 'Fase B');
  assert.equal(parsed.mataPelajaran, 'IPAS');
  assert.match(parsed.capaianPembelajaran ?? '', /siklus air/i);
  assert.match(parsed.tujuanPembelajaran ?? '', /penguapan/i);
  assert.equal(parsed.materiPelajaran, 'Siklus Air dan Perubahan Wujud Zat');
});

test('createFallbackRPM builds all 5 tables, matching pertemuan count, LKPD, and 4-scale rubric', () => {
  const preset = SD_INSTANT_PRESETS[2]; // SD Fase C Matematika
  const formData = {
    ...createInitialFormData(),
    fase: preset.fase,
    kelas: preset.kelas,
    semester: preset.semester,
    mataPelajaran: preset.mataPelajaran,
    materiPelajaran: preset.materiPelajaran,
    capaianPembelajaran: preset.capaianPembelajaran,
    tujuanPembelajaran: preset.tujuanPembelajaran,
    jumlahPertemuan: 3,
    praktikPedagogisPerPertemuan: syncPedagogicalModelsCount(preset.praktikPedagogisPerPertemuan, 3),
    dimensiProfilLulusan: preset.dimensiProfilLulusan,
  };

  const doc = createFallbackRPM(formData);
  assert.equal(doc.identitas.mataPelajaran, 'Matematika');
  assert.equal(doc.desainPembelajaran.praktikPedagogisPerPertemuan.length, 3);
  assert.equal(doc.pengalamanBelajar.length, 3);
  assert.equal(doc.lkpd.aktivitasPerPertemuan.length, 3);
  assert.equal(doc.lkpd.rubrikPenilaian.length, 4);
  assert.equal(doc.metadata?.source, 'fallback');
});

test('buildAnatomyPromptText embeds form values dynamically', () => {
  const formData = createInitialFormData();
  const prompt = buildAnatomyPromptText(formData);
  assert.match(prompt, /UPT SD Negeri 2 Makale Selatan/);
  assert.match(prompt, /Fase B \/ Kelas IV \(Fase B\)/);
  assert.match(prompt, /Papan Interaktif Digital/);
});

test('buildExportHtml outputs A4 Times New Roman fixed table layout and toggles LKPD', () => {
  const formData = createInitialFormData();
  const rpm = createFallbackRPM(formData);

  const htmlWithLkpd = buildExportHtml(rpm, formData, true);
  assert.match(htmlWithLkpd, /Times New Roman/);
  assert.match(htmlWithLkpd, /table-layout:fixed/);
  assert.match(htmlWithLkpd, /width:28%/);
  assert.match(htmlWithLkpd, /width:72%/);
  assert.match(htmlWithLkpd, /6\. LEMBAR KERJA PESERTA DIDIK \(LKPD\)/);
  assert.match(htmlWithLkpd, /border:none;/);

  const htmlWithoutLkpd = buildExportHtml(rpm, formData, false);
  assert.doesNotMatch(htmlWithoutLkpd, /6\. LEMBAR KERJA PESERTA DIDIK \(LKPD\)/);
});

test('buildLKPDExportHtml builds standalone A4 Word LKPD without RPM Tabel 1-5', () => {
  const formData = createInitialFormData();
  const rpm = createFallbackRPM(formData);

  const lkpdHtml = buildLKPDExportHtml(rpm, formData);
  assert.match(lkpdHtml, /LEMBAR KERJA PESERTA DIDIK \(LKPD\)/);
  assert.match(lkpdHtml, /Times New Roman/);
  assert.match(lkpdHtml, /Rubrik Penilaian 4 Skala Skor/);
  assert.match(lkpdHtml, /border:none;/);
  assert.doesNotMatch(lkpdHtml, /1\. TABEL IDENTITAS/);
  assert.doesNotMatch(lkpdHtml, /3\. TABEL DESAIN PEMBELAJARAN/);
});

test('multi-teacher workspaces isolate forms, RPMs, and PINs without overlap', () => {
  const local = createMemoryStorage();
  const session = createMemoryStorage();

  const init = resolveInitialWorkspace(local, session, '');
  const wsA = init.activeId;
  const formA = { ...createInitialFormData(), namaGuru: 'Ibu Maria', nipGuru: '111111' };
  saveWorkspaceForm(local, wsA, formA);
  saveWorkspaceRPM(local, wsA, createFallbackRPM(formA));
  saveWorkspacePin(local, session, wsA, '9988', true);

  const wsBProfile = createWorkspace(local, session, 'Pak Yosep', 'SDN 2 Makale Selatan');
  const wsB = wsBProfile.id;
  assert.notEqual(wsA, wsB);

  const formB = loadWorkspaceForm(local, wsB);
  assert.equal(formB.namaGuru, 'Pak Yosep');
  assert.equal(formB.nipGuru, '');
  assert.equal(loadWorkspaceRPM(local, wsB), null);
  assert.equal(loadWorkspacePin(local, session, wsB), '');

  // Teacher A's data remains untouched
  assert.equal(loadWorkspaceForm(local, wsA).namaGuru, 'Ibu Maria');
  assert.equal(loadWorkspaceForm(local, wsA).nipGuru, '111111');
  assert.ok(loadWorkspaceRPM(local, wsA));
  assert.equal(loadWorkspacePin(local, session, wsA), '9988');

  // ?guru=baru creates a fresh room automatically
  const shareInit = resolveInitialWorkspace(local, session, '?guru=baru');
  assert.equal(shareInit.createdFromShareLink, true);
  assert.notEqual(shareInit.activeId, wsA);
  assert.notEqual(shareInit.activeId, wsB);

  // Deleting wsB leaves wsA intact
  const afterDelete = deleteWorkspace(local, session, wsB);
  assert.equal(afterDelete.workspaces.some((w) => w.id === wsB), false);
  assert.equal(loadWorkspaceForm(local, wsA).namaGuru, 'Ibu Maria');
});

test('shareable template strips personal NIP/name and portable desktop HTML builds cleanly', () => {
  const senderForm = {
    ...createInitialFormData(),
    namaGuru: 'Guru Pengirim',
    nipGuru: '19880517 201903 1 004',
    mataPelajaran: 'Matematika',
  };
  const cleanJson = buildShareableTemplateJson(senderForm, false);
  const receiverCurrent = {
    ...createInitialFormData(),
    namaGuru: 'Guru Penerima',
    nipGuru: '19900101 202001 2 001',
  };
  const imported = parseShareableTemplateJson(cleanJson, receiverCurrent);
  assert.ok(imported);
  assert.equal(imported.mataPelajaran, 'Matematika');
  assert.equal(imported.namaGuru, 'Guru Penerima');
  assert.equal(imported.nipGuru, '19900101 202001 2 001');

  const shareUrl = buildCleanShareUrl('https://contoh-sekolah.id/');
  assert.equal(shareUrl, 'https://contoh-sekolah.id/?guru=baru');
  assert.match(buildWhatsAppShareUrl(shareUrl), /guru%3Dbaru/);

  const html = buildPortableDesktopHtml('https://contoh-sekolah.id');
  assert.match(html, /Generator RPM UPT SDN 2 MAKALE SELATAN/);
  assert.match(html, /Anti Tumpang Tindih/);
  assert.match(html, /sdn2_portable_ws_/);
});
