import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Task = {
  id: string;
  text: string;
  completed: boolean;
};

export default function HomeScreen() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Agregar tarea
  const addTask = () => {
    if (task.trim() === '') return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: task.trim(),
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setTask('');
    setEditingId(null);
  };

  // Marcar como completada
  const toggleComplete = (id: string) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  // Iniciar edición (PROTEGIDO)
  const startEditing = (taskToEdit: Task) => {
    if (taskToEdit.completed) return;

    setTask(taskToEdit.text);
    setEditingId(taskToEdit.id);
  };

  // Guardar edición
  const saveEdit = () => {
    if (task.trim() === '' || !editingId) return;

    setTasks(tasks.map(t => 
      t.id === editingId ? { ...t, text: task.trim() } : t
    ));

    setTask('');
    setEditingId(null);
  };

  // Cancelar edición
  const cancelEdit = () => {
    setTask('');
    setEditingId(null);
  };

  // Eliminar tarea
  const deleteTask = (id: string) => {
    Alert.alert(
      'Eliminar tarea',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => setTasks(tasks.filter(t => t.id !== id)) 
        },
      ]
    );
  };

  // Mover tarea hacia arriba
  const moveUp = (index: number) => {
    if (index === 0) return;

    const newTasks = [...tasks];
    [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
    setTasks(newTasks);
  };

  // Mover tarea hacia abajo
  const moveDown = (index: number) => {
    if (index === tasks.length - 1) return;

    const newTasks = [...tasks];
    [newTasks[index + 1], newTasks[index]] = [newTasks[index], newTasks[index + 1]];
    setTasks(newTasks);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {editingId ? '✏️ Editando tarea' : 'Mi Primera App Celular - De Tareas'}
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
              <Text style={styles.buttonText}>✅ Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={cancelEdit}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.button} onPress={addTask}>
            <Text style={styles.buttonText}> Agregar</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.taskRow}>
            
            {/* Checkbox */}
            <TouchableOpacity 
              style={[styles.checkbox, item.completed && styles.checkboxChecked]}
              onPress={() => toggleComplete(item.id)}
              activeOpacity={0.8}
            >
              {item.completed && <Text style={styles.checkIcon}>✓</Text>}
            </TouchableOpacity>

            {/* Texto */}
            <View style={styles.task}>
              <Text style={[styles.taskText, item.completed && styles.taskCompleted]}>
                {item.text}
              </Text>
            </View>

            {/* Flechas */}
            <View style={styles.arrows}>
              <TouchableOpacity onPress={() => moveUp(index)}>
                <Text style={styles.arrow}>⬆️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => moveDown(index)}>
                <Text style={styles.arrow}>⬇️</Text>
              </TouchableOpacity>
            </View>

            {/* Acciones */}
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
                    styles.editIcon,
                    item.completed && { opacity: 0.3 }
                  ]}
                >
                  ✏️
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteTask(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No hay tareas aún. ¡Agrega una!
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
    marginBottom: 25,
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
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
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
  arrows: {
    marginRight: 10,
  },
  arrow: {
    fontSize: 18,
    marginVertical: 2,
  },
  actions: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderLeftColor: '#334155',
  },
  actionButton: {
    width: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 20,
    color: '#2563eb',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  deleteIcon: {
    fontSize: 20,
    color: 'white',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    fontStyle: 'italic',
  },
});
