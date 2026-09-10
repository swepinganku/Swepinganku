import { useState } from 'react';
import { Stethoscope, UserCheck, Edit2, Check, FileText, LayoutGrid } from 'lucide-react';
import { PageMode, DivisionTeam } from '../types';

interface TopbarProps {
  koasName: string;
  onUpdateKoasName: (name: string) => void;
  onAddPatient?: () => void;
  pageMode?: PageMode;
  onPageModeChange?: (mode: PageMode) => void;
  onOpenNextjsModal?: () => void;
  activeTeam?: DivisionTeam;
  onOpenTeamModal?: () => void;
}

export function Topbar({
  koasName,
  onUpdateKoasName,
  pageMode = 'dashboard',
  onPageModeChange,
}: TopbarProps) {
  const [isEditingKoas, setIsEditingKoas] = useState(false);
  const [tempName, setTempName] = useState(koasName);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        {/* Brand & Koas row */}
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                  Sweepinganku
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 line-clamp-1">
                Surgical Sweeping &amp; WA Report
              </div>
            </div>
          </div>

          {/* Koas Profile Pill on mobile or desktop */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs shrink-0">
            <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            {isEditingKoas ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Nama Koas..."
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 w-24 sm:w-32"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    onUpdateKoasName(tempName || 'dr. Muda / Koas Bedah');
                    setIsEditingKoas(false);
                  }}
                  className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg cursor-pointer"
                  title="Simpan"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-700 max-w-[100px] sm:max-w-[140px] truncate">
                  {koasName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTempName(koasName);
                    setIsEditingKoas(true);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                  title="Ganti Nama untuk Laporan WA"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View Mode Switcher (Kartu vs Dokumen) - ALWAYS VISIBLE ON BOTH MOBILE & DESKTOP */}
        {onPageModeChange && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onPageModeChange('dashboard')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 sm:py-1.5 px-3 rounded-lg transition-all cursor-pointer min-h-[36px] ${
                pageMode === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 active:bg-slate-200/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span>Kartu Pasien</span>
            </button>
            <button
              type="button"
              onClick={() => onPageModeChange('document')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 sm:py-1.5 px-3 rounded-lg transition-all cursor-pointer min-h-[36px] ${
                pageMode === 'document'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 active:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Dokumen Sweeping</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
