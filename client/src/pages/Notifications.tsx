import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../api';
import type { Notification, NotificationType } from '../types';

type FilterType = 'all' | NotificationType;

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (filterType === 'all') return notifications;
    return notifications.filter((n) => n.type === filterType);
  }, [notifications, filterType]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      order_status: '📦',
      dispute_status: '⚖️',
      new_review: '⭐',
      queue_turn: '🔔',
      queue_expired: '⏰',
      queue_cancelled: '❌',
      new_skill_from_followed: '✨',
      system: '📢',
    };
    return icons[type] || '📧';
  };

  const getNotificationTypeName = (type: string) => {
    const names: Record<string, string> = {
      order_status: '订单通知',
      dispute_status: '纠纷通知',
      new_review: '评价通知',
      queue_turn: '排队通知',
      queue_expired: '排队通知',
      queue_cancelled: '排队通知',
      new_skill_from_followed: '关注动态',
      system: '系统通知',
    };
    return names[type] || '其他';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      order_status: '#1890ff',
      dispute_status: '#fa8c16',
      new_review: '#fadb14',
      queue_turn: '#52c41a',
      queue_expired: '#ff4d4f',
      queue_cancelled: '#999',
      new_skill_from_followed: '#667eea',
      system: '#722ed1',
    };
    return colors[type] || '#667eea';
  };

  const handleMarkAsRead = async (id: string) => {
    await notificationApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = async (id: string) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await notificationApi.deleteNotification(deleteTarget);
    setNotifications((prev) => prev.filter((n) => n.id !== deleteTarget));
    setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget));
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 条通知吗？`)) return;
    await notificationApi.deleteMany(selectedIds);
    setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
    setSelectedIds([]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGoToDetail = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.relatedType === 'borrow_order') {
      navigate(`/orders/borrow/${notification.relatedId}`);
    } else if (notification.relatedType === 'service_order') {
      navigate(`/orders/service/${notification.relatedId}`);
    } else if (notification.relatedType === 'dispute') {
      navigate(`/disputes/${notification.relatedId}`);
    } else if (notification.relatedType === 'item') {
      navigate(`/items/${notification.relatedId}`);
    } else if (notification.relatedType === 'skill') {
      navigate(`/skills/${notification.relatedId}`);
    }
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'order_status', label: '订单通知' },
    { value: 'dispute_status', label: '纠纷通知' },
    { value: 'new_review', label: '评价通知' },
    { value: 'queue_turn', label: '排队通知' },
    { value: 'new_skill_from_followed', label: '关注动态' },
    { value: 'system', label: '系统通知' },
  ];

  return (
    <div className="container notifications-page">
      <div className="page-header">
        <h1>消息通知</h1>
        <p className="page-subtitle">
          共 {notifications.length} 条通知，{unreadCount} 条未读
        </p>
      </div>

      <div className="notifications-toolbar">
        <div className="filter-tabs">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              className={`filter-tab ${filterType === option.value ? 'active' : ''}`}
              onClick={() => setFilterType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          {unreadCount > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={handleMarkAllAsRead}>
              全部已读
            </button>
          )}
          {selectedIds.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleBatchDelete}>
              删除选中 ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>暂无{filterType === 'all' ? '' : getNotificationTypeName(filterType)}通知</p>
        </div>
      ) : (
        <div className="notifications-list">
          <div className="select-all-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                onChange={handleSelectAll}
              />
              <span>全选</span>
            </label>
          </div>
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card ${!notification.read ? 'unread' : ''}`}
            >
              <div className="notification-select">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(notification.id)}
                    onChange={() => handleSelect(notification.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </label>
              </div>
              <div
                className="notification-icon-wrapper"
                style={{ background: getTypeColor(notification.type) + '20', color: getTypeColor(notification.type) }}
              >
                <span className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </span>
              </div>
              <div className="notification-main" onClick={() => handleGoToDetail(notification)}>
                <div className="notification-header">
                  <span className="notification-type-tag" style={{ color: getTypeColor(notification.type) }}>
                    {getNotificationTypeName(notification.type)}
                  </span>
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="notification-title">{notification.title}</h3>
                <p className="notification-message">{notification.message}</p>
              </div>
              <div className="notification-actions">
                {!notification.read && (
                  <button
                    className="btn-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                  >
                    标为已读
                  </button>
                )}
                <button
                  className="btn-link btn-link-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification.id);
                  }}
                >
                  删除
                </button>
              </div>
              {!notification.read && <span className="notification-unread-dot"></span>}
            </div>
          ))}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认删除</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>确定要删除这条通知吗？</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .notifications-page {
          max-width: 900px;
          margin: 0 auto;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 28px;
          margin-bottom: 8px;
        }
        .page-subtitle {
          color: #999;
          font-size: 14px;
        }
        .notifications-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .filter-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-tab {
          padding: 8px 16px;
          border: none;
          background: #f5f5f5;
          border-radius: 20px;
          font-size: 14px;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-tab:hover {
          background: #e8e8e8;
        }
        .filter-tab.active {
          background: #667eea;
          color: white;
        }
        .toolbar-actions {
          display: flex;
          gap: 12px;
        }
        .btn-sm {
          padding: 6px 14px;
          font-size: 13px;
        }
        .btn-link {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          font-size: 13px;
          padding: 4px 8px;
        }
        .btn-link:hover {
          text-decoration: underline;
        }
        .btn-link-danger {
          color: #ff4d4f;
        }
        .loading {
          text-align: center;
          padding: 60px 0;
          color: #999;
        }
        .empty-state {
          text-align: center;
          padding: 80px 20px;
        }
        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        .empty-state p {
          color: #999;
          font-size: 14px;
        }
        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .select-all-row {
          padding: 12px 16px;
          background: white;
          border-radius: 8px;
          border: 1px solid #f0f0f0;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #666;
        }
        .checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        .notification-card {
          display: grid;
          grid-template-columns: auto auto 1fr auto;
          gap: 16px;
          align-items: flex-start;
          padding: 20px;
          background: white;
          border-radius: 12px;
          border: 1px solid #f0f0f0;
          position: relative;
          transition: all 0.2s;
          cursor: pointer;
        }
        .notification-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border-color: #e8e8e8;
        }
        .notification-card.unread {
          background: #f0f7ff;
          border-color: #d6e8ff;
        }
        .notification-select {
          padding-top: 4px;
        }
        .notification-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .notification-icon {
          font-size: 24px;
        }
        .notification-main {
          min-width: 0;
        }
        .notification-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .notification-type-tag {
          font-size: 12px;
          font-weight: 500;
        }
        .notification-time {
          font-size: 12px;
          color: #999;
        }
        .notification-title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 6px;
          color: #333;
        }
        .notification-message {
          font-size: 14px;
          color: #666;
          line-height: 1.6;
          margin: 0;
        }
        .notification-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
          flex-shrink: 0;
        }
        .notification-unread-dot {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 10px;
          height: 10px;
          background: #ff4d4f;
          border-radius: 50%;
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
        .modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 480px;
          max-height: 80vh;
          overflow-y: auto;
        }
        .modal-small {
          max-width: 360px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #f0f0f0;
        }
        .modal-header h3 {
          font-size: 18px;
          margin: 0;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
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
        .btn {
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .btn-primary:hover {
          opacity: 0.9;
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
        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 24px;
          }
          .notification-card {
            grid-template-columns: auto 1fr;
            grid-template-areas:
              "select icon"
              "main main"
              "actions actions";
            gap: 12px;
          }
          .notification-select {
            grid-area: select;
          }
          .notification-icon-wrapper {
            grid-area: icon;
            width: 40px;
            height: 40px;
          }
          .notification-icon {
            font-size: 20px;
          }
          .notification-main {
            grid-area: main;
          }
          .notification-actions {
            grid-area: actions;
            flex-direction: row;
            justify-content: flex-end;
          }
          .notification-unread-dot {
            top: 12px;
            right: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default Notifications;
