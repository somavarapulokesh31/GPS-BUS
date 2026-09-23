import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const links = {
  admin: [
    { to: '/admin', label: '📊 Dashboard' },
    { to: '/admin/buses', label: '🚌 Buses' },
    { to: '/admin/routes', label: '🗺️ Routes' },
    { to: '/admin/drivers', label: '👨‍✈️ Drivers' },
    { to: '/admin/students', label: '🎒 Students' },
    { to: '/admin/monitor', label: '📡 Live Monitor' },
  ],
  driver: [
    { to: '/driver', label: '🚌 My Dashboard' },
  ],
  parent: [
    { to: '/parent', label: '🗺️ Track Bus' },
    { to: '/parent/notifications', label: '🔔 Notifications' },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }
  const role = user?.role || 'parent'
  const navLinks = links[role] || []

  return (
    <div className="sidebar">
      <h2>🚌 Bus Tracker</h2>
      <div style={{ marginBottom: 8, padding: '8px 14px', background: '#16213e', borderRadius: 8 }}>
        <div style={{ fontSize: '0.8rem', color: '#f0c040', fontWeight: 600 }}>{user?.full_name}</div>
        <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase' }}>{role}</div>
      </div>

      {navLinks.map(link => (
        <NavLink
          key={link.to} to={link.to} end={link.to.split('/').length === 2}
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          {link.label}
        </NavLink>
      ))}

      <div style={{ flex: 1 }} />
      <button onClick={handleLogout} style={{ color: '#e74c3c', marginTop: 'auto' }}>
        🚪 Logout
      </button>
    </div>
  )
}
