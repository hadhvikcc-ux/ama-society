import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Line,
  G,
} from 'react-native-svg';

export interface TrendDataPoint {
  label: string; // e.g. "Apr", "May", "Jun"
  value: number; // primary value (e.g. 4.5)
  secondaryValue?: number; // optional secondary value (e.g. 3.8)
  formattedValue?: string; // e.g. "₹4.5L"
  formattedSecondary?: string; // e.g. "₹3.8L"
  subText?: string; // e.g. "94% target"
}

export interface TrendAreaLineChartProps {
  data: TrendDataPoint[];
  height?: number;
  primaryColor?: string; // e.g. '#1D4ED8'
  secondaryColor?: string; // e.g. '#16A34A'
  primaryLabel?: string; // e.g. 'Revenue'
  secondaryLabel?: string; // e.g. 'Collections'
  yAxisPrefix?: string; // e.g. '₹'
  yAxisSuffix?: string; // e.g. 'L' or 'k'
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
  showSecondaryLine?: boolean;
  valueFormatter?: (val: number) => string;
}

export function TrendAreaLineChart({
  data,
  height = 180,
  primaryColor = '#1D4ED8',
  secondaryColor = '#10B981',
  primaryLabel,
  secondaryLabel,
  yAxisPrefix = '',
  yAxisSuffix = '',
  selectedIndex: controlledIndex,
  onSelectIndex,
  showSecondaryLine = false,
  valueFormatter,
}: TrendAreaLineChartProps) {
  const [containerWidth, setContainerWidth] = useState<number>(340);
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number>(data.length - 1);

  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalSelectedIndex;

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setContainerWidth(w);
    }
  };

  const handleSelectPoint = (idx: number) => {
    setInternalSelectedIndex(idx);
    if (onSelectIndex) {
      onSelectIndex(idx);
    }
  };

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>No trend data available</Text>
      </View>
    );
  }

  // Calculate layout coordinates
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = Math.max(containerWidth - paddingLeft - paddingRight, 100);
  const chartHeight = Math.max(height - paddingTop - paddingBottom, 60);

  // Find min & max across values
  const allValues = data.flatMap((d) => [d.value, showSecondaryLine && d.secondaryValue !== undefined ? d.secondaryValue : d.value]);
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const paddingBuffer = (rawMax - rawMin) * 0.15 || rawMax * 0.1 || 1;
  const minValue = Math.max(0, Math.floor(rawMin - paddingBuffer));
  const maxValue = Math.ceil(rawMax + paddingBuffer);
  const valueRange = maxValue - minValue || 1;

  // Grid steps (3 horizontal lines)
  const gridSteps = [
    maxValue,
    Math.round(minValue + valueRange * 0.5),
    minValue,
  ];

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minValue, Math.min(maxValue, val));
    const normalized = (clamped - minValue) / valueRange;
    return paddingTop + chartHeight - normalized * chartHeight;
  };

  // Build primary path
  const primaryPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));
  const bottomY = paddingTop + chartHeight;

  let primaryLinePath = '';
  let primaryAreaPath = '';

  if (primaryPoints.length > 0) {
    primaryLinePath = `M ${primaryPoints[0].x} ${primaryPoints[0].y}`;
    for (let i = 1; i < primaryPoints.length; i++) {
      const prev = primaryPoints[i - 1];
      const curr = primaryPoints[i];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      primaryLinePath += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }

    primaryAreaPath = `${primaryLinePath} L ${primaryPoints[primaryPoints.length - 1].x} ${bottomY} L ${primaryPoints[0].x} ${bottomY} Z`;
  }

  // Build secondary path if enabled
  let secondaryLinePath = '';
  if (showSecondaryLine) {
    const secPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.secondaryValue ?? d.value) }));
    if (secPoints.length > 0) {
      secondaryLinePath = `M ${secPoints[0].x} ${secPoints[0].y}`;
      for (let i = 1; i < secPoints.length; i++) {
        const prev = secPoints[i - 1];
        const curr = secPoints[i];
        const cx1 = prev.x + (curr.x - prev.x) / 2;
        const cy1 = prev.y;
        const cx2 = prev.x + (curr.x - prev.x) / 2;
        const cy2 = curr.y;
        secondaryLinePath += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
      }
    }
  }

  const selectedItem = data[activeIndex] || data[data.length - 1];
  const formatVal = (v: number) => {
    if (valueFormatter) return valueFormatter(v);
    return `${yAxisPrefix}${v.toLocaleString()}${yAxisSuffix}`;
  };

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      {/* Dynamic Detail Card for selected month */}
      {selectedItem && (
        <View style={styles.readoutCard}>
          <View>
            <Text style={styles.readoutLabel}>{selectedItem.label} Details</Text>
            <View style={styles.readoutRow}>
              <View style={[styles.readoutDot, { backgroundColor: primaryColor }]} />
              <Text style={styles.readoutValue}>
                {selectedItem.formattedValue || formatVal(selectedItem.value)}
              </Text>
              {primaryLabel && <Text style={styles.readoutSub}>({primaryLabel})</Text>}

              {showSecondaryLine && selectedItem.secondaryValue !== undefined && (
                <>
                  <View style={[styles.readoutDot, { backgroundColor: secondaryColor, marginLeft: 10 }]} />
                  <Text style={[styles.readoutValue, { color: secondaryColor }]}>
                    {selectedItem.formattedSecondary || formatVal(selectedItem.secondaryValue)}
                  </Text>
                  {secondaryLabel && <Text style={styles.readoutSub}>({secondaryLabel})</Text>}
                </>
              )}
            </View>
          </View>

          {selectedItem.subText && (
            <View style={styles.subBadge}>
              <Text style={styles.subBadgeText}>{selectedItem.subText}</Text>
            </View>
          )}
        </View>
      )}

      {/* SVG Canvas */}
      <Svg width={containerWidth} height={height}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={primaryColor} stopOpacity="0.32" />
            <Stop offset="0.8" stopColor={primaryColor} stopOpacity="0.04" />
            <Stop offset="1" stopColor={primaryColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Gridlines & Y-Axis Scale */}
        <G>
          {gridSteps.map((stepVal, idx) => {
            const yPos = getY(stepVal);
            return (
              <G key={`grid-${idx}`}>
                <Line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={containerWidth - paddingRight}
                  y2={yPos}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              </G>
            );
          })}
        </G>

        {/* Active Month Vertical Indicator Bar */}
        {primaryPoints[activeIndex] && (
          <Line
            x1={primaryPoints[activeIndex].x}
            y1={paddingTop}
            x2={primaryPoints[activeIndex].x}
            y2={bottomY}
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        {/* Primary Area Fill */}
        {primaryAreaPath ? (
          <Path d={primaryAreaPath} fill="url(#areaGradient)" />
        ) : null}

        {/* Secondary Line (if enabled) */}
        {showSecondaryLine && secondaryLinePath ? (
          <Path
            d={secondaryLinePath}
            fill="none"
            stroke={secondaryColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ) : null}

        {/* Primary Line */}
        {primaryLinePath ? (
          <Path
            d={primaryLinePath}
            fill="none"
            stroke={primaryColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
        ) : null}

        {/* Data Points */}
        {primaryPoints.map((pt, i) => {
          const isSelected = i === activeIndex;
          return (
            <G key={`pt-${i}`}>
              {isSelected && (
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r="9"
                  fill={primaryColor}
                  opacity="0.2"
                />
              )}
              <Circle
                cx={pt.x}
                cy={pt.y}
                r={isSelected ? '5.5' : '3.5'}
                fill="#FFFFFF"
                stroke={primaryColor}
                strokeWidth={isSelected ? '3' : '2'}
              />
            </G>
          );
        })}
      </Svg>

      {/* Y-Axis Label Overlays (Pure View for crisp cross-platform text) */}
      <View style={[styles.yAxisContainer, { height: chartHeight, top: paddingTop }]}>
        {gridSteps.map((stepVal, idx) => (
          <Text key={`ylab-${idx}`} style={styles.yAxisText}>
            {formatVal(stepVal)}
          </Text>
        ))}
      </View>

      {/* X-Axis Interactive Month Touch Targets */}
      <View style={[styles.xAxisRow, { paddingLeft, paddingRight }]}>
        {data.map((item, idx) => {
          const isSelected = idx === activeIndex;
          return (
            <TouchableOpacity
              key={`xaxis-${idx}`}
              onPress={() => handleSelectPoint(idx)}
              style={[styles.xTouchItem, isSelected && styles.xTouchItemActive]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Select ${item.label}`}
            >
              <Text style={[styles.xLabel, isSelected && { color: primaryColor, fontWeight: '800' }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    position: 'relative',
    marginVertical: 4,
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
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  readoutLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  readoutDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  readoutValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  readoutSub: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 4,
  },
  subBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subBadgeText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700',
  },
  yAxisContainer: {
    position: 'absolute',
    left: 2,
    justifyContent: 'space-between',
    width: 36,
  },
  yAxisText: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'left',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -4,
  },
  xTouchItem: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  xTouchItemActive: {
    backgroundColor: '#F1F5F9',
  },
  xLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
});
