import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NewsCategory = 'alert' | 'megaphone' | 'info' | 'maintenance' | 'event';

export interface NewsComment {
  id: string;
  authorName: string;
  authorUnit: string;
  authorRole?: string;
  content: string;
  createdAt: string;
  timeAgo: string;
  likesCount: number;
  isLikedByMe: boolean;
}

export interface NewsReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export interface NewsItem {
  id: string;
  type: NewsCategory;
  categoryLabel: string;
  title: string;
  preview: string;
  content: string;
  sender: string;
  senderRole: string;
  time: string;
  date: string;
  isPinned: boolean;
  likesCount: number;
  isLikedByMe: boolean;
  reactions: NewsReaction[];
  comments: NewsComment[];
}

interface NewsState {
  news: NewsItem[];
  toggleLike: (newsId: string) => void;
  toggleReaction: (newsId: string, emoji: string) => void;
  addComment: (newsId: string, content: string, author: { name: string; unit: string }) => void;
  toggleCommentLike: (newsId: string, commentId: string) => void;
  getNewsById: (id: string) => NewsItem | undefined;
}

const initialNews: NewsItem[] = [
  {
    id: '1',
    type: 'alert',
    categoryLabel: 'Urgent Alert',
    title: 'Water Supply Disruption & Tank Maintenance',
    preview: 'Water supply will be cut off from 2PM to 4PM today for scheduled pipeline repairs and tank cleaning.',
    content:
      'Dear Residents, Please be informed that overhead tank cleaning and main riser pipeline valve replacement is scheduled for today from 2:00 PM to 4:00 PM. Water supply across all towers (A, B, C) will be temporarily interrupted during this 2-hour window. Please store sufficient water for your afternoon requirements. Normal supply will resume promptly at 4:00 PM.',
    sender: 'Estate Management',
    senderRole: 'Admin Office',
    time: '1 hr ago',
    date: '16 Sep 2026',
    isPinned: true,
    likesCount: 14,
    isLikedByMe: false,
    reactions: [
      { emoji: '👍', count: 12, hasReacted: false },
      { emoji: '❤️', count: 5, hasReacted: false },
      { emoji: '😮', count: 3, hasReacted: false },
    ],
    comments: [
      {
        id: 'c1-1',
        authorName: 'Ramesh K.',
        authorUnit: 'A-102',
        content: 'Thanks for the advance notice! Will ensure storage buckets are filled.',
        createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
        timeAgo: '45m ago',
        likesCount: 4,
        isLikedByMe: false,
      },
      {
        id: 'c1-2',
        authorName: 'Dr. Sunita Rao',
        authorUnit: 'B-501',
        content: 'Will the RO drinking water dispenser at the Clubhouse remain operational?',
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
        timeAgo: '30m ago',
        likesCount: 2,
        isLikedByMe: false,
      },
      {
        id: 'c1-3',
        authorName: 'Estate Management',
        authorUnit: 'Office',
        authorRole: 'Admin',
        content: 'Yes, Dr. Sunita, Clubhouse reserve water tanks are separate and will function normally.',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        timeAgo: '15m ago',
        likesCount: 6,
        isLikedByMe: false,
      },
    ],
  },
  {
    id: '2',
    type: 'megaphone',
    categoryLabel: 'Society Notice',
    title: 'Annual General Body Meeting (AGM 2026)',
    preview: 'The AGM is scheduled for this Sunday at 10 AM in the Clubhouse. All flat owners are requested to attend.',
    content:
      'Notice is hereby given that the 2026 Annual General Meeting of AMA Cooperative Housing Society will be held on Sunday, 20th September at 10:00 AM in the Grand Clubhouse. Key agenda points include: audited annual accounts, solar rooftop installation proposal, security gate automation review, and annual sinking fund allocation. Refreshments will be served after the meeting.',
    sender: 'Managing Committee',
    senderRole: 'Hon. Secretary',
    time: 'Yesterday',
    date: '15 Sep 2026',
    isPinned: true,
    likesCount: 28,
    isLikedByMe: true,
    reactions: [
      { emoji: '👍', count: 20, hasReacted: true },
      { emoji: '👏', count: 8, hasReacted: false },
      { emoji: '❤️', count: 6, hasReacted: false },
    ],
    comments: [
      {
        id: 'c2-1',
        authorName: 'Kavita Menon',
        authorUnit: 'C-304',
        content: 'Can we attend via video conference if we are out of station?',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        timeAgo: '1d ago',
        likesCount: 5,
        isLikedByMe: false,
      },
      {
        id: 'c2-2',
        authorName: 'Managing Committee',
        authorUnit: 'Office',
        authorRole: 'Admin',
        content: 'Yes, a Google Meet link will be shared on Sunday morning for remote owners.',
        createdAt: new Date(Date.now() - 80000000).toISOString(),
        timeAgo: '1d ago',
        likesCount: 7,
        isLikedByMe: false,
      },
    ],
  },
  {
    id: '3',
    type: 'event',
    categoryLabel: 'Cultural Event',
    title: 'Grand Diwali Celebration & Mela Ideas',
    preview: 'We are planning a grand community Diwali celebration with cultural performances and food stalls. Share your ideas!',
    content:
      'The Cultural Committee cordially invites all families to contribute ideas and participate in organizing our upcoming Diwali Mahotsav! Highlights planned: Rangoli competition for kids and adults, food and craft stalls by society home-chefs, musical performances, and eco-friendly laser show. Please reply with ideas or volunteer slots!',
    sender: 'Cultural Committee',
    senderRole: 'Event Lead',
    time: '2 days ago',
    date: '14 Sep 2026',
    isPinned: false,
    likesCount: 42,
    isLikedByMe: false,
    reactions: [
      { emoji: '❤️', count: 26, hasReacted: false },
      { emoji: '👏', count: 18, hasReacted: false },
      { emoji: '🎉', count: 14, hasReacted: false },
    ],
    comments: [
      {
        id: 'c3-1',
        authorName: 'Ananya Deshmukh',
        authorUnit: 'B-301',
        content: 'I would love to set up a homemade sweets stall! Who should I contact for stall registration?',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        timeAgo: '2d ago',
        likesCount: 8,
        isLikedByMe: false,
      },
      {
        id: 'c3-2',
        authorName: 'Rajesh Nair',
        authorUnit: 'A-702',
        content: 'Happy to sponsor the sound system and stage lighting for the kids dance show.',
        createdAt: new Date(Date.now() - 120000000).toISOString(),
        timeAgo: '1d ago',
        likesCount: 12,
        isLikedByMe: false,
      },
    ],
  },
  {
    id: '4',
    type: 'maintenance',
    categoryLabel: 'Maintenance',
    title: 'Tower Lift Maintenance & Sensor Calibration',
    preview: 'Otis technicians will be servicing Passenger Lift A in Tower B this Friday between 10 AM and 1 PM.',
    content:
      'Preventative quarterly servicing and infrared door sensor modernization for Passenger Lift A (Tower B) will be performed this Friday from 10:00 AM to 1:00 PM. Service Lift B will remain fully operational during this window. We apologize for the temporary inconvenience and appreciate your patience.',
    sender: 'Estate Management',
    senderRole: 'Maintenance Supervisor',
    time: '3 days ago',
    date: '13 Sep 2026',
    isPinned: false,
    likesCount: 11,
    isLikedByMe: false,
    reactions: [
      { emoji: '👍', count: 9, hasReacted: false },
      { emoji: '🔧', count: 4, hasReacted: false },
    ],
    comments: [
      {
        id: 'c4-1',
        authorName: 'Vikram Malhotra',
        authorUnit: 'B-204',
        content: 'Thank you, Lift A was jerking slightly near the 3rd floor. Please have them inspect the brake pads as well.',
        createdAt: new Date(Date.now() - 250000000).toISOString(),
        timeAgo: '2d ago',
        likesCount: 5,
        isLikedByMe: false,
      },
      {
        id: 'c4-2',
        authorName: 'Maintenance Supervisor',
        authorUnit: 'Office',
        authorRole: 'Admin',
        content: 'Noted Vikram ji, brake pad and guide shoe clearance will be verified and calibrated.',
        createdAt: new Date(Date.now() - 200000000).toISOString(),
        timeAgo: '2d ago',
        likesCount: 3,
        isLikedByMe: false,
      },
    ],
  },
];

export const useNewsStore = create<NewsState>()(
  persist(
    (set, get) => ({
      news: initialNews,

      toggleLike: (newsId) => {
        set((state) => ({
          news: state.news.map((item) => {
            if (item.id !== newsId) return item;
            const newLiked = !item.isLikedByMe;
            const newCount = newLiked ? item.likesCount + 1 : Math.max(0, item.likesCount - 1);

            // Also update heart reaction if present
            const updatedReactions = item.reactions.map((r) => {
              if (r.emoji === '❤️') {
                return {
                  ...r,
                  hasReacted: newLiked,
                  count: newLiked ? r.count + 1 : Math.max(0, r.count - 1),
                };
              }
              return r;
            });

            return {
              ...item,
              isLikedByMe: newLiked,
              likesCount: newCount,
              reactions: updatedReactions,
            };
          }),
        }));
      },

      toggleReaction: (newsId, emoji) => {
        set((state) => ({
          news: state.news.map((item) => {
            if (item.id !== newsId) return item;

            const existingIdx = item.reactions.findIndex((r) => r.emoji === emoji);
            let updatedReactions = [...item.reactions];

            if (existingIdx >= 0) {
              const current = updatedReactions[existingIdx];
              const willReact = !current.hasReacted;
              updatedReactions[existingIdx] = {
                ...current,
                hasReacted: willReact,
                count: willReact ? current.count + 1 : Math.max(0, current.count - 1),
              };
            } else {
              updatedReactions.push({
                emoji,
                count: 1,
                hasReacted: true,
              });
            }

            // Sync overall likes count if emoji is heart or thumbs-up
            let newLikedByMe = item.isLikedByMe;
            let newLikesCount = item.likesCount;
            if (emoji === '❤️' || emoji === '👍') {
              const r = updatedReactions.find((x) => x.emoji === emoji);
              if (r) {
                newLikedByMe = r.hasReacted;
                newLikesCount = r.hasReacted ? item.likesCount + 1 : Math.max(0, item.likesCount - 1);
              }
            }

            return {
              ...item,
              reactions: updatedReactions,
              isLikedByMe: newLikedByMe,
              likesCount: newLikesCount,
            };
          }),
        }));
      },

      addComment: (newsId, content, author) => {
        const trimmed = content.trim();
        if (!trimmed) return;

        const newComment: NewsComment = {
          id: `comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          authorName: author.name || 'Resident',
          authorUnit: author.unit || 'B-204',
          content: trimmed,
          createdAt: new Date().toISOString(),
          timeAgo: 'Just now',
          likesCount: 0,
          isLikedByMe: false,
        };

        set((state) => ({
          news: state.news.map((item) => {
            if (item.id !== newsId) return item;
            return {
              ...item,
              comments: [...item.comments, newComment],
            };
          }),
        }));
      },

      toggleCommentLike: (newsId, commentId) => {
        set((state) => ({
          news: state.news.map((item) => {
            if (item.id !== newsId) return item;
            return {
              ...item,
              comments: item.comments.map((c) => {
                if (c.id !== commentId) return c;
                const nextLiked = !c.isLikedByMe;
                return {
                  ...c,
                  isLikedByMe: nextLiked,
                  likesCount: nextLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
                };
              }),
            };
          }),
        }));
      },

      getNewsById: (id) => {
        return get().news.find((n) => n.id === id);
      },
    }),
    {
      name: 'ama-society-news-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
