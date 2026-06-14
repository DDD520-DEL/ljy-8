import { followRepository } from '../repositories/FollowRepository';
import { userRepository } from '../repositories/UserRepository';
import { skillRepository } from '../repositories/SkillRepository';
import { notificationService } from './NotificationService';
import { FollowUser, FollowWithDetail, FollowerWithDetail, SkillWithProvider } from '../types';

export class FollowService {
  public getFollowing(userId: string): FollowWithDetail[] { return followRepository.findByFollower(userId).filter((f) => userRepository.findById(f.followingId)).map((f) => followRepository.toFollowWithDetail(f)); }
  public getFollowers(userId: string): FollowerWithDetail[] { return followRepository.findByFollowing(userId).filter((f) => userRepository.findById(f.followerId)).map((f) => followRepository.toFollowerWithDetail(f)); }
  public isFollowing(followerId: string, followingId: string): boolean { return followRepository.isFollowing(followerId, followingId); }
  public getFollowStats(userId: string): { followersCount: number; followingCount: number } { return { followersCount: followRepository.countFollowers(userId), followingCount: followRepository.countFollowing(userId) }; }
  public followUser(followerId: string, followingId: string): FollowUser { if (followerId === followingId) throw new Error('不能关注自己'); if (!userRepository.findById(followingId)) throw new Error('用户不存在'); if (followRepository.isFollowing(followerId, followingId)) throw new Error('已关注该用户'); return followRepository.create(followerId, followingId); }
  public unfollowUser(followerId: string, followingId: string): boolean { if (!followRepository.isFollowing(followerId, followingId)) throw new Error('未关注该用户'); return followRepository.deleteByFollowerAndFollowing(followerId, followingId); }
  public toggleFollow(followerId: string, followingId: string): { following: boolean } { if (followerId === followingId) throw new Error('不能关注自己'); if (!userRepository.findById(followingId)) throw new Error('用户不存在'); if (followRepository.isFollowing(followerId, followingId)) { followRepository.deleteByFollowerAndFollowing(followerId, followingId); return { following: false }; } followRepository.create(followerId, followingId); return { following: true }; }
  public notifyFollowersNewSkill(providerId: string, skillId: string, skillTitle: string): void { const followerIds = followRepository.getFollowerIds(providerId); const provider = userRepository.findById(providerId); if (!provider) return; followerIds.forEach((followerId) => { notificationService.sendNotification({ userId: followerId, type: 'new_skill_from_followed', title: '关注的用户发布新技能', message: "您关注的 " + provider.nickname + " 发布了新技能「" + skillTitle + "」", relatedId: skillId, relatedType: 'skill' }); }); }
  public getFollowingLatestSkills(userId: string): SkillWithProvider[] { const following = followRepository.findByFollower(userId); const followingIds = following.map((f) => f.followingId); if (followingIds.length === 0) return []; const allSkills = skillRepository.findAll().filter((s) => followingIds.includes(s.providerId)); allSkills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); return allSkills.map((s) => skillRepository.toSkillWithProvider(s)); }
}
export const followService = new FollowService();
