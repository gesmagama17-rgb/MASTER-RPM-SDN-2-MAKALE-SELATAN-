import React, { useState } from 'react';
import { BookOpen, Check, Copy, Cpu, Layers, ShieldAlert, X } from 'lucide-react';
import type { RPMFormData } from '../types/rpm';
import { buildAnatomyPromptText } from '../utils/rpmLogic';

interface PromptAnatomyModalProps {
  isOpen: boolean;
  formData: RPMFormData;
  onClose: () => void;
}

export const PromptAnatomyModal: React.FC<PromptAnatomyModalProps> = ({
  isOpen,
  formData,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullPrompt = buildAnatomyPromptText(formData);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const pillars = [
    {
      title: '1. Role & Persona (Peran Ahli)',
      color: 'border-blue-200 bg-blue-50/70 text-blue-900',
      iconColor: 'text-blue-600',
      Icon: Cpu,
      desc: 'Menginstruksikan AI bertindak sebagai Konsultan Kurikulum Nasional Kurikulum Merdeka SD/MI & Ahli Desain Deep Learning (Mindful, Meaningful, Joyful).',
    },
    {
      title: '2. Context & Latar Belakang',
      color: 'border-orange-200 bg-orange-50/70 text-orange-900',
      iconColor: 'text-orange-600',
      Icon: BookOpen,
      desc: `Menyuntikkan konteks nyata ${formData.namaSatuanPendidikan}, ${formData.fase} (${formData.kelas}), Mapel ${formData.mataPelajaran || 'SD/MI'}, serta kesiapan siswa usia SD.`,
    },
    {
      title: '3. Task & Instructions (5 Bagian + LKPD)',
      color: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
      iconColor: 'text-emerald-600',
      Icon: Layers,
      desc: 'Merancang 5 tabel terpadu (Identitas, Identifikasi, Desain, Pengalaman Belajar 3 tahap, Asesmen) plus Lampiran LKPD & Rubrik 4 Skala Skor.',
    },
    {
      title: '4. Constraints & Dynamic Variables',
      color: 'border-amber-200 bg-amber-50/70 text-amber-900',
      iconColor: 'text-amber-600',
      Icon: ShieldAlert,
      desc: 'Wajib mengintegrasikan Literasi, Numerasi, Papan Interaktif Digital, sintaks model per pertemuan, dan output JSON skema ketat ramah anak SD/MI.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="anatomy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        <div className="h-1.5 w-full bg-four-colors shrink-0" />
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0">
          <div>
            <h2 id="anatomy-modal-title" className="font-display text-lg font-bold text-slate-900">
              Struktur Anatomi Prompt — Mesin RPM SD/MI
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparansi arsitektur instruksi AI yang diperbarui dinamis mengikuti isian formulir Anda saat ini.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal anatomi prompt"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pillars.map((pillar) => {
              const Icon = pillar.Icon;
              return (
                <div key={pillar.title} className={`rounded-xl border p-4 ${pillar.color}`}>
                  <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
                    <Icon className={`h-4 w-4 shrink-0 ${pillar.iconColor}`} />
                    <span>{pillar.title}</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{pillar.desc}</p>
                </div>
              );
            })}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                Full Prompt Engine Text (Live Preview)
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {formData.fase} · {formData.jumlahPertemuan} Pertemuan
              </span>
            </div>
            <pre className="max-h-72 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100 whitespace-pre-wrap">
              {fullPrompt}
            </pre>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-950 hover:brightness-105'
            }`}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Berhasil Disalin!' : 'Salin Prompt Master'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
