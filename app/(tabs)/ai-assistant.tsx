import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { WHATSAPP_PALETTE, HEADER_TITLE_STYLE } from '@/styles/theme';
import {
  analyzeSchedule,
  submitProactiveFeedback,
  ProactiveInsight,
  ProactiveAssistantResponse,
  getInsightIcon,
  getInsightColor,
  formatConfidence,
  getConfidenceBadgeColor,
} from '@/lib/ai/proactive';

export default function AIAssistantScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [response, setResponse] = useState<ProactiveAssistantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<Record<string, boolean>>({});

  /**
   * Analyze schedule and get insights
   */
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[AI Assistant] 🔍 Starting schedule analysis...');
      const result = await analyzeSchedule();
      setResponse(result);
      console.log('[AI Assistant] ✅ Analysis complete:', {
        insightCount: result.insights.length,
        summary: result.summary.substring(0, 100),
      });
    } catch (err) {
      console.error('[AI Assistant] ❌ Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze schedule');
      Alert.alert('Analysis Failed', err instanceof Error ? err.message : 'Failed to analyze schedule');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pull to refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await handleAnalyze();
    setRefreshing(false);
  };

  /**
   * Submit feedback on an insight
   */
  const handleFeedback = async (insightId: string, vote: 'up' | 'down') => {
    setFeedbackSubmitting((prev) => ({ ...prev, [insightId]: true }));

    try {
      await submitProactiveFeedback(insightId, vote);
      Alert.alert(
        'Thank You!',
        vote === 'up'
          ? 'Glad this insight was helpful! We\'ll keep improving.'
          : 'Thanks for the feedback. We\'ll work on improving our suggestions.'
      );
    } catch (err) {
      console.error('[AI Assistant] ❌ Feedback failed:', err);
      Alert.alert('Feedback Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setFeedbackSubmitting((prev) => ({ ...prev, [insightId]: false }));
    }
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bulb-outline" size={80} color={WHATSAPP_PALETTE.textSecondary} />
      <Text style={styles.emptyTitle}>Proactive AI Assistant</Text>
      <Text style={styles.emptyDescription}>
        Get smart insights about your family schedule. I'll analyze your calendar, deadlines, and decisions to find
        conflicts and suggest improvements.
      </Text>
      <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="analytics" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.analyzeButtonText}>Analyze Schedule</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  /**
   * Render insight card
   */
  const renderInsightCard = (insight: ProactiveInsight) => {
    const iconName = getInsightIcon(insight.type);
    const color = getInsightColor(insight.type);
    const badgeColor = getConfidenceBadgeColor(insight.confidence);
    const isSubmitting = feedbackSubmitting[insight.id] || false;

    return (
      <View key={insight.id} style={styles.insightCard}>
        {/* Header */}
        <View style={styles.insightHeader}>
          <View style={[styles.insightIconContainer, { backgroundColor: color + '15' }]}>
            <Ionicons name={iconName as any} size={24} color={color} />
          </View>
          <View style={styles.insightHeaderText}>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <View style={[styles.confidenceBadge, { backgroundColor: badgeColor + '20' }]}>
              <Text style={[styles.confidenceText, { color: badgeColor }]}>
                {formatConfidence(insight.confidence)}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.insightDescription}>{insight.description}</Text>

        {/* Reasoning */}
        <View style={styles.reasoningContainer}>
          <Ionicons name="information-circle-outline" size={16} color={WHATSAPP_PALETTE.textSecondary} />
          <Text style={styles.reasoningText}>{insight.reasoning}</Text>
        </View>

        {/* Alternatives */}
        {insight.alternatives && insight.alternatives.length > 0 && (
          <View style={styles.alternativesContainer}>
            <Text style={styles.alternativesTitle}>Suggestions:</Text>
            {insight.alternatives.map((alt, idx) => (
              <View key={idx} style={styles.alternativeItem}>
                <Ionicons name="arrow-forward" size={14} color={WHATSAPP_PALETTE.primary} />
                <Text style={styles.alternativeText}>{alt}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Feedback */}
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackLabel}>Was this helpful?</Text>
          <View style={styles.feedbackButtons}>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => handleFeedback(insight.id, 'up')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={WHATSAPP_PALETTE.primary} />
              ) : (
                <Ionicons name="thumbs-up-outline" size={20} color={WHATSAPP_PALETTE.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => handleFeedback(insight.id, 'down')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={WHATSAPP_PALETTE.textSecondary} />
              ) : (
                <Ionicons name="thumbs-down-outline" size={20} color={WHATSAPP_PALETTE.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Render insights list
   */
  const renderInsights = () => {
    if (!response) return null;

    return (
      <View style={styles.insightsContainer}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <Ionicons name="sparkles" size={24} color={WHATSAPP_PALETTE.primary} style={styles.summaryIcon} />
          <Text style={styles.summaryText}>{response.summary}</Text>
        </View>

        {/* Insights */}
        {response.insights.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Insights ({response.insights.length})</Text>
            {response.insights.map(renderInsightCard)}
          </>
        ) : (
          <View style={styles.noInsightsContainer}>
            <Ionicons name="checkmark-circle" size={60} color={WHATSAPP_PALETTE.success} />
            <Text style={styles.noInsightsText}>All clear! No conflicts or urgent items detected.</Text>
          </View>
        )}

        {/* Re-analyze button */}
        <TouchableOpacity style={styles.reanalyzeButton} onPress={handleAnalyze} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={WHATSAPP_PALETTE.primary} />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color={WHATSAPP_PALETTE.primary} style={styles.buttonIcon} />
              <Text style={styles.reanalyzeButtonText}>Re-analyze Schedule</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'AI Assistant',
          headerStyle: {
            backgroundColor: WHATSAPP_PALETTE.background,
          },
          headerTitleStyle: HEADER_TITLE_STYLE,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {!response && !loading && renderEmptyState()}
        {loading && !response && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={WHATSAPP_PALETTE.primary} />
            <Text style={styles.loadingText}>Analyzing your schedule...</Text>
          </View>
        )}
        {response && renderInsights()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHATSAPP_PALETTE.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: WHATSAPP_PALETTE.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: WHATSAPP_PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHATSAPP_PALETTE.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    justifyContent: 'center',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: WHATSAPP_PALETTE.textSecondary,
  },
  // Insights
  insightsContainer: {
    flex: 1,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: WHATSAPP_PALETTE.primaryMuted,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  summaryIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  summaryText: {
    flex: 1,
    fontSize: 16,
    color: WHATSAPP_PALETTE.text,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: WHATSAPP_PALETTE.text,
    marginBottom: 12,
  },
  // Insight card
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightHeaderText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: WHATSAPP_PALETTE.text,
    marginBottom: 6,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  insightDescription: {
    fontSize: 15,
    color: WHATSAPP_PALETTE.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  reasoningContainer: {
    flexDirection: 'row',
    backgroundColor: WHATSAPP_PALETTE.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  reasoningText: {
    flex: 1,
    fontSize: 14,
    color: WHATSAPP_PALETTE.textSecondary,
    lineHeight: 20,
    marginLeft: 8,
  },
  alternativesContainer: {
    marginBottom: 12,
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: WHATSAPP_PALETTE.text,
    marginBottom: 8,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 8,
  },
  alternativeText: {
    flex: 1,
    fontSize: 14,
    color: WHATSAPP_PALETTE.textSecondary,
    lineHeight: 20,
    marginLeft: 8,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: WHATSAPP_PALETTE.divider,
  },
  feedbackLabel: {
    fontSize: 14,
    color: WHATSAPP_PALETTE.textSecondary,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  feedbackButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: WHATSAPP_PALETTE.background,
  },
  // No insights
  noInsightsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noInsightsText: {
    fontSize: 16,
    color: WHATSAPP_PALETTE.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  // Re-analyze button
  reanalyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: WHATSAPP_PALETTE.primary,
  },
  reanalyzeButtonText: {
    color: WHATSAPP_PALETTE.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
