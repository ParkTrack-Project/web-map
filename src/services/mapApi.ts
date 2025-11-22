import { zonesApi } from "./zonesApi"
import type { Zone, GetZonesParams } from "../types/api"
import type { MapError } from "../types"

export const fetchZones = async (params?: GetZonesParams): Promise<Zone[]> => {
  try {
    return await zonesApi.getAll(params)
  } catch (error) {
    const mapError: MapError = {
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
      code: "API_ERROR",
    }
    throw mapError
  }
}

export const fetchZoneById = async (zoneId: number): Promise<Zone | null> => {
  try {
    return await zonesApi.getById(zoneId)
  } catch (error) {
    const mapError: MapError = {
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
      code: "API_ERROR",
    }
    throw mapError
  }
}
