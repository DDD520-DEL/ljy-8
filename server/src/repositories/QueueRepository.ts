import { db } from '../utils/db';
import { QueueEntry, QueueEntryWithDetails, QueueNotification, QueueStatus } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { userRepository } from './UserRepository';
import { itemRepository } from './ItemRepository';

export class QueueRepository {
  private queueCollection = 'queueEntries';
  private notificationCollection = 'queueNotifications';

  public findAll(): QueueEntry[] {
    return db.getAll<QueueEntry>(this.queueCollection);
  }

  public findById(id: string): QueueEntry | undefined {
    return db.getById<QueueEntry>(this.queueCollection, id);
  }

  public findByItemId(itemId: string): QueueEntry[] {
    return db
      .findMany<QueueEntry>(this.queueCollection, (entry) => entry.itemId === itemId)
      .sort((a, b) => a.position - b.position);
  }

  public findActiveByItemId(itemId: string): QueueEntry[] {
    return db
      .findMany<QueueEntry>(
        this.queueCollection,
        (entry) =>
          entry.itemId === itemId &&
          (entry.status === 'waiting' || entry.status === 'notified')
      )
      .sort((a, b) => a.position - b.position);
  }

  public findByUserId(userId: string): QueueEntry[] {
    return db
      .findMany<QueueEntry>(this.queueCollection, (entry) => entry.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public findActiveByUserId(userId: string): QueueEntry[] {
    return db.findMany<QueueEntry>(
      this.queueCollection,
      (entry) =>
        entry.userId === userId &&
        (entry.status === 'waiting' || entry.status === 'notified')
    );
  }

  public findNextWaiting(itemId: string): QueueEntry | undefined {
    const active = this.findActiveByItemId(itemId);
    return active.find((entry) => entry.status === 'waiting');
  }

  public findNotifiedByItemId(itemId: string): QueueEntry | undefined {
    const active = this.findActiveByItemId(itemId);
    return active.find((entry) => entry.status === 'notified');
  }

  public create(data: Omit<QueueEntry, 'id' | 'position' | 'status' | 'createdAt'>): QueueEntry {
    const activeEntries = this.findActiveByItemId(data.itemId);
    const position = activeEntries.length + 1;

    const entry: QueueEntry = {
      id: generateId(),
      ...data,
      position,
      status: 'waiting',
      createdAt: getCurrentTime(),
    };

    return db.insert<QueueEntry>(this.queueCollection, entry);
  }

  public update(id: string, updates: Partial<QueueEntry>): QueueEntry | undefined {
    return db.update<QueueEntry>(this.queueCollection, id, updates);
  }

  public updatePositionsAfterRemove(itemId: string): void {
    const active = this.findActiveByItemId(itemId);
    active.forEach((entry, index) => {
      if (entry.position !== index + 1) {
        this.update(entry.id, { position: index + 1 });
      }
    });
  }

  public createNotification(data: Omit<QueueNotification, 'id' | 'read' | 'createdAt'>): QueueNotification {
    const notification: QueueNotification = {
      id: generateId(),
      ...data,
      read: false,
      createdAt: getCurrentTime(),
    };
    return db.insert<QueueNotification>(this.notificationCollection, notification);
  }

  public findNotificationsByUserId(userId: string): QueueNotification[] {
    return db
      .findMany<QueueNotification>(this.notificationCollection, (n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public markNotificationAsRead(id: string): QueueNotification | undefined {
    return db.update<QueueNotification>(this.notificationCollection, id, { read: true });
  }

  public markAllNotificationsAsRead(userId: string): void {
    const notifications = this.findNotificationsByUserId(userId);
    notifications.forEach((n) => {
      if (!n.read) {
        this.markNotificationAsRead(n.id);
      }
    });
  }

  public toQueueEntryWithDetails(entry: QueueEntry): QueueEntryWithDetails {
    const item = itemRepository.findById(entry.itemId);
    const user = userRepository.findById(entry.userId);

    return {
      ...entry,
      item: item ? itemRepository.toItemWithOwner(item) : {} as any,
      user: user ? userRepository.toPublicUser(user) : {} as any,
    };
  }

  public checkDuplicateQueue(itemId: string, userId: string): boolean {
    const existing = db.findMany<QueueEntry>(
      this.queueCollection,
      (entry) =>
        entry.itemId === itemId &&
        entry.userId === userId &&
        (entry.status === 'waiting' || entry.status === 'notified')
    );
    return existing.length > 0;
  }
}

export const queueRepository = new QueueRepository();
