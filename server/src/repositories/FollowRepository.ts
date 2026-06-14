import { db } from '../utils/db';
import { FollowUser, FollowWithDetail, FollowerWithDetail } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { userRepository } from './UserRepository';

export class FollowRepository {
  private collection = 'follows';
  public findAll(): FollowUser[] { return db.getAll<FollowUser>(this.collection); }
  public findById(id: string): FollowUser | undefined { return db.getById<FollowUser>(this.collection, id); }
  public findByFollower(followerId: string): FollowUser[] { return db.findMany<FollowUser>(this.collection, (f) => f.followerId === followerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  public findByFollowing(followingId: string): FollowUser[] { return db.findMany<FollowUser>(this.collection, (f) => f.followingId === followingId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  public findByFollowerAndFollowing(followerId: string, followingId: string): FollowUser | undefined { return db.findOne<FollowUser>(this.collection, (f) => f.followerId === followerId && f.followingId === followingId); }
  public isFollowing(followerId: string, followingId: string): boolean { return !!this.findByFollowerAndFollowing(followerId, followingId); }
  public countFollowers(userId: string): number { return db.findMany<FollowUser>(this.collection, (f) => f.followingId === userId).length; }
  public countFollowing(userId: string): number { return db.findMany<FollowUser>(this.collection, (f) => f.followerId === userId).length; }
  public getFollowerIds(userId: string): string[] { return db.findMany<FollowUser>(this.collection, (f) => f.followingId === userId).map((f) => f.followerId); }
  public create(followerId: string, followingId: string): FollowUser { const follow: FollowUser = { id: generateId(), followerId, followingId, createdAt: getCurrentTime() }; return db.insert<FollowUser>(this.collection, follow); }
  public delete(id: string): boolean { return db.delete(this.collection, id); }
  public deleteByFollowerAndFollowing(followerId: string, followingId: string): boolean { const follow = this.findByFollowerAndFollowing(followerId, followingId); if (!follow) return false; return this.delete(follow.id); }
  public toFollowWithDetail(follow: FollowUser): FollowWithDetail { const following = userRepository.findById(follow.followingId); return { ...follow, following: following ? userRepository.toPublicUser(following) : {} as any }; }
  public toFollowerWithDetail(follow: FollowUser): FollowerWithDetail { const follower = userRepository.findById(follow.followerId); return { ...follow, follower: follower ? userRepository.toPublicUser(follower) : {} as any }; }
}
export const followRepository = new FollowRepository();
