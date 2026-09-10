import {
  Search,
  CalendarRange,
  Calendar,
  KeyRound,
  Users,
  GitPullRequest,
  UserPlus,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { DivisionTeam } from '../types';

interface ControlsBarProps {
  date: string;
  division: string;
  divisions: string[];
  onDateChange: (date: string) => void;
  onDivisionChange: (division: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenReport?: (mode: 'dpjp' | 'all') => void;
  onOpenWeekly: () => void;
  onOpenRoster?: () => void;
  onOpenDocumentView?: () => void;
  activeTeam?: DivisionTeam;
  onOpenTeamModal?: () => void;
  onHandoverPatients?: () => void;
  onAddPatient?: () => void;
}

export function ControlsBar({
  date,
  division,
  divisions,
  onDateChange,
  onDivisionChange,
  searchQuery,
  onSearchChange,
  onOpenReport,
  onOpenWeekly,
  activeTeam,
  onOpenTeamModal,
  onHandoverPatients,
  onAddPatient
}: ControlsBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-xs space-y-4">
      {/* Team Info Banner for Koas Partners */}
      {activeTeam && onOpenTeamModal && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-slate-50 border border-blue-200/80 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900">
                  {activeTeam.teamName || activeTeam.division}
                </span>
                <span className="font-mono text-[11px] font-extrabold bg-white text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                  PIN: {activeTeam.teamCode}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{activeTeam.members?.join(', ') || '1 Koas'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Partner yang memasukkan PIN <b>{activeTeam.teamCode}</b> otomatis terhubung dan berbagi daftar pasien yang sama.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            {onHandoverPatients && (
              <button
                type="button"
                onClick={onHandoverPatients}
                className="flex-1 sm:flex-initial px-3 py-2 text-xs font-bold bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer min-h-[38px]"
                title="Tarik pasien berstatus Masih Rawat dari hari kemarin ke hari ini"
              >
                <GitPullRequest className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Operan Pasien Kemarin</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenTeamModal}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer min-h-[38px]"
            >
              <span>Ganti Tim / PIN</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        {/* Date Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Tanggal Sweeping</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 sm:py-2 text-sm sm:text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer min-h-[42px]"
          />
        </div>

        {/* Division Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Divisi Bedah
          </label>
          <select
            value={division}
            onChange={(e) => onDivisionChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 sm:py-2 text-sm sm:text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer min-h-[42px]"
          >
            {(divisions || []).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Search Field */}
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Cari Pasien (Nama, No. RM, Diagnosis, Ruangan, Kamar)
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 sm:top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Ketik nama pasien / no RM / diagnosis..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 sm:py-2 text-sm sm:text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[42px]"
            />
          </div>
        </div>
      </div>

      {/* Action Row - Mobile and Desktop Optimized */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Aksi &amp; Generator Laporan:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Tambah Pasien button */}
          {onAddPatient && (
            <button
              type="button"
              onClick={onAddPatient}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer min-h-[40px]"
              title="Tambah Pasien Baru"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>+ Tambah Pasien</span>
            </button>
          )}

          {/* Laporan WhatsApp button */}
          {onOpenReport && (
            <button
              type="button"
              onClick={() => onOpenReport('dpjp')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer min-h-[40px]"
              title="Buat dan Format Teks Laporan Sweeping untuk WhatsApp"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Format Laporan WA</span>
            </button>
          )}

          {/* Rekap Mingguan */}
          <button
            type="button"
            onClick={onOpenWeekly}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer min-h-[40px]"
            title="Lihat Rekapitulasi Mingguan dan Ekspor Excel/CSV"
          >
            <CalendarRange className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>Rekap Mingguan &amp; CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
