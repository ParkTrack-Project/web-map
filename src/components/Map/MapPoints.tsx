import React from "react"
import { Marker, Popup } from "react-leaflet"
import L from "leaflet"
import type { MapPoint } from "../../types"

// Custom marker icons for different parking categories
const createCategoryIcon = (category?: string) => {
  const iconUrl = (() => {
    switch (category) {
      case "underground":
        return (
          "data:image/svg+xml;base64," +
          btoa(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" rx="2" fill="#3B82F6" stroke="#1E40AF" stroke-width="2"/>
            <path d="M8 8h8v8H8z" fill="#1E40AF"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-size="8">P</text>
          </svg>
        `)
        )
      case "street":
        return (
          "data:image/svg+xml;base64," +
          btoa(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="#10B981" stroke="#059669" stroke-width="2"/>
            <path d="M10 10h4v4h-4z" fill="#059669"/>
            <text x="12" y="15" text-anchor="middle" fill="white" font-size="8">P</text>
          </svg>
        `)
        )
      case "mall":
        return (
          "data:image/svg+xml;base64," +
          btoa(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" rx="2" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
            <path d="M8 8h8v8H8z" fill="#D97706"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-size="8">P</text>
          </svg>
        `)
        )
      case "airport":
        return (
          "data:image/svg+xml;base64," +
          btoa(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" rx="2" fill="#EF4444" stroke="#DC2626" stroke-width="2"/>
            <path d="M8 8h8v8H8z" fill="#DC2626"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-size="8">P</text>
          </svg>
        `)
        )
      case "park":
        return (
          "data:image/svg+xml;base64," +
          btoa(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="#10B981" stroke="#059669" stroke-width="2"/>
            <path d="M10 10h4v4h-4z" fill="#059669"/>
            <text x="12" y="15" text-anchor="middle" fill="white" font-size="8">P</text>
          </svg>
        `)
        )
      case "station":
        return (
          "data:image/svg+xml;base64," +
          btoa(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" rx="2" fill="#8B5CF6" stroke="#7C3AED" stroke-width="2"/>
            <path d="M8 8h8v8H8z" fill="#7C3AED"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-size="8">P</text>
          </svg>
        `)
        )
      case "tourist":
        return (
          "data:image/svg+xml;base64," +
          btoa(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
            <path d="M10 10h4v4h-4z" fill="#D97706"/>
            <text x="12" y="15" text-anchor="middle" fill="white" font-size="8">P</text>
          </svg>
        `)
        )
      case "office":
        return (
          "data:image/svg+xml;base64," +
          btoa(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" rx="2" fill="#6B7280" stroke="#4B5563" stroke-width="2"/>
            <path d="M8 8h8v8H8z" fill="#4B5563"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-size="8">P</text>
          </svg>
        `)
        )
      case "municipal":
        return (
          "data:image/svg+xml;base64," +
          btoa(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="#3B82F6" stroke="#1E40AF" stroke-width="2"/>
            <path d="M10 10h4v4h-4z" fill="#1E40AF"/>
            <text x="12" y="15" text-anchor="middle" fill="white" font-size="8">P</text>
          </svg>
        `)
        )
      default:
        return (
          "data:image/svg+xml;base64," +
          btoa(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#6B7280"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-size="8">P</text>
          </svg>
        `)
        )
    }
  })()

  return new L.Icon({
    iconUrl,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

interface MapPointsProps {
  points: MapPoint[]
  onPointClick?: (point: MapPoint) => void
}

/**
 * Component to render map points as markers with popups
 */
export const MapPoints: React.FC<MapPointsProps> = ({
  points,
  onPointClick,
}) => {
  return (
    <>
      {points.map((point) => (
        <Marker
          key={point.id}
          position={[point.coordinates.lat, point.coordinates.lng]}
          icon={createCategoryIcon(point.category)}
          eventHandlers={{
            click: () => onPointClick?.(point),
          }}
        >
          <Popup>
            <div className="map-popup">
              <h3 className="font-semibold text-gray-800 mb-1">{point.name}</h3>
              {point.metadata?.свободно && (
                <p className="text-sm font-medium text-green-600 mb-2">
                  Свободно: {point.metadata.свободно}
                </p>
              )}
              {point.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {point.description}
                </p>
              )}
              {point.category && (
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    point.category === "underground"
                      ? "bg-blue-100 text-blue-800"
                      : point.category === "street"
                      ? "bg-green-100 text-green-800"
                      : point.category === "mall"
                      ? "bg-yellow-100 text-yellow-800"
                      : point.category === "airport"
                      ? "bg-red-100 text-red-800"
                      : point.category === "park"
                      ? "bg-teal-100 text-teal-800"
                      : point.category === "station"
                      ? "bg-purple-100 text-purple-800"
                      : point.category === "tourist"
                      ? "bg-orange-100 text-orange-800"
                      : point.category === "office"
                      ? "bg-gray-100 text-gray-800"
                      : point.category === "municipal"
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {point.category === "underground"
                    ? "Подземная"
                    : point.category === "street"
                    ? "Уличная"
                    : point.category === "mall"
                    ? "Торговый центр"
                    : point.category === "airport"
                    ? "Аэропорт"
                    : point.category === "park"
                    ? "Парк"
                    : point.category === "station"
                    ? "Вокзал"
                    : point.category === "tourist"
                    ? "Туристическая"
                    : point.category === "office"
                    ? "Офис"
                    : point.category === "municipal"
                    ? "Муниципальная"
                    : point.category}
                </span>
              )}
              {point.metadata && Object.keys(point.metadata).length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  {Object.entries(point.metadata).map(([key, value]) => (
                    <div key={key} className="text-xs text-gray-500">
                      <span className="font-medium">
                        {key === "вместимость"
                          ? "Вместимость"
                          : key === "свободно"
                          ? "Свободно"
                          : key === "тариф"
                          ? "Тариф"
                          : key === "охрана"
                          ? "Охрана"
                          : key === "зона"
                          ? "Зона"
                          : key === "бесплатно"
                          ? "Бесплатно"
                          : key === "этажей"
                          ? "Этажей"
                          : key === "долгосрочная"
                          ? "Долгосрочная"
                          : key === "время"
                          ? "Время"
                          : key === "камеры"
                          ? "Камеры"
                          : key === "сезон"
                          ? "Сезон"
                          : key === "пропуск"
                          ? "Пропуск"
                          : key === "оплата"
                          ? "Оплата"
                          : key}
                        :
                      </span>{" "}
                      {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
