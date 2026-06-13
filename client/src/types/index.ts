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

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface SkillSchedule {
  id: string;
  skillId: string;
  date: string;
  timeSlots: TimeSlot[];
  createdAt: string;
}

export interface DailyAvailableSlots {
  date: string;
  timeSlots: TimeSlot[];
  availableSlots: TimeSlot[];
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

export type DepositStatus = 'normal' | 'frozen' | 'partially_refunded' | 'refunded';

export interface DamageReport {
  reporterId: string;
  description: string;
  photos: string[];
  reportedAt: string;
}

export interface NegotiationMessage {
  id: string;
  senderId: string;
  content: string;
  amount?: number;
  createdAt: string;
}

export type NegotiationStatus = 'awaiting_lender_offer' | 'awaiting_borrower_response' | 'awaiting_lender_confirmation' | 'agreed' | 'escalated';

export interface DisputeNegotiation {
  status: NegotiationStatus;
  lenderOffer?: number;
  borrowerOffer?: number;
  acceptedAmount?: number;
  messages: NegotiationMessage[];
  lastOfferBy?: string;
  lastOfferAmount?: number;
}

export interface BorrowOrder {
  id: string;
  itemId: string;
  borrowerId: string;
  lenderId: string;
  startDate: string;
  endDate: string;
  actualReturnDate?: string;
  deposit: number;
  depositStatus?: DepositStatus;
  compensationAmount?: number;
  refundAmount?: number;
  damageReport?: DamageReport;
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
  serviceStartTime: string;
  serviceEndTime: string;
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

export interface ReviewReply {
  id: string;
  reviewId: string;
  replierId: string;
  content: string;
  createdAt: string;
}

export interface ReviewReplyWithUser extends ReviewReply {
  replier: PublicUser;
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
  replies: ReviewReplyWithUser[];
}

export type DisputeStatus = 'pending' | 'negotiating' | 'reviewing' | 'resolved';

export type DisputeCategory = 'general' | 'damage';

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
  category?: DisputeCategory;
  resolution?: string;
  resolverId?: string;
  createdAt: string;
  resolvedAt?: string;
  negotiation?: DisputeNegotiation;
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

export interface DamageReportRequest {
  description: string;
  photos: string[];
}

export interface NegotiationOfferRequest {
  amount: number;
  message?: string;
}

export interface NegotiationMessageRequest {
  content: string;
  amount?: number;
}

export interface NegotiationAcceptRequest {
  amount: number;
}

export interface EscalateDisputeRequest {
  reason?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
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

export type NotificationType =
  | 'order_status'
  | 'dispute_status'
  | 'new_review'
  | 'queue_turn'
  | 'queue_expired'
  | 'queue_cancelled'
  | 'system';

export type DepositTransactionType = 'payment' | 'refund' | 'deduction';

export interface DepositTransaction {
  id: string;
  userId: string;
  orderId: string;
  type: DepositTransactionType;
  amount: number;
  description: string;
  createdAt: string;
}

export type TimeCoinTransactionType = 'income' | 'expenditure';

export interface TimeCoinTransaction {
  id: string;
  userId: string;
  relatedId: string;
  relatedType: 'borrow_order' | 'service_order' | 'system';
  type: TimeCoinTransactionType;
  amount: number;
  source: string;
  description: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: 'borrow_order' | 'service_order' | 'dispute' | 'item' | 'queue';
  read: boolean;
  createdAt: string;
}
