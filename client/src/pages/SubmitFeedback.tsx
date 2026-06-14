import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { feedbackApi } from '../api';
import type { FeedbackType } from '../types';

const typeOptions = [
  { value: 'suggestion', label: '功能建议', icon: '💡', description: '希望平台增加新功能或改进现有功能' },
  { value: 'bug', label: 'Bug反馈', icon: '🐛', description: '遇到了错误或异常问题' },
  { value: 'experience', label: '使用体验', icon: '😊', description: '分享您的使用感受和体验' },
];

function SubmitFeedback() {
  const navigate = useNavigate();

  const [type, setType] = useState<FeedbackType>('suggestion');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('请填写反馈标题');
      return;
    }

    if (!description.trim()) {
      alert('请填写反馈内容');
      return;
    }

    if (title.length > 100) {
      alert('反馈标题不能超过100个字符');
      return;
    }

    if (description.length > 2000) {
      alert('反馈内容不能超过2000个字符');
      return;
    }

    setSubmitting(true);

    try {
      const res = await feedbackApi.createFeedback({
        type,
        title: title.trim(),
        description: description.trim(),
        contact: contact.trim() || undefined,
      });

      if (res.success) {
        alert('反馈提交成功！我们会尽快处理您的反馈');
        navigate('/my-feedbacks');
      } else {
        alert(res.message || '提交失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container submit-feedback-page">
      <Link to="/my-feedbacks" className="back-link">
        ← 返回我的反馈
      </Link>

      <div className="publish-card">
        <h1 className="page-title">意见反馈</h1>
        <p className="page-subtitle">
          感谢您的反馈，我们会认真对待每一条建议和问题
        </p>

        <form onSubmit={handleSubmit} className="publish-form">
          <div className="form-section">
            <h3 className="section-title">反馈类型 *</h3>
            <div className="feedback-type-grid">
              {typeOptions.map((opt) => (
                <label
                key={opt.value}
                className={`feedback-type-card ${type === opt.value ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="type"
                  value={opt.value}
                  checked={type === opt.value}
                  onChange={(e) => setType(e.target.value as FeedbackType)}
                />
                <div className="type-card-content">
                  <span className="type-icon">{opt.icon}</span>
                  <span className="type-label">{opt.label}</span>
                  <span className="type-desc">{opt.description}</span>
                </div>
              </label>
            ))}
          </div>
          </div>

          <div className="form-group">
            <label>反馈标题 *</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请简要描述您的反馈"
              maxLength={100}
            />
            <div className="char-count">{title.length}/100</div>
          </div>

          <div className="form-group">
            <label>反馈内容 *</label>
            <textarea
              className="form-control"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请详细描述您的反馈内容..."
              maxLength={2000}
            />
            <div className="char-count">{description.length}/2000</div>
          </div>

          <div className="form-group">
            <label>联系方式（选填）</label>
            <input
              type="text"
              className="form-control"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="方便我们联系您进一步了解详情（手机号/邮箱）"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/my-feedbacks')}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? '提交中...' : '提交反馈'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .submit-feedback-page {
          max-width: 800px;
          margin: 0 auto;
        }
        .page-subtitle {
          color: #666;
          margin-bottom: 24px;
          font-size: 14px;
        }
        .feedback-type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .feedback-type-card {
          position: relative;
          cursor: pointer;
          padding: 0;
          border: 2px solid #e8e8e8;
          border-radius: 12px;
          transition: all 0.2s;
          background: white;
          overflow: hidden;
        }
        .feedback-type-card input[type="radio"] {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }
        .type-card-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          text-align: center;
        }
        .feedback-type-card:hover {
          border-color: #d9d9d9;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .feedback-type-card.active {
          border-color: #667eea;
          background: linear-gradient(135deg, #f0f2ff 0%, #e8ebff 100%);
        }
        .type-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .type-label {
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }
        .type-desc {
          font-size: 12px;
          color: #999;
          line-height: 1.5;
        }
        .char-count {
          text-align: right;
          font-size: 12px;
          color: #999;
          margin-top: 4px;
        }
        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }
        @media (max-width: 600px) {
          .feedback-type-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default SubmitFeedback;
