import { useState } from 'react';
import { Patient } from '../types';
import { generateReportText } from '../utils/storage';
import { DEFAULT_ROOMS } from '../data/constants';
import { X, Copy, Check, Send, MessageSquare } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  mode: 'dpjp' | 'all';
  date: string;
  division: string;
  koasName: string;
  selectedDpjp: string;
  patients: Patient[];
  onClose: () => void;
}

export function ReportModal({
  isOpen,
  mode,
  date,
  division,
  koasName,
  selectedDpjp,
  patients,
  onClose
}: ReportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const reportText = generateReportText({
    mode,
    date,
    division,
    koasName,
    selectedDpjp,
    patients,
    allRooms: DEFAULT_ROOMS
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Gagal menyalin otomatis. Silakan blok dan salin teks secara manual.');
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(reportText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {mode === 'dpjp' ? 'Laporan WhatsApp per-DPJP' : 'Laporan WhatsApp Keseluruhan Divisi'}
              </h2>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                Format baku laporan sweeping harian dokter muda bedah
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

        {/* Monospace Code Preview */}
        <div className="mt-3 flex-1 overflow-auto bg-slate-900 text-slate-200 p-3.5 sm:p-4 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap selection:bg-blue-600 selection:text-white border border-slate-800">
          {reportText}
        </div>

        {/* Footer Actions */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <span className="text-xs text-slate-500 text-center sm:text-left">
            {copied ? (
              <span className="text-emerald-600 font-semibold flex items-center justify-center sm:justify-start gap-1">
                <Check className="w-3.5 h-3.5" /> Teks tersalin ke clipboard!
              </span>
            ) : (
              'Siap dikirim ke WhatsApp Group / DPJP'
            )}
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer min-h-[42px]"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin' : 'Copy Teks'}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer min-h-[42px]"
            >
              <Send className="w-4 h-4" />
              <span>Buka WA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
