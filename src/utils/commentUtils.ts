import { Comment as CommentType } from "@/store/comment";

// Hàm flatten tất cả replies thành mảng phẳng
export const flattenReplies = (comment: CommentType): CommentType[] => {
  const result: CommentType[] = [];

  if (comment.replies && comment.replies.length > 0) {
    for (const reply of comment.replies) {
      result.push(reply);
      // Recursively flatten nested replies
      result.push(...flattenReplies(reply));
    }
  }

  return result;
};

// Hàm đếm tổng số comments + replies của một comment gốc
export const getTotalCommentsCount = (comment: CommentType): number => {
  // 1 comment gốc + tất cả replies (flatten)
  return 1 + flattenReplies(comment).length;
};