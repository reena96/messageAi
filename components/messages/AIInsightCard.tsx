import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types/message';
import { CalendarEvent } from '@/lib/ai/calendar';
import { Decision } from '@/lib/ai/decisions';
import { Priority } from '@/lib/ai/priority';

interface AIInsightCardProps {
  message: Message;
  onNavigate?: (action: { type: 'calendar' | 'decisions'; data?: any }) => void;
}

/**
 * AIInsightCard Component
 * Displays AI-extracted insights (calendar events, decisions, priority) inline in chat
 * Shows below the message that triggered the extraction
 */
export default function AIInsightCard({ message, onNavigate }: AIInsightCardProps) {
  const { aiExtraction } = message;

  // No AI extraction data - don't render anything
  if (!aiExtraction) {
    return null;
  }

  const { calendarEvents, decisions, priority } = aiExtraction;

  // Determine what to show (priority: calendar > decisions > priority)
  // Only show one card per message to avoid clutter
  const hasCalendar = calendarEvents && calendarEvents.length > 0;
  const hasDecisions = decisions && decisions.length > 0;
  const hasHighPriority = priority && (priority.level === 'critical' || priority.level === 'high');

  // Calendar events have highest priority for display
  if (hasCalendar) {
    return renderCalendarCard(calendarEvents![0], onNavigate);
  }

  // Then decisions
  if (hasDecisions) {
    return renderDecisionCard(decisions![0], onNavigate);
  }

  // Finally, only show priority if it's high or critical
  if (hasHighPriority) {
    return renderPriorityCard(priority!, onNavigate);
  }

  // Nothing important to show
  return null;
}

/**
 * Render calendar event card
 */
function renderCalendarCard(
  event: CalendarEvent,
  onNavigate?: (action: { type: 'calendar' | 'decisions'; data?: any }) => void
) {
  return (
    <TouchableOpacity
      style={[styles.card, styles.calendarCard]}
      onPress={() => onNavigate?.({ type: 'calendar', data: event })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="calendar" size={18} color="#007AFF" />
        <Text style={[styles.cardTitle, styles.calendarTitle]}>Calendar Event</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.eventName}>{event.event}</Text>
        <View style={styles.eventDetails}>
          <Text style={styles.eventDetail}>
            📅 {formatDate(event.date)}
            {event.time && ` at ${event.time}`}
          </Text>
          {event.location && (
            <Text style={styles.eventDetail}>📍 {event.location}</Text>
          )}
        </View>
        {event.confidence < 0.8 && (
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {Math.round(event.confidence * 100)}% confident
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * Render decision card
 */
function renderDecisionCard(
  decision: Decision,
  onNavigate?: (action: { type: 'calendar' | 'decisions'; data?: any }) => void
) {
  const isResolved = decision.status === 'resolved';
  const icon = isResolved ? 'checkmark-circle' : 'help-circle';
  const iconColor = isResolved ? '#34C759' : '#FF9500';

  return (
    <TouchableOpacity
      style={[styles.card, isResolved ? styles.resolvedCard : styles.pendingCard]}
      onPress={() => onNavigate?.({ type: 'decisions', data: { decision, filter: decision.status } })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text style={[styles.cardTitle, { color: iconColor }]}>
          {isResolved ? 'Decision' : 'Discussion'}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.decisionText}>{decision.decision}</Text>
        <View style={styles.decisionMeta}>
          <View style={[styles.statusBadge, isResolved ? styles.resolvedBadge : styles.pendingBadge]}>
            <Text style={styles.statusText}>
              {isResolved ? 'Resolved' : 'Pending'}
            </Text>
          </View>
          {decision.participants && decision.participants.length > 0 && (
            <Text style={styles.participants}>
              👥 {decision.participants.join(', ')}
            </Text>
          )}
        </View>
        {decision.context && (
          <Text style={styles.context}>{decision.context}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * Render priority card (only for critical/high)
 */
function renderPriorityCard(
  priority: Priority,
  onNavigate?: (action: { type: 'calendar' | 'decisions'; data?: any }) => void
) {
  const isCritical = priority.level === 'critical';
  const icon = isCritical ? 'alert-circle' : 'warning';
  const iconColor = isCritical ? '#FF3B30' : '#FF9500';

  return (
    <View style={[styles.card, isCritical ? styles.criticalCard : styles.highCard]}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text style={[styles.cardTitle, { color: iconColor }]}>
          {isCritical ? 'Critical' : 'High'} Priority
        </Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.priorityReason}>{priority.reason}</Text>
        {priority.urgency && (
          <View style={styles.urgencyBadge}>
            <Text style={styles.urgencyText}>⚡ Urgent</Text>
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * Format date string for display
 */
function formatDate(dateString: string): string {
  try {
    // Parse manually to avoid UTC timezone issues (learned from PR#6 bug fix)
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = new Date(year, month - 1, day);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      // Format: "Mon, Oct 28"
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      };
      return date.toLocaleDateString('en-US', options);
    }
  } catch (error) {
    return dateString;
  }
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    borderLeftWidth: 3,
  },
  calendarCard: {
    borderLeftColor: '#007AFF',
  },
  resolvedCard: {
    borderLeftColor: '#34C759',
  },
  pendingCard: {
    borderLeftColor: '#FF9500',
  },
  criticalCard: {
    borderLeftColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  highCard: {
    borderLeftColor: '#FF9500',
    backgroundColor: '#FFF9F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  calendarTitle: {
    color: '#007AFF',
  },
  cardContent: {
    marginLeft: 24,
  },
  eventName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 6,
  },
  eventDetails: {
    gap: 4,
  },
  eventDetail: {
    fontSize: 13,
    color: '#666',
  },
  confidenceBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  decisionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  decisionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  resolvedBadge: {
    backgroundColor: '#D1F2DD',
  },
  pendingBadge: {
    backgroundColor: '#FFE5CC',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  participants: {
    fontSize: 12,
    color: '#666',
  },
  context: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  priorityReason: {
    fontSize: 14,
    color: '#000',
    marginBottom: 6,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE5CC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 11,
    color: '#FF9500',
    fontWeight: '600',
  },
});
