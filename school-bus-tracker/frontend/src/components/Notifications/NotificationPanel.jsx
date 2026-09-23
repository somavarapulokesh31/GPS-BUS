import { markNotifRead } from '../../services/api'

const icons = { delay: '⚠️', approaching: '📍', announcement: '📢' }

export default function NotificationPanel({ notifications, onRefresh }) {
  const handleRead = async (id) => {
    await markNotifRead(id)
    onRefresh()
  }

  if (!notifications.length) {
    return <p style={{ color: '#aaa', textAlign: 'center', padding: 20 }}>No notifications yet.</p>
  }

  return (
    <div className="notif-panel">
      {notifications.map(n => (
        <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
          <div className="notif-icon">{icons[n.type] || '🔔'}</div>
          <div className="notif-body" style={{ flex: 1 }}>
            <p>{n.message}</p>
            <small>{new Date(n.created_at).toLocaleString()}</small>
          </div>
          {!n.is_read && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div className="unread-dot" />
              <button className="btn btn-sm btn-secondary" onClick={() => handleRead(n.id)}>
                ✓
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
