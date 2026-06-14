import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { announcementApi } from '../api';
import type { AnnouncementWithPublisher, AnnouncementCategory } from '../types';

function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<AnnouncementWithPublisher | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadAnnouncement();
  }, [id]);

  const loadAnnouncement = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await announcementApi.getAnnouncementById(id);
      if (res.success) {
        setAnnouncement(res.data || null);
        if (!res.data) {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    } catch (err) {
      setNotFound(true);
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
    const map: Record<string, { label: string; color: string; bgColor: string }> = {
      normal: { label: '普通通知', color: '#1890ff', bgColor: '#e6f7ff' },
      important: { label: '重要通知', color: '#fa8c16', bgColor: '#fff7e6' },
      urgent: { label: '紧急通知', color: '#ff4d4f', bgColor: '#fff1f0' },
    };
    return map[priority] || map.normal;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container announcement-detail-page">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (notFound || !announcement) {
    return (
      <div className="container announcement-detail-page">
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>公告不存在</h2>
          <p>该公告可能已被删除或链接无效</p>
          <Link to="/announcements" className="btn btn-primary">
            返回公告列表
          </Link>
        </div>
      </div>
    );
  }

  const catInfo = getCategoryInfo(announcement.category);
  const prioInfo = getPriorityInfo(announcement.priority);

  return (
    <div className="container announcement-detail-page">
      <div className="back-link">
        <Link to="/announcements">← 返回公告列表</Link>
      </div>

      <article className="announcement-article">
        <header className="article-header">
          <div className="article-meta">
            <span
              className="category-badge"
              style={{ background: catInfo.color + '20', color: catInfo.color }}
            >
              {catInfo.icon} {catInfo.label}
            </span>
            <span
              className="priority-badge"
              style={{ background: prioInfo.bgColor, color: prioInfo.color }}
            >
              {announcement.priority === 'urgent' && '🔥 '}
              {prioInfo.label}
            </span>
          </div>

          <h1 className="article-title">
            {announcement.priority === 'urgent' && (
              <span className="urgent-label">【紧急】</span>
            )}
            {announcement.priority === 'important' && (
              <span className="important-label">【重要】</span>
            )}
            {announcement.title}
          </h1>

          <div className="article-info">
            <div className="publisher">
              <img
                src={announcement.publisher.avatar}
                alt=""
                className="publisher-avatar"
              />
              <span className="publisher-name">{announcement.publisher.nickname}</span>
            </div>
            <div className="publish-time">
              <span>📅 {formatDate(announcement.createdAt)}</span>
            </div>
            <div className="view-count">
              <span>👁 {announcement.viewCount} 次阅读</span>
            </div>
          </div>
        </header>

        <div className="article-content">
          {announcement.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph || <br />}</p>
          ))}
        </div>

        <footer className="article-footer">
          <div className="footer-info">
            <span className="update-time">
              最后更新于 {formatDate(announcement.updatedAt)}
            </span>
          </div>
        </footer>
      </article>

      <div className="bottom-actions">
        <Link to="/announcements" className="btn btn-secondary">
          ← 查看更多公告
        </Link>
      </div>

      <style>{`
        .announcement-detail-page {
          max-width: 800px;
          margin: 0 auto;
        }
        .back-link {
          margin-bottom: 20px;
        }
        .back-link a {
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
        }
        .back-link a:hover {
          text-decoration: underline;
        }
        .announcement-article {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          margin-bottom: 24px;
        }
        .article-header {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid #f0f0f0;
        }
        .article-meta {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .category-badge,
        .priority-badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }
        .article-title {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin: 0 0 20px 0;
          line-height: 1.4;
        }
        .urgent-label {
          color: #ff4d4f;
          margin-right: 8px;
        }
        .important-label {
          color: #fa8c16;
          margin-right: 8px;
        }
        .article-info {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          color: #999;
          font-size: 14px;
        }
        .publisher {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .publisher-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
        }
        .publisher-name {
          color: #666;
          font-weight: 500;
        }
        .article-content {
          font-size: 16px;
          line-height: 2;
          color: #333;
        }
        .article-content p {
          margin: 0 0 16px 0;
        }
        .article-content p:last-child {
          margin-bottom: 0;
        }
        .article-footer {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #f0f0f0;
        }
        .footer-info {
          color: #999;
          font-size: 13px;
          text-align: right;
        }
        .bottom-actions {
          text-align: center;
          margin-top: 24px;
        }
        .btn {
          display: inline-block;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          border: none;
          text-decoration: none;
          transition: all 0.2s;
          font-weight: 500;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .btn-secondary {
          background: #f5f5f5;
          color: #666;
        }
        .btn-secondary:hover {
          background: #e8e8e8;
        }
        .loading, .empty-state {
          text-align: center;
          padding: 80px 20px;
        }
        .empty-state h2 {
          color: #333;
          margin-bottom: 8px;
        }
        .empty-state p {
          color: #999;
          margin-bottom: 24px;
        }
        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        @media (max-width: 768px) {
          .announcement-article {
            padding: 20px;
          }
          .article-title {
            font-size: 22px;
          }
          .article-content {
            font-size: 15px;
          }
          .article-info {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}

export default AnnouncementDetail;
