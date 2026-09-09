import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Category,
  CategoryCount,
  Priority,
  PriorityCount,
  TaskStats,
  getCountsByCategory,
  getCountsByPriority,
  getOverdueCount,
  getTaskStats,
  initDatabase,
} from "../../db";

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

export default function ReportsScreen() {
  const [stats, setStats] = useState<TaskStats>({ total: 0, completed: 0 });
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
  const [priorityCounts, setPriorityCounts] = useState<PriorityCount[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);

  const loadStats = () => {
    setStats(getTaskStats());
    setCategoryCounts(getCountsByCategory());
    setPriorityCounts(getCountsByPriority());
    setOverdueCount(getOverdueCount());
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

      <TouchableOpacity style={styles.pdfButton} disabled>
        <Text style={styles.pdfButtonText}>Generar reporte PDF</Text>
        <Text style={styles.pdfButtonHint}>(próximamente)</Text>
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
  pdfButton: {
    backgroundColor: "#334155",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    opacity: 0.6,
  },
  pdfButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  pdfButtonHint: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },
});
