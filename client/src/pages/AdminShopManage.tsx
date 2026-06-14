import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { exchangeApi } from '../api';
import type {
  ExchangeItem,
  ExchangeRecordWithItem,
  ExchangeItemCategory,
  ExchangeItemStatus,
  ExchangeRecordStatus,
} from '../types';
import { useAuthStore } from '../store/authStore';

type TabType = 'items' | 'records' | 'stats';

function AdminShopManage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [items, setItems] = useState<ExchangeItem[]>([]);
  const [records, setRecords] = useState<ExchangeRecordWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ExchangeItem | null>(null);
  const [showRestockModal, setShowRestockModal] = useState<string | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [recordFilter, setRecordFilter] = useState<'all' | ExchangeRecordStatus>('all');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'physical' as ExchangeItemCategory,
    images: [''],
    coinPrice: 0,
    stock: 0,
    status: 'active' as ExchangeItemStatus,
    terms: '',
    validDays: 30,
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'items' || activeTab === 'stats') {
        const itemsRes = await exchangeApi.getAllExchangeItems();
        if (itemsRes.success) {
          setItems(itemsRes.data || []);
        }
      }
      if (activeTab === 'records' || activeTab === 'stats') {
        const recordsRes = await exchangeApi.getAllExchangeRecords();
        if (recordsRes.success) {
          setRecords(recordsRes.data || []);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      category: 'physical',
      images: [''],
      coinPrice: 10,
      stock: 10,
      status: 'active',
      terms: '',
      validDays: 30,
    });
    setShowItemModal(true);
  };

  const openEditModal = (item: ExchangeItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      images: item.images.length > 0 ? item.images : [''],
      coinPrice: item.coinPrice,
      stock: item.stock,
      status: item.status,
      terms: item.terms || '',
      validDays: item.validDays || 30,
    });
    setShowItemModal(true);
  };

  const handleSubmitItem = async () => {
    if (!formData.name.trim()) {
      showToast('error', '请输入商品名称');
      return;
    }
    if (formData.coinPrice <= 0) {
      showToast('error', '兑换价格必须大于0');
      return;
    }

    const data = {
      ...formData,
      images: formData.images.filter((url) => url.trim()),
    };

    if (editingItem) {
      const res = await exchangeApi.updateExchangeItem(editingItem.id, data);
      if (res.success) {
        showToast('success', '商品更新成功');
        setShowItemModal(false);
        loadData();
      } else {
        showToast('error', res.message || '更新失败');
      }
    } else {
      const res = await exchangeApi.createExchangeItem(data);
      if (res.success) {
        showToast('success', '商品添加成功');
        setShowItemModal(false);
        loadData();
      } else {
        showToast('error', res.message || '添加失败');
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('确定要删除这个商品吗？此操作不可恢复。')) return;
    const res = await exchangeApi.deleteExchangeItem(id);
    if (res.success) {
      showToast('success', '删除成功');
      loadData();
    } else {
      showToast('error', res.message || '删除失败');
    }
  };

  const handleRestock = async (id: string) => {
    if (restockQuantity <= 0) {
      showToast('error', '补货数量必须大于0');
      return;
    }
    const res = await exchangeApi.restockItem(id, restockQuantity);
    if (res.success) {
      showToast('success', '补货成功');
      setShowRestockModal(null);
      setRestockQuantity(0);
      loadData();
    } else {
      showToast('error', res.message || '补货失败');
    }
  };

  const handleCompleteRecord = async (recordId: string) => {
    if (!confirm('确定要完成此兑换吗？这表示用户已领取商品或使用服务券。')) return;
    const res = await exchangeApi.completeExchange(recordId);
    if (res.success) {
      showToast('success', '已完成兑换');
      loadData();
    } else {
      showToast('error', res.message || '操作失败');
    }
  };

  const handleCancelRecord = async (recordId: string) => {
    if (!confirm('确定要取消此兑换吗？时间币将退还给用户。')) return;
    const res = await exchangeApi.cancelExchange(recordId);
    if (res.success) {
      showToast('success', '已取消兑换');
      loadData();
    } else {
      showToast('error', res.message || '操作失败');
    }
  };

  const getStatusBadge = (status: ExchangeItemStatus) => {
    const map: Record<ExchangeItemStatus, { label: string; color: string }> = {
      active: { label: '上架中', color: '#52c41a' },
      inactive: { label: '已下架', color: '#999' },
      sold_out: { label: '售罄', color: '#ff4d4f' },
    };
    const info = map[status];
    return (
      <span
        className="status-badge"
        style={{ background: info.color + '20', color: info.color }}
      >
        {info.label}
      </span>
    );
  };

  const getRecordStatusBadge = (status: ExchangeRecordStatus) => {
    const map: Record<ExchangeRecordStatus, { label: string; color: string; icon: string }> = {
      pending: { label: '待处理', color: '#faad14', icon: '⏳' },
      completed: { label: '已完成', color: '#52c41a', icon: '✅' },
      cancelled: { label: '已取消', color: '#999', icon: '❌' },
    };
    const info = map[status];
    return (
      <span
        className="record-status"
        style={{ background: info.color + '20', color: info.color }}
      >
        {info.icon} {info.label}
      </span>
    );
  };

  const filteredRecords = records.filter((r) => {
    if (recordFilter === 'all') return true;
    return r.status === recordFilter;
  });

  const stats = {
    totalItems: items.length,
    activeItems: items.filter((i) => i.status === 'active').length,
    totalRecords: records.length,
    pendingRecords: records.filter((r) => r.status === 'pending').length,
    completedRecords: records.filter((r) => r.status === 'completed').length,
    totalCoins: records
      .filter((r) => r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.totalCoins, 0),
    physicalSold: items.filter((i) => i.category === 'physical').reduce((s, i) => s + i.soldCount, 0),
    voucherSold: items.filter((i) => i.category === 'service_voucher').reduce((s, i) => s + i.soldCount, 0),
  };

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container admin-shop-page">
      <div className="page-header">
        <div>
          <h1>🏪 兑换商城管理</h1>
          <p className="page-subtitle">管理兑换商品、库存和兑换记录</p>
        </div>
      </div>

      <div className="tabs">
        {([
          { key: 'items', label: '📦 商品管理', count: items.length },
          { key: 'records', label: '📋 兑换记录', count: records.length },
          { key: 'stats', label: '📊 数据统计' },
        ] as { key: TabType; label: string; count?: number }[]).map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'items' && (
        <div className="items-section">
          <div className="section-actions">
            <button className="btn btn-primary" onClick={openAddModal}>
              ➕ 添加商品
            </button>
          </div>

          {loading ? (
            <div className="loading">加载中...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>暂无商品，点击"添加商品"开始</p>
            </div>
          ) : (
            <div className="items-table-wrap">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>分类</th>
                    <th>单价</th>
                    <th>库存</th>
                    <th>已售</th>
                    <th>状态</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="item-cell">
                          <div className="item-thumb">
                            {item.images && item.images[0] ? (
                              <img src={item.images[0]} alt="" />
                            ) : (
                              <span>{item.category === 'physical' ? '🎁' : '🎫'}</span>
                            )}
                          </div>
                          <div className="item-info">
                            <div className="item-name">{item.name}</div>
                            <div className="item-desc">{item.description.slice(0, 30)}...</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-tag">
                          {item.category === 'physical' ? '🎁 实物' : '🎫 服务券'}
                        </span>
                      </td>
                      <td className="coin-cell">⏰ {item.coinPrice}</td>
                      <td>
                        <span className={item.stock <= 5 ? 'low-stock' : ''}>
                          {item.stock}
                        </span>
                      </td>
                      <td>{item.soldCount}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td className="date-cell">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="action-btn edit"
                            onClick={() => openEditModal(item)}
                          >
                            ✏️ 编辑
                          </button>
                          <button
                            className="action-btn restock"
                            onClick={() => {
                              setShowRestockModal(item.id);
                              setRestockQuantity(0);
                            }}
                          >
                            📥 补货
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            🗑️ 删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="records-section">
          <div className="filter-row">
            {(['all', 'pending', 'completed', 'cancelled'] as const).map((f) => (
              <button
                key={f}
                className={`filter-btn ${recordFilter === f ? 'active' : ''}`}
                onClick={() => setRecordFilter(f)}
              >
                {f === 'all'
                  ? '全部'
                  : f === 'pending'
                  ? '待处理'
                  : f === 'completed'
                  ? '已完成'
                  : '已取消'}
                <span className="count">
                  ({f === 'all'
                    ? records.length
                    : records.filter((r) => r.status === f).length})
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
            </div>
          ) : (
            <div className="records-table-wrap">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>订单号</th>
                    <th>用户</th>
                    <th>商品</th>
                    <th>券码</th>
                    <th>数量</th>
                    <th>消耗时间币</th>
                    <th>状态</th>
                    <th>兑换时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="mono">{record.id.slice(0, 12)}...</td>
                      <td>
                        {record.user ? (
                          <div className="user-cell">
                            <img src={record.user.avatar} alt="" className="avatar-sm" />
                            <span>{record.user.nickname}</span>
                          </div>
                        ) : (
                          '未知用户'
                        )}
                      </td>
                      <td>
                        <div className="item-cell-mini">
                          <div className="item-thumb-sm">
                            {record.itemImage ? (
                              <img src={record.itemImage} alt="" />
                            ) : (
                              <span>🎁</span>
                            )}
                          </div>
                          <span className="item-name-sm">{record.itemName}</span>
                        </div>
                      </td>
                      <td>
                        {record.voucherCode ? (
                          <code className="voucher-code-sm">{record.voucherCode}</code>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td>x{record.quantity}</td>
                      <td className="coin-cell">⏰ {record.totalCoins}</td>
                      <td>{getRecordStatusBadge(record.status)}</td>
                      <td className="date-cell">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td>
                        {record.status === 'pending' && (
                          <div className="action-btns">
                            <button
                              className="action-btn complete"
                              onClick={() => handleCompleteRecord(record.id)}
                            >
                              ✅ 完成
                            </button>
                            <button
                              className="action-btn cancel"
                              onClick={() => handleCancelRecord(record.id)}
                            >
                              ❌ 取消
                            </button>
                          </div>
                        )}
                        {record.status !== 'pending' && (
                          <span className="muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>📦</div>
              <div>
                <div className="stat-num">{stats.totalItems}</div>
                <div className="stat-label">商品总数</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #52c41a, #38f9d7)' }}>✅</div>
              <div>
                <div className="stat-num">{stats.activeItems}</div>
                <div className="stat-label">在售商品</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #faad14, #fa709a)' }}>📋</div>
              <div>
                <div className="stat-num">{stats.totalRecords}</div>
                <div className="stat-label">总兑换次数</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>⏰</div>
              <div>
                <div className="stat-num">{stats.totalCoins}</div>
                <div className="stat-label">累计消耗时间币</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ff4d4f, #ff7875)' }}>⏳</div>
              <div>
                <div className="stat-num">{stats.pendingRecords}</div>
                <div className="stat-label">待处理订单</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #30cfd0, #43e97b)' }}>🏆</div>
              <div>
                <div className="stat-num">{stats.completedRecords}</div>
                <div className="stat-label">已完成订单</div>
              </div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <h3 className="chart-title">分类销量</h3>
              <div className="category-chart">
                <div className="bar-row">
                  <span className="bar-label">🎁 实物礼品</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${
                          stats.physicalSold + stats.voucherSold > 0
                            ? (stats.physicalSold / (stats.physicalSold + stats.voucherSold)) * 100
                            : 0
                        }%`,
                        background: '#667eea',
                      }}
                    ></div>
                  </div>
                  <span className="bar-val">{stats.physicalSold}</span>
                </div>
                <div className="bar-row">
                  <span className="bar-label">🎫 服务券</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${
                          stats.physicalSold + stats.voucherSold > 0
                            ? (stats.voucherSold / (stats.physicalSold + stats.voucherSold)) * 100
                            : 0
                        }%`,
                        background: '#52c41a',
                      }}
                    ></div>
                  </div>
                  <span className="bar-val">{stats.voucherSold}</span>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <h3 className="chart-title">库存告急商品</h3>
              <div className="low-stock-list">
                {items
                  .filter((i) => i.status === 'active' && i.stock <= 10)
                  .sort((a, b) => a.stock - b.stock)
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.id} className="low-stock-item">
                      <span className="item-name-sm">{item.name}</span>
                      <span className={`stock-num ${item.stock <= 5 ? 'danger' : 'warn'}`}>
                        剩余 {item.stock} 件
                      </span>
                    </div>
                  ))}
                {items.filter((i) => i.status === 'active' && i.stock <= 10).length === 0 && (
                  <div className="empty-tip">🎉 暂无库存告急商品</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? '编辑商品' : '添加商品'}</h2>
              <button className="close-btn" onClick={() => setShowItemModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-col">
                  <div className="form-group">
                    <label>商品名称 *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="请输入商品名称"
                    />
                  </div>
                  <div className="form-group">
                    <label>商品描述 *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="请输入商品描述"
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label>使用须知/说明</label>
                    <textarea
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      placeholder="实物礼品领取方式 / 服务券使用说明等"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="form-col">
                  <div className="form-row">
                    <div className="form-group">
                      <label>商品分类 *</label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value as ExchangeItemCategory })
                        }
                      >
                        <option value="physical">🎁 实物礼品</option>
                        <option value="service_voucher">🎫 服务券</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>商品状态</label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value as ExchangeItemStatus })
                        }
                      >
                        <option value="active">上架中</option>
                        <option value="inactive">已下架</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>兑换价格（时间币）*</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.coinPrice}
                        onChange={(e) =>
                          setFormData({ ...formData, coinPrice: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>库存数量 *</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({ ...formData, stock: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  {formData.category === 'service_voucher' && (
                    <div className="form-group">
                      <label>有效期（天）</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.validDays}
                        onChange={(e) =>
                          setFormData({ ...formData, validDays: Number(e.target.value) })
                        }
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>商品图片URL（一行一个）</label>
                    <textarea
                      value={formData.images.join('\n')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          images: e.target.value.split('\n').filter((s) => s.trim()),
                        })
                      }
                      placeholder="每行一个图片URL，可留空使用默认图标"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowItemModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSubmitItem}>
                {editingItem ? '保存修改' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestockModal && (
        <div className="modal-overlay" onClick={() => setShowRestockModal(null)}>
          <div className="modal small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📥 商品补货</h2>
              <button className="close-btn" onClick={() => setShowRestockModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>补货数量</label>
                <input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(Number(e.target.value))}
                  placeholder="请输入补货数量"
                />
              </div>
              <p className="muted-tip">补货后商品将自动上架（如之前已售罄）</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRestockModal(null)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleRestock(showRestockModal)}
              >
                确认补货
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
        .admin-shop-page {
          padding-top: 0;
        }
        .page-header {
          margin-bottom: 20px;
        }
        .page-header h1 {
          font-size: 28px;
          margin-bottom: 6px;
        }
        .page-subtitle {
          color: #666;
          font-size: 14px;
        }
        .tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: -2px;
        }
        .tab {
          padding: 12px 24px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 15px;
          color: #666;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tab:hover {
          color: #667eea;
        }
        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
          font-weight: 600;
        }
        .tab-count {
          background: #f0f2ff;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
          color: #667eea;
        }
        .tab.active .tab-count {
          background: #667eea;
          color: white;
        }
        .section-actions {
          margin-bottom: 16px;
        }
        .items-table-wrap,
        .records-table-wrap {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .items-table,
        .records-table {
          width: 100%;
          border-collapse: collapse;
        }
        .items-table th,
        .records-table th,
        .items-table td,
        .records-table td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
        }
        .items-table th,
        .records-table th {
          background: #fafafa;
          font-weight: 600;
          color: #333;
          white-space: nowrap;
        }
        .items-table tr:last-child td,
        .records-table tr:last-child td {
          border-bottom: none;
        }
        .items-table tbody tr:hover,
        .records-table tbody tr:hover {
          background: #fafbfc;
        }
        .item-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .item-thumb {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          overflow: hidden;
          background: linear-gradient(135deg, #f0f2ff, #e0e7ff);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }
        .item-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .item-info {
          min-width: 0;
        }
        .item-name {
          font-weight: 500;
          color: #333;
          margin-bottom: 2px;
        }
        .item-desc {
          font-size: 12px;
          color: #999;
        }
        .coin-cell {
          font-weight: 600;
          color: #667eea;
        }
        .low-stock {
          color: #ff4d4f !important;
          font-weight: 600;
        }
        .date-cell {
          color: #999;
          font-size: 13px;
        }
        .mono {
          font-family: monospace;
          color: #666;
        }
        .user-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .avatar-sm {
          width: 28px;
          height: 28px;
          border-radius: 50%;
        }
        .item-cell-mini {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .item-thumb-sm {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          overflow: hidden;
          background: linear-gradient(135deg, #f0f2ff, #e0e7ff);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .item-thumb-sm img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .item-name-sm {
          font-size: 13px;
          color: #333;
        }
        .voucher-code-sm {
          background: #fff7e6;
          color: #d46b08;
          padding: 2px 8px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
        }
        .muted {
          color: #ccc;
        }
        .action-btns {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .action-btn {
          padding: 4px 10px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn.edit {
          background: #e6f7ff;
          color: #1890ff;
        }
        .action-btn.edit:hover {
          background: #1890ff;
          color: white;
        }
        .action-btn.restock {
          background: #e6fffb;
          color: #13c2c2;
        }
        .action-btn.restock:hover {
          background: #13c2c2;
          color: white;
        }
        .action-btn.delete {
          background: #fff1f0;
          color: #ff4d4f;
        }
        .action-btn.delete:hover {
          background: #ff4d4f;
          color: white;
        }
        .action-btn.complete {
          background: #f6ffed;
          color: #52c41a;
        }
        .action-btn.complete:hover {
          background: #52c41a;
          color: white;
        }
        .action-btn.cancel {
          background: #fff1f0;
          color: #ff4d4f;
        }
        .action-btn.cancel:hover {
          background: #ff4d4f;
          color: white;
        }
        .filter-row {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .filter-btn {
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
        .filter-btn:hover {
          background: #f0f2ff;
          color: #667eea;
        }
        .filter-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }
        .filter-btn .count {
          opacity: 0.7;
          margin-left: 4px;
          font-size: 12px;
        }
        .stats-section .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }
        .stat-num {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin-bottom: 2px;
        }
        .stat-label {
          font-size: 13px;
          color: #999;
        }
        .charts-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .chart-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .chart-title {
          font-size: 16px;
          margin: 0 0 16px 0;
          color: #333;
        }
        .category-chart {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .bar-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bar-label {
          width: 100px;
          font-size: 14px;
          color: #666;
          flex-shrink: 0;
        }
        .bar-track {
          flex: 1;
          height: 28px;
          background: #f5f5f5;
          border-radius: 14px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 14px;
          transition: width 0.5s;
          min-width: 4px;
        }
        .bar-val {
          width: 50px;
          text-align: right;
          font-weight: 600;
          color: #333;
          flex-shrink: 0;
        }
        .low-stock-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .low-stock-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #fffbe6;
          border-radius: 8px;
        }
        .stock-num.warn {
          color: #faad14;
          font-weight: 600;
        }
        .stock-num.danger {
          color: #ff4d4f;
          font-weight: 600;
        }
        .empty-tip {
          text-align: center;
          padding: 24px;
          color: #52c41a;
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
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal.large {
          max-width: 800px;
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
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #333;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #667eea;
        }
        .muted-tip {
          font-size: 12px;
          color: #999;
          margin: 8px 0 0 0;
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
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @media (max-width: 768px) {
          .form-grid,
          .charts-row {
            grid-template-columns: 1fr;
          }
          .stats-section .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .items-table,
          .records-table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminShopManage;
