export interface PublicUser {
  id: string;
  nickname: string;
  avatar: string;
  creditScore: number;
  creditLevel: string;
  neighborhood: string;
  role?: 'user' | 'admin';
  isVerified: boolean;
  timeCoins?: number;
  createdAt: string;
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface UserVerification {
  id: string;
  userId: string;
  realName: string;
  houseNumber: string;
  status: VerificationStatus;
  rejectReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface UserVerificationWithUser extends UserVerification {
  user: PublicUser;
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
  minCreditLevel: string;
  status: 'available' | 'borrowed' | 'maintenance' | 'donated';
  isDonation: boolean;
  createdAt: string;
  viewCount: number;
  borrowCount: number;
  donateCount: number;
}

export type ItemSortField = 'createdAt' | 'borrowCount' | 'deposit' | 'viewCount';
export type ItemSortOrder = 'asc' | 'desc';

export interface ItemFilterParams {
  category?: string;
  keyword?: string;
  minDeposit?: number;
  maxDeposit?: number;
  minCreditLevel?: string;
  userNeighborhood?: string;
  status?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  | 'review_reply'
  | 'queue_turn'
  | 'queue_expired'
  | 'queue_cancelled'
  | 'new_skill_from_followed'
  | 'donation_status'
  | 'demand_status'
  | 'demand_new_response'
  | 'demand_response_accepted'
  | 'demand_order_completed'
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
  relatedType: 'borrow_order' | 'service_order' | 'system' | 'exchange';
  type: TimeCoinTransactionType;
  amount: number;
  source: string;
  description: string;
  createdAt: string;
}

export type ExchangeItemCategory = 'physical' | 'service_voucher';
export type ExchangeItemStatus = 'active' | 'inactive' | 'sold_out';
export type ExchangeRecordStatus = 'pending' | 'completed' | 'cancelled';

export interface ExchangeItem {
  id: string;
  name: string;
  description: string;
  category: ExchangeItemCategory;
  images: string[];
  coinPrice: number;
  stock: number;
  soldCount: number;
  status: ExchangeItemStatus;
  terms?: string;
  validDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRecord {
  id: string;
  userId: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  coinPrice: number;
  quantity: number;
  totalCoins: number;
  status: ExchangeRecordStatus;
  redeemedAt?: string;
  voucherCode?: string;
  remark?: string;
  createdAt: string;
}

export interface ExchangeRecordWithItem extends ExchangeRecord {
  item?: ExchangeItem;
  user?: PublicUser;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: 'borrow_order' | 'service_order' | 'dispute' | 'item' | 'queue' | 'skill' | 'donation' | 'activity';
  read: boolean;
  createdAt: string;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  itemId: string;
  createdAt: string;
}

export interface FavoriteItemWithDetail extends FavoriteItem {
  item: ItemWithOwner;
}

export interface FollowUser {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface FollowWithDetail extends FollowUser {
  following: PublicUser;
}

export interface FollowerWithDetail extends FollowUser {
  follower: PublicUser;
}

export type AnnouncementCategory = 'water_electricity' | 'property' | 'community_activity' | 'other';
export type AnnouncementPriority = 'normal' | 'important' | 'urgent';
export type AnnouncementStatus = 'published' | 'draft' | 'archived';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  publisherId: string;
  status: AnnouncementStatus;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementWithPublisher extends Announcement {
  publisher: PublicUser;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  status?: AnnouncementStatus;
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  category?: AnnouncementCategory;
  priority?: AnnouncementPriority;
  status?: AnnouncementStatus;
}

export interface DashboardStats {
  totalUsers: number;
  totalItems: number;
  availableItems: number;
  totalSkills: number;
  activeSkills: number;
  borrowOrderStats: Record<string, number>;
  serviceOrderStats: Record<string, number>;
  disputeStats: {
    total: number;
    resolved: number;
    pending: number;
    resolutionRate: number;
  };
  monthlyTimeCoinFlow: {
    income: number;
    expenditure: number;
    total: number;
  };
  recentMonthlyTrend: {
    month: string;
    income: number;
    expenditure: number;
  }[];
  userGrowth: {
    month: string;
    count: number;
  }[];
  categoryStats: {
    itemCategories: Record<string, number>;
    skillCategories: Record<string, number>;
  };
}

export type DonationStatus = 'available' | 'pending_approval' | 'approved' | 'meeting' | 'completed' | 'cancelled';

export interface Donation {
  id: string;
  itemId: string;
  donorId: string;
  recipientId?: string;
  applicantIds: string[];
  status: DonationStatus;
  meetLocation?: string;
  meetTime?: string;
  donorNotes?: string;
  recipientNotes?: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface DonationWithDetails extends Donation {
  item: ItemWithOwner;
  donor: PublicUser;
  recipient?: PublicUser;
  applicants: PublicUser[];
}

export interface CreateDonationRequest {
  itemId: string;
  donorNotes?: string;
}

export interface ApproveDonationRequest {
  recipientId: string;
  meetLocation: string;
  meetTime: string;
}

export interface DonationFilterParams {
  category?: string;
  keyword?: string;
  userNeighborhood?: string;
  status?: DonationStatus;
}

export interface DonationSortParams {
  sortBy?: 'createdAt' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
}

export interface DonationPaginationParams {
  page?: number;
  pageSize?: number;
}

export type DemandType = 'item' | 'service';
export type DemandStatus = 'open' | 'responding' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type DemandResponseStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Demand {
  id: string;
  requesterId: string;
  title: string;
  description: string;
  type: DemandType;
  category: string;
  images: string[];
  timeCoinReward: number;
  urgency: 'normal' | 'urgent' | 'very_urgent';
  contactPhone?: string;
  contactAddress?: string;
  validUntil?: string;
  status: DemandStatus;
  acceptedResponseId?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DemandWithDetails extends Demand {
  requester: PublicUser;
  responses: DemandResponseWithDetails[];
  acceptedResponse?: DemandResponseWithDetails;
}

export interface DemandResponse {
  id: string;
  demandId: string;
  responderId: string;
  message: string;
  estimatedTime?: string;
  priceOffer?: number;
  status: DemandResponseStatus;
  createdAt: string;
}

export interface DemandResponseWithDetails extends DemandResponse {
  responder: PublicUser;
}

export interface DemandOrder {
  id: string;
  demandId: string;
  requesterId: string;
  responderId: string;
  responseId: string;
  timeCoinReward: number;
  status: DemandStatus;
  startTime?: string;
  completedAt?: string;
  timeline: TimelineEvent[];
  createdAt: string;
}

export interface DemandOrderWithDetails extends DemandOrder {
  demand: DemandWithDetails;
  requester: PublicUser;
  responder: PublicUser;
}

export interface CreateDemandRequest {
  title: string;
  description: string;
  type: DemandType;
  category: string;
  images?: string[];
  timeCoinReward: number;
  urgency?: 'normal' | 'urgent' | 'very_urgent';
  contactPhone?: string;
  contactAddress?: string;
  validUntil?: string;
}

export interface UpdateDemandRequest {
  title?: string;
  description?: string;
  type?: DemandType;
  category?: string;
  images?: string[];
  timeCoinReward?: number;
  urgency?: 'normal' | 'urgent' | 'very_urgent';
  contactPhone?: string;
  contactAddress?: string;
  validUntil?: string;
}

export interface CreateDemandResponseRequest {
  message: string;
  estimatedTime?: string;
  priceOffer?: number;
}

export interface AcceptDemandResponseRequest {
  responseId: string;
}

export interface DemandFilterParams {
  type?: DemandType;
  category?: string;
  keyword?: string;
  userNeighborhood?: string;
  status?: DemandStatus;
  urgency?: string;
}

export interface DemandSortParams {
  sortBy?: 'createdAt' | 'timeCoinReward' | 'viewCount' | 'urgency';
  sortOrder?: 'asc' | 'desc';
}

export interface DemandPaginationParams {
  page?: number;
  pageSize?: number;
}

export type LeaderboardType = 'timeCoin' | 'credit' | 'sharing';
export type LeaderboardPeriod = 'all' | 'month';

export interface LeaderboardEntry {
  rank: number;
  user: PublicUser;
  value: number;
}

export interface LeaderboardResult {
  type: LeaderboardType;
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
}

export type ActivityStatus = 'recruiting' | 'full' | 'ongoing' | 'completed' | 'cancelled';
export type ActivityCategory = 'sports' | 'culture' | 'education' | 'social' | 'other';

export interface Activity {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  category: ActivityCategory;
  images: string[];
  location: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  status: ActivityStatus;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityRegistration {
  id: string;
  activityId: string;
  userId: string;
  status: 'registered' | 'cancelled' | 'attended';
  registeredAt: string;
  cancelledAt?: string;
}

export interface ActivityPhoto {
  id: string;
  activityId: string;
  userId: string;
  imageUrl: string;
  description?: string;
  createdAt: string;
}

export interface ActivityWithDetails extends Activity {
  organizer: PublicUser;
  registrations: ActivityRegistrationWithUser[];
  photos: ActivityPhotoWithUser[];
  isRegistered?: boolean;
}

export interface ActivityRegistrationWithUser extends ActivityRegistration {
  user: PublicUser;
}

export interface ActivityPhotoWithUser extends ActivityPhoto {
  user: PublicUser;
}

export interface CreateActivityRequest {
  title: string;
  description: string;
  category: ActivityCategory;
  images?: string[];
  location: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
}

export interface UpdateActivityRequest {
  title?: string;
  description?: string;
  category?: ActivityCategory;
  images?: string[];
  location?: string;
  startTime?: string;
  endTime?: string;
  maxParticipants?: number;
  status?: ActivityStatus;
}

export interface ActivityFilterParams {
  category?: ActivityCategory | 'all';
  keyword?: string;
  userNeighborhood?: string;
  status?: ActivityStatus;
}

export interface ActivitySortParams {
  sortBy?: 'createdAt' | 'startTime' | 'viewCount' | 'maxParticipants';
  sortOrder?: 'asc' | 'desc';
}

export interface ActivityPaginationParams {
  page?: number;
  pageSize?: number;
}

export interface UploadActivityPhotoRequest {
  imageUrl: string;
  description?: string;
}
