import { disputeRepository } from '../repositories/DisputeRepository';
import { orderRepository } from '../repositories/OrderRepository';
import { Dispute, DisputeWithDetails, DisputeStatus } from '../types';
import { timeCoinService } from './TimeCoinService';
import { notificationService } from './NotificationService';

export class DisputeService {
  private statusText: Record<DisputeStatus, string> = {
    pending: '待处理',
    reviewing: '审核中',
    resolved: '已解决',
  };
  public getDisputes(userId: string, role?: 'complainant' | 'respondent' | 'all'): DisputeWithDetails[] {
    let disputes;
    
    if (role === 'complainant') {
      disputes = disputeRepository.findByComplainantId(userId);
    } else if (role === 'respondent') {
      disputes = disputeRepository.findByRespondentId(userId);
    } else {
      const complainantDisputes = disputeRepository.findByComplainantId(userId);
      const respondentDisputes = disputeRepository.findByRespondentId(userId);
      disputes = [...complainantDisputes, ...respondentDisputes];
    }
    
    return disputes.map(dispute => disputeRepository.toDisputeWithDetails(dispute));
  }

  public getAllDisputes(status?: string): DisputeWithDetails[] {
    let disputes = disputeRepository.findAll();
    if (status) {
      disputes = disputes.filter(d => d.status === status);
    }
    return disputes.map(dispute => disputeRepository.toDisputeWithDetails(dispute));
  }

  public getDisputeById(id: string): DisputeWithDetails | null {
    const dispute = disputeRepository.findById(id);
    return dispute ? disputeRepository.toDisputeWithDetails(dispute) : null;
  }

  public createDispute(
    complainantId: string,
    disputeData: Omit<Dispute, 'id' | 'complainantId' | 'createdAt' | 'status'>
  ): DisputeWithDetails | null {
    let respondentId: string | undefined;
    let orderTitle = '';
    
    if (disputeData.orderType === 'borrow') {
      const order = orderRepository.findBorrowOrderById(disputeData.orderId);
      if (order) {
        respondentId = order.borrowerId === complainantId ? order.lenderId : order.borrowerId;
        orderRepository.updateBorrowOrder(disputeData.orderId, { status: 'disputed' });
        const item = orderRepository.toBorrowOrderWithDetails(order).item;
        orderTitle = item?.title || '';
      }
    } else {
      const order = orderRepository.findServiceOrderById(disputeData.orderId);
      if (order) {
        respondentId = order.clientId === complainantId ? order.providerId : order.clientId;
        orderRepository.updateServiceOrder(disputeData.orderId, { status: 'disputed' });
        const skill = orderRepository.toServiceOrderWithDetails(order).skill;
        orderTitle = skill?.title || '';
      }
    }

    if (!respondentId) {
      throw new Error('订单不存在');
    }

    const dispute = disputeRepository.create({
      ...disputeData,
      complainantId,
      respondentId,
    });

    notificationService.sendDisputeStatusNotification(
      respondentId,
      dispute.id,
      this.statusText.pending,
      orderTitle
    );

    return disputeRepository.toDisputeWithDetails(dispute);
  }

  public resolveDispute(
    disputeId: string,
    resolverId: string,
    resolution: string,
    refundTimeCoins?: number,
    refundDeposit?: number
  ): DisputeWithDetails | null {
    const dispute = disputeRepository.findById(disputeId);
    if (!dispute || dispute.status === 'resolved') {
      return null;
    }

    if (dispute.orderType === 'service' && refundTimeCoins) {
      timeCoinService.addCoins(dispute.complainantId, refundTimeCoins);
    }

    disputeRepository.update(disputeId, {
      status: 'resolved' as DisputeStatus,
      resolution,
      resolverId,
    });

    if (dispute.orderType === 'borrow') {
      const order = orderRepository.findBorrowOrderById(dispute.orderId);
      if (order && order.status === 'disputed') {
        orderRepository.updateBorrowOrder(dispute.orderId, { status: 'returned' });
      }
    } else {
      const order = orderRepository.findServiceOrderById(dispute.orderId);
      if (order && order.status === 'disputed') {
        orderRepository.updateServiceOrder(dispute.orderId, { status: 'completed' });
      }
    }

    let orderTitle = '';
    if (dispute.orderType === 'borrow') {
      const order = orderRepository.findBorrowOrderById(dispute.orderId);
      if (order) {
        const item = orderRepository.toBorrowOrderWithDetails(order).item;
        orderTitle = item?.title || '';
      }
    } else {
      const order = orderRepository.findServiceOrderById(dispute.orderId);
      if (order) {
        const skill = orderRepository.toServiceOrderWithDetails(order).skill;
        orderTitle = skill?.title || '';
      }
    }

    notificationService.sendDisputeStatusNotification(
      dispute.complainantId,
      disputeId,
      this.statusText.resolved,
      orderTitle
    );
    notificationService.sendDisputeStatusNotification(
      dispute.respondentId,
      disputeId,
      this.statusText.resolved,
      orderTitle
    );

    const updated = disputeRepository.findById(disputeId);
    return updated ? disputeRepository.toDisputeWithDetails(updated) : null;
  }

  public startReview(disputeId: string, resolverId: string): DisputeWithDetails | null {
    const dispute = disputeRepository.findById(disputeId);
    if (!dispute || dispute.status !== 'pending') {
      return null;
    }

    disputeRepository.update(disputeId, {
      status: 'reviewing' as DisputeStatus,
      resolverId,
    });

    let orderTitle = '';
    if (dispute.orderType === 'borrow') {
      const order = orderRepository.findBorrowOrderById(dispute.orderId);
      if (order) {
        const item = orderRepository.toBorrowOrderWithDetails(order).item;
        orderTitle = item?.title || '';
      }
    } else {
      const order = orderRepository.findServiceOrderById(dispute.orderId);
      if (order) {
        const skill = orderRepository.toServiceOrderWithDetails(order).skill;
        orderTitle = skill?.title || '';
      }
    }

    notificationService.sendDisputeStatusNotification(
      dispute.complainantId,
      disputeId,
      this.statusText.reviewing,
      orderTitle
    );
    notificationService.sendDisputeStatusNotification(
      dispute.respondentId,
      disputeId,
      this.statusText.reviewing,
      orderTitle
    );

    const updated = disputeRepository.findById(disputeId);
    return updated ? disputeRepository.toDisputeWithDetails(updated) : null;
  }
}

export const disputeService = new DisputeService();
