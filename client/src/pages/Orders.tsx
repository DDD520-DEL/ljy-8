import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api';
import type { BorrowOrderWithDetails, ServiceOrderWithDetails } from '../types';

function Orders() {
  const [activeTab, setActiveTab] = useState<'borrow' | 'service'>('borrow');
  const [role, setRole] = useState<'all' | 'borrower' | 'lender' | 'client' | 'provider'>('all');
  const [borrowOrders, setBorrowOrders] = useState<BorrowOrderWithDetails[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrderWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'borrow') {
      loadBorrowOrders();
    } else {
      loadServiceOrders();
    }
  }, [activeTab, role]);

  const loadBorrowOrders = async () => {
    setLoading(true);
    const roleParam = role === 'all' ? undefined : (role as 'borrower' | 'lender');
    const res = await orderApi.getBorrowOrders(roleParam);
    if (res.success) {
      setBorrowOrders(res.data || []);
    }
    setLoading(false);
  };

  const loadServiceOrders = async () => {
    setLoading(true);
    const roleParam = role === 'all' ? undefined : (role as 'client' | 'provider');
    const res = await orderApi.getServiceOrders(roleParam);
    if (res.success) {
      setServiceOrders(res.data || []);
    }
    setLoading(false);
  };

  const getBorrowStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待确认', color: 'orange' },
      approved: { text: '已同意', color: 'blue' },
      rejected: { text: '已拒绝', color: 'red' },
      borrowing: { text: '借用中', color: 'green' },
      returned: { text: '已归还', color: 'gray' },
      disputed: { text: '纠纷中', color: 'red' },
    };
    return statusMap[status] || { text: status, color: 'gray' };
  };

  const getServiceStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待确认', color: 'orange' },
      approved: { text: '已同意', color: 'blue' },
      rejected: { text: '已拒绝', color: 'red' },
      in_progress: { text: '进行中', color: 'green' },
      completed: { text: '已完成', color: 'gray' },
      disputed: { text: '纠纷中', color: 'red' },
    };
    return statusMap[status] || { text: status, color: 'gray' };
  };

  return (
    <div className="container orders-page">
      <div className="page-header">
        <h1>我的订单</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'borrow' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('borrow');
            setRole('all');
          }}
        >
          借用订单
        </button>
        <button
          className={`tab ${activeTab === 'service' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('service');
            setRole('all');
          }}
        >
          服务订单
        </button>
      </div>

      <div className="role-tabs">
        <button
          className={`role-tab ${role === 'all' ? 'active' : ''}`}
          onClick={() => setRole('all')}
        >
          全部
        </button>
        {activeTab === 'borrow' ? (
          <>
            <button
              className={`role-tab ${role === 'borrower' ? 'active' : ''}`}
              onClick={() => setRole('borrower')}
            >
              我借入的
            </button>
            <button
              className={`role-tab ${role === 'lender' ? 'active' : ''}`}
              onClick={() => setRole('lender')}
            >
              我借出的
            </button>
          </>
        ) : (
          <>
            <button
              className={`role-tab ${role === 'client' ? 'active' : ''}`}
              onClick={() => setRole('client')}
            >
              我预约的
            </button>
            <button
              className={`role-tab ${role === 'provider' ? 'active' : ''}`}
              onClick={() => setRole('provider')}
            >
              我提供的
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : activeTab === 'borrow' ? (
        borrowOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>暂无借用订单</p>
            <Link to="/items" className="btn btn-primary mt-4">
              去浏览物品
            </Link>
          </div>
        ) : (
          <div className="order-list">
            {borrowOrders.map((order) => {
              const statusInfo = getBorrowStatusText(order.status);
              return (
                <Link
                  key={order.id}
                  to={`/orders/borrow/${order.id}`}
                  className="order-card"
                >
                  <div className="order-item-image">
                    {order.item.images[0] ? (
                      <img src={order.item.images[0]} alt="" />
                    ) : (
                      <div className="item-placeholder">📦</div>
                    )}
                  </div>
                  <div className="order-info">
                    <h3>{order.item.title}</h3>
                    <p className="order-meta">
                      押金：¥{order.deposit}
                    </p>
                    <p className="order-meta">
                      {order.borrower.nickname} → {order.lender.nickname}
                    </p>
                    <p className="order-dates">
                      {order.startDate?.split('T')[0]} ~ {order.endDate?.split('T')[0]}
                    </p>
                  </div>
                  <div className="order-status">
                    <span className={`tag tag-${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : serviceOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💡</div>
          <p>暂无服务订单</p>
          <Link to="/skills" className="btn btn-primary mt-4">
            去发现技能
          </Link>
        </div>
      ) : (
        <div className="order-list">
          {serviceOrders.map((order) => {
            const statusInfo = getServiceStatusText(order.status);
            return (
              <Link
                key={order.id}
                to={`/orders/service/${order.id}`}
                className="order-card"
              >
                <div className="order-item-image skill-image">
                  {order.skill.images[0] ? (
                    <img src={order.skill.images[0]} alt="" />
                  ) : (
                    <div className="item-placeholder">💡</div>
                  )}
                </div>
                <div className="order-info">
                  <h3>{order.skill.title}</h3>
                  <p className="order-meta">
                    价格：⏰ {order.timeCoinPrice} 时间币
                  </p>
                  <p className="order-meta">
                    {order.client.nickname} → {order.provider.nickname}
                  </p>
                  <p className="order-dates">
                    {order.serviceDate?.replace('T', ' ')}
                  </p>
                </div>
                <div className="order-status">
                  <span className={`tag tag-${statusInfo.color}`}>
                    {statusInfo.text}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        .orders-page {
          padding-top: 0;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 28px;
        }
        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          border-bottom: 2px solid #f0f0f0;
        }
        .tab {
          padding: 12px 24px;
          background: none;
          font-size: 16px;
          color: #666;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab:hover {
          color: #667eea;
        }
        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
          font-weight: 500;
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
        .order-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .order-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.2s;
        }
        .order-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          transform: translateX(4px);
        }
        .order-item-image {
          width: 100px;
          height: 100px;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .order-item-image.skill-image {
          background: linear-gradient(135deg, #667eea22 0%, #764ba222 100%);
        }
        .order-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .item-placeholder {
          font-size: 36px;
        }
        .order-info {
          flex: 1;
        }
        .order-info h3 {
          font-size: 16px;
          margin-bottom: 8px;
        }
        .order-meta {
          font-size: 14px;
          color: #666;
          margin-bottom: 4px;
        }
        .order-dates {
          font-size: 13px;
          color: #999;
        }
        .order-status {
          flex-shrink: 0;
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
        .mt-4 {
          margin-top: 16px;
        }
        @media (max-width: 768px) {
          .order-card {
            flex-direction: column;
            text-align: center;
          }
          .order-item-image {
            width: 100%;
            height: 150px;
          }
        }
      `}</style>
    </div>
  );
}

export default Orders;
