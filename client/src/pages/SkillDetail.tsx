import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { skillApi, orderApi, reviewApi, followApi, favoriteFolderApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { SkillWithProvider, ReviewWithUser, DailyAvailableSlots, TimeSlot, FavoriteFolder } from '../types';

function SkillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [skill, setSkill] = useState<SkillWithProvider | null>(null);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [weeklySlots, setWeeklySlots] = useState<DailyAvailableSlots[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [orderForm, setOrderForm] = useState({
    address: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [favoritedFolderIds, setFavoritedFolderIds] = useState<string[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  useEffect(() => {
    if (id) {
      loadSkill();
    }
  }, [id]);

  useEffect(() => {
    if (skill && isAuthenticated && skill.providerId !== user?.id) {
      loadFollowStatus();
      loadFavoriteStatus();
    }
  }, [skill, isAuthenticated]);

  const loadFollowStatus = async () => {
    if (!skill) return;
    const res = await followApi.checkFollow(skill.providerId);
    if (res.success) setIsFollowing(res.data?.following || false);
  };

  const handleToggleFollow = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!skill) return;
    setFollowLoading(true);
    try {
      const res = await followApi.toggleFollow(skill.providerId);
      if (res.success) setIsFollowing(res.data?.following || false);
    } finally { setFollowLoading(false); }
  };

  const loadFavoriteStatus = async () => {
    const res = await favoriteFolderApi.checkFavoriteStatus(id!, 'skill');
    if (res.success) {
      setIsFavorited(res.data?.favorited || false);
      setFavoritedFolderIds(res.data?.folderIds || []);
    }
  };

  const loadFolders = async () => {
    const res = await favoriteFolderApi.getFolders();
    if (res.success) {
      setFolders(res.data || []);
    }
  };

  const handleOpenFolderPicker = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    await loadFolders();
    setShowFolderPicker(true);
  };

  const handleToggleFolderFavorite = async (folderId: string) => {
    const isInFolder = favoritedFolderIds.includes(folderId);
    if (isInFolder) {
      const folderItems = await favoriteFolderApi.getFolderItems(folderId);
      if (folderItems.success) {
        const favoriteItem = (folderItems.data || []).find((f: any) => f.targetId === id && f.targetType === 'skill');
        if (favoriteItem) {
          const res = await favoriteFolderApi.removeFromFolder(folderId, favoriteItem.id);
          if (res.success) {
            setFavoritedFolderIds(favoritedFolderIds.filter((fid) => fid !== folderId));
            setIsFavorited(favoritedFolderIds.length > 1);
          }
        }
      }
    } else {
      const res = await favoriteFolderApi.addToFolder(folderId, { targetId: id!, targetType: 'skill' });
      if (res.success) {
        setFavoritedFolderIds([...favoritedFolderIds, folderId]);
        setIsFavorited(true);
      } else {
        alert(res.message || '操作失败');
      }
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('请输入收藏夹名称');
      return;
    }
    setCreatingFolder(true);
    try {
      const res = await favoriteFolderApi.createFolder({
        name: newFolderName.trim(),
        description: newFolderDesc.trim() || undefined,
      });
      if (res.success) {
        const newFolder = res.data;
        setFolders([...folders, newFolder]);
        const addRes = await favoriteFolderApi.addToFolder(newFolder.id, {
          targetId: id!,
          targetType: 'skill',
        });
        if (addRes.success) {
          setFavoritedFolderIds([...favoritedFolderIds, newFolder.id]);
          setIsFavorited(true);
        }
        setShowCreateFolder(false);
        setNewFolderName('');
        setNewFolderDesc('');
      } else {
        alert(res.message || '创建失败');
      }
    } finally {
      setCreatingFolder(false);
    }
  };

  const loadSkill = async () => {
    setLoading(true);
    const res = await skillApi.getSkillById(id!);
    if (res.success) {
      setSkill(res.data);
      loadReviews(res.data.providerId);
      loadAvailableSlots();
    }
    setLoading(false);
  };

  const loadAvailableSlots = async () => {
    const res = await skillApi.getAvailableSlots(id!);
    if (res.success) {
      const slots = res.data as DailyAvailableSlots[];
      setWeeklySlots(slots);
      if (slots.length > 0) {
        const firstAvailable = slots.find(s => s.availableSlots.length > 0);
        if (firstAvailable) {
          setSelectedDate(firstAvailable.date);
        } else {
          setSelectedDate(slots[0].date);
        }
      }
    }
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
    if (!selectedSlot) {
      alert('请选择服务时段');
      return;
    }
    if (!orderForm.address.trim()) {
      alert('请填写服务地址');
      return;
    }
    setSubmitting(true);
    try {
      const res = await orderApi.createServiceOrder({
        skillId: id,
        serviceDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
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

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const isProvider = user?.id === skill?.providerId;

  const currentDaySlots = weeklySlots.find(s => s.date === selectedDate);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日 ${weekday}`;
  };

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
            <button
              className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
              onClick={handleOpenFolderPicker}
              title={isFavorited ? '已收藏，点击管理' : '加入收藏夹'}
            >
              {isFavorited ? '❤️' : '🤍'}
            </button>
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
            {!isProvider && (
              <button
                className={`follow-btn ${isFollowing ? 'following' : ''}`}
                onClick={handleToggleFollow}
                disabled={followLoading}
              >
                {isFollowing ? '已关注' : '+ 关注'}
              </button>
            )}
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
            <div className="provider-actions">
              <Link to={`/skills/${skill.id}/schedule`} className="btn btn-secondary w-full">
                📅 管理服务排期
              </Link>
            </div>
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
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>预约服务</h3>
              <button className="modal-close" onClick={() => setShowOrderModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleOrderSubmit}>
              <div className="booking-section">
                <h4 className="section-title">选择日期</h4>
                <div className="date-selector">
                  {weeklySlots.map((day) => {
                    const date = new Date(day.date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const hasAvailable = day.availableSlots.length > 0;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        className={`date-item ${selectedDate === day.date ? 'selected' : ''} ${!hasAvailable ? 'disabled' : ''}`}
                        onClick={() => hasAvailable && handleDateSelect(day.date)}
                        disabled={!hasAvailable}
                      >
                        <span className="date-weekday">{weekdays[date.getDay()]}</span>
                        <span className="date-day">{date.getDate()}</span>
                        {isToday && <span className="date-today">今天</span>}
                        {!hasAvailable && <span className="date-fully-booked">已满</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="booking-section">
                <h4 className="section-title">选择时段</h4>
                {currentDaySlots && currentDaySlots.availableSlots.length > 0 ? (
                  <div className="time-slots-grid">
                    {currentDaySlots.availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        className={`time-slot-btn ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                        onClick={() => handleSlotSelect(slot)}
                      >
                        {slot.startTime} - {slot.endTime}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="no-slots">
                    <p>该日期暂无可预约时段</p>
                  </div>
                )}
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
                <button type="submit" className="btn btn-primary" disabled={submitting || !selectedSlot}>
                  {submitting ? '提交中...' : '提交预约'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFolderPicker && (
        <div className="modal-overlay" onClick={() => setShowFolderPicker(false)}>
          <div className="modal folder-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>加入收藏夹</h3>
              <button className="modal-close" onClick={() => setShowFolderPicker(false)}>
                ×
              </button>
            </div>
            <div className="folder-picker-content">
              {folders.length === 0 ? (
                <div className="empty-folders">
                  <p>还没有收藏夹</p>
                  <p className="text-muted">创建一个收藏夹来收藏你喜欢的技能吧</p>
                </div>
              ) : (
                <div className="folder-picker-list">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className={`folder-picker-item ${favoritedFolderIds.includes(folder.id) ? 'selected' : ''}`}
                      onClick={() => handleToggleFolderFavorite(folder.id)}
                    >
                      <span className="folder-picker-icon">{folder.icon || '📁'}</span>
                      <div className="folder-picker-info">
                        <span className="folder-picker-name">{folder.name}</span>
                        <span className="folder-picker-count">{folder.itemCount} 个收藏</span>
                      </div>
                      <span className="folder-picker-check">
                        {favoritedFolderIds.includes(folder.id) ? '☑️' : '⬜'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {!showCreateFolder ? (
                <button
                  className="btn btn-outline-primary w-full mt-3"
                  onClick={() => setShowCreateFolder(true)}
                >
                  + 新建收藏夹
                </button>
              ) : (
                <div className="create-folder-form">
                  <div className="form-group">
                    <label className="form-label">收藏夹名称</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="输入收藏夹名称"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">描述（选填）</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newFolderDesc}
                      onChange={(e) => setNewFolderDesc(e.target.value)}
                      placeholder="简单描述一下"
                      maxLength={50}
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowCreateFolder(false)}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCreateFolder}
                      disabled={creatingFolder || !newFolderName.trim()}
                    >
                      {creatingFolder ? '创建中...' : '创建并收藏'}
                    </button>
                  </div>
                </div>
              )}
            </div>
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
        .follow-btn {
          margin-left: auto;
          padding: 8px 20px;
          border: 1px solid #667eea;
          border-radius: 20px;
          background: white;
          color: #667eea;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .follow-btn:hover { background: #667eea; color: white; }
        .follow-btn.following { background: #f0f2ff; border-color: #667eea; color: #667eea; }
        .follow-btn.following:hover { background: #ff4d4f; border-color: #ff4d4f; color: white; }
        .follow-btn:disabled { opacity: 0.6; cursor: not-allowed; }
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
        .modal-large {
          max-width: 640px;
        }
        .booking-section {
          margin-bottom: 24px;
        }
        .section-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #333;
        }
        .date-selector {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .date-item {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 16px;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 70px;
        }
        .date-item:hover:not(.disabled) {
          border-color: #667eea;
          background: #f5f7fa;
        }
        .date-item.selected {
          border-color: #667eea;
          background: #667eea;
          color: white;
        }
        .date-item.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f5f5f5;
        }
        .date-weekday {
          font-size: 12px;
          margin-bottom: 4px;
        }
        .date-day {
          font-size: 18px;
          font-weight: 600;
        }
        .date-today {
          font-size: 10px;
          margin-top: 2px;
          color: #ff7a45;
        }
        .date-item.selected .date-today {
          color: white;
        }
        .date-fully-booked {
          font-size: 10px;
          margin-top: 2px;
          color: #ff4d4f;
        }
        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .time-slot-btn {
          padding: 10px 8px;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          background: white;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .time-slot-btn:hover {
          border-color: #667eea;
          background: #f5f7fa;
        }
        .time-slot-btn.selected {
          border-color: #667eea;
          background: #667eea;
          color: white;
        }
        .no-slots {
          text-align: center;
          padding: 30px;
          color: #999;
          background: #fafafa;
          border-radius: 8px;
        }
        .provider-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .favorite-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .favorite-btn:hover {
          background: #f5f5f5;
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
        .w-full {
          width: 100%;
        }
        .text-muted {
          color: #999;
        }
        .folder-picker-modal {
          max-width: 420px;
        }
        .folder-picker-content {
          padding: 20px 24px 24px;
        }
        .empty-folders {
          text-align: center;
          padding: 30px 20px;
        }
        .empty-folders p {
          margin-bottom: 6px;
        }
        .folder-picker-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 320px;
          overflow-y: auto;
        }
        .folder-picker-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .folder-picker-item:hover {
          border-color: #667eea;
          background: #f5f7fa;
        }
        .folder-picker-item.selected {
          border-color: #667eea;
          background: #f0f2ff;
        }
        .folder-picker-icon {
          font-size: 24px;
        }
        .folder-picker-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .folder-picker-name {
          font-weight: 500;
          font-size: 14px;
        }
        .folder-picker-count {
          font-size: 12px;
          color: #999;
        }
        .folder-picker-check {
          font-size: 16px;
        }
        .btn-outline-primary {
          background: white;
          border: 1px dashed #667eea;
          color: #667eea;
        }
        .btn-outline-primary:hover {
          background: #f0f2ff;
        }
        .mt-3 {
          margin-top: 12px;
        }
        .create-folder-form {
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
          margin-top: 16px;
        }
        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 8px;
        }
        @media (max-width: 768px) {
          .skill-detail {
            grid-template-columns: 1fr;
          }
          .skill-gallery {
            height: 250px;
          }
          .time-slots-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default SkillDetail;
