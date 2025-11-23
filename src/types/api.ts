export interface Point {
  latitude: number
  longitude: number
  x: number
  y: number
}

export type ZonePoint = Point

export interface CreateCamera {
  title: string
  source: string
  image_width: number
  image_height: number
  calib: unknown
  latitude: number
  longitude: number
}

export interface CreateZone {
  camera_id: number
  zone_type: string
  capacity: number
  pay: number
  points: Point[]
}

export interface Zone {
  zone_id: number
  points: Point[]
  zone_type: string
  capacity: number
  pay: number
  occupied?: number
  confidence?: number
  camera_id?: number
}

export interface GetZonesParams {
  camera_id?: number
  min_free_count?: number
  max_pay?: number
}

export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface HTTPValidationError {
  detail: ValidationError[]
}

export interface ApiError {
  message: string
  code?: string
}
