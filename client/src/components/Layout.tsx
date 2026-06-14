import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { notificationApi } from '../api';
import type { Notification } from '../types';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadUnreadCount = async () => {
    const res = await notificationApi.getUnreadCount();
    if (res.success) {
      setUnreadCount(res.data?.count || 0);
    }
  };

  const handleOpenNotifications = async () => {
    const res = await notificationApi.getNotifications();
    if (res.success) {
      setNotifications(res.data || []);
    }
    setShowNotifications(true);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_status':
        return '📦';
      case 'dispute_status':
        return '⚖️';
      case 'new_review':
        return '⭐';
      case 'queue_turn':
        return '🔔';
      case 'queue_expired':
        return '⏰';
      case 'queue_cancelled':
        return '❌';
      case 'system':
        return '📢';
      default:
        return '📧';
    }
  };

  const goToNotification = async (notification: Notification) => {
    if (!notification.read) {
      await notificationApi.markAsRead(notification.id);
      loadUnreadCount();
    }
    setShowNotifications(false);
    if (notification.relatedType === 'borrow_order' || notification.relatedType === 'service_order') {
      navigate(`/orders/${notification.relatedId}`);
    } else if (notification.relatedType === 'dispute') {
      navigate(`/disputes/${notification.relatedId}`);
    } else if (notification.relatedType === 'item') {
      navigate(`/items/${notification.relatedId}`);
    } else {
      navigate('/notifications');
    }
  };

  const navItems = [
    { path: '/', label: '首页' },
    { path: '/neighborhood', label: '邻里圈' },
    { path: '/items', label: '物品共享' },
    { path: '/skills', label: '技能交换' },
    { path: '/shop', label: '兑换商城' },
  ];

  return (
    <div className="layout">
      <header className="header">
        <div className="container header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">🤝</span>
            <span className="logo-text">邻里共享</span>
          </Link>
          <nav className="nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            {isAuthenticated ? (
              <div className="user-menu">
                {user?.role === 'admin' && (
                  <>
                    <Link to="/admin/dashboard" className="nav-link">
                      📊 数据看板
                    </Link>
                    <Link to="/admin/shop" className="nav-link">
                      🏪 商城管理
                    </Link>
                  </>
                )}
                <Link to="/orders" className="nav-link">
                  我的订单
                </Link>
                <Link to="/my-exchanges" className="nav-link">
                  🎁 我的兑换
                </Link>
                <Link to="/disputes" className="nav-link">
                  纠纷中心
                </Link>
                <div className="notification-wrapper">
                  <button
                    className="notification-btn"
                    onClick={handleOpenNotifications}
                  >
                    🔔
                    {unreadCount > 0 && (
                      <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                  </button>
                </div>
                <div className="user-info" onClick={() => navigate('/profile')}>
                  <img src={user?.avatar} alt="" className="avatar" />
                  <span className="user-name">{user?.nickname}</span>
                  <span className="time-coins">⏰ {user?.timeCoins || 0}</span>
                </div>
                <button className="btn btn-secondary" onClick={handleLogout}>
                  退出
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-secondary">
                  登录
                </Link>
                <Link to="/register" className="btn btn-primary">
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {showNotifications && (
        <div className="notification-popup-overlay" onClick={handleCloseNotifications}>
          <div className="notification-popup" onClick={(e) => e.stopPropagation()}>
            <div className="notification-popup-header">
              <h3>通知中心</h3>
              {unreadCount > 0 && (
                <button
                  className="btn-link"
                  onClick={async () => {
                    await notificationApi.markAllAsRead();
                    loadUnreadCount();
                    setNotifications(notifications.map((n) => ({ ...n, read: true })));
                  }}
                >
                  全部已读
                </button>
              )}
              <button className="popup-close" onClick={handleCloseNotifications}>
                ×
              </button>
            </div>
            <div className="notification-popup-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">暂无通知</div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-popup-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => goToNotification(notification)}
                  >
                    <span className="notification-type-icon">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="notification-popup-content">
                      <p className="notification-popup-title">{notification.title}</p>
                      <p className="notification-popup-message">{notification.message}</p>
                      <p className="notification-popup-time">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && <span className="unread-dot"></span>}
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="notification-popup-footer" onClick={() => {
                setShowNotifications(false);
                navigate('/notifications');
              }}>
                查看全部通知 →
              </div>
            )}
          </div>
        </div>
      )}

      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">
          <p>© 2024 邻里共享平台 - 让邻里更亲近</p>
        </div>
      </footer>
      <style>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .header {
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 600;
          color: #667eea;
        }
        .logo-icon {
          font-size: 28px;
        }
        .nav {
          display: flex;
          gap: 8px;
        }
        .nav-link {
          padding: 8px 16px;
          border-radius: 8px;
          color: #666;
          transition: all 0.2s;
          cursor: pointer;
        }
        .nav-link:hover,
        .nav-link.active {
          color: #667eea;
          background: #f0f2ff;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .user-menu {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .notification-wrapper {
          position: relative;
        }
        .notification-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
          position: relative;
        }
        .notification-btn:hover {
          background: #f0f2ff;
        }
        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background: #ff4d4f;
          color: white;
          border-radius: 10px;
          padding: 1px 6px;
          font-size: 11px;
          min-width: 16px;
          text-align: center;
          line-height: 1.2;
        }
        .notification-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
        }
        .notification-popup {
          position: fixed;
          top: 60px;
          right: calc((100% - 1200px) / 2 + 20px);
          width: 400px;
          max-height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .notification-popup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #f0f0f0;
        }
        .notification-popup-header h3 {
          font-size: 16px;
          margin: 0;
        }
        .btn-link {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          font-size: 13px;
        }
        .popup-close {
          background: none;
          border: none;
          font-size: 20px;
          color: #999;
          cursor: pointer;
        }
        .notification-popup-list {
          flex: 1;
          overflow-y: auto;
          max-height: 380px;
        }
        .notification-empty {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }
        .notification-popup-item {
          display: flex;
          gap: 12px;
          padding: 14px 20px;
          border-bottom: 1px solid #f5f5f5;
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
        }
        .notification-popup-item:hover {
          background: #fafafa;
        }
        .notification-popup-item.unread {
          background: #f0f7ff;
        }
        .notification-type-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        .notification-popup-content {
          flex: 1;
        }
        .notification-popup-message {
          font-size: 14px;
          color: #333;
          line-height: 1.5;
          margin-bottom: 4px;
        }
        .notification-popup-title {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          line-height: 1.4;
          margin-bottom: 4px;
        }
        .notification-popup-time {
          font-size: 12px;
          color: #999;
        }
        .unread-dot {
          width: 8px;
          height: 8px;
          background: #ff4d4f;
          border-radius: 50%;
          flex-shrink: 0;
          align-self: flex-start;
          margin-top: 6px;
        }
        .notification-popup-footer {
          padding: 12px 20px;
          text-align: center;
          color: #667eea;
          cursor: pointer;
          border-top: 1px solid #f0f0f0;
          font-size: 14px;
          transition: background 0.2s;
        }
        .notification-popup-footer:hover {
          background: #fafafa;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .user-info:hover {
          background: #f5f5f5;
        }
        .user-name {
          font-size: 14px;
          font-weight: 500;
        }
        .time-coins {
          font-size: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .auth-buttons {
          display: flex;
          gap: 8px;
        }
        .main {
          flex: 1;
          padding: 24px 0;
        }
        .footer {
          background: #2c3e50;
          color: #999;
          padding: 24px 0;
          text-align: center;
          font-size: 14px;
          margin-top: 40px;
        }
        @media (max-width: 1200px) {
          .notification-popup {
            right: 20px;
          }
        }
        @media (max-width: 768px) {
          .nav {
            display: none;
          }
          .user-name {
            display: none;
          }
          .notification-popup {
            width: calc(100% - 40px);
            right: 20px;
            left: 20px;
          }
        }
      `}</style>
    </div>
  );
}

export default Layout;
