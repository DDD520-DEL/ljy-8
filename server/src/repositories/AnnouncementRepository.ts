import { db } from '../utils/db';
import { Announcement, AnnouncementCategory, AnnouncementPaginationParams, PaginatedResult } from '../types';
import { generateId } from '../utils/helpers';

const COLLECTION = 'announcements';

export class AnnouncementRepository {
  public findAll(params: AnnouncementPaginationParams = {}): PaginatedResult<Announcement> {
    let announcements = db.getAll<Announcement>(COLLECTION);

    if (params.category) {
      announcements = announcements.filter(a => a.category === params.category);
    }

    announcements = announcements.filter(a => a.status === 'published');

    const sortOrder = params.sortOrder || 'desc';
    announcements.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = announcements.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const items = announcements.slice(startIndex, startIndex + pageSize);

    return { items, total, page, pageSize, totalPages };
  }

  public findAllAdmin(params: AnnouncementPaginationParams = {}): PaginatedResult<Announcement> {
    let announcements = db.getAll<Announcement>(COLLECTION);

    if (params.category) {
      announcements = announcements.filter(a => a.category === params.category);
    }

    const sortOrder = params.sortOrder || 'desc';
    announcements.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = announcements.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const items = announcements.slice(startIndex, startIndex + pageSize);

    return { items, total, page, pageSize, totalPages };
  }

  public findLatest(limit: number = 5): Announcement[] {
    let announcements = db.getAll<Announcement>(COLLECTION);
    announcements = announcements.filter(a => a.status === 'published');
    announcements.sort((a, b) => {
      const priorityOrder = { urgent: 0, important: 1, normal: 2 };
      const priorityA = priorityOrder[a.priority];
      const priorityB = priorityOrder[b.priority];
      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return announcements.slice(0, limit);
  }

  public findById(id: string): Announcement | undefined {
    return db.getById<Announcement>(COLLECTION, id);
  }

  public create(data: {
    title: string;
    content: string;
    category: AnnouncementCategory;
    priority: 'normal' | 'important' | 'urgent';
    publisherId: string;
    status: 'published' | 'draft' | 'archived';
  }): Announcement {
    const now = new Date().toISOString();
    const announcement: Announcement = {
      id: generateId(),
      title: data.title,
      content: data.content,
      category: data.category,
      priority: data.priority,
      publisherId: data.publisherId,
      status: data.status,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    return db.insert<Announcement>(COLLECTION, announcement);
  }

  public update(id: string, updates: Partial<Announcement>): Announcement | undefined {
    const now = new Date().toISOString();
    return db.update<Announcement>(COLLECTION, id, { ...updates, updatedAt: now });
  }

  public incrementViewCount(id: string): Announcement | undefined {
    const announcement = this.findById(id);
    if (!announcement) return undefined;
    return this.update(id, { viewCount: announcement.viewCount + 1 });
  }

  public delete(id: string): boolean {
    return db.delete(COLLECTION, id);
  }
}

export const announcementRepository = new AnnouncementRepository();
