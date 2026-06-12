import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api';

function Register() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    neighborhood: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.register({
        phone: formData.phone,
        email: formData.email,
        nickname: formData.nickname,
        password: formData.password,
        neighborhood: formData.neighborhood,
      });
      if (res.success) {
        login(res.data.token, res.data.user);
        navigate('/');
      } else {
        setError(res.message || '注册失败');
      }
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-brand">
            <span className="brand-icon">🤝</span>
            <h1>邻里共享</h1>
            <p>邻里物品共享与技能交换时间银行平台</p>
          </div>
          <div className="auth-features">
            <div className="auth-feature">
              <span>🎁</span>
              <span>注册即送10时间币</span>
            </div>
            <div className="auth-feature">
              <span>📦</span>
              <span>闲置物品共享</span>
            </div>
            <div className="auth-feature">
              <span>⚡</span>
              <span>技能时间交换</span>
            </div>
            <div className="auth-feature">
              <span>⭐</span>
              <span>信用评分体系</span>
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-form-card">
            <h2>创建账号</h2>
            <p className="auth-subtitle">加入邻里共享，开启共享生活</p>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">昵称</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="请输入昵称"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">手机号</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入手机号"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">邮箱</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="请输入邮箱"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">所在小区</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="请输入所在小区名称"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">密码</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="请输入密码"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">确认密码</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="请再次输入密码"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? '注册中...' : '注册'}
              </button>
            </form>
            <div className="auth-footer">
              已有账号？
              <Link to="/login" className="auth-link">
                立即登录
              </Link>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        .auth-container {
          display: flex;
          width: 100%;
          max-width: 900px;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }
        .auth-left {
          flex: 1;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 60px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .auth-brand .brand-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }
        .auth-brand h1 {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .auth-brand p {
          opacity: 0.8;
        }
        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .auth-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
        }
        .auth-feature span:first-child {
          font-size: 20px;
        }
        .auth-right {
          flex: 1;
          padding: 40px;
          max-height: 100vh;
          overflow-y: auto;
        }
        .auth-form-card h2 {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .auth-subtitle {
          color: #999;
          margin-bottom: 24px;
        }
        .auth-error {
          background: #fff1f0;
          color: #ff4d4f;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .auth-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #666;
        }
        .auth-link {
          color: #667eea;
          font-weight: 500;
        }
        @media (max-width: 768px) {
          .auth-left {
            display: none;
          }
          .auth-right {
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
}

export default Register;
