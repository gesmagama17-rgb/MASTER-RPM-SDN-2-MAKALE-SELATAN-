import React, { useState } from 'react';
import { Delete, Eye, EyeOff, Info, Lock, ShieldCheck, Unlock, Users } from 'lucide-react';

interface PinLockModalProps {
  workspaceId: string;
  activeWorkspaceName: string;
  onUnlockSuccess: (pin: string, remember: boolean) => void;
  onOpenWorkspaceModal: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  workspaceId,
  activeWorkspaceName,
  onUnlockSuccess,
  onOpenWorkspaceModal,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const triggerShake = (msg: string) => {
    setError(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  const handleDigit = (digit: string) => {
    if (error) setError('');
    setPin((prev) => (prev.length < 16 ? prev + digit : prev));
  };

  const handleClear = () => {
    setError('');
    setPin('');
  };

  const handleDelete = () => {
    setError('');
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pin.trim();
    if (!trimmed) {
      triggerShake('Masukkan PIN akses terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({ pin: trimmed, workspaceId }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        triggerShake(data.error || 'PIN akses salah. Periksa kembali digit PIN Anda.');
        return;
      }
      onUnlockSuccess(trimmed, remember);
    } catch {
      triggerShake('Gagal terhubung ke server verifikasi PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const keypadDigits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-lock-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div
        className={`w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        <div className="h-1.5 w-full bg-four-colors" />

        {/* Banner atas gradien biru-indigo-slate */}
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-yellow-300">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 id="pin-lock-title" className="font-display text-lg font-bold tracking-tight text-white">
                  Akses Terproteksi
                </h2>
                <p className="text-xs text-blue-100/90 mt-0.5 leading-snug">
                  Generator RPM SDN 2 Makale Selatan — Khusus SD/MI
                </p>
                <p className="mt-1 inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-200">
                  Ruang Aktif: {activeWorkspaceName}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 whitespace-nowrap shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" />
              Keamanan Akses Guru
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="pin-access-input" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Masukkan PIN Akses Guru
            </label>
            <div className="relative">
              <input
                id="pin-access-input"
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => {
                  setError('');
                  setPin(e.target.value);
                }}
                placeholder="Masukkan PIN..."
                autoFocus
                className={`w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-center font-mono text-lg text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  pin ? 'tracking-widest' : 'tracking-normal'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 transition-colors"
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
            >
              {error}
            </div>
          )}

          {/* Virtual Keypad 3 kolom */}
          <div className="grid grid-cols-3 gap-2" aria-label="Keypad PIN virtual">
            {keypadDigits.map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 font-mono text-base font-semibold text-slate-800 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 active:scale-95 transition-all"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-xl border border-orange-200 bg-orange-50 text-xs font-bold tracking-wider text-orange-700 hover:bg-orange-100 active:scale-95 transition-all"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 font-mono text-base font-semibold text-slate-800 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 active:scale-95 transition-all"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Hapus digit terakhir"
              className="flex h-11 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
            >
              <Delete className="h-4 w-4" />
              DEL
            </button>
          </div>

          <label className="flex items-center gap-2.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Ingat akses di perangkat ini
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-md hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-60 transition-all"
          >
            <Unlock className="h-4 w-4" />
            {isSubmitting ? 'Memverifikasi PIN...' : 'Buka Akses Generator'}
          </button>

          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-slate-700 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              PIN awal sistem: <strong className="font-mono text-blue-900">40306401</strong>. Setelah masuk, Anda dapat mengganti PIN kapan saja melalui tombol <span className="font-semibold">Ubah PIN</span> di Header.
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenWorkspaceModal}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors"
          >
            <Users className="h-4 w-4 text-emerald-600" />
            Ganti / Buat Ruang Guru Baru (Anti Tumpang Tindih)
          </button>
        </form>
      </div>
    </div>
  );
};
