import { useState, useEffect, FormEvent } from 'react';
import { Patient } from '../types';
import {
  MASTER_ROOMS,
  isBedRoom,
  normalizeRoomName,
  formatKamarOrBed,
  getPatientHonorific,
  parseAgeInYears,
  formatPatientNameWithHonorific
} from '../data/constants';
import { X, UserPlus, Save, Sparkles } from 'lucide-react';

interface PatientModalProps {
  isOpen: boolean;
  initialData: Patient | null;
  defaultDpjp: string;
  existingDpjps: string[];
  division?: string;
  divisionConsultants?: string[];
  onClose: () => void;
  onSave: (patient: Patient) => void;
}

export function PatientModal({
  isOpen,
  initialData,
  defaultDpjp,
  existingDpjps,
  division,
  divisionConsultants,
  onClose,
  onSave
}: PatientModalProps) {
  const [dpjp, setDpjp] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('IGD');
  const [isCustomRoom, setIsCustomRoom] = useState(false);
  const [customRoomName, setCustomRoomName] = useState('');
  const [kamar, setKamar] = useState('');
  const [name, setName] = useState('');
  const [jk, setJk] = useState<'L' | 'P'>('L');
  const [age, setAge] = useState('');
  const [rm, setRm] = useState('');
  const [dx, setDx] = useState('');
  const [status, setStatus] = useState<'Masih Rawat' | 'ACC KRS' | 'Pulang' | 'Rujuk'>('Masih Rawat');

  useEffect(() => {
    if (initialData) {
      setDpjp(initialData.dpjp || '');
      const rawRoom = initialData.room || '';
      const normalized = normalizeRoomName(rawRoom);
      const isMaster = MASTER_ROOMS.some((r) => r.toLowerCase() === rawRoom.toLowerCase());
      
      if (isMaster) {
        setSelectedRoom(normalized);
        setIsCustomRoom(false);
        setCustomRoomName('');
      } else if (rawRoom) {
        setSelectedRoom('__CUSTOM__');
        setIsCustomRoom(true);
        setCustomRoomName(rawRoom);
      } else {
        setSelectedRoom('IGD');
        setIsCustomRoom(false);
        setCustomRoomName('');
      }

      setKamar(initialData.kamar || '');
      setName(initialData.name || '');
      setJk(initialData.jk || 'L');
      setAge(initialData.age || '');
      setRm(initialData.rm || '');
      setDx(initialData.dx || '');
      setStatus(initialData.status || 'Masih Rawat');
    } else {
      setDpjp(defaultDpjp || '');
      setSelectedRoom('IGD');
      setIsCustomRoom(false);
      setCustomRoomName('');
      setKamar('');
      setName('');
      setJk('L');
      setAge('');
      setRm('');
      setDx('');
      setStatus('Masih Rawat');
    }
  }, [initialData, defaultDpjp, isOpen]);

  if (!isOpen) return null;

  const currentRoomName = isCustomRoom ? (customRoomName.trim() || 'Ruangan Khusus') : selectedRoom;
  const isCurrentBed = isBedRoom(currentRoomName);

  const handleRoomSelectChange = (val: string) => {
    if (val === '__CUSTOM__') {
      setIsCustomRoom(true);
      setSelectedRoom('__CUSTOM__');
    } else {
      setIsCustomRoom(false);
      setSelectedRoom(val);
      // If switching to a bed-only room and current kamar doesn't have "Bed", let user see the bed prompt
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rm.trim()) return;

    const finalRoom = isCustomRoom ? (customRoomName.trim() || 'Ruangan Khusus') : selectedRoom;
    const normalizedRoom = normalizeRoomName(finalRoom);
    
    // Automatically apply Bed format for bed-based rooms (Bed 1) or K-prefix for regular rooms (K2003)
    let finalKamar = kamar.trim();
    if (finalKamar) {
      finalKamar = formatKamarOrBed(normalizedRoom, finalKamar);
    }

    // Format patient name automatically with An. (< 18), Tn. (>= 18 L), Ny. (>= 18 P)
    const formattedName = formatPatientNameWithHonorific(name.trim(), age.trim(), jk);

    const patient: Patient = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      dpjp: dpjp.trim() || 'dr. DPJP, Sp.B',
      room: normalizedRoom,
      kamar: finalKamar,
      name: formattedName,
      jk,
      age: age.trim(),
      rm: rm.trim(),
      dx: dx.trim(),
      status,
      updatedAt: new Date().toISOString()
    };

    onSave(patient);
  };

  const autoHonorific = getPatientHonorific(age, jk);
  const parsedYears = parseAgeInYears(age);
  const previewName = name.trim() ? formatPatientNameWithHonorific(name, age, jk) : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {initialData ? 'Edit Data Pasien' : 'Tambah Pasien Sweeping'}
              </h2>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                Lengkapi identitas, pemilihan ruangan master, dan resume klinis
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

        <form onSubmit={handleSubmit} className="mt-3 flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* DPJP */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Dokter Penanggung Jawab (DPJP) *
              </label>
              <input
                type="text"
                required
                list="dpjpDatalist"
                value={dpjp}
                onChange={(e) => setDpjp(e.target.value)}
                placeholder="dr. AWR, Sp.U"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <datalist id="dpjpDatalist">
                {(existingDpjps || []).map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
              {divisionConsultants && divisionConsultants.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-medium">Konsulen {division}:</span>
                  {(divisionConsultants || []).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDpjp(c)}
                      className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md px-1.5 py-0.5 font-semibold transition-colors cursor-pointer"
                      title={`Pilih ${c}`}
                    >
                      + {c.replace(/^dr\.\s*/i, '').split(',')[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Room (Master Database Ruangan) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Ruangan Rawat Inap *
                </label>
                <span className="text-[10px] font-semibold text-slate-500">
                  Master DB (17 Ruangan)
                </span>
              </div>
              <select
                value={isCustomRoom ? '__CUSTOM__' : selectedRoom}
                onChange={(e) => handleRoomSelectChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <optgroup label="Master Database Ruangan (Urutan Tetap)">
                  {MASTER_ROOMS.map((r) => {
                    const bedMode = isBedRoom(r);
                    return (
                      <option key={r} value={r}>
                        {r} {bedMode ? '→ Format Bed' : ''}
                      </option>
                    );
                  })}
                </optgroup>
                <optgroup label="Pilihan Kasus Khusus">
                  <option value="__CUSTOM__">+ Input Ruangan Kustom (Lainnya)...</option>
                </optgroup>
              </select>

              {isCustomRoom && (
                <div className="mt-1.5 animate-fadeIn">
                  <input
                    type="text"
                    required
                    value={customRoomName}
                    onChange={(e) => setCustomRoomName(e.target.value)}
                    placeholder="Ketik nama ruangan kustom..."
                    className="w-full bg-white border border-blue-400 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Hanya gunakan untuk ruangan khusus yang belum terdaftar di master.
                  </p>
                </div>
              )}
            </div>

            {/* Kamar / Bed */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  {isCurrentBed ? 'Nomor Bed *' : 'Nomor Kamar'}
                </label>
                {isCurrentBed ? (
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                    Sistem Bed ({currentRoomName})
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">
                    Kamar / Bed
                  </span>
                )}
              </div>
              <input
                type="text"
                value={kamar}
                onChange={(e) => setKamar(e.target.value)}
                placeholder={
                  isCurrentBed
                    ? 'Contoh: Bed 1, Bed 2, Bed 3'
                    : 'Contoh: 2003 (otomatis menjadi K2003)'
                }
                className={`w-full border rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  isCurrentBed
                    ? 'bg-purple-50/50 border-purple-300 focus:border-purple-500 focus:ring-purple-500/20 text-purple-950 font-medium'
                    : 'bg-slate-50 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
              />
              {isCurrentBed ? (
                <p className="text-[10px] text-purple-700 mt-1 font-medium">
                  * Ruangan {currentRoomName} menggunakan format Bed (misal: "Bed 1").
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  Nomor kamar atau bed tempat pasien dirawat.
                </p>
              )}
            </div>

            {/* Nama Pasien */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">
                  Nama Lengkap Pasien *
                </label>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Sapaan Otomatis: <b className="font-bold">{autoHonorific}</b>
                </span>
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi Santoso / Tn. Budi Santoso"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
              {previewName && (
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <span>Format tersimpan otomatis:</span>
                  <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs">{previewName}</span>
                </p>
              )}
            </div>

            {/* JK */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jenis Kelamin
              </label>
              <div className="flex items-center gap-4 py-2">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="modal_jk"
                    value="L"
                    checked={jk === 'L'}
                    onChange={() => setJk('L')}
                    className="accent-blue-600"
                  />
                  <span>Laki-laki (L)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="modal_jk"
                    value="P"
                    checked={jk === 'P'}
                    onChange={() => setJk('P')}
                    className="accent-blue-600"
                  />
                  <span>Perempuan (P)</span>
                </label>
              </div>
            </div>

            {/* Usia */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Usia Pasien
              </label>
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Contoh: 45 th / 14 th / 8 bln"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {parsedYears !== null ? (
                  parsedYears < 18 ? (
                    <span className="text-amber-700 font-medium">
                      ✓ Usia &lt; 18 th ({parsedYears.toFixed(parsedYears < 1 ? 1 : 0)} th) → Otomatis <b>An.</b>
                    </span>
                  ) : (
                    <span className="text-blue-700 font-medium">
                      ✓ Usia ≥ 18 th ({parsedYears} th, {jk === 'L' ? 'L' : 'P'}) → Otomatis <b>{jk === 'L' ? 'Tn.' : 'Ny.'}</b>
                    </span>
                  )
                ) : (
                  <span>Ketik usia untuk deteksi otomatis (misal: 14 th → An., 45 th → Tn./Ny.)</span>
                )}
              </p>
            </div>

            {/* Nomor RM */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Nomor Rekam Medis (No. RM) *
              </label>
              <input
                type="text"
                required
                value={rm}
                onChange={(e) => setRm(e.target.value)}
                placeholder="00-88-21-45"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Diagnosis */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Diagnosis Klinis, Tindakan Operasi & Catatan Khusus
              </label>
              <textarea
                rows={3}
                value={dx}
                onChange={(e) => setDx(e.target.value)}
                placeholder="Contoh: Post Appendectomy Laparoskopi H+1, drain minimal kemerahan, flatus (+), diet bubur halus..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 active:bg-slate-100 transition-colors text-center cursor-pointer min-h-[42px]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold transition-colors shadow-sm cursor-pointer min-h-[42px]"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pasien</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
