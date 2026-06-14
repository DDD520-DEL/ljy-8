import { db } from '../utils/db';
import {
  Activity,
  ActivityRegistration,
  ActivityPhoto,
  ActivityWithDetails,
  ActivityRegistrationWithUser,
  ActivityPhotoWithUser,
  ActivityFilterParams,
  ActivitySortParams,
  ActivityPaginationParams,
  PaginatedResult,
} from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { userRepository } from './UserRepository';

export class ActivityRepository {
  private activityCollection = 'activities';
  private registrationCollection = 'activityRegistrations';
  private photoCollection = 'activityPhotos';

  public findAllActivities(): Activity[] {
    return db.getAll<Activity>(this.activityCollection);
  }

  public findActivityById(id: string): Activity | undefined {
    return db.getById<Activity>(this.activityCollection, id);
  }

  public findActivitiesByOrganizerId(organizerId: string): Activity[] {
    return db.findMany<Activity>(this.activityCollection, (activity) => activity.organizerId === organizerId);
  }

  public findActivitiesWithFilters(
    filters: ActivityFilterParams,
    sort: ActivitySortParams,
    pagination: ActivityPaginationParams
  ): PaginatedResult<Activity> {
    let activities = this.findAllActivities().filter(a => a.status !== 'cancelled');

    if (filters.status) {
      activities = activities.filter(activity => activity.status === filters.status);
    }

    if (filters.category && filters.category !== 'all') {
      activities = activities.filter(activity => activity.category === filters.category);
    }

    if (filters.keyword) {
      const lowerKeyword = filters.keyword.toLowerCase();
      activities = activities.filter(activity =>
        activity.title.toLowerCase().includes(lowerKeyword) ||
        activity.description.toLowerCase().includes(lowerKeyword)
      );
    }

    if (filters.userNeighborhood) {
      activities = activities.filter(activity => {
        const organizer = userRepository.findById(activity.organizerId);
        if (!organizer) return false;
        return organizer.neighborhood === filters.userNeighborhood;
      });
    }

    const sortBy = sort.sortBy || 'createdAt';
    const sortOrder = sort.sortOrder || 'desc';

    activities.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'startTime':
          comparison = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
          break;
        case 'viewCount':
          comparison = a.viewCount - b.viewCount;
          break;
        case 'maxParticipants':
          comparison = a.maxParticipants - b.maxParticipants;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const total = activities.length;
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 10;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedActivities = activities.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedActivities,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  public createActivity(activityData: Omit<Activity, 'id' | 'currentParticipants' | 'status' | 'viewCount' | 'createdAt' | 'updatedAt'>): Activity {
    const activity: Activity = {
      id: generateId(),
      ...activityData,
      currentParticipants: 0,
      status: 'recruiting',
      viewCount: 0,
      createdAt: getCurrentTime(),
      updatedAt: getCurrentTime(),
    };
    return db.insert<Activity>(this.activityCollection, activity);
  }

  public updateActivity(id: string, updates: Partial<Activity>): Activity | undefined {
    return db.update<Activity>(this.activityCollection, id, {
      ...updates,
      updatedAt: getCurrentTime(),
    });
  }

  public incrementViewCount(id: string): void {
    const activity = this.findActivityById(id);
    if (activity) {
      this.updateActivity(id, { viewCount: activity.viewCount + 1 });
    }
  }

  public updateActivityStatus(id: string, status: Activity['status']): Activity | undefined {
    return this.updateActivity(id, { status });
  }

  public findRegistrationsByActivityId(activityId: string): ActivityRegistration[] {
    return db.findMany<ActivityRegistration>(
      this.registrationCollection,
      (reg) => reg.activityId === activityId && reg.status !== 'cancelled'
    );
  }

  public findRegistrationByActivityAndUser(activityId: string, userId: string): ActivityRegistration | undefined {
    return db.findOne<ActivityRegistration>(
      this.registrationCollection,
      (reg) => reg.activityId === activityId && reg.userId === userId && reg.status !== 'cancelled'
    );
  }

  public findRegistrationsByUserId(userId: string): ActivityRegistration[] {
    return db.findMany<ActivityRegistration>(
      this.registrationCollection,
      (reg) => reg.userId === userId && reg.status !== 'cancelled'
    );
  }

  public createRegistration(activityId: string, userId: string): ActivityRegistration {
    const registration: ActivityRegistration = {
      id: generateId(),
      activityId,
      userId,
      status: 'registered',
      registeredAt: getCurrentTime(),
    };
    return db.insert<ActivityRegistration>(this.registrationCollection, registration);
  }

  public cancelRegistration(registrationId: string): ActivityRegistration | undefined {
    return db.update<ActivityRegistration>(this.registrationCollection, registrationId, {
      status: 'cancelled',
      cancelledAt: getCurrentTime(),
    });
  }

  public updateRegistrationStatus(registrationId: string, status: ActivityRegistration['status']): ActivityRegistration | undefined {
    return db.update<ActivityRegistration>(this.registrationCollection, registrationId, { status });
  }

  public findPhotosByActivityId(activityId: string): ActivityPhoto[] {
    return db.findMany<ActivityPhoto>(this.photoCollection, (photo) => photo.activityId === activityId);
  }

  public findPhotoById(id: string): ActivityPhoto | undefined {
    return db.getById<ActivityPhoto>(this.photoCollection, id);
  }

  public createPhoto(photoData: Omit<ActivityPhoto, 'id' | 'createdAt'>): ActivityPhoto {
    const photo: ActivityPhoto = {
      id: generateId(),
      ...photoData,
      createdAt: getCurrentTime(),
    };
    return db.insert<ActivityPhoto>(this.photoCollection, photo);
  }

  public deletePhoto(id: string): boolean {
    return db.delete(this.photoCollection, id);
  }

  public toActivityWithDetails(activity: Activity, currentUserId?: string): ActivityWithDetails {
    const organizer = userRepository.findById(activity.organizerId);
    const registrations = this.findRegistrationsByActivityId(activity.id)
      .map(reg => this.toRegistrationWithUser(reg))
      .filter(Boolean) as ActivityRegistrationWithUser[];
    const photos = this.findPhotosByActivityId(activity.id)
      .map(photo => this.toPhotoWithUser(photo))
      .filter(Boolean) as ActivityPhotoWithUser[];

    const isRegistered = currentUserId
      ? !!this.findRegistrationByActivityAndUser(activity.id, currentUserId)
      : undefined;

    return {
      ...activity,
      organizer: organizer ? userRepository.toPublicUser(organizer) : {} as any,
      registrations,
      photos,
      isRegistered,
    };
  }

  public toRegistrationWithUser(registration: ActivityRegistration): ActivityRegistrationWithUser | null {
    const user = userRepository.findById(registration.userId);
    if (!user) return null;
    return {
      ...registration,
      user: userRepository.toPublicUser(user),
    };
  }

  public toPhotoWithUser(photo: ActivityPhoto): ActivityPhotoWithUser | null {
    const user = userRepository.findById(photo.userId);
    if (!user) return null;
    return {
      ...photo,
      user: userRepository.toPublicUser(user),
    };
  }
}

export const activityRepository = new ActivityRepository();
