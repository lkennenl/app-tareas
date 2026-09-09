import * as SQLite from "expo-sqlite";

export type Priority = "alta" | "media" | "baja";
export type Category = "trabajo" | "estudio" | "personal" | "hogar";

export type Task = {
  id: number;
  text: string;
  completed: boolean;
  position: number;
  priority: Priority;
  category: Category;
  dueDate: string | null;
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

  const columns = db.getAllSync<any>("PRAGMA table_info(tasks);");

  const hasPriority = columns.some((col) => col.name === "priority");
  if (!hasPriority) {
    db.execSync(
      `ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'media';`,
    );
  }

  const hasCategory = columns.some((col) => col.name === "category");
  if (!hasCategory) {
    db.execSync(
      `ALTER TABLE tasks ADD COLUMN category TEXT NOT NULL DEFAULT 'personal';`,
    );
  }

  const hasDueDate = columns.some((col) => col.name === "dueDate");
  if (!hasDueDate) {
    db.execSync(`ALTER TABLE tasks ADD COLUMN dueDate TEXT DEFAULT NULL;`);
  }
}

export function getAllTasks(): Task[] {
  const rows = db.getAllSync<any>(`
    SELECT * FROM tasks
    ORDER BY
      CASE WHEN dueDate IS NOT NULL AND dueDate < date('now') AND completed = 0 THEN 0 ELSE 1 END ASC,
      CASE priority WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END ASC,
      CASE WHEN dueDate IS NULL THEN 1 ELSE 0 END ASC,
      dueDate ASC;
  `);
  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    completed: r.completed === 1,
    position: r.position,
    priority: r.priority as Priority,
    category: r.category as Category,
    dueDate: r.dueDate,
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

export function addTaskDb(
  text: string,
  priority: Priority,
  category: Category,
  dueDate: string | null,
) {
  const maxPos = db.getFirstSync<any>(
    "SELECT MAX(position) as maxPos FROM tasks;",
  );
  const nextPos = (maxPos?.maxPos ?? -1) + 1;
  db.runSync(
    "INSERT INTO tasks (text, completed, position, priority, category, dueDate) VALUES (?, 0, ?, ?, ?, ?);",
    [text, nextPos, priority, category, dueDate],
  );
}

export function updateTaskText(
  id: number,
  text: string,
  priority: Priority,
  category: Category,
  dueDate: string | null,
) {
  db.runSync(
    "UPDATE tasks SET text = ?, priority = ?, category = ?, dueDate = ? WHERE id = ?;",
    [text, priority, category, dueDate, id],
  );
}

export function updateTaskDueDate(id: number, dueDate: string | null) {
  db.runSync("UPDATE tasks SET dueDate = ? WHERE id = ?;", [dueDate, id]);
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
