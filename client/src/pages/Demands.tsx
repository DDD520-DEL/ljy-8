import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { demandApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { DemandWithDetails, PaginatedResult } from '../types';

type SortOption = {
  label: string;
  value: string;
  sortBy: string;
  sortOrder: string;
};

const sortOptions: SortOption[] = [
  { label: '最新发布', value: 'latest', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: '报酬最高', value: 'reward_high', sortBy: 'timeCoinReward', sortOrder: 'desc' },
  { label: '浏览热度', value: 'popular', sortBy: 'viewCount', sortOrder: 'desc' },
  { label: '紧急程度', value: 'urgent', sortBy: 'urgency', sortOrder: 'desc' },
];

const typeOptions = [
  { value: 'all', label: '全部' },
  { value: 'item', label: '物品需求' },
  { value: 'service', label: '服务需求' },
];

const itemCategories = ['all', '工具', '家电', '运动器材', '图书', '其他'];
const serviceCategories = ['all', '搬运服务', '维修服务', '家政服务', '教学辅导', '其他'];

const urgencyOptions = [
  { value: 'all', label: '全部' },
  { value: 'very_urgent', label: '非常紧急' },
  { value: 'urgent', label: '紧急' },
  { value: 'normal', label: '普通' },
];

const statusText: Record<string, string> = {
  open: '接受响应',
  responding: '有响应中',
  confirmed: '已确认',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColor: Record<string, string> = {
  open: 'green',
  responding: 'orange',
  confirmed: 'blue',
  in_progress: 'purple',
  completed: 'gray',
  cancelled: 'red',
};

const urgencyText: Record<string, string> = {
  normal: '普通',
  urgent: '紧急',
  very_urgent: '非常紧急',
};

const urgencyColor: Record<string, string> = {
  normal: 'gray',
  urgent: 'orange',
  very_urgent: 'red',
};

function Demands() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<PaginatedResult<DemandWithDetails> | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const { user } = useAuthStore();

  const typeParam = searchParams.get('type') || 'all';
  const categoryParam = searchParams.get('category') || 'all';
  const sortParam = searchParams.get('sort') || 'latest';
  const urgencyParam = searchParams.get('urgency') || 'all';
  const userNeighborhoodParam = searchParams.get('userNeighborhood') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 8;

  const currentCategories = typeParam === 'service' ? serviceCategories : itemCategories;

  useEffect(() => {
    loadDemands();
  }, [typeParam, categoryParam, sortParam, urgencyParam, userNeighborhoodParam, pageParam]);

  const loadDemands = async () => {
    setLoading(true);
    const sortConfig = sortOptions.find(s => s.value === sortParam) || sortOptions[0];
    const res = await demandApi.getDemands({
      type: typeParam === 'all' ? undefined : typeParam,
      category: categoryParam === 'all' ? undefined : categoryParam,
      keyword: keyword || undefined,
      userNeighborhood: userNeighborhoodParam || undefined,
      urgency: urgencyParam === 'all' ? undefined : urgencyParam,
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
    loadDemands();
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

  const handleTypeChange = (type: string) => {
    updateSearchParams({ type, category: 'all', page: '1' });
  };

  const handleCategoryClick = (cat: string) => {
    updateSearchParams({ category: cat, page: '1' });
  };

  const handleUrgencyClick = (urg: string) => {
    updateSearchParams({ urgency: urg, page: '1' });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearchParams({ sort: e.target.value, page: '1' });
  };

  const handleNeighborhoodToggle = () => {
    if (userNeighborhoodParam) {
      updateSearchParams({ userNeighborhood: undefined, page: '1' });
    } else if (user?.neighborhood) {
      updateSearchParams({ userNeighborhood: user.neighborhood, page: '1' });
    } else {
      alert('请先登录后使用同小区过滤功能');
    }
  };

  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage.toString() });
  };

  const demands = result?.items || [];
  const totalPages = result?.totalPages || 1;
  const total = result?.total || 0;

  return (
    <div className="container demands-page">
      <div className="page-header">
        <h1>需求广场</h1>
        <Link to="/publish/demand" className="btn btn-primary">
          + 发布需求
        </Link>
      </div>

      <div className="search-section">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="搜索需求物品或服务..."
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
          <span className="filter-label">类型：</span>
          <div className="category-tabs">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                className={`category-tab ${typeParam === opt.value ? 'active' : ''}`}
                onClick={() => handleTypeChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-row">
          <span className="filter-label">分类：</span>
          <div className="category-tabs">
            {currentCategories.map((cat) => (
              <button
                key={cat}
                className={`category-tab ${categoryParam === cat ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat === 'all' ? '全部' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-row">
          <span className="filter-label">紧急度：</span>
          <div className="category-tabs">
            {urgencyOptions.map((opt) => (
              <button
                key={opt.value}
                className={`category-tab ${urgencyParam === opt.value ? 'active' : ''}`}
                onClick={() => handleUrgencyClick(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <span className="filter-label" style={{ marginLeft: '20px' }}>距离：</span>
          <button
            className={`filter-option ${userNeighborhoodParam ? 'active' : ''}`}
            onClick={handleNeighborhoodToggle}
          >
            同小区
          </button>

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
        共找到 <span className="highlight">{total}</span> 条需求
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : demands.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <p>暂无需求，快来发布第一个吧！</p>
        </div>
      ) : (
        <>
          <div className="demand-grid">
            {demands.map((demand) => (
              <Link key={demand.id} to={`/demands/${demand.id}`} className="demand-card">
                <div className="demand-header">
                  <div className="demand-type-badge">
                    {demand.type === 'item' ? '🔧 物品' : '🛠️ 服务'}
                  </div>
                  <span className={`tag tag-${statusColor[demand.status]}`}>
                    {statusText[demand.status]}
                  </span>
                  <span className={`urgency-tag urgency-${urgencyColor[demand.urgency]}`}>
                    {urgencyText[demand.urgency]}
                  </span>
                </div>
                <div className="demand-info">
                  <h3 className="demand-title">{demand.title}</h3>
                  <p className="demand-desc">{demand.description}</p>
                  <div className="demand-category-tag">{demand.category}</div>
                  <div className="demand-meta">
                    <img src={demand.requester.avatar} alt="" className="avatar" />
                    <span className="requester-name">{demand.requester.nickname}</span>
                    <span className="requester-neighborhood">{demand.requester.neighborhood}</span>
                  </div>
                  <div className="demand-footer">
                    <span className="demand-reward">
                      ⏰ {demand.timeCoinReward} 时间币
                    </span>
                    <span className="demand-stats">
                      <span>👁 {demand.viewCount}</span>
                      <span>💬 {demand.responses.filter(r => r.status === 'pending' || r.status === 'accepted').length}</span>
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
        .demands-page {
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
        .filter-option {
          padding: 6px 14px;
          background: #f5f5f5;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-option:hover {
          background: #e8e8e8;
        }
        .filter-option.active {
          background: #667eea;
          color: white;
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
        .demand-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }
        .demand-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
        }
        .demand-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .demand-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fafafa;
          border-bottom: 1px solid #f0f0f0;
          flex-wrap: wrap;
        }
        .demand-type-badge {
          font-size: 12px;
          font-weight: 500;
          color: #667eea;
          background: #f0f2ff;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .tag {
          padding: 2px 8px;
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
        .tag-purple {
          background: #f9f0ff;
          color: #722ed1;
        }
        .tag-gray {
          background: #f5f5f5;
          color: #8c8c8c;
        }
        .tag-red {
          background: #fff1f0;
          color: #f5222d;
        }
        .urgency-tag {
          margin-left: auto;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .urgency-gray {
          background: #f5f5f5;
          color: #8c8c8c;
        }
        .urgency-orange {
          background: #fff7e6;
          color: #fa8c16;
        }
        .urgency-red {
          background: #fff1f0;
          color: #f5222d;
        }
        .demand-info {
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .demand-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .demand-desc {
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
          height: 42px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          flex: 1;
        }
        .demand-category-tag {
          display: inline-block;
          font-size: 12px;
          color: #666;
          background: #f5f5f5;
          padding: 2px 8px;
          border-radius: 4px;
          margin-bottom: 12px;
          align-self: flex-start;
        }
        .demand-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .demand-meta .avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .requester-name {
          font-size: 13px;
          color: #666;
        }
        .requester-neighborhood {
          font-size: 12px;
          color: #999;
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .demand-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }
        .demand-reward {
          color: #fa8c16;
          font-weight: 600;
          font-size: 14px;
        }
        .demand-stats {
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
          .demand-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default Demands;
