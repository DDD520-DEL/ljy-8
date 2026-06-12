import { db } from '../utils/db';
import { Notification, NotificationType } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';

export class NotificationRepository {
  private collection = 'notifications';

  public findAll(): Notification[] {
    return db.getAll<Notification>(this.collection);
  }

  public findById(id: string): Notification | undefined {
    return db.getById<Notification>(this.collection, id);
  }

  public findByUserId(userId: string): Notification[] {
    return db
      .findMany<Notification>(this.collection, (n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public findUnreadByUserId(userId: string): Notification[] {
    return db
      .findMany<Notification>(this.collection, (n) => n.userId === userId && !n.read)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public countUnreadByUserId(userId: string): number {
    const notifications = db.findMany<Notification>(
      this.collection,
      (n) => n.userId === userId && !n.read
    );
    return notifications.length;
  }

  public create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: string;
    relatedType?: 'borrow_order' | 'service_order' | 'dispute' | 'item' | 'queue';
  }): Notification {
    const notification: Notification = {
      id: generateId(),
      ...data,
      read: false,
      createdAt: getCurrentTime(),
    };
    return db.insert<Notification>(this.collection, notification);
  }

  public markAsRead(id: string): Notification | undefined {
    return db.update<Notification>(this.collection, id, { read: true });
  }

  public markAllAsRead(userId: string): void {
    const notifications = this.findByUserId(userId);
    notifications.forEach((n) => {
      if (!n.read) {
        this.markAsRead(n.id);
      }
    });
  }

  public delete(id: string): boolean {
    return db.delete(this.collection, id);
  }

  public deleteMany(userId: string, ids: string[]): number {
    let count = 0;
    ids.forEach((id) => {
      const notification = this.findById(id);
      if (notification && notification.userId === userId) {
        if (this.delete(id)) {
          count++;
        }
      }
    });
    return count;
  }
}

export const notificationRepository = new NotificationRepository();
