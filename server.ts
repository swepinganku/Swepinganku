import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface Patient {
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

interface DivisionTeam {
  teamCode: string;
  division: string;
  teamName: string;
  members: string[];
  createdAt: string;
  lastUpdated: string;
}

// In-memory data store with default teams
const teamsStore = new Map<string, DivisionTeam>();
const patientsStore = new Map<string, Patient[]>(); // key: `${teamCode}:${date}`

// Initialize default teams for surgical divisions
const DEFAULT_DIVISIONS = [
  { division: 'Bedah Digestif', code: 'DIGESTIF', name: 'Tim Digestif' },
  { division: 'Bedah Onkologi', code: 'ONKOLOGI', name: 'Tim Onkologi' },
  { division: 'Orthopedi & Traumatologi', code: 'ORTHOPEDI', name: 'Tim Orthopedi' },
  { division: 'Urologi', code: 'UROLOGI', name: 'Tim Urologi' },
  { division: 'Bedah Anak', code: 'BEDAH-ANAK', name: 'Tim Bedah Anak' },
  { division: 'Bedah Saraf', code: 'BEDAH-SARAF', name: 'Tim Bedah Saraf' },
  { division: 'Bedah Plastik Rekonstruksi', code: 'BEDAH-PLASTIK', name: 'Tim Bedah Plastik' },
  { division: 'Bedah Toraks Kardiovaskular (BTKV)', code: 'BTKV', name: 'Tim BTKV' },
  { division: 'Bedah Umum', code: 'BEDAH-UMUM', name: 'Tim Bedah Umum' }
];

DEFAULT_DIVISIONS.forEach(d => {
  teamsStore.set(d.code.toUpperCase(), {
    teamCode: d.code.toUpperCase(),
    division: d.division,
    teamName: d.name,
    members: ['dr. Muda 1 (Koas)'],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  });
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", teamsCount: teamsStore.size, timestamp: new Date().toISOString() });
  });

  // API: List all teams or search by division
  app.get("/api/teams", (req, res) => {
    const list = Array.from(teamsStore.values());
    res.json(list);
  });

  // API: Get single team info
  app.get("/api/teams/:code", (req, res) => {
    const code = req.params.code.toUpperCase();
    const team = teamsStore.get(code);
    if (!team) {
      return res.status(404).json({ error: "Tim tidak ditemukan dengan kode tersebut" });
    }
    res.json(team);
  });

  // API: Join or create a team
  app.post("/api/teams/join", (req, res) => {
    const { teamCode, division, teamName, memberName } = req.body;
    if (!teamCode) {
      return res.status(400).json({ error: "Kode Tim/PIN wajib diisi" });
    }

    const cleanCode = String(teamCode).trim().toUpperCase();
    let team = teamsStore.get(cleanCode);

    if (!team) {
      // Create new team if code doesn't exist
      team = {
        teamCode: cleanCode,
        division: division || 'Bedah Digestif',
        teamName: teamName || `Tim ${division || 'Bedah'} (${cleanCode})`,
        members: memberName ? [memberName.trim()] : ['Koas'],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      teamsStore.set(cleanCode, team);
    } else {
      // Update team members if memberName provided
      if (memberName && memberName.trim()) {
        const cleanMember = memberName.trim();
        if (!team.members.includes(cleanMember)) {
          team.members.push(cleanMember);
        }
      }
      if (division) {
        team.division = division;
      }
      team.lastUpdated = new Date().toISOString();
      teamsStore.set(cleanCode, team);
    }

    res.json({ success: true, team });
  });

  // API: Get patients for a specific team and date
  app.get("/api/teams/:code/patients", (req, res) => {
    const code = req.params.code.toUpperCase();
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const key = `${code}:${date}`;
    const list = patientsStore.get(key) || [];
    res.json({
      teamCode: code,
      date,
      patients: list,
      count: list.length,
      lastUpdated: new Date().toISOString()
    });
  });

  // API: Save patients for a team and date
  app.post("/api/teams/:code/patients", (req, res) => {
    const code = req.params.code.toUpperCase();
    const { date, patients, memberName } = req.body;
    if (!date || !Array.isArray(patients)) {
      return res.status(400).json({ error: "Format data pasien atau tanggal tidak valid" });
    }

    const key = `${code}:${date}`;
    patientsStore.set(key, patients);

    // Update team lastUpdated
    const team = teamsStore.get(code);
    if (team) {
      team.lastUpdated = new Date().toISOString();
      if (memberName && !team.members.includes(memberName.trim())) {
        team.members.push(memberName.trim());
      }
      teamsStore.set(code, team);
    }

    res.json({
      success: true,
      teamCode: code,
      date,
      count: patients.length,
      updatedAt: new Date().toISOString()
    });
  });

  // API: Handover (Tarik pasien yang masih rawat inap dari hari sebelumnya)
  app.post("/api/teams/:code/handover", (req, res) => {
    const code = req.params.code.toUpperCase();
    const { fromDate, toDate } = req.body;
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "fromDate dan toDate diperlukan" });
    }

    const fromKey = `${code}:${fromDate}`;
    const toKey = `${code}:${toDate}`;

    const sourcePatients = patientsStore.get(fromKey) || [];
    const targetPatients = patientsStore.get(toKey) || [];

    // Filter source patients that are 'Masih Rawat' or have no status set
    const activePatients = sourcePatients.filter(
      p => !p.status || p.status === 'Masih Rawat'
    );

    // Merge: only add if not already in target patients (by RM or ID)
    let addedCount = 0;
    const updatedTarget = [...targetPatients];

    for (const sp of activePatients) {
      const exists = updatedTarget.some(tp => tp.rm === sp.rm);
      if (!exists) {
        updatedTarget.push({
          ...sp,
          id: `handover-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          updatedAt: new Date().toISOString()
        });
        addedCount++;
      }
    }

    patientsStore.set(toKey, updatedTarget);

    res.json({
      success: true,
      addedCount,
      totalTargetCount: updatedTarget.length,
      targetPatients: updatedTarget
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sweepinganku Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
