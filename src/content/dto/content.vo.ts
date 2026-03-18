// src/modules/post/entities/post.vo.ts
export interface ContentItemVO {
  id: number;
  title: string;
  content: string;
  category: string;
  coverImage: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  userName: string; // 用户表的userName
  avatar: string;   // 用户表的avatar
}

// 无分页的列表返回类型
export interface ContentAllVO {
  list: ContentItemVO[];
}