import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { disputeApi } from '../api';
import type { DisputeWithDetails } from '../types';

function Disputes() {
  const [role, setRole] = useState<'all' | 'complainant' | 'respondent'>('all');
  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, [role]);

  const loadDisputes = async () => {
    setLoading(true);
    const roleParam = role === 'all' ? undefined : role;
    const res = await disputeApi.getDisputes(roleParam);
    if (res.success) {
      setDisputes(res.data || []);
    }
    setLoading(false);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待处理', color: 'orange' },
      reviewing: { text: '审核中', color: 'blue' },
      resolved: { text: '已解决', color: 'green' },
    };
    return statusMap[status] || { text: status, color: 'gray' };
  };

  return (
    <div className="container disputes-page">
      <div className="page-header">
        <h1>纠纷中心</h1>
      </div>

      <div className="role-tabs">
        <button
          className={`role-tab ${role === 'all' ? 'active' : ''}`}
          onClick={() => setRole('all')}
        >
          全部
        </button>
        <button
          className={`role-tab ${role === 'complainant' ? 'active' : ''}`}
          onClick={() => setRole('complainant')}
        >
          我发起的
        </button>
        <button
          className={`role-tab ${role === 'respondent' ? 'active' : ''}`}
          onClick={() => setRole('respondent')}
        >
          被申诉的
        </button>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : disputes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚖️</div>
          <p>暂无纠纷记录</p>
        </div>
      ) : (
        <div className="dispute-list">
          {disputes.map((dispute) => {
            const statusInfo = getStatusText(dispute.status);
            const order = dispute.order;
            const orderTitle =
              'item' in order ? order.item.title : order.skill.title;
            const orderType = dispute.orderType === 'borrow' ? '借用订单' : '服务订单';

            return (
              <Link
                key={dispute.id}
                to={`/disputes/${dispute.id}`}
                className="dispute-card"
              >
                <div className="dispute-header">
                  <div>
                    <h3>{dispute.reason}</h3>
                    <p className="dispute-type">{orderType} · {orderTitle}</p>
                  </div>
                  <span className={`tag tag-${statusInfo.color}`}>
                    {statusInfo.text}
                  </span>
                </div>
                <div className="dispute-parties">
                  <span>申诉方：{dispute.complainant.nickname}</span>
                  <span>被诉方：{dispute.respondent.nickname}</span>
                </div>
                <div className="dispute-footer">
                  <span className="text-muted">
                    创建时间：{new Date(dispute.createdAt).toLocaleString()}
                  </span>
                  {dispute.resolvedAt && (
                    <span className="text-muted">
                      解决时间：{new Date(dispute.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        .disputes-page {
          padding-top: 0;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 28px;
        }
        .role-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }
        .role-tab {
          padding: 6px 16px;
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 16px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .role-tab:hover {
          border-color: #667eea;
          color: #667eea;
        }
        .role-tab.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }
        .dispute-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .dispute-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.2s;
        }
        .dispute-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          transform: translateX(4px);
        }
        .dispute-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .dispute-header h3 {
          font-size: 16px;
          margin-bottom: 4px;
        }
        .dispute-type {
          font-size: 13px;
          color: #999;
        }
        .dispute-parties {
          display: flex;
          gap: 24px;
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
        }
        .dispute-footer {
          display: flex;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid #f5f5f5;
          font-size: 13px;
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
        }
      `}</style>
    </div>
  );
}

export default Disputes;
