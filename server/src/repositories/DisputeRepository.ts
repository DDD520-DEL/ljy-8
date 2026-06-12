import { db } from '../utils/db';
import { Dispute, DisputeWithDetails } from '../types';
import { generateId, getCurrentTime } from '../utils/helpers';
import { userRepository } from './UserRepository';
import { orderRepository } from './OrderRepository';

export class DisputeRepository {
  private collection = 'disputes';

  public findAll(): Dispute[] {
    return db.getAll<Dispute>(this.collection);
  }

  public findById(id: string): Dispute | undefined {
    return db.getById<Dispute>(this.collection, id);
  }

  public findByComplainantId(complainantId: string): Dispute[] {
    return db.findMany<Dispute>(this.collection, (dispute) => dispute.complainantId === complainantId);
  }

  public findByRespondentId(respondentId: string): Dispute[] {
    return db.findMany<Dispute>(this.collection, (dispute) => dispute.respondentId === respondentId);
  }

  public findByStatus(status: string): Dispute[] {
    return db.findMany<Dispute>(this.collection, (dispute) => dispute.status === status);
  }

  public create(disputeData: Omit<Dispute, 'id' | 'createdAt' | 'status'>): Dispute {
    const dispute: Dispute = {
      id: generateId(),
      ...disputeData,
      status: 'pending',
      createdAt: getCurrentTime(),
    };
    return db.insert<Dispute>(this.collection, dispute);
  }

  public update(id: string, updates: Partial<Dispute>): Dispute | undefined {
    if (updates.status === 'resolved' && !updates.resolvedAt) {
      updates.resolvedAt = getCurrentTime();
    }
    return db.update<Dispute>(this.collection, id, updates);
  }

  public toDisputeWithDetails(dispute: Dispute): DisputeWithDetails {
    const complainant = userRepository.findById(dispute.complainantId);
    const respondent = userRepository.findById(dispute.respondentId);
    
    let order: any;
    if (dispute.orderType === 'borrow') {
      const borrowOrder = orderRepository.findBorrowOrderById(dispute.orderId);
      if (borrowOrder) {
        order = orderRepository.toBorrowOrderWithDetails(borrowOrder);
      }
    } else {
      const serviceOrder = orderRepository.findServiceOrderById(dispute.orderId);
      if (serviceOrder) {
        order = orderRepository.toServiceOrderWithDetails(serviceOrder);
      }
    }
    
    return {
      ...dispute,
      order,
      complainant: complainant ? userRepository.toPublicUser(complainant) : {} as any,
      respondent: respondent ? userRepository.toPublicUser(respondent) : {} as any,
    };
  }
}

export const disputeRepository = new DisputeRepository();
