import { useEffect, useState } from 'react';
import { statsApi } from '../api';
import type { LeaderboardType, LeaderboardPeriod, LeaderboardEntry } from '../types';

function Leaderboard() {
  const [activeType, setActiveType] = useState<LeaderboardType>('timeCoin');
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [activeType, activePeriod]);

  const loadLeaderboard = async () => {
    setLoading(true);
    const res = await statsApi.getLeaderboard(activeType, activePeriod);
    if (res.success) {
      setEntries(res.data?.entries || []);
    }
    setLoading(false);
  };

  const typeTabs = [
    { key: 'timeCoin' as LeaderboardType, label: '时间币富豪榜', icon: '💰' },
    { key: 'credit' as LeaderboardType, label: '信用之星榜', icon: '⭐' },
    { key: 'sharing' as LeaderboardType, label: '分享达人榜', icon: '🎁' },
  ];

  const periodTabs = [
    { key: 'all' as LeaderboardPeriod, label: '总榜' },
    { key: 'month' as LeaderboardPeriod, label: '月度榜' },
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

  const getValueLabel = () => {
    switch (activeType) {
      case 'timeCoin':
        return '时间币';
      case 'credit':
        return '信用分';
      case 'sharing':
        return '借出次数';
      default:
        return '';
    }
  };

  const getValueSuffix = () => {
    switch (activeType) {
      case 'timeCoin':
        return '⏰';
      case 'sharing':
        return ' 次';
      default:
        return '';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="rank-badge gold">🥇</span>;
    if (rank === 2) return <span className="rank-badge silver">🥈</span>;
    if (rank === 3) return <span className="rank-badge bronze">🥉</span>;
    return <span className="rank-number">#{rank}</span>;
  };

  return (
    <div className="container leaderboard-page">
      <div className="leaderboard-header">
        <div className="header-info">
          <h1 className="page-title">🏆 平台排行榜</h1>
          <p className="page-subtitle">发现身边的榜样，一起共建美好社区</p>
        </div>
      </div>

      <div className="type-tabs">
        {typeTabs.map((tab) => (
          <button
            key={tab.key}
            className={`type-tab ${activeType === tab.key ? 'active' : ''}`}
            onClick={() => setActiveType(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="period-tabs">
        {periodTabs.map((tab) => (
          <button
            key={tab.key}
            className={`period-tab ${activePeriod === tab.key ? 'active' : ''}`}
            onClick={() => setActivePeriod(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="leaderboard-content">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>暂无排行榜数据</p>
          </div>
        ) : (
          <>
            {entries.length >= 3 && (
              <div className="top-three">
                <div className="top-card second">
                  <div className="top-avatar-wrapper">
                    <img
                      src={entries[1].user.avatar}
                      alt={entries[1].user.nickname}
                      className="top-avatar"
                    />
                    <span className="top-badge silver">🥈</span>
                  </div>
                  <h3 className="top-name">{entries[1].user.nickname}</h3>
                  <p className="top-value">
                    {entries[1].value}
                    {getValueSuffix()}
                  </p>
                  <p className="top-label">{getValueLabel()}</p>
                </div>

                <div className="top-card first">
                  <div className="top-avatar-wrapper">
                    <img
                      src={entries[0].user.avatar}
                      alt={entries[0].user.nickname}
                      className="top-avatar"
                    />
                    <span className="top-badge gold">🥇</span>
                  </div>
                  <h3 className="top-name">{entries[0].user.nickname}</h3>
                  <p className="top-value">
                    {entries[0].value}
                    {getValueSuffix()}
                  </p>
                  <p className="top-label">{getValueLabel()}</p>
                </div>

                <div className="top-card third">
                  <div className="top-avatar-wrapper">
                    <img
                      src={entries[2].user.avatar}
                      alt={entries[2].user.nickname}
                      className="top-avatar"
                    />
                    <span className="top-badge bronze">🥉</span>
                  </div>
                  <h3 className="top-name">{entries[2].user.nickname}</h3>
                  <p className="top-value">
                    {entries[2].value}
                    {getValueSuffix()}
                  </p>
                  <p className="top-label">{getValueLabel()}</p>
                </div>
              </div>
            )}

            <div className="rank-list">
              {entries.slice(3).map((entry) => (
                <div key={entry.user.id} className="rank-item">
                  <div className="rank-position">{getRankBadge(entry.rank)}</div>
                  <img
                    src={entry.user.avatar}
                    alt={entry.user.nickname}
                    className="rank-avatar"
                  />
                  <div className="rank-info">
                    <h4 className="rank-name">{entry.user.nickname}</h4>
                    <div className="rank-meta">
                      <span
                        className="credit-level"
                        style={{ color: getCreditLevelColor(entry.user.creditLevel) }}
                      >
                        {entry.user.creditLevel}级
                      </span>
                      <span className="neighborhood">📍 {entry.user.neighborhood}</span>
                    </div>
                  </div>
                  <div className="rank-value">
                    <span className="value-number">{entry.value}</span>
                    <span className="value-unit">{getValueLabel()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        .leaderboard-page {
          padding-top: 0;
        }
        .leaderboard-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 32px;
          color: white;
          margin-bottom: 24px;
        }
        .page-title {
          font-size: 28px;
          margin-bottom: 8px;
        }
        .page-subtitle {
          font-size: 14px;
          opacity: 0.9;
        }
        .type-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .type-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px;
          background: white;
          border: 2px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .type-tab:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        .type-tab.active {
          border-color: #667eea;
          background: linear-gradient(135deg, #f0f2ff 0%, #f5f0ff 100%);
        }
        .tab-icon {
          font-size: 32px;
        }
        .tab-label {
          font-size: 15px;
          font-weight: 500;
          color: #333;
        }
        .type-tab.active .tab-label {
          color: #667eea;
        }
        .period-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: white;
          padding: 6px;
          border-radius: 10px;
          width: fit-content;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .period-tab {
          padding: 8px 24px;
          background: none;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          transition: all 0.2s;
        }
        .period-tab:hover {
          color: #667eea;
        }
        .period-tab.active {
          background: #667eea;
          color: white;
          font-weight: 500;
        }
        .leaderboard-content {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .top-three {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 40px;
          padding-bottom: 32px;
          border-bottom: 1px solid #f0f0f0;
        }
        .top-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          border-radius: 16px;
          width: 180px;
          transition: all 0.3s;
        }
        .top-card:hover {
          transform: translateY(-8px);
        }
        .top-card.first {
          background: linear-gradient(180deg, #fff7e6 0%, #fff1b8 100%);
          order: 2;
          transform: scale(1.1);
        }
        .top-card.first:hover {
          transform: scale(1.1) translateY(-8px);
        }
        .top-card.second {
          background: linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%);
          order: 1;
        }
        .top-card.third {
          background: linear-gradient(180deg, #fff2e8 0%, #ffd8bf 100%);
          order: 3;
        }
        .top-avatar-wrapper {
          position: relative;
          margin-bottom: 12px;
        }
        .top-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          object-fit: cover;
        }
        .top-card.first .top-avatar {
          width: 96px;
          height: 96px;
        }
        .top-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          font-size: 28px;
        }
        .top-name {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          text-align: center;
        }
        .top-value {
          font-size: 24px;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 4px;
        }
        .top-card.first .top-value {
          font-size: 28px;
          color: #fa8c16;
        }
        .top-label {
          font-size: 12px;
          color: #999;
        }
        .rank-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rank-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: #fafafa;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .rank-item:hover {
          background: #f0f2ff;
          transform: translateX(4px);
        }
        .rank-position {
          width: 50px;
          text-align: center;
        }
        .rank-badge {
          font-size: 24px;
        }
        .rank-number {
          font-size: 18px;
          font-weight: 700;
          color: #999;
        }
        .rank-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        .rank-info {
          flex: 1;
        }
        .rank-name {
          font-size: 15px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }
        .rank-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .credit-level {
          font-size: 13px;
          font-weight: 700;
        }
        .neighborhood {
          font-size: 12px;
          color: #999;
        }
        .rank-value {
          text-align: right;
        }
        .value-number {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: #667eea;
        }
        .value-unit {
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
          .type-tabs {
            grid-template-columns: 1fr;
          }
          .top-three {
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
          .top-card {
            width: 100%;
            max-width: 280px;
          }
          .top-card.first {
            order: 0;
          }
          .top-card.second {
            order: 1;
          }
          .top-card.third {
            order: 2;
          }
          .rank-position {
            width: 36px;
          }
          .rank-number {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

export default Leaderboard;
