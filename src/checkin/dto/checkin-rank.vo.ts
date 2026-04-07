// src/modules/checkin/dto/checkin-ranking.vo.ts
/**
 * 打卡排行榜用户项
 */
export interface CheckinRankingItemVO {
  userId: number; // 用户ID
  username: string; // 用户名
  avatar: string | null; // 用户头像（null则返回默认头像）
  currentContinuousDays: number; // 当前连续打卡天数
  totalPoints: number; // 用户总积分
}

/**
 * 打卡排行榜返回结构（无分页）
 */
export interface CheckinRankingVO {
  list: CheckinRankingItemVO[]; // 排行榜列表（按降序排列）
}