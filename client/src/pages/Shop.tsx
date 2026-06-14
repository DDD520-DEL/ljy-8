import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { exchangeApi, authApi } from '../api';
import type { ExchangeItem, ExchangeItemCategory, PublicUser } from '../types';
import { useAuthStore } from '../store/authStore';

function Shop() {
  const navigate = useNavigate();
  const { isAuthenticated, updateUser } = useAuthStore();
  const [items, setItems] = useState<ExchangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ExchangeItemCategory | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [selectedItem, setSelectedItem] = useState<ExchangeItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [exchanging, setExchanging] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [userCoins, setUserCoins] = useState(0);

  useEffect(() => {
    loadItems();
    if (isAuthenticated) {
      loadUserCoins();
    }
  }, [category, keyword, isAuthenticated]);

  const loadUserCoins = async () => {
    const res = await authApi.getProfile();
    if (res.success && res.data) {
      const user = res.data as PublicUser;
      setUserCoins(user.timeCoins || 0);
      updateUser({ timeCoins: user.timeCoins });
    }
  };

  const loadItems = async () => {
    setLoading(true);
    const res = await exchangeApi.getExchangeItems({
      category: category === 'all' ? undefined : category,
      keyword: keyword || undefined,
    });
    if (res.success) {
      setItems(res.data || []);
    }
    setLoading(false);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExchange = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!selectedItem) return;

    if (selectedItem.coinPrice * quantity > userCoins) {
      showToast('error', '时间币余额不足');
      return;
    }

    setExchanging(true);
    const res = await exchangeApi.exchangeItem({
      itemId: selectedItem.id,
      quantity,
    });
    setExchanging(false);

    if (res.success) {
      showToast('success', '兑换成功！');
      setShowModal(false);
      setQuantity(1);
      setSelectedItem(null);
      loadItems();
      loadUserCoins();
    } else {
      showToast('error', res.message || '兑换失败');
    }
  };

  const categories: { key: ExchangeItemCategory | 'all'; label: string; icon: string }[] = [
    { key: 'all', label: '全部', icon: '🛍️' },
    { key: 'physical', label: '实物礼品', icon: '🎁' },
    { key: 'service_voucher', label: '服务券', icon: '🎫' },
  ];

  const getCategoryIcon = (cat: ExchangeItemCategory) => {
    return cat === 'physical' ? '🎁' : '🎫';
  };

  const getStatusBadge = (item: ExchangeItem) => {
    if (item.status === 'sold_out' || item.stock <= 0) {
      return <span className="status-badge sold-out">已售罄</span>;
    }
    if (item.status === 'inactive') {
      return <span className="status-badge inactive">已下架</span>;
    }
    if (item.stock <= 5) {
      return <span className="status-badge low-stock">仅剩{item.stock}件</span>;
    }
    return null;
  };

  return (
    <div className="container shop-page">
      <div className="page-header">
        <div>
          <h1>⏰ 时间币兑换商城</h1>
          <p className="page-subtitle">
            用你的时间币兑换心仪的礼品和服务券
            {isAuthenticated && (
              <span className="user-coins">
                我的余额：<strong>{userCoins}</strong> ⏰
              </span>
            )}
          </p>
        </div>
        {isAuthenticated && (
          <Link to="/my-exchanges" className="btn btn-secondary">
            📋 我的兑换记录
          </Link>
        )}
      </div>

      <div className="shop-filters">
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.key}
              className={`tab-btn ${category === cat.key ? 'active' : ''}`}
              onClick={() => setCategory(cat.key)}
            >
              <span className="tab-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索商品名称..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <p>暂无兑换商品</p>
        </div>
      ) : (
        <div className="shop-grid">
          {items.map((item) => (
            <div
              key={item.id}
              className={`shop-card ${
                item.status !== 'active' || item.stock <= 0 ? 'disabled' : ''
              }`}
            >
              <div className="card-image">
                {item.images && item.images.length > 0 ? (
                  <img src={item.images[0]} alt={item.name} />
                ) : (
                  <div className="image-placeholder">{getCategoryIcon(item.category)}</div>
                )}
                {getStatusBadge(item)}
                <span className="category-tag">
                  {getCategoryIcon(item.category)} {item.category === 'physical' ? '实物' : '服务券'}
                </span>
              </div>
              <div className="card-content">
                <h3 className="card-title">{item.name}</h3>
                <p className="card-desc">{item.description}</p>
                <div className="card-footer">
                  <div className="price-info">
                    <span className="coin-price">⏰ {item.coinPrice}</span>
                    <span className="stock-info">库存: {item.stock}</span>
                  </div>
                  <button
                    className="btn btn-primary"
                    disabled={item.status !== 'active' || item.stock <= 0}
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate('/login');
                        return;
                      }
                      setSelectedItem(item);
                      setQuantity(1);
                      setShowModal(true);
                    }}
                  >
                    {item.stock <= 0 ? '已售罄' : '立即兑换'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>确认兑换</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="exchange-detail">
                <div className="exchange-item-image">
                  {selectedItem.images && selectedItem.images.length > 0 ? (
                    <img src={selectedItem.images[0]} alt={selectedItem.name} />
                  ) : (
                    <div className="image-placeholder large">
                      {getCategoryIcon(selectedItem.category)}
                    </div>
                  )}
                </div>
                <div className="exchange-item-info">
                  <h3>{selectedItem.name}</h3>
                  <p className="desc">{selectedItem.description}</p>
                  {selectedItem.terms && (
                    <div className="terms-box">
                      <strong>使用须知：</strong>
                      <p>{selectedItem.terms}</p>
                    </div>
                  )}
                  <div className="info-row">
                    <span>单价：</span>
                    <strong>⏰ {selectedItem.coinPrice}</strong>
                  </div>
                  <div className="info-row">
                    <span>当前库存：</span>
                    <strong>{selectedItem.stock} 件</strong>
                  </div>
                  <div className="info-row">
                    <span>我的余额：</span>
                    <strong className={selectedItem.coinPrice * quantity > userCoins ? 'insufficient' : ''}>
                      ⏰ {userCoins}
                    </strong>
                  </div>
                  <div className="quantity-selector">
                    <label>兑换数量：</label>
                    <div className="qty-control">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="qty-value">{quantity}</span>
                      <button
                        onClick={() =>
                          setQuantity(Math.min(selectedItem.stock, quantity + 1))
                        }
                        disabled={quantity >= selectedItem.stock}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="total-row">
                    <span>共需时间币：</span>
                    <strong className="total-price">⏰ {selectedItem.coinPrice * quantity}</strong>
                  </div>
                  {selectedItem.coinPrice * quantity > userCoins && (
                    <p className="warning-msg">⚠️ 时间币余额不足，请选择更少数量</p>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExchange}
                disabled={
                  exchanging ||
                  selectedItem.coinPrice * quantity > userCoins ||
                  quantity <= 0
                }
              >
                {exchanging ? '兑换中...' : '确认兑换'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      <style>{`
        .shop-page {
          padding-top: 0;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .page-header h1 {
          font-size: 28px;
          margin-bottom: 8px;
          color: #333;
        }
        .page-subtitle {
          color: #666;
          font-size: 14px;
        }
        .user-coins {
          margin-left: 16px;
          padding: 4px 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          font-size: 13px;
        }
        .user-coins strong {
          color: white;
        }
        .shop-filters {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .category-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border: none;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .tab-btn:hover {
          background: #f0f2ff;
          color: #667eea;
        }
        .tab-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .tab-icon {
          font-size: 16px;
        }
        .search-box {
          flex: 1;
          max-width: 320px;
        }
        .search-input {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .search-input:focus {
          border-color: #667eea;
        }
        .shop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }
        .shop-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: all 0.3s;
        }
        .shop-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .shop-card.disabled {
          opacity: 0.6;
        }
        .shop-card.disabled:hover {
          transform: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .card-image {
          position: relative;
          width: 100%;
          height: 180px;
          background: linear-gradient(135deg, #f0f2ff 0%, #e0e7ff 100%);
          overflow: hidden;
        }
        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 64px;
        }
        .image-placeholder.large {
          font-size: 96px;
        }
        .category-tag {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(255,255,255,0.95);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          color: #667eea;
          font-weight: 500;
        }
        .status-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-badge.sold-out {
          background: #ff4d4f;
          color: white;
        }
        .status-badge.inactive {
          background: #999;
          color: white;
        }
        .status-badge.low-stock {
          background: #faad14;
          color: white;
        }
        .card-content {
          padding: 16px;
        }
        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .card-desc {
          font-size: 13px;
          color: #666;
          line-height: 1.5;
          margin-bottom: 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 40px;
        }
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .price-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .coin-price {
          font-size: 20px;
          font-weight: 700;
          color: #667eea;
        }
        .stock-info {
          font-size: 12px;
          color: #999;
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
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 560px;
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
        .modal-header h2 {
          margin: 0;
          font-size: 20px;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          color: #999;
          cursor: pointer;
          line-height: 1;
        }
        .modal-body {
          padding: 24px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #f0f0f0;
        }
        .exchange-detail {
          display: flex;
          gap: 20px;
        }
        .exchange-item-image {
          width: 200px;
          flex-shrink: 0;
        }
        .exchange-item-image img,
        .exchange-item-image .image-placeholder {
          width: 100%;
          height: 200px;
          border-radius: 8px;
          overflow: hidden;
          background: linear-gradient(135deg, #f0f2ff 0%, #e0e7ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .exchange-item-image img {
          object-fit: cover;
        }
        .exchange-item-info {
          flex: 1;
          min-width: 0;
        }
        .exchange-item-info h3 {
          font-size: 18px;
          margin-bottom: 8px;
          color: #333;
        }
        .exchange-item-info .desc {
          color: #666;
          font-size: 14px;
          margin-bottom: 12px;
          line-height: 1.6;
        }
        .terms-box {
          background: #fffbe6;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 12px;
          font-size: 13px;
          color: #666;
        }
        .terms-box strong {
          color: #fa8c16;
          display: block;
          margin-bottom: 4px;
        }
        .terms-box p {
          margin: 0;
          line-height: 1.5;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          color: #666;
        }
        .info-row strong {
          color: #333;
        }
        .info-row strong.insufficient {
          color: #ff4d4f;
        }
        .quantity-selector {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-top: 1px dashed #f0f0f0;
          border-bottom: 1px dashed #f0f0f0;
          margin: 12px 0;
        }
        .quantity-selector label {
          font-size: 14px;
          color: #666;
        }
        .qty-control {
          display: flex;
          align-items: center;
          gap: 0;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
        }
        .qty-control button {
          width: 36px;
          height: 36px;
          border: none;
          background: #f5f5f5;
          cursor: pointer;
          font-size: 18px;
          color: #666;
          transition: background 0.2s;
        }
        .qty-control button:hover:not(:disabled) {
          background: #e0e7ff;
          color: #667eea;
        }
        .qty-control button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .qty-value {
          width: 48px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-left: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          font-weight: 600;
          color: #333;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          font-size: 16px;
          color: #666;
        }
        .total-price {
          font-size: 24px;
          color: #667eea;
        }
        .warning-msg {
          color: #fa8c16;
          font-size: 13px;
          margin: 0;
          padding: 8px 0;
        }
        .toast {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          z-index: 2000;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          animation: slideDown 0.3s ease;
        }
        .toast.success {
          background: #52c41a;
        }
        .toast.error {
          background: #ff4d4f;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @media (max-width: 640px) {
          .shop-filters {
            flex-direction: column;
            align-items: stretch;
          }
          .search-box {
            max-width: none;
          }
          .exchange-detail {
            flex-direction: column;
          }
          .exchange-item-image {
            width: 100%;
          }
          .exchange-item-image img,
          .exchange-item-image .image-placeholder {
            height: 180px;
          }
        }
      `}</style>
    </div>
  );
}

export default Shop;
