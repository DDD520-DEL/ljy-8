import { db } from '../utils/db';
import {
  Demand,
  DemandWithDetails,
  DemandResponse,
  DemandResponseWithDetails,
  DemandOrder,
  DemandOrderWithDetails,
  DemandFilterParams,
  DemandSortParams,
  DemandPaginationParams,
  PaginatedResult,
} from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { userRepository } from './UserRepository';

export class DemandRepository {
  private demandCollection = 'demands';
  private responseCollection = 'demandResponses';
  private orderCollection = 'demandOrders';

  public findAllDemands(): Demand[] {
    return db.getAll<Demand>(this.demandCollection);
  }

  public findDemandById(id: string): Demand | undefined {
    return db.getById<Demand>(this.demandCollection, id);
  }

  public findDemandsByRequesterId(requesterId: string): Demand[] {
    return db.findMany<Demand>(this.demandCollection, (d) => d.requesterId === requesterId);
  }

  public findDemandsWithFilters(
    filters: DemandFilterParams,
    sort: DemandSortParams,
    pagination: DemandPaginationParams
  ): PaginatedResult<Demand> {
    let demands = this.findAllDemands().filter(d => d.status !== 'cancelled' && d.status !== 'completed');

    if (filters.status) {
      demands = demands.filter(demand => demand.status === filters.status);
    }

    if (filters.type) {
      demands = demands.filter(demand => demand.type === filters.type);
    }

    if (filters.category && filters.category !== 'all') {
      demands = demands.filter(demand => demand.category === filters.category);
    }

    if (filters.urgency && filters.urgency !== 'all') {
      demands = demands.filter(demand => demand.urgency === filters.urgency);
    }

    if (filters.keyword) {
      const lowerKeyword = filters.keyword.toLowerCase();
      demands = demands.filter(demand =>
        demand.title.toLowerCase().includes(lowerKeyword) ||
        demand.description.toLowerCase().includes(lowerKeyword)
      );
    }

    if (filters.userNeighborhood) {
      demands = demands.filter(demand => {
        const requester = userRepository.findById(demand.requesterId);
        if (!requester) return false;
        return requester.neighborhood === filters.userNeighborhood;
      });
    }

    const urgencyOrder: Record<string, number> = {
      very_urgent: 3,
      urgent: 2,
      normal: 1,
    };

    const sortBy = sort.sortBy || 'createdAt';
    const sortOrder = sort.sortOrder || 'desc';

    demands.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'timeCoinReward':
          comparison = a.timeCoinReward - b.timeCoinReward;
          break;
        case 'viewCount':
          comparison = a.viewCount - b.viewCount;
          break;
        case 'urgency':
          comparison = (urgencyOrder[a.urgency] || 0) - (urgencyOrder[b.urgency] || 0);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const total = demands.length;
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 10;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedDemands = demands.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedDemands,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  public createDemand(data: Omit<Demand, 'id' | 'status' | 'viewCount' | 'createdAt' | 'updatedAt' | 'urgency'> & { urgency?: 'normal' | 'urgent' | 'very_urgent' }): Demand {
    const demand: Demand = {
      id: generateId(),
      status: 'open',
      viewCount: 0,
      urgency: 'normal',
      ...data,
      createdAt: getCurrentTime(),
      updatedAt: getCurrentTime(),
    };
    return db.insert<Demand>(this.demandCollection, demand);
  }

  public updateDemand(id: string, updates: Partial<Demand>): Demand | undefined {
    return db.update<Demand>(this.demandCollection, id, { ...updates, updatedAt: getCurrentTime() });
  }

  public deleteDemand(id: string): boolean {
    return db.delete(this.demandCollection, id);
  }

  public incrementViewCount(id: string): Demand | undefined {
    const demand = this.findDemandById(id);
    if (!demand) return undefined;
    return this.updateDemand(id, { viewCount: demand.viewCount + 1 });
  }

  public findResponsesByDemandId(demandId: string): DemandResponse[] {
    return db.findMany<DemandResponse>(this.responseCollection, (r) => r.demandId === demandId);
  }

  public findResponseById(id: string): DemandResponse | undefined {
    return db.getById<DemandResponse>(this.responseCollection, id);
  }

  public findResponsesByResponderId(responderId: string): DemandResponse[] {
    return db.findMany<DemandResponse>(this.responseCollection, (r) => r.responderId === responderId);
  }

  public createResponse(data: Omit<DemandResponse, 'id' | 'status' | 'createdAt'>): DemandResponse {
    const response: DemandResponse = {
      id: generateId(),
      status: 'pending',
      ...data,
      createdAt: getCurrentTime(),
    };
    return db.insert<DemandResponse>(this.responseCollection, response);
  }

  public updateResponse(id: string, updates: Partial<DemandResponse>): DemandResponse | undefined {
    return db.update<DemandResponse>(this.responseCollection, id, updates);
  }

  public deleteResponse(id: string): boolean {
    return db.delete(this.responseCollection, id);
  }

  public createOrder(data: Omit<DemandOrder, 'id' | 'createdAt' | 'timeline'> & { timeline?: any[] }): DemandOrder {
    const order: DemandOrder = {
      id: generateId(),
      timeline: [],
      ...data,
      createdAt: getCurrentTime(),
    };
    return db.insert<DemandOrder>(this.orderCollection, order);
  }

  public findOrderById(id: string): DemandOrder | undefined {
    return db.getById<DemandOrder>(this.orderCollection, id);
  }

  public findOrdersByDemandId(demandId: string): DemandOrder[] {
    return db.findMany<DemandOrder>(this.orderCollection, (o) => o.demandId === demandId);
  }

  public findOrdersByRequesterId(requesterId: string): DemandOrder[] {
    return db.findMany<DemandOrder>(this.orderCollection, (o) => o.requesterId === requesterId);
  }

  public findOrdersByResponderId(responderId: string): DemandOrder[] {
    return db.findMany<DemandOrder>(this.orderCollection, (o) => o.responderId === responderId);
  }

  public updateOrder(id: string, updates: Partial<DemandOrder>): DemandOrder | undefined {
    return db.update<DemandOrder>(this.orderCollection, id, updates);
  }

  public toDemandWithDetails(demand: Demand): DemandWithDetails {
    const requester = userRepository.findById(demand.requesterId);
    const responses = this.findResponsesByDemandId(demand.id);
    const acceptedResponse = demand.acceptedResponseId
      ? responses.find(r => r.id === demand.acceptedResponseId)
      : undefined;

    return {
      ...demand,
      requester: requester ? userRepository.toPublicUser(requester) : {} as any,
      responses: responses.map(r => this.toResponseWithDetails(r)),
      acceptedResponse: acceptedResponse ? this.toResponseWithDetails(acceptedResponse) : undefined,
    };
  }

  public toResponseWithDetails(response: DemandResponse): DemandResponseWithDetails {
    const responder = userRepository.findById(response.responderId);
    return {
      ...response,
      responder: responder ? userRepository.toPublicUser(responder) : {} as any,
    };
  }

  public toOrderWithDetails(order: DemandOrder): DemandOrderWithDetails {
    const demand = this.findDemandById(order.demandId);
    const requester = userRepository.findById(order.requesterId);
    const responder = userRepository.findById(order.responderId);

    return {
      ...order,
      demand: demand ? this.toDemandWithDetails(demand) : {} as any,
      requester: requester ? userRepository.toPublicUser(requester) : {} as any,
      responder: responder ? userRepository.toPublicUser(responder) : {} as any,
    };
  }
}

export const demandRepository = new DemandRepository();
