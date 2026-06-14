import { activityRepository } from '../repositories/ActivityRepository';
import { userRepository } from '../repositories/UserRepository';
import {
  Activity,
  ActivityWithDetails,
  ActivityFilterParams,
  ActivitySortParams,
  ActivityPaginationParams,
  PaginatedResult,
  CreateActivityRequest,
  UpdateActivityRequest,
  ActivityPhotoWithUser,
} from '../types';
import { getCurrentTime } from '../utils/helpers';
import { notificationService } from './NotificationService';
import { creditService } from './CreditService';

export class ActivityService {
  private statusText: Record<string, string> = {
    recruiting: '报名中',
    full: '名额已满',
    ongoing: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  };

  private categoryText: Record<string, string> = {
    sports: '体育运动',
    culture: '文化艺术',
    education: '亲子教育',
    social: '社交聚会',
    other: '其他',
  };

  public getActivities(
    filters: ActivityFilterParams,
    sort: ActivitySortParams,
    pagination: ActivityPaginationParams,
    currentUserId?: string
  ): PaginatedResult<ActivityWithDetails> {
    const result = activityRepository.findActivitiesWithFilters(filters, sort, pagination);
    return {
      ...result,
      items: result.items.map(activity =>
        activityRepository.toActivityWithDetails(activity, currentUserId)
      ),
    };
  }

  public getActivityById(id: string, currentUserId?: string): ActivityWithDetails | null {
    const activity = activityRepository.findActivityById(id);
    if (!activity) return null;
    activityRepository.incrementViewCount(id);
    return activityRepository.toActivityWithDetails(activity, currentUserId);
  }

  public getMyOrganizedActivities(userId: string): ActivityWithDetails[] {
    const activities = activityRepository.findActivitiesByOrganizerId(userId);
    return activities.map(activity =>
      activityRepository.toActivityWithDetails(activity, userId)
    );
  }

  public getMyRegisteredActivities(userId: string): ActivityWithDetails[] {
    const registrations = activityRepository.findRegistrationsByUserId(userId);
    const activityIds = registrations.map(reg => reg.activityId);
    const activities = activityRepository
      .findAllActivities()
      .filter(activity => activityIds.includes(activity.id));
    return activities.map(activity =>
      activityRepository.toActivityWithDetails(activity, userId)
    );
  }

  public createActivity(
    organizerId: string,
    data: CreateActivityRequest
  ): ActivityWithDetails | null {
    if (!data.title || !data.description || !data.location || !data.startTime || !data.endTime || !data.maxParticipants) {
      throw new Error('请填写完整的活动信息');
    }

    if (new Date(data.startTime) <= new Date()) {
      throw new Error('活动开始时间必须晚于当前时间');
    }

    if (new Date(data.endTime) <= new Date(data.startTime)) {
      throw new Error('活动结束时间必须晚于开始时间');
    }

    if (data.maxParticipants < 2) {
      throw new Error('活动人数上限至少为2人');
    }

    const activity = activityRepository.createActivity({
      organizerId,
      title: data.title,
      description: data.description,
      category: data.category || 'other',
      images: data.images || [],
      location: data.location,
      startTime: data.startTime,
      endTime: data.endTime,
      maxParticipants: data.maxParticipants,
    });

    return activityRepository.toActivityWithDetails(activity, organizerId);
  }

  public updateActivity(
    userId: string,
    activityId: string,
    data: UpdateActivityRequest
  ): ActivityWithDetails | null {
    const activity = activityRepository.findActivityById(activityId);
    if (!activity) {
      throw new Error('活动不存在');
    }

    if (activity.organizerId !== userId) {
      throw new Error('无权限修改此活动');
    }

    if (activity.status === 'completed' || activity.status === 'cancelled') {
      throw new Error('该活动已结束或已取消，无法修改');
    }

    if (data.startTime && new Date(data.startTime) <= new Date()) {
      throw new Error('活动开始时间必须晚于当前时间');
    }

    if (data.endTime && data.startTime) {
      if (new Date(data.endTime) <= new Date(data.startTime)) {
        throw new Error('活动结束时间必须晚于开始时间');
      }
    } else if (data.endTime) {
      if (new Date(data.endTime) <= new Date(activity.startTime)) {
        throw new Error('活动结束时间必须晚于开始时间');
      }
    }

    if (data.maxParticipants && data.maxParticipants < activity.currentParticipants) {
      throw new Error(`人数上限不能低于当前已报名人数 ${activity.currentParticipants}`);
    }

    const updates: Partial<Activity> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.category !== undefined) updates.category = data.category;
    if (data.images !== undefined) updates.images = data.images;
    if (data.location !== undefined) updates.location = data.location;
    if (data.startTime !== undefined) updates.startTime = data.startTime;
    if (data.endTime !== undefined) updates.endTime = data.endTime;
    if (data.maxParticipants !== undefined) updates.maxParticipants = data.maxParticipants;
    if (data.status !== undefined) updates.status = data.status;

    const updatedActivity = activityRepository.updateActivity(activityId, updates);
    if (!updatedActivity) return null;

    if (data.maxParticipants !== undefined) {
      this.updateActivityStatusIfNeeded(updatedActivity);
    }

    return activityRepository.toActivityWithDetails(updatedActivity, userId);
  }

  public registerActivity(userId: string, activityId: string): ActivityWithDetails | null {
    const activity = activityRepository.findActivityById(activityId);
    if (!activity) {
      throw new Error('活动不存在');
    }

    if (activity.organizerId === userId) {
      throw new Error('不能报名自己发布的活动');
    }

    if (activity.status !== 'recruiting' && activity.status !== 'full') {
      throw new Error('该活动当前不可报名');
    }

    const existingRegistration = activityRepository.findRegistrationByActivityAndUser(activityId, userId);
    if (existingRegistration) {
      throw new Error('您已报名该活动');
    }

    if (activity.currentParticipants >= activity.maxParticipants) {
      throw new Error('活动名额已满');
    }

    activityRepository.createRegistration(activityId, userId);
    const updatedActivity = activityRepository.updateActivity(activityId, {
      currentParticipants: activity.currentParticipants + 1,
    });
    if (!updatedActivity) return null;

    this.updateActivityStatusIfNeeded(updatedActivity);

    const user = userRepository.findById(userId);
    if (user) {
      notificationService.sendActivityNewRegistrationNotification(
        activity.organizerId,
        activityId,
        activity.title,
        user.nickname
      );
    }

    return activityRepository.toActivityWithDetails(updatedActivity, userId);
  }

  public cancelRegistration(userId: string, activityId: string): ActivityWithDetails | null {
    const activity = activityRepository.findActivityById(activityId);
    if (!activity) {
      throw new Error('活动不存在');
    }

    const registration = activityRepository.findRegistrationByActivityAndUser(activityId, userId);
    if (!registration) {
      throw new Error('您未报名该活动');
    }

    if (activity.status === 'ongoing' || activity.status === 'completed' || activity.status === 'cancelled') {
      throw new Error('该活动已开始或已结束，无法取消报名');
    }

    activityRepository.cancelRegistration(registration.id);
    const updatedActivity = activityRepository.updateActivity(activityId, {
      currentParticipants: Math.max(0, activity.currentParticipants - 1),
    });
    if (!updatedActivity) return null;

    this.updateActivityStatusIfNeeded(updatedActivity);

    return activityRepository.toActivityWithDetails(updatedActivity, userId);
  }

  public startActivity(organizerId: string, activityId: string): ActivityWithDetails | null {
    const activity = activityRepository.findActivityById(activityId);
    if (!activity) {
      throw new Error('活动不存在');
    }

    if (activity.organizerId !== organizerId) {
      throw new Error('无权限操作此活动');
    }

    if (activity.status !== 'recruiting' && activity.status !== 'full') {
      throw new Error('活动状态不允许开始');
    }

    const updatedActivity = activityRepository.updateActivityStatus(activityId, 'ongoing');
    if (!updatedActivity) return null;

    const registrations = activityRepository.findRegistrationsByActivityId(activityId);
    registrations.forEach(reg => {
      notificationService.sendActivityStatusNotification(
        reg.userId,
        activityId,
        activity.title,
        'ongoing'
      );
    });

    return activityRepository.toActivityWithDetails(updatedActivity, organizerId);
  }

  public completeActivity(organizerId: string, activityId: string): ActivityWithDetails | null {
    const activity = activityRepository.findActivityById(activityId);
    if (!activity) {
      throw new Error('活动不存在');
    }

    if (activity.organizerId !== organizerId) {
      throw new Error('无权限操作此活动');
    }

    if (activity.status !== 'ongoing') {
      throw new Error('活动状态不允许完成');
    }

    const updatedActivity = activityRepository.updateActivityStatus(activityId, 'completed');
    if (!updatedActivity) return null;

    const registrations = activityRepository.findRegistrationsByActivityId(activityId);
    registrations.forEach(reg => {
      activityRepository.updateRegistrationStatus(reg.id, 'attended');
      notificationService.sendActivityCompletedNotification(
        reg.userId,
        activityId,
        activity.title
      );
    });

    creditService.rewardCredit(organizerId, 5, '成功组织邻里活动');
    registrations.forEach(reg => {
      creditService.rewardCredit(reg.userId, 3, '参与邻里活动');
    });

    return activityRepository.toActivityWithDetails(updatedActivity, organizerId);
  }

  public cancelActivity(organizerId: string, activityId: string, reason?: string): ActivityWithDetails | null {
    const activity = activityRepository.findActivityById(activityId);
    if (!activity) {
      throw new Error('活动不存在');
    }

    if (activity.organizerId !== organizerId) {
      throw new Error('无权限取消此活动');
    }

    if (activity.status === 'completed' || activity.status === 'cancelled') {
      throw new Error('该活动已结束或已取消');
    }

    const updatedActivity = activityRepository.updateActivityStatus(activityId, 'cancelled');
    if (!updatedActivity) return null;

    const registrations = activityRepository.findRegistrationsByActivityId(activityId);
    registrations.forEach(reg => {
      activityRepository.cancelRegistration(reg.id);
      notificationService.sendActivityCancelledNotification(
        reg.userId,
        activityId,
        activity.title,
        reason
      );
    });

    return activityRepository.toActivityWithDetails(updatedActivity, organizerId);
  }

  public uploadPhoto(
    userId: string,
    activityId: string,
    imageUrl: string,
    description?: string
  ): ActivityPhotoWithUser | null {
    const activity = activityRepository.findActivityById(activityId);
    if (!activity) {
      throw new Error('活动不存在');
    }

    if (activity.status !== 'completed') {
      throw new Error('只有已完成的活动才能上传照片');
    }

    const registration = activityRepository.findRegistrationByActivityAndUser(activityId, userId);
    if (!registration) {
      throw new Error('只有参与活动的用户才能上传照片');
    }

    const photo = activityRepository.createPhoto({
      activityId,
      userId,
      imageUrl,
      description,
    });

    const user = userRepository.findById(userId);
    if (user) {
      const registrations = activityRepository.findRegistrationsByActivityId(activityId);
      registrations.forEach(reg => {
        if (reg.userId !== userId) {
          notificationService.sendActivityPhotoUploadedNotification(
            reg.userId,
            activityId,
            activity.title,
            user.nickname
          );
        }
      });
      notificationService.sendActivityPhotoUploadedNotification(
        activity.organizerId,
        activityId,
        activity.title,
        user.nickname
      );
    }

    creditService.rewardCredit(userId, 1, '上传活动照片');

    return activityRepository.toPhotoWithUser(photo);
  }

  public deletePhoto(userId: string, photoId: string): boolean {
    const photo = activityRepository.findPhotoById(photoId);
    if (!photo) {
      throw new Error('照片不存在');
    }

    if (photo.userId !== userId) {
      throw new Error('无权限删除此照片');
    }

    return activityRepository.deletePhoto(photoId);
  }

  private updateActivityStatusIfNeeded(activity: Activity): void {
    if (activity.status === 'recruiting' && activity.currentParticipants >= activity.maxParticipants) {
      activityRepository.updateActivityStatus(activity.id, 'full');
    } else if (activity.status === 'full' && activity.currentParticipants < activity.maxParticipants) {
      activityRepository.updateActivityStatus(activity.id, 'recruiting');
    }
  }

  public checkAndUpdateActivityStatuses(): void {
    const now = new Date();
    const activities = activityRepository.findAllActivities();

    activities.forEach(activity => {
      if (activity.status === 'recruiting' || activity.status === 'full') {
        if (new Date(activity.startTime) <= now && new Date(activity.endTime) > now) {
          activityRepository.updateActivityStatus(activity.id, 'ongoing');
          const registrations = activityRepository.findRegistrationsByActivityId(activity.id);
          registrations.forEach(reg => {
            notificationService.sendActivityStatusNotification(
              reg.userId,
              activity.id,
              activity.title,
              'ongoing'
            );
          });
        } else if (new Date(activity.endTime) <= now) {
          activityRepository.updateActivityStatus(activity.id, 'completed');
          const registrations = activityRepository.findRegistrationsByActivityId(activity.id);
          registrations.forEach(reg => {
            activityRepository.updateRegistrationStatus(reg.id, 'attended');
            notificationService.sendActivityCompletedNotification(
              reg.userId,
              activity.id,
              activity.title
            );
          });
          creditService.rewardCredit(activity.organizerId, 5, '成功组织邻里活动');
          registrations.forEach(reg => {
            creditService.rewardCredit(reg.userId, 3, '参与邻里活动');
          });
        }
      } else if (activity.status === 'ongoing' && new Date(activity.endTime) <= now) {
        activityRepository.updateActivityStatus(activity.id, 'completed');
        const registrations = activityRepository.findRegistrationsByActivityId(activity.id);
        registrations.forEach(reg => {
          activityRepository.updateRegistrationStatus(reg.id, 'attended');
          notificationService.sendActivityCompletedNotification(
            reg.userId,
            activity.id,
            activity.title
          );
        });
        creditService.rewardCredit(activity.organizerId, 5, '成功组织邻里活动');
        registrations.forEach(reg => {
          creditService.rewardCredit(reg.userId, 3, '参与邻里活动');
        });
      }
    });
  }

  public getCategoryText(category: string): string {
    return this.categoryText[category] || '其他';
  }

  public getStatusText(status: string): string {
    return this.statusText[status] || status;
  }
}

export const activityService = new ActivityService();
