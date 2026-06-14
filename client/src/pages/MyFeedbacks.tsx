import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { feedbackApi } from '../api';
import type { FeedbackWithUser, FeedbackType, FeedbackStatus } from '../types';

const typeText: Record<FeedbackType, string> = {
  suggestion: '功能建议',
  bug: 'Bug反馈',
  experience: '使用体验',
};

const statusText: Record<FeedbackStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  rejected: '已拒绝',
};

const statusColor: Record<FeedbackStatus, string> = {
  pending: '#faad14',
  processing: '#1890ff',
  resolved: '#52c41a',
  rejected: '#ff4d4f',
};

const typeIcon: Record<FeedbackType, string> = {
  suggestion: '💡',
  bug: '🐛',
  experience: '😊',
};

function MyFeedbacks() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<FeedbackWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithUser | null>(null);

  useEffect(() => {
    loadFeedbacks();
  }, [filterType, filterStatus]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const params: { type?: string; status?: string } = {};
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;

      const res = await feedbackApi.getMyFeedbacks(params);
      if (res.success) {
        setFeedbacks(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const getTimelineSteps = (feedback: FeedbackWithUser) => {
    const isFinal = feedback.status === 'resolved' || feedback.status === 'rejected';
    let finalLabel: string;
    let finalIcon: string;
    if (feedback.status === 'resolved') {
      finalLabel = '已解决';
      finalIcon = '✅';
    } else if (feedback.status === 'rejected') {
      finalLabel = '已拒绝';
      finalIcon = '❌';
    } else {
      finalLabel = '待完成';
      finalIcon = '🏁';
    }
    const steps = [
      { status: 'pending', label: '已提交', icon: '📤', done: true },
      { status: 'processing', label: '处理中', icon: '🔄', done: feedback.status !== 'pending' },
      { status: isFinal ? feedback.status : 'pending', label: finalLabel, icon: finalIcon, done: isFinal },
    ];
    return steps;
  };

  return (
    <div className="container my-feedbacks-page">
      <div className="page-header">
        <h1 className="page-title">我的反馈</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/feedback/submit')}
        >
          + 提交新反馈
        </button>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>类型：</label>
          <select
            className="form-control"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">全部</option>
            <option value="suggestion">功能建议</option>
            <option value="bug">Bug反馈</option>
            <option value="experience">使用体验</option>
          </select>
        </div>
        <div className="filter-group">
          <label>状态：</label>
          <select
            className="form-control"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">全部</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="resolved">已解决</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : feedbacks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>暂无反馈记录</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/feedback/submit')}
          >
            提交第一条反馈
          </button>
        </div>
      ) : (
        <div className="feedback-list">
          {feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="feedback-card"
              onClick={() => setSelectedFeedback(feedback)}
            >
              <div className="feedback-header">
                <div className="feedback-type">
                  <span className="type-icon">{typeIcon[feedback.type]}</span>
                  <span className="type-label">{typeText[feedback.type]}</span>
                </div>
                <span
                  className="status-badge"
                  style={{ backgroundColor: statusColor[feedback.status] + '20', color: statusColor[feedback.status] }}
                >
                  {statusText[feedback.status]}
                </span>
              </div>
              <h3 className="feedback-title">{feedback.title}</h3>
              <p className="feedback-desc">{feedback.description}</p>
              <div className="feedback-footer">
                <span className="feedback-time">
                  提交时间：{new Date(feedback.createdAt).toLocaleString()}
                </span>
                {feedback.adminReply && (
                  <span className="has-reply">💬 已回复</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>反馈详情</h2>
              <button className="modal-close" onClick={() => setSelectedFeedback(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-header">
                <div className="detail-type">
                  <span className="type-icon">{typeIcon[selectedFeedback.type]}</span>
                  <span>{typeText[selectedFeedback.type]}</span>
                </div>
                <span
                  className="status-badge"
                  style={{ backgroundColor: statusColor[selectedFeedback.status] + '20', color: statusColor[selectedFeedback.status] }}
                >
                  {statusText[selectedFeedback.status]}
                </span>
              </div>

              <h3 className="detail-title">{selectedFeedback.title}</h3>
              <p className="detail-content">{selectedFeedback.description}</p>

              {selectedFeedback.contact && (
                <div className="detail-contact">
                  <strong>联系方式：</strong>
                  <span>{selectedFeedback.contact}</span>
                </div>
              )}

              <div className="timeline-section">
                <h4>处理进度</h4>
                <div className="timeline">
                  {getTimelineSteps(selectedFeedback).map((step, index) => (
                    <div
                      key={step.status}
                      className={`timeline-item ${step.done ? 'done' : ''}`}
                    >
                      <div className="timeline-dot">{step.icon}</div>
                      <div className="timeline-content">
                        <div className="timeline-label">{step.label}</div>
                      </div>
                      {index < 2 && (
                        <div className={`timeline-line ${step.done ? 'done' : ''}`}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedFeedback.adminReply && (
                <div className="admin-reply">
                  <div className="reply-header">
                    <span className="reply-icon">👨‍💼</span>
                    <span className="reply-label">管理员回复</span>
                    {selectedFeedback.handledAt && (
                      <span className="reply-time">
                        {new Date(selectedFeedback.handledAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="reply-content">{selectedFeedback.adminReply}</p>
                </div>
              )}

              <div className="detail-meta">
                <div>
                  <strong>提交时间：</strong>
                  {new Date(selectedFeedback.createdAt).toLocaleString()}
                </div>
                <div>
                  <strong>更新时间：</strong>
                  {new Date(selectedFeedback.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .my-feedbacks-page {
          max-width: 900px;
          margin: 0 auto;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .filter-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-group label {
          color: #666;
          font-size: 14px;
        }
        .filter-group .form-control {
          width: 150px;
        }
        .feedback-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .feedback-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #e8e8e8;
        }
        .feedback-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }
        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .feedback-type {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .type-icon {
          font-size: 18px;
        }
        .type-label {
          font-size: 13px;
          color: #666;
          background: #f5f5f5;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .feedback-title {
          font-size: 16px;
          margin: 0 0 8px 0;
          color: #333;
        }
        .feedback-desc {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 0 12px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .feedback-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .feedback-time {
          color: #999;
          font-size: 12px;
        }
        .has-reply {
          color: #52c41a;
          font-size: 12px;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
        }
        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        .empty-state p {
          color: #999;
          margin-bottom: 16px;
        }
        .loading {
          text-align: center;
          padding: 40px;
          color: #999;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e8e8e8;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 18px;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        }
        .modal-body {
          padding: 20px;
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .detail-type {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #666;
        }
        .detail-title {
          font-size: 20px;
          margin: 0 0 12px 0;
          color: #333;
        }
        .detail-content {
          color: #666;
          line-height: 1.8;
          margin-bottom: 16px;
          padding: 12px;
          background: #fafafa;
          border-radius: 8px;
        }
        .detail-contact {
          margin-bottom: 20px;
          padding: 12px;
          background: #fff7e6;
          border-radius: 8px;
          font-size: 14px;
        }
        .timeline-section {
          margin-bottom: 20px;
        }
        .timeline-section h4 {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: #333;
        }
        .timeline {
          display: flex;
          justify-content: space-between;
          position: relative;
        }
        .timeline-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }
        .timeline-dot {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          z-index: 1;
          opacity: 0.5;
          transition: all 0.3s;
        }
        .timeline-item.done .timeline-dot {
          opacity: 1;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .timeline-content {
          margin-top: 8px;
          text-align: center;
        }
        .timeline-label {
          font-size: 12px;
          color: #999;
        }
        .timeline-item.done .timeline-label {
          color: #333;
          font-weight: 500;
        }
        .timeline-line {
          position: absolute;
          top: 20px;
          left: calc(50% + 20px);
          width: calc(100% - 40px);
          height: 2px;
          background: #f0f0f0;
        }
        .timeline-line.done {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
        .admin-reply {
          background: #f0f7ff;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .reply-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .reply-icon {
          font-size: 18px;
        }
        .reply-label {
          font-weight: 600;
          color: #1890ff;
        }
        .reply-time {
          color: #999;
          font-size: 12px;
          margin-left: auto;
        }
        .reply-content {
          margin: 0;
          color: #333;
          line-height: 1.8;
        }
        .detail-meta {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid #e8e8e8;
          font-size: 13px;
          color: #999;
          flex-wrap: wrap;
        }
        @media (max-width: 600px) {
          .filter-bar {
            flex-direction: column;
          }
          .filter-group .form-control {
            width: 100%;
          }
          .timeline-label {
            font-size: 10px;
          }
          .timeline-dot {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

export default MyFeedbacks;
