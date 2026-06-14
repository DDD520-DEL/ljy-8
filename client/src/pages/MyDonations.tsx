import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { donationApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { DonationWithDetails } from '../types';

type TabType = 'donated' | 'applied' | 'received';

const statusText: Record<string, string> = {
  available: '待领取',
  pending_approval: '待确认',
  approved: '已确认',
  meeting: '待交接',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColor: Record<string, string> = {
  available: '#52c41a',
  pending_approval: '#fa8c16',
  approved: '#1890ff',
  meeting: '#722ed1',
  completed: '#8c8c8c',
  cancelled: '#f5222d',
};

function MyDonations() {
  const { isAuthenticated, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('donated');
  const [donatedItems, setDonatedItems] = useState<DonationWithDetails[]>([]);
  const [appliedItems, setAppliedItems] = useState<DonationWithDetails[]>([]);
  const [receivedItems, setReceivedItems] = useState<DonationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    loadAllData();
  }, [isAuthenticated]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [donatedRes, appliedRes, receivedRes] = await Promise.all([
        donationApi.getMyDonations(),
        donationApi.getMyApplications(),
        donationApi.getMyReceivedDonations(),
      ]);
      if (donatedRes.success) setDonatedItems(donatedRes.data || []);
      if (appliedRes.success) setAppliedItems(appliedRes.data || []);
      if (receivedRes.success) setReceivedItems(receivedRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'donated' as TabType, label: '我发布的捐赠', count: donatedItems.length },
    { key: 'applied' as TabType, label: '我申请的捐赠', count: appliedItems.length },
    { key: 'received' as TabType, label: '我收到的捐赠', count: receivedItems.length },
  ];

  const getCurrentList = () => {
    switch (activeTab) {
      case 'donated':
        return donatedItems;
      case 'applied':
        return appliedItems;
      case 'received':
        return receivedItems;
      default:
        return [];
    }
  };

  const renderDonationCard = (donation: DonationWithDetails) => (
    <Link
      key={donation.id}
      to={`/donations/${donation.id}`}
      className="donation-item-card"
    >
      <div className="donation-item-image">
        {donation.item.images[0] ? (
          <img src={donation.item.images[0]} alt={donation.item.title} />
        ) : (
          <div className="donation-item-placeholder">🎁</div>
        )}
        <span
          className="donation-item-status"
          style={{ backgroundColor: statusColor[donation.status] }}
        >
          {statusText[donation.status]}
        </span>
      </div>
      <div className="donation-item-info">
        <h3 className="donation-item-title">{donation.item.title}</h3>
        <p className="donation-item-desc">{donation.item.description}</p>
        <div className="donation-item-meta">
          {activeTab === 'donated' && donation.applicantIds.length > 0 && (
            <span className="meta-item">🙋 {donation.applicantIds.length} 人申请</span>
          )}
          {activeTab === 'applied' && donation.donor && (
            <span className="meta-item">
              <img src={donation.donor.avatar} alt="" className="mini-avatar" />
              {donation.donor.nickname}
            </span>
          )}
          {activeTab === 'received' && donation.donor && (
            <span className="meta-item">
              来自: {donation.donor.nickname}
            </span>
          )}
          <span className="meta-item date">
            {new Date(donation.createdAt).toLocaleDateString()}
          </span>
        </div>
        {donation.status === 'completed' && (
          <div className="reward-badge">
            🎉 已获得信用分奖励
            {activeTab === 'donated' ? ' +5' : ' +3'}
          </div>
        )}
      </div>
    </Link>
  );

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>请先登录后查看</p>
          <Link to="/login" className="btn btn-primary">去登录</Link>
        </div>
      </div>
    );
  }

  const currentList = getCurrentList();

  return (
    <div className="container my-donations-page">
      <div className="page-header">
        <h1>我的捐赠</h1>
        <Link to="/publish/donation" className="btn btn-primary">
          + 发布捐赠
        </Link>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="stats-card">
        <div className="stat-item">
          <span className="stat-value">{donatedItems.filter(d => d.status === 'completed').length}</span>
          <span className="stat-label">已完成捐赠</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{appliedItems.filter(d => d.status === 'completed').length}</span>
          <span className="stat-label">已领取物品</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {donatedItems.filter(d => d.status === 'completed').length * 5 +
             receivedItems.filter(d => d.status === 'completed').length * 3}
          </span>
          <span className="stat-label">累计信用分</span>
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : currentList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>
            {activeTab === 'donated' && '您还没有发布过捐赠'}
            {activeTab === 'applied' && '您还没有申请过捐赠'}
            {activeTab === 'received' && '您还没有收到过捐赠'}
          </p>
          {activeTab === 'donated' && (
            <Link to="/publish/donation" className="btn btn-primary">
              去发布捐赠
            </Link>
          )}
          {activeTab === 'applied' && (
            <Link to="/donations" className="btn btn-primary">
              去浏览捐赠
            </Link>
          )}
        </div>
      ) : (
        <div className="donation-list">
          {currentList.map(renderDonationCard)}
        </div>
      )}

      <style>{`
        .my-donations-page {
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
          gap: 4px;
          background: #f5f5f5;
          padding: 4px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .tab-btn {
          flex: 1;
          padding: 12px 24px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .tab-btn:hover {
          background: #e8e8e8;
        }
        .tab-btn.active {
          background: #52c41a;
          color: white;
        }
        .tab-count {
          background: rgba(0, 0, 0, 0.1);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
        }
        .tab-btn.active .tab-count {
          background: rgba(255, 255, 255, 0.2);
        }
        .stats-card {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .stat-item {
          text-align: center;
        }
        .stat-value {
          display: block;
          font-size: 32px;
          font-weight: 700;
          color: #52c41a;
          margin-bottom: 8px;
        }
        .stat-label {
          font-size: 13px;
          color: #999;
        }
        .donation-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .donation-item-card {
          display: flex;
          gap: 16px;
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }
        .donation-item-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .donation-item-image {
          position: relative;
          width: 100px;
          height: 100px;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f5;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .donation-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .donation-item-placeholder {
          font-size: 40px;
        }
        .donation-item-status {
          position: absolute;
          top: 8px;
          left: 8px;
          color: white;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }
        .donation-item-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .donation-item-title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .donation-item-desc {
          font-size: 13px;
          color: #999;
          margin-bottom: 12px;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .donation-item-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #666;
        }
        .meta-item.date {
          margin-left: auto;
          color: #999;
        }
        .mini-avatar {
          width: 18px;
          height: 18px;
          border-radius: 50%;
        }
        .reward-badge {
          margin-top: 8px;
          padding: 4px 12px;
          background: #fff7e6;
          color: #fa8c16;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-align: center;
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
          margin-bottom: 16px;
        }
        .btn-primary {
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
        .btn-primary:hover {
          background: #73d13d;
        }
        @media (max-width: 768px) {
          .stats-card {
            grid-template-columns: 1fr;
          }
          .donation-item-card {
            flex-direction: column;
          }
          .donation-item-image {
            width: 100%;
            height: 180px;
          }
        }
      `}</style>
    </div>
  );
}

export default MyDonations;
