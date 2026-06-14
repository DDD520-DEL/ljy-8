import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { favoriteFolderApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { FavoriteFolder, FavoriteItemWithDetail } from '../types';

function FavoriteFolderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [folder, setFolder] = useState<FavoriteFolder | null>(null);
  const [items, setItems] = useState<FavoriteItemWithDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (id) {
      loadFolderData();
    }
  }, [id, isAuthenticated]);

  const loadFolderData = async () => {
    setLoading(true);
    const [folderRes, itemsRes] = await Promise.all([
      favoriteFolderApi.getFolder(id!),
      favoriteFolderApi.getFolderItems(id!),
    ]);
    if (folderRes.success) {
      setFolder(folderRes.data);
    }
    if (itemsRes.success) {
      setItems(itemsRes.data || []);
    }
    setLoading(false);
  };

  const toggleSelect = (favoriteId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(favoriteId)) {
      newSelected.delete(favoriteId);
    } else {
      newSelected.add(favoriteId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  const handleRemoveSingle = async (favoriteId: string) => {
    const res = await favoriteFolderApi.removeFromFolder(id!, favoriteId);
    if (res.success) {
      setItems(items.filter((item) => item.id !== favoriteId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(favoriteId);
        return next;
      });
      setShowDeleteConfirm(null);
    } else {
      alert(res.message || '移除失败');
    }
  };

  const handleBatchRemove = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要移除选中的 ${selectedIds.size} 个收藏吗？`)) return;
    const res = await favoriteFolderApi.batchRemoveFromFolder(id!, Array.from(selectedIds));
    if (res.success) {
      setItems(items.filter((item) => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
      alert(`已移除 ${res.data.success} 个收藏`);
    } else {
      alert(res.message || '移除失败');
    }
  };

  const handleItemClick = (item: FavoriteItemWithDetail) => {
    if (item.targetType === 'item' && item.item) {
      navigate(`/items/${item.targetId}`);
    } else if (item.targetType === 'skill' && item.skill) {
      navigate(`/skills/${item.targetId}`);
    }
  };

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  if (!folder) {
    return <div className="container">收藏夹不存在</div>;
  }

  return (
    <div className="container favorite-folder-detail">
      <div className="breadcrumb">
        <Link to="/favorite-folders">我的收藏夹</Link> / <span>{folder.name}</span>
      </div>

      <div className="folder-header">
        <div className="folder-info">
          <span className="folder-icon-lg">{folder.icon || '📁'}</span>
          <div>
            <h1 className="folder-title">{folder.name}</h1>
            {folder.description && <p className="folder-desc">{folder.description}</p>}
            <p className="folder-count-info">共 {items.length} 个收藏</p>
          </div>
        </div>
        {selectedIds.size > 0 && (
          <div className="batch-actions">
            <span className="selected-count">已选 {selectedIds.size} 项</span>
            <button className="btn btn-danger" onClick={handleBatchRemove}>
              批量移除
            </button>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="select-bar">
          <label className="select-all">
            <input
              type="checkbox"
              checked={selectedIds.size === items.length && items.length > 0}
              onChange={toggleSelectAll}
            />
            全选
          </label>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>这个收藏夹还没有内容</p>
          <p className="text-muted">去发现喜欢的物品和技能，加入收藏夹吧</p>
          <div className="empty-actions">
            <Link to="/items" className="btn btn-primary">
              去看看物品
            </Link>
            <Link to="/skills" className="btn btn-secondary">
              去看看技能
            </Link>
          </div>
        </div>
      ) : (
        <div className="favorite-items-list">
          {items.map((item) => {
            const targetItem = item.targetType === 'item' ? item.item : item.skill;
            if (!targetItem) return null;

            const title = item.targetType === 'item' ? (item.item?.title ?? '') : (item.skill?.title ?? '');
            const image = item.targetType === 'item' ? (item.item?.images[0] ?? '') : (item.skill?.images[0] ?? '');
            const owner = item.targetType === 'item' ? item.item?.owner : item.skill?.provider;

            return (
              <div
                key={item.id}
                className={`favorite-item-card ${selectedIds.has(item.id) ? 'selected' : ''}`}
              >
                <div className="item-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div
                  className="item-content"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="item-image">
                    {image ? (
                      <img src={image} alt={title} />
                    ) : (
                      <div className="image-placeholder">
                        {item.targetType === 'item' ? '📦' : '💡'}
                      </div>
                    )}
                    <span className={`type-tag type-${item.targetType}`}>
                      {item.targetType === 'item' ? '物品' : '技能'}
                    </span>
                  </div>
                  <div className="item-info">
                    <h3 className="item-title">{title}</h3>
                    {owner && (
                      <div className="item-owner">
                        <img src={owner.avatar} alt="" className="avatar avatar-sm" />
                        <span>{owner.nickname}</span>
                      </div>
                    )}
                    <p className="item-date">
                      收藏于 {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => setShowDeleteConfirm(item.id)}
                  title="移除收藏"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认移除</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>确定要从收藏夹中移除吗？</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleRemoveSingle(showDeleteConfirm)}
              >
                确认移除
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .favorite-folder-detail {
          padding-top: 0;
        }
        .breadcrumb {
          margin-bottom: 20px;
          color: #999;
          font-size: 14px;
        }
        .breadcrumb a {
          color: #667eea;
        }
        .folder-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding: 24px;
          background: white;
          border-radius: 12px;
        }
        .folder-info {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .folder-icon-lg {
          font-size: 48px;
        }
        .folder-title {
          font-size: 24px;
          margin-bottom: 4px;
        }
        .folder-desc {
          color: #666;
          margin-bottom: 4px;
          font-size: 14px;
        }
        .folder-count-info {
          color: #999;
          font-size: 14px;
        }
        .batch-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .selected-count {
          color: #667eea;
          font-size: 14px;
        }
        .select-bar {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          padding: 12px 16px;
          background: #f5f7fa;
          border-radius: 8px;
        }
        .select-all {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        .select-all input {
          width: 16px;
          height: 16px;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
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
        .empty-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 20px;
        }
        .favorite-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .favorite-item-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          border: 2px solid transparent;
          transition: all 0.2s;
        }
        .favorite-item-card.selected {
          border-color: #667eea;
          background: #f5f7fa;
        }
        .item-checkbox {
          flex-shrink: 0;
        }
        .item-checkbox input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .item-content {
          flex: 1;
          display: flex;
          gap: 16px;
          cursor: pointer;
          min-width: 0;
        }
        .item-image {
          width: 100px;
          height: 100px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          position: relative;
          background: #f5f5f5;
        }
        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
        }
        .type-tag {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          color: white;
        }
        .type-item {
          background: #fa8c16;
        }
        .type-skill {
          background: #722ed1;
        }
        .item-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
        }
        .item-title {
          font-size: 16px;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .item-owner {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #666;
        }
        .avatar-sm {
          width: 20px;
          height: 20px;
        }
        .item-date {
          font-size: 12px;
          color: #999;
        }
        .remove-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f5f5f5;
          color: #999;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .remove-btn:hover {
          background: #fff1f0;
          color: #ff4d4f;
        }
        .modal-body {
          padding: 0 24px;
        }
        .modal-small {
          max-width: 400px;
        }
        @media (max-width: 768px) {
          .folder-header {
            flex-direction: column;
            gap: 16px;
          }
          .batch-actions {
            width: 100%;
            justify-content: flex-end;
          }
          .item-image {
            width: 80px;
            height: 80px;
          }
        }
      `}</style>
    </div>
  );
}

export default FavoriteFolderDetail;
