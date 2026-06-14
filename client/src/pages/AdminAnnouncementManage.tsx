import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { announcementApi } from '../api';
import type {
  AnnouncementWithPublisher,
  AnnouncementCategory,
  AnnouncementPriority,
  AnnouncementStatus,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  PaginatedResult,
} from '../types';
import { useAuthStore } from '../store/authStore';

type TabType = 'list' | 'publish';

function AdminAnnouncementManage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [announcements, setAnnouncements] = useState<AnnouncementWithPublisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginatedResult<AnnouncementWithPublisher> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementWithPublisher | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState<AnnouncementCategory | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState<CreateAnnouncementRequest>({
    title: '',
    content: '',
    category: 'property' as AnnouncementCategory,
    priority: 'normal' as AnnouncementPriority,
    status: 'published' as AnnouncementStatus,
  });

  useEffect(() => {
    loadAnnouncements();
  }, [currentPage, filterCategory, sortOrder]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        pageSize: 10,
        sortOrder,
      };
      if (filterCategory !== 'all') {
        params.category = filterCategory;
      }
      const res = await announcementApi.getAdminAnnouncements(params);
      if (res.success) {
        setAnnouncements(res.data?.items || []);
        setPagination(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
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

  const getPriorityInfo = (priority: AnnouncementPriority) => {
    const map: Record<AnnouncementPriority, { label: string; color: string }> = {
      normal: { label: '普通', color: '#1890ff' },
      important: { label: '重要', color: '#fa8c16' },
      urgent: { label: '紧急', color: '#ff4d4f' },
    };
    return map[priority];
  };

  const getStatusInfo = (status: AnnouncementStatus) => {
    const map: Record<AnnouncementStatus, { label: string; color: string }> = {
      published: { label: '已发布', color: '#52c41a' },
      draft: { label: '草稿', color: '#faad14' },
      archived: { label: '已归档', color: '#999' },
    };
    return map[status];
  };

  const openAddModal = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      category: 'property',
      priority: 'normal',
      status: 'published',
    });
    setActiveTab('publish');
  };

  const openEditModal = (announcement: AnnouncementWithPublisher) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      priority: announcement.priority,
      status: announcement.status,
    });
    setShowEditModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showToast('error', '请输入公告标题');
      return;
    }
    if (!formData.content.trim()) {
      showToast('error', '请输入公告内容');
      return;
    }

    if (editingAnnouncement) {
      const updateData: UpdateAnnouncementRequest = { ...formData };
      const res = await announcementApi.updateAnnouncement(editingAnnouncement.id, updateData);
      if (res.success) {
        showToast('success', '公告更新成功');
        setShowEditModal(false);
        loadAnnouncements();
      } else {
        showToast('error', res.message || '更新失败');
      }
    } else {
      const res = await announcementApi.createAnnouncement(formData);
      if (res.success) {
        showToast('success', '公告发布成功');
        setFormData({
          title: '',
          content: '',
          category: 'property',
          priority: 'normal',
          status: 'published',
        });
        loadAnnouncements();
        setActiveTab('list');
      } else {
        showToast('error', res.message || '发布失败');
      }
    }
  };

  const handleDelete = async (id: string) => {
    const res = await announcementApi.deleteAnnouncement(id);
    if (res.success) {
      showToast('success', '删除成功');
      setShowDeleteConfirm(null);
      loadAnnouncements();
    } else {
      showToast('error', res.message || '删除失败');
    }
  };

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const categoryOptions: { value: AnnouncementCategory | 'all'; label: string }[] = [
    { value: 'all', label: '全部分类' },
    { value: 'water_electricity', label: '💧 停水停电' },
    { value: 'property', label: '🏢 物业消息' },
    { value: 'community_activity', label: '🎉 社区活动' },
    { value: 'other', label: '📋 其他通知' },
  ];

  return (
    <div className="container admin-announcement-page">
      <div className="page-header">
        <div>
          <h1>📢 社区公告管理</h1>
          <p className="page-subtitle">管理社区公告发布、编辑和删除</p>
        </div>
      </div>

      <div className="tabs">
        {([
          { key: 'list' as const, label: '📋 公告列表', count: pagination?.total || 0 },
          { key: 'publish' as const, label: '✏️ 发布公告' },
        ]).map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <div className="list-section">
          <div className="section-actions">
            <div className="filter-row">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`filter-btn ${filterCategory === opt.value ? 'active' : ''}`}
                  onClick={() => {
                    setFilterCategory(opt.value);
                    setCurrentPage(1);
                  }}
                >
                  {opt.label}
                </button>
              ))}
              <button
                className={`filter-btn ${sortOrder === 'desc' ? 'active' : ''}`}
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              >
                {sortOrder === 'desc' ? '📅 最新优先' : '📅 最早优先'}
              </button>
            </div>
            <button className="btn btn-primary" onClick={openAddModal}>
              ➕ 发布公告
            </button>
          </div>

          {loading ? (
            <div className="loading">加载中...</div>
          ) : announcements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>暂无公告，点击"发布公告"开始</p>
            </div>
          ) : (
            <>
              <div className="announcement-table-wrap">
                <table className="announcement-table">
                  <thead>
                    <tr>
                      <th>公告标题</th>
                      <th>分类</th>
                      <th>优先级</th>
                      <th>状态</th>
                      <th>浏览量</th>
                      <th>发布人</th>
                      <th>发布时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.map((announcement) => {
                      const catInfo = getCategoryInfo(announcement.category);
                      const prioInfo = getPriorityInfo(announcement.priority);
                      const statusInfo = getStatusInfo(announcement.status);
                      return (
                        <tr key={announcement.id}>
                          <td>
                            <div className="title-cell">
                              {announcement.priority === 'urgent' && (
                                <span className="urgent-tag">🔥 紧急</span>
                              )}
                              <span className="title-text">{announcement.title}</span>
                            </div>
                          </td>
                          <td>
                            <span
                              className="category-badge"
                              style={{ background: catInfo.color + '20', color: catInfo.color }}
                            >
                              {catInfo.icon} {catInfo.label}
                            </span>
                          </td>
                          <td>
                            <span
                              className="priority-badge"
                              style={{ background: prioInfo.color + '20', color: prioInfo.color }}
                            >
                              {prioInfo.label}
                            </span>
                          </td>
                          <td>
                            <span
                              className="status-badge"
                              style={{ background: statusInfo.color + '20', color: statusInfo.color }}
                            >
                              {statusInfo.label}
                            </span>
                          </td>
                          <td>👁 {announcement.viewCount}</td>
                          <td>
                            <div className="publisher-cell">
                              <img src={announcement.publisher.avatar} alt="" className="avatar-xs" />
                              <span>{announcement.publisher.nickname}</span>
                            </div>
                          </td>
                          <td className="date-cell">
                            {new Date(announcement.createdAt).toLocaleString()}
                          </td>
                          <td>
                            <div className="action-btns">
                              <button
                                className="action-btn edit"
                                onClick={() => openEditModal(announcement)}
                              >
                                ✏️ 编辑
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={() => setShowDeleteConfirm(announcement.id)}
                              >
                                🗑️ 删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ← 上一页
                  </button>
                  <span className="page-info">
                    第 {currentPage} / {pagination.totalPages} 页，共 {pagination.total} 条
                  </span>
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                  >
                    下一页 →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'publish' && (
        <div className="publish-section">
          <div className="publish-form-card">
            <h2 className="form-title">发布新公告</h2>

            <div className="form-group">
              <label>公告标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入公告标题"
                maxLength={100}
              />
              <span className="char-count">{formData.title.length}/100</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>公告分类 *</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as AnnouncementCategory })
                  }
                >
                  <option value="water_electricity">💧 停水停电</option>
                  <option value="property">🏢 物业消息</option>
                  <option value="community_activity">🎉 社区活动</option>
                  <option value="other">📋 其他通知</option>
                </select>
              </div>
              <div className="form-group">
                <label>优先级 *</label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as AnnouncementPriority })
                  }
                >
                  <option value="normal">普通</option>
                  <option value="important">重要</option>
                  <option value="urgent">🔥 紧急</option>
                </select>
              </div>
              <div className="form-group">
                <label>状态</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as AnnouncementStatus })
                  }
                >
                  <option value="published">立即发布</option>
                  <option value="draft">保存草稿</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>公告内容 *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="请输入公告详细内容，支持换行..."
                rows={12}
              />
            </div>

            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFormData({
                    title: '',
                    content: '',
                    category: 'property',
                    priority: 'normal',
                    status: 'published',
                  });
                }}
              >
                清空内容
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {formData.status === 'published' ? '🚀 立即发布' : '💾 保存草稿'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ 编辑公告</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>公告标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入公告标题"
                  maxLength={100}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>公告分类 *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as AnnouncementCategory })
                    }
                  >
                    <option value="water_electricity">💧 停水停电</option>
                    <option value="property">🏢 物业消息</option>
                    <option value="community_activity">🎉 社区活动</option>
                    <option value="other">📋 其他通知</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>优先级 *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as AnnouncementPriority })
                    }
                  >
                    <option value="normal">普通</option>
                    <option value="important">重要</option>
                    <option value="urgent">🔥 紧急</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as AnnouncementStatus })
                    }
                  >
                    <option value="published">已发布</option>
                    <option value="draft">草稿</option>
                    <option value="archived">已归档</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>公告内容 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="请输入公告详细内容，支持换行..."
                  rows={10}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🗑️ 确认删除</h2>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>确定要删除这条公告吗？此操作不可恢复。</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      <style>{`
        .admin-announcement-page {
          padding-top: 0;
        }
        .page-header {
          margin-bottom: 20px;
        }
        .page-header h1 {
          font-size: 28px;
          margin-bottom: 6px;
        }
        .page-subtitle {
          color: #666;
          font-size: 14px;
        }
        .tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          border-bottom: 2px solid #f0f0f0;
        }
        .tab {
          padding: 12px 24px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 15px;
          color: #666;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tab:hover {
          color: #667eea;
        }
        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
          font-weight: 600;
        }
        .tab-count {
          background: #f0f2ff;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
          color: #667eea;
        }
        .tab.active .tab-count {
          background: #667eea;
          color: white;
        }
        .section-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .filter-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-btn {
          padding: 8px 16px;
          border: none;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .filter-btn:hover {
          background: #f0f2ff;
          color: #667eea;
        }
        .filter-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }
        .announcement-table-wrap {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .announcement-table {
          width: 100%;
          border-collapse: collapse;
        }
        .announcement-table th,
        .announcement-table td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
        }
        .announcement-table th {
          background: #fafafa;
          font-weight: 600;
          color: #333;
          white-space: nowrap;
        }
        .announcement-table tr:last-child td {
          border-bottom: none;
        }
        .announcement-table tbody tr:hover {
          background: #fafbfc;
        }
        .title-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .title-text {
          font-weight: 500;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 300px;
        }
        .urgent-tag {
          background: #fff1f0;
          color: #ff4d4f;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .category-badge,
        .priority-badge,
        .status-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }
        .publisher-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .avatar-xs {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .date-cell {
          color: #999;
          font-size: 13px;
          white-space: nowrap;
        }
        .action-btns {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .action-btn {
          padding: 4px 10px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn.edit {
          background: #e6f7ff;
          color: #1890ff;
        }
        .action-btn.edit:hover {
          background: #1890ff;
          color: white;
        }
        .action-btn.delete {
          background: #fff1f0;
          color: #ff4d4f;
        }
        .action-btn.delete:hover {
          background: #ff4d4f;
          color: white;
        }
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 20px;
        }
        .page-btn {
          padding: 8px 16px;
          border: 1px solid #e0e0e0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          transition: all 0.2s;
        }
        .page-btn:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .page-info {
          color: #999;
          font-size: 14px;
        }
        .publish-section {
          max-width: 900px;
        }
        .publish-form-card {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .form-title {
          font-size: 20px;
          margin: 0 0 24px 0;
          color: #333;
        }
        .form-group {
          margin-bottom: 20px;
          position: relative;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #667eea;
        }
        .form-group textarea {
          resize: vertical;
          line-height: 1.8;
        }
        .char-count {
          position: absolute;
          right: 12px;
          top: 42px;
          font-size: 12px;
          color: #999;
        }
        .form-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        .btn {
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          font-weight: 500;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .btn-secondary {
          background: #f5f5f5;
          color: #666;
        }
        .btn-secondary:hover {
          background: #e8e8e8;
        }
        .btn-danger {
          background: #ff4d4f;
          color: white;
        }
        .btn-danger:hover {
          background: #ff7875;
        }
        .loading, .empty-state {
          text-align: center;
          padding: 60px 0;
          color: #999;
        }
        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal.large {
          max-width: 800px;
        }
        .modal.small {
          max-width: 400px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #f0f0f0;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 18px;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          color: #999;
          cursor: pointer;
          line-height: 1;
        }
        .modal-body {
          padding: 24px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #f0f0f0;
        }
        .toast {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          z-index: 2000;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          animation: slideDown 0.3s ease;
        }
        .toast.success {
          background: #52c41a;
        }
        .toast.error {
          background: #ff4d4f;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          .announcement-table {
            display: block;
            overflow-x: auto;
          }
          .tabs {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminAnnouncementManage;
