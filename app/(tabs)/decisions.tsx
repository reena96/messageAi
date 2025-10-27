import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useNavigation, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WHATSAPP_PALETTE, HEADER_TITLE_STYLE, createThemedToggleStyles } from '@/styles/theme';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/authStore';
import { Decision } from '@/lib/ai/decisions';

// Debug flag for decisions logs
const DECISIONS_DEBUG = false;

interface DecisionWithContext {
  decision: Decision;
  chatId: string;
  messageId: string;
  messageText: string;
  timestamp: Date;
}

type FilterType = 'all' | 'pending' | 'resolved';

export default function DecisionsScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ filter?: string; fromChat?: string }>();
  const [decisions, setDecisions] = useState<DecisionWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [canGoBack, setCanGoBack] = useState(false);

  // Check if we can go back (navigated from another screen)
  useEffect(() => {
    const navState = navigation.getState();
    setCanGoBack(navState ? navState.routes.length > 1 : false);
  }, [navigation]);

  // Set initial filter from navigation params
  useEffect(() => {
    if (params.filter && (params.filter === 'pending' || params.filter === 'resolved' || params.filter === 'all')) {
      setFilter(params.filter as FilterType);
    }
  }, [params.filter]);

  // Custom back handler to return to source chat
  const handleBack = () => {
    if (params.fromChat) {
      // Navigate back to the specific chat
      router.push(`/chat/${params.fromChat}`);
    } else {
      // Default back behavior
      router.back();
    }
  };

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    if (DECISIONS_DEBUG) console.log('[Decisions] 📝 Loading decisions for user:', user.uid);
    const unsubscribes: Unsubscribe[] = [];

    // First, get all chats for this user
    const chatsRef = collection(firestore, 'chats');
    const chatsQuery = query(
      chatsRef,
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (chatsSnapshot) => {
      if (DECISIONS_DEBUG) console.log('[Decisions] 📊 Found', chatsSnapshot.docs.length, 'chats');

      // Unsubscribe from previous message listeners
      unsubscribes.forEach(unsub => unsub());
      unsubscribes.length = 0;

      const allDecisions: DecisionWithContext[] = [];

      if (chatsSnapshot.empty) {
        setDecisions([]);
        setLoading(false);
        return;
      }

      let processedChats = 0;
      const totalChats = chatsSnapshot.docs.length;

      // For each chat, subscribe to messages with AI extraction
      chatsSnapshot.docs.forEach((chatDoc) => {
        const chatId = chatDoc.id;
        const messagesRef = collection(firestore, 'chats', chatId, 'messages');

        // Query messages that have decisions
        const messagesQuery = query(
          messagesRef,
          where('aiExtraction.decisions', '!=', null)
        );

        const unsubscribeMessages = onSnapshot(messagesQuery, (messagesSnapshot) => {
          // Extract all decisions from this chat's messages
          messagesSnapshot.docs.forEach((messageDoc) => {
            const data = messageDoc.data();
            const decisionsData = data.aiExtraction?.decisions || [];

            decisionsData.forEach((decision: Decision) => {
              allDecisions.push({
                decision,
                chatId,
                messageId: messageDoc.id,
                messageText: data.text || '',
                timestamp: data.timestamp?.toDate() || new Date(),
              });
            });
          });

          processedChats++;

          // Once all chats have been processed, sort and set decisions
          if (processedChats === totalChats) {
            // Sort: pending first, then by timestamp descending (newest first)
            allDecisions.sort((a, b) => {
              // Pending decisions first
              if (a.decision.status === 'pending' && b.decision.status === 'resolved') {
                return -1;
              }
              if (a.decision.status === 'resolved' && b.decision.status === 'pending') {
                return 1;
              }
              // Within same status, sort by timestamp (newest first)
              return b.timestamp.getTime() - a.timestamp.getTime();
            });

            if (DECISIONS_DEBUG) console.log('[Decisions] ✅ Loaded', allDecisions.length, 'decisions');
            setDecisions(allDecisions);
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
    if (DECISIONS_DEBUG) console.log('[Decisions] 📍 Navigating to chat:', chatId, 'message:', messageId);
    router.push(`/chat/${chatId}`);
    // TODO: In future, scroll to specific message using messageId
  };

  const getFilteredDecisions = () => {
    if (filter === 'all') return decisions;
    return decisions.filter(d => d.decision.status === filter);
  };

  const renderDecision = ({ item }: { item: DecisionWithContext }) => {
    const isResolved = item.decision.status === 'resolved';
    const icon = isResolved ? 'checkmark-circle' : 'help-circle';
    const iconColor = isResolved ? '#34C759' : '#FF9500';

    return (
      <TouchableOpacity
        style={styles.decisionCard}
        onPress={() => navigateToMessage(item.chatId, item.messageId)}
        activeOpacity={0.7}
      >
        <View style={styles.decisionHeader}>
          <Ionicons name={icon} size={22} color={iconColor} />
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, isResolved ? styles.resolvedText : styles.pendingText]}>
              {item.decision.status.toUpperCase()}
            </Text>
          </View>
          {item.decision.confidence < 0.8 && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {Math.round(item.decision.confidence * 100)}%
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.decisionText}>{item.decision.decision}</Text>

        {item.decision.context && (
          <Text style={styles.contextText}>{item.decision.context}</Text>
        )}

        {item.decision.participants && item.decision.participants.length > 0 && (
          <View style={styles.participantsRow}>
            <Ionicons name="people" size={14} color="#666" />
            <Text style={styles.participantsText}>
              {item.decision.participants.join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <Text style={styles.messagePreview}>
            {item.messageText.length > 50
              ? item.messageText.substring(0, 50) + '...'
              : item.messageText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="checkmark-done-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyStateTitle}>No Decisions Yet</Text>
      <Text style={styles.emptyStateText}>
        {filter === 'pending'
          ? 'No pending decisions. All discussions are resolved!'
          : filter === 'resolved'
          ? 'No resolved decisions yet.'
          : 'Decisions will appear here when detected in your messages.'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={WHATSAPP_PALETTE.primary} />
        <Text style={styles.loadingText}>Loading decisions...</Text>
      </View>
    );
  }

  const filteredDecisions = getFilteredDecisions();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: canGoBack,
          headerTitle: 'Decisions',
          headerLeft: canGoBack ? () => (
            <TouchableOpacity onPress={handleBack} style={{ paddingLeft: 8 }}>
              <Ionicons name="chevron-back" size={28} color={WHATSAPP_PALETTE.primary} />
            </TouchableOpacity>
          ) : undefined,
          headerTintColor: WHATSAPP_PALETTE.primary,
          headerTitleStyle: HEADER_TITLE_STYLE,
        }}
      />

      {!canGoBack && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Decisions</Text>
          <Text style={styles.headerSubtitle}>
            {decisions.length} {decisions.length === 1 ? 'decision' : 'decisions'}
          </Text>
        </View>
      )}

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              styles.filterText_all,
              filter === 'all' && styles.filterButtonTextActive,
            ]}
          >
            All ({decisions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text
            style={[
              styles.filterButtonText,
              styles.filterText_pending,
              filter === 'pending' && styles.filterButtonTextActive,
            ]}
          >
            Pending ({decisions.filter(d => d.decision.status === 'pending').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'resolved' && styles.filterButtonActive]}
          onPress={() => setFilter('resolved')}
        >
          <Text
            style={[
              styles.filterButtonText,
              styles.filterText_resolved,
              filter === 'resolved' && styles.filterButtonTextActive,
            ]}
          >
            Resolved ({decisions.filter(d => d.decision.status === 'resolved').length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredDecisions}
        renderItem={renderDecision}
        keyExtractor={(item, index) => `${item.chatId}-${item.messageId}-${index}`}
        contentContainerStyle={filteredDecisions.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const filterToggle = createThemedToggleStyles({
  background: WHATSAPP_PALETTE.tabBackground,
  border: WHATSAPP_PALETTE.cardBorder,
  backgroundActive: WHATSAPP_PALETTE.toggleActive,
  borderActive: WHATSAPP_PALETTE.cardBorder,
  textActive: undefined,
});

const FILTER_TEXT_COLORS: Record<FilterType, string> = {
  all: '#0A84FF',
  pending: '#FF9500',
  resolved: '#34C759',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: HEADER_TITLE_STYLE.color,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    ...filterToggle.base,
  },
  filterButtonActive: filterToggle.active,
  filterButtonText: {
    ...filterToggle.text,
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    fontWeight: '700',
  },
  filterText_all: {
    color: FILTER_TEXT_COLORS.all,
  },
  filterText_pending: {
    color: FILTER_TEXT_COLORS.pending,
  },
  filterText_resolved: {
    color: FILTER_TEXT_COLORS.resolved,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  decisionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  decisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resolvedText: {
    color: '#34C759',
  },
  pendingText: {
    color: '#FF9500',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#FFE5CC',
    marginLeft: 'auto',
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9500',
  },
  decisionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    lineHeight: 22,
  },
  contextText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  participantsText: {
    fontSize: 13,
    color: '#666',
  },
  metaRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  messagePreview: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
});
