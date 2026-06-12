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
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [disputeForm, setDisputeForm] = useState({ reason: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

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
      alert('已确认归还');
      loadOrder();
    } else {
      alert(res.message || '操作失败');
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
      const revieweeId = type === 'borrow'
        ? (order as BorrowOrderWithDetails).lenderId
        : (order as ServiceOrderWithDetails).providerId;
      const res = await reviewApi.createReview({
        orderId: id,
        orderType: type,
        revieweeId: user?.id === revieweeId
          ? type === 'borrow'
            ? (order as BorrowOrderWithDetails).borrowerId
            : (order as ServiceOrderWithDetails).clientId
          : revieweeId,
        ...reviewForm,
      });
      if (res.success) {
        alert('评价成功！');
        setShowReviewModal(false);
        loadReviews();
      } else {
        alert(res.message || '评价失败');
      }
    } finally {
      setSubmitting(false);
    }
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
        disputed: { text: '纠纷中', color: 'red' },
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

  const canDispute =
    order?.status === 'borrowing' ||
    order?.status === 'in_progress' ||
    order?.status === 'approved';

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
              </>
            ) : (
              <>
                <div className="info-row">
                  <span className="info-label">服务时间</span>
                  <span className="info-value">
                    {(order as ServiceOrderWithDetails).serviceDate?.replace('T', ' ')}
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
              <button className="btn btn-success w-full" onClick={handleConfirmReturn}>
                确认归还
              </button>
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

            {canReview && (
              <button
                className="btn btn-primary w-full"
                onClick={() => setShowReviewModal(true)}
              >
                发表评价
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
              <h3>发表评价</h3>
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
        .user-card h3 {
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
