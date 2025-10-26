import { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SummaryPresetId = 'recent25' | 'today' | 'week' | 'twoWeeks' | 'month';
type SummaryStatus = 'idle' | 'loading' | 'ready' | 'error';

interface SummaryOption {
  id: SummaryPresetId;
  label: string;
  status: SummaryStatus;
  summary: string | null;
  error?: string;
  lastUpdated: number | null;
  messageCount: number;
}

interface AISummaryCardProps {
  collapsed: boolean;
  selectedPreset: SummaryPresetId;
  options: SummaryOption[];
  onToggle: () => void;
  onSelectPreset: (preset: SummaryPresetId) => void;
  onRetry: (preset: SummaryPresetId) => void;
}

function AISummaryCardComponent({
  collapsed,
  onToggle,
  selectedPreset,
  options,
  onSelectPreset,
  onRetry,
}: AISummaryCardProps) {
  const selectedOption =
    options.find((option) => option.id === selectedPreset) ?? options[0];
  const selectedStatus = selectedOption?.status ?? 'idle';
  const isLoading = selectedStatus === 'loading';
  const isError = selectedStatus === 'error';

  if (!selectedOption) {
    return null;
  }

  if (collapsed) {
    return (
      <TouchableOpacity
        style={styles.collapsedCard}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel="Expand AI summary"
        activeOpacity={0.8}
      >
        <Ionicons name="sparkles" size={16} color="#0A84FF" style={styles.iconLeading} />
        <Text style={styles.collapsedText}>AI summaries available</Text>
        <Ionicons name="chevron-up" size={14} color="#0A84FF" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={18} color="#0A84FF" />
          <Text style={styles.title}>AI summary</Text>
        </View>
        <TouchableOpacity
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel="Collapse AI summary"
          style={styles.toggleButton}
        >
          <Ionicons name="chevron-down" size={16} color="#0A84FF" />
        </TouchableOpacity>
      </View>

      <View style={styles.segmentRow}>
        {options.map((option) => {
          const isSelected = option.id === selectedPreset;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.segmentButton,
                isSelected && styles.segmentButtonSelected,
              ]}
              onPress={() => onSelectPreset(option.id)}
              accessibilityRole="button"
              accessibilityLabel={`Show ${option.label} summary`}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  isSelected && styles.segmentLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.body}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#0A84FF" />
            <Text style={styles.loadingText}>Summarizing…</Text>
          </View>
        ) : isError ? (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>
              {selectedOption?.error ?? "Couldn't load this summary."}
            </Text>
            <TouchableOpacity
              onPress={() => onRetry(selectedPreset)}
              style={styles.retryButton}
              accessibilityRole="button"
              accessibilityLabel="Retry loading summary"
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : selectedStatus === 'ready' ? (
          <Text style={styles.summaryText}>
            {selectedOption?.summary ?? 'No significant updates.'}
          </Text>
        ) : (
          <Text style={styles.placeholderText}>
            {selectedOption?.messageCount === 0
              ? 'Not enough messages in this range yet.'
              : 'Preparing summary…'}
          </Text>
        )}

        {selectedOption?.lastUpdated && (
          <Text style={styles.timestampText}>
            Updated{' '}
            {new Date(selectedOption.lastUpdated).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>
    </View>
  );
}

export const AISummaryCard = memo(AISummaryCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F8FF',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D6E4FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#0A84FF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  toggleButton: {
    padding: 4,
  },
  body: {
    marginTop: 4,
  },
  summaryText: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 21,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6E6E73',
    marginTop: 6,
  },
  timestampText: {
    fontSize: 12,
    color: '#6E6E73',
    marginTop: 10,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#0A84FF',
    fontSize: 14,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  retryButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#0A84FF12',
  },
  retryText: {
    color: '#0A84FF',
    fontWeight: '600',
    fontSize: 13,
  },
  collapsedCard: {
    backgroundColor: '#F5F8FF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D6E4FF',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  collapsedText: {
    color: '#0A84FF',
    fontWeight: '600',
    fontSize: 13,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  segmentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0A84FF',
    backgroundColor: '#FFFFFF',
  },
  segmentButtonSelected: {
    backgroundColor: '#0A84FF',
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A84FF',
  },
  segmentLabelSelected: {
    color: '#FFFFFF',
  },
  iconLeading: {
    marginRight: 6,
  },
});
