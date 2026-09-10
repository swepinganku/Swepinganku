import { useMemo } from 'react';
import { RotationWeek } from '../types';
import { formatIndonesianDate } from '../utils/storage';
import {
  CalendarClock,
  Layers,
  ChevronRight,
  Compass,
  CheckCircle2,
  CalendarRange
} from 'lucide-react';

interface RotationBannerProps {
  currentDate: string;
  currentDivision: string;
  roster: RotationWeek[];
  onSelectWeek: (week: RotationWeek) => void;
  onOpenRosterModal: () => void;
}

export function RotationBanner({
  currentDate,
  currentDivision,
  roster,
  onSelectWeek,
  onOpenRosterModal
}: RotationBannerProps) {
  // Find current week matching the selected date
  const currentWeek = useMemo(() => {
    return (roster || []).find(
      (w) => currentDate >= w.startDate && currentDate <= w.endDate
    );
  }, [roster, currentDate]);

  // Upcoming weeks (Week 7, 8, 9, 10 or weeks >= 7)
  const upcomingWeeks = useMemo(() => {
    return (roster || []).filter((w) => w.weekNumber >= 7);
  }, [roster]);

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
      {/* Left: Current Active Week Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-xs sm:text-sm text-white tracking-wide">
              {currentWeek ? `Minggu ${currentWeek.weekNumber} dari 10` : 'Jadwal Rotasi Bedah'}
            </span>
            {currentWeek && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                {currentWeek.division}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1.5 flex-wrap">
            {currentWeek ? (
              <>
                <span>
                  {formatIndonesianDate(currentWeek.startDate, { day: '2-digit', month: 'short' })} –{' '}
                  {formatIndonesianDate(currentWeek.endDate, { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Auto-sync aktif
                </span>
              </>
            ) : (
              <span>Tanggal di luar rentang jadwal rotasi 10 pekan</span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Quick Jumps for Upcoming Weeks 7-10 & Settings Button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 shrink-0">
            Lompat:
          </span>
          {(upcomingWeeks || []).map((w) => {
            const isSelected =
              currentDate >= w.startDate && currentDate <= w.endDate;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => onSelectWeek(w)}
                title={`Lompat ke Minggu ${w.weekNumber}: ${w.division} (${w.startDate})`}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0 min-h-[36px] ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <span>M{w.weekNumber}:</span>
                <span className="max-w-[75px] sm:max-w-[90px] truncate">
                  {w.division.replace(/^Bedah\s*/i, '')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Opener Button */}
        <button
          type="button"
          onClick={onOpenRosterModal}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors shadow-xs cursor-pointer shrink-0 min-h-[38px] w-full sm:w-auto"
        >
          <CalendarClock className="w-4 h-4 text-blue-600" />
          <span>Atur Jadwal Rotasi</span>
        </button>
      </div>
    </div>
  );
}
