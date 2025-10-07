export interface MapPoint {
  id: string
  name: string
  coordinates: {
    lat: number
    lng: number
  }
  description?: string
  category?: string
  metadata?: Record<string, string | number | boolean>
}

export interface MapPointsResponse {
  points: MapPoint[]
  total: number
  page?: number
  limit?: number
}

export interface MapState {
  center: [number, number]
  zoom: number
}

export interface MapError {
  message: string
  code?: string
}

export type LoadingState = "idle" | "loading" | "success" | "error"
