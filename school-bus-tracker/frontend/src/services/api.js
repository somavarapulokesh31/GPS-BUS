import axios from 'axios'

// Same-origin proxy: avoids CORS and works when opened from another device.
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL: BASE_URL })

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const saved = localStorage.getItem('bus_tracker_auth')
  if (saved) {
    const { token } = JSON.parse(saved)
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Auth ──────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const signup = (data) => api.post('/auth/signup', data)

export const getMe = () => api.get('/auth/me')

// ── Admin ─────────────────────────────────────────────────────────────────
export const getStats       = () => api.get('/admin/stats')
export const getMonitor     = () => api.get('/admin/monitor')

export const getBuses       = () => api.get('/admin/buses')
export const createBus      = (d) => api.post('/admin/buses', d)
export const updateBus      = (id, d) => api.put(`/admin/buses/${id}`, d)
export const deleteBus      = (id) => api.delete(`/admin/buses/${id}`)
export const assignDriver   = (busId, driverId) => api.put(`/admin/buses/${busId}/assign-driver`, { driver_id: driverId })

export const getDrivers     = () => api.get('/admin/drivers')
export const createDriver   = (d) => api.post('/admin/drivers', d)
export const updateDriver   = (id, d) => api.put(`/admin/drivers/${id}`, d)
export const deleteDriver   = (id) => api.delete(`/admin/drivers/${id}`)

export const getRoutes      = () => api.get('/admin/routes')
export const createRoute    = (d) => api.post('/admin/routes', d)
export const updateRoute    = (id, d) => api.put(`/admin/routes/${id}`, d)
export const deleteRoute    = (id) => api.delete(`/admin/routes/${id}`)
export const addStop        = (routeId, d) => api.post(`/admin/routes/${routeId}/stops`, d)
export const updateStop     = (routeId, stopId, d) => api.put(`/admin/routes/${routeId}/stops/${stopId}`, d)
export const deleteStop     = (routeId, stopId) => api.delete(`/admin/routes/${routeId}/stops/${stopId}`)

export const getParents     = () => api.get('/admin/parents')
export const createParent   = (d) => api.post('/admin/parents', d)

export const getStudents    = () => api.get('/admin/students')
export const createStudent  = (d) => api.post('/admin/students', d)
export const updateStudent  = (id, d) => api.put(`/admin/students/${id}`, d)
export const deleteStudent  = (id) => api.delete(`/admin/students/${id}`)
export const assignStudent  = (d) => api.post('/admin/students/assign', d)

export const sendAnnouncement = (message) => api.post('/admin/announcements', { message })

// ── Driver ────────────────────────────────────────────────────────────────
export const getDriverMe    = () => api.get('/driver/me')
export const startTrip      = () => api.post('/driver/trips/start')
export const endTrip        = () => api.post('/driver/trips/end')
export const reportDelay    = (description) => api.post('/driver/report-delay', { description })

// ── Parent ────────────────────────────────────────────────────────────────
export const getParentBus           = () => api.get('/parent/bus')
export const getNotifications       = () => api.get('/parent/notifications')
export const markNotifRead          = (id) => api.put(`/parent/notifications/${id}/read`)
export const markAllNotifsRead      = () => api.put('/parent/notifications/read-all')

export default api
