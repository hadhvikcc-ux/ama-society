import { create } from 'zustand';

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ notifications, unreadCount: notifications.filter((n) => !n.read).length }),
  addNotification: (notification) => set((state) => {
    const updated = [notification, ...state.notifications];
    return { notifications: updated, unreadCount: updated.filter((n) => !n.read).length };
  }),
  markAsRead: (id) => set((state) => {
    const updated = state.notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    return { notifications: updated, unreadCount: updated.filter((n) => !n.read).length };
  }),
}));
