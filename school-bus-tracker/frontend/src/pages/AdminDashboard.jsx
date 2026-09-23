import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from '../components/shared/Sidebar'
import {
  getStats, getMonitor,
  getBuses, createBus, deleteBus, assignDriver,
  getDrivers, createDriver, deleteDriver,
  getRoutes, createRoute, deleteRoute, addStop, deleteStop,
  getParents, createParent,
  getStudents, createStudent, deleteStudent, assignStudent,
  sendAnnouncement,
} from '../services/api'

// ── Overview ─────────────────────────────────────────────────────────────────
function Overview() {
  const [stats, setStats] = useState(null)
  const [buses, setBuses] = useState([])

  useEffect(() => {
    getStats().then(r => setStats(r.data))
    getMonitor().then(r => setBuses(r.data))
  }, [])

  return (
    <div>
      <div className="topbar"><h1>📊 Admin Dashboard</h1></div>
      {stats && (
        <div className="stats-grid">
          <div className="stat-card total"><div className="stat-number">{stats.total_buses}</div><div className="stat-label">Total Buses</div></div>
          <div className="stat-card active"><div className="stat-number">{stats.active_buses}</div><div className="stat-label">Active</div></div>
          <div className="stat-card delayed"><div className="stat-number">{stats.delayed_buses}</div><div className="stat-label">Delayed</div></div>
          <div className="stat-card"><div className="stat-number">{stats.completed_trips}</div><div className="stat-label">Completed Trips</div></div>
        </div>
      )}
      <div className="card">
        <h3>📡 Live Bus Monitor</h3>
        {buses.length === 0 ? <p style={{ color: '#aaa' }}>No active buses right now.</p> : (
          <table>
            <thead><tr><th>Bus</th><th>Status</th><th>Latitude</th><th>Longitude</th><th>Last Updated</th></tr></thead>
            <tbody>
              {buses.map(b => (
                <tr key={b.bus_id}>
                  <td><strong>{b.bus_number}</strong></td>
                  <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                  <td>{b.latitude?.toFixed(5) ?? '—'}</td>
                  <td>{b.longitude?.toFixed(5) ?? '—'}</td>
                  <td>{b.last_updated ? new Date(b.last_updated).toLocaleTimeString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Buses ─────────────────────────────────────────────────────────────────────
function Buses() {
  const [buses, setBuses] = useState([])
  const [drivers, setDrivers] = useState([])
  const [form, setForm] = useState({ bus_number: '', capacity: '' })
  const [assignForm, setAssignForm] = useState({ busId: '', driverId: '' })
  const [msg, setMsg] = useState('')

  const load = () => { getBuses().then(r => setBuses(r.data)); getDrivers().then(r => setDrivers(r.data)) }
  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    await createBus({ bus_number: form.bus_number, capacity: parseInt(form.capacity) || null })
    setForm({ bus_number: '', capacity: '' }); setMsg('Bus created!'); load()
  }
  const handleDelete = async (id) => { if (confirm('Delete this bus?')) { await deleteBus(id); load() } }
  const handleAssign = async (e) => {
    e.preventDefault()
    await assignDriver(assignForm.busId, parseInt(assignForm.driverId))
    setMsg('Driver assigned!'); load()
  }

  return (
    <div>
      <div className="topbar"><h1>🚌 Manage Buses</h1></div>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3>Add Bus</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group"><label>Bus Number</label><input required value={form.bus_number} onChange={e => setForm(f => ({ ...f, bus_number: e.target.value }))} /></div>
            <div className="form-group"><label>Capacity</label><input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} /></div>
            <button className="btn btn-primary" type="submit">Add Bus</button>
          </form>
        </div>
        <div className="card">
          <h3>Assign Driver to Bus</h3>
          <form onSubmit={handleAssign}>
            <div className="form-group">
              <label>Bus</label>
              <select value={assignForm.busId} onChange={e => setAssignForm(f => ({ ...f, busId: e.target.value }))}>
                <option value="">Select bus</option>
                {buses.map(b => <option key={b.id} value={b.id}>{b.bus_number}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Driver</label>
              <select value={assignForm.driverId} onChange={e => setAssignForm(f => ({ ...f, driverId: e.target.value }))}>
                <option value="">Select driver</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" type="submit">Assign</button>
          </form>
        </div>
      </div>
      <div className="card">
        <h3>All Buses</h3>
        <table>
          <thead><tr><th>ID</th><th>Number</th><th>Capacity</th><th>Status</th><th>Driver</th><th>Actions</th></tr></thead>
          <tbody>
            {buses.map(b => (
              <tr key={b.id}>
                <td>{b.id}</td><td><strong>{b.bus_number}</strong></td>
                <td>{b.capacity ?? '—'}</td>
                <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                <td>{drivers.find(d => d.id === b.driver_id)?.full_name ?? '—'}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Drivers ───────────────────────────────────────────────────────────────────
function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' })
  const [msg, setMsg] = useState('')

  const load = () => getDrivers().then(r => setDrivers(r.data))
  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    await createDriver({ ...form, role: 'driver' })
    setForm({ full_name: '', email: '', password: '', phone: '' }); setMsg('Driver created!'); load()
  }

  return (
    <div>
      <div className="topbar"><h1>👨‍✈️ Manage Drivers</h1></div>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="card">
        <h3>Add Driver</h3>
        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group"><label>Full Name</label><input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
          <div className="form-group"><label>Email</label><input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div className="form-group"><label>Password</label><input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
          <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div style={{ gridColumn: '1/-1' }}><button className="btn btn-primary" type="submit">Add Driver</button></div>
        </form>
      </div>
      <div className="card">
        <h3>All Drivers</h3>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
          <tbody>
            {drivers.map(d => (
              <tr key={d.id}>
                <td>{d.id}</td><td><strong>{d.full_name}</strong></td><td>{d.email}</td><td>{d.phone ?? '—'}</td>
                <td><button className="btn btn-danger btn-sm" onClick={async () => { if(confirm('Delete?')) { await deleteDriver(d.id); load() } }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────
function RoutesPage() {
  const [routes, setRoutes] = useState([])
  const [buses, setBuses] = useState([])
  const [form, setForm] = useState({ name: '', bus_id: '' })
  const [stopForm, setStopForm] = useState({ route_id: '', name: '', latitude: '', longitude: '', stop_order: '', scheduled_time: '' })
  const [msg, setMsg] = useState('')

  const load = () => { getRoutes().then(r => setRoutes(r.data)); getBuses().then(r => setBuses(r.data)) }
  useEffect(() => { load() }, [])

  const handleCreateRoute = async (e) => {
    e.preventDefault()
    await createRoute({ name: form.name, bus_id: form.bus_id ? parseInt(form.bus_id) : null, stops: [] })
    setForm({ name: '', bus_id: '' }); setMsg('Route created!'); load()
  }

  const handleAddStop = async (e) => {
    e.preventDefault()
    await addStop(stopForm.route_id, {
      name: stopForm.name,
      latitude: parseFloat(stopForm.latitude),
      longitude: parseFloat(stopForm.longitude),
      stop_order: parseInt(stopForm.stop_order),
      scheduled_time: stopForm.scheduled_time || null,
    })
    setStopForm({ route_id: '', name: '', latitude: '', longitude: '', stop_order: '', scheduled_time: '' })
    setMsg('Stop added!'); load()
  }

  return (
    <div>
      <div className="topbar"><h1>🗺️ Manage Routes</h1></div>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3>Create Route</h3>
          <form onSubmit={handleCreateRoute}>
            <div className="form-group"><label>Route Name</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Morning Route A" /></div>
            <div className="form-group">
              <label>Assign Bus (optional)</label>
              <select value={form.bus_id} onChange={e => setForm(f => ({ ...f, bus_id: e.target.value }))}>
                <option value="">None</option>
                {buses.map(b => <option key={b.id} value={b.id}>{b.bus_number}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" type="submit">Create Route</button>
          </form>
        </div>
        <div className="card">
          <h3>Add Stop to Route</h3>
          <form onSubmit={handleAddStop}>
            <div className="form-group">
              <label>Route</label>
              <select required value={stopForm.route_id} onChange={e => setStopForm(f => ({ ...f, route_id: e.target.value }))}>
                <option value="">Select route</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Stop Name</label><input required value={stopForm.name} onChange={e => setStopForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="form-group"><label>Latitude</label><input required type="number" step="any" value={stopForm.latitude} onChange={e => setStopForm(f => ({ ...f, latitude: e.target.value }))} /></div>
              <div className="form-group"><label>Longitude</label><input required type="number" step="any" value={stopForm.longitude} onChange={e => setStopForm(f => ({ ...f, longitude: e.target.value }))} /></div>
              <div className="form-group"><label>Order</label><input required type="number" value={stopForm.stop_order} onChange={e => setStopForm(f => ({ ...f, stop_order: e.target.value }))} /></div>
              <div className="form-group"><label>Scheduled Time</label><input type="time" value={stopForm.scheduled_time} onChange={e => setStopForm(f => ({ ...f, scheduled_time: e.target.value }))} /></div>
            </div>
            <button className="btn btn-primary" type="submit">Add Stop</button>
          </form>
        </div>
      </div>
      {routes.map(r => (
        <div key={r.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>🗺️ {r.name}</h3>
            <button className="btn btn-danger btn-sm" onClick={async () => { if(confirm('Delete route?')) { await deleteRoute(r.id); load() } }}>Delete Route</button>
          </div>
          {r.stops.length === 0 ? <p style={{ color: '#aaa', fontSize: '0.85rem' }}>No stops yet.</p> : (
            <table>
              <thead><tr><th>Order</th><th>Stop Name</th><th>Lat</th><th>Lon</th><th>Time</th><th>Action</th></tr></thead>
              <tbody>
                {r.stops.map(s => (
                  <tr key={s.id}>
                    <td>{s.stop_order}</td><td>{s.name}</td>
                    <td>{s.latitude}</td><td>{s.longitude}</td>
                    <td>{s.scheduled_time ?? '—'}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={async () => { await deleteStop(r.id, s.id); load() }}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Students & Parents ────────────────────────────────────────────────────────
function Students() {
  const [students, setStudents] = useState([])
  const [parents, setParents] = useState([])
  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [parentForm, setParentForm] = useState({ full_name: '', email: '', password: '', phone: '' })
  const [studentForm, setStudentForm] = useState({ full_name: '', parent_id: '' })
  const [assignForm, setAssignForm] = useState({ student_id: '', bus_id: '', stop_id: '' })
  const [availableStops, setAvailableStops] = useState([])
  const [msg, setMsg] = useState('')

  const load = () => {
    getStudents().then(r => setStudents(r.data))
    getParents().then(r => setParents(r.data))
    getBuses().then(r => setBuses(r.data))
    getRoutes().then(r => setRoutes(r.data))
  }
  useEffect(() => { load() }, [])

  const handleBusChange = (busId) => {
    setAssignForm(f => ({ ...f, bus_id: busId, stop_id: '' }))
    const route = routes.find(r => r.bus_id === parseInt(busId))
    setAvailableStops(route?.stops || [])
  }

  const handleCreateParent = async (e) => {
    e.preventDefault()
    await createParent({ ...parentForm, role: 'parent' })
    setParentForm({ full_name: '', email: '', password: '', phone: '' }); setMsg('Parent created!'); load()
  }

  const handleCreateStudent = async (e) => {
    e.preventDefault()
    await createStudent({ full_name: studentForm.full_name, parent_id: parseInt(studentForm.parent_id) })
    setStudentForm({ full_name: '', parent_id: '' }); setMsg('Student created!'); load()
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    await assignStudent({ student_id: parseInt(assignForm.student_id), bus_id: parseInt(assignForm.bus_id), stop_id: parseInt(assignForm.stop_id) })
    setMsg('Student assigned!'); load()
  }

  return (
    <div>
      <div className="topbar"><h1>🎒 Students & Parents</h1></div>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <h3>Add Parent Account</h3>
          <form onSubmit={handleCreateParent}>
            <div className="form-group"><label>Full Name</label><input required value={parentForm.full_name} onChange={e => setParentForm(f => ({ ...f, full_name: e.target.value }))} /></div>
            <div className="form-group"><label>Email</label><input type="email" required value={parentForm.email} onChange={e => setParentForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="form-group"><label>Password</label><input type="password" required value={parentForm.password} onChange={e => setParentForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div className="form-group"><label>Phone</label><input value={parentForm.phone} onChange={e => setParentForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <button className="btn btn-primary" type="submit">Add Parent</button>
          </form>
        </div>
        <div className="card">
          <h3>Add Student</h3>
          <form onSubmit={handleCreateStudent}>
            <div className="form-group"><label>Full Name</label><input required value={studentForm.full_name} onChange={e => setStudentForm(f => ({ ...f, full_name: e.target.value }))} /></div>
            <div className="form-group">
              <label>Parent</label>
              <select required value={studentForm.parent_id} onChange={e => setStudentForm(f => ({ ...f, parent_id: e.target.value }))}>
                <option value="">Select parent</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}
              </select>
            </div>
            <button className="btn btn-primary" type="submit">Add Student</button>
          </form>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Assign Student to Bus & Stop</h3>
        <form onSubmit={handleAssign} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
          <div className="form-group">
            <label>Student</label>
            <select required value={assignForm.student_id} onChange={e => setAssignForm(f => ({ ...f, student_id: e.target.value }))}>
              <option value="">Select</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Bus</label>
            <select required value={assignForm.bus_id} onChange={e => handleBusChange(e.target.value)}>
              <option value="">Select</option>
              {buses.map(b => <option key={b.id} value={b.id}>{b.bus_number}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Stop</label>
            <select required value={assignForm.stop_id} onChange={e => setAssignForm(f => ({ ...f, stop_id: e.target.value }))}>
              <option value="">Select</option>
              {availableStops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}><button className="btn btn-success" type="submit">Assign Student</button></div>
        </form>
      </div>
      <div className="card">
        <h3>All Students</h3>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Parent</th><th>Actions</th></tr></thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.id}</td><td><strong>{s.full_name}</strong></td>
                <td>{parents.find(p => p.id === s.parent_id)?.full_name ?? s.parent_id}</td>
                <td><button className="btn btn-danger btn-sm" onClick={async () => { if(confirm('Delete?')) { await deleteStudent(s.id); load() } }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Monitor ───────────────────────────────────────────────────────────────────
function Monitor() {
  const [buses, setBuses] = useState([])
  const [annMsg, setAnnMsg] = useState('')
  const [annSent, setAnnSent] = useState('')

  useEffect(() => {
    getMonitor().then(r => setBuses(r.data))
    const interval = setInterval(() => getMonitor().then(r => setBuses(r.data)), 10000)
    return () => clearInterval(interval)
  }, [])

  const handleAnnouncement = async (e) => {
    e.preventDefault()
    await sendAnnouncement(annMsg)
    setAnnSent('Announcement sent to all parents!'); setAnnMsg('')
  }

  return (
    <div>
      <div className="topbar"><h1>📡 Live Monitor</h1><span style={{ fontSize: '0.8rem', color: '#aaa' }}>Auto-refreshes every 10s</span></div>
      {annSent && <div className="alert alert-success">{annSent}</div>}
      <div className="card">
        <h3>📢 Send Announcement to All Parents</h3>
        <form onSubmit={handleAnnouncement} style={{ display: 'flex', gap: 12 }}>
          <input style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd' }}
            value={annMsg} onChange={e => setAnnMsg(e.target.value)}
            placeholder="e.g. School closes early today at 1 PM" required />
          <button className="btn btn-primary" type="submit">Send</button>
        </form>
      </div>
      <div className="card">
        <h3>Active & Delayed Buses</h3>
        {buses.length === 0 ? <p style={{ color: '#aaa' }}>No active buses.</p> : (
          <table>
            <thead><tr><th>Bus</th><th>Status</th><th>Latitude</th><th>Longitude</th><th>Last Updated</th></tr></thead>
            <tbody>
              {buses.map(b => (
                <tr key={b.bus_id} style={b.status === 'delayed' ? { background: '#fff5f5' } : {}}>
                  <td><strong>{b.bus_number}</strong></td>
                  <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                  <td>{b.latitude?.toFixed(5) ?? '—'}</td>
                  <td>{b.longitude?.toFixed(5) ?? '—'}</td>
                  <td>{b.last_updated ? new Date(b.last_updated).toLocaleTimeString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="buses" element={<Buses />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="students" element={<Students />} />
          <Route path="monitor" element={<Monitor />} />
        </Routes>
      </div>
    </div>
  )
}
