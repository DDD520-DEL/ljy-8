export interface User {
  id: string;
  phone: string;
  email: string;
  password: string;
  nickname: string;
  avatar: string;
  creditScore: number;
  creditLevel: string;
  timeCoins: number;
  neighborhood: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface PublicUser {
  id: string;
  nickname: string;
  avatar: string;
  creditScore: number;
  creditLevel: string;
  neighborhood: string;
  timeCoins?: number;
  createdAt: string;
}

export interface Item {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  deposit: number;
  borrowRules: string;
  maxBorrowDays: number;
  status: 'available' | 'borrowed' | 'maintenance';
  createdAt: string;
  viewCount: number;
}

export interface ItemWithOwner extends Item {
  owner: PublicUser;
}

export interface Skill {
  id: string;
  providerId: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  timeCoinPrice: number;
  serviceDuration: number;
  serviceArea: string;
  status: 'active' | 'inactive';
  createdAt: string;
  viewCount: number;
}

export interface SkillWithProvider extends Skill {
  provider: PublicUser;
}

export interface TimelineEvent {
  time: string;
  event: string;
  operator: string;
}

export type BorrowOrderStatus = 'pending' | 'approved' | 'rejected' | 'borrowing' | 'returned' | 'disputed';

export interface BorrowOrder {
  id: string;
  itemId: string;
  borrowerId: string;
  lenderId: string;
  startDate: string;
  endDate: string;
  actualReturnDate?: string;
  deposit: number;
  status: BorrowOrderStatus;
  message?: string;
  timeline: TimelineEvent[];
  createdAt: string;
}

export interface BorrowOrderWithDetails extends BorrowOrder {
  item: ItemWithOwner;
  borrower: PublicUser;
  lender: PublicUser;
}

export type ServiceOrderStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'disputed';

export interface ServiceOrder {
  id: string;
  skillId: string;
  clientId: string;
  providerId: string;
  serviceDate: string;
  address: string;
  timeCoinPrice: number;
  status: ServiceOrderStatus;
  message?: string;
  timeline: TimelineEvent[];
  createdAt: string;
}

export interface ServiceOrderWithDetails extends ServiceOrder {
  skill: SkillWithProvider;
  client: PublicUser;
  provider: PublicUser;
}

export interface Review {
  id: string;
  orderId: string;
  orderType: 'borrow' | 'service';
  reviewerId: string;
  revieweeId: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface ReviewWithUser extends Review {
  reviewer: PublicUser;
  reviewee: PublicUser;
}

export type DisputeStatus = 'pending' | 'reviewing' | 'resolved';

export interface Dispute {
  id: string;
  orderId: string;
  orderType: 'borrow' | 'service';
  complainantId: string;
  respondentId: string;
  reason: string;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  resolution?: string;
  resolverId?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface DisputeWithDetails extends Dispute {
  order: BorrowOrderWithDetails | ServiceOrderWithDetails;
  complainant: PublicUser;
  respondent: PublicUser;
}

export interface LoginRequest {
  phone?: string;
  email?: string;
  password: string;
}

export interface RegisterRequest {
  phone: string;
  email: string;
  nickname: string;
  password: string;
  neighborhood: string;
}

export interface BorrowRequest {
  itemId: string;
  startDate: string;
  endDate: string;
  message?: string;
}

export interface ServiceOrderRequest {
  skillId: string;
  serviceDate: string;
  address: string;
  message?: string;
}

export type QueueStatus = 'waiting' | 'notified' | 'confirmed' | 'expired' | 'cancelled' | 'borrowed';

export interface QueueEntry {
  id: string;
  itemId: string;
  userId: string;
  position: number;
  status: QueueStatus;
  notifiedAt?: string;
  confirmedAt?: string;
  expiredAt?: string;
  cancelledAt?: string;
  message?: string;
  createdAt: string;
}

export interface QueueEntryWithDetails extends QueueEntry {
  item: ItemWithOwner;
  user: PublicUser;
}

export interface QueueNotification {
  id: string;
  userId: string;
  queueEntryId: string;
  itemId: string;
  type: 'queue_turn' | 'queue_expired' | 'queue_cancelled';
  message: string;
  read: boolean;
  createdAt: string;
}

export interface QueueRequest {
  itemId: string;
  message?: string;
}

export interface ConfirmQueueRequest {
  startDate: string;
  endDate: string;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
