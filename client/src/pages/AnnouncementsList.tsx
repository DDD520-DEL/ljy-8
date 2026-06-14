import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { announcementApi } from '../api';
import type {
  AnnouncementWithPublisher,
  AnnouncementCategory,
  PaginatedResult,
} from '../types';

function AnnouncementsList() {
  const [announcements, setAnnouncements] = useState<AnnouncementWithPublisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginatedResult<AnnouncementWithPublisher> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState<AnnouncementCategory | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadAnnouncements();
  }, [currentPage, filterCategory, sortOrder]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        pageSize: 10,
        sortOrder,
      };
      if (filterCategory !== 'all') {
        params.category = filterCategory;
      }
      const res = await announcementApi.getAnnouncements(params);
      if (res.success) {
        setAnnouncements(res.data?.items || []);
        setPagination(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (category: AnnouncementCategory) => {
    const map: Record<AnnouncementCategory, { label: string; icon: string; color: string }> = {
      water_electricity: { label: '停水停电', icon: '💧', color: '#1890ff' },
      property: { label: '物业消息', icon: '🏢', color: '#52c41a' },
      community_activity: { label: '社区活动', icon: '🎉', color: '#fa8c16' },
      other: { label: '其他通知', icon: '📋', color: '#722ed1' },
    };
    return map[category];
  };

  const getPriorityInfo = (priority: string) => {
    const map: Record<string, { label: string; color: string }> = {
      normal: { label: '普通', color: '#1890ff' },
      important: { label: '重要', color: '#fa8c16' },
      urgent: { label: '紧急', color: '#ff4d4f' },
    };
    return map[priority] || map.normal;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const categoryOptions: { value: AnnouncementCategory | 'all'; label: string }[] = [
    { value: 'all', label: '📢 全部公告' },
    { value: 'water_electricity', label: '💧 停水停电' },
    { value: 'property', label: '🏢 物业消息' },
    { value: 'community_activity', label: '🎉 社区活动' },
    { value: 'other', label: '📋 其他通知' },
  ];

  return (
    <div className="container announcements-list-page">
      <div className="page-header">
        <h1>📢 社区公告</h1>
        <p className="page-subtitle">
          了解小区最新动态、停水停电通知、社区活动等重要信息
        </p>
      </div>

      <div className="filter-section">
        <div className="filter-tabs">
          {categoryOptions.map((opt) => (
            <button
              key={opt.value}
              className={`filter-tab ${filterCategory === opt.value ? 'active' : ''}`}
              onClick={() => {
                setFilterCategory(opt.value);
                setCurrentPage(1);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="sort-section">
          <button
            className={`sort-btn ${sortOrder === 'desc' ? 'active' : ''}`}
            onClick={() => setSortOrder('desc')}
          >
            📅 最新优先
          </button>
          <button
            className={`sort-btn ${sortOrder === 'asc' ? 'active' : ''}`}
            onClick={() => setSortOrder('asc')}
          >
            📅 最早优先
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : announcements.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>暂无相关公告</p>
        </div>
      ) : (
        <>
          <div className="announcements-list">
            {announcements.map((announcement) => {
              const catInfo = getCategoryInfo(announcement.category);
              const prioInfo = getPriorityInfo(announcement.priority);
              return (
                <Link
                  key={announcement.id}
                  to={`/announcements/${announcement.id}`}
                  className="announcement-card"
                >
                  <div className="card-header">
                    <div className="card-tags">
                      <span
                        className="category-tag"
                        style={{ background: catInfo.color + '20', color: catInfo.color }}
                      >
                        {catInfo.icon} {catInfo.label}
                      </span>
                      {announcement.priority !== 'normal' && (
                        <span
                          className="priority-tag"
                          style={{ background: prioInfo.color + '20', color: prioInfo.color }}
                        >
                          {announcement.priority === 'urgent' ? '🔥 ' : ''}
                          {prioInfo.label}
                        </span>
                      )}
                    </div>
                    <span className="publish-time">{formatDate(announcement.createdAt)}</span>
                  </div>
                  <h3 className="announcement-title">
                    {announcement.priority === 'urgent' && (
                      <span className="urgent-badge">紧急</span>
                    )}
                    {announcement.title}
                  </h3>
                  <p className="announcement-preview">
                    {announcement.content.replace(/\n/g, ' ').slice(0, 100)}...
                  </p>
                  <div className="card-footer">
                    <div className="publisher-info">
                      <img
                        src={announcement.publisher.avatar}
                        alt=""
                        className="publisher-avatar"
                      />
                      <span className="publisher-name">{announcement.publisher.nickname}</span>
                    </div>
                    <span className="view-count">👁 {announcement.viewCount} 次阅读</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ← 上一页
              </button>
              <span className="page-info">
                第 {currentPage} / {pagination.totalPages} 页，共 {pagination.total} 条公告
              </span>
              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                下一页 →
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        .announcements-list-page {
          max-width: 900px;
          margin: 0 auto;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 28px;
          margin-bottom: 8px;
          color: #333;
        }
        .page-subtitle {
          color: #999;
          font-size: 14px;
          margin: 0;
        }
        .filter-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .filter-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-tab {
          padding: 8px 16px;
          border: none;
          background: white;
          border-radius: 20px;
          font-size: 14px;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .filter-tab:hover {
          background: #f0f2ff;
          color: #667eea;
        }
        .filter-tab.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }
        .sort-section {
          display: flex;
          gap: 8px;
        }
        .sort-btn {
          padding: 8px 14px;
          border: 1px solid #e0e0e0;
          background: white;
          border-radius: 8px;
          font-size: 13px;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sort-btn:hover {
          border-color: #667eea;
          color: #667eea;
        }
        .sort-btn.active {
          background: #f0f2ff;
          border-color: #667eea;
          color: #667eea;
        }
        .announcements-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .announcement-card {
          display: block;
          background: white;
          border-radius: 12px;
          padding: 24px;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        .announcement-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          border-color: #e0e7ff;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .card-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .category-tag,
        .priority-tag {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .publish-time {
          color: #999;
          font-size: 13px;
        }
        .announcement-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: #333;
          line-height: 1.5;
        }
        .urgent-badge {
          display: inline-block;
          background: #ff4d4f;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-right: 8px;
          vertical-align: middle;
        }
        .announcement-preview {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 0 16px 0;
        }
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }
        .publisher-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .publisher-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .publisher-name {
          font-size: 13px;
          color: #666;
        }
        .view-count {
          font-size: 13px;
          color: #999;
        }
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 32px;
        }
        .page-btn {
          padding: 10px 20px;
          border: 1px solid #e0e0e0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          transition: all 0.2s;
        }
        .page-btn:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .page-info {
          color: #999;
          font-size: 14px;
        }
        .loading, .empty-state {
          text-align: center;
          padding: 60px 0;
          color: #999;
        }
        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        @media (max-width: 768px) {
          .filter-section {
            flex-direction: column;
            align-items: flex-start;
          }
          .announcement-card {
            padding: 16px;
          }
          .announcement-title {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default AnnouncementsList;
