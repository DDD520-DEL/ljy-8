import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { itemApi, orderApi, reviewApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { ItemWithOwner, ReviewWithUser } from '../types';

function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [item, setItem] = useState<ItemWithOwner | null>(null);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowForm, setBorrowForm] = useState({
    startDate: '',
    endDate: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadItem();
    }
  }, [id]);

  const loadItem = async () => {
    setLoading(true);
    const res = await itemApi.getItemById(id!);
    if (res.success) {
      setItem(res.data);
      loadReviews(res.data.ownerId);
    }
    setLoading(false);
  };

  const loadReviews = async (userId: string) => {
    const res = await reviewApi.getReviewsByUser(userId);
    if (res.success) {
      setReviews(res.data || []);
    }
  };

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const res = await orderApi.createBorrowOrder({
        itemId: id,
        startDate: borrowForm.startDate,
        endDate: borrowForm.endDate,
        message: borrowForm.message,
      });
      if (res.success) {
        alert('借用申请已提交！');
        setShowBorrowModal(false);
        navigate('/orders');
      } else {
        alert(res.message || '申请失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isOwner = user?.id === item?.ownerId;

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  if (!item) {
    return <div className="container">物品不存在</div>;
  }

  return (
    <div className="container item-detail-page">
      <div className="breadcrumb">
        <Link to="/items">物品共享</Link> / <span>{item.title}</span>
      </div>

      <div className="item-detail">
        <div className="item-gallery">
          {item.images[0] ? (
            <img src={item.images[0]} alt={item.title} />
          ) : (
            <div className="gallery-placeholder">📦</div>
          )}
        </div>

        <div className="item-detail-info">
          <h1 className="item-title">{item.title}</h1>
          <div className="item-meta-row">
            <span className={`tag tag-${item.status === 'available' ? 'green' : 'orange'}`}>
              {item.status === 'available' ? '可借用' : '借出中'}
            </span>
            <span className="view-count">👁 {item.viewCount} 次浏览</span>
          </div>

          <div className="item-price-section">
            <span className="price-label">押金</span>
            <span className="price-value">¥{item.deposit}</span>
          </div>

          <div className="item-details">
            <div className="detail-item">
              <span className="detail-label">分类：</span>
              <span className="detail-value">{item.category}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">最长借用：</span>
              <span className="detail-value">{item.maxBorrowDays} 天</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">所在小区：</span>
              <span className="detail-value">{item.owner.neighborhood}</span>
            </div>
          </div>

          <div className="item-section">
            <h3>物品描述</h3>
            <p className="item-description">{item.description}</p>
          </div>

          <div className="item-section">
            <h3>借用规则</h3>
            <p className="item-rules">{item.borrowRules}</p>
          </div>

          <div className="item-owner">
            <img src={item.owner.avatar} alt="" className="avatar avatar-lg" />
            <div className="owner-info">
              <h4>{item.owner.nickname}</h4>
              <p>信用评分：{item.owner.creditScore} 分（{item.owner.creditLevel}级）</p>
              <p className="text-muted">{item.owner.neighborhood}</p>
            </div>
          </div>

          {!isOwner && (
            <button
              className="btn btn-primary btn-lg w-full"
              onClick={() => setShowBorrowModal(true)}
              disabled={item.status !== 'available'}
            >
              {item.status === 'available' ? '申请借用' : '暂不可借用'}
            </button>
          )}

          {isOwner && (
            <Link to="/items/my" className="btn btn-secondary w-full">
              管理我的物品
            </Link>
          )}
        </div>
      </div>

      <div className="reviews-section">
        <h2>用户评价（{reviews.length}）</h2>
        {reviews.length === 0 ? (
          <p className="text-muted">暂无评价</p>
        ) : (
          <div className="review-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-item">
                <img src={review.reviewer.avatar} alt="" className="avatar" />
                <div className="review-content">
                  <div className="review-header">
                    <span className="reviewer-name">{review.reviewer.nickname}</span>
                    <span className="review-rating">
                      {'⭐'.repeat(review.rating)}
                    </span>
                  </div>
                  <p className="review-text">{review.content}</p>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBorrowModal && (
        <div className="modal-overlay" onClick={() => setShowBorrowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>申请借用</h3>
              <button className="modal-close" onClick={() => setShowBorrowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleBorrowSubmit}>
              <div className="form-group">
                <label className="form-label">开始日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={borrowForm.startDate}
                  onChange={(e) => setBorrowForm({ ...borrowForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">归还日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={borrowForm.endDate}
                  onChange={(e) => setBorrowForm({ ...borrowForm, endDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">留言（选填）</label>
                <textarea
                  className="form-textarea"
                  value={borrowForm.message}
                  onChange={(e) => setBorrowForm({ ...borrowForm, message: e.target.value })}
                  placeholder="给物主留言..."
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBorrowModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '提交中...' : '提交申请'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .item-detail-page {
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
        .item-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .item-gallery {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .item-gallery img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .gallery-placeholder {
          font-size: 120px;
        }
        .item-title {
          font-size: 28px;
          margin-bottom: 12px;
        }
        .item-meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .view-count {
          color: #999;
          font-size: 14px;
        }
        .item-price-section {
          background: #fff7e6;
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: baseline;
          gap: 12px;
        }
        .price-label {
          font-size: 14px;
          color: #999;
        }
        .price-value {
          font-size: 28px;
          color: #ff4d4f;
          font-weight: 600;
        }
        .item-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        .detail-item {
          font-size: 14px;
        }
        .detail-label {
          color: #999;
        }
        .detail-value {
          color: #333;
        }
        .item-section {
          margin-bottom: 20px;
        }
        .item-section h3 {
          font-size: 16px;
          margin-bottom: 8px;
        }
        .item-description,
        .item-rules {
          color: #666;
          line-height: 1.8;
        }
        .item-owner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .owner-info h4 {
          margin-bottom: 4px;
        }
        .owner-info p {
          font-size: 13px;
          color: #666;
          margin-bottom: 2px;
        }
        .btn-lg {
          padding: 14px 24px;
          font-size: 16px;
        }
        .reviews-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
        }
        .reviews-section h2 {
          font-size: 20px;
          margin-bottom: 20px;
        }
        .review-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .review-item {
          display: flex;
          gap: 12px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }
        .review-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .review-content {
          flex: 1;
        }
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .reviewer-name {
          font-weight: 500;
        }
        .review-rating {
          font-size: 14px;
        }
        .review-text {
          color: #666;
          margin-bottom: 8px;
        }
        .review-date {
          font-size: 12px;
          color: #999;
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
        @media (max-width: 768px) {
          .item-detail {
            grid-template-columns: 1fr;
          }
          .item-gallery {
            height: 250px;
          }
        }
      `}</style>
    </div>
  );
}

export default ItemDetail;
