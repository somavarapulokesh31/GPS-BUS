const browserWsOrigin = typeof window === 'undefined'
  ? 'ws://localhost:8000'
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
const WS_URL = import.meta.env.VITE_WS_URL || `${browserWsOrigin}/api`

/**
 * Subscribe to live bus location updates.
 * @param {number} busId
 * @param {string} token - JWT token
 * @param {function} onMessage - callback(data: object)
 * @returns {WebSocket}
 */
export function subscribeToBus(busId, token, onMessage) {
  const ws = new WebSocket(`${WS_URL}/ws/bus/${busId}?token=${token}`)

  ws.onopen = () => console.log(`[WS] Connected to bus ${busId}`)
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (e) {
      console.error('[WS] Parse error', e)
    }
  }
  ws.onerror = (e) => console.error('[WS] Error', e)
  ws.onclose = () => console.log(`[WS] Disconnected from bus ${busId}`)

  return ws
}

/**
 * Connect as driver to send GPS updates.
 * @param {string} token - JWT token
 * @param {function} onMessage - callback for server messages
 * @returns {WebSocket}
 */
export function connectDriverWS(token, onMessage) {
  const ws = new WebSocket(`${WS_URL}/ws/driver?token=${token}`)

  ws.onopen = () => console.log('[WS] Driver connected')
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (e) {}
  }
  ws.onerror = (e) => console.error('[WS] Driver error', e)
  ws.onclose = () => console.log('[WS] Driver disconnected')

  return ws
}

/**
 * Send a GPS update through an open driver WebSocket.
 */
export function sendGPSUpdate(ws, tripId, busId, latitude, longitude, speed) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'gps_update',
      trip_id: tripId,
      bus_id: busId,
      latitude,
      longitude,
      speed: speed || 30,
    }))
  }
}
