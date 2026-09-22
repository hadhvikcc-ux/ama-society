import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { usePollStore, SocietyPoll } from '../../stores/pollStore';
import { BentoTile } from '../ui/BentoTile';

interface PollVoteCardProps {
  pollId?: string;
  userId?: string;
}

export const PollVoteCard: React.FC<PollVoteCardProps> = ({ pollId, userId = 'u-1' }) => {
  const router = useRouter();
  const { polls, castVote } = usePollStore();

  const activePoll = pollId
    ? polls.find((p) => p.id === pollId)
    : polls.find((p) => p.status === 'ACTIVE') || polls[0];

  if (!activePoll) return null;

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style).catch(() => {});
      } catch (e) {}
    }
  };

  const handleVote = (optionId: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    castVote(activePoll.id, optionId, userId);
  };

  const hasVoted = !!activePoll.userVotedOptionId;
  const totalVotes = Math.max(1, activePoll.totalVotes);

  return (
    <BentoTile color="rose" style={styles.tile}>
      <View style={styles.tileHeader}>
        <View style={styles.amenityRow}>
          <View style={styles.iconCircle}>
            <Text style={{ fontSize: 16 }}>🗳️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pollTagline}>
              Community Poll • {activePoll.category}
            </Text>
            <Text style={styles.pollTitle} numberOfLines={2}>
              {activePoll.title}
            </Text>
          </View>
        </View>

        <View style={styles.votesBadge}>
          <Text style={styles.votesBadgeText}>{activePoll.totalVotes} votes</Text>
        </View>
      </View>

      {/* Interactive Poll Options */}
      <View style={styles.optionsContainer}>
        {activePoll.options.map((opt) => {
          const isSelected = activePoll.userVotedOptionId === opt.id;
          const percent = Math.round((opt.votes / totalVotes) * 100);

          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.optionBtn, isSelected && styles.optionBtnActive]}
              onPress={() => handleVote(opt.id)}
              activeOpacity={0.8}
            >
              {hasVoted && (
                <View
                  style={[
                    styles.percentFill,
                    { width: `${percent}%`, backgroundColor: isSelected ? '#FFE4E6' : '#F1F5F9' },
                  ]}
                />
              )}

              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  {opt.emoji && <Text style={styles.optionEmoji}>{opt.emoji}</Text>}
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && { fontWeight: '800', color: '#881337' },
                    ]}
                    numberOfLines={1}
                  >
                    {opt.text}
                  </Text>
                </View>

                {hasVoted && (
                  <Text
                    style={[
                      styles.percentText,
                      isSelected && { fontWeight: '900', color: '#881337' },
                    ]}
                  >
                    {percent}%
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.tileBottomAction}>
        <Text style={styles.votersCountText}>
          {hasVoted ? '✓ Your vote is recorded' : 'Tap an option to cast your vote'}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(resident)/community/announcements')}
          accessibilityRole="button"
        >
          <Text style={styles.actionArrowText}>Discussion Channel &rarr;</Text>
        </TouchableOpacity>
      </View>
    </BentoTile>
  );
};

const styles = StyleSheet.create({
  tile: {
    marginVertical: 6,
    padding: 18,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pollTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#881337',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pollTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
    lineHeight: 20,
  },
  votesBadge: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  votesBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#881337',
  },
  optionsContainer: {
    gap: 8,
    marginVertical: 6,
  },
  optionBtn: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 46,
    justifyContent: 'center',
  },
  optionBtnActive: {
    borderColor: '#BE123C',
    backgroundColor: '#FFF1F2',
  },
  percentFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 10,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  optionEmoji: {
    fontSize: 16,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 8,
  },
  tileBottomAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FFE4E6',
  },
  votersCountText: {
    fontSize: 12,
    color: '#881337',
    fontWeight: '600',
  },
  actionArrowText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#881337',
  },
});
