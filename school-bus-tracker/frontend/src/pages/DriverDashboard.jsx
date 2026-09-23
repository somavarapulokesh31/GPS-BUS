import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDriverMe, startTrip, endTrip, reportDelay } from '../services/api'
import { connectDriverWS, sendGPSUpdate } from '../services/websocket'
import Sidebar from '../components/shared/Sidebar'

export default function DriverDashboard() {
  const { token } = useAuth()
  const [info, setInfo] = useState(null)
  const [trip, setTrip] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const [delayDesc, setDelayDesc] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const wsRef = useRef(null)
  const geoRef = useRef(null)

  const load = async () => {
    const res = await getDriverMe()
    setInfo(res.data)
  }

  useEffect(() => { load() }, [])

  const handleStartTrip = async () => {
    try {
      setError('')
      const res = await startTrip()
      setTrip(res.data)
      setMessage('Trip started! GPS tracking active.')
      startGPS(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to start trip')
    }
  }

  const handleEndTrip = async () => {
    try {
      stopGPS()
      const res = await endTrip()
      setTrip(null)
      setIsTracking(false)
      setMessage('Trip ended successfully.')
      load()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to end trip')
    }
  }

  const startGPS = (tripData) => {
    // Connect WebSocket
    const ws = connectDriverWS(token, () => {})
    wsRef.current = ws

    // Start Geolocation watch
    ws.onopen = () => {
      setIsTracking(true)
      geoRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          sendGPSUpdate(
            ws,
            tripData.id,
            tripData.bus_id,
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.speed ? pos.coords.speed * 3.6 : 30 // m/s → km/h
          )
        },
        (err) => console.error('GPS error', err),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      )
    }
  }

  const stopGPS = () => {
    if (geoRef.current) navigator.geolocation.clearWatch(geoRef.current)
    if (wsRef.current) wsRef.current.close()
    setIsTracking(false)
  }

  const handleReportDelay = async () => {
    if (!delayDesc.trim()) return
    try {
      await reportDelay(delayDesc)
      setMessage('Delay reported to admin and parents.')
      setDelayDesc('')
    } catch (e) {
      setError('Failed to report delay.')
    }
  }

  if (!info) return <div className="app-layout"><Sidebar /><div className="main-content"><p>Loading…</p></div></div>

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <h1>👨‍✈️ Driver Dashboard</h1>
          {isTracking && <span className="badge badge-active">🟢 GPS ACTIVE</span>}
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error   && <div className="alert alert-error">{error}</div>}

        {/* Bus Info */}
        <div className="card">
          <h3>My Bus</h3>
          {info.bus ? (
            <table>
              <tbody>
                <tr><td><strong>Bus Number</strong></td><td>{info.bus.bus_number}</td></tr>
                <tr><td><strong>Status</strong></td><td><span className={`badge badge-${info.bus.status}`}>{info.bus.status}</span></td></tr>
                <tr><td><strong>Route</strong></td><td>{info.route?.name || 'Not assigned'}</td></tr>
              </tbody>
            </table>
          ) : <p style={{ color: '#aaa' }}>No bus assigned to you yet.</p>}
        </div>

        {/* Trip Controls */}
        {info.bus && (
          <div className="card">
            <h3>Trip Controls</h3>
            <div className="trip-controls">
              {!trip ? (
                <button className="btn btn-success" onClick={handleStartTrip}>
                  ▶ Start Trip
                </button>
              ) : (
                <button className="btn btn-danger" onClick={handleEndTrip}>
                  ■ End Trip
                </button>
              )}
            </div>
            {trip && (
              <p style={{ fontSize: '0.85rem', color: '#27ae60' }}>
                Trip #{trip.id} started at {new Date(trip.started_at).toLocaleTimeString()}
                {isTracking ? ' · Sending GPS every 5s' : ' · GPS connecting…'}
              </p>
            )}
          </div>
        )}

        {/* Route Stops */}
        {info.route?.stops?.length > 0 && (
          <div className="card">
            <h3>🗺️ Route: {info.route.name}</h3>
            <ul className="stops-list">
              {info.route.stops.map((s, i) => (
                <li key={s.id}>
                  <div className={`stop-dot ${i === info.route.stops.length - 1 ? 'last' : ''}`} />
                  <div>
                    <strong>{s.name}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#aaa' }}>
                      {s.lat?.toFixed(4)}, {s.lon?.toFixed(4)}
                      {s.scheduled_time && ` · Scheduled: ${s.scheduled_time}`}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Report Delay */}
        {trip && (
          <div className="card">
            <h3>⚠️ Report a Delay</h3>
            <div className="form-group">
              <label>Describe the issue</label>
              <textarea
                rows={3} className="form-control"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', resize: 'vertical' }}
                value={delayDesc}
                onChange={e => setDelayDesc(e.target.value)}
                placeholder="e.g. Heavy traffic on Main St, delayed by ~10 mins"
              />
            </div>
            <button className="btn btn-danger" onClick={handleReportDelay}>
              Report Delay
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
