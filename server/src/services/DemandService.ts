import { demandRepository } from '../repositories/DemandRepository';
import { userRepository } from '../repositories/UserRepository';
import { transactionRepository } from '../repositories/TransactionRepository';
import {
  Demand,
  DemandWithDetails,
  DemandOrderWithDetails,
  DemandFilterParams,
  DemandSortParams,
  DemandPaginationParams,
  PaginatedResult,
  CreateDemandRequest,
  UpdateDemandRequest,
  CreateDemandResponseRequest,
} from '../types';
import { getCurrentTime } from '../utils/helpers';
import { notificationService } from './NotificationService';
import { timeCoinService } from './TimeCoinService';
import { creditService } from './CreditService';

export class DemandService {
  private statusText: Record<string, string> = {
    open: '接受响应',
    responding: '有响应中',
    confirmed: '已确认',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  };

  private urgencyText: Record<string, string> = {
    normal: '普通',
    urgent: '紧急',
    very_urgent: '非常紧急',
  };

  public getDemands(
    filters: DemandFilterParams,
    sort: DemandSortParams,
    pagination: DemandPaginationParams
  ): PaginatedResult<DemandWithDetails> {
    const result = demandRepository.findDemandsWithFilters(filters, sort, pagination);
    return {
      ...result,
      items: result.items.map(demand => demandRepository.toDemandWithDetails(demand)),
    };
  }

  public getDemandById(id: string): DemandWithDetails | null {
    const demand = demandRepository.findDemandById(id);
    if (!demand) return null;
    demandRepository.incrementViewCount(id);
    return demandRepository.toDemandWithDetails(demand);
  }

  public getMyDemands(requesterId: string): DemandWithDetails[] {
    const demands = demandRepository.findDemandsByRequesterId(requesterId);
    return demands.map(demand => demandRepository.toDemandWithDetails(demand));
  }

  public getMyRespondedDemands(responderId: string): DemandWithDetails[] {
    const responses = demandRepository.findResponsesByResponderId(responderId);
    const demandIds = [...new Set(responses.map(r => r.demandId))];
    return demandIds
      .map(id => demandRepository.findDemandById(id))
      .filter(Boolean)
      .map(demand => demandRepository.toDemandWithDetails(demand!));
  }

  public getMyDemandOrders(userId: string, role: 'requester' | 'responder'): DemandOrderWithDetails[] {
    let orders;
    if (role === 'requester') {
      orders = demandRepository.findOrdersByRequesterId(userId);
    } else {
      orders = demandRepository.findOrdersByResponderId(userId);
    }
    return orders.map(order => demandRepository.toOrderWithDetails(order));
  }

  public getDemandOrderById(id: string): DemandOrderWithDetails | null {
    const order = demandRepository.findOrderById(id);
    if (!order) return null;
    return demandRepository.toOrderWithDetails(order);
  }

  public createDemand(requesterId: string, request: CreateDemandRequest): DemandWithDetails | null {
    const user = userRepository.findById(requesterId);
    if (!user) {
      throw new Error('用户不存在');
    }
    if (!request.title || !request.description || !request.type || !request.category) {
      throw new Error('请填写完整信息');
    }
    if (request.timeCoinReward < 0) {
      throw new Error('时间币报酬不能为负数');
    }
    if (user.timeCoins < request.timeCoinReward) {
      throw new Error('您的时间币不足，请先获取更多时间币');
    }

    const demand = demandRepository.createDemand({
      requesterId,
      title: request.title,
      description: request.description,
      type: request.type,
      category: request.category,
      images: request.images || [],
      timeCoinReward: request.timeCoinReward,
      urgency: request.urgency || 'normal',
      contactPhone: request.contactPhone,
      contactAddress: request.contactAddress,
      validUntil: request.validUntil,
    });

    return demandRepository.toDemandWithDetails(demand);
  }

  public updateDemand(userId: string, demandId: string, request: UpdateDemandRequest): DemandWithDetails | null {
    const demand = demandRepository.findDemandById(demandId);
    if (!demand) {
      throw new Error('需求不存在');
    }
    if (demand.requesterId !== userId) {
      throw new Error('无权限修改此需求');
    }
    if (demand.status !== 'open') {
      throw new Error('当前状态不允许修改');
    }

    const updates: Partial<Demand> = {};
    if (request.title) updates.title = request.title;
    if (request.description) updates.description = request.description;
    if (request.type) updates.type = request.type;
    if (request.category) updates.category = request.category;
    if (request.images) updates.images = request.images;
    if (request.timeCoinReward !== undefined) updates.timeCoinReward = request.timeCoinReward;
    if (request.urgency) updates.urgency = request.urgency;
    if (request.contactPhone) updates.contactPhone = request.contactPhone;
    if (request.contactAddress) updates.contactAddress = request.contactAddress;
    if (request.validUntil) updates.validUntil = request.validUntil;

    const updatedDemand = demandRepository.updateDemand(demandId, updates);
    if (!updatedDemand) return null;
    return demandRepository.toDemandWithDetails(updatedDemand);
  }

  public cancelDemand(userId: string, demandId: string, reason?: string): DemandWithDetails | null {
    const demand = demandRepository.findDemandById(demandId);
    if (!demand) {
      throw new Error('需求不存在');
    }
    if (demand.requesterId !== userId) {
      throw new Error('无权限取消此需求');
    }
    if (demand.status === 'completed' || demand.status === 'cancelled') {
      throw new Error('该需求不可取消');
    }

    const updatedDemand = demandRepository.updateDemand(demandId, {
      status: 'cancelled',
    });
    if (!updatedDemand) return null;

    const responses = demandRepository.findResponsesByDemandId(demandId);
    responses.forEach(response => {
      if (response.status === 'pending') {
        demandRepository.updateResponse(response.id, { status: 'withdrawn' });
        notificationService.sendDemandStatusNotification(
          response.responderId,
          demandId,
          'cancelled',
          demand.title
        );
      }
    });

    return demandRepository.toDemandWithDetails(updatedDemand);
  }

  public createResponse(
    responderId: string,
    demandId: string,
    request: CreateDemandResponseRequest
  ): DemandWithDetails | null {
    const demand = demandRepository.findDemandById(demandId);
    if (!demand) {
      throw new Error('需求不存在');
    }
    if (demand.status !== 'open' && demand.status !== 'responding') {
      throw new Error('该需求当前不可响应');
    }
    if (demand.requesterId === responderId) {
      throw new Error('不能响应自己发布的需求');
    }
    if (!request.message) {
      throw new Error('请输入响应说明');
    }

    const existingResponse = demandRepository.findResponsesByDemandId(demandId)
      .find(r => r.responderId === responderId && r.status === 'pending');
    if (existingResponse) {
      throw new Error('您已响应该需求，请勿重复响应');
    }

    demandRepository.createResponse({
      demandId,
      responderId,
      message: request.message,
      estimatedTime: request.estimatedTime,
      priceOffer: request.priceOffer,
    });

    if (demand.status === 'open') {
      demandRepository.updateDemand(demandId, { status: 'responding' });
    }

    notificationService.sendDemandNewResponseNotification(
      demand.requesterId,
      demandId,
      demand.title
    );

    const updatedDemand = demandRepository.findDemandById(demandId);
    return updatedDemand ? demandRepository.toDemandWithDetails(updatedDemand) : null;
  }

  public withdrawResponse(responderId: string, responseId: string): DemandWithDetails | null {
    const response = demandRepository.findResponseById(responseId);
    if (!response) {
      throw new Error('响应不存在');
    }
    if (response.responderId !== responderId) {
      throw new Error('无权限撤销此响应');
    }
    if (response.status === 'accepted') {
      throw new Error('响应已被确认，无法撤销，请联系需求发布者');
    }
    if (response.status !== 'pending') {
      throw new Error('该响应不可撤销');
    }

    demandRepository.updateResponse(responseId, { status: 'withdrawn' });

    const demand = demandRepository.findDemandById(response.demandId);
    if (demand) {
      const remainingResponses = demandRepository.findResponsesByDemandId(response.demandId)
        .filter(r => r.status === 'pending');
      if (remainingResponses.length === 0 && demand.status === 'responding') {
        demandRepository.updateDemand(response.demandId, { status: 'open' });
      }
    }

    const updatedDemand = demandRepository.findDemandById(response.demandId);
    return updatedDemand ? demandRepository.toDemandWithDetails(updatedDemand) : null;
  }

  public acceptResponse(userId: string, demandId: string, responseId: string): DemandOrderWithDetails | null {
    const demand = demandRepository.findDemandById(demandId);
    if (!demand) {
      throw new Error('需求不存在');
    }
    if (demand.requesterId !== userId) {
      throw new Error('无权限操作此需求');
    }
    if (demand.status !== 'open' && demand.status !== 'responding') {
      throw new Error('当前状态不允许确认响应');
    }

    const response = demandRepository.findResponseById(responseId);
    if (!response || response.demandId !== demandId) {
      throw new Error('响应不存在');
    }
    if (response.status !== 'pending') {
      throw new Error('该响应状态不允许确认');
    }

    const requester = userRepository.findById(userId);
    if (!requester) {
      throw new Error('用户不存在');
    }

    const finalReward = response.priceOffer || demand.timeCoinReward;
    if (requester.timeCoins < finalReward) {
      throw new Error('您的时间币不足');
    }

    demandRepository.updateDemand(demandId, {
      status: 'confirmed',
      acceptedResponseId: responseId,
    });

    demandRepository.updateResponse(responseId, { status: 'accepted' });

    const allResponses = demandRepository.findResponsesByDemandId(demandId);
    allResponses.forEach(r => {
      if (r.id !== responseId && r.status === 'pending') {
        demandRepository.updateResponse(r.id, { status: 'rejected' });
      }
    });

    const order = demandRepository.createOrder({
      demandId,
      requesterId: userId,
      responderId: response.responderId,
      responseId,
      timeCoinReward: finalReward,
      status: 'confirmed',
      timeline: [
        {
          time: getCurrentTime(),
          event: '需求已确认，等待服务开始',
          operator: userId,
        },
      ],
    });

    notificationService.sendDemandResponseAcceptedNotification(
      response.responderId,
      demandId,
      demand.title
    );

    return demandRepository.toOrderWithDetails(order);
  }

  public startOrder(userId: string, orderId: string): DemandOrderWithDetails | null {
    const order = demandRepository.findOrderById(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }
    if (order.responderId !== userId && order.requesterId !== userId) {
      throw new Error('无权限操作此订单');
    }
    if (order.status !== 'confirmed') {
      throw new Error('当前状态不允许开始');
    }

    const updatedOrder = demandRepository.updateOrder(orderId, {
      status: 'in_progress',
      startTime: getCurrentTime(),
      timeline: [
        ...order.timeline,
        {
          time: getCurrentTime(),
          event: '服务已开始',
          operator: userId,
        },
      ],
    });

    demandRepository.updateDemand(order.demandId, { status: 'in_progress' });

    if (updatedOrder) {
      notificationService.sendDemandStatusNotification(
        order.requesterId,
        order.demandId,
        'in_progress',
        ''
      );
      notificationService.sendDemandStatusNotification(
        order.responderId,
        order.demandId,
        'in_progress',
        ''
      );
    }

    return updatedOrder ? demandRepository.toOrderWithDetails(updatedOrder) : null;
  }

  public completeOrder(userId: string, orderId: string): DemandOrderWithDetails | null {
    const order = demandRepository.findOrderById(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }
    if (order.requesterId !== userId) {
      throw new Error('只有需求发布者可以完成订单');
    }
    if (order.status !== 'in_progress') {
      throw new Error('当前状态不允许完成');
    }

    const requester = userRepository.findById(order.requesterId);
    const responder = userRepository.findById(order.responderId);
    if (!requester || !responder) {
      throw new Error('用户不存在');
    }
    if (requester.timeCoins < order.timeCoinReward) {
      throw new Error('发布者时间币不足');
    }

    const transferSuccess = timeCoinService.transfer(
      order.requesterId,
      order.responderId,
      order.timeCoinReward
    );
    if (!transferSuccess) {
      throw new Error('时间币转账失败');
    }

    transactionRepository.createTimeCoinTransaction({
      userId: order.requesterId,
      relatedId: orderId,
      relatedType: 'system',
      type: 'expenditure',
      amount: order.timeCoinReward,
      source: '需求完成支付',
      description: `完成需求订单支付 ${order.timeCoinReward} 时间币`,
    });

    transactionRepository.createTimeCoinTransaction({
      userId: order.responderId,
      relatedId: orderId,
      relatedType: 'system',
      type: 'income',
      amount: order.timeCoinReward,
      source: '需求完成收入',
      description: `完成需求订单获得 ${order.timeCoinReward} 时间币`,
    });

    const updatedOrder = demandRepository.updateOrder(orderId, {
      status: 'completed',
      completedAt: getCurrentTime(),
      timeline: [
        ...order.timeline,
        {
          time: getCurrentTime(),
          event: `服务已完成，支付 ${order.timeCoinReward} 时间币`,
          operator: userId,
        },
      ],
    });

    demandRepository.updateDemand(order.demandId, { status: 'completed' });

    creditService.rewardCredit(order.responderId, 3, '完成需求服务');

    const demand = demandRepository.findDemandById(order.demandId);
    if (demand) {
      notificationService.sendDemandOrderCompletedNotification(
        order.responderId,
        orderId,
        order.timeCoinReward,
        demand.title
      );
      notificationService.sendDemandOrderCompletedNotification(
        order.requesterId,
        orderId,
        -order.timeCoinReward,
        demand.title
      );
    }

    return updatedOrder ? demandRepository.toOrderWithDetails(updatedOrder) : null;
  }
}

export const demandService = new DemandService();
