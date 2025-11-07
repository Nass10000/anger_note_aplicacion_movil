import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, TextInput, Platform, StatusBar, ScrollView, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import { initDB, addEntry, statsToday, getWeekStats, last30DaysAverage, last3MonthsAverages, last6MonthsAverages, lastYearAverages, getAllEntries, deleteEntry, deleteAllEntries, Entry, addAngerNote, getAllAngerNotes, deleteAngerNote, deleteAllAngerNotes, AngerNote, getNotesForDay, DayAvg } from './src/db';
import { initToolsDB } from './src/toolsDb';
import BarChart from './src/components/BarChart';
import AuthScreen from './src/components/AuthScreen';
import HistoryNavigator from './src/components/HistoryNavigator';
import ToolsSection from './src/components/ToolsSection';

export default function App(){
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [intensity, setIntensity] = useState('5');
  const [today, setToday] = useState<{count:number; avg:number}>({count:0, avg:0});
  const [week, setWeek] = useState<DayAvg[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
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
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<{date: Date; entries: Entry[]; notes: AngerNote[]; avg: number; count: number} | null>(null);

  async function refresh(){
    setToday(await statsToday());
    await loadWeekData(weekOffset);
    setMonth30(await last30DaysAverage());
    setM3(await last3MonthsAverages());
    setM6(await last6MonthsAverages());
    setY12(await lastYearAverages());
    setEntries(await getAllEntries());
    setAngerNotes(await getAllAngerNotes());
  }

  async function loadWeekData(offset: number) {
    const weekData = await getWeekStats(offset);
    setWeek(weekData);
  }

  useEffect(() => { 
    if (isAuthenticated) {
      (async () => { 
        await initDB(); 
        await initToolsDB();
        await refresh(); 
      })(); 
    }
  }, [isAuthenticated]);

  async function handleWeekNavigate(direction: 'prev' | 'next') {
    const newOffset = direction === 'prev' ? weekOffset + 1 : weekOffset - 1;
    setWeekOffset(newOffset);
    await loadWeekData(newOffset);
  }

  async function handleBarPress(barData: {label: string; value: number; date?: Date; count?: number}) {
    if (!barData.date || (barData.count ?? 0) === 0) {
      Alert.alert('Sin datos', 'No hay registros en este día');
      return;
    }

    // Obtener registros del día
    const dayEntries = await getAllEntries();
    const startOfDay = new Date(barData.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(barData.date);
    endOfDay.setHours(23, 59, 59, 999);

    const filteredEntries = dayEntries.filter(e => {
      const entryDate = new Date(e.ts);
      return entryDate >= startOfDay && entryDate <= endOfDay;
    });

    // Obtener notas del día
    const dayNotes = await getNotesForDay(barData.date);

    setSelectedDayData({
      date: barData.date,
      entries: filteredEntries,
      notes: dayNotes,
      avg: barData.value,
      count: barData.count ?? 0
    });
    setShowDayDetails(true);
  }

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
              minimumTrackTintColor="#ff6666"
              maximumTrackTintColor="#5d2a2a"
              thumbTintColor="#ff6666"
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
          <BarChart 
            title={weekOffset === 0 ? '📅 Última semana (7 días)' : `📅 Semana hace ${weekOffset} ${weekOffset === 1 ? 'semana' : 'semanas'}`}
            data={week.map((x: DayAvg) => ({label: x.label, value: x.avg, date: x.date, count: x.count}))}
            onBarPress={handleBarPress}
            showNavigation={true}
            onNavigatePrev={() => handleWeekNavigate('prev')}
            onNavigateNext={() => handleWeekNavigate('next')}
            canNavigatePrev={true}
            canNavigateNext={weekOffset > 0}
          />
        </View>

        <ToolsSection />

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

      <Modal
        visible={showDayDetails}
        animationType="slide"
        onRequestClose={() => setShowDayDetails(false)}
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                📅 {selectedDayData?.date.toLocaleDateString('es', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
              <TouchableOpacity onPress={() => setShowDayDetails(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalStats}>
              <Text style={styles.modalStatsText}>
                Registros: <Text style={styles.modalStatsBold}>{selectedDayData?.count}</Text>
              </Text>
              <Text style={styles.modalStatsText}>
                Promedio: <Text style={styles.modalStatsBold}>{selectedDayData?.avg.toFixed(1)}/10</Text>
              </Text>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedDayData && selectedDayData.entries.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>📊 Registros del día</Text>
                  {selectedDayData.entries.map((entry) => {
                    const time = new Date(entry.ts).toLocaleTimeString('es', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    return (
                      <View key={entry.id} style={styles.modalEntry}>
                        <Text style={styles.modalEntryTime}>{time}</Text>
                        <Text style={styles.modalEntryIntensity}>{entry.intensity}/10</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {selectedDayData && selectedDayData.notes.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>📝 Notas del día</Text>
                  {selectedDayData.notes.map((note) => {
                    const time = new Date(note.ts).toLocaleTimeString('es', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    return (
                      <View key={note.id} style={styles.modalNote}>
                        <Text style={styles.modalNoteTime}>{time}</Text>
                        <Text style={styles.modalNoteText}>{note.note}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {selectedDayData && selectedDayData.entries.length === 0 && selectedDayData.notes.length === 0 && (
                <Text style={styles.modalEmpty}>No hay registros ni notas en este día</Text>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowDayDetails(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44,
    backgroundColor: '#2a0a0a',
  },
  header: {
    backgroundColor: '#3d1a1a',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#5d2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffaaaa',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputCard: {
    backgroundColor: '#3d1a1a',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#5d2a2a',
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 12,
    color: '#ffaaaa',
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyButton: {
    backgroundColor: '#8d1a1a',
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
    color: '#ff6666',
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
    color: '#ffaaaa',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#bd2a2a',
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
    borderColor: '#5d2a2a',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    backgroundColor: '#5d2a2a',
    color: '#fff',
  },
  saveNoteButton: {
    backgroundColor: '#bd2a2a',
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
    color: '#fff',
  },
  notesList: {
    marginTop: 12,
  },
  noteCard: {
    backgroundColor: '#5d2a2a',
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
    color: '#ffaaaa',
  },
  deleteNoteButton: {
    fontSize: 18,
  },
  noteText: {
    fontSize: 14,
    color: '#ffdddd',
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: '#ff6666',
    borderRadius: 10,
    padding: 12,
    width: 80,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: '#5d2a2a',
    color: '#fff',
  },
  buttonWrapper: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#3d1a1a',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#5d2a2a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#ffcccc',
    marginBottom: 8,
  },
  statsBold: {
    fontWeight: '700',
    color: '#ff6666',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleButton: {
    fontSize: 14,
    color: '#ff8888',
    fontWeight: '600',
  },
  entryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#5d2a2a',
  },
  entryCount: {
    fontSize: 14,
    color: '#ffcccc',
    fontWeight: '600',
  },
  deleteAllButton: {
    backgroundColor: '#8d1a1a',
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
    color: '#ffaaaa',
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
    backgroundColor: '#5d2a2a',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6666',
  },
  entryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryIntensity: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ff6666',
    width: 50,
  },
  entryDate: {
    flex: 1,
  },
  entryDateText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  entryTimeText: {
    fontSize: 12,
    color: '#ffaaaa',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#3d1a1a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8d1a1a',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#3d1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#5d2a2a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  modalClose: {
    fontSize: 24,
    color: '#ffaaaa',
    paddingLeft: 10,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#5d2a2a',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 10,
  },
  modalStatsText: {
    fontSize: 14,
    color: '#ffcccc',
  },
  modalStatsBold: {
    fontWeight: '700',
    color: '#ff6666',
  },
  modalScroll: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  modalSection: {
    marginTop: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  modalEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#5d2a2a',
    borderRadius: 8,
    marginBottom: 8,
  },
  modalEntryTime: {
    fontSize: 14,
    color: '#ffcccc',
  },
  modalEntryIntensity: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff6666',
  },
  modalNote: {
    padding: 12,
    backgroundColor: '#5d2a2a',
    borderRadius: 8,
    marginBottom: 8,
  },
  modalNoteTime: {
    fontSize: 12,
    color: '#ffaaaa',
    marginBottom: 6,
  },
  modalNoteText: {
    fontSize: 14,
    color: '#ffdddd',
    lineHeight: 20,
  },
  modalEmpty: {
    fontSize: 14,
    color: '#ffaaaa',
    textAlign: 'center',
    paddingVertical: 40,
    fontStyle: 'italic',
  },
  modalCloseButton: {
    backgroundColor: '#8d1a1a',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});