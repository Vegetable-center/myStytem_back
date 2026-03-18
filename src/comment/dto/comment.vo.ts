// src/modules/comment/dto/comment.vo.ts
// 单个评论的返回结构
export interface CommentVO {
  id: number; // 评论ID
  postId: number; // 帖子ID
  content: string; // 评论内容
  createdAt: Date; // 评论时间
  replyCommentId: number | null; // 回复的目标评论ID
  // 评论者信息
  user: {
    id: number;
    userName: string;
    avatar: string;
  };
  // 回复的目标用户（有则显示“回复@XXX”）
  replyToUser?: {
    id: number;
    username: string;
  };
}

// 帖子评论列表返回结构
export interface PostCommentListVO {
  list: CommentVO[]; // 所有评论（按时间正序排列）
  total: number; // 评论总数
}