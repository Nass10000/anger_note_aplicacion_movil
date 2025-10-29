import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, TextInput, Platform, StatusBar, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Slider from '@react-native-community/slider';
import { initDB, addEntry, statsToday, last7DaysAverages, last30DaysAverage, last3MonthsAverages, last6MonthsAverages, lastYearAverages, getAllEntries, deleteEntry, deleteAllEntries, Entry, addAngerNote, getAllAngerNotes, deleteAngerNote, deleteAllAngerNotes, AngerNote } from './src/db';
import BarChart from './src/components/BarChart';
import AuthScreen from './src/components/AuthScreen';
import HistoryNavigator from './src/components/HistoryNavigator';

export default function App(){
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [intensity, setIntensity] = useState('5');
  const [today, setToday] = useState<{count:number; avg:number}>({count:0, avg:0});
  const [week, setWeek] = useState<{label:string, avg:number}[]>([]);
  const [month30, setMonth30] = useState<{label:string, avg:number}>({label: '', avg: 0});
  const [m3, setM3] = useState<{label:string, avg:number}[]>([]);
  const [m6, setM6] = useState<{label:string, avg:number}[]>([]);
  const [y12, setY12] = useState<{label:string, avg:number}[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showEntries, setShowEntries] = useState(false);
  const [angerNotes, setAngerNotes] = useState<AngerNote[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  async function refresh(){
    setToday(await statsToday());
    setWeek(await last7DaysAverages());
    setMonth30(await last30DaysAverage());
    setM3(await last3MonthsAverages());
    setM6(await last6MonthsAverages());
    setY12(await lastYearAverages());
    setEntries(await getAllEntries());
    setAngerNotes(await getAllAngerNotes());
  }

  useEffect(() => { 
    if (isAuthenticated) {
      (async () => { await initDB(); await refresh(); })(); 
    }
  }, [isAuthenticated]);

  async function onSave(){
    const n = Math.max(1, Math.min(10, Number(intensity) || 5));
    await addEntry(n);
    // Sin confirmación - guardado silencioso
    setIntensity('5');
    await refresh();
  }

  async function onDeleteEntry(id: number, intensity: number, timestamp: number) {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('es', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    Alert.alert(
      'Borrar Registro',
      `¿Estás seguro de borrar este registro?\n\nNivel: ${intensity}/10\nFecha: ${dateStr}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Borrar', 
          style: 'destructive',
          onPress: async () => {
            await deleteEntry(id);
            Alert.alert('✓ Eliminado', 'El registro ha sido borrado');
            await refresh();
          }
        }
      ]
    );
  }

  async function onDeleteAll() {
    if (entries.length === 0) {
      Alert.alert('Sin registros', 'No hay registros para borrar');
      return;
    }

    Alert.alert(
      '⚠️ Borrar Todo',
      `¿Estás seguro de borrar TODOS los registros?\n\nSe borrarán ${entries.length} registros.\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Borrar Todo', 
          style: 'destructive',
          onPress: async () => {
            await deleteAllEntries();
            Alert.alert('✓ Borrado', 'Todos los registros han sido eliminados');
            await refresh();
          }
        }
      ]
    );
  }

  async function onSaveNote() {
    if (!noteText.trim()) {
      Alert.alert('Nota vacía', 'Escribe algo antes de guardar');
      return;
    }
    
    await addAngerNote(noteText.trim());
    setNoteText('');
    await refresh();
  }

  async function onDeleteNote(id: number, note: string, timestamp: number) {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('es', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const preview = note.length > 50 ? note.substring(0, 50) + '...' : note;
    
    Alert.alert(
      'Borrar Nota',
      `¿Estás seguro de borrar esta nota?\n\n"${preview}"\n\nFecha: ${dateStr}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Borrar', 
          style: 'destructive',
          onPress: async () => {
            await deleteAngerNote(id);
            Alert.alert('✓ Eliminada', 'La nota ha sido borrada');
            await refresh();
          }
        }
      ]
    );
  }

  async function onDeleteAllNotes() {
    if (angerNotes.length === 0) {
      Alert.alert('Sin notas', 'No hay notas para borrar');
      return;
    }

    Alert.alert(
      '⚠️ Borrar Todas las Notas',
      `¿Estás seguro de borrar TODAS las notas?\n\nSe borrarán ${angerNotes.length} notas.\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Borrar Todo', 
          style: 'destructive',
          onPress: async () => {
            await deleteAllAngerNotes();
            Alert.alert('✓ Borrado', 'Todas las notas han sido eliminadas');
            await refresh();
          }
        }
      ]
    );
  }

  // Si no está autenticado, mostrar pantalla de autenticación
  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>📊 Registro de Enojo</Text>
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => setShowHistory(true)}
          >
            <Text style={styles.historyButtonText}>📅 Historial</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Lleva un control de tus emociones</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>¿Cuál es tu nivel de enojo ahora?</Text>
          <Text style={styles.inputHint}>Escala del 1 (mínimo) al 10 (máximo)</Text>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>{Math.round(Number(intensity))}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={Number(intensity)}
              onValueChange={(value) => setIntensity(value.toString())}
              minimumTrackTintColor="#4c9"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#4c9"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>1</Text>
              <Text style={styles.sliderLabelText}>5</Text>
              <Text style={styles.sliderLabelText}>10</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveButtonText}>✓ Registrar Ahora</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>📅 Hoy</Text>
          <Text style={styles.statsText}>
            Registros: <Text style={styles.statsBold}>{today.count}</Text>  •  
            Promedio: <Text style={styles.statsBold}>{today.avg || 0}/10</Text>
          </Text>
          <BarChart title='' data={[{label:'Hoy', value: Number(today.avg) || 0}]}/>
        </View>

        <View style={styles.statsCard}>
          <BarChart title='� Última semana (7 días)' data={week.map((x: {label: string, avg: number}) => ({label: x.label, value: x.avg}))} />
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>�📊 Últimos 30 días</Text>
          <Text style={styles.statsText}>
            Promedio: <Text style={styles.statsBold}>{month30.avg || 0}/10</Text>
          </Text>
          <BarChart title='' data={[{label: month30.label, value: month30.avg}]} />
        </View>

        <View style={styles.statsCard}>
          <BarChart title='📊 Últimos 3 meses (promedio mensual)' data={m3.map((x: {label: string, avg: number}) => ({label: x.label, value: x.avg}))} />
        </View>

        <View style={styles.statsCard}>
          <BarChart title='📈 Últimos 6 meses (promedio mensual)' data={m6.map((x: {label: string, avg: number}) => ({label: x.label, value: x.avg}))} />
        </View>

        <View style={styles.statsCard}>
          <BarChart title='📆 Último año (promedio mensual)' data={y12.map((x: {label: string, avg: number}) => ({label: x.label, value: x.avg}))} />
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>📝 Anger Notes</Text>
          <Text style={styles.inputHint}>Escribe sobre tu enojo y tus emociones</Text>
          
          <View style={styles.noteInputContainer}>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder='Describe qué te hizo enojar, cómo te sientes...'
              multiline
              numberOfLines={6}
              maxLength={undefined}
              style={styles.noteInput}
              textAlignVertical='top'
            />
            <TouchableOpacity 
              style={styles.saveNoteButton}
              onPress={onSaveNote}
            >
              <Text style={styles.saveNoteText}>💾 Guardar Nota</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.entryHeader}>
            <Text style={styles.notesSubtitle}>Mis Notas de Enojo</Text>
            <TouchableOpacity onPress={() => setShowNotes(!showNotes)}>
              <Text style={styles.toggleButton}>{showNotes ? '▼ Ocultar' : '▶ Ver todas'}</Text>
            </TouchableOpacity>
          </View>

          {showNotes && (
            <>
              <View style={styles.entryActions}>
                <Text style={styles.entryCount}>Total: {angerNotes.length} notas</Text>
                <TouchableOpacity 
                  style={styles.deleteAllButton}
                  onPress={onDeleteAllNotes}
                >
                  <Text style={styles.deleteAllText}>🗑️ Borrar Todas</Text>
                </TouchableOpacity>
              </View>

              {angerNotes.length === 0 ? (
                <Text style={styles.emptyText}>No hay notas aún. ¡Escribe tu primera nota!</Text>
              ) : (
                <View style={styles.notesList}>
                  {angerNotes.map((note) => {
                    const date = new Date(note.ts);
                    const dateStr = date.toLocaleDateString('es', { 
                      day: '2-digit', 
                      month: 'short', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                    
                    return (
                      <View key={note.id} style={styles.noteCard}>
                        <View style={styles.noteHeader}>
                          <Text style={styles.noteDate}>{dateStr}</Text>
                          <TouchableOpacity
                            onPress={() => onDeleteNote(note.id, note.note, note.ts)}
                          >
                            <Text style={styles.deleteNoteButton}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.noteText}>{note.note}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.statsCard}>
          <View style={styles.entryHeader}>
            <Text style={styles.sectionTitle}>📝 Gestión de Registros</Text>
            <TouchableOpacity onPress={() => setShowEntries(!showEntries)}>
              <Text style={styles.toggleButton}>{showEntries ? '▼ Ocultar' : '▶ Ver todos'}</Text>
            </TouchableOpacity>
          </View>
          
          {showEntries && (
            <>
              <View style={styles.entryActions}>
                <Text style={styles.entryCount}>Total: {entries.length} registros</Text>
                <TouchableOpacity 
                  style={styles.deleteAllButton}
                  onPress={onDeleteAll}
                >
                  <Text style={styles.deleteAllText}>🗑️ Borrar Todo</Text>
                </TouchableOpacity>
              </View>

              {entries.length === 0 ? (
                <Text style={styles.emptyText}>No hay registros aún</Text>
              ) : (
                <View style={styles.entriesList}>
                  {entries.map((entry) => {
                    const date = new Date(entry.ts);
                    const dateStr = date.toLocaleDateString('es', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    });
                    const timeStr = date.toLocaleTimeString('es', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });

                    return (
                      <View key={entry.id} style={styles.entryItem}>
                        <View style={styles.entryInfo}>
                          <Text style={styles.entryIntensity}>{entry.intensity}/10</Text>
                          <View style={styles.entryDate}>
                            <Text style={styles.entryDateText}>{dateStr}</Text>
                            <Text style={styles.entryTimeText}>{timeStr}</Text>
                          </View>
                        </View>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => onDeleteEntry(entry.id, entry.intensity, entry.ts)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>

        <View style={{height: 20}} />
      </ScrollView>
      
      <HistoryNavigator 
        visible={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyButton: {
    backgroundColor: '#4c9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  sliderValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#4c9',
    textAlign: 'center',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4c9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  noteInputContainer: {
    marginVertical: 12,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  saveNoteButton: {
    backgroundColor: '#4c9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveNoteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  notesSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  notesList: {
    marginTop: 12,
  },
  noteCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteNoteButton: {
    fontSize: 18,
  },
  noteText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: '#4c9',
    borderRadius: 10,
    padding: 12,
    width: 80,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
  },
  buttonWrapper: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statsBold: {
    fontWeight: '700',
    color: '#4c9',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleButton: {
    fontSize: 14,
    color: '#4c9',
    fontWeight: '600',
  },
  entryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  entryCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  deleteAllButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  entriesList: {
    marginTop: 8,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4c9',
  },
  entryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryIntensity: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4c9',
    width: 50,
  },
  entryDate: {
    flex: 1,
  },
  entryDateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  entryTimeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  deleteButtonText: {
    fontSize: 18,
  },
});