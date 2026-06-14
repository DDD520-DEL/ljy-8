import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { itemApi, orderApi, reviewApi, queueApi, favoriteApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { ItemWithOwner, ReviewWithUser, QueueEntryWithDetails } from '../types';

function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [item, setItem] = useState<ItemWithOwner | null>(null);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [showConfirmQueueModal, setShowConfirmQueueModal] = useState(false);
  const [borrowForm, setBorrowForm] = useState({
    startDate: '',
    endDate: '',
    message: '',
  });
  const [queueMessage, setQueueMessage] = useState('');
  const [confirmQueueForm, setConfirmQueueForm] = useState({
    startDate: '',
    endDate: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [queueList, setQueueList] = useState<QueueEntryWithDetails[]>([]);
  const [myQueueEntry, setMyQueueEntry] = useState<QueueEntryWithDetails | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [toggleLoading, setToggleLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadItem();
    }
  }, [id]);

  useEffect(() => {
    if (id && isAuthenticated) {
      loadQueueInfo();
    }
  }, [id, isAuthenticated]);

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

  const loadFavoriteStatus = async () => {
    const res = await favoriteApi.checkFavorite(id!);
    if (res.success) setIsFavorited(res.data?.favorited || false);
  };

  const loadFavoriteCount = async () => {
    const res = await favoriteApi.getItemFavoriteCount(id!);
    if (res.success) setFavoriteCount(res.data?.count || 0);
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setToggleLoading(true);
    try {
      const res = await favoriteApi.toggleFavorite(id!);
      if (res.success) { setIsFavorited(res.data?.favorited || false); loadFavoriteCount(); }
    } finally { setToggleLoading(false); }
  };

  const loadQueueInfo = async () => {
    const res = await queueApi.getItemQueues(id!);
    if (res.success) {
      const queues = res.data || [];
      setQueueList(queues);
      const mine = queues.find((q: QueueEntryWithDetails) => q.userId === user?.id);
      setMyQueueEntry(mine || null);
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

  const handleJoinQueue = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowQueueModal(true);
  };

  const handleQueueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await queueApi.joinQueue({
        itemId: id!,
        message: queueMessage,
      });
      if (res.success) {
        alert(`排队成功！您当前是第 ${res.data.position} 位`);
        setShowQueueModal(false);
        setQueueMessage('');
        loadQueueInfo();
      } else {
        alert(res.message || '排队失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelQueue = async () => {
    if (!myQueueEntry) return;
    if (!confirm('确定要取消排队吗？')) return;
    const res = await queueApi.cancelQueue(myQueueEntry.id);
    if (res.success) {
      alert('已取消排队');
      loadQueueInfo();
    } else {
      alert(res.message || '取消失败');
    }
  };

  const handleConfirmQueueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myQueueEntry) return;
    setSubmitting(true);
    try {
      const res = await queueApi.confirmQueueBorrow(myQueueEntry.id, {
        startDate: confirmQueueForm.startDate,
        endDate: confirmQueueForm.endDate,
        message: confirmQueueForm.message,
      });
      if (res.success) {
        alert('确认成功！借用申请已提交');
        setShowConfirmQueueModal(false);
        navigate('/orders');
      } else {
        alert(res.message || '确认失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isOwner = user?.id === item?.ownerId;
  const isMyTurn = myQueueEntry?.status === 'notified';
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + (item?.maxBorrowDays || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  if (!item) {
    return <div className="container">物品不存在</div>;
  }

  const statusText = (status: string) => {
    const map: Record<string, string> = {
      waiting: '排队中',
      notified: '待确认',
      confirmed: '已确认',
      expired: '已超时',
      cancelled: '已取消',
      borrowed: '已借用',
    };
    return map[status] || status;
  };

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
            {queueList.length > 0 && (
              <span className="queue-count">👥 {queueList.length} 人排队</span>
            )}
            <button
              className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
              onClick={handleToggleFavorite}
              disabled={toggleLoading}
              title={isFavorited ? '取消收藏' : '收藏物品'}
            >
              {isFavorited ? '❤️' : '🤍'} {favoriteCount > 0 ? favoriteCount : ''}
            </button>
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

          {myQueueEntry && !isOwner && (
            <div className={`my-queue-card my-queue-${myQueueEntry.status}`}>
              <div className="my-queue-header">
                <span className="my-queue-title">📍 我的排队状态</span>
                <span className={`tag tag-${myQueueEntry.status === 'waiting' ? 'blue' : myQueueEntry.status === 'notified' ? 'orange' : 'gray'}`}>
                  {statusText(myQueueEntry.status)}
                </span>
              </div>
              {myQueueEntry.status === 'waiting' && (
                <p className="my-queue-position">当前排位：第 {myQueueEntry.position} 位</p>
              )}
              {myQueueEntry.status === 'notified' && myQueueEntry.expiredAt && (
                <div className="notified-info">
                  <p className="urgent-text">🔥 已轮到您借用！</p>
                  <p className="expire-hint">请在 {new Date(myQueueEntry.expiredAt).toLocaleString()} 前确认</p>
                  <CountdownTimer expiredAt={myQueueEntry.expiredAt} />
                </div>
              )}
              <div className="my-queue-actions">
                {myQueueEntry.status === 'waiting' && (
                  <button className="btn btn-secondary" onClick={handleCancelQueue}>
                    取消排队
                  </button>
                )}
                {myQueueEntry.status === 'notified' && (
                  <>
                    <button className="btn btn-secondary" onClick={handleCancelQueue}>
                      放弃
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowConfirmQueueModal(true)}
                    >
                      确认借用
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {!isOwner && (
            <>
              {item.status === 'available' && (
                <button
                  className="btn btn-primary btn-lg w-full"
                  onClick={() => setShowBorrowModal(true)}
                >
                  申请借用
                </button>
              )}
              {item.status === 'borrowed' && !myQueueEntry && (
                <>
                  <button
                    className="btn btn-primary btn-lg w-full"
                    disabled={true}
                  >
                    暂不可借用
                  </button>
                  <button
                    className="btn btn-outline btn-lg w-full mt-2"
                    onClick={handleJoinQueue}
                  >
                    ⏳ 加入等待队列
                  </button>
                </>
              )}
              {myQueueEntry && isMyTurn && (
                <button
                  className="btn btn-primary btn-lg w-full"
                  onClick={() => setShowConfirmQueueModal(true)}
                >
                  立即确认借用
                </button>
              )}
              {myQueueEntry && !isMyTurn && (
                <button
                  className="btn btn-primary btn-lg w-full"
                  disabled={true}
                >
                  排队中 (第{myQueueEntry.position}位)
                </button>
              )}
            </>
          )}

          {isOwner && (
            <Link to="/items/my" className="btn btn-secondary w-full">
              管理我的物品
            </Link>
          )}
        </div>
      </div>

      {queueList.length > 0 && (
        <div className="queue-section">
          <h2>当前排队（{queueList.length}人）</h2>
          <div className="queue-list">
            {queueList.slice(0, 5).map((entry, index) => (
              <div key={entry.id} className="queue-item">
                <span className="queue-position">#{index + 1}</span>
                <img src={entry.user.avatar} alt="" className="avatar" />
                <div className="queue-user-info">
                  <span className="queue-user-name">{entry.user.nickname}</span>
                  <span className="queue-user-neighborhood">{entry.user.neighborhood}</span>
                </div>
                <span className={`tag tag-${entry.status === 'waiting' ? 'blue' : entry.status === 'notified' ? 'orange' : 'gray'}`}>
                  {statusText(entry.status)}
                </span>
                <span className="queue-date">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {queueList.length > 5 && (
              <p className="more-queue">...还有 {queueList.length - 5} 人排队</p>
            )}
          </div>
        </div>
      )}

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
                  min={today}
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
                  min={borrowForm.startDate || today}
                  max={maxDate}
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

      {showQueueModal && (
        <div className="modal-overlay" onClick={() => setShowQueueModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>登记排队</h3>
              <button className="modal-close" onClick={() => setShowQueueModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleQueueSubmit}>
              <div className="queue-info-box">
                <p>📦 物品：<strong>{item.title}</strong></p>
                <p>👥 当前已有 <strong>{queueList.length}</strong> 人排队</p>
                <p>📍 您将排在第 <strong>{queueList.length + 1}</strong> 位</p>
                <p className="text-muted small">物品归还后，系统将按排队顺序依次通知。请在收到通知后24小时内确认借用，超时将自动顺延。</p>
              </div>
              <div className="form-group">
                <label className="form-label">留言（选填）</label>
                <textarea
                  className="form-textarea"
                  value={queueMessage}
                  onChange={(e) => setQueueMessage(e.target.value)}
                  placeholder="给物主留言..."
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowQueueModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '提交中...' : '确认排队'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmQueueModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmQueueModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认借用</h3>
              <button className="modal-close" onClick={() => setShowConfirmQueueModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleConfirmQueueSubmit}>
              <div className="confirm-warning">
              ⚠️ 您已排到，请尽快确认借用信息，超时名额将顺延
              </div>
              <div className="form-group">
                <label className="form-label">开始日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={confirmQueueForm.startDate}
                  onChange={(e) => setConfirmQueueForm({ ...confirmQueueForm, startDate: e.target.value })}
                  min={today}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">归还日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={confirmQueueForm.endDate}
                  onChange={(e) => setConfirmQueueForm({ ...confirmQueueForm, endDate: e.target.value })}
                  min={confirmQueueForm.startDate || today}
                  max={maxDate}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">留言（选填）</label>
                <textarea
                  className="form-textarea"
                  value={confirmQueueForm.message}
                  onChange={(e) => setConfirmQueueForm({ ...confirmQueueForm, message: e.target.value })}
                  placeholder="给物主留言..."
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmQueueModal(false)}
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
          flex-wrap: wrap;
        }
        .view-count {
          color: #999;
          font-size: 14px;
        }
        .favorite-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: 1px solid #e8e8e8;
          border-radius: 20px;
          padding: 4px 14px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          margin-left: auto;
        }
        .favorite-btn:hover { border-color: #ff4d4f; background: #fff1f0; }
        .favorite-btn.favorited { border-color: #ff4d4f; background: #fff1f0; color: #ff4d4f; }
        .favorite-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .queue-count {
          color: #667eea;
          font-size: 14px;
          background: #f0f2ff;
          padding: 2px 10px;
          border-radius: 12px;
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
        .btn-outline {
          background: white;
          border: 2px solid #667eea;
          color: #667eea;
        }
        .btn-outline:hover {
          background: #667eea;
          color: white;
        }
        .mt-2 {
          margin-top: 12px;
        }
        .my-queue-card {
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          border: 2px solid;
        }
        .my-queue-waiting {
          background: #f0f7ff;
          border-color: #1890ff;
        }
        .my-queue-notified {
          background: #fff7e6;
          border-color: #fa8c16;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(250, 140, 22, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(250, 140, 22, 0); }
        }
        .my-queue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .my-queue-title {
          font-weight: 600;
          font-size: 15px;
        }
        .my-queue-position {
          font-size: 14px;
          color: #1890ff;
          margin: 8px 0;
        }
        .notified-info {
          margin: 8px 0;
        }
        .urgent-text {
          color: #fa8c16;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .expire-hint {
          font-size: 13px;
          color: #666;
          margin-bottom: 8px;
        }
        .countdown-timer {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .countdown-item {
          background: white;
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 600;
          color: #fa8c16;
          font-size: 14px;
        }
        .my-queue-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .queue-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .queue-section h2 {
          font-size: 20px;
          margin-bottom: 16px;
        }
        .queue-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .queue-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #fafafa;
          border-radius: 8px;
        }
        .queue-position {
          font-weight: 700;
          color: #667eea;
          width: 40px;
          font-size: 16px;
        }
        .queue-user-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .queue-user-name {
          font-weight: 500;
        }
        .queue-user-neighborhood {
          font-size: 12px;
          color: #999;
        }
        .queue-date {
          font-size: 12px;
          color: #999;
        }
        .more-queue {
          text-align: center;
          color: #999;
          font-size: 14px;
          padding-top: 8px;
        }
        .queue-info-box {
          background: #f6ffed;
          border: 1px solid #b7eb8f;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .queue-info-box p {
          margin-bottom: 8px;
        }
        .queue-info-box p:last-child {
          margin-bottom: 0;
        }
        .confirm-warning {
          background: #fff2e8;
          color: #fa541c;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-weight: 500;
        }
        .small {
          font-size: 12px;
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
        .w-full {
          width: 100%;
        }
        .text-muted {
          color: #999;
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

function CountdownTimer({ expiredAt }: { expiredAt: string }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const diff = new Date(expiredAt).getTime() - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [expiredAt]);

  return (
    <div className="countdown-timer">
      <span className="countdown-item">{timeLeft.hours.toString().padStart(2, '0')} 时</span>
      <span className="countdown-item">{timeLeft.minutes.toString().padStart(2, '0')} 分</span>
      <span className="countdown-item">{timeLeft.seconds.toString().padStart(2, '0')} 秒</span>
    </div>
  );
}

export default ItemDetail;
