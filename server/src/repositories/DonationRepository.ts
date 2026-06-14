import { db } from '../utils/db';
import { Donation, DonationWithDetails, DonationFilterParams, DonationSortParams, DonationPaginationParams, PaginatedResult } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { userRepository } from './UserRepository';
import { itemRepository } from './ItemRepository';

export class DonationRepository {
  private collection = 'donations';

  public findAll(): Donation[] {
    return db.getAll<Donation>(this.collection);
  }

  public findById(id: string): Donation | undefined {
    return db.getById<Donation>(this.collection, id);
  }

  public findByDonorId(donorId: string): Donation[] {
    return db.findMany<Donation>(this.collection, (donation) => donation.donorId === donorId);
  }

  public findByRecipientId(recipientId: string): Donation[] {
    return db.findMany<Donation>(this.collection, (donation) => donation.recipientId === recipientId);
  }

  public findByItemId(itemId: string): Donation | undefined {
    return db.findOne<Donation>(this.collection, (donation) => donation.itemId === itemId && donation.status !== 'cancelled' && donation.status !== 'completed');
  }

  public findByApplicantId(applicantId: string): Donation[] {
    return db.findMany<Donation>(this.collection, (donation) => donation.applicantIds.includes(applicantId));
  }

  public findWithFilters(
    filters: DonationFilterParams,
    sort: DonationSortParams,
    pagination: DonationPaginationParams
  ): PaginatedResult<Donation> {
    let donations = this.findAll().filter(d => d.status !== 'cancelled' && d.status !== 'completed');

    if (filters.status) {
      donations = donations.filter(donation => donation.status === filters.status);
    }

    const itemIds = donations.map(d => d.itemId);
    const items = itemRepository.findAll().filter(item => itemIds.includes(item.id));
    const itemMap = new Map(items.map(item => [item.id, item]));

    if (filters.category && filters.category !== 'all') {
      donations = donations.filter(donation => {
        const item = itemMap.get(donation.itemId);
        return item && item.category === filters.category;
      });
    }

    if (filters.keyword) {
      const lowerKeyword = filters.keyword.toLowerCase();
      donations = donations.filter(donation => {
        const item = itemMap.get(donation.itemId);
        if (!item) return false;
        return item.title.toLowerCase().includes(lowerKeyword) ||
               item.description.toLowerCase().includes(lowerKeyword);
      });
    }

    if (filters.userNeighborhood) {
      donations = donations.filter(donation => {
        const donor = userRepository.findById(donation.donorId);
        if (!donor) return false;
        return donor.neighborhood === filters.userNeighborhood;
      });
    }

    const sortBy = sort.sortBy || 'createdAt';
    const sortOrder = sort.sortOrder || 'desc';

    donations.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'viewCount':
          const itemA = itemMap.get(a.itemId);
          const itemB = itemMap.get(b.itemId);
          comparison = (itemA?.viewCount || 0) - (itemB?.viewCount || 0);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const total = donations.length;
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 10;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedDonations = donations.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedDonations,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  public create(donationData: Omit<Donation, 'id' | 'createdAt' | 'applicantIds' | 'status'>): Donation {
    const donation: Donation = {
      id: generateId(),
      ...donationData,
      applicantIds: [],
      status: 'available',
      createdAt: getCurrentTime(),
    };
    return db.insert<Donation>(this.collection, donation);
  }

  public update(id: string, updates: Partial<Donation>): Donation | undefined {
    return db.update<Donation>(this.collection, id, updates);
  }

  public addApplicant(donationId: string, applicantId: string): Donation | undefined {
    const donation = this.findById(donationId);
    if (!donation) return undefined;
    if (!donation.applicantIds.includes(applicantId)) {
      donation.applicantIds.push(applicantId);
      return this.update(donationId, { applicantIds: donation.applicantIds });
    }
    return donation;
  }

  public removeApplicant(donationId: string, applicantId: string): Donation | undefined {
    const donation = this.findById(donationId);
    if (!donation) return undefined;
    donation.applicantIds = donation.applicantIds.filter(id => id !== applicantId);
    return this.update(donationId, { applicantIds: donation.applicantIds });
  }

  public toDonationWithDetails(donation: Donation): DonationWithDetails {
    const item = itemRepository.findById(donation.itemId);
    const donor = userRepository.findById(donation.donorId);
    const recipient = donation.recipientId ? userRepository.findById(donation.recipientId) : undefined;
    const applicants = donation.applicantIds
      .map(id => userRepository.findById(id))
      .filter(Boolean)
      .map(user => userRepository.toPublicUser(user!));

    return {
      ...donation,
      item: item ? itemRepository.toItemWithOwner(item) : {} as any,
      donor: donor ? userRepository.toPublicUser(donor) : {} as any,
      recipient: recipient ? userRepository.toPublicUser(recipient) : undefined,
      applicants,
    };
  }
}

export const donationRepository = new DonationRepository();
