export interface Patient {
  id: string;
  dpjp: string;
  room: string;
  kamar: string;
  name: string;
  jk: 'L' | 'P';
  age: string;
  rm: string;
  dx: string;
  status?: 'Masih Rawat' | 'ACC KRS' | 'Pulang' | 'Rujuk';
  updatedAt: string;
}

export type ViewMode = 'dpjp' | 'all';
export type PageMode = 'dashboard' | 'document';

export interface DivisionTeam {
  teamCode: string;
  division: string;
  teamName: string;
  members: string[];
  createdAt?: string;
  lastUpdated?: string;
}

export interface WeeklyRow {
  rm: string;
  name: string;
  jk: string;
  age: string;
  dpjp: string;
  dx: string;
  status: string;
  first: string;
  last: string;
  lastRoom: string;
  lastKamar: string;
  days: Record<string, string>;
}

export interface NextJsFile {
  path: string;
  description: string;
  language: string;
  content: string;
}

export interface RotationWeek {
  id: string;
  weekNumber: number;
  division: string;
  startDate: string;
  endDate: string;
  note?: string;
}
