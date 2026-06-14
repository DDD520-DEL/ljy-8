import { useEffect, useState } from 'react';
import { verificationApi } from '../api';
import type { UserVerificationWithUser } from '../types';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';

function AdminVerificationManage() {
  const { user } = useAuthStore();
  const [verifications, setVerifications] = useState<UserVerificationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<UserVerificationWithUser | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: 'approved' as 'approved' | 'rejected', rejectReason: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadVerifications();
  }, [statusFilter, page]);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const res = await verificationApi.getVerificationList({
        status: statusFilter || undefined,
        page,
        pageSize,
      });
      if (res.success) {
        setVerifications(res.data?.items || []);
        setTotal(res.data?.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (verification: UserVerificationWithUser) => {
    setSelectedVerification(verification);
    setReviewForm({ status: 'approved', rejectReason: '' });
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerification) return;
    if (reviewForm.status === 'rejected' && !reviewForm.rejectReason) {
      alert('请填写拒绝原因');
      return;
    }
    setSubmitting(true);
    try {
      const res = await verificationApi.reviewVerification(selectedVerification.id, reviewForm);
      if (res.success) {
        alert('审核完成');
        setShowReviewModal(false);
        setSelectedVerification(null);
        loadVerifications();
      } else {
        alert(res.message || '审核失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const map: Record<string, { text: string; color: string; bgColor: string }> = {
      pending: { text: '待审核', color: '#fa8c16', bgColor: '#fff7e6' },
      approved: { text: '已通过', color: '#52c41a', bgColor: '#f6ffed' },
      rejected: { text: '已拒绝', color: '#ff4d4f', bgColor: '#fff1f0' },
    };
    return map[status] || { text: status, color: '#999', bgColor: '#f5f5f5' };
  };

  const totalPages = Math.ceil(total / pageSize);

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container admin-verification-page">
      <div className="page-header">
        <h1>身份认证管理</h1>
        <p className="page-subtitle">审核用户提交的身份认证申请</p>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">状态筛选</label>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : verifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>暂无认证申请</p>
        </div>
      ) : (
        <>
          <div className="verification-list">
            {verifications.map((v) => {
              const statusInfo = getStatusInfo(v.status);
              return (
                <div key={v.id} className="verification-card">
                  <div className="verification-user">
                    <img src={v.user.avatar} alt="" className="avatar" />
                    <div className="verification-user-info">
                      <div className="verification-user-name">
                        {v.user.nickname}
                        {v.user.isVerified && (
                          <span className="verified-badge-small">✓ 已认证</span>
                        )}
                      </div>
                      <div className="verification-user-meta">
                        <span className="user-neighborhood">📍 {v.user.neighborhood}</span>
                        <span className="user-credit">信用等级：{v.user.creditLevel}</span>
                      </div>
                    </div>
                    <span
                      className="status-tag"
                      style={{ background: statusInfo.bgColor, color: statusInfo.color }}
                    >
                      {statusInfo.text}
                    </span>
                  </div>
                  <div className="verification-details">
                    <div className="detail-row">
                      <span className="detail-label">真实姓名</span>
                      <span className="detail-value">{v.realName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">门牌号</span>
                      <span className="detail-value">{v.houseNumber}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">提交时间</span>
                      <span className="detail-value">
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {v.rejectReason && (
                      <div className="detail-row reject-row">
                        <span className="detail-label">拒绝原因</span>
                        <span className="detail-value">{v.rejectReason}</span>
                      </div>
                    )}
                    {v.reviewedAt && (
                      <div className="detail-row">
                        <span className="detail-label">审核时间</span>
                        <span className="detail-value">
                          {new Date(v.reviewedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  {v.status === 'pending' && (
                    <div className="verification-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenReview(v)}
                      >
                        审核
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                上一页
              </button>
              <span className="page-info">
                第 {page} / {totalPages} 页，共 {total} 条
              </span>
              <button
                className="page-btn"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {showReviewModal && selectedVerification && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>审核认证申请</h3>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>
                ×
              </button>
            </div>
            <div className="review-user-info">
              <img src={selectedVerification.user.avatar} alt="" className="avatar avatar-lg" />
              <div>
                <h4>{selectedVerification.user.nickname}</h4>
                <p className="text-muted">{selectedVerification.user.neighborhood}</p>
              </div>
            </div>
            <div className="review-details">
              <div className="detail-row">
                <span className="detail-label">真实姓名</span>
                <span className="detail-value">{selectedVerification.realName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">门牌号</span>
                <span className="detail-value">{selectedVerification.houseNumber}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">提交时间</span>
                <span className="detail-value">
                  {new Date(selectedVerification.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label className="form-label">审核结果</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="status"
                      value="approved"
                      checked={reviewForm.status === 'approved'}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, status: e.target.value as 'approved' | 'rejected' })
                      }
                    />
                    <span>通过</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="status"
                      value="rejected"
                      checked={reviewForm.status === 'rejected'}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, status: e.target.value as 'approved' | 'rejected' })
                      }
                    />
                    <span>拒绝</span>
                  </label>
                </div>
              </div>
              {reviewForm.status === 'rejected' && (
                <div className="form-group">
                  <label className="form-label">拒绝原因</label>
                  <textarea
                    className="form-textarea"
                    value={reviewForm.rejectReason}
                    onChange={(e) => setReviewForm({ ...reviewForm, rejectReason: e.target.value })}
                    placeholder="请输入拒绝原因..."
                    rows={3}
                    required={reviewForm.status === 'rejected'}
                  />
                </div>
              )}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReviewModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '提交中...' : '确认审核'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-verification-page {
          padding-top: 0;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 28px;
          margin-bottom: 4px;
        }
        .page-subtitle {
          color: #999;
          font-size: 14px;
        }
        .filter-bar {
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          gap: 16px;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-label {
          font-size: 14px;
          color: #666;
        }
        .filter-select {
          padding: 6px 12px;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          font-size: 13px;
          background: white;
          cursor: pointer;
          outline: none;
        }
        .filter-select:focus {
          border-color: #667eea;
        }
        .verification-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .verification-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.3s;
        }
        .verification-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        .verification-user {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }
        .verification-user-info {
          flex: 1;
        }
        .verification-user-name {
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .verified-badge-small {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
          color: white;
        }
        .verification-user-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #999;
        }
        .status-tag {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }
        .verification-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .detail-row {
          display: flex;
          gap: 8px;
        }
        .detail-label {
          color: #999;
          font-size: 13px;
          min-width: 70px;
        }
        .detail-value {
          color: #333;
          font-size: 13px;
          font-weight: 500;
        }
        .reject-row .detail-value {
          color: #ff4d4f;
        }
        .verification-actions {
          text-align: right;
        }
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
        }
        .page-btn {
          padding: 8px 16px;
          border: 1px solid #d9d9d9;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        .page-btn:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .page-info {
          font-size: 14px;
          color: #666;
        }
        .review-user-info {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f0f0f0;
        }
        .review-user-info h4 {
          margin: 0 0 4px 0;
          font-size: 18px;
        }
        .review-details {
          background: #fafafa;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .review-details .detail-row {
          margin-bottom: 8px;
        }
        .review-details .detail-row:last-child {
          margin-bottom: 0;
        }
        .radio-group {
          display: flex;
          gap: 24px;
        }
        .radio-label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        .radio-label input[type="radio"] {
          cursor: pointer;
        }
        .loading,
        .empty-state {
          text-align: center;
          padding: 60px 0;
          color: #999;
        }
        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        .text-muted {
          color: #999;
          font-size: 14px;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

export default AdminVerificationManage;
