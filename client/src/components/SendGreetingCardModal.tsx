import { useEffect, useState } from 'react';
import { greetingCardApi } from '../api';
import type { GreetingCardTemplate } from '../types';

interface SendGreetingCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  orderId?: string;
  orderType?: 'borrow' | 'service' | 'demand';
  onSuccess?: () => void;
}

function SendGreetingCardModal({
  isOpen,
  onClose,
  receiverId,
  receiverName,
  orderId,
  orderType,
  onSuccess,
}: SendGreetingCardModalProps) {
  const [templates, setTemplates] = useState<GreetingCardTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await greetingCardApi.getTemplates();
      if (res.success && res.data) {
        setTemplates(res.data);
        if (res.data.length > 0) {
          setSelectedTemplateId(res.data[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      alert('请选择一张卡片');
      return;
    }

    setSubmitting(true);
    try {
      const res = await greetingCardApi.sendCard({
        receiverId,
        templateId: selectedTemplateId,
        customMessage: customMessage.trim() || undefined,
        orderId,
        orderType,
      });
      if (res.success) {
        alert('感谢卡片发送成功！');
        onClose();
        setCustomMessage('');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        alert(res.message || '发送失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal greeting-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>发送感谢卡片给 {receiverName}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="greeting-card-preview-section">
            {selectedTemplate && (
              <div
                className="greeting-card-preview"
                style={{
                  background: selectedTemplate.bgColor,
                  color: selectedTemplate.textColor,
                }}
              >
                <div className="greeting-card-emoji">{selectedTemplate.emoji}</div>
                <h4 className="greeting-card-title">{selectedTemplate.title}</h4>
                <p className="greeting-card-content">{selectedTemplate.content}</p>
                {customMessage && (
                  <div className="greeting-card-custom-message">
                    <p>"{customMessage}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">选择卡片模板</label>
            {loading ? (
              <p>加载中...</p>
            ) : (
              <div className="greeting-card-template-grid">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`greeting-card-template-item ${
                      selectedTemplateId === template.id ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <div
                      className="template-thumb"
                      style={{
                        background: template.bgColor,
                        color: template.textColor,
                      }}
                    >
                      <span className="template-emoji">{template.emoji}</span>
                    </div>
                    <p className="template-title">{template.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">自定义留言（选填）</label>
            <textarea
              className="form-textarea"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="写一句你想说的话..."
              rows={3}
              maxLength={100}
            />
            <small style={{ color: '#999', marginTop: '4px', display: 'block' }}>
              {customMessage.length}/100
            </small>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || loading}>
              {submitting ? '发送中...' : '发送卡片'}
            </button>
          </div>
        </form>

        <style>{`
          .greeting-card-modal {
            max-width: 560px;
          }
          .greeting-card-preview-section {
            padding: 0 24px 16px;
          }
          .greeting-card-preview {
            border-radius: 16px;
            padding: 32px 24px;
            text-align: center;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          }
          .greeting-card-emoji {
            font-size: 48px;
            margin-bottom: 12px;
          }
          .greeting-card-title {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 12px;
          }
          .greeting-card-content {
            font-size: 15px;
            line-height: 1.6;
            opacity: 0.9;
            margin: 0;
          }
          .greeting-card-custom-message {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.3);
            font-style: italic;
          }
          .greeting-card-custom-message p {
            margin: 0;
            font-size: 14px;
          }
          .greeting-card-template-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
          .greeting-card-template-item {
            cursor: pointer;
            text-align: center;
            padding: 8px;
            border-radius: 10px;
            border: 2px solid transparent;
            transition: all 0.2s;
          }
          .greeting-card-template-item:hover {
            background: #f5f5f5;
          }
          .greeting-card-template-item.selected {
            border-color: #667eea;
            background: #f0f2ff;
          }
          .template-thumb {
            width: 100%;
            aspect-ratio: 1;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 6px;
          }
          .template-emoji {
            font-size: 28px;
          }
          .template-title {
            font-size: 12px;
            color: #666;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          @media (max-width: 480px) {
            .greeting-card-template-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default SendGreetingCardModal;
