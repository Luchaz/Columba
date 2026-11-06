import fs from 'fs';
import path from 'path';
import {
  INITIAL_STUDENTS,
  LAB_INFOS,
  LabInfo,
  LECTURER_PROFILES,
  LecturerProfile,
  StudentRecord,
} from './academicData';

const CUSTOM_DATA_FILE = path.join(__dirname, '..', '..', 'data', 'students_custom.json');
const PRIVATE_STUDENTS_FILE = path.join(__dirname, '..', '..', 'data', 'students.json');
const PRIVATE_LECTURERS_FILE = path.join(__dirname, '..', '..', 'data', 'lecturers.json');

class StudentManager {
  private students: StudentRecord[] = [];
  private lecturers: Record<string, LecturerProfile> = { ...LECTURER_PROFILES };

  constructor() {
    this.init();
  }

  private init() {
    try {
      // 1. Load Students: Check Environment Variable (process.env.STUDENTS_DATA)
      let loadedStudents: StudentRecord[] | null = null;
      if (process.env.STUDENTS_DATA) {
        try {
          const raw = process.env.STUDENTS_DATA.trim();
          const jsonStr = raw.startsWith('[') ? raw : Buffer.from(raw, 'base64').toString('utf8');
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedStudents = parsed;
            console.log(`📦 [StudentManager]: Loaded ${loadedStudents.length} students from environment variable.`);
          }
        } catch (e) {
          console.error('⚠️ [StudentManager]: Failed to parse STUDENTS_DATA env variable:', e);
        }
      }

      // 2. Load Students: Check local private data/students.json (git-ignored)
      if (!loadedStudents && fs.existsSync(PRIVATE_STUDENTS_FILE)) {
        try {
          const raw = fs.readFileSync(PRIVATE_STUDENTS_FILE, 'utf8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedStudents = parsed;
            console.log(`📦 [StudentManager]: Loaded ${loadedStudents.length} students from local private storage.`);
          }
        } catch (e) {
          console.error('⚠️ [StudentManager]: Failed to read private students file:', e);
        }
      }

      // 3. Fallback to INITIAL_STUDENTS
      this.students = loadedStudents ? [...loadedStudents] : [...INITIAL_STUDENTS];

      // 4. Load Lecturers: Check Environment Variable (process.env.LECTURERS_DATA)
      if (process.env.LECTURERS_DATA) {
        try {
          const raw = process.env.LECTURERS_DATA.trim();
          const jsonStr = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
          const parsed = JSON.parse(jsonStr);
          if (parsed && typeof parsed === 'object') {
            for (const [name, val] of Object.entries(parsed)) {
              if (val && typeof val === 'object') {
                this.lecturers[name] = val as LecturerProfile;
              }
            }
            console.log(`📦 [StudentManager]: Loaded lecturer data from environment variable.`);
          }
        } catch (e) {
          console.error('⚠️ [StudentManager]: Failed to parse LECTURERS_DATA env variable:', e);
        }
      } else if (fs.existsSync(PRIVATE_LECTURERS_FILE)) {
        // Check local private data/lecturers.json (git-ignored)
        try {
          const raw = fs.readFileSync(PRIVATE_LECTURERS_FILE, 'utf8');
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            this.lecturers = parsed;
            console.log(`📦 [StudentManager]: Loaded ${Object.keys(this.lecturers).length} lecturers from local private storage.`);
          }
        } catch (e) {
          console.error('⚠️ [StudentManager]: Failed to read private lecturers file:', e);
        }
      }

      // 5. Apply user customizations from data/students_custom.json if exists
      if (fs.existsSync(CUSTOM_DATA_FILE)) {
        const raw = fs.readFileSync(CUSTOM_DATA_FILE, 'utf8');
        const customData = JSON.parse(raw) as Record<string, Partial<StudentRecord>>;

        this.students = this.students.map((base) => {
          const override = customData[base.nrp] || {};
          return {
            ...base,
            ...override,
          };
        });
      }
    } catch (err) {
      console.error('⚠️ [StudentManager]: Init encountered an unexpected error:', err);
      this.students = [...INITIAL_STUDENTS];
    }
  }

  public getAll(): StudentRecord[] {
    return this.students;
  }

  public getLecturers(): Record<string, LecturerProfile> {
    return this.lecturers;
  }

  public getByNrp(nrp: string): StudentRecord | undefined {
    const clean = nrp.trim();
    return this.students.find((s) => s.nrp === clean);
  }

  public search(query: string): StudentRecord[] {
    const q = query.toLowerCase().trim();
    return this.students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nrp.includes(q) ||
        s.advisor.toLowerCase().includes(q) ||
        s.lab.toLowerCase() === q ||
        (s.expertise && s.expertise.toLowerCase().includes(q)) ||
        (s.originS1 && s.originS1.toLowerCase().includes(q)) ||
        (s.thesisTopic && s.thesisTopic.toLowerCase().includes(q))
    );
  }

  public getByLab(labCode: string): StudentRecord[] {
    const upper = labCode.toUpperCase().trim();
    return this.students.filter((s) => s.lab === upper);
  }

  public getByAdvisor(advisorQuery: string): StudentRecord[] {
    const q = advisorQuery.toLowerCase().trim();
    return this.students.filter((s) => s.advisor.toLowerCase().includes(q));
  }

  public getAdvisorProfile(advisorName: string): LecturerProfile | undefined {
    const clean = advisorName.trim();
    if (this.lecturers[clean]) return this.lecturers[clean];

    const lower = clean.toLowerCase();
    for (const [key, profile] of Object.entries(this.lecturers)) {
      if (
        key.toLowerCase().includes(lower) ||
        profile.fullName.toLowerCase().includes(lower) ||
        profile.shortName.toLowerCase().includes(lower)
      ) {
        return profile;
      }
    }
    return undefined;
  }

  public getAllAdvisors(): { name: string; lab: string; profile?: LecturerProfile; students: StudentRecord[] }[] {
    const map = new Map<string, { name: string; lab: string; profile?: LecturerProfile; students: StudentRecord[] }>();

    for (const student of this.students) {
      if (!map.has(student.advisor)) {
        map.set(student.advisor, {
          name: student.advisor,
          lab: student.lab,
          profile: this.getAdvisorProfile(student.advisor),
          students: [],
        });
      }
      map.get(student.advisor)!.students.push(student);
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  public updateStudent(nrp: string, updates: Partial<StudentRecord>): boolean {
    const index = this.students.findIndex((s) => s.nrp === nrp.trim());
    if (index === -1) return false;

    this.students[index] = {
      ...this.students[index],
      ...updates,
    };

    try {
      const dataDir = path.dirname(CUSTOM_DATA_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const overrides: Record<string, Partial<StudentRecord>> = {};
      for (const s of this.students) {
        if (s.thesisTopic || s.discordId || s.expertise) {
          overrides[s.nrp] = {
            thesisTopic: s.thesisTopic,
            discordId: s.discordId,
            expertise: s.expertise,
          };
        }
      }

      fs.writeFileSync(CUSTOM_DATA_FILE, JSON.stringify(overrides, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('[StudentManager]: Failed to save custom data:', e);
      return false;
    }
  }
}

export const studentManager = new StudentManager();
