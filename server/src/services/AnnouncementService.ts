import { announcementRepository } from '../repositories/AnnouncementRepository';
import { userRepository } from '../repositories/UserRepository';
import {
  Announcement,
  AnnouncementWithPublisher,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  AnnouncementPaginationParams,
  PaginatedResult,
} from '../types';

export class AnnouncementService {
  private getPublisher(announcement: Announcement): AnnouncementWithPublisher {
    const publisher = userRepository.findById(announcement.publisherId);
    return {
      ...announcement,
      publisher: publisher
        ? userRepository.toPublicUser(publisher)
        : {
            id: announcement.publisherId,
            nickname: '未知用户',
            avatar: '',
            creditScore: 0,
            creditLevel: 'B',
            neighborhood: '',
            role: 'user',
            createdAt: '',
            isVerified: false,
          },
    };
  }

  public getAnnouncements(params: AnnouncementPaginationParams = {}): PaginatedResult<AnnouncementWithPublisher> {
    const result = announcementRepository.findAll(params);
    return {
      ...result,
      items: result.items.map((a) => this.getPublisher(a)),
    };
  }

  public getAllAnnouncementsAdmin(params: AnnouncementPaginationParams = {}): PaginatedResult<AnnouncementWithPublisher> {
    const result = announcementRepository.findAllAdmin(params);
    return {
      ...result,
      items: result.items.map((a) => this.getPublisher(a)),
    };
  }

  public getLatestAnnouncements(limit: number = 5): AnnouncementWithPublisher[] {
    return announcementRepository.findLatest(limit).map((a) => this.getPublisher(a));
  }

  public getAnnouncementById(id: string): AnnouncementWithPublisher | null {
    const announcement = announcementRepository.findById(id);
    if (!announcement) return null;
    const updated = announcementRepository.incrementViewCount(id);
    return this.getPublisher(updated || announcement);
  }

  public createAnnouncement(publisherId: string, data: CreateAnnouncementRequest): AnnouncementWithPublisher {
    const announcement = announcementRepository.create({
      ...data,
      publisherId,
      status: data.status || 'published',
    });
    return this.getPublisher(announcement);
  }

  public updateAnnouncement(id: string, data: UpdateAnnouncementRequest): AnnouncementWithPublisher | null {
    const announcement = announcementRepository.findById(id);
    if (!announcement) return null;
    const updated = announcementRepository.update(id, data);
    if (!updated) return null;
    return this.getPublisher(updated);
  }

  public deleteAnnouncement(id: string): boolean {
    const announcement = announcementRepository.findById(id);
    if (!announcement) return false;
    return announcementRepository.delete(id);
  }
}

export const announcementService = new AnnouncementService();
