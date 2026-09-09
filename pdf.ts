import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Category, Priority, Task } from "./db";

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

function buildHtml(tasks: Task[]): string {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.completed)).length;

  const generatedAt = new Date().toLocaleString("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const rows = tasks
    .map((t) => {
      const overdueRow = isOverdue(t.dueDate, t.completed);
      return `
        <tr>
          <td>${t.text}</td>
          <td><span class="badge" style="color:${PRIORITY_COLORS[t.priority]}; border-color:${PRIORITY_COLORS[t.priority]}">${PRIORITY_LABELS[t.priority]}</span></td>
          <td>${CATEGORY_LABELS[t.category]}</td>
          <td>${formatDisplayDate(t.dueDate)}${overdueRow ? " (vencida)" : ""}</td>
          <td>${t.completed ? "Completada" : "Pendiente"}</td>
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
            padding: 24px;
          }
          h1 {
            font-size: 20px;
            margin-bottom: 2px;
          }
          .subtitle {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 20px;
          }
          .summary {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
          }
          .summary-item {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 14px;
            text-align: center;
          }
          .summary-item .number {
            font-size: 18px;
            font-weight: bold;
            display: block;
          }
          .summary-item .label {
            font-size: 10px;
            color: #64748b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
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
        </style>
      </head>
      <body>
        <h1>Reporte de tareas</h1>
        <div class="subtitle">Generado el ${generatedAt}</div>

        <div class="summary">
          <div class="summary-item">
            <span class="number">${total}</span>
            <span class="label">Total</span>
          </div>
          <div class="summary-item">
            <span class="number">${completed}</span>
            <span class="label">Completadas</span>
          </div>
          <div class="summary-item">
            <span class="number">${pending}</span>
            <span class="label">Pendientes</span>
          </div>
          <div class="summary-item">
            <span class="number">${overdue}</span>
            <span class="label">Vencidas</span>
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
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5">No hay tareas registradas.</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

export async function generateAndShareReport(tasks: Task[]): Promise<void> {
  const html = buildHtml(tasks);
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
