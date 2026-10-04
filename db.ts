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
  createdAt: string | null;
  completedAt: string | null;
};

export type TaskStats = {
  total: number;
  completed: number;
};

export type CategoryCount = { category: Category; count: number };
export type PriorityCount = { priority: Priority; count: number };
export type DayCompletionCount = { date: string; count: number };

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
  const columnNames = columns.map((col) => col.name);

  const ensureColumn = (name: string, definition: string) => {
    if (!columnNames.includes(name)) {
      db.execSync(`ALTER TABLE tasks ADD COLUMN ${name} ${definition};`);
    }
  };

  ensureColumn("priority", "TEXT NOT NULL DEFAULT 'media'");
  ensureColumn("category", "TEXT NOT NULL DEFAULT 'personal'");
  ensureColumn("dueDate", "TEXT DEFAULT NULL");
  ensureColumn("createdAt", "TEXT DEFAULT NULL");
  ensureColumn("completedAt", "TEXT DEFAULT NULL");
}

export function getAllTasks(): Task[] {
  const rows = db.getAllSync<any>(`
    SELECT * FROM tasks
    ORDER BY
      completed ASC,
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
    createdAt: r.createdAt ?? null,
    completedAt: r.completedAt ?? null,
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

export function getCountsByCategory(): CategoryCount[] {
  const rows = db.getAllSync<any>(
    "SELECT category, COUNT(*) as count FROM tasks GROUP BY category;",
  );
  return rows.map((r) => ({
    category: r.category as Category,
    count: r.count,
  }));
}

export function getCountsByPriority(): PriorityCount[] {
  const rows = db.getAllSync<any>(
    "SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority;",
  );
  return rows.map((r) => ({
    priority: r.priority as Priority,
    count: r.count,
  }));
}

export function getOverdueCount(): number {
  const row = db.getFirstSync<any>(
    `SELECT COUNT(*) as count FROM tasks WHERE dueDate IS NOT NULL AND dueDate < date('now') AND completed = 0;`,
  );
  return row?.count ?? 0;
}

export function getCompletedThisWeek(): DayCompletionCount[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }

  const rows = db.getAllSync<any>(
    `SELECT date(completedAt, 'localtime') as date, COUNT(*) as count
     FROM tasks
     WHERE completedAt IS NOT NULL
       AND date(completedAt, 'localtime') >= ?
     GROUP BY date(completedAt, 'localtime');`,
    [weekDates[0]],
  );

  const countByDate = new Map<string, number>();
  rows.forEach((r) => countByDate.set(r.date, r.count));

  return weekDates.map((date) => ({
    date,
    count: countByDate.get(date) ?? 0,
  }));
}

export function getAvgCompletionHours(): number | null {
  const row = db.getFirstSync<any>(`
    SELECT AVG(
      (julianday(completedAt) - julianday(createdAt)) * 24
    ) as avgHours
    FROM tasks
    WHERE completedAt IS NOT NULL AND createdAt IS NOT NULL;
  `);
  return row?.avgHours ?? null;
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
  const now = new Date().toISOString();
  db.runSync(
    "INSERT INTO tasks (text, completed, position, priority, category, dueDate, createdAt) VALUES (?, 0, ?, ?, ?, ?, ?);",
    [text, nextPos, priority, category, dueDate, now],
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
  const completedAt = completed ? new Date().toISOString() : null;
  db.runSync("UPDATE tasks SET completed = ?, completedAt = ? WHERE id = ?;", [
    completed ? 1 : 0,
    completedAt,
    id,
  ]);
}

export function deleteTaskDb(id: number) {
  db.runSync("DELETE FROM tasks WHERE id = ?;", [id]);
}
