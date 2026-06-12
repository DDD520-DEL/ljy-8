import { notificationRepository } from '../repositories/NotificationRepository';
import { Notification, NotificationType } from '../types';

export class NotificationService {
  public getNotifications(userId: string): Notification[] {
    return notificationRepository.findByUserId(userId);
  }

  public getUnreadNotifications(userId: string): Notification[] {
    return notificationRepository.findUnreadByUserId(userId);
  }

  public getUnreadCount(userId: string): number {
    return notificationRepository.countUnreadByUserId(userId);
  }

  public markAsRead(notificationId: string, userId: string): Notification | null {
    const notification = notificationRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error('通知不存在');
    }
    return notificationRepository.markAsRead(notificationId) || null;
  }

  public markAllAsRead(userId: string): void {
    notificationRepository.markAllAsRead(userId);
  }

  public deleteNotification(notificationId: string, userId: string): boolean {
    const notification = notificationRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error('通知不存在');
    }
    return notificationRepository.delete(notificationId);
  }

  public deleteMany(userId: string, ids: string[]): number {
    return notificationRepository.deleteMany(userId, ids);
  }

  public sendNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: string;
    relatedType?: 'borrow_order' | 'service_order' | 'dispute' | 'item' | 'queue';
  }): Notification {
    return notificationRepository.create(data);
  }

  public sendOrderStatusNotification(
    userId: string,
    orderId: string,
    orderType: 'borrow' | 'service',
    statusText: string,
    itemTitle: string
  ): Notification {
    const title = '订单状态更新';
    const message = `您的${orderType === 'borrow' ? '物品借用' : '技能服务'}订单「${itemTitle}」状态已更新为：${statusText}`;
    return this.sendNotification({
      userId,
      type: 'order_status',
      title,
      message,
      relatedId: orderId,
      relatedType: orderType === 'borrow' ? 'borrow_order' : 'service_order',
    });
  }

  public sendDisputeStatusNotification(
    userId: string,
    disputeId: string,
    statusText: string,
    orderTitle: string
  ): Notification {
    const title = '纠纷进度更新';
    const message = `您涉及的纠纷（订单：${orderTitle}）状态已更新为：${statusText}`;
    return this.sendNotification({
      userId,
      type: 'dispute_status',
      title,
      message,
      relatedId: disputeId,
      relatedType: 'dispute',
    });
  }

  public sendNewReviewNotification(
    userId: string,
    reviewerName: string,
    rating: number,
    orderTitle: string
  ): Notification {
    const title = '收到新评价';
    const stars = '⭐'.repeat(Math.round(rating));
    const message = `${reviewerName} 对您的服务「${orderTitle}」给出了 ${rating} 星评价 ${stars}`;
    return this.sendNotification({
      userId,
      type: 'new_review',
      title,
      message,
      relatedType: 'service_order',
    });
  }

  public sendSystemNotification(
    userId: string,
    title: string,
    message: string
  ): Notification {
    return this.sendNotification({
      userId,
      type: 'system',
      title,
      message,
    });
  }
}

export const notificationService = new NotificationService();
