import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { itemApi, skillApi, announcementApi } from '../api';
import type { ItemWithOwner, SkillWithProvider, AnnouncementWithPublisher, AnnouncementCategory } from '../types';

function Home() {
  const [items, setItems] = useState<ItemWithOwner[]>([]);
  const [skills, setSkills] = useState<SkillWithProvider[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementWithPublisher[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [itemsRes, skillsRes, annRes] = await Promise.all([
      itemApi.getItems(),
      skillApi.getSkills(),
      announcementApi.getLatestAnnouncements(5),
    ]);
    if (itemsRes.success) setItems(itemsRes.data?.slice(0, 4) || []);
    if (skillsRes.success) setSkills(skillsRes.data?.slice(0, 4) || []);
    if (annRes.success) setAnnouncements(annRes.data || []);
  };

  const getCategoryInfo = (category: AnnouncementCategory) => {
    const map: Record<AnnouncementCategory, { label: string; icon: string; color: string }> = {
      water_electricity: { label: '停水停电', icon: '💧', color: '#1890ff' },
      property: { label: '物业消息', icon: '🏢', color: '#52c41a' },
      community_activity: { label: '社区活动', icon: '🎉', color: '#fa8c16' },
      other: { label: '其他通知', icon: '📋', color: '#722ed1' },
    };
    return map[category];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    });
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
              <Link to="/donations" className="btn btn-success btn-lg">
                🎁 免费捐赠
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

      {announcements.length > 0 && (
        <section className="section announcements-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">📢 最新公告</h2>
              <Link to="/announcements" className="section-more">
                查看历史公告 →
              </Link>
            </div>
            <div className="announcement-list">
              {announcements.map((ann) => {
                const catInfo = getCategoryInfo(ann.category);
                return (
                  <Link
                    key={ann.id}
                    to={`/announcements/${ann.id}`}
                    className="announcement-item"
                  >
                    <div className="announcement-item-left">
                      <span
                        className="cat-badge"
                        style={{ background: catInfo.color + '20', color: catInfo.color }}
                      >
                        {catInfo.icon} {catInfo.label}
                      </span>
                      <span className="ann-date">{formatDate(ann.createdAt)}</span>
                    </div>
                    <div className="announcement-item-right">
                      <h4 className="ann-title">
                        {ann.priority === 'urgent' && <span className="urgent-dot">●</span>}
                        {ann.title}
                      </h4>
                      <p className="ann-preview">
                        {ann.content.replace(/\n/g, ' ').slice(0, 60)}...
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

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

      <section className="section donation-promotion">
        <div className="container">
          <div className="donation-banner">
            <div className="donation-banner-content">
              <h2>🎁 免费捐赠专区</h2>
              <p>将闲置物品免费捐赠给有需要的邻居，传递爱心的同时还能获得信用分奖励！</p>
              <div className="donation-stats">
                <div className="donation-stat">
                  <span className="donation-stat-value">+5</span>
                  <span className="donation-stat-label">捐赠者信用分</span>
                </div>
                <div className="donation-stat-divider">+</div>
                <div className="donation-stat">
                  <span className="donation-stat-value">+3</span>
                  <span className="donation-stat-label">领取者信用分</span>
                </div>
              </div>
              <div className="donation-banner-buttons">
                <Link to="/donations" className="btn btn-success btn-lg">
                  浏览捐赠物品
                </Link>
                <Link to="/publish/donation" className="btn btn-outline-success btn-lg">
                  我要捐赠
                </Link>
              </div>
            </div>
            <div className="donation-banner-icon">
              🎉
            </div>
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
              <div className="feature-icon">🎁</div>
              <h3>爱心捐赠</h3>
              <p>免费捐赠闲置物品，传递爱心获得奖励</p>
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
        .btn-success {
          background: #52c41a;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-success:hover {
          background: #73d13d;
        }
        .btn-outline-success {
          background: transparent;
          color: #52c41a;
          border: 2px solid #52c41a;
          padding: 10px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-outline-success:hover {
          background: #52c41a;
          color: white;
        }
        .donation-promotion {
          background: #f6ffed;
          padding: 60px 0;
        }
        .donation-banner {
          background: linear-gradient(135deg, #52c41a 0%, #95de64 100%);
          border-radius: 20px;
          padding: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          color: white;
          overflow: hidden;
          position: relative;
        }
        .donation-banner::before {
          content: '';
          position: absolute;
          top: -50px;
          right: -50px;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        .donation-banner::after {
          content: '';
          position: absolute;
          bottom: -80px;
          left: 50%;
          width: 250px;
          height: 250px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 50%;
        }
        .donation-banner-content {
          flex: 1;
          position: relative;
          z-index: 1;
        }
        .donation-banner-content h2 {
          font-size: 32px;
          margin-bottom: 16px;
        }
        .donation-banner-content p {
          font-size: 16px;
          opacity: 0.95;
          margin-bottom: 24px;
          max-width: 500px;
          line-height: 1.6;
        }
        .donation-stats {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .donation-stat {
          background: rgba(255, 255, 255, 0.2);
          padding: 12px 24px;
          border-radius: 12px;
          text-align: center;
          backdrop-filter: blur(10px);
        }
        .donation-stat-value {
          display: block;
          font-size: 28px;
          font-weight: 700;
        }
        .donation-stat-label {
          font-size: 13px;
          opacity: 0.9;
        }
        .donation-stat-divider {
          font-size: 32px;
          font-weight: 700;
        }
        .donation-banner-buttons {
          display: flex;
          gap: 12px;
        }
        .donation-banner-buttons .btn-success {
          background: white;
          color: #52c41a;
        }
        .donation-banner-buttons .btn-success:hover {
          background: #f6ffed;
        }
        .donation-banner-buttons .btn-outline-success {
          border-color: white;
          color: white;
        }
        .donation-banner-buttons .btn-outline-success:hover {
          background: white;
          color: #52c41a;
        }
        .donation-banner-icon {
          font-size: 120px;
          opacity: 0.9;
          animation: bounce 2s ease-in-out infinite;
          position: relative;
          z-index: 1;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .announcements-section {
          background: white;
        }
        .announcement-list {
          background: #fafafa;
          border-radius: 12px;
          padding: 4px;
        }
        .announcement-item {
          display: flex;
          padding: 16px;
          border-radius: 8px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
          margin-bottom: 4px;
        }
        .announcement-item:last-child {
          margin-bottom: 0;
        }
        .announcement-item:hover {
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .announcement-item-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-right: 16px;
          min-width: 110px;
        }
        .cat-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }
        .ann-date {
          color: #999;
          font-size: 12px;
        }
        .announcement-item-right {
          flex: 1;
          min-width: 0;
        }
        .ann-title {
          font-size: 15px;
          font-weight: 500;
          margin: 0 0 6px 0;
          color: #333;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .urgent-dot {
          color: #ff4d4f;
          font-size: 10px;
        }
        .ann-preview {
          font-size: 13px;
          color: #999;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
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
          .announcement-item {
            flex-direction: column;
            gap: 8px;
          }
          .announcement-item-left {
            flex-direction: row;
            align-items: center;
            min-width: auto;
            margin-right: 0;
          }
          .hero-title {
            font-size: 32px;
          }
          .hero-subtitle {
            font-size: 16px;
          }
          .hero-buttons {
            flex-direction: column;
            gap: 12px;
          }
          .hero-buttons .btn {
            width: 100%;
          }
          .hero-stats {
            gap: 30px;
          }
          .stat-number {
            font-size: 24px;
          }
          .donation-banner {
            flex-direction: column;
            text-align: center;
            padding: 32px 24px;
          }
          .donation-banner-content h2 {
            font-size: 24px;
          }
          .donation-banner-content p {
            font-size: 14px;
          }
          .donation-stats {
            justify-content: center;
            flex-wrap: wrap;
          }
          .donation-stat {
            padding: 8px 16px;
          }
          .donation-stat-value {
            font-size: 22px;
          }
          .donation-banner-buttons {
            flex-direction: column;
          }
          .donation-banner-buttons .btn {
            width: 100%;
          }
          .donation-banner-icon {
            font-size: 80px;
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
