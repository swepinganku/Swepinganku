import { Patient } from '../types';
import { formatKamarOrBed, isBedRoom } from '../data/constants';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

interface DeleteConfirmModalProps {
  patient: Patient | null;
  division: string;
  date: string;
  onClose: () => void;
  onConfirm: (patient: Patient) => void;
}

export function DeleteConfirmModal({
  patient,
  division,
  onClose,
  onConfirm
}: DeleteConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!patient) return null;

  const formattedLocation = formatKamarOrBed(patient.room, patient.kamar);
  const isBed = isBedRoom(patient.room);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <h3 id="delete-dialog-title" className="text-base font-bold text-slate-900">
            Hapus Pasien dari Daftar?
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Data pasien berikut akan dihapus dari daftar sweeping Divisi <b>{division}</b> pada hari ini:
          </p>

          {/* Patient Card Preview */}
          <div className="mt-3.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sm text-slate-900">{patient.name}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  isBed
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-slate-200/80 text-slate-700 border-slate-300'
                }`}
              >
                {formattedLocation}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                RM: {patient.rm}
              </span>
              <span>·</span>
              <span>DPJP: {patient.dpjp}</span>
            </div>
            {patient.dx && (
              <p className="text-[11px] text-slate-500 line-clamp-2 pt-1 border-t border-slate-200/60">
                Dx: {patient.dx}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3 p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Tindakan ini tidak dapat dibatalkan setelah data disimpan.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 transition-colors cursor-pointer text-center min-h-[42px]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(patient)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm transition-all cursor-pointer min-h-[42px]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Ya, Hapus Pasien</span>
          </button>
        </div>
      </div>
    </div>
  );
}
