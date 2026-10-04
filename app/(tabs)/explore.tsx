import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Category,
  CategoryCount,
  DayCompletionCount,
  Priority,
  PriorityCount,
  TaskStats,
  getAllTasks,
  getAvgCompletionHours,
  getCompletedThisWeek,
  getCountsByCategory,
  getCountsByPriority,
  getOverdueCount,
  getTaskStats,
  initDatabase,
} from "../../db";
import { generateAndShareReport } from "../../pdf";

const PRIORITY_COLORS: Record<Priority, string> = {
  alta: "#dc2626",
  media: "#f59e0b",
  baja: "#22c55e",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

const CATEGORY_COLORS: Record<Category, string> = {
  trabajo: "#2563eb",
  estudio: "#7c3aed",
  personal: "#0d9488",
  hogar: "#ca8a04",
};

const CATEGORY_LABELS: Record<Category, string> = {
  trabajo: "Trabajo",
  estudio: "Estudio",
  personal: "Personal",
  hogar: "Hogar",
};

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

export default function ReportsScreen() {
  const [stats, setStats] = useState<TaskStats>({ total: 0, completed: 0 });
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
  const [priorityCounts, setPriorityCounts] = useState<PriorityCount[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [weeklyCompletions, setWeeklyCompletions] = useState<
    DayCompletionCount[]
  >([]);
  const [avgCompletionHours, setAvgCompletionHours] = useState<number | null>(
    null,
  );

  const loadStats = () => {
    setStats(getTaskStats());
    setCategoryCounts(getCountsByCategory());
    setPriorityCounts(getCountsByPriority());
    setOverdueCount(getOverdueCount());
    setWeeklyCompletions(getCompletedThisWeek());
    setAvgCompletionHours(getAvgCompletionHours());
  };

  useFocusEffect(
    useCallback(() => {
      initDatabase();
      loadStats();
    }, []),
  );

  const pending = stats.total - stats.completed;
  const maxCategoryCount = Math.max(1, ...categoryCounts.map((c) => c.count));
  const maxPriorityCount = Math.max(1, ...priorityCounts.map((p) => p.count));

  const handleGenerateReport = async () => {
    try {
      const tasks = getAllTasks();
      if (tasks.length === 0) {
        Alert.alert(
          "Sin tareas",
          "No hay tareas registradas para generar el reporte.",
        );
        return;
      }
      await generateAndShareReport(tasks);
    } catch (error) {
      console.error("Error al generar el reporte:", error);
      Alert.alert("Error", "No se pudo generar el reporte. Intenta de nuevo.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Reportes</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{stats.total}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: "#22c55e" }]}>
            {stats.completed}
          </Text>
          <Text style={styles.summaryLabel}>Completadas</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: "#f59e0b" }]}>
            {pending}
          </Text>
          <Text style={styles.summaryLabel}>Pendientes</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: "#dc2626" }]}>
            {overdueCount}
          </Text>
          <Text style={styles.summaryLabel}>Vencidas</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Tareas por prioridad</Text>
      <View style={styles.chartBlock}>
        {priorityCounts.length === 0 ? (
          <Text style={styles.emptyText}>Sin datos aún</Text>
        ) : (
          priorityCounts.map((p) => (
            <View key={p.priority} style={styles.barRow}>
              <Text style={styles.barLabel}>{PRIORITY_LABELS[p.priority]}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${(p.count / maxPriorityCount) * 100}%`,
                      backgroundColor: PRIORITY_COLORS[p.priority],
                    },
                  ]}
                />
              </View>
              <Text style={styles.barCount}>{p.count}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>Tareas por categoría</Text>
      <View style={styles.chartBlock}>
        {categoryCounts.length === 0 ? (
          <Text style={styles.emptyText}>Sin datos aún</Text>
        ) : (
          categoryCounts.map((c) => (
            <View key={c.category} style={styles.barRow}>
              <Text style={styles.barLabel}>{CATEGORY_LABELS[c.category]}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${(c.count / maxCategoryCount) * 100}%`,
                      backgroundColor: CATEGORY_COLORS[c.category],
                    },
                  ]}
                />
              </View>
              <Text style={styles.barCount}>{c.count}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>Productividad semanal</Text>
      <View style={styles.chartBlock}>
        <View style={styles.weeklyRow}>
          {weeklyCompletions.map((day) => {
            const maxCount = Math.max(
              1,
              ...weeklyCompletions.map((d) => d.count),
            );
            const barHeight = (day.count / maxCount) * 60;
            return (
              <View key={day.date} style={styles.weeklyBarColumn}>
                <Text style={styles.weeklyBarCount}>{day.count}</Text>
                <View style={styles.weeklyBarTrack}>
                  <View
                    style={[
                      styles.weeklyBarFill,
                      { height: Math.max(barHeight, 2) },
                    ]}
                  />
                </View>
                <Text style={styles.weeklyBarLabel}>
                  {formatWeekdayLabel(day.date)}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.avgCompletionRow}>
          <Text style={styles.avgCompletionLabel}>
            Tiempo promedio en completar una tarea
          </Text>
          <Text style={styles.avgCompletionValue}>
            {formatAvgCompletionTime(avgCompletionHours)}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.pdfButton} onPress={handleGenerateReport}>
        <Text style={styles.pdfButtonText}>Generar reporte PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    color: "white",
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flexBasis: "47%",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 8,
  },
  chartBlock: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  barLabel: {
    width: 70,
    color: "#94a3b8",
    fontSize: 12,
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0f172a",
    overflow: "hidden",
    marginHorizontal: 8,
  },
  barFill: {
    height: "100%",
    borderRadius: 5,
  },
  barCount: {
    width: 24,
    color: "white",
    fontSize: 12,
    textAlign: "right",
  },
  emptyText: {
    color: "#64748b",
    fontStyle: "italic",
    fontSize: 13,
  },
  weeklyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  weeklyBarColumn: {
    alignItems: "center",
    flex: 1,
  },
  weeklyBarCount: {
    color: "#94a3b8",
    fontSize: 10,
    marginBottom: 4,
  },
  weeklyBarTrack: {
    width: 14,
    height: 60,
    justifyContent: "flex-end",
    backgroundColor: "#0f172a",
    borderRadius: 6,
    overflow: "hidden",
  },
  weeklyBarFill: {
    width: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 6,
  },
  weeklyBarLabel: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 6,
  },
  avgCompletionRow: {
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 12,
    alignItems: "center",
  },
  avgCompletionLabel: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 4,
  },
  avgCompletionValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  pdfButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  pdfButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
