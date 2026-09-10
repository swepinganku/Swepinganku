import { Patient } from '../types';
import { isBedRoom, formatKamarOrBed } from '../data/constants';
import { Edit2, Trash2, Stethoscope, Share2, AlertCircle } from 'lucide-react';

interface PatientCardProps {
  key?: string;
  patient: Patient;
  onEdit: () => void;
  onDelete: () => void;
  onQuickShare?: () => void;
}

export function PatientCard({ patient, onEdit, onDelete, onQuickShare }: PatientCardProps) {
  const isMale = patient.jk === 'L';
  const isBed = isBedRoom(patient.room);
  const formattedLocation = formatKamarOrBed(patient.room, patient.kamar);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        {/* Header with Name & Room */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-bold text-sm text-slate-900 leading-snug">
              {patient.name}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isMale
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {patient.jk} · {patient.age || 'Usia -'}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                RM: {patient.rm}
              </span>
            </div>
          </div>

          <span
            className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg border ${
              isBed
                ? 'bg-purple-50 text-purple-800 border-purple-200 font-mono'
                : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}
            title={isBed ? `Format Bed (${patient.room})` : `Kamar Pasien`}
          >
            {formattedLocation}
          </span>
        </div>

        {/* DPJP & Diagnosis */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{patient.dpjp}</span>
          </div>
          <div className="text-slate-800 font-normal bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-[11px] leading-relaxed whitespace-pre-wrap">
            {patient.dx || 'Diagnosis klinis belum diisi.'}
          </div>
        </div>
      </div>

      {/* Footer / Status & Actions */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        {patient.status && patient.status !== 'Masih Rawat' ? (
          <span
            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
              patient.status === 'ACC KRS'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : patient.status === 'Pulang'
                ? 'bg-slate-200 text-slate-700'
                : 'bg-purple-100 text-purple-800'
            }`}
          >
            {patient.status}
          </span>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1">
          {onQuickShare && (
            <button
              type="button"
              onClick={onQuickShare}
              className="min-w-[36px] min-h-[36px] p-2 sm:p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
              title="Salin Data Pasien Ini"
              aria-label="Salin data pasien"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="min-w-[36px] min-h-[36px] p-2 sm:p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            title="Edit Pasien"
            aria-label="Edit data pasien"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="min-w-[36px] min-h-[36px] p-2 sm:p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            title="Hapus Pasien"
            aria-label={`Hapus data pasien ${patient.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
