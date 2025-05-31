export interface UserSuggestion {
  _id: string;
  username: string;
  fullName?: string;
  profilePicture?: string;
  checkMark: boolean;
  isFollowing?: boolean;
}

