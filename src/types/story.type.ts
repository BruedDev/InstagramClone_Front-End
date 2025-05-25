
export interface Story {
  _id: string;
  mediaUrl: string;
  mediaType: string;
  content?: string;
  createdAt: string;
  hasAudio: boolean;
  isVideoWithAudio: boolean;
  isImageWithAudio: boolean;
}

export interface UserStory {
  user: {
    _id: string;
    username: string;
    profilePicture: string;
    checkMark: boolean;
  };
  stories: Story[];
}