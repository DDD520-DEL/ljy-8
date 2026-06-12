import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi, itemApi, skillApi, reviewApi } from '../api';
import type { ItemWithOwner, SkillWithProvider, ReviewWithUser } from '../types';

function Profile() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('info');
  const [myItems, setMyItems] = useState<ItemWithOwner[]>([]);
  const [mySkills, setMySkills] = useState<SkillWithProvider[]>([]);
  const [myReviews, setMyReviews] = useState<ReviewWithUser[]>([]);

  useEffect(() => {
    if (activeTab === 'items') {
      loadMyItems();
    } else if (activeTab === 'skills') {
      loadMySkills();
    } else if (activeTab === 'reviews') {
      loadMyReviews();
    }
  }, [activeTab]);

  const loadMyItems = async () => {
    const res = await itemApi.getMyItems();
    if (res.success) {
      setMyItems(res.data || []);
    }
  };

  const loadMySkills = async () => {
    const res = await skillApi.getMySkills();
    if (res.success) {
      setMySkills(res.data || []);
    }
  };

  const loadMyReviews = async () => {
    if (!user?.id) return;
    const res = await reviewApi.getReviewsByUser(user.id);
    if (res.success) {
      setMyReviews(res.data || []);
    }
  };

  const getCreditLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      S: '#f5222d',
      A: '#fa8c16',
      B: '#52c41a',
      C: '#1890ff',
      D: '#999',
    };
    return colors[level] || '#999';
  };

  return (
    <div className="container profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <img src={user?.avatar} alt="" className="avatar avatar-lg" />
          <div className="profile-info">
            <h2>{user?.nickname}</h2>
            <p className="text-muted">{user?.neighborhood}</p>
            <div className="credit-info">
              <span
                className="credit-level"
                style={{ background: getCreditLevelColor(user?.creditLevel || 'D') + '20', color: getCreditLevelColor(user?.creditLevel || 'D') }}
              >
                {user?.creditLevel}级
              </span>
              <span className="credit-score">信用分 {user?.creditScore}</span>
            </div>
          </div>
        </div>
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value time-coins-stat">⏰ {user?.timeCoins || 0}</span>
            <span className="stat-label">时间币</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{myItems.length}</span>
            <span className="stat-label">发布物品</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{mySkills.length}</span>
            <span className="stat-label">发布技能</span>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          基本信息
        </button>
        <button
          className={`tab ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          我的物品
        </button>
        <button
          className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          我的技能
        </button>
        <button
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          收到的评价
        </button>
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          我的订单
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'info' && (
          <div className="info-card">
            <h3>基本信息</h3>
            <div className="info-row">
              <span className="info-label">昵称</span>
              <span className="info-value">{user?.nickname}</span>
            </div>
            <div className="info-row">
              <span className="info-label">手机号</span>
              <span className="info-value">
                {user?.id ? '***' : '-'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">所在小区</span>
              <span className="info-value">{user?.neighborhood}</span>
            </div>
            <div className="info-row">
              <span className="info-label">注册时间</span>
              <span className="info-value">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">信用等级</span>
              <span
                className="credit-level-large"
                style={{ background: getCreditLevelColor(user?.creditLevel || 'D') + '20', color: getCreditLevelColor(user?.creditLevel || 'D') }}
              >
                {user?.creditLevel}级 - {user?.creditScore}分
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">时间币余额</span>
              <span className="info-value time-coins-value">⏰ {user?.timeCoins || 0}</span>
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="list-section">
            <div className="section-header">
              <h3>我的物品</h3>
              <Link to="/publish/item" className="btn btn-primary btn-sm">
                + 发布物品
              </Link>
            </div>
            {myItems.length === 0 ? (
              <div className="empty-list">
                <p>暂无发布的物品</p>
                <Link to="/publish/item" className="btn btn-primary">
                  去发布
                </Link>
              </div>
            ) : (
              <div className="item-grid">
                {myItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/items/${item.id}`}
                    className="item-card"
                  >
                    <div className="item-image">
                      {item.images[0] ? (
                        <img src={item.images[0]} alt={item.title} />
                      ) : (
                        <div className="item-placeholder">📦</div>
                      )}
                      <span className={`tag tag-${item.status === 'available' ? 'green' : 'orange'}`}>
                        {item.status === 'available' ? '可借用' : '借出中'}
                      </span>
                    </div>
                    <div className="item-info">
                      <h4 className="item-title">{item.title}</h4>
                      <p className="item-price">押金 ¥{item.deposit}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="list-section">
            <div className="section-header">
              <h3>我的技能</h3>
              <Link to="/publish/skill" className="btn btn-primary btn-sm">
                + 发布技能
              </Link>
            </div>
            {mySkills.length === 0 ? (
              <div className="empty-list">
                <p>暂无发布的技能</p>
                <Link to="/publish/skill" className="btn btn-primary">
                  去发布
                </Link>
              </div>
            ) : (
              <div className="item-grid">
                {mySkills.map((skill) => (
                  <Link
                    key={skill.id}
                    to={`/skills/${skill.id}`}
                    className="skill-card"
                  >
                    <div className="skill-image">
                      {skill.images[0] ? (
                        <img src={skill.images[0]} alt={skill.title} />
                      ) : (
                        <div className="skill-placeholder">💡</div>
                      )}
                    </div>
                    <div className="skill-info">
                      <h4 className="skill-title">{skill.title}</h4>
                      <p className="skill-price">⏰ {skill.timeCoinPrice} 时间币</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="list-section">
            <h3>收到的评价</h3>
            {myReviews.length === 0 ? (
              <div className="empty-list">
                <p>暂无评价</p>
              </div>
            ) : (
              <div className="review-list">
                {myReviews.map((review) => (
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
        )}

        {activeTab === 'orders' && (
          <div className="list-section">
            <h3>我的订单</h3>
            <div className="order-actions">
              <Link to="/orders" className="btn btn-primary">
                查看全部订单 →
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="logout-section">
        <button className="btn btn-danger" onClick={logout}>
          退出登录
        </button>
      </div>

      <style>{`
        .profile-page {
          max-width: 900px;
          margin: 0 auto;
        }
        .profile-header {
          background: white;
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .profile-avatar {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .profile-avatar .avatar-lg {
          width: 80px;
          height: 80px;
          border: 4px solid #f0f0f0;
        }
        .profile-info h2 {
          font-size: 24px;
          margin-bottom: 4px;
        }
        .credit-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
        }
        .credit-level {
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .credit-score {
          font-size: 14px;
          color: #666;
        }
        .profile-stats {
          display: flex;
          gap: 40px;
        }
        .stat-item {
          text-align: center;
        }
        .stat-value {
          display: block;
          font-size: 28px;
          font-weight: 600;
          color: #333;
        }
        .stat-value.time-coins-stat {
          color: #667eea;
        }
        .stat-label {
          font-size: 14px;
          color: #999;
        }
        .profile-tabs {
          display: flex;
          gap: 8px;
          background: white;
          padding: 8px;
          border-radius: 12px;
          margin-bottom: 20px;
          overflow-x: auto;
        }
        .profile-tabs .tab {
          padding: 10px 20px;
          background: none;
          border-radius: 8px;
          font-size: 14px;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .profile-tabs .tab:hover {
          background: #f5f5f5;
        }
        .profile-tabs .tab.active {
          background: #667eea;
          color: white;
        }
        .profile-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          min-height: 400px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        }
        .info-card h3 {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .info-row {
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          width: 120px;
          color: #999;
          font-size: 14px;
        }
        .info-value {
          flex: 1;
          color: #333;
        }
        .credit-level-large {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 16px;
          font-weight: 600;
        }
        .time-coins-value {
          color: #667eea;
          font-weight: 600;
          font-size: 18px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .section-header h3 {
          font-size: 18px;
        }
        .btn-sm {
          padding: 6px 14px;
          font-size: 13px;
        }
        .empty-list {
          text-align: center;
          padding: 60px 0;
          color: #999;
        }
        .empty-list p {
          margin-bottom: 16px;
        }
        .item-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .item-card,
        .skill-card {
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s;
        }
        .item-card:hover,
        .skill-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        .item-image,
        .skill-image {
          position: relative;
          height: 120px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .skill-image {
          background: linear-gradient(135deg, #667eea22 0%, #764ba222 100%);
        }
        .item-image img,
        .skill-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .item-placeholder,
        .skill-placeholder {
          font-size: 40px;
        }
        .item-image .tag {
          position: absolute;
          top: 8px;
          left: 8px;
        }
        .item-info,
        .skill-info {
          padding: 12px;
        }
        .item-title,
        .skill-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .item-price {
          color: #ff4d4f;
          font-size: 14px;
          font-weight: 500;
        }
        .skill-price {
          color: #667eea;
          font-size: 14px;
          font-weight: 500;
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
        .order-actions {
          text-align: center;
          padding: 40px 0;
        }
        .logout-section {
          text-align: center;
          margin-top: 24px;
        }
        .text-muted {
          color: #999;
          font-size: 14px;
        }
        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            gap: 24px;
            text-align: center;
          }
          .profile-avatar {
            flex-direction: column;
          }
          .item-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default Profile;
