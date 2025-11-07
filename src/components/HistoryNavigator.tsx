import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { getAvailableYears, getYearStats, getMonthStats, getDayStats, Entry } from '../db';
import BarChart from './BarChart';

type ViewMode = 'years' | 'year' | 'month' | 'day';

interface HistoryNavigatorProps {
  visible: boolean;
  onClose: () => void;
}

export default function HistoryNavigator({ visible, onClose }: HistoryNavigatorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('years');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  const [yearData, setYearData] = useState<{ label: string; avg: number }[]>([]);
  const [monthData, setMonthData] = useState<{ day: number; label: string; avg: number; count: number }[]>([]);
  const [dayData, setDayData] = useState<{ entries: Entry[]; avg: number; count: number } | null>(null);

  useEffect(() => {
    if (visible) {
      loadAvailableYears();
    }
  }, [visible]);

  async function loadAvailableYears() {
    const years = await getAvailableYears();
    setAvailableYears(years);
    if (years.length === 0) {
      setAvailableYears([new Date().getFullYear()]);
    }
  }

  async function selectYear(year: number) {
    setSelectedYear(year);
    setViewMode('year');
    const data = await getYearStats(year);
    setYearData(data);
  }

  async function selectMonth(month: number) {
    if (!selectedYear) return;
    setSelectedMonth(month);
    setViewMode('month');
    const data = await getMonthStats(selectedYear, month);
    setMonthData(data);
  }

  async function selectDay(day: number) {
    if (!selectedYear || selectedMonth === null) return;
    setSelectedDay(day);
    setViewMode('day');
    const data = await getDayStats(selectedYear, selectedMonth, day);
    setDayData(data);
  }

  function goBack() {
    if (viewMode === 'day') {
      setViewMode('month');
      setSelectedDay(null);
    } else if (viewMode === 'month') {
      setViewMode('year');
      setSelectedMonth(null);
    } else if (viewMode === 'year') {
      setViewMode('years');
      setSelectedYear(null);
    }
  }

  function getBreadcrumb() {
    const parts: string[] = [];
    if (selectedYear) parts.push(`${selectedYear}`);
    if (selectedMonth !== null) {
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      parts.push(monthNames[selectedMonth]);
    }
    if (selectedDay !== null) parts.push(`Día ${selectedDay}`);
    return parts.join(' > ');
  }

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {viewMode !== 'years' && (
              <TouchableOpacity onPress={goBack} style={styles.backButton}>
                <Text style={styles.backText}>← Atrás</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕ Cerrar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>📅 Historial</Text>
          {(selectedYear || selectedMonth !== null || selectedDay !== null) && (
            <Text style={styles.breadcrumb}>{getBreadcrumb()}</Text>
          )}
        </View>

        <ScrollView style={styles.content}>
          {viewMode === 'years' && (
            <View>
              <Text style={styles.sectionTitle}>Selecciona un Año</Text>
              {availableYears.length === 0 ? (
                <Text style={styles.emptyText}>No hay registros históricos aún</Text>
              ) : (
                <View style={styles.grid}>
                  {availableYears.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={styles.yearButton}
                      onPress={() => selectYear(year)}
                    >
                      <Text style={styles.yearButtonText}>{year}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {viewMode === 'year' && selectedYear && (
            <View>
              <Text style={styles.sectionTitle}>Meses de {selectedYear}</Text>
              <BarChart 
                title={`Promedio Mensual - ${selectedYear}`}
                data={yearData.map(m => ({ label: m.label, value: m.avg }))}
              />
              <View style={styles.grid}>
                {monthNames.map((name, index) => {
                  const monthAvg = yearData[index]?.avg || 0;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.monthButton, monthAvg === 0 && styles.monthButtonEmpty]}
                      onPress={() => selectMonth(index)}
                    >
                      <Text style={styles.monthButtonName}>{name}</Text>
                      <Text style={styles.monthButtonAvg}>
                        {monthAvg > 0 ? `${monthAvg}/10` : 'Sin datos'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {viewMode === 'month' && selectedYear && selectedMonth !== null && (
            <View>
              <Text style={styles.sectionTitle}>
                {monthNames[selectedMonth]} {selectedYear}
              </Text>
              <BarChart 
                title={`Promedio Diario`}
                data={monthData.filter(d => d.avg > 0).map(d => ({ 
                  label: d.label, 
                  value: d.avg 
                }))}
              />
              <View style={styles.dayGrid}>
                {monthData.map((dayInfo) => (
                  <TouchableOpacity
                    key={dayInfo.day}
                    style={[
                      styles.dayButton,
                      dayInfo.count === 0 && styles.dayButtonEmpty
                    ]}
                    onPress={() => selectDay(dayInfo.day)}
                  >
                    <Text style={styles.dayButtonNumber}>{dayInfo.day}</Text>
                    {dayInfo.count > 0 && (
                      <Text style={styles.dayButtonAvg}>{dayInfo.avg}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {viewMode === 'day' && dayData && selectedYear && selectedMonth !== null && selectedDay && (
            <View>
              <Text style={styles.sectionTitle}>
                {selectedDay} de {monthNames[selectedMonth]} {selectedYear}
              </Text>
              <View style={styles.dayStatsCard}>
                <Text style={styles.dayStatsText}>
                  Registros: <Text style={styles.bold}>{dayData.count}</Text>
                </Text>
                <Text style={styles.dayStatsText}>
                  Promedio: <Text style={styles.bold}>{dayData.avg}/10</Text>
                </Text>
              </View>
              
              {dayData.entries.length > 0 ? (
                <View style={styles.entriesList}>
                  <Text style={styles.entriesTitle}>Registros del día:</Text>
                  {dayData.entries.map((entry) => {
                    const time = new Date(entry.ts).toLocaleTimeString('es', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    return (
                      <View key={entry.id} style={styles.entryCard}>
                        <Text style={styles.entryTime}>{time}</Text>
                        <Text style={styles.entryIntensity}>{entry.intensity}/10</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyText}>No hay registros en este día</Text>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2a0a0a',
  },
  header: {
    backgroundColor: '#3d1a1a',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#5d2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#ff8888',
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    color: '#ffaaaa',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  breadcrumb: {
    fontSize: 14,
    color: '#ffaaaa',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  yearButton: {
    backgroundColor: '#8d1a1a',
    borderRadius: 12,
    padding: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  yearButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  monthButton: {
    backgroundColor: '#3d1a1a',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#5d2a2a',
  },
  monthButtonEmpty: {
    backgroundColor: '#2a0a0a',
    opacity: 0.6,
  },
  monthButtonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  monthButtonAvg: {
    fontSize: 14,
    color: '#ff8888',
    fontWeight: '700',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    backgroundColor: '#3d1a1a',
    borderRadius: 8,
    padding: 12,
    width: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#5d2a2a',
  },
  dayButtonEmpty: {
    backgroundColor: '#2a0a0a',
    opacity: 0.4,
  },
  dayButtonNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  dayButtonAvg: {
    fontSize: 11,
    color: '#ff8888',
    fontWeight: '700',
    marginTop: 2,
  },
  dayStatsCard: {
    backgroundColor: '#3d1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#5d2a2a',
  },
  dayStatsText: {
    fontSize: 16,
    color: '#ffcccc',
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
    color: '#ff6666',
  },
  entriesList: {
    backgroundColor: '#3d1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#5d2a2a',
  },
  entriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#5d2a2a',
    borderRadius: 8,
    marginBottom: 8,
  },
  entryTime: {
    fontSize: 14,
    color: '#ffcccc',
  },
  entryIntensity: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff6666',
  },
  emptyText: {
    fontSize: 14,
    color: '#ffaaaa',
    textAlign: 'center',
    marginTop: 20,
  },
});
