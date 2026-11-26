import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { RPMDocument, RPMFormData } from './src/types/rpm.ts';
import {
  buildAnatomyPromptText,
  createFallbackRPM,
  parseCurriculumDocumentText,
  validateRPMForm,
} from './src/utils/rpmLogic.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const BASE_ACCESS_PIN = (process.env.APP_ACCESS_PIN || '40306401').trim();
const workspacePins = new Map<string, string>();

function normalizeWorkspaceId(raw: unknown): string {
  const value = String(raw ?? '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return value || 'ws_default';
}

function getWorkspacePin(workspaceId: string): string {
  return workspacePins.get(normalizeWorkspaceId(workspaceId)) ?? BASE_ACCESS_PIN;
}

function hasValidGeminiKey(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key !== 'MY_GEMINI_API_KEY' && key.length > 10);
}

function getGeminiClient(): GoogleGenAI | null {
  if (!hasValidGeminiKey()) return null;
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const RPM_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    identitas: {
      type: Type.OBJECT,
      properties: {
        namaSatuanPendidikan: { type: Type.STRING },
        mataPelajaran: { type: Type.STRING },
        kelasSemester: { type: Type.STRING },
        durasiPertemuan: { type: Type.STRING },
      },
      required: ['namaSatuanPendidikan', 'mataPelajaran', 'kelasSemester', 'durasiPertemuan'],
    },
    identifikasi: {
      type: Type.OBJECT,
      properties: {
        profilKesiapanSiswa: { type: Type.STRING },
        materiPelajaran: { type: Type.STRING },
        capaianDimensiLulusan: { type: Type.STRING },
      },
      required: ['profilKesiapanSiswa', 'materiPelajaran', 'capaianDimensiLulusan'],
    },
    desainPembelajaran: {
      type: Type.OBJECT,
      properties: {
        capaianPembelajaran: { type: Type.STRING },
        lintasDisiplinIlmu: { type: Type.STRING },
        tujuanPembelajaran: { type: Type.STRING },
        topikPembelajaran: { type: Type.STRING },
        praktikPedagogisPerPertemuan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pertemuanKe: { type: Type.INTEGER },
              model: { type: Type.STRING },
              deskripsiSingkat: { type: Type.STRING },
            },
            required: ['pertemuanKe', 'model', 'deskripsiSingkat'],
          },
        },
        integrasiLiterasiNumerasi: { type: Type.STRING },
        kemitraanPembelajaran: { type: Type.STRING },
        lingkunganPembelajaran: { type: Type.STRING },
        pemanfaatanDigitalTools: { type: Type.STRING },
      },
      required: [
        'capaianPembelajaran',
        'lintasDisiplinIlmu',
        'tujuanPembelajaran',
        'topikPembelajaran',
        'praktikPedagogisPerPertemuan',
        'integrasiLiterasiNumerasi',
        'kemitraanPembelajaran',
        'lingkunganPembelajaran',
        'pemanfaatanDigitalTools',
      ],
    },
    pengalamanBelajar: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pertemuanKe: { type: Type.INTEGER },
          fokusPertemuan: { type: Type.STRING },
          modelPertemuan: { type: Type.STRING },
          memahami: {
            type: Type.OBJECT,
            properties: {
              judul: { type: Type.STRING },
              prinsip: { type: Type.STRING },
              aktivitas: { type: Type.STRING },
            },
            required: ['judul', 'prinsip', 'aktivitas'],
          },
          mengaplikasi: {
            type: Type.OBJECT,
            properties: {
              judul: { type: Type.STRING },
              prinsip: { type: Type.STRING },
              aktivitas: { type: Type.STRING },
            },
            required: ['judul', 'prinsip', 'aktivitas'],
          },
          refleksi: {
            type: Type.OBJECT,
            properties: {
              judul: { type: Type.STRING },
              prinsip: { type: Type.STRING },
              aktivitas: { type: Type.STRING },
            },
            required: ['judul', 'prinsip', 'aktivitas'],
          },
        },
        required: ['pertemuanKe', 'fokusPertemuan', 'modelPertemuan', 'memahami', 'mengaplikasi', 'refleksi'],
      },
    },
    asesmen: {
      type: Type.OBJECT,
      properties: {
        asesmenAwal: { type: Type.STRING },
        asesmenProses: { type: Type.STRING },
        asesmenAkhir: { type: Type.STRING },
      },
      required: ['asesmenAwal', 'asesmenProses', 'asesmenAkhir'],
    },
    lkpd: {
      type: Type.OBJECT,
      properties: {
        judulLKPD: { type: Type.STRING },
        mataPelajaran: { type: Type.STRING },
        kelasSemester: { type: Type.STRING },
        tujuanAktivitas: { type: Type.STRING },
        petunjukUmum: { type: Type.ARRAY, items: { type: Type.STRING } },
        kasusNyataStimulus: { type: Type.STRING },
        aktivitasPerPertemuan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pertemuanKe: { type: Type.INTEGER },
              judulAktivitas: { type: Type.STRING },
              model: { type: Type.STRING },
              langkahPengerjaan: { type: Type.ARRAY, items: { type: Type.STRING } },
              tugasPengamatan: { type: Type.STRING },
            },
            required: ['pertemuanKe', 'judulAktivitas', 'model', 'langkahPengerjaan', 'tugasPengamatan'],
          },
        },
        pertanyaanRefleksiHOTS: { type: Type.ARRAY, items: { type: Type.STRING } },
        rubrikPenilaian: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              aspek: { type: Type.STRING },
              sangatBaik: { type: Type.STRING },
              baik: { type: Type.STRING },
              cukup: { type: Type.STRING },
              perluBimbingan: { type: Type.STRING },
            },
            required: ['aspek', 'sangatBaik', 'baik', 'cukup', 'perluBimbingan'],
          },
        },
        pedomanPenskoran: { type: Type.STRING },
      },
      required: [
        'judulLKPD',
        'mataPelajaran',
        'kelasSemester',
        'tujuanAktivitas',
        'petunjukUmum',
        'kasusNyataStimulus',
        'aktivitasPerPertemuan',
        'pertanyaanRefleksiHOTS',
        'rubrikPenilaian',
        'pedomanPenskoran',
      ],
    },
  },
  required: [
    'identitas',
    'identifikasi',
    'desainPembelajaran',
    'pengalamanBelajar',
    'asesmen',
    'lkpd',
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const requireValidPin: express.RequestHandler = (req, res, next) => {
    const workspaceId = normalizeWorkspaceId(req.headers['x-workspace-id']);
    const headerPin = String(req.headers['x-access-pin'] ?? '').trim();
    const expectedPin = getWorkspacePin(workspaceId);
    if (!headerPin || headerPin !== expectedPin) {
      res.status(401).json({
        error: 'Akses ditolak: PIN keamanan tidak valid atau sesi ruang guru terkunci.',
      });
      return;
    }
    next();
  };

  // 1. GET /api/auth/status
  app.get('/api/auth/status', (req, res) => {
    const workspaceId = normalizeWorkspaceId(req.query.workspaceId);
    res.json({
      protected: true,
      workspaceId,
      pinLength: getWorkspacePin(workspaceId).length,
    });
  });

  // 2. POST /api/auth/verify-pin
  app.post('/api/auth/verify-pin', (req, res) => {
    const workspaceId = normalizeWorkspaceId(req.body?.workspaceId ?? req.headers['x-workspace-id']);
    const pin = String(req.body?.pin ?? '').trim();
    const expectedPin = getWorkspacePin(workspaceId);
    if (!pin || pin !== expectedPin) {
      res.status(401).json({
        valid: false,
        error: 'PIN salah untuk ruang guru ini. Silakan periksa PIN atau pilih ruang guru lain.',
      });
      return;
    }
    res.json({ valid: true, workspaceId });
  });

  // 3. POST /api/auth/update-pin
  app.post('/api/auth/update-pin', (req, res) => {
    const workspaceId = normalizeWorkspaceId(req.body?.workspaceId ?? req.headers['x-workspace-id']);
    const currentPin = String(req.body?.currentPin ?? '').trim();
    const newPin = String(req.body?.newPin ?? '').trim();
    const expectedPin = getWorkspacePin(workspaceId);

    if (currentPin !== expectedPin) {
      res.status(401).json({
        success: false,
        error: 'PIN saat ini tidak sesuai untuk ruang guru ini.',
      });
      return;
    }

    if (newPin.length < 4) {
      res.status(400).json({
        success: false,
        error: 'PIN baru minimal harus terdiri dari 4 karakter atau digit.',
      });
      return;
    }

    workspacePins.set(workspaceId, newPin);
    res.json({
      success: true,
      workspaceId,
      message: 'PIN akses ruang guru berhasil diperbarui tanpa memengaruhi guru lain.',
    });
  });

  // 4. POST /api/parse-curriculum (ekstraksi dokumen CP 2025 & ATP 2025)
  app.post('/api/parse-curriculum', requireValidPin, async (req, res) => {
    try {
      const { fileName = '', mimeType = '', textContent = '', base64Data = '' } = req.body ?? {};
      let parsed = parseCurriculumDocumentText(String(textContent || ''), String(fileName || ''));

      if ((!parsed.capaianPembelajaran || !parsed.tujuanPembelajaran) && base64Data) {
        const ai = getGeminiClient();
        if (ai) {
          const response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'application/pdf',
                    data: String(base64Data),
                  },
                },
                {
                  text: 'Ekstrak informasi Capaian Pembelajaran (CP 2025), Tujuan Pembelajaran / Alur Tujuan Pembelajaran (ATP 2025), Materi Pelajaran, Mata Pelajaran, dan Fase (Fase A / Fase B / Fase C) khusus SD/MI dari dokumen ini dalam format JSON.',
                },
              ],
            },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  capaianPembelajaran: { type: Type.STRING },
                  tujuanPembelajaran: { type: Type.STRING },
                  materiPelajaran: { type: Type.STRING },
                  mataPelajaran: { type: Type.STRING },
                  fase: { type: Type.STRING },
                },
              },
            },
          });
          if (response.text) {
            const json = JSON.parse(response.text.trim());
            parsed = {
              capaianPembelajaran: json.capaianPembelajaran || parsed.capaianPembelajaran,
              tujuanPembelajaran: json.tujuanPembelajaran || parsed.tujuanPembelajaran,
              materiPelajaran: json.materiPelajaran || parsed.materiPelajaran,
              mataPelajaran: json.mataPelajaran || parsed.mataPelajaran,
              fase:
                json.fase === 'Fase A' || json.fase === 'Fase B' || json.fase === 'Fase C'
                  ? json.fase
                  : parsed.fase,
            };
          }
        }
      }

      res.json({ success: true, parsed });
    } catch (err) {
      console.error('Error parsing curriculum doc:', err);
      res.status(500).json({ error: 'Gagal memproses dokumen CP/ATP 2025.' });
    }
  });

  // 5. POST /api/generate-rpm
  app.post('/api/generate-rpm', requireValidPin, async (req, res) => {
    const formData = req.body as RPMFormData;
    const validation = validateRPMForm(formData);

    if (!validation.valid) {
      res.status(400).json({
        error: 'Data formulir belum lengkap. Harap lengkapi seluruh kolom bertanda wajib (*).',
        fieldErrors: validation.errors,
      });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      const fallbackDoc = createFallbackRPM(formData);
      res.json({ rpm: fallbackDoc });
      return;
    }

    try {
      const prompt = buildAnatomyPromptText(formData);
      const geminiPromise = ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah Konsultan Kurikulum Nasional Kurikulum Merdeka SD/MI dan Perancang Deep Learning Framework. Selalu balas dalam JSON valid berbahasa Indonesia yang baku, terstruktur, operasional, dan ramah anak SD/MI.',
          responseMimeType: 'application/json',
          responseSchema: RPM_RESPONSE_SCHEMA,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini request timeout after 20s')), 20000)
      );
      const response = await Promise.race([geminiPromise, timeoutPromise]);

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new Error('Respons Gemini kosong');
      }

      const parsed = JSON.parse(rawText) as RPMDocument;
      parsed.metadata = {
        source: 'gemini',
        model: 'gemini-4-hydrogen',
        generatedAt: new Date().toISOString(),
      };

      res.json({ rpm: parsed });
    } catch (err) {
      console.warn('Gemini generation unavailable, activating deterministic fallback:', err);
      const fallbackDoc = createFallbackRPM(formData);
      res.json({ rpm: fallbackDoc });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server RPM SDN 2 Makale Selatan running at http://localhost:${PORT}`);
  });
}

startServer();
