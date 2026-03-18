// src/modules/user/dto/user-info.vo.ts
// 简化的用户基本信息
export interface SimpleUserVO {
  id: number;
  username: string;
  avatar: string;
  nickname?: string; // 昵称（可选）
}

// 用户帖子VO（复用你已有的ContentItemVO）
import { ContentItemVO } from '../../content/dto/content.vo';

// 完整用户信息返回结构
export interface UserInfoVO {
  // 用户基本信息
  id: number;
  username: string;
  avatar: string;
  nickname: string;
  signature?: string; // 个性签名（可选）
  createdAt: Date; // 注册时间
  // 关联数据
  posts: ContentItemVO[]; // 用户发布的帖子
  followings: SimpleUserVO[]; // 用户关注的人（关注列表）
  followers: SimpleUserVO[]; // 用户的粉丝（被谁关注）
}