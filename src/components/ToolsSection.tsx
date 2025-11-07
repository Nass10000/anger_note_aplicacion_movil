import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { getTools, addTool, deleteTool, Tool } from '../toolsDb';

const DEFAULT_TOOLS = [
  { id: 1, name: '💧 Beber agua con hielo', description: 'Toma un vaso de agua fría con hielo para refrescarte y calmarte' },
  { id: 2, name: '🌧️ Técnica RAIN', description: 'Reconoce, Acepta, Investiga, No te identifiques con la emoción' },
  { id: 3, name: '🧘 Respiración profunda', description: 'Inhala por 4 segundos, mantén por 4, exhala por 4' },
  { id: 4, name: '🚶 Caminar 5 minutos', description: 'Da un paseo breve para cambiar tu entorno y perspectiva' },
];

export default function ToolsSection() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newToolDescription, setNewToolDescription] = useState('');
  const [selectedTool, setSelectedTool] = useState<number | null>(null);

  async function loadTools() {
    const loadedTools = await getTools();
    
    // Si no hay herramientas, agregar las por defecto
    if (loadedTools.length === 0) {
      for (const tool of DEFAULT_TOOLS) {
        await addTool(tool.name, tool.description);
      }
      setTools(await getTools());
    } else {
      setTools(loadedTools);
    }
  }

  useEffect(() => {
    loadTools();
  }, []);

  async function handleAddTool() {
    if (!newToolName.trim()) {
      Alert.alert('Error', 'Escribe un nombre para la herramienta');
      return;
    }

    await addTool(newToolName.trim(), newToolDescription.trim());
    setNewToolName('');
    setNewToolDescription('');
    setShowAddForm(false);
    await loadTools();
    Alert.alert('✓ Agregada', 'Nueva herramienta añadida');
  }

  async function handleDeleteTool(id: number, name: string) {
    Alert.alert(
      'Eliminar Herramienta',
      `¿Estás seguro de eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteTool(id);
            await loadTools();
            if (selectedTool === id) {
              setSelectedTool(null);
            }
          }
        }
      ]
    );
  }

  function handleSelectTool(id: number) {
    setSelectedTool(selectedTool === id ? null : id);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛠️ Herramientas para el Enojo</Text>
      <Text style={styles.subtitle}>Selecciona una técnica cuando te sientas enojado</Text>

      <ScrollView style={styles.toolsList} showsVerticalScrollIndicator={false}>
        {tools.map((tool) => (
          <View key={tool.id} style={styles.toolCard}>
            <TouchableOpacity
              style={[
                styles.toolButton,
                selectedTool === tool.id && styles.toolButtonSelected
              ]}
              onPress={() => handleSelectTool(tool.id)}
            >
              <Text style={[
                styles.toolName,
                selectedTool === tool.id && styles.toolNameSelected
              ]}>
                {tool.name}
              </Text>
              {tool.description && (
                <Text style={[
                  styles.toolDescription,
                  selectedTool === tool.id && styles.toolDescriptionSelected
                ]}>
                  {tool.description}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteToolButton}
              onPress={() => handleDeleteTool(tool.id, tool.name)}
            >
              <Text style={styles.deleteToolText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {!showAddForm ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={styles.addButtonText}>+ Agregar Nueva Herramienta</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.addForm}>
          <Text style={styles.addFormTitle}>Nueva Herramienta</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre (ej: 🎵 Escuchar música)"
            value={newToolName}
            onChangeText={setNewToolName}
            maxLength={50}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descripción (opcional)"
            value={newToolDescription}
            onChangeText={setNewToolDescription}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAddForm(false);
                setNewToolName('');
                setNewToolDescription('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddTool}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#3d1a1a',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#ffaaaa',
    marginBottom: 16,
  },
  toolsList: {
    maxHeight: 400,
    marginBottom: 12,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  toolButton: {
    flex: 1,
    backgroundColor: '#5d2a2a',
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: '#5d2a2a',
  },
  toolButtonSelected: {
    backgroundColor: '#7d3a3a',
    borderColor: '#ff6666',
  },
  toolName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  toolNameSelected: {
    color: '#ffcccc',
  },
  toolDescription: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 16,
  },
  toolDescriptionSelected: {
    color: '#ffdddd',
  },
  deleteToolButton: {
    marginLeft: 8,
    padding: 10,
    backgroundColor: '#8d1a1a',
    borderRadius: 8,
  },
  deleteToolText: {
    fontSize: 18,
  },
  addButton: {
    backgroundColor: '#8d1a1a',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bd2a2a',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#ffcccc',
    fontSize: 14,
    fontWeight: '600',
  },
  addForm: {
    backgroundColor: '#5d2a2a',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#8d3a3a',
  },
  addFormTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#7d3a3a',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#9d4a4a',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6d2a2a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffaaaa',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#bd2a2a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
