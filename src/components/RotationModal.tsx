import { useState, useEffect } from 'react';
import { RotationWeek } from '../types';
import { DIVISIONS } from '../data/constants';
import { parseDateSafely, formatDateIso, shiftDateByDays, today } from '../utils/storage';
import {
  CalendarRange,
  X,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
  CalendarCheck,
  Layers
} from 'lucide-react';

interface RotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: RotationWeek[];
  onSaveRoster: (newRoster: RotationWeek[]) => void;
  currentDate: string;
  onJumpToWeek: (week: RotationWeek) => void;
}

export function RotationModal({
  isOpen,
  onClose,
  roster,
  onSaveRoster,
  currentDate,
  onJumpToWeek
}: RotationModalProps) {
  const [draftRoster, setDraftRoster] = useState<RotationWeek[]>([]);
  const todayDate = today();

  useEffect(() => {
    if (isOpen) {
      setDraftRoster(JSON.parse(JSON.stringify(roster)));
    }
  }, [isOpen, roster]);

  if (!isOpen) return null;

  const handleUpdateField = (
    index: number,
    field: keyof RotationWeek,
    value: string | number
  ) => {
    setDraftRoster((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value
      };
      // If start date changed, automatically set end date to +6 days if user hasn't customized
      if (field === 'startDate' && typeof value === 'string' && value) {
        copy[index].endDate = shiftDateByDays(value, 6);
      }
      return copy;
    });
  };

  // Auto-chain all weeks sequentially from a specific week's start date
  const handleAutoChainDates = (fromIndex: number = 0) => {
    setDraftRoster((prev) => {
      const copy = [...prev];
      for (let i = fromIndex; i < copy.length; i++) {
        if (i === 0 && !copy[0].startDate) {
          copy[0].startDate = todayDate;
        }
        if (i > 0) {
          const prevEnd = copy[i - 1].endDate;
          copy[i].startDate = shiftDateByDays(prevEnd, 1);
        }
        copy[i].endDate = shiftDateByDays(copy[i].startDate, 6);
      }
      return copy;
    });
  };

  const handleSave = () => {
    onSaveRoster(draftRoster);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Atur Jadwal Rotasi Divisi Bedah</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  10 Minggu
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Petakan tanggal dan divisi stase untuk <b>Minggu 7, 8, 9, dan 10</b>. Divisi sweeping akan otomatis sinkron dengan tanggal aktif.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Helper Banner */}
        <div className="px-4 sm:px-5 py-2.5 bg-blue-50/70 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Anda saat ini berada di <b>Minggu ke-6</b>. Tentukan urutan divisi dan tanggal mulai untuk 4 minggu ke depan.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleAutoChainDates(0)}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-100/60 border border-blue-200 text-blue-700 font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-2xs ml-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Otomatis Sambung 7 Hari per Pekan</span>
          </button>
        </div>

        {/* Weeks List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {(draftRoster || []).map((w, index) => {
            const isCurrentWeek =
              currentDate >= w.startDate && currentDate <= w.endDate;
            const isUpcoming = w.weekNumber >= 7;
            const isCompleted = w.weekNumber < 6;

            return (
              <div
                key={w.id || index}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrentWeek
                    ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                    : isUpcoming
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-50/60 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                        isCurrentWeek
                          ? 'bg-blue-600 text-white border-blue-700'
                          : isUpcoming
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      Minggu {w.weekNumber}
                    </span>
                    {isCurrentWeek && (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        Sedang Berlangsung Saat Ini
                      </span>
                    )}
                    {isUpcoming && !isCurrentWeek && (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {w.weekNumber === 7
                          ? 'Pekan Berikutnya'
                          : `Sisa ${w.weekNumber - 6} Pekan`}
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[11px] font-medium text-slate-500">
                        (Pekan Sebelumnya)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onJumpToWeek(w);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    <span>Lompat ke Pekan Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  {/* Division Select */}
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Divisi Stase Bedah
                    </label>
                    <select
                      value={w.division}
                      onChange={(e) =>
                        handleUpdateField(index, 'division', e.target.value)
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      {(DIVISIONS || []).map((div) => (
                        <option key={div} value={div}>
                          {div}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Tanggal Mulai (Senin)
                    </label>
                    <input
                      type="date"
                      value={w.startDate}
                      onChange={(e) =>
                        handleUpdateField(index, 'startDate', e.target.value)
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* End Date */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Tanggal Selesai (Minggu)
                    </label>
                    <input
                      type="date"
                      value={w.endDate}
                      onChange={(e) =>
                        handleUpdateField(index, 'endDate', e.target.value)
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Quick Helper Button */}
                  <div className="sm:col-span-1 flex items-end justify-center pt-4 sm:pt-0">
                    <button
                      type="button"
                      title="Set 7 hari dari tanggal mulai pekan ini"
                      onClick={() => {
                        if (w.startDate) {
                          handleUpdateField(
                            index,
                            'endDate',
                            shiftDateByDays(w.startDate, 6)
                          );
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <CalendarCheck className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-50/50 rounded-b-2xl shrink-0">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Total <b>{draftRoster.length} pekan</b> rotasi tersimpan
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 transition-colors cursor-pointer text-center min-h-[42px]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer min-h-[42px]"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Jadwal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
