import { Patient } from '../types';

export const DIVISIONS: string[] = [
  'Bedah Digestif & Umum',
  'Bedah Anak',
  'Urologi',
  'Ortopedi',
  'Bedah Saraf',
  'BTKV',
  'Bedah Plastik',
  'Bedah Onkologi'
];

/**
 * Master data dokter konsulen (DPJP) per divisi stase bedah
 */
export const DIVISION_CONSULTANTS: Record<string, string[]> = {
  'Bedah Anak': [
    'dr. Santi Rini., Sp.BA., Subsp.DA(K)',
    'dr. Fahad Ahmed Shah Khaisama T., Sp.BA'
  ],
  'Bedah Digestif & Umum': [
    'dr. Hendra K., Sp.B, Subsp.BD(K)'
  ],
  'Urologi': [
    'dr. Andi W., Sp.U'
  ],
  'Ortopedi': [],
  'Bedah Saraf': [],
  'BTKV': [],
  'Bedah Plastik': [],
  'Bedah Onkologi': []
};

/**
 * Master database ruangan dengan urutan tetap resmi:
 * 1. IGD
 * 2. Seroja
 * 3. NICU
 * 4. PICU
 * 5. ICCU
 * 6. ICU
 * 7. Ratai
 * 8. Anggrek
 * 9. Edelweiss
 * 10. Cempaka
 * 11. Aster
 * 12. Melati
 * 13. Flamboyan 1
 * 14. Flamboyan 2
 * 15. HCU
 * 16. Angsoka
 * 17. Dahlia
 */
export const MASTER_ROOMS: string[] = [
  'IGD',
  'Seroja',
  'NICU',
  'PICU',
  'ICCU',
  'ICU',
  'Ratai',
  'Anggrek',
  'Edelweiss',
  'Cempaka',
  'Aster',
  'Melati',
  'Flamboyan 1',
  'Flamboyan 2',
  'HCU',
  'Angsoka',
  'Dahlia'
];

export const DEFAULT_ROOMS = MASTER_ROOMS;

/**
 * 4 Ruangan perawatan intensif yang wajib menggunakan format "Bed" bukan "Kamar":
 * - NICU
 * - PICU
 * - ICCU
 * - ICU
 */
export const BED_ONLY_ROOMS: string[] = ['NICU', 'PICU', 'ICCU', 'ICU'];

export function isBedRoom(roomName?: string): boolean {
  if (!roomName) return false;
  const upper = roomName.trim().toUpperCase();
  return BED_ONLY_ROOMS.some((r) => r.toUpperCase() === upper);
}

export function normalizeRoomName(roomName?: string): string {
  if (!roomName) return '';
  const trimmed = roomName.trim();
  const found = MASTER_ROOMS.find((r) => r.toLowerCase() === trimmed.toLowerCase());
  return found || trimmed;
}

export function formatKamarOrBed(roomName?: string, kamarVal?: string): string {
  const isBed = isBedRoom(roomName);
  if (!kamarVal || !kamarVal.trim() || kamarVal.trim() === '-' || kamarVal.trim().toLowerCase() === 'kamar -') {
    return isBed ? 'Bed -' : 'K-';
  }
  const clean = kamarVal.trim();
  if (isBed) {
    if (/^bed\s*/i.test(clean)) {
      return clean.replace(/^bed\s*/i, 'Bed ');
    }
    return `Bed ${clean}`;
  }

  // Ruangan selain 4 ruangan khusus (misal: Seroja, Teratai, Dahlia, dll):
  // Format menjadi "K2003", "K201", dsb.
  let nonBed = clean;
  if (/^kamar\s*/i.test(nonBed)) {
    nonBed = nonBed.replace(/^kamar\s*/i, '');
  } else if (/^k[\.\s]+/i.test(nonBed)) {
    nonBed = nonBed.replace(/^k[\.\s]+/i, '');
  } else if (/^k(?=[0-9])/i.test(nonBed)) {
    nonBed = nonBed.replace(/^k/i, '');
  }
  return `K${nonBed}`;
}

export function parseAgeInYears(ageStr?: string): number | null {
  if (!ageStr) return null;
  const s = ageStr.toLowerCase().trim();
  if (!s) return null;

  // Check months (bln, bulan, month, m)
  if (/(bln|bulan|month)/i.test(s) && !/(th|tahun|yr|year)/i.test(s)) {
    const match = s.match(/(\d+(?:[.,]\d+)?)/);
    if (match) {
      return parseFloat(match[1].replace(',', '.')) / 12;
    }
    return 0;
  }

  // Check days (hr, hari, day, d)
  if (/(hr|hari|day)/i.test(s) && !/(th|tahun|yr|year)/i.test(s)) {
    const match = s.match(/(\d+(?:[.,]\d+)?)/);
    if (match) {
      return parseFloat(match[1].replace(',', '.')) / 365;
    }
    return 0;
  }

  // Check weeks (mgg, minggu, wk, week)
  if (/(mgg|minggu|wk|week)/i.test(s) && !/(th|tahun|yr|year)/i.test(s)) {
    const match = s.match(/(\d+(?:[.,]\d+)?)/);
    if (match) {
      return parseFloat(match[1].replace(',', '.')) / 52;
    }
    return 0;
  }

  // Years or pure numbers (e.g. "17 th", "45", "18 tahun", "2th", "0.5 th")
  const match = s.match(/(\d+(?:[.,]\d+)?)/);
  if (match) {
    return parseFloat(match[1].replace(',', '.'));
  }

  return null;
}

export function getPatientHonorific(ageStr?: string, jk?: 'L' | 'P' | string): 'An.' | 'Tn.' | 'Ny.' {
  const ageYears = parseAgeInYears(ageStr);
  if (ageYears !== null) {
    if (ageYears < 18) {
      return 'An.';
    } else {
      return jk === 'P' ? 'Ny.' : 'Tn.';
    }
  }
  // Default if age not parsed yet
  return jk === 'P' ? 'Ny.' : 'Tn.';
}

export function formatPatientNameWithHonorific(
  name?: string,
  ageStr?: string,
  jk?: 'L' | 'P' | string
): string {
  if (!name || !name.trim()) return '';
  const trimmed = name.trim();
  const prefix = getPatientHonorific(ageStr, jk);

  let cleanName = trimmed;
  // Handle By. Ny. ... or Bayi Ny. ...
  if (/^(by\.?\s*ny\.?|bayi\s*ny\.?)\s+/i.test(cleanName)) {
    cleanName = cleanName.replace(/^(by\.?\s*|bayi\s*)/i, '').trim();
    if (prefix !== 'An.') {
      cleanName = cleanName.replace(/^(ny\.?|nyonya)\s+/i, '').trim();
    }
  } else {
    // Strip existing prefixes like Tn., Ny., An., By., Nn., Sdr., Sdri., Tuan, Nyonya, Anak, Bayi
    cleanName = cleanName.replace(
      /^(tn\.?|ny\.?|an\.?|by\.?|nn\.?|sdr\.?|sdri\.?|tuan|nyonya|anak|bayi)\s+/i,
      ''
    ).trim();
  }

  if (!cleanName) return `${prefix} ${trimmed}`;
  return `${prefix} ${cleanName}`;
}

export const SAMPLE_PATIENTS: Patient[] = [
  {
    id: 'sample-p1',
    dpjp: 'dr. Andi W., Sp.U',
    room: 'Seroja',
    kamar: 'K201',
    name: 'Tn. Budi Santoso',
    jk: 'L',
    age: '54 th',
    rm: '00-88-21-45',
    dx: 'BPH Grade III post TURP H+1, DC (+), irigasi jernih',
    status: 'Masih Rawat',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sample-p2',
    dpjp: 'dr. Andi W., Sp.U',
    room: 'IGD',
    kamar: 'Bed 4',
    name: 'Ny. Siti Rahayu',
    jk: 'P',
    age: '42 th',
    rm: '00-89-10-33',
    dx: 'Colic renal dextra ec Susp. Batu Ureter 1/3 distal, VAS 5',
    status: 'Masih Rawat',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sample-p3',
    dpjp: 'dr. Hendra K., Sp.B, Subsp.BD(K)',
    room: 'Seroja',
    kamar: 'K205',
    name: 'An. Daffa Pratama',
    jk: 'L',
    age: '14 th',
    rm: '00-90-12-09',
    dx: 'Post Appendectomy Laparoskopi H+2 ec Appendicitis Akut Perforasi, drain minimal',
    status: 'ACC KRS',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sample-p4',
    dpjp: 'dr. Hendra K., Sp.B, Subsp.BD(K)',
    room: 'ICU',
    kamar: 'Bed 2',
    name: 'Tn. Hendro Wijaya',
    jk: 'L',
    age: '61 th',
    rm: '00-87-99-12',
    dx: 'Post Laparatomi Eksplorasi ec Perforasi Gaster, on ventilator, hemodinamik stabil dengan NE 0.05',
    status: 'Masih Rawat',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sample-p5',
    dpjp: 'dr. Santi Rini., Sp.BA., Subsp.DA(K)',
    room: 'NICU',
    kamar: 'Bed 1',
    name: 'An. Ny. Rahmawati',
    jk: 'L',
    age: '3 hr',
    rm: '00-91-05-22',
    dx: 'Post Repair Atresia Ani H+1, TPN terpasang, saturasi 98% O2 nasal kanul',
    status: 'Masih Rawat',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sample-p6',
    dpjp: 'dr. Fahad Ahmed Shah Khaisama T., Sp.BA',
    room: 'PICU',
    kamar: 'Bed 3',
    name: 'An. Kevin Pratama',
    jk: 'L',
    age: '2 th',
    rm: '00-92-44-11',
    dx: 'Post Laparotomi Reduksi Invaginasi H+1, NGT alir cairan kehijauan minimal, luka operasi tenang',
    status: 'Masih Rawat',
    updatedAt: new Date().toISOString()
  }
];

export const DEFAULT_TEAM_CODES: Record<string, string> = {
  'Bedah Digestif & Umum': 'DIGESTIF',
  'Bedah Anak': 'BEDAH-ANAK',
  'Urologi': 'UROLOGI',
  'Ortopedi': 'ORTOPEDI',
  'Bedah Saraf': 'BEDAH-SARAF',
  'BTKV': 'BTKV',
  'Bedah Plastik': 'BEDAH-PLASTIK',
  'Bedah Onkologi': 'ONKOLOGI'
};

export function getDefaultTeamCode(division: string): string {
  return DEFAULT_TEAM_CODES[division] || division.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
}

