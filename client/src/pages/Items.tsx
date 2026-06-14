import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { itemApi } from '../api';
import type { ItemWithOwner, PaginatedResult } from '../types';

type SortOption = {
  label: string;
  value: string;
  sortBy: string;
  sortOrder: string;
};

const sortOptions: SortOption[] = [
  { label: '最新发布', value: 'latest', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: '借用热度', value: 'popular', sortBy: 'borrowCount', sortOrder: 'desc' },
  { label: '押金从高到低', value: 'deposit_high', sortBy: 'deposit', sortOrder: 'desc' },
  { label: '押金从低到高', value: 'deposit_low', sortBy: 'deposit', sortOrder: 'asc' },
];

const categories = ['all', '工具', '家电', '运动器材', '图书', '其他'];
const creditLevels = [
  { value: '', label: '不限' },
  { value: 'S', label: 'S级及以上' },
  { value: 'A', label: 'A级及以上' },
  { value: 'B', label: 'B级及以上' },
  { value: 'C', label: 'C级及以上' },
  { value: 'D', label: 'D级及以上' },
];

const depositRanges = [
  { label: '不限', min: undefined, max: undefined },
  { label: '100元以下', min: 0, max: 100 },
  { label: '100-200元', min: 100, max: 200 },
  { label: '200-500元', min: 200, max: 500 },
  { label: '500元以上', min: 500, max: undefined },
];

function Items() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<PaginatedResult<ItemWithOwner> | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const categoryParam = searchParams.get('category') || 'all';
  const sortParam = searchParams.get('sort') || 'latest';
  const minDepositParam = searchParams.get('minDeposit');
  const maxDepositParam = searchParams.get('maxDeposit');
  const minCreditLevelParam = searchParams.get('minCreditLevel') || '';
  const userNeighborhoodParam = searchParams.get('userNeighborhood') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 8;

  const currentSort = sortOptions.find(s => s.value === sortParam) || sortOptions[0];

  useEffect(() => {
    loadItems();
  }, [
    categoryParam,
    sortParam,
    minDepositParam,
    maxDepositParam,
    minCreditLevelParam,
    userNeighborhoodParam,
    pageParam,
  ]);

  const loadItems = async () => {
    setLoading(true);
    const sortConfig = sortOptions.find(s => s.value === sortParam) || sortOptions[0];
    const res = await itemApi.searchItems({
      category: categoryParam,
      keyword: keyword || undefined,
      minDeposit: minDepositParam ? Number(minDepositParam) : undefined,
      maxDeposit: maxDepositParam ? Number(maxDepositParam) : undefined,
      minCreditLevel: minCreditLevelParam || undefined,
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
    loadItems();
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

  const handleDepositRangeClick = (index: number) => {
    const range = depositRanges[index];
    updateSearchParams({
      minDeposit: range.min?.toString(),
      maxDeposit: range.max?.toString(),
      page: '1',
    });
  };

  const handleCreditLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearchParams({ minCreditLevel: e.target.value, page: '1' });
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

  const getCurrentDepositRangeIndex = () => {
    return depositRanges.findIndex(
      r =>
        (r.min?.toString() === minDepositParam || (!r.min && !minDepositParam)) &&
        (r.max?.toString() === maxDepositParam || (!r.max && !maxDepositParam))
    );
  };

  const items = result?.items || [];
  const totalPages = result?.totalPages || 1;
  const total = result?.total || 0;

  return (
    <div className="container items-page">
      <div className="page-header">
        <h1>物品共享</h1>
        <Link to="/publish/item" className="btn btn-primary">
          + 发布物品
        </Link>
      </div>

      <div className="search-section">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="搜索物品..."
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
          <span className="filter-label">押金：</span>
          <div className="filter-options">
            {depositRanges.map((range, index) => (
              <button
                key={index}
                className={`filter-option ${getCurrentDepositRangeIndex() === index ? 'active' : ''}`}
                onClick={() => handleDepositRangeClick(index)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-row">
          <span className="filter-label">信用等级：</span>
          <select
            className="filter-select"
            value={minCreditLevelParam}
            onChange={handleCreditLevelChange}
          >
            {creditLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>

          <span className="filter-label" style={{ marginLeft: '24px' }}>距离：</span>
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
        共找到 <span className="highlight">{total}</span> 件物品
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>暂无物品，快来发布第一个吧！</p>
        </div>
      ) : (
        <>
          <div className="item-grid">
            {items.map((item) => (
              <Link key={item.id} to={`/items/${item.id}`} className="item-card">
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
                  <h3 className="item-title">{item.title}</h3>
                  <p className="item-desc">{item.description}</p>
                  <div className="item-meta">
                    <img src={item.owner.avatar} alt="" className="avatar" />
                    <span className="owner-name">{item.owner.nickname}</span>
                    <span className={`credit-badge level-${item.minCreditLevel || 'B'}`}>
                      信用{item.minCreditLevel || 'B'}
                    </span>
                  </div>
                  <div className="item-footer">
                    <span className="item-price">押金 ¥{item.deposit}</span>
                    <span className="item-stats">
                      <span>👁 {item.viewCount}</span>
                      <span>🔥 {item.borrowCount || 0}</span>
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
        .items-page {
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
        .item-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }
        .item-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          text-decoration: none;
          color: inherit;
        }
        .item-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .item-image {
          position: relative;
          height: 180px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .item-placeholder {
          font-size: 56px;
        }
        .item-image .tag {
          position: absolute;
          top: 12px;
          left: 12px;
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
        .item-info {
          padding: 16px;
        }
        .item-title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .item-desc {
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
        .item-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .item-meta .avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .owner-name {
          font-size: 13px;
          color: #666;
        }
        .credit-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .credit-badge.level-S { background: #fff1f0; color: #f5222d; }
        .credit-badge.level-A { background: #fff7e6; color: #fa8c16; }
        .credit-badge.level-B { background: #f6ffed; color: #52c41a; }
        .credit-badge.level-C { background: #e6f7ff; color: #1890ff; }
        .credit-badge.level-D { background: #f5f5f5; color: #8c8c8c; }
        .item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }
        .item-price {
          color: #ff4d4f;
          font-weight: 500;
          font-size: 16px;
        }
        .item-stats {
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
          .item-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default Items;
