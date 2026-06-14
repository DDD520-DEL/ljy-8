import { useEffect, useState } from 'react';
import { feedbackApi } from '../api';
import type { FeedbackWithUser, FeedbackStatus, FeedbackType } from '../types';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';

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

const statusColor: Record<FeedbackStatus, { color: string; bgColor: string }> = {
  pending: { color: '#faad14', bgColor: '#fff7e6' },
  processing: { color: '#1890ff', bgColor: '#e6f7ff' },
  resolved: { color: '#52c41a', bgColor: '#f6ffed' },
  rejected: { color: '#ff4d4f', bgColor: '#fff1f0' },
};

const typeIcon: Record<FeedbackType, string> = {
  suggestion: '💡',
  bug: '🐛',
  experience: '😊',
};

function AdminFeedbackManage() {
  const { user } = useAuthStore();
  const [feedbacks, setFeedbacks] = useState<FeedbackWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithUser | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processForm, setProcessForm] = useState({ status: 'processing' as FeedbackStatus, adminReply: '' });
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadFeedbacks();
    loadStatistics();
  }, [typeFilter, statusFilter, keyword, page]);

  const loadStatistics = async () => {
    try {
      const res = await feedbackApi.getStatistics();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('加载统计数据失败', err);
    }
  };

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (keyword.trim()) params.keyword = keyword.trim();

      const res = await feedbackApi.getAllFeedbacks(params);
      if (res.success) {
        setFeedbacks(res.data?.items || []);
        setTotal(res.data?.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleOpenDetail = (feedback: FeedbackWithUser) => {
    setSelectedFeedback(feedback);
    setShowDetailModal(true);
  };

  const handleOpenProcess = (feedback: FeedbackWithUser) => {
    setSelectedFeedback(feedback);
    setProcessForm({ 
      status: feedback.status === 'pending' ? 'processing' : feedback.status, 
      adminReply: feedback.adminReply || '' 
    });
    setShowProcessModal(true);
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback) return;

    if ((processForm.status === 'resolved' || processForm.status === 'rejected') && !processForm.adminReply.trim()) {
      alert('请填写处理回复');
      return;
    }

    if (processForm.adminReply.length > 2000) {
      alert('回复内容不能超过2000个字符');
      return;
    }

    setSubmitting(true);
    try {
      const res = await feedbackApi.updateFeedbackStatus(selectedFeedback.id, {
        status: processForm.status,
        adminReply: processForm.adminReply.trim() || undefined,
      });

      if (res.success) {
        alert('处理成功');
        setShowProcessModal(false);
        setSelectedFeedback(null);
        loadFeedbacks();
        loadStatistics();
      } else {
        alert(res.message || '处理失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container admin-feedback-page">
      <div className="page-header">
        <h1>意见反馈管理</h1>
        <p className="page-subtitle">查看和处理用户提交的意见反馈</p>
      </div>

      {stats && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">总反馈数</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #faad14' }}>
            <div className="stat-value" style={{ color: '#faad14' }}>{stats.pending}</div>
            <div className="stat-label">待处理</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #1890ff' }}>
            <div className="stat-value" style={{ color: '#1890ff' }}>{stats.processing}</div>
            <div className="stat-label">处理中</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #52c41a' }}>
            <div className="stat-value" style={{ color: '#52c41a' }}>{stats.resolved}</div>
            <div className="stat-label">已解决</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #ff4d4f' }}>
            <div className="stat-value" style={{ color: '#ff4d4f' }}>{stats.rejected}</div>
            <div className="stat-label">已拒绝</div>
          </div>
        </div>
      )}

      <div className="filter-bar">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="form-control"
            placeholder="搜索标题或内容..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">搜索</button>
        </form>
        <div className="filter-group">
          <label className="filter-label">类型</label>
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部</option>
            <option value="suggestion">功能建议</option>
            <option value="bug">Bug反馈</option>
            <option value="experience">使用体验</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">状态</label>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部</option>
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
        </div>
      ) : (
        <>
          <div className="feedback-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>类型</th>
                  <th>标题</th>
                  <th>提交用户</th>
                  <th>状态</th>
                  <th>提交时间</th>
                  <th>处理时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((feedback) => {
                  const statusInfo = statusColor[feedback.status];
                  return (
                    <tr key={feedback.id} className={feedback.status === 'pending' ? 'highlight-row' : ''}>
                      <td>
                        <span className="type-badge">
                          {typeIcon[feedback.type]} {typeText[feedback.type]}
                        </span>
                      </td>
                      <td className="title-cell">{feedback.title}</td>
                      <td>
                        <div className="user-info-cell">
                          <img src={feedback.user?.avatar} alt="" className="mini-avatar" />
                          <span>{feedback.user?.nickname || '未知用户'}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="status-tag"
                          style={{ color: statusInfo.color, backgroundColor: statusInfo.bgColor }}
                        >
                          {statusText[feedback.status]}
                        </span>
                      </td>
                      <td>{new Date(feedback.createdAt).toLocaleDateString()}</td>
                      <td>
                        {feedback.handledAt 
                          ? new Date(feedback.handledAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        <button
                          className="btn-link"
                          onClick={() => handleOpenDetail(feedback)}
                        >
                          详情
                        </button>
                        <button
                          className="btn-link"
                          onClick={() => handleOpenProcess(feedback)}
                        >
                          {feedback.status === 'pending' ? '处理' : '更新'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </button>
              <span className="page-info">
                第 {page} / {totalPages} 页，共 {total} 条
              </span>
              <button
                className="btn btn-secondary"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {showDetailModal && selectedFeedback && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>反馈详情</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
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
                  className="status-tag"
                  style={{ 
                    color: statusColor[selectedFeedback.status].color, 
                    backgroundColor: statusColor[selectedFeedback.status].bgColor 
                  }}
                >
                  {statusText[selectedFeedback.status]}
                </span>
              </div>

              <h3 className="detail-title">{selectedFeedback.title}</h3>

              <div className="user-info-section">
                <img src={selectedFeedback.user?.avatar} alt="" className="user-avatar" />
                <div className="user-details">
                  <div className="user-name">{selectedFeedback.user?.nickname || '未知用户'}</div>
                  <div className="user-meta">
                    {selectedFeedback.user?.neighborhood && (
                      <span>🏘️ {selectedFeedback.user.neighborhood}</span>
                    )}
                    {selectedFeedback.contact && (
                      <span>📞 {selectedFeedback.contact}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>反馈内容</h4>
                <p className="detail-content">{selectedFeedback.description}</p>
              </div>

              {selectedFeedback.adminReply && (
                <div className="admin-reply">
                  <div className="reply-header">
                    <span className="reply-icon">👨‍💼</span>
                    <span className="reply-label">管理员回复</span>
                    {selectedFeedback.handler && (
                      <span className="handler-name">
                        处理人：{selectedFeedback.handler.nickname}
                      </span>
                    )}
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

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  关闭
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenProcess(selectedFeedback);
                  }}
                >
                  {selectedFeedback.status === 'pending' ? '处理反馈' : '更新状态'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProcessModal && selectedFeedback && (
        <div className="modal-overlay" onClick={() => setShowProcessModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>处理反馈</h2>
              <button className="modal-close" onClick={() => setShowProcessModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleProcessSubmit} className="modal-body">
              <div className="feedback-summary">
                <h4>{selectedFeedback.title}</h4>
                <p className="feedback-summary-desc">{selectedFeedback.description}</p>
              </div>

              <div className="form-group">
                <label>处理状态 *</label>
                <select
                  className="form-control"
                  value={processForm.status}
                  onChange={(e) => setProcessForm({ ...processForm, status: e.target.value as FeedbackStatus })}
                >
                  <option value="processing">处理中</option>
                  <option value="resolved">已解决</option>
                  <option value="rejected">已拒绝</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  回复用户
                  {(processForm.status === 'resolved' || processForm.status === 'rejected') && ' *'}
                </label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={processForm.adminReply}
                  onChange={(e) => setProcessForm({ ...processForm, adminReply: e.target.value })}
                  placeholder="请输入对用户的回复内容..."
                  maxLength={2000}
                />
                <div className="char-count">{processForm.adminReply.length}/2000</div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowProcessModal(false)}
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? '提交中...' : '确认处理'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-feedback-page {
          max-width: 1200px;
          margin: 0 auto;
        }
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid #667eea;
          text-align: center;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 13px;
          color: #999;
        }
        .search-form {
          display: flex;
          gap: 8px;
        }
        .search-form .form-control {
          width: 300px;
        }
        .type-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #f5f5f5;
          border-radius: 4px;
          font-size: 13px;
        }
        .title-cell {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .user-info-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mini-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .status-tag {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .highlight-row {
          background: #fffbe6;
        }
        .btn-link {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          padding: 4px 8px;
          font-size: 13px;
        }
        .btn-link:hover {
          text-decoration: underline;
        }
        .modal-content.large {
          max-width: 700px;
        }
        .user-info-section {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
        }
        .user-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }
        .user-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #666;
        }
        .detail-section {
          margin-bottom: 20px;
        }
        .detail-section h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #333;
        }
        .feedback-summary {
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .feedback-summary h4 {
          margin: 0 0 8px 0;
          color: #333;
        }
        .feedback-summary-desc {
          margin: 0;
          color: #666;
          font-size: 14px;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .handler-name {
          font-size: 12px;
          color: #666;
          margin-left: auto;
        }
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }
        .char-count {
          text-align: right;
          font-size: 12px;
          color: #999;
          margin-top: 4px;
        }
        @media (max-width: 768px) {
          .search-form .form-control {
            width: 200px;
          }
          .stats-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default AdminFeedbackManage;
