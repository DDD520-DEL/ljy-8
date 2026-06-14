import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { activityApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { ActivityWithDetails } from '../types';

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

const categoryIcons: Record<string, string> = {
  sports: '⚽',
  culture: '🎨',
  education: '📚',
  social: '🍻',
  other: '📌',
};

type TabType = 'organized' | 'registered';

function MyActivities() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('organized');
  const [organizedActivities, setOrganizedActivities] = useState<ActivityWithDetails[]>([]);
  const [registeredActivities, setRegisteredActivities] = useState<ActivityWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [organizedRes, registeredRes] = await Promise.all([
        activityApi.getMyOrganizedActivities(),
        activityApi.getMyRegisteredActivities(),
      ]);
      if (organizedRes.success) {
        setOrganizedActivities(organizedRes.data || []);
      }
      if (registeredRes.success) {
        setRegisteredActivities(registeredRes.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartActivity = async (id: string) => {
    if (!confirm('确定要开始活动吗？')) return;
    setSubmitting(id);
    try {
      const res = await activityApi.startActivity(id);
      if (res.success) {
        alert('活动已开始！');
        loadData();
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(null);
    }
  };

  const handleCompleteActivity = async (id: string) => {
    if (!confirm('确定要结束活动吗？结束后参与者将获得信用分奖励。')) return;
    setSubmitting(id);
    try {
      const res = await activityApi.completeActivity(id);
      if (res.success) {
        alert('活动已完成！参与者各获得3信用分，您获得5信用分。');
        loadData();
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(null);
    }
  };

  const handleCancelActivity = async (id: string) => {
    const reason = prompt('请输入取消原因（选填）：');
    if (reason === null) return;
    setSubmitting(id);
    try {
      const res = await activityApi.cancelActivity(id, reason || undefined);
      if (res.success) {
        alert('活动已取消');
        loadData();
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(null);
    }
  };

  const handleCancelRegistration = async (id: string) => {
    if (!confirm('确定要取消报名吗？')) return;
    setSubmitting(id);
    try {
      const res = await activityApi.cancelRegistration(id);
      if (res.success) {
        alert('已取消报名');
        loadData();
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(null);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderActivityCard = (activity: ActivityWithDetails, type: TabType) => (
    <div key={activity.id} className="activity-card">
      <div className="activity-image">
        {activity.images.length > 0 ? (
          <img src={activity.images[0]} alt={activity.title} />
        ) : (
          <div className="image-placeholder">
            <span>{categoryIcons[activity.category] || '🎉'}</span>
          </div>
        )}
        <span
          className="status-tag"
          style={{ background: statusColor[activity.status] }}
        >
          {statusText[activity.status]}
        </span>
        {type === 'registered' && activity.status !== 'cancelled' && (
          <span className="registered-tag">已报名</span>
        )}
      </div>
      <div className="activity-content">
        <h3 className="activity-title">{activity.title}</h3>
        <div className="activity-info">
          <div className="info-item">
            <span className="info-icon">🕐</span>
            {formatDateTime(activity.startTime)}
          </div>
          <div className="info-item">
            <span className="info-icon">📍</span>
            {activity.location}
          </div>
          <div className="info-item">
            <span className="info-icon">👥</span>
            {activity.currentParticipants}/{activity.maxParticipants} 人
          </div>
        </div>
        <div className="activity-actions">
          <Link to={`/activities/${activity.id}`} className="btn btn-secondary btn-sm">
            查看详情
          </Link>
          {type === 'organized' && (
            <>
              {(activity.status === 'recruiting' || activity.status === 'full') && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleStartActivity(activity.id)}
                  disabled={submitting === activity.id}
                >
                  {submitting === activity.id ? '处理中...' : '开始活动'}
                </button>
              )}
              {activity.status === 'ongoing' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleCompleteActivity(activity.id)}
                  disabled={submitting === activity.id}
                >
                  {submitting === activity.id ? '处理中...' : '结束活动'}
                </button>
              )}
              {activity.status !== 'completed' && activity.status !== 'cancelled' && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleCancelActivity(activity.id)}
                  disabled={submitting === activity.id}
                >
                  取消活动
                </button>
              )}
            </>
          )}
          {type === 'registered' &&
            activity.isRegistered &&
            activity.status !== 'ongoing' &&
            activity.status !== 'completed' &&
            activity.status !== 'cancelled' && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleCancelRegistration(activity.id)}
                disabled={submitting === activity.id}
              >
                {submitting === activity.id ? '处理中...' : '取消报名'}
              </button>
            )}
          {type === 'registered' && activity.status === 'completed' && (
            <Link to={`/activities/${activity.id}`} className="btn btn-primary btn-sm">
              上传照片
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  const currentList = activeTab === 'organized' ? organizedActivities : registeredActivities;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container my-activities-page">
      <div className="page-header">
        <h1>我的活动</h1>
        <Link to="/publish/activity" className="btn btn-primary">
          + 发布活动
        </Link>
      </div>

      <div className="tabs">
        <div
          className={`tab ${activeTab === 'organized' ? 'active' : ''}`}
          onClick={() => setActiveTab('organized')}
        >
          我组织的
          <span className="tab-count">{organizedActivities.length}</span>
        </div>
        <div
          className={`tab ${activeTab === 'registered' ? 'active' : ''}`}
          onClick={() => setActiveTab('registered')}
        >
          我报名的
          <span className="tab-count">{registeredActivities.length}</span>
        </div>
      </div>

      <div className="tab-content">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : currentList.length > 0 ? (
          <div className="activity-grid">
            {currentList.map((activity) => renderActivityCard(activity, activeTab))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <p>
              {activeTab === 'organized'
                ? '您还没有组织任何活动'
                : '您还没有报名任何活动'}
            </p>
            {activeTab === 'organized' ? (
              <Link to="/publish/activity" className="btn btn-primary">
                去发布活动
              </Link>
            ) : (
              <Link to="/activities" className="btn btn-primary">
                浏览活动
              </Link>
            )}
          </div>
        )}
      </div>

      <style>{`
        .my-activities-page {
          padding-top: 0;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .page-header h1 {
          margin: 0;
          font-size: 28px;
        }
        .tabs {
          display: flex;
          gap: 0;
          margin-bottom: 24px;
          background: white;
          border-radius: 12px;
          padding: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          width: fit-content;
        }
        .tab {
          padding: 10px 24px;
          font-size: 15px;
          font-weight: 500;
          color: #666;
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .tab:hover {
          color: #333;
        }
        .tab.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .tab-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
        }
        .tab:not(.active) .tab-count {
          background: #f0f0f0;
          color: #999;
        }
        .activity-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .activity-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.3s;
        }
        .activity-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        .activity-image {
          position: relative;
          height: 160px;
          overflow: hidden;
        }
        .activity-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .image-placeholder span {
          font-size: 64px;
        }
        .status-tag {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }
        .registered-tag {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #52c41a;
          color: white;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
        }
        .activity-content {
          padding: 16px;
        }
        .activity-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .activity-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #666;
        }
        .info-icon {
          font-size: 14px;
          width: 16px;
          text-align: center;
        }
        .activity-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .btn-primary:hover {
          opacity: 0.9;
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-secondary {
          background: #f0f0f0;
          color: #333;
        }
        .btn-secondary:hover {
          background: #e0e0e0;
        }
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-danger {
          background: #ff4d4f;
          color: white;
        }
        .btn-danger:hover {
          background: #ff7875;
        }
        .btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
        .empty-state p {
          margin-bottom: 20px;
          font-size: 15px;
        }
        @media (max-width: 768px) {
          .activity-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .tabs {
            width: 100%;
          }
          .tab {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default MyActivities;
