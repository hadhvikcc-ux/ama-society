import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PollCategory = 'AGM' | 'Budget' | 'Amenities' | 'Guidelines' | 'Festival' | 'General';
export type PollStatus = 'ACTIVE' | 'CLOSED';

export interface PollOption {
  id: string; // e.g. "opt-1"
  text: string;
  emoji?: string;
  votes: number;
}

export interface SocietyPoll {
  id: string; // e.g. "POL-001"
  title: string;
  description: string;
  category: PollCategory;
  options: PollOption[];
  totalVotes: number;
  quorumTarget: number; // e.g. 150 votes
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  status: PollStatus;
  userVotedOptionId?: string | null;
  voterUserIds: string[];
}

interface PollState {
  polls: SocietyPoll[];

  // Actions
  createPoll: (params: {
    title: string;
    description: string;
    category?: PollCategory;
    options: { text: string; emoji?: string }[];
    expiryDays?: number;
    quorumTarget?: number;
    createdBy?: string;
  }) => SocietyPoll;

  castVote: (
    pollId: string,
    optionId: string,
    userId?: string
  ) => { success: boolean; message: string };

  closePoll: (pollId: string) => void;
  getPollById: (pollId: string) => SocietyPoll | undefined;
  getActivePolls: () => SocietyPoll[];
  resetPolls: () => void;
}

const initialPolls: SocietyPoll[] = [
  {
    id: 'POL-101',
    title: 'Diwali Lawn Lighting & Canopy Design',
    description: 'Help the cultural committee choose the main clubhouse lawn illumination setup for Diwali celebrations.',
    category: 'Festival',
    options: [
      { id: 'opt-a', text: 'Option A: Fairy Canopy & Hanging Lanterns', emoji: '✨', votes: 116 },
      { id: 'opt-b', text: 'Option B: Traditional Terracotta Diyas & Warm LEDs', emoji: '🪔', votes: 36 },
    ],
    totalVotes: 152,
    quorumTarget: 180,
    createdBy: 'President Vikram Malhotra',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 18).toISOString(),
    status: 'ACTIVE',
    userVotedOptionId: null,
    voterUserIds: ['usr-1', 'usr-2'],
  },
  {
    id: 'POL-102',
    title: 'Install 6 Dedicated EV Fast-Charging Stations in Basement 2',
    description: 'Proposal to allocate society sinking fund (₹3.2 Lakhs) for commercial EV charging infrastructure with smart sub-metering.',
    category: 'Budget',
    options: [
      { id: 'opt-yes', text: 'Approve EV Infrastructure Installation', emoji: '⚡', votes: 142 },
      { id: 'opt-no', text: 'Defer to Next Financial Year', emoji: '⏸️', votes: 28 },
    ],
    totalVotes: 170,
    quorumTarget: 200,
    createdBy: 'Management Committee',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 48).toISOString(),
    status: 'ACTIVE',
    userVotedOptionId: 'opt-yes',
    voterUserIds: ['u-1'],
  },
];

export const usePollStore = create<PollState>()(
  persist(
    (set, get) => ({
      polls: initialPolls,

      createPoll: ({
        title,
        description,
        category = 'General',
        options,
        expiryDays = 7,
        quorumTarget = 150,
        createdBy = 'President Vikram Malhotra',
      }) => {
        const id = `POL-${Math.floor(100 + Math.random() * 900)}`;
        const newPoll: SocietyPoll = {
          id,
          title,
          description,
          category,
          options: options.map((opt, idx) => ({
            id: `opt-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
            text: opt.text,
            emoji: opt.emoji || '🗳️',
            votes: 0,
          })),
          totalVotes: 0,
          quorumTarget,
          createdBy,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + expiryDays * 86400000).toISOString(),
          status: 'ACTIVE',
          userVotedOptionId: null,
          voterUserIds: [],
        };

        set((state) => ({
          polls: [newPoll, ...state.polls],
        }));

        return newPoll;
      },

      castVote: (pollId: string, optionId: string, userId = 'u-1') => {
        const { polls } = get();
        const poll = polls.find((p) => p.id === pollId);

        if (!poll) {
          return { success: false, message: 'Poll not found.' };
        }

        if (poll.status === 'CLOSED') {
          return { success: false, message: 'This poll is closed.' };
        }

        const optionExists = poll.options.some((o) => o.id === optionId);
        if (!optionExists) {
          return { success: false, message: 'Selected option not found.' };
        }

        // If user already voted for this option, no-op
        if (poll.userVotedOptionId === optionId) {
          return { success: true, message: 'Vote already recorded for this option.' };
        }

        // If user is changing vote, decrement old and increment new
        const prevOptionId = poll.userVotedOptionId;
        const updatedOptions = poll.options.map((opt) => {
          if (opt.id === optionId) {
            return { ...opt, votes: opt.votes + 1 };
          }
          if (prevOptionId && opt.id === prevOptionId) {
            return { ...opt, votes: Math.max(0, opt.votes - 1) };
          }
          return opt;
        });

        const newTotalVotes = prevOptionId ? poll.totalVotes : poll.totalVotes + 1;
        const voterUserIds = poll.voterUserIds.includes(userId)
          ? poll.voterUserIds
          : [...poll.voterUserIds, userId];

        const updatedPoll: SocietyPoll = {
          ...poll,
          options: updatedOptions,
          totalVotes: newTotalVotes,
          userVotedOptionId: optionId,
          voterUserIds,
        };

        set({
          polls: polls.map((p) => (p.id === pollId ? updatedPoll : p)),
        });

        return { success: true, message: 'Vote cast successfully!' };
      },

      closePoll: (pollId: string) => {
        set((state) => ({
          polls: state.polls.map((p) => (p.id === pollId ? { ...p, status: 'CLOSED' } : p)),
        }));
      },

      getPollById: (pollId: string) => {
        return get().polls.find((p) => p.id === pollId);
      },

      getActivePolls: () => {
        return get().polls.filter((p) => p.status === 'ACTIVE');
      },

      resetPolls: () => set({ polls: initialPolls }),
    }),
    {
      name: 'ama-poll-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
