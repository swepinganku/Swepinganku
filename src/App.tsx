import { useState, useEffect, useMemo } from 'react';
import { DIVISIONS, MASTER_ROOMS, DIVISION_CONSULTANTS, isBedRoom, normalizeRoomName } from './data/constants';
import { Patient, ViewMode, PageMode, RotationWeek, DivisionTeam } from './types';
import {
  loadPatients,
  savePatients,
  today,
  formatIndonesianDate,
  getKoasName,
  setKoasName,
  getStorageKey,
  loadRotationRoster,
  saveRotationRoster,
  findRotationWeekForDate,
  getActiveTeam,
  setActiveTeam,
  fetchTeamPatientsServer,
  saveTeamPatientsServer,
  joinTeamServer,
  handoverPatientsServer,
  handoverPatientsLocal,
  shiftDateByDays
} from './utils/storage';
import { Topbar } from './components/Topbar';
import { ControlsBar } from './components/ControlsBar';
import { WeekDaysBar } from './components/WeekDaysBar';
import { PatientCard } from './components/PatientCard';
import { PatientModal } from './components/PatientModal';
import { ReportModal } from './components/ReportModal';
import { WeeklyModal } from './components/WeeklyModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { RotationBanner } from './components/RotationBanner';
import { RotationModal } from './components/RotationModal';
import { DocumentSweepingView } from './components/DocumentSweepingView';
import { TeamSwitchModal } from './components/TeamSwitchModal';
import {
  Users,
  Bed,
  Stethoscope,
  AlertCircle,
  Plus
} from 'lucide-react';

export default function App() {
  const [activeTeam, setActiveTeamState] = useState<DivisionTeam>(() => getActiveTeam());
  const [date, setDate] = useState<string>(() => today());
  const [division, setDivision] = useState<string>(() => {
    const t = getActiveTeam();
    return t.division || DIVISIONS[0];
  });
  const [patients, setPatients] = useState<Patient[]>(() => {
    const t = getActiveTeam();
    return loadPatients(today(), t.division || DIVISIONS[0], t.teamCode);
  });
  const [view, setView] = useState<ViewMode>('dpjp');
  const [selectedDpjp, setSelectedDpjp] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [koasName, setKoasNameState] = useState<string>('dr. Muda / Koas Bedah');
  const [pageMode, setPageMode] = useState<PageMode>('dashboard');

  // Modals state
  const [patientModalOpen, setPatientModalOpen] = useState<boolean>(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [reportMode, setReportMode] = useState<'dpjp' | 'all'>('dpjp');
  const [weeklyModalOpen, setWeeklyModalOpen] = useState<boolean>(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [rosterModalOpen, setRosterModalOpen] = useState<boolean>(false);
  const [teamModalOpen, setTeamModalOpen] = useState<boolean>(false);
  const [roster, setRoster] = useState<RotationWeek[]>(() => loadRotationRoster());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Initialize and Server Sync
  useEffect(() => {
    const currentKoas = getKoasName();
    setKoasNameState(currentKoas);

    // Register active team to server
    joinTeamServer(activeTeam.teamCode, activeTeam.division, activeTeam.teamName, currentKoas);

    // Initial server fetch
    fetchTeamPatientsServer(activeTeam.teamCode, date).then((serverList) => {
      if (serverList && serverList.length > 0) {
        setPatients(serverList);
      }
    });

    // Auto sync current date to roster on initial boot if available
    const initialMatched = findRotationWeekForDate(today(), roster);
    if (initialMatched && initialMatched.division !== division) {
      setDivision(initialMatched.division);
      const loaded = loadPatients(today(), initialMatched.division, activeTeam.teamCode);
      setPatients(loaded);
    }

    // Periodic sync with partner on same teamCode every 8 seconds
    const interval = setInterval(() => {
      fetchTeamPatientsServer(activeTeam.teamCode, date).then((serverList) => {
        if (serverList && Array.isArray(serverList) && serverList.length > 0) {
          setPatients((prev) => {
            const prevList = Array.isArray(prev) ? prev : [];
            const prevIds = prevList.map((p) => p.id).join(',');
            const newIds = serverList.map((p) => p.id).join(',');
            if (prevIds !== newIds || prevList.length !== serverList.length) {
              return serverList;
            }
            return prev;
          });
        }
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [activeTeam.teamCode, date]);

  const handleDateOrDivisionChange = (newDate: string, newDiv: string, skipRosterCheck: boolean = false) => {
    let targetDivision = newDiv;
    if (!skipRosterCheck && newDate !== date) {
      const matched = findRotationWeekForDate(newDate, roster);
      if (matched && matched.division !== newDiv) {
        targetDivision = matched.division;
        showToast(`Sinkron otomatis ke Minggu ${matched.weekNumber}: ${matched.division}`);
      }
    }
    setDate(newDate);
    setDivision(targetDivision);
    setSelectedDpjp('');
    const loaded = loadPatients(newDate, targetDivision, activeTeam.teamCode);
    setPatients(loaded);

    // Also try fetching from server
    fetchTeamPatientsServer(activeTeam.teamCode, newDate).then((serverList) => {
      if (serverList && serverList.length > 0) {
        setPatients(serverList);
      }
    });
  };

  const handleSwitchTeam = async (newTeam: DivisionTeam, carryOver: boolean) => {
    setActiveTeamState(newTeam);
    setActiveTeam(newTeam);
    setDivision(newTeam.division);
    setSelectedDpjp('');

    // Register to server
    await joinTeamServer(newTeam.teamCode, newTeam.division, newTeam.teamName, koasName);

    if (carryOver) {
      const yesterday = shiftDateByDays(date, -1);
      const handoverResult = await handoverPatientsServer(newTeam.teamCode, yesterday, date);
      if (handoverResult && handoverResult.success) {
        setPatients(handoverResult.patients);
        savePatients(date, newTeam.division, handoverResult.patients, newTeam.teamCode);
        showToast(`✓ Bergabung ke ${newTeam.teamName} (PIN: ${newTeam.teamCode})! ${handoverResult.addedCount} pasien aktif dioperkan.`);
        return;
      } else {
        const localResult = handoverPatientsLocal(newTeam.teamCode, newTeam.division, yesterday, date);
        setPatients(localResult.patients);
        showToast(`✓ Bergabung ke ${newTeam.teamName} (PIN: ${newTeam.teamCode})! ${localResult.addedCount} pasien aktif dioperkan.`);
        return;
      }
    }

    // Try fetching team patients from server
    const serverList = await fetchTeamPatientsServer(newTeam.teamCode, date);
    if (serverList && serverList.length > 0) {
      setPatients(serverList);
      savePatients(date, newTeam.division, serverList, newTeam.teamCode);
    } else {
      const loaded = loadPatients(date, newTeam.division, newTeam.teamCode);
      setPatients(loaded);
    }
    showToast(`✓ Terhubung ke ${newTeam.teamName} (PIN: ${newTeam.teamCode})!`);
  };

  const handleHandoverPatients = async () => {
    const yesterday = shiftDateByDays(date, -1);
    const yesterdayFormatted = formatIndonesianDate(yesterday);
    const res = await handoverPatientsServer(activeTeam.teamCode, yesterday, date);
    if (res && res.success) {
      setPatients(res.patients);
      savePatients(date, division, res.patients, activeTeam.teamCode);
      if (res.addedCount > 0) {
        showToast(`✓ Berhasil mengoperkan ${res.addedCount} pasien aktif dari hari kemarin (${yesterdayFormatted})!`);
      } else {
        showToast(`Semua pasien rawat aktif dari hari kemarin sudah ada di daftar.`);
      }
    } else {
      const local = handoverPatientsLocal(activeTeam.teamCode, division, yesterday, date);
      setPatients(local.patients);
      if (local.addedCount > 0) {
        showToast(`✓ Berhasil mengoperkan ${local.addedCount} pasien aktif dari hari kemarin (${yesterdayFormatted})!`);
      } else {
        showToast(`Semua pasien rawat aktif dari hari kemarin sudah ada di daftar.`);
      }
    }
  };

  const handleJumpToWeek = (targetWeek: RotationWeek) => {
    setDate(targetWeek.startDate);
    setDivision(targetWeek.division);
    setSelectedDpjp('');
    const loaded = loadPatients(targetWeek.startDate, targetWeek.division, activeTeam.teamCode);
    setPatients(loaded);
    showToast(`✓ Beralih ke Minggu ${targetWeek.weekNumber}: ${targetWeek.division} (${targetWeek.startDate})`);
  };

  const handleSaveRoster = (newRoster: RotationWeek[]) => {
    setRoster(newRoster);
    saveRotationRoster(newRoster);
    const matched = findRotationWeekForDate(date, newRoster);
    if (matched && matched.division !== division) {
      setDivision(matched.division);
      const loaded = loadPatients(date, matched.division, activeTeam.teamCode);
      setPatients(loaded);
    }
    showToast('✓ Jadwal rotasi stase bedah (10 pekan) berhasil disimpan!');
  };

  const divisionConsultants = useMemo(() => {
    return DIVISION_CONSULTANTS[division] || [];
  }, [division]);

  const dpjps = useMemo(() => {
    const safePatients = Array.isArray(patients) ? patients : [];
    const fromPatients = safePatients.map((p) => p.dpjp).filter(Boolean);
    const baseConsultants = (DIVISION_CONSULTANTS && DIVISION_CONSULTANTS[division]) || [];
    return [...new Set([...baseConsultants, ...fromPatients])].sort();
  }, [patients, division]);

  useEffect(() => {
    if (!selectedDpjp && dpjps.length > 0) {
      setSelectedDpjp(dpjps[0]);
    } else if (dpjps.length > 0 && !dpjps.includes(selectedDpjp)) {
      setSelectedDpjp(dpjps[0]);
    }
  }, [dpjps, selectedDpjp]);

  const activeRooms = useMemo(() => {
    const safePatients = Array.isArray(patients) ? patients : [];
    const rawRooms: string[] = Array.from(new Set(safePatients.map((p) => normalizeRoomName(p.room))));
    const masterList = (MASTER_ROOMS || []).filter((r) =>
      rawRooms.some((rr) => rr.toLowerCase() === r.toLowerCase())
    );
    const customList = rawRooms
      .filter((rr) => !(MASTER_ROOMS || []).some((r) => r.toLowerCase() === rr.toLowerCase()))
      .sort();
    return [...masterList, ...customList];
  }, [patients]);

  const filteredPatients = useMemo(() => {
    let result = Array.isArray(patients) ? patients : [];
    if (view === 'dpjp' && selectedDpjp) {
      result = result.filter((p) => p.dpjp === selectedDpjp);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.rm.toLowerCase().includes(q) ||
          p.dx.toLowerCase().includes(q) ||
          p.room.toLowerCase().includes(q) ||
          p.kamar.toLowerCase().includes(q)
      );
    }
    return result;
  }, [patients, view, selectedDpjp, searchQuery]);

  const handleSavePatient = (saved: Patient) => {
    const safePatients = Array.isArray(patients) ? patients : [];
    const exists = safePatients.some((p) => p.id === saved.id);
    let updated: Patient[];
    if (exists) {
      updated = safePatients.map((p) => (p.id === saved.id ? saved : p));
    } else {
      updated = [...safePatients, saved];
    }
    setPatients(updated);
    savePatients(date, division, updated, activeTeam.teamCode);
    setPatientModalOpen(false);
    setEditingPatient(null);
  };

  const handleRequestDelete = (patient: Patient) => {
    setPatientToDelete(patient);
  };

  const handleConfirmDelete = (patient: Patient) => {
    const safePatients = Array.isArray(patients) ? patients : [];
    const updated = safePatients.filter((p) => p.id !== patient.id);
    setPatients(updated);
    savePatients(date, division, updated, activeTeam.teamCode);
    setPatientToDelete(null);
    showToast(`✓ Data pasien ${patient.name} (${patient.rm}) berhasil dihapus.`);
  };

  const handleCopyFromDay = (fromDate: string, dayName: string) => {
    try {
      let prevPatients = loadPatients(fromDate, division, activeTeam.teamCode);
      if (!prevPatients || prevPatients.length === 0) {
        const raw = localStorage.getItem(getStorageKey(fromDate, division, activeTeam.teamCode));
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) prevPatients = parsed;
          } catch {}
        }
      }

      if (prevPatients && prevPatients.length > 0) {
        const generateId = () =>
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : 'p-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);

        const copied: Patient[] = prevPatients.map((p) => ({
          ...p,
          id: generateId(),
          updatedAt: new Date().toISOString()
        }));

        setPatients(copied);
        savePatients(date, division, copied, activeTeam.teamCode);
        showToast(`✓ Berhasil menyalin ${copied.length} pasien dari hari ${dayName}!`);
      } else {
        showToast(`Tidak ada data pasien yang ditemukan di hari ${dayName}.`);
      }
    } catch (err) {
      console.error('Error copying patients:', err);
      showToast('Terjadi kendala saat menyalin data pasien.');
    }
  };

  const handleQuickShare = async (patient: Patient) => {
    const statusPart = patient.status && patient.status !== 'Masih Rawat' ? `\nStatus: ${patient.status}` : '';
    const text = `*Pasien Sweeping Bedah*\nRuangan: ${patient.room} / ${patient.kamar || '-'}\nNama: ${patient.name} (${patient.jk}, ${patient.age || '-'})\nRM: ${patient.rm}\nDPJP: ${patient.dpjp}\nDiagnosis: ${patient.dx}${statusPart}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast(`✓ Data resume ${patient.name} berhasil disalin ke clipboard!`);
    } catch {
      showToast(`Data ${patient.name} disiapkan untuk dibagikan.`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Topbar Header */}
      <Topbar
        koasName={koasName}
        onUpdateKoasName={(name) => {
          setKoasName(name);
          setKoasNameState(name);
        }}
        pageMode={pageMode}
        onPageModeChange={setPageMode}
      />

      {pageMode === 'document' ? (
        <DocumentSweepingView
          patients={patients}
          date={date}
          division={division}
          koasName={koasName}
          dpjps={dpjps}
          allRooms={activeRooms}
          onDateChange={(d) => handleDateOrDivisionChange(d, division)}
          onBackToDashboard={() => setPageMode('dashboard')}
          onAddPatient={() => {
            setEditingPatient(null);
            setPatientModalOpen(true);
          }}
          onEditPatient={(patient) => {
            setEditingPatient(patient);
            setPatientModalOpen(true);
          }}
          activeTeam={activeTeam}
          onOpenTeamModal={() => setTeamModalOpen(true)}
          onHandoverPatients={handleHandoverPatients}
        />
      ) : (
        /* Main Container */
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Rotation Roster Bar & Quick Week Jumper */}
          <RotationBanner
            currentDate={date}
            currentDivision={division}
            roster={roster}
            onSelectWeek={handleJumpToWeek}
            onOpenRosterModal={() => setRosterModalOpen(true)}
          />

          {/* Date, Division & Quick Actions Controls */}
          <ControlsBar
            date={date}
            division={division}
            divisions={DIVISIONS}
            onDateChange={(d) => handleDateOrDivisionChange(d, division)}
            onDivisionChange={(div) => handleDateOrDivisionChange(date, div)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenWeekly={() => setWeeklyModalOpen(true)}
            activeTeam={activeTeam}
            onOpenTeamModal={() => setTeamModalOpen(true)}
            onHandoverPatients={handleHandoverPatients}
          />

        {/* Workspace Title & Stats summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              {division}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Dashboard Sweeping · {formatIndonesianDate(date)}
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs text-xs text-slate-700 font-medium">
              <Users className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <b className="text-slate-900">{patients.length}</b> Pasien
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs text-xs text-slate-700 font-medium">
              <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <b className="text-slate-900">{dpjps.length}</b> DPJP
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs text-xs text-slate-700 font-medium">
              <Bed className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <b className="text-slate-900">{new Set((Array.isArray(patients) ? patients : []).map((p) => p.room)).size}</b> Ruangan
              </span>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('dpjp')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              view === 'dpjp'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Fokus Per-DPJP
          </button>
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              view === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Keseluruhan Divisi ({division})
          </button>
        </div>

        {/* Layout: Sidebar & Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            {view === 'dpjp' ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Daftar DPJP
                  </h3>
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                    {(dpjps || []).length} Dokter
                  </span>
                </div>
                {(!dpjps || dpjps.length === 0) ? (
                  <div className="text-xs text-slate-400 py-6 text-center">
                    Belum ada DPJP terdaftar hari ini.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {(dpjps || []).map((d) => {
                      const count = (Array.isArray(patients) ? patients : []).filter((p) => p.dpjp === d).length;
                      const active = d === selectedDpjp;
                      return (
                        <button
                          key={d}
                          onClick={() => setSelectedDpjp(d)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                            active
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                              : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <span className="truncate pr-2">{d}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              active
                                ? 'bg-blue-200 text-blue-900'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Mode Keseluruhan Divisi
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menampilkan seluruh pasien divisi <b>{division}</b> dikelompokkan berdasarkan ruangan rawat inap (IGD, ICU, SEROJA, dan bangsal lain).
                </p>
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                  Total pasien aktif: <b className="text-slate-800">{(Array.isArray(patients) ? patients : []).length}</b> orang
                </div>
              </div>
            )}
          </aside>

          {/* Main Patient Rooms Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Jajaran tombol hari Senin sampai Minggu per divisi */}
            <WeekDaysBar
              currentDate={date}
              division={division}
              currentPatientCount={(Array.isArray(patients) ? patients : []).length}
              onSelectDate={(newDate) => handleDateOrDivisionChange(newDate, division)}
              onCopyFromDay={handleCopyFromDay}
            />

            {filteredPatients.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-base">
                  {searchQuery ? 'Tidak ada pasien yang cocok' : 'Belum ada data pasien'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `Tidak ditemukan pasien dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                    : 'Mulai input data sweeping dokter muda dengan klik tombol "+ Tambah Pasien".'}
                </p>
                <button
                  onClick={() => {
                    setEditingPatient(null);
                    setPatientModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pasien Sekarang</span>
                </button>
              </div>
            ) : (
              (activeRooms || []).map((roomName) => {
                const isBed = isBedRoom(roomName);
                const roomPatients = filteredPatients.filter(
                  (p) => normalizeRoomName(p.room).toLowerCase() === roomName.toLowerCase()
                );
                if (roomPatients.length === 0) return null;

                return (
                  <section
                    key={roomName}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bed className={`w-4 h-4 ${isBed ? 'text-purple-600' : 'text-blue-600'}`} />
                        <span className="font-bold text-sm text-slate-800">{roomName}</span>
                        {isBed && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                            Sistem Bed
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                        {roomPatients.length} pasien
                      </span>
                    </div>

                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {(roomPatients || []).map((patient) => (
                          <PatientCard
                            key={patient.id}
                            patient={patient}
                            onEdit={() => {
                              setEditingPatient(patient);
                              setPatientModalOpen(true);
                            }}
                            onDelete={() => handleRequestDelete(patient)}
                            onQuickShare={() => handleQuickShare(patient)}
                          />
                        ))}
                      </div>
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </div>
      </main>
      )}

      {/* Modals */}
      <PatientModal
        isOpen={patientModalOpen}
        initialData={editingPatient}
        defaultDpjp={selectedDpjp}
        existingDpjps={dpjps}
        division={division}
        divisionConsultants={divisionConsultants}
        onClose={() => {
          setPatientModalOpen(false);
          setEditingPatient(null);
        }}
        onSave={handleSavePatient}
      />

      <ReportModal
        isOpen={reportModalOpen}
        mode={reportMode}
        date={date}
        division={division}
        koasName={koasName}
        selectedDpjp={selectedDpjp}
        patients={patients}
        onClose={() => setReportModalOpen(false)}
      />

      <WeeklyModal
        isOpen={weeklyModalOpen}
        currentDate={date}
        division={division}
        onClose={() => setWeeklyModalOpen(false)}
      />

      <DeleteConfirmModal
        patient={patientToDelete}
        division={division}
        date={date}
        onClose={() => setPatientToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <RotationModal
        isOpen={rosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        roster={roster}
        onSaveRoster={handleSaveRoster}
        currentDate={date}
        onJumpToWeek={handleJumpToWeek}
      />

      <TeamSwitchModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        currentTeam={activeTeam}
        currentDivision={division}
        koasName={koasName}
        onSwitchTeam={handleSwitchTeam}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/80 flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
