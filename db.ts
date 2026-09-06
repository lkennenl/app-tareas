import * as SQLite from 'expo-sqlite';

export type Task = {
  id: number;
  text: string;
  completed: boolean;
  position: number;
};

const db = SQLite.openDatabaseSync('tareas.db');

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL
    );
  `);
}

export function getAllTasks(): Task[] {
  const rows = db.getAllSync<any>('SELECT * FROM tasks ORDER BY position ASC;');
  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    completed: r.completed === 1,
    position: r.position,
  }));
}

export function addTaskDb(text: string) {
  const maxPos = db.getFirstSync<any>('SELECT MAX(position) as maxPos FROM tasks;');
  const nextPos = (maxPos?.maxPos ?? -1) + 1;
  db.runSync('INSERT INTO tasks (text, completed, position) VALUES (?, 0, ?);', [text, nextPos]);
}

export function updateTaskText(id: number, text: string) {
  db.runSync('UPDATE tasks SET text = ? WHERE id = ?;', [text, id]);
}

export function toggleTaskComplete(id: number, completed: boolean) {
  db.runSync('UPDATE tasks SET completed = ? WHERE id = ?;', [completed ? 1 : 0, id]);
}

export function deleteTaskDb(id: number) {
  db.runSync('DELETE FROM tasks WHERE id = ?;', [id]);
}

export function swapPositions(idA: number, posA: number, idB: number, posB: number) {
  db.runSync('UPDATE tasks SET position = ? WHERE id = ?;', [posB, idA]);
  db.runSync('UPDATE tasks SET position = ? WHERE id = ?;', [posA, idB]);
}

export function reorderTasks(orderedIds: number[]) {
  orderedIds.forEach((id, index) => {
    db.runSync('UPDATE tasks SET position = ? WHERE id = ?;', [index, id]);
  });
}