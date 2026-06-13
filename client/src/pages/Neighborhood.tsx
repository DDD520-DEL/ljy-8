import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { neighborhoodApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { PublicUser, ItemWithOwner, SkillWithProvider } from '../types';

type TabType = 'members' | 'items' | 'skills';

function Neighborhood() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [members, setMembers] = useState<PublicUser[]>([]);
  const [items, setItems] = useState<ItemWithOwner[]>([]);
  const [skills, setSkills] = useState<SkillWithProvider[]>([]);
  const [stats, setStats] = useState<{
    neighborhood: string;
    memberCount: number;
    itemCount: number;
    skillCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadStats();
    loadMembers();
  }, []);

  useEffect(() => {
    if (activeTab === 'items') {
      loadItems();
    } else if (activeTab === 'skills') {
      loadSkills();
    }
  }, [activeTab]);

  const loadStats = async () => {
    const res = await neighborhoodApi.getStats();
    if (res.success) {
      setStats(res.data);
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    const res = await neighborhoodApi.getMembers();
    if (res.success) {
      setMembers(res.data || []);
    }
    setLoading(false);
  };

  const loadItems = async () => {
    setLoading(true);
    const res = await neighborhoodApi.getItems({
      keyword: keyword || undefined,
    });
    if (res.success) {
      setItems(res.data || []);
    }
    setLoading(false);
  };

  const loadSkills = async () => {
    setLoading(true);
    const res = await neighborhoodApi.getSkills({
      keyword: keyword || undefined,
    });
    if (res.success) {
      setSkills(res.data || []);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'items') {
      loadItems();
    } else if (activeTab === 'skills') {
      loadSkills();
    }
  };

  const tabs = [
    { key: 'members' as TabType, label: '邻里成员', icon: '👥' },
    { key: 'items' as TabType, label: '闲置物品', icon: '📦' },
    { key: 'skills' as TabType, label: '技能服务', icon: '💡' },
  ];

  const getCreditLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      S: '#f5222d',
      A: '#fa8c16',
      B: '#52c41a',
      C: '#1890ff',
      D: '#8c8c8c',
    };
    return colors[level] || '#8c8c8c';
  };

  return (
    <div className="container neighborhood-page">
      <div className="neighborhood-header">
        <div className="neighborhood-info">
          <h1 className="neighborhood-title">
            🏘️ {stats?.neighborhood || user?.neighborhood || '我的小区'}
          </h1>
          <p className="neighborhood-subtitle">邻里圈 - 发现身边的邻居</p>
        </div>
        {stats && (
          <div className="neighborhood-stats">
            <div className="stat-item">
              <span className="stat-number">{stats.memberCount}</span>
              <span className="stat-label">位邻居</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.itemCount}</span>
              <span className="stat-label">件物品</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.skillCount}</span>
              <span className="stat-label">项技能</span>
            </div>
          </div>
        )}
      </div>

      <div className="tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab !== 'members' && (
        <div className="filter-bar">
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder={`搜索${activeTab === 'items' ? '物品' : '技能'}...`}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              搜索
            </button>
          </form>
          <div className="sort-hint">
            <span className="sort-icon">⭐</span>
            按信用等级排序
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="members-section">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : members.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>暂无其他邻居</p>
            </div>
          ) : (
            <div className="member-list">
              {members.map((member, index) => (
                <div key={member.id} className="member-card">
                  <div className="member-rank">
                    {index === 0 && <span className="rank-badge gold">🥇</span>}
                    {index === 1 && <span className="rank-badge silver">🥈</span>}
                    {index === 2 && <span className="rank-badge bronze">🥉</span>}
                    {index > 2 && <span className="rank-number">#{index + 1}</span>}
                  </div>
                  <img src={member.avatar} alt="" className="member-avatar" />
                  <div className="member-info">
                    <h3 className="member-name">{member.nickname}</h3>
                    <div className="member-credit">
                      <span
                        className="credit-level"
                        style={{ color: getCreditLevelColor(member.creditLevel) }}
                      >
                        {member.creditLevel}级
                      </span>
                      <span className="credit-score">信用 {member.creditScore} 分</span>
                    </div>
                    <p className="member-neighborhood">
                      📍 {member.neighborhood}
                    </p>
                  </div>
                  <div className="member-actions">
                    <Link
                      to="#"
                      className="btn btn-outline btn-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('查看ta的主页功能开发中');
                      }}
                    >
                      查看详情
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'items' && (
        <div className="items-section">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>本小区暂无闲置物品</p>
            </div>
          ) : (
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
                    <span className="neighborhood-tag">
                      🏘️ {item.owner.neighborhood}
                    </span>
                  </div>
                  <div className="item-info">
                    <h3 className="item-title">{item.title}</h3>
                    <p className="item-desc">{item.description}</p>
                    <div className="item-meta">
                      <img src={item.owner.avatar} alt="" className="avatar" />
                      <span className="owner-name">{item.owner.nickname}</span>
                      <span
                        className="credit-mini"
                        style={{ color: getCreditLevelColor(item.owner.creditLevel) }}
                      >
                        {item.owner.creditLevel}级
                      </span>
                    </div>
                    <div className="item-footer">
                      <span className="item-price">押金 ¥{item.deposit}</span>
                      <span className="item-views">👁 {item.viewCount}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="skills-section">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : skills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💡</div>
              <p>本小区暂无技能服务</p>
            </div>
          ) : (
            <div className="skill-grid">
              {skills.map((skill) => (
                <Link key={skill.id} to={`/skills/${skill.id}`} className="skill-card">
                  <div className="skill-image">
                    {skill.images[0] ? (
                      <img src={skill.images[0]} alt={skill.title} />
                    ) : (
                      <div className="skill-placeholder">💡</div>
                    )}
                    <span className="neighborhood-tag">
                      🏘️ {skill.provider.neighborhood}
                    </span>
                  </div>
                  <div className="skill-info">
                    <h3 className="skill-title">{skill.title}</h3>
                    <p className="skill-desc">{skill.description}</p>
                    <div className="skill-meta">
                      <img src={skill.provider.avatar} alt="" className="avatar" />
                      <span className="provider-name">{skill.provider.nickname}</span>
                      <span
                        className="credit-mini"
                        style={{ color: getCreditLevelColor(skill.provider.creditLevel) }}
                      >
                        {skill.provider.creditLevel}级
                      </span>
                    </div>
                    <div className="skill-footer">
                      <span className="skill-price">⏰ {skill.timeCoinPrice} 时间币</span>
                      <span className="skill-duration">约 {skill.serviceDuration} 分钟</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .neighborhood-page {
          padding-top: 0;
        }
        .neighborhood-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 32px;
          color: white;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .neighborhood-title {
          font-size: 28px;
          margin-bottom: 8px;
        }
        .neighborhood-subtitle {
          font-size: 14px;
          opacity: 0.9;
        }
        .neighborhood-stats {
          display: flex;
          gap: 32px;
        }
        .stat-item {
          text-align: center;
        }
        .stat-number {
          display: block;
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 14px;
          opacity: 0.9;
        }
        .tab-bar {
          display: flex;
          gap: 8px;
          background: white;
          padding: 8px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .tab-item {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: none;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
          color: #666;
        }
        .tab-item:hover {
          background: #f5f5f5;
        }
        .tab-item.active {
          background: #667eea;
          color: white;
          font-weight: 500;
        }
        .tab-icon {
          font-size: 18px;
        }
        .filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 16px;
        }
        .search-form {
          display: flex;
          gap: 12px;
          max-width: 400px;
          flex: 1;
        }
        .search-input {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          font-size: 14px;
        }
        .sort-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #999;
          background: white;
          padding: 8px 16px;
          border-radius: 8px;
        }
        .sort-icon {
          font-size: 14px;
        }
        .members-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
        }
        .member-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .member-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #fafafa;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .member-card:hover {
          background: #f0f2ff;
          transform: translateX(4px);
        }
        .member-rank {
          width: 40px;
          text-align: center;
        }
        .rank-badge {
          font-size: 28px;
        }
        .rank-number {
          font-size: 16px;
          font-weight: 700;
          color: #999;
        }
        .member-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .member-info {
          flex: 1;
        }
        .member-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .member-credit {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }
        .credit-level {
          font-size: 14px;
          font-weight: 700;
        }
        .credit-score {
          font-size: 13px;
          color: #999;
        }
        .member-neighborhood {
          font-size: 12px;
          color: #999;
        }
        .member-actions {
          flex-shrink: 0;
        }
        .btn-sm {
          padding: 6px 16px;
          font-size: 13px;
        }
        .btn-outline {
          background: white;
          border: 1px solid #d9d9d9;
          color: #666;
        }
        .btn-outline:hover {
          border-color: #667eea;
          color: #667eea;
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
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .item-card:hover,
        .skill-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .item-image,
        .skill-image {
          position: relative;
          height: 180px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .skill-image {
          background: linear-gradient(135deg, #667eea22 0%, #764ba222 100%);
        }
        .item-image img,
        .skill-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .item-placeholder,
        .skill-placeholder {
          font-size: 56px;
        }
        .item-image .tag,
        .skill-image .tag {
          position: absolute;
          top: 12px;
          left: 12px;
        }
        .neighborhood-tag {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
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
          height: 40px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .item-meta,
        .skill-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .item-meta .avatar,
        .skill-meta .avatar {
          width: 24px;
          height: 24px;
        }
        .owner-name,
        .provider-name {
          font-size: 13px;
          color: #666;
        }
        .credit-mini {
          font-size: 12px;
          font-weight: 700;
          margin-left: auto;
        }
        .item-footer,
        .skill-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }
        .item-price {
          color: #ff4d4f;
          font-weight: 500;
          font-size: 16px;
        }
        .skill-price {
          color: #667eea;
          font-weight: 500;
          font-size: 16px;
        }
        .item-views,
        .skill-duration {
          font-size: 12px;
          color: #999;
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
        .tag {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 12px;
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
        @media (max-width: 768px) {
          .neighborhood-header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
          .neighborhood-stats {
            gap: 20px;
          }
          .item-grid,
          .skill-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .tab-label {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default Neighborhood;
