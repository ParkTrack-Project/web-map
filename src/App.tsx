import React, { useState, useCallback, useMemo } from "react"
import { MapContainer } from "./components/Map/MapContainer"
import { useMapData } from "./hooks/useMapData"
import type { MapState } from "./types"
import type { Zone } from "./types/api"
import "./App.css"

function App() {
  const [mapState, setMapState] = useState<MapState>({
    center: [59.9343, 30.3351],
    zoom: 12,
  })

  const { zones, loading, error, total, refetch } = useMapData({
    autoFetch: true,
  })

  const totalFreeSpots = useMemo(
    () =>
      zones.reduce((acc, zone) => {
        const occupied = zone.occupied as number | undefined
        const capacity = zone.capacity as number
        if (occupied !== undefined) {
          return acc + (capacity - occupied)
        }
        return acc
      }, 0),
    [zones]
  )

  const totalCapacity = useMemo(
    () =>
      zones.reduce((acc, zone) => {
        const capacity = zone.capacity as number
        return acc + capacity
      }, 0),
    [zones]
  )

  const handleZoneClick = useCallback((zone: Zone) => {
    const points = zone.points as { latitude: number; longitude: number }[]
    if (points && points.length > 0) {
      const centerLat =
        points.reduce((sum, p) => sum + p.latitude, 0) / points.length
      const centerLng =
        points.reduce((sum, p) => sum + p.longitude, 0) / points.length

      setMapState((prev) => ({
        ...prev,
        center: [centerLat, centerLng],
      }))
    }
  }, [])

  const handleMapStateChange = useCallback((newState: MapState) => {
    setMapState(newState)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-10 sm:h-12">
            <div className="flex items-center">
              <h1 className="text-sm sm:text-lg font-bold text-gray-900">
                Парковки СПб
              </h1>
            </div>

            <button
              onClick={refetch}
              className="px-1 sm:px-2 py-1 text-xs sm:text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Обновить
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-4 py-1">
        <div className="relative h-[calc(100vh-100px)] w-full">
          <MapContainer
            zones={zones}
            mapState={mapState}
            onMapStateChange={handleMapStateChange}
            onZoneClick={handleZoneClick}
            className="w-full h-full"
          />

          <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-[1000] bg-white/70 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 map-overlay">
            <div className="flex items-center justify-between p-1 sm:p-2 min-w-0">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 flex-wrap gap-1">
                {total > 0 && (
                  <span className="text-xs sm:text-sm text-gray-700">
                    Зон: {total}
                  </span>
                )}
                {totalCapacity > 0 && (
                  <span className="text-xs sm:text-sm text-gray-700">
                    • Вместимость: {totalCapacity}
                  </span>
                )}
                {totalFreeSpots > 0 && (
                  <span className="text-xs sm:text-sm font-medium text-green-600">
                    • Свободно: {totalFreeSpots}
                  </span>
                )}

                {loading !== "idle" && (
                  <div className="flex items-center space-x-1">
                    <div className="animate-spin rounded-full h-2 w-2 sm:h-3 sm:w-3 border-b-2 border-blue-600"></div>
                    <span className="text-xs sm:text-sm text-gray-600">
                      {loading === "loading" ? "Загрузка..." : "Обработка..."}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md px-1 sm:px-2 py-1 flex-shrink-0">
                  <p className="text-xs sm:text-sm text-red-800 whitespace-nowrap">
                    {error.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
