import { disputeRepository } from '../repositories/DisputeRepository';
import { orderRepository } from '../repositories/OrderRepository';
import { 
  Dispute, 
  DisputeWithDetails, 
  DisputeStatus,
  NegotiationMessage,
  DisputeNegotiation,
  NegotiationStatus
} from '../types';
import { timeCoinService } from './TimeCoinService';
import { transactionService } from './TransactionService';
import { notificationService } from './NotificationService';
import { generateId, getCurrentTime } from '../utils/helpers';
import { BorrowOrderWithDetails } from '../types';

export class DisputeService {
  private statusText: Record<DisputeStatus, string> = {
    pending: '待处理',
    negotiating: '协商中',
    reviewing: '审核中',
    resolved: '已解决',
  };

  private negotiationStatusText: Record<NegotiationStatus, string> = {
    awaiting_lender_offer: '等待出借方报价',
    awaiting_borrower_response: '等待借入方回应',
    awaiting_lender_confirmation: '等待出借方确认',
    agreed: '已达成一致',
    escalated: '已升级仲裁',
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
    disputeData: Omit<Dispute, 'id' | 'complainantId' | 'createdAt'> & { status?: DisputeStatus }
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

    const initialNegotiation: DisputeNegotiation = {
      status: 'awaiting_lender_offer',
      messages: [{
        id: generateId(),
        senderId: complainantId,
        content: disputeData.description,
        createdAt: getCurrentTime(),
      }],
    };

    const dispute = disputeRepository.create({
      ...disputeData,
      complainantId,
      respondentId,
      status: disputeData.status || 'negotiating',
      category: disputeData.category || 'general',
      negotiation: disputeData.negotiation || initialNegotiation,
    });

    notificationService.sendDisputeStatusNotification(
      respondentId,
      dispute.id,
      this.statusText[dispute.status],
      orderTitle
    );

    return disputeRepository.toDisputeWithDetails(dispute);
  }

  public makeOffer(
    disputeId: string,
    userId: string,
    amount: number,
    message?: string
  ): DisputeWithDetails | null {
    const dispute = disputeRepository.findById(disputeId);
    if (!dispute || dispute.status !== 'negotiating') {
      throw new Error('纠纷不存在或不在协商状态');
    }
    if (amount <= 0) {
      throw new Error('赔偿金额必须大于0');
    }

    const isLender = userId === dispute.complainantId;
    const isBorrower = userId === dispute.respondentId;
    if (!isLender && !isBorrower) {
      throw new Error('无权操作此纠纷');
    }

    const order = dispute.orderType === 'borrow' 
      ? orderRepository.findBorrowOrderById(dispute.orderId)
      : null;

    if (order && amount > order.deposit) {
      throw new Error(`赔偿金额不能超过押金金额 ¥${order.deposit}`);
    }

    const negotiation = dispute.negotiation || { status: 'awaiting_lender_offer' as NegotiationStatus, messages: [] };
    const newMessage: NegotiationMessage = {
      id: generateId(),
      senderId: userId,
      content: message || (isLender ? `出借方提出赔偿金额：¥${amount}` : `借入方愿意赔偿：¥${amount}`),
      amount: amount,
      createdAt: getCurrentTime(),
    };

    let newStatus: NegotiationStatus = negotiation.status;
    const newNegotiation: DisputeNegotiation = {
      ...negotiation,
      messages: [...negotiation.messages, newMessage],
      lastOfferBy: userId,
      lastOfferAmount: amount,
    };

    if (isLender) {
      newNegotiation.lenderOffer = amount;
      newStatus = 'awaiting_borrower_response';
      newNegotiation.status = newStatus;
    } else {
      newNegotiation.borrowerOffer = amount;
      if (negotiation.lenderOffer !== undefined) {
        newStatus = 'awaiting_lender_confirmation';
        newNegotiation.status = newStatus;
      } else {
        newStatus = 'awaiting_lender_offer';
        newNegotiation.status = newStatus;
      }
    }

    disputeRepository.update(disputeId, { negotiation: newNegotiation });

    const notifyUserId = isLender ? dispute.respondentId : dispute.complainantId;
    const orderTitle = this.getOrderTitle(dispute);
    notificationService.sendDisputeStatusNotification(
      notifyUserId,
      disputeId,
      `收到新报价：¥${amount}`,
      orderTitle
    );

    const updated = disputeRepository.findById(disputeId);
    return updated ? disputeRepository.toDisputeWithDetails(updated) : null;
  }

  public acceptOffer(
    disputeId: string,
    userId: string,
    amount: number
  ): DisputeWithDetails | null {
    const dispute = disputeRepository.findById(disputeId);
    if (!dispute || dispute.status !== 'negotiating') {
      throw new Error('纠纷不存在或不在协商状态');
    }

    const negotiation = dispute.negotiation;
    if (!negotiation) {
      throw new Error('协商数据不存在');
    }
    if (negotiation.lastOfferAmount !== amount) {
      throw new Error('接受的金额与最新报价不一致');
    }
    if (negotiation.lastOfferBy === userId) {
      throw new Error('不能接受自己的报价');
    }

    const isLender = userId === dispute.complainantId;
    const newMessage: NegotiationMessage = {
      id: generateId(),
      senderId: userId,
      content: `${isLender ? '出借方' : '借入方'}已接受赔偿金额：¥${amount}`,
      amount: amount,
      createdAt: getCurrentTime(),
    };

    const newNegotiation: DisputeNegotiation = {
      ...negotiation,
      messages: [...negotiation.messages, newMessage],
      acceptedAmount: amount,
      status: 'agreed',
    };

    disputeRepository.update(disputeId, { 
      status: 'resolved',
      resolution: `双方协商一致，赔偿金额：¥${amount}`,
      negotiation: newNegotiation,
      resolvedAt: getCurrentTime(),
    });

    if (dispute.orderType === 'borrow') {
      this.processDamageCompensation(dispute.orderId, amount);
    }

    const orderTitle = this.getOrderTitle(dispute);
    notificationService.sendDisputeStatusNotification(
      dispute.complainantId,
      disputeId,
      `协商达成一致：¥${amount}`,
      orderTitle
    );
    notificationService.sendDisputeStatusNotification(
      dispute.respondentId,
      disputeId,
      `协商达成一致：¥${amount}`,
      orderTitle
    );

    const updated = disputeRepository.findById(disputeId);
    return updated ? disputeRepository.toDisputeWithDetails(updated) : null;
  }

  public sendNegotiationMessage(
    disputeId: string,
    userId: string,
    content: string,
    amount?: number
  ): DisputeWithDetails | null {
    const dispute = disputeRepository.findById(disputeId);
    if (!dispute || dispute.status !== 'negotiating') {
      throw new Error('纠纷不存在或不在协商状态');
    }

    const isLender = userId === dispute.complainantId;
    const isBorrower = userId === dispute.respondentId;
    if (!isLender && !isBorrower) {
      throw new Error('无权操作此纠纷');
    }
    if (!content || content.trim().length === 0) {
      throw new Error('消息内容不能为空');
    }

    const negotiation = dispute.negotiation || { status: 'awaiting_lender_offer' as NegotiationStatus, messages: [] };
    const newMessage: NegotiationMessage = {
      id: generateId(),
      senderId: userId,
      content: content.trim(),
      amount: amount,
      createdAt: getCurrentTime(),
    };

    const newNegotiation: DisputeNegotiation = {
      ...negotiation,
      messages: [...negotiation.messages, newMessage],
    };

    if (amount !== undefined && amount > 0) {
      newNegotiation.lastOfferBy = userId;
      newNegotiation.lastOfferAmount = amount;
      if (isLender) {
        newNegotiation.lenderOffer = amount;
        newNegotiation.status = 'awaiting_borrower_response';
      } else {
        newNegotiation.borrowerOffer = amount;
        newNegotiation.status = negotiation.lenderOffer !== undefined 
          ? 'awaiting_lender_confirmation' 
          : 'awaiting_lender_offer';
      }
    }

    disputeRepository.update(disputeId, { negotiation: newNegotiation });

    const notifyUserId = isLender ? dispute.respondentId : dispute.complainantId;
    const orderTitle = this.getOrderTitle(dispute);
    notificationService.sendDisputeStatusNotification(
      notifyUserId,
      disputeId,
      '收到新的协商消息',
      orderTitle
    );

    const updated = disputeRepository.findById(disputeId);
    return updated ? disputeRepository.toDisputeWithDetails(updated) : null;
  }

  public escalateDispute(
    disputeId: string,
    userId: string,
    reason?: string
  ): DisputeWithDetails | null {
    const dispute = disputeRepository.findById(disputeId);
    if (!dispute || dispute.status !== 'negotiating') {
      throw new Error('纠纷不存在或不在协商状态');
    }

    const isLender = userId === dispute.complainantId;
    const isBorrower = userId === dispute.respondentId;
    if (!isLender && !isBorrower) {
      throw new Error('无权操作此纠纷');
    }

    const negotiation = dispute.negotiation || { status: 'awaiting_lender_offer' as NegotiationStatus, messages: [] };
    const newMessage: NegotiationMessage = {
      id: generateId(),
      senderId: userId,
      content: `${isLender ? '出借方' : '借入方'}申请升级管理员介入${reason ? '，原因：' + reason : ''}`,
      createdAt: getCurrentTime(),
    };

    const newNegotiation: DisputeNegotiation = {
      ...negotiation,
      messages: [...negotiation.messages, newMessage],
      status: 'escalated',
    };

    disputeRepository.update(disputeId, { 
      status: 'reviewing',
      negotiation: newNegotiation,
    });

    const orderTitle = this.getOrderTitle(dispute);
    notificationService.sendDisputeStatusNotification(
      dispute.complainantId,
      disputeId,
      '已升级管理员介入',
      orderTitle
    );
    notificationService.sendDisputeStatusNotification(
      dispute.respondentId,
      disputeId,
      '已升级管理员介入',
      orderTitle
    );

    const updated = disputeRepository.findById(disputeId);
    return updated ? disputeRepository.toDisputeWithDetails(updated) : null;
  }

  private processDamageCompensation(orderId: string, compensationAmount: number): void {
    const order = orderRepository.findBorrowOrderById(orderId);
    if (!order) return;

    const refundAmount = Math.max(0, order.deposit - compensationAmount);
    orderRepository.updateBorrowOrder(orderId, {
      status: 'returned',
      compensationAmount: compensationAmount,
      refundAmount: refundAmount,
      depositStatus: refundAmount > 0 ? 'partially_refunded' : 'refunded',
    });
    orderRepository.addBorrowTimelineEvent(orderId, `赔偿协商完成：扣除赔偿¥${compensationAmount}，退还押金¥${refundAmount}`, 'system');

    const item = orderRepository.toBorrowOrderWithDetails(order).item;
    const itemTitle = item?.title || '物品';

    transactionService.recordDepositDeduction(
      order.borrowerId,
      orderId,
      compensationAmount,
      `「${itemTitle}」损坏扣除赔偿`
    );

    if (refundAmount > 0) {
      transactionService.recordDepositRefund(
        order.borrowerId,
        orderId,
        refundAmount,
        `「${itemTitle}」赔偿后退还剩余押金`
      );
    }
  }

  private getOrderTitle(dispute: Dispute): string {
    if (dispute.orderType === 'borrow') {
      const order = orderRepository.findBorrowOrderById(dispute.orderId);
      if (order) {
        const item = orderRepository.toBorrowOrderWithDetails(order).item;
        return item?.title || '';
      }
    } else {
      const order = orderRepository.findServiceOrderById(dispute.orderId);
      if (order) {
        const skill = orderRepository.toServiceOrderWithDetails(order).skill;
        return skill?.title || '';
      }
    }
    return '';
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
      transactionService.recordTimeCoinIncome(
        dispute.complainantId,
        disputeId,
        'service_order',
        refundTimeCoins,
        '纠纷退款',
        `服务纠纷管理员裁定退还时间币`
      );
    }

    if (dispute.orderType === 'borrow' && refundDeposit !== undefined) {
      const order = orderRepository.findBorrowOrderById(dispute.orderId);
      if (order) {
        const compensation = Math.max(0, order.deposit - refundDeposit);
        orderRepository.updateBorrowOrder(dispute.orderId, {
          status: 'returned',
          compensationAmount: compensation,
          refundAmount: refundDeposit,
          depositStatus: refundDeposit > 0 ? (refundDeposit >= order.deposit ? 'refunded' : 'partially_refunded') : 'refunded',
        });
        orderRepository.addBorrowTimelineEvent(dispute.orderId, `管理员裁定：扣除赔偿¥${compensation}，退还押金¥${refundDeposit}`, resolverId);

        const item = orderRepository.toBorrowOrderWithDetails(order).item;
        const itemTitle = item?.title || '物品';

        if (compensation > 0) {
          transactionService.recordDepositDeduction(
            order.borrowerId,
            dispute.orderId,
            compensation,
            `「${itemTitle}」管理员裁定扣除赔偿`
          );
        }
        if (refundDeposit > 0) {
          transactionService.recordDepositRefund(
            order.borrowerId,
            dispute.orderId,
            refundDeposit,
            `「${itemTitle}」管理员裁定退还押金`
          );
        }
      }
    }

    const currentNegotiation = dispute.negotiation || { status: 'awaiting_lender_offer' as NegotiationStatus, messages: [] };
    const adminMessage: NegotiationMessage = {
      id: generateId(),
      senderId: resolverId,
      content: `管理员裁定：${resolution}`,
      createdAt: getCurrentTime(),
    };

    disputeRepository.update(disputeId, {
      status: 'resolved' as DisputeStatus,
      resolution,
      resolverId,
      negotiation: {
        ...currentNegotiation,
        messages: [...currentNegotiation.messages, adminMessage],
        status: 'escalated',
      },
    });

    if (dispute.orderType === 'borrow') {
      const order = orderRepository.findBorrowOrderById(dispute.orderId);
      if (order && order.status === 'disputed') {
        if (!order.compensationAmount && !order.refundAmount) {
          orderRepository.updateBorrowOrder(dispute.orderId, { status: 'returned' });
        }
      }
    } else {
      const order = orderRepository.findServiceOrderById(dispute.orderId);
      if (order && order.status === 'disputed') {
        orderRepository.updateServiceOrder(dispute.orderId, { status: 'completed' });
      }
    }

    const orderTitle = this.getOrderTitle(dispute);
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
    if (!dispute || (dispute.status !== 'pending' && dispute.status !== 'negotiating')) {
      return null;
    }

    const currentNegotiation = dispute.negotiation || { status: 'awaiting_lender_offer' as NegotiationStatus, messages: [] };

    disputeRepository.update(disputeId, {
      status: 'reviewing' as DisputeStatus,
      resolverId,
      negotiation: {
        ...currentNegotiation,
        status: 'escalated',
      },
    });

    const orderTitle = this.getOrderTitle(dispute);
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
