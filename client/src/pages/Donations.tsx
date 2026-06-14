import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { donationApi } from '../api';
import type { DonationWithDetails, PaginatedResult } from '../types';

type SortOption = {
  label: string;
  value: string;
  sortBy: string;
  sortOrder: string;
};

const sortOptions: SortOption[] = [
  { label: '最新发布', value: 'latest', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: '浏览热度', value: 'popular', sortBy: 'viewCount', sortOrder: 'desc' },
];

const categories = ['all', '工具', '家电', '运动器材', '图书', '其他'];

const statusText: Record<string, string> = {
  available: '待领取',
  pending_approval: '待确认',
  approved: '已确认',
  meeting: '待交接',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColor: Record<string, string> = {
  available: 'green',
  pending_approval: 'orange',
  approved: 'blue',
  meeting: 'purple',
  completed: 'gray',
  cancelled: 'red',
};

function Donations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<PaginatedResult<DonationWithDetails> | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const categoryParam = searchParams.get('category') || 'all';
  const sortParam = searchParams.get('sort') || 'latest';
  const userNeighborhoodParam = searchParams.get('userNeighborhood') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 8;

  useEffect(() => {
    loadDonations();
  }, [categoryParam, sortParam, userNeighborhoodParam, pageParam]);

  const loadDonations = async () => {
    setLoading(true);
    const sortConfig = sortOptions.find(s => s.value === sortParam) || sortOptions[0];
    const res = await donationApi.getDonations({
      category: categoryParam,
      keyword: keyword || undefined,
      userNeighborhood: userNeighborhoodParam || undefined,
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
    loadDonations();
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

  const handleNeighborhoodToggle = () => {
    if (userNeighborhoodParam) {
      updateSearchParams({ userNeighborhood: undefined, page: '1' });
    } else {
      updateSearchParams({ userNeighborhood: '阳光花园小区', page: '1' });
    }
  };

  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage.toString() });
  };

  const donations = result?.items || [];
  const totalPages = result?.totalPages || 1;
  const total = result?.total || 0;

  return (
    <div className="container donations-page">
      <div className="page-header">
        <h1>免费捐赠</h1>
        <Link to="/publish/donation" className="btn btn-primary">
          + 发布捐赠
        </Link>
      </div>

      <div className="search-section">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="搜索捐赠物品..."
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
          <span className="filter-label">距离：</span>
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
        共找到 <span className="highlight">{total}</span> 件捐赠物品
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : donations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎁</div>
          <p>暂无捐赠，快来发布第一个吧！</p>
        </div>
      ) : (
        <>
          <div className="donation-grid">
            {donations.map((donation) => (
              <Link key={donation.id} to={`/donations/${donation.id}`} className="donation-card">
                <div className="donation-image">
                  {donation.item.images[0] ? (
                    <img src={donation.item.images[0]} alt={donation.item.title} />
                  ) : (
                    <div className="donation-placeholder">🎁</div>
                  )}
                  <span className={`tag tag-${statusColor[donation.status]}`}>
                    {statusText[donation.status]}
                  </span>
                  <span className="donation-badge">免费</span>
                </div>
                <div className="donation-info">
                  <h3 className="donation-title">{donation.item.title}</h3>
                  <p className="donation-desc">{donation.item.description}</p>
                  <div className="donation-meta">
                    <img src={donation.donor.avatar} alt="" className="avatar" />
                    <span className="donor-name">{donation.donor.nickname}</span>
                    <span className="donor-neighborhood">{donation.donor.neighborhood}</span>
                  </div>
                  <div className="donation-footer">
                    <span className="donation-applicants">
                      {donation.applicantIds.length} 人申请
                    </span>
                    <span className="donation-stats">
                      <span>👁 {donation.item.viewCount}</span>
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
        .donations-page {
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
          background: #52c41a;
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
        .filter-option:hover {
          background: #e8e8e8;
        }
        .filter-option.active {
          background: #52c41a;
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
          color: #52c41a;
          font-weight: 600;
        }
        .donation-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }
        .donation-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          text-decoration: none;
          color: inherit;
        }
        .donation-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .donation-image {
          position: relative;
          height: 180px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .donation-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .donation-placeholder {
          font-size: 56px;
        }
        .donation-image .tag {
          position: absolute;
          top: 12px;
          left: 12px;
        }
        .donation-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #ff4d4f;
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
        .donation-info {
          padding: 16px;
        }
        .donation-title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .donation-desc {
          font-size: 14px;
          color: #999;
          margin-bottom: 12px;
          height: 40px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .donation-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .donation-meta .avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .donor-name {
          font-size: 13px;
          color: #666;
        }
        .donor-neighborhood {
          font-size: 12px;
          color: #999;
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .donation-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }
        .donation-applicants {
          color: #52c41a;
          font-weight: 500;
          font-size: 14px;
        }
        .donation-stats {
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
          border-color: #52c41a;
          color: #52c41a;
        }
        .page-btn.active {
          background: #52c41a;
          color: white;
          border-color: #52c41a;
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 768px) {
          .donation-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default Donations;
