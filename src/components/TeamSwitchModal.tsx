import React, { useState, useEffect } from 'react';
import { DivisionTeam } from '../types';
import { DIVISIONS, DEFAULT_TEAM_CODES, getDefaultTeamCode } from '../data/constants';
import {
  Users,
  KeyRound,
  Copy,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Share2,
  RefreshCw,
  UserCheck,
  Layers,
  ArrowLeftRight
} from 'lucide-react';

interface TeamSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeam: DivisionTeam;
  currentDivision: string;
  koasName: string;
  onSwitchTeam: (newTeam: DivisionTeam, carryOverFromYesterday: boolean) => void;
}

export function TeamSwitchModal({
  isOpen,
  onClose,
  currentTeam,
  currentDivision,
  koasName,
  onSwitchTeam
}: TeamSwitchModalProps) {
  const [selectedDivision, setSelectedDivision] = useState<string>(currentDivision);
  const [teamCodeInput, setTeamCodeInput] = useState<string>(currentTeam.teamCode || '');
  const [teamNameInput, setTeamNameInput] = useState<string>(currentTeam.teamName || '');
  const [memberNameInput, setMemberNameInput] = useState<string>(koasName);
  const [carryOver, setCarryOver] = useState<boolean>(true);
  const [copiedPin, setCopiedPin] = useState<boolean>(false);
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'switch' | 'directory'>('switch');

  useEffect(() => {
    if (isOpen) {
      setSelectedDivision(currentDivision);
      setTeamCodeInput(currentTeam.teamCode || getDefaultTeamCode(currentDivision));
      setTeamNameInput(currentTeam.teamName || `Tim ${currentDivision}`);
      setMemberNameInput(koasName);
    }
  }, [isOpen, currentDivision, currentTeam, koasName]);

  if (!isOpen) return null;

  // Handle division change in dropdown
  const handleDivisionChange = (newDiv: string) => {
    setSelectedDivision(newDiv);
    const defaultCode = getDefaultTeamCode(newDiv);
    setTeamCodeInput(defaultCode);
    setTeamNameInput(`Tim ${newDiv}`);
  };

  // Generate random PIN
  const handleGenerateRandomPin = () => {
    const prefix = selectedDivision.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    const newCode = `${prefix}-${randomNum}`;
    setTeamCodeInput(newCode);
  };

  // Submit switch
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = teamCodeInput.trim().toUpperCase() || getDefaultTeamCode(selectedDivision);
    const cleanName = teamNameInput.trim() || `Tim ${selectedDivision}`;
    const cleanMember = memberNameInput.trim() || koasName;

    const existingMembers = currentTeam.teamCode === cleanCode ? currentTeam.members : [];
    const updatedMembers = Array.from(new Set([...existingMembers, cleanMember])).filter(Boolean);

    const updatedTeam: DivisionTeam = {
      teamCode: cleanCode,
      division: selectedDivision,
      teamName: cleanName,
      members: updatedMembers.length > 0 ? updatedMembers : [cleanMember],
      lastUpdated: new Date().toISOString()
    };

    onSwitchTeam(updatedTeam, carryOver);
    onClose();
  };

  // Copy PIN only
  const handleCopyPin = async () => {
    try {
      await navigator.clipboard.writeText(currentTeam.teamCode);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    } catch {}
  };

  // Copy WhatsApp invite text for partner
  const handleCopyInvite = async () => {
    const text = `Halo partner! 👋\nSaya sudah membuat bilik tim untuk sweeping rawat inap Divisi *${currentTeam.division}* di Sweepinganku.\n\n🔑 *Kode Tim / PIN:* \`${currentTeam.teamCode}\`\n\nYuk buka aplikasi Sweepinganku dan masukkan Kode Tim di atas agar kita bisa akses dan edit daftar pasien yang sama secara real-time! 🩺`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                Ganti Tim / Divisi Stase Bedah
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                Berbagi akses daftar pasien yang sama dengan partner mingguan Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* Current Active Team Card */}
          <div className="my-3.5 p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Tim &amp; Divisi Aktif Saat Ini
              </span>
              <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-md bg-white border border-blue-200 text-blue-700 shadow-2xs">
                PIN: {currentTeam.teamCode}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div>
                <div className="font-extrabold text-slate-900 text-sm">
                  {currentTeam.teamName} ({currentTeam.division})
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Partner:{' '}
                    <b>{currentTeam.members?.join(', ') || koasName}</b>
                  </span>
                </div>
              </div>

              {/* Quick Share Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 border border-blue-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
                  title="Salin PIN ke Clipboard"
                >
                  {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedPin ? 'Tersalin' : 'Salin PIN'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer min-h-[36px]"
                  title="Salin teks ajakan untuk dikirim ke WA partner"
                >
                  {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedInvite ? 'Tersalin!' : 'Undang Partner (WA)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('switch')}
              className={`pb-2 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'switch'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Formulir Ganti Tim</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`pb-2 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'directory'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Daftar PIN Divisi</span>
            </button>
          </div>

          {activeTab === 'switch' ? (
            /* Form Ganti Tim */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Division Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Divisi Stase Tujuan *
                </label>
                <select
                  value={selectedDivision}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer min-h-[40px]"
                >
                  {(DIVISIONS || []).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Team PIN Code Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Kode Tim / PIN Divisi *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTeamCodeInput(getDefaultTeamCode(selectedDivision))}
                      className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                    >
                      PIN Standar
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={handleGenerateRandomPin}
                      className="text-[11px] text-slate-600 hover:text-blue-600 font-medium flex items-center gap-0.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Acak PIN
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={teamCodeInput}
                    onChange={(e) => setTeamCodeInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: DIGESTIF / UROLOGI / URO-101"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase min-h-[40px]"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Masukkan PIN yang sama dengan partner jaga Anda agar langsung melihat dan mengedit daftar pasien yang sama.
                </p>
              </div>

              {/* Nama Koas / Pengguna */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Anda (Dokter Muda / Koas) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={memberNameInput}
                    onChange={(e) => setMemberNameInput(e.target.value)}
                    placeholder="dr. Muda ..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium min-h-[40px]"
                  />
                </div>
              </div>

              {/* Handover / Operan Checkbox */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={carryOver}
                    onChange={(e) => setCarryOver(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-amber-900 block">
                      Bawa / Operan Pasien Aktif (Handover Pasien)
                    </span>
                    <span className="text-amber-700">
                      Otomatis salin pasien berstatus <b>Masih Rawat</b> dari hari kemarin ke tanggal hari ini di tim divisi ini.
                    </span>
                  </div>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors cursor-pointer text-center min-h-[42px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
                >
                  <span>Masuk &amp; Gabung Tim</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* Tab: Directory PIN Standar */
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Berikut adalah kode PIN default setiap divisi stase bedah. Anda bisa langsung klik salah satu untuk bergabung seketika:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1">
                {(DIVISIONS || []).map((div) => {
                  const code = DEFAULT_TEAM_CODES[div] || getDefaultTeamCode(div);
                  const isCurrent = currentTeam.division === div;

                  return (
                    <div
                      key={div}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-400'
                          : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {div}
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[11px] font-mono font-extrabold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                            {code}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] text-blue-700 font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">
                              Aktif
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDivision(div);
                          setTeamCodeInput(code);
                          setTeamNameInput(`Tim ${div}`);
                          setActiveTab('switch');
                        }}
                        className="mt-2.5 w-full py-1.5 text-center text-[11px] font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer min-h-[36px]"
                      >
                        Pilih Divisi Ini →
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setActiveTab('switch')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer py-2 inline-block"
                >
                  ← Kembali ke Formulir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
