import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { demandApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { CreateDemandRequest, DemandType } from '../types';

const itemCategories = ['工具', '家电', '运动器材', '图书', '其他'];
const serviceCategories = ['搬运服务', '维修服务', '家政服务', '教学辅导', '其他'];

const typeOptions = [
  { value: 'item', label: '物品需求' },
  { value: 'service', label: '服务需求' },
];

const urgencyOptions = [
  { value: 'normal', label: '普通' },
  { value: 'urgent', label: '紧急' },
  { value: 'very_urgent', label: '非常紧急' },
];

function PublishDemand() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DemandType>('item');
  const [category, setCategory] = useState('');
  const [timeCoinReward, setTimeCoinReward] = useState<number>(0);
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'very_urgent'>('normal');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editId) {
      loadDemandForEdit();
    }
  }, [editId]);

  const loadDemandForEdit = async () => {
    if (!editId) return;
    const res = await demandApi.getDemandById(editId);
    if (res.success && res.data) {
      const demand = res.data;
      if (demand.requesterId !== user?.id) {
        alert('无权限编辑此需求');
        navigate('/demands');
        return;
      }
      setTitle(demand.title);
      setDescription(demand.description);
      setType(demand.type);
      setCategory(demand.category);
      setTimeCoinReward(demand.timeCoinReward);
      setUrgency(demand.urgency);
      setContactPhone(demand.contactPhone || '');
      setContactAddress(demand.contactAddress || '');
      setValidUntil(demand.validUntil || '');
    }
  };

  const currentCategories = type === 'service' ? serviceCategories : itemCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category) {
      alert('请填写完整信息');
      return;
    }
    if (timeCoinReward < 0) {
      alert('时间币报酬不能为负数');
      return;
    }
    if (user && timeCoinReward > (user.timeCoins || 0)) {
      alert(`您的时间币不足（当前余额: ${user.timeCoins || 0}）`);
      return;
    }

    setSubmitting(true);
    const data: CreateDemandRequest = {
      title: title.trim(),
      description: description.trim(),
      type,
      category,
      timeCoinReward,
      urgency,
      contactPhone: contactPhone.trim() || undefined,
      contactAddress: contactAddress.trim() || undefined,
      validUntil: validUntil || undefined,
    };

    try {
      let res;
      if (editId) {
        res = await demandApi.updateDemand(editId, data);
      } else {
        res = await demandApi.createDemand(data);
      }
      if (res.success) {
        alert(editId ? '更新成功！' : '发布成功！');
        navigate(editId ? `/demands/${editId}` : '/demands');
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container publish-demand-page">
      <Link to="/demands" className="back-link">← 返回需求广场</Link>

      <div className="publish-card">
        <h1 className="page-title">{editId ? '编辑需求' : '发布需求'}</h1>

        <form onSubmit={handleSubmit} className="publish-form">
          <div className="form-section">
            <h3 className="section-title">基本信息</h3>

            <div className="form-group">
              <label>需求类型 *</label>
              <div className="type-radios">
                {typeOptions.map((opt) => (
                  <label key={opt.value} className={`type-radio ${type === opt.value ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value={opt.value}
                      checked={type === opt.value}
                      onChange={(e) => {
                        setType(e.target.value as DemandType);
                        setCategory('');
                      }}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>标题 *</label>
              <input
                type="text"
                className="form-control"
                placeholder="简洁描述您的需求，如：急需一个冲击钻"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
                required
              />
              <span className="char-count">{title.length}/50</span>
            </div>

            <div className="form-group">
              <label>分类 *</label>
              <div className="category-options">
                {currentCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-option ${category === cat ? 'active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>详细描述 *</label>
              <textarea
                className="form-control"
                rows={6}
                placeholder="请详细描述您的需求，包括：用途、使用时间、特殊要求等"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                required
              />
              <span className="char-count">{description.length}/1000</span>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">报酬设置</h3>

            <div className="form-row">
              <div className="form-group">
                <label>时间币报酬 *</label>
                <div className="reward-input-wrapper">
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    value={timeCoinReward}
                    onChange={(e) => setTimeCoinReward(Number(e.target.value) || 0)}
                    required
                  />
                  <span className="reward-unit">时间币</span>
                </div>
                <p className="form-hint">
                  当前余额: <strong>{user?.timeCoins || 0}</strong> 时间币
                </p>
              </div>

              <div className="form-group">
                <label>紧急程度</label>
                <select
                  className="form-control"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                >
                  {urgencyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>有效期至</label>
              <input
                type="datetime-local"
                className="form-control"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
              <p className="form-hint">
                可选，设置需求的有效截止时间，过期后需求将自动失效
              </p>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">联系方式</h3>

            <div className="form-group">
              <label>联系电话</label>
              <input
                type="tel"
                className="form-control"
                placeholder="可选，方便响应者联系您"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>联系地址</label>
              <input
                type="text"
                className="form-control"
                placeholder="可选，如：阳光花园小区3号楼502"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? '提交中...' : (editId ? '保存修改' : '发布需求')}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .publish-demand-page {
          max-width: 800px;
          margin: 0 auto;
          padding-top: 0;
        }
        .back-link {
          display: inline-block;
          margin-bottom: 20px;
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
        }
        .back-link:hover {
          text-decoration: underline;
        }
        .publish-card {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .page-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }
        .form-section {
          margin-bottom: 28px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          padding-left: 8px;
          border-left: 3px solid #667eea;
        }
        .form-group {
          margin-bottom: 20px;
          position: relative;
        }
        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #333;
        }
        .form-group .form-control {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
          box-sizing: border-box;
          transition: all 0.2s;
        }
        .form-group .form-control:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }
        .char-count {
          position: absolute;
          right: 0;
          bottom: -20px;
          font-size: 12px;
          color: #999;
        }
        .form-hint {
          margin: 8px 0 0;
          font-size: 12px;
          color: #999;
        }
        .form-hint strong {
          color: #667eea;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .type-radios {
          display: flex;
          gap: 12px;
        }
        .type-radio {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border: 2px solid #f0f0f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }
        .type-radio:hover {
          border-color: #667eea;
        }
        .type-radio.active {
          border-color: #667eea;
          background: #f0f2ff;
          color: #667eea;
          font-weight: 500;
        }
        .type-radio input[type="radio"] {
          display: none;
        }
        .category-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .category-option {
          padding: 8px 20px;
          background: #f5f5f5;
          border: none;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .category-option:hover {
          background: #e8e8e8;
        }
        .category-option.active {
          background: #667eea;
          color: white;
        }
        .reward-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .reward-input-wrapper .form-control {
          flex: 1;
        }
        .reward-unit {
          font-size: 14px;
          color: #666;
          white-space: nowrap;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid #f0f0f0;
        }
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          .type-radios {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default PublishDemand;
