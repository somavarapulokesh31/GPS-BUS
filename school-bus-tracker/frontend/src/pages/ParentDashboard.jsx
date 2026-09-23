import { useEffect, useState, useRef } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getParentBus, getNotifications, markAllNotifsRead } from '../services/api'
import { subscribeToBus } from '../services/websocket'
import LiveMap from '../components/Map/LiveMap'
import NotificationPanel from '../components/Notifications/NotificationPanel'
import Sidebar from '../components/shared/Sidebar'

function BusView() {
  const { token } = useAuth()
  const location = useLocation()
  const [data, setData] = useState(null)
  const [busLocation, setBusLocation] = useState(null)
  const [etaStops, setEtaStops] = useState([])
  const [busStatus, setBusStatus] = useState(null)
  const [wsNotifs, setWsNotifs] = useState([])
  const [error, setError] = useState('')
  const wsRef = useRef(null)

  const load = async () => {
    try {
      const res = await getParentBus()
      setData(res.data)
      if (res.data.current_location?.latitude) {
        setBusLocation(res.data.current_location)
      }
      setBusStatus(res.data.bus?.status)
      setEtaStops(res.data.eta_all_stops || [])
    } catch {
      setError('No bus assigned to your child yet.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!data?.bus?.id || !token) return
    const ws = subscribeToBus(data.bus.id, token, (msg) => {
      if (msg.type === 'bus_location') {
        setBusLocation({ latitude: msg.latitude, longitude: msg.longitude, speed: msg.speed })
        setBusStatus(msg.status)
        setEtaStops(msg.eta_stops || [])
      }
      if (msg.type === 'notification') {
        setWsNotifs(prev => [msg, ...prev])
      }
    })
    wsRef.current = ws
    return () => ws.close()
  }, [data?.bus?.id, token])

  if (error) return (
    <div>
      {location.state?.accountCreated && (
        <div className="alert alert-success">Account created successfully. Ask the school administrator to add your child and assign a bus.</div>
      )}
      <div className="alert alert-info">{error}</div>
    </div>
  )
  if (!data) return <p>Loading bus data…</p>

  const myStopEta = data.eta_my_stop

  return (
    <div>
      <div className="topbar">
        <h1>🚌 Track Your Bus</h1>
        <span className={`badge badge-${data.bus.status}`}>{data.bus.status.toUpperCase()}</span>
      </div>

      {location.state?.accountCreated && (
        <div className="alert alert-success">Account created successfully. Your bus details will appear after the school administrator assigns your child.</div>
      )}

      {/* Live push notifications */}
      {wsNotifs.map((n, i) => (
        <div key={i} className="alert alert-info">🔔 {n.message}</div>
      ))}

      {/* ETA Box */}
      <div className="eta-box">
        <div className="eta-label">Bus {data.bus.bus_number} — Next Arrival at Your Stop</div>
        <div className="eta-time">
          {myStopEta ? `${myStopEta.eta_minutes} min` : '—'}
        </div>
        <div className="eta-label">{myStopEta ? `Expected: ${myStopEta.eta_time}` : 'Waiting for trip to start'}</div>
        <div className="bus-status">
          <span className={`badge badge-${busStatus || data.bus.status}`}>
            {(busStatus || data.bus.status).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Your stop info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>📍 Your Assigned Stop</h3>
        <p><strong>{data.assigned_stop.name}</strong></p>
        <p style={{ color: '#888', fontSize: '0.85rem' }}>
          Lat: {data.assigned_stop.latitude}, Lon: {data.assigned_stop.longitude}
        </p>
      </div>

      {/* Live Map */}
      <div className="card">
        <h3>🗺️ Live Map — {data.route.name}</h3>
        <LiveMap
          busLocation={busLocation}
          stops={data.route.stops}
          assignedStopId={data.assigned_stop.id}
          etaStops={etaStops}
        />
      </div>

      {/* ETA all stops */}
      {etaStops.length > 0 && (
        <div className="card">
          <h3>⏱️ ETA at All Stops</h3>
          <table>
            <thead><tr><th>Stop</th><th>Distance</th><th>ETA (min)</th><th>Expected Time</th></tr></thead>
            <tbody>
              {etaStops.map(s => (
                <tr key={s.stop_id} style={s.stop_id === data.assigned_stop.id ? { background: '#fffbea' } : {}}>
                  <td>{s.stop_name} {s.stop_id === data.assigned_stop.id ? '⭐' : ''}</td>
                  <td>{s.distance_km} km</td>
                  <td><strong>{s.eta_minutes} min</strong></td>
                  <td>{s.eta_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function NotificationsView() {
  const [notifs, setNotifs] = useState([])

  const load = async () => {
    const res = await getNotifications()
    setNotifs(res.data)
  }

  const handleMarkAll = async () => {
    await markAllNotifsRead()
    load()
  }

  useEffect(() => { load() }, [])

  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div>
      <div className="topbar">
        <h1>🔔 Notifications {unread > 0 && <span className="badge badge-delayed">{unread}</span>}</h1>
        {unread > 0 && <button className="btn btn-secondary btn-sm" onClick={handleMarkAll}>Mark All Read</button>}
      </div>
      <div className="card">
        <NotificationPanel notifications={notifs} onRefresh={load} />
      </div>
    </div>
  )
}

export default function ParentDashboard() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route index element={<BusView />} />
          <Route path="notifications" element={<NotificationsView />} />
        </Routes>
      </div>
    </div>
  )
}
