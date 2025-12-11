import { useState, useCallback, useMemo, useEffect } from "react"
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
        const occupied = zone.occupied
        const capacity = zone.capacity
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
        const capacity = zone.capacity
        return acc + capacity
      }, 0),
    [zones]
  )

  const handleZoneClick = useCallback((zone: Zone) => {
    const points = zone.points
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

  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 10000)

    return () => clearInterval(interval)
  }, [refetch])

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="mx-auto">
        <div className="relative h-[calc(100vh)] w-full">
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

                {loading === "loading" && (
                  <div className="flex items-center space-x-1">
                    <div className="animate-spin rounded-full h-2 w-2 sm:h-3 sm:w-3 border-b-2 border-blue-600"></div>
                    <span className="text-xs sm:text-sm text-gray-600">
                      Загрузка...
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
