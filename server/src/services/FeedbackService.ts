import { feedbackRepository } from '../repositories/FeedbackRepository';
import {
  Feedback,
  FeedbackWithUser,
  FeedbackStatus,
  FeedbackType,
  FeedbackFilterParams,
  PaginatedResult,
} from '../types';
import { notificationService } from './NotificationService';

export class FeedbackService {
  private statusText: Record<FeedbackStatus, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    rejected: '已拒绝',
  };

  private typeText: Record<FeedbackType, string> = {
    suggestion: '功能建议',
    bug: 'Bug反馈',
    experience: '使用体验',
  };

  private statusColor: Record<FeedbackStatus, string> = {
    pending: '#faad14',
    processing: '#1890ff',
    resolved: '#52c41a',
    rejected: '#ff4d4f',
  };

  public getStatusText(status: FeedbackStatus): string {
    return this.statusText[status];
  }

  public getTypeText(type: FeedbackType): string {
    return this.typeText[type];
  }

  public getStatusColor(status: FeedbackStatus): string {
    return this.statusColor[status];
  }

  public getMyFeedbacks(
    userId: string,
    params?: Omit<FeedbackFilterParams, 'page' | 'pageSize'>
  ): FeedbackWithUser[] {
    let feedbacks = feedbackRepository.findByUserId(userId);

    if (params?.type) {
      feedbacks = feedbacks.filter((f) => f.type === params.type);
    }

    if (params?.status) {
      feedbacks = feedbacks.filter((f) => f.status === params.status);
    }

    if (params?.keyword) {
      const keyword = params.keyword.toLowerCase();
      feedbacks = feedbacks.filter(
        (f) =>
          f.title.toLowerCase().includes(keyword) ||
          f.description.toLowerCase().includes(keyword)
      );
    }

    feedbacks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return feedbacks.map((f) => feedbackRepository.toFeedbackWithUser(f));
  }

  public getAllFeedbacks(
    params: FeedbackFilterParams
  ): PaginatedResult<FeedbackWithUser> {
    const result = feedbackRepository.findByFilter(params);
    return {
      ...result,
      items: result.items.map((f) => feedbackRepository.toFeedbackWithUser(f)),
    };
  }

  public getFeedbackById(id: string, userId?: string): FeedbackWithUser | null {
    const feedback = feedbackRepository.findById(id);
    if (!feedback) return null;

    if (userId && feedback.userId !== userId) {
      return null;
    }

    return feedbackRepository.toFeedbackWithUser(feedback);
  }

  public createFeedback(
    userId: string,
    data: {
      type: FeedbackType;
      title: string;
      description: string;
      images?: string[];
      contact?: string;
    }
  ): FeedbackWithUser {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('反馈标题不能为空');
    }

    if (!data.description || data.description.trim().length === 0) {
      throw new Error('反馈内容不能为空');
    }

    if (data.title.length > 100) {
      throw new Error('反馈标题不能超过100个字符');
    }

    if (data.description.length > 2000) {
      throw new Error('反馈内容不能超过2000个字符');
    }

    const feedback = feedbackRepository.create({
      userId,
      type: data.type,
      title: data.title.trim(),
      description: data.description.trim(),
      images: data.images,
      contact: data.contact,
    });

    return feedbackRepository.toFeedbackWithUser(feedback);
  }

  public updateFeedbackStatus(
    feedbackId: string,
    handlerId: string,
    status: FeedbackStatus,
    adminReply?: string
  ): FeedbackWithUser | null {
    const feedback = feedbackRepository.findById(feedbackId);
    if (!feedback) return null;

    if (adminReply && adminReply.length > 2000) {
      throw new Error('回复内容不能超过2000个字符');
    }

    const updates: Partial<Feedback> = {
      status,
      handledBy: handlerId,
    };

    if (adminReply) {
      updates.adminReply = adminReply;
    }

    const updated = feedbackRepository.update(feedbackId, updates);
    if (!updated) return null;

    notificationService.sendNotification({
      userId: feedback.userId,
      type: 'system',
      title: `您的反馈已${this.statusText[status]}`,
      message: `您提交的「${feedback.title}」${this.statusText[status]}${adminReply ? '，管理员回复：' + adminReply : ''}`,
      relatedId: feedback.id,
    });

    return feedbackRepository.toFeedbackWithUser(updated);
  }

  public getStatistics(): {
    total: number;
    pending: number;
    processing: number;
    resolved: number;
    rejected: number;
    typeStats: Record<FeedbackType, number>;
  } {
    const feedbacks = feedbackRepository.findAll();
    const stats = {
      total: feedbacks.length,
      pending: 0,
      processing: 0,
      resolved: 0,
      rejected: 0,
      typeStats: {
        suggestion: 0,
        bug: 0,
        experience: 0,
      } as Record<FeedbackType, number>,
    };

    feedbacks.forEach((f) => {
      stats[f.status]++;
      stats.typeStats[f.type]++;
    });

    return stats;
  }
}

export const feedbackService = new FeedbackService();
