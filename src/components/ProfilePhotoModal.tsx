import React, { useEffect, useRef, useState } from 'react';
import { Check, Link2, RotateCcw, Upload, UserCheck, Users, X } from 'lucide-react';
import { AVATAR_PRESETS, DEFAULT_GURU_PHOTO } from '../types/rpm';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  currentPhoto: string;
  onClose: () => void;
  onSavePhoto: (photoUrl: string) => void;
}

type ModalTab = 'upload' | 'avatar' | 'url';

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({
  isOpen,
  currentPhoto,
  onClose,
  onSavePhoto,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('upload');
  const [previewUrl, setPreviewUrl] = useState(currentPhoto);
  const [urlInput, setUrlInput] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentPhoto);
      setUploadError('');
    }
  }, [isOpen, currentPhoto]);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setUploadError('');
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Format file harus JPG, PNG, WebP, atau GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    setUploadError('');
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUploadError('Masukkan tautan URL gambar yang valid.');
      return;
    }
    if (!/^https?:\/\/|^data:image\//i.test(trimmed)) {
      setUploadError('URL gambar harus diawali http:// atau https://.');
      return;
    }
    setPreviewUrl(trimmed);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto">
        <div className="h-1.5 w-full bg-four-colors" />
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="photo-modal-title" className="font-display text-lg font-bold text-slate-900">
            Pengaturan Foto Profil Pendidik
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal foto profil"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Kartu Pratinjau Foto Langsung */}
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-yellow-400 ring-2 ring-orange-500 bg-slate-200 shadow-md">
              <img
                src={previewUrl || DEFAULT_GURU_PHOTO}
                alt="Pratinjau foto profil guru"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_GURU_PHOTO;
                }}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-bold text-slate-900">Pratinjau Foto Profil Header</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Foto tersimpan otomatis di perangkat Anda dan tampil pada Header Generator RPM.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(DEFAULT_GURU_PHOTO);
                  setUploadError('');
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Kembalikan ke Foto Asli (Guru Gesma)
              </button>
            </div>
          </div>

          {/* 3 Tab Navigasi */}
          <div role="tablist" className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'upload'}
              onClick={() => setActiveTab('upload')}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'upload'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              Unggah dari Perangkat
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'avatar'}
              onClick={() => setActiveTab('avatar')}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'avatar'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Pilihan Avatar Guru
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'url'}
              onClick={() => setActiveTab('url')}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'url'
                  ? 'bg-white text-orange-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="h-3.5 w-3.5" />
              Tautan URL
            </button>
          </div>

          {uploadError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700">
              {uploadError}
            </div>
          )}

          {/* Tab 1: Unggah */}
          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processFile(file);
              }}
              className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'
              }`}
            >
              <Upload className="mx-auto h-8 w-8 text-blue-600 mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                Seret &amp; letakkan foto di sini, atau pilih dari perangkat
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Format: JPG, PNG, WebP, atau GIF (Maksimal 5 MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Pilih File Foto
              </button>
            </div>
          )}

          {/* Tab 2: 6 Preset Avatar Guru */}
          {activeTab === 'avatar' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AVATAR_PRESETS.map((avatar) => {
                const isSelected = previewUrl === avatar.url;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setPreviewUrl(avatar.url)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.label}
                      referrerPolicy="no-referrer"
                      className="h-16 w-16 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{avatar.label}</p>
                      <p className="text-[11px] text-slate-500">{avatar.category}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 3: Tautan URL */}
          {activeTab === 'url' && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label htmlFor="photo-url-input" className="block text-xs font-semibold text-slate-700">
                Masukkan URL Gambar Online
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="photo-url-input"
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://contoh.sch.id/foto-guru.jpg"
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600 whitespace-nowrap"
                >
                  <Check className="h-3.5 w-3.5" />
                  Terapkan
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onSavePhoto(previewUrl);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <UserCheck className="h-4 w-4" />
            Simpan Foto Profil
          </button>
        </div>
      </div>
    </div>
  );
};
