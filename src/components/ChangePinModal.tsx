import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, X } from 'lucide-react';

interface ChangePinModalProps {
  isOpen: boolean;
  workspaceId: string;
  onClose: () => void;
  onPinUpdated: (newPin: string) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  workspaceId,
  onClose,
  onPinUpdated,
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPin.trim()) {
      setError('Masukkan PIN saat ini.');
      return;
    }
    if (newPin.trim().length < 4) {
      setError('PIN baru minimal terdiri dari 4 karakter atau digit.');
      return;
    }
    if (newPin.trim() !== confirmPin.trim()) {
      setError('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/update-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({
          workspaceId,
          currentPin: currentPin.trim(),
          newPin: newPin.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Gagal memperbarui PIN.');
        return;
      }
      const updated = newPin.trim();
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      onPinUpdated(updated);
      onClose();
    } catch {
      setError('Terjadi kesalahan koneksi saat menyimpan PIN baru.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-pin-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="h-1.5 w-full bg-four-colors" />
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <KeyRound className="h-4 w-4" />
            </div>
            <h2 id="change-pin-title" className="font-display text-base font-bold text-slate-900">
              Ubah PIN Keamanan Guru
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal ubah PIN"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="pin-current" className="block text-xs font-semibold text-slate-700 mb-1">
              PIN Saat Ini
            </label>
            <div className="relative">
              <input
                id="pin-current"
                type={showCurrent ? 'text' : 'password'}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Masukkan PIN saat ini"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-sm font-mono focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? 'Sembunyikan PIN saat ini' : 'Tampilkan PIN saat ini'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="pin-new" className="block text-xs font-semibold text-slate-700 mb-1">
              PIN Baru (Minimal 4 Karakter / Digit)
            </label>
            <div className="relative">
              <input
                id="pin-new"
                type={showNew ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Minimal 4 karakter / digit"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-sm font-mono focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? 'Sembunyikan PIN baru' : 'Tampilkan PIN baru'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="pin-confirm" className="block text-xs font-semibold text-slate-700 mb-1">
              Konfirmasi PIN Baru
            </label>
            <div className="relative">
              <input
                id="pin-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Ulangi PIN baru"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-sm font-mono focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Sembunyikan konfirmasi PIN' : 'Tampilkan konfirmasi PIN'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan PIN Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
