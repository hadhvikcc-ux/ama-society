import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalizeDateToKey } from '../../stores/bookingStore';

export interface CalendarDayDot {
  color: string;
  label?: string;
  key?: string;
}

export interface CalendarMarkedDay {
  count?: number;
  dots?: CalendarDayDot[];
  label?: string;
  isFullyBooked?: boolean;
}

interface BookingCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  markedDates?: Record<string, CalendarMarkedDay>;
  minDate?: Date;
  maxDate?: Date;
  title?: string;
  showTodayButton?: boolean;
  compact?: boolean;
  headerRight?: React.ReactNode;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function BookingCalendar({
  selectedDate,
  onSelectDate,
  markedDates = {},
  minDate,
  maxDate,
  title,
  showTodayButton = true,
  compact = false,
  headerRight,
}: BookingCalendarProps) {
  // Navigation Month/Year state
  const [currentMonth, setCurrentMonth] = useState(() => selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(() => selectedDate.getFullYear());

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => normalizeDateToKey(today), [today]);
  const selectedKey = useMemo(() => normalizeDateToKey(selectedDate), [selectedDate]);

  // Handle month change
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    onSelectDate(now);
  };

  // Generate days grid
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const grid: Array<{
      dayNumber: number;
      dateObj: Date;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isPast: boolean;
      isDisabled: boolean;
      marked?: CalendarMarkedDay;
    }> = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dateObj = new Date(currentYear, currentMonth - 1, d);
      const dateKey = normalizeDateToKey(dateObj);
      grid.push({
        dayNumber: d,
        dateObj,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        isSelected: dateKey === selectedKey,
        isPast: dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        isDisabled: true,
      });
    }

    // 2. Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(currentYear, currentMonth, day);
      const dateKey = normalizeDateToKey(dateObj);
      const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      let isDisabled = false;
      if (minDate && dateObj < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) {
        isDisabled = true;
      }
      if (maxDate && dateObj > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) {
        isDisabled = true;
      }

      grid.push({
        dayNumber: day,
        dateObj,
        dateKey,
        isCurrentMonth: true,
        isToday: dateKey === todayKey,
        isSelected: dateKey === selectedKey,
        isPast,
        isDisabled,
        marked: markedDates[dateKey],
      });
    }

    // 3. Next month leading days to complete row
    const remaining = 7 - (grid.length % 7);
    if (remaining < 7) {
      for (let nextDay = 1; nextDay <= remaining; nextDay++) {
        const dateObj = new Date(currentYear, currentMonth + 1, nextDay);
        const dateKey = normalizeDateToKey(dateObj);
        grid.push({
          dayNumber: nextDay,
          dateObj,
          dateKey,
          isCurrentMonth: false,
          isToday: dateKey === todayKey,
          isSelected: dateKey === selectedKey,
          isPast: false,
          isDisabled: true,
        });
      }
    }

    return grid;
  }, [currentYear, currentMonth, todayKey, selectedKey, markedDates, minDate, maxDate]);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Calendar Header: Month Navigator & Quick Actions */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {title ? <Text style={styles.calendarTitle}>{title}</Text> : null}
          <View style={styles.monthSelector}>
            <Text style={styles.monthText}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightControls}>
          {showTodayButton && (
            <TouchableOpacity
              style={styles.todayBtn}
              onPress={handleGoToday}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={13} color="#1D4ED8" style={{ marginRight: 4 }} />
              <Text style={styles.todayBtnText}>Today</Text>
            </TouchableOpacity>
          )}

          <View style={styles.arrowGroup}>
            <TouchableOpacity
              style={styles.arrowBtn}
              onPress={handlePrevMonth}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color="#334155" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.arrowBtn}
              onPress={handleNextMonth}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color="#334155" />
            </TouchableOpacity>
          </View>

          {headerRight}
        </View>
      </View>

      {/* Weekdays Row */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day, idx) => (
          <View key={day} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                (idx === 0 || idx === 6) && styles.weekendText,
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.gridContainer}>
        {calendarGrid.map((item, index) => {
          const isSelected = item.isSelected;
          const isToday = item.isToday;
          const isCurrentMonth = item.isCurrentMonth;
          const hasBookings = item.marked && (item.marked.count || 0) > 0;

          return (
            <TouchableOpacity
              key={`${item.dateKey}-${index}`}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                !isCurrentMonth && styles.dayCellOtherMonth,
              ]}
              disabled={!isCurrentMonth || item.isDisabled}
              onPress={() => {
                if (isCurrentMonth && !item.isDisabled) {
                  onSelectDate(item.dateObj);
                }
              }}
              activeOpacity={0.7}
            >
              {/* Day Number */}
              <View
                style={[
                  styles.dayNumberWrap,
                  isSelected && styles.dayNumberWrapSelected,
                  isToday && !isSelected && styles.dayNumberWrapToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    !isCurrentMonth && styles.dayTextMuted,
                    item.isPast && isCurrentMonth && styles.dayTextPast,
                    isToday && !isSelected && styles.dayTextToday,
                    isSelected && styles.dayTextSelected,
                  ]}
                >
                  {item.dayNumber}
                </Text>
              </View>

              {/* Indicator Dots / Badges */}
              {isCurrentMonth && hasBookings && (
                <View style={styles.dotContainer}>
                  {item.marked?.dots ? (
                    item.marked.dots.slice(0, 3).map((dot, dIdx) => (
                      <View
                        key={dIdx}
                        style={[
                          styles.indicatorDot,
                          { backgroundColor: isSelected ? '#FFFFFF' : dot.color },
                        ]}
                      />
                    ))
                  ) : (
                    <View
                      style={[
                        styles.indicatorDot,
                        {
                          backgroundColor: isSelected
                            ? '#FFFFFF'
                            : item.marked?.isFullyBooked
                            ? '#EF4444'
                            : '#10B981',
                        },
                      ]}
                    />
                  )}

                  {/* Multi-booking counter if > 1 */}
                  {(item.marked?.count || 0) > 1 && (
                    <View
                      style={[
                        styles.miniCountBadge,
                        {
                          backgroundColor: isSelected
                            ? 'rgba(255,255,255,0.3)'
                            : '#EFF6FF',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.miniCountText,
                          { color: isSelected ? '#FFFFFF' : '#1D4ED8' },
                        ]}
                      >
                        {item.marked?.count}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend Footer */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Confirmed Bookings</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
          <Text style={styles.legendText}>Society Events</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendRing, { borderColor: '#1D4ED8' }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      },
    }),
  },
  containerCompact: {
    padding: 10,
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flex: 1,
  },
  calendarTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  arrowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  arrowBtn: {
    padding: 5,
    borderRadius: 6,
  },
  weekdaysRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  weekendText: {
    color: '#94A3B8',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderRadius: 10,
    marginVertical: 1,
  },
  dayCellSelected: {
    backgroundColor: '#1D4ED8',
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayNumberWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberWrapSelected: {
    backgroundColor: 'transparent',
  },
  dayNumberWrapToday: {
    borderWidth: 1.5,
    borderColor: '#1D4ED8',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayTextMuted: {
    color: '#94A3B8',
  },
  dayTextPast: {
    color: '#64748B',
  },
  dayTextToday: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 6,
    marginTop: 2,
  },
  indicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  miniCountBadge: {
    paddingHorizontal: 3,
    borderRadius: 4,
    marginLeft: 1,
  },
  miniCountText: {
    fontSize: 8,
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 12,
    paddingTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
});
