import { useState, useEffect } from 'react';
import { computeWeeklyRecap, exportWeeklyCSV, parseDateSafely, formatDateIso } from '../utils/storage';
import { WeeklyRow } from '../types';
import { formatKamarOrBed } from '../data/constants';
import { X, Download, RefreshCw, CalendarRange, Users } from 'lucide-react';

interface WeeklyModalProps {
  isOpen: boolean;
  currentDate: string;
  division: string;
  onClose: () => void;
}

export function WeeklyModal({ isOpen, currentDate, division, onClose }: WeeklyModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rows, setRows] = useState<WeeklyRow[]>([]);
  const [dates, setDates] = useState<string[]>([]);

  useEffect(() => {
    if (!currentDate) return;
    const d = parseDateSafely(currentDate);
    const day = d.getDay();
    const diff = (day + 6) % 7;
    const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
    const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);

    const s = formatDateIso(mon);
    const e = formatDateIso(sun);
    setStartDate(s);
    setEndDate(e);

    const res = computeWeeklyRecap(s, e, division);
    setRows(res.rows);
    setDates(res.dates);
  }, [currentDate, division, isOpen]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!startDate || !endDate) return;
    const res = computeWeeklyRecap(startDate, endDate, division);
    setRows(res.rows);
    setDates(res.dates);
  };

  const handleDownloadCSV = () => {
    exportWeeklyCSV(rows, dates, division, startDate, endDate);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Rekapitulasi Mingguan Pasien</h2>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                Divisi {division} · Pelacakan harian pasien berdasarkan Nomor Rekam Medis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Filters */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 items-end shrink-0">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Awal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[38px]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[38px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer min-h-[38px]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Hitung Rekap</span>
            </button>
            {rows.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer min-h-[38px]"
                title="Unduh file Excel CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Table summary */}
        <div className="mt-4 flex-1 overflow-auto border border-slate-200 rounded-xl bg-white">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Tidak ada riwayat pasien</p>
              <p className="text-slate-400 mt-0.5">Belum ada sweeping tersimpan pada rentang tanggal ini untuk {division}.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 sticky top-0">
                  <th className="p-2.5 font-bold">No</th>
                  <th className="p-2.5 font-bold">No. RM</th>
                  <th className="p-2.5 font-bold">Nama Pasien</th>
                  <th className="p-2.5 font-bold">JK</th>
                  <th className="p-2.5 font-bold">Usia</th>
                  <th className="p-2.5 font-bold">DPJP</th>
                  <th className="p-2.5 font-bold">Ruangan Terakhir</th>
                  <th className="p-2.5 font-bold">Diagnosis</th>
                  <th className="p-2.5 font-bold">Status</th>
                  {(dates || []).map((dt) => {
                    const d = parseDateSafely(dt);
                    let dayLabel = dt;
                    try {
                      dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit' });
                    } catch {
                      dayLabel = dt;
                    }
                    return (
                      <th key={dt} className="p-2.5 font-bold text-center border-l border-slate-200">
                        {dayLabel}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(rows || []).map((row, idx) => (
                  <tr key={row.rm} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-semibold text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-semibold text-blue-700">{row.rm}</td>
                    <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">{row.name}</td>
                    <td className="p-2.5">{row.jk}</td>
                    <td className="p-2.5 whitespace-nowrap">{row.age}</td>
                    <td className="p-2.5 text-slate-700 whitespace-nowrap">{row.dpjp}</td>
                    <td className="p-2.5 font-medium whitespace-nowrap">
                      {row.lastRoom} {row.lastKamar ? `/ ${formatKamarOrBed(row.lastRoom, row.lastKamar)}` : ''}
                    </td>
                    <td className="p-2.5 max-w-xs truncate text-slate-600" title={row.dx}>
                      {row.dx}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {row.status}
                      </span>
                    </td>
                    {(dates || []).map((dt) => (
                      <td key={dt} className="p-2.5 text-center font-mono text-[11px] border-l border-slate-100 whitespace-nowrap">
                        {row.days[dt] ? (
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {row.days[dt]}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
