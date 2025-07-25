export interface Author {
  _id: string;
  username: string;
  fullName: string;
  profilePicture: string;
  checkMark: boolean;
}

export interface Post {
  likes: number;
  _id: string;
  caption: string;
  fileUrl: string;
  filePublicId: string;
  type: "image" | "video";
  author: Author;
  createdAt: string; // ISO date string
  updatedAt: string;
  __v: number;
  comments: Comment[];
  // likes: string[];
  isLiked: boolean;
  isBookmarked: boolean;
  totalLikes: number;
  totalComments: number;
  isLike?: boolean;
  hasStories?: boolean;
}
