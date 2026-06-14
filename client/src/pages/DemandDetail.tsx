import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { demandApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { DemandWithDetails, DemandResponseWithDetails } from '../types';

const statusText: Record<string, string> = {
  open: '接受响应',
  responding: '有响应中',
  confirmed: '已确认',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColor: Record<string, string> = {
  open: 'green',
  responding: 'orange',
  confirmed: 'blue',
  in_progress: 'purple',
  completed: 'gray',
  cancelled: 'red',
};

const urgencyText: Record<string, string> = {
  normal: '普通',
  urgent: '紧急',
  very_urgent: '非常紧急',
};

const urgencyColor: Record<string, string> = {
  normal: 'gray',
  urgent: 'orange',
  very_urgent: 'red',
};

const responseStatusText: Record<string, string> = {
  pending: '待确认',
  accepted: '已接受',
  rejected: '已拒绝',
  withdrawn: '已撤回',
};

const responseStatusColor: Record<string, string> = {
  pending: 'orange',
  accepted: 'green',
  rejected: 'red',
  withdrawn: 'gray',
};

function DemandDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [demand, setDemand] = useState<DemandWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [respondMessage, setRespondMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [priceOffer, setPriceOffer] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDemand();
  }, [id]);

  const loadDemand = async () => {
    if (!id) return;
    setLoading(true);
    const res = await demandApi.getDemandById(id);
    if (res.success) {
      setDemand(res.data);
    }
    setLoading(false);
  };

  const isOwner = user && demand && user.id === demand.requesterId;
  const hasResponded = user && demand?.responses.some(
    r => r.responderId === user.id && (r.status === 'pending' || r.status === 'accepted')
  );
  const acceptedResponse = demand?.responses.find(r => r.status === 'accepted');

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !respondMessage.trim()) return;
    setSubmitting(true);
    const res = await demandApi.respondToDemand(id, {
      message: respondMessage,
      estimatedTime: estimatedTime || undefined,
      priceOffer: priceOffer === '' ? undefined : Number(priceOffer),
    });
    if (res.success) {
      alert('响应成功！');
      setRespondMessage('');
      setEstimatedTime('');
      setPriceOffer('');
      loadDemand();
    } else {
      alert(res.message || '响应失败');
    }
    setSubmitting(false);
  };

  const handleAcceptResponse = async (responseId: string) => {
    if (!id) return;
    if (!confirm('确认接受此响应吗？接受后将创建需求订单。')) return;
    const res = await demandApi.acceptResponse(id, responseId);
    if (res.success) {
      alert('已确认响应，订单创建成功！');
      navigate(`/my-demands`);
    } else {
      alert(res.message || '操作失败');
    }
  };

  const handleWithdrawResponse = async (responseId: string) => {
    if (!confirm('确认撤回此响应吗？')) return;
    const res = await demandApi.withdrawResponse(responseId);
    if (res.success) {
      alert('已撤回响应');
      loadDemand();
    } else {
      alert(res.message || '操作失败');
    }
  };

  const handleCancelDemand = async () => {
    if (!id) return;
    if (!confirm('确认取消此需求吗？')) return;
    const res = await demandApi.cancelDemand(id);
    if (res.success) {
      alert('需求已取消');
      navigate('/demands');
    } else {
      alert(res.message || '操作失败');
    }
  };

  if (loading) {
    return <div className="container loading">加载中...</div>;
  }

  if (!demand) {
    return <div className="container empty-state">需求不存在</div>;
  }

  return (
    <div className="container demand-detail-page">
      <Link to="/demands" className="back-link">← 返回需求广场</Link>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-header">
            <div className="detail-tags">
              <span className="demand-type-badge">
                {demand.type === 'item' ? '🔧 物品需求' : '🛠️ 服务需求'}
              </span>
              <span className={`tag tag-${statusColor[demand.status]}`}>
                {statusText[demand.status]}
              </span>
              <span className={`urgency-tag urgency-${urgencyColor[demand.urgency]}`}>
                {urgencyText[demand.urgency]}
              </span>
            </div>
            <h1 className="detail-title">{demand.title}</h1>
            <div className="detail-meta">
              <div className="requester-info">
                <img src={demand.requester.avatar} alt="" className="avatar" />
                <span className="requester-name">{demand.requester.nickname}</span>
                <span className="requester-neighborhood">{demand.requester.neighborhood}</span>
                <span className="credit-level">信用等级: {demand.requester.creditLevel}</span>
              </div>
              <div className="meta-stats">
                <span>👁 {demand.viewCount} 浏览</span>
                <span>💬 {demand.responses.filter(r => r.status === 'pending' || r.status === 'accepted').length} 响应</span>
                <span>发布于 {new Date(demand.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title">需求描述</h3>
            <div className="description-content">
              <p>{demand.description}</p>
            </div>
          </div>

          <div className="detail-section contact-section">
            <h3 className="section-title">联系方式</h3>
            <div className="contact-info">
              {demand.contactPhone && (
                <p><strong>📞 电话：</strong>{demand.contactPhone}</p>
              )}
              {demand.contactAddress && (
                <p><strong>📍 地址：</strong>{demand.contactAddress}</p>
              )}
              {demand.validUntil && (
                <p><strong>⏰ 有效期至：</strong>{new Date(demand.validUntil).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {(demand.status === 'open' || demand.status === 'responding') && (
            <div className="detail-section respond-section">
              <h3 className="section-title">响应需求</h3>
              {!user ? (
                <p className="login-tip">请先 <Link to="/login">登录</Link> 后再响应</p>
              ) : isOwner ? (
                <p className="login-tip">您不能响应自己发布的需求</p>
              ) : hasResponded ? (
                <p className="login-tip">您已响应该需求，等待发布者确认</p>
              ) : (
                <form className="respond-form" onSubmit={handleRespond}>
                  <div className="form-group">
                    <label>响应说明 *</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="请说明您能如何帮助，比如物品详情、服务经验、可用时间等"
                      value={respondMessage}
                      onChange={(e) => setRespondMessage(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>预计完成时间</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="如：2小时内、明天上午"
                        value={estimatedTime}
                        onChange={(e) => setEstimatedTime(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>报价（时间币）</label>
                      <input
                        type="number"
                        className="form-control"
                        min={0}
                        placeholder={`不填则使用需求方报价 ${demand.timeCoinReward}`}
                        value={priceOffer}
                        onChange={(e) => setPriceOffer(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? '提交中...' : '提交响应'}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="detail-section responses-section">
            <h3 className="section-title">
              响应列表 ({demand.responses.filter(r => r.status !== 'withdrawn').length})
            </h3>
            {demand.responses.length === 0 ? (
              <div className="empty-section">暂无响应</div>
            ) : (
              <div className="responses-list">
                {demand.responses
                  .filter(r => r.status !== 'withdrawn')
                  .map((response: DemandResponseWithDetails) => (
                    <div
                      key={response.id}
                      className={`response-card ${response.status === 'accepted' ? 'accepted' : ''}`}
                    >
                      <div className="response-header">
                        <div className="responder-info">
                          <img src={response.responder.avatar} alt="" className="avatar" />
                          <span className="responder-name">{response.responder.nickname}</span>
                          <span className="credit-level">信用: {response.responder.creditLevel}</span>
                        </div>
                        <span className={`tag tag-${responseStatusColor[response.status]}`}>
                          {responseStatusText[response.status]}
                        </span>
                      </div>
                      <p className="response-message">{response.message}</p>
                      <div className="response-meta">
                        {response.estimatedTime && (
                          <span>⏱ 预计时间: {response.estimatedTime}</span>
                        )}
                        {response.priceOffer !== undefined && (
                          <span>💰 报价: {response.priceOffer} 时间币</span>
                        )}
                        <span className="response-time">
                          {new Date(response.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {isOwner && demand.status === 'responding' && response.status === 'pending' && (
                        <div className="response-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => handleAcceptResponse(response.id)}
                          >
                            确认接受
                          </button>
                        </div>
                      )}
                      {user && user.id === response.responderId && response.status === 'pending' && (
                        <div className="response-actions">
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleWithdrawResponse(response.id)}
                          >
                            撤回响应
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="reward-card">
            <div className="reward-label">报酬</div>
            <div className="reward-amount">
              ⏰ {demand.timeCoinReward}
              <span className="reward-unit">时间币</span>
            </div>
            <div className="reward-category">{demand.category}</div>
          </div>

          {isOwner && (demand.status === 'open' || demand.status === 'responding') && (
            <div className="owner-actions">
              <Link to={`/publish/demand?id=${demand.id}`} className="btn btn-secondary btn-block">
                编辑需求
              </Link>
              <button className="btn btn-danger btn-block" onClick={handleCancelDemand}>
                取消需求
              </button>
            </div>
          )}

          {acceptedResponse && (
            <div className="accepted-card">
              <h4>✅ 已确认的响应</h4>
              <div className="accepted-responder">
                <img src={acceptedResponse.responder.avatar} alt="" className="avatar" />
                <div>
                  <div className="responder-name">{acceptedResponse.responder.nickname}</div>
                  <div className="responder-neighborhood">{acceptedResponse.responder.neighborhood}</div>
                </div>
              </div>
              <p className="accepted-message">{acceptedResponse.message}</p>
              <Link to="/my-demands" className="btn btn-primary btn-block">
                查看订单
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .demand-detail-page {
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
        .detail-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
        }
        .detail-main {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .detail-header {
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .detail-tags {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .demand-type-badge {
          font-size: 13px;
          font-weight: 500;
          color: #667eea;
          background: #f0f2ff;
          padding: 4px 12px;
          border-radius: 6px;
        }
        .tag {
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
        }
        .tag-green {
          background: #f6ffed;
          color: #52c41a;
        }
        .tag-orange {
          background: #fff7e6;
          color: #fa8c16;
        }
        .tag-blue {
          background: #e6f7ff;
          color: #1890ff;
        }
        .tag-purple {
          background: #f9f0ff;
          color: #722ed1;
        }
        .tag-gray {
          background: #f5f5f5;
          color: #8c8c8c;
        }
        .tag-red {
          background: #fff1f0;
          color: #f5222d;
        }
        .urgency-tag {
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
        }
        .urgency-gray {
          background: #f5f5f5;
          color: #8c8c8c;
        }
        .urgency-orange {
          background: #fff7e6;
          color: #fa8c16;
        }
        .urgency-red {
          background: #fff1f0;
          color: #f5222d;
        }
        .detail-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .detail-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .requester-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .requester-info .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }
        .requester-name {
          font-size: 14px;
          font-weight: 500;
        }
        .requester-neighborhood {
          font-size: 12px;
          color: #999;
          background: #f5f5f5;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .credit-level {
          font-size: 12px;
          color: #667eea;
          background: #f0f2ff;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .meta-stats {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #999;
        }
        .detail-section {
          margin-bottom: 24px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          padding-left: 8px;
          border-left: 3px solid #667eea;
        }
        .description-content p {
          font-size: 14px;
          line-height: 1.8;
          color: #333;
          white-space: pre-wrap;
        }
        .contact-info p {
          font-size: 14px;
          margin-bottom: 8px;
          color: #333;
        }
        .respond-section {
          background: #fafafa;
          padding: 20px;
          border-radius: 8px;
        }
        .login-tip {
          color: #666;
          font-size: 14px;
        }
        .login-tip a {
          color: #667eea;
        }
        .respond-form .form-group {
          margin-bottom: 16px;
        }
        .respond-form label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #333;
        }
        .respond-form .form-control {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
          box-sizing: border-box;
        }
        .respond-form .form-control:focus {
          outline: none;
          border-color: #667eea;
        }
        .respond-form .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .responses-section .empty-section {
          text-align: center;
          padding: 40px;
          color: #999;
        }
        .responses-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .response-card {
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.2s;
        }
        .response-card.accepted {
          border-color: #52c41a;
          background: #f6ffed;
        }
        .response-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .responder-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .responder-info .avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
        }
        .responder-info .responder-name {
          font-size: 14px;
          font-weight: 500;
        }
        .response-message {
          font-size: 14px;
          color: #333;
          line-height: 1.6;
          margin-bottom: 12px;
        }
        .response-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #999;
          flex-wrap: wrap;
        }
        .response-time {
          margin-left: auto;
        }
        .response-actions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }
        .detail-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .reward-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 24px;
          color: white;
          text-align: center;
        }
        .reward-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 8px;
        }
        .reward-amount {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .reward-unit {
          font-size: 14px;
          font-weight: 400;
          margin-left: 4px;
          opacity: 0.9;
        }
        .reward-category {
          font-size: 13px;
          opacity: 0.85;
        }
        .owner-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .btn-block {
          width: 100%;
        }
        .btn-danger {
          background: #ff4d4f;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-danger:hover {
          background: #ff7875;
        }
        .accepted-card {
          background: #f6ffed;
          border: 1px solid #b7eb8f;
          border-radius: 12px;
          padding: 20px;
        }
        .accepted-card h4 {
          margin: 0 0 16px;
          font-size: 15px;
          color: #389e0d;
        }
        .accepted-responder {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .accepted-responder .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
        }
        .accepted-responder .responder-name {
          font-size: 14px;
          font-weight: 500;
        }
        .accepted-responder .responder-neighborhood {
          font-size: 12px;
          color: #666;
        }
        .accepted-message {
          font-size: 13px;
          color: #666;
          line-height: 1.6;
          margin: 0 0 16px;
        }
        .loading,
        .empty-state {
          text-align: center;
          padding: 60px 0;
          color: #999;
        }
        @media (max-width: 768px) {
          .detail-layout {
            grid-template-columns: 1fr;
          }
          .respond-form .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default DemandDetail;
