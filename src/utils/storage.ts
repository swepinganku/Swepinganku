import { Patient, WeeklyRow, RotationWeek, DivisionTeam } from '../types';
import {
  SAMPLE_PATIENTS,
  MASTER_ROOMS,
  DIVISIONS,
  DEFAULT_TEAM_CODES,
  getDefaultTeamCode,
  isBedRoom,
  normalizeRoomName,
  formatKamarOrBed,
  formatPatientNameWithHonorific
} from '../data/constants';

const KEY_PREFIX = 'sweepinganku';

export function getStorageKey(date: string, division: string, teamCode?: string): string {
  if (teamCode) {
    return `${KEY_PREFIX}:team:${teamCode.trim().toUpperCase()}:${date}`;
  }
  return `${KEY_PREFIX}:${date}:${division}`;
}

export function parseDateSafely(dateStr?: string | null): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim();
  const parts = clean.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y > 1900 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      return new Date(y, m, d);
    }
  }
  const fallback = new Date(clean);
  if (isNaN(fallback.getTime())) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return fallback;
}

export function formatDateIso(d: Date): string {
  if (!d || isNaN(d.getTime())) {
    return today();
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function today(): string {
  const d = new Date();
  return formatDateIso(d);
}

export interface WeekDayInfo {
  dayName: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  shortName: string;
  date: string;
  dayOfMonth: number;
  monthName: string;
  isToday: boolean;
  isSelected: boolean;
}

export function getWeekDays(referenceDate: string, selectedDate: string): WeekDayInfo[] {
  const d = parseDateSafely(referenceDate);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday);

  const dayNames: Array<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu'> = [
    'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
  ];
  const shortNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const todayStr = today();
  const selDate = selectedDate ? formatDateIso(parseDateSafely(selectedDate)) : todayStr;

  return dayNames.map((name, i) => {
    const cur = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const dateStr = formatDateIso(cur);
    const dayOfMonth = cur.getDate();
    let monthName = 'Bln';
    try {
      monthName = cur.toLocaleDateString('id-ID', { month: 'short' });
    } catch {
      monthName = String(cur.getMonth() + 1);
    }

    return {
      dayName: name,
      shortName: shortNames[i],
      date: dateStr,
      dayOfMonth,
      monthName,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selDate
    };
  });
}

export function shiftDateByDays(dateStr: string, days: number): string {
  const d = parseDateSafely(dateStr);
  const shifted = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  return formatDateIso(shifted);
}

export function formatIndonesianDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '';
  try {
    const d = parseDateSafely(dateStr);
    return d.toLocaleDateString('id-ID', options || {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function getDefaultTeam(division: string, koasName?: string): DivisionTeam {
  const code = getDefaultTeamCode(division);
  return {
    teamCode: code,
    division,
    teamName: `Tim ${division}`,
    members: [koasName || 'dr. Muda / Koas Bedah']
  };
}

export function getActiveTeam(defaultDivision?: string, defaultKoasName?: string): DivisionTeam {
  const raw = localStorage.getItem(`${KEY_PREFIX}:activeTeam`);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.teamCode) {
        return parsed;
      }
    } catch {}
  }
  const div = defaultDivision || 'Bedah Digestif & Umum';
  const def = getDefaultTeam(div, defaultKoasName);
  localStorage.setItem(`${KEY_PREFIX}:activeTeam`, JSON.stringify(def));
  return def;
}

export function setActiveTeam(team: DivisionTeam): void {
  localStorage.setItem(`${KEY_PREFIX}:activeTeam`, JSON.stringify(team));
}

export function loadPatients(date: string, division: string, teamCode?: string): Patient[] {
  const k = getStorageKey(date, division, teamCode);
  const raw = localStorage.getItem(k);
  if (raw) {
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list.map(p => ({
          ...p,
          name: formatPatientNameWithHonorific(p.name, p.age, p.jk)
        }));
      }
    } catch {
      return [];
    }
  }

  // If loading for a team and nothing in team key, try legacy division key as fallback
  if (teamCode) {
    const legacyKey = getStorageKey(date, division);
    const legacyRaw = localStorage.getItem(legacyKey);
    if (legacyRaw) {
      try {
        const legacyList = JSON.parse(legacyRaw);
        if (Array.isArray(legacyList)) {
          savePatients(date, division, legacyList, teamCode);
          return legacyList;
        }
      } catch {}
    }
  }

  // Seed sample data if it's today and default division and nothing in storage yet
  const hasEverSeeded = localStorage.getItem(`${KEY_PREFIX}:seeded`);
  if (!hasEverSeeded && date === today()) {
    localStorage.setItem(`${KEY_PREFIX}:seeded`, 'true');
    const safeSeed = Array.isArray(SAMPLE_PATIENTS) ? SAMPLE_PATIENTS : [];
    const seeded = safeSeed.map(p => ({
      ...p,
      name: formatPatientNameWithHonorific(p.name, p.age, p.jk)
    }));
    savePatients(date, division, seeded, teamCode);
    return seeded;
  }

  return [];
}

export function savePatients(date: string, division: string, patients: Patient[], teamCode?: string): void {
  const k = getStorageKey(date, division, teamCode);
  const safePatients = Array.isArray(patients) ? patients : [];
  const normalized = safePatients.map(p => ({
    ...p,
    name: formatPatientNameWithHonorific(p.name, p.age, p.jk)
  }));
  localStorage.setItem(k, JSON.stringify(normalized));

  // Also silently backup to server if teamCode provided
  if (teamCode) {
    saveTeamPatientsServer(teamCode, date, normalized).catch(() => {});
  }
}

// Server API Synchronization Handlers
export async function fetchTeamPatientsServer(teamCode: string, date: string): Promise<Patient[] | null> {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(teamCode)}/patients?date=${encodeURIComponent(date)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.patients)) {
      return data.patients.map((p: Patient) => ({
        ...p,
        name: formatPatientNameWithHonorific(p.name, p.age, p.jk)
      }));
    }
  } catch {}
  return null;
}

export async function saveTeamPatientsServer(teamCode: string, date: string, patients: Patient[], memberName?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(teamCode)}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, patients, memberName })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function joinTeamServer(teamCode: string, division: string, teamName: string, memberName: string): Promise<DivisionTeam | null> {
  try {
    const res = await fetch('/api/teams/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamCode, division, teamName, memberName })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.team || null;
  } catch {
    return null;
  }
}

export async function fetchTeamInfoServer(teamCode: string): Promise<DivisionTeam | null> {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(teamCode)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data || null;
  } catch {
    return null;
  }
}

export async function handoverPatientsServer(teamCode: string, fromDate: string, toDate: string): Promise<{ success: boolean; addedCount: number; patients: Patient[] } | null> {
  try {
    const res = await fetch(`/api/teams/${encodeURIComponent(teamCode)}/handover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromDate, toDate })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Local Fallback Handover
export function handoverPatientsLocal(
  teamCode: string,
  division: string,
  fromDate: string,
  toDate: string
): { addedCount: number; patients: Patient[] } {
  const sourcePatients = loadPatients(fromDate, division, teamCode);
  const targetPatients = loadPatients(toDate, division, teamCode);

  const activePatients = sourcePatients.filter(
    p => !p.status || p.status === 'Masih Rawat'
  );

  let addedCount = 0;
  const merged = [...targetPatients];

  for (const sp of activePatients) {
    const exists = merged.some(tp => tp.rm === sp.rm);
    if (!exists) {
      merged.push({
        ...sp,
        id: `handover-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        updatedAt: new Date().toISOString()
      });
      addedCount++;
    }
  }

  savePatients(toDate, division, merged, teamCode);
  return { addedCount, patients: merged };
}

export function getKoasName(): string {
  return localStorage.getItem(`${KEY_PREFIX}:koasName`) || 'dr. Muda / Koas Bedah';
}

export function setKoasName(name: string): void {
  localStorage.setItem(`${KEY_PREFIX}:koasName`, name);
}

export function generateReportText({
  mode,
  date,
  division,
  koasName,
  selectedDpjp,
  patients,
  allRooms
}: {
  mode: 'dpjp' | 'all';
  date: string;
  division: string;
  koasName: string;
  selectedDpjp?: string;
  patients: Patient[];
  allRooms: string[];
}): string {
  const d = parseDateSafely(date);
  let dayName = date;
  try {
    dayName = d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    dayName = date;
  }

  const header = `Selamat pagi, dokter. Mohon maaf mengganggu waktunya, dokter.
Perkenalkan, dokter, saya ${koasName || '[Nama Koas]'} selaku dokter muda yang saat ini sedang menjalani stase bedah Divisi ${division}.
Mohon izin untuk melaporkan pasien dokter di ruangan rawat inap pada hari ini, dokter. 🙏🏻

*${dayName}*`;

  const closing = '\n\nMohon maaf jika terdapat kesalahan, dokter. Terima kasih, dokter. 🙏🏻';

  let filtered = patients;
  if (mode === 'dpjp') {
    const targetDpjp = selectedDpjp || (patients.length > 0 ? patients[0].dpjp : '[DPJP]');
    filtered = patients.filter(p => p.dpjp === targetDpjp);
    let out = `${header}\n*DPJP: ${targetDpjp}*\n*Total pasien: ${filtered.length} pasien*\n`;
    out += formatRoomsReport(filtered, false, allRooms);
    out += closing;
    return out;
  } else {
    let out = `${header}\n*Total pasien keseluruhan: ${filtered.length} pasien*\n`;
    out += formatRoomsReport(filtered, true, allRooms);
    out += closing;
    return out;
  }
}

export function generateDocSweepingReportText({
  mode,
  date,
  division,
  koasName,
  selectedDpjp,
  patients,
  allRooms
}: {
  mode: 'dpjp' | 'all';
  date: string;
  division: string;
  koasName: string;
  selectedDpjp?: string;
  patients: Patient[];
  allRooms: string[];
}): string {
  const d = parseDateSafely(date);
  let dayName = date;
  try {
    dayName = d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    dayName = date;
  }

  const header = `Selamat pagi, dokter. Mohon maaf mengganggu waktunya, dokter. Perkenalkan, dokter, saya ${koasName || '[Nama Koas]'} selaku dokter muda yang saat ini sedang menjalani stase bedah Divisi ${division}. Mohon izin untuk melaporkan pasien dokter di ruangan rawat inap pada hari ini, dokter. 🙏🏻\n\n*${dayName}*`;

  const closing = '\n\nMohon maaf jika terdapat kesalahan, dokter. Terima kasih, dokter. 🙏🏻';

  let filtered = patients;
  let targetHeader = '';
  if (mode === 'dpjp') {
    const targetDpjp = selectedDpjp || (patients.length > 0 ? patients[0].dpjp : '[DPJP]');
    filtered = patients.filter(p => p.dpjp === targetDpjp);
    targetHeader = `\n*DPJP: ${targetDpjp}*\n*Total pasien: ${filtered.length} pasien*\n`;
  } else {
    targetHeader = `\n*Total pasien: ${filtered.length} pasien*\n`;
  }

  // List all master rooms + any custom room with patients
  const roomOrder = allRooms && allRooms.length > 0 ? allRooms : MASTER_ROOMS;
  const customRooms = [...new Set(filtered.map(p => normalizeRoomName(p.room)))]
    .filter(r => !roomOrder.some(mr => mr.toLowerCase() === r.toLowerCase()));
  const completeRooms = [...roomOrder, ...customRooms];

  const body = completeRooms.map(r => {
    const roomPatients = filtered.filter(p => normalizeRoomName(p.room).toLowerCase() === r.toLowerCase());
    if (roomPatients.length === 0) {
      return `*${r.toUpperCase()} (0)*\n__________________\n`;
    }
    const lines = roomPatients
      .map((p, i) => {
        const bedOrKamar = formatKamarOrBed(p.room, p.kamar);
        const formattedName = formatPatientNameWithHonorific(p.name, p.age, p.jk);
        return `${i + 1}. ${bedOrKamar} / ${formattedName} / ${p.jk || '-'} / ${p.age || '-'} / ${p.rm} / ${p.dx || '-'}${mode === 'all' ? ' / DPJP: ' + p.dpjp : ''}`;
      })
      .join('\n');
    return `*${r.toUpperCase()} (${roomPatients.length})*\n${lines}\n`;
  }).join('\n');

  return `${header}${targetHeader}\n${body.trim()}${closing}`;
}

function formatRoomsReport(patients: Patient[], withDpjp: boolean, defaultRooms: string[]): string {
  const patientRooms = [...new Set(patients.map(p => normalizeRoomName(p.room)))];
  const roomOrder = defaultRooms && defaultRooms.length > 0 ? defaultRooms : MASTER_ROOMS;

  // Urutkan secara presisi sesuai master database ruangan resmi, kemudian ruangan kustom (jika ada)
  const sortedRooms = [
    ...roomOrder.filter(r => patientRooms.some(pr => pr.toLowerCase() === r.toLowerCase())),
    ...patientRooms.filter(pr => !roomOrder.some(r => r.toLowerCase() === pr.toLowerCase())).sort()
  ];

  if (sortedRooms.length === 0) {
    return '\n(Belum ada pasien yang terdaftar di ruangan rawat inap)';
  }

  return sortedRooms.map(r => {
    const roomPatients = patients.filter(p => normalizeRoomName(p.room).toLowerCase() === r.toLowerCase());
    if (roomPatients.length === 0) return '';
    const lines = roomPatients
      .map((p, i) => {
        const bedOrKamar = formatKamarOrBed(p.room, p.kamar);
        const formattedName = formatPatientNameWithHonorific(p.name, p.age, p.jk);
        return `${i + 1}. ${bedOrKamar} / ${formattedName} / ${p.jk || '-'} / ${p.age || '-'} / ${p.rm} / ${p.dx || '-'}${withDpjp ? ' / DPJP: ' + p.dpjp : ''}`;
      })
      .join('\n');
    return `\n*${r} (${roomPatients.length} pasien)*\n────────────────────\n${lines}`;
  }).filter(Boolean).join('\n');
}

export function getDatesBetween(startDate: string, endDate: string): string[] {
  const result: string[] = [];
  const current = parseDateSafely(startDate);
  const stop = parseDateSafely(endDate);
  let count = 0;
  while (current <= stop && count < 60) {
    result.push(formatDateIso(current));
    current.setDate(current.getDate() + 1);
    count++;
  }
  return result;
}

export function computeWeeklyRecap(startDate: string, endDate: string, division: string): {
  rows: WeeklyRow[];
  dates: string[];
} {
  const dates = getDatesBetween(startDate, endDate);
  const map = new Map<string, WeeklyRow>();

  dates.forEach(dt => {
    const raw = localStorage.getItem(getStorageKey(dt, division));
    if (!raw) return;
    try {
      const dayPatients: Patient[] = JSON.parse(raw);
      dayPatients.forEach(p => {
        if (!p.rm) return;
        let r = map.get(p.rm);
        if (!r) {
          r = {
            rm: p.rm,
            name: p.name,
            jk: p.jk || '-',
            age: p.age || '-',
            dpjp: p.dpjp,
            dx: p.dx || '',
            status: p.status || 'Masih Rawat',
            first: dt,
            last: dt,
            lastRoom: p.room,
            lastKamar: p.kamar || '',
            days: {}
          };
          map.set(p.rm, r);
        }
        r.name = p.name;
        r.jk = p.jk;
        r.age = p.age;
        r.dpjp = p.dpjp;
        r.dx = p.dx;
        r.status = p.status || r.status;
        r.last = dt;
        r.lastRoom = normalizeRoomName(p.room);
        r.lastKamar = p.kamar;
        const bedOrKamar = formatKamarOrBed(p.room, p.kamar);
        r.days[dt] = `${normalizeRoomName(p.room)} (${bedOrKamar})`;
      });
    } catch {
      // ignore parse error
    }
  });

  const rows = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  return { rows, dates };
}

export function exportWeeklyCSV(rows: WeeklyRow[], dates: string[], division: string, startDate: string, endDate: string): void {
  if (!rows.length) return;
  const dayHeaders = dates.map(x => {
    const d = parseDateSafely(x);
    try {
      return d.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: '2-digit' });
    } catch {
      return x;
    }
  });

  const headers = [
    'No',
    'No. RM',
    'Nama Pasien',
    'Jenis Kelamin',
    'Usia',
    'DPJP',
    'Ruangan Terakhir / Kamar & Bed',
    'Diagnosis',
    'Status Pasien',
    'Tgl Pertama Sweeping',
    'Tgl Terakhir Sweeping',
    ...dayHeaders
  ];

  const csvRows = [
    headers,
    ...rows.map((r, i) => [
      i + 1,
      r.rm,
      r.name,
      r.jk,
      r.age,
      r.dpjp,
      `${normalizeRoomName(r.lastRoom)} / ${formatKamarOrBed(r.lastRoom, r.lastKamar)}`,
      r.dx,
      r.status,
      r.first,
      r.last,
      ...dates.map(d => r.days[d] || '-')
    ])
  ];

  const csvContent = csvRows
    .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rekap-sweeping-${division.replace(/\s+/g, '-')}-${startDate}_${endDate}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const ROTATION_ROSTER_KEY = `${KEY_PREFIX}:rotation_roster`;

export function generateDefaultRotationRoster(refDate: string = today()): RotationWeek[] {
  const d = parseDateSafely(refDate);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const currentMonday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday);

  // Default division sequences for standard 10 weeks stase bedah
  const defaultDivs = [
    'Bedah Digestif & Umum', // M1
    'Ortopedi',              // M2
    'Urologi',               // M3
    'Bedah Saraf',           // M4
    'BTKV',                  // M5
    'Bedah Digestif & Umum', // M6 (Saat ini)
    'Bedah Anak',            // M7
    'Bedah Onkologi',        // M8
    'Bedah Plastik',         // M9
    'Urologi'                // M10
  ];

  const weeks: RotationWeek[] = [];
  // Current week is Week 6, so Week 1 started 5 weeks ago
  const week1Monday = new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() - 5 * 7);

  for (let w = 1; w <= 10; w++) {
    const wStart = new Date(week1Monday.getFullYear(), week1Monday.getMonth(), week1Monday.getDate() + (w - 1) * 7);
    const wEnd = new Date(wStart.getFullYear(), wStart.getMonth(), wStart.getDate() + 6);
    weeks.push({
      id: `rot-week-${w}`,
      weekNumber: w,
      division: defaultDivs[w - 1] || 'Bedah Digestif & Umum',
      startDate: formatDateIso(wStart),
      endDate: formatDateIso(wEnd),
      note: w === 6 ? 'Sedang berjalan (Minggu ke-6)' : w > 6 ? `Minggu ke-${w} stase bedah` : `Minggu ke-${w}`
    });
  }
  return weeks;
}

export function loadRotationRoster(): RotationWeek[] {
  try {
    const raw = localStorage.getItem(ROTATION_ROSTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading rotation roster', e);
  }
  const initial = generateDefaultRotationRoster();
  saveRotationRoster(initial);
  return initial;
}

export function saveRotationRoster(roster: RotationWeek[]): void {
  try {
    localStorage.setItem(ROTATION_ROSTER_KEY, JSON.stringify(roster));
  } catch (e) {
    console.error('Error saving rotation roster', e);
  }
}

export function findRotationWeekForDate(dateStr: string, roster: RotationWeek[]): RotationWeek | undefined {
  if (!dateStr || !roster.length) return undefined;
  return roster.find(w => dateStr >= w.startDate && dateStr <= w.endDate);
}
