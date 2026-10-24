import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Category, DayCompletionCount, Priority, Subtask, Task } from "./db";

const PRIORITY_LABELS: Record<Priority, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  alta: "#dc2626",
  media: "#f59e0b",
  baja: "#22c55e",
};

const CATEGORY_LABELS: Record<Category, string> = {
  trabajo: "Trabajo",
  estudio: "Estudio",
  personal: "Personal",
  hogar: "Hogar",
};

const CATEGORY_COLORS: Record<Category, string> = {
  trabajo: "#2563eb",
  estudio: "#7c3aed",
  personal: "#0d9488",
  hogar: "#ca8a04",
};

function formatDisplayDate(iso: string | null): string {
  if (!iso) return "-";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function isOverdue(iso: string | null, completed: boolean): boolean {
  if (!iso || completed) return false;
  const today = new Date().toISOString().split("T")[0];
  return iso < today;
}

const WEEKDAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

function formatWeekdayLabel(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return WEEKDAY_LABELS[date.getDay()];
}

function formatAvgCompletionTime(hours: number | null): string {
  if (hours === null) return "Sin datos aún";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} días`;
}

function buildHtml(
  tasks: Task[],
  subtasks: Subtask[],
  weeklyCompletions: DayCompletionCount[],
  avgCompletionHours: number | null,
): string {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.completed)).length;
  const completionRate = total === 0 ? 0 : (completed / total) * 100;

  const generatedAt = new Date().toLocaleString("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const summaryText =
    total === 0
      ? "No hay tareas registradas en este momento."
      : `Este reporte incluye un total de ${total} tarea${total === 1 ? "" : "s"}, de las cuales ${completed} ${completed === 1 ? "ha sido completada" : "han sido completadas"} y ${pending} ${pending === 1 ? "permanece pendiente" : "permanecen pendientes"}.${overdue > 0 ? ` De las pendientes, ${overdue} ${overdue === 1 ? "se encuentra vencida" : "se encuentran vencidas"}.` : ""}`;

  const maxWeekly = Math.max(1, ...weeklyCompletions.map((d) => d.count));
  const weeklyBarsHtml = weeklyCompletions
    .map((d) => {
      const heightPct = (d.count / maxWeekly) * 100;
      return `
        <div class="weekly-bar-col">
          <span class="weekly-bar-count">${d.count}</span>
          <div class="weekly-bar-track">
            <div class="weekly-bar-fill" style="height:${Math.max(heightPct, 4)}%"></div>
          </div>
          <span class="weekly-bar-label">${formatWeekdayLabel(d.date)}</span>
        </div>
      `;
    })
    .join("");

  const rows = tasks
    .map((t) => {
      const overdueRow = isOverdue(t.dueDate, t.completed);
      const taskSubtasks = subtasks.filter((s) => s.taskId === t.id);
      const completedSubtasks = taskSubtasks.filter((s) => s.completed).length;
      const subtasksCell =
        taskSubtasks.length > 0
          ? `${completedSubtasks}/${taskSubtasks.length}`
          : "-";
      return `
        <tr>
          <td>${t.text}</td>
          <td><span class="badge" style="color:${PRIORITY_COLORS[t.priority]}; border-color:${PRIORITY_COLORS[t.priority]}">${PRIORITY_LABELS[t.priority]}</span></td>
          <td><span class="badge" style="color:${CATEGORY_COLORS[t.category]}; border-color:${CATEGORY_COLORS[t.category]}">${CATEGORY_LABELS[t.category]}</span></td>
          <td>${formatDisplayDate(t.dueDate)}${overdueRow ? " (vencida)" : ""}</td>
          <td>${t.completed ? "Completada" : "Pendiente"}</td>
          <td>${subtasksCell}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: Helvetica, Arial, sans-serif;
            color: #1e293b;
            padding: 28px;
          }
          h1 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 2px;
            color: #0f172a;
          }
          .subtitle {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 18px;
          }
          .summary-text {
            font-size: 12px;
            color: #334155;
            line-height: 1.5;
            margin-bottom: 22px;
            padding: 12px 14px;
            background-color: #f8fafc;
            border-left: 3px solid #2563eb;
            border-radius: 4px;
          }
          .summary {
            display: flex;
            gap: 14px;
            margin-bottom: 26px;
          }
          .summary-item {
            flex: 1;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 16px 10px;
            text-align: center;
          }
          .summary-item .number {
            font-size: 24px;
            font-weight: bold;
            display: block;
          }
          .summary-item .label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 7px 9px;
            text-align: left;
          }
          th {
            background-color: #f1f5f9;
            font-size: 10px;
            text-transform: uppercase;
            color: #475569;
          }
          .badge {
            border: 1px solid;
            border-radius: 10px;
            padding: 1px 8px;
            font-size: 10px;
            font-weight: bold;
          }
          .weekly-section {
            margin-bottom: 26px;
          }
          .weekly-section h2 {
            font-size: 14px;
            color: #0f172a;
            margin-bottom: 10px;
          }
          .weekly-chart {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 14px;
          }
          .weekly-bar-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .weekly-bar-count {
            font-size: 9px;
            color: #64748b;
            margin-bottom: 3px;
          }
          .weekly-bar-track {
            position: relative;
            width: 14px;
            height: 60px;
            background-color: #f1f5f9;
            border-radius: 6px;
            overflow: hidden;
          }
          .weekly-bar-fill {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            background-color: #4f46e5;
            border-radius: 6px;
          }
          .weekly-bar-label {
            font-size: 9px;
            color: #94a3b8;
            margin-top: 4px;
          }
          .avg-completion {
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            text-align: center;
          }
          .avg-completion .avg-label {
            font-size: 10px;
            color: #64748b;
            display: block;
            margin-bottom: 2px;
          }
          .avg-completion .avg-value {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
          }
        </style>
      </head>
      <body>
        <h1>Reporte de tareas</h1>
        <div class="subtitle">Generado el ${generatedAt}</div>

        <div class="summary-text">${summaryText}</div>

        <div class="summary">
          <div class="summary-item">
            <span class="number">${total}</span>
            <span class="label">Total</span>
          </div>
          <div class="summary-item">
            <span class="number" style="color:#22c55e">${completed}</span>
            <span class="label">Completadas</span>
          </div>
          <div class="summary-item">
            <span class="number" style="color:#f59e0b">${pending}</span>
            <span class="label">Pendientes</span>
          </div>
          <div class="summary-item">
            <span class="number" style="color:#dc2626">${overdue}</span>
            <span class="label">Vencidas</span>
          </div>
          <div class="summary-item">
            <span class="number" style="color:#2563eb">${completionRate.toFixed(1)}%</span>
            <span class="label">Completado</span>
          </div>
        </div>

        <div class="weekly-section">
          <h2>Productividad semanal</h2>
          <div class="weekly-chart">
            ${weeklyBarsHtml}
          </div>
          <div class="avg-completion">
            <span class="avg-label">Tiempo promedio en completar una tarea</span>
            <span class="avg-value">${formatAvgCompletionTime(avgCompletionHours)}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Prioridad</th>
              <th>Categoría</th>
              <th>Fecha límite</th>
              <th>Estado</th>
              <th>Subtareas</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6">No hay tareas registradas.</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

export async function generateAndShareReport(
  tasks: Task[],
  subtasks: Subtask[],
  weeklyCompletions: DayCompletionCount[],
  avgCompletionHours: number | null,
): Promise<void> {
  const html = buildHtml(
    tasks,
    subtasks,
    weeklyCompletions,
    avgCompletionHours,
  );
  const { base64 } = await Print.printToFileAsync({ html, base64: true });

  if (!base64) {
    throw new Error("No se pudo generar el contenido del PDF.");
  }

  const destination = `${FileSystem.cacheDirectory}reporte-tareas.pdf`;
  await FileSystem.writeAsStringAsync(destination, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(destination, {
      mimeType: "application/pdf",
      dialogTitle: "Compartir reporte de tareas",
    });
  }
}
