import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet default icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const busIcon = L.divIcon({
  html: '<div style="font-size:28px;line-height:1;">🚌</div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const stopIcon = L.divIcon({
  html: '<div style="width:12px;height:12px;background:#2980b9;border:2px solid #fff;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>',
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

const myStopIcon = L.divIcon({
  html: '<div style="width:16px;height:16px;background:#f0c040;border:3px solid #1a1a2e;border-radius:50%;box-shadow:0 0 6px rgba(240,192,64,0.8);"></div>',
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

// Component to smoothly pan map to bus location
function MapPanner({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.panTo(center, { animate: true, duration: 1 })
  }, [center, map])
  return null
}

/**
 * LiveMap component
 * Props:
 *   busLocation: { latitude, longitude } | null
 *   stops: [{ id, name, latitude, longitude }]
 *   assignedStopId: number | null  (parent's stop)
 *   etaStops: [{ stop_id, stop_name, eta_minutes, eta_time }]
 *   center: [lat, lng]  initial center
 */
export default function LiveMap({ busLocation, stops = [], assignedStopId, etaStops = [], center = [20.5937, 78.9629] }) {
  const routePositions = stops.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)])

  const mapCenter = busLocation
    ? [parseFloat(busLocation.latitude), parseFloat(busLocation.longitude)]
    : (stops.length > 0 ? [parseFloat(stops[0].latitude), parseFloat(stops[0].longitude)] : center)

  return (
    <div className="map-wrapper">
      <MapContainer center={mapCenter} zoom={14} style={{ height: '460px', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route polyline */}
        {routePositions.length > 1 && (
          <Polyline positions={routePositions} color="#2980b9" weight={3} dashArray="6,4" />
        )}

        {/* Bus stops */}
        {stops.map(stop => {
          const isMyStop = stop.id === assignedStopId
          const eta = etaStops.find(e => e.stop_id === stop.id)
          return (
            <Marker
              key={stop.id}
              position={[parseFloat(stop.latitude), parseFloat(stop.longitude)]}
              icon={isMyStop ? myStopIcon : stopIcon}
            >
              <Popup>
                <strong>{stop.name}</strong>
                {isMyStop && <div style={{ color: '#f0c040', fontWeight: 600 }}>⭐ Your Stop</div>}
                {eta && <div>ETA: <strong>{eta.eta_minutes} min</strong> ({eta.eta_time})</div>}
              </Popup>
            </Marker>
          )
        })}

        {/* Live bus marker */}
        {busLocation && (
          <>
            <MapPanner center={[parseFloat(busLocation.latitude), parseFloat(busLocation.longitude)]} />
            <Marker
              position={[parseFloat(busLocation.latitude), parseFloat(busLocation.longitude)]}
              icon={busIcon}
            >
              <Popup>
                <strong>🚌 Bus Location</strong><br />
                Speed: {busLocation.speed ? `${busLocation.speed} km/h` : 'N/A'}
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  )
}
