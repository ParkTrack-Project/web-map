import React, { useState, useCallback, useMemo } from "react"
import { MapContainer } from "./components/Map/MapContainer"
import { useMapData } from "./hooks/useMapData"
import type { MapPoint, MapState } from "./types"
import "./App.css"

function App() {
  const [searchQuery, setSearchQuery] = useState("")
  const [mapState, setMapState] = useState<MapState>({
    center: [59.9343, 30.3351], // Saint Petersburg, Russia
    zoom: 12,
  })

  const { points, loading, error, total, searchPoints, refetch } = useMapData({
    autoFetch: true,
    limit: 100,
  })

  // Calculate total free parking spots
  const totalFreeSpots = useMemo(
    () =>
      points.reduce((acc, point) => {
        const freeSpots = point.metadata?.свободно
        if (freeSpots) {
          // Extract number from string like "23 места"
          const match = freeSpots.match(/(\d+)/)
          if (match) {
            return acc + parseInt(match[1], 10)
          }
        }
        return acc
      }, 0),
    [points]
  )

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      await searchPoints(searchQuery)
    },
    [searchQuery, searchPoints]
  )

  const handlePointClick = useCallback((point: MapPoint) => {
    // Update map center to the clicked point
    setMapState((prev) => ({
      ...prev,
      center: [point.coordinates.lat, point.coordinates.lng],
    }))
  }, [])

  const handleMapStateChange = useCallback((newState: MapState) => {
    setMapState(newState)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-10 sm:h-12">
            <div className="flex items-center">
              <h1 className="text-sm sm:text-lg font-bold text-gray-900">
                Парковки СПб
              </h1>
            </div>

            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="flex items-center space-x-2 sm:space-x-4"
            >
              <button
                onClick={refetch}
                className="px-1 sm:px-2 py-1 text-xs sm:text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Обновить
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-4 py-1">
        {/* Map Container */}
        <div className="relative h-[calc(100vh-100px)] w-full">
          <MapContainer
            points={points}
            mapState={mapState}
            onMapStateChange={handleMapStateChange}
            onPointClick={handlePointClick}
            className="w-full h-full"
          />

          {/* Status Bar - Inside Map */}
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-[1000] bg-white/70 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 map-overlay">
            <div className="flex items-center justify-between p-1 sm:p-2 min-w-0">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <span className="text-xs sm:text-sm text-gray-700">
                  {total > 0 ? `${total} парковок` : "Нет парковок"}
                </span>
                {totalFreeSpots > 0 && (
                  <span className="text-xs sm:text-sm font-medium text-green-600">
                    • Свободно: {totalFreeSpots} мест
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
