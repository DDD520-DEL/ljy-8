import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { activityApi } from '../api';
import { useAuthStore } from '../store/authStore';

const categoryOptions = [
  { value: 'sports', label: '体育运动', icon: '⚽' },
  { value: 'culture', label: '文化艺术', icon: '🎨' },
  { value: 'education', label: '亲子教育', icon: '📚' },
  { value: 'social', label: '社交聚会', icon: '🍻' },
  { value: 'other', label: '其他', icon: '📌' },
];

const defaultImages: Record<string, string> = {
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop',
  culture: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=400&fit=crop',
  education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop',
  social: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop',
  other: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
};

function PublishActivity() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'sports',
    images: [] as string[],
    location: '',
    startTime: '',
    endTime: '',
    maxParticipants: 10,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const defaultImage = defaultImages['sports'];
    setForm((prev) => ({ ...prev, images: [defaultImage] }));
  }, [isAuthenticated]);

  const handleCategoryChange = (category: string) => {
    setForm((prev) => ({
      ...prev,
      category,
      images: prev.images.length > 0 ? prev.images : [defaultImages[category] || ''],
    }));
  };

  const handleAddImage = () => {
    if (!imageUrl) {
      alert('请输入图片链接');
      return;
    }
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, imageUrl],
    }));
    setImageUrl('');
    setShowImageInput(false);
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    return now.toISOString().slice(0, 16);
  };

  const getMinEndTime = () => {
    if (!form.startTime) return getMinDateTime();
    const start = new Date(form.startTime);
    start.setMinutes(start.getMinutes() + 30);
    return start.toISOString().slice(0, 16);
  };

  const validate = () => {
    if (!form.title.trim()) {
      setError('请输入活动标题');
      return false;
    }
    if (form.title.length < 2) {
      setError('活动标题至少2个字符');
      return false;
    }
    if (!form.description.trim()) {
      setError('请输入活动描述');
      return false;
    }
    if (form.description.length < 10) {
      setError('活动描述至少10个字符');
      return false;
    }
    if (!form.location.trim()) {
      setError('请输入活动地点');
      return false;
    }
    if (!form.startTime) {
      setError('请选择活动开始时间');
      return false;
    }
    if (!form.endTime) {
      setError('请选择活动结束时间');
      return false;
    }
    if (new Date(form.startTime) <= new Date()) {
      setError('活动开始时间必须晚于当前时间');
      return false;
    }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      setError('活动结束时间必须晚于开始时间');
      return false;
    }
    if (form.maxParticipants < 2) {
      setError('活动人数上限至少为2人');
      return false;
    }
    if (form.maxParticipants > 100) {
      setError('活动人数上限不能超过100人');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await activityApi.createActivity({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        images: form.images,
        location: form.location.trim(),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        maxParticipants: form.maxParticipants,
      });
      if (res.success) {
        alert('活动发布成功！');
        navigate(`/activities/${res.data.id}`);
      } else {
        setError(res.message || '发布失败');
      }
    } catch (err: any) {
      setError(err.message || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container publish-page">
      <div className="page-header">
        <Link to="/activities" className="back-link">
          ← 返回活动列表
        </Link>
        <h1>发布邻里活动</h1>
      </div>

      <div className="publish-content">
        <div className="publish-main">
          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="form-group">
                <label>
                  活动标题 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="例如：周末羽毛球友谊赛、亲子读书会"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={50}
                />
                <div className="form-hint">{form.title.length}/50 字</div>
              </div>

              <div className="form-group">
                <label>
                  活动分类 <span className="required">*</span>
                </label>
                <div className="category-grid">
                  {categoryOptions.map((cat) => (
                    <div
                      key={cat.value}
                      className={`category-item ${form.category === cat.value ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(cat.value)}
                    >
                      <span className="category-icon">{cat.icon}</span>
                      <span className="category-name">{cat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>活动图片</label>
                <div className="image-preview-list">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="image-preview-item">
                      <img src={img} alt={`活动图片${idx + 1}`} />
                      <button
                        type="button"
                        className="image-remove"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {form.images.length < 5 && (
                    <>
                      {showImageInput ? (
                        <div className="image-input-item">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="输入图片URL"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                          />
                          <div className="image-input-actions">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={handleAddImage}
                            >
                              添加
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setShowImageInput(false);
                                setImageUrl('');
                              }}
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="image-add-btn"
                          onClick={() => setShowImageInput(true)}
                        >
                          <span className="plus-icon">+</span>
                          <span>添加图片</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="form-hint">最多上传5张图片，建议尺寸 800×400</div>
              </div>

              <div className="form-group">
                <label>
                  活动描述 <span className="required">*</span>
                </label>
                <textarea
                  className="form-control"
                  placeholder="详细介绍活动内容、注意事项、联系方式等..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={6}
                  maxLength={2000}
                />
                <div className="form-hint">{form.description.length}/2000 字</div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    活动地点 <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="例如：小区东门羽毛球场、社区活动室"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    maxLength={100}
                  />
                </div>
                <div className="form-group">
                  <label>
                    人数上限 <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="请输入"
                    value={form.maxParticipants}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxParticipants: Math.max(2, Math.min(100, parseInt(e.target.value) || 2)),
                      })
                    }
                    min={2}
                    max={100}
                  />
                  <div className="form-hint">2-100人</div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    开始时间 <span className="required">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={form.startTime}
                    onChange={(e) => {
                      setForm({ ...form, startTime: e.target.value });
                      if (
                        form.endTime &&
                        new Date(e.target.value) >= new Date(form.endTime)
                      ) {
                        const newEnd = new Date(e.target.value);
                        newEnd.setMinutes(newEnd.getMinutes() + 60);
                        setForm((prev) => ({
                          ...prev,
                          endTime: newEnd.toISOString().slice(0, 16),
                        }));
                      }
                    }}
                    min={getMinDateTime()}
                  />
                </div>
                <div className="form-group">
                  <label>
                    结束时间 <span className="required">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    min={getMinEndTime()}
                  />
                </div>
              </div>

              {form.startTime && form.endTime && (
                <div className="time-preview">
                  <span className="preview-label">活动时长预览：</span>
                  <span className="preview-value">
                    {formatDateTime(form.startTime)} - {formatDateTime(form.endTime)}
                  </span>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/activities')}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? '发布中...' : '发布活动'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="publish-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-title">发布须知</div>
            <ul className="notice-list">
              <li>请确保活动内容积极健康，符合社区规范</li>
              <li>活动时间必须设置在当前时间之后</li>
              <li>请填写准确的活动地点，方便其他用户参加</li>
              <li>成功组织活动可获得5信用分奖励</li>
              <li>活动结束后请及时标记完成，参与者可获得积分</li>
              <li>如需取消活动，请提前通知报名用户</li>
            </ul>
          </div>

          <div className="sidebar-card">
            <div className="sidebar-title">信用积分说明</div>
            <div className="credit-info">
              <div className="credit-item">
                <span className="credit-label">组织者</span>
                <span className="credit-value">+5 分</span>
              </div>
              <div className="credit-item">
                <span className="credit-label">参与者</span>
                <span className="credit-value">+3 分</span>
              </div>
              <div className="credit-item">
                <span className="credit-label">上传照片</span>
                <span className="credit-value">+1 分</span>
              </div>
            </div>
            <div className="user-credit">
              当前信用分：<strong>{user?.creditScore || 0}</strong> 分
              <span className="credit-level">({user?.creditLevel || '新用户'})</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .publish-page {
          padding-top: 0;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .back-link {
          display: inline-block;
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .back-link:hover {
          text-decoration: underline;
        }
        .page-header h1 {
          margin: 0;
          font-size: 28px;
        }
        .publish-content {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
        }
        .publish-main {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .error-banner {
          background: #fff2f0;
          border: 1px solid #ffccc7;
          color: #ff4d4f;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .form-section {
          max-width: 100%;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }
        .required {
          color: #ff4d4f;
        }
        .form-control {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
          transition: all 0.2s;
        }
        .form-control:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }
        textarea.form-control {
          resize: vertical;
          min-height: 120px;
          font-family: inherit;
        }
        .form-hint {
          margin-top: 6px;
          font-size: 12px;
          color: #999;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .category-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }
        .category-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 12px;
          border: 2px solid #f0f0f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        .category-item:hover {
          border-color: #d9d9d9;
          background: #f9f9f9;
        }
        .category-item.active {
          border-color: #667eea;
          background: #f0f2ff;
        }
        .category-icon {
          font-size: 32px;
        }
        .category-name {
          font-size: 13px;
          color: #333;
        }
        .image-preview-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .image-preview-item {
          position: relative;
          width: 160px;
          height: 100px;
          border-radius: 8px;
          overflow: hidden;
        }
        .image-preview-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-remove {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border: none;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .image-remove:hover {
          background: rgba(0, 0, 0, 0.8);
        }
        .image-add-btn {
          width: 160px;
          height: 100px;
          border: 2px dashed #d9d9d9;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          color: #999;
          transition: all 0.2s;
        }
        .image-add-btn:hover {
          border-color: #667eea;
          color: #667eea;
        }
        .plus-icon {
          font-size: 28px;
          line-height: 1;
        }
        .image-add-btn span:last-child {
          font-size: 13px;
        }
        .image-input-item {
          width: 100%;
          max-width: 320px;
          border: 2px dashed #667eea;
          border-radius: 8px;
          padding: 12px;
        }
        .image-input-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .btn-sm {
          padding: 6px 14px;
          font-size: 13px;
        }
        .time-preview {
          background: #f0f2ff;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .preview-label {
          font-size: 13px;
          color: #666;
        }
        .preview-value {
          font-size: 13px;
          color: #667eea;
          font-weight: 500;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid #f0f0f0;
        }
        .btn {
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .btn-primary:hover {
          opacity: 0.9;
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-secondary {
          background: #f0f0f0;
          color: #333;
        }
        .btn-secondary:hover {
          background: #e0e0e0;
        }
        .publish-sidebar {
          position: sticky;
          top: 80px;
          align-self: flex-start;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sidebar-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .sidebar-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #333;
        }
        .notice-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .notice-list li {
          font-size: 13px;
          color: #666;
          line-height: 1.8;
          padding-left: 20px;
          position: relative;
          margin-bottom: 8px;
        }
        .notice-list li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #667eea;
          font-weight: bold;
        }
        .credit-info {
          margin-bottom: 16px;
        }
        .credit-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
        }
        .credit-item:last-child {
          border-bottom: none;
        }
        .credit-label {
          color: #666;
        }
        .credit-value {
          color: #52c41a;
          font-weight: 500;
        }
        .user-credit {
          text-align: center;
          padding: 16px;
          background: #f9f9f9;
          border-radius: 8px;
          font-size: 14px;
          color: #666;
        }
        .user-credit strong {
          color: #667eea;
          font-size: 18px;
        }
        .credit-level {
          margin-left: 8px;
          color: #999;
        }
        @media (max-width: 768px) {
          .publish-content {
            grid-template-columns: 1fr;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
          .category-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .image-preview-item,
          .image-add-btn {
            width: calc(50% - 6px);
          }
        }
      `}</style>
    </div>
  );
}

export default PublishActivity;
