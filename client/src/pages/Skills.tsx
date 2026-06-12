import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { skillApi } from '../api';
import type { SkillWithProvider } from '../types';

function Skills() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [skills, setSkills] = useState<SkillWithProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const categoryParam = searchParams.get('category') || 'all';
  const categories = ['all', '维修服务', '家政服务', '教学辅导', '创意设计', '其他'];

  useEffect(() => {
    loadSkills();
  }, [categoryParam]);

  const loadSkills = async () => {
    setLoading(true);
    const res = await skillApi.getSkills({
      category: categoryParam,
      keyword: keyword || undefined,
    });
    if (res.success) {
      setSkills(res.data || []);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadSkills();
  };

  const handleCategoryClick = (cat: string) => {
    setSearchParams({ category: cat });
  };

  return (
    <div className="container skills-page">
      <div className="page-header">
        <h1>技能交换</h1>
        <Link to="/publish/skill" className="btn btn-primary">
          + 发布技能
        </Link>
      </div>

      <div className="filter-bar">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="搜索技能服务..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            搜索
          </button>
        </form>
      </div>

      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-tab ${categoryParam === cat ? 'active' : ''}`}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat === 'all' ? '全部' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : skills.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💡</div>
          <p>暂无技能服务，快来发布第一个吧！</p>
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
              </div>
              <div className="skill-info">
                <h3 className="skill-title">{skill.title}</h3>
                <p className="skill-desc">{skill.description}</p>
                <div className="skill-meta">
                  <img src={skill.provider.avatar} alt="" className="avatar" />
                  <span className="provider-name">{skill.provider.nickname}</span>
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

      <style>{`
        .skills-page {
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
        .filter-bar {
          margin-bottom: 20px;
        }
        .search-form {
          display: flex;
          gap: 12px;
          max-width: 500px;
        }
        .search-input {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          font-size: 14px;
        }
        .category-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .category-tab {
          padding: 8px 20px;
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .category-tab:hover {
          border-color: #667eea;
          color: #667eea;
        }
        .category-tab.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }
        .skill-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .skill-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .skill-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .skill-image {
          position: relative;
          height: 180px;
          background: linear-gradient(135deg, #667eea22 0%, #764ba222 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .skill-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .skill-placeholder {
          font-size: 56px;
        }
        .skill-info {
          padding: 16px;
        }
        .skill-title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
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
        .skill-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .skill-meta .avatar {
          width: 24px;
          height: 24px;
        }
        .provider-name {
          font-size: 13px;
          color: #666;
        }
        .skill-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }
        .skill-price {
          color: #667eea;
          font-weight: 500;
          font-size: 16px;
        }
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
        @media (max-width: 768px) {
          .skill-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default Skills;
