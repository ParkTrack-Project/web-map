import { useState, useEffect, useCallback } from "react"
import type { LoadingState, MapError, GetZonesParams } from "../types"
import type { Zone } from "../types/api"
import { fetchZones } from "../services/mapApi"

interface UseMapDataReturn {
  zones: Zone[]
  loading: LoadingState
  error: MapError | null
  total: number
  refetch: () => Promise<void>
}

interface UseMapDataOptions {
  autoFetch?: boolean
  zoneParams?: GetZonesParams
}

export const useMapData = (
  options: UseMapDataOptions = {}
): UseMapDataReturn => {
  const { autoFetch = true, zoneParams } = options

  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState<LoadingState>("idle")
  const [error, setError] = useState<MapError | null>(null)
  const [total, setTotal] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading("loading")
    setError(null)

    try {
      const zonesData = await fetchZones(zoneParams)
      setZones(zonesData)
      setTotal(zonesData.length)
      setLoading("success")
    } catch (err) {
      const mapError: MapError =
        err instanceof Error
          ? { message: err.message, code: "FETCH_ERROR" }
          : { message: "An unknown error occurred", code: "UNKNOWN_ERROR" }

      setError(mapError)
      setLoading("error")
    }
  }, [zoneParams])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [fetchData, autoFetch])

  return {
    zones,
    loading,
    error,
    total,
    refetch,
  }
}
