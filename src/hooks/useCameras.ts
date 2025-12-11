import { useState, useEffect, useCallback } from "react"
import type { LoadingState, MapError } from "../types"
import type { Camera, GetCamerasParams } from "../types/api"
import { camerasApi } from "../services/camerasApi"

interface UseCamerasReturn {
  cameras: Camera[]
  loading: LoadingState
  error: MapError | null
  refetch: () => Promise<void>
}

interface UseCamerasOptions {
  autoFetch?: boolean
  cameraParams?: GetCamerasParams
}

export const useCameras = (
  options: UseCamerasOptions = {}
): UseCamerasReturn => {
  const { autoFetch = true, cameraParams } = options

  const [cameras, setCameras] = useState<Camera[]>([])
  const [loading, setLoading] = useState<LoadingState>("idle")
  const [error, setError] = useState<MapError | null>(null)

  const fetchData = useCallback(async () => {
    setLoading("loading")
    setError(null)

    try {
      const camerasData = await camerasApi.getAll(cameraParams)
      setCameras(camerasData)
      setLoading("success")
    } catch (err) {
      const mapError: MapError =
        err instanceof Error
          ? { message: err.message, code: "FETCH_ERROR" }
          : { message: "An unknown error occurred", code: "UNKNOWN_ERROR" }

      setError(mapError)
      setLoading("error")
    }
  }, [cameraParams])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [fetchData, autoFetch])

  return {
    cameras,
    loading,
    error,
    refetch,
  }
}
