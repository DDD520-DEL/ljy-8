import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderApi, reviewApi, disputeApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type {
  BorrowOrderWithDetails,
  ServiceOrderWithDetails,
  ReviewWithUser,
} from '../types';

interface OrderDetailProps {
  type: 'borrow' | 'service';
}

function OrderDetail({ type }: OrderDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<BorrowOrderWithDetails | ServiceOrderWithDetails | null>(null);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewWithUser | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [replyForm, setReplyForm] = useState({ content: '' });
  const [disputeForm, setDisputeForm] = useState({ reason: '', description: '' });
  const [damageForm, setDamageForm] = useState({ description: '', photos: '' });
  const [submitting, setSubmitting] = useState(false);
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id, type]);

  const loadOrder = async () => {
    setLoading(true);
    let res;
    if (type === 'borrow') {
      res = await orderApi.getBorrowOrderById(id!);
    } else {
      res = await orderApi.getServiceOrderById(id!);
    }
    if (res.success) {
      setOrder(res.data);
      loadReviews();
    }
    setLoading(false);
  };

  const loadReviews = async () => {
    const res = await reviewApi.getReviewsByOrder(id!, type);
    if (res.success) {
      setReviews(res.data || []);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    let res;
    if (type === 'borrow') {
      res = await orderApi.approveBorrowOrder(id);
    } else {
      res = await orderApi.approveServiceOrder(id);
    }
    if (res.success) {
      alert('已同意');
      loadOrder();
    } else {
      alert(res.message || '操作失败');
    }
  };

  const handleReject = async () => {
    const reason = prompt('请输入拒绝原因：');
    if (reason === null) return;
    if (!id) return;
    let res;
    if (type === 'borrow') {
      res = await orderApi.rejectBorrowOrder(id, reason);
    } else {
      res = await orderApi.rejectServiceOrder(id, reason);
    }
    if (res.success) {
      alert('已拒绝');
      loadOrder();
    } else {
      alert(res.message || '操作失败');
    }
  };

  const handleConfirmLend = async () => {
    if (!id || type !== 'borrow') return;
    const res = await orderApi.confirmLend(id);
    if (res.success) {
      alert('已确认借出');
      loadOrder();
    } else {
      alert(res.message || '操作失败');
    }
  };

  const handleConfirmReturn = async () => {
    if (!id || type !== 'borrow') return;
    const res = await orderApi.confirmReturn(id);
    if (res.success) {
      alert('已确认归还，押金已全额退还');
      loadOrder();
    } else {
      alert(res.message || '操作失败');
    }
  };

  const handleReportDamage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || type !== 'borrow') return;
    if (!damageForm.description.trim()) {
      alert('请填写损坏描述');
      return;
    }
    setSubmitting(true);
    try {
      const photos = damageForm.photos
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);
      const res = await orderApi.confirmReturnWithDamage(id, {
        description: damageForm.description.trim(),
        photos,
      });
      if (res.success) {
        alert('已标记损坏并冻结押金，已自动发起赔偿协商');
        setShowDamageModal(false);
        navigate('/disputes');
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartService = async () => {
    if (!id || type !== 'service') return;
    const res = await orderApi.startService(id);
    if (res.success) {
      alert('服务已开始');
      loadOrder();
    } else {
      alert(res.message || '操作失败');
    }
  };

  const handleCompleteService = async () => {
    if (!id || type !== 'service') return;
    const res = await orderApi.completeService(id);
    if (res.success) {
      alert('服务已完成');
      loadOrder();
    } else {
      alert(res.message || '操作失败');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const otherPartyId = type === 'borrow'
        ? user?.id === (order as BorrowOrderWithDetails).lenderId
          ? (order as BorrowOrderWithDetails).borrowerId
          : (order as BorrowOrderWithDetails).lenderId
        : user?.id === (order as ServiceOrderWithDetails).providerId
          ? (order as ServiceOrderWithDetails).clientId
          : (order as ServiceOrderWithDetails).providerId;

      const res = await reviewApi.createReview({
        orderId: id,
        orderType: type,
        revieweeId: otherPartyId,
        ...reviewForm,
      });
      if (res.success) {
        alert('评价成功！');
        setShowReviewModal(false);
        setReviewForm({ rating: 5, content: '' });
        loadReviews();
      } else {
        alert(res.message || '评价失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setReplying(true);
    try {
      const res = await reviewApi.createReviewReply(selectedReview.id, replyForm.content);
      if (res.success) {
        alert('回复成功！');
        setShowReplyModal(false);
        setSelectedReview(null);
        setReplyForm({ content: '' });
        loadReviews();
      } else {
        alert(res.message || '回复失败');
      }
    } finally {
      setReplying(false);
    }
  };

  const handleOpenReply = (review: ReviewWithUser) => {
    setSelectedReview(review);
    setReplyForm({ content: '' });
    setShowReplyModal(true);
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await disputeApi.createDispute({
        orderId: id,
        orderType: type,
        ...disputeForm,
        evidence: [],
      });
      if (res.success) {
        alert('纠纷已提交！');
        setShowDisputeModal(false);
        navigate('/disputes');
      } else {
        alert(res.message || '提交失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusText = (status: string) => {
    if (type === 'borrow') {
      const map: Record<string, { text: string; color: string }> = {
        pending: { text: '待确认', color: 'orange' },
        approved: { text: '已同意', color: 'blue' },
        rejected: { text: '已拒绝', color: 'red' },
        borrowing: { text: '借用中', color: 'green' },
        returned: { text: '已归还', color: 'gray' },
        disputed: { text: '纠纷/赔偿协商', color: 'red' },
      };
      return map[status] || { text: status, color: 'gray' };
    } else {
      const map: Record<string, { text: string; color: string }> = {
        pending: { text: '待确认', color: 'orange' },
        approved: { text: '已同意', color: 'blue' },
        rejected: { text: '已拒绝', color: 'red' },
        in_progress: { text: '进行中', color: 'green' },
        completed: { text: '已完成', color: 'gray' },
        disputed: { text: '纠纷中', color: 'red' },
      };
      return map[status] || { text: status, color: 'gray' };
    }
  };

  const getDepositStatusText = (status?: string) => {
    const map: Record<string, { text: string; color: string }> = {
      normal: { text: '正常', color: 'green' },
      frozen: { text: '已冻结', color: 'orange' },
      partially_refunded: { text: '部分退还', color: 'blue' },
      refunded: { text: '已退还', color: 'gray' },
    };
    return map[status || 'normal'] || { text: '正常', color: 'green' };
  };

  const isLenderOrProvider =
    type === 'borrow'
      ? user?.id === (order as BorrowOrderWithDetails)?.lenderId
      : user?.id === (order as ServiceOrderWithDetails)?.providerId;

  const isBorrowerOrClient =
    type === 'borrow'
      ? user?.id === (order as BorrowOrderWithDetails)?.borrowerId
      : user?.id === (order as ServiceOrderWithDetails)?.clientId;

  const canReview =
    (type === 'borrow' && order?.status === 'returned') ||
    (type === 'service' && order?.status === 'completed');

  const hasReviewed = reviews.some(r => r.reviewerId === user?.id);

  const canDispute =
    order?.status === 'borrowing' ||
    order?.status === 'in_progress' ||
    order?.status === 'approved';

  const getOtherPartyName = () => {
    if (!order) return '对方';
    if (type === 'borrow') {
      return user?.id === (order as BorrowOrderWithDetails).lenderId
        ? (order as BorrowOrderWithDetails).borrower.nickname
        : (order as BorrowOrderWithDetails).lender.nickname;
    } else {
      return user?.id === (order as ServiceOrderWithDetails).providerId
        ? (order as ServiceOrderWithDetails).client.nickname
        : (order as ServiceOrderWithDetails).provider.nickname;
    }
  };

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  if (!order) {
    return <div className="container">订单不存在</div>;
  }

  const statusInfo = getStatusText(order.status);

  return (
    <div className="container order-detail-page">
      <div className="breadcrumb">
        <Link to="/orders">我的订单</Link> / <span>订单详情</span>
      </div>

      <div className="order-detail-header">
        <h1>订单详情</h1>
        <span className={`tag tag-${statusInfo.color}`}>{statusInfo.text}</span>
      </div>

      <div className="order-detail-content">
        <div className="order-main">
          <div className="order-item-card">
            {type === 'borrow' ? (
              <>
                <div className="order-item-image-large">
                  {(order as BorrowOrderWithDetails).item.images[0] ? (
                    <img src={(order as BorrowOrderWithDetails).item.images[0]} alt="" />
                  ) : (
                    <div className="placeholder">📦</div>
                  )}
                </div>
                <div className="order-item-info">
                  <h2>{(order as BorrowOrderWithDetails).item.title}</h2>
                  <p className="text-muted">{(order as BorrowOrderWithDetails).item.category}</p>
                  <p className="price">押金：¥{(order as BorrowOrderWithDetails).deposit}</p>
                </div>
              </>
            ) : (
              <>
                <div className="order-item-image-large skill-bg">
                  {(order as ServiceOrderWithDetails).skill.images[0] ? (
                    <img src={(order as ServiceOrderWithDetails).skill.images[0]} alt="" />
                  ) : (
                    <div className="placeholder">💡</div>
                  )}
                </div>
                <div className="order-item-info">
                  <h2>{(order as ServiceOrderWithDetails).skill.title}</h2>
                  <p className="text-muted">{(order as ServiceOrderWithDetails).skill.category}</p>
                  <p className="price skill-price">⏰ {(order as ServiceOrderWithDetails).timeCoinPrice} 时间币</p>
                </div>
              </>
            )}
          </div>

          <div className="order-info-card">
            <h3>订单信息</h3>
            <div className="info-row">
              <span className="info-label">订单编号</span>
              <span className="info-value">{order.id}</span>
            </div>
            {type === 'borrow' ? (
              <>
                <div className="info-row">
                  <span className="info-label">借用时间</span>
                  <span className="info-value">
                    {(order as BorrowOrderWithDetails).startDate?.split('T')[0]} ~ {(order as BorrowOrderWithDetails).endDate?.split('T')[0]}
                  </span>
                </div>
                {(order as BorrowOrderWithDetails).actualReturnDate && (
                  <div className="info-row">
                    <span className="info-label">实际归还</span>
                    <span className="info-value">
                      {(order as BorrowOrderWithDetails).actualReturnDate?.split('T')[0]}
                    </span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">押金金额</span>
                  <span className="info-value">¥{(order as BorrowOrderWithDetails).deposit}</span>
                </div>
                {(order as BorrowOrderWithDetails).depositStatus && (
                  <div className="info-row">
                    <span className="info-label">押金状态</span>
                    <span className="info-value">
                      <span className={`tag tag-${getDepositStatusText((order as BorrowOrderWithDetails).depositStatus).color}`}>
                        {getDepositStatusText((order as BorrowOrderWithDetails).depositStatus).text}
                      </span>
                    </span>
                  </div>
                )}
                {(order as BorrowOrderWithDetails).compensationAmount !== undefined && (
                  <div className="info-row">
                    <span className="info-label">赔偿金额</span>
                    <span className="info-value text-red">¥{(order as BorrowOrderWithDetails).compensationAmount}</span>
                  </div>
                )}
                {(order as BorrowOrderWithDetails).refundAmount !== undefined && (
                  <div className="info-row">
                    <span className="info-label">退还押金</span>
                    <span className="info-value text-green">¥{(order as BorrowOrderWithDetails).refundAmount}</span>
                  </div>
                )}
                {(order as BorrowOrderWithDetails).damageReport && (
                  <div className="damage-report-section">
                    <h4 style={{ margin: '16px 0 8px', fontSize: '14px', color: '#ff4d4f' }}>⚠️ 损坏报备</h4>
                    <div style={{ background: '#fff1f0', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '14px' }}>
                        {(order as BorrowOrderWithDetails).damageReport?.description}
                      </p>
                      {(order as BorrowOrderWithDetails).damageReport?.photos &&
                        (order as BorrowOrderWithDetails).damageReport!.photos.length > 0 && (
                          <div className="damage-photos">
                            {(order as BorrowOrderWithDetails).damageReport!.photos.map((photo, idx) => (
                              <img key={idx} src={photo} alt="" className="damage-photo" />
                            ))}
                          </div>
                        )}
                      <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#999' }}>
                        报备时间：{new Date((order as BorrowOrderWithDetails).damageReport!.reportedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="info-row">
                  <span className="info-label">服务时间</span>
                  <span className="info-value">
                    {(order as ServiceOrderWithDetails).serviceDate} {(order as ServiceOrderWithDetails).serviceStartTime} - {(order as ServiceOrderWithDetails).serviceEndTime}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">服务地址</span>
                  <span className="info-value">
                    {(order as ServiceOrderWithDetails).address}
                  </span>
                </div>
              </>
            )}
            {order.message && (
              <div className="info-row">
                <span className="info-label">留言</span>
                <span className="info-value">{order.message}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">创建时间</span>
              <span className="info-value">
                {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="timeline-card">
            <h3>订单时间线</h3>
            <div className="timeline">
              {order.timeline.map((event, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <p className="timeline-event">{event.event}</p>
                    <p className="timeline-time">
                      {new Date(event.time).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="reviews-section-card">
            <div className="section-header">
              <h3>订单评价</h3>
              {canReview && !hasReviewed && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowReviewModal(true)}
                >
                  评价 {getOtherPartyName()}
                </button>
              )}
            </div>
            {reviews.length === 0 ? (
              <div className="empty-list">
                <p>暂无评价</p>
                {canReview && !hasReviewed && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowReviewModal(true)}
                  >
                    去评价
                  </button>
                )}
              </div>
            ) : (
              <div className="review-list">
                {reviews.map((review) => {
                  const canReply = review.revieweeId === user?.id || review.reviewerId === user?.id;
                  return (
                    <div key={review.id} className="review-item">
                      <img src={review.reviewer.avatar} alt="" className="avatar" />
                      <div className="review-content">
                        <div className="review-header">
                          <div>
                            <span className="reviewer-name">{review.reviewer.nickname}</span>
                            {review.reviewerId === user?.id && (
                              <span className="review-tag tag tag-blue">我</span>
                            )}
                            <span className="review-rating">
                              {'⭐'.repeat(review.rating)}
                            </span>
                          </div>
                          {canReply && (
                            <button
                              className="btn btn-link btn-sm"
                              onClick={() => handleOpenReply(review)}
                            >
                              回复
                            </button>
                          )}
                        </div>
                        <p className="review-text">{review.content}</p>
                        <span className="review-date">
                          {new Date(review.createdAt).toLocaleString()}
                        </span>
                        {review.replies && review.replies.length > 0 && (
                          <div className="review-replies">
                            {review.replies.map((reply) => (
                              <div key={reply.id} className="review-reply-item">
                                <img src={reply.replier.avatar} alt="" className="avatar avatar-sm" />
                                <div className="review-reply-content">
                                  <div className="review-reply-header">
                                    <span className="replier-name">
                                      {reply.replier.nickname}
                                      {reply.replierId === user?.id && (
                                        <span className="review-tag tag tag-blue">我</span>
                                      )}
                                    </span>
                                    <span className="reply-date">
                                      {new Date(reply.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="reply-text">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="order-sidebar">
          <div className="user-card">
            <h3>双方信息</h3>
            {type === 'borrow' ? (
              <>
                <div className="user-row">
                  <img
                    src={(order as BorrowOrderWithDetails).lender.avatar}
                    alt=""
                    className="avatar"
                  />
                  <div>
                    <p className="user-name">
                      {(order as BorrowOrderWithDetails).lender.nickname}
                    </p>
                    <p className="user-role">出借方</p>
                  </div>
                </div>
                <div className="user-row">
                  <img
                    src={(order as BorrowOrderWithDetails).borrower.avatar}
                    alt=""
                    className="avatar"
                  />
                  <div>
                    <p className="user-name">
                      {(order as BorrowOrderWithDetails).borrower.nickname}
                    </p>
                    <p className="user-role">借入方</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="user-row">
                  <img
                    src={(order as ServiceOrderWithDetails).provider.avatar}
                    alt=""
                    className="avatar"
                  />
                  <div>
                    <p className="user-name">
                      {(order as ServiceOrderWithDetails).provider.nickname}
                    </p>
                    <p className="user-role">服务方</p>
                  </div>
                </div>
                <div className="user-row">
                  <img
                    src={(order as ServiceOrderWithDetails).client.avatar}
                    alt=""
                    className="avatar"
                  />
                  <div>
                    <p className="user-name">
                      {(order as ServiceOrderWithDetails).client.nickname}
                    </p>
                    <p className="user-role">客户</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="actions-card">
            {isLenderOrProvider && order.status === 'pending' && (
              <>
                <button className="btn btn-primary w-full" onClick={handleApprove}>
                  同意
                </button>
                <button className="btn btn-secondary w-full" onClick={handleReject}>
                  拒绝
                </button>
              </>
            )}

            {type === 'borrow' && isLenderOrProvider && order.status === 'approved' && (
              <button className="btn btn-success w-full" onClick={handleConfirmLend}>
                确认借出
              </button>
            )}

            {type === 'borrow' && isLenderOrProvider && order.status === 'borrowing' && (
              <>
                <button className="btn btn-success w-full" onClick={handleConfirmReturn}>
                  ✅ 确认归还（物品完好）
                </button>
                <button
                  className="btn btn-danger w-full"
                  onClick={() => {
                    setDamageForm({ description: '', photos: '' });
                    setShowDamageModal(true);
                  }}
                >
                  ⚠️ 标记物品损坏
                </button>
              </>
            )}

            {type === 'borrow' && order.status === 'disputed' && (
              <Link to={`/disputes`} className="btn btn-warning w-full text-center no-underline">
                查看赔偿协商
              </Link>
            )}

            {type === 'service' && isLenderOrProvider && order.status === 'approved' && (
              <button className="btn btn-success w-full" onClick={handleStartService}>
                开始服务
              </button>
            )}

            {type === 'service' && isBorrowerOrClient && order.status === 'in_progress' && (
              <button className="btn btn-success w-full" onClick={handleCompleteService}>
                确认完成
              </button>
            )}

            {canReview && !hasReviewed && (
              <button
                className="btn btn-primary w-full"
                onClick={() => setShowReviewModal(true)}
              >
                评价 {getOtherPartyName()}
              </button>
            )}

            {canDispute && (
              <button
                className="btn btn-danger w-full"
                onClick={() => setShowDisputeModal(true)}
              >
                申请纠纷
              </button>
            )}
          </div>
        </div>
      </div>

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>评价 {getOtherPartyName()}</h3>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label className="form-label">评分</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${reviewForm.rating >= star ? 'active' : ''}`}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">评价内容</label>
                <textarea
                  className="form-textarea"
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                  placeholder="请输入您的评价..."
                  required
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReviewModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '提交中...' : '提交评价'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReplyModal && selectedReview && (
        <div className="modal-overlay" onClick={() => setShowReplyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>回复评价</h3>
              <button className="modal-close" onClick={() => setShowReplyModal(false)}>
                ×
              </button>
            </div>
            <div className="reply-review-preview">
              <div className="review-header">
                <span className="reviewer-name">{selectedReview.reviewer.nickname}</span>
                <span className="review-rating">
                  {'⭐'.repeat(selectedReview.rating)}
                </span>
              </div>
              <p className="review-text">{selectedReview.content}</p>
            </div>
            <form onSubmit={handleReplySubmit}>
              <div className="form-group">
                <label className="form-label">回复内容</label>
                <textarea
                  className="form-textarea"
                  value={replyForm.content}
                  onChange={(e) => setReplyForm({ content: e.target.value })}
                  placeholder="请输入您的回复..."
                  required
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReplyModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={replying}>
                  {replying ? '提交中...' : '提交回复'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDisputeModal && (
        <div className="modal-overlay" onClick={() => setShowDisputeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>申请纠纷仲裁</h3>
              <button className="modal-close" onClick={() => setShowDisputeModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleDisputeSubmit}>
              <div className="form-group">
                <label className="form-label">纠纷原因</label>
                <input
                  type="text"
                  className="form-input"
                  value={disputeForm.reason}
                  onChange={(e) => setDisputeForm({ ...disputeForm, reason: e.target.value })}
                  placeholder="请简要说明纠纷原因"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">详细描述</label>
                <textarea
                  className="form-textarea"
                  value={disputeForm.description}
                  onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                  placeholder="请详细描述纠纷情况..."
                  rows={4}
                  required
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDisputeModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  {submitting ? '提交中...' : '提交纠纷'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDamageModal && (
        <div className="modal-overlay" onClick={() => setShowDamageModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#ff4d4f' }}>⚠️ 物品损坏报备</h3>
              <button className="modal-close" onClick={() => setShowDamageModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleReportDamage}>
              <div className="damage-notice" style={{
                background: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#d46b08',
              }}>
                <p style={{ margin: '0 0 4px', fontWeight: '500' }}>报备后将触发以下操作：</p>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  <li>押金将被冻结，暂不退还</li>
                  <li>自动发起赔偿协商流程</li>
                  <li>双方可在纠纷界面协商赔偿金额</li>
                </ul>
              </div>
              <div className="form-group">
                <label className="form-label">损坏描述 <span style={{ color: 'red' }}>*</span></label>
                <textarea
                  className="form-textarea"
                  value={damageForm.description}
                  onChange={(e) => setDamageForm({ ...damageForm, description: e.target.value })}
                  placeholder="请详细描述物品损坏情况，如损坏部位、程度等..."
                  rows={4}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">照片凭证（每行一个图片URL链接）</label>
                <textarea
                  className="form-textarea"
                  value={damageForm.photos}
                  onChange={(e) => setDamageForm({ ...damageForm, photos: e.target.value })}
                  placeholder="请输入图片链接，每行一个链接...&#10;https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                  rows={4}
                />
                <small style={{ color: '#999', marginTop: '4px', display: 'block' }}>
                  支持输入多个图片链接，每行一个
                </small>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDamageModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  {submitting ? '提交中...' : '确认报备并冻结押金'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .order-detail-page {
          padding-top: 0;
        }
        .breadcrumb {
          margin-bottom: 20px;
          color: #999;
          font-size: 14px;
        }
        .breadcrumb a {
          color: #667eea;
        }
        .order-detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .order-detail-header h1 {
          font-size: 28px;
        }
        .order-detail-content {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
        }
        .order-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .order-item-card,
        .order-info-card,
        .timeline-card,
        .reviews-section-card,
        .user-card,
        .actions-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .order-item-card {
          display: flex;
          gap: 20px;
        }
        .order-item-image-large {
          width: 160px;
          height: 160px;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .order-item-image-large.skill-bg {
          background: linear-gradient(135deg, #667eea22 0%, #764ba222 100%);
        }
        .order-item-image-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .placeholder {
          font-size: 64px;
        }
        .order-item-info {
          flex: 1;
        }
        .order-item-info h2 {
          font-size: 20px;
          margin-bottom: 8px;
        }
        .order-item-info .price {
          font-size: 20px;
          color: #ff4d4f;
          font-weight: 600;
          margin-top: 12px;
        }
        .order-item-info .skill-price {
          color: #667eea;
        }
        .order-info-card h3,
        .timeline-card h3,
        .user-card h3,
        .reviews-section-card h3 {
          font-size: 18px;
          margin-bottom: 16px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          color: #999;
        }
        .info-value {
          color: #333;
          text-align: right;
          flex: 1;
          margin-left: 20px;
        }
        .timeline {
          position: relative;
          padding-left: 24px;
        }
        .timeline-item {
          position: relative;
          padding-bottom: 20px;
        }
        .timeline-item:last-child {
          padding-bottom: 0;
        }
        .timeline-dot {
          position: absolute;
          left: -24px;
          top: 4px;
          width: 12px;
          height: 12px;
          background: #667eea;
          border-radius: 50%;
        }
        .timeline-event {
          font-size: 14px;
          color: #333;
          margin-bottom: 4px;
        }
        .timeline-time {
          font-size: 12px;
          color: #999;
        }
        .order-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .user-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .user-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .user-name {
          font-weight: 500;
        }
        .user-role {
          font-size: 12px;
          color: #999;
        }
        .actions-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rating-input {
          display: flex;
          gap: 8px;
          font-size: 28px;
        }
        .rating-input .star {
          cursor: pointer;
          opacity: 0.3;
        }
        .rating-input .star.active {
          opacity: 1;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #f0f0f0;
        }
        .modal-header h3 {
          font-size: 18px;
        }
        .modal-close {
          font-size: 24px;
          background: none;
          color: #999;
          cursor: pointer;
        }
        .modal form {
          padding: 24px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        .w-full {
          width: 100%;
        }
        .text-muted {
          color: #999;
        }
        .text-red {
          color: #ff4d4f;
          font-weight: 500;
        }
        .text-green {
          color: #52c41a;
          font-weight: 500;
        }
        .damage-photos {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .damage-photo {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #f0f0f0;
        }
        .no-underline {
          text-decoration: none;
        }
        .btn-sm {
          padding: 6px 14px;
          font-size: 13px;
        }
        .btn-link {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          padding: 4px 8px;
        }
        .btn-link:hover {
          text-decoration: underline;
        }
        .empty-list {
          text-align: center;
          padding: 40px 0;
          color: #999;
        }
        .empty-list p {
          margin-bottom: 16px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .review-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .review-item {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
        }
        .review-content {
          flex: 1;
          min-width: 0;
        }
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .reviewer-name {
          font-weight: 500;
          margin-right: 8px;
        }
        .review-tag {
          display: inline-block;
          padding: 1px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
          margin-right: 8px;
        }
        .tag-blue {
          background: #e6f7ff;
          color: #1890ff;
        }
        .review-rating {
          font-size: 14px;
        }
        .review-text {
          color: #666;
          margin-bottom: 8px;
          line-height: 1.6;
        }
        .review-date {
          font-size: 12px;
          color: #999;
        }
        .review-replies {
          margin-top: 12px;
          padding-left: 12px;
          border-left: 2px solid #e8e8e8;
        }
        .review-reply-item {
          display: flex;
          gap: 8px;
          padding: 10px 0;
        }
        .avatar-sm {
          width: 28px;
          height: 28px;
        }
        .review-reply-content {
          flex: 1;
          min-width: 0;
        }
        .review-reply-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .replier-name {
          font-weight: 500;
          font-size: 13px;
        }
        .reply-date {
          font-size: 11px;
          color: #999;
        }
        .reply-text {
          color: #666;
          font-size: 13px;
          margin: 0;
          line-height: 1.6;
        }
        .reply-review-preview {
          padding: 16px 24px;
          background: #fafafa;
          border-bottom: 1px solid #f0f0f0;
        }
        .reply-review-preview .review-text {
          margin-top: 8px;
          margin-bottom: 0;
        }
        @media (max-width: 768px) {
          .order-detail-content {
            grid-template-columns: 1fr;
          }
          .order-item-card {
            flex-direction: column;
          }
          .order-item-image-large {
            width: 100%;
            height: 200px;
          }
        }
      `}</style>
    </div>
  );
}

export default OrderDetail;
