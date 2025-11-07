import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type BarData = { 
  label: string; 
  value: number; 
  date?: Date;
  count?: number;
};

type BarChartProps = { 
  title: string; 
  data: BarData[];
  onBarPress?: (item: BarData, index: number) => void;
  showNavigation?: boolean;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
};

export default function BarChart({ 
  title, 
  data, 
  onBarPress,
  showNavigation = false,
  onNavigatePrev,
  onNavigateNext,
  canNavigatePrev = true,
  canNavigateNext = false
}: BarChartProps) {
  const max = 10;
  
  if (data.length === 0) {
    return (
      <View style={styles.container}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <Text style={styles.emptyText}>Sin datos aún</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {showNavigation && onNavigatePrev && (
          <TouchableOpacity 
            onPress={onNavigatePrev}
            disabled={!canNavigatePrev}
            style={[styles.navButton, !canNavigatePrev && styles.navButtonDisabled]}
          >
            <Text style={[styles.navButtonText, !canNavigatePrev && styles.navButtonTextDisabled]}>
              ← Anterior
            </Text>
          </TouchableOpacity>
        )}
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {showNavigation && onNavigateNext && (
          <TouchableOpacity 
            onPress={onNavigateNext}
            disabled={!canNavigateNext}
            style={[styles.navButton, !canNavigateNext && styles.navButtonDisabled]}
          >
            <Text style={[styles.navButtonText, !canNavigateNext && styles.navButtonTextDisabled]}>
              Siguiente →
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.chartContainer}>
        {data.map((d, i) => {
          const value = Math.max(0, Math.min(10, d.value || 0));
          const h = (value / max) * 120; // altura máxima 120px
          const barColor = value >= 7 ? '#ff6666' : value >= 4 ? '#ffaa66' : '#66dd99';
          
          return onBarPress ? (
            <TouchableOpacity 
              key={i} 
              style={styles.barWrapper}
              onPress={() => onBarPress(d, i)}
              activeOpacity={0.7}
            >
              <Text style={styles.valueText}>{value > 0 ? value.toFixed(1) : ''}</Text>
              <View style={[styles.bar, { height: Math.max(4, h), backgroundColor: barColor }]} />
              <Text style={styles.labelText}>{d.label}</Text>
              {d.count !== undefined && d.count > 0 && (
                <Text style={styles.countText}>({d.count})</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View key={i} style={styles.barWrapper}>
              <Text style={styles.valueText}>{value > 0 ? value.toFixed(1) : ''}</Text>
              <View style={[styles.bar, { height: Math.max(4, h), backgroundColor: barColor }]} />
              <Text style={styles.labelText}>{d.label}</Text>
              {d.count !== undefined && d.count > 0 && (
                <Text style={styles.countText}>({d.count})</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    backgroundColor: '#8d1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  navButtonDisabled: {
    backgroundColor: '#5d2a2a',
    opacity: 0.5,
  },
  navButtonText: {
    color: '#ffcccc',
    fontSize: 12,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#999',
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    minHeight: 140,
    paddingBottom: 4,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 60,
  },
  valueText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffcccc',
    marginBottom: 4,
    minHeight: 14,
  },
  bar: {
    width: 24,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4,
  },
  labelText: {
    fontSize: 10,
    color: '#ffaaaa',
    marginTop: 4,
    textAlign: 'center',
  },
  countText: {
    fontSize: 9,
    color: '#ff8888',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#ffaaaa',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});