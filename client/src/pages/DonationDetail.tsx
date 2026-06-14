import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { donationApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { DonationWithDetails } from '../types';

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

function DonationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [donation, setDonation] = useState<DonationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [meetLocation, setMeetLocation] = useState('');
  const [meetTime, setMeetTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadDonation();
    }
  }, [id]);

  const loadDonation = async () => {
    setLoading(true);
    const res = await donationApi.getDonationById(id!);
    if (res.success) {
      setDonation(res.data);
    }
    setLoading(false);
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const res = await donationApi.applyForDonation(id!);
      if (res.success) {
        alert('申请成功！请等待捐赠者确认');
        loadDonation();
      } else {
        alert(res.message || '申请失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelApplication = async () => {
    if (!confirm('确定要取消申请吗？')) return;
    setSubmitting(true);
    try {
      const res = await donationApi.cancelApplication(id!);
      if (res.success) {
        alert('已取消申请');
        loadDonation();
      } else {
        alert(res.message || '取消失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient || !meetLocation || !meetTime) {
      alert('请填写完整信息');
      return;
    }
    setSubmitting(true);
    try {
      const res = await donationApi.approveApplicant(id!, {
        recipientId: selectedRecipient,
        meetLocation,
        meetTime,
      });
      if (res.success) {
        alert('已确认申请人，请按时完成交接');
        setShowApproveModal(false);
        loadDonation();
      } else {
        alert(res.message || '确认失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartMeeting = async () => {
    if (!confirm('确定要开始交接吗？')) return;
    setSubmitting(true);
    try {
      const res = await donationApi.startMeeting(id!);
      if (res.success) {
        alert('已开始交接');
        loadDonation();
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm('确认物品已交接完成吗？完成后双方将获得信用分奖励。')) return;
    setSubmitting(true);
    try {
      const res = await donationApi.completeDonation(id!);
      if (res.success) {
        alert('捐赠已完成！双方各获得信用分奖励。');
        loadDonation();
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelDonation = async () => {
    if (!confirm('确定要取消捐赠吗？')) return;
    setSubmitting(true);
    try {
      const res = await donationApi.cancelDonation(id!, cancelReason);
      if (res.success) {
        alert('已取消捐赠');
        setShowCancelModal(false);
        loadDonation();
      } else {
        alert(res.message || '取消失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isDonor = user && donation && user.id === donation.donorId;
  const isRecipient = user && donation && user.id === donation.recipientId;
  const hasApplied = user && donation && donation.applicantIds.includes(user.id);
  const canApply = donation && donation.status === 'available' && !isDonor && !hasApplied;
  const canCancelDonation = isDonor && donation && !['completed', 'cancelled'].includes(donation.status);
  const canCancelApplication = hasApplied && donation && !['completed', 'cancelled'].includes(donation.status) && !(donation.status === 'approved' && isRecipient);

  if (loading) {
    return <div className="container"><div className="loading">加载中...</div></div>;
  }

  if (!donation) {
    return <div className="container"><div className="empty-state">捐赠不存在或已被删除</div></div>;
  }

  return (
    <div className="container donation-detail-page">
      <div className="breadcrumb">
        <Link to="/donations">← 返回捐赠列表</Link>
      </div>

      <div className="detail-content">
        <div className="detail-image-section">
          <div className="main-image">
            {donation.item.images[0] ? (
              <img src={donation.item.images[0]} alt={donation.item.title} />
            ) : (
              <div className="image-placeholder">🎁</div>
            )}
            <span className="donation-badge">免费捐赠</span>
            <span className="status-badge" style={{ backgroundColor: statusColor[donation.status] }}>
              {statusText[donation.status]}
            </span>
          </div>
          <div className="thumbnail-list">
            {donation.item.images.map((img, index) => (
              <div key={index} className="thumbnail">
                <img src={img} alt="" />
              </div>
            ))}
          </div>
        </div>

        <div className="detail-info-section">
          <h1 className="item-title">{donation.item.title}</h1>
          <div className="item-meta">
            <span className="category-tag">{donation.item.category}</span>
            <span className="view-count">👁 {donation.item.viewCount} 浏览</span>
            <span className="applicant-count">🙋 {donation.applicantIds.length} 人申请</span>
          </div>

          <div className="item-description">
            <h3>物品描述</h3>
            <p>{donation.item.description}</p>
          </div>

          {donation.donorNotes && (
            <div className="donor-notes">
              <h3>捐赠者备注</h3>
              <p>{donation.donorNotes}</p>
            </div>
          )}

          {(donation.meetLocation || donation.meetTime) && (
            <div className="meeting-info">
              <h3>交接信息</h3>
              <p><strong>地点：</strong>{donation.meetLocation}</p>
              <p><strong>时间：</strong>{donation.meetTime}</p>
            </div>
          )}

          <div className="donor-info">
            <h3>捐赠者</h3>
            <div className="donor-card">
              <img src={donation.donor.avatar} alt="" className="avatar" />
              <div className="donor-info-text">
                <p className="donor-name">{donation.donor.nickname}</p>
                <p className="donor-meta">
                  <span className={`credit-badge level-${donation.donor.creditLevel}`}>
                    信用{donation.donor.creditLevel}
                  </span>
                  <span className="donor-neighborhood">{donation.donor.neighborhood}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="action-section">
            {isDonor && (
              <>
                {donation.status === 'pending_approval' && donation.applicantIds.length > 0 && (
                  <button className="btn btn-primary btn-lg" onClick={() => setShowApproveModal(true)}>
                    确认申请人
                  </button>
                )}
                {donation.status === 'approved' && (
                  <button className="btn btn-primary btn-lg" onClick={handleStartMeeting} disabled={submitting}>
                    开始交接
                  </button>
                )}
                {(donation.status === 'meeting' || donation.status === 'approved') && (
                  <button className="btn btn-success btn-lg" onClick={handleComplete} disabled={submitting}>
                    确认完成
                  </button>
                )}
                {canCancelDonation && (
                  <button className="btn btn-danger btn-lg" onClick={() => setShowCancelModal(true)} disabled={submitting}>
                    取消捐赠
                  </button>
                )}
              </>
            )}

            {!isDonor && (
              <>
                {canApply && (
                  <button className="btn btn-primary btn-lg" onClick={handleApply} disabled={submitting}>
                    申请领取
                  </button>
                )}
                {hasApplied && canCancelApplication && (
                  <button className="btn btn-danger btn-lg" onClick={handleCancelApplication} disabled={submitting}>
                    取消申请
                  </button>
                )}
                {hasApplied && donation.status === 'pending_approval' && (
                  <div className="status-message">
                    <span className="status-icon">⏳</span>
                    您已申请，请等待捐赠者确认
                  </div>
                )}
                {isRecipient && donation.status === 'approved' && (
                  <div className="status-message">
                    <span className="status-icon">✅</span>
                    您的申请已通过，请按时前往交接地点
                  </div>
                )}
                {isRecipient && donation.status === 'meeting' && (
                  <div className="status-message">
                    <span className="status-icon">🤝</span>
                    正在交接中，请确认物品无误
                  </div>
                )}
                {isRecipient && donation.status === 'completed' && (
                  <div className="status-message success">
                    <span className="status-icon">🎉</span>
                    恭喜！您已获得该物品，信用分 +3
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isDonor && donation.applicantIds.length > 0 && (
        <div className="applicants-section">
          <h3>申请人列表 ({donation.applicantIds.length} 人)</h3>
          <div className="applicants-list">
            {donation.applicants.map((applicant) => (
              <div key={applicant.id} className="applicant-card">
                <img src={applicant.avatar} alt="" className="avatar" />
                <div className="applicant-info">
                  <p className="applicant-name">{applicant.nickname}</p>
                  <p className="applicant-meta">
                    <span className={`credit-badge level-${applicant.creditLevel}`}>
                      信用{applicant.creditLevel}
                    </span>
                    <span>{applicant.neighborhood}</span>
                  </p>
                </div>
                {donation.recipientId === applicant.id && (
                  <span className="selected-badge">已选中</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>确认申请人</h3>
            <form onSubmit={handleApproveSubmit}>
              <div className="form-group">
                <label>选择申请人</label>
                <select
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  required
                >
                  <option value="">请选择</option>
                  {donation.applicants.map((applicant) => (
                    <option key={applicant.id} value={applicant.id}>
                      {applicant.nickname} - 信用{applicant.creditLevel} - {applicant.neighborhood}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>交接地点</label>
                <input
                  type="text"
                  value={meetLocation}
                  onChange={(e) => setMeetLocation(e.target.value)}
                  placeholder="请输入交接地点，如：小区门口、便利店等"
                  required
                />
              </div>
              <div className="form-group">
                <label>交接时间</label>
                <input
                  type="datetime-local"
                  value={meetTime}
                  onChange={(e) => setMeetTime(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-default" onClick={() => setShowApproveModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  确认
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>取消捐赠</h3>
            <form onSubmit={handleCancelDonation}>
              <div className="form-group">
                <label>取消原因（可选）</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="请输入取消原因"
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-default" onClick={() => setShowCancelModal(false)}>
                  返回
                </button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  确认取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .donation-detail-page {
          padding-top: 0;
        }
        .breadcrumb {
          margin-bottom: 20px;
        }
        .breadcrumb a {
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
        }
        .breadcrumb a:hover {
          text-decoration: underline;
        }
        .detail-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }
        .detail-image-section {
          position: relative;
        }
        .main-image {
          position: relative;
          width: 100%;
          height: 400px;
          background: #f5f5f5;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .main-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-placeholder {
          font-size: 120px;
        }
        .donation-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: #ff4d4f;
          color: white;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
        }
        .status-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          color: white;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
        }
        .thumbnail-list {
          display: flex;
          gap: 12px;
        }
        .thumbnail {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f5;
        }
        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .item-title {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .item-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .category-tag {
          background: #f0f5ff;
          color: #667eea;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 13px;
        }
        .view-count,
        .applicant-count {
          color: #999;
          font-size: 13px;
        }
        .item-description,
        .donor-notes,
        .meeting-info,
        .donor-info {
          margin-bottom: 24px;
        }
        .item-description h3,
        .donor-notes h3,
        .meeting-info h3,
        .donor-info h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #333;
        }
        .item-description p,
        .donor-notes p {
          color: #666;
          line-height: 1.8;
        }
        .meeting-info p {
          color: #666;
          margin-bottom: 8px;
        }
        .meeting-info strong {
          color: #333;
        }
        .donor-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
        }
        .donor-card .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
        }
        .donor-name {
          font-weight: 500;
          margin-bottom: 4px;
        }
        .donor-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 13px;
          color: #999;
        }
        .credit-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .credit-badge.level-S { background: #fff1f0; color: #f5222d; }
        .credit-badge.level-A { background: #fff7e6; color: #fa8c16; }
        .credit-badge.level-B { background: #f6ffed; color: #52c41a; }
        .credit-badge.level-C { background: #e6f7ff; color: #1890ff; }
        .credit-badge.level-D { background: #f5f5f5; color: #8c8c8c; }
        .donor-neighborhood {
          background: #f5f5f5;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .action-section {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 24px;
          border-top: 1px solid #f0f0f0;
        }
        .btn-lg {
          padding: 12px 32px;
          font-size: 16px;
        }
        .status-message {
          flex: 1;
          padding: 16px;
          background: #fff7e6;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fa8c16;
          font-size: 15px;
        }
        .status-message.success {
          background: #f6ffed;
          color: #52c41a;
        }
        .status-icon {
          font-size: 24px;
        }
        .applicants-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .applicants-section h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .applicants-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .applicant-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
          position: relative;
        }
        .applicant-card .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }
        .applicant-name {
          font-weight: 500;
          margin-bottom: 4px;
        }
        .applicant-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 12px;
          color: #999;
        }
        .selected-badge {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: #52c41a;
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 32px;
          width: 90%;
          max-width: 480px;
        }
        .modal-content h3 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #333;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          font-size: 14px;
        }
        .form-group textarea {
          resize: vertical;
        }
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }
        .btn-default {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #d9d9d9;
        }
        .btn-default:hover {
          background: #e8e8e8;
        }
        .btn-danger {
          background: #ff4d4f;
          color: white;
          border: none;
        }
        .btn-danger:hover {
          background: #ff7875;
        }
        .btn-success {
          background: #52c41a;
          color: white;
          border: none;
        }
        .btn-success:hover {
          background: #73d13d;
        }
        .loading,
        .empty-state {
          text-align: center;
          padding: 60px 0;
          color: #999;
        }
        @media (max-width: 768px) {
          .detail-content {
            grid-template-columns: 1fr;
          }
          .main-image {
            height: 300px;
          }
        }
      `}</style>
    </div>
  );
}

export default DonationDetail;
