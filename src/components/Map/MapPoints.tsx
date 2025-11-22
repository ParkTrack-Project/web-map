import React from "react"
import { Marker, Popup, Polygon, Polyline } from "react-leaflet"
import L from "leaflet"
import type { Zone, Point } from "../../types/api"

const getIconColor = (
  freeSpots: number | undefined
): { fill: string; stroke: string } => {
  if (freeSpots === undefined || freeSpots === 0) {
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
  if (points.length !== 4) return []

  const [p0, p1, p2] = points

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

const getZonePolygonColor = (
  zoneType?: string,
  occupied?: number,
  capacity?: number
) => {
  if (zoneType === "parallel") {
    return "#3B82F6"
  }

  if (occupied !== undefined && capacity !== undefined) {
    const occupancyRate = capacity > 0 ? occupied / capacity : 0
    if (occupancyRate >= 0.9) return "#EF4444"
    if (occupancyRate >= 0.7) return "#F59E0B"
    return "#10B981"
  }

  return "#10B981"
}

export const MapPoints: React.FC<MapPointsProps> = ({ zones, onZoneClick }) => {
  return (
    <>
      {zones.map((zone) => {
        const zoneId = zone.zone_id as number
        const points = zone.points as Point[]
        const zoneType = zone.zone_type as string
        const occupied = zone.occupied as number | undefined
        const capacity = zone.capacity as number
        const pay = zone.pay as number
        const confidence = zone.confidence as number | undefined
        const cameraId = zone.camera_id as number | undefined

        const fillColor = getZonePolygonColor(zoneType, occupied, capacity)
        const freeSpots =
          occupied !== undefined ? capacity - occupied : undefined

        const centerLat =
          points.reduce((sum, p) => sum + p.latitude, 0) / points.length
        const centerLng =
          points.reduce((sum, p) => sum + p.longitude, 0) / points.length

        const popupContent = (
          <div className="map-popup min-w-[200px]">
            <h3 className="font-semibold text-gray-800 mb-2">Зона {zoneId}</h3>

            {zoneType && (
              <div className="mb-2">
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    zoneType === "parallel"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {zoneType === "parallel" ? "Параллельная" : "Стандартная"}
                </span>
              </div>
            )}

            {capacity !== undefined && (
              <div className="mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Вместимость:
                </span>{" "}
                <span className="text-sm text-gray-900">{capacity}</span>
              </div>
            )}

            {occupied !== undefined && (
              <div className="mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Занято:
                </span>{" "}
                <span className="text-sm text-gray-900">{occupied}</span>
              </div>
            )}

            {freeSpots !== undefined && (
              <div className="mb-2">
                <span className="text-sm font-medium text-green-600">
                  Свободно:
                </span>{" "}
                <span className="text-sm font-semibold text-green-700">
                  {freeSpots}
                </span>
              </div>
            )}

            {pay !== undefined && (
              <div className="mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Оплата:
                </span>{" "}
                <span className="text-sm text-gray-900">
                  {pay != null && (pay === 0 ? "Бесплатно" : `${pay} руб`)}
                </span>
              </div>
            )}

            {confidence !== undefined && (
              <div className="mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Уверенность:
                </span>{" "}
                <span className="text-sm text-gray-900">
                  {(Number(confidence) * 100).toFixed(1)}%
                </span>
              </div>
            )}

            {cameraId !== undefined && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  Камера ID: {String(cameraId)}
                </span>
              </div>
            )}
          </div>
        )

        if (zoneType === "parallel" && points && points.length === 4) {
          const centerLine = calculateCenterLine(points)

          return (
            <React.Fragment key={zoneId}>
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

        const polygonPoints =
          points && points.length === 4
            ? points.map((p) => [p.latitude, p.longitude] as [number, number])
            : null

        return (
          <React.Fragment key={zoneId}>
            {polygonPoints && (
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
      })}
    </>
  )
}
