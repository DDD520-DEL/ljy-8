import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { donationApi, itemApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { ItemWithOwner } from '../types';

function PublishDonation() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [myItems, setMyItems] = useState<ItemWithOwner[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [donorNotes, setDonorNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItemForm, setNewItemForm] = useState({
    title: '',
    description: '',
    category: '工具',
    images: [] as string[],
  });

  const categories = ['工具', '家电', '运动器材', '图书', '其他'];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadMyItems();
  }, [isAuthenticated]);

  const loadMyItems = async () => {
    setLoading(true);
    const res = await itemApi.getMyItems();
    if (res.success) {
      const availableItems = (res.data || []).filter(
        (item: ItemWithOwner) => item.status === 'available' && !item.isDonation
      );
      setMyItems(availableItems);
    }
    setLoading(false);
  };

  const handleSubmitSelect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      setError('请选择要捐赠的物品');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await donationApi.createDonation({
        itemId: selectedItemId,
        donorNotes: donorNotes || undefined,
      });
      if (res.success) {
        alert('捐赠发布成功！');
        navigate(`/donations/${res.data.id}`);
      } else {
        setError(res.message || '发布失败');
      }
    } catch (err: any) {
      setError(err.message || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const itemRes = await itemApi.createItem({
        ...newItemForm,
        deposit: 0,
        borrowRules: '免费捐赠物品',
        maxBorrowDays: 30,
        isDonation: true,
      });
      if (!itemRes.success) {
        setError(itemRes.message || '创建物品失败');
        return;
      }

      const donationRes = await donationApi.createDonation({
        itemId: itemRes.data.id,
        donorNotes: donorNotes || undefined,
      });
      if (donationRes.success) {
        alert('捐赠发布成功！');
        navigate(`/donations/${donationRes.data.id}`);
      } else {
        setError(donationRes.message || '发布失败');
      }
    } catch (err: any) {
      setError(err.message || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container publish-donation-page">
      <div className="page-header">
        <h1>发布免费捐赠</h1>
        <Link to="/donations" className="btn btn-default">
          ← 返回列表
        </Link>
      </div>

      <div className="mode-tabs">
        <button
          className={`mode-tab ${mode === 'select' ? 'active' : ''}`}
          onClick={() => setMode('select')}
        >
          选择已有物品
        </button>
        <button
          className={`mode-tab ${mode === 'create' ? 'active' : ''}`}
          onClick={() => setMode('create')}
        >
          创建新物品
        </button>
      </div>

      <div className="form-card">
        {error && <div className="error-alert">{error}</div>}

        {mode === 'select' ? (
          <form onSubmit={handleSubmitSelect}>
            <div className="form-group">
              <label className="form-label">选择要捐赠的物品 *</label>
              {loading ? (
                <div className="loading">加载中...</div>
              ) : myItems.length === 0 ? (
                <div className="empty-state">
                  <p>您还没有可捐赠的闲置物品</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setMode('create')}
                  >
                    创建新物品
                  </button>
                </div>
              ) : (
                <div className="items-select-list">
                  {myItems.map((item) => (
                    <label
                      key={item.id}
                      className={`item-select-card ${selectedItemId === item.id ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="itemId"
                        value={item.id}
                        checked={selectedItemId === item.id}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        style={{ display: 'none' }}
                      />
                      <div className="item-select-image">
                        {item.images[0] ? (
                          <img src={item.images[0]} alt={item.title} />
                        ) : (
                          <div className="item-placeholder">📦</div>
                        )}
                      </div>
                      <div className="item-select-info">
                        <h4 className="item-title">{item.title}</h4>
                        <p className="item-desc">{item.description}</p>
                        <span className="item-category">{item.category}</span>
                      </div>
                      <div className="item-select-check">
                        {selectedItemId === item.id && <span>✓</span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">捐赠备注（可选）</label>
              <textarea
                className="form-textarea"
                value={donorNotes}
                onChange={(e) => setDonorNotes(e.target.value)}
                placeholder="可以写一些关于物品的特别说明，或者对受赠者的寄语等"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting || loading || myItems.length === 0}
              >
                {submitting ? '发布中...' : '发布捐赠'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitCreate}>
            <div className="form-group">
              <label className="form-label">物品名称 *</label>
              <input
                type="text"
                className="form-input"
                value={newItemForm.title}
                onChange={(e) => setNewItemForm({ ...newItemForm, title: e.target.value })}
                placeholder="请输入物品名称"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">物品分类 *</label>
              <select
                className="form-select"
                value={newItemForm.category}
                onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">物品描述 *</label>
              <textarea
                className="form-textarea"
                value={newItemForm.description}
                onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
                placeholder="详细描述物品的新旧程度、功能状况等"
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">捐赠备注（可选）</label>
              <textarea
                className="form-textarea"
                value={donorNotes}
                onChange={(e) => setDonorNotes(e.target.value)}
                placeholder="可以写一些关于物品的特别说明，或者对受赠者的寄语等"
                rows={3}
              />
            </div>

            <div className="form-notice">
              <p>🎁 温馨提示：</p>
              <ul>
                <li>捐赠物品将免费赠送给有需要的邻居</li>
                <li>请确保物品可以正常使用</li>
                <li>捐赠完成后，您和受赠者都将获得信用分奖励</li>
              </ul>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting}
              >
                {submitting ? '发布中...' : '发布捐赠'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .publish-donation-page {
          padding-top: 0;
          max-width: 720px;
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
        .mode-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          background: #f5f5f5;
          padding: 4px;
          border-radius: 8px;
        }
        .mode-tab {
          flex: 1;
          padding: 12px 24px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mode-tab:hover {
          background: #e8e8e8;
        }
        .mode-tab.active {
          background: #52c41a;
          color: white;
        }
        .form-card {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .error-alert {
          background: #fff1f0;
          color: #f5222d;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        .form-group {
          margin-bottom: 24px;
        }
        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #333;
        }
        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #52c41a;
        }
        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }
        .items-select-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
          padding: 8px;
          background: #fafafa;
          border-radius: 8px;
        }
        .item-select-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: white;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .item-select-card:hover {
          border-color: #d9d9d9;
        }
        .item-select-card.selected {
          border-color: #52c41a;
          background: #f6ffed;
        }
        .item-select-image {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .item-select-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .item-placeholder {
          font-size: 32px;
        }
        .item-select-info {
          flex: 1;
          min-width: 0;
        }
        .item-title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .item-desc {
          font-size: 13px;
          color: #999;
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .item-category {
          font-size: 12px;
          color: #52c41a;
          background: #f6ffed;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .item-select-check {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #52c41a;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
        }
        .empty-state {
          text-align: center;
          padding: 40px 0;
          color: #999;
        }
        .empty-state p {
          margin-bottom: 16px;
        }
        .form-notice {
          background: #f6ffed;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 24px;
        }
        .form-notice p {
          font-weight: 500;
          color: #52c41a;
          margin-bottom: 8px;
        }
        .form-notice ul {
          margin: 0;
          padding-left: 20px;
          color: #666;
          font-size: 13px;
          line-height: 1.8;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 24px;
          border-top: 1px solid #f0f0f0;
        }
        .btn-default {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #d9d9d9;
          padding: 8px 16px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 14px;
          cursor: pointer;
        }
        .btn-default:hover {
          background: #e8e8e8;
        }
        .btn-lg {
          padding: 12px 32px;
          font-size: 16px;
        }
        .btn-primary {
          background: #52c41a;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-primary:hover:not(:disabled) {
          background: #73d13d;
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .loading {
          text-align: center;
          padding: 40px 0;
          color: #999;
        }
      `}</style>
    </div>
  );
}

export default PublishDonation;
