import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi, itemApi, skillApi, reviewApi, queueApi } from '../api';
import type {
  ItemWithOwner,
  SkillWithProvider,
  ReviewWithUser,
  QueueEntryWithDetails,
  QueueNotification,
} from '../types';

function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [myItems, setMyItems] = useState<ItemWithOwner[]>([]);
  const [mySkills, setMySkills] = useState<SkillWithProvider[]>([]);
  const [myReviews, setMyReviews] = useState<ReviewWithUser[]>([]);
  const [myQueues, setMyQueues] = useState<QueueEntryWithDetails[]>([]);
  const [notifications, setNotifications] = useState<QueueNotification[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<QueueEntryWithDetails | null>(null);
  const [confirmForm, setConfirmForm] = useState({
    startDate: '',
    endDate: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'items') {
      loadMyItems();
    } else if (activeTab === 'skills') {
      loadMySkills();
    } else if (activeTab === 'reviews') {
      loadMyReviews();
    } else if (activeTab === 'queues') {
      loadMyQueues();
    } else if (activeTab === 'notifications') {
      loadNotifications();
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

  const loadMyQueues = async () => {
    const res = await queueApi.getMyQueues();
    if (res.success) {
      setMyQueues(res.data || []);
    }
  };

  const loadNotifications = async () => {
    const res = await queueApi.getNotifications();
    if (res.success) {
      setNotifications(res.data || []);
    }
  };

  const handleCancelQueue = async (queueId: string) => {
    if (!confirm('确定要取消排队吗？')) return;
    const res = await queueApi.cancelQueue(queueId);
    if (res.success) {
      alert('已取消排队');
      loadMyQueues();
    } else {
      alert(res.message || '取消失败');
    }
  };

  const handleOpenConfirmModal = (queue: QueueEntryWithDetails) => {
    setSelectedQueue(queue);
    setConfirmForm({ startDate: '', endDate: '', message: '' });
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueue) return;
    setSubmitting(true);
    try {
      const res = await queueApi.confirmQueueBorrow(selectedQueue.id, confirmForm);
      if (res.success) {
        alert('确认成功！借用申请已提交');
        setShowConfirmModal(false);
        loadMyQueues();
        navigate('/orders');
      } else {
        alert(res.message || '确认失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    await queueApi.markNotificationAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await queueApi.markAllNotificationsAsRead();
    loadNotifications();
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

  const getQueueStatusInfo = (status: string) => {
    const map: Record<string, { text: string; color: string; bgColor: string }> = {
      waiting: { text: '排队中', color: '#1890ff', bgColor: '#e6f7ff' },
      notified: { text: '待确认', color: '#fa8c16', bgColor: '#fff7e6' },
      confirmed: { text: '已确认', color: '#52c41a', bgColor: '#f6ffed' },
      expired: { text: '已超时', color: '#999', bgColor: '#f5f5f5' },
      cancelled: { text: '已取消', color: '#999', bgColor: '#f5f5f5' },
      borrowed: { text: '已借用', color: '#52c41a', bgColor: '#f6ffed' },
    };
    return map[status] || { text: status, color: '#999', bgColor: '#f5f5f5' };
  };

  const getNotificationTypeInfo = (type: string) => {
    const map: Record<string, { icon: string; color: string }> = {
      queue_turn: { icon: '🔔', color: '#fa8c16' },
      queue_expired: { icon: '⏰', color: '#999' },
      queue_cancelled: { icon: '❌', color: '#999' },
    };
    return map[type] || { icon: '📧', color: '#667eea' };
  };

  const today = new Date().toISOString().split('T')[0];

  const unreadCount = notifications.filter((n) => !n.read).length;

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
          className={`tab ${activeTab === 'queues' ? 'active' : ''}`}
          onClick={() => setActiveTab('queues')}
        >
          排队记录
        </button>
        <button
          className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          通知中心
          {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
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

        {activeTab === 'queues' && (
          <div className="list-section">
            <div className="section-header">
              <h3>排队记录</h3>
            </div>
            {myQueues.length === 0 ? (
              <div className="empty-list">
                <p>暂无排队记录</p>
                <Link to="/items" className="btn btn-primary">
                  去逛逛
                </Link>
              </div>
            ) : (
              <div className="queue-record-list">
                {myQueues.map((queue) => {
                  const statusInfo = getQueueStatusInfo(queue.status);
                  return (
                    <div key={queue.id} className="queue-record-card">
                      <Link to={`/items/${queue.itemId}`} className="queue-item-info">
                        <div className="queue-item-image">
                          {queue.item.images[0] ? (
                            <img src={queue.item.images[0]} alt="" />
                          ) : (
                            <div className="item-placeholder">📦</div>
                          )}
                        </div>
                        <div className="queue-item-detail">
                          <h4>{queue.item.title}</h4>
                          <p className="text-muted">押金 ¥{queue.item.deposit}</p>
                          <p className="queue-time">
                            排队时间：{new Date(queue.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </Link>
                      <div className="queue-record-status">
                        <span
                          className="queue-status-tag"
                          style={{ background: statusInfo.bgColor, color: statusInfo.color }}
                        >
                          {statusInfo.text}
                        </span>
                        {queue.status === 'waiting' && (
                          <span className="queue-position-info">
                            当前第 {queue.position} 位
                          </span>
                        )}
                        {queue.status === 'notified' && queue.expiredAt && (
                          <span className="queue-expire">
                            请在 {new Date(queue.expiredAt).toLocaleString()} 前确认
                          </span>
                        )}
                      </div>
                      <div className="queue-record-actions">
                        {queue.status === 'waiting' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCancelQueue(queue.id)}
                          >
                            取消排队
                          </button>
                        )}
                        {queue.status === 'notified' && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleCancelQueue(queue.id)}
                            >
                              放弃
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleOpenConfirmModal(queue)}
                            >
                              确认借用
                            </button>
                          </>
                        )}
                        {queue.status === 'confirmed' || queue.status === 'borrowed' ? (
                          <Link
                            to="/orders"
                            className="btn btn-outline btn-sm"
                          >
                            查看订单
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="list-section">
            <div className="section-header">
              <h3>通知中心</h3>
              {unreadCount > 0 && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleMarkAllRead}
                >
                  全部已读
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="empty-list">
                <p>暂无通知</p>
              </div>
            ) : (
                <div className="notification-list">
                  {notifications.map((notification) => {
                    const typeInfo = getNotificationTypeInfo(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                        onClick={() => handleMarkRead(notification.id)}
                      >
                        <span className="notification-icon" style={{ background: typeInfo.color + '20', color: typeInfo.color }}
                        >
                          {typeInfo.icon}
                        </span>
                        <div className="notification-content">
                          <p className="notification-message">
                            {notification.message}
                          </p>
                          <p className="notification-time">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && <span className="notification-dot"></span>}
                      </div>
                    );
                  })}
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

      {showConfirmModal && selectedQueue && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认借用</h3>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleConfirmSubmit}>
              <div className="confirm-queue-info">
                <p>📦 物品：<strong>{selectedQueue.item.title}</strong></p>
                <p>押金：¥{selectedQueue.item.deposit}</p>
              </div>
              <div className="form-group">
                <label className="form-label">开始日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={confirmForm.startDate}
                  onChange={(e) => setConfirmForm({ ...confirmForm, startDate: e.target.value })}
                  min={today}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">归还日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={confirmForm.endDate}
                  onChange={(e) => setConfirmForm({ ...confirmForm, endDate: e.target.value })}
                  min={confirmForm.startDate || today}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">留言（选填）</label>
                <textarea
                  className="form-textarea"
                  value={confirmForm.message}
                  onChange={(e) => setConfirmForm({ ...confirmForm, message: e.target.value })}
                  placeholder="给物主留言..."
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '提交中...' : '确认借用'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .profile-page {
          max-width: 1000px;
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
          position: relative;
        }
        .profile-tabs .tab:hover {
          background: #f5f5f5;
        }
        .profile-tabs .tab.active {
          background: #667eea;
          color: white;
        }
        .tab-badge {
          position: absolute;
          top: 2px;
          right: 6px;
          background: #ff4d4f;
          color: white;
          border-radius: 10px;
          padding: 1px 7px;
          font-size: 11px;
          min-width: 18px;
          text-align: center;
        }
        .tab.active .tab-badge {
          background: white;
          color: #ff4d4f;
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
        .btn-outline {
          background: white;
          border: 1px solid #667eea;
          color: #667eea;
        }
        .btn-outline:hover {
          background: #667eea;
          color: white;
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
        .queue-record-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .queue-record-card {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 20px;
          align-items: center;
          padding: 16px;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .queue-record-card:hover {
          border-color: #667eea;
        }
        .queue-item-info {
          display: flex;
          gap: 16px;
          text-decoration: none;
          color: inherit;
        }
        .queue-item-image {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .queue-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .queue-item-detail h4 {
          margin-bottom: 4px;
          font-size: 16px;
        }
        .queue-item-detail p {
          font-size: 13px;
          color: #666;
          margin-bottom: 2px;
        }
        .queue-time {
          color: #999;
        }
        .queue-record-status {
          text-align: center;
          min-width: 120px;
        }
        .queue-status-tag {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .queue-position-info {
          display: block;
          font-size: 13px;
          color: #1890ff;
          font-weight: 500;
        }
        .queue-expire {
          display: block;
          font-size: 12px;
          color: #fa8c16;
        }
        .queue-record-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        .notification-item.unread {
          background: #f0f7ff;
        }
        .notification-item:hover {
          background: #f5f5f5;
        }
        .notification-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .notification-content {
          flex: 1;
        }
        .notification-message {
          font-size: 14px;
          color: #333;
          margin-bottom: 4px;
          line-height: 1.6;
        }
        .notification-time {
          font-size: 12px;
          color: #999;
        }
        .notification-dot {
          width: 8px;
          height: 8px;
          background: #ff4d4f;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 6px;
        }
        .confirm-queue-info {
          background: #f6ffed;
          border: 1px solid #b7eb8f;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }
        .confirm-queue-info p {
          margin-bottom: 4px;
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
        .w-full {
          width: 100%;
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
          .profile-stats {
            gap: 24px;
          }
          .item-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .queue-record-card {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .queue-record-status {
            text-align: left;
          }
          .queue-record-actions {
            flex-direction: row;
          }
        }
      `}</style>
    </div>
  );
}

export default Profile;
