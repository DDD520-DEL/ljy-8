import { queueRepository } from '../repositories/QueueRepository';
import { itemRepository } from '../repositories/ItemRepository';
import { orderRepository } from '../repositories/OrderRepository';
import {
  QueueEntryWithDetails,
  QueueRequest,
  ConfirmQueueRequest,
  QueueNotification,
  BorrowOrderStatus,
} from '../types';
import { getCurrentTime } from '../utils/helpers';

export const QUEUE_CONFIRM_TIMEOUT_HOURS = 24;

export class QueueService {
  public joinQueue(userId: string, request: QueueRequest): QueueEntryWithDetails {
    const item = itemRepository.findById(request.itemId);
    if (!item) {
      throw new Error('物品不存在');
    }

    if (item.status === 'maintenance') {
      throw new Error('物品正在维护中，无法排队');
    }

    if (item.ownerId === userId) {
      throw new Error('不能为自己的物品排队');
    }

    if (queueRepository.checkDuplicateQueue(request.itemId, userId)) {
      throw new Error('您已在该物品的排队队伍中');
    }

    const entry = queueRepository.create({
      itemId: request.itemId,
      userId,
      message: request.message,
    });

    return queueRepository.toQueueEntryWithDetails(entry);
  }

  public cancelQueue(queueId: string, userId: string): QueueEntryWithDetails | null {
    const entry = queueRepository.findById(queueId);
    if (!entry) {
      throw new Error('排队记录不存在');
    }

    if (entry.userId !== userId) {
      throw new Error('无权取消他人的排队');
    }

    if (entry.status !== 'waiting' && entry.status !== 'notified') {
      throw new Error('当前状态无法取消排队');
    }

    const updated = queueRepository.update(queueId, {
      status: 'cancelled',
      cancelledAt: getCurrentTime(),
    });

    queueRepository.updatePositionsAfterRemove(entry.itemId);

    return updated ? queueRepository.toQueueEntryWithDetails(updated) : null;
  }

  public getMyQueues(userId: string): QueueEntryWithDetails[] {
    const entries = queueRepository.findByUserId(userId);
    return entries.map((entry) => queueRepository.toQueueEntryWithDetails(entry));
  }

  public getItemQueues(itemId: string): QueueEntryWithDetails[] {
    const entries = queueRepository.findByItemId(itemId);
    return entries.map((entry) => queueRepository.toQueueEntryWithDetails(entry));
  }

  public getItemActiveQueues(itemId: string): QueueEntryWithDetails[] {
    const entries = queueRepository.findActiveByItemId(itemId);
    return entries.map((entry) => queueRepository.toQueueEntryWithDetails(entry));
  }

  public getQueueById(queueId: string): QueueEntryWithDetails | null {
    const entry = queueRepository.findById(queueId);
    return entry ? queueRepository.toQueueEntryWithDetails(entry) : null;
  }

  public notifyNextInQueue(itemId: string): QueueEntryWithDetails | null {
    const existingNotified = queueRepository.findNotifiedByItemId(itemId);
    if (existingNotified) {
      return queueRepository.toQueueEntryWithDetails(existingNotified);
    }

    const nextEntry = queueRepository.findNextWaiting(itemId);
    if (!nextEntry) {
      return null;
    }

    const expiredAt = new Date();
    expiredAt.setHours(expiredAt.getHours() + QUEUE_CONFIRM_TIMEOUT_HOURS);

    const updated = queueRepository.update(nextEntry.id, {
      status: 'notified',
      notifiedAt: getCurrentTime(),
      expiredAt: expiredAt.toISOString(),
    });

    if (updated) {
      const item = itemRepository.findById(itemId);
      queueRepository.createNotification({
        userId: updated.userId,
        queueEntryId: updated.id,
        itemId,
        type: 'queue_turn',
        message: `您排队的物品「${item?.title || ''}」已轮到您借用，请在 ${QUEUE_CONFIRM_TIMEOUT_HOURS} 小时内确认借用。`,
      });
    }

    return updated ? queueRepository.toQueueEntryWithDetails(updated) : null;
  }

  public confirmQueueBorrow(
    queueId: string,
    userId: string,
    request: ConfirmQueueRequest
  ): QueueEntryWithDetails | null {
    const entry = queueRepository.findById(queueId);
    if (!entry) {
      throw new Error('排队记录不存在');
    }

    if (entry.userId !== userId) {
      throw new Error('无权操作此排队记录');
    }

    if (entry.status !== 'notified') {
      throw new Error('当前状态无法确认借用');
    }

    if (entry.expiredAt && new Date(entry.expiredAt) < new Date()) {
      this.expireQueueEntry(entry.id);
      throw new Error('确认时间已过期，已顺延至下一位用户');
    }

    const item = itemRepository.findById(entry.itemId);
    if (!item || item.status !== 'available') {
      throw new Error('物品暂不可用');
    }

    queueRepository.update(queueId, {
      status: 'confirmed',
      confirmedAt: getCurrentTime(),
    });

    const newOrder = orderRepository.createBorrowOrder({
      itemId: entry.itemId,
      borrowerId: userId,
      lenderId: item.ownerId,
      startDate: request.startDate,
      endDate: request.endDate,
      deposit: item.deposit,
      message: request.message || '(通过排队确认的借用申请)',
    });

    orderRepository.updateBorrowOrder(newOrder.id, { status: 'approved' as BorrowOrderStatus });
    orderRepository.addBorrowTimelineEvent(newOrder.id, '通过排队确认借用，已自动通过审批', userId);

    const updated = queueRepository.findById(queueId);
    return updated ? queueRepository.toQueueEntryWithDetails(updated) : null;
  }

  public expireQueueEntry(queueId: string): void {
    const entry = queueRepository.findById(queueId);
    if (!entry || entry.status !== 'notified') return;

    queueRepository.update(queueId, {
      status: 'expired',
      expiredAt: getCurrentTime(),
    });

    const item = itemRepository.findById(entry.itemId);
    queueRepository.createNotification({
      userId: entry.userId,
      queueEntryId: entry.id,
      itemId: entry.itemId,
      type: 'queue_expired',
      message: `您排队的物品「${item?.title || ''}」确认借用超时，名额已顺延。`,
    });

    queueRepository.updatePositionsAfterRemove(entry.itemId);
    this.notifyNextInQueue(entry.itemId);
  }

  public checkAndExpireNotifiedEntries(): void {
    const allEntries = queueRepository.findAll();
    const now = new Date();

    allEntries.forEach((entry) => {
      if (entry.status === 'notified' && entry.expiredAt && new Date(entry.expiredAt) < now) {
        this.expireQueueEntry(entry.id);
      }
    });
  }

  public getNotifications(userId: string): QueueNotification[] {
    return queueRepository.findNotificationsByUserId(userId);
  }

  public getUnreadNotificationsCount(userId: string): number {
    const notifications = queueRepository.findNotificationsByUserId(userId);
    return notifications.filter((n) => !n.read).length;
  }

  public markNotificationAsRead(notificationId: string, userId: string): QueueNotification | null {
    const notifications = queueRepository.findNotificationsByUserId(userId);
    const notification = notifications.find((n) => n.id === notificationId);
    if (!notification) {
      throw new Error('通知不存在');
    }
    return queueRepository.markNotificationAsRead(notificationId) || null;
  }

  public markAllNotificationsAsRead(userId: string): void {
    queueRepository.markAllNotificationsAsRead(userId);
  }

  public markQueueAsBorrowed(queueId: string): void {
    queueRepository.update(queueId, { status: 'borrowed' });
  }
}

export const queueService = new QueueService();
