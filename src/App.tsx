import { useState, useCallback, useMemo, useEffect } from "react"
import { MapContainer } from "./components/Map/MapContainer"
import { useMapData } from "./hooks/useMapData"
import { useCameras } from "./hooks/useCameras"
import {
  FreeSpotsFilter,
  CameraSelector,
  type FreeSpotFilterValue,
} from "./components/Filters"
import type { MapState } from "./types"
import type { Zone, Camera } from "./types/api"
import "./App.css"

function App() {
  const [mapState, setMapState] = useState<MapState>({
    center: [59.9343, 30.3351],
    zoom: 12,
  })

  const [freeSpotFilter, setFreeSpotFilter] =
    useState<FreeSpotFilterValue>("all")
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null)
  const [filtersVisible, setFiltersVisible] = useState(false)

  const { zones, loading, error, total, refetch } = useMapData({
    autoFetch: true,
  })

  const { cameras } = useCameras({
    autoFetch: true,
  })

  const filteredZones = useMemo(() => {
    return zones.filter((zone) => {
      const freeSpots =
        zone.occupied !== undefined ? zone.capacity - zone.occupied : 0

      switch (freeSpotFilter) {
        case "available":
          return freeSpots >= 1
        case "all":
        default:
          return true
      }
    })
  }, [zones, freeSpotFilter])

  const totalFreeSpots = useMemo(
    () =>
      filteredZones.reduce((acc, zone) => {
        const occupied = zone.occupied
        const capacity = zone.capacity
        if (occupied !== undefined) {
          return acc + (capacity - occupied)
        }
        return acc
      }, 0),
    [filteredZones]
  )

  const totalCapacity = useMemo(
    () =>
      filteredZones.reduce((acc, zone) => {
        const capacity = zone.capacity
        return acc + capacity
      }, 0),
    [filteredZones]
  )

  const focusOnZone = useCallback((zone: Zone) => {
    const points = zone.points
    if (points && points.length > 0) {
      const centerLat =
        points.reduce((sum, p) => sum + p.latitude, 0) / points.length
      const centerLng =
        points.reduce((sum, p) => sum + p.longitude, 0) / points.length

      setMapState((prev) => ({
        center: [centerLat, centerLng],
        zoom: Math.max(prev.zoom, 18),
      }))
    }
  }, [])

  const handleZoneClick = useCallback(
    (zone: Zone) => {
      focusOnZone(zone)
    },
    [focusOnZone]
  )

  const handleCameraSelect = useCallback((camera: Camera | null) => {
    if (camera) {
      setSelectedCameraId(camera.camera_id)
      setMapState({
        center: [camera.latitude, camera.longitude],
        zoom: 18,
      })
    } else {
      setSelectedCameraId(null)
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
            zones={filteredZones}
            mapState={mapState}
            onMapStateChange={handleMapStateChange}
            onZoneClick={handleZoneClick}
            className="w-full h-full"
          />

          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="absolute top-20 left-2 sm:top-20 sm:left-4 z-[1001] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-2 hover:bg-white transition-colors"
            aria-label="Toggle filters"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-700"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {filtersVisible && (
            <div className="absolute top-2 left-16 right-2 sm:top-4 sm:left-16 sm:right-auto sm:max-w-md z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
              <div className="p-3 sm:p-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                      Фильтр по свободным местам
                    </h3>
                    <FreeSpotsFilter
                      value={freeSpotFilter}
                      onChange={setFreeSpotFilter}
                    />
                  </div>
                  <CameraSelector
                    cameras={cameras}
                    selectedCameraId={selectedCameraId}
                    onCameraSelect={handleCameraSelect}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-[1000] bg-white/70 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 map-overlay">
            <div className="flex items-center justify-between p-1 sm:p-2 min-w-0">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 flex-wrap gap-1">
                {total > 0 && (
                  <span className="text-xs sm:text-sm text-gray-700">
                    Зон: {filteredZones.length}/{total}
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
