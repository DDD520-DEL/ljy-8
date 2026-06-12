import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: '首页' },
    { path: '/items', label: '物品共享' },
    { path: '/skills', label: '技能交换' },
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
                <Link to="/orders" className="nav-link">
                  我的订单
                </Link>
                <Link to="/disputes" className="nav-link">
                  纠纷中心
                </Link>
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
        @media (max-width: 768px) {
          .nav {
            display: none;
          }
          .user-name {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default Layout;
