import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { activityApi } from '../api';
import type { ActivityWithDetails, PaginatedResult, PublicUser } from '../types';
import { useAuthStore } from '../store/authStore';

type SortOption = {
  label: string;
  value: string;
  sortBy: string;
  sortOrder: string;
};

const sortOptions: SortOption[] = [
  { label: '最新发布', value: 'latest', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: '最近开始', value: 'upcoming', sortBy: 'startTime', sortOrder: 'asc' },
  { label: '浏览热度', value: 'popular', sortBy: 'viewCount', sortOrder: 'desc' },
  { label: '人数最多', value: 'most', sortBy: 'maxParticipants', sortOrder: 'desc' },
];

const categories = [
  { value: 'all', label: '全部', icon: '🎉' },
  { value: 'sports', label: '体育运动', icon: '⚽' },
  { value: 'culture', label: '文化艺术', icon: '🎨' },
  { value: 'education', label: '亲子教育', icon: '📚' },
  { value: 'social', label: '社交聚会', icon: '🍻' },
  { value: 'other', label: '其他', icon: '📌' },
];

const statusText: Record<string, string> = {
  recruiting: '报名中',
  full: '名额已满',
  ongoing: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColor: Record<string, string> = {
  recruiting: 'green',
  full: 'orange',
  ongoing: 'blue',
  completed: 'gray',
  cancelled: 'red',
};

function Activities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<PaginatedResult<ActivityWithDetails> | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const { user } = useAuthStore();

  const categoryParam = searchParams.get('category') || 'all';
  const sortParam = searchParams.get('sort') || 'latest';
  const userNeighborhoodParam = searchParams.get('userNeighborhood') || '';
  const statusParam = searchParams.get('status') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 8;

  useEffect(() => {
    loadActivities();
  }, [categoryParam, sortParam, userNeighborhoodParam, statusParam, pageParam]);

  const loadActivities = async () => {
    setLoading(true);
    const sortConfig = sortOptions.find(s => s.value === sortParam) || sortOptions[0];
    const res = await activityApi.getActivities({
      category: categoryParam,
      keyword: keyword || undefined,
      userNeighborhood: userNeighborhoodParam || undefined,
      status: statusParam || undefined,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      page: pageParam,
      pageSize: pageSize,
    });
    if (res.success) {
      setResult(res.data);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams({ page: '1' });
    loadActivities();
  };

  const updateSearchParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  };

  const handleCategoryClick = (cat: string) => {
    updateSearchParams({ category: cat, page: '1' });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearchParams({ sort: e.target.value, page: '1' });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearchParams({ status: e.target.value, page: '1' });
  };

  const handleNeighborhoodToggle = () => {
    if (userNeighborhoodParam) {
      updateSearchParams({ userNeighborhood: undefined, page: '1' });
    } else if (user?.neighborhood) {
      updateSearchParams({ userNeighborhood: user.neighborhood, page: '1' });
    }
  };

  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage.toString() });
  };

  const activities = result?.items || [];
  const totalPages = result?.totalPages || 1;
  const total = result?.total || 0;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container activities-page">
      <div className="page-header">
        <h1>邻里活动</h1>
        <Link to="/publish/activity" className="btn btn-primary">
          + 发布活动
        </Link>
      </div>

      <div className="search-section">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="搜索活动名称或描述..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            搜索
          </button>
        </form>
      </div>

      <div className="filter-panel">
        <div className="filter-row">
          <span className="filter-label">分类：</span>
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat.value}
                className={`category-tab ${categoryParam === cat.value ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.value)}
              >
                <span style={{ marginRight: '4px' }}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-row">
          <span className="filter-label">距离：</span>
          <button
            className={`filter-option ${userNeighborhoodParam ? 'active' : ''}`}
            onClick={handleNeighborhoodToggle}
            disabled={!user}
          >
            同小区
          </button>

          <span className="filter-label">状态：</span>
          <select
            className="filter-select"
            value={statusParam}
            onChange={handleStatusChange}
          >
            <option value="">全部状态</option>
            <option value="recruiting">报名中</option>
            <option value="full">名额已满</option>
            <option value="ongoing">进行中</option>
            <option value="completed">已完成</option>
          </select>

          <span className="filter-label" style={{ marginLeft: 'auto' }}>排序：</span>
          <select
            className="filter-select"
            value={sortParam}
            onChange={handleSortChange}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="result-info">
        共找到 <span className="highlight">{total}</span> 个活动
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : activities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <p>暂无活动，快来发起第一个邻里活动吧！</p>
        </div>
      ) : (
        <>
          <div className="activity-grid">
            {activities.map((activity) => (
              <Link key={activity.id} to={`/activities/${activity.id}`} className="activity-card">
                <div className="activity-image">
                  {activity.images[0] ? (
                    <img src={activity.images[0]} alt={activity.title} />
                  ) : (
                    <div className="activity-placeholder">
                      {categories.find(c => c.value === activity.category)?.icon || '🎉'}
                    </div>
                  )}
                  <span className={`tag tag-${statusColor[activity.status]}`}>
                    {statusText[activity.status]}
                  </span>
                  {activity.isRegistered && (
                    <span className="registered-badge">已报名</span>
                  )}
                </div>
                <div className="activity-info">
                  <h3 className="activity-title">{activity.title}</h3>
                  <p className="activity-desc">{activity.description}</p>
                  <div className="activity-time">
                    <span>🕐</span>
                    <span>{formatDateTime(activity.startTime)}</span>
                  </div>
                  <div className="activity-location">
                    <span>📍</span>
                    <span>{activity.location}</span>
                  </div>
                  <div className="activity-meta">
                    <img src={activity.organizer.avatar} alt="" className="avatar" />
                    <span className="organizer-name">{activity.organizer.nickname}</span>
                    <span className="organizer-neighborhood">{activity.organizer.neighborhood}</span>
                  </div>
                  <div className="activity-footer">
                    <span className="activity-participants">
                      {activity.currentParticipants}/{activity.maxParticipants} 人
                    </span>
                    <span className="activity-stats">
                      <span>👁 {activity.viewCount}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => handlePageChange(pageParam - 1)}
                disabled={pageParam <= 1}
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  className={`page-btn ${pageNum === pageParam ? 'active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => handlePageChange(pageParam + 1)}
                disabled={pageParam >= totalPages}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        .activities-page {
          padding-top: 0;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 28px;
        }
        .search-section {
          margin-bottom: 20px;
        }
        .search-form {
          display: flex;
          gap: 12px;
          max-width: 500px;
        }
        .search-input {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          font-size: 14px;
        }
        .filter-panel {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .filter-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .filter-row:last-child {
          margin-bottom: 0;
        }
        .filter-label {
          font-size: 14px;
          color: #666;
          font-weight: 500;
          min-width: 70px;
        }
        .category-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .category-tab {
          padding: 6px 16px;
          background: #f5f5f5;
          border: none;
          border-radius: 16px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .category-tab:hover {
          background: #e8e8e8;
        }
        .category-tab.active {
          background: #667eea;
          color: white;
        }
        .filter-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-option {
          padding: 6px 14px;
          background: #f5f5f5;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-option:hover:not(:disabled) {
          background: #e8e8e8;
        }
        .filter-option.active {
          background: #667eea;
          color: white;
        }
        .filter-option:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .filter-select {
          padding: 6px 12px;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          font-size: 13px;
          background: white;
          cursor: pointer;
        }
        .result-info {
          margin-bottom: 16px;
          font-size: 14px;
          color: #666;
        }
        .result-info .highlight {
          color: #667eea;
          font-weight: 600;
        }
        .activity-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }
        .activity-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          text-decoration: none;
          color: inherit;
        }
        .activity-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .activity-image {
          position: relative;
          height: 180px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .activity-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .activity-placeholder {
          font-size: 56px;
        }
        .activity-image .tag {
          position: absolute;
          top: 12px;
          left: 12px;
        }
        .registered-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #52c41a;
          color: white;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .tag {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .tag-green {
          background: #f6ffed;
          color: #52c41a;
        }
        .tag-orange {
          background: #fff7e6;
          color: #fa8c16;
        }
        .tag-blue {
          background: #e6f7ff;
          color: #1890ff;
        }
        .tag-gray {
          background: #f5f5f5;
          color: #8c8c8c;
        }
        .tag-red {
          background: #fff1f0;
          color: #f5222d;
        }
        .activity-info {
          padding: 16px;
        }
        .activity-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #333;
        }
        .activity-desc {
          font-size: 13px;
          color: #999;
          margin-bottom: 12px;
          height: 36px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.4;
        }
        .activity-time,
        .activity-location {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #666;
          margin-bottom: 6px;
        }
        .activity-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 12px 0;
          flex-wrap: wrap;
        }
        .activity-meta .avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .organizer-name {
          font-size: 13px;
          color: #666;
        }
        .organizer-neighborhood {
          font-size: 12px;
          color: #999;
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .activity-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }
        .activity-participants {
          color: #667eea;
          font-weight: 600;
          font-size: 14px;
        }
        .activity-stats {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #999;
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
        .pagination {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
        }
        .page-btn {
          min-width: 36px;
          height: 36px;
          padding: 0 12px;
          border: 1px solid #d9d9d9;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        .page-btn:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
        }
        .page-btn.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 768px) {
          .activity-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default Activities;
