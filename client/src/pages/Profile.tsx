import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi, itemApi, skillApi, reviewApi, queueApi, transactionApi, favoriteApi, followApi } from '../api';
import type {
  ItemWithOwner,
  SkillWithProvider,
  ReviewWithUser,
  ReviewReplyWithUser,
  QueueEntryWithDetails,
  QueueNotification,
  DepositTransaction,
  TimeCoinTransaction,
  FavoriteItemWithDetail,
  FollowWithDetail,
  FollowerWithDetail,
} from '../types';

function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [myItems, setMyItems] = useState<ItemWithOwner[]>([]);
  const [mySkills, setMySkills] = useState<SkillWithProvider[]>([]);
  const [myReviews, setMyReviews] = useState<ReviewWithUser[]>([]);
  const [myPostedReviews, setMyPostedReviews] = useState<ReviewWithUser[]>([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewWithUser | null>(null);
  const [replyForm, setReplyForm] = useState({ content: '' });
  const [replying, setReplying] = useState(false);
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
  const [depositTransactions, setDepositTransactions] = useState<DepositTransaction[]>([]);
  const [timeCoinTransactions, setTimeCoinTransactions] = useState<TimeCoinTransaction[]>([]);
  const [depositFilter, setDepositFilter] = useState<string>('');
  const [timeCoinFilter, setTimeCoinFilter] = useState<string>('');
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItemWithDetail[]>([]);
  const [followingList, setFollowingList] = useState<FollowWithDetail[]>([]);
  const [followerList, setFollowerList] = useState<FollowerWithDetail[]>([]);
  const [followingLatestSkills, setFollowingLatestSkills] = useState<SkillWithProvider[]>([]);

  useEffect(() => {
    if (activeTab === 'items') {
      loadMyItems();
    } else if (activeTab === 'skills') {
      loadMySkills();
    } else if (activeTab === 'reviews') {
      loadMyReviews();
    } else if (activeTab === 'posted-reviews') {
      loadMyPostedReviews();
    } else if (activeTab === 'queues') {
      loadMyQueues();
    } else if (activeTab === 'notifications') {
      loadNotifications();
    } else if (activeTab === 'deposit') {
      loadDepositTransactions();
    } else if (activeTab === 'timecoin') {
      loadTimeCoinTransactions();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'deposit') {
      loadDepositTransactions();
    }
  }, [depositFilter]);

  useEffect(() => {
    if (activeTab === 'timecoin') {
      loadTimeCoinTransactions();
    }
  }, [timeCoinFilter]);

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

  const loadMyPostedReviews = async () => {
    const res = await reviewApi.getMyPostedReviews();
    if (res.success) {
      setMyPostedReviews(res.data || []);
    }
  };

  const handleOpenReply = (review: ReviewWithUser) => {
    setSelectedReview(review);
    setReplyForm({ content: '' });
    setShowReplyModal(true);
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
        if (activeTab === 'reviews') {
          loadMyReviews();
        } else if (activeTab === 'posted-reviews') {
          loadMyPostedReviews();
        }
      } else {
        alert(res.message || '回复失败');
      }
    } finally {
      setReplying(false);
    }
  };

  const loadMyQueues = async () => {
    const res = await queueApi.getMyQueues();
    if (res.success) {
      setMyQueues(res.data || []);
    }
  };

  const loadFavoriteItems = async () => { const res = await favoriteApi.getFavorites(); if (res.success) setFavoriteItems(res.data || []); };
  const loadFollowing = async () => { const res = await followApi.getFollowing(); if (res.success) setFollowingList(res.data || []); };
  const loadFollowers = async () => { const res = await followApi.getFollowers(); if (res.success) setFollowerList(res.data || []); };
  const loadFollowingLatestSkills = async () => { const res = await followApi.getFollowingLatestSkills(); if (res.success) setFollowingLatestSkills(res.data || []); };
  const handleRemoveFavorite = async (itemId: string) => { const res = await favoriteApi.removeFavorite(itemId); if (res.success) loadFavoriteItems(); else alert(res.message || '取消收藏失败'); };
  const handleUnfollow = async (userId: string) => { const res = await followApi.unfollowUser(userId); if (res.success) loadFollowing(); else alert(res.message || '取消关注失败'); };

  const loadNotifications = async () => {
    const res = await queueApi.getNotifications();
    if (res.success) {
      setNotifications(res.data || []);
    }
  };

  const loadDepositTransactions = async () => {
    const res = await transactionApi.getDepositTransactions(depositFilter || undefined);
    if (res.success) {
      setDepositTransactions(res.data || []);
    }
  };

  const loadTimeCoinTransactions = async () => {
    const res = await transactionApi.getTimeCoinTransactions(timeCoinFilter || undefined);
    if (res.success) {
      setTimeCoinTransactions(res.data || []);
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

  const getDepositTypeInfo = (type: string) => {
    const map: Record<string, { text: string; color: string; bgColor: string; icon: string }> = {
      payment: { text: '缴纳', color: '#ff4d4f', bgColor: '#fff1f0', icon: '💰' },
      refund: { text: '退还', color: '#52c41a', bgColor: '#f6ffed', icon: '↩️' },
      deduction: { text: '扣除', color: '#fa8c16', bgColor: '#fff7e6', icon: '⚡' },
    };
    return map[type] || { text: type, color: '#999', bgColor: '#f5f5f5', icon: '📋' };
  };

  const getTimeCoinTypeInfo = (type: string) => {
    const map: Record<string, { text: string; color: string; bgColor: string; icon: string }> = {
      income: { text: '收入', color: '#52c41a', bgColor: '#f6ffed', icon: '📈' },
      expenditure: { text: '支出', color: '#ff4d4f', bgColor: '#fff1f0', icon: '📉' },
    };
    return map[type] || { text: type, color: '#999', bgColor: '#f5f5f5', icon: '📋' };
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
          className={`tab ${activeTab === 'posted-reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('posted-reviews')}
        >
          我发出的评价
        </button>
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          我的订单
        </button>
        <button
          className={`tab ${activeTab === 'deposit' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposit')}
        >
          押金流水
        </button>
        <button
          className={`tab ${activeTab === 'timecoin' ? 'active' : ''}`}
          onClick={() => setActiveTab('timecoin')}
        >
          时间币明细
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

        {activeTab === 'favorites' && (
          <div className="list-section"><h3>物品收藏</h3>
            {favoriteItems.length === 0 ? (<div className="empty-list"><p>暂无收藏的物品</p><Link to="/items" className="btn btn-primary">去逛逛</Link></div>) : (
              <div className="item-grid">
                {favoriteItems.map((fav) => (
                  <div key={fav.id} className="item-card" style={{ position: 'relative' }}>
                    <Link to={`/items/${fav.item.id}`}>
                      <div className="item-image">{fav.item.images[0] ? (<img src={fav.item.images[0]} alt={fav.item.title} />) : (<div className="item-placeholder">📦</div>)}</div>
                      <div className="item-info"><h4 className="item-title">{fav.item.title}</h4><p className="item-price">押金 ¥{fav.item.deposit}</p></div>
                    </Link>
                    <button className="unfavorite-btn" onClick={() => handleRemoveFavorite(fav.itemId)}>取消收藏</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="list-section"><h3>我的关注</h3>
            {followingList.length === 0 ? (<div className="empty-list"><p>暂无关注的用户</p><Link to="/neighborhood" className="btn btn-primary">去发现</Link></div>) : (
              <div className="user-list">
                {followingList.map((follow) => (
                  <div key={follow.id} className="user-list-item">
                    <img src={follow.following.avatar} alt="" className="avatar" />
                    <div className="user-list-info"><div className="user-list-name">{follow.following.nickname}</div><div className="user-list-meta"><span className="credit-level" style={{ background: getCreditLevelColor(follow.following.creditLevel) + '20', color: getCreditLevelColor(follow.following.creditLevel) }}>{follow.following.creditLevel}级</span></div></div>
                    <button className="unfollow-btn" onClick={() => handleUnfollow(follow.followingId)}>取消关注</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="list-section"><h3>我的粉丝</h3>
            {followerList.length === 0 ? (<div className="empty-list"><p>暂无粉丝</p></div>) : (
              <div className="user-list">
                {followerList.map((follower) => (
                  <div key={follower.id} className="user-list-item">
                    <img src={follower.follower.avatar} alt="" className="avatar" />
                    <div className="user-list-info"><div className="user-list-name">{follower.follower.nickname}</div><div className="user-list-meta"><span className="credit-level" style={{ background: getCreditLevelColor(follower.follower.creditLevel) + '20', color: getCreditLevelColor(follower.follower.creditLevel) }}>{follower.follower.creditLevel}级</span></div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'following-feed' && (
          <div className="list-section"><h3>关注动态</h3>
            {followingLatestSkills.length === 0 ? (<div className="empty-list"><p>关注用户暂无新动态</p></div>) : (
              <div className="follow-feed-grid">
                {followingLatestSkills.map((skill) => (
                  <Link key={skill.id} to={`/skills/${skill.id}`} className="skill-card">
                    <div className="skill-image">{skill.images[0] ? (<img src={skill.images[0]} alt={skill.title} />) : (<div className="skill-placeholder">💡</div>)}</div>
                    <div className="skill-info"><h4 className="skill-title">{skill.title}<span className="skill-provider-tag">{skill.provider.nickname}</span></h4><p className="skill-price">⏰ {skill.timeCoinPrice} 时间币</p></div>
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
                {myReviews.map((review) => {
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
        )}

        {activeTab === 'posted-reviews' && (
          <div className="list-section">
            <h3>我发出的评价</h3>
            {myPostedReviews.length === 0 ? (
              <div className="empty-list">
                <p>暂无发出的评价</p>
              </div>
            ) : (
              <div className="review-list">
                {myPostedReviews.map((review) => {
                  const canReply = review.revieweeId === user?.id || review.reviewerId === user?.id;
                  return (
                    <div key={review.id} className="review-item">
                      <img src={review.reviewee.avatar} alt="" className="avatar" />
                      <div className="review-content">
                        <div className="review-header">
                          <div>
                            <span className="reviewer-name">
                              评价对象：{review.reviewee.nickname}
                            </span>
                            <span className="review-tag tag tag-blue">我发出</span>
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

        {activeTab === 'deposit' && (
          <div className="list-section">
            <div className="section-header">
              <h3>押金流水</h3>
              <div className="filter-group">
                <select
                  className="filter-select"
                  value={depositFilter}
                  onChange={(e) => setDepositFilter(e.target.value)}
                >
                  <option value="">全部类型</option>
                  <option value="payment">缴纳</option>
                  <option value="refund">退还</option>
                  <option value="deduction">扣除</option>
                </select>
              </div>
            </div>
            {depositTransactions.length === 0 ? (
              <div className="empty-list">
                <p>暂无押金流水记录</p>
              </div>
            ) : (
              <div className="transaction-list">
                {depositTransactions.map((tx) => {
                  const typeInfo = getDepositTypeInfo(tx.type);
                  return (
                    <div key={tx.id} className="transaction-item">
                      <div className="transaction-icon" style={{ background: typeInfo.bgColor, color: typeInfo.color }}>
                        {typeInfo.icon}
                      </div>
                      <div className="transaction-detail">
                        <div className="transaction-header">
                          <span className="transaction-desc">{tx.description}</span>
                          <span className="transaction-amount" style={{ color: typeInfo.color }}>
                            {tx.type === 'refund' ? '+' : '-'}¥{tx.amount}
                          </span>
                        </div>
                        <div className="transaction-meta">
                          <span className="transaction-type-tag" style={{ background: typeInfo.bgColor, color: typeInfo.color }}>
                            {typeInfo.text}
                          </span>
                          <span className="transaction-time">{new Date(tx.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timecoin' && (
          <div className="list-section">
            <div className="section-header">
              <h3>时间币明细</h3>
              <div className="filter-group">
                <select
                  className="filter-select"
                  value={timeCoinFilter}
                  onChange={(e) => setTimeCoinFilter(e.target.value)}
                >
                  <option value="">全部类型</option>
                  <option value="income">收入</option>
                  <option value="expenditure">支出</option>
                </select>
              </div>
            </div>
            {timeCoinTransactions.length === 0 ? (
              <div className="empty-list">
                <p>暂无时间币明细记录</p>
              </div>
            ) : (
              <div className="transaction-list">
                {timeCoinTransactions.map((tx) => {
                  const typeInfo = getTimeCoinTypeInfo(tx.type);
                  return (
                    <div key={tx.id} className="transaction-item">
                      <div className="transaction-icon" style={{ background: typeInfo.bgColor, color: typeInfo.color }}>
                        {typeInfo.icon}
                      </div>
                      <div className="transaction-detail">
                        <div className="transaction-header">
                          <span className="transaction-desc">{tx.description}</span>
                          <span className="transaction-amount" style={{ color: typeInfo.color }}>
                            {tx.type === 'income' ? '+' : '-'}⏰ {tx.amount}
                          </span>
                        </div>
                        <div className="transaction-meta">
                          <span className="transaction-type-tag" style={{ background: typeInfo.bgColor, color: typeInfo.color }}>
                            {typeInfo.text}
                          </span>
                          <span className="transaction-source">来源：{tx.source}</span>
                          <span className="transaction-time">{new Date(tx.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
        .filter-group {
          display: flex;
          gap: 8px;
        }
        .filter-select {
          padding: 6px 12px;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          font-size: 13px;
          color: #333;
          background: white;
          cursor: pointer;
          outline: none;
        }
        .filter-select:focus {
          border-color: #667eea;
        }
        .transaction-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .transaction-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .transaction-item:hover {
          background: #f5f5f5;
        }
        .transaction-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .transaction-detail {
          flex: 1;
          min-width: 0;
        }
        .transaction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          gap: 12px;
        }
        .transaction-desc {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .transaction-amount {
          font-size: 16px;
          font-weight: 600;
          white-space: nowrap;
        }
        .transaction-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .transaction-type-tag {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .transaction-source {
          font-size: 12px;
          color: #666;
        }
        .transaction-time {
          font-size: 12px;
          color: #999;
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
