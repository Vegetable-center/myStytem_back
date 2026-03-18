// src/modules/like/dto/like-list.vo.ts
// 单个点赞帖子的返回结构
export interface LikedPostVO {
  postId: number; // 帖子ID
  title: string; // 帖子标题
  coverImage: string | null; // 帖子封面
  category: string; // 帖子分类
  createdAt: Date; // 帖子创建时间
  likeTime: Date; // 用户点赞时间
}

// 点赞列表分页返回结构
export interface LikeListVO {
  list: LikedPostVO[];
  total: number; // 总点赞数
  page: number;
  limit: number;
}