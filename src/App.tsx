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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Интерактивная карта парковок Санкт-Петербурга
              </h1>
            </div>

            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="flex items-center space-x-4"
            >
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск парковок..."
                  className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Поиск
                </button>
              </div>

              <button
                onClick={refetch}
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Обновить
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {total > 0 ? `${total} парковок` : "Нет парковок"}
            </span>
            {totalFreeSpots > 0 && (
              <span className="text-sm font-medium text-green-600">
                • Свободно: {totalFreeSpots} мест
              </span>
            )}

            {loading !== "idle" && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">
                  {loading === "loading" ? "Загрузка..." : "Обработка..."}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <p className="text-sm text-red-800">{error.message}</p>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="h-[600px] w-full">
          <MapContainer
            points={points}
            mapState={mapState}
            onMapStateChange={handleMapStateChange}
            onPointClick={handlePointClick}
            className="w-full h-full"
          />
        </div>
      </main>
    </div>
  )
}

export default App
