import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import {
  Task,
  addTaskDb,
  deleteTaskDb,
  getAllTasks,
  initDatabase,
  reorderTasks,
  toggleTaskComplete,
  updateTaskText,
} from '../../db';

export default function HomeScreen() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadTasks = () => {
    setTasks(getAllTasks());
  };

  useFocusEffect(
    useCallback(() => {
      initDatabase();
      loadTasks();
    }, [])
  );

  const addTask = () => {
    if (task.trim() === '') return;
    addTaskDb(task.trim());
    setTask('');
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
    setEditingId(taskToEdit.id);
  };

  const saveEdit = () => {
    if (task.trim() === '' || editingId === null) return;
    updateTaskText(editingId, task.trim());
    setTask('');
    setEditingId(null);
    loadTasks();
  };

  const cancelEdit = () => {
    setTask('');
    setEditingId(null);
  };

  const deleteTask = (id: number) => {
    Alert.alert(
      'Eliminar tarea',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteTaskDb(id);
            loadTasks();
          },
        },
      ]
    );
  };

  const handleDragEnd = ({ data }: { data: Task[] }) => {
    setTasks(data);
    reorderTasks(data.map((t) => t.id));
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Task>) => (
    <ScaleDecorator>
      <TouchableOpacity
        style={[styles.taskRow, isActive && styles.taskRowActive]}
        onLongPress={drag}
        delayLongPress={100}
        disabled={isActive}
        activeOpacity={1}
      >
        <TouchableOpacity
          style={[styles.checkbox, item.completed && styles.checkboxChecked]}
          onPress={() => toggleComplete(item.id, item.completed)}
          activeOpacity={0.8}
        >
          {item.completed && <Text style={styles.checkIcon}>✓</Text>}
        </TouchableOpacity>

        <View style={styles.task}>
          <Text style={[styles.taskText, item.completed && styles.taskCompleted]}>
            {item.text}
          </Text>
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
            <Text style={[styles.editText, item.completed && { opacity: 0.3 }]}>
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
      </TouchableOpacity>
    </ScaleDecorator>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {editingId ? 'Editando tarea' : 'Mi Primera App Celular - De Tareas'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Escribe una tarea..."
        placeholderTextColor="#94a3b8"
        value={task}
        onChangeText={setTask}
        onSubmitEditing={editingId ? saveEdit : addTask}
      />

      <View style={styles.buttonRow}>
        {editingId ? (
          <>
            <TouchableOpacity style={[styles.button, styles.buttonSave]} onPress={saveEdit}>
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={cancelEdit}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.button} onPress={addTask}>
            <Text style={styles.buttonText}>Agregar</Text>
          </TouchableOpacity>
        )}
      </View>

      {tasks.length === 0 ? (
        <Text style={styles.emptyText}>No hay tareas aún. ¡Agrega una!</Text>
      ) : (
        <>
          <Text style={styles.hint}>Mantén presionada una tarea para reordenarla</Text>
          <DraggableFlatList
            data={tasks}
            onDragEnd={handleDragEnd}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginBottom: 20,
    marginTop: 40,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1e293b',
    color: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  button: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSave: {
    backgroundColor: '#16a34a',
  },
  buttonCancel: {
    backgroundColor: '#334155',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  hint: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  taskRowActive: {
    backgroundColor: '#273449',
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  checkIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  task: {
    flex: 1,
  },
  taskText: {
    color: 'white',
    fontSize: 16,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderLeftColor: '#334155',
  },
  actionButton: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    marginLeft: 6,
  },
  deleteText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    fontStyle: 'italic',
  },
});