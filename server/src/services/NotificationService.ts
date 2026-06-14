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
    relatedType?: 'borrow_order' | 'service_order' | 'dispute' | 'item' | 'queue' | 'skill';
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
    const message = `${reviewerName} 对您的订单「${orderTitle}」给出了 ${rating} 星评价 ${stars}`;
    return this.sendNotification({
      userId,
      type: 'new_review',
      title,
      message,
      relatedType: 'service_order',
    });
  }

  public sendReviewReplyNotification(
    userId: string,
    replierName: string,
    orderTitle: string
  ): Notification {
    const title = '收到评价回复';
    const message = `${replierName} 对订单「${orderTitle}」的评价进行了回复`;
    return this.sendNotification({
      userId,
      type: 'review_reply',
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

  public sendDonationStatusNotification(
    userId: string,
    donationId: string,
    status: string,
    itemTitle: string
  ): Notification {
    const statusText: Record<string, string> = {
      available: '待领取',
      pending_approval: '有新的申请',
      approved: '申请已通过',
      rejected: '申请未通过',
      meeting: '待交接',
      completed: '已完成',
      cancelled: '已取消',
    };

    const title = '捐赠状态更新';
    const message = `您的捐赠「${itemTitle}」状态已更新为：${statusText[status] || status}`;
    return this.sendNotification({
      userId,
      type: 'donation_status',
      title,
      message,
      relatedId: donationId,
      relatedType: 'item',
    });
  }

  public sendDemandStatusNotification(
    userId: string,
    demandId: string,
    status: string,
    demandTitle: string
  ): Notification {
    const statusText: Record<string, string> = {
      open: '接受响应',
      responding: '有响应中',
      confirmed: '已确认',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    };

    const title = '需求状态更新';
    const message = `需求「${demandTitle}」状态已更新为：${statusText[status] || status}`;
    return this.sendNotification({
      userId,
      type: 'demand_status',
      title,
      message,
      relatedId: demandId,
      relatedType: 'item',
    });
  }

  public sendDemandNewResponseNotification(
    userId: string,
    demandId: string,
    demandTitle: string
  ): Notification {
    const title = '需求收到新响应';
    const message = `您发布的需求「${demandTitle}」收到了新的响应，请查看`;
    return this.sendNotification({
      userId,
      type: 'demand_new_response',
      title,
      message,
      relatedId: demandId,
      relatedType: 'item',
    });
  }

  public sendDemandResponseAcceptedNotification(
    userId: string,
    demandId: string,
    demandTitle: string
  ): Notification {
    const title = '您的响应被确认';
    const message = `您对需求「${demandTitle}」的响应已被发布者确认，请尽快开始服务`;
    return this.sendNotification({
      userId,
      type: 'demand_response_accepted',
      title,
      message,
      relatedId: demandId,
      relatedType: 'item',
    });
  }

  public sendDemandOrderCompletedNotification(
    userId: string,
    orderId: string,
    coinChange: number,
    demandTitle: string
  ): Notification {
    const title = '需求订单已完成';
    const action = coinChange > 0 ? '获得' : '支付';
    const message = `需求「${demandTitle}」已完成，您${action}了 ${Math.abs(coinChange)} 时间币`;
    return this.sendNotification({
      userId,
      type: 'demand_order_completed',
      title,
      message,
      relatedId: orderId,
      relatedType: 'item',
    });
  }
}

export const notificationService = new NotificationService();
