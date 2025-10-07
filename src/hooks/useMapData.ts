import { useState, useEffect, useCallback } from "react"
import type {
  MapPoint,
  MapPointsResponse,
  LoadingState,
  MapError,
} from "../types"
import {
  fetchMapPoints,
  fetchMapPointById,
  searchMapPoints,
} from "../services/mapApi"

interface UseMapDataReturn {
  points: MapPoint[]
  loading: LoadingState
  error: MapError | null
  total: number
  refetch: () => Promise<void>
  searchPoints: (query: string) => Promise<void>
  getPointById: (id: string) => Promise<MapPoint | null>
}

interface UseMapDataOptions {
  page?: number
  limit?: number
  autoFetch?: boolean
}

/**
 * Custom hook for managing map data with loading states and error handling
 */
export const useMapData = (
  options: UseMapDataOptions = {}
): UseMapDataReturn => {
  const { page = 1, limit = 50, autoFetch = true } = options

  const [points, setPoints] = useState<MapPoint[]>([])
  const [loading, setLoading] = useState<LoadingState>("idle")
  const [error, setError] = useState<MapError | null>(null)
  const [total, setTotal] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading("loading")
    setError(null)

    try {
      const response: MapPointsResponse = await fetchMapPoints(page, limit)
      setPoints(response.points)
      setTotal(response.total)
      setLoading("success")
    } catch (err) {
      const mapError: MapError =
        err instanceof Error
          ? { message: err.message, code: "FETCH_ERROR" }
          : { message: "An unknown error occurred", code: "UNKNOWN_ERROR" }

      setError(mapError)
      setLoading("error")
    }
  }, [page, limit])

  const searchPoints = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        // If search query is empty, refetch all points
        await fetchData()
        return
      }

      setLoading("loading")
      setError(null)

      try {
        const searchResults = await searchMapPoints(query, limit)
        setPoints(searchResults)
        setTotal(searchResults.length)
        setLoading("success")
      } catch (err) {
        const mapError: MapError =
          err instanceof Error
            ? { message: err.message, code: "SEARCH_ERROR" }
            : { message: "Search failed", code: "SEARCH_ERROR" }

        setError(mapError)
        setLoading("error")
      }
    },
    [limit, fetchData]
  )

  const getPointById = useCallback(
    async (id: string): Promise<MapPoint | null> => {
      try {
        return await fetchMapPointById(id)
      } catch (err) {
        const mapError: MapError =
          err instanceof Error
            ? { message: err.message, code: "FETCH_POINT_ERROR" }
            : { message: "Failed to fetch point", code: "FETCH_POINT_ERROR" }

        setError(mapError)
        return null
      }
    },
    []
  )

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [fetchData, autoFetch])

  return {
    points,
    loading,
    error,
    total,
    refetch,
    searchPoints,
    getPointById,
  }
}
