import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types/message';
import { CalendarEvent } from '@/lib/ai/calendar';
import { Decision } from '@/lib/ai/decisions';
import { Priority } from '@/lib/ai/priority';
import { RSVP } from '@/lib/ai/rsvp';
import { Deadline } from '@/lib/ai/deadlines';
import {
  addToCalendar,
  markDeadlineComplete,
  sendRSVPResponse,
  formatDeadlineDate,
  isDeadlineOverdue,
  getPriorityColor,
} from '@/lib/utils/quickActions';

interface AIInsightCardProps {
  message: Message;
  chatId: string;
  currentUserId: string;
  onNavigate?: (action: { type: 'calendar' | 'decisions'; data?: any }) => void;
  onSendMessage?: (chatId: string, senderId: string, text: string) => Promise<void>;
}

/**
 * AIInsightCard Component
 * Displays AI-extracted insights (calendar events, decisions, priority, RSVP, deadlines) inline in chat
 * Shows below the message that triggered the extraction
 */
export default function AIInsightCard({
  message,
  chatId,
  currentUserId,
  onNavigate,
  onSendMessage,
}: AIInsightCardProps) {
  const { aiExtraction } = message;

  // No AI extraction data - don't render anything
  if (!aiExtraction) {
    return null;
  }

  const { calendarEvents, decisions, priority, rsvp, deadlines } = aiExtraction;

  // Debug logging
  if (rsvp || deadlines) {
    console.log('[AIInsightCard] Rendering cards:', {
      rsvp,
      deadlines,
      hasRSVP: rsvp && (rsvp.isInvitation || rsvp.isResponse),
      hasDeadlines: deadlines && deadlines.length > 0,
    });
  }

  // Determine what to show (priority: deadlines > RSVP > calendar > decisions > priority)
  // Show multiple cards if message has multiple important insights
  const hasCalendar = calendarEvents && calendarEvents.length > 0;
  const hasDecisions = decisions && decisions.length > 0;
  const hasHighPriority = priority && (priority.level === 'critical' || priority.level === 'high');
  const hasRSVP = rsvp && (rsvp.isInvitation || rsvp.isResponse);
  const hasDeadlines = deadlines && deadlines.length > 0;

  // Render cards in priority order (can show multiple)
  return (
    <>
      {/* Deadlines - highest priority for parents */}
      {hasDeadlines && renderDeadlineCard(deadlines![0], chatId, message.id)}

      {/* RSVP - invitations or responses */}
      {hasRSVP && renderRSVPCard(rsvp!, chatId, currentUserId, onSendMessage)}

      {/* Calendar events */}
      {hasCalendar && renderCalendarCard(calendarEvents![0], onNavigate)}

      {/* Decisions */}
      {hasDecisions && renderDecisionCard(decisions![0], onNavigate)}

      {/* Priority - only if high or critical and no other cards shown */}
      {hasHighPriority && !hasDeadlines && !hasRSVP && !hasCalendar && !hasDecisions &&
        renderPriorityCard(priority!, onNavigate)}
    </>
  );
}

/**
 * Render calendar event card with Add to Calendar button
 */
function renderCalendarCard(
  event: CalendarEvent,
  onNavigate?: (action: { type: 'calendar' | 'decisions'; data?: any }) => void
) {
  const handleAddToCalendar = () => {
    addToCalendar(event);
  };

  return (
    <View style={[styles.card, styles.calendarCard]}>
      <TouchableOpacity
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

      {/* Quick Action: Add to Calendar */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleAddToCalendar}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={16} color="#FFF" />
          <Text style={styles.actionButtonText}>Add to Calendar</Text>
        </TouchableOpacity>
      </View>
    </View>
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
 * Render RSVP card (invitation or response)
 */
function renderRSVPCard(
  rsvp: RSVP,
  chatId: string,
  currentUserId: string,
  onSendMessage?: (chatId: string, senderId: string, text: string) => Promise<void>
) {
  const handleRSVP = (response: 'yes' | 'no' | 'maybe') => {
    if (onSendMessage) {
      sendRSVPResponse(response, chatId, currentUserId, onSendMessage);
    }
  };

  if (rsvp.isInvitation) {
    // Invitation card with RSVP buttons - show to everyone
    return (
      <View style={[styles.card, styles.rsvpCard]}>
        <View style={styles.cardHeader}>
          <Ionicons name="people" size={18} color="#5856D6" />
          <Text style={[styles.cardTitle, { color: '#5856D6' }]}>Event Invitation</Text>
        </View>
        <View style={styles.cardContent}>
          {rsvp.event && <Text style={styles.eventName}>{rsvp.event}</Text>}
          {rsvp.details && <Text style={styles.rsvpDetails}>{rsvp.details}</Text>}

          {/* Show RSVP counts if available */}
          {rsvp.responses && (
            <View style={styles.rsvpCounts}>
              <Text style={styles.rsvpCountText}>
                {rsvp.responses.yes} Yes • {rsvp.responses.no} No • {rsvp.responses.maybe} Maybe
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions: RSVP Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.yesButton]}
            onPress={() => handleRSVP('yes')}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.noButton]}
            onPress={() => handleRSVP('no')}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>No</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.maybeButton]}
            onPress={() => handleRSVP('maybe')}
            activeOpacity={0.7}
          >
            <Ionicons name="help-circle" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>Maybe</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  } else if (rsvp.isResponse && rsvp.response) {
    // Response card - simple acknowledgment
    const responseColor = rsvp.response === 'yes' ? '#34C759' : rsvp.response === 'no' ? '#FF3B30' : '#FF9500';
    const responseText = rsvp.response === 'yes' ? 'Yes' : rsvp.response === 'no' ? 'No' : 'Maybe';
    const responseIcon = rsvp.response === 'yes' ? 'checkmark-circle' : rsvp.response === 'no' ? 'close-circle' : 'help-circle';

    return (
      <View style={[styles.card, { borderLeftColor: responseColor }]}>
        <View style={styles.cardHeader}>
          <Ionicons name={responseIcon} size={18} color={responseColor} />
          <Text style={[styles.cardTitle, { color: responseColor }]}>RSVP: {responseText}</Text>
        </View>
      </View>
    );
  }

  return null;
}

/**
 * Render deadline card with Mark Done button
 */
function renderDeadlineCard(deadline: Deadline, chatId: string, messageId: string) {
  const isOverdue = isDeadlineOverdue(deadline.dueDate);
  const priorityColor = getPriorityColor(deadline.priority || 'medium');

  const handleMarkDone = () => {
    markDeadlineComplete(chatId, messageId, 0); // Mark first deadline
  };

  return (
    <View style={[styles.card, styles.deadlineCard, isOverdue && styles.overdueCard]}>
      <View style={styles.cardHeader}>
        <Ionicons name="alarm" size={18} color={priorityColor} />
        <Text style={[styles.cardTitle, { color: priorityColor }]}>
          {isOverdue ? 'Overdue Deadline' : 'Deadline'}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.eventName}>{deadline.task}</Text>
        <View style={styles.eventDetails}>
          <Text style={[styles.eventDetail, isOverdue && styles.overdueText]}>
            ⏰ {formatDeadlineDate(deadline.dueDate, deadline.dueTime)}
          </Text>
        </View>

        {/* Priority Badge */}
        {deadline.priority && (
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
            <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
              {deadline.priority.toUpperCase()} PRIORITY
            </Text>
          </View>
        )}

        {/* Completed Badge */}
        {deadline.completed && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#34C759" />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
      </View>

      {/* Quick Action: Mark Done */}
      {!deadline.completed && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.successButton]}
            onPress={handleMarkDone}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>Mark Done</Text>
          </TouchableOpacity>
        </View>
      )}
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
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    marginTop: 12,
    marginLeft: 24,
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  yesButton: {
    backgroundColor: '#34C759',
  },
  noButton: {
    backgroundColor: '#FF3B30',
  },
  maybeButton: {
    backgroundColor: '#FF9500',
  },
  // RSVP Card
  rsvpCard: {
    borderLeftColor: '#5856D6',
  },
  rsvpDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  rsvpCounts: {
    marginTop: 8,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  rsvpCountText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  rsvpResponseText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  // Deadline Card
  deadlineCard: {
    borderLeftColor: '#FF9500',
  },
  overdueCard: {
    backgroundColor: '#FFF5F5',
    borderLeftColor: '#FF3B30',
  },
  overdueText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  priorityBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  completedBadge: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
});
