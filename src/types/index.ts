export interface MapState {
  center: [number, number]
  zoom: number
}

export interface MapError {
  message: string
  code?: string
}

export type LoadingState = "idle" | "loading" | "success" | "error"

export * from "./api"
