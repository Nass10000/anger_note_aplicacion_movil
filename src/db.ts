import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('angertrack.db');

export async function initDB(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      intensity INTEGER NOT NULL
    );
  `);
  
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS anger_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      note TEXT NOT NULL
    );
  `);
}

export async function addEntry(intensity: number): Promise<void> {
  const ts = Date.now();
  await db.runAsync(
    'INSERT INTO entries (ts, intensity) VALUES (?, ?)',
    [ts, intensity]
  );
}

function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime(); }
function endOfDay(d: Date)   { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime(); }

type TodayStats = { count: number; avg: number };

export async function statsToday(): Promise<TodayStats> {
  const now = new Date();
  const s = startOfDay(now);
  const e = endOfDay(now);
  
  const result = await db.getAllAsync<{ cnt: number; avg: number }>(
    'SELECT COUNT(*) as cnt, AVG(intensity) as avg FROM entries WHERE ts BETWEEN ? AND ?',
    [s, e]
  );
  
  const row = result[0];
  return {
    count: row?.cnt ? Number(row.cnt) : 0,
    avg: row?.avg ? Number(Number(row.avg).toFixed(2)) : 0
  };
}

type MonthAvg = { label: string; avg: number };

function monthRange(year: number, monthIndex: number) {
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0).getTime();
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999).getTime();
  return { start, end };
}

function monthLabel(year: number, monthIndex: number) {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleString(undefined, { month: 'short' });
}

async function averageForMonth(year: number, monthIndex: number): Promise<number> {
  const { start, end } = monthRange(year, monthIndex);
  
  const result = await db.getAllAsync<{ avg: number }>(
    'SELECT AVG(intensity) as avg FROM entries WHERE ts BETWEEN ? AND ?',
    [start, end]
  );
  
  const row = result[0];
  return row?.avg ? Number(Number(row.avg).toFixed(2)) : 0;
}

export async function last3MonthsAverages(): Promise<MonthAvg[]> {
  const now = new Date();
  const months: MonthAvg[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const avg = await averageForMonth(d.getFullYear(), d.getMonth());
    months.push({ label: monthLabel(d.getFullYear(), d.getMonth()), avg });
  }
  return months;
}

export async function lastYearAverages(): Promise<MonthAvg[]> {
  const now = new Date();
  const months: MonthAvg[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const avg = await averageForMonth(d.getFullYear(), d.getMonth());
    months.push({ label: monthLabel(d.getFullYear(), d.getMonth()), avg });
  }
  return months;
}

// Nueva función para obtener estadísticas por semestre
type SemesterAvg = { label: string; avg: number };

export async function lastSemestersAverages(): Promise<SemesterAvg[]> {
  const now = new Date();
  const semesters: SemesterAvg[] = [];
  
  // Calculamos los últimos 2 semestres (1 año completo)
  for (let i = 1; i >= 0; i--) {
    const monthsAgo = i * 6;
    let sumAvg = 0;
    let count = 0;
    
    // Sumamos los promedios de 6 meses
    for (let j = 0; j < 6; j++) {
      const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo - j, 1);
      const avg = await averageForMonth(d.getFullYear(), d.getMonth());
      if (avg > 0) {
        sumAvg += avg;
        count++;
      }
    }
    
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const year = d.getFullYear();
    const semester = d.getMonth() < 6 ? 1 : 2;
    
    semesters.push({
      label: `S${semester} ${year}`,
      avg: count > 0 ? Number((sumAvg / count).toFixed(2)) : 0
    });
  }
  
  return semesters.reverse();
}

// Nueva función para obtener estadísticas de los últimos 7 días
type DayAvg = { label: string; avg: number };

export async function last7DaysAverages(): Promise<DayAvg[]> {
  const days: DayAvg[] = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const start = startOfDay(date);
    const end = endOfDay(date);
    
    const result = await db.getAllAsync<{ avg: number }>(
      'SELECT AVG(intensity) as avg FROM entries WHERE ts BETWEEN ? AND ?',
      [start, end]
    );
    
    const dayLabel = i === 0 ? 'Hoy' : 
                     i === 1 ? 'Ayer' : 
                     date.toLocaleString('es', { weekday: 'short' });
    
    days.push({
      label: dayLabel,
      avg: result[0]?.avg ? Number(Number(result[0].avg).toFixed(2)) : 0
    });
  }
  
  return days;
}

// Nueva función para obtener estadísticas del último mes (30 días)
export async function last30DaysAverage(): Promise<{ label: string; avg: number }> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const start = startOfDay(thirtyDaysAgo);
  const end = endOfDay(now);
  
  const result = await db.getAllAsync<{ avg: number; cnt: number }>(
    'SELECT AVG(intensity) as avg, COUNT(*) as cnt FROM entries WHERE ts BETWEEN ? AND ?',
    [start, end]
  );
  
  return {
    label: 'Últimos 30 días',
    avg: result[0]?.avg ? Number(Number(result[0].avg).toFixed(2)) : 0
  };
}

// Nueva función para obtener estadísticas de los últimos 6 meses
export async function last6MonthsAverages(): Promise<MonthAvg[]> {
  const now = new Date();
  const months: MonthAvg[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const avg = await averageForMonth(d.getFullYear(), d.getMonth());
    months.push({ label: monthLabel(d.getFullYear(), d.getMonth()), avg });
  }
  
  return months;
}

// Función para obtener todos los registros
export type Entry = {
  id: number;
  ts: number;
  intensity: number;
};

export async function getAllEntries(): Promise<Entry[]> {
  const result = await db.getAllAsync<Entry>(
    'SELECT id, ts, intensity FROM entries ORDER BY ts DESC'
  );
  return result;
}

// Función para borrar un registro individual
export async function deleteEntry(id: number): Promise<void> {
  await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
}

// Función para borrar todos los registros
export async function deleteAllEntries(): Promise<void> {
  await db.runAsync('DELETE FROM entries');
}

// ========== FUNCIONES DE CONSULTA HISTÓRICA ==========

// Obtener todos los años con registros
export async function getAvailableYears(): Promise<number[]> {
  const result = await db.getAllAsync<{ year: number }>(
    `SELECT DISTINCT strftime('%Y', datetime(ts/1000, 'unixepoch')) as year 
     FROM entries 
     ORDER BY year DESC`
  );
  return result.map(r => Number(r.year));
}

// Estadísticas de un año específico (promedio mensual)
export async function getYearStats(year: number): Promise<MonthAvg[]> {
  const months: MonthAvg[] = [];
  for (let month = 0; month < 12; month++) {
    const avg = await averageForMonth(year, month);
    months.push({ 
      label: monthLabel(year, month), 
      avg 
    });
  }
  return months;
}

// Estadísticas de un mes específico (promedio diario)
type DayStats = { day: number; label: string; avg: number; count: number };

export async function getMonthStats(year: number, month: number): Promise<DayStats[]> {
  const days: DayStats[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const start = startOfDay(date);
    const end = endOfDay(date);
    
    const result = await db.getAllAsync<{ avg: number; cnt: number }>(
      'SELECT AVG(intensity) as avg, COUNT(*) as cnt FROM entries WHERE ts BETWEEN ? AND ?',
      [start, end]
    );
    
    days.push({
      day,
      label: `${day}`,
      avg: result[0]?.avg ? Number(Number(result[0].avg).toFixed(2)) : 0,
      count: result[0]?.cnt ? Number(result[0].cnt) : 0
    });
  }
  
  return days;
}

// Estadísticas de un día específico
export async function getDayStats(year: number, month: number, day: number): Promise<{ entries: Entry[]; avg: number; count: number }> {
  const date = new Date(year, month, day);
  const start = startOfDay(date);
  const end = endOfDay(date);
  
  const entries = await db.getAllAsync<Entry>(
    'SELECT id, ts, intensity FROM entries WHERE ts BETWEEN ? AND ? ORDER BY ts DESC',
    [start, end]
  );
  
  const result = await db.getAllAsync<{ avg: number; cnt: number }>(
    'SELECT AVG(intensity) as avg, COUNT(*) as cnt FROM entries WHERE ts BETWEEN ? AND ?',
    [start, end]
  );
  
  return {
    entries,
    avg: result[0]?.avg ? Number(Number(result[0].avg).toFixed(2)) : 0,
    count: result[0]?.cnt ? Number(result[0].cnt) : 0
  };
}

// Obtener rango de fechas con registros
export async function getDateRange(): Promise<{ oldest: number; newest: number }> {
  const result = await db.getAllAsync<{ minTs: number; maxTs: number }>(
    'SELECT MIN(ts) as minTs, MAX(ts) as maxTs FROM entries'
  );
  
  return {
    oldest: result[0]?.minTs || Date.now(),
    newest: result[0]?.maxTs || Date.now()
  };
}

// ========== FUNCIONES PARA ANGER NOTES ==========

export type AngerNote = {
  id: number;
  ts: number;
  note: string;
};

// Agregar una nota de enojo
export async function addAngerNote(note: string): Promise<void> {
  const ts = Date.now();
  await db.runAsync(
    'INSERT INTO anger_notes (ts, note) VALUES (?, ?)',
    [ts, note]
  );
}

// Obtener todas las notas
export async function getAllAngerNotes(): Promise<AngerNote[]> {
  const result = await db.getAllAsync<AngerNote>(
    'SELECT id, ts, note FROM anger_notes ORDER BY ts DESC'
  );
  return result;
}

// Borrar una nota individual
export async function deleteAngerNote(id: number): Promise<void> {
  await db.runAsync('DELETE FROM anger_notes WHERE id = ?', [id]);
}

// Borrar todas las notas
export async function deleteAllAngerNotes(): Promise<void> {
  await db.runAsync('DELETE FROM anger_notes');
}
