import { donationRepository } from '../repositories/DonationRepository';
import { itemRepository } from '../repositories/ItemRepository';
import { Donation, DonationWithDetails, DonationFilterParams, DonationSortParams, DonationPaginationParams, PaginatedResult } from '../types';
import { getCurrentTime } from '../utils/helpers';
import { notificationService } from './NotificationService';
import { creditService } from './CreditService';

export class DonationService {
  private statusText: Record<string, string> = {
    available: '待领取',
    pending_approval: '待确认',
    approved: '已确认',
    meeting: '待交接',
    completed: '已完成',
    cancelled: '已取消',
  };

  public getDonations(
    filters: DonationFilterParams,
    sort: DonationSortParams,
    pagination: DonationPaginationParams
  ): PaginatedResult<DonationWithDetails> {
    const result = donationRepository.findWithFilters(filters, sort, pagination);
    return {
      ...result,
      items: result.items.map(donation => donationRepository.toDonationWithDetails(donation)),
    };
  }

  public getDonationById(id: string): DonationWithDetails | null {
    const donation = donationRepository.findById(id);
    if (!donation) return null;
    const item = itemRepository.findById(donation.itemId);
    if (item) {
      itemRepository.incrementViewCount(donation.itemId);
    }
    return donationRepository.toDonationWithDetails(donation);
  }

  public getDonationsByDonor(donorId: string): DonationWithDetails[] {
    const donations = donationRepository.findByDonorId(donorId);
    return donations.map(donation => donationRepository.toDonationWithDetails(donation));
  }

  public getDonationsByRecipient(recipientId: string): DonationWithDetails[] {
    const donations = donationRepository.findByRecipientId(recipientId);
    return donations.map(donation => donationRepository.toDonationWithDetails(donation));
  }

  public getDonationsByApplicant(applicantId: string): DonationWithDetails[] {
    const donations = donationRepository.findByApplicantId(applicantId);
    return donations.map(donation => donationRepository.toDonationWithDetails(donation));
  }

  public createDonation(donorId: string, itemId: string, donorNotes?: string): DonationWithDetails | null {
    const item = itemRepository.findById(itemId);
    if (!item || item.ownerId !== donorId) {
      throw new Error('物品不存在或无权限');
    }
    if (item.status !== 'available') {
      throw new Error('物品当前状态不可捐赠');
    }

    const existingDonation = donationRepository.findByItemId(itemId);
    if (existingDonation) {
      throw new Error('该物品已发布捐赠');
    }

    itemRepository.update(itemId, { isDonation: true });

    const donation = donationRepository.create({
      itemId,
      donorId,
      donorNotes,
    });

    return donationRepository.toDonationWithDetails(donation);
  }

  public applyForDonation(applicantId: string, donationId: string): DonationWithDetails | null {
    const donation = donationRepository.findById(donationId);
    if (!donation) {
      throw new Error('捐赠不存在');
    }
    if (donation.status !== 'available') {
      throw new Error('该捐赠当前不可申请');
    }
    if (donation.donorId === applicantId) {
      throw new Error('不能申请自己发布的捐赠');
    }
    if (donation.applicantIds.includes(applicantId)) {
      throw new Error('您已申请过该捐赠');
    }

    const updatedDonation = donationRepository.addApplicant(donationId, applicantId);
    if (!updatedDonation) return null;

    if (updatedDonation.status === 'available' && updatedDonation.applicantIds.length > 0) {
      donationRepository.update(donationId, { status: 'pending_approval' });
    }

    notificationService.sendDonationStatusNotification(
      donation.donorId,
      donationId,
      'pending_approval',
      donationRepository.toDonationWithDetails(updatedDonation).item.title
    );

    return donationRepository.toDonationWithDetails(updatedDonation);
  }

  public approveApplicant(
    donorId: string,
    donationId: string,
    recipientId: string,
    meetLocation: string,
    meetTime: string
  ): DonationWithDetails | null {
    const donation = donationRepository.findById(donationId);
    if (!donation) {
      throw new Error('捐赠不存在');
    }
    if (donation.donorId !== donorId) {
      throw new Error('无权限操作此捐赠');
    }
    if (donation.status !== 'pending_approval') {
      throw new Error('捐赠状态不允许确认');
    }
    if (!donation.applicantIds.includes(recipientId)) {
      throw new Error('该用户未申请此捐赠');
    }
    if (!meetLocation || !meetTime) {
      throw new Error('请填写交接地点和时间');
    }

    const updatedDonation = donationRepository.update(donationId, {
      recipientId,
      status: 'approved',
      meetLocation,
      meetTime,
      approvedAt: getCurrentTime(),
    });
    if (!updatedDonation) return null;

    const item = itemRepository.findById(donation.itemId);
    if (item) {
      itemRepository.update(donation.itemId, { status: 'donated' });
    }

    const otherApplicants = donation.applicantIds.filter(id => id !== recipientId);
    otherApplicants.forEach(applicantId => {
      notificationService.sendDonationStatusNotification(
        applicantId,
        donationId,
        'rejected',
        donationRepository.toDonationWithDetails(updatedDonation).item.title
      );
    });

    notificationService.sendDonationStatusNotification(
      recipientId,
      donationId,
      'approved',
      donationRepository.toDonationWithDetails(updatedDonation).item.title
    );

    return donationRepository.toDonationWithDetails(updatedDonation);
  }

  public startMeeting(donorId: string, donationId: string): DonationWithDetails | null {
    const donation = donationRepository.findById(donationId);
    if (!donation) {
      throw new Error('捐赠不存在');
    }
    if (donation.donorId !== donorId) {
      throw new Error('无权限操作此捐赠');
    }
    if (donation.status !== 'approved') {
      throw new Error('捐赠状态不允许开始交接');
    }

    const updatedDonation = donationRepository.update(donationId, {
      status: 'meeting',
    });
    if (!updatedDonation) return null;

    if (donation.recipientId) {
      notificationService.sendDonationStatusNotification(
        donation.recipientId,
        donationId,
        'meeting',
        donationRepository.toDonationWithDetails(updatedDonation).item.title
      );
    }

    return donationRepository.toDonationWithDetails(updatedDonation);
  }

  public completeDonation(donorId: string, donationId: string): DonationWithDetails | null {
    const donation = donationRepository.findById(donationId);
    if (!donation) {
      throw new Error('捐赠不存在');
    }
    if (donation.donorId !== donorId) {
      throw new Error('无权限操作此捐赠');
    }
    if (donation.status !== 'meeting' && donation.status !== 'approved') {
      throw new Error('捐赠状态不允许完成');
    }

    const updatedDonation = donationRepository.update(donationId, {
      status: 'completed',
      completedAt: getCurrentTime(),
    });
    if (!updatedDonation) return null;

    itemRepository.incrementDonateCount(donation.itemId);

    creditService.rewardCredit(donorId, 5, '完成物品捐赠');
    if (donation.recipientId) {
      creditService.rewardCredit(donation.recipientId, 3, '领取捐赠物品');

      notificationService.sendDonationStatusNotification(
        donation.recipientId,
        donationId,
        'completed',
        donationRepository.toDonationWithDetails(updatedDonation).item.title
      );
    }

    notificationService.sendDonationStatusNotification(
      donorId,
      donationId,
      'completed',
      donationRepository.toDonationWithDetails(updatedDonation).item.title
    );

    return donationRepository.toDonationWithDetails(updatedDonation);
  }

  public cancelDonation(userId: string, donationId: string, reason?: string): DonationWithDetails | null {
    const donation = donationRepository.findById(donationId);
    if (!donation) {
      throw new Error('捐赠不存在');
    }
    if (donation.donorId !== userId) {
      throw new Error('无权限取消此捐赠');
    }
    if (donation.status === 'completed' || donation.status === 'cancelled') {
      throw new Error('该捐赠不可取消');
    }

    const updatedDonation = donationRepository.update(donationId, {
      status: 'cancelled',
      cancelledAt: getCurrentTime(),
    });
    if (!updatedDonation) return null;

    const item = itemRepository.findById(donation.itemId);
    if (item && item.status === 'donated') {
      itemRepository.update(donation.itemId, { status: 'available' });
    }

    donation.applicantIds.forEach(applicantId => {
      notificationService.sendDonationStatusNotification(
        applicantId,
        donationId,
        'cancelled',
        donationRepository.toDonationWithDetails(updatedDonation).item.title
      );
    });

    return donationRepository.toDonationWithDetails(updatedDonation);
  }

  public cancelApplication(applicantId: string, donationId: string): DonationWithDetails | null {
    const donation = donationRepository.findById(donationId);
    if (!donation) {
      throw new Error('捐赠不存在');
    }
    if (!donation.applicantIds.includes(applicantId)) {
      throw new Error('您未申请此捐赠');
    }
    if (donation.status === 'approved' && donation.recipientId === applicantId) {
      throw new Error('您的申请已被确认，如需取消请联系捐赠者');
    }
    if (donation.status === 'completed' || donation.status === 'cancelled') {
      throw new Error('该捐赠已结束');
    }

    const updatedDonation = donationRepository.removeApplicant(donationId, applicantId);
    if (!updatedDonation) return null;

    if (updatedDonation.applicantIds.length === 0 && updatedDonation.status === 'pending_approval') {
      donationRepository.update(donationId, { status: 'available' });
    }

    return donationRepository.toDonationWithDetails(updatedDonation);
  }
}

export const donationService = new DonationService();
