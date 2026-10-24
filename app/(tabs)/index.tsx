import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Category,
  Priority,
  Subtask,
  Task,
  TaskStats,
  addSubtaskDb,
  addTaskDb,
  deleteSubtaskDb,
  deleteTaskDb,
  getAllSubtasks,
  getAllTasks,
  getTaskStats,
  initDatabase,
  toggleSubtaskComplete,
  toggleTaskComplete,
  updateTaskDueDate,
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

const CATEGORIES: Category[] = ["trabajo", "estudio", "personal", "hogar"];

type CategoryFilter = Category | "todas";

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function isOverdue(iso: string | null, completed: boolean): boolean {
  if (!iso || completed) return false;
  const today = toISODate(new Date());
  return iso < today;
}

export default function HomeScreen() {
  const [task, setTask] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [category, setCategory] = useState<Category>("personal");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reschedulingId, setReschedulingId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, completed: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>("todas");
  const [formExpanded, setFormExpanded] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState("");

  const loadTasks = () => {
    setTasks(getAllTasks());
    setStats(getTaskStats());
    setSubtasks(getAllSubtasks());
  };

  useFocusEffect(
    useCallback(() => {
      initDatabase();
      loadTasks();
    }, []),
  );

  const resetForm = () => {
    setTask("");
    setPriority("media");
    setCategory("personal");
    setDueDate(null);
    setEditingId(null);
    setFormExpanded(false);
  };

  const addTask = () => {
    if (task.trim() === "") return;
    addTaskDb(task.trim(), priority, category, dueDate);
    resetForm();
    loadTasks();
  };

  const toggleComplete = (id: number, current: boolean) => {
    toggleTaskComplete(id, !current);
    loadTasks();
  };

  const toggleExpanded = (taskId: number) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
    setNewSubtaskText("");
  };

  const addSubtask = (taskId: number) => {
    if (newSubtaskText.trim() === "") return;
    addSubtaskDb(taskId, newSubtaskText.trim());
    setNewSubtaskText("");
    loadTasks();
  };

  const toggleSubtask = (id: number, current: boolean) => {
    toggleSubtaskComplete(id, !current);
    loadTasks();
  };

  const deleteSubtask = (id: number) => {
    deleteSubtaskDb(id);
    loadTasks();
  };

  const startEditing = (taskToEdit: Task) => {
    if (taskToEdit.completed) return;
    setTask(taskToEdit.text);
    setPriority(taskToEdit.priority);
    setCategory(taskToEdit.category);
    setDueDate(taskToEdit.dueDate);
    setEditingId(taskToEdit.id);
    setFormExpanded(true);
  };

  const saveEdit = () => {
    if (task.trim() === "" || editingId === null) return;
    updateTaskText(editingId, task.trim(), priority, category, dueDate);
    resetForm();
    loadTasks();
  };

  const cancelEdit = () => {
    resetForm();
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

  const startRescheduling = (id: number) => {
    setReschedulingId(id);
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      setReschedulingId(null);
      return;
    }

    if (selectedDate) {
      const iso = toISODate(selectedDate);

      if (reschedulingId !== null) {
        updateTaskDueDate(reschedulingId, iso);
        loadTasks();
      } else {
        setDueDate(iso);
      }
    }

    if (Platform.OS === "android") {
      setShowDatePicker(false);
      setReschedulingId(null);
    }
  };

  const closeInlinePicker = () => {
    setShowDatePicker(false);
    setReschedulingId(null);
  };

  const toggleForm = () => {
    if (formExpanded) {
      resetForm();
    } else {
      setFormExpanded(true);
    }
  };

  const filteredTasks =
    filter === "todas" ? tasks : tasks.filter((t) => t.category === filter);

  const progressPercent =
    stats.total === 0 ? 0 : (stats.completed / stats.total) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {editingId ? "Editando tarea" : "Mis Tareas"}
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

      <TouchableOpacity style={styles.formToggle} onPress={toggleForm}>
        <Text style={styles.formToggleText}>
          {formExpanded ? "Cerrar formulario" : "Agregar tarea"}
        </Text>
        <Text style={styles.formToggleIcon}>{formExpanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {formExpanded && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Escribe una tarea..."
            placeholderTextColor="#94a3b8"
            value={task}
            onChangeText={setTask}
            onSubmitEditing={editingId ? saveEdit : addTask}
          />

          <Text style={styles.sectionLabel}>Prioridad</Text>
          <View style={styles.optionRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.optionButton,
                  { borderColor: PRIORITY_COLORS[p] },
                  priority === p && { backgroundColor: PRIORITY_COLORS[p] },
                ]}
                onPress={() => setPriority(p)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    { color: priority === p ? "white" : PRIORITY_COLORS[p] },
                  ]}
                >
                  {PRIORITY_LABELS[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Categoría</Text>
          <View style={styles.optionRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.optionButton,
                  { borderColor: CATEGORY_COLORS[c] },
                  category === c && { backgroundColor: CATEGORY_COLORS[c] },
                ]}
                onPress={() => setCategory(c)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    { color: category === c ? "white" : CATEGORY_COLORS[c] },
                  ]}
                >
                  {CATEGORY_LABELS[c]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Fecha límite (opcional)</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setReschedulingId(null);
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.dateButtonText}>
                {dueDate ? formatDisplayDate(dueDate) : "Sin fecha"}
              </Text>
            </TouchableOpacity>
            {dueDate && (
              <TouchableOpacity
                style={styles.dateClearButton}
                onPress={() => setDueDate(null)}
              >
                <Text style={styles.dateClearText}>Quitar</Text>
              </TouchableOpacity>
            )}
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
        </>
      )}

      {showDatePicker && (
        <>
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.pickerDoneButton}
              onPress={closeInlinePicker}
            >
              <Text style={styles.pickerDoneText}>Listo</Text>
            </TouchableOpacity>
          )}
          <DateTimePicker
            value={
              reschedulingId !== null
                ? new Date()
                : dueDate
                  ? new Date(dueDate + "T00:00:00")
                  : new Date()
            }
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={onDateChange}
          />
        </>
      )}

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filter === "todas" && styles.filterChipActive,
          ]}
          onPress={() => setFilter("todas")}
        >
          <Text
            style={[
              styles.filterChipText,
              filter === "todas" && styles.filterChipTextActive,
            ]}
          >
            Todas
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.filterChip,
              filter === c && { backgroundColor: CATEGORY_COLORS[c] },
            ]}
            onPress={() => setFilter(c)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === c && styles.filterChipTextActive,
              ]}
            >
              {CATEGORY_LABELS[c]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const overdue = isOverdue(item.dueDate, item.completed);
          const itemSubtasks = subtasks.filter((s) => s.taskId === item.id);
          const completedSubtasks = itemSubtasks.filter(
            (s) => s.completed,
          ).length;
          const isExpanded = expandedTaskId === item.id;
          return (
            <View style={styles.taskCard}>
              <View
                style={[styles.taskRow, isExpanded && styles.taskRowExpanded]}
              >
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
                  <View style={styles.tagsRow}>
                    <Text
                      style={[
                        styles.tagText,
                        { color: PRIORITY_COLORS[item.priority] },
                      ]}
                    >
                      {PRIORITY_LABELS[item.priority]}
                    </Text>
                    <Text style={styles.tagSeparator}>•</Text>
                    <Text
                      style={[
                        styles.tagText,
                        { color: CATEGORY_COLORS[item.category] },
                      ]}
                    >
                      {CATEGORY_LABELS[item.category]}
                    </Text>
                    {item.dueDate && (
                      <>
                        <Text style={styles.tagSeparator}>•</Text>
                        <Text
                          style={[
                            styles.tagText,
                            overdue && styles.overdueText,
                          ]}
                        >
                          {formatDisplayDate(item.dueDate)}
                        </Text>
                      </>
                    )}
                  </View>
                  {overdue && (
                    <View style={styles.overdueRow}>
                      <Text style={styles.overdueLabel}>Vencida</Text>
                      <TouchableOpacity
                        onPress={() => startRescheduling(item.id)}
                      >
                        <Text style={styles.rescheduleText}>Reprogramar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
                      style={[
                        styles.editText,
                        item.completed && { opacity: 0.3 },
                      ]}
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

              <TouchableOpacity
                style={styles.subtasksToggle}
                onPress={() => toggleExpanded(item.id)}
              >
                <Text style={styles.subtasksToggleText}>
                  {itemSubtasks.length > 0
                    ? `${completedSubtasks}/${itemSubtasks.length} subtareas`
                    : "Subtareas"}
                </Text>
                {itemSubtasks.length > 0 && (
                  <View style={styles.subtasksMiniBarTrack}>
                    <View
                      style={[
                        styles.subtasksMiniBarFill,
                        {
                          width: `${(completedSubtasks / itemSubtasks.length) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                )}
                <Text style={styles.subtasksToggleIcon}>
                  {isExpanded ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.subtasksPanel}>
                  {itemSubtasks.map((s) => (
                    <View key={s.id} style={styles.subtaskRow}>
                      <TouchableOpacity
                        style={[
                          styles.subtaskCheckbox,
                          s.completed && styles.subtaskCheckboxChecked,
                        ]}
                        onPress={() => toggleSubtask(s.id, s.completed)}
                        activeOpacity={0.8}
                      >
                        {s.completed && (
                          <Text style={styles.subtaskCheckIcon}>✓</Text>
                        )}
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.subtaskText,
                          s.completed && styles.subtaskTextCompleted,
                        ]}
                      >
                        {s.text}
                      </Text>
                      <TouchableOpacity onPress={() => deleteSubtask(s.id)}>
                        <Text style={styles.subtaskDeleteText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View style={styles.subtaskInputRow}>
                    <TextInput
                      style={styles.subtaskInput}
                      placeholder="Nueva subtarea..."
                      placeholderTextColor="#64748b"
                      value={newSubtaskText}
                      onChangeText={setNewSubtaskText}
                      onSubmitEditing={() => addSubtask(item.id)}
                    />
                    <TouchableOpacity
                      style={styles.subtaskAddButton}
                      onPress={() => addSubtask(item.id)}
                    >
                      <Text style={styles.subtaskAddButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {filter === "todas"
              ? "No hay tareas aún. ¡Agrega una!"
              : "No hay tareas en esta categoría."}
          </Text>
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
    fontSize: 22,
    color: "white",
    marginBottom: 14,
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
  formToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  formToggleText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  formToggleIcon: {
    color: "#94a3b8",
    fontSize: 12,
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
  sectionLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  optionButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  dateButtonText: {
    color: "#e2e8f0",
    fontSize: 14,
  },
  dateClearButton: {
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  dateClearText: {
    color: "#94a3b8",
    fontSize: 13,
  },
  pickerDoneButton: {
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  pickerDoneText: {
    color: "#4f46e5",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
    marginTop: 4,
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
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 15,
    marginTop: 4,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  filterChipActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  filterChipText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "white",
  },
  taskCard: {
    marginBottom: 12,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  taskRowExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  subtasksToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16213a",
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 10,
  },
  subtasksToggleText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  subtasksMiniBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#0f172a",
    overflow: "hidden",
  },
  subtasksMiniBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#4f46e5",
  },
  subtasksToggleIcon: {
    color: "#64748b",
    fontSize: 10,
  },
  subtasksPanel: {
    backgroundColor: "#16213a",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },
  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  subtaskCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  subtaskCheckboxChecked: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  subtaskCheckIcon: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  subtaskText: {
    flex: 1,
    color: "#e2e8f0",
    fontSize: 14,
  },
  subtaskTextCompleted: {
    textDecorationLine: "line-through",
    color: "#64748b",
  },
  subtaskDeleteText: {
    color: "#64748b",
    fontSize: 13,
    paddingHorizontal: 6,
  },
  subtaskInputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  subtaskInput: {
    flex: 1,
    backgroundColor: "#0f172a",
    color: "white",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#334155",
  },
  subtaskAddButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
  },
  subtaskAddButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
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
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 2,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
  },
  tagSeparator: {
    color: "#475569",
    fontSize: 11,
    marginHorizontal: 5,
  },
  overdueText: {
    color: "#dc2626",
  },
  overdueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  overdueLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#dc2626",
  },
  rescheduleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4f46e5",
    textDecorationLine: "underline",
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
