import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { demandApi } from '../api';
import type { DemandWithDetails, DemandOrderWithDetails } from '../types';

type TabType = 'published' | 'responded' | 'orders';

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

function MyDemands() {
  const [activeTab, setActiveTab] = useState<TabType>('published');
  const [publishedDemands, setPublishedDemands] = useState<DemandWithDetails[]>([]);
  const [respondedDemands, setRespondedDemands] = useState<DemandWithDetails[]>([]);
  const [requesterOrders, setRequesterOrders] = useState<DemandOrderWithDetails[]>([]);
  const [responderOrders, setResponderOrders] = useState<DemandOrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderRole, setOrderRole] = useState<'requester' | 'responder'>('requester');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab, orderRole]);

  const loadData = async () => {
    setLoading(true);
    const [publishedRes, respondedRes] = await Promise.all([
      demandApi.getMyDemands(),
      demandApi.getMyRespondedDemands(),
    ]);
    if (publishedRes.success) {
      setPublishedDemands(publishedRes.data || []);
    }
    if (respondedRes.success) {
      setRespondedDemands(respondedRes.data || []);
    }
    setLoading(false);
  };

  const loadOrders = async () => {
    const res = await demandApi.getMyOrders(orderRole);
    if (res.success) {
      if (orderRole === 'requester') {
        setRequesterOrders(res.data || []);
      } else {
        setResponderOrders(res.data || []);
      }
    }
  };

  const handleStartOrder = async (orderId: string) => {
    if (!confirm('确认开始服务吗？')) return;
    const res = await demandApi.startOrder(orderId);
    if (res.success) {
      alert('服务已开始');
      loadOrders();
    } else {
      alert(res.message || '操作失败');
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    if (!confirm('确认完成服务吗？完成后将支付时间币给响应者。')) return;
    const res = await demandApi.completeOrder(orderId);
    if (res.success) {
      alert('服务已完成，时间币已支付');
      loadOrders();
    } else {
      alert(res.message || '操作失败');
    }
  };

  const renderDemandCard = (demand: DemandWithDetails) => (
    <Link key={demand.id} to={`/demands/${demand.id}`} className="demand-card">
      <div className="demand-header">
        <div className="demand-type-badge">
          {demand.type === 'item' ? '🔧 物品' : '🛠️ 服务'}
        </div>
        <span className={`tag tag-${statusColor[demand.status]}`}>
          {statusText[demand.status]}
        </span>
        <span className={`urgency-tag urgency-${urgencyColor[demand.urgency]}`}>
          {urgencyText[demand.urgency]}
        </span>
      </div>
      <div className="demand-info">
        <h3 className="demand-title">{demand.title}</h3>
        <p className="demand-desc">{demand.description}</p>
        <div className="demand-category-tag">{demand.category}</div>
        <div className="demand-footer">
          <span className="demand-reward">⏰ {demand.timeCoinReward} 时间币</span>
          <span className="demand-stats">
            <span>💬 {demand.responses.filter(r => r.status === 'pending' || r.status === 'accepted').length} 响应</span>
          </span>
        </div>
      </div>
    </Link>
  );

  const renderOrderCard = (order: DemandOrderWithDetails) => (
    <div key={order.id} className="order-card">
      <div className="order-header">
        <Link to={`/demands/${order.demandId}`} className="order-title">
          {order.demand?.title || '需求详情'}
        </Link>
        <span className={`tag tag-${statusColor[order.status]}`}>
          {statusText[order.status]}
        </span>
      </div>
      <div className="order-body">
        <div className="order-parties">
          {orderRole === 'requester' ? (
            <div className="party-info">
              <span className="party-label">响应者：</span>
              <img src={order.responder?.avatar} alt="" className="avatar" />
              <span>{order.responder?.nickname}</span>
            </div>
          ) : (
            <div className="party-info">
              <span className="party-label">发布者：</span>
              <img src={order.requester?.avatar} alt="" className="avatar" />
              <span>{order.requester?.nickname}</span>
            </div>
          )}
        </div>
        <div className="order-reward">
          报酬：<strong>⏰ {order.timeCoinReward} 时间币</strong>
        </div>
        <div className="order-timeline">
          {order.timeline?.slice(-3).map((event, index) => (
            <div key={index} className="timeline-item">
              <span className="timeline-time">
                {new Date(event.time).toLocaleString()}
              </span>
              <span className="timeline-event">{event.event}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="order-actions">
        {order.status === 'confirmed' && (
          <button
            className="btn btn-primary"
            onClick={() => handleStartOrder(order.id)}
          >
            开始服务
          </button>
        )}
        {order.status === 'in_progress' && orderRole === 'requester' && (
          <button
            className="btn btn-success"
            onClick={() => handleCompleteOrder(order.id)}
          >
            确认完成
          </button>
        )}
        <Link to={`/demands/${order.demandId}`} className="btn btn-secondary">
          查看详情
        </Link>
      </div>
    </div>
  );

  const tabs = [
    { key: 'published', label: '我发布的', count: publishedDemands.length },
    { key: 'responded', label: '我响应的', count: respondedDemands.length },
    { key: 'orders', label: '需求订单' },
  ];

  return (
    <div className="container my-demands-page">
      <div className="page-header">
        <h1>我的需求</h1>
        <Link to="/publish/demand" className="btn btn-primary">
          + 发布需求
        </Link>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <>
          {activeTab === 'published' && (
            publishedDemands.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <p>您还没有发布任何需求</p>
                <Link to="/publish/demand" className="btn btn-primary">
                  立即发布
                </Link>
              </div>
            ) : (
              <div className="demand-grid">
                {publishedDemands.map(renderDemandCard)}
              </div>
            )
          )}

          {activeTab === 'responded' && (
            respondedDemands.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <p>您还没有响应任何需求</p>
                <Link to="/demands" className="btn btn-primary">
                  去看看
                </Link>
              </div>
            ) : (
              <div className="demand-grid">
                {respondedDemands.map(renderDemandCard)}
              </div>
            )
          )}

          {activeTab === 'orders' && (
            <>
              <div className="role-tabs">
                <button
                  className={`role-tab ${orderRole === 'requester' ? 'active' : ''}`}
                  onClick={() => setOrderRole('requester')}
                >
                  作为发布者
                </button>
                <button
                  className={`role-tab ${orderRole === 'responder' ? 'active' : ''}`}
                  onClick={() => setOrderRole('responder')}
                >
                  作为响应者
                </button>
              </div>
              {orderRole === 'requester' ? (
                requesterOrders.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <p>暂无需求订单</p>
                  </div>
                ) : (
                  <div className="orders-list">
                    {requesterOrders.map(renderOrderCard)}
                  </div>
                )
              ) : (
                responderOrders.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <p>暂无需求订单</p>
                  </div>
                ) : (
                  <div className="orders-list">
                    {responderOrders.map(renderOrderCard)}
                  </div>
                )
              )}
            </>
          )}
        </>
      )}

      <style>{`
        .my-demands-page {
          padding-top: 0;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 28px;
        }
        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: white;
          padding: 8px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .tab-btn {
          padding: 10px 24px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          color: #666;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tab-btn:hover {
          background: #f5f5f5;
        }
        .tab-btn.active {
          background: #667eea;
          color: white;
        }
        .tab-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
        }
        .tab-btn:not(.active) .tab-count {
          background: #f0f0f0;
          color: #666;
        }
        .role-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }
        .role-tab {
          padding: 8px 20px;
          border: 1px solid #d9d9d9;
          background: white;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          color: #666;
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
        .demand-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .demand-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
        }
        .demand-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .demand-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fafafa;
          border-bottom: 1px solid #f0f0f0;
          flex-wrap: wrap;
        }
        .demand-type-badge {
          font-size: 12px;
          font-weight: 500;
          color: #667eea;
          background: #f0f2ff;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .tag {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
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
          margin-left: auto;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
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
        .demand-info {
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .demand-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .demand-desc {
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
          height: 42px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .demand-category-tag {
          display: inline-block;
          font-size: 12px;
          color: #666;
          background: #f5f5f5;
          padding: 2px 8px;
          border-radius: 4px;
          margin-bottom: 12px;
          align-self: flex-start;
        }
        .demand-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }
        .demand-reward {
          color: #fa8c16;
          font-weight: 600;
          font-size: 14px;
        }
        .demand-stats {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #999;
        }
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .order-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 16px;
        }
        .order-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          text-decoration: none;
        }
        .order-title:hover {
          color: #667eea;
        }
        .order-body {
          margin-bottom: 16px;
        }
        .order-parties {
          display: flex;
          gap: 24px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .party-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        .party-label {
          color: #666;
        }
        .party-info .avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .order-reward {
          font-size: 14px;
          margin-bottom: 12px;
        }
        .order-reward strong {
          color: #fa8c16;
          font-size: 16px;
        }
        .order-timeline {
          background: #fafafa;
          border-radius: 8px;
          padding: 12px 16px;
        }
        .timeline-item {
          display: flex;
          gap: 12px;
          padding: 4px 0;
          font-size: 13px;
        }
        .timeline-time {
          color: #999;
          min-width: 160px;
        }
        .timeline-event {
          color: #333;
        }
        .order-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .btn-success {
          background: #52c41a;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-success:hover {
          background: #73d13d;
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
        .empty-state p {
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .demand-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .tabs {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}

export default MyDemands;
