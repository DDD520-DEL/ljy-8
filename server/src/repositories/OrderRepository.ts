import { db } from '../utils/db';
import { BorrowOrder, BorrowOrderWithDetails, ServiceOrder, ServiceOrderWithDetails, TimelineEvent } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { userRepository } from './UserRepository';
import { itemRepository } from './ItemRepository';
import { skillRepository } from './SkillRepository';

export class OrderRepository {
  private borrowCollection = 'borrowOrders';
  private serviceCollection = 'serviceOrders';

  // Borrow Orders
  public findAllBorrowOrders(): BorrowOrder[] {
    return db.getAll<BorrowOrder>(this.borrowCollection);
  }

  public findBorrowOrderById(id: string): BorrowOrder | undefined {
    return db.getById<BorrowOrder>(this.borrowCollection, id);
  }

  public findBorrowOrdersByBorrowerId(borrowerId: string): BorrowOrder[] {
    return db.findMany<BorrowOrder>(this.borrowCollection, (order) => order.borrowerId === borrowerId);
  }

  public findBorrowOrdersByLenderId(lenderId: string): BorrowOrder[] {
    return db.findMany<BorrowOrder>(this.borrowCollection, (order) => order.lenderId === lenderId);
  }

  public findBorrowOrdersByItemId(itemId: string): BorrowOrder[] {
    return db.findMany<BorrowOrder>(this.borrowCollection, (order) => order.itemId === itemId);
  }

  public createBorrowOrder(orderData: Omit<BorrowOrder, 'id' | 'createdAt' | 'status' | 'timeline'>): BorrowOrder {
    const initialTimeline: TimelineEvent[] = [{
      time: getCurrentTime(),
      event: '提交借用申请',
      operator: orderData.borrowerId,
    }];

    const order: BorrowOrder = {
      id: generateId(),
      ...orderData,
      status: 'pending',
      timeline: initialTimeline,
      createdAt: getCurrentTime(),
    };
    return db.insert<BorrowOrder>(this.borrowCollection, order);
  }

  public updateBorrowOrder(id: string, updates: Partial<BorrowOrder>): BorrowOrder | undefined {
    return db.update<BorrowOrder>(this.borrowCollection, id, updates);
  }

  public addBorrowTimelineEvent(orderId: string, event: string, operator: string): void {
    const order = this.findBorrowOrderById(orderId);
    if (order) {
      const newTimeline = [...order.timeline, { time: getCurrentTime(), event, operator }];
      this.updateBorrowOrder(orderId, { timeline: newTimeline });
    }
  }

  public toBorrowOrderWithDetails(order: BorrowOrder): BorrowOrderWithDetails {
    const item = itemRepository.findById(order.itemId);
    const borrower = userRepository.findById(order.borrowerId);
    const lender = userRepository.findById(order.lenderId);
    
    return {
      ...order,
      item: item ? itemRepository.toItemWithOwner(item) : {} as any,
      borrower: borrower ? userRepository.toPublicUser(borrower) : {} as any,
      lender: lender ? userRepository.toPublicUser(lender) : {} as any,
    };
  }

  // Service Orders
  public findAllServiceOrders(): ServiceOrder[] {
    return db.getAll<ServiceOrder>(this.serviceCollection);
  }

  public findServiceOrderById(id: string): ServiceOrder | undefined {
    return db.getById<ServiceOrder>(this.serviceCollection, id);
  }

  public findServiceOrdersByClientId(clientId: string): ServiceOrder[] {
    return db.findMany<ServiceOrder>(this.serviceCollection, (order) => order.clientId === clientId);
  }

  public findServiceOrdersByProviderId(providerId: string): ServiceOrder[] {
    return db.findMany<ServiceOrder>(this.serviceCollection, (order) => order.providerId === providerId);
  }

  public findServiceOrdersBySkillId(skillId: string): ServiceOrder[] {
    return db.findMany<ServiceOrder>(this.serviceCollection, (order) => order.skillId === skillId);
  }

  public createServiceOrder(orderData: Omit<ServiceOrder, 'id' | 'createdAt' | 'status' | 'timeline'>): ServiceOrder {
    const initialTimeline: TimelineEvent[] = [{
      time: getCurrentTime(),
      event: '提交服务申请',
      operator: orderData.clientId,
    }];

    const order: ServiceOrder = {
      id: generateId(),
      ...orderData,
      status: 'pending',
      timeline: initialTimeline,
      createdAt: getCurrentTime(),
    };
    return db.insert<ServiceOrder>(this.serviceCollection, order);
  }

  public updateServiceOrder(id: string, updates: Partial<ServiceOrder>): ServiceOrder | undefined {
    return db.update<ServiceOrder>(this.serviceCollection, id, updates);
  }

  public addServiceTimelineEvent(orderId: string, event: string, operator: string): void {
    const order = this.findServiceOrderById(orderId);
    if (order) {
      const newTimeline = [...order.timeline, { time: getCurrentTime(), event, operator }];
      this.updateServiceOrder(orderId, { timeline: newTimeline });
    }
  }

  public toServiceOrderWithDetails(order: ServiceOrder): ServiceOrderWithDetails {
    const skill = skillRepository.findById(order.skillId);
    const client = userRepository.findById(order.clientId);
    const provider = userRepository.findById(order.providerId);
    
    return {
      ...order,
      skill: skill ? skillRepository.toSkillWithProvider(skill) : {} as any,
      client: client ? userRepository.toPublicUser(client) : {} as any,
      provider: provider ? userRepository.toPublicUser(provider) : {} as any,
    };
  }
}

export const orderRepository = new OrderRepository();
