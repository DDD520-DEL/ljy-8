import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { itemApi } from '../api';
import type { ItemWithOwner } from '../types';

function Items() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<ItemWithOwner[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const categoryParam = searchParams.get('category') || 'all';
  const categories = ['all', '工具', '家电', '运动器材', '图书', '其他'];

  useEffect(() => {
    loadItems();
  }, [categoryParam]);

  const loadItems = async () => {
    setLoading(true);
    const res = await itemApi.getItems({
      category: categoryParam,
      keyword: keyword || undefined,
    });
    if (res.success) {
      setItems(res.data || []);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadItems();
  };

  const handleCategoryClick = (cat: string) => {
    setSearchParams({ category: cat });
  };

  return (
    <div className="container items-page">
      <div className="page-header">
        <h1>物品共享</h1>
        <Link to="/publish/item" className="btn btn-primary">
          + 发布物品
        </Link>
      </div>

      <div className="filter-bar">
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

      {loading ? (
        <div className="loading">加载中...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>暂无物品，快来发布第一个吧！</p>
        </div>
      ) : (
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
                </div>
                <div className="item-footer">
                  <span className="item-price">押金 ¥{item.deposit}</span>
                  <span className="item-views">👁 {item.viewCount}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
        .filter-bar {
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
        .category-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .category-tab {
          padding: 8px 20px;
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .category-tab:hover {
          border-color: #667eea;
          color: #667eea;
        }
        .category-tab.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }
        .item-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .item-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
        }
        .item-meta .avatar {
          width: 24px;
          height: 24px;
        }
        .owner-name {
          font-size: 13px;
          color: #666;
        }
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
        .item-views {
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
