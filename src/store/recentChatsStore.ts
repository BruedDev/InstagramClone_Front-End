import { create } from 'zustand';
import { RecentChat } from '@/server/messenger';

interface RecentChatsState {
  recentChats: RecentChat[];
  setRecentChats: (chats: RecentChat[]) => void;
  updateRecentChat: (chat: RecentChat) => void;
  clearRecentChats: () => void;
}

export const useRecentChatsStore = create<RecentChatsState>((set) => ({
  recentChats: [],
  setRecentChats: (chats) => set({ recentChats: chats }),
  updateRecentChat: (chat) =>
    set((state) => {
      const idx = state.recentChats.findIndex((c) => c.user._id === chat.user._id);
      if (idx !== -1) {
        const updated = [...state.recentChats];
        updated[idx] = chat;
        // Đưa chat mới lên đầu
        const [item] = updated.splice(idx, 1);
        return { recentChats: [item, ...updated] };
      } else {
        return { recentChats: [chat, ...state.recentChats] };
      }
    }),
  clearRecentChats: () => set({ recentChats: [] }),
}));
