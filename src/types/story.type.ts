// Định nghĩa lại kiểu dữ liệu cho state.stories
export interface Story {
  _id: string;
  author: {
    _id: string;
    username: string;
    profilePicture?: string;
    checkMark?: boolean;
  };
  media?: string;
  mediaType?: string;
  audio?: string;
  audioDuration?: number;
  videoDuration?: number; // Thêm dòng này để hỗ trợ video thường
  createdAt?: string;
}

export interface GroupedStory {
  author: {
    _id: string;
    username: string;
    profilePicture?: string;
    checkMark?: boolean;
  };
  stories: Story[];
}

export interface StoryState {
  stories: GroupedStory[];
  loading: boolean;
  error: string | null;
  currentUserStories: Story[];
  isPlaying: boolean;
  isMuted: boolean;
}

export const initialState: StoryState = {
  stories: [],
  loading: false,
  error: null,
  currentUserStories: [],
  isPlaying: true,
  isMuted: false,
};