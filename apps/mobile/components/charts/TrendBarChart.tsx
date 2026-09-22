import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export interface BarGroupDataPoint {
  label: string; // e.g. "Apr", "May", "Jun"
  series1: number; // e.g. Billed / Inflow / Extended
  series2?: number; // e.g. Collected / Outflow / Recovered
  series3?: number; // optional e.g. Due / Margin
  formatted1?: string; // e.g. "₹5.2L"
  formatted2?: string; // e.g. "₹4.5L"
  formatted3?: string;
  badge?: string; // e.g. "91% rate"
}

export interface TrendBarChartProps {
  data: BarGroupDataPoint[];
  height?: number;
  series1Label: string;
  series1Color?: string;
  series2Label?: string;
  series2Color?: string;
  series3Label?: string;
  series3Color?: string;
  yAxisPrefix?: string;
  yAxisSuffix?: string;
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
  valueFormatter?: (val: number) => string;
}

export function TrendBarChart({
  data,
  height = 200,
  series1Label,
  series1Color = '#1D4ED8',
  series2Label,
  series2Color = '#10B981',
  series3Label,
  series3Color = '#F59E0B',
  yAxisPrefix = '₹',
  yAxisSuffix = '',
  selectedIndex: controlledIndex,
  onSelectIndex,
  valueFormatter,
}: TrendBarChartProps) {
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number>(data.length - 1);
  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalSelectedIndex;

  const handleSelect = (idx: number) => {
    setInternalSelectedIndex(idx);
    if (onSelectIndex) {
      onSelectIndex(idx);
    }
  };

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>No bar trend data</Text>
      </View>
    );
  }

  // Find max value across all series
  const allValues = data.flatMap((d) => [
    d.series1,
    d.series2 !== undefined ? d.series2 : 0,
    d.series3 !== undefined ? d.series3 : 0,
  ]);
  const maxValue = Math.max(...allValues, 1) * 1.15; // 15% head room

  const formatVal = (v: number) => {
    if (valueFormatter) return valueFormatter(v);
    return `${yAxisPrefix}${v.toLocaleString()}${yAxisSuffix}`;
  };

  const selectedItem = data[activeIndex] || data[data.length - 1];

  return (
    <View style={styles.wrapper}>
      {/* Legend & Detail Readout Header */}
      {selectedItem && (
        <View style={styles.readoutCard}>
          <View>
            <Text style={styles.readoutMonthText}>{selectedItem.label} Breakdown</Text>
            <View style={styles.metricChipsRow}>
              <View style={styles.chipItem}>
                <View style={[styles.chipDot, { backgroundColor: series1Color }]} />
                <Text style={styles.chipText}>
                  {series1Label}: <Text style={styles.chipBold}>{selectedItem.formatted1 || formatVal(selectedItem.series1)}</Text>
                </Text>
              </View>

              {series2Label && selectedItem.series2 !== undefined && (
                <View style={styles.chipItem}>
                  <View style={[styles.chipDot, { backgroundColor: series2Color }]} />
                  <Text style={styles.chipText}>
                    {series2Label}: <Text style={[styles.chipBold, { color: series2Color }]}>{selectedItem.formatted2 || formatVal(selectedItem.series2)}</Text>
                  </Text>
                </View>
              )}

              {series3Label && selectedItem.series3 !== undefined && (
                <View style={styles.chipItem}>
                  <View style={[styles.chipDot, { backgroundColor: series3Color }]} />
                  <Text style={styles.chipText}>
                    {series3Label}: <Text style={[styles.chipBold, { color: series3Color }]}>{selectedItem.formatted3 || formatVal(selectedItem.series3)}</Text>
                  </Text>
                </View>
              )}
            </View>
          </View>

          {selectedItem.badge && (
            <View style={styles.badgeBox}>
              <Text style={styles.badgeText}>{selectedItem.badge}</Text>
            </View>
          )}
        </View>
      )}

      {/* Bar Columns Container */}
      <View style={[styles.chartBody, { height: height - 60 }]}>
        {/* Background Horizontal Guide Lines */}
        <View style={styles.guidelinesBox}>
          <View style={[styles.guideline, { top: 0 }]} />
          <View style={[styles.guideline, { top: '33%' }]} />
          <View style={[styles.guideline, { top: '66%' }]} />
          <View style={[styles.guideline, { bottom: 0 }]} />
        </View>

        {/* Render Months and Bars */}
        <View style={styles.columnsContainer}>
          {data.map((item, idx) => {
            const isSelected = idx === activeIndex;
            const h1 = Math.min(100, Math.max(4, (item.series1 / maxValue) * 100));
            const h2 = item.series2 !== undefined ? Math.min(100, Math.max(4, (item.series2 / maxValue) * 100)) : 0;
            const h3 = item.series3 !== undefined ? Math.min(100, Math.max(4, (item.series3 / maxValue) * 100)) : 0;

            return (
              <TouchableOpacity
                key={`bcol-${idx}`}
                onPress={() => handleSelect(idx)}
                style={[styles.colWrapper, isSelected && styles.colWrapperSelected]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${item.label} column`}
              >
                {/* Bar Cluster */}
                <View style={styles.barCluster}>
                  {/* Series 1 Bar */}
                  <View style={styles.barSlot}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${h1}%`,
                          backgroundColor: series1Color,
                          opacity: isSelected ? 1 : 0.85,
                        },
                      ]}
                    />
                  </View>

                  {/* Series 2 Bar */}
                  {series2Label && item.series2 !== undefined && (
                    <View style={styles.barSlot}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${h2}%`,
                            backgroundColor: series2Color,
                            opacity: isSelected ? 1 : 0.85,
                          },
                        ]}
                      />
                    </View>
                  )}

                  {/* Series 3 Bar */}
                  {series3Label && item.series3 !== undefined && (
                    <View style={styles.barSlot}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${h3}%`,
                            backgroundColor: series3Color,
                            opacity: isSelected ? 1 : 0.85,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>

                {/* X-Axis Label */}
                <Text style={[styles.colMonthLabel, isSelected && styles.colMonthLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: 6,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  readoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  readoutMonthText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
    alignItems: 'center',
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  chipText: {
    fontSize: 12,
    color: '#334155',
  },
  chipBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeBox: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '800',
  },
  chartBody: {
    position: 'relative',
    width: '100%',
    paddingBottom: 22, // space for month label
  },
  guidelinesBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 22,
    justifyContent: 'space-between',
  },
  guideline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F1F5F9',
    borderStyle: 'dashed',
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 4,
  },
  colWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    paddingBottom: 2,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  colWrapperSelected: {
    backgroundColor: '#F1F5F9',
  },
  barCluster: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: '80%',
    width: '100%',
    justifyContent: 'center',
  },
  barSlot: {
    width: 8,
    maxWidth: 12,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  colMonthLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 6,
  },
  colMonthLabelActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
});
