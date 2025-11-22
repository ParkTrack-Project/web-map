import { apiClient } from "../config/api"
import type { Zone, GetZonesParams } from "../types/api"

export const zonesApi = {
  getAll: async (params?: GetZonesParams): Promise<Zone[]> => {
    const response = await apiClient.get<Zone[]>("/zones", { params })
    return response.data
  },

  getById: async (zoneId: number): Promise<Zone> => {
    const response = await apiClient.get<Zone>(`/zones/${zoneId}`)
    return response.data
  },

  getByCameraId: async (cameraId: number): Promise<Zone[]> => {
    const response = await apiClient.get<Zone[]>("/zones", {
      params: { camera_id: cameraId },
    })
    return response.data
  },
}

