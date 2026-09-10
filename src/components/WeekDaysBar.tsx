import { useMemo, useState } from 'react';
import { getWeekDays, shiftDateByDays, getStorageKey, today, formatIndonesianDate } from '../utils/storage';
import { ChevronLeft, ChevronRight, Calendar, Copy, CheckCircle2, ArrowRight } from 'lucide-react';

interface WeekDaysBarProps {
  currentDate: string;
  division: string;
  currentPatientCount: number;
  onSelectDate: (date: string) => void;
  onCopyFromDay?: (fromDate: string, dayName: string) => void;
}

export function WeekDaysBar({
  currentDate,
  division,
  currentPatientCount,
  onSelectDate,
  onCopyFromDay
}: WeekDaysBarProps) {
  const todayDate = today();
  const effectiveDate = currentDate || todayDate;
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied'>('idle');

  const weekDays = useMemo(() => {
    return getWeekDays(effectiveDate, effectiveDate);
  }, [effectiveDate]);

  // Compute patient count for each day of this week in this division
  const patientCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    weekDays.forEach((w) => {
      if (w.date === effectiveDate) {
        counts[w.date] = currentPatientCount;
        return;
      }
      const raw = localStorage.getItem(getStorageKey(w.date, division));
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          counts[w.date] = Array.isArray(parsed) ? parsed.length : 0;
        } catch {
          counts[w.date] = 0;
        }
      } else {
        counts[w.date] = 0;
      }
    });
    return counts;
  }, [weekDays, effectiveDate, division, currentPatientCount]);

  const startDateStr = weekDays[0]?.date || '';
  const endDateStr = weekDays[6]?.date || '';

  const handlePrevWeek = () => {
    const newDate = shiftDateByDays(effectiveDate, -7);
    onSelectDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = shiftDateByDays(effectiveDate, 7);
    onSelectDate(newDate);
  };

  const handleTodayWeek = () => {
    onSelectDate(todayDate);
  };

  const isCurrentWeek = weekDays.some((w) => w.date === todayDate);

  // Check if current day is empty and find the closest previous day with patients
  const currentIdx = weekDays.findIndex((w) => w.date === effectiveDate);
  const currentDayName = currentIdx >= 0 ? weekDays[currentIdx].dayName : 'Hari ini';

  let targetPreviousDay: { date: string; dayName: string; count: number } | null = null;
  if (currentIdx > 0) {
    for (let i = currentIdx - 1; i >= 0; i--) {
      const dDate = weekDays[i].date;
      const cnt = patientCounts[dDate] || 0;
      if (cnt > 0) {
        targetPreviousDay = { date: dDate, dayName: weekDays[i].dayName, count: cnt };
        break;
      }
    }
    // Fallback to immediate previous day if count was 0 or not yet counted
    if (!targetPreviousDay && currentIdx > 0) {
      const prev = weekDays[currentIdx - 1];
      const raw = localStorage.getItem(getStorageKey(prev.date, division));
      let cnt = patientCounts[prev.date] || 0;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) cnt = parsed.length;
        } catch {}
      }
      if (cnt > 0) {
        targetPreviousDay = { date: prev.date, dayName: prev.dayName, count: cnt };
      }
    }
  } else if (currentIdx === 0) {
    // If it's Monday, check Sunday before Monday
    const prevSundayDate = shiftDateByDays(weekDays[0].date, -1);
    const raw = localStorage.getItem(getStorageKey(prevSundayDate, division));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          targetPreviousDay = { date: prevSundayDate, dayName: 'Minggu Lalu', count: parsed.length };
        }
      } catch {}
    }
  }

  const showCopyPrompt = currentPatientCount === 0 && targetPreviousDay && targetPreviousDay.count > 0 && Boolean(onCopyFromDay);

  const handleCopyClick = () => {
    if (!targetPreviousDay || !onCopyFromDay) return;
    setCopyStatus('copying');
    onCopyFromDay(targetPreviousDay.date, targetPreviousDay.dayName);
    setTimeout(() => {
      setCopyStatus('copied');
      setTimeout(() => {
        setCopyStatus('idle');
      }, 3500);
    }, 150);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
      {/* Header with Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Jadwal Sweeping 1 Minggu ({division})
              </h3>
              {isCurrentWeek && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                  Minggu Berjalan
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Senin s.d. Minggu: {formatIndonesianDate(startDateStr, { day: '2-digit', month: 'short' })} – {formatIndonesianDate(endDateStr, { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Week navigation buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={handlePrevWeek}
            title="Minggu Sebelumnya"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleTodayWeek}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              isCurrentWeek
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={handleNextWeek}
            title="Minggu Berikutnya"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row of 7 Days: Senin to Minggu */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {(weekDays || []).map((w) => {
          const count = patientCounts[w.date] || 0;
          const isSelected = w.date === currentDate;

          return (
            <button
              key={w.date}
              type="button"
              onClick={() => onSelectDate(w.date)}
              className={`flex flex-col items-center justify-between p-1 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer relative overflow-hidden min-h-[64px] ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                  : w.isToday
                  ? 'bg-emerald-50/60 border-emerald-300 text-slate-800 hover:bg-emerald-100/50'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
              }`}
            >
              {/* Today dot */}
              {w.isToday && !isSelected && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" title="Hari ini" />
              )}

              {/* Day Name (Senin, Selasa, etc.) */}
              <span className={`text-[10px] sm:text-xs font-bold leading-tight ${
                isSelected ? 'text-white' : 'text-slate-800'
              }`}>
                <span className="hidden sm:inline">{w.dayName}</span>
                <span className="sm:hidden">{w.shortName}</span>
              </span>

              {/* Date (e.g., 07 Sep) */}
              <span className={`text-[9px] sm:text-[11px] font-medium leading-none my-0.5 ${
                isSelected ? 'text-blue-100' : 'text-slate-500'
              }`}>
                {w.dayOfMonth} <span className="hidden sm:inline">{w.monthName}</span>
              </span>

              {/* Patient Count Badge */}
              <span
                className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.2 rounded-full mt-0.5 ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : count > 0
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-200/60 text-slate-500'
                }`}
              >
                {count}<span className="hidden sm:inline"> pas</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Helper notice if current day has 0 patients but previous day has patients */}
      {showCopyPrompt && targetPreviousDay && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="leading-relaxed">
              Belum ada pasien terdata di hari <b>{currentDayName}</b>. Ingin salin daftar pasien dari <b>{targetPreviousDay.dayName}</b> ({targetPreviousDay.count} pasien)?
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyClick}
            disabled={copyStatus === 'copying'}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer ml-auto shrink-0 ${
              copyStatus === 'copied'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/20'
                : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white'
            }`}
          >
            {copyStatus === 'copied' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                <span>Tersalin ({targetPreviousDay.count} pasien)</span>
              </>
            ) : copyStatus === 'copying' ? (
              <>
                <Copy className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Menyalin...</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 shrink-0" />
                <span>Salin dari {targetPreviousDay.dayName} ({targetPreviousDay.count} pasien)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
