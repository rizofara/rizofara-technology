import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Konfirmasi Hapus',
  message = 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  type = 'danger',
  isLoading = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  const busy = isLoading || loading;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0B1929] border border-slate-200 dark:border-[#183247] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 text-left">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                type === 'danger'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
              }`}
            >
              {type === 'danger' ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-[#F1F5F9] leading-snug">{title}</h3>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">
                Peringatan Sistem
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#06111F] hover:bg-slate-200 dark:hover:bg-[#183247] text-slate-500 dark:text-[#94A3B8] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed mb-6 bg-slate-50 dark:bg-[#06111F] p-3.5 rounded-2xl border border-slate-100 dark:border-[#183247]">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#06111F] hover:bg-slate-200 dark:hover:bg-[#183247] border border-slate-200 dark:border-[#183247] text-slate-700 dark:text-[#F1F5F9] font-bold text-xs transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 transition cursor-pointer"
          >
            {busy ? (
              <span>Memproses...</span>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
