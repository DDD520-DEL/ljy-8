import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { itemApi, skillApi } from '../api';
import type { ItemWithOwner, SkillWithProvider } from '../types';

function Home() {
  const [items, setItems] = useState<ItemWithOwner[]>([]);
  const [skills, setSkills] = useState<SkillWithProvider[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [itemsRes, skillsRes] = await Promise.all([
      itemApi.getItems(),
      skillApi.getSkills(),
    ]);
    if (itemsRes.success) setItems(itemsRes.data?.slice(0, 4) || []);
    if (skillsRes.success) setSkills(skillsRes.data?.slice(0, 4) || []);
  };

  const itemCategories = [
    { name: '工具', icon: '🔧', color: '#1890ff' },
    { name: '家电', icon: '📺', color: '#52c41a' },
    { name: '运动器材', icon: '⚽', color: '#fa8c16' },
    { name: '图书', icon: '📚', color: '#722ed1' },
  ];

  const skillCategories = [
    { name: '维修服务', icon: '🔨', color: '#eb2f96' },
    { name: '家政服务', icon: '🧹', color: '#13c2c2' },
    { name: '教学辅导', icon: '🎓', color: '#faad14' },
    { name: '创意设计', icon: '🎨', color: '#f5222d' },
  ];

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">邻里共享，让生活更美好</h1>
            <p className="hero-subtitle">
              闲置物品共享 · 技能时间交换 · 共建和谐社区
            </p>
            <div className="hero-buttons">
              <Link to="/items" className="btn btn-primary btn-lg">
                浏览物品
              </Link>
              <Link to="/skills" className="btn btn-secondary btn-lg">
                发现技能
              </Link>
            </div>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">{items.length + 50}+</span>
              <span className="stat-label">共享物品</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{skills.length + 30}+</span>
              <span className="stat-label">技能服务</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">1000+</span>
              <span className="stat-label">邻里用户</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">物品分类</h2>
          <div className="category-grid">
            {itemCategories.map((cat) => (
              <Link
                key={cat.name}
                to={`/items?category=${cat.name}`}
                className="category-card"
              >
                <span className="category-icon" style={{ background: cat.color + '20', color: cat.color }}>
                  {cat.icon}
                </span>
                <span className="category-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-gray">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">热门物品</h2>
            <Link to="/items" className="section-more">
              查看更多 →
            </Link>
          </div>
          <div className="item-grid">
            {items.map((item) => (
              <Link key={item.id} to={`/items/${item.id}`} className="item-card">
                <div className="item-image">
                  {item.images[0] ? (
                    <img src={item.images[0]} alt={item.title} />
                  ) : (
                    <div className="item-placeholder">📦</div>
                  )}
                  <span className={`tag tag-${item.status === 'available' ? 'green' : 'orange'}`}>
                    {item.status === 'available' ? '可借用' : '借出中'}
                  </span>
                </div>
                <div className="item-info">
                  <h3 className="item-title">{item.title}</h3>
                  <p className="item-desc">{item.description}</p>
                  <div className="item-footer">
                    <span className="item-price">押金 ¥{item.deposit}</span>
                    <span className="item-views">👁 {item.viewCount}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">技能分类</h2>
          <div className="category-grid">
            {skillCategories.map((cat) => (
              <Link
                key={cat.name}
                to={`/skills?category=${cat.name}`}
                className="category-card"
              >
                <span className="category-icon" style={{ background: cat.color + '20', color: cat.color }}>
                  {cat.icon}
                </span>
                <span className="category-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-gray">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">热门技能</h2>
            <Link to="/skills" className="section-more">
              查看更多 →
            </Link>
          </div>
          <div className="skill-grid">
            {skills.map((skill) => (
              <Link key={skill.id} to={`/skills/${skill.id}`} className="skill-card">
                <div className="skill-image">
                  {skill.images[0] ? (
                    <img src={skill.images[0]} alt={skill.title} />
                  ) : (
                    <div className="skill-placeholder">💡</div>
                  )}
                </div>
                <div className="skill-info">
                  <h3 className="skill-title">{skill.title}</h3>
                  <p className="skill-desc">{skill.description}</p>
                  <div className="skill-footer">
                    <span className="skill-price">⏰ {skill.timeCoinPrice} 时间币</span>
                    <span className="skill-duration">约 {skill.serviceDuration} 分钟</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section features-section">
        <div className="container">
          <h2 className="section-title text-center">平台特色</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>信用保障</h3>
              <p>完善的信用评分体系，让交易更安心</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏱️</div>
              <h3>时间银行</h3>
              <p>用时间币交换技能，让时间更有价值</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏠</div>
              <h3>邻里互助</h3>
              <p>认识身边的邻居，共建温暖社区</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚖️</div>
              <h3>纠纷仲裁</h3>
              <p>专业仲裁流程，保障双方权益</p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 80px 0;
          margin-bottom: 40px;
        }
        .hero-content {
          text-align: center;
          margin-bottom: 40px;
        }
        .hero-title {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .hero-subtitle {
          font-size: 20px;
          opacity: 0.9;
          margin-bottom: 32px;
        }
        .hero-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
        }
        .btn-lg {
          padding: 14px 32px;
          font-size: 16px;
        }
        .hero-stats {
          display: flex;
          justify-content: center;
          gap: 60px;
        }
        .stat-item {
          text-align: center;
        }
        .stat-number {
          display: block;
          font-size: 36px;
          font-weight: 700;
        }
        .stat-label {
          font-size: 14px;
          opacity: 0.8;
        }
        .section {
          padding: 40px 0;
        }
        .section-gray {
          background: #f5f7fa;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .section-title {
          font-size: 28px;
          margin-bottom: 24px;
        }
        .section-title.text-center {
          text-align: center;
        }
        .section-more {
          color: #667eea;
          font-size: 14px;
        }
        .text-center {
          text-align: center;
        }
        .category-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .category-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          background: white;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        .category-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin-bottom: 12px;
        }
        .category-name {
          font-size: 16px;
          font-weight: 500;
        }
        .item-grid,
        .skill-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .item-card,
        .skill-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
        }
        .item-card:hover,
        .skill-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        .item-image,
        .skill-image {
          position: relative;
          height: 160px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .item-image img,
        .skill-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .item-placeholder,
        .skill-placeholder {
          font-size: 48px;
        }
        .item-image .tag {
          position: absolute;
          top: 12px;
          left: 12px;
        }
        .item-info,
        .skill-info {
          padding: 16px;
        }
        .item-title,
        .skill-title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .item-desc,
        .skill-desc {
          font-size: 14px;
          color: #999;
          margin-bottom: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .item-footer,
        .skill-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .item-price {
          color: #ff4d4f;
          font-weight: 500;
        }
        .item-views {
          font-size: 12px;
          color: #999;
        }
        .skill-price {
          color: #667eea;
          font-weight: 500;
        }
        .skill-duration {
          font-size: 12px;
          color: #999;
        }
        .features-section {
          background: white;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .feature-card {
          text-align: center;
          padding: 32px 24px;
        }
        .feature-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .feature-card h3 {
          font-size: 18px;
          margin-bottom: 8px;
        }
        .feature-card p {
          font-size: 14px;
          color: #999;
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 32px;
          }
          .hero-stats {
            gap: 30px;
          }
          .stat-number {
            font-size: 24px;
          }
          .category-grid,
          .item-grid,
          .skill-grid,
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default Home;
