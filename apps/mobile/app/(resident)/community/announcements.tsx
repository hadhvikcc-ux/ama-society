import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { useNewsStore, NewsItem, NewsCategory } from '../../../stores/newsStore';
import { useAuthStore } from '../../../stores/authStore';

export default function AnnouncementsScreen() {
  const { news, toggleLike, toggleReaction, addComment, toggleCommentLike } = useNewsStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | NewsCategory>('ALL');

  // Expanded card content IDs
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Active news item for reply/comments modal
  const [activeNewsModal, setActiveNewsModal] = useState<NewsItem | null>(null);
  const [replyInput, setReplyInput] = useState('');

  // Quick inline reply input states per card
  const [activeInlineReplyId, setActiveInlineReplyId] = useState<string | null>(null);
  const [inlineReplyText, setInlineReplyText] = useState('');

  const residentName = user?.name || 'Aditya Sharma';
  const residentUnit = `${user?.flatNumber || 'B-204'}${user?.tower ? `, ${user.tower}` : ''}`;

  // Filter news
  const filteredNews = news.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.type === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCategory;

    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      item.preview.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      item.sender.toLowerCase().includes(q) ||
      item.categoryLabel.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const toggleExpandCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendModalReply = () => {
    if (!activeNewsModal) return;
    const text = replyInput.trim();
    if (!text) {
      Alert.alert('Empty Reply', 'Please enter your comment or reply before sending.');
      return;
    }

    addComment(activeNewsModal.id, text, {
      name: residentName,
      unit: residentUnit,
    });

    setReplyInput('');
    // Refresh modal with latest news item from store
    const updated = useNewsStore.getState().getNewsById(activeNewsModal.id);
    if (updated) {
      setActiveNewsModal(updated);
    }
  };

  const handleSendInlineReply = (newsId: string) => {
    const text = inlineReplyText.trim();
    if (!text) return;

    addComment(newsId, text, {
      name: residentName,
      unit: residentUnit,
    });

    setInlineReplyText('');
    setActiveInlineReplyId(null);
  };

  const getCategoryColor = (type: NewsCategory) => {
    switch (type) {
      case 'alert':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: 'warning' as const };
      case 'megaphone':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: 'megaphone' as const };
      case 'event':
        return { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF', icon: 'sparkles' as const };
      case 'maintenance':
        return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', icon: 'construct' as const };
      default:
        return { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', icon: 'information-circle' as const };
    }
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => {
    const catStyle = getCategoryColor(item.type);
    const isExpanded = !!expandedCards[item.id];
    const isInlineReplying = activeInlineReplyId === item.id;

    return (
      <View style={[styles.card, item.isPinned && styles.pinnedCard]}>
        {/* Card Header: Category Chip, Pin Badge, Date */}
        <View style={styles.cardTopRow}>
          <View style={[styles.categoryChip, { backgroundColor: catStyle.bg, borderColor: catStyle.border }]}>
            <Ionicons name={catStyle.icon} size={13} color={catStyle.text} style={{ marginRight: 4 }} />
            <Text style={[styles.categoryChipText, { color: catStyle.text }]}>{item.categoryLabel}</Text>
          </View>

          <View style={styles.topRightRow}>
            {item.isPinned && (
              <View style={styles.pinnedBadge}>
                <Ionicons name="pin" size={11} color="#D97706" style={{ marginRight: 2 }} />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            )}
            <Text style={styles.timeBadge}>{item.time}</Text>
          </View>
        </View>

        {/* Title */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => toggleExpandCard(item.id)}>
          <Text style={styles.title}>{item.title}</Text>
        </TouchableOpacity>

        {/* Body Content */}
        <Text style={styles.bodyText} numberOfLines={isExpanded ? undefined : 3}>
          {isExpanded ? item.content : item.preview}
        </Text>

        {item.content.length > item.preview.length && (
          <TouchableOpacity onPress={() => toggleExpandCard(item.id)} style={styles.expandBtn}>
            <Text style={styles.expandBtnText}>{isExpanded ? 'Show Less' : 'Read Full Announcement...'}</Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#1D4ED8"
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        )}

        {/* Author / Sender Info */}
        <View style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            <Ionicons name="shield-checkmark" size={12} color="#1D4ED8" />
          </View>
          <Text style={styles.authorText}>
            Posted by <Text style={styles.authorHighlight}>{item.sender}</Text> • {item.senderRole}
          </Text>
        </View>

        {/* Interactive Likes, Reactions & Reply Actions Bar */}
        <View style={styles.actionBar}>
          <View style={styles.leftActions}>
            {/* Primary Like Button */}
            <TouchableOpacity
              style={[styles.actionBtn, item.isLikedByMe && styles.actionBtnLiked]}
              onPress={() => toggleLike(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.isLikedByMe ? 'heart' : 'heart-outline'}
                size={18}
                color={item.isLikedByMe ? '#E11D48' : '#64748B'}
              />
              <Text style={[styles.actionBtnText, item.isLikedByMe && styles.actionBtnTextLiked]}>
                {item.likesCount > 0 ? item.likesCount : 'Like'}
              </Text>
            </TouchableOpacity>

            {/* Reaction Emojis with Live Counts */}
            <View style={styles.reactionsList}>
              {item.reactions.map((r) => (
                <TouchableOpacity
                  key={r.emoji}
                  style={[styles.reactionPill, r.hasReacted && styles.reactionPillActive]}
                  onPress={() => toggleReaction(item.id, r.emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                  <Text style={[styles.reactionCount, r.hasReacted && styles.reactionCountActive]}>
                    {r.count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reply / Discussion Button */}
          <TouchableOpacity
            style={styles.replyTriggerBtn}
            onPress={() => {
              setActiveNewsModal(item);
              setReplyInput('');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={17} color="#1D4ED8" />
            <Text style={styles.replyTriggerText}>
              {item.comments.length > 0 ? `${item.comments.length} Replies` : 'Reply'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Existing Comments Preview if any */}
        {item.comments.length > 0 && (
          <View style={styles.commentsPreviewBox}>
            <TouchableOpacity
              style={styles.previewHeader}
              onPress={() => {
                setActiveNewsModal(item);
                setReplyInput('');
              }}
            >
              <Text style={styles.previewTitle}>
                Discussion ({item.comments.length} {item.comments.length === 1 ? 'reply' : 'replies'})
              </Text>
              <Text style={styles.viewAllText}>View & Reply &rarr;</Text>
            </TouchableOpacity>

            {/* Show latest comment */}
            {item.comments.slice(-2).map((c) => (
              <View key={c.id} style={styles.previewCommentRow}>
                <View style={styles.commentAvatarMini}>
                  <Text style={styles.commentAvatarText}>
                    {c.authorName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.commentMetaMini}>
                    <Text style={styles.commentAuthorMini}>{c.authorName}</Text>
                    {c.authorUnit && <Text style={styles.commentUnitMini}>{c.authorUnit}</Text>}
                    <Text style={styles.commentTimeMini}>• {c.timeAgo}</Text>
                  </View>
                  <Text style={styles.commentTextMini} numberOfLines={2}>
                    {c.content}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.commentLikeMini}
                  onPress={() => toggleCommentLike(item.id, c.id)}
                >
                  <Ionicons
                    name={c.isLikedByMe ? 'heart' : 'heart-outline'}
                    size={13}
                    color={c.isLikedByMe ? '#E11D48' : '#94A3B8'}
                  />
                  {c.likesCount > 0 && (
                    <Text style={[styles.commentLikeCountMini, c.isLikedByMe && { color: '#E11D48' }]}>
                      {c.likesCount}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Quick Inline Reply Toggle or Box */}
        {isInlineReplying ? (
          <View style={styles.inlineReplyBox}>
            <View style={styles.inlineHeader}>
              <Text style={styles.inlineReplyingAs}>
                Replying as <Text style={{ fontWeight: 'bold' }}>{residentName}</Text> ({residentUnit})
              </Text>
              <TouchableOpacity onPress={() => setActiveInlineReplyId(null)}>
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.inlineInputRow}>
              <TextInput
                style={styles.inlineTextInput}
                placeholder="Write your reply or question..."
                placeholderTextColor="#94A3B8"
                value={inlineReplyText}
                onChangeText={setInlineReplyText}
                multiline
              />
              <TouchableOpacity
                style={[styles.inlineSendBtn, !inlineReplyText.trim() && styles.inlineSendBtnDisabled]}
                disabled={!inlineReplyText.trim()}
                onPress={() => handleSendInlineReply(item.id)}
              >
                <Ionicons name="send" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.quickReplyBar}
            onPress={() => {
              setActiveInlineReplyId(item.id);
              setInlineReplyText('');
            }}
          >
            <Ionicons name="create-outline" size={15} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.quickReplyBarText}>Leave a reply to this announcement...</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Community News & Notices" />

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchTextInput}
          placeholder="Search news, notices, alerts, AGM..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Pills */}
      <View style={styles.categoriesBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {[
            { key: 'ALL', label: 'All News' },
            { key: 'alert', label: '🚨 Alerts' },
            { key: 'megaphone', label: '📢 Notices' },
            { key: 'event', label: '🎉 Events' },
            { key: 'maintenance', label: '🔧 Maintenance' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.catFilterChip,
                selectedCategory === cat.key && styles.catFilterChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.key as any)}
            >
              <Text
                style={[
                  styles.catFilterText,
                  selectedCategory === cat.key && styles.catFilterTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* News Feed List */}
      <FlatList
        data={filteredNews}
        keyExtractor={(item) => item.id}
        renderItem={renderNewsItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="newspaper-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Announcements Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? `No community updates matching "${searchQuery}".`
                : 'No announcements in this category right now.'}
            </Text>
          </View>
        }
      />

      {/* FULL DISCUSSION / REPLY MODAL */}
      {activeNewsModal && (
        <Modal
          visible={!!activeNewsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setActiveNewsModal(null)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.modalCategory}>{activeNewsModal.categoryLabel}</Text>
                  <Text style={styles.modalTitle} numberOfLines={2}>
                    {activeNewsModal.title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setActiveNewsModal(null)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Scrollable Discussion & Announcement Details */}
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Full Announcement Text Box */}
                <View style={styles.modalAnnouncementBox}>
                  <Text style={styles.modalFullContent}>{activeNewsModal.content}</Text>
                  <View style={styles.modalMetaRow}>
                    <Text style={styles.modalMetaText}>
                      Posted by {activeNewsModal.sender} ({activeNewsModal.senderRole}) • {activeNewsModal.date}
                    </Text>
                  </View>

                  {/* Reaction bar inside modal */}
                  <View style={styles.modalReactionBar}>
                    <TouchableOpacity
                      style={[styles.actionBtn, activeNewsModal.isLikedByMe && styles.actionBtnLiked]}
                      onPress={() => {
                        toggleLike(activeNewsModal.id);
                        const refreshed = useNewsStore.getState().getNewsById(activeNewsModal.id);
                        if (refreshed) setActiveNewsModal(refreshed);
                      }}
                    >
                      <Ionicons
                        name={activeNewsModal.isLikedByMe ? 'heart' : 'heart-outline'}
                        size={18}
                        color={activeNewsModal.isLikedByMe ? '#E11D48' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.actionBtnText,
                          activeNewsModal.isLikedByMe && styles.actionBtnTextLiked,
                        ]}
                      >
                        {activeNewsModal.likesCount} Likes
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.reactionsList}>
                      {activeNewsModal.reactions.map((r) => (
                        <TouchableOpacity
                          key={r.emoji}
                          style={[styles.reactionPill, r.hasReacted && styles.reactionPillActive]}
                          onPress={() => {
                            toggleReaction(activeNewsModal.id, r.emoji);
                            const refreshed = useNewsStore.getState().getNewsById(activeNewsModal.id);
                            if (refreshed) setActiveNewsModal(refreshed);
                          }}
                        >
                          <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                          <Text style={[styles.reactionCount, r.hasReacted && styles.reactionCountActive]}>
                            {r.count}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Section Title */}
                <View style={styles.threadSectionTitleRow}>
                  <Ionicons name="chatbubbles" size={16} color="#1D4ED8" style={{ marginRight: 6 }} />
                  <Text style={styles.threadSectionTitle}>
                    Discussion & Resident Replies ({activeNewsModal.comments.length})
                  </Text>
                </View>

                {/* Comments List */}
                {activeNewsModal.comments.length === 0 ? (
                  <View style={styles.emptyCommentsBox}>
                    <Ionicons name="chatbubble-outline" size={32} color="#CBD5E1" />
                    <Text style={styles.emptyCommentsTitle}>No replies yet</Text>
                    <Text style={styles.emptyCommentsSub}>
                      Be the first resident to ask a question or leave a reply.
                    </Text>
                  </View>
                ) : (
                  activeNewsModal.comments.map((c) => (
                    <View key={c.id} style={styles.commentCard}>
                      <View style={styles.commentCardHeader}>
                        <View style={styles.commentAvatar}>
                          <Text style={styles.commentAvatarInitials}>
                            {c.authorName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.commentAuthorName}>{c.authorName}</Text>
                            {c.authorRole && (
                              <View style={styles.adminRoleBadge}>
                                <Text style={styles.adminRoleText}>{c.authorRole}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.commentUnitText}>
                            {c.authorUnit} • {c.timeAgo}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.commentLikeBtn}
                          onPress={() => {
                            toggleCommentLike(activeNewsModal.id, c.id);
                            const refreshed = useNewsStore.getState().getNewsById(activeNewsModal.id);
                            if (refreshed) setActiveNewsModal(refreshed);
                          }}
                        >
                          <Ionicons
                            name={c.isLikedByMe ? 'heart' : 'heart-outline'}
                            size={16}
                            color={c.isLikedByMe ? '#E11D48' : '#94A3B8'}
                          />
                          {c.likesCount > 0 && (
                            <Text
                              style={[
                                styles.commentLikeCountText,
                                c.isLikedByMe && { color: '#E11D48', fontWeight: 'bold' },
                              ]}
                            >
                              {c.likesCount}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.commentBody}>{c.content}</Text>
                    </View>
                  ))
                )}
                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Reply Input Bar at Bottom */}
              <View style={styles.modalInputBar}>
                <View style={styles.modalInputTopMeta}>
                  <Ionicons name="person-circle" size={14} color="#1D4ED8" style={{ marginRight: 4 }} />
                  <Text style={styles.modalInputAuthorTag}>
                    Replying as <Text style={{ fontWeight: 'bold' }}>{residentName}</Text> ({residentUnit})
                  </Text>
                </View>

                <View style={styles.modalInputRow}>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Type your reply or question to this news..."
                    placeholderTextColor="#94A3B8"
                    value={replyInput}
                    onChangeText={setReplyInput}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    style={[
                      styles.modalSendBtn,
                      !replyInput.trim() && styles.modalSendBtnDisabled,
                    ]}
                    disabled={!replyInput.trim()}
                    onPress={handleSendModalReply}
                  >
                    <Ionicons name="send" size={17} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  categoriesBar: {
    marginBottom: 8,
  },
  catScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catFilterChipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  catFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catFilterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  pinnedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pinnedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  timeBadge: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 22,
  },
  bodyText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 8,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  expandBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  authorText: {
    fontSize: 12,
    color: '#64748B',
  },
  authorHighlight: {
    fontWeight: '600',
    color: '#1E293B',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  actionBtnLiked: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FDA4AF',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  actionBtnTextLiked: {
    color: '#E11D48',
    fontWeight: '700',
  },
  reactionsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  reactionPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  reactionEmoji: {
    fontSize: 13,
  },
  reactionCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  reactionCountActive: {
    color: '#1D4ED8',
    fontWeight: 'bold',
  },
  replyTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  replyTriggerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  commentsPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  previewCommentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  commentAvatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentAvatarText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3730A3',
  },
  commentMetaMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentAuthorMini: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  commentUnitMini: {
    fontSize: 11,
    color: '#64748B',
  },
  commentTimeMini: {
    fontSize: 10,
    color: '#94A3B8',
  },
  commentTextMini: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
    lineHeight: 16,
  },
  commentLikeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    gap: 2,
  },
  commentLikeCountMini: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  quickReplyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  quickReplyBarText: {
    fontSize: 12,
    color: '#64748B',
  },
  inlineReplyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  inlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inlineReplyingAs: {
    fontSize: 11,
    color: '#1E40AF',
  },
  inlineInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
    maxHeight: 70,
  },
  inlineSendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineSendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  modalAnnouncementBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  modalFullContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 10,
  },
  modalMetaRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginBottom: 10,
  },
  modalMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  modalReactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  threadSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  threadSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  emptyCommentsBox: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyCommentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 8,
  },
  emptyCommentsSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  commentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  commentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentAvatarInitials: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  commentAuthorName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  adminRoleBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminRoleText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#15803D',
  },
  commentUnitText: {
    fontSize: 11,
    color: '#64748B',
  },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    gap: 3,
  },
  commentLikeCountText: {
    fontSize: 11,
    color: '#64748B',
  },
  commentBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginLeft: 42,
  },
  modalInputBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  modalInputTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalInputAuthorTag: {
    fontSize: 11,
    color: '#475569',
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTextInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    maxHeight: 80,
  },
  modalSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
