import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { disputeApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { DisputeWithDetails } from '../types';

function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [dispute, setDispute] = useState<DisputeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadDispute();
    }
  }, [id]);

  const loadDispute = async () => {
    setLoading(true);
    const res = await disputeApi.getDisputeById(id!);
    if (res.success) {
      setDispute(res.data);
    }
    setLoading(false);
  };

  const handleStartReview = async () => {
    if (!id) return;
    const res = await disputeApi.startReview(id);
    if (res.success) {
      alert('已开始审核');
      loadDispute();
    } else {
      alert(res.message || '操作失败');
    }
  };

  const handleResolve = async () => {
    if (!id || !resolution.trim()) {
      alert('请输入处理结果');
      return;
    }
    setSubmitting(true);
    try {
      const res = await disputeApi.resolveDispute(id, { resolution });
      if (res.success) {
        alert('纠纷已解决');
        loadDispute();
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = user && 'role' in user && (user as any).role === 'admin';
  const order = dispute?.order;
  const orderTitle = order ? ('item' in order ? order.item.title : order.skill.title) : '';

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待处理', color: 'orange' },
      reviewing: { text: '审核中', color: 'blue' },
      resolved: { text: '已解决', color: 'green' },
    };
    return statusMap[status] || { text: status, color: 'gray' };
  };

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  if (!dispute) {
    return <div className="container">纠纷不存在</div>;
  }

  const statusInfo = getStatusText(dispute.status);

  return (
    <div className="container dispute-detail-page">
      <div className="breadcrumb">
        <Link to="/disputes">纠纷中心</Link> / <span>纠纷详情</span>
      </div>

      <div className="dispute-detail-header">
        <h1>纠纷详情</h1>
        <span className={`tag tag-${statusInfo.color}`}>{statusInfo.text}</span>
      </div>

      <div className="dispute-detail-content">
        <div className="dispute-main">
          <div className="dispute-info-card">
            <h3>纠纷原因</h3>
            <p className="dispute-reason">{dispute.reason}</p>
            <h3 className="mt-4">详细描述</h3>
            <p className="dispute-description">{dispute.description}</p>
          </div>

          {dispute.evidence && dispute.evidence.length > 0 && (
            <div className="dispute-info-card">
              <h3>证据材料</h3>
              <div className="evidence-list">
                {dispute.evidence.map((item, index) => (
                  <div key={index} className="evidence-item">
                    📎 {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {dispute.resolution && (
            <div className="dispute-info-card resolution-card">
              <h3>处理结果</h3>
              <p className="resolution-text">{dispute.resolution}</p>
              {dispute.resolvedAt && (
                <p className="text-muted mt-2">
                  解决时间：{new Date(dispute.resolvedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="dispute-info-card">
            <h3>相关订单</h3>
            <div className="order-preview">
              <div className="order-preview-info">
                <p className="order-title">{orderTitle}</p>
                <p className="text-muted">
                  {dispute.orderType === 'borrow' ? '借用订单' : '服务订单'}
                </p>
              </div>
              <Link
                to={
                  dispute.orderType === 'borrow'
                    ? `/orders/borrow/${dispute.orderId}`
                    : `/orders/service/${dispute.orderId}`
                }
                className="btn btn-secondary"
              >
                查看订单
              </Link>
            </div>
          </div>
        </div>

        <div className="dispute-sidebar">
          <div className="parties-card">
            <h3>双方信息</h3>
            <div className="party-row complainant">
              <img src={dispute.complainant.avatar} alt="" className="avatar" />
              <div>
                <p className="party-name">{dispute.complainant.nickname}</p>
                <p className="party-role">申诉方</p>
              </div>
            </div>
            <div className="party-row respondent">
              <img src={dispute.respondent.avatar} alt="" className="avatar" />
              <div>
                <p className="party-name">{dispute.respondent.nickname}</p>
                <p className="party-role">被诉方</p>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="admin-actions-card">
              <h3>管理员操作</h3>
              {dispute.status === 'pending' && (
                <button
                  className="btn btn-primary w-full"
                  onClick={handleStartReview}
                >
                  开始审核
                </button>
              )}
              {dispute.status === 'reviewing' && (
                <>
                  <div className="form-group">
                    <label className="form-label">处理结果</label>
                    <textarea
                      className="form-textarea"
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="请输入处理结果说明..."
                      rows={4}
                    />
                  </div>
                  <button
                    className="btn btn-success w-full"
                    onClick={handleResolve}
                    disabled={submitting}
                  >
                    {submitting ? '提交中...' : '解决纠纷'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .dispute-detail-page {
          padding-top: 0;
        }
        .breadcrumb {
          margin-bottom: 20px;
          color: #999;
          font-size: 14px;
        }
        .breadcrumb a {
          color: #667eea;
        }
        .dispute-detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .dispute-detail-header h1 {
          font-size: 28px;
        }
        .dispute-detail-content {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
        }
        .dispute-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .dispute-info-card,
        .parties-card,
        .admin-actions-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .dispute-info-card h3 {
          font-size: 16px;
          margin-bottom: 12px;
        }
        .dispute-reason {
          font-size: 18px;
          font-weight: 500;
          color: #333;
        }
        .dispute-description {
          color: #666;
          line-height: 1.8;
        }
        .evidence-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .evidence-item {
          padding: 8px 12px;
          background: #f5f7fa;
          border-radius: 6px;
          font-size: 14px;
          color: #666;
        }
        .resolution-card {
          background: #f6ffed;
          border: 1px solid #b7eb8f;
        }
        .resolution-text {
          color: #389e0d;
          line-height: 1.8;
        }
        .order-preview {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f5f7fa;
          border-radius: 8px;
        }
        .order-title {
          font-weight: 500;
          margin-bottom: 4px;
        }
        .dispute-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .parties-card h3,
        .admin-actions-card h3 {
          font-size: 16px;
          margin-bottom: 16px;
        }
        .party-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .party-row.complainant {
          background: #e6f7ff;
        }
        .party-row.respondent {
          background: #fff1f0;
        }
        .party-name {
          font-weight: 500;
        }
        .party-role {
          font-size: 12px;
          color: #999;
        }
        .mt-2 {
          margin-top: 8px;
        }
        .mt-4 {
          margin-top: 16px;
        }
        .text-muted {
          color: #999;
          font-size: 14px;
        }
        .w-full {
          width: 100%;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
        }
        .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
          min-height: 100px;
        }
        @media (max-width: 768px) {
          .dispute-detail-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default DisputeDetail;
