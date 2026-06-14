import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoriteFolderApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { FavoriteFolder } from '../types';

function FavoriteFolders() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FavoriteFolder | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadFolders();
  }, [isAuthenticated]);

  const loadFolders = async () => {
    setLoading(true);
    const res = await favoriteFolderApi.getFolders();
    if (res.success) {
      setFolders(res.data || []);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingFolder(null);
    setFormData({ name: '', description: '', icon: '' });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (folder: FavoriteFolder) => {
    setEditingFolder(folder);
    setFormData({
      name: folder.name,
      description: folder.description || '',
      icon: folder.icon || '',
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('请输入收藏夹名称');
      return;
    }
    setSubmitting(true);
    try {
      let res;
      if (editingFolder) {
        res = await favoriteFolderApi.updateFolder(editingFolder.id, formData);
      } else {
        res = await favoriteFolderApi.createFolder(formData);
      }
      if (res.success) {
        alert(editingFolder ? '修改成功' : '创建成功');
        setShowCreateModal(false);
        loadFolders();
      } else {
        alert(res.message || '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (folderId: string) => {
    const res = await favoriteFolderApi.deleteFolder(folderId);
    if (res.success) {
      alert('删除成功');
      setDeleteConfirmId(null);
      loadFolders();
    } else {
      alert(res.message || '删除失败');
    }
  };

  const folderIcons = ['📁', '📂', '❤️', '⭐', '🎯', '🏠', '🛠️', '🎨', '📚', '🎮'];

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  return (
    <div className="container favorite-folders-page">
      <div className="page-header">
        <h1>我的收藏夹</h1>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + 新建收藏夹
        </button>
      </div>

      {folders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <p>还没有收藏夹</p>
          <p className="text-muted">创建一个收藏夹，开始收藏你喜欢的物品和技能吧</p>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            创建第一个收藏夹
          </button>
        </div>
      ) : (
        <div className="folder-grid">
          {folders.map((folder) => (
            <div key={folder.id} className="folder-card">
              <div className="folder-card-header">
                <span className="folder-icon">{folder.icon || '📁'}</span>
                <div className="folder-actions">
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(folder);
                    }}
                    title="编辑"
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(folder.id);
                    }}
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div
                className="folder-card-body"
                onClick={() => navigate(`/favorite-folders/${folder.id}`)}
              >
                <h3 className="folder-name">{folder.name}</h3>
                {folder.description && (
                  <p className="folder-desc">{folder.description}</p>
                )}
                <div className="folder-meta">
                  <span className="folder-count">{folder.itemCount} 个收藏</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingFolder ? '编辑收藏夹' : '新建收藏夹'}</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">收藏夹名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：周末要用、装修工具"
                  maxLength={20}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">描述（选填）</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="简单描述这个收藏夹的用途"
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label className="form-label">选择图标</label>
                <div className="icon-picker">
                  {folderIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '提交中...' : editingFolder ? '保存修改' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认删除</h3>
              <button className="modal-close" onClick={() => setDeleteConfirmId(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>确定要删除这个收藏夹吗？</p>
              <p className="text-muted">删除后，收藏夹内的所有收藏也会被移除，此操作不可恢复。</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .favorite-folders-page {
          padding-top: 20px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 24px;
        }
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 12px;
        }
        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        .empty-state p {
          margin-bottom: 8px;
        }
        .empty-state .btn {
          margin-top: 16px;
        }
        .folder-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .folder-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .folder-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        .folder-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea11 0%, #764ba211 100%);
        }
        .folder-icon {
          font-size: 32px;
        }
        .folder-actions {
          display: flex;
          gap: 8px;
        }
        .icon-btn {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.2s;
        }
        .icon-btn:hover {
          background: rgba(0, 0, 0, 0.08);
        }
        .folder-card-body {
          padding: 20px;
        }
        .folder-name {
          font-size: 18px;
          margin-bottom: 8px;
        }
        .folder-desc {
          color: #999;
          font-size: 14px;
          margin-bottom: 12px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .folder-meta {
          display: flex;
          justify-content: space-between;
        }
        .folder-count {
          color: #667eea;
          font-size: 14px;
          font-weight: 500;
        }
        .icon-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .icon-option {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          border: 2px solid #e8e8e8;
          border-radius: 10px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        .icon-option:hover {
          border-color: #667eea;
          background: #f5f7fa;
        }
        .icon-option.selected {
          border-color: #667eea;
          background: #f0f2ff;
        }
        .modal-body {
          padding: 0 24px;
        }
        .modal-body p {
          margin-bottom: 8px;
        }
        .modal-small {
          max-width: 400px;
        }
        @media (max-width: 768px) {
          .folder-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default FavoriteFolders;
