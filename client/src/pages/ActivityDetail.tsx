import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { activityApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { ActivityWithDetails, ActivityPhotoWithUser } from '../types';

const statusText: Record<string, string> = {
  recruiting: '报名中',
  full: '名额已满',
  ongoing: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColor: Record<string, string> = {
  recruiting: '#52c41a',
  full: '#fa8c16',
  ongoing: '#1890ff',
  completed: '#8c8c8c',
  cancelled: '#f5222d',
};

const categoryText: Record<string, string> = {
  sports: '体育运动',
  culture: '文化艺术',
  education: '亲子教育',
  social: '社交聚会',
  other: '其他',
};

const categoryIcons: Record<string, string> = {
  sports: '⚽',
  culture: '🎨',
  education: '📚',
  social: '🍻',
  other: '📌',
};

function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [activity, setActivity] = useState<ActivityWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (id) {
      loadActivity();
    }
  }, [id]);

  const loadActivity = async () => {
    setLoading(true);
    const res = await activityApi.getActivityById(id!);
    if (res.success) {
      setActivity(res.data);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const res = await activityApi.registerActivity(id!);
      if (res.success) {
        alert('报名成功！请准时参加活动');
        loadActivity();
      } else {
        alert(res.message || '报名失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!confirm('确定要取消报名吗？')) return;
    setSubmitting(true);
    try {
      const res = await activityApi.cancelRegistration(id!);
      if (res.success) {
        alert('已取消报名');
        loadActivity();
      } else {
        alert(res.message || '取消失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartActivity = async () => {
    if (!confirm('确定要开始活动吗？')) return;
    setSubmitting(true);
    try {
      const res = await activityApi.startActivity(id!);
      if (res.success) {
        alert('活动已开始！');
        loadActivity();
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteActivity = async () => {
    if (!confirm('确定要结束活动吗？结束后参与者将获得信用分奖励，并可以上传活动照片。')) return;
    setSubmitting(true);
    try {
      const res = await activityApi.completeActivity(id!);
      if (res.success) {
        alert('活动已完成！参与者各获得3信用分，组织者获得5信用分。');
        loadActivity();
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelActivity = async () => {
    if (!confirm('确定要取消活动吗？所有报名用户将收到通知。')) return;
    setSubmitting(true);
    try {
      const res = await activityApi.cancelActivity(id!, cancelReason);
      if (res.success) {
        alert('活动已取消');
        setShowCancelModal(false);
        loadActivity();
      } else {
        alert(res.message || '取消失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      alert('请输入图片链接');
      return;
    }
    setSubmitting(true);
    try {
      const res = await activityApi.uploadPhoto(id!, {
        imageUrl: photoUrl,
        description: photoDescription || undefined,
      });
      if (res.success) {
        alert('照片上传成功！');
        setShowPhotoModal(false);
        setPhotoUrl('');
        setPhotoDescription('');
        loadActivity();
      } else {
        alert(res.message || '上传失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？')) return;
    try {
      const res = await activityApi.deletePhoto(photoId);
      if (res.success) {
        loadActivity();
      } else {
        alert(res.message || '删除失败');
      }
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOrganizer = user?.id === activity?.organizerId;
  const isRegistered = activity?.isRegistered;
  const canRegister = activity?.status === 'recruiting' || activity?.status === 'full';
  const canUploadPhoto = activity?.status === 'completed' && (isRegistered || isOrganizer);

  if (loading) {
    return <div className="container loading">加载中...</div>;
  }

  if (!activity) {
    return (
      <div className="container empty-state">
        <div className="empty-icon">😕</div>
        <p>活动不存在</p>
        <Link to="/activities" className="btn btn-primary">
          返回活动列表
        </Link>
      </div>
    );
  }

  return (
    <div className="container activity-detail-page">
      <div className="detail-header">
        <Link to="/activities" className="back-link">
          ← 返回活动列表
        </Link>
      </div>

      <div className="detail-content">
        <div className="detail-main">
          <div className="activity-gallery">
            {activity.images.length > 0 ? (
              <img src={activity.images[0]} alt={activity.title} className="main-image" />
            ) : (
              <div className="main-image-placeholder">
                <span className="placeholder-icon">{categoryIcons[activity.category] || '🎉'}</span>
              </div>
            )}
          </div>

          <div className="activity-info-section">
            <div className="activity-title-row">
              <h1 className="activity-title">{activity.title}</h1>
              <span
                className="status-badge"
                style={{ background: statusColor[activity.status] + '20', color: statusColor[activity.status] }}
              >
                {statusText[activity.status]}
              </span>
            </div>

            <div className="activity-meta-row">
              <span className="category-tag">
                {categoryIcons[activity.category] || '📌'} {categoryText[activity.category] || '其他'}
              </span>
              <span className="meta-item">
                <span>👁</span> {activity.viewCount} 次浏览
              </span>
              <span className="meta-item">
                <span>👥</span> {activity.currentParticipants}/{activity.maxParticipants} 人
              </span>
            </div>

            <div className="info-card">
              <div className="info-item">
                <span className="info-icon">🕐</span>
                <div>
                  <div className="info-label">活动时间</div>
                  <div className="info-value">
                    {formatDateTime(activity.startTime)} - {formatDateTime(activity.endTime)}
                  </div>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">📍</span>
                <div>
                  <div className="info-label">活动地点</div>
                  <div className="info-value">{activity.location}</div>
                </div>
              </div>
            </div>

            <div className="activity-description">
              <h3>活动介绍</h3>
              <p>{activity.description}</p>
            </div>

            <div className="activity-organizer">
              <h3>组织者</h3>
              <div className="organizer-info">
                <img src={activity.organizer.avatar} alt="" className="avatar" />
                <div>
                  <div className="organizer-name">{activity.organizer.nickname}</div>
                  <div className="organizer-neighborhood">{activity.organizer.neighborhood}</div>
                </div>
                <span className="credit-badge">
                  ⭐ {activity.organizer.creditScore} {activity.organizer.creditLevel}
                </span>
              </div>
            </div>

            {activity.status === 'completed' && activity.photos.length > 0 && (
              <div className="activity-photos">
                <div className="section-header">
                  <h3>活动相册</h3>
                  {canUploadPhoto && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowPhotoModal(true)}
                    >
                      + 上传照片
                    </button>
                  )}
                </div>
                <div className="photo-grid">
                  {activity.photos.map((photo) => (
                    <div key={photo.id} className="photo-item">
                      <img src={photo.imageUrl} alt={photo.description || '活动照片'} />
                      {photo.description && (
                        <p className="photo-desc">{photo.description}</p>
                      )}
                      <div className="photo-meta">
                        <img src={photo.user.avatar} alt="" className="avatar-sm" />
                        <span>{photo.user.nickname}</span>
                        {photo.userId === user?.id && (
                          <button
                            className="btn-delete"
                            onClick={() => handleDeletePhoto(photo.id)}
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activity.status === 'completed' && activity.photos.length === 0 && canUploadPhoto && (
              <div className="empty-photos">
                <p>还没有照片，快来上传第一张活动照片吧！</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowPhotoModal(true)}
                >
                  + 上传照片
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-title">报名情况</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(activity.currentParticipants / activity.maxParticipants) * 100}%` }}
              />
            </div>
            <div className="progress-text">
              {activity.currentParticipants} / {activity.maxParticipants} 人已报名
            </div>

            {activity.registrations.length > 0 && (
              <div className="participants-list">
                {activity.registrations.map((reg) => (
                  <div key={reg.id} className="participant-item">
                    <img src={reg.user.avatar} alt="" className="avatar" />
                    <span className="participant-name">{reg.user.nickname}</span>
                    <span className={`status-dot status-${reg.status}`}></span>
                  </div>
                ))}
              </div>
            )}

            <div className="sidebar-actions">
              {isOrganizer ? (
                <>
                  {(activity.status === 'recruiting' || activity.status === 'full') && (
                    <button
                      className="btn btn-primary btn-block"
                      onClick={handleStartActivity}
                      disabled={submitting}
                    >
                      {submitting ? '处理中...' : '开始活动'}
                    </button>
                  )}
                  {activity.status === 'ongoing' && (
                    <button
                      className="btn btn-primary btn-block"
                      onClick={handleCompleteActivity}
                      disabled={submitting}
                    >
                      {submitting ? '处理中...' : '结束活动'}
                    </button>
                  )}
                  {activity.status !== 'completed' && activity.status !== 'cancelled' && (
                    <button
                      className="btn btn-danger btn-block"
                      onClick={() => setShowCancelModal(true)}
                      disabled={submitting}
                    >
                      取消活动
                    </button>
                  )}
                </>
              ) : (
                <>
                  {canRegister && !isRegistered && (
                    <button
                      className="btn btn-primary btn-block"
                      onClick={handleRegister}
                      disabled={submitting || activity.status === 'full'}
                    >
                      {submitting ? '报名中...' : activity.status === 'full' ? '名额已满' : '立即报名'}
                    </button>
                  )}
                  {isRegistered && activity.status !== 'ongoing' && activity.status !== 'completed' && activity.status !== 'cancelled' && (
                    <button
                      className="btn btn-secondary btn-block"
                      onClick={handleCancelRegistration}
                      disabled={submitting}
                    >
                      {submitting ? '处理中...' : '取消报名'}
                    </button>
                  )}
                  {isRegistered && activity.status === 'ongoing' && (
                    <div className="status-message">活动进行中，请准时参加！</div>
                  )}
                  {isRegistered && activity.status === 'completed' && (
                    <button
                      className="btn btn-primary btn-block"
                      onClick={() => setShowPhotoModal(true)}
                    >
                      上传活动照片
                    </button>
                  )}
                  {!isAuthenticated && (
                    <button
                      className="btn btn-primary btn-block"
                      onClick={() => navigate('/login')}
                    >
                      登录后报名
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPhotoModal && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>上传活动照片</h3>
              <button className="modal-close" onClick={() => setShowPhotoModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleUploadPhoto}>
              <div className="form-group">
                <label>图片链接 *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="请输入图片URL"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>描述（选填）</label>
                <textarea
                  className="form-control"
                  placeholder="给照片加个描述吧..."
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPhotoModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !photoUrl}
                >
                  {submitting ? '上传中...' : '上传'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>取消活动</h3>
              <button className="modal-close" onClick={() => setShowCancelModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCancelActivity}>
              <div className="form-group">
                <label>取消原因（选填）</label>
                <textarea
                  className="form-control"
                  placeholder="请输入取消原因（将通知给所有报名用户）"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCancelModal(false)}
                >
                  再想想
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={submitting}
                >
                  {submitting ? '处理中...' : '确认取消'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .activity-detail-page {
          padding-top: 0;
        }
        .detail-header {
          margin-bottom: 20px;
        }
        .back-link {
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
        }
        .back-link:hover {
          text-decoration: underline;
        }
        .detail-content {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
        }
        .detail-main {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .activity-gallery {
          margin-bottom: 24px;
        }
        .main-image {
          width: 100%;
          height: 400px;
          object-fit: cover;
          border-radius: 12px;
        }
        .main-image-placeholder {
          width: 100%;
          height: 400px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .placeholder-icon {
          font-size: 120px;
        }
        .activity-title-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }
        .activity-title {
          font-size: 28px;
          margin: 0;
          flex: 1;
        }
        .status-badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
        }
        .activity-meta-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .category-tag {
          background: #f0f2ff;
          color: #667eea;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 14px;
        }
        .meta-item {
          font-size: 14px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .info-card {
          background: #f9f9f9;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .info-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .info-item:last-child {
          margin-bottom: 0;
        }
        .info-icon {
          font-size: 24px;
          width: 40px;
          text-align: center;
        }
        .info-label {
          font-size: 13px;
          color: #999;
          margin-bottom: 4px;
        }
        .info-value {
          font-size: 15px;
          color: #333;
          font-weight: 500;
        }
        .activity-description,
        .activity-organizer,
        .activity-photos {
          margin-bottom: 24px;
        }
        .activity-description h3,
        .activity-organizer h3,
        .section-header h3 {
          font-size: 18px;
          margin-bottom: 12px;
          color: #333;
        }
        .activity-description p {
          font-size: 15px;
          line-height: 1.8;
          color: #666;
          white-space: pre-wrap;
        }
        .organizer-info {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f9f9f9;
          padding: 16px;
          border-radius: 12px;
        }
        .organizer-info .avatar {
          width: 48px;
          height: 48px;
        }
        .organizer-name {
          font-weight: 600;
          color: #333;
        }
        .organizer-neighborhood {
          font-size: 13px;
          color: #999;
        }
        .credit-badge {
          margin-left: auto;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 500;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .section-header h3 {
          margin: 0;
        }
        .photo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .photo-item {
          border-radius: 8px;
          overflow: hidden;
          background: #f9f9f9;
        }
        .photo-item img {
          width: 100%;
          height: 160px;
          object-fit: cover;
        }
        .photo-desc {
          padding: 8px 12px;
          font-size: 13px;
          color: #666;
          margin: 0;
        }
        .photo-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-top: 1px solid #f0f0f0;
          font-size: 12px;
          color: #999;
        }
        .avatar-sm {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }
        .btn-delete {
          margin-left: auto;
          background: none;
          border: none;
          color: #ff4d4f;
          font-size: 12px;
          cursor: pointer;
        }
        .empty-photos {
          text-align: center;
          padding: 40px;
          background: #f9f9f9;
          border-radius: 12px;
        }
        .empty-photos p {
          color: #999;
          margin-bottom: 16px;
        }
        .detail-sidebar {
          position: sticky;
          top: 80px;
          align-self: flex-start;
        }
        .sidebar-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .sidebar-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .progress-bar {
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s;
        }
        .progress-text {
          font-size: 14px;
          color: #666;
          margin-bottom: 16px;
        }
        .participants-list {
          max-height: 240px;
          overflow-y: auto;
          margin-bottom: 20px;
          border-top: 1px solid #f0f0f0;
          padding-top: 12px;
        }
        .participant-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
        }
        .participant-item .avatar {
          width: 28px;
          height: 28px;
        }
        .participant-name {
          font-size: 14px;
          color: #333;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-left: auto;
        }
        .status-registered {
          background: #52c41a;
        }
        .status-attended {
          background: #1890ff;
        }
        .status-cancelled {
          background: #ff4d4f;
        }
        .sidebar-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .btn-block {
          width: 100%;
        }
        .btn-sm {
          padding: 6px 14px;
          font-size: 13px;
        }
        .btn-danger {
          background: #ff4d4f;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-danger:hover {
          background: #ff7875;
        }
        .btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .status-message {
          text-align: center;
          padding: 12px;
          background: #e6f7ff;
          color: #1890ff;
          border-radius: 8px;
          font-size: 14px;
        }
        .loading,
        .empty-state {
          text-align: center;
          padding: 60px 0;
          color: #999;
        }
        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
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
          max-width: 480px;
          overflow: hidden;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #f0f0f0;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #999;
          cursor: pointer;
        }
        .modal form {
          padding: 20px;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }
        .form-control {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
        }
        .form-control:focus {
          outline: none;
          border-color: #667eea;
        }
        textarea.form-control {
          resize: vertical;
          min-height: 80px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid #f0f0f0;
        }
        @media (max-width: 768px) {
          .detail-content {
            grid-template-columns: 1fr;
          }
          .photo-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .main-image,
          .main-image-placeholder {
            height: 240px;
          }
          .placeholder-icon {
            font-size: 80px;
          }
        }
      `}</style>
    </div>
  );
}

export default ActivityDetail;
