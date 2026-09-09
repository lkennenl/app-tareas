import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Priority,
  Task,
  TaskStats,
  addTaskDb,
  deleteTaskDb,
  getAllTasks,
  getTaskStats,
  initDatabase,
  swapPositions,
  toggleTaskComplete,
  updateTaskText,
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

const PRIORITIES: Priority[] = ["alta", "media", "baja"];

export default function HomeScreen() {
  const [task, setTask] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, completed: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadTasks = () => {
    setTasks(getAllTasks());
    setStats(getTaskStats());
  };

  useFocusEffect(
    useCallback(() => {
      initDatabase();
      loadTasks();
    }, []),
  );

  const addTask = () => {
    if (task.trim() === "") return;
    addTaskDb(task.trim(), priority);
    setTask("");
    setPriority("media");
    setEditingId(null);
    loadTasks();
  };

  const toggleComplete = (id: number, current: boolean) => {
    toggleTaskComplete(id, !current);
    loadTasks();
  };

  const startEditing = (taskToEdit: Task) => {
    if (taskToEdit.completed) return;
    setTask(taskToEdit.text);
    setPriority(taskToEdit.priority);
    setEditingId(taskToEdit.id);
  };

  const saveEdit = () => {
    if (task.trim() === "" || editingId === null) return;
    updateTaskText(editingId, task.trim(), priority);
    setTask("");
    setPriority("media");
    setEditingId(null);
    loadTasks();
  };

  const cancelEdit = () => {
    setTask("");
    setPriority("media");
    setEditingId(null);
  };

  const deleteTask = (id: number) => {
    Alert.alert("Eliminar tarea", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          deleteTaskDb(id);
          loadTasks();
        },
      },
    ]);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const a = tasks[index - 1];
    const b = tasks[index];
    swapPositions(a.id, a.position, b.id, b.position);
    loadTasks();
  };

  const moveDown = (index: number) => {
    if (index === tasks.length - 1) return;
    const a = tasks[index];
    const b = tasks[index + 1];
    swapPositions(a.id, a.position, b.id, b.position);
    loadTasks();
  };

  const progressPercent =
    stats.total === 0 ? 0 : (stats.completed / stats.total) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {editingId ? "Editando tarea" : "Mi Primera App Celular - De Tareas"}
      </Text>

      {stats.total > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {stats.completed} de {stats.total} completadas
          </Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
            />
          </View>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Escribe una tarea..."
        placeholderTextColor="#94a3b8"
        value={task}
        onChangeText={setTask}
        onSubmitEditing={editingId ? saveEdit : addTask}
      />

      <View style={styles.priorityRow}>
        {PRIORITIES.map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.priorityOption,
              { borderColor: PRIORITY_COLORS[p] },
              priority === p && { backgroundColor: PRIORITY_COLORS[p] },
            ]}
            onPress={() => setPriority(p)}
          >
            <Text
              style={[
                styles.priorityOptionText,
                { color: priority === p ? "white" : PRIORITY_COLORS[p] },
              ]}
            >
              {PRIORITY_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonRow}>
        {editingId ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.buttonSave]}
              onPress={saveEdit}
            >
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={cancelEdit}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.button} onPress={addTask}>
            <Text style={styles.buttonText}>Agregar</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.taskRow}>
            <View
              style={[
                styles.priorityBar,
                { backgroundColor: PRIORITY_COLORS[item.priority] },
              ]}
            />

            <TouchableOpacity
              style={[
                styles.checkbox,
                item.completed && styles.checkboxChecked,
              ]}
              onPress={() => toggleComplete(item.id, item.completed)}
              activeOpacity={0.8}
            >
              {item.completed && <Text style={styles.checkIcon}>✓</Text>}
            </TouchableOpacity>

            <View style={styles.task}>
              <Text
                style={[
                  styles.taskText,
                  item.completed && styles.taskCompleted,
                ]}
              >
                {item.text}
              </Text>
              <Text
                style={[
                  styles.priorityLabel,
                  { color: PRIORITY_COLORS[item.priority] },
                ]}
              >
                {PRIORITY_LABELS[item.priority]}
              </Text>
            </View>

            <View style={styles.arrows}>
              <TouchableOpacity onPress={() => moveUp(index)}>
                <Text style={styles.arrow}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => moveDown(index)}>
                <Text style={styles.arrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  if (!item.completed) {
                    startEditing(item);
                  }
                }}
                activeOpacity={item.completed ? 1 : 0.7}
                disabled={item.completed}
              >
                <Text
                  style={[styles.editText, item.completed && { opacity: 0.3 }]}
                >
                  Editar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteTask(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay tareas aún. ¡Agrega una!</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0f172a",
  },
  title: {
    fontSize: 24,
    color: "white",
    marginBottom: 16,
    marginTop: 40,
    textAlign: "center",
    fontWeight: "bold",
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsText: {
    color: "#94a3b8",
    fontSize: 13,
    marginBottom: 6,
    textAlign: "center",
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1e293b",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 4,
  },
  input: {
    backgroundColor: "#1e293b",
    color: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
  },
  priorityOption: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  priorityOptionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  button: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonSave: {
    backgroundColor: "#16a34a",
  },
  buttonCancel: {
    backgroundColor: "#334155",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  priorityBar: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 2,
    marginRight: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  checkIcon: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  task: {
    flex: 1,
  },
  taskText: {
    color: "white",
    fontSize: 16,
  },
  taskCompleted: {
    textDecorationLine: "line-through",
    color: "#94a3b8",
    opacity: 0.8,
  },
  priorityLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  arrows: {
    marginRight: 10,
  },
  arrow: {
    fontSize: 14,
    color: "#94a3b8",
    marginVertical: 2,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderLeftColor: "#334155",
  },
  actionButton: {
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  editText: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    marginLeft: 6,
  },
  deleteText: {
    fontSize: 13,
    color: "white",
    fontWeight: "600",
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    fontStyle: "italic",
  },
});
