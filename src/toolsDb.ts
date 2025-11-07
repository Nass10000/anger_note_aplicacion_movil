import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('angertrack.db');

export interface Tool {
  id: number;
  name: string;
  description: string;
  createdAt: number;
}

export async function initToolsDB(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      createdAt INTEGER NOT NULL
    );
  `);
}

export async function addTool(name: string, description: string = ''): Promise<void> {
  const createdAt = Date.now();
  await db.runAsync(
    'INSERT INTO tools (name, description, createdAt) VALUES (?, ?, ?)',
    [name, description, createdAt]
  );
}

export async function getTools(): Promise<Tool[]> {
  const result = await db.getAllAsync<Tool>(
    'SELECT id, name, description, createdAt FROM tools ORDER BY createdAt ASC'
  );
  return result;
}

export async function deleteTool(id: number): Promise<void> {
  await db.runAsync('DELETE FROM tools WHERE id = ?', [id]);
}

export async function deleteAllTools(): Promise<void> {
  await db.runAsync('DELETE FROM tools');
}
