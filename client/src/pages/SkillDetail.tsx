import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { skillApi, orderApi, reviewApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { SkillWithProvider, ReviewWithUser } from '../types';

function SkillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [skill, setSkill] = useState<SkillWithProvider | null>(null);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    serviceDate: '',
    address: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadSkill();
    }
  }, [id]);

  const loadSkill = async () => {
    setLoading(true);
    const res = await skillApi.getSkillById(id!);
    if (res.success) {
      setSkill(res.data);
      loadReviews(res.data.providerId);
    }
    setLoading(false);
  };

  const loadReviews = async (userId: string) => {
    const res = await reviewApi.getReviewsByUser(userId);
    if (res.success) {
      setReviews(res.data || []);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const res = await orderApi.createServiceOrder({
        skillId: id,
        serviceDate: orderForm.serviceDate,
        address: orderForm.address,
        message: orderForm.message,
      });
      if (res.success) {
        alert('服务申请已提交！');
        setShowOrderModal(false);
        navigate('/orders');
      } else {
        alert(res.message || '申请失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isProvider = user?.id === skill?.providerId;

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  if (!skill) {
    return <div className="container">技能服务不存在</div>;
  }

  return (
    <div className="container skill-detail-page">
      <div className="breadcrumb">
        <Link to="/skills">技能交换</Link> / <span>{skill.title}</span>
      </div>

      <div className="skill-detail">
        <div className="skill-gallery">
          {skill.images[0] ? (
            <img src={skill.images[0]} alt={skill.title} />
          ) : (
            <div className="gallery-placeholder">💡</div>
          )}
        </div>

        <div className="skill-detail-info">
          <h1 className="skill-title">{skill.title}</h1>
          <div className="skill-meta-row">
            <span className="tag tag-blue">{skill.category}</span>
            <span className="view-count">👁 {skill.viewCount} 次浏览</span>
          </div>

          <div className="skill-price-section">
            <span className="price-label">服务价格</span>
            <span className="price-value">⏰ {skill.timeCoinPrice} 时间币</span>
            <span className="price-hint">约 {skill.serviceDuration} 分钟</span>
          </div>

          <div className="skill-details">
            <div className="detail-item">
              <span className="detail-label">服务区域：</span>
              <span className="detail-value">{skill.serviceArea}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">所在小区：</span>
              <span className="detail-value">{skill.provider.neighborhood}</span>
            </div>
          </div>

          <div className="skill-section">
            <h3>服务描述</h3>
            <p className="skill-description">{skill.description}</p>
          </div>

          <div className="skill-provider">
            <img src={skill.provider.avatar} alt="" className="avatar avatar-lg" />
            <div className="provider-info">
              <h4>{skill.provider.nickname}</h4>
              <p>信用评分：{skill.provider.creditScore} 分（{skill.provider.creditLevel}级）</p>
              <p className="text-muted">{skill.provider.neighborhood}</p>
            </div>
          </div>

          {!isProvider && (
            <button
              className="btn btn-primary btn-lg w-full"
              onClick={() => setShowOrderModal(true)}
              disabled={skill.status !== 'active'}
            >
              {skill.status === 'active' ? '预约服务' : '服务暂不可用'}
            </button>
          )}

          {isProvider && (
            <Link to="/skills/my" className="btn btn-secondary w-full">
              管理我的技能
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

      {showOrderModal && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>预约服务</h3>
              <button className="modal-close" onClick={() => setShowOrderModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleOrderSubmit}>
              <div className="form-group">
                <label className="form-label">服务时间</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={orderForm.serviceDate}
                  onChange={(e) => setOrderForm({ ...orderForm, serviceDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">服务地址</label>
                <input
                  type="text"
                  className="form-input"
                  value={orderForm.address}
                  onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                  placeholder="请输入详细地址"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">留言（选填）</label>
                <textarea
                  className="form-textarea"
                  value={orderForm.message}
                  onChange={(e) => setOrderForm({ ...orderForm, message: e.target.value })}
                  placeholder="给服务提供者留言..."
                />
              </div>
              <div className="price-info">
                <span>服务价格：</span>
                <span className="price">⏰ {skill.timeCoinPrice} 时间币</span>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowOrderModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '提交中...' : '提交预约'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .skill-detail-page {
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
        .skill-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .skill-gallery {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea22 0%, #764ba222 100%);
        }
        .skill-gallery img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .gallery-placeholder {
          font-size: 120px;
        }
        .skill-title {
          font-size: 28px;
          margin-bottom: 12px;
        }
        .skill-meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .view-count {
          color: #999;
          font-size: 14px;
        }
        .skill-price-section {
          background: #f0f2ff;
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
          font-size: 24px;
          color: #667eea;
          font-weight: 600;
        }
        .price-hint {
          font-size: 14px;
          color: #999;
        }
        .skill-details {
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
        .skill-section {
          margin-bottom: 20px;
        }
        .skill-section h3 {
          font-size: 16px;
          margin-bottom: 8px;
        }
        .skill-description {
          color: #666;
          line-height: 1.8;
        }
        .skill-provider {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .provider-info h4 {
          margin-bottom: 4px;
        }
        .provider-info p {
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
        .price-info {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          background: #f5f7fa;
          border-radius: 8px;
          margin-top: 16px;
        }
        .price-info .price {
          color: #667eea;
          font-weight: 600;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        @media (max-width: 768px) {
          .skill-detail {
            grid-template-columns: 1fr;
          }
          .skill-gallery {
            height: 250px;
          }
        }
      `}</style>
    </div>
  );
}

export default SkillDetail;
