import { orderRepository } from '../repositories/OrderRepository';
import { itemRepository } from '../repositories/ItemRepository';
import { skillRepository } from '../repositories/SkillRepository';
import { 
  BorrowOrderWithDetails, 
  ServiceOrderWithDetails, 
  BorrowRequest, 
  ServiceOrderRequest,
  BorrowOrderStatus,
  ServiceOrderStatus
} from '../types';
import { timeCoinService } from './TimeCoinService';
import { getCurrentTime } from '../utils/helpers';
import { queueService } from './QueueService';

export class OrderService {
  // Borrow Orders
  public getBorrowOrders(userId: string, role: 'borrower' | 'lender' | 'all'): BorrowOrderWithDetails[] {
    let orders;
    if (role === 'borrower') {
      orders = orderRepository.findBorrowOrdersByBorrowerId(userId);
    } else if (role === 'lender') {
      orders = orderRepository.findBorrowOrdersByLenderId(userId);
    } else {
      const borrowerOrders = orderRepository.findBorrowOrdersByBorrowerId(userId);
      const lenderOrders = orderRepository.findBorrowOrdersByLenderId(userId);
      orders = [...borrowerOrders, ...lenderOrders];
    }
    
    return orders.map(order => orderRepository.toBorrowOrderWithDetails(order));
  }

  public getBorrowOrderById(orderId: string): BorrowOrderWithDetails | null {
    const order = orderRepository.findBorrowOrderById(orderId);
    return order ? orderRepository.toBorrowOrderWithDetails(order) : null;
  }

  public createBorrowOrder(borrowerId: string, request: BorrowRequest): BorrowOrderWithDetails | null {
    const item = itemRepository.findById(request.itemId);
    if (!item || item.status !== 'available') {
      throw new Error('物品不可借用');
    }

    const order = orderRepository.createBorrowOrder({
      itemId: request.itemId,
      borrowerId,
      lenderId: item.ownerId,
      startDate: request.startDate,
      endDate: request.endDate,
      deposit: item.deposit,
      message: request.message,
    });

    return orderRepository.toBorrowOrderWithDetails(order);
  }

  public approveBorrowOrder(orderId: string, lenderId: string): BorrowOrderWithDetails | null {
    const order = orderRepository.findBorrowOrderById(orderId);
    if (!order || order.lenderId !== lenderId || order.status !== 'pending') {
      return null;
    }

    orderRepository.updateBorrowOrder(orderId, { status: 'approved' as BorrowOrderStatus });
    orderRepository.addBorrowTimelineEvent(orderId, '出借方已同意借用申请', lenderId);
    
    const updated = orderRepository.findBorrowOrderById(orderId);
    return updated ? orderRepository.toBorrowOrderWithDetails(updated) : null;
  }

  public rejectBorrowOrder(orderId: string, lenderId: string, reason?: string): BorrowOrderWithDetails | null {
    const order = orderRepository.findBorrowOrderById(orderId);
    if (!order || order.lenderId !== lenderId || order.status !== 'pending') {
      return null;
    }

    orderRepository.updateBorrowOrder(orderId, { status: 'rejected' as BorrowOrderStatus });
    orderRepository.addBorrowTimelineEvent(orderId, `出借方已拒绝借用申请${reason ? '：' + reason : ''}`, lenderId);
    
    const updated = orderRepository.findBorrowOrderById(orderId);
    return updated ? orderRepository.toBorrowOrderWithDetails(updated) : null;
  }

  public confirmLend(orderId: string, lenderId: string): BorrowOrderWithDetails | null {
    const order = orderRepository.findBorrowOrderById(orderId);
    if (!order || order.lenderId !== lenderId || order.status !== 'approved') {
      return null;
    }

    orderRepository.updateBorrowOrder(orderId, { status: 'borrowing' as BorrowOrderStatus });
    orderRepository.addBorrowTimelineEvent(orderId, '物品已借出', lenderId);
    
    itemRepository.update(order.itemId, { status: 'borrowed' });
    
    const updated = orderRepository.findBorrowOrderById(orderId);
    return updated ? orderRepository.toBorrowOrderWithDetails(updated) : null;
  }

  public confirmReturn(orderId: string, lenderId: string): BorrowOrderWithDetails | null {
    const order = orderRepository.findBorrowOrderById(orderId);
    if (!order || order.lenderId !== lenderId || order.status !== 'borrowing') {
      return null;
    }

    orderRepository.updateBorrowOrder(orderId, { 
      status: 'returned' as BorrowOrderStatus,
      actualReturnDate: getCurrentTime(),
    });
    orderRepository.addBorrowTimelineEvent(orderId, '物品已归还', lenderId);
    
    itemRepository.update(order.itemId, { status: 'available' });

    queueService.notifyNextInQueue(order.itemId);
    
    const updated = orderRepository.findBorrowOrderById(orderId);
    return updated ? orderRepository.toBorrowOrderWithDetails(updated) : null;
  }

  // Service Orders
  public getServiceOrders(userId: string, role: 'client' | 'provider' | 'all'): ServiceOrderWithDetails[] {
    let orders;
    if (role === 'client') {
      orders = orderRepository.findServiceOrdersByClientId(userId);
    } else if (role === 'provider') {
      orders = orderRepository.findServiceOrdersByProviderId(userId);
    } else {
      const clientOrders = orderRepository.findServiceOrdersByClientId(userId);
      const providerOrders = orderRepository.findServiceOrdersByProviderId(userId);
      orders = [...clientOrders, ...providerOrders];
    }
    
    return orders.map(order => orderRepository.toServiceOrderWithDetails(order));
  }

  public getServiceOrderById(orderId: string): ServiceOrderWithDetails | null {
    const order = orderRepository.findServiceOrderById(orderId);
    return order ? orderRepository.toServiceOrderWithDetails(order) : null;
  }

  public createServiceOrder(clientId: string, request: ServiceOrderRequest): ServiceOrderWithDetails | null {
    const skill = skillRepository.findById(request.skillId);
    if (!skill || skill.status !== 'active') {
      throw new Error('服务不可用');
    }

    const userBalance = timeCoinService.getBalance(clientId);
    if (userBalance === null || userBalance < skill.timeCoinPrice) {
      throw new Error('时间币余额不足');
    }

    const order = orderRepository.createServiceOrder({
      skillId: request.skillId,
      clientId,
      providerId: skill.providerId,
      serviceDate: request.serviceDate,
      address: request.address,
      timeCoinPrice: skill.timeCoinPrice,
      message: request.message,
    });

    return orderRepository.toServiceOrderWithDetails(order);
  }

  public approveServiceOrder(orderId: string, providerId: string): ServiceOrderWithDetails | null {
    const order = orderRepository.findServiceOrderById(orderId);
    if (!order || order.providerId !== providerId || order.status !== 'pending') {
      return null;
    }

    timeCoinService.deductCoins(order.clientId, order.timeCoinPrice);

    orderRepository.updateServiceOrder(orderId, { status: 'approved' as ServiceOrderStatus });
    orderRepository.addServiceTimelineEvent(orderId, '服务方已同意服务申请', providerId);
    
    const updated = orderRepository.findServiceOrderById(orderId);
    return updated ? orderRepository.toServiceOrderWithDetails(updated) : null;
  }

  public rejectServiceOrder(orderId: string, providerId: string, reason?: string): ServiceOrderWithDetails | null {
    const order = orderRepository.findServiceOrderById(orderId);
    if (!order || order.providerId !== providerId || order.status !== 'pending') {
      return null;
    }

    orderRepository.updateServiceOrder(orderId, { status: 'rejected' as ServiceOrderStatus });
    orderRepository.addServiceTimelineEvent(orderId, `服务方已拒绝服务申请${reason ? '：' + reason : ''}`, providerId);
    
    const updated = orderRepository.findServiceOrderById(orderId);
    return updated ? orderRepository.toServiceOrderWithDetails(updated) : null;
  }

  public startService(orderId: string, providerId: string): ServiceOrderWithDetails | null {
    const order = orderRepository.findServiceOrderById(orderId);
    if (!order || order.providerId !== providerId || order.status !== 'approved') {
      return null;
    }

    orderRepository.updateServiceOrder(orderId, { status: 'in_progress' as ServiceOrderStatus });
    orderRepository.addServiceTimelineEvent(orderId, '服务进行中', providerId);
    
    const updated = orderRepository.findServiceOrderById(orderId);
    return updated ? orderRepository.toServiceOrderWithDetails(updated) : null;
  }

  public completeService(orderId: string, clientId: string): ServiceOrderWithDetails | null {
    const order = orderRepository.findServiceOrderById(orderId);
    if (!order || order.clientId !== clientId || order.status !== 'in_progress') {
      return null;
    }

    timeCoinService.addCoins(order.providerId, order.timeCoinPrice);

    orderRepository.updateServiceOrder(orderId, { status: 'completed' as ServiceOrderStatus });
    orderRepository.addServiceTimelineEvent(orderId, '服务已完成', clientId);
    
    const updated = orderRepository.findServiceOrderById(orderId);
    return updated ? orderRepository.toServiceOrderWithDetails(updated) : null;
  }
}

export const orderService = new OrderService();
