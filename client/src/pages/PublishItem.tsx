import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemApi } from '../api';

function PublishItem() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '工具',
    deposit: 0,
    borrowRules: '',
    maxBorrowDays: 7,
    images: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = ['工具', '家电', '运动器材', '图书', '其他'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await itemApi.createItem(formData);
      if (res.success) {
        alert('发布成功！');
        navigate('/items');
      } else {
        setError(res.message || '发布失败');
      }
    } catch (err: any) {
      setError(err.message || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container publish-page">
      <div className="page-header">
        <h1>发布闲置物品</h1>
      </div>

      <div className="form-card">
        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">物品名称 *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入物品名称"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">物品分类 *</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">押金（元）*</label>
              <input
                type="number"
                className="form-input"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">最长借用天数 *</label>
              <input
                type="number"
                className="form-input"
                value={formData.maxBorrowDays}
                onChange={(e) => setFormData({ ...formData, maxBorrowDays: Number(e.target.value) })}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">物品描述 *</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="详细描述物品的情况、使用注意事项等"
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">借用规则 *</label>
            <textarea
              className="form-textarea"
              value={formData.borrowRules}
              onChange={(e) => setFormData({ ...formData, borrowRules: e.target.value })}
              placeholder="借用时需要遵守的规则，如损坏赔偿、清洁要求等"
              rows={3}
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '发布中...' : '立即发布'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .publish-page {
          max-width: 700px;
          margin: 0 auto;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 28px;
        }
        .form-card {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }
        .error-alert {
          background: #fff1f0;
          color: #ff4d4f;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #f0f0f0;
        }
        @media (max-width: 768px) {
          .form-card {
            padding: 20px;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default PublishItem;
