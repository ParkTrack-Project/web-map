import React from "react"
import { Marker, Popup, Polygon, Polyline } from "react-leaflet"
import L from "leaflet"
import type { Zone, Point } from "../../types/api"

const getIconColor = (
  freeSpots: number | undefined
): { fill: string; stroke: string } => {
  if (freeSpots === undefined || freeSpots <= 0) {
    return { fill: "#EF4444", stroke: "#DC2626" }
  }
  if (freeSpots === 1) {
    return { fill: "#F59E0B", stroke: "#D97706" }
  }
  return { fill: "#10B981", stroke: "#059669" }
}

const createZoneIcon = (freeSpots: number | undefined) => {
  const colors = getIconColor(freeSpots)
  const iconUrl =
    "data:image/svg+xml;base64," +
    btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" rx="2" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="2"/>
      <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">P</text>
    </svg>
  `)

  return new L.Icon({
    iconUrl,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

const calculateCenterLine = (points: Point[]): [number, number][] => {
  if (!points || points.length !== 4) return []

  const [p0, p1, p2] = points

  if (!p0 || !p1 || !p2) return []

  const dist1 = Math.sqrt(
    Math.pow(p1.latitude - p0.latitude, 2) +
      Math.pow(p1.longitude - p0.longitude, 2)
  )
  const dist2 = Math.sqrt(
    Math.pow(p2.latitude - p1.latitude, 2) +
      Math.pow(p2.longitude - p1.longitude, 2)
  )

  if (dist1 > dist2) {
    return [
      [p0.latitude, p0.longitude],
      [p1.latitude, p1.longitude],
    ]
  } else {
    return [
      [p1.latitude, p1.longitude],
      [p2.latitude, p2.longitude],
    ]
  }
}

interface MapPointsProps {
  zones: Zone[]
  onZoneClick?: (zone: Zone) => void
}

const getZonePolygonColor = (freeSpots: number | undefined): string => {
  if (freeSpots === undefined || freeSpots <= 0) {
    return "#EF4444"
  }
  if (freeSpots === 1) {
    return "#F59E0B"
  }
  return "#10B981"
}

const isValidPoint = (point: Point): boolean => {
  return (
    point != null &&
    typeof point.latitude === "number" &&
    typeof point.longitude === "number" &&
    !isNaN(point.latitude) &&
    !isNaN(point.longitude)
  )
}

const validateZone = (zone: Zone): boolean => {
  if (!zone.points || !Array.isArray(zone.points) || zone.points.length !== 4) {
    return false
  }

  return zone.points.every(isValidPoint)
}

export const MapPoints: React.FC<MapPointsProps> = ({ zones, onZoneClick }) => {
  return (
    <>
      {zones.map((zone) => {
        try {
          if (!validateZone(zone)) {
            return null
          }

          const freeSpots =
            zone.occupied != null && zone.occupied !== undefined
              ? zone.capacity - zone.occupied
              : undefined
          const fillColor = getZonePolygonColor(freeSpots)

          const centerLat =
            zone.points.reduce((sum, p) => sum + p.latitude, 0) /
            zone.points.length
          const centerLng =
            zone.points.reduce((sum, p) => sum + p.longitude, 0) /
            zone.points.length

          if (isNaN(centerLat) || isNaN(centerLng)) {
            return null
          }

          const popupContent = (
            <div className="map-popup min-w-[200px]">
              <h3 className="font-semibold text-gray-800 mb-2">
                Парковка {zone.zone_id}
              </h3>

              {zone.zone_type && (
                <div className="mb-2">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      zone.zone_type === "parallel"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {zone.zone_type === "parallel"
                      ? "Параллельная"
                      : "Стандартная"}
                  </span>
                </div>
              )}

              {zone.capacity !== undefined && (
                <div className="mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Вместимость:
                  </span>{" "}
                  <span className="text-sm text-gray-900">{zone.capacity}</span>
                </div>
              )}

              {zone.occupied != null && zone.occupied !== undefined && (
                <div className="mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Занято:
                  </span>{" "}
                  <span className="text-sm text-gray-900">{zone.occupied}</span>
                </div>
              )}

              {freeSpots !== undefined && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-green-600">
                    Свободно:
                  </span>{" "}
                  <span className="text-sm font-semibold text-green-700">
                    {Math.max(freeSpots, 0)}
                  </span>
                </div>
              )}

              {zone.pay !== undefined && (
                <div className="mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Оплата:
                  </span>{" "}
                  <span className="text-sm text-gray-900">
                    {zone.pay != null &&
                      (zone.pay === 0 ? "Бесплатно" : `${zone.pay} руб`)}
                  </span>
                </div>
              )}

              {zone.confidence !== undefined && (
                <div className="mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Уверенность:
                  </span>{" "}
                  <span className="text-sm text-gray-900">
                    {(Number(zone.confidence) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )

          if (zone.zone_type === "parallel" && zone.points.length === 4) {
            const centerLine = calculateCenterLine(zone.points)

            return (
              <React.Fragment key={zone.zone_id}>
                {centerLine.length === 2 && (
                  <Polyline
                    positions={centerLine}
                    pathOptions={{
                      color: fillColor,
                      weight: 10,
                      opacity: 1.0,
                      lineCap: "round",
                      lineJoin: "round",
                    }}
                    eventHandlers={{
                      click: () => onZoneClick?.(zone),
                    }}
                  >
                    <Popup>{popupContent}</Popup>
                  </Polyline>
                )}
                <Marker
                  position={[centerLat, centerLng]}
                  icon={createZoneIcon(freeSpots)}
                  eventHandlers={{
                    click: () => onZoneClick?.(zone),
                  }}
                >
                  <Popup>{popupContent}</Popup>
                </Marker>
              </React.Fragment>
            )
          }

          const polygonPoints = zone.points.map(
            (p) => [p.latitude, p.longitude] as [number, number]
          )

          return (
            <React.Fragment key={zone.zone_id}>
              <Polygon
                positions={polygonPoints}
                pathOptions={{
                  color: fillColor,
                  fillColor,
                  fillOpacity: 0.3,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => onZoneClick?.(zone),
                }}
              >
                <Popup>{popupContent}</Popup>
              </Polygon>
              <Marker
                position={[centerLat, centerLng]}
                icon={createZoneIcon(freeSpots)}
                eventHandlers={{
                  click: () => onZoneClick?.(zone),
                }}
              >
                <Popup>{popupContent}</Popup>
              </Marker>
            </React.Fragment>
          )
        } catch (error) {
          console.warn(`Failed to render zone ${zone.zone_id}:`, error)
          return null
        }
      })}
    </>
  )
}
