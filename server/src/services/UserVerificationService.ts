import { userVerificationRepository } from '../repositories/UserVerificationRepository';
import { userRepository } from '../repositories/UserRepository';
import {
  UserVerification,
  UserVerificationWithUser,
  VerificationStatus,
  VerificationPaginationParams,
  PaginatedResult,
} from '../types';
import { notificationService } from './NotificationService';
import { getCurrentTime } from '../utils/helpers';

export class UserVerificationService {
  public getMyVerification(userId: string): UserVerification | null {
    const verification = userVerificationRepository.findByUserId(userId);
    return verification || null;
  }

  public submitVerification(
    userId: string,
    realName: string,
    houseNumber: string
  ): UserVerification {
    const user = userRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const existingPending = userVerificationRepository.findPendingByUserId(userId);
    if (existingPending) {
      throw new Error('您已有待审核的认证申请，请耐心等待');
    }

    const verification = userVerificationRepository.create({
      userId,
      realName,
      houseNumber,
    });

    return verification;
  }

  public getVerificationList(
    status?: VerificationStatus,
    page: number = 1,
    pageSize: number = 10
  ): PaginatedResult<UserVerificationWithUser> {
    const result = userVerificationRepository.findWithFilters(
      { status },
      { page, pageSize }
    );
    return {
      ...result,
      items: result.items.map((v) => userVerificationRepository.toVerificationWithUser(v)),
    };
  }

  public getVerificationById(id: string): UserVerificationWithUser | null {
    const verification = userVerificationRepository.findById(id);
    if (!verification) return null;
    return userVerificationRepository.toVerificationWithUser(verification);
  }

  public reviewVerification(
    id: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    rejectReason?: string
  ): UserVerificationWithUser | null {
    const verification = userVerificationRepository.findById(id);
    if (!verification) {
      throw new Error('认证申请不存在');
    }

    if (verification.status !== 'pending') {
      throw new Error('该认证申请已被审核');
    }

    const updated = userVerificationRepository.update(id, {
      status,
      rejectReason,
      reviewedBy: reviewerId,
      reviewedAt: getCurrentTime(),
    });

    if (!updated) return null;

    if (status === 'approved') {
      userRepository.update(verification.userId, {
        isVerified: true,
        realName: verification.realName,
        houseNumber: verification.houseNumber,
      });
      notificationService.sendSystemNotification(
        verification.userId,
        '身份认证已通过',
        `恭喜！您的身份认证申请已通过审核，您的账号已获得认证标识，发布的物品和技能将获得优先展示。`
      );
    } else {
      notificationService.sendSystemNotification(
        verification.userId,
        '身份认证未通过',
        `很遗憾，您的身份认证申请未通过审核。原因：${rejectReason || '信息不符合要求'}。请修改后重新提交。`
      );
    }

    return userVerificationRepository.toVerificationWithUser(updated);
  }
}

export const userVerificationService = new UserVerificationService();
