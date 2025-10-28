import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, TextInput, Platform, StatusBar, ScrollView, StyleSheet } from 'react-native';
import { initDB, addEntry, statsToday, last7DaysAverages, last30DaysAverage, last3MonthsAverages, last6MonthsAverages, lastYearAverages } from './src/db';
import BarChart from './src/components/BarChart';
// import AuthScreen from './src/components/AuthScreen'; // Deshabilitado temporalmente

export default function App(){
  // const [isAuthenticated, setIsAuthenticated] = useState(false); // Deshabilitado temporalmente
  const [intensity, setIntensity] = useState('5');
  const [today, setToday] = useState<{count:number; avg:number}>({count:0, avg:0});
  const [week, setWeek] = useState<{label:string, avg:number}[]>([]);
  const [month30, setMonth30] = useState<{label:string, avg:number}>({label: '', avg: 0});
  const [m3, setM3] = useState<{label:string, avg:number}[]>([]);
  const [m6, setM6] = useState<{label:string, avg:number}[]>([]);
  const [y12, setY12] = useState<{label:string, avg:number}[]>([]);

  async function refresh(){
    setToday(await statsToday());
    setWeek(await last7DaysAverages());
    setMonth30(await last30DaysAverage());
    setM3(await last3MonthsAverages());
    setM6(await last6MonthsAverages());
    setY12(await lastYearAverages());
  }

  useEffect(() => { 
    // if (isAuthenticated) { // Deshabilitado temporalmente
      (async () => { await initDB(); await refresh(); })(); 
    // }
  }, []); // Cambiado de [isAuthenticated] a []

  async function onSave(){
    const n = Math.max(1, Math.min(10, Number(intensity) || 5));
    await addEntry(n);
    Alert.alert('Registro Guardado', `Nivel de enojo registrado: ${n}/10`);
    setIntensity('5');
    await refresh();
  }

  // Si no está autenticado, mostrar pantalla de autenticación
  // DESHABILITADO TEMPORALMENTE PARA QUE COMPILE
  // if (!isAuthenticated) {
  //   return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  // }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Registro de Enojo</Text>
        <Text style={styles.subtitle}>Lleva un control de tus emociones</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>¿Cuál es tu nivel de enojo ahora?</Text>
          <Text style={styles.inputHint}>Escala del 1 (mínimo) al 10 (máximo)</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={intensity}
              onChangeText={setIntensity}
              keyboardType='numeric'
              inputMode='numeric'
              placeholder='5'
              style={styles.input}
            />
            <View style={styles.buttonWrapper}>
              <Button title='Registrar' onPress={onSave} color="#4c9" />
            </View>
          </View>
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

        <View style={{height: 20}} />
      </ScrollView>
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
});