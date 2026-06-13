import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { disputeApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { 
  DisputeWithDetails, 
  BorrowOrderWithDetails,
  NegotiationMessage,
  NegotiationStatus,
  DisputeStatus
} from '../types';

function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [dispute, setDispute] = useState<DisputeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState('');
  const [refundDeposit, setRefundDeposit] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [offerMessage, setOfferMessage] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');

  useEffect(() => {
    if (id) {
      loadDispute();
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dispute?.negotiation?.messages]);

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
      const res = await disputeApi.resolveDispute(id, { 
        resolution, 
        refundDeposit: refundDeposit >= 0 ? refundDeposit : undefined 
      });
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

  const handleMakeOffer = async () => {
    if (!id) return;
    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效的赔偿金额');
      return;
    }
    setSubmitting(true);
    try {
      const res = await disputeApi.makeOffer(id, { amount, message: offerMessage || undefined });
      if (res.success) {
        setOfferAmount('');
        setOfferMessage('');
        loadDispute();
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!id || !dispute?.negotiation?.lastOfferAmount) return;
    if (!confirm(`确认接受赔偿金额 ¥${dispute.negotiation.lastOfferAmount}？`)) return;
    setSubmitting(true);
    try {
      const res = await disputeApi.acceptOffer(id, { amount: dispute.negotiation.lastOfferAmount });
      if (res.success) {
        alert('已接受报价，赔偿协商完成！');
        loadDispute();
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !msgContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await disputeApi.sendMessage(id, { content: msgContent.trim() });
      if (res.success) {
        setMsgContent('');
        loadDispute();
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      const res = await disputeApi.escalateDispute(id, { reason: escalateReason || undefined });
      if (res.success) {
        setShowEscalateModal(false);
        setEscalateReason('');
        alert('已申请管理员介入');
        loadDispute();
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = user && 'role' in user && (user as any).role === 'admin';
  const order = dispute?.order as BorrowOrderWithDetails | undefined;
  const orderTitle = order ? ('item' in order ? order.item.title : '') : '';
  const borrowOrder = dispute?.orderType === 'borrow' ? (dispute.order as BorrowOrderWithDetails) : null;
  const deposit = borrowOrder?.deposit || 0;

  const isLender = user?.id === dispute?.complainantId;
  const isBorrower = user?.id === dispute?.respondentId;
  const isParty = isLender || isBorrower;

  const negotiationStatusText: Record<NegotiationStatus, { text: string; color: string }> = {
    awaiting_lender_offer: { text: '等待出借方提出赔偿金额', color: 'orange' },
    awaiting_borrower_response: { text: '等待借入方回应', color: 'blue' },
    awaiting_lender_confirmation: { text: '等待出借方确认', color: 'purple' },
    agreed: { text: '已达成一致', color: 'green' },
    escalated: { text: '管理员处理中', color: 'red' },
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待处理', color: 'orange' },
      negotiating: { text: '协商中', color: 'blue' },
      reviewing: { text: '审核中', color: 'purple' },
      resolved: { text: '已解决', color: 'green' },
    };
    return statusMap[status] || { text: status, color: 'gray' };
  };

  const getNegotiationStatus = () => {
    if (!dispute?.negotiation) return null;
    const status = dispute.negotiation.status;
    return negotiationStatusText[status];
  };

  const getSenderInfo = (msg: NegotiationMessage) => {
    if (msg.senderId === dispute?.complainantId) {
      return { name: dispute.complainant.nickname, avatar: dispute.complainant.avatar, role: '出借方', isMe: msg.senderId === user?.id };
    }
    if (msg.senderId === dispute?.respondentId) {
      return { name: dispute.respondent.nickname, avatar: dispute.respondent.avatar, role: '借入方', isMe: msg.senderId === user?.id };
    }
    return { name: '管理员', avatar: '', role: '管理员', isMe: false };
  };

  const canMakeOffer = dispute?.status === 'negotiating' && isParty;
  const canAccept = 
    dispute?.status === 'negotiating' && 
    dispute.negotiation?.lastOfferAmount !== undefined &&
    dispute.negotiation.lastOfferBy !== user?.id &&
    isParty;
  const canEscalate = dispute?.status === 'negotiating' && isParty;

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  if (!dispute) {
    return <div className="container">纠纷不存在</div>;
  }

  const statusInfo = getStatusText(dispute.status);
  const negStatus = getNegotiationStatus();
  const isDamage = dispute.category === 'damage';

  return (
    <div className="container dispute-detail-page">
      <div className="breadcrumb">
        <Link to="/disputes">纠纷中心</Link> / <span>纠纷详情</span>
      </div>

      <div className="dispute-detail-header">
        <div>
          <h1>
            {isDamage ? '🔧 物品损坏赔偿协商' : '纠纷详情'}
          </h1>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <span className={`tag tag-${statusInfo.color}`}>{statusInfo.text}</span>
            {negStatus && dispute.status === 'negotiating' && (
              <span className={`tag tag-${negStatus.color}`}>
                💬 {negStatus.text}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="dispute-detail-content">
        <div className="dispute-main">
          {isDamage && borrowOrder && (
            <div className="dispute-info-card damage-card">
              <div className="damage-header">
                <h3>📋 损坏情况</h3>
              </div>
              <div className="damage-info-grid">
                <div className="info-item">
                  <span className="info-label">押金金额</span>
                  <span className="info-value deposit">¥{deposit}</span>
                </div>
                {dispute.negotiation?.acceptedAmount !== undefined && (
                  <>
                    <div className="info-item">
                      <span className="info-label">赔偿金额</span>
                      <span className="info-value compensation">¥{dispute.negotiation.acceptedAmount}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">退还押金</span>
                      <span className="info-value refund">¥{deposit - dispute.negotiation.acceptedAmount}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="damage-description">
                <h4>损坏描述</h4>
                <p>{dispute.description}</p>
              </div>
              {dispute.evidence && dispute.evidence.length > 0 && (
                <div className="damage-evidence">
                  <h4>📷 照片凭证</h4>
                  <div className="evidence-photos">
                    {dispute.evidence.map((photo, index) => (
                      <div key={index} className="evidence-photo">
                        <img src={photo} alt={`损坏照片${index + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isDamage && (
            <div className="dispute-info-card">
              <h3>纠纷原因</h3>
              <p className="dispute-reason">{dispute.reason}</p>
              <h3 className="mt-4">详细描述</h3>
              <p className="dispute-description">{dispute.description}</p>
            </div>
          )}

          {dispute.evidence && dispute.evidence.length > 0 && !isDamage && (
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

          <div className="dispute-info-card">
            <div className="card-header">
              <h3>💬 协商消息</h3>
              {dispute.negotiation && (
                <span className="message-count">{dispute.negotiation.messages.length} 条消息</span>
              )}
            </div>
            <div className="negotiation-messages">
              {dispute.negotiation?.messages.map((msg) => {
                const sender = getSenderInfo(msg);
                return (
                  <div 
                    key={msg.id} 
                    className={`message-item ${sender.isMe ? 'me' : 'other'}`}
                  >
                    {!sender.isMe && (
                      <img src={sender.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'} alt="" className="msg-avatar" />
                    )}
                    <div className="msg-content-wrap">
                      {!sender.isMe && (
                        <div className="msg-sender">
                          {sender.name} <span className="msg-role">({sender.role})</span>
                        </div>
                      )}
                      <div className={`msg-bubble ${sender.isMe ? 'bubble-me' : 'bubble-other'}`}>
                        <p>{msg.content}</p>
                        {msg.amount !== undefined && (
                          <div className="msg-amount">
                            💰 赔偿报价：<strong>¥{msg.amount}</strong>
                          </div>
                        )}
                      </div>
                      <div className="msg-time">
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {sender.isMe && (
                      <img src={user?.avatar || ''} alt="" className="msg-avatar" />
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {dispute.status === 'negotiating' && isParty && (
              <form onSubmit={handleSendMessage} className="message-input-area">
                <textarea
                  className="form-textarea"
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  placeholder="输入协商消息..."
                  rows={2}
                  disabled={submitting}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting || !msgContent.trim()}
                >
                  发送
                </button>
              </form>
            )}
          </div>

          {dispute.resolution && (
            <div className="dispute-info-card resolution-card">
              <h3>🏆 处理结果</h3>
              <p className="resolution-text">{dispute.resolution}</p>
              {dispute.negotiation?.acceptedAmount !== undefined && borrowOrder && (
                <div className="resolution-summary">
                  <div className="res-row">
                    <span>押金总额</span>
                    <span>¥{deposit}</span>
                  </div>
                  <div className="res-row deduct">
                    <span>扣除赔偿</span>
                    <span>- ¥{dispute.negotiation.acceptedAmount}</span>
                  </div>
                  <div className="res-row total">
                    <span>退还借入方</span>
                    <span>¥{deposit - dispute.negotiation.acceptedAmount}</span>
                  </div>
                </div>
              )}
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
                <p className="party-role">
                  {isDamage ? '出借方（损坏报备方）' : '申诉方'}
                </p>
              </div>
            </div>
            <div className="party-row respondent">
              <img src={dispute.respondent.avatar} alt="" className="avatar" />
              <div>
                <p className="party-name">{dispute.respondent.nickname}</p>
                <p className="party-role">
                  {isDamage ? '借入方' : '被诉方'}
                </p>
              </div>
            </div>
          </div>

          {dispute.status === 'negotiating' && isDamage && borrowOrder && (
            <div className="negotiation-actions-card">
              <h3>💰 赔偿协商</h3>
              
              {dispute.negotiation?.lenderOffer !== undefined && (
                <div className="offer-row lender-offer">
                  <span className="offer-label">出借方报价</span>
                  <span className="offer-amount">¥{dispute.negotiation.lenderOffer}</span>
                </div>
              )}
              {dispute.negotiation?.borrowerOffer !== undefined && (
                <div className="offer-row borrower-offer">
                  <span className="offer-label">借入方报价</span>
                  <span className="offer-amount">¥{dispute.negotiation.borrowerOffer}</span>
                </div>
              )}

              {canMakeOffer && (
                <div className="offer-input-section">
                  <div className="form-group">
                    <label className="form-label">
                      {isLender ? '提出赔偿金额' : '提出可接受的赔偿金额'}
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      placeholder={`最高不超过押金 ¥${deposit}`}
                      min="1"
                      max={deposit}
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">说明（可选）</label>
                    <input
                      type="text"
                      className="form-input"
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      placeholder="简要说明..."
                      disabled={submitting}
                    />
                  </div>
                  <button
                    className="btn btn-primary w-full"
                    onClick={handleMakeOffer}
                    disabled={submitting || !offerAmount}
                  >
                    {submitting ? '提交中...' : '提交报价'}
                  </button>
                </div>
              )}

              {canAccept && (
                <div className="accept-section">
                  <div className="current-offer">
                    <p>对方最新报价：</p>
                    <p className="offer-price">¥{dispute.negotiation!.lastOfferAmount}</p>
                  </div>
                  <button
                    className="btn btn-success w-full"
                    onClick={handleAcceptOffer}
                    disabled={submitting}
                  >
                    ✅ 接受此报价
                  </button>
                </div>
              )}

              {canEscalate && (
                <button
                  className="btn btn-outline-danger w-full mt-2"
                  onClick={() => setShowEscalateModal(true)}
                >
                  ⚖️ 申请管理员介入
                </button>
              )}
            </div>
          )}

          {isAdmin && (
            <div className="admin-actions-card">
              <h3>🛡️ 管理员操作</h3>
              {(dispute.status === 'pending' || dispute.status === 'negotiating') && (
                <button
                  className="btn btn-primary w-full"
                  onClick={handleStartReview}
                >
                  开始审核
                </button>
              )}
              {(dispute.status === 'reviewing') && (
                <>
                  <div className="form-group">
                    <label className="form-label">处理结果</label>
                    <textarea
                      className="form-textarea"
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="请输入处理结果说明..."
                      rows={3}
                    />
                  </div>
                  {isDamage && borrowOrder && (
                    <div className="form-group">
                      <label className="form-label">
                        退还押金（押金：¥{deposit}）
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={refundDeposit}
                        onChange={(e) => setRefundDeposit(parseFloat(e.target.value) || 0)}
                        min="0"
                        max={deposit}
                      />
                      <small className="text-muted">
                        系统将自动计算赔偿金额：押金 ¥{deposit} - 退还 ¥{refundDeposit} = 赔偿 ¥{deposit - refundDeposit}
                      </small>
                    </div>
                  )}
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

      {showEscalateModal && (
        <div className="modal-overlay" onClick={() => setShowEscalateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>申请管理员介入</h3>
              <button className="modal-close" onClick={() => setShowEscalateModal(false)}>
                ×
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <div className="form-group">
                <label className="form-label">原因说明（可选）</label>
                <textarea
                  className="form-textarea"
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="请简要说明申请仲裁的原因..."
                  rows={3}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEscalateModal(false)}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleEscalate}
                  disabled={submitting}
                >
                  {submitting ? '提交中...' : '确认申请'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          margin: 0;
        }
        .dispute-detail-content {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
        }
        .dispute-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .dispute-info-card,
        .parties-card,
        .admin-actions-card,
        .negotiation-actions-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .card-header h3 {
          margin: 0;
          font-size: 16px;
        }
        .message-count {
          font-size: 12px;
          color: #999;
          background: #f5f5f5;
          padding: 2px 10px;
          border-radius: 12px;
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
        .damage-card {
          border-left: 4px solid #ff4d4f;
        }
        .damage-header h3 {
          color: #ff4d4f;
        }
        .damage-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        .info-item {
          background: #fafafa;
          padding: 12px;
          border-radius: 8px;
        }
        .info-label {
          display: block;
          font-size: 12px;
          color: #999;
          margin-bottom: 4px;
        }
        .info-value {
          font-size: 18px;
          font-weight: 600;
        }
        .info-value.deposit {
          color: #667eea;
        }
        .info-value.compensation {
          color: #ff4d4f;
        }
        .info-value.refund {
          color: #52c41a;
        }
        .damage-description h4,
        .damage-evidence h4 {
          font-size: 14px;
          margin-bottom: 8px;
          color: #666;
        }
        .damage-description p {
          background: #fff1f0;
          padding: 12px;
          border-radius: 8px;
          color: #333;
          line-height: 1.6;
        }
        .evidence-photos {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 10px;
        }
        .evidence-photo {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f5;
        }
        .evidence-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
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
        .negotiation-messages {
          max-height: 400px;
          overflow-y: auto;
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .message-item {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
          align-items: flex-start;
        }
        .message-item.me {
          flex-direction: row-reverse;
        }
        .msg-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          flex-shrink: 0;
          background: #f0f0f0;
        }
        .msg-content-wrap {
          max-width: 70%;
        }
        .message-item.me .msg-content-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .msg-sender {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        .msg-role {
          color: #999;
        }
        .msg-bubble {
          padding: 10px 14px;
          border-radius: 12px;
          line-height: 1.5;
        }
        .bubble-me {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .bubble-other {
          background: white;
          border: 1px solid #e8e8e8;
          border-bottom-left-radius: 4px;
        }
        .msg-bubble p {
          margin: 0;
        }
        .msg-amount {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255,255,255,0.2);
          font-size: 14px;
        }
        .bubble-other .msg-amount {
          border-top-color: #e8e8e8;
          color: #ff4d4f;
        }
        .msg-time {
          font-size: 11px;
          color: #bbb;
          margin-top: 4px;
        }
        .message-input-area {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }
        .message-input-area .form-textarea {
          flex: 1;
        }
        .offer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .lender-offer {
          background: #fff1f0;
          border: 1px solid #ffccc7;
        }
        .borrower-offer {
          background: #e6f7ff;
          border: 1px solid #91d5ff;
        }
        .offer-label {
          font-size: 13px;
          color: #666;
        }
        .offer-amount {
          font-size: 18px;
          font-weight: 600;
          color: #ff4d4f;
        }
        .offer-input-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }
        .accept-section {
          margin-top: 16px;
          padding: 16px;
          background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
          border-radius: 8px;
        }
        .current-offer p {
          margin: 0 0 4px;
          font-size: 13px;
          color: #666;
        }
        .offer-price {
          font-size: 24px;
          font-weight: 700;
          color: #52c41a;
          margin: 0 0 12px;
        }
        .dispute-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .parties-card h3,
        .admin-actions-card h3,
        .negotiation-actions-card h3 {
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
          margin: 0;
        }
        .party-role {
          font-size: 12px;
          color: #999;
          margin: 2px 0 0;
        }
        .resolution-card {
          background: #f6ffed;
          border: 1px solid #b7eb8f;
        }
        .resolution-text {
          color: #389e0d;
          line-height: 1.8;
        }
        .resolution-summary {
          margin-top: 16px;
          padding: 16px;
          background: white;
          border-radius: 8px;
        }
        .res-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 14px;
        }
        .res-row.deduct {
          color: #ff4d4f;
          border-top: 1px solid #f5f5f5;
          border-bottom: 1px solid #f5f5f5;
          padding: 10px 0;
          margin: 4px 0;
        }
        .res-row.total {
          font-weight: 600;
          font-size: 16px;
          color: #52c41a;
          padding-top: 10px;
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
        .form-input,
        .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
          font-family: inherit;
        }
        .form-textarea {
          resize: vertical;
          min-height: 60px;
        }
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .btn-secondary {
          background: #f5f5f5;
          color: #666;
        }
        .btn-success {
          background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
          color: white;
        }
        .btn-danger {
          background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
          color: white;
        }
        .btn-warning {
          background: linear-gradient(135deg, #faad14 0%, #d48806 100%);
          color: white;
        }
        .btn-outline-danger {
          background: white;
          color: #ff4d4f;
          border: 1px solid #ff4d4f;
        }
        .btn-outline-danger:hover {
          background: #fff1f0;
        }
        .tag {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .tag-orange {
          background: #fff7e6;
          color: #d46b08;
        }
        .tag-blue {
          background: #e6f7ff;
          color: #0958d9;
        }
        .tag-green {
          background: #f6ffed;
          color: #389e0d;
        }
        .tag-red {
          background: #fff1f0;
          color: #cf1322;
        }
        .tag-gray {
          background: #f5f5f5;
          color: #666;
        }
        .tag-purple {
          background: #f9f0ff;
          color: #531dab;
        }
        .mt-2 {
          margin-top: 8px !important;
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
        .modal {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #f0f0f0;
        }
        .modal-header h3 {
          font-size: 18px;
          margin: 0;
        }
        .modal-close {
          font-size: 24px;
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
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
