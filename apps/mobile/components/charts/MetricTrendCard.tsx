import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SummaryMetricPill {
  label: string;
  value: string;
  subText?: string;
  color?: string; // value text color
  bgColor?: string;
}

export interface MetricTrendCardProps {
  title: string;
  subtitle?: string;
  icon?: any;
  iconColor?: string;
  metrics?: SummaryMetricPill[];
  periodOptions?: string[];
  selectedPeriod?: string;
  onSelectPeriod?: (period: string) => void;
  chartTypeToggle?: boolean;
  chartType?: 'area' | 'bar';
  onChangeChartType?: (type: 'area' | 'bar') => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  footerNote?: string;
}

export function MetricTrendCard({
  title,
  subtitle,
  icon = 'trending-up',
  iconColor = '#1D4ED8',
  metrics,
  periodOptions,
  selectedPeriod,
  onSelectPeriod,
  chartTypeToggle = false,
  chartType = 'area',
  onChangeChartType,
  children,
  style,
  footerNote,
}: MetricTrendCardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <View style={styles.titleTop}>
            <View style={[styles.iconCircle, { backgroundColor: iconColor + '18' }]}>
              <Ionicons name={icon} size={18} color={iconColor} />
            </View>
            <Text style={styles.titleText}>{title}</Text>
          </View>
          {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
        </View>

        {/* Controls: Chart Type Toggle or Period Filter */}
        <View style={styles.controlsRow}>
          {chartTypeToggle && onChangeChartType && (
            <View style={styles.typeToggleContainer}>
              <TouchableOpacity
                style={[styles.typeBtn, chartType === 'area' && styles.typeBtnActive]}
                onPress={() => onChangeChartType('area')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Area trend view"
              >
                <Ionicons name="analytics-outline" size={14} color={chartType === 'area' ? '#1D4ED8' : '#64748B'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, chartType === 'bar' && styles.typeBtnActive]}
                onPress={() => onChangeChartType('bar')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Bar comparison view"
              >
                <Ionicons name="bar-chart-outline" size={14} color={chartType === 'bar' ? '#1D4ED8' : '#64748B'} />
              </TouchableOpacity>
            </View>
          )}

          {periodOptions && periodOptions.length > 0 && onSelectPeriod && (
            <View style={styles.periodRow}>
              {periodOptions.map((p) => {
                const isSelected = selectedPeriod === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.periodPill, isSelected && styles.periodPillActive]}
                    onPress={() => onSelectPeriod(p)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.periodText, isSelected && styles.periodTextActive]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Metrics Summary Strip (if provided) */}
      {metrics && metrics.length > 0 && (
        <View style={styles.metricsStrip}>
          {metrics.map((m, idx) => (
            <View
              key={`metric-${idx}`}
              style={[
                styles.metricPillBox,
                m.bgColor ? { backgroundColor: m.bgColor } : undefined,
              ]}
            >
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={[styles.metricVal, m.color ? { color: m.color } : undefined]}>
                {m.value}
              </Text>
              {m.subText && <Text style={styles.metricSub}>{m.subText}</Text>}
            </View>
          ))}
        </View>
      )}

      {/* Chart Canvas Area */}
      <View style={styles.chartContainer}>{children}</View>

      {/* Optional Footer Note */}
      {footerNote && (
        <View style={styles.footerRow}>
          <Ionicons name="information-circle-outline" size={13} color="#94A3B8" />
          <Text style={styles.footerText}>{footerNote}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleArea: {
    flex: 1,
    marginRight: 8,
  },
  titleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  subtitleText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  typeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  periodPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  periodPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  periodTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  metricsStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricPillBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 1,
  },
  chartContainer: {
    width: '100%',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
