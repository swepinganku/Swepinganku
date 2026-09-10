import { useState } from 'react';
import { NEXTJS_REPO_FILES, downloadNextjsProjectZip } from '../utils/nextjsRepoFiles';
import { NextJsFile } from '../types';
import {
  X,
  Download,
  Copy,
  Check,
  FolderGit2,
  FileCode,
  CheckCircle2,
  Terminal,
  Sparkles
} from 'lucide-react';

interface NextjsRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NextjsRepoModal({ isOpen, onClose }: NextjsRepoModalProps) {
  const [selectedFile, setSelectedFile] = useState<NextJsFile>(NEXTJS_REPO_FILES[2]); // Default to app/page.tsx
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Gagal menyalin kode. Silakan blok dan salin secara manual.');
    }
  };

  const handleDownloadZip = async () => {
    try {
      setDownloading(true);
      await downloadNextjsProjectZip();
    } catch (e) {
      alert('Gagal membuat file zip: ' + String(e));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xs">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Struktur Repositori Next.js App Router
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Siap Pakai & Deploy
                </span>
              </div>
              <p className="text-xs text-slate-500">
                File HTML Sweepinganku telah berhasil dikonversi ke struktur proyek Next.js 15 modern modular
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Banner with Direct ZIP Download */}
        <div className="mt-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200/70 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-slate-900">
                Unduh Repositori Lengkap Langsung (ZIP)
              </span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Berisi seluruh file konfigurasi (<code className="font-mono text-slate-800">package.json</code>, <code className="font-mono text-slate-800">app/page.tsx</code>, components, Tailwind, types, dsb.). Cukup ekstrak dan jalankan <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">npm install && npm run dev</code>.
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            className="shrink-0 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{downloading ? 'Membuat ZIP...' : 'Unduh Proyek (.ZIP)'}</span>
          </button>
        </div>

        {/* Code & File Explorer split view */}
        <div className="mt-3 flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 min-h-0 overflow-hidden">
          {/* File Tree List */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 overflow-y-auto flex flex-col max-h-36 md:max-h-none">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 px-1">
              File Proyek ({NEXTJS_REPO_FILES.length})
            </div>
            <div className="space-y-1">
              {NEXTJS_REPO_FILES.map((f) => {
                const isSelected = f.path === selectedFile.path;
                return (
                  <button
                    key={f.path}
                    type="button"
                    onClick={() => setSelectedFile(f)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between gap-1.5 transition-colors cursor-pointer min-h-[34px] ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                      <span className="truncate">{f.path}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[220px]">
            {/* Viewer Header */}
            <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="font-mono text-emerald-400 font-semibold truncate">
                  {selectedFile.path}
                </span>
                <span className="text-slate-500 text-[11px] hidden sm:inline truncate">
                  — {selectedFile.description}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="shrink-0 flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer min-h-[32px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 overflow-auto p-3.5 text-xs font-mono leading-relaxed text-slate-200 selection:bg-blue-600 selection:text-white">
              <pre className="whitespace-pre">{selectedFile.content}</pre>
            </div>
          </div>
        </div>

        {/* Quick run command guide */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="hidden sm:inline">Terminal:</span>
            <code className="bg-slate-100 text-slate-800 px-2 py-1 rounded font-mono font-semibold text-[11px]">
              npm install &amp;&amp; npm run dev
            </code>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer min-h-[40px]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
