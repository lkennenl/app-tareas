import * as SQLite from "expo-sqlite";

export type Priority = "alta" | "media" | "baja";

export type Task = {
  id: number;
  text: string;
  completed: boolean;
  position: number;
  priority: Priority;
};

export type TaskStats = {
  total: number;
  completed: number;
};

const db = SQLite.openDatabaseSync("tareas.db");

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL
    );
  `);

  // Migración: agrega la columna priority si la tabla ya existía sin ella
  const columns = db.getAllSync<any>("PRAGMA table_info(tasks);");
  const hasPriority = columns.some((col) => col.name === "priority");

  if (!hasPriority) {
    db.execSync(
      `ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'media';`,
    );
  }
}

export function getAllTasks(): Task[] {
  const rows = db.getAllSync<any>("SELECT * FROM tasks ORDER BY position ASC;");
  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    completed: r.completed === 1,
    position: r.position,
    priority: r.priority as Priority,
  }));
}

export function getTaskStats(): TaskStats {
  const row = db.getFirstSync<any>(
    "SELECT COUNT(*) as total, SUM(completed) as completed FROM tasks;",
  );
  return {
    total: row?.total ?? 0,
    completed: row?.completed ?? 0,
  };
}

export function addTaskDb(text: string, priority: Priority) {
  const maxPos = db.getFirstSync<any>(
    "SELECT MAX(position) as maxPos FROM tasks;",
  );
  const nextPos = (maxPos?.maxPos ?? -1) + 1;
  db.runSync(
    "INSERT INTO tasks (text, completed, position, priority) VALUES (?, 0, ?, ?);",
    [text, nextPos, priority],
  );
}

export function updateTaskText(id: number, text: string, priority: Priority) {
  db.runSync("UPDATE tasks SET text = ?, priority = ? WHERE id = ?;", [
    text,
    priority,
    id,
  ]);
}

export function toggleTaskComplete(id: number, completed: boolean) {
  db.runSync("UPDATE tasks SET completed = ? WHERE id = ?;", [
    completed ? 1 : 0,
    id,
  ]);
}

export function deleteTaskDb(id: number) {
  db.runSync("DELETE FROM tasks WHERE id = ?;", [id]);
}

export function reorderTasks(orderedIds: number[]) {
  orderedIds.forEach((id, index) => {
    db.runSync("UPDATE tasks SET position = ? WHERE id = ?;", [index, id]);
  });
}

export function swapPositions(
  idA: number,
  posA: number,
  idB: number,
  posB: number,
) {
  db.runSync("UPDATE tasks SET position = ? WHERE id = ?;", [posB, idA]);
  db.runSync("UPDATE tasks SET position = ? WHERE id = ?;", [posA, idB]);
}
