import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { exchangeApi, authApi } from '../api';
import type { ExchangeRecordWithItem, ExchangeRecordStatus, PublicUser } from '../types';
import { useAuthStore } from '../store/authStore';

function MyExchanges() {
  const { updateUser } = useAuthStore();
  const [records, setRecords] = useState<ExchangeRecordWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ExchangeRecordStatus>('all');
  const [showConfirmCancel, setShowConfirmCancel] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showVoucherDetail, setShowVoucherDetail] = useState<ExchangeRecordWithItem | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    const res = await exchangeApi.getMyExchangeRecords();
    if (res.success) {
      setRecords(res.data || []);
    }
    const profileRes = await authApi.getProfile();
    if (profileRes.success && profileRes.data) {
      const user = profileRes.data as PublicUser;
      updateUser({ timeCoins: user.timeCoins });
    }
    setLoading(false);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCancelExchange = async (recordId: string) => {
    const res = await exchangeApi.cancelExchange(recordId);
    if (res.success) {
      showToast('success', '取消成功，时间币已退还');
      setShowConfirmCancel(null);
      loadRecords();
    } else {
      showToast('error', res.message || '取消失败');
    }
  };

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('success', '券码已复制到剪贴板');
  };

  const filteredRecords = records.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const getStatusInfo = (status: ExchangeRecordStatus) => {
    const map: Record<ExchangeRecordStatus, { label: string; color: string; icon: string }> = {
      pending: { label: '待领取/使用', color: '#faad14', icon: '⏳' },
      completed: { label: '已完成', color: '#52c41a', icon: '✅' },
      cancelled: { label: '已取消', color: '#999', icon: '❌' },
    };
    return map[status];
  };

  const statusFilters: { key: 'all' | ExchangeRecordStatus; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待处理' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' },
  ];

  const totalSpent = records
    .filter((r) => r.status !== 'cancelled')
    .reduce((sum, r) => sum + r.totalCoins, 0);

  return (
    <div className="container my-exchanges-page">
      <div className="page-header">
        <div>
          <h1>📋 我的兑换记录</h1>
          <p className="page-subtitle">查看和管理你所有的兑换记录</p>
        </div>
        <Link to="/shop" className="btn btn-primary">
          🛍️ 继续兑换
        </Link>
      </div>

      <div className="stats-cards">
        <div className="stat-card-mini">
          <span className="stat-label">累计兑换次数</span>
          <span className="stat-value">
            {records.filter((r) => r.status !== 'cancelled').length}
          </span>
        </div>
        <div className="stat-card-mini highlight">
          <span className="stat-label">累计消耗时间币</span>
          <span className="stat-value">⏰ {totalSpent}</span>
        </div>
        <div className="stat-card-mini">
          <span className="stat-label">待处理订单</span>
          <span className="stat-value">
            {records.filter((r) => r.status === 'pending').length}
          </span>
        </div>
      </div>

      <div className="filter-tabs">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="count">
              ({f.key === 'all'
                ? records.length
                : records.filter((r) => r.status === f.key).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>暂无兑换记录</p>
          <Link to="/shop" className="btn btn-primary">
            去商城看看
          </Link>
        </div>
      ) : (
        <div className="records-list">
          {filteredRecords.map((record) => {
            const statusInfo = getStatusInfo(record.status);
            return (
              <div key={record.id} className="record-card">
                <div className="record-header">
                  <span className="record-id">订单号：{record.id}</span>
                  <span
                    className="status-tag"
                    style={{ background: statusInfo.color + '20', color: statusInfo.color }}
                  >
                    {statusInfo.icon} {statusInfo.label}
                  </span>
                </div>
                <div className="record-body">
                  <div className="item-preview">
                    {record.itemImage ? (
                      <img src={record.itemImage} alt={record.itemName} />
                    ) : (
                      <div className="preview-placeholder">🎁</div>
                    )}
                  </div>
                  <div className="item-details">
                    <h3 className="item-name">{record.itemName}</h3>
                    <div className="meta-info">
                      <span>单价：⏰ {record.coinPrice}</span>
                      <span>数量：x{record.quantity}</span>
                    </div>
                    <div className="total-info">
                      <span>兑换时间：{new Date(record.createdAt).toLocaleString()}</span>
                      <span className="total-price">合计：⏰ {record.totalCoins}</span>
                    </div>
                    {record.voucherCode && record.status !== 'cancelled' && (
                      <div className="voucher-section">
                        <span className="voucher-label">🎫 券码：</span>
                        <code className="voucher-code">{record.voucherCode}</code>
                        <button
                          className="btn-link copy-btn"
                          onClick={() => copyVoucherCode(record.voucherCode!)}
                        >
                          复制
                        </button>
                        <button
                          className="btn-link detail-btn"
                          onClick={() => setShowVoucherDetail(record)}
                        >
                          查看详情
                        </button>
                      </div>
                    )}
                    {record.remark && (
                      <p className="remark">备注：{record.remark}</p>
                    )}
                    {record.redeemedAt && (
                      <p className="redeemed-time">
                        领取/使用时间：{new Date(record.redeemedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="record-footer">
                  <div className="spacer"></div>
                  {record.status === 'pending' && (
                    <button
                      className="btn btn-secondary danger"
                      onClick={() => setShowConfirmCancel(record.id)}
                    >
                      取消兑换
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showConfirmCancel && (
        <div className="modal-overlay" onClick={() => setShowConfirmCancel(null)}>
          <div className="modal small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>确认取消</h2>
              <button className="close-btn" onClick={() => setShowConfirmCancel(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>确定要取消这个兑换订单吗？</p>
              <p className="warning-text">
                ⚠️ 取消后，时间币将退回到你的账户中
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirmCancel(null)}>
                再想想
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleCancelExchange(showConfirmCancel)}
              >
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}

      {showVoucherDetail && (
        <div className="modal-overlay" onClick={() => setShowVoucherDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎫 兑换券详情</h2>
              <button className="close-btn" onClick={() => setShowVoucherDetail(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="voucher-detail-card">
                <div className="voucher-header">
                  <div className="voucher-title">{showVoucherDetail.itemName}</div>
                  <div className="voucher-coins">⏰ {showVoucherDetail.coinPrice}</div>
                </div>
                <div className="voucher-code-display">
                  <div className="code-label">券码</div>
                  <div className="code-value">{showVoucherDetail.voucherCode}</div>
                </div>
                <div className="voucher-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => copyVoucherCode(showVoucherDetail.voucherCode!)}
                  >
                    📋 复制券码
                  </button>
                </div>
                {showVoucherDetail.item?.terms && (
                  <div className="voucher-terms">
                    <h4>📖 使用说明</h4>
                    <p>{showVoucherDetail.item.terms}</p>
                  </div>
                )}
                {showVoucherDetail.item?.validDays && (
                  <div className="voucher-validity">
                    <h4>⏰ 有效期</h4>
                    <p>自兑换之日起 {showVoucherDetail.item.validDays} 天内有效</p>
                    <p>兑换时间：{new Date(showVoucherDetail.createdAt).toLocaleString()}</p>
                    {showVoucherDetail.status === 'pending' && (
                      <p className="hint">
                        请在有效期内使用此券码，向管理员出示核销
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowVoucherDetail(null)}
              >
                关闭
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
        .my-exchanges-page {
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
        }
        .page-subtitle {
          color: #666;
          font-size: 14px;
        }
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card-mini {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .stat-card-mini.highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .stat-label {
          font-size: 13px;
          color: #666;
        }
        .stat-card-mini.highlight .stat-label {
          color: rgba(255,255,255,0.8);
        }
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #333;
        }
        .stat-card-mini.highlight .stat-value {
          color: white;
        }
        .filter-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .filter-tab {
          padding: 8px 16px;
          border: none;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .filter-tab:hover {
          background: #f0f2ff;
          color: #667eea;
        }
        .filter-tab.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .filter-tab .count {
          font-size: 12px;
          opacity: 0.8;
          margin-left: 4px;
        }
        .records-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .record-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .record-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: #fafafa;
          border-bottom: 1px solid #f0f0f0;
        }
        .record-id {
          font-size: 12px;
          color: #999;
          font-family: monospace;
        }
        .status-tag {
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }
        .record-body {
          display: flex;
          gap: 16px;
          padding: 20px;
        }
        .item-preview {
          width: 100px;
          height: 100px;
          flex-shrink: 0;
          border-radius: 8px;
          overflow: hidden;
          background: linear-gradient(135deg, #f0f2ff 0%, #e0e7ff 100%);
        }
        .item-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .preview-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
        }
        .item-details {
          flex: 1;
          min-width: 0;
        }
        .item-name {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0 0 12px 0;
        }
        .meta-info {
          display: flex;
          gap: 24px;
          font-size: 13px;
          color: #666;
          margin-bottom: 8px;
        }
        .total-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #666;
          margin-bottom: 12px;
        }
        .total-price {
          font-size: 16px;
          font-weight: 600;
          color: #667eea;
        }
        .voucher-section {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding: 10px 14px;
          background: #fff7e6;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .voucher-label {
          font-size: 13px;
          color: #666;
        }
        .voucher-code {
          background: white;
          padding: 4px 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
          color: #d46b08;
          font-weight: 600;
          letter-spacing: 1px;
        }
        .btn-link {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          font-size: 13px;
          padding: 2px 6px;
        }
        .btn-link:hover {
          text-decoration: underline;
        }
        .remark {
          font-size: 13px;
          color: #666;
          margin: 8px 0 0 0;
        }
        .redeemed-time {
          font-size: 12px;
          color: #52c41a;
          margin: 8px 0 0 0;
        }
        .record-footer {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          border-top: 1px solid #f0f0f0;
        }
        .spacer {
          flex: 1;
        }
        .btn-danger {
          background: #ff4d4f !important;
        }
        .btn-danger:hover {
          background: #ff7875 !important;
        }
        .loading, .empty-state {
          text-align: center;
          padding: 60px 0;
          color: #999;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .empty-icon {
          font-size: 64px;
        }
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
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
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal.small {
          max-width: 400px;
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
          font-size: 18px;
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
        .warning-text {
          color: #fa8c16;
          background: #fffbe6;
          padding: 10px 14px;
          border-radius: 6px;
          margin: 12px 0 0 0;
          font-size: 13px;
        }
        .voucher-detail-card {
          background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
          border-radius: 12px;
          overflow: hidden;
          padding: 4px;
        }
        .voucher-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: white;
          border-radius: 8px 8px 0 0;
        }
        .voucher-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }
        .voucher-coins {
          font-size: 20px;
          font-weight: 700;
          color: #667eea;
        }
        .voucher-code-display {
          background: white;
          margin: 4px 0;
          padding: 20px;
          text-align: center;
        }
        .code-label {
          font-size: 12px;
          color: #999;
          margin-bottom: 8px;
        }
        .code-value {
          font-size: 28px;
          font-weight: 700;
          color: #d46b08;
          letter-spacing: 4px;
          font-family: monospace;
        }
        .voucher-actions {
          padding: 12px 20px;
          background: white;
          text-align: center;
        }
        .voucher-terms,
        .voucher-validity {
          padding: 16px 20px;
          background: white;
          margin-top: 4px;
        }
        .voucher-terms h4,
        .voucher-validity h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #333;
        }
        .voucher-terms p,
        .voucher-validity p {
          margin: 0 0 4px 0;
          font-size: 13px;
          color: #666;
          line-height: 1.6;
        }
        .voucher-validity .hint {
          color: #667eea;
          font-weight: 500;
          margin-top: 8px !important;
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
          .stats-cards {
            grid-template-columns: 1fr;
          }
          .record-body {
            flex-direction: column;
          }
          .item-preview {
            width: 100%;
            height: 160px;
          }
        }
      `}</style>
    </div>
  );
}

export default MyExchanges;
