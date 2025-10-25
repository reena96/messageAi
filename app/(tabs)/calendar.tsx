import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/authStore';
import { CalendarEvent } from '@/lib/ai/calendar';

interface CalendarEventWithContext {
  event: CalendarEvent;
  chatId: string;
  messageId: string;
  messageText: string;
  timestamp: Date;
}

export default function CalendarScreen() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<CalendarEventWithContext[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    console.log('[Calendar] 📅 Loading calendar events for user:', user.uid);
    const unsubscribes: Unsubscribe[] = [];

    // First, get all chats for this user
    const chatsRef = collection(firestore, 'chats');
    const chatsQuery = query(
      chatsRef,
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (chatsSnapshot) => {
      console.log('[Calendar] 📊 Found', chatsSnapshot.docs.length, 'chats');

      // Unsubscribe from previous message listeners
      unsubscribes.forEach(unsub => unsub());
      unsubscribes.length = 0;

      const allEvents: CalendarEventWithContext[] = [];

      if (chatsSnapshot.empty) {
        setEvents([]);
        setLoading(false);
        return;
      }

      let processedChats = 0;
      const totalChats = chatsSnapshot.docs.length;

      // For each chat, subscribe to messages with AI extraction
      chatsSnapshot.docs.forEach((chatDoc) => {
        const chatId = chatDoc.id;
        const messagesRef = collection(firestore, 'chats', chatId, 'messages');

        // Query messages that have calendar events
        const messagesQuery = query(
          messagesRef,
          where('aiExtraction.calendarEvents', '!=', null)
        );

        const unsubscribeMessages = onSnapshot(messagesQuery, (messagesSnapshot) => {
          // Extract all calendar events from this chat's messages
          messagesSnapshot.docs.forEach((messageDoc) => {
            const data = messageDoc.data();
            const calendarEvents = data.aiExtraction?.calendarEvents || [];

            calendarEvents.forEach((event: CalendarEvent) => {
              allEvents.push({
                event,
                chatId,
                messageId: messageDoc.id,
                messageText: data.text || '',
                timestamp: data.timestamp?.toDate() || new Date(),
              });
            });
          });

          processedChats++;

          // Once all chats have been processed, sort and set events
          if (processedChats === totalChats) {
            // Sort by date (earliest first) - parse in LOCAL timezone
            allEvents.sort((a, b) => {
              const [yearA, monthA, dayA] = a.event.date.split('-').map(Number);
              const [yearB, monthB, dayB] = b.event.date.split('-').map(Number);
              const dateA = new Date(yearA, monthA - 1, dayA);
              const dateB = new Date(yearB, monthB - 1, dayB);
              return dateA.getTime() - dateB.getTime();
            });

            console.log('[Calendar] ✅ Loaded', allEvents.length, 'calendar events');
            setEvents(allEvents);
            setLoading(false);
          }
        });

        unsubscribes.push(unsubscribeMessages);
      });
    });

    return () => {
      unsubscribeChats();
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user?.uid]);

  const navigateToMessage = (chatId: string, messageId: string) => {
    console.log('[Calendar] 📍 Navigating to chat:', chatId, 'message:', messageId);
    router.push(`/chat/${chatId}`);
    // TODO: In future, scroll to specific message
  };

  const formatDate = (dateString: string) => {
    // Parse date in LOCAL timezone (not UTC)
    // ISO format: "2025-10-28" should be Oct 28 in local time, not UTC
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0); // Normalize to midnight

    if (dateOnly.getTime() === today.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const renderEvent = ({ item }: { item: CalendarEventWithContext }) => {
    const { event, messageText } = item;
    const isLowConfidence = event.confidence < 0.8;

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigateToMessage(item.chatId, item.messageId)}
        activeOpacity={0.7}
      >
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{event.event}</Text>
          {isLowConfidence && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceBadgeText}>?</Text>
            </View>
          )}
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.eventDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.eventDetailText}>{formatDate(event.date)}</Text>
          </View>

          {event.time && (
            <View style={styles.eventDetailRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.eventDetailText}>{event.time}</Text>
            </View>
          )}

          {event.location && (
            <View style={styles.eventDetailRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.eventDetailText}>{event.location}</Text>
            </View>
          )}
        </View>

        <Text style={styles.messagePreview} numberOfLines={2}>
          "{messageText}"
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Calendar Events</Text>
      <Text style={styles.emptyText}>
        Calendar events will appear here when they're mentioned in your messages
      </Text>
      <Text style={styles.emptyExample}>
        Try: "Soccer practice tomorrow at 4pm"
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading calendar events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <Text style={styles.headerSubtitle}>
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </Text>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item, index) => `${item.chatId}-${item.messageId}-${index}`}
        contentContainerStyle={events.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: '#FFA500',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  confidenceBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventDetails: {
    gap: 8,
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#666',
  },
  messagePreview: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyExample: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
